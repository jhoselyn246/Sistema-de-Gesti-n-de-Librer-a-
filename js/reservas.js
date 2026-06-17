// Inicializar Barra Lateral
renderSidebar('reservas', '../');

// Variables globales
let reservas = getLocalStorage("reservas");
let clientes = getLocalStorage("clientes");
let libros = getLocalStorage("libros");

// Inicializar formulario
document.getElementById("fechaReserva").value = new Date().toISOString().split('T')[0];
cargarSelectores();
mostrarReservas();

// Cargar selectores dinámicamente
function cargarSelectores() {
  clientes = getLocalStorage("clientes");
  libros = getLocalStorage("libros");

  const selectCli = document.getElementById("selectCliente");
  const selectLib = document.getElementById("selectLibro");

  // Clientes
  if (clientes.length === 0) {
    selectCli.innerHTML = `<option value="">Sin Clientes Registrados</option>`;
  } else {
    selectCli.innerHTML = clientes.map(c => `<option value="${c.id}">${c.nombre} ${c.apellido}</option>`).join('');
  }

  // Libros (se pueden reservar todos, pero destacamos los agotados)
  if (libros.length === 0) {
    selectLib.innerHTML = `<option value="">Sin Libros en Catálogo</option>`;
  } else {
    selectLib.innerHTML = libros.map(l => {
      const stockTexto = l.stock === 0 ? "Agotado (Recomendado para Reserva)" : `${l.stock} uds`;
      return `<option value="${l.id}">${l.titulo} [Stock: ${stockTexto}]</option>`;
    }).join('');
  }
}

// Registrar reserva
function agregarReserva() {
  clientes = getLocalStorage("clientes");
  libros = getLocalStorage("libros");
  reservas = getLocalStorage("reservas");

  const clienteId = document.getElementById("selectCliente").value;
  const libroId = document.getElementById("selectLibro").value;
  const fechaReserva = document.getElementById("fechaReserva").value;

  // Validaciones
  if (!clienteId || clienteId === "") {
    showToast("Debe seleccionar un cliente para la reserva.", "warning");
    return;
  }

  if (!libroId || libroId === "") {
    showToast("Debe seleccionar un libro para la reserva.", "warning");
    return;
  }

  if (fechaReserva === "") {
    showToast("Seleccione una fecha de reserva válida.", "warning");
    return;
  }

  // Generar ID único
  const nuevoId = reservas.length > 0 ? Math.max(...reservas.map(r => r.id)) + 1 : 501;

  reservas.push({
    id: nuevoId,
    clienteId: parseInt(clienteId),
    libroId: parseInt(libroId),
    fechaReserva,
    estado: "Pendiente"
  });

  saveLocalStorage("reservas", reservas);
  showToast(`Reserva #${nuevoId} registrada con estado "Pendiente".`, "success");

  mostrarReservas();
}

// Renderizar lista de reservas
function mostrarReservas() {
  reservas = getLocalStorage("reservas");
  clientes = getLocalStorage("clientes");
  libros = getLocalStorage("libros");

  const tbody = document.getElementById("tablaReservas");
  const fallback = document.getElementById("sinReservas");
  const buscador = document.getElementById("buscarReserva").value.toLowerCase();

  tbody.innerHTML = "";

  const filtrados = reservas.filter(r => {
    const clienteObj = clientes.find(c => c.id === r.clienteId);
    const clienteNombre = clienteObj ? `${clienteObj.nombre} ${clienteObj.apellido}`.toLowerCase() : "";
    
    const libroObj = libros.find(l => l.id === r.libroId);
    const libroTitulo = libroObj ? libroObj.titulo.toLowerCase() : "";

    return clienteNombre.includes(buscador) || libroTitulo.includes(buscador);
  });

  if (filtrados.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";
  filtrados.forEach(reserva => {
    const indexReal = reservas.findIndex(r => r.id === reserva.id);
    
    const clienteObj = clientes.find(c => c.id === reserva.clienteId);
    const clienteNombre = clienteObj ? `${clienteObj.nombre} ${clienteObj.apellido}` : '<span style="color:var(--text-muted); font-style:italic;">Cliente Eliminado</span>';
    
    const libroObj = libros.find(l => l.id === reserva.libroId);
    const libroTitulo = libroObj ? libroObj.titulo : '<span style="color:var(--text-muted); font-style:italic;">Libro Eliminado</span>';

    // Determinar estilo de badge según el estado
    let selectEstilo = "";
    if (reserva.estado === "Pendiente") selectEstilo = "border-color: var(--warning); color: var(--warning);";
    if (reserva.estado === "Disponible") selectEstilo = "border-color: var(--primary-light); color: var(--primary-light);";
    if (reserva.estado === "Entregado") selectEstilo = "border-color: var(--success); color: var(--success);";
    if (reserva.estado === "Cancelado") selectEstilo = "border-color: var(--danger); color: var(--danger);";

    tbody.innerHTML += `
      <tr>
        <td><strong>#${reserva.id}</strong></td>
        <td>${clienteNombre}</td>
        <td style="font-weight:600;">${libroTitulo}</td>
        <td>${formatearFechaSimple(reserva.fechaReserva)}</td>
        <td>
          <select class="form-select btn-small" onchange="cambiarEstadoReserva(${indexReal}, this.value)" style="width: auto; padding: 4px 8px; font-size: 0.8rem; background: var(--bg-card); ${selectEstilo}">
            <option value="Pendiente" ${reserva.estado === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
            <option value="Disponible" ${reserva.estado === 'Disponible' ? 'selected' : ''}>🟢 Disponible</option>
            <option value="Entregado" ${reserva.estado === 'Entregado' ? 'selected' : ''}>✅ Entregado</option>
            <option value="Cancelado" ${reserva.estado === 'Cancelado' ? 'selected' : ''}>❌ Cancelado</option>
          </select>
        </td>
        <td style="text-align: center;">
          <button class="btn btn-danger btn-small" onclick="eliminarReserva(${indexReal})" title="Eliminar registro de reserva">🗑️</button>
        </td>
      </tr>
    `;
  });
}

// Cambiar estado inline
window.cambiarEstadoReserva = function(indexReal, nuevoEstado) {
  reservas = getLocalStorage("reservas");
  reservas[indexReal].estado = nuevoEstado;
  saveLocalStorage("reservas", reservas);
  
  showToast(`Estado de Reserva #${reservas[indexReal].id} actualizado a "${nuevoEstado}".`, "success");
  mostrarReservas();
};

// Eliminar registro de reserva
window.eliminarReserva = function(index) {
  const confirmacion = confirm(`¿Estás seguro de que deseas eliminar este registro de reserva?`);
  if (!confirmacion) return;

  const idEliminado = reservas[index].id;
  reservas.splice(index, 1);
  saveLocalStorage("reservas", reservas);
  showToast(`Reserva #${idEliminado} eliminada.`, "success");
  mostrarReservas();
};

// Formateador de fecha simple
function formatearFechaSimple(fechaStr) {
  if (!fechaStr) return "";
  const partes = fechaStr.split('-');
  if (partes.length !== 3) return fechaStr;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
