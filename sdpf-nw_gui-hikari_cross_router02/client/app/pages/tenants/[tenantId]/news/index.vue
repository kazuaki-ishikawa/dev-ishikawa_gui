<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import UnreadIcon from '~icons/ztgict/unread'
import type { NewsListQuery } from '@/api/news/types'
import { IconTypes } from '@/components/icons/constants'
import { TenantPages } from '@/components/sidebar/constants'
import type { SortOption } from '@/components/table/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const { newsQuery, newsList, getNewsList } = useGetNewsList()

const headers = [
  { text: t('news.timestamp'), key: 'timestamp', width: 220 },
  { text: t('news.subject'), key: 'subject' },
]
const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const sortOption = computed<Partial<SortOption>>(() => ({
  sortKey: newsQuery.value?.sortKey,
  direction: newsQuery.value?.direction,
}))

const routerPushQuery = (query: NewsListQuery) => {
  router.push({ query: { ...query, offset: undefined, page: (query.offset ?? 0) + 1 } })
}
const routeQuery = computed(() =>
  ['limit', 'page', 'subject', 'sortKey', 'direction'].reduce((query, key) => {
    const value = route.query[key]
    if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
      if (key === 'page') {
        return Object.assign(query, { offset: Number(value) < 2 ? 0 : Number(value) - 1 })
      }
      return Object.assign(query, { [key]: Number(value) })
    } else {
      return Object.assign(query, { [key]: value })
    }
  }, {}),
)

// boolean は SortableTable で扱えないため文字列に変換
const sortableTableItems = computed(() =>
  (newsList.value?.newsList ?? []).map(news => ({ ...news, readFlag: news.readFlag ? 'true' : '' })),
)

const handleSort = (option?: SortOption) => {
  routerPushQuery({ ...newsQuery.value, sortKey: option?.sortKey, direction: option?.direction })
}
const handleChangeLimit = (limit?: number) => {
  routerPushQuery({ ...newsQuery.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  routerPushQuery({ ...newsQuery.value, offset: page - 1 })
}
const handleSearch = () => {
  const newQuery = { ...newsQuery.value, offset: 0 }
  if (isEqual(routeQuery.value, newQuery)) {
    // パスクエリの変更がない場合は直接 getNewsList を実行する
    getNewsList(newQuery)
  } else {
    routerPushQuery(newQuery)
  }
}
const handleQueryClear = () => {
  newsQuery.value = { ...newsQuery.value, subject: undefined }
}

watch(
  () => route.query,
  () => {
    getNewsList(routeQuery.value)
  },
  { immediate: true },
)
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center pb-3">
      <SvgIcon class="pt-1" :type="IconTypes.News" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ t('sideBar.news') }}</div>
    </div>

    <div class="d-flex">
      <SearchFilter @search="handleSearch" @clear="handleQueryClear">
        <InputGrid :label="t('news.subject')" :label-width="180">
          <InputForm
            :model-value="newsQuery.subject ?? ''"
            :placeholder="t('news.subject')"
            @update:model-value="(value: string) => (newsQuery.subject = value || undefined)"
          />
        </InputGrid>
      </SearchFilter>
    </div>

    <PaginationHeader
      :page="pagination.page"
      :limit="pagination.limit"
      :total="newsList?.total"
      @update:limit="handleChangeLimit"
    />
    <SortableTable
      :headers="headers"
      :items="sortableTableItems"
      :key-items="['newsId']"
      :sort="sortOption"
      @sort="handleSort"
    >
      <template #timestamp="{ row }">
        <div class="d-flex align-center">
          <div>{{ formatDateTime(row.timestamp, false) }}</div>
          <div class="flex-center-center pl-5">
            <UnreadIcon v-if="!row.readFlag" />
          </div>
        </div>
      </template>
      <template #subject="{ row }">
        <NuxtLink :to="`/tenants/${tenantId}/${TenantPages.News}/${row.newsId}`">{{ row.subject }}</NuxtLink>
      </template>
    </SortableTable>
    <PaginationFooter
      :page="pagination.page"
      :limit="pagination.limit"
      :total="newsList?.total ?? 0"
      @update:page="handleChangePage"
    />
  </CardContainer>
</template>
