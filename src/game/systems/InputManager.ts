const GAME_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Space', 'KeyQ', 'KeyE',
])

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export class InputManager {
  private keys = new Set<string>()

  /**
   * Keys are only captured while true. The engine turns it off when paused/ended
   * so menus and dialogs keep normal keyboard behavior (Space on a focused button, etc).
   */
  public capture = true

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('blur', this.reset)
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.capture || !GAME_KEYS.has(e.code) || isTypingTarget(e.target)) return
    e.preventDefault() // stops page scroll on Space/arrows
    this.keys.add(e.code)
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (this.capture && e.code === 'Space') e.preventDefault() // avoids clicking a focused button
    this.keys.delete(e.code)
  }

  public isKeyDown(code: string): boolean {
    return this.keys.has(code)
  }

  /** Used by on-screen touch controls: press('Space') on pointerdown, release('Space') on pointerup. */
  public press(code: string): void {
    if (this.capture) this.keys.add(code)
  }

  public release(code: string): void {
    this.keys.delete(code)
  }

  /** Clears everything held, so a pause never accumulates movement or shots. */
  public reset = (): void => {
    this.keys.clear()
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('blur', this.reset)
    this.keys.clear()
  }
}