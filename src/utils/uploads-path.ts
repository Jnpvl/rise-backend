import fs from "fs";
import path from "path";

/** Project-root `public/` — works in both `src/` (dev) and `dist/` (build). */
export const publicDir = path.resolve(__dirname, "../../public");

/**
 * Patient attachments directory.
 * Default: `public/uploads/` (sibling of `dist/`, not inside it — safe on redeploy).
 * Override with UPLOADS_DIR for an absolute path outside the deploy folder (recommended in production).
 */
function resolveUploadsDir(): string {
  const configured = process.env.UPLOADS_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }
  return path.join(publicDir, "uploads");
}

export const uploadsDir = resolveUploadsDir();

/** Ensures the uploads directory exists at startup. */
export function ensureUploadsDir(): void {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
