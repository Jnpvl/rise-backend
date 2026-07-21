import { RequestHandler } from "express";
import { appointmentService } from "../services/appointment.service";
import { handleControllerError } from "../utils/controller.utils";
import { routeParam } from "../utils/params.utils";

export const createAppointment: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user as { id: string; role: string } | undefined;
    const result = await appointmentService.create(req.body, user);
    res.status(201).json(result);
  } catch (err) {
    handleControllerError(res, err, "Error interno del servidor");
  }
};

export const getAppointments: RequestHandler = async (req, res) => {
  try {
    const result = await appointmentService.list({
      doctorId: req.query.doctorId as string,
      patientId: req.query.patientId as string,
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page as string,
      limit: req.query.limit as string,
    });
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error interno del servidor");
  }
};

export const getAppointmentById: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const appointment = await appointmentService.getById(id);
    res.json(appointment);
  } catch (err) {
    handleControllerError(res, err, "Error interno del servidor");
  }
};

export const updateAppointment: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const result = await appointmentService.update(id, req.body);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error interno del servidor");
  }
};

export const deleteAppointment: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const result = await appointmentService.remove(id);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error interno del servidor");
  }
};

export const getDoctorSchedule: RequestHandler = async (req, res) => {
  try {
    const doctorId = routeParam(req.params.doctorId);
    const date = routeParam(req.params.date);
    const result = await appointmentService.getDoctorSchedule(doctorId, date);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error interno del servidor");
  }
};
