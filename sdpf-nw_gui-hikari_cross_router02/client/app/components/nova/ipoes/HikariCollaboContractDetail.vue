<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FletsOrderTypes, IpoeTypes } from '@/api/ipoes/constants'
import type { HikariCollaboResponse } from '@/api/ipoes/types'
import { RouteName } from '@/route/constants'

type PropType = {
  hikariCollabo: HikariCollaboResponse
}
const props = defineProps<PropType>()

const route = useRoute()
const { t } = useI18n()
const { orderStatusTypeTranslation } = useOrders()
const tenantId = computed(() => route.params.tenantId as string)
const contractTypeText = computed(() =>
  props.hikariCollabo.fletsOrderType === FletsOrderTypes.Diversion
    ? t('nova.ipoes.diversion')
    : t('nova.ipoes.hikariCollabo'),
)
const fletsTypeText = computed(() => t(`nova.ipoes.${props.hikariCollabo.fletsType}`))
const ipoeTypeText = computed(() =>
  props.hikariCollabo.ipoeType === IpoeTypes.Wide ? t('nova.ipoes.wide') : t('nova.ipoes.standard'),
)
const existText = (value?: boolean) =>
  value === undefined ? '' : value ? t('nova.common.exist') : t('nova.common.nonExist')
</script>

<template>
  <v-card class="my-5" :title="t('nova.details.basicInformation')">
    <v-card-item>
      <NovaDetailGrid :label="t('nova.ipoes.accessCircuitId')">{{ hikariCollabo.ipoeId }}</NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.accessCircuitName')">{{ hikariCollabo.customerNote }}</NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.contractType')">{{ contractTypeText }}</NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.ipv4Address')">{{ hikariCollabo.ipv4Address }}</NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.fletsId')">{{ hikariCollabo.fletsId }}</NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.terminals.terminalId')">
        <NuxtLink
          v-if="hikariCollabo.terminalId"
          :to="{ name: RouteName.Terminal.Detail, params: { tenantId, id: hikariCollabo.terminalId } }"
        >
          {{ hikariCollabo.terminalId }}
        </NuxtLink>
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.plan')">{{ ipoeTypeText }}</NovaDetailGrid>
      <NovaDetailGrid
        v-if="hikariCollabo.ipoeType === IpoeTypes.Wide"
        :label="t('nova.ipoes.widePlusForWebConference')"
      >
        {{ hikariCollabo.appControl ? t('nova.ipoes.enabled') : t('nova.ipoes.disabled') }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.ipoes.resourcePath')">{{ hikariCollabo.ref }}</NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.details.resourceStatus')">{{ hikariCollabo.resourceStatus }}</NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.details.orderId')">
        <NuxtLink
          v-if="hikariCollabo.orderId"
          :to="{ name: RouteName.Order.Detail, params: { tenantId, id: hikariCollabo.orderId } }"
        >
          {{ hikariCollabo.orderId }}
        </NuxtLink>
      </NovaDetailGrid>
      <NovaDetailGrid v-if="hikariCollabo.orderStatus" :label="t('nova.details.orderStatus')">
        {{ orderStatusTypeTranslation[hikariCollabo.orderStatus] }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.details.creationTime')">
        {{ formatDateTime(hikariCollabo.creationTime) }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.details.updateTime')">
        {{ formatDateTime(hikariCollabo.updateTime) }}
      </NovaDetailGrid>
      <NovaDetailGrid :label="t('nova.details.serviceStartTime')">
        {{ formatDateTime(hikariCollabo.serviceStartTime) }}
      </NovaDetailGrid>
    </v-card-item>
  </v-card>

  <v-card class="my-5" :title="t('nova.ipoes.circuitInformation')">
    <v-card-item>
      <NovaCardSubTitle class="mt-0" :title="contractTypeText" />
      <div>
        <NovaDetailGrid :label="t('nova.ipoes.installationPlaceCode')">
          {{ hikariCollabo.installationPlaceCode }}
        </NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.postalCode')">{{ hikariCollabo.postalCode }}</NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.address')">{{ hikariCollabo.address }}</NovaDetailGrid>
        <NovaDetailGrid :label="t('nova.ipoes.onSiteRepairOption')">
          {{ existText(hikariCollabo.onSiteRepairOption) }}
        </NovaDetailGrid>
        <NovaDetailGrid v-if="hikariCollabo.changeEffectiveDate" :label="t('nova.ipoes.changeEffectiveDate')">
          {{ formatDate(hikariCollabo.changeEffectiveDate) }}
        </NovaDetailGrid>
      </div>

      <NovaCardSubTitle :title="t('nova.ipoes.fletsInformation')" />
      <NovaDetailGrid :label="t('nova.ipoes.fletsType')">{{ fletsTypeText }}</NovaDetailGrid>
    </v-card-item>
  </v-card>
</template>
