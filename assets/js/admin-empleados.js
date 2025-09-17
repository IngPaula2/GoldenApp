/**
 * 👥 JAVASCRIPT PARA DASHBOARD DE EMPLEADOS - GOLDEN APP
 * 
 * Este archivo contiene toda la funcionalidad JavaScript para la página de empleados.
 * Incluye funciones para modales, secciones desplegables, CRUD de empleados, etc.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Gestión completa de empleados (CRUD)
 * - Búsqueda y filtrado de empleados
 * - Modales para crear, editar, eliminar y confirmar operaciones
 * - Secciones desplegables por área (Administrativo, PYF, Servicio)
 * - Integración con sistema de cargos
 * - Funcionalidad de cerrar sesión
 * - Validaciones de formularios
 * - Manejo de estados activo/inactivo
 * 
 * ESTRUCTURA DE DATOS:
 * - userCreatedEmpleados: Objeto que almacena empleados creados por el usuario
 * - cargosData: Array de cargos disponibles
 * - cargosPorArea: Objeto que agrupa cargos por área
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2024
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

/**
 * Objeto que almacena todos los empleados creados por el usuario (solo bucket activo en la UI)
 * Estructura: { identificacion: { datosDelEmpleado } }
 * @type {Object}
 */
let userCreatedEmpleados = {};

/**
 * Almacén persistente por ciudad para empleados
 * Estructura: { [codigoCiudad]: { [identificacion]: { datosDelEmpleado, ciudad } } }
 */
