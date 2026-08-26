<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TerminalTypes } from '@/api/constants'
import { ConnectionTypes, PhysicalBandwidthTypes } from '@/api/guarantees/constants'
import type { ConnectionType, InitialGuaranteeInputDataType } from '@/api/guarantees/types'

export type CampaignSubmitResponse = { extraRateLimit: 100 | 10; connectionType: ConnectionType }
type PropType = {
  guarantee: InitialGuaranteeInputDataType
  open: boolean
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'submit', campaign?: CampaignSubmitResponse): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const is100M = computed(() => props.guarantee.physicalBandwidth === PhysicalBandwidthTypes[0])
const extraRateLimit = computed(() => (is100M.value ? 10 : 100))
const campaignMaxRateLimit = computed(() =>
  is100M.value ? '100M' : props.guarantee.terminalType === TerminalTypes.Rental ? '300M' : '1G',
)
// VPN帯域 未選択 の場合は、「VPN契約帯域に＋キャンペーン10Mを追加して申し込む」ボタンは非活性
const vpnCampaignDisabled = computed(() => !props.guarantee.vpnRateLimit)
// インターネット帯域 未選択 の場合は、「インターネット契約帯域に＋キャンペーン10Mを追加して申し込む」ボタンは非活性
const internetCampaignDisabled = computed(() => !props.guarantee.internetRateLimit)
const handleSubmit = (connectionType?: ConnectionType) => {
  if (connectionType) {
    emits('submit', { extraRateLimit: extraRateLimit.value, connectionType })
  } else {
    emits('submit')
  }
}
</script>

