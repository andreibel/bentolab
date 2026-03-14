import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Bold, Italic, Code, List, ListOrdered, Heading2, Quote } from 'lucide-react'

interface RichTextInputProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextInput({ value, onChange, placeholder = 'Add a description…' }: RichTextInputProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editorProps: {
      attributes: {
        class: [
          'outline-none min-h-[160px] text-sm leading-relaxed text-text-primary px-3 py-2.5',
          '[&>p]:mb-2 [&>p:last-child]:mb-0',
          '[&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2',
          '[&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-2',
          '[&>ul]:list-disc [&>ul]:ps-5 [&>ul]:mb-2',
          '[&>ol]:list-decimal [&>ol]:ps-5 [&>ol]:mb-2',
          '[&_li]:mb-0.5',
          '[&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs',
          '[&>pre]:bg-surface-muted [&>pre]:rounded-md [&>pre]:p-3 [&>pre]:mb-2 [&>pre]:overflow-x-auto',
          '[&>blockquote]:border-s-2 [&>blockquote]:border-primary [&>blockquote]:ps-3 [&>blockquote]:italic [&>blockquote]:text-text-secondary',
        ].join(' '),
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
  })

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || ''
    if (current !== next) editor.commands.setContent(next)
  }, [value, editor])

  const tools = [
    { icon: Bold,        tip: 'Bold',          fn: () => editor?.chain().focus().toggleBold().run() },
    { icon: Italic,      tip: 'Italic',        fn: () => editor?.chain().focus().toggleItalic().run() },
    { icon: Code,        tip: 'Inline code',   fn: () => editor?.chain().focus().toggleCode().run() },
    { icon: Heading2,    tip: 'Heading',       fn: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: List,        tip: 'Bullet list',   fn: () => editor?.chain().focus().toggleBulletList().run() },
    { icon: ListOrdered, tip: 'Ordered list',  fn: () => editor?.chain().focus().toggleOrderedList().run() },
    { icon: Quote,       tip: 'Blockquote',    fn: () => editor?.chain().focus().toggleBlockquote().run() },
  ] as const

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-muted transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-surface-border bg-surface px-2 py-1.5">
        {tools.map(({ icon: Icon, tip, fn }) => (
          <button
            key={tip}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); fn() }}
            title={tip}
            className="rounded p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {/* Editor area */}
      <div
        className="relative flex-1 cursor-text"
        onClick={() => editor?.commands.focus()}
      >
        {(!value || value === '<p></p>') && !editor?.isFocused && (
          <p className="pointer-events-none absolute left-3 top-2.5 text-sm text-text-muted">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}