// Inicializar Barra Lateral
renderSidebar('libros', '../');

// Variables globales
let libros = getLocalStorage("libros");
let autores = getLocalStorage("autores");
let editoriales = getLocalStorage("editoriales");
let categorias = getLocalStorage("categorias");

// Inicializar
cargarListasSelectores();
mostrarLibros();

// Cargar selectores dinámicamente
function cargarListasSelectores() {
  autores = getLocalStorage("autores");
  editoriales = getLocalStorage("editoriales");
  categorias = getLocalStorage("categorias");

  const selectAutor = document.getElementById("selectAutor");
  const selectEditorial = document.getElementById("selectEditorial");
  const selectCategoria = document.getElementById("selectCategoria");
  const filtroCat = document.getElementById("filtroCategoria");

  const editAutor = document.getElementById("editAutor");
  const editEditorial = document.getElementById("editEditorial");
  const editCategoria = document.getElementById("editCategoria");

  // Autores
  let autorHTML = autores.length > 0 
    ? autores.map(a => `<option value="${a.id}">${a.nombre} ${a.apellido}</option>`).join('')
    : `<option value="">Regístre un Autor primero</option>`;
  selectAutor.innerHTML = autorHTML;
  editAutor.innerHTML = autorHTML;

  // Editoriales
  let editorialHTML = editoriales.length > 0 
    ? editoriales.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')
    : `<option value="">Regístre una Editorial primero</option>`;
  selectEditorial.innerHTML = editorialHTML;
  editEditorial.innerHTML = editorialHTML;

  // Categorías
  let categoriaHTML = categorias.length > 0 
    ? categorias.map(c => `<option value="${c}">${c}</option>`).join('')
    : `<option value="">Regístre una Categoría primero</option>`;
  selectCategoria.innerHTML = categoriaHTML;
  editCategoria.innerHTML = categoriaHTML;

  // Filtro Categorías
  let filtroHTML = `<option value="Todas">Todas las Categorías</option>`;
  if (categorias.length > 0) {
    filtroHTML += categorias.map(c => `<option value="${c}">${c}</option>`).join('');
  }
  filtroCat.innerHTML = filtroHTML;
}

// Agregar libro
function agregarLibro() {
  const titulo = document.getElementById("titulo").value.trim();
  const isbn = document.getElementById("isbn").value.trim();
  const idAutor = parseInt(document.getElementById("selectAutor").value);
  const idEditorial = parseInt(document.getElementById("selectEditorial").value);
  const categoria = document.getElementById("selectCategoria").value;
  const precio = parseFloat(document.getElementById("precio").value);
  const stock = parseInt(document.getElementById("stock").value);

  // Validaciones
  if (titulo === "" || isbn === "" || isNaN(idAutor) || isNaN(idEditorial) || categoria === "") {
    showToast("Por favor, rellene los campos de texto y selecciones.", "warning");
    return;
  }

  if (isNaN(precio) || precio <= 0) {
    showToast("El precio debe ser un número válido mayor a cero.", "warning");
    return;
  }

  if (isNaN(stock) || stock < 0) {
    showToast("El stock inicial debe ser un número entero mayor o igual a cero.", "warning");
    return;
  }

  // Generar ID único
  const nuevoId = libros.length > 0 ? Math.max(...libros.map(l => l.id)) + 1 : 101;

  libros.push({
    id: nuevoId,
    titulo,
    isbn,
    idAutor,
    idEditorial,
    categoria,
    precio,
    stock,
    fechaRegistro: new Date().toISOString().split('T')[0],
    estado: stock > 0 ? "Disponible" : "Agotado"
  });

  saveLocalStorage("libros", libros);
  showToast(`Libro "${titulo}" registrado en el inventario.`, "success");

  // Limpiar campos
  document.getElementById("titulo").value = "";
  document.getElementById("isbn").value = "";
  document.getElementById("precio").value = "";
  document.getElementById("stock").value = "";

  mostrarLibros();
}

