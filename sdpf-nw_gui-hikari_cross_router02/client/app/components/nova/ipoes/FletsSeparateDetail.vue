<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IpoeTypes, HikariPlanTypes } from '@/api/ipoes/constants'
import type { FletsSeparateResponse } from '@/api/ipoes/types'
import { RouteName } from '@/route/constants'

type PropType = {
  fletsSeparate: FletsSeparateResponse | null
}
const props = defineProps<PropType>()

const route = useRoute()
const { t } = useI18n()
const { orderStatusTypeTranslation } = useOrders()
const tenantId = computed(() => route.params.tenantId as string)

const hikariPlanText = computed(() =>
  props.fletsSeparate?.hikariPlan === HikariPlanTypes.Next
    ? t('nova.ipoes.hikariPlanNext')
    : props.fletsSeparate?.hikariPlan === HikariPlanTypes.Cross
      ? t('nova.ipoes.hikariPlanCross')
      : '',
)
const ipoeTypeText = computed(() => {
  return props.fletsSeparate?.ipoeType === IpoeTypes.Wide ? t('nova.ipoes.wide') : t('nova.ipoes.standard')
})
const fletsOpenText = computed(() =>
  props.fletsSeparate?.fletsOpen ? t('nova.ipoes.opened') : t('nova.ipoes.unopened'),
)
</script>

<template>
  <!-- 基本情報 -->
  <v-card class="my-5" :title="t('nova.details.basicInformation')">
    <v-card-item>
      <NovaDetailGrid :label="t('nova.ipoes.accessCircuitId')">
        {{ fletsSeparate?.ipoeId }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.accessCircuitName')">
        {{ fletsSeparate?.customerNote }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.contractType')">
        {{ t('nova.ipoes.fletsSeparateDetail') }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.hikariPlan')">
        {{ hikariPlanText }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.ipv4Address')">
        {{ fletsSeparate?.ipv4Address }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.fletsId')">
        {{ fletsSeparate?.fletsId }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.terminals.terminalId')">
        <NuxtLink
          v-if="fletsSeparate?.terminalId"
          :to="{ name: RouteName.Terminal.Detail, params: { tenantId, id: fletsSeparate.terminalId } }"
        >
          {{ fletsSeparate.terminalId }}
        </NuxtLink>
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.plan')">
        {{ ipoeTypeText }}
      </NovaDetailGrid>
      <NovaDetailGrid
        v-if="fletsSeparate?.ipoeType === IpoeTypes.Wide"
        :label="t('nova.ipoes.widePlusForWebConference')"
      >
        {{ fletsSeparate.appControl ? t('nova.ipoes.enabled') : t('nova.ipoes.disabled') }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.resourcePath')">
        {{ fletsSeparate?.ref }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.details.resourceStatus')">
        {{ fletsSeparate?.resourceStatus }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.details.orderId')">
        <NuxtLink
          v-if="fletsSeparate?.orderId"
          :to="{ name: RouteName.Order.Detail, params: { tenantId, id: fletsSeparate.orderId } }"
        >
          {{ fletsSeparate.orderId }}
        </NuxtLink>
      </NovaDetailGrid>
      <NovaDetailGrid v-if="fletsSeparate?.orderStatus" :label="t('nova.details.orderStatus')">
        {{ orderStatusTypeTranslation[fletsSeparate.orderStatus] }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.details.creationTime')">
        {{ formatDateTime(fletsSeparate?.creationTime) }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.details.updateTime')">
        {{ formatDateTime(fletsSeparate?.updateTime) }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.details.serviceStartTime')">
        {{ formatDateTime(fletsSeparate?.serviceStartTime) }}
      </NovaDetailGrid>
    </v-card-item>
  </v-card>

  <!-- 回線情報 -->
  <v-card class="my-5" :title="t('nova.ipoes.circuitInformation')">
    <v-card-item class="pt-0">
      <!-- フレッツ回線個別契約型 -->
      <div>
        <NovaCardSubTitle class="mt-0" :title="t('nova.ipoes.fletsSeparateDetail')" />
        <NovaDetailGrid :label="t('nova.ipoes.accessKey')">
          {{ fletsSeparate?.accessKey }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.ipoeApplicationDate')">
          {{ formatDate(fletsSeparate?.ipoeApplicationDate) }}
        </NovaDetailGrid>
      </div>

      <!-- フレッツ情報 -->
      <NovaCardSubTitle :title="t('nova.ipoes.fletsInformation')" />
      <NovaDetailGrid :label="t('nova.ipoes.fletsOpen')">
        {{ fletsOpenText }}
      </NovaDetailGrid>
      <NovaDetailGrid v-if="!fletsSeparate?.fletsOpen" :label="t('nova.ipoes.fletsOpenDate')">
        {{ formatDate(fletsSeparate?.fletsOpenDate) }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.contractorName')">
        {{ fletsSeparate?.originContractor?.name }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.contractorNameKana')">
        {{ fletsSeparate?.originContractor?.nameKana }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.contractorPhoneNumber')">
        {{ fletsSeparate?.originContractor?.phoneNumber }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.contractorPostalCode')">
        {{ fletsSeparate?.originContractor?.postalCode }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.contractorMailAddress')">
        {{ fletsSeparate?.originContractor?.mailAddress }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.installationPlacePhoneNumber')">
        {{ fletsSeparate?.installationPlace?.phoneNumber }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.installationPlacePostalCode')">
        {{ fletsSeparate?.installationPlace?.postalCode }}
      </NovaDetailGrid>
    </v-card-item>
  </v-card>

  <!-- 申込者情報 -->
  <v-card class="my-5" :title="t('nova.ipoes.applicant')">
    <v-card-item>
      <NovaDetailGrid :label="t('nova.ipoes.applicantName')">
        {{ fletsSeparate?.applicant?.name }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.applicantNameKana')">
        {{ fletsSeparate?.applicant?.nameKana }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.applicantPhoneNumber')">
        {{ fletsSeparate?.applicant?.phoneNumber }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.applicantMailAddress')">
        {{ fletsSeparate?.applicant?.mailAddress }}
      </NovaDetailGrid>
    </v-card-item>
  </v-card>
</template>
