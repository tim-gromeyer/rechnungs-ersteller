export async function compressImage(file: File, quality = 0.7): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = (event) => {
			const img = new Image();
			img.src = event.target?.result as string;
			img.onload = () => {
				const canvas = document.createElement('canvas');

				// Calculate aspect ratio and maximum dimension
				const MAX_DIMENSION = 1920;
				let width = img.width;
				let height = img.height;

				if (width > height) {
					if (width > MAX_DIMENSION) {
						height *= MAX_DIMENSION / width;
						width = MAX_DIMENSION;
					}
				} else {
					if (height > MAX_DIMENSION) {
						width *= MAX_DIMENSION / height;
						height = MAX_DIMENSION;
					}
				}

				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');
				if (!ctx) return reject(new Error('Canvas ctx null'));

				ctx.drawImage(img, 0, 0, width, height);

				// Convert back to base64
				const dataUrl = canvas.toDataURL('image/jpeg', quality);
				resolve(dataUrl);
			};
			img.onerror = (error) => reject(error);
		};
		reader.onerror = (error) => reject(error);
	});
}

/**
 * Compresses an image and returns it as a Blob
 */
export async function compressImageToBlob(file: File, quality = 0.7): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = (event) => {
			const img = new Image();
			img.src = event.target?.result as string;
			img.onload = () => {
				const canvas = document.createElement('canvas');
				const MAX_DIMENSION = 1920;
				let width = img.width;
				let height = img.height;

				if (width > height) {
					if (width > MAX_DIMENSION) {
						height *= MAX_DIMENSION / width;
						width = MAX_DIMENSION;
					}
				} else {
					if (height > MAX_DIMENSION) {
						width *= MAX_DIMENSION / height;
						height = MAX_DIMENSION;
					}
				}

				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) return reject(new Error('Canvas ctx null'));
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (blob) resolve(blob);
						else reject(new Error('Canvas toBlob failed'));
					},
					'image/jpeg',
					quality
				);
			};
			img.onerror = (error) => reject(error);
		};
		reader.onerror = (error) => reject(error);
	});
}

/**
 * Compresses a Blob using Gzip (CompressionStream API)
 */
export async function gzipBlob(blob: Blob): Promise<Blob> {
	const type = blob.type;
	const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
	const compressed = await new Response(stream).blob();
	return new Blob([compressed], { type });
}

/**
 * Decompresses a Gzip Blob using DecompressionStream API
 */
export async function ungzipBlob(blob: Blob): Promise<Blob> {
	try {
		const type = blob.type;
		const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
		const decompressed = await new Response(stream).blob();
		return new Blob([decompressed], { type });
	} catch {
		// If it's not gzipped, just return the original blob
		return blob;
	}
}

export async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});
}
