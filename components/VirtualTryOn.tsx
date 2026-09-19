"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
} from "react";
import { Camera, Download, Smartphone, X } from "lucide-react";

type Flash = { id: string; label: string; url: string };
type Facing = "user" | "environment";
type Region = "arm" | "face";

// These need to be actual flash-sheet artwork on a flat card — a photo of
// an existing tattoo inked on someone's skin has no clean background to key
// out (it's all skin, hair, clothing), so it can never read as a stencil
// once overlaid. Picked for a genuinely flat, consistent backdrop.
const DEFAULT_FLASH: Flash[] = [
  {
    id: "1",
    label: "Script",
    url: "https://images.unsplash.com/photo-1725918128612-6021dbe24add?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "2",
    label: "Art Nouveau",
    url: "https://images.unsplash.com/photo-1722715917774-3982544ff6fc?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "3",
    label: "Botanical",
    url: "https://images.unsplash.com/photo-1722715917840-e5bcbee4a3b4?auto=format&fit=crop&w=500&q=80",
  },
];

type BodyPose = {
  cx: number;
  cy: number;
  angle: number;
  length: number; 
  visible: boolean;
};

// MULTI-MODEL AI PIPELINE
const MODELS = {
  arm: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  face: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  // Segments a photo into background / hair / body-skin / face-skin /
  // clothes / other. Used to strip a candid tattoo photo's surroundings
  // (a wall, a floor, clothing) before background-color keying — Apache-2.0,
  // same vendor as the trackers above, no new dependency.
  segmenter:
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite",
};
const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";

// selfie_multiclass_256x256 category indices.
const SEGMENT_CATEGORY = { background: 0, hair: 1, bodySkin: 2, faceSkin: 3, clothes: 4, other: 5 };

function diffAngle(target: number, current: number) {
  return ((((target - current) % 360) + 540) % 360) - 180;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function drawToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Uses MediaPipe's selfie-multiclass segmenter to drop everything in a
// candid tattoo photo that isn't skin (walls, floors, clothes, hair),
// mutating the canvas's alpha channel in place. Best-effort: any failure
// (model still loading, decode error) just leaves the canvas untouched.
function applySkinSegmentation(canvas: HTMLCanvasElement, segmenter: any) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const result = segmenter.segment(canvas);
  try {
    const mask = result.categoryMask;
    if (!mask) return;
    const categories = mask.getAsUint8Array();
    const maskW = mask.width, maskH = mask.height;

    // A flash-sheet illustration (no photographed person in it at all) will
    // read as "no skin detected anywhere" — trusting the mask in that case
    // would wipe the entire design to transparent. Only apply it once
    // there's a real, sizeable skin region to work with.
    let skinPixels = 0;
    for (let i = 0; i < categories.length; i++) {
      if (categories[i] === SEGMENT_CATEGORY.bodySkin || categories[i] === SEGMENT_CATEGORY.faceSkin) {
        skinPixels++;
      }
    }
    if (skinPixels / categories.length < 0.08) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = imageData.data;

    for (let y = 0; y < canvas.height; y++) {
      const my = Math.min(maskH - 1, Math.floor((y / canvas.height) * maskH));
      const rowBase = my * maskW;
      for (let x = 0; x < canvas.width; x++) {
        const mx = Math.min(maskW - 1, Math.floor((x / canvas.width) * maskW));
        const cat = categories[rowBase + mx];
        if (cat !== SEGMENT_CATEGORY.bodySkin && cat !== SEGMENT_CATEGORY.faceSkin) {
          px[(y * canvas.width + x) * 4 + 3] = 0;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  } finally {
    result.close?.();
  }
}

// Turns whatever's left (flash-art on a flat card, or a photo already
// trimmed to just skin by applySkinSegmentation) into a clean transparent
// stencil. Finds the dominant color among still-opaque pixels — the card's
// backdrop, or the skin tone once the room's been segmented out — and keys
// it to transparent with a soft ramp, leaving only the ink opaque. Skips
// pixels already made transparent by an earlier stage, and bails out if no
// single color clearly dominates (a busy, un-segmentable photo) rather than
// carving the image up arbitrarily.
function keyOutDominantColor(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const px = imageData.data;

  // Wider buckets tolerate the natural grain/shading gradient a photographed
  // paper backdrop has (16 splits that noise across too many buckets for any
  // one to read as "dominant"); tuned against real flash-card photos and
  // candid tattoo-on-skin photos so the two cleanly separate at the 0.3
  // share threshold below.
  const QUANT = 24;
  const buckets = new Map<number, { r: number; g: number; b: number; count: number }>();
  let totalOpaque = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 10) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const key =
      (Math.floor(r / QUANT) << 16) | (Math.floor(g / QUANT) << 8) | Math.floor(b / QUANT);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { r: 0, g: 0, b: 0, count: 0 };
      buckets.set(key, bucket);
    }
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.count++;
    totalOpaque++;
  }
  if (totalOpaque === 0) return;

  let dominant: { r: number; g: number; b: number; count: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!dominant || bucket.count > dominant.count) dominant = bucket;
  }
  if (!dominant || dominant.count / totalOpaque < 0.3) return;

  const bgR = dominant.r / dominant.count;
  const bgG = dominant.g / dominant.count;
  const bgB = dominant.b / dominant.count;

  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 10) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
    const alpha = Math.max(0, Math.min(255, (dist - 16) * 6));
    px[i + 3] = Math.min(px[i + 3], Math.round(alpha));
  }
  ctx.putImageData(imageData, 0, 0);
}

