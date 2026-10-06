import React, { useId, useState } from 'react'
import './StartMenu.css'

interface StartMenuProps {
  onStartGame: (captainName: string) => void
}

const TEXT = {
  title: 'Batalha Naval dos Piratas',
  tagline: 'Afunde os navios inimigos antes que o tempo acabe.',
  nameLabel: 'Nome do capitão',
  namePlaceholder: 'Como devemos te chamar?',
  controlsTitle: 'Controles',
  moveAction: 'Movimentar o navio',
  frontAction: 'Tiro frontal',
  leftAction: 'Bordada esquerda (3 canhões)',
  rightAction: 'Bordada direita (3 canhões)',
  start: 'Ir para a batalha',
}

export const StartMenu: React.FC<StartMenuProps> = ({ onStartGame }) => {
  const [captainName, setCaptainName] = useState('')
  const inputId = useId()
  const canStart = captainName.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canStart) return
    onStartGame(captainName.trim())
  }

  return (
    <main className="sm-root">

      <div className="sm-layout">
        <section className="sm-hero">
          <img
            className="sm-ship"
            src="/assets/png/default/ships/ship_2.png"
            alt=""
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <h1 className="sm-title">{TEXT.title}</h1>
          <p className="sm-tagline">{TEXT.tagline}</p>
        </section>

        <form className="sm-panel" onSubmit={handleSubmit}>
          <label className="sm-label" htmlFor={inputId}>
            {TEXT.nameLabel}
          </label>
          <input
            id={inputId}
            className="sm-input"
            type="text"
            value={captainName}
            onChange={(e) => setCaptainName(e.target.value)}
            placeholder={TEXT.namePlaceholder}
            maxLength={20}
            autoComplete="off"
            autoFocus
            required
          />

          <h2 className="sm-controls-title">{TEXT.controlsTitle}</h2>
          <ul className="sm-controls">
            <li>
              <span className="sm-keys">
                <kbd>W</kbd>
                <kbd>A</kbd>
                <kbd>S</kbd>
                <kbd>D</kbd>
              </span>
              <span>{TEXT.moveAction}</span>
            </li>
            <li>
              <span className="sm-keys">
                <kbd className="sm-wide">Espaço</kbd>
              </span>
              <span>{TEXT.frontAction}</span>
            </li>
            <li>
              <span className="sm-keys">
                <kbd>Q</kbd>
              </span>
              <span>{TEXT.leftAction}</span>
            </li>
            <li>
              <span className="sm-keys">
                <kbd>E</kbd>
              </span>
              <span>{TEXT.rightAction}</span>
            </li>
          </ul>

          <button className="sm-start" type="submit" disabled={!canStart}>
            {TEXT.start}
          </button>
        </form>
      </div>
    </main>
  )
}
