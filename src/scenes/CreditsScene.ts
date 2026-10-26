import { BaseMenuScene } from '../ui/MenuKit';
import { FONT_UI } from '../config';
import { t } from '../systems/i18n';
import { a11y } from '../systems/A11y';

export class CreditsScene extends BaseMenuScene {
  constructor() {
    super({ key: 'Credits' });
  }

  create(): void {
    this.initialize('pine');
  }

  protected buildContent(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const titleSize = Math.round(Math.max(28, Math.min(w / 24, h / 10, 48)));
    this.addTitle(t('credits.title'), h * 0.1, titleSize);
    const lines = [1, 2, 3, 4, 5, 6].map((i) => t(`credits.line${i}`));
    const size = Math.max(11, Math.round(Math.min(w / 80, h / 34, 17)));
    lines.forEach((line, i) => {
      const text = this.add.text(w / 2, h * 0.25 + i * (size + 12), line, {
        fontFamily: FONT_UI,
        fontSize: `${size}px`,
        color: i === 5 ? '#ffe6a8' : '#bdd4e6',
        align: 'center',
        wordWrap: { width: Math.min(880, w - 80) },
      }).setOrigin(0.5, 0);
      this.content.add(text);
    });
    this.addMenuButton(t('menu.back'), w / 2, h - 34, () => this.onBack(), {
      width: 150,
      height: 42,
      fontSize: 17,
    });
    a11y.setMenu(t('credits.title'), [{ label: t('menu.back'), action: () => this.onBack() }]);
  }

  protected override onBack(): void {
    this.scene.start('MainMenu');
  }
}
