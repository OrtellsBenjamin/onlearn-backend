import { supabaseAdmin } from "../config/supabaseClient.js";


// Listar todos los usuarios (vista general para admin)
 
export const listUsers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ Error al listar usuarios:", err.message);
    res.status(500).json({ error: err.message });
  }
};


//Listar profesores pendientes de aprobación (rol: pending_instructor)
 
export const getPendingTeachers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("role", "pending_instructor");

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ Error al obtener profesores pendientes:", err.message);
    res.status(500).json({ error: err.message });
  }
};


 //Aprobar profesor → cambia rol a "instructor"
 
export const approveTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ role: "instructor" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    res.json({ message: "Profesor aprobado", data });
  } catch (err) {

    res.status(500).json({ error: err.message });
  }
};


//Rechazar profesor vuelve a rol "client"
 
export const rejectTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ role: "client" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    res.json({ message: "🚫 Solicitud rechazada", data });
  } catch (err) {
    
    res.status(500).json({ error: err.message });
  }
};
