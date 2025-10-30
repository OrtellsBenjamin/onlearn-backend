
import { supabaseAdmin } from "../config/supabaseClient.js";


//Middleware principal que verifica el token enviado en Authorization: Bearer <token>

 
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Falta el token de autenticación" });
    }

    const token = authHeader.split(" ")[1];

    //Verificar el token con Supabase (usa la instancia de servicio con privilegios)
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      console.warn("⚠️ Token inválido o expirado:", error?.message);
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    // Guardamos los datos básicos del usuario
    const user = data.user;

    //Obtener su perfil completo desde tu tabla 'users'
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.warn("No se encontró perfil en tabla users:", profileError.message);
    }

    //Guardamos la info en req.auth (accesible para controladores)
    req.auth = { user, profile };

    next();
  } catch (err) {
    console.error("💥 Error en requireAuth:", err);
    res.status(500).json({ message: "Error interno en autenticación" });
  }
};


 //Middleware para verificar roles (admin, instructor, client, etc.)

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const role = req.auth?.profile?.role;

    if (!role) {
      return res.status(403).json({ message: "Usuario sin rol asignado" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Acceso denegado: rol insuficiente" });
    }

    next();
  };
};
