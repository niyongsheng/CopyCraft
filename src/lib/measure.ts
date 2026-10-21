let ctx: CanvasRenderingContext2D | null | undefined;

function context(): CanvasRenderingContext2D | null {
  if (ctx === undefined) {
    ctx = document.createElement('canvas').getContext('2d');
  }
  return ctx;
}

export function measureText(text: string, fontCss: string): number {
  const c = context();
  if (!c) return text.length * 12;
  c.font = fontCss;
  return c.measureText(text).width;
}
