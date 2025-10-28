export interface TarEntry {
	name: string;
	size: number;
	is_file: boolean;
	offset: number;
}

export function tarGetEntries(arrayBuffer: ArrayBuffer): TarEntry[];

export function tarGetEntryData(
	entry: TarEntry,
	arrayBuffer: ArrayBuffer,
): Uint8Array;
