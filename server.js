import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// carpeta uploads
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// configuración multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return cb(new Error("Solo se permiten archivos PDF."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

// CORS manual
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadsDir));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// memoria temporal de postulaciones
const postulaciones = [];

// Ruta de prueba
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "chatbot-reclutamiento",
    timestamp: new Date().toISOString(),
  });
});

// Endpoint de franquicias
app.get("/api/franquicias", (req, res) => {
  const franquicias = [
    {
      id: "Wendys",
      nombre: "Wendy's",
      categoria: "Cadena restaurantera",
      imagen: "/img/wendys.png",
      descripcion: "Restaurante de comida rápida enfocado en hamburguesas, atención al cliente y operación ágil.",
      vacantes: [
        {
          id: 101,
          titulo: "Cajero",
          area: "Operaciones",
          sucursal: "Juárez - Las Misiones",
          requisitos: ["Atención al cliente", "Manejo básico de caja", "Disponibilidad de horario"]
        },
        {
          id: 102,
          titulo: "Despachador",
          area: "Servicio",
          sucursal: "Juárez - Ejército Nacional",
          requisitos: ["Rapidez", "Orden", "Trabajo en equipo"]
        }
      ]
    },
    {
      id: "little-caesars",
      nombre: "Little Caesars",
      categoria: "Cadena restaurantera",
      imagen: "/img/littlecaesars.jpg",
      descripcion: "Pizzería enfocada en producción rápida, atención al cliente y trabajo operativo.",
      vacantes: [
        {
          id: 201,
          titulo: "Auxiliar de Cocina",
          area: "Cocina",
          sucursal: "Juárez - Sendero",
          requisitos: ["Preparación de alimentos", "Limpieza", "Trabajo bajo presión"]
        },
        {
          id: 202,
          titulo: "Cajero",
          area: "Mostrador",
          sucursal: "Juárez - Tecnológico",
          requisitos: ["Atención al cliente", "Caja", "Disponibilidad"]
        }
      ]
    },
    {
      id: "Applebees",
      nombre: "Applebee's",
      categoria: "Franquicia",
      imagen: "/img/Applebees.png",
      descripcion: "Restaurante casual dining con vacantes enfocadas en piso, cocina y hospitalidad.",
      vacantes: [
        {
          id: 301,
          titulo: "Hostess",
          area: "Recepción",
          sucursal: "Juárez - Tecnológico",
          requisitos: ["Excelente trato al cliente", "Presentación", "Comunicación"]
        },
        {
          id: 302,
          titulo: "Mesero",
          area: "Piso",
          sucursal: "Juárez - Consulado",
          requisitos: ["Servicio al cliente", "Trabajo en equipo", "Disponibilidad"]
        }
      ]
    },
    {
      id: "Great-American",
      nombre: "Great American Steakhouse",
      categoria: "Restaurante propio",
      imagen: "/img/greatamerican.png",
      descripcion: "Concepto steakhouse con enfoque en cocina, servicio premium y experiencia del cliente.",
      vacantes: [
        {
          id: 401,
          titulo: "Parrillero",
          area: "Cocina",
          sucursal: "Juárez - Main Branch",
          requisitos: ["Manejo de parrilla", "Cocción de carnes", "Trabajo bajo presión"]
        },
        {
          id: 402,
          titulo: "Capitán de Meseros",
          area: "Piso",
          sucursal: "Juárez - Central",
          requisitos: ["Liderazgo", "Servicio premium", "Experiencia en restaurante"]
        }
      ]
    },
    {
      id: "Ardeo",
      nombre: "Ardeo",
      categoria: "Restaurante propio gourmet",
      imagen: "/img/ardeo.png",
      descripcion: "Concepto gourmet con enfoque en experiencia, servicio y cocina especializada.",
      vacantes: [
        {
          id: 501,
          titulo: "Chef de Línea",
          area: "Cocina",
          sucursal: "Juárez - Ardeo Central",
          requisitos: ["Cocina gourmet", "Organización", "Trabajo en equipo"]
        },
        {
          id: 502,
          titulo: "Hostess",
          area: "Recepción",
          sucursal: "Juárez - Ardeo Norte",
          requisitos: ["Excelente imagen", "Trato al cliente", "Comunicación"]
        }
      ]
    },
    {
      id: "Yoko",
      nombre: "Yoko",
      categoria: "Restaurante propio japonés",
      imagen: "/img/yoko.png",
      descripcion: "Restaurante de comida japonesa con especialidad en sushi, ramen y cocina oriental.",
      vacantes: [
        {
          id: 601,
          titulo: "Sushero",
          area: "Cocina",
          sucursal: "Juárez - Yoko Norte",
          requisitos: ["Preparación de sushi", "Limpieza", "Orden"]
        },
        {
          id: 602,
          titulo: "Mesero",
          area: "Piso",
          sucursal: "Juárez - Yoko Plaza",
          requisitos: ["Atención al cliente", "Presentación", "Disponibilidad"]
        }
      ]
    }
  ];

  res.json(franquicias);
});

