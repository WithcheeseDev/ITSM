import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Typewriter } from '@/features/ai-assistant/Typewriter';

let frames: Map<number, FrameRequestCallback>;
let nextFrame = 1;

/** Runs the pending animation frames once (one "frame" of the loop). */
function tick() {
  const pending = [...frames.values()];
  frames.clear();
  act(() => pending.forEach((cb) => cb(performance.now())));
}

const visible = (c: HTMLElement) => c.querySelector('[aria-hidden="true"].whitespace-pre-line')!.textContent;
const caret = (c: HTMLElement) => c.querySelector('.caret-blink');
const srText = (c: HTMLElement) => c.querySelector('.sr-only')?.textContent ?? null;

describe('Typewriter', () => {
  beforeEach(() => {
    frames = new Map();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.set(nextFrame, cb);
      return nextFrame++;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reveals progressively, ends with the full text, then drops the caret, adds sr-only text and calls onDone once', () => {
    const text = 'สวัสดีครับ ยินดีให้บริการเรื่องคอมพิวเตอร์';
    const onDone = vi.fn();
    const { container } = render(<Typewriter text={text} streaming={false} animate onDone={onDone} />);
    expect(visible(container)).toBe('');
    expect(caret(container)).not.toBeNull();
    const seen: string[] = [];
    for (let i = 0; i < 100 && frames.size; i++) {
      tick();
      seen.push(visible(container)!);
    }
    expect(seen.length).toBeGreaterThan(2);
    expect(seen.at(-1)).toBe(text);
    seen.forEach((s, i) => i > 0 && expect(s.length).toBeGreaterThanOrEqual(seen[i - 1]!.length));
    expect(caret(container)).toBeNull();
    expect(srText(container)).toBe(text);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sr-only text is absent while typing', () => {
    const { container } = render(<Typewriter text="สวัสดีครับ" streaming={false} animate />);
    tick();
    expect(visible(container)).not.toBe('สวัสดีครับ');
    expect(srText(container)).toBeNull();
  });

  it('Thai "ที่นี่" never shows a lone vowel or tone mark', () => {
    const { container } = render(<Typewriter text="ที่นี่" streaming={false} animate />);
    const seen = [visible(container)];
    while (frames.size) {
      tick();
      seen.push(visible(container));
    }
    seen.forEach((s) => expect(['', 'ที่', 'ที่นี่']).toContain(s));
    expect(seen.at(-1)).toBe('ที่นี่');
  });

  it('growing text continues from the revealed count, and the stream end carries over without restarting', () => {
    const onDone = vi.fn();
    const { container, rerender } = render(<Typewriter text="abcdefghij" streaming animate />);
    tick();
    tick();
    const before = visible(container)!;
    expect(before.length).toBeGreaterThan(0);
    rerender(<Typewriter text={'abcdefghij'.repeat(5)} streaming animate />);
    expect(visible(container)).toBe(before); // not reset to ''
    while (frames.size) tick();
    expect(visible(container)).toBe('abcdefghij'.repeat(5));
    expect(caret(container)).not.toBeNull(); // still streaming
    expect(srText(container)).toBeNull();

    rerender(<Typewriter text={'abcdefghij'.repeat(5)} streaming={false} animate onDone={onDone} />);
    expect(visible(container)).toBe('abcdefghij'.repeat(5));
    expect(caret(container)).toBeNull();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('text that no longer starts with the shown prefix clamps to the common prefix', () => {
    const { container, rerender } = render(<Typewriter text="abcdefgh" streaming animate />);
    while (frames.size) tick();
    rerender(<Typewriter text="abcXYZ" streaming={false} animate />);
    expect(visible(container)).toBe('abc');
    while (frames.size) tick();
    expect(visible(container)).toBe('abcXYZ');
  });

  it('animate=false shows the full text at once, no caret, and calls onDone', () => {
    const onDone = vi.fn();
    const { container } = render(<Typewriter text="สวัสดีครับ" streaming={false} animate={false} onDone={onDone} />);
    expect(visible(container)).toBe('สวัสดีครับ');
    expect(caret(container)).toBeNull();
    expect(srText(container)).toBe('สวัสดีครับ');
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it('prefers-reduced-motion shows the full text at once', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(prefers-reduced-motion: reduce)', media: q }) as MediaQueryList);
    const { container } = render(<Typewriter text="สวัสดีครับ" streaming={false} animate />);
    expect(visible(container)).toBe('สวัสดีครับ');
    expect(caret(container)).toBeNull();
    expect(frames.size).toBe(0);
  });
});
