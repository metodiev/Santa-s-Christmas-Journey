import Phaser from 'phaser';
import { BaseMenuScene } from '../ui/MenuKit';
import { FONT_UI } from '../config';
import { save } from '../systems/SaveSystem';
import { audio } from '../audio/AudioSystem';
import { LANGUAGES, getLanguage, setLanguage, t } from '../systems/i18n';
import { a11y } from '../systems/A11y';
import type { Language, Settings } from '../types';

type BooleanKey = 'vibration' | 'colorblind' | 'reducedMotion' | 'largeText' | 'filmGrain';

export class SettingsScene extends BaseMenuScene {
  private from = 'MainMenu';
  private toastText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Settings' });
  }

  init(data: { from?: string }): void {
    this.from = data.from ?? 'MainMenu';
  }

  create(): void {
    this.initialize('pine');
    if (this.from === 'MainMenu') audio.playMusic('menu');
  }

  protected buildContent(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const titleSize = Math.round(Math.max(26, Math.min(w / 26, h / 11, 44)));
    this.addTitle(t('settings.title'), h * 0.09, titleSize);
    const shortLabels = w < 900;
    const twoColumns = w >= 720;
    const colWidth = twoColumns ? (w - 100) / 2 : w - 80;
    const colLefts = twoColumns ? [50, 50 + colWidth + 0] : [40];
    const rowH = Math.max(34, Math.min(62, (h - h * 0.3) / 6));
    const top = h * 0.23;

    const leftX = colLefts[0];
    const rightX = twoColumns ? colLefts[1] : colLefts[0];
    const rightTop = twoColumns ? top : top + rowH * 4;

    this.addSlider(t('settings.music'), 'music', 0, 1, 0.05, leftX, top, colWidth, shortLabels);
    this.addSlider(t('settings.sfx'), 'sfx', 0, 1, 0.05, leftX, top + rowH, colWidth, shortLabels);
    this.addSlider(t('settings.controlSize'), 'controlScale', 0.75, 1.35, 0.05, leftX, top + rowH * 2, colWidth, shortLabels);
    this.addSlider(t('settings.controlOpacity'), 'controlOpacity', 0.4, 1, 0.05, leftX, top + rowH * 3, colWidth, shortLabels);

    let rightIndex = 0;
    const addRightToggle = (label: string, key: BooleanKey) => {
      const y = (twoColumns ? top : rightTop) + rightIndex * rowH;
      this.addToggle(label, key, rightX, y, colWidth);
      rightIndex++;
    };
    addRightToggle(t('settings.vibration'), 'vibration');
    addRightToggle(t('settings.colorblind'), 'colorblind');
    addRightToggle(t('settings.reducedMotion'), 'reducedMotion');
    addRightToggle(t('settings.largeText'), 'largeText');
    addRightToggle(t('settings.filmGrain'), 'filmGrain');
    this.addLanguageRow(rightX, (twoColumns ? top : rightTop) + rightIndex * rowH, colWidth);

    const resetY = h - 34;
    this.addMenuButton(t('settings.reset'), w / 2, resetY, () => this.confirmReset(), {
      width: Math.min(230, w * 0.3),
      height: 38,
      fontSize: 14,
    });
    this.addMenuButton(t('menu.back'), Math.max(70, w * 0.08), resetY, () => this.onBack(), {
      width: 120,
      height: 42,
      fontSize: 16,
    });

    const hint = this.add.text(w / 2, h - 68, shortLabels ? t('settings.largeTextHint') : t('settings.colorblindHint'), {
      fontFamily: FONT_UI,
      fontSize: '11px',
      color: '#7891a6',
    }).setOrigin(0.5);
    this.content.add(hint);
    this.registerA11y();
  }

  private addSlider(
    label: string,
    key: 'music' | 'sfx' | 'controlScale' | 'controlOpacity',
    min: number,
    max: number,
    step: number,
    x: number,
    y: number,
    width: number,
    shortLabels: boolean,
  ): void {
    const labelText = this.add.text(x, y, '', {
      fontFamily: FONT_UI,
      fontSize: `${shortLabels ? 13 : 15}px`,
      color: '#d7e7f5',
    }).setOrigin(0, 0.5);
    this.content.add(labelText);
    const labelWidth = Math.max(90, Math.min(150, width * 0.38));
    labelText.setWordWrapWidth(labelWidth);
    const trackW = Math.max(60, width - labelWidth - 100);
    const trackX = x + labelWidth + 6;
    const track = this.add.rectangle(trackX, y, trackW, 8, 0x23384c).setOrigin(0, 0.5).setDepth(2);
    const fill = this.add.rectangle(trackX + 1, y, 0, 6, 0xe6bd6a).setOrigin(0, 0.5).setDepth(3);
    const knob = this.add.circle(trackX, y, 7, 0xffe9a8).setDepth(4);
    this.content.add([track, fill, knob]);
    this.addMenuButton('−', x + width - 58, y, () => change(-step), { width: 26, height: 26, fontSize: 16 });
    this.addMenuButton('+', x + width - 24, y, () => change(step), { width: 26, height: 26, fontSize: 16 });

    const percentFormat = (value: number) => `${Math.round(value * 100)}%`;
    const paint = () => {
      const value = save.settings[key] as number;
      const tValue = (value - min) / (max - min);
      fill.width = Math.max(0, trackW * tValue);
      knob.setX(trackX + trackW * tValue);
      labelText.setText(`${label} ${percentFormat(value)}`);
    };
    const change = (delta: number) => {
      const current = save.settings[key] as number;
      const raw = Phaser.Math.Clamp(current + delta, min, max);
      const snapped = Math.round(raw / step) * step;
      save.updateSettings({ [key]: Number(snapped.toFixed(2)) } as Partial<Settings>);
      audio.playSfx('click');
      paint();
    };
    const zone = this.add.zone(trackX, y - 10, trackW, 24).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.content.add(zone);
    const setFromPointer = (pointerX: number) => {
      const ratio = Phaser.Math.Clamp((pointerX - trackX) / trackW, 0, 1);
      const value = Math.round((min + ratio * (max - min)) / step) * step;
      save.updateSettings({ [key]: Number(value.toFixed(2)) } as Partial<Settings>);
      paint();
    };
    let dragging = false;
    const onMove = (pointer: Phaser.Input.Pointer) => {
      if (dragging) setFromPointer(pointer.x);
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      this.input.off('pointermove', onMove);
      this.input.off('pointerup', onUp);
      audio.playSfx('click');
    };
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragging = true;
      this.input.on('pointermove', onMove);
      this.input.on('pointerup', onUp);
      setFromPointer(pointer.x);
    });
    paint();
  }

  private addToggle(label: string, key: BooleanKey, x: number, y: number, width: number): void {
    const labelText = this.add.text(x, y, t(label), {
      fontFamily: FONT_UI,
      fontSize: `${this.scale.width < 900 ? 13 : 15}px`,
      color: '#d7e7f5',
      wordWrap: { width: width - 110 },
    }).setOrigin(0, 0.5);
    this.content.add(labelText);
    const button = this.addMenuButton(save.settings[key] ? t('common.on') : t('common.off'), x + width - 50, y, () => {
      save.updateSettings({ [key]: !save.settings[key] });
      button.setLabel(save.settings[key] ? t('common.on') : t('common.off'));
      audio.playSfx('click');
      if (key === 'largeText') this.refresh();
    }, { width: 92, height: 32, fontSize: 13 });
    void button;
    void width;
  }

  private addLanguageRow(x: number, y: number, width: number): void {
    const labelText = this.add.text(x, y, t('settings.language'), {
      fontFamily: FONT_UI,
      fontSize: `${this.scale.width < 900 ? 13 : 15}px`,
      color: '#d7e7f5',
    }).setOrigin(0, 0.5);
    this.content.add(labelText);
    const current = getLanguage();
    const index = LANGUAGES.findIndex((l) => l.id === current);
    this.addMenuButton(LANGUAGES[index]?.label ?? 'English', x + width - 60, y, () => {
      const next = LANGUAGES[(index + 1) % LANGUAGES.length];
      setLanguage(next.id as Language);
      save.updateSettings({ language: next.id });
      audio.playSfx('click');
      this.refresh();
    }, { width: 110, height: 32, fontSize: 12 });
  }

  private confirmReset(): void {
    const profile = save.profile.name;
    if (window.confirm(t('settings.resetConfirm', { profile }))) {
      save.resetProgress();
      audio.playSfx('unlock');
      this.showToast(t('settings.resetDone'));
      this.refresh();
    }
  }

  private showToast(text: string): void {
    this.toastText?.destroy();
    this.toastText = this.add.text(this.scale.width / 2, this.scale.height - 90, text, {
      fontFamily: FONT_UI,
      fontSize: '14px',
      color: '#ffe6a8',
      backgroundColor: '#081422',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1800, duration: 500 });
  }

  private registerA11y(): void {
    const actions = [
      { label: `${t('settings.music')} +`, action: () => this.adjust('music', 0.05) },
      { label: `${t('settings.music')} −`, action: () => this.adjust('music', -0.05) },
      { label: `${t('settings.sfx')} +`, action: () => this.adjust('sfx', 0.05) },
      { label: `${t('settings.sfx')} −`, action: () => this.adjust('sfx', -0.05) },
      { label: `${t('settings.vibration')}: ${save.settings.vibration ? t('common.on') : t('common.off')}`, action: () => save.updateSettings({ vibration: !save.settings.vibration }) },
      { label: `${t('settings.colorblind')}: ${save.settings.colorblind ? t('common.on') : t('common.off')}`, action: () => save.updateSettings({ colorblind: !save.settings.colorblind }) },
      { label: `${t('settings.reducedMotion')}: ${save.settings.reducedMotion ? t('common.on') : t('common.off')}`, action: () => save.updateSettings({ reducedMotion: !save.settings.reducedMotion }) },
      { label: `${t('settings.largeText')}: ${save.settings.largeText ? t('common.on') : t('common.off')}`, action: () => save.updateSettings({ largeText: !save.settings.largeText }) },
      { label: t('settings.reset'), action: () => this.confirmReset() },
      { label: t('menu.back'), action: () => this.onBack() },
    ];
    a11y.setMenu(t('settings.title'), actions);
  }

  private adjust(key: 'music' | 'sfx', delta: number): void {
    save.updateSettings({ [key]: Phaser.Math.Clamp(Number(((save.settings[key] as number) + delta).toFixed(2)), 0, 1) } as Partial<Settings>);
  }

  protected override onBack(): void {
    if (this.from === 'Pause') {
      this.scene.resume('Pause');
      this.scene.stop();
      return;
    }
    this.scene.start('MainMenu');
  }
}
