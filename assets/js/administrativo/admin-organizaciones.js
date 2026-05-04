/**
 *  DASHBOARD ADMINISTRATIVO - GOLDEN APP
 * 
 * Este archivo contiene toda la funcionalidad del panel administrativo de organizaciones.
 * Incluye gestión de modales, navegación, formularios y operaciones CRUD.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Gestión completa de organizaciones (crear, leer, actualizar, eliminar)
 * - Modal de selección de ciudad obligatorio al cargar la interfaz
 * - Sincronización con datos de ciudades desde otras interfaces
 * - Sistema de notificaciones estilizado
 * - Formularios con validación y confirmación
 * - Navegación responsive y efectos visuales
 * 
 * CONEXIONES BACKEND REQUERIDAS:
 * - POST /api/organizaciones (crear organización)
 * - PUT /api/organizaciones/{codigo} (actualizar organización)
 * - GET /api/organizaciones/{codigo} (buscar organización por código)
 * - DELETE /api/organizaciones/{codigo} (eliminar organización)
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2024
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

/**
 * Almacén de datos de organizaciones en memoria (solo bucket activo en la UI)
 * Estructura: { codigo: { codigo, nombre, activo, ciudad } }
 */
const organizacionesData = {};

/**
 * Almacén persistente por ciudad
 * Estructura: { [codigoCiudad]: { [codigoOrg]: { codigo, nombre, activo, ciudad } } }
 */
