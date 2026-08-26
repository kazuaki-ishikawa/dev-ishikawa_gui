<script setup lang="ts">
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.Home,
})

const pages = [
  'checkbox-base',
  'checkbox-form',
  'input-form',
  'radio-form',
  'radio-card-form',
  'select-form',
  'textarea',
  'multiple',
  'date-picker',
  'tag',
]
const route = useRoute()
</script>

<template>
  <div>
    <div>home画面</div>
    <div>サンプル画面（後で消す）</div>
    <div v-for="page in pages" :key="page">
      <NuxtLink :to="`/nova/tenants/${route.params.tenantId}/test/${page}`">
        {{ page }}
      </NuxtLink>
    </div>
  </div>
</template>
