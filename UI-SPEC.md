# UI Specification

Detailed interaction design for V1 components. Reference this when building the toolbar, sidebar panels, keyboard shortcuts, and editor behaviors.

---

## Toolbar

The toolbar sits across the top of the editor area (not the full window — it's inside the editor column, to the right of any visible sidebar panels).

### Button Order (Left to Right)

| Position | Control | Type | Behavior |
|---|---|---|---|
| 1 | Heading level | Dropdown | Options: Paragraph, Heading 1, Heading 2, Heading 3, Heading 4, Heading 5, Heading 6. Shows current block type. Selecting a level converts the current block. |
| 2 | Bold | Toggle | Applies/removes strong emphasis on selection or at cursor. |
| 3 | Italic | Toggle | Applies/removes emphasis on selection or at cursor. |
| 4 | Strikethrough | Toggle | Applies/removes strikethrough on selection or at cursor. |
| 5 | Inline Code | Toggle | Applies/removes inline code on selection or at cursor. |
| 6 | Link | Action | Opens a dialog for URL entry (and optional title). If text is selected, it becomes the link text. If cursor is inside an existing link, the dialog is pre-filled for editing. |
| 7 | Image | Action | Opens a file picker or dialog for image path/URL and alt text. Inserts image at cursor position. |
| 8 | Unordered List | Toggle | Converts current block to/from bullet list item. |
| 9 | Ordered List | Toggle | Converts current block to/from numbered list item. |
| 10 | Task List | Toggle | Converts current block to/from task list item (checkbox). |
| 11 | Blockquote | Toggle | Wraps/unwraps current block in a blockquote. |
| 12 | Horizontal Rule | Action | Inserts a thematic break at cursor position. |
| 13 | Code Block | Action | Inserts a fenced code block. Shows a language selector dropdown (searchable, common languages). |
| 14 | Table | Action | Opens a small dialog to configure rows and columns, then inserts a table. |

### Toolbar State Reflection

Every toggle button reflects the formatting state at the current cursor position:

- Cursor is inside bold text → Bold button is visually highlighted/active.
- Cursor is inside an H2 → Heading dropdown shows "Heading 2".
- Cursor is inside a blockquote → Blockquote button is active.
- Cursor is inside a list item → The corresponding list button (unordered, ordered, or task) is active.
- Multiple conflicting states in a selection → Buttons show mixed/indeterminate state.

### Toolbar Visual Design

- Buttons are icon-based with tooltips on hover showing the action name and keyboard shortcut.
- Visual grouping with subtle separators between related controls: [Text formatting] | [Links & Media] | [Lists] | [Blocks & Structure].
- The toolbar should feel restrained — similar to Google Docs' toolbar density, not like a cluttered ribbon.

---

## Keyboard Shortcuts

The app detects the user's platform and maps Cmd (macOS) or Ctrl (Windows/Linux) accordingly. All shortcuts listed here use "Cmd" — substitute "Ctrl" on non-Mac platforms.

### Text Formatting

| Action | Shortcut |
|---|---|
| Bold | Cmd+B |
| Italic | Cmd+I |
| Strikethrough | Cmd+Shift+X |
| Inline Code | Cmd+E |
| Link | Cmd+K |

### Block Formatting

| Action | Shortcut |
|---|---|
| Heading 1 | Cmd+1 |
| Heading 2 | Cmd+2 |
| Heading 3 | Cmd+3 |
| Heading 4 | Cmd+4 |
| Heading 5 | Cmd+5 |
| Heading 6 | Cmd+6 |
| Paragraph (clear heading) | Cmd+0 |
| Ordered List | Cmd+Shift+7 |
| Unordered List | Cmd+Shift+8 |
| Task List | Cmd+Shift+9 |
| Blockquote | Cmd+Shift+. |
| Code Block | Cmd+Shift+C |
| Horizontal Rule | Cmd+Shift+- |

### Navigation and Panels

| Action | Shortcut |
|---|---|
| Toggle Document Outline | Cmd+Shift+O |
| Toggle File Tree (desktop only) | Cmd+Shift+E |
| Find | Cmd+F |
| Find and Replace | Cmd+Shift+F |

### File Operations

| Action | Shortcut |
|---|---|
| New File | Cmd+N |
| Open File | Cmd+O |
| Save | Cmd+S |
| Save As | Cmd+Shift+S |

### Editing

| Action | Shortcut |
|---|---|
| Undo | Cmd+Z |
| Redo | Cmd+Shift+Z |
| Select All | Cmd+A |

---

## Document Outline Panel

### Position and Layout

- Sits to the left of the editor (to the right of the file tree when both are visible).
- Width is resizable by dragging the divider. Default width: ~200px.
- Collapsible via keyboard shortcut (Cmd+Shift+O) or a toggle button.

### Content

- Displays all headings (H1–H6) extracted from the current document.
- Headings are displayed in a nested, indented hierarchy reflecting their level.
- Each heading entry shows the heading text only (no level indicator like "H2" — the indentation conveys this).

### Interactions

- **Click** a heading → the editor scrolls to that heading smoothly.
- **Current section highlighting** → as the user scrolls the editor, the outline highlights the heading of the section currently in view. This uses scroll position, not cursor position.
- **Real-time updates** → as the user types, the outline updates immediately. Adding a new heading makes it appear in the outline. Deleting a heading removes it.

### Edge Cases

- Empty document: outline shows a placeholder message ("No headings yet").
- Very long heading text: truncated with ellipsis in the outline panel.
- Document with only one heading level (e.g., all H2s): displayed as a flat list, no indentation.

---

## YAML Front-Matter Panel

### Position and Layout

- Sits at the top of the editor area, above the document body.
- Collapsible — the user can collapse it to a single line showing "Front Matter" with an expand chevron.
- Visually distinct from the document body (subtle background color, border, or card-like container).

### Content

- Displays key-value pairs from the YAML front-matter block.
- Each pair is an editable row: key label on the left, value field on the right.
- Supported value types: strings (text input), lists (comma-separated or tag-style chips), dates (date picker), booleans (toggle switch).

### Interactions

- **Edit a value** → click the value field and type. Changes sync back to the YAML block in the underlying Markdown.
- **Add a key-value pair** → "Add field" button at the bottom of the panel. Prompts for key name and value type.
- **Remove a key-value pair** → hover over a row to reveal a delete button.
- **Add front-matter to a document that doesn't have it** → menu action (Format > Add Front Matter) or keyboard shortcut.

### Underlying Behavior

- The panel is a structured view of the raw YAML. The `.md` file always contains standard `---` delimited front-matter.
- Edits in the panel update the YAML immediately.
- If the user opens a file with front-matter that contains complex YAML (nested objects, multi-line strings), the panel renders a best-effort view. Edge cases fall back to a raw text editor for that field.

---

## Table Editing

### Insertion

- Toolbar button opens a small dialog: "Rows: [3] Columns: [3] [Insert]" with a visual grid selector (hover to select dimensions).
- Tables are inserted with a header row and empty body rows.

### In-Table Editing

- Click into any cell to edit it. The cell becomes focused with a subtle highlight.
- Tab moves to the next cell (left to right, then wraps to the next row).
- Shift+Tab moves to the previous cell.
- Enter within a cell creates a soft break (if supported) or moves to the cell below.

### Structural Operations

- **Add row:** context menu or button that appears below the table on hover. Adds a row below the current row.
- **Add column:** context menu or button that appears to the right of the table on hover. Adds a column to the right of the current column.
- **Delete row/column:** context menu options.
- **Column alignment:** context menu on a column header → Left, Center, Right. Visual indicator in the header (alignment icon or subtle text alignment change).

### Visual Design

- Tables render as clean grids with borders and alternating row shading (optional, follows theme).
- Header row is visually distinct (bold text, slightly different background).
- The table should feel like editing a simple spreadsheet, not fighting with pipe characters.

---

## Code Block Handling

### Insertion

- Toolbar code block button inserts a fenced code block at the cursor position.
- A language selector appears at the top of the block — a searchable dropdown with common languages (JavaScript, TypeScript, Python, Go, Rust, Swift, HTML, CSS, SQL, Bash, JSON, YAML, Markdown, and others).
- Selecting a language activates syntax highlighting for that language.

### In-Block Editing

- Inside a code block, the editor switches to a monospace font.
- No WYSIWYG formatting is applied — Tab inserts spaces (configurable: 2 or 4), bold/italic shortcuts are disabled.
- Copy/paste into a code block preserves raw text without formatting conversion.
- The block has a subtle background color and border to distinguish it from body text.

### Visual Design

- Language label displayed in the top-right corner of the block (small, muted text).
- Syntax highlighting follows a clean, readable color scheme that works in both light and dark mode.

---

## Link Handling

### Display

- Links render as styled, colored text (standard link blue or theme-appropriate color, with underline).
- Hovering a link shows a small floating preview with the URL and an "Edit" button.

### Interaction

- **Click** a link → follows the link (opens in new tab).
- **Cmd+Click** or clicking the "Edit" button in the hover preview → opens the link editing dialog (URL, title, link text).
- **Cmd+K** with text selected → creates a new link with that text.
- **Cmd+K** with cursor inside existing link → opens edit dialog for that link.

---

## Image Handling

### Insertion

- Toolbar image button opens a dialog with two options: enter a URL, or pick a local file.
- Drag-and-drop: dropping an image file onto the editor inserts it at the drop position.
- Paste: pasting an image from clipboard inserts it at the cursor.

### Display

- Images render inline in the document at a reasonable size (max-width constrained to the editor column).
- Alt text is shown as a tooltip on hover.

### Editing

- Clicking an image selects it and shows a floating toolbar: alt text field, resize handles (or size presets), delete button.
- The `.md` file uses standard GFM image syntax. For local images (drag-and-drop), the app uses a relative path from the document's location.

---

## Search (Find and Replace)

### Find (Cmd+F)

- A search bar slides in at the top of the editor (not a modal — similar to browser find).
- Matches are highlighted in the document with a distinct background color.
- Current match is highlighted differently from other matches.
- Up/down arrows or Enter/Shift+Enter navigate between matches.
- Match count displayed ("3 of 17").
- Search is case-insensitive by default with a toggle for case-sensitive.

### Find and Replace (Cmd+Shift+F)

- The search bar expands to include a replace field.
- "Replace" replaces the current match. "Replace All" replaces all matches.

### Critical Behavior

- Search operates on the visible rendered text, NOT on the underlying Markdown syntax.
- Searching for "hello" finds "hello" inside headings, bold text, links, list items, code blocks — regardless of the Markdown formatting around it.
- The user never needs to know or account for Markdown characters in their search.

---

## Typography and Spacing

### Fonts

- **Body text:** Proportional sans-serif. Default: Inter, system font stack fallback. The user can choose from a small curated set in preferences (Inter, Georgia, Merriweather, system default).
- **Code (inline and blocks):** Monospace. Default: JetBrains Mono or Fira Code.
- **Headings:** Same family as body, distinguished by size and weight.

### Spacing

- Line height: ~1.6 for body text (comfortable reading).
- Paragraph spacing: clear visual separation between blocks (roughly one blank line equivalent).
- Heading spacing: extra space above headings, less below (headings visually attach to the content they introduce).
- Editor margins: generous horizontal padding so text doesn't touch the edges. The text column should be ~700-750px wide max (optimal reading width), centered in the editor area.

### Dark Mode

- Follows the system `prefers-color-scheme` setting by default.
- Manual override in preferences (Light / Dark / System).
- All UI elements, syntax highlighting, and editor surfaces have both light and dark variants.
