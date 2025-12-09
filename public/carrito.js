// ey carrito.js - funcionalidad del carrito con ticket -bynd
// aaa usando nombres diferentes para evitar conflicto con app.js -bynd

console.log('[CARRITO] Script iniciando...');

let carritoItems = [];
let carritoUsuario = null;
let ubicacionDetectada = null;
let costoEnvioActual = 50;

document.addEventListener('DOMContentLoaded', () => {
    console.log('[CARRITO] DOM cargado, iniciando...');
    initCarritoPage();
});

// aaa inicializar carrito -bynd
function initCarritoPage() {
    console.log('[CARRITO] initCarritoPage()');
    
    const usuarioStr = localStorage.getItem('usuario');
    console.log('[CARRITO] Usuario en localStorage:', usuarioStr);
    
    if (!usuarioStr) {
        console.log('[CARRITO] No hay sesión, mostrando mensaje');
        document.getElementById('sinSesion').style.display = 'block';
        
        const navLogin = document.getElementById('navLogin');
        const navPerfil = document.getElementById('navPerfil');
        if (navLogin) navLogin.style.display = 'block';
        if (navPerfil) navPerfil.style.display = 'none';
        return;
    }

    try {
        carritoUsuario = JSON.parse(usuarioStr);
        console.log('[CARRITO] Usuario parseado:', carritoUsuario);
    } catch (e) {
        console.error('[CARRITO] Error parseando usuario:', e);
        document.getElementById('sinSesion').style.display = 'block';
        return;
    }

    const navLogin = document.getElementById('navLogin');
    const navPerfil = document.getElementById('navPerfil');
    if (navLogin) navLogin.style.display = 'none';
    if (navPerfil) navPerfil.style.display = 'block';

    console.log('[CARRITO] Cargando datos del carrito...');
    cargarCarritoData();
    cargarSaldoActual();
    detectarUbicacionUsuario();
}

// chintrolas cargar carrito del servidor -bynd
async function cargarCarritoData() {
    console.log('[CARRITO] cargarCarritoData() para usuario:', carritoUsuario?.id);
    
    try {
        const url = `/api/carrito/${carritoUsuario.id}`;
        console.log('[CARRITO] Fetching:', url);
        
        const response = await fetch(url);
        console.log('[CARRITO] Response status:', response.status);
        
        carritoItems = await response.json();
        console.log('[CARRITO] Items recibidos:', carritoItems);

        if (!carritoItems || carritoItems.length === 0) {
            console.log('[CARRITO] Carrito vacío');
            document.getElementById('carritoVacio').style.display = 'block';
            document.getElementById('carritoContenido').style.display = 'none';
        } else {
            console.log('[CARRITO] Carrito tiene', carritoItems.length, 'items');
            document.getElementById('carritoVacio').style.display = 'none';
            document.getElementById('carritoContenido').style.display = 'grid';
            renderizarCarritoItems();
        }

        actualizarBadgeCarritoLocal();
    } catch (error) {
        console.error('[CARRITO] Error cargando carrito:', error);
        document.getElementById('carritoVacio').style.display = 'block';
        document.getElementById('carritoContenido').style.display = 'none';
    }
}

// q chidoteee cargar saldo del usuario -bynd
async function cargarSaldoActual() {
    console.log('[CARRITO] cargarSaldoActual()');
    
    try {
        const response = await fetch(`/api/usuarios/${carritoUsuario.id}`);
        const data = await response.json();
        console.log('[CARRITO] Datos usuario:', data);

        if (response.ok) {
            carritoUsuario.saldo = parseFloat(data.saldo);
            localStorage.setItem('usuario', JSON.stringify(carritoUsuario));
            
            const saldoEl = document.getElementById('saldoUsuario');
            if (saldoEl) {
                saldoEl.textContent = `$${carritoUsuario.saldo.toFixed(2)}`;
            }
            console.log('[CARRITO] Saldo actualizado:', carritoUsuario.saldo);
            verificarSaldoSuficiente();
        }
    } catch (error) {
        console.error('[CARRITO] Error cargando saldo:', error);
    }
}

