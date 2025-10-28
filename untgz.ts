import { tarGetEntries } from './libuntar.js';

export async function untgz(blob: Blob) {
	const tar = await new Response(
		blob.stream().pipeThrough(new DecompressionStream('gzip')),
	).arrayBuffer();
	return {
		arrayBuffer: tar,
		nodes: tarGetEntries(tar).filter(
			// Filter out garbage files from MacOS
			({ name }) => !(name.includes('._') || name.includes('PaxHeader')),
		),
	};
}
