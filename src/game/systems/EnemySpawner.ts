import type { GameConfig } from '../config'
import { Enemy, type EnemyType } from '../entities/Enemy'
import type { Island } from '../entities/Island'
import type { Rng } from '../utils/math'
import { AssetManager } from './AssetManager'

export class EnemySpawner {
  private readonly config: GameConfig
  private readonly rng: Rng
  private timer = 0
  private spawnCount = 0

  constructor(config: GameConfig, rng: Rng) {
    this.config = config
    this.rng = rng
  }

  public update(
    dt: number,
    player: { x: number; y: number },
    islands: Island[],
    bounds: { width: number; height: number },
    onSpawn: (enemy: Enemy) => void
  ): void {
    this.timer += dt
    const interval = this.config.spawnIntervalSeconds
    if (this.timer < interval) return

    const type = this.pickType()
    const enemy = this.trySpawn(type, player, islands, bounds)
    if (enemy) {
      this.timer -= interval // keep the remainder so the cadence does not drift
      this.spawnCount += 1
      onSpawn(enemy)
    } else {
      this.timer = interval // no safe spot right now: try again on the next step
    }
  }

  private pickType(): EnemyType {
    // Guarantee both types show up early in any default match, then follow the weights.
    if (this.spawnCount === 0) return 'chaser'
    if (this.spawnCount === 1) return 'shooter'
    const { chaserWeight, shooterWeight } = this.config.spawn
    return this.rng() < chaserWeight / (chaserWeight + shooterWeight) ? 'chaser' : 'shooter'
  }

  private trySpawn(
    type: EnemyType,
    player: { x: number; y: number },
    islands: Island[],
    bounds: { width: number; height: number }
  ): Enemy | null {
    const { maxAttempts, minDistanceFromPlayer, islandClearance } = this.config.spawn
    const radius = this.config.enemies[type].radius

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { x, y } = this.randomEdgePoint(bounds)

      if (Math.hypot(x - player.x, y - player.y) < minDistanceFromPlayer) continue

      const blocked = islands.some(
        (island) => Math.hypot(x - island.container.x, y - island.container.y) < island.radius + radius + islandClearance
      )
      if (blocked) continue

      const heading = Math.atan2(player.y - y, player.x - x)
      return new Enemy(x, y, type, this.config, heading, AssetManager.getTexture(type))
    }
    return null
  }

  private randomEdgePoint(bounds: { width: number; height: number }): { x: number; y: number } {
    const m = this.config.spawn.edgeMargin
    const side = Math.floor(this.rng() * 4)
    if (side === 0) return { x: this.rng() * bounds.width, y: m }
    if (side === 1) return { x: bounds.width - m, y: this.rng() * bounds.height }
    if (side === 2) return { x: this.rng() * bounds.width, y: bounds.height - m }
    return { x: m, y: this.rng() * bounds.height }
  }
}