<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const resourceId = computed(() => route.params.id as string)

const { msbLicenses, getMsbLicenses } = useGetMsbLicenses()
const { msbThreatNotice, getMsbThreatNotice } = useGetMsbThreatNotice()
const { duringReceptionHours } = useMsb()

const moveToEdit = async () => {
  await navigateTo({ path: `${route.path}/edit` })
}

const moveToRemove = async () => {
  await navigateTo({ path: `${route.path}/remove` })
}

onBeforeMount(async () => {
  getMsbThreatNotice()
  try {
    await getMsbLicenses(resourceId.value)
  } catch {
    await navigateTo({ path: `/tenants/${tenantId.value}/msb` }, { replace: true })
  }
})
</script>

<template>
  <div>
    <MsbThreatNotice :threat-notice="msbThreatNotice" show-management-console-button />

    <CardContainer>
      <div
        v-if="!duringReceptionHours"
        class="mb-4 text-warning text-pre-wrap"
        data-cy="msb-id-index-outside-reception-hour"
      >
        {{ t('msb.message.outsideReceptionHour') }}
      </div>
      <MsbDetail v-if="msbLicenses" :msb="msbLicenses" />
      <div class="flex-flex-end-center pt-2">
        <CustomButton
          color="warning"
          icon="right-arrow"
          :text="t('common.delete')"
          :width="180"
          :disabled="!duringReceptionHours"
          data-cy="msb-id-index-delete-button"
          @click="moveToRemove()"
        />
        <CustomButton
          class="ml-6"
          icon="right-arrow"
          :text="t('common.edit')"
          :width="180"
          :disabled="!duringReceptionHours"
          data-cy="msb-id-index-edit-button"
          @click="moveToEdit()"
        />
      </div>
    </CardContainer>
  </div>
</template>
