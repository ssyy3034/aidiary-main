import React, { useRef, useEffect, useCallback } from "react";
import { diaryAiApi } from "../../api/client";

interface EyeData {
  outer: { x: number; y: number };
  inner: { x: number; y: number };
  top: { x: number; y: number };
  bottom: { x: number; y: number };
  iris: { x: number; y: number };
}

interface Landmarks {
  left_eye: EyeData;
  right_eye: EyeData;
  skin_color: { r: number; g: number; b: number };
}

interface CharacterCanvasProps {
  imageUrl: string;
  imageBase64: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

// 애니메이션 타이밍 상수
const BLINK_CLOSE_MS = 80;
const BLINK_CLOSED_MS = 60;
const BLINK_OPEN_MS = 120;

const CharacterCanvas: React.FC<CharacterCanvasProps> = ({
  imageUrl,
  imageBase64,
  alt,
  className,
  style,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef<Landmarks | null>(null);
  const animRef = useRef<number>(0);
  const canvasSizeRef = useRef({ w: 0, h: 0 });

  const stateRef = useRef({
    blinkPhase: "open" as "open" | "closing" | "closed" | "opening",
    blinkStart: 0,
    lastBlinkEnd: 0,
    nextBlinkDelay: 2500 + Math.random() * 3000,
    gazeX: 0,
    gazeY: 0,
    targetGazeX: 0,
    targetGazeY: 0,
    lastGazeChange: 0,
    nextGazeIn: 1500 + Math.random() * 2000,
  });

  const syncCanvasSize = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    if (w === 0 || h === 0) return;
    canvasSizeRef.current = { w, h };
    canvas.width = w;
    canvas.height = h;
  }, []);

