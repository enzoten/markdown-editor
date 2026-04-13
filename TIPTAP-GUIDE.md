# Tiptap Implementation Guide

Technical reference for building the GFM WYSIWYG editor with Tiptap. This document covers packages, extensions, configuration, and known gotchas.

## Licensing

The entire Tiptap stack is MIT licensed and free. Every package referenced in this document — the core editor, all extensions, the Markdown extension, Yjs bindings, and Hocuspocus collaboration server — is open source with no paid tiers, no pro-only features, and no usage-based pricing.

Tiptap offers a paid hosted service called "Tiptap Cloud." We do not use it. All infrastructure is self-hosted. Do not introduce any dependency on Tiptap Cloud or any other paid collaboration service (e.g., Liveblocks).

---

## Core Package

### Markdown Serialization

**Package:** `@tiptap/markdown` (v3.22.3+, official)

This is the official Tiptap Markdown extension that handles bidirectional conversion: parse Markdown strings into Tiptap's JSON document model, and serialize editor content back to Markdown. It supports full round-tripping (Markdown → JSON → Markdown preserves content).

**Important:** There is an older third-party package called `tiptap-markdown` on npm. Do not use it — it's deprecated. Use the official `@tiptap/markdown`.

**GFM configuration:**

```javascript
import { Markdown } from '@tiptap/markdown'

Markdown.configure({
  markedOptions: {
    gfm: true,        // Enable GitHub Flavored Markdown
    breaks: false,    // Don't convert newlines to <br>
    pedantic: false   // Not strict original Markdown mode
  }
})
```

For additional parsing validation, use `remark` with `remark-gfm` as a secondary parser to verify round-trip fidelity on edge cases.

---

## Required Extensions for Full GFM

### Starter Kit

`@tiptap/extension-starter-kit` bundles most core extensions: Bold, Italic, Code, Strike, Link, Blockquote, BulletList, OrderedList, ListItem, CodeBlock, Document, HardBreak, Heading, HorizontalRule, Paragraph, Text, Dropcursor, Gapcursor, Undo/Redo, ListKeymap, TrailingNode.

You still need to add manually: Task lists, table extensions, syntax-highlighted code blocks, images, and the Markdown extension.

### Complete Extension List

| Feature | Package | Notes |
|---|---|---|
| Bold | `@tiptap/extension-bold` | `**text**` or `__text__` |
| Italic | `@tiptap/extension-italic` | `*text*` or `_text_` |
| Strikethrough | `@tiptap/extension-strike` | `~~text~~` (GFM extension) |
| Headings | `@tiptap/extension-heading` | `#` through `######` |
| Bullet Lists | `@tiptap/extension-bullet-list` | `*`, `-`, or `+` |
| Ordered Lists | `@tiptap/extension-ordered-list` | `1.`, `2.`, etc. |
| Task Lists | `@tiptap/extension-task-list` + `@tiptap/extension-task-item` | `- [ ]` / `- [x]` (GFM extension) |
| Blockquotes | `@tiptap/extension-blockquote` | `> quote` |
| Horizontal Rules | `@tiptap/extension-horizontal-rule` | `---` |
| Inline Code | `@tiptap/extension-code` | `` `code` `` |
| Code Blocks | `@tiptap/extension-code-block-lowlight` | Use this instead of plain `code-block` for syntax highlighting |
| Links | `@tiptap/extension-link` | `[text](url)`. Configure `shouldAutoLink` for GFM autolinks. |
| Images | `@tiptap/extension-image` | `![alt](url)` |
| Tables | `@tiptap/extension-table-kit` | Bundles Table, TableRow, TableCell, TableHeader |
| Hard Breaks | `@tiptap/extension-hard-break` | `<br>` |

All packages are official `@tiptap/` namespace, version 3.x.

---

## Syntax Highlighting (Code Blocks)

**Package:** `@tiptap/extension-code-block-lowlight` + `lowlight`

Tiptap uses `lowlight` (a ProseMirror-compatible wrapper around highlight.js) rather than highlight.js directly. This gives better integration with Tiptap's document model and lets you control which languages are loaded (keeping the bundle small).

**Installation:**

```bash
npm install @tiptap/extension-code-block-lowlight lowlight
```

**Setup:**

```javascript
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

// Option 1: Load common languages (covers ~35 popular languages)
const lowlight = createLowlight(common)

// Option 2: Load specific languages for smaller bundle
import { createLowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import swift from 'highlight.js/lib/languages/swift'
import html from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'

const lowlight = createLowlight()
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
// ... register each language

// Use in editor
CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: 'plaintext'
})
```

