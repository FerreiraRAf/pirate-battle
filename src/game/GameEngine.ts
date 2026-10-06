import { Application, Container, Graphics, TilingSprite, type Ticker } from 'pixi.js'
import { ARENA, LOGICAL_HEIGHT, LOGICAL_WIDTH, type GameConfig } from './config'
import { Enemy } from './entities/Enemy'
import { Explosion } from './entities/Explosion'
import { Island } from './entities/Island'
import { PlayerShip } from './entities/PlayerShip'
import { Projectile } from './entities/Projectile'
import { AssetManager } from './systems/AssetManager'
import { CollisionManager } from './systems/CollisionManager'
import { EnemySpawner } from './systems/EnemySpawner'
import { InputManager } from './systems/InputManager'
import { createRng } from './utils/math'

export type EndReason = 'time' | 'death'
export type GameState = 'running' | 'paused' | 'ended'

export interface MatchResult {
  /** Created once per match: use it as the idempotency key when registering the result. */
  matchId: string
  score: number
  reason: EndReason
  playedSeconds: number
  endedAt: string
  seed: number
  config: GameConfig
}

export interface GameCallbacks {
  onHealthChange: (hp: number) => void
  onScoreChange: (score: number) => void
  onTimeChange: (secondsLeft: number) => void
  /** Fired when the engine pauses itself (window blur / hidden tab). The player must resume. */
  onPauseChange: (paused: boolean) => void
  /** Fired exactly once per match. */
  onGameOver: (result: MatchResult) => void
  onLoadProgress?: (progress: number) => void
}

// Fixed simulation step: movement, damage, cooldowns and spawns do not depend on frame rate.
const STEP = 1 / 60
const MAX_FRAME_TIME = 0.1
const MAX_STEPS_PER_FRAME = 6

export class GameEngine {
  private readonly app = new Application()
  private readonly root = new Container()
  private readonly waterLayer = new Container()
  private readonly islandLayer = new Container()
  private readonly shipLayer = new Container()
  private readonly projectileLayer = new Container()
  private readonly effectLayer = new Container()

  private readonly config: GameConfig
  private readonly callbacks: GameCallbacks
  private readonly seed: number
  private readonly matchId = crypto.randomUUID()
  private readonly inputManager = new InputManager()
  private readonly spawner: EnemySpawner

  private state: GameState = 'running'
  private appReady = false
  private appDestroyed = false
  private isInitialized = false
  private isDestroyed = false

  private accumulator = 0
  private elapsed = 0
  private score = 0
  private lastTimeLeft = -1

  private player?: PlayerShip
  private waterBg?: TilingSprite
  private islands: Island[] = []
  private projectiles: Projectile[] = []
  private enemies: Enemy[] = []
  private explosions: Explosion[] = []

  constructor(config: GameConfig, callbacks: GameCallbacks, seed: number = Date.now() >>> 0) {
    this.config = config
    this.callbacks = callbacks
    this.seed = seed
    this.spawner = new EnemySpawner(config, createRng(seed))
  }

  public async init(element: HTMLDivElement): Promise<void> {
    await this.app.init({
      resizeTo: window,
      backgroundColor: 0x1d3557,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })
    this.appReady = true
    // React Strict Mode may have unmounted us while Pixi was initializing.
    if (this.isDestroyed) {
      this.destroyApp()
      return
    }

    // Throws AssetLoadError on failure: the UI shows "Try again" and remounts the canvas.
    await AssetManager.loadAssets(this.callbacks.onLoadProgress)
    if (this.isDestroyed) return

    element.appendChild(this.app.canvas)
    this.app.stage.addChild(this.root)
    this.root.addChild(this.waterLayer, this.islandLayer, this.shipLayer, this.projectileLayer, this.effectLayer)

    this.buildScene()
    this.layout()
    this.app.renderer.on('resize', this.layout)
    this.app.ticker.add(this.tick)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    window.addEventListener('blur', this.onWindowBlur)

    this.isInitialized = true
    this.callbacks.onHealthChange(this.player?.hp ?? this.config.player.maxHp)
    this.callbacks.onScoreChange(0)
    this.emitTime()
  }

