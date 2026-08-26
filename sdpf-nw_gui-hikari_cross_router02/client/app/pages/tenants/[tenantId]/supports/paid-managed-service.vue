<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const { paidManagedServiceList, getPaidManagedService } = useGetPaidManagedService()
onBeforeMount(getPaidManagedService)
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center mb-3">
      <SvgIcon class="pt-1" :type="IconTypes.Support" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ `${t('sideBar.paidManagedService')}${t('common.list')}` }}</div>
    </div>
    <InnerCard
      v-for="(data, index) in paidManagedServiceList"
      :key="data.pssReceiptNumber"
      :title="`${t('paidManagedService.service')}${index + 1}`"
    >
      <DetailGrid>
        <div>{{ t('paidManagedService.pssReceiptNumber') }}</div>
        <div>{{ data.pssReceiptNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('paidManagedService.menuName') }}</div>
        <div>{{ data.menuName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('paidManagedService.teamInCharge') }}</div>
        <div>{{ data.teamInCharge }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('paidManagedService.personName') }}</div>
        <div>{{ data.personName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('paidManagedService.phoneNumber') }}</div>
        <div>{{ data.phoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('paidManagedService.period') }}</div>
        <div>{{ formatDate(data.endDate) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('paidManagedService.remarks') }}</div>
        <div class="remarks text-pre-wrap">
          {{ data.remarks }}
        </div>
      </DetailGrid>
    </InnerCard>
  </CardContainer>
</template>

<style lang="scss" scoped>
.remarks {
  word-break: break-all;
  overflow-wrap: break-word;
}
</style>
