import {useCallback, useEffect, useState} from 'react'
import {EditorContent, useEditor} from '@tiptap/react'
import {StarterKit} from '@tiptap/starter-kit'
import {Bold, Code, Italic, List, ListOrdered} from 'lucide-react'
import {marked} from 'marked'
import {cn} from '@/utils/cn'

function toHtml(value: string): string {
  if (!value) return ''
  if (value.trimStart().startsWith('<')) return value
  return marked.parse(value, { async: false }) as string
}

export function DescriptionEditor({ value, onSave }: { value: string; onSave: (html: string) => void }) {
  const [editing, setEditing] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: toHtml(value),
    editable: false,
    editorProps: {
      attributes: {
        class: [
          'outline-none min-h-[80px] text-sm leading-relaxed text-text-primary',
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
  })

  useEffect(() => {
    if (editor && !editing) editor.commands.setContent(toHtml(value))
  }, [value, editor, editing])

  useEffect(() => {
    if (editor) editor.setEditable(editing)
  }, [editor, editing])

  const save = useCallback(() => {
    if (!editor) return
    const html = editor.getHTML()
    if (html !== value) onSave(html)
    setEditing(false)
  }, [editor, value, onSave])

  const cancel = useCallback(() => {
    editor?.commands.setContent(toHtml(value))
    setEditing(false)
  }, [editor, value])

  const isEmpty = !value || value === '<p></p>'

  return (
    <div>
      {editing && (
        <div className="mb-1 flex items-center gap-0.5 rounded-t-md border border-b-0 border-surface-border bg-surface-muted px-1.5 py-1">
          {([
            { icon: Bold,        tip: 'Bold',         fn: () => editor?.chain().focus().toggleBold().run() },
            { icon: Italic,      tip: 'Italic',       fn: () => editor?.chain().focus().toggleItalic().run() },
            { icon: Code,        tip: 'Code',         fn: () => editor?.chain().focus().toggleCode().run() },
            { icon: List,        tip: 'Bullet list',  fn: () => editor?.chain().focus().toggleBulletList().run() },
            { icon: ListOrdered, tip: 'Ordered list', fn: () => editor?.chain().focus().toggleOrderedList().run() },
          ] as const).map(({ icon: Icon, tip, fn }) => (
            <button
              key={tip}
              onMouseDown={(e) => { e.preventDefault(); fn() }}
              title={tip}
              className="rounded p-1 text-text-muted hover:bg-surface-border hover:text-text-primary"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          'rounded-md transition-all',
          editing
            ? 'rounded-tl-none border border-primary px-3 py-2 ring-2 ring-primary/10'
            : 'cursor-text border border-transparent px-3 py-2 hover:border-surface-border',
        )}
        onClick={() => { if (!editing) setEditing(true) }}
      >
        {isEmpty && !editing
          ? <p className="text-sm text-text-muted">Add a description…</p>
          : <EditorContent editor={editor} />
        }
      </div>

      {editing && (
        <div className="mt-2 flex gap-2">
          <button onClick={save} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-light">
            Save
          </button>
          <button onClick={cancel} className="rounded-md px-3 py-1 text-xs text-text-muted hover:text-text-primary">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
