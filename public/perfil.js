// ey perfil.js - pagina de perfil del usuario con historial -bynd
let usuarioActual = null;
let historialCompras = [];

document.addEventListener('DOMContentLoaded', () => {
    initPerfil();
});

// aaa inicializar perfil -bynd
function initPerfil() {
    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
        document.getElementById('sinSesion').style.display = 'block';
        return;
    }
    
    usuarioActual = JSON.parse(usuario);
    document.getElementById('conSesion').style.display = 'block';
    
    // chintrolas cerrar sesion -bynd
    document.getElementById('btnCerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('usuario');
        window.location.href = 'login.html';
    });
    
    cargarDatosUsuario();
    cargarHistorial();
}

// q chidoteee cargar datos del usuario -bynd
async function cargarDatosUsuario() {
    try {
        const response = await fetch(`/api/usuarios/${usuarioActual.id}`);
        const data = await response.json();
        
        if (response.ok) {
            // ey actualizar localStorage -bynd
            usuarioActual = { ...usuarioActual, ...data };
            localStorage.setItem('usuario', JSON.stringify(usuarioActual));
            
            // aaa mostrar datos -bynd
            document.getElementById('perfilUsername').textContent = '@' + data.username;
            document.getElementById('perfilNombre').textContent = data.nombre;
            document.getElementById('perfilEmail').textContent = data.email;
            
            const fecha = new Date(data.created_at);
            document.getElementById('perfilFecha').textContent = fecha.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            document.getElementById('saldoGrande').textContent = `$${parseFloat(data.saldo).toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// chintrolas cargar historial de compras -bynd
async function cargarHistorial() {
    try {
        const response = await fetch(`/api/historial/${usuarioActual.id}`);
        historialCompras = await response.json();
        
        if (historialCompras.length === 0) {
            document.getElementById('historialVacio').style.display = 'block';
            document.getElementById('historialLista').style.display = 'none';
        } else {
            document.getElementById('historialVacio').style.display = 'none';
            renderizarHistorial();
        }
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

// q chidoteee renderizar historial -bynd
function renderizarHistorial() {
    const lista = document.getElementById('historialLista');
    lista.innerHTML = historialCompras.map(compra => {
        const fecha = new Date(compra.fecha);
        const fechaStr = fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const productosResumen = compra.productos.slice(0, 2).map(p => p.producto_nombre).join(', ');
        const masProductos = compra.productos.length > 2 ? ` +${compra.productos.length - 2} más` : '';
        
        return `
            <div class="compra-item">
                <div class="compra-header">
                    <span class="compra-numero">#${compra.id}</span>
                    <span class="compra-fecha">${fechaStr}</span>
                </div>
                <div class="compra-productos">${productosResumen}${masProductos}</div>
                <div class="compra-footer">
                    <span class="compra-total">$${compra.total.toFixed(2)}</span>
                    <button onclick="verTicket(${compra.id})" class="btn-ver-ticket">Ver Ticket</button>
                </div>
            </div>
        `;
    }).join('');
}

// ey ver ticket de compra -bynd
function verTicket(id) {
    const compra = historialCompras.find(c => c.id === id);
    if (!compra) return;
    
    document.getElementById('ticketNumero').textContent = compra.id;
    
    const fecha = new Date(compra.fecha);
    const fechaStr = fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    document.getElementById('ticketPreview').innerHTML = `
        <div class="ticket">
            <div class="ticket-header">
                <h3>La Desesperanza</h3>
                <p>Panadería Artesanal</p>
            </div>
            <div class="ticket-info">
                <p>Venta #: ${compra.id}</p>
                <p>Fecha: ${fechaStr}</p>
                <p>Tipo de envío: ${compra.tipo_envio === 'domicilio' ? 'A domicilio' : 'Recoger en tienda'}</p>
                ${compra.direccion_envio ? `<p>Dirección: ${compra.direccion_envio}</p>` : ''}
            </div>
            <table class="ticket-productos">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${compra.productos.map(p => `
                        <tr>
                            <td>${p.producto_nombre}</td>
                            <td>${p.cantidad}</td>
                            <td>$${p.producto_precio.toFixed(2)}</td>
                            <td>$${p.subtotal.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="ticket-totales">
                <p>Subtotal: $${compra.subtotal.toFixed(2)}</p>
                <p>Envío: $${compra.envio.toFixed(2)}</p>
                <p>IVA (16%): $${compra.iva.toFixed(2)}</p>
                <p class="total-final">TOTAL: $${compra.total.toFixed(2)}</p>
            </div>
            <div class="ticket-footer">
                <p>¡Gracias por su compra!</p>
                <p>La Desesperanza — Donde cada pan cuenta una historia</p>
            </div>
        </div>
    `;
    
    document.getElementById('modalDetalleCompra').classList.add('active');
}

function cerrarModalDetalle() {
    document.getElementById('modalDetalleCompra').classList.remove('active');
}

// aaa funciones de saldo -bynd
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

// chintrolas agregar saldo con validaciones JS -bynd
async function agregarSaldoUsuario() {
    const input = document.getElementById('inputAgregarSaldo').value;
    const errorEl = document.getElementById('errorSaldo');
    errorEl.textContent = '';
    
    // q chidoteee validaciones front -bynd
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cantidad })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // ey actualizar saldo en UI -bynd
            document.getElementById('saldoGrande').textContent = `$${data.nuevoSaldo.toFixed(2)}`;
            
            // aaa actualizar localStorage -bynd
            usuarioActual.saldo = data.nuevoSaldo;
            localStorage.setItem('usuario', JSON.stringify(usuarioActual));
            
            cerrarModalSaldo();
            
            // Crear alerta simple si no existe la función
            if (typeof mostrarAlerta === 'function') {
                mostrarAlerta(`Saldo agregado: $${cantidad.toFixed(2)}`, 'success');
            } else {
                alert(`Saldo agregado: $${cantidad.toFixed(2)}`);
            }
        } else {
            errorEl.textContent = data.error || 'Error al agregar saldo';
        }
    } catch (error) {
        console.error('Error agregando saldo:', error);
        errorEl.textContent = 'Error de conexión';
    }
}
