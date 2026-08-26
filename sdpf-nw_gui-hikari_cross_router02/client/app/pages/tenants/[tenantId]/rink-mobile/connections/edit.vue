<script setup lang="ts">
import { cloneDeep, isEqual, omit } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import type { BreakOutType } from '@/api/types'
import {
  RinkConnectionTypes,
  RinkConnectionEditTypes,
  ScheduleNetworkOrderTypes,
  initialRinkConnectionInputData,
  initialRinkConnectionValid,
  MAX_BREAKOUT_COUNT,
} from '@/api/rinkConnections/constants'
import type { RinkConnectionEditType } from '@/api/rinkConnections/types'
import { RinkLineApplicationTypes } from '@/api/rinkLines/constants'

const { t } = useI18n()
const router = useRouter()
const rules = useRules()
const { loading } = useLoading()

const rinkMobileId = ref('')
const editMenu = ref<RinkConnectionEditType | ''>('')

const inputData = ref({ ...initialRinkConnectionInputData })
const inputValid = ref({ ...initialRinkConnectionValid })
const applicationType = ref<string>(RinkLineApplicationTypes.Form)

const isConfirmation = ref(false)
const switchConfirm = () => {
  isConfirmation.value = !isConfirmation.value
}
watch(isConfirmation, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

const { rinkMobileIdOptions, getRinkConnectionList } = useGetRinkConnectionList()
const { unterminatedVpnListOptions, getSummaryVpnList } = useGetSummaryVpnList()
const { scheduleNetworkList, getScheduleNetworkList } = useGetScheduleNetworkList()
const { lineActPrefixOptions, lineSbyPrefixOptions, getAvailableLinePrefix } = useGetAvailableLinePrefix()
const { rinkConnection, getRinkConnection, rinkConnectionEditMenuOptions } = useGetRinkConnection()
const { updateRinkConnection } = useUpdateRinkConnection()
const { customLocalBreakOutList, getCustomLocalBreakoutList } = useGetCustomLocalBreakoutList()
const {
  duringReceptionHours,
  breakOutOptions,
  useableOptions,
  duplicateDnsIpAddressRules,
  getRinkConnectionPutRequest,
} = useRinkConnections()

const originalData = computed(() => {
  const hasCustomLocalBreakOut = !!rinkConnection.value?.customLocalBreakOutList?.length
  return {
    connectionType: rinkConnection.value?.connectionType ?? '',
    vpnId: rinkConnection.value?.vpnId ?? '',
    poiRedundancy: !!rinkConnection.value?.poiRedundancy,
    vpnConnectionPrefix: rinkConnection.value?.vpnConnectionPrefix ?? [],
    lineActPrefix: rinkConnection.value?.lineActPrefix?.join('\n') ?? '',
    lineSbyPrefix: rinkConnection.value?.lineSbyPrefix?.join('\n') ?? '',
    useDnsServer: !!rinkConnection.value?.dnsIpAddressPrimary,
    dnsIpAddressPrimary: rinkConnection.value?.dnsIpAddressPrimary ?? '',
    dnsIpAddressSecondary: rinkConnection.value?.dnsIpAddressSecondary ?? '',
    vpnNetworkPrefix: rinkConnection.value?.vpnNetworkPrefix ?? '',
    customLocalBreakOutList: hasCustomLocalBreakOut
      ? customLocalBreakOutList.value.map(item => ({
          id: createRandomString({ prefix: 'custom-local-break-out-list-' }),
          name: item.name,
          nameAlias: item.nameAlias,
          dstPrefixList: item.dstPrefixList?.map(({ prefix }) => prefix) ?? [],
          fqdnList: item.fqdnList?.map(({ fqdn }) => fqdn) ?? [],
        }))
      : [],
    breakOutList: rinkConnection.value?.systemLocalBreakOutList?.map(({ name }) => name) ?? [],
    timeFrame: '',
  }
})

const changed = computed(() => {
  switch (editMenu.value) {
    case RinkConnectionEditTypes.ConnectionType:
      return !isEqual(omit(inputData.value, ['timeFrame']), omit(originalData.value, ['timeFrame']))
    case RinkConnectionEditTypes.VpnConnectionPrefix:
      return !isEqual(inputData.value.vpnConnectionPrefix, originalData.value.vpnConnectionPrefix)
    case RinkConnectionEditTypes.LocalBreakOut:
      return (
        !isEqual(inputData.value.breakOutList, originalData.value.breakOutList) ||
        !isEqual(inputData.value.customLocalBreakOutList, originalData.value.customLocalBreakOutList)
      )
    default:
      return (
        inputData.value.dnsIpAddressPrimary !== originalData.value.dnsIpAddressPrimary ||
        inputData.value.dnsIpAddressSecondary !== originalData.value.dnsIpAddressSecondary
      )
  }
})
const { navigationGuard } = useNavigationGuard()
watch(changed, () => navigationGuard(changed.value))

const submitDisabled = computed(() => {
  return (
    !duringReceptionHours.value ||
    !changed.value ||
    loading.value ||
    applicationType.value !== RinkLineApplicationTypes.Form ||
    Object.values(inputValid.value).some(valid => !valid)
  )
})
const submit = computed(() => {
  return {
    text: isConfirmation.value ? t('common.save') : t('common.confirm'),
  }
})

const nameAliases = computed(() =>
  inputData.value.customLocalBreakOutList.map(customLocalBreakOut => customLocalBreakOut.nameAlias).filter(Boolean),
)
const requiredBreakOutList = computed(() => nameAliases.value.length === 0)

const handleDownloadLocalPdfOrExcel = () => {
  // TODO: ダウンロード処理実装
  console.log('TODO: ダウンロード処理実装')
}
const handleUploadApplicationCsv = (file: File) => {
  // TODO: アップロード処理実装
  console.log('TODO: アップロード処理実装', file)
}

const setRinkConnectionInputData = () => {
  inputData.value = cloneDeep(originalData.value)
  inputValid.value = Object.keys(inputValid.value).reduce(
    (acc, key) => {
      if (editMenu.value === RinkConnectionEditTypes.ConnectionType) {
        return { ...acc, [key]: !['connectionType', 'timeFrame'].includes(key) }
      }
      return { ...acc, [key]: key !== 'timeFrame' }
    },
    { ...initialRinkConnectionValid },
  )
}

const handleEditMenuChange = () => {
  // 変更メニューが切り替わったタイミングでデータを初期化する
  setRinkConnectionInputData()
  applicationType.value = RinkLineApplicationTypes.Form
}
const handleApplicationTypeUpdate = (value: string) => {
  // お申し込み方法が切り替わったタイミングでデータを初期化する
  applicationType.value = value
  setRinkConnectionInputData()
}
const handleUpdateUseDnsServer = (value: boolean) => {
  inputValid.value = {
    ...inputValid.value,
    dnsIpAddressPrimary: true,
    dnsIpAddressSecondary: true,
  }
  inputData.value = {
    ...inputData.value,
    dnsIpAddressPrimary: value ? initialRinkConnectionInputData.dnsIpAddressPrimary : '',
    dnsIpAddressSecondary: value ? initialRinkConnectionInputData.dnsIpAddressSecondary : '',
  }
}

const handleSubmit = async () => {
  if (isConfirmation.value && !!editMenu.value) {
    const request = getRinkConnectionPutRequest({
      originalData: originalData.value,
      inputData: inputData.value,
      editMenu: editMenu.value,
    })
    await updateRinkConnection(rinkMobileId.value, editMenu.value, request)
    navigationGuard(false)
    router.back()
  } else {
    switchConfirm()
  }
}

const handleUpdateBreakOutList = (value: BreakOutType[]) => {
  inputData.value.breakOutList = value
  // 未入力（nameAliasが空）のcustomLocalBreakOutListを削除
  inputData.value.customLocalBreakOutList = inputData.value.customLocalBreakOutList.filter(item => !!item.nameAlias)
}

watch(rinkMobileId, async () => {
  editMenu.value = ''
  if (rinkMobileId.value) {
    await getRinkConnection(rinkMobileId.value)
    if (rinkConnection.value?.customLocalBreakOutList?.length) {
      await getCustomLocalBreakoutList(rinkMobileId.value)
    }
    setRinkConnectionInputData()
  }
})
onBeforeMount(() => {
  getRinkConnectionList()
  getSummaryVpnList()
  getAvailableLinePrefix()
  getScheduleNetworkList(ScheduleNetworkOrderTypes.Other)
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-2">{{ t('confirm.update') }}</div>
    <div
      v-if="!duringReceptionHours"
      class="mb-4 text-warning text-pre-wrap"
      data-cy="rink-mobile-connections-edit-outside-reception-hour"
    >
      {{ t('rinkConnections.message.outsideReceptionHour') }}
    </div>

    <InnerCard>
      <InputGrid required :label="t('rinkConnections.rinkMobileId')" :label-width="180">
        <SelectForm
          v-model="rinkMobileId"
          required
          :options="rinkMobileIdOptions"
          size="middle"
          placeholder="Z000000001"
          :disabled="loading || isConfirmation"
          data-cy="rink-mobile-connections-edit-rink-mobile-id"
        />
      </InputGrid>
    </InnerCard>

    <template v-if="rinkMobileId && rinkConnection">
      <InnerCard :title="t('rinkConnections.editMenu.title')">
        <RadioForm
          v-model="editMenu"
          :options="rinkConnectionEditMenuOptions"
          :disabled="isConfirmation"
          class="pt-3"
          data-cy="rink-mobile-connections-edit-edit-menu-selector"
          @update:model-value="handleEditMenuChange"
        />
      </InnerCard>

      <EditApplicationType
        v-if="editMenu === RinkConnectionEditTypes.LocalBreakOut"
        :model-value="applicationType"
        :disabled="isConfirmation || loading"
        @download:excel="handleDownloadLocalPdfOrExcel"
        @upload:csv="handleUploadApplicationCsv"
        @update:model-value="handleApplicationTypeUpdate"
      />

      <EditRinkConnection
        v-if="editMenu === RinkConnectionEditTypes.ConnectionType"
        v-model="inputData"
        v-model:valid="inputValid"
        :disabled-connection-type="[rinkConnection?.connectionType!]"
        :disabled="isConfirmation"
        :vpn-options="unterminatedVpnListOptions"
        :line-act-prefix-options="lineActPrefixOptions"
        :line-sby-prefix-options="lineSbyPrefixOptions"
        :schedule-network-list="scheduleNetworkList"
        :original-rink-connection="rinkConnection"
      />

      <RinkConnectionDetail
        v-else-if="rinkConnection"
        class="mt-3"
        :rink-connection="rinkConnection"
        :custom-local-break-out-list="customLocalBreakOutList"
      >
        <!-- VPN接続通信アドレス設定 -->
        <template v-if="editMenu === RinkConnectionEditTypes.VpnConnectionPrefix" #vpnConnectionPrefix>
          <InputGrid :label="t('rinkConnections.vpnConnectionPrefix')">
            <TextareaForm
              :model-value="inputData.vpnConnectionPrefix.join('\n')"
              :placeholder="t('placeholder.globalIpAddressList')"
              :rules="[rules.prefixList, rules.networkAddressList, rules.globalIpAddressList]"
              :disabled="isConfirmation"
              data-cy="rink-mobile-connections-edit-vpn-connection-prefix"
              @update:model-value="(value: string) => (inputData.vpnConnectionPrefix = value.split('\n'))"
              @valid="(valid: boolean) => (inputValid.vpnConnectionPrefix = valid)"
            />
          </InputGrid>
        </template>

        <!-- ブレイクアウト設定 -->
        <template
          v-if="editMenu === RinkConnectionEditTypes.LocalBreakOut && applicationType === RinkLineApplicationTypes.Form"
          #breakOut
        >
          <InputGrid :label="t('rinkConnections.breakOut')" :required="requiredBreakOutList">
            <CheckboxForm
              :value="inputData.breakOutList"
              :options="breakOutOptions"
              :max-items="MAX_BREAKOUT_COUNT - nameAliases.length"
              :required="requiredBreakOutList"
              :disabled="isConfirmation"
              col-min-width="220px"
              data-cy="rink-mobile-connections-edit-break-out-list"
              @update:value="handleUpdateBreakOutList"
              @valid="(valid: boolean) => (inputValid.breakOutList = valid)"
            />
          </InputGrid>
          <EditCustomLocalBreakOutList
            v-model="inputData.customLocalBreakOutList"
            :max-items="MAX_BREAKOUT_COUNT - inputData.breakOutList.length"
            :required="!inputData.breakOutList.length"
            :disabled="isConfirmation"
            data-cy="rink-mobile-connections-edit-local-break-out-list"
            @valid="(valid: boolean) => (inputValid.customLocalBreakOutList = valid)"
          />
        </template>

        <!-- DNSサーバIPアドレス -->
        <template v-if="editMenu === RinkConnectionEditTypes.DnsServer" #dnsServer>
          <InputGrid
            v-if="originalData.connectionType === RinkConnectionTypes.VpnOnly"
            :label="t('rinkConnections.editMenu.dnsServer')"
            required
          >
            <RadioForm
              v-model="inputData.useDnsServer"
              :options="useableOptions"
              :disabled="isConfirmation"
              data-cy="rink-mobile-connections-edit-use-dns-server"
              @update:model-value="handleUpdateUseDnsServer"
              @valid="valid => (inputValid.useDnsServer = valid)"
            />
          </InputGrid>
          <template v-if="inputData.useDnsServer">
            <InputGrid :label="t('rinkConnections.dnsIpAddressPrimary')" required>
              <InputPrefixedIpForm
                v-model="inputData.dnsIpAddressPrimary"
                :prefix="32"
                :rules="[rules.ipAddress, duplicateDnsIpAddressRules(inputData.dnsIpAddressSecondary)]"
                :disabled="isConfirmation"
                required
                maxlength="15"
                placeholder="202.234.232.6"
                data-cy="rink-mobile-connections-edit-dns-ip-address-primary"
                @valid="(valid: boolean) => (inputValid.dnsIpAddressPrimary = valid)"
              />
            </InputGrid>
            <InputGrid :label="t('rinkConnections.dnsIpAddressSecondary')" required>
              <InputPrefixedIpForm
                v-model="inputData.dnsIpAddressSecondary"
                :prefix="32"
                :rules="[rules.ipAddress, duplicateDnsIpAddressRules(inputData.dnsIpAddressPrimary)]"
                :disabled="isConfirmation"
                required
                maxlength="15"
                placeholder="221.113.139.250"
                data-cy="rink-mobile-connections-edit-dns-ip-address-secondary"
                @valid="(valid: boolean) => (inputValid.dnsIpAddressSecondary = valid)"
              />
            </InputGrid>
          </template>
        </template>
      </RinkConnectionDetail>

      <!-- 構成パターン変更以外の timeFrame 入力 -->
      <InnerCard
        v-if="editMenu !== RinkConnectionEditTypes.ConnectionType"
        :title="t('rinkConnections.updateRequestedDate')"
      >
        <InputGrid :label="t('rinkConnections.updateRequestedDate')" required>
          <EditScheduleNetworkDate
            v-model="inputData.timeFrame"
            :schedule-network-list="scheduleNetworkList"
            :disabled="isConfirmation"
            required
            data-cy="rink-mobile-connections-edit-time-frame"
            @valid="(valid: boolean) => (inputValid.timeFrame = valid)"
          />
        </InputGrid>
      </InnerCard>
    </template>

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="rink-mobile-connections-edit-cancel-button"
        @cancel="isConfirmation ? switchConfirm() : router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :text="submit.text"
        :width="180"
        :disabled="submitDisabled"
        data-cy="rink-mobile-connections-edit-submit-button"
        @click="handleSubmit"
      />
    </div>
  </CardContainer>
</template>
