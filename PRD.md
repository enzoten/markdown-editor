# Product Requirements Document: Markdown Editor

## Vision

A web-based application that provides a seamless, polished word processing experience where the underlying file format is Markdown. The editor presents a full WYSIWYG interface — users never see raw Markdown syntax — while adhering strictly to the GitHub Flavored Markdown specification. Every formatting action the app exposes maps directly to valid GFM, with YAML front-matter as the single supported extension.

The app serves a dual audience: human collaborators (peers, stakeholders, executives) who read and review documents, and AI agents (Claude, OpenAI Codex) that consume Markdown files as structured context. Clean, well-structured GFM output ensures maximum legibility for both.

The web-first architecture is a deliberate choice. The product's long-term vision is real-time collaboration — between humans and between humans and AI agents. Building on web technologies means the collaboration infrastructure, editing engine, and user experience are a single codebase from day one. Anyone with a browser can open a link and start collaborating. No install required, no platform dependency.

## Problem Statement

Existing Markdown editors fall short in one or more critical ways:

- **Typora** approaches the right editing model but breaks the WYSIWYG illusion by revealing raw syntax on cursor focus. It's a desktop-only app with no collaboration story.
- **iA Writer, Ulysses, Bear** are well-designed but lean toward plain-text source editing, use proprietary organizational models (libraries, tags), and are locked to Apple platforms with no collaboration.
- **Obsidian** is powerful but extension-heavy and optimized for knowledge management rather than document authoring. Its collaboration features are limited and require paid sync.
- **VS Code + Markdown extensions** is a developer tool, not a word processor. Non-technical stakeholders won't use it.
- **Google Docs and Notion** have excellent collaboration but don't produce Markdown. The output is locked in proprietary formats that AI agents can't cleanly consume.
- **HackMD / CodiMD** are collaborative Markdown editors but expose raw syntax and are oriented toward developers, not cross-functional teams.

None of these tools combine a true WYSIWYG experience, strict Markdown standards compliance, real-time collaboration accessible to non-technical users, and first-class AI agent participation — all producing clean `.md` files that are both human-readable and machine-parseable.

## Target Users

### Primary: Product Managers and Technical Leaders

People who author specifications, research documents, architectural decisions, and PRDs. They work cross-functionally with engineering, design, operations, and executive leadership. They need a tool that produces professional documents their entire organization can read, while also generating clean Markdown that AI coding agents can consume as context.

### Secondary: Anyone Authoring Markdown for AI Agent Consumption

Developers and power users writing CLAUDE.md files, skill files, agent instructions, and context documents. They need an editor that produces pristine, standards-compliant Markdown — not because they can't write raw syntax, but because a WYSIWYG editor is faster for long-form authoring and catches structural issues that are easy to miss in source view.

### Tertiary: Cross-Functional Collaborators

VPs, executives, operations staff, and other non-technical stakeholders who need to read, review, and eventually co-edit documents. They should never need to know or care that the underlying format is Markdown. They click a link, the document opens in their browser, and they start reading or editing. Zero friction.

---

## Supported Markdown Specification

