<script setup lang="ts">
const { $vuetify } = useNuxtApp()

if ($vuetify.theme.global.name.value !== 'defaultTheme') {
  $vuetify.theme.change('defaultTheme')
}
</script>

<template>
  <v-main class="main">
    <SideBar />
    <RootContainer>
      <slot />
    </RootContainer>
  </v-main>
</template>

<style scoped lang="scss">
.main {
  min-height: 100vh;
  min-width: calc(v.$bg-min-width + 3rem);
  display: grid;
  grid-template-columns: v.$sidebar-width 1fr;
  background-size: cover;
  background-image: url(v.$bg-image);
  background-attachment: fixed;
}
</style>
