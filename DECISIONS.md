# Architecture Decision Log

This document captures key decisions made during product planning, the options considered, and the reasoning behind each choice. When you encounter a fork in the road during implementation, check here first.

---

## 001: Web App Over Native macOS

**Decision:** Build as a web application, not a native macOS app.

**Options considered:**

- Native macOS app (SwiftUI + AppKit) — would feel like Apple built it, leverage Liquid Glass design language, deep OS integration.
- Web app (React + Tiptap) — cross-platform, single codebase, collaboration-ready architecture.
- Hybrid (native shell + WKWebView editor) — native chrome with web editing core.

**Why web won:**

The product's long-term vision is real-time collaboration between humans and AI agents. V2, V3, and V4 are all networked, multiplayer problems. Building native first would mean building the editing experience twice — once in Swift, once in web technologies for the collaboration companion. The editing engine recommendation was already Tiptap in a WKWebView, which means the "native" app's core would be a web app anyway.

Web-first means: one codebase, collaboration infrastructure from day one, anyone with a browser can participate (no install for the VP reviewing a PRD), and the Tiptap/Yjs/ProseMirror ecosystem gives us battle-tested collaboration primitives.

**Trade-off accepted:** The app won't feel as perfectly macOS-native. No Liquid Glass, no deep Finder integration. It will feel like a great web app — which is what Google Docs feels like, and that's the collaboration model we're targeting.

---

## 002: GFM Over CommonMark

**Decision:** Support GitHub Flavored Markdown (GFM), not just CommonMark.

**Options considered:**

- CommonMark only — the strictest standard. No tables, no strikethrough, no task lists.
- GFM — CommonMark superset with four additions: tables, strikethrough, task lists, autolinked URLs. Has a formal spec.
- GFM + extensions (footnotes, math, etc.) — broader feature set but no single spec.

**Why GFM won:**

The primary use case is producing documents that AI agents (Claude, Codex) consume. These models are trained heavily on GitHub content, which uses GFM. They understand GFM syntax extremely well. Tables and task lists are essential for the document types being authored (PRDs, specs, checklists). GFM is formally specified — it's not a loose collection of extensions — so "strict standards" still applies.

**The boundary is firm:** If GFM doesn't support it, the app doesn't offer it. No footnotes, no math, no wiki-links, no definition lists. This is a feature, not a limitation.

---

## 003: YAML Front-Matter as the Single Extension

**Decision:** Support YAML front-matter (`---` delimited blocks) despite it not being in the GFM spec.

**Why:**

Front-matter is essential for agent-consumed documents. CLAUDE.md files, skill definitions, and structured specs use front-matter for metadata (title, author, status, tags, date). It's a de facto standard across the Markdown ecosystem — every major static site generator, every documentation tool, and most Markdown processors support it. Claude and Codex handle it well.

This is the one deliberate exception to the "GFM only" boundary, and it's documented as such.

---

## 004: Zero Syntax Reveal (No Exceptions)

**Decision:** The user never sees raw Markdown syntax under any circumstance.

**What this means specifically:**

- Cursor inside bold text: text stays visually bold. The toolbar reflects the bold state. No `**` characters appear.
- Cursor inside a heading: heading stays rendered at its visual size. No `#` characters appear.
- Cursor inside a link: link stays styled. No `[text](url)` is revealed.
- No transient syntax flash during editing operations, focus changes, or cursor movement.

**Why this is hard:** Typora gets close but reveals syntax on cursor focus. Most other Markdown editors show source by default. Achieving true zero-reveal requires the editing engine to maintain a clean abstraction between the document model and the visual representation at all times.

**Why this is non-negotiable:** The target user includes non-technical stakeholders (VPs, operations, executives) who should never know the document is Markdown. If they see `**bold**` instead of **bold**, the illusion is broken and the product has failed.

**Implementation risk:** This is the highest-risk requirement. It should be validated during the Tiptap prototyping phase before committing to the full build. If Tiptap cannot achieve it, the approach needs to be reconsidered.

