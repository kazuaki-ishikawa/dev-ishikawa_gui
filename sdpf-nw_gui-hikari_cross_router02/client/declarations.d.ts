// https://github.com/nuxt/nuxt/releases/tag/v3.13.0
// TODO periodically check if this file is still needed, as libraries may update their types
import type {
  ComponentCustomOptions as _ComponentCustomOptions,
  ComponentCustomProperties as _ComponentCustomProperties,
  ComponentCustomProps as _ComponentCustomProps,
} from 'vue'
import type MarkdownIt from 'markdown-it'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties extends _ComponentCustomProperties {}
  interface ComponentCustomOptions extends _ComponentCustomOptions {}
  interface ComponentCustomProps extends _ComponentCustomProps {
    dataCy?: string
  }
}

// https://nuxt.com/docs/guide/directory-structure/plugins#typing-plugins
declare module '#app' {
  interface NuxtApp {
    $md: MarkdownIt
  }
}
