// Inicializar Barra Lateral
renderSidebar('clientes', '../');

// Variables globales
let clientes = getLocalStorage("clientes");
mostrarClientes();

// Registrar un nuevo cliente
function agregarCliente() {
  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const ci = document.getElementById("ci").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const direccion = document.getElementById("direccion").value.trim();

  if (nombre === "" || apellido === "" || ci === "" || telefono === "" || correo === "" || direccion === "") {
    showToast("Por favor, rellene todos los campos para registrar al cliente.", "warning");
    return;
  }

  // Validación de CI Único
  const existeCi = clientes.some(c => c.ci === ci);
  if (existeCi) {
    showToast(`El documento de identidad CI ${ci} ya está registrado en el sistema.`, "danger");
    return;
  }

  // Generar ID único
  const nuevoId = clientes.length > 0 ? Math.max(...clientes.map(c => c.id)) + 1 : 1;

  clientes.push({
    id: nuevoId,
    nombre,
    apellido,
    ci,
    telefono,
    correo,
    direccion
  });

  saveLocalStorage("clientes", clientes);
  showToast(`Cliente "${nombre} ${apellido}" registrado con éxito.`, "success");

  // Limpiar campos
  document.getElementById("nombre").value = "";
  document.getElementById("apellido").value = "";
  document.getElementById("ci").value = "";
  document.getElementById("telefono").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("direccion").value = "";

  mostrarClientes();
}

// Renderizar la lista de clientes
function mostrarClientes() {
  clientes = getLocalStorage("clientes");
  const tbody = document.getElementById("tablaClientes");
  const fallback = document.getElementById("sinClientes");
  const buscador = document.getElementById("buscarCliente").value.toLowerCase();

  tbody.innerHTML = "";

  const filtrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(buscador) || 
    c.apellido.toLowerCase().includes(buscador) ||
    c.ci.includes(buscador)
  );

  if (filtrados.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";
  filtrados.forEach(cliente => {
    const indexReal = clientes.findIndex(c => c.id === cliente.id);

    tbody.innerHTML += `
      <tr>
        <td>${cliente.id}</td>
        <td style="font-weight:600;">${cliente.nombre} ${cliente.apellido}</td>
        <td><code>${cliente.ci}</code></td>
        <td>${cliente.telefono}</td>
        <td>${cliente.correo}</td>
        <td>${cliente.direccion}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-secondary btn-small" onclick="abrirEditar(${indexReal})" title="Editar cliente">✏️</button>
            <button class="btn btn-danger btn-small" onclick="eliminarCliente(${indexReal})" title="Eliminar cliente">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });
}

// Eliminar un cliente con integridad relacional
function eliminarCliente(index) {
  const cliente = clientes[index];
  const ventas = getLocalStorage("ventas");
  const reservas = getLocalStorage("reservas");

  // Verificar ventas
  const ventasAsociadas = ventas.filter(v => String(v.clienteId) === String(cliente.id));
  if (ventasAsociadas.length > 0) {
    showToast(`No se puede eliminar a "${cliente.nombre} ${cliente.apellido}" porque tiene ${ventasAsociadas.length} venta(s) registrada(s).`, "danger");
    return;
  }

  // Verificar reservas
  const reservasAsociadas = reservas.filter(r => String(r.clienteId) === String(cliente.id));
  if (reservasAsociadas.length > 0) {
    showToast(`No se puede eliminar a "${cliente.nombre} ${cliente.apellido}" porque tiene ${reservasAsociadas.length} reserva(s) asociada(s).`, "danger");
    return;
  }

  const confirmacion = confirm(`¿Estás seguro de que deseas eliminar al cliente "${cliente.nombre} ${cliente.apellido}"?`);
  if (!confirmacion) return;

  clientes.splice(index, 1);
  saveLocalStorage("clientes", clientes);
  showToast("Cliente eliminado correctamente.", "success");
  mostrarClientes();
}

// Modales de Edición
function abrirEditar(index) {
  const cliente = clientes[index];

  document.getElementById("editIndex").value = index;
  document.getElementById("editNombre").value = cliente.nombre;
  document.getElementById("editApellido").value = cliente.apellido;
  document.getElementById("editCi").value = cliente.ci;
  document.getElementById("editTelefono").value = cliente.telefono;
  document.getElementById("editCorreo").value = cliente.correo;
  document.getElementById("editDireccion").value = cliente.direccion;

  document.getElementById("modalEdicionCliente").classList.add("open");
}

function cerrarModal() {
  document.getElementById("modalEdicionCliente").classList.remove("open");
}

function guardarEdicion() {
  const index = document.getElementById("editIndex").value;
  const nombre = document.getElementById("editNombre").value.trim();
  const apellido = document.getElementById("editApellido").value.trim();
  const ci = document.getElementById("editCi").value.trim();
  const telefono = document.getElementById("editTelefono").value.trim();
  const correo = document.getElementById("editCorreo").value.trim();
  const direccion = document.getElementById("editDireccion").value.trim();

  if (nombre === "" || apellido === "" || ci === "" || telefono === "" || correo === "" || direccion === "") {
    showToast("Por favor, rellene todos los campos.", "warning");
    return;
  }

  // Validar CI Único (excluyendo al cliente actual)
  const existeCi = clientes.some((c, idx) => c.ci === ci && String(idx) !== String(index));
  if (existeCi) {
    showToast(`La cédula CI ${ci} ya está asignada a otro cliente.`, "danger");
    return;
  }

  clientes[index].nombre = nombre;
  clientes[index].apellido = apellido;
  clientes[index].ci = ci;
  clientes[index].telefono = telefono;
  clientes[index].correo = correo;
  clientes[index].direccion = direccion;

  saveLocalStorage("clientes", clientes);
  showToast("Datos del cliente actualizados correctamente.", "success");
  cerrarModal();
  mostrarClientes();
}
