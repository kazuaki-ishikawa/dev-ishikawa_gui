export const useLoading = () => {
  const loadingAnimationState = useState('loadingAnimation', () => false)
  const setLoadingAnimation = (value: boolean) => (loadingAnimationState.value = value)

  const counts = useState('loadingCounts', () => 0)
  const setLoadingState = (load: 'start' | 'end') => {
    if (load === 'start') {
      counts.value++
    } else {
      counts.value--
    }
  }
  const loading = computed(() => counts.value > 0)

  return { loadingAnimation: readonly(loadingAnimationState), setLoadingAnimation, loading, setLoadingState }
}
