<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.BreakOut.Apply,
  middleware: ['navigation'],
  params: ['tenantId', 'id'],
  fallback: {
    name: RouteName.BreakOut.List,
    params: ['tenantId'],
    query: { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] },
  },
})

const { t } = useI18n()
const route = useRoute()

const { breakOut, getBreakOut } = useGetBreakOut()

const breakOutListId = computed(() => route.params.id as string)

const currentStep = ref(3)

const steps = [
  { title: t('nova.update.inputTitle'), value: 1 },
  { title: t('nova.common.confirm'), value: 2 },
  { title: t('nova.common.complete'), value: 3 },
]

const moveToSite = () => {
  // TODO 拠点詳細画面へ遷移する
}

onBeforeMount(() => {
  getBreakOut(breakOutListId.value)
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="breakOut?.customerNote" />

    <div class="my-4">
      <NovaCustomStepper v-model="currentStep" :steps="steps" />
    </div>

    <v-card class="mb-5">
      <NovaCardTitleWithBorder :title="t('nova.update.completeTitle')">
        <div class="mb-5 text-base font-weight-bold">{{ t('nova.breakOut.message.updated') }}</div>
        <div class="mb-2 text-pre-wrap">{{ t('nova.breakOut.message.updatedDescription') }}</div>
      </NovaCardTitleWithBorder>
    </v-card>

    <div class="flex-center-center py-4">
      <NovaCustomButton outlined @click="moveToSite">{{ t('nova.common.moveToSiteDetail') }}</NovaCustomButton>
    </div>
  </div>
</template>
