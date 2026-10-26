export interface A11yAction {
  label: string;
  action: () => void;
}

/**
 * A visually hidden mirror of the active menu for keyboard and screen-reader
 * users. Canvas menus remain fully playable with the keyboard; this layer
 * provides labelled, focusable actions and live announcements.
 */
class AccessibilityLayer {
  private root: HTMLDivElement | null = null;
  private live: HTMLDivElement | null = null;
  private menu: HTMLDivElement | null = null;

  init(): void {
    if (this.root) return;
    const root = document.createElement('div');
    root.id = 'a11y-layer';
    root.setAttribute('aria-label', 'Game accessibility controls');
    root.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;';
    document.body.appendChild(root);

    const live = document.createElement('div');
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    live.id = 'a11y-live';
    root.appendChild(live);
    this.live = live;

    const menu = document.createElement('div');
    menu.setAttribute('role', 'navigation');
    menu.setAttribute('aria-label', 'Game menu');
    root.appendChild(menu);
    this.menu = menu;

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', "Santa's Christmas Journey game canvas. Use arrow keys or A and D to move, Space to jump, Shift to run, E to deliver gifts, Escape to pause.");
    }
    this.root = root;
  }

  setMenu(title: string, actions: A11yAction[]): void {
    this.init();
    if (!this.menu) return;
    this.menu.replaceChildren();
    const heading = document.createElement('h2');
    heading.textContent = title;
    this.menu.appendChild(heading);
    for (const entry of actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = entry.label;
      button.addEventListener('click', () => entry.action());
      this.menu.appendChild(button);
    }
  }

  clearMenu(): void {
    this.menu?.replaceChildren();
  }

  announce(text: string): void {
    this.init();
    if (!this.live) return;
    this.live.textContent = '';
    window.setTimeout(() => {
      if (this.live) this.live.textContent = text;
    }, 30);
  }

  setHelp(text: string): void {
    this.init();
    const canvas = document.querySelector('canvas');
    canvas?.setAttribute('aria-label', text);
  }
}

export const a11y = new AccessibilityLayer();
