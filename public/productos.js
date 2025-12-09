// ey productos.js - logica del catalogo -bynd

// aaa variables -bynd
let todosLosProductos = [];
let categoriaActual = 'todos';
let busquedaActual = '';

// chintrolas inicializacion -bynd
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    initFiltros();
    initBusqueda();
    
    // q chidoteee revisar si viene categoria en URL -bynd
    const params = new URLSearchParams(window.location.search);
    const categoriaURL = params.get('categoria');
    if (categoriaURL) {
        categoriaActual = categoriaURL;
        actualizarBotonFiltro(categoriaURL);
    }
});

// ey cargar todos los productos -bynd
async function cargarProductos() {
    try {
        const response = await fetch('/api/productos');
        todosLosProductos = await response.json();
        filtrarYMostrar();
    } catch (error) {
        console.error('Error cargando productos:', error);
        document.getElementById('productosGrid').innerHTML = `
            <div class="no-results" style="grid-column: 1/-1;">
                <h3>Error al cargar</h3>
                <p>No se pudieron cargar los productos. Intenta de nuevo.</p>
            </div>
        `;
    }
}

// aaa inicializar filtros de categoria -bynd
function initFiltros() {
    const btns = document.querySelectorAll('.filtro-btn');
    
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // chintrolas remover active de todos -bynd
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            categoriaActual = btn.dataset.categoria;
            filtrarYMostrar();
        });
    });
}

// q chidoteee actualizar boton de filtro activo -bynd
function actualizarBotonFiltro(categoria) {
    const btns = document.querySelectorAll('.filtro-btn');
    btns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.categoria === categoria) {
            btn.classList.add('active');
        }
    });
}

// ey inicializar busqueda -bynd
function initBusqueda() {
    const input = document.getElementById('inputBusqueda');
    
    // aaa debounce para no hacer muchas busquedas -bynd
    let timeout;
    input.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            busquedaActual = e.target.value.toLowerCase();
            filtrarYMostrar();
        }, 300);
    });
}

// chintrolas filtrar y mostrar productos -bynd
function filtrarYMostrar() {
    let productosFiltrados = [...todosLosProductos];
    
    // q chidoteee filtrar por categoria -bynd
    if (categoriaActual !== 'todos') {
        productosFiltrados = productosFiltrados.filter(p => p.categoria === categoriaActual);
    }
    
    // ey filtrar por busqueda -bynd
    if (busquedaActual) {
        productosFiltrados = productosFiltrados.filter(p => 
            p.nombre.toLowerCase().includes(busquedaActual) ||
            p.descripcion.toLowerCase().includes(busquedaActual)
        );
    }
    
    mostrarProductos(productosFiltrados);
}

// aaa mostrar productos en el grid -bynd
function mostrarProductos(productos) {
    const grid = document.getElementById('productosGrid');
    const noResultados = document.getElementById('noResultados');
    
    if (productos.length === 0) {
        grid.innerHTML = '';
        noResultados.style.display = 'block';
        return;
    }
    
    noResultados.style.display = 'none';
    grid.innerHTML = productos.map(producto => crearCardProducto(producto)).join('');
}
