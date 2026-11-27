import { useEffect, useRef } from 'react';
import { drawCampHeroFigure } from '../game/characterAnim';
import { CharacterId } from '../game/types';

/** Small code-drawn hero portrait (same renderer as the camp figures), gently breathing. */
export function HeroPortrait({
  id,
  size = 56,
  accent = '#e5a93c',
  animate = true,
}: {
  id: CharacterId;
  size?: number;
  accent?: string;
  animate?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    let raf = 0;
    const start = performance.now();
    const draw = () => {
      const t = (performance.now() - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const g = ctx.createRadialGradient(size / 2, size * 0.55, 2, size / 2, size * 0.55, size * 0.6);
      g.addColorStop(0, `${accent}33`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      const scale = (size / 64) * 0.95;
      drawCampHeroFigure(ctx, id, size / 2, size * 0.94, 1, scale, t, false);
      if (animate) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [id, size, accent, animate]);
  return <canvas ref={ref} style={{ width: size, height: size }} className="shrink-0" aria-hidden="true" />;
}
