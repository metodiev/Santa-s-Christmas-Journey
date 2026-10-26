import Phaser from 'phaser';
import { DEPTH } from '../config';
import { audio } from '../audio/AudioSystem';
import { save } from '../systems/SaveSystem';

export class Checkpoint {
  readonly x: number;
  readonly y: number;
  readonly area: number;
  active = false;
  private scene: Phaser.Scene;
  private flag: Phaser.GameObjects.Sprite;
  private glow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, area: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.area = area;
    this.flag = scene.add.sprite(x, y + 4, 'props', 'prop-checkpoint-off')
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(DEPTH.decoBack + 3);
    this.glow = scene.add.image(x, y - 70, 'props', 'glow-soft')
      .setTint(0xffd166)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
      .setScale(0.6)
      .setDepth(DEPTH.decoBack + 2);
  }

  check(santa: Phaser.Physics.Arcade.Sprite): boolean {
    if (this.active) return false;
    const inRange = Math.abs(santa.x - this.x) < 46 && Math.abs(santa.y - this.y) < 150;
    if (!inRange) return false;
    this.activate();
    return true;
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    this.flag.setFrame('prop-checkpoint-on');
    this.scene.tweens.add({
      targets: this.flag,
      scaleY: 0.56,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
    this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.7, to: 0.32 },
      scale: { from: 0.9, to: 0.62 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const emitter = this.scene.add.particles(this.x, this.y - 90, 'props', { frame: 'particle-spark',
      speed: { min: 30, max: 130 },
      angle: { min: 220, max: 320 },
      lifespan: { min: 400, max: 900 },
      scale: { start: 0.45, end: 0 },
      quantity: 14,
      emitting: false,
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(DEPTH.fx);
    emitter.explode(14);
    this.scene.time.delayedCall(1000, () => emitter.destroy());
    audio.playSfx('checkpoint');
    save.vibrate(30);
  }

  destroy(): void {
    this.flag.destroy();
    this.glow.destroy();
  }
}
