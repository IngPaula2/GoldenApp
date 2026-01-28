/**
 * 💼 JAVASCRIPT PARA DASHBOARD DE CARGOS - GOLDEN APP
 * 
 * Este archivo contiene toda la funcionalidad JavaScript para la página de cargos.
 * Incluye funciones para modales, secciones desplegables, CRUD de cargos, etc.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2024
 */

// ========================================
// PERFIL DE USUARIO Y DROPDOWN
// ========================================

// Inicializar dropdown del usuario cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const userInfo = document.querySelector('.user-info');
    const dropdown = document.getElementById('userDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const sidebar = document.querySelector('.sidebar');

    if (userInfo && dropdown) {
        // Toggle del dropdown al hacer clic en el perfil
        userInfo.addEventListener('click', function(e) {
            e.stopPropagation();
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
                    // Redirigir inmediatamente al login
                    window.location.href = '../../index.html';
                } else if (this.classList.contains('admin-users-item')) {
                    // Lógica de administrar usuarios
                    alert('Funcionalidad de administrar usuarios en desarrollo');
                }
                // Cerrar dropdown después del clic
                dropdown.classList.remove('show');
                dropdownArrow.classList.remove('open');
                sidebar.classList.remove('dropdown-open');
            });
        });
    }
});

// ========================================
// FUNCIONES DE MODAL DE CERRAR SESIÓN
// ========================================

window.showConfirmLogoutModal = function() {
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) {
        modal.classList.add('show');
    }
}

