// Inicializar Barra Lateral
renderSidebar('reportes', '../');

// Configuración global de Chart.js para Tema Oscuro
if (window.Chart) {
  Chart.defaults.color = '#9ca3af';
  Chart.defaults.borderColor = '#374151';
}

// Variables globales
let ventas = getLocalStorage("ventas");
let reservas = getLocalStorage("reservas");
let clientes = getLocalStorage("clientes");
let libros = getLocalStorage("libros");

// Instancias de Gráficos para Limpieza
let chartVentasTiempo = null;
let chartCategoriasVentas = null;
let chartClientesFrecuentes = null;

// Inicializar página
document.getElementById("filtroPeriodo").value = "Todos";
procesarReportes();

// Cambiar fechas según período predefinido
window.cambiarPeriodoPredefinido = function() {
  const periodo = document.getElementById("filtroPeriodo").value;
  const fechaInicioEl = document.getElementById("fechaInicio");
  const fechaFinEl = document.getElementById("fechaFin");

  const hoy = new Date();
  const pad = n => String(n).padStart(2, '0');
  const formatearDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  fechaFinEl.value = formatearDate(hoy);

  if (periodo === "Todos") {
    fechaInicioEl.value = "";
    fechaFinEl.value = "";
  } else if (periodo === "Diario") {
    fechaInicioEl.value = formatearDate(hoy);
  } else if (periodo === "Semanal") {
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - 6);
    fechaInicioEl.value = formatearDate(inicio);
  } else if (periodo === "Mensual") {
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - 29);
    fechaInicioEl.value = formatearDate(inicio);
  }
};

// Generar informes y gráficos
window.procesarReportes = function() {
  // Cargar bases de datos frescas
  ventas = getLocalStorage("ventas");
  reservas = getLocalStorage("reservas");
  clientes = getLocalStorage("clientes");
  libros = getLocalStorage("libros");

  const inicioVal = document.getElementById("fechaInicio").value;
  const finVal = document.getElementById("fechaFin").value;

  // Filtrar Ventas
  let ventasFiltradas = ventas.filter(v => {
    if (inicioVal && v.fecha < inicioVal) return false;
    if (finVal && v.fecha > finVal) return false;
    return true;
  });

  // Filtrar Reservas
  let reservasFiltradas = reservas.filter(r => {
    if (inicioVal && r.fechaReserva < inicioVal) return false;
    if (finVal && r.fechaReserva > finVal) return false;
    return true;
  });

  // 1. Calcular KPIs Resumen
  const totalIngresos = ventasFiltradas.reduce((sum, v) => sum + parseFloat(v.precioTotal || 0), 0);
  const totalLibrosVendidos = ventasFiltradas.reduce((sum, v) => sum + parseInt(v.cantidad || 0), 0);
  
  // Clientes activos (compraron en este rango)
  const clientesActivosSet = new Set(ventasFiltradas.map(v => v.clienteId));
  const totalClientesActivos = clientesActivosSet.size;

  const totalReservas = reservasFiltradas.length;

  // Actualizar en UI
  document.getElementById("repTotalRecaudado").innerText = `Bs${totalIngresos.toFixed(2)}`;
  document.getElementById("repLibrosVendidos").innerText = totalLibrosVendidos;
  document.getElementById("repClientesActivos").innerText = totalClientesActivos;
  document.getElementById("repReservasRealizadas").innerText = totalReservas;

  // 2. Renderizar Gráficas
  renderGraficoVentasTiempo(ventasFiltradas);
  renderGraficoCategoriasVentas(ventasFiltradas);
  renderGraficoClientesFrecuentes(ventasFiltradas);

  // 3. Renderizar Tablas Detalladas
  renderTablaReporteVentas(ventasFiltradas);
  renderTablaReporteReservas(reservasFiltradas);
};

// Gráfico 1: Ventas en el Tiempo (Agrupado por Fecha)
function renderGraficoVentasTiempo(ventasData) {
  const ctx = document.getElementById("canvasVentasTiempo").getContext("2d");
  if (chartVentasTiempo) chartVentasTiempo.destroy();

  // Agrupar totales por fecha
  const mapaFechas = {};
  ventasData.forEach(v => {
    mapaFechas[v.fecha] = (mapaFechas[v.fecha] || 0) + parseFloat(v.precioTotal || 0);
  });

  // Ordenar fechas cronológicamente
  const fechasOrdenadas = Object.keys(mapaFechas).sort();
  const totales = fechasOrdenadas.map(f => mapaFechas[f]);

  // Si no hay datos, mostrar placeholder
  const labels = fechasOrdenadas.length > 0 ? fechasOrdenadas.map(f => f.split('-')[2] + '/' + f.split('-')[1]) : ["Sin Datos"];
  const datos = totales.length > 0 ? totales : [0];

  chartVentasTiempo = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Recaudado ($)',
        data: datos,
        backgroundColor: '#6366f1',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// Gráfico 2: Categorías más vendidas
function renderGraficoCategoriasVentas(ventasData) {
  const ctx = document.getElementById("canvasCategoriasVentas").getContext("2d");
  if (chartCategoriasVentas) chartCategoriasVentas.destroy();

  const mapaCategorias = {};
  ventasData.forEach(v => {
    const libro = libros.find(l => String(l.id) === String(v.libroId));
    const cat = libro ? libro.categoria : "Desconocida";
    mapaCategorias[cat] = (mapaCategorias[cat] || 0) + parseInt(v.cantidad || 0);
  });

  const labels = Object.keys(mapaCategorias);
  const datos = Object.values(mapaCategorias);

  const dataLabels = labels.length > 0 ? labels : ["Ninguna"];
  const dataValores = datos.length > 0 ? datos : [0];

  chartCategoriasVentas = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: dataLabels,
      datasets: [{
        data: dataValores,
        backgroundColor: ['#10b981', '#ec4899', '#f59e0b', '#6366f1', '#3b82f6', '#8b5cf6'],
        borderWidth: 1,
        borderColor: '#111827'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 10, font: { size: 9 } } }
      }
    }
  });
}

