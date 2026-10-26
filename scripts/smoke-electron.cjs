const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    show: true,
    backgroundColor: '#050b1c',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  window.setMenuBarVisibility(false);
  await window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  await wait(4500);
  for (let i = 0; i < 2; i++) {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' });
    await wait(80);
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Enter' });
    await wait(1100);
  }
  await wait(1800);
  const state = await window.webContents.executeJavaScript(`(() => {
    const game = window.__SCJ_GAME__;
    if (!game) return { ok: false, reason: 'game missing' };
    const scenes = game.scene.getScenes(true).map((scene) => scene.scene.key);
    const active = game.scene.getScene('Game');
    return {
      ok: true,
      scenes,
      level: active?.level?.id ?? null,
      santa: active?.santa ? { x: Math.round(active.santa.x), y: Math.round(active.santa.y) } : null,
      enemies: active?.enemies?.length ?? 0,
      presents: active?.presents?.length ?? 0,
      canvas: (() => { const c = document.querySelector('canvas'); return c ? { width: c.width, height: c.height } : null; })(),
    };
  })()`);
  const image = await window.webContents.capturePage();
  const output = path.join(os.tmpdir(), 'scj-electron-smoke.png');
  fs.writeFileSync(output, image.toPNG());
  console.log(JSON.stringify({ state, screenshot: output }));
  window.destroy();
  app.quit();
}

app.whenReady().then(run).catch((error) => {
  console.error(error);
  app.exit(1);
});
