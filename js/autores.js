// Inicializar Barra Lateral
renderSidebar('autores', '../');

// Variables globales
let autores = getLocalStorage("autores");
mostrarAutores();

// Registrar un nuevo autor
function agregarAutor() {
  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const nacionalidad = document.getElementById("nacionalidad").value.trim();
  const fechaNacimiento = document.getElementById("fechaNacimiento").value;

  if (nombre === "" || apellido === "" || nacionalidad === "" || fechaNacimiento === "") {
    showToast("Por favor, rellene todos los campos para registrar el autor.", "warning");
    return;
  }

  // Generar ID único
  const nuevoId = autores.length > 0 ? Math.max(...autores.map(a => a.id)) + 1 : 1;

  autores.push({
    id: nuevoId,
    nombre,
    apellido,
    nacionalidad,
    fechaNacimiento
  });

  saveLocalStorage("autores", autores);
  showToast(`Autor "${nombre} ${apellido}" registrado con éxito.`, "success");

  // Limpiar campos
  document.getElementById("nombre").value = "";
  document.getElementById("apellido").value = "";
  document.getElementById("nacionalidad").value = "";
  document.getElementById("fechaNacimiento").value = "";

  mostrarAutores();
}

// Renderizar la lista de autores
function mostrarAutores() {
  autores = getLocalStorage("autores");
  const tbody = document.getElementById("tablaAutores");
  const fallback = document.getElementById("sinAutores");
  const buscador = document.getElementById("buscarAutor").value.toLowerCase();

  tbody.innerHTML = "";

  const filtrados = autores.filter(a => 
    a.nombre.toLowerCase().includes(buscador) || 
    a.apellido.toLowerCase().includes(buscador) ||
    a.nacionalidad.toLowerCase().includes(buscador)
  );

  if (filtrados.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";
  filtrados.forEach(autor => {
    // Buscar el índice real en la base completa para editar/eliminar
    const indexReal = autores.findIndex(a => a.id === autor.id);

    tbody.innerHTML += `
      <tr>
        <td>${autor.id}</td>
        <td style="font-weight:600;">${autor.nombre} ${autor.apellido}</td>
        <td>${autor.nacionalidad}</td>
        <td>${formatearFechaSimple(autor.fechaNacimiento)}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-secondary btn-small" onclick="abrirEditar(${indexReal})" title="Editar autor">✏️</button>
            <button class="btn btn-danger btn-small" onclick="eliminarAutor(${indexReal})" title="Eliminar autor">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });
}

// Formateador de fecha simple
function formatearFechaSimple(fechaStr) {
  if (!fechaStr) return "";
  const partes = fechaStr.split('-');
  if (partes.length !== 3) return fechaStr;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Eliminar un autor con validación de relaciones
function eliminarAutor(index) {
  const autor = autores[index];
  const libros = getLocalStorage("libros");

  // Validar si el autor tiene libros vinculados
  const librosAsociados = libros.filter(l => String(l.idAutor) === String(autor.id));
  if (librosAsociados.length > 0) {
    showToast(`No se puede eliminar a "${autor.nombre} ${autor.apellido}" porque tiene ${librosAsociados.length} libro(s) asociado(s).`, "danger");
    return;
  }

  const confirmacion = confirm(`¿Estás seguro de que deseas eliminar al autor "${autor.nombre} ${autor.apellido}"?`);
  if (!confirmacion) return;

  autores.splice(index, 1);
  saveLocalStorage("autores", autores);
  showToast("Autor eliminado correctamente.", "success");
  mostrarAutores();
}

// Modales de Edición
function abrirEditar(index) {
  const autor = autores[index];

  document.getElementById("editIndex").value = index;
  document.getElementById("editNombre").value = autor.nombre;
  document.getElementById("editApellido").value = autor.apellido;
  document.getElementById("editNacionalidad").value = autor.nacionalidad;
  document.getElementById("editFechaNac").value = autor.fechaNacimiento;

  document.getElementById("modalEdicionAutor").classList.add("open");
}

function cerrarModal() {
  document.getElementById("modalEdicionAutor").classList.remove("open");
}

function guardarEdicion() {
  const index = document.getElementById("editIndex").value;
  const nombre = document.getElementById("editNombre").value.trim();
  const apellido = document.getElementById("editApellido").value.trim();
  const nacionalidad = document.getElementById("editNacionalidad").value.trim();
  const fechaNacimiento = document.getElementById("editFechaNac").value;

  if (nombre === "" || apellido === "" || nacionalidad === "" || fechaNacimiento === "") {
    showToast("Por favor, rellene todos los campos.", "warning");
    return;
  }

  autores[index].nombre = nombre;
  autores[index].apellido = apellido;
  autores[index].nacionalidad = nacionalidad;
  autores[index].fechaNacimiento = fechaNacimiento;

  saveLocalStorage("autores", autores);
  showToast("Datos del autor actualizados.", "success");
  cerrarModal();
  mostrarAutores();
}
