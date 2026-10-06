import type { GameConfig } from '../config'
import type { Enemy } from '../entities/Enemy'
import type { Island } from '../entities/Island'
import type { PlayerShip } from '../entities/PlayerShip'
import type { Projectile } from '../entities/Projectile'
import { checkCircleCollision } from '../utils/collision'

export interface ContactHandlers {
  onExplosion: (x: number, y: number, scale: number) => void
  onPlayerHit: (damage: number) => void
}

export interface ProjectileHandlers extends ContactHandlers {
  /** Called once per enemy destroyed by a player projectile (this is what scores). */
  onEnemyKilled: (enemy: Enemy) => void
}

interface Circle {
  x: number
  y: number
  radius: number
}

/** Pushes a circle out of an island along the line between their centers. */
function pushOutOfIsland(subject: { container: { x: number; y: number } }, radius: number, island: Island): void {
  const sx = subject.container.x
  const sy = subject.container.y
  const ix = island.container.x
  const iy = island.container.y
  if (!checkCircleCollision(sx, sy, radius, ix, iy, island.radius)) return

  const angle = Math.atan2(sy - iy, sx - ix)
  const distance = radius + island.radius + 1
  subject.container.x = ix + Math.cos(angle) * distance
  subject.container.y = iy + Math.sin(angle) * distance
}

export class CollisionManager {
  public static handlePlayerIslandCollisions(player: PlayerShip, islands: Island[]): void {
    for (const island of islands) pushOutOfIsland(player, player.radius, island)
  }

  public static handleEnemyIslandCollisions(enemies: Enemy[], islands: Island[]): void {
    for (const enemy of enemies) {
      if (enemy.isDead) continue
      for (const island of islands) pushOutOfIsland(enemy, enemy.radius, island)
    }
  }

  /** A Chaser touching the player damages it and explodes. This never scores. */
  public static handleChaserImpacts(
    player: PlayerShip,
    enemies: Enemy[],
    config: GameConfig,
    handlers: ContactHandlers
  ): void {
    for (const enemy of enemies) {
      if (enemy.isDead || enemy.type !== 'chaser' || player.hp <= 0) continue
      if (!checkCircleCollision(enemy.x, enemy.y, enemy.radius, player.x, player.y, player.radius)) continue

      enemy.isDead = true
      handlers.onExplosion(enemy.x, enemy.y, 1.4)
      handlers.onPlayerHit(config.enemies.chaser.contactDamage)
    }
  }

  public static handleProjectileCollisions(
    projectiles: Projectile[],
    enemies: Enemy[],
    player: PlayerShip,
    islands: Island[],
    handlers: ProjectileHandlers
  ): void {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]
      if (p.isDead) continue // expired or already spent: never applies damage twice

      const px = p.container.x
      const py = p.container.y

      // Islands block projectiles
      const hitIsland = islands.some((island) =>
        checkCircleCollision(px, py, p.radius, island.container.x, island.container.y, island.radius)
      )
      if (hitIsland) {
        p.isDead = true
        handlers.onExplosion(px, py, 0.6)
        continue
      }

      if (!p.isEnemy) {
        for (const enemy of enemies) {
          if (enemy.isDead) continue
          const target: Circle = { x: enemy.x, y: enemy.y, radius: enemy.radius }
          if (!checkCircleCollision(px, py, p.radius, target.x, target.y, target.radius)) continue

          p.isDead = true
          enemy.takeDamage(p.damage)
          handlers.onExplosion(px, py, 0.6)
          if (enemy.isDead) {
            handlers.onExplosion(enemy.x, enemy.y, 1.4)
            handlers.onEnemyKilled(enemy)
          }
          break
        }
      } else if (player.hp > 0 && checkCircleCollision(px, py, p.radius, player.x, player.y, player.radius)) {
        p.isDead = true
        handlers.onExplosion(px, py, 0.6)
        handlers.onPlayerHit(p.damage)
      }
    }
  }
}