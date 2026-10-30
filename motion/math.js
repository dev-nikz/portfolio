export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const range = (value, start, end) => clamp((value - start) / (end - start));
export const lerp = (a, b, t) => a + (b - a) * t;
export const cubic = t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
export const easeOut = t => 1 - (1 - t) ** 3;
export const damp = (current, target, dt, settling = .18) => current + (target - current) * (1 - Math.exp(-Math.min(dt, .1) / settling));
export function storyFrame(progress, index, total = 6) {
  const spread = cubic(range(progress, index * .008, .18 + index * .008));
  const gather = cubic(range(progress, .88 + (total - 1 - index) * .006, .99));
  return {
    spread: spread * (1 - gather),
    gather,
    dim: .95 * easeOut(range(progress, .29, .38)) * (1 - range(progress, .88, .97)),
    scale: lerp(.12, 1, spread) * (1 - gather * .84),
  };
}
export const sceneAt = p => p < .32 ? 0 : p < .52 ? 1 : p < .75 ? 2 : 3;
export const processAt = p => Math.min(3, Math.floor(clamp(p) * 4));
