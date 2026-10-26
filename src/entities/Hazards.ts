import Phaser from 'phaser';
import { DEPTH, PHYSICS } from '../config';
import type { HazardDef, TownId } from '../types';
import type { Santa } from './Santa';
import { audio } from '../audio/AudioSystem';
import { save } from '../systems/SaveSystem';

export interface HazardSurface {
  sticky?: boolean;
  ice?: boolean;
}

export interface Hazard {
  readonly def: HazardDef;
  update(dt: number, santa: Santa, groundY: number): void;
  surface?(santa: Santa): HazardSurface;
  warningPoint(): { x: number; y: number } | null;
  destroy(): void;
}

function bodyRect(santa: Santa): Phaser.Geom.Rectangle {
  const body = santa.body;
  return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
}

function overlap(santa: Santa, rect: Phaser.Geom.Rectangle): boolean {
  return Phaser.Geom.Intersects.RectangleToRectangle(bodyRect(santa), rect);
}

class IcicleHazard implements Hazard {
  readonly def: HazardDef;
  private scene: Phaser.Scene;
  private image: Phaser.GameObjects.Image;
  private state: 'idle' | 'shaking' | 'falling' | 'gone' = 'idle';
  private timer = 0;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.scene = scene;
    this.def = def;
    this.image = scene.add.image(def.x, def.y, 'props', 'prop-icicle')
      .setOrigin(0.5, 0)
      .setScale(0.7)
      .setDepth(DEPTH.hazard);
  }

  warningPoint(): { x: number; y: number } {
    return { x: this.def.x, y: this.def.y + 20 };
  }

  update(dt: number, santa: Santa, groundY: number): void {
    if (this.state === 'gone') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.image.setPosition(this.def.x, this.def.y).setAlpha(1);
        this.state = 'idle';
      }
      return;
    }
    if (this.state === 'idle' && Math.abs(santa.x - this.def.x) < 95 && santa.y > this.def.y) {
      this.state = 'shaking';
      this.timer = 0.42;
      this.scene.tweens.add({
        targets: this.image,
        x: { from: this.def.x - 4, to: this.def.x + 4 },
        duration: 55,
        yoyo: true,
        repeat: 4,
        onComplete: () => {
          if (this.state === 'shaking') {
            this.state = 'falling';
            this.timer = 0;
            audio.playSfx('woosh');
          }
        },
      });
      return;
    }
    if (this.state === 'falling') {
      this.timer += dt;
      this.image.y += (480 + this.timer * 600) * dt;
      const rect = new Phaser.Geom.Rectangle(this.image.x - 16, this.image.y, 32, 74);
      if (overlap(santa, rect)) {
        santa.hurt(this.image.x);
        this.finish(groundY);
        return;
      }
      if (this.image.y > groundY + 30) {
        this.finish(groundY);
      }
    }
  }

  private finish(groundY: number): void {
    this.state = 'gone';
    this.timer = 3.4;
    this.image.setAlpha(0);
    const burst = this.scene.add.particles(this.def.x, groundY - 6, 'props', { frame: 'particle-snow',
      speed: { min: 30, max: 90 },
      lifespan: 450,
      scale: { start: 0.5, end: 0 },
      quantity: 8,
      emitting: false,
    }).setDepth(DEPTH.fx);
    burst.explode(8);
    this.scene.time.delayedCall(600, () => burst.destroy());
  }

  destroy(): void {
    this.image.destroy();
  }
}

