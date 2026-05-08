import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRUTH_VARIANTS, TruthLabel } from './TruthLabel';

export function TruthLabelLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div
      data-no-print="true"
      className="fixed bottom-4 right-4 z-30 max-w-xs rounded-lg border border-border bg-card/95 shadow-sm backdrop-blur"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground focus-ring"
      >
        Truth label legend
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </button>
      <div className={cn('grid gap-2 px-3 pb-3', open ? 'block' : 'hidden')}>
        {TRUTH_VARIANTS.map((v) => (
          <TruthLabel key={v} variant={v} />
        ))}
      </div>
    </div>
  );
}
