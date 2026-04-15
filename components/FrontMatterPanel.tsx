'use client'

import { useState } from 'react'
import type { FrontMatterData } from '@/lib/frontmatter'

export default function FrontMatterPanel({
  data,
  onChange,
}: {
  data: FrontMatterData | null
  onChange: (data: FrontMatterData | null) => void
}) {
  const [collapsed, setCollapsed] = useState(true)

  if (!data) {
    return (
      <div className="frontmatter-panel frontmatter-panel--empty">
        <button
          className="frontmatter-add-btn"
          onClick={() => onChange({ title: '', status: 'draft' })}
        >
          + Add Front Matter
        </button>
      </div>
    )
  }

  if (collapsed) {
    return (
      <div className="frontmatter-panel frontmatter-panel--collapsed">
        <button
          className="frontmatter-toggle"
          onClick={() => setCollapsed(false)}
          aria-expanded={false}
          aria-label="Expand front matter"
        >
          <span className="frontmatter-chevron">&#9654;</span>
          Front Matter
          <span className="frontmatter-count">{Object.keys(data).length} fields</span>
        </button>
      </div>
    )
  }

  const entries = Object.entries(data)

  const updateField = (key: string, value: unknown) => {
    onChange({ ...data, [key]: value })
  }

  const removeField = (key: string) => {
    const next = { ...data }
    delete next[key]
    if (Object.keys(next).length === 0) {
      onChange(null)
    } else {
      onChange(next)
    }
  }

  const addField = () => {
    const key = window.prompt('Field name:')
    if (key && key.trim()) {
      onChange({ ...data, [key.trim()]: '' })
    }
  }

  return (
    <div className="frontmatter-panel">
      <div className="frontmatter-header">
        <button
          className="frontmatter-toggle"
          onClick={() => setCollapsed(true)}
          aria-expanded={true}
          aria-label="Collapse front matter"
        >
          <span className="frontmatter-chevron">&#9660;</span>
          Front Matter
        </button>
      </div>
      <div className="frontmatter-fields">
        {entries.map(([key, value]) => (
          <FrontMatterField
            key={key}
            fieldKey={key}
            value={value}
            onUpdate={(v) => updateField(key, v)}
            onRemove={() => removeField(key)}
          />
        ))}
      </div>
      <button className="frontmatter-add-field" onClick={addField}>
        + Add field
      </button>
    </div>
  )
}

function FrontMatterField({
  fieldKey,
  value,
  onUpdate,
  onRemove,
}: {
  fieldKey: string
  value: unknown
  onUpdate: (value: unknown) => void
  onRemove: () => void
}) {
  // Determine value type and render appropriate control
  if (typeof value === 'boolean') {
    return (
      <div className="frontmatter-field">
        <label className="frontmatter-key">{fieldKey}</label>
        <div className="frontmatter-value">
          <label className="frontmatter-toggle-switch">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onUpdate(e.target.checked)}
            />
            <span className="frontmatter-toggle-label">{value ? 'true' : 'false'}</span>
          </label>
        </div>
        <button className="frontmatter-remove" onClick={onRemove} title="Remove field">&times;</button>
      </div>
    )
  }

  if (Array.isArray(value)) {
    const tags = value.map(String)
    return (
      <div className="frontmatter-field">
        <label className="frontmatter-key">{fieldKey}</label>
        <div className="frontmatter-value">
          <div className="frontmatter-tags">
            {tags.map((tag, i) => (
              <span key={i} className="frontmatter-tag">
                {tag}
                <button
                  className="frontmatter-tag-remove"
                  onClick={() => {
                    const next = [...tags]
                    next.splice(i, 1)
                    onUpdate(next)
                  }}
                >&times;</button>
              </span>
            ))}
            <input
              className="frontmatter-tag-input"
              placeholder="Add..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  onUpdate([...tags, e.currentTarget.value.trim()])
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        </div>
        <button className="frontmatter-remove" onClick={onRemove} title="Remove field">&times;</button>
      </div>
    )
  }

  // Default: string input
  return (
    <div className="frontmatter-field">
      <label className="frontmatter-key">{fieldKey}</label>
      <div className="frontmatter-value">
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onUpdate(e.target.value)}
          className="frontmatter-input"
        />
      </div>
      <button className="frontmatter-remove" onClick={onRemove} title="Remove field">&times;</button>
    </div>
  )
}
