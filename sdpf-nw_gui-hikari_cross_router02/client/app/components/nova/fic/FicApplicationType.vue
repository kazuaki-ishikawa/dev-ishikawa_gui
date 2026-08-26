<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FicRequestTypes, FIC_URL } from '@/api/ficConnections/constants'
import type { FicRequestType } from '@/api/ficConnections/types'
import type { RadioFormOptionType } from '@/components/nova/form/types'

const requestType = defineModel<FicRequestType | undefined>({ required: true })

type Emits = {
  (e: 'click:start'): void
  (e: 'click:simpleConsole'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const moveToFicConsole = () =>
  navigateTo(FIC_URL.FIC_CONSOLE, { open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } } })

const requestTypeOptions = computed<RadioFormOptionType<FicRequestType>[]>(() => [
  { text: t('nova.fic.ficConnection'), value: FicRequestTypes.FicConnection },
  {
    text: t('nova.fic.simpleFicConnection'),
    value: FicRequestTypes.SimpleFicConnection,
    help: t('nova.fic.help.simpleFicConnection'),
  },
])

const isFicConnection = computed(() => requestType.value === FicRequestTypes.FicConnection)
const isSimpleFicConnection = computed(() => requestType.value === FicRequestTypes.SimpleFicConnection)
</script>

<template>
  <div>
    <NovaRadioForm v-model="requestType" :input-props="{ options: requestTypeOptions, inline: false }" />

    <!-- ［かんたん接続］の説明 -->
    <div v-if="isSimpleFicConnection">
      <div class="text-body-medium font-weight-bold mb-2 mt-6">{{ t('nova.fic.simpleConnection.whatIsTitle') }}</div>
      <i18n-t
        keypath="nova.fic.simpleConnection.whatIsDescription"
        tag="p"
        scope="global"
        class="text-body-medium text-pre-wrap pl-4 mb-6"
      >
        <template #link>
          <NuxtLink :to="FIC_URL.SIMPLE_FIC_EXPLANATION" target="_blank">{{ t('nova.common.here') }}</NuxtLink>
        </template>
      </i18n-t>

      <div class="text-body-medium font-weight-bold mb-2">{{ t('nova.fic.simpleConnection.availableTitle') }}</div>
      <p class="text-body-medium text-pre-wrap pl-4 mb-1">
        {{ t('nova.fic.simpleConnection.availableDescription') }}
      </p>
      <ul class="text-body-medium pl-8 mb-0">
        <li>{{ t('nova.fic.simpleConnection.service1') }}</li>
        <li>{{ t('nova.fic.simpleConnection.service2') }}</li>
      </ul>
    </div>

    <div v-if="requestType" class="flex-flex-end-center mt-6">
      <NuxtLink
        :to="isFicConnection ? FIC_URL.FIC_TUTORIAL : FIC_URL.SIMPLE_FIC_TUTORIAL"
        target="_blank"
        class="d-inline-flex align-center ga-1 text-body-medium text-decoration-none"
      >
        {{ t('nova.fic.createTutorial') }}
        <v-icon icon="nova:up-right-square" size="small" />
      </NuxtLink>
    </div>

    <!-- ［かんたん接続］: 状態遷移図・接続イメージ -->
    <template v-if="isSimpleFicConnection">
      <NovaSimpleConnectionSteps class="mt-6" />

      <div class="flex-flex-start-center mt-6">
        <NovaCustomButton height="auto" append-icon="nova:up-right-square" @click="emits('click:simpleConsole')">
          <span class="py-2 text-pre-wrap">{{ t('nova.fic.simpleConnection.clickStart') }}</span>
        </NovaCustomButton>
      </div>

      <v-sheet border rounded="md" class="pa-4 mt-6">
        <div class="text-body-medium font-weight-bold mb-2">{{ t('nova.fic.simpleConnection.imageTitle') }}</div>
        <div class="text-body-small">{{ t('nova.fic.simpleConnection.imageDescription') }}</div>
        <img
          class="w-100 mt-4"
          src="~/assets/images/simple-fic-connection.png"
          :alt="t('nova.fic.simpleConnection.imageTitle')"
        />
      </v-sheet>
    </template>

    <!-- Flexible InterConnectと接続 -->
    <template v-else-if="isFicConnection">
      <div class="step-cards ga-4 mt-6">
        <!-- STEP 1 -->
        <v-sheet border rounded="md" class="pa-4 d-flex flex-column">
          <div class="step-label mb-3">{{ 'STEP1' }}</div>
          <div class="text-body-medium font-weight-bold text-pre-wrap flex-grow-1">
            {{ t('nova.fic.connectionImage.step1Title') }}
          </div>
          <NovaCustomButton class="mt-4 align-self-start" @click="emits('click:start')">
            {{ t('nova.fic.connectionImage.clickStart') }}
          </NovaCustomButton>
        </v-sheet>

        <!-- STEP 2 -->
        <v-sheet border rounded="md" class="pa-4 d-flex flex-column">
          <div class="step-label mb-3">{{ 'STEP2' }}</div>
          <div class="flex-grow-1">
            <div class="text-body-medium font-weight-bold mb-2">{{ t('nova.fic.connectionImage.step2Title') }}</div>
            <div class="text-body-small text-info">{{ t('nova.fic.connectionImage.step2Note') }}</div>
          </div>
          <NovaCustomButton class="mt-4 align-self-start" append-icon="nova:up-right-square" @click="moveToFicConsole">
            {{ t('nova.fic.connectionImage.moveToConsole') }}
          </NovaCustomButton>
        </v-sheet>

        <!-- 完了 -->
        <v-sheet border rounded="md" class="pa-4">
          <div class="step-label step-label--placeholder mb-3" aria-hidden="true">&nbsp;</div>
          <div class="text-body-medium font-weight-bold mb-2">{{ t('nova.fic.connectionImage.completeTitle') }}</div>
          <div class="text-body-small">{{ t('nova.fic.connectionImage.completeText') }}</div>
        </v-sheet>
      </div>

      <!-- 接続イメージおよび作成箇所 -->
      <v-sheet border rounded="md" class="pa-4 mt-6">
        <div class="text-body-medium font-weight-bold mb-4">{{ t('nova.fic.connectionImage.title') }}</div>
        <img class="w-100" src="~/assets/images/fic-connection.svg" :alt="t('nova.fic.connectionImage.title')" />
      </v-sheet>
    </template>
  </div>
</template>

<style scoped lang="scss">
.step-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.step-label {
  display: inline-block;
  align-self: flex-start;
  padding: 2px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  color: rgb(var(--v-theme-info));
  background-color: rgb(var(--v-theme-highlight));
}
.step-label--placeholder {
  visibility: hidden;
}
</style>
