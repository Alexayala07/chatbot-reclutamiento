import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
// 🔥 CORS PRIMERO DE TODO
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// 🔥 PREFLIGHT
app.options("*", (req, res) => {
  res.sendStatus(200);
});

app.use(express.json());

// ⚙️ esto es para poder usar __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 servir archivos estáticos (tu index.html)
app.use(express.static(__dirname)); // sirve lo que haya en la carpeta actual

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


app.post("/chat", async (req, res) => {
  const { messages } = req.body;
  const lastMessages = messages.slice(-10);

  try {
    const completion = await openai.chat.completions.create({
  model: "gpt-5-mini",
  messages: [
    {
      role: "system",
      content: `
      Eres un asistente virtual del departamento de reclutamiento.

      Ayudas a candidatos con:
      - requisitos para contratación
      - documentos necesarios (INE, CURP, comprobante de domicilio)
      - proceso de ingreso
      - dudas sobre entrevistas

      Responde claro, profesional y breve.

      Si preguntan algo fuera de reclutamiento, responde:
      "Solo puedo ayudarte con temas de reclutamiento."
      `,
    },
    ...lastMessages,
  ],
});


    res.json({ reply: completion.choices[0].message });
  } catch (err) {
    console.error("❌ Error al generar respuesta:", err);
    res.status(500).json({ error: err.message });

  }
});

// 👇 si alguien pide / que le dé el index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

