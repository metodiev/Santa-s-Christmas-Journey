import Phaser from 'phaser';
import { DEPTH, FONT_UI, TOWN_META } from '../config';
import type { TownId } from '../types';
import { addSnowfall, addVignette, ensureSkyTexture, titleStyle } from '../systems/Art';
import { audio } from '../audio/AudioSystem';
import { save } from '../systems/SaveSystem';
import { a11y, type A11yAction } from '../systems/A11y';

export interface ButtonOptions {
  width?: number;
  height?: number;
  primary?: boolean;
  icon?: string;
  fontSize?: number;
}

export class MenuButton extends Phaser.GameObjects.Container {
  readonly labelText: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.NineSlice;
  private icon?: Phaser.GameObjects.Image;
  private enabled = true;
  private focused = false;
  private pressed = false;
  private widthValue: number;
  private heightValue: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    private onClick: () => void,
    options: ButtonOptions = {},
  ) {
    super(scene, x, y);
    this.widthValue = options.width ?? 360;
    this.heightValue = options.height ?? 72;
    this.bg = scene.add.nineslice(
      0, 0, 'ui', options.primary ? 'button-hover' : 'button',
      this.widthValue, this.heightValue, 24, 24, 20, 20,
    ).setOrigin(0.5);
    this.labelText = scene.add.text(0, 0, label, {
      fontFamily: FONT_UI,
      fontSize: `${Math.round((options.fontSize ?? this.heightValue * 0.34) * (save.settings.largeText ? 1.15 : 1))}px`,
      color: '#f8e9c8',
      align: 'center',
      stroke: '#07111f',
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 2, color: '#000', blur: 3, fill: true },
    }).setOrigin(0.5);
    this.add([this.bg, this.labelText]);
    if (options.icon) {
      this.icon = scene.add.image(-this.widthValue / 2 + 32, 0, 'ui', options.icon).setScale(0.72);
      this.add(this.icon);
      this.labelText.setX(16);
    }
    this.setSize(this.widthValue, this.heightValue);
    this.setInteractive(new Phaser.Geom.Rectangle(-this.widthValue / 2, -this.heightValue / 2, this.widthValue, this.heightValue), Phaser.Geom.Rectangle.Contains);
    this.input!.cursor = 'pointer';
    this.on('pointerover', () => this.setHovered(true));
    this.on('pointerout', () => { this.setHovered(false); this.setPressed(false); });
    this.on('pointerdown', () => this.setPressed(true));
    this.on('pointerup', () => {
      const wasPressed = this.pressed;
      this.setPressed(false);
      if (wasPressed) this.activate();
    });
    scene.add.existing(this);
  }

  private setHovered(value: boolean): void {
    if (!this.enabled) return;
    this.bg.setTint(value || this.focused ? 0xffe6a3 : 0xffffff);
  }

  private setPressed(value: boolean): void {
    if (!this.enabled) return;
    this.pressed = value;
    this.setScale(value ? 0.97 : 1);
  }

  setFocused(value: boolean): void {
    if (!this.enabled) return;
    this.focused = value;
    this.bg.setTint(value ? 0xffe6a3 : 0xffffff);
    this.setScale(value ? 1.035 : 1);
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    this.setAlpha(value ? 1 : 0.45);
    if (value) this.setInteractive();
    else this.disableInteractive();
  }

  setLabel(label: string): void {
    this.labelText.setText(label);
  }

  activate(): void {
    if (!this.enabled) return;
    audio.playSfx('click');
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.96,
      scaleY: 0.96,
      duration: 80,
      yoyo: true,
      onComplete: () => this.onClick(),
    });
  }

  override destroy(fromScene?: boolean): void {
    this.icon?.destroy();
    super.destroy(fromScene);
  }
}

