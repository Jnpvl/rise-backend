import { RequestHandler } from "express";
import {
  clinicSettingsService,
  ClinicSettingsPayload,
} from "../services/clinicSettings.service";
import { handleControllerError } from "../utils/controller.utils";

function readPayload(body: unknown): ClinicSettingsPayload {
  if (!body || typeof body !== "object") {
    return {};
  }

  const data = body as Record<string, unknown>;
  const payload: ClinicSettingsPayload = {};

  if (typeof data["horario"] === "string") payload.horario = data["horario"];
  if (typeof data["telefono"] === "string") payload.telefono = data["telefono"];
  if (typeof data["whatsapp"] === "string") payload.whatsapp = data["whatsapp"];
  if (typeof data["ubicacion"] === "string") payload.ubicacion = data["ubicacion"];
  if (typeof data["facebookUrl"] === "string") {
    payload.facebookUrl = data["facebookUrl"];
  }

  return payload;
}

export const getClinicSettings: RequestHandler = async (_req, res) => {
  try {
    const settings = await clinicSettingsService.get();
    res.json(settings);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener configuración");
  }
};

export const updateClinicSettings: RequestHandler = async (req, res) => {
  try {
    const settings = await clinicSettingsService.update(readPayload(req.body));
    res.json(settings);
  } catch (err) {
    handleControllerError(res, err, "Error al actualizar configuración");
  }
};
