import { supabaseAdmin } from "../config/supabaseClient.js";


// Listar todos los cursos (para panel admin o filtrado por instructor o categoría)
 
export const listCourses = async (req, res) => {
  try {
    const instructorId = req.query.instructor_id;
    const categoryId = req.query.category_id;

    let query = supabaseAdmin
      .from("courses")
      .select("*, course_categories(name)")
      .order("created_at", { ascending: false });

    if (instructorId) query = query.eq("owner", instructorId);
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error al listar cursos:", err.message);
    res.status(500).json({ error: err.message });
  }
};


//Listar cursos publicados (Home / Catálogo)

export const listPublishedCourses = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("*, course_categories(name)")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error al listar cursos publicados:", err.message);
    res.status(500).json({ error: err.message });
  }
};


// Crear curso (instructor / admin)
export const createCourse = async (req, res) => {
  try {
    const { title, description, price, image_url, owner, category_id } = req.body;

    if (!title || !description || !price || !owner || !category_id) {
      return res.status(400).json({ error: "Faltan campos obligatorios (categoría incluida)." });
    }

    // Crear curso en estado 'pending' por defecto
    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert([
        { title, description, price, image_url, status: "pending", owner, category_id },
      ])
      .select("*, course_categories(name)")
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Curso creado correctamente.", data });
  } catch (err) {
    console.error("Error al crear curso:", err.message);
    res.status(500).json({ error: err.message });
  }
};


// Aprobar curso (admin)
export const approveCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .update({ status: "published" })
      .eq("id", id)
      .select("*")
      .single();

    // en caso de algun error este se lanza y se captura en el catch
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Curso no encontrado." });

    res.json({ message: "Curso aprobado y publicado.", data });
  } catch (err) {
    console.error("Error al aprobar curso:", err.message);
    res.status(500).json({ error: err.message });
  }
};

//Rechazar curso (admin vuelve a 'draft')
 
export const rejectCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .update({ status: "draft" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Curso no encontrado." });

    res.json({ message: "Curso rechazado y enviado a borrador.", data });
  } catch (err) {
    console.error("Error al rechazar curso:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Eliminar curso (admin o instructor dueño)
// Eliminar curso (admin o instructor dueño)
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user; // viene del middleware requireAuth

    // 1️⃣ Verificar si el curso existe
    const { data: course, error: fetchErr } = await supabaseAdmin
      .from("courses")
      .select("id, owner")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!course) return res.status(404).json({ error: "Curso no encontrado." });

    //Validar permisos (admin o instructor dueño)
    if (user.role !== "admin" && course.owner !== user.id) {
      return res.status(403).json({ error: "No autorizado para eliminar este curso." });
    }

    //Eliminar primero las lecciones asociadas
    const { error: lessonsErr } = await supabaseAdmin
      .from("course_lessons")
      .delete()
      .eq("course_id", id);
    if (lessonsErr) throw lessonsErr;

    //Eliminar el curso
    const { error: deleteErr } = await supabaseAdmin
      .from("courses")
      .delete()
      .eq("id", id);
    if (deleteErr) throw deleteErr;

    res.json({ message: "Curso eliminado correctamente." });
  } catch (err) {
    console.error("Error al eliminar curso:", err.message);
    res.status(500).json({ error: err.message });
  }
};



// Obtener lecciones de un curso
 
export const getCourseLessons = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("course_lessons")
      .select("*")
      .eq("course_id", id)
      .order("order_index", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error al obtener lecciones:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Crear lección dentro de un curso
 
export const createLesson = async (req, res) => {
  const { id } = req.params;
  const { title, description, video_url, order_index } = req.body;

  if (!title) return res.status(400).json({ error: "El título es obligatorio." });

  try {
    const { data, error } = await supabaseAdmin
      .from("course_lessons")
      .insert([{ course_id: id, title, description, video_url, order_index }])
      .select()
      .single();
    if (error) throw error;

    res.status(201).json({ message: "Lección creada correctamente.", data });
  } catch (err) {
    console.error("Error al crear lección:", err.message);
    res.status(500).json({ error: err.message });
  }
};


//Actualizar curso existente
 
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.auth?.user;
    const role = req.auth?.profile?.role;
    const { title, description, price, image_url, category_id } = req.body;

    if (!title || !description || !price)
      return res.status(400).json({ error: "Faltan campos obligatorios." });

    
    // Se realiza la consulta a la base de datos 
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("courses")
      .select("id, owner")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!existing) return res.status(404).json({ error: "Curso no encontrado." });

    // Se verifica si el usuario tiene permiso para editar el curso
    if (role === "instructor" && existing.owner !== user.id)
      return res.status(403).json({ error: "No tenés permiso para editar este curso." });

    // Se actualiza el curso con lo ingresado
    const { data, error } = await supabaseAdmin
      .from("courses")
      .update({ title, description, price, image_url, category_id })
      .eq("id", id)
      .select("*, course_categories(name)")
      .single();

    if (error) throw error;


    res.json({ message: "Curso actualizado correctamente.", data });
  } catch (err) {
    console.error("Error al actualizar curso:", err.message);
    res.status(500).json({ error: err.message });
  }
};


//Actualizar lección existente
 
export const updateLesson = async (req, res) => {
  const { id, lessonId } = req.params;
  const { title, description, video_url } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from("course_lessons")
      .update({ title, description, video_url })
      .eq("id", lessonId)
      .eq("course_id", id)
      .select("*")
      .single();
    if (error) throw error;
    res.json({ message: "Lección actualizada correctamente.", data });
  } catch (err) {
    console.error("Error al actualizar lección:", err.message);
    res.status(500).json({ error: err.message });
  }
};


//Eliminar lección existente
 
export const deleteLesson = async (req, res) => {
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
    console.error("Error al eliminar lección:", err.message);
    res.status(500).json({ error: err.message });
  }
};


//Listar todas las categorías
 
export const listCategories = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("course_categories")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("❌ Error al listar categorías:", err.message);
    res.status(500).json({ error: err.message });
  }
};


//Listar cursos populares (solo los marcados como is_popular = true)
 
export const listPopularCourses = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("status", "published")
      .eq("is_popular", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ Error al listar cursos populares:", err.message);
    res.status(500).json({ error: err.message });
  }
};
