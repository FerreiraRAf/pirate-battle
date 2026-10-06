import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { SPRITE_HEADING_OFFSET, type GameConfig } from '../config'
import type { InputManager } from '../systems/InputManager'
import { clamp } from '../utils/math'
import { damageTint, drawHealthBar } from '../utils/visuals'
import { Projectile } from './Projectile'

type ShootFn = (projectile: Projectile) => void

export class PlayerShip {
  public readonly container = new Container()
  public readonly radius: number
  public readonly maxHp: number
  public hp: number
  public heading = -Math.PI / 2 // Virado para cima

  private readonly config: GameConfig
  private readonly shipLayer = new Container() 
  private readonly body: Sprite | Graphics
  private readonly healthBar = new Graphics()

  private speed = 0
  private frontCooldown = 0
  private leftCooldown = 0
  private rightCooldown = 0
  private hitFlash = 0

  constructor(x: number, y: number, config: GameConfig, texture?: Texture) {
    this.config = config
    this.radius = config.player.radius
    this.maxHp = config.player.maxHp
    this.hp = config.player.maxHp
    this.container.x = x
    this.container.y = y

    if (texture) {
      const s = new Sprite(texture)
      s.anchor.set(0.5)
      const aspect = s.texture.width / (s.texture.height || 1)
      s.height = 48
      s.width = 48 * aspect
      s.rotation = SPRITE_HEADING_OFFSET
      this.body = s
    } else {
      this.body = new Graphics()
        .rect(-15, -10, 30, 20)
        .fill(0xe63946)
        .stroke({ width: 2, color: 0xffffff })
    }

    this.shipLayer.addChild(this.body)
    this.shipLayer.rotation = this.heading
    this.container.addChild(this.shipLayer, this.healthBar)
    this.refreshVisuals()
  }

  public get x(): number {
    return this.container.x
  }

  public get y(): number {
    return this.container.y
  }

  public update(
    dt: number,
    input: InputManager,
    bounds: { width: number; height: number },
    onShoot: ShootFn,
    projectileTexture?: Texture
  ): void {
    const cfg = this.config.player

    this.frontCooldown = Math.max(0, this.frontCooldown - dt)
    this.leftCooldown = Math.max(0, this.leftCooldown - dt)
    this.rightCooldown = Math.max(0, this.rightCooldown - dt)

    if (this.hitFlash > 0) {
      this.hitFlash -= dt
      if (this.hitFlash <= 0) this.refreshVisuals()
    }

    // Rotation
    const turnLeft = input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')
    const turnRight = input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')
    this.heading += ((turnRight ? 1 : 0) - (turnLeft ? 1 : 0)) * cfg.turnSpeed * dt
    this.shipLayer.rotation = this.heading

    // Thrust / drag / reverse
    const forward = input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')
    const backward = input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')
    if (forward) {
      this.speed = Math.min(this.speed + cfg.acceleration * dt, cfg.maxSpeed)
    } else {
      this.speed *= Math.pow(cfg.drag, dt)
    }
    if (backward) {
      this.speed = Math.max(this.speed - (cfg.acceleration / 2) * dt, -cfg.maxSpeed * cfg.reverseSpeedRatio)
    }

    // Movement, kept inside the visible arena
    const m = cfg.arenaMargin
    this.container.x = clamp(this.x + Math.cos(this.heading) * this.speed * dt, m, bounds.width - m)
    this.container.y = clamp(this.y + Math.sin(this.heading) * this.speed * dt, m, bounds.height - m)

    // Weapons
    if (input.isKeyDown('Space') && this.frontCooldown <= 0) {
      this.frontCooldown = cfg.front.cooldown
      this.fireFront(onShoot, projectileTexture)
    }
    if (input.isKeyDown('KeyQ') && this.leftCooldown <= 0) {
      this.leftCooldown = cfg.side.cooldown
      this.fireBroadside(-1, onShoot, projectileTexture)
    }
    if (input.isKeyDown('KeyE') && this.rightCooldown <= 0) {
      this.rightCooldown = cfg.side.cooldown
      this.fireBroadside(1, onShoot, projectileTexture)
    }
  }

  private fireFront(onShoot: ShootFn, texture?: Texture): void {
    const nx = this.x + Math.cos(this.heading) * this.radius
    const ny = this.y + Math.sin(this.heading) * this.radius
    onShoot(new Projectile(nx, ny, this.heading, this.config.projectiles.player, false, texture))
  }

  /** side: -1 = port (left), +1 = starboard (right). Shots are PARALLEL, spread along the hull. */
  private fireBroadside(side: 1 | -1, onShoot: ShootFn, texture?: Texture): void {
    const { projectiles: count, spacing } = this.config.player.side
    const dir = this.heading + side * (Math.PI / 2)
    const fx = Math.cos(this.heading)
    const fy = Math.sin(this.heading)
    const sx = Math.cos(dir)
    const sy = Math.sin(dir)

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spacing
      const px = this.x + sx * this.radius + fx * offset
      const py = this.y + sy * this.radius + fy * offset
      onShoot(new Projectile(px, py, dir, this.config.projectiles.player, false, texture))
    }
  }

  public takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount)
    this.hitFlash = this.config.effects.hitFlashSeconds
    this.refreshVisuals()
  }

  private refreshVisuals(): void {
    const pct = this.hp / this.maxHp
    drawHealthBar(this.healthBar, pct, 40, 6, -this.radius - 12)
    this.body.tint = this.hitFlash > 0 ? 0xff5555 : damageTint(pct)
  }

  public destroy(): void {
    this.container.destroy({ children: true })
  }
}