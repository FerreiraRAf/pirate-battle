import { useState } from 'react'
import { PixiGame } from './components/PixiGame'
import { GameOver } from './components/GameOver'
import { HUD } from './components/HUD'
import { StartMenu } from './components/StartMenu'
import { createGameConfig, DEFAULT_OPTIONS, type GameConfig } from './game/config'
import type { EndReason, MatchResult } from './game/GameEngine'

type Screen = 'menu' | 'playing' | 'over'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [captainName, setCaptainName] = useState('')

  // One immutable config snapshot per match. matchKey remounts the canvas on every match/retry.
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [matchKey, setMatchKey] = useState(0)

  // Values pushed by the engine (only when they change, never per frame)
  const [hp, setHp] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Loading / failure
  const [progress, setProgress] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Result of the finished match
  const [result, setResult] = useState<MatchResult | null>(null)
  const [reason, setReason] = useState<EndReason>('time')

  const startMatch = (name: string) => {
    const next = createGameConfig(DEFAULT_OPTIONS)
    setCaptainName(name)
    setConfig(next)
    setHp(next.player.maxHp)
    setScore(0)
    setTimeLeft(next.sessionSeconds)
    setIsPaused(false)
    setProgress(0)
    setLoadError(null)
    setResult(null)
    setMatchKey((k) => k + 1)
    setScreen('playing')
  }

  const handleGameOver = (finished: MatchResult) => {
    setResult(finished)
    setScore(finished.score)
    setReason(finished.reason)
    setScreen('over')
  }

  const handleLoadError = (err: unknown) => {
    console.error(err)
    setLoadError(err instanceof Error ? err.message : String(err))
  }

  const isLoading = screen === 'playing' && !loadError && progress < 1

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {config && screen !== 'menu' && (
        <>
          <PixiGame
            key={matchKey}
            config={config}
            isPaused={isPaused}
            onHealthChange={setHp}
            onScoreChange={setScore}
            onTimeChange={setTimeLeft}
            onPauseChange={setIsPaused}
            onLoadProgress={setProgress}
            onLoadError={handleLoadError}
            onGameOver={handleGameOver}
          />
          <HUD
            hp={hp}
            maxHp={config.player.maxHp}
            score={score}
            timeLeft={timeLeft}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((p) => !p)}
            captainName={captainName}
          />
        </>
      )}

      {isLoading && (
        <div style={overlayStyle} role="status">
          <p>Carregando... {Math.round(progress * 100)}%</p>
        </div>
      )}

      {loadError && (
        <div style={overlayStyle} role="alert">
          <p>Failed to load game assets.</p>
          <small style={{ maxWidth: 640 }}>{loadError}</small>
          <button style={buttonStyle} onClick={() => startMatch(captainName)}>
            Tentar Novamente
          </button>
          <button style={{ ...buttonStyle, background: '#334155' }} onClick={() => setScreen('menu')}>
            Voltar para o Menu
          </button>
        </div>
      )}

      {/* The player must resume explicitly, including after an automatic pause. */}
      {screen === 'playing' && isPaused && !loadError && (
        <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Game paused">
          <h2 style={{ margin: 0 }}>Pausado</h2>
          <button style={buttonStyle} autoFocus onClick={() => setIsPaused(false)}>
            Continuar
          </button>
        </div>
      )}

      {screen === 'menu' && <StartMenu onStartGame={startMatch} />}

      {screen === 'over' && result && (
        <GameOver
          score={result.score}
          reason={reason}
          captainName={captainName}
          onRestart={() => startMatch(captainName)}
          onMainMenu={() => setScreen('menu')}
        />
      )}
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 40,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(10, 25, 47, 0.9)',
  color: '#f1f5f9',
  fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  textAlign: 'center',
}

const buttonStyle: React.CSSProperties = {
  background: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 24px',
  fontSize: 16,
  fontWeight: 'bold',
  cursor: 'pointer',
}