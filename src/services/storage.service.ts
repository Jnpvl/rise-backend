import fs from "fs";
import path from "path";
import { uploadsDir } from "../utils/uploads-path";

export function buildStoredName(originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${safeName}`;
}

export async function savePatientFile(
  patientId: string,
  file: Express.Multer.File
): Promise<{ storedName: string; fileUrl: string }> {
  const storedName = buildStoredName(file.originalname);
  const buffer = file.buffer;

  if (!buffer?.length) {
    throw new Error("Archivo vacío o no recibido en memoria");
  }

  const dir = path.join(uploadsDir, patientId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, storedName), buffer);

  return {
    storedName,
    fileUrl: `/uploads/${patientId}/${storedName}`,
  };
}

export async function deletePatientFile(
  patientId: string,
  storedName: string
): Promise<void> {
  const filePath = path.join(uploadsDir, patientId, storedName);
  const resolved = path.resolve(filePath);
  const patientDir = path.resolve(uploadsDir, patientId);

  if (!resolved.startsWith(patientDir + path.sep)) {
    throw new Error("Ruta de archivo inválida");
  }

  if (!fs.existsSync(resolved)) {
    throw new Error("Archivo no encontrado");
  }

  fs.unlinkSync(resolved);
}
