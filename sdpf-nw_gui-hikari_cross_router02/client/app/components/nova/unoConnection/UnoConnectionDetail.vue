<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { UnoConnectionResponse } from '@/api/unoConnections/types'
import { RouteName } from '@/route/constants'

type PropType = {
  unoConnection: UnoConnectionResponse | null
}
defineProps<PropType>()

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const { t } = useI18n()
</script>

<template>
  <v-card-item class="py-0">
    <NovaDetailGrid :label="t('nova.unoConnections.unoConnectionId')">
      {{ unoConnection?.unoConnectionId }}
    </NovaDetailGrid>
    <NovaDetailGrid :label="t('nova.unoConnections.customerNote')">
      {{ unoConnection?.customerNote }}
    </NovaDetailGrid>
    <NovaDetailGrid :label="t('nova.details.resourceStatus')">
      {{ unoConnection?.resourceStatus }}
    </NovaDetailGrid>
  </v-card-item>

  <v-card-item class="py-0">
    <NovaCardSubTitle :title="t('nova.unoConnections.rinkSection')" />
    <NovaDetailGrid :label="t('nova.unoConnections.sourceVpnId')">
      <NuxtLink
        v-if="unoConnection?.vpnId"
        :to="{ name: RouteName.Vpn.Detail, params: { tenantId, id: unoConnection.vpnId } }"
      >
        {{ unoConnection.vpnId }}
      </NuxtLink>
    </NovaDetailGrid>
    <NovaDetailGrid :label="t('nova.unoConnections.rinkConnectivityAddress')">
      {{ unoConnection?.rinkConnectivityAddress }}
    </NovaDetailGrid>
  </v-card-item>

  <v-card-item class="py-0">
    <NovaCardSubTitle :title="t('nova.unoConnections.unoSection')" />
    <NovaDetailGrid :label="t('nova.unoConnections.unoContractNumber')">
      {{ unoConnection?.unoContractNumber }}
    </NovaDetailGrid>
    <NovaDetailGrid :label="t('nova.unoConnections.destinationVpnNumber')">
      {{ unoConnection?.unoVpnId }}
    </NovaDetailGrid>
  </v-card-item>

  <v-card-item class="pt-0">
    <NovaCardSubTitle :title="t('nova.unoConnections.unoApplicationDate')" />
    <NovaDetailGrid :label="t('nova.unoConnections.unoApplicationDate')">
      {{ formatDate(unoConnection?.unoApplicationDate) }}
    </NovaDetailGrid>
  </v-card-item>
</template>