  private buildScene(): void {
    const waterTex = AssetManager.getTexture('water')
    if (waterTex) {
      this.waterBg = new TilingSprite({ texture: waterTex, width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT })
      this.waterLayer.addChild(this.waterBg)
    } else {
      this.waterLayer.addChild(new Graphics().rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT).fill(0x1d3557))
    }

    this.islands = this.config.islands.map(
      (i, index) => new Island(i.x * LOGICAL_WIDTH, i.y * LOGICAL_HEIGHT, i.radius, index)
    )
    this.islands.forEach((island) => this.islandLayer.addChild(island.container))

    this.player = new PlayerShip(
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT / 2 + this.config.player.spawnYOffset,
      this.config,
      AssetManager.getTexture('player')
    )
    this.shipLayer.addChild(this.player.container)
  }

  /** Fits the logical arena to the screen, preserving aspect ratio. Runs on every renderer resize. */
  private layout = (): void => {
    const w = this.app.screen.width
    const h = this.app.screen.height
    const scale = Math.max(0.1, Math.min(w / LOGICAL_WIDTH, h / LOGICAL_HEIGHT))
    this.root.scale.set(scale)
    this.root.x = (w - LOGICAL_WIDTH * scale) / 2
    this.root.y = (h - LOGICAL_HEIGHT * scale) / 2
  }

  // -------------------------------------------------------------------------
  // Loop
  // -------------------------------------------------------------------------

  private get running(): boolean {
    return this.state === 'running'
  }

  private tick = (ticker: Ticker): void => {
    if (!this.running) return // paused or ended: the simulation is frozen

    const frameTime = Math.min(ticker.deltaMS / 1000, MAX_FRAME_TIME)
    this.accumulator += frameTime

    let steps = 0
    while (this.accumulator >= STEP && this.running && steps < MAX_STEPS_PER_FRAME) {
      this.step(STEP)
      this.accumulator -= STEP
      steps += 1
    }
    if (steps === MAX_STEPS_PER_FRAME) this.accumulator = 0 // drop backlog instead of spiraling

    if (this.waterBg) {
      this.waterBg.tilePosition.x -= 18 * frameTime
      this.waterBg.tilePosition.y -= 12 * frameTime
    }
  }

  private step(dt: number): void {
    const player = this.player
    if (!player) return

    this.elapsed = Math.min(this.elapsed + dt, this.config.sessionSeconds)
    const cannonTex = AssetManager.getTexture('cannonball')

    // 1. Player
    player.update(dt, this.inputManager, ARENA, (p) => this.addProjectile(p), cannonTex)
    CollisionManager.handlePlayerIslandCollisions(player, this.islands)

    // 2. Spawns
    this.spawner.update(dt, { x: player.x, y: player.y }, this.islands, ARENA, (enemy) => {
      this.enemies.push(enemy)
      this.shipLayer.addChild(enemy.container)
    })

    // 3. Enemies
    const target = { x: player.x, y: player.y }
    for (const enemy of this.enemies) {
      enemy.update(dt, target, this.islands, ARENA, (p) => this.addProjectile(p), cannonTex)
    }
    CollisionManager.handleEnemyIslandCollisions(this.enemies, this.islands)

    // 4. Projectiles
    for (const p of this.projectiles) p.update(dt, ARENA)

    CollisionManager.handleProjectileCollisions(this.projectiles, this.enemies, player, this.islands, {
      onExplosion: (x, y, scale) => this.createExplosion(x, y, scale),
      onEnemyKilled: () => this.addScore(),
      onPlayerHit: (damage) => this.damagePlayer(damage),
    })
    CollisionManager.handleChaserImpacts(player, this.enemies, this.config, {
      onExplosion: (x, y, scale) => this.createExplosion(x, y, scale),
      onPlayerHit: (damage) => this.damagePlayer(damage),
    })

    // 5. Cleanup + effects
    this.sweep()
    for (const exp of this.explosions) exp.update(dt)

    // 6. End conditions (death wins over time if both happen in the same step)
    if (player.hp <= 0) {
      this.createExplosion(player.x, player.y, 1.8)
      this.endGame('death')
      return
    }
    this.emitTime()
    if (this.elapsed >= this.config.sessionSeconds) this.endGame('time')
  }

  private sweep(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].isDead) {
        this.enemies[i].destroy()
        this.enemies.splice(i, 1)
      }
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (this.projectiles[i].isDead) {
        this.projectiles[i].destroy()
        this.projectiles.splice(i, 1)
      }
    }
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      if (this.explosions[i].isDead) {
        this.explosions[i].destroy()
        this.explosions.splice(i, 1)
      }
    }
  }

  // -------------------------------------------------------------------------
  // Helpers that talk to React (only when a value actually changes)
  // -------------------------------------------------------------------------

  private addProjectile(projectile: Projectile): void {
    this.projectiles.push(projectile)
    this.projectileLayer.addChild(projectile.container)
    this.createExplosion(projectile.container.x, projectile.container.y, 0.35) // muzzle flash
  }

  private createExplosion(x: number, y: number, scale = 1): void {
    const explosion = new Explosion(x, y, AssetManager.getTexture('explosion'), scale, this.config.effects.explosionSeconds)
    this.explosions.push(explosion)
    this.effectLayer.addChild(explosion.container)
  }

  private addScore(): void {
    this.score += 1
    this.callbacks.onScoreChange(this.score)
  }

  private damagePlayer(damage: number): void {
    if (!this.player) return
    this.player.takeDamage(damage)
    this.callbacks.onHealthChange(this.player.hp)
  }

  private emitTime(): void {
    const left = Math.max(0, Math.ceil(this.config.sessionSeconds - this.elapsed))
    if (left !== this.lastTimeLeft) {
      this.lastTimeLeft = left
      this.callbacks.onTimeChange(left)
    }
  }

  private endGame(reason: EndReason): void {
    if (this.state === 'ended') return // onGameOver fires exactly once
    this.state = 'ended'
    this.inputManager.capture = false
    this.inputManager.reset()
    this.callbacks.onGameOver({
      matchId: this.matchId,
      score: this.score,
      reason,
      playedSeconds: Math.round(this.elapsed * 100) / 100,
      endedAt: new Date().toISOString(),
      seed: this.seed,
      config: this.config,
    })
  }

  // -------------------------------------------------------------------------
  // Pause
  // -------------------------------------------------------------------------

  public setPaused(paused: boolean): void {
    if (!this.isInitialized || this.state === 'ended') return
    const next: GameState = paused ? 'paused' : 'running'
    if (this.state === next) return

    this.state = next
    this.inputManager.capture = !paused
    this.inputManager.reset() // nothing held before/during the pause carries over
    this.accumulator = 0 // no catch-up simulation on resume
  }

  private autoPause(): void {
    if (!this.running) return
    this.setPaused(true)
    this.callbacks.onPauseChange(true)
  }

  private onVisibilityChange = (): void => {
    if (document.hidden) this.autoPause()
  }

  private onWindowBlur = (): void => {
    this.autoPause()
  }

  // -------------------------------------------------------------------------
  // Teardown (safe to call at any point, including during init)
  // -------------------------------------------------------------------------

  public destroy(): void {
    if (this.isDestroyed) return
    this.isDestroyed = true
    this.inputManager.destroy()
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    window.removeEventListener('blur', this.onWindowBlur)
    // If Pixi is still initializing, init() will see isDestroyed and clean up by itself.
    if (this.appReady) this.destroyApp()
  }

  private destroyApp(): void {
    if (this.appDestroyed) return
    this.appDestroyed = true
    this.app.ticker.remove(this.tick)
    this.app.renderer.off('resize', this.layout)

    this.enemies = []
    this.projectiles = []
    this.explosions = []
    this.islands = []
    this.player = undefined
    this.waterBg = undefined

    // texture: false -> textures are shared through AssetManager and reused by the next match.
    this.app.destroy(true, { children: true, texture: false })
  }
}