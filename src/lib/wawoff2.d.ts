declare module 'wawoff2' {
	/** Decompress a woff2-encoded font to raw TTF/OTF bytes. */
	export function decompress(input: Uint8Array): Promise<Uint8Array>;
	export function compress(input: Uint8Array): Promise<Uint8Array>;
	const _default: { decompress: typeof decompress; compress: typeof compress };
	export default _default;
}
