import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

// ── Color stops throughout the day (hour → HSL hue, saturation%, lightness%) ──
// These control the ACCENT color (buttons, links, active states)
const COLOR_STOPS: [hour: number, h: number, s: number, l: number][] = [
  [  0,    250,  55,  45 ],   // midnight — deep indigo
  [  4,    260,  50,  42 ],   // late night — dark purple
  [  5.5,  340,  65,  55 ],   // pre-dawn — rose
  [  7,     15,  80,  58 ],   // sunrise — coral/orange
  [  9,     35,  78,  52 ],   // morning — warm amber
  [ 12,    200,  70,  48 ],   // noon — teal blue
  [ 14,    235,  65,  55 ],   // early afternoon — blue
  [ 16,    255,  58,  55 ],   // afternoon — indigo (close to default)
  [ 18,     25,  85,  52 ],   // golden hour — warm orange
  [ 19.5,  15,   75,  50 ],   // sunset — deep coral
  [ 20.5,  280,  55,  48 ],   // dusk — purple
  [ 22,    255,  50,  45 ],   // evening — muted indigo
  [ 24,    250,  55,  45 ],   // midnight (wraps) — deep indigo
];

// ── Brightness curve: 0 = full dark, 1 = full light ──────────────────────────
// Controls the overall lightness of backgrounds, text, borders.
// Transition is compressed into short windows so we don't linger in the
// muddy mid-range — the jump from dark→light and light→dark is fast.
const BRIGHTNESS_STOPS: [hour: number, brightness: number][] = [
  [  0,    0.55 ],   // midnight — dimmed but still light
  [  5.5,  0.55 ],   // late night — same
  [  6,    0.65 ],   // first light — starting to brighten
  [  7,    0.95 ],   // sunrise — nearly full
  [  7.5,  1    ],   // morning — full light
  [ 17.5,  1    ],   // late afternoon — still full
  [ 18,    0.95 ],   // golden hour — just starting to dim
  [ 19.5,  0.65 ],   // sunset — noticeably dimmer
  [ 21,    0.55 ],   // evening — warm dim
  [ 24,    0.55 ],   // midnight — dimmed
];

// ── Debug override store (singleton) ─────────────────────────────────────────

type DebugState = { enabled: boolean; hour: number };

let debugState: DebugState = { enabled: false, hour: 12 };
const listeners = new Set<() => void>();

function emitChange() {
  for (const fn of listeners) fn();
}

function getDebugSnapshot(): DebugState {
  return debugState;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setDebugTime(hour: number): void {
  debugState = { ...debugState, hour };
  emitChange();
}

export function setDebugEnabled(enabled: boolean): void {
  debugState = { ...debugState, enabled };
  emitChange();
}

/** Hook to read the current debug state reactively */
export function useDebugTime(): DebugState & { setHour: (h: number) => void; setEnabled: (e: boolean) => void } {
  const state = useSyncExternalStore(subscribe, getDebugSnapshot);
  const setHour = useCallback((h: number) => setDebugTime(h), []);
  const setEnabled = useCallback((e: boolean) => setDebugEnabled(e), []);
  return { ...state, setHour, setEnabled };
}

// ── Color math ───────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHue(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return ((a + diff * t) % 360 + 360) % 360;
}

function fractionalHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

function getEffectiveHour(): number {
  return debugState.enabled ? debugState.hour : fractionalHour();
}

function interpolateStops(
  stops: [number, number, number, number][],
  hour: number,
): [number, number, number] {
  for (let i = 0; i < stops.length - 1; i++) {
    const [h0, v0a, v0b, v0c] = stops[i]!;
    const [h1, v1a, v1b, v1c] = stops[i + 1]!;
    if (hour >= h0 && hour <= h1) {
      const t = (hour - h0) / (h1 - h0);
      return [lerpHue(v0a, v1a, t), lerp(v0b, v1b, t), lerp(v0c, v1c, t)];
    }
  }
  return [stops[0]![1], stops[0]![2], stops[0]![3]];
}