// Full background-removal pipeline for a design image: best-effort ML skin
// segmentation (strips a candid photo's surroundings), then color-key
// whatever's left down to just the ink. Each stage is independently
// best-effort — a failure at either just leaves the previous stage's result.
async function buildDesignStencil(
  url: string,
  getSegmenter: () => Promise<any | null>
): Promise<HTMLCanvasElement> {
  const img = await loadImage(url);
  const canvas = drawToCanvas(img);

  try {
    const segmenter = await getSegmenter();
    if (segmenter) applySkinSegmentation(canvas, segmenter);
  } catch {
    // Segmentation is a nice-to-have, not required — fall through.
  }

  try {
    keyOutDominantColor(canvas);
  } catch {
    // A cross-origin source without CORS headers taints the canvas and
    // blocks pixel access — leave the (possibly already skin-segmented)
    // image as-is rather than throwing.
  }

  return canvas;
}

// Approximates the design wrapping around a cylindrical surface (a forearm,
// a cheek) instead of sitting flat: the source image is sliced into thin
// vertical strips, each foreshortened and shaded as if it were a small facet
// of a curved cross-section, so the outer edges compress and darken as they
// curve away from camera while the center stays full-bright and full-width.
function drawWrappedDesign(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  width: number,
  height: number,
  wrapDeg: number,
  baseAlpha: number
) {
  const strips = 48;
  const wrapRad = Math.max(0.01, (wrapDeg * Math.PI) / 180);
  const sinMax = Math.sin(wrapRad);

  for (let i = 0; i < strips; i++) {
    const u0 = (i / strips) * 2 - 1;
    const u1 = ((i + 1) / strips) * 2 - 1;
    const uMid = (u0 + u1) / 2;
    const cosMid = Math.cos(uMid * wrapRad);
    if (cosMid <= 0.03) continue; // this facet has curved past the visible horizon

    const sx0 = ((u0 + 1) / 2) * src.width;
    const sx1 = ((u1 + 1) / 2) * src.width;
    const sw = Math.max(1, sx1 - sx0);

    // Cylindrical unwrap: equal angular slices map to sine-spaced x
    // positions, which is what makes the edges bunch up and compress.
    const dx0 = (Math.sin(u0 * wrapRad) / sinMax) * (width / 2);
    const dx1 = (Math.sin(u1 * wrapRad) / sinMax) * (width / 2);
    const dw = Math.max(0.5, dx1 - dx0);

    // Steeper falloff (vs. a flatter 0.4-1.0 range) so the curve away from
    // camera reads as a real edge instead of a faint tint.
    const shade = 0.18 + 0.82 * Math.pow(cosMid, 1.3);

    ctx.globalAlpha = baseAlpha * shade;
    ctx.drawImage(src, sx0, 0, sw, src.height, dx0, -height / 2, dw, height);
  }

  // A soft central sheen sells the curve as glossy skin rather than a flat sticker.
  const prevOp = ctx.globalCompositeOperation;
  const prevFilter = ctx.filter;
  const sheen = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.5, `rgba(255,255,255,${0.22 * baseAlpha})`);
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalCompositeOperation = "overlay";
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.fillStyle = sheen;
  ctx.fillRect(-width / 2, -height / 2, width, height);

  // Dark contact shadow along the true outer edges of the wrap — the last
  // sliver of ink right before it curves out of sight should read as
  // receding, not just dimmer.
  const rim = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  rim.addColorStop(0, "rgba(0,0,0,0.55)");
  rim.addColorStop(0.12, "rgba(0,0,0,0)");
  rim.addColorStop(0.88, "rgba(0,0,0,0)");
  rim.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = baseAlpha;
  ctx.fillStyle = rim;
  ctx.fillRect(-width / 2, -height / 2, width, height);

  ctx.globalCompositeOperation = prevOp;
  ctx.filter = prevFilter;
}

