export default defineNuxtPlugin(() => {
  const apiServer = import.meta.env.NUXT_PUBLIC_API_SERVER

  if (import.meta.env.USE_STUB) {
    console.log(`API_SERVER: ${apiServer}`)
  }
})
