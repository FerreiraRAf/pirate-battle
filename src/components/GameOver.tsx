import React, { useId } from 'react'
import './GameOver.css'

interface GameOverProps {
  score: number
  reason: 'time' | 'death'
  captainName: string
  onRestart: () => void
  onMainMenu?: () => void
}

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
