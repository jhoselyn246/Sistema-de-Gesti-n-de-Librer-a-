// Inicializar Barra Lateral
renderSidebar('ventas', '../');

// Variables globales
let ventas = getLocalStorage("ventas");
let clientes = getLocalStorage("clientes");
let libros = getLocalStorage("libros");

// Inicializar página
document.getElementById("fechaVenta").value = new Date().toISOString().split('T')[0];
cargarSelectores();
actualizarPrecioVenta();
mostrarVentas();

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
    selectCli.innerHTML = clientes.map(c => `<option value="${c.id}">${c.nombre} ${c.apellido} (CI: ${c.ci})</option>`).join('');
  }

  // Libros (Mostrar precio y stock actual en el selector ayuda a guiar al vendedor)
  if (libros.length === 0) {
    selectLib.innerHTML = `<option value="">Sin Libros en Inventario</option>`;
  } else {
    selectLib.innerHTML = libros.map(l => {
      const stockTexto = l.stock === 0 ? "Agotado" : `${l.stock} uds`;
      return `<option value="${l.id}">${l.titulo} [Stock: ${stockTexto}]</option>`;
    }).join('');
  }
}

// Calcular precios y existencias en tiempo real
function actualizarPrecioVenta() {
  libros = getLocalStorage("libros"); // Obtener base de datos fresca
  const selectLib = document.getElementById("selectLibro");
  const idLibro = selectLib.value;
  const cant = parseInt(document.getElementById("cantidad").value || 0);

  const stockLabel = document.getElementById("stockDisponibleLabel");
  const unitarioLabel = document.getElementById("precioUnitarioLabel");
  const totalLabel = document.getElementById("precioTotalLabel");

  if (!idLibro || idLibro === "") {
    stockLabel.innerText = "0 uds";
    stockLabel.style.color = "var(--text-muted)";
    unitarioLabel.innerText = "$0.00";
    totalLabel.innerText = "$0.00";
    return;
  }

  const libro = libros.find(l => String(l.id) === String(idLibro));
  if (!libro) return;

  const stock = parseInt(libro.stock || 0);
  
  // Estilizar etiqueta de stock según nivel crítico
  stockLabel.innerText = `${stock} uds`;
  if (stock === 0) {
    stockLabel.style.color = "var(--danger)";
    stockLabel.innerText = "Agotado";
  } else if (stock < 5) {
    stockLabel.style.color = "var(--warning)";
  } else {
    stockLabel.style.color = "var(--success)";
  }

  // Calcular
  const precioUnitario = parseFloat(libro.precio || 0);
  const total = precioUnitario * cant;

  unitarioLabel.innerText = `Bs ${precioUnitario.toFixed(2)}`;
  totalLabel.innerText = `Bs ${total.toFixed(2)}`;
}

