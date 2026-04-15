import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import pdfParse from "pdf-parse";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed =
    file.mimetype === "application/pdf" ||
    file.mimetype.startsWith("image/") ||
    file.originalname.toLowerCase().endsWith(".pdf") ||
    file.originalname.toLowerCase().endsWith(".jpg") ||
    file.originalname.toLowerCase().endsWith(".jpeg") ||
    file.originalname.toLowerCase().endsWith(".png");

  if (!allowed) {
    return cb(new Error("Solo se permiten PDF o imágenes."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadsDir));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const postulaciones = [];

const ubicaciones = {
  "México": {
    "Chihuahua": ["Ciudad Juárez", "Chihuahua"],
    "Baja California": ["Mexicali"],
    "Jalisco": ["Guadalajara"]
  },
  "Estados Unidos": {
    "Texas": ["El Paso"]
  }
};

const vacantes = [
  {
    id: "vac-001",
    tipoVacante: "operativa",
    grupo: "Wendy's",
    titulo: "Cajero",
    area: "Operaciones",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Las Misiones",
    requisitos: ["Atención al cliente", "Manejo básico de caja", "Disponibilidad de horario"]
  },
  {
    id: "vac-002",
    tipoVacante: "operativa",
    grupo: "Wendy's",
    titulo: "Despachador",
    area: "Servicio",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Ejército Nacional",
    requisitos: ["Rapidez", "Orden", "Trabajo en equipo"]
  },
  {
    id: "vac-003",
    tipoVacante: "operativa",
    grupo: "Little Caesars",
    titulo: "Auxiliar de Cocina",
    area: "Cocina",
    pais: "México",
    estado: "Baja California",
    ciudad: "Mexicali",
    sucursal: "Sendero",
    requisitos: ["Preparación de alimentos", "Limpieza", "Trabajo bajo presión"]
  },
  {
    id: "vac-004",
    tipoVacante: "operativa",
    grupo: "Applebee's",
    titulo: "Hostess",
    area: "Recepción",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Tecnológico",
    requisitos: ["Excelente trato al cliente", "Presentación", "Comunicación"]
  },
  {
    id: "vac-005",
    tipoVacante: "operativa",
    grupo: "Great American Steakhouse",
    titulo: "Parrillero",
    area: "Cocina",
    pais: "Estados Unidos",
    estado: "Texas",
    ciudad: "El Paso",
    sucursal: "Main Branch",
    requisitos: ["Manejo de parrilla", "Cocción de carnes", "Trabajo bajo presión"]
  },
  {
    id: "vac-006",
    tipoVacante: "operativa",
    grupo: "Ardeo",
    titulo: "Chef de Línea",
    area: "Cocina",
    pais: "México",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Ardeo Central",
    requisitos: ["Cocina gourmet", "Organización", "Trabajo en equipo"]
  },
  {
    id: "vac-007",
    tipoVacante: "operativa",
    grupo: "Yoko",
    titulo: "Sushero",
    area: "Cocina",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Yoko Norte",
    requisitos: ["Preparación de sushi", "Limpieza", "Orden"]
  },
  {
    id: "vac-101",
    tipoVacante: "administrativa",
    grupo: "Sistemas",
    titulo: "Auxiliar de Soporte Técnico",
    area: "Sistemas",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Corporativo",
    requisitos: ["Soporte técnico", "Redes básicas", "Atención al usuario"]
  },
  {
    id: "vac-102",
    tipoVacante: "administrativa",
    grupo: "Contabilidad",
    titulo: "Auxiliar Contable",
    area: "Contabilidad",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Corporativo",
    requisitos: ["Contabilidad básica", "Excel", "Organización"]
  },
  {
    id: "vac-103",
    tipoVacante: "administrativa",
    grupo: "Mercadotecnia",
    titulo: "Diseñador Jr",
    area: "Mercadotecnia",
    pais: "México",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Corporativo",
    requisitos: ["Diseño", "Creatividad", "Redes sociales"]
  },
  {
    id: "vac-104",
    tipoVacante: "administrativa",
    grupo: "Capital Humano",
    titulo: "Analista de Reclutamiento",
    area: "Capital Humano",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Corporativo",
    requisitos: ["Entrevistas", "Reclutamiento", "Organización"]
  },
  {
    id: "vac-105",
    tipoVacante: "administrativa",
    grupo: "Proyectos y Construcción",
    titulo: "Coordinador de Proyectos",
    area: "Proyectos y Construcción",
    pais: "Estados Unidos",
    estado: "Texas",
    ciudad: "El Paso",
    sucursal: "Corporativo",
    requisitos: ["Planeación", "Seguimiento", "Obra y construcción"]
  }
];

function obtenerGruposPorTipo(tipoVacante) {
  const grupos = [...new Set(vacantes.filter(v => v.tipoVacante === tipoVacante).map(v => v.grupo))];
  return grupos.sort();
}

function sugerirVacantesBasicas(texto = "", tipoVacante = "") {
  const lower = texto.toLowerCase();

  return vacantes
    .filter(v => !tipoVacante || v.tipoVacante === tipoVacante)
    .map(v => {
      let score = 0;
      const full = `${v.titulo} ${v.area} ${v.requisitos.join(" ")}`.toLowerCase();

      ["cliente", "caja", "cocina", "sushi", "soporte", "sistemas", "excel", "contabilidad", "mercadotecnia", "reclutamiento"].forEach(k => {
        if (lower.includes(k) && full.includes(k)) score += 20;
      });

      if (lower.includes(v.area.toLowerCase())) score += 25;
      if (lower.includes(v.titulo.toLowerCase())) score += 25;

      return { ...v, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "chatbot-reclutamiento",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/ubicaciones", (req, res) => {
  res.json(ubicaciones);
});

app.get("/api/vacantes", (req, res) => {
  const { tipoVacante, pais, estado, ciudad, grupo } = req.query;

  const resultado = vacantes.filter(v => {
    return (!tipoVacante || v.tipoVacante === tipoVacante) &&
           (!pais || v.pais === pais) &&
           (!estado || v.estado === estado) &&
           (!ciudad || v.ciudad === ciudad) &&
           (!grupo || v.grupo === grupo);
  });

  res.json(resultado);
});

app.get("/api/grupos", (req, res) => {
  const { tipoVacante } = req.query;
  if (!tipoVacante) {
    return res.status(400).json({ error: "tipoVacante es obligatorio" });
  }
  res.json(obtenerGruposPorTipo(tipoVacante));
});

app.get("/api/postulacion/:id", (req, res) => {
  const item = postulaciones.find(p => p.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Postulación no encontrada" });
  }
  res.json(item);
});

app.post(
  "/api/postulacion",
  upload.fields([
    { name: "cvFile", maxCount: 1 },
    { name: "ineFile", maxCount: 1 },
    { name: "curpFile", maxCount: 1 },
    { name: "domicilioFile", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        nombre,
        correo,
        telefono,
        edad,
        pais,
        estado,
        ciudad,
        disponibilidad,
        tipoVacante,
        grupoSeleccionado,
        vacanteSeleccionada,
        puestoInteres,
        escolaridad,
        experiencia,
        habilidades
      } = req.body;

      if (!nombre || !correo || !telefono || !pais || !estado || !ciudad || !tipoVacante || !grupoSeleccionado || !vacanteSeleccionada) {
        return res.status(400).json({ error: "Faltan campos obligatorios." });
      }

      const cvFile = req.files?.cvFile?.[0];
      if (!cvFile) {
        return res.status(400).json({ error: "Debes adjuntar tu CV en PDF." });
      }

      const vacante = vacantes.find(v => v.id === vacanteSeleccionada);
      if (!vacante) {
        return res.status(400).json({ error: "La vacante seleccionada no existe." });
      }

      let cvTexto = "";
      try {
        const pdfBuffer = fs.readFileSync(cvFile.path);
        const parsed = await pdfParse(pdfBuffer);
        cvTexto = parsed.text || "";
      } catch {
        cvTexto = "";
      }

      let resumenIA = "No fue posible analizar el CV.";
      let sugerenciasIA = sugerirVacantesBasicas(`${puestoInteres} ${experiencia} ${habilidades} ${cvTexto}`, tipoVacante);

      if (cvTexto.trim()) {
        try {
          const analisisPrompt = `
Analiza este CV para reclutamiento y devuelve JSON válido con esta estructura:
{
  "resumen": "resumen profesional breve",
  "habilidadesDetectadas": ["..."],
  "perfilRecomendado": "operativo o administrativo",
  "observaciones": "..."
}

CV:
${cvTexto.slice(0, 12000)}
`;

          const completion = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [
              { role: "system", content: "Responde solo JSON válido." },
              { role: "user", content: analisisPrompt }
            ]
          });

          const content = completion.choices?.[0]?.message?.content || "{}";
          const parsed = JSON.parse(content);

          resumenIA = parsed.resumen || resumenIA;
        } catch {
          resumenIA = "CV recibido correctamente. El análisis automático no estuvo disponible en este momento.";
        }
      }

      const documentos = [];
      ["ineFile", "curpFile", "domicilioFile"].forEach((key) => {
        const file = req.files?.[key]?.[0];
        if (file) {
          documentos.push({
            tipo: key,
            nombre: file.originalname,
            ruta: `/uploads/${file.filename}`
          });
        }
      });

      const postulacion = {
        id: Date.now().toString(),
        nombre,
        correo,
        telefono,
        edad,
        pais,
        estado,
        ciudad,
        disponibilidad,
        tipoVacante,
        grupoSeleccionado,
        vacanteId: vacante.id,
        vacanteTitulo: vacante.titulo,
        puestoInteres,
        escolaridad,
        experiencia,
        habilidades,
        cvNombre: cvFile.originalname,
        cvRuta: `/uploads/${cvFile.filename}`,
        cvTexto,
        resumenIA,
        sugerenciasIA,
        documentos,
        estadoSolicitud: "pendiente",
        fechaRegistro: new Date().toISOString()
      };

      postulaciones.push(postulacion);

      res.json({
        ok: true,
        message: "Postulación recibida correctamente.",
        postulacion
      });
    } catch (error) {
      console.error("❌ Error guardando postulación:", error);
      res.status(500).json({
        error: "No fue posible guardar la postulación."
      });
    }
  }
);

app.get("/api/postulaciones", (req, res) => {
  res.json(postulaciones);
});

app.patch("/api/postulaciones/:id/estado", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const estadosValidos = ["pendiente", "aprobado", "rechazado"];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: "Estado no válido." });
  }

  const postulacion = postulaciones.find((p) => p.id === id);

  if (!postulacion) {
    return res.status(404).json({ error: "Postulación no encontrada." });
  }

  postulacion.estadoSolicitud = estado;

  res.json({
    ok: true,
    message: "Estado actualizado correctamente.",
    postulacion
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { messages, candidateProfile } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "El campo messages debe ser un arreglo." });
    }

    const lastMessages = messages.slice(-10);

    const profileText = candidateProfile
      ? `
Perfil actual del candidato:
- Nombre: ${candidateProfile.nombre || "No proporcionado"}
- Correo: ${candidateProfile.correo || "No proporcionado"}
- Teléfono: ${candidateProfile.telefono || "No proporcionado"}
- Edad: ${candidateProfile.edad || "No proporcionado"}
- País: ${candidateProfile.pais || "No proporcionado"}
- Estado: ${candidateProfile.estado || "No proporcionado"}
- Ciudad: ${candidateProfile.ciudad || "No proporcionado"}
- Disponibilidad: ${candidateProfile.disponibilidad || "No proporcionado"}
- Tipo de vacante: ${candidateProfile.tipoVacante || "No proporcionado"}
- Grupo seleccionado: ${candidateProfile.grupoSeleccionado || "No proporcionado"}
- Vacante elegida: ${candidateProfile.vacanteTitulo || candidateProfile.puestoInteres || "No proporcionado"}
- Escolaridad: ${candidateProfile.escolaridad || "No proporcionada"}
- Experiencia: ${candidateProfile.experiencia || "No proporcionada"}
- Habilidades: ${candidateProfile.habilidades || "No proporcionadas"}
- CV: ${candidateProfile.cvNombre || "No proporcionado"}
- Resumen IA del CV: ${candidateProfile.resumenIA || "No disponible"}
`
      : "No hay perfil capturado todavía.";

    const systemPrompt = `
Eres un asistente virtual profesional del departamento de reclutamiento de GA Hospitality.

Ayudas a candidatos con:
- vacantes operativas y administrativas
- requisitos de contratación
- documentos necesarios
- orientación según su CV
- sugerencias de vacantes
- seguimiento inicial de su proceso

Responde:
- en español
- claro
- profesional
- útil
- directo

Reglas:
1. Usa el perfil y el resumen IA del CV para responder mejor.
2. Si el candidato ya eligió una vacante, enfoca tu respuesta en esa vacante.
3. Si el CV sugiere mejor ajuste a otra vacante, dilo de forma amable.
4. Si pregunta por estatus, explícale que use su folio en la sección de consulta.
5. No inventes políticas internas.
6. Si pregunta algo fuera de reclutamiento, redirígelo cortésmente.

${profileText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...lastMessages,
      ],
    });

    const reply = completion.choices?.[0]?.message;

    res.json({
      reply: {
        role: "assistant",
        content: reply?.content || "No pude generar una respuesta en este momento.",
      },
    });
  } catch (err) {
    console.error("❌ Error al generar respuesta:", err);

    if (err?.code === "insufficient_quota") {
      return res.status(200).json({
        reply: {
          role: "assistant",
          content: "⚠️ El asistente no está disponible temporalmente por límite de uso de API. Intenta nuevamente en unos minutos.",
        },
      });
    }

    res.status(500).json({
      error: "Ocurrió un error al generar la respuesta.",
      detail: err?.message || "Error desconocido",
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || "Error procesando la solicitud" });
  }
  next();
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});