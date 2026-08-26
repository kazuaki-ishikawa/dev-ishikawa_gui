<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { RemovalCollectTypes } from '@/api/ipoes/constants'
import type { HikariCollaboDeleteRequest } from '@/api/ipoes/types'

type PropType = {
  request: HikariCollaboDeleteRequest
}
const props = defineProps<PropType>()
const { t } = useI18n()

const { getCollectTypeText, getLanCollectText, getKitSendInstallAddressSameText } = useIpoes()

const isCollectTypeKit = computed(() => props.request.collectType === RemovalCollectTypes.Kit)
const showKitSendAddress = computed(() => !props.request.kitSendInstallAddressSame)
</script>

<template>
  <div>
    <InnerCard :title="t('ipoes.removalInformation')">
      <DetailGrid>
        <div>{{ t('ipoes.removalCollectType') }}</div>
        <div>{{ getCollectTypeText(request.collectType) }}</div>
      </DetailGrid>
      <DetailGrid v-if="!isCollectTypeKit">
        <div>{{ t('ipoes.removalLanCollect') }}</div>
        <div>{{ getLanCollectText(request.lanCollect) }}</div>
      </DetailGrid>
    </InnerCard>
    <InnerCard v-if="isCollectTypeKit" :title="t('ipoes.kitSendAddress')">
      <DetailGrid>
        <div>{{ t('ipoes.kitSendInstallAddressSame') }}</div>
        <div>{{ getKitSendInstallAddressSameText(request.kitSendInstallAddressSame) }}</div>
      </DetailGrid>
      <template v-if="showKitSendAddress">
        <DetailGrid>
          <div>{{ t('ipoes.kitSendAddressCompanyName') }}</div>
          <div>{{ request?.kitSendAddress?.companyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.kitSendAddressPersonName') }}</div>
          <div>{{ request?.kitSendAddress?.personName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.addressCode') }}</div>
          <div>{{ request?.kitSendAddress?.addressCode }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('contractor.address') }}</div>
          <div>{{ request?.kitSendAddress?.address }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('contractor.houseNumber') }}</div>
          <div>{{ request?.kitSendAddress?.houseNumber }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('contractor.buildingName') }}</div>
          <div>{{ request?.kitSendAddress?.buildingName }}</div>
        </DetailGrid>
      </template>
    </InnerCard>
  </div>
</template>
