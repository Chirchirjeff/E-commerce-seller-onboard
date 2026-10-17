'use client'

/**
 * RichDescriptionEditor
 *
 * Lets sellers build a hybrid product description composed of three block types:
 *   • text  — a plain paragraph or multi-line text block
 *   • table — spec table with custom headers and rows (e.g. Version, Playtime…)
 *   • image — a single uploaded image with an optional caption
 *
 * The editor serialises to/from a JSON array (`DescriptionBlock[]`) that
 * matches the `descriptionBlocks` field on the backend Product model.
 * A plain `description` string is also supported for backwards compat —
 * when the seller switches to rich mode the existing plain text is migrated
 * into the first text block automatically.
 */

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  Table2,
  ImageIcon,
  ChevronUp,
  ChevronDown,
  Loader2,
  Upload,
  X,
} from 'lucide-react'

// ── Block types ───────────────────────────────────────────────────────────────

export type BlockType = 'text' | 'table' | 'image'

export interface TextBlock  { type: 'text';  content: string }
export interface ImageBlock { type: 'image'; content: string; caption?: string }
export interface TableBlock {
  type: 'table'
  content: { headers: string[]; rows: string[][] }
}
export type DescriptionBlock = TextBlock | ImageBlock | TableBlock

// ── Props ─────────────────────────────────────────────────────────────────────

interface RichDescriptionEditorProps {
  /** Current array of blocks; pass [] for a fresh editor */
  value: DescriptionBlock[]
  onChange: (blocks: DescriptionBlock[]) => void
  /** Optionally seed from a legacy plain-text description on first open */
  legacyDescription?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeText(content = ''): TextBlock   { return { type: 'text',  content } }
function makeImage(): ImageBlock              { return { type: 'image', content: '' } }
function makeTable(): TableBlock {
  return {
    type: 'table',
    content: {
      headers: ['Feature', 'Value'],
      rows: [['', '']],
    },
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function RichDescriptionEditor({
  value,
  onChange,
  legacyDescription,
}: RichDescriptionEditorProps) {
  // Seed once from legacy plain text when there are no blocks yet
  const seeded = React.useRef(false)
  React.useEffect(() => {
    if (!seeded.current && value.length === 0 && legacyDescription?.trim()) {
      seeded.current = true
      onChange([makeText(legacyDescription.trim())])
    }
  }, [legacyDescription, value.length, onChange])

  const addBlock = (type: BlockType) => {
    const block: DescriptionBlock =
      type === 'text'  ? makeText()  :
      type === 'image' ? makeImage() :
                         makeTable()
    onChange([...value, block])
  }

  const removeBlock = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const next = [...value]
    const target = idx + dir
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  const updateBlock = (idx: number, updated: DescriptionBlock) => {
    const next = [...value]
    next[idx] = updated
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {/* Block list */}
      {value.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No description blocks yet. Add a text block, spec table, or image below.
          </p>
        </div>
      )}

      {value.map((block, idx) => (
        <BlockCard
          key={idx}
          block={block}
          index={idx}
          total={value.length}
          onUpdate={(b) => updateBlock(idx, b)}
          onRemove={() => removeBlock(idx)}
          onMove={(dir) => moveBlock(idx, dir)}
        />
      ))}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => addBlock('text')}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
        >
          <Type className="h-3.5 w-3.5" />
          Add Text
        </button>
        <button
          type="button"
          onClick={() => addBlock('table')}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
        >
          <Table2 className="h-3.5 w-3.5" />
          Add Spec Table
        </button>
        <button
          type="button"
          onClick={() => addBlock('image')}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Add Image
        </button>
      </div>
    </div>
  )
}

// ── BlockCard wrapper ─────────────────────────────────────────────────────────

interface BlockCardProps {
  block: DescriptionBlock
  index: number
  total: number
  onUpdate: (b: DescriptionBlock) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}

function BlockCard({ block, index, total, onUpdate, onRemove, onMove }: BlockCardProps) {
  const typeLabel = block.type === 'text' ? 'Text' : block.type === 'table' ? 'Spec Table' : 'Image'
  const TypeIcon = block.type === 'text' ? Type : block.type === 'table' ? Table2 : ImageIcon

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden />
        <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-medium text-muted-foreground flex-1">{typeLabel} Block</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0}
            className="p-1 rounded hover:bg-accent disabled:opacity-30" aria-label="Move up">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1}
            className="p-1 rounded hover:bg-accent disabled:opacity-30" aria-label="Move down">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onRemove}
            className="p-1 rounded hover:bg-destructive/10 text-destructive" aria-label="Remove block">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Block editor */}
      <div className="p-4">
        {block.type === 'text'  && <TextBlockEditor  block={block}  onUpdate={onUpdate} />}
        {block.type === 'image' && <ImageBlockEditor block={block}  onUpdate={onUpdate} />}
        {block.type === 'table' && <TableBlockEditor block={block}  onUpdate={onUpdate} />}
      </div>
    </div>
  )
}

