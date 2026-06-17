// Inicializar Barra Lateral
renderSidebar('categorias', '../');

// Variables globales
let categorias = getLocalStorage("categorias");
mostrarCategorias();

// Registrar una nueva categoría
function agregarCategoria() {
  const input = document.getElementById("nombreCategoria");
  const nombre = input.value.trim();

  if (nombre === "") {
    showToast("Por favor, ingrese el nombre de la categoría.", "warning");
    return;
  }

  // Validación de duplicados (insensible a mayúsculas/minúsculas)
  const existe = categorias.some(c => c.toLowerCase() === nombre.toLowerCase());
  if (existe) {
    showToast("Esta categoría ya está registrada.", "danger");
    return;
  }

  // Guardar categoría
  categorias.push(nombre);
  saveLocalStorage("categorias", categorias);
  showToast(`Categoría "${nombre}" registrada con éxito.`, "success");

  // Limpiar campo
  input.value = "";

  mostrarCategorias();
}

// Renderizar la lista de categorías
function mostrarCategorias() {
  categorias = getLocalStorage("categorias");
  const tbody = document.getElementById("tablaCategorias");
  const fallback = document.getElementById("sinCategorias");
  const buscador = document.getElementById("buscarCategoria").value.toLowerCase();
  const libros = getLocalStorage("libros");

  tbody.innerHTML = "";

  const filtradas = categorias.filter(c => c.toLowerCase().includes(buscador));

  if (filtradas.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";
  filtradas.forEach((categoria, i) => {
    // Buscar el índice real en la base de datos completa de categorías
    const indexReal = categorias.indexOf(categoria);
    
    // Contar cuántos libros pertenecen a esta categoría
    const librosAsociados = libros.filter(l => l.categoria === categoria).length;

    tbody.innerHTML += `
      <tr>
        <td>${indexReal + 1}</td>
        <td style="font-weight:600;">${categoria}</td>
        <td style="font-weight:600; color: var(--primary-light);">${librosAsociados} libro(s)</td>
        <td style="text-align: center;">
          <button class="btn btn-danger btn-small" onclick="eliminarCategoria(${indexReal})" title="Eliminar categoría">
            Eliminar
          </button>
        </td>
      </tr>
    `;
  });
}

// Eliminar categoría con validación relacional
function eliminarCategoria(index) {
  const categoriaAEliminar = categorias[index];
  const libros = getLocalStorage("libros");

  // Validar si la categoría tiene libros vinculados
  const librosAsociados = libros.filter(l => l.categoria === categoriaAEliminar);
  if (librosAsociados.length > 0) {
    showToast(`No se puede eliminar la categoría "${categoriaAEliminar}" porque tiene ${librosAsociados.length} libro(s) asociado(s).`, "danger");
    return;
  }

  const confirmacion = confirm(`¿Estás seguro de que deseas eliminar la categoría "${categoriaAEliminar}"?`);
  if (!confirmacion) return;

  categorias.splice(index, 1);
  saveLocalStorage("categorias", categorias);
  showToast(`Categoría "${categoriaAEliminar}" eliminada correctamente.`, "success");
  mostrarCategorias();
}
