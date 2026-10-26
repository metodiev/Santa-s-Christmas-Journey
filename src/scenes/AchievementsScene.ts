import { BaseMenuScene } from '../ui/MenuKit';
import { FONT_UI } from '../config';
import { ACHIEVEMENTS } from '../systems/progress';
import { save } from '../systems/SaveSystem';
import { t } from '../systems/i18n';
import { a11y } from '../systems/A11y';

export class AchievementsScene extends BaseMenuScene {
  constructor() {
    super({ key: 'Achievements' });
  }

  create(): void {
    this.initialize('pine');
  }

  protected buildContent(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const profile = save.profile;
    const titleSize = Math.round(Math.max(26, Math.min(w / 26, h / 11, 44)));
    this.addTitle(t('achievements.title'), h * 0.09, titleSize);
    const count = ACHIEVEMENTS.filter((a) => profile.achievements.includes(a.id)).length;
    this.addSubtitle(t('achievements.unlockedCount', { n: count, total: ACHIEVEMENTS.length }), h * 0.16, 15);

    const columns = w >= 760 ? 2 : 1;
    const rows = Math.ceil(ACHIEVEMENTS.length / columns);
    const cardW = (w - 80) / columns;
    const top = h * 0.23;
    const bottom = h * 0.87;
    const cardH = Math.max(38, Math.min(86, (bottom - top) / rows));
    ACHIEVEMENTS.forEach((achievement, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = 40 + col * cardW + cardW / 2;
      const y = top + row * cardH + cardH / 2;
      const unlocked = profile.achievements.includes(achievement.id);
      const panel = this.add.nineslice(x, y, 'ui', 'panel', cardW - 16, cardH - 8, 20, 20, 20, 20)
        .setAlpha(unlocked ? 1 : 0.65);
      this.content.add(panel);
      const icon = this.add.image(x - cardW / 2 + 38, y, 'ui', achievement.icon)
        .setScale(cardH > 60 ? 0.7 : 0.45)
        .setAlpha(unlocked ? 1 : 0.35);
      this.content.add(icon);
      const title = this.add.text(x - cardW / 2 + 70, y - (cardH > 56 ? 12 : 7), t(`achievement.${achievement.id}.title`), {
        fontFamily: FONT_UI,
        fontSize: `${Math.max(11, Math.round(Math.min(cardH * 0.23, 17)))}px`,
        color: unlocked ? '#ffe6a8' : '#8397a8',
      }).setOrigin(0, 0.5);
      this.content.add(title);
      if (cardH > 52) {
        const desc = this.add.text(x - cardW / 2 + 70, y + 10, t(`achievement.${achievement.id}.desc`), {
          fontFamily: FONT_UI,
          fontSize: `${Math.max(9, Math.round(Math.min(cardH * 0.15, 12)))}px`,
          color: unlocked ? '#bcd5e6' : '#64798b',
          wordWrap: { width: cardW - 110 },
        }).setOrigin(0, 0.5);
        this.content.add(desc);
      }
      if (unlocked) {
        const check = this.add.image(x + cardW / 2 - 26, y, 'ui', 'ui-check').setScale(0.6);
        this.content.add(check);
      } else {
        const lock = this.add.image(x + cardW / 2 - 26, y, 'ui', 'ui-lock').setScale(0.6).setAlpha(0.55);
        this.content.add(lock);
      }
    });

    this.addMenuButton(t('menu.back'), Math.max(70, w * 0.08), h - 30, () => this.onBack(), {
      width: 120,
      height: 40,
      fontSize: 16,
    });
    a11y.setMenu(t('achievements.title'), [
      { label: t('menu.back'), action: () => this.onBack() },
    ]);
  }

  protected override onBack(): void {
    this.scene.start('MainMenu');
  }
}
