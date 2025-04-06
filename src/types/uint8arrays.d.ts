/**
 * Type declarations for uint8arrays package
 * This helps resolve TypeScript module resolution issues in the production build
 */

declare module 'uint8arrays' {
  export function fromString(str: string, encoding?: string): Uint8Array;
  export function toString(array: Uint8Array, encoding?: string): string;
  export function concat(arrays: Array<Uint8Array>): Uint8Array;
  export function equals(a: Uint8Array, b: Uint8Array): boolean;
  export function compare(a: Uint8Array, b: Uint8Array): number;
}

declare module 'uint8arrays/from-string' {
  export function fromString(str: string, encoding?: string): Uint8Array;
}

declare module 'uint8arrays/to-string' {
  export function toString(array: Uint8Array, encoding?: string): string;
}

declare module 'uint8arrays/concat' {
  export function concat(arrays: Array<Uint8Array>): Uint8Array;
}

declare module 'uint8arrays/equals' {
  export function equals(a: Uint8Array, b: Uint8Array): boolean;
}

declare module 'uint8arrays/compare' {
  export function compare(a: Uint8Array, b: Uint8Array): number;
}
