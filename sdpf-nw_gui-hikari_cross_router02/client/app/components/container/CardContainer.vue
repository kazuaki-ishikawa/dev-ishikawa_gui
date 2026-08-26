<template>
  <div class="card-container">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.card-container {
  padding: 2rem;
  background-color: #fff;
  border-radius: v.$container-border-radius;
  box-shadow: 0px 0px 5px v.$light-info-alpha-color;
}
</style>
