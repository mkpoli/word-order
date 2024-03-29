export function save(content: BlobPart, type: string, filename: string): void {
	const blob = new Blob([content], { type });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function open<T>(callback: (data: T) => Promise<void>): void {
	const input = document.createElement('input');
	input.type = 'file';
	input.onchange = async () => {
		if (!input.files) return;
		const file = input.files[0];
		if (!file) return;

		const reader = new window.FileReader();
		reader.readAsText(file);
		reader.onload = async () => {
			await callback(JSON.parse(reader.result as string));
		};
	};
	input.click();
}
