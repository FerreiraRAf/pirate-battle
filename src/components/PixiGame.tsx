import React, { useEffect, useRef } from 'react'
import type { GameConfig } from '../game/config'
import { GameEngine, type GameCallbacks } from '../game/GameEngine'

interface PixiGameProps extends GameCallbacks {
  /** Snapshot for this match. Create it once per match and keep the reference stable. */
  config: GameConfig
  /** Optional: fixed seed for reproducible matches (tests). */
  seed?: number
  isPaused: boolean
  /** Asset failure. Show a "Try again" button that remounts this component (change its `key`). */
  onLoadError: (error: unknown) => void
}

export const PixiGame: React.FC<PixiGameProps> = (props) => {
  const { config, seed, isPaused } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  // Always call the latest callbacks and pause state without re-creating the engine.
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
        // The player may have paused while assets were still loading: the engine ignores
        // pause requests until it is ready, so re-apply the current state now.
        if (!disposed) engine.setPaused(latest.current.isPaused)
      })
      .catch((err) => {
        if (!disposed) latest.current.onLoadError(err)
      })

    // Runs on unmount and on the Strict Mode double-mount.
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
        touchAction: 'none', // no page scroll/zoom while playing on touch screens
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    />
  )
}