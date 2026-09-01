"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  CSSProperties,
} from "react";

type Flash = { id: string; label: string; url: string };

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

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";

export default function VirtualTryOn() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);

  const [ready, setReady] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("Loading tracker…");
  const [error, setError] = useState<string | null>(null);
  const [flashes, setFlashes] = useState<Flash[]>(DEFAULT_FLASH);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [scaleMul, setScaleMul] = useState(1);
  const [rotOffset, setRotOffset] = useState(0);
  const [opacity, setOpacity] = useState(0.9);
  const [manual, setManual] = useState(false);
  const [arm, setArm] = useState<ArmPose>({
    cx: 0.5,
    cy: 0.45,
    angle: 0,
    length: 0.25,
    visible: false,
  });
  const [manualPos, setManualPos] = useState({ x: 0.4, y: 0.35 });

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
        setStatus("Loading MediaPipe (GPU)…");
        const vision = await import("@mediapipe/tasks-vision");
        const { FilesetResolver, PoseLandmarker } = vision;

        const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);

        let landmarker: any;
        try {
          landmarker = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          });
          if (!cancelled) setStatus("Tracker ready (GPU)");
        } catch {
          setStatus("GPU unavailable — using CPU…");
          landmarker = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          });
          if (!cancelled) setStatus("Tracker ready (CPU)");
        }

        if (cancelled) {
          landmarker?.close?.();
          return;
        }
        landmarkerRef.current = landmarker;
        setReady(true);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(
            "Could not load arm tracker. Use manual mode or check your connection."
          );
          setStatus("Tracker failed");
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

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setTracking(true);
      setStatus((s) => (s.includes("ready") ? s : "Camera on"));
    } catch {
      setError("Camera blocked. Allow camera access and retry.");
      setTracking(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (ready) startCamera();
    return () => stopCamera();
  }, [ready, startCamera, stopCamera]);

  useEffect(() => {
    if (!tracking || !landmarkerRef.current) return;

    const tick = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        try {
          const result = landmarker.detectForVideo(video, performance.now());
          const lm = result?.landmarks?.[0];
          if (lm) {
            const arms = [
              { e: lm[13], w: lm[15] },
              { e: lm[14], w: lm[16] },
            ];
            let best: ArmPose | null = null;
            for (const { e, w } of arms) {
              if (!e || !w) continue;
              const vis = Math.min(e.visibility ?? 1, w.visibility ?? 1);
              if (vis < 0.45) continue;
              const dx = w.x - e.x;
              const dy = w.y - e.y;
              const length = Math.hypot(dx, dy);
              if (length < 0.05) continue;
              const angle = -(Math.atan2(dy, dx) * 180) / Math.PI;
              const pose: ArmPose = {
                cx: 1 - (e.x + w.x) / 2,
                cy: (e.y + w.y) / 2,
                angle,
                length,
                visible: true,
              };
              if (!best || length > best.length) best = pose;
            }
            if (best && !manual) setArm(best);
            else if (!best) setArm((a) => ({ ...a, visible: false }));
          } else {
            setArm((a) => ({ ...a, visible: false }));
          }
        } catch {
          // skip frame
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tracking, manual]);

  const onDesignUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const flash: Flash = {
      id: `custom-${Date.now()}`,
      label: file.name.replace(/\.[^.]+$/, "") || "Custom",
      url,
    };
    setFlashes((prev) => [flash, ...prev]);
    setActiveUrl(url);
  };

  const stencilStyle = (): CSSProperties => {
    if (manual) {
      return {
        left: `${manualPos.x * 100}%`,
        top: `${manualPos.y * 100}%`,
        width: `${28 * scaleMul}%`,
        transform: `translate(-50%, -50%) rotate(${rotOffset}deg)`,
        opacity,
      };
    }
    if (!arm.visible) {
      return {
        left: "50%",
        top: "45%",
        width: `${22 * scaleMul}%`,
        transform: `translate(-50%, -50%) rotate(${rotOffset}deg)`,
        opacity: opacity * 0.35,
      };
    }
    const w = Math.min(55, Math.max(12, arm.length * 140 * scaleMul));
    return {
      left: `${arm.cx * 100}%`,
      top: `${arm.cy * 100}%`,
      width: `${w}%`,
      transform: `translate(-50%, -50%) rotate(${arm.angle + rotOffset}deg)`,
      opacity,
    };
  };

  return (
    <section className="relative z-10 min-h-[100svh] bg-void pb-16 pt-20 text-parchment sm:pt-24">
      <div className="mx-auto max-w-5xl px-3 sm:px-6">
        <div className="mb-4 text-center md:mb-6">
          <p className="mb-1 text-[10px] uppercase tracking-[0.35em] text-rose/80">
            Live arm tracking
          </p>
          <h1 className="font-display text-2xl font-medium sm:text-3xl md:text-4xl">
            Stencil locked to your arm.
          </h1>
          <p className="mt-2 text-xs text-parchment/45 sm:text-sm">
            {status}
            {arm.visible && !manual ? " · Arm detected" : ""}
            {!arm.visible && tracking && !manual ? " · Show forearm to camera" : ""}
          </p>
        </div>

        {error && (
          <p className="mb-3 text-center text-sm text-rose/90">{error}</p>
        )}

        <div
          ref={containerRef}
          className="relative mx-auto aspect-[3/4] w-full max-w-2xl overflow-hidden rounded-sm border border-white/10 bg-charcoal sm:aspect-[4/5] md:aspect-video md:max-h-[65vh]"
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
          />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 hidden" />

          {activeUrl && (
            <img
              src={activeUrl}
              alt="Stencil"
              draggable={false}
              className={`absolute z-10 max-w-none touch-none select-none mix-blend-multiply ${
                manual ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
              }`}
              style={stencilStyle()}
              onPointerDown={
                manual
                  ? (ev) => {
                      const el = containerRef.current;
                      if (!el) return;
                      const rect = el.getBoundingClientRect();
                      const move = (e: PointerEvent) => {
                        const x = 1 - (e.clientX - rect.left) / rect.width;
                        const y = (e.clientY - rect.top) / rect.height;
                        setManualPos({
                          x: Math.min(0.95, Math.max(0.05, x)),
                          y: Math.min(0.95, Math.max(0.05, y)),
                        });
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
          )}

          {!tracking && (
            <div className="absolute inset-0 flex items-center justify-center bg-charcoal/80">
              <button
                type="button"
                onClick={startCamera}
                className="rounded-full bg-parchment px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-void"
              >
                Enable camera
              </button>
            </div>
          )}
        </div>

        <div className="mx-auto mt-5 max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-parchment/40">
              Designs
            </p>
            <label className="cursor-pointer rounded-full border border-parchment/25 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-parchment/70 transition hover:border-parchment/50">
              Upload your design
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={onDesignUpload}
              />
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {flashes.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveUrl(f.url)}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-sm border sm:h-24 sm:w-24 ${
                  activeUrl === f.url
                    ? "border-parchment/60"
                    : "border-white/10 opacity-55"
                }`}
              >
                <img
                  src={f.url}
                  alt={f.label}
                  className="h-full w-full object-cover img-cinematic grayscale"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-md space-y-4 rounded-sm border border-white/8 bg-charcoal/50 p-4">
          <label className="flex items-center justify-between gap-3 text-[11px] text-parchment/60">
            <span>Manual drag (override tracking)</span>
            <input
              type="checkbox"
              checked={manual}
              onChange={(e) => setManual(e.target.checked)}
              className="h-4 w-4 accent-rose"
            />
          </label>
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-parchment/45">
              <span>Size</span>
              <span className="text-brass">{Math.round(scaleMul * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.2"
              step="0.05"
              value={scaleMul}
              onChange={(e) => setScaleMul(parseFloat(e.target.value))}
              className="w-full accent-rose"
            />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-parchment/45">
              <span>Rotation offset</span>
              <span className="text-brass">{rotOffset}°</span>
            </div>
            <input
              type="range"
              min="-90"
              max="90"
              step="1"
              value={rotOffset}
              onChange={(e) => setRotOffset(parseFloat(e.target.value))}
              className="w-full accent-rose"
            />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-parchment/45">
              <span>Opacity</span>
              <span className="text-brass">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full accent-rose"
            />
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-lg text-center text-[11px] leading-relaxed text-parchment/35">
          Uses MediaPipe Pose (GPU when available, CPU fallback). Hold one forearm
          toward the camera. Upload PNG/JPEG flash — white backgrounds fade with
          multiply blend. Preview only — not a final stencil.
        </p>

        <div className="mt-6 flex justify-center">
          <a
            href="/#reserve"
            className="inline-flex min-h-[48px] items-center rounded-full bg-parchment px-8 py-3 text-[11px] font-medium uppercase tracking-[0.25em] text-void"
          >
            Reserve a session
          </a>
        </div>
      </div>
    </section>
  );
}