// Central gameplay configuration.
// Units: pixels, seconds, radians. Speeds are per second, never per frame.

export const LOGICAL_WIDTH = 1280
export const LOGICAL_HEIGHT = 720
export const ARENA = { width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT } as const

/**
 * Rotation applied to ship sprites so the art faces +X (heading 0).
 * Your current art needs +90deg (it points up). Change here if the PNGs point elsewhere.
 */
export const SPRITE_HEADING_OFFSET = -Math.PI / 2

// ---------------------------------------------------------------------------
// Player-adjustable options (Options screen)
// ---------------------------------------------------------------------------

/** Documented limits. Session time is required by the challenge (60-180 s). */
export const OPTION_LIMITS = {
  sessionSeconds: { min: 60, max: 180 },
  spawnIntervalSeconds: { min: 1, max: 10 },
} as const

export interface UserOptions {
  sessionSeconds: number
  spawnIntervalSeconds: number
}

export const DEFAULT_OPTIONS: UserOptions = {
  sessionSeconds: 90,
  spawnIntervalSeconds: 3,
}

export type OptionErrors = Partial<Record<keyof UserOptions, string>>

function readNumber(raw: unknown, label: string, min: number, max: number): number | string {
  const n = typeof raw === 'string' && raw.trim() === '' ? NaN : Number(raw)
  if (!Number.isFinite(n)) return `${label} must be a number.`
  if (n < min || n > max) return `${label} must be between ${min} and ${max}.`
  return n
}

/** Accepts raw form values (strings) and returns either a valid value or field errors. */
export function validateOptions(raw: { sessionSeconds: unknown; spawnIntervalSeconds: unknown }): {
  value: UserOptions | null
  errors: OptionErrors
} {
  const errors: OptionErrors = {}
  const s = OPTION_LIMITS.sessionSeconds
  const i = OPTION_LIMITS.spawnIntervalSeconds

  const session = readNumber(raw.sessionSeconds, 'Game session time', s.min, s.max)
  const spawn = readNumber(raw.spawnIntervalSeconds, 'Enemy spawn time', i.min, i.max)

  if (typeof session === 'string') errors.sessionSeconds = session
  else if (!Number.isInteger(session)) errors.sessionSeconds = 'Game session time must be a whole number of seconds.'

  if (typeof spawn === 'string') errors.spawnIntervalSeconds = spawn

  if (Object.keys(errors).length > 0 || typeof session === 'string' || typeof spawn === 'string') {
    return { value: null, errors }
  }
  return { value: { sessionSeconds: session, spawnIntervalSeconds: spawn }, errors }
}

// ---------------------------------------------------------------------------
// Balance (change numbers here, never in the systems)
// ---------------------------------------------------------------------------

export const BALANCE = {
  player: {
    maxHp: 100,
    radius: 20,
    maxSpeed: 240, // px/s
    reverseSpeedRatio: 0.5,
    acceleration: 540, // px/s^2
    drag: 0.3, // fraction of speed left after 1 s without thrust
    turnSpeed: 2.4, // rad/s
    arenaMargin: 30,
    spawnYOffset: 200, // below arena center
    front: { cooldown: 0.25 },
    side: { cooldown: 0.6, projectiles: 3, spacing: 14 },
  },
  projectiles: {
    player: { speed: 450, damage: 20, lifetime: 2, radius: 4 },
    enemy: { speed: 330, damage: 10, lifetime: 2, radius: 4 },
  },
  enemies: {
    chaser: { hp: 40, radius: 22, speed: 120, turnSpeed: 3, contactDamage: 20 },
    shooter: {
      hp: 60,
      radius: 22,
      speed: 84,
      turnSpeed: 2,
      stopDistance: 220,
      attackRange: 450,
      fireCooldown: 1.5,
    },
    avoidance: { lookAhead: 90, margin: 25, strength: 2 },
  },
  spawn: {
    minDistanceFromPlayer: 350,
    edgeMargin: 30,
    islandClearance: 40,
    maxAttempts: 30,
    chaserWeight: 0.6,
    shooterWeight: 0.4,
  },
  // Positions are fractions of the logical arena.
  islands: [
    { x: 0.3, y: 0.35, radius: 130 },
    { x: 0.7, y: 0.65, radius: 130 },
  ],
  effects: { explosionSeconds: 0.33, hitFlashSeconds: 0.1 },
}

export type Balance = typeof BALANCE

export interface GameConfig extends Balance {
  sessionSeconds: number
  spawnIntervalSeconds: number
}

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj)
    Object.values(obj as Record<string, unknown>).forEach(deepFreeze)
  }
  return obj
}

/** Builds the immutable snapshot used by one match. Later option changes do not affect it. */
export function createGameConfig(options: UserOptions): GameConfig {
  const { value } = validateOptions(options)
  if (!value) throw new Error('Invalid game options')
  return deepFreeze({ ...structuredClone(BALANCE), ...value })
}