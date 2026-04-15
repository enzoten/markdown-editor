'use client'

import { useState, useCallback } from 'react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const LANGUAGES = [
  'plaintext', 'javascript', 'typescript', 'python', 'go', 'rust',
  'swift', 'java', 'c', 'cpp', 'csharp', 'ruby', 'php',
  'html', 'css', 'scss', 'sql', 'bash', 'shell',
  'json', 'yaml', 'toml', 'xml', 'markdown',
  'dockerfile', 'graphql', 'kotlin', 'scala', 'r',
]

export default function CodeBlockView({
  node,
  updateAttributes,
  extension,
}: NodeViewProps) {
  const language = node.attrs.language || extension.options.defaultLanguage || 'plaintext'
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(node.textContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [node])

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div className="code-block-header">
        <select
          className="code-block-lang"
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          contentEditable={false}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <button
          className="code-block-copy"
          onClick={handleCopy}
          contentEditable={false}
          title="Copy code"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre>
        {/* @ts-expect-error — NodeViewContent supports "code" but types are restrictive */}
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