export default function VirtualTryOn() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);
  const memoryLockRef = useRef<number>(0);
  const camRequestIdRef = useRef(0);

  const imgCacheRef = useRef<HTMLCanvasElement | null>(null);
  const frozenFrameRef = useRef<HTMLCanvasElement | null>(null);
  const segmenterPromiseRef = useRef<Promise<any | null> | null>(null);

  // App State
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [region, setRegion] = useState<Region>("arm");
  const [ready, setReady] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("Loading AI Engine…");
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<Facing>("user");
  const [flashes, setFlashes] = useState<Flash[]>(DEFAULT_FLASH);
  const [activeUrl, setActiveUrl] = useState<string | null>(DEFAULT_FLASH[0].url);
  
  // Controls
  const [scaleMul, setScaleMul] = useState(1);
  const [rotOffset, setRotOffset] = useState(0);
  const [opacity, setOpacity] = useState(0.85);
  const [placementOffset, setPlacementOffset] = useState(1.8); 
  const [manual, setManual] = useState(false);
  
  const [pose, setPose] = useState<BodyPose>({
    cx: 0.5, cy: 0.5, angle: 0, length: 0.2, visible: false,
  });
  const smoothedPoseRef = useRef<BodyPose>({
    cx: 0.5, cy: 0.5, angle: 0, length: 0.2, visible: false,
  });
  
  const [manualPos, setManualPos] = useState({ x: 0.5, y: 0.5 });
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  // Post-capture editing: a still frame is frozen as the background while
  // the design stays fully draggable/resizable/rotatable on top of it, so
  // placement can be fine-tuned after the shot instead of only before it.
  const [editing, setEditing] = useState(false);

  const [designProcessing, setDesignProcessing] = useState(false);

  const mirrorVideo = facing === "user";

  // This experience needs a handheld camera pointed at your own body, which a
  // laptop/desktop webcam can't do — detect that up front and never touch
  // getUserMedia or download tracking models on non-mobile devices.
  useEffect(() => {
    const ua = navigator.userAgent || (navigator as any).vendor || "";
    const uaMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const narrowScreen = window.innerWidth <= 900;
    setIsMobile(uaMobile || (coarsePointer && narrowScreen));
  }, []);

  // Lazily creates (once) and caches the skin segmenter used by the
  // background-removal pipeline below. Only fetched when actually needed —
  // never on desktop, where the try-on UI isn't shown at all.
  const getSegmenter = useCallback(() => {
    if (!segmenterPromiseRef.current) {
      segmenterPromiseRef.current = (async () => {
        try {
          const vision = await import("@mediapipe/tasks-vision");
          const { FilesetResolver, ImageSegmenter } = vision;
          const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);
          const create = (delegate: "GPU" | "CPU") =>
            ImageSegmenter.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: MODELS.segmenter, delegate },
              runningMode: "IMAGE",
              outputCategoryMask: true,
              outputConfidenceMasks: false,
            });
          try {
            return await create("GPU");
          } catch {
            return await create("CPU");
          }
        } catch {
          return null;
        }
      })();
    }
    return segmenterPromiseRef.current;
  }, []);

  useEffect(() => {
    return () => {
      segmenterPromiseRef.current?.then((s) => s?.close?.());
    };
  }, []);

  // Background-removal pipeline: best-effort ML skin segmentation, then key
  // out whatever's left down to just the ink (see buildDesignStencil). The
  // per-frame cylindrical wrap render handles edge fade/shading dynamically,
  // so this step is purely about getting a clean cutout.
  useEffect(() => {
    if (!activeUrl || isMobile !== true) return;
    let cancelled = false;
    setDesignProcessing(true);
    buildDesignStencil(activeUrl, getSegmenter)
      .then((canvas) => {
        if (cancelled) return;
        imgCacheRef.current = canvas;
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't process that design. Try another one.");
      })
      .finally(() => {
        if (!cancelled) setDesignProcessing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeUrl, isMobile, getSegmenter]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTracking(false);
  }, []);

  // DYNAMIC MODEL LOADER (Triggers when Region changes)
  useEffect(() => {
    if (isMobile !== true) return;
    let cancelled = false;
    async function init() {
      setReady(false);
      setStatus(`Loading ${region === 'arm' ? 'Hand' : 'Face'} Tracker...`);
      
      // Close existing landmarker before loading new one
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }

      try {
        const vision = await import("@mediapipe/tasks-vision");
        const { FilesetResolver, HandLandmarker, FaceLandmarker } = vision;
        const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);

        const createLandmarker = async (delegate: "GPU" | "CPU") => {
          if (region === "arm") {
            return HandLandmarker.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: MODELS.arm, delegate },
              runningMode: "VIDEO",
              numHands: 1,
            });
          }
          return FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODELS.face, delegate },
            runningMode: "VIDEO",
            numFaces: 1,
          });
        };

        let landmarker: any;
        try {
          landmarker = await createLandmarker("GPU");
        } catch {
          // Many devices/browsers reject the GPU delegate (no WebGL2, driver
          // blocklist, etc). Retry on CPU before giving up on tracking entirely.
          landmarker = await createLandmarker("CPU");
        }

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setStatus("Tracker Ready");
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          landmarkerRef.current = null;
          setError("AI tracker unavailable — switching to manual placement.");
          setStatus("Manual Mode");
          setManual(true);
          setReady(true);
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [region, isMobile]);

  const startCamera = useCallback(
    async (face: Facing = facing) => {
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera not supported in this browser (requires HTTPS + a modern browser).");
        setTracking(false);
        return;
      }

      // Guard against overlapping calls (e.g. rapid camera-switch clicks, or a
      // dev-mode double effect run) — a stale call's success/failure must never
      // clobber state set by a call started after it.
      const reqId = ++camRequestIdRef.current;

      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: face }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (camRequestIdRef.current !== reqId) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        if (camRequestIdRef.current !== reqId) return;
        setTracking(true);
        setStatus("Camera Active");
      } catch {
        if (camRequestIdRef.current !== reqId) return;
        setError("Camera access denied.");
        setTracking(false);
      }
    },
    [facing]
  );

  // Camera lifecycle is independent of the AI tracker: the feed (and manual
  // placement) should work even while a model is (re)loading or failed to load.
  // Gated on isMobile so a desktop visitor is never prompted for camera access.
  useEffect(() => {
    if (isMobile !== true) return;
    startCamera(facing);
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const switchCamera = async (next: Facing) => {
    if (next === facing) return;
    setFacing(next);
    setPose((a) => ({ ...a, visible: false }));
    await startCamera(next);
  };

  // MULTI-MODEL RENDER LOOP
  // Runs whenever the camera is tracking, regardless of whether the AI
  // tracker has finished loading (or failed) — the video feed and manual
  // placement must keep working either way.
  useEffect(() => {
    if (!tracking) return;

    // Shared between the live-video path and the frozen-frame editing path:
    // positions/rotates/scales the cached design and hands it to the
    // cylindrical-wrap renderer. Reads manual/manualPos/pose etc. from the
    // enclosing closure, which is why this effect re-runs on every control change.
    const drawDesignOverlay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      if (!imgCacheRef.current) return;
      const activePose = manual
        ? { cx: manualPos.x, cy: manualPos.y, angle: 0, length: 0.15, visible: true }
        : pose;

      if (!activePose.visible) return;

      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = opacity;
      ctx.filter = "grayscale(100%) contrast(120%)";

      const imgW = imgCacheRef.current.width;
      const imgH = imgCacheRef.current.height;
      const aspect = imgW / imgH;
      const isBand = aspect > 1.25;

      let autoAngle = activePose.angle;
      if (isBand && region === "arm") autoAngle += 90;

      const posX = activePose.cx * canvas.width;
      const posY = activePose.cy * canvas.height;
      const appliedOffset = mirrorVideo ? -rotOffset : rotOffset;
      const currentAngle = (autoAngle + appliedOffset) * (Math.PI / 180);

      let targetW, targetH;
      if (region === "arm") {
        if (isBand) {
          targetW = canvas.width * (activePose.length * 1.6 * scaleMul);
          targetH = targetW / aspect;
        } else {
          targetH = canvas.width * (activePose.length * 3.8 * scaleMul);
          targetW = targetH * aspect;
        }
      } else {
        // FACE MATH
        targetW = canvas.width * (activePose.length * 0.8 * scaleMul);
        targetH = targetW / aspect;
      }

      ctx.translate(posX, posY);

      if (mirrorVideo) ctx.scale(-1, 1);

      ctx.rotate(currentAngle);

      // Band designs wrap most of the way around a limb's circumference;
      // a portrait-style piece still sits on a rounded surface, so it
      // gets a gentler curve; a face gets the cheek's curvature.
      const wrapDeg = region === "face" ? 48 : isBand ? 84 : 40;
      drawWrappedDesign(ctx, imgCacheRef.current, targetW, targetH, wrapDeg, opacity);
      ctx.restore();
    };

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      // EDITING MODE: the background is a frozen still, not the live feed.
      // Tracking is paused (there's no new video to detect against) but the
      // design overlay below still redraws every frame so drag/slider
      // adjustments (manual is forced on while editing) stay fully live.
      if (editing) {
        const frame = frozenFrameRef.current;
        if (!canvas || !frame) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        if (canvas.width !== frame.width) {
          canvas.width = frame.width;
          canvas.height = frame.height;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
        drawDesignOverlay(ctx, canvas);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (landmarker && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        try {
          const result = landmarker.detectForVideo(video, performance.now());

          let detected = false;
          let targetCx = 0, targetCy = 0, targetAngle = 0, targetLength = 0;

          // REGION 1: ARM MATH
          if (region === "arm" && result.landmarks && result.landmarks.length > 0) {
            const hand = result.landmarks[0];
            const wrist = hand[0];
            const knuckle = hand[9];

            const dx = wrist.x - knuckle.x;
            const dy = wrist.y - knuckle.y;
            targetLength = Math.hypot(dx, dy);

            const rawCx = wrist.x + dx * placementOffset;
            const rawCy = wrist.y + dy * placementOffset;
            targetCx = mirrorVideo ? 1 - rawCx : rawCx;
            targetCy = rawCy;

            targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
            detected = true;
          } 
          
          // REGION 2: FACE MATH
          else if (region === "face" && result.faceLandmarks && result.faceLandmarks.length > 0) {
            const face = result.faceLandmarks[0];
            const leftCheek = face[234];
            const rightCheek = face[454];
            const nose = face[1];

            const dx = rightCheek.x - leftCheek.x;
            const dy = rightCheek.y - leftCheek.y;
            targetLength = Math.hypot(dx, dy);

            // Shift up to forehead or down to chin based on slider
            const yShift = (placementOffset - 1.8) * targetLength;
            
            const rawCx = nose.x;
            const rawCy = nose.y + yShift;
            targetCx = mirrorVideo ? 1 - rawCx : rawCx;
            targetCy = rawCy;

            // Face tilt is horizontal, so no -90 offset needed
            targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
            if (mirrorVideo) targetAngle = -targetAngle;
            detected = true;
          }

          if (detected) {
            memoryLockRef.current = 0; 
            const prev = smoothedPoseRef.current;
            
            const dist = Math.hypot(targetCx - prev.cx, targetCy - prev.cy);
            let smoothFactor = dist > 0.04 ? 0.6 : 0.15; 
            if (!prev.visible) smoothFactor = 1.0;

            const dAngle = diffAngle(targetAngle, prev.angle);

            const nextPose: BodyPose = {
              cx: prev.cx + (targetCx - prev.cx) * smoothFactor,
              cy: prev.cy + (targetCy - prev.cy) * smoothFactor,
              angle: prev.angle + dAngle * smoothFactor,
              length: prev.length + (targetLength - prev.length) * smoothFactor,
              visible: true,
            };

            smoothedPoseRef.current = nextPose;
            if (!manual) setPose(nextPose);
          } else {
            memoryLockRef.current += 1;
            if (memoryLockRef.current > 90) {
              smoothedPoseRef.current.visible = false;
              if (!manual) setPose((a) => ({ ...a, visible: false }));
            }
          }
        } catch {
          // Ignore 
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      if (mirrorVideo) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      drawDesignOverlay(ctx, canvas);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tracking, ready, editing, manual, mirrorVideo, pose, manualPos, rotOffset, scaleMul, opacity, placementOffset, region]);

  const onDesignUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFlashes((prev) => [{ id: `custom-${Date.now()}`, label: file.name, url }, ...prev]);
    setActiveUrl(url);
  };

  // Freezes the current camera frame and drops into editing mode: the design
  // stays fully draggable, and the sliders below keep working, so placement
  // can be fine-tuned on the still photo instead of only on live video.
  const enterEditing = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const frame = document.createElement("canvas");
    frame.width = canvas.width;
    frame.height = canvas.height;
    const fctx = frame.getContext("2d");
    if (fctx) {
      fctx.save();
      if (mirrorVideo) {
        fctx.translate(frame.width, 0);
        fctx.scale(-1, 1);
      }
      fctx.drawImage(video, 0, 0, frame.width, frame.height);
      fctx.restore();
    }
    frozenFrameRef.current = frame;

    // Hand off whatever position was live-tracking to manual placement so
    // the design doesn't jump when tracking pauses.
    if (!manual) setManualPos({ x: pose.cx, y: pose.cy });
    setManual(true);
    setEditing(true);
  };

  const discardEditing = () => {
    frozenFrameRef.current = null;
    setEditing(false);
  };

  const finalizeCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      setSnapshotUrl(canvas.toDataURL("image/png"));
    } catch {
      setError("Couldn't capture this design (image failed CORS check). Try another design or upload your own.");
    }
  };

  // There's no web API that writes straight into the OS Photos/Gallery app —
  // that's a native-app-only permission on both iOS and Android. The closest
  // a website can get is the Web Share API's native share sheet, which on
  // both platforms includes a "Save Image"/"Save to Photos" action right in
  // it — effectively a one-tap gallery save once the visitor picks it. Where
  // that's not available (most desktop browsers, or an older mobile one),
  // fall back to a plain download, which lands in Downloads/Files instead.
  const saveSnapshot = async () => {
    if (!snapshotUrl) return;

    try {
      const blob = await (await fetch(snapshotUrl)).blob();
      const file = new File([blob], "iron-rose-preview.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Iron Rose Tattoo Preview",
        });
        return;
      }
    } catch (err) {
      // The user backing out of the share sheet throws AbortError — that's
      // a deliberate cancel, not a failure, so don't fall through to a
      // second save prompt on top of it.
      if (err instanceof DOMException && err.name === "AbortError") return;
    }

    const a = document.createElement("a");
    a.href = snapshotUrl;
    a.download = "iron-rose-preview.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Still checking the device on first client render — avoid flashing the
  // full camera UI before we know whether to show the desktop notice.
  if (isMobile === null) {
    return <section className="relative z-10 min-h-[100svh] bg-black pb-16 pt-20 sm:pt-24" />;
  }

  if (isMobile === false) {
    return (
      <section className="relative z-10 min-h-[100svh] bg-black pb-16 pt-20 text-white sm:pt-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="mb-1 text-[10px] uppercase tracking-[0.35em] text-white/50">
            Augmented Reality Studio
          </p>
          <h1 className="mb-6 text-2xl font-black uppercase tracking-tight sm:text-3xl md:text-4xl">
            Live Stencil Preview
          </h1>
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <Smartphone size={40} className="text-white/60" />
            <p className="text-sm text-white/80">
              Live AR try-on needs a handheld camera pointed at your own arm, face, or shoulder — it only works on phones and tablets.
            </p>
            <p className="text-xs text-white/50">
              Open this page on your mobile device to try designs on in real time.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 min-h-[100svh] bg-black pb-16 pt-20 text-white sm:pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* HEADER */}
        <div className="mb-6 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-[0.35em] text-white/50">
            Augmented Reality Studio
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl md:text-4xl">
            Live Stencil Preview
          </h1>
          <p className="mt-2 text-xs text-white/40">
            {editing
              ? "Editing capture — drag to reposition, use Size/Rotation below, then Save"
              : status}
            {!editing && pose.visible && !manual ? " • Tracking Locked" : ""}
            {!editing && !pose.visible && tracking && !manual ? ` • Show your ${region} to the camera` : ""}
          </p>
        </div>

        {/* REGION TABS */}
        {!editing && (
          <div className="mb-6 flex justify-center gap-2">
            <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
              <button
                onClick={() => { setRegion("arm"); setPlacementOffset(1.8); }}
                className={`rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${region === "arm" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white"}`}
              >
                Arm
              </button>
              <button
                onClick={() => { setRegion("face"); setPlacementOffset(1.8); }}
                className={`rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${region === "face" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white"}`}
              >
                Face / Neck
              </button>
            </div>
          </div>
        )}

        {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}

        {/* CAMERA CONTROLS */}
        {!editing && (
          <div className="mb-4 flex justify-center gap-2">
            <button onClick={() => switchCamera("user")} className={`rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${facing === "user" ? "bg-white text-black" : "border border-white/20 text-white/60"}`}>
              Front Camera
            </button>
            <button onClick={() => switchCamera("environment")} className={`rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${facing === "environment" ? "bg-white text-black" : "border border-white/20 text-white/60"}`}>
              Back Camera
            </button>
          </div>
        )}

        {/* VIEWPORT */}
        <div
          ref={containerRef}
          className="relative mx-auto aspect-[3/4] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 sm:aspect-[4/5] md:aspect-video shadow-2xl"
        >
          <video ref={videoRef} playsInline muted autoPlay className="hidden" />

          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 h-full w-full object-cover"
            onPointerDown={
              manual
                ? (ev) => {
                    const el = canvasRef.current;
                    if (!el) return;
                    const rect = el.getBoundingClientRect();
                    const move = (e: PointerEvent) => {
                      let x = (e.clientX - rect.left) / rect.width;
                      const y = (e.clientY - rect.top) / rect.height;
                      setManualPos({ x: Math.min(0.95, Math.max(0.05, x)), y: Math.min(0.95, Math.max(0.05, y)) });
                    };
                    const up = () => {
                      window.removeEventListener("pointermove", move);
                      window.removeEventListener("pointerup", up);
                    };
                    window.addEventListener("pointermove", move);
                    window.addEventListener("pointerup", up);
                    move(ev.nativeEvent);
                  }
                : undefined
            }
          />

          {tracking && !editing && (
            <button onClick={enterEditing} className="absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black shadow-lg hover:scale-105 transition-all">
              <Camera size={16} /><span>Capture</span>
            </button>
          )}

          {editing && (
            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
              <button onClick={discardEditing} className="rounded-full border border-white/30 bg-black/60 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur transition hover:bg-black/80">
                Retake
              </button>
              <button onClick={finalizeCapture} className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black shadow-lg transition-all hover:scale-105">
                <Download size={16} /><span>Save Photo</span>
              </button>
            </div>
          )}

          {!tracking && !editing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
              <button onClick={() => startCamera(facing)} className="rounded-full bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-black hover:scale-105 transition">
                Enable Camera
              </button>
            </div>
          )}
        </div>

        {/* FLASH SELECTOR */}
        <div className="mx-auto mt-6 max-w-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
              {designProcessing ? "Removing background…" : "Select Flash or Upload Ink"}
            </p>
            <label className="cursor-pointer rounded-full border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:border-white/60 transition">
              Upload Design
              <input type="file" accept="image/*" className="hidden" onChange={onDesignUpload} />
            </label>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {flashes.map((f) => (
              <button key={f.id} onClick={() => setActiveUrl(f.url)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${activeUrl === f.url ? "border-white scale-95" : "border-white/10 opacity-60 hover:opacity-100"}`}>
                <img src={f.url} alt={f.label} className="h-full w-full object-cover grayscale" />
              </button>
            ))}
          </div>
        </div>

        {/* SLIDERS */}
        <div className="mx-auto mt-6 max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <label className="flex items-center justify-between text-xs uppercase tracking-widest text-white/70">
            <span>{editing ? "Manual Placement (editing capture)" : "Manual Override (Drag anywhere)"}</span>
            <input
              type="checkbox"
              checked={manual}
              disabled={editing}
              onChange={(e) => setManual(e.target.checked)}
              className="h-4 w-4 accent-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>

          {!editing && (
            <div>
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-white/50">
                <span>{region === "arm" ? "Placement (Wrist ↔ Elbow)" : "Placement (Forehead ↔ Neck)"}</span>
              </div>
              <input
                type="range"
                min={region === "arm" ? 0.8 : 0.5}
                max={region === "arm" ? 3.5 : 3.5}
                step="0.1"
                value={placementOffset}
                onChange={(e) => setPlacementOffset(parseFloat(e.target.value))}
                className="w-full accent-white"
              />
            </div>
          )}

          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-white/50">
              <span>Size Multiplier</span><span>{Math.round(scaleMul * 100)}%</span>
            </div>
            <input type="range" min="0.4" max="2.2" step="0.05" value={scaleMul} onChange={(e) => setScaleMul(parseFloat(e.target.value))} className="w-full accent-white" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-white/50">
              <span>Rotation</span><span>{rotOffset}°</span>
            </div>
            <input type="range" min="-180" max="180" step="1" value={rotOffset} onChange={(e) => setRotOffset(parseFloat(e.target.value))} className="w-full accent-white" />
          </div>
        </div>
      </div>

      {/* SNAPSHOT MODAL */}
      {snapshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden p-6 text-center">
            <button onClick={() => setSnapshotUrl(null)} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={24} /></button>
            <h3 className="text-xl font-bold uppercase tracking-widest mb-4">Your Tattoo Preview</h3>
            <img src={snapshotUrl} alt="Snapshot" className="w-full rounded-xl mb-6 shadow-2xl" />
            <p className="mb-4 text-xs text-white/50">Not quite right? Close this and keep adjusting — your placement is still there.</p>
            <div className="flex justify-center gap-4">
              <button onClick={saveSnapshot} className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black hover:scale-105 transition">
                <Download size={16} /><span>Save Photo</span>
              </button>
              <button
                onClick={() => {
                  setSnapshotUrl(null);
                  discardEditing();
                }}
                className="rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition"
              >
                Retake
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}