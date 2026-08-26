<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GUARANTEE_LINK, ConnectionTypes } from '@/api/guarantees/constants'
import type { ConnectionType } from '@/api/guarantees/types'

type PropType = {
  connectionType: ConnectionType
}
const props = defineProps<PropType>()
const { t } = useI18n()
const type = computed(() => t(`guarantees.${props.connectionType}`))
</script>

<template>
  <span>{{ t('guarantees.help.rateLimit.base', { type }) }}</span>
  <i18n-t
    v-if="connectionType === ConnectionTypes.Internet"
    keypath="guarantees.help.rateLimit.internet.text"
    tag="span"
    scope="global"
  >
    <template #list>
      <ul>
        <i18n-t keypath="guarantees.help.rateLimit.internet.list-1" tag="li" scope="global">
          <template #here>
            <NuxtLink :to="GUARANTEE_LINK.CHANGE_LBO_ID10" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
        <i18n-t keypath="guarantees.help.rateLimit.internet.list-2" tag="li" scope="global">
          <template #here>
            <NuxtLink :to="GUARANTEE_LINK.TERMINAL_ID5" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
        <i18n-t keypath="guarantees.help.rateLimit.internet.list-3" tag="li" scope="global">
          <template #here>
            <NuxtLink :to="GUARANTEE_LINK.TERMINAL_ID5" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </ul>
    </template>
  </i18n-t>
  <i18n-t
    v-if="connectionType === ConnectionTypes.Vpn"
    keypath="guarantees.help.rateLimit.vpn"
    tag="span"
    scope="global"
  >
    <template #here>
      <NuxtLink :to="GUARANTEE_LINK.CANCEL_VPN" target="_blank">
        {{ t('common.here') }}
      </NuxtLink>
    </template>
  </i18n-t>
  <div class="font-weight-bold">{{ t('guarantees.help.rateLimit.caution.title') }}</div>
  <div class="text-decoration-underline">
    {{ t('guarantees.help.rateLimit.caution.underline', { type }) }}
  </div>
</template>
