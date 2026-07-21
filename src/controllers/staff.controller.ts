import { RequestHandler } from "express";
import { staffService } from "../services/staff.service";
import { handleControllerError } from "../utils/controller.utils";
import { routeParam } from "../utils/params.utils";

export const register: RequestHandler = async (req, res) => {
  try {
    const result = await staffService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al registrar staff");
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const result = await staffService.login(req.body);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error en login de staff");
  }
};

export const getAll: RequestHandler = async (_req, res) => {
  try {
    const allStaff = await staffService.getAll();
    res.json(allStaff);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener staff");
  }
};

export const getOne: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const staff = await staffService.getById(id);
    res.json(staff);
  } catch (err) {
    handleControllerError(res, err, "Error al obtener staff");
  }
};

export const update: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const result = await staffService.update(id, req.body);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al actualizar staff");
  }
};

export const remove: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const result = await staffService.deactivate(id);
    res.json(result);
  } catch (err) {
    handleControllerError(res, err, "Error al eliminar staff");
  }
};
