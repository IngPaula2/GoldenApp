/**
 *  DASHBOARD ADMINISTRATIVO - GOLDEN APP
 * 
 * Este archivo contiene toda la funcionalidad del panel administrativo de ciudades.
 * Incluye gestión de modales, navegación, formularios y operaciones CRUD.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2024
 */

// Dashboard JavaScript

// ========================================
// VARIABLES GLOBALES
// ========================================
const ciudadesData = {};
const filialData = {};

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
    const selectCityModal = document.getElementById('selectCityModal');
    const selectCityModalOverlay = document.querySelector('#selectCityModal.modal-overlay');
    const modal = document.getElementById('cityModal');
    const citySearchModalOverlay = document.querySelector('#cityModal.modal-overlay');
    const createCityModal = document.getElementById('createCityModal');
    const createCityModalOverlay = document.querySelector('#createCityModal.modal-overlay');
    const branchModalOverlay = document.querySelector('#branchModal.modal-overlay');
    const upsertBranchModalOverlay = document.querySelector('#upsertBranchModal.modal-overlay');
    const cityResultsModalOverlay = document.querySelector('#cityResultsModal.modal-overlay');
    const branchResultsModalOverlay = document.querySelector('#branchResultsModal.modal-overlay');
    
    /**
     * Muestra el modal de selección de ciudad
     * Solo se muestra si el usuario no ha seleccionado una ciudad en esta sesión
     */
    function showSelectCityModal() {
        // Verificar si el usuario ya seleccionó una ciudad en esta sesión
        const selectedCity = sessionStorage.getItem('selectedCity');
        if (!selectedCity) {
            selectCityModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Fuerza la visualización del modal de selección de ciudad
     * Se usa para permitir cambiar la ciudad seleccionada
     */
    function forceShowSelectCityModal() {
        selectCityModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Oculta el modal de selección de ciudad
     * Restaura el scroll del body
     */
    function hideSelectCityModal() {
        selectCityModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    /**
     * Muestra el modal de búsqueda de ciudad
     */
    function showCitySearchModal() {
        citySearchModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Limpiar campo de búsqueda
        document.getElementById('searchCityCodigo').value = '';
    }
    
    /**
     * Oculta el modal de búsqueda de ciudad
     */
    function hideModal() {
        citySearchModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    /**
     * Muestra el modal para crear una nueva ciudad
     */
    function showCreateCityModal() {
        createCityModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Oculta el modal de crear ciudad y limpia el formulario
     */
    function hideCreateCityModal() {
        createCityModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Limpiar campos del formulario
        clearCreateCityForm();
    }
    
    /**
     * Limpia todos los campos del formulario de crear ciudad y restaura el modo "crear"
     */
    function clearCreateCityForm() {
        document.getElementById('tCodigo').value = '';
        document.getElementById('tNombre').value = '';
        document.getElementById('tDireccion').value = '';
        document.getElementById('tTelefono').value = '';
        document.getElementById('tCorreo').value = '';
        
        // Limpiar atributo de código original
        document.getElementById('tCodigo').removeAttribute('data-original-code');
        
        // Restaurar modo "crear" (título y botón)
        document.getElementById('createCityTitle').textContent = 'CREAR CIUDAD';
        document.getElementById('bCrear').textContent = 'Crear';
    }
    
    // ========================================
    // FUNCIONES GLOBALES
    // ========================================
    
    // Hacer funciones disponibles globalmente para uso en HTML
    window.hideModal = hideModal;
    window.hideCreateCityModal = hideCreateCityModal;
    window.hideSelectCityModal = hideSelectCityModal;
    window.showSelectCityModal = showSelectCityModal;
    window.forceShowSelectCityModal = forceShowSelectCityModal;
    window.showCitySearchModal = showCitySearchModal;
    window.showCreateCityModal = showCreateCityModal;
    
    // ===== Filiales: funciones de modal =====
    function showBranchModal() {
        if (branchModalOverlay) {
            branchModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Limpiar campo de búsqueda
            document.getElementById('searchCityCode').value = '';
        }
    }
    
    function hideBranchModal() {
        if (branchModalOverlay) {
            branchModalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    function showUpsertBranchModal(mode, filial) {
        if (upsertBranchModalOverlay) {
            const title = document.getElementById('upsertBranchTitle');
            const btn = document.getElementById('bGuardarFilial');
            const codigo = document.getElementById('fCodigo');
            const nombre = document.getElementById('fNombre');
            const ciudad = document.getElementById('fCiudad');
            const direccion = document.getElementById('fDireccion');
            const telefono = document.getElementById('fTelefono');
            
            if (mode === 'update' && filial) {
                if (title) title.textContent = 'ACTUALIZAR FILIAL';
                if (btn) btn.textContent = 'Actualizar';
                if (codigo) codigo.value = filial.codigo || '';
                if (nombre) nombre.value = filial.nombre || '';
                if (ciudad) ciudad.value = filial.ciudad || '';
                if (direccion) direccion.value = filial.direccion || '';
                if (telefono) telefono.value = filial.telefono || '';
                if (codigo) codigo.disabled = true; // no permitir cambiar código en actualización
            } else {
                if (title) title.textContent = 'CREAR FILIAL';
                if (btn) btn.textContent = 'Guardar';
                if (codigo) { codigo.value = ''; codigo.disabled = false; }
                if (nombre) nombre.value = '';
                if (ciudad) ciudad.value = '';
                if (direccion) direccion.value = '';
                if (telefono) telefono.value = '';
            }
            upsertBranchModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hideUpsertBranchModal() {
        if (upsertBranchModalOverlay) {
            upsertBranchModalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // Exponer funciones de filiales globalmente
    window.hideBranchModal = hideBranchModal;
    window.hideUpsertBranchModal = hideUpsertBranchModal;
    window.showUpsertBranchModal = showUpsertBranchModal;
    window.showBranchModal = showBranchModal;
    
    // ========================================
    // FUNCIONES DE CONFIRMACIÓN PARA CIUDADES
    // ========================================
    
    /**
     * Muestra el modal de confirmación para crear ciudad
     */
    function showConfirmCreateCityModal() {
        const modal = document.getElementById('confirmCreateCityModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cancela la creación de la ciudad
     */
    function cancelCreateCity() {
        const modal = document.getElementById('confirmCreateCityModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        
        // Limpiar datos temporales
        window.tempCityData = null;
    }
    
    /**
     * Confirma la creación de la ciudad
     */
    function confirmCreateCity() {
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmCreateCityModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Obtener datos temporales
        const cityData = window.tempCityData;
        
        if (!cityData) {
            console.error('No se encontraron datos de la ciudad para crear');
            return;
        }
        
        console.log('Datos de la ciudad a crear:', cityData);
        
        // ========================================
        // 🔗 CONEXIÓN BACKEND - CREAR CIUDAD
        // ========================================
        // Endpoint: POST /api/ciudades
        // Datos: { codigo, nombre, direccion, telefono, correo, activo: true }
        
        // Por ahora solo guardamos en memoria local
        ciudadesData[cityData.codigo] = cityData;
        
        // Cerrar modal de creación y limpiar formulario
        hideCreateCityModal();
        
        // Agregar la ciudad a la tabla
        console.log('Llamando a addCityToTable con:', cityData);
        addCityToTable(cityData);
        console.log('addCityToTable ejecutado');
        
        // Refrescar selects dependientes
        refreshCitySelects();
        
        // Mostrar modal de éxito
        showSuccessCreateCityModal();
        
        // Limpiar datos temporales
        window.tempCityData = null;
    }
    
    /**
     * Muestra el modal de éxito para crear ciudad
     */
    function showSuccessCreateCityModal() {
        const modal = document.getElementById('successCreateCityModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cierra el modal de éxito de ciudad
     */
    function closeSuccessCityModal() {
        const modal = document.getElementById('successCreateCityModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }
    
    // Exponer funciones globalmente
    window.cancelCreateCity = cancelCreateCity;
    window.confirmCreateCity = confirmCreateCity;
    window.closeSuccessCityModal = closeSuccessCityModal;
    
    // Funciones para modales de resultados
    function showCityResultsModal() {
        if (cityResultsModalOverlay) {
            cityResultsModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hideCityResultsModal() {
        if (cityResultsModalOverlay) {
            cityResultsModalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    function showBranchResultsModal() {
        if (branchResultsModalOverlay) {
            branchResultsModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hideBranchResultsModal() {
        if (branchResultsModalOverlay) {
            branchResultsModalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    window.hideCityResultsModal = hideCityResultsModal;
    window.hideBranchResultsModal = hideBranchResultsModal;
    
    // ========================================
    // EVENTOS DE MODALES
    // ========================================
    
    // Cerrar modal de selección de ciudad al hacer clic fuera
    selectCityModalOverlay.addEventListener('click', function(e) {
        if (e.target === selectCityModalOverlay) {
            hideSelectCityModal();
        }
    });
    
    // Cerrar modal de búsqueda de ciudad al hacer clic fuera
    citySearchModalOverlay.addEventListener('click', function(e) {
        if (e.target === citySearchModalOverlay) {
            hideModal();
        }
    });
    
    // Cerrar modal de crear ciudad al hacer clic fuera
    createCityModalOverlay.addEventListener('click', function(e) {
        if (e.target === createCityModalOverlay) {
            hideCreateCityModal();
        }
    });
    
    // Cerrar modal de selección de filial al hacer clic fuera
    if (branchModalOverlay) {
        branchModalOverlay.addEventListener('click', function(e) {
            if (e.target === branchModalOverlay) {
                hideBranchModal();
            }
        });
    }
    
    // Cerrar modal crear/actualizar filial al hacer clic fuera
    if (upsertBranchModalOverlay) {
        upsertBranchModalOverlay.addEventListener('click', function(e) {
            if (e.target === upsertBranchModalOverlay) {
                hideUpsertBranchModal();
            }
        });
    }
    
    // Cerrar modales de resultados al hacer clic fuera
    if (cityResultsModalOverlay) {
        cityResultsModalOverlay.addEventListener('click', function(e) {
            if (e.target === cityResultsModalOverlay) {
                hideCityResultsModal();
            }
        });
    }
    
    if (branchResultsModalOverlay) {
        branchResultsModalOverlay.addEventListener('click', function(e) {
            if (e.target === branchResultsModalOverlay) {
                hideBranchResultsModal();
            }
        });
    }
    
    // Cerrar modales con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (selectCityModalOverlay.style.display === 'flex') {
                hideSelectCityModal();
            }
            if (citySearchModalOverlay.style.display === 'flex') {
                hideModal();
            }
            if (createCityModalOverlay.style.display === 'flex') {
                hideCreateCityModal();
            }
            if (branchModalOverlay && branchModalOverlay.style.display === 'flex') {
                hideBranchModal();
            }
            if (upsertBranchModalOverlay && upsertBranchModalOverlay.style.display === 'flex') {
                hideUpsertBranchModal();
            }
            if (cityResultsModalOverlay && cityResultsModalOverlay.style.display === 'flex') {
                hideCityResultsModal();
            }
            if (branchResultsModalOverlay && branchResultsModalOverlay.style.display === 'flex') {
                hideBranchResultsModal();
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
            showSelectCityModal();
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
            showSelectCityModal();
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
                case 'Buscar Ciudad':
                    console.log('Botón Buscar Ciudad clickeado');
                    showCitySearchModal();
                    break;
                case 'Buscar Filial':
                    console.log('Botón Buscar Filial clickeado');
                    showBranchModal();
                    break;
                case 'Crear Ciudad':
                    console.log('Botón Crear Ciudad clickeado');
                    showCreateCityModal();
                    break;
                case 'Crear Filial':
                    console.log('Botón Crear Filial clickeado');
                    showUpsertBranchModal('create');
                    break;
                case 'Buscar':
                    console.log('Botón Buscar clickeado');
                    if (branchModalOverlay && branchModalOverlay.style.display === 'flex') {
                        const cityCode = document.getElementById('searchCityCode').value.trim();
                        if (!cityCode) {
                            alert('Ingrese el código de ciudad');
                            break;
                        }
                        renderBranchSearchResults(resultsByCity(cityCode));
                        hideBranchModal();
                        showBranchResultsModal();
                    } else {
                        const code = document.getElementById('searchCityCodigo').value.trim();
                        if (!code) {
                            alert('Ingrese el código de ciudad');
                            break;
                        }
                        renderCitySearchResults(resultCityByCode(code));
                        hideModal();
                        showCityResultsModal();
                    }
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
    
    // Funcionalidad del select de ciudades
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            console.log('Ciudad seleccionada:', this.value);
        });
    }
    
    // Funcionalidad del botón seleccionar ciudad
    const bSeleccionarCiudad = document.getElementById('bSeleccionarCiudad');
    if (bSeleccionarCiudad) {
        bSeleccionarCiudad.addEventListener('click', function() {
            const selectedCity = document.getElementById('citySelect').value;
            if (selectedCity) {
                console.log('Ciudad seleccionada:', selectedCity);
                sessionStorage.setItem('selectedCity', selectedCity);
                alert('Ciudad seleccionada: ' + selectedCity);
                hideSelectCityModal();
            } else {
                alert('Por favor, seleccione una ciudad');
            }
        });
    }
    
    // ========================================
    // FUNCIONALIDAD DEL BOTÓN CREAR CIUDAD
    // ========================================
    
    // Funcionalidad del botón crear ciudad
    const bCrear = document.getElementById('bCrear');
    if (bCrear) {
        bCrear.addEventListener('click', function() {
            // Obtener valores del formulario
            const codigo = document.getElementById('tCodigo').value.trim();
            const nombre = document.getElementById('tNombre').value.trim();
            const direccion = document.getElementById('tDireccion').value.trim();
            const telefono = document.getElementById('tTelefono').value.trim();
            const correo = document.getElementById('tCorreo').value.trim();
            
            // Validar campos obligatorios
            if (!codigo || !nombre || !direccion || !telefono || !correo) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                alert('Por favor, ingrese un correo electrónico válido.');
                return;
            }
            
            // Crear objeto de ciudad
            const nuevaCiudad = {
                codigo: codigo,
                nombre: nombre,
                direccion: direccion,
                telefono: telefono,
                correo: correo,
                // Estado por defecto: activa
                activo: true
            };
            
            // Determinar si es crear o actualizar basado en el texto del botón
            const isUpdate = document.getElementById('bCrear').textContent === 'Actualizar';
            
            if (isUpdate) {
                // Es una actualización - mostrar modal de confirmación
                window.tempCityData = nuevaCiudad;
                showConfirmUpdateCityModal();
            } else {
                // Es una creación - mostrar modal de confirmación
                window.tempCityData = nuevaCiudad;
                showConfirmCreateCityModal();
            }
        });
    }
    
    /**
     * Procesa la actualización de una ciudad
     */
    function processCityUpdate(nuevaCiudad) {
        const codigo = nuevaCiudad.codigo;
        
        // Verificar si el código cambió
        const originalCode = document.getElementById('tCodigo').getAttribute('data-original-code');
        if (originalCode && originalCode !== codigo) {
            // El código cambió - eliminar la ciudad anterior
            delete ciudadesData[originalCode];
            
            // Eliminar la fila anterior de la tabla
            const tableBody = document.getElementById('ciudadesTableBody');
            const rows = tableBody.querySelectorAll('tr');
            for (let row of rows) {
                const firstCell = row.querySelector('td');
                if (firstCell && firstCell.textContent === originalCode) {
                    row.remove();
                    break;
                }
            }
        }
        
        // Guardar datos
        ciudadesData[codigo] = nuevaCiudad;
        
        // Cerrar modal y actualizar tabla
        hideCreateCityModal();
        addCityToTable(nuevaCiudad, true);
        refreshCitySelects();
    }
    
    // ========================================
    // DATOS EN MEMORIA (sin valores por defecto)
    // ========================================
    
    function inferFilialFromSelect(code) {
        return { codigo: code, nombre: code, ciudad: sessionStorage.getItem('selectedCity') || '' };
    }
    
    // Guardar/Actualizar filial
    const bGuardarFilial = document.getElementById('bGuardarFilial');
    if (bGuardarFilial) {
        bGuardarFilial.addEventListener('click', function() {
            const title = document.getElementById('upsertBranchTitle');
            const codigo = document.getElementById('fCodigo').value.trim();
            const nombre = document.getElementById('fNombre').value.trim();
            const ciudad = document.getElementById('fCiudad').value.trim();
            const direccion = document.getElementById('fDireccion').value.trim();
            const telefono = document.getElementById('fTelefono').value.trim();
            
            if (!codigo || !nombre || !ciudad) {
                alert('Por favor, complete todos los campos obligatorios de la filial.');
                return;
            }
            
            const filial = { codigo, nombre, ciudad, direccion, telefono, activo: true };
            
            // Determinar si es crear o actualizar
            const isUpdate = title && title.textContent.includes('ACTUALIZAR');
            
            if (isUpdate) {
                // ========================================
                // 🔗 CONEXIÓN BACKEND - ACTUALIZAR FILIAL
                // ========================================
                // Endpoint: PUT /api/filiales/{codigo}
                // Datos: { codigo, nombre, ciudad, direccion, telefono, activo }
                
                // Es una actualización - procesar directamente
                filialData[codigo] = filial;
                addBranchToTable(filial, true);
                hideUpsertBranchModal();
            } else {
                // Es una creación - mostrar modal de confirmación
                window.tempBranchData = filial;
                showConfirmCreateBranchModal();
            }
        });
    }
    
    // ========================================
    // FUNCIONES DE CONFIRMACIÓN PARA FILIALES
    // ========================================
    
    /**
     * Muestra el modal de confirmación para crear filial
     */
    function showConfirmCreateBranchModal() {
        const modal = document.getElementById('confirmCreateBranchModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cancela la creación de la filial
     */
    function cancelCreateBranch() {
        const modal = document.getElementById('confirmCreateBranchModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        
        // Limpiar datos temporales
        window.tempBranchData = null;
    }
    
    /**
     * Confirma la creación de la filial
     */
    function confirmCreateBranch() {
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmCreateBranchModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Obtener datos temporales
        const branchData = window.tempBranchData;
        
        if (!branchData) {
            console.error('No se encontraron datos de la filial para crear');
            return;
        }
        
        console.log('Datos de la filial a crear:', branchData);
        
        // ========================================
        // 🔗 CONEXIÓN BACKEND - CREAR FILIAL
        // ========================================
        // Endpoint: POST /api/filiales
        // Datos: { codigo, nombre, ciudad, direccion, telefono, activo: true }
        
        // Por ahora solo guardamos en memoria local
        filialData[branchData.codigo] = branchData;
        
        // Cerrar modal de creación
        hideUpsertBranchModal();
        
        // Agregar la filial a la tabla
        addBranchToTable(branchData, true);
        
        // Mostrar modal de éxito
        showSuccessCreateBranchModal();
        
        // Limpiar datos temporales
        window.tempBranchData = null;
    }
    
    /**
     * Muestra el modal de éxito para crear filial
     */
    function showSuccessCreateBranchModal() {
        const modal = document.getElementById('successCreateBranchModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cierra el modal de éxito de filial
     */
    function closeSuccessBranchModal() {
        const modal = document.getElementById('successCreateBranchModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }
    
    // ========================================
    // FUNCIONES DE CONFIRMACIÓN PARA ACTUALIZAR CIUDADES
    // ========================================
    
    /**
     * Muestra el modal de confirmación para actualizar ciudad
     */
    function showConfirmUpdateCityModal() {
        const modal = document.getElementById('confirmUpdateCityModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cancela la actualización de la ciudad
     */
    function cancelUpdateCity() {
        const confirmModal = document.getElementById('confirmUpdateCityModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Limpiar datos temporales
        window.tempCityData = null;
    }
    
    /**
     * Confirma la actualización de la ciudad
     */
    function confirmUpdateCity() {
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmUpdateCityModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Obtener datos temporales
        const ciudadData = window.tempCityData;
        
        if (!ciudadData) {
            console.error('No se encontraron datos de la ciudad para actualizar');
            return;
        }
        
        console.log('Datos de la ciudad a actualizar:', ciudadData);
        
        // ========================================
        // 🔗 CONEXIÓN BACKEND - ACTUALIZAR CIUDAD
        // ========================================
        // Endpoint: PUT /api/ciudades/{codigo}
        // Datos: { codigo, nombre, direccion, telefono, correo, activo }
        
        // Procesar la actualización
        processCityUpdate(ciudadData);
        
        // Cerrar modal de creación
        hideCreateCityModal();
        
        // Mostrar modal de éxito
        showSuccessUpdateCityModal();
        
        // Limpiar datos temporales
        window.tempCityData = null;
    }
    
    /**
     * Muestra el modal de éxito para actualizar ciudad
     */
    function showSuccessUpdateCityModal() {
        const modal = document.getElementById('successUpdateCityModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cierra el modal de éxito de actualizar ciudad
     */
    function closeSuccessUpdateCityModal() {
        const modal = document.getElementById('successUpdateCityModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }
    
    // Exponer funciones globalmente
    window.cancelCreateBranch = cancelCreateBranch;
    window.confirmCreateBranch = confirmCreateBranch;
    window.closeSuccessBranchModal = closeSuccessBranchModal;
    window.showConfirmUpdateCityModal = showConfirmUpdateCityModal;
    window.cancelUpdateCity = cancelUpdateCity;
    window.confirmUpdateCity = confirmUpdateCity;
    window.showSuccessUpdateCityModal = showSuccessUpdateCityModal;
    window.closeSuccessUpdateCityModal = closeSuccessUpdateCityModal;
    
    // ========================================
    // TABLA DE FILIALES
    // ========================================
    function addBranchToTable(filial, replaceIfExists = false) {
        const tableBody = document.getElementById('filialesTableBody');
        const noDataRow = tableBody.querySelector('.no-data-message');
        if (noDataRow) noDataRow.remove();
        
        // Si existe, y se solicita reemplazar, actualizar la fila
        const existingRow = Array.from(tableBody.querySelectorAll('tr')).find(r => {
            const firstCell = r.querySelector('td');
            return firstCell && firstCell.textContent === filial.codigo;
        });
        
        const isActive = filial.activo !== false; // default true si no viene definido
        
        const rowHtml = `
            <td>${filial.codigo}</td>
            <td>${filial.nombre}</td>
            <td>${filial.ciudad}</td>
            <td>${filial.direccion || ''}</td>
            <td>${filial.telefono || ''}</td>
            <td>
                <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVA' : 'INACTIVA'}</span>
            </td>
            <td>
                <button class="btn btn-small" onclick="editBranch('${filial.codigo}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <label class="animated-toggle" data-codigo="${filial.codigo}" title="${isActive ? 'Desactivar' : 'Activar'}">
                    <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleBranchState('${filial.codigo}')">
                    <span class="toggle-slider"></span>
                </label>
            </td>
        `;
        
        if (existingRow && replaceIfExists) {
            existingRow.innerHTML = rowHtml;
        } else if (!existingRow) {
            const newRow = document.createElement('tr');
            newRow.innerHTML = rowHtml;
            tableBody.appendChild(newRow);
            
            newRow.addEventListener('mouseenter', function() { this.style.backgroundColor = '#f8f9fa'; });
            newRow.addEventListener('mouseleave', function() { this.style.backgroundColor = ''; });
        }
    }

    // ========================================
    // BÚSQUEDA EN MODALES (CIUDADES / FILIALES)
    // ========================================
function resultCityByCode(code) {
    // ========================================
    // 🔗 CONEXIÓN BACKEND - BUSCAR CIUDAD POR CÓDIGO
    // ========================================
    // Endpoint: GET /api/ciudades/{codigo}
    // Parámetro: codigo
    
    return ciudadesData[code] || null;
}
    
function resultsByCity(code) {
    // ========================================
    // 🔗 CONEXIÓN BACKEND - BUSCAR FILIALES POR CIUDAD
    // ========================================
    // Endpoint: GET /api/filiales/ciudad/{codigo}
    // Parámetro: codigo
    
    return Object.values(filialData).filter(f => f.ciudad === code);
}
    
    function renderCitySearchResults(ciudad) {
        const body = document.getElementById('citySearchResultsBody');
        if (!body) return;
        body.innerHTML = '';
        if (!ciudad) {
            body.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data-message">
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
        const isActive = ciudad.activo !== false;
        row.innerHTML = `
            <td>${ciudad.codigo}</td>
            <td>${ciudad.nombre}</td>
            <td>${ciudad.direccion || ''}</td>
            <td>${ciudad.telefono || ''}</td>
            <td>${ciudad.correo || ''}</td>
            <td><span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVA' : 'INACTIVA'}</span></td>
            <td>
                <button class="btn btn-small" onclick="editCity('${ciudad.codigo}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <label class="animated-toggle" data-codigo="${ciudad.codigo}" title="${isActive ? 'Desactivar' : 'Activar'}">
                    <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleCityState('${ciudad.codigo}')">
                    <span class="toggle-slider"></span>
                </label>
            </td>`;
        
        // El toggle switch ahora usa onclick directamente en el HTML
        
        body.appendChild(row);
    }
    
    function renderBranchSearchResults(results) {
        const body = document.getElementById('branchSearchResultsBody');
        if (!body) return;
        body.innerHTML = '';
        if (!results || results.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-search"></i>
                            <p>No se encontraron resultados</p>
                            <small>Intente con otro código de ciudad</small>
                        </div>
                    </td>
                </tr>`;
            return;
        }
        results.forEach(filial => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${filial.codigo}</td>
                <td>${filial.nombre}</td>
                <td>${filial.ciudad}</td>
                <td>${filial.direccion || ''}</td>
                <td>${filial.telefono || ''}</td>
                <td>
                    <button class="btn btn-small" onclick="editBranch('${filial.codigo}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteBranch('${filial.codigo}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>`;
            body.appendChild(row);
        });
    }

    // Refrescar selects de ciudades en modales relevantes
    function refreshCitySelects() {
        const selects = [document.getElementById('citySelect'), document.getElementById('fCiudad')];
        selects.forEach(sel => {
            if (!sel) return;
            const currentValue = sel.value;
            sel.innerHTML = '<option value="">Seleccione la ciudad</option>';
            Object.values(ciudadesData)
                .sort((a, b) => a.codigo.localeCompare(b.codigo))
                .forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.codigo;
                    opt.textContent = `${c.codigo} - ${c.nombre}`;
                    sel.appendChild(opt);
                });
            if (currentValue && ciudadesData[currentValue]) sel.value = currentValue;
        });
    }
    


    // ========================================
    // FUNCIONES DE EDICIÓN
    // ========================================
    
    /**
     * Función para editar una ciudad
     * Abre el modal de crear ciudad en modo actualizar
     */
    function editCity(codigo) {
        const ciudad = ciudadesData[codigo];
        if (!ciudad) return;
        
        // Llenar los campos con los datos de la ciudad
        document.getElementById('tCodigo').value = ciudad.codigo;
        document.getElementById('tNombre').value = ciudad.nombre;
        document.getElementById('tDireccion').value = ciudad.direccion || '';
        document.getElementById('tTelefono').value = ciudad.telefono || '';
        document.getElementById('tCorreo').value = ciudad.correo || '';
        
        // Cambiar el título y texto del botón
        document.getElementById('createCityTitle').textContent = 'ACTUALIZAR CIUDAD';
        document.getElementById('bCrear').textContent = 'Actualizar';
        
        // Cerrar modal actual y abrir modal de crear/actualizar
        hideModal();
        showCreateCityModal();
    }
    
    /**
     * Función para editar una filial
     * Abre el modal de crear filial en modo actualizar
     */
    function editBranch(codigo) {
        const filial = filialData[codigo];
        if (!filial) return;
        
        // Llenar los campos con los datos de la filial
        document.getElementById('fCodigo').value = filial.codigo;
        document.getElementById('fNombre').value = filial.nombre;
        document.getElementById('fCiudad').value = filial.ciudad || '';
        document.getElementById('fDireccion').value = filial.direccion || '';
        document.getElementById('fTelefono').value = filial.telefono || '';
        
        // Cambiar el título y texto del botón
        document.getElementById('upsertBranchTitle').textContent = 'ACTUALIZAR FILIAL';
        document.getElementById('bGuardarFilial').textContent = 'Actualizar';
        
        // Cerrar modal actual y abrir modal de crear/actualizar filial
        hideModal();
        showUpsertBranchModal('update', filial);
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
    console.log('Dashboard inicializado exitosamente');
    
    // Los toggle switches ahora usan onclick directamente en el HTML
    
    // Mostrar modal de selección de ciudad al cargar la página (simulando login)
    // Esto mostrará el modal automáticamente cuando se cargue la página
    setTimeout(showSelectCityModal, 500);
    
    // ========================================
    // FUNCIONES DE GESTIÓN DE CIUDADES
    // ========================================
    
    
    // ========================================
    // FUNCIONES GLOBALES DE CIUDADES
    // ========================================
    window.editCity = function(codigo) {
        const ciudad = ciudadesData[codigo];
        if (!ciudad) {
            alert('No se encontró la ciudad ' + codigo);
            return;
        }
        
        // Llenar los campos con los datos de la ciudad
        document.getElementById('tCodigo').value = ciudad.codigo;
        document.getElementById('tNombre').value = ciudad.nombre;
        document.getElementById('tDireccion').value = ciudad.direccion || '';
        document.getElementById('tTelefono').value = ciudad.telefono || '';
        document.getElementById('tCorreo').value = ciudad.correo || '';
        
        // Cambiar el título y texto del botón
        document.getElementById('createCityTitle').textContent = 'ACTUALIZAR CIUDAD';
        document.getElementById('bCrear').textContent = 'Actualizar';
        
        // Guardar el código original para poder eliminarlo después si cambia
        document.getElementById('tCodigo').setAttribute('data-original-code', codigo);
        
        // Cerrar modal actual y abrir modal de crear/actualizar
        hideModal();
        showCreateCityModal();
    };
    
    // ========================================
    // FUNCIONES GLOBALES DE FILIALES
    // ========================================
    window.editBranch = function(codigo) {
        const filial = filialData[codigo];
        if (!filial) {
            alert('No se encontró la filial ' + codigo);
            return;
        }
        showUpsertBranchModal('update', filial);
    };
    
    window.deleteBranch = function(codigo) {
        if (!confirm('¿Está seguro de eliminar la filial ' + codigo + '?')) return;
        const tableBody = document.getElementById('filialesTableBody');
        const rows = tableBody.querySelectorAll('tr');
        for (let row of rows) {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent === codigo) {
                row.remove();
                break;
            }
        }
        delete filialData[codigo];
        if (tableBody.children.length === 0) {
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = `
                <td colspan="7" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-building"></i>
                        <p>No existen registros de filiales</p>
                        <small>Haz clic en "Crear Filial" para crear el primer registro</small>
                    </div>
                </td>
            `;
            tableBody.appendChild(noDataRow);
        }
    };
}); 

// ========================================
// FUNCIONES GLOBALES DE GESTIÓN DE CIUDADES
// ========================================

/**
 * Agrega una nueva ciudad a la tabla o actualiza una existente
 * @param {Object} ciudad - Objeto con los datos de la ciudad
 * @param {boolean} replaceIfExists - Si es true, actualiza la fila existente
 */
function addCityToTable(ciudad, replaceIfExists = false) {
    console.log('addCityToTable ejecutándose con:', ciudad);
    const tableBody = document.getElementById('ciudadesTableBody');
    console.log('tableBody encontrado:', tableBody);
    
    if (!tableBody) {
        console.error('No se encontró el elemento ciudadesTableBody');
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
        return firstCell.textContent.trim() === ciudad.codigo.trim();
    });
    
    const isActive = ciudad.activo !== false; // default true si no viene definido
    console.log('=== DEBUG HTML ===');
    console.log('Ciudad:', ciudad.codigo);
    console.log('ciudad.activo:', ciudad.activo);
    console.log('typeof ciudad.activo:', typeof ciudad.activo);
    console.log('isActive:', isActive);
    console.log('Clase que se aplicará:', isActive ? 'active' : 'inactive');
    const rowHtml = `
        <td>${ciudad.codigo}</td>
        <td>${ciudad.nombre}</td>
        <td>${ciudad.direccion || ''}</td>
        <td>${ciudad.telefono || ''}</td>
        <td>${ciudad.correo || ''}</td>
        <td>
            <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVA' : 'INACTIVA'}</span>
        </td>
        <td>
            <button class="btn btn-small" onclick="editCity('${ciudad.codigo}')" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <label class="animated-toggle" data-codigo="${ciudad.codigo}" title="${isActive ? 'Desactivar' : 'Activar'}">
                <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleCityState('${ciudad.codigo}')">
                <span class="toggle-slider"></span>
            </label>
        </td>
    `;
    
    if (existingRow && replaceIfExists) {
        // Actualizar fila existente
        console.log('Actualizando fila existente');
        existingRow.innerHTML = rowHtml;
        
        // El toggle switch ahora usa onclick directamente en el HTML
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
        
        // El toggle switch ahora usa onclick directamente en el HTML
    }
    // Si existe pero no se debe reemplazar, no hacer nada
}

/**
 * Función para eliminar una ciudad
 * @param {string} codigo - Código de la ciudad a eliminar
 */
function deleteCity(codigo) {
    // En ciudades no se elimina: mostrar modal de confirmación para activar/desactivar
    showConfirmToggleCityModal(codigo);
}

// ========================================
// FUNCIONES PARA ACTIVAR/DESACTIVAR CIUDAD
// ========================================

/**
 * Muestra el modal de confirmación para eliminar ciudad
 */
// Eliminado flujo de confirmación de borrado de ciudad

/**
 * Cancela la eliminación de la ciudad
 */
// Eliminado

/**
 * Confirma la eliminación de la ciudad
 */
// Reemplazado por toggleCityActive

/**
 * Muestra el modal de éxito para eliminar ciudad
 */
// Eliminado

/**
 * Cierra el modal de éxito para eliminar ciudad
 */
// Eliminado

/**
 * Cambia inmediatamente el estado visual del toggle y muestra modal de confirmación
 */
function toggleCityState(codigo) {
    console.log('=== TOGGLE CITY STATE INICIADO ===');
    console.log('Toggle clickeado para ciudad:', codigo);
    
    const ciudad = ciudadesData[codigo];
    if (!ciudad) {
        console.log('No se encontró la ciudad con código:', codigo);
        return;
    }
    
    console.log('Estado ANTES del cambio:', ciudad.activo);
    
    // Guardar el estado original para el modal
    const estadoOriginal = ciudad.activo;
    
    // Cambiar estado inmediatamente en memoria
    ciudad.activo = !ciudad.activo;
    
    console.log('Estado DESPUÉS del cambio:', ciudad.activo);
    
    // Buscar el toggle animado en la fila de la ciudad
    const tableRows = document.querySelectorAll('#ciudadesTableBody tr');
    let toggleElement = null;
    let toggleInput = null;
    let badgeElement = null;
    
    for (let row of tableRows) {
        const firstCell = row.querySelector('td');
        if (firstCell && firstCell.textContent.trim() === codigo) {
            toggleElement = row.querySelector('.animated-toggle');
            toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
            // Buscar el badge de manera más específica
            badgeElement = row.querySelector('span.badge');
            console.log('Fila encontrada para:', codigo);
            console.log('Badge encontrado:', badgeElement);
            break;
        }
    }
    
    console.log('Toggle animado encontrado:', toggleElement);
    
    if (toggleElement && toggleInput) {
        // Actualizar el checkbox
        toggleInput.checked = ciudad.activo;
        
        // Actualizar el título
        toggleElement.title = ciudad.activo ? 'Desactivar' : 'Activar';
        
        console.log('Toggle actualizado a:', ciudad.activo ? 'ACTIVO (verde)' : 'INACTIVO (rojo)');
        
        // Actualizar el badge de estado
        if (badgeElement) {
            console.log('Badge encontrado:', badgeElement);
            console.log('Estado de ciudad.activo:', ciudad.activo);
            if (ciudad.activo) {
                badgeElement.className = 'badge badge-success';
                badgeElement.textContent = 'ACTIVA';
                console.log('Badge cambiado a VERDE - ACTIVA');
            } else {
                badgeElement.className = 'badge badge-secondary';
                badgeElement.textContent = 'INACTIVA';
                console.log('Badge cambiado a GRIS - INACTIVA');
            }
            console.log('Badge final - Clase:', badgeElement.className, 'Texto:', badgeElement.textContent);
        } else {
            console.log('ERROR: Badge NO encontrado en la fila');
        }
    } else {
        console.log('Toggle animado NO encontrado');
    }
    
    console.log('=== TOGGLE CITY STATE COMPLETADO ===');
    
    // Mostrar modal de confirmación con el estado original
    showConfirmToggleCityModal(codigo, estadoOriginal);
}

/**
 * Muestra el modal de confirmación para activar/desactivar ciudad
 */
function showConfirmToggleCityModal(codigo, estadoOriginal) {
    const ciudad = ciudadesData[codigo];
    if (!ciudad) return;
    
    // Guardar el código de la ciudad
    window.tempToggleCityCode = codigo;
    
    const modal = document.getElementById('confirmToggleCityModal');
    if (modal) {
        // Usar el estado original para determinar la acción
        // Si estaba activo (true), la acción es "desactivar"
        // Si estaba inactivo (false), la acción es "activar"
        const actionText = estadoOriginal ? 'desactivar' : 'activar';
        const titleElement = modal.querySelector('.modal-title');
        const messageElement = modal.querySelector('.modal-message');
        
        if (titleElement) titleElement.textContent = `${actionText.toUpperCase()} CIUDAD`;
        if (messageElement) messageElement.textContent = `¿Está seguro de que desea ${actionText} la ciudad ${ciudad.nombre}?`;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela el cambio de estado de la ciudad
 */
function cancelToggleCity() {
    const codigo = window.tempToggleCityCode;
    
    if (codigo) {
        const ciudad = ciudadesData[codigo];
        if (ciudad) {
            // Revertir el cambio en memoria
            ciudad.activo = !ciudad.activo;
            
            // Buscar el toggle animado y revertir su estado visual
            const tableRows = document.querySelectorAll('#ciudadesTableBody tr');
            let toggleElement = null;
            let toggleInput = null;
            let badgeElement = null;
            
            for (let row of tableRows) {
                const firstCell = row.querySelector('td');
                if (firstCell && firstCell.textContent.trim() === codigo) {
                    toggleElement = row.querySelector('.animated-toggle');
                    toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
                    // Buscar el badge de manera más específica
                    badgeElement = row.querySelector('span.badge');
                    break;
                }
            }
            
            if (toggleElement && toggleInput) {
                // Revertir el checkbox
                toggleInput.checked = ciudad.activo;
                
                // Actualizar el título
                toggleElement.title = ciudad.activo ? 'Desactivar' : 'Activar';
                
                // Actualizar el badge de estado
                if (badgeElement) {
                    if (ciudad.activo) {
                        badgeElement.className = 'badge badge-success';
                        badgeElement.textContent = 'ACTIVA';
                    } else {
                        badgeElement.className = 'badge badge-secondary';
                        badgeElement.textContent = 'INACTIVA';
                    }
                }
            }
        }
    }
    
    const modal = document.getElementById('confirmToggleCityModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Limpiar datos temporales
    window.tempToggleCityCode = null;
}

/**
 * Confirma el cambio de estado de la ciudad
 */
function confirmToggleCity() {
    const codigo = window.tempToggleCityCode;
    
    if (codigo) {
        const ciudad = ciudadesData[codigo];
        if (ciudad) {
            // ========================================
            // 🔗 CONEXIÓN BACKEND - TOGGLE CIUDAD
            // ========================================
            // Endpoint: PUT /api/ciudades/toggle
            // Datos: { codigo, activo, timestamp }
            
            // Por ahora solo mostramos el modal de éxito
            console.log('Estado de ciudad confirmado:', ciudad.activo ? 'ACTIVA' : 'INACTIVA');
            
            // Cerrar modal de confirmación
            const confirmModal = document.getElementById('confirmToggleCityModal');
            if (confirmModal) {
                confirmModal.classList.remove('show');
            }
            
            // Mostrar modal de éxito
            showSuccessToggleCityModal();
        }
    }
    
    // Limpiar datos temporales
    window.tempToggleCityCode = null;
}

/**
 * Muestra el modal de éxito para cambiar estado de ciudad
 */
function showSuccessToggleCityModal() {
    const modal = document.getElementById('successToggleCityModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito para cambiar estado de ciudad
 */
function closeSuccessToggleCityModal() {
    const modal = document.getElementById('successToggleCityModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Activa/Desactiva una ciudad (función interna)
 */
function toggleCityActive(codigo) {
    const ciudad = ciudadesData[codigo];
    if (!ciudad) return;
    ciudad.activo = ciudad.activo === false ? true : false;
    
    // ========================================
    // 🔗 CONEXIÓN BACKEND - ACTIVAR/DESACTIVAR CIUDAD
    // ========================================
    // ✅ AQUÍ VA LA CONEXIÓN AL BACKEND
    // Endpoint: PATCH /api/cities/:codigo/estado
    // Datos a enviar: { activo }
    
    addCityToTable(ciudad, true);
}

// ========================================
// FUNCIONES PARA ELIMINAR FILIAL
// ========================================

/**
 * Función para eliminar una filial
 * @param {string} codigo - Código de la filial a eliminar
 */
function deleteFilial(codigo) {
    // Guardar el código de la filial a eliminar
    window.tempDeleteFilialCode = codigo;
    
    // Mostrar modal de confirmación
    showConfirmDeleteBranchModal();
}

/**
 * Muestra el modal de confirmación para eliminar filial
 */
function showConfirmDeleteBranchModal() {
    const modal = document.getElementById('confirmDeleteBranchModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela la eliminación de la filial
 */
function cancelDeleteBranch() {
    const modal = document.getElementById('confirmDeleteBranchModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Limpiar datos temporales
    window.tempDeleteFilialCode = null;
}

/**
 * Confirma la eliminación de la filial
 */
function confirmDeleteBranch() {
    const codigo = window.tempDeleteFilialCode;
    
    if (codigo) {
        console.log('Eliminando filial con código:', codigo);
        
        // Buscar y eliminar la fila de la tabla
        const tableBody = document.getElementById('filialesTableBody');
        const rows = tableBody.querySelectorAll('tr');
        
        for (let row of rows) {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent === codigo) {
                row.remove();
                
                // Si no quedan filiales, mostrar mensaje de "sin datos"
                if (tableBody.children.length === 0) {
                    const noDataRow = document.createElement('tr');
                    noDataRow.innerHTML = `
                        <td colspan="7" class="no-data-message">
                            <div class="no-data-content">
                                <i class="fas fa-building"></i>
                                <p>No existen registros de filiales</p>
                                <small>Haz clic en "Crear Filial" para crear el primer registro</small>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(noDataRow);
                }
                break;
            }
        }
        
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmDeleteBranchModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Mostrar modal de éxito
        showSuccessDeleteBranchModal();
        
        // Limpiar datos temporales
        window.tempDeleteFilialCode = null;
    }
}

/**
 * Muestra el modal de éxito para eliminar filial
 */
function showSuccessDeleteBranchModal() {
    const modal = document.getElementById('successDeleteBranchModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito para eliminar filial
 */
function closeSuccessDeleteBranchModal() {
    const modal = document.getElementById('successDeleteBranchModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Exponer funciones de eliminación globalmente
// Exponer funciones de activar/desactivar ciudad
window.toggleCityState = toggleCityState;
window.showConfirmToggleCityModal = showConfirmToggleCityModal;
window.cancelToggleCity = cancelToggleCity;
window.confirmToggleCity = confirmToggleCity;
window.showSuccessToggleCityModal = showSuccessToggleCityModal;
window.closeSuccessToggleCityModal = closeSuccessToggleCityModal;
window.toggleCityActive = toggleCityActive;

// Función de prueba para debuggear el toggle
window.testToggle = function(codigo) {
    console.log('=== PRUEBA DE TOGGLE ===');
    const toggleElement = document.querySelector(`[data-codigo="${codigo}"]`);
    if (toggleElement) {
        console.log('Toggle encontrado:', toggleElement);
        
        const trackElement = toggleElement.querySelector('.toggle-track');
        const indicatorElement = toggleElement.querySelector('.toggle-indicator');
        
        if (trackElement && indicatorElement) {
            console.log('Track y indicator encontrados');
            
            // Cambiar a rojo (OFF)
            trackElement.style.background = '#f44336';
            trackElement.style.setProperty('background', '#f44336', 'important');
            indicatorElement.style.left = '3px';
            indicatorElement.style.right = 'auto';
            trackElement.setAttribute('data-text', 'OFF');
            
            console.log('Cambiado a ROJO (OFF)');
            
            // Después de 2 segundos, cambiar a verde (ON)
            setTimeout(() => {
                trackElement.style.background = '#4CAF50';
                trackElement.style.setProperty('background', '#4CAF50', 'important');
                indicatorElement.style.right = '3px';
                indicatorElement.style.left = 'auto';
                trackElement.setAttribute('data-text', 'ON');
                console.log('Cambiado a VERDE (ON)');
            }, 2000);
        }
    } else {
        console.log('Toggle NO encontrado para código:', codigo);
    }
};

// Función para probar el toggle real
window.testToggleReal = function(codigo) {
    console.log('Probando toggle real para código:', codigo);
    toggleCityState(codigo);
};

// ========================================
// FUNCIONES TOGGLE PARA FILIALES
// ========================================

/**
 * Cambia inmediatamente el estado visual del toggle de filial y muestra modal de confirmación
 */
function toggleBranchState(codigo) {
    console.log('=== TOGGLE BRANCH STATE INICIADO ===');
    console.log('Toggle clickeado para filial:', codigo);
    
    const filial = filialData[codigo];
    if (!filial) {
        console.log('No se encontró la filial con código:', codigo);
        return;
    }
    
    console.log('Estado ANTES del cambio:', filial.activo);
    
    // Guardar el estado original para el modal
    const estadoOriginal = filial.activo;
    
    // Cambiar estado inmediatamente en memoria
    filial.activo = !filial.activo;
    
    console.log('Estado DESPUÉS del cambio:', filial.activo);
    
    // Buscar el toggle animado en la fila de la filial
    const tableRows = document.querySelectorAll('#filialesTableBody tr');
    let toggleElement = null;
    let toggleInput = null;
    let badgeElement = null;
    
    for (let row of tableRows) {
        const firstCell = row.querySelector('td');
        if (firstCell && firstCell.textContent.trim() === codigo) {
            toggleElement = row.querySelector('.animated-toggle');
            toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
            // Buscar el badge de manera más específica
            badgeElement = row.querySelector('span.badge');
            console.log('Fila encontrada para:', codigo);
            console.log('Badge encontrado:', badgeElement);
            break;
        }
    }
    
    console.log('Toggle animado encontrado:', toggleElement);
    
    if (toggleElement && toggleInput) {
        // Actualizar el checkbox
        toggleInput.checked = filial.activo;
        
        // Actualizar el título
        toggleElement.title = filial.activo ? 'Desactivar' : 'Activar';
        
        console.log('Toggle actualizado a:', filial.activo ? 'ACTIVO (verde)' : 'INACTIVO (rojo)');
        
        // Actualizar el badge de estado
        if (badgeElement) {
            console.log('Badge encontrado:', badgeElement);
            console.log('Estado de filial.activo:', filial.activo);
            if (filial.activo) {
                badgeElement.className = 'badge badge-success';
                badgeElement.textContent = 'ACTIVA';
                console.log('Badge cambiado a VERDE - ACTIVA');
            } else {
                badgeElement.className = 'badge badge-secondary';
                badgeElement.textContent = 'INACTIVA';
                console.log('Badge cambiado a GRIS - INACTIVA');
            }
            console.log('Badge final - Clase:', badgeElement.className, 'Texto:', badgeElement.textContent);
        } else {
            console.log('ERROR: Badge NO encontrado en la fila');
        }
    } else {
        console.log('Toggle animado NO encontrado');
    }
    
    console.log('=== TOGGLE BRANCH STATE COMPLETADO ===');
    
    // Mostrar modal de confirmación con el estado original
    showConfirmToggleBranchModal(codigo, estadoOriginal);
}
    
/**
 * Muestra el modal de confirmación para activar/desactivar filial
 */
function showConfirmToggleBranchModal(codigo, estadoOriginal) {
    const filial = filialData[codigo];
    if (!filial) return;
    
    // Guardar el código de la filial
    window.tempToggleBranchCode = codigo;
    
    const modal = document.getElementById('confirmToggleBranchModal');
    if (modal) {
        // Usar el estado original para determinar la acción
        // Si estaba activo (true), la acción es "desactivar"
        // Si estaba inactivo (false), la acción es "activar"
        const actionText = estadoOriginal ? 'desactivar' : 'activar';
        const titleElement = modal.querySelector('.modal-title');
        const messageElement = modal.querySelector('.modal-message');
        
        if (titleElement) titleElement.textContent = `${actionText.toUpperCase()} FILIAL`;
        if (messageElement) messageElement.textContent = `¿Está seguro de que desea ${actionText} la filial ${filial.nombre}?`;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}
    
/**
 * Cancela el cambio de estado de la filial
 */
function cancelToggleBranch() {
        const codigo = window.tempToggleBranchCode;
        
        if (codigo) {
            const filial = filialData[codigo];
            if (filial) {
                // Revertir el cambio en memoria
                filial.activo = !filial.activo;
                
                // Buscar el toggle animado y revertir su estado visual
                const tableRows = document.querySelectorAll('#filialesTableBody tr');
                let toggleElement = null;
                let toggleInput = null;
                let badgeElement = null;
                
                for (let row of tableRows) {
                    const firstCell = row.querySelector('td');
                    if (firstCell && firstCell.textContent.trim() === codigo) {
                        toggleElement = row.querySelector('.animated-toggle');
                        toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
                        // Buscar el badge de manera más específica
                        badgeElement = row.querySelector('span.badge');
                        break;
                    }
                }
                
                if (toggleElement && toggleInput) {
                    // Revertir el checkbox
                    toggleInput.checked = filial.activo;
                    
                    // Actualizar el título
                    toggleElement.title = filial.activo ? 'Desactivar' : 'Activar';
                    
                    // Actualizar el badge de estado
                    if (badgeElement) {
                        if (filial.activo) {
                            badgeElement.className = 'badge badge-success';
                            badgeElement.textContent = 'ACTIVA';
                        } else {
                            badgeElement.className = 'badge badge-secondary';
                            badgeElement.textContent = 'INACTIVA';
                        }
                    }
                }
            }
        }
        
        const modal = document.getElementById('confirmToggleBranchModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }
    
/**
 * Confirma el cambio de estado de la filial
 */
function confirmToggleBranch() {
    const codigo = window.tempToggleBranchCode;
    
    if (codigo) {
        const filial = filialData[codigo];
        if (filial) {
            // ========================================
            // 🔗 CONEXIÓN BACKEND - TOGGLE FILIAL
            // ========================================
            // Endpoint: PUT /api/filiales/toggle
            // Datos: { codigo, activo, timestamp }
            
            // Por ahora solo mostramos el modal de éxito
            console.log('Estado de filial confirmado:', filial.activo ? 'ACTIVA' : 'INACTIVA');
            showSuccessToggleBranchModal(codigo);
        }
    }
        
        const modal = document.getElementById('confirmToggleBranchModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }
    
/**
 * Muestra el modal de éxito para cambiar estado de filial
 */
function showSuccessToggleBranchModal(codigo) {
        const filial = filialData[codigo];
        if (!filial) return;
        
        const modal = document.getElementById('successToggleBranchModal');
        if (modal) {
            const messageElement = modal.querySelector('.modal-message');
            if (messageElement) {
                const estado = filial.activo ? 'activada' : 'desactivada';
                messageElement.textContent = `La filial ${filial.nombre} ha sido ${estado} exitosamente.`;
            }
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
/**
 * Cierra el modal de éxito para cambiar estado de filial
 */
function closeSuccessToggleBranchModal() {
    const modal = document.getElementById('successToggleBranchModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// EXPOSICIÓN DE FUNCIONES GLOBALES
// ========================================

// Funciones de ciudades
window.toggleCityState = toggleCityState;
window.cancelToggleCity = cancelToggleCity;
window.confirmToggleCity = confirmToggleCity;

// Funciones de filiales
window.toggleBranchState = toggleBranchState;
window.cancelToggleBranch = cancelToggleBranch;
window.confirmToggleBranch = confirmToggleBranch;
window.closeSuccessToggleBranchModal = closeSuccessToggleBranchModal;

// Funciones existentes
window.deleteFilial = deleteFilial;
window.showConfirmDeleteBranchModal = showConfirmDeleteBranchModal;
window.cancelDeleteBranch = cancelDeleteBranch;
window.confirmDeleteBranch = confirmDeleteBranch;
window.showSuccessDeleteBranchModal = showSuccessDeleteBranchModal;
window.closeSuccessDeleteBranchModal = closeSuccessDeleteBranchModal;