import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import { useTheme } from '../context/ThemeContext';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const SIZES = [
  { label: 'S', value: '12px', title: 'Small' },
  { label: 'M', value: null,   title: 'Medium (default)' },
  { label: 'L', value: '20px', title: 'Large' },
];

export function RichTextEditor({ content, onChange, placeholder = 'Write more details…' }: RichTextEditorProps) {
  const { t } = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
        style: `outline: none; min-height: 120px; font-size: 15px; line-height: 1.65; color: ${t.modalInputText}; font-family: "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif;`,
      },
    },
  });

  if (!editor) return null;

  const activeFontSize = editor.getAttributes('textStyle').fontSize ?? null;

  const toolbar = [
    { label: 'B', title: 'Bold', active: editor.isActive('bold'), action: () => editor.chain().focus().toggleBold().run(), style: { fontWeight: 700 } },
    { label: 'I', title: 'Italic', active: editor.isActive('italic'), action: () => editor.chain().focus().toggleItalic().run(), style: { fontStyle: 'italic' } },
    { label: '•', title: 'Bullet list', active: editor.isActive('bulletList'), action: () => editor.chain().focus().toggleBulletList().run(), style: { fontWeight: 700 } },
  ];

  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ border: `1px solid ${t.modalInputBorder}`, background: t.modalInputBg }}>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5" style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
        {/* Size buttons */}
        <div className="flex items-center gap-0.5">
          {SIZES.map(sz => {
            const active = sz.value === null ? activeFontSize === null : activeFontSize === sz.value;
            return (
              <button key={sz.label} type="button" title={sz.title}
                onMouseDown={e => {
                  e.preventDefault();
                  if (sz.value === null) {
                    (editor.chain().focus() as any).unsetFontSize().run();
                  } else {
                    (editor.chain().focus() as any).setFontSize(sz.value).run();
                  }
                  editor.commands.focus();
                }}
                className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                style={{
                  fontSize: sz.label === 'S' ? '9px' : sz.label === 'L' ? '13px' : '11px',
                  fontWeight: 700,
                  background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
                  color: active ? '#7C3AED' : t.textMuted,
                  border: active ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
                }}>
                {sz.label}
              </button>
            );
          })}
        </div>

        <div className="w-px h-3.5 mx-1" style={{ background: t.cardBorder }} />

        {/* Format buttons */}
        {toolbar.map(btn => (
          <button key={btn.label} type="button" title={btn.title}
            onMouseDown={e => { e.preventDefault(); btn.action(); }}
            className="w-7 h-6 rounded flex items-center justify-center transition-colors text-[12px]"
            style={{
              ...btn.style,
              background: btn.active ? 'rgba(124,58,237,0.12)' : 'transparent',
              color: btn.active ? '#7C3AED' : t.textMuted,
              border: btn.active ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
            }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Editor area */}
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .rich-editor-content p { margin: 0 0 4px; }
        .rich-editor-content p:last-child { margin-bottom: 0; }
        .rich-editor-content ul { margin: 4px 0; padding-left: 16px; list-style: disc; }
        .rich-editor-content li { margin-bottom: 2px; }
        .rich-editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${t.textFaint};
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
