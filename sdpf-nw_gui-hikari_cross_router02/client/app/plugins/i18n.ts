import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import ja from '@/locales/ja.json'
import novaEn from '@/locales/nova/en.json'
import novaJa from '@/locales/nova/ja.json'

export default defineNuxtPlugin(({ vueApp }) => {
  const locale = navigator.language.split('-')[0]
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale,
    fallbackLocale: 'en',
    messages: {
      en: {
        ...en,
        nova: novaEn,
      },
      ja: {
        ...ja,
        nova: novaJa,
      },
    },
  })

  vueApp.use(i18n)
})
