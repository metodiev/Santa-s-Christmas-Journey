import Phaser from 'phaser';
import type { EnemyDef, EnemyKind } from '../types';
import { DEPTH } from '../config';

interface EnemyConfig {
  frames: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  flying?: boolean;
  frameRate: number;
  yoyo?: boolean;
}

export const ENEMY_CONFIG: Record<EnemyKind, EnemyConfig> = {
  penguin: { frames: 2, width: 92, height: 92, speed: 45, hp: 1, frameRate: 5, yoyo: true },
  snowball: { frames: 4, width: 68, height: 68, speed: 110, hp: 1, frameRate: 10 },
  gingerbread: { frames: 4, width: 90, height: 90, speed: 62, hp: 1, frameRate: 8 },
  gumdrop: { frames: 3, width: 84, height: 70, speed: 55, hp: 1, frameRate: 5, yoyo: true },
  robot: { frames: 4, width: 96, height: 96, speed: 48, hp: 1, frameRate: 7 },
  soldier: { frames: 4, width: 88, height: 96, speed: 58, hp: 1, frameRate: 9 },
  wolf: { frames: 4, width: 122, height: 92, speed: 128, hp: 1, frameRate: 10 },
  owl: { frames: 2, width: 84, height: 84, speed: 72, hp: 1, flying: true, frameRate: 5, yoyo: true },
  golem: { frames: 4, width: 118, height: 118, speed: 34, hp: 2, frameRate: 5 },
};

