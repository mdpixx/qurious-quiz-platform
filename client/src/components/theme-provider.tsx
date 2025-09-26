import { createContext, useContext, ReactNode } from "react";
import { useTheme, Theme } from "@/hooks/use-theme";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isPlayful: boolean;
  isMinimal: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeData = useTheme();

  return (
    <ThemeContext.Provider value={themeData}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