const organizacionesByCity = (function(){
    try {
        const raw = localStorage.getItem('organizacionesByCity');
        return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
})();

function persistOrgsByCity() {
    try { localStorage.setItem('organizacionesByCity', JSON.stringify(organizacionesByCity)); } catch (e) {}
}

function getSelectedCityCode() {
    try { return sessionStorage.getItem('selectedCity') || ''; } catch (e) { return ''; }
}

function loadOrgsForSelectedCity() {
    // [BACKEND] Punto de integración (Listar organizaciones por ciudad):
    // Reemplazar limpieza/carga desde memoria/localStorage por consulta al backend
    // y luego renderizar la tabla con la respuesta.
    // Volcar bucket de la ciudad actual a organizacionesData (memoria de la vista)
    const city = getSelectedCityCode();
    const bucket = (organizacionesByCity && organizacionesByCity[city]) ? organizacionesByCity[city] : {};
    // Limpiar estructura en memoria y tabla
    try {
        Object.keys(organizacionesData).forEach(k => delete organizacionesData[k]);
    } catch (e) {}
    // Rellenar en memoria
    Object.keys(bucket).forEach(code => { organizacionesData[code] = bucket[code]; });
    // Reconstruir tabla usando la función de reconstrucción
    rebuildOrganizationsTable();
}

document.addEventListener('DOMContentLoaded', function() {
    // Limpiar notificaciones existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
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
    // GESTIÓN DE MODALES
    // ========================================
    
    // [BACKEND] Punto de integración general (Organizaciones):
    // Reemplazar lecturas/escrituras en localStorage por llamadas al backend
    // en carga de organizaciones por ciudad, creación/actualización/eliminación.
    // Ver marcadores [BACKEND] en funciones específicas.
    // Referencias a los elementos de modales
    const selectOrgModal = document.getElementById('selectOrgModal');
    const selectOrgModalOverlay = document.getElementById('selectOrgModal');
    const modal = document.getElementById('orgModal');
    const orgSearchModalOverlay = document.querySelector('#orgModal.modal-overlay');
    const createOrgModal = document.getElementById('createOrgModal');
    const createOrgModalOverlay = document.querySelector('#createOrgModal.modal-overlay');
    const orgResultsModalOverlay = document.querySelector('#orgResultsModal.modal-overlay');
    
    /**
     * Muestra el modal de selección de ciudad
     * Solo se muestra si el usuario no ha seleccionado una ciudad en esta sesión
     */
    function showSelectOrgModal() {
        // Verificar si el usuario ya seleccionó una ciudad en esta sesión
        const selectedCity = sessionStorage.getItem('selectedCity');
        if (!selectedCity) {
            selectOrgModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Fuerza la visualización del modal de selección de ciudad
     * Se usa para permitir cambiar la ciudad seleccionada
     */
    function forceShowSelectOrgModal() {
        // Poblar el select antes de mostrar el modal
        if (typeof loadCitiesForSelection === 'function') {
            loadCitiesForSelection();
        }
        
        selectOrgModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Oculta el modal de selección de ciudad
     * Restaura el scroll del body
     */
    function hideSelectOrgModal() {
        selectOrgModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    /**
     * Muestra el modal de búsqueda de organización
     */
    function showOrgSearchModal() {
        orgSearchModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Limpiar campo de búsqueda
        document.getElementById('searchOrgCodigo').value = '';
    }
    
    /**
     * Oculta el modal de búsqueda de organización
     */
    function hideModal() {
        orgSearchModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    /**
     * Muestra el modal para crear una nueva organización
     */
    function showCreateOrgModal() {
        // Cerrar cualquier overlay abierto para evitar capas bloqueando clics
        try {
            const overlays = Array.from(document.querySelectorAll('.modal-overlay'));
            overlays.forEach(function(ov){
                if (ov.id !== 'createOrgModal') {
                    ov.classList.remove('show');
                    ov.style.display = 'none';
                }
            });
        } catch (e) {}

        // Mostrar el modal de creación/edición de organización de forma consistente
        try { createOrgModalOverlay.classList.add('show'); } catch (e) {}
        createOrgModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Asegurar foco en el primer campo editable
        setTimeout(function(){
            try { document.getElementById('tNombre').focus(); } catch(e) {}
        }, 50);
    }
    
    /**
     * Oculta el modal de crear organización y limpia el formulario
     */
    function hideCreateOrgModal() {
        if (createOrgModalOverlay) {
            createOrgModalOverlay.style.display = 'none';
            createOrgModalOverlay.classList.remove('show');
        }
        // Limpiar campos del formulario
        clearCreateOrgForm();
    }
    
    /**
     * Limpia todos los campos del formulario de crear organización y restaura el modo "crear"
     */
    function clearCreateOrgForm() {
        document.getElementById('tId').value = '';
        document.getElementById('tNombre').value = '';
        
        // Limpiar atributo de código original
        document.getElementById('tId').removeAttribute('data-original-code');
        
        // Solo habilitar el campo código si no estamos en modo edición
        const isEditing = document.getElementById('tId').hasAttribute('data-original-code');
        if (!isEditing) {
            document.getElementById('tId').disabled = false;
        }
        
        // Restaurar modo "crear" (título y botones)
        document.getElementById('createOrgTitle').textContent = 'CREAR ORGANIZACIÓN';
        const bCrearBtn = document.getElementById('bCrear');
        const bActualizarBtn = document.getElementById('bActualizar');
        if (bCrearBtn) bCrearBtn.style.display = '';
        if (bActualizarBtn) bActualizarBtn.style.display = 'none';
    }
    
    // ========================================
    // FUNCIONES GLOBALES
    // ========================================
    
    // Hacer funciones disponibles globalmente para uso en HTML
    window.hideModal = hideModal;
    window.hideCreateOrgModal = hideCreateOrgModal;
    window.hideSelectOrgModal = hideSelectOrgModal;
    window.showSelectOrgModal = showSelectOrgModal;
    window.forceShowSelectOrgModal = forceShowSelectOrgModal;
    window.showOrgSearchModal = showOrgSearchModal;
    window.showCreateOrgModal = showCreateOrgModal;
    
    // ========================================
    // FUNCIONES DE CONFIRMACIÓN PARA ORGANIZACIONES
    // ========================================
    
    /**
     * Muestra el modal de confirmación para crear organización
     */
    function showConfirmCreateOrgModal() {
        const modal = document.getElementById('confirmCreateOrgModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            modal.style.zIndex = '7000';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cancela la creación de la organización
     */
    function cancelCreateOrg() {
        const modal = document.getElementById('confirmCreateOrgModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Limpiar datos temporales
        window.tempOrgData = null;
    }
    
    /**
     * Confirma la creación de la organización
     * CONEXIÓN BACKEND: POST /api/organizaciones
     */
    function confirmCreateOrg() {
        // Cerrar modal de confirmación primero
        const confirmModal = document.getElementById('confirmCreateOrgModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
            confirmModal.style.display = 'none';
        }
        
        // Obtener datos temporales
        const orgData = window.tempOrgData;
        
        if (!orgData) {
            console.error('No se encontraron datos de la organización para crear');
            return;
        }
        
        console.log('Datos de la organización a crear:', orgData);
        
        // ========================================
        // 🔗 CONEXIÓN BACKEND - CREAR ORGANIZACIÓN
        // ========================================
        // Endpoint: POST /api/organizaciones
        // Datos: { codigo, nombre, activo: true }
        // Headers: { Authorization: "Bearer {token}" }
        // 
    
        
        // Guardar por ciudad y persistir
        const city = getSelectedCityCode();
        if (!city) { 
            try { showNotification('Seleccione una ciudad primero', 'warning'); } catch(e) {} 
            return; 
        }
        if (!organizacionesByCity[city]) organizacionesByCity[city] = {};
        const toSave = { ...orgData, ciudad: city };
        organizacionesByCity[city][orgData.codigo] = toSave;
        persistOrgsByCity();
        // También reflejar en memoria y UI actual
        organizacionesData[orgData.codigo] = toSave;
        
        // Cerrar modal de creación y limpiar formulario ANTES de mostrar el de éxito
        if (createOrgModalOverlay) {
            createOrgModalOverlay.style.display = 'none';
            createOrgModalOverlay.classList.remove('show');
        }
        clearCreateOrgForm();
        
        // Reconstruir la tabla completa para mostrar todas las organizaciones
        console.log('Reconstruyendo tabla de organizaciones');
        try {
            rebuildOrganizationsTable();
            console.log('Tabla reconstruida exitosamente');
        } catch (error) {
            console.error('Error al reconstruir tabla:', error);
        }
        
        // Limpiar datos temporales antes de mostrar el modal de éxito
        window.tempOrgData = null;
        
        // Mostrar modal de éxito DESPUÉS de cerrar el de creación
        setTimeout(function() {
            try {
                showSuccessCreateOrgModal();
                console.log('Modal de éxito llamado');
            } catch (error) {
                console.error('Error al mostrar modal de éxito:', error);
                // Intentar usar la función global si existe
                if (typeof window.showSuccessCreateOrgModal === 'function') {
                    window.showSuccessCreateOrgModal();
                }
            }
        }, 100);
    }
    
    /**
     * Muestra el modal de éxito para crear organización
     */
    function showSuccessCreateOrgModal() {
        console.log('showSuccessCreateOrgModal llamada');
        const modal = document.getElementById('successCreateOrgModal');
        console.log('Modal encontrado:', modal);
        if (modal) {
            // Asegurarse de que el modal de creación esté cerrado
            if (createOrgModalOverlay) {
                createOrgModalOverlay.style.display = 'none';
                createOrgModalOverlay.classList.remove('show');
            }
            // Asegurarse de que el modal de confirmación esté cerrado
            const confirmModal = document.getElementById('confirmCreateOrgModal');
            if (confirmModal) {
                confirmModal.style.display = 'none';
                confirmModal.classList.remove('show');
            }
            // Mostrar el modal de éxito
            modal.classList.add('show');
            modal.style.display = 'flex';
            modal.style.zIndex = '8000';
            document.body.style.overflow = 'hidden';
            console.log('Modal de éxito mostrado');
        } else {
            console.error('No se encontró el modal successCreateOrgModal');
        }
    }
    
    /**
     * Cierra el modal de éxito de organización
     */
    function closeSuccessOrgModal() {
        const modal = document.getElementById('successCreateOrgModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // Exponer funciones globalmente
    window.showConfirmCreateOrgModal = showConfirmCreateOrgModal;
    window.showSuccessCreateOrgModal = showSuccessCreateOrgModal;
    window.cancelCreateOrg = cancelCreateOrg;
    window.confirmCreateOrg = confirmCreateOrg;
    window.closeSuccessOrgModal = closeSuccessOrgModal;
    
    // Funciones para modales de resultados
    function showOrgResultsModal() {
        if (orgResultsModalOverlay) {
            orgResultsModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hideOrgResultsModal() {
        if (orgResultsModalOverlay) {
            orgResultsModalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    window.hideOrgResultsModal = hideOrgResultsModal;
    
    // ========================================
    // EVENTOS DE MODALES
    // ========================================

    // Handler explícito del botón bBuscar (requerido)
    const bBuscar = document.getElementById('bBuscar');
    if (bBuscar) {
        bBuscar.addEventListener('click', function(e) {
            e.preventDefault();
            const code = (document.getElementById('searchOrgCodigo') || {}).value || '';
            const trimmed = String(code).trim();
            if (!trimmed) {
                alert('Ingrese el código de organización');
                return;
            }
            const result = resultOrgByCode(trimmed);
            renderOrgSearchResults(result);
            hideModal();
            showOrgResultsModal();
        });
    }
    
    // Los modales solo se cierran con la X o botones del formulario (no al clic fuera del overlay).
    
    // Cerrar modales con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (selectOrgModalOverlay.style.display === 'flex') {
                hideSelectOrgModal();
            }
            if (orgSearchModalOverlay.style.display === 'flex') {
                hideModal();
            }
            if (createOrgModalOverlay.style.display === 'flex') {
                hideCreateOrgModal();
            }
            if (orgResultsModalOverlay && orgResultsModalOverlay.style.display === 'flex') {
                hideOrgResultsModal();
            }
        }
    });
    
    // Navegación lateral y superior: enlaces con data-app-route (admin-layout.js + AppRoutes).
    
    // ========================================
    // PERFIL DE USUARIO Y DROPDOWN
    // ========================================
    
    // Elementos del perfil de usuario
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
                    // Mostrar modal de confirmación para cerrar sesión
                    showConfirmLogoutModal();
                } else if (this.textContent.includes('ADMINISTRAR USUARIOS')) {
                    // Navegar a administración de usuarios
                    alert('Funcionalidad de administrar usuarios en desarrollo');
                }
                
                // Cerrar dropdown después del clic
                dropdown.classList.remove('show');
                dropdownArrow.classList.remove('open');
                sidebar.classList.remove('dropdown-open');
            });
        });
    }
    
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
        window.location.href = window.AppRoutes.resolve('LOGIN');
    }

    // MANEJADORES DE BOTONES
    // ========================================
    
    // Manejadores de clics para botones
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const buttonText = this.textContent.trim();
            
            switch(buttonText) {
                case 'Buscar Organización':
                    console.log('Botón Buscar Organización clickeado');
                    showOrgSearchModal();
                    break;
                case 'Crear Organización':
                    console.log('Botón Crear Organización clickeado');
                    showCreateOrgModal();
                    break;
                case 'Buscar':
                    console.log('Botón Buscar clickeado');
                    const code = document.getElementById('searchOrgCodigo').value.trim();
                    if (!code) {
                        alert('Ingrese el código de organización');
                        break;
                    }
                    renderOrgSearchResults(resultOrgByCode(code));
                    hideModal();
                    showOrgResultsModal();
                    break;
                case 'Editar':
                    console.log('Botón Editar clickeado');
                    // Agregar funcionalidad de editar
                    break;
                case 'Eliminar':
                    console.log('Botón Eliminar clickeado');
                    // Agregar funcionalidad de eliminar
                    break;
                default:
                    console.log('Botón clickeado:', buttonText);
            }
        });
    });

    // Fallback explícito: si existe el botón principal de cabecera, engancharlo
    try {
        const bCrearOrgHeader = document.getElementById('bCrearOrg');
        if (bCrearOrgHeader) {
            bCrearOrgHeader.addEventListener('click', function(e) {
                e.preventDefault();
                try { showCreateOrgModal(); } catch (err) {}
            });
        }
    } catch (e) {}
    
    // ========================================
    // EFECTOS DE TABLA
    // ========================================
    
    // Efectos hover en filas de tabla
    const tableRows = document.querySelectorAll('.table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });
    
    // ========================================
    // FUNCIONALIDAD DE FORMULARIOS
    // ========================================
    
    // Funcionalidad del select de ciudades en Organizaciones
    const orgSelect = document.getElementById('cId_Ciudad');
    
    /**
     * Pobla el select de ciudades con datos actualizados
     * Se sincroniza con los datos de ciudades desde otras interfaces
     */
    function populateOrgCitySelect() {
        if (!orgSelect) return;
        // Preferir origen vivo, con fallback a localStorage siempre que exista
        let ciudades = {};
        if (typeof window.getCiudadesData === 'function') {
            try { ciudades = window.getCiudadesData(); } catch (e) { ciudades = {}; }
        } else {
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
        const current = orgSelect.value;
        orgSelect.innerHTML = '<option value="">Seleccione la ciudad</option>';
        Object.values(ciudades)
            .filter(c => c.activo !== false) // Solo ciudades activas
            .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
            .forEach(c => {
                const opt = document.createElement('option');
                const code = String(c.codigo || '').toUpperCase();
                const name = String(c.nombre || '').toUpperCase();
                opt.value = c.codigo;
                opt.textContent = `${code} - ${name}`;
                orgSelect.appendChild(opt);
            });
        if (current && ciudades[current] && ciudades[current].activo !== false) orgSelect.value = current;
    }
    
    if (orgSelect) {
        populateOrgCitySelect();
        // Suscribirse a cambios en ciudades desde otras interfaces
        try { window.addEventListener('ciudades:updated', populateOrgCitySelect); } catch (e) {}
    }
    
    // Funcionalidad del botón seleccionar ciudad
    const bSeleccionarOrg = document.getElementById('bSeleccionarOrg');
    if (bSeleccionarOrg) {
        bSeleccionarOrg.addEventListener('click', function() {
            const selectedCity = document.getElementById('cId_Ciudad').value;
            if (selectedCity) {
                console.log('Ciudad seleccionada:', selectedCity);
                try { sessionStorage.setItem('selectedCity', selectedCity); } catch (e) {}
                try { showNotification('Ciudad seleccionada: ' + selectedCity, 'success'); } catch (e) {}
                hideSelectOrgModal();
                // Cargar organizaciones de la ciudad seleccionada
                loadOrgsForSelectedCity();
            } else {
                try { showNotification('Por favor, seleccione una ciudad', 'warning'); } catch (e) { alert('Por favor, seleccione una ciudad'); }
            }
        });
    }
    
    // ========================================
    // FUNCIONALIDAD DEL BOTÓN CREAR ORGANIZACIÓN
    // ========================================
    
    /**
     * Configura la validación de campos de código (solo letras, máximo 10 caracteres)
     * @param {string} inputId - ID del campo input a validar
     */
    function setupCodigoValidation(inputId) {
        const codigoInput = document.getElementById(inputId);
        if (codigoInput) {
            codigoInput.addEventListener('input', function(e) {
                // Remover cualquier carácter que no sea letra
                let value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
                
                // Limitar a 10 caracteres
                if (value.length > 10) {
                    value = value.substring(0, 10);
                }
                
                // Convertir a mayúsculas
                this.value = value.toUpperCase();
            });
            
            // Prevenir pegar texto no válido
            codigoInput.addEventListener('paste', function(e) {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const lettersOnly = paste.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '').substring(0, 10).toUpperCase();
                this.value = lettersOnly;
            });
        }
    }
    
    // Configurar validación del campo código en formulario de crear/actualizar
    setupCodigoValidation('tId');
    
    // Configurar validación del campo código en formulario de búsqueda
    setupCodigoValidation('searchOrgCodigo');
    
    // Funcionalidad del botón crear organización
    const bCrear = document.getElementById('bCrear');
    if (bCrear) {
        bCrear.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Botón crear clickeado');
            
            // Obtener valores del formulario
            const codigo = document.getElementById('tId').value.trim();
            const nombre = document.getElementById('tNombre').value.trim();
            
            console.log('Código:', codigo, 'Nombre:', nombre);
            
            // Validar campos obligatorios
            if (!codigo || !nombre) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            
            // Validar que el código solo contenga letras y tenga máximo 10 caracteres
            // El código ya está en mayúsculas por la validación del input
            const codigoUpper = codigo.toUpperCase();
            if (!/^[A-ZÁÉÍÓÚÑ]{1,10}$/.test(codigoUpper)) {
                alert('El código debe contener solo letras y tener máximo 10 caracteres.');
                return;
            }
            
            // Crear objeto de organización
            const nuevaOrganizacion = {
                codigo: codigoUpper,
                nombre: nombre,
                // Estado por defecto: activa
                activo: true
            };
            
            console.log('Organización a crear:', nuevaOrganizacion);
            
            // Es una creación - mostrar modal de confirmación
            window.tempOrgData = nuevaOrganizacion;
            
            try {
                // Intentar llamar la función local primero, si no existe usar la global
                if (typeof showConfirmCreateOrgModal === 'function') {
                    showConfirmCreateOrgModal();
                } else if (typeof window.showConfirmCreateOrgModal === 'function') {
                    window.showConfirmCreateOrgModal();
                } else {
                    throw new Error('Función showConfirmCreateOrgModal no encontrada');
                }
                console.log('Modal de confirmación mostrado');
            } catch (error) {
                console.error('Error al mostrar modal de confirmación:', error);
                alert('Error al mostrar el modal de confirmación. Por favor, intente nuevamente.');
            }
        });
    } else {
        console.error('No se encontró el botón bCrear');
    }

    // Funcionalidad del botón actualizar organización
    const bActualizar = document.getElementById('bActualizar');
    if (bActualizar) {
        bActualizar.addEventListener('click', function() {
            const codigo = document.getElementById('tId').value.trim();
            const nombre = document.getElementById('tNombre').value.trim();
            if (!codigo || !nombre) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            
            // Validar que el código solo contenga letras y tenga máximo 10 caracteres
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]{1,10}$/.test(codigo)) {
                alert('El código debe contener solo letras y tener máximo 10 caracteres.');
                return;
            }
            
            const nuevaOrganizacion = {
                codigo: codigo.toUpperCase(),
                nombre: nombre,
                activo: true
            };
            window.tempOrgData = nuevaOrganizacion;
            showConfirmUpdateOrgModal();
        });
    }
    
    /**
     * Procesa la actualización de una organización
     * Maneja cambios de código y actualización de datos
     */
    function processOrgUpdate(nuevaOrganizacion) {
        const codigo = nuevaOrganizacion.codigo;
        
        // Verificar si el código cambió
        const originalCode = document.getElementById('tId').getAttribute('data-original-code');
        if (originalCode && originalCode !== codigo) {
            // El código cambió - eliminar la organización anterior
            delete organizacionesData[originalCode];
            
            // Eliminar la fila anterior de la tabla
            const tableBody = document.getElementById('organizacionesTableBody');
            const rows = tableBody.querySelectorAll('tr');
            for (let row of rows) {
                const firstCell = row.querySelector('td');
                if (firstCell && firstCell.textContent === originalCode) {
                    row.remove();
                    break;
                }
            }
        }
        
        // Guardar en bucket de la ciudad actual y persistir
        const cityUp = getSelectedCityCode();
        if (!organizacionesByCity[cityUp]) organizacionesByCity[cityUp] = {};
        const upSave = { ...nuevaOrganizacion, ciudad: cityUp };
        organizacionesByCity[cityUp][codigo] = upSave;
        persistOrgsByCity();
        // Memoria de la vista
        organizacionesData[codigo] = upSave;
        
        // Cerrar modal y actualizar tabla
        hideCreateOrgModal();
        addOrgToTable(nuevaOrganizacion, true);
    }
    
    // ========================================
    // BÚSQUEDA EN MODALES (ORGANIZACIONES)
    // ========================================
    
    /**
     * Busca una organización por código
     * CONEXIÓN BACKEND: GET /api/organizaciones/{codigo}
     */
    function resultOrgByCode(code) {
        // ========================================
        // 🔗 CONEXIÓN BACKEND - BUSCAR ORGANIZACIÓN POR CÓDIGO
        // ========================================
        // Endpoint: GET /api/organizaciones/{codigo}
        // Parámetro: codigo
        // Headers: { Authorization: "Bearer {token}" }
        // 
    
        
        return organizacionesData[code] || null;
    }
    
    /**
     * Renderiza los resultados de búsqueda de organizaciones
     */
    function renderOrgSearchResults(organizacion) {
        const body = document.getElementById('orgSearchResultsBody');
        if (!body) return;
        body.innerHTML = '';
        if (!organizacion) {
            body.innerHTML = `
                <tr>
                    <td colspan="4" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-search"></i>
                            <p>No se encontraron resultados</p>
                            <small>Intente con otro código</small>
                        </div>
                    </td>
                </tr>`;
            return;
        }
        
        const isActive = organizacion.activo !== false;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${organizacion.codigo}</td>
            <td>${organizacion.nombre}</td>
            <td>
                <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVA' : 'INACTIVA'}</span>
            </td>
            <td>
                <button class="btn btn-small" onclick="editOrg('${organizacion.codigo}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <label class="animated-toggle" data-codigo="${organizacion.codigo}" title="${isActive ? 'Desactivar' : 'Activar'}">
                    <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleOrgState('${organizacion.codigo}')">
                    <span class="toggle-slider"></span>
                </label>
            </td>`;
        
        body.appendChild(row);
    }
    
    // ========================================
    // FUNCIONES DE EDICIÓN
    // ========================================
    
    /**
     * Función para editar una organización
     * Abre el modal de crear organización en modo actualizar
     */
    function editOrg(codigo) {
        const organizacion = organizacionesData[codigo];
        if (!organizacion) return;
        
        // Llenar los campos con los datos de la organización
        document.getElementById('tId').value = organizacion.codigo;
        document.getElementById('tNombre').value = organizacion.nombre;
        
        // Cambiar el título y botones visibles
        document.getElementById('createOrgTitle').textContent = 'ACTUALIZAR ORGANIZACIÓN';
        const bCrearBtn2 = document.getElementById('bCrear');
        const bActualizarBtn2 = document.getElementById('bActualizar');
        if (bCrearBtn2) bCrearBtn2.style.display = 'none';
        if (bActualizarBtn2) bActualizarBtn2.style.display = '';
        
        // Guardar el código original para poder eliminarlo después si cambia
        document.getElementById('tId').setAttribute('data-original-code', codigo);
        
        // Cerrar cualquier modal abierto y abrir modal de crear/actualizar
        try { hideModal(); } catch(e) {}
        try { hideOrgResultsModal(); } catch(e) {}
        showCreateOrgModal();
        
        // Deshabilitar el campo código para evitar cambios (con delay para asegurar que se aplique)
        setTimeout(() => {
            document.getElementById('tId').disabled = true;
            // Asegurar que el nombre esté editable al entrar en modo edición
            try { document.getElementById('tNombre').disabled = false; } catch(e) {}
        }, 100);
    }
    
    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    // Inicializar funcionalidades adicionales
    console.log('Dashboard de organizaciones inicializado exitosamente');
    
    // Mostrar modal de selección de ciudad al cargar la página (simulando login)
    // Esto mostrará el modal automáticamente cuando se cargue la página
    // Mostrar SIEMPRE el selector de ciudad al cargar esta interfaz
    setTimeout(() => { try { forceShowSelectOrgModal(); } catch (e) { try { showSelectOrgModal(); } catch (e2) {} } }, 500);

    // Reconstruir tabla desde localStorage si hay datos
    try {
        loadOrgsForSelectedCity();
        
    } catch (e) {}

    // ========================================
    // MODALES DE TOGGLE (crear si no existen)
    // ========================================
    (function ensureOrgToggleModals(){
        try {
            let confirm = document.getElementById('confirmToggleOrgModal');
            if (!confirm) {
                confirm = document.createElement('div');
                confirm.id = 'confirmToggleOrgModal';
                confirm.className = 'modal-overlay';
                confirm.innerHTML = `
                    <div class="modal">
                        <div class="modal-header">
                            <h3 class="modal-title"></h3>
                            <button class="modal-close" onclick="cancelToggleOrg()"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body">
                            <p class="modal-message"></p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="cancelToggleOrg()">Cancelar</button>
                            <button class="btn btn-primary" onclick="confirmToggleOrg()">Confirmar</button>
                        </div>
                    </div>`;
                document.body.appendChild(confirm);
            }
            let success = document.getElementById('successToggleOrgModal');
            if (!success) {
                success = document.createElement('div');
                success.id = 'successToggleOrgModal';
                success.className = 'modal-overlay';
                success.innerHTML = `
                    <div class="modal">
                        <div class="modal-header">
                            <h3 class="modal-title">ESTADO ACTUALIZADO</h3>
                            <button class="modal-close" onclick="closeSuccessToggleOrgModal()"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body">
                            <p class="modal-message"></p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" onclick="closeSuccessToggleOrgModal()">Aceptar</button>
                        </div>
                    </div>`;
                document.body.appendChild(success);
            }
        } catch (e) {}
    })();

    // ========================================
    // UTILIDADES: NOTIFICACIONES
    // ========================================
    if (typeof window.showNotification !== 'function') {
        window.showNotification = function(message, type = 'info') {
            try {
                const notification = document.createElement('div');
                notification.className = `notification notification-${type}`;
                notification.textContent = message;
                document.body.appendChild(notification);
                setTimeout(() => notification.classList.add('show'), 100);
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => { try { document.body.removeChild(notification); } catch(e) {} }, 300);
                }, 3000);
            } catch (e) { console.log(message); }
        };
    }
    
    // ========================================
    // FUNCIONES GLOBALES DE ORGANIZACIONES
    // ========================================
    window.editOrg = function(codigo) {
        const organizacion = organizacionesData[codigo];
        if (!organizacion) {
            try { showNotification('No se encontró la organización ' + codigo, 'error'); } catch(e) { alert('No se encontró la organización ' + codigo); }
            return;
        }
        
        // Llenar los campos con los datos de la organización
        document.getElementById('tId').value = organizacion.codigo;
        document.getElementById('tNombre').value = organizacion.nombre;
        
        // Cambiar el título y botones visibles
        document.getElementById('createOrgTitle').textContent = 'ACTUALIZAR ORGANIZACIÓN';
        const bCrearBtn = document.getElementById('bCrear');
        const bActualizarBtn = document.getElementById('bActualizar');
        if (bCrearBtn) bCrearBtn.style.display = 'none';
        if (bActualizarBtn) bActualizarBtn.style.display = '';
        
        // Guardar el código original para poder eliminarlo después si cambia
        document.getElementById('tId').setAttribute('data-original-code', codigo);
        
        // Cerrar cualquier modal abierto y abrir modal de crear/actualizar
        try { hideModal(); } catch(e) {}
        try { hideOrgResultsModal(); } catch(e) {}
        showCreateOrgModal();
        
        // Deshabilitar el campo código para evitar cambios (con delay para asegurar que se aplique)
        setTimeout(() => {
            document.getElementById('tId').disabled = true;
        }, 100);
    };

    // Exponer utilidades de organizaciones para otras interfaces
    try {
        window.getOrganizacionesData = function() { return organizacionesData; };
    } catch (e) {}
    
    // ========================================
    // FUNCIONES DE CONFIRMACIÓN PARA ACTUALIZAR ORGANIZACIONES
    // ========================================
    
    /**
     * Muestra el modal de confirmación para actualizar organización
     */
    function showConfirmUpdateOrgModal() {
        const modal = document.getElementById('confirmUpdateOrgModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            modal.style.zIndex = '7000';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cancela la actualización de la organización
     */
    function cancelUpdateOrg() {
        const confirmModal = document.getElementById('confirmUpdateOrgModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
            confirmModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Limpiar datos temporales
        window.tempOrgData = null;
    }
    
    /**
     * Confirma la actualización de la organización
     * CONEXIÓN BACKEND: PUT /api/organizaciones/{codigo}
     */
    function confirmUpdateOrg() {
        // Cerrar modal de confirmación primero
        const confirmModal = document.getElementById('confirmUpdateOrgModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
            confirmModal.style.display = 'none';
        }
        
        // Obtener datos temporales
        const organizacionData = window.tempOrgData;
        
        if (!organizacionData) {
            console.error('No se encontraron datos de la organización para actualizar');
            return;
        }
        
        console.log('Datos de la organización a actualizar:', organizacionData);
        
        // ========================================
        // 🔗 CONEXIÓN BACKEND - ACTUALIZAR ORGANIZACIÓN
        // ========================================
        // Endpoint: PUT /api/organizaciones/{codigo}
        // Datos: { codigo, nombre, activo }
        // Headers: { Authorization: "Bearer {token}" }
        // 
   
        
        // Procesar la actualización
        processOrgUpdate(organizacionData);
        
        // Cerrar modal de creación ANTES de mostrar el de éxito
        if (createOrgModalOverlay) {
            createOrgModalOverlay.style.display = 'none';
            createOrgModalOverlay.classList.remove('show');
        }
        clearCreateOrgForm();
        
        // Reconstruir la tabla completa
        try {
            rebuildOrganizationsTable();
        } catch (error) {
            console.error('Error al reconstruir tabla:', error);
        }
        
        // Limpiar datos temporales antes de mostrar el modal de éxito
        window.tempOrgData = null;
        
        // Mostrar modal de éxito DESPUÉS de cerrar el de creación
        setTimeout(function() {
            try {
                showSuccessUpdateOrgModal();
            } catch (error) {
                console.error('Error al mostrar modal de éxito:', error);
            }
        }, 100);
    }
    
    /**
     * Muestra el modal de éxito para actualizar organización
     */
    function showSuccessUpdateOrgModal() {
        const modal = document.getElementById('successUpdateOrgModal');
        if (modal) {
            // Asegurarse de que el modal de creación esté cerrado
            if (createOrgModalOverlay) {
                createOrgModalOverlay.style.display = 'none';
                createOrgModalOverlay.classList.remove('show');
            }
            // Asegurarse de que el modal de confirmación esté cerrado
            const confirmModal = document.getElementById('confirmUpdateOrgModal');
            if (confirmModal) {
                confirmModal.style.display = 'none';
                confirmModal.classList.remove('show');
            }
            // Mostrar el modal de éxito
            modal.classList.add('show');
            modal.style.display = 'flex';
            modal.style.zIndex = '8000';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cierra el modal de éxito de actualizar organización
     */
    function closeSuccessUpdateOrgModal() {
        const modal = document.getElementById('successUpdateOrgModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // Exponer funciones globalmente
    window.showConfirmUpdateOrgModal = showConfirmUpdateOrgModal;
    window.cancelUpdateOrg = cancelUpdateOrg;
    window.confirmUpdateOrg = confirmUpdateOrg;
    window.showSuccessUpdateOrgModal = showSuccessUpdateOrgModal;
    window.closeSuccessUpdateOrgModal = closeSuccessUpdateOrgModal;
}); 

// ========================================
// FUNCIONES GLOBALES DE GESTIÓN DE ORGANIZACIONES
// ========================================

/**
 * Agrega una nueva organización a la tabla o actualiza una existente
 * @param {Object} organizacion - Objeto con los datos de la organización
 * @param {boolean} replaceIfExists - Si es true, actualiza la fila existente
 */
function addOrgToTable(organizacion, replaceIfExists = false) {
    console.log('addOrgToTable ejecutándose con:', organizacion);
    const tableBody = document.getElementById('organizacionesTableBody');
    console.log('tableBody encontrado:', tableBody);
    
    if (!tableBody) {
        console.error('No se encontró el elemento organizacionesTableBody');
        return;
    }
    
    // Si existe, y se solicita reemplazar, actualizar la fila
    const allRows = Array.from(tableBody.querySelectorAll('tr'));
    const existingRow = allRows.find(r => {
        const firstCell = r.querySelector('td');
        if (!firstCell) return false;
        // Verificar que no sea una fila de "no-data-message"
        if (firstCell.hasAttribute('colspan') || r.querySelector('.no-data-message')) return false;
        return firstCell.textContent.trim() === organizacion.codigo.trim();
    });
    
    const isActive = organizacion.activo !== false;
    const rowHtml = `
        <td>${organizacion.codigo}</td>
        <td>${organizacion.nombre}</td>
        <td>
            <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVA' : 'INACTIVA'}</span>
        </td>
        <td>
            <button class="btn btn-small" onclick="editOrg('${organizacion.codigo}')" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <label class="animated-toggle" data-codigo="${organizacion.codigo}" title="${isActive ? 'Desactivar' : 'Activar'}">
                <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleOrgState('${organizacion.codigo}')">
                <span class="toggle-slider"></span>
            </label>
        </td>
    `;
    
    if (existingRow && replaceIfExists) {
        // Actualizar fila existente
        console.log('Actualizando fila existente');
        existingRow.innerHTML = rowHtml;
    } else if (!existingRow) {
        // Crear nueva fila solo si no existe
        console.log('Creando nueva fila');
        const newRow = document.createElement('tr');
        newRow.innerHTML = rowHtml;
        
        // Agregar efectos hover a la nueva fila
        newRow.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        newRow.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        // Remover mensaje de "no data" si existe
        const noDataRow = tableBody.querySelector('.no-data-message');
        if (noDataRow) {
            noDataRow.remove();
        }
        
        // Insertar la nueva fila en la posición correcta (ordenada por código)
        const rows = Array.from(tableBody.querySelectorAll('tr'));
        let insertIndex = -1;
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const firstCell = row.querySelector('td');
            if (firstCell && !firstCell.hasAttribute('colspan')) {
                const rowCode = firstCell.textContent.trim();
                if (rowCode.localeCompare(organizacion.codigo.trim()) > 0) {
                    insertIndex = i;
                    break;
                }
            }
        }
        
        if (insertIndex >= 0) {
            tableBody.insertBefore(newRow, tableBody.children[insertIndex]);
        } else {
            tableBody.appendChild(newRow);
        }
        
        console.log('Nueva fila agregada a la tabla');
    }
    // Si existe pero no se debe reemplazar, no hacer nada
}

/**
 * Reconstruye la tabla completa de organizaciones desde organizacionesData
 * Asegura que todas las organizaciones se muestren correctamente
 */
function rebuildOrganizationsTable() {
    const tableBody = document.getElementById('organizacionesTableBody');
    if (!tableBody) return;
    
    // Obtener todas las organizaciones ordenadas
    const organizaciones = Object.values(organizacionesData)
        .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
    
    // Limpiar la tabla
    tableBody.innerHTML = '';
    
    // Si no hay organizaciones, mostrar mensaje
    if (organizaciones.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-building"></i>
                        <p>No existen registros de organizaciones</p>
                        <small>Haz clic en "Crear Organización" para crear el primer registro</small>
                    </div>
                </td>
            </tr>`;
        return;
    }
    
    // Agregar todas las organizaciones
    organizaciones.forEach(org => {
        const isActive = org.activo !== false;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${org.codigo}</td>
            <td>${org.nombre}</td>
            <td>
                <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVA' : 'INACTIVA'}</span>
            </td>
            <td>
                <button class="btn btn-small" onclick="editOrg('${org.codigo}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <label class="animated-toggle" data-codigo="${org.codigo}" title="${isActive ? 'Desactivar' : 'Activar'}">
                    <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleOrgState('${org.codigo}')">
                    <span class="toggle-slider"></span>
                </label>
            </td>
        `;
        
        // Agregar efectos hover
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        tableBody.appendChild(row);
    });
}

/**
 * Función para eliminar una organización
 * @param {string} codigo - Código de la organización a eliminar
 */
// Eliminar ya no se usa para organizaciones; se mantiene reservado sin UI

// ========================================
// FUNCIONES PARA ACTIVAR/DESACTIVAR ORGANIZACIÓN
// ========================================

/**
 * Cambia inmediatamente el estado visual del toggle y muestra modal de confirmación
 */
function toggleOrgState(codigo) {
    const org = organizacionesData[codigo];
    if (!org) return;
    const estadoOriginal = org.activo !== false;
    // Cambiar estado en memoria
    org.activo = !estadoOriginal;
    
    // Función auxiliar para actualizar UI en una tabla específica
    function updateTableUI(tableSelector) {
        const tableRows = document.querySelectorAll(`${tableSelector} tr`);
        let toggleElement = null;
        let toggleInput = null;
        let badgeElement = null;
        for (let row of tableRows) {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent.trim() === codigo) {
                toggleElement = row.querySelector('.animated-toggle');
                toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
                badgeElement = row.querySelector('span.badge');
                break;
            }
        }
        if (toggleElement && toggleInput) {
            toggleInput.checked = org.activo !== false;
            toggleElement.title = (org.activo !== false) ? 'Desactivar' : 'Activar';
            if (badgeElement) {
                if (org.activo !== false) {
                    badgeElement.className = 'badge badge-success';
                    badgeElement.textContent = 'ACTIVA';
                } else {
                    badgeElement.className = 'badge badge-secondary';
                    badgeElement.textContent = 'INACTIVA';
                }
            }
        }
    }
    
    // Actualizar UI en ambas tablas (principal y resultados de búsqueda)
    updateTableUI('#organizacionesTableBody');
    updateTableUI('#orgSearchResultsBody');
    
    // Mostrar confirmación
    showConfirmToggleOrgModal(codigo, estadoOriginal);
}

function showConfirmToggleOrgModal(codigo, estadoOriginal) {
    const org = organizacionesData[codigo];
    if (!org) return;
    window.tempToggleOrgCode = codigo;
    window.tempToggleOrgPrev = estadoOriginal;
    const modal = document.getElementById('confirmToggleOrgModal');
    if (modal) {
        const actionText = estadoOriginal ? 'desactivar' : 'activar';
        const titleElement = modal.querySelector('.modal-title');
        const messageElement = modal.querySelector('.modal-message');
        if (titleElement) titleElement.textContent = `${actionText.toUpperCase()} ORGANIZACIÓN`;
        if (messageElement) messageElement.textContent = `¿Está seguro de que desea ${actionText} la organización ${org.nombre}?`;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function cancelToggleOrg() {
    const codigo = window.tempToggleOrgCode;
    const prev = window.tempToggleOrgPrev;
    if (codigo != null) {
        const org = organizacionesData[codigo];
        if (org) {
            // Revertir en memoria
            org.activo = prev;
            
            // Función auxiliar para revertir UI en una tabla específica
            function revertTableUI(tableSelector) {
                const tableRows = document.querySelectorAll(`${tableSelector} tr`);
                let toggleElement = null;
                let toggleInput = null;
                let badgeElement = null;
                for (let row of tableRows) {
                    const firstCell = row.querySelector('td');
                    if (firstCell && firstCell.textContent.trim() === codigo) {
                        toggleElement = row.querySelector('.animated-toggle');
                        toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
                        badgeElement = row.querySelector('span.badge');
                        break;
                    }
                }
                if (toggleElement && toggleInput) {
                    toggleInput.checked = org.activo !== false;
                    toggleElement.title = (org.activo !== false) ? 'Desactivar' : 'Activar';
                    if (badgeElement) {
                        if (org.activo !== false) {
                            badgeElement.className = 'badge badge-success';
                            badgeElement.textContent = 'ACTIVA';
                        } else {
                            badgeElement.className = 'badge badge-secondary';
                            badgeElement.textContent = 'INACTIVA';
                        }
                    }
                }
            }
            
            // Revertir UI en ambas tablas (principal y resultados de búsqueda)
            revertTableUI('#organizacionesTableBody');
            revertTableUI('#orgSearchResultsBody');
        }
    }
    const modal = document.getElementById('confirmToggleOrgModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    window.tempToggleOrgCode = null;
    window.tempToggleOrgPrev = null;
}

function confirmToggleOrg() {
    const codigo = window.tempToggleOrgCode;
    if (codigo != null) {
        const org = organizacionesData[codigo];
        if (org) {
            // Persistir por ciudad
            const city = getSelectedCityCode();
            if (!organizacionesByCity[city]) organizacionesByCity[city] = {};
            const toSave = { ...org, ciudad: city };
            organizacionesByCity[city][codigo] = toSave;
            persistOrgsByCity();
            // Cerrar confirmación y mostrar éxito
            const confirmModal = document.getElementById('confirmToggleOrgModal');
            if (confirmModal) confirmModal.classList.remove('show');
            showSuccessToggleOrgModal(codigo);
        }
    }
    window.tempToggleOrgCode = null;
    window.tempToggleOrgPrev = null;
}

function showSuccessToggleOrgModal(codigo) {
    const org = organizacionesData[codigo];
    const modal = document.getElementById('successToggleOrgModal');
    if (modal && org) {
        const messageElement = modal.querySelector('.modal-message');
        if (messageElement) {
            const estado = (org.activo !== false) ? 'activada' : 'desactivada';
            messageElement.textContent = `La organización ${org.nombre} ha sido ${estado} exitosamente.`;
        }
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessToggleOrgModal() {
    const modal = document.getElementById('successToggleOrgModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Muestra el modal de confirmación para eliminar organización
 */
function showConfirmDeleteOrgModal() {
    const modal = document.getElementById('confirmDeleteOrgModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela la eliminación de la organización
 */
function cancelDeleteOrg() {
    const modal = document.getElementById('confirmDeleteOrgModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Limpiar datos temporales
    window.tempDeleteOrgCode = null;
}

/**
 * Confirma la eliminación de la organización
 * CONEXIÓN BACKEND: DELETE /api/organizaciones/{codigo}
 */
function confirmDeleteOrg() {
    const codigo = window.tempDeleteOrgCode;
    
    if (codigo) {
        console.log('Eliminando organización con código:', codigo);
        
        // ========================================
        // 🔗 CONEXIÓN BACKEND - ELIMINAR ORGANIZACIÓN
        // ========================================
        // Endpoint: DELETE /api/organizaciones/{codigo}
        // Headers: { Authorization: "Bearer {token}" }
        // 
  
        
        // Buscar y eliminar la fila de la tabla
        const tableBody = document.getElementById('organizacionesTableBody');
        const rows = tableBody.querySelectorAll('tr');
        
        for (let row of rows) {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent === codigo) {
                row.remove();
                
                // Si no quedan organizaciones, mostrar mensaje de "sin datos"
                if (tableBody.children.length === 0) {
                    const noDataRow = document.createElement('tr');
                    noDataRow.innerHTML = `
                        <td colspan="4" class="no-data-message">
                            <div class="no-data-content">
                                <i class="fas fa-building"></i>
                                <p>No existen registros de organizaciones</p>
                                <small>Haz clic en "Crear Organización" para crear el primer registro</small>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(noDataRow);
                }
                break;
            }
        }
        
        // Eliminar de la memoria (vista) y del bucket por ciudad
        delete organizacionesData[codigo];
        const cityDel = getSelectedCityCode();
        if (organizacionesByCity[cityDel]) {
            delete organizacionesByCity[cityDel][codigo];
            persistOrgsByCity();
        }
        
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmDeleteOrgModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Mostrar modal de éxito
        showSuccessDeleteOrgModal();
        
        // Limpiar datos temporales
        window.tempDeleteOrgCode = null;
    }
}