// NUEVO: guardar postulación con PDF
app.post("/api/postulacion", upload.single("cvFile"), (req, res) => {
  try {
    const {
      nombre,
      ciudad,
      puestoInteres,
      escolaridad,
      experiencia,
      habilidades
    } = req.body;

    if (!nombre || !ciudad || !puestoInteres) {
      return res.status(400).json({
        error: "Faltan campos obligatorios."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Debes adjuntar tu CV en PDF."
      });
    }

    const postulacion = {
      id: Date.now().toString(),
      nombre,
      ciudad,
      puestoInteres,
      escolaridad,
      experiencia,
      habilidades,
      cvNombre: req.file.originalname,
      cvRuta: `/uploads/${req.file.filename}`,
      estado: "pendiente",
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
});

// NUEVO: listado simple para futuro dashboard
app.get("/api/postulaciones", (req, res) => {
  res.json(postulaciones);
});

// Endpoint del chatbot
app.post("/chat", async (req, res) => {
  try {
    const { messages, candidateProfile } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "El campo messages debe ser un arreglo."
      });
    }

    const lastMessages = messages.slice(-10);

    const profileText = candidateProfile
      ? `
Perfil actual del candidato:
- Nombre: ${candidateProfile.nombre || "No proporcionado"}
- Puesto de interés: ${candidateProfile.puestoInteres || "No proporcionado"}
- Experiencia: ${candidateProfile.experiencia || "No proporcionada"}
- Escolaridad: ${candidateProfile.escolaridad || "No proporcionada"}
- Habilidades: ${candidateProfile.habilidades || "No proporcionadas"}
- Ciudad: ${candidateProfile.ciudad || "No proporcionada"}
`
      : "No hay perfil capturado todavía.";

    const systemPrompt = `
Eres un asistente virtual profesional del departamento de reclutamiento.

Tu función es ayudar a candidatos con:
- vacantes disponibles
- requisitos de contratación
- documentos necesarios
- proceso de reclutamiento
- orientación inicial según su perfil
- sugerencias de vacantes según experiencia

Debes responder:
- en español
- claro
- profesional
- útil
- breve pero con valor

Reglas:
1. Si el candidato pregunta por vacantes, oriéntalo con base en su perfil si existe.
2. Si pregunta por documentos, menciona normalmente: INE, CURP, comprobante de domicilio, NSS y CV, aclarando que puede variar según la vacante.
3. Si no tienes datos suficientes, pide al candidato su experiencia, puesto deseado o ciudad.
4. Si el usuario menciona una franquicia como Wendy's, Little Caesars, Applebee's, Great American Steakhouse, Ardeo o Yoko, responde de forma relacionada con esa marca.
5. No inventes procesos internos complejos.
6. No respondas temas fuera de reclutamiento; redirígelo amablemente.
7. Si el perfil parece encajar con una vacante operativa, sugiérela con tono positivo.

${profileText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
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

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// manejo de error multer / PDF
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      error: err.message || "Error procesando la solicitud"
    });
  }

  next();
});

app.patch("/api/postulaciones/:id/estado", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ["pendiente", "aprobado", "rechazado"];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({
      error: "Estado no válido."
    });
  }

  const postulacion = postulaciones.find((p) => p.id === id);

  if (!postulacion) {
    return res.status(404).json({
      error: "Postulación no encontrada."
    });
  }

  postulacion.estado = estado;

  res.json({
    ok: true,
    message: "Estado actualizado correctamente.",
    postulacion
  });
});
// Fallback para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada"
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});