const empleadosByCity = (function(){
    try {
        const raw = localStorage.getItem('empleadosByCity');
        return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
})();

function persistEmpleadosByCity() {
    try { localStorage.setItem('empleadosByCity', JSON.stringify(empleadosByCity)); } catch (e) {}
}

function getSelectedCityCode() {
    try { return sessionStorage.getItem('selectedCity') || ''; } catch (e) { return ''; }
}

function loadEmpleadosForSelectedCity() {
    // Volcar bucket de la ciudad actual a memoria (vista)
    const city = getSelectedCityCode();
    const bucket = (empleadosByCity && empleadosByCity[city]) ? empleadosByCity[city] : {};
    
    // Limpiar estructura en memoria
    try {
        Object.keys(userCreatedEmpleados).forEach(k => delete userCreatedEmpleados[k]);
    } catch (e) {}
    
    // Rellenar en memoria
    Object.keys(bucket).forEach(id => { userCreatedEmpleados[id] = bucket[id]; });
    
    // Reconstruir tabla
    try {
        const tableBody = document.getElementById('empleadosTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-users"></i>
                            <p>No existen registros de empleados</p>
                            <small>Haz clic en "Crear Empleado" para crear el primer registro</small>
                        </div>
                    </td>
                </tr>`;
            
            Object.values(userCreatedEmpleados)
                .sort((a,b)=>String(a.identificacion).localeCompare(String(b.identificacion)))
                .forEach(e => addEmpleadoToTable(e, true));
        }
    } catch (e) {}
}

/**
 * Array que contiene todos los cargos disponibles
 * Se carga dinámicamente desde el backend
 * @type {Array}
 */
let cargosData = [];

/**
 * Objeto que agrupa los cargos por área
 * Estructura: { area: [arrayDeCargos] }
 * @type {Object}
 */
let cargosPorArea = {
    administrativo: [
        { codigo: 'EC', nombre: 'Ejecutivo de Cuenta' },
        { codigo: 'EA', nombre: 'Ejecutivo Admon' },
        { codigo: 'EP', nombre: 'Ejecutivo Prejuridico' },
        { codigo: 'SP', nombre: 'Supervisor de Cartera' },
        { codigo: 'SN', nombre: 'Supervisor Nacional de Cartera' },
        { codigo: 'C', nombre: 'Castigo Cartera' },
        { codigo: 'PV', nombre: 'Proxima Vigencia' },
        { codigo: 'V', nombre: 'Verificador' }
    ],
    pyf: [
        { codigo: 'AS', nombre: 'Asesor' },
        { codigo: 'SU', nombre: 'Supervisor' },
        { codigo: 'SG', nombre: 'Subgerente' },
        { codigo: 'GT', nombre: 'Gerente' },
        { codigo: 'DR', nombre: 'Director' },
        { codigo: 'SN', nombre: 'Director Sub Nacional' },
        { codigo: 'DN', nombre: 'Director Nacional' }
    ],
    servicio: [
        { codigo: 'TU', nombre: 'Tutor' },
        { codigo: 'MO', nombre: 'Monitor Tutorias' },
        { codigo: 'CN', nombre: 'Coordinador Nacional de Tutorias' }
    ]
};

// Ciudad actual (tomada de sessionStorage; sin valor por defecto)
let ciudadActual = sessionStorage.getItem('selectedCity') || '';

// Utilidad: obtener ciudad seleccionada de la sesión de forma segura
function getSelectedCity() {
    return sessionStorage.getItem('selectedCity') || '';
}

// Fallback: modal local de selección de ciudad si el global no existe
function promptForCitySelection() {
    if (typeof window.showSelectCityModal === 'function') {
        window.showSelectCityModal();
        return;
    }
    // Inyectar un modal con misma estructura/ids para heredar estilos de ciudades
    let container = document.getElementById('selectCityModal');
    if (!container) {
        container = document.createElement('div');
        container.id = 'selectCityModal';
        container.className = 'modal-overlay';
        container.style.display = 'none';
        container.innerHTML = `
            <div class="modal" style="max-width: 420px; width: 90%;">
                <div class="modal-header">
                    <h3 class="modal-title">SELECCIONAR CIUDAD</h3>
                    <button class="modal-close" onclick="hideSelectCityModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="citySelect" class="form-label">Ciudad *</label>
                        <div class="select-container">
                            <select id="citySelect" class="form-select">
                                <option value="">Seleccione la ciudad</option>
                            </select>
                            <i class="fas fa-chevron-down select-arrow"></i>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="bSeleccionarCiudad">Seleccionar</button>
                </div>
            </div>`;
        document.body.appendChild(container);
        // Cerrar al hacer clic fuera
        container.addEventListener('click', (e) => { if (e.target === container) { container.style.display = 'none'; document.body.style.overflow = 'auto'; } });
        // Botones
        const bSeleccionar = container.querySelector('#bSeleccionarCiudad');
        bSeleccionar.addEventListener('click', () => {
            const sel = container.querySelector('#citySelect');
            const value = sel.value;
            if (!value) { try { showNotification('Por favor, seleccione una ciudad', 'warning'); } catch(e) { alert('Por favor, seleccione una ciudad'); } return; }
            sessionStorage.setItem('selectedCity', value);
            ciudadActual = value;
            container.style.display = 'none';
            document.body.style.overflow = 'auto';
            // Cargar empleados de la ciudad seleccionada
            loadEmpleadosForSelectedCity();
            try { showNotification('Ciudad seleccionada: ' + value, 'success'); } catch(e) {}
        });
        // Exponer funciones si no existen
        if (typeof window.showSelectCityModal !== 'function') {
            window.showSelectCityModal = function() {
                populateCitySelectOptions();
                container.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            };
        }
        if (typeof window.hideSelectCityModal !== 'function') {
            window.hideSelectCityModal = function() {
                container.style.display = 'none';
                document.body.style.overflow = 'auto';
            };
        }
    }
    function populateCitySelectOptions() {
        const sel = document.getElementById('citySelect');
        if (!sel) return;
        // Preferir origen vivo; si no existe en esta página, caer a localStorage validado
        let ciudades = {};
        if (typeof window.getCiudadesData === 'function') {
            ciudades = window.getCiudadesData();
        } else {
            // Solo habilitar fallback a localStorage si en esta sesión se crearon ciudades
            const allowLocal = sessionStorage.getItem('ciudadesAllowLocal') === 'true';
            if (allowLocal) {
                try {
                    const raw = localStorage.getItem('ciudadesData');
                    const parsed = raw ? JSON.parse(raw) : {};
                    if (parsed && typeof parsed === 'object') {
                        ciudades = Object.fromEntries(
                            Object.entries(parsed).filter(([k, v]) => v && typeof v === 'object' && v.codigo && v.nombre)
                        );
                    }
                } catch (e) { ciudades = {}; }
            }
        }
        const current = sel.value;
        sel.innerHTML = '<option value="">Seleccione la ciudad</option>';
        Object.values(ciudades)
            .filter(c => c.activo !== false) // Solo ciudades activas
            .sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo)))
            .forEach(c => {
                const opt = document.createElement('option');
                const code = String(c.codigo || '').toUpperCase();
                const name = String(c.nombre || '').toUpperCase();
                opt.value = c.codigo;
                opt.textContent = `${code} - ${name}`;
                sel.appendChild(opt);
            });
        if (current && ciudades[current] && ciudades[current].activo !== false) sel.value = current;
    }
    // Suscribirse a cambios desde Ciudades para reflejar nuevas ciudades inmediatamente
    try { window.addEventListener('ciudades:updated', populateCitySelectOptions); } catch (e) {}
    populateCitySelectOptions();
    window.showSelectCityModal();
}

// ========================================
// FUNCIONES DE MODALES
// ========================================

/**
 * Muestra el modal de crear empleado
 */
function showCreateEmpleadoModal() {
    // Validar ciudad seleccionada antes de permitir crear empleados
    ciudadActual = getSelectedCity();
    if (!ciudadActual) {
        promptForCitySelection();
        showNotification('Por favor, seleccione una ciudad antes de crear empleados', 'warning');
        return;
    }
    const modal = document.getElementById('createEmpleadoModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Cargar datos de cargos
    loadCargos();
}

/**
 * Cierra el modal de crear empleado
 */
function closeCreateEmpleadoModal() {
    const modal = document.getElementById('createEmpleadoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Limpiar formulario
    clearCreateEmpleadoForm();
    
    // Restaurar el modal a su estado original de creación
    resetModalToCreate();
}

/**
 * Muestra el modal de buscar empleado
 */
function showSearchEmpleadoModal() {
    const modal = document.getElementById('searchEmpleadoModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de buscar empleado
 */
function closeSearchEmpleadoModal() {
    const modal = document.getElementById('searchEmpleadoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Limpiar formulario
    clearSearchEmpleadoForm();
}

// ========================================
// FUNCIONES DE SECCIONES DESPLEABLES
// ========================================

/**
 * Alterna la visibilidad de una sección de empleados
 * @param {string} sectionName - Nombre de la sección a alternar
 */
function toggleSection(sectionName) {
    const content = document.getElementById(`content-${sectionName}`);
    const icon = document.getElementById(`icon-${sectionName}`);
    
    if (content.style.display === 'none' || content.style.display === '') {
        // Expandir sección
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-down');
        content.classList.add('expanded');
    } else {
        // Contraer sección
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-right');
        content.classList.remove('expanded');
    }
}

// ========================================
// FUNCIONES CRUD DE EMPLEADOS
// ========================================

/**
 * Edita un empleado existente
 * Carga los datos del empleado en el formulario para su modificación
 * 
 * @function editEmpleado
 * @param {string} empleadoId - ID (identificación) del empleado a editar
 * @description Busca un empleado por su ID, carga sus datos en el formulario de edición
 *              y prepara el modal para actualización
 * 
 * FUNCIONALIDADES:
 * - Busca el empleado por ID
 * - Pre-llena el formulario con datos existentes
 * - Carga cargos según el área del empleado
 * - Establece el cargo actual del empleado
 * - Cambia el modal a modo edición
 * 
 * BACKEND INTEGRATION:
 * - Endpoint: GET /api/empleados/{id}
 * - Respuesta esperada: { success: true, empleado: {...} }
 * 
 * @returns {void}
 */
function editEmpleado(empleadoId) {
    // Buscar el empleado en los datos existentes
    const empleado = findEmpleadoById(empleadoId);
    
    if (empleado) {
        console.log('Editando empleado:', empleado);
        
        // Cambiar el título del modal
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'ACTUALIZAR EMPLEADO';
        }
        
        // Pre-llenar los campos con la información existente
        document.getElementById('tipoIdentificacion').value = empleado.tipoIdentificacion || '';
        const identificacionField = document.getElementById('identificacion');
        identificacionField.value = empleado.identificacion || '';
        // Guardar el ID original para verificar si cambió
        identificacionField.setAttribute('data-original-id', empleado.identificacion);
        document.getElementById('primerApellido').value = empleado.primerApellido || '';
        document.getElementById('segundoApellido').value = empleado.segundoApellido || '';
        document.getElementById('primerNombre').value = empleado.primerNombre || '';
        document.getElementById('segundoNombre').value = empleado.segundoNombre || '';
        document.getElementById('direccion').value = empleado.direccion || '';
        document.getElementById('celular').value = empleado.celular || '';
        document.getElementById('correo').value = empleado.correo || '';
        
        // Establecer el área y cargar los cargos correspondientes
        const areaSelect = document.getElementById('area');
        areaSelect.value = empleado.area || '';
        if (empleado.area) {
            // Cargar cargos del área
            loadCargosByArea(empleado.area);
            
            // Esperar a que se carguen los cargos y luego establecer el cargo seleccionado
            setTimeout(() => {
                const cargoSelect = document.getElementById('cargo');
                if (cargoSelect && empleado.cargo) {
                    cargoSelect.value = empleado.cargo;
                    console.log('Cargo establecido:', empleado.cargo);
                    console.log('Opciones disponibles:', Array.from(cargoSelect.options).map(opt => opt.value));
                }
            }, 300);
        }
        
        document.getElementById('activo').value = empleado.activo || '';
        
        // Establecer el estado activo en los botones toggle
        setActivo(empleado.activo || 'SI');
        
        // Cambiar el botón y su función
        const submitButton = document.getElementById('bCrearSubmit');
        if (submitButton) {
            submitButton.textContent = 'Actualizar';
            submitButton.onclick = () => handleUpdateEmpleado(empleadoId);
        }
        
        // Mostrar el modal
        showCreateEmpleadoModal();
    } else {
        showNotification('No se encontró el empleado a editar', 'error');
    }
}

/**
 * Elimina un empleado existente
 * @param {string} empleadoId - ID del empleado a eliminar
 */
function deleteEmpleado(empleadoId) {
    // Guardar el ID del empleado a eliminar
    window.tempDeleteEmpleadoId = empleadoId;
    
    // Mostrar modal de confirmación
    showConfirmDeleteEmpleadoModal();
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Busca un empleado por su ID en los datos existentes
 * @param {string} empleadoId - ID del empleado a buscar
 * @returns {Object|null} - Objeto del empleado o null si no se encuentra
 */
function findEmpleadoById(empleadoId) {
    // Buscar en los empleados creados por el usuario
    if (userCreatedEmpleados[empleadoId]) {
        return userCreatedEmpleados[empleadoId];
    }
    
    return null;
}

/**
 * Restaura el modal a su estado original de creación
 */
function resetModalToCreate() {
    // Restaurar título
    document.getElementById('modalTitle').textContent = 'CREAR EMPLEADO';
    
    // Restaurar botón
    const submitButton = document.getElementById('bCrearSubmit');
    submitButton.textContent = 'Crear';
    submitButton.onclick = handleCreateEmpleado;
}

// ========================================
// FUNCIONES DE FORMULARIOS
// ========================================

/**
 * Maneja la creación de un nuevo empleado
 */
/**
 * Maneja la creación de un nuevo empleado
 * Valida los datos del formulario y prepara la información para envío al backend
 * 
 * @function handleCreateEmpleado
 * @description Procesa el formulario de creación de empleado, valida los datos
 *              y prepara la información para ser enviada al backend
 * 
 * VALIDACIONES REALIZADAS:
 * - Campos requeridos no vacíos
 * - Estado activo válido (SI/NO)
 * - Formato de correo electrónico válido
 * - Identificación única (no duplicada)
 * 
 * BACKEND INTEGRATION:
 * - Endpoint: POST /api/empleados
 * - Datos enviados: { tipoIdentificacion, identificacion, primerApellido, segundoApellido, 
 *                     primerNombre, segundoNombre, direccion, celular, correo, area, cargo, activo }
 * 
 * @returns {void}
 */
function handleCreateEmpleado() {
    // Asegurar que exista ciudad seleccionada antes de crear
    ciudadActual = getSelectedCity();
    if (!ciudadActual) {
        promptForCitySelection();
        showNotification('Por favor, seleccione una ciudad antes de crear el empleado', 'warning');
        return;
    }
    // Obtener valores de los campos del formulario
    const tipoIdentificacion = document.getElementById('tipoIdentificacion').value;
    const identificacion = document.getElementById('identificacion').value;
    const primerApellido = document.getElementById('primerApellido').value;
    const segundoApellido = document.getElementById('segundoApellido').value;
    const primerNombre = document.getElementById('primerNombre').value;
    const segundoNombre = document.getElementById('segundoNombre').value;
    const direccion = document.getElementById('direccion').value;
    const celular = document.getElementById('celular').value;
    const correo = document.getElementById('correo').value;
    const area = document.getElementById('area').value;
    const cargo = document.getElementById('cargo').value;
    const activo = document.getElementById('activo').value;
    
    // Validar campos requeridos
    if (isEmpty(tipoIdentificacion) || isEmpty(identificacion) || isEmpty(primerApellido) || 
        isEmpty(primerNombre) || isEmpty(direccion) || isEmpty(celular) || 
        isEmpty(correo) || isEmpty(area) || isEmpty(cargo) || isEmpty(activo)) {
        showNotification('Por favor, complete todos los campos requeridos', 'error');
        return;
    }
    
    // Validar que el estado activo esté seleccionado
    if (activo !== 'SI' && activo !== 'NO') {
        showNotification('Por favor, seleccione el estado del empleado (SI/NO)', 'error');
        return;
    }
    
    // Validar formato de correo
    if (!isValidEmail(correo)) {
        showNotification('Por favor, ingrese un correo electrónico válido', 'error');
        return;
    }
    
    // Construir nombre completo
    const nombreCompleto = `${primerNombre} ${segundoNombre || ''} ${primerApellido} ${segundoApellido || ''}`.trim();
    
    // Obtener nombre del cargo
    const cargoNombre = getCargoNombre(cargo, area);
    
    // Guardar los datos temporalmente para usar en la confirmación
    window.tempEmpleadoData = {
        tipoIdentificacion,
        identificacion,
        primerApellido,
        segundoApellido,
        primerNombre,
        segundoNombre,
        direccion,
        celular,
        correo,
        area,
        cargo,
        cargoNombre,
        activo,
        nombreCompleto,
        ciudad: ciudadActual
    };
    
    // Mostrar modal de confirmación
    showConfirmCreateEmpleadoModal();
}

/**
 * Maneja la actualización de un empleado existente
 */
function handleUpdateEmpleado(empleadoId) {
    // Asegurar que exista ciudad seleccionada antes de actualizar
    ciudadActual = getSelectedCity();
    if (!ciudadActual) {
        promptForCitySelection();
        showNotification('Por favor, seleccione una ciudad antes de actualizar el empleado', 'warning');
        return;
    }
    // Obtener valores de los campos
    const tipoIdentificacion = document.getElementById('tipoIdentificacion').value;
    const identificacion = document.getElementById('identificacion').value;
    const primerApellido = document.getElementById('primerApellido').value;
    const segundoApellido = document.getElementById('segundoApellido').value;
    const primerNombre = document.getElementById('primerNombre').value;
    const segundoNombre = document.getElementById('segundoNombre').value;
    const direccion = document.getElementById('direccion').value;
    const celular = document.getElementById('celular').value;
    const correo = document.getElementById('correo').value;
    const area = document.getElementById('area').value;
    const cargo = document.getElementById('cargo').value;
    const activo = document.getElementById('activo').value;
    
    // Validar campos requeridos
    if (isEmpty(tipoIdentificacion) || isEmpty(identificacion) || isEmpty(primerApellido) || 
        isEmpty(primerNombre) || isEmpty(direccion) || isEmpty(celular) || 
        isEmpty(correo) || isEmpty(area) || isEmpty(cargo) || isEmpty(activo)) {
        showNotification('Por favor, complete todos los campos requeridos', 'error');
        return;
    }
    
    // Validar que el estado activo esté seleccionado
    if (activo !== 'SI' && activo !== 'NO') {
        showNotification('Por favor, seleccione el estado del empleado (SI/NO)', 'error');
        return;
    }
    
    // Validar formato de correo
    if (!isValidEmail(correo)) {
        showNotification('Por favor, ingrese un correo electrónico válido', 'error');
        return;
    }
    
    // Construir nombre completo
    const nombreCompleto = `${primerNombre} ${segundoNombre || ''} ${primerApellido} ${segundoApellido || ''}`.trim();
    
    // Obtener nombre del cargo
    const cargoNombre = getCargoNombre(cargo, area);
    
    console.log('=== DATOS DE ACTUALIZACIÓN ===');
    console.log('Nombre completo construido:', nombreCompleto);
    console.log('Cargo nombre:', cargoNombre);
    console.log('Área:', area);
    console.log('Identificación:', identificacion);
    
    // Guardar los datos temporalmente para usar en la confirmación
    window.tempUpdateEmpleadoData = {
        empleadoId,
        tipoIdentificacion,
        identificacion,
        primerApellido,
        segundoApellido,
        primerNombre,
        segundoNombre,
        direccion,
        celular,
        correo,
        area,
        cargo,
        cargoNombre,
        activo,
        nombreCompleto,
        ciudad: ciudadActual
    };
    
    // Mostrar modal de confirmación para actualizar
    showConfirmUpdateEmpleadoModal();
}

/**
 * Maneja la búsqueda de empleados
 */
function handleSearchEmpleado() {
    // Obtener valores de los campos
    const nombre = document.getElementById('searchEmpleadoNombre').value;
    const area = document.getElementById('searchEmpleadoArea').value;
    
    // Validar que se haya ingresado al menos un criterio
    if (isEmpty(nombre) && isEmpty(area)) {
        showNotification('Por favor, ingrese al menos un criterio de búsqueda', 'error');
        return;
    }
    
    // Simular búsqueda y mostrar resultados
    const searchResults = performSearch(nombre, area);
    displaySearchResults(searchResults);
    
    // Limpiar formulario de búsqueda
    clearSearchEmpleadoForm();
}

// ========================================
// FUNCIONES DE CARGA DE DATOS
// ========================================

/**
 * Carga los datos de cargos para el formulario de crear empleado
 */
/**
 * Carga los cargos disponibles desde el backend
 * 
 * @function loadCargos
 * @description Inicializa la carga de cargos y prepara los selectores
 * 
 * BACKEND INTEGRATION:
 * - Endpoint: GET /api/cargos
 * - Respuesta esperada: { success: true, cargos: [...] }
 * 
 * @returns {void}
 */
function loadCargos() {
    // TODO: BACKEND INTEGRATION - Cargar cargos
    // Endpoint: GET /api/cargos
    // Respuesta esperada: { success: true, cargos: [...] }
    //
    // fetch('/api/cargos', {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
    //     }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         cargosData = data.cargos;
    //         // Organizar cargos por área
    //         cargosPorArea = {
    //             administrativo: data.cargos.filter(c => c.area === 'administrativo'),
    //             pyf: data.cargos.filter(c => c.area === 'pyf'),
    //             servicio: data.cargos.filter(c => c.area === 'servicio')
    //         };
    //     } else {
    //         console.error('Error al cargar cargos:', data.message);
    //     }
    // })
    // .catch(error => {
    //     console.error('Error al cargar cargos:', error);
    // });
    
    // Por ahora usamos datos estáticos
    // Inicializar el select de cargos vacío
    const cargoSelect = document.getElementById('cargo');
    if (cargoSelect) {
        cargoSelect.innerHTML = '<option value="">Primero seleccione un área</option>';
        cargoSelect.disabled = true;
    }
}

/**
 * Carga los cargos según el área seleccionada
 * @param {string} area - Área seleccionada
 */
function loadCargosByArea(area) {
    const cargoSelect = document.getElementById('cargo');
    if (!cargoSelect) return;
    
    // Limpiar el select
    cargoSelect.innerHTML = '<option value="">Seleccione el cargo</option>';
    
    if (area && cargosPorArea[area]) {
        // Habilitar el select
        cargoSelect.disabled = false;
        
        // Cargar cargos del área seleccionada
        cargosPorArea[area].forEach(cargo => {
            const option = document.createElement('option');
            option.value = cargo.codigo;
            option.textContent = cargo.nombre;
            cargoSelect.appendChild(option);
        });
        
        // Actualizar cargosData con los cargos del área seleccionada
        cargosData = cargosPorArea[area];
        
        console.log('Cargos cargados para área:', area, cargosPorArea[area]);
    } else {
        // Deshabilitar el select si no hay área seleccionada
        cargoSelect.disabled = true;
        cargoSelect.innerHTML = '<option value="">Primero seleccione un área</option>';
        cargosData = [];
    }
}

/**
 * Obtiene el nombre del cargo por su código
 * @param {string} cargoCodigo - Código del cargo
 * @returns {string} - Nombre del cargo
 */
function getCargoNombre(cargoCodigo, area = null) {
    let cargo;
    
    if (area && cargosPorArea[area]) {
        // Buscar en los cargos del área específica
        cargo = cargosPorArea[area].find(c => c.codigo === cargoCodigo);
    } else {
        // Buscar en cargosData como fallback
        cargo = cargosData.find(c => c.codigo === cargoCodigo);
    }
    
    return cargo ? cargo.nombre : cargoCodigo;
}

// ========================================
// FUNCIONES UTILITARIAS
// ========================================

/**
 * Muestra una notificación al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Valida si un campo está vacío
 * @param {string} value - Valor a validar
 * @returns {boolean} - true si está vacío, false si no
 */
function isEmpty(value) {
    return !value || value.trim() === '';
}

/**
 * Valida si un email tiene formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido, false si no
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Establece el estado activo del empleado
 * @param {string} value - Valor a establecer (SI o NO)
 */
function setActivo(value) {
    const activoInput = document.getElementById('activo');
    const yesBtn = document.querySelector('.btn-toggle-yes');
    const noBtn = document.querySelector('.btn-toggle-no');
    
    // Establecer el valor
    activoInput.value = value;
    
    // Actualizar los botones
    if (value === 'SI') {
        yesBtn.classList.add('active');
        noBtn.classList.remove('active');
    } else if (value === 'NO') {
        noBtn.classList.add('active');
        yesBtn.classList.remove('active');
    }
}

/**
 * Limpia el formulario de crear empleado
 */
function clearCreateEmpleadoForm() {
    document.getElementById('tipoIdentificacion').value = '';
    document.getElementById('identificacion').value = '';
    document.getElementById('primerApellido').value = '';
    document.getElementById('segundoApellido').value = '';
    document.getElementById('primerNombre').value = '';
    document.getElementById('segundoNombre').value = '';
    document.getElementById('direccion').value = '';
    document.getElementById('celular').value = '';
    document.getElementById('correo').value = '';
    document.getElementById('area').value = '';
    document.getElementById('cargo').value = '';
    document.getElementById('activo').value = '';
    
    // Resetear botones toggle
    const yesBtn = document.querySelector('.btn-toggle-yes');
    const noBtn = document.querySelector('.btn-toggle-no');
    if (yesBtn && noBtn) {
        yesBtn.classList.remove('active');
        noBtn.classList.remove('active');
    }
}

/**
 * Limpia el formulario de búsqueda de empleado
 */
function clearSearchEmpleadoForm() {
    document.getElementById('searchEmpleadoNombre').value = '';
    document.getElementById('searchEmpleadoArea').value = '';
}

/**
 * Realiza la búsqueda de empleados
 * @param {string} nombre - Nombre a buscar
 * @param {string} area - Área a filtrar
 * @returns {Array} - Array de empleados encontrados
 */
/**
 * Realiza la búsqueda de empleados según criterios especificados
 * 
 * @function performSearch
 * @param {string} nombre - Nombre a buscar (puede ser parcial)
 * @param {string} area - Área a filtrar
 * @description Busca empleados que coincidan con los criterios especificados
 * 
 * BACKEND INTEGRATION:
 * - Endpoint: GET /api/empleados/search?nombre={nombre}&area={area}
 * - Respuesta esperada: { success: true, empleados: [...] }
 * 
 * @returns {Array} Array de empleados que coinciden con los criterios
 */
function performSearch(nombre, area) {
    // TODO: BACKEND INTEGRATION - Búsqueda de empleados
    // Endpoint: GET /api/empleados/search
    // Parámetros: nombre (opcional), area (opcional)
    // Respuesta esperada: { success: true, empleados: [...] }
    //
    // const params = new URLSearchParams();
    // if (nombre && nombre.trim() !== '') {
    //     params.append('nombre', nombre.trim());
    // }
    // if (area && area.trim() !== '') {
    //     params.append('area', area.trim());
    // }
    //
    // return fetch(`/api/empleados/search?${params.toString()}`, {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
    //     }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         return data.empleados;
    //     } else {
    //         throw new Error(data.message || 'Error en la búsqueda');
    //     }
    // })
    // .catch(error => {
    //     console.error('Error en búsqueda:', error);
    //     showNotification('Error al buscar empleados', 'error');
    //     return [];
    // });
    
    // Por ahora buscamos en memoria local
    const allEmpleados = Object.values(userCreatedEmpleados);
    
    return allEmpleados.filter(empleado => {
        let matches = true;
        
        if (nombre && nombre.trim() !== '') {
            matches = matches && empleado.nombreCompleto.toLowerCase().includes(nombre.toLowerCase());
        }
        
        if (area && area.trim() !== '') {
            matches = matches && empleado.area === area;
        }
        
        return matches;
    });
}

/**
 * Muestra los resultados de búsqueda en la interfaz
 * @param {Array} searchResults - Array de empleados encontrados
 */
function displaySearchResults(searchResults) {
    const searchResultsSection = document.getElementById('searchResultsSection');
    const searchResultsBody = document.getElementById('empleadoSearchResultsBody');
    
    if (!searchResultsSection || !searchResultsBody) {
        console.error('No se encontraron los elementos de resultados de búsqueda');
        return;
    }
    
    // Limpiar resultados anteriores
    searchResultsBody.innerHTML = '';
    
    if (searchResults.length === 0) {
        // Mostrar mensaje de "no se encontraron resultados"
        searchResultsBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron resultados</p>
                        <small>Intente con otros criterios de búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        // Mostrar resultados encontrados
        searchResults.forEach(empleado => {
            const row = document.createElement('tr');
            row.setAttribute('data-empleado-id', empleado.identificacion);
            row.innerHTML = `
                <td>${empleado.identificacion}</td>
                <td>${empleado.nombreCompleto}</td>
                <td>${empleado.cargoNombre}</td>
                <td>${empleado.celular}</td>
                <td>${empleado.activo}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editEmpleado('${empleado.identificacion}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmpleado('${empleado.identificacion}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            searchResultsBody.appendChild(row);
        });
    }
    
    // Mostrar la sección de resultados
    searchResultsSection.style.display = 'block';
    
    console.log(`Búsqueda completada. Se encontraron ${searchResults.length} empleados.`);
}

/**
 * Agrega un empleado a la sección correspondiente
 * @param {Object} empleadoData - Datos del empleado
 * @param {boolean} replaceIfExists - Si true, reemplaza la fila existente
 */
/**
 * Agrega un empleado a la sección correspondiente de la interfaz
 * 
 * @function addEmpleadoToSection
 * @param {Object} empleadoData - Datos del empleado a agregar
 * @param {boolean} replaceIfExists - Si debe reemplazar empleado existente
 * @description Agrega o actualiza un empleado en la tabla correspondiente según su área
 * 
 * FUNCIONALIDADES:
 * - Guarda el empleado en memoria local
 * - Mapea el área a la sección correspondiente
 * - Crea o actualiza la fila en la tabla
 * - Establece el atributo data-empleado-id
 * - Maneja mensajes de "no hay datos"
 * 
 * @returns {void}
 */
function addEmpleadoToSection(empleadoData, replaceIfExists = false) {
    const { area, identificacion } = empleadoData;
    
    // Guardar por ciudad y persistir
    const city = getSelectedCityCode();
    if (!city) { showNotification('Seleccione una ciudad primero', 'warning'); return; }
    if (!empleadosByCity[city]) empleadosByCity[city] = {};
    const toSave = { ...empleadoData, ciudad: city };
    empleadosByCity[city][identificacion] = toSave;
    persistEmpleadosByCity();
    // También reflejar en memoria y UI actual
    userCreatedEmpleados[identificacion] = toSave;
    
    // Mapear el área a la sección correspondiente
    let sectionId;
    let sectionName;
    
    switch (area) {
        case 'administrativo':
            sectionId = 'content-administrativo';
            sectionName = 'Administrativo';
            break;
        case 'pyf':
            sectionId = 'content-pyf';
            sectionName = 'PYF';
            break;
        case 'servicio':
            sectionId = 'content-servicio';
            sectionName = 'Servicio';
            break;
        default:
            console.error('Área no válida:', area);
            return;
    }
    
    // Obtener el tbody de la sección
    const sectionContent = document.getElementById(sectionId);
    if (!sectionContent) {
        console.error('No se encontró la sección:', sectionId);
        return;
    }
    
    const tbody = sectionContent.querySelector('tbody');
    if (!tbody) {
        console.error('No se encontró el tbody en la sección:', sectionId);
        return;
    }
    
    // Limpiar mensaje de "no hay registros" si existe
    const noDataRow = tbody.querySelector('.no-data-message');
    if (noDataRow) {
        noDataRow.remove();
    }
    
    // Buscar fila existente siguiendo el patrón de titulares
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const existingRow = allRows.find(r => {
        const idCell = r.querySelector('td:nth-child(1)');
        if (!idCell) return false;
        // Verificar que no sea una fila de "no-data-message"
        if (idCell.hasAttribute('colspan') || r.querySelector('.no-data-message')) return false;
        return idCell.textContent.trim() === identificacion.trim();
    });
    
    const rowHtml = `
        <td>${identificacion}</td>
        <td>${empleadoData.nombreCompleto}</td>
        <td>${empleadoData.cargoNombre}</td>
        <td>${empleadoData.celular}</td>
        <td>${empleadoData.activo}</td>
        <td>
            <button class="btn btn-primary btn-sm" onclick="editEmpleado('${identificacion}')" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteEmpleado('${identificacion}')" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    if (existingRow && replaceIfExists) {
        // Actualizar fila existente
        existingRow.innerHTML = rowHtml;
        existingRow.setAttribute('data-empleado-id', identificacion);
        console.log(`Empleado ${identificacion} actualizado en la sección ${sectionName}`);
    } else if (!existingRow) {
        // Crear nueva fila solo si no existe
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-empleado-id', identificacion);
        newRow.innerHTML = rowHtml;
        tbody.appendChild(newRow);
        console.log(`Empleado ${identificacion} agregado a la sección ${sectionName}`);
    }
    // Si existe pero no se debe reemplazar, no hacer nada
    
    // Expandir la sección si está cerrada
    const sectionElement = sectionContent.closest('.empleado-section');
    if (sectionElement) {
        const sectionNameAttr = sectionElement.getAttribute('data-section');
        if (sectionNameAttr === area) {
            // Asegurar que la sección esté expandida
            sectionContent.style.display = 'block';
            sectionContent.classList.add('expanded');
            
            // Cambiar el icono a chevron-down
            const icon = sectionElement.querySelector('.section-icon');
            if (icon) {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            }
        }
    }
    
    console.log(`Empleado ${identificacion} agregado a la sección ${sectionName}`);
}


/**
 * Elimina un empleado de la interfaz de usuario
 * @param {string} empleadoId - ID del empleado a eliminar
 */
function removeEmpleadoFromUI(empleadoId) {
    // Buscar y eliminar el empleado de todas las secciones
    const sections = ['administrativo', 'pyf', 'servicio'];
    
    sections.forEach(section => {
        const tbody = document.querySelector(`#content-${section} tbody`);
        if (tbody) {
            const row = tbody.querySelector(`tr[data-empleado-id="${empleadoId}"]`);
            if (row) {
                row.remove();
                
                // Verificar si la sección quedó vacía y mostrar mensaje de "no hay registros"
                const remainingRows = tbody.querySelectorAll('tr[data-empleado-id]');
                if (remainingRows.length === 0) {
                    showNoDataMessage(tbody, section);
                }
            }
        }
    });
}

