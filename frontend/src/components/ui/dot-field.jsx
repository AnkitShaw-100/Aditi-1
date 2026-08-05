import { useEffect, useRef, memo } from "react";

import "./DotField.css";

const TWO_PI = Math.PI * 2;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutQuad(t) {
  const value = clamp(t, 0, 1);
  return 1 - (1 - value) * (1 - value);
}

function parseColor(input) {
  if (typeof input !== "string") {
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  const value = input.trim();

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const expand = (chunk) => Number.parseInt(chunk.repeat(2), 16);

    if (hex.length === 3 || hex.length === 4) {
      return {
        r: expand(hex[0]),
        g: expand(hex[1]),
        b: expand(hex[2]),
        a: hex.length === 4 ? expand(hex[3]) / 255 : 1,
      };
    }

    if (hex.length === 6 || hex.length === 8) {
      return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
        a: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
      };
    }
  }

  const rgbaMatch = value.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/i
  );

  if (rgbaMatch) {
    return {
      r: Number.parseFloat(rgbaMatch[1]),
      g: Number.parseFloat(rgbaMatch[2]),
      b: Number.parseFloat(rgbaMatch[3]),
      a: rgbaMatch[4] === undefined ? 1 : Number.parseFloat(rgbaMatch[4]),
    };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

function mixColor(a, b, t) {
  const value = clamp(t, 0, 1);
  return {
    r: a.r + (b.r - a.r) * value,
    g: a.g + (b.g - a.g) * value,
    b: a.b + (b.b - a.b) * value,
    a: a.a + (b.a - a.a) * value,
  };
}

function toRgba(color) {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(
    color.b
  )}, ${clamp(color.a, 0, 1)})`;
}

function normalizePadding(padding) {
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }

  if (!padding || typeof padding !== "object") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const x = padding.x ?? 0;
  const y = padding.y ?? 0;

  return {
    top: padding.top ?? y,
    right: padding.right ?? x,
    bottom: padding.bottom ?? y,
    left: padding.left ?? x,
  };
}

function resolveElementExclusion(canvas, selector, padding) {
  if (!selector) return null;

  const parent = canvas.parentElement;
  const root = parent?.closest("[data-dot-exclusion-root]");
  const target = root?.querySelector(selector);
  if (!parent || !target) return null;

  const parentRect = parent.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const inset = normalizePadding(padding);

  return {
    left: targetRect.left - parentRect.left - inset.left,
    right: targetRect.right - parentRect.left + inset.right,
    top: targetRect.top - parentRect.top - inset.top,
    bottom: targetRect.bottom - parentRect.top + inset.bottom,
  };
}

function isInsideRect(point, rect) {
  return (
    rect &&
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

const DotField = memo(
  ({
    dotRadius = 1.5,
    dotSpacing = 14,
    cursorRadius = 500,
    cursorForce = 0.1,
    bulgeOnly = true,
    bulgeStrength = 67,
      sparkle = false,
      waveAmplitude = 0,
      gradientFrom = "rgba(201, 154, 74, 0.96)",
      gradientTo = "rgba(201, 154, 74, 0.9)",
    exclusionSelector = null,
    exclusionPadding = 0,
    className = "",
    ...rest
  }) => {
    const canvasRef = useRef(null);
    const dotsRef = useRef([]);
    const mouseRef = useRef({
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      speed: 0,
    });
    const rafRef = useRef(null);
    const sizeRef = useRef({ w: 0, h: 0 });
    const propsRef = useRef({});
    const rebuildRef = useRef(null);
    const exclusionRef = useRef(null);
    const engagement = useRef(0);

    propsRef.current = {
      dotRadius,
      dotSpacing,
      cursorRadius,
      cursorForce,
      bulgeOnly,
      bulgeStrength,
      sparkle,
      waveAmplitude,
      baseColor: parseColor("rgba(201, 154, 74, 0.38)"),
      gradientFromColor: parseColor(gradientFrom),
      gradientToColor: parseColor(gradientTo),
      exclusionSelector,
      exclusionPadding,
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return undefined;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let resizeTimer = 0;

      function buildDots(w, h) {
        const p = propsRef.current;
        const step = p.dotRadius + p.dotSpacing;
        const cols = Math.max(1, Math.floor(w / step));
        const rows = Math.max(1, Math.floor(h / step));
        const padX = (w % step) / 2;
        const padY = (h % step) / 2;
        const dots = [];

        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const ax = padX + col * step + step / 2;
            const ay = padY + row * step + step / 2;
            dots.push({ ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay });
          }
        }

        dotsRef.current = dots;
      }

      function doResize() {
        const parent = canvas.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        const w = Math.max(1, rect.width);
        const h = Math.max(1, rect.height);

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        sizeRef.current = { w, h };

        buildDots(w, h);
        refreshExclusion();
      }

      // getBoundingClientRect forces a synchronous layout, so this is cached
      // rather than recomputed inside the animation frame. The rect only moves
      // when the layout does, and every such change already routes through
      // doResize via the ResizeObserver below.
      function refreshExclusion() {
        const p = propsRef.current;
        exclusionRef.current = resolveElementExclusion(
          canvas,
          p.exclusionSelector,
          p.exclusionPadding
        );
      }

      function scheduleResize() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(doResize, 100);
      }

      function onMouseMove(event) {
        const parent = canvas.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        mouseRef.current.x = event.clientX - rect.left;
        mouseRef.current.y = event.clientY - rect.top;
      }

      function updateMouseSpeed() {
        const m = mouseRef.current;
        const dx = m.prevX - m.x;
        const dy = m.prevY - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        m.speed += (dist - m.speed) * 0.5;
        if (m.speed < 0.001) m.speed = 0;
        m.prevX = m.x;
        m.prevY = m.y;
      }

      const speedInterval = window.setInterval(updateMouseSpeed, 20);
      let frameCount = 0;

      function tick() {
        frameCount += 1;
        const dots = dotsRef.current;
        const m = mouseRef.current;
        const { w, h } = sizeRef.current;
        const p = propsRef.current;
        const len = dots.length;
        const time = frameCount * 0.02;
        // Refreshed on a cadence rather than every frame: the layout read is
        // the expensive part, and the rect only shifts while content animates.
        if (frameCount % 5 === 0) {
          refreshExclusion();
        }

        const exclusion = exclusionRef.current;

        const targetEngagement = Math.min(m.speed / 5, 1);
        // Smooth engagement keeps the field from flickering when the cursor slows.
        engagement.current += (targetEngagement - engagement.current) * 0.06;
        if (engagement.current < 0.001) engagement.current = 0;

        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = 1;

        const cr = p.cursorRadius;
        const crSq = cr * cr;
        const rad = p.dotRadius / 2;

        for (let i = 0; i < len; i += 1) {
          const d = dots[i];
          const dx = m.x - d.ax;
          const dy = m.y - d.ay;
          const distSq = dx * dx + dy * dy;
          let influence = 0;

          if (distSq < crSq && engagement.current > 0.01) {
            const dist = Math.sqrt(distSq);
            influence = easeOutQuad(1 - dist / cr);
            const angle = Math.atan2(dy, dx);

            if (p.bulgeOnly) {
              const push = influence * p.bulgeStrength * engagement.current;
              d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
              d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
            } else {
              const move = (500 / Math.max(dist, 1)) * (m.speed * p.cursorForce);
              d.vx += Math.cos(angle) * -move;
              d.vy += Math.sin(angle) * -move;
            }
          } else if (p.bulgeOnly) {
            d.sx += (d.ax - d.sx) * 0.1;
            d.sy += (d.ay - d.sy) * 0.1;
          }

          if (!p.bulgeOnly) {
            d.vx *= 0.9;
            d.vy *= 0.9;
            d.x = d.ax + d.vx;
            d.y = d.ay + d.vy;
            d.sx += (d.x - d.sx) * 0.1;
            d.sy += (d.y - d.sy) * 0.1;
          }

          let drawX = d.sx;
          let drawY = d.sy;
          if (p.waveAmplitude > 0) {
            drawY += Math.sin(d.ax * 0.03 + time) * p.waveAmplitude;
            drawX += Math.cos(d.ay * 0.03 + time * 0.7) * p.waveAmplitude * 0.5;
          }

          if (isInsideRect({ x: drawX, y: drawY }, exclusion)) {
            continue;
          }

          const activeTone =
            influence < 0.55
              ? mixColor(p.baseColor, p.gradientToColor, influence / 0.55)
              : mixColor(
                  p.gradientToColor,
                  p.gradientFromColor,
                  (influence - 0.55) / 0.45
                );
          const finalColor = influence > 0 ? activeTone : p.baseColor;
          const dotScale = 1 + influence * 0.55;

          ctx.fillStyle = toRgba(finalColor);
          ctx.beginPath();

          if (p.sparkle) {
            const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
            if ((hash % 100) < 3) {
              ctx.arc(drawX, drawY, rad * 1.8 * dotScale, 0, TWO_PI);
            } else {
              ctx.arc(drawX, drawY, rad * dotScale, 0, TWO_PI);
            }
          } else {
            ctx.arc(drawX, drawY, rad * dotScale, 0, TWO_PI);
          }

          ctx.fill();
        }

        rafRef.current = window.requestAnimationFrame(tick);
      }

      doResize();
      window.addEventListener("resize", scheduleResize);
      window.addEventListener("mousemove", onMouseMove, { passive: true });

      // The host section can change height without the window resizing (an
      // accordion opening, fonts loading, content swapping). Without this the
      // grid keeps its old height and stops mid-section with a hard edge.
      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(scheduleResize);

      if (observer && canvas.parentElement) {
        observer.observe(canvas.parentElement);
      }

      rafRef.current = window.requestAnimationFrame(tick);

      rebuildRef.current = () => {
        const { w, h } = sizeRef.current;
        if (w > 0 && h > 0) {
          buildDots(w, h);
        }
        refreshExclusion();
      };

      return () => {
        window.cancelAnimationFrame(rafRef.current);
        window.clearInterval(speedInterval);
        window.clearTimeout(resizeTimer);
        observer?.disconnect();
        window.removeEventListener("resize", scheduleResize);
        window.removeEventListener("mousemove", onMouseMove);
      };
    }, []);

    useEffect(() => {
      rebuildRef.current?.();
    }, [dotRadius, dotSpacing, gradientFrom, gradientTo]);

    return (
      <div className={`dot-field-container ${className}`.trim()} {...rest}>
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    );
  }
);

DotField.displayName = "DotField";

export default DotField;