**Language selector:** Tiptap stores the language as an attribute on the code block node. The language name is set when the block is created and can be changed programmatically via `editor.chain().focus().setCodeBlock({ language: 'python' }).run()`. You'll need to build a custom dropdown UI for language selection — Tiptap doesn't provide one.

**Highlight.js themes:** Import a CSS theme for syntax colors. Use a theme that works in both light and dark mode, or swap themes when the mode changes.

---

## Table Editing

**Package:** `@tiptap/extension-table-kit` (bundles Table, TableRow, TableCell, TableHeader)

### Available Commands

| Action | Command |
|---|---|
| Insert table | `editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()` |
| Add row above | `editor.chain().focus().addRowBefore().run()` |
| Add row below | `editor.chain().focus().addRowAfter().run()` |
| Delete row | `editor.chain().focus().deleteRow().run()` |
| Add column left | `editor.chain().focus().addColumnBefore().run()` |
| Add column right | `editor.chain().focus().addColumnAfter().run()` |
| Delete column | `editor.chain().focus().deleteColumn().run()` |
| Toggle header row | `editor.chain().focus().toggleHeaderRow().run()` |
| Merge cells | `editor.chain().focus().mergeCells().run()` |
| Split cell | `editor.chain().focus().splitCell().run()` |

### Built-in Behaviors

- **Tab** moves to the next cell (left to right, then wraps to next row).
- **Shift+Tab** moves to the previous cell.
- Column alignment (left, center, right) is supported.
- Column resizing is available via `columnResizing: true` in config.

### GFM Table Output

When serialized to Markdown, tables produce standard GFM pipe syntax:

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|:--------:|---------:|
| Left     | Center   | Right    |
| Cell     | Cell     | Cell     |
```

**Note:** Merge cells and split cells are Tiptap features that don't map to GFM (GFM only supports simple grid tables). Disable or hide these commands since they can't be represented in the output.

---

## Yjs / Collaboration Integration

Not needed for V1 but documented here for V2 planning. The infrastructure choice affects V1 architecture decisions (e.g., how undo/redo works).

**Packages:**

```bash
npm install yjs @tiptap/extension-collaboration @tiptap/y-tiptap y-websocket
```

**Setup:**

```javascript
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Collaboration } from '@tiptap/extension-collaboration'

const ydoc = new Y.Doc()
const provider = new WebsocketProvider('ws://localhost:1234', 'document-room', ydoc)

const editor = new Editor({
  extensions: [
    Collaboration.configure({
      document: ydoc,
      field: 'content'
    })
  ]
})
```

**Backend:** Use Hocuspocus (official Tiptap backend, `@hocuspocus/server`) for production. It handles WebSocket connections, document persistence, authentication, and room management. GitHub: `ueberdosis/hocuspocus`.

**Important V1 consideration:** When the Collaboration extension is active, it replaces Tiptap's built-in undo/redo with Yjs-based undo/redo. If you plan to add collaboration later, be aware that undo behavior will change. This is generally fine but worth noting.

---

## YAML Front-Matter

**No official Tiptap extension exists.** This must be custom-built.

### Recommended Architecture

The front-matter is not part of the Tiptap editor content. It's handled as a separate data layer:

1. **On file open:** Before passing Markdown to Tiptap, intercept the content. If it starts with `---`, extract the YAML front-matter block using a parser like `js-yaml` or `yaml`. Store the parsed front-matter in React state (or a separate store). Pass only the body (everything after the closing `---`) to Tiptap.

2. **During editing:** The front-matter panel is a separate React component above the Tiptap editor. It reads from and writes to the front-matter state. Tiptap doesn't know about it.

3. **On file save:** Serialize the front-matter state back to YAML, prepend it with `---` delimiters to the Tiptap Markdown output, and write the combined string to the file.

```
┌─────────────────────────────────┐
│ Front-Matter Panel (React)      │  ← Reads/writes front-matter state
│ Separate from Tiptap            │
├─────────────────────────────────┤
│ Tiptap Editor                   │  ← Only sees body content
│ (Markdown body without YAML)    │
└─────────────────────────────────┘
```

### Parsing Library

**Package:** `yaml` (npm) or `js-yaml`

```javascript
import yaml from 'yaml'

function parseFrontMatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { frontMatter: null, body: markdown }
  return {
    frontMatter: yaml.parse(match[1]),
    body: match[2]
  }
}

