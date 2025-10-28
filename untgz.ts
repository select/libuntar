import { getEntries } from './libuntar';

export { getEntries, untar } from './libuntar';

export async function untgz(blob: Blob) {
	const tar = await new Response(
		blob.stream().pipeThrough(new DecompressionStream('gzip')),
	).arrayBuffer();
	return {
		arrayBuffer: tar,
		entries: getEntries(tar).filter(
			// Filter out garbage files from MacOS
			({ name }) => !(name.includes('._') || name.includes('PaxHeader')),
		),
	};
}
