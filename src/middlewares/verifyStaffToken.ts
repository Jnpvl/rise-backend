import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../utils/jwt.utils";
import { AppDataSource } from "../config/database";
import { Staff } from "../entities/Staff.entity";

const staffRepo = AppDataSource.getRepository(Staff);

export const verifyStaffToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Token no proporcionado o formato inválido." });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJWT(token);
    if (!decoded) {
      res.status(401).json({ message: "Token no válido o expirado." });
      return;
    }

    const { id } = decoded.payload;
    const staff = await staffRepo.findOneBy({ id });
    if (!staff) {
      res.status(401).json({ message: "Staff no encontrado." });
      return;
    }

    if (!staff.isActive) {
      res.status(403).json({ message: "Staff inactivo." });
      return;
    }

    (req as any).user = { id: staff.id, role: staff.role };
    next();

  } catch (error) {
    console.error("Error en verifyStaffToken:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
