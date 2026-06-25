import { useState, useEffect } from 'react'

export function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!target) { setValue(0); return }
    const steps = 40
    const increment = target / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setValue(target)
        clearInterval(timer)
      } else {
        setValue(Math.floor(current))
      }
    }, interval)
    return () => clearInterval(timer)
  }, [target, duration])

  return value
}
