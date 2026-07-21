import path from "path";

/** Project-root `uploads/` — works in both `src/` (dev) and `dist/` (build). */
export const uploadsDir = path.resolve(__dirname, "../../uploads");
