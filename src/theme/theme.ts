/**
 * Oyal design system.
 * Travel-inspired, light aesthetic, modern.
 * Slogan: "It's about experiences, not appearances"
 */

export const colors = {
  // Primary palette — sea / sky travel tones
  primary: "#0EA5A5", // teal
  primaryDark: "#0B7C7C",
  primaryLight: "#5FD0CE",
  accent: "#F4A259", // warm sand / sunset
  accentDark: "#E4842F",

  // Neutrals
  background: "#F4FBFB",
  surface: "#FFFFFF",
  surfaceMuted: "#EAF6F6",
  border: "#E1ECEC",

  // Text
  text: "#0F2E2E",
  textMuted: "#5C7574",
  textInverse: "#FFFFFF",

  // Feedback
  success: "#2FB380",
  danger: "#E5556E",
  warning: "#F0B429",

  // Misc
  overlay: "rgba(6, 30, 30, 0.55)",
  shadow: "#0F2E2E",
  badge: "#0EA5A5",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const branding = {
  appName: "Oyal",
  slogan: "It's about experiences, not appearances",
} as const;

/** Travel-themed background images used across Home / Auth screens. */
export const travelBackgrounds = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1200&q=70",
];

export function randomBackground(): string {
  return travelBackgrounds[Math.floor(Math.random() * travelBackgrounds.length)];
}
