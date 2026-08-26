<script setup lang="ts">
const { $vuetify } = useNuxtApp()

if ($vuetify.theme.global.name.value !== 'defaultTheme') {
  $vuetify.theme.change('defaultTheme')
}
</script>

<template>
  <v-main class="main">
    <slot />
  </v-main>
</template>

<style scoped lang="scss">
.main {
  min-height: 100vh;
  background-size: cover;
  background-image: url(v.$bg-image);
  background-attachment: fixed;
  overflow: auto;
}
</style>
