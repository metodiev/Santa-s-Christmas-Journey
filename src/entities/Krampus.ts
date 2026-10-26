import Phaser from 'phaser';
import { DEPTH } from '../config';

type BossState = 'sleep' | 'intro' | 'idle' | 'jump' | 'throw' | 'charge' | 'stagger' | 'dead';

export class Krampus extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  health = 3;
  awake = false;
  private bossState: BossState = 'sleep';
  private actionTimer = 1.5;
  private stateTimer = 0;
  private invuln = 0;
  private face = 1;
  private homeX: number;
  private homeY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemies', 'krampus-0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.homeX = x;
    this.homeY = y;
    this.setOrigin(0.5, 1);
    this.setScale(0.62);
    this.setDepth(DEPTH.boss);
    this.body.setSize(190, 260);
    this.body.setOffset((384 - 190) / 2, 384 - 260);
    this.body.setMaxVelocity(420, 1700);
    this.play('krampus-idle');
    this.setVisible(false);
    this.body.enable = false;
    this.setActive(false);
  }

  awaken(): void {
    if (this.awake) return;
    this.awake = true;
    this.health = 3;
    this.bossState = 'intro';
    this.stateTimer = 1.2;
    this.invuln = 0;
    this.setPosition(this.homeX, this.homeY);
    this.setVisible(true);
    this.setActive(true);
    this.body.enable = true;
    this.body.setAllowGravity(true);
    this.setAlpha(1);
    this.clearTint();
    this.play('krampus-idle', true);
    this.scene.cameras.main.shake(320, 0.012);
    this.scene.events.emit('boss-awake');
    this.scene.time.delayedCall(900, () => {
      if (this.awake && this.bossState === 'intro') {
        this.bossState = 'idle';
        this.actionTimer = 1.1;
      }
    });
  }

  deactivate(): void {
    this.awake = false;
    this.bossState = 'sleep';
    this.health = 3;
    this.invuln = 0;
    this.body.enable = false;
    this.setVisible(false);
    this.setActive(false);
    this.setVelocity(0, 0);
    this.setPosition(this.homeX, this.homeY);
  }

  updateBoss(dt: number, santa: Phaser.Physics.Arcade.Sprite): void {
    if (!this.awake || this.bossState === 'dead') return;
    const grounded = this.body.blocked.down;
    if (this.invuln > 0) {
      this.invuln = Math.max(0, this.invuln - dt);
      this.setAlpha(Math.sin(this.scene.time.now / 45) > 0 ? 1 : 0.55);
      if (this.invuln === 0) this.setAlpha(1);
    }
    this.face = santa.x >= this.x ? 1 : -1;
    this.setFlipX(this.face < 0);

    if (this.bossState === 'stagger') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.bossState = 'idle';
        this.actionTimer = 0.8;
      }
      return;
    }
    if (this.bossState === 'intro') {
      this.setVelocityX(0);
      return;
    }
    if (this.bossState === 'jump') {
      if (grounded && this.stateTimer <= 0) {
        this.bossState = 'idle';
        this.actionTimer = 0.9;
        this.scene.cameras.main.shake(220, 0.008);
        this.scene.events.emit('boss-slam', this.x, this.y);
      }
      this.stateTimer -= dt;
      return;
    }
    if (this.bossState === 'charge') {
      this.stateTimer -= dt;
      this.setVelocityX(this.face * 190);
      if (grounded) this.scene.events.emit('boss-stomp-step', this.x);
      if (this.stateTimer <= 0) {
        this.bossState = 'idle';
        this.actionTimer = 1.2;
        this.setVelocityX(0);
      }
      return;
    }
    if (this.bossState === 'throw') {
      this.setVelocityX(0);
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.bossState = 'idle';
        this.actionTimer = 1;
      }
      return;
    }

    this.setVelocityX(0);
    this.actionTimer -= dt;
    if (this.actionTimer > 0) return;
    const dx = santa.x - this.x;
    const distance = Math.abs(dx);
    const roll = Math.random();
    if (distance > 230 && roll < 0.52) {
      this.bossState = 'jump';
      this.stateTimer = 0.35;
      this.body.setVelocity(this.face * Math.min(310, 160 + distance * 0.25), -940);
    } else if (distance > 120 && roll < 0.9) {
      this.bossState = 'throw';
      this.stateTimer = 0.72;
      this.scene.events.emit('boss-telegraph', this.x, this.y - 170, this.face);
      this.scene.time.delayedCall(380, () => {
        if (this.awake && this.bossState !== 'dead') {
          this.scene.events.emit('boss-throw', this.x, this.y - 170, this.face);
        }
      });
    } else {
      this.bossState = 'charge';
      this.stateTimer = 1.1;
    }
  }

  hit(): boolean {
    if (!this.awake || this.bossState === 'dead' || this.invuln > 0) return false;
    this.health -= 1;
    this.invuln = 1.25;
    this.scene.events.emit('boss-health', this.health);
    this.scene.cameras.main.shake(260, 0.01);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(110, () => {
      if (this.awake && this.bossState !== 'dead') this.clearTint();
    });
    this.scene.tweens.add({ targets: this, scaleX: 0.55, scaleY: 0.7, duration: 120, yoyo: true });
    if (this.health <= 0) {
      this.defeat();
      return true;
    }
    this.bossState = 'stagger';
    this.stateTimer = 0.7;
    this.scene.events.emit('boss-hit');
    this.scene.events.emit('boss-throw', this.x, this.y - 150, this.face);
    return false;
  }

  private defeat(): void {
    this.bossState = 'dead';
    this.body.enable = false;
    this.setVelocity(0, 0);
    this.scene.events.emit('boss-defeated');
    this.scene.cameras.main.shake(600, 0.016);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      angle: 12,
      scaleY: 0.2,
      duration: 1100,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.awake = false;
        this.setVisible(false);
      },
    });
  }

  get isDefeated(): boolean { return this.bossState === 'dead'; }
  get isActive(): boolean { return this.awake; }
}
