import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getThemeById, themeSemanticColors } from '../themes';

export default function ThemeApplicator() {
  const themeId = useStore((state) => state.themeId);
  const language = useStore((state) => state.language);
  const customFontBase64 = useStore((state) => state.customFontBase64);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const theme = getThemeById(themeId);
    const colors = theme.colors;
    const semantic = themeSemanticColors[theme.category];
    const isDark = theme.category !== 'light';
    const properties: Record<string, string> = {
      '--bg-color': colors.canvas,
      '--card-bg': colors.surface,
      '--border-color': colors.border,
      '--hover-bg': `color-mix(in srgb, ${colors.surface} 92%, ${colors.text})`,
      '--text-color': colors.muted,
      '--text-bright': colors.text,
      '--accent1-color': colors.accent,
      '--accent2-color': `color-mix(in srgb, ${colors.accent} 82%, ${colors.text})`,
      '--accent-on-color': colors.onAccent,
      '--success-color': semantic.success,
      '--danger-color': semantic.danger,
      '--warning-color': semantic.warning,
      '--success-paper': semantic.success,
      '--danger-paper': semantic.danger,
      '--warning-paper': semantic.warning,
      '--success-frame': semantic.frameSuccess,
      '--danger-frame': semantic.frameDanger,
      '--warning-frame': semantic.frameWarning,
      '--ledger-frame': colors.frame,
      '--ledger-frame-soft': `color-mix(in srgb, ${colors.frame} 94%, ${colors.frameText})`,
      '--ledger-frame-text': colors.frameText,
      '--ledger-frame-muted': `color-mix(in srgb, ${colors.frameText} 70%, transparent)`,
      '--ledger-accent-frame': colors.frameAccent,
      '--ledger-paper': colors.canvas,
      '--ledger-paper-raised': colors.surface,
      '--ledger-ink': colors.text,
      '--ledger-muted': colors.muted,
      '--ledger-rule': colors.border,
      '--ledger-gold': colors.accent,
      '--ledger-on-accent': colors.onAccent,
      '--native-icon-filter': isDark ? 'invert(1)' : 'none',
    };

    colors.chart.forEach((color, index) => {
      properties[`--chart-${index + 1}`] = color;
      properties[`--accent${index + 3}-color`] = color;
    });
    properties['--accent7-color'] = colors.chart[0];
    properties['--accent8-color'] = colors.chart[1];
    properties['--accent9-color'] = colors.chart[2];
    properties['--accent10-color'] = colors.chart[3];

    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.dataset.themeCategory = theme.category;
    root.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
    Object.entries(properties).forEach(([property, value]) => root.style.setProperty(property, value));

    // Update theme-color meta tag for PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.frame);
    }
  }, [themeId]);

  useEffect(() => {
    let styleEl = document.getElementById('custom-font-style');
    if (customFontBase64) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-font-style';
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        @font-face {
          font-family: 'UploadedCustomFont';
          src: url('${customFontBase64}');
        }
        :root {
          --font-sans: 'UploadedCustomFont', "SF Pro Text", "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
      `;
    } else {
      if (styleEl) {
        styleEl.remove();
      }
    }
  }, [customFontBase64]);

  return null;
}
