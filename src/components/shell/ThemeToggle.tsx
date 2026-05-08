import { Moon, Sun } from 'lucide-react';
import { applyTheme, useThemeStore } from '@/store/useThemeStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button
      type="button"
      onClick={() => {
        toggleTheme();
        applyTheme(theme === 'light' ? 'dark' : 'light');
      }}
      className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground focus-ring"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
