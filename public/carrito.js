// ey carrito.js - funcionalidad del carrito con ticket -bynd

let carrito = [];
let usuarioActual = null;
let ubicacionActual = null;
let costoEnvio = 50;

document.addEventListener('DOMContentLoaded', () => {
    initCarrito();
});

// aaa inicializar carrito -bynd
function initCarrito() {
    const usuario = localStorage.getItem('usuario');
    
    if (!usuario) {
        document.getElementById('sinSesion').style.display = 'block';
        document.getElementById('navLogin').style.display = 'block';
        document.getElementById('navPerfil').style.display = 'none';
        return;
    }

    usuarioActual = JSON.parse(usuario);
    document.getElementById('navLogin').style.display = 'none';
    document.getElementById('navPerfil').style.display = 'block';

    cargarCarrito();
    cargarSaldoUsuario();
    detectarUbicacion();
}

// chintrolas cargar carrito del servidor -bynd
async function cargarCarrito() {
    try {
        const response = await fetch(`/api/carrito/${usuarioActual.id}`);
        carrito = await response.json();

        if (carrito.length === 0) {
            document.getElementById('carritoVacio').style.display = 'block';
            document.getElementById('carritoContenido').style.display = 'none';
        } else {
            document.getElementById('carritoVacio').style.display = 'none';
            document.getElementById('carritoContenido').style.display = 'grid';
            renderizarCarrito();
        }

        actualizarBadge();
    } catch (error) {
        console.error('Error cargando carrito:', error);
    }
}

// q chidoteee cargar saldo del usuario -bynd
async function cargarSaldoUsuario() {
    try {
        const response = await fetch(`/api/usuarios/${usuarioActual.id}`);
        const data = await response.json();

        if (response.ok) {
            usuarioActual.saldo = parseFloat(data.saldo);
            localStorage.setItem('usuario', JSON.stringify(usuarioActual));
            document.getElementById('saldoUsuario').textContent = `$${usuarioActual.saldo.toFixed(2)}`;
            verificarSaldo();
        }
    } catch (error) {
        console.error('Error cargando saldo:', error);
    }
}

// ey renderizar items del carrito -bynd
function renderizarCarrito() {
    const lista = document.getElementById('carritoLista');
    const imgPlaceholder = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400';

    lista.innerHTML = carrito.map(item => `
        <div class="carrito-item">
            <img src="${item.producto.imagen || imgPlaceholder}" alt="${item.producto.nombre}" 
                 onerror="this.src='${imgPlaceholder}'">
            <div class="item-info">
                <h4>${item.producto.nombre}</h4>
                <span class="item-precio">$${item.producto.precio.toFixed(2)} c/u</span>
            </div>
            <div class="item-cantidad">
                <button class="btn-cantidad" onclick="cambiarCantidad(${item.productoId}, -1)">−</button>
                <span>${item.cantidad}</span>
                <button class="btn-cantidad" onclick="cambiarCantidad(${item.productoId}, 1)">+</button>
            </div>
            <div class="item-subtotal">
                $${(item.producto.precio * item.cantidad).toFixed(2)}
            </div>
            <button class="btn-eliminar" onclick="eliminarItem(${item.productoId})">×</button>
        </div>
    `).join('');

    calcularTotales();
}

