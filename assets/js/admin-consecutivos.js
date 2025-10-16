/**
 * 📊 DASHBOARD ADMINISTRATIVO - CONSECUTIVOS - GOLDEN APP
 * 
 * Este archivo contiene toda la funcionalidad JavaScript para el panel
 * administrativo de consecutivos, incluyendo CRUD, validaciones y modales.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2024
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let consecutivosData = {};
let selectedCity = null;
let currentConsecutivoId = null;

// ========================================
// INICIALIZACIÓN
// ========================================

let pendingUpdateData = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando dashboard de consecutivos...');
    
    // Mostrar modal de selección de ciudad al cargar
    showSelectCityModal();
    
    // Inicializar event listeners
    initializeEventListeners();
    
    // Cargar datos iniciales
    loadInitialData();
});

// ========================================
// EVENT LISTENERS
// ========================================

function initializeEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    // Event listeners para dropdown de usuario
    const userInfo = document.querySelector('.user-info');
    const userDropdown = document.getElementById('userDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    
    if (userInfo && userDropdown && dropdownArrow) {
        userInfo.addEventListener('click', function() {
            userDropdown.classList.toggle('show');
            dropdownArrow.classList.toggle('open');
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!userInfo.contains(e.target)) {
                userDropdown.classList.remove('show');
                dropdownArrow.classList.remove('open');
            }
        });
    }
    
    // Event listeners para botones de consecutivos
    const bCrear = document.getElementById('bCrear');
    const bCrearModal = document.getElementById('bCrearModal');
    const bActualizarConsecutivo = document.getElementById('bActualizarConsecutivo');
    
    if (bCrear) {
        bCrear.addEventListener('click', showCreateConsecutivoModal);
    }
    
    if (bCrearModal) {
        bCrearModal.addEventListener('click', handleCreateButtonClick);
    }

    if (bActualizarConsecutivo) {
        bActualizarConsecutivo.addEventListener('click', handleUpdateConsecutivo);
    }
    
    // Event listeners para modales
    const bSeleccionarCiudad = document.getElementById('bSeleccionarCiudad');
    const bBuscarConsecutivo = document.getElementById('bBuscarConsecutivo');
    
    if (bSeleccionarCiudad) {
        bSeleccionarCiudad.addEventListener('click', handleSelectCity);
    }
    
    if (bBuscarConsecutivo) {
        bBuscarConsecutivo.addEventListener('click', handleSearchConsecutivo);
    }
    
    // Event listeners para cerrar sesión
    const logoutItem = document.querySelector('.logout-item');
    if (logoutItem) {
        logoutItem.addEventListener('click', showLogoutConfirmation);
    }
    
    // Sin validación visual en tiempo real
}

// ========================================
// FUNCIONES DE CIUDAD
// ========================================

function showSelectCityModal() {
    console.log('🏙️ Mostrando modal de selección de ciudad...');
    const modal = document.getElementById('selectCityModal');
    if (modal) {
        modal.classList.add('show');
        loadCitiesForSelection();
    }
}

function hideSelectCityModal() {
    console.log('❌ Ocultando modal de selección de ciudad...');
    const modal = document.getElementById('selectCityModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function loadCitiesForSelection() {
    console.log('📋 Cargando ciudades para selección...');
    
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) return;
    
    // Cargar ciudades reales del sistema (igual que otras páginas)
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
    
    // Escuchar cambios en ciudades desde otras interfaces
    try { 
        window.addEventListener('ciudades:updated', loadCitiesForSelection); 
    } catch (e) {}
}

function handleSelectCity() {
    console.log('✅ Procesando selección de ciudad...');
    
    const citySelect = document.getElementById('citySelect');
    const selectedValue = citySelect ? citySelect.value : '';
    
    if (!selectedValue) {
        showNotification('Por favor seleccione una ciudad', 'error');
        return;
    }
    
    // Obtener nombre de la ciudad seleccionada
    const selectedOption = citySelect.options[citySelect.selectedIndex];
    const cityName = selectedOption ? selectedOption.textContent : '';
    
    selectedCity = {
        codigo: selectedValue,
        nombre: cityName
    };
    
    console.log('🏙️ Ciudad seleccionada:', selectedCity);
    
    // Actualizar indicador de ciudad actual
    updateCurrentCityDisplay(cityName);
    
    // Ocultar modal y cargar datos de consecutivos
    hideSelectCityModal();
    loadConsecutivosForCity(selectedValue);
    
    showNotification(`Ciudad seleccionada: ${cityName}`, 'success');
}

// ========================================
// FUNCIONES DE CIUDAD
// ========================================

function updateCurrentCityDisplay(cityName) {
    const currentCityElement = document.getElementById('currentCityName');
    if (currentCityElement) {
        currentCityElement.textContent = cityName;
    }
}

// ========================================
// FUNCIONES DE CONSECUTIVOS
// ========================================

function loadConsecutivosForCity(cityCode, clearData = false) {
    console.log(`📊 Cargando consecutivos para ciudad: ${cityCode}`);
    
    // Obtener nombre de la ciudad seleccionada
    let cityName = 'CIUDAD';
    if (typeof window.getCiudadesData === 'function') {
        try {
            const ciudades = window.getCiudadesData();
            if (ciudades[cityCode]) {
                cityName = ciudades[cityCode].nombre || 'CIUDAD';
            }
        } catch (e) {}
    } else {
        try {
            const raw = localStorage.getItem('ciudadesData');
            const parsed = raw ? JSON.parse(raw) : {};
            if (parsed[cityCode]) {
                cityName = parsed[cityCode].nombre || 'CIUDAD';
            }
        } catch (e) {}
    }
    
    // Solo limpiar datos si se especifica explícitamente
    if (clearData) {
        consecutivosData = [];
        try {
            localStorage.removeItem(`consecutivosData_${cityCode}`);
            console.log('🧹 Datos de consecutivos limpiados para ciudad:', cityCode);
        } catch (e) {
            console.error('Error limpiando datos:', e);
        }
    } else {
        // Cargar consecutivos desde localStorage
        try {
            const raw = localStorage.getItem(`consecutivosData_${cityCode}`);
            if (raw) {
                consecutivosData = JSON.parse(raw) || [];
                console.log('📂 Consecutivos cargados desde localStorage:', consecutivosData.length);
            } else {
                consecutivosData = [];
            }
        } catch (e) {
            consecutivosData = [];
        }
    }
    
    renderConsecutivosTable();
}

function renderConsecutivosTable() {
    console.log('📋 Renderizando tabla de consecutivos...');
    console.log('📊 Datos de consecutivos:', consecutivosData);
    console.log('📊 Tipo de datos:', typeof consecutivosData, Array.isArray(consecutivosData));
    console.log('📊 Longitud:', consecutivosData?.length);
    
    const tbody = document.getElementById('consecutivosTableBody');
    if (!tbody) return;
    
    if (!consecutivosData || consecutivosData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-list-ol"></i>
                        <p>No existen registros de consecutivos</p>
                        <small>Haz clic en "Crear" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = consecutivosData.map(consecutivo => `
        <tr>
            <td>${consecutivo.ingresoCaja}</td>
            <td>${consecutivo.ingresoBanco}</td>
            <td>${consecutivo.facturas}</td>
            <td>${consecutivo.debitoCartera}</td>
            <td>${consecutivo.creditoCartera}</td>
            <td>${consecutivo.nombre}</td>
            <td>
                <button class="btn btn-small" onclick="editConsecutivo(${consecutivo.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// FUNCIONES DE FORMULARIO
// ========================================

function handleCreateConsecutivo() {
    console.log('➕ Creando nuevo consecutivo...');
    
    // Solo validar cuando el usuario hace clic en el botón "Crear" del modal
    // No validar al abrir el modal
}

function handleCreateButtonClick() {
    console.log('🔘 Clic en botón Crear del modal...');
    
    if (!validateCreateConsecutivoForm()) {
        showNotification('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    // Mostrar modal de confirmación
    showConfirmCreateConsecutivoModal();
}

function handleUpdateConsecutivo() {
    console.log('✏️ Actualizando consecutivo...');
    
    if (!currentConsecutivoId) {
        showNotification('No hay consecutivo seleccionado para actualizar', 'error');
        return;
    }
    
    // Tomar valores solo de los campos VISIBLES para no borrar otros consecutivos
    const fieldMap = {
        uIngresoCajaInicial: 'ingresoCaja',
        uIngresoBancoInicial: 'ingresoBanco',
        uFacturasInicial: 'facturas',
        uDebitoCarteraInicial: 'debitoCartera',
        uCreditoCarteraInicial: 'creditoCartera'
    };
    const formData = {};
    Object.entries(fieldMap).forEach(([inputId, prop]) => {
        const el = document.getElementById(inputId);
        if (!el) return;
        const group = el.closest('.form-group') || el;
        const visible = (group.style.display !== 'none') && (el.offsetParent !== null);
        if (visible) {
            formData[prop] = el.value || '';
        }
    });
    // No sobrescribir con vacíos: eliminar claves con cadenas vacías
    Object.keys(formData).forEach(k => {
        if (String(formData[k]).trim() === '') {
            delete formData[k];
        }
    });
    
    // Validación: solo exigir los campos visibles (desde búsqueda se ocultan otros)
    const required = ['uIngresoCajaInicial','uIngresoBancoInicial','uFacturasInicial','uDebitoCarteraInicial','uCreditoCarteraInicial'];
    let valid = true;
    required.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const isVisible = el.offsetParent !== null && getComputedStyle(el.closest('.form-group') || el).display !== 'none';
        if (isVisible && !String(el.value || '').trim()) {
            valid = false;
        }
    });
    if (!valid) {
        showNotification('Complete los campos requeridos', 'error');
        return;
    }
    
    // Guardar temporalmente y pedir confirmación
    pendingUpdateData = formData;
    showConfirmUpdateConsecutivoModal();
}

function confirmUpdateConsecutivo() {
    if (!currentConsecutivoId || !pendingUpdateData) {
        hideConfirmUpdateConsecutivoModal();
        showNotification('No hay datos para actualizar', 'error');
        return;
    }
    
    // Actualizar en el array de datos
    const index = consecutivosData.findIndex(c => c.id === currentConsecutivoId);
    if (index !== -1) {
        consecutivosData[index] = {
            ...consecutivosData[index],
            ...pendingUpdateData
        };
        
        // Guardar en localStorage
        saveConsecutivosToStorage();
        
        renderConsecutivosTable();
        hideConfirmUpdateConsecutivoModal();
        hideUpdateConsecutivoModal();
        showSuccessUpdateConsecutivoModal();
        currentConsecutivoId = null;
        pendingUpdateData = null;
    }
}

function cancelUpdateConsecutivo() {
    console.log('❌ Cancelando actualización de consecutivo...');
    // Descartar cualquier cambio pendiente y cerrar el modal de confirmación
    pendingUpdateData = null;
    hideConfirmUpdateConsecutivoModal();
}

function handleClearForm() {
    console.log('🧹 Limpiando formulario...');
    clearForm();
    showNotification('Formulario limpiado', 'info');
}

function confirmCreateConsecutivo() {
    console.log('✅ Confirmando creación de consecutivo...');
    
    const formData = getCreateConsecutivoFormData();
    
    // Crear nuevo consecutivo
    const newConsecutivo = {
        id: Date.now(),
        ...formData,
        nombre: selectedCity ? selectedCity.nombre : 'CIUDAD'
    };
    
    consecutivosData.push(newConsecutivo);
    
    // Guardar en localStorage
    saveConsecutivosToStorage();
    
    renderConsecutivosTable();
    
    // Ocultar modal de confirmación y mostrar modal de éxito
    hideConfirmCreateConsecutivoModal();
    showSuccessCreateConsecutivoModal();
}

function cancelCreateConsecutivo() {
    console.log('❌ Cancelando creación de consecutivo...');
    hideConfirmCreateConsecutivoModal();
}

function closeSuccessConsecutivoModal() {
    console.log('✅ Cerrando modal de éxito...');
    hideSuccessCreateConsecutivoModal();
    hideCreateConsecutivoModal();
}

function getCreateConsecutivoFormData() {
    return {
        ingresoCaja: document.getElementById('tIngreso_Caja')?.value || '',
        ingresoBanco: document.getElementById('tIngreso_Banco')?.value || '',
        facturas: document.getElementById('tFactura')?.value || '',
        debitoCartera: document.getElementById('tDebito_Cartera')?.value || '',
        creditoCartera: document.getElementById('tCredito_Cartera')?.value || ''
    };
}

function getConsecutivoFormData() {
    return {
        ingresoCaja: document.getElementById('tIngresoCajaInicial')?.value || '',
        ingresoBanco: document.getElementById('tIngresoBancoInicial')?.value || '',
        facturas: document.getElementById('tFacturasInicial')?.value || '',
        debitoCartera: document.getElementById('tDebitoCarteraInicial')?.value || '',
        creditoCartera: document.getElementById('tCreditoCarteraInicial')?.value || ''
    };
}

function clearCreateForm() {
    const inputs = document.querySelectorAll('#createConsecutivoModal .form-input');
    inputs.forEach(input => {
        input.value = '';
        // Limpiar cualquier error visual
        input.classList.remove('error');
        input.style.borderColor = '';
    });
    
    // Limpiar cualquier mensaje de error
    const errorMessages = document.querySelectorAll('#createConsecutivoModal .error-message');
    errorMessages.forEach(msg => msg.remove());
}

function clearForm() {
    const inputs = document.querySelectorAll('.consecutivos-form .form-input');
    inputs.forEach(input => {
        input.value = '';
    });
}

// ========================================
// FUNCIONES DE VALIDACIÓN
// ========================================

function validateCreateConsecutivoForm() {
    console.log('✅ Validando formulario de crear consecutivo...');
    
    let isValid = true;
    const requiredFields = [
        'tIngreso_Caja',
        'tIngreso_Banco',
        'tFactura',
        'tDebito_Cartera',
        'tCredito_Cartera'
    ];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateConsecutivoForm() {
    console.log('✅ Validando formulario de consecutivo...');
    
    let isValid = true;
    const requiredFields = [
        'tIngresoCajaInicial',
        'tIngresoBancoInicial',
        'tFacturasInicial',
        'tDebitoCarteraInicial',
        'tCreditoCarteraInicial'
    ];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            showFieldError(field, 'Este campo es requerido');
            isValid = false;
        } else if (field) {
            clearFieldError(field);
        }
    });
    
    return isValid;
}

function validateField(event) {
    // Sin validación visual - solo funcional
    // Los campos siguen siendo obligatorios pero sin bordes rojos
}

function showFieldError(field, message) {
    field.classList.add('error');
    field.classList.remove('success');
    
    // No mostrar mensajes de texto, solo el estilo visual
}

function clearFieldError(field) {
    field.classList.remove('error');
    field.classList.add('success');
    
    // No hay mensajes de texto que remover
}

// ========================================
// FUNCIONES DE EDICIÓN
// ========================================

function editConsecutivo(id) {
    console.log(`✏️ Editando consecutivo con ID: ${id}`);
    
    const consecutivo = consecutivosData.find(c => c.id === id);
    if (!consecutivo) {
        showNotification('Consecutivo no encontrado', 'error');
        return;
    }
    
    currentConsecutivoId = id;
    
    // Llenar formulario del modal de actualización con datos del consecutivo
    const map = {
        uIngresoCajaInicial: consecutivo.ingresoCaja,
        uIngresoBancoInicial: consecutivo.ingresoBanco,
        uFacturasInicial: consecutivo.facturas,
        uDebitoCarteraInicial: consecutivo.debitoCartera,
        uCreditoCarteraInicial: consecutivo.creditoCartera
    };
    Object.entries(map).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    });
    // Asegurar que todos los campos estén visibles cuando se edita desde la tabla principal
    toggleUpdateFieldsVisibility(null);
    showUpdateConsecutivoModal();
}

// ========================================
// FUNCIONES DE BÚSQUEDA
// ========================================

function loadCitiesForSearch() {
    console.log('🏙️ Cargando ciudades para búsqueda...');
    
    const select = document.getElementById('searchConsecutivoCiudad');
    if (!select) {
        console.error('❌ Select de ciudades no encontrado');
        return;
    }
    
    // Usar exactamente el mismo método que loadCitiesForSelection
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
    
    const current = select.value;
    select.innerHTML = '<option value="">Seleccione la ciudad</option>';
    
    Object.values(ciudades)
        .filter(c => c.activo !== false) // Solo ciudades activas
        .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
        .forEach(c => {
            const opt = document.createElement('option');
            const code = String(c.codigo || '').toUpperCase();
            const name = String(c.nombre || '').toUpperCase();
            opt.value = c.codigo;
            opt.textContent = `${code} - ${name}`;
            select.appendChild(opt);
        });
    
    if (current && ciudades[current] && ciudades[current].activo !== false) {
        select.value = current;
    }
    
    console.log(`✅ Cargadas ${Object.values(ciudades).filter(c => c.activo !== false).length} ciudades para búsqueda`);
}

function showConsecutivoSearchModal() {
    console.log('🔍 Mostrando modal de búsqueda de consecutivo...');
    const modal = document.getElementById('consecutivoSearchModal');
    if (modal) {
        modal.classList.add('show');
        // Cargar ciudades en el desplegable de búsqueda con un pequeño delay
        setTimeout(() => {
            loadCitiesForSearch();
        }, 100);
        // Limpiar campos de búsqueda
        const ciudadSelect = document.getElementById('searchConsecutivoCiudad');
        const tipoSelect = document.getElementById('searchConsecutivoTipo');
        if (ciudadSelect) ciudadSelect.value = '';
        if (tipoSelect) tipoSelect.value = '';
    }
}

function hideConsecutivoSearchModal() {
    console.log('❌ Ocultando modal de búsqueda de consecutivo...');
    const modal = document.getElementById('consecutivoSearchModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showCreateConsecutivoModal() {
    console.log('➕ Mostrando modal de crear consecutivo...');
    const modal = document.getElementById('createConsecutivoModal');
    if (modal) {
        modal.classList.add('show');
        clearCreateForm();
    }
}

function hideCreateConsecutivoModal() {
    console.log('❌ Ocultando modal de crear consecutivo...');
    const modal = document.getElementById('createConsecutivoModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showConfirmCreateConsecutivoModal() {
    console.log('❓ Mostrando modal de confirmación de crear consecutivo...');
    const modal = document.getElementById('confirmCreateConsecutivoModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function hideConfirmCreateConsecutivoModal() {
    console.log('❌ Ocultando modal de confirmación...');
    const modal = document.getElementById('confirmCreateConsecutivoModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showSuccessCreateConsecutivoModal() {
    console.log('✅ Mostrando modal de éxito...');
    const modal = document.getElementById('successCreateConsecutivoModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function hideSuccessCreateConsecutivoModal() {
    console.log('❌ Ocultando modal de éxito...');
    const modal = document.getElementById('successCreateConsecutivoModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function handleSearchConsecutivo() {
    console.log('🔍 Buscando consecutivo...');
    
    const ciudadCodigo = document.getElementById('searchConsecutivoCiudad')?.value || '';
    const tipoConsecutivo = document.getElementById('searchConsecutivoTipo')?.value || '';
    
    if (!ciudadCodigo || !tipoConsecutivo) {
        showNotification('Por favor seleccione ciudad y tipo de consecutivo', 'error');
        return;
    }
    
    // Obtener nombre de la ciudad
    let ciudadNombre = 'CIUDAD';
    try {
        if (typeof window.getCiudadesData === 'function') {
            const ciudades = window.getCiudadesData();
            if (ciudades[ciudadCodigo]) {
                ciudadNombre = ciudades[ciudadCodigo].nombre;
            }
        } else {
            const raw = localStorage.getItem('ciudadesData');
            const ciudades = raw ? JSON.parse(raw) : {};
            if (ciudades[ciudadCodigo]) {
                ciudadNombre = ciudades[ciudadCodigo].nombre;
            }
        }
    } catch (e) {}
    
    // Cargar consecutivos de la ciudad seleccionada (sin limpiar datos)
    loadConsecutivosForCity(ciudadCodigo, false);
    
    // Filtrar por tipo de consecutivo
    let consecutivosFiltrados = [];
    if (consecutivosData.length > 0) {
        const consecutivo = consecutivosData[0]; // Solo hay uno por ciudad
        switch (tipoConsecutivo) {
            case 'ingresoCaja':
                consecutivosFiltrados = [{
                    key: 'ingresoCaja',
                    tipo: 'Ingreso a Caja',
                    inicial: consecutivo.ingresoCaja
                }];
                break;
            case 'ingresoBanco':
                consecutivosFiltrados = [{
                    key: 'ingresoBanco',
                    tipo: 'Ingreso a Bancos',
                    inicial: consecutivo.ingresoBanco
                }];
                break;
            case 'facturas':
                consecutivosFiltrados = [{
                    key: 'facturas',
                    tipo: 'Facturas',
                    inicial: consecutivo.facturas
                }];
                break;
            case 'debitoCartera':
                consecutivosFiltrados = [{
                    key: 'debitoCartera',
                    tipo: 'Notas Débito',
                    inicial: consecutivo.debitoCartera
                }];
                break;
            case 'creditoCartera':
                consecutivosFiltrados = [{
                    key: 'creditoCartera',
                    tipo: 'Notas Crédito',
                    inicial: consecutivo.creditoCartera
                }];
                break;
        }
    }
    
    if (consecutivosFiltrados.length > 0) {
        showNotification(`Consecutivos encontrados para ${ciudadNombre}`, 'success');
        renderConsecutivoResults(consecutivosFiltrados, ciudadNombre);
        hideConsecutivoSearchModal();
        showConsecutivoResultsModal();
    } else {
        showNotification('No se encontraron consecutivos para los criterios seleccionados', 'error');
    }
}
function renderConsecutivoResults(items, ciudadNombre) {
    const info = document.getElementById('consecutivoResultsInfo');
    if (info) {
        info.textContent = `Ciudad: ${ciudadNombre}`;
    }
    const tbody = document.getElementById('consecutivoResultsTableBody');
    if (!tbody) return;
    tbody.innerHTML = items.map(it => `
        <tr>
            <td>${it.tipo}</td>
            <td>${it.inicial || ''}</td>
            <td>${ciudadNombre}</td>
            <td>
                <button class="btn btn-small" onclick="editConsecutivoFromResults()">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </td>
        </tr>
    `).join('');
}

function editConsecutivoFromResults() {
    if (consecutivosData.length === 0) return;
    const consecutivo = consecutivosData[0];
    // Abrir modal de actualización SOLO con el campo del tipo buscado
    const selectedType = document.getElementById('searchConsecutivoTipo')?.value || '';
    currentConsecutivoId = consecutivo.id;
    // Limpiar todos los campos de actualización primero
    ['uIngresoCajaInicial','uIngresoBancoInicial','uFacturasInicial','uDebitoCarteraInicial','uCreditoCarteraInicial']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    // Mostrar solo el campo correspondiente
    const map = {
        ingresoCaja: { id: 'uIngresoCajaInicial', value: consecutivo.ingresoCaja },
        ingresoBanco: { id: 'uIngresoBancoInicial', value: consecutivo.ingresoBanco },
        facturas: { id: 'uFacturasInicial', value: consecutivo.facturas },
        debitoCartera: { id: 'uDebitoCarteraInicial', value: consecutivo.debitoCartera },
        creditoCartera: { id: 'uCreditoCarteraInicial', value: consecutivo.creditoCartera }
    };
    const cfg = map[selectedType];
    if (cfg) {
        const el = document.getElementById(cfg.id);
        if (el) el.value = cfg.value || '';
        // Ocultar otros grupos visualmente
        toggleUpdateFieldsVisibility(cfg.id);
        showUpdateConsecutivoModal();
        hideConsecutivoResultsModal();
    }
}

function toggleUpdateFieldsVisibility(visibleInputId) {
    // Asumimos estructura form-group directa: buscar inputs y ocultar grupos
    const inputs = [
        'uIngresoCajaInicial',
        'uIngresoBancoInicial',
        'uFacturasInicial',
        'uDebitoCarteraInicial',
        'uCreditoCarteraInicial'
    ];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            const group = input.closest('.form-group') || input.parentElement;
            if (group) {
                if (!visibleInputId) {
                    // Mostrar todos si no se especifica uno en particular
                    group.style.display = '';
                } else {
                    group.style.display = (id === visibleInputId) ? '' : 'none';
                }
            }
        }
    });
}

function showConsecutivoResultsModal() {
    const modal = document.getElementById('consecutivoResultsModal');
    if (modal) modal.classList.add('show');
}

function hideConsecutivoResultsModal() {
    const modal = document.getElementById('consecutivoResultsModal');
    if (modal) modal.classList.remove('show');
}

// ========================================
// FUNCIONES DE MODALES
// ========================================

function showUpdateConsecutivoModal() {
    console.log('📝 Mostrando modal de actualización...');
    const modal = document.getElementById('updateConsecutivoModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function hideUpdateConsecutivoModal() {
    console.log('❌ Ocultando modal de actualización...');
    const modal = document.getElementById('updateConsecutivoModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showConfirmUpdateConsecutivoModal() {
    const modal = document.getElementById('confirmUpdateConsecutivoModal');
    if (modal) modal.classList.add('show');
}

function hideConfirmUpdateConsecutivoModal() {
    const modal = document.getElementById('confirmUpdateConsecutivoModal');
    if (modal) modal.classList.remove('show');
}

function showSuccessUpdateConsecutivoModal() {
    const modal = document.getElementById('successUpdateConsecutivoModal');
    if (modal) modal.classList.add('show');
}

function closeSuccessUpdateConsecutivoModal() {
    const modal = document.getElementById('successUpdateConsecutivoModal');
    if (modal) modal.classList.remove('show');
}

// ========================================
// FUNCIONES DE NOTIFICACIONES
// ========================================

function showNotification(message, type = 'info') {
    console.log(`📢 Notificación [${type}]: ${message}`);
    
    // Remover notificación anterior si existe
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ocultar notificación después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ========================================
// FUNCIONES DE CERRAR SESIÓN
// ========================================

function showLogoutConfirmation() {
    console.log('🚪 Mostrando confirmación de cerrar sesión...');
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function cancelLogout() {
    console.log('❌ Cancelando cerrar sesión...');
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function confirmLogout() {
    console.log('✅ Confirmando cerrar sesión...');
    
    // Simular cierre de sesión
    showNotification('Cerrando sesión...', 'info');
    
    setTimeout(() => {
        // Redirigir al login
        window.location.href = '../index.html';
    }, 1500);
}

// ========================================
// FUNCIONES DE CARGA INICIAL
// ========================================

function loadInitialData() {
    console.log('📊 Cargando datos iniciales...');
    
    // Aquí se cargarían los datos iniciales del backend
    // Por ahora solo mostramos el estado inicial
    console.log('✅ Datos iniciales cargados');
}

// ========================================
// FUNCIONES DE PERSISTENCIA
// ========================================

function saveConsecutivosToStorage() {
    if (selectedCity && selectedCity.codigo) {
        try {
            localStorage.setItem(`consecutivosData_${selectedCity.codigo}`, JSON.stringify(consecutivosData));
            console.log('💾 Consecutivos guardados en localStorage');
        } catch (e) {
            console.error('❌ Error guardando consecutivos:', e);
        }
    }
}

function loadConsecutivosFromStorage(cityCode) {
    try {
        const raw = localStorage.getItem(`consecutivosData_${cityCode}`);
        if (raw) {
            return JSON.parse(raw) || [];
        }
    } catch (e) {
        console.error('❌ Error cargando consecutivos:', e);
    }
    return [];
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

function formatNumber(number) {
    return number.toString().padStart(10, '0');
}

function generateConsecutivoCode(base, current) {
    return base + formatNumber(current);
}

// ========================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ========================================

// Hacer funciones disponibles globalmente
window.showSelectCityModal = showSelectCityModal;
window.hideSelectCityModal = hideSelectCityModal;
window.showConsecutivoSearchModal = showConsecutivoSearchModal;
window.hideConsecutivoSearchModal = hideConsecutivoSearchModal;
window.showCreateConsecutivoModal = showCreateConsecutivoModal;
window.hideCreateConsecutivoModal = hideCreateConsecutivoModal;
window.showUpdateConsecutivoModal = showUpdateConsecutivoModal;
window.hideUpdateConsecutivoModal = hideUpdateConsecutivoModal;
window.editConsecutivo = editConsecutivo;
window.handleCreateButtonClick = handleCreateButtonClick;
window.confirmCreateConsecutivo = confirmCreateConsecutivo;
window.cancelCreateConsecutivo = cancelCreateConsecutivo;
window.closeSuccessConsecutivoModal = closeSuccessConsecutivoModal;
window.cancelLogout = cancelLogout;
window.confirmUpdateConsecutivo = confirmUpdateConsecutivo;
window.cancelUpdateConsecutivo = cancelUpdateConsecutivo;
window.closeSuccessUpdateConsecutivoModal = closeSuccessUpdateConsecutivoModal;
window.showConsecutivoResultsModal = showConsecutivoResultsModal;
window.hideConsecutivoResultsModal = hideConsecutivoResultsModal;
window.editConsecutivoFromResults = editConsecutivoFromResults;
window.confirmLogout = confirmLogout;

console.log('✅ Dashboard de consecutivos inicializado correctamente');
