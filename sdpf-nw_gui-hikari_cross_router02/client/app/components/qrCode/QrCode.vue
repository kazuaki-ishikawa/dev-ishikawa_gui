<script lang="ts" setup>
import qrcodeLib from 'qrcode'

type PropType = {
  uri?: string
}

const props = withDefaults(defineProps<PropType>(), {
  uri: '',
})

const src = ref('')

const generateQRCode = async () => {
  if (!props.uri) {
    src.value = ''
    return
  }
  try {
    src.value = await qrcodeLib.toDataURL(props.uri, {
      width: 200,
    })
  } catch (error) {
    console.error('QR Code generation failed:', error)
    src.value = ''
  }
}

watch(() => props.uri, generateQRCode, { immediate: true })
</script>

<template>
  <img v-if="src" :src="src" data-cy="qr-code" />
</template>
