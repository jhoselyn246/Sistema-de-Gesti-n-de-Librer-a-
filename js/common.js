// Utilidades y Seguridad Compartidas - BookStore

// Helpers para LocalStorage
function getLocalStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Filtro de Seguridad - Validar Sesión Activa
function checkSession(pathPrefix = "") {
  const activeUser = JSON.parse(sessionStorage.getItem("activeUser"));
  if (!activeUser) {
    // Redirigir a login si no hay sesión
    window.location.href = pathPrefix + "index.html";
    return null;
  }
  return activeUser;
}

// Cerrar Sesión
function logout(pathPrefix = "") {
  sessionStorage.removeItem("activeUser");
  window.location.href = pathPrefix + "index.html";
}

// Notificaciones flotantes (Toasts)
function showToast(message, type = 'primary') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'danger') icon = '🚨';
  
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-in 0.3s forwards reverse cubic-bezier(0.175, 0.885, 0.32, 1)';
    toast.addEventListener('animationend', () => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    });
  }, 4000);
}

// Renderizar Barra Lateral Dinámica según Rol de Usuario
function renderSidebar(activePage, pathPrefix = "") {
  const activeUser = checkSession(pathPrefix);
  if (!activeUser) return; // Si no hay sesión, aborta (checkSession redirige)
  
  const role = activeUser.role; // 'admin' o 'vendedor'

  // Resolver rutas relativas
  const route = (pageName) => {
    const isSubDir = pathPrefix === "../";
    if (pageName === "dashboard") return isSubDir ? "../dashboard.html" : "dashboard.html";
    if (pageName === "logout") return "#"; // Manejado por onclick
    return isSubDir ? `${pageName}.html` : `pages/${pageName}.html`;
  };

  // Definición de todos los links
  const allLinks = [
    { id: 'dashboard', name: 'Dashboard', icon: '', role: ['admin', 'vendedor'] },
    { id: 'libros', name: 'Libros', icon: '', role: ['admin'] },
    { id: 'autores', name: 'Autores', icon: '', role: ['admin'] },
    { id: 'editoriales', name: 'Editoriales', icon: '', role: ['admin'] },
    { id: 'categorias', name: 'Categorías', icon: '', role: ['admin'] },
    { id: 'clientes', name: 'Clientes', icon: '', role: ['admin', 'vendedor'] },
    { id: 'ventas', name: 'Ventas', icon: '', role: ['admin', 'vendedor'] },
    { id: 'reservas', name: 'Reservas', icon: '', role: ['admin', 'vendedor'] },
    { id: 'inventario', name: 'Inventario', icon: '', role: ['admin', 'vendedor'] },
    { id: 'reportes', name: 'Reportes', icon: '', role: ['admin'] },
  ];

  // Generar HTML de links autorizados
  let navLinksHTML = "";
  allLinks.forEach(link => {
    if (link.role.includes(role)) {
      const activeClass = activePage === link.id ? 'active' : '';
      navLinksHTML += `
        <a href="${route(link.id)}" class="nav-link ${activeClass}">
          <span class="icon">${link.icon}</span> ${link.name}
        </a>
      `;
    }
  });

  const sidebarHTML = `
    <aside class="sidebar">
      <a href="${route('dashboard')}" class="sidebar-logo">
        <span>📖</span> LIBRERIA
      </a>
      
      <div class="sidebar-user">
        <span class="sidebar-user-name">${activeUser.name}</span>
        <span class="sidebar-user-role">${role === 'admin' ? 'Administrador' : 'Vendedor'}</span>
      </div>

      <nav class="sidebar-nav">
        ${navLinksHTML}
      </nav>

      <div class="sidebar-footer">
        <a href="#" onclick="logoutUser('${pathPrefix}')" class="nav-link" style="color: var(--danger); border: 1px solid rgba(239,68,68,0.15);">
          <span class="icon"></span> Cerrar Sesión
        </a>
      </div>
    </aside>
  `;

  document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
}

// Función global de Logout enlazada al botón del sidebar
window.logoutUser = function(pathPrefix) {
  logout(pathPrefix);
};
