// Based on
// https://github.com/workhorsy/uncompress.js
// This software is licensed under a MIT License

const TAR_TYPE_FILE = 0;
const TAR_TYPE_DIR = 5;

const TAR_HEADER_SIZE = 512;
const TAR_TYPE_OFFSET = 156;
const TAR_TYPE_SIZE = 1;
const TAR_SIZE_OFFSET = 124;
const TAR_SIZE_SIZE = 12;
const TAR_NAME_OFFSET = 0;
const TAR_NAME_SIZE = 100;

function _tarRead(view, offset, size) {
	return view.slice(offset, offset + size);
}

export function tarGetEntries(arrayBuffer) {
	const view = new Uint8Array(arrayBuffer);
	let offset = 0;
	const entries = [];

	while (offset + TAR_HEADER_SIZE < view.byteLength) {
		// Get entry name
		const entryName = new TextDecoder()
			.decode(_tarRead(view, offset + TAR_NAME_OFFSET, TAR_NAME_SIZE))
			// oxlint-disable-next-line no-control-regex
			.replace(/\0/g, '');

		// No entry name, so probably the last block
		if (entryName.length === 0) break;

		// Get entry size
		const entrySizeString = new TextDecoder('ascii')
			.decode(_tarRead(view, offset + TAR_SIZE_OFFSET, TAR_SIZE_SIZE))
			.replace(/\0/g, '')
			.trim();
		const entrySize = parseInt(entrySizeString, 8);
		const entryTypeBytes = _tarRead(
			view,
			offset + TAR_TYPE_OFFSET,
			TAR_TYPE_SIZE,
		);
		const entryType = entryTypeBytes[0] - 48; // Convert ASCII '0' to number 0

		// Save this as en entry if it is a file or directory
		if ([TAR_TYPE_FILE, TAR_TYPE_DIR].includes(entryType)) {
			entries.push({
				name: `${entryName}`,
				size: entrySize,
				is_file: entryType === TAR_TYPE_FILE,
				offset,
			});
		}

		// Round the offset up to be divisible by TAR_HEADER_SIZE
		offset += entrySize + TAR_HEADER_SIZE;
		if (offset % TAR_HEADER_SIZE > 0) {
			const even = (offset / TAR_HEADER_SIZE) | 0; // number of times it goes evenly into TAR_HEADER_SIZE
			offset = (even + 1) * TAR_HEADER_SIZE;
		}
	}

	return entries;
}

export function tarGetEntryData(entry, arrayBuffer) {
	return _tarRead(
		new Uint8Array(arrayBuffer),
		entry.offset + TAR_HEADER_SIZE,
		entry.size,
	);
}
