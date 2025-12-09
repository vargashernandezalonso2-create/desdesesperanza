// ey servidor principal de la panaderia conectado a supabase -bynd
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// aaa configuracion del pool de postgresql -bynd
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
});

// chintrolas probar conexion al iniciar -bynd
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Conectado a Supabase PostgreSQL'))
    .catch(err => console.error('❌ Error conectando a DB:', err.message));

// q chidoteee middleware -bynd
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== RUTAS API ========== -bynd

// ey obtener todos los productos -bynd
app.get('/api/productos', async (req, res) => {
    try {
        const { categoria, busqueda } = req.query;
        let query = 'SELECT * FROM productos WHERE activo = true';
        const params = [];
        
        if (categoria && categoria !== 'todos') {
            params.push(categoria);
            query += ` AND categoria = $${params.length}`;
        }
        
        if (busqueda) {
            params.push(`%${busqueda}%`);
            query += ` AND (nombre ILIKE $${params.length} OR descripcion ILIKE $${params.length})`;
        }
        
        query += ' ORDER BY id';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// aaa obtener producto por id -bynd
app.get('/api/productos/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// chintrolas obtener carrito -bynd
app.get('/api/carrito/:usuarioId', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, p.nombre, p.precio, p.imagen, p.descripcion
            FROM carrito c
            JOIN productos p ON c.producto_id = p.id
            WHERE c.usuario_id = $1
        `, [req.params.usuarioId]);
        
        // q chidoteee formatear respuesta -bynd
        const carrito = result.rows.map(row => ({
            productoId: row.producto_id,
            cantidad: row.cantidad,
            producto: {
                id: row.producto_id,
                nombre: row.nombre,
                precio: parseFloat(row.precio),
                imagen: row.imagen,
                descripcion: row.descripcion
            }
        }));
        
        res.json(carrito);
    } catch (error) {
        console.error('Error obteniendo carrito:', error);
        res.status(500).json({ error: 'Error al obtener carrito' });
    }
});

// ey agregar al carrito -bynd
app.post('/api/carrito/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { productoId, cantidad } = req.body;
        
        // aaa verificar si ya existe en el carrito -bynd
        const existe = await pool.query(
            'SELECT * FROM carrito WHERE usuario_id = $1 AND producto_id = $2',
            [usuarioId, productoId]
        );
        
        if (existe.rows.length > 0) {
            // chintrolas actualizar cantidad -bynd
            await pool.query(
                'UPDATE carrito SET cantidad = cantidad + $1 WHERE usuario_id = $2 AND producto_id = $3',
                [cantidad, usuarioId, productoId]
            );
        } else {
            // q chidoteee insertar nuevo -bynd
            await pool.query(
                'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES ($1, $2, $3)',
                [usuarioId, productoId, cantidad]
            );
        }
        
        res.json({ mensaje: 'Producto agregado al carrito' });
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        res.status(500).json({ error: 'Error al agregar al carrito' });
    }
});

// ey actualizar cantidad en carrito -bynd
app.put('/api/carrito/:usuarioId/:productoId', async (req, res) => {
    try {
        const { usuarioId, productoId } = req.params;
        const { cantidad } = req.body;
        
        if (cantidad <= 0) {
            await pool.query(
                'DELETE FROM carrito WHERE usuario_id = $1 AND producto_id = $2',
                [usuarioId, productoId]
            );
        } else {
            await pool.query(
                'UPDATE carrito SET cantidad = $1 WHERE usuario_id = $2 AND producto_id = $3',
                [cantidad, usuarioId, productoId]
            );
        }
        
        res.json({ mensaje: 'Carrito actualizado' });
    } catch (error) {
        console.error('Error actualizando carrito:', error);
        res.status(500).json({ error: 'Error al actualizar carrito' });
    }
});

// aaa eliminar del carrito -bynd
app.delete('/api/carrito/:usuarioId/:productoId', async (req, res) => {
    try {
        const { usuarioId, productoId } = req.params;
        await pool.query(
            'DELETE FROM carrito WHERE usuario_id = $1 AND producto_id = $2',
            [usuarioId, productoId]
        );
        res.json({ mensaje: 'Producto eliminado del carrito' });
    } catch (error) {
        console.error('Error eliminando del carrito:', error);
        res.status(500).json({ error: 'Error al eliminar del carrito' });
    }
});

// chintrolas vaciar carrito -bynd
app.delete('/api/carrito/:usuarioId', async (req, res) => {
    try {
        await pool.query('DELETE FROM carrito WHERE usuario_id = $1', [req.params.usuarioId]);
        res.json({ mensaje: 'Carrito vaciado' });
    } catch (error) {
        console.error('Error vaciando carrito:', error);
        res.status(500).json({ error: 'Error al vaciar carrito' });
    }
});

// q chidoteee login -bynd
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query(
            'SELECT id, email, nombre, rol, saldo FROM usuarios WHERE email = $1 AND password_hash = $2 AND activo = true',
            [email, password]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const usuario = result.rows[0];
        usuario.saldo = parseFloat(usuario.saldo);
        res.json({ mensaje: 'Login exitoso', usuario });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// ey registro -bynd
app.post('/api/registro', async (req, res) => {
    try {
        const { email, password, nombre } = req.body;
        
        // aaa verificar si ya existe -bynd
        const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        
        const result = await pool.query(
            'INSERT INTO usuarios (email, password_hash, nombre, rol, saldo) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nombre, rol, saldo',
            [email, password, nombre, 'cliente', 0]
        );
        
        const usuario = result.rows[0];
        usuario.saldo = parseFloat(usuario.saldo);
        res.json({ mensaje: 'Registro exitoso', usuario });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// chintrolas obtener usuario -bynd
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, nombre, rol, saldo FROM usuarios WHERE id = $1',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = result.rows[0];
        usuario.saldo = parseFloat(usuario.saldo);
        res.json(usuario);
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

// q chidoteee procesar compra -bynd
app.post('/api/comprar/:usuarioId', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { usuarioId } = req.params;
        
        // ey obtener carrito -bynd
        const carritoResult = await client.query(`
            SELECT c.producto_id, c.cantidad, p.precio, p.stock
            FROM carrito c
            JOIN productos p ON c.producto_id = p.id
            WHERE c.usuario_id = $1
        `, [usuarioId]);
        
        if (carritoResult.rows.length === 0) {
            throw new Error('El carrito está vacío');
        }
        
        // aaa calcular total -bynd
        const total = carritoResult.rows.reduce((sum, item) => 
            sum + (parseFloat(item.precio) * item.cantidad), 0
        );
        
        // chintrolas verificar saldo -bynd
        const usuarioResult = await client.query('SELECT saldo FROM usuarios WHERE id = $1', [usuarioId]);
        const saldo = parseFloat(usuarioResult.rows[0].saldo);
        
        if (saldo < total) {
            throw new Error('Saldo insuficiente');
        }
        
        // q chidoteee verificar stock y actualizar -bynd
        for (const item of carritoResult.rows) {
            if (item.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto`);
            }
            await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id = $2',
                [item.cantidad, item.producto_id]
            );
        }
        
        // ey crear pedido -bynd
        const pedidoResult = await client.query(
            'INSERT INTO pedidos (usuario_id, total, estado) VALUES ($1, $2, $3) RETURNING id',
            [usuarioId, total, 'completado']
        );
        
        // aaa insertar detalle del pedido -bynd
        for (const item of carritoResult.rows) {
            await client.query(
                'INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [pedidoResult.rows[0].id, item.producto_id, item.cantidad, item.precio, parseFloat(item.precio) * item.cantidad]
            );
        }
        
        // chintrolas descontar saldo -bynd
        await client.query(
            'UPDATE usuarios SET saldo = saldo - $1 WHERE id = $2',
            [total, usuarioId]
        );
        
        // q chidoteee vaciar carrito -bynd
        await client.query('DELETE FROM carrito WHERE usuario_id = $1', [usuarioId]);
        
        await client.query('COMMIT');
        
        const nuevoSaldo = saldo - total;
        res.json({ mensaje: 'Compra realizada exitosamente', total, nuevoSaldo });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error procesando compra:', error);
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

// ey admin - obtener todos los usuarios -bynd
app.get('/api/admin/usuarios', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, nombre, rol, saldo FROM usuarios ORDER BY id'
        );
        result.rows.forEach(u => u.saldo = parseFloat(u.saldo));
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// aaa admin - agregar saldo -bynd
app.post('/api/admin/saldo/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { cantidad } = req.body;
        
        const result = await pool.query(
            'UPDATE usuarios SET saldo = saldo + $1 WHERE id = $2 RETURNING saldo',
            [cantidad, usuarioId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({ mensaje: 'Saldo actualizado', nuevoSaldo: parseFloat(result.rows[0].saldo) });
    } catch (error) {
        console.error('Error agregando saldo:', error);
        res.status(500).json({ error: 'Error al agregar saldo' });
    }
});

// chintrolas admin - crear producto -bynd
app.post('/api/admin/productos', async (req, res) => {
    try {
        const { nombre, descripcion, precio, imagen, categoria, stock } = req.body;
        
        const result = await pool.query(
            'INSERT INTO productos (nombre, descripcion, precio, imagen, categoria, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [nombre, descripcion, precio, imagen, categoria, stock]
        );
        
        res.json({ mensaje: 'Producto creado', producto: result.rows[0] });
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// q chidoteee admin - actualizar producto -bynd
app.put('/api/admin/productos/:id', async (req, res) => {
    try {
        const { nombre, descripcion, precio, imagen, categoria, stock } = req.body;
        
        const result = await pool.query(
            'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, imagen = $4, categoria = $5, stock = $6 WHERE id = $7 RETURNING *',
            [nombre, descripcion, precio, imagen, categoria, stock, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json({ mensaje: 'Producto actualizado', producto: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// ey admin - eliminar producto -bynd
app.delete('/api/admin/productos/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE productos SET activo = false WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json({ mensaje: 'Producto eliminado' });
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// aaa catch-all para SPA -bynd
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ey iniciamos el servidor -bynd
app.listen(PORT, () => {
    console.log(`🥖 La Desesperanza corriendo en http://localhost:${PORT}`);
});
