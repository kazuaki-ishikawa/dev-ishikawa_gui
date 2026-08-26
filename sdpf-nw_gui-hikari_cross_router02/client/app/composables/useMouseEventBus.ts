// documentに対するマウスイベントを監視し、Listenerに配信する
import mitt from 'mitt'

type ApplicationEvents = {
  click: MouseEvent
}

const emitter = mitt<ApplicationEvents>()

export const useMouseEventListener = (eventType: keyof ApplicationEvents, eventHandler: (e: MouseEvent) => void) => {
  onMounted(() => emitter.on(eventType, eventHandler))
  onUnmounted(() => emitter.off(eventType, eventHandler))
}

export const useMouseEventEmitter = (eventType: keyof ApplicationEvents) => {
  const eventHandler = (e: MouseEvent) => emitter.emit(eventType, e)
  onMounted(() => addEventListener(eventType, eventHandler))
  onUnmounted(() => removeEventListener(eventType, eventHandler))
}
