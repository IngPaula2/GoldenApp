/**
 * ====================================================================================
 * 💰 MÓDULO NÓMINA SEMANAL - GOLDEN APP
 * ====================================================================================
 * 
 * Este archivo contiene la lógica JavaScript completa para el módulo de nómina semanal.
 * Incluye gestión de modales, operaciones CRUD, cálculos de comisiones y generación de reportes.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Gestión de nóminas semanales (crear, editar, eliminar, buscar)
 * - Gestión de facturas dentro de las nóminas
 * - Carga automática de escalas desde planes y ejecutivos
 * - Cálculo de comisiones por ejecutivo
 * - Edición de escalas de facturas
 * - Generación de reportes (semanal, cuadre y comprobante por ejecutivo)
 * - Validación de datos y formatos numéricos
 * - Gestión de ciudades y empleados
 * 
 * ====================================================================================
 * 🔗 INSTRUCCIONES DE INTEGRACIÓN CON BACKEND
 * ====================================================================================
 * 
 * INGENIERO: Este módulo actualmente usa localStorage para almacenar datos temporalmente.
 * Debes reemplazar todas las llamadas a localStorage con llamadas a la API del backend.
 * 
 * ENDPOINTS REQUERIDOS:
 * 
 * 1. NÓMINAS SEMANALES:
 *    GET    /api/nomina/semanal?ciudad={codigo}
 *           - Obtener todas las nóminas semanales de una ciudad
 *           - Response: { success: true, data: Array<NominaSemanal> }
 * 
 *    GET    /api/nomina/semanal/{id}
 *           - Obtener una nómina específica por ID
 *           - Response: { success: true, data: NominaSemanal }
 * 
 *    POST   /api/nomina/semanal
 *           - Crear una nueva nómina semanal
 *           - Body: { ciudadCodigo, fechaInicio, fechaFin, facturas: [] }
 *           - Response: { success: true, data: NominaSemanal, message: string }
 * 
 *    PUT    /api/nomina/semanal/{id}
 *           - Actualizar una nómina existente
 *           - Body: { ciudadCodigo, fechaInicio, fechaFin, facturas: [] }
 *           - Response: { success: true, data: NominaSemanal, message: string }
 * 
 *    DELETE /api/nomina/semanal/{id}
 *           - Eliminar una nómina
 *           - Response: { success: true, message: string }
 * 
 * 2. FACTURAS:
 *    GET    /api/nomina/facturas?nominaId={id}
 *           - Obtener todas las facturas de una nómina
 *           - Response: { success: true, data: Array<Factura> }
 * 
 *    POST   /api/nomina/facturas
 *           - Crear una nueva factura en una nómina
 *           - Body: { nominaId, numeroFactura, numeroContrato, cuotaInicial, escalas: [], ... }
 *           - Response: { success: true, data: Factura, message: string }
 * 
 *    PUT    /api/nomina/facturas/{id}
 *           - Actualizar una factura existente
 *           - Body: { numeroFactura, numeroContrato, cuotaInicial, escalas: [], ... }
 *           - Response: { success: true, data: Factura, message: string }
 * 
 *    DELETE /api/nomina/facturas/{id}
 *           - Eliminar una factura
 *           - Response: { success: true, message: string }
 * 
 * 3. EMPLEADOS Y CIUDADES:
 *    GET    /api/empleados?ciudad={codigo}
 *           - Obtener todos los empleados de una ciudad
 *           - Response: { success: true, data: Object<identificacion, Empleado> }
 * 
 *    GET    /api/ciudades
 *           - Obtener todas las ciudades disponibles
 *           - Response: { success: true, data: Array<Ciudad> }
 * 
 * 4. CONTRATOS Y PLANES:
 *    GET    /api/contratos/{numeroContrato}?ciudad={codigo}
 *           - Obtener información de un contrato
 *           - Response: { success: true, data: Contrato }
 * 
 *    GET    /api/planes
 *           - Obtener todos los planes disponibles
 *           - Response: { success: true, data: Object<codigoPlan, Plan> }
 * 
 * FUNCIONES QUE REQUIEREN MODIFICACIÓN:
 * 
 * - loadPayrollData(cityCode) - Línea ~XXX
 *   Reemplazar: localStorage.getItem(`nominaSemanal_${cityCode}`)
 *   Con: fetch(`/api/nomina/semanal?ciudad=${cityCode}`)
 * 
 * - savePayrollData(cityCode, data) - Línea ~XXX
 *   Reemplazar: localStorage.setItem(`nominaSemanal_${cityCode}`, JSON.stringify(data))
 *   Con: fetch('/api/nomina/semanal', { method: 'POST', body: JSON.stringify(data) })
 * 
 * - updatePayrollData(payrollId, data) - Línea ~XXX
 *   Reemplazar: localStorage.setItem(...)
 *   Con: fetch(`/api/nomina/semanal/${payrollId}`, { method: 'PUT', body: JSON.stringify(data) })
 * 
 * - deletePayrollData(payrollId) - Línea ~XXX
 *   Reemplazar: localStorage.removeItem(...)
 *   Con: fetch(`/api/nomina/semanal/${payrollId}`, { method: 'DELETE' })
 * 
 * - loadEmployeesByCity(cityCode) - Línea ~XXX
 *   Reemplazar: localStorage.getItem('empleadosByCity')
 *   Con: fetch(`/api/empleados?ciudad=${cityCode}`)
 * 
 * - loadContractInfo(contractNumber, cityCode) - Línea ~XXX
 *   Reemplazar: localStorage.getItem('contratosData')
 *   Con: fetch(`/api/contratos/${contractNumber}?ciudad=${cityCode}`)
 * 
 * - loadPlansData() - Línea ~XXX
 *   Reemplazar: localStorage.getItem('planesData')
 *   Con: fetch('/api/planes')
 * 
 * NOTAS IMPORTANTES:
 * - Todas las funciones que usan localStorage deben ser reemplazadas
 * - Mantener la misma estructura de datos en las respuestas del backend
 * - Agregar manejo de errores apropiado (try-catch, validación de respuestas)
 * - Implementar loading states mientras se cargan los datos
 * - Validar que las respuestas tengan success: true antes de procesar
 * 
 * ESTRUCTURA DE DATOS ESPERADA:
 * 
 * NominaSemanal: {
 *   id: string,
 *   ciudadCodigo: string,
 *   fechaInicio: string (YYYY-MM-DD),
 *   fechaFin: string (YYYY-MM-DD),
 *   facturas: Array<Factura>,
 *   createdAt: string,
 *   updatedAt: string
 * }
 * 
 * Factura: {
 *   id: string,
 *   numeroFactura: string,
 *   numeroContrato: string,
 *   cuotaInicial: number,
 *   escalas: Array<Escala>,
 *   fechaFinal: string (YYYY-MM-DD),
 *   valor: number
 * }
 * 
 * Escala: {
 *   id: string,
 *   codigo: string,
 *   nombre: string,
 *   empleadoId: string,
 *   empleadoNombre: string,
 *   valor: number
 * }
 * 
 * ====================================================================================
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

/**
 * Almacena todas las nóminas semanales de la ciudad seleccionada
 * @type {Array<Object>}
 */
let payrollData = [];

/**
 * Almacena una copia de todas las nóminas sin filtrar (para búsqueda)
 * @type {Array<Object>}
 */
let allPayrollData = [];

/**
 * ID de la nómina actualmente seleccionada
 * @type {string|null}
 */
let currentPayrollId = null;

/**
 * Almacena las facturas de la nómina actualmente seleccionada
 * @type {Array<Object>}
 */
let invoicesData = [];

/**
 * Almacena las escalas actuales de la factura que se está creando/editando
 * @type {Array<Object>}
 */
let currentScales = [];

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando carga de interfaz de nómina semanal...');
        
        // Inicializar componentes básicos
        initializeModals();
        initializeUserDropdown();
        initializeNumericFormatting();
        initializeSearchNomina();
        
        console.log('✅ Componentes básicos inicializados');
        
        // Verificar datos de ciudades y mostrar modal INMEDIATAMIENTE
        initializeCitySelection();
        
        console.log('✅ Interfaz de nómina semanal cargada correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico al cargar la interfaz:', error);
    }
});

// ========================================
// GESTIÓN DE MODALES
// ========================================

function initializeModals() {
    // Cerrar modales al hacer clic fuera (excepto confirmación/éxito)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                // No permitir cerrar el modal de ciudad haciendo clic fuera si no hay ciudad seleccionada
                if (this.id === 'selectCityModal') {
                    const city = getSelectedCityCode();
                    if (!city) {
                        return; // No cerrar si no hay ciudad seleccionada
                    }
                }
                
                // Manejar modales de confirmación, éxito y reportes
                if (this.id === 'confirmCreatePayrollModal') {
                    cancelCreatePayroll();
                    return;
                }
                
                if (this.id === 'successCreatePayrollModal') {
                    closeSuccessCreatePayrollModal();
                    return;
                }
                
                if (this.id === 'confirmUpdatePayrollModal') {
                    cancelUpdatePayroll();
                    return;
                }
                
                if (this.id === 'successUpdatePayrollModal') {
                    closeSuccessUpdatePayrollModal();
                    return;
                }
                
                if (this.id === 'confirmCreateInvoiceModal') {
                    cancelCreateInvoice();
                    return;
                }
                
                if (this.id === 'successCreateInvoiceModal') {
                    closeSuccessCreateInvoiceModal();
                    return;
                }
                
                if (this.id === 'confirmUpdateInvoiceModal') {
                    cancelUpdateInvoice();
                    return;
                }
                
                if (this.id === 'successUpdateInvoiceModal') {
                    closeSuccessUpdateInvoiceModal();
                    return;
                }
                
                if (this.id === 'confirmDeletePayrollModal') {
                    cancelDeletePayroll();
                    return;
                }
                
                if (this.id === 'successDeletePayrollModal') {
                    closeSuccessDeletePayrollModal();
                    return;
                }
                
                if (this.id === 'confirmDeleteInvoiceModal') {
                    cancelDeleteInvoice();
                    return;
                }
                
                if (this.id === 'successDeleteInvoiceModal') {
                    closeSuccessDeleteInvoiceModal();
                    return;
                }
                
                if (this.id === 'editScalesModal') {
                    hideEditScalesModal();
                    return;
                }
                
                if (this.id === 'confirmLogoutModal') {
                    cancelLogout();
                    return;
                }
                
                if (this.id === 'reporteSemanalModal') {
                    hideReporteSemanalModal();
                    return;
                }
                
                if (this.id === 'reporteCuadreModal') {
                    hideReporteCuadreModal();
                    return;
                }
                
                hideAllModals();
            }
        });
    });
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Verificar si hay un modal de confirmación abierto
            const confirmCreateModal = document.getElementById('confirmCreatePayrollModal');
            const confirmUpdateModal = document.getElementById('confirmUpdatePayrollModal');
            const successUpdateModal = document.getElementById('successUpdatePayrollModal');
            
            if (confirmCreateModal && confirmCreateModal.style.display === 'flex') {
                cancelCreatePayroll();
                return;
            }
            
            const successCreatePayrollModal = document.getElementById('successCreatePayrollModal');
            if (successCreatePayrollModal && successCreatePayrollModal.style.display === 'flex') {
                closeSuccessCreatePayrollModal();
                return;
            }
            
            if (confirmUpdateModal && confirmUpdateModal.style.display === 'flex') {
                cancelUpdatePayroll();
                return;
            }
            
            if (successUpdateModal && successUpdateModal.style.display === 'flex') {
                closeSuccessUpdatePayrollModal();
                return;
            }
            
            const successDeletePayrollModal = document.getElementById('successDeletePayrollModal');
            const successDeleteInvoiceModal = document.getElementById('successDeleteInvoiceModal');
            
            if (successDeletePayrollModal && successDeletePayrollModal.style.display === 'flex') {
                closeSuccessDeletePayrollModal();
                return;
            }
            
            if (successDeleteInvoiceModal && successDeleteInvoiceModal.style.display === 'flex') {
                closeSuccessDeleteInvoiceModal();
                return;
            }
            
            const reporteSemanalModal = document.getElementById('reporteSemanalModal');
            const reporteCuadreModal = document.getElementById('reporteCuadreModal');
            const comprobanteEjecutivoModal = document.getElementById('comprobanteEjecutivoModal');
            
            if (reporteSemanalModal && reporteSemanalModal.style.display === 'flex') {
                hideReporteSemanalModal();
                return;
            }
            
            if (reporteCuadreModal && reporteCuadreModal.style.display === 'flex') {
                hideReporteCuadreModal();
                return;
            }
            
            if (comprobanteEjecutivoModal && comprobanteEjecutivoModal.style.display === 'flex') {
                hideComprobanteEjecutivoModal();
                return;
            }
            
            const searchNominaModal = document.getElementById('searchNominaModal');
            const nominaResultsModal = document.getElementById('nominaResultsModal');
            
            if (searchNominaModal && searchNominaModal.style.display === 'flex') {
                hideSearchNominaModal();
                return;
            }
            
            if (nominaResultsModal && nominaResultsModal.style.display === 'flex') {
                hideNominaResultsModal();
                return;
            }
            
            if (searchNominaModal && searchNominaModal.style.display === 'flex') {
                hideSearchNominaModal();
                return;
            }
            
            if (nominaResultsModal && nominaResultsModal.style.display === 'flex') {
                hideNominaResultsModal();
                return;
            }
            
            const editScalesModal = document.getElementById('editScalesModal');
            if (editScalesModal && editScalesModal.style.display === 'flex') {
                hideEditScalesModal();
                return;
            }
            
            const confirmDeletePayrollModal = document.getElementById('confirmDeletePayrollModal');
            const confirmDeleteInvoiceModal = document.getElementById('confirmDeleteInvoiceModal');
            
            if (confirmDeletePayrollModal && confirmDeletePayrollModal.style.display === 'flex') {
                cancelDeletePayroll();
                return;
            }
            
            if (confirmDeleteInvoiceModal && confirmDeleteInvoiceModal.style.display === 'flex') {
                cancelDeleteInvoice();
                return;
            }
            
            hideAllModals();
        }
    });

    // Botón de seleccionar ciudad
    const bSeleccionarCiudad = document.getElementById('bSeleccionarCiudad');
    if (bSeleccionarCiudad) {
        bSeleccionarCiudad.addEventListener('click', handleSelectCity);
    }

    // Botón de crear nómina
    const bCrearNomina = document.getElementById('bCrearNomina');
    if (bCrearNomina) {
        bCrearNomina.addEventListener('click', handleCreatePayroll);
    }

    // Botón de crear factura
    const bCrearFactura = document.getElementById('bCrearFactura');
    if (bCrearFactura) {
        bCrearFactura.addEventListener('click', handleCreateInvoice);
    }

    // Botón de generar reporte semanal
    const bGenerarReporteSemanal = document.getElementById('bGenerarReporteSemanal');
    if (bGenerarReporteSemanal) {
        bGenerarReporteSemanal.addEventListener('click', handleGenerateReporteSemanal);
    }

    // Botón de generar reporte cuadre
    const bGenerarReporteCuadre = document.getElementById('bGenerarReporteCuadre');
    if (bGenerarReporteCuadre) {
        bGenerarReporteCuadre.addEventListener('click', handleGenerateReporteCuadre);
    }

    // Botón de generar comprobante por ejecutivo
    const bGenerarComprobanteEjecutivo = document.getElementById('bGenerarComprobanteEjecutivo');
    if (bGenerarComprobanteEjecutivo) {
        bGenerarComprobanteEjecutivo.addEventListener('click', handleGenerateComprobanteEjecutivo);
    }

    // El campo de contrato ahora es readonly y se carga automáticamente
    // No necesita event listener ya que se carga automáticamente al ingresar la factura

    // Campo de número de factura para buscar factura existente
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    if (invoiceNumberInput) {
        invoiceNumberInput.addEventListener('blur', handleInvoiceNumberSearch);
        invoiceNumberInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleInvoiceNumberSearch();
            }
        });
        // También validar cuando se escribe (con un pequeño delay para no ser muy intrusivo)
        let searchTimeout;
        invoiceNumberInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const invoiceNumber = this.value.trim();
            if (invoiceNumber.length >= 3) { // Solo validar si tiene al menos 3 caracteres
                searchTimeout = setTimeout(() => {
                    console.log('🔍 Validando factura al escribir:', invoiceNumber);
                    // Verificar si la factura ya existe en cualquier nómina (incluyendo la actual)
                    const existingInvoiceInfo = findInvoiceInOtherPayrolls(invoiceNumber, true);
                    if (existingInvoiceInfo) {
                        console.log('⚠️ Factura encontrada al escribir:', existingInvoiceInfo);
                        // Mostrar aviso de que la factura ya existe
                        showWarningInvoiceExistsModal(existingInvoiceInfo.fechaInicio);
                    } else {
                        console.log('✅ Factura no encontrada, puede continuar');
                    }
                }, 500); // Esperar 500ms después de que el usuario deje de escribir
            }
        });
    }

    // Botón de editar escalas
    const btnEditarEscalas = document.getElementById('btnEditarEscalas');
    if (btnEditarEscalas) {
        btnEditarEscalas.addEventListener('click', function() {
            if (typeof showEditScalesModal === 'function') {
                showEditScalesModal();
            } else {
                console.error('showEditScalesModal no está definida');
            }
        });
    }

    // Botones del modal de editar escalas
    const bGuardarEscalas = document.getElementById('bGuardarEscalas');
    if (bGuardarEscalas) {
        bGuardarEscalas.addEventListener('click', function() {
            if (typeof saveEditedScales === 'function') {
                saveEditedScales();
            } else {
                console.error('saveEditedScales no está definida');
            }
        });
    }

    const bCancelarEditarEscalas = document.getElementById('bCancelarEditarEscalas');
    if (bCancelarEditarEscalas) {
        bCancelarEditarEscalas.addEventListener('click', function() {
            if (typeof hideEditScalesModal === 'function') {
                hideEditScalesModal();
            } else {
                console.error('hideEditScalesModal no está definida');
            }
        });
    }
}

function hideAllModals() {
    // Solo cerrar modales principales, no los de confirmación o éxito
    const modalsToClose = ['createPayrollModal', 'createInvoiceModal', 'confirmCreatePayrollModal', 'confirmUpdatePayrollModal', 'confirmCreateInvoiceModal', 'confirmUpdateInvoiceModal', 'reporteSemanalModal', 'reporteCuadreModal', 'comprobanteEjecutivoModal'];
    modalsToClose.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    });
    
    // No cerrar el modal de ciudad si no hay ciudad seleccionada
    const cityModal = document.getElementById('selectCityModal');
    if (cityModal) {
        const city = getSelectedCityCode();
        if (!city) {
            return; // No cerrar si no hay ciudad seleccionada
        }
        cityModal.style.display = 'none';
    }
    
    document.body.style.overflow = 'auto';
}

// ========================================
// SELECCIÓN DE CIUDAD (PATRÓN REUTILIZABLE)
// ========================================

function initializeCitySelection() {
    try {
        // Verificar datos de ciudades
        if (typeof verificarDatosCiudades === 'function' && !verificarDatosCiudades()) {
            console.log('⚠️ Restaurando datos básicos de ciudades...');
            if (typeof restaurarDatosCiudadesBasicos === 'function') {
                restaurarDatosCiudadesBasicos();
            }
        }
    } catch (e) {
        // Si no existen helpers, continuar
        console.log('⚠️ Funciones de ciudades no encontradas, usando funciones locales');
    }

    // Siempre resetear la selección de ciudad al cargar la página
    try { sessionStorage.removeItem('selectedCity'); } catch (e) {}

    // Limpiar tabla hasta que se seleccione una ciudad
    payrollData = [];
    renderPayrollTable(payrollData);
    
    // Ocultar botón "Cambiar Ciudad" inicialmente
    updateChangeCityButtonVisibility();
    
    // Mostrar modal inmediatamente
    console.log('⏰ Mostrando modal de selección de ciudad...');
    showSelectCityModal();
}

// Definir función globalmente desde el inicio
window.showSelectCityModal = function() {
    const modal = document.getElementById('selectCityModal');
    if (!modal) {
        console.error('❌ No se encontró el modal de selección de ciudad');
        if (typeof showNotification === 'function') {
            showNotification('Error: No se encontró el modal de selección de ciudad', 'error');
        }
        return;
    }
    
    console.log('🔍 Mostrando modal de selección de ciudad...');
    
    // Poblar opciones de ciudades
    if (typeof populateCitySelectOptions === 'function') {
        populateCitySelectOptions();
    }
    
    // Si ya hay una ciudad seleccionada, preseleccionarla
    let currentCity = '';
    try {
        if (typeof getSelectedCityCode === 'function') {
            currentCity = getSelectedCityCode();
        } else {
            currentCity = sessionStorage.getItem('selectedCity') || '';
        }
    } catch (e) {
        currentCity = '';
    }
    
    const citySelect = document.getElementById('citySelect');
    if (citySelect && currentCity) {
        citySelect.value = currentCity;
    }
    
    // Mostrar el modal
    modal.style.display = 'flex';
    modal.style.zIndex = '9999';
    document.body.style.overflow = 'hidden';
    modal.style.visibility = 'visible';
    
    console.log('✅ Modal mostrado');
    
    // Enfocar el select después de un pequeño delay
    setTimeout(() => { 
        if (citySelect) {
            citySelect.focus();
            console.log('✅ Select enfocado');
        }
    }, 100);
};

// También definir como función normal para uso interno
function showSelectCityModal() {
    window.showSelectCityModal();
}

function hideSelectCityModal() {
    const modal = document.getElementById('selectCityModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function populateCitySelectOptions() {
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) return;

    let ciudades = {};
    try {
        if (typeof window.getCiudadesData === 'function') {
            ciudades = window.getCiudadesData() || {};
        } else {
            const raw = localStorage.getItem('ciudadesData');
            const data = raw ? JSON.parse(raw) : {};
            ciudades = Object.fromEntries(
                Object.entries(data).filter(([k, v]) => v && typeof v === 'object' && v.codigo && v.nombre)
            );
        }
    } catch (e) {
        ciudades = {};
    }

    citySelect.innerHTML = '<option value="">Seleccione la ciudad</option>';

    Object.values(ciudades)
        .filter(c => c && c.activo !== false)
        .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
        .forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.codigo;
            opt.textContent = `${c.codigo} - ${String(c.nombre || '').toUpperCase()}`;
            citySelect.appendChild(opt);
        });
}

function handleSelectCity() {
    const citySelect = document.getElementById('citySelect');
    const selectedCity = citySelect ? citySelect.value : '';
    if (!selectedCity) {
        showNotification('Por favor, seleccione una ciudad', 'warning');
        return;
    }

    try { sessionStorage.setItem('selectedCity', selectedCity); } catch (e) {}
    updateCurrentCityName(selectedCity);
    hideSelectCityModal();

    // Mostrar botón "Cambiar Ciudad" ahora que hay una ciudad seleccionada
    updateChangeCityButtonVisibility();

    // Cargar datos dependientes de la ciudad
    loadPayrollData();

    const cityName = getCityNameByCode(selectedCity);
    const fullCityName = cityName ? `${selectedCity} - ${cityName}` : selectedCity;
    showNotification(`Ciudad seleccionada: ${fullCityName}`, 'success');
}

function getCityNameByCode(cityCode) {
    try {
        if (typeof window.getCiudadesData === 'function') {
            const ciudades = window.getCiudadesData() || {};
            return ciudades[cityCode]?.nombre || '';
        }
        const raw = localStorage.getItem('ciudadesData');
        if (!raw) return '';
        const data = JSON.parse(raw);
        return data && data[cityCode] ? data[cityCode].nombre || '' : '';
    } catch (e) {
        return '';
    }
}

function updateCurrentCityName(cityCode) {
    const span = document.getElementById('currentCityName');
    if (!span) return;
    const name = getCityNameByCode(cityCode);
    span.textContent = name ? `${cityCode} - ${name}`.toUpperCase() : `${cityCode}`;
}

function getSelectedCityCode() {
    try { return sessionStorage.getItem('selectedCity') || ''; } catch (e) { return ''; }
}

function updateChangeCityButtonVisibility() {
    const changeCityButton = document.getElementById('changeCityButton');
    const city = getSelectedCityCode();
    if (changeCityButton) {
        changeCityButton.style.display = city ? 'block' : 'none';
    }
}


// ========================================
// FUNCIONES DE MODALES
// ========================================

