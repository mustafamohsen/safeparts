import {
  motion,
  useMotionTemplate,
  useMotionValue,
  type MotionValue,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent, SVGProps } from 'react'

import { cn } from '../../lib/cn'

type EvervaultCardProps = {
  text?: string
  className?: string
}

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateRandomString(length: number): string {
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))
  }
  return result
}

export function EvervaultCard({ text, className }: EvervaultCardProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const [randomString, setRandomString] = useState('')
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    setRandomString(generateRandomString(1200))
  }, [])

  function onMouseMove(event: MouseEvent<HTMLDivElement>) {
    const { currentTarget, clientX, clientY } = event
    const { left, top } = currentTarget.getBoundingClientRect()

    mouseX.set(clientX - left)
    mouseY.set(clientY - top)

    const now = performance.now()
    if (now - lastUpdateRef.current < 40) return
    lastUpdateRef.current = now

    setRandomString(generateRandomString(1200))
  }

  return (
    <div className={cn('p-0.5 bg-transparent flex items-center justify-center relative', className)}>
      <div
        onMouseMove={onMouseMove}
        role="img"
        aria-label={text ? `${text} cipher card` : 'Cipher card'}
        className="group/card rounded-3xl w-full relative overflow-hidden bg-transparent flex items-center justify-center h-full"
      >
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />

        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-44 w-44 rounded-full flex items-center justify-center text-white font-bold text-4xl">
            <div className="absolute w-full h-full bg-black/75 blur-sm rounded-full" />
            <span className="text-emerald-200 z-20">{text}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

type CardPatternProps = {
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  randomString: string
}

function CardPattern({ mouseX, mouseY, randomString }: CardPatternProps) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`
  const style = { maskImage, WebkitMaskImage: maskImage }

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50" />
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-700 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-emerald-50 font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  )
}

type IconProps = SVGProps<SVGSVGElement>

export function Icon({ className, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <title>Icon</title>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  )
}
