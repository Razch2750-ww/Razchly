import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { themes } from '../themes';

export default function ThemeApplicator() {
  const themeId = useStore((state) => state.themeId);
  const language = useStore((state) => state.language);
  const customFontBase64 = useStore((state) => state.customFontBase64);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const theme = themes.find((t) => t.id === themeId) || themes.find(t => t.id === 'slate-stone') || themes[0];

    document.documentElement.style.setProperty('--bg-color', theme.colors.bg);
    document.documentElement.style.setProperty('--text-color', theme.colors.text);
    document.documentElement.style.setProperty('--accent1-color', theme.colors.accent1);
    (['accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'accent7', 'accent8', 'accent9', 'accent10'] as const).forEach((key) => {
      document.documentElement.style.setProperty(`--${key}-color`, theme.colors[key] || theme.colors.accent1);
    });

    const isDark = theme.category === 'dark' || theme.category === 'amoled';
    const isDefaultLedger = theme.id === 'slate-stone';
    document.documentElement.style.setProperty('color-scheme', isDark ? 'dark' : 'light');

    // Keep Obsidian Ledger as the default art direction while allowing the
    // existing theme picker to recolor the same layout system.
    document.documentElement.style.setProperty('--ledger-frame', isDefaultLedger ? '#10120F' : (isDark ? theme.colors.bg : '#10120F'));
    document.documentElement.style.setProperty('--ledger-frame-soft', isDefaultLedger ? '#171915' : (isDark ? `color-mix(in srgb, ${theme.colors.bg} 92%, white)` : '#171915'));
    document.documentElement.style.setProperty('--ledger-paper', isDefaultLedger ? '#F3EEE3' : theme.colors.bg);
    document.documentElement.style.setProperty('--ledger-paper-raised', isDefaultLedger ? '#F8F4EA' : (isDark ? `color-mix(in srgb, ${theme.colors.bg} 94%, white)` : `color-mix(in srgb, ${theme.colors.bg} 35%, white)`));
    document.documentElement.style.setProperty('--ledger-ink', isDefaultLedger ? '#161713' : theme.colors.text);
    document.documentElement.style.setProperty('--ledger-rule', isDefaultLedger ? 'rgba(22, 23, 19, 0.18)' : `color-mix(in srgb, ${theme.colors.text} 18%, transparent)`);
    document.documentElement.style.setProperty('--ledger-gold', isDefaultLedger ? '#D7B669' : theme.colors.accent1);

    // Update theme-color meta tag for PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.bg);
    }

    if (theme.category === 'amoled') {
      document.documentElement.style.setProperty('--card-bg', '#0E0F12');
      document.documentElement.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.08)');
      document.documentElement.style.setProperty('--hover-bg', '#16171D');
      document.documentElement.style.setProperty('--text-bright', '#E8EAEE');
      document.documentElement.style.setProperty('--inner-border', 'rgba(255, 255, 255, 0.04)');
      document.documentElement.style.setProperty('--success-color', '#32B484');
      document.documentElement.style.setProperty('--danger-color', '#E25858');
    } else if (isDark) {
      document.documentElement.style.setProperty('--card-bg', `color-mix(in srgb, ${theme.colors.bg} 94%, white)`);
      document.documentElement.style.setProperty('--border-color', `color-mix(in srgb, ${theme.colors.bg} 88%, white)`);
      document.documentElement.style.setProperty('--hover-bg', `color-mix(in srgb, ${theme.colors.bg} 90%, white)`);
      document.documentElement.style.setProperty('--text-bright', `color-mix(in srgb, ${theme.colors.text} 88%, white)`);
      document.documentElement.style.setProperty('--inner-border', 'rgba(255, 255, 255, 0.05)');
      document.documentElement.style.setProperty('--success-color', '#34B688');
      document.documentElement.style.setProperty('--danger-color', '#E25C5C');
    } else {
      document.documentElement.style.setProperty('--card-bg', `color-mix(in srgb, ${theme.colors.bg} 35%, #FFFFFF)`);
      document.documentElement.style.setProperty('--border-color', `color-mix(in srgb, ${theme.colors.bg} 88%, ${theme.colors.text})`);
      document.documentElement.style.setProperty('--hover-bg', `color-mix(in srgb, ${theme.colors.bg} 94%, ${theme.colors.text})`);
      document.documentElement.style.setProperty('--text-bright', `color-mix(in srgb, ${theme.colors.text} 90%, black)`);
      document.documentElement.style.setProperty('--inner-border', 'rgba(0, 0, 0, 0.04)');
      document.documentElement.style.setProperty('--success-color', '#26966C');
      document.documentElement.style.setProperty('--danger-color', '#D94D4D');
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
