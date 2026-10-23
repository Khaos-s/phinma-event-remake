const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function posterExtension(file: { type: string; size: number }): string | null {
  return file.size > 0 && file.size <= 5 * 1024 * 1024 ? extensions[file.type] ?? null : null;
}
