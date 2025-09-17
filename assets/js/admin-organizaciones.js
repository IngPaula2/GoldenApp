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
    // Volcar bucket de la ciudad actual a organizacionesData (memoria de la vista)
    const city = getSelectedCityCode();
    const bucket = (organizacionesByCity && organizacionesByCity[city]) ? organizacionesByCity[city] : {};
    // Limpiar estructura en memoria y tabla
    try {
        Object.keys(organizacionesData).forEach(k => delete organizacionesData[k]);
    } catch (e) {}
    // Rellenar en memoria
    Object.keys(bucket).forEach(code => { organizacionesData[code] = bucket[code]; });
    // Reconstruir tabla
    try {
        const tableBody = document.getElementById('organizacionesTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-building"></i>
                            <p>No existen registros de organizaciones</p>
                            <small>Haz clic en "Crear Organización" para crear el primer registro</small>
                        </div>
                    </td>
                </tr>`;
            Object.values(organizacionesData)
                .sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo)))
                .forEach(o => addOrgToTable(o, true));
        }
    } catch (e) {}
}

document.addEventListener('DOMContentLoaded', function() {
    
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
    
    // Referencias a los elementos de modales
    const selectOrgModal = document.getElementById('selectOrgModal');
    const selectOrgModalOverlay = document.querySelector('#selectOrgModal.modal-overlay');
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
        createOrgModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Oculta el modal de crear organización y limpia el formulario
     */
    function hideCreateOrgModal() {
        createOrgModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Limpiar campos del formulario
        clearCreateOrgForm();
    }
    
    /**
     * Limpia todos los campos del formulario de crear organización y restaura el modo "crear"
     */
    function clearCreateOrgForm() {
        document.getElementById('tCodigo').value = '';
        document.getElementById('tNombre').value = '';
        
        // Limpiar atributo de código original
        document.getElementById('tCodigo').removeAttribute('data-original-code');
        
        // Restaurar modo "crear" (título y botón)
        document.getElementById('createOrgTitle').textContent = 'CREAR ORGANIZACIÓN';
        document.getElementById('bCrear').textContent = 'Crear';
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
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmCreateOrgModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
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
        if (!city) { try { showNotification('Seleccione una ciudad primero', 'warning'); } catch(e) {} return; }
        if (!organizacionesByCity[city]) organizacionesByCity[city] = {};
        const toSave = { ...orgData, ciudad: city };
        organizacionesByCity[city][orgData.codigo] = toSave;
        persistOrgsByCity();
        // También reflejar en memoria y UI actual
        organizacionesData[orgData.codigo] = toSave;
        
        // Cerrar modal de creación y limpiar formulario
        hideCreateOrgModal();
        
        // Agregar la organización a la tabla
        console.log('Llamando a addOrgToTable con:', orgData);
        addOrgToTable(orgData);
        console.log('addOrgToTable ejecutado');
        
        // Mostrar modal de éxito
        showSuccessCreateOrgModal();
        
        // Limpiar datos temporales
        window.tempOrgData = null;
    }
    
    /**
     * Muestra el modal de éxito para crear organización
     */
    function showSuccessCreateOrgModal() {
        const modal = document.getElementById('successCreateOrgModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cierra el modal de éxito de organización
     */
    function closeSuccessOrgModal() {
        const modal = document.getElementById('successCreateOrgModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }
    
    // Exponer funciones globalmente
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
    
    // Cerrar modal de selección de ciudad al hacer clic fuera
    selectOrgModalOverlay.addEventListener('click', function(e) {
        if (e.target === selectOrgModalOverlay) {
            hideSelectOrgModal();
        }
    });
    
    // Cerrar modal de búsqueda de organización al hacer clic fuera
    orgSearchModalOverlay.addEventListener('click', function(e) {
        if (e.target === orgSearchModalOverlay) {
            hideModal();
        }
    });
    
    // Cerrar modal de crear organización al hacer clic fuera
    createOrgModalOverlay.addEventListener('click', function(e) {
        if (e.target === createOrgModalOverlay) {
            hideCreateOrgModal();
        }
    });
    
    // Cerrar modales de resultados al hacer clic fuera
    if (orgResultsModalOverlay) {
        orgResultsModalOverlay.addEventListener('click', function(e) {
            if (e.target === orgResultsModalOverlay) {
                hideOrgResultsModal();
            }
        });
    }
    
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
    
    // ========================================
    // NAVEGACIÓN DEL SIDEBAR
    // ========================================
    
    // Funcionalidad de navegación del sidebar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover clase activa de todos los elementos
            navItems.forEach(nav => nav.classList.remove('active'));
            // Agregar clase activa al elemento clickeado
            this.classList.add('active');
            
            // Mostrar modal de selección de ciudad al navegar a cualquier sección
            showSelectOrgModal();
        });
    });
    
    // ========================================
    // NAVEGACIÓN SUPERIOR
    // ========================================
    
    // Funcionalidad de navegación superior
    const topNavItems = document.querySelectorAll('.top-nav-item');
    topNavItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover clase activa de todos los elementos
            topNavItems.forEach(nav => nav.classList.remove('active'));
            // Agregar clase activa al elemento clickeado
            this.classList.add('active');
            
            // Mostrar modal de selección de ciudad al navegar a cualquier sección
            showSelectOrgModal();
        });
    });
    
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
    
    // ========================================
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
    const orgSelect = document.getElementById('orgSelect');
    
    /**
     * Pobla el select de ciudades con datos actualizados
     * Se sincroniza con los datos de ciudades desde otras interfaces
     */
    function populateOrgCitySelect() {
        if (!orgSelect) return;
        // Preferir origen vivo, con fallback validado cuando haya ciudades en esta sesión
        let ciudades = {};
        if (typeof window.getCiudadesData === 'function') {
            try { ciudades = window.getCiudadesData(); } catch (e) { ciudades = {}; }
        } else {
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
            const selectedCity = document.getElementById('orgSelect').value;
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
    
    // Funcionalidad del botón crear organización
    const bCrear = document.getElementById('bCrear');
    if (bCrear) {
        bCrear.addEventListener('click', function() {
            // Obtener valores del formulario
            const codigo = document.getElementById('tCodigo').value.trim();
            const nombre = document.getElementById('tNombre').value.trim();
            
            // Validar campos obligatorios
            if (!codigo || !nombre) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            
            // Crear objeto de organización
            const nuevaOrganizacion = {
                codigo: codigo,
                nombre: nombre,
                // Estado por defecto: activa
                activo: true
            };
            
            // Determinar si es crear o actualizar basado en el texto del botón
            const isUpdate = document.getElementById('bCrear').textContent === 'Actualizar';
            
            if (isUpdate) {
                // Es una actualización - mostrar modal de confirmación
                window.tempOrgData = nuevaOrganizacion;
                showConfirmUpdateOrgModal();
            } else {
                // Es una creación - mostrar modal de confirmación
                window.tempOrgData = nuevaOrganizacion;
                showConfirmCreateOrgModal();
            }
        });
    }
    
    /**
     * Procesa la actualización de una organización
     * Maneja cambios de código y actualización de datos
     */
    function processOrgUpdate(nuevaOrganizacion) {
        const codigo = nuevaOrganizacion.codigo;
        
        // Verificar si el código cambió
        const originalCode = document.getElementById('tCodigo').getAttribute('data-original-code');
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
                    <td colspan="3" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-search"></i>
                            <p>No se encontraron resultados</p>
                            <small>Intente con otro código</small>
                        </div>
                    </td>
                </tr>`;
            return;
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${organizacion.codigo}</td>
            <td>${organizacion.nombre}</td>
            <td>
                <button class="btn btn-small" onclick="editOrg('${organizacion.codigo}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteOrg('${organizacion.codigo}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
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
        document.getElementById('tCodigo').value = organizacion.codigo;
        document.getElementById('tNombre').value = organizacion.nombre;
        
        // Cambiar el título y texto del botón
        document.getElementById('createOrgTitle').textContent = 'ACTUALIZAR ORGANIZACIÓN';
        document.getElementById('bCrear').textContent = 'Actualizar';
        
        // Guardar el código original para poder eliminarlo después si cambia
        document.getElementById('tCodigo').setAttribute('data-original-code', codigo);
        
        // Cerrar cualquier modal abierto y abrir modal de crear/actualizar
        try { hideModal(); } catch(e) {}
        try { hideOrgResultsModal(); } catch(e) {}
        showCreateOrgModal();
    }
    
    // ========================================
    // FUNCIONALIDAD RESPONSIVE
    // ========================================
    
    /**
     * Crea el botón toggle para el sidebar en dispositivos móviles
     */
    function createMobileToggle() {
        const sidebar = document.querySelector('.sidebar');
        const toggleButton = document.createElement('button');
        toggleButton.className = 'mobile-toggle';
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        toggleButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1001;
            background: #DEB448;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: #1a1a1a;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        toggleButton.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
        
        document.body.appendChild(toggleButton);
        
        // Mostrar botón toggle en móviles
        function checkMobile() {
            if (window.innerWidth <= 768) {
                toggleButton.style.display = 'flex';
            } else {
                toggleButton.style.display = 'none';
                sidebar.classList.remove('open');
            }
        }
        
        window.addEventListener('resize', checkMobile);
        checkMobile();
    }
    
    createMobileToggle();
    
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
        document.getElementById('tCodigo').value = organizacion.codigo;
        document.getElementById('tNombre').value = organizacion.nombre;
        
        // Cambiar el título y texto del botón
        document.getElementById('createOrgTitle').textContent = 'ACTUALIZAR ORGANIZACIÓN';
        document.getElementById('bCrear').textContent = 'Actualizar';
        
        // Guardar el código original para poder eliminarlo después si cambia
        document.getElementById('tCodigo').setAttribute('data-original-code', codigo);
        
        // Cerrar cualquier modal abierto y abrir modal de crear/actualizar
        try { hideModal(); } catch(e) {}
        try { hideOrgResultsModal(); } catch(e) {}
        showCreateOrgModal();
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
        }
        
        // Limpiar datos temporales
        window.tempOrgData = null;
    }
    
    /**
     * Confirma la actualización de la organización
     * CONEXIÓN BACKEND: PUT /api/organizaciones/{codigo}
     */
    function confirmUpdateOrg() {
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmUpdateOrgModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
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
        
        // Cerrar modal de creación
        hideCreateOrgModal();
        
        // Mostrar modal de éxito
        showSuccessUpdateOrgModal();
        
        // Limpiar datos temporales
        window.tempOrgData = null;
    }
    
    /**
     * Muestra el modal de éxito para actualizar organización
     */
    function showSuccessUpdateOrgModal() {
        const modal = document.getElementById('successUpdateOrgModal');
        if (modal) {
            modal.classList.add('show');
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
    
    const noDataRow = tableBody.querySelector('.no-data-message');
    
    if (noDataRow) {
        noDataRow.remove();
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
    
    const rowHtml = `
        <td>${organizacion.codigo}</td>
        <td>${organizacion.nombre}</td>
        <td>
            <button class="btn btn-small" onclick="editOrg('${organizacion.codigo}')" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-small btn-danger" onclick="deleteOrg('${organizacion.codigo}')" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
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
        tableBody.appendChild(newRow);
        console.log('Nueva fila agregada a la tabla');
        
        // Agregar efectos hover a la nueva fila
        newRow.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        newRow.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    }
    // Si existe pero no se debe reemplazar, no hacer nada
}

/**
 * Función para eliminar una organización
 * @param {string} codigo - Código de la organización a eliminar
 */
function deleteOrg(codigo) {
    // Guardar el código de la organización a eliminar
    window.tempDeleteOrgCode = codigo;
    
    // Mostrar modal de confirmación
    showConfirmDeleteOrgModal();
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
                        <td colspan="3" class="no-data-message">
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

// Exponer funciones de eliminación globalmente
window.deleteOrg = deleteOrg;
window.showConfirmDeleteOrgModal = showConfirmDeleteOrgModal;
window.cancelDeleteOrg = cancelDeleteOrg;
window.confirmDeleteOrg = confirmDeleteOrg;
window.showSuccessDeleteOrgModal = showSuccessDeleteOrgModal;
window.closeSuccessDeleteOrgModal = closeSuccessDeleteOrgModal;