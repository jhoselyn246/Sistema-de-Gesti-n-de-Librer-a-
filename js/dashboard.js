// Inicializar Barra Lateral
renderSidebar('dashboard', './');

// Configuración global de Chart.js para Tema Oscuro
if (window.Chart) {
  Chart.defaults.color = '#9ca3af';      // Text muted
  Chart.defaults.borderColor = '#374151';  // Border color
}

// Variables globales
let libros = getLocalStorage("libros");
let autores = getLocalStorage("autores");
let editoriales = getLocalStorage("editoriales");
let clientes = getLocalStorage("clientes");
let ventas = getLocalStorage("ventas");
let categorias = getLocalStorage("categorias");
let reservas = getLocalStorage("reservas");

// Referencias de Gráficos (para destruirlos al recargar si es necesario)
let ventasChartInstance = null;
let categoriasChartInstance = null;

// Inicializar Dashboard
actualizarDashboard();

function actualizarDashboard() {
  // Cargar datos actuales
  libros = getLocalStorage("libros");
  autores = getLocalStorage("autores");
  editoriales = getLocalStorage("editoriales");
  clientes = getLocalStorage("clientes");
  ventas = getLocalStorage("ventas");
  categorias = getLocalStorage("categorias");
  reservas = getLocalStorage("reservas");

  // Rellenar KPIs
  const totalLibros = libros.length;
  const totalClientes = clientes.length;
  
  // Sumar ventas
  const totalVentasCount = ventas.length;
  const totalRecaudado = ventas.reduce((sum, v) => sum + parseFloat(v.precioTotal || 0), 0);
  
  // Contar stock crítico (< 5)
  const stockCritico = libros.filter(l => parseInt(l.stock || 0) < 5).length;

  document.getElementById("kpiLibros").innerText = totalLibros;
  document.getElementById("kpiClientes").innerText = totalClientes;
  document.getElementById("kpiVentas").innerText = `${totalVentasCount} (Bs ${totalRecaudado.toFixed(2)})`;
  document.getElementById("kpiCritico").innerText = stockCritico;

  // Renderizar Tablas
  renderInventarioCritico();
  renderMasVendidos();

  // Renderizar Gráficos
  renderGraficoVentas();
  renderGraficoCategorias();
}

// Renderizar tabla de bajo stock (< 5)
function renderInventarioCritico() {
  const tbody = document.getElementById("tablaInventarioCritico");
  const fallback = document.getElementById("sinInventarioCritico");
  tbody.innerHTML = "";
  
  const librosBajoStock = libros.filter(l => parseInt(l.stock || 0) < 5);

  if (librosBajoStock.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";
  librosBajoStock.forEach(libro => {
    const stock = parseInt(libro.stock || 0);
    const badgeClase = stock === 0 ? "badge-low-stock" : "badge-warning";
    const stockTexto = stock === 0 ? "Agotado" : `Bs ${stock} uds`;

    tbody.innerHTML += `
      <tr>
        <td style="font-weight:600;">${libro.titulo}</td>
        <td>${libro.categoria || 'Sin Categoría'}</td>
        <td><span class="badge ${badgeClase}">${stockTexto}</span></td>
        <td style="text-align: center;">
          <button class="btn btn-primary btn-small btn-icon-only" onclick="abrirStockRapido(${libro.id})" title="Abastecer stock">
            ➕
          </button>
        </td>
      </tr>
    `;
  });
}

// Renderizar tabla de libros más vendidos
function renderMasVendidos() {
  const tbody = document.getElementById("tablaMasVendidos");
  const fallback = document.getElementById("sinMasVendidos");
  tbody.innerHTML = "";

  if (ventas.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";

  // Calcular cantidad vendida por libro
  const mapaVentas = {};
  ventas.forEach(v => {
    mapaVentas[v.libroId] = (mapaVentas[v.libroId] || 0) + parseInt(v.cantidad || 0);
  });

  // Convertir a array y ordenar
  const librosVendidos = Object.keys(mapaVentas).map(id => {
    const libroObj = libros.find(l => String(l.id) === String(id));
    return {
      titulo: libroObj ? libroObj.titulo : 'Libro Eliminado',
      cantidad: mapaVentas[id]
    };
  }).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

  if (librosVendidos.length === 0) {
    fallback.style.display = "block";
    return;
  }

  librosVendidos.forEach(item => {
    tbody.innerHTML += `
      <tr>
        <td style="font-weight:500;">${item.titulo}</td>
        <td style="text-align: center; font-weight:700; color:var(--primary-light);">${item.cantidad}</td>
      </tr>
    `;
  });
}

// Configurar y renderizar Gráfico de Ventas
function renderGraficoVentas() {
  const ctx = document.getElementById("chartVentas").getContext("2d");
  
  if (ventasChartInstance) {
    ventasChartInstance.destroy();
  }

  // Agrupar ventas por mes
  // Array de meses
  const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const importesMes = Array(12).fill(0);

  ventas.forEach(v => {
    if (v.fecha) {
      const mesIdx = new Date(v.fecha).getMonth();
      if (mesIdx >= 0 && mesIdx < 12) {
        importesMes[mesIdx] += parseFloat(v.precioTotal || 0);
      }
    }
  });

  // Filtramos meses para mostrar solo los últimos 6 meses a partir de junio para hacer la demo bonita,
  // o simplemente mostramos el histórico anual
  const dataValues = importesMes;

  ventasChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: nombresMeses,
      datasets: [{
        label: 'Ventas Mensuales ($)',
        data: dataValues,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { callback: value => 'Bs' + value }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// Configurar y renderizar Gráfico de Categorías
function renderGraficoCategorias() {
  const ctx = document.getElementById("chartCategorias").getContext("2d");

  if (categoriasChartInstance) {
    categoriasChartInstance.destroy();
  }

  // Contar libros por categoría
  const conteo = {};
  libros.forEach(l => {
    const cat = l.categoria || "Sin Asignar";
    conteo[cat] = (conteo[cat] || 0) + 1;
  });

  const labels = Object.keys(conteo);
  const data = Object.values(conteo);

  if (labels.length === 0) {
    labels.push("Ninguna");
    data.push(0);
  }

  // Generar gradientes para la gráfica
  categoriasChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#6366f1', // Indigo
          '#ec4899', // Rose
          '#10b981', // Emerald
          '#f59e0b', // Amber
          '#3b82f6', // Blue
          '#8b5cf6'  // Violet
        ],
        borderWidth: 1,
        borderColor: '#111827'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 12, font: { size: 10 } }
        }
      },
      cutout: '65%'
    }
  });
}

