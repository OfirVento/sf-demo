import { useRef, useState, type ReactNode } from 'react';
import { toPng } from 'html-to-image';
import { Camera, Check, Copy } from 'lucide-react';
import { TruthLabel, type TruthLabelVariant } from '@/components/shared/TruthLabel';

type Props = {
  title: string;
  takeaway: string;
  truthLabel?: TruthLabelVariant;
  /** Chart content; rendered into a screenshot-ready container. */
  children: ReactNode;
};

/**
 * Wrapper giving every chart screenshot-ready behavior: title, chart,
 * one-sentence takeaway, copy-as-image (html-to-image), copy-explanation.
 * Cards stand alone visually so they look right when screenshotted in
 * isolation.
 */
export function ChartCard({ title, takeaway, truthLabel = 'heuristic', children }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyAsImage() {
    if (!captureRef.current) return;
    setError(null);
    try {
      // Resolve the actual --card / --background colors before flattening so
      // dark mode and CSS-variable text stay legible in the exported PNG.
      const styles = getComputedStyle(document.documentElement);
      const bg = `hsl(${styles.getPropertyValue('--card').trim()})`;
      const dataUrl = await toPng(captureRef.current, {
        backgroundColor: bg,
        pixelRatio: 2,
      });
      const blob = await (await fetch(dataUrl)).blob();
      // ClipboardItem may be missing on Firefox / older Safari — fall back
      // to a text URL paste so the user is never stuck.
      if (typeof window.ClipboardItem === 'function' && navigator.clipboard?.write) {
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
      } else {
        await navigator.clipboard.writeText(dataUrl);
      }
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function copyExplanation() {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${takeaway}`);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <article className="rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      <div ref={captureRef} className="space-y-4 p-5">
        <header className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <TruthLabel variant={truthLabel} className="shrink-0" />
        </header>
        <div className="min-h-48">{children}</div>
        <p className="border-t border-border pt-3 text-sm leading-relaxed text-foreground/85">
          {takeaway}
        </p>
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-4 py-2">
        {error && (
          <span className="mr-auto text-xs text-severity-high">Copy failed: {error}</span>
        )}
        <button
          type="button"
          onClick={() => void copyExplanation()}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-ring"
          title="Copy title + takeaway"
        >
          {copiedText ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copiedText ? 'Copied' : 'Copy text'}
        </button>
        <button
          type="button"
          onClick={() => void copyAsImage()}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-ring"
          title="Copy chart as PNG image"
        >
          {copiedImage ? <Check className="h-3 w-3 text-emerald-500" /> : <Camera className="h-3 w-3" />}
          {copiedImage ? 'Copied' : 'Copy as image'}
        </button>
      </footer>
    </article>
  );
}
