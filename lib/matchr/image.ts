/**
 * Centre-crops a picked image to an aspect ratio (width / height), the way the
 * mobile picker's `allowsEditing` + `aspect` does, and returns a blob: URL.
 * shortcut: fixed centre crop with no drag-to-reposition; add an interactive cropper if creators ask for it.
 */
export async function cropToAspect(file: File, aspect: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (sw / sh > aspect) sw = Math.round(sh * aspect);
  else sh = Math.round(sw / aspect);
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, sw, sh);
  bitmap.close();
  const keepPng = file.type === 'image/png';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, keepPng ? 'image/png' : 'image/jpeg', 0.9));
  if (!blob) throw new Error('Could not read that image');
  return URL.createObjectURL(blob);
}

/** Opens the file picker and resolves with the chosen file, or null when cancelled. */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

/** Photos the upload endpoint accepts. */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
