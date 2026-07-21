import { RequestHandler } from "express";
import { patientService } from "../services/patient.service";
import { handleControllerError } from "../utils/controller.utils";
import { routeParam } from "../utils/params.utils";

export const createPatient: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user as { id: string; role: string } | undefined;
    const result = await patientService.create(req.body, user);
    res.status(201).json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al registrar paciente");
  }
};

export const getAllPatients: RequestHandler = async (req, res) => {
  try {
    const result = await patientService.list({
      page: req.query.page as string,
      limit: req.query.limit as string,
      search: req.query.search as string,
      isActive: req.query.isActive as string,
      createdById: req.query.createdById as string,
    });
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener pacientes");
  }
};

export const updatePatient: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const result = await patientService.update(id, req.body);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al actualizar paciente");
  }
};

export const deletePatient: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const result = await patientService.deactivate(id);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al desactivar paciente");
  }
};

export const getPatientById: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const patient = await patientService.getById(id);
    res.json(patient);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener paciente");
  }
};