// Renderizar libros aplicando filtros
function mostrarLibros() {
  libros = getLocalStorage("libros");
  autores = getLocalStorage("autores");
  editoriales = getLocalStorage("editoriales");

  const tbody = document.getElementById("tablaLibros");
  const fallback = document.getElementById("sinLibros");
  const buscador = document.getElementById("buscarLibro").value.toLowerCase();
  const catFiltro = document.getElementById("filtroCategoria").value;

  tbody.innerHTML = "";

  const filtrados = libros.filter(l => {
    const coincideTexto = l.titulo.toLowerCase().includes(buscador) || l.isbn.toLowerCase().includes(buscador);
    const coincideCategoria = catFiltro === "Todas" || l.categoria === catFiltro;
    return coincideTexto && coincideCategoria;
  });

  if (filtrados.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";
  filtrados.forEach(libro => {
    const indexReal = libros.findIndex(l => l.id === libro.id);
    
    // Obtener Autor
    const autorObj = autores.find(a => String(a.id) === String(libro.idAutor));
    const autorNombre = autorObj ? `${autorObj.nombre} ${autorObj.apellido}` : "Desconocido";

    // Obtener Editorial
    const editorialObj = editoriales.find(e => String(e.id) === String(libro.idEditorial));
    const editorialNombre = editorialObj ? editorialObj.nombre : "Desconocida";

    // Badges de Stock y Estado
    const stock = parseInt(libro.stock || 0);
    const stockHTML = stock < 5 
      ? `<span class="badge badge-low-stock" title="Bajo Stock (< 5 unidades)">${stock} (Crítico)</span>`
      : `<span>${stock} uds</span>`;

    const estadoClase = stock > 0 ? "badge-success" : "badge-muted";
    const estadoTexto = stock > 0 ? "Disponible" : "Agotado";

    tbody.innerHTML += `
      <tr>
        <td>${libro.id}</td>
        <td style="font-weight:600;">${libro.titulo}</td>
        <td><code>${libro.isbn}</code></td>
        <td>${autorNombre}</td>
        <td>${editorialNombre}</td>
        <td><span class="badge badge-muted" style="border:none;">${libro.categoria}</span></td>
        <td style="font-weight:700;">$${parseFloat(libro.precio).toFixed(2)}</td>
        <td>${stockHTML}</td>
        <td><span class="badge ${estadoClase}">${estadoTexto}</span></td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-secondary btn-small" onclick="abrirEditar(${indexReal})" title="Editar libro">✏️</button>
            <button class="btn btn-danger btn-small" onclick="eliminarLibro(${indexReal})" title="Eliminar libro">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });
}

// Eliminar libro con validaciones relacionales
function eliminarLibro(index) {
  const libro = libros[index];
  const ventas = getLocalStorage("ventas");
  const reservas = getLocalStorage("reservas");

  // Validar si tiene ventas
  const ventasAsociadas = ventas.filter(v => String(v.libroId) === String(libro.id));
  if (ventasAsociadas.length > 0) {
    showToast(`No se puede eliminar "${libro.titulo}" porque tiene ${ventasAsociadas.length} venta(s) registrada(s).`, "danger");
    return;
  }

  // Validar si tiene reservas
  const reservasAsociadas = reservas.filter(r => String(r.libroId) === String(libro.id));
  if (reservasAsociadas.length > 0) {
    showToast(`No se puede eliminar "${libro.titulo}" porque tiene ${reservasAsociadas.length} reserva(s) asociada(s).`, "danger");
    return;
  }

  const confirmacion = confirm(`¿Estás seguro de que deseas eliminar el libro "${libro.titulo}"?`);
  if (!confirmacion) return;

  libros.splice(index, 1);
  saveLocalStorage("libros", libros);
  showToast("Libro eliminado del catálogo.", "success");
  mostrarLibros();
}

// Modales de Edición
function abrirEditar(index) {
  const libro = libros[index];

  document.getElementById("editIndex").value = index;
  document.getElementById("editTitulo").value = libro.titulo;
  document.getElementById("editIsbn").value = libro.isbn;
  document.getElementById("editAutor").value = libro.idAutor;
  document.getElementById("editEditorial").value = libro.idEditorial;
  document.getElementById("editCategoria").value = libro.categoria;
  document.getElementById("editPrecio").value = libro.precio;
  document.getElementById("editStock").value = libro.stock;

  document.getElementById("modalEdicionLibro").classList.add("open");
}

function cerrarModal() {
  document.getElementById("modalEdicionLibro").classList.remove("open");
}

function guardarEdicion() {
  const index = document.getElementById("editIndex").value;
  const titulo = document.getElementById("editTitulo").value.trim();
  const isbn = document.getElementById("editIsbn").value.trim();
  const idAutor = parseInt(document.getElementById("editAutor").value);
  const idEditorial = parseInt(document.getElementById("editEditorial").value);
  const categoria = document.getElementById("editCategoria").value;
  const precio = parseFloat(document.getElementById("editPrecio").value);
  const stock = parseInt(document.getElementById("editStock").value);

  // Validaciones
  if (titulo === "" || isbn === "" || isNaN(idAutor) || isNaN(idEditorial) || categoria === "") {
    showToast("Por favor, rellene todos los campos.", "warning");
    return;
  }

  if (isNaN(precio) || precio <= 0) {
    showToast("El precio debe ser un número válido mayor a cero.", "warning");
    return;
  }

  if (isNaN(stock) || stock < 0) {
    showToast("El stock debe ser un número entero mayor o igual a cero.", "warning");
    return;
  }

  libros[index].titulo = titulo;
  libros[index].isbn = isbn;
  libros[index].idAutor = idAutor;
  libros[index].idEditorial = idEditorial;
  libros[index].categoria = categoria;
  libros[index].precio = precio;
  libros[index].stock = stock;
  libros[index].estado = stock > 0 ? "Disponible" : "Agotado";

  saveLocalStorage("libros", libros);
  showToast("Datos del libro actualizados.", "success");
  cerrarModal();
  mostrarLibros();
}

function filtrarLibros() {
  mostrarLibros();
}

function limpiarFiltros() {
  document.getElementById("buscarLibro").value = "";
  document.getElementById("filtroCategoria").value = "Todas";
  mostrarLibros();
}