<template>
  <DialogBase
    :title="t('campaign.title')"
    :open="open"
    :cancel-label="t('common.return')"
    cancel-icon="left-arrow"
    :width="1200"
    data-cy="guarantee-campaign-dialog"
    @close="emits('close')"
  >
    <div class="header-card my-4 px-6 py-4">
      <div class="text-size-xl text-center text-primary">
        <div class="font-weight-bold text-decoration-underline">
          最大３カ月間<span class="text-4xl">帯域ワンランクアップ</span>キャンペーンのご案内
        </div>
        <div class="my-3">料金はそのまま、+{{ extraRateLimit }}Mお得にお試し可能</div>
      </div>
    </div>
    <div class="flex-start-start flex-column ga-15 my-5">
      <div>
        <div class="text-xl font-weight-bold text-primary">キャンペーン概要:</div>
        <div>
          現在、ギャランティアクセスの新規リソース作成時に、インターネット契約帯域およびVPN契約帯域のいずれか一方を
        </div>
        <div>
          最大3カ月の間、
          <span class="font-weight-bold text-lg">
            利用料金はそのままで、追加{{ extraRateLimit }}M増速するキャンペーン
          </span>
          を実施しております。
        </div>
        <div class="mt-4">
          これにより、
          <span class="font-weight-bold text-lg">
            通常料金で利用できる帯域よりも、{{ extraRateLimit }}M多い帯域をご利用いただくことが可能
          </span>
          です。
        </div>
        <div>
          キャンペーン期間終了後は、{{
            extraRateLimit
          }}M追加後の帯域が自動的に継続利用となり、増速された合計契約帯域としてご請求となります。
        </div>
        <div>※継続利用を希望されない場合は、期間内に利用帯域の変更が必要となります。</div>
      </div>
    </div>
    <fieldset class="rounded-xl">
      <legend class="text-lg">■キャンペーン適用イメージ</legend>
      <div class="mt-5 ml-16 text-decoration-underline">
        例: VPN契約帯域{{ is100M ? '30' : '300' }}M、インターネット契約帯域{{ is100M ? '30' : '300' }}M（合計契約帯域{{
          is100M ? '60' : '600'
        }}M）のお申し込みをご検討中のお客様の場合
      </div>

      <div class="position-relative flex-center-center mt-5">
        <table class="without-campaign-table">
          <tbody>
            <tr scope="row">
              <th>VPN契約帯域</th>
              <td>{{ is100M ? '30' : '300' }}M</td>
            </tr>
            <tr scope="row">
              <th>インターネット契約帯域</th>
              <td>{{ is100M ? '30' : '300' }}M</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mb-2">
        <div class="campaign-image-grid">
          <div class="campaign-image-col-span-2 campaign-image-right-border text-secondary">
            <div class="campaign-image-text-offset mb-2 text-black text-decoration-underline text-sm">
              キャンペーンを利用すると最大３カ月の間
            </div>
          </div>
          <div class="text-sm pl-2 campaign-image-col-span-2">合計契約帯域: {{ is100M ? '60' : '600' }}M</div>
        </div>
        <div class="campaign-image-grid">
          <div class="campaign-image-bracket text-secondary" />
        </div>
        <div class="campaign-image-grid">
          <div class="campaign-image-col-start-2 text-secondary ml-n1 down-arrow" />
          <div class="campaign-image-col-start-4 text-secondary campaign-image-ml-n5 down-arrow" />
        </div>
      </div>

      <div class="flex-space-between-center">
        <div class="ml-16">
          <table class="wide-table">
            <tbody>
              <tr scope="row">
                <th>VPN契約帯域</th>
                <td>
                  <div class="flex-center-center">
                    {{ is100M ? '30' : '300' }}M
                    <div class="campain">
                      <div class="font-weight-bold text-xs mx-1">＋キャンペーン</div>
                      <div class="flex-center-center text-xl font-weight-bold">{{ extraRateLimit }}M</div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr scope="row">
                <th>インターネット契約帯域</th>
                <td>{{ is100M ? '30' : '300' }}M</td>
              </tr>
            </tbody>
          </table>
          <div class="text-right text-sm">
            合計契約帯域: {{ is100M ? '70M（60M+キャンペーン10M）' : '700M（600M+キャンペーン100M）' }}
          </div>
        </div>

        <div class="font-weight-bold text-lg">または</div>

        <div class="mr-16">
          <table class="wide-table">
            <tbody>
              <tr scope="row">
                <th>VPN契約帯域</th>
                <td>{{ is100M ? '30' : '300' }}M</td>
              </tr>
              <tr scope="row">
                <th>インターネット契約帯域</th>
                <td>
                  <div class="flex-center-center">
                    {{ is100M ? '30' : '300' }}M
                    <div class="campain">
                      <div class="font-weight-bold text-xs mx-1">＋キャンペーン</div>
                      <div class="flex-center-center text-xl font-weight-bold">{{ extraRateLimit }}M</div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="text-right text-sm">
            合計契約帯域: {{ is100M ? '70M（60M+キャンペーン10M）' : '700M（600M+キャンペーン100M）' }}
          </div>
        </div>
      </div>
      <div class="flex-space-between-center mt-10">
        <button
          class="vpn-campaign-button ml-16 font-weight-bold text-lg elevation-4 flex-center-center"
          :disabled="vpnCampaignDisabled"
          data-cy="guarantee-campaign-dialog-vpn-rate-limit-campaign-button"
          @click="handleSubmit(ConnectionTypes.Vpn)"
        >
          <div class="position-relative text-pre-wrap">
            <div class="my-2">{{ t('campaign.vpnRateLimitCampaignButton', { extraRateLimit }) }}</div>
          </div>
        </button>
        <button
          class="internet-campaign-button mr-16 font-weight-bold text-lg elevation-4 flex-center-center"
          :disabled="internetCampaignDisabled"
          data-cy="guarantee-campaign-dialog-internet-rate-limit-campaign-button"
          @click="handleSubmit(ConnectionTypes.Internet)"
        >
          <div class="position-relative text-pre-wrap">
            <div class="my-2">{{ t('campaign.internetRateLimitCampaignButton', { extraRateLimit }) }}</div>
          </div>
        </button>
      </div>
      <button
        class="without-campaign-button my-5 ml-16 font-weight-bold py-2 elevation-4 flex-center-center"
        data-cy="guarantee-campaign-dialog-without-campaign-button"
        @click="handleSubmit()"
      >
        <div>{{ t('campaign.withoutCampaignButton') }}</div>
      </button>
    </fieldset>

    <div class="footer-card mt-4 px-6 py-4">
      <div class="font-weight-bold text-xl">留意事項:</div>
      <ol type="1">
        <li>
          本キャンペーンによる{{
            extraRateLimit
          }}M増速対象期間は、ギャランティアクセスの課金開始日（リソースステータスが「active」になり開通した日）の属する月から2カ月後の月末までです。
        </li>
        <li>
          以下の条件に該当する場合は、本キャンペーンの適用対象外となります。
          <ul>
            <li>
              本キャンペーン適用前のインターネット接続およびVPN接続の合計契約帯域が0Mもしくは{{
                campaignMaxRateLimit
              }}の場合
            </li>
            <li v-if="is100M">本キャンペーン適用前のインターネット契約帯域が0MかつVPN契約帯域が90Mの場合</li>
          </ul>
        </li>
        <li>
          以下の条件に該当する場合は、増速に制限がございます。
          <ul>
            <li>
              本キャンペーン適用前のインターネット契約帯域が0Mの場合：VPN契約帯域のみ{{ extraRateLimit }}M追加可能
            </li>
            <li>
              本キャンペーン適用前のVPN契約帯域が0Mの場合：インターネット契約帯域のみ{{ extraRateLimit }}M追加可能
            </li>
          </ul>
        </li>
        <li>
          キャンペーン期間終了後は、{{
            extraRateLimit
          }}M追加後の帯域が自動的に継続利用となり、増速された合計契約帯域の課金が開始されます。
        </li>
        <li>
          キャンペーン期間中に帯域変更をご希望、もしくは増速後の帯域の継続利用をご希望でない場合は、キャンペーン期間終了までに利用帯域の変更画面の「キャンペーン適用を終了」ボタンを押下し、帯域を変更する必要がございます。
        </li>
        <li>
          本キャンペーンを適用できるのは、一つの「ギャランティアクセス」リソースにつき一度までです。過去、本キャンペーンを適用した「ギャランティアクセス」リソースは適用対象外となります。
        </li>
        <li>
          料金、キャンペーンの詳細は
          <NuxtLink href="https://sdpf.ntt.com/services/rink/pricing/#campaign_1rank" target="_blank">
            こちら
          </NuxtLink>
          。
        </li>
        <li>キャンペーン期間は2025年1月1日から（終了日未定）。</li>
        <li>
          割引期間最終月の月初、月末に終了前のメール通知を送付いたします。通知を受信するには、Smart Data Platform
          ポータルのメール通知設定にて、「お知らせ/リリース」メールを受信するよう設定を変更してください。変更方法については
          <NuxtLink href="https://sdpf.ntt.com/docs/about-sss/tutorials/rsts/notification.html#id2" target="_blank">
            こちら
          </NuxtLink>
          をご参照ください。
        </li>
        <li>
          上記キャンペーン期間の終了日と各リソース単位の最大3カ月間の{{
            extraRateLimit
          }}M増速対象期間の終了日は異なりますのでご注意ください。
        </li>
      </ol>
    </div>
  </DialogBase>
