const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir el frontend (carpeta public) desde el mismo servidor
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la conexión MySQL / Supabase / Aiven
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'centro_deportivo',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10
});

// 1. Obtener todas las instalaciones
app.get('/api/instalaciones', async (req, res) => {
  try {
    // MODIFICACIÓN: Quitamos el WHERE estado = "activa" para probar si trae datos
    const [rows] = await pool.query('SELECT * FROM instalaciones'); 
    
    console.log("Instalaciones encontradas en la BD:", rows); // Esto saldrá en tu terminal
    res.json(rows);
  } catch (err) {
    console.error("Error en BD instalaciones:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Obtener reservas
app.get('/api/reservas', async (req, res) => {
    try {
        const query = `
            SELECT r.id, u.nombre as cliente, i.nombre as instalacion, i.deporte, 
                   r.fecha, r.hora_inicio, r.hora_fin, r.estado
            FROM reservas r
            JOIN usuarios u ON r.usuario_id = u.id
            JOIN instalaciones i ON r.instalacion_id = i.id
            ORDER BY r.fecha DESC, r.hora_inicio ASC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Crear una nueva reserva con VALIDACIONES estrictas anti-cruces
app.post('/api/reservas', async (req, res) => {
    const { cliente_nombre, cliente_email, cliente_telefono, instalacion_id, fecha, hora_inicio, hora_fin } = req.body;

    if (!cliente_nombre || !instalacion_id || !fecha || !hora_inicio || !hora_fin) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        // Verificar o crear usuario cliente
        let [users] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [cliente_email]);
        let usuario_id;
        if (users.length === 0) {
            const [newUser] = await pool.query(
                'INSERT INTO usuarios (nombre, email, telefono, password, rol) VALUES (?, ?, ?, "123456", "CLIENTE")',
                [cliente_nombre, cliente_email || `user_${Date.now()}@mail.com`, cliente_telefono || '']
            );
            usuario_id = newUser.insertId;
        } else {
            usuario_id = users[0].id;
        }

        // VALIDACIÓN 1: Verificar si la instalación existe y está activa
        const [inst] = await pool.query('SELECT * FROM instalaciones WHERE id = ? AND estado = "activa"', [instalacion_id]);
        if (inst.length === 0) {
            return res.status(400).json({ error: 'La instalación no existe o está en mantenimiento.' });
        }

        // VALIDACIÓN 2: Evitar cruce de horarios (Misma instalación, misma fecha, horarios traslapados)
        const overlapQuery = `
            SELECT id FROM reservas 
            WHERE instalacion_id = ? 
              AND fecha = ? 
              AND estado = 'confirmada'
              AND (
                  (hora_inicio < ? AND hora_fin > ?)
              )
        `;
        const [existing] = await pool.query(overlapQuery, [instalacion_id, fecha, hora_fin, hora_inicio]);

        if (existing.length > 0) {
            return res.status(409).json({ error: ' ¡Horario no disponible! Ya existe una reserva activa en esa cancha y horario.' });
        }

        // Registrar Reserva
        const [result] = await pool.query(
            'INSERT INTO reservas (usuario_id, instalacion_id, fecha, hora_inicio, hora_fin, estado) VALUES (?, ?, ?, ?, ?, "confirmada")',
            [usuario_id, instalacion_id, fecha, hora_inicio, hora_fin]
        );

        res.status(201).json({ message: ' ¡Reserva confirmada con éxito!', reserva_id: result.insertId });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Cambiar estado de reserva (Encargado / Admin)
app.patch('/api/reservas/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        await pool.query('UPDATE reservas SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ message: 'Estado actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cualquier otra ruta no-API devuelve el frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