/**
 * Muestra el modal de éxito para eliminar organización
 */
function showSuccessDeleteOrgModal() {
    const modal = document.getElementById('successDeleteOrgModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito para eliminar organización
 */
function closeSuccessDeleteOrgModal() {
    const modal = document.getElementById('successDeleteOrgModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// FUNCIONES DE CIUDAD
// ========================================

/**
 * Muestra el modal de selección de ciudad
 */
function showSelectOrgModal() {
    console.log('🏙️ Mostrando modal de selección de ciudad...');
    const modal = document.getElementById('selectOrgModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        loadCitiesForSelection();
    }
}

/**
 * Oculta el modal de selección de ciudad
 */
function hideSelectOrgModal() {
    const modal = document.getElementById('selectOrgModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Carga las ciudades disponibles en el select
 */
function loadCitiesForSelection() {
    console.log('📋 Cargando ciudades para selección...');
    
    const citySelect = document.getElementById('cId_Ciudad');
    if (!citySelect) return;
    
    // Cargar ciudades reales del sistema
    let ciudades = {};
    if (typeof window.getCiudadesData === 'function') {
        try { 
            ciudades = window.getCiudadesData(); 
        } catch (e) { 
            ciudades = {}; 
        }
    } else {
        // Fallback a localStorage si existe data válida
        try {
            const raw = localStorage.getItem('ciudadesData');
            const parsed = raw ? JSON.parse(raw) : {};
            if (parsed && typeof parsed === 'object') {
                ciudades = Object.fromEntries(
                    Object.entries(parsed).filter(([k, v]) => v && typeof v === 'object' && v.codigo && v.nombre)
                );
            }
        } catch (e) { 
            ciudades = {}; 
        }
    }
    
    const current = citySelect.value;
    citySelect.innerHTML = '<option value="">Seleccione la ciudad</option>';
    
    Object.values(ciudades)
        .filter(c => c.activo !== false) // Solo ciudades activas
        .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
        .forEach(c => {
            const opt = document.createElement('option');
            const code = String(c.codigo || '').toUpperCase();
            const name = String(c.nombre || '').toUpperCase();
            opt.value = c.codigo;
            opt.textContent = `${code} - ${name}`;
            citySelect.appendChild(opt);
        });
    
    if (current && ciudades[current] && ciudades[current].activo !== false) {
        citySelect.value = current;
    }
}

/**
 * Maneja la selección de ciudad
 */
function handleSelectCity() {
    console.log('✅ Procesando selección de ciudad...');
    
    const citySelect = document.getElementById('cId_Ciudad');
    const selectedValue = citySelect ? citySelect.value : '';
    
    if (!selectedValue) {
        showNotification('Por favor seleccione una ciudad', 'error');
        return;
    }
    
    // Obtener nombre de la ciudad seleccionada
    const selectedOption = citySelect.options[citySelect.selectedIndex];
    const cityName = selectedOption ? selectedOption.textContent : '';
    
    // Actualizar indicador de ciudad actual
    updateCurrentCityDisplay(cityName);
    
    // Ocultar modal
    hideSelectOrgModal();
    
    // Remover notificaciones existentes del mismo mensaje
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => {
        if (notif.textContent.includes('Ciudad seleccionada')) {
            notif.remove();
        }
    });
    showNotification(`Ciudad seleccionada: ${cityName}`, 'success');
}

/**
 * Actualiza la visualización de la ciudad actual
 */
function updateCurrentCityDisplay(cityName) {
    const currentCityElement = document.getElementById('currentCityName');
    if (currentCityElement) {
        currentCityElement.textContent = cityName;
    }
}

// Exponer funciones de eliminación globalmente
// Nota: deleteOrg no se usa actualmente (ver línea 1341), pero se mantienen las funciones de modal
// window.deleteOrg = deleteOrg; // Comentado porque la función no existe
window.showConfirmDeleteOrgModal = showConfirmDeleteOrgModal;
window.cancelDeleteOrg = cancelDeleteOrg;
window.confirmDeleteOrg = confirmDeleteOrg;
window.showSuccessDeleteOrgModal = showSuccessDeleteOrgModal;
window.closeSuccessDeleteOrgModal = closeSuccessDeleteOrgModal;
// Exponer funciones de toggle globalmente
window.toggleOrgState = toggleOrgState;
window.cancelToggleOrg = cancelToggleOrg;
window.confirmToggleOrg = confirmToggleOrg;
window.closeSuccessToggleOrgModal = closeSuccessToggleOrgModal;
// Exponer funciones de ciudad globalmente
window.showSelectOrgModal = showSelectOrgModal;
window.hideSelectOrgModal = hideSelectOrgModal;
window.handleSelectCity = handleSelectCity;
window.updateCurrentCityDisplay = updateCurrentCityDisplay;