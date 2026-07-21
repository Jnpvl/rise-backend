import { Router } from "express";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";
import { activedPatients } from "../controllers/generalInformation.controller";

const router = Router();

router.get("/actived-patients", [verifyStaffToken], activedPatients);

export default router;