/**
 * Muestra el mensaje de "no hay registros" en una sección
 * @param {HTMLElement} tbody - Elemento tbody de la tabla
 * @param {string} section - Nombre de la sección
 */
function showNoDataMessage(tbody, section) {
    const sectionNames = {
        'administrativo': 'empleados administrativos',
        'pyf': 'empleados PYF',
        'servicio': 'empleados de servicios'
    };
    
    const sectionName = sectionNames[section] || 'empleados';
    
    const noDataRow = document.createElement('tr');
    noDataRow.className = 'no-data-message';
    noDataRow.innerHTML = `
        <td colspan="6" class="no-data-message">
            <div class="no-data-content">
                <i class="fas fa-users"></i>
                <p>No existen registros de ${sectionName}</p>
                <small>Haz clic en "Crear" para crear el primer empleado</small>
            </div>
        </td>
    `;
    
    tbody.appendChild(noDataRow);
}

// ========================================
// FUNCIONES DE CONFIRMACIÓN
// ========================================

/**
 * Muestra el modal de confirmación para crear empleado
 */
function showConfirmCreateEmpleadoModal() {
    const modal = document.getElementById('confirmCreateEmpleadoModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
}

/**
 * Cancela la creación del empleado
 */
function cancelCreateEmpleado() {
    const modal = document.getElementById('confirmCreateEmpleadoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Limpiar datos temporales
    window.tempEmpleadoData = null;
}

/**
 * Confirma la creación del empleado
 */
function confirmCreateEmpleado() {
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('confirmCreateEmpleadoModal');
        confirmModal.classList.remove('show');
    
    // Obtener datos temporales
    const empleadoData = window.tempEmpleadoData;
    
    if (!empleadoData) {
        console.error('No se encontraron datos del empleado para crear');
        return;
    }
    
    console.log('Datos del empleado a crear:', empleadoData);
    
    // TODO: BACKEND INTEGRATION - Crear empleado
    // Endpoint: POST /api/empleados
    // Datos: { tipoIdentificacion, identificacion, primerApellido, segundoApellido, primerNombre, segundoNombre, direccion, celular, correo, area, cargo, activo }
    // Respuesta esperada: { success: true, empleado: {...}, message: "Empleado creado exitosamente" }
    // 
    // fetch('/api/empleados', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
    //     },
    //     body: JSON.stringify(empleadoData)
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         addEmpleadoToSection(data.empleado);
    //         showSuccessCreateEmpleadoModal();
    //     } else {
    //         showNotification('Error al crear empleado: ' + data.message, 'error');
    //     }
    // })
    // .catch(error => {
    //     console.error('Error al crear empleado:', error);
    //     showNotification('Error de conexión al crear empleado', 'error');
    // });
    
    // Por ahora solo guardamos en memoria local
    // Agregar el nuevo empleado a la sección correspondiente
    addEmpleadoToSection(empleadoData);
    
    // Cerrar modal de creación y limpiar formulario
    closeCreateEmpleadoModal();
    
    // Mostrar modal de éxito
    showSuccessCreateEmpleadoModal();
    
    // Limpiar datos temporales
    window.tempEmpleadoData = null;
}

/**
 * Procesa la actualización de un empleado siguiendo el patrón de titulares
 */
/**
 * Procesa la actualización de un empleado manejando cambios de ID y área
 * 
 * @function processEmpleadoUpdate
 * @param {Object} nuevoEmpleado - Datos actualizados del empleado
 * @description Maneja la lógica compleja de actualización incluyendo:
 *              - Cambios de identificación
 *              - Cambios de área (movimiento entre secciones)
 *              - Actualización de tablas de búsqueda
 * 
 * LÓGICA COMPLEJA:
 * 1. Verificar si cambió la identificación
 * 2. Si cambió, eliminar registro anterior y crear uno nuevo
 * 3. Verificar si cambió el área
 * 4. Si cambió área, mover empleado entre secciones
 * 5. Actualizar tablas de búsqueda activas
 * 
 * @returns {void}
 */
function processEmpleadoUpdate(nuevoEmpleado) {
    const identificacion = nuevoEmpleado.identificacion;
    const nuevaArea = nuevoEmpleado.area;
    
    // PASO 1: Verificar si el ID cambió
    const originalId = document.getElementById('identificacion').getAttribute('data-original-id');
    if (originalId && originalId !== identificacion) {
        // El ID cambió - eliminar el empleado anterior completo
        console.log(`ID cambió de ${originalId} a ${identificacion}`);
        delete userCreatedEmpleados[originalId];
        removeEmpleadoFromUI(originalId);
    }
    
    // PASO 2: Verificar si el área cambió (movimiento entre secciones)
    const empleadoAnterior = userCreatedEmpleados[identificacion];
    if (empleadoAnterior && empleadoAnterior.area !== nuevaArea) {
        // El área cambió - eliminar el empleado de la sección anterior
        console.log(`Área cambió de ${empleadoAnterior.area} a ${nuevaArea}`);
        removeEmpleadoFromSection(identificacion, empleadoAnterior.area);
    }
    
    // Guardar por ciudad y persistir
    const city = getSelectedCityCode();
    if (!empleadosByCity[city]) empleadosByCity[city] = {};
    const toSave = { ...nuevoEmpleado, ciudad: city };
    empleadosByCity[city][identificacion] = toSave;
    persistEmpleadosByCity();
    // También reflejar en memoria
    userCreatedEmpleados[identificacion] = toSave;
    
    // Actualizar tabla principal (esto agregará en la nueva área si cambió)
    addEmpleadoToSection(nuevoEmpleado, true);
    
    // Actualizar tabla de resultados de búsqueda si está abierta
    const searchModal = document.getElementById('searchEmpleadoModal');
    if (searchModal && searchModal.classList.contains('show')) {
        // Re-buscar y mostrar resultados actualizados
        const nombre = document.getElementById('searchEmpleadoNombre').value;
        const area = document.getElementById('searchEmpleadoArea').value;
        const searchResults = performSearch(nombre, area);
        displaySearchResults(searchResults);
    }
    
    // Limpiar el atributo de ID original
    document.getElementById('identificacion').removeAttribute('data-original-id');
    
    // Resetear el título y texto del botón
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'CREAR EMPLEADO';
    }
    
    const submitButton = document.getElementById('bCrearSubmit');
    if (submitButton) {
        submitButton.textContent = 'Crear';
        submitButton.onclick = handleCreateEmpleado;
    }
}

/**
 * Elimina un empleado de una sección específica
 * @param {string} empleadoId - ID del empleado a eliminar
 * @param {string} area - Área de la cual eliminar el empleado
 */
function removeEmpleadoFromSection(empleadoId, area) {
    // Mapear el área a la sección correspondiente
    let sectionId;
    let sectionName;
    
    switch (area) {
        case 'administrativo':
            sectionId = 'content-administrativo';
            sectionName = 'Administrativo';
            break;
        case 'pyf':
            sectionId = 'content-pyf';
            sectionName = 'PYF';
            break;
        case 'servicio':
            sectionId = 'content-servicio';
            sectionName = 'Servicio';
            break;
        default:
            console.error('Área no válida:', area);
            return;
    }
    
    // Obtener el tbody de la sección
    const sectionContent = document.getElementById(sectionId);
    if (!sectionContent) {
        console.error('No se encontró la sección:', sectionId);
        return;
    }
    
    const tbody = sectionContent.querySelector('tbody');
    if (!tbody) {
        console.error('No se encontró el tbody en la sección:', sectionId);
        return;
    }
    
    // Buscar la fila del empleado en esta sección específica
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const empleadoRow = allRows.find(r => {
        const idCell = r.querySelector('td:nth-child(1)');
        if (!idCell) return false;
        // Verificar que no sea una fila de "no-data-message"
        if (idCell.hasAttribute('colspan') || r.querySelector('.no-data-message')) return false;
        return idCell.textContent.trim() === empleadoId.trim();
    });
    
    if (empleadoRow) {
        empleadoRow.remove();
        console.log(`Empleado ${empleadoId} eliminado de la sección ${sectionName}`);
        
        // Verificar si la sección quedó vacía y mostrar mensaje de "no hay registros"
        const remainingRows = tbody.querySelectorAll('tr');
        if (remainingRows.length === 0) {
            showNoDataMessage(tbody, area);
        }
    } else {
        console.log(`No se encontró el empleado ${empleadoId} en la sección ${sectionName}`);
    }
}

/**
 * Muestra el modal de confirmación para actualizar empleado
 */
function showConfirmUpdateEmpleadoModal() {
    const modal = document.getElementById('confirmUpdateEmpleadoModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cancela la actualización del empleado
 */
function cancelUpdateEmpleado() {
    const modal = document.getElementById('confirmUpdateEmpleadoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Limpiar datos temporales
    window.tempUpdateEmpleadoData = null;
}

/**
 * Confirma la actualización del empleado
 */
function confirmUpdateEmpleado() {
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('confirmUpdateEmpleadoModal');
    confirmModal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Obtener datos temporales
    const empleadoData = window.tempUpdateEmpleadoData;
    
    if (!empleadoData) {
        console.error('No se encontraron datos del empleado para actualizar');
        return;
    }
    
    console.log('Datos del empleado a actualizar:', empleadoData);
    
    // TODO: BACKEND INTEGRATION - Actualizar empleado
    // Endpoint: PUT /api/empleados/{id}
    // Datos: { tipoIdentificacion, identificacion, primerApellido, segundoApellido, primerNombre, segundoNombre, direccion, celular, correo, area, cargo, activo }
    // Respuesta esperada: { success: true, empleado: {...}, message: "Empleado actualizado exitosamente" }
    //
    // fetch(`/api/empleados/${empleadoData.identificacion}`, {
    //     method: 'PUT',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
    //     },
    //     body: JSON.stringify(empleadoData)
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         processEmpleadoUpdate(data.empleado);
    //         showSuccessUpdateEmpleadoModal();
    //     } else {
    //         showNotification('Error al actualizar empleado: ' + data.message, 'error');
    //     }
    // })
    // .catch(error => {
    //     console.error('Error al actualizar empleado:', error);
    //     showNotification('Error de conexión al actualizar empleado', 'error');
    // });
    
    // Por ahora solo actualizamos en memoria local
    // Procesar la actualización siguiendo el patrón de titulares
    processEmpleadoUpdate(empleadoData);
    
    // Cerrar modal de actualización y limpiar formulario
    closeCreateEmpleadoModal();
    
    // Mostrar modal de éxito
    showSuccessUpdateEmpleadoModal();
    
    // Limpiar datos temporales
    window.tempUpdateEmpleadoData = null;
}

/**
 * Muestra el modal de éxito para crear empleado
 */
function showSuccessCreateEmpleadoModal() {
    const modal = document.getElementById('successCreateEmpleadoModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
}

/**
 * Muestra el modal de éxito para actualizar empleado
 */
function showSuccessUpdateEmpleadoModal() {
    const modal = document.getElementById('successUpdateEmpleadoModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de éxito
 */
function closeSuccessModal() {
    const modal = document.getElementById('successCreateEmpleadoModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
}

/**
 * Cierra el modal de éxito de actualización
 */
function closeSuccessUpdateEmpleadoModal() {
    const modal = document.getElementById('successUpdateEmpleadoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

/**
 * Muestra el modal de confirmación para eliminar empleado
 */
function showConfirmDeleteEmpleadoModal() {
    const modal = document.getElementById('confirmDeleteEmpleadoModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
}

/**
 * Cancela la eliminación del empleado
 */
function cancelDeleteEmpleado() {
    const modal = document.getElementById('confirmDeleteEmpleadoModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    
    // Limpiar datos temporales
    window.tempDeleteEmpleadoId = null;
}

/**
 * Confirma la eliminación del empleado
 */
function confirmDeleteEmpleado() {
    const empleadoId = window.tempDeleteEmpleadoId;
    
    if (empleadoId) {
        // TODO: BACKEND INTEGRATION - Eliminar empleado
        // Endpoint: DELETE /api/empleados/{id}
        // Respuesta esperada: { success: true, message: "Empleado eliminado exitosamente" }
        //
        // fetch(`/api/empleados/${empleadoId}`, {
        //     method: 'DELETE',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        //     }
        // })
        // .then(response => response.json())
        // .then(data => {
        //     if (data.success) {
        //         // Eliminar de memoria local y UI
        //         if (userCreatedEmpleados[empleadoId]) {
        //             delete userCreatedEmpleados[empleadoId];
        //         }
        //         removeEmpleadoFromUI(empleadoId);
        //         showSuccessDeleteEmpleadoModal();
        //     } else {
        //         showNotification('Error al eliminar empleado: ' + data.message, 'error');
        //     }
        // })
        // .catch(error => {
        //     console.error('Error al eliminar empleado:', error);
        //     showNotification('Error de conexión al eliminar empleado', 'error');
        // });
        
        // Por ahora solo eliminamos de memoria local
        // Eliminar el empleado de la estructura de datos y del bucket por ciudad
        const city = getSelectedCityCode();
        if (userCreatedEmpleados[empleadoId]) {
            delete userCreatedEmpleados[empleadoId];
            if (empleadosByCity[city]) {
                delete empleadosByCity[city][empleadoId];
                persistEmpleadosByCity();
            }
        }
        
        // Eliminar el empleado de la interfaz
        removeEmpleadoFromUI(empleadoId);
        
        // Actualizar tabla de resultados de búsqueda si está abierta
        const searchModal = document.getElementById('searchEmpleadoModal');
        if (searchModal && searchModal.classList.contains('show')) {
            // Re-buscar y mostrar resultados actualizados
            const nombre = document.getElementById('searchEmpleadoNombre').value;
            const area = document.getElementById('searchEmpleadoArea').value;
            const searchResults = performSearch(nombre, area);
            displaySearchResults(searchResults);
        }
        
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmDeleteEmpleadoModal');
            confirmModal.classList.remove('show');
        
        // Mostrar modal de éxito
        showSuccessDeleteEmpleadoModal();
        
        // Limpiar datos temporales
        window.tempDeleteEmpleadoId = null;
    }
}

/**
 * Muestra el modal de éxito para eliminar empleado
 */
function showSuccessDeleteEmpleadoModal() {
    const modal = document.getElementById('successDeleteEmpleadoModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

/**
 * Cierra el modal de éxito para eliminar empleado
 */
function closeSuccessDeleteEmpleadoModal() {
    const modal = document.getElementById('successDeleteEmpleadoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// ========================================
// INICIALIZACIÓN Y EVENT LISTENERS
// ========================================

/**
 * Inicializa la página de empleados cuando se carga el DOM
 * 
 * @function initializePage
 * @description Configura todos los event listeners, carga datos iniciales
 *              y prepara la interfaz para su uso
 * 
 * FUNCIONALIDADES DE INICIALIZACIÓN:
 * - Configurar cierre de modales al hacer clic fuera
 * - Configurar event listeners de botones
 * - Cargar datos de cargos desde backend
 * - Inicializar secciones desplegables
 * - Configurar validaciones de formularios
 * 
 * @returns {void}
 */
function initializePage() {
    console.log('Inicializando página de empleados...');
    // Cargar empleados de la ciudad seleccionada si existe
    loadEmpleadosForSelectedCity();
    // SIEMPRE solicitar selección al cargar esta interfaz
    setTimeout(() => promptForCitySelection(), 300);
    // Escuchar actualizaciones de ciudades
    window.addEventListener('ciudades:updated', () => {
        ciudadActual = getSelectedCity();
    });
    
    // CONFIGURACIÓN DE MODALES: Cerrar al hacer clic fuera
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
                
                // Limpiar datos temporales si se cierra el modal de confirmación
                if (modal.id === 'confirmCreateEmpleadoModal') {
                    window.tempEmpleadoData = null;
                }
            }
        });
    });
    
    // Cerrar modales con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.classList.contains('show')) {
                    modal.classList.remove('show');
                    document.body.style.overflow = 'auto';
                }
            });
        }
    });
    
    // Todas las secciones inician cerradas por defecto
    console.log('Secciones iniciadas cerradas');
    
    // Cargar datos iniciales
    loadCargos();
    
    console.log('Página de empleados inicializada correctamente');
}

// ========================================
// FUNCIONALIDAD DE CERRAR SESIÓN
// ========================================

// Inicializar funcionalidad de cerrar sesión cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del dropdown de usuario
    const userInfo = document.querySelector('.user-info');
    const dropdown = document.getElementById('userDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const sidebar = document.querySelector('.sidebar');
    
    if (userInfo && dropdown) {
        // Toggle del dropdown al hacer clic en el perfil
        userInfo.addEventListener('click', function() {
            dropdown.classList.toggle('show');
            dropdownArrow.classList.toggle('open');
            sidebar.classList.toggle('dropdown-open');
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!userInfo.contains(e.target)) {
                dropdown.classList.remove('show');
                dropdownArrow.classList.remove('open');
                sidebar.classList.remove('dropdown-open');
            }
        });
        
        // Manejar clics en elementos del dropdown
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                
                if (this.classList.contains('logout-item')) {
                    // Funcionalidad de cerrar sesión
                    sessionStorage.removeItem('isAuthenticated');
                    sessionStorage.removeItem('username');
                    window.location.href = '../index.html';
                } else if (this.textContent.includes('ADMINISTRAR USUARIOS')) {
                    // Navegar a administración de usuarios
                    console.log('Navegando a administrar usuarios');
                    // Agregar navegación a página de administración de usuarios aquí
                }
                
                // Cerrar dropdown después del clic
                dropdown.classList.remove('show');
                dropdownArrow.classList.remove('open');
                sidebar.classList.remove('dropdown-open');
            });
        });
    }
});

