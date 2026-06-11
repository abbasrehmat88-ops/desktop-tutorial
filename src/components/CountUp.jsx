import { useEffect, useRef, useState } from 'react'

// Animated number that counts up from 0 whenever `value` changes.
export default function CountUp({ value, prefix = '', suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const target = Number(value) || 0
    let start = null
    function step(ts) {
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(target * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <>{prefix}{display.toLocaleString()}{suffix}</>
}
