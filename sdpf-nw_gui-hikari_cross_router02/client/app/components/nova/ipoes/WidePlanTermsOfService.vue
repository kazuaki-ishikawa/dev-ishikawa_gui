<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IPOE_LINK } from '@/api/ipoes/constants'

const model = defineModel<boolean>({ required: true })
const { t } = useI18n()

const widePlanTermsDialog = ref(false)

const handleAgree = () => {
  model.value = true
  widePlanTermsDialog.value = false
}
</script>

<template>
  <v-card flat rounded="md">
    <NovaCardTitleWithBorder :title="t('nova.common.terms')" />
    <v-card-item>
      <NovaCheckboxBase v-model="model">
        <template #label>
          <i18n-t keypath="nova.ipoes.widePlanTerms.agreement" tag="span" scope="global">
            <template #linkText>
              <a href="#" @click.stop.prevent="widePlanTermsDialog = true">
                {{ t('nova.ipoes.widePlanTerms.agreementLinkText') }}
              </a>
            </template>
          </i18n-t>
        </template>
      </NovaCheckboxBase>
    </v-card-item>

    <NovaDialogBase v-model="widePlanTermsDialog" :title="t('nova.ipoes.widePlanTerms.dialogTitle')">
      <i18n-t keypath="nova.ipoes.widePlanTerms.description" tag="div" scope="global" class="text-pre-wrap">
        <template #linkText>
          <NuxtLink :to="IPOE_LINK.WIDE_PLAN_TERMS" target="_blank">{{
            t('nova.ipoes.widePlanTerms.linkText')
          }}</NuxtLink>
        </template>
      </i18n-t>
      <template #actions>
        <NovaCustomButton outlined @click="widePlanTermsDialog = false">
          {{ t('nova.common.cancel') }}
        </NovaCustomButton>
        <NovaCustomButton class="ml-4" @click="handleAgree">
          {{ t('nova.terms.agreement') }}
        </NovaCustomButton>
      </template>
    </NovaDialogBase>
  </v-card>
</template>