// ey renderizar items del carrito -bynd
function renderizarCarritoItems() {
    console.log('[CARRITO] renderizarCarritoItems()');
    
    const lista = document.getElementById('carritoLista');
    if (!lista) {
        console.error('[CARRITO] No se encontró #carritoLista');
        return;
    }
    
    const imgPlaceholder = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400';

    lista.innerHTML = carritoItems.map(item => {
        console.log('[CARRITO] Renderizando item:', item);
        const precio = parseFloat(item.producto?.precio) || 0;
        const subtotal = precio * item.cantidad;
        
        return `
            <div class="carrito-item">
                <img src="${item.producto?.imagen || imgPlaceholder}" alt="${item.producto?.nombre || 'Producto'}" 
                     onerror="this.src='${imgPlaceholder}'">
                <div class="item-info">
                    <h4>${item.producto?.nombre || 'Sin nombre'}</h4>
                    <span class="item-precio">$${precio.toFixed(2)} c/u</span>
                </div>
                <div class="item-cantidad">
                    <button class="btn-cantidad" onclick="cambiarCantidadItem(${item.productoId}, -1)">−</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-cantidad" onclick="cambiarCantidadItem(${item.productoId}, 1)">+</button>
                </div>
                <div class="item-subtotal">
                    $${subtotal.toFixed(2)}
                </div>
                <button class="btn-eliminar" onclick="eliminarItemCarrito(${item.productoId})">×</button>
            </div>
        `;
    }).join('');

    calcularTotalesCarrito();
}