// Exponer funciones globalmente
window.showCreateEmpleadoModal = showCreateEmpleadoModal;
window.closeCreateEmpleadoModal = closeCreateEmpleadoModal;
window.showSearchEmpleadoModal = showSearchEmpleadoModal;
window.closeSearchEmpleadoModal = closeSearchEmpleadoModal;
window.editEmpleado = editEmpleado;
window.deleteEmpleado = deleteEmpleado;
window.handleCreateEmpleado = handleCreateEmpleado;
window.handleSearchEmpleado = handleSearchEmpleado;
window.toggleSection = toggleSection;
window.setActivo = setActivo;
window.loadCargosByArea = loadCargosByArea;

// Función de debug para verificar datos
function debugEmpleados() {
    console.log('=== DEBUG EMPLEADOS ===');
    console.log('userCreatedEmpleados:', userCreatedEmpleados);
    console.log('tempUpdateEmpleadoData:', window.tempUpdateEmpleadoData);
    console.log('cargosData:', cargosData);
    console.log('cargosPorArea:', cargosPorArea);
    console.log('======================');
}

// Función de prueba para actualizar empleado
function testUpdateEmpleado() {
    console.log('=== PRUEBA DE ACTUALIZACIÓN ===');
    
    // Buscar el primer empleado disponible
    const empleadoIds = Object.keys(userCreatedEmpleados);
    if (empleadoIds.length === 0) {
        console.log('No hay empleados para probar');
        return;
    }
    
    const empleadoId = empleadoIds[0];
    const empleado = userCreatedEmpleados[empleadoId];
    
    console.log('Empleado original:', empleado);
    
    // Modificar algunos datos
    const empleadoModificado = {
        ...empleado,
        primerNombre: 'Paula',
        segundoNombre: 'Test',
        nombreCompleto: 'Paula Test ' + empleado.primerApellido + ' ' + empleado.segundoApellido
    };
    
    console.log('Empleado modificado:', empleadoModificado);
    
    // Actualizar en la estructura de datos y bucket por ciudad
    const city = getSelectedCityCode();
    if (!empleadosByCity[city]) empleadosByCity[city] = {};
    const toSave = { ...empleadoModificado, ciudad: city };
    empleadosByCity[city][empleadoId] = toSave;
    persistEmpleadosByCity();
    // También reflejar en memoria
    userCreatedEmpleados[empleadoId] = toSave;
    
    // Actualizar en la UI usando el nuevo sistema
    addEmpleadoToSection(empleadoModificado, true);
    
    console.log('Actualización completada');
    console.log('======================');
}

