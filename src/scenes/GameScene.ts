import Phaser from 'phaser';
import {
  DEPTH, FONT_UI, HOUSE_ROOF_OFFSET, MAX_HEARTS, PHYSICS, TOWN_META,
  computeScore, formatTime, getLevel, starsFor,
} from '../config';
import type {
  HudState, LevelData, LevelResult, PlatformDef, TownId,
} from '../types';
import { save } from '../systems/SaveSystem';
import { audio } from '../audio/AudioSystem';
import { t } from '../systems/i18n';
import { a11y } from '../systems/A11y';
import { titleStyle } from '../systems/Art';
import { Santa, type SurfaceInfo } from '../entities/Santa';
import { Enemy, createEnemyAnimations } from '../entities/Enemy';
import { Krampus } from '../entities/Krampus';
import { House } from '../entities/House';
import { Present } from '../entities/Present';
import { Checkpoint } from '../entities/Checkpoint';
import { createHazard, type Hazard } from '../entities/Hazards';
import { MovingPlatform, TimedPlatform, CrumblingPlatform, addStaticZone } from '../entities/Platforms';
import { InputSystem } from '../systems/InputSystem';
import type { BackdropScene } from './BackdropScene';

interface ProjectileEntry {
  sprite: Phaser.Physics.Arcade.Image;
  life: number;
}

export class GameScene extends Phaser.Scene {
  private level!: LevelData;
  private town!: TownId;
  private santa!: Santa;
  private inputSys!: InputSystem;
  private solidGroup!: Phaser.Physics.Arcade.StaticGroup;
  private projectileGroup!: Phaser.Physics.Arcade.Group;
  private platforms: { def: PlatformDef; zone: Phaser.Physics.Arcade.Image }[] = [];
  private houseRoofs: { x: number; y: number }[] = [];
  private houses: House[] = [];
  private enemies: Enemy[] = [];
  private hazards: Hazard[] = [];
  private presents: Present[] = [];
  private checkpoints: Checkpoint[] = [];
  private movingPlatforms: MovingPlatform[] = [];
  private timedPlatforms: TimedPlatform[] = [];
  private crumblingPlatforms: CrumblingPlatform[] = [];
  private projectiles: ProjectileEntry[] = [];
  private boss?: Krampus;
  private bossGateZone?: Phaser.Physics.Arcade.Image;
  private bossGateVisual?: Phaser.GameObjects.TileSprite;
  private bossStarted = false;
  private bossDefeated = false;
  private warningMarkers: Phaser.GameObjects.Text[] = [];
  private respawnPoint = { x: 0, y: 0 };
  private elapsed = 0;
  private presentsCollected = 0;
  private giftsDelivered = 0;
  private secretsFound = 0;
  private deaths = 0;
  private damageTaken = 0;
  private enemiesStomped = 0;
  private ended = false;
  private deadState = false;
  private finishing = false;
  private currentArea = -1;
  private hudTimer = 0;
  private lastPrompt: string | null = null;
  private tipsShown = new Set<number>();
  private secretsFoundIds = new Set<string>();
  private playMusicId = '';

  constructor() {
    super({ key: 'Game' });
  }

  init(data: { levelId?: string }): void {
    this.level = getLevel(data.levelId ?? 'snowy-pine-village');
    this.town = this.level.town;
    this.platforms = [];
    this.houseRoofs = [];
    this.houses = [];
    this.enemies = [];
    this.hazards = [];
    this.presents = [];
    this.checkpoints = [];
    this.movingPlatforms = [];
    this.timedPlatforms = [];
    this.crumblingPlatforms = [];
    this.projectiles = [];
    this.warningMarkers = [];
    this.tipsShown.clear();
    this.secretsFoundIds.clear();
    this.boss = undefined;
    this.bossGateZone = undefined;
    this.bossGateVisual = undefined;
    this.bossStarted = false;
    this.bossDefeated = false;
    this.elapsed = 0;
    this.presentsCollected = 0;
    this.giftsDelivered = 0;
    this.secretsFound = 0;
    this.deaths = 0;
    this.damageTaken = 0;
    this.enemiesStomped = 0;
    this.ended = false;
    this.deadState = false;
    this.presentInventory = 0;
    this.finishing = false;
    this.currentArea = -1;
    this.hudTimer = 0;
    this.lastPrompt = null;
    this.respawnPoint = { x: this.level.spawn.x, y: this.level.spawn.y };
  }

