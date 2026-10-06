import React from 'react'
import './HUD.css'

interface HUDProps {
  hp: number
  maxHp: number
  score: number
  timeLeft: number
  isPaused: boolean
  onTogglePause: () => void
  captainName?: string
}

const TEXT = {
  defaultName: 'Capitão',
  health: 'Vida',
  timeLeft: 'Tempo restante',
  scoreLabel: 'Inimigos afundados',
  left: 'Bordada esquerda',
  front: 'Tiro frontal',
  right: 'Bordada direita',
  pause: 'Pausar',
  resume: 'Continuar',
  keySpace: 'Espaço',
  announce: (hp: number, maxHp: number, score: number, paused: boolean) =>
    `${paused ? 'Jogo pausado. ' : ''}Vida ${hp} de ${maxHp}. Pontuação ${score}.`,
}

export const HUD: React.FC<HUDProps> = ({
  hp,
  maxHp,
  score,
  timeLeft,
  isPaused,
  onTogglePause,
  captainName = TEXT.defaultName,
}) => {
  const hpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const hpLevel = hpPercentage > 50 ? 'ok' : hpPercentage > 25 ? 'warn' : 'low'
  const minutes = Math.floor(timeLeft / 60)
  const seconds = (timeLeft % 60).toString().padStart(2, '0')
  const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none'
  }

  return (
    <div className="hud-root">

      <div className="hud-sr" role="status" aria-live="polite">
        {TEXT.announce(hp, maxHp, score, isPaused)}
      </div>

      <div className="hud-top">
        <div className="hud-plaque hud-health">
          <div className="hud-row">
            <img className="hud-icon" src={`/assets/png/default/ui/hud/icon_heart.png`} alt="" onError={hideOnError} />
            <span className="hud-name">{captainName}</span>
            <span className="hud-hp-text">
              {hp} / {maxHp}
            </span>
          </div>
          <div
            className="hud-bar"
            role="progressbar"
            aria-label={TEXT.health}
            aria-valuemin={0}
            aria-valuemax={maxHp}
            aria-valuenow={hp}
          >
            <div className={`hud-bar-fill hud-${hpLevel}`} style={{ width: `${hpPercentage}%` }} />
          </div>
        </div>

        <div className="hud-plaque hud-time">
          <img className="hud-icon" src={`/assets/png/default/ui/hud/icon_time.png`} alt="" onError={hideOnError} />
          <span
            className={`hud-time-value${timeLeft <= 10 ? ' hud-time-low' : ''}`}
            role="timer"
            aria-label={TEXT.timeLeft}
          >
            {minutes}:{seconds}
          </span>
        </div>

        <div className="hud-plaque hud-score">
          <div className="hud-row hud-row-end">
            <span className="hud-score-label">{TEXT.scoreLabel}</span>
            <img className="hud-icon" src={`/assets/png/default/ui/hud/icon_score.png`} alt="" onError={hideOnError} />
          </div>
          <span className="hud-score-value">{score}</span>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="hud-plaque hud-bottom-bar">
          <ul className="hud-keys" aria-label="Controles">
            <li>
              <kbd className="hud-key">Q</kbd>
              <span>{TEXT.left}</span>
            </li>
            <li>
              <kbd className="hud-key hud-key-wide">{TEXT.keySpace}</kbd>
              <span>{TEXT.front}</span>
            </li>
            <li>
              <kbd className="hud-key">E</kbd>
              <span>{TEXT.right}</span>
            </li>
          </ul>

          <button
            className="hud-pause"
            type="button"
            onClick={(e) => {
              // Drop focus so pressing Space in-game does not click this button again.
              e.currentTarget.blur()
              onTogglePause()
            }}
          >
            <img className="hud-pause-icon" src={`/assets/png/default/ui/controls/icon_pause.png`} alt="" onError={hideOnError} />
            {isPaused ? TEXT.resume : TEXT.pause}
          </button>
        </div>
      </div>
    </div>
  )
}

