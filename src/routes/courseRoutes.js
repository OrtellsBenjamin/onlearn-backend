import express from "express";
import {
  listCourses,
  listPublishedCourses,
  createCourse,
  approveCourse,
  rejectCourse,
  deleteCourse,
  getCourseLessons,
  listPopularCourses,
  createLesson,
  updateLesson,
  updateCourse,
  listCategories,
} from "../controllers/courseController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabaseClient.js"; 

const router = express.Router();

router.get("/", listCourses);
router.get("/published", listPublishedCourses);
router.post("/", requireAuth, requireRole(["instructor", "admin"]), createCourse);
router.patch("/:id", requireAuth, requireRole(["instructor", "admin"]), updateCourse);
router.delete("/:id", requireAuth, requireRole(["instructor", "admin"]), deleteCourse);


//Aprobación / Rechazo de cursos (solo admin)

router.patch("/:id/approve", requireAuth, requireRole(["admin"]), approveCourse);
router.patch("/:id/reject", requireAuth, requireRole(["admin"]), rejectCourse);


//Lecciones (módulos)

router.get("/:id/lessons", getCourseLessons);
router.post("/:id/lessons", requireAuth, requireRole(["instructor", "admin"]), createLesson);
router.patch("/:id/lessons/:lessonId", requireAuth, requireRole(["instructor", "admin"]), updateLesson);

//Eliminar una lección específica
router.delete(
  "/:id/lessons/:lessonId",
  requireAuth,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    const { id, lessonId } = req.params;
    try {
      const { error } = await supabaseAdmin
        .from("course_lessons")
        .delete()
        .eq("id", lessonId)
        .eq("course_id", id);

      if (error) throw error;
      res.json({ message: "Módulo eliminado correctamente." });
    } catch (err) {
      console.error("Error al eliminar módulo:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);


//Cursos populares

router.get("/popular", listPopularCourses);

//Categorías

router.get("/categories", listCategories);

export default router;
