"use client";

import { useEffect, useRef } from "react";

/**
 * Cinematic deep-space background: canvas-rendered stars, falling stars,
 * and diagonal green meteors, plus a subtle cursor-driven parallax.
 *
 * Why canvas instead of N absolutely-positioned DOM nodes: with hundreds
 * of stars and constant meteor spawns, DOM nodes would mean hundreds of
 * elements getting restyled every frame (layout/paint cost, GC churn from
 * className/style updates). A single canvas with one rAF loop keeps this
 * at 60fps regardless of star count — the whole scene is one draw call
 * per frame, no reflow.
 *
 * Fixed + pointer-events-none + negative z-index so it never intercepts
 * clicks and never affects document flow/scroll height.
 */

interface Star {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  phase: number;
}

interface Streak {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  color: "white" | "green";
  width: number;
}

const GREEN = "34, 197, 94";
const WHITE = "255, 255, 255";

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let stars: Star[] = [];
    let streaks: Streak[] = [];
    let rafId = 0;
    let lastMeteorSpawn = 0;
    let lastFallingStarSpawn = 0;
    let nextMeteorDelay = randomBetween(2500, 6000);
    let nextFallingStarDelay = randomBetween(400, 1400);

    // Parallax target — eased toward on every frame so movement feels
    // fluid rather than snapping directly to the pointer.
    const pointer = { x: 0, y: 0 };
    const parallax = { x: 0, y: 0 };

    function randomBetween(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function buildStars() {
      const density = 1 / 2600; // stars per px^2 — denser field than before
      const count = Math.min(Math.floor(width * height * density), 650);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.3 + 0.35,
        baseOpacity: Math.random() * 0.65 + 0.35,
        twinkleSpeed: Math.random() * 0.0015 + 0.0004,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function spawnMeteor() {
      // Diagonal green meteor: top area, travels down-right.
      const startX = randomBetween(-100, width * 0.8);
      streaks.push({
        x: startX,
        y: randomBetween(-50, height * 0.25),
        vx: randomBetween(3.5, 6),
        vy: randomBetween(2.5, 4.5),
        length: randomBetween(120, 220),
        life: 0,
        maxLife: randomBetween(45, 70),
        color: "green",
        width: randomBetween(1.5, 2.5),
      });
    }

    function spawnFallingStar() {
      const startX = randomBetween(0, width);
      streaks.push({
        x: startX,
        y: randomBetween(-50, 0),
        vx: randomBetween(-0.6, 0.6),
        vy: randomBetween(4, 7),
        length: randomBetween(40, 90),
        life: 0,
        maxLife: randomBetween(35, 55),
        color: "white",
        width: randomBetween(0.8, 1.4),
      });
    }

    function onPointerMove(e: PointerEvent) {
      pointer.x = (e.clientX / width - 0.5) * 2;
      pointer.y = (e.clientY / height - 0.5) * 2;
    }

    let resizeTimeout: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 120);
    }

    function draw(timestamp: number) {
      parallax.x += (pointer.x - parallax.x) * 0.02;
      parallax.y += (pointer.y - parallax.y) * 0.02;

      ctx.clearRect(0, 0, width, height);

      const offsetX = parallax.x * 10;
      const offsetY = parallax.y * 8;

      // Stars
      for (const star of stars) {
        const twinkle =
          Math.sin(timestamp * star.twinkleSpeed + star.phase) * 0.35 + 0.65;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${WHITE}, ${star.baseOpacity * twinkle})`;
        ctx.arc(star.x + offsetX, star.y + offsetY, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Meteor / falling-star spawn scheduling
      if (timestamp - lastMeteorSpawn > nextMeteorDelay) {
        spawnMeteor();
        lastMeteorSpawn = timestamp;
        nextMeteorDelay = randomBetween(2500, 6500);
      }
      if (timestamp - lastFallingStarSpawn > nextFallingStarDelay) {
        spawnFallingStar();
        lastFallingStarSpawn = timestamp;
        nextFallingStarDelay = randomBetween(500, 1600);
      }

      // Streaks (meteors + falling stars)
      streaks = streaks.filter((s) => s.life < s.maxLife);
      for (const s of streaks) {
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;

        const fadeIn = Math.min(s.life / 6, 1);
        const fadeOut = Math.min((s.maxLife - s.life) / 12, 1);
        const opacity = Math.max(Math.min(fadeIn, fadeOut), 0);

        const tailX = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.length;
        const tailY = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.length;
        const color = s.color === "green" ? GREEN : WHITE;

        const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(${color}, ${opacity})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = s.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        if (s.color === "green") {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${color}, ${opacity})`;
          ctx.shadowColor = `rgba(${color}, ${opacity})`;
          ctx.shadowBlur = 8;
          ctx.arc(s.x, s.y, s.width, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20"
    />
  );
}
