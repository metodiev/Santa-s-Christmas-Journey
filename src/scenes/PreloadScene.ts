import Phaser from 'phaser';
import { TOWN_ORDER } from '../systems/towns';
import { createSantaAnimations } from '../systems/animations';
import { FONT_TITLE, FONT_UI } from '../config';

const TOWNS = TOWN_ORDER;

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Preload' });
  }

  preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.cameras.main.setBackgroundColor('#050b1c');
    const title = this.add.text(width / 2, height * 0.34, "Santa's Christmas Journey", {
      fontFamily: FONT_TITLE,
      fontSize: `${Math.min(52, Math.round(width / 20))}px`,
      color: '#ffe9b0',
      align: 'center',
    }).setOrigin(0.5);
    const sub = this.add.text(width / 2, height * 0.42, 'Warming up the sleigh…', {
      fontFamily: FONT_UI,
      fontSize: `${Math.min(20, Math.round(width / 55))}px`,
      color: '#a9c8e8',
    }).setOrigin(0.5);
    const barWidth = Math.min(520, width * 0.6);
    const barY = height * 0.56;
    this.add.rectangle(width / 2, barY, barWidth, 12, 0x0b1728).setStrokeStyle(1, 0x6b5324);
    const fill = this.add.rectangle(width / 2 - barWidth / 2 + 2, barY, 0, 8, 0xe6bd6a).setOrigin(0, 0.5);
    const percent = this.add.text(width / 2, barY + 30, '0%', {
      fontFamily: FONT_UI,
      fontSize: '16px',
      color: '#cfe4f3',
    }).setOrigin(0.5);
    this.load.on('progress', (value: number) => {
      fill.width = (barWidth - 4) * value;
      percent.setText(`${Math.round(value * 100)}%`);
    });
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error('Asset failed to load', file.key, file.src);
      sub.setText(`Could not load ${file.key}`);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      title.destroy();
      sub.destroy();
      percent.destroy();
      fill.destroy();
    });

    this.load.setPath('assets/generated');
    this.load.atlas('santa', 'santa.png', 'santa.json');
    this.load.atlas('enemies', 'enemies.png', 'enemies.json');
    this.load.atlas('props', 'props.png', 'props.json');
    this.load.atlas('ui', 'ui.png', 'ui.json');

    for (const town of TOWNS) {
      for (const layer of ['far', 'mid', 'near']) {
        this.load.image(`bg-${town}-${layer}`, `backgrounds/bg-${town}-${layer}.png`);
      }
      for (let variant = 0; variant < 3; variant++) {
        this.load.image(`house-${town}-${variant}`, `houses/house-${town}-${variant}.png`);
      }
      for (const tile of ['top', 'fill', 'alt-top', 'alt-fill', 'platform', 'block']) {
        this.load.image(`tile-${town}-${tile}`, `tiles/tile-${town}-${tile}.png`);
      }
    }
    this.load.image('goal-tree', 'houses/goal-tree.png');
  }

  create(): void {
    createSantaAnimations(this);
    document.getElementById('loading')?.classList.add('hidden');
    this.scene.start('Splash');
  }
}
