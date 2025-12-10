// ey este es el js del carrito -bynd

// inicializar pagina del carrito -bynd
document.addEventListener('DOMContentLoaded', () => {
  renderizarCarrito();
});

// renderizar contenido del carrito -bynd
function renderizarCarrito() {
  const container = document.getElementById('cartContent');
  
  if (AppState.carrito.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <h2>Tu carrito está vacío</h2>
        <p>Agrega algunos productos deliciosos para comenzar</p>
        <a href="productos.html" class="btn-primary">Ver Productos</a>
      </div>
    `;
    return;
  }
  
  const subtotal = obtenerTotalCarrito();
  const envio = subtotal > 500 ? 0 : 50; // envio gratis arriba de 500 -bynd
  const total = subtotal + envio;
  
  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        ${AppState.carrito.map(item => crearCartItemHTML(item)).join('')}
      </div>
      
      <div class="order-summary">
        <h2>Resumen del Pedido</h2>
        
        <div class="summary-row">
          <span>Subtotal</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        
        <div class="summary-row">
          <span>Envío</span>
          <span>${envio === 0 ? 'Gratis' : '$' + envio.toFixed(2)}</span>
        </div>
        
        ${envio > 0 ? `
          <p style="font-size: 0.75rem; color: var(--color-muted); margin-top: 0.5rem;">
            ¡Envío gratis en compras mayores a $500!
          </p>
        ` : ''}
        
        <div class="summary-row total">
          <span>Total</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        
        <button class="checkout-btn" onclick="procesarCompra()">
          Proceder al Pago →
        </button>
        
        <a href="productos.html" class="continue-shopping">
          ← Seguir Comprando
        </a>
      </div>
    </div>
  `;
  
  // agregar eventos a los botones de cantidad y eliminar -bynd
  configurarEventosCarrito();
}

// crear HTML de un item del carrito -bynd
function crearCartItemHTML(item) {
  // aaa parsear el precio por si viene como string -bynd
  const precio = parseFloat(item.precio) || 0;
  
  return `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-image">
      
      <div class="cart-item-info">
        <h3>${item.nombre}</h3>
        <p class="cart-item-price">$${precio.toFixed(2)} c/u</p>
      </div>
      
      <div class="cart-item-actions">
        <button class="quantity-btn minus-btn" data-id="${item.id}">−</button>
        <span class="quantity-value">${item.cantidad}</span>
        <button class="quantity-btn plus-btn" data-id="${item.id}">+</button>
        
        <button class="remove-item-btn" data-id="${item.id}" title="Eliminar">X</button>
        
        <span class="cart-item-total" style="min-width: 80px; text-align: right; font-weight: 700; color: var(--color-primary);">
          $${(precio * item.cantidad).toFixed(2)}
        </span>
      </div>
    </div>
  `;
}

// configurar eventos de los botones del carrito -bynd
function configurarEventosCarrito() {
  // botones de menos -bynd
  document.querySelectorAll('.minus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = AppState.carrito.find(i => i.id === id);
      if (item) {
        actualizarCantidad(id, item.cantidad - 1);
        renderizarCarrito();
      }
    });
  });
  
  // botones de mas -bynd
  document.querySelectorAll('.plus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = AppState.carrito.find(i => i.id === id);
      if (item) {
        actualizarCantidad(id, item.cantidad + 1);
        renderizarCarrito();
      }
    });
  });
  
  // botones de eliminar -bynd
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = AppState.carrito.find(i => i.id === id);
      removerDelCarrito(id);
      mostrarToast(`${item ? item.nombre : 'Producto'} eliminado del carrito`);
      renderizarCarrito();
    });
  });
}

// procesar compra (simulado) -bynd
function procesarCompra() {
  if (!AppState.usuario) {
    mostrarToast('Inicia sesión para continuar con tu compra');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  // simular proceso de compra -bynd
  mostrarToast('Gracias por tu compra!');
  
  // limpiar carrito -bynd
  AppState.carrito = [];
  guardarEstadoLocal();
  actualizarUI();
  
  setTimeout(() => {
    renderizarCarrito();
  }, 2000);
}

// exponer funcion globalmente -bynd
window.procesarCompra = procesarCompra;