function showCreatePayrollModal() {
    const modal = document.getElementById('createPayrollModal');
    if (!modal) return;

    const cityCode = getSelectedCityCode();
    if (!cityCode) {
        showNotification('Por favor, seleccione una ciudad primero', 'warning');
        return;
    }

    // Resetear modo edición
    window.__editingPayrollId = null;

    // Cambiar título y botón a modo creación
    const modalTitle = document.querySelector('#createPayrollModal .modal-title');
    const createButton = document.getElementById('bCrearNomina');
    if (modalTitle) {
        modalTitle.textContent = 'CREAR NÓMINA SEMANAL';
    }
    if (createButton) {
        createButton.textContent = 'Crear Nómina';
    }

    // Llenar código de ciudad
    const cityCodeInput = document.getElementById('payrollCityCode');
    if (cityCodeInput) {
        cityCodeInput.value = cityCode;
    }

    // Limpiar formulario
    document.getElementById('payrollWeek').value = '';
    document.getElementById('payrollStartDate').value = '';
    document.getElementById('payrollEndDate').value = '';

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideCreatePayrollModal() {
    const modal = document.getElementById('createPayrollModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    // Limpiar modo edición al cerrar
    window.__editingPayrollId = null;
}

function showCreateInvoiceModal() {
    if (!currentPayrollId) {
        showNotification('No hay nómina seleccionada', 'warning');
        return;
    }

    const modal = document.getElementById('createInvoiceModal');
    if (!modal) return;

    // Obtener la nómina actual para cargar su fecha final
    const payroll = payrollData.find(p => p.id === currentPayrollId);
    
    // Limpiar formulario - el usuario ingresará el número de factura manualmente
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    if (invoiceNumberInput) {
        invoiceNumberInput.value = '';
    }

    // Limpiar formulario - el contrato se cargará automáticamente al ingresar la factura
    const contractInput = document.getElementById('invoiceContract');
    if (contractInput) {
        contractInput.value = '';
    }
    document.getElementById('invoiceInitialQuota').value = '';
    
    // Cargar fecha final de la nómina actual
    const endDateInput = document.getElementById('invoiceEndDate');
    if (endDateInput && payroll && payroll.fechaFin) {
        const fechaFin = new Date(payroll.fechaFin);
        if (!isNaN(fechaFin.getTime())) {
            endDateInput.value = fechaFin.toISOString().split('T')[0];
        } else {
            endDateInput.value = payroll.fechaFin;
        }
    } else if (endDateInput) {
        endDateInput.value = '';
    }
    
    // Limpiar escalas
    const scalesContainer = document.getElementById('scalesContainer');
    if (scalesContainer) {
        scalesContainer.innerHTML = '<div class="no-scales-message"><p>Seleccione un contrato para cargar las escalas del plan</p></div>';
    }
    currentScales = [];

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Enfocar el campo de número de factura
    setTimeout(() => {
        if (invoiceNumberInput) invoiceNumberInput.focus();
    }, 100);
}

function hideCreateInvoiceModal() {
    // Limpiar modo edición si estaba activo
    if (window.__editingInvoiceId) {
        window.__editingInvoiceId = null;
        
        // Restaurar título y botón
        const modalTitle = document.querySelector('#createInvoiceModal .modal-title');
        const createButton = document.getElementById('bCrearFactura');
        if (modalTitle) {
            modalTitle.textContent = 'CREAR FACTURA';
        }
        if (createButton) {
            createButton.textContent = 'Crear Factura';
        }
    }
    const modal = document.getElementById('createInvoiceModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Ocultar botón de editar escalas
    const btnEditarEscalas = document.getElementById('btnEditarEscalas');
    if (btnEditarEscalas) {
        btnEditarEscalas.style.display = 'none';
    }
}

// ========================================
// GESTIÓN DE NÓMINAS SEMANALES
// ========================================

function handleCreatePayroll() {
    const cityCode = document.getElementById('payrollCityCode').value;
    const week = document.getElementById('payrollWeek').value;
    const startDate = document.getElementById('payrollStartDate').value;
    const endDate = document.getElementById('payrollEndDate').value;

    if (!cityCode || !week || !startDate || !endDate) {
        showNotification('Por favor, complete todos los campos', 'warning');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showNotification('La fecha de inicio no puede ser mayor que la fecha fin', 'warning');
        return;
    }

    // Verificar si estamos en modo edición
    const editingId = window.__editingPayrollId;
    if (editingId) {
        // Modo edición: mostrar modal de confirmación para actualizar
        showConfirmUpdatePayrollModal();
    } else {
        // Modo creación: mostrar modal de confirmación para crear
        showConfirmCreatePayrollModal();
    }
}

function showConfirmCreatePayrollModal() {
    const modal = document.getElementById('confirmCreatePayrollModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cancelCreatePayroll() {
    const modal = document.getElementById('confirmCreatePayrollModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * 🔗 BACKEND INTEGRATION - CONFIRMAR CREACIÓN DE NÓMINA
 * 
 * Confirma y crea una nueva nómina semanal.
 * 
 * BACKEND: Reemplazar con llamada a API
 * - Endpoint: POST /api/nomina/semanal
 * - Método: POST
 * - Body: {
 *     ciudadCodigo: string,
 *     ciudadNombre: string,
 *     fechaInicio: string (ISO),
 *     fechaFin: string (ISO),
 *     semana: number
 *   }
 * - Headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }
 * - Response: { id: string, codigo: string, ... }
 * 
 * @returns {void}
 */
function confirmCreatePayroll() {
    const cityCode = document.getElementById('payrollCityCode').value;
    const week = document.getElementById('payrollWeek').value;
    const startDate = document.getElementById('payrollStartDate').value;
    const endDate = document.getElementById('payrollEndDate').value;

    // Crear nueva nómina
    const newPayroll = {
        id: generatePayrollId(),
        codigo: generatePayrollCode(),
        ciudadCodigo: cityCode,
        ciudadNombre: getCityNameByCode(cityCode),
        fechaInicio: startDate,
        fechaFin: endDate,
        semana: parseInt(week),
        facturas: [],
        fechaCreacion: new Date().toISOString()
    };

        // 🔗 BACKEND INTEGRATION: Reemplazar con llamada a API
        // const response = await fetch('/api/nomina/semanal', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        //     body: JSON.stringify(newPayroll)
        // });
        // const createdPayroll = await response.json();
        // payrollData.push(createdPayroll);
        
        // TODO: Reemplazar con llamada a API del backend
        payrollData.push(newPayroll);
        // Actualizar también allPayrollData si no hay filtro activo
        if (allPayrollData.length === payrollData.length - 1) {
            allPayrollData.push(newPayroll);
        } else {
            // Si hay filtro activo, recargar todos los datos
            const cityCode = getSelectedCityCode();
            if (cityCode) {
                const stored = localStorage.getItem(`nominaSemanal_${cityCode}`);
                if (stored) {
                    allPayrollData = JSON.parse(stored);
                }
            }
        }
        savePayrollData();
    renderPayrollTable(payrollData);
    
    // Cerrar modales
    cancelCreatePayroll();
    hideCreatePayrollModal();
    
    // Mostrar modal de éxito
    showSuccessCreatePayrollModal();
}

/**
 * Muestra el modal de éxito al crear nómina
 * 
 * @returns {void}
 */
function showSuccessCreatePayrollModal() {
    const modal = document.getElementById('successCreatePayrollModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito al crear nómina
 * 
 * @returns {void}
 */
function closeSuccessCreatePayrollModal() {
    const modal = document.getElementById('successCreatePayrollModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showConfirmUpdatePayrollModal() {
    const modal = document.getElementById('confirmUpdatePayrollModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cancelUpdatePayroll() {
    const modal = document.getElementById('confirmUpdatePayrollModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * 🔗 BACKEND INTEGRATION - CONFIRMAR ACTUALIZACIÓN DE NÓMINA
 * 
 * Confirma y actualiza una nómina semanal existente.
 * 
 * BACKEND: Reemplazar con llamada a API
 * - Endpoint: PUT /api/nomina/semanal/{id}
 * - Método: PUT
 * - Body: {
 *     ciudadCodigo: string,
 *     ciudadNombre: string,
 *     fechaInicio: string (ISO),
 *     fechaFin: string (ISO),
 *     semana: number
 *   }
 * - Headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }
 * - Response: { id: string, codigo: string, ... }
 * 
 * @returns {void}
 */
function confirmUpdatePayroll() {
    const cityCode = document.getElementById('payrollCityCode').value;
    const week = document.getElementById('payrollWeek').value;
    const startDate = document.getElementById('payrollStartDate').value;
    const endDate = document.getElementById('payrollEndDate').value;
    const editingId = window.__editingPayrollId;

    if (!editingId) {
        showNotification('Error: No se encontró la nómina a editar', 'error');
        return;
    }

    // Actualizar nómina existente
    const payrollIndex = payrollData.findIndex(p => p.id === editingId);
    if (payrollIndex === -1) {
        showNotification('No se encontró la nómina a editar', 'error');
        return;
    }

    const existingPayroll = payrollData[payrollIndex];
    // Actualizar datos (mantener ID, código, facturas y fecha de creación)
    payrollData[payrollIndex] = {
        ...existingPayroll,
        ciudadCodigo: cityCode,
        ciudadNombre: getCityNameByCode(cityCode),
        fechaInicio: startDate,
        fechaFin: endDate,
        semana: parseInt(week),
        fechaActualizacion: new Date().toISOString()
    };

    // Actualizar también en allPayrollData
    const allPayrollIndex = allPayrollData.findIndex(p => p.id === editingId);
    if (allPayrollIndex !== -1) {
        allPayrollData[allPayrollIndex] = payrollData[payrollIndex];
    } else {
        // Si no está en allPayrollData, recargar todos los datos
        const currentCityCode = getSelectedCityCode();
        if (currentCityCode) {
            const stored = localStorage.getItem(`nominaSemanal_${currentCityCode}`);
            if (stored) {
                allPayrollData = JSON.parse(stored);
            }
        }
    }

        // 🔗 BACKEND INTEGRATION: Reemplazar con llamada a API
        // const response = await fetch(`/api/nomina/semanal/${editingId}`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        //     body: JSON.stringify(payrollData[payrollIndex])
        // });
        // const updatedPayroll = await response.json();
        
        // TODO: Reemplazar con llamada a API del backend
        savePayrollData();
        renderPayrollTable(payrollData);
    
    // Cerrar modales
    cancelUpdatePayroll();
    hideCreatePayrollModal();
    
    // Mostrar modal de éxito
    showSuccessUpdatePayrollModal();
}

function showSuccessUpdatePayrollModal() {
    const modal = document.getElementById('successUpdatePayrollModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessUpdatePayrollModal() {
    const modal = document.getElementById('successUpdatePayrollModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// ELIMINACIÓN DE NÓMINA
// ========================================

/**
 * Muestra el modal de confirmación para eliminar una nómina
 * 
 * @param {string} payrollId - ID de la nómina a eliminar
 * @returns {void}
 */
function showConfirmDeletePayrollModal(payrollId) {
    window.__deletingPayrollId = payrollId;
    const modal = document.getElementById('confirmDeletePayrollModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela la eliminación de nómina
 * 
 * @returns {void}
 */
function cancelDeletePayroll() {
    window.__deletingPayrollId = null;
    const modal = document.getElementById('confirmDeletePayrollModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * 🔗 BACKEND INTEGRATION - CONFIRMAR ELIMINACIÓN DE NÓMINA
 * 
 * Confirma y elimina una nómina semanal.
 * 
 * BACKEND: Reemplazar con llamada a API
 * - Endpoint: DELETE /api/nomina/semanal/{id}
 * - Método: DELETE
 * - Headers: { 'Authorization': 'Bearer {token}' }
 * 
 * @returns {void}
 */
function confirmDeletePayroll() {
    const payrollId = window.__deletingPayrollId;
    if (!payrollId) {
        showNotification('Error: No se encontró la nómina a eliminar', 'error');
        return;
    }

    // Buscar y eliminar la nómina
    const payrollIndex = payrollData.findIndex(p => p.id === payrollId);
    if (payrollIndex === -1) {
        showNotification('No se encontró la nómina a eliminar', 'error');
        cancelDeletePayroll();
        return;
    }

    // 🔗 BACKEND INTEGRATION: Reemplazar con llamada a API
    // const response = await fetch(`/api/nomina/semanal/${payrollId}`, {
    //     method: 'DELETE',
    //     headers: { 'Authorization': `Bearer ${token}` }
    // });
    // if (!response.ok) {
    //     throw new Error('Error al eliminar la nómina');
    // }

    // Eliminar de payrollData
    payrollData.splice(payrollIndex, 1);

    // Eliminar también de allPayrollData
    const allPayrollIndex = allPayrollData.findIndex(p => p.id === payrollId);
    if (allPayrollIndex !== -1) {
        allPayrollData.splice(allPayrollIndex, 1);
    }

    // Guardar cambios
    savePayrollData();

    // Si estábamos viendo el detalle de esta nómina, volver a la lista
    if (currentPayrollId === payrollId) {
        backToPayrollList();
    } else {
        // Renderizar tabla actualizada
        renderPayrollTable(payrollData);
    }

    // Cerrar modal de confirmación
    cancelDeletePayroll();

    // Mostrar modal de éxito
    showSuccessDeletePayrollModal();
}

/**
 * Muestra el modal de éxito al eliminar nómina
 * 
 * @returns {void}
 */
function showSuccessDeletePayrollModal() {
    const modal = document.getElementById('successDeletePayrollModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito al eliminar nómina
 * 
 * @returns {void}
 */
function closeSuccessDeletePayrollModal() {
    const modal = document.getElementById('successDeletePayrollModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function generatePayrollId() {
    return 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generatePayrollCode() {
    const cityCode = getSelectedCityCode();
    const count = payrollData.length + 1;
    return `NOM-${cityCode}-${String(count).padStart(4, '0')}`;
}

function editPayroll(payrollId) {
    const payroll = payrollData.find(p => p.id === payrollId);
    if (!payroll) {
        showNotification('No se encontró la nómina', 'error');
        return;
    }

    const cityCode = getSelectedCityCode();
    if (!cityCode) {
        showNotification('Por favor, seleccione una ciudad primero', 'warning');
        return;
    }

    // Establecer modo edición
    window.__editingPayrollId = payrollId;

    // Cambiar título y botón a modo edición
    const modalTitle = document.querySelector('#createPayrollModal .modal-title');
    const createButton = document.getElementById('bCrearNomina');
    if (modalTitle) {
        modalTitle.textContent = 'EDITAR NÓMINA SEMANAL';
    }
    if (createButton) {
        createButton.textContent = 'Actualizar Nómina';
    }

    // Llenar formulario con datos existentes
    const cityCodeInput = document.getElementById('payrollCityCode');
    if (cityCodeInput) {
        cityCodeInput.value = payroll.ciudadCodigo;
    }

    document.getElementById('payrollWeek').value = payroll.semana || '';
    
    // Formatear fechas para el input date (formato YYYY-MM-DD)
    const startDateInput = document.getElementById('payrollStartDate');
    const endDateInput = document.getElementById('payrollEndDate');
    
    if (startDateInput && payroll.fechaInicio) {
        const startDate = new Date(payroll.fechaInicio);
        if (!isNaN(startDate.getTime())) {
            startDateInput.value = startDate.toISOString().split('T')[0];
        } else {
            startDateInput.value = payroll.fechaInicio;
        }
    }
    
    if (endDateInput && payroll.fechaFin) {
        const endDate = new Date(payroll.fechaFin);
        if (!isNaN(endDate.getTime())) {
            endDateInput.value = endDate.toISOString().split('T')[0];
        } else {
            endDateInput.value = payroll.fechaFin;
        }
    }

    // Mostrar modal
    const modal = document.getElementById('createPayrollModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function viewPayrollDetail(payrollId) {
    const payroll = payrollData.find(p => p.id === payrollId);
    if (!payroll) return;

    currentPayrollId = payrollId;
    invoicesData = payroll.facturas || [];

    // Ocultar lista, mostrar detalle
    document.getElementById('payrollListContainer').style.display = 'none';
    document.getElementById('payrollDetailContainer').style.display = 'block';

    // Llenar información de la nómina
    document.getElementById('detailPayrollCode').textContent = payroll.codigo;
    document.getElementById('detailPayrollCity').textContent = `${payroll.ciudadCodigo} - ${payroll.ciudadNombre}`;
    document.getElementById('detailPayrollStartDate').textContent = formatDate(payroll.fechaInicio);
    document.getElementById('detailPayrollEndDate').textContent = formatDate(payroll.fechaFin);
    document.getElementById('detailPayrollWeek').textContent = payroll.semana;
    document.getElementById('detailPayrollTitle').textContent = `Detalle de Nómina: ${payroll.codigo}`;

    // Renderizar facturas
    renderInvoicesTable(invoicesData);
}

function backToPayrollList() {
    currentPayrollId = null;
    invoicesData = [];
    
    // Recargar datos para actualizar el conteo de facturas
    loadPayrollData();
    
    document.getElementById('payrollListContainer').style.display = 'block';
    document.getElementById('payrollDetailContainer').style.display = 'none';
}

// ========================================
// BÚSQUEDA DE FACTURAS EXISTENTES
// ========================================

/**
 * Maneja la búsqueda de factura por número
 * 
 * Cuando el usuario ingresa un número de factura, busca si existe una factura
 * con ese número y carga automáticamente los datos del contrato, cuota inicial,
 * fecha final y escalas.
 * 
 * @returns {void}
 */
function handleInvoiceNumberSearch() {
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    if (!invoiceNumberInput) return;

    const invoiceNumber = invoiceNumberInput.value.trim();
    if (!invoiceNumber) return;

    // Verificar si la factura ya existe en cualquier nómina (incluyendo la actual)
    const existingInvoiceInfo = findInvoiceInOtherPayrolls(invoiceNumber, true);
    if (existingInvoiceInfo) {
        console.log('⚠️ Factura encontrada en nómina:', existingInvoiceInfo);
        // Mostrar aviso de que la factura ya existe
        showWarningInvoiceExistsModal(existingInvoiceInfo.fechaInicio);
    }

    // Buscar factura en localStorage (para cargar datos si existe)
    const cityCode = getSelectedCityCode();
    if (!cityCode) {
        showNotification('Por favor, seleccione una ciudad primero', 'warning');
        return;
    }

    try {
        const raw = localStorage.getItem('invoicesByCity');
        if (!raw) {
            // No hay facturas en invoicesByCity, pero puede estar en nóminas
            return;
        }

        const byCity = JSON.parse(raw);
        const invoices = Array.isArray(byCity[cityCode]) ? byCity[cityCode] : [];
        
        // Buscar factura por número
        const invoice = invoices.find(inv => 
            String(inv.invoiceNumber || '').trim() === invoiceNumber ||
            String(inv.invoiceNumber || '').trim().toUpperCase() === invoiceNumber.toUpperCase()
        );

        if (invoice) {
            // Cargar datos de la factura encontrada - solo el contrato asociado
            loadInvoiceData(invoice);
        }
    } catch (e) {
        console.error('Error buscando factura:', e);
    }
}

function loadInvoiceData(invoice) {
    // Cargar número de contrato - buscar en múltiples campos
    const contractNumber = invoice.contractNumber || 
                          invoice.contractId || 
                          invoice.contract || 
                          '';
    const contractInput = document.getElementById('invoiceContract');
    
    if (!contractInput) return;
    
    if (!contractNumber) {
        showNotification('La factura no tiene un contrato asociado', 'warning');
        contractInput.value = '';
        return;
    }
    
    // Cargar SOLO el contrato asociado a esta factura automáticamente
    loadContractForInvoice(contractNumber, invoice);
}

function loadInvoiceAdditionalData(invoice, contract) {
    // Cargar cuota inicial - buscar en factura, contrato o plan
    const initialQuotaInput = document.getElementById('invoiceInitialQuota');
    if (initialQuotaInput) {
        let initialQuota = 0;
        
        console.log('🔍 Buscando cuota inicial...');
        console.log('📄 Factura (completa):', JSON.stringify(invoice, null, 2));
        console.log('📋 Contrato (completo):', JSON.stringify(contract, null, 2));
        
        // 1. Buscar en la factura (múltiples campos posibles)
        let invoiceInitialQuota = 0;
        if (invoice) {
            // Buscar en todos los campos posibles de la factura
            invoiceInitialQuota = invoice.initialQuota || 
                                  invoice.cuotaInicial || 
                                  invoice.cuotaInicialValor ||
                                  invoice.valorInicial ||
                                  invoice.value ||
                                  invoice.valor ||
                                  invoice.initialFee ||
                                  invoice.downPayment ||
                                  0;
            
            // Convertir a número si es string
            if (invoiceInitialQuota && typeof invoiceInitialQuota === 'string') {
                // Si tiene formato "5.000.000" o "5,000,000", limpiar
                let cleanValue = invoiceInitialQuota.replace(/[^\d.]/g, '');
                // Si tiene múltiples puntos, son separadores de miles
                if (cleanValue.split('.').length > 2) {
                    cleanValue = cleanValue.replace(/\./g, '');
                }
                invoiceInitialQuota = Number(cleanValue) || 0;
            } else if (invoiceInitialQuota) {
                invoiceInitialQuota = Number(invoiceInitialQuota) || 0;
            }
            
            // Si el valor es muy pequeño (como 5), podría estar guardado como millones
            // Verificar si hay algún campo que indique que es en millones
            if (invoiceInitialQuota > 0 && invoiceInitialQuota < 1000) {
                // Buscar si hay algún campo que indique el valor completo
                const fullValue = invoice.cuotaInicialCompleta || 
                                 invoice.valorCompleto ||
                                 invoice.totalValue ||
                                 0;
                if (fullValue && Number(fullValue) > invoiceInitialQuota) {
                    invoiceInitialQuota = Number(fullValue);
                    console.log('💰 Valor pequeño encontrado, usando valor completo:', invoiceInitialQuota);
                }
            }
        }
        
        console.log('💰 Cuota inicial en factura (raw):', invoice.cuotaInicial);
        console.log('💰 Cuota inicial en factura (procesada):', invoiceInitialQuota);
        console.log('📋 Todos los campos de la factura relacionados con cuota:', {
            initialQuota: invoice.initialQuota,
            cuotaInicial: invoice.cuotaInicial,
            cuotaInicialValor: invoice.cuotaInicialValor,
            valorInicial: invoice.valorInicial,
            value: invoice.value,
            valor: invoice.valor,
            cuotaInicialCompleta: invoice.cuotaInicialCompleta,
            valorCompleto: invoice.valorCompleto
        });
        
        // Si el valor de la factura es muy pequeño (probablemente mal guardado) o es 0, buscar en contrato/plan
        // Pero si el valor es 5, puede ser que esté guardado como 5 millones (5000000) en otro campo
        const shouldSearchInContract = !invoiceInitialQuota || (invoiceInitialQuota > 0 && invoiceInitialQuota < 1000);
        
        console.log('🔍 ¿Debe buscar en contrato/plan?', shouldSearchInContract, 'Valor factura:', invoiceInitialQuota);
        
        // 2. Si no está en la factura o es muy pequeño, buscar en el contrato/plan
        if (shouldSearchInContract && contract) {
            console.log('🔍 Buscando cuota inicial en contrato/plan...');
            // PRIORIDAD 1: Buscar en planData del contrato (este es el valor creado en el contrato)
            console.log('🔍 Verificando planData del contrato...');
            console.log('🔍 contract.planData:', contract.planData);
            console.log('🔍 contract.planData existe?', contract.planData !== null && contract.planData !== undefined);
            console.log('🔍 Tipo de planData:', typeof contract.planData);
            console.log('🔍 planData es null?', contract.planData === null);
            console.log('🔍 planData es undefined?', contract.planData === undefined);
            
            // Verificar si planData existe y no es null
            if (contract.planData !== null && contract.planData !== undefined) {
                try {
                    let planData = contract.planData;
                    
                    // Si es string, parsearlo
                    if (typeof planData === 'string' && planData.trim() !== '') {
                        planData = JSON.parse(planData);
                    }
                    
                    // Verificar que planData sea un objeto válido
                    if (planData && typeof planData === 'object' && Object.keys(planData).length > 0) {
                        console.log('📋 planData del contrato (completo):', JSON.stringify(planData, null, 2));
                        console.log('📋 Campos de planData:', Object.keys(planData));
                        
                        // Buscar cuota inicial en planData (prioridad máxima) - probar todos los campos posibles
                        const planDataCuotaInicial = planData.cuotaInicial || 
                                                     planData.cuotaInicialValor ||
                                                     planData.valorInicial ||
                                                     planData.cuotaInicialPlan ||
                                                     planData.cuotaInicialContrato ||
                                                     planData.initialQuota ||
                                                     planData.initialFee ||
                                                     planData.downPayment ||
                                                     0;
                        
                        console.log('🔍 Valor encontrado en planData (antes de convertir):', planDataCuotaInicial);
                        console.log('🔍 Tipo del valor:', typeof planDataCuotaInicial);
                        
                        // Convertir a número si es string
                        if (planDataCuotaInicial) {
                            const numValue = Number(planDataCuotaInicial);
                            if (!isNaN(numValue) && numValue > 0) {
                                initialQuota = numValue;
                                console.log('✅ Cuota inicial encontrada en planData del contrato:', initialQuota);
                            } else {
                                console.log('⚠️ Cuota inicial en planData es 0, NaN o inválida:', numValue);
                            }
                        } else {
                            console.log('⚠️ No se encontró cuota inicial en planData. Valores probados:', {
                                cuotaInicial: planData.cuotaInicial,
                                cuotaInicialValor: planData.cuotaInicialValor,
                                valorInicial: planData.valorInicial,
                                cuotaInicialPlan: planData.cuotaInicialPlan,
                                cuotaInicialContrato: planData.cuotaInicialContrato
                            });
                        }
                    } else {
                        console.log('⚠️ planData es un objeto vacío o inválido');
                    }
                } catch (e) {
                    console.error('❌ Error parseando planData:', e);
                    console.error('planData raw:', contract.planData);
                    console.error('Tipo de planData:', typeof contract.planData);
                }
            } else {
                console.log('⚠️ El contrato no tiene planData o es null/undefined');
                // Intentar obtener planData del plan usando planCode
                if (contract.planCode) {
                    console.log('🔍 Intentando obtener planData del plan usando planCode:', contract.planCode);
                    try {
                        const planesData = localStorage.getItem('planesData');
                        if (planesData) {
                            const planes = JSON.parse(planesData);
                            const plan = planes[contract.planCode] || 
                                        Object.values(planes).find(p => 
                                            String(p.codigo || '').trim() === String(contract.planCode).trim()
                                        );
                            if (plan) {
                                console.log('✅ Plan encontrado, usando como planData:', plan);
                                contract.planData = plan; // Asignar el plan como planData
                                // Buscar cuota inicial en el plan
                                const planCuotaInicial = plan.cuotaInicial || 
                                                        plan.cuotaInicialValor ||
                                                        plan.valorInicial ||
                                                        0;
                                if (planCuotaInicial) {
                                    const numValue = Number(planCuotaInicial);
                                    if (!isNaN(numValue) && numValue > 0) {
                                        initialQuota = numValue;
                                        console.log('✅ Cuota inicial encontrada en el plan:', initialQuota);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error obteniendo planData del plan:', e);
                    }
                }
            }
            
            // PRIORIDAD 2: Buscar directamente en el contrato
            if (!initialQuota) {
                console.log('📋 Buscando cuota inicial directamente en el contrato...');
                console.log('📋 Campos del contrato:', Object.keys(contract));
                console.log('📋 Valores de cuota inicial en el contrato:', {
                    cuotaInicial: contract.cuotaInicial,
                    cuotaInicialValor: contract.cuotaInicialValor,
                    valorInicial: contract.valorInicial,
                    initialQuota: contract.initialQuota,
                    initialFee: contract.initialFee,
                    downPayment: contract.downPayment
                });
                
                const contractCuotaInicial = contract.cuotaInicial || 
                                            contract.cuotaInicialValor ||
                                            contract.valorInicial ||
                                            contract.initialQuota ||
                                            contract.initialFee ||
                                            contract.downPayment ||
                                            0;
                
                if (contractCuotaInicial) {
                    // Si es string, limpiar y convertir
                    let numValue = contractCuotaInicial;
                    if (typeof contractCuotaInicial === 'string') {
                        // Si tiene formato "5.000.000" o "5,000,000", limpiar
                        let cleanValue = contractCuotaInicial.replace(/[^\d.]/g, '');
                        // Si tiene múltiples puntos, son separadores de miles
                        if (cleanValue.split('.').length > 2) {
                            cleanValue = cleanValue.replace(/\./g, '');
                        }
                        numValue = Number(cleanValue) || 0;
                    } else {
                        numValue = Number(contractCuotaInicial) || 0;
                    }
                    
                    if (numValue > 0) {
                        initialQuota = numValue;
                        console.log('✅ Cuota inicial encontrada directamente en el contrato:', initialQuota);
                    } else {
                        console.log('⚠️ Cuota inicial en contrato es 0 o inválida:', numValue);
                    }
                } else {
                    console.log('⚠️ No se encontró cuota inicial en el contrato. Campos disponibles:', Object.keys(contract));
                }
            }
            
            // PRIORIDAD 3: Si aún no hay, buscar en el plan directamente (solo como último recurso)
            if (!initialQuota) {
                // Obtener planCode o nombre del plan del contrato
                let planCode = contract.codigoPlan || 
                              contract.planCode || 
                              '';
                let planName = contract.plan || 
                              contract.planNombre || 
                              '';
                
                // Si no hay planCode directo, buscar en planData
                if (!planCode && contract.planData) {
                    try {
                        const planData = typeof contract.planData === 'string' ? 
                                        JSON.parse(contract.planData) : 
                                        contract.planData;
                        planCode = planData.codigo || planData.codigoPlan || '';
                        planName = planData.nombre || planData.planNombre || planName;
                    } catch (e) {
                        console.error('Error obteniendo planCode:', e);
                    }
                }
                
                if (planCode || planName) {
                    try {
                        const planesData = localStorage.getItem('planesData');
                        if (planesData) {
                            const planes = JSON.parse(planesData);
                            let plan = null;
                            
                            // Buscar por código primero
                            if (planCode) {
                                plan = planes[planCode];
                                if (!plan) {
                                    // Buscar en todos los planes por código
                                    plan = Object.values(planes).find(p => 
                                        String(p.codigo || '').trim() === String(planCode).trim() ||
                                        String(p.codigoPlan || '').trim() === String(planCode).trim()
                                    );
                                }
                            }
                            
                            // Si no se encontró por código, buscar por nombre
                            if (!plan && planName) {
                                plan = Object.values(planes).find(p => {
                                    const nombre = String(p.nombre || '').trim().toLowerCase();
                                    const searchName = String(planName).trim().toLowerCase();
                                    return nombre === searchName || nombre.includes(searchName) || searchName.includes(nombre);
                                });
                            }
                            
                            if (plan) {
                                initialQuota = plan.cuotaInicial || 
                                             plan.cuotaInicialValor ||
                                             plan.valorInicial ||
                                             0;
                                console.log('💰 Cuota inicial encontrada en plan:', initialQuota);
                            } else {
                                console.warn('⚠️ Plan no encontrado con código:', planCode, 'o nombre:', planName);
                            }
                        }
                    } catch (e) {
                        console.error('Error buscando cuota inicial en plan:', e);
                    }
                } else {
                    console.warn('⚠️ No se encontró planCode ni nombre del plan en el contrato');
                }
            }
        }
        
        // Si encontramos un valor en el contrato/plan, usarlo; si no, usar el de la factura
        if (shouldSearchInContract && contract && initialQuota > 0) {
            console.log('✅ Usando cuota inicial del contrato/plan (valor de factura era muy pequeño o no existía)');
        } else if (invoiceInitialQuota > 0 && !shouldSearchInContract) {
            initialQuota = invoiceInitialQuota;
            console.log('✅ Usando cuota inicial de la factura');
        }
        
        console.log('✅ Cuota inicial final:', initialQuota);
        
        if (initialQuota && initialQuota > 0) {
            initialQuotaInput.value = formatCurrencyInput(initialQuota);
            console.log('✅ Cuota inicial cargada en el input:', initialQuotaInput.value);
        } else {
            console.warn('⚠️ No se encontró cuota inicial o es 0');
            initialQuotaInput.value = '';
        }
    }

    // Cargar fecha final - prioridad: factura > nómina actual > plan
    const endDateInput = document.getElementById('invoiceEndDate');
    if (endDateInput) {
        let endDate = '';
        
        // 1. Si hay factura, buscar en la factura primero
        if (invoice) {
            endDate = invoice.endDate || 
                     invoice.fechaFinal || 
                     invoice.lastPaymentDate ||
                     invoice.fechaFin || '';
        }
        
        // 2. Si no está en la factura, usar la fecha final de la nómina actual
        if (!endDate && currentPayrollId) {
            const payroll = payrollData.find(p => p.id === currentPayrollId);
            if (payroll && payroll.fechaFin) {
                endDate = payroll.fechaFin;
            }
        }
        
        // 3. Si aún no hay fecha, calcular desde el plan (solo como último recurso)
        if (!endDate && contract && contract.planData) {
            try {
                const planData = typeof contract.planData === 'string' ? 
                                JSON.parse(contract.planData) : 
                                contract.planData;
                
                // Si hay fecha inicial y número de cuotas, calcular fecha final
                if (planData.fechaInicial && planData.numCuotas) {
                    const startDate = new Date(planData.fechaInicial);
                    const numCuotas = parseInt(planData.numCuotas) || 0;
                    // Asumir que cada cuota es mensual
                    startDate.setMonth(startDate.getMonth() + numCuotas);
                    endDate = startDate.toISOString().split('T')[0];
                }
            } catch (e) {
                console.error('Error calculando fecha final:', e);
            }
        }
        
        // Solo actualizar si encontramos una fecha y el campo está vacío o si es una factura existente
        if (endDate) {
            // Si es una factura existente, siempre actualizar
            // Si es una nueva factura y el campo está vacío, actualizar
            if (invoice || !endDateInput.value) {
                const date = new Date(endDate);
                if (!isNaN(date.getTime())) {
                    endDateInput.value = date.toISOString().split('T')[0];
                } else {
                    endDateInput.value = endDate;
                }
            }
        }
    }

    // Las escalas de la factura se cargan desde loadContractForInvoice
    // No necesitamos hacer nada aquí porque ya se maneja arriba
}

function loadInvoiceScales(savedScales) {
    console.log('🔄 Cargando escalas guardadas de la factura:', savedScales);
    
    // Actualizar los valores de las escalas con los valores guardados en la factura
    if (!currentScales || currentScales.length === 0) {
        console.log('⚠️ No hay escalas cargadas aún, no se pueden aplicar los valores guardados');
        return;
    }

    console.log('✅ Escalas disponibles:', currentScales.length);
    
    savedScales.forEach(savedScale => {
        const scaleCode = savedScale.codigo || savedScale.codigoEscala || '';
        const scaleName = (savedScale.nombre || savedScale.nombreEscala || '').toLowerCase();
        const savedValue = savedScale.valor || savedScale.valorEscala || 0;
        const savedEmpleadoId = savedScale.empleadoId || null;
        const savedEmpleadoNombre = savedScale.empleadoNombre || null;

        console.log('🔍 Buscando escala:', { codigo: scaleCode, nombre: scaleName, valor: savedValue, empleadoNombre: savedEmpleadoNombre });

        // Buscar la escala correspondiente en currentScales por código o nombre
        const scaleIndex = currentScales.findIndex(s => {
            const sCode = String(s.codigo || s.codigoEscala || '').trim();
            const sName = String(s.nombre || s.nombreEscala || '').toLowerCase().trim();
            const savedCode = String(scaleCode).trim();
            const savedName = scaleName.trim();
            
            return sCode === savedCode || 
                   sName === savedName ||
                   (sCode && savedCode && sCode.toLowerCase() === savedCode.toLowerCase()) ||
                   (sName && savedName && sName === savedName);
        });

        if (scaleIndex !== -1) {
            console.log('✅ Escala encontrada en índice:', scaleIndex);
            // Actualizar valores
            currentScales[scaleIndex].valor = savedValue;
            currentScales[scaleIndex].valorEscala = savedValue;
            
            // Actualizar información del empleado si existe
            if (savedEmpleadoNombre) {
                currentScales[scaleIndex].empleadoNombre = savedEmpleadoNombre;
                console.log('✅ Nombre de empleado restaurado:', savedEmpleadoNombre);
            }
            if (savedEmpleadoId) {
                currentScales[scaleIndex].empleadoId = savedEmpleadoId;
            }

            // Actualizar el input visual - buscar por código o nombre en el DOM
            const scaleItems = document.querySelectorAll('.scale-item');
            scaleItems.forEach((item) => {
                const codeElement = item.querySelector('.scale-code');
                const nameFullElement = item.querySelector('.scale-name-full');
                const nameElement = item.querySelector('.scale-name');
                
                if (codeElement || nameFullElement || nameElement) {
                    const itemCode = codeElement ? String(codeElement.textContent).trim() : '';
                    const itemNameFull = nameFullElement ? String(nameFullElement.textContent).toLowerCase().trim() : '';
                    const itemName = nameElement ? String(nameElement.textContent).toLowerCase().trim() : '';
                    const savedCode = String(scaleCode).trim();
                    const savedName = scaleName.trim();
                    
                    const matches = itemCode === savedCode || 
                                   itemNameFull === savedName ||
                                   itemName === savedName ||
                                   (itemCode && savedCode && itemCode.toLowerCase() === savedCode.toLowerCase()) ||
                                   (itemNameFull && savedName && itemNameFull === savedName) ||
                                   (itemName && savedName && itemName === savedName);
                    
                    if (matches) {
                        const scaleInput = item.querySelector('.scale-value-input');
                        if (scaleInput) {
                            scaleInput.value = formatCurrencyInput(savedValue);
                            // Actualizar también el índice en el dataset
                            scaleInput.dataset.scaleIndex = scaleIndex;
                            console.log('✅ Valor actualizado en el input:', savedValue);
                        }
                        
                        // Actualizar el nombre del empleado en el DOM si existe
                        const employeeNameElement = item.querySelector('.scale-employee-name');
                        if (employeeNameElement && savedEmpleadoNombre) {
                            employeeNameElement.textContent = savedEmpleadoNombre;
                            console.log('✅ Nombre de empleado actualizado en el DOM:', savedEmpleadoNombre);
                        }
                    }
                }
            });
        } else {
            console.warn('⚠️ No se encontró escala con código/nombre:', scaleCode, scaleName);
        }
    });
    
    // Re-renderizar las escalas para asegurar que todos los cambios se reflejen correctamente
    const scalesToRender = currentScales.map(s => ({ ...s }));
    renderScales(scalesToRender);
    currentScales.length = 0;
    currentScales.push(...scalesToRender);
    
    console.log('✅ Proceso de carga de escalas completado');
}

// ========================================
// GESTIÓN DE FACTURAS
// ========================================

/**
 * Carga los datos del contrato para una factura
 * 
 * Esta función busca el contrato por número y carga automáticamente:
 * - Cuota inicial (desde el plan del contrato)
 * - Fecha final (desde la factura o nómina)
 * - Escalas (combinando nombres del ejecutivo con valores del plan)
 * 
 * FLUJO:
 * 1. Busca el contrato por número
 * 2. Obtiene el planCode del contrato
 * 3. Obtiene el ejecutivoId del contrato
 * 4. Carga escalas combinadas (nombres + valores)
 * 
 * @param {string} contractNumber - Número del contrato
 * @param {Object} invoice - Factura existente (opcional)
 * @returns {void}
 */
function loadContractForInvoice(contractNumber, invoice) {
    const contractInput = document.getElementById('invoiceContract');
    if (!contractInput) return;

    const cityCode = getSelectedCityCode();
    if (!cityCode) return;

    try {
        // Cargar contratos desde localStorage
        const storedContracts = localStorage.getItem(`contratos_${cityCode}`) || 
                                localStorage.getItem(`contracts_${cityCode}`);
        
        if (!storedContracts) {
            showNotification('No se encontraron contratos para esta ciudad', 'warning');
            contractInput.value = '';
            return;
        }

        const contracts = JSON.parse(storedContracts);
        const contractsArray = Array.isArray(contracts) ? contracts : Object.values(contracts);

        // Normalizar el número de contrato para búsqueda
        const searchNumber = String(contractNumber).trim();
        let foundContract = null;

        // Buscar el contrato específico asociado a la factura
        for (const contract of contractsArray) {
            const numeroContrato = contract.numeroContrato || 
                                 contract.numero || 
                                 contract.contractNumber || 
                                 contract.nro || 
                                 contract.contract || '';
            
            const contractId = String(contract.id || '').trim();
            
            // Buscar por número de contrato o por ID
            if (String(numeroContrato).trim() === searchNumber || 
                contractId === searchNumber ||
                String(contract.id) === searchNumber) {
                foundContract = contract;
                break;
            }
        }

        if (!foundContract) {
            showNotification(`No se encontró el contrato ${contractNumber} para esta ciudad`, 'warning');
            contractInput.value = '';
            return;
        }

        // Obtener número de contrato y nombre del titular para mostrar
        const numeroContrato = foundContract.numeroContrato || 
                             foundContract.numero || 
                             foundContract.contractNumber || 
                             foundContract.nro || 
                             foundContract.contract || '';
        
        const titularNombre = foundContract.titularNombre || 
                            foundContract.titular || 
                            foundContract.clientName || 
                            'Sin titular';
        
        // Mostrar el contrato en el input (solo lectura)
        contractInput.value = `#${numeroContrato} - ${titularNombre}`;
        
        // Obtener código del plan para cargar las escalas
        let planCode = foundContract.codigoPlan || 
                        foundContract.planCode || 
                        '';
        
        console.log('🔍 Buscando planCode en contrato:', {
            codigoPlan: foundContract.codigoPlan,
            planCode: foundContract.planCode,
            planData: foundContract.planData ? typeof foundContract.planData : 'no existe',
            planCodeInicial: planCode
        });
        
        // Si no hay planCode directo, buscar en planData
        if (!planCode && foundContract.planData) {
            if (typeof foundContract.planData === 'object' && foundContract.planData.codigo) {
                planCode = foundContract.planData.codigo;
                console.log('✅ PlanCode encontrado en planData (objeto):', planCode);
            } else if (typeof foundContract.planData === 'string') {
                try {
                    const planData = JSON.parse(foundContract.planData);
                    if (planData && planData.codigo) {
                        planCode = planData.codigo;
                        console.log('✅ PlanCode encontrado en planData (string parseado):', planCode);
                    }
                } catch (e) {
                    console.error('❌ Error parseando planData:', e);
                }
            }
        }
        
        // Si aún no hay planCode, buscar por nombre del plan
        if (!planCode) {
            const planName = foundContract.plan || 
                            foundContract.planName || 
                            foundContract.nombrePlan || 
                            (invoice && invoice.plan) || 
                            '';
            
            if (planName) {
                console.log('🔍 No hay planCode, buscando plan por nombre:', planName);
                try {
                    const planesData = localStorage.getItem('planesData');
                    if (planesData) {
                        const planes = JSON.parse(planesData);
                        // Buscar el plan por nombre
                        const plan = Object.values(planes).find(p => {
                            const nombre = String(p.nombre || '').trim().toLowerCase();
                            const searchName = String(planName).trim().toLowerCase();
                            return nombre === searchName || 
                                   nombre.includes(searchName) || 
                                   searchName.includes(nombre);
                        });
                        
                        if (plan) {
                            planCode = plan.codigo || plan.codigoPlan || '';
                            console.log('✅ Plan encontrado por nombre, código:', planCode);
                        } else {
                            console.warn('⚠️ No se encontró plan con nombre:', planName);
                        }
                    }
                } catch (e) {
                    console.error('❌ Error buscando plan por nombre:', e);
                }
            }
        }
        
        console.log('📋 PlanCode final:', planCode);
        
        // Obtener el ejecutivo: primero de la factura (si existe), luego del contrato
        let ejecutivoId = '';
        if (invoice && (invoice.ejecutivoId || invoice.executiveId)) {
            ejecutivoId = invoice.ejecutivoId || invoice.executiveId || '';
            console.log('✅ Usando ejecutivoId de la factura:', ejecutivoId);
        } else {
            // Intentar obtener el ID del ejecutivo del contrato
            ejecutivoId = foundContract.executiveId || 
                         foundContract.ejecutivoId || '';
            console.log('🔍 Buscando ejecutivoId en contrato:', {
                executiveId: foundContract.executiveId,
                ejecutivoId: foundContract.ejecutivoId,
                ejecutivo: foundContract.executive || foundContract.ejecutivo,
                ejecutivoIdEncontrado: ejecutivoId
            });
            // Si no hay ID, intentar obtener el nombre y luego buscar el ID
            if (!ejecutivoId) {
                const ejecutivoNombre = foundContract.executive || foundContract.ejecutivo || '';
                if (ejecutivoNombre) {
                    console.log('⚠️ No hay ejecutivoId en el contrato, buscando por nombre:', ejecutivoNombre);
                    // Buscar el ID del ejecutivo por su nombre
                    try {
                        const empleadosByCity = localStorage.getItem('empleadosByCity');
                        if (empleadosByCity) {
                            const data = JSON.parse(empleadosByCity);
                            if (data[cityCode]) {
                                const empleados = data[cityCode];
                                for (const [cedula, emp] of Object.entries(empleados)) {
                                    const nombreCompleto = [
                                        emp.tPrimerNombre || emp.primerNombre,
                                        emp.tSegundoNombre || emp.segundoNombre,
                                        emp.tPrimerApellido || emp.primerApellido,
                                        emp.tSegundoApellido || emp.segundoApellido
                                    ].filter(Boolean).join(' ').toUpperCase();
                                    
                                    if (nombreCompleto === ejecutivoNombre.toUpperCase() || 
                                        nombreCompleto.includes(ejecutivoNombre.toUpperCase()) ||
                                        ejecutivoNombre.toUpperCase().includes(nombreCompleto)) {
                                        ejecutivoId = cedula || emp.identificacion || '';
                                        console.log('✅ EjecutivoId encontrado por nombre:', ejecutivoId);
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error buscando ejecutivo por nombre:', e);
                    }
                }
            }
            if (!ejecutivoId) {
                console.log('⚠️ No se pudo obtener ejecutivoId del contrato');
            } else {
                console.log('✅ Usando ejecutivoId del contrato:', ejecutivoId);
            }
        }
        
        // Si hay ejecutivoId, buscar el nombre actualizado del ejecutivo
        if (ejecutivoId) {
            try {
                const empleadosByCity = localStorage.getItem('empleadosByCity');
                if (empleadosByCity) {
                    const data = JSON.parse(empleadosByCity);
                    if (data[cityCode]) {
                        const empleados = data[cityCode];
                        const empleado = empleados[ejecutivoId] || 
                                       Object.values(empleados).find(emp => 
                                           String(emp.identificacion || '').trim() === String(ejecutivoId).trim()
                                       );
                        
                        if (empleado) {
                            const nombreCompleto = [
                                empleado.tPrimerNombre || empleado.primerNombre,
                                empleado.tSegundoNombre || empleado.segundoNombre,
                                empleado.tPrimerApellido || empleado.primerApellido,
                                empleado.tSegundoApellido || empleado.segundoApellido
                            ].filter(Boolean).join(' ').toUpperCase();
                            
                            // Actualizar el ejecutivo en el contrato encontrado con el nombre actualizado
                            foundContract.executive = nombreCompleto;
                            foundContract.ejecutivo = nombreCompleto;
                            foundContract.executiveId = ejecutivoId;
                            foundContract.ejecutivoId = ejecutivoId;
                            
                            console.log('✅ Ejecutivo actualizado del contrato:', nombreCompleto);
                        }
                    }
                }
            } catch (e) {
                console.error('Error obteniendo nombre del ejecutivo:', e);
            }
        }
        
        // Guardar el contrato encontrado para usarlo después
        window.__currentContractForInvoice = foundContract;
        
        // Guardar también el ejecutivoId para usarlo después
        if (ejecutivoId) {
            foundContract.executiveId = ejecutivoId;
            foundContract.ejecutivoId = ejecutivoId;
        }
        
        // Cargar las escalas combinando nombres del ejecutivo con valores del plan
        console.log('🔍 Verificando datos para cargar escalas:', {
            ejecutivoId: ejecutivoId,
            planCode: planCode,
            cityCode: cityCode,
            tieneEjecutivo: !!ejecutivoId,
            tienePlan: !!planCode
        });
        
        // Mostrar mensaje de carga inicial
        const scalesContainer = document.getElementById('scalesContainer');
        if (scalesContainer) {
            scalesContainer.innerHTML = '<div class="no-scales-message"><p>Cargando escalas...</p></div>';
        }
        
        // Si tenemos ejecutivo y planCode, intentar cargar escalas combinadas
        // Si solo tenemos ejecutivo, intentar cargar escalas del ejecutivo (que buscará el plan si no hay escalasData)
        // Si solo tenemos planCode, cargar escalas del plan
        if (ejecutivoId && planCode) {
            console.log('🔄 Cargando escalas combinadas: nombres del ejecutivo + valores del plan');
            // Combinar escalas del ejecutivo (nombres) con escalas del plan (valores)
            loadCombinedScales(ejecutivoId, planCode, cityCode, invoice);
            // Cargar los demás datos (cuota inicial, fecha final)
            loadInvoiceAdditionalData(invoice, foundContract);
        } else if (ejecutivoId) {
            console.log('🔄 Cargando escalas del ejecutivo (buscará plan si no hay escalasData):', ejecutivoId);
            // Cargar escalas del ejecutivo - si no tiene escalasData, buscará el plan automáticamente
            loadExecutiveScales(ejecutivoId, cityCode);
            // Cargar los demás datos (cuota inicial, fecha final)
            loadInvoiceAdditionalData(invoice, foundContract);
        } else if (planCode) {
            // Si no hay ejecutivo, cargar escalas del plan como fallback
            console.log('⚠️ No hay ejecutivoId, cargando escalas del plan como fallback');
            // Cargar escalas directamente sin delay - loadPlanScales aplicará las escalas de la factura automáticamente
            loadPlanScales(planCode);
            // Cargar los demás datos (cuota inicial, fecha final)
            loadInvoiceAdditionalData(invoice, foundContract);
        } else {
            // Si no hay plan ni ejecutivo, solo cargar los demás datos
            console.log('⚠️ No hay ejecutivo ni plan, solo cargando datos adicionales');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>No se encontró ejecutivo ni plan asociado al contrato</p></div>';
            }
            // Si hay escalas guardadas en la factura, usarlas directamente
            if (invoice && invoice.escalas && Array.isArray(invoice.escalas) && invoice.escalas.length > 0) {
                renderScalesFromInvoice(invoice.escalas);
            }
            loadInvoiceAdditionalData(invoice, foundContract);
        }

    } catch (e) {
        console.error('Error cargando contrato:', e);
        showNotification('Error al cargar el contrato', 'error');
        contractInput.value = '';
    }
}

function loadContractsForInvoice() {
    const select = document.getElementById('invoiceContract');
    if (!select) return;

    const cityCode = getSelectedCityCode();
    if (!cityCode) return;

    select.innerHTML = '<option value="">Seleccione un contrato</option>';

    try {
        // Cargar contratos desde localStorage
        const storedContracts = localStorage.getItem(`contratos_${cityCode}`) || 
                                localStorage.getItem(`contracts_${cityCode}`);
        
        if (storedContracts) {
            const contracts = JSON.parse(storedContracts);
            const contractsArray = Array.isArray(contracts) ? contracts : Object.values(contracts);

            contractsArray.forEach(contract => {
                // Buscar número de contrato en múltiples campos posibles
                const numeroContrato = contract.numeroContrato || 
                                     contract.numero || 
                                     contract.contractNumber || 
                                     contract.nro || 
                                     contract.contract || '';
                
                if (contract && numeroContrato) {
                    // Obtener código del plan - buscar en múltiples campos
                    const planCode = contract.codigoPlan || 
                                   contract.planCode || 
                                   (contract.planData && typeof contract.planData === 'object' && contract.planData.codigo) ||
                                   (contract.planData && typeof contract.planData === 'string' && (() => {
                                       try {
                                           const parsed = JSON.parse(contract.planData);
                                           return parsed.codigo;
                                       } catch(e) { return ''; }
                                   })()) ||
                                   '';
                    
                    const option = document.createElement('option');
                    option.value = numeroContrato;
                    const titularNombre = contract.titularNombre || 
                                        contract.titular || 
                                        contract.clientName || 
                                        'Sin titular';
                    option.textContent = `#${numeroContrato} - ${titularNombre}`;
                    option.dataset.planCode = planCode;
                    // Guardar también el ID del contrato por si acaso
                    option.dataset.contractId = contract.id || '';
                    select.appendChild(option);
                }
            });
        }
    } catch (e) {
        console.error('Error cargando contratos:', e);
    }
}

function handleContractChange() {
    const select = document.getElementById('invoiceContract');
    if (!select) return;
    
    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
        const scalesContainer = document.getElementById('scalesContainer');
        if (scalesContainer) {
            scalesContainer.innerHTML = '<div class="no-scales-message"><p>Seleccione un contrato para cargar las escalas del plan</p></div>';
        }
        currentScales = [];
        return;
    }
    
    const planCode = selectedOption.dataset.planCode;

    if (!planCode) {
        const scalesContainer = document.getElementById('scalesContainer');
        if (scalesContainer) {
            scalesContainer.innerHTML = '<div class="no-scales-message"><p>Este contrato no tiene plan asociado</p></div>';
        }
        currentScales = [];
        return;
    }

    // Cargar escalas del plan
    loadPlanScales(planCode);
}

/**
 * Carga las escalas combinando nombres del ejecutivo con valores del plan
 * @param {string} ejecutivoId - ID del ejecutivo
 * @param {string} planCode - Código del plan
 * @param {string} cityCode - Código de la ciudad
 * @param {Object} invoice - Factura (opcional, para aplicar valores guardados)
 */
/**
 * Carga escalas combinadas: nombres de ejecutivos + valores del plan
 * 
 * Esta función combina los nombres de los ejecutivos (desde escalasData del empleado PYF)
 * con los valores de las escalas (desde el plan).
 * 
 * FLUJO:
 * 1. Obtiene el empleado PYF por ejecutivoId
 * 2. Obtiene el plan por planCode
 * 3. Combina escalasData (nombres de empleados) con escalas del plan (valores)
 * 4. Renderiza las escalas en la interfaz
 * 
 * @param {string} ejecutivoId - ID del ejecutivo PYF
 * @param {string} planCode - Código del plan
 * @param {string} cityCode - Código de la ciudad
 * @param {Object} invoice - Factura existente (opcional, para cargar valores guardados)
 * @returns {void}
 */
function loadCombinedScales(ejecutivoId, planCode, cityCode, invoice) {
    // Guardar planCode para usar en catch
    const savedPlanCode = planCode;
    
    try {
        console.log('🔄 Combinando escalas: ejecutivo', ejecutivoId, 'con plan', planCode);
        
        // Validar parámetros
        if (!planCode) {
            console.error('❌ No se proporcionó planCode');
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>Error: No se proporcionó código de plan</p></div>';
            }
            return;
        }
        
        // Mostrar mensaje de carga inicial
        const scalesContainer = document.getElementById('scalesContainer');
        if (scalesContainer) {
            scalesContainer.innerHTML = '<div class="no-scales-message"><p>Cargando escalas...</p></div>';
        }
        
        // 1. Obtener escalas del plan (valores)
        const planesData = localStorage.getItem('planesData');
        if (!planesData) {
            console.warn('❌ No hay planesData en localStorage');
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>No se encontraron planes en el sistema</p></div>';
            }
            currentScales = [];
            return;
        }
        
        const planes = JSON.parse(planesData);
        let plan = planes[planCode];
        
        if (!plan) {
            const planesArray = Object.values(planes);
            plan = planesArray.find(p => {
                const codigo = String(p.codigo || '').trim();
                const codigoPlan = String(p.codigoPlan || '').trim();
                const searchCode = String(planCode).trim();
                return codigo === searchCode || codigoPlan === searchCode;
            });
        }
        
        if (!plan) {
            console.warn('❌ Plan no encontrado con código:', planCode);
            console.log('📊 Planes disponibles:', Object.keys(planes));
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>Plan no encontrado con código: ' + planCode + '</p></div>';
            }
            currentScales = [];
            return;
        }
        
        if (!plan.escalas) {
            console.warn('❌ Plan encontrado pero no tiene escalas definidas');
            console.log('📋 Plan:', plan);
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>El plan no tiene escalas definidas</p></div>';
            }
            currentScales = [];
            return;
        }
        
        console.log('✅ Plan encontrado:', plan.codigo || plan.codigoPlan, 'con escalas:', typeof plan.escalas);
        
        // 2. Obtener escalas del ejecutivo (identificaciones de empleados)
        const empleadosByCityRaw = localStorage.getItem('empleadosByCity');
        if (!empleadosByCityRaw) {
            console.warn('❌ No hay datos de empleados en localStorage');
            // Si no hay empleados, usar solo las escalas del plan
            loadPlanScales(planCode);
            return;
        }
        
        const empleadosByCity = JSON.parse(empleadosByCityRaw);
        const empleados = empleadosByCity[cityCode] || {};
        
        // Buscar el ejecutivo
        const ejecutivoIdClean = String(ejecutivoId).trim();
        let empleado = empleados[ejecutivoIdClean];
        
        if (!empleado) {
            for (const [cedula, emp] of Object.entries(empleados)) {
                const cedulaClean = String(cedula).trim();
                const cedulaNumeric = cedulaClean.replace(/\D/g, '');
                const ejecutivoIdNumeric = ejecutivoIdClean.replace(/\D/g, '');
                
                if (cedulaClean === ejecutivoIdClean || 
                    cedulaNumeric === ejecutivoIdNumeric) {
                    empleado = emp;
                    break;
                }
                
                const empId = String(emp.identificacion || '').trim();
                if (empId === ejecutivoIdClean) {
                    empleado = emp;
                    break;
                }
            }
        }
        
        if (!empleado) {
            console.warn('⚠️ Ejecutivo no encontrado con ID:', ejecutivoIdClean);
            console.log('📊 Empleados disponibles en ciudad:', Object.keys(empleados).length);
            console.log('🔄 Usando solo escalas del plan (sin nombres de ejecutivo)');
            loadPlanScales(planCode);
            return;
        }
        
        // Verificar escalasData - puede estar en diferentes campos
        let escalasData = empleado.escalasData || empleado.escalas || empleado.scales || null;
        
        console.log('📋 Empleado encontrado:', {
            identificacion: empleado.identificacion,
            nombre: `${empleado.primerNombre || ''} ${empleado.primerApellido || ''}`,
            area: empleado.area,
            tieneEscalasData: !!empleado.escalasData,
            tieneEscalas: !!empleado.escalas,
            tieneScales: !!empleado.scales,
            escalasValue: empleado.escalas,
            todosLosCampos: Object.keys(empleado)
        });
        
        // Log detallado de todos los campos del empleado
        console.log('📋 TODOS LOS CAMPOS DEL EMPLEADO:', empleado);
        console.log('📋 Empleado.escalasData:', empleado.escalasData);
        console.log('📋 Empleado.escalas:', empleado.escalas);
        console.log('📋 Empleado.scales:', empleado.scales);
        
        // Buscar cualquier campo que contenga "escala" en su nombre
        const camposConEscala = Object.keys(empleado).filter(key => 
            key.toLowerCase().includes('escala') || key.toLowerCase().includes('scale')
        );
        console.log('📋 Campos que contienen "escala" o "scale":', camposConEscala);
        if (camposConEscala.length > 0) {
            camposConEscala.forEach(campo => {
                console.log(`📋 ${campo}:`, empleado[campo]);
            });
        }
        
        if (!escalasData) {
            console.warn('⚠️ Ejecutivo encontrado pero no tiene escalasData/escalas/scales');
            console.log('📋 Empleado completo:', empleado);
            console.log('🔄 Usando solo escalas del plan (sin nombres de ejecutivo)');
            loadPlanScales(planCode);
            return;
        }
        
        console.log('✅ Ejecutivo encontrado con escalasData:', Object.keys(escalasData));
        
        // Guardar escalasData para usar más abajo
        const empleadoEscalasData = escalasData;
        
        // 3. Combinar escalas: nombres del ejecutivo + valores del plan
        const escalasMap = {
            asesor: { codigo: 'ASESOR', nombre: 'Asesor' },
            supervisor: { codigo: 'SUPERVISOR', nombre: 'Supervisor' },
            subgerente: { codigo: 'SUBGERENTE', nombre: 'Subgerente' },
            gerente: { codigo: 'GERENTE', nombre: 'Gerente' },
            director: { codigo: 'DIRECTOR', nombre: 'Director' },
            subdirectorNacional: { codigo: 'SUBDIRECTOR', nombre: 'Subdirector Nacional' },
            directorNacional: { codigo: 'DIRECTOR_NAC', nombre: 'Director Nacional' }
        };
        
        const scales = [];
        
        // Procesar escalas del plan y combinarlas con nombres del ejecutivo
        if (Array.isArray(plan.escalas)) {
            // Si es un array, procesar cada elemento
            plan.escalas.forEach(planEscala => {
                // Buscar la clave correspondiente en escalasMap
                let escalaKey = null;
                const planCodigo = String(planEscala.codigo || planEscala.codigoEscala || '').trim().toUpperCase();
                const planNombre = String(planEscala.nombre || planEscala.nombreEscala || '').trim().toLowerCase();
                
                // Buscar por código
                for (const [key, value] of Object.entries(escalasMap)) {
                    if (planCodigo === value.codigo) {
                        escalaKey = key;
                        break;
                    }
                }
                
                // Si no se encuentra por código, buscar por nombre
                if (!escalaKey) {
                    if (planNombre.includes('asesor')) escalaKey = 'asesor';
                    else if (planNombre.includes('supervisor')) escalaKey = 'supervisor';
                    else if (planNombre.includes('subgerente')) escalaKey = 'subgerente';
                    else if (planNombre.includes('gerente') && !planNombre.includes('sub')) escalaKey = 'gerente';
                    else if (planNombre.includes('director') && planNombre.includes('nacional') && !planNombre.includes('sub')) escalaKey = 'directorNacional';
                    else if (planNombre.includes('subdirector') || (planNombre.includes('director') && planNombre.includes('sub'))) escalaKey = 'subdirectorNacional';
                    else if (planNombre.includes('director') && !planNombre.includes('sub') && !planNombre.includes('nacional')) escalaKey = 'director';
                }
                
                if (!escalaKey) {
                    console.warn('⚠️ No se pudo mapear la escala del plan:', planEscala);
                    return;
                }
                
                // Obtener la identificación del empleado desde escalasData
                const empleadoId = empleadoEscalasData[escalaKey];
                let nombreEmpleado = '';
                
                if (empleadoId) {
                    // Obtener el nombre del empleado por su identificación (ya viene con formato: apellidos primero)
                    nombreEmpleado = getEmployeeNameByIdentification(empleadoId, cityCode);
                }
                
                // Si no se encuentra el nombre, usar el nombre genérico de la escala
                if (!nombreEmpleado) {
                    nombreEmpleado = escalasMap[escalaKey].nombre;
                }
                
                // Crear la escala combinada
                // IMPORTANTE: nombre y nombreEscala deben contener el nombre de la escala (ej: "Gerente", "Director Nacional")
                // El nombre del empleado se obtiene después en renderScales
                scales.push({
                    codigo: escalasMap[escalaKey].codigo,
                    codigoEscala: escalasMap[escalaKey].codigo,
                    nombre: escalasMap[escalaKey].nombre, // Nombre de la escala, no del empleado
                    nombreEscala: escalasMap[escalaKey].nombre, // Nombre de la escala, no del empleado
                    valor: planEscala.valor || planEscala.valorEscala || 0,
                    valorEscala: planEscala.valor || planEscala.valorEscala || 0,
                    // Guardar el ID del empleado para obtener su nombre después
                    empleadoId: empleadoId
                });
            });
        } else if (typeof plan.escalas === 'object') {
            // Si es un objeto, iterar sobre las claves del objeto de escalas del plan
            Object.keys(plan.escalas).forEach(key => {
                // Verificar si esta clave existe en escalasMap
                if (escalasMap.hasOwnProperty(key)) {
                    const valor = plan.escalas[key] || 0;
                    
                    // Obtener la identificación del empleado desde escalasData
                    const empleadoId = empleadoEscalasData[key];
                    let nombreEmpleado = '';
                    
                    if (empleadoId) {
                        // Obtener el nombre del empleado por su identificación (ya viene con formato: apellidos primero)
                        nombreEmpleado = getEmployeeNameByIdentification(empleadoId, cityCode);
                    }
                    
                    // Si no se encuentra el nombre, usar el nombre genérico de la escala
                    if (!nombreEmpleado) {
                        nombreEmpleado = escalasMap[key].nombre;
                    }
                    
                    // Crear la escala combinada
                    // IMPORTANTE: nombre y nombreEscala deben contener el nombre de la escala (ej: "Gerente", "Director Nacional")
                    // El nombre del empleado se obtiene después en renderScales
                    scales.push({
                        codigo: escalasMap[key].codigo,
                        codigoEscala: escalasMap[key].codigo,
                        nombre: escalasMap[key].nombre, // Nombre de la escala, no del empleado
                        nombreEscala: escalasMap[key].nombre, // Nombre de la escala, no del empleado
                        valor: valor,
                        valorEscala: valor,
                        // Guardar el ID del empleado para obtener su nombre después
                        empleadoId: empleadoId
                    });
                }
            });
        }
        
        if (scales.length === 0) {
            console.warn('⚠️ No se generaron escalas combinadas');
            console.log('📋 Plan escalas:', plan.escalas);
            console.log('📋 Empleado escalasData:', empleado.escalasData);
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>No se pudieron cargar las escalas. Intentando cargar solo escalas del plan...</p></div>';
            }
            // Intentar cargar solo las escalas del plan como fallback
            setTimeout(() => {
                loadPlanScales(planCode);
            }, 500);
            currentScales = [];
            return;
        }
        
        console.log('✅ Escalas combinadas cargadas:', scales);
        
        // Renderizar escalas y establecer currentScales
        renderScales(scales);
        currentScales = scales.map(s => ({ ...s }));
        
        // Si hay escalas guardadas en la factura, aplicarlas
        if (invoice && invoice.escalas && Array.isArray(invoice.escalas) && invoice.escalas.length > 0) {
            console.log('📋 Aplicando valores guardados de la factura a las escalas combinadas...');
            loadInvoiceScales(invoice.escalas);
        }
        
    } catch (e) {
        console.error('❌ Error cargando escalas combinadas:', e);
        console.error('❌ Stack trace:', e.stack);
        const scalesContainer = document.getElementById('scalesContainer');
        if (scalesContainer) {
            scalesContainer.innerHTML = '<div class="no-scales-message"><p>Error al cargar las escalas: ' + (e.message || e.toString()) + '</p><p>Intentando cargar solo escalas del plan...</p></div>';
        }
        // Intentar cargar solo las escalas del plan como fallback
        try {
            if (savedPlanCode) {
                setTimeout(() => {
                    loadPlanScales(savedPlanCode);
                }, 500);
            }
        } catch (fallbackError) {
            console.error('❌ Error en fallback:', fallbackError);
        }
        currentScales = [];
    }
}

/**
 * Carga escalas basadas únicamente en los datos del ejecutivo PYF
 * 
 * Esta función carga las escalas desde escalasData del empleado PYF.
 * Si el ejecutivo no tiene escalas configuradas, intenta cargar desde el plan.
 * 
 * @param {string} ejecutivoId - ID del ejecutivo PYF
 * @param {string} cityCode - Código de la ciudad
 * @returns {void}
 */
function loadExecutiveScales(ejecutivoId, cityCode) {
    try {
        console.log('🔍 Buscando escalas del ejecutivo:', ejecutivoId, 'en ciudad:', cityCode);
        
        if (!ejecutivoId || !cityCode) {
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>No se proporcionó ejecutivo o ciudad</p></div>';
            }
            currentScales = [];
            return;
        }
        
        // Buscar el empleado en empleadosByCity
        const empleadosByCityRaw = localStorage.getItem('empleadosByCity');
        if (!empleadosByCityRaw) {
            console.warn('❌ No hay datos de empleados en localStorage');
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>No se encontraron empleados en el sistema</p></div>';
            }
            currentScales = [];
            return;
        }
        
        const empleadosByCity = JSON.parse(empleadosByCityRaw);
        const empleados = empleadosByCity[cityCode] || {};
        
        // Limpiar y normalizar la identificación
        const ejecutivoIdClean = String(ejecutivoId).trim();
        console.log('🔍 Buscando empleado con ID limpio:', ejecutivoIdClean);
        console.log('📊 Total empleados en ciudad:', Object.keys(empleados).length);
        
        // Buscar el empleado por identificación
        let empleado = empleados[ejecutivoIdClean];
        
        if (!empleado) {
            console.log('⚠️ No se encontró directamente, buscando por coincidencia...');
            // Buscar por coincidencia numérica o sin espacios
            for (const [cedula, emp] of Object.entries(empleados)) {
                const cedulaClean = String(cedula).trim();
                const cedulaNumeric = cedulaClean.replace(/\D/g, '');
                const ejecutivoIdNumeric = ejecutivoIdClean.replace(/\D/g, '');
                
                if (cedulaClean === ejecutivoIdClean || 
                    cedulaNumeric === ejecutivoIdNumeric ||
                    cedulaClean.replace(/\s/g, '') === ejecutivoIdClean.replace(/\s/g, '')) {
                    empleado = emp;
                    console.log('✅ Empleado encontrado por coincidencia de cédula:', cedula);
                    break;
                }
                
                // También verificar el campo identificacion dentro del objeto empleado
                const empId = String(emp.identificacion || '').trim();
                const empIdNumeric = empId.replace(/\D/g, '');
                if (empId === ejecutivoIdClean || empIdNumeric === ejecutivoIdNumeric) {
                    empleado = emp;
                    console.log('✅ Empleado encontrado por campo identificacion:', empId);
                    break;
                }
            }
        } else {
            console.log('✅ Empleado encontrado directamente por clave:', ejecutivoIdClean);
        }
        
        // Si aún no se encuentra, buscar en todas las ciudades
        if (!empleado) {
            console.log('⚠️ No se encontró en la ciudad actual, buscando en todas las ciudades...');
            try {
                for (const [city, cityEmpleados] of Object.entries(empleadosByCity)) {
                    if (city === cityCode) continue; // Ya buscamos aquí
                    
                    for (const [cedula, emp] of Object.entries(cityEmpleados)) {
                        const cedulaClean = String(cedula).trim();
                        const cedulaNumeric = cedulaClean.replace(/\D/g, '');
                        const ejecutivoIdNumeric = ejecutivoIdClean.replace(/\D/g, '');
                        
                        if (cedulaClean === ejecutivoIdClean || 
                            cedulaNumeric === ejecutivoIdNumeric) {
                            empleado = emp;
                            console.log('✅ Empleado encontrado en otra ciudad:', city, 'con cédula:', cedula);
                            break;
                        }
                        
                        const empId = String(emp.identificacion || '').trim();
                        if (empId === ejecutivoIdClean) {
                            empleado = emp;
                            console.log('✅ Empleado encontrado en otra ciudad:', city, 'con identificacion:', empId);
                            break;
                        }
                    }
                    if (empleado) break;
                }
            } catch (e) {
                console.error('Error buscando en otras ciudades:', e);
            }
        }
        
        if (!empleado) {
            console.warn('❌ No se encontró el ejecutivo con ID:', ejecutivoIdClean);
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>No se encontró el ejecutivo</p></div>';
            }
            currentScales = [];
            return;
        }
        
        // Verificar que sea un empleado de PYF
        if (empleado.area !== 'pyf') {
            console.warn('⚠️ El ejecutivo no es un empleado de PYF. Área:', empleado.area);
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>El ejecutivo no es un empleado de PYF</p></div>';
            }
            currentScales = [];
            return;
        }
        
        // Verificar que tenga escalas - buscar en múltiples campos posibles
        let escalasData = empleado.escalasData || empleado.escalas || empleado.scales || null;
        
        // Log para debugging - mostrar todos los campos del empleado
        console.log('📋 Campos del empleado:', Object.keys(empleado));
        console.log('📋 Empleado completo:', empleado);
        console.log('🔍 Buscando escalas en:', {
            escalasData: !!empleado.escalasData,
            escalas: !!empleado.escalas,
            scales: !!empleado.scales,
            tieneEscalasData: !!escalasData
        });
        
        if (!escalasData) {
            console.log('ℹ️ El empleado de PYF no tiene escalas configuradas en escalasData');
            
            // Si no hay escalas en el empleado, intentar cargar las escalas del plan como fallback
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                // Intentar obtener el planCode del contrato para cargar escalas del plan
                const currentContract = window.__currentContractForInvoice;
                if (currentContract) {
                    let planCode = currentContract.codigoPlan || 
                                  currentContract.planCode || '';
                    
                    if (!planCode && currentContract.planData) {
                        try {
                            const planData = typeof currentContract.planData === 'string' ? 
                                            JSON.parse(currentContract.planData) : 
                                            currentContract.planData;
                            planCode = planData.codigo || planData.codigoPlan || '';
                        } catch (e) {
                            console.error('Error obteniendo planCode:', e);
                        }
                    }
                    
                    // Si no hay planCode, buscar por nombre del plan
                    if (!planCode) {
                        const planName = currentContract.plan || 
                                        currentContract.planName || 
                                        currentContract.nombrePlan || '';
                        
                        if (planName) {
                            console.log('🔍 Buscando plan por nombre desde loadExecutiveScales:', planName);
                            try {
                                const planesData = localStorage.getItem('planesData');
                                if (planesData) {
                                    const planes = JSON.parse(planesData);
                                    const plan = Object.values(planes).find(p => {
                                        const nombre = String(p.nombre || '').trim().toLowerCase();
                                        const searchName = String(planName).trim().toLowerCase();
                                        return nombre === searchName || 
                                               nombre.includes(searchName) || 
                                               searchName.includes(nombre);
                                    });
                                    
                                    if (plan) {
                                        planCode = plan.codigo || plan.codigoPlan || '';
                                        console.log('✅ Plan encontrado por nombre, código:', planCode);
                                    }
                                }
                            } catch (e) {
                                console.error('❌ Error buscando plan por nombre:', e);
                            }
                        }
                    }
                    
                    if (planCode) {
                        console.log('ℹ️ No hay escalas en el empleado, cargando escalas del plan como fallback:', planCode);
                        loadPlanScales(planCode);
                        return;
                    }
                }
                
                // Si no hay plan, dejar que las escalas de la factura se carguen después
                console.log('ℹ️ No hay escalas en el empleado ni plan disponible, se usarán las escalas de la factura');
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>No se encontraron escalas del ejecutivo ni del plan</p></div>';
            }
            currentScales = [];
            return;
        }
        
        console.log('✅ Ejecutivo encontrado con escalas:', Object.keys(escalasData));
        
        // Convertir escalasData a array de escalas
        const escalasMap = {
            asesor: { codigo: 'ASESOR', nombre: 'Asesor' },
            supervisor: { codigo: 'SUPERVISOR', nombre: 'Supervisor' },
            subgerente: { codigo: 'SUBGERENTE', nombre: 'Subgerente' },
            gerente: { codigo: 'GERENTE', nombre: 'Gerente' },
            director: { codigo: 'DIRECTOR', nombre: 'Director' },
            subdirectorNacional: { codigo: 'SUBDIRECTOR', nombre: 'Subdirector Nacional' },
            directorNacional: { codigo: 'DIRECTOR_NAC', nombre: 'Director Nacional' }
        };
        
        const scales = [];
        Object.keys(escalasMap).forEach(key => {
            if (escalasData.hasOwnProperty(key)) {
                scales.push({
                    codigo: escalasMap[key].codigo,
                    codigoEscala: escalasMap[key].codigo,
                    nombre: escalasMap[key].nombre,
                    nombreEscala: escalasMap[key].nombre,
                    valor: escalasData[key] || 0,
                    valorEscala: escalasData[key] || 0
                });
            }
        });
        
        if (scales.length === 0) {
            console.warn('⚠️ No se encontraron escalas válidas en escalasData');
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>No se encontraron escalas válidas</p></div>';
            }
            currentScales = [];
            return;
        }
        
        console.log('✅ Escalas del ejecutivo cargadas:', scales);
        
        // Renderizar escalas y establecer currentScales inmediatamente
        renderScales(scales);
        currentScales = scales.map(s => ({ ...s })); // Copia para edición
        
        // Si hay escalas guardadas en la factura, aplicarlas inmediatamente
        const invoice = window.__editingInvoiceId ? 
            (() => {
                const payroll = payrollData.find(p => p.id === currentPayrollId);
                return payroll?.facturas?.find(f => f.id === window.__editingInvoiceId);
            })() : null;
        
        if (invoice && invoice.escalas && Array.isArray(invoice.escalas) && invoice.escalas.length > 0) {
            console.log('📋 Aplicando valores guardados de la factura a las escalas base...');
            loadInvoiceScales(invoice.escalas);
        }
        
    } catch (e) {
        console.error('❌ Error cargando escalas del ejecutivo:', e);
        const scalesContainer = document.getElementById('scalesContainer');
        if (scalesContainer) {
            scalesContainer.innerHTML = '<div class="no-scales-message"><p>Error al cargar las escalas del ejecutivo: ' + (e.message || e.toString()) + '</p></div>';
        }
        currentScales = [];
    }
}

/**
 * Carga escalas basadas únicamente en los datos del plan
 * 
 * Esta función carga las escalas desde el plan especificado.
 * Las escalas se muestran con valores pero sin nombres de empleados.
 * 
 * @param {string} planCode - Código del plan
 * @returns {void}
 */
function loadPlanScales(planCode) {
    try {
        console.log('🔍 Buscando escalas para plan:', planCode);
        
        if (!planCode || planCode.trim() === '') {
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>No se proporcionó código de plan</p></div>';
            }
            currentScales = [];
            return;
        }

        const planesData = localStorage.getItem('planesData');
        if (!planesData) {
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>No se encontraron planes en el sistema</p></div>';
            }
            currentScales = [];
            console.warn('No hay planesData en localStorage');
            return;
        }

        const planes = JSON.parse(planesData);
        console.log('📊 Planes disponibles:', Object.keys(planes));
        
        // Buscar el plan por código
        let plan = null;
        
        // Primero buscar directamente por clave
        if (planes[planCode]) {
            plan = planes[planCode];
            console.log('✅ Plan encontrado directamente por clave:', planCode);
        } else {
            // Buscar en todos los planes por código
            const planesArray = Object.values(planes);
            plan = planesArray.find(p => {
                const codigo = String(p.codigo || '').trim();
                const codigoPlan = String(p.codigoPlan || '').trim();
                const searchCode = String(planCode).trim();
                return codigo === searchCode || codigoPlan === searchCode;
            });
            
            if (plan) {
                console.log('✅ Plan encontrado buscando en array');
            } else {
                console.warn('❌ Plan no encontrado con código:', planCode);
                console.log('Códigos disponibles:', planesArray.map(p => p.codigo || p.codigoPlan));
            }
        }

        if (!plan) {
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>Plan no encontrado con código: ' + planCode + '</p></div>';
            }
            currentScales = [];
            return;
        }

        console.log('📋 Plan encontrado:', plan);
        console.log('📋 Escalas del plan:', plan.escalas);
        console.log('📋 Tipo de escalas:', typeof plan.escalas);

        // Las escalas se guardan como objeto con propiedades: asesor, supervisor, etc.
        let scales = [];
        
        if (plan.escalas && typeof plan.escalas === 'object') {
            // Si es un array, usarlo directamente
            if (Array.isArray(plan.escalas)) {
                scales = plan.escalas;
            } else {
                // Si es un objeto, convertirlo a array con estructura estándar
                const escalasMap = {
                    asesor: { codigo: 'ASESOR', nombre: 'Asesor' },
                    supervisor: { codigo: 'SUPERVISOR', nombre: 'Supervisor' },
                    subgerente: { codigo: 'SUBGERENTE', nombre: 'Subgerente' },
                    gerente: { codigo: 'GERENTE', nombre: 'Gerente' },
                    director: { codigo: 'DIRECTOR', nombre: 'Director' },
                    subdirectorNacional: { codigo: 'SUBDIRECTOR', nombre: 'Subdirector Nacional' },
                    directorNacional: { codigo: 'DIRECTOR_NAC', nombre: 'Director Nacional' }
                };
                
                // Convertir objeto de escalas a array
                Object.keys(escalasMap).forEach(key => {
                    if (plan.escalas.hasOwnProperty(key)) {
                        scales.push({
                            codigo: escalasMap[key].codigo,
                            codigoEscala: escalasMap[key].codigo,
                            nombre: escalasMap[key].nombre,
                            nombreEscala: escalasMap[key].nombre,
                            valor: plan.escalas[key] || 0,
                            valorEscala: plan.escalas[key] || 0
                        });
                    }
                });
            }
        }

        if (!scales || scales.length === 0) {
            const scalesContainer = document.getElementById('scalesContainer');
            if (scalesContainer) {
                scalesContainer.innerHTML = '<div class="no-scales-message"><p>Este plan no tiene escalas definidas</p></div>';
            }
            currentScales = [];
            console.warn('El plan no tiene escalas o están vacías:', plan.escalas);
            return;
        }

        console.log('✅ Escalas encontradas y convertidas:', scales);
        console.log('✅ Cantidad de escalas:', scales.length);
        
        // Renderizar escalas y establecer currentScales inmediatamente
        renderScales(scales);
        currentScales = scales.map(s => ({ ...s })); // Copia para edición
        
        // Si hay escalas guardadas en la factura, aplicarlas inmediatamente
        const invoice = window.__editingInvoiceId ? 
            (() => {
                const payroll = payrollData.find(p => p.id === currentPayrollId);
                return payroll?.facturas?.find(f => f.id === window.__editingInvoiceId);
            })() : null;
        
        if (invoice && invoice.escalas && Array.isArray(invoice.escalas) && invoice.escalas.length > 0) {
            console.log('📋 Aplicando valores guardados de la factura a las escalas base...');
            loadInvoiceScales(invoice.escalas);
        }
    } catch (e) {
        console.error('❌ Error cargando escalas del plan:', e);
        const scalesContainer = document.getElementById('scalesContainer');
        if (scalesContainer) {
            scalesContainer.innerHTML = '<div class="no-scales-message"><p>Error al cargar las escalas del plan: ' + (e.message || e.toString()) + '</p></div>';
        }
        currentScales = [];
    }
}

/**
 * Obtiene el nombre del empleado asociado a una escala desde el contrato
 */
function getEmployeeNameForScale(scaleCode, contract, cityCode) {
    if (!contract || !cityCode || !scaleCode) {
        return '';
    }
    
    try {
        // Obtener el empleado de PYF del contrato
        const ejecutivoId = contract.executiveId || contract.ejecutivoId || '';
        if (!ejecutivoId) {
            return '';
        }
        
        // Buscar el empleado en empleadosByCity
        const empleadosByCityRaw = localStorage.getItem('empleadosByCity');
        if (!empleadosByCityRaw) {
            return '';
        }
        
        const empleadosByCity = JSON.parse(empleadosByCityRaw);
        const empleados = empleadosByCity[cityCode] || {};
        
        // Buscar el empleado PYF
        const ejecutivoIdClean = String(ejecutivoId).trim();
        let empleado = empleados[ejecutivoIdClean];
        
        if (!empleado) {
            // Buscar por coincidencia
            for (const [cedula, emp] of Object.entries(empleados)) {
                const cedulaClean = String(cedula).trim();
                const cedulaNumeric = cedulaClean.replace(/\D/g, '');
                const ejecutivoIdNumeric = ejecutivoIdClean.replace(/\D/g, '');
                
                if (cedulaClean === ejecutivoIdClean || cedulaNumeric === ejecutivoIdNumeric) {
                    empleado = emp;
                    break;
                }
                
                const empId = String(emp.identificacion || '').trim();
                if (empId === ejecutivoIdClean) {
                    empleado = emp;
                    break;
                }
            }
        }
        
        if (!empleado || !empleado.escalasData) {
            return '';
        }
        
        // Normalizar el código de escala
        const scaleName = String(scaleCode).trim().toLowerCase();
        
        // Mapeo de códigos/nombres de escala a campos de escalasData del empleado PYF
        let identificacion = '';
        
        if (scaleName.includes('asesor') || scaleName === 'as' || scaleName === 'asesor') {
            identificacion = empleado.escalasData.asesor || '';
        } else if (scaleName.includes('supervisor') || scaleName === 'su' || scaleName === 'supervisor') {
            identificacion = empleado.escalasData.supervisor || '';
        } else if (scaleName.includes('subgerente') || scaleName === 'sg' || scaleName === 'subgerente' || scaleName.includes('sub gerente')) {
            identificacion = empleado.escalasData.subgerente || '';
        } else if ((scaleName.includes('gerente') && !scaleName.includes('sub')) || scaleName === 'gt' || scaleName === 'gerente') {
            identificacion = empleado.escalasData.gerente || '';
        } else if (scaleName.includes('director') && scaleName.includes('nacional') || scaleName === 'dn' || scaleName === 'director nacional') {
            identificacion = empleado.escalasData.directorNacional || '';
        } else if (scaleName.includes('subdirector') || (scaleName.includes('director') && scaleName.includes('sub')) || scaleName === 'sn' || scaleName.includes('sub director')) {
            identificacion = empleado.escalasData.subdirectorNacional || '';
        } else if (scaleName.includes('director') && !scaleName.includes('sub') && !scaleName.includes('nacional') || scaleName === 'dr' || scaleName === 'director') {
            identificacion = empleado.escalasData.director || '';
        }
        
        if (!identificacion) {
            return '';
        }
        
        // Limpiar la identificación
        identificacion = String(identificacion).trim();
        
        if (!identificacion) {
            return '';
        }
        
        // Obtener el nombre del empleado que está en esa escala
        const nombre = getEmployeeNameByIdentification(identificacion, cityCode);
        
        return nombre;
    } catch (e) {
        console.error('Error obteniendo nombre del empleado para escala:', e);
        return '';
    }
}

/**
 * Obtiene el nombre del empleado por su identificación
 */
function getEmployeeNameByIdentification(identificacion, cityCode) {
    try {
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        if (!empleadosByCity) return '';
        
        const data = JSON.parse(empleadosByCity);
        if (!data[cityCode]) return '';
        
        // Normalizar la identificación para buscar
        const idBuscado = String(identificacion).trim();
        const idBuscadoNum = idBuscado.replace(/\D/g, '');
        
        const empleados = data[cityCode];
        
        // Buscar coincidencia exacta primero
        if (empleados[idBuscado]) {
            const empleado = empleados[idBuscado];
            // Formato: Apellidos primero, luego nombres
            const nombreCompleto = [
                empleado.tPrimerApellido || empleado.primerApellido,
                empleado.tSegundoApellido || empleado.segundoApellido,
                empleado.tPrimerNombre || empleado.primerNombre,
                empleado.tSegundoNombre || empleado.segundoNombre
            ].filter(Boolean).join(' ').toUpperCase();
            return nombreCompleto;
        }
        
        // Buscar por coincidencia numérica o parcial
        for (const [id, empleado] of Object.entries(empleados)) {
            const idNormalizado = String(id).trim();
            const idSoloNumeros = idNormalizado.replace(/\D/g, '');
            
            if (idNormalizado === idBuscado || 
                (idSoloNumeros && idSoloNumeros === idBuscadoNum) ||
                idNormalizado.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '')) {
                // Formato: Apellidos primero, luego nombres
                const nombreCompleto = [
                    empleado.tPrimerApellido || empleado.primerApellido,
                    empleado.tSegundoApellido || empleado.segundoApellido,
                    empleado.tPrimerNombre || empleado.primerNombre,
                    empleado.tSegundoNombre || empleado.segundoNombre
                ].filter(Boolean).join(' ').toUpperCase();
                return nombreCompleto;
            }
        }
        
        return '';
    } catch(e) {
        console.error('Error obteniendo nombre del empleado:', e);
        return '';
    }
}

/**
 * Obtiene el objeto completo del empleado por su identificación
 * 
 * Se usa cuando necesitamos, además del nombre, otros datos como el cargo
 * o algún valor de comisión asociado al ejecutivo.
 * 
 * @param {string} identificacion 
 * @param {string} cityCode 
 * @returns {Object|null} empleado o null si no se encuentra
 */
function getEmployeeDataByIdentification(identificacion, cityCode) {
    try {
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        if (!empleadosByCity) return null;
        
        const data = JSON.parse(empleadosByCity);
        if (!data[cityCode]) return null;
        
        // Normalizar la identificación para buscar
        const idBuscado = String(identificacion || '').trim();
        if (!idBuscado) return null;
        const idBuscadoNum = idBuscado.replace(/\D/g, '');
        
        const empleados = data[cityCode];
        
        // Buscar coincidencia exacta primero
        if (empleados[idBuscado]) {
            return empleados[idBuscado];
        }
        
        // Buscar por coincidencia numérica o parcial
        for (const [id, empleado] of Object.entries(empleados)) {
            const idNormalizado = String(id).trim();
            const idSoloNumeros = idNormalizado.replace(/\D/g, '');
            
            if (idNormalizado === idBuscado || 
                (idSoloNumeros && idSoloNumeros === idBuscadoNum) ||
                idNormalizado.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '')) {
                return empleado;
            }
        }
        
        return null;
    } catch (e) {
        console.error('Error obteniendo datos del empleado por identificación:', e);
        return null;
    }
}

/**
 * Renderiza escalas directamente desde una factura cuando no hay escalas base disponibles
 */
function renderScalesFromInvoice(invoiceScales) {
    console.log('🔄 Renderizando escalas directamente desde la factura:', invoiceScales);
    
    const container = document.getElementById('scalesContainer');
    if (!container) return;

    container.innerHTML = '';

    // Obtener el contrato para buscar nombres de empleados
    const contract = window.__currentContractForInvoice;
    const cityCode = getSelectedCityCode();

    // Convertir escalas de la factura al formato estándar
    // Necesitamos obtener los nombres de los empleados desde las escalas del ejecutivo
    const scales = invoiceScales.map((scale, index) => {
        const scaleCode = scale.codigo || scale.codigoEscala || '';
        // Obtener el nombre del empleado asociado a esta escala
        // Priorizar empleadoNombre si existe (fue editado manualmente)
        let employeeName = '';
        if (scale.empleadoNombre) {
            // Si tiene empleadoNombre guardado (de edición), usarlo primero
            employeeName = scale.empleadoNombre;
        } else if (scale.empleadoId) {
            // Si tiene empleadoId pero no empleadoNombre, buscar el nombre
            employeeName = getEmployeeNameByIdentification(scale.empleadoId, cityCode);
        } else if (scaleCode) {
            // Solo buscar desde el contrato si tiene código (escala del plan)
            employeeName = getEmployeeNameForScale(scaleCode, contract, cityCode);
        }
        
        // Si la escala no tiene código, es una escala nueva añadida manualmente
        // Preservar el nombre exacto que se guardó
        let nombreEscala = scale.nombre || scale.nombreEscala || '';
        if (!scaleCode && !nombreEscala) {
            // Si no tiene código ni nombre, es una escala completamente nueva
            nombreEscala = '';
        } else if (scaleCode && !nombreEscala) {
            // Si tiene código pero no nombre, usar el mapa de escalas
            const escalaMap = {
                'ASESOR': 'Asesor',
                'SUPERVISOR': 'Supervisor',
                'SUBGERENTE': 'Subgerente',
                'GERENTE': 'Gerente',
                'DIRECTOR': 'Director',
                'SUBDIRECTOR': 'Subdirector Nacional',
                'DIRECTOR_NAC': 'Director Nacional'
            };
            nombreEscala = escalaMap[scaleCode] || '';
        }
        // Si ya tiene nombre guardado, usarlo (preserva escalas nuevas y editadas)
        
        return {
            codigo: scaleCode,
            codigoEscala: scaleCode,
            nombre: nombreEscala, // Preservar el nombre exacto guardado
            nombreEscala: nombreEscala,
            valor: scale.valor || scale.valorEscala || 0,
            valorEscala: scale.valor || scale.valorEscala || 0,
            empleadoId: scale.empleadoId || null,
            empleadoNombre: employeeName || scale.empleadoNombre || null // Usar el nombre encontrado o el guardado
        };
    });

    renderScales(scales);
    currentScales = scales.map(s => ({ ...s })); // Copia para edición
    
    // Mostrar botón de editar escalas
    const btnEditarEscalas = document.getElementById('btnEditarEscalas');
    if (btnEditarEscalas && scales.length > 0) {
        btnEditarEscalas.style.display = 'inline-block';
    }
    
    console.log('✅ Escalas renderizadas desde la factura:', currentScales.length);
}

/**
 * Renderiza las escalas en la interfaz
 * 
 * Crea los elementos HTML para mostrar cada escala con:
 * - Nombre de la escala (ej: "Asesor", "Gerente")
 * - Nombre del empleado asociado
 * - Campo de input para el valor de la comisión
 * 
 * @param {Array<Object>} scales - Array de escalas a renderizar
 * @returns {void}
 */
function renderScales(scales) {
    const container = document.getElementById('scalesContainer');
    if (!container) return;

    container.innerHTML = '';

    // Obtener el contrato para buscar nombres de empleados
    const contract = window.__currentContractForInvoice;
    const cityCode = getSelectedCityCode();

    scales.forEach((scale, index) => {
        const scaleItem = document.createElement('div');
        scaleItem.className = 'scale-item';
        const scaleValue = scale.valor || scale.valorEscala || 0;
        const scaleCode = scale.codigo || scale.codigoEscala || '';
        // Priorizar el nombre guardado (nombre o nombreEscala)
        // Si tiene un nombre personalizado guardado, usarlo; si no, usar el código como fallback
        let scaleName = scale.nombre || scale.nombreEscala || '';
        const hasCustomName = scaleName && scaleName.trim() !== '' && scaleName !== 'Sin nombre';
        
        // Si no hay nombre personalizado, usar el código o "Sin nombre"
        if (!hasCustomName) {
            scaleName = scaleCode || 'Sin nombre';
        }
        
        const employeeId = scale.empleadoId || '';
        
        // Obtener el nombre del empleado asociado a esta escala
        // Priorizar empleadoNombre si existe (fue editado manualmente)
        let employeeName = '';
        if (scale.empleadoNombre) {
            // Si tiene empleadoNombre guardado (de edición), usarlo primero
            employeeName = scale.empleadoNombre;
        } else if (scale.empleadoId) {
            // Si tiene empleadoId, buscar el nombre desde la base de datos
            employeeName = getEmployeeNameByIdentification(scale.empleadoId, cityCode);
        } else {
            // Si no tiene ninguno, buscar desde el contrato (fallback)
            employeeName = getEmployeeNameForScale(scaleCode, contract, cityCode);
        }
        
        // En la vista principal, todos los campos son solo lectura (no editables)
        // Solo se pueden editar en el modal "Editar Escalas"
        const scaleNameDisplay = `<div class="scale-name-full">${scaleName || scaleCode || 'N/A'}</div>`;
        const employeeNameDisplay = `<div class="scale-employee-name">${employeeName || '—'}</div>`;
        const employeeIdDisplay = `<div class="scale-employee-id">${employeeId || '—'}</div>`;
        const scaleValueDisplay = `<div class="scale-value-display">${formatCurrencyInput(scaleValue)}</div>`;
        
        scaleItem.innerHTML = `
            ${scaleNameDisplay}
            ${employeeIdDisplay}
            ${employeeNameDisplay}
            ${scaleValueDisplay}
            <button 
                type="button" 
                class="btn-remove-scale" 
                onclick="removeScale(${index})"
                title="Eliminar escala"
            >
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(scaleItem);
    });

    // Agregar botón de añadir escala al final del contenedor (solo si no existe)
    let addScaleButton = container.querySelector('.btn-add-scale');
    if (!addScaleButton) {
        addScaleButton = document.createElement('button');
        addScaleButton.type = 'button';
        addScaleButton.className = 'btn btn-add-scale';
        addScaleButton.innerHTML = '<i class="fas fa-plus"></i> Añadir Escala';
        addScaleButton.onclick = addScale;
        container.appendChild(addScaleButton);
    }

    // Mostrar botón de editar escalas si hay escalas
    const btnEditarEscalas = document.getElementById('btnEditarEscalas');
    if (btnEditarEscalas) {
        if (scales && scales.length > 0) {
            btnEditarEscalas.style.display = 'inline-block';
        } else {
            btnEditarEscalas.style.display = 'none';
        }
    }

    // En la vista principal no hay inputs editables, solo visualización
    // Los campos solo se pueden editar en el modal "Editar Escalas"
}

// ========================================
// GESTIÓN DE ESCALAS (AÑADIR/ELIMINAR)
// ========================================

/**
 * Añade una nueva escala vacía a la lista
 */
function addScale() {
    if (!currentScales) {
        currentScales = [];
    }

    // Crear una nueva escala vacía
    const newScale = {
        codigo: '',
        codigoEscala: '',
        nombre: '',
        nombreEscala: '',
        valor: 0,
        valorEscala: 0,
        empleadoId: null,
        empleadoNombre: null
    };

    currentScales.push(newScale);
    
    // Abrir el modal de edición para que complete los datos
    showEditScalesModal();
}

/**
 * Muestra el modal de confirmación para eliminar una escala
 * @param {number} index - Índice de la escala a eliminar
 */
function removeScale(index) {
    if (!currentScales || index < 0 || index >= currentScales.length) {
        showNotification('Error al eliminar la escala', 'error');
        return;
    }

    // Guardar el índice de la escala a eliminar
    window.__deletingScaleIndex = index;
    
    // Mostrar modal de confirmación
    const modal = document.getElementById('confirmDeleteScaleModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela la eliminación de escala
 */
function cancelDeleteScale() {
    window.__deletingScaleIndex = null;
    const modal = document.getElementById('confirmDeleteScaleModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Confirma y elimina la escala
 */
function confirmDeleteScale() {
    const index = window.__deletingScaleIndex;
    
    if (index === null || index === undefined || !currentScales || index < 0 || index >= currentScales.length) {
        showNotification('Error al eliminar la escala', 'error');
        cancelDeleteScale();
        return;
    }

    // Eliminar la escala
    currentScales.splice(index, 1);
    
    // Re-renderizar las escalas
    const scalesToRender = currentScales.map(s => ({ ...s }));
    renderScales(scalesToRender);
    currentScales.length = 0;
    currentScales.push(...scalesToRender);
    
    // Cerrar modal de confirmación
    cancelDeleteScale();
    
    // Mostrar modal de éxito
    showSuccessDeleteScaleModal();
}

/**
 * Muestra el modal de éxito al eliminar escala
 */
function showSuccessDeleteScaleModal() {
    const modal = document.getElementById('successDeleteScaleModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito al eliminar escala
 */
function closeSuccessDeleteScaleModal() {
    const modal = document.getElementById('successDeleteScaleModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Exponer funciones globalmente
window.cancelDeleteScale = cancelDeleteScale;
window.confirmDeleteScale = confirmDeleteScale;
window.closeSuccessDeleteScaleModal = closeSuccessDeleteScaleModal;

// Exponer funciones globalmente
window.addScale = addScale;
window.removeScale = removeScale;

// ========================================
// EDICIÓN DE ESCALAS
// ========================================

/**
 * Muestra el modal de edición de escalas
 * 
 * @returns {void}
 */
function showEditScalesModal() {
    console.log('🔍 showEditScalesModal llamada');
    console.log('🔍 currentScales:', currentScales);
    
    if (!currentScales || currentScales.length === 0) {
        showNotification('No hay escalas para editar', 'warning');
        return;
    }

    const modal = document.getElementById('editScalesModal');
    if (!modal) {
        console.error('❌ No se encontró el modal editScalesModal');
        showNotification('Error: No se encontró el modal de edición', 'error');
        return;
    }

    console.log('✅ Modal encontrado, renderizando escalas...');
    
    // Renderizar escalas en el modal
    renderEditScalesTable();

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Hacer scroll a la última fila después de un pequeño delay para asegurar que el DOM esté actualizado
    setTimeout(() => {
        const tbody = document.getElementById('editScalesTableBody');
        if (tbody && tbody.children.length > 0) {
            const lastRow = tbody.lastElementChild;
            if (lastRow) {
                lastRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                // También hacer scroll del contenedor del modal si es necesario
                const modalBody = modal.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.scrollTop = modalBody.scrollHeight;
                }
            }
        }
    }, 100);
    
    console.log('✅ Modal mostrado');
}

/**
 * Oculta el modal de edición de escalas
 * 
 * @returns {void}
 */
function hideEditScalesModal() {
    const modal = document.getElementById('editScalesModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Renderiza la tabla de escalas editables en el modal
 * 
 * @returns {void}
 */
function renderEditScalesTable() {
    const tbody = document.getElementById('editScalesTableBody');
    if (!tbody) {
        console.error('No se encontró editScalesTableBody');
        return;
    }

    tbody.innerHTML = '';

    const cityCode = getSelectedCityCode();

    currentScales.forEach((scale, index) => {
        const row = document.createElement('tr');
        const scaleName = scale.nombre || scale.nombreEscala || '';
        const scaleValue = scale.valor || scale.valorEscala || 0;
        
        // Obtener el nombre del empleado si hay empleadoId pero no empleadoNombre
        let employeeName = scale.empleadoNombre || '';
        if (!employeeName && scale.empleadoId) {
            employeeName = getEmployeeNameByIdentification(scale.empleadoId, cityCode);
            // Actualizar el objeto scale con el nombre encontrado (ya viene en mayúsculas)
            if (employeeName) {
                scale.empleadoNombre = employeeName.toUpperCase();
            }
        } else if (employeeName) {
            // Asegurar que el nombre existente esté en mayúsculas
            employeeName = employeeName.toUpperCase();
            scale.empleadoNombre = employeeName;
        }

        // Al editar, se cargan los datos actuales para que el usuario solo ajuste lo necesario

        row.innerHTML = `
            <td>
                <input 
                    type="text" 
                    class="form-input" 
                    value="${scaleName}"
                    data-scale-index="${index}"
                    data-field="nombre"
                    placeholder="Nombre de la escala"
                    readonly
                    style="background-color: #f5f5f5; cursor: not-allowed;"
                >
            </td>
            <td>
                <input 
                    type="text" 
                    class="form-input" 
                    value="${scale.empleadoId || ''}"
                    data-scale-index="${index}"
                    data-field="empleadoId"
                    placeholder="Cédula"
                >
            </td>
            <td>
                <input 
                    type="text" 
                    class="form-input" 
                    value="${employeeName.toUpperCase()}"
                    data-scale-index="${index}"
                    data-field="empleadoNombre"
                    placeholder="Nombre del ejecutivo"
                    readonly
                    style="background-color: #f5f5f5; cursor: not-allowed; text-transform: uppercase;"
                >
            </td>
            <td>
                <input 
                    type="text" 
                    class="form-input numeric-input" 
                    value="${formatCurrencyInput(scaleValue)}"
                    data-scale-index="${index}"
                    data-field="valor"
                    placeholder="0.00"
                >
            </td>
        `;
        tbody.appendChild(row);
    });

    // Agregar event listeners para los inputs numéricos
    tbody.querySelectorAll('.numeric-input').forEach(input => {
        // Al escribir, mantener formato con separadores de miles
        input.addEventListener('input', function(e) {
            // Obtener el cursor position antes de cambiar el valor
            const cursorPosition = this.selectionStart;
            const originalLength = this.value.length;
            
            // Permitir solo números y puntos
            let value = this.value.replace(/[^\d.]/g, '');
            
            // Si el usuario está escribiendo, formatear mientras escribe
            // Primero parsear el valor numérico
            const numericValue = parseNumericValue(value);
            
            // Formatear con separadores de miles
            const formatted = formatCurrencyInput(numericValue);
            
            // Actualizar el valor
            this.value = formatted;
            
            // Ajustar la posición del cursor
            const newLength = this.value.length;
            const lengthDiff = newLength - originalLength;
            const newCursorPosition = Math.max(0, cursorPosition + lengthDiff);
            this.setSelectionRange(newCursorPosition, newCursorPosition);
        });

        // Al perder el foco, asegurar formato correcto
        input.addEventListener('blur', function() {
            const value = parseNumericValue(this.value);
            // Formatear con separadores de miles (punto como separador)
            this.value = formatCurrencyInput(value);
        });
    });
    
    // Sincronizar identificaciones - actualizar automáticamente cuando cambie
    tbody.querySelectorAll('[data-field="empleadoId"]').forEach(input => {
        // Actualizar en tiempo real mientras se escribe (con debounce)
        let timeoutId;
        input.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const index = parseInt(this.dataset.scaleIndex);
                const nameInput = tbody.querySelector(`[data-scale-index="${index}"][data-field="empleadoNombre"]`);
                const nombreInput = tbody.querySelector(`[data-scale-index="${index}"][data-field="nombre"]`);
                applyEmployeeIdToScale(index, this.value.trim(), nameInput, nombreInput);
            }, 300); // Esperar 300ms después de que el usuario deje de escribir
        });
        
        // También actualizar al perder el foco
        input.addEventListener('blur', function() {
            const index = parseInt(this.dataset.scaleIndex);
            const nameInput = tbody.querySelector(`[data-scale-index="${index}"][data-field="empleadoNombre"]`);
            const nombreInput = tbody.querySelector(`[data-scale-index="${index}"][data-field="nombre"]`);
            applyEmployeeIdToScale(index, this.value.trim(), nameInput, nombreInput);
        });
    });
}

/**
 * Guarda los cambios realizados en las escalas editadas
 * 
 * @returns {void}
 */
function saveEditedScales() {
    const tbody = document.getElementById('editScalesTableBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');

    rows.forEach((row, index) => {
        if (!currentScales[index]) return;

        const scale = currentScales[index];

        // Actualizar nombre de la escala
        const nombreInput = row.querySelector('[data-field="nombre"]');
        if (nombreInput) {
            const nombreValue = nombreInput.value.trim();
            // Guardar el nombre siempre, incluso si está vacío
            scale.nombre = nombreValue;
            scale.nombreEscala = nombreValue;
            console.log(`📝 Escala ${index} - Nombre guardado: "${nombreValue}"`);
        } else {
            // Si no hay input de nombre, mantener el nombre existente
            // No limpiar si ya existe un nombre guardado
            if (!scale.nombre && !scale.nombreEscala) {
                scale.nombre = '';
                scale.nombreEscala = '';
            }
        }

        const empleadoNombreInput = row.querySelector('[data-field="empleadoNombre"]');
        const empleadoIdInput = row.querySelector('[data-field="empleadoId"]');
        const nombreValor = empleadoNombreInput ? empleadoNombreInput.value.trim().toUpperCase() : '';
        const idValor = empleadoIdInput ? empleadoIdInput.value.trim() : '';
        
        // Actualizar empleadoId y empleadoNombre directamente desde los inputs
        // No llamar a applyEmployeeIdToScale aquí porque ya estamos guardando los valores
        scale.empleadoId = idValor || null;
        scale.empleadoNombre = nombreValor || null;
        
        // Asegurar que el input también muestre el nombre en mayúsculas
        if (empleadoNombreInput && nombreValor) {
            empleadoNombreInput.value = nombreValor;
        }

        // Actualizar valor de la comisión
        const valorInput = row.querySelector('[data-field="valor"]');
        if (valorInput) {
            const value = parseNumericValue(valorInput.value);
            scale.valor = value || 0;
            scale.valorEscala = value || 0;
            console.log(`✅ Escala ${index} actualizada:`, scale);
        }
    });

    console.log('🔄 Escalas actualizadas:', JSON.stringify(currentScales, null, 2));

    // Asegurar que todos los campos estén sincronizados
    currentScales.forEach(scale => {
        // Sincronizar nombre y nombreEscala
        if (scale.nombre && !scale.nombreEscala) {
            scale.nombreEscala = scale.nombre;
        }
        if (scale.nombreEscala && !scale.nombre) {
            scale.nombre = scale.nombreEscala;
        }
        // Sincronizar valor y valorEscala
        if (scale.valor !== undefined && scale.valorEscala === undefined) {
            scale.valorEscala = scale.valor;
        }
        if (scale.valorEscala !== undefined && scale.valor === undefined) {
            scale.valor = scale.valorEscala;
        }
    });

    // Actualizar la visualización de escalas en el contenedor principal
    // Hacer una copia profunda de las escalas para renderizar
    const scalesToRender = currentScales.map(s => ({
        codigo: s.codigo || s.codigoEscala || '',
        codigoEscala: s.codigo || s.codigoEscala || '',
        nombre: s.nombre || s.nombreEscala || '',
        nombreEscala: s.nombre || s.nombreEscala || '',
        valor: s.valor || s.valorEscala || 0,
        valorEscala: s.valor || s.valorEscala || 0,
        empleadoId: s.empleadoId || null,
        empleadoNombre: s.empleadoNombre || null
    }));
    
    console.log('🔄 Renderizando escalas después de guardar:', JSON.stringify(scalesToRender, null, 2));
    renderScales(scalesToRender);
    
    // Actualizar currentScales con la copia renderizada para mantener consistencia
    currentScales.length = 0;
    currentScales.push(...scalesToRender);

    // Cerrar modal
    hideEditScalesModal();

    showNotification('Escalas actualizadas correctamente', 'success');
}

/**
 * Busca el ID de un empleado por su nombre
 * 
 * @param {string} nombre - Nombre del empleado a buscar
 * @param {string} cityCode - Código de la ciudad
 * @returns {string|null} - ID del empleado o null si no se encuentra
 */
function findEmployeeIdByName(nombre, cityCode) {
    try {
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        if (!empleadosByCity) return null;

        const data = JSON.parse(empleadosByCity);
        if (!data[cityCode]) return null;

        const empleados = data[cityCode];
        const nombreBuscado = nombre.toUpperCase().trim();

        // Buscar por nombre completo
        for (const [id, empleado] of Object.entries(empleados)) {
            const nombreCompleto = [
                empleado.tPrimerApellido || empleado.primerApellido,
                empleado.tSegundoApellido || empleado.segundoApellido,
                empleado.tPrimerNombre || empleado.primerNombre,
                empleado.tSegundoNombre || empleado.segundoNombre
            ].filter(Boolean).join(' ').toUpperCase();

            if (nombreCompleto === nombreBuscado || nombreCompleto.includes(nombreBuscado) || nombreBuscado.includes(nombreCompleto)) {
                return id;
            }
        }

        return null;
    } catch (e) {
        console.error('Error buscando empleado por nombre:', e);
        return null;
    }
}

/**
 * Mapeo de códigos de cargo a nombres de escala
 */
const cargoToScaleNameMap = {
    'AS': 'Asesor',
    'SU': 'Supervisor',
    'SG': 'Subgerente',
    'GT': 'Gerente',
    'DR': 'Director',
    'SN': 'Subdirector Nacional',
    'DN': 'Director Nacional'
};

/**
 * Actualiza la información del ejecutivo en una escala a partir de la identificación
 * @param {number} index - Índice de la escala
 * @param {string} identificacion - Identificación digitada
 * @param {HTMLInputElement|null} nameInputElement - Input del nombre del ejecutivo para sincronizar (opcional)
 * @param {HTMLInputElement|null} nombreInputElement - Input del nombre de la escala para sincronizar (opcional)
 */
function applyEmployeeIdToScale(index, identificacion, nameInputElement, nombreInputElement) {
    if (!currentScales || !currentScales[index]) {
        return;
    }
    
    const cleanId = (identificacion || '').trim();
    currentScales[index].empleadoId = cleanId || null;
    
    // Si se borró la identificación, limpiar todos los demás campos
    if (!cleanId) {
        currentScales[index].empleadoNombre = null;
        currentScales[index].nombre = '';
        currentScales[index].nombreEscala = '';
        
        if (nameInputElement) {
            nameInputElement.value = '';
        }
        if (nombreInputElement) {
            nombreInputElement.value = '';
        }
        
        // Limpiar también los campos de nombre de escala en el DOM
        const tbody = document.getElementById('editScalesTableBody');
        if (tbody) {
            const nombreInput = nombreInputElement || tbody.querySelector(`[data-scale-index="${index}"][data-field="nombre"]`);
            if (nombreInput) {
                nombreInput.value = '';
            }
        }
        return;
    }
    
    // Buscar datos completos del empleado
    const cityCode = getSelectedCityCode();
    let employeeName = '';
    let scaleName = '';
    
    if (cleanId && cityCode) {
        const employeeData = getEmployeeDataByIdentification(cleanId, cityCode);
        
        if (employeeData) {
            // Obtener nombre del empleado y convertir a mayúsculas
            employeeName = [
                employeeData.tPrimerApellido || employeeData.primerApellido,
                employeeData.tSegundoApellido || employeeData.segundoApellido,
                employeeData.tPrimerNombre || employeeData.primerNombre,
                employeeData.tSegundoNombre || employeeData.segundoNombre
            ].filter(Boolean).join(' ').trim().toUpperCase();
            
            // Obtener nombre de la escala basado en el cargo
            const cargoCode = employeeData.cargo || employeeData.tCargo;
            if (cargoCode && cargoToScaleNameMap[cargoCode]) {
                scaleName = cargoToScaleNameMap[cargoCode];
            } else if (employeeData.cargoNombre) {
                // Si no está en el mapeo, usar el cargoNombre directamente
                scaleName = employeeData.cargoNombre;
            }
        } else {
            // Si no se encuentra el empleado, intentar solo obtener el nombre (ya viene en mayúsculas)
            employeeName = getEmployeeNameByIdentification(cleanId, cityCode) || '';
        }
    }
    
    // Actualizar nombre del ejecutivo (asegurar que siempre esté en mayúsculas)
    if (employeeName) {
        const employeeNameUpper = employeeName.toUpperCase();
        currentScales[index].empleadoNombre = employeeNameUpper;
        if (nameInputElement) {
            nameInputElement.value = employeeNameUpper;
        }
    } else {
        currentScales[index].empleadoNombre = null;
        if (nameInputElement) {
            nameInputElement.value = '';
        }
    }
    
    // Actualizar nombre de la escala
    if (scaleName) {
        currentScales[index].nombre = scaleName;
        currentScales[index].nombreEscala = scaleName;
        if (nombreInputElement) {
            nombreInputElement.value = scaleName;
        } else {
            // Si no se pasó el elemento, buscarlo en el DOM
            const tbody = document.getElementById('editScalesTableBody');
            if (tbody) {
                const nombreInput = tbody.querySelector(`[data-scale-index="${index}"][data-field="nombre"]`);
                if (nombreInput) {
                    nombreInput.value = scaleName;
                }
            }
        }
    } else {
        currentScales[index].nombre = '';
        currentScales[index].nombreEscala = '';
        if (nombreInputElement) {
            nombreInputElement.value = '';
        } else {
            const tbody = document.getElementById('editScalesTableBody');
            if (tbody) {
                const nombreInput = tbody.querySelector(`[data-scale-index="${index}"][data-field="nombre"]`);
                if (nombreInput) {
                    nombreInput.value = '';
                }
            }
        }
    }
}

/**
 * Actualiza la información del ejecutivo en una escala a partir del nombre
 * @param {number} index - Índice de la escala
 * @param {string} nombre - Nombre del ejecutivo
 * @param {HTMLInputElement|null} idInputElement - Input de identificación para sincronizar (opcional)
 */
function applyEmployeeNameToScale(index, nombre, idInputElement) {
    if (!currentScales || !currentScales[index]) {
        return;
    }
    
    const cleanName = (nombre || '').trim();
    
    if (cleanName) {
        currentScales[index].empleadoNombre = cleanName;
        const cityCode = getSelectedCityCode();
        const empleadoId = cityCode ? findEmployeeIdByName(cleanName, cityCode) : null;
        if (empleadoId) {
            currentScales[index].empleadoId = empleadoId;
            if (idInputElement) {
                idInputElement.value = empleadoId;
            }
        } else if (!currentScales[index].empleadoId) {
            currentScales[index].empleadoId = null;
            if (idInputElement) {
                idInputElement.value = '';
            }
        }
    } else {
        delete currentScales[index].empleadoNombre;
        if (idInputElement) {
            idInputElement.value = '';
        }
        currentScales[index].empleadoId = null;
    }
}

// Exponer funciones de edición de escalas inmediatamente después de definirlas
window.showEditScalesModal = showEditScalesModal;
window.hideEditScalesModal = hideEditScalesModal;
window.saveEditedScales = saveEditedScales;

function handleCreateInvoice() {
    if (!currentPayrollId) {
        showNotification('No hay nómina seleccionada', 'warning');
        return;
    }

    const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
    const contractInputValue = document.getElementById('invoiceContract').value.trim();
    const initialQuotaInput = document.getElementById('invoiceInitialQuota');
    const initialQuota = initialQuotaInput ? initialQuotaInput.value : '';
    const endDate = document.getElementById('invoiceEndDate').value;
    
    console.log('🔍 Valor del input de cuota inicial:', initialQuota);

    if (!invoiceNumber || !contractInputValue || !initialQuota || !endDate) {
        showNotification('Por favor, complete todos los campos', 'warning');
        return;
    }

    // Si está editando, mostrar modal de confirmación de actualización
    if (window.__editingInvoiceId) {
        showConfirmUpdateInvoiceModal();
        return;
    }

    // Si es creación nueva, mostrar modal de confirmación
    showConfirmCreateInvoiceModal();
}

function showConfirmCreateInvoiceModal() {
    const modal = document.getElementById('confirmCreateInvoiceModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cancelCreateInvoice() {
    const modal = document.getElementById('confirmCreateInvoiceModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function confirmCreateInvoice() {
    continueCreateInvoice();
}

/**
 * Actualiza la información del ejecutivo en una escala a partir del nombre
 * @param {number} index - Índice de la escala
 * @param {string} nombre - Nombre del ejecutivo
 * @param {HTMLInputElement|null} idInputElement - Input de identificación para sincronizar (opcional)
 */
function applyEmployeeNameToScale(index, nombre, idInputElement) {
    if (!currentScales || !currentScales[index]) {
        return;
    }
    
    const cleanName = (nombre || '').trim();
    
    if (cleanName) {
        currentScales[index].empleadoNombre = cleanName;
        const cityCode = getSelectedCityCode();
        const empleadoId = cityCode ? findEmployeeIdByName(cleanName, cityCode) : null;
        if (empleadoId) {
            currentScales[index].empleadoId = empleadoId;
            if (idInputElement) {
                idInputElement.value = empleadoId;
            }
        } else if (!currentScales[index].empleadoId) {
            currentScales[index].empleadoId = null;
            if (idInputElement) {
                idInputElement.value = '';
            }
        }
    } else {
        delete currentScales[index].empleadoNombre;
        if (idInputElement) {
            idInputElement.value = '';
        }
        currentScales[index].empleadoId = null;
    }
}

// Exponer funciones de edición de escalas inmediatamente después de definirlas
window.showEditScalesModal = showEditScalesModal;
window.hideEditScalesModal = hideEditScalesModal;
window.saveEditedScales = saveEditedScales;

function handleCreateInvoice() {
    if (!currentPayrollId) {
        showNotification('No hay nómina seleccionada', 'warning');
        return;
    }

    const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
    const contractInputValue = document.getElementById('invoiceContract').value.trim();
    const initialQuotaInput = document.getElementById('invoiceInitialQuota');
    const initialQuota = initialQuotaInput ? initialQuotaInput.value : '';
    const endDate = document.getElementById('invoiceEndDate').value;
    
    console.log('🔍 Valor del input de cuota inicial:', initialQuota);

    if (!invoiceNumber || !contractInputValue || !initialQuota || !endDate) {
        showNotification('Por favor, complete todos los campos', 'warning');
        return;
    }

    // Si está editando, mostrar modal de confirmación de actualización
    if (window.__editingInvoiceId) {
        showConfirmUpdateInvoiceModal();
        return;
    }

    // Si es creación nueva, mostrar modal de confirmación
    showConfirmCreateInvoiceModal();
}

function showConfirmCreateInvoiceModal() {
    const modal = document.getElementById('confirmCreateInvoiceModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cancelCreateInvoice() {
    const modal = document.getElementById('confirmCreateInvoiceModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function confirmCreateInvoice() {
    // Cerrar modal de confirmación
    cancelCreateInvoice();
    
    // Verificar si la factura ya existe en cualquier nómina (incluyendo la actual)
    const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
    if (invoiceNumber) {
        const existingInvoiceInfo = findInvoiceInOtherPayrolls(invoiceNumber, true);
        if (existingInvoiceInfo) {
            console.log('⚠️ Factura encontrada al confirmar:', existingInvoiceInfo);
            // Mostrar aviso de que la factura ya existe
            showWarningInvoiceExistsModal(existingInvoiceInfo.fechaInicio);
            // Guardar la información para continuar después del aviso
            window.__pendingInvoiceCreation = true;
            return;
        }
    }
    
    // Continuar con la creación
    continueCreateInvoice();
}

/**
 * Busca si una factura ya existe en cualquier nómina (incluyendo la actual)
 * @param {string} invoiceNumber - Número de factura a buscar
 * @param {boolean} includeCurrentPayroll - Si true, también busca en la nómina actual
 * @returns {Object|null} - Objeto con información de la nómina donde está la factura, o null si no existe
 */
function findInvoiceInOtherPayrolls(invoiceNumber, includeCurrentPayroll = true) {
    console.log('🔍 Buscando factura:', invoiceNumber, 'Incluir nómina actual:', includeCurrentPayroll);
    const cityCode = getSelectedCityCode();
    if (!cityCode) {
        console.log('⚠️ No hay ciudad seleccionada');
        return null;
    }
    
    try {
        // Cargar todas las nóminas de la ciudad
        const stored = localStorage.getItem(`nominaSemanal_${cityCode}`);
        if (!stored) {
            console.log('⚠️ No hay nóminas guardadas');
            return null;
        }
        
        const allPayrolls = JSON.parse(stored);
        console.log('📋 Total nóminas encontradas:', allPayrolls.length);
        
        // Buscar la factura en todas las nóminas
        for (const payroll of allPayrolls) {
            // Si no se debe incluir la nómina actual y es la actual, saltarla
            if (!includeCurrentPayroll && payroll.id === currentPayrollId) {
                console.log('⏭️ Saltando nómina actual:', payroll.id);
                continue;
            }
            
            const facturas = payroll.facturas || [];
            console.log(`🔍 Revisando nómina ${payroll.codigo || payroll.id}, tiene ${facturas.length} facturas`);
            
            const foundInvoice = facturas.find(f => {
                const facturaNum = (f.numeroFactura || '').toString().trim();
                const searchNum = invoiceNumber.toString().trim();
                const match = facturaNum === searchNum;
                if (match) {
                    console.log('✅ Factura encontrada!', { facturaNum, searchNum, payroll: payroll.codigo });
                }
                return match;
            });
            
            if (foundInvoice) {
                // Retornar información de la nómina donde está la factura
                const result = {
                    payrollId: payroll.id,
                    payrollCodigo: payroll.codigo || '',
                    fechaInicio: payroll.fechaInicio || ''
                };
                console.log('✅ Factura encontrada en nómina:', result);
                return result;
            }
        }
        
        console.log('❌ Factura no encontrada en ninguna nómina');
    } catch (e) {
        console.error('❌ Error buscando factura en nóminas:', e);
    }
    
    return null;
}

/**
 * Muestra el modal de aviso de que la factura ya existe
 * @param {string} fechaInicio - Fecha inicial de la nómina donde está la factura
 */
function showWarningInvoiceExistsModal(fechaInicio) {
    console.log('🔔 Mostrando aviso de factura existente, fecha:', fechaInicio);
    const modal = document.getElementById('warningInvoiceExistsModal');
    const fechaInicioElement = document.getElementById('warningInvoiceFechaInicio');
    
    if (!modal) {
        console.error('❌ No se encontró el modal warningInvoiceExistsModal');
        return;
    }
    
    if (!fechaInicioElement) {
        console.error('❌ No se encontró el elemento warningInvoiceFechaInicio');
        return;
    }
    
    // Formatear la fecha (usar el mismo método que formatDate para evitar problemas de zona horaria)
    let fechaFormateada = fechaInicio || 'N/A';
    if (fechaInicio) {
        try {
            // Si la fecha viene en formato YYYY-MM-DD, parsearla manualmente para evitar problemas de zona horaria
            if (typeof fechaInicio === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaInicio)) {
                // Extraer solo la parte de la fecha (antes de T o espacio)
                const fechaPart = fechaInicio.split('T')[0].split(' ')[0];
                const partes = fechaPart.split('-');
                if (partes.length === 3) {
                    // Formatear directamente sin crear Date (evita desfase por zona horaria)
                    const year = partes[0];
                    const month = partes[1];
                    const day = partes[2];
                    fechaFormateada = `${day}/${month}/${year}`;
                } else {
                    fechaFormateada = fechaInicio;
                }
            } else {
                // Para otros formatos, usar el método estándar
                const fecha = new Date(fechaInicio);
                if (!isNaN(fecha.getTime())) {
                    const day = String(fecha.getDate()).padStart(2, '0');
                    const month = String(fecha.getMonth() + 1).padStart(2, '0');
                    const year = fecha.getFullYear();
                    fechaFormateada = `${day}/${month}/${year}`;
                }
            }
        } catch (e) {
            console.error('Error formateando fecha:', e);
            // Si hay error, usar la fecha original
        }
    }
    
    fechaInicioElement.textContent = fechaFormateada;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    console.log('✅ Modal de aviso mostrado');
}

/**
 * Cierra el modal de aviso de factura existente
 */
function closeWarningInvoiceExistsModal() {
    const modal = document.getElementById('warningInvoiceExistsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Si había una creación pendiente, continuar
    if (window.__pendingInvoiceCreation) {
        window.__pendingInvoiceCreation = false;
        continueCreateInvoice();
    }
}

// Exponer función globalmente
window.closeWarningInvoiceExistsModal = closeWarningInvoiceExistsModal;

/**
 * 🔗 BACKEND INTEGRATION - CREAR/ACTUALIZAR FACTURA
 * 
 * Crea o actualiza una factura dentro de una nómina semanal.
 * Esta función maneja tanto la creación como la actualización de facturas.
 * 
 * BACKEND: Reemplazar con llamadas a API
 * - Crear: POST /api/nomina/facturas
 *   * Body: {
 *       nominaId: string,
 *       numeroFactura: string,
 *       numeroContrato: string,
 *       cuotaInicial: number,
 *       fechaFinal: string (ISO),
 *       ejecutivoId: string,
 *       ejecutivo: string,
 *       escalas: Array<{codigo, nombre, valor, empleadoId}>,
 *       totalEscalas: number
 *     }
 * 
 * - Actualizar: PUT /api/nomina/facturas/{id}
 *   * Body: (mismo que crear)
 * 
 * - Headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }
 * 
 * @returns {void}
 */
function continueCreateInvoice() {
    if (!currentPayrollId) {
        showNotification('No hay nómina seleccionada', 'warning');
        return;
    }

    const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
    const contractInputValue = document.getElementById('invoiceContract').value.trim();
    const initialQuotaInput = document.getElementById('invoiceInitialQuota');
    const initialQuota = initialQuotaInput ? initialQuotaInput.value : '';
    const endDate = document.getElementById('invoiceEndDate').value;

    // Extraer el número de contrato del input (formato: "#123 - Nombre Titular")
    let contractNumber = contractInputValue;
    if (contractInputValue.includes('#')) {
        const match = contractInputValue.match(/#(\d+)/);
        if (match && match[1]) {
            contractNumber = match[1];
        }
    }

    if (currentScales.length === 0) {
        showNotification('Debe seleccionar un contrato con escalas', 'warning');
        return;
    }

    // Parsear cuota inicial correctamente (manejar formato con separadores de miles y decimales)
    let cuotaInicialValue = 0;
    if (initialQuota) {
        // El input puede tener formato: "5.000.000" (sin decimales) o "5.000.000,00" (con decimales)
        // Necesitamos eliminar todos los puntos (separadores de miles) y manejar la coma decimal
        let cleanValue = String(initialQuota).trim();
        
        console.log('🔍 Parseando cuota inicial - valor original:', cleanValue);
        
        // Si tiene coma, es formato español con decimales (ej: "5.000.000,00")
        if (cleanValue.includes(',')) {
            // Eliminar todos los puntos (separadores de miles)
            cleanValue = cleanValue.replace(/\./g, '');
            // Reemplazar coma por punto para parseFloat
            cleanValue = cleanValue.replace(',', '.');
        } else if (cleanValue.includes('.')) {
            // Si tiene punto pero no coma, verificar si son separadores de miles o decimal
            const parts = cleanValue.split('.');
            console.log('🔍 Partes separadas por punto:', parts);
            
            // Si tiene más de un punto, son separadores de miles
            if (parts.length > 2) {
                // Son separadores de miles, eliminar todos los puntos
                cleanValue = cleanValue.replace(/\./g, '');
                console.log('🔍 Son separadores de miles (más de 2 partes), valor limpio:', cleanValue);
            } else if (parts.length === 2) {
                // Tiene un punto, verificar si es decimal o separador de miles
                // Si la parte después del punto tiene más de 2 dígitos, son separadores de miles
                // O si la parte antes del punto tiene más de 3 dígitos, probablemente son separadores de miles
                if (parts[1].length > 2 || parts[0].length > 3) {
                    // Son separadores de miles, eliminar todos los puntos
                    cleanValue = cleanValue.replace(/\./g, '');
                    console.log('🔍 Son separadores de miles (parte decimal > 2 dígitos o parte entera > 3), valor limpio:', cleanValue);
                } else {
                    // Es decimal, mantener el punto
                    console.log('🔍 Es decimal, mantener punto');
                }
            }
        }
        
        // Eliminar cualquier otro carácter no numérico excepto punto (para decimales)
        // Pero si ya no tiene puntos, eliminar todo lo que no sea número
        if (!cleanValue.includes('.')) {
            cleanValue = cleanValue.replace(/[^\d]/g, '');
        } else {
            cleanValue = cleanValue.replace(/[^\d.]/g, '');
        }
        
        cuotaInicialValue = parseFloat(cleanValue) || 0;
        
        console.log('💰 Cuota inicial parseada:', {
            original: initialQuota,
            limpio: cleanValue,
            valor: cuotaInicialValue
        });
    }

    const payroll = payrollData.find(p => p.id === currentPayrollId);
    if (!payroll) {
        console.error('❌ No se encontró la nómina con ID:', currentPayrollId);
        showNotification('Error: No se encontró la nómina', 'error');
        return;
    }

    // Verificar si estamos editando o creando
    const editingInvoiceId = window.__editingInvoiceId;
    
    if (editingInvoiceId) {
        // ACTUALIZAR factura existente
        const invoiceIndex = payroll.facturas.findIndex(f => f.id === editingInvoiceId);
        if (invoiceIndex === -1) {
            showNotification('No se encontró la factura a editar', 'error');
            return;
        }

        const existingInvoice = payroll.facturas[invoiceIndex];
        
        // Obtener el ejecutivo actualizado del contrato
        let ejecutivoId = '';
        let ejecutivoNombre = '';
        const currentContract = window.__currentContractForInvoice;
        if (currentContract) {
            ejecutivoId = currentContract.executiveId || 
                         currentContract.ejecutivoId || 
                         currentContract.executive || 
                         currentContract.ejecutivo || '';
            ejecutivoNombre = currentContract.executive || 
                            currentContract.ejecutivo || '';
        }
        
        payroll.facturas[invoiceIndex] = {
            ...existingInvoice,
            numeroFactura: invoiceNumber,
            numeroContrato: contractNumber,
            cuotaInicial: cuotaInicialValue,
            fechaFinal: endDate,
            ejecutivoId: ejecutivoId,
            ejecutivo: ejecutivoNombre,
            escalas: currentScales.map(s => ({
                codigo: s.codigo || s.codigoEscala,
                nombre: s.nombre || s.nombreEscala,
                valor: s.valor || s.valorEscala || 0,
                empleadoId: s.empleadoId || null, // Guardar el ID del empleado para obtener su nombre después
                empleadoNombre: s.empleadoNombre || null // Guardar el nombre del empleado editado
            })),
            totalEscalas: currentScales.reduce((sum, s) => sum + (s.valor || s.valorEscala || 0), 0),
            fechaActualizacion: new Date().toISOString()
        };

        // 🔗 BACKEND INTEGRATION: Reemplazar con llamada a API
        // const response = await fetch(`/api/nomina/facturas/${editingInvoiceId}`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        //     body: JSON.stringify(payroll.facturas[invoiceIndex])
        // });
        // const updatedInvoice = await response.json();
        
        // Actualizar allPayrollData también
        const allPayrollIndex = allPayrollData.findIndex(p => p.id === currentPayrollId);
        if (allPayrollIndex !== -1) {
            allPayrollData[allPayrollIndex] = { ...payroll };
        } else {
            // Si no está en allPayrollData, agregarlo
            allPayrollData.push({ ...payroll });
        }
        
        savePayrollData();
        invoicesData = payroll.facturas;
        renderInvoicesTable(invoicesData);
        hideCreateInvoiceModal();
        
        // Limpiar modo edición
        window.__editingInvoiceId = null;
        
        // Restaurar título y botón
        const modalTitle = document.querySelector('#createInvoiceModal .modal-title');
        const createButton = document.getElementById('bCrearFactura');
        if (modalTitle) {
            modalTitle.textContent = 'CREAR FACTURA';
        }
        if (createButton) {
            createButton.textContent = 'Crear Factura';
        }
        
        // Mostrar modal de éxito
        showSuccessUpdateInvoiceModal();
    } else {
        // CREAR nueva factura
        // Obtener el ejecutivo actualizado del contrato
        let ejecutivoId = '';
        let ejecutivoNombre = '';
        const currentContract = window.__currentContractForInvoice;
        if (currentContract) {
            ejecutivoId = currentContract.executiveId || 
                         currentContract.ejecutivoId || 
                         currentContract.executive || 
                         currentContract.ejecutivo || '';
            ejecutivoNombre = currentContract.executive || 
                            currentContract.ejecutivo || '';
        }
        
        const newInvoice = {
            id: generateInvoiceId(),
            numeroFactura: invoiceNumber,
            numeroContrato: contractNumber,
            cuotaInicial: cuotaInicialValue,
            fechaFinal: endDate,
            ejecutivoId: ejecutivoId,
            ejecutivo: ejecutivoNombre,
            escalas: currentScales.map(s => ({
                codigo: s.codigo || s.codigoEscala,
                nombre: s.nombre || s.nombreEscala,
                valor: s.valor || s.valorEscala || 0,
                empleadoId: s.empleadoId || null, // Guardar el ID del empleado para obtener su nombre después
                empleadoNombre: s.empleadoNombre || null // Guardar el nombre del empleado editado
            })),
            totalEscalas: currentScales.reduce((sum, s) => sum + (s.valor || s.valorEscala || 0), 0),
            fechaCreacion: new Date().toISOString()
        };

        if (!payroll.facturas) {
            payroll.facturas = [];
        }
        payroll.facturas.push(newInvoice);
        console.log(`✅ Factura agregada. Total facturas en nómina ${payroll.codigo}: ${payroll.facturas.length}`);
        
        // Actualizar allPayrollData también
        const allPayrollIndex = allPayrollData.findIndex(p => p.id === currentPayrollId);
        if (allPayrollIndex !== -1) {
            if (!allPayrollData[allPayrollIndex].facturas) {
                allPayrollData[allPayrollIndex].facturas = [];
            }
            allPayrollData[allPayrollIndex].facturas = [...payroll.facturas];
        } else {
            // Si no está en allPayrollData, agregarlo
            allPayrollData.push({ ...payroll });
        }
        
        savePayrollData();
        invoicesData = payroll.facturas;
        renderInvoicesTable(invoicesData);
        hideCreateInvoiceModal();
        
        // Mostrar modal de éxito
        showSuccessCreateInvoiceModal();
    }
}

function showSuccessCreateInvoiceModal() {
    const modal = document.getElementById('successCreateInvoiceModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessCreateInvoiceModal() {
    const modal = document.getElementById('successCreateInvoiceModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showConfirmUpdateInvoiceModal() {
    const modal = document.getElementById('confirmUpdateInvoiceModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cancelUpdateInvoice() {
    const modal = document.getElementById('confirmUpdateInvoiceModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function confirmUpdateInvoice() {
    // Cerrar modal de confirmación
    cancelUpdateInvoice();
    // Continuar con la actualización
    continueCreateInvoice();
}

// ========================================
// ELIMINACIÓN DE FACTURA
// ========================================

/**
 * Muestra el modal de confirmación para eliminar una factura
 * 
 * @param {string} invoiceId - ID de la factura a eliminar
 * @returns {void}
 */
function showConfirmDeleteInvoiceModal(invoiceId) {
    window.__deletingInvoiceId = invoiceId;
    const modal = document.getElementById('confirmDeleteInvoiceModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela la eliminación de factura
 * 
 * @returns {void}
 */
function cancelDeleteInvoice() {
    window.__deletingInvoiceId = null;
    const modal = document.getElementById('confirmDeleteInvoiceModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * 🔗 BACKEND INTEGRATION - CONFIRMAR ELIMINACIÓN DE FACTURA
 * 
 * Confirma y elimina una factura de una nómina.
 * 
 * BACKEND: Reemplazar con llamada a API
 * - Endpoint: DELETE /api/nomina/facturas/{id}
 * - Método: DELETE
 * - Headers: { 'Authorization': 'Bearer {token}' }
 * 
 * @returns {void}
 */
function confirmDeleteInvoice() {
    const invoiceId = window.__deletingInvoiceId;
    if (!invoiceId) {
        showNotification('Error: No se encontró la factura a eliminar', 'error');
        return;
    }

    if (!currentPayrollId) {
        showNotification('No hay nómina seleccionada', 'error');
        cancelDeleteInvoice();
        return;
    }

    // Buscar la nómina
    const payroll = payrollData.find(p => p.id === currentPayrollId);
    if (!payroll) {
        showNotification('No se encontró la nómina', 'error');
        cancelDeleteInvoice();
        return;
    }

    // Buscar y eliminar la factura
    if (!payroll.facturas) {
        payroll.facturas = [];
    }

    const invoiceIndex = payroll.facturas.findIndex(f => f.id === invoiceId);
    if (invoiceIndex === -1) {
        showNotification('No se encontró la factura a eliminar', 'error');
        cancelDeleteInvoice();
        return;
    }

    // 🔗 BACKEND INTEGRATION: Reemplazar con llamada a API
    // const response = await fetch(`/api/nomina/facturas/${invoiceId}`, {
    //     method: 'DELETE',
    //     headers: { 'Authorization': `Bearer ${token}` }
    // });
    // if (!response.ok) {
    //     throw new Error('Error al eliminar la factura');
    // }

    // Eliminar la factura
    payroll.facturas.splice(invoiceIndex, 1);

    // Actualizar también en allPayrollData
    const allPayrollIndex = allPayrollData.findIndex(p => p.id === currentPayrollId);
    if (allPayrollIndex !== -1 && allPayrollData[allPayrollIndex].facturas) {
        const allInvoiceIndex = allPayrollData[allPayrollIndex].facturas.findIndex(f => f.id === invoiceId);
        if (allInvoiceIndex !== -1) {
            allPayrollData[allPayrollIndex].facturas.splice(allInvoiceIndex, 1);
        }
    }

    // Guardar cambios
    savePayrollData();

    // Actualizar datos locales
    invoicesData = payroll.facturas || [];

    // Renderizar tabla de facturas actualizada
    renderInvoicesTable(invoicesData);

    // Cerrar modal de confirmación
    cancelDeleteInvoice();

    // Mostrar modal de éxito
    showSuccessDeleteInvoiceModal();
}

/**
 * Muestra el modal de éxito al eliminar factura
 * 
 * @returns {void}
 */
function showSuccessDeleteInvoiceModal() {
    const modal = document.getElementById('successDeleteInvoiceModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito al eliminar factura
 * 
 * @returns {void}
 */
function closeSuccessDeleteInvoiceModal() {
    const modal = document.getElementById('successDeleteInvoiceModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showSuccessUpdateInvoiceModal() {
    const modal = document.getElementById('successUpdateInvoiceModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessUpdateInvoiceModal() {
    const modal = document.getElementById('successUpdateInvoiceModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function generateInvoiceNumber() {
    const cityCode = getSelectedCityCode();
    const count = invoicesData.length + 1;
    return `FAC-${cityCode}-${String(count).padStart(6, '0')}`;
}

function generateInvoiceId() {
    return 'INV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function renderInvoicesTable(invoices) {
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;

    if (!invoices || invoices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-file-invoice"></i>
                        <p>No hay facturas creadas para esta nómina</p>
                        <small>Haz clic en "Crear Factura" para agregar la primera</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        // Obtener cuota inicial correcta (si está mal guardada, buscar en contrato/plan)
        let cuotaInicialDisplay = invoice.cuotaInicial || 0;
        
        // Si el valor es muy pequeño, intentar obtener el valor correcto
        if (cuotaInicialDisplay > 0 && cuotaInicialDisplay < 1000) {
            try {
                const cityCode = getSelectedCityCode();
                if (cityCode) {
                    const contract = getContractInfoForInvoice(invoice.numeroContrato, cityCode);
                    if (contract) {
                        // Buscar en planData
                        if (contract.planData) {
                            try {
                                const planData = typeof contract.planData === 'string' ? 
                                                JSON.parse(contract.planData) : 
                                                contract.planData;
                                const planCuotaInicial = planData.cuotaInicial || 
                                                       planData.cuotaInicialValor ||
                                                       planData.valorInicial ||
                                                       0;
                                if (planCuotaInicial && planCuotaInicial > cuotaInicialDisplay) {
                                    cuotaInicialDisplay = planCuotaInicial;
                                }
                            } catch (e) {
                                console.error('Error parseando planData:', e);
                            }
                        }
                        
                        // Si aún no se encontró, buscar en el plan
                        if (cuotaInicialDisplay < 1000 && contract.plan) {
                            try {
                                const planesData = localStorage.getItem('planesData');
                                if (planesData) {
                                    const planes = JSON.parse(planesData);
                                    const plan = planes[contract.plan];
                                    if (plan) {
                                        const planCuotaInicial = plan.cuotaInicial || 
                                                               plan.cuotaInicialValor ||
                                                               plan.valorInicial ||
                                                               0;
                                        if (planCuotaInicial && planCuotaInicial > cuotaInicialDisplay) {
                                            cuotaInicialDisplay = planCuotaInicial;
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error('Error buscando en planes:', e);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Error obteniendo cuota inicial correcta:', e);
            }
        }
        
        row.innerHTML = `
            <td>${invoice.numeroFactura}</td>
            <td>${invoice.numeroContrato}</td>
            <td>${formatCuotaInicial(cuotaInicialDisplay)}</td>
            <td>${formatDate(invoice.fechaFinal)}</td>
            <td>${formatCurrency(invoice.totalEscalas || 0)}</td>
            <td class="options-column">
                <div class="action-buttons-cell">
                    <button class="btn-icon" onclick="editInvoice('${invoice.id}')" title="Editar Factura">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-icon-danger" onclick="showConfirmDeleteInvoiceModal('${invoice.id}')" title="Eliminar Factura">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editInvoice(invoiceId) {
    if (!currentPayrollId) {
        showNotification('No hay nómina seleccionada', 'warning');
        return;
    }

    const payroll = payrollData.find(p => p.id === currentPayrollId);
    if (!payroll || !payroll.facturas) {
        showNotification('No se encontró la factura', 'error');
        return;
    }

    const invoice = payroll.facturas.find(f => f.id === invoiceId);
    if (!invoice) {
        showNotification('No se encontró la factura', 'error');
        return;
    }

    // Establecer modo edición
    window.__editingInvoiceId = invoiceId;

    // Cambiar título del modal
    const modalTitle = document.querySelector('#createInvoiceModal .modal-title');
    const createButton = document.getElementById('bCrearFactura');
    if (modalTitle) {
        modalTitle.textContent = 'EDITAR FACTURA';
    }
    if (createButton) {
        createButton.textContent = 'Actualizar Factura';
    }

    // Mostrar modal primero
    const modal = document.getElementById('createInvoiceModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // Llenar formulario con datos existentes
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    const contractInput = document.getElementById('invoiceContract');
    const endDateInput = document.getElementById('invoiceEndDate');
    const initialQuotaInput = document.getElementById('invoiceInitialQuota');
    
    if (invoiceNumberInput) {
        invoiceNumberInput.value = invoice.numeroFactura || '';
    }
    
    // Formatear fecha final para el input date (formato YYYY-MM-DD)
    if (endDateInput && invoice.fechaFinal) {
        const fechaFinal = new Date(invoice.fechaFinal);
        if (!isNaN(fechaFinal.getTime())) {
            endDateInput.value = fechaFinal.toISOString().split('T')[0];
        } else {
            // Si no es una fecha válida, intentar parsear formato DD/MM/YYYY
            const parts = invoice.fechaFinal.split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                endDateInput.value = `${year}-${month}-${day}`;
            } else {
                endDateInput.value = invoice.fechaFinal;
            }
        }
    }
    
    // Cargar contrato y escalas primero (esto cargará la cuota inicial correcta)
    if (invoice.numeroContrato) {
        const cityCode = getSelectedCityCode();
        if (cityCode) {
            // Si la factura tiene escalas guardadas, usarlas directamente sin cargar del plan
            if (invoice.escalas && Array.isArray(invoice.escalas) && invoice.escalas.length > 0) {
                console.log('📋 Factura tiene escalas guardadas, cargándolas directamente...');
                // Cargar el contrato para obtener datos adicionales (cuota inicial, etc.)
                loadContractForInvoice(invoice.numeroContrato, invoice);
                // Renderizar escalas directamente desde la factura
                renderScalesFromInvoice(invoice.escalas);
                // Cargar datos adicionales (cuota inicial, fecha final)
                const foundContract = window.__currentContractForInvoice;
                if (foundContract) {
                    loadInvoiceAdditionalData(invoice, foundContract);
                }
            } else {
                // Si no hay escalas guardadas, cargar del plan/ejecutivo
                loadContractForInvoice(invoice.numeroContrato, invoice);
            }
        } else {
            // Si no hay ciudad, al menos mostrar el número de contrato
            if (contractInput) {
                contractInput.value = invoice.numeroContrato || '';
            }
            // Intentar cargar cuota inicial desde la factura directamente
            if (initialQuotaInput && invoice.cuotaInicial) {
                const cuotaInicial = Number(invoice.cuotaInicial) || 0;
                // Si el valor es muy pequeño, podría estar mal guardado
                if (cuotaInicial > 0 && cuotaInicial < 1000) {
                    console.warn('⚠️ Cuota inicial parece estar mal guardada:', cuotaInicial);
                }
                initialQuotaInput.value = formatCurrencyInput(cuotaInicial);
            }
        }
    } else {
        // Si no hay contrato, limpiar el campo
        if (contractInput) {
            contractInput.value = '';
        }
        // Si hay escalas guardadas, renderizarlas directamente
        if (invoice.escalas && Array.isArray(invoice.escalas) && invoice.escalas.length > 0) {
            console.log('📋 Factura sin contrato pero con escalas guardadas, cargándolas directamente...');
            renderScalesFromInvoice(invoice.escalas);
        }
        // Intentar cargar cuota inicial desde la factura directamente
        if (initialQuotaInput && invoice.cuotaInicial) {
            const cuotaInicial = Number(invoice.cuotaInicial) || 0;
            initialQuotaInput.value = formatCurrencyInput(cuotaInicial);
        }
    }
}

function viewInvoiceDetail(invoiceId) {
    // Función mantenida por compatibilidad, pero ahora redirige a editar
    editInvoice(invoiceId);
}

// ========================================
// RENDERIZADO DE TABLAS
// ========================================

function renderPayrollTable(data) {
    const tbody = document.getElementById('payrollTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-coins"></i>
                        <p>No existen registros de nómina semanal</p>
                        <small>Haz clic en "Crear Nómina Semanal" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    data.forEach(payroll => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payroll.codigo}</td>
            <td>${payroll.ciudadCodigo} - ${payroll.ciudadNombre}</td>
            <td>${formatDate(payroll.fechaInicio)}</td>
            <td>${formatDate(payroll.fechaFin)}</td>
            <td>${payroll.semana}</td>
            <td>${(payroll.facturas || []).length}</td>
            <td class="options-column">
                <div class="action-buttons-cell">
                    <button class="btn-icon" onclick="editPayroll('${payroll.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="viewPayrollDetail('${payroll.id}')" title="Ver Detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-icon-danger" onclick="showConfirmDeletePayrollModal('${payroll.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========================================
// PERSISTENCIA DE DATOS
// ========================================

/**
 * 🔗 BACKEND INTEGRATION - GUARDAR DATOS DE NÓMINA
 * 
 * Guarda los datos de nóminas semanales en localStorage (temporal).
 * 
 * BACKEND: Reemplazar con llamada a API
 * - Endpoint: PUT /api/nomina/semanal/batch?ciudad={cityCode}
 * - Método: PUT
 * - Body: { nóminas: payrollData }
 * - Headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {token}' }
 * 
 * @returns {void}
 */
function savePayrollData() {
    const cityCode = getSelectedCityCode();
    if (cityCode) {
        try {
            // TODO: Reemplazar con llamada a API del backend
            // Guardar allPayrollData (datos completos sin filtrar) en lugar de payrollData
            const dataToSave = allPayrollData.length > 0 ? allPayrollData : payrollData;
            localStorage.setItem(`nominaSemanal_${cityCode}`, JSON.stringify(dataToSave));
            console.log(`💾 Guardadas ${dataToSave.length} nóminas para ciudad ${cityCode}`);
            // Actualizar allPayrollData si se guardó desde payrollData
            if (allPayrollData.length === 0 && payrollData.length > 0) {
                allPayrollData = [...payrollData];
            }
        } catch (e) {
            console.error('Error guardando nóminas:', e);
        }
    }
}

/**
 * 🔗 BACKEND INTEGRATION - CARGAR DATOS DE NÓMINA
 * 
 * Carga los datos de nóminas semanales desde localStorage (temporal).
 * 
 * BACKEND: Reemplazar con llamada a API
 * - Endpoint: GET /api/nomina/semanal?ciudad={cityCode}
 * - Método: GET
 * - Headers: { 'Authorization': 'Bearer {token}' }
 * - Response: { nóminas: [...], total: number }
 * 
 * @returns {void}
 */
function loadPayrollData() {
    const cityCode = getSelectedCityCode();
    if (!cityCode) {
        payrollData = [];
        return;
    }

    try {
        // TODO: Reemplazar con llamada a API del backend
        const stored = localStorage.getItem(`nominaSemanal_${cityCode}`);
        if (stored) {
            payrollData = JSON.parse(stored);
            allPayrollData = JSON.parse(stored); // Guardar copia sin filtrar
            console.log(`✅ Cargadas ${payrollData.length} nóminas para ciudad ${cityCode}`);
            // Verificar facturas en cada nómina
            payrollData.forEach(p => {
                const facturasCount = (p.facturas || []).length;
                console.log(`  - Nómina ${p.codigo}: ${facturasCount} factura(s)`);
            });
        } else {
            payrollData = [];
            allPayrollData = [];
        }
    } catch (e) {
        console.error('Error cargando nóminas:', e);
        payrollData = [];
        allPayrollData = [];
    }

    renderPayrollTable(payrollData);
}

/**
 * Muestra el modal de búsqueda de nómina
 * 
 * @returns {void}
 */
function showSearchNominaModal() {
    const modal = document.getElementById('searchNominaModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Limpiar campo de búsqueda
        const fechaInput = document.getElementById('searchNominaFechaInicio');
        if (fechaInput) {
            fechaInput.value = '';
        }
    }
}

/**
 * Oculta el modal de búsqueda de nómina
 * 
 * @returns {void}
 */
function hideSearchNominaModal() {
    const modal = document.getElementById('searchNominaModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Muestra el modal de resultados de búsqueda de nómina
 * 
 * @returns {void}
 */
function showNominaResultsModal() {
    const modal = document.getElementById('nominaResultsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta el modal de resultados de búsqueda de nómina
 * 
 * @returns {void}
 */
function hideNominaResultsModal() {
    const modal = document.getElementById('nominaResultsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Busca nóminas por fecha de inicio y muestra los resultados en el modal
 * 
 * @returns {void}
 */
function buscarNominaPorFechaInicio() {
    const fechaInicioInput = document.getElementById('searchNominaFechaInicio');
    
    if (!fechaInicioInput) {
        console.error('No se encontró el campo de búsqueda');
        return;
    }
    
    const fechaBusqueda = fechaInicioInput.value;
    
    if (!fechaBusqueda) {
        showNotification('Por favor, seleccione una fecha de inicio para buscar', 'warning');
        return;
    }
    
    // Cargar todos los datos si no están cargados
    const cityCode = getSelectedCityCode();
    if (!cityCode) {
        showNotification('Por favor, seleccione una ciudad primero', 'warning');
        return;
    }
    
    // Asegurar que tenemos todos los datos
    if (allPayrollData.length === 0) {
        try {
            const stored = localStorage.getItem(`nominaSemanal_${cityCode}`);
            if (stored) {
                allPayrollData = JSON.parse(stored);
            } else {
                allPayrollData = [];
            }
        } catch (e) {
            console.error('Error cargando nóminas:', e);
            allPayrollData = [];
        }
    }
    
    // Filtrar nóminas por fecha de inicio
    // Comparar solo la fecha (sin hora) para que coincida exactamente
    const fechaBusquedaDate = new Date(fechaBusqueda);
    fechaBusquedaDate.setHours(0, 0, 0, 0);
    
    const resultados = allPayrollData.filter(payroll => {
        if (!payroll.fechaInicio) return false;
        
        // Convertir la fecha de la nómina a objeto Date y normalizar
        const fechaNomina = new Date(payroll.fechaInicio);
        fechaNomina.setHours(0, 0, 0, 0);
        
        // Comparar fechas
        return fechaNomina.getTime() === fechaBusquedaDate.getTime();
    });
    
    // Renderizar resultados en el modal
    renderNominaSearchResults(resultados);
    
    // Cerrar modal de búsqueda y abrir modal de resultados
    hideSearchNominaModal();
    showNominaResultsModal();
    
    // Mostrar notificación con resultados
    if (resultados.length === 0) {
        showNotification('No se encontraron nóminas con la fecha de inicio seleccionada', 'info');
    } else {
        showNotification(`Se encontraron ${resultados.length} nómina(s) con la fecha de inicio seleccionada`, 'success');
    }
}

/**
 * Renderiza los resultados de búsqueda en el modal
 * 
 * @param {Array<Object>} resultados - Array de nóminas encontradas
 * @returns {void}
 */
function renderNominaSearchResults(resultados) {
    const tbody = document.getElementById('nominaSearchResultsBody');
    if (!tbody) return;
    
    if (!resultados || resultados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron resultados</p>
                        <small>Intente con otra fecha de inicio</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    resultados.forEach(payroll => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payroll.codigo}</td>
            <td>${payroll.ciudadCodigo} - ${payroll.ciudadNombre}</td>
            <td>${formatDate(payroll.fechaInicio)}</td>
            <td>${formatDate(payroll.fechaFin)}</td>
            <td>${payroll.semana}</td>
            <td>${(payroll.facturas || []).length}</td>
            <td class="options-column">
                <div class="action-buttons-cell">
                    <button class="btn-icon" onclick="viewPayrollDetailFromSearch('${payroll.id}')" title="Ver Detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Muestra el detalle de una nómina desde los resultados de búsqueda
 * 
 * @param {string} payrollId - ID de la nómina a ver
 * @returns {void}
 */
function viewPayrollDetailFromSearch(payrollId) {
    // Cerrar modal de resultados
    hideNominaResultsModal();
    
    // Buscar la nómina en allPayrollData si no está en payrollData
    let payroll = payrollData.find(p => p.id === payrollId);
    if (!payroll && allPayrollData.length > 0) {
        payroll = allPayrollData.find(p => p.id === payrollId);
        // Si se encuentra en allPayrollData, agregarlo temporalmente a payrollData para que viewPayrollDetail funcione
        if (payroll) {
            const exists = payrollData.find(p => p.id === payrollId);
            if (!exists) {
                payrollData.push(payroll);
            }
        }
    }
    
    // Mostrar detalle de la nómina
    if (payroll) {
        viewPayrollDetail(payrollId);
    } else {
        showNotification('No se pudo encontrar la nómina seleccionada', 'error');
    }
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

function formatDate(dateString) {
    if (!dateString) return '-';
    
    // Si la fecha está en formato YYYY-MM-DD, parsearla manualmente para evitar problemas de zona horaria
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        // Crear fecha en zona horaria local (no UTC)
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
    
    // Para otros formatos, usar el método estándar
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatCurrency(value) {
    if (value === null || value === undefined) return '0';
    // Formatear sin decimales, solo con separador de miles
    return parseFloat(value).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatCuotaInicial(value) {
    if (value === null || value === undefined) return '0';
    // Formatear cuota inicial sin decimales, solo con separador de miles
    const numValue = Number(value) || 0;
    return numValue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Obtiene la información de un contrato para usar en facturas
 * 
 * Busca un contrato por número en localStorage y lo retorna.
 * 
 * 🔗 BACKEND INTEGRATION:
 * - Endpoint: GET /api/contratos/{contractNumber}?ciudad={cityCode}
 * - Método: GET
 * - Headers: { 'Authorization': 'Bearer {token}' }
 * 
 * @param {string} contractNumber - Número del contrato
 * @param {string} cityCode - Código de la ciudad
 * @returns {Object|null} Objeto del contrato o null si no se encuentra
 */
function getContractInfoForInvoice(contractNumber, cityCode) {
    try {
        // 🔗 BACKEND INTEGRATION: Reemplazar con llamada a API
        // const response = await fetch(`/api/contratos/${contractNumber}?ciudad=${cityCode}`, {
        //     method: 'GET',
        //     headers: { 'Authorization': `Bearer ${token}` }
        // });
        // const contract = await response.json();
        // return contract;
        
        // TODO: Reemplazar con llamada a API del backend
        const storedContracts = localStorage.getItem(`contratos_${cityCode}`) || 
                                localStorage.getItem(`contracts_${cityCode}`);
        
        if (!storedContracts) return null;
        
        const contracts = JSON.parse(storedContracts);
        const contractsArray = Array.isArray(contracts) ? contracts : Object.values(contracts);
        
        const searchNumber = String(contractNumber).trim();
        
        for (const contract of contractsArray) {
            const numeroContrato = contract.numeroContrato || 
                                 contract.numero || 
                                 contract.contractNumber || 
                                 contract.nro || 
                                 contract.contract || '';
            
            const contractId = String(contract.id || '').trim();
            
            if (String(numeroContrato).trim() === searchNumber || 
                contractId === searchNumber ||
                String(contract.id) === searchNumber) {
                return contract;
            }
        }
    } catch(e) {
        console.error('Error buscando contrato:', e);
    }
    return null;
}

// ========================================
// FORMATO NUMÉRICO
// ========================================

/**
 * Inicializa la funcionalidad de búsqueda de nómina
 * Configura los event listeners para el modal de búsqueda
 * 
 * @returns {void}
 */
function initializeSearchNomina() {
    // Event listener para el botón de buscar
    const bBuscarNomina = document.getElementById('bBuscarNomina');
    if (bBuscarNomina) {
        bBuscarNomina.addEventListener('click', buscarNominaPorFechaInicio);
    }
    
    // Permitir buscar presionando Enter en el campo de fecha
    const searchFechaInicio = document.getElementById('searchNominaFechaInicio');
    if (searchFechaInicio) {
        searchFechaInicio.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarNominaPorFechaInicio();
            }
        });
    }
    
    // Cerrar modales al hacer clic fuera
    const searchModal = document.getElementById('searchNominaModal');
    if (searchModal) {
        searchModal.addEventListener('click', function(e) {
            if (e.target === searchModal) {
                hideSearchNominaModal();
            }
        });
    }
    
    const resultsModal = document.getElementById('nominaResultsModal');
    if (resultsModal) {
        resultsModal.addEventListener('click', function(e) {
            if (e.target === resultsModal) {
                hideNominaResultsModal();
            }
        });
    }
}

function initializeNumericFormatting() {
    // Inputs con formato de número (con separadores de miles y decimales)
    const numericInputs = document.querySelectorAll('.numeric-input');
    numericInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = this.value.replace(/[^\d.]/g, '');
            
            // Permitir solo un punto decimal
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            if (value && value !== '.') {
                // Formatear con separadores de miles
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    this.value = formatCurrencyInput(numValue);
                }
            } else if (value === '') {
                this.value = '';
            }
        });

        input.addEventListener('blur', function() {
            if (this.value) {
                const numValue = parseFloat(this.value.replace(/[^\d.]/g, ''));
                if (!isNaN(numValue)) {
                    this.value = formatCurrencyInput(numValue);
                }
            }
        });
    });
}

/**
 * Parsea un valor numérico desde un string, manejando correctamente el formato colombiano
 * donde el punto es separador de miles, no decimal
 */
function parseNumericValue(value) {
    if (!value || value.trim() === '') return 0;
    
    // Remover todos los caracteres no numéricos excepto punto
    let cleanValue = String(value).replace(/[^\d.]/g, '');
    
    if (!cleanValue || cleanValue === '.') return 0;
    
    // Si hay múltiples puntos, es formato colombiano (separadores de miles)
    // Remover todos los puntos y convertir a número
    if (cleanValue.includes('.')) {
        // Si tiene más de un punto o el punto no está en las últimas 3 posiciones,
        // es separador de miles (formato colombiano)
        const parts = cleanValue.split('.');
        if (parts.length > 2 || (parts.length === 2 && parts[1].length > 2)) {
            // Es formato colombiano: remover todos los puntos
            cleanValue = cleanValue.replace(/\./g, '');
        } else if (parts.length === 2 && parts[1].length <= 2) {
            // Podría ser decimal, pero en este caso no usamos decimales
            // Tratarlo como separador de miles
            cleanValue = cleanValue.replace(/\./g, '');
        }
    }
    
    const numValue = parseInt(cleanValue, 10);
    return isNaN(numValue) ? 0 : numValue;
}

function formatCurrencyInput(value) {
    if (isNaN(value) || value === null || value === undefined) return '';
    // Formatear con formato colombiano (punto como separador de miles, sin decimales)
    return new Intl.NumberFormat('es-CO', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    }).format(Number(value));
}

// ========================================
// NOTIFICACIONES
// ========================================

function showNotification(message, type = 'info') {
    // Remover notificación existente si hay
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Mostrar notificación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Ocultar y remover después de 3 segundos
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
// FUNCIONES DE MODALES DE REPORTES
// ========================================

function showReporteSemanalModal() {
    const modal = document.getElementById('reporteSemanalModal');
    if (!modal) return;

    // Limpiar formulario
    const codigoCiudadInput = document.getElementById('reporteSemanalCodigoCiudad');
    const ciudadDisplay = document.getElementById('reporteSemanalCiudadDisplay');
    const fechaInicioInput = document.getElementById('reporteSemanalFechaInicio');
    const fechaFinInput = document.getElementById('reporteSemanalFechaFin');
    
    if (codigoCiudadInput) {
        codigoCiudadInput.value = '';
    }
    if (ciudadDisplay) {
        ciudadDisplay.style.display = 'none';
        ciudadDisplay.textContent = '';
    }
    if (fechaInicioInput) {
        fechaInicioInput.value = '';
    }
    if (fechaFinInput) {
        fechaFinInput.value = '';
    }

    // Configurar event listener para buscar ciudad
    setupCitySearchForReporteSemanal();

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function setupCitySearchForReporteSemanal() {
    const codigoCiudadInput = document.getElementById('reporteSemanalCodigoCiudad');
    const ciudadDisplay = document.getElementById('reporteSemanalCiudadDisplay');
    
    if (!codigoCiudadInput || !ciudadDisplay) return;
    
    // Remover listener anterior si existe
    const oldHandler = codigoCiudadInput._citySearchHandler;
    if (oldHandler) {
        codigoCiudadInput.removeEventListener('blur', oldHandler);
        codigoCiudadInput.removeEventListener('input', oldHandler);
    }
    
    function handleCitySearch() {
        const codigo = codigoCiudadInput.value.trim();
        
        if (codigo.length >= 2) {
            const city = getCityByCode(codigo);
            if (city) {
                ciudadDisplay.textContent = `Ciudad: ${city.nombre}`;
                ciudadDisplay.style.display = 'block';
                ciudadDisplay.style.backgroundColor = '#d4edda';
                ciudadDisplay.style.borderColor = '#c3e6cb';
                ciudadDisplay.style.color = '#155724';
            } else {
                ciudadDisplay.textContent = 'Ciudad no encontrada';
                ciudadDisplay.style.display = 'block';
                ciudadDisplay.style.backgroundColor = '#f8d7da';
                ciudadDisplay.style.borderColor = '#f5c6cb';
                ciudadDisplay.style.color = '#721c24';
            }
        } else if (codigo.length === 0) {
            ciudadDisplay.style.display = 'none';
        }
    }
    
    codigoCiudadInput._citySearchHandler = handleCitySearch;
    codigoCiudadInput.addEventListener('blur', handleCitySearch);
    codigoCiudadInput.addEventListener('input', function(e) {
        // Buscar mientras escribe con un pequeño delay
        clearTimeout(codigoCiudadInput._searchTimeout);
        codigoCiudadInput._searchTimeout = setTimeout(handleCitySearch, 300);
    });
}

function getCityByCode(codigo) {
    try {
        // Intentar primero con la función global si existe
        if (typeof window.getCiudadesData === 'function') {
            const ciudades = window.getCiudadesData() || {};
            const city = ciudades[codigo] || ciudades[String(codigo).trim()];
            if (city) return city;
        }
        
        // Buscar en localStorage con diferentes claves posibles
        const possibleKeys = ['ciudadesData', 'cities'];
        
        for (const key of possibleKeys) {
            const citiesRaw = localStorage.getItem(key);
            if (!citiesRaw) continue;

            try {
                const cities = JSON.parse(citiesRaw);
                
                // Si es un objeto con códigos como claves
                if (cities && typeof cities === 'object' && !Array.isArray(cities)) {
                    let foundCity = cities[codigo] || cities[String(codigo).trim()];
                    if (foundCity && foundCity.codigo && foundCity.nombre) {
                        return foundCity;
                    }
                    
                    // Buscar en los valores del objeto
                    const citiesArray = Object.values(cities);
                    foundCity = citiesArray.find(c => 
                        c && c.codigo && (
                            String(c.codigo).trim() === String(codigo).trim() ||
                            String(c.codigo).trim().toUpperCase() === String(codigo).trim().toUpperCase()
                        )
                    );
                    if (foundCity) return foundCity;
                }
                
                // Si es un array
                if (Array.isArray(cities)) {
                    const foundCity = cities.find(c => 
                        c && c.codigo && (
                            String(c.codigo).trim() === String(codigo).trim() ||
                            String(c.codigo).trim().toUpperCase() === String(codigo).trim().toUpperCase()
                        )
                    );
                    if (foundCity) return foundCity;
                }
            } catch (e) {
                console.error(`Error parseando ${key}:`, e);
            }
        }
        
        return null;
    } catch (e) {
        console.error('Error buscando ciudad:', e);
        return null;
    }
}

function hideReporteSemanalModal() {
    const modal = document.getElementById('reporteSemanalModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showReporteCuadreModal() {
    const cityCode = getSelectedCityCode();
    if (!cityCode) {
        showNotification('Por favor, seleccione una ciudad primero', 'warning');
        return;
    }

    const modal = document.getElementById('reporteCuadreModal');
    if (!modal) return;

    // Limpiar campos
    const codigoCiudadInput = document.getElementById('reporteCuadreCodigoCiudad');
    const ciudadDisplay = document.getElementById('reporteCuadreCiudadDisplay');
    const fechaInicioInput = document.getElementById('reporteCuadreFechaInicio');
    const fechaFinInput = document.getElementById('reporteCuadreFechaFin');
    
    if (codigoCiudadInput) {
        codigoCiudadInput.value = '';
    }
    if (ciudadDisplay) {
        ciudadDisplay.style.display = 'none';
        ciudadDisplay.textContent = '';
    }
    if (fechaInicioInput) {
        fechaInicioInput.value = '';
    }
    if (fechaFinInput) {
        fechaFinInput.value = '';
    }

    // Configurar event listener para buscar ciudad
    setupCitySearchForReporteCuadre();

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function setupCitySearchForReporteCuadre() {
    const codigoCiudadInput = document.getElementById('reporteCuadreCodigoCiudad');
    const ciudadDisplay = document.getElementById('reporteCuadreCiudadDisplay');
    
    if (!codigoCiudadInput || !ciudadDisplay) return;
    
    // Remover listener anterior si existe
    const oldHandler = codigoCiudadInput._citySearchHandler;
    if (oldHandler) {
        codigoCiudadInput.removeEventListener('blur', oldHandler);
        codigoCiudadInput.removeEventListener('input', oldHandler);
    }
    
    function handleCitySearch() {
        const codigo = codigoCiudadInput.value.trim();
        
        if (codigo.length >= 2) {
            const city = getCityByCode(codigo);
            if (city) {
                ciudadDisplay.textContent = `Ciudad: ${city.nombre}`;
                ciudadDisplay.style.display = 'block';
                ciudadDisplay.style.backgroundColor = '#d4edda';
                ciudadDisplay.style.color = '#155724';
                ciudadDisplay.style.border = '1px solid #c3e6cb';
            } else {
                ciudadDisplay.textContent = 'Ciudad no encontrada';
                ciudadDisplay.style.display = 'block';
                ciudadDisplay.style.backgroundColor = '#f8d7da';
                ciudadDisplay.style.color = '#721c24';
                ciudadDisplay.style.border = '1px solid #f5c6cb';
            }
        } else {
            ciudadDisplay.style.display = 'none';
        }
    }
    
    codigoCiudadInput._citySearchHandler = handleCitySearch;
    codigoCiudadInput.addEventListener('blur', handleCitySearch);
    codigoCiudadInput.addEventListener('input', handleCitySearch);
}

function hideReporteCuadreModal() {
    const modal = document.getElementById('reporteCuadreModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function loadPayrollsForReport() {
    const select = document.getElementById('reporteSemanalPayroll');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione una nómina</option>';

    if (!payrollData || payrollData.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No hay nóminas disponibles';
        opt.disabled = true;
        select.appendChild(opt);
        return;
    }

    // Ordenar por fecha de creación (más recientes primero)
    const sortedPayrolls = [...payrollData].sort((a, b) => {
        const dateA = new Date(a.fechaCreacion || 0);
        const dateB = new Date(b.fechaCreacion || 0);
        return dateB - dateA;
    });

    sortedPayrolls.forEach(payroll => {
        const opt = document.createElement('option');
        opt.value = payroll.id;
        const fechaInicio = formatDate(payroll.fechaInicio);
        const fechaFin = formatDate(payroll.fechaFin);
        opt.textContent = `${payroll.codigo} - Semana ${payroll.semana} (${fechaInicio} a ${fechaFin})`;
        select.appendChild(opt);
    });
}

function handleGenerateReporteSemanal() {
    const codigoCiudad = document.getElementById('reporteSemanalCodigoCiudad').value.trim();
    const fechaInicio = document.getElementById('reporteSemanalFechaInicio').value;
    const fechaFin = document.getElementById('reporteSemanalFechaFin').value;
    
    if (!codigoCiudad) {
        showNotification('Por favor, ingrese el código de ciudad', 'warning');
        return;
    }
    
    // Verificar que la ciudad existe
    const city = getCityByCode(codigoCiudad);
    if (!city) {
        showNotification('El código de ciudad ingresado no existe', 'warning');
        return;
    }
    
    if (!fechaInicio) {
        showNotification('Por favor, ingrese la fecha de inicio', 'warning');
        return;
    }
    
    if (!fechaFin) {
        showNotification('Por favor, ingrese la fecha fin', 'warning');
        return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
        showNotification('La fecha de inicio no puede ser mayor que la fecha fin', 'warning');
        return;
    }

    // Guardar datos del reporte en localStorage para la página de reporte
    try {
        const reportData = {
            codigoFilial: codigoCiudad,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin
        };
        
        localStorage.setItem('reporteNominaSemanalData', JSON.stringify(reportData));
        
        // Abrir reporte en nueva pestaña
        const reportUrl = '../reportes/reporte-semanal.html';
        window.open(reportUrl, '_blank');
        
        hideReporteSemanalModal();
        showNotification('Reporte generado correctamente', 'success');
    } catch (e) {
        console.error('Error generando reporte:', e);
        showNotification('Error al generar el reporte', 'error');
    }
}

function handleGenerateReporteCuadre() {
    const codigoCiudad = document.getElementById('reporteCuadreCodigoCiudad').value.trim();
    const fechaInicio = document.getElementById('reporteCuadreFechaInicio').value;
    const fechaFin = document.getElementById('reporteCuadreFechaFin').value;
    
    if (!codigoCiudad) {
        showNotification('Por favor, ingrese el código de ciudad', 'warning');
        return;
    }
    
    // Verificar que la ciudad existe
    const city = getCityByCode(codigoCiudad);
    if (!city) {
        showNotification('El código de ciudad ingresado no existe', 'warning');
        return;
    }
    
    if (!fechaInicio) {
        showNotification('Por favor, ingrese la fecha de inicio', 'warning');
        return;
    }
    
    if (!fechaFin) {
        showNotification('Por favor, ingrese la fecha fin', 'warning');
        return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
        showNotification('La fecha de inicio no puede ser mayor que la fecha fin', 'warning');
        return;
    }

    // Guardar datos del reporte en localStorage para la página de reporte
    try {
        const reportData = {
            fechaInicio,
            fechaFin,
            ciudadCodigo: codigoCiudad,
            ciudadNombre: getCityNameByCode(codigoCiudad)
        };
        
        localStorage.setItem('reporteCuadreNominaData', JSON.stringify(reportData));
        
        // Abrir reporte en nueva pestaña
        const reportUrl = '../reportes/reporte-cuadre.html';
        window.open(reportUrl, '_blank');
        
        hideReporteCuadreModal();
        showNotification('Reporte generado correctamente', 'success');
    } catch (e) {
        console.error('Error generando reporte:', e);
        showNotification('Error al generar el reporte', 'error');
    }
}

// ========================================
// COMPROBANTE POR EJECUTIVO
// ========================================

function showComprobanteEjecutivoModal() {
    const modal = document.getElementById('comprobanteEjecutivoModal');
    if (!modal) return;

    // Limpiar formulario
    const fechaInicioInput = document.getElementById('comprobanteEjecutivoFechaInicio');
    const tipoBusquedaSelect = document.getElementById('comprobanteEjecutivoTipoBusqueda');
    const identificacionInput = document.getElementById('comprobanteEjecutivoIdentificacion');
    const nombreDisplay = document.getElementById('comprobanteEjecutivoNombreDisplay');
    const ciudadSelect = document.getElementById('comprobanteEjecutivoCiudad');
    const porEjecutivoRow = document.getElementById('comprobanteEjecutivoPorEjecutivoRow');
    const porCiudadRow = document.getElementById('comprobanteEjecutivoPorCiudadRow');
    
    if (fechaInicioInput) {
        fechaInicioInput.value = '';
    }
    if (tipoBusquedaSelect) {
        tipoBusquedaSelect.value = '';
    }
    if (identificacionInput) {
        identificacionInput.value = '';
        identificacionInput.removeAttribute('required');
    }
    if (nombreDisplay) {
        nombreDisplay.style.display = 'none';
        nombreDisplay.textContent = '';
    }
    if (ciudadSelect) {
        ciudadSelect.value = '';
        ciudadSelect.removeAttribute('required');
    }
    if (porEjecutivoRow) {
        porEjecutivoRow.style.display = 'none';
    }
    if (porCiudadRow) {
        porCiudadRow.style.display = 'none';
    }

    // Poblar select de ciudades
    populateComprobanteEjecutivoCiudadSelect();

    // Configurar event listener para buscar ejecutivo
    setupExecutiveSearchForComprobante();
    
    // Configurar listener para cambiar campos según tipo de búsqueda
    setupComprobanteTipoBusquedaHandler();

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function setupComprobanteTipoBusquedaHandler() {
    const tipoBusquedaSelect = document.getElementById('comprobanteEjecutivoTipoBusqueda');
    const porEjecutivoRow = document.getElementById('comprobanteEjecutivoPorEjecutivoRow');
    const porCiudadRow = document.getElementById('comprobanteEjecutivoPorCiudadRow');
    const identificacionInput = document.getElementById('comprobanteEjecutivoIdentificacion');
    const ciudadSelect = document.getElementById('comprobanteEjecutivoCiudad');
    
    if (!tipoBusquedaSelect || !porEjecutivoRow || !porCiudadRow) return;
    
    function updateFieldsVisibility() {
        const tipoBusqueda = tipoBusquedaSelect.value;
        
        if (tipoBusqueda === 'ejecutivo') {
            // Mostrar campo de identificación, ocultar campo de ciudad
            porEjecutivoRow.style.display = 'flex';
            porCiudadRow.style.display = 'none';
            if (identificacionInput) {
                identificacionInput.setAttribute('required', 'required');
            }
            if (ciudadSelect) {
                ciudadSelect.removeAttribute('required');
                ciudadSelect.value = '';
            }
        } else if (tipoBusqueda === 'ciudad') {
            // Mostrar campo de ciudad, ocultar campo de identificación
            porEjecutivoRow.style.display = 'none';
            porCiudadRow.style.display = 'flex';
            if (identificacionInput) {
                identificacionInput.removeAttribute('required');
                identificacionInput.value = '';
                const nombreDisplay = document.getElementById('comprobanteEjecutivoNombreDisplay');
                if (nombreDisplay) {
                    nombreDisplay.style.display = 'none';
                    nombreDisplay.textContent = '';
                }
            }
            if (ciudadSelect) {
                ciudadSelect.setAttribute('required', 'required');
            }
        } else {
            // Ocultar ambos campos
            porEjecutivoRow.style.display = 'none';
            porCiudadRow.style.display = 'none';
            if (identificacionInput) {
                identificacionInput.removeAttribute('required');
            }
            if (ciudadSelect) {
                ciudadSelect.removeAttribute('required');
            }
        }
    }
    
    // Remover listener anterior si existe
    if (tipoBusquedaSelect._tipoBusquedaHandler) {
        tipoBusquedaSelect.removeEventListener('change', tipoBusquedaSelect._tipoBusquedaHandler);
    }
    
    // Agregar nuevo listener
    tipoBusquedaSelect._tipoBusquedaHandler = updateFieldsVisibility;
    tipoBusquedaSelect.addEventListener('change', updateFieldsVisibility);
}

function setupExecutiveSearchForComprobante() {
    const identificacionInput = document.getElementById('comprobanteEjecutivoIdentificacion');
    const nombreDisplay = document.getElementById('comprobanteEjecutivoNombreDisplay');
    
    if (!identificacionInput || !nombreDisplay) return;
    
    // Remover listener anterior si existe
    const oldHandler = identificacionInput._executiveSearchHandler;
    if (oldHandler) {
        identificacionInput.removeEventListener('blur', oldHandler);
        identificacionInput.removeEventListener('input', oldHandler);
    }
    
    function handleExecutiveSearch() {
        const identificacion = identificacionInput.value.trim();
        
        if (identificacion.length >= 5) {
            // Buscar ejecutivo en todas las ciudades
            const ejecutivo = findExecutiveInAllCities(identificacion);
            if (ejecutivo) {
                const nombreCompleto = [
                    ejecutivo.empleado.tPrimerApellido || ejecutivo.empleado.primerApellido,
                    ejecutivo.empleado.tSegundoApellido || ejecutivo.empleado.segundoApellido,
                    ejecutivo.empleado.tPrimerNombre || ejecutivo.empleado.primerNombre,
                    ejecutivo.empleado.tSegundoNombre || ejecutivo.empleado.segundoNombre
                ].filter(Boolean).join(' ').toUpperCase();
                
                nombreDisplay.textContent = `Ejecutivo: ${nombreCompleto}`;
                nombreDisplay.style.display = 'block';
                nombreDisplay.style.backgroundColor = '#d4edda';
                nombreDisplay.style.borderColor = '#c3e6cb';
                nombreDisplay.style.color = '#155724';
            } else {
                nombreDisplay.textContent = 'Ejecutivo no encontrado';
                nombreDisplay.style.display = 'block';
                nombreDisplay.style.backgroundColor = '#f8d7da';
                nombreDisplay.style.borderColor = '#f5c6cb';
                nombreDisplay.style.color = '#721c24';
            }
        } else if (identificacion.length === 0) {
            nombreDisplay.style.display = 'none';
        }
    }
    
    identificacionInput._executiveSearchHandler = handleExecutiveSearch;
    identificacionInput.addEventListener('blur', handleExecutiveSearch);
    identificacionInput.addEventListener('input', function(e) {
        clearTimeout(identificacionInput._searchTimeout);
        identificacionInput._searchTimeout = setTimeout(handleExecutiveSearch, 300);
    });
}

function findExecutiveInAllCities(identificacion) {
    try {
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        if (!empleadosByCity) return null;
        
        const data = JSON.parse(empleadosByCity);
        const idBuscado = String(identificacion).trim();
        const idBuscadoNum = idBuscado.replace(/\D/g, '');
        
        // Buscar en todas las ciudades
        for (const [cityCode, empleados] of Object.entries(data)) {
            if (!empleados || typeof empleados !== 'object') continue;
            
            // Buscar coincidencia exacta primero
            if (empleados[idBuscado]) {
                return { empleado: empleados[idBuscado], ciudad: cityCode };
            }
            
            // Buscar por coincidencia numérica o parcial
            for (const [id, empleado] of Object.entries(empleados)) {
                const idNormalizado = String(id).trim();
                const idSoloNumeros = idNormalizado.replace(/\D/g, '');
                
                if (idNormalizado === idBuscado || 
                    (idSoloNumeros && idSoloNumeros === idBuscadoNum && idBuscadoNum.length > 0) ||
                    idNormalizado.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '')) {
                    return { empleado, ciudad: cityCode };
                }
                
                // También comparar con el campo identificacion del empleado
                const empId = empleado.identificacion ? String(empleado.identificacion).trim() : '';
                const empIdNum = empId.replace(/\D/g, '');
                
                if (empId && (empId === idBuscado || 
                    (empIdNum && empIdNum === idBuscadoNum && idBuscadoNum.length > 0) ||
                    empId.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, ''))) {
                    return { empleado, ciudad: cityCode };
                }
            }
        }
        
        return null;
    } catch(e) {
        console.error('Error buscando ejecutivo:', e);
        return null;
    }
}

function hideComprobanteEjecutivoModal() {
    const modal = document.getElementById('comprobanteEjecutivoModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function populateComprobanteEjecutivoCiudadSelect() {
    const sel = document.getElementById('comprobanteEjecutivoCiudad');
    if (!sel) return;
    
    let ciudades = {};
    if (typeof window.getCiudadesData === 'function') {
        try { 
            ciudades = window.getCiudadesData(); 
        } catch (e) { 
            ciudades = {}; 
        }
    } else {
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
    
    const current = sel.value;
    sel.innerHTML = '<option value="">Seleccione la ciudad</option>';
    
    Object.values(ciudades)
        .filter(c => c.activo !== false)
        .sort((a,b)=>String(a.codigo).localeCompare(String(b.codigo)))
        .forEach(c => {
            const opt = document.createElement('option');
            const code = String(c.codigo || '').toUpperCase();
            const name = String(c.nombre || '').toUpperCase();
            opt.value = c.codigo;
            opt.textContent = `${code} - ${name}`;
            sel.appendChild(opt);
        });
    
    // Fallback: si no hay catálogo, poblar desde empleadosByCity
    try {
        if (sel.options.length <= 1) {
            const rawEmp = localStorage.getItem('empleadosByCity');
            const parsedEmp = rawEmp ? JSON.parse(rawEmp) : {};
            Object.keys(parsedEmp || {}).sort().forEach(code => {
                if (!sel.querySelector(`option[value="${code}"]`)) {
                    const opt = document.createElement('option');
                    opt.value = code;
                    opt.textContent = `${String(code).toUpperCase()} - (empleados)`;
                    sel.appendChild(opt);
                }
            });
        }
    } catch (e) {}
    
    // Restaurar valor anterior si existe
    if (current) {
        sel.value = current;
    }
}

function handleGenerateComprobanteEjecutivo() {
    const fechaInicio = document.getElementById('comprobanteEjecutivoFechaInicio').value;
    const tipoBusqueda = document.getElementById('comprobanteEjecutivoTipoBusqueda').value;
    const identificacion = document.getElementById('comprobanteEjecutivoIdentificacion').value.trim();
    const ciudadCodigo = document.getElementById('comprobanteEjecutivoCiudad').value.trim();
    
    if (!fechaInicio) {
        showNotification('Por favor, ingrese la fecha de inicio', 'warning');
        return;
    }
    
    if (!tipoBusqueda) {
        showNotification('Por favor, seleccione el tipo de búsqueda', 'warning');
        return;
    }
    
    let nombreCompleto = '';
    let ejecutivoIdentificacion = '';
    let ciudadNombre = '';
    let ciudadCodigoFinal = '';
    let tipoReporte = '';
    
    if (tipoBusqueda === 'ejecutivo') {
        // Búsqueda por ejecutivo
        if (!identificacion) {
            showNotification('Por favor, ingrese la identificación del ejecutivo', 'warning');
            return;
        }
        
        // Validar que el ejecutivo exista
        const ejecutivo = findExecutiveInAllCities(identificacion);
        if (!ejecutivo) {
            showNotification('No se encontró el ejecutivo con la identificación ingresada', 'warning');
            return;
        }
        
        nombreCompleto = [
            ejecutivo.empleado.tPrimerApellido || ejecutivo.empleado.primerApellido,
            ejecutivo.empleado.tSegundoApellido || ejecutivo.empleado.segundoApellido,
            ejecutivo.empleado.tPrimerNombre || ejecutivo.empleado.primerNombre,
            ejecutivo.empleado.tSegundoNombre || ejecutivo.empleado.segundoNombre
        ].filter(Boolean).join(' ').toUpperCase();
        
        ejecutivoIdentificacion = identificacion;
        ciudadNombre = 'TODAS LAS CIUDADES';
        ciudadCodigoFinal = '';
        tipoReporte = 'ejecutivo';
    } else if (tipoBusqueda === 'ciudad') {
        // Búsqueda por ciudad
        if (!ciudadCodigo) {
            showNotification('Por favor, seleccione una ciudad', 'warning');
            return;
        }
        
        ciudadNombre = getCityNameByCode(ciudadCodigo) || '';
        if (!ciudadNombre) {
            showNotification('La ciudad seleccionada no es válida', 'warning');
            return;
        }
        
        nombreCompleto = 'TODOS LOS EJECUTIVOS';
        ejecutivoIdentificacion = '';
        ciudadCodigoFinal = ciudadCodigo;
        tipoReporte = 'ciudad';
    }

    // Guardar datos del reporte en localStorage para la página de reporte
    try {
        const reportData = {
            fechaInicio: fechaInicio,
            identificacion: ejecutivoIdentificacion,
            ejecutivoNombre: nombreCompleto,
            ejecutivoIdentificacion: ejecutivoIdentificacion,
            ciudadCodigo: ciudadCodigoFinal,
            ciudadNombre: ciudadNombre,
            tipoBusqueda: tipoBusqueda,
            tipoReporte: tipoReporte,
            fechaFinal: '' // Se puede agregar si se necesita
        };
        
        localStorage.setItem('comprobanteEjecutivoData', JSON.stringify(reportData));
        
        // Abrir reporte en nueva pestaña
        const reportUrl = '../reportes/comprobante-ejecutivo.html';
        window.open(reportUrl, '_blank');
        
        hideComprobanteEjecutivoModal();
        showNotification('Comprobante generado correctamente', 'success');
    } catch (e) {
        console.error('Error generando comprobante:', e);
        showNotification('Error al generar el comprobante', 'error');
    }
}

// ========================================
// GESTIÓN DE USUARIO
// ========================================

function initializeUserDropdown() {
    const userInfo = document.querySelector('.user-info');
    const userDropdown = document.getElementById('userDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const sidebar = document.querySelector('.sidebar');
    
    if (userInfo && userDropdown) {
        // Toggle del dropdown al hacer clic en el perfil
        userInfo.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
            if (dropdownArrow) {
                dropdownArrow.classList.toggle('open');
            }
            if (sidebar) {
                sidebar.classList.toggle('dropdown-open');
            }
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!userInfo.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
                if (dropdownArrow) {
                    dropdownArrow.classList.remove('open');
                }
                if (sidebar) {
                    sidebar.classList.remove('dropdown-open');
                }
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
                } else if (this.classList.contains('admin-users-item')) {
                    alert('Funcionalidad de administrar usuarios en desarrollo');
                }
                
                // Cerrar dropdown después del clic
                userDropdown.classList.remove('show');
                if (dropdownArrow) {
                    dropdownArrow.classList.remove('open');
                }
                if (sidebar) {
                    sidebar.classList.remove('dropdown-open');
                }
            });
        });
    }
}

// ========================================
// FUNCIONES DE MODAL DE CERRAR SESIÓN
// ========================================

// Exponer funciones de búsqueda en window para acceso desde HTML
window.showSearchNominaModal = showSearchNominaModal;
window.hideSearchNominaModal = hideSearchNominaModal;
window.hideNominaResultsModal = hideNominaResultsModal;
window.viewPayrollDetailFromSearch = viewPayrollDetailFromSearch;

// Exponer función de éxito al crear nómina
window.closeSuccessCreatePayrollModal = closeSuccessCreatePayrollModal;

// Exponer funciones de eliminación en window para acceso desde HTML
window.showConfirmDeletePayrollModal = showConfirmDeletePayrollModal;
window.cancelDeletePayroll = cancelDeletePayroll;
window.confirmDeletePayroll = confirmDeletePayroll;
window.closeSuccessDeletePayrollModal = closeSuccessDeletePayrollModal;
window.showConfirmDeleteInvoiceModal = showConfirmDeleteInvoiceModal;
window.cancelDeleteInvoice = cancelDeleteInvoice;
window.confirmDeleteInvoice = confirmDeleteInvoice;
window.closeSuccessDeleteInvoiceModal = closeSuccessDeleteInvoiceModal;

window.showConfirmLogoutModal = function() {
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

window.cancelLogout = function() {
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

window.confirmLogout = function() {
    // Limpiar datos de sesión
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Redirigir al index (3 niveles arriba desde pages/nomina/nomina-semanal/)
    window.location.href = '../../../index.html';
}