// ── Text block editor ─────────────────────────────────────────────────────────

function TextBlockEditor({ block, onUpdate }: { block: TextBlock; onUpdate: (b: DescriptionBlock) => void }) {
  return (
    <Textarea
      value={block.content}
      onChange={(e) => onUpdate({ ...block, content: e.target.value })}
      placeholder="Enter your description text here…"
      rows={4}
      className="resize-none"
    />
  )
}

// ── Image block editor ────────────────────────────────────────────────────────

function ImageBlockEditor({ block, onUpdate }: { block: ImageBlock; onUpdate: (b: DescriptionBlock) => void }) {
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState(block.content || undefined)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('files', file)
      const { data } = await apiClient.post<{ files: string[] }>('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const remoteUrl = data.files[0]
      setPreview(remoteUrl)
      onUpdate({ ...block, content: remoteUrl })
    } catch {
      setUploadError('Upload failed — please try again.')
      setPreview(block.content || undefined)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    setPreview(undefined)
    onUpdate({ ...block, content: '' })
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video max-h-48">
          <img src={preview} alt="Description image" className="w-full h-full object-contain" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          {!uploading && (
            <button type="button" onClick={handleRemove}
              className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 py-8 cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload an image</p>
        </div>
      )}

      {!preview && (
        <Button type="button" variant="outline" size="sm" className="gap-2"
          disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload Image</>}
        </Button>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

      {/* Caption */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Caption (optional)</Label>
        <Input
          value={block.caption ?? ''}
          onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
          placeholder="Describe this image…"
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}

// ── Table block editor ────────────────────────────────────────────────────────

function TableBlockEditor({ block, onUpdate }: { block: TableBlock; onUpdate: (b: DescriptionBlock) => void }) {
  const { headers, rows } = block.content

  const setHeaders = (newHeaders: string[]) =>
    onUpdate({ ...block, content: { ...block.content, headers: newHeaders } })

  const setRows = (newRows: string[][]) =>
    onUpdate({ ...block, content: { ...block.content, rows: newRows } })

  const addRow = () => setRows([...rows, headers.map(() => '')])

  const removeRow = (ri: number) => setRows(rows.filter((_, i) => i !== ri))

  const addColumn = () => {
    setHeaders([...headers, ''])
    setRows(rows.map((r) => [...r, '']))
  }

  const removeColumn = (ci: number) => {
    setHeaders(headers.filter((_, i) => i !== ci))
    setRows(rows.map((r) => r.filter((_, i) => i !== ci)))
  }

  const updateHeader = (ci: number, val: string) => {
    const h = [...headers]; h[ci] = val; setHeaders(h)
  }

  const updateCell = (ri: number, ci: number, val: string) => {
    const r = rows.map((row) => [...row])
    r[ri][ci] = val
    setRows(r)
  }

  return (
    <div className="space-y-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[320px]">
        <thead>
          <tr>
            {headers.map((h, ci) => (
              <th key={ci} className="border border-input p-1">
                <div className="flex items-center gap-1">
                  <input
                    value={h}
                    onChange={(e) => updateHeader(ci, e.target.value)}
                    placeholder={`Header ${ci + 1}`}
                    className="flex-1 min-w-0 bg-transparent outline-none text-xs font-semibold placeholder:text-muted-foreground"
                  />
                  {headers.length > 1 && (
                    <button type="button" onClick={() => removeColumn(ci)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </th>
            ))}
            <th className="border border-input p-1 w-8">
              <button type="button" onClick={addColumn}
                className="w-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-input p-1">
                  <input
                    value={cell}
                    onChange={(e) => updateCell(ri, ci, e.target.value)}
                    placeholder="Value"
                    className="w-full bg-transparent outline-none text-xs placeholder:text-muted-foreground"
                  />
                </td>
              ))}
              <td className="border border-input p-1 w-8">
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(ri)}
                    className="w-full flex items-center justify-center text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" onClick={addRow}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Add row
      </button>
    </div>
  )
}