// Gráfico 3: Clientes Frecuentes (Compras totales)
function renderGraficoClientesFrecuentes(ventasData) {
  const ctx = document.getElementById("canvasClientesFrecuentes").getContext("2d");
  if (chartClientesFrecuentes) chartClientesFrecuentes.destroy();

  const mapaClientes = {};
  ventasData.forEach(v => {
    mapaClientes[v.clienteId] = (mapaClientes[v.clienteId] || 0) + parseInt(v.cantidad || 0);
  });

  const clientesOrdenados = Object.keys(mapaClientes).map(id => {
    const cliente = clientes.find(c => String(c.id) === String(id));
    return {
      nombre: cliente ? `${cliente.nombre} ${cliente.apellido.charAt(0)}.` : 'Inquilino',
      compras: mapaClientes[id]
    };
  }).sort((a, b) => b.compras - a.compras).slice(0, 5);

  const labels = clientesOrdenados.length > 0 ? clientesOrdenados.map(c => c.nombre) : ["Ninguno"];
  const datos = clientesOrdenados.length > 0 ? clientesOrdenados.map(c => c.compras) : [0];

  chartClientesFrecuentes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Ejemplares Comprados',
        data: datos,
        backgroundColor: '#ec4899',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y', // Barra horizontal! Muy premium!
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { stepSize: 1 } },
        y: { grid: { display: false } }
      }
    }
  });
}

// Renderizar Tablas
function renderTablaReporteVentas(ventasData) {
  const tbody = document.getElementById("tablaReporteVentas");
  const fallback = document.getElementById("sinVentasReporte");
  tbody.innerHTML = "";

  if (ventasData.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";
  ventasData.forEach(v => {
    const cli = clientes.find(c => c.id === v.clienteId);
    const cliNombre = cli ? `${cli.nombre} ${cli.apellido}` : "Desconocido";
    
    const lib = libros.find(l => l.id === v.libroId);
    const libTitulo = lib ? lib.titulo : "Desconocido";

    tbody.innerHTML += `
      <tr>
        <td><strong>#${v.id}</strong></td>
        <td>${cliNombre}</td>
        <td style="font-weight:600;">${libTitulo}</td>
        <td>${v.cantidad} uds</td>
        <td style="font-weight:700; color:var(--success);">Bs ${parseFloat(v.precioTotal).toFixed(2)}</td>
        <td>${formatearFechaSimple(v.fecha)}</td>
      </tr>
    `;
  });
}

function renderTablaReporteReservas(reservasData) {
  const tbody = document.getElementById("tablaReporteReservas");
  const fallback = document.getElementById("sinReservasReporte");
  tbody.innerHTML = "";

  if (reservasData.length === 0) {
    fallback.style.display = "block";
    return;
  }

  fallback.style.display = "none";
  reservasData.forEach(r => {
    const cli = clientes.find(c => c.id === r.clienteId);
    const cliNombre = cli ? `${cli.nombre} ${cli.apellido}` : "Desconocido";
    
    const lib = libros.find(l => l.id === r.libroId);
    const libTitulo = lib ? lib.titulo : "Desconocido";

    let badgeClase = "badge-warning";
    if (r.estado === "Entregado") badgeClase = "badge-success";
    if (r.estado === "Cancelado") badgeClase = "badge-low-stock";
    if (r.estado === "Disponible") badgeClase = "badge-muted";

    tbody.innerHTML += `
      <tr>
        <td><strong>#${r.id}</strong></td>
        <td>${cliNombre}</td>
        <td style="font-weight:600;">${libTitulo}</td>
        <td>${formatearFechaSimple(r.fechaReserva)}</td>
        <td><span class="badge ${badgeClase}">${r.estado}</span></td>
      </tr>
    `;
  });
}

// Formateador de fecha
function formatearFechaSimple(fechaStr) {
  if (!fechaStr) return "";
  const partes = fechaStr.split('-');
  if (partes.length !== 3) return fechaStr;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
