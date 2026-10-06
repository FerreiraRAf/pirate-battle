import React, { useEffect, useRef } from 'react'
import type { GameConfig } from '../game/config'
import { GameEngine, type GameCallbacks } from '../game/GameEngine'

interface PixiGameProps extends GameCallbacks {

  config: GameConfig

  seed?: number
  isPaused: boolean

  onLoadError: (error: unknown) => void
}

export const PixiGame: React.FC<PixiGameProps> = (props) => {
  const { config, seed, isPaused } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  const latest = useRef(props)
  useEffect(() => {
    latest.current = props
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    const engine = new GameEngine(
      config,
      {
        onHealthChange: (hp) => latest.current.onHealthChange(hp),
        onScoreChange: (score) => latest.current.onScoreChange(score),
        onTimeChange: (seconds) => latest.current.onTimeChange(seconds),
        onPauseChange: (paused) => latest.current.onPauseChange(paused),
        onGameOver: (result) => latest.current.onGameOver(result),
        onLoadProgress: (progress) => latest.current.onLoadProgress?.(progress),
      },
      seed
    )

    engineRef.current = engine
    engine
      .init(container)
      .then(() => {

        if (!disposed) engine.setPaused(latest.current.isPaused)
      })
      .catch((err) => {
        if (!disposed) latest.current.onLoadError(err)
      })

    return () => {
      disposed = true
      engine.destroy()
      engineRef.current = null
    }
  }, [config, seed])

  useEffect(() => {
    engineRef.current?.setPaused(isPaused)
  }, [isPaused])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Arena de batalha naval. O estado da partida está no painel de status."
      style={{
        width: '100%',
        height: '100%',
        background: '#1d3557',
        touchAction: 'none', 
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    />
  )
}