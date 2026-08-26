<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { GRANT_ACCESS_LINK } from '@/api/phoneTicketingSupport/constants'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const { loading } = useLoading()
const { getPhoneTicketingSupport, phoneTicketingSupport, editable, status } = useGetPhoneTicketingSupport()

const moveToCreate = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/supports/phone-ticketing-support/create` })
}
const moveToEdit = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/supports/phone-ticketing-support/edit` })
}
const moveToDelete = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/supports/phone-ticketing-support/remove` })
}

onBeforeMount(getPhoneTicketingSupport)
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center mb-3">
      <SvgIcon class="pt-1" :type="IconTypes.Support" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ t('sideBar.phoneTicketingSupport') }}</div>
    </div>
    <InnerCard>
      <PhoneTicketingSupportDetail
        :phone-ticketing-support="phoneTicketingSupport"
        :status="status"
        :tenant-id="tenantId"
      />
    </InnerCard>

    <div v-if="status === PhoneTicketingSupportStatus.Deleted" class="flex-flex-end-center pt-2">
      <CustomButton
        class="ml-6"
        color="primary"
        icon="right-arrow"
        :text="t('common.createNew')"
        :width="180"
        :disabled="!editable || loading"
        data-cy="phone-ticketing-support-create-button"
        @click="moveToCreate()"
      />
    </div>

    <div v-if="[PhoneTicketingSupportStatus.Creating, PhoneTicketingSupportStatus.Created].includes(status)">
      <i18n-t keypath="phoneTicketingSupport.note.grantAccess" tag="div" scope="global" class="text-warning">
        <template #here>
          <NuxtLink :to="GRANT_ACCESS_LINK" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </div>

    <div v-if="status === PhoneTicketingSupportStatus.Created" class="flex-flex-end-center pt-2">
      <CustomButton
        class="ml-6"
        color="warning"
        icon="right-arrow"
        :text="t('common.delete')"
        :width="180"
        :disabled="!editable || loading"
        data-cy="phone-ticketing-support-delete-button"
        @click="moveToDelete()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :text="t('common.edit')"
        :width="180"
        :disabled="!editable || loading"
        data-cy="phone-ticketing-support-edit-button"
        @click="moveToEdit()"
      />
    </div>
  </CardContainer>
</template>
