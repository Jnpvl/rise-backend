import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { deleteUploadedFile, uploadFile } from "../controllers/upload.controller";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";

const upload = multer({
  storage: multer.memoryStorage(),
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
