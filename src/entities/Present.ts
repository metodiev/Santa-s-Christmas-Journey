import Phaser from 'phaser';
import { DEPTH } from '../config';

export class Present extends Phaser.GameObjects.Sprite {
  readonly secret?: string;
  collected = false;
  private baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, secret?: string, variant = 0) {
    super(scene, x, y, 'props', `prop-gift-${variant % 3}`);
    scene.add.existing(this);
    this.secret = secret;
    this.baseY = y;
    this.setScale(0.5);
    this.setDepth(DEPTH.pickup);
    this.setOrigin(0.5, 0.5);
    scene.tweens.add({
      targets: this,
      y: y - 5,
      duration: 900 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Math.random() * 400,
    });
    scene.tweens.add({
      targets: this,
      angle: { from: -3, to: 3 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const glow = scene.add.image(x, y, 'props', 'glow-soft')
      .setTint(0xffd166)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.18)
      .setScale(0.36)
      .setDepth(DEPTH.pickup - 1);
    this.once(Phaser.GameObjects.Events.DESTROY, () => glow.destroy());
  }

  getRect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - 22, this.y - 22, 44, 44);
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;
    const scene = this.scene;
    const emitter = scene.add.particles(this.x, this.y, 'props', { frame: 'particle-spark',
      speed: { min: 40, max: 140 },
      lifespan: { min: 250, max: 600 },
      scale: { start: 0.4, end: 0 },
      quantity: 8,
      emitting: false,
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(DEPTH.fx);
    emitter.explode(8);
    scene.time.delayedCall(700, () => emitter.destroy());
    scene.tweens.add({
      targets: this,
      y: this.y - 30,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => this.destroy(),
    });
    void this.baseY;
  }
}
