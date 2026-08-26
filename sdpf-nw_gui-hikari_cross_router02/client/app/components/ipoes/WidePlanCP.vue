<script lang="ts" setup>
import { IpoeTypes } from '@/api/ipoes/constants'
import type { IpoeType } from '@/api/ipoes/types'

type Emits = {
  (e: 'applyPlan', ipoeType: IpoeType): void
}
const emits = defineEmits<Emits>()
</script>

<template>
  <div class="header-card mb-4 px-6 py-4">
    <div class="text-center text-primary">
      <div class="text-3xl font-weight-bold text-decoration-underline">
        最大３カ月間<span class="text-6xl">ワイドプラン割引</span>キャンペーンのご案内
      </div>
      <div class="my-3 text-2xl">上位のワイドプランを標準プランと同額相当でお試し可能</div>
    </div>
  </div>
  <div class="flex-column flex-flex-start-flex-start my-5">
    <div>
      <div class="text-xl font-weight-bold text-primary">キャンペーン概要</div>
      <div>
        現在、ベストエフォートIPoEアクセスのリソース作成時または変更時に
        <span class="font-weight-bold text-lg">ワイドプラン</span>
        で申込すると、 最大３カ月の間、ワイドプランの月額料金を
        <span class="font-weight-bold text-lg">標準プランの上限料金と同額に割引</span>
        するキャンペーンを実施しております。
      </div>
      <div>
        これにより、
        <span class="font-weight-bold text-lg">
          標準プランの月額相当で、上位のワイドプランをお試しいただくことが可能
        </span>
        です。
      </div>
      <div>
        割引対象期間終了後は、ワイドプランの通常料金をご請求します。標準プランへの変更や解約は割引期間中でも可能です。
      </div>
    </div>
    <div>
      <div class="text-primary text-xl font-weight-bold">ワイドプランとは？</div>
      <div>
        ワイドプランとは、
        <span class="font-weight-bold text-lg">
          標準プランと比較して約３倍のインターネット通信帯域を利用可能な上位プラン
        </span>
        です。
      </div>
      <div>
        これにより、特定通信ブレイクアウト設定時をはじめとしたインターネット接続時の通信混雑の緩和が可能です。
        ワイドプランの詳細は
        <nuxt-link
          href="https://sdpf.ntt.com/services/docs/rink/service-descriptions/menu/option_detail/wide_for_web.html"
          target="_blank"
        >
          こちら
        </nuxt-link>
        をご確認ください。
      </div>
    </div>
  </div>

  <div class="image-container pa-4 pt-2">
    <img class="w-100" src="~/assets/images/ipoe-commercial-paper.svg" />
  </div>

  <div class="flex-center-stretch my-10 ga-10">
    <LargeButton data-cy="ipoe-wide-plan-button" @click="emits('applyPlan', IpoeTypes.Wide)">
      <div class="font-weight-bold text-center">
        <div class="text-xl">キャンペーンを利用して</div>
        <div class="text-4xl">ワイドプランで申込</div>
      </div>
    </LargeButton>
    <LargeButton data-cy="ipoe-normal-plan-button" color="info" @click="emits('applyPlan', IpoeTypes.Normal)">
      <div class="font-weight-bold text-center">
        <div class="text-xl">キャンペーンを利用せず</div>
        <div class="text-4xl">標準プランで申込</div>
      </div>
    </LargeButton>
  </div>

  <div class="my-5">
    <div class="text-primary text-xl font-weight-bold">その他キャンペーンについて</div>
    <div>
      その他有償のオプションである特定通信ブレイクアウトやワイドプラスforWeb会議についても同様のキャンペーンを実施中ですのでこの機会にぜひお試しください。詳細は
      <nuxt-link href="https://sdpf.ntt.com/services/rink/pricing/#campaign_3op" target="_blank"> こちら </nuxt-link>
      をご確認ください。
    </div>
    <div>
      各種設定方法はこちら：
      <nuxt-link href="https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_lbo.html" target="_blank">
        特定通信ブレイクアウトの設定方法
      </nuxt-link>
      /
      <nuxt-link
        href="https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_be_plan.html#for-web"
        target="_blank"
      >
        ワイドプラスforWeb会議の設定方法
      </nuxt-link>
    </div>
  </div>

  <div class="footer-card px-6 py-4">
    <div class="font-weight-bold text-xl">キャンペーンの詳細・留意事項</div>
    <ol>
      <li>
        本キャンペーン期間中に、ベストエフォートIPoEアクセスのワイドプランを申込すると、申込から最大３カ月の間、ワイドプランの従量料金が、同メニュー標準プランの上限料金の金額を上回った場合、請求時に上回った金額と同額を割引いたします。
      </li>
      <li>
        従量料金、上限料金といったNTTドコモビジネス請求の考え方、標準の料金表については、
        <nuxt-link href="https://sdpf.ntt.com/services/rink/pricing/#ntt_monthly_cost" target="_blank">
          こちら
        </nuxt-link>
        をご確認ください。
        <div class="my-3 ml-8 indent">
          <strong>(例1)</strong>
          「ベストエフォートIPoEアクセス フレッツ回線別契約型」の月額料金は、<br />
          標準プラン{{ '\u3000' }}：従量料金 0.197917円 (税別) /分課金{{ '\u3000' }}上限料金5,700円 (税別)<br />
          ワイドプラン：従量料金 0.302084円 (税別) /分課金{{ '\u3000' }}上限料金8,700円 (税別){{ '\u3000' }}ですが<br />
          本キャンペーン期間中にワイドプランを申込し利用すると、ワイドプランの従量料金が、標準プランの上限料金（5,700円
          (税別)）を超過した場合、請求時に超過した金額と同額を割引して、5,700円
          (税別)をワイドプランの月額料金としてご請求いたします。
        </div>
        <div class="my-3 ml-8 indent">
          <strong>(例2)</strong>
          「ベストエフォートIPoEアクセス 光回線一括提供型ファミリー・ギガラインタイプ」の月額料金は、<br />
          標準プラン{{ '\u3000' }}：従量料金 0.420139円 (税別) /分課金{{ '\u3000' }}上限料金12,100円 (税別)<br />
          ワイドプラン：従量料金 0.524306円 (税別) /分課金{{ '\u3000' }}上限料金15,100円 (税別){{
            '\u3000'
          }}ですが<br />
          本キャンペーン期間中にワイドプランを申込し利用すると、ワイドプランの従量料金が、標準プランの上限料金（12,100円
          (税別)）を超過した場合、請求時に超過した金額と同額を割引して、12,100円
          (税別)をワイドプランの月額料金としてご請求いたします。
        </div>
      </li>
      <li>
        本キャンペーンによる割引対象期間は、ワイドプランを有効にする「ベストエフォートIPoEアクセス」の課金開始日（リソースステータスが「active」になり開通した日）の属する月から2カ月後の月末までです。
        <div class="my-3 ml-8 indent">
          <strong>(例3)</strong>
          2024年4月1日に「ベストエフォートIPoEアクセス」新規作成およびワイドプランの申込を行い、その後2024年5月1日にリソースステータスが「active」となり開通、課金開始された場合、2024年7月30日までが本キャンペーンによる割引対象期間となります。
        </div>
      </li>
      <li>
        「ベストエフォートIPoEアクセス」のリソース新規作成時点では「標準」プランで申込をされた場合も、
        「ベストエフォートIPoEアクセス」リソースの課金開始日（リソースステータスが「active」になり開通した日）の属する月から2カ月後の月末までにワイドプランに変更した場合は本キャンペーンによる割引が適用されます。その場合、ワイドプランの割引対象期間の起算月は、ワイドプランにプラン変更を行った日の属する月ではなく、
        「ベストエフォートIPoEアクセス」リソースの課金開始日の属する月から2カ月後の月末までです。
        <div class="my-3 ml-8 indent">
          <strong>(例4)</strong>
          2024年4月1日に「ベストエフォートIPoEアクセス」を新規作成する際には標準プランで申込を行い、その後2024年5月1日にリソースステータスが「active」となり開通、課金開始されたとします。その後、2024年6月1日に、標準プランからワイドプランへの変更申込を行った場合、2024年7月30日までが本キャンペーンによる割引期間となります。ワイドプランへの変更申込日の属する月から2カ月後の月末（2024年8月31日）までではございません。
        </div>
      </li>
      <li>割引対象期間終了後は、本キャンペーンによる割引はなくなり、通常のワイドプラン月額料金での請求となります。</li>
      <li>
        いずれのプランを選んで申し込みいただいたとしても、任意のタイミングで標準プランとワイドプラン間のプラン変更をいただくことは可能です。開通後のプラン変更方法は
        <nuxt-link
          href="https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_be_plan.html"
          target="_blank"
        >
          こちら
        </nuxt-link>
        のチュートリアルをご参照ください。
      </li>
      <li>法人単位、SDPF契約単位、ワークスペース単位等でのキャンペーン適用リソース数の上限はございません。</li>
      <li>
        本キャンペーンを適用できるのは、一つの「ベストエフォートIPoEアクセス」リソースにつき一度までです。過去にキャンペーンを適用した「ベストエフォートIPoEアクセス」リソースを標準プランに変更し、再度ワイドプランにしたとしても本キャンペーンは適用されません。
      </li>
      <li>
        料金、キャンペーンの更なる詳細は
        <nuxt-link href="https://sdpf.ntt.com/services/rink/pricing/#campaign_3op" target="_blank"> こちら </nuxt-link>
        をご参照ください。
      </li>
    </ol>
    <div class="font-weight-bold text-xl">キャンペーン期間</div>
    <ol>
      <li>2024年6月18日～終了日未定</li>
      <li>
        上記キャンペーン期間の終了日と各リソース単位の最大3カ月間の割引対象期間の終了日は異なりますのでご注意ください。(上記「キャンペーンの詳細・留意事項」の項番3.および4.をご参照ください。
      </li>
    </ol>
  </div>
</template>

<style scoped lang="scss">
.header-card {
  border-radius: v.$child-border-radius;
  background-color: rgb(var(--v-theme-highlight));
}
.image-container {
  border-radius: v.$child-border-radius;
  border: solid 1px rgb(var(--v-theme-light-info));
}
.footer-card {
  border-radius: v.$child-border-radius;
  background-color: rgb(var(--v-theme-info-lighten-4));
}
.indent {
  text-indent: -2rem;
}
</style>
