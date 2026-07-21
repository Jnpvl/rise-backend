import { Router } from "express";
import {
  getClinicSettings,
  updateClinicSettings,
} from "../controllers/clinicSettings.controller";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";

const router = Router();

router.get("/", getClinicSettings);
router.put("/", [verifyStaffToken], updateClinicSettings);

export default router;
