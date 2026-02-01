import { motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '../../lib/cn'

type EncryptedTextProps = {
  text: string
  className?: string
  /** Time in milliseconds between revealing each subsequent real character. */
  revealDelayMs?: number
  /** Optional custom character set to use for the gibberish effect. */
  charset?: string
  /** Time in milliseconds between gibberish flips for unrevealed characters. */
  flipDelayMs?: number
  /** CSS class for styling the encrypted/scrambled characters */
  encryptedClassName?: string
  /** CSS class for styling the revealed characters */
  revealedClassName?: string
}

const DEFAULT_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?'

function generateRandomCharacter(charset: string): string {
  const index = Math.floor(Math.random() * charset.length)
  return charset.charAt(index)
}

function isWhitespaceChar(ch: string): boolean {
  return ch.trim().length === 0
}

function generateGibberishPreservingSpaces(original: string, charset: string): string {
  if (!original) return ''

  let result = ''
  for (let i = 0; i < original.length; i += 1) {
    const ch = original[i]
    result += isWhitespaceChar(ch) ? ch : generateRandomCharacter(charset)
  }

  return result
}

export function EncryptedText({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
}: EncryptedTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  const [revealCount, setRevealCount] = useState(0)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const lastFlipTimeRef = useRef(0)
  const scrambleCharsRef = useRef<string[]>(
    text ? generateGibberishPreservingSpaces(text, charset).split('') : [],
  )

  useEffect(() => {
    if (!isInView) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      // Skip animation entirely - show final text immediately
      setRevealCount(text.length)
      return
    }

    const initial = text ? generateGibberishPreservingSpaces(text, charset) : ''
    scrambleCharsRef.current = initial.split('')
    startTimeRef.current = performance.now()
    lastFlipTimeRef.current = startTimeRef.current
    setRevealCount(0)

    let cancelled = false

    const update = (now: number) => {
      if (cancelled) return

      const elapsedMs = now - startTimeRef.current
      const totalLength = text.length
      const revealIntervalMs = revealDelayMs <= 0 ? 0 : Math.max(1, revealDelayMs)
      const currentRevealCount =
        revealIntervalMs === 0 ? totalLength : Math.min(totalLength, Math.floor(elapsedMs / revealIntervalMs))

      setRevealCount(currentRevealCount)

      if (currentRevealCount >= totalLength) return

      const timeSinceLastFlip = now - lastFlipTimeRef.current
      const flipIntervalMs = Math.max(0, flipDelayMs)
      if (flipIntervalMs > 0 && timeSinceLastFlip >= flipIntervalMs) {
        for (let index = 0; index < totalLength; index += 1) {
          if (index >= currentRevealCount) {
            scrambleCharsRef.current[index] = isWhitespaceChar(text[index])
              ? text[index]
              : generateRandomCharacter(charset)
          }
        }
        lastFlipTimeRef.current = now
      }

      animationFrameRef.current = requestAnimationFrame(update)
    }

    animationFrameRef.current = requestAnimationFrame(update)

    return () => {
      cancelled = true
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isInView, text, revealDelayMs, charset, flipDelayMs])

  // Use aria-hidden during animation to prevent screen readers from reading scrambled text
  // Instead, we use aria-label with the final text for screen readers
  const isAnimating = revealCount < text.length

  if (!text) return null

  return (
    <motion.span
      ref={ref}
      className={cn(className)}
      aria-hidden={isAnimating ? 'true' : undefined}
      aria-label={isAnimating ? undefined : text}
    >
      <span aria-hidden="true" className="sr-only">
        {text}
      </span>
      {text.split('').map((char, index) => {
        const isRevealed = index < revealCount
        const displayChar = isRevealed
          ? char
          : isWhitespaceChar(char)
            ? char
            : (scrambleCharsRef.current[index] ?? generateRandomCharacter(charset))

        return (
          <span key={`${index}-${char}`} className={cn(isRevealed ? revealedClassName : encryptedClassName)}>
            {displayChar}
          </span>
        )
      })}
    </motion.span>
  )
}
