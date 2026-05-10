import { CodeBlock } from '@/components/shared/CodeBlock';
import type { CodeArtifact, SourceType } from '@/types/assessment';

const SOURCE_LABEL: Record<SourceType, string> = {
  QCP_JavaScript: 'QCP — JavaScript',
  Apex_Class: 'Apex Class',
  Apex_Trigger: 'Apex Trigger',
  Price_Rule: 'Price Rule (declarative)',
  Product_Rule: 'Product Rule (declarative)',
  Discount_Schedule: 'Discount Schedule (declarative)',
  Summary_Variable: 'Summary Variable (declarative)',
  Lookup_Query: 'Lookup Query',
};

export function SourcePane({ artifact }: { artifact: CodeArtifact }) {
  return (
    <section className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-muted-foreground">
          Original CPQ source
        </span>
        <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground/80">
          {SOURCE_LABEL[artifact.sourceType]}
        </span>
      </header>
      <div className="flex-1 overflow-auto p-3">
        <CodeBlock code={artifact.sourceCode} language={artifact.sourceType} className="h-full" />
      </div>
    </section>
  );
}
