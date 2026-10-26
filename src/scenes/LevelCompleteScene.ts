import Phaser from 'phaser';
import { FONT_TITLE, FONT_UI, formatTime, getLevel, nextLevelId } from '../config';
import type { LevelResult } from '../types';
import { MenuButton } from '../ui/MenuKit';
import { t } from '../systems/i18n';
import { audio } from '../audio/AudioSystem';
import { a11y } from '../systems/A11y';

interface CompleteData {
  levelId: string;
  result: LevelResult;
  unlocked: string[];
  newBest: boolean;
}

export class LevelCompleteScene extends Phaser.Scene {
  private completeData!: CompleteData;
  private buttons: MenuButton[] = [];
  private focusIndex = 0;
  private objects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'LevelComplete' });
  }

  init(data: CompleteData): void {
    this.completeData = data;
  }

  create(): void {
    this.build();
    this.scale.on('resize', this.build, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.build, this));
    this.input.keyboard?.on('keydown-LEFT', () => this.move(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.move(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.activate());
    this.input.keyboard?.on('keydown-SPACE', () => this.activate());
    this.input.keyboard?.on('keydown-ESC', () => this.toTownSelect());
    this.time.delayedCall(1300, () => audio.playMusic('menu'));
    a11y.setMenu(t('complete.title'), this.a11yActions());
  }

  private a11yActions() {
    const next = nextLevelId(this.completeData.levelId);
    return [
      ...(next ? [{ label: t('complete.next'), action: () => this.startLevel(next) }] : [{ label: t('menu.back'), action: () => this.toMainMenu() }]),
      { label: t('complete.replay'), action: () => this.startLevel(this.completeData.levelId) },
      { label: t('complete.towns'), action: () => this.toTownSelect() },
    ];
  }

  private build(): void {
    for (const button of this.buttons) button.destroy();
    for (const object of this.objects) object.destroy();
    this.objects = [];
    this.buttons = [];
    const w = this.scale.width;
    const h = this.scale.height;
    const level = getLevel(this.completeData.levelId);
    const final = level.index === 4;
    const overlay = this.add.rectangle(0, 0, w, h, 0x02060f, 0.75).setOrigin(0);
    this.objects.push(overlay);
    const panelW = Math.min(660, w * 0.92);
    const panelH = Math.min(550, h * 0.94);
    const cx = w / 2;
    const cy = h / 2;
    const panel = this.add.nineslice(cx, cy, 'ui', 'panel', panelW, panelH, 30, 30, 30, 30);
    this.objects.push(panel);
    const top = cy - panelH / 2;
    const titleText = final ? t('complete.finish') : t('complete.title');
    const title = this.add.text(cx, top + 54, titleText, {
      fontFamily: FONT_TITLE,
      fontSize: `${Math.max(24, Math.min(panelW * 0.075, 46))}px`,
      color: '#ffe9b0',
      align: 'center',
    }).setOrigin(0.5);
    this.objects.push(title);
    if (final) {
      const body = this.add.text(cx, top + 88, t('complete.finishBody'), {
        fontFamily: FONT_UI,
        fontSize: '13px',
        color: '#b8d3e8',
        align: 'center',
        wordWrap: { width: panelW - 60 },
      }).setOrigin(0.5);
      this.objects.push(body);
    }

    const starY = top + (final ? 128 : 112);
    const result = this.completeData.result;
    for (let i = 0; i < 3; i++) {
      const star = this.add.image(cx + (i - 1) * Math.min(80, panelW * 0.14), starY, 'ui', 'ui-star-empty')
        .setScale(0.95);
      this.objects.push(star);
      if (i < result.stars) {
        this.time.delayedCall(380 + i * 260, () => {
          if (!star.active) return;
          star.setTexture('ui', 'ui-star-full');
          this.tweens.add({ targets: star, scale: 1.18, duration: 180, yoyo: true, ease: 'Quad.easeOut' });
          audio.playSfx('coin');
        });
      }
    }

    const statStart = starY + 46;
    const lineH = Math.max(19, Math.min(28, panelH * 0.05));
    const stats = [
      `${t('complete.gifts')}: ${result.giftsDelivered}/${result.giftsTotal}`,
      `${t('complete.secrets')}: ${result.secretsFound}/${result.secretsTotal}`,
      `${t('complete.time')}: ${formatTime(result.time)}`,
      `${t('complete.score')}: ${result.score}`,
    ];
    stats.forEach((line, i) => {
      const text = this.add.text(cx, statStart + i * lineH, line, {
        fontFamily: FONT_UI,
        fontSize: '15px',
        color: i === 3 ? '#ffe6a8' : '#cfe4f3',
        align: 'center',
      }).setOrigin(0.5);
      this.objects.push(text);
    });

    let infoY = statStart + stats.length * lineH + 6;
    if (this.completeData.newBest) {
      const best = this.add.text(cx, infoY, t('complete.newBest'), {
        fontFamily: FONT_UI,
        fontSize: '14px',
        color: '#9fefc0',
      }).setOrigin(0.5);
      this.objects.push(best);
      infoY += 22;
    }
    if (this.completeData.unlocked.length) {
      const names = this.completeData.unlocked.slice(0, 3).map((id) => t(`achievement.${id}.title`)).join(' · ');
      const text = this.add.text(cx, infoY, names, {
        fontFamily: FONT_UI,
        fontSize: '11px',
        color: '#ffd166',
        align: 'center',
        wordWrap: { width: panelW - 60 },
      }).setOrigin(0.5);
      this.objects.push(text);
    }

    const next = nextLevelId(this.completeData.levelId);
    const labels = final
      ? [t('menu.back'), t('complete.replay'), t('complete.towns')]
      : [next ? t('complete.next') : t('menu.back'), t('complete.replay'), t('complete.towns')];
    const actions = final
      ? [() => this.toMainMenu(), () => this.startLevel(this.completeData.levelId), () => this.toTownSelect()]
      : [() => (next ? this.startLevel(next) : this.toMainMenu()), () => this.startLevel(this.completeData.levelId), () => this.toTownSelect()];
    const bw = Math.min(170, (panelW - 80) / 3 - 10);
    const bh = Math.max(36, Math.min(54, panelH * 0.1));
    const gap = bw + 12;
    const buttonY = cy + panelH / 2 - 38;
    labels.forEach((label, i) => {
      const button = new MenuButton(this, cx + (i - 1) * gap, buttonY, label, actions[i], {
        width: bw,
        height: bh,
        primary: i === 0,
        fontSize: Math.round(bh * 0.3),
      });
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

  private startLevel(levelId: string): void {
    audio.stopMusic();
    this.scene.stop('UI');
    this.scene.stop('Game');
    this.scene.stop('Backdrop');
    this.scene.start('Game', { levelId });
  }

  private toTownSelect(): void {
    audio.stopMusic();
    this.scene.stop('Game');
    this.scene.stop('UI');
    this.scene.stop('Backdrop');
    this.scene.start('LevelSelect');
  }

  private toMainMenu(): void {
    audio.stopMusic();
    this.scene.stop('Game');
    this.scene.stop('UI');
    this.scene.stop('Backdrop');
    this.scene.start('MainMenu');
  }
}
