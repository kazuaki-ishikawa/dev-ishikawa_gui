<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { VPN_LINK } from '@/api/vpns/constants'
import { IconTypes } from '@/components/icons/constants'
import { UNSELECTED_VALUE } from '@/components/input/constants'
import type { InputFormPropType } from '@/components/input/types'

type PropType = InputFormPropType & {
  vpnId?: string
  terminalId?: string
  prefix?: number
}
const { vpnId, terminalId, prefix, ...inputFormOptions } = defineProps<PropType>()
const bindOptions = computed(() => ({ ...inputFormOptions, size: inputFormOptions.size ?? 'xSmall' }))
const model = defineModel<string>({ required: true })
type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const checked = ref(false)
const valid = ref(false)

const { loading } = useLoading()
const { vpnRoutes, getVpnRoutes } = useGetVpnRoutes()
const { VpnRouteResourceTypeTranslation } = useVpn()

const isVpnIdEmpty = computed(() => !vpnId || vpnId === UNSELECTED_VALUE)

const headers = [
  { text: t('vpn.resourceId'), key: 'resourceId' },
  { text: t('vpn.resourceType'), key: 'resourceType' },
  { text: t('vpn.duplicatedRoute'), key: 'duplicatedRoute' },
  { text: t('vpn.prefixLength'), key: 'prefixLength' },
]
const items = computed(() =>
  vpnRoutes.value.map(route => {
    const [duplicatedRoute, prefixLength] = route.route.split('/')
    return {
      resourceId: route.resourceId,
      resourceType: VpnRouteResourceTypeTranslation[route.resourceType],
      duplicatedRoute,
      prefixLength,
    }
  }),
)

const handleUpdateValid = (v: boolean) => {
  valid.value = v
  emits('valid', v)
}
const handleClick = async () => {
  if (!vpnId || vpnId === UNSELECTED_VALUE) {
    checked.value = false
    return
  }
  checked.value = true
  await getVpnRoutes(vpnId, { ipv4Prefix: model.value, excludeResourceId: terminalId })
}

// model.value か vpnId が 変わったら checked をfalseに戻す
watch(
  () => [model.value, vpnId],
  () => {
    checked.value = false
  },
)
</script>

<template>
  <div class="grid-cols ga-2">
    <InputPrefixedIpForm
      v-if="prefix"
      v-model="model"
      v-bind="bindOptions"
      :prefix="prefix"
      :disabled="loading || inputFormOptions.disabled"
      @valid="handleUpdateValid"
    />
    <InputForm
      v-else
      v-model="model"
      v-bind="bindOptions"
      :disabled="loading || inputFormOptions.disabled"
      @valid="handleUpdateValid"
    />
    <div v-if="!isVpnIdEmpty" class="align-self-start flex-flex-start-center">
      <CustomButton
        :text="t('vpn.checkVpnRoutes')"
        :icon="IconTypes.Search"
        :disabled="loading || inputFormOptions.disabled || !model || !valid"
        :width="180"
        @click="handleClick"
      />
      <HelpTooltip class="px-2 pt-1" size="smallMiddle" :content-width="400">
        <i18n-t keypath="vpn.help.checkVpnRoutes" tag="span" scope="global" class="text-sm">
          <template #here>
            <NuxtLink :to="VPN_LINK.VPN_ROUTES" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </HelpTooltip>
      <div v-if="checked && !loading" class="ml-4">
        <CustomTooltip v-if="items.length" :content-width="800">
          <template #activator>
            <v-chip color="warning" variant="flat" size="small">
              <SvgIcon :type="IconTypes.NG" class="mr-2" size="middle" />
              <span class="text-white">{{ t('vpn.duplicated') }}</span>
            </v-chip>
          </template>
          <template #default>
            <i18n-t keypath="vpn.help.duplicated" tag="span" scope="global" class="text-sm">
              <template #here>
                <NuxtLink :to="VPN_LINK.VPN_ROUTES" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
            <div class="max-h-180px overflow-y-auto">
              <StripedTable
                class="text-sm"
                :headers="headers"
                :items="items"
                :key-items="['resourceId', 'duplicatedRoute']"
              />
            </div>
          </template>
        </CustomTooltip>
        <v-chip v-else color="success" variant="outlined" size="small">
          <SvgIcon :type="IconTypes.OK" class="mr-2" size="middle" color="success" />
          {{ t('vpn.noDuplicated') }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid-cols {
  display: grid;
  grid-template-columns: auto 1fr;
}
.max-h-180px {
  max-height: 180px;
}
</style>
