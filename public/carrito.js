// ey carrito.js - logica del carrito de compras -bynd

// aaa variables -bynd
let carritoItems = [];
let saldoUsuario = 0;

// chintrolas inicializacion -bynd
document.addEventListener('DOMContentLoaded', () => {
    initCarrito();
});

function initCarrito() {
    const usuario = localStorage.getItem('usuario');
    
    if (!usuario) {
        // q chidoteee mostrar mensaje de sin sesion -bynd
        document.getElementById('sinSesion').style.display = 'block';
        return;
    }
    
    usuarioActual = JSON.parse(usuario);
    cargarCarrito();
    cargarSaldoUsuario();
}

// ey cargar carrito del servidor -bynd
async function cargarCarrito() {
    try {
        const response = await fetch(`/api/carrito/${usuarioActual.id}`);
        carritoItems = await response.json();
        
        if (carritoItems.length === 0) {
            document.getElementById('carritoVacio').style.display = 'block';
        } else {
            document.getElementById('carritoContenido').style.display = 'grid';
            renderizarCarrito();
        }
    } catch (error) {
        console.error('Error cargando carrito:', error);
    }
}

// aaa cargar saldo del usuario -bynd
async function cargarSaldoUsuario() {
    try {
        const response = await fetch(`/api/usuarios/${usuarioActual.id}`);
        const usuario = await response.json();
        saldoUsuario = usuario.saldo;
        document.getElementById('saldoUsuario').textContent = `$${saldoUsuario.toFixed(2)}`;
    } catch (error) {
        console.error('Error cargando saldo:', error);
    }
}

// chintrolas renderizar items del carrito -bynd
function renderizarCarrito() {
    const lista = document.getElementById('carritoLista');
    const imgPlaceholder = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400';
    
    lista.innerHTML = carritoItems.map(item => `
        <div class="carrito-item" data-id="${item.productoId}">
            <img src="${item.producto.imagen}" alt="${item.producto.nombre}" class="carrito-item-imagen" onerror="this.src='${imgPlaceholder}'">
            <div class="carrito-item-info">
                <h4 class="carrito-item-nombre">${item.producto.nombre}</h4>
                <p class="carrito-item-precio">$${item.producto.precio.toFixed(2)} c/u</p>
                <div class="cantidad-control">
                    <button class="cantidad-btn" onclick="cambiarCantidad(${item.productoId}, -1)">-</button>
                    <span class="cantidad-valor">${item.cantidad}</span>
                    <button class="cantidad-btn" onclick="cambiarCantidad(${item.productoId}, 1)">+</button>
                </div>
                <button class="btn-eliminar" onclick="eliminarItem(${item.productoId})">🗑️ Eliminar</button>
            </div>
            <div class="carrito-item-total">
                $${(item.producto.precio * item.cantidad).toFixed(2)}
            </div>
        </div>
    `).join('');
    
    calcularTotales();
}

// q chidoteee calcular totales -bynd
function calcularTotales() {
    const subtotal = carritoItems.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('iva').textContent = `$${iva.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    
    // ey verificar si tiene saldo suficiente -bynd
    const btnPagar = document.getElementById('btnPagar');
    const mensajeSaldo = document.getElementById('mensajeSaldo');
    
    if (total > saldoUsuario) {
        btnPagar.disabled = true;
        mensajeSaldo.style.display = 'block';
    } else {
        btnPagar.disabled = false;
        mensajeSaldo.style.display = 'none';
    }
}

// aaa cambiar cantidad de un item -bynd
async function cambiarCantidad(productoId, cambio) {
    const item = carritoItems.find(i => i.productoId === productoId);
    if (!item) return;
    
    const nuevaCantidad = item.cantidad + cambio;
    
    if (nuevaCantidad <= 0) {
        eliminarItem(productoId);
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
            actualizarBadgeCarrito();
        }
    } catch (error) {
        console.error('Error actualizando cantidad:', error);
    }
}

// chintrolas eliminar item del carrito -bynd
async function eliminarItem(productoId) {
    try {
        const response = await fetch(`/api/carrito/${usuarioActual.id}/${productoId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            carritoItems = carritoItems.filter(i => i.productoId !== productoId);
            
            if (carritoItems.length === 0) {
                document.getElementById('carritoContenido').style.display = 'none';
                document.getElementById('carritoVacio').style.display = 'block';
            } else {
                renderizarCarrito();
            }
            
            actualizarBadgeCarrito();
            mostrarAlerta('Producto eliminado', 'success');
        }
    } catch (error) {
        console.error('Error eliminando item:', error);
    }
}

// q chidoteee vaciar carrito completo -bynd
async function vaciarCarrito() {
    if (!confirm('¿Estás seguro de vaciar el carrito?')) return;
    
    try {
        const response = await fetch(`/api/carrito/${usuarioActual.id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            carritoItems = [];
            document.getElementById('carritoContenido').style.display = 'none';
            document.getElementById('carritoVacio').style.display = 'block';
            actualizarBadgeCarrito();
            mostrarAlerta('Carrito vaciado', 'success');
        }
    } catch (error) {
        console.error('Error vaciando carrito:', error);
    }
}

// ey procesar compra -bynd
async function procesarCompra() {
    try {
        const response = await fetch(`/api/comprar/${usuarioActual.id}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('¡Compra realizada con éxito!', 'success');
            
            // aaa actualizar saldo en localStorage -bynd
            usuarioActual.saldo = data.nuevoSaldo;
            localStorage.setItem('usuario', JSON.stringify(usuarioActual));
            
            setTimeout(() => {
                window.location.href = 'productos.html';
            }, 2000);
        } else {
            mostrarAlerta(data.error || 'Error al procesar la compra', 'error');
        }
    } catch (error) {
        console.error('Error procesando compra:', error);
        mostrarAlerta('Error al procesar la compra', 'error');
    }
}