// Función para verificar el estado de las filas en la tabla
function verificarFilasTabla() {
    console.log('=== VERIFICACIÓN DE FILAS EN TABLA ===');
    
    const sections = ['administrativo', 'pyf', 'servicio'];
    
    sections.forEach(section => {
        const tbody = document.querySelector(`#content-${section} tbody`);
        if (tbody) {
            console.log(`\n--- Sección ${section} ---`);
            const rows = tbody.querySelectorAll('tr');
            console.log(`Total de filas: ${rows.length}`);
            
            rows.forEach((row, index) => {
                const dataId = row.getAttribute('data-empleado-id');
                const firstCell = row.querySelector('td');
                const identificacion = firstCell ? firstCell.textContent.trim() : 'N/A';
                
                console.log(`Fila ${index}: data-empleado-id="${dataId}", identificacion="${identificacion}"`);
                
                if (dataId && dataId !== identificacion) {
                    console.warn(`⚠️  PROBLEMA: data-empleado-id (${dataId}) no coincide con identificacion (${identificacion})`);
                }
            });
        }
    });
    
    console.log('=====================================');
}

// Función de prueba para cambiar área de empleado
function testCambioArea() {
    console.log('=== PRUEBA DE CAMBIO DE ÁREA ===');
    
    // Buscar el primer empleado disponible
    const empleadoIds = Object.keys(userCreatedEmpleados);
    if (empleadoIds.length === 0) {
        console.log('No hay empleados para probar');
        return;
    }
    
    const empleadoId = empleadoIds[0];
    const empleado = userCreatedEmpleados[empleadoId];
    
    console.log('Empleado original:', empleado);
    console.log('Área original:', empleado.area);
    
    // Cambiar el área
    const nuevaArea = empleado.area === 'administrativo' ? 'pyf' : 'administrativo';
    const empleadoModificado = {
        ...empleado,
        area: nuevaArea,
        primerNombre: 'Paula',
        nombreCompleto: 'Paula ' + empleado.primerApellido + ' ' + empleado.segundoApellido
    };
    
    console.log('Empleado modificado:', empleadoModificado);
    console.log('Nueva área:', nuevaArea);
    
    // Procesar la actualización
    processEmpleadoUpdate(empleadoModificado);
    
    console.log('Cambio de área completado');
    console.log('======================');
}