// Modal de Abastecimiento Rápido de Stock
window.abrirStockRapido = function(id) {
  const libro = libros.find(l => String(l.id) === String(id));
  if (!libro) return;

  document.getElementById("stockLibroId").value = id;
  document.getElementById("stockLibroTitulo").innerText = `Libro: "${libro.titulo}" (Stock actual: ${libro.stock})`;
  document.getElementById("stockAdicional").value = 10;
  
  document.getElementById("modalInventarioRapido").classList.add("open");
};

window.cerrarStockModal = function() {
  document.getElementById("modalInventarioRapido").classList.remove("open");
};

window.guardarStockRapido = function() {
  const id = document.getElementById("stockLibroId").value;
  const cant = parseInt(document.getElementById("stockAdicional").value || 0);

  if (isNaN(cant) || cant <= 0) {
    showToast("Ingrese una cantidad válida mayor a cero.", "warning");
    return;
  }

  const index = libros.findIndex(l => String(l.id) === String(id));
  if (index !== -1) {
    const nuevoStock = parseInt(libros[index].stock || 0) + cant;
    libros[index].stock = nuevoStock;
    // Actualizar estado si es necesario
    if (nuevoStock > 0) {
      libros[index].estado = "Disponible";
    }
    saveLocalStorage("libros", libros);
    showToast(`Stock reabastecido. Nuevo stock: ${nuevoStock} unidades.`, "success");
    cerrarStockModal();
    actualizarDashboard();
  }
};

