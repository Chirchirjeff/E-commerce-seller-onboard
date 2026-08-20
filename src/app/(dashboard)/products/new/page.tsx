/*
 * Add Product Page - Create New Product
 * Form to add new products with images and details
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateProduct } from '@/hooks/use-products'
import { useCategories } from '@/hooks/use-shop'
import { apiClient } from '@/lib/api-client'
import { Loader2, Upload, X, ImagePlus } from 'lucide-react'

const MAX_IMAGES = 10

export default function NewProductPage() {
  const router = useRouter()
  const createProduct = useCreateProduct()
  const { data: categories } = useCategories()

  const [isLoading, setIsLoading] = React.useState(false)
  const [uploadingImages, setUploadingImages] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    marketplaceCategoryId: '',
  })

  // Each entry: { previewUrl: string (local blob), remoteUrl: string | null }
  const [images, setImages] = React.useState<
    { previewUrl: string; remoteUrl: string | null; file: File }[]
  >([])

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // ── Upload selected files to POST /uploads and return remote URLs ──
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    const { data } = await apiClient.post<{ files: string[] }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.files
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return

    // Enforce cap
    const remaining = MAX_IMAGES - images.length
    const toAdd = selected.slice(0, remaining)

    // Show local previews immediately
    const previews = toAdd.map((file) => ({
      previewUrl: URL.createObjectURL(file),
      remoteUrl: null,
      file,
    }))
    setImages((prev) => [...prev, ...previews])

    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''

    // Upload to server
    setUploadingImages(true)
    setUploadError(null)
    try {
      const remoteUrls = await uploadFiles(toAdd)
      setImages((prev) => {
        // Match the newly added previews (last `toAdd.length` items) to their remote URLs
        const updated = [...prev]
        const startIdx = updated.length - toAdd.length
        remoteUrls.forEach((url, i) => {
          updated[startIdx + i] = { ...updated[startIdx + i], remoteUrl: url }
        })
        return updated
      })
    } catch {
      setUploadError('Image upload failed. Please remove the failed images and try again.')
      // Remove the previews that failed
      setImages((prev) => prev.slice(0, prev.length - toAdd.length))
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev]
      URL.revokeObjectURL(copy[index].previewUrl)
      copy.splice(index, 1)
      return copy
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Don't submit while images are still uploading
    if (uploadingImages) return

    const pendingUploads = images.filter((img) => img.remoteUrl === null)
    if (pendingUploads.length > 0) {
      setUploadError('Please wait — some images are still uploading.')
      return
    }

    // Validate numeric fields before sending — parseFloat/parseInt return NaN
    // on empty strings, which the backend rejects with a 400.
    const parsedPrice = parseFloat(formData.price)
    const parsedStock = formData.stockQuantity === '' ? 0 : parseInt(formData.stockQuantity, 10)

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setSubmitError('Please enter a valid price.')
      return
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
      setSubmitError('Please enter a valid stock quantity.')
      return
    }

    setIsLoading(true)
    try {
      const imageUrls = images.map((img) => img.remoteUrl as string)
      await createProduct.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        price: parsedPrice,
        stockQuantity: parsedStock,
        // Send marketplaceCategoryId (required field for backend)
        marketplaceCategoryId: formData.marketplaceCategoryId || undefined,
        // First image becomes the thumbnail; all go into imageUrls for the gallery
        thumbnailUrl: imageUrls[0] ?? undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      })
      router.push('/products')
    } catch (error: any) {
      console.error('Failed to create product:', error)
      const status = error?.response?.status
      const backendMessage = error?.response?.data?.message

      // If the backend sent a message array (validation errors), join them
      let details = ''
      if (Array.isArray(backendMessage)) {
        details = backendMessage.join(', ')
      } else if (typeof backendMessage === 'string') {
        details = backendMessage
      }

      if (status === 400) {
        setSubmitError(details || 'Some fields are invalid. Please check your details and try again.')
      } else if (status === 403) {
        setSubmitError("You don't have permission to create products.")
      } else if (status === 404) {
        setSubmitError(details || 'Your shop was not found. Please complete shop setup before adding products.')
      } else {
        setSubmitError('Failed to create product. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add New Product</h1>
          <p className="text-sm text-muted-foreground">Create a new product for your shop</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Left column: product details ── */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Basic product details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter product name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your product..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      required
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.marketplaceCategoryId}
                    onValueChange={(value) => setFormData({ ...formData, marketplaceCategoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right column: image upload ── */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload up to {MAX_IMAGES} images. The first image will be used as the thumbnail.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">

                {/* Image grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <div
                        key={img.previewUrl}
                        className="relative aspect-square rounded-md border overflow-hidden bg-muted"
                      >
                        <img
                          src={img.previewUrl}
                          alt={`Product image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Uploading spinner overlay */}
                        {img.remoteUrl === null && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          </div>
                        )}
                        {/* Primary badge */}
                        {idx === 0 && img.remoteUrl !== null && (
                          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white leading-none">
                            Primary
                          </span>
                        )}
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {images.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 py-8">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No images added yet</p>
                  </div>
                )}

                {/* Error message */}
                {uploadError && (
                  <p className="text-xs text-destructive">{uploadError}</p>
                )}

                {/* Upload button */}
                {images.length < MAX_IMAGES && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={uploadingImages}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingImages ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {images.length === 0 ? 'Upload Images' : `Add More (${images.length}/${MAX_IMAGES})`}
                      </>
                    )}
                  </Button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {submitError && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}
          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading || uploadingImages}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create Product'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/products')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}
