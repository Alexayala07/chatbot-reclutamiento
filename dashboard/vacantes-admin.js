const API_URL = "https://chatbot-reclutamiento-cl32.onrender.com";

const vacantesAdminList = document.getElementById("vacantesAdminList");
const vacantesAdminStatus = document.getElementById("vacantesAdminStatus");
const refreshVacantesBtn = document.getElementById("refreshVacantesBtn");
const openVacanteModalBtn = document.getElementById("openVacanteModalBtn");

const adminFiltroTipo = document.getElementById("adminFiltroTipo");
const adminFiltroPais = document.getElementById("adminFiltroPais");
const adminFiltroEstado = document.getElementById("adminFiltroEstado");
const adminFiltroCiudad = document.getElementById("adminFiltroCiudad");

const vacanteModal = document.getElementById("vacanteModal");
const closeVacanteModalBtn = document.getElementById("closeVacanteModalBtn");
const closeVacanteBackdrop = document.getElementById("closeVacanteBackdrop");
const vacanteModalTitle = document.getElementById("vacanteModalTitle");
const saveVacanteBtn = document.getElementById("saveVacanteBtn");

const vacanteIdEdit = document.getElementById("vacanteIdEdit");
const vacanteTipo = document.getElementById("vacanteTipo");
const vacanteGrupo = document.getElementById("vacanteGrupo");
const vacanteTituloInput = document.getElementById("vacanteTituloInput");
const vacanteArea = document.getElementById("vacanteArea");
const vacantePais = document.getElementById("vacantePais");
const vacanteEstado = document.getElementById("vacanteEstado");
const vacanteCiudad = document.getElementById("vacanteCiudad");
const vacanteSucursal = document.getElementById("vacanteSucursal");
const vacanteRequisitos = document.getElementById("vacanteRequisitos");

let vacantes = [];
let ubicaciones = {};

function setVacantesStatus(message, show = true) {
  if (!vacantesAdminStatus) return;
  vacantesAdminStatus.textContent = message;
  vacantesAdminStatus.classList.toggle("hidden", !show);
}

async function cargarUbicaciones() {
  try {
    const res = await fetch(`${API_URL}/api/ubicaciones`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    ubicaciones = await res.json();
  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
    ubicaciones = {};
  }
}

function llenarEstados(selectPais, targetEstado, targetCiudad) {
  const pais = selectPais.value;
  targetEstado.innerHTML = `<option value="">Todos</option>`;
  targetCiudad.innerHTML = `<option value="">Todas</option>`;

  if (!pais || !ubicaciones[pais]) return;

  Object.keys(ubicaciones[pais]).forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    targetEstado.appendChild(option);
  });
}

function llenarCiudades(selectPais, selectEstado, targetCiudad) {
  const pais = selectPais.value;
  const estado = selectEstado.value;

  targetCiudad.innerHTML = `<option value="">Todas</option>`;

  if (!pais || !estado || !ubicaciones[pais]?.[estado]) return;

  ubicaciones[pais][estado].forEach((ciudad) => {
    const option = document.createElement("option");
    option.value = ciudad;
    option.textContent = ciudad;
    targetCiudad.appendChild(option);
  });
}

function llenarEstadosModal() {
  const pais = vacantePais.value;
  vacanteEstado.innerHTML = `<option value="">Selecciona</option>`;
  vacanteCiudad.innerHTML = `<option value="">Selecciona</option>`;

  if (!pais || !ubicaciones[pais]) return;

  Object.keys(ubicaciones[pais]).forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    vacanteEstado.appendChild(option);
  });
}

function llenarCiudadesModal() {
  const pais = vacantePais.value;
  const estado = vacanteEstado.value;

  vacanteCiudad.innerHTML = `<option value="">Selecciona</option>`;

  if (!pais || !estado || !ubicaciones[pais]?.[estado]) return;

  ubicaciones[pais][estado].forEach((ciudad) => {
    const option = document.createElement("option");
    option.value = ciudad;
    option.textContent = ciudad;
    vacanteCiudad.appendChild(option);
  });
}

