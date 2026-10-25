/**
 * Feature : TomLoad type definitions
 * Version : 0.1.0
 * Author  : Tomdesign (Johnny Bui) — https://tomdesign.vn
 * Purpose : Editor hints and type checking for TypeScript / JS users.
 */

/** Glyph voice used while content scrambles and decodes. */
export interface Preset {
  /** Density ramp, light → dense. First character should be a space. */
  ramp: string;
  /** Glyphs used while a character scrambles. */
  glyphs: string;
  /** Glyph cell height (px) for images and canvases. */
  cell: number;
  /** Milliseconds between glyph changes. */
  tick: number;
  /** Per-character scramble duration range [min, max] in ms. */
  char: [number, number];
  /** Paint scramble glyphs in the accent color (`--tl-accent`). */
  accent: boolean;
}

export type PresetName = 'ink' | 'dither' | 'spark' | 'binary';
export type Origin = 'top' | 'center' | 'pointer' | { x: number; y: number };

/** A mascot draws one frame into a w×h box. `t` is elapsed seconds. Any colors. */
export type Mascot = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

export interface GlyphOptions {
  /** Default `'ink'`. */
  preset?: PresetName | Preset;
  /** Wave speed multiplier. Default `1` (≈ 1.1 px/ms). */
  speed?: number;
  /** Where the wave starts. Default `'top'`. Object form is viewport px. */
  origin?: Origin;
  /** Scramble glyph color. Defaults to `--tl-accent`, then the text color. */
  accent?: string | null;
  /** Elements decoded through the glyph grid. Default `img, canvas, video, [data-tl="media"]`. */
  media?: string;
  /** Elements that fade in on the wave. Default `button, svg, [data-tl="fade"]`. */
  fades?: string;
  /** Monospace font stack for glyphs. */
  font?: string;
}

export interface RunOptions {
  origin?: Origin;
  speed?: number;
}

export interface HideOptions extends RunOptions {
  /** Hide immediately, no animation. */
  instant?: boolean;
}

export interface LoadingOptions {
  /** Draw a mascot instead of the content-shaped glyph field. */
  mascot?: Mascot;
  /** Mascot box size in px. Default `132` (capped at 70% of the element). */
  size?: number;
  /** Glyph cell height for the mascot grid. */
  cell?: number;
  /** Vertical nudge of the mascot in px. */
  offsetY?: number;
}

export interface GlyphController {
  /** Decode content in. Resolves when everything has landed. */
  reveal(options?: RunOptions): Promise<void>;
  /** Scramble content out (or hide instantly). Stays hidden until `reveal()`. */
  hide(options?: HideOptions): Promise<void>;
  /** Show (or stop) the loading state. Sets `aria-busy` on the element. */
  loading(on: boolean, options?: LoadingOptions): void;
  /** Merge new options, e.g. `{ preset: 'spark' }`. */
  update(options: GlyphOptions): void;
  /** Stop everything and restore the element. */
  destroy(): void;
  readonly state: 'shown' | 'hidden' | 'revealing' | 'hiding';
}

export type SkeletonVariant = 'dots' | 'blocks' | 'binary' | 'braille' | 'plus';

export interface SkeletonSpec {
  /** Text lines. Default `3`. */
  lines?: number;
  /** Glyph style, or a custom character set. Default `'dots'`. */
  variant?: SkeletonVariant | (string & {});
  /** CSS widths per line, cycled. */
  widths?: string[];
  /** Render a block (image / avatar) of this many rows instead of lines. */
  rows?: number;
  /** Same seed → same markup (SSR-safe). Default `1`. */
  seed?: number;
  /** Glyphs per row. Default `64`. */
  chars?: number;
}

export declare function glyph(element: HTMLElement, options?: GlyphOptions): GlyphController;
export { glyph as tomload };
export declare function skeleton(spec?: SkeletonSpec): string;
export declare const PRESETS: Record<PresetName, Preset>;
export declare const SKELETONS: Record<SkeletonVariant, string>;
export declare const mascots: {
  phin: Mascot; hat: Mascot; lantern: Mascot;
  snowman: Mascot; tree: Mascot; gift: Mascot;
};
