import { RequestHandler } from "express";
import { labResultService } from "../services/labResult.service";
import { handleControllerError } from "../utils/controller.utils";
import { routeParam } from "../utils/params.utils";

export const createLabResult: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user as { id: string; role: string } | undefined;
    const result = await labResultService.create(req.body, user);
    res.status(201).json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al guardar resultados de laboratorio");
  }
};

export const updateLabResult: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const result = await labResultService.update(id, req.body);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al actualizar resultados de laboratorio");
  }
};

export const getLabResultById: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const labResult = await labResultService.getById(id);
    res.json(labResult);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener resultado de laboratorio");
  }
};

export const getLabResultsByPatient: RequestHandler = async (req, res) => {
  try {
    const patientId = routeParam(req.params.patientId);
    const result = await labResultService.listByPatient(
      patientId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al listar resultados de laboratorio");
  }
};

export const previewLabResultPdf: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user as { id: string; role: string } | undefined;
    const { buffer, filename } = await labResultService.generatePdfFromDraft(
      req.body,
      user
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    handleControllerError(res, err, "Error al generar el PDF de laboratorio");
  }
};

export const getLabResultPdf: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const { buffer, filename } = await labResultService.generatePdfById(id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    handleControllerError(res, err, "Error al generar el PDF de laboratorio");
  }
};