async function cargarVacantesAdmin() {
  try {
    setVacantesStatus("Cargando vacantes...");

    const params = new URLSearchParams({
      tipoVacante: adminFiltroTipo.value,
      pais: adminFiltroPais.value,
      estado: adminFiltroEstado.value,
      ciudad: adminFiltroCiudad.value
    });

    const res = await fetch(`${API_URL}/api/vacantes?${params.toString()}`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    vacantes = await res.json();
    renderVacantesAdmin();
    setVacantesStatus("", false);
  } catch (error) {
    console.error("Error cargando vacantes:", error);
    setVacantesStatus("⚠️ No fue posible cargar las vacantes.");
  }
}

function renderVacantesAdmin() {
  if (!vacantesAdminList) return;

  vacantesAdminList.innerHTML = "";

  if (!vacantes.length) {
    vacantesAdminList.innerHTML = `
      <div class="status">
        No hay vacantes registradas con esos filtros.
      </div>
    `;
    return;
  }

  vacantes.forEach((vacante) => {
    const card = document.createElement("article");
    card.className = "dashboard-card";

    card.innerHTML = `
      <div class="dashboard-card__top">
        <div>
          <h3>${vacante.titulo}</h3>
          <p>${vacante.grupo} • ${vacante.area}</p>
        </div>
        <span class="estado estado--pendiente">${vacante.tipoVacante}</span>
      </div>

      <div class="dashboard-card__info">
        <p><strong>Ubicación:</strong> ${vacante.pais} / ${vacante.estado} / ${vacante.ciudad}</p>
        <p><strong>Sucursal:</strong> ${vacante.sucursal}</p>
        <p><strong>Requisitos:</strong> ${Array.isArray(vacante.requisitos) ? vacante.requisitos.join(", ") : "-"}</p>
      </div>

      <div class="dashboard-card__actions">
        <button class="btn btn--secondary edit-vacante-btn" data-id="${vacante.id}">Editar</button>
        <button class="btn btn--secondary delete-vacante-btn" data-id="${vacante.id}">Eliminar</button>
      </div>
    `;

    vacantesAdminList.appendChild(card);
  });

  document.querySelectorAll(".edit-vacante-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = vacantes.find(v => v.id === btn.dataset.id);
      if (item) openVacanteModal(item);
    });
  });

  document.querySelectorAll(".delete-vacante-btn").forEach((btn) => {
    btn.addEventListener("click", () => eliminarVacante(btn.dataset.id));
  });
}

function resetVacanteForm() {
  vacanteIdEdit.value = "";
  vacanteTipo.value = "";
  vacanteGrupo.value = "";
  vacanteTituloInput.value = "";
  vacanteArea.value = "";
  vacantePais.value = "";
  vacanteEstado.innerHTML = `<option value="">Selecciona</option>`;
  vacanteCiudad.innerHTML = `<option value="">Selecciona</option>`;
  vacanteSucursal.value = "";
  vacanteRequisitos.value = "";
}

function openVacanteModal(vacante = null) {
  resetVacanteForm();

  if (vacante) {
    vacanteModalTitle.textContent = "Editar vacante";

    vacanteIdEdit.value = vacante.id || "";
    vacanteTipo.value = vacante.tipoVacante || "";
    vacanteGrupo.value = vacante.grupo || "";
    vacanteTituloInput.value = vacante.titulo || "";
    vacanteArea.value = vacante.area || "";
    vacantePais.value = vacante.pais || "";
    llenarEstadosModal();
    vacanteEstado.value = vacante.estado || "";
    llenarCiudadesModal();
    vacanteCiudad.value = vacante.ciudad || "";
    vacanteSucursal.value = vacante.sucursal || "";
    vacanteRequisitos.value = Array.isArray(vacante.requisitos) ? vacante.requisitos.join(", ") : "";
  } else {
    vacanteModalTitle.textContent = "Nueva vacante";
  }

  vacanteModal.classList.remove("hidden");
}

