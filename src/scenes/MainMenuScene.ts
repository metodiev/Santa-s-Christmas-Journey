import { BaseMenuScene } from '../ui/MenuKit';
import { FONT_UI, LEVELS } from '../config';
import { firstIncompleteLevel, totalStars } from '../systems/progress';
import { t } from '../systems/i18n';
import { audio } from '../audio/AudioSystem';
import { a11y } from '../systems/A11y';
import { save } from '../systems/SaveSystem';

export class MainMenuScene extends BaseMenuScene {
  constructor() {
    super({ key: 'MainMenu' });
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
    const short = h < 560;
    const wide = w > 980;
    const titleSize = Math.round(Math.min(w / 17, h / 9, short ? 42 : 64));
    this.addTitle(t('app.title'), h * (short ? 0.1 : 0.12), Math.max(30, titleSize));
    this.addSubtitle(t('app.subtitle'), h * (short ? 0.17 : 0.2), Math.max(12, Math.round(titleSize * 0.3)));

    const stars = totalStars(profile);
    const profileText = this.add.text(w - 24, 20, `${profile.name}   ★ ${stars}/15`, {
      fontFamily: FONT_UI,
      fontSize: `${Math.max(12, Math.round(h * 0.024))}px`,
      color: '#ffe6a8',
      backgroundColor: '#0a172699',
      padding: { x: 10, y: 6 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    profileText.on('pointerdown', () => this.scene.start('Profile'));
    this.content.add(profileText);

    const hasProgress = Object.values(profile.progress).some((p) => p.completed);
    const allDone = LEVELS.every((level) => profile.progress[level.id]?.completed);
    const playLabel = allDone ? t('menu.townSelect') : hasProgress ? t('menu.continue') : t('menu.play');
    const buttons: { label: string; action: () => void; primary?: boolean }[] = [
      {
        label: playLabel,
        primary: true,
        action: () => {
          if (allDone) this.scene.start('LevelSelect');
          else this.startLevel(LEVELS[firstIncompleteLevel(profile)].id);
        },
      },
      { label: t('menu.townSelect'), action: () => this.scene.start('LevelSelect') },
      { label: t('menu.achievements'), action: () => this.scene.start('Achievements') },
      { label: t('menu.settings'), action: () => this.scene.start('Settings', { from: 'MainMenu' }) },
      { label: t('menu.credits'), action: () => this.scene.start('Credits') },
      { label: t('menu.profile'), action: () => this.scene.start('Profile') },
    ];

    if (short) {
      const bw = Math.min(w * 0.34, 300);
      const bh = Math.max(44, Math.min(58, h * 0.12));
      const xs = [w * 0.32, w * 0.68];
      const startY = h * 0.33;
      const gap = h * 0.17;
      buttons.forEach((entry, i) => {
        this.addMenuButton(entry.label, xs[i % 2], startY + Math.floor(i / 2) * gap, entry.action, {
          width: bw,
          height: bh,
          primary: entry.primary,
          fontSize: Math.round(bh * 0.32),
        });
      });
    } else {
      const bw = Math.min(wide ? 360 : 400, w * 0.4);
      const bh = Math.max(52, Math.min(74, h * 0.088));
      const x = wide ? w * 0.28 : w * 0.5;
      const startY = h * 0.35;
      const gap = Math.min(82, h * 0.105);
      buttons.forEach((entry, i) => {
        this.addMenuButton(entry.label, x, startY + i * gap, entry.action, {
          width: bw,
          height: bh,
          primary: entry.primary,
          fontSize: Math.round(bh * 0.32),
        });
      });
      if (wide) {
        const santaScale = Math.min((h * 0.43) / 320, (w * 0.19) / 256);
        const santa = this.add.sprite(w * 0.77, h * 0.9, 'santa', 'santa-idle-0')
          .setOrigin(0.5, 1)
          .setScale(santaScale);
        santa.play('santa-idle');
        this.content.add(santa);
        const shadow = this.add.image(w * 0.77, h * 0.9 + 2, 'props', 'glow-soft')
          .setTint(0x020812)
          .setAlpha(0.4)
          .setScale(0.9, 0.24);
        this.content.add(shadow);
        this.content.moveTo(shadow, 0);
      }
    }

    const hint = hasProgress
      ? t('levelselect.starsOf', { n: totalStars(profile) })
      : t('splash.hint');
    const footer = this.add.text(w / 2, h - 14, hint, {
      fontFamily: FONT_UI,
      fontSize: `${Math.max(10, Math.round(h * 0.018))}px`,
      color: '#7f9ab3',
      align: 'center',
    }).setOrigin(0.5, 1);
    this.content.add(footer);

    this.registerA11y();
  }

  private registerA11y(): void {
    const profile = save.profile;
    const allDone = LEVELS.every((level) => profile.progress[level.id]?.completed);
    const hasProgress = Object.values(profile.progress).some((p) => p.completed);
    const playLabel = allDone ? t('menu.townSelect') : hasProgress ? t('menu.continue') : t('menu.play');
    a11y.setMenu(t('app.title'), [
      { label: playLabel, action: () => this.activateFocusAction(0) },
      { label: t('menu.townSelect'), action: () => this.scene.start('LevelSelect') },
      { label: t('menu.achievements'), action: () => this.scene.start('Achievements') },
      { label: t('menu.settings'), action: () => this.scene.start('Settings', { from: 'MainMenu' }) },
      { label: t('menu.credits'), action: () => this.scene.start('Credits') },
      { label: t('menu.profile'), action: () => this.scene.start('Profile') },
    ]);
  }

  private activateFocusAction(index: number): void {
    const profile = save.profile;
    if (index === 0) {
      if (LEVELS.every((level) => profile.progress[level.id]?.completed)) this.scene.start('LevelSelect');
      else this.startLevel(LEVELS[firstIncompleteLevel(profile)].id);
    }
  }

  protected override onBack(): void {
    // The main menu has nowhere to go back to.
  }
}
