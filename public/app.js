// ey app.js principal -bynd

console.log('[APP] Script iniciando...');

// aaa variables globales -bynd
const API_URL = '';
let usuarioActual = null;

// chintrolas inicializacion -bynd
document.addEventListener('DOMContentLoaded', () => {
    console.log('[APP] DOM cargado');
    initApp();
});

function initApp() {
    console.log('[APP] initApp()');
    
    // ey cargar usuario de localStorage -bynd
    const usuarioGuardado = localStorage.getItem('usuario');
    console.log('[APP] Usuario guardado:', usuarioGuardado);
    
    if (usuarioGuardado) {
        try {
            usuarioActual = JSON.parse(usuarioGuardado);
            console.log('[APP] Usuario parseado:', usuarioActual);
            actualizarUIUsuario();
        } catch (e) {
            console.error('[APP] Error parseando usuario:', e);
        }
    }
    
    // q chidoteee menu toggle para mobile -bynd
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // aaa actualizar badge del carrito -bynd
    actualizarBadgeCarrito();
    
    // ey cargar productos destacados si estamos en index -bynd
    const productosDestacados = document.getElementById('productosDestacados');
    if (productosDestacados) {
        console.log('[APP] Cargando productos destacados...');
        cargarProductosDestacados();
    }
    
    console.log('[APP] Inicialización completa');
}

// chintrolas funciones de usuario -bynd
function actualizarUIUsuario() {
    console.log('[APP] actualizarUIUsuario()');
    const btnLogin = document.getElementById('btnLogin');
    
    if (usuarioActual && btnLogin) {
        console.log('[APP] Actualizando UI para usuario:', usuarioActual.nombre);
        // q chidoteee crear menu de usuario -bynd
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <a href="perfil.html" class="user-info">
                Hola, <span>${usuarioActual.nombre}</span>
            </a>
            ${usuarioActual.rol === 'admin' ? '<a href="admin.html" class="btn-admin">[Admin]</a>' : ''}
            <button class="btn-logout" onclick="cerrarSesion()">Salir</button>
        `;
        
        btnLogin.replaceWith(userMenu);
    } else {
        console.log('[APP] No hay usuario o no hay btnLogin');
    }
}

function cerrarSesion() {
    console.log('[APP] cerrarSesion()');
    localStorage.removeItem('usuario');
    usuarioActual = null;
    mostrarAlerta('Sesión cerrada', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// ey funciones de productos -bynd
async function cargarProductosDestacados() {
    console.log('[APP] cargarProductosDestacados()');
    try {
        const response = await fetch(`${API_URL}/api/productos`);
        console.log('[APP] Response productos:', response.status);
        const productos = await response.json();
        console.log('[APP] Productos recibidos:', productos.length);
        
        // aaa mostrar solo 8 productos -bynd
        const destacados = productos.slice(0, 8);
        
        const container = document.getElementById('productosDestacados');
        container.innerHTML = destacados.map(producto => crearCardProducto(producto)).join('');
        
    } catch (error) {
        console.error('[APP] Error cargando productos:', error);
    }
}

function crearCardProducto(producto) {
    // ey fix del precio - convertir a numero si viene como string -bynd
    const precio = parseFloat(producto.precio) || 0;
    const imgPlaceholder = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400';
    
    return `
        <div class="producto-card">
            <div class="producto-imagen-wrapper">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-imagen" onerror="this.src='${imgPlaceholder}'">
            </div>
            <div class="producto-info">
                <span class="producto-categoria">[${producto.categoria}]</span>
                <h3 class="producto-nombre">${producto.nombre}</h3>
                <p class="producto-descripcion">${producto.descripcion}</p>
                <div class="producto-footer">
                    <span class="producto-precio">$${precio.toFixed(2)}</span>
                    <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id})">
                        Agregar →
                    </button>
                </div>
            </div>
        </div>
    `;
}

// chintrolas funciones del carrito -bynd
async function agregarAlCarrito(productoId) {
    console.log('[APP] agregarAlCarrito()', productoId);
    
    if (!usuarioActual) {
        console.log('[APP] No hay sesión, redirigiendo a login');
        mostrarAlerta('Inicia sesión para agregar productos', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    try {
        console.log('[APP] Agregando producto al carrito...');
        const response = await fetch(`${API_URL}/api/carrito/${usuarioActual.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productoId, cantidad: 1 })
        });
        
        console.log('[APP] Response agregar:', response.status);
        
        if (response.ok) {
            mostrarAlerta('Producto agregado al carrito', 'success');
            actualizarBadgeCarrito();
        } else {
            const data = await response.json();
            console.error('[APP] Error:', data);
            mostrarAlerta(data.error || 'Error al agregar', 'error');
        }
    } catch (error) {
        console.error('[APP] Error agregando al carrito:', error);
        mostrarAlerta('Error al agregar producto', 'error');
    }
}

async function actualizarBadgeCarrito() {
    console.log('[APP] actualizarBadgeCarrito()');
    
    const badge = document.getElementById('cartBadge');
    if (!badge) {
        console.log('[APP] No se encontró badge');
        return;
    }
    
    if (!usuarioActual) {
        console.log('[APP] No hay usuario, badge = 0');
        badge.textContent = '0';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/carrito/${usuarioActual.id}`);
        const carrito = await response.json();
        console.log('[APP] Carrito para badge:', carrito);
        
        const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        badge.textContent = total;
        console.log('[APP] Badge actualizado:', total);
    } catch (error) {
        console.error('[APP] Error actualizando badge:', error);
        badge.textContent = '0';
    }
}

// q chidoteee funcion de alertas -bynd
function mostrarAlerta(mensaje, tipo = 'success') {
    console.log('[APP] mostrarAlerta()', mensaje, tipo);
    
    // ey remover alertas anteriores -bynd
    const alertasAnteriores = document.querySelectorAll('.alert');
    alertasAnteriores.forEach(a => a.remove());
    
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = mensaje;
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

// aaa utilidades -bynd
function formatearPrecio(precio) {
    const num = parseFloat(precio) || 0;
    return `$${num.toFixed(2)} MXN`;
}

console.log('[APP] Script cargado completamente');
