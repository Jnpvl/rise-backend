import fs from "fs";
import path from "path";
import { RequestHandler } from "express";
import { handleControllerError } from "../utils/controller.utils";
import { routeParam } from "../utils/params.utils";
import { AppError } from "../utils/app-error";
import { uploadsDir } from "../utils/uploads-path";

function safePatientId(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!clean) {
    throw new AppError(400, "patientId inválido");
  }
  return clean;
}

function safeStoredName(raw: string): string {
  const clean = path.basename(raw);
  if (!clean || clean === "." || clean === "..") {
    throw new AppError(400, "Nombre de archivo inválido");
  }
  return clean;
}

export const uploadFile: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No se recibió ningún archivo" });
      return;
    }

    const patientId = safePatientId(routeParam(req.params.patientId));
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/${patientId}/${req.file.filename}`;

    res.status(201).json({
      message: "Archivo subido correctamente",
      fileName: req.file.originalname,
      storedName: req.file.filename,
      patientId,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileUrl,
    });
  } catch (err) {
    handleControllerError(res, err, "Error al subir archivo");
  }
};

export const deleteUploadedFile: RequestHandler = async (req, res) => {
  try {
    const patientId = safePatientId(routeParam(req.params.patientId));
    const storedName = safeStoredName(routeParam(req.params.storedName));
    const filePath = path.join(uploadsDir, patientId, storedName);
    const resolved = path.resolve(filePath);
    const patientDir = path.resolve(uploadsDir, patientId);

    if (!resolved.startsWith(patientDir + path.sep)) {
      throw new AppError(400, "Ruta de archivo inválida");
    }

    if (!fs.existsSync(resolved)) {
      throw new AppError(404, "Archivo no encontrado");
    }

    fs.unlinkSync(resolved);

    res.json({ message: "Archivo eliminado correctamente" });
  } catch (err) {
    handleControllerError(res, err, "Error al eliminar archivo");
  }
};
