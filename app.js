let currentSearch = '';
let currentEstado = '';

// Función para mostrar mensajes
const showMessage = (text, type = 'success') => {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    setTimeout(() => mensajeDiv.innerHTML = '', 5000);
};

//////////////API PARA LOS FECTCH////////
const API_URL = 'https://jpclientes-backend.onrender.com/api/clientes';


// Registrar nuevo servicio
document.getElementById('clienteForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const servicioData = {
        nombre: document.getElementById('nombre').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        servicio: document.getElementById('servicio').value,
        fechaServicio: document.getElementById('fechaServicio').value,
        estado: document.getElementById('estado').value,
        descripcion: document.getElementById('descripcion').value.trim()
    };

    try {
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(servicioData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Servicio registrado exitosamente ✔️');
            document.getElementById('clienteForm').reset();
            loadClientes();
        } else {
            throw new Error(data.error || 'Error al registrar el servicio');
        }
    } catch (error) {
        showMessage(`Error: ${error.message} ❌`, 'danger');
    }
});

// Cargar y mostrar servicios
const loadClientes = async () => {
    try {
        const response = await fetch(`${API_URL}?search=${encodeURIComponent(currentSearch)}&estado=${encodeURIComponent(currentEstado)}`);
        const clientes = await response.json();

        const tbody = document.getElementById('clientesLista');
        tbody.innerHTML = clientes.map(cliente => `
            <tr class="clickable-row" onclick="showDetails('${cliente._id}')">
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.servicio}</td>
                <td>${new Date(cliente.fechaServicio).toLocaleDateString('es-PE')}</td>
                <td>
                    <select class="form-select py-0 estado-select" 
                            onchange="updateEstado('${cliente._id}', this.value)" 
                            style="width: 120px">
                        <option value="programado" ${cliente.estado === 'programado' ? 'selected' : ''}>Programado</option>
                        <option value="realizado" ${cliente.estado === 'realizado' ? 'selected' : ''}>Realizado</option>
                        <option value="cancelado" ${cliente.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </td>
                <td class="text-center">
                    <span class="descripcion-icon">${cliente.descripcion ? '📝' : '🚫'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteCliente('${cliente._id}')">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showMessage('Error al cargar los servicios', 'danger');
    }
};

// Filtros
document.getElementById('busqueda').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    loadClientes();
});

document.getElementById('filtroEstado').addEventListener('change', (e) => {
    currentEstado = e.target.value;
    loadClientes();
});

// Mostrar detalles en modal
const showDetails = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const cliente = await response.json();

        const modalBody = document.getElementById('modalDetalleBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Nombre:</strong> ${cliente.nombre}</p>
                    <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                    <p><strong>Dirección:</strong> ${cliente.direccion}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Servicio:</strong> ${cliente.servicio}</p>
                    <p><strong>Fecha:</strong> ${new Date(cliente.fechaServicio).toLocaleDateString('es-PE')}</p>
                    <p><strong>Estado:</strong> ${cliente.estado.toUpperCase()}</p>
                </div>
            </div>
            <div class="modal-descripcion mt-3">
                <strong>Descripción:</strong><br>
                ${cliente.descripcion || 'Sin descripción registrada'}
            </div>
        `;

        new bootstrap.Modal(document.getElementById('detalleModal')).show();
    } catch (error) {
        showMessage('Error al cargar los detalles', 'danger');
    }
};

// Actualizar estado
const updateEstado = async (id, nuevoEstado) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) throw new Error('Error al actualizar estado');
        loadClientes();
    } catch (error) {
        showMessage(error.message, 'danger');
    }
};

// Eliminar servicio
const deleteCliente = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Servicio eliminado correctamente', 'success');
            loadClientes();
        } else {
            throw new Error('Error al eliminar el servicio');
        }
    } catch (error) {
        showMessage(error.message, 'danger');
    }
};

// Inicializar
loadClientes();