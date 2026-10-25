import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: {
          DEFAULT: "var(--color-surface)",
          2: "var(--color-surface-2)",
        },
        overlay: "var(--color-overlay)",
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        accent: {
          DEFAULT: "var(--color-accent)",
          subtle: "var(--color-accent-subtle)",
          border: "var(--color-accent-border)",
        },
        pending: {
          DEFAULT: "var(--color-pending)",
          bg: "var(--color-pending-bg)",
        },
        active: {
          DEFAULT: "var(--color-active)",
          bg: "var(--color-active-bg)",
        },
        done: {
          DEFAULT: "var(--color-done)",
          bg: "var(--color-done-bg)",
        },
        urgent: {
          DEFAULT: "var(--color-urgent)",
          bg: "var(--color-urgent-bg)",
        },
        /* legacy aliases */
        base: "var(--color-bg)",
        elevated: "var(--color-surface-2)",
        "theme-border": "var(--color-border)",
        "theme-input": "var(--color-surface-2)",
        header: "var(--color-surface)",
        sidebar: "var(--color-surface)",
        primary: {
          DEFAULT: "var(--color-accent)",
          hover: "#5d88ff",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--color-surface-2)",
          foreground: "var(--color-text-primary)",
        },
        glow: "var(--color-accent)",
        "text-tertiary": "var(--color-text-muted)",
        "status-pending": "var(--color-pending)",
        "status-pending-fg": "var(--color-pending)",
        "status-active": "var(--color-active)",
        "status-complete": "var(--color-done)",
        "status-complete-fg": "var(--color-done)",
        "status-urgent": "var(--color-urgent)",
        "status-urgent-fg": "var(--color-urgent)",
        "on-primary": "#ffffff",
        "destructive-hover": "#a50e0e",
        decision: "var(--color-surface-2)",
        background: "var(--color-bg)",
        foreground: "var(--color-text-primary)",
        card: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-text-primary)",
        },
        popover: {
          DEFAULT: "var(--color-overlay)",
          foreground: "var(--color-text-primary)",
        },
        muted: {
          DEFAULT: "var(--color-surface-2)",
          foreground: "var(--color-text-secondary)",
        },
        destructive: {
          DEFAULT: "var(--color-urgent)",
          foreground: "#ffffff",
        },
        input: "var(--color-border)",
        ring: "var(--color-accent)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-sans)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        card: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease",
      },
    },
  },
  plugins: [],
};

export default config;
