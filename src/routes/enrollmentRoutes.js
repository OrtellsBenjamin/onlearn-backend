import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listMyEnrollments,
  enrollToCourse,
  updateProgress,
} from "../controllers/enrollmentController.js";

const router = Router();

router.get("/me", requireAuth, listMyEnrollments);
router.post("/", requireAuth, enrollToCourse);
router.patch("/:course_id/progress", requireAuth, updateProgress);

export default router;
