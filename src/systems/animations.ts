import Phaser from 'phaser';
import { createEnemyAnimations } from '../entities/Enemy';

function frames(scene: Phaser.Scene, prefix: string, start: number, end: number): Phaser.Types.Animations.AnimationFrame[] {
  return scene.anims.generateFrameNames('santa', { prefix, start, end });
}

export function createSantaAnimations(scene: Phaser.Scene): void {
  const add = (key: string, prefix: string, start: number, end: number, frameRate: number, repeat = -1, yoyo = false) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({ key, frames: frames(scene, prefix, start, end), frameRate, repeat, yoyo });
  };
  add('santa-idle', 'santa-idle-', 0, 3, 6, -1, true);
  add('santa-walk', 'santa-walk-', 0, 7, 14);
  add('santa-run', 'santa-run-', 0, 7, 20);
  const single = (key: string, frame: string) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({ key, frames: [{ key: 'santa', frame }], frameRate: 1, repeat: 0 });
  };
  single('santa-jump', 'santa-jump');
  single('santa-fall', 'santa-fall');
  single('santa-slide', 'santa-slide');
  single('santa-hurt', 'santa-hurt');
  single('santa-victory', 'santa-victory');
  single('santa-sleigh', 'santa-sleigh');
  add('santa-throw', 'santa-throw-', 0, 2, 12, 0);
  createEnemyAnimations(scene);
}
