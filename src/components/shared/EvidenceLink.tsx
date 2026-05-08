import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEvidenceDrawerStore } from '@/store/useEvidenceDrawerStore';
import type { EvidenceTrail } from '@/types/assessment';

type Props = {
  trail: EvidenceTrail;
  title: string;
  label?: string;
  className?: string;
};

export function EvidenceLink({ trail, title, label = 'View supporting evidence', className }: Props) {
  const show = useEvidenceDrawerStore((s) => s.show);
  return (
    <button
      type="button"
      onClick={() => show(title, trail)}
      className={cn(
        'inline-flex items-center gap-1 text-sm text-accent hover:underline focus-ring',
        className,
      )}
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}