</template>

<style lang="scss" scoped>
$text-color: #fff;
$transition-time: 0.5s;
$color-primary: rgb(var(--v-theme-primary));
$color-highlight: rgb(var(--v-theme-highlight));
$color-info: rgb(var(--v-theme-info));

.header-card {
  border-radius: v.$child-border-radius;
  background-color: $color-highlight;
}
.text-size-xl {
  font-size: 1.5rem;
}
.campain {
  border-radius: 5px;
  background-color: $color-primary;
  color: $text-color;
  margin-left: 10px;
}
.without-campaign-table {
  width: 300px;
}

.vpn-campaign-button {
  width: 380px;
  background-color: $color-primary;
  color: $text-color;
  border: solid 1px transparent;
  position: relative;
  transition: all $transition-time;
  user-select: none;
  &:hover {
    cursor: pointer;
    color: $color-primary;
    border: solid 1px $color-primary;
    background-color: $text-color;
  }
}
.vpn-campaign-button:disabled {
  background-color: $color-primary;
  color: $text-color;
  border: solid 1px transparent;
  position: relative;
  filter: brightness(0.5);
  cursor: not-allowed;
}
.internet-campaign-button {
  width: 380px;
  background-color: $color-primary;
  color: $text-color;
  border: solid 1px transparent;
  position: relative;
  transition: all $transition-time;
  user-select: none;
  &:hover {
    cursor: pointer;
    color: $color-primary;
    border: solid 1px $color-primary;
    background-color: $text-color;
  }
}
.internet-campaign-button:disabled {
  background-color: $color-primary;
  color: $text-color;
  border: solid 1px transparent;
  position: relative;
  filter: brightness(0.5);
  cursor: not-allowed;
}
.without-campaign-button {
  font-size: 1.5rem;
  width: 972px;
  background-color: $color-info;
  color: $text-color;
  border: solid 1px transparent;
  position: relative;
  transition: all $transition-time;
  user-select: none;
  &:hover {
    cursor: pointer;
    color: $color-info;
    border: solid 1px $color-info;
    background-color: $text-color;
  }
}
.wide-table {
  width: 380px;
}
.footer-card {
  border-radius: v.$child-border-radius;
  background-color: rgb(var(--v-theme-info-lighten-4));
}
table {
  border-collapse: collapse;
  border: 2px solid $color-info;
}
tr {
  height: 4rem;
}
th {
  background-color: $color-highlight;
}
th,
td {
  border: 2px solid $color-info;
  padding: 8px 10px;
  font-weight: bold;
}
.down-arrow {
  width: 1px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top-width: 7px;
  border-top-style: solid;
}
.campaign-image-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.campaign-image-col-span-2 {
  grid-column: span 2 / span 2;
}
.campaign-image-col-start-2 {
  grid-column-start: 2;
}
.campaign-image-col-start-4 {
  grid-column-start: 4;
}
.campaign-image-right-border {
  border: 0 solid currentColor;
  border-right-width: 1px;
}
.campaign-image-bracket {
  height: 32px;
  grid-column-start: 2;
  grid-column-end: span 2;
  border: 0 solid currentColor;
  border-top-width: 1px;
  border-left-width: 1px;
  border-right-width: 1px;
}
.campaign-image-text-offset {
  margin-top: 80px;
  margin-left: 96px;
}
.campaign-image-ml-n5 {
  margin-left: -5px;
}
</style>