// aaa cambiar cantidad de item -bynd
async function cambiarCantidad(productoId, delta) {
    const item = carrito.find(i => i.productoId === productoId);
    if (!item) return;

    const nuevaCantidad = item.cantidad + delta;

    if (nuevaCantidad <= 0) {
        eliminarItem(productoId);
        return;
    }

    // chintrolas validar stock -bynd
    if (nuevaCantidad > item.producto.stock) {
        mostrarAlerta(`Solo hay ${item.producto.stock} disponibles`, 'error');
        return;
    }

    try {
        const response = await fetch(`/api/carrito/${usuarioActual.id}/${productoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: nuevaCantidad })
        });

        if (response.ok) {
            item.cantidad = nuevaCantidad;
            renderizarCarrito();
            actualizarBadge();
        } else {
            const data = await response.json();
            mostrarAlerta(data.error || 'Error al actualizar', 'error');
        }
    } catch (error) {
        console.error('Error actualizando cantidad:', error);
    }
}

// q chidoteee eliminar item del carrito -bynd
async function eliminarItem(productoId) {
    try {
        const response = await fetch(`/api/carrito/${usuarioActual.id}/${productoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carrito = carrito.filter(i => i.productoId !== productoId);
            
            if (carrito.length === 0) {
                document.getElementById('carritoVacio').style.display = 'block';
                document.getElementById('carritoContenido').style.display = 'none';
            } else {
                renderizarCarrito();
            }
            
            actualizarBadge();
        }
    } catch (error) {
        console.error('Error eliminando item:', error);
    }
}

// ey vaciar carrito completo -bynd
async function vaciarCarrito() {
    if (!confirm('¿Vaciar todo el carrito?')) return;

    try {
        const response = await fetch(`/api/carrito/${usuarioActual.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carrito = [];
            document.getElementById('carritoVacio').style.display = 'block';
            document.getElementById('carritoContenido').style.display = 'none';
            actualizarBadge();
        }
    } catch (error) {
        console.error('Error vaciando carrito:', error);
    }
}

// aaa calcular totales -bynd
function calcularTotales() {
    const subtotal = carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    const tipoEnvio = document.querySelector('input[name="tipoEnvio"]:checked')?.value || 'domicilio';
    costoEnvio = tipoEnvio === 'domicilio' ? 50 : 0;
    
    const subtotalConEnvio = subtotal + costoEnvio;
    const iva = subtotalConEnvio * 0.16;
    const total = subtotalConEnvio + iva;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('costoEnvio').textContent = `$${costoEnvio.toFixed(2)}`;
    document.getElementById('iva').textContent = `$${iva.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;

    verificarSaldo();
}

// chintrolas verificar si hay saldo suficiente -bynd
function verificarSaldo() {
    const totalText = document.getElementById('total').textContent;
    const total = parseFloat(totalText.replace('$', ''));
    const saldo = usuarioActual?.saldo || 0;

    const btnPagar = document.getElementById('btnPagar');
    const mensajeSaldo = document.getElementById('mensajeSaldo');

    if (saldo < total || saldo === 0) {
        btnPagar.disabled = true;
        btnPagar.classList.add('disabled');
        mensajeSaldo.style.display = 'block';
    } else {
        btnPagar.disabled = false;
        btnPagar.classList.remove('disabled');
        mensajeSaldo.style.display = 'none';
    }
}

// q chidoteee actualizar tipo de envio -bynd
function actualizarEnvio() {
    calcularTotales();
}

// ================================================
// ey GEOLOCALIZACIÓN -bynd
// ================================================

async function detectarUbicacion() {
    const statusEl = document.getElementById('ubicacionStatus');
    
    try {
        // aaa intentar con IP primero -bynd
        const response = await fetch('http://ip-api.com/json/?lang=es');
        const data = await response.json();

        if (data.status === 'success') {
            ubicacionActual = {
                lat: data.lat,
                lon: data.lon,
                ciudad: data.city,
                estado: data.regionName,
                pais: data.country
            };

            mostrarUbicacion(`${data.city}, ${data.regionName}`);
        } else {
            throw new Error('IP detection failed');
        }
    } catch (error) {
        // chintrolas fallback a geolocation del navegador -bynd
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    ubicacionActual = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    await obtenerDireccion(ubicacionActual.lat, ubicacionActual.lon);
                },
                () => {
                    statusEl.innerHTML = '<span class="ubicacion-icon">○</span><span>No se pudo detectar ubicación</span>';
                }
            );
        } else {
            statusEl.innerHTML = '<span class="ubicacion-icon">○</span><span>Geolocalización no disponible</span>';
        }
    }
}

// q chidoteee obtener direccion con reverse geocoding -bynd
async function obtenerDireccion(lat, lon) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await response.json();

        if (data.address) {
            const ciudad = data.address.city || data.address.town || data.address.village || '';
            const estado = data.address.state || '';
            mostrarUbicacion(`${ciudad}, ${estado}`);
        }
    } catch (error) {
        console.error('Error obteniendo dirección:', error);
    }
}

function mostrarUbicacion(direccion) {
    document.getElementById('ubicacionStatus').style.display = 'none';
    document.getElementById('ubicacionResultado').style.display = 'block';
    document.getElementById('ubicacionDireccion').textContent = direccion;
}

function solicitarUbicacion() {
    if (navigator.geolocation) {
        document.getElementById('ubicacionStatus').style.display = 'block';
        document.getElementById('ubicacionStatus').innerHTML = '<span class="ubicacion-icon">◎</span><span>Actualizando ubicación...</span>';
        document.getElementById('ubicacionResultado').style.display = 'none';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                ubicacionActual = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                await obtenerDireccion(ubicacionActual.lat, ubicacionActual.lon);
            },
            () => {
                mostrarAlerta('No se pudo obtener ubicación', 'error');
                document.getElementById('ubicacionStatus').innerHTML = '<span class="ubicacion-icon">○</span><span>Error al detectar</span>';
            }
        );
    }
}

// ================================================
// ey MODAL DE SALDO -bynd
// ================================================

function mostrarModalSaldo() {
    document.getElementById('inputAgregarSaldo').value = '';
    document.getElementById('errorSaldo').textContent = '';
    document.getElementById('modalAgregarSaldo').classList.add('active');
}

function cerrarModalSaldo() {
    document.getElementById('modalAgregarSaldo').classList.remove('active');
}

function setSaldoRapido(cantidad) {
    document.getElementById('inputAgregarSaldo').value = cantidad;
}

