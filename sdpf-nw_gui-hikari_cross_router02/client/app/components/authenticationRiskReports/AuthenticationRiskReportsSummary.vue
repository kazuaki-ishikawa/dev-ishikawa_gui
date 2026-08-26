<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type {
  AuthenticationStatusListResponse,
  ThreatReportsSummaryResponse,
  ThreatTrendListResponse,
} from '@/api/threatInfo/types'
import { IDAAS_LINK } from '@/api/threatInfo/constants'
import { IconTypes } from '@/components/icons/constants'

type PropsType = {
  threatReportsSummary: ThreatReportsSummaryResponse | null
  totalCount: number
  authenticationStatusList: AuthenticationStatusListResponse | null
  threatTrendList: ThreatTrendListResponse | null
}
const props = defineProps<PropsType>()

const { t } = useI18n()

const targetIndex = ref(0)
const target = computed(() => props.authenticationStatusList?.statuses[targetIndex.value] ?? null)
const handleTargetChange = (direction: number) => {
  targetIndex.value = targetIndex.value + direction
}
const disabledPrev = computed(
  () => !props.authenticationStatusList || targetIndex.value >= props.authenticationStatusList.statuses.length - 1,
)
const disabledNext = computed(() => !props.authenticationStatusList || targetIndex.value <= 0)
</script>

<template>
  <div class="position-relative">
    <CardContainer class="mb-5 position-relative">
      <i18n-t keypath="idaas.message.authenticationRiskReportDescription" tag="div" scope="global" class="mt-n3 mb-5">
        <template #here>
          <NuxtLink :to="IDAAS_LINK.KC" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
      <div class="mb-3 flex-flex-start-center">
        <SvgIcon :type="IconTypes.AlertTriangle" color="secondary" />
        <div class="ml-2 text-lg">{{ t('idaas.authenticationRiskReportsSummary') }}</div>
      </div>
      <div class="grid">
        <!-- 認証リスク状況（直近14日間） -->
        <InnerCard>
          <div class="text-secondary">{{ t('idaas.authenticationRiskStatus') }}</div>
          <div class="my-3">
            <AuthenticationRiskReportsSummaryCountChart :data="threatReportsSummary" :total="totalCount" />
          </div>
        </InnerCard>
        <!-- 認証状況（1日間） -->
        <InnerCard>
          <div class="flex-space-between-center">
            <div class="text-secondary">{{ t('idaas.authenticationStatus') }}</div>
            <div class="flex-flex-start-center">
              <CircleButton icon="caret-left" :disabled="disabledPrev" @click="handleTargetChange(1)" />
              <div class="mx-2">{{ formatDate(target?.date) }}</div>
              <CircleButton icon="caret-right" :disabled="disabledNext" @click="handleTargetChange(-1)" />
            </div>
          </div>
          <div class="my-3">
            <AuthenticationStatusCountChart :data="target" :total="target ? target.success + target.failed : 0" />
          </div>
        </InnerCard>
      </div>
      <!-- 月次推移 -->
      <InnerCard class="mt-5">
        <div class="text-secondary">{{ t('idaas.authenticationRiskTrend') }}</div>
        <AuthenticationRiskTrendChart :data="threatTrendList" />
      </InnerCard>
    </CardContainer>
  </div>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 0.75rem;
}
</style>
