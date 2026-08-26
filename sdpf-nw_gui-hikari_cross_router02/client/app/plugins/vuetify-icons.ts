import { novaAliases, novaIconSet } from '@/components/icons/vuetify'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.hook('vuetify:before-create', ({ vuetifyOptions }) => {
    const icons = (vuetifyOptions.icons ??= {})

    icons.aliases = {
      ...novaAliases,
      ...icons.aliases,
    }

    icons.sets = {
      ...icons.sets,
      nova: novaIconSet,
    }
  })
})
