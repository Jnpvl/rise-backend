import { RequestHandler } from "express";
import { webInquiryService } from "../services/webInquiry.service";
import { handleControllerError } from "../utils/controller.utils";
import { routeParam } from "../utils/params.utils";
import { WebInquiryStatus, WebInquiryType } from "../entities/WebInquiry.entity";

export const createAppointmentInquiry: RequestHandler = async (req, res) => {
  try {
    const inquiry = await webInquiryService.createAppointment(req.body);
    res.status(201).json({
      message: "Solicitud de cita recibida. Te contactaremos para confirmar.",
      inquiry,
    });
  } catch (err) {
    handleControllerError(res, err, "Error al registrar la solicitud de cita");
  }
};

export const createContactInquiry: RequestHandler = async (req, res) => {
  try {
    const inquiry = await webInquiryService.createContact(req.body);
    res.status(201).json({
      message: "Mensaje recibido. Te responderemos pronto.",
      inquiry,
    });
  } catch (err) {
    handleControllerError(res, err, "Error al registrar el mensaje");
  }
};

export const listInquiries: RequestHandler = async (req, res) => {
  try {
    const typeParam = req.query.type;
    const type =
      typeParam === "appointment" || typeParam === "contact"
        ? (typeParam as WebInquiryType)
        : undefined;
    const items = await webInquiryService.list(type);
    res.json(items);
  } catch (err) {
    handleControllerError(res, err, "Error al listar solicitudes");
  }
};

export const updateInquiryStatus: RequestHandler = async (req, res) => {
  try {
    const id = routeParam(req.params.id);
    const status = (req.body?.status ?? "") as WebInquiryStatus;
    const inquiry = await webInquiryService.updateStatus(id, status);
    res.json(inquiry);
  } catch (err) {
    handleControllerError(res, err, "Error al actualizar la solicitud");
  }
};