The app implements **GitHub Flavored Markdown (GFM)** as defined by the [GFM spec](https://github.github.com/gfm/), plus YAML front-matter. The toolbar, keyboard shortcuts, and editing engine expose only formatting options that produce valid output within this specification. Nothing more.

### GFM Block-Level Elements

- **Headings** — Levels 1 through 6. Rendered via ATX-style (`#` through `######`) in the output file.
- **Paragraphs** — Standard text blocks separated by blank lines.
- **Blockquotes** — Nested block-level quotations.
- **Ordered lists** — Numbered list items with support for nested sublists.
- **Unordered lists** — Bullet list items with support for nested sublists.
- **Fenced code blocks** — Triple-backtick code blocks with an optional language identifier. Rendered with syntax highlighting in the editor.
- **Indented code blocks** — Four-space-indented code (supported in parsing; the editor produces fenced blocks for new code).
- **Thematic breaks** — Horizontal rules.
- **HTML blocks** — Raw HTML passthrough (supported in parsing for compatibility; not exposed in the toolbar).

### GFM Inline Elements

- **Bold** (strong emphasis)
- **Italic** (emphasis)
- **Bold + Italic** (combined emphasis)
- **Inline code**
- **Links** — Both inline and reference-style. The editor UI presents a link dialog; output format is inline-style.
- **Images** — Inline image insertion with alt text. The editor displays the image inline in the document.
- **Hard line breaks**
- **Autolinks** — Bare URLs are automatically linked in the output.

### GFM Extensions (Beyond CommonMark)

- **Tables** — Pipe-delimited tables with header rows and column alignment (left, center, right). The editor provides a visual table editing interface.
- **Strikethrough** — `~~text~~` rendered as struck-through text.
- **Task lists** — Checkbox list items (`- [ ]` / `- [x]`). Rendered as interactive checkboxes in the editor.
- **Autolinked URLs** — Bare URLs and email addresses are automatically converted to clickable links.

### Supported Extension Beyond GFM

- **YAML front-matter** — A `---` delimited YAML block at the top of the document. The editor renders this as a structured metadata panel rather than raw YAML, allowing users to view and edit key-value pairs in a clean interface. This is essential for agent-consumed files (skill definitions, CLAUDE.md) and useful for document metadata (title, author, status, tags, date).

### Explicitly Not Supported

The following are outside the GFM spec and will not be implemented: footnotes, definition lists, abbreviations, math/LaTeX blocks, superscript/subscript, highlight/mark, admonitions, wiki-links, table of contents generation, and custom containers.

---

## Core Use Case: Team OS Without Git

### The Problem

The "Team OS" concept — a structured knowledge base of Markdown files that serves as a team's shared brain — is gaining traction among product and engineering teams. The idea is powerful: centralize every artifact (specs, plans, research, meeting notes, customer insights, agent instructions) in a structured repository so that any team member or AI agent can load full context instantly. Scaling stops being about making one person faster and starts being about making the entire team self-sufficient.

The problem is that today, Team OS lives in Git. That means every edit requires commits, pull requests, reviews, and merges. Non-technical team members — the PM writing a strategy doc, the designer documenting a user flow, the operations lead updating a vendor SOP, the VP reviewing a quarterly plan — are locked out unless they learn Git or ask an engineer to push changes for them. At 20+ people, the system fragments: some docs end up in the repo, some in Google Docs, some in Notion, and the single source of truth becomes a polite fiction.

This editor is the accessible, collaborative interface for Team OS. It preserves the structure, the AI-readability, and the Markdown-native philosophy — while replacing Git with something anyone in the organization can use.

### Context Maps

The most powerful structural element of a Team OS is what the current Git-based implementation calls a "feature index" — a file that maps a primary entity (a feature) to all its related artifacts across every function. This concept generalizes far beyond features. It's a **context map**: a relational index that connects an entity to every document that describes, plans, tracks, or informs it.

A context map answers the question: "Given this *thing* my team cares about, where is everything related to it?"

The user defines the entity type and the artifact categories. The editor maintains the connections as documents are created and edited. AI agents use the context map to load complete context for any entity in seconds.

### Context Map Examples by Domain

**Product Development — Entity: Feature**

A product team building software. Each feature connects to artifacts across product, engineering, analytics, and design.

| Artifact Type | Example Document |
|---|---|
| PRD | `product/PRDs/billing/credit-usage-dashboard-prd.md` |
| Engineering RFC | `engineering/rfcs/billing/credit-usage-dashboard-rfc.md` |
| Implementation Plan | `engineering/plans/billing/credit-usage-dashboard.md` |
| Data Engineering RFC | `data-engineering/rfcs/billing/credit-ledger-model-rfc.md` |
| Analytics Dashboard | `analytics/dashboards/billing/credit-usage-dashboards.md` |
| Experiment Results | `analytics/experiments/billing/low-balance-warning-experiment.md` |
| Bug Investigation | `engineering/bug-investigations/billing/credit-double-charge.md` |

A PM opens the "credit-usage-dashboard" feature in the context map and sees every artifact at a glance — the spec, the technical design, the data model, the dashboards, the experiments. Gaps are visible: there's a PRD but no engineering plan yet. An AI agent joining the session loads all of this automatically.

**Project Management — Entity: Project**

An agency, consultancy, or internal team managing cross-functional projects with timelines and deliverables.

| Artifact Type | Example Document |
|---|---|
| Statement of Work | `projects/website-redesign/sow.md` |
| Project Timeline | `projects/website-redesign/timeline.md` |
| Budget Tracker | `projects/website-redesign/budget.md` |
| Risk Register | `projects/website-redesign/risks.md` |
| Status Reports | `projects/website-redesign/status/2026-04-11.md` |
| Meeting Notes | `projects/website-redesign/meetings/2026-04-10-kickoff.md` |
| Change Requests | `projects/website-redesign/changes/scope-change-001.md` |
| Stakeholder Map | `projects/website-redesign/stakeholders.md` |

A project manager opens "website-redesign" and sees the full project state: what's been delivered, what's at risk, what's changed, who the stakeholders are. A new PM inheriting the project gets full context without a two-hour handoff meeting.

**Partner Onboarding — Entity: Partner**

A partnerships or business development team managing external relationships — integrations, channel partners, vendors, or strategic alliances.

| Artifact Type | Example Document |
|---|---|
| Partnership Agreement | `partners/acme-corp/agreement.md` |
| Integration Spec | `partners/acme-corp/integration-spec.md` |
| Onboarding Checklist | `partners/acme-corp/onboarding-checklist.md` |
| Technical Contacts | `partners/acme-corp/contacts.md` |
| Call Transcripts | `partners/acme-corp/calls/2026-04-08-quarterly-review.md` |
| Compliance Documentation | `partners/acme-corp/compliance.md` |
| Launch Plan | `partners/acme-corp/launch-plan.md` |
| Support Escalation Path | `partners/acme-corp/escalation.md` |

Someone new on the partnerships team picks up the Acme Corp relationship and has full context immediately — the agreement terms, the integration requirements, the history of conversations, and the current onboarding status.

**Sales — Entity: Deal / Account**

A sales team tracking opportunities from prospecting through close.

| Artifact Type | Example Document |
|---|---|
| Account Overview | `accounts/globex/overview.md` |
| Call Notes | `accounts/globex/calls/2026-04-05-discovery.md` |
| Proposal | `accounts/globex/proposal-v2.md` |
| Pricing Discussion | `accounts/globex/pricing.md` |
| Competitive Positioning | `accounts/globex/competitive-notes.md` |
| Contract Draft | `accounts/globex/contract-draft.md` |
| Close Plan | `accounts/globex/close-plan.md` |
| Champion Notes | `accounts/globex/champion-notes.md` |

A new AE inherits the Globex account mid-cycle. Instead of asking the previous rep for a brain dump, they open the account in the context map and read the full history — every call, the pricing discussions, who the champion is, and what the close strategy was.

**Operations — Entity: Process / Vendor**

An operations team managing SOPs, vendor relationships, and internal workflows.

| Artifact Type | Example Document |
|---|---|
| Standard Operating Procedure | `ops/order-fulfillment/sop.md` |
| Vendor Contract | `ops/order-fulfillment/vendor-contract-fastship.md` |
| Performance Metrics | `ops/order-fulfillment/metrics.md` |
| Incident Reports | `ops/order-fulfillment/incidents/2026-03-28-delayed-batch.md` |
| Escalation Procedures | `ops/order-fulfillment/escalation.md` |
| Audit Checklist | `ops/order-fulfillment/audit-checklist.md` |
| Training Materials | `ops/order-fulfillment/training.md` |

When something breaks in the fulfillment process, the on-call ops lead opens the process in the context map, reads the SOP and escalation path, reviews recent incidents, and has full context to resolve the issue — or an AI agent does it alongside them.

**Hiring — Entity: Role / Pipeline**

A recruiting or people team managing open positions and candidate pipelines.

| Artifact Type | Example Document |
|---|---|
| Job Description | `hiring/senior-engineer/job-description.md` |
| Interview Rubric | `hiring/senior-engineer/rubric.md` |
| Candidate Scorecards | `hiring/senior-engineer/candidates/jane-doe.md` |
| Offer Template | `hiring/senior-engineer/offer-template.md` |
| Interview Panel | `hiring/senior-engineer/panel.md` |
| Onboarding Plan | `hiring/senior-engineer/onboarding-plan.md` |
| Pipeline Status | `hiring/senior-engineer/pipeline-status.md` |

The hiring manager and recruiter share a single view of the pipeline. An AI agent can summarize candidate scorecards, flag inconsistencies in evaluations, or draft offer letters with the right context.

### How Context Maps Work in the Editor

**Creating a context map:** The user defines a context map by choosing an entity type (features, projects, partners, deals, etc.) and the artifact categories they want to track. This can be done through a setup dialog or by writing a YAML configuration file directly — the editor renders either as the same interactive UI.

**Navigating a context map:** The context map appears as an alternative view in the left sidebar, alongside the file tree. Instead of browsing by folder structure, the user browses by entity — each entity expands to show its linked artifacts, grouped by category. Color coding or icons indicate artifact types. Missing artifacts (categories with no linked document) are visible as gaps.

**Linking documents:** When a user creates a new document, the editor prompts: "Is this related to an existing entity?" If yes, the document is automatically registered in the context map. Documents can also be linked manually by dragging them onto an entity in the map, or by editing the map's underlying YAML/Markdown.

**AI agent context loading:** When an AI agent joins a document session, the context map tells it what else exists for that entity. The agent can load related artifacts as needed — reading the PRD before reviewing the RFC, or pulling in the customer call notes before helping draft a proposal.

**Underlying storage:** The context map is itself a Markdown or YAML file in the document library (maintaining the "Markdown is the truth" principle). The editor renders it as an interactive UI, but the user can always view and edit the raw file. This ensures portability — if someone exports the entire document library, the context maps come with it as plain text.

---

## V1 Feature Requirements

### 1. WYSIWYG Editing Engine

The core of the app. The editor renders Markdown as formatted text at all times. The user types and formats as they would in any word processor.

**Requirements:**

- No raw Markdown syntax is ever visible to the user — not on cursor focus, not during editing, not in any transient state. When the cursor is inside a bold word, the word remains visually bold. The toolbar state (bold button highlighted) is the only indicator of active formatting.
- All formatting operations produce clean, normalized GFM output. The underlying `.md` file is always valid, well-structured GFM.
- The editor handles all GFM block and inline elements as described in the specification section above.
- Copy/paste from external sources (web pages, Word, Google Docs) strips non-Markdown-compatible formatting and converts to the closest GFM equivalent.
- Undo/redo operates on the WYSIWYG layer with standard behavior (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z).

### 2. Toolbar

A formatting bar across the top of the editor window. Every button maps to a valid GFM formatting operation. No exceptions.

**Toolbar actions (in order):**

- Heading level selector (dropdown: Paragraph, Heading 1–6)
- Bold
- Italic
- Strikethrough
- Inline code
- Link (opens a dialog for URL and optional title)
- Image (opens a dialog or file picker for image insertion)
- Unordered list
- Ordered list
- Task list (checkbox list)
- Blockquote
- Horizontal rule
- Code block (inserts a fenced code block with language selector)
- Table (inserts a table with a row/column configuration dialog)

**Toolbar behavior:**

- Buttons reflect the formatting state at the current cursor position. If the cursor is in bold text, the bold button is highlighted.
- Buttons toggle formatting on and off. Clicking bold on already-bold text removes the bold.
- The toolbar is non-customizable in V1. It presents the full set of GFM formatting options in a fixed layout.

### 3. File Tree Panel (Left Sidebar)

A collapsible sidebar showing the user's documents.

**Requirements:**

- **V1 (desktop wrapper):** The user opens a local folder via File > Open Folder. The tree displays only `.md` files, organized in their directory structure. Non-Markdown files and folders containing no `.md` files are hidden. The tree reflects file system changes in real time (file watcher).
- **V1 (browser):** The file tree is not available. The user works with individual files via open/save. This is an acceptable limitation for V1.
- **V2+ (cloud storage):** The file tree is powered by the user's cloud document library — folders and `.md` files stored server-side. Available in both browser and desktop wrapper.
- Single-click a file to open it in the editor. The app supports multiple open files with a tab bar.
- Standard file operations within the panel: rename files (inline editing), create new `.md` files, delete files (with confirmation), and create new subfolders.
- The panel can be toggled with a keyboard shortcut.

### 4. Document Outline Panel (Center-Left Sidebar)

A collapsible sidebar showing the heading structure of the current document. Positioned between the file tree and the editor, creating a left-to-right drill-down: all files → file structure → file content.

**Requirements:**

- Displays all headings (H1–H6) in a nested, indented hierarchy.
- Clicking a heading in the outline scrolls the editor to that heading.
- The outline updates in real time as the user edits.
- The current section (based on scroll position) is highlighted in the outline.
- The panel can be toggled with a keyboard shortcut and a View menu option.

### 5. YAML Front-Matter Panel

A structured interface for viewing and editing YAML front-matter at the top of the document.

**Requirements:**

- If a document contains a YAML front-matter block, the editor displays it as a collapsible metadata panel above the document body — not as raw YAML text.
- The panel shows key-value pairs in editable fields. Standard types are supported: strings, lists, dates, booleans.
- New key-value pairs can be added; existing ones can be edited or removed.
- If a document has no front-matter, the user can add one via a menu action or keyboard shortcut.
- The underlying `.md` file always contains the YAML as standard `---` delimited front-matter.

### 6. Table Editing

Tables are a first-class citizen in the editor, not a raw-text afterthought.

**Requirements:**

- Tables are rendered as visual grids. The user clicks into cells and types.
- Add/remove rows and columns via context menu or toolbar controls.
- Column alignment (left, center, right) is configurable per column.
- Tab key moves between cells (left to right, then next row).
- The underlying Markdown output is a clean, pipe-delimited GFM table with consistent spacing.

### 7. Code Block Handling

Fenced code blocks are rendered with syntax highlighting and language awareness.

**Requirements:**

- Inserting a code block presents a language selector (searchable dropdown with common languages).
- Code within the block is syntax-highlighted based on the selected language.
- The code block is visually distinct from body text (monospace font, background shading, border).
- Within a code block, the user types freely — no WYSIWYG formatting is applied. Tab inserts spaces (configurable: 2 or 4).
- Copy/paste into a code block preserves raw text without formatting conversion.

### 8. Image Handling

**Requirements:**

- Images can be inserted via the toolbar, drag-and-drop, or paste from clipboard.
- The editor displays images inline in the document at a reasonable display size.
- The user can set alt text via a dialog or inspector.
- Image references in the `.md` file use standard GFM image syntax. The app does not manage or copy image files — it references them by the path or URL the user provides. If a user drags in a local image, the app uses a relative path from the document's location.

### 9. Keyboard Shortcuts

Standard conventions matching Word and Google Docs. The app detects the user's platform (macOS vs. Windows/Linux) and maps Cmd or Ctrl accordingly. No learning curve.

| Action | Shortcut |
|---|---|
| Bold | Cmd+B |
| Italic | Cmd+I |
| Strikethrough | Cmd+Shift+X |
| Inline Code | Cmd+E |
| Link | Cmd+K |
| Heading 1 | Cmd+1 |
| Heading 2 | Cmd+2 |
| Heading 3 | Cmd+3 |
| Heading 4 | Cmd+4 |
| Heading 5 | Cmd+5 |
| Heading 6 | Cmd+6 |
| Paragraph (remove heading) | Cmd+0 |
| Ordered List | Cmd+Shift+7 |
| Unordered List | Cmd+Shift+8 |
| Task List | Cmd+Shift+9 |
| Blockquote | Cmd+Shift+. |
| Code Block | Cmd+Shift+C |
| Horizontal Rule | Cmd+Shift+- |
| Toggle File Tree | Cmd+Shift+E |
| Toggle Document Outline | Cmd+Shift+O |
| New File | Cmd+N |
| Open Folder | Cmd+Shift+N |
| Save | Cmd+S |
| Find | Cmd+F |
| Find and Replace | Cmd+Shift+F |
| Undo | Cmd+Z |
| Redo | Cmd+Shift+Z |

### 10. Typography and Rendering

The WYSIWYG surface should feel like a polished document, not a code editor with styling.

**Requirements:**

- The default body font is a proportional, readable sans-serif typeface (Inter, system font stack, or similar). The user can choose from a small set of curated fonts in preferences.
- Headings are visually distinct through size and weight — not through visible `#` characters.
- Blockquotes are indented with a subtle left border, similar to email quoting conventions.
- Horizontal rules render as a visual divider, not as `---` text.
- Links render as styled, clickable text. Clicking follows the link; editing the link requires Cmd+click or the link dialog.
- Task list checkboxes are interactive — clicking toggles the checked state.
- The editor supports dark mode, following the system `prefers-color-scheme` setting with a manual override in preferences.
- Line spacing, paragraph spacing, and margins are tuned for comfortable long-form reading and writing.

### 11. File Operations

**Requirements:**

- The app opens `.md` files and saves `.md` files. In V1, this is local — via the File System Access API on Chromium browsers or upload/download on others. In the Tauri desktop wrapper, the app has native file system access.
- Auto-save is on by default. Changes are saved continuously.
- "New File" creates a new untitled document.
- "Open File" opens a `.md` file from the local file system.
- "Save" / "Save As" writes the current document to a `.md` file.
- "Open Folder" (desktop wrapper only) opens a folder and populates the file tree sidebar.
- The Tauri desktop wrapper registers as a handler for `.md` files so users can double-click Markdown files to open them.

### 12. Search

**Requirements:**

- Find (Cmd+F) provides an inline search bar for the current document with match highlighting and next/previous navigation.
- Find and Replace (Cmd+Shift+F) adds a replace field.
- Search operates on the visible text, not on the underlying Markdown syntax. Searching for "hello" finds "hello" whether it's in a heading, bold text, or a list item — the user never needs to account for Markdown formatting characters.

---

## Information Architecture

The layout follows a left-to-right information hierarchy: all files, file outline, file details. This creates a natural drill-down flow — the user narrows context as they move from left to right.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Title Bar / Traffic Lights                                          │
├────────────┬─────────────────┬───────────────────────────────────────┤
│            │                 │              Toolbar                   │
│            │                 │  [H▾][B][I][S][`][🔗][📷]            │
│            │                 │  [•][1.][☐][❝][—][</>][⊞]            │
│  File Tree │  Document       ├───────────────────────────────────────┤
│            │  Outline        │                                       │
│  📁 docs   │                 │  Front-Matter Panel                   │
│   📄 prd   │  • Vision       │  ┌─────────────────────────────┐     │
│   📄 arch  │  • Problem      │  │ title: PRD                  │     │
│   📄 spec  │    • Users      │  │ status: draft               │     │
│  📁 skills │  • Features     │  └─────────────────────────────┘     │
│   📄 skill │    • Editor     │                                       │
│            │    • Toolbar    │  Document Body                        │
│            │    • File Tree  │                                       │
│            │    • Tables     │  The editor renders here              │
│            │    • Code       │  as a clean WYSIWYG                   │
│            │                 │  word processing surface.              │
│            │                 │                                       │
├────────────┴─────────────────┴───────────────────────────────────────┤
│  Status Bar (word count, cursor position, file path)                 │
└──────────────────────────────────────────────────────────────────────┘
```

**Reading the layout left to right:**

1. **File Tree** (left) — "Which file am I working on?" Browse all `.md` files in the project folder.
2. **Document Outline** (center-left) — "What's in this file?" See the heading structure at a glance and jump to any section.
3. **Editor** (right, fills remaining space) — "The content itself." Read and write the document.

**Panel States:**

- All three columns visible (File Tree + Outline + Editor)
- Outline hidden (File Tree + Editor)
- File Tree hidden (Outline + Editor)
- Both sidebars hidden (Editor only — distraction-free writing)

Both sidebar panels are independently toggleable. The editor always occupies the remaining horizontal space. Sidebar widths are resizable by dragging the divider.

---

## Technical Considerations

### Platform and Architecture

- **Platform:** Web application, accessible via any modern browser (Chrome, Safari, Firefox, Edge). No install required for end users. The web-first approach ensures the collaboration infrastructure, editing engine, and user experience are a single codebase — no need to build things twice for different platforms.
- **Optional desktop wrapper:** A Tauri or Electron wrapper can be offered for users who want a standalone macOS/Windows/Linux app with local file access, system-level keyboard shortcuts, and offline support. This is a packaging decision, not an architecture decision — the core app is the same.
- **Frontend framework:** React or a comparable component framework. The choice should optimize for Tiptap integration, real-time collaboration library compatibility, and long-term maintainability.
- **Backend:** A lightweight server for document storage, user authentication, and collaboration session management. Technology TBD (Node.js, Go, or Rust are all viable). The backend must support WebSocket connections for real-time collaboration from V2 onward.
- **Language:** TypeScript for the frontend and (likely) the backend, ensuring a shared type system across the stack.
- **Distribution:** Web app at a hosted URL. Optional desktop app via Tauri for local file access and offline use.

### Editing Engine

**Recommendation: Tiptap (built on ProseMirror).**

Tiptap is the strongest choice for this app in 2026. It provides a mature, extensible rich text editing framework with first-class support for bidirectional Markdown serialization — exactly what's needed for a WYSIWYG editor that reads and writes `.md` files.

**Licensing and cost:** The entire Tiptap stack is MIT licensed and free. This includes the core editor (`@tiptap/core`), all 60+ official extensions (bold, italic, tables, task lists, code blocks, collaboration, etc.), the Markdown extension (`@tiptap/markdown`), the Yjs bindings (`@tiptap/y-tiptap`), and the Hocuspocus collaboration server (`@hocuspocus/server`). There is no pro tier, no paid extensions, and no features locked behind a license for anything in our stack.

Tiptap does offer **Tiptap Cloud**, a paid hosted service that runs the collaboration backend for you. We will not use it. All collaboration infrastructure will be self-hosted using the open source Hocuspocus server to avoid vendor lock-in and recurring costs.

**Key advantages:**

- **Proven WYSIWYG Markdown editing.** Tiptap handles the bidirectional mapping between rich text DOM and Markdown output. It can be configured to expose only GFM-valid formatting operations, enforcing the spec boundary at the editor level.
- **Collaboration-ready.** Tiptap has native integration with Yjs, the leading CRDT library for real-time collaborative editing. This means real-time multi-cursor editing, presence awareness, and conflict resolution are built into the editor framework — not bolted on later. This is a critical advantage over native approaches.
- **Extensible.** Custom extensions for YAML front-matter rendering, GFM table editing, and task list interactivity can be built on Tiptap's extension API.
- **Large ecosystem.** Syntax highlighting (via lowlight/highlight.js), table editing, task lists, and other GFM features have existing Tiptap extensions or ProseMirror plugins.
- **Zero vendor dependency.** Every component is MIT licensed and self-hostable. No API keys, no usage-based pricing, no paid tiers.

**Prototyping phase (two weeks):** Validate that Tiptap can achieve the zero-syntax-reveal requirement — that no raw Markdown is ever visible to the user under any cursor state or editing operation. This is the highest-risk requirement and should be confirmed before committing.

### Markdown Parsing and Serialization

- Tiptap's Markdown extension handles bidirectional conversion between the ProseMirror document model and GFM syntax.
- For parsing edge cases or validation, use a standalone GFM parser (remark with remark-gfm, or markdown-it with GFM plugins) to verify round-trip fidelity.
- The serializer must produce normalized, consistent output — no trailing whitespace, consistent list indentation, single blank lines between blocks. A custom serialization pass may be needed on top of Tiptap's default Markdown output to enforce output quality standards.

### Document Storage

Documents have two modes depending on the product phase:

- **V1 (local-first):** Documents are `.md` files on the user's local file system. In the web app, users upload/download files or use the File System Access API (Chromium browsers). In the optional desktop wrapper (Tauri), the app has native file system access and can open folders directly.
- **V2+ (cloud-backed):** Documents are stored server-side. The server stores the canonical document content and collaboration metadata (comments, suggestions, presence). The user can still export/download as `.md` at any time. Unshared documents can remain local-only if the user prefers — cloud storage is opt-in when sharing.

### Real-Time Collaboration Infrastructure

Designed from V1 to support collaboration in V2, even if V1 ships as single-user. The entire collaboration stack is self-hosted using open source components — no Tiptap Cloud, no Liveblocks, no third-party collaboration services.

- **CRDT engine:** Yjs (MIT licensed) for conflict-free real-time document synchronization. Yjs integrates directly with Tiptap and handles multi-user editing, offline support, and automatic conflict resolution.
- **Collaboration server:** Hocuspocus (MIT licensed, `@hocuspocus/server`), self-hosted. Hocuspocus is a plug-and-play Yjs WebSocket backend that handles real-time sync, document persistence, authentication hooks, and room management. It includes database adapters for PostgreSQL, SQLite, S3, and Redis.
- **Transport:** WebSocket connections managed by Hocuspocus. The server runs alongside the application backend.
- **Presence:** Yjs awareness protocol for cursor positions, selection ranges, and user identity. Each participant (human or AI agent) has a name, color, and presence state.
- **Persistence:** Hocuspocus persists Yjs document state to the database so sessions survive disconnections and documents can be reconstructed from history. PostgreSQL is the recommended primary store for V2+.

### Agent Access Architecture

A defining capability of this product: AI agents can access the team's knowledge base programmatically. Documents stored in the cloud aren't locked behind a UI — they're accessible to Claude, Codex, Gemini, and any agent that speaks MCP.

**Why this matters:** Today, Claude Code discovers CLAUDE.md files by walking the local filesystem — scanning the working directory and its parents for context files. That mechanism breaks when documents move to the cloud. The agent access architecture replaces filesystem discovery with something better: on-demand, authenticated, permission-aware access to the entire knowledge base.

#### Primary: MCP Server

The app ships an MCP (Model Context Protocol) server that any AI agent can connect to. MCP is the de facto standard for agent-to-service communication in 2026, supported by Claude, OpenAI Codex, Google Gemini, Cursor, VS Code, and every major AI platform. As of April 2026, the MCP ecosystem has over 10,000 public servers and 97 million monthly SDK downloads. Anthropic donated MCP to the Linux Foundation in late 2025, making it an open standard.

The MCP server exposes the knowledge base through two primitives:

**Resources** serve document content. An agent can read any document in the knowledge base — CLAUDE.md files, PRDs, context maps, meeting notes, partner agreements — as an MCP resource. Resources are application-controlled: the host application (Claude Code, Cursor, etc.) determines which resources to load, and the agent receives them as context.

**Tools** give the agent active capabilities to query and navigate the knowledge base:

- `search_knowledge_base` — Full-text and semantic search across all documents the agent has access to.
- `get_context_map` — Retrieve a context map for a given entity (feature, project, partner, deal). Returns the entity's linked artifacts with document IDs and metadata.
- `get_document` — Fetch the full content of a specific document by ID or path.
- `list_documents` — Browse the document library with filtering by folder, entity, artifact type, author, or date.
- `get_related_documents` — Given a document, return all other documents linked to the same entity via the context map. This is how an agent editing an RFC automatically discovers the related PRD, analytics dashboards, and customer call notes.

**On-demand vs. eager loading:** This is a meaningful improvement over filesystem-based CLAUDE.md discovery. Claude Code currently loads every CLAUDE.md it finds into the context window at session start — whether the agent needs it or not. The MCP server enables on-demand loading. An agent working on the billing feature pulls the billing context map and its linked artifacts. It doesn't load the entire knowledge base. This is more efficient, more precise, and scales to large knowledge bases that would exceed context window limits.

**Transport:** The MCP server runs as a remote service using Streamable HTTP transport (the current MCP standard, replacing the deprecated SSE transport). Agents connect over HTTPS. For developers who want a local experience, the server can also run locally via STDIO transport.

**Authentication:** OAuth 2.1 with PKCE, following the MCP authorization specification (standardized March 2025). Agents authenticate with the team's workspace and receive scoped access tokens. Permissions mirror the document-level permissions model — if a document is shared with a user, an agent authenticated as that user can access it. Agents can also be granted their own identity with specific roles (viewer, commenter, suggester, editor), using the same permissions model as human collaborators.

#### Secondary: Local Sync Bridge

A lightweight CLI or daemon that mirrors documents from the cloud to a local folder (e.g., `~/.team-os/`). This preserves backward compatibility with Claude Code's filesystem-based CLAUDE.md discovery — the agent scans the local directory and finds CLAUDE.md files exactly as it does today, but the source of truth is the cloud.

**How it works:**

- The user installs a sync agent and authenticates with their team workspace.
- The sync agent mirrors CLAUDE.md files, context maps, and optionally other documents to a local directory.
- When a document is updated in the cloud editor, the sync agent pulls the change within seconds.
- Claude Code discovers the files through its normal directory-walking mechanism.

**Trade-offs:** This is a pragmatic bridge for teams already deep in Claude Code's CLAUDE.md workflow. It works without any changes to Claude Code. The downside is eventual consistency (not real-time), added complexity (sync agent, conflict resolution), and a narrower view of the knowledge base compared to the MCP server's on-demand querying.

#### Tertiary: REST API

A standard REST API for programmatic access to the knowledge base. This supports headless agent workflows (V4 agent collaboration sessions), CI/CD pipelines that validate documentation, custom integrations, and any tooling that needs to read or write documents outside of the editor UI or MCP protocol.

The REST API shares the same authentication and permissions layer as the MCP server — OAuth 2.1, scoped to the team workspace, respecting document-level permissions.

### Output Quality

Since a core use case is producing files for AI agent consumption, the serializer must produce pristine Markdown:

- Consistent ATX-style headings (no setext).
- No trailing whitespace on any line.
- Single blank line between block-level elements.
- Consistent indentation for nested lists (4 spaces).
- Clean table formatting with aligned pipes.
- UTF-8 encoding, LF line endings.

### Performance

- The app should handle documents up to 50,000 words without perceptible lag.
- File tree should handle folders with 1,000+ files (in desktop wrapper mode).
- Syntax highlighting in code blocks should be immediate and not block the main thread.
- Real-time collaboration should support at least 20 simultaneous participants per document without degraded editing performance.

### Accessibility

- Full screen reader support (ARIA roles, labels, live regions).
- Keyboard navigation for all UI elements.
- Respect system accessibility settings (prefers-reduced-motion, prefers-color-scheme, font size).
- WCAG 2.1 AA compliance as a minimum target.

---

## Phased Roadmap

### V1 — The Editor (Launch)

A polished, single-user web-based Markdown editor. The goal is to nail the editing experience and output quality. Users can create and edit `.md` files in the browser. No account required.

**Key deliverables:**

- WYSIWYG editing engine (Tiptap) with zero syntax reveal
- GFM-complete toolbar
- Document outline sidebar
- YAML front-matter panel
- Visual table editor
- Syntax-highlighted code blocks
- Full keyboard shortcut support
- Dark mode (follows system preference)
- Local file open/save (File System Access API on Chromium; upload/download fallback on other browsers)
- Optional Tauri desktop wrapper for native file system access and offline use

**Note on the file tree:** The file tree sidebar is available in the Tauri desktop wrapper, where the app has native access to a folder on disk. In the browser-only version, V1 focuses on single-document editing. The file tree becomes fully realized in V2 when cloud document storage provides a folder/project structure accessible from any browser.

### V2 — Team OS: Sharing, Context Maps, and Async Collaboration

Add user accounts, cloud document storage, context maps, and asynchronous collaboration. This is where the app transforms from a local editor into a Team OS — the accessible, collaborative knowledge base for an entire organization.

**Key deliverables:**

- User accounts and authentication.
- Cloud document storage — documents are stored server-side and accessible from any browser. Users can organize documents into folders/projects. The `.md` file remains downloadable/exportable at any time.
- File tree sidebar — now powered by the user's cloud document library, showing folders and `.md` files. Available in both browser and desktop wrapper.
- **Context maps** — the defining V2 feature. Users create context maps by defining an entity type (features, projects, partners, deals, roles, processes) and artifact categories. The context map appears as an alternative navigation view in the left sidebar. Entities expand to show linked artifacts, grouped by category. Missing artifacts are visible as gaps. When creating a new document, the editor prompts for entity association. The underlying data is stored as YAML/Markdown, maintaining portability.
- **Context-aware AI loading** — when an AI agent joins a document session, the context map tells it what else exists for that entity. The agent can load related artifacts as needed, giving it full 360-degree context automatically.
- Shareable document links with permissions (view, comment, edit).
- Document comments — highlight text and attach threaded comments. Comments are stored as collaboration metadata on the server, not in the `.md` file.
- Suggestion mode — propose edits (insertions, deletions, replacements) that the document owner can accept or reject, similar to Google Docs suggestions.
- Document version history.
- Document templates — starter templates for PRDs, architecture docs, CLAUDE.md files, skill files, research documents.
- **CLAUDE.md rendering** — CLAUDE.md files (navigation/index files used in Team OS structures) are recognized and rendered as interactive navigation panels rather than plain documents. They serve as the table of contents for each folder/section of the knowledge base.
- **MCP server** — the team's knowledge base is exposed via a Model Context Protocol server. Any AI agent (Claude, Codex, Gemini, Cursor) can connect, authenticate, and access documents, context maps, and search — using the same permissions model as human users. This is the primary way agents access the Team OS.
- **Local sync bridge** — a lightweight CLI that mirrors CLAUDE.md files and key documents to a local folder, preserving backward compatibility with Claude Code's filesystem-based context discovery.

### V3 — Real-Time Collaboration

Full Google Docs-style multiplayer editing. The Yjs/CRDT infrastructure laid in the technical architecture is activated for multi-user sessions.

**Key deliverables:**

- Real-time multi-cursor editing with presence indicators (colored cursors, name labels).
- Conflict resolution via Yjs CRDT (already integrated with Tiptap).
- Offline editing with automatic sync/merge on reconnection.
- Permissions model — owner, editor, commenter, viewer.
- Notification system for comments, suggestions, and edits.

**Critical architectural note:** The collaboration sync protocol is a client-agnostic API. The server does not need to know whether a participant is a web browser, a desktop wrapper, or an AI agent. Any client that can authenticate and speak the Yjs sync protocol can join a session. This is foundational for V4.

### V4 — AI Agent Collaboration

AI agents (Claude, Codex, and future models) participate in document sessions as first-class collaborators. An agent is just another participant in the collaboration protocol — it has an identity, a presence indicator, and a role, just like a human.

**How agents connect:**

The agent connects to a document's collaboration session via the same sync API that human clients use, accessed programmatically as a headless Yjs client. The agent authenticates with API credentials, receives the full document state and a real-time stream of changes, and can push its own edits, suggestions, or comments into the session. From the server's perspective, an agent is indistinguishable from any other client.

**Agent participation modes:**

Agents participate using the same mechanisms available to human collaborators — the difference is how they're invoked and what role they're assigned:

- **Editor** — The agent writes directly into the document. Its cursor is visible, text appears in real time, and changes are attributed to the agent by name (e.g., "Claude"). Best for drafting or generation tasks where the user has delegated authorship of a section.
- **Suggester** — The agent proposes changes using suggestion mode (from V2). Insertions and deletions appear as inline suggestions attributed to the agent. The document owner accepts or rejects them. This is the most natural mode for AI-assisted writing — it mirrors how people already interact with Claude.
- **Commenter** — The agent reads the document and leaves comments on specific sections. Use cases include structural review ("These requirements conflict with section 3"), quality feedback ("Consider adding acceptance criteria"), and consistency checks across the document.
- **On-demand assistant** — The agent is present in the session but passive until invoked. The user highlights a selection, right-clicks, and chooses an action: "Ask Claude to rewrite this," "Ask Claude to expand this section," "Ask Claude to simplify." The agent operates on the selection and inserts the result as a suggestion.

**Role and permissions:**

Agents are assigned roles using the same permissions model as human collaborators — viewer, commenter, suggester, or editor. The document owner controls the agent's role per session and can revoke it at any time. An agent cannot escalate its own permissions.

**Multi-agent support:**

A session can include multiple agents. A user might invite Claude as a suggester for writing quality and a separate code-review agent as a commenter for technical accuracy. Each agent has its own identity, cursor color, and attribution.

**Key deliverables:**

- Agent authentication and session joining via the collaboration API (headless Yjs client).
- Agent identity and presence (name, avatar/icon, colored cursor, "AI" badge).
- Support for all four participation modes: editor, suggester, commenter, on-demand assistant.
- Agent role management in the document sharing/permissions UI.
- Context-menu integration for on-demand agent actions on text selections.
- Rate limiting and guardrails to prevent an agent from flooding a document with changes.

---

## Design Principles

1. **Markdown is the truth.** Every document is a `.md` file. There is no proprietary format, no opaque database, no lock-in. Users can export their document at any time and open it in any text editor. The app is a lens for viewing, editing, and collaborating on Markdown — not a container that traps it.

2. **The spec is the boundary.** If GFM doesn't support it, the app doesn't offer it. This constraint is a feature, not a limitation. It ensures every document is portable, predictable, and parseable by any Markdown-aware tool or AI agent.

3. **Never break the illusion.** The user is writing a document, not editing code. Raw Markdown syntax is an implementation detail that the user never sees — not on focus, not during transitions, not during edge cases. If the WYSIWYG layer can't render something cleanly, we need to fix the rendering, not fall back to showing syntax.

4. **Collaboration is the architecture, not a feature.** The app is built on real-time collaboration infrastructure from the ground up. Single-user editing is just a collaboration session with one participant. This ensures multiplayer, comments, suggestions, and AI agent participation are natural extensions — not retrofits.

5. **Everyone gets a link.** The VP reviewing a PRD, the engineer adding technical detail, and the AI agent suggesting revisions all access the same document the same way. No installs, no platform dependencies, no gatekeeping.

6. **Clean output is a feature.** The Markdown this app produces is pristine — consistent formatting, no artifacts, no unnecessary whitespace. This matters because the files will be read by humans *and* by AI agents, and both benefit from clean structure.

7. **Simplicity over power.** The app does fewer things than Obsidian, VS Code, or Notion. It does them better. Features are added only when they can be done well and within the spec boundary.
