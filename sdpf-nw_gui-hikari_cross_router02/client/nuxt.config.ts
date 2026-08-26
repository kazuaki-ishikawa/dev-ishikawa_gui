// このファイルの先頭で dotenv-flow を読み込む（Nuxt の設定評価前に process.env にセット）
import dotenvFlow from 'dotenv-flow'
const nodeEnv = process.env.NODE_ENV || 'development'
dotenvFlow.config({
  node_env: nodeEnv,
  purge_dotenv: true,
})

import { defineNuxtConfig } from 'nuxt/config'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

export default defineNuxtConfig({
  ssr: false,

  devServer: {
    port: Number(process.env.PORT || 3000),
  },

  app: {
    head: {
      title: 'docomo business RINK セキュアドWAN',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap' },
      ],
    },
  },

  routeRules: {
    '/nova/tenants/*/**': { appLayout: 'nova-default' },
  },

  components: [
    // @/components/nova 配下のコンポーネントは、コンポーネント名にNovaが自動付与される。
    // 定義側は InputForm.vue のように定義し、呼び出し側は < NovaInputForm > のように記述する。
    {
      path: '@/components/nova',
      extensions: ['.vue'],
      pathPrefix: false,
      prefix: 'Nova',
    },
    {
      path: '@/components/',
      extensions: ['.vue'],
      pathPrefix: false,
    },
  ],

  modules: [
    '@nuxt/eslint',
    [
      'unplugin-icons/nuxt',
      {
        customCollections: {
          ztgict: FileSystemIconLoader('./app/assets/icons/ztgict'),
          nova: FileSystemIconLoader('./app/assets/icons/nova'),
          images: FileSystemIconLoader('./app/assets/images'),
        },
      },
    ],
    'vuetify-nuxt-module',
  ],

  eslint: {
    config: {
      stylistic: true,
    },
  },

  build: {
    transpile: ['@vuepic/vue-datepicker'],
  },

  vite: {
    build: {
      modulePreload: {
        polyfill: false,
      },
    },
    define: {
      'process.env.DEBUG': false,
      // load-env.jsで読み込んだ環境変数をビルド時に埋め込む
      'import.meta.env.NUXT_PUBLIC_API_SERVER': JSON.stringify(process.env.NUXT_PUBLIC_API_SERVER || ''),
      'import.meta.env.USE_STUB': process.env.USE_STUB === 'true',
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/assets/_variable.scss" as v;
          `,
        },
      },
    },
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'date-fns/locale',
        'dayjs',
        'dayjs/plugin/isBetween',
        'dayjs/plugin/isSameOrAfter',
        'dayjs/plugin/isSameOrBefore',
        'dayjs/plugin/utc',
        'dayjs/plugin/timezone',
        'es-toolkit',
        'highcharts-vue',
        'highcharts',
        'highcharts/modules/exporting',
        'highcharts/modules/offline-exporting',
        'html-to-image',
        'jspdf',
        'markdown-it-link-attributes',
        'markdown-it',
        'mitt',
        'nanoid',
        'papaparse',
        'qrcode',
        'svg2pdf.js',
        'vue-i18n',
      ],
    },
  },

  typescript: {
    // 型検査はビルドから切り離し、`npm run typecheck` で個別に実行する
    // （ビルド中に vue-tsc が別プロセスで動くとメモリ使用量が大きく増えるため）
    typeCheck: false,
    tsConfig: {
      compilerOptions: {
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        noErrorTruncation: true,
      },
    },
  },

  vuetify: {
    moduleOptions: {
      prefixComposables: true,
      styles: {
        configFile: 'assets/vuetify.scss',
      },
    },
    vuetifyOptions: './vuetify.config.ts',
  },

  css: ['@/assets/main.scss', '@vuepic/vue-datepicker/dist/main.css'],
  compatibilityDate: '2024-09-03',
})
