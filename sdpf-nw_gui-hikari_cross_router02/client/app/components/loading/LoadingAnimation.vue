<script lang="ts" setup>
import animation from '@/assets/loading-anime.png'
</script>

<template>
  <div class="loading-animation-main">
    <img :src="animation" />
    <slot />
    <div class="progress-bar">
      <div class="bar" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$light-primary-color: rgb(var(--v-theme-light-primary));

.loading-animation-main {
  width: fit-content;
  margin-inline: auto;
  display: grid;
  gap: 2.5rem 1rem;
}
.progress-bar {
  width: 80%;
  height: 10px;
  margin: 0 auto;
  background-color: $light-primary-color;
  position: relative;
  border-radius: 10px;
  overflow: hidden;

  .bar {
    position: absolute;
    height: 100%;
    background-color: $secondary-color;
    border-radius: 10px;
    animation: progress 1.5s normal;
    animation-iteration-count: infinite;
  }
}
@keyframes progress {
  0% {
    width: 0;
  }
  100% {
    width: 100%;
  }
}
</style>
