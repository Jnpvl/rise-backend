import { Router } from "express";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";
import { getDashboardSummary } from "../controllers/dashboard.controller";

const router = Router();

router.get("/summary", [verifyStaffToken], getDashboardSummary);

export default router;
