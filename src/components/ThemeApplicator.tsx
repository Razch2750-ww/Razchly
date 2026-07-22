import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { themes } from '../themes';

export default function ThemeApplicator() {
  const themeId = useStore((state) => state.themeId);
  const customFontBase64 = useStore((state) => state.customFontBase64);

  useEffect(() => {
    const theme = themes.find((t) => t.id === themeId) || themes.find(t => t.id === 'slate-stone') || themes[0];
    
    const color1 = theme.colors.accent1;
    const color2 = theme.colors.accent2 || color1;
    const color3 = theme.colors.accent3 || color2;
    document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${color1}, ${color2}, ${color3})`);

    document.documentElement.style.setProperty('--bg-color', theme.colors.bg);
    document.documentElement.style.setProperty('--text-color', theme.colors.text);
    document.documentElement.style.setProperty('--accent1-color', theme.colors.accent1);
    if (theme.colors.accent2) document.documentElement.style.setProperty('--accent2-color', theme.colors.accent2);
    if (theme.colors.accent3) document.documentElement.style.setProperty('--accent3-color', theme.colors.accent3);
    if (theme.colors.accent4) document.documentElement.style.setProperty('--accent4-color', theme.colors.accent4);
    if (theme.colors.accent5) document.documentElement.style.setProperty('--accent5-color', theme.colors.accent5);
    if (theme.colors.accent6) document.documentElement.style.setProperty('--accent6-color', theme.colors.accent6);
    if (theme.colors.accent7) document.documentElement.style.setProperty('--accent7-color', theme.colors.accent7);
    if (theme.colors.accent8) document.documentElement.style.setProperty('--accent8-color', theme.colors.accent8);
    if (theme.colors.accent9) document.documentElement.style.setProperty('--accent9-color', theme.colors.accent9);
    if (theme.colors.accent10) document.documentElement.style.setProperty('--accent10-color', theme.colors.accent10);
    
    const isDark = theme.category === 'dark' || theme.category === 'amoled';
    document.documentElement.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
    
    // Update theme-color meta tag for PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.bg);
    }
    
    if (theme.category === 'amoled') {
      document.documentElement.style.setProperty('--card-bg', '#111111');
      document.documentElement.style.setProperty('--border-color', '#222222');
      document.documentElement.style.setProperty('--hover-bg', '#1a1a1a');
      document.documentElement.style.setProperty('--text-bright', '#ffffff');
      document.documentElement.style.setProperty('--inner-border', 'rgba(255, 255, 255, 0.05)');
    } else if (isDark) {
      document.documentElement.style.setProperty('--card-bg', `color-mix(in srgb, ${theme.colors.bg} 92%, white)`);
      document.documentElement.style.setProperty('--border-color', `color-mix(in srgb, ${theme.colors.bg} 85%, white)`);
      document.documentElement.style.setProperty('--hover-bg', `color-mix(in srgb, ${theme.colors.bg} 90%, white)`);
      document.documentElement.style.setProperty('--text-bright', '#ffffff');
      document.documentElement.style.setProperty('--inner-border', 'rgba(255, 255, 255, 0.06)');
    } else {
      document.documentElement.style.setProperty('--card-bg', `color-mix(in srgb, ${theme.colors.bg} 95%, black)`);
      document.documentElement.style.setProperty('--border-color', `color-mix(in srgb, ${theme.colors.bg} 90%, black)`);
      document.documentElement.style.setProperty('--hover-bg', `color-mix(in srgb, ${theme.colors.bg} 92%, black)`);
      document.documentElement.style.setProperty('--text-bright', '#000000');
      document.documentElement.style.setProperty('--inner-border', 'rgba(255, 255, 255, 0.35)');
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
