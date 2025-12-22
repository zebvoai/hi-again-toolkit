import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      /* Motion System Tokens */
      transitionTimingFunction: {
        'default': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'gentle': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'snappy': 'cubic-bezier(0.2, 0, 0, 1)',
        'expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        'instant': '50ms',
        'fast': '100ms',
        'normal': '180ms',
        'moderate': '250ms',
        'slow': '350ms',
        'slower': '500ms',
      },
      scale: {
        'press': '0.97',
        'hover': '1.02',
        'pop': '1.05',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(4px)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.96)" },
        },
        "slide-in-bottom": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-top": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "thinking-dot": {
          "0%, 60%, 100%": { 
            opacity: "0.4",
            transform: "scale(0.85) translateY(0)"
          },
          "30%": { 
            opacity: "1",
            transform: "scale(1) translateY(-3px)"
          },
        },
        // Deep Research animations - slow, calming, intentional
        "research-pulse": {
          "0%, 100%": { 
            opacity: "0.7",
            transform: "scale(1)"
          },
          "50%": { 
            opacity: "1",
            transform: "scale(1.02)"
          },
        },
        "research-breathe": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.9" },
        },
        "research-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsla(239, 84%, 67%, 0.1)"
          },
          "50%": { 
            boxShadow: "0 0 40px hsla(239, 84%, 67%, 0.25)"
          },
        },
        "research-progress": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "research-icon": {
          "0%, 100%": { 
            transform: "rotate(0deg) scale(1)"
          },
          "25%": { 
            transform: "rotate(-5deg) scale(1.05)"
          },
          "75%": { 
            transform: "rotate(5deg) scale(1.05)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-up": "accordion-up 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-out": "fade-out 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-out": "scale-out 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-bottom": "slide-in-bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-top": "slide-in-top 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-left": "slide-in-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-gentle": "pulse-gentle 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "bounce-subtle": "bounce-subtle 1s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "thinking-dot": "thinking-dot 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "enter": "fade-in 0.18s cubic-bezier(0.16, 1, 0.3, 1), scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "exit": "fade-out 0.15s cubic-bezier(0.16, 1, 0.3, 1), scale-out 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        // Deep Research animations - intentionally slow for long-running tasks
        "research-pulse": "research-pulse 3s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "research-breathe": "research-breathe 4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "research-glow": "research-glow 4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "research-progress": "research-progress 3s ease infinite",
        "research-icon": "research-icon 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