// aaa agregar saldo con validaciones JS -bynd
async function agregarSaldoUsuario() {
    const input = document.getElementById('inputAgregarSaldo').value;
    const errorEl = document.getElementById('errorSaldo');
    errorEl.textContent = '';

    // chintrolas validaciones front -bynd
    const cantidad = parseFloat(input);

    if (!input || input.trim() === '') {
        errorEl.textContent = 'Ingresa una cantidad';
        return;
    }

    if (isNaN(cantidad)) {
        errorEl.textContent = 'Ingresa un número válido';
        return;
    }

    if (cantidad <= 0) {
        errorEl.textContent = 'La cantidad debe ser mayor a 0';
        return;
    }

    if (cantidad > 999999999999) {
        errorEl.textContent = 'La cantidad máxima es $999,999,999,999';
        return;
    }

    try {
        const response = await fetch(`/api/usuarios/${usuarioActual.id}/saldo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad })
        });

        const data = await response.json();

        if (response.ok) {
            usuarioActual.saldo = data.nuevoSaldo;
            localStorage.setItem('usuario', JSON.stringify(usuarioActual));
            document.getElementById('saldoUsuario').textContent = `$${data.nuevoSaldo.toFixed(2)}`;
            
            cerrarModalSaldo();
            verificarSaldo();
            mostrarAlerta(`Saldo agregado: $${cantidad.toFixed(2)}`, 'success');
        } else {
            errorEl.textContent = data.error || 'Error al agregar saldo';
        }
    } catch (error) {
        console.error('Error agregando saldo:', error);
        errorEl.textContent = 'Error de conexión';
    }
}

// ================================================
// q chidoteee PROCESAR COMPRA -bynd
// ================================================

async function procesarCompra() {
    const tipoEnvio = document.querySelector('input[name="tipoEnvio"]:checked')?.value || 'domicilio';
    const direccion = document.getElementById('ubicacionDireccion')?.textContent || '';

    try {
        const response = await fetch(`/api/comprar/${usuarioActual.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                envio: tipoEnvio === 'domicilio' ? 50 : 0,
                tipoEnvio,
                direccion: tipoEnvio === 'domicilio' ? direccion : ''
            })
        });

        const data = await response.json();

        if (response.ok) {
            // ey actualizar saldo en UI -bynd
            usuarioActual.saldo = data.nuevoSaldo;
            localStorage.setItem('usuario', JSON.stringify(usuarioActual));
            document.getElementById('saldoUsuario').textContent = `$${data.nuevoSaldo.toFixed(2)}`;

            // aaa mostrar ticket -bynd
            mostrarTicket(data);

            // chintrolas vaciar carrito local -bynd
            carrito = [];
            actualizarBadge();
        } else {
            mostrarAlerta(data.error || 'Error al procesar compra', 'error');
        }
    } catch (error) {
        console.error('Error procesando compra:', error);
        mostrarAlerta('Error de conexión', 'error');
    }
}

// q chidoteee mostrar ticket de compra -bynd
function mostrarTicket(ticket) {
    const fecha = new Date(ticket.fecha);
    const fechaStr = fecha.toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    document.getElementById('ticketCompra').innerHTML = `
        <div class="ticket">
            <div class="ticket-header">
                <h2>La Desesperanza</h2>
                <p>Panadería Artesanal</p>
            </div>
            <div class="ticket-info">
                <p><strong>Venta #:</strong> ${ticket.numeroVenta}</p>
                <p><strong>Fecha:</strong> ${fechaStr}</p>
                <p><strong>Cliente:</strong> ${ticket.cliente}</p>
                <p><strong>Tipo de envío:</strong> ${ticket.tipoEnvio === 'domicilio' ? 'A domicilio' : 'Recoger en tienda'}</p>
                ${ticket.direccion ? `<p><strong>Dirección:</strong> ${ticket.direccion}</p>` : ''}
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
                        ${ticket.productos.map(p => `
                            <tr>
                                <td>${p.nombre}</td>
                                <td>${p.cantidad}</td>
                                <td>$${p.precio.toFixed(2)}</td>
                                <td>$${p.subtotal.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="ticket-totales">
                <p><span>Subtotal:</span> <span>$${ticket.subtotal.toFixed(2)}</span></p>
                <p><span>Envío:</span> <span>$${ticket.envio.toFixed(2)}</span></p>
                <p><span>IVA (16%):</span> <span>$${ticket.iva.toFixed(2)}</span></p>
                <p class="ticket-total"><span>TOTAL:</span> <span>$${ticket.total.toFixed(2)}</span></p>
            </div>
            <div class="ticket-footer">
                <p>¡Gracias por su compra!</p>
                <p>La Desesperanza — Donde cada pan cuenta una historia</p>
            </div>
        </div>
    `;

    document.getElementById('modalTicket').classList.add('active');
}

function cerrarModalTicket() {
    document.getElementById('modalTicket').classList.remove('active');
    // ey recargar página para mostrar carrito vacío -bynd
    window.location.reload();
}

// aaa actualizar badge del carrito -bynd
function actualizarBadge() {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = total;
}
