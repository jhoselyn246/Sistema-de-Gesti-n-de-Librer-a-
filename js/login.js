// Lógica de Inicio de Sesión y Recuperación - BookStore

function procesarLogin(event) {
  event.preventDefault();

  const userField = document.getElementById("username").value.trim();
  const passField = document.getElementById("password").value;

  if (userField === "" || passField === "") {
    showToast("Por favor, rellene todos los campos.", "warning");
    return;
  }

  // Deshabilitar botón durante validación
  const btn = document.getElementById("btnLogin");
  btn.disabled = true;
  btn.innerHTML = "<span>⏳</span> Validando...";

  setTimeout(() => {
    if (userField === "admin" && passField === "admin123") {
      // Registrar sesión de Administrador
      const activeUser = {
        name: "Administrador General",
        username: "admin",
        role: "admin"
      };
      sessionStorage.setItem("activeUser", JSON.stringify(activeUser));
      showToast("¡Sesión iniciada como Administrador! Redirigiendo...", "success");
      
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
      
    } else if (userField === "vendedor" && passField === "vendedor123") {
      // Registrar sesión de Vendedor
      const activeUser = {
        name: "Vendedor de Caja",
        username: "vendedor",
        role: "vendedor"
      };
      sessionStorage.setItem("activeUser", JSON.stringify(activeUser));
      showToast("¡Sesión iniciada como Vendedor! Redirigiendo...", "success");
      
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
      
    } else {
      showToast("Usuario o contraseña incorrectos.", "danger");
      btn.disabled = false;
      btn.innerHTML = "<span>🚪</span> Iniciar Sesión";
    }
  }, 800);
}

// Modal de Recuperación
function abrirRecuperar() {
  document.getElementById("modalRecuperacion").classList.add("open");
}

function cerrarRecuperar() {
  document.getElementById("modalRecuperacion").classList.remove("open");
}

function simularRecuperacion() {
  const field = document.getElementById("recoveryEmail").value.trim();
  
  if (field === "") {
    showToast("Por favor, ingrese su correo o usuario.", "warning");
    return;
  }

  showToast(`Enlace enviado con éxito a: ${field}. Verifique su buzón.`, "success");
  document.getElementById("recoveryEmail").value = "";
  cerrarRecuperar();
}
