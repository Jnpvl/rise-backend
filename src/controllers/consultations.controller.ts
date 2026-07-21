import { RequestHandler } from "express";
import { consultationService } from "../services/consultation.service";
import { handleControllerError } from "../utils/controller.utils";
import { routeParam } from "../utils/params.utils";

export const createConsultation: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user as { id: string; role: string } | undefined;
    const result = await consultationService.create(req.body, user);
    res.status(201).json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al registrar consulta");
  }
};

export const getConsultationsByPatient: RequestHandler = async (req, res) => {
  try {
    const patientId = routeParam(req.params.patientId);
    const result = await consultationService.listByPatient(
      patientId,
      req.query.page as string,
      req.query.limit as string
    );
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener consultas");
  }
};

export const getAttachmentsByPatient: RequestHandler = async (req, res) => {
  try {
    const patientId = routeParam(req.params.patientId);
    const result = await consultationService.listAttachmentsByPatient(patientId);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener adjuntos");
  }
};

export const getConsultationById: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const consultation = await consultationService.getById(id);
    res.json(consultation);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener consulta");
  }
};

export const updateConsultation: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user as { id: string; role: string } | undefined;
    const id = routeParam(req.params.id);
    const result = await consultationService.update(id, req.body, user);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al actualizar la consulta");
  }
};

export const generatePrescription: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const { buffer, filename } =
      await consultationService.generatePrescriptionPdf(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${filename}"`
    );
    res.send(buffer);
  } catch (err) {
    handleControllerError(res, err, "Error al generar la receta");
  }
};

export const generatePodologyReport: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const { buffer, filename } =
      await consultationService.generatePodologyReportPdf(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${filename}"`
    );
    res.send(buffer);
  } catch (err) {
    handleControllerError(res, err, "Error al generar el reporte de podología");
  }
};