  create(): void {
    if (!this.textures.exists('pixel')) {
      const texture = this.textures.createCanvas('pixel', 1, 1);
      texture?.getContext().fillRect(0, 0, 1, 1);
      texture?.refresh();
    }
    createEnemyAnimations(this);
    this.playMusicId = this.level.music;
    audio.playMusic(this.level.music);

    this.physics.world.setBounds(0, 0, this.level.width, this.level.height + 400);
    this.cameras.main.setBounds(0, 0, this.level.width, this.level.height);
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    this.solidGroup = this.physics.add.staticGroup();
    this.projectileGroup = this.physics.add.group({ allowGravity: false });

    this.createPlatforms();
    this.createHouses();
    this.createDecorations();
    this.createPresents();
    this.createEnemies();
    this.createHazards();
    this.createCheckpoints();
    this.createGoal();
    this.createBoss();

    this.santa = new Santa(this, this.level.spawn.x, this.level.spawn.y);
    this.santa.onLand = (impact) => this.onSantaLand(impact);
    this.santa.onJump = () => audio.playSfx('jump');
    this.santa.onDoubleJump = () => audio.playSfx('doubleJump');
    this.santa.onStep = () => audio.playSfx('land');
    this.santa.onPound = () => this.onGroundPound();

    this.physics.add.collider(this.santa, this.solidGroup);
    for (const enemy of this.enemies) this.physics.add.collider(enemy, this.solidGroup);
    if (this.boss) this.physics.add.collider(this.boss, this.solidGroup);
    this.physics.add.collider(this.projectileGroup, this.solidGroup, (object) => {
      this.removeProjectile(object as Phaser.Physics.Arcade.Image);
    });

    this.inputSys = new InputSystem(this);
    this.setupCamera();
    this.setupEvents();
    this.setupBackdrop();
    this.setupUi();
    this.emitHud(true);
    this.emitArea(0);
    a11y.announce(t('a11y.controls'));

    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.on(Phaser.Scenes.Events.RESUME, () => this.inputSys.reset());
  }

  private setupCamera(): void {
    const zoom = Phaser.Math.Clamp(
      Math.min(this.scale.width / 1280, this.scale.height / 720),
      0.7,
      1.15,
    );
    this.cameras.main.setZoom(zoom);
    this.cameras.main.setFollowOffset(
      (this.scale.width / 2) * (1 / zoom - 1),
      this.scale.height * (0.58 / zoom - 0.5),
    );
    this.cameras.main.startFollow(this.santa, true, 0.12, 0.1);
    this.cameras.main.setDeadzone(150, 110);
  }

  private setupBackdrop(): void {
    if (this.scene.isActive('Backdrop')) this.scene.stop('Backdrop');
    this.scene.launch('Backdrop', { levelId: this.level.id });
  }

  private setupUi(): void {
    if (this.scene.isActive('UI')) this.scene.stop('UI');
    this.scene.launch('UI', { levelId: this.level.id });
  }

  /* ------------------------------------------------------------------ */
  /* World construction                                                  */
  /* ------------------------------------------------------------------ */

  private tileKey(material: string | undefined, part: 'top' | 'fill'): string {
    return `tile-${this.town}-${material === 'alt' ? 'alt-' : ''}${part}`;
  }

