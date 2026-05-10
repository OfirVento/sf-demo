import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';

/** Map our SourceType / candidateLanguage values onto Shiki language IDs. */
const LANG_MAP: Record<string, string> = {
  // SourceType values
  QCP_JavaScript: 'javascript',
  Apex_Class: 'apex',
  Apex_Trigger: 'apex',
  Price_Rule: 'plaintext',
  Product_Rule: 'plaintext',
  Discount_Schedule: 'plaintext',
  Summary_Variable: 'plaintext',
  Lookup_Query: 'plaintext',
  // candidateLanguage values
  apex: 'apex',
  javascript: 'javascript',
  json: 'json',
  pseudocode: 'plaintext',
  // CML grammar deferred — render as TypeScript per the M0 spec deviation.
  cml: 'typescript',
};

export function CodeBlock({
  code,
  language = 'plaintext',
  className,
}: {
  code: string;
  /** Either a SourceType, a CandidateLanguage, or a Shiki language ID directly. */
  language?: string;
  className?: string;
}) {
  const themeMode = useThemeStore((s) => s.theme);
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const lang = LANG_MAP[language] ?? language;
    // Force the editor look on Layer 4: dark theme follows the page's data-theme,
    // which Layer 4 forces to dark by default; light pages still get the matching
    // GitHub Light theme so screenshots outside Layer 4 stay legible.
    const theme = themeMode === 'dark' ? 'github-dark' : 'github-light';
    codeToHtml(code, { lang, theme })
      .then((out) => {
        if (alive) {
          setHtml(out);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          console.error('Shiki highlight failed', err);
          // Fallback: pre-rendered <pre> with no highlighting.
          setHtml(
            `<pre style="padding:1rem;font-family:JetBrains Mono,monospace;font-size:13px;line-height:1.6;overflow:auto"><code>${escapeHtml(code)}</code></pre>`,
          );
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [code, language, themeMode]);

  if (loading) {
    return (
      <div
        className={cn(
          'flex h-full items-center justify-center rounded-md border border-border bg-muted/30 px-4 py-8 font-mono text-xs text-muted-foreground',
          className,
        )}
      >
        Highlighting…
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-auto rounded-md border border-border bg-card font-mono text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:p-4',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
