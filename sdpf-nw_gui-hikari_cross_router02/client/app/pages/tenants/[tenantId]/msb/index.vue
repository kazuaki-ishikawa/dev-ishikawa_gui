<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { MSB_LINK } from '@/api/msb/constants'

const { t } = useI18n()
const route = useRoute()

const { msb, getMsb } = useGetMsb()
const { msbThreatNotice, getMsbThreatNotice } = useGetMsbThreatNotice()
const { duringReceptionHours } = useMsb()

const moveToCreate = async () => {
  await navigateTo({ path: `${route.path}/create` })
}

onBeforeMount(async () => {
  getMsbThreatNotice()
  await getMsb()
  if (msb.value?.resourceId) {
    await navigateTo({ path: `${route.path}/${msb.value.resourceId}`, replace: true })
  }
})
</script>

<template>
  <div>
    <MsbThreatNotice :threat-notice="msbThreatNotice" />

    <CardContainer>
      <i18n-t keypath="msb.message.serviceApplicationDescription" scope="global" tag="div" class="text-pre-wrap">
        <template #linkText>
          <NuxtLink :to="MSB_LINK.DETAIL" target="_blank">{{ t('common.here') }}</NuxtLink>
        </template>
      </i18n-t>
      <div
        v-if="!duringReceptionHours"
        class="mt-4 text-warning text-pre-wrap"
        data-cy="msb-index-outside-reception-hour"
      >
        {{ t('msb.message.outsideReceptionHour') }}
      </div>
      <div class="flex-flex-end-center pt-2">
        <CustomButton
          icon="right-arrow"
          :text="t('msb.newApplication')"
          :width="180"
          :disabled="!duringReceptionHours"
          data-cy="msb-index-new-application-button"
          @click="moveToCreate()"
        />
      </div>
    </CardContainer>
  </div>
</template>
