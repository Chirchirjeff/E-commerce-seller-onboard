export interface CreateShopLinkDto {
  title?: string
  description?: string
  source?: 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'whatsapp' | 'email' | 'other'
}

export interface ShopLink {
  id: string
  shopId: string
  token: string
  title?: string
  description?: string
  source?: string
  clickCount: number
  lastClickedAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ShopLinkAnalytics {
  id: string
  token: string
  title?: string
  description?: string
  source?: string
  clickCount: number
  lastClickedAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  analytics?: {
    totalClicks: number
    uniqueVisitors?: number
    topCountries?: Array<{ country: string; visits: number }>
    topDevices?: Array<{ device: string; visits: number }>
    topBrowsers?: Array<{ browser: string; visits: number }>
    clicksByDay?: Array<{ date: string; clicks: number }>
  }
}
