import DOMPurify from 'dompurify'

// Force every <a> tag to open safely in a new tab.
// Prevents tab-hijacking via window.opener.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

/**
 * Sanitize an HTML string before setting it as innerHTML / passing to a rich
 * text editor.  Protects against:
 *
 *  - XSS via <script>, event handlers (onerror, onclick …), javascript: URIs
 *  - CSS injection via style attributes / expressions
 *  - SVG/MathML-based XSS vectors
 *  - data: URI abuse in href / src
 *  - DOM clobbering (id/name shadowing browser globals)
 *  - Prototype-pollution payloads in attribute names
 *
 * Only the subset of tags that Markdown can legitimately produce is allowed.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    // Explicit allowlist — anything not listed is stripped
    ALLOWED_TAGS: [
      'p', 'br',
      'strong', 'b', 'em', 'i', 's', 'del', 'u',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr',
    ],
    // Only inert presentation attributes — no event handlers, no style
    ALLOWED_ATTR: ['href', 'title', 'class'],
    // Block data-* attributes (potential DOM-based XSS vectors)
    ALLOW_DATA_ATTR: false,
    // Only allow safe URL schemes in href
    ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
    // Prevent DOM clobbering (e.g. <form id="nodeName">)
    SANITIZE_DOM: true,
    // Don't keep <template> element content
    KEEP_CONTENT: false,
    // Strip unknown tags instead of keeping their text content
    // (prevents <iframe>payload</iframe> leaving "payload" behind)
    WHOLE_DOCUMENT: false,
  })
}
