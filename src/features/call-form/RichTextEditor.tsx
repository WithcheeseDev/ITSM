import { useEffect, type ComponentType } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { Bold, Italic, List, ListOrdered, Table, TableCellsSplit, Underline } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import type { FieldControlProps } from './Field';

interface Tool {
  label: string;
  icon: ComponentType<{ className?: string }>;
  run: (e: Editor) => void;
  active?: (e: Editor) => boolean;
  show?: (e: Editor) => boolean;
}

const TOOLS: Tool[] = [
  { label: 'ตัวหนา', icon: Bold, run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive('bold') },
  { label: 'ตัวเอียง', icon: Italic, run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive('italic') },
  { label: 'ขีดเส้นใต้', icon: Underline, run: (e) => e.chain().focus().toggleUnderline().run(), active: (e) => e.isActive('underline') },
  { label: 'รายการแบบจุด', icon: List, run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive('bulletList') },
  { label: 'รายการแบบตัวเลข', icon: ListOrdered, run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive('orderedList') },
  { label: 'แทรกตาราง', icon: Table, run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), show: (e) => !e.isActive('table') },
  { label: 'ลบตาราง', icon: TableCellsSplit, run: (e) => e.chain().focus().deleteTable().run(), show: (e) => e.isActive('table') },
];

// Preflight strips list markers and table borders; restore them for rich text (editor + Call Detail notes)
export const RICH_TEXT_CLASS = [
  '[&_p]:my-[var(--space-1)] [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-[var(--space-6)] [&_ol]:pl-[var(--space-6)]',
  '[&_table]:my-[var(--space-2)] [&_table]:w-full [&_table]:border-collapse',
  '[&_td]:border [&_th]:border [&_td]:border-input [&_th]:border-input [&_td]:p-[var(--space-1)] [&_th]:p-[var(--space-1)] [&_th]:bg-muted [&_th]:text-left',
].join(' ');
const EDITOR_CLASS = `min-h-[10rem] px-[var(--space-3)] py-[var(--space-2)] outline-none ${RICH_TEXT_CLASS}`;

/**
 * C7 Notes editor — Tiptap StarterKit (v3 bundles Underline) + table. Output is sanitized by the service on save (C13).
 * Emits only on real document edits (onUpdate) so merely focusing the editor never marks the form dirty.
 */
export function RichTextEditor({
  value, onChange, onBlur, label, control,
}: {
  value: string;
  onChange: (html: string) => void;
  onBlur: () => void;
  label: string;
  control: FieldControlProps;
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false, heading: false, codeBlock: false }), TableKit],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
    onBlur: () => onBlur(),
  });

  const { id, 'aria-invalid': invalid, 'aria-describedby': describedBy } = control;
  // ARIA lives on the contenteditable element, so keep it in sync with the field state
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          id,
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-label': label,
          'aria-invalid': String(invalid),
          ...(describedBy ? { 'aria-describedby': describedBy } : {}),
          class: EDITOR_CLASS,
        },
      },
    });
  }, [editor, id, invalid, describedBy, label]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => (e ? TOOLS.map((t) => ({ active: t.active?.(e) ?? false, show: t.show?.(e) ?? true })) : null),
  });

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-input bg-[var(--input-bg)] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring',
        control['aria-invalid'] && 'border-destructive',
      )}
    >
      <div role="toolbar" aria-label={`จัดรูปแบบ ${label}`} className="flex flex-wrap gap-[var(--space-1)] border-b border-input p-[var(--space-1)]">
        {editor &&
          TOOLS.map((t, i) =>
            state?.[i]?.show === false ? null : (
              <Button
                key={t.label}
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t.label}
                aria-pressed={t.active ? state?.[i]?.active ?? false : undefined}
                className={cn(state?.[i]?.active && 'bg-primary-soft text-primary-soft-foreground')}
                onClick={() => t.run(editor)}
              >
                <t.icon aria-hidden="true" />
              </Button>
            ),
          )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
