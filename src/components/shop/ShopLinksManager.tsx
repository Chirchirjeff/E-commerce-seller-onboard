'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Trash2, 
  MoreHorizontal,
  ExternalLink,
  Loader2,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useShop } from '@/hooks/use-shop'
import { useShopLinks } from '@/hooks/use-shop-links'

export default function ShopLinksManager() {
  const { data: shop } = useShop()
  const {
    links,
    isLoading,
    createLink,
    deleteLink,
    toggleLinkStatus,
    updateLink,
  } = useShopLinks(shop?.id || '')

  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [copiedType, setCopiedType] = React.useState<'token' | 'username' | null>(null)

  const handleCreateLink = async () => {
    if (!shop) return

    try {
      // Create link with no metadata - just generate it instantly
      await createLink.mutateAsync({})
    } catch (error) {
      console.error('Failed to create link:', error)
    }
  }

  const handleCopyLink = (token: string, type: 'token' | 'username' = 'token') => {
    const webappUrl = process.env.NEXT_PUBLIC_WEBAPP_URL || 'http://localhost:3001'
    let url: string
    
    if (type === 'token') {
      // Direct token-based link to buyer webapp storefront
      url = `${webappUrl}/${token}`
    } else {
      // Use shop slug for username-based link
      url = `${webappUrl}/${shop?.slug || token}`
    }
    
    navigator.clipboard.writeText(url)
    setCopiedId(token)
    setCopiedType(type)
    setTimeout(() => {
      setCopiedId(null)
      setCopiedType(null)
    }, 2000)
  }

  const handleDeleteLink = async (linkId: string) => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      try {
        await deleteLink.mutateAsync(linkId)
      } catch (error) {
        console.error('Failed to delete link:', error)
      }
    }
  }

  const handleToggleStatus = async (linkId: string) => {
    try {
      await toggleLinkStatus.mutateAsync(linkId)
    } catch (error) {
      console.error('Failed to toggle link status:', error)
    }
  }

  if (!shop) {
    return null
  }

  if (shop.verificationStatus !== 'ACTIVE') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Share Your Shop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="rounded-full bg-amber-50 p-4 w-fit mx-auto mb-4">
              <LinkIcon className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your shop must be verified and active before you can create share links.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Share Your Shop
          </CardTitle>
          <CardDescription>Generate a link to share on social media</CardDescription>
        </div>
        <Button 
          onClick={handleCreateLink}
          disabled={createLink.isPending}
          className="gap-2"
        >
          {createLink.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Generate Link
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-12">
            <div className="rounded-full bg-slate-100 p-4 w-fit mx-auto mb-4">
              <LinkIcon className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              No share links yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Your shop link:</p>
                  <code className="text-sm font-mono bg-muted p-2 rounded block truncate">
                    {(() => {
                      const webappUrl = process.env.NEXT_PUBLIC_WEBAPP_URL || 'http://localhost:3000'
                      return `${webappUrl}/${link.token}`
                    })()}
                  </code>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{link.clickCount} clicks</span>
                    {link.createdAt && (
                      <span>
                        Created {new Date(link.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleCopyLink(link.token, 'token')}
                    variant="default"
                  >
                    {copiedId === link.token && copiedType === 'token' ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-blue-600 cursor-pointer"
                        onClick={() => {
                          const webappUrl = process.env.NEXT_PUBLIC_WEBAPP_URL || 'http://localhost:3000'
                          const url = `${webappUrl}/${link.token}`
                          window.open(url, '_blank')
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Preview Link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(link.id)}
                        disabled={toggleLinkStatus.isPending}
                      >
                        {link.isActive ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Disable Link
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Enable Link
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={deleteLink.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
