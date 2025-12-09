-- ey schema de la base de datos de la panaderia sin halloween -bynd
-- ejecutar esto en supabase sql editor -bynd

-- aaa tabla de productos -bynd
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    imagen VARCHAR(500),
    categoria VARCHAR(100),
    stock INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- q chidoteee tabla de usuarios -bynd
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente',
    saldo DECIMAL(10, 2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ey tabla de pedidos -bynd
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    estado VARCHAR(50) DEFAULT 'pendiente',
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- chintrolas tabla de detalle de pedidos -bynd
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- aaa tabla del carrito -bynd
CREATE TABLE IF NOT EXISTS carrito (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, producto_id)
);

-- q chidoteee insertamos productos de panaderia normal -bynd
INSERT INTO productos (nombre, descripcion, precio, imagen, categoria, stock) VALUES
    -- Pan dulce tradicional -bynd
    ('Concha de Vainilla', 'Pan dulce tradicional mexicano con cobertura de vainilla', 18.00, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', 'pan-dulce', 100),
    ('Concha de Chocolate', 'Pan dulce tradicional mexicano con cobertura de chocolate', 18.00, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 'pan-dulce', 100),
    ('Cuerno de Mantequilla', 'Cuerno hojaldrado con mantequilla', 22.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', 'pan-dulce', 80),
    ('Oreja', 'Pan hojaldrado con azúcar caramelizada', 20.00, 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400', 'pan-dulce', 70),
    ('Polvorón', 'Galleta tradicional de mantequilla que se deshace', 15.00, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400', 'galletas', 120),
    
    -- Pasteles -bynd
    ('Pastel de Chocolate', 'Delicioso pastel de tres leches con chocolate', 380.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', 'pasteles', 15),
    ('Pastel de Fresa', 'Pastel esponjoso con fresas naturales y crema', 350.00, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400', 'pasteles', 12),
    ('Pastel Red Velvet', 'Pastel red velvet con frosting de queso crema', 420.00, 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=400', 'pasteles', 10),
    ('Cheesecake New York', 'Cheesecake estilo New York con base de galleta', 320.00, 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400', 'pasteles', 8),
    
    -- Galletas -bynd
    ('Galletas de Chispas de Chocolate', 'Galletas suaves con chispas de chocolate', 35.00, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 'galletas', 150),
    ('Galletas de Avena', 'Galletas crujientes de avena con pasas', 30.00, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400', 'galletas', 100),
    ('Galletas de Mantequilla', 'Galletas clásicas de mantequilla', 28.00, 'https://images.unsplash.com/photo-1618923850107-d1a234d7a73a?w=400', 'galletas', 120),
    
    -- Cupcakes -bynd
    ('Cupcake de Vainilla', 'Cupcake esponjoso con betún de vainilla', 45.00, 'https://images.unsplash.com/photo-1519869325930-281384150729?w=400', 'cupcakes', 50),
    ('Cupcake de Chocolate', 'Cupcake de chocolate con ganache', 48.00, 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400', 'cupcakes', 50),
    ('Cupcake Red Velvet', 'Cupcake red velvet con frosting de queso crema', 52.00, 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400', 'cupcakes', 40),
    
    -- Pan salado -bynd
    ('Baguette Artesanal', 'Baguette francesa recién horneada', 35.00, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400', 'pan-salado', 40),
    ('Pan de Caja Integral', 'Pan de caja con harina integral', 55.00, 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400', 'pan-salado', 30),
    ('Bolillo', 'Pan blanco tradicional mexicano', 8.00, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', 'pan-salado', 200),
    ('Telera', 'Pan para tortas tradicional', 10.00, 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400', 'pan-salado', 150),
    ('Croissant', 'Croissant francés hojaldrado', 38.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', 'pan-salado', 60),
    
    -- Postres -bynd
    ('Dona Glaseada', 'Dona esponjosa con glaseado de azúcar', 25.00, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400', 'postres', 80),
    ('Dona de Chocolate', 'Dona cubierta de chocolate', 28.00, 'https://images.unsplash.com/photo-1527904324834-3bda86da6771?w=400', 'postres', 70),
    ('Rol de Canela', 'Rol de canela con glaseado de queso crema', 42.00, 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400', 'postres', 45),
    ('Brownie', 'Brownie de chocolate intenso con nueces', 38.00, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400', 'postres', 60)
ON CONFLICT DO NOTHING;

-- ey usuario admin y cliente demo -bynd
INSERT INTO usuarios (email, password_hash, nombre, rol, saldo) VALUES
    ('admin@ladesesperanza.mx', 'admin123', 'Administrador', 'admin', 10000),
    ('cliente@ejemplo.com', 'cliente123', 'Cliente Demo', 'cliente', 500)
ON CONFLICT (email) DO NOTHING;

-- aaa indices para mejor rendimiento -bynd
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