export class MenuBackground {
  private scene: Phaser.Scene;
  private sky: Phaser.GameObjects.Image;
  private layers: { sprite: Phaser.GameObjects.TileSprite; speed: number; bottom: number }[] = [];
  private groundTop: Phaser.GameObjects.TileSprite;
  private groundFill: Phaser.GameObjects.TileSprite;
  private house: Phaser.GameObjects.Image;
  private trees: Phaser.GameObjects.Image[] = [];
  private snow: Phaser.GameObjects.Particles.ParticleEmitter;
  private vignette: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, town: TownId = 'pine') {
    this.scene = scene;
    const width = scene.scale.width;
    const height = scene.scale.height;
    this.sky = scene.add.image(width / 2, height / 2, ensureSkyTexture(scene, town))
      .setDisplaySize(width, height)
      .setDepth(DEPTH.sky);
    const defs = [
      { key: `bg-${town}-far`, bottom: 0.91, speed: 2.5, depth: DEPTH.far + 20 },
      { key: `bg-${town}-mid`, bottom: 0.97, speed: 5, depth: DEPTH.mid + 20 },
      { key: `bg-${town}-near`, bottom: 1.035, speed: 9, depth: DEPTH.near + 20 },
    ];
    for (const def of defs) {
      const sprite = scene.add.tileSprite(0, 0, width, 480, def.key)
        .setOrigin(0, 1)
        .setDepth(def.depth);
      this.layers.push({ sprite, speed: def.speed, bottom: def.bottom });
    }
    this.groundTop = scene.add.tileSprite(0, 0, width, 26, 'tile-pine-top').setOrigin(0, 0).setDepth(DEPTH.ground - 2);
    this.groundFill = scene.add.tileSprite(0, 0, width, 70, 'tile-pine-fill').setOrigin(0, 0).setDepth(DEPTH.ground - 3);
    this.house = scene.add.image(0, 0, 'house-pine-1').setOrigin(0.5, 1).setDepth(DEPTH.house - 2);
    this.trees = [
      scene.add.image(0, 0, 'props', 'tree-pine-pine-0').setOrigin(0.5, 1).setDepth(DEPTH.decoBack),
      scene.add.image(0, 0, 'props', 'tree-pine-pine-1').setOrigin(0.5, 1).setDepth(DEPTH.decoBack),
      scene.add.image(0, 0, 'props', 'prop-snowman').setOrigin(0.5, 1).setDepth(DEPTH.decoBack),
    ];
    this.snow = addSnowfall(scene, DEPTH.decoBack - 400);
    this.vignette = addVignette(scene, DEPTH.vignette);
    this.layout();
  }

  layout(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    this.sky.setPosition(width / 2, height / 2).setDisplaySize(width, height);
    for (const layer of this.layers) {
      layer.sprite.setSize(width, 480);
      layer.sprite.y = height * layer.bottom;
    }
    this.groundTop.setPosition(0, height - 30).setSize(width, 26);
    this.groundFill.setPosition(0, height - 8).setSize(width, 30);
    const houseScale = Math.min(1, (height * 0.34) / 390);
    this.house.setPosition(width * 0.835, height - 12).setScale(houseScale);
    const treeScale = Math.min(1, (height * 0.3) / 240) * 0.5;
    this.trees[0].setPosition(width * 0.08, height - 8).setScale(treeScale * 1.1);
    this.trees[1].setPosition(width * 0.95, height - 6).setScale(treeScale);
    this.trees[2].setPosition(width * 0.14, height - 4).setScale(treeScale * 0.8);
    this.vignette.setDisplaySize(width, height).setPosition(0, 0);
    if (this.snow) {
      this.snow.destroy();
      this.snow = addSnowfall(this.scene, DEPTH.decoBack - 400);
    }
  }

  update(time: number, reducedMotion: boolean): void {
    for (const layer of this.layers) {
      layer.sprite.tilePositionX = reducedMotion ? 0 : time * 0.001 * layer.speed;
    }
    if (!reducedMotion) {
      this.house.setX(this.scene.scale.width * 0.835 + Math.sin(time * 0.0002) * 4);
    }
  }

  destroy(): void {
    this.sky.destroy();
    for (const layer of this.layers) layer.sprite.destroy();
    this.groundTop.destroy();
    this.groundFill.destroy();
    this.house.destroy();
    for (const tree of this.trees) tree.destroy();
    this.snow.destroy();
    this.vignette.destroy();
  }
}

export abstract class BaseMenuScene extends Phaser.Scene {
  protected content!: Phaser.GameObjects.Container;
  protected menuButtons: MenuButton[] = [];
  protected background!: MenuBackground;
  protected focusIndex = 0;
  private previousPad = new Set<string>();