/** Hermite smoothstep — flattens near 0 and 1, steeper through the middle */
function smoothstep(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

function getBrightness(hour: number): number {
  for (let i = 0; i < BRIGHTNESS_STOPS.length - 1; i++) {
    const [h0, b0] = BRIGHTNESS_STOPS[i]!;
    const [h1, b1] = BRIGHTNESS_STOPS[i + 1]!;
    if (hour >= h0 && hour <= h1) {
      const t = (hour - h0) / (h1 - h0);
      return lerp(b0, b1, t);
    }
  }
  return 0;
}

/** Raw brightness with smoothstep applied for snappier light↔dark transition */
function getEasedBrightness(hour: number): number {
  return smoothstep(getBrightness(hour));
}

// ── CSS variable names we override (so we can clean them up) ─────────────────

const DYNAMIC_VARS = [
  // Accent
  '--accent', '--accent-soft', '--accent-glow', '--accent-text',
  '--btn-bg', '--btn-hover', '--btn-text',
  '--btn-secondary-bg', '--btn-secondary-text', '--btn-secondary-hover',
  '--nav-active-bg', '--nav-hover-bg', '--nav-active', '--nav-inactive',
  '--focus-ring',
  // Backgrounds
  '--bg', '--bg-page', '--sidebar-bg', '--bg-card',
  '--bg-input', '--bg-check', '--bg-badge',
  // Text
  '--text', '--text-secondary', '--text-muted', '--text-done', '--text-badge', '--label',
  // Borders
  '--border', '--border-input', '--border-nav',
  // Shadows
  '--shadow-card', '--shadow-hover', '--shadow-elevated',
  // Priority
  '--priority-high-bg', '--priority-high-text',
  '--priority-med-bg', '--priority-med-text',
  '--priority-low-bg', '--priority-low-text',
  '--overdue-bg', '--overdue-text',
  // Progress
  '--progress-bg',
  '--streak-fire', '--streak-risk',
] as const;

/** Remove all dynamic overrides, letting CSS defaults take over */
function clearDynamicColors(): void {
  const root = document.documentElement;
  for (const v of DYNAMIC_VARS) {
    root.style.removeProperty(v);
  }
}

// ── HSL helper ──────────────────────────────────────────────────────────────

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${a.toFixed(3)})`;
}

// ── Apply all theme colors ──────────────────────────────────────────────────

/**
 * Bimodal interpolation: avoids the ugly 15-85% lightness mid-range.
 *
 * When `b` (brightness) is below 0.5 we stay in "dark mode" lightness range,
 * when above 0.5 we jump to "light mode" range.  Within each mode, `t` (0–1)
 * gives soft variation so the theme still shifts subtly.
 */
function bimodal(darkLo: number, darkHi: number, lightLo: number, lightHi: number, b: number): number {
  if (b <= 0.5) {
    const t = b * 2;          // 0→1 within the dark half
    return lerp(darkLo, darkHi, t);
  }
  const t = (b - 0.5) * 2;   // 0→1 within the light half
  return lerp(lightLo, lightHi, t);
}

/** Apply time-based colors to CSS custom properties */
function applyTimeColors(): void {
  // Only apply in dynamic mode
  const themeAttr = document.documentElement.getAttribute('data-theme');
  if (themeAttr !== 'dynamic' && (themeAttr === 'light' || themeAttr === 'dark')) {
    clearDynamicColors();
    return;
  }

  const hour = getEffectiveHour();
  const [h, s, l] = interpolateStops(COLOR_STOPS, hour);
  const b = getEasedBrightness(hour); // 0 = dark, 1 = light (smoothstepped)
  const isDark = b <= 0.5;
  // t = 0→1 within the light half (for smooth variation within light palette)
  const t = isDark ? 0 : (b - 0.5) * 2;

  const root = document.documentElement;

  // ── Accent colors (hue-based, brightness-adjusted) ──────────────────────
  const accentL = isDark ? Math.min(l + 18, 78) : l;
  const accent = hsl(h, s, accentL);

  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-text', '#fff');
  root.style.setProperty('--accent-soft', isDark
    ? hsla(h, s, accentL, 0.10)
    : hsl(h, Math.max(s - 15, 30), bimodal(90, 90, 90, 95, b)));
  root.style.setProperty('--accent-glow', hsla(h, s, accentL, 0.20));

  // ── Buttons ─────────────────────────────────────────────────────────────
  root.style.setProperty('--btn-bg', accent);
  root.style.setProperty('--btn-text', '#fff');
  root.style.setProperty('--btn-hover', isDark
    ? hsl(h, s, Math.min(accentL + 8, 85))
    : hsl(h, s, Math.max(accentL - 7, 25)));
  root.style.setProperty('--btn-secondary-bg', isDark
    ? `rgba(255, 255, 255, 0.08)`
    : `#f3f4f6`);
  root.style.setProperty('--btn-secondary-text', isDark ? '#c0c3d8' : '#374151');
  root.style.setProperty('--btn-secondary-hover', isDark
    ? `rgba(255, 255, 255, 0.12)`
    : `#e5e7eb`);

  // ── Navigation ──────────────────────────────────────────────────────────
  root.style.setProperty('--nav-active-bg', hsla(h, s, accentL, isDark ? 0.10 : 0.07));
  root.style.setProperty('--nav-hover-bg', isDark
    ? `rgba(255, 255, 255, 0.04)`
    : `rgba(0, 0, 0, 0.03)`);
  root.style.setProperty('--nav-active', isDark ? '#eeeef6' : '#111827');
  root.style.setProperty('--nav-inactive', isDark ? '#6b6f85' : '#6b7280');

  // ── Focus ring ──────────────────────────────────────────────────────────
  const ringBgL = bimodal(5, 12, 96, 100, b);
  const ringBg = hsl(h, isDark ? 15 : 0, ringBgL);
  root.style.setProperty('--focus-ring',
    `0 0 0 2px ${ringBg}, 0 0 0 4px ${hsla(h, s, accentL, 0.4)}`);

  // ── Backgrounds (light-based with visible dimming at night) ─────────────
  // Night (b≈0.55): slightly dimmer/warmer. Day (b=1): full brightness.
  const bgSat = lerp(20, 12, t);  // more hue saturation at night for warmth
  root.style.setProperty('--bg',        hsl(h, lerp(8, 0, t),   bimodal(5, 12, 90, 100, b)));
  root.style.setProperty('--bg-page',   hsl(h, bgSat,           bimodal(3, 10, 88, 96.5, b)));
  root.style.setProperty('--sidebar-bg', hsl(h, lerp(18, 10, t), bimodal(2.5, 8, 90, 98, b)));
  root.style.setProperty('--bg-card',   hsl(h, lerp(12, 3, t),  bimodal(7, 14, 93, 100, b)));
  root.style.setProperty('--bg-input', isDark
    ? `rgba(255, 255, 255, ${lerp(0.06, 0.10, b * 2).toFixed(3)})`
    : hsl(h, lerp(8, 3, t), bimodal(95, 95, 92, 100, b)));
  root.style.setProperty('--bg-check', isDark
    ? `rgba(255, 255, 255, ${lerp(0.06, 0.10, b * 2).toFixed(3)})`
    : hsl(h, lerp(8, 3, t), bimodal(95, 95, 92, 100, b)));
  root.style.setProperty('--bg-badge', isDark
    ? `rgba(255, 255, 255, 0.08)`
    : hsl(h, lerp(6, 2, t), bimodal(90, 90, 93, 96, b)));

  // ── Text (light-based: dark text on light bg, slightly softer at night) ──
  root.style.setProperty('--text',           hsl(240, isDark ? 10 : 14, bimodal(88, 94, 8, 16, b)));
  root.style.setProperty('--text-secondary', hsl(230, isDark ? 12 : 10, bimodal(62, 72, 28, 40, b)));
  root.style.setProperty('--text-muted',     hsl(230, isDark ? 10 : 8,  bimodal(42, 52, 38, 50, b)));
  root.style.setProperty('--text-done',      hsl(230, isDark ? 8 : 6,   bimodal(24, 34, 56, 68, b)));
  root.style.setProperty('--text-badge', isDark ? '#a0a3b8' : hsl(220, 10, lerp(35, 34, t)));
  root.style.setProperty('--label', isDark ? '#9ca0b8' : hsl(220, 12, lerp(28, 22, t)));

  // ── Borders ─────────────────────────────────────────────────────────────
  if (isDark) {
    const ba = lerp(0.06, 0.10, b * 2);
    root.style.setProperty('--border', `rgba(255, 255, 255, ${ba.toFixed(3)})`);
    root.style.setProperty('--border-input', `rgba(255, 255, 255, ${(ba + 0.04).toFixed(3)})`);
    root.style.setProperty('--border-nav', `rgba(255, 255, 255, ${Math.max(ba - 0.02, 0.03).toFixed(3)})`);
  } else {
    // Light mode borders: slightly more visible at night for contrast on dimmer bg
    root.style.setProperty('--border', hsl(220, lerp(8, 6, t), lerp(82, 90, t)));
    root.style.setProperty('--border-input', hsl(220, lerp(10, 8, t), lerp(76, 84, t)));
    root.style.setProperty('--border-nav', hsl(220, lerp(6, 4, t), lerp(88, 94, t)));
  }

  // ── Shadows ─────────────────────────────────────────────────────────────
  if (isDark) {
    const a = lerp(0.5, 0.35, b * 2);
    const glow = lerp(0.04, 0.06, b * 2);
    root.style.setProperty('--shadow-card',
      `0 1px 3px rgba(0,0,0,${a.toFixed(3)}), 0 0 0 1px rgba(255,255,255,${glow.toFixed(3)})`);
    root.style.setProperty('--shadow-hover',
      `0 4px 16px rgba(0,0,0,${(a * 0.8).toFixed(3)}), 0 0 0 1px rgba(255,255,255,${(glow * 1.5).toFixed(3)})`);
    root.style.setProperty('--shadow-elevated',
      `0 8px 24px rgba(0,0,0,${a.toFixed(3)}), 0 0 0 1px rgba(255,255,255,${(glow * 1.5).toFixed(3)})`);
  } else {
    root.style.setProperty('--shadow-card',
      `0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)`);
    root.style.setProperty('--shadow-hover',
      `0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)`);
    root.style.setProperty('--shadow-elevated',
      `0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)`);
  }

  // ── Priority colors ─────────────────────────────────────────────────────
  if (isDark) {
    root.style.setProperty('--priority-high-bg', 'rgba(239, 68, 68, 0.1)');
    root.style.setProperty('--priority-high-text', '#f87171');
    root.style.setProperty('--priority-med-bg', 'rgba(245, 158, 11, 0.1)');
    root.style.setProperty('--priority-med-text', '#fbbf24');
    root.style.setProperty('--priority-low-bg', hsla(h, s, accentL, 0.08));
    root.style.setProperty('--priority-low-text', accent);
    root.style.setProperty('--overdue-bg', 'rgba(239, 68, 68, 0.1)');
    root.style.setProperty('--overdue-text', '#f87171');
  } else {
    root.style.setProperty('--priority-high-bg', '#fef2f2');
    root.style.setProperty('--priority-high-text', '#dc2626');
    root.style.setProperty('--priority-med-bg', '#fffbeb');
    root.style.setProperty('--priority-med-text', '#d97706');
    root.style.setProperty('--priority-low-bg', '#f0f4ff');
    root.style.setProperty('--priority-low-text', '#6b7280');
    root.style.setProperty('--overdue-bg', '#fef2f2');
    root.style.setProperty('--overdue-text', '#dc2626');
  }

  // ── Progress ────────────────────────────────────────────────────────────
  root.style.setProperty('--progress-bg', isDark
    ? `rgba(255, 255, 255, 0.08)`
    : `#e5e7eb`);
  root.style.setProperty('--streak-fire', isDark ? '#fb923c' : '#f97316');
  root.style.setProperty('--streak-risk', isDark ? '#fbbf24' : '#f59e0b');
}

// ── Main hook ────────────────────────────────────────────────────────────────

export function useTimeTheme(): void {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    applyTimeColors();

    intervalRef.current = setInterval(applyTimeColors, 60_000);

    // Re-apply when data-theme changes (theme toggle)
    const observer = new MutationObserver(() => applyTimeColors());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Re-apply when system dark/light preference changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const mqHandler = () => applyTimeColors();
    mq.addEventListener('change', mqHandler);

    // Re-apply when debug state changes
    const unsub = subscribe(() => applyTimeColors());

    return () => {
      clearInterval(intervalRef.current);
      observer.disconnect();
      mq.removeEventListener('change', mqHandler);
      unsub();
    };
  }, []);
}
