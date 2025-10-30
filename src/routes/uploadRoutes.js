import express from "express";
import multer from "multer";
import { supabaseAdmin } from "../config/supabaseClient.js";

const router = express.Router();

//Multer en memoria (archivos temporales)
const upload = multer({ storage: multer.memoryStorage() });

//POST /api/upload — Subida de imágenes o videos
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const folder = req.body.folder || "uploads";

    //Validación inicial
    if (!file || !file.buffer) {
      console.error("Archivo vacío o inválido recibido.");
      return res.status(400).json({ error: "No se recibió un archivo válido." });
    }

    //Nombre único
    const timestamp = Date.now();
    const safeName = file.originalname?.replace(/\s+/g, "_") || "unnamed";
    const fileName = `${folder}/${timestamp}-${safeName}`;

    console.log(`📤 Subiendo ${file.mimetype} a Supabase: ${fileName}`);

    //Subir a bucket público
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

    //Obtener URL pública
    const { data: publicData } = supabaseAdmin.storage
      .from("onlearn_uploads")
      .getPublicUrl(fileName);

    const publicUrl = publicData?.publicUrl || null;
    if (!publicUrl) {
      console.error("No se pudo generar URL pública.");
      return res.status(500).json({ error: "No se pudo generar URL pública." });
    }

    console.log("Archivo subido correctamente:", publicUrl);

    res.status(200).json({
      success: true,
      url: publicUrl,
      path: fileName,
      type: file.mimetype,
    });
  } catch (err) {
    console.error("💥 Error en /api/upload:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

export default router;
