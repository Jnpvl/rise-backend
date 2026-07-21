import { RequestHandler } from "express";
import { patientService } from "../services/patient.service";
import { handleControllerError } from "../utils/controller.utils";

export const activedPatients: RequestHandler = async (_req, res) => {
  try {
    const patients = await patientService.listActiveForSelect();
    res.json(patients);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener pacientes activos");
  }
};
