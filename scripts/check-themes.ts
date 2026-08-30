import { themeSemanticColors, themes } from '../src/themes';

function luminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g);
  if (!channels || channels.length !== 3) throw new Error(`Invalid color: ${hex}`);
  return channels
    .map((channel) => parseInt(channel, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const failures: string[] = [];
const ids = new Set<string>();

for (const theme of themes) {
  if (ids.has(theme.id)) failures.push(`${theme.id}: duplicate id`);
  ids.add(theme.id);

  const { colors } = theme;
  const semantic = themeSemanticColors[theme.category];
  const pairs: [string, string, string][] = [
    ['text/canvas', colors.text, colors.canvas],
    ['text/surface', colors.text, colors.surface],
    ['text/wash', colors.text, colors.wash],
    ['muted/canvas', colors.muted, colors.canvas],
    ['muted/surface', colors.muted, colors.surface],
    ['muted/wash', colors.muted, colors.wash],
    ['accent/canvas', colors.accent, colors.canvas],
    ['accent/surface', colors.accent, colors.surface],
    ['accent/wash', colors.accent, colors.wash],
    ['frame text/frame', colors.frameText, colors.frame],
    ['frame text/frame surface', colors.frameText, colors.frameSurface],
    ['frame muted/frame', colors.frameMuted, colors.frame],
    ['frame muted/frame surface', colors.frameMuted, colors.frameSurface],
    ['frame accent/frame', colors.frameAccent, colors.frame],
    ['frame accent/frame surface', colors.frameAccent, colors.frameSurface],
    ['on accent/accent', colors.onAccent, colors.accent],
    ['success/canvas', semantic.success, colors.canvas],
    ['danger/canvas', semantic.danger, colors.canvas],
    ['warning/canvas', semantic.warning, colors.canvas],
    ['success/surface', semantic.success, colors.surface],
    ['danger/surface', semantic.danger, colors.surface],
    ['warning/surface', semantic.warning, colors.surface],
    ['frame success/frame', semantic.frameSuccess, colors.frame],
    ['frame danger/frame', semantic.frameDanger, colors.frame],
    ['frame warning/frame', semantic.frameWarning, colors.frame],
  ];

  for (const [label, foreground, background] of pairs) {
    const ratio = contrast(foreground, background);
    if (ratio < 4.5) failures.push(`${theme.id}: ${label} ${ratio.toFixed(2)}:1`);
  }
}

if (failures.length) {
  console.error(`Theme validation failed:\n${failures.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`${themes.length} themes passed WCAG AA color-pair validation.`);
}