class GearHazard implements Hazard {
  readonly def: HazardDef;
  private image: Phaser.GameObjects.Image;
  private angle = 0;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.def = def;
    this.image = scene.add.image(def.x, def.y, 'props', 'prop-gear')
      .setScale(0.62)
      .setDepth(DEPTH.hazard);
    this.image.setAlpha(0.95);
  }

  warningPoint(): { x: number; y: number } {
    return { x: this.def.x, y: this.def.y - 40 };
  }

  update(dt: number, santa: Santa): void {
    this.angle += 130 * dt;
    this.image.angle = this.angle;
    const radius = this.def.radius ?? 48;
    const circle = new Phaser.Geom.Circle(this.def.x, this.def.y, radius + 20);
    if (Phaser.Geom.Intersects.CircleToRectangle(circle, bodyRect(santa))) {
      santa.hurt(this.def.x);
    }
  }

  destroy(): void {
    this.image.destroy();
  }
}

class SteamHazard implements Hazard {
  readonly def: HazardDef;
  private scene: Phaser.Scene;
  private vent: Phaser.GameObjects.Image;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private active = false;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.scene = scene;
    this.def = def;
    this.vent = scene.add.image(def.x, def.y + 2, 'props', 'prop-steam-vent')
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(DEPTH.hazard);
    this.emitter = scene.add.particles(def.x, def.y - 20, 'props', { frame: 'particle-snow',
      speedY: { min: -190, max: -90 },
      speedX: { min: -22, max: 22 },
      lifespan: { min: 500, max: 900 },
      scale: { start: 0.7, end: 0.05 },
      alpha: { start: 0.42, end: 0 },
      frequency: 45,
      quantity: 1,
      emitting: false,
      tint: 0xf2fbff,
    }).setDepth(DEPTH.hazard - 1);
  }

  warningPoint(): { x: number; y: number } {
    return { x: this.def.x, y: this.def.y - 160 };
  }

  update(dt: number, santa: Santa): void {
    void dt;
    const interval = this.def.interval ?? 2.8;
    const phase = this.def.phase ?? 0;
    const local = (this.scene.time.now / 1000 + phase) % interval;
    const shouldBeActive = local < 0.55;
    if (shouldBeActive !== this.active) {
      this.active = shouldBeActive;
      if (shouldBeActive) this.emitter.start();
      else this.emitter.stop();
    }
    if (shouldBeActive) {
      const rect = new Phaser.Geom.Rectangle(this.def.x - 42, this.def.y - 150, 84, 145);
      if (overlap(santa, rect)) santa.hurt(this.def.x);
    }
  }

  destroy(): void {
    this.vent.destroy();
    this.emitter.destroy();
  }
}

class WindHazard implements Hazard {
  readonly def: HazardDef;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.def = def;
    const force = def.force ?? -250;
    this.emitter = scene.add.particles(def.x + (def.w ?? 200) / 2, def.y + (def.h ?? 300) / 2, 'props', { frame: 'particle-snow',
      x: { min: -(def.w ?? 200) / 2, max: (def.w ?? 200) / 2 },
      y: { min: -(def.h ?? 300) / 2, max: (def.h ?? 300) / 2 },
      speedX: { min: force * 0.6, max: force * 1.4 },
      speedY: { min: -10, max: 10 },
      lifespan: { min: 450, max: 900 },
      scale: { start: 0.25, end: 0.05 },
      alpha: { start: 0.3, end: 0 },
      frequency: 70,
      quantity: 1,
      emitting: true,
    }).setDepth(DEPTH.hazard - 1);
    this.emitter.setBlendMode(Phaser.BlendModes.ADD);
  }

  warningPoint(): { x: number; y: number } {
    return { x: this.def.x + (this.def.w ?? 200) / 2, y: this.def.y };
  }

  update(dt: number, santa: Santa): void {
    const rect = new Phaser.Geom.Rectangle(this.def.x, this.def.y, this.def.w ?? 200, this.def.h ?? 300);
    if (Phaser.Geom.Intersects.RectangleToRectangle(rect, bodyRect(santa))) {
      const body = santa.body;
      body.setVelocityX(body.velocity.x + (this.def.force ?? -250) * dt);
    }
  }

  destroy(): void {
    this.emitter.destroy();
  }
}