// aaa cambiar cantidad de item -bynd
async function cambiarCantidadItem(productoId, delta) {
    console.log('[CARRITO] cambiarCantidadItem()', productoId, delta);
    
    const item = carritoItems.find(i => i.productoId === productoId);
    if (!item) {
        console.error('[CARRITO] Item no encontrado:', productoId);
        return;
    }

    const nuevaCantidad = item.cantidad + delta;
    console.log('[CARRITO] Nueva cantidad:', nuevaCantidad);

    if (nuevaCantidad <= 0) {
        eliminarItemCarrito(productoId);
        return;
    }

    // chintrolas validar stock -bynd
    if (nuevaCantidad > item.producto.stock) {
        console.warn('[CARRITO] Stock insuficiente');
        mostrarAlerta(`Solo hay ${item.producto.stock} disponibles`, 'error');
        return;
    }

    try {
        const response = await fetch(`/api/carrito/${carritoUsuario.id}/${productoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: nuevaCantidad })
        });

        console.log('[CARRITO] Response actualizar:', response.status);

        if (response.ok) {
            item.cantidad = nuevaCantidad;
            renderizarCarritoItems();
            actualizarBadgeCarritoLocal();
        } else {
            const data = await response.json();
            mostrarAlerta(data.error || 'Error al actualizar', 'error');
        }
    } catch (error) {
        console.error('[CARRITO] Error actualizando cantidad:', error);
    }
}

// q chidoteee eliminar item del carrito -bynd
async function eliminarItemCarrito(productoId) {
    console.log('[CARRITO] eliminarItemCarrito()', productoId);
    
    try {
        const response = await fetch(`/api/carrito/${carritoUsuario.id}/${productoId}`, {
            method: 'DELETE'
        });

        console.log('[CARRITO] Response eliminar:', response.status);

        if (response.ok) {
            carritoItems = carritoItems.filter(i => i.productoId !== productoId);
            
            if (carritoItems.length === 0) {
                document.getElementById('carritoVacio').style.display = 'block';
                document.getElementById('carritoContenido').style.display = 'none';
            } else {
                renderizarCarritoItems();
            }
            
            actualizarBadgeCarritoLocal();
        }
    } catch (error) {
        console.error('[CARRITO] Error eliminando item:', error);
    }
}

// ey vaciar carrito completo -bynd
async function vaciarCarrito() {
    console.log('[CARRITO] vaciarCarrito()');
    
    if (!confirm('¿Vaciar todo el carrito?')) return;

    try {
        const response = await fetch(`/api/carrito/${carritoUsuario.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carritoItems = [];
            document.getElementById('carritoVacio').style.display = 'block';
            document.getElementById('carritoContenido').style.display = 'none';
            actualizarBadgeCarritoLocal();
        }
    } catch (error) {
        console.error('[CARRITO] Error vaciando carrito:', error);
    }
}

// aaa calcular totales -bynd
function calcularTotalesCarrito() {
    console.log('[CARRITO] calcularTotalesCarrito()');
    
    const subtotal = carritoItems.reduce((sum, item) => {
        const precio = parseFloat(item.producto?.precio) || 0;
        return sum + (precio * item.cantidad);
    }, 0);
    
    const tipoEnvioEl = document.querySelector('input[name="tipoEnvio"]:checked');
    const tipoEnvio = tipoEnvioEl?.value || 'domicilio';
    costoEnvioActual = tipoEnvio === 'domicilio' ? 50 : 0;
    
    const subtotalConEnvio = subtotal + costoEnvioActual;
    const iva = subtotalConEnvio * 0.16;
    const total = subtotalConEnvio + iva;

    console.log('[CARRITO] Totales:', { subtotal, costoEnvioActual, iva, total });

    const subtotalEl = document.getElementById('subtotal');
    const costoEnvioEl = document.getElementById('costoEnvio');
    const ivaEl = document.getElementById('iva');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (costoEnvioEl) costoEnvioEl.textContent = `$${costoEnvioActual.toFixed(2)}`;
    if (ivaEl) ivaEl.textContent = `$${iva.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    verificarSaldoSuficiente();
}

// chintrolas verificar si hay saldo suficiente -bynd
function verificarSaldoSuficiente() {
    console.log('[CARRITO] verificarSaldoSuficiente()');
    
    const totalEl = document.getElementById('total');
    if (!totalEl) return;
    
    const totalText = totalEl.textContent;
    const total = parseFloat(totalText.replace('$', '')) || 0;
    const saldo = carritoUsuario?.saldo || 0;

    console.log('[CARRITO] Verificando saldo:', { saldo, total });

    const btnPagar = document.getElementById('btnPagar');
    const mensajeSaldo = document.getElementById('mensajeSaldo');

    if (btnPagar) {
        if (saldo < total || saldo === 0) {
            btnPagar.disabled = true;
            btnPagar.classList.add('disabled');
            if (mensajeSaldo) mensajeSaldo.style.display = 'block';
        } else {
            btnPagar.disabled = false;
            btnPagar.classList.remove('disabled');
            if (mensajeSaldo) mensajeSaldo.style.display = 'none';
        }
    }
}

// q chidoteee actualizar tipo de envio -bynd
function actualizarEnvio() {
    console.log('[CARRITO] actualizarEnvio()');
    calcularTotalesCarrito();
}

// ================================================
// ey GEOLOCALIZACIÓN -bynd
// ================================================

async function detectarUbicacionUsuario() {
    console.log('[CARRITO] detectarUbicacionUsuario()');
    
    const statusEl = document.getElementById('ubicacionStatus');
    
    try {
        // aaa intentar con IP primero -bynd
        console.log('[CARRITO] Intentando detección por IP...');
        const response = await fetch('http://ip-api.com/json/?lang=es');
        const data = await response.json();
        console.log('[CARRITO] Respuesta IP-API:', data);

        if (data.status === 'success') {
            ubicacionDetectada = {
                lat: data.lat,
                lon: data.lon,
                ciudad: data.city,
                estado: data.regionName,
                pais: data.country
            };

            mostrarUbicacionDetectada(`${data.city}, ${data.regionName}`);
        } else {
            throw new Error('IP detection failed');
        }
    } catch (error) {
        console.error('[CARRITO] Error detección IP:', error);
        
        // chintrolas fallback a geolocation del navegador -bynd
        if (navigator.geolocation) {
            console.log('[CARRITO] Intentando geolocalización del navegador...');
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    console.log('[CARRITO] Geolocalización exitosa:', position.coords);
                    ubicacionDetectada = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    await obtenerDireccionReversa(ubicacionDetectada.lat, ubicacionDetectada.lon);
                },
                (err) => {
                    console.error('[CARRITO] Error geolocalización:', err);
                    if (statusEl) {
                        statusEl.innerHTML = '<span class="ubicacion-icon">○</span><span>No se pudo detectar ubicación</span>';
                    }
                }
            );
        } else {
            console.warn('[CARRITO] Geolocalización no disponible');
            if (statusEl) {
                statusEl.innerHTML = '<span class="ubicacion-icon">○</span><span>Geolocalización no disponible</span>';
            }
        }
    }
}

// q chidoteee obtener direccion con reverse geocoding -bynd
async function obtenerDireccionReversa(lat, lon) {
    console.log('[CARRITO] obtenerDireccionReversa()', lat, lon);
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await response.json();
        console.log('[CARRITO] Respuesta Nominatim:', data);

        if (data.address) {
            const ciudad = data.address.city || data.address.town || data.address.village || '';
            const estado = data.address.state || '';
            mostrarUbicacionDetectada(`${ciudad}, ${estado}`);
        }
    } catch (error) {
        console.error('[CARRITO] Error obteniendo dirección:', error);
    }
}

function mostrarUbicacionDetectada(direccion) {
    console.log('[CARRITO] mostrarUbicacionDetectada()', direccion);
    
    const statusEl = document.getElementById('ubicacionStatus');
    const resultadoEl = document.getElementById('ubicacionResultado');
    const direccionEl = document.getElementById('ubicacionDireccion');
    
    if (statusEl) statusEl.style.display = 'none';
    if (resultadoEl) resultadoEl.style.display = 'block';
    if (direccionEl) direccionEl.textContent = direccion;
}

function solicitarUbicacion() {
    console.log('[CARRITO] solicitarUbicacion()');
    
    if (navigator.geolocation) {
        const statusEl = document.getElementById('ubicacionStatus');
        const resultadoEl = document.getElementById('ubicacionResultado');
        
        if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.innerHTML = '<span class="ubicacion-icon">◎</span><span>Actualizando ubicación...</span>';
        }
        if (resultadoEl) resultadoEl.style.display = 'none';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                ubicacionDetectada = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                await obtenerDireccionReversa(ubicacionDetectada.lat, ubicacionDetectada.lon);
            },
            () => {
                mostrarAlerta('No se pudo obtener ubicación', 'error');
                if (statusEl) {
                    statusEl.innerHTML = '<span class="ubicacion-icon">○</span><span>Error al detectar</span>';
                }
            }
        );
    }
}

// ================================================
// ey MODAL DE SALDO -bynd
// ================================================

function mostrarModalSaldo() {
    console.log('[CARRITO] mostrarModalSaldo()');
    
    const inputEl = document.getElementById('inputAgregarSaldo');
    const errorEl = document.getElementById('errorSaldo');
    const modalEl = document.getElementById('modalAgregarSaldo');
    
    if (inputEl) inputEl.value = '';
    if (errorEl) errorEl.textContent = '';
    if (modalEl) modalEl.classList.add('active');
}

function cerrarModalSaldo() {
    console.log('[CARRITO] cerrarModalSaldo()');
    const modalEl = document.getElementById('modalAgregarSaldo');
    if (modalEl) modalEl.classList.remove('active');
}

function setSaldoRapido(cantidad) {
    console.log('[CARRITO] setSaldoRapido()', cantidad);
    const inputEl = document.getElementById('inputAgregarSaldo');
    if (inputEl) inputEl.value = cantidad;
}

// aaa agregar saldo con validaciones JS -bynd
async function agregarSaldoUsuario() {
    console.log('[CARRITO] agregarSaldoUsuario()');
    
    const inputEl = document.getElementById('inputAgregarSaldo');
    const errorEl = document.getElementById('errorSaldo');
    
    if (!inputEl) return;
    
    const input = inputEl.value;
    if (errorEl) errorEl.textContent = '';

    // chintrolas validaciones front -bynd
    const cantidad = parseFloat(input);

    if (!input || input.trim() === '') {
        if (errorEl) errorEl.textContent = 'Ingresa una cantidad';
        return;
    }

    if (isNaN(cantidad)) {
        if (errorEl) errorEl.textContent = 'Ingresa un número válido';
        return;
    }

    if (cantidad <= 0) {
        if (errorEl) errorEl.textContent = 'La cantidad debe ser mayor a 0';
        return;
    }

    if (cantidad > 999999999999) {
        if (errorEl) errorEl.textContent = 'La cantidad máxima es $999,999,999,999';
        return;
    }

    try {
        console.log('[CARRITO] Enviando saldo al servidor...');
        const response = await fetch(`/api/usuarios/${carritoUsuario.id}/saldo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad })
        });

        const data = await response.json();
        console.log('[CARRITO] Respuesta saldo:', data);

        if (response.ok) {
            carritoUsuario.saldo = data.nuevoSaldo;
            localStorage.setItem('usuario', JSON.stringify(carritoUsuario));
            
            const saldoEl = document.getElementById('saldoUsuario');
            if (saldoEl) saldoEl.textContent = `$${data.nuevoSaldo.toFixed(2)}`;
            
            cerrarModalSaldo();
            verificarSaldoSuficiente();
            mostrarAlerta(`Saldo agregado: $${cantidad.toFixed(2)}`, 'success');
        } else {
            if (errorEl) errorEl.textContent = data.error || 'Error al agregar saldo';
        }
    } catch (error) {
        console.error('[CARRITO] Error agregando saldo:', error);
        if (errorEl) errorEl.textContent = 'Error de conexión';
    }
}

