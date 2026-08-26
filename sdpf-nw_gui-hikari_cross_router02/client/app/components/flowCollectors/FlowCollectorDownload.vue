<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { TerminalFlowCollectorPlanType } from '@/api/types'
import { SecurityOptionTypes } from '@/api/constants'

const BROWSER_LIST = [
  {
    name: 'Microsoft Edge',
    url: 'https://support.microsoft.com/ja-jp/microsoft-edge/microsoft-edge-%E3%81%A7%E3%83%9D%E3%83%83%E3%83%97%E3%82%A2%E3%83%83%E3%83%97%E3%82%92%E3%83%96%E3%83%AD%E3%83%83%E3%82%AF%E3%81%99%E3%82%8B-1d8ba4f8-f385-9a0b-e944-aa47339b6bb5',
  },
  {
    name: 'Chrome',
    url: 'https://support.google.com/chrome/answer/95472?hl=ja&co=GENIE.Platform%3DDesktop#zippy=%2C%E3%82%B5%E3%82%A4%E3%83%88%E3%81%AE%E3%83%9D%E3%83%83%E3%83%97%E3%82%A2%E3%83%83%E3%83%97%E3%81%A8%E3%83%AA%E3%83%80%E3%82%A4%E3%83%AC%E3%82%AF%E3%83%88%E3%82%92%E8%A8%B1%E5%8F%AF%E3%81%99%E3%82%8B',
  },
  {
    name: 'Firefox',
    url: 'https://support.mozilla.org/ja/kb/pop-blocker-settings-exceptions-troubleshooting',
  },
] as const
const FlowCollectorMinDateMap: Record<TerminalFlowCollectorPlanType, string> = {
  [SecurityOptionTypes.Plan3Months]: dayjs().subtract(91, 'day').format('YYYY-MM-DD'),
  [SecurityOptionTypes.Plan6Months]: dayjs().subtract(183, 'day').format('YYYY-MM-DD'),
  [SecurityOptionTypes.Plan12Months]: dayjs().subtract(365, 'day').format('YYYY-MM-DD'),
  [SecurityOptionTypes.NoSubscription]: dayjs().subtract(-1, 'day').format('YYYY-MM-DD'),
}

type PropType = {
  flowCollectorPlan?: TerminalFlowCollectorPlanType
  disabled?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  flowCollectorPlan: SecurityOptionTypes.NoSubscription,
  disabled: false,
})

type Emits = {
  (e: 'submit'): void
}
const emits = defineEmits<Emits>()

const model = defineModel<{
  startTime: string
  endTime: string
}>({ required: true })

const startTimeInputValue = computed({
  get: () => {
    if (model.value.startTime) {
      const dt = dayjs(model.value.startTime)
      return {
        date: dt.format('YYYY-MM-DD'),
        hours: dt.format('HH'),
        minutes: dt.format('mm'),
      }
    }
    return { date: '', hours: '00', minutes: '00' }
  },
  set: data => {
    if (data.date) {
      model.value.startTime = dayjs(`${data.date} ${data.hours}:${data.minutes}`).format()
      if (!model.value.endTime) {
        model.value.endTime = dayjs(data.date).hour(0).minute(0).format()
      } else {
        const endDT = dayjs(model.value.endTime)
        model.value.endTime = dayjs(data.date).hour(endDT.hour()).minute(endDT.minute()).format()
      }
    } else {
      model.value.startTime = ''
    }
  },
})

const endTimeInputValue = computed({
  get: () => {
    if (model.value.endTime) {
      const dt = dayjs(model.value.endTime)
      return {
        date: dt.format('YYYY-MM-DD'),
        hours: dt.format('HH'),
        minutes: dt.format('mm'),
      }
    }
    return { date: '', hours: '00', minutes: '00' }
  },
  set: data => {
    const date = dayjs(model.value.startTime).format('YYYY-MM-DD')
    model.value.endTime = dayjs(`${date} ${data.hours}:${data.minutes}`).format()
  },
})

