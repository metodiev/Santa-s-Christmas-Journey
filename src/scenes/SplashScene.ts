import Phaser from 'phaser';
import { BaseMenuScene } from '../ui/MenuKit';
import { FONT_UI, TOWN_META } from '../config';
import { t } from '../systems/i18n';
import { audio } from '../audio/AudioSystem';
import { a11y } from '../systems/A11y';
import { save } from '../systems/SaveSystem';

export class SplashScene extends BaseMenuScene {
  private started = false;

  constructor() {
    super({ key: 'Splash' });
  }

  create(): void {
    this.initialize('pine');
    this.input.on('pointerdown', () => this.begin());
    this.input.keyboard?.on('keydown-ENTER', () => this.begin());
    this.input.keyboard?.on('keydown-SPACE', () => this.begin());
    audio.playMusic('menu');
    a11y.setMenu(t('app.title'), [{ label: t('splash.tap'), action: () => this.begin() }]);
  }

  protected buildContent(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const titleSize = Math.round(Math.min(w / 13, h / 6, 92));
    this.addTitle(t('app.title'), h * 0.2, Math.max(42, titleSize));
    this.addSubtitle(t('app.subtitle'), h * 0.3, Math.round(Math.max(15, Math.min(w / 55, 24))));
    const santa = this.add.sprite(w / 2, h * 0.76, 'santa', 'santa-idle-0')
      .setOrigin(0.5, 1)
      .setScale(Math.min((h * 0.33) / 320, (w * 0.22) / 256));
    santa.play('santa-idle');
    this.content.add(santa);
    const shadow = this.add.image(w / 2, h * 0.76 + 2, 'props', 'glow-soft')
      .setTint(0x020812)
      .setAlpha(0.45)
      .setScale(0.85, 0.24);
    this.content.add(shadow);
    this.content.sendToBack(shadow);
    this.content.moveTo(shadow, 0);

    const buttonWidth = Math.min(340, w * 0.42);
    const buttonHeight = Math.max(52, Math.min(76, h * 0.1));
    const button = this.addMenuButton(t('splash.tap'), w / 2, h * 0.86, () => this.begin(), {
      width: buttonWidth,
      height: buttonHeight,
      primary: true,
    });
    this.tweens.add({ targets: button, scaleX: 1.02, scaleY: 1.02, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const hint = this.add.text(w / 2, h * 0.95, t('splash.hint'), {
      fontFamily: FONT_UI,
      fontSize: `${Math.max(11, Math.round(Math.min(w / 90, 15)))}px`,
      color: '#8fb1cc',
      align: 'center',
    }).setOrigin(0.5);
    this.content.add(hint);
    const version = this.add.text(16, h - 14, 'v1.0', {
      fontFamily: FONT_UI,
      fontSize: '11px',
      color: '#52708a',
    }).setOrigin(0, 1);
    this.content.add(version);
  }

  private begin(): void {
    if (this.started) return;
    this.started = true;
    audio.unlock();
    audio.playSfx('click');
    if (this.game.device.input.touch) {
      try { void this.scale.startFullscreen(); } catch { /* optional */ }
      try {
        const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        void orientation.lock?.('landscape');
      } catch { /* optional */ }
    }
    save.saveNow();
    this.cameras.main.fadeOut(350, 3, 8, 18);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MainMenu');
    });
  }

  protected override onBack(): void {
    this.begin();
  }

  get townAccent(): string {
    return TOWN_META.pine.accent;
  }
}
