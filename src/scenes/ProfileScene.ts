import Phaser from 'phaser';
import { BaseMenuScene } from '../ui/MenuKit';
import { FONT_UI } from '../config';
import { MAX_PROFILES, totalStars } from '../systems/progress';
import { save } from '../systems/SaveSystem';
import { t } from '../systems/i18n';
import { a11y } from '../systems/A11y';
import { audio } from '../audio/AudioSystem';

export class ProfileScene extends BaseMenuScene {
  private domInput?: Phaser.GameObjects.DOMElement;
  private inputElement?: HTMLInputElement;
  private toastText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Profile' });
  }

  create(): void {
    this.initialize('pine');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.domInput?.destroy();
      this.inputElement = undefined;
      this.input.keyboard!.enabled = true;
    });
    a11y.setMenu(t('profile.title'), [
      ...save.profiles.map((profile) => ({
        label: `${profile.name}${profile.id === save.activeProfileId ? ' ✓' : ''}`,
        action: () => this.select(profile.id),
      })),
      { label: t('menu.back'), action: () => this.onBack() },
    ]);
  }

  protected buildContent(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const titleSize = Math.round(Math.max(26, Math.min(w / 26, h / 10, 46)));
    this.addTitle(t('profile.title'), h * 0.09, titleSize);
    const profiles = save.profiles;
    const rowH = Math.max(34, Math.min(56, (h * 0.56) / Math.max(1, profiles.length)));
    const rowW = Math.min(640, w - 80);
    const top = h * 0.2;

    profiles.forEach((profile, index) => {
      const y = top + index * rowH + rowH / 2;
      const active = profile.id === save.activeProfileId;
      const panel = this.add.nineslice(w / 2, y, 'ui', active ? 'button-hover' : 'panel', rowW, rowH - 6, 20, 20, 18, 18)
        .setInteractive({ useHandCursor: true });
      panel.on('pointerup', () => this.select(profile.id));
      this.content.add(panel);
      const name = this.add.text(w / 2 - rowW / 2 + 24, y, `${profile.name}${active ? `  ·  ${t('profile.active')}` : ''}`, {
        fontFamily: FONT_UI,
        fontSize: `${Math.max(12, Math.round(rowH * 0.36))}px`,
        color: active ? '#ffe6a8' : '#d7e7f5',
      }).setOrigin(0, 0.5);
      this.content.add(name);
      const stars = this.add.text(w / 2 + rowW / 2 - (profile.id === 'guest' ? 24 : 110), y, `★ ${totalStars(profile)}`, {
        fontFamily: FONT_UI,
        fontSize: `${Math.max(11, Math.round(rowH * 0.3))}px`,
        color: '#ffd166',
      }).setOrigin(1, 0.5);
      this.content.add(stars);
      if (profile.id !== 'guest') {
        this.addMenuButton(t('profile.delete'), w / 2 + rowW / 2 - 60, y, () => this.remove(profile.id, profile.name), {
          width: 84,
          height: 28,
          fontSize: 11,
        });
      }
    });

    if (profiles.length < MAX_PROFILES) {
      this.inputElement = document.createElement('input');
      this.inputElement.type = 'text';
      this.inputElement.maxLength = 18;
      this.inputElement.placeholder = t('profile.namePlaceholder');
      this.inputElement.setAttribute('aria-label', t('profile.name'));
      this.inputElement.style.cssText = 'width:220px;padding:8px 12px;border-radius:8px;border:1px solid #6b5324;background:#0a1728;color:#f6e7c8;font-family:Inter,system-ui,sans-serif;font-size:14px;outline:none;';
      this.domInput = this.add.dom(w / 2 - 80, h - 76, this.inputElement).setDepth(20);
      this.inputElement.addEventListener('focus', () => { if (this.input.keyboard) this.input.keyboard.enabled = false; });
      this.inputElement.addEventListener('blur', () => { if (this.input.keyboard) this.input.keyboard.enabled = true; });
      this.inputElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') this.createProfile();
      });
      this.addMenuButton(t('profile.create'), w / 2 + 110, h - 76, () => this.createProfile(), {
        width: 120,
        height: 38,
        fontSize: 15,
      });
    } else {
      this.addSubtitle(t('profile.max'), h - 76, 12);
    }

    this.addMenuButton(t('menu.back'), w / 2, h - 30, () => this.onBack(), {
      width: 150,
      height: 40,
      fontSize: 16,
    });
    a11y.setMenu(t('profile.title'), [
      ...profiles.map((profile) => ({
        label: `${profile.name}${profile.id === save.activeProfileId ? ' ✓' : ''}`,
        action: () => this.select(profile.id),
      })),
      { label: t('menu.back'), action: () => this.onBack() },
    ]);
  }

  private select(id: string): void {
    if (save.selectProfile(id)) {
      audio.playSfx('click');
      const name = save.profile.name;
      a11y.announce(`${t('profile.title')}: ${name}`);
      this.refresh();
    }
  }

  private remove(id: string, name: string): void {
    if (!window.confirm(t('profile.confirmDelete', { name }))) return;
    if (save.deleteProfile(id)) {
      audio.playSfx('back');
      this.refresh();
    }
  }

  private createProfile(): void {
    const value = this.inputElement?.value.trim() ?? '';
    if (!value) {
      this.showToast(t('profile.namePlaceholder'));
      return;
    }
    const profile = save.addProfile(value);
    if (!profile) {
      this.showToast(t('profile.max'));
      return;
    }
    audio.playSfx('unlock');
    a11y.announce(t('profile.saved'));
    this.refresh();
  }

  private showToast(text: string): void {
    this.toastText?.destroy();
    this.toastText = this.add.text(this.scale.width / 2, this.scale.height - 112, text, {
      fontFamily: FONT_UI,
      fontSize: '13px',
      color: '#ffe6a8',
      backgroundColor: '#081422',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1600, duration: 400 });
  }

  protected override onBack(): void {
    this.scene.start('MainMenu');
  }

  protected override refresh(): void {
    this.domInput?.destroy();
    this.domInput = undefined;
    this.inputElement = undefined;
    super.refresh();
  }
}
