/**
 * MÓDULO DE ADMINISTRACIÓN DE PLANES
 * 
 * Este archivo contiene toda la lógica del frontend para la gestión de planes.
 * Incluye funciones para crear, leer, actualizar y eliminar planes, así como
 * la gestión de escalas y reportes.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - CRUD completo de planes
 * - Gestión de escalas por plan
 * - Búsqueda y filtrado de planes
 * - Generación de reportes
 * - Validación de formularios
 * - Persistencia en localStorage
 * 
 * BACKEND INTEGRATION:
 * - Las funciones de API deben implementarse en el backend
 * - Endpoints requeridos: /api/planes, /api/planes/{id}, /api/planes/{id}/escalas
 * - Métodos HTTP: GET, POST, PUT, DELETE
 * - Autenticación requerida para todas las operaciones
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ========================================

// Ciudad actual (tomada de sessionStorage; sin valor por defecto)
let ciudadActual = sessionStorage.getItem('selectedCity') || '';

// Utilidad: obtener ciudad seleccionada de la sesión de forma segura
function getSelectedCity() {
    return sessionStorage.getItem('selectedCity') || '';
}

/**
 * STORE DE PLANES
 * 
 * Maneja la persistencia local de los datos de planes.
 * En producción, estos datos deben sincronizarse con el backend.
 * 
 * BACKEND INTEGRATION:
 * - GET /api/planes - Obtener todos los planes
 * - POST /api/planes - Crear nuevo plan
 * - PUT /api/planes/{id} - Actualizar plan existente
 * - DELETE /api/planes/{id} - Eliminar plan
 */
const planesStore = (() => {
    // Cargar datos existentes del localStorage
    try {
        const stored = localStorage.getItem('planesData');
        const data = stored ? JSON.parse(stored) : {};
        console.log('Datos de planes cargados:', data);
        console.log('Cantidad de planes:', Object.keys(data).length);
        
        // Verificar si los planes tienen escalas y inicializar si no las tienen
        let needsUpdate = false;
        Object.keys(data).forEach(codigo => {
            const plan = data[codigo];
            console.log(`Plan ${codigo}:`, plan);
            console.log(`¿Plan ${codigo} tiene escalas?`, !!plan.escalas);
            if (plan.escalas) {
                console.log(`Escalas del plan ${codigo}:`, plan.escalas);
            } else {
                console.log(`Inicializando escalas vacías para plan ${codigo}`);
                plan.escalas = initializeDefaultEscalas();
                needsUpdate = true;
            }
        });
        
        // Si se inicializaron escalas, guardar en localStorage
        if (needsUpdate) {
            console.log('Guardando planes con escalas inicializadas...');
            localStorage.setItem('planesData', JSON.stringify(data));
        }
        
        return data;
    } catch (e) {
        console.error('Error al cargar datos de planes:', e);
    return {};
    }
})();

// Variable global para almacenar temporalmente los datos del plan
let currentPlanData = null;

// Función para inicializar escalas por defecto
function initializeDefaultEscalas() {
    return {
        asesor: 0,
        supervisor: 0,
        subgerente: 0,
        gerente: 0,
        director: 0,
        subdirectorNacional: 0,
        directorNacional: 0
    };
}

// Función para verificar y corregir planes sin escalas
function fixPlansWithoutEscalas() {
    let needsUpdate = false;
    Object.keys(planesStore).forEach(codigo => {
        const plan = planesStore[codigo];
        if (!plan.escalas) {
            console.log(`Corrigiendo plan ${codigo} sin escalas`);
            plan.escalas = initializeDefaultEscalas();
            needsUpdate = true;
        }
    });
    
    if (needsUpdate) {
        console.log('Guardando planes corregidos...');
        persistPlanes();
    }
}

// Función de depuración para verificar el estado de las escalas
function debugEscalasStatus() {
    console.log('=== DEBUG ESCALAS STATUS ===');
    Object.keys(planesStore).forEach(codigo => {
        const plan = planesStore[codigo];
        console.log(`Plan ${codigo}:`, {
            hasEscalas: !!plan.escalas,
            escalas: plan.escalas,
            escalasType: typeof plan.escalas
        });
    });
    console.log('=== END DEBUG ===');
}

// Función para limpiar todos los planes (solo para desarrollo/testing)
function clearAllPlans() {
    console.log('=== LIMPIANDO TODOS LOS PLANES ===');
    console.log('Planes antes de limpiar:', Object.keys(planesStore).length);
    
    // Limpiar el store
    Object.keys(planesStore).forEach(codigo => {
        delete planesStore[codigo];
    });
    
    // Limpiar localStorage
    localStorage.removeItem('planesData');
    
    // Recargar tabla
    loadTable();
    
    console.log('Planes después de limpiar:', Object.keys(planesStore).length);
    console.log('=== LIMPIEZA COMPLETADA ===');
}

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
        item.addEventListener('click', function() {
            if (this.classList.contains('logout-item')) {
                // Mostrar modal de confirmación para cerrar sesión
                showConfirmLogoutModal();
            } else if (this.classList.contains('admin-users-item')) {
                // Lógica de administrar usuarios
                alert('Funcionalidad de administrar usuarios en desarrollo');
            }
        });
    });
}

/**
 * PERSISTENCIA DE DATOS
 * 
 * Guarda los datos de planes en localStorage.
 * En producción, debe enviar los datos al backend.
 * 
 * BACKEND INTEGRATION:
 * - POST /api/planes - Para planes nuevos
 * - PUT /api/planes/{id} - Para planes actualizados
 * - Manejar errores de red y reintentos
 */
function persistPlanes() {
    try { 
        console.log('Guardando planes en localStorage...');
        console.log('Store antes de guardar:', planesStore);
        
        // Verificar si el último plan tiene escalas
        const lastPlanCode = Object.keys(planesStore).pop();
        if (lastPlanCode && planesStore[lastPlanCode]) {
            console.log('Último plan guardado:', planesStore[lastPlanCode]);
            console.log('¿Tiene escalas el último plan?', !!planesStore[lastPlanCode].escalas);
            if (planesStore[lastPlanCode].escalas) {
                console.log('Escalas del último plan:', planesStore[lastPlanCode].escalas);
            } else {
                console.log('ADVERTENCIA: El último plan no tiene escalas definidas');
            }
        }
        
        const serializedData = JSON.stringify(planesStore);
        console.log('Datos serializados para localStorage:', serializedData);
        localStorage.setItem('planesData', serializedData);
        console.log('Datos de planes guardados en localStorage');
        console.log('Cantidad de planes guardados:', Object.keys(planesStore).length);
        
        // Verificar inmediatamente después de guardar
        const retrievedData = localStorage.getItem('planesData');
        const parsedData = JSON.parse(retrievedData);
        console.log('Datos recuperados inmediatamente:', parsedData);
        if (parsedData[lastPlanCode]) {
            console.log('¿El plan recuperado tiene escalas?', !!parsedData[lastPlanCode].escalas);
            if (parsedData[lastPlanCode].escalas) {
                console.log('Escalas del plan recuperado:', parsedData[lastPlanCode].escalas);
            }
        }
    } catch (e) {
        console.error('Error al guardar datos de planes:', e);
    }
}

// ========================================
// GESTIÓN DE MODALES
// ========================================

/**
 * MODALES DE CONFIRMACIÓN
 * 
 * Maneja los modales de confirmación para cerrar sesión y operaciones críticas.
 * 
 * BACKEND INTEGRATION:
 * - POST /api/auth/logout - Para cerrar sesión
 * - Validar token de autenticación antes de cerrar
 */

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
    window.location.href = '../index.html';
}

function getNextPlanCode() {
    const codes = Object.keys(planesStore).map(c => parseInt(c, 10)).filter(n => !isNaN(n));
    const max = codes.length ? Math.max(...codes) : 0;
    return String(max + 1).padStart(3, '0');
}

function renderRow(plan, replace = false) {
    const tbody = document.getElementById('planesTableBody');
    if (!tbody) return;
    const noData = tbody.querySelector('.no-data-message');
    if (noData) noData.parentElement && noData.parentElement.parentElement && noData.parentElement.parentElement.remove();

    const existing = Array.from(tbody.querySelectorAll('tr')).find(r => r.firstElementChild && r.firstElementChild.textContent.trim() === plan.codigo);
    const rowHtml = `
        <td>${plan.codigo}</td>
        <td>${plan.nombre}</td>
        <td>$${Number(plan.valorPlan).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>$${Number(plan.cuotaInicial).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${plan.numCuotas}</td>
        <td>$${Number(plan.mensualidad).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${plan.activo !== false ? 'ACTIVO' : 'INACTIVO'}</td>
        <td>
            <div class="btn-container">
                <button class="btn btn-small" onclick="editPlan('${plan.codigo}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            <label class="animated-toggle" data-codigo="${plan.codigo}" title="${plan.activo !== false ? 'Desactivar' : 'Activar'}">
                <input type="checkbox" ${plan.activo !== false ? 'checked' : ''} onchange="togglePlanState('${plan.codigo}')">
                <span class="toggle-slider"></span>
            </label>
        </td>`;
    if (existing && replace) {
        existing.innerHTML = rowHtml;
    } else if (!existing) {
        const tr = document.createElement('tr');
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    }
}

function loadTable() {
    const tbody = document.getElementById('planesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const values = Object.values(planesStore);
    if (values.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="no-data-message"><div class="no-data-content"><i class="fas fa-file-invoice-dollar no-data-icon"></i><p>No existen registros de planes</p><small>Haz clic en \"Crear Plan\" para crear el primer registro</small></div></td></tr>`;
        return;
    }
    values.sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo))).forEach(p => renderRow(p, false));
}