function closeVacanteModal() {
  vacanteModal.classList.add("hidden");
  resetVacanteForm();
}

async function guardarVacante() {
  const payload = {
    tipoVacante: vacanteTipo.value,
    grupo: vacanteGrupo.value.trim(),
    titulo: vacanteTituloInput.value.trim(),
    area: vacanteArea.value.trim(),
    pais: vacantePais.value,
    estado: vacanteEstado.value,
    ciudad: vacanteCiudad.value,
    sucursal: vacanteSucursal.value.trim(),
    requisitos: vacanteRequisitos.value
      .split(",")
      .map(x => x.trim())
      .filter(Boolean)
  };

  if (!payload.tipoVacante || !payload.grupo || !payload.titulo || !payload.area || !payload.pais || !payload.estado || !payload.ciudad || !payload.sucursal || !payload.requisitos.length) {
    setVacantesStatus("⚠️ Completa todos los campos de la vacante.");
    return;
  }

  try {
    const isEdit = Boolean(vacanteIdEdit.value);
    const url = isEdit
      ? `${API_URL}/api/vacantes/${vacanteIdEdit.value}`
      : `${API_URL}/api/vacantes`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No fue posible guardar la vacante.");

    closeVacanteModal();
    await cargarVacantesAdmin();
    setVacantesStatus(`✅ Vacante ${isEdit ? "actualizada" : "creada"} correctamente.`);
  } catch (error) {
    console.error("Error guardando vacante:", error);
    setVacantesStatus(`⚠️ ${error.message}`);
  }
}

async function eliminarVacante(id) {
  const confirmDelete = confirm("¿Seguro que deseas eliminar esta vacante?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_URL}/api/vacantes/${id}`, {
      method: "DELETE"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No fue posible eliminar la vacante.");

    await cargarVacantesAdmin();
    setVacantesStatus("✅ Vacante eliminada correctamente.");
  } catch (error) {
    console.error("Error eliminando vacante:", error);
    setVacantesStatus(`⚠️ ${error.message}`);
  }
}

if (openVacanteModalBtn) openVacanteModalBtn.addEventListener("click", () => openVacanteModal());
if (refreshVacantesBtn) refreshVacantesBtn.addEventListener("click", cargarVacantesAdmin);
if (closeVacanteModalBtn) closeVacanteModalBtn.addEventListener("click", closeVacanteModal);
if (closeVacanteBackdrop) closeVacanteBackdrop.addEventListener("click", closeVacanteModal);
if (saveVacanteBtn) saveVacanteBtn.addEventListener("click", guardarVacante);

if (adminFiltroPais) {
  adminFiltroPais.addEventListener("change", () => {
    llenarEstados(adminFiltroPais, adminFiltroEstado, adminFiltroCiudad);
    cargarVacantesAdmin();
  });
}
if (adminFiltroEstado) {
  adminFiltroEstado.addEventListener("change", () => {
    llenarCiudades(adminFiltroPais, adminFiltroEstado, adminFiltroCiudad);
    cargarVacantesAdmin();
  });
}
if (adminFiltroCiudad) adminFiltroCiudad.addEventListener("change", cargarVacantesAdmin);
if (adminFiltroTipo) adminFiltroTipo.addEventListener("change", cargarVacantesAdmin);

if (vacantePais) vacantePais.addEventListener("change", llenarEstadosModal);
if (vacanteEstado) vacanteEstado.addEventListener("change", llenarCiudadesModal);

async function init() {
  await cargarUbicaciones();
  llenarEstados(adminFiltroPais, adminFiltroEstado, adminFiltroCiudad);
  await cargarVacantesAdmin();
}

init();