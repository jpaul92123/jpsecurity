require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuración
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🟢 Conectado a MongoDB'))
    .catch(err => console.error('🔴 Error de conexión:', err));

// Esquema del servicio
const servicioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    telefono: { 
        type: String, 
        required: true,
        validate: {
            validator: v => /^[0-9]{9}$/.test(v),
            message: 'Teléfono inválido (9 dígitos requeridos)'
        }
    },
    direccion: { type: String, required: true },
    servicio: { 
        type: String, 
        required: true,
        enum: ['CCTV', 'Alarmas', 'Acceso']
    },
    fechaServicio: { type: Date, required: true },
    estado: {
        type: String,
        enum: ['programado', 'realizado', 'cancelado'],
        default: 'programado'
    },
    descripcion: String,
    fechaRegistro: { type: Date, default: Date.now }
}, { versionKey: false });

const Servicio = mongoose.model('Servicio', servicioSchema);

// Rutas de la API
app.post('/api/clientes', async (req, res) => {
    try {
        const nuevoServicio = new Servicio(req.body);
        await nuevoServicio.save();
        res.status(201).json(nuevoServicio);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/clientes', async (req, res) => {
    try {
        const { search = '', estado = '' } = req.query;
        const query = {
            $or: [
                { nombre: { $regex: search, $options: 'i' } },
                { telefono: { $regex: search, $options: 'i' } }
            ]
        };

        if (estado) query.estado = estado;

        const servicios = await Servicio.find(query)
            .sort({ fechaServicio: -1 })
            .lean();

        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
});

app.get('/api/clientes/:id', async (req, res) => {
    try {
        const servicio = await Servicio.findById(req.params.id);
        if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
        res.json(servicio);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener servicio' });
    }
});

app.put('/api/clientes/:id', async (req, res) => {
    try {
        const servicio = await Servicio.findByIdAndUpdate(
            req.params.id,
            { estado: req.body.estado },
            { new: true }
        );
        res.json(servicio);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/clientes/:id', async (req, res) => {
    try {
        await Servicio.findByIdAndDelete(req.params.id);
        res.json({ message: 'Servicio eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar servicio' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
});