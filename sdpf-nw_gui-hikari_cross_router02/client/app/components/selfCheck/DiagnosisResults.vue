<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UpRightSquareIcon from '~icons/ztgict/up-right-square'
import { DiagnosisResult, DiagnosisResultsURL } from '@/api/healthDiagnosis/constants'
import type { DiagnosisResultType } from '@/api/healthDiagnosis/types'
import { IconSize } from '@/components/icons/constants'

const CONTACT_LINK = 'https://portal-jp.ecl.ntt.com/angora-cp-gui-jp?action=create-ticket'
const UNNECESSARY_LINK = [DiagnosisResult.NoAlert, DiagnosisResult.TerminalAllOk, DiagnosisResult.IpoeNg] as string[]

type PropType = {
  diagnosisResults?: DiagnosisResultType[]
  mainGuaranteeConnected?: boolean
  inProgressSwitchover?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  diagnosisResults: () => [],
  mainGuaranteeConnected: false,
  inProgressSwitchover: false,
})
const { t } = useI18n()

const guaranteeInternetAndVpnList = [
  DiagnosisResult.GuaranteeInternetBgpNg,
  DiagnosisResult.GuaranteeInternetBgpWarning,
  DiagnosisResult.GuaranteeVpnBgpNg,
  DiagnosisResult.GuaranteeVpnBgpWarning,
]

const hasOnuResult = computed(() =>
  [
    DiagnosisResult.GuaranteeOnuAccessDown,
    DiagnosisResult.GuaranteeOnuRinhDown,
    DiagnosisResult.GuaranteeOnuUniDown,
  ].some(result => props.diagnosisResults?.includes(result)),
)

const hideWorkaround = (diagnosisResult: DiagnosisResultType) =>
  guaranteeInternetAndVpnList.includes(diagnosisResult) && hasOnuResult.value

const diagnosisResultsHeaders = [
  { text: 'No.', key: 'number', width: 50 },
  { text: t('diagnosisResults.checkPoint'), key: 'checkPoint', width: 200 },
  { text: t('diagnosisResults.result'), key: 'result' },
  { text: t('diagnosisResults.workaround'), key: 'workaround' },
  { text: t('diagnosisResults.link'), key: 'link', width: 90 },
]

const diagnosisResultsItems = computed(() => {
  const filteredResults = props.diagnosisResults.filter(
    d => !props.mainGuaranteeConnected || d !== DiagnosisResult.IpsecNg,
  )

  const switchoverResults: (
    | typeof DiagnosisResult.SwitchoverInProgress
    | typeof DiagnosisResult.SwitchoverGuaranteeInternetBgpNg
    | typeof DiagnosisResult.SwitchoverGuaranteeVpnBgpNg
  )[] = []
  if (props.inProgressSwitchover) {
    switchoverResults.push(DiagnosisResult.SwitchoverInProgress)
    if (props.diagnosisResults.includes(DiagnosisResult.GuaranteeInternetBgpNg)) {
      switchoverResults.push(DiagnosisResult.SwitchoverGuaranteeInternetBgpNg)
    }
    if (props.diagnosisResults.includes(DiagnosisResult.GuaranteeVpnBgpNg)) {
      switchoverResults.push(DiagnosisResult.SwitchoverGuaranteeVpnBgpNg)
    }
  }

  return [...filteredResults, ...switchoverResults].map((data, index) => ({
    number: `${index + 1}`,
    checkPoint: t(`diagnosisResults.${data}.checkPoint`),
    result: t(`diagnosisResults.${data}.result`),
    workaround: hideWorkaround(data) ? '' : t(`diagnosisResults.${data}.workaround`),
    link:
      UNNECESSARY_LINK.includes(data) || hideWorkaround(data)
        ? ''
        : (DiagnosisResultsURL[data as keyof typeof DiagnosisResultsURL] as string),
    diagnosisResult: data,
  }))
})
</script>

<template>
  <div>
    <SeparatedTable :headers="diagnosisResultsHeaders" :items="diagnosisResultsItems" :key-items="['diagnosisResult']">
      <template #result="{ data }">
        <div class="text-start w-100 px-2">{{ data }}</div>
      </template>
      <template #workaround="{ data }">
        <div v-if="data !== '-'" class="text-start w-100 px-2 text-pre-wrap">{{ data }}</div>
      </template>
      <template #link="{ row }">
        <div v-if="row.diagnosisResult === DiagnosisResult.IpoeNg">
          <NuxtLink :href="DiagnosisResultsURL.ipoeNg.east" target="_blank" class="d-block">
            <span class="pr-2">{{ t('diagnosisResults.east') }}</span>
            <UpRightSquareIcon
              :width="IconSize.small"
              :height="IconSize.small"
              :style="{ fill: 'inherit', color: 'inherit' }"
            />
          </NuxtLink>
          <NuxtLink :href="DiagnosisResultsURL.ipoeNg.west" target="_blank" class="d-block">
            <span class="pr-2">{{ t('diagnosisResults.west') }}</span>
            <UpRightSquareIcon
              :width="IconSize.small"
              :height="IconSize.small"
              :style="{ fill: 'inherit', color: 'inherit' }"
            />
          </NuxtLink>
        </div>
        <NuxtLink v-if="!!row.link" :href="row.link" target="_blank" class="pt-1">
          <UpRightSquareIcon :style="{ fill: 'inherit', color: 'inherit' }" />
        </NuxtLink>
      </template>
    </SeparatedTable>
    <i18n-t keypath="diagnosisResults.explanation" tag="div" scope="global" class="mt-2">
      <template #explanationLink>
        <NuxtLink :href="CONTACT_LINK" target="_blank">
          {{ t('diagnosisResults.explanationLink') }}
          <UpRightSquareIcon
            :width="IconSize.small"
            :height="IconSize.small"
            :style="{ fill: 'inherit', color: 'inherit' }"
          />
        </NuxtLink>
      </template>
    </i18n-t>
  </div>
</template>
