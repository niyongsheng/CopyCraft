/** True when the renderer runs inside the Electron shell. */
export function isDesktop(): boolean {
  return Boolean(window.desktop?.isElectron);
}
