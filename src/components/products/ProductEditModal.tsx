'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ImageUploadField from '@/components/ui/image-upload-field'
import { RichDescriptionEditor, type DescriptionBlock } from '@/components/products/RichDescriptionEditor'
import { useUpdateProduct } from '@/hooks/use-products'

type DescriptionMode = 'plain' | 'rich'

interface ProductEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any | null
}

export function ProductEditModal({
  open,
  onOpenChange,
  product,
}: ProductEditModalProps) {
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    stockQuantity: '',
    thumbnailUrl: '',
  })

  const [descriptionMode, setDescriptionMode] = React.useState<DescriptionMode>('plain')
  const [descriptionBlocks, setDescriptionBlocks] = React.useState<DescriptionBlock[]>([])

  const updateProduct = useUpdateProduct()

  React.useEffect(() => {
    if (product && open) {
      const hasBlocks = Array.isArray(product.descriptionBlocks) && product.descriptionBlocks.length > 0
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        salePrice: product.salePrice != null ? product.salePrice.toString() : '',
        stockQuantity: product.stockQuantity?.toString() || '0',
        thumbnailUrl: product.thumbnailUrl || '',
      })
      setDescriptionMode(hasBlocks ? 'rich' : 'plain')
      setDescriptionBlocks(hasBlocks ? product.descriptionBlocks : [])
    }
  }, [product, open])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (url: string) => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product?.id) return

    const parsedSalePrice = formData.salePrice.trim()
      ? parseFloat(formData.salePrice)
      : null

    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          name: formData.name,
          description: descriptionMode === 'plain' ? formData.description : undefined,
          descriptionBlocks: descriptionMode === 'rich' && descriptionBlocks.length > 0
            ? descriptionBlocks
            : undefined,
          price: parseFloat(formData.price),
          salePrice: parsedSalePrice,
          stockQuantity: parseInt(formData.stockQuantity, 10),
          thumbnailUrl: formData.thumbnailUrl,
        },
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update product:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product details including price, description, and stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
            />
          </div>

          {/* Description — mode toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              <div className="flex rounded-md border overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setDescriptionMode('plain')}
                  className={`px-3 py-1 transition-colors ${descriptionMode === 'plain' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  Plain Text
                </button>
                <button
                  type="button"
                  onClick={() => setDescriptionMode('rich')}
                  className={`px-3 py-1 transition-colors ${descriptionMode === 'rich' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  Rich (Tables &amp; Images)
                </button>
              </div>
            </div>

            {descriptionMode === 'plain' ? (
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={4}
              />
            ) : (
              <RichDescriptionEditor
                value={descriptionBlocks}
                onChange={setDescriptionBlocks}
                legacyDescription={formData.description}
              />
            )}
          </div>

          {/* Price + Sale price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (KES)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">
                Sale Price (KES){' '}
                <span className="text-xs text-muted-foreground font-normal">optional</span>
              </Label>
              <Input
                id="salePrice"
                name="salePrice"
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={handleInputChange}
                placeholder="Leave blank if no discount"
              />
            </div>
          </div>

          {/* Stock Quantity */}
          <div className="space-y-2">
            <Label htmlFor="stockQuantity">Stock Quantity</Label>
            <Input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              min="0"
              value={formData.stockQuantity}
              onChange={handleInputChange}
              placeholder="0"
            />
          </div>

          {/* Product Image */}
          <div className="space-y-2">
            <ImageUploadField
              label="Product Thumbnail"
              value={formData.thumbnailUrl}
              onChange={handleImageChange}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProduct.isPending}
            >
              {updateProduct.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
