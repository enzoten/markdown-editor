'use client'

import { useState } from 'react'
import type { FrontMatterData } from '@/lib/frontmatter'
import { ChevronRight, ChevronDown, X } from 'lucide-react'

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
      <div className="px-4 py-1.5">
        <button
          className="text-xs text-primary hover:underline"
          onClick={() => onChange({ title: '', status: 'draft' })}
        >
          + Add Front Matter
        </button>
      </div>
    )
  }

  if (collapsed) {
    return (
      <div className="border-b border-border">
        <button
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground w-full text-left"
          onClick={() => setCollapsed(false)}
          aria-expanded={false}
          aria-label="Expand front matter"
        >
          <ChevronRight className="h-3 w-3" />
          Front Matter
          <span className="font-normal text-muted-foreground/60 ml-1">{Object.keys(data).length} fields</span>
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
    <div className="border-b border-border bg-muted/30 px-4 py-2.5">
      <div className="mb-2">
        <button
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(true)}
          aria-expanded={true}
          aria-label="Collapse front matter"
        >
          <ChevronDown className="h-3 w-3" />
          Front Matter
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
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
      <button className="mt-2 text-xs text-primary hover:underline" onClick={addField}>
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
  if (typeof value === 'boolean') {
    return (
      <div className="group flex items-start gap-2">
        <label className="min-w-[80px] shrink-0 text-xs font-medium text-muted-foreground py-1">{fieldKey}</label>
        <div className="flex-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground py-1">
            <input type="checkbox" checked={value} onChange={(e) => onUpdate(e.target.checked)} className="rounded accent-primary" />
            {value ? 'true' : 'false'}
          </label>
        </div>
        <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-0.5" onClick={onRemove} title="Remove field">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  if (Array.isArray(value)) {
    const tags = value.map(String)
    return (
      <div className="group flex items-start gap-2">
        <label className="min-w-[80px] shrink-0 text-xs font-medium text-muted-foreground py-1">{fieldKey}</label>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1">
            {tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px]">
                {tag}
                <button
                  className="frontmatter-tag-remove text-primary hover:text-destructive text-xs leading-none"
                  onClick={() => {
                    const next = [...tags]
                    next.splice(i, 1)
                    onUpdate(next)
                  }}
                >&times;</button>
              </span>
            ))}
            <input
              className="border-none outline-none text-xs py-0.5 px-1 w-14 bg-transparent"
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
        <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-0.5" onClick={onRemove} title="Remove field">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-2">
      <label className="min-w-[80px] shrink-0 text-xs font-medium text-muted-foreground py-1">{fieldKey}</label>
      <div className="flex-1">
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onUpdate(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>
      <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-0.5" onClick={onRemove} title="Remove field">
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
