import { Assets, Texture } from 'pixi.js'

export type AssetKey =
  | 'player'
  | 'chaser'
  | 'shooter'
  | 'cannonball'
  | 'explosion'
  | 'water'
  // Island terrain and decoration
  | 'sand'
  | 'grass'
  | 'palm'
  | 'bush'
  | 'plant'
  | 'rock1'
  | 'rock2'
  | 'rock3'
  | 'mossRock'
  | 'leaves'

const TILES = '/assets/png/default/tiles'

const MANIFEST: Record<AssetKey, string> = {
  player: '/assets/png/default/ships/ship_2.png',
  chaser: '/assets/png/default/ships/ship_6.png',
  shooter: '/assets/png/default/ships/ship_3.png',
  cannonball: '/assets/png/default/ship_parts/cannon_ball.png',
  explosion: '/assets/png/default/effects/explosion_1.png',
  water: `${TILES}/tile_73.png`,

  sand: `${TILES}/tile_68.png`,
  grass: `${TILES}/tile_39.png`,
  palm: `${TILES}/tile_71.png`,
  bush: `${TILES}/tile_70.png`,
  plant: `${TILES}/tile_72.png`,
  rock1: `${TILES}/tile_49.png`,
  rock2: `${TILES}/tile_50.png`,
  rock3: `${TILES}/tile_51.png`,
  mossRock: `${TILES}/tile_66.png`,
  leaves: `${TILES}/tile_88.png`,
}

export class AssetLoadError extends Error {
  public readonly failed: string[]

  constructor(failed: string[]) {
    super(`Failed to load ${failed.length} asset(s): ${failed.join(', ')}`)
    this.name = 'AssetLoadError'
    this.failed = failed
  }
}

export class AssetManager {
  private static textures = new Map<AssetKey, Texture>()

  /**
   * Loads every combat texture once. Safe to call again: already-loaded textures are reused,
   * and after a failure calling it again retries only what is missing ("Try again" button).
   */
  public static async loadAssets(onProgress?: (progress: number) => void): Promise<void> {
    const keys = Object.keys(MANIFEST) as AssetKey[]
    const failed: string[] = []
    let done = 0

    await Promise.all(
      keys.map(async (key) => {
        try {
          if (!this.textures.has(key)) {
            const texture = await Assets.load<Texture>(MANIFEST[key])
            if (!(texture instanceof Texture)) throw new Error('Not a texture')
            this.textures.set(key, texture)
          }
        } catch {
          failed.push(MANIFEST[key])
        } finally {
          done += 1
          onProgress?.(done / keys.length)
        }
      })
    )

    if (failed.length > 0) throw new AssetLoadError(failed)
  }

  public static getTexture(key: AssetKey): Texture | undefined {
    return this.textures.get(key)
  }
}