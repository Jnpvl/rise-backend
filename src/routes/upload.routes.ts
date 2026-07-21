import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { deleteUploadedFile, uploadFile } from "../controllers/upload.controller";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";
import { uploadsDir } from "../utils/uploads-path";
import { routeParam } from "../utils/params.utils";

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function safePatientFolder(patientId: string): string {
  const clean = patientId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!clean) {
    throw new Error("patientId inválido");
  }
  return clean;
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    try {
      const patientId = safePatientFolder(routeParam(req.params.patientId));
      const dir = path.join(uploadsDir, patientId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err as Error, uploadsDir);
    }
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Tipo de archivo no permitido"));
  },
});

const router = Router();

router.post(
  "/patient/:patientId",
  [verifyStaffToken],
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        const message =
          err instanceof Error ? err.message : "Error al subir archivo";
        res.status(400).json({ message });
        return;
      }
      next();
    });
  },
  uploadFile
);

router.delete(
  "/patient/:patientId/:storedName",
  [verifyStaffToken],
  deleteUploadedFile
);

export default router;
