import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listUsers,
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
} from "../controllers/userController.js";

const router = Router();

//Solo administradores
router.get("/", requireAuth, requireRole(["admin"]), listUsers);
router.get("/pending-teachers", requireAuth, requireRole(["admin"]), getPendingTeachers);
router.patch("/approve-teacher/:id", requireAuth, requireRole(["admin"]), approveTeacher);
router.patch("/reject-teacher/:id", requireAuth, requireRole(["admin"]), rejectTeacher);

export default router;
