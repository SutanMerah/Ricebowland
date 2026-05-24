export const theme = {
  colors: {
    background: "#FFFBF5",
    foreground: "#2D1B0E",

    card: "#ffffff",
    cardForeground: "#2D1B0E",

    primary: "#F97316",
    primaryForeground: "#ffffff",

    secondary: "#FBBF24",
    secondaryForeground: "#2D1B0E",

    muted: "#FEF3E2",
    mutedForeground: "#78716C",

    accent: "#FDBA74",
    accentForeground: "#2D1B0E",

    destructive: "#d4183d",
    destructiveForeground: "#ffffff",
    success: "#16A34A",

    border: "rgba(120,113,108,0.2)",

    inputBackground: "#FEF3E2",

    ring: "#ccc",

    // optional (dipakai nanti kalau butuh)
    chart1: "#E67E22",
    chart2: "#1ABC9C",
    chart3: "#34495E",
    chart4: "#F4D03F",
    chart5: "#F39C12",
  },

  radius: {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
    full: 999,
  },

  font: {
    size: 16,
    weightNormal: "400" as const,
    weightMedium: "500" as const,
  },
};

export const darkTheme = {
  colors: {
    background: "#121212",
    foreground: "#ffffff",

    card: "#1e1e1e",
    cardForeground: "#ffffff",

    primary: "#ffffff",
    primaryForeground: "#333",

    secondary: "#333",
    secondaryForeground: "#fff",

    muted: "#333",
    mutedForeground: "#aaa",

    accent: "#444",
    accentForeground: "#fff",

    destructive: "#ff4d4f",
    destructiveForeground: "#fff",

    border: "#333",

    inputBackground: "#2a2a2a",

    ring: "#666",
  },
};