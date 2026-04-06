import {useCallback, useEffect, useState} from 'react'
import {EditorContent, useEditor} from '@tiptap/react'
import {StarterKit} from '@tiptap/starter-kit'
import {TaskList} from '@tiptap/extension-task-list'
import {TaskItem} from '@tiptap/extension-task-item'
import {Bold, Code, Italic, List, ListOrdered, CheckSquare} from 'lucide-react'
import {marked} from 'marked'
import {sanitizeHtml} from '@/utils/sanitize'
import {cn} from '@/utils/cn'

/**
 * Convert GitHub-style checkbox HTML from `marked` into the data-attribute
 * format that Tiptap's TaskList/TaskItem extension understands.
 *
 * marked output:  <ul><li><input type="checkbox" checked=""> text</li></ul>
 * tiptap expects: <ul data-type="taskList"><li data-type="taskItem" data-checked="true">text</li></ul>
 */
function convertCheckboxHtml(html: string): string {
  // Match <ul> blocks that contain at least one checkbox <li>
  return html.replace(
    /<ul>\n?((?:<li><input[^>]*type="checkbox"[^>]*>.*?<\/li>\n?)+)<\/ul>/gs,
    (_match, inner: string) => {
      const items = inner.replace(
        /<li><input[^>]*?(checked(?:="[^"]*")?)?[^>]*>\s*(.*?)<\/li>/gs,
        (_m: string, checked: string | undefined, text: string) => {
          const isChecked = !!checked
          return `<li data-type="taskItem" data-checked="${isChecked}">${text.trim()}</li>`
        },
      )
      return `<ul data-type="taskList">${items}</ul>`
    },
  )
}

/**
 * Detect if an HTML string is actually markdown that was wrapped in <p> tags
 * by Tiptap (user typed raw markdown, editor saved it as `<p># heading</p>`).
 */
function isMarkdownInHtml(html: string): boolean {
  // Strip all HTML tags and check if the plain text contains markdown markers
  const text = html.replace(/<[^>]+>/g, '\n')
  return /^#{1,6}\s/m.test(text)
    || /^[-*+]\s/m.test(text)
    || /^\d+\.\s/m.test(text)
    || /^>\s/m.test(text)
    || /^- \[[ x]\]/m.test(text)
    || /\*\*.+\*\*/m.test(text)
    || /```/m.test(text)
}

function parseMarkdown(value: string): string {
  const html = marked.parse(value, { async: false, gfm: true, breaks: true }) as string
  return sanitizeHtml(convertCheckboxHtml(html))
}

function toHtml(value: string): string {
  if (!value) return ''

  // Raw markdown (not HTML at all)
  if (!value.trimStart().startsWith('<')) return parseMarkdown(value)

  // HTML that contains markdown syntax inside <p> tags — extract text and re-parse
  if (isMarkdownInHtml(value)) {
    const plaintext = value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
    return parseMarkdown(plaintext)
  }

  // Already proper HTML from Tiptap's rich editor
  return sanitizeHtml(value)
}

export function DescriptionEditor({ value, onSave }: { value: string; onSave: (html: string) => void }) {
  const [editing, setEditing] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: toHtml(value),
    editable: false,
    editorProps: {
      attributes: {
        class: [
          'outline-none min-h-[80px] text-sm leading-relaxed text-text-primary',
          // Paragraphs
          '[&_p]:mb-2 [&_p:last-child]:mb-0',
          // Headings
          '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4 [&_h1:first-child]:mt-0',
          '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2:first-child]:mt-0',
          '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3:first-child]:mt-0',
          // Lists
          '[&_ul]:list-disc [&_ul]:ps-5 [&_ul]:mb-2',
          '[&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:mb-2',
          '[&_li]:mb-0.5',
          // Task lists (checkboxes)
          '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:ps-0',
          '[&_li[data-type="taskItem"]]:flex [&_li[data-type="taskItem"]]:items-start [&_li[data-type="taskItem"]]:gap-2',
          '[&_li[data-type="taskItem"]_label]:mt-0.5',
          '[&_li[data-type="taskItem"]_input]:mt-1',
          // Code
          '[&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs',
          '[&_pre]:bg-surface-muted [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:mb-2 [&_pre]:overflow-x-auto',
          '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
          // Blockquote
          '[&_blockquote]:border-s-2 [&_blockquote]:border-primary [&_blockquote]:ps-3 [&_blockquote]:italic [&_blockquote]:text-text-secondary [&_blockquote]:mb-2',
          // Horizontal rule
          '[&_hr]:border-surface-border [&_hr]:my-4',
          // Table
          '[&_table]:w-full [&_table]:border-collapse [&_table]:mb-2',
          '[&_th]:border [&_th]:border-surface-border [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-start [&_th]:font-semibold [&_th]:bg-surface-muted [&_th]:text-xs',
          '[&_td]:border [&_td]:border-surface-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-xs',
          // Strong/emphasis
          '[&_strong]:font-semibold',
          '[&_em]:italic',
          // Links
          '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary-light',
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
            { icon: CheckSquare, tip: 'Task list',    fn: () => editor?.chain().focus().toggleTaskList().run() },
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
