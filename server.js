import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
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
          - dudas sobre entrevistas
          - proceso de ingreso
          - uso de la app para escanear documentos

          Responde de forma clara, profesional y breve.

          Si te preguntan algo fuera de reclutamiento, responde:
          "Solo puedo ayudarte con temas de reclutamiento y documentación."
          `,

        },
        ...messages,
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
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});
