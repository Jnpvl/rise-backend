import { Router } from "express";
import {
  createAppointmentInquiry,
  createContactInquiry,
  listInquiries,
  updateInquiryStatus,
} from "../controllers/webInquiry.controller";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";

const router = Router();

router.post("/appointments", createAppointmentInquiry);
router.post("/contacts", createContactInquiry);
router.get("/", [verifyStaffToken], listInquiries);
router.patch("/:id/status", [verifyStaffToken], updateInquiryStatus);

export default router;
