/** 珠心算算盘（一档一上珠四珠）的几何常量，供生成模型和 SVG 共用。 */
export const ABACUS = {
  pad: 8,
  rodGap: 34,
  beadWidth: 22,
  beadHeight: 12,
  slot: 15,
  upperDeck: 38,
  lowerDeck: 81,
} as const;

export function abacusViewBox(rods: number): { width: number; height: number } {
  return {
    width: ABACUS.pad * 2 + rods * ABACUS.rodGap,
    height:
      ABACUS.pad * 2 + ABACUS.upperDeck + 6 + ABACUS.lowerDeck,
  };
}
