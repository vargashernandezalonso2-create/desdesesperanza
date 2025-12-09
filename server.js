// ey server.js - backend panaderia con todas las validaciones -bynd
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// aaa configuracion de postgresql -bynd
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

app.use(express.json());
app.use(express.static('public'));

// chintrolas middleware de validacion general -bynd
const validarNumero = (valor, min = 0, max = 999999999999) => {
    const num = parseFloat(valor);
    if (isNaN(num)) return { valido: false, error: 'Debe ser un número válido' };
    if (num < min) return { valido: false, error: `El valor mínimo es ${min}` };
    if (num > max) return { valido: false, error: `El valor máximo es ${max}` };
    return { valido: true, valor: num };
};

const validarTexto = (texto, minLength = 1, maxLength = 255) => {
    if (!texto || typeof texto !== 'string') return { valido: false, error: 'Texto requerido' };
    const trimmed = texto.trim();
    if (trimmed.length < minLength) return { valido: false, error: `Mínimo ${minLength} caracteres` };
    if (trimmed.length > maxLength) return { valido: false, error: `Máximo ${maxLength} caracteres` };
    return { valido: true, valor: trimmed };
};

const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !regex.test(email)) return { valido: false, error: 'Email inválido' };
    return { valido: true, valor: email.toLowerCase().trim() };
};

const validarUsername = (username) => {
    const regex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!username || !regex.test(username)) {
        return { valido: false, error: 'Username debe tener 3-30 caracteres alfanuméricos' };
    }
    return { valido: true, valor: username.toLowerCase().trim() };
};

// ================================================
// q chidoteee ENDPOINTS DE PRODUCTOS -bynd
// ================================================

