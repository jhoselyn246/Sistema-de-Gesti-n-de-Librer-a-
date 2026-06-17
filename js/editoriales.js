// Inicializar Barra Lateral
renderSidebar('editoriales', '../');

// Variables globales
let editoriales = getLocalStorage("editoriales");
mostrarEditoriales();

// Registrar una nueva editorial
function agregarEditorial() {
  const nombre = document.getElementById("nombre").value.trim();
  const pais = document.getElementById("pais").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const telefono = document.getElementById("telefono").value.trim();

  if (nombre === "" || pais === "" || correo === "" || telefono === "") {
    showToast("Por favor, rellene todos los campos para registrar la editorial.", "warning");
    return;
  }

  // Generar ID único
  const nuevoId = editoriales.length > 0 ? Math.max(...editoriales.map(e => e.id)) + 1 : 1;

  editoriales.push({
    id: nuevoId,
    nombre,
    pais,
    correo,
    telefono
  });

  saveLocalStorage("editoriales", editoriales);
  showToast(`Editorial "${nombre}" registrada con éxito.`, "success");

  // Limpiar campos
  document.getElementById("nombre").value = "";
  document.getElementById("pais").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("telefono").value = "";

  mostrarEditoriales();
}

// Renderizar la lista de editoriales
function mostrarEditoriales() {
  editoriales = getLocalStorage("editoriales");
  const tbody = document.getElementById("tablaEditoriales");
  const fallback = document.getElementById("sinEditoriales");
  const buscador = document.getElementById("buscarEditorial").value.toLowerCase();

  tbody.innerHTML = "";

  const filtradas = editoriales.filter(e => 
    e.nombre.toLowerCase().includes(buscador) || 
    e.pais.toLowerCase().includes(buscador)
  );

  if (filtradas.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";
  filtradas.forEach(editorial => {
    const indexReal = editoriales.findIndex(e => e.id === editorial.id);

    tbody.innerHTML += `
      <tr>
        <td>${editorial.id}</td>
        <td style="font-weight:600;">${editorial.nombre}</td>
        <td>${editorial.pais}</td>
        <td>${editorial.correo}</td>
        <td>${editorial.telefono}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-secondary btn-small" onclick="abrirEditar(${indexReal})" title="Editar editorial">✏️</button>
            <button class="btn btn-danger btn-small" onclick="eliminarEditorial(${indexReal})" title="Eliminar editorial">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });
}

// Eliminar editorial con verificación de integridad relacional
function eliminarEditorial(index) {
  const editorial = editoriales[index];
  const libros = getLocalStorage("libros");

  // Validar si la editorial tiene libros vinculados
  const librosAsociados = libros.filter(l => String(l.idEditorial) === String(editorial.id));
  if (librosAsociados.length > 0) {
    showToast(`No se puede eliminar "${editorial.nombre}" porque tiene ${librosAsociados.length} libro(s) asociado(s).`, "danger");
    return;
  }

  const confirmacion = confirm(`¿Estás seguro de que deseas eliminar la editorial "${editorial.nombre}"?`);
  if (!confirmacion) return;

  editoriales.splice(index, 1);
  saveLocalStorage("editoriales", editoriales);
  showToast("Editorial eliminada correctamente.", "success");
  mostrarEditoriales();
}

// Modales de Edición
function abrirEditar(index) {
  const editorial = editoriales[index];

  document.getElementById("editIndex").value = index;
  document.getElementById("editNombre").value = editorial.nombre;
  document.getElementById("editPais").value = editorial.pais;
  document.getElementById("editCorreo").value = editorial.correo;
  document.getElementById("editTelefono").value = editorial.telefono;

  document.getElementById("modalEdicionEditorial").classList.add("open");
}

function cerrarModal() {
  document.getElementById("modalEdicionEditorial").classList.remove("open");
}

function guardarEdicion() {
  const index = document.getElementById("editIndex").value;
  const nombre = document.getElementById("editNombre").value.trim();
  const pais = document.getElementById("editPais").value.trim();
  const correo = document.getElementById("editCorreo").value.trim();
  const telefono = document.getElementById("editTelefono").value.trim();

  if (nombre === "" || pais === "" || correo === "" || telefono === "") {
    showToast("Por favor, rellene todos los campos.", "warning");
    return;
  }

  editoriales[index].nombre = nombre;
  editoriales[index].pais = pais;
  editoriales[index].correo = correo;
  editoriales[index].telefono = telefono;

  saveLocalStorage("editoriales", editoriales);
  showToast("Datos de la editorial actualizados.", "success");
  cerrarModal();
  mostrarEditoriales();
}