export function createEnemyAnimations(scene: Phaser.Scene): void {
  for (const [kind, config] of Object.entries(ENEMY_CONFIG)) {
    const key = `enemy-${kind}`;
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNames('enemies', { prefix: `${kind}-`, start: 0, end: config.frames - 1 }),
      frameRate: config.frameRate,
      repeat: -1,
      yoyo: config.yoyo ?? false,
    });
  }
  if (!scene.anims.exists('krampus-idle')) {
    scene.anims.create({
      key: 'krampus-idle',
      frames: scene.anims.generateFrameNames('enemies', { prefix: 'krampus-', start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
  }
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  readonly kind: EnemyKind;
  private config: EnemyConfig;
  private dir: 1 | -1 = 1;
  private minX: number;
  private maxX: number;
  private baseY: number;
  private flying: boolean;
  private hp: number;
  private shootTimer = 1.5 + Math.random() * 1.5;
  private hopTimer = 1.2;
  private dead = false;
  private staggerTimer = 0;

  constructor(scene: Phaser.Scene, def: EnemyDef) {
    const config = ENEMY_CONFIG[def.kind];
    super(scene, def.x, def.y - (def.flying ? 0 : config.height * 0.42), 'enemies', `${def.kind}-0`);
    this.kind = def.kind;
    this.config = config;
    this.minX = def.patrol[0];
    this.maxX = def.patrol[1];
    this.baseY = def.y - (def.flying ? 0 : config.height * 0.42);
    this.flying = Boolean(def.flying ?? config.flying);
    this.hp = config.hp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(0.5);
    this.setDepth(DEPTH.enemy);
    this.setOrigin(0.5, this.flying ? 0.5 : 1);
    if (this.flying) {
      this.body.setAllowGravity(false);
      this.setPosition(def.x, def.y);
      this.baseY = def.y;
    } else {
      this.setPosition(def.x, def.y);
    }
    const bodyW = config.width * 0.62 * 2;
    const bodyH = config.height * 0.78 * 2;
    this.body.setSize(bodyW, bodyH);
    this.body.setOffset((config.width * 2 - bodyW) / 2, config.height * 2 - bodyH);
    this.body.setMaxVelocity(500, 1500);
    this.play(`enemy-${def.kind}`);
    this.dir = Math.random() > 0.5 ? 1 : -1;
    if (!this.flying) this.setVelocityX(this.dir * (def.speed ?? config.speed));
    void this.staggerTimer;
  }

  get isDead(): boolean { return this.dead; }
  get facing(): number { return this.dir; }

  override update(dt: number, santa: Phaser.Physics.Arcade.Sprite, groundAhead: (x: number, y: number) => boolean): void {
    if (this.dead) return;
    const body = this.body;
    if (this.flying) {
      this.x += this.dir * this.config.speed * dt;
      this.y = this.baseY + Math.sin(this.scene.time.now / 520 + this.minX * 0.01) * 28;
      if (this.x <= this.minX || this.x >= this.maxX) {
        this.dir = this.dir === 1 ? -1 : 1;
        this.x = Phaser.Math.Clamp(this.x, this.minX, this.maxX);
      }
      this.setFlipX(this.dir < 0);
      return;
    }

    if (this.staggerTimer > 0) {
      this.staggerTimer -= dt;
      if (this.staggerTimer > 0) return;
    }

    const distance = santa.x - this.x;
    const sameLevel = Math.abs(santa.y - this.y) < 220;
    if (this.kind === 'wolf' && sameLevel && Math.abs(distance) < 420) {
      this.dir = distance > 0 ? 1 : -1;
    }
    if (this.kind === 'snowball') {
      if (body.blocked.down && !groundAhead(this.x + this.dir * (this.config.width * 0.6), this.y + 4)) {
        this.dir = this.dir === 1 ? -1 : 1;
      }
      this.setFlipX(this.dir < 0);
      this.setVelocityX(this.dir * this.config.speed);
      if (this.x < this.minX || this.x > this.maxX) this.dir = this.dir === 1 ? -1 : 1;
      if (this.y > 1400) this.killSilently();
      return;
    }

    if (body.blocked.left || body.blocked.right) {
      this.dir = body.blocked.left ? 1 : -1;
    }
    if (this.x <= this.minX) this.dir = 1;
    if (this.x >= this.maxX) this.dir = -1;

    if (body.blocked.down && !groundAhead(this.x + this.dir * (this.config.width * 0.5), this.y + 4)) {
      this.dir = this.dir === 1 ? -1 : 1;
    }

    const speed = this.kind === 'wolf' && Math.abs(distance) < 420 ? this.config.speed * 1.35 : this.config.speed;
    body.setVelocityX(this.dir * speed);
    this.setFlipX(this.dir < 0);

    if (this.kind === 'gumdrop' && body.blocked.down) {
      this.hopTimer -= dt;
      if (this.hopTimer <= 0) {
        this.hopTimer = 1.4 + Math.random() * 1.1;
        body.setVelocityY(-460);
      }
    }
    if (this.kind === 'gingerbread' && body.blocked.down) {
      this.hopTimer -= dt;
      if (this.hopTimer <= 0) {
        this.hopTimer = 2.5 + Math.random();
        body.setVelocityY(-380);
      }
    }
    if (this.kind === 'robot') {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0 && Math.abs(distance) < 540 && sameLevel) {
        this.shootTimer = 2.6 + Math.random() * 1.2;
        this.scene.events.emit('enemy-shoot', this);
      }
    }
    if (this.kind === 'soldier') {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0 && Math.abs(distance) < 300 && sameLevel) {
        this.shootTimer = 3.2;
        body.setVelocityX((distance > 0 ? 1 : -1) * 190);
        this.scene.time.delayedCall(420, () => {
          if (!this.dead) body.setVelocityX(this.dir * this.config.speed);
        });
      }
    }
    if (this.y > 1400) this.killSilently();
  }

  stomp(): boolean {
    if (this.dead) return false;
    this.hp -= 1;
    if (this.hp > 0) {
      this.staggerTimer = 0.4;
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(90, () => this.clearTint());
      this.scene.tweens.add({ targets: this, scaleY: 0.36, duration: 90, yoyo: true });
      return false;
    }
    this.dead = true;
    this.body.enable = false;
    this.setVelocity(0, 0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.58,
      scaleY: 0.08,
      alpha: 0,
      y: this.y + 10,
      duration: 230,
      ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
    this.scene.events.emit('enemy-stomped', this);
    return true;
  }

  shockwave(): void {
    if (this.dead) return;
    this.dead = true;
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      angle: 40,
      duration: 280,
      onComplete: () => this.destroy(),
    });
    this.scene.events.emit('enemy-stomped', this);
  }

  killSilently(): void {
    if (this.dead) return;
    this.dead = true;
    this.destroy();
  }

  getRect(): Phaser.Geom.Rectangle {
    if (!this.body) return new Phaser.Geom.Rectangle(0, 0, 0, 0);
    return new Phaser.Geom.Rectangle(this.body.x, this.body.y, this.body.width, this.body.height);
  }
}
