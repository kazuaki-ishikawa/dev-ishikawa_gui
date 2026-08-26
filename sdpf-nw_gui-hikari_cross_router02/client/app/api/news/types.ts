import type { CommonQuery } from '@/api/types'

export type NewsResponse = {
  newsId: string
  timestamp: string
  subject: string
  message: string
  readFlag: boolean
}

export type NewsListQuery = CommonQuery & {
  subject?: string
}

export type NewsListResponse = {
  total: number
  offset: number
  newsList: NewsResponse[]
}
