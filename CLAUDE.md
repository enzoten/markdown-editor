# Markdown Editor

## What This Is

A web-based WYSIWYG Markdown editor designed to be the accessible, collaborative interface for a "Team OS" — a structured knowledge base of Markdown files that serves as a team's shared brain, readable by both humans and AI agents.

## Project Documentation

Read these files before starting any work:

- `PRD.md` — Full product spec: vision, features, technical architecture, roadmap.
- `DECISIONS.md` — Architecture decision log. When you hit a fork in the road, check here for the reasoning behind key choices.
- `UI-SPEC.md` — Detailed interaction design: toolbar layout, keyboard shortcuts, sidebar behaviors, table editing, search, typography.
- `TIPTAP-GUIDE.md` — Tiptap implementation reference: packages, extensions, configuration, syntax highlighting, table commands, YAML front-matter architecture, output normalization, and the zero-syntax-reveal validation checklist.

## V1 Scope

V1 is a polished, single-user web-based editor. No accounts, no cloud storage, no collaboration yet. The goal is to nail the editing experience and output quality.

### V1 Features

- WYSIWYG editing with zero syntax reveal (no raw Markdown visible, ever — not even on cursor focus)
- Toolbar exposing only GFM-valid formatting operations
- Document outline sidebar (heading hierarchy, click-to-navigate)
- YAML front-matter panel (rendered as structured metadata, not raw YAML)
- Visual table editor (click into cells, add/remove rows/columns)
- Fenced code blocks with syntax highlighting and language selector
- Inline image display with alt text editing
- Standard keyboard shortcuts (Cmd+B, Cmd+I, Cmd+K, etc.)
- Dark mode (follows system preference)
- Local file open/save via File System Access API (Chromium) with upload/download fallback
- Find and replace (operates on visible text, not Markdown syntax)
- Optional Tauri desktop wrapper for native file access and offline use

### V1 Does NOT Include

- User accounts or authentication
- Cloud document storage
- File tree sidebar (browser version — available in Tauri wrapper only)
- Context maps
- Comments, suggestions, or collaboration
- MCP server or agent access
- Templates
- Export to PDF/HTML (the .md file IS the output)

## Tech Stack

- **Frontend:** React + TypeScript
- **Editor:** Tiptap (built on ProseMirror) — the core editing engine. Tiptap handles bidirectional Markdown serialization, GFM support, and is collaboration-ready (native Yjs integration for V2+).
- **Markdown parsing:** Tiptap's Markdown extension for bidirectional conversion. Remark with remark-gfm as a validation/fallback parser.
- **Syntax highlighting:** lowlight (highlight.js) via Tiptap's code block extension.
- **Styling:** TBD — but the UI should feel clean, minimal, and professional. Not a developer tool aesthetic.
- **Desktop wrapper (optional):** Tauri for native file system access and offline use.

## Architecture Decisions

### Editing Engine: Tiptap

Tiptap was chosen over native approaches (NSTextView, TextKit 2) because:
1. The product is web-first (collaboration is the long-term architecture)
2. Tiptap has native Yjs integration for real-time collaboration in V2+
3. Tiptap's Markdown bidirectional serialization is mature
4. The extension API supports custom GFM features (tables, task lists, front-matter)

### GFM Spec Boundary

The editor exposes ONLY formatting that maps to valid GitHub Flavored Markdown. No proprietary extensions. No rich formatting beyond what GFM supports. YAML front-matter is the single exception (not in GFM, but essential for agent-consumed documents).

If a toolbar button can't be represented in GFM, it doesn't exist.

### Output Quality

The Markdown serializer must produce pristine output:
- ATX-style headings only (no setext)
- No trailing whitespace
- Single blank line between block elements
- Consistent 4-space indentation for nested lists
- Clean pipe-delimited tables with aligned columns
- UTF-8 encoding, LF line endings

This matters because the files will be consumed by AI agents. Clean structure = better agent comprehension.

### Zero Syntax Reveal

The hardest technical requirement. The user must NEVER see raw Markdown syntax:
- Cursor inside bold text: text stays bold, toolbar shows bold active
- Cursor inside a heading: heading stays rendered, toolbar shows heading level
- Cursor inside a link: link stays styled, not revealed as `[text](url)`
- No transient syntax flash during any editing operation

This is the highest-risk requirement. Validate during the prototyping phase before committing to the full build.

## Information Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Title Bar                                                           │
├─────────────────┬───────────────────────────────────────────────────┤
│                 │              Toolbar                               │
│                 │  [H▾][B][I][S][`][🔗][📷]                        │
│                 │  [•][1.][☐][❝][—][</>][⊞]                        │
│  Document       ├───────────────────────────────────────────────────┤
│  Outline        │                                                   │
│                 │  Front-Matter Panel                               │
│  • Vision       │  ┌─────────────────────────────────────┐         │
│  • Problem      │  │ title: PRD                          │         │
│    • Users      │  │ status: draft                       │         │
│  • Features     │  └─────────────────────────────────────┘         │
│    • Editor     │                                                   │
│    • Toolbar    │  Document Body                                    │
│    • Tables     │                                                   │
│    • Code       │  The editor renders here as a clean WYSIWYG      │
│                 │  word processing surface.                          │
│                 │                                                   │
├─────────────────┴───────────────────────────────────────────────────┤
│  Status Bar (word count, cursor position)                            │
└──────────────────────────────────────────────────────────────────────┘
```

V1 layout: Document Outline (left, toggleable) + Editor (right, fills remaining space). The File Tree panel is added in V2 to the left of the outline, creating a three-panel layout: File Tree → Document Outline → Editor.

## Development Approach

1. **Start with the editor.** Get Tiptap rendering a basic WYSIWYG Markdown document with bold, italic, headings, and lists. Validate zero-syntax-reveal.
2. **Add GFM features.** Tables, task lists, strikethrough, code blocks with syntax highlighting.
3. **Build the toolbar.** Format state reflection, toggle behavior.
4. **Build the document outline sidebar.** Heading extraction, click-to-navigate, scroll-position highlighting.
5. **Add YAML front-matter panel.** Parse front-matter, render as structured fields, bidirectional sync.
6. **File operations.** Open/save via File System Access API, upload/download fallback.
7. **Polish.** Dark mode, keyboard shortcuts, find/replace, typography tuning.

## Future Context (V2+)

V2 adds accounts, cloud storage, context maps, comments/suggestions, an MCP server for AI agent access, and CLAUDE.md rendering. V3 adds real-time multiplayer editing via Yjs. V4 adds AI agents as document collaborators. See `PRD.md` for full roadmap.
