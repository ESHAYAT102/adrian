export type ThemeMode = "light" | "dark"
export type ThemeFamilyId =
  | "adrian"
  | "catppuccin"
  | "dracula"
  | "tokyo-night"
  | "everforest"
  | "gruvbox"
  | "flexoki"
  | "nord"
  | "osaka-jade"
  | "rose-pine"

export type ThemeFamily = {
  id: ThemeFamilyId
  name: string
  description: string
  swatches: readonly [string, string]
  lightTheme: string
  darkTheme: string
  keywords: string[]
}

export const THEME_FAMILIES = [
  {
    id: "adrian",
    name: "Adrian",
    description: "Clean default GitHub-style tones",
    swatches: ["#f6f8fa", "#24292f"],
    lightTheme: "light",
    darkTheme: "dark",
    keywords: ["default", "system"],
  },
  {
    id: "catppuccin",
    name: "Catppuccin",
    description: "Soothing pastel palette",
    swatches: ["#cba6f7", "#89b4fa"],
    lightTheme: "catppuccin-latte",
    darkTheme: "catppuccin-mocha",
    keywords: ["catppuccin", "latte", "mocha"],
  },
  {
    id: "dracula",
    name: "Dracula",
    description: "Purple and neon accent tones",
    swatches: ["#bd93f9", "#ff79c6"],
    lightTheme: "dracula-light",
    darkTheme: "dracula-dark",
    keywords: ["dracula"],
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    description: "Cool blue editor-inspired tones",
    swatches: ["#7aa2f7", "#bb9af7"],
    lightTheme: "tokyo-night-day",
    darkTheme: "tokyo-night-night",
    keywords: ["tokyo", "night", "day", "storm"],
  },
  {
    id: "everforest",
    name: "Everforest",
    description: "Soft natural green palette",
    swatches: ["#a7c080", "#7fbbb3"],
    lightTheme: "everforest-light",
    darkTheme: "everforest-dark",
    keywords: ["everforest", "green"],
  },
  {
    id: "gruvbox",
    name: "Gruvbox",
    description: "Warm retro terminal tones",
    swatches: ["#fabd2f", "#fe8019"],
    lightTheme: "gruvbox-light",
    darkTheme: "gruvbox-dark",
    keywords: ["gruvbox", "retro"],
  },
  {
    id: "flexoki",
    name: "Flexoki",
    description: "Inky neutral paper tones",
    swatches: ["#205ea6", "#24837b"],
    lightTheme: "flexoki-light",
    darkTheme: "flexoki-dark",
    keywords: ["flexoki", "ink"],
  },
  {
    id: "nord",
    name: "Nord",
    description: "Arctic blue-gray tones",
    swatches: ["#88c0d0", "#81a1c1"],
    lightTheme: "nord-light",
    darkTheme: "nord-dark",
    keywords: ["nord", "arctic"],
  },
  {
    id: "osaka-jade",
    name: "Osaka Jade",
    description: "Deep jade and mint accents",
    swatches: ["#63d6a5", "#6fb7e9"],
    lightTheme: "osaka-jade-light",
    darkTheme: "osaka-jade-dark",
    keywords: ["osaka", "jade"],
  },
  {
    id: "rose-pine",
    name: "Rose Pine",
    description: "Muted rose and pine hues",
    swatches: ["#c4a7e7", "#9ccfd8"],
    lightTheme: "rose-pine-dawn",
    darkTheme: "rose-pine-moon",
    keywords: ["rose", "pine", "dawn", "main", "moon"],
  },
] as const satisfies ThemeFamily[]

export type ThemeId =
  | "light"
  | "dark"
  | "catppuccin-latte"
  | "catppuccin-mocha"
  | "dracula-light"
  | "dracula-dark"
  | "tokyo-night-day"
  | "tokyo-night-night"
  | "everforest-light"
  | "everforest-dark"
  | "gruvbox-light"
  | "gruvbox-dark"
  | "flexoki-light"
  | "flexoki-dark"
  | "nord-light"
  | "nord-dark"
  | "osaka-jade-light"
  | "osaka-jade-dark"
  | "rose-pine-dawn"
  | "rose-pine-main"
  | "rose-pine-moon"

export const THEME_IDS: ThemeId[] = [
  "light",
  "dark",
  "catppuccin-latte",
  "catppuccin-mocha",
  "dracula-light",
  "dracula-dark",
  "tokyo-night-day",
  "tokyo-night-night",
  "everforest-light",
  "everforest-dark",
  "gruvbox-light",
  "gruvbox-dark",
  "flexoki-light",
  "flexoki-dark",
  "nord-light",
  "nord-dark",
  "osaka-jade-light",
  "osaka-jade-dark",
  "rose-pine-dawn",
  "rose-pine-main",
  "rose-pine-moon",
]

export const THEME_CLASS_NAMES = THEME_IDS

const DARK_THEME_IDS = new Set<ThemeId>([
  "dark",
  "catppuccin-mocha",
  "dracula-dark",
  "tokyo-night-night",
  "everforest-dark",
  "gruvbox-dark",
  "flexoki-dark",
  "nord-dark",
  "osaka-jade-dark",
  "rose-pine-main",
  "rose-pine-moon",
])

const FAMILY_BY_ID = new Map(THEME_FAMILIES.map((family) => [family.id, family]))

export function getThemeMode(themeId?: string): ThemeMode {
  return DARK_THEME_IDS.has(themeId as ThemeId) ? "dark" : "light"
}

export function getThemeFamily(themeId?: string): ThemeFamily {
  return (
    THEME_FAMILIES.find(
      (family) =>
        family.lightTheme === themeId ||
        family.darkTheme === themeId ||
        (family.keywords as readonly string[]).includes(themeId ?? "")
    ) ?? THEME_FAMILIES[0]
  )
}

export function getThemeIdForFamilyMode(
  familyId: ThemeFamilyId,
  mode: ThemeMode
) {
  const family = FAMILY_BY_ID.get(familyId) ?? THEME_FAMILIES[0]
  return (mode === "dark" ? family.darkTheme : family.lightTheme) as ThemeId
}

export function getThemeIdForMode(themeId: string | undefined, mode: ThemeMode) {
  return getThemeIdForFamilyMode(getThemeFamily(themeId).id, mode)
}

export function getThemeIdForFamily(
  themeId: string | undefined,
  familyId: ThemeFamilyId
) {
  return getThemeIdForFamilyMode(familyId, getThemeMode(themeId))
}

export function getPairedThemeId(themeId?: string) {
  return getThemeIdForMode(
    themeId,
    getThemeMode(themeId) === "dark" ? "light" : "dark"
  )
}

export function getThemeLabel(themeId?: string) {
  return getThemeFamily(themeId).name
}
