import Phaser from 'phaser';
import { DEPTH, MAX_HEARTS, PHYSICS, SPIRIT_DURATION, SPIRIT_MAX } from '../config';
import type { InputSystem } from '../systems/InputSystem';

export interface SurfaceInfo {
  ice: boolean;
  sticky: boolean;
  conveyor: { dir: -1 | 1; speed: number } | null;
}

type HurtResult = 'immune' | 'hurt' | 'dead';

export class Santa extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  health = MAX_HEARTS;
  spirit = 0;
  spiritTimer = 0;
  facing = 1;
  dead = false;
  locked = 0;
  private visual: Phaser.GameObjects.Sprite;
  private shadow: Phaser.GameObjects.Image;
  private aura: Phaser.GameObjects.Image;
  private coyote = 0;
  private jumpBuffer = 0;
  private jumpHeld = false;
  private canDouble = true;
  private slideTimer = 0;
  private hurtTimer = 0;
  private stepTimer = 0;
  private pounded = false;
  private wasGrounded = true;
  private flickerTween: Phaser.Tweens.Tween | null = null;

  onJump?: () => void;
  onDoubleJump?: () => void;
  onLand?: (impact: number) => void;
  onPound?: () => void;
  onStep?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'pixel', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setVisible(false);
    this.setDepth(DEPTH.santa);
    this.body.setSize(48, 143);
    this.body.setOffset(-23.5, -142);
    this.body.setMaxVelocity(PHYSICS.runSpeed, PHYSICS.maxFall);
    this.body.setDragX(PHYSICS.drag);

    this.visual = scene.add.sprite(x, y, 'santa', 'santa-idle-0')
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(DEPTH.santa);
    this.visual.play('santa-idle');

    this.shadow = scene.add.image(x, y, 'props', 'glow-soft')
      .setTint(0x020812)
      .setAlpha(0.42)
      .setScale(0.62, 0.2)
      .setDepth(DEPTH.santaShadow);
    this.aura = scene.add.image(x, y - 70, 'props', 'glow-soft')
      .setTint(0xffd166)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
      .setScale(1.3)
      .setDepth(DEPTH.santa - 1);
  }

  get isSpirit(): boolean { return this.spiritTimer > 0; }
  get isInvulnerable(): boolean { return this.hurtTimer > 0 || this.spiritTimer > 0; }
  get isSliding(): boolean { return this.slideTimer > 0; }
  get grounded(): boolean { return this.body.blocked.down || this.body.touching.down; }

  addSpirit(amount: number): boolean {
    if (this.isSpirit) {
      this.spirit = Math.min(SPIRIT_MAX, this.spirit);
      return false;
    }
    const before = this.spirit;
    this.spirit = Phaser.Math.Clamp(this.spirit + amount, 0, SPIRIT_MAX);
    if (this.spirit >= SPIRIT_MAX && before < SPIRIT_MAX) {
      this.activateSpirit();
      return true;
    }
    return false;
  }

  activateSpirit(): void {
    this.spirit = SPIRIT_MAX;
    this.spiritTimer = SPIRIT_DURATION;
    this.canDouble = true;
    this.scene.tweens.add({
      targets: this.visual,
      scaleX: 0.56,
      scaleY: 0.56,
      duration: 180,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
    this.scene.events.emit('spirit-activated');
  }

  private resetBodySize(): void {
    this.body.setSize(48, 143);
    this.body.setOffset(-23.5, -142);
  }

  private startSlide(): void {
    this.slideTimer = PHYSICS.slideMs / 1000;
    this.body.setSize(60, 75);
    this.body.setOffset(-29.5, -74);
    this.visual.setFrame('santa-slide');
    this.scene.events.emit('santa-slide');
  }

  private endSlide(): void {
    this.slideTimer = 0;
    this.resetBodySize();
  }

  override update(dt: number, input: InputSystem, surface: SurfaceInfo, shadowGround: number): void {
    const body = this.body;
    if (this.locked > 0) this.locked = Math.max(0, this.locked - dt);
    if (this.slideTimer > 0) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.endSlide();
    }
    if (this.spiritTimer > 0) {
      this.spiritTimer = Math.max(0, this.spiritTimer - dt);
      if (this.spiritTimer === 0) {
        this.spirit = 0;
        this.scene.events.emit('spirit-ended');
      }
    }
    if (this.hurtTimer > 0) this.hurtTimer = Math.max(0, this.hurtTimer - dt);

    const grounded = this.grounded;
    if (grounded) {
      this.coyote = PHYSICS.coyoteMs / 1000;
      this.canDouble = true;
      if (!this.wasGrounded && this.pounded) {
        this.pounded = false;
        this.onPound?.();
      }
    } else {
      this.coyote = Math.max(0, this.coyote - dt);
    }

    if (!this.wasGrounded && grounded && this.body.velocity.y > 120) {
      this.onLand?.(this.body.velocity.y);
    }
    this.wasGrounded = grounded;

    if (this.dead) {
      this.syncVisual(shadowGround, dt);
      return;
    }

    const locked = this.locked > 0;
    const left = !locked && input.isDown('left');
    const right = !locked && input.isDown('right');
    const run = !locked && input.isDown('run');
    const sliding = this.slideTimer > 0;

    if (!locked && input.justPressed('jump')) {
      this.jumpBuffer = PHYSICS.jumpBufferMs / 1000;
    } else {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    }

    if (!locked && input.justPressed('down')) {
      if (grounded && Math.abs(body.velocity.x) > 90 && !sliding) {
        this.startSlide();
      } else if (!grounded && !this.pounded) {
        this.pounded = true;
        this.body.setVelocityY(PHYSICS.poundSpeed);
        this.visual.setFrame('santa-fall');
        this.scene.events.emit('santa-pound');
      }
    }

    if (this.jumpBuffer > 0) {
      if (grounded || this.coyote > 0) {
        this.jumpBuffer = 0;
        this.coyote = 0;
        body.setVelocityY(-PHYSICS.jump);
        this.canDouble = true;
        this.visual.setScale(0.5 * 0.94, 0.5 * 1.06);
        this.scene.tweens.add({ targets: this.visual, scaleX: 0.5, scaleY: 0.5, duration: 180, ease: 'Quad.easeOut' });
        this.onJump?.();
      } else if (this.isSpirit && this.canDouble) {
        this.jumpBuffer = 0;
        this.canDouble = false;
        body.setVelocityY(-PHYSICS.doubleJump);
        this.visual.setFrame('santa-jump');
        this.onDoubleJump?.();
      }
    }

    const jumpDown = input.isDown('jump');
    if (this.jumpHeld && !jumpDown && body.velocity.y < -320) {
      body.setVelocityY(-320);
    }
    this.jumpHeld = jumpDown;

    let maxSpeed: number = run ? PHYSICS.runSpeed : PHYSICS.walkSpeed;
    if (surface.sticky) maxSpeed *= 0.55;
    if (this.isSpirit) maxSpeed *= 1.22;
    if (sliding) maxSpeed = PHYSICS.slideSpeed;
    body.setMaxVelocity(maxSpeed, PHYSICS.maxFall);

    const accel = grounded
      ? (surface.ice ? PHYSICS.iceAccel : PHYSICS.accel)
      : (surface.ice ? PHYSICS.iceAccel * 0.6 : PHYSICS.airAccel);

    if ((left || right) && !sliding) {
      const dir = left ? -1 : 1;
      this.facing = dir;
      body.setAccelerationX(dir * accel);
      body.setDragX(0);
    } else if (sliding) {
      body.setAccelerationX(Math.sign(body.velocity.x) * 160);
      body.setDragX(0);
    } else {
      body.setAccelerationX(0);
      const drag = grounded ? (surface.ice ? PHYSICS.iceDrag : PHYSICS.drag) : PHYSICS.airDrag;
      body.setDragX(drag);
    }

    if (grounded && surface.conveyor && !sliding) {
      this.x += surface.conveyor.dir * surface.conveyor.speed * dt;
    }

    if (this.isSpirit) {
      this.shadow.setTint(0x8a6a20);
    } else {
      this.shadow.setTint(0x020812);
    }

    this.stepTimer -= dt;
    if (grounded && !sliding && Math.abs(body.velocity.x) > 40 && this.stepTimer <= 0) {
      this.stepTimer = surface.ice ? 0.42 : 0.3;
      this.onStep?.();
    }

    this.syncVisual(shadowGround, dt);
    this.updateAnimation(grounded, sliding);
  }

  private updateAnimation(grounded: boolean, sliding: boolean): void {
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    let key = 'santa-idle';
    if (this.dead) {
      key = 'santa-hurt';
    } else if (this.locked > 0.12) {
      key = 'santa-throw';
    } else if (sliding) {
      key = 'santa-slide';
    } else if (!grounded) {
      key = vy < -30 ? 'santa-jump' : 'santa-fall';
    } else if (Math.abs(vx) > 315) {
      key = 'santa-run';
    } else if (Math.abs(vx) > 30) {
      key = 'santa-walk';
    }
    this.visual.setFlipX(this.facing < 0);
    if (this.visual.anims.currentAnim?.key !== key) {
      this.visual.play(key, true);
    }
    if (key === 'santa-walk' || key === 'santa-run') {
      this.visual.anims.timeScale = Phaser.Math.Clamp(Math.abs(vx) / 280, 0.65, 1.35);
    } else {
      this.visual.anims.timeScale = 1;
    }
  }

  private syncVisual(shadowGround: number, dt: number): void {
    this.visual.setPosition(this.x, this.y);
    const flip = this.facing < 0;
    this.visual.setFlipX(flip);
    this.shadow.setPosition(this.x, shadowGround + 2);
    const dist = Math.max(0, shadowGround - this.y);
    const thin = Phaser.Math.Clamp(1 - dist / 420, 0.35, 1);
    this.shadow.setAlpha(0.4 * thin);
    this.shadow.setScale(0.62 * thin, 0.2 * thin);
    if (this.isSpirit) {
      const pulse = 0.8 + Math.sin(this.scene.time.now / 180) * 0.18;
      this.aura.setVisible(true);
      this.aura.setPosition(this.x, this.y - 72);
      this.aura.setAlpha(0.38 * pulse);
      this.aura.setScale(1.5 * pulse, 1.5 * pulse);
    } else {
      this.aura.setVisible(false);
    }
    if (this.hurtTimer > 0 && !this.dead) {
      this.visual.setAlpha(Math.sin(this.scene.time.now / 45) > 0 ? 1 : 0.35);
    } else {
      this.visual.setAlpha(1);
    }
    void dt;
  }

  lockFor(seconds: number): void {
    this.locked = seconds;
  }

  playThrow(): void {
    this.lockFor(0.62);
    this.visual.play('santa-throw', true);
    this.scene.time.delayedCall(620, () => {
      if (!this.dead) this.visual.play('santa-idle', true);
    });
  }

  hide(): void {
    this.visual.setVisible(false);
    this.shadow.setVisible(false);
    this.aura.setVisible(false);
  }

  playVictory(): void {
    this.lockFor(999);
    this.body.setVelocity(0, 0);
    this.visual.play('santa-victory', true);
  }

  hurt(fromX: number): HurtResult {
    if (this.dead) return 'dead';
    if (this.isInvulnerable) return 'immune';
    this.health = Math.max(0, this.health - 1);
    this.hurtTimer = 1.5;
    this.scene.events.emit('hearts-changed', this.health);
    this.scene.cameras.main.shake(140, 0.006);
    if (this.health <= 0) {
      this.dead = true;
      this.lockFor(999);
      this.body.setVelocity(0, 0);
      this.visual.setFrame('santa-hurt');
      return 'dead';
    }
    this.body.setVelocity(fromX < this.x ? 260 : -260, -430);
    this.scene.events.emit('santa-hurt');
    return 'hurt';
  }

  addHealth(): void {
    this.health = Math.min(MAX_HEARTS, this.health + 1);
    this.scene.events.emit('hearts-changed', this.health);
  }

  respawn(x: number, y: number): void {
    this.dead = false;
    this.health = MAX_HEARTS;
    this.spirit = 0;
    this.spiritTimer = 0;
    this.hurtTimer = 2;
    this.locked = 0;
    this.pounded = false;
    this.canDouble = true;
    this.endSlide();
    this.body.reset(x, y);
    this.body.setVelocity(0, 0);
    this.visual.setAlpha(1);
    this.visual.play('santa-idle', true);
    this.scene.events.emit('hearts-changed', this.health);
  }

  setDeadFromFall(): void {
    this.dead = true;
    this.lockFor(999);
    this.body.setVelocity(0, 0);
    this.visual.setFrame('santa-hurt');
  }

  override destroy(fromScene?: boolean): void {
    this.visual.destroy();
    this.shadow.destroy();
    this.aura.destroy();
    this.flickerTween?.stop();
    super.destroy(fromScene);
  }
}
