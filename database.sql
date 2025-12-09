CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente',
    saldo DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(500),
    categoria VARCHAR(50),
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    total DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    iva DECIMAL(10,2) NOT NULL,
    envio DECIMAL(10,2) DEFAULT 0,
    tipo_envio VARCHAR(20) DEFAULT 'tienda',
    direccion_envio TEXT,
    estado VARCHAR(20) DEFAULT 'completado',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id),
    producto_id INT REFERENCES productos(id),
    producto_nombre VARCHAR(100) NOT NULL,
    producto_precio DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);


CREATE TABLE IF NOT EXISTS carrito (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    producto_id INT REFERENCES productos(id),
    cantidad INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, producto_id)
);


INSERT INTO usuarios (username, email, nombre, password, rol, saldo) VALUES
    ('admin', 'admin@ladesesperanza.mx', 'Administrador', '$2b$10$placeholder_hash_admin', 'admin', 10000.00),
    ('cliente', 'cliente@ejemplo.com', 'Cliente Demo', '$2b$10$placeholder_hash_cliente', 'cliente', 500.00)
ON CONFLICT (username) DO NOTHING;


INSERT INTO productos (nombre, descripcion, precio, imagen, categoria, stock) VALUES

    ('Concha Vainilla', 'Clásica concha con cobertura de vainilla', 18.00, 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400', 'pan-dulce', 50),
    ('Concha Chocolate', 'Concha tradicional con cobertura de chocolate', 18.00, 'https://images.unsplash.com/photo-1621236378699-8597faf6a176?w=400', 'pan-dulce', 50),
    ('Cuerno', 'Cuerno de mantequilla con azúcar', 20.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', 'pan-dulce', 40),
    ('Oreja', 'Oreja crujiente de hojaldre caramelizado', 22.00, 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400', 'pan-dulce', 35),
    ('Polvorón', 'Polvorón tradicional de naranja', 15.00, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 'pan-dulce', 60),
    ('Dona Glaseada', 'Dona esponjosa con glaseado de azúcar', 25.00, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400', 'pan-dulce', 45),
    
  
    ('Pastel Chocolate', 'Pastel de tres leches con cobertura de chocolate', 450.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', 'pasteles', 10),
    ('Pastel Fresa', 'Pastel de vainilla con fresas frescas y crema', 420.00, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400', 'pasteles', 8),
    ('Pastel Red Velvet', 'Clásico red velvet con frosting de queso crema', 480.00, 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=400', 'pasteles', 6),
    ('Cheesecake', 'Cheesecake New York con base de galleta', 380.00, 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400', 'pasteles', 12),

    ('Galletas Chispas', 'Galletas con chispas de chocolate', 45.00, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400', 'galletas', 100),
    ('Galletas Avena', 'Galletas de avena con pasas', 40.00, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400', 'galletas', 80),
    ('Galletas Mantequilla', 'Galletas de mantequilla artesanales', 38.00, 'https://images.unsplash.com/photo-1618923850107-d1a234d7a73a?w=400', 'galletas', 90),

    ('Cupcake Vainilla', 'Cupcake de vainilla con buttercream', 35.00, 'https://images.unsplash.com/photo-1519869325930-281384f4e36d?w=400', 'cupcakes', 40),
    ('Cupcake Red Velvet', 'Cupcake red velvet con frosting de queso', 38.00, 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400', 'cupcakes', 35),
    ('Cupcake Chocolate', 'Cupcake de chocolate con ganache', 38.00, 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400', 'cupcakes', 35),

    ('Baguette', 'Baguette artesanal crujiente', 35.00, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400', 'pan-salado', 30),
    ('Bolillo', 'Bolillo tradicional mexicano', 8.00, 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400', 'pan-salado', 100),
    ('Telera', 'Telera suave perfecta para tortas', 10.00, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', 'pan-salado', 80),
    ('Croissant', 'Croissant de mantequilla hojaldrado', 32.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', 'pan-salado', 25),
    
  
    ('Dona Chocolate', 'Dona cubierta de chocolate con sprinkles', 28.00, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400', 'postres', 50),
    ('Rol de Canela', 'Rol de canela con glaseado de vainilla', 35.00, 'https://images.unsplash.com/photo-1609127102567-8a9a21dc27d8?w=400', 'postres', 40),
    ('Brownie', 'Brownie de chocolate intenso con nueces', 38.00, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400', 'postres', 60),

    ('Rosca de Reyes', 'Rosca tradicional decorada con ate y fruta cristalizada', 280.00, 'https://images.unsplash.com/photo-1609950547346-a4cb964f6292?w=400', 'temporada', 25),
    ('Panettone Clásico', 'Pan italiano navideño con frutas confitadas y pasas', 320.00, 'https://images.unsplash.com/photo-1607803525558-ce28a0f9da67?w=400', 'temporada', 30),
    ('Tronco de Navidad', 'Pastel de chocolate enrollado decorado como tronco', 380.00, 'https://images.unsplash.com/photo-1481391943394-f04b5c54c5f3?w=400', 'temporada', 15),
    ('Galletas de Jengibre', 'Galletas navideñas decoradas con glaseado real', 65.00, 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400', 'temporada', 80),
    ('Stollen Alemán', 'Pan dulce alemán con mazapán y frutas secas', 350.00, 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=400', 'temporada', 20),
    ('Cupcakes Navideños', 'Cupcakes decorados con motivos navideños', 58.00, 'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=400', 'temporada', 60)
ON CONFLICT DO NOTHING;


CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido ON detalle_pedidos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
