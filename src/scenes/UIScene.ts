import Phaser from 'phaser';
import {
  FONT_UI, MAX_HEARTS, SPIRIT_MAX, formatTime,
} from '../config';
import type { HudState } from '../types';
import { save } from '../systems/SaveSystem';
import { virtualControls } from '../systems/InputSystem';
import { t } from '../systems/i18n';
import { a11y } from '../systems/A11y';
import { addFilmGrain, addVignette, titleStyle } from '../systems/Art';
import type { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private hud!: Phaser.GameObjects.Container;
  private controls!: Phaser.GameObjects.Container;
  private promptBox!: Phaser.GameObjects.Container;
  private promptBg!: Phaser.GameObjects.NineSlice;
  private promptText!: Phaser.GameObjects.Text;
  private bossBox!: Phaser.GameObjects.Container;
  private bossFill!: Phaser.GameObjects.Rectangle;
  private bossLabel!: Phaser.GameObjects.Text;
  private areaText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Image[] = [];
  private heartCount?: Phaser.GameObjects.Text;
  private giftText!: Phaser.GameObjects.Text;
  private secretText!: Phaser.GameObjects.Text;
  private spiritFill!: Phaser.GameObjects.Rectangle;
  private spiritTrack!: Phaser.GameObjects.Rectangle;
  private spiritLabel!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private giftButton?: Phaser.GameObjects.Image;
  private giftGlow?: Phaser.GameObjects.Image;
  private joystickKnob?: Phaser.GameObjects.Image;
  private joystickPointer: number | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private vignette!: Phaser.GameObjects.Image;
  private grain!: Phaser.GameObjects.TileSprite;
  private lastHud?: HudState;
  private toastQueue: string[] = [];
  private toastBusy = false;
  private nearHouse = false;
  private grainTimer = 0;
  private touchEnabled = false;

  constructor() {
    super({ key: 'UI' });
  }

  create(): void {
    this.gameScene = this.scene.get('Game') as GameScene;
    this.touchEnabled = this.sys.game.device.input.touch || window.matchMedia('(pointer: coarse)').matches;
    this.vignette = addVignette(this, 0).setAlpha(0.55).setDepth(1);
    this.grain = addFilmGrain(this).setVisible(save.settings.filmGrain && !save.settings.reducedMotion).setDepth(2);
    this.createHud();
    this.createPrompt();
    this.createBossBar();
    this.createAreaBanner();
    this.createToast();
    if (this.touchEnabled) this.createControls();

    this.bindGameEvents();
    save.on('settings', this.onSettings, this);
    this.scale.on('resize', this.onResize, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.applyHud(this.gameScene.getHudState());
    this.refreshA11yText();
    a11y.setMenu(t('app.title'), [{ label: t('pause.title'), action: () => this.gameScene.pauseGame() }]);
  }

  private depthHud = 10;
  private bossTrackWidth = 260;
  private promptMessage: string | null = null;

  private refreshA11yText(): void {
    if (!save.settings.largeText) return;
    const scaleContainer = (container?: Phaser.GameObjects.Container) => {
      if (!container) return;
      for (const child of container.list) {
        if (!(child instanceof Phaser.GameObjects.Text)) continue;
        const size = Number.parseFloat(String(child.style.fontSize));
        if (Number.isFinite(size)) child.setFontSize(Math.round(size * 1.16));
      }
    };
    scaleContainer(this.hud);
    scaleContainer(this.promptBox);
    scaleContainer(this.bossBox);
    for (const text of [this.areaText, this.toastText]) {
      if (!text) continue;
      const size = Number.parseFloat(String(text.style.fontSize));
      if (Number.isFinite(size)) text.setFontSize(Math.round(size * 1.16));
    }
  }

  private createHud(): void {
    this.hud?.destroy(true);
    this.hud = this.add.container(0, 0).setDepth(this.depthHud);
    this.hearts = [];
    const w = this.scale.width;
    const h = this.scale.height;
    const compact = h < 500;
    const heartScale = compact ? 0.55 : 0.68;
    for (let i = 0; i < MAX_HEARTS; i++) {
      const heart = this.add.image(18 + i * (compact ? 30 : 38), 18, 'ui', 'ui-heart-full')
        .setOrigin(0.5, 0)
        .setScale(heartScale);
      this.hud.add(heart);
      this.hearts.push(heart);
    }
    this.heartCount = this.add.text(18 + MAX_HEARTS * (compact ? 30 : 38) + 4, 22, '', {
      fontFamily: FONT_UI,
      fontSize: '13px',
      color: '#ffb3b3',
    }).setOrigin(0, 0);
    this.hud.add(this.heartCount);
    const giftIcon = this.add.image(22, compact ? 58 : 68, 'ui', 'ui-gift').setOrigin(0.5, 0).setScale(compact ? 0.52 : 0.62);
    this.hud.add(giftIcon);
    this.giftText = this.add.text(42, compact ? 58 : 68, '0', {
      fontFamily: FONT_UI,
      fontSize: compact ? '15px' : '18px',
      color: '#f6e7c8',
      stroke: '#07111f',
      strokeThickness: 2,
    }).setOrigin(0, 0);
    this.hud.add(this.giftText);
    const secretIcon = this.add.image(compact ? 92 : 108, compact ? 58 : 68, 'ui', 'ui-snowflake').setOrigin(0.5, 0).setScale(compact ? 0.4 : 0.48);
    this.hud.add(secretIcon);
    this.secretText = this.add.text(compact ? 108 : 126, compact ? 58 : 68, '0/3', {
      fontFamily: FONT_UI,
      fontSize: compact ? '13px' : '15px',
      color: '#9fe0ff',
      stroke: '#07111f',
      strokeThickness: 2,
    }).setOrigin(0, 0);
    this.hud.add(this.secretText);

    const spiritY = compact ? 88 : 104;
    const spiritWidth = Math.min(230, w * 0.32);
    const spiritIcon = this.add.image(22, spiritY, 'ui', 'ui-spirit').setOrigin(0.5, 0).setScale(compact ? 0.5 : 0.58);
    this.hud.add(spiritIcon);
    this.spiritLabel = this.add.text(40, spiritY - 2, t('hud.spirit'), {
      fontFamily: FONT_UI,
      fontSize: compact ? '9px' : '10px',
      color: '#d9c89a',
    }).setOrigin(0, 0);
    this.hud.add(this.spiritLabel);
    this.spiritTrack = this.add.rectangle(42, spiritY + 14, spiritWidth, 8, 0x1c2b3a)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x6b5324, 0.7);
    this.hud.add(this.spiritTrack);
    this.spiritFill = this.add.rectangle(43, spiritY + 14, 0, 6, 0xe6bd6a).setOrigin(0, 0.5);
    this.hud.add(this.spiritFill);

    this.timeText = this.add.text(w - 70, 18, '0:00', {
      fontFamily: FONT_UI,
      fontSize: compact ? '16px' : '20px',
      color: '#d7e7f5',
      stroke: '#07111f',
      strokeThickness: 3,
    }).setOrigin(1, 0);
    this.hud.add(this.timeText);
    const pause = this.add.image(w - 34, 22, 'ui', 'ui-pause')
      .setOrigin(0.5, 0)
      .setScale(compact ? 0.65 : 0.8)
      .setInteractive({ useHandCursor: true });
    pause.on('pointerup', () => this.gameScene.pauseGame());
    this.hud.add(pause);
  }

  private createPrompt(): void {
    this.promptBox?.destroy(true);
    this.promptBox = this.add.container(this.scale.width / 2, 0).setDepth(40).setVisible(false);
    this.promptBg = this.add.nineslice(0, 0, 'ui', 'panel', 300, 46, 20, 20, 18, 18).setOrigin(0.5);
    this.promptText = this.add.text(0, 0, '', {
      fontFamily: FONT_UI,
      fontSize: '15px',
      color: '#ffe6a8',
      align: 'center',
    }).setOrigin(0.5);
    this.promptBox.add([this.promptBg, this.promptText]);
    this.positionPrompt();
  }

  private positionPrompt(): void {
    if (!this.promptBox) return;
    const h = this.scale.height;
    const y = this.touchEnabled ? h - 270 * save.settings.controlScale : h - 56;
    this.promptBox.setPosition(this.scale.width / 2, y);
  }

  private createBossBar(): void {
    this.bossBox?.destroy(true);
    this.bossBox = this.add.container(this.scale.width / 2, 18).setDepth(35).setVisible(false);
    const width = Math.min(420, this.scale.width * 0.42);
    this.bossTrackWidth = width - 32;
    const bg = this.add.nineslice(0, 0, 'ui', 'panel-dark', width, 40, 18, 18, 16, 16).setOrigin(0.5);
    this.bossLabel = this.add.text(0, -12, t('hud.boss'), {
      fontFamily: FONT_UI,
      fontSize: '12px',
      color: '#ffb3b3',
      stroke: '#07111f',
      strokeThickness: 2,
    }).setOrigin(0.5);
    const track = this.add.rectangle(0, 8, this.bossTrackWidth, 8, 0x2a1218).setOrigin(0.5);
    this.bossFill = this.add.rectangle(-this.bossTrackWidth / 2, 8, this.bossTrackWidth, 6, 0xd64040).setOrigin(0, 0.5);
    this.bossBox.add([bg, this.bossLabel, track, this.bossFill]);
  }

  private createAreaBanner(): void {
    this.areaText?.destroy();
    this.areaText = this.add.text(this.scale.width / 2, 82, '', titleStyle(22))
      .setOrigin(0.5)
      .setDepth(42)
      .setAlpha(0);
  }

  private createToast(): void {
    this.toastText?.destroy();
    this.toastBusy = false;
    this.toastText = this.add.text(this.scale.width / 2, 120, '', {
      fontFamily: FONT_UI,
      fontSize: '15px',
      color: '#ffe6a8',
      backgroundColor: '#081422dd',
      padding: { x: 16, y: 9 },
      align: 'center',
      wordWrap: { width: Math.min(560, this.scale.width - 60) },
    }).setOrigin(0.5).setDepth(50).setAlpha(0);
  }

  private createControls(): void {
    this.controls?.destroy(true);
    this.controls = this.add.container(0, 0).setDepth(30);
    this.joystickPointer = null;
    virtualControls.releaseAll();
    const w = this.scale.width;
    const h = this.scale.height;
    const scale = Phaser.Math.Clamp(save.settings.controlScale, 0.75, 1.35);
    const opacity = Phaser.Math.Clamp(save.settings.controlOpacity, 0.3, 1);
    const radius = 48 * scale;
    const joyX = 30 + radius;
    const joyY = h - 30 - radius;
    this.joystickCenter = { x: joyX, y: joyY };
    const base = this.add.image(joyX, joyY, 'ui', 'round-button').setScale((radius * 2) / 96).setAlpha(0.32 * opacity);
    const knob = this.add.image(joyX, joyY, 'ui', 'round-button').setScale((radius * 0.72) / 96).setAlpha(0.62 * opacity).setTint(0xffe6a8);
    this.controls.add([base, knob]);
    this.joystickKnob = knob;
    const zone = this.add.zone(0, h * 0.5, w * 0.45, h * 0.5).setOrigin(0, 0).setInteractive();
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer !== null) return;
      this.joystickPointer = pointer.id;
      this.applyJoystick(pointer);
    });
    this.controls.add(zone);

    const buttonConfig: { action: 'jump' | 'run' | 'gift' | 'down'; icon: string; x: number; y: number; size: number }[] = [
      { action: 'jump', icon: 'ui-jump', x: w - 74 * scale, y: h - 84 * scale, size: 74 },
      { action: 'run', icon: 'ui-run', x: w - 178 * scale, y: h - 60 * scale, size: 52 },
      { action: 'gift', icon: 'ui-gift', x: w - 184 * scale, y: h - 174 * scale, size: 50 },
      { action: 'down', icon: 'ui-slide', x: w - 76 * scale, y: h - 190 * scale, size: 50 },
    ];
    for (const config of buttonConfig) {
      const image = this.add.image(config.x, config.y, 'ui', 'round-button')
        .setScale((config.size * scale) / 96)
        .setAlpha(opacity)
        .setInteractive({ useHandCursor: false });
      const icon = this.add.image(config.x, config.y, 'ui', config.icon)
        .setScale((config.size * scale) / 96 * 0.55)
        .setAlpha(opacity);
      image.on('pointerdown', () => virtualControls.press(config.action));
      image.on('pointerup', () => virtualControls.release(config.action));
      image.on('pointerout', () => virtualControls.release(config.action));
      this.controls.add([image, icon]);
      if (config.action === 'gift') {
        this.giftButton = image;
        this.giftGlow = this.add.image(config.x, config.y, 'props', 'glow-soft')
          .setTint(0xffd166)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScale(1.2)
          .setAlpha(0)
          .setDepth(-1);
        this.controls.add(this.giftGlow);
      }
    }
    this.controls.setAlpha(1);
  }

  private applyJoystick(pointer: Phaser.Input.Pointer): void {
    const max = 44 * Phaser.Math.Clamp(save.settings.controlScale, 0.75, 1.35);
    const dx = pointer.x - this.joystickCenter.x;
    const dy = pointer.y - this.joystickCenter.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = Math.max(-max, Math.min(max, (dx / length) * Math.min(length, max)));
    const ny = Math.max(-max, Math.min(max, (dy / length) * Math.min(length, max)));
    this.joystickKnob?.setPosition(this.joystickCenter.x + nx, this.joystickCenter.y + ny);
    const threshold = 14;
    if (dx < -threshold) { if (!virtualControls.down.left) virtualControls.press('left'); } else virtualControls.release('left');
    if (dx > threshold) { if (!virtualControls.down.right) virtualControls.press('right'); } else virtualControls.release('right');
    if (dy > threshold * 1.8) { if (!virtualControls.down.down) virtualControls.press('down'); } else virtualControls.release('down');
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.joystickPointer) this.applyJoystick(pointer);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joystickPointer) return;
    this.joystickPointer = null;
    virtualControls.release('left');
    virtualControls.release('right');
    virtualControls.release('down');
    if (this.joystickKnob) this.joystickKnob.setPosition(this.joystickCenter.x, this.joystickCenter.y);
  }

  private bindGameEvents(): void {
    this.gameScene.events.on('hud', this.applyHud, this);
    this.gameScene.events.on('hud-prompt', this.showPrompt, this);
    this.gameScene.events.on('hud-toast', this.enqueueToast, this);
    this.gameScene.events.on('hud-boss', this.applyBoss, this);
    this.gameScene.events.on('hud-area', this.showArea, this);
    this.gameScene.events.on('hud-near-house', this.setNearHouse, this);
  }

  private applyHud(state: HudState): void {
    this.lastHud = state;
    for (let i = 0; i < this.hearts.length; i++) {
      const heart = this.hearts[i];
      const full = i < state.hearts;
      heart.setTexture('ui', full ? 'ui-heart-full' : 'ui-heart-empty');
      if (save.settings.colorblind) heart.setTint(full ? 0x7fd8ff : 0x6b7f92);
      else heart.clearTint();
    }
    if (this.heartCount) this.heartCount.setText(save.settings.colorblind ? `${state.hearts}` : '');
    this.giftText.setText(`${state.presents}`);
    this.secretText.setText(`${state.secretsFound}/${state.secretsTotal}`);
    const ratio = Phaser.Math.Clamp(state.spirit / SPIRIT_MAX, 0, 1);
    this.spiritFill.width = Math.max(0, (this.spiritTrack.width - 2) * ratio);
    this.spiritFill.fillColor = state.spiritActive ? 0xffec9a : 0xe6bd6a;
    this.spiritLabel.setText(state.spiritActive ? `${t('hud.spirit')} ✦` : t('hud.spirit'));
    this.timeText.setText(formatTime(state.time));
    this.timeText.setColor(state.time > 240 ? '#ffb3b3' : '#d7e7f5');
    this.applyBossFromState(state);
    this.positionPrompt();
  }

  private applyBossFromState(state: HudState): void {
    this.bossBox.setVisible(state.bossActive);
    if (state.bossActive) {
      this.bossFill.width = Math.max(0, this.bossTrackWidth * (state.bossHealth / 3));
    }
  }

  private applyBoss(data: { active: boolean; health: number }): void {
    if (!data.active) {
      this.bossBox.setVisible(false);
      return;
    }
    this.bossBox.setVisible(true);
    this.bossFill.width = Math.max(0, this.bossTrackWidth * (data.health / 3));
    this.bossLabel.setText(t('hud.boss'));
  }

  private showPrompt(text: string | null): void {
    if (!this.promptBox) return;
    this.promptMessage = text;
    if (!text) {
      this.promptBox.setVisible(false);
      return;
    }
    this.promptText.setText(text);
    const width = Math.max(220, Math.min(440, this.promptText.width + 40));
    this.promptBg.setSize(width, 46);
    this.promptBox.setVisible(true);
    this.positionPrompt();
  }

  private setNearHouse(value: boolean): void {
    this.nearHouse = value;
  }

  private enqueueToast(text: string): void {
    this.toastQueue.push(text);
    if (!this.toastBusy) this.nextToast();
  }

  private nextToast(): void {
    const text = this.toastQueue.shift();
    if (!text) {
      this.toastBusy = false;
      return;
    }
    this.toastBusy = true;
    this.toastText.setText(text).setAlpha(0);
    this.tweens.add({ targets: this.toastText, alpha: 1, y: 126, duration: 180, ease: 'Quad.easeOut' });
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: this.toastText,
        alpha: 0,
        y: 118,
        duration: 240,
        onComplete: () => this.nextToast(),
      });
    });
  }

  private showArea(data: { index: number; name: string }): void {
    this.areaText.setText(t('game.area', { n: data.index, name: data.name }));
    this.areaText.setAlpha(0);
    this.tweens.add({ targets: this.areaText, alpha: 1, duration: 300 });
    this.time.delayedCall(2600, () => {
      this.tweens.add({ targets: this.areaText, alpha: 0, duration: 500 });
    });
  }

  private onSettings(): void {
    this.grain.setVisible(save.settings.filmGrain && !save.settings.reducedMotion);
    this.createHud();
    this.createPrompt();
    this.createBossBar();
    this.createAreaBanner();
    this.createToast();
    if (this.touchEnabled) this.createControls();
    if (this.lastHud) this.applyHud(this.lastHud);
    if (this.promptMessage) this.showPrompt(this.promptMessage);
    this.refreshA11yText();
  }

  private onResize(): void {
    this.vignette.setDisplaySize(this.scale.width, this.scale.height);
    this.grain.setSize(this.scale.width, this.scale.height);
    this.createHud();
    this.createPrompt();
    this.createBossBar();
    this.createAreaBanner();
    this.createToast();
    if (this.touchEnabled) this.createControls();
    if (this.lastHud) this.applyHud(this.lastHud);
    this.positionPrompt();
    if (this.promptMessage) this.showPrompt(this.promptMessage);
    this.refreshA11yText();
  }

  override update(time: number, delta: number): void {
    const grainVisible = this.grain.visible;
    this.grainTimer -= delta;
    if (grainVisible && this.grainTimer <= 0) {
      this.grainTimer = 90;
      this.grain.tilePositionX = Math.random() * 128;
      this.grain.tilePositionY = Math.random() * 128;
    }
    if (this.nearHouse && this.giftGlow) {
      const pulse = 0.28 + Math.abs(Math.sin(time / 220)) * 0.4;
      this.giftGlow.setAlpha(pulse);
      if (this.giftButton) this.giftButton.setTint(0xffe6a8);
    } else if (this.giftButton) {
      this.giftButton.clearTint();
      this.giftGlow?.setAlpha(0);
    }
  }

  private cleanup(): void {
    this.scale.off('resize', this.onResize, this);
    save.off('settings', this.onSettings, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
    this.gameScene.events.off('hud', this.applyHud, this);
    this.gameScene.events.off('hud-prompt', this.showPrompt, this);
    this.gameScene.events.off('hud-toast', this.enqueueToast, this);
    this.gameScene.events.off('hud-boss', this.applyBoss, this);
    this.gameScene.events.off('hud-area', this.showArea, this);
    this.gameScene.events.off('hud-near-house', this.setNearHouse, this);
    virtualControls.releaseAll();
    a11y.clearMenu();
  }
}