class SpikesHazard implements Hazard {
  readonly def: HazardDef;
  private image: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.def = def;
    this.image = scene.add.image(def.x, def.y + 4, 'props', 'prop-ice-spikes')
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(DEPTH.hazard);
  }

  warningPoint(): { x: number; y: number } {
    return { x: this.def.x, y: this.def.y - 26 };
  }

  update(_dt: number, santa: Santa): void {
    const w = this.def.w ?? 100;
    const rect = new Phaser.Geom.Rectangle(this.def.x - w / 2, this.def.y - 34, w, 34);
    if (overlap(santa, rect)) santa.hurt(this.def.x);
  }

  destroy(): void {
    this.image.destroy();
  }
}

class StickyHazard implements Hazard {
  readonly def: HazardDef;
  private image: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.def = def;
    this.image = scene.add.image(def.x, def.y + 2, 'props', 'prop-gum-puddle')
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(DEPTH.decoBack + 4);
  }

  warningPoint(): { x: number; y: number } | null {
    return null;
  }

  surface(santa: Santa): HazardSurface {
    const w = this.def.w ?? 120;
    const rect = new Phaser.Geom.Rectangle(this.def.x - w / 2, this.def.y - 18, w, 22);
    return overlap(santa, rect) ? { sticky: true } : {};
  }

  update(_dt: number): void {
    // The puddle is a surface modifier only.
  }

  destroy(): void {
    this.image.destroy();
  }
}

class IceHazard implements Hazard {
  readonly def: HazardDef;
  private overlay: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.def = def;
    this.overlay = scene.add.rectangle(
      def.x + (def.w ?? 300) / 2,
      def.y + (def.h ?? 60) / 2,
      def.w ?? 300,
      def.h ?? 60,
      0xbfefff,
      0.07,
    ).setDepth(DEPTH.decoBack + 2);
  }

  warningPoint(): { x: number; y: number } | null {
    return null;
  }

  surface(santa: Santa): HazardSurface {
    const rect = new Phaser.Geom.Rectangle(this.def.x, this.def.y, this.def.w ?? 300, this.def.h ?? 60);
    return Phaser.Geom.Intersects.RectangleToRectangle(rect, bodyRect(santa)) ? { ice: true } : {};
  }

  update(): void {
    // Ice changes friction only.
  }

  destroy(): void {
    this.overlay.destroy();
  }
}

class SpringHazard implements Hazard {
  readonly def: HazardDef;
  private image: Phaser.GameObjects.Image;
  private cooldown = 0;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.def = def;
    this.image = scene.add.image(def.x, def.y + 4, 'props', 'prop-spring-box')
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(DEPTH.decoBack + 3);
  }

  warningPoint(): { x: number; y: number } | null {
    return null;
  }

  update(dt: number, santa: Santa): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.cooldown > 0) return;
    const rect = new Phaser.Geom.Rectangle(this.def.x - 38, this.def.y - 26, 76, 30);
    if (Phaser.Geom.Intersects.RectangleToRectangle(rect, bodyRect(santa)) && santa.body.velocity.y > -40) {
      this.cooldown = 0.6;
      santa.body.setVelocityY(-PHYSICS.springBounce);
      santa.body.setVelocityX(santa.body.velocity.x * 0.8);
      this.image.setScale(0.5, 0.32);
      this.release();
      audio.playSfx('bounce');
      save.vibrate(20);
      const emitter = santa.scene.add.particles(this.def.x, this.def.y - 10, 'props', { frame: 'particle-snow',
        speed: { min: 50, max: 140 },
        angle: { min: 200, max: 340 },
        lifespan: 500,
        scale: { start: 0.4, end: 0 },
        quantity: 10,
        emitting: false,
      }).setDepth(DEPTH.fx);
      emitter.explode(10);
      santa.scene.time.delayedCall(700, () => emitter.destroy());
    }
  }

  private release(): void {
    this.image.scene.tweens.add({
      targets: this.image,
      scaleY: 0.5,
      duration: 320,
      ease: 'Back.easeOut',
    });
  }

  destroy(): void {
    this.image.destroy();
  }
}

