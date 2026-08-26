<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TERMINAL_LINK, FirmwareVersionTypes } from '@/api/terminals/constants'
import type { TerminalResponse } from '@/api/terminals/types'

type PropType = {
  terminal: TerminalResponse | null
}
const props = defineProps<PropType>()

const { t } = useI18n()
const terminalDevices = computed(() => {
  const data = props.terminal?.terminalDevices?.map(device => {
    const firmwareVersionAttribute = device.firmwareVersion?.attribute ?? ''
    return {
      ...device,
      firmwareVersion: Object.values(FirmwareVersionTypes).includes(firmwareVersionAttribute)
        ? `${device.firmwareVersion?.displayName}（${t(`terminals.${firmwareVersionAttribute}`)}）`
        : firmwareVersionAttribute,
    }
  })
  return data ?? []
})
</script>

<template>
  <InnerCard :title="t('terminals.terminalDevices')">
    <SeparatedTable
      :headers="[
        { text: t('terminals.model'), key: 'model' },
        { text: t('terminals.serialNumber'), key: 'serialNumber' },
        { text: t('terminals.firmwareVersion'), key: 'firmwareVersion' },
      ]"
      :items="terminalDevices"
      data-cy="terminal-devices-table"
    >
      <template #header="{ data }">
        <div v-if="data.key === 'firmwareVersion'" class="h-100 flex-center-center px-2">
          <div>{{ data.text }}</div>
          <HelpTooltip size="smallMiddle" :content-width="580" class="text-left ml-2 mt-1">
            <i18n-t keypath="terminals.help.firmwareVersion" tag="div" scope="global">
              <template #here>
                <NuxtLink :to="TERMINAL_LINK.FIRMWARE_VERSION" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </HelpTooltip>
        </div>
        <div v-else class="h-100 flex-center-center">{{ data.text }}</div>
      </template>
    </SeparatedTable>
  </InnerCard>
</template>
