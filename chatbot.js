const API_URL = window.location.origin;

const toggle = document.getElementById("chatbot-toggle");
const closeBtn = document.getElementById("chatbot-close");
const box = document.getElementById("chatbot-box");
const messagesDiv = document.getElementById("chatbot-messages");
const form = document.getElementById("chatbot-form");
const input = document.getElementById("chatbot-input");

const candidateForm = document.getElementById("candidate-form");
const profileStatus = document.getElementById("profile-status");
const franquiciasList = document.getElementById("franquicias-list");
const vacantesList = document.getElementById("vacantes-list");
const ofertasSubtitulo = document.getElementById("ofertas-subtitulo");

let franquiciasData = [];
let candidateProfile = {
  nombre: "",
  ciudad: "",
  puestoInteres: "",
  escolaridad: "",
  experiencia: "",
  habilidades: ""
};

const chatHistory = [
  {
    role: "assistant",
    content: "Hola 👋 Soy el asistente de reclutamiento. Puedo ayudarte con vacantes, documentos y orientación según tu perfil."
  }
];

function renderMessages() {
  if (!messagesDiv) return;

  messagesDiv.innerHTML = "";

  chatHistory.forEach((m) => {
    const el = document.createElement("div");
    el.className = `msg ${m.role}`;
    el.textContent = m.content;
    messagesDiv.appendChild(el);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function openChat() {
  if (!box) return;
  box.classList.remove("hidden");
  if (input) input.focus();
}

function closeChat() {
  if (!box) return;
  box.classList.add("hidden");
}

async function sendMessageToBot(userText) {
  chatHistory.push({ role: "user", content: userText });
  renderMessages();

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: chatHistory,
        candidateProfile
      })
    });

    const data = await response.json();

    if (data.reply) {
      chatHistory.push(data.reply);
    } else {
      chatHistory.push({
        role: "assistant",
        content: "⚠️ No pude responder en este momento."
      });
    }
  } catch (error) {
    console.error("Error enviando mensaje al chatbot:", error);
    chatHistory.push({
      role: "assistant",
      content: "⚠️ Error de conexión con el servidor."
    });
  }

  renderMessages();
}

if (toggle) {
  toggle.addEventListener("click", openChat);
}

if (closeBtn) {
  closeBtn.addEventListener("click", closeChat);
}

if (candidateForm) {
  candidateForm.addEventListener("submit", (e) => {
    e.preventDefault();

    candidateProfile = {
      nombre: document.getElementById("nombre")?.value.trim() || "",
      ciudad: document.getElementById("ciudad")?.value.trim() || "",
      puestoInteres: document.getElementById("puestoInteres")?.value.trim() || "",
      escolaridad: document.getElementById("escolaridad")?.value.trim() || "",
      experiencia: document.getElementById("experiencia")?.value.trim() || "",
      habilidades: document.getElementById("habilidades")?.value.trim() || ""
    };

    if (profileStatus) {
      profileStatus.classList.remove("hidden");
      profileStatus.textContent =
        "✅ Perfil guardado correctamente. Ya puedes revisar vacantes y pedir recomendaciones en el chat.";
    }
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    input.focus();

    await sendMessageToBot(text);
  });
}

async function cargarFranquicias() {
  if (!franquiciasList) return;

  try {
    const res = await fetch(`${API_URL}/api/franquicias`);

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    franquiciasData = await res.json();
    franquiciasList.innerHTML = "";

    if (!Array.isArray(franquiciasData) || franquiciasData.length === 0) {
      franquiciasList.innerHTML = `
        <div class="status">
          No hay franquicias disponibles en este momento.
        </div>
      `;
      return;
    }

    franquiciasData.forEach((franquicia) => {
      const card = document.createElement("article");
      card.className = "franquicia-card";

      card.innerHTML = `
        <img src="${franquicia.imagen}" alt="${franquicia.nombre}" class="franquicia-img">
        <div class="franquicia-body">
          <span class="franquicia-cat">${franquicia.categoria}</span>
          <h3>${franquicia.nombre}</h3>
          <p>${franquicia.descripcion}</p>
          <button class="btn btn--primary ver-ofertas-btn" data-id="${franquicia.id}">
            Ver ofertas laborales
          </button>
        </div>
      `;

      franquiciasList.appendChild(card);
    });

    document.querySelectorAll(".ver-ofertas-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        mostrarVacantes(id);

        const ofertasSection = document.getElementById("ofertas");
        if (ofertasSection) {
          ofertasSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  } catch (error) {
    console.error("Error cargando franquicias:", error);

    franquiciasList.innerHTML = `
      <div class="status">
        No fue posible cargar las franquicias en este momento.
      </div>
    `;
  }
}

function mostrarVacantes(franquiciaId) {
  if (!vacantesList || !ofertasSubtitulo) return;

  const franquicia = franquiciasData.find((f) => f.id === franquiciaId);
  if (!franquicia) return;

  ofertasSubtitulo.textContent = `Vacantes disponibles en ${franquicia.nombre}`;
  vacantesList.innerHTML = "";

  if (!Array.isArray(franquicia.vacantes) || franquicia.vacantes.length === 0) {
    vacantesList.innerHTML = `
      <div class="status">
        No hay vacantes disponibles para ${franquicia.nombre} en este momento.
      </div>
    `;
    return;
  }

  franquicia.vacantes.forEach((vacante) => {
    const card = document.createElement("article");
    card.className = "vacante-card";

    card.innerHTML = `
      <h3>${vacante.titulo}</h3>
      <p><strong>Área:</strong> ${vacante.area}</p>
      <p><strong>Sucursal:</strong> ${vacante.sucursal}</p>
      <div class="tags">
        ${vacante.requisitos.map((req) => `<span>${req}</span>`).join("")}
      </div>
      <button class="btn btn--secondary interes-btn"
        data-franquicia="${franquicia.nombre}"
        data-vacante="${vacante.titulo}">
        Me interesa
      </button>
    `;

    vacantesList.appendChild(card);
  });

  document.querySelectorAll(".interes-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const franquiciaNombre = btn.dataset.franquicia;
      const vacanteNombre = btn.dataset.vacante;

      openChat();

      const mensaje = `Me interesa la vacante de ${vacanteNombre} en ${franquiciaNombre}. ¿Qué requisitos necesito y qué tan bien encajo con mi perfil?`;

      if (input) {
        input.value = "";
      }

      await sendMessageToBot(mensaje);
    });
  });
}

renderMessages();
cargarFranquicias();