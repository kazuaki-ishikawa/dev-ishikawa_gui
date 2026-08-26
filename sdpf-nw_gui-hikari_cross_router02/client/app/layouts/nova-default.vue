<script setup lang="ts">
const { $vuetify } = useNuxtApp()

if ($vuetify.theme.global.name.value !== 'novaTheme') {
  $vuetify.theme.change('novaTheme')
}

withDefaults(
  defineProps<{
    useSidebar?: boolean
  }>(),
  { useSidebar: true },
)

const { loadingAnimation, setLoadingAnimation } = useLoading()
const loadingAnimationTimeout = ref<NodeJS.Timeout | null>(null)
watch(loadingAnimation, newValue => {
  if (!newValue) {
    return
  }
  if (loadingAnimationTimeout.value) {
    clearTimeout(loadingAnimationTimeout.value)
  }
  loadingAnimationTimeout.value = setTimeout(() => {
    setLoadingAnimation(false)
  }, 3000)
})

onBeforeUnmount(() => {
  if (loadingAnimationTimeout.value) {
    clearTimeout(loadingAnimationTimeout.value)
  }
})
</script>

<template>
  <v-sheet>
    <NovaSideBar v-if="useSidebar" />
    <v-main class="bg-highlight">
      <v-container fluid min-width="800px" class="layout-container">
        <div class="pa-3">
          <slot />
        </div>
      </v-container>
    </v-main>
  </v-sheet>
</template>

<style scoped lang="scss">
.layout-container {
  padding: 0;
  min-height: 100vh;
}
</style>