  private createPlatforms(): void {
    for (const def of this.level.platforms) {
      const oneWay = Boolean(def.oneWay);
      const zone = addStaticZone(this, this.solidGroup, def.x, def.y, def.w, def.h, oneWay);
      this.platforms.push({ def, zone });
      const topKey = this.tileKey(def.material, 'top');
      const fillKey = this.tileKey(def.material, 'fill');
      if (oneWay) {
        this.add.tileSprite(def.x, def.y, def.w, 40, `tile-${this.town}-platform`)
          .setOrigin(0, 0)
          .setDepth(DEPTH.ground);
      } else {
        this.add.tileSprite(def.x, def.y + 22, def.w, Math.max(1, def.h + 500), fillKey)
          .setOrigin(0, 0)
          .setDepth(DEPTH.ground);
        this.add.tileSprite(def.x, def.y, def.w, 24, topKey)
          .setOrigin(0, 0)
          .setDepth(DEPTH.ground + 1);
      }
      if (def.conveyor) {
        const arrows: Phaser.GameObjects.Triangle[] = [];
        for (let ax = 22; ax < def.w - 16; ax += 60) {
          const arrow = this.add.triangle(
            def.x + ax, def.y + 10,
            0, 0, 12, 7, 0, 14,
            0xffd166,
          ).setOrigin(0, 0).setAlpha(0.5).setDepth(DEPTH.ground + 2);
          if (def.conveyor.dir < 0) arrow.setAngle(180);
          arrows.push(arrow);
        }
        if (arrows.length) {
          this.tweens.add({
            targets: arrows,
            alpha: { from: 0.22, to: 0.62 },
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
      }
    }

    for (const def of this.level.movingPlatforms) {
      this.movingPlatforms.push(new MovingPlatform(this, def, this.town));
    }
    for (const def of this.level.timedPlatforms) {
      this.timedPlatforms.push(new TimedPlatform(this, def, this.town, this.solidGroup));
    }
    for (const def of this.level.crumblingPlatforms) {
      this.crumblingPlatforms.push(new CrumblingPlatform(this, def, this.town, this.solidGroup));
    }
  }

  private createHouses(): void {
    for (const def of this.level.houses) {
      this.houses.push(new House(this, def, this.town));
      const roofY = def.y - HOUSE_ROOF_OFFSET;
      const zone = addStaticZone(this, this.solidGroup, def.x - 150, roofY, 300, 208, false);
      this.houseRoofs.push({ x: def.x, y: roofY });
      void zone;
    }
  }

  private createDecorations(): void {
    for (const deco of this.level.decorations) {
      if (deco.key === 'goal-tree') continue;
      let obj: Phaser.GameObjects.GameObject;
      if (deco.key.startsWith('prop-') || deco.key.startsWith('tree-') || deco.key.startsWith('particle-') || deco.key.startsWith('glow-')) {
        const image = this.add.image(deco.x, deco.y + 4, 'props', deco.key)
          .setOrigin(0.5, 1)
          .setScale(0.5 * (deco.scale ?? 1))
          .setDepth(DEPTH.decoBack + (deco.depth ?? 0));
        if (deco.flip) image.setFlipX(true);
        obj = image;
      } else {
        const image = this.add.image(deco.x, deco.y + 4, deco.key)
          .setOrigin(0.5, 1)
          .setScale(0.5 * (deco.scale ?? 1))
          .setDepth(DEPTH.decoBack);
        obj = image;
      }
      void obj;
    }
  }

  private createPresents(): void {
    for (const [index, def] of this.level.presents.entries()) {
      this.presents.push(new Present(this, def.x, def.y, def.secret, index));
    }
  }

  private createEnemies(): void {
    for (const def of this.level.enemies) {
      const enemy = new Enemy(this, def);
      this.enemies.push(enemy);
    }
  }

  private createHazards(): void {
    for (const def of this.level.hazards) {
      const hazard = createHazard(this, def, this.town);
      if (!hazard) continue;
      this.hazards.push(hazard);
    }
    this.updateWarningMarkers();
  }

  private createCheckpoints(): void {
    for (const def of this.level.checkpoints) {
      this.checkpoints.push(new Checkpoint(this, def.x, def.y, def.area));
    }
  }

  private createGoal(): void {
    const tree = this.add.image(this.level.goal.x, this.level.goal.y + 8, 'goal-tree')
      .setOrigin(0.5, 1)
      .setScale(2 / 3)
      .setDepth(DEPTH.house);
    const glow = this.add.image(this.level.goal.x, this.level.goal.y - 230, 'props', 'glow-soft')
      .setTint(0xffd166)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.24)
      .setScale(2.2)
      .setDepth(DEPTH.house - 1);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.16, to: 0.34 },
      scale: { from: 1.9, to: 2.4 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.add.particles(this.level.goal.x, this.level.goal.y - 200, 'props', { frame: 'particle-spark',
      x: { min: -160, max: 160 },
      y: { min: -240, max: 60 },
      speedY: { min: -12, max: -4 },
      speedX: { min: -8, max: 8 },
      lifespan: { min: 1200, max: 2600 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: 260,
      quantity: 1,
      tint: [0xffd166, 0xff8fa3, 0x8fe3ff, 0x9fefc0],
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(DEPTH.fx);
    void tree;
  }

  private createBoss(): void {
    const boss = this.level.boss;
    if (!boss) return;
    this.boss = new Krampus(this, boss.x, this.level.groundY);
    this.bossGateVisual = this.add.tileSprite(
      boss.gateX - 30,
      this.level.groundY - 330,
      60,
      330,
      `tile-${this.town}-block`,
    ).setOrigin(0, 0).setDepth(DEPTH.house + 1);
    this.bossGateZone = addStaticZone(this, this.solidGroup, boss.gateX - 30, this.level.groundY - 330, 60, 330, false);
    const glow = this.add.rectangle(boss.gateX, this.level.groundY - 165, 74, 330, 0x9fe8ff, 0.16)
      .setDepth(DEPTH.house);
    this.bossGateVisual.once(Phaser.GameObjects.Events.DESTROY, () => glow.destroy());
    this.add.particles(boss.gateX, this.level.groundY - 330, 'props', { frame: 'particle-snow',
      x: { min: -24, max: 24 },
      y: { min: 0, max: 320 },
      speedY: { min: 10, max: 30 },
      lifespan: { min: 900, max: 1800 },
      scale: { start: 0.25, end: 0.05 },
      alpha: { start: 0.4, end: 0 },
      frequency: 320,
    }).setDepth(DEPTH.house + 2);
  }

  /* ------------------------------------------------------------------ */
  /* Events & UI                                                         */
  /* ------------------------------------------------------------------ */

  private setupEvents(): void {
    this.events.on('enemy-shoot', this.onEnemyShoot, this);
    this.events.on('enemy-stomped', this.onEnemyStomped, this);
    this.events.on('boss-awake', this.onBossAwake, this);
    this.events.on('boss-throw', this.onBossThrow, this);
    this.events.on('boss-slam', this.onBossSlam, this);
    this.events.on('boss-health', this.onBossHealth, this);
    this.events.on('boss-defeated', this.onBossDefeated, this);
    this.events.on('spirit-activated', this.onSpiritActivated, this);
    this.events.on('spirit-ended', this.onSpiritEnded, this);
    this.events.on('santa-hurt', this.onSantaHurt, this);
    this.events.on('hearts-changed', () => this.emitHud(true));
    save.on('settings', this.onSettings, this);
  }

  private onEnemyShoot(enemy: Enemy): void {
    if (this.ended) return;
    this.spawnProjectile(enemy.x, enemy.y - 50, 'spark', this.santa.x, this.santa.y - 40);
  }

  private onEnemyStomped(enemy: Enemy): void {
    this.enemiesStomped += 1;
    const burst = this.add.particles(enemy.x, enemy.y - 30, 'props', { frame: 'particle-snow',
      speed: { min: 50, max: 130 },
      lifespan: 450,
      scale: { start: 0.45, end: 0 },
      quantity: 9,
      emitting: false,
    }).setDepth(DEPTH.fx);
    burst.explode(9);
    this.time.delayedCall(600, () => burst.destroy());
    audio.playSfx('stomp');
    save.vibrate(20);
    if (Math.random() < 0.3 && this.presents.length < 140) {
      const drop = new Present(this, enemy.x, enemy.y - 40, undefined, Math.floor(Math.random() * 3));
      this.presents.push(drop);
    }
    this.emitHud(true);
  }

  private onBossAwake(): void {
    if (this.ended) return;
    this.bossStarted = true;
    this.events.emit('hud-boss', { active: true, health: this.boss?.health ?? 3 });
    this.events.emit('hud-toast', t('game.boss'));
    audio.stopMusic();
    audio.playMusic('boss');
    audio.playSfx('boss');
    save.vibrate([60, 40, 80]);
    a11y.announce(t('game.boss'));
    this.cameras.main.flash(220, 120, 20, 30);
  }

  private onBossThrow(x: number, y: number, face: number): void {
    if (!this.boss?.awake) return;
    for (const spread of [-90, 90]) {
      this.spawnProjectile(x, y, 'coal', this.santa.x + spread, this.santa.y - 20);
    }
    audio.playSfx('woosh');
    void face;
  }

  private onBossSlam(x: number, y: number): void {
    if (this.ended) return;
    this.shake(240, 0.012);
    audio.playSfx('stomp');
    const dust = this.add.particles(x, y - 8, 'props', { frame: 'particle-snow',
      speed: { min: 90, max: 220 },
      angle: { min: 190, max: 350 },
      lifespan: 700,
      scale: { start: 0.6, end: 0 },
      quantity: 20,
      emitting: false,
    }).setDepth(DEPTH.fx);
    dust.explode(20);
    this.time.delayedCall(900, () => dust.destroy());
    if (this.santa.grounded && Math.abs(this.santa.x - x) < 300) {
      this.santa.hurt(x);
    }
  }

  private onBossHealth(health: number): void {
    this.events.emit('hud-boss', { active: true, health });
    audio.playSfx('bossHit');
  }

  private onBossDefeated(): void {
    this.bossDefeated = true;
    this.events.emit('hud-boss', { active: false, health: 0 });
    this.events.emit('hud-toast', t('game.bossDefeated'));
    a11y.announce(t('game.bossDefeated'));
    audio.stopMusic();
    audio.playSfx('victory');
    this.time.delayedCall(700, () => {
      if (this.bossGateZone) (this.bossGateZone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      if (this.bossGateVisual) {
        this.tweens.add({
          targets: this.bossGateVisual,
          alpha: 0,
          scaleY: 0.1,
          duration: 900,
          ease: 'Quad.easeIn',
        });
      }
      this.events.emit('hud-toast', t('game.gateOpen'));
      audio.playSfx('gate');
      this.shake(300, 0.01);
      this.cameras.main.flash(300, 160, 240, 255);
    });
  }

  private onSpiritActivated(): void {
    this.events.emit('hud-toast', t('game.spiritActive'));
    audio.playSfx('spirit');
    this.cameras.main.flash(280, 255, 220, 130);
    a11y.announce(t('game.spiritActive'));
    const burst = this.add.particles(this.santa.x, this.santa.y - 70, 'props', { frame: 'particle-spark',
      speed: { min: 80, max: 220 },
      lifespan: { min: 400, max: 900 },
      scale: { start: 0.6, end: 0 },
      quantity: 24,
      emitting: false,
      tint: 0xffd166,
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(DEPTH.fx);
    burst.explode(24);
    this.time.delayedCall(1000, () => burst.destroy());
    this.emitHud(true);
  }

  private onSpiritEnded(): void {
    this.events.emit('hud-toast', t('game.spiritEnd'));
    this.emitHud(true);
  }

  private onSantaHurt(): void {
    this.damageTaken += 1;
    audio.playSfx('hurt');
    save.vibrate(80);
    this.cameras.main.flash(160, 120, 0, 0);
    this.emitHud(true);
    a11y.announce(t('hud.hearts', { n: this.santa.health }));
    if (save.settings.reducedMotion) return;
    this.cameras.main.shake(120, 0.008);
  }

  private onSettings(): void {
    this.updateWarningMarkers();
  }

  private updateWarningMarkers(): void {
    for (const marker of this.warningMarkers) marker.destroy();
    this.warningMarkers = [];
    if (!save.settings.colorblind) return;
    for (const hazard of this.hazards) {
      const point = hazard.warningPoint();
      if (!point) continue;
      const marker = this.add.text(point.x, point.y, '!', {
        fontFamily: FONT_UI,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#1b1206',
        backgroundColor: '#ffd166',
        padding: { x: 5, y: 1 },
      }).setOrigin(0.5, 0.5).setDepth(DEPTH.fx);
      this.tweens.add({ targets: marker, y: point.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.warningMarkers.push(marker);
    }
  }

  private emitHud(force = false): void {
    if (!this.santa) return;
    this.events.emit('hud', this.getHudState());
    if (force) this.hudTimer = 0.1;
  }

  getHudState(): HudState {
    const giftsTotal = this.houses.filter((h) => h.hasChild).length;
    return {
      hearts: this.santa?.health ?? MAX_HEARTS,
      presents: this.presentInventory,
      spirit: this.santa?.spirit ?? 0,
      spiritActive: Boolean(this.santa?.isSpirit),
      giftsDelivered: this.giftsDelivered,
      giftsTotal,
      secretsFound: this.secretsFound,
      secretsTotal: this.level.secrets.length,
      time: this.elapsed,
      bossActive: Boolean(this.boss?.awake),
      bossHealth: this.boss?.health ?? 0,
    };
  }

  private presentInventory = 0;

  private emitArea(index: number): void {
    if (index < 0 || index >= this.level.areas.length) return;
    const area = this.level.areas[index];
    this.currentArea = index;
    this.events.emit('hud-area', { index: area.index, name: area.name });
  }

  private toast(text: string): void {
    this.events.emit('hud-toast', text);
  }

  /* ------------------------------------------------------------------ */
  /* Main loop                                                           */
  /* ------------------------------------------------------------------ */

  override update(time: number, delta: number): void {
    if (this.ended || !this.santa) return;
    const dt = Math.min(delta / 1000, 0.05);
    this.inputSys.update();
    if (this.inputSys.justPressed('pause')) {
      this.pauseGame();
      return;
    }

    this.elapsed += dt;
    this.hudTimer -= dt;
    this.syncBackdrop();
    this.updatePlatforms(time, dt);
    this.updateHazards(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateBoss(dt);

    const surface = this.getSurface();
    const shadow = this.findShadowGround();
    this.santa.update(dt, this.inputSys, surface, shadow);

    this.updatePresents();
    this.updateCheckpoints();
    this.updateSecrets();
    this.updateAreas();
    this.updateTips();
    this.updateDelivery();
    this.updateGoals();

    if (this.santa.y > this.level.height + 90 && !this.deadState) {
      this.santa.setDeadFromFall();
    }
    if (this.santa.dead && !this.deadState) this.handleDeath();
    if (this.hudTimer <= 0) this.emitHud(true);
  }

  private syncBackdrop(): void {
    const backdrop = this.scene.get('Backdrop') as BackdropScene | undefined;
    if (backdrop?.sync) backdrop.sync(this.cameras.main.scrollX);
  }

  private updatePlatforms(time: number, dt: number): void {
    for (const platform of this.movingPlatforms) {
      const { dx, dy } = platform.update(time);
      if (platform.standingOn(this.santa)) {
        this.santa.x += dx;
        this.santa.y += dy;
        if (this.santa.body.velocity.y > 0) this.santa.body.setVelocityY(0);
      }
    }
    for (const platform of this.timedPlatforms) platform.update(time);
    for (const platform of this.crumblingPlatforms) platform.update(dt, this.santa);
  }

  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.isDead || !enemy.active) {
        this.enemies.splice(i, 1);
        continue;
      }
      enemy.update(dt, this.santa, (x, y) => this.isGroundAhead(x, y));
      if (enemy.isDead || !enemy.active || !enemy.body) {
        if (enemy.isDead) this.enemies.splice(i, 1);
        continue;
      }
      const santaRect = this.santa.body;
      const enemyRect = enemy.getRect();
      if (!Phaser.Geom.Intersects.RectangleToRectangle(
        new Phaser.Geom.Rectangle(santaRect.x, santaRect.y, santaRect.width, santaRect.height),
        enemyRect,
      )) continue;
      const stomped = this.santa.body.velocity.y > 80 && this.santa.body.bottom < enemyRect.top + 34;
      if (stomped) {
        enemy.stomp();
        this.santa.body.setVelocityY(-PHYSICS.stompBounce);
        this.santa.body.setVelocityX((this.santa.x - enemy.x) * 1.4);
        this.shake(90, 0.005);
      } else {
        this.santa.hurt(enemy.x);
      }
    }
  }

  private updateHazards(dt: number): void {
    for (const hazard of this.hazards) {
      hazard.update(dt, this.santa, this.level.groundY);
      if (this.santa.dead) break;
    }
  }

  private updateBoss(dt: number): void {
    const def = this.level.boss;
    if (!def || !this.boss) return;
    if (!this.bossStarted && !this.bossDefeated && this.santa.x >= def.triggerX) {
      this.boss.awaken();
    }
    if (!this.boss.awake || this.boss.isDefeated) return;
    this.boss.updateBoss(dt, this.santa);
    const bossBody = this.boss.body;
    const santaBody = this.santa.body;
    const rectA = new Phaser.Geom.Rectangle(santaBody.x, santaBody.y, santaBody.width, santaBody.height);
    const rectB = new Phaser.Geom.Rectangle(bossBody.x, bossBody.y, bossBody.width, bossBody.height);
    if (!Phaser.Geom.Intersects.RectangleToRectangle(rectA, rectB)) return;
    const stomp = this.santa.body.velocity.y > 80 && this.santa.body.bottom < bossBody.top + 80;
    if (stomp) {
      const defeated = this.boss.hit();
      this.santa.body.setVelocityY(-PHYSICS.stompBounce);
      if (defeated) {
        this.bossDefeated = true;
      }
    } else {
      this.santa.hurt(this.boss.x);
    }
  }

  private updatePresents(): void {
    const body = this.santa.body;
    const santaRect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
    for (let i = this.presents.length - 1; i >= 0; i--) {
      const present = this.presents[i];
      if (present.collected || !present.active) {
        this.presents.splice(i, 1);
        continue;
      }
      if (Phaser.Geom.Intersects.RectangleToRectangle(santaRect, present.getRect())) {
        present.collect();
        this.presentInventory += 1;
        this.presentsCollected += 1;
        this.santa.addSpirit(3);
        audio.playSfx('coin');
        this.emitHud(true);
      }
    }
  }

  private updateCheckpoints(): void {
    for (const checkpoint of this.checkpoints) {
      if (checkpoint.check(this.santa)) {
        this.respawnPoint = { x: checkpoint.x + 30, y: checkpoint.y - 20 };
        this.toast(t('game.checkpoint'));
        a11y.announce(t('game.checkpoint'));
        this.emitHud(true);
      }
    }
  }

  private updateSecrets(): void {
    const body = this.santa.body;
    const santaRect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
    for (const secret of this.level.secrets) {
      if (this.secretsFoundIds.has(secret.id)) continue;
      const rect = new Phaser.Geom.Rectangle(secret.x, secret.y, secret.w, secret.h);
      if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, santaRect)) continue;
      this.secretsFoundIds.add(secret.id);
      this.secretsFound += 1;
      this.santa.addSpirit(10);
      audio.playSfx('secret');
      this.toast(t('game.secret', { name: secret.name }));
      a11y.announce(t('game.secret', { name: secret.name }));
      this.cameras.main.flash(240, 255, 226, 150);
      this.emitHud(true);
    }
  }

  private updateAreas(): void {
    const index = this.level.areas.reduce((best, area, i) => (this.santa.x >= area.startX ? i : best), 0);
    if (index !== this.currentArea && index >= 0) {
      this.emitArea(index);
    }
  }

  private updateTips(): void {
    for (const [i, tip] of this.level.tips.entries()) {
      if (this.tipsShown.has(i)) continue;
      if (Math.abs(this.santa.x - tip.x) > 160) continue;
      this.tipsShown.add(i);
      const key = tip.key.startsWith('tip.') ? `tips.${tip.key.slice(4)}` : tip.key;
      this.toast(t(key));
      a11y.announce(t(key));
    }
  }

  private updateDelivery(): void {
    let near: House | null = null;
    for (const house of this.houses) {
      if (house.isNearChimney(this.santa.x, this.santa.y)) {
        near = house;
        break;
      }
    }
    let prompt: string | null = null;
    if (near) prompt = this.presentInventory > 0 ? t('game.deliver') : t('game.needPresent');
    if (prompt !== this.lastPrompt) {
      this.lastPrompt = prompt;
      this.events.emit('hud-prompt', prompt);
      this.events.emit('hud-near-house', Boolean(near));
    }
    if (near && this.inputSys.justPressed('gift')) this.deliverTo(near);
  }

  private deliverTo(house: House): void {
    if (house.delivered) return;
    if (this.presentInventory <= 0) {
      this.toast(t('game.needPresent'));
      audio.playSfx('error');
      return;
    }
    this.presentInventory -= 1;
    this.giftsDelivered += 1;
    this.santa.playThrow();
    this.santa.addSpirit(22);
    house.deliver();
    audio.playSfx('deliver');
    this.toast(t('game.delivered'));
    a11y.announce(t('game.delivered'));
    this.cameras.main.flash(160, 255, 220, 140);
    this.emitHud(true);
  }

  private updateGoals(): void {
    if (this.level.boss && !this.bossDefeated) return;
    const body = this.santa.body;
    const goal = this.level.goal;
    const rect = new Phaser.Geom.Rectangle(goal.x - 120, goal.y - 430, 240, 430);
    if (Phaser.Geom.Intersects.RectangleToRectangle(
      new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height),
      rect,
    )) {
      this.finishLevel();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Interaction helpers                                                 */
  /* ------------------------------------------------------------------ */

  private getSurface(): SurfaceInfo {
    const surface: SurfaceInfo = { ice: false, sticky: false, conveyor: null };
    const standing = this.findStandingPlatform();
    if (standing?.conveyor) surface.conveyor = standing.conveyor;
    for (const hazard of this.hazards) {
      const extra = hazard.surface?.(this.santa);
      if (!extra) continue;
      if (extra.sticky) surface.sticky = true;
      if (extra.ice) surface.ice = true;
    }
    return surface;
  }

  private findStandingPlatform(): PlatformDef | null {
    const body = this.santa.body;
    let best: PlatformDef | null = null;
    for (const { def } of this.platforms) {
      if (body.right < def.x + 2 || body.left > def.x + def.w - 2) continue;
      if (Math.abs(body.bottom - def.y) < 6 && (!best || def.y < best.y)) best = def;
    }
    if (best) return best;
    return null;
  }

  private findShadowGround(): number {
    const feet = this.santa.y;
    const left = this.santa.body.left;
    const right = this.santa.body.right;
    let best = this.level.groundY;
    for (const { def } of this.platforms) {
      if (right < def.x || left > def.x + def.w) continue;
      if (def.y >= feet - 4 && def.y < best) best = def.y;
    }
    for (const roof of this.houseRoofs) {
      if (right < roof.x - 150 || left > roof.x + 150) continue;
      if (roof.y >= feet - 4 && roof.y < best) best = roof.y;
    }
    for (const platform of this.movingPlatforms) {
      if (right < platform.x || left > platform.x + platform.def.w) continue;
      if (platform.y >= feet - 4 && platform.y < best) best = platform.y;
    }
    return best;
  }

  private isGroundAhead(x: number, y: number): boolean {
    for (const { def } of this.platforms) {
      if (x >= def.x && x <= def.x + def.w && Math.abs(def.y - y) < 42) return true;
    }
    for (const roof of this.houseRoofs) {
      if (Math.abs(x - roof.x) < 150 && Math.abs(roof.y - y) < 40) return true;
    }
    return false;
  }

  private onSantaLand(impact: number): void {
    if (impact > 500) {
      this.shake(80, 0.003);
      const dust = this.add.particles(this.santa.x, this.santa.y, 'props', { frame: 'particle-snow',
        speed: { min: 20, max: 90 },
        angle: { min: 190, max: 350 },
        lifespan: 380,
        scale: { start: 0.35, end: 0 },
        quantity: 6,
        emitting: false,
      }).setDepth(DEPTH.fx);
      dust.explode(6);
      this.time.delayedCall(500, () => dust.destroy());
    }
    audio.playSfx('land');
  }

  private onGroundPound(): void {
    this.shake(220, 0.01);
    audio.playSfx('stomp');
    const ring = this.add.image(this.santa.x, this.santa.y - 6, 'props', 'glow-soft')
      .setTint(0xfff2c9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.4, 0.14)
      .setDepth(DEPTH.fx);
    this.tweens.add({
      targets: ring,
      scaleX: 2.8,
      scaleY: 0.55,
      alpha: 0,
      duration: 420,
      onComplete: () => ring.destroy(),
    });
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (Math.abs(enemy.x - this.santa.x) < 230 && Math.abs(enemy.y - this.santa.y) < 100) {
        enemy.shockwave();
      }
    }
    if (this.level.boss && this.boss && this.boss.awake) {
      if (Math.abs(this.boss.x - this.santa.x) < 280) this.boss.hit();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Projectiles                                                         */
  /* ------------------------------------------------------------------ */

  private spawnProjectile(x: number, y: number, kind: 'coal' | 'spark', targetX: number, targetY: number): void {
    if (this.projectiles.length > 20) return;
    const frame = kind === 'coal' ? 'projectile-coal' : 'projectile-spark';
    const sprite = this.projectileGroup.create(x, y, 'enemies', frame) as Phaser.Physics.Arcade.Image;
    sprite.setScale(0.7).setDepth(DEPTH.enemy + 1);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(kind === 'coal');
    body.setCircle(11, 20, 20);
    const dx = targetX - x;
    const dy = targetY - y;
    if (kind === 'coal') {
      body.setVelocity(Math.sign(dx || 1) * 230, -260);
    } else {
      const angle = Math.atan2(dy, dx);
      body.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320);
    }
    this.projectiles.push({ sprite, life: 4 });
  }

  private updateProjectiles(dt: number): void {
    const santaBody = this.santa.body;
    const santaRect = new Phaser.Geom.Rectangle(santaBody.x, santaBody.y, santaBody.width, santaBody.height);
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const entry = this.projectiles[i];
      if (!entry.sprite.active) {
        this.projectiles.splice(i, 1);
        continue;
      }
      entry.life -= dt;
      const body = entry.sprite.body as Phaser.Physics.Arcade.Body;
      const rect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, santaRect)) {
        this.santa.hurt(entry.sprite.x);
        this.removeProjectile(entry.sprite);
        continue;
      }
      if (entry.life <= 0 || entry.sprite.y > this.level.groundY + 80 || entry.sprite.x < 0 || entry.sprite.x > this.level.width) {
        this.removeProjectile(entry.sprite);
      }
    }
  }

  private removeProjectile(sprite: Phaser.Physics.Arcade.Image): void {
    const index = this.projectiles.findIndex((p) => p.sprite === sprite);
    if (index >= 0) this.projectiles.splice(index, 1);
    sprite.destroy();
  }

  /* ------------------------------------------------------------------ */
  /* Death, completion, pause                                            */
  /* ------------------------------------------------------------------ */

  private handleDeath(): void {
    if (this.deadState) return;
    this.deadState = true;
    this.deaths += 1;
    this.shake(260, 0.01);
    this.toast(this.santa.y > this.level.height ? t('game.fell') : t('game.death'));
    a11y.announce(t('game.death'));
    this.time.delayedCall(1100, () => this.respawnSanta());
  }

  private respawnSanta(): void {
    if (this.ended) return;
    if (this.boss && !this.bossDefeated) {
      this.boss.deactivate();
      this.bossStarted = false;
      if (this.bossGateZone) (this.bossGateZone.body as Phaser.Physics.Arcade.StaticBody).enable = true;
      if (this.bossGateVisual) this.bossGateVisual.setAlpha(1);
      this.events.emit('hud-boss', { active: false, health: 0 });
      if (this.playMusicId) audio.playMusic(this.level.music);
    }
    this.santa.respawn(this.respawnPoint.x, this.respawnPoint.y);
    this.cameras.main.flash(350, 255, 255, 255);
    this.deadState = false;
    this.toast(t('game.respawn'));
    this.emitHud(true);
  }

  private finishLevel(): void {
    if (this.ended || this.finishing) return;
    this.finishing = true;
    this.ended = true;
    this.events.emit('hud-prompt', null);
    this.inputSys.reset();
    this.physics.pause();
    this.santa.playVictory();
    audio.stopMusic();
    audio.playSfx('victory');

    const giftsTotal = this.houses.filter((h) => h.hasChild).length;
    const stars = starsFor(this.giftsDelivered, giftsTotal, this.secretsFound, this.level.secrets.length);
    const time = Math.round(this.elapsed * 10) / 10;
    const score = computeScore({
      presentsCollected: this.presentsCollected,
      giftsDelivered: this.giftsDelivered,
      giftsTotal,
      secretsFound: this.secretsFound,
      enemiesStomped: this.enemiesStomped,
      time,
      timeLimit: this.level.timeLimit,
    });
    const result: LevelResult = {
      levelId: this.level.id,
      score,
      time,
      stars,
      presents: this.presentsCollected,
      giftsDelivered: this.giftsDelivered,
      giftsTotal,
      secretsFound: this.secretsFound,
      secretsTotal: this.level.secrets.length,
      deaths: this.deaths,
      damageTaken: this.damageTaken,
      enemiesStomped: this.enemiesStomped,
      presentsCollected: this.presentsCollected,
      underPar: time <= this.level.parTime,
      bossDefeated: this.bossDefeated,
    };
    const previousBest = save.profile.progress[this.level.id]?.bestScore ?? 0;
    const unlocked = save.recordResult(this.level, result);
    const newBest = score > previousBest;
    this.events.emit('hud', this.getHudState());
    a11y.announce(t('complete.title'));

    if (this.level.index === 4 && this.bossDefeated) {
      this.playSleighCinematic(result, unlocked, newBest);
    } else {
      this.time.delayedCall(1050, () => this.launchComplete(result, unlocked, newBest));
    }
  }

  private playSleighCinematic(result: LevelResult, unlocked: string[], newBest: boolean): void {
    this.santa.hide();
    const baseY = this.level.groundY - 280;
    const startX = -420;
    const container = this.add.container(startX, baseY).setDepth(DEPTH.fx);
    const sleigh = this.add.image(120, 0, 'enemies', 'sleigh').setScale(0.7);
    const santaSleigh = this.add.image(170, -62, 'santa', 'santa-sleigh').setScale(0.48);
    const deer1 = this.add.image(370, 10, 'enemies', 'reindeer-0').setScale(0.6);
    const deer2 = this.add.image(320, 26, 'enemies', 'reindeer-1').setScale(0.55);
    container.add([sleigh, santaSleigh, deer1, deer2]);
    const glow = this.add.particles(0, 0, 'props', { frame: 'particle-spark',
      x: { min: -160, max: 160 },
      y: { min: -60, max: 60 },
      speedY: { min: 10, max: 40 },
      speedX: { min: -30, max: -10 },
      lifespan: { min: 700, max: 1500 },
      scale: { start: 0.4, end: 0 },
      frequency: 90,
      tint: [0xffd166, 0xfff2c9],
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(DEPTH.fx + 1);
    glow.startFollow(sleigh);
    this.tweens.add({
      targets: container,
      x: this.level.width + 500,
      y: baseY - 320,
      duration: 5600,
      ease: 'Sine.easeInOut',
    });
    const title = this.add.text(this.scale.width / 2, this.scale.height * 0.22, t('game.victory'), titleStyle(54))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.fx + 2)
      .setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 800, ease: 'Quad.easeOut' });
    this.cameras.main.flash(400, 255, 244, 210);
    this.time.delayedCall(4600, () => {
      glow.destroy();
      this.launchComplete(result, unlocked, newBest);
    });
  }

  private launchComplete(result: LevelResult, unlocked: string[], newBest: boolean): void {
    if (!this.scene.isActive('Game')) return;
    this.scene.stop('UI');
    this.scene.launch('LevelComplete', { levelId: this.level.id, result, unlocked, newBest });
    this.scene.pause();
  }

  pauseGame(): void {
    if (this.ended || this.deadState) return;
    if (this.scene.isActive('Pause')) return;
    audio.pauseMusic();
    this.scene.launch('Pause', { levelId: this.level.id });
    this.scene.pause('UI');
    this.scene.pause();
    a11y.announce(t('pause.title'));
  }

  /* ------------------------------------------------------------------ */
  /* Effects, resize, cleanup                                            */
  /* ------------------------------------------------------------------ */

  private shake(duration: number, intensity: number): void {
    if (save.settings.reducedMotion) return;
    this.cameras.main.shake(duration, intensity);
  }

  private onResize(): void {
    const zoom = Phaser.Math.Clamp(
      Math.min(this.scale.width / 1280, this.scale.height / 720),
      0.7,
      1.15,
    );
    this.cameras.main.setZoom(zoom);
    this.cameras.main.setFollowOffset(
      (this.scale.width / 2) * (1 / zoom - 1),
      this.scale.height * (0.58 / zoom - 0.5),
    );
    this.cameras.main.setDeadzone(150, 110);
  }

  private cleanup = (): void => {
    this.scale.off('resize', this.onResize, this);
    save.off('settings', this.onSettings, this);
    this.events.off('enemy-shoot', this.onEnemyShoot, this);
    this.events.off('enemy-stomped', this.onEnemyStomped, this);
    this.events.off('boss-awake', this.onBossAwake, this);
    this.events.off('boss-throw', this.onBossThrow, this);
    this.events.off('boss-slam', this.onBossSlam, this);
    this.events.off('boss-health', this.onBossHealth, this);
    this.events.off('boss-defeated', this.onBossDefeated, this);
    this.events.off('spirit-activated', this.onSpiritActivated, this);
    this.events.off('spirit-ended', this.onSpiritEnded, this);
    this.events.off('santa-hurt', this.onSantaHurt, this);
    this.scene.stop('Backdrop');
    this.scene.stop('UI');
    a11y.clearMenu();
  }

  // Keep all state pieces referenced by helpers to avoid accidental dead code.
  get levelData(): LevelData { return this.level; }
  get townMeta() { return TOWN_META[this.town]; }
  get timeText(): string { return formatTime(this.elapsed); }
  get isFinished(): boolean { return this.finishing; }
}