function showPlanSearchModal() { const m = document.getElementById('planSearchModal'); if (m) { m.classList.add('show'); document.body.style.overflow='hidden'; } }
/**
 * MODALES DE PLANES
 * 
 * Gestiona la apertura y cierre de modales para operaciones de planes.
 * Incluye validación de formularios y preparación de datos.
 * 
 * BACKEND INTEGRATION:
 * - GET /api/planes/search - Para búsqueda de planes
 * - POST /api/planes - Para crear nuevos planes
 * - PUT /api/planes/{id} - Para actualizar planes existentes
 */

function hidePlanSearchModal() { 
    const m = document.getElementById('planSearchModal'); 
    if (m) { 
        m.classList.remove('show'); 
        document.body.style.overflow='auto'; 
    } 
}

/**
 * MODAL DE CREAR PLAN
 * 
 * Abre el modal para crear un nuevo plan.
 * Resetea el formulario y configura los campos por defecto.
 * 
 * BACKEND INTEGRATION:
 * - Preparar datos para POST /api/planes
 * - Validar campos obligatorios antes de enviar
 */
function showCreatePlanModal() {
    const m = document.getElementById('createPlanModal');
    if (m) {
        m.classList.add('show');
        document.body.style.overflow='hidden';
        
        // Solo limpiar variables globales si no estamos editando
        console.log('showCreatePlanModal - currentEditPlanCode:', window.currentEditPlanCode);
        if (!window.currentEditPlanCode) {
            currentPlanData = null;
            console.log('Limpiando currentPlanData porque no se está editando');
        } else {
            console.log('Manteniendo currentEditPlanCode porque se está editando');
        }
        
        // reset form
        document.getElementById('tNombre').value = '';
        document.getElementById('tValor').value = '';
        document.getElementById('tCuota_Inicial').value = '';
        document.getElementById('tCuotas').value = '';
        document.getElementById('tMensualidad').value = '';
        document.getElementById('tFecha_Inicial').value = '';
        document.getElementById('tMeses_Asesoria').value = '';
        document.getElementById('tUsuarios').value = '';
        document.getElementById('tLibros').value = '';
        setPlanActivo('SI'); // Reset to SI
        document.getElementById('pObservaciones').value = '';
        document.getElementById('createPlanTitle').textContent = 'CREAR PLAN';
        document.getElementById('bCrear').textContent = 'Siguiente';
        document.getElementById('bCrear').style.display = 'inline-block';
        document.getElementById('bActualizar').style.display = 'none';
    }
}
function hideCreatePlanModal() { const m = document.getElementById('createPlanModal'); if (m) { m.classList.remove('show'); document.body.style.overflow='auto'; } }
function hidePlanResultsModal() { const m = document.getElementById('planResultsModal'); if (m) { m.classList.remove('show'); document.body.style.overflow='auto'; } }

/**
 * CREAR O ACTUALIZAR PLAN
 * 
 * Función principal que maneja la creación y actualización de planes.
 * Valida los datos del formulario y prepara la estructura del plan.
 * 
 * BACKEND INTEGRATION:
 * - POST /api/planes - Para crear nuevos planes
 * - PUT /api/planes/{id} - Para actualizar planes existentes
 * - Validar datos en el backend antes de guardar
 * - Manejar errores de validación y red
 */
function createOrUpdateFromForm() {
    // Determinar si es creación o actualización
    const isUpdate = window.currentEditPlanCode;
    const codigo = isUpdate ? window.currentEditPlanCode : getNextPlanCode();
    
    console.log('=== CREATE OR UPDATE FROM FORM ===');
    console.log('¿Es actualización?', isUpdate);
    console.log('Código del plan:', codigo);
    console.log('currentEditPlanCode:', window.currentEditPlanCode);
    console.log('Tipo de isUpdate:', typeof isUpdate);
    console.log('¿isUpdate es truthy?', !!isUpdate);
    
    const nombre = document.getElementById('tNombre').value.trim();
    const valorPlan = parseFloat(cleanNumber(document.getElementById('tValor').value || '0'));
    const cuotaInicial = parseFloat(cleanNumber(document.getElementById('tCuota_Inicial').value || '0'));
    const numCuotas = parseInt(document.getElementById('tCuotas').value || '0', 10);
    const mensualidad = parseFloat(cleanNumber(document.getElementById('tMensualidad').value || '0'));
    
    const fechaInicial = document.getElementById('tFecha_Inicial').value;
    const mesesAsesoria = parseInt(document.getElementById('tMeses_Asesoria').value || '0', 10);
    const usuariosAplican = parseInt(document.getElementById('tUsuarios').value || '0', 10);
    const numLibros = parseInt(document.getElementById('tLibros').value || '0', 10);
    const activo = document.getElementById('cActivo').value === 'SI';
    const observaciones = document.getElementById('pObservaciones').value.trim();
    
    if (!nombre || valorPlan <= 0 || cuotaInicial <= 0 || numCuotas < 0 || mensualidad <= 0 || !fechaInicial || usuariosAplican <= 0) { 
        alert('Complete todos los campos obligatorios'); 
        return;
    }
    
    const plan = { 
        codigo, 
        nombre, 
        valorPlan, 
        cuotaInicial, 
        numCuotas, 
        mensualidad, 
        fechaInicial,
        mesesAsesoria,
        usuariosAplican,
        numLibros,
        activo,
        observaciones
    };
    
    if (isUpdate) {
        // Para actualización, solo actualizar los datos básicos del plan
        // Las escalas se actualizarán en el modal de escalas
        const existingPlan = planesStore[codigo];
        console.log('Plan existente antes de actualizar:', existingPlan);
        console.log('Escalas existentes antes de actualizar:', existingPlan.escalas);
        
        const updatedPlan = {
            ...plan,
            escalas: existingPlan.escalas || initializeDefaultEscalas() // Preservar las escalas existentes
        };
        
        console.log('Plan actualizado con escalas preservadas:', updatedPlan);
        console.log('¿El plan actualizado tiene escalas?', !!updatedPlan.escalas);
        
        planesStore[codigo] = updatedPlan;
        persistPlanes();
        renderRow(updatedPlan, true);
        console.log('Plan actualizado:', updatedPlan);
        console.log('Escalas preservadas:', updatedPlan.escalas);
        
        // Para actualización, continuar al modal de escalas
        return true; // Continuar al modal de escalas
    } else {
        // Guardar temporalmente los datos del plan (no guardar en store aún)
        currentPlanData = plan;
        console.log('Datos del plan guardados temporalmente:', currentPlanData);
        console.log('currentPlanData guardado correctamente:', !!currentPlanData);
    }
    
    return true;
}

// Función para manejar el toggle del estado activo
function setPlanActivo(value) {
    const hiddenInput = document.getElementById('cActivo');
    const yesButton = document.querySelector('#createPlanModal .btn-toggle-yes');
    const noButton = document.querySelector('#createPlanModal .btn-toggle-no');
    
    if (hiddenInput) {
        hiddenInput.value = value;
    }
    
    if (yesButton && noButton) {
        if (value === 'SI') {
            yesButton.classList.add('active');
            noButton.classList.remove('active');
        } else {
            yesButton.classList.remove('active');
            noButton.classList.add('active');
        }
    }
    
    // Re-vincular el event listener del botón Siguiente después del cambio
    reattachSiguienteButton();
}

