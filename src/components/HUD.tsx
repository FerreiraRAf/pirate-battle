import React from 'react'

interface HUDProps {
  hp: number
  maxHp: number
  score: number
  timeLeft: number
  isPaused: boolean
  onTogglePause: () => void
  captainName?: string
}

// All visible text in one place (the challenge requires an English UI: translate here).
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

const UI = '/assets/png/default/ui'

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
      <style>{css}</style>

      {/* Screen-reader summary: changes only on health, score or pause (never per frame). */}
      <div className="hud-sr" role="status" aria-live="polite">
        {TEXT.announce(hp, maxHp, score, isPaused)}
      </div>

      <div className="hud-top">
        <div className="hud-plaque hud-health">
          <div className="hud-row">
            <img className="hud-icon" src={`${UI}/hud/icon_heart.png`} alt="" onError={hideOnError} />
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
          <img className="hud-icon" src={`${UI}/hud/icon_time.png`} alt="" onError={hideOnError} />
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
            <img className="hud-icon" src={`${UI}/hud/icon_score.png`} alt="" onError={hideOnError} />
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
            <img className="hud-pause-icon" src={`${UI}/controls/icon_pause.png`} alt="" onError={hideOnError} />
            {isPaused ? TEXT.resume : TEXT.pause}
          </button>
        </div>
      </div>
    </div>
  )
}

const css = `
.hud-root {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  box-sizing: border-box;
  pointer-events: none;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #3b2a1a;
}

.hud-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.hud-plaque {
  background-color: #f3d9a4;
  background-image: url('/assets/png/default/tiles/tile_4.png');
  background-size: 140px;
  border: 3px solid #8a6a2f;
  border-radius: 14px;
  box-shadow: 0 5px 0 #7a5a2a, 0 10px 14px rgba(0, 40, 70, 0.3);
}

.hud-row { display: flex; align-items: center; gap: 8px; }
.hud-row-end { justify-content: flex-end; }
.hud-icon { width: 22px; height: 22px; object-fit: contain; }

/* Health */
.hud-health { padding: 10px 14px 12px; width: 250px; }
.hud-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
  font-size: 15px;
}
.hud-hp-text { font-weight: 700; font-size: 13px; }
.hud-bar {
  height: 16px;
  margin-top: 8px;
  overflow: hidden;
  background: rgba(59, 42, 26, 0.25);
  border: 2px solid #8a6a2f;
  border-radius: 10px;
}
.hud-bar-fill { height: 100%; transition: width 0.25s ease, background-color 0.25s ease; }
.hud-ok { background: #2f9e44; }
.hud-warn { background: #e8a317; }
.hud-low { background: #c92a2a; }

/* Time */
.hud-time { display: flex; align-items: center; gap: 8px; padding: 8px 18px; }
.hud-time-value {
  font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
  font-size: 32px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.hud-time-low { color: #b3261e; }

/* Score */
.hud-score { padding: 10px 14px; min-width: 150px; text-align: right; }
.hud-score-label { font-weight: 700; font-size: 13px; }
.hud-score-value {
  display: block;
  font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.1;
  color: #2f7d3a;
}

/* Bottom bar */
.hud-bottom { display: flex; justify-content: center; }
.hud-bottom-bar { display: flex; align-items: center; gap: 20px; padding: 8px 14px; }
.hud-keys { list-style: none; margin: 0; padding: 0; display: flex; gap: 18px; }
.hud-keys li { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.hud-key {
  min-width: 26px;
  padding: 2px 8px;
  text-align: center;
  font: 700 13px 'Segoe UI', sans-serif;
  color: #3b2a1a;
  background: #fff8e6;
  border: 2px solid #8a6a2f;
  border-bottom-width: 4px;
  border-radius: 6px;
}
.hud-key-wide { padding: 2px 12px; }

.hud-pause {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
  font-size: 16px;
  font-weight: 800;
  color: #3b2a1a;
  background: #fff8e6;
  border: 2px solid #8a6a2f;
  border-bottom-width: 5px;
  border-radius: 10px;
  cursor: pointer;
  pointer-events: auto;
}
.hud-pause:hover { background: #ffffff; }
.hud-pause:active { transform: translateY(3px); border-bottom-width: 2px; }
.hud-pause:focus-visible { outline: 3px solid #0b5f95; outline-offset: 3px; }
.hud-pause-icon { width: 14px; height: 14px; object-fit: contain; }

/* Narrow screens: smaller plaques */
@media (max-width: 720px) {
  .hud-root { padding: 8px; }
  .hud-health { width: 170px; padding: 8px 10px 10px; }
  .hud-name { font-size: 13px; }
  .hud-time { padding: 6px 12px; }
  .hud-time-value { font-size: 26px; }
  .hud-score { min-width: 0; padding: 8px 10px; }
  .hud-score-label { display: none; }
  .hud-score-value { font-size: 28px; }
}

/* Touch devices: keyboard hints are noise, keep only the pause button */
@media (pointer: coarse) {
  .hud-keys { display: none; }
}
`