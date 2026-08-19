import path from "path";
import { RequestHandler } from "express";
import { handleControllerError } from "../utils/controller.utils";
import { routeParam } from "../utils/params.utils";
import { AppError } from "../utils/app-error";
import { deletePatientFile, savePatientFile } from "../services/storage.service";

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
    const { storedName, fileUrl } = await savePatientFile(patientId, req.file);

    const absoluteUrl = fileUrl.startsWith("http")
      ? fileUrl
      : `${req.protocol}://${req.get("host")}${fileUrl}`;

    res.status(201).json({
      message: "Archivo subido correctamente",
      fileName: req.file.originalname,
      storedName,
      patientId,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileUrl: absoluteUrl,
    });
  } catch (err) {
    handleControllerError(res, err, "Error al subir archivo");
  }
};

export const deleteUploadedFile: RequestHandler = async (req, res) => {
  try {
    const patientId = safePatientId(routeParam(req.params.patientId));
    const storedName = safeStoredName(routeParam(req.params.storedName));

    try {
      await deletePatientFile(patientId, storedName);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar";
      if (message.includes("no encontrado")) {
        throw new AppError(404, "Archivo no encontrado");
      }
      if (message.includes("inválida")) {
        throw new AppError(400, message);
      }
      throw err;
    }

    res.json({ message: "Archivo eliminado correctamente" });
  } catch (err) {
    handleControllerError(res, err, "Error al eliminar archivo");
  }
};
