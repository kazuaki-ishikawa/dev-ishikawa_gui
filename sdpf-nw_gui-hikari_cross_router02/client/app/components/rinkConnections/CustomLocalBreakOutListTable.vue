<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RinkConnectionCustomLocalBreakOutType } from '@/api/rinkConnections/types'

type PropType = {
  customLocalBreakOutList: RinkConnectionCustomLocalBreakOutType[]
}
defineProps<PropType>()

const { t } = useI18n()

const headers = [
  { key: 'name', text: t('rinkConnections.customLocalBreakOutName'), class: 'text-sm' },
  {
    key: 'nameAlias',
    text: t('rinkConnections.customLocalBreakOutNameAlias'),
    class: 'text-sm',
  },
  {
    key: 'dstPrefixList',
    text: t('rinkConnections.customLocalBreakOutDstPrefixList'),
    class: 'text-sm',
    width: 200,
  },
  { key: 'fqdnList', text: t('rinkConnections.customLocalBreakFqdnList'), class: 'text-sm', width: 200 },
]
</script>

<template>
  <InputGrid v-if="!!customLocalBreakOutList.length" :label="t('rinkConnections.customLocalBreakOutList')">
    <StripedTable
      :headers="headers"
      :items="customLocalBreakOutList"
      :key-items="['name', 'nameAlias']"
      data-cy="custom-local-break-out-list-table"
    >
      <template #dstPrefixList="{ row }">
        <div class="text-pre-wrap">
          {{ row.dstPrefixList?.map(({ prefix }: { prefix: string }) => prefix).join('\n') }}
        </div>
      </template>
      <template #fqdnList="{ row }">
        <div class="text-pre-wrap">
          {{ row.fqdnList?.map(({ fqdn }: { fqdn: string }) => fqdn).join('\n') }}
        </div>
      </template>
    </StripedTable>
  </InputGrid>
</template>
