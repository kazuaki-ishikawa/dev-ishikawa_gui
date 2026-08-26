<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  open: boolean
  extraRateLimit: number
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'submit'): void
  (e: 'close'): void
}
const emit = defineEmits<Emits>()
const checked = ref(false)

const { t } = useI18n()
const { loading } = useLoading()

watch(
  () => props.open,
  () => {
    checked.value = false
  },
)
</script>

<template>
  <DialogBase
    :title="t('campaign.quitCampaignDialogTitle')"
    :open="props.open"
    :submit-label="t('common.finish')"
    :cancel-label="t('common.return')"
    :cancel-icon="'left-arrow'"
    :disabled="!checked || loading"
    @submit="emit('submit')"
    @close="emit('close')"
  >
    <div>
      <div class="flex-column flex-flex-start-flex-start mb-5">
        <div>
          <div class="text-xl font-weight-bold">キャンペーン概要:</div>
          <div>
            現在、ギャランティアクセスの新規リソース作成時に、インターネット契約帯域およびVPN契約帯域のいずれか一方を最大3カ月の間、利用料金はそのままで、追加{{
              extraRateLimit
            }}M増速するキャンペーンを実施しております。
          </div>
          <div>
            これにより、通常料金で利用できる帯域よりも、{{ extraRateLimit }}M多い帯域をご利用いただくことが可能です。
          </div>
          <div>
            キャンペーン期間終了後は、{{
              extraRateLimit
            }}M追加後の帯域が自動的に継続利用となり、増速された合計契約帯域としてご請求となります。
          </div>
          <div>※継続利用を希望されない場合は、期間内に利用帯域の変更が必要となります。</div>
        </div>
      </div>

      <div class="footer-card px-3 py-4">
        <div class="font-weight-bold text-xl">キャンペーン終了に関する留意事項:</div>
        <ol>
          <li>
            <div>キャンペーン終了の手続き完了後、自動的に10M増速は終了となり、利用帯域の変更が可能となります。</div>
            <div>
              ギャランティアクセス(IW回線)の利用帯域を変更する手順の詳細は<nuxt-link
                href="https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_iwan.html"
                target="_blank"
              >
                こちら
              </nuxt-link>
            </div>
          </li>
          <li>手続き完了後、本キャンペーンに再度申し込みすることはできません。</li>
        </ol>
      </div>
    </div>
    <div class="flex-center-center mt-4" data-cy="guarantees-circuits-id-quit-dialog-agreement">
      <TermOfServiceCheckbox v-model="checked" label="上記に同意する" />
    </div>
  </DialogBase>
</template>

<style lang="scss" scoped>
.footer-card {
  border-radius: v.$child-border-radius;
  background-color: rgb(var(--v-theme-info-lighten-4));
}
</style>
