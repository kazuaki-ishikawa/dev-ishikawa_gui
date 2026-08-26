import type { LocationQueryRaw } from 'vue-router'

type PageMeta = {
  fallback: {
    name: string
    params: string[]
    query: LocationQueryRaw
  }
}

export default defineNuxtRouteMiddleware(to => {
  const { consumeNavigation } = useMiddleware()

  const params = Object.fromEntries(Object.entries(to.params).map(([key, value]) => [key, String(value)]))
  const isAllowed = consumeNavigation({ name: String(to.name), params })
  if (isAllowed) {
    return
  }

  const meta = to.meta as PageMeta
  const fallbackParams = Object.fromEntries(meta.fallback.params.map(name => [name, String(to.params[name])]))
  return navigateTo({
    name: meta.fallback.name,
    params: fallbackParams,
    query: meta.fallback.query,
  })
})
