<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const newsId = computed(() => route.params.id as string)

const { news, getNews } = useGetNews()

const { $md } = useNuxtApp()
const message = computed(() => $md.render(news.value?.message ?? ''))

onBeforeMount(() => getNews(newsId.value))
</script>

<template>
  <div>
    <div class="b-rd-3 bg-white overflow-hidden mb-3">
      <div class="bg-secondary text-white pa-3 flex-space-between-flex-end">
        <div class="text-size-3xl">{{ news?.subject }}</div>
        <div>{{ formatDate(news?.timestamp) }}</div>
      </div>
      <div class="pa-3">
        <div class="markdown" v-html="message" />
      </div>
    </div>
    <CustomButton class="mx-auto" :text="t('news.backToList')" icon="left-arrow" @click="router.back()" />
  </div>
</template>

<style lang="scss" scoped>
.b-rd-3 {
  border-radius: 0.75rem;
}
.text-size-3xl {
  font-size: 1.875rem;
}
</style>
