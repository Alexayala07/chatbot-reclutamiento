const API_URL = "https://chatbot-reclutamiento-cl32.onrender.com";

const postulacionesList = document.getElementById("postulacionesList");
const dashboardStatus = document.getElementById("dashboardStatus");
const refreshBtn = document.getElementById("refreshBtn");

const statTotal = document.getElementById("statTotal");
const statPendiente = document.getElementById("statPendiente");
const statAprobado = document.getElementById("statAprobado");
const statRechazado = document.getElementById("statRechazado");

const modal = document.getElementById("candidateModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const closeModalBackdrop = document.getElementById("closeModalBackdrop");

const modalNombre = document.getElementById("modalNombre");
const modalEstado = document.getElementById("modalEstado");
const modalCiudad = document.getElementById("modalCiudad");
const modalPuesto = document.getElementById("modalPuesto");
const modalEscolaridad = document.getElementById("modalEscolaridad");
const modalFecha = document.getElementById("modalFecha");
const modalExperiencia = document.getElementById("modalExperiencia");
const modalHabilidades = document.getElementById("modalHabilidades");
const modalCvLink = document.getElementById("modalCvLink");

const approveBtn = document.getElementById("approveBtn");
const rejectBtn = document.getElementById("rejectBtn");

let postulaciones = [];
let selectedCandidate = null;

function setStatus(message, show = true) {
  if (!dashboardStatus) return;
  dashboardStatus.textContent = message;
  dashboardStatus.classList.toggle("hidden", !show);
}

function formatFecha(fechaIso) {
  if (!fechaIso) return "-";
  const date = new Date(fechaIso);
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function updateStats() {
  const total = postulaciones.length;
  const pendientes = postulaciones.filter(p => p.estado === "pendiente").length;
  const aprobados = postulaciones.filter(p => p.estado === "aprobado").length;
  const rechazados = postulaciones.filter(p => p.estado === "rechazado").length;

  statTotal.textContent = total;
  statPendiente.textContent = pendientes;
  statAprobado.textContent = aprobados;
  statRechazado.textContent = rechazados;
}

function getEstadoClass(estado) {
  if (estado === "aprobado") return "estado estado--aprobado";
  if (estado === "rechazado") return "estado estado--rechazado";
  return "estado estado--pendiente";
}

function renderPostulaciones() {
  if (!postulacionesList) return;

  postulacionesList.innerHTML = "";

  if (!postulaciones.length) {
    postulacionesList.innerHTML = `
      <div class="status">
        No hay postulaciones registradas todavía.
      </div>
    `;
    updateStats();
    return;
  }

  postulaciones.forEach((postulacion) => {
    const card = document.createElement("article");
    card.className = "dashboard-card";

    card.innerHTML = `
      <div class="dashboard-card__top">
        <div>
          <h3>${postulacion.nombre || "Sin nombre"}</h3>
          <p>${postulacion.puestoInteres || "Sin puesto de interés"}</p>
        </div>
        <span class="${getEstadoClass(postulacion.estado)}">
          ${postulacion.estado || "pendiente"}
        </span>
      </div>

      <div class="dashboard-card__info">
        <p><strong>Ciudad:</strong> ${postulacion.ciudad || "-"}</p>
        <p><strong>Escolaridad:</strong> ${postulacion.escolaridad || "-"}</p>
        <p><strong>CV:</strong> ${postulacion.cvNombre || "No disponible"}</p>
      </div>

      <div class="dashboard-card__actions">
        <button class="btn btn--secondary view-btn" data-id="${postulacion.id}">
          Ver datos
        </button>
      </div>
    `;

    postulacionesList.appendChild(card);
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const candidate = postulaciones.find((p) => p.id === id);
      if (candidate) openModal(candidate);
    });
  });

  updateStats();
}

function openModal(candidate) {
  selectedCandidate = candidate;

  modalNombre.textContent = candidate.nombre || "Sin nombre";
  modalEstado.textContent = `Estado: ${candidate.estado || "pendiente"}`;
  modalCiudad.textContent = candidate.ciudad || "-";
  modalPuesto.textContent = candidate.puestoInteres || "-";
  modalEscolaridad.textContent = candidate.escolaridad || "-";
  modalFecha.textContent = formatFecha(candidate.fechaRegistro);
  modalExperiencia.textContent = candidate.experiencia || "No proporcionada";
  modalHabilidades.textContent = candidate.habilidades || "No proporcionadas";
  modalCvLink.href = candidate.cvRuta ? `${API_URL}${candidate.cvRuta}` : "#";

  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  selectedCandidate = null;
}

async function cargarPostulaciones() {
  try {
    setStatus("Cargando postulaciones...");

    const res = await fetch(`${API_URL}/api/postulaciones`);
    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }

    postulaciones = await res.json();
    renderPostulaciones();

    setStatus("", false);
  } catch (error) {
    console.error("Error cargando postulaciones:", error);
    setStatus("⚠️ No fue posible cargar las postulaciones.");
  }
}

async function actualizarEstado(nuevoEstado) {
  if (!selectedCandidate?.id) return;

  try {
    const res = await fetch(`${API_URL}/api/postulaciones/${selectedCandidate.id}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "No fue posible actualizar el estado.");
    }

    await cargarPostulaciones();
    closeModal();
    setStatus(`✅ Solicitud marcada como ${nuevoEstado}.`);
  } catch (error) {
    console.error("Error actualizando estado:", error);
    setStatus(`⚠️ ${error.message}`);
  }
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", cargarPostulaciones);
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}

if (closeModalBackdrop) {
  closeModalBackdrop.addEventListener("click", closeModal);
}

if (approveBtn) {
  approveBtn.addEventListener("click", () => actualizarEstado("aprobado"));
}

if (rejectBtn) {
  rejectBtn.addEventListener("click", () => actualizarEstado("rechazado"));
}

cargarPostulaciones();