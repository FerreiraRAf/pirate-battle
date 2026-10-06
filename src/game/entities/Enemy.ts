import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { SPRITE_HEADING_OFFSET, type GameConfig } from '../config'
import { clamp, normalizeAngle } from '../utils/math'
import { damageTint, drawHealthBar } from '../utils/visuals'
import type { Island } from './Island'
import { Projectile } from './Projectile'

export type EnemyType = 'chaser' | 'shooter'

export class Enemy {
  public readonly container = new Container()
  public readonly type: EnemyType
  public readonly radius: number
  public readonly maxHp: number
  public hp: number
  public heading: number
  public isDead = false

  private readonly config: GameConfig
  private readonly shipLayer = new Container() 
  private readonly body: Sprite | Graphics
  private readonly healthBar = new Graphics()
  private readonly speed: number
  private readonly turnSpeed: number
  private fireTimer: number
  private hitFlash = 0

  constructor(
    x: number,
    y: number,
    type: EnemyType,
    config: GameConfig,
    heading: number,
    texture?: Texture
  ) {
    const spec = config.enemies[type]
    this.config = config
    this.type = type
    this.radius = spec.radius
    this.maxHp = spec.hp
    this.hp = spec.hp
    this.speed = spec.speed
    this.turnSpeed = spec.turnSpeed
    this.heading = heading
    this.fireTimer = config.enemies.shooter.fireCooldown * 0.5
    this.container.x = x
    this.container.y = y

    if (texture) {
      const s = new Sprite(texture)
      s.anchor.set(0.5)
      const aspect = s.texture.width / (s.texture.height || 1)
      s.height = this.radius * 2
      s.width = this.radius * 2 * aspect
      s.rotation = SPRITE_HEADING_OFFSET
      this.body = s
    } else {
      this.body = new Graphics().circle(0, 0, this.radius).fill(type === 'chaser' ? 0xd90429 : 0xf77f00)
    }

    this.shipLayer.addChild(this.body)
    this.shipLayer.rotation = heading
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
    target: { x: number; y: number },
    islands: Island[],
    bounds: { width: number; height: number },
    onShoot: (projectile: Projectile) => void,
    projectileTexture?: Texture
  ): void {
    if (this.isDead) return

    if (this.hitFlash > 0) {
      this.hitFlash -= dt
      if (this.hitFlash <= 0) this.refreshVisuals()
    }

    const dx = target.x - this.x
    const dy = target.y - this.y
    const dist = Math.hypot(dx, dy)
    const bearing = Math.atan2(dy, dx)
    const shooter = this.config.enemies.shooter

    const advancing = this.type === 'chaser' || dist > shooter.stopDistance
    const desired = advancing ? this.avoidIslands(bearing, islands) : bearing

    const maxTurn = this.turnSpeed * dt
    this.heading += clamp(normalizeAngle(desired - this.heading), -maxTurn, maxTurn)
    this.shipLayer.rotation = this.heading

    if (advancing) {
      this.container.x = clamp(this.x + Math.cos(this.heading) * this.speed * dt, this.radius, bounds.width - this.radius)
      this.container.y = clamp(this.y + Math.sin(this.heading) * this.speed * dt, this.radius, bounds.height - this.radius)
    }

    if (this.type === 'shooter') {
      this.fireTimer = Math.max(0, this.fireTimer - dt)
      if (this.fireTimer === 0 && dist <= shooter.attackRange) {
        this.fireTimer = shooter.fireCooldown
        const px = this.x + Math.cos(bearing) * this.radius
        const py = this.y + Math.sin(bearing) * this.radius
        onShoot(new Projectile(px, py, bearing, this.config.projectiles.enemy, true, projectileTexture))
      }
    }
  }

 
  private avoidIslands(desired: number, islands: Island[]): number {
    const { lookAhead, margin, strength } = this.config.enemies.avoidance
    const vx = Math.cos(desired)
    const vy = Math.sin(desired)
    let sx = vx
    let sy = vy

    for (const island of islands) {
      const dx = island.container.x - this.x
      const dy = island.container.y - this.y
      const dist = Math.hypot(dx, dy)
      const reach = island.radius + this.radius + margin
      if (dist > reach + lookAhead) continue

      const ahead = dx * vx + dy * vy
      if (ahead <= 0) continue 

      const cross = vx * dy - vy * dx 
      if (Math.abs(cross) > reach) continue 

      const weight = 1 - clamp((dist - reach) / lookAhead, 0, 1)
      const px = cross > 0 ? vy : -vy
      const py = cross > 0 ? -vx : vx
      sx += px * strength * weight
      sy += py * strength * weight
    }
    return Math.atan2(sy, sx)
  }

  public takeDamage(amount: number): void {
    if (this.isDead) return
    this.hp = Math.max(0, this.hp - amount)
    this.hitFlash = this.config.effects.hitFlashSeconds
    if (this.hp <= 0) this.isDead = true
    this.refreshVisuals()
  }

  private refreshVisuals(): void {
    const pct = this.hp / this.maxHp
    drawHealthBar(this.healthBar, pct, 32, 4, -this.radius - 10)
    this.body.tint = this.hitFlash > 0 ? 0xff5555 : damageTint(pct)
  }

  public destroy(): void {
    this.container.destroy({ children: true })
  }
}