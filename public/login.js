// ey login.js - logica de autenticacion -bynd

// aaa verificar si ya hay sesion -bynd
document.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        // q chidoteee ya tiene sesion, redirigir -bynd
        window.location.href = 'index.html';
    }
});

// chintrolas cambiar entre tabs -bynd
function mostrarTab(tab) {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegistro = document.getElementById('tabRegistro');
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');
    
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegistro.classList.remove('active');
        formLogin.style.display = 'block';
        formRegistro.style.display = 'none';
    } else {
        tabRegistro.classList.add('active');
        tabLogin.classList.remove('active');
        formRegistro.style.display = 'block';
        formLogin.style.display = 'none';
    }
    
    // ey limpiar errores -bynd
    limpiarErrores();
}

// q chidoteee limpiar mensajes de error -bynd
function limpiarErrores() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

// aaa mostrar error en campo -bynd
function mostrarError(id, mensaje) {
    const error = document.getElementById(id);
    error.textContent = mensaje;
    error.style.display = 'block';
}

// ey manejar login -bynd
async function handleLogin(event) {
    event.preventDefault();
    limpiarErrores();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // chintrolas guardar usuario en localStorage -bynd
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            mostrarAlerta('¡Bienvenido!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            mostrarError('errorLoginPassword', data.error || 'Credenciales inválidas');
        }
    } catch (error) {
        console.error('Error en login:', error);
        mostrarError('errorLoginPassword', 'Error al conectar con el servidor');
    }
}

// q chidoteee manejar registro -bynd
async function handleRegistro(event) {
    event.preventDefault();
    limpiarErrores();
    
    const nombre = document.getElementById('registroNombre').value;
    const email = document.getElementById('registroEmail').value;
    const password = document.getElementById('registroPassword').value;
    const confirm = document.getElementById('registroConfirm').value;
    
    // aaa validar contraseñas -bynd
    if (password !== confirm) {
        mostrarError('errorRegistroConfirm', 'Las contraseñas no coinciden');
        return;
    }
    
    try {
        const response = await fetch('/api/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // ey guardar usuario en localStorage -bynd
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            mostrarAlerta('¡Cuenta creada exitosamente!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            mostrarError('errorRegistroEmail', data.error || 'Error al crear cuenta');
        }
    } catch (error) {
        console.error('Error en registro:', error);
        mostrarError('errorRegistroEmail', 'Error al conectar con el servidor');
    }
}
