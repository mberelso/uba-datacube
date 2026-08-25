import { useEffect, useState, type DependencyList } from 'react'

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'error'; error: Error; data?: undefined }
  | { status: 'success'; data: T; error?: undefined }

/**
 * Universal useAsync hook mit automatischer AbortController-Verwaltung.
 * Verhindert Race-Conditions und Memory-Leaks beim Unmount/Dependency-Wechsel.
 */
export function useAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })

  useEffect(() => {
    const ac = new AbortController()

    fn(ac.signal)
      .then((data) => {
        if (!ac.signal.aborted) {
          setState({ status: 'success', data })
        }
      })
      .catch((err) => {
        if (ac.signal.aborted || err?.name === 'AbortError') return
        setState({
          status: 'error',
          error: err instanceof Error ? err : new Error(String(err)),
        })
      })

    return () => {
      ac.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