// Cargar Datos de Prueba (Demo)
window.cargarDemoBookstore = function() {
  const hoy = new Date();
  const calcularFechaRelativa = (dias) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + dias);
    return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
  };

  const demoAutores = [
    { id: 1, nombre: "Gabriel", apellido: "García Márquez", nacionalidad: "Colombiana", fechaNacimiento: "1927-03-06" },
    { id: 2, nombre: "J.K.", apellido: "Rowling", nacionalidad: "Británica", fechaNacimiento: "1965-07-31" },
    { id: 3, nombre: "George", apellido: "Orwell", nacionalidad: "Británica", fechaNacimiento: "1903-06-25" },
    { id: 4, nombre: "Isaac", apellido: "Asimov", nacionalidad: "Estadounidense", fechaNacimiento: "1920-01-02" }
  ];

  const demoEditoriales = [
    { id: 1, nombre: "Editorial Sudamericana", pais: "Argentina", correo: "contacto@sudamericana.com", telefono: "+541144445555" },
    { id: 2, nombre: "Salamandra", pais: "España", correo: "salamandra@correo.es", telefono: "+34932222222" },
    { id: 3, nombre: "Penguin Random House", pais: "Estados Unidos", correo: "prh@penguin.com", telefono: "+12123334444" }
  ];

  const demoCategorias = ["Novela", "Ciencia Ficción", "Historia", "Tecnología", "Infantil", "Fantasía"];

  const demoLibros = [
    { id: 101, titulo: "Cien años de soledad", isbn: "9789585118010", idAutor: 1, idEditorial: 1, categoria: "Novela", precio: 18.50, stock: 8, fechaRegistro: calcularFechaRelativa(-30), estado: "Disponible" },
    { id: 102, titulo: "Harry Potter y la piedra filosofal", isbn: "9788478888566", idAutor: 2, idEditorial: 2, categoria: "Fantasía", precio: 15.00, stock: 3, fechaRegistro: calcularFechaRelativa(-15), estado: "Disponible" },
    { id: 103, titulo: "1984", isbn: "9788499890944", idAutor: 3, idEditorial: 3, categoria: "Ciencia Ficción", precio: 12.00, stock: 0, fechaRegistro: calcularFechaRelativa(-45), estado: "Agotado" },
    { id: 104, titulo: "Fundación", isbn: "9788466332156", idAutor: 4, idEditorial: 3, categoria: "Ciencia Ficción", precio: 14.50, stock: 12, fechaRegistro: calcularFechaRelativa(-20), estado: "Disponible" },
    { id: 105, titulo: "Un mundo feliz", isbn: "9788497595308", idAutor: 3, idEditorial: 3, categoria: "Ciencia Ficción", precio: 10.00, stock: 2, fechaRegistro: calcularFechaRelativa(-5), estado: "Disponible" }
  ];

  const demoClientes = [
    { id: 1, nombre: "Juan", apellido: "Pérez", ci: "1234567", telefono: "70012345", correo: "juan@mail.com", direccion: "Calle Flores No. 12" },
    { id: 2, nombre: "María", apellido: "Gómez", ci: "7654321", telefono: "70054321", correo: "maria@mail.com", direccion: "Av. Aroma No. 34" },
    { id: 3, nombre: "Carlos", apellido: "López", ci: "4567890", telefono: "60098765", correo: "carlos@mail.com", direccion: "Calle 16 de Julio No. 56" }
  ];

  // Ventas simulando diferentes meses para llenar la gráfica lineal
  const demoVentas = [
    { id: 1001, clienteId: 1, libroId: 101, cantidad: 1, precioUnitario: 18.50, precioTotal: 18.50, fecha: calcularFechaRelativa(-60) }, // Hace 2 meses (Abril/Mayo)
    { id: 1002, clienteId: 2, libroId: 104, cantidad: 2, precioUnitario: 14.50, precioTotal: 29.00, fecha: calcularFechaRelativa(-30) }, // Hace 1 mes
    { id: 1003, clienteId: 3, libroId: 102, cantidad: 1, precioUnitario: 15.00, precioTotal: 15.00, fecha: calcularFechaRelativa(0) },   // Hoy
    { id: 1004, clienteId: 1, libroId: 102, cantidad: 2, precioUnitario: 15.00, precioTotal: 30.00, fecha: calcularFechaRelativa(0) }    // Hoy
  ];

  const demoReservas = [
    { id: 501, clienteId: 1, libroId: 103, fechaReserva: calcularFechaRelativa(0), estado: "Pendiente" }, // Reservó el agotado (1984)
    { id: 502, clienteId: 2, libroId: 101, fechaReserva: calcularFechaRelativa(-10), estado: "Entregado" }
  ];

  saveLocalStorage("autores", demoAutores);
  saveLocalStorage("editoriales", demoEditoriales);
  saveLocalStorage("categorias", demoCategorias);
  saveLocalStorage("libros", demoLibros);
  saveLocalStorage("clientes", demoClientes);
  saveLocalStorage("ventas", demoVentas);
  saveLocalStorage("reservas", demoReservas);

  showToast("Base de datos de demostración cargada con éxito.", "success");
  actualizarDashboard();
};

// Limpiar base de datos
window.limpiarTodoBookstore = function() {
  const confirmacion = confirm("¿Estás seguro de que deseas restablecer por completo la base de datos de la librería? Se borrarán todos los registros.");
  if (!confirmacion) return;

  localStorage.removeItem("autores");
  localStorage.removeItem("editoriales");
  localStorage.removeItem("categorias");
  localStorage.removeItem("libros");
  localStorage.removeItem("clientes");
  localStorage.removeItem("ventas");
  localStorage.removeItem("reservas");

  showToast("Base de datos borrada correctamente.", "danger");
  actualizarDashboard();
};
