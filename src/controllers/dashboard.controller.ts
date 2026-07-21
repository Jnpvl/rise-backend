import { RequestHandler } from "express";
import { dashboardService } from "../services/dashboard.service";
import { handleControllerError } from "../utils/controller.utils";

export const getDashboardSummary: RequestHandler = async (_req, res) => {
  try {
    const summary = await dashboardService.getSummary();
    res.json(summary);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener resumen del dashboard");
  }
};