---

## 005: Document Outline Left of Editor (Not Right)

**Decision:** The document outline panel sits to the left of the editor, between the file tree and the editor — not on the right side.

**Why:**

The layout follows a left-to-right information hierarchy that creates a natural drill-down:

1. File Tree (far left) — "Which file am I working on?"
2. Document Outline (center-left) — "What's in this file?"
3. Editor (right, fills remaining space) — "The content itself."

This mirrors how people naturally narrow focus. It's a progression from broad context to specific content. Placing the outline on the right (as some editors do) breaks this flow — you'd be scanning past the content to find the structure.

---

## 006: Tiptap Over Other Editing Engines

**Decision:** Use Tiptap (built on ProseMirror) as the editing engine.

**Options considered:**

- Custom NSTextView (AppKit) — maximum native control, but native-only and no collaboration path.
- STTextView (TextKit 2) — modern native option, but TextKit 2 still has gaps (no table support, edge cases).
- ProseMirror directly — powerful but low-level; Tiptap provides a better developer experience on top of it.
- Tiptap — mature, extensible, Markdown-native, collaboration-ready.
- Lexical (Meta) — newer, less mature Markdown ecosystem.

**Why Tiptap won:**

1. Bidirectional Markdown serialization is mature and well-maintained.
2. Native Yjs integration for real-time collaboration (V2+) — this is built into the framework, not bolted on.
3. Extension API supports custom GFM features: tables, task lists, code blocks, front-matter.
4. Large ecosystem with existing extensions for syntax highlighting (lowlight), table editing, and more.
5. Web-native, which aligns with the web-first architecture decision.

---

## 007: File Tree Not in Browser V1

**Decision:** The file tree sidebar is only available in the Tauri desktop wrapper for V1. The browser version focuses on single-document editing.

**Why:**

The browser's File System Access API (Chromium only) is awkward for folder access — it requires permission prompts, doesn't persist across sessions cleanly, and isn't available in Safari or Firefox. Rather than building a half-working file tree that only works in Chrome, V1 in the browser focuses on the single-document editing experience.

The file tree becomes fully realized in V2 when cloud document storage provides a folder/project structure accessible from any browser.

---

## 008: Yjs Over OT for Collaboration

**Decision:** Use Yjs (CRDT) for real-time collaboration, not Operational Transformation (OT).

**Why:**

Yjs integrates directly with Tiptap — it's the collaboration framework that Tiptap was designed to work with. CRDTs (Conflict-free Replicated Data Types) also support offline editing with automatic merge on reconnection, which OT doesn't handle as cleanly. The Yjs ecosystem includes sync providers (Hocuspocus, y-websocket), persistence adapters, and awareness protocols for presence — all of which map directly to our V3 requirements.

---

## 009: MCP Server as Primary Agent Access

**Decision:** The primary way AI agents access the knowledge base is via an MCP (Model Context Protocol) server, not filesystem-based CLAUDE.md discovery.

**Why:**

MCP is the de facto standard for agent-to-service communication in 2026. Claude, Codex, Gemini, Cursor, and VS Code all support it. The MCP server exposes documents as Resources and provides Tools for search, context map lookup, and related document discovery. This is better than filesystem discovery because it's on-demand (agents pull what they need, not everything), permission-aware (respects document-level access controls), and works regardless of where the agent is running.

A local sync bridge is offered as backward compatibility for teams using Claude Code's filesystem CLAUDE.md discovery.

---

## 010: Context Maps as Generalized Entity Index

**Decision:** The "feature index" concept from Team OS is generalized into "context maps" — a flexible relational index that works for any entity type.

**Why:**

The product serves more than product/engineering teams. A project manager needs a project index, a partnerships team needs a partner index, a sales team needs a deal index, a hiring team needs a role/pipeline index. The underlying pattern is the same: an entity has artifacts scattered across functions and time, and the index makes those connections explicit and navigable.

By making the entity type and artifact categories user-defined, the product serves any team in any domain without requiring domain-specific features.