// Exponer funciones de confirmación globalmente
window.showConfirmCreateEmpleadoModal = showConfirmCreateEmpleadoModal;
window.cancelCreateEmpleado = cancelCreateEmpleado;
window.confirmCreateEmpleado = confirmCreateEmpleado;
window.showSuccessCreateEmpleadoModal = showSuccessCreateEmpleadoModal;
window.closeSuccessModal = closeSuccessModal;
window.closeSuccessUpdateEmpleadoModal = closeSuccessUpdateEmpleadoModal;
// Función de debug para probar la edición de empleados
function debugEditEmpleado() {
    console.log('=== DEBUG EDITAR EMPLEADO ===');
    console.log('Empleados disponibles:', Object.keys(userCreatedEmpleados));
    console.log('Cargos por área:', cargosPorArea);
    
    // Probar con el primer empleado disponible
    const empleadoIds = Object.keys(userCreatedEmpleados);
    if (empleadoIds.length > 0) {
        const empleadoId = empleadoIds[0];
        const empleado = userCreatedEmpleados[empleadoId];
        console.log('Probando edición con empleado:', empleado);
        
        // Simular la edición
        editEmpleado(empleadoId);
    } else {
        console.log('No hay empleados para probar');
    }
}

window.debugEmpleados = debugEmpleados;
window.testUpdateEmpleado = testUpdateEmpleado;
window.testCambioArea = testCambioArea;
window.verificarFilasTabla = verificarFilasTabla;
window.showNoDataMessage = showNoDataMessage;
window.removeEmpleadoFromSection = removeEmpleadoFromSection;
window.debugEditEmpleado = debugEditEmpleado;

window.showConfirmUpdateEmpleadoModal = showConfirmUpdateEmpleadoModal;
window.cancelUpdateEmpleado = cancelUpdateEmpleado;
window.confirmUpdateEmpleado = confirmUpdateEmpleado;
window.showSuccessUpdateEmpleadoModal = showSuccessUpdateEmpleadoModal;
window.handleUpdateEmpleado = handleUpdateEmpleado;

window.showConfirmDeleteEmpleadoModal = showConfirmDeleteEmpleadoModal;
window.cancelDeleteEmpleado = cancelDeleteEmpleado;
window.confirmDeleteEmpleado = confirmDeleteEmpleado;
window.showSuccessDeleteEmpleadoModal = showSuccessDeleteEmpleadoModal;
window.closeSuccessDeleteEmpleadoModal = closeSuccessDeleteEmpleadoModal;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', initializePage);

// También inicializar si la página ya está cargada
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
