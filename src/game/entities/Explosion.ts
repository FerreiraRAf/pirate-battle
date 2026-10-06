import { Container, Graphics, Sprite, Texture } from 'pixi.js'

export class Explosion {
  public readonly container = new Container()
  public isDead = false

  private age = 0
  private readonly duration: number
  private readonly baseScale: number

  constructor(x: number, y: number, texture: Texture | undefined, scale = 1, duration = 0.33) {
    this.container.x = x
    this.container.y = y
    this.baseScale = scale
    this.duration = duration
    this.container.scale.set(scale)

    if (texture) {
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.width = 45
      sprite.height = 45
      this.container.addChild(sprite)
    } else {
      const g = new Graphics()
      g.circle(0, 0, 18).fill(0xff9900)
      g.circle(0, 0, 10).fill(0xff3300)
      g.circle(0, 0, 4).fill(0xffff00)
      this.container.addChild(g)
    }
  }

  public update(dt: number): void {
    this.age += dt
    const progress = Math.min(1, this.age / this.duration)
    this.container.scale.set(this.baseScale * (1 + progress * 0.8))
    this.container.alpha = 1 - progress
    if (progress >= 1) this.isDead = true
  }

  public destroy(): void {
    this.container.destroy({ children: true })
  }
}