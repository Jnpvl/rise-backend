import fs from "fs";
import path from "path";

export function imageToBase64(imagePath: string): string {
  try {
    if (!fs.existsSync(imagePath)) {
      return "";
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const extension = path.extname(imagePath).substring(1).toLowerCase() || "png";
    const mime = extension === "jpg" ? "jpeg" : extension;
    return `data:image/${mime};base64,${imageBuffer.toString("base64")}`;
  } catch {
    return "";
  }
}
