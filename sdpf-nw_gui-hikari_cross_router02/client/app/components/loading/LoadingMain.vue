<script setup lang="ts">
type PropsType = {
  message?: string
}
const props = defineProps<PropsType>()
</script>

<template>
  <div class="loading-main">
    <LoadingAnimation class="loading-margin">
      <div v-if="!!props?.message" class="message">{{ props.message }}</div>
    </LoadingAnimation>
  </div>
</template>

<style lang="scss" scoped>
.loading-main {
  color: #fff;
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  width: max(100vw, 500px);
  height: max(100vh, 500px);
  background-size: cover;
  background-image: url(v.$bg-image);
  background-attachment: fixed;
  z-index: v.$dialog-z-index + 1;
}

.loading-margin {
  margin-top: 10rem;
  margin-bottom: 0;
  margin-inline: auto;
}

.message {
  white-space: pre-wrap;
  text-align: center;
}
</style>
