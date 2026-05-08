import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const LAYERS = [
  { to: '/assessment/executive', label: 'Executive' },
  { to: '/assessment/sales', label: 'Sales' },
  { to: '/assessment/salesforce', label: 'Salesforce' },
  { to: '/assessment/migration', label: 'Migration' },
  { to: '/assessment/implementation', label: 'Implementation' },
];

export function LayerSwitcher() {
  return (
    <nav className="flex items-center gap-1" data-no-print="true">
      {LAYERS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-ring',
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
