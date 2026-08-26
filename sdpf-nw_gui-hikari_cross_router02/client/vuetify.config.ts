import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'

export default defineVuetifyConfiguration({
  /* vuetify options */
  icons: {
    defaultSet: 'mdi',
  },
  defaults: {
    VCard: {
      elevation: 0,
      rounded: 'md',
    },
  },
  theme: {
    defaultTheme: 'defaultTheme', // 初期値
    variations: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error'],
      lighten: 5,
      darken: 5,
    },
    themes: {
      // 旧UI画面用ページ（/...）のブランド色
      defaultTheme: {
        dark: false,
        colors: {
          primary: '#0065d8',
          ['primary-darken-1']: '#0550ae',
          ['light-primary']: '#c6e0f4',
          secondary: '#0098d8',
          ['light-secondary']: '#eaf2f8',
          success: '#18933b',
          ['light-success']: '#a7e6b9',
          info: '#767676',
          ['light-info']: '#d3d3d3',
          interactive: '#303030',
          warning: '#f5aa00',
          ['light-warning']: '#fff5e5',
          error: '#ff2800',
          ['light-error']: '#fae3df',
          highlight: '#f5f9fc',
        },
      },
      // 新UI画面用ページ（/nova/...）のブランド色
      novaTheme: {
        dark: false,
        colors: {
          primary: '#0969da', // info-500
          ['primary-darken-1']: '#0550ae', // info-600
          ['light-primary']: '#97d3ff', // info-200
          secondary: '#218bff', // info-400
          ['light-secondary']: '#ceedff', // info-100
          success: '#2da44e', // success-400
          ['light-success']: '#edfdf0', // success-50
          info: '#8391a2', // secondary-400
          ['light-info']: '#e5ebf3', // secondary-100
          interactive: '#1D2A37', // 既存の info-darken-3 相当
          warning: '#cc8f00', // warning-400
          ['light-warning']: '#fffbe2', // warning-50
          error: '#fa4549', // navigate-400
          ['light-error']: '#ffe5e4', // navigate-100
          highlight: '#F0F2F4', // main 背景色
        },
      },
    },
  },
})