const { t } = useI18n()
const today = dayjs().format('YYYY-MM-DD')
const dateValid = ref(false)
const errorMessage = computed(() => {
  return dayjs(model.value.startTime).isAfter(model.value.endTime, 'minutes') ? t('period.invalid.startAfterEnd') : ''
})
const downloadFlowCollectorConfirmDialogOpen = ref(false)

const handleSubmit = () => {
  downloadFlowCollectorConfirmDialogOpen.value = false
  emits('submit')
}
</script>

<template>
  <div class="border-bottom-radius bg-white pa-8">
    <InnerCard :title="t('flowCollectors.downloadConditions')" class="w-780px">
      <div class="flex-center-start">
        <InputGrid :label="t('flowCollectors.downloadPeriod')" :label-width="100">
          <div class="flex-center-start ga-2 mt-5">
            <DateTimePicker
              v-model="startTimeInputValue"
              required
              :minutes-span="1"
              :min-date="FlowCollectorMinDateMap[props.flowCollectorPlan]"
              :max-date="today"
              :start-date="today"
              :size="['xSmall', 'xxSmall']"
              @valid="(valid: boolean) => (dateValid = valid)"
            />
            <span class="mt-2 ml-2 mr-2">~</span>
            <DateTimePicker
              v-model="endTimeInputValue"
              required
              :minutes-span="1"
              :show-date-picker="false"
              :size="['xSmall', 'xxSmall']"
            />
          </div>
          <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        </InputGrid>
      </div>
      <div class="flex-center-center py-3">
        <CustomButton
          icon="download"
          :text="t('flowCollectors.flowCollectorDownload')"
          :width="280"
          :disabled="disabled || !dateValid || !!errorMessage"
          @click="downloadFlowCollectorConfirmDialogOpen = true"
        />
      </div>
      <span>{{ t('flowCollectors.note.allowPopupAndRedirect') }}</span>
      <HelpTooltip class="d-inline-flex" :content-width="360" size="smallMiddle">
        <ul>
          <i18n-t
            v-for="{ name, url } in BROWSER_LIST"
            :key="name"
            keypath="flowCollectors.note.browser"
            tag="li"
            scope="global"
          >
            <template #here>
              <NuxtLink :to="url" target="_blank">{{ t('common.here') }}</NuxtLink>
            </template>
            <template #browser>{{ name }}</template>
          </i18n-t>
        </ul>
      </HelpTooltip>
      <div>{{ t('flowCollectors.note.multipleDaysNotSupported') }}</div>
    </InnerCard>
    <DialogBase
      :open="downloadFlowCollectorConfirmDialogOpen"
      :submit-label="t('common.download')"
      :submit-width="180"
      submit-icon="download"
      :cancel-label="t('common.cancel')"
      @submit="handleSubmit"
      @close="downloadFlowCollectorConfirmDialogOpen = false"
    >
      <div class="font-weight-bold text-center">{{ t('flowCollectors.downloadConfirmDialog.caution') }}</div>
      <div class="flex-center-center">
        <ol>
          <li class="content">
            <div class="font-weight-bold">{{ t('flowCollectors.downloadConfirmDialog.charges.title') }}</div>
            {{ t('flowCollectors.downloadConfirmDialog.charges.content') }}
          </li>
          <li class="content">
            <div class="font-weight-bold">{{ t('flowCollectors.downloadConfirmDialog.popupPermission.title') }}</div>
            {{ t('flowCollectors.downloadConfirmDialog.popupPermission.content') }}
          </li>
          <li class="content">
            <div class="font-weight-bold">{{ t('flowCollectors.downloadConfirmDialog.keepTabOpen.title') }}</div>
            {{ t('flowCollectors.downloadConfirmDialog.keepTabOpen.content') }}
          </li>
        </ol>
      </div>
    </DialogBase>
  </div>
</template>

<style lang="scss" scoped>
.border-bottom-radius {
  border-radius: 0 0 0.5rem 0.5rem;
}
.w-780px {
  width: 780px;
}
.error {
  padding-left: 0.7rem;
  font-size: 0.825rem;
  color: rgb(var(--v-theme-warning));
}
.content {
  padding-top: 6px;
  padding-bottom: 6px;

  &::marker {
    font-weight: bold;
  }
}
</style>
