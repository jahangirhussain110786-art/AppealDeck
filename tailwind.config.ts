import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem" },
      screens: { "2xl": "1200px" },
    },
    extend: {
      maxWidth: {
        reading: "var(--w-reading)",
        form: "var(--w-form)",
        tool: "var(--w-tool)",
        app: "var(--w-app)",
        marketing: "var(--w-marketing)",
      },
      fontSize: {
        display: [
          "var(--text-display)",
          { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "600" },
        ],
        h1: ["var(--text-h1)", { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "600" }],
        h2: ["var(--text-h2)", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        h3: ["var(--text-h3)", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        eyebrow: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      colors: {
        brand: "hsl(var(--brand) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        info: {
          DEFAULT: "hsl(var(--info) / <alpha-value>)",
          foreground: "hsl(var(--info-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--surface-1) / <alpha-value>)",
          foreground: "hsl(var(--foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--surface-1) / <alpha-value>)",
          foreground: "hsl(var(--foreground) / <alpha-value>)",
        },
        surface: {
          1: "hsl(var(--surface-1) / <alpha-value>)",
          2: "hsl(var(--surface-2) / <alpha-value>)",
          inverse: "hsl(var(--surface-inverse) / <alpha-value>)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        card: "0 1px 2px 0 hsl(var(--shadow) / 0.06), 0 1px 1px -1px hsl(var(--shadow) / 0.04)",
        soft: "0 1px 3px 0 hsl(var(--shadow) / 0.08), 0 1px 2px -1px hsl(var(--shadow) / 0.06)",
        elevated:
          "0 24px 48px -24px hsl(var(--shadow) / 0.22), 0 2px 6px -2px hsl(var(--shadow) / 0.08)",
        "soft-lg": "0 24px 48px -24px hsl(var(--shadow) / 0.22)",
        inset: "inset 0 1px 0 hsl(var(--border) / 0.6)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "var(--w-reading)",
            color: "hsl(var(--foreground))",
            fontSize: "var(--text-body)",
            lineHeight: "1.6",
            p: { marginBottom: "1rem", textWrap: "pretty" },
            h1: {
              color: "hsl(var(--foreground))",
              fontSize: "var(--text-h1)",
              fontWeight: "600",
              lineHeight: "1.2",
              marginBottom: "1rem",
              textWrap: "balance",
            },
            h2: {
              color: "hsl(var(--foreground))",
              fontSize: "var(--text-h2)",
              fontWeight: "600",
              lineHeight: "1.2",
              marginTop: "2rem",
              marginBottom: "1rem",
              textWrap: "balance",
            },
            h3: {
              color: "hsl(var(--foreground))",
              fontSize: "var(--text-h3)",
              fontWeight: "600",
              lineHeight: "1.2",
              marginTop: "2rem",
              marginBottom: "1rem",
              textWrap: "balance",
            },
            a: {
              color: "hsl(var(--primary))",
              textDecoration: "underline",
              textUnderlineOffset: "0.25em",
            },
            code: {
              backgroundColor: "hsl(var(--muted) / 0.7)",
              padding: "0.125em 0.3em",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.85em",
              color: "hsl(var(--foreground))",
            },
            blockquote: {
              borderLeft: `3px solid hsl(var(--border))`,
              paddingLeft: "1rem",
              fontStyle: "italic",
              color: "hsl(var(--muted-foreground))",
            },
          },
        },
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "zoom-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in var(--dur-base) var(--ease-out) both",
        "fade-up": "fade-up var(--dur-base) var(--ease-out) both",
        "zoom-in": "zoom-in var(--dur-base) var(--ease-out) both",
        "slide-in-right": "slide-in-right var(--dur-slow) var(--ease-out) both",
        "slide-out-right": "slide-out-right var(--dur-base) var(--ease-in-out) both",
        "accordion-down": "accordion-down var(--dur-base) var(--ease-out)",
        "accordion-up": "accordion-up var(--dur-base) var(--ease-out)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
