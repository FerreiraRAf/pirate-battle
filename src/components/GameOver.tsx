import React, { useId } from 'react'

interface GameOverProps {
  score: number
  reason: 'time' | 'death'
  captainName: string
  onRestart: () => void
  /** Optional: when provided, a "Menu principal" button is shown. */
  onMainMenu?: () => void
}

// All visible text in one place (the challenge requires an English UI: translate here).
const TEXT = {
  deathTitle: 'Navio afundado!',
  timeTitle: 'Tempo esgotado!',
  deathMessage: (name: string) => `O capitão ${name} foi superado pelas forças inimigas.`,
  timeMessage: (name: string) => `A batalha do capitão ${name} chegou ao fim.`,
  scoreLabel: 'Navios inimigos destruídos',
  playAgain: 'Jogar novamente',
  mainMenu: 'Menu principal',
}

export const GameOver: React.FC<GameOverProps> = ({
  score,
  reason,
  captainName,
  onRestart,
  onMainMenu,
}) => {
  const titleId = useId()
  const isDeath = reason === 'death'

  return (
    <div className="go-scrim">
      <style>{css}</style>

      <div className="go-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <img
          className="go-icon"
          src={isDeath ? '/assets/png/default/effects/explosion_1.png' : '/assets/png/default/ships/ship_1.png'}
          alt=""
          style={isDeath ? undefined : { transform: 'rotate(180deg)' }}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />

        <h1 id={titleId} className={`go-title ${isDeath ? 'go-death' : 'go-time'}`}>
          {isDeath ? TEXT.deathTitle : TEXT.timeTitle}
        </h1>

        <p className="go-message">
          {isDeath ? TEXT.deathMessage(captainName) : TEXT.timeMessage(captainName)}
        </p>

        <div className="go-score" role="status">
          <span className="go-score-label">{TEXT.scoreLabel}</span>
          <span className="go-score-number">{score}</span>
        </div>

        <button className="go-primary" type="button" autoFocus onClick={onRestart}>
          {TEXT.playAgain}
        </button>
        {onMainMenu && (
          <button className="go-secondary" type="button" onClick={onMainMenu}>
            {TEXT.mainMenu}
          </button>
        )}
      </div>
    </div>
  )
}

const css = `
.go-scrim {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
  overflow-y: auto;
  background: rgba(8, 30, 48, 0.72);
  backdrop-filter: blur(3px);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #3b2a1a;
}

.go-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 440px;
  padding: 28px 28px 30px;
  background-color: #f3d9a4;
  background-image: url('/assets/png/default/tiles/tile_4.png');
  background-size: 160px;
  border: 3px solid #8a6a2f;
  border-radius: 18px;
  box-shadow: 0 10px 0 #7a5a2a, 0 24px 32px rgba(0, 20, 40, 0.45);
  animation: go-pop 0.22s ease-out;
}
@keyframes go-pop {
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.go-icon {
  height: 84px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 6px rgba(60, 40, 10, 0.35));
}

.go-title {
  margin: 12px 0 8px;
  font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
  font-size: clamp(32px, 7vw, 44px);
  line-height: 1.05;
  font-weight: 800;
  color: #ffffff;
  -webkit-text-stroke: 7px var(--go-stroke);
  paint-order: stroke fill;
  text-shadow: 0 5px 0 var(--go-stroke);
}
.go-death { --go-stroke: #5b1a14; }
.go-time { --go-stroke: #0b2a40; }

.go-message {
  margin: 0 0 20px;
  max-width: 30ch;
  font-size: 15px;
  line-height: 1.45;
}

.go-score {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
  padding: 14px 20px;
  margin-bottom: 24px;
  background: #fff8e6;
  border: 2px solid #8a6a2f;
  border-radius: 12px;
}
.go-score-label { font-size: 14px; font-weight: 700; }
.go-score-number {
  font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
  font-size: 56px;
  line-height: 1;
  font-weight: 800;
  color: #2f7d3a;
}

.go-primary,
.go-secondary {
  width: 100%;
  padding: 14px;
  font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
  font-size: 19px;
  font-weight: 800;
  border-radius: 12px;
  cursor: pointer;
}
.go-primary {
  color: #ffffff;
  background: #2f7d3a;
  border: none;
  border-bottom: 5px solid #1f5a29;
}
.go-primary:hover { background: #368a42; }
.go-primary:active { transform: translateY(3px); border-bottom-width: 2px; }

.go-secondary {
  margin-top: 12px;
  color: #3b2a1a;
  background: #fff8e6;
  border: 2px solid #8a6a2f;
  border-bottom-width: 5px;
}
.go-secondary:hover { background: #ffffff; }
.go-secondary:active { transform: translateY(3px); border-bottom-width: 2px; }

.go-primary:focus-visible,
.go-secondary:focus-visible {
  outline: 3px solid #0b5f95;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .go-panel { animation: none; }
}
`