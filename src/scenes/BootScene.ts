import Phaser from 'phaser';
import { save } from '../systems/SaveSystem';
import { setLanguage } from '../systems/i18n';
import { a11y } from '../systems/A11y';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  async create(): Promise<void> {
    a11y.init();
    await save.init();
    setLanguage(save.settings.language);

    if (!this.textures.exists('pixel')) {
      const texture = this.textures.createCanvas('pixel', 1, 1);
      const ctx = texture?.getContext();
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1, 1);
      }
      texture?.refresh();
    }

    try {
      await Promise.all([
        document.fonts.load('600 32px Cinzel'),
        document.fonts.load('400 16px Inter'),
        document.fonts.load('600 16px Inter'),
      ]);
      await document.fonts.ready;
    } catch {
      // Fallback fonts are declared in CSS.
    }

    this.scene.start('Preload');
  }
}
