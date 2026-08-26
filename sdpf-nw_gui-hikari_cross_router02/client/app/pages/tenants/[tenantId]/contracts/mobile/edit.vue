<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { getMobile, mobile } = useGetMobile()
const { inputMobile, updateMobile } = useUpdateMobile()

const handleSave = async (changed: boolean) => {
  if (changed) {
    await updateMobile(inputMobile.value)
  }
  await navigateTo({ path: `/tenants/${tenantId.value}/contracts/mobile/mobile-terms-of-service` }, { replace: true })
}
onBeforeMount(getMobile)
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center mb-3">
      <SvgIcon class="pt-1" :type="IconTypes.Contractor" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ t('sideBar.mobile') }}</div>
    </div>
    <MobileInformationEdit
      v-model="inputMobile"
      :mobile="mobile"
      :tenant-id="tenantId"
      show-cancel-button
      @cancel="router.back()"
      @submit="handleSave"
    />
  </CardContainer>
</template>
