import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';

/**
 * Theme toggle. Mutates only the store; AppShell's layer-aware effect
 * applies the actual `data-theme` attribute. This indirection is what
 * lets Layer 4 (Migration) keep its forced-dark default even when the
 * global toggle is set to light.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground focus-ring"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
