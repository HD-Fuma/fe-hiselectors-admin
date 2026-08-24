export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "selectors-theme";

export function getTheme(): Theme {
  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  return theme === "light" || theme === "dark" ? theme : "dark";
}

export function applyTheme(theme: Theme) {
  delete document.documentElement.dataset.theme;
  document.documentElement.style.removeProperty("color-scheme");
  document.documentElement.dataset.sidebarTheme = theme;
}

export function saveTheme(theme: Theme) {
  applyTheme(theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
