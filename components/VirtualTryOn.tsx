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
type Region = "arm" | "face";

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
};
const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";

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
  const memoryLockRef = useRef<number>(0); 

  const imgCacheRef = useRef<HTMLCanvasElement | null>(null);
  
  // App State
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

  const mirrorVideo = facing === "user";

  // Edge-Fade 3D Processor
  useEffect(() => {
    if (!activeUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeUrl;
    img.onload = () => {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = img.width;
      offCanvas.height = img.height;
      const octx = offCanvas.getContext("2d");
      
      if (octx) {
        octx.drawImage(img, 0, 0);
        octx.globalCompositeOperation = "destination-in";
        const grad = octx.createLinearGradient(0, 0, offCanvas.width, 0);
        grad.addColorStop(0, "rgba(0,0,0,0)");     
        grad.addColorStop(0.2, "rgba(0,0,0,1)");   
        grad.addColorStop(0.8, "rgba(0,0,0,1)");   
        grad.addColorStop(1, "rgba(0,0,0,0)");     
        octx.fillStyle = grad;
        octx.fillRect(0, 0, offCanvas.width, offCanvas.height);
      }
      imgCacheRef.current = offCanvas; 
    };
  }, [activeUrl]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTracking(false);
  }, []);

  // DYNAMIC MODEL LOADER (Triggers when Region changes)
  useEffect(() => {
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

        let landmarker: any;
        if (region === "arm") {
          landmarker = await HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODELS.arm, delegate: "GPU" },
            runningMode: "VIDEO",
            numHands: 1, 
          });
        } else {
          landmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODELS.face, delegate: "GPU" },
            runningMode: "VIDEO",
            numFaces: 1, 
          });
        }

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setStatus("Tracker Ready");
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Tracker failed. Use manual mode.");
          setStatus("Failed");
          setReady(true);
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [region]);

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
    setPose((a) => ({ ...a, visible: false }));
    await startCamera(next);
  };

  // MULTI-MODEL RENDER LOOP
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

      if (imgCacheRef.current) {
        const activePose = manual 
          ? { cx: manualPos.x, cy: manualPos.y, angle: 0, length: 0.15, visible: true } 
          : pose;

        if (activePose.visible) {
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
          ctx.drawImage(imgCacheRef.current, -targetW / 2, -targetH / 2, targetW, targetH);
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tracking, manual, mirrorVideo, pose, manualPos, rotOffset, scaleMul, opacity, placementOffset, region]);

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
        
        {/* HEADER */}
        <div className="mb-6 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-[0.35em] text-white/50">
            Augmented Reality Studio
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl md:text-4xl">
            Live Stencil Preview
          </h1>
          <p className="mt-2 text-xs text-white/40">
            {status}
            {pose.visible && !manual ? " • Tracking Locked" : ""}
            {!pose.visible && tracking && !manual ? ` • Show your ${region} to the camera` : ""}
          </p>
        </div>

        {/* REGION TABS */}
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

        {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}

        {/* CAMERA CONTROLS */}
        <div className="mb-4 flex justify-center gap-2">
          <button onClick={() => switchCamera("user")} className={`rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${facing === "user" ? "bg-white text-black" : "border border-white/20 text-white/60"}`}>
            Front Camera
          </button>
          <button onClick={() => switchCamera("environment")} className={`rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${facing === "environment" ? "bg-white text-black" : "border border-white/20 text-white/60"}`}>
            Back Camera
          </button>
        </div>

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

          {tracking && (
            <button onClick={captureSnapshot} className="absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black shadow-lg hover:scale-105 transition-all">
              <Camera size={16} /><span>Capture</span>
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

        {/* FLASH SELECTOR */}
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

        {/* SLIDERS */}
        <div className="mx-auto mt-6 max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <label className="flex items-center justify-between text-xs uppercase tracking-widest text-white/70">
            <span>Manual Override (Drag anywhere)</span>
            <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} className="h-4 w-4 accent-white cursor-pointer" />
          </label>
          
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

          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-white/50">
              <span>Size Multiplier</span><span>{Math.round(scaleMul * 100)}%</span>
            </div>
            <input type="range" min="0.4" max="2.2" step="0.05" value={scaleMul} onChange={(e) => setScaleMul(parseFloat(e.target.value))} className="w-full accent-white" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-white/50">
              <span>Rotation Fine-Tune</span><span>{rotOffset}°</span>
            </div>
            <input type="range" min="-90" max="90" step="1" value={rotOffset} onChange={(e) => setRotOffset(parseFloat(e.target.value))} className="w-full accent-white" />
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