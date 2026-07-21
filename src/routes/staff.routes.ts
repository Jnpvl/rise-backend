import { Router } from "express";
import {
  register,
  login,
  getAll,
  getOne,
  update,
  remove
} from "../controllers/staff.controller";
import { verifyStaffToken } from "../middlewares/verifyStaffToken";

const router = Router();

router.post("/register", [verifyStaffToken], register);
router.post("/login", login);
router.get("/", [verifyStaffToken], getAll);
router.get("/:id", [verifyStaffToken], getOne);
router.put("/:id", [verifyStaffToken], update);
router.delete("/:id", [verifyStaffToken], remove);

export default router;
