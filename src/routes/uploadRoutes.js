import express from "express";
import multer from "multer";
import { supabaseAdmin } from "../config/supabaseClient.js";

const router = express.Router();

// Configuración de Multer en memoria
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload — Subida de imágenes o videos
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const folder = req.body.folder || "uploads";

    // Validación del archivo
    if (!file || !file.buffer) {
      console.error("Archivo vacío o inválido recibido.");
      return res.status(400).json({ error: "No se recibió un archivo válido." });
    }

    // Crear un nombre de archivo único y seguro
    const timestamp = Date.now();
    const safeName = file.originalname?.replace(/\s+/g, "_") || "unnamed";
    const fileName = `${folder}/${timestamp}-${safeName}`;

    console.log(`Subiendo archivo: ${fileName} (${file.mimetype})`);

    // Subir al bucket "onlearn_uploads"
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("onlearn_uploads")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype || "application/octet-stream",
        upsert: true, 
      });

    if (uploadError) {
      console.error("Error al subir a Supabase:", uploadError.message);
      return res.status(500).json({ error: uploadError.message });
    }

    // Generar URL pública
    const { data: publicData, error: publicError } = supabaseAdmin.storage
      .from("onlearn_uploads")
      .getPublicUrl(fileName);

    if (publicError || !publicData?.publicUrl) {
      console.error("No se pudo generar la URL pública:", publicError?.message);
      return res.status(500).json({ error: "No se pudo generar la URL pública." });
    }

    const publicUrl = publicData.publicUrl;

    console.log("Archivo subido correctamente:", publicUrl);

    res.status(200).json({
      success: true,
      url: publicUrl,
      path: fileName,
      type: file.mimetype,
    });
  } catch (err) {
    console.error("Error en /api/upload:", err);
    res.status(500).json({
      error: err.message || "Error interno del servidor",
    });
  }
});

export default router;
