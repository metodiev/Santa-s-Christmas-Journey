import Phaser from 'phaser';
import { DEPTH, TOWN_META } from '../config';
import type { TownId } from '../types';
import { save } from './SaveSystem';

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ensureSkyTexture(scene: Phaser.Scene, town: TownId): string {
  const key = `sky-${town}`;
  if (scene.textures.exists(key)) return key;
  const width = 1024;
  const height = 1024;
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) return key;
  const ctx = texture.getContext();
  const meta = TOWN_META[town];
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, meta.sky[0]);
  gradient.addColorStop(0.55, meta.sky[1]);
  gradient.addColorStop(1, meta.sky[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const rand = seeded(11 + town.length * 37);
  const starColor = town === 'ginger' ? '#ffe9d6' : '#eaf8ff';
  for (let i = 0; i < 190; i++) {
    const x = rand() * width;
    const y = rand() * height * 0.72;
    const r = 0.5 + rand() * 1.8;
    const alpha = 0.2 + rand() * 0.65;
    ctx.fillStyle = starColor;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (r > 1.5) {
      ctx.strokeStyle = starColor;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  if (town === 'forest' || town === 'summit') {
    const auroraColors = town === 'summit' ? ['#64f0b0', '#a97bff'] : ['#6fffe0', '#79b8ff'];
    ctx.globalCompositeOperation = 'lighter';
    for (let ribbon = 0; ribbon < 3; ribbon++) {
      const baseY = 150 + ribbon * 80;
      const grad = ctx.createLinearGradient(0, baseY - 120, width, baseY + 130);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.35, `${auroraColors[ribbon % 2]}33`);
      grad.addColorStop(0.6, `${auroraColors[(ribbon + 1) % 2]}44`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 42 + ribbon * 18;
      ctx.filter = 'blur(24px)';
      ctx.beginPath();
      for (let x = 0; x <= width; x += 32) {
        const y = baseY + Math.sin((x / width) * Math.PI * 3 + ribbon) * 68 + Math.sin((x / width) * Math.PI * 7) * 24;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
  }

  const moonX = width * 0.78;
  const moonY = height * 0.17;
  const moonRadius = town === 'forest' ? 46 : town === 'summit' ? 54 : 38;
  const glow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.3, moonX, moonY, moonRadius * 4.2);
  glow.addColorStop(0, 'rgba(255,246,214,0.5)');
  glow.addColorStop(0.4, 'rgba(255,240,190,0.14)');
  glow.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(moonX - moonRadius * 5, moonY - moonRadius * 5, moonRadius * 10, moonRadius * 10);
  ctx.fillStyle = town === 'ginger' ? '#ffe4bd' : '#fff2c9';
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(190,170,130,0.25)';
  ctx.beginPath();
  ctx.arc(moonX - moonRadius * 0.3, moonY - moonRadius * 0.2, moonRadius * 0.28, 0, Math.PI * 2);
  ctx.arc(moonX + moonRadius * 0.35, moonY + moonRadius * 0.25, moonRadius * 0.18, 0, Math.PI * 2);
  ctx.fill();

  if (town === 'factory') {
    ctx.fillStyle = 'rgba(255,180,80,0.05)';
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
  }

  texture.refresh();
  return key;
}

export function addSnowfall(
  scene: Phaser.Scene,
  depth: number = DEPTH.snow,
  overrides: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {},
): Phaser.GameObjects.Particles.ParticleEmitter {
  const width = scene.scale.width;
  const reduced = save.settings.reducedMotion;
  const emitter = scene.add.particles(0, 0, 'props', { frame: 'particle-snow',
    x: { min: -80, max: width + 80 },
    y: -30,
    lifespan: { min: 6000, max: 13000 },
    speedY: { min: reduced ? 10 : 18, max: reduced ? 26 : 62 },
    speedX: { min: reduced ? -4 : -22, max: reduced ? 4 : 26 },
    scale: { start: 0.42, end: 0.14 },
    alpha: { start: reduced ? 0.55 : 0.85, end: 0.3 },
    rotate: { min: 0, max: reduced ? 0 : 360 },
    frequency: reduced ? 260 : 90,
    quantity: 1,
    blendMode: Phaser.BlendModes.NORMAL,
    ...overrides,
  });
  emitter.setScrollFactor(0).setDepth(depth);
  emitter.setName('snowfall');
  return emitter;
}


export function ensureVignetteTexture(scene: Phaser.Scene): string {
  const key = 'vignette-texture';
  if (scene.textures.exists(key)) return key;
  const size = 512;
  const texture = scene.textures.createCanvas(key, size, size);
  if (!texture) return key;
  const ctx = texture.getContext();
  const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.25, size / 2, size / 2, size * 0.72);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.65, 'rgba(2,6,14,0.16)');
  gradient.addColorStop(1, 'rgba(2,6,14,0.68)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  texture.refresh();
  return key;
}

export function addVignette(scene: Phaser.Scene, depth: number = DEPTH.vignette): Phaser.GameObjects.Image {
  const key = ensureVignetteTexture(scene);
  return scene.add.image(0, 0, key)
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(depth)
    .setDisplaySize(scene.scale.width, scene.scale.height)
    .setAlpha(0.7);
}

export function ensureGrainTexture(scene: Phaser.Scene): string {
  const key = 'grain-texture';
  if (scene.textures.exists(key)) return key;
  const size = 128;
  const texture = scene.textures.createCanvas(key, size, size);
  if (!texture) return key;
  const ctx = texture.getContext();
  const image = ctx.createImageData(size, size);
  const rand = seeded(99);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 26;
  }
  ctx.putImageData(image, 0, 0);
  texture.refresh();
  return key;
}

export function addFilmGrain(scene: Phaser.Scene): Phaser.GameObjects.TileSprite {
  const key = ensureGrainTexture(scene);
  return scene.add.tileSprite(0, 0, scene.scale.width, scene.scale.height, key)
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(DEPTH.grain)
    .setAlpha(0.16)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setName('film-grain');
}

export function fitCover(image: Phaser.GameObjects.Image, width: number, height: number): void {
  const scale = Math.max(width / image.width, height / image.height);
  image.setScale(scale).setPosition(width / 2, height / 2);
}

export function textStyle(
  size: number,
  color = '#f6e7c8',
  family: string = 'Inter, Trebuchet MS, system-ui, sans-serif',
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: family,
    fontSize: `${size}px`,
    color,
    align: 'center',
    stroke: '#07111f',
    strokeThickness: Math.max(2, Math.round(size / 12)),
    shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
  };
}

export function titleStyle(size: number): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: `${size}px`,
    color: '#ffe9b0',
    align: 'center',
    stroke: '#2a1606',
    strokeThickness: Math.max(2, Math.round(size / 14)),
    shadow: { offsetX: 0, offsetY: 3, color: '#000000', blur: 8, fill: true },
  };
}

export function snowTextureKey(): { texture: string; frame: string } {
  return { texture: 'props', frame: 'particle-snow' };
}
