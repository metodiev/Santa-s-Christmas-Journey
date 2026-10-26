import Phaser from 'phaser';
import { getLevel } from '../config';
import type { LevelData } from '../types';
import { addSnowfall, ensureSkyTexture } from '../systems/Art';

interface Layer {
  sprite: Phaser.GameObjects.TileSprite;
  factorX: number;
  bottom: number;
  artHeight: number;
}

/**
 * Renders sky, parallax town layers and background snow in its own camera so
 * the gameplay camera can zoom independently on phones without scaling the art.
 */
export class BackdropScene extends Phaser.Scene {
  private level!: LevelData;
  private sky!: Phaser.GameObjects.Image;
  private layers: Layer[] = [];
  private snow!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'Backdrop' });
  }

  init(data: { levelId: string }): void {
    this.level = getLevel(data.levelId);
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.cameras.main.setBackgroundColor('#050b1c');

    this.sky = this.add.image(width / 2, height / 2, ensureSkyTexture(this, this.level.town))
      .setDisplaySize(width, height)
      .setDepth(-100);

    const defs = [
      { key: `bg-${this.level.town}-far`, factorX: 0.14, bottom: 0.72, depth: -90 },
      { key: `bg-${this.level.town}-mid`, factorX: 0.34, bottom: 0.81, depth: -80 },
      { key: `bg-${this.level.town}-near`, factorX: 0.58, bottom: 0.92, depth: -70 },
    ];
    for (const def of defs) {
      const sprite = this.add.tileSprite(0, 0, width, 480, def.key)
        .setOrigin(0, 1)
        .setDepth(def.depth);
      this.layers.push({ sprite, factorX: def.factorX, bottom: def.bottom, artHeight: 480 });
    }

    this.snow = addSnowfall(this, 10);
    this.resizeBackdrop();
    this.scale.on('resize', this.resizeBackdrop, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.resizeBackdrop));
  }

  sync(scrollX: number): void {
    for (const layer of this.layers) {
      layer.sprite.x = 0;
      layer.sprite.tilePositionX = scrollX * layer.factorX;
    }
  }

  private resizeBackdrop = (): void => {
    const width = this.scale.width;
    const height = this.scale.height;
    const scale = Phaser.Math.Clamp(height / 720, 0.42, 1.15);
    this.sky.setPosition(width / 2, height / 2).setDisplaySize(width, height);
    for (const layer of this.layers) {
      layer.artHeight = 480 * scale;
      layer.sprite.setSize(width, layer.artHeight);
      layer.sprite.setTileScale(scale, scale);
      layer.sprite.y = height * layer.bottom;
    }
    if (this.snow) {
      this.snow.destroy();
      this.snow = addSnowfall(this, 10);
    }
  }
}
