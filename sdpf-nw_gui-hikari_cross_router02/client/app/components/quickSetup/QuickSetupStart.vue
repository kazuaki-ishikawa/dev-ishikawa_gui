<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TERMINAL_LINK } from '@/api/terminals/constants'

type PropsType = {
  nextDisabled?: boolean
}
defineProps<PropsType>()

const { t } = useI18n()

type Emits = {
  (e: 'close'): void
  (e: 'next'): void
}
const emits = defineEmits<Emits>()

const resourceList = [{ name: 'VPN' }, { name: t('sideBar.terminal') }]
</script>

<template>
  <QuickSetupTemplate :next-label="t('common.next')" :next-disabled="nextDisabled" @next="emits('next')">
    <template #message>
      <i18n-t keypath="quickSetup.confirmResourceCreation" tag="div" scope="global" class="text-pre-wrap">
        <template #here>
          <NuxtLink :to="TERMINAL_LINK.BASE" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </template>
    <ol>
      <li v-for="resource in resourceList" :key="resource.name">
        <span>{{ resource.name }}</span>
      </li>
    </ol>
  </QuickSetupTemplate>
</template>

<style lang="scss" scoped>
$primary-color: rgb(var(--v-theme-primary));
$secondary-color: rgb(var(--v-theme-secondary));

ol {
  counter-reset: item;
  list-style-type: none;
  line-height: 2rem;
  margin-left: -1.875rem;
  li {
    display: block;
    position: relative;
    span {
      margin-left: 1.875rem;
    }
    &:before {
      content: counter(item) ' ';
      counter-increment: item;
      color: #fff;
      position: absolute;
      margin-top: 0.4375rem;
      background: linear-gradient(90deg, $secondary-color, $primary-color);
      height: 1.25rem;
      width: 1.25rem;
      line-height: 1.1875rem;
      text-align: center;
      border-radius: 0.625rem;
      font-size: 0.6875rem;
    }
  }
}
</style>
