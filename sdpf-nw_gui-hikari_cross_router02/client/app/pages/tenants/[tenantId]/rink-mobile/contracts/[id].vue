<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RinkMobilePages, TenantPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const TabName = {
  Connection: 'connection',
  Lines: 'lines',
  Usages: 'usages',
  Devices: 'devices',
} as const
const tabs = Object.values(TabName).map(name => ({
  text: t(`rinkConnections.tabs.${name}`),
  name,
}))
const currentTabName = computed(() => Object.values(TabName).find(v => v === route.query.tab) || TabName.Connection)
const rinkMobileId = computed(() => route.params.id as string)

const { rinkConnection, getRinkConnection } = useGetRinkConnection()
const { customLocalBreakOutList, getCustomLocalBreakoutList } = useGetCustomLocalBreakoutList()
const { rinkLineGroupList, getRinkLineGroupList } = useGetRinkLineGroupList()
const { allRinkLineList, getAllRinkLineList } = useGetAllRinkLineList()
const { rinkLineGroupListCurrentUsageMap, getRinkLineGroupListCurrentUsageMap } = useGetRinkLineGroupUsageMonthMap()

const handleTabChange = (tabName: string) => {
  // タブが切り替わったタイミングでデータを初期化する
  router.push({ query: { tab: tabName } })
}

const moveToTop = () => {
  return navigateTo({
    path: `/tenants/${route.params.tenantId}/${TenantPages.RinkMobile}/${RinkMobilePages.Contracts}`,
  })
}

onBeforeMount(async () => {
  await getRinkConnection(rinkMobileId.value)
  if (rinkConnection.value?.customLocalBreakOutList?.length) {
    getCustomLocalBreakoutList(rinkMobileId.value)
  }
  // getRinkLineGroupList が 404 でも getAllRinkLineList を必ず実行するために先に呼ぶ
  getAllRinkLineList(rinkMobileId.value)
  await getRinkLineGroupList(rinkMobileId.value)
  getRinkLineGroupListCurrentUsageMap(rinkLineGroupList.value.map(lineGroup => lineGroup.lineGroupId))
})
</script>

<template>
  <SimpleTab :tabs="tabs" :current-tab-name="currentTabName" @click="handleTabChange">
    <template #[TabName.Connection]>
      <div v-if="rinkConnection" class="tab-container">
        <RinkConnectionDetail
          :rink-connection="rinkConnection"
          :custom-local-break-out-list="customLocalBreakOutList"
        />

        <div class="border-top flex-flex-end-center mt-3 py-3">
          <CustomButton color="info" icon="left-arrow" :text="t('common.return')" :width="180" @click="router.back" />
          <CustomButton
            class="ml-6"
            icon="right-arrow"
            :text="t('rinkConnections.moveToTop')"
            :width="280"
            @click="moveToTop"
          />
        </div>
      </div>
    </template>
    <template #[TabName.Lines]>
      <div class="tab-container">
        <RinkLineInformation
          :rink-line-group-list="rinkLineGroupList"
          :rink-line-list="allRinkLineList.lineList"
          :rink-line-group-list-current-usage-map="rinkLineGroupListCurrentUsageMap"
        />
        <div class="border-top flex-flex-end-center mt-5 py-3">
          <CustomButton color="info" icon="left-arrow" :text="t('common.return')" :width="180" @click="router.back" />
          <CustomButton
            class="ml-6"
            icon="right-arrow"
            :text="t('rinkConnections.moveToTop')"
            :width="280"
            @click="moveToTop"
          />
        </div>
      </div>
    </template>
    <template #[TabName.Usages]>
      <div class="tab-container">
        <RinkUsageInformation
          :rink-line-group-list="rinkLineGroupList"
          :rink-line-list="allRinkLineList.lineList"
          :rink-line-group-list-current-usage-map="rinkLineGroupListCurrentUsageMap"
        />
        <div class="border-top flex-flex-end-center mt-5 py-3">
          <CustomButton color="info" icon="left-arrow" :text="t('common.return')" :width="180" @click="router.back" />
          <CustomButton
            class="ml-6"
            icon="right-arrow"
            :text="t('rinkConnections.moveToTop')"
            :width="280"
            @click="moveToTop"
          />
        </div>
      </div>
    </template>
    <template #[TabName.Devices]>
      <div class="tab-container">
        <DeviceInformation />
        <div class="border-top flex-flex-end-center mt-5 py-3">
          <CustomButton color="info" icon="left-arrow" :text="t('common.return')" :width="180" @click="router.back" />
          <CustomButton
            class="ml-6"
            icon="right-arrow"
            :text="t('rinkConnections.moveToTop')"
            :width="280"
            @click="moveToTop"
          />
        </div>
      </div>
    </template>
  </SimpleTab>
</template>

<style scoped lang="scss">
.tab-container {
  padding: 0.75rem;
  border-radius: 0 0 1rem 1rem;
  background-color: #ffffff;
}
.border-top {
  border-top: v.$split-border;
}
</style>
