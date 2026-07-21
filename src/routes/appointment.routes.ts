import { Router } from "express";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getDoctorSchedule
} from "../controllers/appointment.controller";

const router = Router();

router.post("/create", [verifyStaffToken], createAppointment);
router.get("/", [verifyStaffToken], getAppointments);
router.get("/:id", [verifyStaffToken], getAppointmentById);
router.patch("/:id", [verifyStaffToken], updateAppointment);
router.delete("/:id", [verifyStaffToken], deleteAppointment);

// Obtener agenda del doctor para una fecha específica
router.get("/doctor/:doctorId/schedule/:date", [verifyStaffToken], getDoctorSchedule);

export default router;
