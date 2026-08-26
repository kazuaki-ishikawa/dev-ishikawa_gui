<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { $vuetify } = useNuxtApp()
if ($vuetify.theme.global.name.value !== 'defaultTheme') {
  $vuetify.theme.change('defaultTheme')
}

const { t } = useI18n()
const route = useRoute()

const pageName = [
  'tenants-tenantId-terminals-firmware-update-bulk',
  'tenants-tenantId-terminals-firmware-history',
  'tenants-tenantId-terminals-firmware-history-id',
]
const TabName = {
  Execute: 'execute',
  History: 'history',
} as const

const currentTabName = computed(() =>
  route.name === 'tenants-tenantId-terminals-firmware-update-bulk' ? TabName.Execute : TabName.History,
)
const tabs = computed(() => [
  { text: t('firmwareUpdate.bulkExecution'), name: TabName.Execute },
  { text: t('firmwareUpdate.bulkHistory'), name: TabName.History },
])

const handleTabChange = async (tabName: string) => {
  if (tabName === TabName.Execute) {
    await navigateTo({
      name: pageName[0],
      params: { tenantId: route.params.tenantId },
    })
  } else if (tabName === TabName.History) {
    await navigateTo({
      name: pageName[1],
      params: { tenantId: route.params.tenantId },
    })
  }
}
</script>

<template>
  <v-main class="main">
    <SideBar />
    <RootContainer>
      <SimpleTab :tabs="tabs" :current-tab-name="currentTabName" @click="handleTabChange">
        <div class="bg-white pa-8">
          <slot />
        </div>
      </SimpleTab>
    </RootContainer>
  </v-main>
</template>

<style scoped lang="scss">
.main {
  min-height: 100vh;
  min-width: calc(v.$bg-min-width + 3rem);
  display: grid;
  grid-template-columns: v.$sidebar-width 1fr;
  background-size: cover;
  background-image: url(v.$bg-image);
  background-attachment: fixed;
}
</style>
