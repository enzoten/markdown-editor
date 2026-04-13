/**
 * Sample Markdown content exercising all GFM features.
 * Every construct should render as WYSIWYG — no raw syntax visible.
 */
export const sampleMarkdown = `---
title: GFM Feature Showcase
status: draft
author: Team OS
tags:
  - markdown
  - editor
  - prototype
draft: true
---

# GFM Feature Showcase

This document validates that the editor **never shows raw Markdown syntax**, even when the cursor is inside formatted text.

## Inline Formatting

Here is **bold text** in the middle of a sentence. And here is *italic text* alongside it. You can also have ***bold and italic*** combined. Here is ~~strikethrough text~~ as well.

Inline \`code spans\` should render with a code background, not backticks.

## Links

Visit the [Tiptap documentation](https://tiptap.dev) for more details. Here is [another link](https://github.com) to test with.

## Headings at Every Level

### Third Level Heading

#### Fourth Level Heading

##### Fifth Level Heading

###### Sixth Level Heading

## Lists

### Unordered List

- First item
- Second item
- Third item with **bold** and *italic*

### Ordered List

1. Step one
2. Step two
3. Step three

### Task List

- [ ] Unchecked task
- [x] Completed task
- [ ] Another task with a [link](https://example.com)

## Blockquote

> This is a blockquote. It should render with a visual left border, not \`>\` characters.
>
> It can span multiple paragraphs.

## Horizontal Rule

Content above the rule.

---

Content below the rule.

## Code Block

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}
\`\`\`

## Table

| Feature | Status | Notes |
|---------|--------|-------|
| Bold | Done | Zero syntax reveal confirmed |
| Italic | Done | Works with cursor inside |
| Links | Done | No \`[text](url)\` visible |
| Headings | Done | Toolbar reflects level |
| Tables | New | Pipe characters hidden |

## Image

![Sample placeholder](https://via.placeholder.com/600x200?text=Sample+Image)

## Mixed Content

Here is a paragraph with **bold**, *italic*, ~~strikethrough~~, \`inline code\`, and a [link to example](https://example.com) all in the same line.
`