// Registrar la venta y reducir stock
function agregarVenta() {
  clientes = getLocalStorage("clientes");
  libros = getLocalStorage("libros");
  ventas = getLocalStorage("ventas");

  const clienteId = document.getElementById("selectCliente").value;
  const libroId = document.getElementById("selectLibro").value;
  const cantidad = parseInt(document.getElementById("cantidad").value || 0);
  const fecha = document.getElementById("fechaVenta").value;

  // Validaciones
  if (!clienteId || clienteId === "") {
    showToast("Debe registrar y seleccionar un cliente para la venta.", "warning");
    return;
  }

  if (!libroId || libroId === "") {
    showToast("Debe registrar y seleccionar un libro para la venta.", "warning");
    return;
  }

  if (isNaN(cantidad) || cantidad <= 0) {
    showToast("Ingrese una cantidad válida mayor a cero.", "warning");
    return;
  }

  if (fecha === "") {
    showToast("Seleccione una fecha de transacción válida.", "warning");
    return;
  }

  // Buscar Libro para stock
  const libroIndex = libros.findIndex(l => String(l.id) === String(libroId));
  if (libroIndex === -1) {
    showToast("Libro no encontrado en la base de datos.", "danger");
    return;
  }

  const libro = libros[libroIndex];
  const stockActual = parseInt(libro.stock || 0);

  // Comprobar existencia
  if (stockActual < cantidad) {
    showToast(`Stock insuficiente. Intentas vender ${cantidad} unidades, pero solo quedan ${stockActual} de "${libro.titulo}".`, "danger");
    return;
  }

  // LÓGICA DE NEGOCIO: Decrementar existencias
  const nuevoStock = stockActual - cantidad;
  libros[libroIndex].stock = nuevoStock;
  if (nuevoStock === 0) {
    libros[libroIndex].estado = "Agotado";
  }
  
  // Guardar cambio de stock en base de datos
  saveLocalStorage("libros", libros);

  // Registrar transacción de venta
  const nuevoId = ventas.length > 0 ? Math.max(...ventas.map(v => v.id)) + 1 : 1001;
  const precioUnitario = parseFloat(libro.precio);
  const precioTotal = precioUnitario * cantidad;

  ventas.push({
    id: nuevoId,
    clienteId: parseInt(clienteId),
    libroId: parseInt(libroId),
    cantidad,
    precioUnitario,
    precioTotal,
    fecha
  });

  saveLocalStorage("ventas", ventas);
  
  showToast(`Venta Nro. ${nuevoId} registrada con éxito. Existencias actualizadas.`, "success");

  // Resetear interfaz
  document.getElementById("cantidad").value = 1;
  
  // Recargar
  cargarSelectores(); // Recarga el selector para mostrar el nuevo stock
  document.getElementById("selectLibro").value = libroId; // Mantener seleccionado el mismo libro
  actualizarPrecioVenta();
  mostrarVentas();
}

// Renderizar historial de ventas
function mostrarVentas() {
  ventas = getLocalStorage("ventas");
  clientes = getLocalStorage("clientes");
  libros = getLocalStorage("libros");

  const tbody = document.getElementById("tablaVentas");
  const fallback = document.getElementById("sinVentas");
  const buscador = document.getElementById("buscarVenta").value.toLowerCase();

  tbody.innerHTML = "";

  // Filtrar
  const filtradas = ventas.filter(v => {
    // Buscar el cliente y libro correspondientes para coincidir por texto
    const clienteObj = clientes.find(c => c.id === v.clienteId);
    const clienteNombre = clienteObj ? `${clienteObj.nombre} ${clienteObj.apellido}`.toLowerCase() : "";
    
    const libroObj = libros.find(l => l.id === v.libroId);
    const libroTitulo = libroObj ? libroObj.titulo.toLowerCase() : "";

    return clienteNombre.includes(buscador) || libroTitulo.includes(buscador);
  });

  if (filtradas.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";
  filtradas.forEach(v => {
    const clienteObj = clientes.find(c => c.id === v.clienteId);
    const clienteNombre = clienteObj ? `${clienteObj.nombre} ${clienteObj.apellido}` : '<span style="color:var(--text-muted); font-style:italic;">Cliente Eliminado</span>';
    
    const libroObj = libros.find(l => l.id === v.libroId);
    const libroTitulo = libroObj ? libroObj.titulo : '<span style="color:var(--text-muted); font-style:italic;">Libro Eliminado</span>';

    tbody.innerHTML += `
      <tr>
        <td><strong>#${v.id}</strong></td>
        <td>${clienteNombre}</td>
        <td style="font-weight:600;">${libroTitulo}</td>
        <td>${v.cantidad} uds</td>
        <td>Bs ${parseFloat(v.precioUnitario).toFixed(2)}</td>
        <td style="font-weight:700; color:var(--success);">Bs ${parseFloat(v.precioTotal).toFixed(2)}</td>
        <td>${formatearFechaSimple(v.fecha)}</td>
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
