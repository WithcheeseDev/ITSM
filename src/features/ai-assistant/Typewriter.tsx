import { useEffect, useMemo, useRef, useState } from 'react';

/** Grapheme split keeps Thai vowels / tone marks with their consonant (design-system §9 2026-11-14). */
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
const graphemesOf = (s: string) => (segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s));

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

interface TypewriterProps {
  text: string;
  /** more text may still arrive: keep the caret and do not finish */
  streaming: boolean;
  animate: boolean;
  onDone?: () => void;
}

/** Reveals text grapheme by grapheme per animation frame; text that grows continues from the revealed count. */
export function Typewriter({ text, streaming, animate, onDone }: TypewriterProps) {
  const graphemes = useMemo(() => graphemesOf(text), [text]);
  const total = graphemes.length;
  const instant = !animate || prefersReducedMotion();
  const [shown, setShown] = useState(() => (instant ? total : 0));

  // text changed: keep the revealed count, clamped to the prefix the new text still shares
  const [prev, setPrev] = useState(graphemes);
  let count = shown;
  if (prev !== graphemes) {
    let common = 0;
    while (common < shown && common < total && prev[common] === graphemes[common]) common++;
    count = common;
    setPrev(graphemes);
    if (common !== shown) setShown(common);
  }
  const visibleCount = instant ? total : Math.min(count, total);

  useEffect(() => {
    if (instant || shown >= total) return;
    const id = requestAnimationFrame(() => setShown((s) => Math.min(total, s + Math.max(1, Math.ceil((total - s) / 8)))));
    return () => cancelAnimationFrame(id);
  }, [instant, shown, total]);

  const finished = !streaming && visibleCount === total;
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone; // parent passes a new inline arrow every render
  });
  const doneCalled = useRef(false);
  useEffect(() => {
    if (!finished || doneCalled.current) return;
    doneCalled.current = true;
    onDoneRef.current?.();
  }, [finished]);

  return (
    <p>
      <span aria-hidden="true" className="whitespace-pre-line">
        {graphemes.slice(0, visibleCount).join('')}
      </span>
      {!instant && (streaming || visibleCount < total) && (
        <span aria-hidden="true" className="caret-blink ml-px inline-block h-[1em] w-[2px] bg-foreground align-[-0.15em]" />
      )}
      {finished && <span className="sr-only">{text}</span>}
    </p>
  );
}
