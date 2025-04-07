import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem("theme") as Theme;
    // Check for system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    return savedTheme || (prefersDark ? "dark" : "light");
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove the old theme class
    root.classList.remove("light", "dark");
    // Add the new theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
}