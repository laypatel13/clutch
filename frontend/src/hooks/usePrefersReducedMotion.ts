import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Mirrors the CSS media query into React state.
 *
 * The stylesheet already honours this preference for everything it controls.
 * This exists for the cases it cannot reach — chiefly recharts, which runs its
 * entry animation from JavaScript and would otherwise animate regardless.
 */
export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  )

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const onChange = () => setPrefersReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return prefersReduced
}
