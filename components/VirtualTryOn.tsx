"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
} from "react";
import { Camera, Download, X } from "lucide-react";

type Flash = { id: string; label: string; url: string };
type Facing = "user" | "environment";

const DEFAULT_FLASH: Flash[] = [
  {
    id: "1",
    label: "Blackwork",
    url: "https://images.unsplash.com/photo-1611501271407-f28c242f3609?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "2",
    label: "Fine line",
    url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "3",
    label: "Ornamental",
    url: "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=500&q=80",
  },
];

type ArmPose = {
  cx: number;
  cy: number;
  angle: number;
  length: number; 
  visible: boolean;
};

// Hand Tracker Engine
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";

function diffAngle(target: number, current: number) {
  return ((((target - current) % 360) + 540) % 360) - 180;
}

export default function VirtualTryOn() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);

  const imgCacheRef = useRef<HTMLImageElement | null>(null);
  const smoothedArmRef = useRef<ArmPose>({
    cx: 0.5, cy: 0.5, angle: 0, length: 0.2, visible: false,
  });

  const [ready, setReady] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("Loading AI Engine…");
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<Facing>("user");
  const [flashes, setFlashes] = useState<Flash[]>(DEFAULT_FLASH);
  const [activeUrl, setActiveUrl] = useState<string | null>(DEFAULT_FLASH[0].url);
  const [scaleMul, setScaleMul] = useState(1);
  const [rotOffset, setRotOffset] = useState(0);
  const [opacity, setOpacity] = useState(0.85);
  const [manual, setManual] = useState(false);
  const [arm, setArm] = useState<ArmPose>({
    cx: 0.5, cy: 0.5, angle: 0, length: 0.2, visible: false,
  });
  const [manualPos, setManualPos] = useState({ x: 0.5, y: 0.5 });
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const mirrorVideo = facing === "user";

  useEffect(() => {
    if (!activeUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeUrl;
    img.onload = () => {
      imgCacheRef.current = img;
    };
  }, [activeUrl]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTracking(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setStatus("Loading Hand Tracker...");
        const vision = await import("@mediapipe/tasks-vision");
        const { FilesetResolver, HandLandmarker } = vision;
        const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);

        let landmarker: any = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 1, 
        });

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setStatus("Tracker Ready");
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Tracker failed to load. Use manual mode.");
          setStatus("Failed");
          setReady(true);
        }
      }
    }
    init();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
    };
  }, []);

  const startCamera = useCallback(
    async (face: Facing = facing) => {
      setError(null);
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: face }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setTracking(true);
        setStatus("Camera Active");
      } catch {
        setError("Camera access denied.");
        setTracking(false);
      }
    },
    [facing]
  );

  useEffect(() => {
    if (ready) startCamera(facing);
    return () => stopCamera();
  }, [ready, startCamera, stopCamera, facing]);

  const switchCamera = async (next: Facing) => {
    if (next === facing) return;
    setFacing(next);
    setArm((a) => ({ ...a, visible: false }));
    await startCamera(next);
  };

  useEffect(() => {
    if (!tracking || !landmarkerRef.current) return;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !canvas || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        try {
          const result = landmarker.detectForVideo(video, performance.now());
          
          if (result.landmarks && result.landmarks.length > 0) {
            const hand = result.landmarks[0];
            const wrist = hand[0];
            const knuckle = hand[9];

            const dx = wrist.x - knuckle.x;
            const dy = wrist.y - knuckle.y;
            const length = Math.hypot(dx, dy);

            const rawCx = wrist.x + dx * 1.5;
            const rawCy = wrist.y + dy * 1.5;
            const cx = mirrorVideo ? 1 - rawCx : rawCx;
            const cy = rawCy;

            const rawAngle = (Math.atan2(dy, dx) * 180) / Math.PI - 90;

            const prev = smoothedArmRef.current;
            
            // SMART FILTERING: Velocity-based Lerp for extreme stickiness
            const dist = Math.hypot(cx - prev.cx, cy - prev.cy);
            let smoothFactor = dist > 0.04 ? 0.6 : 0.15; // Fast if moving, sticky if still
            if (!prev.visible) smoothFactor = 1.0;

            const dAngle = diffAngle(rawAngle, prev.angle);

            const nextPose: ArmPose = {
              cx: prev.cx + (cx - prev.cx) * smoothFactor,
              cy: prev.cy + (cy - prev.cy) * smoothFactor,
              angle: prev.angle + dAngle * smoothFactor,
              length: prev.length + (length - prev.length) * smoothFactor,
              visible: true,
            };

            smoothedArmRef.current = nextPose;
            if (!manual) setArm(nextPose);
          } else {
            smoothedArmRef.current.visible = false;
            if (!manual) setArm((a) => ({ ...a, visible: false }));
          }
        } catch {
          // Ignore dropped frames
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

      // SMART DRAWING ENGINE
      if (imgCacheRef.current) {
        const activePose = manual 
          ? { cx: manualPos.x, cy: manualPos.y, angle: 0, length: 0.15, visible: true } 
          : arm;

        if (activePose.visible) {
          ctx.save();
          ctx.globalCompositeOperation = "multiply"; 
          ctx.globalAlpha = opacity;
          ctx.filter = "grayscale(100%) contrast(120%)";

          // 1. Aspect Ratio Detection
          const imgW = imgCacheRef.current.width;
          const imgH = imgCacheRef.current.height;
          const aspect = imgW / imgH;
          const isBand = aspect > 1.25; // Distinctly wider than tall

          // 2. Dynamic Rotation
          let autoAngle = activePose.angle;
          if (isBand) {
             autoAngle += 90; // Snap armbands to wrap the arm horizontally
          }

          const posX = activePose.cx * canvas.width;
          const posY = activePose.cy * canvas.height;
          const appliedOffset = mirrorVideo ? -rotOffset : rotOffset;
          const currentAngle = (autoAngle + appliedOffset) * (Math.PI / 180);
          
          // 3. Dynamic Scaling
          let targetW, targetH;
          if (isBand) {
            // Armbands: Scale width to match forearm thickness
            targetW = canvas.width * (activePose.length * 2.8 * scaleMul);
            targetH = targetW / aspect;
          } else {
            // Vertical Sleeves: Scale height to match forearm length
            targetH = canvas.width * (activePose.length * 3.5 * scaleMul);
            targetW = targetH * aspect;
          }

          ctx.translate(posX, posY);
          
          if (mirrorVideo) {
             ctx.scale(-1, 1);
          }
          
          ctx.rotate(currentAngle);
          ctx.drawImage(imgCacheRef.current, -targetW / 2, -targetH / 2, targetW, targetH);
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tracking, manual, mirrorVideo, arm, manualPos, rotOffset, scaleMul, opacity]);

  const onDesignUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFlashes((prev) => [{ id: `custom-${Date.now()}`, label: file.name, url }, ...prev]);
    setActiveUrl(url);
  };

  const captureSnapshot = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setSnapshotUrl(canvas.toDataURL("image/png"));
    }
  };

  return (
    <section className="relative z-10 min-h-[100svh] bg-black pb-16 pt-20 text-white sm:pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-4 text-center md:mb-6">
          <p className="mb-1 text-[10px] uppercase tracking-[0.35em] text-white/50">
            Augmented Reality Studio
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl md:text-4xl">
            Live Forearm Stencil
          </h1>
          <p className="mt-2 text-xs text-white/40">
            {status}
            {arm.visible && !manual ? " • Tracking Locked" : ""}
            {!arm.visible && tracking && !manual ? " • Show your hand to the camera" : ""}
          </p>
        </div>

        {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}

        <div className="mb-4 flex justify-center gap-2">
          <button onClick={() => switchCamera("user")} className={`rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${facing === "user" ? "bg-white text-black" : "border border-white/20 text-white/60"}`}>
            Front Camera
          </button>
          <button onClick={() => switchCamera("environment")} className={`rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${facing === "environment" ? "bg-white text-black" : "border border-white/20 text-white/60"}`}>
            Back Camera
          </button>
        </div>

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

          {tracking && (
            <button
              onClick={captureSnapshot}
              className="absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black shadow-lg hover:scale-105 transition-all"
            >
              <Camera size={16} />
              <span>Capture Photo</span>
            </button>
          )}

          {!tracking && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
              <button onClick={() => startCamera(facing)} className="rounded-full bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-black hover:scale-105 transition">
                Enable Camera
              </button>
            </div>
          )}
        </div>

        <div className="mx-auto mt-6 max-w-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
              Select Flash or Upload Ink
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

        <div className="mx-auto mt-6 max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <label className="flex items-center justify-between text-xs uppercase tracking-widest text-white/70">
            <span>Manual Override (Drag anywhere)</span>
            <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} className="h-4 w-4 accent-white cursor-pointer" />
          </label>
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-white/50">
              <span>Size Multiplier</span><span>{Math.round(scaleMul * 100)}%</span>
            </div>
            <input type="range" min="0.4" max="2.2" step="0.05" value={scaleMul} onChange={(e) => setScaleMul(parseFloat(e.target.value))} className="w-full accent-white" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-white/50">
              <span>Rotation Offset</span><span>{rotOffset}°</span>
            </div>
            <input type="range" min="-180" max="180" step="1" value={rotOffset} onChange={(e) => setRotOffset(parseFloat(e.target.value))} className="w-full accent-white" />
          </div>
        </div>
      </div>

      {snapshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden p-6 text-center">
            <button onClick={() => setSnapshotUrl(null)} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={24} /></button>
            <h3 className="text-xl font-bold uppercase tracking-widest mb-4">Your Tattoo Preview</h3>
            <img src={snapshotUrl} alt="Snapshot" className="w-full rounded-xl mb-6 shadow-2xl" />
            <div className="flex justify-center gap-4">
              <a href={snapshotUrl} download="iron-rose-preview.png" className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black hover:scale-105 transition">
                <Download size={16} /><span>Save Photo</span>
              </a>
              <button onClick={() => setSnapshotUrl(null)} className="rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition">Retake</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}