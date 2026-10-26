import Phaser from 'phaser';
import { FONT_TITLE } from '../config';
import { MenuButton } from '../ui/MenuKit';
import { t } from '../systems/i18n';
import { audio } from '../audio/AudioSystem';
import { a11y } from '../systems/A11y';

export class PauseScene extends Phaser.Scene {
  private levelId = 'snowy-pine-village';
  private buttons: MenuButton[] = [];
  private focusIndex = 0;
  private overlay?: Phaser.GameObjects.Rectangle;
  private panel?: Phaser.GameObjects.NineSlice;
  private title?: Phaser.GameObjects.Text;
  private previousPad = new Set<string>();

  constructor() {
    super({ key: 'Pause' });
  }

  init(data: { levelId?: string }): void {
    this.levelId = data.levelId ?? this.levelId;
  }

  create(): void {
    this.build();
    this.scale.on('resize', this.build, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.build, this));
    this.input.keyboard?.on('keydown-ESC', () => this.resume());
    this.input.keyboard?.on('keydown-P', () => this.resume());
    this.input.keyboard?.on('keydown-UP', () => this.move(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.move(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.activate());
    this.input.keyboard?.on('keydown-SPACE', () => this.activate());
    a11y.setMenu(t('pause.title'), [
      { label: t('pause.resume'), action: () => this.resume() },
      { label: t('pause.restart'), action: () => this.restart() },
      { label: t('pause.settings'), action: () => this.openSettings() },
      { label: t('pause.quit'), action: () => this.quitToMenu() },
    ]);
  }

  private build(): void {
    for (const button of this.buttons) button.destroy();
    this.buttons = [];
    this.overlay?.destroy();
    this.panel?.destroy();
    this.title?.destroy();
    const w = this.scale.width;
    const h = this.scale.height;
    this.overlay = this.add.rectangle(0, 0, w, h, 0x02060f, 0.72).setOrigin(0).setDepth(0);
    const panelW = Math.min(470, w * 0.62);
    const panelH = Math.min(470, h * 0.82);
    this.panel = this.add.nineslice(w / 2, h / 2, 'ui', 'panel', panelW, panelH, 28, 28, 28, 28).setDepth(1);
    this.title = this.add.text(w / 2, h / 2 - panelH / 2 + 58, t('pause.title'), {
      fontFamily: FONT_TITLE,
      fontSize: `${Math.max(26, Math.min(panelW * 0.12, 40))}px`,
      color: '#ffe9b0',
    }).setOrigin(0.5).setDepth(2);
    const bw = Math.min(320, panelW * 0.7);
    const bh = Math.max(42, Math.min(58, panelH * 0.13));
    const gap = Math.min(70, panelH * 0.16);
    const startY = h / 2 - panelH / 2 + 130;
    const labels = [t('pause.resume'), t('pause.restart'), t('pause.settings'), t('pause.quit')];
    const actions = [() => this.resume(), () => this.restart(), () => this.openSettings(), () => this.quitToMenu()];
    labels.forEach((label, i) => {
      const button = new MenuButton(this, w / 2, startY + i * gap, label, actions[i], {
        width: bw,
        height: bh,
        primary: i === 0,
        fontSize: Math.round(bh * 0.32),
      }).setDepth(2);
      this.buttons.push(button);
    });
    this.focusIndex = 0;
    this.updateFocus();
  }

  private updateFocus(): void {
    this.buttons.forEach((button, i) => button.setFocused(i === this.focusIndex));
  }

  private move(direction: number): void {
    this.focusIndex = Phaser.Math.Wrap(this.focusIndex + direction, 0, this.buttons.length);
    this.updateFocus();
    audio.playSfx('click');
  }

  private activate(): void {
    this.buttons[this.focusIndex]?.activate();
  }

  private resume(): void {
    audio.resumeMusic();
    this.scene.resume('UI');
    this.scene.resume('Game');
    this.scene.stop();
  }

  private restart(): void {
    audio.stopMusic();
    this.scene.stop('UI');
    this.scene.stop('Game');
    this.scene.stop('Backdrop');
    this.scene.start('Game', { levelId: this.levelId });
  }

  private openSettings(): void {
    this.scene.pause();
    this.scene.launch('Settings', { from: 'Pause' });
  }

  private quitToMenu(): void {
    audio.stopMusic();
    this.scene.stop('UI');
    this.scene.stop('Game');
    this.scene.stop('Backdrop');
    this.scene.start('MainMenu');
  }

  override update(): void {
    const pad = this.input.gamepad?.getPad(0);
    if (!pad) return;
    const current = new Set<string>();
    if (pad.up || pad.buttons[12]?.pressed) {
      current.add('up');
      if (!this.previousPad.has('up')) this.move(-1);
    }
    if (pad.down || pad.buttons[13]?.pressed) {
      current.add('down');
      if (!this.previousPad.has('down')) this.move(1);
    }
    if (pad.A || pad.buttons[0]?.pressed) {
      current.add('a');
      if (!this.previousPad.has('a')) this.activate();
    }
    if (pad.buttons[9]?.pressed || pad.B) {
      current.add('start');
      if (!this.previousPad.has('start')) this.resume();
    }
    this.previousPad = current;
  }
}
