import { useState, useEffect } from "react";

/**
 * Custom hook to get the current theme state ('dark' or 'light').
 * It listens for changes on the documentElement's class list.
 */
export function CurrentTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    // 1. Function to update state based on current DOM classes
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    // 2. Set up a MutationObserver to watch for class changes on <html>
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          updateTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // 3. Initial check
    updateTheme();

    return () => observer.disconnect();
  }, []);

  return theme;
}