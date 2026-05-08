import type { ReactNode } from 'react';
import { TruthLabel, type TruthLabelVariant } from '@/components/shared/TruthLabel';

type Props = {
  title: string;
  subtitle?: string;
  truthLabel: TruthLabelVariant;
  milestone: string;
  children?: ReactNode;
};

export function LayerScaffold({ title, subtitle, truthLabel, milestone, children }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>}
        </div>
        <TruthLabel variant={truthLabel} />
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        {milestone}
      </div>
      {children && <div className="mt-8 space-y-6">{children}</div>}
    </div>
  );
}
