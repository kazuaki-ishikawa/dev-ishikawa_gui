<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineOptions({
  name: 'TrafficFlowDownload',
})

definePageMeta({
  layout: 'no-sidebar',
})

const { t } = useI18n()
const { loading } = useLoading()

const { downloadTrafficFlow } = useTrafficFlowDownload()

const route = useRoute()
const terminalId = computed(() => route.query.terminalId as string)
const startTime = computed(() => route.query.startTime as string)
const endTime = computed(() => route.query.endTime as string)

const isDownloadSuccessful = ref(false)

onMounted(async () => {
  if (!terminalId.value || !startTime.value || !endTime.value) {
    return
  }
  try {
    await downloadTrafficFlow({
      terminalId: terminalId.value,
      startTime: startTime.value,
      endTime: endTime.value,
    })
    isDownloadSuccessful.value = true
  } catch {
    // isDownloadSuccessful は初期値が false なので何もしない
  }
})

const closeTab = () => {
  window.close()
}
</script>

<template>
  <div v-if="!loading" class="container">
    <div class="card">
      <div class="message">
        {{
          isDownloadSuccessful
            ? t('flowCollectors.message.downloadSucceeded')
            : t('flowCollectors.message.downloadFailed')
        }}
      </div>
      <CustomButton :text="t('common.close')" icon="right-arrow" :width="160" @click="closeTab" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 500px;
  max-width: 100%;
  padding: 3rem 1rem;
  border-radius: 20px;
  background-color: #fff;
}

.message {
  text-align: center;
  white-space: pre-wrap;
}
</style>