  protected initialize(town: TownId = 'pine'): void {
    this.cameras.main.setBackgroundColor(TOWN_META[town].sky[0]);
    this.background = new MenuBackground(this, town);
    this.content = this.add.container(0, 0).setDepth(10);
    this.buildContent();
    this.updateFocus();

    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-UP', () => this.moveFocus(-1));
    keyboard?.on('keydown-DOWN', () => this.moveFocus(1));
    keyboard?.on('keydown-ENTER', () => this.activateFocus());
    keyboard?.on('keydown-SPACE', () => this.activateFocus());
    keyboard?.on('keydown-ESC', () => this.onBack());
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  protected abstract buildContent(): void;

  protected onBack(): void {
    this.scene.start('MainMenu');
  }

  protected addMenuButton(label: string, x: number, y: number, onClick: () => void, options?: ButtonOptions): MenuButton {
    const button = new MenuButton(this, x, y, label, onClick, options);
    this.content.add(button);
    this.menuButtons.push(button);
    return button;
  }

  protected setFocus(index: number): void {
    if (!this.menuButtons.length) return;
    this.focusIndex = Phaser.Math.Wrap(index, 0, this.menuButtons.length);
    this.updateFocus();
  }

  protected moveFocus(direction: number): void {
    if (!this.menuButtons.length) return;
    let index = this.focusIndex;
    for (let i = 0; i < this.menuButtons.length; i++) {
      index = Phaser.Math.Wrap(index + direction, 0, this.menuButtons.length);
      if (this.menuButtons[index].alpha > 0.6) break;
    }
    this.focusIndex = index;
    this.updateFocus();
    audio.playSfx('click');
  }

  private updateFocus(): void {
    this.menuButtons.forEach((button, i) => button.setFocused(i === this.focusIndex));
  }

  protected activateFocus(): void {
    const button = this.menuButtons[this.focusIndex];
    if (button && button.alpha > 0.6) button.activate();
  }

  protected setA11y(title: string, actions: A11yAction[]): void {
    a11y.setMenu(title, actions);
  }

  protected addTitle(text: string, y: number, size: number): Phaser.GameObjects.Text {
    const scaled = save.settings.largeText ? Math.round(size * 1.12) : size;
    const title = this.add.text(this.scale.width / 2, y, text, titleStyle(scaled)).setOrigin(0.5);
    this.content.add(title);
    return title;
  }

  protected addSubtitle(text: string, y: number, size = 20): Phaser.GameObjects.Text {
    const sub = this.add.text(this.scale.width / 2, y, text, {
      fontFamily: FONT_UI,
      fontSize: `${Math.round(size * (save.settings.largeText ? 1.12 : 1))}px`,
      color: '#b8d3e8',
      align: 'center',
    }).setOrigin(0.5);
    this.content.add(sub);
    return sub;
  }

  protected startLevel(levelId: string): void {
    this.scene.start('Game', { levelId });
  }

  protected refresh(): void {
    this.background.layout();
    this.content.destroy(true);
    this.content = this.add.container(0, 0).setDepth(10);
    this.menuButtons = [];
    this.focusIndex = 0;
    this.buildContent();
    this.updateFocus();
  }

  private onResize(): void {
    this.refresh();
  }

  private cleanup(): void {
    this.scale.off('resize', this.onResize, this);
    this.background.destroy();
    a11y.clearMenu();
  }

  override update(time: number, delta: number): void {
    this.background.update(time, save.settings.reducedMotion);
    void delta;
    const pad = this.input.gamepad?.getPad(0);
    if (!pad) return;
    const current = new Set<string>();
    if (pad.up || pad.buttons[12]?.pressed) {
      current.add('up');
      if (!this.previousPad.has('up')) this.moveFocus(-1);
    }
    if (pad.down || pad.buttons[13]?.pressed) {
      current.add('down');
      if (!this.previousPad.has('down')) this.moveFocus(1);
    }
    if (pad.A || pad.buttons[0]?.pressed) {
      current.add('a');
      if (!this.previousPad.has('a')) this.activateFocus();
    }
    if (pad.B || pad.buttons[1]?.pressed) {
      current.add('b');
      if (!this.previousPad.has('b')) this.onBack();
    }
    this.previousPad = current;
  }
}
