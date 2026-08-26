<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const { rinkDeviceTableList, getRinkDeviceTableList } = useGetRinkDeviceTableList()

const rinkMobileId = computed(() => route.params.id as string)

const headers = [
  { text: t('rinkDevices.modelName'), key: 'modelName' },
  { text: t('rinkDevices.imei'), key: 'imei' },
  { text: t('rinkDevices.orderDate'), key: 'orderDate' },
]

const items = computed(() => {
  if (!rinkDeviceTableList.value) {
    return []
  }

  return rinkDeviceTableList.value.deviceList.map(device => ({
    modelName: device.modelName,
    imei: device.imei,
    orderDate: formatDate(device.orderDate),
  }))
})

const handleDownload = () => {
  console.log('TODO')
}
const handleChangeLimit = (limit: number) => {
  router.push({ query: { ...route.query, limit, page: 1 } })
}
const handleChangePage = (page: number) => {
  router.push({ query: { ...route.query, page } })
}

const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
watch(
  () => route.query,
  () => {
    getRinkDeviceTableList(rinkMobileId.value, pagination.value)
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <div class="flex-space-between-center my-4">
      <div>{{ t('rinkDevices.numberOfDevices', { count: rinkDeviceTableList.total }) }}</div>
      <CustomButton
        icon="download"
        :text="t('common.download')"
        :width="180"
        :disabled="!items.length"
        @click="handleDownload"
      />
    </div>
    <PaginationHeader
      :total="rinkDeviceTableList.total"
      :limit="pagination.limit"
      :page="pagination.page"
      @update:limit="handleChangeLimit"
    />
    <StripedTable :items="items" :headers="headers" />
    <PaginationFooter
      :total="rinkDeviceTableList.total"
      :limit="pagination.limit"
      :page="pagination.page"
      @update:page="handleChangePage"
    />
  </div>
</template>
