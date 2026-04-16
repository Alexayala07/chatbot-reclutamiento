import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   CARPETAS Y ARCHIVOS
========================= */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const postulacionesFile = path.join(dataDir, "postulaciones.json");
if (!fs.existsSync(postulacionesFile)) {
  fs.writeFileSync(postulacionesFile, "[]", "utf-8");
}

function leerPostulaciones() {
  try {
    const raw = fs.readFileSync(postulacionesFile, "utf-8");
    return JSON.parse(raw || "[]");
  } catch (error) {
    console.error("❌ Error leyendo postulaciones.json:", error);
    return [];
  }
}

function guardarPostulaciones(data) {
  try {
    fs.writeFileSync(postulacionesFile, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("❌ Error guardando postulaciones.json:", error);
  }
}

/* =========================
   MULTER
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const name = file.originalname.toLowerCase();
  const isPdf = file.mimetype === "application/pdf" || name.endsWith(".pdf");
  const isImage =
    file.mimetype.startsWith("image/") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png");

  const isCvField = file.fieldname === "cvFile";
  const isOptionalDocField = ["ineFile", "curpFile", "domicilioFile"].includes(file.fieldname);

  if (isCvField && !isPdf) {
    return cb(new Error("El CV debe ser un archivo PDF."));
  }

  if (isOptionalDocField && !(isPdf || isImage)) {
    return cb(new Error("Los documentos opcionales deben ser PDF o imagen."));
  }

  if (!isCvField && !isOptionalDocField) {
    return cb(new Error("Tipo de archivo no permitido."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
});

/* =========================
   MIDDLEWARES
========================= */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadsDir));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   DATA EN MEMORIA + ARCHIVO
========================= */
let postulaciones = leerPostulaciones();

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
    id: "vac-004",
    tipoVacante: "operativa",
    grupo: "Great American",
    titulo: "Parrillero",
    area: "Cocina",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Central",
    requisitos: ["Manejo de parrilla", "Cocción de carnes", "Trabajo bajo presión"]
  },
  {
    id: "vac-005",
    tipoVacante: "operativa",
    grupo: "Ardeo",
    titulo: "Chef de Línea",
    area: "Cocina",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Ardeo Central",
    requisitos: ["Cocina gourmet", "Organización", "Trabajo en equipo"]
  },
  {
    id: "vac-006",
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
    id: "vac-007",
    tipoVacante: "operativa",
    grupo: "Wendy's",
    titulo: "Cajero",
    area: "Operaciones",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Sucursal Chihuahua",
    requisitos: ["Atención al cliente", "Caja", "Disponibilidad"]
  },
  {
    id: "vac-008",
    tipoVacante: "operativa",
    grupo: "Little Caesars",
    titulo: "Auxiliar de Cocina",
    area: "Cocina",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Sucursal Chihuahua",
    requisitos: ["Preparación de alimentos", "Limpieza", "Trabajo bajo presión"]
  },
  {
    id: "vac-009",
    tipoVacante: "operativa",
    grupo: "Great American",
    titulo: "Mesero",
    area: "Piso",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Sucursal Chihuahua",
    requisitos: ["Servicio al cliente", "Presentación", "Trabajo en equipo"]
  },
  {
    id: "vac-010",
    tipoVacante: "operativa",
    grupo: "Little Caesars",
    titulo: "Cajero",
    area: "Mostrador",
    pais: "México",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Sucursal Guadalajara",
    requisitos: ["Atención al cliente", "Caja", "Disponibilidad"]
  },
  {
    id: "vac-011",
    tipoVacante: "operativa",
    grupo: "Applebee's",
    titulo: "Mesero",
    area: "Piso",
    pais: "México",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Sucursal Guadalajara",
    requisitos: ["Servicio al cliente", "Trabajo en equipo", "Disponibilidad"]
  },
  {
    id: "vac-012",
    tipoVacante: "operativa",
    grupo: "Wendy's",
    titulo: "Próximamente",
    area: "Operaciones",
    pais: "México",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Próxima apertura",
    requisitos: ["Vacante próxima a apertura"]
  },
  {
    id: "vac-013",
    tipoVacante: "operativa",
    grupo: "Little Caesars",
    titulo: "Auxiliar de Cocina",
    area: "Cocina",
    pais: "México",
    estado: "Baja California",
    ciudad: "Mexicali",
    sucursal: "Sucursal Mexicali",
    requisitos: ["Preparación de alimentos", "Limpieza", "Trabajo bajo presión"]
  },
  {
    id: "vac-101",
    tipoVacante: "administrativa",
    grupo: "RH",
    titulo: "Auxiliar de Reclutamiento",
    area: "RH",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Corporativo",
    requisitos: ["Entrevistas", "Seguimiento", "Organización"]
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
    id: "vac-105",
    tipoVacante: "administrativa",
    grupo: "Monitoreo",
    titulo: "Analista de Monitoreo",
    area: "Monitoreo",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Corporativo",
    requisitos: ["Monitoreo", "Atención al detalle", "Reportes"]
  },
  {
    id: "vac-106",
    tipoVacante: "administrativa",
    grupo: "Proyectos y Construcción",
    titulo: "Coordinador de Proyectos",
    area: "Proyectos y Construcción",
    pais: "Estados Unidos",
    estado: "Texas",
    ciudad: "El Paso",
    sucursal: "Corporativo",
    requisitos: ["Planeación", "Seguimiento", "Construcción"]
  },
  {
    id: "vac-107",
    tipoVacante: "administrativa",
    grupo: "Capital Humano",
    titulo: "Generalista de Capital Humano",
    area: "Capital Humano",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Corporativo",
    requisitos: ["RH", "Administración de personal", "Comunicación"]
  }
];

