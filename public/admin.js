// ey admin.js - panel de administracion con graficos -bynd

let productos = [];
let usuarios = [];
let historial = [];
let chartVentasDia, chartCategorias, chartProductos;

document.addEventListener('DOMContentLoaded', () => {
    verificarAdmin();
    initTabs();
    initForms();
    cargarDashboard();
});

// aaa verificar que sea admin -bynd
function verificarAdmin() {
    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(usuario);
    if (user.rol !== 'admin') {
        mostrarAlerta('Acceso denegado', 'error');
        window.location.href = 'productos.html';
        return;
    }

    document.getElementById('btnCerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('usuario');
        window.location.href = 'login.html';
    });
}

// chintrolas inicializar tabs -bynd
function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
            document.getElementById(`section${capitalizar(tab.dataset.section)}`).style.display = 'block';

            // q chidoteee cargar datos de la seccion -bynd
            switch (tab.dataset.section) {
                case 'dashboard':
                    cargarDashboard();
                    break;
                case 'productos':
                    cargarProductos();
                    break;
                case 'usuarios':
                    cargarUsuarios();
                    break;
                case 'historial':
                    cargarHistorial();
                    break;
            }
        });
    });
}

function capitalizar(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ey inicializar formularios -bynd
function initForms() {
    document.getElementById('formProducto').addEventListener('submit', guardarProducto);
    document.getElementById('formUsuario').addEventListener('submit', guardarUsuario);
}

// ================================================
// aaa DASHBOARD CON GRAFICOS -bynd
// ================================================

async function cargarDashboard() {
    try {
        const response = await fetch('/api/admin/estadisticas');
        const data = await response.json();

        // chintrolas actualizar stats -bynd
        document.getElementById('statVentas').textContent = `$${data.resumen.ventasTotales.toFixed(2)}`;
        document.getElementById('statPedidos').textContent = data.resumen.totalPedidos;
        document.getElementById('statClientes').textContent = data.resumen.totalUsuarios;
        document.getElementById('statProductos').textContent = data.resumen.totalProductos;

        // q chidoteee crear graficos -bynd
        crearGraficoVentasDia(data.ventasPorDia);
        crearGraficoCategorias(data.ventasPorCategoria);
        crearGraficoProductos(data.productosMasVendidos);
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

// ey grafico de ventas por dia -bynd
function crearGraficoVentasDia(datos) {
    const ctx = document.getElementById('chartVentasDia').getContext('2d');
    
    if (chartVentasDia) chartVentasDia.destroy();

    const labels = datos.map(d => {
        const fecha = new Date(d.dia);
        return fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
    });

    chartVentasDia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas ($)',
                data: datos.map(d => d.total),
                borderColor: '#E8FF00',
                backgroundColor: 'rgba(232, 255, 0, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
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
                    grid: { color: '#E5E5E5' },
                    ticks: {
                        callback: value => '$' + value
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// aaa grafico de categorias -bynd
function crearGraficoCategorias(datos) {
    const ctx = document.getElementById('chartCategorias').getContext('2d');
    
    if (chartCategorias) chartCategorias.destroy();

    const colores = ['#E8FF00', '#FF3366', '#0A0A0A', '#737373', '#D4D4D4', '#1a472a', '#2d5a3d'];

    chartCategorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: datos.map(d => d.categoria || 'Sin categoría'),
            datasets: [{
                data: datos.map(d => d.total),
                backgroundColor: colores,
                borderColor: '#0A0A0A',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { family: 'JetBrains Mono', size: 11 },
                        padding: 15
                    }
                }
            }
        }
    });
}

// chintrolas grafico de productos mas vendidos -bynd
function crearGraficoProductos(datos) {
    const ctx = document.getElementById('chartProductos').getContext('2d');
    
    if (chartProductos) chartProductos.destroy();

    chartProductos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.map(d => d.nombre),
            datasets: [{
                label: 'Unidades vendidas',
                data: datos.map(d => parseInt(d.total_vendido)),
                backgroundColor: '#E8FF00',
                borderColor: '#0A0A0A',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: '#E5E5E5' }
                },
                y: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ================================================
// q chidoteee CRUD PRODUCTOS -bynd
// ================================================

async function cargarProductos() {
    try {
        const response = await fetch('/api/admin/productos');
        productos = await response.json();
        renderizarProductos();
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function renderizarProductos() {
    const tbody = document.getElementById('tablaProductos');
    const imgPlaceholder = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400';

    tbody.innerHTML = productos.map(p => `
        <tr>
            <td>${p.id}</td>
            <td><img src="${p.imagen || imgPlaceholder}" alt="${p.nombre}" class="tabla-img" onerror="this.src='${imgPlaceholder}'"></td>
            <td>${p.nombre}</td>
            <td><span class="badge">[${p.categoria}]</span></td>
            <td>$${parseFloat(p.precio).toFixed(2)}</td>
            <td>${p.stock}</td>
            <td>
                <button class="btn-tabla" onclick="editarProducto(${p.id})">Editar</button>
                <button class="btn-tabla btn-danger" onclick="eliminarProducto(${p.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ey abrir modal para nuevo producto -bynd
function abrirModalProducto() {
    document.getElementById('modalProductoTitulo').textContent = 'Nuevo Producto';
    document.getElementById('formProducto').reset();
    document.getElementById('productoId').value = '';
    limpiarErroresProducto();
    document.getElementById('modalProducto').classList.add('active');
}

function cerrarModalProducto() {
    document.getElementById('modalProducto').classList.remove('active');
}

// aaa editar producto existente -bynd
function editarProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    document.getElementById('modalProductoTitulo').textContent = 'Editar Producto';
    document.getElementById('productoId').value = producto.id;
    document.getElementById('productoNombre').value = producto.nombre;
    document.getElementById('productoDescripcion').value = producto.descripcion || '';
    document.getElementById('productoPrecio').value = parseFloat(producto.precio);
    document.getElementById('productoStock').value = producto.stock;
    document.getElementById('productoCategoria').value = producto.categoria;
    document.getElementById('productoImagen').value = producto.imagen || '';

    limpiarErroresProducto();
    document.getElementById('modalProducto').classList.add('active');
}

function limpiarErroresProducto() {
    document.querySelectorAll('#formProducto .error-msg').forEach(el => el.textContent = '');
}

// chintrolas guardar producto con validaciones JS -bynd
async function guardarProducto(e) {
    e.preventDefault();
    limpiarErroresProducto();

    const id = document.getElementById('productoId').value;
    const nombre = document.getElementById('productoNombre').value;
    const descripcion = document.getElementById('productoDescripcion').value;
    const precio = document.getElementById('productoPrecio').value;
    const stock = document.getElementById('productoStock').value;
    const categoria = document.getElementById('productoCategoria').value;
    const imagen = document.getElementById('productoImagen').value;

    // q chidoteee validaciones front -bynd
    let hayErrores = false;

    if (!nombre || nombre.trim().length < 2) {
        document.getElementById('errorProductoNombre').textContent = 'Mínimo 2 caracteres';
        hayErrores = true;
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0 || precioNum > 999999.99) {
        document.getElementById('errorProductoPrecio').textContent = 'Precio inválido (0.01 - 999,999.99)';
        hayErrores = true;
    }

    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0 || stockNum > 999999) {
        document.getElementById('errorProductoStock').textContent = 'Stock inválido (0 - 999,999)';
        hayErrores = true;
    }

    if (!categoria) {
        document.getElementById('errorProductoCategoria').textContent = 'Selecciona una categoría';
        hayErrores = true;
    }

    if (hayErrores) return;

    const datos = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || 'Sin descripción',
        precio: precioNum,
        stock: stockNum,
        categoria,
        imagen: imagen.trim()
    };

    try {
        const url = id ? `/api/productos/${id}` : '/api/productos';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const data = await response.json();

        if (response.ok) {
            cerrarModalProducto();
            cargarProductos();
            mostrarAlerta(id ? 'Producto actualizado' : 'Producto creado', 'success');
        } else {
            document.getElementById('errorProductoGeneral').textContent = data.error;
        }
    } catch (error) {
        console.error('Error guardando producto:', error);
        document.getElementById('errorProductoGeneral').textContent = 'Error de conexión';
    }
}

// ey eliminar producto -bynd
async function eliminarProducto(id) {
    if (!confirm('¿Eliminar este producto?')) return;

    try {
        const response = await fetch(`/api/productos/${id}`, { method: 'DELETE' });

        if (response.ok) {
            cargarProductos();
            mostrarAlerta('Producto eliminado', 'success');
        } else {
            const data = await response.json();
            mostrarAlerta(data.error || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error eliminando producto:', error);
    }
}

// ================================================
// aaa CRUD USUARIOS -bynd
// ================================================

async function cargarUsuarios() {
    try {
        const response = await fetch('/api/usuarios');
        usuarios = await response.json();
        renderizarUsuarios();
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

function renderizarUsuarios() {
    const tbody = document.getElementById('tablaUsuarios');

    tbody.innerHTML = usuarios.map(u => `
        <tr>
            <td>${u.id}</td>
            <td><code>${u.username}</code></td>
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td><span class="badge ${u.rol === 'admin' ? 'badge-admin' : ''}">[${u.rol}]</span></td>
            <td>$${parseFloat(u.saldo).toFixed(2)}</td>
            <td>
                <button class="btn-tabla" onclick="editarUsuario(${u.id})">Editar</button>
                <button class="btn-tabla btn-danger" onclick="eliminarUsuario(${u.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// chintrolas editar usuario -bynd
function editarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    document.getElementById('usuarioId').value = usuario.id;
    document.getElementById('usuarioUsername').value = usuario.username;
    document.getElementById('usuarioNombre').value = usuario.nombre;
    document.getElementById('usuarioEmail').value = usuario.email;
    document.getElementById('usuarioRol').value = usuario.rol;
    document.getElementById('usuarioSaldo').value = parseFloat(usuario.saldo);

    limpiarErroresUsuario();
    document.getElementById('modalUsuario').classList.add('active');
}

function cerrarModalUsuario() {
    document.getElementById('modalUsuario').classList.remove('active');
}

function limpiarErroresUsuario() {
    document.querySelectorAll('#formUsuario .error-msg').forEach(el => el.textContent = '');
}

// q chidoteee guardar usuario -bynd
async function guardarUsuario(e) {
    e.preventDefault();
    limpiarErroresUsuario();

    const id = document.getElementById('usuarioId').value;
    const nombre = document.getElementById('usuarioNombre').value;
    const email = document.getElementById('usuarioEmail').value;
    const rol = document.getElementById('usuarioRol').value;
    const saldo = document.getElementById('usuarioSaldo').value;

    // ey validaciones front -bynd
    let hayErrores = false;

    if (!nombre || nombre.trim().length < 2) {
        document.getElementById('errorUsuarioNombre').textContent = 'Mínimo 2 caracteres';
        hayErrores = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        document.getElementById('errorUsuarioEmail').textContent = 'Email inválido';
        hayErrores = true;
    }

    const saldoNum = parseFloat(saldo);
    if (isNaN(saldoNum) || saldoNum < 0 || saldoNum > 999999999999) {
        document.getElementById('errorUsuarioSaldo').textContent = 'Saldo inválido (0 - 999,999,999,999)';
        hayErrores = true;
    }

    if (hayErrores) return;

    try {
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: nombre.trim(),
                email: email.trim().toLowerCase(),
                rol,
                saldo: saldoNum
            })
        });

        const data = await response.json();

        if (response.ok) {
            cerrarModalUsuario();
            cargarUsuarios();
            mostrarAlerta('Usuario actualizado', 'success');
        } else {
            document.getElementById('errorUsuarioGeneral').textContent = data.error;
        }
    } catch (error) {
        console.error('Error guardando usuario:', error);
        document.getElementById('errorUsuarioGeneral').textContent = 'Error de conexión';
    }
}

// aaa eliminar usuario -bynd
async function eliminarUsuario(id) {
    if (!confirm('¿Eliminar este usuario?')) return;

    try {
        const response = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });

        if (response.ok) {
            cargarUsuarios();
            mostrarAlerta('Usuario eliminado', 'success');
        } else {
            const data = await response.json();
            mostrarAlerta(data.error || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error eliminando usuario:', error);
    }
}

// ================================================
// chintrolas HISTORIAL DE VENTAS -bynd
// ================================================

async function cargarHistorial(fechaInicio = '', fechaFin = '') {
    try {
        let url = '/api/admin/historial';
        const params = new URLSearchParams();
        
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);
        
        if (params.toString()) url += '?' + params.toString();

        const response = await fetch(url);
        historial = await response.json();
        renderizarHistorial();
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

function renderizarHistorial() {
    const tbody = document.getElementById('tablaHistorial');

    if (historial.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;">No hay ventas registradas</td></tr>';
        return;
    }

    tbody.innerHTML = historial.map(h => {
        const fecha = new Date(h.fecha);
        const fechaStr = fecha.toLocaleDateString('es-MX', { 
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        return `
            <tr>
                <td><strong>#${h.id}</strong></td>
                <td>${fechaStr}</td>
                <td>${h.cliente_nombre}<br><code>${h.cliente_username}</code></td>
                <td>${h.productos.length} productos</td>
                <td>$${h.subtotal.toFixed(2)}</td>
                <td>$${h.envio.toFixed(2)}</td>
                <td>$${h.iva.toFixed(2)}</td>
                <td><strong>$${h.total.toFixed(2)}</strong></td>
                <td>
                    <button class="btn-tabla" onclick="verDetalle(${h.id})">Ver Ticket</button>
                </td>
            </tr>
        `;
    }).join('');
}

// q chidoteee filtrar historial por fecha -bynd
function filtrarHistorial() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    cargarHistorial(fechaInicio, fechaFin);
}

function limpiarFiltros() {
    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFin').value = '';
    cargarHistorial();
}

// ey ver detalle de venta (ticket) -bynd
function verDetalle(id) {
    const venta = historial.find(h => h.id === id);
    if (!venta) return;

    document.getElementById('detalleNumero').textContent = venta.id;

    const fecha = new Date(venta.fecha);
    const fechaStr = fecha.toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    document.getElementById('ticketPreview').innerHTML = `
        <div class="ticket">
            <div class="ticket-header">
                <h2>La Desesperanza</h2>
                <p>Panadería Artesanal</p>
            </div>
            <div class="ticket-info">
                <p><strong>Venta #:</strong> ${venta.id}</p>
                <p><strong>Fecha:</strong> ${fechaStr}</p>
                <p><strong>Cliente:</strong> ${venta.cliente_nombre}</p>
                <p><strong>Tipo de envío:</strong> ${venta.tipo_envio === 'domicilio' ? 'A domicilio' : 'Recoger en tienda'}</p>
                ${venta.direccion_envio ? `<p><strong>Dirección:</strong> ${venta.direccion_envio}</p>` : ''}
            </div>
            <div class="ticket-productos">
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${venta.productos.map(p => `
                            <tr>
                                <td>${p.producto_nombre}</td>
                                <td>${p.cantidad}</td>
                                <td>$${p.producto_precio.toFixed(2)}</td>
                                <td>$${p.subtotal.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="ticket-totales">
                <p><span>Subtotal:</span> <span>$${venta.subtotal.toFixed(2)}</span></p>
                <p><span>Envío:</span> <span>$${venta.envio.toFixed(2)}</span></p>
                <p><span>IVA (16%):</span> <span>$${venta.iva.toFixed(2)}</span></p>
                <p class="ticket-total"><span>TOTAL:</span> <span>$${venta.total.toFixed(2)}</span></p>
            </div>
            <div class="ticket-footer">
                <p>¡Gracias por su compra!</p>
                <p>La Desesperanza — Donde cada pan cuenta una historia</p>
            </div>
        </div>
    `;

    document.getElementById('modalDetalle').classList.add('active');
}

function cerrarModalDetalle() {
    document.getElementById('modalDetalle').classList.remove('active');
}

// aaa imprimir ticket -bynd
function imprimirTicket() {
    const contenido = document.getElementById('ticketPreview').innerHTML;
    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html>
        <head>
            <title>Ticket de Venta</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                .ticket-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                .ticket-header h2 { margin: 0; font-size: 18px; }
                .ticket-header p { margin: 5px 0; font-size: 12px; }
                .ticket-info { font-size: 11px; margin-bottom: 10px; }
                .ticket-info p { margin: 3px 0; }
                .ticket-productos table { width: 100%; border-collapse: collapse; font-size: 10px; }
                .ticket-productos th, .ticket-productos td { padding: 4px 2px; text-align: left; }
                .ticket-productos th { border-bottom: 1px solid #000; }
                .ticket-totales { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; font-size: 11px; }
                .ticket-totales p { display: flex; justify-content: space-between; margin: 3px 0; }
                .ticket-total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
                .ticket-footer { text-align: center; border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px; font-size: 10px; }
            </style>
        </head>
        <body>${contenido}</body>
        </html>
    `);
    ventana.document.close();
    ventana.print();
}
