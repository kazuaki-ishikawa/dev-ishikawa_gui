import type { NewsListQuery, NewsListResponse, NewsResponse } from '@/api/news/types'

export const useGetNewsList = () => {
  const { API } = useAPI()

  const newsList = ref<NewsListResponse | null>(null)
  const newsQuery = ref<NewsListQuery>({})
  const getNewsList = async (query: NewsListQuery) => {
    try {
      newsQuery.value = query
      const response = await API.GET<NewsListResponse, NewsListQuery>('monitorings/news', { query })
      newsList.value = response
      return response
    } catch (error) {
      newsList.value = null
      throw error
    }
  }

  return { newsQuery, newsList, getNewsList }
}

export const useGetNews = () => {
  const { API } = useAPI()

  const news = ref<NewsResponse | null>(null)
  const getNews = async (newsId: string) => {
    try {
      const response = await API.GET<NewsResponse>(`monitorings/news/${newsId}`)
      news.value = response
      return response
    } catch (error) {
      news.value = null
      throw error
    }
  }

  return { news, getNews }
}
