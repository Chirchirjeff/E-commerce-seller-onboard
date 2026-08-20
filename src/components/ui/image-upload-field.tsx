'use client'

import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface ImageUploadFieldProps {
  label: string
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
  maxSize?: number // in bytes, default 5MB
  acceptedFormats?: string[] // default: ['image/jpeg', 'image/png', 'image/webp']
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState(value)

  const uploadFile = async (file: File): Promise<string> => {
    if (!acceptedFormats.includes(file.type)) {
      throw new Error(`File type not accepted. Allowed: ${acceptedFormats.join(', ')}`)
    }

    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`)
    }

    const form = new FormData()
    form.append('files', file)
    const { data } = await apiClient.post<{ files: string[] }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.files[0]
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      // Show local preview immediately
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Upload to server
      const remoteUrl = await uploadFile(file)
      onChange(remoteUrl)
      setPreview(remoteUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreview(value)
    } finally {
      setUploading(false)
      // Reset the input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    setPreview(undefined)
    onChange('')
    setError(null)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>

      <div className="flex flex-col gap-4">
        {preview && (
          <div className="relative h-32 w-32 rounded-lg border overflow-hidden bg-muted">
            {/* Use regular HTML img tag to avoid Next.js Image optimization issues */}
            <img 
              src={preview} 
              alt="Preview" 
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error('Image failed to load:', preview)
                const img = e.target as HTMLImageElement
                img.style.display = 'none'
              }}
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2 items-start">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            disabled={disabled || uploading}
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {preview ? 'Change' : 'Upload'} Image
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <p className="text-xs text-muted-foreground">
          {Math.round(maxSize / 1024 / 1024)}MB max • JPG, PNG, WebP
        </p>
      </div>
    </div>
  )
}
