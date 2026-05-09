import { X } from 'lucide-react';
import { useKbDrawerStore } from '@/store/useKbDrawerStore';

export function KbDrawer() {
  const { open, capability, close } = useKbDrawerStore();
  if (!open || !capability) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Capability description">
      <button
        type="button"
        aria-label="Close capability drawer"
        className="absolute inset-0 bg-foreground/20"
        onClick={close}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-card shadow-xl transition-transform duration-300 ease-out">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              RCA capability
            </p>
            <h2 className="mt-1 text-base font-semibold text-foreground">{capability.name}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-muted-foreground hover:bg-muted focus-ring"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-foreground/90">{capability.description}</p>
          <p className="mt-4 text-xs italic text-muted-foreground">
            Source: RCA knowledge base §1 (Capability List).
          </p>
        </div>
      </aside>
    </div>
  );
}
