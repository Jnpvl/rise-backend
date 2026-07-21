import { Router } from "express";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";
import {
  createLabResult,
  getLabResultById,
  getLabResultPdf,
  getLabResultsByPatient,
  previewLabResultPdf,
  updateLabResult,
} from "../controllers/labResult.controller";

const router = Router();

router.post("/preview-pdf", [verifyStaffToken], previewLabResultPdf);
router.post("/", [verifyStaffToken], createLabResult);
router.get("/patient/:patientId", [verifyStaffToken], getLabResultsByPatient);
router.get("/:id/pdf", [verifyStaffToken], getLabResultPdf);
router.get("/:id", [verifyStaffToken], getLabResultById);
router.patch("/:id", [verifyStaffToken], updateLabResult);

export default router;