// ================================================
// q chidoteee PROCESAR COMPRA -bynd
// ================================================

async function procesarCompra() {
    console.log('[CARRITO] procesarCompra()');
    
    const tipoEnvioEl = document.querySelector('input[name="tipoEnvio"]:checked');
    const tipoEnvio = tipoEnvioEl?.value || 'domicilio';
    const direccionEl = document.getElementById('ubicacionDireccion');
    const direccion = direccionEl?.textContent || '';

    console.log('[CARRITO] Datos compra:', { tipoEnvio, direccion, costoEnvioActual });

    try {
        const response = await fetch(`/api/comprar/${carritoUsuario.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                envio: tipoEnvio === 'domicilio' ? 50 : 0,
                tipoEnvio,
                direccion: tipoEnvio === 'domicilio' ? direccion : ''
            })
        });

        const data = await response.json();
        console.log('[CARRITO] Respuesta compra:', data);

        if (response.ok) {
            // ey actualizar saldo en UI -bynd
            carritoUsuario.saldo = data.nuevoSaldo;
            localStorage.setItem('usuario', JSON.stringify(carritoUsuario));
            
            const saldoEl = document.getElementById('saldoUsuario');
            if (saldoEl) saldoEl.textContent = `$${data.nuevoSaldo.toFixed(2)}`;

            // aaa mostrar ticket -bynd
            mostrarTicketCompra(data);

            // chintrolas vaciar carrito local -bynd
            carritoItems = [];
            actualizarBadgeCarritoLocal();
        } else {
            mostrarAlerta(data.error || 'Error al procesar compra', 'error');
        }
    } catch (error) {
        console.error('[CARRITO] Error procesando compra:', error);
        mostrarAlerta('Error de conexión', 'error');
    }
}

// q chidoteee mostrar ticket de compra -bynd
function mostrarTicketCompra(ticket) {
    console.log('[CARRITO] mostrarTicketCompra()', ticket);
    
    const fecha = new Date(ticket.fecha);
    const fechaStr = fecha.toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const ticketEl = document.getElementById('ticketCompra');
    if (ticketEl) {
        ticketEl.innerHTML = `
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
    }

    const modalEl = document.getElementById('modalTicket');
    if (modalEl) modalEl.classList.add('active');
}

function cerrarModalTicket() {
    console.log('[CARRITO] cerrarModalTicket()');
    const modalEl = document.getElementById('modalTicket');
    if (modalEl) modalEl.classList.remove('active');
    // ey recargar página para mostrar carrito vacío -bynd
    window.location.reload();
}

// aaa actualizar badge del carrito -bynd
function actualizarBadgeCarritoLocal() {
    console.log('[CARRITO] actualizarBadgeCarritoLocal()');
    const total = carritoItems.reduce((sum, item) => sum + item.cantidad, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = total;
    console.log('[CARRITO] Badge actualizado:', total);
}

console.log('[CARRITO] Script cargado completamente');