/* =========================
   HELPERS
========================= */
function obtenerGruposPorTipo(tipoVacante) {
  const grupos = [...new Set(vacantes.filter((v) => v.tipoVacante === tipoVacante).map((v) => v.grupo))];
  return grupos.sort();
}

function sugerirVacantesBasicas(texto = "", tipoVacante = "") {
  const lower = String(texto).toLowerCase();

  return vacantes
    .filter((v) => !tipoVacante || v.tipoVacante === tipoVacante)
    .map((v) => {
      let score = 0;
      const full = `${v.titulo} ${v.area} ${v.requisitos.join(" ")}`.toLowerCase();

      ["cliente", "caja", "cocina", "sushi", "soporte", "sistemas", "excel", "contabilidad", "mercadotecnia", "reclutamiento"].forEach((k) => {
        if (lower.includes(k) && full.includes(k)) score += 20;
      });

      if (lower.includes(v.area.toLowerCase())) score += 25;
      if (lower.includes(v.titulo.toLowerCase())) score += 25;

      return { ...v, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function limpiarJsonRespuesta(texto = "") {
  return texto
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function normalizarTexto(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\b(cd|cd\.|ciudad)\b/g, "ciudad")
    .replace(/\s+/g, " ")
    .trim();
}

function resolverPais(valor = "") {
  const t = normalizarTexto(valor);

  const aliases = {
    "México": ["mexico", "méxico", "mx"],
    "Estados Unidos": ["estados unidos", "usa", "us", "eeuu", "eua", "united states"]
  };

  for (const [oficial, lista] of Object.entries(aliases)) {
    if (lista.some((alias) => t === normalizarTexto(alias) || t.includes(normalizarTexto(alias)))) {
      return oficial;
    }
  }

  return valor;
}

function resolverEstado(valor = "") {
  const t = normalizarTexto(valor);

  const aliases = {
    "Chihuahua": ["chihuahua", "chih"],
    "Baja California": ["baja california", "baja", "bc"],
    "Jalisco": ["jalisco", "gdl"],
    "Texas": ["texas", "tx"]
  };

  for (const [oficial, lista] of Object.entries(aliases)) {
    if (lista.some((alias) => t === normalizarTexto(alias) || t.includes(normalizarTexto(alias)))) {
      return oficial;
    }
  }

  return valor;
}

function resolverCiudad(valor = "") {
  const t = normalizarTexto(valor);

  const aliases = {
    "Ciudad Juárez": ["juarez", "ciudad juarez", "cd juarez", "cd. juarez", "jrz"],
    "Chihuahua": ["chihuahua", "ciudad chihuahua", "cd chihuahua"],
    "Guadalajara": ["guadalajara", "gdl"],
    "Mexicali": ["mexicali"],
    "El Paso": ["el paso", "elpaso", "paso"]
  };

  for (const [oficial, lista] of Object.entries(aliases)) {
    if (lista.some((alias) => t === normalizarTexto(alias) || t.includes(normalizarTexto(alias)))) {
      return oficial;
    }
  }

  return valor;
}

function resolverGrupo(valor = "") {
  const t = normalizarTexto(valor);

  const aliases = {
    "Wendy's": ["wendys", "wendy", "wendy's"],
    "Applebee's": ["applebees", "applebee", "applebee's"],
    "Great American": ["great american", "great american steakhouse", "great"],
    "Ardeo": ["ardeo"],
    "Yoko": ["yoko"],
    "Little Caesars": ["little caesars", "little", "caesars", "little caesar"],
    "RH": ["rh", "recursos humanos", "reclutamiento"],
    "Contabilidad": ["contabilidad", "contable"],
    "Mercadotecnia": ["mercadotecnia", "marketing", "mkt"],
    "Sistemas": ["sistemas", "soporte", "soporte tecnico", "it"],
    "Monitoreo": ["monitoreo", "monitorista"],
    "Proyectos y Construcción": ["proyectos y construccion", "proyectos", "construccion"],
    "Capital Humano": ["capital humano", "capital", "talento humano"]
  };

  for (const [oficial, lista] of Object.entries(aliases)) {
    if (lista.some((alias) => t === normalizarTexto(alias) || t.includes(normalizarTexto(alias)))) {
      return oficial;
    }
  }

  return valor;
}

/* =========================
   RUTAS
========================= */
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
  const tipoVacante = req.query.tipoVacante ? normalizarTexto(req.query.tipoVacante) : "";
  const pais = req.query.pais ? normalizarTexto(resolverPais(req.query.pais)) : "";
  const estado = req.query.estado ? normalizarTexto(resolverEstado(req.query.estado)) : "";
  const ciudad = req.query.ciudad ? normalizarTexto(resolverCiudad(req.query.ciudad)) : "";
  const grupo = req.query.grupo ? normalizarTexto(resolverGrupo(req.query.grupo)) : "";

  const resultado = vacantes.filter((v) => {
    const vTipo = normalizarTexto(v.tipoVacante);
    const vPais = normalizarTexto(v.pais);
    const vEstado = normalizarTexto(v.estado);
    const vCiudad = normalizarTexto(v.ciudad);
    const vGrupo = normalizarTexto(v.grupo);

    const coincideTipo = !tipoVacante || vTipo === tipoVacante;
    const coincidePais = !pais || vPais.includes(pais) || pais.includes(vPais);
    const coincideEstado = !estado || vEstado.includes(estado) || estado.includes(vEstado);
    const coincideCiudad = !ciudad || vCiudad.includes(ciudad) || ciudad.includes(vCiudad);
    const coincideGrupo = !grupo || vGrupo.includes(grupo) || grupo.includes(vGrupo);

    return coincideTipo && coincidePais && coincideEstado && coincideCiudad && coincideGrupo;
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
  const item = postulaciones.find((p) => p.id === req.params.id);
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

      const vacante = vacantes.find((v) => v.id === vacanteSeleccionada);
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
      const sugerenciasIA = sugerirVacantesBasicas(
        `${puestoInteres} ${experiencia} ${habilidades} ${cvTexto}`,
        tipoVacante
      );

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
          const parsed = JSON.parse(limpiarJsonRespuesta(content));
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
      guardarPostulaciones(postulaciones);

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
  postulaciones = leerPostulaciones();
  res.json(postulaciones);
});

app.patch("/api/postulaciones/:id/estado", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const estadosValidos = ["pendiente", "aprobado", "rechazado"];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: "Estado no válido." });
  }

  postulaciones = leerPostulaciones();

  const postulacion = postulaciones.find((p) => p.id === id);

  if (!postulacion) {
    return res.status(404).json({ error: "Postulación no encontrada." });
  }

  postulacion.estadoSolicitud = estado;
  guardarPostulaciones(postulaciones);

  res.json({
    ok: true,
    message: "Estado actualizado correctamente.",
    postulacion
  });
});

