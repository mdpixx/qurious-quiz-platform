import * as React from "react";

export type Theme = "playful" | "minimal";

export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>("playful");

  React.useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("qurious-theme") as Theme;
    if (savedTheme && (savedTheme === "playful" || savedTheme === "minimal")) {
      setTheme(savedTheme);
      if (savedTheme === "minimal") {
        document.body.classList.add("theme-minimal");
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "playful" ? "minimal" : "playful";
    setTheme(newTheme);
    localStorage.setItem("qurious-theme", newTheme);
    
    if (newTheme === "minimal") {
      document.body.classList.add("theme-minimal");
    } else {
      document.body.classList.remove("theme-minimal");
    }
  };

  return {
    theme,
    toggleTheme,
    isPlayful: theme === "playful",
    isMinimal: theme === "minimal"
  };
}