class BoulderHazard implements Hazard {
  readonly def: HazardDef;
  private image: Phaser.GameObjects.Image;
  private dir: 1 | -1 = 1;
  private minX: number;
  private maxX: number;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.def = def;
    this.minX = def.minX ?? def.x - 200;
    this.maxX = def.maxX ?? def.x + 200;
    this.image = scene.add.image(def.x, def.y + 4, 'props', 'prop-snow-boulder')
      .setOrigin(0.5, 1)
      .setScale(0.55)
      .setDepth(DEPTH.hazard);
  }

  warningPoint(): { x: number; y: number } {
    return { x: this.def.x, y: this.def.y - 120 };
  }

  update(dt: number, santa: Santa): void {
    const speed = this.def.speed ?? 120;
    this.image.x += this.dir * speed * dt;
    this.image.angle += this.dir * speed * dt * 0.09;
    if (this.image.x <= this.minX) this.dir = 1;
    if (this.image.x >= this.maxX) this.dir = -1;
    const rect = new Phaser.Geom.Rectangle(this.image.x - 34, this.def.y - 62, 68, 58);
    if (overlap(santa, rect)) santa.hurt(this.image.x);
  }

  destroy(): void {
    this.image.destroy();
  }
}

class TrainHazard implements Hazard {
  readonly def: HazardDef;
  private image: Phaser.GameObjects.Image;
  private dir: 1 | -1 = 1;
  private minX: number;
  private maxX: number;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.def = def;
    this.minX = def.minX ?? def.x - 180;
    this.maxX = def.maxX ?? def.x + 180;
    this.image = scene.add.image(def.x, def.y + 4, 'props', 'prop-train')
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(DEPTH.hazard);
  }

  warningPoint(): { x: number; y: number } {
    return { x: this.def.x, y: this.def.y - 90 };
  }

  update(dt: number, santa: Santa): void {
    const speed = this.def.speed ?? 110;
    this.image.x += this.dir * speed * dt;
    this.image.setFlipX(this.dir < 0);
    if (this.image.x <= this.minX) this.dir = 1;
    if (this.image.x >= this.maxX) this.dir = -1;
    const rect = new Phaser.Geom.Rectangle(this.image.x - 76, this.def.y - 74, 152, 70);
    if (overlap(santa, rect)) santa.hurt(this.image.x);
  }

  destroy(): void {
    this.image.destroy();
  }
}

class SpawnerHazard implements Hazard {
  readonly def: HazardDef;
  private timer = 0;

  constructor(_scene: Phaser.Scene, def: HazardDef) {
    this.def = def;
  }

  warningPoint(): { x: number; y: number } {
    return { x: this.def.x, y: this.def.y - 60 };
  }

  update(dt: number): void {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.def.interval ?? 3;
    // Spawner hazards are driven by the game scene through an event.
  }

  destroy(): void {
    // Nothing visual.
  }
}

export function createHazard(scene: Phaser.Scene, def: HazardDef, _town: TownId): Hazard | null {
  switch (def.kind) {
    case 'icicle': return new IcicleHazard(scene, def);
    case 'gear': return new GearHazard(scene, def);
    case 'steam':
    case 'geyser': return new SteamHazard(scene, def);
    case 'wind': return new WindHazard(scene, def);
    case 'spikes': return new SpikesHazard(scene, def);
    case 'sticky': return new StickyHazard(scene, def);
    case 'ice': return new IceHazard(scene, def);
    case 'spring': return new SpringHazard(scene, def);
    case 'boulder': return new BoulderHazard(scene, def);
    case 'train': return new TrainHazard(scene, def);
    case 'spawner': return new SpawnerHazard(scene, def);
    default: return null;
  }
}