function serializeFrontMatter(frontMatter, body) {
  if (!frontMatter) return body
  return `---\n${yaml.stringify(frontMatter)}---\n\n${body}`
}
```

---

## Zero Syntax Reveal: What to Know

### How Tiptap Handles This

Tiptap edits a JSON document model, not Markdown text. The user interacts with a ProseMirror DOM — styled HTML elements, not Markdown source. Markdown syntax (`**`, `#`, `- [ ]`, etc.) is never part of what the user sees because it only exists during import/export.

This is fundamentally different from editors like Typora, which edit Markdown source and try to style it in place. Tiptap's approach is more like Google Docs — the rendered view IS the editing surface. Markdown is just the serialization format.

### Why This Is Good News

The zero-syntax-reveal requirement is actually Tiptap's natural behavior. You're not hiding syntax — it was never visible in the first place. The user types formatted text, and Tiptap serializes it to Markdown on save.

### Known Gotchas

1. **Markdown shortcuts input rules:** Tiptap supports "Markdown shortcuts" — typing `**` followed by text will trigger bold. If enabled, the user briefly sees the `**` characters before the input rule converts them. **Recommendation:** Disable Markdown input rules for this app. The user applies formatting via toolbar and keyboard shortcuts only. This eliminates any transient syntax visibility.

2. **Copy/paste from Markdown source:** If someone pastes raw Markdown text (e.g., `**bold text**`), Tiptap may render it as literal text rather than applying formatting, depending on the paste handler configuration. Configure the paste handler to parse incoming Markdown and convert it to formatted content.

3. **Round-trip fidelity:** Some GFM constructs may not round-trip perfectly. Test thoroughly with: nested lists, tables with inline formatting, task lists inside blockquotes, and code blocks containing Markdown-like text.

4. **Table complexity:** GFM pipe tables with complex cell content may not serialize perfectly. Test with multi-line cell content and inline formatting within cells.

### Prototyping Validation Checklist

During the two-week prototyping phase, verify:

- [ ] Bold/italic text stays formatted when cursor enters it
- [ ] Headings stay rendered (no `#` visible, ever)
- [ ] Links show styled text, not `[text](url)`
- [ ] Code blocks show highlighted code, not triple backticks
- [ ] Task list checkboxes render as interactive checkboxes
- [ ] Tables render as grids, not pipe characters
- [ ] Horizontal rules render as visual dividers, not `---`
- [ ] Blockquotes render with visual styling, not `>` characters
- [ ] No transient syntax flash during any editing operation
- [ ] Disabling Markdown input rules eliminates all syntax visibility
- [ ] Paste from external Markdown source converts to formatted content
- [ ] Round-trip: open .md file → edit → save → reopen → content is identical

---

## Output Quality: Custom Serializer

The default `@tiptap/markdown` serializer may not produce output that meets the pristine quality requirements. You may need a custom serialization pass.

### Requirements for the serializer

- ATX-style headings only (e.g., `## Heading`, not underline style)
- No trailing whitespace on any line
- Exactly one blank line between block-level elements
- 4-space indentation for nested lists
- Clean pipe-delimited tables with consistent column padding
- UTF-8 encoding, LF line endings (no CRLF)

### Approach

Run the Tiptap Markdown output through a normalization pass using `remark` with `remark-gfm` and `remark-stringify` configured with strict formatting options:

```javascript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'

const normalizer = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: '-',
    emphasis: '*',
    strong: '**',
    listItemIndent: 'one',
    rule: '-',
    fences: true,
    incrementListMarker: true
  })

async function normalizeMarkdown(raw) {
  const result = await normalizer.process(raw)
  return String(result)
}
```

This ensures consistent, clean output regardless of how Tiptap serializes internally.

---

## NPM Install Summary

All packages needed for V1:

```bash
# Core
npm install @tiptap/react @tiptap/pm @tiptap/markdown

# Starter kit (bundles most basic extensions)
npm install @tiptap/extension-starter-kit

# Additional GFM extensions
npm install @tiptap/extension-task-list @tiptap/extension-task-item
npm install @tiptap/extension-table-kit
npm install @tiptap/extension-image
npm install @tiptap/extension-code-block-lowlight lowlight

# Markdown parsing/normalization
npm install remark remark-parse remark-gfm remark-stringify unified

# YAML front-matter
npm install yaml

# Syntax highlighting theme (pick one)
npm install highlight.js
```
