import fs from "fs";
import path from "path";

export function imageToBase64(imagePath: string): string {
  try {
    if (!fs.existsSync(imagePath)) {
      console.warn(`Logo no encontrado: ${imagePath}`);
      return "";
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const extension = path.extname(imagePath).substring(1) || "png";
    return `data:image/${extension};base64,${base64Image}`;
  } catch (err) {
    console.warn(`No se pudo cargar imagen: ${imagePath}`, err);
    return "";
  }
}
