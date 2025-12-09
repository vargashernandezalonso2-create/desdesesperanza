// ey login.js - autenticacion con username y validaciones JS -bynd

document.addEventListener('DOMContentLoaded', () => {
    // aaa verificar si ya hay sesion -bynd
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        window.location.href = 'productos.html';
        return;
    }

    initTabs();
    initForms();
});

// chintrolas inicializar tabs -bynd
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            limpiarErrores();

            if (tab.dataset.tab === 'login') {
                formLogin.style.display = 'block';
                formRegistro.style.display = 'none';
            } else {
                formLogin.style.display = 'none';
                formRegistro.style.display = 'block';
            }
        });
    });
}

// q chidoteee inicializar formularios -bynd
function initForms() {
    document.getElementById('formLogin').addEventListener('submit', handleLogin);
    document.getElementById('formRegistro').addEventListener('submit', handleRegistro);
}

// ey limpiar mensajes de error -bynd
function limpiarErrores() {
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));
}

// aaa mostrar error en campo especifico -bynd
function mostrarError(campoId, mensaje) {
    const errorEl = document.getElementById(`error${campoId}`);
    if (errorEl) {
        errorEl.textContent = mensaje;
        errorEl.parentElement.classList.add('has-error');
    }
}

// chintrolas validar username -bynd
function validarUsername(username) {
    if (!username || username.trim() === '') {
        return { valido: false, error: 'El usuario es requerido' };
    }
    const regex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!regex.test(username.trim())) {
        return { valido: false, error: 'Usuario: 3-30 caracteres, solo letras, números y _' };
    }
    return { valido: true, valor: username.trim().toLowerCase() };
}

// q chidoteee validar email -bynd
function validarEmail(email) {
    if (!email || email.trim() === '') {
        return { valido: false, error: 'El email es requerido' };
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email.trim())) {
        return { valido: false, error: 'Ingresa un email válido' };
    }
    return { valido: true, valor: email.trim().toLowerCase() };
}

// ey validar texto -bynd
function validarTexto(texto, campo, minLength = 1, maxLength = 100) {
    if (!texto || texto.trim() === '') {
        return { valido: false, error: `El ${campo} es requerido` };
    }
    if (texto.trim().length < minLength) {
        return { valido: false, error: `Mínimo ${minLength} caracteres` };
    }
    if (texto.trim().length > maxLength) {
        return { valido: false, error: `Máximo ${maxLength} caracteres` };
    }
    return { valido: true, valor: texto.trim() };
}

// aaa validar contraseña -bynd
function validarPassword(password, minLength = 6) {
    if (!password || password === '') {
        return { valido: false, error: 'La contraseña es requerida' };
    }
    if (password.length < minLength) {
        return { valido: false, error: `Mínimo ${minLength} caracteres` };
    }
    if (password.length > 100) {
        return { valido: false, error: 'Máximo 100 caracteres' };
    }
    return { valido: true, valor: password };
}

// chintrolas manejar login -bynd
async function handleLogin(e) {
    e.preventDefault();
    limpiarErrores();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // q chidoteee validaciones front -bynd
    let hayErrores = false;

    const usernameVal = validarUsername(username);
    if (!usernameVal.valido) {
        mostrarError('LoginUsername', usernameVal.error);
        hayErrores = true;
    }

    const passVal = validarPassword(password, 1);
    if (!passVal.valido) {
        mostrarError('LoginPassword', passVal.error);
        hayErrores = true;
    }

    if (hayErrores) return;

    // ey enviar al servidor -bynd
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameVal.valor,
                password: passVal.valor
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('usuario', JSON.stringify(data));
            mostrarAlerta('Bienvenido ' + data.nombre, 'success');
            
            setTimeout(() => {
                if (data.rol === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'productos.html';
                }
            }, 1000);
        } else {
            mostrarError('LoginGeneral', data.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error en login:', error);
        mostrarError('LoginGeneral', 'Error de conexión');
    }
}

// aaa manejar registro -bynd
async function handleRegistro(e) {
    e.preventDefault();
    limpiarErrores();

    const username = document.getElementById('regUsername').value;
    const nombre = document.getElementById('regNombre').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    // chintrolas validaciones front -bynd
    let hayErrores = false;

    const usernameVal = validarUsername(username);
    if (!usernameVal.valido) {
        mostrarError('RegUsername', usernameVal.error);
        hayErrores = true;
    }

    const nombreVal = validarTexto(nombre, 'nombre', 2, 100);
    if (!nombreVal.valido) {
        mostrarError('RegNombre', nombreVal.error);
        hayErrores = true;
    }

    const emailVal = validarEmail(email);
    if (!emailVal.valido) {
        mostrarError('RegEmail', emailVal.error);
        hayErrores = true;
    }

    const passVal = validarPassword(password, 6);
    if (!passVal.valido) {
        mostrarError('RegPassword', passVal.error);
        hayErrores = true;
    }

    if (password !== passwordConfirm) {
        mostrarError('RegPasswordConfirm', 'Las contraseñas no coinciden');
        hayErrores = true;
    }

    if (hayErrores) return;

    // q chidoteee enviar al servidor -bynd
    try {
        const response = await fetch('/api/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameVal.valor,
                nombre: nombreVal.valor,
                email: emailVal.valor,
                password: passVal.valor
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('usuario', JSON.stringify(data));
            mostrarAlerta('Cuenta creada exitosamente', 'success');
            
            setTimeout(() => {
                window.location.href = 'productos.html';
            }, 1000);
        } else {
            mostrarError('RegGeneral', data.error || 'Error al crear cuenta');
        }
    } catch (error) {
        console.error('Error en registro:', error);
        mostrarError('RegGeneral', 'Error de conexión');
    }
}
