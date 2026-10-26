import Phaser from 'phaser';

export type Action = 'left' | 'right' | 'jump' | 'run' | 'down' | 'gift' | 'pause';

const ACTIONS: Action[] = ['left', 'right', 'jump', 'run', 'down', 'gift', 'pause'];

class VirtualControls {
  readonly down: Record<Action, boolean> = {
    left: false, right: false, jump: false, run: false, down: false, gift: false, pause: false,
  };
  private just: Action[] = [];

  press(action: Action): void {
    if (!this.down[action]) this.just.push(action);
    this.down[action] = true;
  }

  release(action: Action): void {
    this.down[action] = false;
  }

  releaseAll(): void {
    for (const action of ACTIONS) this.down[action] = false;
  }

  takeJust(): Action[] {
    const just = this.just;
    this.just = [];
    return just;
  }
}

export const virtualControls = new VirtualControls();

export class InputSystem {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private previousPad = new Set<string>();
  private just = new Set<Action>();
  private pad: Phaser.Input.Gamepad.Gamepad | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is unavailable');
    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.ESC,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ]);

    if (scene.input.gamepad) {
      this.pad = scene.input.gamepad.getPad(0) ?? null;
      scene.input.gamepad.on('connected', (pad: Phaser.Input.Gamepad.Gamepad) => { this.pad = pad; });
      scene.input.gamepad.on('disconnected', () => { this.pad = scene.input.gamepad?.getPad(0) ?? null; });
    }
  }

  update(): void {
    this.just.clear();
    const pressed: Action[] = [];
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keys.a)) pressed.push('left');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keys.d)) pressed.push('right');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.w) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) pressed.push('jump');
    if (Phaser.Input.Keyboard.JustDown(this.keys.shift)) pressed.push('run');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keys.s)) pressed.push('down');
    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) pressed.push('gift');
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc) || Phaser.Input.Keyboard.JustDown(this.keys.p)) pressed.push('pause');

    this.pollPad();
    for (const action of virtualControls.takeJust()) pressed.push(action);
    for (const action of pressed) this.just.add(action);
  }

  private pollPad(): void {
    if (this.pad && !this.pad.connected) {
      this.pad = this.scene.input.gamepad?.getPad(0) ?? null;
    }
    const pad = this.pad;
    if (!pad) return;
    const current = new Set<string>();
    const holds: Action[] = [];
    if (pad.left || pad.buttons[14]?.pressed) holds.push('left');
    if (pad.right || pad.buttons[15]?.pressed) holds.push('right');
    if (pad.down || pad.buttons[13]?.pressed) holds.push('down');
    if (pad.A || pad.buttons[0]?.pressed) holds.push('jump');
    if (pad.X || pad.buttons[2]?.pressed) holds.push('run');
    if (pad.Y || pad.buttons[3]?.pressed) holds.push('gift');
    if (pad.B || pad.buttons[1]?.pressed) holds.push('down');
    if (pad.buttons[9]?.pressed) holds.push('pause');
    if (pad.up || pad.buttons[12]?.pressed) holds.push('jump');
    for (const action of holds) {
      current.add(action);
      if (!this.previousPad.has(action)) this.just.add(action);
    }
    this.previousPad = current;
  }

  isDown(action: Action): boolean {
    if (virtualControls.down[action]) return true;
    if (this.pad) {
      if (action === 'left' && (this.pad.left || this.pad.buttons[14]?.pressed)) return true;
      if (action === 'right' && (this.pad.right || this.pad.buttons[15]?.pressed)) return true;
      if (action === 'down' && (this.pad.down || this.pad.buttons[13]?.pressed || this.pad.B)) return true;
      if (action === 'jump' && (this.pad.A || this.pad.up || this.pad.buttons[12]?.pressed)) return true;
      if (action === 'run' && (this.pad.X || this.pad.buttons[2]?.pressed)) return true;
      if (action === 'gift' && (this.pad.Y || this.pad.buttons[3]?.pressed)) return true;
    }
    switch (action) {
      case 'left': return this.cursors.left.isDown || this.keys.a.isDown;
      case 'right': return this.cursors.right.isDown || this.keys.d.isDown;
      case 'jump': return this.cursors.up.isDown || this.keys.w.isDown || this.cursors.space.isDown;
      case 'run': return this.keys.shift.isDown;
      case 'down': return this.cursors.down.isDown || this.keys.s.isDown;
      case 'gift': return this.keys.e.isDown;
      case 'pause': return this.keys.esc.isDown || this.keys.p.isDown;
      default: return false;
    }
  }

  justPressed(action: Action): boolean {
    return this.just.has(action);
  }

  reset(): void {
    this.just.clear();
    this.previousPad.clear();
    virtualControls.releaseAll();
  }
}
