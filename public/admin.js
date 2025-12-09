// ey admin.js - logica del panel de administracion -bynd

// aaa variables -bynd
let usuarioSeleccionado = null;
let productos = [];
let usuarios = [];

// chintrolas verificar acceso admin -bynd
document.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuario');
    
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }
    
    const usuarioData = JSON.parse(usuario);
    
    if (usuarioData.rol !== 'admin') {
        mostrarAlerta('No tienes permisos de administrador', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }
    
    document.getElementById('adminNombre').textContent = `Hola, ${usuarioData.nombre}`;
    cargarDatos();
});

// q chidoteee cargar todos los datos -bynd
async function cargarDatos() {
    await cargarProductos();
    await cargarUsuarios();
    actualizarStats();
}

// ey cargar productos -bynd
async function cargarProductos() {
    try {
        const response = await fetch('/api/productos');
        productos = await response.json();
        renderizarProductos();
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

// aaa cargar usuarios -bynd
async function cargarUsuarios() {
    try {
        const response = await fetch('/api/admin/usuarios');
        usuarios = await response.json();
        renderizarUsuarios();
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// chintrolas actualizar estadisticas -bynd
function actualizarStats() {
    document.getElementById('statProductos').textContent = productos.length;
    document.getElementById('statUsuarios').textContent = usuarios.length;
    document.getElementById('statPanDulce').textContent = productos.filter(p => p.categoria === 'pan-dulce').length;
    document.getElementById('statStock').textContent = productos.reduce((sum, p) => sum + p.stock, 0);
}

// q chidoteee renderizar tabla de productos -bynd
function renderizarProductos() {
    const tabla = document.getElementById('tablaProductos');
    
    tabla.innerHTML = productos.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.categoria}</td>
            <td>$${p.precio.toFixed(2)}</td>
            <td>${p.stock}</td>
            <td>
                <button class="btn-small btn-success" onclick="editarProducto(${p.id})">✏️</button>
                <button class="btn-small btn-danger" onclick="eliminarProducto(${p.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// ey renderizar tabla de usuarios -bynd
function renderizarUsuarios() {
    const tabla = document.getElementById('tablaUsuarios');
    
    tabla.innerHTML = usuarios.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td><span class="badge badge-${u.rol}">${u.rol}</span></td>
            <td>$${u.saldo.toFixed(2)}</td>
            <td>
                <button class="btn-small btn-success" onclick="mostrarModalSaldo(${u.id}, '${u.nombre}')">💰</button>
            </td>
        </tr>
    `).join('');
}

// aaa mostrar modal de saldo -bynd
function mostrarModalSaldo(usuarioId, nombre) {
    usuarioSeleccionado = usuarioId;
    document.getElementById('saldoUsuarioNombre').textContent = nombre;
    document.getElementById('inputSaldo').value = '';
    document.getElementById('modalSaldo').classList.add('active');
}

// chintrolas agregar saldo a usuario -bynd
async function agregarSaldo() {
    const cantidad = parseFloat(document.getElementById('inputSaldo').value);
    
    if (!cantidad || cantidad <= 0) {
        mostrarAlerta('Ingresa una cantidad válida', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/saldo/${usuarioSeleccionado}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad })
        });
        
        if (response.ok) {
            mostrarAlerta('Saldo agregado correctamente', 'success');
            cerrarModal('modalSaldo');
            cargarUsuarios();
        }
    } catch (error) {
        console.error('Error agregando saldo:', error);
        mostrarAlerta('Error al agregar saldo', 'error');
    }
}

// q chidoteee mostrar modal de producto -bynd
function mostrarModalProducto(id = null) {
    document.getElementById('modalProductoTitulo').textContent = id ? 'Editar Producto' : 'Nuevo Producto';
    document.getElementById('productoId').value = id || '';
    
    if (id) {
        const producto = productos.find(p => p.id === id);
        if (producto) {
            document.getElementById('productoNombre').value = producto.nombre;
            document.getElementById('productoDescripcion').value = producto.descripcion;
            document.getElementById('productoPrecio').value = producto.precio;
            document.getElementById('productoCategoria').value = producto.categoria;
            document.getElementById('productoStock').value = producto.stock;
            document.getElementById('productoImagen').value = producto.imagen;
        }
    } else {
        document.getElementById('formProducto').reset();
    }
    
    document.getElementById('modalProducto').classList.add('active');
}

// ey editar producto -bynd
function editarProducto(id) {
    mostrarModalProducto(id);
}

// aaa guardar producto (crear o actualizar) -bynd
async function guardarProducto() {
    const id = document.getElementById('productoId').value;
    const data = {
        nombre: document.getElementById('productoNombre').value,
        descripcion: document.getElementById('productoDescripcion').value,
        precio: parseFloat(document.getElementById('productoPrecio').value),
        categoria: document.getElementById('productoCategoria').value,
        stock: parseInt(document.getElementById('productoStock').value),
        imagen: document.getElementById('productoImagen').value || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'
    };
    
    try {
        let response;
        
        if (id) {
            // chintrolas actualizar producto existente -bynd
            response = await fetch(`/api/admin/productos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // q chidoteee crear nuevo producto -bynd
            response = await fetch('/api/admin/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            mostrarAlerta(id ? 'Producto actualizado' : 'Producto creado', 'success');
            cerrarModal('modalProducto');
            cargarProductos();
            actualizarStats();
        }
    } catch (error) {
        console.error('Error guardando producto:', error);
        mostrarAlerta('Error al guardar producto', 'error');
    }
}

// ey eliminar producto -bynd
async function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
        const response = await fetch(`/api/admin/productos/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            mostrarAlerta('Producto eliminado', 'success');
            cargarProductos();
            actualizarStats();
        }
    } catch (error) {
        console.error('Error eliminando producto:', error);
        mostrarAlerta('Error al eliminar producto', 'error');
    }
}

// aaa cerrar modal -bynd
function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
