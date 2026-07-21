import { Router } from "express";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";
import {
  createConsultation,
  generatePodologyReport,
  generatePrescription,
  getAttachmentsByPatient,
  getConsultationById,
  getConsultationsByPatient,
  updateConsultation,
} from "../controllers/consultations.controller";

const router = Router();

router.post("/create-consultation", [verifyStaffToken], createConsultation);
router.get("/consultations-patient/:patientId", [verifyStaffToken], getConsultationsByPatient);
router.get("/attachments-patient/:patientId", [verifyStaffToken], getAttachmentsByPatient);
router.get("/consultation/:id", [verifyStaffToken], getConsultationById);
router.patch("/edit-consultation/:id", [verifyStaffToken], updateConsultation);

router.get("/prescription/:id", [verifyStaffToken], generatePrescription);
router.get("/podology-report/:id", [verifyStaffToken], generatePodologyReport);

export default router;