// Función para re-vincular el botón Siguiente
function reattachSiguienteButton() {
    const bSiguiente = document.getElementById('bCrear');
    if (bSiguiente) {
        // Remover event listeners existentes
        const newButton = bSiguiente.cloneNode(true);
        bSiguiente.parentNode.replaceChild(newButton, bSiguiente);
        
        // Agregar nuevo event listener
        newButton.addEventListener('click', function() {
            console.log('Botón Siguiente clickeado después de cambio de estado');
            const result = createOrUpdateFromForm();
            
            if (result && !window.currentEditPlanCode) {
                // Para creación, ir a escalas
                hideCreatePlanModal();
                showPlanEscalasModal();
            } else if (result && window.currentEditPlanCode) {
                // Para actualización, ir a escalas con datos existentes
                hideCreatePlanModal();
                console.log('Abriendo modal de escalas para edición...');
                loadExistingEscalas(window.currentEditPlanCode);
                const modal = document.getElementById('planEscalasModal');
                if (modal) {
                    modal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    }
}

// Función para formatear números con comas (pesos colombianos)
function formatNumberWithCommas(value) {
    // Si está vacío, devolver vacío
    if (!value || value.trim() === '') return '';
    
    // Remover comas existentes y caracteres no numéricos excepto punto
    let cleanValue = value.replace(/[^\d.]/g, '');
    
    // Si hay múltiples puntos, mantener solo el último
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
        cleanValue = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }
    
    // Si no hay números, devolver vacío
    if (!cleanValue || cleanValue === '.') return '';
    
    // Separar parte entera y decimal
    const [integerPart, decimalPart] = cleanValue.split('.');
    
    // Si no hay parte entera, devolver solo el punto si existe
    if (!integerPart || integerPart === '') {
        return decimalPart !== undefined ? '.' + decimalPart : '';
    }
    
    // Formatear parte entera con comas (cada 3 dígitos)
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Reconstruir el número
    return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

// Función global para formatear números enteros con comas
function formatearNumero(valor) {
    // Si está vacío, devolver vacío
    if (!valor || valor.trim() === '') return '';
    
    // Remover comas existentes y caracteres no numéricos
    let cleanValue = valor.replace(/[^\d]/g, '');
    
    // Si no hay números, devolver vacío
    if (!cleanValue) return '';
    
    // Limitar a 20 dígitos
    cleanValue = cleanValue.substring(0, 20);
    
    // Formatear con comas cada 3 dígitos (de derecha a izquierda)
    const formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return formattedValue;
}

// Función para limpiar número (remover comas para cálculos)
function cleanNumber(value) {
    if (!value) return '0';
    // Remover comas y espacios
    return value.toString().replace(/[,\s]/g, '');
}

// Función para validar meses de asesoría (1-12)
function validateMesesAsesoria(value) {
    const num = parseInt(value);
    return num >= 1 && num <= 12;
}

document.addEventListener('DOMContentLoaded', () => {
    // Siempre mostrar selección de ciudad al entrar
    console.log('Mostrando modal de selección de ciudad');
    // showSelectPlanModal(); // Comentado para eliminar el aviso automático
    
    // Corregir planes existentes sin escalas
    fixPlansWithoutEscalas();
    
    loadTable();
    
    // ========================================
    // FUNCIONALIDAD DEL SELECT DE CIUDADES
    // ========================================
    
    // Funcionalidad del select de ciudades en Planes
    const planSelect = document.getElementById('cId_Ciudad');
    
    /**
     * Pobla el select de ciudades con datos actualizados
     * Se sincroniza con los datos de ciudades desde otras interfaces
     */
    function populatePlanCitySelect() {
        if (!planSelect) return;
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
        const current = planSelect.value;
        planSelect.innerHTML = '<option value="">Seleccione la ciudad</option>';
        Object.values(ciudades)
            .filter(c => c.activo !== false) // Solo ciudades activas
            .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
            .forEach(c => {
                const opt = document.createElement('option');
                const code = String(c.codigo || '').toUpperCase();
                const name = String(c.nombre || '').toUpperCase();
                opt.value = c.codigo;
                opt.textContent = `${code} - ${name}`;
                planSelect.appendChild(opt);
            });
        if (current && ciudades[current] && ciudades[current].activo !== false) planSelect.value = current;
    }
    
    if (planSelect) {
        populatePlanCitySelect();
        // Suscribirse a cambios en ciudades desde otras interfaces
        try { window.addEventListener('ciudades:updated', populatePlanCitySelect); } catch (e) {}
    }
    
    // Funcionalidad del botón seleccionar ciudad
    const bSeleccionarPlan = document.getElementById('bSeleccionarPlan');
    if (bSeleccionarPlan) {
        bSeleccionarPlan.addEventListener('click', function() {
            const selectedCity = document.getElementById('cId_Ciudad').value;
            if (selectedCity) {
                console.log('Ciudad seleccionada:', selectedCity);
                try { sessionStorage.setItem('selectedCity', selectedCity); } catch (e) {}
                try { showNotification('Ciudad seleccionada: ' + selectedCity, 'success'); } catch (e) {}
                hideSelectPlanModal();
                // Actualizar la variable global
                ciudadActual = selectedCity;
            } else {
                try { showNotification('Por favor, seleccione una ciudad', 'warning'); } catch (e) { alert('Por favor, seleccione una ciudad'); }
            }
        });
    }
    
    // Cerrar modal de selección de ciudad al hacer clic fuera
    const selectPlanModal = document.getElementById('selectPlanModal');
    if (selectPlanModal) {
        selectPlanModal.addEventListener('click', function(e) {
            if (e.target === selectPlanModal) {
                hideSelectPlanModal();
            }
        });
    }
    // Header buttons
    const bBuscar = document.getElementById('bBuscarPlan');
    const bCrear = document.getElementById('bCrearPlan');
    if (bBuscar) bBuscar.addEventListener('click', showPlanSearchModal);
    if (bCrear) bCrear.addEventListener('click', showCreatePlanModal);
    
    
    // Event listeners para campos de precio con formateo correcto
    const priceFields = ['pValorPlan', 'pCuotaInicial', 'pMensualidad'];
    priceFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Evento al escribir
            field.addEventListener("input", (e) => {
                let cursor = e.target.selectionStart;
                let valorOriginal = e.target.value;

                // Formatear
                let valorFormateado = formatearNumero(valorOriginal);

                e.target.value = valorFormateado;

                // Mantener cursor al final
                e.target.setSelectionRange(e.target.value.length, e.target.value.length);
            });

            // Manejo de pegado controlado
            field.addEventListener("paste", (e) => {
                e.preventDefault();
                let textoPegado = (e.clipboardData || window.clipboardData).getData("text");
                let limpio = textoPegado.replace(/\D/g, "").substring(0, 20);
                field.value = formatearNumero(limpio);
            });
        }
    });
    
    // Event listener para forzar mayúsculas en Nombre del Plan
    const nombreField = document.getElementById('pNombre');
    if (nombreField) {
        nombreField.addEventListener('input', function() {
            // Convertir a mayúsculas en tiempo real
            this.value = this.value.toUpperCase();
        });
    }
    
    // Event listener para meses de asesoría
    const mesesField = document.getElementById('pMesesAsesoria');
    if (mesesField) {
        mesesField.addEventListener('input', function() {
            // Solo permitir números
            this.value = this.value.replace(/[^\d]/g, '');
            
            // Validar rango 1-12
            const num = parseInt(this.value);
            if (num > 12) {
                this.value = '12';
            }
        });
    }
    
    // Event listener para # Cuotas (solo números)
    const cuotasField = document.getElementById('pNumCuotas');
    if (cuotasField) {
        cuotasField.addEventListener('input', function() {
            this.value = this.value.replace(/[^\d]/g, '');
        });
    }

    // Modals
    const bBuscarModal = document.getElementById('bBuscar');
    console.log('Botón de buscar encontrado:', !!bBuscarModal);
    if (bBuscarModal) {
        console.log('Agregando event listener al botón de buscar');
        bBuscarModal.addEventListener('click', () => {
            console.log('Botón de buscar clickeado');
            const searchTerm = (document.getElementById('searchPlanCodigo').value || '').trim().toLowerCase();
            console.log('Término de búsqueda:', searchTerm);
            const resBody = document.getElementById('planSearchResultsBody');
            console.log('Cuerpo de resultados encontrado:', !!resBody);
            if (!resBody) return;
            resBody.innerHTML = '';
        
        if (!searchTerm) {
            resBody.innerHTML = `<tr><td colspan="9" class="no-data-message"><div class=\"no-data-content\"><p>Ingrese un término de búsqueda</p></div></td></tr>`;
            hidePlanSearchModal();
            const mr = document.getElementById('planResultsModal'); if (mr) { mr.classList.add('show'); document.body.style.overflow='hidden'; }
            return;
        }
        
        // Buscar por palabras clave en el nombre del plan
        const results = Object.values(planesStore).filter(plan => 
            plan.nombre.toLowerCase().includes(searchTerm)
        );
        
        if (results.length === 0) {
            resBody.innerHTML = `<tr><td colspan="9" class="no-data-message"><div class=\"no-data-content\"><p>No se encontraron resultados para "${searchTerm}"</p></div></td></tr>`;
        } else {
            results.forEach(plan => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${plan.codigo}</td>
                    <td>${plan.nombre}</td>
                    <td>$${Number(plan.valorPlan).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>$${Number(plan.cuotaInicial).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${plan.numCuotas}</td>
                    <td>$${Number(plan.mensualidad).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${plan.activo !== false ? 'ACTIVO' : 'INACTIVO'}</td>
                    <td>
                        <div class="options-cell">
                            <div class="buttons-row">
                                <button class="btn btn-sm btn-warning btn-action btn-view" onclick="viewPlan('${plan.codigo}')" title="Ver detalles">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-warning btn-action btn-edit" onclick="editPlan('${plan.codigo}')" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                            <div class="toggle-container">
                                <label class="animated-toggle" data-codigo="${plan.codigo}" title="${plan.activo !== false ? 'Desactivar' : 'Activar'}">
                                    <input type="checkbox" ${plan.activo !== false ? 'checked' : ''} onchange="togglePlanStatusFromTable('${plan.codigo}', this)">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </td>`;
                resBody.appendChild(tr);
            });
        }
        hidePlanSearchModal();
        const mr = document.getElementById('planResultsModal'); if (mr) { mr.classList.add('show'); document.body.style.overflow='hidden'; }
        });
    } else {
        console.error('Botón de buscar no encontrado');
    }

    const bSiguiente = document.getElementById('bCrear');
    if (bSiguiente) {
        bSiguiente.addEventListener('click', function() {
            const result = createOrUpdateFromForm();
            
            if (result && !window.currentEditPlanCode) {
                // Para creación, ir a escalas
                hideCreatePlanModal();
                showPlanEscalasModal();
            } else if (result && window.currentEditPlanCode) {
                // Para actualización, ir a escalas con datos existentes
                hideCreatePlanModal();
                console.log('Abriendo modal de escalas para edición...');
                loadExistingEscalas(window.currentEditPlanCode);
                const modal = document.getElementById('planEscalasModal');
                if (modal) {
                    modal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    }
    
    // Los botones de editar ahora usan onclick directamente en el HTML
    // No necesitamos event listeners adicionales

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

    // Mostrar modal de selección de ciudad al cargar la página (simulando login)
    // Esto mostrará el modal automáticamente cuando se cargue la página
    // Mostrar SIEMPRE el selector de ciudad al cargar esta interfaz
    // setTimeout(() => { try { forceShowSelectPlanModal(); } catch (e) { try { showSelectPlanModal(); } catch (e2) {} } }, 500); // Comentado para eliminar el aviso automático

});

/**
 * GESTIÓN DE ESCALAS
 * 
 * Maneja la creación y actualización de escalas para cada plan.
 * Las escalas definen los porcentajes de comisión por nivel jerárquico.
 * 
 * BACKEND INTEGRATION:
 * - POST /api/planes/{id}/escalas - Para crear escalas de un plan
 * - PUT /api/planes/{id}/escalas - Para actualizar escalas existentes
 * - GET /api/planes/{id}/escalas - Para obtener escalas de un plan
 * - Validar que la suma de escalas no exceda el 100%
 */
function showPlanEscalasModal() {
    const modal = document.getElementById('planEscalasModal');
    if (modal) {
        // Determinar si es creación o actualización
        const isUpdate = window.currentEditPlanCode;
        
        // Configurar textos según el tipo de operación
        const titleElement = document.getElementById('planEscalasTitle');
        const buttonElement = document.getElementById('bCrearEscalasSubmit');
        
        if (isUpdate) {
            // Para actualización
            if (titleElement) {
                titleElement.textContent = 'ACTUALIZAR ESCALAS';
            }
            if (buttonElement) {
                buttonElement.textContent = 'Actualizar Plan';
            }
        } else {
            // Para creación
            if (titleElement) {
                titleElement.textContent = 'CREAR ESCALAS';
            }
            if (buttonElement) {
                buttonElement.textContent = 'Crear Plan';
            }
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Generar el formulario de escalas dinámicamente
        generatePlanEscalasForm();
        
        // Si es creación, no cargar escalas existentes
        if (!isUpdate) {
            console.log('Creando nuevo plan - no cargando escalas existentes');
        }
    }
}

function hidePlanEscalasModal() {
    const modal = document.getElementById('planEscalasModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function volverAPlan() {
    // Cerrar modal de escalas
    hidePlanEscalasModal();
    
    // Mostrar modal de plan
    const planModal = document.getElementById('createPlanModal');
    if (planModal) {
        planModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Carga las escalas existentes de un plan en el modal
 */
function loadExistingEscalas(codigo) {
    console.log('=== LOADING EXISTING ESCALAS ===');
    console.log('Código recibido:', codigo);
    console.log('currentEditPlanCode:', window.currentEditPlanCode);
    
    // Si no se proporciona código, usar el código de edición actual
    const planCode = codigo || window.currentEditPlanCode;
    if (!planCode) {
        console.log('No se proporcionó código de plan - no cargando escalas existentes');
        return;
    }
    
    const plan = planesStore[planCode];
    console.log('Código del plan:', planCode);
    console.log('Plan encontrado:', plan);
    console.log('Escalas del plan:', plan?.escalas);
    console.log('¿Tiene escalas?', !!plan?.escalas);
    console.log('Tipo de escalas:', typeof plan?.escalas);
    console.log('Claves del plan:', Object.keys(plan || {}));
    console.log('Valor directo de escalas:', plan.escalas);
    console.log('¿Es undefined?', plan.escalas === undefined);
    console.log('¿Es null?', plan.escalas === null);
    console.log('¿Es objeto?', typeof plan.escalas === 'object');
    
    if (!plan) {
        console.log('ERROR: No se encontró el plan con código:', planCode);
        return;
    }
    
    if (!plan.escalas) {
        console.log('ADVERTENCIA: El plan no tiene escalas guardadas:', planCode);
        // Inicializar escalas vacías si no existen
        plan.escalas = initializeDefaultEscalas();
        console.log('Escalas inicializadas con valores por defecto');
    }
    
    console.log('Cargando escalas existentes:', plan.escalas);
    
    // Cambiar título y botón para actualización
    const titleElement = document.getElementById('planEscalasTitle');
    const buttonElement = document.getElementById('bCrearEscalasSubmit');
    
    // Verificar si se está editando basándose en si se proporcionó código
    const isEditing = !!planCode;
    console.log('¿Se está editando?', isEditing);
    console.log('currentEditPlanCode:', window.currentEditPlanCode);
    
    if (isEditing) {
        if (titleElement) {
            titleElement.textContent = 'ACTUALIZAR ESCALAS';
            console.log('Título cambiado a ACTUALIZAR ESCALAS');
        }
        
        if (buttonElement) {
            buttonElement.textContent = 'Actualizar Plan';
            console.log('Botón cambiado a Actualizar Plan');
        }
    } else {
        // Para creación, mantener los textos originales
        if (titleElement) {
            titleElement.textContent = 'CREAR ESCALAS';
            console.log('Título mantenido como CREAR ESCALAS');
        }
        
        if (buttonElement) {
            buttonElement.textContent = 'Crear Plan';
            console.log('Botón mantenido como Crear Plan');
        }
    }
    
    // Generar el formulario primero
    console.log('Generando formulario de escalas...');
    generatePlanEscalasForm();
    console.log('Formulario generado, esperando para llenar campos...');
    
    // Llenar los campos con los datos existentes
    setTimeout(() => {
        console.log('Iniciando llenado de campos...');
        if (!plan.escalas) {
            console.log('No hay escalas para cargar, mostrando formulario vacío con valores por defecto');
            // No retornar, continuar para mostrar el formulario vacío
        }
        const escalas = plan.escalas || {};
        console.log('Llenando campos de escalas:', escalas);
        console.log('Valores individuales:', {
            asesor: escalas.asesor,
            supervisor: escalas.supervisor,
            subgerente: escalas.subgerente,
            gerente: escalas.gerente,
            director: escalas.director,
            subdirectorNacional: escalas.subdirectorNacional,
            directorNacional: escalas.directorNacional
        });
        
        const asesorField = document.getElementById('asesor');
        const supervisorField = document.getElementById('supervisor');
        const subgerenteField = document.getElementById('subgerente');
        const gerenteField = document.getElementById('gerente');
        const directorField = document.getElementById('director');
        const subdirectorNacionalField = document.getElementById('subdirectorNacional');
        const directorNacionalField = document.getElementById('directorNacional');
        
        console.log('Campos encontrados:', {
            asesor: !!asesorField,
            supervisor: !!supervisorField,
            subgerente: !!subgerenteField,
            gerente: !!gerenteField,
            director: !!directorField,
            subdirectorNacional: !!subdirectorNacionalField,
            directorNacional: !!directorNacionalField
        });
        
        // Cargar valores con logging detallado
        const asesorValue = escalas.asesor !== undefined && escalas.asesor !== null ? escalas.asesor : 0;
        if (asesorField) {
            const formattedValue = formatNumberWithCommas(asesorValue.toString());
            asesorField.value = formattedValue;
            console.log('Asesor cargado:', asesorValue, '→', formattedValue);
        } else {
            console.log('Campo Asesor no encontrado');
        }
        
        const supervisorValue = escalas.supervisor !== undefined && escalas.supervisor !== null ? escalas.supervisor : 0;
        if (supervisorField) {
            const formattedValue = formatNumberWithCommas(supervisorValue.toString());
            supervisorField.value = formattedValue;
            console.log('Supervisor cargado:', supervisorValue, '→', formattedValue);
        } else {
            console.log('Campo Supervisor no encontrado');
        }
        
        const subgerenteValue = escalas.subgerente !== undefined && escalas.subgerente !== null ? escalas.subgerente : 0;
        if (subgerenteField) {
            const formattedValue = formatNumberWithCommas(subgerenteValue.toString());
            subgerenteField.value = formattedValue;
            console.log('Subgerente cargado:', subgerenteValue, '→', formattedValue);
        } else {
            console.log('Campo Subgerente no encontrado');
        }
        
        const gerenteValue = escalas.gerente !== undefined && escalas.gerente !== null ? escalas.gerente : 0;
        if (gerenteField) {
            const formattedValue = formatNumberWithCommas(gerenteValue.toString());
            gerenteField.value = formattedValue;
            console.log('Gerente cargado:', gerenteValue, '→', formattedValue);
        } else {
            console.log('Campo Gerente no encontrado');
        }
        
        const directorValue = escalas.director !== undefined && escalas.director !== null ? escalas.director : 0;
        if (directorField) {
            const formattedValue = formatNumberWithCommas(directorValue.toString());
            directorField.value = formattedValue;
            console.log('Director cargado:', directorValue, '→', formattedValue);
        } else {
            console.log('Campo Director no encontrado');
        }
        
        const subdirectorNacionalValue = escalas.subdirectorNacional !== undefined && escalas.subdirectorNacional !== null ? escalas.subdirectorNacional : 0;
        if (subdirectorNacionalField) {
            const formattedValue = formatNumberWithCommas(subdirectorNacionalValue.toString());
            subdirectorNacionalField.value = formattedValue;
            console.log('Subdirector Nacional cargado:', subdirectorNacionalValue, '→', formattedValue);
        } else {
            console.log('Campo Subdirector Nacional no encontrado');
        }
        
        const directorNacionalValue = escalas.directorNacional !== undefined && escalas.directorNacional !== null ? escalas.directorNacional : 0;
        if (directorNacionalField) {
            const formattedValue = formatNumberWithCommas(directorNacionalValue.toString());
            directorNacionalField.value = formattedValue;
            console.log('Director Nacional cargado:', directorNacionalValue, '→', formattedValue);
        } else {
            console.log('Campo Director Nacional no encontrado');
        }
    }, 100);
}

/**
 * Genera el formulario de escalas dinámicamente
 */
function generatePlanEscalasForm() {
    const formContent = document.getElementById('planEscalasFormContent');
    if (!formContent) return;
    
    // Formulario con los campos específicos de escalas organizacionales (layout de 2 columnas)
    formContent.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label for="asesor" class="form-label">Asesor <span style="color: red;">*</span></label>
                <div class="price-input-container">
                    <span class="currency-symbol">$</span>
                    <input type="text" id="asesor" name="tAsesor" class="form-input price-field required" placeholder="0" maxlength="20" required>
                </div>
            </div>
            <div class="form-group">
                <label for="supervisor" class="form-label">Supervisor <span style="color: red;">*</span></label>
                <div class="price-input-container">
                    <span class="currency-symbol">$</span>
                    <input type="text" id="supervisor" name="tSupervisor" class="form-input price-field required" placeholder="0" maxlength="20" required>
                </div>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="subgerente" class="form-label">Subgerente <span style="color: red;">*</span></label>
                <div class="price-input-container">
                    <span class="currency-symbol">$</span>
                    <input type="text" id="subgerente" name="tSubgerente" class="form-input price-field required" placeholder="0" maxlength="20" required>
                </div>
            </div>
            <div class="form-group">
                <label for="gerente" class="form-label">Gerente <span style="color: red;">*</span></label>
                <div class="price-input-container">
                    <span class="currency-symbol">$</span>
                    <input type="text" id="gerente" name="tGerente" class="form-input price-field required" placeholder="0" maxlength="20" required>
                </div>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="director" class="form-label">Director <span style="color: red;">*</span></label>
                <div class="price-input-container">
                    <span class="currency-symbol">$</span>
                    <input type="text" id="director" name="tDirector" class="form-input price-field required" placeholder="0" maxlength="20" required>
                </div>
            </div>
            <div class="form-group">
                <label for="subdirectorNacional" class="form-label">Subdirector Nacional <span style="color: red;">*</span></label>
                <div class="price-input-container">
                    <span class="currency-symbol">$</span>
                    <input type="text" id="subdirectorNacional" name="tSubdirectorNacional" class="form-input price-field required" placeholder="0" maxlength="20" required>
                </div>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="directorNacional" class="form-label">Director Nacional <span style="color: red;">*</span></label>
                <div class="price-input-container">
                    <span class="currency-symbol">$</span>
                    <input type="text" id="directorNacional" name="tDirectorNacional" class="form-input price-field required" placeholder="0" maxlength="20" required>
                </div>
            </div>
            <div class="form-group">
                <!-- Campo vacío para mantener el layout -->
            </div>
        </div>
    `;
    
    // Aplicar formateo automático a los campos de escalas
    setTimeout(() => {
        const escalasFields = ['asesor', 'supervisor', 'subgerente', 'gerente', 'director', 'subdirectorNacional', 'directorNacional'];
        escalasFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Solo llenar con 0 si es actualización, no si es creación
                const isUpdate = window.currentEditPlanCode;
                if (!isUpdate) {
                    // Para creación, dejar campos vacíos
                    field.value = '';
                }
                
                // Evento al escribir
                field.addEventListener("input", (e) => {
                    let cursor = e.target.selectionStart;
                    let valorOriginal = e.target.value;

                    // Formatear
                    let valorFormateado = formatearNumero(valorOriginal);

                    e.target.value = valorFormateado;

                    // Mantener cursor al final
                    e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                });

                // Manejo de pegado controlado
                field.addEventListener("paste", (e) => {
                    e.preventDefault();
                    let textoPegado = (e.clipboardData || window.clipboardData).getData("text");
                    let limpio = textoPegado.replace(/\D/g, "").substring(0, 20);
                    field.value = formatearNumero(limpio);
                });
            }
        });
    }, 100);
}

/**
 * Muestra el modal de confirmación para crear plan y escalas
 */
function showConfirmCreatePlanModal() {
    const modal = document.getElementById('confirmCreatePlanEscalasModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Muestra el modal de confirmación para actualizar plan y escalas
 */
function showConfirmUpdatePlanModal() {
    const modal = document.getElementById('confirmUpdatePlanEscalasModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela la creación de plan y escalas
 */
function cancelCreatePlanEscalas() {
    const modal = document.getElementById('confirmCreatePlanEscalasModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Cancela la actualización de plan y escalas
 */
function cancelUpdatePlanEscalas() {
    const modal = document.getElementById('confirmUpdatePlanEscalasModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Confirma la creación de plan y escalas
 */
function confirmCreatePlanEscalas() {
    // Cerrar modal de confirmación
    cancelCreatePlanEscalas();
    
    // Ejecutar la lógica de creación
    handleCreatePlanEscalas();
}

/**
 * Confirma la actualización de plan y escalas
 */
function confirmUpdatePlanEscalas() {
    // Cerrar modal de confirmación
    cancelUpdatePlanEscalas();
    
    // Ejecutar la lógica de actualización
    handleUpdatePlanEscalas();
}

/**
 * Maneja el envío del formulario de escalas (creación o actualización)
 */
function handleEscalasSubmit() {
    const isUpdate = window.currentEditPlanCode;
    console.log('=== HANDLE ESCALAS SUBMIT ===');
    console.log('¿Es actualización?', isUpdate);
    
    if (isUpdate) {
        // Para actualización, mostrar modal de confirmación
        showConfirmUpdatePlanModal();
    } else {
        // Para creación, mostrar modal de confirmación
        showConfirmCreatePlanModal();
    }
}

/**
 * Maneja la actualización de escalas cuando se edita un plan
 */
function handleUpdatePlanEscalas() {
    // Recopilar datos de escalas (valores numéricos)
    const escalasData = {
        asesor: parseFloat(cleanNumber(document.getElementById('asesor').value || '0')),
        supervisor: parseFloat(cleanNumber(document.getElementById('supervisor').value || '0')),
        subgerente: parseFloat(cleanNumber(document.getElementById('subgerente').value || '0')),
        gerente: parseFloat(cleanNumber(document.getElementById('gerente').value || '0')),
        director: parseFloat(cleanNumber(document.getElementById('director').value || '0')),
        subdirectorNacional: parseFloat(cleanNumber(document.getElementById('subdirectorNacional').value || '0')),
        directorNacional: parseFloat(cleanNumber(document.getElementById('directorNacional').value || '0'))
    };
    
    // VALIDAR CAMPOS DE ESCALAS OBLIGATORIOS
    const camposEscalas = [
        { campo: 'asesor', nombre: 'Asesor', valor: escalasData.asesor },
        { campo: 'supervisor', nombre: 'Supervisor', valor: escalasData.supervisor },
        { campo: 'subgerente', nombre: 'Subgerente', valor: escalasData.subgerente },
        { campo: 'gerente', nombre: 'Gerente', valor: escalasData.gerente },
        { campo: 'director', nombre: 'Director', valor: escalasData.director },
        { campo: 'subdirectorNacional', nombre: 'Subdirector Nacional', valor: escalasData.subdirectorNacional },
        { campo: 'directorNacional', nombre: 'Director Nacional', valor: escalasData.directorNacional }
    ];
    
    // Verificar que todos los campos de escalas tengan valores válidos
    const camposInvalidos = [];
    camposEscalas.forEach(({ campo, nombre, valor }) => {
        if (isNaN(valor) || valor < 0) {
            camposInvalidos.push(nombre);
        }
    });
    
    // Si hay campos inválidos, mostrar error y no continuar
    if (camposInvalidos.length > 0) {
        const mensaje = `Los siguientes campos de escalas tienen valores inválidos:\n${camposInvalidos.join(', ')}`;
        alert(mensaje);
        return; // No continuar con la actualización
    }
    
    console.log('=== ACTUALIZANDO ESCALAS ===');
    console.log('Código del plan:', window.currentEditPlanCode);
    console.log('Escalas a actualizar:', escalasData);
    
    // Actualizar escalas del plan existente
    const existingPlan = planesStore[window.currentEditPlanCode];
    if (existingPlan) {
        existingPlan.escalas = escalasData;
        planesStore[window.currentEditPlanCode] = existingPlan;
        console.log('Escalas actualizadas:', existingPlan.escalas);
        
        // Persistir cambios
        persistPlanes();
        
        // Cerrar modal y mostrar mensaje de éxito
        hidePlanEscalasModal();
        showSuccessUpdatePlanEscalasModal();
        
        // Recargar tabla principal
        loadTable();
        
        // Actualizar tabla de resultados si está abierta
        const resultsModal = document.getElementById('planResultsModal');
        if (resultsModal && resultsModal.classList.contains('show')) {
            // Cerrar modal de resultados
            resultsModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Reabrir modal de resultados con datos actualizados
            setTimeout(() => {
                const searchTerm = document.getElementById('searchPlanCodigo').value || '';
                if (searchTerm.trim()) {
                    // Simular búsqueda para actualizar resultados
                    const searchBtn = document.getElementById('bBuscar');
                    if (searchBtn) {
                        searchBtn.click();
                    }
                }
            }, 100);
        }
        
        // Limpiar variable de edición
        window.currentEditPlanCode = null;
    } else {
        console.error('No se encontró el plan para actualizar');
        alert('Error: No se encontró el plan para actualizar');
    }
}

/**
 * Muestra el modal de éxito para plan y escalas creados
 */
function showSuccessCreatePlanEscalasModal() {
    const modal = document.getElementById('successCreatePlanEscalasModal');
    if (modal) {
        // Cambiar texto según si es creación o actualización
        const isUpdate = window.currentEditPlanCode;
        const titleElement = modal.querySelector('.modal-title');
        const messageElement = modal.querySelector('.modal-message');
        
        if (isUpdate) {
            if (titleElement) titleElement.textContent = '¡Actualizado!';
            if (messageElement) messageElement.textContent = 'Plan y escalas actualizados exitosamente';
        } else {
            if (titleElement) titleElement.textContent = '¡Éxito!';
            if (messageElement) messageElement.textContent = 'Plan y escalas creados exitosamente';
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito para plan y escalas creados
 */
function closeSuccessCreatePlanEscalasModal() {
    const modal = document.getElementById('successCreatePlanEscalasModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Muestra el modal de éxito para plan y escalas actualizados
 */
function showSuccessUpdatePlanEscalasModal() {
    const modal = document.getElementById('successUpdatePlanEscalasModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito para plan y escalas actualizados
 */
function closeSuccessUpdatePlanEscalasModal() {
    const modal = document.getElementById('successUpdatePlanEscalasModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Cambia inmediatamente el estado visual del toggle y muestra modal de confirmación
 */
function togglePlanState(codigo) {
    const plan = planesStore[codigo];
    if (!plan) {
        console.log('No se encontró el plan con código:', codigo);
        return;
    }
    
    const estadoOriginal = plan.activo !== false;
    console.log('Estado original del plan:', estadoOriginal);
    
    // Cambiar estado en memoria
    plan.activo = !estadoOriginal;
    console.log('Nuevo estado del plan:', plan.activo);
    
    // Guardar el código del plan para el modal
    window.currentTogglePlanCode = codigo;
    window.currentTogglePlanOriginalState = estadoOriginal;
    
    // Mostrar modal de confirmación
    showConfirmTogglePlanModal();
}

/**
 * Muestra el modal de confirmación para cambiar estado del plan
 */
function showConfirmTogglePlanModal() {
    const modal = document.getElementById('confirmTogglePlanModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela el cambio de estado del plan
 */
function cancelTogglePlan() {
    const modal = document.getElementById('confirmTogglePlanModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Revertir el estado visual
    if (window.currentTogglePlanCode && window.currentTogglePlanOriginalState !== undefined) {
        const plan = planesStore[window.currentTogglePlanCode];
        if (plan) {
            plan.activo = window.currentTogglePlanOriginalState;
            loadTable(); // Recargar tabla para mostrar el estado correcto
        }
    }
}

/**
 * Confirma el cambio de estado del plan
 */
function confirmTogglePlan() {
    console.log('=== CONFIRMANDO CAMBIO DE ESTADO ===');
    console.log('Código del plan:', window.currentTogglePlanCode);
    console.log('Estado actual del plan:', planesStore[window.currentTogglePlanCode]?.activo);
    
    // Cambiar el estado del plan
    const plan = planesStore[window.currentTogglePlanCode];
    if (plan) {
        plan.activo = !window.currentTogglePlanOriginalState;
        console.log('Estado cambiado a:', plan.activo);
    }
    
    // Cerrar modal
    const modal = document.getElementById('confirmTogglePlanModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Persistir cambios
    persistPlanes();
    console.log('Cambios persistidos en localStorage');
    
    // Recargar tabla principal
    loadTable();
    console.log('Tabla principal recargada');
    
    // Actualizar tabla de resultados si está abierta
    const resultsModal = document.getElementById('planResultsModal');
    if (resultsModal && resultsModal.classList.contains('show')) {
        // Cerrar modal de resultados
        resultsModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reabrir modal de resultados con datos actualizados
        setTimeout(() => {
            const searchTerm = document.getElementById('searchPlanCodigo').value || '';
            if (searchTerm.trim()) {
                // Simular búsqueda para actualizar resultados
                const searchBtn = document.getElementById('bBuscar');
                if (searchBtn) {
                    searchBtn.click();
                }
            }
        }, 100);
    }
    
    // Mostrar modal de éxito
    showSuccessTogglePlanModal();
    
    console.log('Estado del plan cambiado exitosamente');
    console.log('Plan actualizado:', planesStore[window.currentTogglePlanCode]);
}

/**
 * Cancela el cambio de estado del plan
 */
function cancelTogglePlan() {
    console.log('=== CANCELANDO CAMBIO DE ESTADO ===');
    
    // Revertir el estado del plan
    const plan = planesStore[window.currentTogglePlanCode];
    if (plan) {
        plan.activo = window.currentTogglePlanOriginalState;
        console.log('Estado revertido a:', plan.activo);
    }
    
    // Cerrar modal
    const modal = document.getElementById('confirmTogglePlanModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Recargar tabla principal para mostrar el estado correcto
    loadTable();
    
    // Actualizar tabla de resultados si está abierta
    const resultsModal = document.getElementById('planResultsModal');
    if (resultsModal && resultsModal.classList.contains('show')) {
        // Cerrar modal de resultados
        resultsModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reabrir modal de resultados con datos actualizados
        setTimeout(() => {
            const searchTerm = document.getElementById('searchPlanCodigo').value || '';
            if (searchTerm.trim()) {
                // Simular búsqueda para actualizar resultados
                const searchBtn = document.getElementById('bBuscar');
                if (searchBtn) {
                    searchBtn.click();
                }
            }
        }, 100);
    }
    
    console.log('Cambio de estado cancelado');
}

/**
 * Muestra el modal de éxito para cambio de estado del plan
 */
function showSuccessTogglePlanModal() {
    const modal = document.getElementById('successTogglePlanModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito para cambio de estado del plan
 */
function closeSuccessTogglePlanModal() {
    const modal = document.getElementById('successTogglePlanModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Muestra los detalles de un plan en un modal
 */
function viewPlan(codigo) {
    console.log('=== FUNCIÓN VIEWPLAN LLAMADA ===');
    console.log('Código recibido:', codigo);
    
    const plan = planesStore[codigo];
    if (!plan) {
        console.log('No se encontró el plan con código:', codigo);
        alert('No se encontró el plan con código: ' + codigo);
        return;
    }
    
    console.log('Mostrando detalles del plan:', plan);
    
    // Mostrar modal de detalles
    showPlanDetailsModal(plan);
}

/**
 * Muestra el modal con los detalles del plan
 */
function showPlanDetailsModal(plan) {
    const modal = document.getElementById('planDetailsModal');
    if (!modal) {
        console.error('Modal de detalles no encontrado');
        return;
    }
    
    // Guardar el código del plan para el toggle
    window.currentViewPlanCode = plan.codigo;
    
    // Llenar los datos del plan
    document.getElementById('detailCodigo').textContent = plan.codigo;
    document.getElementById('detailNombre').textContent = plan.nombre;
    document.getElementById('detailValorPlan').textContent = `$${Number(plan.valorPlan).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailCuotaInicial').textContent = `$${Number(plan.cuotaInicial).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailNumCuotas').textContent = plan.numCuotas;
    document.getElementById('detailMensualidad').textContent = `$${Number(plan.mensualidad).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailFechaInicial').textContent = plan.fechaInicial;
    document.getElementById('detailMesesAsesoria').textContent = plan.mesesAsesoria;
    document.getElementById('detailUsuariosAplican').textContent = plan.usuariosAplican;
    document.getElementById('detailNumLibros').textContent = plan.numLibros;
    document.getElementById('detailActivo').textContent = plan.activo !== false ? 'ACTIVO' : 'INACTIVO';
    document.getElementById('detailObservaciones').textContent = plan.observaciones || 'Sin observaciones';
    
    // El estado se muestra solo como información
    
    // Llenar las escalas
    const escalas = plan.escalas || {};
    document.getElementById('detailAsesor').textContent = `$${Number(escalas.asesor || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailSupervisor').textContent = `$${Number(escalas.supervisor || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailSubgerente').textContent = `$${Number(escalas.subgerente || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailGerente').textContent = `$${Number(escalas.gerente || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailDirector').textContent = `$${Number(escalas.director || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailSubdirectorNacional').textContent = `$${Number(escalas.subdirectorNacional || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('detailDirectorNacional').textContent = `$${Number(escalas.directorNacional || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // Mostrar el modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de detalles del plan
 */
function hidePlanDetailsModal() {
    const modal = document.getElementById('planDetailsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}


/**
 * Toggle del estado del plan desde la tabla de resultados
 */
function togglePlanStatusFromTable(codigo, inputElement) {
    const plan = planesStore[codigo];
    if (!plan) {
        console.error('Plan no encontrado:', codigo);
        return;
    }
    
    // Guardar el código del plan para el modal
    window.currentTogglePlanCode = codigo;
    window.currentTogglePlanOriginalState = plan.activo !== false;
    
    // Mostrar modal de confirmación
    showConfirmTogglePlanModal();
}

/**
 * Muestra el modal de reporte de planes
 */
function showReportePlanesModal() {
    const modal = document.getElementById('reportePlanesModal');
    if (modal) {
        // Cargar ciudades en el select
        cargarCiudadesEnReporte();
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Carga las ciudades en el select del reporte
 */
function cargarCiudadesEnReporte() {
    const selectCiudad = document.getElementById('reporteCiudad');
    if (!selectCiudad) return;
    
    // Limpiar opciones existentes
    selectCiudad.innerHTML = '<option value="">Seleccione la ciudad</option>';
    
    // Obtener ciudades del localStorage
    try {
        const ciudadesData = localStorage.getItem('ciudadesData');
        if (ciudadesData) {
            const ciudades = JSON.parse(ciudadesData);
            Object.values(ciudades).forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad.nombre;
                option.textContent = ciudad.nombre.toUpperCase();
                selectCiudad.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
}

/**
 * Oculta el modal de reporte de planes
 */
function hideReportePlanesModal() {
    const modal = document.getElementById('reportePlanesModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Maneja la generación del reporte de planes
 */
/**
 * GENERACIÓN DE REPORTES
 * 
 * Maneja la generación de reportes de planes por ciudad.
 * Permite exportar los datos en diferentes formatos.
 * 
 * BACKEND INTEGRATION:
 * - GET /api/planes/reporte?ciudad={ciudad} - Para obtener datos del reporte
 * - GET /api/planes/export/excel?ciudad={ciudad} - Para exportar a Excel
 * - GET /api/planes/export/pdf?ciudad={ciudad} - Para exportar a PDF
 * - GET /api/planes/export/word?ciudad={ciudad} - Para exportar a Word
 */
function handleGenerarReportePlanes() {
    const ciudad = document.getElementById('reporteCiudad').value;
    
    // Validar campo obligatorio
    if (!ciudad) {
        alert('Por favor seleccione una ciudad');
        return;
    }
    
    console.log('=== GENERANDO REPORTE DE PLANES ===');
    console.log('Ciudad:', ciudad);
    
    // Obtener todos los planes (no hay filtro por ciudad en los datos de planes)
    const planesFiltrados = Object.values(planesStore);
    
    console.log('Total de planes:', planesFiltrados.length);
    
    // Redirigir al archivo HTML del reporte con parámetros
    const reportUrl = `../pages/reporte-planes.html?ciudad=${encodeURIComponent(ciudad)}`;
    window.open(reportUrl, '_blank');
    
    // Cerrar modal
    hideReportePlanesModal();
}

/**
 * Genera el reporte de planes
 */
function generarReportePlanes(planes, ciudad) {
    // Crear contenido del reporte con el mismo formato que empleados
    let contenido = `
        <html>
        <head>
            <title>Reporte de Planes</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background-color: #f5f5f5;
                    color: #333;
                }
                .header {
                    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                .header h1 {
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .header p {
                    font-size: 16px;
                    opacity: 0.9;
                }
                .controls {
                    background: white;
                    padding: 15px 20px;
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .pagination {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .pagination button {
                    background: #6c5ce7;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .pagination button:hover {
                    background: #5a4fcf;
                }
                .pagination input {
                    width: 50px;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    text-align: center;
                }
                .search-controls {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .search-input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    width: 200px;
                }
                .export-buttons {
                    display: flex;
                    gap: 10px;
                }
                .export-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .export-excel { background: #28a745; }
                .export-word { background: #007bff; }
                .export-pdf { background: #dc3545; }
                .export-btn:hover { opacity: 0.9; }
                .table-container {
                    background: white;
                    margin: 20px;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .table th {
                    background: #f8f9fa;
                    color: #495057;
                    padding: 15px 12px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid #dee2e6;
                }
                .table td {
                    padding: 12px;
                    border-bottom: 1px solid #dee2e6;
                }
                .table tr:hover {
                    background-color: #f8f9fa;
                }
                .footer {
                    text-align: center;
                    padding: 20px;
                    color: #6c757d;
                    background: white;
                    margin: 20px;
                    border-radius: 8px;
                }
                .info-icon {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #17a2b8;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>REPORTE DE PLANES ${ciudad.toUpperCase()}</h1>
                <p>Ciudad: ${ciudad} — Total de Planes: ${planes.length}</p>
            </div>
            
            <div class="controls">
                <div class="pagination">
                    <button onclick="goToFirst()">«</button>
                    <button onclick="goToPrevious()"><</button>
                    <input type="number" value="1" min="1" max="1" id="currentPage">
                    <span>de 1</span>
                    <button onclick="goToNext()">></button>
                    <button onclick="goToLast()">»</button>
                </div>
                
                <div class="search-controls">
                    <input type="text" class="search-input" placeholder="Buscar..." id="searchInput">
                    <select class="search-input">
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <input type="text" class="search-input" placeholder="Filtrar..." id="filterInput">
                </div>
                
                <div class="export-buttons">
                    <button class="export-btn export-excel" onclick="exportToExcel()">
                        📊 Excel
                    </button>
                    <button class="export-btn export-word" onclick="exportToWord()">
                        📝 Word
                    </button>
                    <button class="export-btn export-pdf" onclick="exportToPDF()">
                        📄 PDF
                    </button>
                </div>
            </div>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre del Plan</th>
                            <th>Valor Total</th>
                            <th>Cuota Inicial</th>
                            <th># Cuotas</th>
                            <th>Mensualidad</th>
                            <th>Estado</th>
                            <th>Fecha Inicial</th>
                        </tr>
                    </thead>
                    <tbody id="reportTableBody">
    `;
    
    // Agregar filas de datos
    planes.forEach(plan => {
        contenido += `
            <tr>
                <td>${plan.codigo}</td>
                <td>${plan.nombre}</td>
                <td>$${Number(plan.valorPlan).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${Number(plan.cuotaInicial).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>${plan.numCuotas}</td>
                <td>$${Number(plan.mensualidad).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>${plan.activo !== false ? 'ACTIVO' : 'INACTIVO'}</td>
                <td>${plan.fechaInicial}</td>
            </tr>
        `;
    });
    
    contenido += `
                    </tbody>
                </table>
            </div>
            
            <div class="footer">
                <p>© 2025 - GOLDEN APP</p>
            </div>
            
            <div class="info-icon" title="Información del reporte">i</div>
            
            <script>
                // Funciones de paginación
                function goToFirst() { document.getElementById('currentPage').value = 1; }
                function goToPrevious() { 
                    const current = parseInt(document.getElementById('currentPage').value);
                    if (current > 1) document.getElementById('currentPage').value = current - 1;
                }
                function goToNext() { 
                    const current = parseInt(document.getElementById('currentPage').value);
                    const max = 1; // Solo una página por ahora
                    if (current < max) document.getElementById('currentPage').value = current + 1;
                }
                function goToLast() { document.getElementById('currentPage').value = 1; }
                
                // Funciones de exportación
                function exportToExcel() {
                    alert('Exportar a Excel - Funcionalidad en desarrollo');
                }
                function exportToWord() {
                    alert('Exportar a Word - Funcionalidad en desarrollo');
                }
                function exportToPDF() {
                    window.print();
                }
                
                // Búsqueda en tiempo real
                document.getElementById('searchInput').addEventListener('input', function(e) {
                    const searchTerm = e.target.value.toLowerCase();
                    const rows = document.querySelectorAll('#reportTableBody tr');
                    rows.forEach(row => {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    });
                });
            </script>
        </body>
        </html>
    `;
    
    // Abrir reporte en nueva ventana
    const ventanaReporte = window.open('', '_blank');
    ventanaReporte.document.write(contenido);
    ventanaReporte.document.close();
    
    console.log('Reporte generado exitosamente');
}

/**
 * Edita un plan existente
 * Carga los datos del plan en el formulario para su modificación
 */
function editPlan(codigo) {
    console.log('=== FUNCIÓN EDITPLAN LLAMADA ===');
    console.log('Código recibido:', codigo);
    console.log('Planes disponibles:', Object.keys(planesStore));
    
    const plan = planesStore[codigo];
    if (!plan) {
        console.log('No se encontró el plan con código:', codigo);
        alert('No se encontró el plan con código: ' + codigo);
        return;
    }
    
    console.log('Editando plan:', plan);
    console.log('Abriendo modal de edición...');
    
    // Guardar el código del plan para la actualización ANTES de abrir el modal
    window.currentEditPlanCode = codigo;
    console.log('Código del plan guardado para edición:', window.currentEditPlanCode);
    console.log('Tipo de currentEditPlanCode:', typeof window.currentEditPlanCode);
    console.log('¿currentEditPlanCode es truthy?', !!window.currentEditPlanCode);
    
    // Mostrar el modal PRIMERO
    console.log('Llamando showCreatePlanModal...');
    showCreatePlanModal();
    console.log('Modal debería estar abierto ahora');
    
    // Esperar un momento para que el modal se abra y luego llenar los campos
    setTimeout(() => {
        console.log('Llenando campos del formulario...');
        
        // Llenar los campos con los datos del plan
        const codigoField = document.getElementById('pCodigo');
        const nombreField = document.getElementById('tNombre');
        const valorPlanField = document.getElementById('tValor');
        const cuotaInicialField = document.getElementById('tCuota_Inicial');
        const numCuotasField = document.getElementById('tCuotas');
        const mensualidadField = document.getElementById('tMensualidad');
        const fechaInicialField = document.getElementById('tFecha_Inicial');
        const mesesAsesoriaField = document.getElementById('tMeses_Asesoria');
        const usuariosAplicanField = document.getElementById('tUsuarios');
        const numLibrosField = document.getElementById('tLibros');
        const observacionesField = document.getElementById('pObservaciones');
        const activoField = document.getElementById('cActivo');
        
        if (codigoField) codigoField.value = plan.codigo;
        if (nombreField) nombreField.value = plan.nombre;
        if (valorPlanField) valorPlanField.value = formatNumberWithCommas(plan.valorPlan.toString());
        if (cuotaInicialField) cuotaInicialField.value = formatNumberWithCommas(plan.cuotaInicial.toString());
        if (numCuotasField) numCuotasField.value = plan.numCuotas;
        if (mensualidadField) mensualidadField.value = formatNumberWithCommas(plan.mensualidad.toString());
        if (fechaInicialField) fechaInicialField.value = plan.fechaInicial;
        if (mesesAsesoriaField) mesesAsesoriaField.value = plan.mesesAsesoria;
        if (usuariosAplicanField) usuariosAplicanField.value = plan.usuariosAplican;
        if (numLibrosField) numLibrosField.value = plan.numLibros;
        if (observacionesField) observacionesField.value = plan.observaciones || '';
        
        // Establecer el estado activo
        if (activoField) {
            if (plan.activo !== false) {
                activoField.value = 'SI';
                setPlanActivo('SI');
            } else {
                activoField.value = 'NO';
                setPlanActivo('NO');
            }
        }
        
        // Cambiar el título del modal
        const titleElement = document.getElementById('createPlanTitle');
        const buttonElement = document.getElementById('bCrear');
        if (titleElement) titleElement.textContent = 'ACTUALIZAR PLAN';
        if (buttonElement) buttonElement.textContent = 'Siguiente';
        
        console.log('Campos llenados correctamente');
        
        // Para edición, NO abrir automáticamente el modal de escalas
        // El usuario debe hacer clic en "Siguiente" para ir a escalas
        console.log('Plan cargado para edición. El usuario debe hacer clic en "Siguiente" para ir a escalas.');
    }, 100);
}

// ========================================
// FUNCIONES GLOBALES
// ========================================
window.editPlan = editPlan;
window.debugEscalasStatus = debugEscalasStatus;
window.fixPlansWithoutEscalas = fixPlansWithoutEscalas;
window.handleEscalasSubmit = handleEscalasSubmit;
window.showConfirmUpdatePlanModal = showConfirmUpdatePlanModal;
window.cancelUpdatePlanEscalas = cancelUpdatePlanEscalas;
window.confirmUpdatePlanEscalas = confirmUpdatePlanEscalas;
window.showSuccessUpdatePlanEscalasModal = showSuccessUpdatePlanEscalasModal;
window.closeSuccessUpdatePlanEscalasModal = closeSuccessUpdatePlanEscalasModal;
window.clearAllPlans = clearAllPlans;
window.viewPlan = viewPlan;
window.showPlanDetailsModal = showPlanDetailsModal;
window.hidePlanDetailsModal = hidePlanDetailsModal;

// Función de test directo
window.testEditPlan = function(codigo = '001') {
    console.log('=== TESTING EDIT PLAN DIRECTLY ===');
    console.log('Llamando editPlan con código:', codigo);
    editPlan(codigo);
};

// Función para probar si editPlan está disponible
window.testEditPlanFunction = function() {
    console.log('=== TESTING EDITPLAN FUNCTION ===');
    console.log('editPlan function exists:', typeof editPlan);
    console.log('window.editPlan exists:', typeof window.editPlan);
    
    if (typeof editPlan === 'function') {
        console.log('editPlan is a function, testing with code 001');
        try {
            editPlan('001');
        } catch (error) {
            console.error('Error calling editPlan:', error);
        }
    } else {
        console.error('editPlan is not a function!');
    }
};

// Función de test para verificar que el botón funciona
window.testEditButton = function() {
    console.log('=== TESTING EDIT BUTTON ===');
    
    // Crear un plan de prueba si no existe
    if (Object.keys(planesStore).length === 0) {
        const testPlan = {
            codigo: '001',
            nombre: 'PLAN DE PRUEBA',
            valorPlan: 1000000,
            cuotaInicial: 100000,
            numCuotas: 12,
            mensualidad: 75000,
            fechaInicial: '2024-01-01',
            mesesAsesoria: 6,
            usuariosAplican: 10,
            numLibros: 5,
            activo: true,
            observaciones: 'Plan de prueba'
        };
        planesStore['001'] = testPlan;
            persistPlanes();
            loadTable();
        console.log('Plan de prueba creado');
    }
    
    // Verificar que la tabla existe
    const table = document.querySelector('.plans-section .data-table .table');
    console.log('Tabla encontrada:', table);
    
    // Verificar que hay botones de editar
    const editButtons = document.querySelectorAll('button[onclick*="editPlan"]');
    console.log('Botones de editar encontrados:', editButtons.length);
    
    if (editButtons.length > 0) {
        console.log('Primer botón:', editButtons[0]);
        console.log('Onclick del primer botón:', editButtons[0].getAttribute('onclick'));
        console.log('Clases del botón:', editButtons[0].className);
        
        // Probar la función directamente
        console.log('Probando función editPlan directamente...');
        testEditPlan('001');
    }
};

// Función para verificar el estado actual
window.checkButtonState = function() {
    console.log('=== CHECKING BUTTON STATE ===');
    const editButtons = document.querySelectorAll('button[onclick*="editPlan"]');
    console.log('Total botones encontrados:', editButtons.length);
    
    editButtons.forEach((btn, index) => {
        console.log(`Botón ${index + 1}:`, {
            element: btn,
            classes: btn.className,
            onclick: btn.getAttribute('onclick'),
            innerHTML: btn.innerHTML
        });
    });
};

function handleCreatePlanEscalas() {
    // Recopilar datos de escalas (valores numéricos)
    const escalasData = {
        asesor: parseFloat(cleanNumber(document.getElementById('asesor').value || '0')),
        supervisor: parseFloat(cleanNumber(document.getElementById('supervisor').value || '0')),
        subgerente: parseFloat(cleanNumber(document.getElementById('subgerente').value || '0')),
        gerente: parseFloat(cleanNumber(document.getElementById('gerente').value || '0')),
        director: parseFloat(cleanNumber(document.getElementById('director').value || '0')),
        subdirectorNacional: parseFloat(cleanNumber(document.getElementById('subdirectorNacional').value || '0')),
        directorNacional: parseFloat(cleanNumber(document.getElementById('directorNacional').value || '0'))
    };
    
    // VALIDAR CAMPOS DE ESCALAS OBLIGATORIOS
    const camposEscalas = [
        { campo: 'asesor', nombre: 'Asesor', valor: escalasData.asesor },
        { campo: 'supervisor', nombre: 'Supervisor', valor: escalasData.supervisor },
        { campo: 'subgerente', nombre: 'Subgerente', valor: escalasData.subgerente },
        { campo: 'gerente', nombre: 'Gerente', valor: escalasData.gerente },
        { campo: 'director', nombre: 'Director', valor: escalasData.director },
        { campo: 'subdirectorNacional', nombre: 'Subdirector Nacional', valor: escalasData.subdirectorNacional },
        { campo: 'directorNacional', nombre: 'Director Nacional', valor: escalasData.directorNacional }
    ];
    
    // Verificar que todos los campos de escalas tengan valores válidos
    const camposInvalidos = [];
    camposEscalas.forEach(({ campo, nombre, valor }) => {
        if (isNaN(valor) || valor < 0) {
            camposInvalidos.push(nombre);
        }
    });
    
    // Si hay campos inválidos, mostrar error y no continuar
    if (camposInvalidos.length > 0) {
        const mensaje = `Los siguientes campos de escalas tienen valores inválidos:\n${camposInvalidos.join(', ')}`;
        alert(mensaje);
        return; // No continuar con la creación
    }
    
    console.log('Escalas del plan:', escalasData);
    console.log('currentPlanData:', currentPlanData);
    console.log('¿currentPlanData existe?', !!currentPlanData);
    console.log('Tipo de currentPlanData:', typeof currentPlanData);
    
    // Determinar si es creación o actualización
    const isUpdate = window.currentEditPlanCode;
    console.log('¿Es actualización?', isUpdate);
    
    if (isUpdate) {
        // Para actualización, usar la función específica
        handleUpdatePlanEscalas();
        return;
    } else {
        // Crear nuevo plan con escalas
        const planData = {
            ...currentPlanData,
            escalas: escalasData
        };
        console.log('Plan data completo:', planData);
        console.log('Escalas a guardar:', escalasData);
        
        // Guardar en el store
        const planCode = getNextPlanCode();
        console.log('Código del plan generado:', planCode);
        planesStore[planCode] = planData;
        console.log('Plan guardado en store:', planesStore[planCode]);
        console.log('¿El plan en store tiene escalas?', !!planesStore[planCode].escalas);
        persistPlanes();
        console.log('Nuevo plan creado con escalas:', planData);
        console.log('¿El plan tiene escalas después de guardar?', !!planesStore[planCode].escalas);
    }
    
    console.log('Store actualizado:', planesStore);
    
    // Cerrar modal y mostrar mensaje de éxito
    hidePlanEscalasModal();
    showSuccessCreatePlanEscalasModal();
    
    // Recargar la tabla
    loadTable();
}

// ========================================
// FUNCIONES DEL MODAL DE SELECCIÓN DE CIUDAD
// ========================================

/**
 * Muestra el modal de selección de ciudad
 * Solo se muestra si el usuario no ha seleccionado una ciudad en esta sesión
 */
function showSelectPlanModal() {
    // Verificar si el usuario ya seleccionó una ciudad en esta sesión
    const selectedCity = sessionStorage.getItem('selectedCity');
    if (!selectedCity) {
        const modal = document.getElementById('selectPlanModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
}

/**
 * Fuerza la visualización del modal de selección de ciudad
 * Se usa para permitir cambiar la ciudad seleccionada
 */
function forceShowSelectPlanModal() {
    const modal = document.getElementById('selectPlanModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta el modal de selección de ciudad
 * Restaura el scroll del body
 */
function hideSelectPlanModal() {
    const modal = document.getElementById('selectPlanModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Hacer las funciones globales para que estén disponibles desde HTML
window.showSelectPlanModal = showSelectPlanModal;
window.hideSelectPlanModal = hideSelectPlanModal;
window.forceShowSelectPlanModal = forceShowSelectPlanModal;



