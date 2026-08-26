<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import UpRightSquareIcon from '~icons/ztgict/up-right-square'
import { IconSize } from '@/components/icons/constants'

const model = defineModel<boolean>({ required: true })
const { t } = useI18n()
</script>

<template>
  <InnerCard :title="t('common.terms')">
    <TermsOfService data-cy="hikari-collabo-terms-of-service" :height="200">
      <i18n-t keypath="ipoes.planChangeTerm.term" tag="div" scope="global" class="text-pre-wrap mt-2">
        <template #linkText>
          <nuxt-link
            class="cursor-pointer"
            href="https://sdpf.ntt.com/services/docs/rink/service-descriptions/menu/option_detail/wide_for_web.html#/"
            target="_blank"
          >
            {{ t('ipoes.planChangeTerm.linkText') }}
            <UpRightSquareIcon
              :width="IconSize.small"
              :height="IconSize.small"
              :style="{ fill: 'inherit', color: 'inherit' }"
            />
          </nuxt-link>
        </template>
      </i18n-t>
    </TermsOfService>
    <div class="flex-flex-end-center" data-cy="hikari-collabo-terms-of-service-agreement">
      <TermOfServiceCheckbox v-model="model" :label="t('terms.agreement')" />
    </div>
  </InnerCard>
</template>