window.cancelLogout = function() {
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

window.confirmLogout = function() {
    // Limpiar datos de sesión
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Redirigir al index
    window.location.href = '../../index.html';
}

// ========================================
// FUNCIONES DE UTILIDAD PARA BACKEND
// ========================================

/**
 * Obtiene el token de autenticación del sessionStorage
 * @returns {string|null} Token de autenticación o null si no existe
 */
function getAuthToken() {
    return sessionStorage.getItem('authToken');
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} true si está autenticado, false si no
 */
function isAuthenticated() {
    return sessionStorage.getItem('isAuthenticated') === 'true' && getAuthToken() !== null;
}

// ========================================
// VARIABLES GLOBALES
// ========================================

// Almacenar cargos creados por el usuario (solo bucket activo en la UI)
let userCreatedCargos = {};

// Almacenar cargos predeterminados modificados (solo bucket activo en la UI)
let modifiedPredeterminedCargos = {};

// Almacén persistente para cargos creados por usuario (sin ciudades)
const userCargos = (function(){
    try {
        const raw = localStorage.getItem('userCargos');
        return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
})();

// Almacén persistente para cargos predeterminados modificados (sin ciudades)
const modifiedCargos = (function(){
    try {
        const raw = localStorage.getItem('modifiedCargos');
        return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
})();

function persistUserCargos() {
    try { localStorage.setItem('userCargos', JSON.stringify(userCargos)); } catch (e) {}
}

function persistModifiedCargos() {
    try { localStorage.setItem('modifiedCargos', JSON.stringify(modifiedCargos)); } catch (e) {}
}

function loadCargos() {
    // Cargar cargos sin restricción de ciudad
    try {
        // Limpiar estructuras en memoria
        Object.keys(userCreatedCargos).forEach(k => delete userCreatedCargos[k]);
        Object.keys(modifiedPredeterminedCargos).forEach(k => delete modifiedPredeterminedCargos[k]);
        
        // Cargar cargos creados por usuario
        Object.keys(userCargos).forEach(code => { userCreatedCargos[code] = userCargos[code]; });
        
        // Cargar cargos predeterminados modificados
        Object.keys(modifiedCargos).forEach(code => { modifiedPredeterminedCargos[code] = modifiedCargos[code]; });
        
        // Reconstruir tabla
        refreshCargosView();
    } catch (e) {
        console.error('Error cargando cargos:', e);
    }
}

// Función eliminada - ya no se necesita selección de ciudad

/**
 * Normaliza el nombre de la sección para comparaciones
 * @param {string} seccion - Nombre de la sección
 * @returns {string} - Nombre normalizado
 */
function normalizeSection(seccion) {
    const sectionMap = {
        'Administrativo': 'administrativo',
        'PYF': 'pyf',
        'Servicio': 'servicio',
        'Servicios': 'servicio'  // Por si acaso
    };
    return sectionMap[seccion] || seccion.toLowerCase();
}

// ========================================
// FUNCIONES DE MODALES
// ========================================

/**
 * Muestra el modal de crear cargo
 */
function showCreateCargoModal() {
    const modal = document.getElementById('createCargoModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Asegurar que el campo código esté habilitado al crear
    const cargoCodigo = document.getElementById('cargoCodigo');
    if (cargoCodigo) {
        cargoCodigo.disabled = false;
        cargoCodigo.removeAttribute('data-original-code');
    }
    
    // Restaurar el modal a su estado original de creación
    resetModalToCreate();
}

/**
 * Cierra el modal de crear cargo
 */
function closeCreateCargoModal() {
    const modal = document.getElementById('createCargoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Limpiar formulario
    clearCreateCargoForm();
    
    // Restaurar el modal a su estado original de creación
    resetModalToCreate();
}

/**
 * Muestra el modal de buscar cargo
 */
function showSearchCargoModal() {
    const modal = document.getElementById('searchCargoModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de buscar cargo
 */
function closeSearchCargoModal() {
    const modal = document.getElementById('searchCargoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Limpiar formulario
    document.getElementById('searchCargoForm').reset();
}



// ========================================
// FUNCIONES DE SECCIONES DESPLEGABLES
// ========================================

/**
 * Alterna la visibilidad de una sección de cargos
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
// FUNCIONES CRUD DE CARGOS
// ========================================

/**
 * Edita un cargo existente
 * @param {string} cargoId - ID del cargo a editar
 */
function editCargo(cargoId) {
    // Buscar el cargo en los datos existentes
    const cargo = findCargoById(cargoId);
    
    if (cargo) {
        // Cambiar el título del modal
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'ACTUALIZAR CARGO';
        }
        
        // Pre-llenar los campos con la información existente
        const cargoSeccion = document.getElementById('cargoSeccion');
        const cargoCodigo = document.getElementById('cargoCodigo');
        const cargoNombre = document.getElementById('cargoNombre');
        
        if (cargoSeccion) {
            // Mapear nombres de sección a valores del select
            const seccionMap = {
                'Administrativo': 'administrativo',
                'PYF': 'pyf',
                'Servicio': 'servicio',
                'Servicios': 'servicio'  // Para compatibilidad
            };
            const seccionValue = seccionMap[cargo.seccion] || cargo.seccion.toLowerCase();
            console.log('Editando cargo:', cargo.codigo, 'Sección original:', cargo.seccion, 'Valor del select:', seccionValue);
            cargoSeccion.value = seccionValue;
        }
        if (cargoCodigo) {
            cargoCodigo.value = cargo.codigo;
            // Deshabilitar el campo código para evitar cambios
            cargoCodigo.disabled = true;
            // Guardar el código original para control de estado
            cargoCodigo.setAttribute('data-original-code', cargoId);
        }
        if (cargoNombre) cargoNombre.value = cargo.nombre;
        
        // Cambiar el botón y su función
        const submitButton = document.getElementById('bCrearSubmit');
        if (submitButton) {
            submitButton.textContent = 'Actualizar';
            submitButton.onclick = () => handleUpdateCargo(cargoId);
        }
        
        // Mostrar el modal sin resetear (abrir directamente)
        const modal = document.getElementById('createCargoModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    } else {
        showNotification('No se encontró el cargo a editar', 'error');
    }
}

/**
 * Elimina un cargo existente
 * @param {string} cargoId - ID del cargo a eliminar
 */
function deleteCargo(cargoId) {
    // Guardar el ID del cargo a eliminar
    window.tempDeleteCargoId = cargoId;
    
    // Mostrar modal de confirmación
    showConfirmDeleteCargoModal();
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Busca un cargo por su ID en los datos existentes
 * @param {string} cargoId - ID del cargo a buscar
 * @returns {Object|null} - Objeto del cargo o null si no se encuentra
 */
function findCargoById(cargoId) {
    // Primero buscar en los cargos creados por el usuario
    if (userCreatedCargos[cargoId]) {
        return userCreatedCargos[cargoId];
    }
    
    // Luego buscar en los cargos predeterminados modificados
    if (modifiedPredeterminedCargos[cargoId]) {
        return modifiedPredeterminedCargos[cargoId];
    }
    
    // Si no se encuentra, buscar en la base de datos estática
    const allCargos = [
        { codigo: 'EC', nombre: 'Ejecutivo de Cuenta', seccion: 'Administrativo' },
        { codigo: 'EA', nombre: 'Ejecutivo Admon', seccion: 'Administrativo' },
        { codigo: 'EP', nombre: 'Ejecutivo Prejuridico', seccion: 'Administrativo' },
        { codigo: 'EJ', nombre: 'Ejecutivo Juridico', seccion: 'Administrativo' },
        { codigo: 'SP', nombre: 'Supervisor de Cartera', seccion: 'Administrativo' },
        { codigo: 'SN', nombre: 'Supervisor Nacional de Cartera', seccion: 'Administrativo' },
        { codigo: 'C', nombre: 'Castigo Cartera', seccion: 'Administrativo' },
        { codigo: 'PV', nombre: 'Proxima Vigencia', seccion: 'Administrativo' },
        { codigo: 'V', nombre: 'Verificador', seccion: 'Administrativo' },
        { codigo: 'AS', nombre: 'Asesor', seccion: 'PYF' },
        { codigo: 'SU', nombre: 'Supervisor', seccion: 'PYF' },
        { codigo: 'SG', nombre: 'Sub Gerente', seccion: 'PYF' },
        { codigo: 'GT', nombre: 'Gerente', seccion: 'PYF' },
        { codigo: 'DR', nombre: 'Director', seccion: 'PYF' },
        { codigo: 'DN', nombre: 'Director Nacional', seccion: 'PYF' },
        { codigo: 'TU', nombre: 'Tutor', seccion: 'Servicio' },
        { codigo: 'MO', nombre: 'Monitor Tutorias', seccion: 'Servicio' },
        { codigo: 'CN', nombre: 'Coordinador Nacional de Tutorias', seccion: 'Servicio' }
    ];
    
    return allCargos.find(cargo => cargo.codigo === cargoId) || null;
}

/**
 * Elimina un cargo de la interfaz de usuario
 * @param {string} cargoId - ID del cargo a eliminar
 */
function removeCargoFromUI(cargoId) {
    // Buscar y eliminar el cargo de todas las secciones
    const sections = ['administrativo', 'pyf', 'servicio'];
    
    sections.forEach(section => {
        const tbody = document.querySelector(`#content-${section} tbody`);
        if (tbody) {
            const row = tbody.querySelector(`tr[data-cargo-id="${cargoId}"]`);
            if (row) {
                row.remove();
            }
        }
    });
}

/**
 * Actualiza un cargo en la interfaz de usuario
 * @param {string} cargoId - ID del cargo a actualizar
 * @param {Object} cargoData - Nuevos datos del cargo
 */
function updateCargoInUI(cargoId, cargoData) {
    // Actualizar los datos en la estructura userCreatedCargos
    if (userCreatedCargos[cargoId]) {
        userCreatedCargos[cargoId] = {
            codigo: cargoData.tId,
            nombre: cargoData.tNombre,
            seccion: cargoData.bSeccion
        };
    } else {
        // Si no está en userCreatedCargos, es un cargo predeterminado
        // Guardarlo en modifiedPredeterminedCargos
        const toSave = {
            codigo: cargoData.tId,
            nombre: cargoData.tNombre,
            seccion: cargoData.bSeccion,
            activo: true
        };
        modifiedCargos[cargoId] = toSave;
        persistModifiedCargos();
        // También reflejar en memoria
        modifiedPredeterminedCargos[cargoId] = toSave;
    }
    
    // Buscar la fila existente en todas las secciones
    const sections = ['administrativo', 'pyf', 'servicio'];
    let existingRow = null;
    let currentSection = null;
    
    // Encontrar la fila existente
    sections.forEach(section => {
        const tbody = document.querySelector(`#content-${section} tbody`);
        if (tbody) {
            const row = tbody.querySelector(`tr[data-cargo-id="${cargoId}"]`);
            if (row) {
                existingRow = row;
                currentSection = section;
            }
        }
    });
    
    if (existingRow) {
        // Si el cargo cambió de sección, moverlo a la nueva sección
        const normalizedCurrentSection = normalizeSection(currentSection);
        const normalizedNewSection = normalizeSection(cargoData.bSeccion);
        
        if (normalizedCurrentSection !== normalizedNewSection) {
            // Remover de la sección actual
            existingRow.remove();
            
            // Agregar a la nueva sección
            const newCargoData = {
                bSeccion: cargoData.bSeccion,
                tId: cargoData.tId,
                tNombre: cargoData.tNombre
            };
            addCargoToSection(newCargoData);
        } else {
            // Si está en la misma sección, solo actualizar las celdas
            const cells = existingRow.querySelectorAll('td');
            if (cells.length >= 3) {
                cells[0].textContent = cargoData.tId;
                cells[1].textContent = cargoData.tNombre;
                cells[2].textContent = cargoData.bSeccion;
            }
            
            // Actualizar el atributo data-cargo-id si cambió el ID
            if (cargoId !== cargoData.tId) {
                existingRow.setAttribute('data-cargo-id', cargoData.tId);
                
                // Actualizar los onclick de los botones
                const editBtn = existingRow.querySelector('button[onclick*="editCargo"]');
                const deleteBtn = existingRow.querySelector('button[onclick*="deleteCargo"]');
                
                if (editBtn) {
                    editBtn.setAttribute('onclick', `editCargo('${cargoData.tId}')`);
                }
                if (deleteBtn) {
                    deleteBtn.setAttribute('onclick', `deleteCargo('${cargoData.tId}')`);
                }
                
                // Actualizar la estructura de datos con el nuevo ID
                if (userCreatedCargos[cargoId]) {
                    userCreatedCargos[cargoData.tId] = userCreatedCargos[cargoId];
                    delete userCreatedCargos[cargoId];
                } else if (modifiedPredeterminedCargos[cargoId]) {
                    modifiedPredeterminedCargos[cargoData.tId] = modifiedPredeterminedCargos[cargoId];
                    delete modifiedPredeterminedCargos[cargoId];
                }
            }
        }
    }
}

/**
 * Restaura el modal a su estado original de creación
 */
function resetModalToCreate() {
    // Restaurar título
    document.getElementById('modalTitle').textContent = 'CREAR CARGO';
    
    // Restaurar botón
    const submitButton = document.getElementById('bCrearSubmit');
    submitButton.textContent = 'Crear';
    submitButton.onclick = handleCreateCargo;
    
    // Asegurar que el campo código esté habilitado
    const cargoCodigo = document.getElementById('cargoCodigo');
    if (cargoCodigo) {
        cargoCodigo.disabled = false;
        cargoCodigo.removeAttribute('data-original-code');
    }
}

// ========================================
// FUNCIONES DE FORMULARIOS
// ========================================

/**
 * Maneja la actualización de un cargo existente
 * @param {string} cargoId - ID del cargo a actualizar
 */
function handleUpdateCargo(cargoId) {
    // Obtener valores de los campos
    const seccion = document.getElementById('cargoSeccion').value;
    const codigo = document.getElementById('cargoCodigo').value;
    const nombre = document.getElementById('cargoNombre').value;
    
    // Validar campos requeridos
    if (isEmpty(seccion) || isEmpty(codigo) || isEmpty(nombre)) {
        showNotification('Por favor, complete todos los campos requeridos', 'error');
        return;
    }
    
    // Validar que el código no exceda 10 caracteres
    if (codigo.length > 10) {
        showNotification('El código no puede exceder 10 caracteres', 'error');
        return;
    }
    
    // Crear objeto de datos para el backend
    const cargoData = {
        bSeccion: seccion,
        tId: codigo,
        tNombre: nombre
    };
    
    console.log('Datos del cargo a actualizar:', cargoData);
    
    // Mostrar modal de confirmación
    window.tempCargoData = cargoData;
    window.tempCargoId = cargoId;
    showConfirmUpdateCargoModal();
}

/**
 * Maneja la creación de un nuevo cargo
 */
function handleCreateCargo() {
    // Obtener valores de los campos
    const seccion = document.getElementById('cargoSeccion').value;
    const codigo = document.getElementById('cargoCodigo').value;
    const nombre = document.getElementById('cargoNombre').value;
    
    // Validar campos requeridos
    if (isEmpty(seccion) || isEmpty(codigo) || isEmpty(nombre)) {
        showNotification('Por favor, complete todos los campos requeridos', 'error');
        return;
    }
    
    // Validar que el código no exceda 10 caracteres
    if (codigo.length > 10) {
        showNotification('El código no puede exceder 10 caracteres', 'error');
        return;
    }
    
    // Guardar los datos temporalmente para usar en la confirmación
    window.tempCargoData = {
        bSeccion: seccion,
        tId: codigo,
        tNombre: nombre
    };
    
    // Mostrar modal de confirmación
    showConfirmCreateCargoModal();
}

/**
 * Muestra el modal de confirmación para crear cargo
 */
function showConfirmCreateCargoModal() {
    const modal = document.getElementById('confirmCreateCargoModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cancela la creación del cargo
 */
function cancelCreateCargo() {
    const modal = document.getElementById('confirmCreateCargoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Limpiar datos temporales
    window.tempCargoData = null;
}

/**
 * Confirma la creación del cargo
 */
function confirmCreateCargo() {
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('confirmCreateCargoModal');
    confirmModal.classList.remove('show');
    
    // Obtener datos temporales
    const cargoData = window.tempCargoData;
    
    if (!cargoData) {
        console.error('No se encontraron datos del cargo para crear');
        return;
    }
    
    console.log('Datos del cargo a crear:', cargoData);
    
    // ========================================
    // 🔗 CONEXIÓN BACKEND - CREAR CARGO
    // ========================================
    // Endpoint: POST /api/cargos
    // Datos: { bSeccion, tId, tNombre }
    
    // Agregar el nuevo cargo a la sección correspondiente
    addCargoToSection(cargoData);
    
    // Cerrar modal de creación y limpiar formulario
    closeCreateCargoModal();
    
    // Mostrar modal de éxito
    showSuccessCreateCargoModal();
    
    // Limpiar datos temporales
    window.tempCargoData = null;
}

/**
 * Muestra el modal de éxito para crear cargo
 */
function showSuccessCreateCargoModal() {
    const modal = document.getElementById('successCreateCargoModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de éxito
 */
function closeSuccessModal() {
    const modal = document.getElementById('successCreateCargoModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

/**
 * Maneja la búsqueda de cargos
 */
function handleSearchCargo() {
    // Obtener valor del campo nombre
    const nombre = document.getElementById('searchCargoNombre').value;
    
    // Validar que se haya ingresado un nombre
    if (isEmpty(nombre)) {
        showNotification('Por favor, ingrese el nombre del cargo a buscar', 'error');
        return;
    }
    
    // Crear objeto de datos para el backend
    const searchData = {
        tNombre: nombre
    };
    
    console.log('Datos de búsqueda:', searchData);
    
    // TODO: Aquí se enviaría la búsqueda al backend
    // Por ahora simulamos resultados para mostrar la funcionalidad
    
    // Simular búsqueda y mostrar resultados
    const searchResults = performSearch(searchData);
    displaySearchResults(searchResults);
    
    // Limpiar formulario de búsqueda
    clearSearchCargoForm();
}

// ========================================
// INICIALIZACIÓN Y EVENT LISTENERS
// ========================================

/**
 * Inicializa la página cuando se carga
 */
function initializePage() {
    console.log('Inicializando página de cargos...');
    // Cargar cargos sin restricción de ciudad
    loadCargos();
    
    // Los formularios ya no existen, se manejan con onclick en los botones
    console.log('Formularios configurados para manejo directo');
    
    // Cerrar modales al hacer clic fuera de ellos
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                document.body.style.overflow = 'auto';
                
                // Limpiar datos temporales si se cierra el modal de confirmación
                if (modal.id === 'confirmCreateCargoModal') {
                    window.tempCargoData = null;
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
    
    console.log('Página de cargos inicializada correctamente');

    // ========================================
    // MODALES DE TOGGLE (crear si no existen)
    // ========================================
    (function ensureCargoToggleModals(){
        try {
            let confirm = document.getElementById('confirmToggleCargoModal');
            if (!confirm) {
                confirm = document.createElement('div');
                confirm.id = 'confirmToggleCargoModal';
                confirm.className = 'modal-overlay';
                confirm.innerHTML = `
                    <div class="modal">
                        <div class="modal-header">
                            <h3 class="modal-title"></h3>
                            <button class="modal-close" onclick="cancelToggleCargo()"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body">
                            <p class="modal-message"></p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="cancelToggleCargo()">Cancelar</button>
                            <button class="btn btn-primary" onclick="confirmToggleCargo()">Confirmar</button>
                        </div>
                    </div>`;
                document.body.appendChild(confirm);
            }
            let success = document.getElementById('successToggleCargoModal');
            if (!success) {
                success = document.createElement('div');
                success.id = 'successToggleCargoModal';
                success.className = 'modal-overlay';
                success.innerHTML = `
                    <div class="modal">
                        <div class="modal-header">
                            <h3 class="modal-title">ESTADO ACTUALIZADO</h3>
                            <button class="modal-close" onclick="closeSuccessToggleCargoModal()"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body">
                            <p class="modal-message"></p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" onclick="closeSuccessToggleCargoModal()">Aceptar</button>
                        </div>
                    </div>`;
                document.body.appendChild(success);
            }
        } catch (e) {}
    })();
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
 * Formatea un código de cargo para mostrar
 * @param {string} code - Código del cargo
 * @returns {string} - Código formateado
 */
function formatCargoCode(code) {
    return code.toUpperCase().trim();
}

/**
 * Agrega un nuevo cargo a la sección correspondiente
 * @param {Object} cargoData - Datos del cargo a agregar
 */
function addCargoToSection(cargoData) {
    const { bSeccion, tId, tNombre } = cargoData;
    
    // Guardar sin restricción de ciudad
    const toSave = {
        codigo: tId,
        nombre: tNombre,
        seccion: bSeccion,
        activo: true
    };
    userCargos[tId] = toSave;
    persistUserCargos();
    // También reflejar en memoria y UI actual
    userCreatedCargos[tId] = toSave;
    
    // Mapear el valor del select a la sección correspondiente
    let sectionId;
    let sectionName;
    
    switch (bSeccion) {
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
            console.error('Sección no válida:', bSeccion);
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
    
    // Crear nueva fila
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-cargo-id', tId);
    const isActive = toSave.activo !== false;
    newRow.innerHTML = `
        <td>${tId}</td>
        <td>${tNombre}</td>
        <td>${sectionName}</td>
        <td>
            <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVO' : 'INACTIVO'}</span>
        </td>
        <td>
            <button class="btn btn-primary btn-sm" onclick="editCargo('${tId}')" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <label class="animated-toggle" data-codigo="${tId}" title="${isActive ? 'Desactivar' : 'Activar'}">
                <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleCargoState('${tId}')">
                <span class="toggle-slider"></span>
            </label>
        </td>
    `;
    
    // Agregar la fila al tbody
    tbody.appendChild(newRow);
    
    // Expandir la sección si está cerrada
    const sectionElement = sectionContent.closest('.cargo-section');
    if (sectionElement) {
        const sectionNameAttr = sectionElement.getAttribute('data-section');
        if (sectionNameAttr === bSeccion) {
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
    
    console.log(`Cargo ${tId} agregado a la sección ${sectionName}`);
}

/**
 * Limpia el formulario de crear cargo
 */
function clearCreateCargoForm() {
    document.getElementById('cargoSeccion').value = '';
    document.getElementById('cargoCodigo').value = '';
    document.getElementById('cargoNombre').value = '';
    
    // Solo habilitar el campo código si no estamos en modo edición
    const isEditing = document.getElementById('cargoCodigo').hasAttribute('data-original-code');
    if (!isEditing) {
        document.getElementById('cargoCodigo').disabled = false;
    }
}

/**
 * Limpia el formulario de búsqueda de cargo
 */
function clearSearchCargoForm() {
    document.getElementById('searchCargoNombre').value = '';
}

/**
 * Realiza la búsqueda de cargos (simulada)
 * @param {Object} searchData - Criterios de búsqueda
 * @returns {Array} - Array de cargos encontrados
 */
function performSearch(searchData) {
    // ========================================
    // 🔗 CONEXIÓN BACKEND - BUSCAR CARGOS
    // ========================================
    // Endpoint: GET /api/cargos/search?nombre=valor
    // Parámetros: nombre
    
    // TODO: Aquí se conectaría con el backend para buscar cargos reales
    // Por ahora simulamos resultados basados solo en el nombre
    
    const { tNombre } = searchData;
    
    // Simular base de datos de cargos
    const allCargos = [
        { codigo: 'EC', nombre: 'EJECUTIVO CUENTA', seccion: 'Administrativo' },
        { codigo: 'EA', nombre: 'EJECUTIVO ADMON', seccion: 'Administrativo' },
        { codigo: 'EP', nombre: 'EJECUTIVO PREJURIDICO', seccion: 'Administrativo' },
        { codigo: 'EJ', nombre: 'EJECUTIVO JURIDICO', seccion: 'Administrativo' },
        { codigo: 'SP', nombre: 'SUPERVISOR DE CARTERA', seccion: 'Administrativo' },
        { codigo: 'SN', nombre: 'SUPERVISOR NACIONAL DE CARTERA', seccion: 'Administrativo' },
        { codigo: 'C', nombre: 'CASTIGO CARTERA', seccion: 'Administrativo' },
        { codigo: 'PV', nombre: 'PROXIMA VIGENCIA', seccion: 'Administrativo' },
        { codigo: 'V', nombre: 'VERIFICADOR', seccion: 'Administrativo' },
        { codigo: 'AS', nombre: 'ASESOR', seccion: 'PYF' },
        { codigo: 'SU', nombre: 'SUPERVISOR', seccion: 'PYF' },
        { codigo: 'SG', nombre: 'SUB GERENTE', seccion: 'PYF' },
        { codigo: 'GT', nombre: 'GERENTE', seccion: 'PYF' },
        { codigo: 'DR', nombre: 'DIRECTOR', seccion: 'PYF' },
        { codigo: 'DN', nombre: 'DIRECTOR NACIONAL', seccion: 'PYF' },
        { codigo: 'TU', nombre: 'TUTOR', seccion: 'Servicios' },
        { codigo: 'MO', nombre: 'MONITOR TUTORIAS', seccion: 'Servicios' },
        { codigo: 'CN', nombre: 'COORDINADOR NACIONAL DE TUTORIAS', seccion: 'Servicios' }
    ];
    
    // Filtrar cargos solo por nombre
    if (tNombre && tNombre.trim() !== '') {
        return allCargos.filter(cargo => 
            cargo.nombre.toLowerCase().includes(tNombre.toLowerCase())
        );
    }
    
    return [];
}

/**
 * Muestra los resultados de búsqueda en la interfaz
 * @param {Array} searchResults - Array de cargos encontrados
 */
function displaySearchResults(searchResults) {
    const searchResultsSection = document.getElementById('searchResultsSection');
    const searchResultsBody = document.getElementById('cargoSearchResultsBody');
    
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
                <td colspan="4" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron resultados</p>
                        <small>Intente con otro nombre de cargo</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        // Mostrar resultados encontrados
        searchResults.forEach(cargo => {
            const row = document.createElement('tr');
            const isActive = true; // sin fuente de estado, por defecto activo
            row.innerHTML = `
                <td>${cargo.codigo}</td>
                <td>${cargo.nombre}</td>
                <td>${cargo.seccion}</td>
                <td><span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVO' : 'INACTIVO'}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editCargo('${cargo.codigo}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <label class="animated-toggle" data-codigo="${cargo.codigo}" title="${isActive ? 'Desactivar' : 'Activar'}">
                        <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleCargoState('${cargo.codigo}')">
                        <span class="toggle-slider"></span>
                    </label>
                </td>
            `;
            searchResultsBody.appendChild(row);
        });
    }
    
    // Mostrar la sección de resultados
    searchResultsSection.style.display = 'block';
    
    console.log(`Búsqueda completada. Se encontraron ${searchResults.length} cargos.`);
}

// ========================================
// INICIALIZACIÓN AUTOMÁTICA
// ========================================

// ========================================
// FUNCIONES DE CONFIRMACIÓN PARA ACTUALIZAR CARGOS
// ========================================

/**
 * Muestra el modal de confirmación para actualizar cargo
 */
function showConfirmUpdateCargoModal() {
    const modal = document.getElementById('confirmUpdateCargoModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela la actualización del cargo
 */
function cancelUpdateCargo() {
    const confirmModal = document.getElementById('confirmUpdateCargoModal');
    if (confirmModal) {
        confirmModal.classList.remove('show');
    }
    
    // Limpiar datos temporales
    window.tempCargoData = null;
    window.tempCargoId = null;
}

/**
 * Confirma la actualización del cargo
 */
function confirmUpdateCargo() {
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('confirmUpdateCargoModal');
    if (confirmModal) {
        confirmModal.classList.remove('show');
    }
    
    // Obtener datos temporales
    const cargoData = window.tempCargoData;
    const cargoId = window.tempCargoId;
    
    if (!cargoData || !cargoId) {
        console.error('No se encontraron datos del cargo para actualizar');
        return;
    }
    
    console.log('Datos del cargo a actualizar:', cargoData);
    
    // ========================================
    // 🔗 CONEXIÓN BACKEND - ACTUALIZAR CARGO
    // ========================================
    // Endpoint: PUT /api/cargos/{codigo}
    // Datos: { bSeccion, tId, tNombre }
    
    // Actualizar el cargo en la interfaz
    updateCargoInUI(cargoId, cargoData);
    
    // Cerrar modal de creación
    closeCreateCargoModal();
    
    // Mostrar modal de éxito
    showSuccessUpdateCargoModal();
    
    // Limpiar datos temporales
    window.tempCargoData = null;
    window.tempCargoId = null;
}

/**
 * Muestra el modal de éxito para actualizar cargo
 */
function showSuccessUpdateCargoModal() {
    const modal = document.getElementById('successUpdateCargoModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito de actualizar cargo
 */
function closeSuccessUpdateCargoModal() {
    const modal = document.getElementById('successUpdateCargoModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// FUNCIONES PARA ELIMINAR CARGO
// ========================================

/**
 * Muestra el modal de confirmación para eliminar cargo
 */
function showConfirmDeleteCargoModal() {
    const modal = document.getElementById('confirmDeleteCargoModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela la eliminación del cargo
 */
function cancelDeleteCargo() {
    const modal = document.getElementById('confirmDeleteCargoModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Limpiar datos temporales
    window.tempDeleteCargoId = null;
}

/**
 * Confirma la eliminación del cargo
 */
function confirmDeleteCargo() {
    const cargoId = window.tempDeleteCargoId;
    
    if (cargoId) {
        // ========================================
        // 🔗 CONEXIÓN BACKEND - ELIMINAR CARGO
        // ========================================
        // Endpoint: DELETE /api/cargos/{codigo}
        // Parámetro: codigo
        
        // TODO: Aquí se enviaría la petición al backend
        // Por ahora simulamos la eliminación
        
        // Eliminar el cargo de la estructura de datos y del bucket por ciudad
        const city = getSelectedCityCode();
        if (userCreatedCargos[cargoId]) {
            delete userCreatedCargos[cargoId];
            if (userCargosByCity[city]) {
                delete userCargosByCity[city][cargoId];
                persistUserCargosByCity();
            }
        } else if (modifiedPredeterminedCargos[cargoId]) {
            delete modifiedPredeterminedCargos[cargoId];
            if (modifiedCargosByCity[city]) {
                delete modifiedCargosByCity[city][cargoId];
                persistModifiedCargosByCity();
            }
        }
        
        // Eliminar el cargo de la interfaz
        removeCargoFromUI(cargoId);
        
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmDeleteCargoModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Mostrar modal de éxito
        showSuccessDeleteCargoModal();
        
        // Limpiar datos temporales
        window.tempDeleteCargoId = null;
    }
}

/**
 * Muestra el modal de éxito para eliminar cargo
 */
function showSuccessDeleteCargoModal() {
    const modal = document.getElementById('successDeleteCargoModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito para eliminar cargo
 */
function closeSuccessDeleteCargoModal() {
    const modal = document.getElementById('successDeleteCargoModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Exponer funciones globalmente
window.showCreateCargoModal = showCreateCargoModal;
window.closeCreateCargoModal = closeCreateCargoModal;
window.editCargo = editCargo;
window.deleteCargo = deleteCargo;
window.handleUpdateCargo = handleUpdateCargo;
window.showConfirmUpdateCargoModal = showConfirmUpdateCargoModal;
window.cancelUpdateCargo = cancelUpdateCargo;
window.confirmUpdateCargo = confirmUpdateCargo;
window.showSuccessUpdateCargoModal = showSuccessUpdateCargoModal;
window.closeSuccessUpdateCargoModal = closeSuccessUpdateCargoModal;

// Exponer funciones de eliminación globalmente
window.showConfirmDeleteCargoModal = showConfirmDeleteCargoModal;
window.cancelDeleteCargo = cancelDeleteCargo;
window.confirmDeleteCargo = confirmDeleteCargo;
window.showSuccessDeleteCargoModal = showSuccessDeleteCargoModal;
window.closeSuccessDeleteCargoModal = closeSuccessDeleteCargoModal;

// ========================================
// TOGGLE ACTIVAR/DESACTIVAR CARGO
// ========================================

function toggleCargoState(codigo) {
    // Buscar cargo en memoria (usuario o modificado)
    let cargo = userCreatedCargos[codigo] || modifiedPredeterminedCargos[codigo];
    if (!cargo) {
        // Si no está en memoria local (caso de resultados simulados), crear sombra temporal
        cargo = { codigo, nombre: codigo, seccion: 'Administrativo', activo: true };
        userCreatedCargos[codigo] = cargo;
    }
    const estadoOriginal = cargo.activo !== false;
    cargo.activo = !estadoOriginal;
    // Actualizar UI en cualquier tabla donde aparezca
    const rows = document.querySelectorAll(`tr[data-cargo-id="${codigo}"]`);
    rows.forEach(row => {
        const badge = row.querySelector('span.badge');
        const toggleEl = row.querySelector('.animated-toggle');
        const toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
        const isActive = cargo.activo !== false;
        if (badge) {
            badge.className = `badge ${isActive ? 'badge-success' : 'badge-secondary'}`;
            badge.textContent = isActive ? 'ACTIVO' : 'INACTIVO';
        }
        if (toggleEl && toggleInput) {
            toggleInput.checked = isActive;
            toggleEl.title = isActive ? 'Desactivar' : 'Activar';
        }
    });
    showConfirmToggleCargoModal(codigo, estadoOriginal);
}

function showConfirmToggleCargoModal(codigo, estadoOriginal) {
    window.tempToggleCargoCode = codigo;
    window.tempToggleCargoPrev = estadoOriginal;
    const modal = document.getElementById('confirmToggleCargoModal');
    const cargo = userCreatedCargos[codigo] || modifiedPredeterminedCargos[codigo];
    if (modal && cargo) {
        const actionText = estadoOriginal ? 'desactivar' : 'activar';
        const titleElement = modal.querySelector('.modal-title');
        const messageElement = modal.querySelector('.modal-message');
        if (titleElement) titleElement.textContent = `${actionText.toUpperCase()} CARGO`;
        if (messageElement) messageElement.textContent = `¿Está seguro de que desea ${actionText} el cargo ${cargo.nombre}?`;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function cancelToggleCargo() {
    const codigo = window.tempToggleCargoCode;
    const prev = window.tempToggleCargoPrev;
    if (codigo != null) {
        const cargo = userCreatedCargos[codigo] || modifiedPredeterminedCargos[codigo];
        if (cargo) {
            cargo.activo = prev;
            const rows = document.querySelectorAll(`tr[data-cargo-id="${codigo}"]`);
            rows.forEach(row => {
                const badge = row.querySelector('span.badge');
                const toggleEl = row.querySelector('.animated-toggle');
                const toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
                const isActive = cargo.activo !== false;
                if (badge) {
                    badge.className = `badge ${isActive ? 'badge-success' : 'badge-secondary'}`;
                    badge.textContent = isActive ? 'ACTIVO' : 'INACTIVO';
                }
                if (toggleEl && toggleInput) {
                    toggleInput.checked = isActive;
                    toggleEl.title = isActive ? 'Desactivar' : 'Activar';
                }
            });
        }
    }
    const modal = document.getElementById('confirmToggleCargoModal');
    if (modal) { modal.classList.remove('show'); document.body.style.overflow = 'auto'; }
    window.tempToggleCargoCode = null;
    window.tempToggleCargoPrev = null;
}

function confirmToggleCargo() {
    const codigo = window.tempToggleCargoCode;
    if (codigo != null) {
        const cargo = userCreatedCargos[codigo] || modifiedPredeterminedCargos[codigo];
        if (cargo) {
            // Guardar sin restricción de ciudad
            const toSave = { ...cargo };
            if (userCreatedCargos[codigo]) {
                userCargos[codigo] = toSave;
                persistUserCargos();
            } else if (modifiedPredeterminedCargos[codigo]) {
                modifiedCargos[codigo] = toSave;
                persistModifiedCargos();
            }
            const confirmModal = document.getElementById('confirmToggleCargoModal');
            if (confirmModal) confirmModal.classList.remove('show');
            showSuccessToggleCargoModal(codigo);
        }
    }
    window.tempToggleCargoCode = null;
    window.tempToggleCargoPrev = null;
}

function showSuccessToggleCargoModal(codigo) {
    const modal = document.getElementById('successToggleCargoModal');
    const cargo = userCreatedCargos[codigo] || modifiedPredeterminedCargos[codigo];
    if (modal && cargo) {
        const messageElement = modal.querySelector('.modal-message');
        if (messageElement) {
            const estado = (cargo.activo !== false) ? 'activado' : 'desactivado';
            messageElement.textContent = `El cargo ${cargo.nombre} ha sido ${estado} exitosamente.`;
        }
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessToggleCargoModal() {
    const modal = document.getElementById('successToggleCargoModal');
    if (modal) { modal.classList.remove('show'); document.body.style.overflow = 'auto'; }
}

// Exponer globalmente
window.toggleCargoState = toggleCargoState;
window.cancelToggleCargo = cancelToggleCargo;
window.confirmToggleCargo = confirmToggleCargo;
window.closeSuccessToggleCargoModal = closeSuccessToggleCargoModal;

// ========================================
// FUNCIONALIDAD DE CERRAR SESIÓN
// ========================================


// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', initializePage);

// También inicializar si la página ya está cargada
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