// ey obtener todos los productos -bynd
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos WHERE stock > 0 ORDER BY categoria, nombre');
        const productos = result.rows.map(p => ({
            ...p,
            precio: parseFloat(p.precio)
        }));
        res.json(productos);
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// aaa obtener todos los productos (admin, incluye stock 0) -bynd
app.get('/api/admin/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY categoria, nombre');
        const productos = result.rows.map(p => ({
            ...p,
            precio: parseFloat(p.precio)
        }));
        res.json(productos);
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// chintrolas obtener producto por ID -bynd
app.get('/api/productos/:id', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.id, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        const result = await pool.query('SELECT * FROM productos WHERE id = $1', [idVal.valor]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        const producto = result.rows[0];
        producto.precio = parseFloat(producto.precio);
        res.json(producto);
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// q chidoteee crear producto -bynd
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, descripcion, precio, imagen, categoria, stock } = req.body;

        // ey validaciones server-side -bynd
        const nombreVal = validarTexto(nombre, 2, 100);
        if (!nombreVal.valido) return res.status(400).json({ error: `Nombre: ${nombreVal.error}` });

        const descVal = validarTexto(descripcion || 'Sin descripción', 1, 500);
        if (!descVal.valido) return res.status(400).json({ error: `Descripción: ${descVal.error}` });

        const precioVal = validarNumero(precio, 0.01, 999999.99);
        if (!precioVal.valido) return res.status(400).json({ error: `Precio: ${precioVal.error}` });

        const stockVal = validarNumero(stock, 0, 999999);
        if (!stockVal.valido) return res.status(400).json({ error: `Stock: ${stockVal.error}` });

        const categoriasValidas = ['pan-dulce', 'pan-salado', 'pasteles', 'galletas', 'cupcakes', 'postres', 'temporada'];
        if (!categoria || !categoriasValidas.includes(categoria)) {
            return res.status(400).json({ error: 'Categoría inválida' });
        }

        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, imagen, categoria, stock) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [nombreVal.valor, descVal.valor, precioVal.valor, imagen || '', categoria, Math.floor(stockVal.valor)]
        );

        const producto = result.rows[0];
        producto.precio = parseFloat(producto.precio);
        res.status(201).json(producto);
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// ey actualizar producto -bynd
app.put('/api/productos/:id', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.id, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        const { nombre, descripcion, precio, imagen, categoria, stock } = req.body;

        const nombreVal = validarTexto(nombre, 2, 100);
        if (!nombreVal.valido) return res.status(400).json({ error: `Nombre: ${nombreVal.error}` });

        const descVal = validarTexto(descripcion || 'Sin descripción', 1, 500);
        if (!descVal.valido) return res.status(400).json({ error: `Descripción: ${descVal.error}` });

        const precioVal = validarNumero(precio, 0.01, 999999.99);
        if (!precioVal.valido) return res.status(400).json({ error: `Precio: ${precioVal.error}` });

        const stockVal = validarNumero(stock, 0, 999999);
        if (!stockVal.valido) return res.status(400).json({ error: `Stock: ${stockVal.error}` });

        const categoriasValidas = ['pan-dulce', 'pan-salado', 'pasteles', 'galletas', 'cupcakes', 'postres', 'temporada'];
        if (!categoria || !categoriasValidas.includes(categoria)) {
            return res.status(400).json({ error: 'Categoría inválida' });
        }

        const result = await pool.query(
            `UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, imagen=$4, categoria=$5, stock=$6 
             WHERE id=$7 RETURNING *`,
            [nombreVal.valor, descVal.valor, precioVal.valor, imagen || '', categoria, Math.floor(stockVal.valor), idVal.valor]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const producto = result.rows[0];
        producto.precio = parseFloat(producto.precio);
        res.json(producto);
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// aaa eliminar producto -bynd
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.id, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        // chintrolas primero eliminar del carrito de todos los usuarios -bynd
        await pool.query('DELETE FROM carrito WHERE producto_id = $1', [idVal.valor]);

        const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [idVal.valor]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto eliminado', producto: result.rows[0] });
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// ================================================
// q chidoteee ENDPOINTS DE USUARIOS -bynd
// ================================================

// ey registrar usuario -bynd
app.post('/api/registro', async (req, res) => {
    try {
        const { username, email, nombre, password } = req.body;

        // aaa validaciones -bynd
        const usernameVal = validarUsername(username);
        if (!usernameVal.valido) return res.status(400).json({ error: usernameVal.error });

        const emailVal = validarEmail(email);
        if (!emailVal.valido) return res.status(400).json({ error: emailVal.error });

        const nombreVal = validarTexto(nombre, 2, 100);
        if (!nombreVal.valido) return res.status(400).json({ error: `Nombre: ${nombreVal.error}` });

        const passVal = validarTexto(password, 6, 100);
        if (!passVal.valido) return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres' });

        // chintrolas verificar si username o email ya existen -bynd
        const existe = await pool.query(
            'SELECT id FROM usuarios WHERE username = $1 OR email = $2',
            [usernameVal.valor, emailVal.valor]
        );
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'El usuario o email ya está registrado' });
        }

        // q chidoteee hashear password con bcrypt -bynd
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(passVal.valor, saltRounds);

        const result = await pool.query(
            `INSERT INTO usuarios (username, email, nombre, password, rol, saldo) 
             VALUES ($1, $2, $3, $4, 'cliente', 0) RETURNING id, username, email, nombre, rol, saldo`,
            [usernameVal.valor, emailVal.valor, nombreVal.valor, hashedPassword]
        );

        const usuario = result.rows[0];
        usuario.saldo = parseFloat(usuario.saldo);
        res.status(201).json(usuario);
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// ey login con username -bynd
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const usernameVal = validarUsername(username);
        if (!usernameVal.valido) return res.status(400).json({ error: usernameVal.error });

        const passVal = validarTexto(password, 1, 100);
        if (!passVal.valido) return res.status(400).json({ error: 'Contraseña requerida' });

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE username = $1',
            [usernameVal.valor]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const usuario = result.rows[0];

        // aaa verificar password con bcrypt -bynd
        const passwordValido = await bcrypt.compare(passVal.valor, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // chintrolas no enviar password al cliente -bynd
        delete usuario.password;
        usuario.saldo = parseFloat(usuario.saldo);
        res.json(usuario);
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// q chidoteee obtener usuario -bynd
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.id, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        const result = await pool.query(
            'SELECT id, username, email, nombre, rol, saldo, created_at FROM usuarios WHERE id = $1',
            [idVal.valor]
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

// ey agregar saldo a usuario -bynd
app.post('/api/usuarios/:id/saldo', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.id, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        const { cantidad } = req.body;

        // aaa validar cantidad -bynd
        const cantidadVal = validarNumero(cantidad, 0.01, 999999999999);
        if (!cantidadVal.valido) return res.status(400).json({ error: cantidadVal.error });

        // chintrolas verificar que no exceda el limite total -bynd
        const usuario = await pool.query('SELECT saldo FROM usuarios WHERE id = $1', [idVal.valor]);
        if (usuario.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const saldoActual = parseFloat(usuario.rows[0].saldo);
        const nuevoSaldo = saldoActual + cantidadVal.valor;

        if (nuevoSaldo > 999999999999) {
            return res.status(400).json({ error: 'El saldo máximo es $999,999,999,999' });
        }

        const result = await pool.query(
            'UPDATE usuarios SET saldo = $1 WHERE id = $2 RETURNING saldo',
            [nuevoSaldo, idVal.valor]
        );

        res.json({ mensaje: 'Saldo agregado', nuevoSaldo: parseFloat(result.rows[0].saldo) });
    } catch (error) {
        console.error('Error agregando saldo:', error);
        res.status(500).json({ error: 'Error al agregar saldo' });
    }
});

// q chidoteee obtener todos los usuarios (admin) -bynd
app.get('/api/usuarios', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, nombre, rol, saldo, created_at FROM usuarios ORDER BY created_at DESC'
        );
        const usuarios = result.rows.map(u => ({
            ...u,
            saldo: parseFloat(u.saldo)
        }));
        res.json(usuarios);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// ey actualizar usuario (admin) -bynd
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.id, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        const { nombre, email, rol, saldo } = req.body;

        const nombreVal = validarTexto(nombre, 2, 100);
        if (!nombreVal.valido) return res.status(400).json({ error: `Nombre: ${nombreVal.error}` });

        const emailVal = validarEmail(email);
        if (!emailVal.valido) return res.status(400).json({ error: emailVal.error });

        const rolesValidos = ['admin', 'cliente'];
        if (!rol || !rolesValidos.includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        const saldoVal = validarNumero(saldo, 0, 999999999999);
        if (!saldoVal.valido) return res.status(400).json({ error: `Saldo: ${saldoVal.error}` });

        const result = await pool.query(
            `UPDATE usuarios SET nombre=$1, email=$2, rol=$3, saldo=$4 WHERE id=$5 
             RETURNING id, username, email, nombre, rol, saldo`,
            [nombreVal.valor, emailVal.valor, rol, saldoVal.valor, idVal.valor]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = result.rows[0];
        usuario.saldo = parseFloat(usuario.saldo);
        res.json(usuario);
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// aaa eliminar usuario -bynd
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.id, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        // chintrolas eliminar carrito del usuario primero -bynd
        await pool.query('DELETE FROM carrito WHERE usuario_id = $1', [idVal.valor]);

        const result = await pool.query(
            'DELETE FROM usuarios WHERE id = $1 RETURNING id, username, nombre',
            [idVal.valor]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Usuario eliminado', usuario: result.rows[0] });
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// ================================================
// q chidoteee ENDPOINTS DE CARRITO -bynd
// ================================================

// ey obtener carrito de usuario -bynd
app.get('/api/carrito/:usuarioId', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.usuarioId, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        const result = await pool.query(`
            SELECT c.id, c.producto_id as "productoId", c.cantidad, 
                   p.nombre, p.descripcion, p.precio, p.imagen, p.categoria, p.stock
            FROM carrito c
            JOIN productos p ON c.producto_id = p.id
            WHERE c.usuario_id = $1
            ORDER BY c.created_at DESC
        `, [idVal.valor]);

        const carrito = result.rows.map(item => ({
            id: item.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            producto: {
                id: item.productoId,
                nombre: item.nombre,
                descripcion: item.descripcion,
                precio: parseFloat(item.precio),
                imagen: item.imagen,
                categoria: item.categoria,
                stock: item.stock
            }
        }));

        res.json(carrito);
    } catch (error) {
        console.error('Error obteniendo carrito:', error);
        res.status(500).json({ error: 'Error al obtener carrito' });
    }
});

// aaa agregar al carrito -bynd
app.post('/api/carrito/:usuarioId', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.usuarioId, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        const { productoId, cantidad } = req.body;

        const prodIdVal = validarNumero(productoId, 1, 999999);
        if (!prodIdVal.valido) return res.status(400).json({ error: 'ID de producto inválido' });

        const cantidadVal = validarNumero(cantidad || 1, 1, 999);
        if (!cantidadVal.valido) return res.status(400).json({ error: cantidadVal.error });

        // chintrolas verificar que el producto exista y tenga stock -bynd
        const producto = await pool.query('SELECT stock FROM productos WHERE id = $1', [prodIdVal.valor]);
        if (producto.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        if (producto.rows[0].stock < cantidadVal.valor) {
            return res.status(400).json({ error: 'Stock insuficiente' });
        }

        // q chidoteee usar upsert para manejar duplicados -bynd
        const result = await pool.query(`
            INSERT INTO carrito (usuario_id, producto_id, cantidad)
            VALUES ($1, $2, $3)
            ON CONFLICT (usuario_id, producto_id)
            DO UPDATE SET cantidad = carrito.cantidad + $3
            RETURNING *
        `, [idVal.valor, prodIdVal.valor, cantidadVal.valor]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        res.status(500).json({ error: 'Error al agregar al carrito' });
    }
});

// ey actualizar cantidad en carrito -bynd
app.put('/api/carrito/:usuarioId/:productoId', async (req, res) => {
    try {
        const userIdVal = validarNumero(req.params.usuarioId, 1, 999999);
        const prodIdVal = validarNumero(req.params.productoId, 1, 999999);
        if (!userIdVal.valido || !prodIdVal.valido) {
            return res.status(400).json({ error: 'IDs inválidos' });
        }

        const { cantidad } = req.body;
        const cantidadVal = validarNumero(cantidad, 1, 999);
        if (!cantidadVal.valido) return res.status(400).json({ error: cantidadVal.error });

        // aaa verificar stock disponible -bynd
        const producto = await pool.query('SELECT stock FROM productos WHERE id = $1', [prodIdVal.valor]);
        if (producto.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        if (producto.rows[0].stock < cantidadVal.valor) {
            return res.status(400).json({ error: 'Stock insuficiente' });
        }

        const result = await pool.query(
            'UPDATE carrito SET cantidad = $1 WHERE usuario_id = $2 AND producto_id = $3 RETURNING *',
            [cantidadVal.valor, userIdVal.valor, prodIdVal.valor]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado en carrito' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error actualizando carrito:', error);
        res.status(500).json({ error: 'Error al actualizar carrito' });
    }
});

// chintrolas eliminar item del carrito -bynd
app.delete('/api/carrito/:usuarioId/:productoId', async (req, res) => {
    try {
        const userIdVal = validarNumero(req.params.usuarioId, 1, 999999);
        const prodIdVal = validarNumero(req.params.productoId, 1, 999999);
        if (!userIdVal.valido || !prodIdVal.valido) {
            return res.status(400).json({ error: 'IDs inválidos' });
        }

        const result = await pool.query(
            'DELETE FROM carrito WHERE usuario_id = $1 AND producto_id = $2 RETURNING *',
            [userIdVal.valor, prodIdVal.valor]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado' });
        }

        res.json({ mensaje: 'Item eliminado' });
    } catch (error) {
        console.error('Error eliminando del carrito:', error);
        res.status(500).json({ error: 'Error al eliminar del carrito' });
    }
});

// q chidoteee vaciar carrito -bynd
app.delete('/api/carrito/:usuarioId', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.usuarioId, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        await pool.query('DELETE FROM carrito WHERE usuario_id = $1', [idVal.valor]);
        res.json({ mensaje: 'Carrito vaciado' });
    } catch (error) {
        console.error('Error vaciando carrito:', error);
        res.status(500).json({ error: 'Error al vaciar carrito' });
    }
});

// ================================================
// ey ENDPOINT DE COMPRA CON TICKET -bynd
// ================================================

app.post('/api/comprar/:usuarioId', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const idVal = validarNumero(req.params.usuarioId, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        const { envio = 0, tipoEnvio = 'tienda', direccion = '' } = req.body;

        const envioVal = validarNumero(envio, 0, 1000);
        if (!envioVal.valido) return res.status(400).json({ error: 'Costo de envío inválido' });

        await client.query('BEGIN');

        // aaa obtener usuario y verificar saldo -bynd
        const usuarioResult = await client.query(
            'SELECT id, nombre, saldo FROM usuarios WHERE id = $1 FOR UPDATE',
            [idVal.valor]
        );

        if (usuarioResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = usuarioResult.rows[0];
        const saldoActual = parseFloat(usuario.saldo);

        // chintrolas obtener carrito con productos -bynd
        const carritoResult = await client.query(`
            SELECT c.producto_id, c.cantidad, p.nombre, p.precio, p.stock
            FROM carrito c
            JOIN productos p ON c.producto_id = p.id
            WHERE c.usuario_id = $1
            FOR UPDATE
        `, [idVal.valor]);

        if (carritoResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // q chidoteee calcular totales -bynd
        let subtotal = 0;
        const productosCompra = [];

        for (const item of carritoResult.rows) {
            const precio = parseFloat(item.precio);
            
            // ey verificar stock -bynd
            if (item.stock < item.cantidad) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Stock insuficiente de ${item.nombre}` });
            }

            subtotal += precio * item.cantidad;
            productosCompra.push({
                productoId: item.producto_id,
                nombre: item.nombre,
                precio: precio,
                cantidad: item.cantidad,
                subtotal: precio * item.cantidad
            });
        }

        const subtotalConEnvio = subtotal + envioVal.valor;
        const iva = subtotalConEnvio * 0.16;
        const total = subtotalConEnvio + iva;

        // aaa verificar saldo suficiente -bynd
        if (saldoActual < total) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }

        if (saldoActual === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No tienes saldo disponible' });
        }

        // chintrolas crear pedido -bynd
        const pedidoResult = await client.query(`
            INSERT INTO pedidos (usuario_id, total, subtotal, iva, envio, tipo_envio, direccion_envio)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [idVal.valor, total, subtotal, iva, envioVal.valor, tipoEnvio, direccion]);

        const pedido = pedidoResult.rows[0];

        // q chidoteee insertar detalles del pedido -bynd
        for (const prod of productosCompra) {
            await client.query(`
                INSERT INTO detalle_pedidos (pedido_id, producto_id, producto_nombre, producto_precio, cantidad, subtotal)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [pedido.id, prod.productoId, prod.nombre, prod.precio, prod.cantidad, prod.subtotal]);

            // ey reducir stock del producto -bynd
            const nuevoStock = await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id = $2 RETURNING stock',
                [prod.cantidad, prod.productoId]
            );

            // aaa eliminar producto si stock llega a 0 -bynd
            if (nuevoStock.rows[0].stock <= 0) {
                await client.query('DELETE FROM productos WHERE id = $1', [prod.productoId]);
            }
        }

        // chintrolas descontar saldo -bynd
        const nuevoSaldo = saldoActual - total;
        await client.query('UPDATE usuarios SET saldo = $1 WHERE id = $2', [nuevoSaldo, idVal.valor]);

        // q chidoteee vaciar carrito -bynd
        await client.query('DELETE FROM carrito WHERE usuario_id = $1', [idVal.valor]);

        await client.query('COMMIT');

        // ey generar ticket de respuesta -bynd
        const ticket = {
            numeroVenta: pedido.id,
            negocio: 'La Desesperanza',
            fecha: pedido.fecha,
            cliente: usuario.nombre,
            productos: productosCompra,
            subtotal: subtotal,
            envio: envioVal.valor,
            tipoEnvio: tipoEnvio,
            direccion: direccion,
            iva: iva,
            total: total,
            nuevoSaldo: nuevoSaldo
        };

        res.json(ticket);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error procesando compra:', error);
        res.status(500).json({ error: 'Error al procesar la compra' });
    } finally {
        client.release();
    }
});

// ================================================
// aaa ENDPOINTS DE HISTORIAL -bynd
// ================================================

// ey historial de compras del usuario -bynd
app.get('/api/historial/:usuarioId', async (req, res) => {
    try {
        const idVal = validarNumero(req.params.usuarioId, 1, 999999);
        if (!idVal.valido) return res.status(400).json({ error: idVal.error });

        const pedidos = await pool.query(`
            SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY fecha DESC
        `, [idVal.valor]);

        // chintrolas obtener detalles de cada pedido -bynd
        const historial = [];
        for (const pedido of pedidos.rows) {
            const detalles = await pool.query(`
                SELECT * FROM detalle_pedidos WHERE pedido_id = $1
            `, [pedido.id]);

            historial.push({
                ...pedido,
                total: parseFloat(pedido.total),
                subtotal: parseFloat(pedido.subtotal),
                iva: parseFloat(pedido.iva),
                envio: parseFloat(pedido.envio),
                productos: detalles.rows.map(d => ({
                    ...d,
                    producto_precio: parseFloat(d.producto_precio),
                    subtotal: parseFloat(d.subtotal)
                }))
            });
        }

        res.json(historial);
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

// q chidoteee historial de todas las ventas (admin) -bynd
app.get('/api/admin/historial', async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        let query = `
            SELECT p.*, u.nombre as cliente_nombre, u.username as cliente_username
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
        `;
        const params = [];

        // ey filtrar por fecha si se proporciona -bynd
        if (fechaInicio && fechaFin) {
            query += ' WHERE p.fecha >= $1 AND p.fecha <= $2';
            params.push(fechaInicio, fechaFin + 'T23:59:59');
        } else if (fechaInicio) {
            query += ' WHERE p.fecha >= $1';
            params.push(fechaInicio);
        } else if (fechaFin) {
            query += ' WHERE p.fecha <= $1';
            params.push(fechaFin + 'T23:59:59');
        }

        query += ' ORDER BY p.fecha DESC';

        const pedidos = await pool.query(query, params);

        // aaa obtener detalles de cada pedido -bynd
        const historial = [];
        for (const pedido of pedidos.rows) {
            const detalles = await pool.query(`
                SELECT * FROM detalle_pedidos WHERE pedido_id = $1
            `, [pedido.id]);

            historial.push({
                ...pedido,
                total: parseFloat(pedido.total),
                subtotal: parseFloat(pedido.subtotal),
                iva: parseFloat(pedido.iva),
                envio: parseFloat(pedido.envio),
                productos: detalles.rows.map(d => ({
                    ...d,
                    producto_precio: parseFloat(d.producto_precio),
                    subtotal: parseFloat(d.subtotal)
                }))
            });
        }

        res.json(historial);
    } catch (error) {
        console.error('Error obteniendo historial admin:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

// ================================================
// chintrolas ENDPOINTS DE ESTADISTICAS (ADMIN) -bynd
// ================================================

app.get('/api/admin/estadisticas', async (req, res) => {
    try {
        // q chidoteee ventas totales -bynd
        const ventasTotales = await pool.query('SELECT COALESCE(SUM(total), 0) as total FROM pedidos');
        
        // ey total de pedidos -bynd
        const totalPedidos = await pool.query('SELECT COUNT(*) as count FROM pedidos');
        
        // aaa total de usuarios -bynd
        const totalUsuarios = await pool.query("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'cliente'");
        
        // chintrolas total de productos -bynd
        const totalProductos = await pool.query('SELECT COUNT(*) as count FROM productos');

        // q chidoteee ventas por mes (ultimos 6 meses) -bynd
        const ventasPorMes = await pool.query(`
            SELECT 
                TO_CHAR(fecha, 'YYYY-MM') as mes,
                SUM(total) as total,
                COUNT(*) as cantidad
            FROM pedidos
            WHERE fecha >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(fecha, 'YYYY-MM')
            ORDER BY mes DESC
        `);

        // ey ventas por categoria -bynd
        const ventasPorCategoria = await pool.query(`
            SELECT 
                p.categoria,
                SUM(dp.subtotal) as total,
                SUM(dp.cantidad) as cantidad
            FROM detalle_pedidos dp
            JOIN productos p ON dp.producto_id = p.id
            GROUP BY p.categoria
            ORDER BY total DESC
        `);

        // aaa productos mas vendidos -bynd
        const productosMasVendidos = await pool.query(`
            SELECT 
                producto_nombre as nombre,
                SUM(cantidad) as total_vendido,
                SUM(subtotal) as ingresos
            FROM detalle_pedidos
            GROUP BY producto_nombre
            ORDER BY total_vendido DESC
            LIMIT 10
        `);

        // chintrolas ventas por dia (ultima semana) -bynd
        const ventasPorDia = await pool.query(`
            SELECT 
                TO_CHAR(fecha, 'YYYY-MM-DD') as dia,
                SUM(total) as total,
                COUNT(*) as cantidad
            FROM pedidos
            WHERE fecha >= NOW() - INTERVAL '7 days'
            GROUP BY TO_CHAR(fecha, 'YYYY-MM-DD')
            ORDER BY dia
        `);

        res.json({
            resumen: {
                ventasTotales: parseFloat(ventasTotales.rows[0].total),
                totalPedidos: parseInt(totalPedidos.rows[0].count),
                totalUsuarios: parseInt(totalUsuarios.rows[0].count),
                totalProductos: parseInt(totalProductos.rows[0].count)
            },
            ventasPorMes: ventasPorMes.rows.map(v => ({
                ...v,
                total: parseFloat(v.total)
            })),
            ventasPorCategoria: ventasPorCategoria.rows.map(v => ({
                ...v,
                total: parseFloat(v.total)
            })),
            productosMasVendidos: productosMasVendidos.rows.map(p => ({
                ...p,
                ingresos: parseFloat(p.ingresos)
            })),
            ventasPorDia: ventasPorDia.rows.map(v => ({
                ...v,
                total: parseFloat(v.total)
            }))
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// q chidoteee iniciar servidor -bynd
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
