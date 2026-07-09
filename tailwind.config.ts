import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        surface: "hsl(var(--surface))",
        "surface-container-lowest": "hsl(var(--surface-container-lowest))",
        "surface-container-low": "hsl(var(--surface-container-low))",
        "surface-container": "hsl(var(--surface-container))",
        "surface-container-high": "hsl(var(--surface-container-high))",
        "surface-variant": "hsl(var(--surface-variant))",
        "on-surface": "hsl(var(--on-surface))",
        "on-surface-variant": "hsl(var(--on-surface-variant))",
        "inverse-surface": "hsl(var(--inverse-surface))",
        "inverse-on-surface": "hsl(var(--inverse-on-surface))",
        "outline-variant": "hsl(var(--outline-variant))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        "on-primary": "hsl(var(--on-primary))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        "emerald-accent": "#10b981",
        "emerald-soft": "#ecfdf5",
        "emerald-dark": "#065f46",
        "amber-soft": "#fffbeb",
        "amber-dark": "#92400e"
      },
      fontFamily: {
        display: ["Inter Tight", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        "body-md": ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        "label-sm": ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        "mono-data": ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      fontSize: {
        display: ["48px", { lineHeight: "56px", letterSpacing: "0em", fontWeight: "800" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "0em", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "0em", fontWeight: "700" }],
        "headline-md": ["20px", { lineHeight: "28px", letterSpacing: "0em", fontWeight: "700" }],
        "body-lg": ["16px", { lineHeight: "24px", letterSpacing: "0em", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", letterSpacing: "0em", fontWeight: "400" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0em", fontWeight: "600" }],
        "mono-data": ["14px", { lineHeight: "20px", letterSpacing: "0em", fontWeight: "500" }]
      },
      boxShadow: {
        soft: "0 18px 50px -34px rgb(15 23 42 / 0.38)",
        stitch: "0 4px 12px rgb(15 23 42 / 0.035)",
        float: "0 20px 65px -45px rgb(15 23 42 / 0.55)"
      }
    }
  },
  plugins: []
};

export default config;
