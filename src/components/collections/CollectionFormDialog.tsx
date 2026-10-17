'use client'

/*
 * CollectionFormDialog — create or edit a seller collection.
 *
 * Preset collection types (Hot Deals, Best Sellers, New Arrivals, Offers,
 * Flash Sale, Trending) auto-fill name + slug when selected from the
 * dropdown.  The seller can also type a fully custom name.
 */

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateCollection,
  useUpdateCollection,
  type Collection,
} from '@/hooks/use-collections'
import { getFriendlyError } from '@/lib/api-client'

// ---------------------------------------------------------------------------
// Preset collection types the seller can pick from a dropdown
// ---------------------------------------------------------------------------

const PRESET_COLLECTIONS = [
  { label: 'Hot Deals', slug: 'hot-deals' },
  { label: 'Best Sellers', slug: 'best-sellers' },
  { label: 'New Arrivals', slug: 'new-arrivals' },
  { label: 'Offers', slug: 'offers' },
  { label: 'Flash Sale', slug: 'flash-sale' },
  { label: 'Trending', slug: 'trending' },
  { label: 'Featured', slug: 'featured' },
  { label: 'Staff Picks', slug: 'staff-picks' },
  { label: 'Clearance', slug: 'clearance' },
  { label: 'Custom', slug: '' }, // free-form entry
] as const

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CollectionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, the dialog is in edit mode */
  collection?: Collection | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CollectionFormDialog({
  open,
  onOpenChange,
  collection,
}: CollectionFormDialogProps) {
  const isEdit = Boolean(collection)

  // Form state
  const [preset, setPreset] = React.useState<string>('')
  const [name, setName] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [slugEdited, setSlugEdited] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const createCollection = useCreateCollection()
  const updateCollection = useUpdateCollection()
  const isPending = createCollection.isPending || updateCollection.isPending

  // Seed form when opened in edit mode
  React.useEffect(() => {
    if (open) {
      if (collection) {
        setName(collection.name)
        setSlug(collection.slug)
        setDescription(collection.description ?? '')
        setSlugEdited(true)
        // Try to match a preset
        const matched = PRESET_COLLECTIONS.find(
          (p) => p.slug === collection.slug
        )
        setPreset(matched ? matched.slug : 'custom')
      } else {
        setPreset('')
        setName('')
        setSlug('')
        setDescription('')
        setSlugEdited(false)
      }
      setError(null)
    }
  }, [open, collection])

  // When preset changes, fill name + slug (unless custom)
  function handlePresetChange(value: string) {
    setPreset(value)
    const found = PRESET_COLLECTIONS.find((p) => p.slug === value)
    if (found && found.slug !== '') {
      setName(found.label)
      setSlug(found.slug)
      setSlugEdited(true)
    } else {
      // "Custom" — clear so user types their own
      setName('')
      setSlug('')
      setSlugEdited(false)
    }
  }

  // Auto-derive slug from name while user hasn't manually edited slug
  function handleNameChange(value: string) {
    setName(value)
    if (!slugEdited) {
      setSlug(toSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlug(toSlug(value))
    setSlugEdited(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Collection name is required.'); return }
    if (!slug.trim()) { setError('Slug is required.'); return }
    if (slug.length < 2) { setError('Slug must be at least 2 characters.'); return }

    try {
      if (isEdit && collection) {
        await updateCollection.mutateAsync({ id: collection.id, name: name.trim(), slug, description: description.trim() || undefined })
      } else {
        await createCollection.mutateAsync({ name: name.trim(), slug, description: description.trim() || undefined })
      }
      onOpenChange(false)
    } catch (err) {
      setError(getFriendlyError(err, 'Failed to save collection.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit collection' : 'New collection'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset picker — only shown when creating */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Collection type</Label>
              <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a preset or start custom…" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_COLLECTIONS.map((p) => (
                    <SelectItem key={p.slug || 'custom'} value={p.slug || 'custom'}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Presets fill in the name and URL slug automatically. Choose Custom to define your own.
              </p>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="col-name">Name *</Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Hot Deals"
              maxLength={80}
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="col-slug">URL slug *</Label>
            <Input
              id="col-slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. hot-deals"
              maxLength={80}
              required
            />
            <p className="text-xs text-muted-foreground">
              Used in collection URLs. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="col-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="col-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe this collection…"
              rows={2}
              maxLength={300}
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
