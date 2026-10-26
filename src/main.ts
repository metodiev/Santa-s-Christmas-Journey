import Phaser from 'phaser';
import './styles.css';
import { PHYSICS } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { SplashScene } from './scenes/SplashScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { SettingsScene } from './scenes/SettingsScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { CreditsScene } from './scenes/CreditsScene';
import { ProfileScene } from './scenes/ProfileScene';
import { BackdropScene } from './scenes/BackdropScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { PauseScene } from './scenes/PauseScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#050b1c',
  banner: false,
  disableContextMenu: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.gravity },
      debug: false,
    },
  },
  render: {
    antialias: true,
    roundPixels: false,
    powerPreference: 'high-performance',
    transparent: false,
  },
  input: {
    gamepad: true,
    activePointers: 4,
    touch: { capture: true },
  },
  dom: { createContainer: true },
  fps: { target: 60, forceSetTimeOut: false },
  scene: [
    BootScene,
    PreloadScene,
    SplashScene,
    MainMenuScene,
    LevelSelectScene,
    SettingsScene,
    AchievementsScene,
    CreditsScene,
    ProfileScene,
    BackdropScene,
    GameScene,
    UIScene,
    PauseScene,
    LevelCompleteScene,
  ],
};

const game = new Phaser.Game(config);
(window as unknown as { __SCJ_GAME__: Phaser.Game }).__SCJ_GAME__ = game;
game.events.once(Phaser.Core.Events.READY, () => {
  document.body.classList.add('game-ready');
});

window.addEventListener('error', (event) => {
  console.error('[Santa\'s Christmas Journey]', event.error ?? event.message);
});

if ('serviceWorker' in navigator && import.meta.env.PROD && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline support is optional; the game still runs online.
    });
  });
}