/* =========================
   CRUD VACANTES
========================= */
app.post("/api/vacantes", (req, res) => {
  const {
    tipoVacante,
    grupo,
    titulo,
    area,
    pais,
    estado,
    ciudad,
    sucursal,
    requisitos
  } = req.body;

  if (
    !tipoVacante ||
    !grupo ||
    !titulo ||
    !area ||
    !pais ||
    !estado ||
    !ciudad ||
    !sucursal ||
    !Array.isArray(requisitos) ||
    !requisitos.length
  ) {
    return res.status(400).json({ error: "Faltan campos obligatorios para la vacante." });
  }

  const nuevaVacante = {
    id: `vac-${Date.now()}`,
    tipoVacante,
    grupo,
    titulo,
    area,
    pais,
    estado,
    ciudad,
    sucursal,
    requisitos
  };

  vacantes.push(nuevaVacante);

  res.json({
    ok: true,
    message: "Vacante creada correctamente.",
    vacante: nuevaVacante
  });
});

app.put("/api/vacantes/:id", (req, res) => {
  const { id } = req.params;
  const index = vacantes.findIndex((v) => v.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Vacante no encontrada." });
  }

  const {
    tipoVacante,
    grupo,
    titulo,
    area,
    pais,
    estado,
    ciudad,
    sucursal,
    requisitos
  } = req.body;

  if (
    !tipoVacante ||
    !grupo ||
    !titulo ||
    !area ||
    !pais ||
    !estado ||
    !ciudad ||
    !sucursal ||
    !Array.isArray(requisitos) ||
    !requisitos.length
  ) {
    return res.status(400).json({ error: "Faltan campos obligatorios para actualizar la vacante." });
  }

  vacantes[index] = {
    ...vacantes[index],
    tipoVacante,
    grupo,
    titulo,
    area,
    pais,
    estado,
    ciudad,
    sucursal,
    requisitos
  };

  res.json({
    ok: true,
    message: "Vacante actualizada correctamente.",
    vacante: vacantes[index]
  });
});

app.delete("/api/vacantes/:id", (req, res) => {
  const { id } = req.params;
  const index = vacantes.findIndex((v) => v.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Vacante no encontrada." });
  }

  const eliminada = vacantes.splice(index, 1)[0];

  res.json({
    ok: true,
    message: "Vacante eliminada correctamente.",
    vacante: eliminada
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