  const draw = useCallback(
    (ts: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const lm = landmarksRef.current;
      const { w: W, h: H } = canvasSizeRef.current;
      if (W === 0 || H === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      if (!lm) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const s = stateRef.current;

      // ── 시선 보간 ──
      if (ts - s.lastGazeChange > s.nextGazeIn) {
        s.targetGazeX = (Math.random() - 0.5) * 7;
        s.targetGazeY = (Math.random() - 0.5) * 3;
        s.lastGazeChange = ts;
        s.nextGazeIn = 1500 + Math.random() * 2500;
      }
      s.gazeX += (s.targetGazeX - s.gazeX) * 0.04;
      s.gazeY += (s.targetGazeY - s.gazeY) * 0.04;

      // ── 깜빡임 상태 머신 ──
      if (s.blinkPhase === "open") {
        if (ts - s.lastBlinkEnd > s.nextBlinkDelay) {
          s.blinkPhase = "closing";
          s.blinkStart = ts;
          s.nextBlinkDelay = 2500 + Math.random() * 3500;
        }
      } else if (s.blinkPhase === "closing") {
        if (ts - s.blinkStart >= BLINK_CLOSE_MS) {
          s.blinkPhase = "closed";
          s.blinkStart = ts;
        }
      } else if (s.blinkPhase === "closed") {
        if (ts - s.blinkStart >= BLINK_CLOSED_MS) {
          s.blinkPhase = "opening";
          s.blinkStart = ts;
        }
      } else if (s.blinkPhase === "opening") {
        if (ts - s.blinkStart >= BLINK_OPEN_MS) {
          s.blinkPhase = "open";
          s.lastBlinkEnd = ts;
        }
      }

      // 깜빡임 진행도 (0 = 완전히 뜸, 1 = 완전히 감음)
      let blinkT = 0;
      if (s.blinkPhase === "closing") {
        blinkT = Math.min(1, (ts - s.blinkStart) / BLINK_CLOSE_MS);
      } else if (s.blinkPhase === "closed") {
        blinkT = 1;
      } else if (s.blinkPhase === "opening") {
        const t = Math.min(1, (ts - s.blinkStart) / BLINK_OPEN_MS);
        blinkT = 1 - t;
      }

      // easeInOut 적용
      const easedBlink =
        blinkT < 0.5
          ? 2 * blinkT * blinkT
          : 1 - Math.pow(-2 * blinkT + 2, 2) / 2;

      // ── 눈꺼풀 그리기 (피부색 타원으로 덮기) ──
      if (easedBlink > 0.01) {
        const { r, g, b } = lm.skin_color;
        ctx.fillStyle = `rgb(${r},${g},${b})`;

        [lm.left_eye, lm.right_eye].forEach((eye) => {
          const cx = ((eye.outer.x + eye.inner.x) / 2) * W;
          const cy = ((eye.top.y + eye.bottom.y) / 2) * H;
          const rx = Math.abs(eye.outer.x - eye.inner.x) * W * 0.58;
          const eyeH = Math.abs(eye.top.y - eye.bottom.y) * H;
          const ry = eyeH * 0.72 * easedBlink;

          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // ── 시선 하이라이트 (홍채 위의 흰 반짝이) ──
      if (easedBlink < 0.6) {
        const alpha = 1 - easedBlink / 0.6;

        [lm.left_eye, lm.right_eye].forEach((eye) => {
          const eyeW = Math.abs(eye.outer.x - eye.inner.x) * W;
          const ix = eye.iris.x * W + s.gazeX;
          const iy = eye.iris.y * H + s.gazeY;
          const specR = Math.max(2, eyeW * 0.11);

          // 바깥 글로우
          const grd = ctx.createRadialGradient(
            ix - specR * 0.6,
            iy - specR * 0.6,
            0,
            ix - specR * 0.6,
            iy - specR * 0.6,
            specR * 1.8,
          );
          grd.addColorStop(0, `rgba(255,255,255,${0.75 * alpha})`);
          grd.addColorStop(1, `rgba(255,255,255,0)`);

          ctx.beginPath();
          ctx.arc(ix - specR * 0.6, iy - specR * 0.6, specR * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();

          // 중심 밝은 점
          ctx.beginPath();
          ctx.arc(ix - specR * 0.6, iy - specR * 0.6, specR * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
          ctx.fill();
        });
      }

      animRef.current = requestAnimationFrame(draw);
    },
    // draw는 refs만 참조하므로 deps 없음
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 이미지 로드 시 캔버스 크기 맞추고 애니메이션 시작
  const handleImageLoad = useCallback(() => {
    syncCanvasSize();
    if (animRef.current) cancelAnimationFrame(animRef.current);
    // 상태 초기화
    stateRef.current = {
      blinkPhase: "open",
      blinkStart: 0,
      lastBlinkEnd: 0,
      nextBlinkDelay: 2500 + Math.random() * 3000,
      gazeX: 0,
      gazeY: 0,
      targetGazeX: 0,
      targetGazeY: 0,
      lastGazeChange: 0,
      nextGazeIn: 1500 + Math.random() * 2000,
    };
    animRef.current = requestAnimationFrame(draw);
  }, [syncCanvasSize, draw]);

  // 이미 캐시된 이미지 처리
  useEffect(() => {
    if (imgRef.current?.complete) {
      handleImageLoad();
    }
  }, [handleImageLoad]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // base64가 바뀔 때 랜드마크 재탐지
  useEffect(() => {
    if (!imageBase64) return;
    landmarksRef.current = null;

    diaryAiApi
      .getFaceLandmarks(imageBase64)
      .then((res) => {
        landmarksRef.current = res.data as Landmarks;
      })
      .catch((e) => {
        console.warn("[CharacterCanvas] 랜드마크 탐지 실패:", e);
      });
  }, [imageBase64]);

  // 창 크기 변경 시 캔버스 재동기화
  useEffect(() => {
    const onResize = () => syncCanvasSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncCanvasSize]);

  return (
    <div style={{ position: "relative", display: "block" }}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt={alt ?? "우리 아이 캐릭터"}
        className={className}
        style={style}
        onLoad={handleImageLoad}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          borderRadius: "inherit",
        }}
      />
    </div>
  );
};

export default CharacterCanvas;
