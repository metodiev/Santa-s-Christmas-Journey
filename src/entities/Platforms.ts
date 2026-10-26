import Phaser from 'phaser';
import { DEPTH } from '../config';
import type {
  CrumblingPlatformDef, MovingPlatformDef, TimedPlatformDef, TownId,
} from '../types';
import type { Santa } from './Santa';

export function addStaticZone(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  w: number,
  h: number,
  oneWay: boolean,
): Phaser.Physics.Arcade.Image {
  const zone = group.create(x + w / 2, y + h / 2, 'pixel') as Phaser.Physics.Arcade.Image;
  zone.setDisplaySize(w, h);
  zone.setVisible(false);
  zone.refreshBody();
  const body = zone.body as Phaser.Physics.Arcade.StaticBody;
  body.checkCollision.up = true;
  body.checkCollision.down = !oneWay;
  body.checkCollision.left = !oneWay;
  body.checkCollision.right = !oneWay;
  void scene;
  return zone;
}

function makePlatformVisual(
  scene: Phaser.Scene,
  town: TownId,
  x: number,
  y: number,
  w: number,
): Phaser.GameObjects.TileSprite {
  return scene.add.tileSprite(x, y, w, 40, `tile-${town}-platform`)
    .setOrigin(0, 0)
    .setDepth(DEPTH.ground + 1);
}

export class MovingPlatform {
  readonly def: MovingPlatformDef;
  readonly visual: Phaser.GameObjects.TileSprite;
  x: number;
  y: number;
  private startX: number;
  private startY: number;

  constructor(scene: Phaser.Scene, def: MovingPlatformDef, town: TownId) {
    this.def = def;
    this.startX = def.x;
    this.startY = def.y;
    this.x = def.x;
    this.y = def.y;
    this.visual = makePlatformVisual(scene, town, def.x, def.y, def.w);
  }

  update(timeMs: number): { dx: number; dy: number } {
    const range = Math.max(1, this.def.range);
    const t = (timeMs / 1000) * (this.def.speed / range) + (this.def.phase ?? 0);
    const offset = Math.sin(t) * range;
    const nx = this.def.axis === 'x' ? this.startX + offset : this.startX;
    const ny = this.def.axis === 'y' ? this.startY + offset : this.startY;
    const dx = nx - this.x;
    const dy = ny - this.y;
    this.x = nx;
    this.y = ny;
    this.visual.setPosition(nx, ny);
    return { dx, dy };
  }

  standingOn(santa: Santa): boolean {
    const body = santa.body;
    return body.bottom >= this.y - 10 &&
      body.bottom <= this.y + 22 &&
      body.right > this.x + 4 &&
      body.left < this.x + this.def.w - 4 &&
      body.velocity.y >= -20;
  }

  destroy(): void {
    this.visual.destroy();
  }
}

export class TimedPlatform {
  readonly def: TimedPlatformDef;
  readonly visual: Phaser.GameObjects.TileSprite;
  readonly zone: Phaser.Physics.Arcade.Image;
  active = true;

  constructor(
    scene: Phaser.Scene,
    def: TimedPlatformDef,
    town: TownId,
    group: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.def = def;
    this.visual = makePlatformVisual(scene, town, def.x, def.y, def.w);
    this.zone = addStaticZone(scene, group, def.x, def.y, def.w, Math.max(20, def.h), true);
  }

  update(timeMs: number): void {
    const local = ((timeMs / 1000) + (this.def.phase ?? 0)) % this.def.period;
    const active = local < this.def.period * (this.def.onRatio ?? 0.62);
    if (active === this.active) return;
    this.active = active;
    (this.zone.body as Phaser.Physics.Arcade.StaticBody).enable = active;
    this.visual.setAlpha(active ? 1 : 0.15);
    if (!active) this.visual.setTint(0x9ec9dd);
    else this.visual.clearTint();
  }

  destroy(): void {
    this.visual.destroy();
    this.zone.destroy();
  }
}

export class CrumblingPlatform {
  readonly def: CrumblingPlatformDef;
  readonly visual: Phaser.GameObjects.TileSprite;
  readonly zone: Phaser.Physics.Arcade.Image;
  private state: 'solid' | 'shaking' | 'gone' = 'solid';
  private timer = 0;
  private baseX: number;

  constructor(
    scene: Phaser.Scene,
    def: CrumblingPlatformDef,
    town: TownId,
    group: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.def = def;
    this.baseX = def.x;
    this.visual = makePlatformVisual(scene, town, def.x, def.y, def.w);
    this.zone = addStaticZone(scene, group, def.x, def.y, def.w, Math.max(20, def.h), true);
    this.visual.setTint(0xe0b090);
  }

  update(dt: number, santa: Santa): void {
    if (this.state === 'solid') {
      const body = santa.body;
      const standing = body.bottom >= this.def.y - 8 &&
        body.bottom <= this.def.y + 20 &&
        body.right > this.def.x + 4 &&
        body.left < this.def.x + this.def.w - 4;
      if (standing) {
        this.state = 'shaking';
        this.timer = this.def.delay ?? 0.45;
      }
      return;
    }
    if (this.state === 'shaking') {
      this.timer -= dt;
      this.visual.x = this.baseX + Math.sin(this.timer * 90) * 3;
      if (this.timer <= 0) {
        this.state = 'gone';
        this.timer = this.def.respawn ?? 3.5;
        (this.zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
        this.visual.setAlpha(0.18);
      }
      return;
    }
    this.timer -= dt;
    if (this.timer <= 0) {
      this.state = 'solid';
      this.visual.x = this.baseX;
      this.visual.setAlpha(1);
      (this.zone.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    }
  }

  destroy(): void {
    this.visual.destroy();
    this.zone.destroy();
  }
}
