import { Router } from "express";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";
import { createPatient, getAllPatients, getPatientById, updatePatient, generatePatientRecord } from "../controllers/patient.controller";

const router = Router();

router.post("/",[verifyStaffToken], createPatient);
router.get("/",[verifyStaffToken], getAllPatients);
router.get("/:id/pdf",[verifyStaffToken], generatePatientRecord);
router.get("/:id",[verifyStaffToken],getPatientById)
router.patch("/:id",[verifyStaffToken],updatePatient);

export default router;
