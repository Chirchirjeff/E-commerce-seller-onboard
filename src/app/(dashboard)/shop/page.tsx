'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useShop, useUpdateShop } from '@/hooks/use-shop'
import { Store, Loader2, CheckCircle2 } from 'lucide-react'
import ImageUploadField from '@/components/ui/image-upload-field'
import ShopLinksManager from '@/components/shop/ShopLinksManager'
import ShopLinksAnalytics from '@/components/shop/ShopLinksAnalytics'

export default function ShopPage() {
  const { data: shop, isLoading } = useShop()
  const updateShop = useUpdateShop()
  const [formData, setFormData] = React.useState({
    name: '',
    businessDescription: '',
    businessLogo: '',
    coverPhoto: '',
  })
  const [isEditing, setIsEditing] = React.useState(false)
  const [success, setSuccess] = React.useState('')

  React.useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        businessDescription: shop.businessDescription || '',
        businessLogo: shop.businessLogo || '',
        coverPhoto: shop.coverPhoto || '',
      })
    }
  }, [shop])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    try {
      await updateShop.mutateAsync(formData)
      setSuccess('Shop updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to update shop:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading shop details...</p>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-4">
          <Store className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">No Shop Yet</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Your shop will be created automatically once your KYC is approved.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Shop</h1>
          <p className="text-sm text-muted-foreground">Manage your shop information and branding</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={shop.verificationStatus === 'ACTIVE' ? 'success' : 'warning'}>
            {shop.verificationStatus === 'ACTIVE' ? 'Active' : 'Pending'}
          </Badge>
          {!isEditing && <Button onClick={() => setIsEditing(true)}>Edit Shop</Button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
              <CardDescription>Update your shop details and branding</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {success && (
                  <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />{success}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Shop Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={!isEditing} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Business Description</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.businessDescription}
                    onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Describe your business..."
                  />
                </div>
                
                {isEditing && (
                  <>
                    <ImageUploadField
                      label="Shop Logo"
                      value={formData.businessLogo}
                      onChange={(url) => setFormData({ ...formData, businessLogo: url })}
                      disabled={!isEditing}
                    />
                    <ImageUploadField
                      label="Shop Cover Photo"
                      value={formData.coverPhoto}
                      onChange={(url) => setFormData({ ...formData, coverPhoto: url })}
                      disabled={!isEditing}
                    />
                  </>
                )}

                {!isEditing && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Shop Logo</Label>
                      {formData.businessLogo ? (
                        <div className="h-20 w-20 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                          <img 
                            src={formData.businessLogo} 
                            alt="Shop logo" 
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              console.error('Logo failed to load:', formData.businessLogo)
                              const img = e.target as HTMLImageElement
                              img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e0e7ff" width="80" height="80"/%3E%3Ctext x="50%" y="50%" font-size="12" fill="%236366f1" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No logo uploaded</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Shop Cover Photo</Label>
                      {formData.coverPhoto ? (
                        <div className="h-32 w-full rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                          <img 
                            src={formData.coverPhoto} 
                            alt="Shop cover" 
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              console.error('Cover photo failed to load:', formData.coverPhoto)
                              const img = e.target as HTMLImageElement
                              img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="128"%3E%3Crect fill="%23e0e7ff" width="400" height="128"/%3E%3Ctext x="50%" y="50%" font-size="14" fill="%236366f1" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No cover photo uploaded</p>
                      )}
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={updateShop.isPending}>
                      {updateShop.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setFormData({ name: shop.name, businessDescription: shop.businessDescription || '', businessLogo: shop.businessLogo || '', coverPhoto: shop.coverPhoto || '' }) }}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </form>
          </Card>

          <ShopLinksManager />
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>Shop Stats</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={shop.verificationStatus === 'ACTIVE' ? 'success' : 'warning'}>
                  {shop.verificationStatus === 'ACTIVE' ? 'Active' : 'Pending'}
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Products</span>
                <span className="font-medium">{shop._count?.products || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Orders</span>
                <span className="font-medium">{shop._count?.orders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span className="font-medium">{new Date(shop.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Share Link Analytics</h2>
        <ShopLinksAnalytics shopId={shop?.id} />
      </div>
    </>
  )
}
