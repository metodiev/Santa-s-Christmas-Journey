import Phaser from 'phaser';
import { DEPTH, HOUSE_CHIMNEY_OFFSET, HOUSE_HEIGHT, HOUSE_ROOF_OFFSET, HOUSE_SCALE, HOUSE_WIDTH } from '../config';
import type { HouseDef, TownId } from '../types';
import { audio } from '../audio/AudioSystem';
import { save } from '../systems/SaveSystem';

export class House {
  readonly def: HouseDef;
  readonly image: Phaser.GameObjects.Image;
  readonly roofY: number;
  readonly chimneyX: number;
  readonly chimneyY: number;
  private scene: Phaser.Scene;
  private glow: Phaser.GameObjects.Image;
  private glowTween: Phaser.Tweens.Tween | null = null;
  delivered = false;

  constructor(scene: Phaser.Scene, def: HouseDef, town: TownId) {
    this.scene = scene;
    this.def = def;
    this.image = scene.add.image(def.x, def.y + 6, `house-${town}-${def.variant}`)
      .setOrigin(0.5, 1)
      .setScale(HOUSE_SCALE)
      .setDepth(DEPTH.house);
    this.roofY = def.y - HOUSE_ROOF_OFFSET;
    this.chimneyX = def.x + HOUSE_CHIMNEY_OFFSET;
    this.chimneyY = this.roofY - 34;
    this.glow = scene.add.image(this.chimneyX, this.roofY - 10, 'props', 'glow-soft')
      .setTint(0xffc76b)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.72, 0.5)
      .setDepth(DEPTH.houseGlow)
      .setAlpha(0);
    if (def.hasChild && !this.delivered) this.startGlow();
  }

  get hasChild(): boolean { return this.def.hasChild; }
  get pending(): boolean { return this.def.hasChild && !this.delivered; }
  get width(): number { return HOUSE_WIDTH; }
  get height(): number { return HOUSE_HEIGHT; }

  private startGlow(): void {
    this.glow.setAlpha(0.5);
    this.glowTween?.stop();
    this.glowTween = this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.28, to: 0.62 },
      scaleX: { from: 0.64, to: 0.85 },
      scaleY: { from: 0.44, to: 0.58 },
      duration: 1250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  isNearChimney(x: number, feetY: number): boolean {
    return this.pending && Math.abs(x - this.chimneyX) < 92 && Math.abs(feetY - this.roofY) < 62;
  }

  deliver(): void {
    if (!this.pending) return;
    this.delivered = true;
    this.glowTween?.stop();
    this.scene.tweens.add({ targets: this.glow, alpha: 0, duration: 300 });
    const gift = this.scene.add.image(this.chimneyX, this.roofY - 140, 'props', 'prop-gift-0')
      .setScale(0.5)
      .setDepth(DEPTH.fx);
    this.scene.tweens.add({
      targets: gift,
      y: this.chimneyY,
      duration: 480,
      ease: 'Quad.easeIn',
      onComplete: () => {
        gift.destroy();
        this.burst();
        audio.playSfx('deliver');
        save.vibrate(40);
      },
    });
    this.scene.tweens.add({
      targets: this.image,
      alpha: { from: 0.7, to: 1 },
      duration: 260,
      repeat: 2,
      yoyo: true,
    });
  }

  private burst(): void {
    const emitter = this.scene.add.particles(this.chimneyX, this.roofY - 20, 'props', { frame: 'particle-spark',
      speed: { min: 40, max: 160 },
      angle: { min: 200, max: 340 },
      lifespan: { min: 350, max: 900 },
      scale: { start: 0.5, end: 0 },
      quantity: 16,
      emitting: false,
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(DEPTH.fx);
    emitter.explode(20);
    this.scene.time.delayedCall(1100, () => emitter.destroy());
    const flare = this.scene.add.image(this.chimneyX, this.chimneyY, 'props', 'glow-soft')
      .setTint(0xffd166)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.fx)
      .setScale(0.2);
    this.scene.tweens.add({
      targets: flare,
      scale: 1.4,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => flare.destroy(),
    });
  }

  destroy(): void {
    this.glowTween?.stop();
    this.image.destroy();
    this.glow.destroy();
  }
}

