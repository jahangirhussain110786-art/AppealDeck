import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
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
        soft: "0 1px 3px 0 hsl(222 30% 10% / 0.08), 0 1px 2px -1px hsl(222 30% 10% / 0.08)",
        "soft-lg": "0 18px 40px -18px hsl(222 30% 10% / 0.12)",
        "surface-1": "inset 0 1px 0 hsl(var(--border) / 0.5)",
        "surface-2": "inset 0 1px 0 hsl(var(--border) / 0.3)",
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
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 200ms var(--ease-out, ease-out) both",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
