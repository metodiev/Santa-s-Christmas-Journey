import Phaser from 'phaser';
import { BaseMenuScene } from '../ui/MenuKit';
import { FONT_UI, LEVELS, TOWN_META } from '../config';
import { isLevelUnlocked, totalStars } from '../systems/progress';
import { t } from '../systems/i18n';
import { audio } from '../audio/AudioSystem';
import { a11y } from '../systems/A11y';
import { save } from '../systems/SaveSystem';

export class LevelSelectScene extends BaseMenuScene {
  private toastText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LevelSelect' });
  }

  create(): void {
    this.initialize('pine');
    audio.playMusic('menu');
    this.registerA11y();
  }

  protected buildContent(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const profile = save.profile;
    this.toastText = undefined;

    const titleSize = Math.round(Math.max(28, Math.min(w / 24, h / 10, 48)));
    this.addTitle(t('levelselect.title'), h * 0.09, titleSize);
    const total = totalStars(profile);
    const sub = this.add.text(w - 24, 18, t('levelselect.starsOf', { n: total }), {
      fontFamily: FONT_UI,
      fontSize: `${Math.max(12, Math.round(h * 0.022))}px`,
      color: '#ffe6a8',
    }).setOrigin(1, 0);
    this.content.add(sub);

    const columns = w >= 1000 ? 5 : w >= 760 ? 5 : 3;
    const rows = Math.ceil(LEVELS.length / columns);
    const gapX = Math.min(20, w * 0.02);
    const gapY = 14;
    const areaTop = h * 0.21;
    const areaBottom = h * 0.86;
    const cardW = Math.max(96, Math.min(220, (w - 60 - gapX * (columns - 1)) / columns));
    const cardH = Math.max(130, Math.min(330, (areaBottom - areaTop - gapY * (rows - 1)) / rows));

    LEVELS.forEach((level, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const totalRowWidth = cardW * columns + gapX * (columns - 1);
      const cx = w / 2 - totalRowWidth / 2 + cardW / 2 + col * (cardW + gapX);
      const cy = areaTop + cardH / 2 + row * (cardH + gapY);
      this.buildCard(level.id, level.town, index, cx, cy, cardW, cardH);
    });

    this.addMenuButton(t('menu.back'), Math.max(80, w * 0.08), h - 32, () => this.onBack(), {
      width: 130,
      height: 46,
      fontSize: 17,
    });
    this.registerA11y();
  }

  private buildCard(
    levelId: string,
    town: keyof typeof TOWN_META,
    index: number,
    cx: number,
    cy: number,
    cardW: number,
    cardH: number,
  ): void {
    const profile = save.profile;
    const unlocked = isLevelUnlocked(profile, index);
    const progress = profile.progress[levelId];
    const meta = TOWN_META[town];
    const card = this.add.container(cx, cy);
    const panel = this.add.nineslice(0, 0, 'ui', 'panel', cardW, cardH, 24, 24, 24, 24);
    card.add(panel);

    const thumbH = Math.round(cardH * 0.36);
    const thumb = this.add.tileSprite(0, -cardH / 2 + thumbH / 2 + 4, cardW - 10, thumbH, `bg-${town}-mid`)
      .setTileScale(0.62)
      .setTilePosition(index * 130, 40)
      .setAlpha(0.95);
    card.add(thumb);
    const shade = this.add.rectangle(0, -cardH / 2 + thumbH / 2 + 4, cardW - 10, thumbH, 0x030a14, 0.28);
    card.add(shade);
    const border = this.add.rectangle(0, -cardH / 2 + thumbH / 2 + 4, cardW - 10, thumbH, 0x000000, 0).setStrokeStyle(1.5, Phaser.Display.Color.HexStringToColor(meta.accent).color, 0.45);
    card.add(border);

    if (!unlocked) {
      const lock = this.add.image(0, -cardH / 2 + thumbH / 2 + 4, 'ui', 'ui-lock').setScale(1.1).setAlpha(0.9);
      card.add(lock);
    } else {
      const icon = this.addTownIcon(town, 0, -cardH / 2 + thumbH / 2 + 2);
      if (icon) {
        icon.setAlpha(0.92);
        card.add(icon);
      }
    }

    const name = this.add.text(0, -cardH / 2 + thumbH + 18, t(`town.${town}`), {
      fontFamily: FONT_UI,
      fontSize: `${Math.max(12, Math.round(Math.min(cardW * 0.1, 18)))}px`,
      color: unlocked ? '#f6e7c8' : '#8295a8',
      align: 'center',
      wordWrap: { width: cardW - 16 },
      stroke: '#07111f',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);
    card.add(name);

    const stars = progress?.stars ?? 0;
    for (let i = 0; i < 3; i++) {
      const star = this.add.image((i - 1) * 22, cardH / 2 - 44, 'ui', i < stars ? 'ui-star-full' : 'ui-star-empty')
        .setScale(0.42)
        .setAlpha(unlocked ? 1 : 0.4);
      card.add(star);
    }

    const best = progress?.bestScore ?? 0;
    const bestText = this.add.text(0, cardH / 2 - 20, unlocked && best > 0 ? t('levelselect.best', { score: best }) : '', {
      fontFamily: FONT_UI,
      fontSize: '11px',
      color: '#9fb9ce',
    }).setOrigin(0.5);
    card.add(bestText);

    if (!unlocked) {
      card.setAlpha(0.82);
    }

    card.setSize(cardW, cardH);
    card.setInteractive(new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);
    card.input!.cursor = 'pointer';
    card.on('pointerover', () => {
      if (unlocked) this.tweens.add({ targets: card, scaleX: 1.03, scaleY: 1.03, duration: 120 });
    });
    card.on('pointerout', () => {
      this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 120 });
    });
    card.on('pointerdown', () => {
      audio.playSfx('click');
      if (!unlocked) {
        this.showToast(t('levelselect.locked', { town: t(`town.${LEVELS[Math.max(0, index - 1)].town}`) }));
        a11y.announce(t('levelselect.locked', { town: t(`town.${LEVELS[Math.max(0, index - 1)].town}`) }));
        return;
      }
      this.startLevel(levelId);
    });
    this.content.add(card);
  }

  private addTownIcon(town: keyof typeof TOWN_META, x: number, y: number): Phaser.GameObjects.Image | null {
    const key = TOWN_META[town].icon;
    if (key === 'goal-tree') {
      return this.add.image(x, y, 'goal-tree').setOrigin(0.5, 1).setScale(Math.min(0.18, this.scale.height * 0.00028));
    }
    return this.add.image(x, y, 'props', key).setOrigin(0.5, 1).setScale(0.55);
  }

  private showToast(text: string): void {
    this.toastText?.destroy();
    const w = this.scale.width;
    this.toastText = this.add.text(w / 2, this.scale.height - 74, text, {
      fontFamily: FONT_UI,
      fontSize: '15px',
      color: '#ffe6a8',
      backgroundColor: '#081422',
      padding: { x: 14, y: 8 },
      align: 'center',
    }).setOrigin(0.5);
    this.content.add(this.toastText);
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 2200,
      duration: 500,
      onComplete: () => this.toastText?.destroy(),
    });
  }

  private registerA11y(): void {
    const profile = save.profile;
    const actions = LEVELS.map((level, index) => ({
      label: `${t(`town.${level.town}`)}${isLevelUnlocked(profile, index) ? '' : ` (${t('menu.locked')})`}`,
      action: () => {
        if (isLevelUnlocked(profile, index)) this.startLevel(level.id);
        else a11y.announce(t('levelselect.locked', { town: t(`town.${LEVELS[Math.max(0, index - 1)].town}`) }));
      },
    }));
    actions.push({ label: t('menu.back'), action: () => this.onBack() });
    a11y.setMenu(t('levelselect.title'), actions);
  }

  protected override onBack(): void {
    this.scene.start('MainMenu');
  }
}
