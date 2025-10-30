import { supabaseAdmin } from '../config/supabaseClient.js';

export const listMyEnrollments = async (req, res) => {
  const uid = req.auth.profile?.id;

  const { data, error } = await supabaseAdmin
    .from("enrollments")
    .select(`
      user_id,
      course_id,
      progress,
      created_at,
      course:courses(id, title, description, image_url, price)
    `)
    .eq("user_id", uid);

  if (error) {
    console.error("❌ Error listando cursos:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

export const enrollToCourse = async (req, res) => {
  const uid = req.auth.profile?.id;
  const { course_id } = req.body;

  if (!course_id) {
    return res.status(400).json({ message: "course_id requerido" });
  }

  //Evitar duplicados (por si ya está inscripto)
  const { data: existing } = await supabaseAdmin
    .from("enrollments")
    .select("*")
    .eq("user_id", uid)
    .eq("course_id", course_id)
    .maybeSingle();

  if (existing) {
    return res.status(200).json({ message: "Ya estás inscripto en este curso." });
  }

  //Insertar inscripción directa (sin status)
  const { data, error } = await supabaseAdmin
    .from("enrollments")
    .insert([{ user_id: uid, course_id }])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al inscribir:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({
    message: "Inscripción registrada correctamente.",
    enrollment: data,
  });
};


export const approveEnrollment = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .update({ status: 'approved' })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};


export const updateProgress = async (req, res) => {
  const uid = req.auth.profile?.id;
  const { course_id } = req.params;
  const { progress } = req.body;

  if (!course_id || progress === undefined) {
    return res.status(400).json({ message: "course_id y progress son requeridos" });
  }

  const { error } = await supabaseAdmin
    .from("enrollments")
    .update({ progress })
    .eq("user_id", uid)
    .eq("course_id", course_id);

  if (error) {
    console.error("❌ Error actualizando progreso:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Progreso actualizado correctamente", progress });
};

