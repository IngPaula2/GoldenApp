/**
 *  FUNCIONALIDAD INGRESO A CAJA - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de ingreso a caja.
 * Incluye gestión de modales y operaciones CRUD para ingresos a caja.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let cashInflowData = [];

function getSelectedCityCode() {
    try { return sessionStorage.getItem('selectedCity') || ''; } catch (e) { return ''; }
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando carga de interfaz de ingreso a caja...');
        
        // Inicializar dropdown del usuario PRIMERO (antes de otros componentes)
        const userInfo = document.querySelector('.user-info');
        const dropdown = document.getElementById('userDropdown');
        const dropdownArrow = document.querySelector('.dropdown-arrow');
        const sidebar = document.querySelector('.sidebar');

        if (userInfo && dropdown) {
            // Toggle del dropdown al hacer clic en el perfil
            userInfo.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log('Click en user-info detectado');
                dropdown.classList.toggle('show');
                console.log('Dropdown show:', dropdown.classList.contains('show'));
                if (dropdownArrow) {
                    dropdownArrow.classList.toggle('open');
                }
                if (sidebar) {
                    sidebar.classList.toggle('dropdown-open');
                }
            });
            
            // También agregar evento directamente a la flecha
            if (dropdownArrow) {
                dropdownArrow.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('Click en flecha detectado');
                    dropdown.classList.toggle('show');
                    dropdownArrow.classList.toggle('open');
                    if (sidebar) {
                        sidebar.classList.toggle('dropdown-open');
                    }
                });
            }
            
            // Cerrar dropdown al hacer clic fuera (pero no si es dentro del user-info o dropdown)
            document.addEventListener('click', function(e) {
                if (!userInfo.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('show');
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
                        // Lógica de administrar usuarios
                        alert('Funcionalidad de administrar usuarios en desarrollo');
                    }
                    // Cerrar dropdown después del clic
                    dropdown.classList.remove('show');
                    if (dropdownArrow) {
                        dropdownArrow.classList.remove('open');
                    }
                    if (sidebar) {
                        sidebar.classList.remove('dropdown-open');
                    }
                });
            });
        }
        
        // Inicializar componentes básicos (SIN cargar datos aún)
        initializeModals();
        initializeIncomeTypeSearch();
        initializeUppercaseInputs();
        
        console.log('✅ Componentes básicos inicializados');
        
        // Verificar datos de ciudades y mostrar modal INMEDIATAMENTE
        initializeCitySelection();
        
        console.log('✅ Interfaz de ingreso a caja cargada correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico al cargar la interfaz:', error);
    }
});

// ========================================
// GESTIÓN DE MODALES
// ========================================

function initializeModals() {
    
    // Cerrar modales al hacer clic fuera (excepto modal de ciudad y confirmación/éxito)
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
                // No cerrar modales de confirmación o éxito haciendo clic fuera
                if (this.id === 'confirmCreateInflowModal' || 
                    this.id === 'successCreateInflowModal' ||
                    this.id === 'confirmUpdateInflowModal' ||
                    this.id === 'successUpdateInflowModal' ||
                    this.id === 'confirmToggleInflowModal' ||
                    this.id === 'successToggleInflowModal') {
                    return;
                }
                // Cerrar modal de detalles con clic fuera
                if (this.id === 'createInflowDetailsModal') {
                    hideCreateInflowDetailsModal();
                    return;
                }
                hideAllModals();
            }
        });
    });
    
    // Cerrar modales con Escape (excepto confirmación y éxito)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const confirmModal = document.getElementById('confirmCreateInflowModal');
            const successModal = document.getElementById('successCreateInflowModal');
            const updateModal = document.getElementById('confirmUpdateInflowModal');
            const updateSuccessModal = document.getElementById('successUpdateInflowModal');
            const toggleModal = document.getElementById('confirmToggleInflowModal');
            const toggleSuccessModal = document.getElementById('successToggleInflowModal');
            const detailsModal = document.getElementById('createInflowDetailsModal');
            if (confirmModal && confirmModal.style.display === 'flex') {
                cancelCreateInflow();
            } else if (successModal && successModal.style.display === 'flex') {
                closeSuccessCreateInflowModal();
            } else if (updateModal && updateModal.style.display === 'flex') {
                cancelUpdateInflow();
            } else if (updateSuccessModal && updateSuccessModal.style.display === 'flex') {
                closeSuccessUpdateInflowModal();
            } else if (toggleModal && toggleModal.style.display === 'flex') {
                cancelToggleInflow();
            } else if (toggleSuccessModal && toggleSuccessModal.style.display === 'flex') {
                closeSuccessToggleInflowModal();
            } else if (detailsModal && detailsModal.style.display === 'flex') {
                hideCreateInflowDetailsModal();
            } else {
                hideAllModals();
            }
        }
    });

    // Botón de seleccionar ciudad
    const bSeleccionarCiudad = document.getElementById('bSeleccionarCiudad');
    if (bSeleccionarCiudad) {
        bSeleccionarCiudad.addEventListener('click', handleSelectCity);
    }

    // Botón de buscar ingreso
    const bBuscarIngreso = document.getElementById('bBuscarIngreso');
    if (bBuscarIngreso) {
        bBuscarIngreso.addEventListener('click', handleSearchInflow);
    }

    // Botón de siguiente (primer paso)
    const bSiguienteIngreso = document.getElementById('bSiguienteIngreso');
    if (bSiguienteIngreso) {
        bSiguienteIngreso.addEventListener('click', handleNextStepInflow);
    }
    
    // Botón de crear ingreso (segundo paso)
    const bCrearIngreso = document.getElementById('bCrearIngreso');
    if (bCrearIngreso) {
        bCrearIngreso.addEventListener('click', handleCreateInflow);
    }
    
    // Inicializar búsquedas de titular y ejecutivo
    initializeTitularAndExecutiveSearch();
    
    // Inicializar validación de factura
    initializeInvoiceValidation();
    
    // Inicializar formato de valores numéricos
    initializeNumericFormatting();

    // Botón de generar reporte
    const bGenerarReporte = document.getElementById('bGenerarReporte');
    if (bGenerarReporte) {
        bGenerarReporte.addEventListener('click', handleGenerateReport);
    }

    // Actualizar placeholder de búsqueda según tipo
    const inflowSearchType = document.getElementById('inflowSearchType');
    if (inflowSearchType) {
        inflowSearchType.addEventListener('change', updateInflowSearchPlaceholder);
    }
}

function hideAllModals() {
    // Solo cerrar modales principales, no los de confirmación o éxito
    const modalsToClose = [
        'createInflowModal', 
        'createInflowDetailsModal', 
        'searchInflowModal', 
        'reportModal',
        'selectInstallmentsModal'
    ];
    modalsToClose.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    });
    
    // No cerrar el modal de ciudad si no hay ciudad seleccionada
    const cityModal = document.getElementById('selectCityModal');
    if (cityModal) {
        const city = getSelectedCityCode();
        if (!city) {
            document.body.style.overflow = 'hidden'; // Mantener overflow hidden si no hay ciudad
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
        if (!verificarDatosCiudades()) {
            console.log('⚠️ Restaurando datos básicos de ciudades...');
            restaurarDatosCiudadesBasicos();
        }
    } catch (e) {
        // Si no existen helpers, definir funciones locales
        console.log('⚠️ Funciones de ciudades no encontradas, usando funciones locales');
    }

    // Resetear selección previa al entrar
    try { sessionStorage.removeItem('selectedCity'); } catch (e) {}

    // Limpiar tabla hasta que se seleccione una ciudad
    cashInflowData = [];
    renderCashInflowTable(cashInflowData);

    // Mostrar modal inmediatamente
    console.log('⏰ Mostrando modal de selección de ciudad...');
    showSelectCityModal();
}

function showSelectCityModal() {
    console.log('🔍 Intentando mostrar modal de ciudad...');
    const modal = document.getElementById('selectCityModal');
    if (!modal) {
        console.error('❌ Modal de selección de ciudad no encontrado en el DOM');
        return;
    }
    
    console.log('✅ Modal encontrado, preparando para mostrar...');
    
    // Cerrar otros modales excepto el de ciudad
    const modalsToClose = [
        'createInflowModal', 
        'createInflowDetailsModal', 
        'searchInflowModal', 
        'reportModal',
        'selectInstallmentsModal'
    ];
    modalsToClose.forEach(modalId => {
        const m = document.getElementById(modalId);
        if (m) m.style.display = 'none';
    });
    
    // Mostrar modal de ciudad
    try {
        populateCitySelectOptions();
        modal.style.display = 'flex';
        modal.style.zIndex = '2000';
        document.body.style.overflow = 'hidden';
        console.log('✅ Modal de ciudad mostrado correctamente');
        
        setTimeout(() => { 
            const citySelect = document.getElementById('citySelect');
            if (citySelect) {
                citySelect.focus();
                console.log('✅ Campo de selección enfocado');
            } else {
                console.warn('⚠️ Campo citySelect no encontrado');
            }
        }, 100);
    } catch (error) {
        console.error('❌ Error al mostrar modal de ciudad:', error);
    }
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

    // Cargar datos dependientes de la ciudad
    loadCashInflowData();

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

// ========================================
// MODALES DE INGRESO A CAJA
// ========================================

function showSearchInflowModal() {
    const modal = document.getElementById('searchInflowModal');
    if (modal) {
        modal.style.display = 'flex';
        const typeSel = document.getElementById('inflowSearchType');
        const input = document.getElementById('searchInflowValue');
        if (typeSel) typeSel.value = 'number';
        if (input) { 
            input.value = ''; 
            input.placeholder = 'Ingrese el número de ingreso'; 
            input.focus(); 
        }
        updateInflowSearchPlaceholder();
    }
}

function hideSearchInflowModal() {
    const modal = document.getElementById('searchInflowModal');
    if (modal) modal.style.display = 'none';
    const input = document.getElementById('searchInflowValue');
    if (input) input.value = '';
}

function showCreateInflowModal() {
    const modal = document.getElementById('createInflowModal');
    if (modal) {
        modal.style.display = 'flex';
        const isEditing = !!window.__editingInflowId;
        
        if (!isEditing) {
            // Limpiar formulario (esto también cargará el número si no existe)
            clearCreateInflowForm();
            // Fecha manual (sin valor por defecto)
            const dateEl = document.getElementById('inflowDate');
            if (dateEl) {
                dateEl.value = '';
            }
            // Asegurar que el número se cargue (por si acaso)
            setTimeout(() => {
                const numberInput = document.getElementById('inflowNumber');
                if (!numberInput || !numberInput.value) {
                    loadNextInflowNumber();
                }
            }, 100);
            
            // Restaurar título y botón
            const modalTitle = document.querySelector('#createInflowModal .modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'CREAR INGRESO';
            }
        }
    }
}

function hideCreateInflowModal() {
    const modal = document.getElementById('createInflowModal');
    if (modal) modal.style.display = 'none';
    // No limpiar __editingInflowId aquí, se limpia después de actualizar o cancelar
    clearCreateInflowForm();
    
    // Restaurar título y botón
    const modalTitle = document.querySelector('#createInflowModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'CREAR INGRESO';
    }
}

function showCreateInflowDetailsModal() {
    const modal = document.getElementById('createInflowDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
        clearCreateInflowDetailsForm();
        // Actualizar labels según el tipo de ingreso
        setTimeout(() => {
            updateReciboOficialLabel();
            updateCuotaFieldLabel();
        }, 50);
        // Enfocar el primer campo
        const holderId = document.getElementById('holderId');
        if (holderId) {
            setTimeout(() => holderId.focus(), 100);
        }
    }
}

function hideCreateInflowDetailsModal() {
    const modal = document.getElementById('createInflowDetailsModal');
    if (modal) modal.style.display = 'none';
    clearCreateInflowDetailsForm();
    
    // Limpiar modo edición si se cierra el modal
    if (window.__editingInflowId) {
        window.__editingInflowId = null;
        window.tempInflowEditData = null;
    }
    
    // Restaurar título y botón
    const detailsTitle = document.querySelector('#createInflowDetailsModal .modal-title');
    if (detailsTitle) {
        detailsTitle.textContent = 'DATOS DEL TITULAR Y FACTURA';
    }
    
    const crearBtn = document.getElementById('bCrearIngreso');
    if (crearBtn) {
        crearBtn.textContent = 'Crear Ingreso';
    }
}

// ========================================
// MODAL DE SELECCIÓN DE CUOTAS
// ========================================

/**
 * Muestra el modal de selección de cuotas
 */
function showSelectInstallmentsModal() {
    const modal = document.getElementById('selectInstallmentsModal');
    if (modal) {
        modal.style.display = 'flex';
        // Cargar cuotas pendientes
        loadInstallmentsForModal();
    }
}

/**
 * Oculta el modal de selección de cuotas
 */
function hideSelectInstallmentsModal() {
    const modal = document.getElementById('selectInstallmentsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * ========================================
 * FUNCIÓN: loadInstallmentsForModal()
 * ========================================
 * 
 * DESCRIPCIÓN:
 * Carga y muestra todas las cuotas pendientes de pago para una factura específica
 * en el modal de selección de cuotas. Calcula los saldos restantes considerando
 * pagos parciales previos.
 * 
 * FUNCIONALIDAD:
 * 1. Obtiene el número de factura del formulario
 * 2. Busca la información del plan asociado a la factura
 * 3. Calcula los pagos ya realizados por cada cuota (considerando pagos parciales)
 * 4. Calcula el saldo restante de cada cuota
 * 5. Renderiza una tabla con todas las cuotas pendientes
 * 
 * NOTA PARA BACKEND:
 * - Actualmente obtiene datos de localStorage
 * - CONEXIÓN BACKEND: Reemplazar las llamadas a localStorage por llamadas API:
 *   * localStorage.getItem('invoicesByCity') → API: GET /api/invoices?city={city}
 *   * localStorage.getItem('contratos_{city}') → API: GET /api/contracts?city={city}
 *   * localStorage.getItem('planesData') → API: GET /api/plans
 *   * localStorage.getItem('ingresosCaja_{city}') → API: GET /api/cash-inflows?city={city}&invoice={invoiceNumber}
 * 
 * @returns {void}
 */
function loadInstallmentsForModal() {
    const invoiceInput = document.getElementById('invoiceNumber');
    const invoiceSelect = document.getElementById('invoiceNumberSelect');
    const tableBody = document.getElementById('selectInstallmentsTableBody');
    const modalInvoiceNumber = document.getElementById('modalInvoiceNumber');
    const modalHolderName = document.getElementById('modalHolderName');
    
    if (!tableBody) return;
    
    // Obtener número de factura
    let invoiceNumber = '';
    if (invoiceSelect && invoiceSelect.style.display !== 'none' && invoiceSelect.value) {
        const selectedValue = invoiceSelect.value.trim();
        // Intentar extraer el número de factura de diferentes formatos
        let match = selectedValue.match(/Factura\s+(\d+)/i);
        if (!match) {
            // Intentar con formato "Factura: 123" o solo números
            match = selectedValue.match(/(\d+)/);
        }
        invoiceNumber = match ? match[1] : selectedValue;
        // Limpiar el número (remover ceros a la izquierda para comparación)
        invoiceNumber = invoiceNumber.replace(/^0+/, '') || invoiceNumber;
    } else if (invoiceInput) {
        invoiceNumber = invoiceInput.value.trim().replace(/^0+/, '') || invoiceInput.value.trim();
    }
    
    if (!invoiceNumber) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 30px;">
                    <p style="margin: 0; color: #6c757d;">No se ha seleccionado una factura</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Actualizar información del modal
    if (modalInvoiceNumber) {
        modalInvoiceNumber.textContent = invoiceNumber;
    }
    
    const holderNameInput = document.getElementById('holderName');
    if (modalHolderName && holderNameInput) {
        modalHolderName.textContent = holderNameInput.value || '-';
    }
    
    // Obtener información del plan
    console.log('loadInstallmentsForModal: Buscando plan para factura:', invoiceNumber);
    const planInfo = getPlanInfoFromInvoice(invoiceNumber);
    if (!planInfo) {
        console.error('loadInstallmentsForModal: No se pudo obtener información del plan para factura:', invoiceNumber);
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 30px;">
                    <p style="margin: 0; color: #d32f2f;">No se pudo obtener la información del plan.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    console.log('loadInstallmentsForModal: Plan info obtenida:', planInfo);
    let mensualidad = planInfo.mensualidad || 0;
    let numCuotas = planInfo.numCuotas || 0;
    const cuotasPagadas = planInfo.cuotasPagadas || 0;
    
    console.log('loadInstallmentsForModal: Valores extraídos:', { mensualidad, numCuotas, cuotasPagadas });
    
    if (!mensualidad || mensualidad <= 0 || !numCuotas || numCuotas <= 0) {
        console.error('loadInstallmentsForModal: Datos del plan inválidos:', { mensualidad, numCuotas });
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 30px;">
                    <p style="margin: 0; color: #d32f2f;">No se pudo determinar el valor de la cuota o número de cuotas.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Calcular cuotas pendientes
    const city = getSelectedCityCode();
    const inflowsRaw = localStorage.getItem(`ingresosCaja_${city}`);
    const inflows = inflowsRaw ? JSON.parse(inflowsRaw) : [];
    const pagosPorCuota = {};
    
    if (Array.isArray(inflows)) {
        inflows.forEach(i => {
            const sameInvoice = String(i.invoiceNumber || '').replace(/^0+/, '') === String(invoiceNumber).replace(/^0+/, '');
            const isActive = (i.estado || 'activo') === 'activo';
            if (sameInvoice && isActive) {
                // Si existe detalleCuotas, usar esa información (más precisa)
                if (i.detalleCuotas && Array.isArray(i.detalleCuotas)) {
                    i.detalleCuotas.forEach(detalle => {
                        const cuotaNum = parseInt(detalle.cuota) || 0;
                        if (cuotaNum > 0) {
                            if (!pagosPorCuota[cuotaNum]) {
                                pagosPorCuota[cuotaNum] = 0;
                            }
                            pagosPorCuota[cuotaNum] += parseFloat(detalle.valorPagar || 0);
                        }
                    });
                } else {
                    // Procesar el campo cuota que puede ser un string con múltiples cuotas separadas por comas
                    const cuotaField = String(i.cuota || '');
                    const valorTotal = parseFloat(i.valor || 0);
                    
                    if (cuotaField.includes(',')) {
                        // Si hay múltiples cuotas, dividir el valor entre todas
                        const cuotas = cuotaField.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c) && c > 0);
                        if (cuotas.length > 0) {
                            const valorPorCuota = valorTotal / cuotas.length;
                            cuotas.forEach(cuotaNum => {
                                if (!pagosPorCuota[cuotaNum]) {
                                    pagosPorCuota[cuotaNum] = 0;
                                }
                                pagosPorCuota[cuotaNum] += valorPorCuota;
                            });
                        }
                    } else {
                        // Una sola cuota
                        const cuotaNum = parseInt(cuotaField) || 0;
                        if (cuotaNum > 0) {
                            if (!pagosPorCuota[cuotaNum]) {
                                pagosPorCuota[cuotaNum] = 0;
                            }
                            pagosPorCuota[cuotaNum] += valorTotal;
                        }
                    }
                }
            }
        });
    }
    
    // Empezar desde la cuota 1 (la cuota 0 es la cuota inicial)
    // Mostrar todas las cuotas que tengan saldo pendiente, incluso si tienen pagos parciales
    const cuotasPendientes = [];
    
    for (let i = 1; i <= numCuotas; i++) {
        const pagado = pagosPorCuota[i] || 0;
        const saldo = Math.max(0, mensualidad - pagado);
        
        // Mostrar la cuota si tiene saldo pendiente (incluso si tiene pagos parciales)
        if (saldo > 0) {
            cuotasPendientes.push({
                cuota: i,
                valorCuota: mensualidad,
                valorPagado: pagado,
                saldo: saldo
            });
        }
    }
    
    if (cuotasPendientes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 30px;">
                    <p style="margin: 0; color: #6c757d;">Todas las cuotas están pagadas</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Renderizar tabla
    console.log('loadInstallmentsForModal: Renderizando', cuotasPendientes.length, 'cuotas pendientes');
    console.log('loadInstallmentsForModal: Mensualidad usada para renderizar:', mensualidad);
    tableBody.innerHTML = '';
    cuotasPendientes.forEach(inst => {
        console.log('loadInstallmentsForModal: Renderizando cuota', inst.cuota, 'con valorCuota:', inst.valorCuota, 'saldo:', inst.saldo);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center; padding: 12px;">
                <input type="checkbox" class="installment-checkbox" 
                       data-cuota="${inst.cuota}" 
                       data-valor-cuota="${inst.valorCuota}" 
                       data-saldo="${inst.saldo}"
                       style="cursor: pointer;">
            </td>
            <td style="padding: 12px;">${inst.cuota}/${numCuotas}</td>
            <td style="padding: 12px; text-align: right;">
                <input type="text"
                       class="valor-pagar-input numeric-input"
                       data-cuota="${inst.cuota}"
                       data-valor-cuota="${inst.valorCuota}"
                       data-saldo="${inst.saldo}"
                       value="${formatNumberValue(inst.saldo)}"
                       placeholder="${formatNumberValue(inst.valorCuota)}"
                       style="width: 100%; text-align: right; border: 1px solid #dcdcdc; border-radius: 4px; padding: 6px;">
            </td>
            <td style="padding: 12px; text-align: center;">
                <span class="status-badge" style="font-size: 0.85em; background-color: #d1ecf1; color: #0c5460;">PENDIENTE</span>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Guardar información de cuotas
    window.modalInstallments = cuotasPendientes;
    window.modalPlanInfo = { mensualidad, numCuotas };
    
    // Limpiar campo de valor deseado
    const desiredValueInput = document.getElementById('desiredTotalValue');
    if (desiredValueInput) {
        desiredValueInput.value = '';
    }
    
    // Inicializar formato y eventos para inputs
    initializeValorPagarInputs();
    initializeInstallmentModalEvents();
}

/**
 * ========================================
 * FUNCIÓN: initializeInstallmentModalEvents()
 * ========================================
 * 
 * DESCRIPCIÓN:
 * Inicializa todos los event listeners del modal de selección de cuotas.
 * Maneja la interacción del usuario con checkboxes, inputs de valores y
 * el campo de valor total deseado.
 * 
 * EVENTOS MANEJADOS:
 * - Checkbox "Seleccionar todas": Marca/desmarca todas las cuotas
 * - Checkboxes individuales: Marca/desmarca cuotas específicas
 * - Inputs de valor a pagar: Permite editar el valor de cada cuota
 * - Campo "Valor Total Deseado": Distribuye automáticamente el valor entre cuotas
 * 
 * @returns {void}
 */
function initializeInstallmentModalEvents() {
    // Checkbox "Seleccionar todas"
    const selectAllCheckbox = document.getElementById('selectAllInstallmentsModal');
    if (selectAllCheckbox) {
        selectAllCheckbox.onchange = function() {
            const checkboxes = document.querySelectorAll('.installment-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
                handleModalInstallmentCheckboxChange(cb, { skipSummary: true });
            });
        };
    }
    
    // Checkboxes individuales
    document.querySelectorAll('.installment-checkbox').forEach(checkbox => {
        checkbox.onchange = function() {
            handleModalInstallmentCheckboxChange(checkbox);
        };
    });
    
    // Inputs de valor a pagar
    document.querySelectorAll('.valor-pagar-input').forEach(input => {
        input.addEventListener('change', () => handleModalValorPagarChange(input));
        input.addEventListener('blur', () => handleModalValorPagarBlur(input));
    });
    
    // Campo de valor deseado
    const desiredValueInput = document.getElementById('desiredTotalValue');
    if (desiredValueInput) {
        // Formato numérico
        desiredValueInput.addEventListener('input', function() {
            const cursorPosition = this.selectionStart;
            const originalValue = this.value;
            const numbersOnly = this.value.replace(/[^\d]/g, '');
            
            if (!numbersOnly) {
                this.value = '';
                return;
            }
            
            const numValue = parseInt(numbersOnly, 10);
            if (!isNaN(numValue)) {
                const formatted = new Intl.NumberFormat('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(numValue);
                
                this.value = formatted;
                
                // Ajustar cursor
                const beforeCursor = originalValue.substring(0, cursorPosition);
                const digitsBeforeCursor = beforeCursor.replace(/[^\d]/g, '').length;
                let digitsFound = 0;
                let newCursorPosition = formatted.length;
                for (let i = 0; i < formatted.length; i++) {
                    if (formatted[i] >= '0' && formatted[i] <= '9') {
                        digitsFound++;
                        if (digitsFound === digitsBeforeCursor) {
                            newCursorPosition = i + 1;
                            break;
                        }
                    }
                }
                this.setSelectionRange(newCursorPosition, newCursorPosition);
            }
            
            autoDistributeDesiredValue();
        });
        
        desiredValueInput.addEventListener('blur', function() {
            formatNumericInput(this);
            autoDistributeDesiredValue();
        });
    }
    
    // Botón confirmar
    const confirmButton = document.getElementById('bConfirmInstallments');
    if (confirmButton) {
        confirmButton.onclick = confirmInstallmentSelection;
    }
}

/**
 * ========================================
 * FUNCIÓN: handleModalInstallmentCheckboxChange()
 * ========================================
 * 
 * DESCRIPCIÓN:
 * Maneja el evento cuando el usuario marca o desmarca un checkbox de cuota.
 * Si se marca, establece el valor del input al saldo restante de la cuota.
 * Si se desmarca, limpia el valor del input.
 * 
 * @param {HTMLInputElement} checkbox - El checkbox que fue marcado/desmarcado
 * @param {Object} options - Opciones adicionales (skipSummary: true para no actualizar resumen)
 * @returns {void}
 */
function handleModalInstallmentCheckboxChange(checkbox, options = {}) {
    const cuota = parseInt(checkbox.dataset.cuota);
    const saldo = parseFloat(checkbox.dataset.saldo || 0);
    const input = document.querySelector(`.valor-pagar-input[data-cuota="${cuota}"]`);
    
    if (!input) return;
    
    if (checkbox.checked) {
        const currentValue = parseFormattedNumber(input.value) || 0;
        if (currentValue <= 0) {
            input.value = formatNumberValue(saldo);
        }
    } else {
        input.value = '0';
    }
    
    updateModalInstallmentRowState(cuota);
    
    if (!options.skipSummary) {
        syncSelectAllInstallmentsState();
    }
}

/**
 * ========================================
 * FUNCIÓN: handleModalValorPagarChange()
 * ========================================
 * 
 * DESCRIPCIÓN:
 * Maneja cuando el usuario edita manualmente el valor a pagar de una cuota.
 * Valida que el valor no exceda el saldo disponible y actualiza el estado
 * del checkbox y la fila correspondiente.
 * 
 * @param {HTMLInputElement} input - El input de valor a pagar que fue modificado
 * @returns {void}
 */
function handleModalValorPagarChange(input) {
    let valor = parseFormattedNumber(input.value) || 0;
    const saldo = parseFloat(input.dataset.saldo || 0);
    const cuota = parseInt(input.dataset.cuota);
    const checkbox = document.querySelector(`.installment-checkbox[data-cuota="${cuota}"]`);
    
    if (valor > saldo) {
        valor = saldo;
        input.value = formatNumberValue(valor);
        showNotification(`El valor no puede exceder el saldo de ${formatNumberValue(saldo)}`, 'warning');
    }
    
    if (checkbox) {
        checkbox.checked = valor > 0;
    }
    
    updateModalInstallmentRowState(cuota);
    syncSelectAllInstallmentsState();
}

/**
 * Maneja el blur en los inputs para re-formatear y recalcular
 */
function handleModalValorPagarBlur(input) {
    formatNumericInput(input);
    handleModalValorPagarChange(input);
}

/**
 * Marca o desmarca el checkbox general según la selección actual
 */
function syncSelectAllInstallmentsState() {
    const selectAllCheckbox = document.getElementById('selectAllInstallmentsModal');
    if (!selectAllCheckbox) return;
    
    const checkboxes = document.querySelectorAll('.installment-checkbox');
    const checkedCount = document.querySelectorAll('.installment-checkbox:checked').length;
    
    if (checkboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }
    
    selectAllCheckbox.checked = checkedCount === checkboxes.length;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

/**
 * ========================================
 * FUNCIÓN: autoDistributeDesiredValue()
 * ========================================
 * 
 * DESCRIPCIÓN:
 * Distribuye automáticamente el valor total deseado ingresado por el usuario
 * entre las cuotas disponibles, empezando desde la primera cuota pendiente.
 * 
 * LÓGICA:
 * 1. Lee el valor total deseado del campo "Valor Total Deseado a Pagar"
 * 2. Recorre las cuotas en orden cronológico (1, 2, 3, ...)
 * 3. Asigna a cada cuota el valor mínimo entre su saldo restante y el valor restante
 * 4. Actualiza los inputs y checkboxes correspondientes
 * 
 * EJEMPLO:
 * - Valor deseado: 500,000
 * - Cuota 1 saldo: 118,000 → Asigna 118,000
 * - Cuota 2 saldo: 118,000 → Asigna 118,000
 * - Cuota 3 saldo: 118,000 → Asigna 118,000
 * - Cuota 4 saldo: 118,000 → Asigna 118,000
 * - Cuota 5 saldo: 118,000 → Asigna 28,000 (parcial)
 * 
 * @returns {void}
 */
function autoDistributeDesiredValue() {
    const desiredValueInput = document.getElementById('desiredTotalValue');
    if (!desiredValueInput) {
        return;
    }
    
    const desiredValue = parseFormattedNumber(desiredValueInput.value) || 0;
    const checkboxes = Array.from(document.querySelectorAll('.installment-checkbox'));
    
    if (checkboxes.length === 0) {
        return;
    }
    
    // Ordenar por número de cuota para distribuir en orden cronológico
    checkboxes.sort((a, b) => parseInt(a.dataset.cuota) - parseInt(b.dataset.cuota));
    
    let valorRestante = desiredValue;
    
    checkboxes.forEach(checkbox => {
        const cuota = parseInt(checkbox.dataset.cuota);
        const saldo = parseFloat(checkbox.dataset.saldo || 0);
        const input = document.querySelector(`.valor-pagar-input[data-cuota="${cuota}"]`);
        if (!input) return;
        
        if (valorRestante > 0) {
            const valorAsignado = Math.min(saldo, valorRestante);
            input.value = formatNumberValue(valorAsignado);
            checkbox.checked = valorAsignado > 0;
            valorRestante -= valorAsignado;
        } else {
            checkbox.checked = false;
            input.value = '0';
        }
        
        updateModalInstallmentRowState(cuota);
    });
    
    syncSelectAllInstallmentsState();
}

/**
 * Actualiza el estado visual de una fila (pendiente, parcial, completa)
 */
function updateModalInstallmentRowState(cuota) {
    const row = document.querySelector(`.installment-checkbox[data-cuota="${cuota}"]`)?.closest('tr');
    if (!row) return;
    
    const input = row.querySelector('.valor-pagar-input');
    const estadoCell = row.querySelector('td:last-child');
    const saldo = input ? parseFloat(input.dataset.saldo || 0) : 0;
    const valor = input ? parseFormattedNumber(input.value) || 0 : 0;
    
    if (!estadoCell) return;
    
    if (valor === 0) {
        estadoCell.innerHTML = '<span class="status-badge" style="font-size: 0.85em; background-color: #d1ecf1; color: #0c5460;">PENDIENTE</span>';
        row.style.backgroundColor = '';
    } else if (valor < saldo) {
        estadoCell.innerHTML = '<span class="status-badge warning" style="font-size: 0.85em;">PARCIAL</span>';
        row.style.backgroundColor = '#fff8e1';
    } else {
        estadoCell.innerHTML = '<span class="status-badge success" style="font-size: 0.85em;">COMPLETA</span>';
        row.style.backgroundColor = '';
    }
}

/**
 * Actualiza el resumen de selección en el modal
 */
function updateInstallmentModalSummary() {
    // Función vacía - los elementos de resumen fueron eliminados
}

/**
 * Actualiza la sugerencia de cuotas basada en el valor deseado
 */
function updateInstallmentSuggestion() {
    // Función vacía - el mensaje de sugerencia fue eliminado
}

/**
 * ========================================
 * FUNCIÓN: confirmInstallmentSelection()
 * ========================================
 * 
 * DESCRIPCIÓN:
 * Confirma la selección de cuotas realizada en el modal y actualiza el formulario
 * principal con los valores seleccionados. Guarda la información de las cuotas
 * seleccionadas para que se use al crear el ingreso.
 * 
 * FUNCIONALIDAD:
 * 1. Valida que haya al menos una cuota seleccionada
 * 2. Calcula el valor total de todas las cuotas seleccionadas
 * 3. Actualiza el campo "Valor Total a Pagar" en el formulario principal
 * 4. Actualiza el campo "Cuota" con todas las cuotas seleccionadas (ej: "2, 3, 4, 5")
 * 5. Guarda el detalle de cuotas en window.calculatedInstallments para usarlo al guardar
 * 6. Cierra el modal de selección
 * 
 * NOTA PARA BACKEND:
 * - Actualmente guarda en window.calculatedInstallments
 * - CONEXIÓN BACKEND: Esta función prepara los datos que luego se enviarán al backend
 *   en confirmCreateInflow(). Los datos se envían en el formato:
 *   {
 *     ...datosBasicos,
 *     valor: totalValue,
 *     cuota: "2, 3, 4, 5",
 *     detalleCuotas: [
 *       { cuota: 2, valorPagar: 118000, esParcial: false },
 *       { cuota: 3, valorPagar: 118000, esParcial: false },
 *       ...
 *     ]
 *   }
 * 
 * @returns {void}
 */
function confirmInstallmentSelection() {
    const selectedCheckboxes = Array.from(document.querySelectorAll('.installment-checkbox:checked'));
    
    if (selectedCheckboxes.length === 0) {
        showNotification('Por favor, seleccione al menos una cuota', 'warning');
        return;
    }
    
    // Calcular valores
    let totalValue = 0;
    const installments = [];
    
    selectedCheckboxes.sort((a, b) => {
        return parseInt(a.dataset.cuota) - parseInt(b.dataset.cuota);
    });
    
    selectedCheckboxes.forEach(checkbox => {
        const cuota = parseInt(checkbox.dataset.cuota);
        const valorCuota = parseFloat(checkbox.dataset.valorCuota || 0);
        const saldo = parseFloat(checkbox.dataset.saldo || 0);
        const input = document.querySelector(`.valor-pagar-input[data-cuota="${cuota}"]`);
        let valorSeleccionado = input ? parseFormattedNumber(input.value) || 0 : saldo;
        
        if (valorSeleccionado <= 0) {
            valorSeleccionado = saldo;
        }
        if (valorSeleccionado > saldo) {
            valorSeleccionado = saldo;
        }
        
        totalValue += valorSeleccionado;
        installments.push({
            cuota: cuota,
            valorCuota: valorCuota,
            valorPagar: valorSeleccionado,
            saldo: saldo,
            esParcial: valorSeleccionado < saldo
        });
    });
    
    if (totalValue <= 0) {
        showNotification('El total seleccionado debe ser mayor a cero', 'warning');
        return;
    }
    
    // Actualizar campo de valor total en el formulario principal
    const valorInput = document.getElementById('inflowValue');
    if (valorInput) {
        valorInput.value = formatNumberValue(totalValue);
        formatNumericInput(valorInput);
    }
    
    // Actualizar campo de cuota (todas las cuotas seleccionadas)
    const cuotaInput = document.getElementById('cuota');
    if (cuotaInput && installments.length > 0) {
        // Mostrar todas las cuotas separadas por comas
        const cuotasNumeros = installments.map(inst => inst.cuota).join(', ');
        cuotaInput.value = cuotasNumeros;
    }
    
    // Guardar cuotas calculadas
    window.calculatedInstallments = installments;
    
    // Cerrar modal
    hideSelectInstallmentsModal();
    
    showNotification(`Se seleccionaron ${installments.length} cuota(s) por un total de ${formatNumberValue(totalValue)}`, 'success');
}

function clearCreateInflowDetailsForm() {
    const form = document.getElementById('createInflowDetailsForm');
    if (form) form.reset();
    
    // Limpiar displays de nombres
    const holderNameDisplay = document.getElementById('holderNameDisplay');
    const executiveNameDisplay = document.getElementById('executiveNameDisplay');
    if (holderNameDisplay) {
        holderNameDisplay.style.display = 'none';
        holderNameDisplay.textContent = '';
        holderNameDisplay.classList.remove('error-text', 'success-text');
    }
    if (executiveNameDisplay) {
        executiveNameDisplay.style.display = 'none';
        executiveNameDisplay.textContent = '';
        executiveNameDisplay.classList.remove('error-text', 'success-text');
    }
    
    // Limpiar tabla de cuotas
    const installmentsTableBody = document.getElementById('installmentsTableBody');
    const installmentsTableFooter = document.getElementById('installmentsTableFooter');
    if (installmentsTableBody) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #6c757d;">Seleccione una factura para ver las cuotas pendientes</p>
                </td>
            </tr>
        `;
    }
    if (installmentsTableFooter) {
        installmentsTableFooter.style.display = 'none';
    }
    
    // Limpiar datos calculados
    window.calculatedInstallments = null;
    window.pendingInstallments = null;
    window.planInfo = null;
    
    // Limpiar validación de factura y restaurar campo a input
    clearInvoiceValidation();
    clearInvoiceOrContractSelect();
    setProductionRecordField('');
    setInflowInitialValue('');
}

function handleNextStepInflow() {
    const form = document.getElementById('createInflowForm');
    if (!form) return;
    
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    // Validar campos requeridos del primer paso
    const tipoIngresoCodigo = document.getElementById('inflowIncomeTypeCode')?.value.trim();
    const numero = document.getElementById('inflowNumber')?.value.trim();
    const fecha = document.getElementById('inflowDate')?.value;
    const observaciones = document.getElementById('inflowObservations')?.value.trim();
    
    if (!tipoIngresoCodigo || !numero || !fecha) {
        showNotification('Por favor, complete todos los campos requeridos', 'warning');
        return;
    }
    
    // Validar que el tipo de ingreso exista
    const incomeType = window.getIncomeTypeByCode ? window.getIncomeTypeByCode(tipoIngresoCodigo) : null;
    if (!incomeType) {
        showNotification('El tipo de ingreso no existe. Debe crearlo primero en Mantenimiento', 'warning');
        return;
    }
    
    // Guardar datos del primer paso temporalmente
    window.tempInflowBasicData = {
        tipoIngresoCodigo: tipoIngresoCodigo.toUpperCase(),
        tipoIngresoNombre: incomeType.nombre,
        numero: numero,
        fecha: fecha,
        observaciones: observaciones || '',
        city: city
    };
    
    // Cerrar primer modal y abrir segundo modal
    hideCreateInflowModal();
    showCreateInflowDetailsModal();
    
    // Actualizar labels según el tipo de ingreso
    setTimeout(() => {
        updateReciboOficialLabel();
        updateCuotaFieldLabel();
    }, 100);
    
    // Si ya hay un titular ingresado, recargar contratos/facturas con el nuevo tipo de ingreso
    const holderId = document.getElementById('holderId')?.value.trim();
    if (holderId && holderId.length >= 6) {
        setTimeout(() => {
            loadContractsOrInvoicesForTitular(holderId, city);
        }, 100);
    }
    
    // Si estamos editando, cargar datos del segundo paso
    if (window.__editingInflowId && window.tempInflowEditData) {
        const editData = window.tempInflowEditData;
        const setVal = (id, val) => { 
            const el = document.getElementById(id); 
            if (el) el.value = val ?? ''; 
        };
        
        setVal('holderId', editData.holderId);
        setVal('holderName', editData.holderName);
        setVal('invoiceNumber', editData.invoiceNumber);
        setVal('inflowValue', formatNumberValue(editData.valor));
        // Para cuota: si es 0 y es CI, mostrar "0", sino mostrar el número correspondiente
        const tipoIngresoCodigo = window.tempInflowBasicData?.tipoIngresoCodigo || '';
        const category = getIncomeTypeCategory(tipoIngresoCodigo);
        const cuotaValue = editData.cuota || 0;
        if (category === 'CI' && (cuotaValue === 0 || cuotaValue === '0')) {
            setVal('cuota', '0');
            const cuotaInput = document.getElementById('cuota');
            if (cuotaInput) cuotaInput.readOnly = true;
        } else {
            setVal('cuota', formatNumberValue(editData.cuota));
            const cuotaInput = document.getElementById('cuota');
            if (cuotaInput) cuotaInput.readOnly = false;
        }
        setVal('executiveId', editData.executiveId);
        setVal('executiveName', editData.executiveName);
        setVal('letraRecibo', editData.letraRecibo);
        setVal('reciboOficial', editData.reciboOficial);
        setVal('recordProduccion', editData.recordProduccion);
        setProductionRecordField(editData.recordProduccion || '');
        
        // Actualizar labels según el tipo de ingreso
        updateReciboOficialLabel();
        updateCuotaFieldLabel();
        
        // Mostrar displays de nombres si existen
        if (editData.holderName) {
            const holderDisplay = document.getElementById('holderNameDisplay');
            if (holderDisplay) {
                holderDisplay.textContent = `Titular: ${editData.holderName}`;
                holderDisplay.style.display = 'block';
                holderDisplay.classList.remove('error-text');
                holderDisplay.classList.add('success-text');
            }
        }
        
        if (editData.executiveName) {
            const executiveDisplay = document.getElementById('executiveNameDisplay');
            if (executiveDisplay) {
                executiveDisplay.textContent = `Ejecutivo: ${editData.executiveName}`;
                executiveDisplay.style.display = 'block';
                executiveDisplay.classList.remove('error-text');
                executiveDisplay.classList.add('success-text');
            }
        }
        
        // Cargar contratos o facturas según el tipo de ingreso y seleccionar el valor guardado
        if (editData.holderId) {
            setTimeout(() => {
                loadContractsOrInvoicesForTitular(editData.holderId, city);
                // Después de cargar, seleccionar el valor guardado
                setTimeout(() => {
                    const invoiceSelect = document.getElementById('invoiceNumberSelect');
                    const tipoIngresoCodigo = window.tempInflowBasicData?.tipoIngresoCodigo || '';
                    const category = getIncomeTypeCategory(tipoIngresoCodigo);
                    
                    if (invoiceSelect && invoiceSelect.style.display !== 'none' && invoiceSelect.style.display !== '') {
                        // Buscar la opción con el valor guardado
                        for (let i = 0; i < invoiceSelect.options.length; i++) {
                            if (invoiceSelect.options[i].value === editData.invoiceNumber) {
                                invoiceSelect.selectedIndex = i;
                                invoiceSelect.dispatchEvent(new Event('change'));
                                break;
                            }
                        }
                    } else {
                        // Si no hay select, validar según el tipo de ingreso
                        if (editData.invoiceNumber) {
                            if (category === 'CI') {
                                // Para CI, mostrar confirmación de contrato
                                showContractSelected(editData.invoiceNumber);
                            } else {
                                // Para CR u otros, validar factura
                                validateInvoiceNumber(editData.invoiceNumber);
                            }
                        }
                    }
                }, 200);
            }, 100);
        } else {
            // Validar factura si existe (solo si no es CI)
            if (editData.invoiceNumber) {
                setTimeout(() => {
                    const tipoIngresoCodigo = window.tempInflowBasicData?.tipoIngresoCodigo || '';
                    const category = getIncomeTypeCategory(tipoIngresoCodigo);
                    
                    if (category === 'CI') {
                        // Para CI, mostrar confirmación de contrato
                        showContractSelected(editData.invoiceNumber);
                    } else {
                        // Para CR u otros, validar factura
                        validateInvoiceNumber(editData.invoiceNumber);
                    }
                }, 100);
            }
        }
        
        // Cambiar título del modal de detalles
        const detailsTitle = document.querySelector('#createInflowDetailsModal .modal-title');
        if (detailsTitle) {
            detailsTitle.textContent = 'ACTUALIZAR DATOS DEL TITULAR Y FACTURA';
        }
        
        // Cambiar botón
        const crearBtn = document.getElementById('bCrearIngreso');
        if (crearBtn) {
            crearBtn.textContent = 'Actualizar Ingreso';
        }
    }
}

function showReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'flex';
        // Limpiar fechas
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate) startDate.value = '';
        if (endDate) endDate.value = '';
    }
}

function hideReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'none';
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
}

// ========================================
// BÚSQUEDA AUTOMÁTICA DE TIPO DE INGRESO
// ========================================

function initializeIncomeTypeSearch() {
    const incomeTypeCodeInput = document.getElementById('inflowIncomeTypeCode');
    if (!incomeTypeCodeInput) return;
    
    incomeTypeCodeInput.addEventListener('input', function() {
        const codigo = this.value.trim().toUpperCase();
        const nameDisplay = document.getElementById('incomeTypeNameDisplay');
        
        if (!nameDisplay) return;
        
        if (!codigo) {
            nameDisplay.style.display = 'none';
            nameDisplay.textContent = '';
            nameDisplay.classList.remove('success-text', 'error-text');
            return;
        }
        
        // Buscar el tipo de ingreso
        if (window.getIncomeTypeByCode) {
            const incomeType = window.getIncomeTypeByCode(codigo);
            if (incomeType) {
                nameDisplay.textContent = incomeType.nombre;
                nameDisplay.style.display = 'block';
                nameDisplay.classList.remove('error-text');
                nameDisplay.classList.add('success-text');
            } else {
                nameDisplay.textContent = 'Tipo de ingreso no encontrado';
                nameDisplay.style.display = 'block';
                nameDisplay.classList.remove('success-text');
                nameDisplay.classList.add('error-text');
            }
        } else {
            nameDisplay.textContent = 'Cargando...';
            nameDisplay.style.display = 'block';
            nameDisplay.classList.remove('success-text', 'error-text');
        }
    });
}

// ========================================
// BÚSQUEDA DE TITULAR Y EJECUTIVO
// ========================================

function initializeTitularAndExecutiveSearch() {
    // Búsqueda de titular
    const holderIdInput = document.getElementById('holderId');
    if (holderIdInput) {
        holderIdInput.addEventListener('input', function() {
            const holderId = this.value.trim();
            if (holderId.length >= 6) {
                searchTitularByIdentification(holderId);
            } else {
                clearTitularData();
            }
        });
    }
    
    // Búsqueda de ejecutivo
    const executiveIdInput = document.getElementById('executiveId');
    if (executiveIdInput) {
        executiveIdInput.addEventListener('input', function() {
            const executiveId = this.value.trim();
            if (executiveId.length >= 6) {
                searchExecutiveByIdentification(executiveId);
            } else {
                clearExecutiveData();
            }
        });
    }
}

function searchTitularByIdentification(cedula) {
    const city = getSelectedCityCode();
    if (!city) return;
    
    try {
        const titularesByCity = localStorage.getItem('titularesByCity');
        if (!titularesByCity) {
            clearTitularData();
            return;
        }
        
        const data = JSON.parse(titularesByCity);
        const titular = data[city] && data[city][cedula] ? data[city][cedula] : null;
        
        if (titular) {
            const nombreCompleto = `${titular.nombre1 || ''} ${titular.nombre2 || ''} ${titular.apellido1 || ''} ${titular.apellido2 || ''}`.trim().toUpperCase();
            const holderNameInput = document.getElementById('holderName');
            const holderNameDisplay = document.getElementById('holderNameDisplay');
            
            if (holderNameInput) {
                holderNameInput.value = nombreCompleto;
            }
            if (holderNameDisplay) {
                holderNameDisplay.textContent = `Titular encontrado: ${nombreCompleto}`;
                holderNameDisplay.style.display = 'block';
                holderNameDisplay.classList.remove('error-text');
                holderNameDisplay.classList.add('success-text');
            }
            
            // Cargar contratos o facturas según el tipo de ingreso
            loadContractsOrInvoicesForTitular(cedula, city);
        } else {
            clearTitularData();
            const holderNameDisplay = document.getElementById('holderNameDisplay');
            if (holderNameDisplay) {
                holderNameDisplay.textContent = 'Titular no encontrado';
                holderNameDisplay.style.display = 'block';
                holderNameDisplay.classList.remove('success-text');
                holderNameDisplay.classList.add('error-text');
            }
            // Limpiar select de factura/contrato
            clearInvoiceOrContractSelect();
        }
    } catch (error) {
        console.error('Error buscando titular:', error);
        clearTitularData();
        clearInvoiceOrContractSelect();
    }
}

function clearTitularData() {
    const holderNameInput = document.getElementById('holderName');
    const holderNameDisplay = document.getElementById('holderNameDisplay');
    
    if (holderNameInput) {
        holderNameInput.value = '';
    }
    if (holderNameDisplay) {
        holderNameDisplay.style.display = 'none';
        holderNameDisplay.textContent = '';
        holderNameDisplay.classList.remove('error-text', 'success-text');
    }
}

// ========================================
// CARGA DE CONTRATOS O FACTURAS SEGÚN TIPO DE INGRESO
// ========================================

/**
 * Determina si el tipo de ingreso es CI (Cuentas por Ingresar) o CR (Cuentas por Recibir)
 * @param {string} tipoIngresoCodigo - Código del tipo de ingreso
 * @returns {string} 'CI', 'CR' o null si no se puede determinar
 */
function getIncomeTypeCategory(tipoIngresoCodigo) {
    if (!tipoIngresoCodigo) return null;
    
    const codigo = String(tipoIngresoCodigo).toUpperCase().trim();
    
    // Verificar si el código contiene 'CI' o 'CR'
    if (codigo.includes('CI') || codigo === 'CI') {
        return 'CI';
    }
    if (codigo.includes('CR') || codigo === 'CR') {
        return 'CR';
    }
    
    // Si no se puede determinar por código, intentar por nombre del tipo de ingreso
    try {
        const incomeType = window.getIncomeTypeByCode ? window.getIncomeTypeByCode(codigo) : null;
        if (incomeType) {
            const nombre = String(incomeType.nombre || '').toUpperCase();
            if (nombre.includes('CUENTA') && nombre.includes('INGRESAR')) {
                return 'CI';
            }
            if (nombre.includes('CUENTA') && nombre.includes('RECIBIR')) {
                return 'CR';
            }
        }
    } catch (e) {
        console.error('Error obteniendo tipo de ingreso:', e);
    }
    
    return null;
}

/**
 * Carga contratos o facturas según el tipo de ingreso seleccionado
 * @param {string} cedula - Identificación del titular
 * @param {string} city - Código de la ciudad
 */
function loadContractsOrInvoicesForTitular(cedula, city) {
    // Obtener el tipo de ingreso del primer paso
    const tipoIngresoCodigo = window.tempInflowBasicData?.tipoIngresoCodigo || '';
    console.log('Tipo de ingreso código:', tipoIngresoCodigo);
    
    const category = getIncomeTypeCategory(tipoIngresoCodigo);
    console.log('Categoría detectada:', category);
    
    if (category === 'CI') {
        // Para CI: Cargar contratos del titular
        console.log('Cargando contratos para CI...');
        loadContractsForTitularInInflow(cedula, city);
    } else if (category === 'CR') {
        // Para CR: Cargar facturas del titular
        console.log('Cargando facturas para CR...');
        loadInvoicesForTitularInInflow(cedula, city);
    } else {
        // Si no se puede determinar, mantener el input normal
        console.log('No se pudo determinar la categoría, manteniendo input normal');
        clearInvoiceOrContractSelect();
    }
}

/**
 * Carga los contratos del titular en el select de factura/contrato (para CI)
 * @param {string} cedula - Identificación del titular
 * @param {string} city - Código de la ciudad
 */
function loadContractsForTitularInInflow(cedula, city) {
    try {
        // Obtener contratos del titular
        const contratos = getContractsByClientIdForInflow(city, cedula, true);
        
        const invoiceInput = document.getElementById('invoiceNumber');
        const invoiceSelect = document.getElementById('invoiceNumberSelect');
        
        if (!invoiceInput) return;
        
        // Si no existe el select, crearlo
        if (!invoiceSelect) {
            createInvoiceSelect();
        }
        
        const select = document.getElementById('invoiceNumberSelect');
        if (!select) {
            console.error('No se pudo crear el select');
            return;
        }
        
        // Ocultar input y mostrar select
        invoiceInput.style.display = 'none';
        invoiceInput.required = false;
        
        const selectContainer = select.parentElement;
        if (selectContainer && selectContainer.classList.contains('select-container')) {
            selectContainer.style.display = 'block';
        } else {
            select.style.display = 'block';
        }
        select.required = true;
        
        // Actualizar label si es necesario
        updateInvoiceLabel('contrato');
        
        console.log('Select de contratos creado y mostrado. Contratos encontrados:', contratos.length);
        
        // Limpiar y llenar el select
        select.innerHTML = '<option value="">Seleccione el contrato</option>';
        
        if (contratos.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay contratos disponibles';
            option.disabled = true;
            select.appendChild(option);
            console.warn('No se encontraron contratos para el titular:', cedula);
            return;
        }
        
        console.log('Agregando', contratos.length, 'contratos al select');
        contratos.forEach((contrato, index) => {
            const numero = contrato.numero || contrato.contractNumber || contrato.numeroContrato || contrato.nro || contrato.contract || '';
            const plan = contrato.plan || (contrato.planData && contrato.planData.nombre) || '';
            
            // Obtener información del ejecutivo del contrato
            const ejecutivoNombre = contrato.ejecutivo || contrato.executive || contrato.ejecutivoNombre || contrato.nombreEjecutivo || '';
            const ejecutivoId = contrato.executiveId || contrato.ejecutivoId || '';
            const productionRecord = contrato.productionRecord || '';
            let cuotaInicialValor = '';
            try {
                const planData = typeof contrato.planData === 'string' ? JSON.parse(contrato.planData) : contrato.planData;
                if (planData && planData.cuotaInicial != null) {
                    const parsed = Number(planData.cuotaInicial);
                    if (!isNaN(parsed) && isFinite(parsed)) {
                        cuotaInicialValor = parsed;
                    }
                }
            } catch (error) {
                console.warn('No fue posible leer la cuota inicial del plan del contrato', error);
            }
            
            const option = document.createElement('option');
            option.value = numero;
            option.textContent = `Contrato ${numero || '—'}${plan ? ' - ' + plan : ''}`;
            option.dataset.contratoId = contrato.id || '';
            // Guardar información del ejecutivo en el dataset
            option.dataset.ejecutivoNombre = ejecutivoNombre;
            option.dataset.ejecutivoId = ejecutivoId;
            option.dataset.productionRecord = productionRecord;
            option.dataset.cuotaInicial = cuotaInicialValor !== '' ? String(cuotaInicialValor) : '';
            select.appendChild(option);
            console.log(`Contrato ${index + 1}:`, numero, plan, 'Ejecutivo:', ejecutivoNombre, ejecutivoId);
        });
        
        console.log('Select llenado. Total opciones:', select.options.length);
        
        // Event listener para cuando se selecciona un contrato
        select.onchange = function() {
            const selectedValue = this.value;
            if (selectedValue) {
                // Actualizar el input oculto con el valor seleccionado
                invoiceInput.value = selectedValue;
                
                // Obtener la opción seleccionada para extraer información del ejecutivo
                const selectedOption = this.options[this.selectedIndex];
                const ejecutivoNombre = selectedOption.dataset.ejecutivoNombre || '';
                const ejecutivoId = selectedOption.dataset.ejecutivoId || '';
                
                // Llenar automáticamente los campos del ejecutivo
                if (ejecutivoNombre || ejecutivoId) {
                    loadExecutiveFromContract(ejecutivoNombre, ejecutivoId);
                }
                
                // Establecer record de producción desde el contrato
                const productionRecord = selectedOption.dataset.productionRecord || '';
                setProductionRecordField(productionRecord);
                
                // Para CI (contratos) establecer el valor de la cuota inicial del plan
                const cuotaInicial = selectedOption.dataset.cuotaInicial || '';
                setInflowInitialValue(cuotaInicial);
                
                // Para CI no se valida factura, solo se muestra confirmación de contrato seleccionado
                showContractSelected(selectedValue);
            } else {
                invoiceInput.value = '';
                clearInvoiceValidation();
                setProductionRecordField('');
                setInflowInitialValue('');
                // Asegurar que el campo de cuota quede editable
                const cuotaInput = document.getElementById('cuota');
                if (cuotaInput) {
                    cuotaInput.readOnly = false;
                }
            }
        };
        
    } catch (error) {
        console.error('Error cargando contratos para titular:', error);
        clearInvoiceOrContractSelect();
    }
}

/**
 * Carga las facturas del titular en el select de factura (para CR)
 * @param {string} cedula - Identificación del titular
 * @param {string} city - Código de la ciudad
 */
function loadInvoicesForTitularInInflow(cedula, city) {
    try {
        // Obtener facturas del titular
        const facturas = getInvoicesByClientId(city, cedula);
        
        const invoiceInput = document.getElementById('invoiceNumber');
        const invoiceSelect = document.getElementById('invoiceNumberSelect');
        
        if (!invoiceInput) return;
        
        // Si no existe el select, crearlo
        if (!invoiceSelect) {
            createInvoiceSelect();
        }
        
        const select = document.getElementById('invoiceNumberSelect');
        if (!select) {
            console.error('No se pudo crear el select');
            return;
        }
        
        // Ocultar input y mostrar select
        invoiceInput.style.display = 'none';
        invoiceInput.required = false;
        
        const selectContainer = select.parentElement;
        if (selectContainer && selectContainer.classList.contains('select-container')) {
            selectContainer.style.display = 'block';
        } else {
            select.style.display = 'block';
        }
        select.required = true;
        
        // Actualizar label si es necesario
        updateInvoiceLabel('factura');
        
        // Limpiar y llenar el select
        select.innerHTML = '<option value="">Seleccione la factura</option>';
        
        console.log('Select de facturas creado y mostrado. Facturas encontradas:', facturas.length);
        
        if (facturas.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay facturas disponibles';
            option.disabled = true;
            select.appendChild(option);
            console.warn('No se encontraron facturas para el titular:', cedula);
            return;
        }
        
        console.log('Agregando', facturas.length, 'facturas al select');
        facturas.forEach((factura, index) => {
            const numero = String(factura.invoiceNumber || '').trim();
            const contractNumber = factura.contractNumber || '';
            const contractIdFromInvoice = factura.contractId || factura.contractID || factura.contract || '';
            
            // Intentar obtener información del contrato asociado
            let contractData = null;
            if (contractNumber || contractIdFromInvoice) {
                try {
                    const contractsRaw = localStorage.getItem(`contratos_${city}`);
                    if (contractsRaw) {
                        const contracts = JSON.parse(contractsRaw);
                        if (Array.isArray(contracts)) {
                            contractData = contracts.find(c => {
                                const matchesId = contractIdFromInvoice && String(c.id) === String(contractIdFromInvoice);
                                const contractNum = c.contractNumber || c.numero || c.numeroContrato || '';
                                const matchesNumber = contractNumber && String(contractNum) === String(contractNumber);
                                return matchesId || matchesNumber;
                            }) || null;
                        }
                    }
                } catch (e) {
                    console.error('Error obteniendo contrato asociado a la factura:', e);
                }
            }
            
            // Para CR: Primero intentar obtener el ejecutivo asignado a la cuenta/factura
            // (cuando exista el módulo de asignación)
            let ejecutivoAsignado = getAssignedExecutiveForInvoice(numero, city);
            let ejecutivoNombre = '';
            let ejecutivoId = '';
            let productionRecord = factura.productionRecord || factura.ingreso || '';
            
            if (ejecutivoAsignado && (ejecutivoAsignado.nombre || ejecutivoAsignado.id)) {
                // Si hay ejecutivo asignado, usar ese
                ejecutivoNombre = ejecutivoAsignado.nombre || '';
                ejecutivoId = ejecutivoAsignado.id || ejecutivoAsignado.ejecutivoId || '';
                console.log('✅ Ejecutivo asignado encontrado para factura:', numero, ejecutivoAsignado);
                if (!productionRecord && ejecutivoAsignado.productionRecord) {
                    productionRecord = ejecutivoAsignado.productionRecord;
                }
            } else {
                // Si no hay ejecutivo asignado, usar el ejecutivo de la factura o del contrato
                ejecutivoNombre = factura.executive || factura.ejecutivo || factura.ejecutivoNombre || '';
                ejecutivoId = factura.executiveId || factura.ejecutivoId || '';
                
                // Si no hay ejecutivo en la factura, intentar obtenerlo del contrato
                if ((!ejecutivoNombre || !ejecutivoId) && contractData) {
                    ejecutivoNombre = ejecutivoNombre || contractData.ejecutivo || contractData.executive || contractData.ejecutivoNombre || contractData.nombreEjecutivo || '';
                    ejecutivoId = ejecutivoId || contractData.executiveId || contractData.ejecutivoId || '';
                } else if (!ejecutivoNombre && contractNumber) {
                    try {
                        const contractsRaw = localStorage.getItem(`contratos_${city}`);
                        if (contractsRaw) {
                            const contracts = JSON.parse(contractsRaw);
                            if (Array.isArray(contracts)) {
                                const contract = contracts.find(c => {
                                    const cNum = c.numero || c.contractNumber || c.numeroContrato || '';
                                    return String(cNum) === String(contractNumber);
                                });
                                if (contract) {
                                    ejecutivoNombre = contract.ejecutivo || contract.executive || contract.ejecutivoNombre || contract.nombreEjecutivo || ejecutivoNombre;
                                    ejecutivoId = contract.executiveId || contract.ejecutivoId || ejecutivoId;
                                    if (!productionRecord) {
                                        productionRecord = contract.productionRecord || '';
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error obteniendo ejecutivo del contrato:', e);
                    }
                }
                console.log('⚠️ No hay ejecutivo asignado, usando ejecutivo de factura/contrato:', ejecutivoNombre || 'No encontrado');
            }
            
            if (contractData && !productionRecord) {
                productionRecord = contractData.productionRecord || '';
            }
            
            const option = document.createElement('option');
            option.value = numero;
            option.textContent = `Factura ${numero || '—'}${contractNumber ? ' - Contrato ' + contractNumber : ''}`;
            option.dataset.facturaId = factura.id || '';
            // Guardar información del ejecutivo en el dataset
            option.dataset.ejecutivoNombre = ejecutivoNombre;
            option.dataset.ejecutivoId = ejecutivoId;
            option.dataset.productionRecord = productionRecord || '';
            select.appendChild(option);
            console.log(`Factura ${index + 1}:`, numero, contractNumber, 'Ejecutivo:', ejecutivoNombre, ejecutivoId);
        });
        
        console.log('Select llenado. Total opciones:', select.options.length);
        
        // Event listener para cuando se selecciona una factura
        select.onchange = function() {
            const selectedValue = this.value;
            if (selectedValue) {
                // Actualizar el input oculto con el valor seleccionado
                invoiceInput.value = selectedValue;
                
                // Para CR: Primero intentar obtener el ejecutivo asignado (si existe el módulo)
                const ejecutivoAsignado = getAssignedExecutiveForInvoice(selectedValue, city);
                
                if (ejecutivoAsignado && (ejecutivoAsignado.nombre || ejecutivoAsignado.id)) {
                    // Si hay ejecutivo asignado, usar ese (tiene prioridad)
                    console.log('✅ Usando ejecutivo asignado para factura:', selectedValue);
                    loadExecutiveFromContract(ejecutivoAsignado.nombre, ejecutivoAsignado.id);
                } else {
                    // Si no hay ejecutivo asignado, usar el de la opción seleccionada (factura/contrato)
                    const selectedOption = this.options[this.selectedIndex];
                    const ejecutivoNombre = selectedOption.dataset.ejecutivoNombre || '';
                    const ejecutivoId = selectedOption.dataset.ejecutivoId || '';
                    
                    // Llenar automáticamente los campos del ejecutivo
                    if (ejecutivoNombre || ejecutivoId) {
                        loadExecutiveFromContract(ejecutivoNombre, ejecutivoId);
                    }
                }
                
                // Validar la factura
                validateInvoiceNumber(selectedValue);

                // Abrir modal de selección de cuotas
                setTimeout(() => {
                    showSelectInstallmentsModal();
                }, 300);
                
                const selectedOption = this.options[this.selectedIndex];
                const productionRecord = selectedOption?.dataset?.productionRecord || '';
                setProductionRecordField(productionRecord);
            } else {
                invoiceInput.value = '';
                clearInvoiceValidation();
                setProductionRecordField('');
                // Limpiar campos de cuota y valor
                setInflowInitialValue('');
                const cuotaInput = document.getElementById('cuota');
                const valorInput = document.getElementById('inflowValue');
                if (cuotaInput) {
                    cuotaInput.value = '';
                    cuotaInput.readOnly = false;
                }
                if (valorInput) {
                    valorInput.value = '';
                    valorInput.readOnly = false;
                }
            }
        };
        
    } catch (error) {
        console.error('Error cargando facturas para titular:', error);
        clearInvoiceOrContractSelect();
    }
}

/**
 * Obtiene contratos por ID de titular (para uso en ingreso a caja)
 * @param {string} city - Código de la ciudad
 * @param {string} clientId - Identificación del titular
 * @param {boolean} onlyActive - Solo contratos activos
 * @returns {Array} Array de contratos
 */
function getContractsByClientIdForInflow(city, clientId, onlyActive = true) {
    const result = [];
    const clean = (v) => String(v || '').replace(/\D+/g, '').trim();
    
    try {
        const raw = localStorage.getItem(`contratos_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        
        if (Array.isArray(list)) {
            list.forEach(c => {
                if (clean(c.clientId || c.identificacion || c.cedula) !== clean(clientId)) return;
                
                if (onlyActive) {
                    const estado = (c.estado || '').toString().toLowerCase().trim();
                    const activoOk = estado ? (estado === 'activo') : 
                        (typeof c.activo === 'undefined' || 
                         (c.activo === true || c.activo === 1 || 
                          String(c.activo).toLowerCase().trim() === 'true' || 
                          String(c.activo).toLowerCase().trim() === 'si'));
                    if (!activoOk) return;
                }
                result.push(c);
            });
        }
    } catch (e) {
        console.error('Error obteniendo contratos:', e);
    }
    
    return result;
}

/**
 * Obtiene facturas por ID de titular
 * @param {string} city - Código de la ciudad
 * @param {string} clientId - Identificación del titular
 * @returns {Array} Array de facturas
 */
function getInvoicesByClientId(city, clientId) {
    const result = [];
    const clean = (v) => String(v || '').replace(/\D+/g, '').trim();
    
    try {
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) return result;
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        invoices.forEach(inv => {
            const invClientId = inv.clientId || inv.identificacion || inv.cedula || '';
            if (clean(invClientId) === clean(clientId)) {
                result.push(inv);
            }
        });
    } catch (e) {
        console.error('Error obteniendo facturas:', e);
    }
    
    return result;
}

/**
 * Crea el select para factura/contrato si no existe
 */
function createInvoiceSelect() {
    const invoiceInput = document.getElementById('invoiceNumber');
    if (!invoiceInput) return;
    
    // Verificar si ya existe
    if (document.getElementById('invoiceNumberSelect')) return;
    
    // Obtener el form-group que contiene el input
    const formGroup = invoiceInput.closest('.form-group');
    if (!formGroup) return;
    
    // Crear contenedor para el select (similar a otros selects del sistema)
    const selectContainer = document.createElement('div');
    selectContainer.className = 'select-container';
    selectContainer.style.display = 'none';
    
    // Crear el select
    const select = document.createElement('select');
    select.id = 'invoiceNumberSelect';
    select.className = 'form-select';
    select.required = false;
    
    // Crear el ícono de flecha
    const arrow = document.createElement('i');
    arrow.className = 'fas fa-chevron-down select-arrow';
    
    // Agregar elementos al contenedor
    selectContainer.appendChild(select);
    selectContainer.appendChild(arrow);
    
    // Insertar el contenedor después del input pero antes del display
    const invoiceDisplay = document.getElementById('invoiceNumberDisplay');
    if (invoiceDisplay && invoiceDisplay.parentElement === formGroup) {
        formGroup.insertBefore(selectContainer, invoiceDisplay);
    } else {
        formGroup.appendChild(selectContainer);
    }
}

/**
 * Limpia y restaura el campo de factura a su estado original (input)
 */
function clearInvoiceOrContractSelect() {
    const invoiceInput = document.getElementById('invoiceNumber');
    const invoiceSelect = document.getElementById('invoiceNumberSelect');
    
    if (invoiceSelect) {
        invoiceSelect.innerHTML = '<option value="">Seleccione</option>';
        invoiceSelect.required = false;
        invoiceSelect.value = '';
        const selectContainer = invoiceSelect.parentElement;
        if (selectContainer && selectContainer.classList.contains('select-container')) {
            selectContainer.style.display = 'none';
        } else {
            invoiceSelect.style.display = 'none';
        }
    }
    
    if (invoiceInput) {
        invoiceInput.style.display = 'block';
        invoiceInput.required = true;
        invoiceInput.value = '';
    }
    
    // Restaurar label original
    updateInvoiceLabel('factura');
    
    clearInvoiceValidation();
    setInflowInitialValue('');
}

/**
 * Actualiza el label del campo de factura según el tipo
 * @param {string} type - 'factura' o 'contrato'
 */
function updateInvoiceLabel(type) {
    const label = document.querySelector('label[for="invoiceNumber"]');
    if (label) {
        if (type === 'contrato') {
            label.textContent = 'Contrato *';
        } else {
            label.textContent = 'Factura *';
        }
    }
}

function searchExecutiveByIdentification(identificacion) {
    try {
        // Buscar en empleados
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        if (!empleadosByCity) {
            clearExecutiveData();
            return;
        }
        
        const city = getSelectedCityCode();
        if (!city) {
            clearExecutiveData();
            return;
        }
        
        const data = JSON.parse(empleadosByCity);
        const empleados = data[city] || {};
        
        // Buscar empleado por identificación
        let empleado = null;
        for (const key in empleados) {
            const emp = empleados[key];
            // Buscar por diferentes campos posibles de identificación
            if (emp.numeroId === identificacion || 
                emp.identificacion === identificacion ||
                emp.tipoId === identificacion ||
                key === identificacion ||
                (emp.tipoId && emp.numeroId && `${emp.tipoId}${emp.numeroId}` === identificacion)) {
                empleado = emp;
                break;
            }
        }
        
        // Si no se encontró, intentar buscar directamente por la clave (que puede ser la identificación)
        if (!empleado && empleados[identificacion]) {
            empleado = empleados[identificacion];
        }
        
        if (empleado) {
            console.log('Empleado encontrado:', empleado);
            // Construir nombre completo usando diferentes posibles estructuras
            const nombreCompleto = (empleado.nombre || 
                empleado.nombreCompleto ||
                `${empleado.tPrimerNombre || empleado.primerNombre || empleado.nombre1 || ''} ${empleado.tSegundoNombre || empleado.segundoNombre || empleado.nombre2 || ''} ${empleado.tPrimerApellido || empleado.primerApellido || empleado.apellido1 || ''} ${empleado.tSegundoApellido || empleado.segundoApellido || empleado.apellido2 || ''}`.trim()).toUpperCase();
            
            console.log('Nombre completo construido:', nombreCompleto);
            
            const executiveNameInput = document.getElementById('executiveName');
            const executiveNameDisplay = document.getElementById('executiveNameDisplay');
            
            if (nombreCompleto && nombreCompleto.trim()) {
                if (executiveNameInput) {
                    executiveNameInput.value = nombreCompleto;
                }
                if (executiveNameDisplay) {
                    executiveNameDisplay.textContent = `Ejecutivo encontrado: ${nombreCompleto}`;
                    executiveNameDisplay.style.display = 'block';
                    executiveNameDisplay.classList.remove('error-text');
                    executiveNameDisplay.classList.add('success-text');
                }
            } else {
                console.warn('Empleado encontrado pero sin nombre completo');
                clearExecutiveData();
                if (executiveNameDisplay) {
                    executiveNameDisplay.textContent = 'Ejecutivo encontrado pero sin nombre';
                    executiveNameDisplay.style.display = 'block';
                    executiveNameDisplay.classList.remove('success-text');
                    executiveNameDisplay.classList.add('error-text');
                }
            }
        } else {
            console.log('Empleado no encontrado para identificación:', identificacion);
            clearExecutiveData();
            const executiveNameDisplay = document.getElementById('executiveNameDisplay');
            if (executiveNameDisplay) {
                executiveNameDisplay.textContent = 'Ejecutivo no encontrado';
                executiveNameDisplay.style.display = 'block';
                executiveNameDisplay.classList.remove('success-text');
                executiveNameDisplay.classList.add('error-text');
            }
        }
    } catch (error) {
        console.error('Error buscando ejecutivo:', error);
        clearExecutiveData();
    }
}

function clearExecutiveData() {
    const executiveNameInput = document.getElementById('executiveName');
    const executiveNameDisplay = document.getElementById('executiveNameDisplay');
    
    if (executiveNameInput) {
        executiveNameInput.value = '';
    }
    if (executiveNameDisplay) {
        executiveNameDisplay.style.display = 'none';
        executiveNameDisplay.textContent = '';
        executiveNameDisplay.classList.remove('error-text', 'success-text');
    }
}

// ========================================
// VALIDACIÓN DE FACTURA
// ========================================

function initializeInvoiceValidation() {
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    if (!invoiceNumberInput) return;
    
    invoiceNumberInput.addEventListener('input', function() {
        const invoiceNumber = this.value.trim();
        if (invoiceNumber.length >= 4) {
            validateInvoiceNumber(invoiceNumber);
        } else {
            clearInvoiceValidation();
        }
    });
    
    invoiceNumberInput.addEventListener('blur', function() {
        const invoiceNumber = this.value.trim();
        if (invoiceNumber) {
            validateInvoiceNumber(invoiceNumber);
            // Abrir modal de selección de cuotas cuando se ingresa una factura
            setTimeout(() => {
                showSelectInstallmentsModal();
            }, 300);
        }
    });
    
    // También escuchar cambios en el select de factura si existe
    const invoiceSelect = document.getElementById('invoiceNumberSelect');
    if (invoiceSelect) {
        invoiceSelect.addEventListener('change', function() {
            if (this.value) {
                setTimeout(() => {
                    showSelectInstallmentsModal();
                }, 200);
            }
        });
    }
    
    // Evento para seleccionar/deseleccionar todas las cuotas
    const selectAllCheckbox = document.getElementById('selectAllInstallments');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('#installmentsTableBody input[type="checkbox"][data-cuota]');
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
                if (!this.checked) {
                    // Limpiar valor si se deselecciona
                    const cuota = parseInt(cb.dataset.cuota);
                    const valorPagarInput = document.querySelector(`.valor-pagar-input[data-cuota="${cuota}"]`);
                    if (valorPagarInput) {
                        valorPagarInput.value = '0';
                        formatNumericInput(valorPagarInput);
                    }
                }
            });
            distributeValueToSelectedInstallments();
        });
    }
}

function validateInvoiceNumber(invoiceNumber) {
    const city = getSelectedCityCode();
    if (!city) {
        clearInvoiceValidation();
        return false;
    }
    
    try {
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            showInvoiceNotFound();
            return false;
        }
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        // Buscar factura por número (comparar sin ceros a la izquierda y con ceros)
        const invoice = invoices.find(inv => {
            const invNum = String(inv.invoiceNumber || '').trim();
            const searchNum = String(invoiceNumber).trim();
            // Comparar con y sin ceros a la izquierda
            return invNum === searchNum || 
                   invNum.replace(/^0+/, '') === searchNum.replace(/^0+/, '') ||
                   invNum === searchNum.padStart(8, '0') ||
                   invNum.padStart(8, '0') === searchNum;
        });
        
        if (invoice) {
            showInvoiceFound(invoice);
            return true;
        } else {
            showInvoiceNotFound();
            return false;
        }
    } catch (error) {
        console.error('Error validando factura:', error);
        showInvoiceNotFound();
        return false;
    }
}

function showInvoiceFound(invoice) {
    const invoiceDisplay = document.getElementById('invoiceNumberDisplay');
    const invoiceInput = document.getElementById('invoiceNumber');
    
    if (invoiceDisplay) {
        invoiceDisplay.textContent = `Factura encontrada: ${invoice.invoiceNumber}`;
        invoiceDisplay.style.display = 'block';
        invoiceDisplay.classList.remove('error-text');
        invoiceDisplay.classList.add('success-text');
    }
    
    if (invoiceInput) {
        invoiceInput.classList.remove('input-error');
    }

    // Autollenar cuota y valor con base en la factura
    try {
        autoSetInstallmentFromInvoice(invoice.invoiceNumber);
    } catch (e) {
        console.warn('No se pudo autollenar cuota/valor desde la factura:', e);
    }
}

function showInvoiceNotFound() {
    const invoiceDisplay = document.getElementById('invoiceNumberDisplay');
    const invoiceInput = document.getElementById('invoiceNumber');
    
    if (invoiceDisplay) {
        invoiceDisplay.textContent = 'La factura no está creada. Debe crear la factura primero.';
        invoiceDisplay.style.display = 'block';
        invoiceDisplay.classList.remove('success-text');
        invoiceDisplay.classList.add('error-text');
    }
    
    if (invoiceInput) {
        invoiceInput.classList.add('input-error');
    }

    setProductionRecordField('');
}

function clearInvoiceValidation() {
    const invoiceDisplay = document.getElementById('invoiceNumberDisplay');
    const invoiceInput = document.getElementById('invoiceNumber');
    
    if (invoiceDisplay) {
        invoiceDisplay.style.display = 'none';
        invoiceDisplay.textContent = '';
        invoiceDisplay.classList.remove('error-text', 'success-text');
    }
    
    if (invoiceInput) {
        invoiceInput.classList.remove('input-error');
    }

    setProductionRecordField('');
}

/**
 * Muestra confirmación cuando se selecciona un contrato (para CI)
 * @param {string} contractNumber - Número del contrato seleccionado
 */
function showContractSelected(contractNumber) {
    const invoiceDisplay = document.getElementById('invoiceNumberDisplay');
    const invoiceInput = document.getElementById('invoiceNumber');
    
    if (invoiceDisplay) {
        invoiceDisplay.textContent = `Contrato seleccionado: ${contractNumber}`;
        invoiceDisplay.style.display = 'block';
        invoiceDisplay.classList.remove('error-text');
        invoiceDisplay.classList.add('success-text');
    }
    
    if (invoiceInput) {
        invoiceInput.classList.remove('input-error');
    }
}

/**
 * Carga automáticamente la información del ejecutivo desde el contrato o factura
 * @param {string} ejecutivoNombre - Nombre del ejecutivo
 * @param {string} ejecutivoId - Identificación del ejecutivo
 */
function loadExecutiveFromContract(ejecutivoNombre, ejecutivoId) {
    const executiveNameInput = document.getElementById('executiveName');
    const executiveIdInput = document.getElementById('executiveId');
    const executiveNameDisplay = document.getElementById('executiveNameDisplay');
    
    console.log('Cargando ejecutivo:', { ejecutivoNombre, ejecutivoId });
    
    // Si tenemos el ID, buscar el ejecutivo completo para obtener el nombre si no viene
    if (ejecutivoId && !ejecutivoNombre) {
        searchExecutiveByIdentification(ejecutivoId);
        return;
    }
    
    // Si tenemos el nombre pero no el ID, intentar buscar el ID
    if (ejecutivoNombre && !ejecutivoId) {
        findExecutiveIdByName(ejecutivoNombre);
    }
    
    // Llenar los campos con la información disponible
    if (executiveNameInput && ejecutivoNombre) {
        executiveNameInput.value = ejecutivoNombre.toUpperCase();
    }
    
    if (executiveIdInput && ejecutivoId) {
        executiveIdInput.value = ejecutivoId;
    }
    
    // Mostrar confirmación
    if (executiveNameDisplay) {
        if (ejecutivoNombre) {
            executiveNameDisplay.textContent = `Ejecutivo: ${ejecutivoNombre.toUpperCase()}`;
            executiveNameDisplay.style.display = 'block';
            executiveNameDisplay.classList.remove('error-text');
            executiveNameDisplay.classList.add('success-text');
        } else {
            executiveNameDisplay.style.display = 'none';
        }
    }
}

/**
 * Obtiene el ejecutivo asignado a una factura/cuenta (para CR)
 * Esta función está preparada para cuando se desarrolle el módulo de asignación de cuentas
 * 
 * @param {string} invoiceNumber - Número de factura
 * @param {string} city - Código de la ciudad
 * @returns {Object|null} Objeto con {nombre, id, ejecutivoId} o null si no hay asignación
 * 
 * NOTA: Cuando se desarrolle el módulo de asignación, implementar la lógica aquí.
 * Por ahora retorna null y el sistema usará el ejecutivo del contrato/factura como fallback.
 * 
 * EJEMPLO DE IMPLEMENTACIÓN FUTURA:
 * 
 * function getAssignedExecutiveForInvoice(invoiceNumber, city) {
 *     try {
 *         // Opción 1: Buscar en localStorage (si se guarda ahí)
 *         const asignacionesRaw = localStorage.getItem(`asignacionesCuentas_${city}`);
 *         if (asignacionesRaw) {
 *             const asignaciones = JSON.parse(asignacionesRaw);
 *             const asignacion = asignaciones.find(a => 
 *                 String(a.facturaNumber || a.invoiceNumber) === String(invoiceNumber)
 *             );
 *             if (asignacion && asignacion.ejecutivo) {
 *                 return {
 *                     nombre: asignacion.ejecutivo.nombre || asignacion.ejecutivoNombre,
 *                     id: asignacion.ejecutivo.id || asignacion.ejecutivoId
 *                 };
 *             }
 *         }
 *         
 *         // Opción 2: Llamada a API (cuando exista backend)
 *         // const response = await fetch(`/api/asignaciones-cuentas?factura=${invoiceNumber}&ciudad=${city}`);
 *         // const data = await response.json();
 *         // if (data.asignacion && data.asignacion.ejecutivo) {
 *         //     return {
 *         //         nombre: data.asignacion.ejecutivo.nombre,
 *         //         id: data.asignacion.ejecutivo.id
 *         //     };
 *         // }
 *         
 *         return null;
 *     } catch (error) {
 *         console.error('Error obteniendo ejecutivo asignado:', error);
 *         return null;
 *     }
 * }
 */
function getAssignedExecutiveForInvoice(invoiceNumber, city) {
    // TODO: Implementar cuando se desarrolle el módulo de asignación de cuentas
    // Por ahora retorna null y el sistema usará el ejecutivo del contrato/factura
    
    try {
        // Intentar buscar en localStorage si existe una estructura de asignaciones
        // Esta es una estructura sugerida que se puede usar cuando se implemente el módulo
        const asignacionesRaw = localStorage.getItem(`asignacionesCuentas_${city}`);
        if (asignacionesRaw) {
            const asignaciones = JSON.parse(asignacionesRaw);
            if (Array.isArray(asignaciones)) {
                const asignacion = asignaciones.find(a => {
                    const facturaNum = a.facturaNumber || a.invoiceNumber || a.factura || '';
                    return String(facturaNum).trim() === String(invoiceNumber).trim();
                });
                
                if (asignacion && asignacion.ejecutivo) {
                    return {
                        nombre: asignacion.ejecutivo.nombre || asignacion.ejecutivoNombre || '',
                        id: asignacion.ejecutivo.id || asignacion.ejecutivoId || asignacion.ejecutivo.identificacion || ''
                    };
                }
            }
        }
        
        // Si no se encuentra en localStorage, retornar null
        // El sistema usará el ejecutivo del contrato/factura como fallback
        return null;
    } catch (error) {
        console.error('Error obteniendo ejecutivo asignado:', error);
        return null;
    }
}

/**
 * Busca la identificación del ejecutivo por su nombre
 * @param {string} executiveName - Nombre del ejecutivo
 */
function findExecutiveIdByName(executiveName) {
    try {
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        const city = getSelectedCityCode();
        
        if (empleadosByCity && city) {
            const data = JSON.parse(empleadosByCity);
            const empleados = data[city] || {};
            
            // Buscar por nombre completo
            for (const [cedula, empleado] of Object.entries(empleados)) {
                const nombreCompleto = [
                    empleado.tPrimerNombre || empleado.primerNombre || empleado.nombre1,
                    empleado.tSegundoNombre || empleado.segundoNombre || empleado.nombre2,
                    empleado.tPrimerApellido || empleado.primerApellido || empleado.apellido1,
                    empleado.tSegundoApellido || empleado.segundoApellido || empleado.apellido2
                ].filter(Boolean).join(' ').toUpperCase();
                
                // Comparar nombres (case insensitive)
                if (nombreCompleto.trim() === executiveName.toUpperCase().trim()) {
                    const executiveIdInput = document.getElementById('executiveId');
                    if (executiveIdInput) {
                        executiveIdInput.value = cedula;
                    }
                    console.log('✅ Ejecutivo encontrado por nombre:', cedula, nombreCompleto);
                    return;
                }
            }
        }
        
        console.log('⚠️ No se encontró identificación para el ejecutivo:', executiveName);
    } catch (error) {
        console.error('Error buscando identificación del ejecutivo:', error);
    }
}

// ========================================
// FORMATO DE VALORES NUMÉRICOS
// ========================================

function initializeNumericFormatting() {
    // Formatear campo de valor
    const valorInput = document.getElementById('inflowValue');
    if (valorInput) {
        // Prevenir entrada de caracteres no numéricos
        valorInput.addEventListener('keydown', function(e) {
            // Permitir teclas de control (backspace, delete, tab, escape, enter, flechas, etc.)
            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || 
                e.key === 'Escape' || e.key === 'Enter' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                (e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                return;
            }
            // Permitir solo números
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
        
        // Formatear en tiempo real mientras se escribe
        valorInput.addEventListener('input', function(e) {
            const cursorPosition = this.selectionStart;
            const originalValue = this.value;
            
            // Obtener solo números
            const numbersOnly = this.value.replace(/[^\d]/g, '');
            
            if (!numbersOnly) {
                this.value = '';
                return;
            }
            
            // Formatear con separadores de miles usando formato colombiano
            const numValue = parseInt(numbersOnly, 10);
            if (!isNaN(numValue)) {
                const formatted = new Intl.NumberFormat('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(numValue);
                
                this.value = formatted;
                
                // Ajustar posición del cursor
                const beforeCursor = originalValue.substring(0, cursorPosition);
                const digitsBeforeCursor = beforeCursor.replace(/[^\d]/g, '').length;
                
                // Encontrar la posición en el nuevo valor formateado
                let digitsFound = 0;
                let newCursorPosition = formatted.length;
                for (let i = 0; i < formatted.length; i++) {
                    if (formatted[i] >= '0' && formatted[i] <= '9') {
                        digitsFound++;
                        if (digitsFound === digitsBeforeCursor) {
                            newCursorPosition = i + 1;
                            break;
                        }
                    }
                }
                
                this.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        });
        
        valorInput.addEventListener('blur', function() {
            formatNumericInput(this);
            // Distribuir valor cuando se pierde el foco
            distributeValueToSelectedInstallments();
        });
        
        // Distribuir valor cuando cambia (con debounce)
        let calculateTimeout;
        valorInput.addEventListener('input', function() {
            clearTimeout(calculateTimeout);
            calculateTimeout = setTimeout(() => {
                distributeValueToSelectedInstallments();
            }, 500); // Esperar 500ms después de que el usuario deje de escribir
        });
        
        // Prevenir pegar texto no numérico
        valorInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const numbersOnly = pastedText.replace(/[^\d]/g, '');
            if (numbersOnly) {
                const numValue = parseInt(numbersOnly, 10);
                if (!isNaN(numValue)) {
                    this.value = new Intl.NumberFormat('es-CO', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(numValue);
                    this.setSelectionRange(this.value.length, this.value.length);
                }
            }
        });
    }
    
    // Formatear campo de cuota
    const cuotaInput = document.getElementById('cuota');
    if (cuotaInput) {
        cuotaInput.addEventListener('input', function() {
            formatNumericInput(this);
        });
        cuotaInput.addEventListener('blur', function() {
            formatNumericInput(this);
            // Recalcular cuotas cuando cambie la cuota inicial
            calculateInstallmentsFromValue();
        });
    }
}

function formatNumericInput(input) {
    // Obtener el valor sin formato (solo números)
    let value = input.value.replace(/[^\d]/g, '');
    
    if (!value) {
        input.value = '';
        return;
    }
    
    // Convertir a número y formatear con separadores de miles (punto)
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
        // Usar formato colombiano (puntos como separadores de miles)
        const formatted = new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numValue);
        
        input.value = formatted;
        
        // Mover cursor al final
        input.setSelectionRange(formatted.length, formatted.length);
    }
}

function formatNumber(num) {
    if (isNaN(num)) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseFormattedNumber(formattedValue) {
    if (!formattedValue) return 0;
    // Remover todos los separadores de miles (puntos en formato colombiano)
    const cleanValue = formattedValue.toString().replace(/\./g, '').replace(/[^\d]/g, '');
    return parseFloat(cleanValue) || 0;
}

// ========================================
// CONVERSIÓN AUTOMÁTICA A MAYÚSCULAS
// ========================================

function initializeUppercaseInputs() {
    // Agregar evento a todos los inputs con clase uppercase-input
    document.querySelectorAll('.uppercase-input').forEach(input => {
        input.addEventListener('input', function() {
            const cursorPosition = this.selectionStart;
            this.value = this.value.toUpperCase();
            // Restaurar posición del cursor
            this.setSelectionRange(cursorPosition, cursorPosition);
        });
        
        // También convertir al pegar (evento paste)
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const currentValue = this.value;
            this.value = currentValue.substring(0, start) + pastedText.toUpperCase() + currentValue.substring(end);
            // Restaurar posición del cursor después del texto pegado
            const newPosition = start + pastedText.length;
            this.setSelectionRange(newPosition, newPosition);
        });
    });
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

function updateInflowSearchPlaceholder() {
    const typeSel = document.getElementById('inflowSearchType');
    const input = document.getElementById('searchInflowValue');
    const label = document.getElementById('inflowSearchLabel');
    
    if (!typeSel || !input || !label) return;
    
    const type = typeSel.value;
    let placeholder = 'Ingrese el valor a buscar';
    let labelText = 'Valor de Búsqueda *';
    
    switch (type) {
        case 'number':
            placeholder = 'Ingrese el número de ingreso';
            labelText = 'Número de Ingreso *';
            break;
        case 'holderName':
            placeholder = 'Ingrese el nombre del titular';
            labelText = 'Nombre del Titular *';
            break;
        case 'holderId':
            placeholder = 'Ingrese la identificación del titular';
            labelText = 'Identificación del Titular *';
            break;
        default:
            input.type = 'text';
    }
    
    input.placeholder = placeholder;
    label.textContent = labelText;
    input.type = 'text';
}

function clearCreateInflowForm() {
    const form = document.getElementById('createInflowForm');
    if (form) {
        // Guardar el número actual antes de resetear
        const numberInput = document.getElementById('inflowNumber');
        const currentNumber = numberInput ? numberInput.value : null;
        
        // Resetear el formulario
        form.reset();
        
        // Restaurar el número inmediatamente después del reset
        if (numberInput) {
            if (currentNumber) {
                numberInput.value = currentNumber;
            } else {
                // Si no había número, cargar el siguiente
                loadNextInflowNumber();
            }
        }
    }
    
    // Limpiar display de nombre del tipo de ingreso
    const incomeTypeNameDisplay = document.getElementById('incomeTypeNameDisplay');
    if (incomeTypeNameDisplay) {
        incomeTypeNameDisplay.style.display = 'none';
        incomeTypeNameDisplay.textContent = '';
        incomeTypeNameDisplay.classList.remove('error-text', 'success-text');
    }
}

function loadNextInflowNumber() {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    // Obtener el consecutivo inicial de ingreso a caja desde el sistema de consecutivos
    let nextNumber = 1;
    let consecutiveStart = 1;
    
    try {
        // Buscar consecutivos configurados para esta ciudad
        const raw = localStorage.getItem(`consecutivosData_${city}`);
        if (raw) {
            const consecutivos = JSON.parse(raw);
            if (Array.isArray(consecutivos) && consecutivos.length > 0) {
                // Tomar el último registro de consecutivos (el más reciente)
                const latestConsecutivo = consecutivos[consecutivos.length - 1];
                if (latestConsecutivo.ingresoCaja) {
                    consecutiveStart = parseInt(latestConsecutivo.ingresoCaja, 10) || 1;
                    nextNumber = consecutiveStart;
                }
            }
        }
    } catch (e) {
        console.error('Error obteniendo consecutivos:', e);
    }
    
    // Verificar si hay un puntero guardado del siguiente número a usar
    try {
        const persisted = parseInt(localStorage.getItem(`nextInflowNumber_${city}`) || '0', 10);
        if (persisted && persisted >= consecutiveStart) {
            nextNumber = persisted;
        }
        
        // Asegurar que sea mayor al máximo ya usado en la ciudad
        const raw = localStorage.getItem(`ingresosCaja_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list) && list.length > 0) {
            const maxUsed = Math.max(...list.map(item => {
                const num = parseInt(String(item.numero || '0').replace(/\D/g, ''), 10) || 0;
                return num;
            }));
            if (maxUsed >= nextNumber) {
                nextNumber = maxUsed + 1;
            }
        }
    } catch (e) {
        console.error('Error calculando siguiente número:', e);
    }
    
    const numberInput = document.getElementById('inflowNumber');
    if (numberInput) {
        const formattedNumber = String(nextNumber).padStart(8, '0');
        numberInput.value = formattedNumber;
        console.log('loadNextInflowNumber: Número cargado:', formattedNumber, 'para ciudad:', city);
    } else {
        console.error('loadNextInflowNumber: No se encontró el campo inflowNumber');
    }
}

// ========================================
// CARGA DE DATOS
// ========================================

function loadCashInflowData() {
    const city = getSelectedCityCode();
    if (!city) {
        cashInflowData = [];
        renderCashInflowTable(cashInflowData);
        return;
    }
    
    try {
        const raw = localStorage.getItem(`ingresosCaja_${city}`);
        cashInflowData = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(cashInflowData)) cashInflowData = [];
    } catch (e) {
        console.error('Error al cargar datos de ingresos a caja:', e);
        cashInflowData = [];
    }
    
    renderCashInflowTable(cashInflowData);
}

function renderCashInflowTable(list) {
    const tbody = document.getElementById('cashInflowTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!list || list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-money-bill-wave"></i>
                        <p>No existen registros de ingresos a caja</p>
                        <small>Haz clic en "Crear Ingreso" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const city = getSelectedCityCode();
    
    list.forEach(inflow => {
        const row = document.createElement('tr');
        row.className = `status-${(inflow.estado || 'activo') === 'activo' ? 'active' : 'inactive'}`;
        
        // Obtener tipo de ingreso
        const tipoIngreso = inflow.tipoIngresoCodigo && inflow.tipoIngresoNombre 
            ? `${inflow.tipoIngresoCodigo} - ${inflow.tipoIngresoNombre}`
            : (inflow.tipo || '');
        
        // Determinar si es CI o CR
        const category = getIncomeTypeCategory(inflow.tipoIngresoCodigo);
        
        // Obtener factura y contrato según el tipo
        let contractNumber = '';
        let invoiceNumber = '';
        
        if (category === 'CI') {
            // Para CI: invoiceNumber contiene el número de contrato, no hay factura
            contractNumber = inflow.invoiceNumber || '';
            invoiceNumber = ''; // No mostrar factura para CI
        } else {
            // Para CR u otros: buscar factura y contrato normalmente
            const invoiceInfo = getInvoiceAndContractByNumber(inflow.invoiceNumber, city);
            contractNumber = invoiceInfo.contractNumber || '';
            invoiceNumber = invoiceInfo.invoiceNumber || inflow.invoiceNumber || '';
        }
        
        // Formatear valor
        const valorFormatted = formatNumberValue(inflow.valor || 0);
        
        // Estado del ingreso (activo/anulado)
        const estado = inflow.estado || 'activo';
        const isActive = estado === 'activo';
        const newState = !isActive; // Estado al que cambiará (opuesto al actual)
        
        // Convertir a string booleano para asegurar evaluación correcta
        const newStateStr = newState ? 'true' : 'false';
        
        row.innerHTML = `
            <td>${inflow.numero || ''}</td>
            <td>${tipoIngreso}</td>
            <td>${formatDate(inflow.fecha || inflow.date)}</td>
            <td>${inflow.holderId || ''}</td>
            <td>${valorFormatted}</td>
            <td>${inflow.executiveId || ''}</td>
            <td>${inflow.letraRecibo || ''}</td>
            <td>${contractNumber}</td>
            <td>${invoiceNumber}</td>
            <td><span class="status-badge ${isActive ? 'active' : 'inactive'}">${isActive ? 'ACTIVO' : 'ANULADO'}</span></td>
            <td>
                <div class="action-buttons-cell status-toggle-container">
                    <button class="btn-icon btn-edit" onclick="editInflow(${inflow.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <label class="status-toggle" title="Activar/Anular" style="margin:0 6px;" tabindex="0" role="switch" aria-checked="${isActive ? 'true' : 'false'}"
                        onkeydown="if(event.key==='Enter'||event.key===' '){ event.preventDefault(); requestToggleInflow(${inflow.id}, ${newStateStr}); }">
                        <input type="checkbox" ${isActive ? 'checked' : ''} onchange="event.preventDefault(); requestToggleInflow(${inflow.id}, ${newStateStr});">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Función auxiliar para obtener factura y contrato por número de factura
function getInvoiceAndContractByNumber(invoiceNumber, city) {
    if (!invoiceNumber || !city) {
        return { invoiceNumber: '', contractNumber: '' };
    }
    
    try {
        // Buscar la factura en invoicesByCity
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            return { invoiceNumber: invoiceNumber, contractNumber: '' };
        }
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        // Buscar factura por número (comparar sin ceros a la izquierda y con ceros)
        const invoice = invoices.find(inv => {
            const invNum = String(inv.invoiceNumber || '').trim();
            const searchNum = String(invoiceNumber).trim();
            // Comparar con y sin ceros a la izquierda
            return invNum === searchNum || 
                   invNum.replace(/^0+/, '') === searchNum.replace(/^0+/, '') ||
                   invNum === searchNum.padStart(8, '0') ||
                   invNum.padStart(8, '0') === searchNum;
        });
        
        if (!invoice) {
            return { invoiceNumber: invoiceNumber, contractNumber: '' };
        }
        
        // Obtener el número de contrato de la factura
        let contractNumber = invoice.contractNumber || invoice.contractId || '';
        
        // Si no está en la factura, buscar en contratos usando contractId
        if (!contractNumber && invoice.contractId) {
            const contractsRaw = localStorage.getItem(`contratos_${city}`);
            if (contractsRaw) {
                const contracts = JSON.parse(contractsRaw);
                if (Array.isArray(contracts)) {
                    const contract = contracts.find(c => {
                        return String(c.id) === String(invoice.contractId) ||
                               String(c.contractNumber || c.numero || c.numeroContrato) === String(invoice.contractId);
                    });
                    if (contract) {
                        contractNumber = contract.contractNumber || contract.numero || contract.numeroContrato || '';
                    }
                }
            }
        }
        
        return {
            invoiceNumber: invoice.invoiceNumber || invoiceNumber,
            contractNumber: contractNumber
        };
    } catch (error) {
        console.error('Error obteniendo factura y contrato:', error);
        return { invoiceNumber: invoiceNumber, contractNumber: '' };
    }
}

// Función auxiliar para formatear valores numéricos
function formatNumberValue(value) {
    if (value === null || value === undefined || value === '') return '0';
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
    if (isNaN(num)) return '0';
    // Formatear con separadores de miles (punto)
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.floor(num));
}

function setProductionRecordField(value) {
    const recordInput = document.getElementById('recordProduccion');
    if (!recordInput) return;
    const cleanValue = (value || '').toString().trim();
    if (cleanValue) {
        recordInput.value = cleanValue;
        recordInput.readOnly = true;
    } else {
        recordInput.value = '';
        recordInput.readOnly = false;
    }
}

/**
 * Actualiza el label y placeholder del campo "Recibo Oficial" según el tipo de ingreso
 * - CI: "Recibo Inscripción"
 * - CR u otros: "Recibo Oficial"
 */
function updateReciboOficialLabel() {
    const tipoIngresoCodigo = window.tempInflowBasicData?.tipoIngresoCodigo || '';
    const category = getIncomeTypeCategory(tipoIngresoCodigo);
    const label = document.getElementById('reciboOficialLabel');
    const input = document.getElementById('reciboOficial');
    
    if (category === 'CI') {
        if (label) label.textContent = 'Recibo Inscripción';
        if (input) input.placeholder = 'RECIBO INSCRIPCIÓN';
    } else {
        if (label) label.textContent = 'Recibo Oficial';
        if (input) input.placeholder = 'RECIBO OFICIAL';
    }
}

/**
 * Actualiza el label y configuración del campo de cuota según el tipo de ingreso
 * - CR: "Cuota *" (requerido)
 * - CI: "Cuota Inicial *" (requerido)
 */
function updateCuotaFieldLabel() {
    const tipoIngresoCodigo = window.tempInflowBasicData?.tipoIngresoCodigo || '';
    const category = getIncomeTypeCategory(tipoIngresoCodigo);
    const label = document.getElementById('cuotaLabel');
    const input = document.getElementById('cuota');
    const helpText = document.getElementById('cuotaHelpText');
    
    if (category === 'CI') {
        // Para CI: "Cuota Inicial *"
        if (label) label.textContent = 'Cuota Inicial *';
        if (input) {
            input.placeholder = 'CUOTA INICIAL';
            input.required = true;
        }
        if (helpText) {
            helpText.textContent = 'Deje vacío para comenzar desde la próxima cuota pendiente';
            helpText.style.display = 'block';
        }
    } else if (category === 'CR') {
        // Para CR: "Cuota *"
        if (label) label.textContent = 'Cuota *';
        if (input) {
            input.placeholder = 'CUOTA';
            input.required = true;
        }
        if (helpText) {
            helpText.style.display = 'none';
        }
    } else {
        // Por defecto: "Cuota *"
        if (label) label.textContent = 'Cuota *';
        if (input) {
            input.placeholder = 'CUOTA';
            input.required = true;
        }
        if (helpText) {
            helpText.style.display = 'none';
        }
    }
}

function setInflowInitialValue(value) {
    const valueInput = document.getElementById('inflowValue');
    const cuotaInput = document.getElementById('cuota');
    
    if (!valueInput) return;
    
    if (value === null || value === undefined || String(value).trim() === '') {
        valueInput.value = '';
        valueInput.readOnly = false;
        // Limpiar campo de cuota y permitir edición
        if (cuotaInput) {
            cuotaInput.value = '';
            cuotaInput.readOnly = false;
        }
        return;
    }
    
    const numeric = Number(value);
    if (!isNaN(numeric) && isFinite(numeric) && numeric >= 0) {
        // Establecer valor de cuota inicial en el campo de valor
        valueInput.value = formatNumberValue(numeric);
        valueInput.readOnly = true;
        
        // Establecer "Cuota Inicial" en el campo de cuota y dejarlo readonly
        if (cuotaInput) {
            cuotaInput.value = '0';
            cuotaInput.readOnly = true;
        }
    } else {
        valueInput.value = '';
        valueInput.readOnly = false;
        // Limpiar campo de cuota y permitir edición
        if (cuotaInput) {
            cuotaInput.value = '';
            cuotaInput.readOnly = false;
        }
    }
}

/**
 * Autocalcula la cuota y el valor a pagar en Ingreso a Caja según la factura seleccionada:
 * - Usa plan del contrato asociado (numCuotas y mensualidad o calcula desde valorPlan - cuotaInicial)
 * - Cuenta cuotas ya pagadas (ingresos a caja activos vinculados a la factura)
 * - Establece la próxima cuota y el valor en los inputs y los bloquea como solo lectura
 */
function autoSetInstallmentFromInvoice(invoiceNumber) {
    const city = getSelectedCityCode();
    if (!city || !invoiceNumber) return;

    // Buscar la factura
    const invoicesRaw = localStorage.getItem('invoicesByCity');
    if (!invoicesRaw) return;
    const invoicesByCity = JSON.parse(invoicesRaw);
    const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
    const invoice = invoices.find(inv => {
        const invNum = String(inv.invoiceNumber || '').trim();
        const searchNum = String(invoiceNumber).trim();
        return invNum === searchNum || invNum.replace(/^0+/, '') === searchNum.replace(/^0+/, '');
    });
    if (!invoice) return;

    // Obtener plan del contrato
    let numCuotas = 0;
    let mensualidad = 0;
    let valorPlan = 0;
    let cuotaInicial = 0;
    let contract = null;

    try {
        const contractsRaw = localStorage.getItem(`contratos_${city}`);
        const contracts = contractsRaw ? JSON.parse(contractsRaw) : [];
        if (Array.isArray(contracts)) {
            contract = contracts.find(c => {
                const byId = String(c.id) === String(invoice.contractId);
                const byNum = String(c.contractNumber || c.numero || c.numeroContrato || '') === String(invoice.contractNumber || invoice.contractId || '');
                return byId || byNum;
            });
        }
        if (contract) {
            const pd = typeof contract.planData === 'string' ? JSON.parse(contract.planData) : contract.planData;
            if (pd) {
                numCuotas = Number(pd.numCuotas || pd.numeroCuotas || pd.cuotas || pd.totalCuotas || 0) || 0;
                mensualidad = Number(pd.mensualidad != null ? pd.mensualidad : 0) || 0;
                valorPlan = Number(pd.valorPlan != null ? pd.valorPlan : 0) || 0;
                cuotaInicial = Number(pd.cuotaInicial != null ? pd.cuotaInicial : 0) || 0;
            }
        }
        // Si no hay mensualidad, calcular desde plan
        if (!mensualidad && valorPlan && numCuotas) {
            const saldo = Math.max(0, valorPlan - (cuotaInicial || 0));
            mensualidad = Math.floor(saldo / numCuotas);
        }
        // Fallback desde la propia factura
        if (!valorPlan && invoice.value != null) {
            valorPlan = Number(invoice.value) || 0;
        }
    } catch (e) {
        console.warn('No fue posible leer plan del contrato:', e);
    }

    const productionRecordValue = (contract && contract.productionRecord) ||
        invoice.productionRecord ||
        invoice.ingreso ||
        '';
    setProductionRecordField(productionRecordValue);

    // Contar cuotas ya pagadas (ingresos a caja activos con esa factura)
    let pagadas = 0;
    try {
        const inflowsRaw = localStorage.getItem(`ingresosCaja_${city}`);
        const inflows = inflowsRaw ? JSON.parse(inflowsRaw) : [];
        if (Array.isArray(inflows)) {
            pagadas = inflows.filter(i => {
                const sameInvoice = String(i.invoiceNumber || '').replace(/^0+/, '') === String(invoiceNumber).replace(/^0+/, '');
                const isActive = (i.estado || 'activo') === 'activo';
                return sameInvoice && isActive;
            }).length;
        }
    } catch (e) {
        console.warn('No fue posible contar cuotas pagadas:', e);
    }

    const proximaCuota = pagadas + 1;

    // Mostrar info en el display de factura
    const invoiceDisplay = document.getElementById('invoiceNumberDisplay');
    if (invoiceDisplay && numCuotas) {
        const pendientes = Math.max(0, numCuotas - pagadas);
        invoiceDisplay.textContent = `Factura ${invoiceNumber} | Cuotas pagadas: ${pagadas}/${numCuotas} | Pendientes: ${pendientes}`;
        invoiceDisplay.style.display = 'block';
        invoiceDisplay.classList.remove('error-text');
        invoiceDisplay.classList.add('success-text');
    }

    const cuotaInput = document.getElementById('cuota');
    const valorInput = document.getElementById('inflowValue');

    // Si ya se pagaron todas, bloquear con mensaje y no proponer nueva cuota
    if (numCuotas && proximaCuota > numCuotas) {
        if (cuotaInput) {
            cuotaInput.value = formatNumberValue(numCuotas);
            cuotaInput.readOnly = true;
        }
        if (valorInput) {
            valorInput.value = formatNumberValue(0);
            valorInput.readOnly = true;
        }
        showNotification('Todas las cuotas de esta factura están pagadas.', 'info');
        return;
    }

    // Establecer próxima cuota y valor mensual (sugeridos, pero editables)
    if (cuotaInput) {
        cuotaInput.value = formatNumberValue(proximaCuota);
        cuotaInput.readOnly = false; // Permitir edición manual
        // Agregar evento para recalcular cuando cambie la cuota inicial
        cuotaInput.removeEventListener('blur', handleCuotaInicialChange);
        cuotaInput.addEventListener('blur', handleCuotaInicialChange);
    }
    if (valorInput) {
        // Solo establecer valor sugerido si está vacío
        if (!valorInput.value || parseFormattedNumber(valorInput.value) === 0) {
            valorInput.value = formatNumberValue(mensualidad || 0);
        }
        valorInput.readOnly = false; // Permitir edición manual del valor
    }
    
    // Cargar cuotas pendientes automáticamente
    setTimeout(() => {
        loadPendingInstallments();
    }, 100);
}

/**
 * Maneja el cambio en el campo de cuota inicial y recarga las cuotas
 */
function handleCuotaInicialChange() {
    loadPendingInstallments();
}

/**
 * Carga todas las cuotas pendientes y las muestra en la tabla con checkboxes
 */
function loadPendingInstallments() {
    const invoiceInput = document.getElementById('invoiceNumber');
    const invoiceSelect = document.getElementById('invoiceNumberSelect');
    const installmentsTableBody = document.getElementById('installmentsTableBody');
    const installmentsTableFooter = document.getElementById('installmentsTableFooter');
    const selectAllCheckbox = document.getElementById('selectAllInstallments');
    
    if (!installmentsTableBody) return;
    
    // Obtener número de factura
    let invoiceNumber = '';
    if (invoiceSelect && invoiceSelect.style.display !== 'none' && invoiceSelect.value) {
        const selectedValue = invoiceSelect.value.trim();
        const match = selectedValue.match(/Factura\s+(\d+)/i);
        invoiceNumber = match ? match[1] : selectedValue;
    } else if (invoiceInput) {
        invoiceNumber = invoiceInput.value.trim();
    }
    
    if (!invoiceNumber) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #6c757d;">Seleccione una factura para ver las cuotas pendientes</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        return;
    }
    
    // Obtener información del plan
    const planInfo = getPlanInfoFromInvoice(invoiceNumber);
    if (!planInfo) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #d32f2f;">No se pudo obtener la información del plan.</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        return;
    }
    
    let mensualidad = planInfo.mensualidad || 0;
    let numCuotas = planInfo.numCuotas || 0;
    const valorPlan = planInfo.valorPlan || 0;
    const cuotaInicialPlan = planInfo.cuotaInicial || 0;
    const cuotasPagadas = planInfo.cuotasPagadas || 0;
    
    // Calcular mensualidad si no existe
    if (!mensualidad && valorPlan && numCuotas) {
        const saldo = Math.max(0, valorPlan - (cuotaInicialPlan || 0));
        mensualidad = Math.floor(saldo / numCuotas);
    }
    
    if (!mensualidad || mensualidad <= 0 || !numCuotas || numCuotas <= 0) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #d32f2f;">No se pudo determinar el valor de la cuota o número de cuotas.</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        return;
    }
    
    // Calcular cuotas pendientes
    const cuotaInicial = cuotasPagadas + 1;
    const cuotasPendientes = [];
    
    // Obtener cuotas ya pagadas con sus valores para calcular saldos
    const city = getSelectedCityCode();
    const inflowsRaw = localStorage.getItem(`ingresosCaja_${city}`);
    const ingresosBancosRaw = localStorage.getItem(`ingresosBancos_${city}`);
    const inflows = inflowsRaw ? JSON.parse(inflowsRaw) : [];
    const ingresosBancos = ingresosBancosRaw ? JSON.parse(ingresosBancosRaw) : [];
    const pagosPorCuota = {};
    
    // Procesar ingresos de caja
    if (Array.isArray(inflows)) {
        inflows.forEach(i => {
            const sameInvoice = String(i.invoiceNumber || '').replace(/^0+/, '') === String(invoiceNumber).replace(/^0+/, '');
            const isActive = (i.estado || 'activo') === 'activo';
            if (sameInvoice && isActive) {
                // Si existe detalleCuotas, usar esa información (más precisa)
                if (i.detalleCuotas && Array.isArray(i.detalleCuotas)) {
                    i.detalleCuotas.forEach(detalle => {
                        const cuotaNum = parseInt(detalle.cuota) || 0;
                        if (cuotaNum > 0) {
                            if (!pagosPorCuota[cuotaNum]) {
                                pagosPorCuota[cuotaNum] = 0;
                            }
                            pagosPorCuota[cuotaNum] += parseFloat(detalle.valorPagar || 0);
                        }
                    });
                } else {
                    // Procesar el campo cuota que puede ser un string con múltiples cuotas separadas por comas
                    const cuotaField = String(i.cuota || '').trim();
                    if (cuotaField) {
                        const cuotasArray = cuotaField.split(',').map(c => parseInt(c.trim())).filter(c => c > 0);
                        const valorIngreso = parseFloat(i.valor || 0);
                        const valorPorCuota = cuotasArray.length > 0 ? valorIngreso / cuotasArray.length : valorIngreso;
                        
                        cuotasArray.forEach(cuotaNum => {
                            if (cuotaNum > 0) {
                                if (!pagosPorCuota[cuotaNum]) {
                                    pagosPorCuota[cuotaNum] = 0;
                                }
                                pagosPorCuota[cuotaNum] += valorPorCuota;
                            }
                        });
                    }
                }
            }
        });
    }
    
    // Procesar ingresos de bancos
    if (Array.isArray(ingresosBancos)) {
        ingresosBancos.forEach(ing => {
            try {
                if (ing.cashInflowData) {
                    const cashInflow = JSON.parse(ing.cashInflowData);
                    const sameInvoice = String(ing.invoiceNumber || cashInflow.invoiceNumber || '').replace(/^0+/, '') === String(invoiceNumber).replace(/^0+/, '');
                    const isActive = (ing.estado || cashInflow.estado || 'activo') === 'activo';
                    
                    if (sameInvoice && isActive && cashInflow.detalleCuotas && Array.isArray(cashInflow.detalleCuotas)) {
                        cashInflow.detalleCuotas.forEach(detalle => {
                            const cuotaNum = parseInt(detalle.cuota) || 0;
                            if (cuotaNum > 0) {
                                if (!pagosPorCuota[cuotaNum]) {
                                    pagosPorCuota[cuotaNum] = 0;
                                }
                                pagosPorCuota[cuotaNum] += parseFloat(detalle.valorPagar || 0);
                            }
                        });
                    } else if (sameInvoice && isActive && cashInflow.cuota) {
                        const cuotaField = String(cashInflow.cuota || '').trim();
                        if (cuotaField) {
                            const cuotasArray = cuotaField.split(',').map(c => parseInt(c.trim())).filter(c => c > 0);
                            const valorIngreso = parseFloat(ing.valor || cashInflow.valor || 0);
                            const valorPorCuota = cuotasArray.length > 0 ? valorIngreso / cuotasArray.length : valorIngreso;
                            
                            cuotasArray.forEach(cuotaNum => {
                                if (cuotaNum > 0) {
                                    if (!pagosPorCuota[cuotaNum]) {
                                        pagosPorCuota[cuotaNum] = 0;
                                    }
                                    pagosPorCuota[cuotaNum] += valorPorCuota;
                                }
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('Error procesando ingreso banco:', e);
            }
        });
    }
    
    // Crear lista de cuotas pendientes
    for (let i = cuotaInicial; i <= numCuotas; i++) {
        const pagado = pagosPorCuota[i] || 0;
        const saldo = Math.max(0, mensualidad - pagado);
        
        if (saldo > 0) {
            cuotasPendientes.push({
                cuota: i,
                valorCuota: mensualidad,
                valorPagado: pagado,
                saldo: saldo
            });
        }
    }
    
    if (cuotasPendientes.length === 0) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #6c757d;">Todas las cuotas están pagadas</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        return;
    }
    
    // Renderizar tabla
    installmentsTableBody.innerHTML = '';
    cuotasPendientes.forEach(inst => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" data-cuota="${inst.cuota}" data-valor-cuota="${inst.valorCuota}" data-saldo="${inst.saldo}" 
                       onchange="distributeValueToSelectedInstallments()" style="cursor: pointer;">
            </td>
            <td>${inst.cuota}/${numCuotas}</td>
            <td>${formatNumberValue(inst.valorCuota)}</td>
            <td>
                <input type="text" class="valor-pagar-input numeric-input" data-cuota="${inst.cuota}" 
                       data-valor-cuota="${inst.valorCuota}" data-saldo="${inst.saldo}"
                       value="0" style="width: 100%; border: 1px solid #ddd; padding: 4px; text-align: right;"
                       onchange="handleValorPagarChange(this)" onblur="handleValorPagarBlur(this)">
            </td>
            <td>${formatNumberValue(inst.saldo)}</td>
            <td>
                <span class="status-badge" style="font-size: 0.85em; background-color: #d1ecf1; color: #0c5460;">PENDIENTE</span>
            </td>
        `;
        installmentsTableBody.appendChild(row);
    });
    
    // Guardar información de cuotas pendientes
    window.pendingInstallments = cuotasPendientes;
    window.planInfo = { mensualidad, numCuotas, valorPlan };
    
    // Inicializar formato numérico en los inputs de valor a pagar
    initializeValorPagarInputs();
    
    // Distribuir valor si hay uno ingresado
    distributeValueToSelectedInstallments();
    
    if (installmentsTableFooter) installmentsTableFooter.style.display = '';
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
}

/**
 * Maneja el cambio en un checkbox de cuota
 */
function handleInstallmentCheckboxChange(checkbox) {
    const cuota = parseInt(checkbox.dataset.cuota);
    const valorPagarInput = document.querySelector(`.valor-pagar-input[data-cuota="${cuota}"]`);
    
    if (!checkbox.checked) {
        // Si se deselecciona, limpiar el valor
        if (valorPagarInput) {
            valorPagarInput.value = '0';
            formatNumericInput(valorPagarInput);
        }
    }
    
    // Recalcular distribución
    distributeValueToSelectedInstallments();
}

/**
 * Maneja el cambio en un input de valor a pagar
 */
function handleValorPagarChange(input) {
    const valor = parseFormattedNumber(input.value) || 0;
    const saldo = parseFloat(input.dataset.saldo || 0);
    
    // Validar que no exceda el saldo
    if (valor > saldo) {
        input.value = formatNumberValue(saldo);
        showNotification(`El valor no puede exceder el saldo de ${formatNumberValue(saldo)}`, 'warning');
    }
    
    // Actualizar checkbox si hay valor
    const cuota = parseInt(input.dataset.cuota);
    const checkbox = document.querySelector(`input[type="checkbox"][data-cuota="${cuota}"]`);
    if (checkbox) {
        checkbox.checked = valor > 0;
    }
    
    // Actualizar estado y recalcular
    updateInstallmentRowState(cuota);
    updateInstallmentsTotals();
    updateCalculatedInstallments();
}

/**
 * Maneja el blur en un input de valor a pagar
 */
function handleValorPagarBlur(input) {
    formatNumericInput(input);
    handleValorPagarChange(input);
}

/**
 * Inicializa el formato numérico en los inputs de valor a pagar
 */
function initializeValorPagarInputs() {
    document.querySelectorAll('.valor-pagar-input').forEach(input => {
        // Formatear en tiempo real
        input.addEventListener('input', function() {
            const cursorPosition = this.selectionStart;
            const originalValue = this.value;
            const numbersOnly = this.value.replace(/[^\d]/g, '');
            
            if (!numbersOnly) {
                this.value = '0';
                return;
            }
            
            const numValue = parseInt(numbersOnly, 10);
            if (!isNaN(numValue)) {
                const formatted = new Intl.NumberFormat('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(numValue);
                
                this.value = formatted;
                
                // Ajustar cursor
                const beforeCursor = originalValue.substring(0, cursorPosition);
                const digitsBeforeCursor = beforeCursor.replace(/[^\d]/g, '').length;
                let digitsFound = 0;
                let newCursorPosition = formatted.length;
                for (let i = 0; i < formatted.length; i++) {
                    if (formatted[i] >= '0' && formatted[i] <= '9') {
                        digitsFound++;
                        if (digitsFound === digitsBeforeCursor) {
                            newCursorPosition = i + 1;
                            break;
                        }
                    }
                }
                this.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        });
    });
}

/**
 * Actualiza el estado visual de una fila de cuota
 */
function updateInstallmentRowState(cuota) {
    const row = document.querySelector(`input[type="checkbox"][data-cuota="${cuota}"]`)?.closest('tr');
    if (!row) return;
    
    const valorPagarInput = row.querySelector('.valor-pagar-input');
    const estadoCell = row.querySelector('td:last-child');
    const valorPagar = valorPagarInput ? parseFormattedNumber(valorPagarInput.value) : 0;
    const saldo = valorPagarInput ? parseFloat(valorPagarInput.dataset.saldo || 0) : 0;
    
    if (estadoCell) {
        if (valorPagar === 0) {
            estadoCell.innerHTML = '<span class="status-badge" style="font-size: 0.85em; background-color: #d1ecf1; color: #0c5460;">PENDIENTE</span>';
            row.style.backgroundColor = '';
        } else if (valorPagar < saldo) {
            estadoCell.innerHTML = '<span class="status-badge warning" style="font-size: 0.85em;">PARCIAL</span>';
            row.style.backgroundColor = '#fff3cd';
        } else {
            estadoCell.innerHTML = '<span class="status-badge success" style="font-size: 0.85em;">COMPLETA</span>';
            row.style.backgroundColor = '';
        }
    }
}

/**
 * Actualiza las cuotas calculadas desde los valores en los inputs
 */
function updateCalculatedInstallments() {
    const installments = [];
    
    document.querySelectorAll('.valor-pagar-input').forEach(input => {
        const valorPagar = parseFormattedNumber(input.value) || 0;
        if (valorPagar > 0) {
            const cuota = parseInt(input.dataset.cuota);
            const valorCuota = parseFloat(input.dataset.valorCuota || 0);
            const saldo = parseFloat(input.dataset.saldo || 0);
            
            installments.push({
                cuota: cuota,
                valorCuota: valorCuota,
                valorPagar: valorPagar,
                saldo: saldo,
                esParcial: valorPagar < saldo
            });
        }
    });
    
    // Ordenar por número de cuota
    installments.sort((a, b) => a.cuota - b.cuota);
    
    window.calculatedInstallments = installments;
}

/**
 * Distribuye el valor total ingresado entre las cuotas seleccionadas
 */
function distributeValueToSelectedInstallments() {
    const valorInput = document.getElementById('inflowValue');
    const installmentsTableBody = document.getElementById('installmentsTableBody');
    const installmentsTableFooter = document.getElementById('installmentsTableFooter');
    
    if (!valorInput || !installmentsTableBody) return;
    
    const valorTotal = parseFormattedNumber(valorInput.value) || 0;
    
    if (valorTotal <= 0) {
        // Limpiar todos los valores si no hay valor total
        document.querySelectorAll('.valor-pagar-input').forEach(input => {
            input.value = '0';
            formatNumericInput(input);
        });
        document.querySelectorAll('input[type="checkbox"][data-cuota]').forEach(cb => {
            cb.checked = false;
        });
        document.querySelectorAll('#installmentsTableBody tr').forEach(row => {
            const checkbox = row.querySelector('input[type="checkbox"][data-cuota]');
            if (checkbox) {
                updateInstallmentRowState(parseInt(checkbox.dataset.cuota));
            }
        });
        updateInstallmentsTotals();
        updateCalculatedInstallments();
        return;
    }
    
    // Obtener cuotas seleccionadas
    let selectedCheckboxes = Array.from(document.querySelectorAll('#installmentsTableBody input[type="checkbox"][data-cuota]:checked'));
    
    // Si no hay cuotas seleccionadas pero hay valor, seleccionar automáticamente desde la primera
    if (selectedCheckboxes.length === 0 && valorTotal > 0) {
        const allCheckboxes = Array.from(document.querySelectorAll('#installmentsTableBody input[type="checkbox"][data-cuota]'));
        if (allCheckboxes.length > 0) {
            // Seleccionar automáticamente las cuotas necesarias
            let valorAcumulado = 0;
            for (const checkbox of allCheckboxes) {
                const saldo = parseFloat(checkbox.dataset.saldo || 0);
                if (valorAcumulado < valorTotal) {
                    checkbox.checked = true;
                    selectedCheckboxes.push(checkbox);
                    valorAcumulado += saldo;
                } else {
                    break;
                }
            }
        }
    }
    
    if (selectedCheckboxes.length === 0) {
        updateInstallmentsTotals();
        updateCalculatedInstallments();
        return;
    }
    
    // Ordenar por número de cuota
    selectedCheckboxes.sort((a, b) => {
        return parseInt(a.dataset.cuota) - parseInt(b.dataset.cuota);
    });
    
    // Distribuir valor
    let valorRestante = valorTotal;
    const installments = [];
    
    selectedCheckboxes.forEach((checkbox, index) => {
        const cuota = parseInt(checkbox.dataset.cuota);
        const valorCuota = parseFloat(checkbox.dataset.valorCuota);
        const saldo = parseFloat(checkbox.dataset.saldo);
        
        // Calcular valor a pagar para esta cuota
        let valorPagar = 0;
        if (index === selectedCheckboxes.length - 1) {
            // Última cuota seleccionada: usar todo el valor restante
            valorPagar = Math.min(valorRestante, saldo);
        } else {
            // Cuotas intermedias: pagar el saldo completo o el valor restante, lo que sea menor
            valorPagar = Math.min(valorRestante, saldo);
        }
        
        valorPagar = Math.max(0, Math.min(valorPagar, saldo)); // Asegurar que no exceda el saldo
        
        installments.push({
            cuota: cuota,
            valorCuota: valorCuota,
            valorPagar: valorPagar,
            saldo: saldo,
            esParcial: valorPagar < saldo
        });
        
        valorRestante -= valorPagar;
    });
    
    // Si sobra valor, ajustar la última cuota seleccionada
    if (valorRestante > 0 && installments.length > 0) {
        const lastInst = installments[installments.length - 1];
        const ajustePosible = lastInst.saldo - lastInst.valorPagar;
        if (ajustePosible > 0) {
            const ajuste = Math.min(valorRestante, ajustePosible);
            lastInst.valorPagar += ajuste;
            lastInst.esParcial = lastInst.valorPagar < lastInst.saldo;
            valorRestante -= ajuste;
        }
    }
    
    // Si aún sobra valor, mostrar advertencia
    if (valorRestante > 0) {
        showNotification(`El valor ingresado excede el total de las cuotas seleccionadas. Sobra: ${formatNumberValue(valorRestante)}`, 'warning');
    }
    
    // Actualizar tabla
    installments.forEach(inst => {
        const valorPagarInput = document.querySelector(`.valor-pagar-input[data-cuota="${inst.cuota}"]`);
        
        if (valorPagarInput) {
            valorPagarInput.value = formatNumberValue(inst.valorPagar);
            
            // Actualizar estado de la fila
            updateInstallmentRowState(inst.cuota);
        }
    });
    
    // Limpiar cuotas no seleccionadas
    document.querySelectorAll('#installmentsTableBody input[type="checkbox"][data-cuota]:not(:checked)').forEach(checkbox => {
        const cuota = parseInt(checkbox.dataset.cuota);
        const valorPagarInput = document.querySelector(`.valor-pagar-input[data-cuota="${cuota}"]`);
        if (valorPagarInput) {
            valorPagarInput.value = '0';
            formatNumericInput(valorPagarInput);
        }
        updateInstallmentRowState(cuota);
    });
    
    // Actualizar cuotas calculadas y totales
    updateCalculatedInstallments();
    updateInstallmentsTotals();
}

/**
 * Actualiza los totales en el footer de la tabla
 */
function updateInstallmentsTotals() {
    const installmentsTableFooter = document.getElementById('installmentsTableFooter');
    if (!installmentsTableFooter) return;
    
    let totalCuotas = 0;
    let totalPagar = 0;
    let totalSaldo = 0;
    
    document.querySelectorAll('#installmentsTableBody tr').forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"][data-cuota]');
        if (checkbox) {
            const valorCuota = parseFloat(checkbox.dataset.valorCuota || 0);
            const saldo = parseFloat(checkbox.dataset.saldo || 0);
            const valorPagarInput = row.querySelector('.valor-pagar-input');
            const valorPagar = valorPagarInput ? parseFormattedNumber(valorPagarInput.value) : 0;
            
            totalCuotas += valorCuota;
            totalPagar += valorPagar;
            totalSaldo += saldo;
        }
    });
    
    const totalCuotasCell = document.getElementById('totalCuotasValue');
    const totalPagarCell = document.getElementById('totalPagarValue');
    const totalSaldoCell = document.getElementById('totalSaldoValue');
    
    if (totalCuotasCell) totalCuotasCell.textContent = formatNumberValue(totalCuotas);
    if (totalPagarCell) totalPagarCell.textContent = formatNumberValue(totalPagar);
    if (totalSaldoCell) totalSaldoCell.textContent = formatNumberValue(totalSaldo);
}

/**
 * Calcula automáticamente la distribución de cuotas basándose en el valor total ingresado
 * y la información del plan de la factura seleccionada
 */
function calculateInstallmentsFromValue() {
    const valorInput = document.getElementById('inflowValue');
    const invoiceInput = document.getElementById('invoiceNumber');
    const invoiceSelect = document.getElementById('invoiceNumberSelect');
    const cuotaInicialInput = document.getElementById('cuota');
    const installmentsTableBody = document.getElementById('installmentsTableBody');
    const installmentsTableFooter = document.getElementById('installmentsTableFooter');
    
    if (!valorInput || !installmentsTableBody) return;
    
    // Obtener valor ingresado
    const valorTotal = parseFormattedNumber(valorInput.value);
    if (!valorTotal || valorTotal <= 0) {
        // Limpiar tabla si no hay valor
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #6c757d;">Ingrese el valor total para calcular las cuotas</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        return;
    }
    
    // Obtener número de factura (del select si existe, sino del input)
    let invoiceNumber = '';
    if (invoiceSelect && invoiceSelect.style.display !== 'none' && invoiceSelect.value) {
        // Si hay select visible, obtener el valor del select
        const selectedValue = invoiceSelect.value.trim();
        // El valor del select puede ser "Factura X - Contrato Y", extraer solo el número de factura
        // También puede ser solo el número de factura
        const match = selectedValue.match(/Factura\s+(\d+)/i);
        if (match) {
            invoiceNumber = match[1];
        } else {
            // Si no hay match, puede ser que el valor sea directamente el número
            invoiceNumber = selectedValue;
        }
    } else if (invoiceInput) {
        invoiceNumber = invoiceInput.value.trim();
    }
    
    console.log('Calculando cuotas - Factura:', invoiceNumber, 'Valor:', valorTotal);
    
    if (!invoiceNumber) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #6c757d;">Seleccione una factura primero</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        return;
    }
    
    // Obtener información del plan
    const planInfo = getPlanInfoFromInvoice(invoiceNumber);
    console.log('calculateInstallmentsFromValue: planInfo recibido', planInfo);
    
    if (!planInfo) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #d32f2f;">No se pudo obtener la información del plan. Verifique que la factura tenga un contrato y plan asociado.</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        return;
    }
    
    // Validar que tengamos al menos mensualidad o numCuotas
    if ((!planInfo.mensualidad || planInfo.mensualidad <= 0) && (!planInfo.numCuotas || planInfo.numCuotas <= 0)) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #d32f2f;">El plan no tiene información de cuotas o mensualidad. Verifique el contrato asociado.</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        return;
    }
    
    let mensualidad = planInfo.mensualidad || 0;
    let numCuotas = planInfo.numCuotas || 0;
    const valorPlan = planInfo.valorPlan || 0;
    const cuotaInicialPlan = planInfo.cuotaInicial || 0;
    const cuotasPagadas = planInfo.cuotasPagadas || 0;
    const cuotaInicialManual = cuotaInicialInput ? parseFormattedNumber(cuotaInicialInput.value) : null;
    
    // Si no hay mensualidad pero hay valorPlan y numCuotas, calcular
    if (!mensualidad && valorPlan && numCuotas) {
        const saldo = Math.max(0, valorPlan - (cuotaInicialPlan || 0));
        mensualidad = Math.floor(saldo / numCuotas);
        console.log('calculateInstallmentsFromValue: Mensualidad calculada', mensualidad);
    }
    
    // Si aún no hay mensualidad, no podemos continuar
    if (!mensualidad || mensualidad <= 0) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #d32f2f;">No se pudo determinar el valor de la cuota. Verifique que el plan tenga mensualidad o valor total y número de cuotas.</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        return;
    }
    
    // Si no hay numCuotas, usar un número grande para permitir pagos
    if (!numCuotas || numCuotas <= 0) {
        numCuotas = 999; // Número grande para permitir pagos sin límite
        console.log('calculateInstallmentsFromValue: numCuotas no definido, usando 999');
    }
    
    // Determinar cuota inicial
    let cuotaInicial = cuotaInicialManual || (cuotasPagadas + 1);
    
    // Validar que la cuota inicial no exceda el número total de cuotas
    if (numCuotas < 999 && cuotaInicial > numCuotas) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #d32f2f;">Todas las cuotas de esta factura están pagadas</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        return;
    }
    
    // Calcular distribución de cuotas
    const installments = [];
    let valorRestante = valorTotal;
    let cuotaActual = cuotaInicial;
    
    while (valorRestante > 0 && cuotaActual <= numCuotas) {
        const valorCuota = Math.min(valorRestante, mensualidad);
        installments.push({
            cuota: cuotaActual,
            valorCuota: mensualidad,
            valorPagar: valorCuota,
            esParcial: valorCuota < mensualidad
        });
        
        valorRestante -= valorCuota;
        cuotaActual++;
    }
    
    // Si sobra valor, mostrar advertencia
    if (valorRestante > 0) {
        showNotification(`El valor ingresado excede el total de cuotas pendientes. Sobra: ${formatNumberValue(valorRestante)}`, 'warning');
    }
    
    // Renderizar tabla de cuotas
    if (installments.length === 0) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #6c757d;">No hay cuotas para distribuir</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        return;
    }
    
    // Limpiar tabla
    installmentsTableBody.innerHTML = '';
    
    // Calcular totales
    let totalCuotas = 0;
    let totalPagar = 0;
    
    // Renderizar filas
    installments.forEach(inst => {
        totalCuotas += inst.valorCuota;
        totalPagar += inst.valorPagar;
        
        const row = document.createElement('tr');
        row.style.backgroundColor = inst.esParcial ? '#fff3cd' : '';
        row.innerHTML = `
            <td>${inst.cuota}/${numCuotas}</td>
            <td>${formatNumberValue(inst.valorCuota)}</td>
            <td style="font-weight: ${inst.esParcial ? 'bold' : 'normal'};">
                ${formatNumberValue(inst.valorPagar)}
                ${inst.esParcial ? '<span style="color: #856404; font-size: 0.85em;"> (Parcial)</span>' : ''}
            </td>
            <td>
                <span class="status-badge ${inst.esParcial ? 'warning' : 'success'}" style="font-size: 0.85em;">
                    ${inst.esParcial ? 'PARCIAL' : 'COMPLETA'}
                </span>
            </td>
        `;
        installmentsTableBody.appendChild(row);
    });
    
    // Mostrar totales
    if (installmentsTableFooter) {
        installmentsTableFooter.style.display = '';
        const totalCuotasCell = document.getElementById('totalCuotasValue');
        const totalPagarCell = document.getElementById('totalPagarValue');
        if (totalCuotasCell) totalCuotasCell.textContent = formatNumberValue(totalCuotas);
        if (totalPagarCell) totalPagarCell.textContent = formatNumberValue(totalPagar);
    }
    
    // Guardar información de cuotas calculadas para usar al guardar
    window.calculatedInstallments = installments;
}

/**
 * ========================================
 * FUNCIÓN: getPlanInfoFromInvoice()
 * ========================================
 * 
 * DESCRIPCIÓN:
 * Obtiene la información completa del plan de pago asociado a una factura.
 * Busca la factura, luego el contrato asociado, y finalmente el plan del contrato.
 * 
 * PROCESO:
 * 1. Busca la factura en localStorage por número
 * 2. Busca el contrato asociado a la factura
 * 3. Obtiene el planData del contrato
 * 4. Si no hay planData, busca el plan en planesData usando planCode o nombre
 * 5. Extrae: numCuotas, mensualidad, valorPlan, cuotaInicial
 * 6. Calcula cuotas pagadas contando ingresos activos de la factura
 * 
 * FALLBACKS:
 * - Si numCuotas es 0, intenta usar mesesAsesoria del plan
 * - Si mensualidad es igual a valorPlan, recalcula basándose en numCuotas
 * - Si no encuentra planData, busca en campos directos de factura/contrato
 * 
 * NOTA PARA BACKEND:
 * - Actualmente obtiene datos de localStorage
 * - CONEXIÓN BACKEND: Reemplazar por llamadas API:
 *   * GET /api/invoices/{invoiceNumber}?city={city}
 *   * GET /api/contracts/{contractId}
 *   * GET /api/plans/{planCode}
 *   * GET /api/cash-inflows?invoice={invoiceNumber}&city={city} (para calcular cuotas pagadas)
 * 
 * @param {string} invoiceNumber - Número de factura
 * @returns {Object|null} - Objeto con {numCuotas, mensualidad, valorPlan, cuotaInicial, cuotasPagadas} o null si no se encuentra
 */
function getPlanInfoFromInvoice(invoiceNumber) {
    const city = getSelectedCityCode();
    if (!city || !invoiceNumber) {
        console.log('getPlanInfoFromInvoice: Falta city o invoiceNumber', { city, invoiceNumber });
        return null;
    }
    
    try {
        // Buscar la factura
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            console.log('getPlanInfoFromInvoice: No hay invoicesByCity en localStorage');
            return null;
        }
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        // Normalizar el número de factura a buscar (remover ceros a la izquierda)
        const searchNumNormalized = String(invoiceNumber).trim().replace(/^0+/, '') || String(invoiceNumber).trim();
        const invoice = invoices.find(inv => {
            const invNum = String(inv.invoiceNumber || '').trim();
            const invNumNormalized = invNum.replace(/^0+/, '') || invNum;
            // Comparar tanto con ceros como sin ceros
            return invNum === String(invoiceNumber).trim() || 
                   invNumNormalized === searchNumNormalized ||
                   invNum === searchNumNormalized ||
                   invNumNormalized === String(invoiceNumber).trim();
        });
        
        if (!invoice) {
            console.log('getPlanInfoFromInvoice: Factura no encontrada', invoiceNumber);
            return null;
        }
        
        console.log('getPlanInfoFromInvoice: Factura encontrada', invoice);
        
        // Obtener plan del contrato
        let numCuotas = 0;
        let mensualidad = 0;
        let valorPlan = 0;
        let cuotaInicial = 0;
        let contract = null;
        
        const contractsRaw = localStorage.getItem(`contratos_${city}`);
        const contracts = contractsRaw ? JSON.parse(contractsRaw) : [];
        
        if (Array.isArray(contracts)) {
            // Buscar contrato por múltiples métodos
            contract = contracts.find(c => {
                // Por ID del contrato
                const byId = String(c.id) === String(invoice.contractId);
                // Por número de contrato
                const contractNum = String(c.contractNumber || c.numero || c.numeroContrato || '').trim();
                const invoiceContractNum = String(invoice.contractNumber || invoice.contractId || '').trim();
                const byNum = contractNum && (contractNum === invoiceContractNum || 
                    contractNum.replace(/^0+/, '') === invoiceContractNum.replace(/^0+/, ''));
                // Por número de factura en el contrato (algunos contratos tienen facturas asociadas)
                const byInvoiceInContract = c.invoices && Array.isArray(c.invoices) && 
                    c.invoices.some(inv => String(inv.invoiceNumber || '').replace(/^0+/, '') === String(invoiceNumber).replace(/^0+/, ''));
                
                return byId || byNum || byInvoiceInContract;
            });
        }
        
        if (contract) {
            console.log('getPlanInfoFromInvoice: Contrato encontrado', contract);
            console.log('getPlanInfoFromInvoice: Campos del contrato', Object.keys(contract));
            console.log('getPlanInfoFromInvoice: planCode', contract.planCode, 'plan', contract.plan);
            console.log('getPlanInfoFromInvoice: Contrato completo', JSON.stringify(contract, null, 2));
            
            let pd = typeof contract.planData === 'string' ? JSON.parse(contract.planData) : contract.planData;
            
            // Si no hay planData, buscar el plan usando planCode o plan (nombre)
            if (!pd || typeof pd !== 'object') {
                console.log('getPlanInfoFromInvoice: planData no encontrado, buscando plan en planesData...');
                
                try {
                    const planesData = localStorage.getItem('planesData');
                    if (planesData) {
                        const planes = JSON.parse(planesData);
                        
                        // Buscar por planCode primero
                        if (contract.planCode) {
                            console.log('getPlanInfoFromInvoice: Buscando plan por código:', contract.planCode);
                            pd = planes[contract.planCode] || 
                                 Object.values(planes).find(p => 
                                     String(p.codigo || '').trim() === String(contract.planCode).trim()
                                 );
                        }
                        
                        // Si no se encontró, buscar por nombre del plan
                        if (!pd && contract.plan) {
                            console.log('getPlanInfoFromInvoice: Buscando plan por nombre:', contract.plan);
                            pd = Object.values(planes).find(p => {
                                const nombre = String(p.nombre || '').trim().toLowerCase();
                                const searchName = String(contract.plan).trim().toLowerCase();
                                return nombre === searchName || 
                                       nombre.includes(searchName) || 
                                       searchName.includes(nombre);
                            });
                        }
                        
                        if (pd) {
                            console.log('getPlanInfoFromInvoice: Plan encontrado en planesData', pd);
                        } else {
                            console.log('getPlanInfoFromInvoice: Plan no encontrado en planesData');
                        }
                    }
                } catch (e) {
                    console.error('getPlanInfoFromInvoice: Error buscando plan en planesData:', e);
                }
            }
            
            if (pd && typeof pd === 'object') {
                console.log('getPlanInfoFromInvoice: planData encontrado', pd);
                console.log('getPlanInfoFromInvoice: Campos del planData', Object.keys(pd));
                console.log('getPlanInfoFromInvoice: planData completo', JSON.stringify(pd, null, 2));
                
                // Buscar número de cuotas con diferentes nombres posibles
                numCuotas = Number(
                    pd.numCuotas || 
                    pd.numeroCuotas || 
                    pd.cuotas || 
                    pd.totalCuotas || 
                    pd.cantidadCuotas ||
                    pd.numeroDeCuotas ||
                    pd.numero_cuotas ||
                    pd.cantidad_cuotas ||
                    pd.total_cuotas ||
                    0
                ) || 0;
                
                // Si numCuotas es 0, intentar usar mesesAsesoria como número de cuotas
                if (!numCuotas && pd.mesesAsesoria) {
                    numCuotas = Number(pd.mesesAsesoria) || 0;
                    if (numCuotas) {
                        console.log('getPlanInfoFromInvoice: Usando mesesAsesoria como numCuotas', numCuotas);
                    }
                }
                
                // Buscar mensualidad
                mensualidad = Number(
                    pd.mensualidad != null ? pd.mensualidad : (
                        pd.valorCuota || 
                        pd.cuota || 
                        pd.valor_cuota ||
                        pd.valorMensual ||
                        pd.valor_mensual ||
                        0
                    )
                ) || 0;
                
                // Si la mensualidad es igual al valorPlan, probablemente está mal configurada
                // Recalcular si tenemos numCuotas y valorPlan
                if (mensualidad && valorPlan && mensualidad === valorPlan && numCuotas > 0) {
                    const saldo = Math.max(0, valorPlan - (cuotaInicial || 0));
                    if (saldo > 0) {
                        mensualidad = Math.floor(saldo / numCuotas);
                        console.log('getPlanInfoFromInvoice: Mensualidad recalculada (era igual a valorPlan)', mensualidad);
                    } else if (cuotaInicial === valorPlan && numCuotas > 0) {
                        // Si la cuota inicial es igual al valorPlan pero hay numCuotas (mesesAsesoria),
                        // calcular la mensualidad como valorPlan / numCuotas para permitir pagos parciales
                        mensualidad = Math.floor(valorPlan / numCuotas);
                        console.log('getPlanInfoFromInvoice: Plan con cuota inicial completa pero con mesesAsesoria, calculando mensualidad como valorPlan/numCuotas', mensualidad);
                    }
                }
                
                // Buscar valor del plan
                valorPlan = Number(
                    pd.valorPlan != null ? pd.valorPlan : (
                        pd.valorTotal || 
                        pd.total || 
                        pd.valor_total ||
                        pd.valor ||
                        pd.precio ||
                        0
                    )
                ) || 0;
                
                // Buscar cuota inicial
                cuotaInicial = Number(
                    pd.cuotaInicial != null ? pd.cuotaInicial : (
                        pd.cuotaInicialValor || 
                        pd.valorInicial || 
                        pd.cuota_inicial ||
                        pd.valor_inicial ||
                        pd.inicial ||
                        0
                    )
                ) || 0;
                
                console.log('getPlanInfoFromInvoice: Datos extraídos', { numCuotas, mensualidad, valorPlan, cuotaInicial });
            } else {
                console.log('getPlanInfoFromInvoice: planData no válido o vacío después de buscar', pd);
            }
        } else {
            console.log('getPlanInfoFromInvoice: Contrato no encontrado. Invoice:', {
                contractId: invoice.contractId,
                contractNumber: invoice.contractNumber,
                totalContracts: contracts.length
            });
            
            // Fallback: Intentar obtener información del plan directamente de la factura
            if (invoice.planData) {
                try {
                    let pd = typeof invoice.planData === 'string' ? JSON.parse(invoice.planData) : invoice.planData;
                    if (pd && typeof pd === 'object') {
                        numCuotas = Number(pd.numCuotas || pd.numeroCuotas || pd.cuotas || pd.totalCuotas || pd.cantidadCuotas || 0) || 0;
                        mensualidad = Number(pd.mensualidad != null ? pd.mensualidad : (pd.valorCuota || pd.cuota || 0)) || 0;
                        valorPlan = Number(pd.valorPlan != null ? pd.valorPlan : (pd.valorTotal || pd.total || 0)) || 0;
                        cuotaInicial = Number(pd.cuotaInicial != null ? pd.cuotaInicial : (pd.cuotaInicialValor || pd.valorInicial || 0)) || 0;
                        console.log('getPlanInfoFromInvoice: Datos obtenidos de factura.planData', { numCuotas, mensualidad, valorPlan, cuotaInicial });
                    }
                } catch (e) {
                    console.error('getPlanInfoFromInvoice: Error parseando planData de factura:', e);
                }
            }
            
            // Fallback: Intentar obtener información de campos directos de la factura
            if (!numCuotas && invoice.numCuotas) {
                numCuotas = Number(invoice.numCuotas) || 0;
            }
            if (!mensualidad && invoice.mensualidad) {
                mensualidad = Number(invoice.mensualidad) || 0;
            }
            if (!valorPlan && invoice.valorPlan) {
                valorPlan = Number(invoice.valorPlan) || 0;
            }
            if (!cuotaInicial && invoice.cuotaInicial) {
                cuotaInicial = Number(invoice.cuotaInicial) || 0;
            }
        }
        
        // Fallback: Si no hay mensualidad pero hay valorPlan y numCuotas, calcular
        if (!mensualidad && valorPlan && numCuotas) {
            const saldo = Math.max(0, valorPlan - (cuotaInicial || 0));
            if (saldo > 0 && numCuotas > 0) {
                mensualidad = Math.floor(saldo / numCuotas);
                console.log('getPlanInfoFromInvoice: Mensualidad calculada desde plan', mensualidad);
            }
        }
        
        // Fallback adicional: Si no hay planData pero la factura tiene valor, intentar usar ese
        if (!valorPlan && invoice.value != null) {
            valorPlan = Number(invoice.value) || 0;
            console.log('getPlanInfoFromInvoice: Usando valor de factura como fallback', valorPlan);
        }
        
        // Fallback final: Si aún no tenemos numCuotas, intentar obtenerlo del contrato o factura
        if (!numCuotas && contract) {
            numCuotas = Number(
                contract.numCuotas || 
                contract.numeroCuotas || 
                contract.cuotas || 
                contract.totalCuotas ||
                contract.cantidadCuotas ||
                contract.numeroDeCuotas ||
                0
            ) || 0;
            if (numCuotas) {
                console.log('getPlanInfoFromInvoice: numCuotas obtenido del contrato', numCuotas);
            }
        }
        if (!numCuotas && invoice.numCuotas) {
            numCuotas = Number(invoice.numCuotas) || 0;
            if (numCuotas) {
                console.log('getPlanInfoFromInvoice: numCuotas obtenido de la factura', numCuotas);
            }
        }
        
        // Si aún no tenemos numCuotas pero tenemos valorPlan y mensualidad, calcular
        if (!numCuotas && valorPlan && mensualidad && mensualidad > 0) {
            const saldo = Math.max(0, valorPlan - (cuotaInicial || 0));
            numCuotas = Math.floor(saldo / mensualidad);
            if (numCuotas > 0) {
                console.log('getPlanInfoFromInvoice: numCuotas calculado desde valorPlan y mensualidad', numCuotas);
            }
        }
        
        // Contar cuotas ya pagadas (cuotas únicas)
        const cuotasUnicasPagadas = new Set();
        const inflowsRaw = localStorage.getItem(`ingresosCaja_${city}`);
        const inflows = inflowsRaw ? JSON.parse(inflowsRaw) : [];
        if (Array.isArray(inflows)) {
            inflows.forEach(i => {
                const sameInvoice = String(i.invoiceNumber || '').replace(/^0+/, '') === String(invoiceNumber).replace(/^0+/, '');
                const isActive = (i.estado || 'activo') === 'activo';
                if (sameInvoice && isActive) {
                    // Si existe detalleCuotas, usar esa información
                    if (i.detalleCuotas && Array.isArray(i.detalleCuotas)) {
                        i.detalleCuotas.forEach(detalle => {
                            const cuotaNum = parseInt(detalle.cuota) || 0;
                            if (cuotaNum > 0) {
                                cuotasUnicasPagadas.add(cuotaNum);
                            }
                        });
                    } else {
                        // Procesar el campo cuota que puede ser un string con múltiples cuotas separadas por comas
                        const cuotaField = String(i.cuota || '');
                        if (cuotaField.includes(',')) {
                            cuotaField.split(',').forEach(c => {
                                const cuotaNum = parseInt(c.trim());
                                if (!isNaN(cuotaNum) && cuotaNum > 0) {
                                    cuotasUnicasPagadas.add(cuotaNum);
                                }
                            });
                        } else {
                            const cuotaNum = parseInt(cuotaField);
                            if (!isNaN(cuotaNum) && cuotaNum > 0) {
                                cuotasUnicasPagadas.add(cuotaNum);
                            }
                        }
                    }
                }
            });
        }
        const cuotasPagadas = cuotasUnicasPagadas.size;
        
        const result = {
            numCuotas,
            mensualidad,
            valorPlan,
            cuotaInicial,
            cuotasPagadas
        };
        
        console.log('getPlanInfoFromInvoice: Resultado final', result);
        
        return result;
    } catch (e) {
        console.error('Error al obtener información del plan:', e);
        return null;
    }
}

/**
 * Carga todas las cuotas pendientes y las muestra en la tabla con checkboxes
 */
function loadPendingInstallments() {
    const invoiceInput = document.getElementById('invoiceNumber');
    const invoiceSelect = document.getElementById('invoiceNumberSelect');
    const installmentsTableBody = document.getElementById('installmentsTableBody');
    const installmentsTableFooter = document.getElementById('installmentsTableFooter');
    const selectAllCheckbox = document.getElementById('selectAllInstallments');
    
    if (!installmentsTableBody) return;
    
    // Obtener número de factura
    let invoiceNumber = '';
    if (invoiceSelect && invoiceSelect.style.display !== 'none' && invoiceSelect.value) {
        const selectedValue = invoiceSelect.value.trim();
        const match = selectedValue.match(/Factura\s+(\d+)/i);
        invoiceNumber = match ? match[1] : selectedValue;
    } else if (invoiceInput) {
        invoiceNumber = invoiceInput.value.trim();
    }
    
    if (!invoiceNumber) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #6c757d;">Seleccione una factura para ver las cuotas pendientes</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        return;
    }
    
    // Obtener información del plan
    const planInfo = getPlanInfoFromInvoice(invoiceNumber);
    if (!planInfo) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #d32f2f;">No se pudo obtener la información del plan.</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        return;
    }
    
    let mensualidad = planInfo.mensualidad || 0;
    let numCuotas = planInfo.numCuotas || 0;
    const valorPlan = planInfo.valorPlan || 0;
    const cuotaInicialPlan = planInfo.cuotaInicial || 0;
    const cuotasPagadas = planInfo.cuotasPagadas || 0;
    
    // Calcular mensualidad si no existe
    if (!mensualidad && valorPlan && numCuotas) {
        const saldo = Math.max(0, valorPlan - (cuotaInicialPlan || 0));
        mensualidad = Math.floor(saldo / numCuotas);
    }
    
    if (!mensualidad || mensualidad <= 0 || !numCuotas || numCuotas <= 0) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #d32f2f;">No se pudo determinar el valor de la cuota o número de cuotas.</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        return;
    }
    
    // Calcular cuotas pendientes
    const cuotaInicial = cuotasPagadas + 1;
    const cuotasPendientes = [];
    
    // Obtener cuotas ya pagadas con sus valores para calcular saldos
    const city = getSelectedCityCode();
    const inflowsRaw = localStorage.getItem(`ingresosCaja_${city}`);
    const ingresosBancosRaw = localStorage.getItem(`ingresosBancos_${city}`);
    const inflows = inflowsRaw ? JSON.parse(inflowsRaw) : [];
    const ingresosBancos = ingresosBancosRaw ? JSON.parse(ingresosBancosRaw) : [];
    const pagosPorCuota = {};
    
    // Procesar ingresos de caja
    if (Array.isArray(inflows)) {
        inflows.forEach(i => {
            const sameInvoice = String(i.invoiceNumber || '').replace(/^0+/, '') === String(invoiceNumber).replace(/^0+/, '');
            const isActive = (i.estado || 'activo') === 'activo';
            if (sameInvoice && isActive) {
                // Si existe detalleCuotas, usar esa información (más precisa)
                if (i.detalleCuotas && Array.isArray(i.detalleCuotas)) {
                    i.detalleCuotas.forEach(detalle => {
                        const cuotaNum = parseInt(detalle.cuota) || 0;
                        if (cuotaNum > 0) {
                            if (!pagosPorCuota[cuotaNum]) {
                                pagosPorCuota[cuotaNum] = 0;
                            }
                            pagosPorCuota[cuotaNum] += parseFloat(detalle.valorPagar || 0);
                        }
                    });
                } else {
                    // Procesar el campo cuota que puede ser un string con múltiples cuotas separadas por comas
                    const cuotaField = String(i.cuota || '').trim();
                    if (cuotaField) {
                        const cuotasArray = cuotaField.split(',').map(c => parseInt(c.trim())).filter(c => c > 0);
                        const valorIngreso = parseFloat(i.valor || 0);
                        const valorPorCuota = cuotasArray.length > 0 ? valorIngreso / cuotasArray.length : valorIngreso;
                        
                        cuotasArray.forEach(cuotaNum => {
                            if (cuotaNum > 0) {
                                if (!pagosPorCuota[cuotaNum]) {
                                    pagosPorCuota[cuotaNum] = 0;
                                }
                                pagosPorCuota[cuotaNum] += valorPorCuota;
                            }
                        });
                    }
                }
            }
        });
    }
    
    // Procesar ingresos de bancos
    if (Array.isArray(ingresosBancos)) {
        ingresosBancos.forEach(ing => {
            try {
                if (ing.cashInflowData) {
                    const cashInflow = JSON.parse(ing.cashInflowData);
                    const sameInvoice = String(ing.invoiceNumber || cashInflow.invoiceNumber || '').replace(/^0+/, '') === String(invoiceNumber).replace(/^0+/, '');
                    const isActive = (ing.estado || cashInflow.estado || 'activo') === 'activo';
                    
                    if (sameInvoice && isActive && cashInflow.detalleCuotas && Array.isArray(cashInflow.detalleCuotas)) {
                        cashInflow.detalleCuotas.forEach(detalle => {
                            const cuotaNum = parseInt(detalle.cuota) || 0;
                            if (cuotaNum > 0) {
                                if (!pagosPorCuota[cuotaNum]) {
                                    pagosPorCuota[cuotaNum] = 0;
                                }
                                pagosPorCuota[cuotaNum] += parseFloat(detalle.valorPagar || 0);
                            }
                        });
                    } else if (sameInvoice && isActive && cashInflow.cuota) {
                        const cuotaField = String(cashInflow.cuota || '').trim();
                        if (cuotaField) {
                            const cuotasArray = cuotaField.split(',').map(c => parseInt(c.trim())).filter(c => c > 0);
                            const valorIngreso = parseFloat(ing.valor || cashInflow.valor || 0);
                            const valorPorCuota = cuotasArray.length > 0 ? valorIngreso / cuotasArray.length : valorIngreso;
                            
                            cuotasArray.forEach(cuotaNum => {
                                if (cuotaNum > 0) {
                                    if (!pagosPorCuota[cuotaNum]) {
                                        pagosPorCuota[cuotaNum] = 0;
                                    }
                                    pagosPorCuota[cuotaNum] += valorPorCuota;
                                }
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('Error procesando ingreso banco:', e);
            }
        });
    }
    
    // Crear lista de cuotas pendientes
    for (let i = cuotaInicial; i <= numCuotas; i++) {
        const pagado = pagosPorCuota[i] || 0;
        const saldo = Math.max(0, mensualidad - pagado);
        
        if (saldo > 0) {
            cuotasPendientes.push({
                cuota: i,
                valorCuota: mensualidad,
                valorPagado: pagado,
                saldo: saldo
            });
        }
    }
    
    if (cuotasPendientes.length === 0) {
        installmentsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message" style="text-align: center; padding: 15px;">
                    <p style="margin: 0; color: #6c757d;">Todas las cuotas están pagadas</p>
                </td>
            </tr>
        `;
        if (installmentsTableFooter) installmentsTableFooter.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        return;
    }
    
    // Renderizar tabla
    installmentsTableBody.innerHTML = '';
    cuotasPendientes.forEach(inst => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" data-cuota="${inst.cuota}" data-valor-cuota="${inst.valorCuota}" data-saldo="${inst.saldo}" 
                       onchange="distributeValueToSelectedInstallments()" style="cursor: pointer;">
            </td>
            <td>${inst.cuota}/${numCuotas}</td>
            <td>${formatNumberValue(inst.valorCuota)}</td>
            <td>
                <input type="text" class="valor-pagar-input numeric-input" data-cuota="${inst.cuota}" 
                       data-valor-cuota="${inst.valorCuota}" data-saldo="${inst.saldo}"
                       value="0" style="width: 100%; border: 1px solid #ddd; padding: 4px; text-align: right;"
                       onchange="handleValorPagarChange(this)" onblur="handleValorPagarBlur(this)">
            </td>
            <td>${formatNumberValue(inst.saldo)}</td>
            <td>
                <span class="status-badge" style="font-size: 0.85em; background-color: #d1ecf1; color: #0c5460;">PENDIENTE</span>
            </td>
        `;
        installmentsTableBody.appendChild(row);
    });
    
    // Guardar información de cuotas pendientes
    window.pendingInstallments = cuotasPendientes;
    window.planInfo = { mensualidad, numCuotas, valorPlan };
    
    // Distribuir valor si hay uno ingresado
    distributeValueToSelectedInstallments();
    
    if (installmentsTableFooter) installmentsTableFooter.style.display = '';
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
}

/**
 * Maneja el cambio en un checkbox de cuota
 */
function handleInstallmentCheckboxChange(checkbox) {
    const cuota = parseInt(checkbox.dataset.cuota);
    const valorPagarInput = document.querySelector(`.valor-pagar-input[data-cuota="${cuota}"]`);
    
    if (!checkbox.checked) {
        // Si se deselecciona, limpiar el valor
        if (valorPagarInput) {
            valorPagarInput.value = '0';
            formatNumericInput(valorPagarInput);
        }
    }
    
    // Recalcular distribución
    distributeValueToSelectedInstallments();
}

/**
 * Maneja el cambio en un input de valor a pagar
 */
function handleValorPagarChange(input) {
    const valor = parseFormattedNumber(input.value) || 0;
    const saldo = parseFloat(input.dataset.saldo || 0);
    
    // Validar que no exceda el saldo
    if (valor > saldo) {
        input.value = formatNumberValue(saldo);
        showNotification(`El valor no puede exceder el saldo de ${formatNumberValue(saldo)}`, 'warning');
    }
    
    // Actualizar checkbox si hay valor
    const cuota = parseInt(input.dataset.cuota);
    const checkbox = document.querySelector(`input[type="checkbox"][data-cuota="${cuota}"]`);
    if (checkbox) {
        checkbox.checked = valor > 0;
    }
    
    // Actualizar estado y recalcular
    updateInstallmentRowState(cuota);
    updateInstallmentsTotals();
    updateCalculatedInstallments();
}

/**
 * Maneja el blur en un input de valor a pagar
 */
function handleValorPagarBlur(input) {
    formatNumericInput(input);
    handleValorPagarChange(input);
}

/**
 * Inicializa el formato numérico en los inputs de valor a pagar
 */
function initializeValorPagarInputs() {
    document.querySelectorAll('.valor-pagar-input').forEach(input => {
        // Formatear en tiempo real
        input.addEventListener('input', function() {
            const cursorPosition = this.selectionStart;
            const originalValue = this.value;
            const numbersOnly = this.value.replace(/[^\d]/g, '');
            
            if (!numbersOnly) {
                this.value = '0';
                return;
            }
            
            const numValue = parseInt(numbersOnly, 10);
            if (!isNaN(numValue)) {
                const formatted = new Intl.NumberFormat('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(numValue);
                
                this.value = formatted;
                
                // Ajustar cursor
                const beforeCursor = originalValue.substring(0, cursorPosition);
                const digitsBeforeCursor = beforeCursor.replace(/[^\d]/g, '').length;
                let digitsFound = 0;
                let newCursorPosition = formatted.length;
                for (let i = 0; i < formatted.length; i++) {
                    if (formatted[i] >= '0' && formatted[i] <= '9') {
                        digitsFound++;
                        if (digitsFound === digitsBeforeCursor) {
                            newCursorPosition = i + 1;
                            break;
                        }
                    }
                }
                this.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        });
    });
}

/**
 * Actualiza el estado visual de una fila de cuota
 */
function updateInstallmentRowState(cuota) {
    const row = document.querySelector(`input[type="checkbox"][data-cuota="${cuota}"]`)?.closest('tr');
    if (!row) return;
    
    const valorPagarInput = row.querySelector('.valor-pagar-input');
    const estadoCell = row.querySelector('td:last-child');
    const valorPagar = valorPagarInput ? parseFormattedNumber(valorPagarInput.value) : 0;
    const saldo = valorPagarInput ? parseFloat(valorPagarInput.dataset.saldo || 0) : 0;
    const valorCuota = valorPagarInput ? parseFloat(valorPagarInput.dataset.valorCuota || 0) : 0;
    
    if (estadoCell) {
        if (valorPagar === 0) {
            estadoCell.innerHTML = '<span class="status-badge" style="font-size: 0.85em; background-color: #d1ecf1; color: #0c5460;">PENDIENTE</span>';
            row.style.backgroundColor = '';
        } else if (valorPagar < saldo) {
            estadoCell.innerHTML = '<span class="status-badge warning" style="font-size: 0.85em;">PARCIAL</span>';
            row.style.backgroundColor = '#fff3cd';
        } else {
            estadoCell.innerHTML = '<span class="status-badge success" style="font-size: 0.85em;">COMPLETA</span>';
            row.style.backgroundColor = '';
        }
    }
}

/**
 * Actualiza las cuotas calculadas desde los valores en los inputs
 */
function updateCalculatedInstallments() {
    const installments = [];
    
    document.querySelectorAll('.valor-pagar-input').forEach(input => {
        const valorPagar = parseFormattedNumber(input.value) || 0;
        if (valorPagar > 0) {
            const cuota = parseInt(input.dataset.cuota);
            const valorCuota = parseFloat(input.dataset.valorCuota || 0);
            const saldo = parseFloat(input.dataset.saldo || 0);
            
            installments.push({
                cuota: cuota,
                valorCuota: valorCuota,
                valorPagar: valorPagar,
                saldo: saldo,
                esParcial: valorPagar < saldo
            });
        }
    });
    
    // Ordenar por número de cuota
    installments.sort((a, b) => a.cuota - b.cuota);
    
    window.calculatedInstallments = installments;
}

/**
 * Distribuye el valor total ingresado entre las cuotas seleccionadas
 */
function distributeValueToSelectedInstallments() {
    const valorInput = document.getElementById('inflowValue');
    const installmentsTableBody = document.getElementById('installmentsTableBody');
    
    if (!valorInput || !installmentsTableBody) return;
    
    const valorTotal = parseFormattedNumber(valorInput.value) || 0;
    
    if (valorTotal <= 0) {
        // Limpiar todos los valores si no hay valor total
        document.querySelectorAll('.valor-pagar-input').forEach(input => {
            input.value = '0';
            formatNumericInput(input);
        });
        document.querySelectorAll('input[type="checkbox"][data-cuota]').forEach(cb => {
            cb.checked = false;
        });
        document.querySelectorAll('#installmentsTableBody tr').forEach(row => {
            updateInstallmentRowState(parseInt(row.querySelector('input[type="checkbox"][data-cuota]')?.dataset.cuota || 0));
        });
        updateInstallmentsTotals();
        updateCalculatedInstallments();
        return;
    }
    
    // Obtener cuotas seleccionadas
    let selectedCheckboxes = Array.from(document.querySelectorAll('#installmentsTableBody input[type="checkbox"][data-cuota]:checked'));
    
    // Si no hay cuotas seleccionadas pero hay valor, seleccionar automáticamente desde la primera
    if (selectedCheckboxes.length === 0 && valorTotal > 0) {
        const allCheckboxes = Array.from(document.querySelectorAll('#installmentsTableBody input[type="checkbox"][data-cuota]'));
        if (allCheckboxes.length > 0) {
            // Seleccionar automáticamente las cuotas necesarias
            let valorAcumulado = 0;
            for (const checkbox of allCheckboxes) {
                const saldo = parseFloat(checkbox.dataset.saldo || 0);
                if (valorAcumulado < valorTotal) {
                    checkbox.checked = true;
                    selectedCheckboxes.push(checkbox);
                    valorAcumulado += saldo;
                } else {
                    break;
                }
            }
        }
    }
    
    if (selectedCheckboxes.length === 0) {
        updateInstallmentsTotals();
        updateCalculatedInstallments();
        return;
    }
    
    // Ordenar por número de cuota
    selectedCheckboxes.sort((a, b) => {
        return parseInt(a.dataset.cuota) - parseInt(b.dataset.cuota);
    });
    
    // Distribuir valor
    let valorRestante = valorTotal;
    const installments = [];
    
    selectedCheckboxes.forEach((checkbox, index) => {
        const cuota = parseInt(checkbox.dataset.cuota);
        const valorCuota = parseFloat(checkbox.dataset.valorCuota);
        const saldo = parseFloat(checkbox.dataset.saldo);
        
        // Calcular valor a pagar para esta cuota
        let valorPagar = 0;
        if (index === selectedCheckboxes.length - 1) {
            // Última cuota seleccionada: usar todo el valor restante
            valorPagar = Math.min(valorRestante, saldo);
        } else {
            // Cuotas intermedias: pagar el saldo completo o el valor restante, lo que sea menor
            valorPagar = Math.min(valorRestante, saldo);
        }
        
        valorPagar = Math.max(0, Math.min(valorPagar, saldo)); // Asegurar que no exceda el saldo
        
        installments.push({
            cuota: cuota,
            valorCuota: valorCuota,
            valorPagar: valorPagar,
            saldo: saldo,
            esParcial: valorPagar < saldo
        });
        
        valorRestante -= valorPagar;
    });
    
    // Si sobra valor, ajustar la última cuota seleccionada
    if (valorRestante > 0 && installments.length > 0) {
        const lastInst = installments[installments.length - 1];
        const ajustePosible = lastInst.saldo - lastInst.valorPagar;
        if (ajustePosible > 0) {
            const ajuste = Math.min(valorRestante, ajustePosible);
            lastInst.valorPagar += ajuste;
            lastInst.esParcial = lastInst.valorPagar < lastInst.saldo;
            valorRestante -= ajuste;
        }
    }
    
    // Si aún sobra valor, mostrar advertencia
    if (valorRestante > 0) {
        showNotification(`El valor ingresado excede el total de las cuotas seleccionadas. Sobra: ${formatNumberValue(valorRestante)}`, 'warning');
    }
    
    // Actualizar tabla
    installments.forEach(inst => {
        const valorPagarInput = document.querySelector(`.valor-pagar-input[data-cuota="${inst.cuota}"]`);
        
        if (valorPagarInput) {
            valorPagarInput.value = formatNumberValue(inst.valorPagar);
            
            // Actualizar estado de la fila
            updateInstallmentRowState(inst.cuota);
        }
    });
    
    // Limpiar cuotas no seleccionadas
    document.querySelectorAll('#installmentsTableBody input[type="checkbox"][data-cuota]:not(:checked)').forEach(checkbox => {
        const cuota = parseInt(checkbox.dataset.cuota);
        const valorPagarInput = document.querySelector(`.valor-pagar-input[data-cuota="${cuota}"]`);
        if (valorPagarInput) {
            valorPagarInput.value = '0';
            formatNumericInput(valorPagarInput);
        }
        updateInstallmentRowState(cuota);
    });
    
    // Actualizar cuotas calculadas y totales
    updateCalculatedInstallments();
    updateInstallmentsTotals();
}

/**
 * Actualiza los totales en el footer de la tabla
 */
function updateInstallmentsTotals() {
    const installmentsTableFooter = document.getElementById('installmentsTableFooter');
    if (!installmentsTableFooter) return;
    
    let totalCuotas = 0;
    let totalPagar = 0;
    let totalSaldo = 0;
    
    document.querySelectorAll('#installmentsTableBody tr').forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"][data-cuota]');
        if (checkbox) {
            const valorCuota = parseFloat(checkbox.dataset.valorCuota || 0);
            const saldo = parseFloat(checkbox.dataset.saldo || 0);
            const valorPagarInput = row.querySelector('.valor-pagar-input');
            const valorPagar = valorPagarInput ? parseFormattedNumber(valorPagarInput.value) : 0;
            
            totalCuotas += valorCuota;
            totalPagar += valorPagar;
            totalSaldo += saldo;
        }
    });
    
    const totalCuotasCell = document.getElementById('totalCuotasValue');
    const totalPagarCell = document.getElementById('totalPagarValue');
    const totalSaldoCell = document.getElementById('totalSaldoValue');
    
    if (totalCuotasCell) totalCuotasCell.textContent = formatNumberValue(totalCuotas);
    if (totalPagarCell) totalPagarCell.textContent = formatNumberValue(totalPagar);
    if (totalSaldoCell) totalSaldoCell.textContent = formatNumberValue(totalSaldo);
}

// ========================================
// MANEJO DE EVENTOS
// ========================================

function handleSearchInflow() {
    const type = document.getElementById('inflowSearchType')?.value;
    const value = document.getElementById('searchInflowValue')?.value.trim();
    
    if (!type || !value) {
        showNotification('Por favor, complete todos los campos', 'warning');
        return;
    }
    
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    // Cargar todos los ingresos de la ciudad
    let allInflows = [];
    try {
        const raw = localStorage.getItem(`ingresosCaja_${city}`);
        allInflows = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(allInflows)) allInflows = [];
    } catch (e) {
        console.error('Error al cargar ingresos para búsqueda:', e);
        allInflows = [];
    }
    
    // Filtrar según el tipo de búsqueda
    let filtered = [];
    const searchValue = value.toLowerCase().trim();
    
    switch (type) {
        case 'number':
        case 'inflowNumber':
            // Buscar por número de ingreso
            filtered = allInflows.filter(inflow => {
                const numero = String(inflow.numero || '').toLowerCase().trim();
                return numero.includes(searchValue) || 
                       numero.replace(/^0+/, '') === searchValue.replace(/^0+/, '');
            });
            break;
            
        case 'holderName':
            // Buscar por nombre del titular
            filtered = allInflows.filter(inflow => {
                const holderName = String(inflow.holderName || '').toLowerCase().trim();
                return holderName.includes(searchValue);
            });
            break;
            
        case 'holderId':
            // Buscar por identificación del titular
            filtered = allInflows.filter(inflow => {
                const holderId = String(inflow.holderId || '').toLowerCase().trim();
                return holderId.includes(searchValue);
            });
            break;
            
        default:
            filtered = allInflows;
    }
    
    // Renderizar resultados en el modal
    renderInflowSearchResults(filtered);
    
    // Mostrar notificación con resultados
    if (filtered.length === 0) {
        showNotification('No se encontraron ingresos con los criterios de búsqueda', 'info');
    } else {
        showNotification(`Se encontraron ${filtered.length} ingreso(s)`, 'success');
    }
    
    // Solo ocultar el modal de búsqueda y mostrar resultados si no estamos restaurando
    const isRestoring = window.__isRestoringResultsModal;
    if (!isRestoring) {
        hideSearchInflowModal();
        showInflowResultsModal();
    } else {
        // Si estamos restaurando, solo asegurarnos de que el modal esté visible
        showInflowResultsModal();
        window.__isRestoringResultsModal = false;
    }
}

function renderInflowSearchResults(list) {
    const body = document.getElementById('inflowSearchResultsBody');
    if (!body) return;
    
    body.innerHTML = '';
    
    if (!list || list.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="11" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron resultados</p>
                        <small>Intente con otros criterios de búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const city = getSelectedCityCode();
    
    list.forEach(inflow => {
        const row = document.createElement('tr');
        row.className = `status-${(inflow.estado || 'activo') === 'activo' ? 'active' : 'inactive'}`;
        row.setAttribute('data-id', String(inflow.id));
        
        // Obtener tipo de ingreso
        const tipoIngreso = inflow.tipoIngresoCodigo && inflow.tipoIngresoNombre 
            ? `${inflow.tipoIngresoCodigo} - ${inflow.tipoIngresoNombre}`
            : (inflow.tipo || '');
        
        // Determinar si es CI o CR
        const category = getIncomeTypeCategory(inflow.tipoIngresoCodigo);
        
        // Obtener factura y contrato según el tipo
        let contractNumber = '';
        let invoiceNumber = '';
        
        if (category === 'CI') {
            // Para CI: invoiceNumber contiene el número de contrato, no hay factura
            contractNumber = inflow.invoiceNumber || '';
            invoiceNumber = ''; // No mostrar factura para CI
        } else {
            // Para CR u otros: buscar factura y contrato normalmente
            const invoiceInfo = getInvoiceAndContractByNumber(inflow.invoiceNumber, city);
            contractNumber = invoiceInfo.contractNumber || '';
            invoiceNumber = invoiceInfo.invoiceNumber || inflow.invoiceNumber || '';
        }
        
        // Formatear valor
        const valorFormatted = formatNumberValue(inflow.valor || 0);
        
        // Estado del ingreso (activo/anulado) - Leer directamente del objeto
        const estado = String(inflow.estado || 'activo').toLowerCase().trim();
        const isActive = estado === 'activo';
        const newState = !isActive; // Estado al que cambiará (opuesto al actual)
        
        // Convertir a string booleano para asegurar evaluación correcta
        const newStateStr = newState ? 'true' : 'false';
        
        // Debug para verificar el estado
        console.log(`Renderizando ingreso ${inflow.numero}: estado="${estado}", isActive=${isActive}, newState=${newState}, newStateStr=${newStateStr}`);
        
        row.innerHTML = `
            <td>${inflow.numero || ''}</td>
            <td>${tipoIngreso}</td>
            <td>${formatDate(inflow.fecha || inflow.date)}</td>
            <td>${inflow.holderId || ''}</td>
            <td>${valorFormatted}</td>
            <td>${inflow.executiveId || ''}</td>
            <td>${inflow.letraRecibo || ''}</td>
            <td>${contractNumber}</td>
            <td>${invoiceNumber}</td>
            <td><span class="status-badge ${isActive ? 'active' : 'inactive'}" data-status>${isActive ? 'ACTIVO' : 'ANULADO'}</span></td>
            <td>
                <div class="action-buttons-cell status-toggle-container">
                    <button class="btn-icon btn-edit" onclick="editInflow(${inflow.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <label class="status-toggle" title="Activar/Anular" style="margin:0 6px;" tabindex="0" role="switch" aria-checked="${isActive ? 'true' : 'false'}"
                        onkeydown="if(event.key==='Enter'||event.key===' '){ event.preventDefault(); requestToggleInflow(${inflow.id}, ${newStateStr}); }">
                        <input type="checkbox" ${isActive ? 'checked' : ''} onchange="event.preventDefault(); requestToggleInflow(${inflow.id}, ${newStateStr});">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </td>
        `;
        body.appendChild(row);
    });
}

function showInflowResultsModal() {
    const modal = document.getElementById('inflowResultsModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '2000';
    }
}

function hideInflowResultsModal() {
    const modal = document.getElementById('inflowResultsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleCreateInflow() {
    const form = document.getElementById('createInflowDetailsForm');
    if (!form) return;
    
    // Obtener datos básicos guardados del primer paso
    const basicData = window.tempInflowBasicData;
    if (!basicData) {
        showNotification('Error: No se encontraron datos del primer paso', 'error');
        hideCreateInflowDetailsModal();
        return;
    }
    
    // Validar campos requeridos del segundo paso
    const holderId = document.getElementById('holderId')?.value.trim();
    const holderName = document.getElementById('holderName')?.value.trim();
    
    // Obtener número de factura/contrato del select si está visible, sino del input
    const invoiceSelect = document.getElementById('invoiceNumberSelect');
    const invoiceInput = document.getElementById('invoiceNumber');
    let invoiceNumber = '';
    if (invoiceSelect && invoiceSelect.style.display !== 'none' && invoiceSelect.style.display !== '') {
        invoiceNumber = invoiceSelect.value.trim();
        // También actualizar el input oculto
        if (invoiceInput) invoiceInput.value = invoiceNumber;
    } else {
        invoiceNumber = invoiceInput?.value.trim() || '';
    }
    
    const valor = document.getElementById('inflowValue')?.value.trim();
    const cuotaRaw = document.getElementById('cuota')?.value.trim();
    const executiveId = document.getElementById('executiveId')?.value.trim();
    const executiveName = document.getElementById('executiveName')?.value.trim();
    const letraRecibo = document.getElementById('letraRecibo')?.value.trim();
    const reciboOficial = document.getElementById('reciboOficial')?.value.trim();
    const recordProduccion = document.getElementById('recordProduccion')?.value.trim();
    
    // Validar campos básicos
    if (!holderId || !holderName || !valor || !executiveId || !executiveName) {
        showNotification('Por favor, complete todos los campos requeridos', 'warning');
        return;
    }
    
    // Validar que haya cuotas seleccionadas con valores a pagar
    const calculatedInstallments = window.calculatedInstallments;
    if (!calculatedInstallments || calculatedInstallments.length === 0) {
        showNotification('Por favor, seleccione al menos una cuota y ingrese un valor válido', 'warning');
        const valorInput = document.getElementById('inflowValue');
        if (valorInput) valorInput.focus();
        return;
    }
    
    // Validar que el valor total coincida con la suma de valores a pagar
    const totalCalculado = calculatedInstallments.reduce((sum, inst) => sum + (inst.valorPagar || 0), 0);
    const valorIngresado = parseFormattedNumber(valor);
    if (Math.abs(totalCalculado - valorIngresado) > 1) { // Permitir diferencia de 1 por redondeo
        showNotification(`El valor ingresado (${formatNumberValue(valorIngresado)}) no coincide con la suma de las cuotas seleccionadas (${formatNumberValue(totalCalculado)})`, 'warning');
        return;
    }
    
    // Procesar cuota inicial (opcional): si es "Cuota Inicial", se guarda como 0
    const cuotaInicial = (cuotaRaw && cuotaRaw.toLowerCase() === 'cuota inicial') ? '0' : cuotaRaw;
    
    // Determinar el tipo de ingreso (CI o CR)
    const tipoIngresoCodigo = basicData?.tipoIngresoCodigo || '';
    const category = getIncomeTypeCategory(tipoIngresoCodigo);
    
    // Para CI: no se requiere factura, se usa el contrato seleccionado
    // Para CR: sí se requiere factura y debe validarse
    if (category === 'CR') {
        // Validar que se haya ingresado un número de factura
        if (!invoiceNumber) {
            showNotification('Por favor, seleccione o ingrese el número de factura', 'warning');
            const invoiceInput = document.getElementById('invoiceNumber');
            const invoiceSelect = document.getElementById('invoiceNumberSelect');
            if (invoiceSelect && invoiceSelect.style.display !== 'none') {
                invoiceSelect.focus();
            } else if (invoiceInput) {
                invoiceInput.focus();
            }
            return;
        }
        
        // Validar que la factura exista
        const invoiceExists = validateInvoiceNumber(invoiceNumber);
        if (!invoiceExists) {
            showNotification('La factura no está creada. Debe crear la factura primero antes de continuar.', 'error');
            // Enfocar el campo de factura
            const invoiceInput = document.getElementById('invoiceNumber');
            const invoiceSelect = document.getElementById('invoiceNumberSelect');
            if (invoiceSelect && invoiceSelect.style.display !== 'none') {
                invoiceSelect.focus();
            } else if (invoiceInput) {
                invoiceInput.focus();
                invoiceInput.select();
            }
            return;
        }
    } else if (category === 'CI') {
        // Para CI: validar que se haya seleccionado un contrato
        if (!invoiceNumber) {
            showNotification('Por favor, seleccione el contrato', 'warning');
            const invoiceSelect = document.getElementById('invoiceNumberSelect');
            if (invoiceSelect && invoiceSelect.style.display !== 'none') {
                invoiceSelect.focus();
            }
            return;
        }
        // Para CI no se valida la existencia de la factura porque se usa el contrato
        // El campo invoiceNumber contiene el número de contrato en este caso
    } else {
        // Para otros tipos de ingreso, validar factura normalmente
        if (!invoiceNumber) {
            showNotification('Por favor, ingrese el número de factura', 'warning');
            const invoiceInput = document.getElementById('invoiceNumber');
            if (invoiceInput) {
                invoiceInput.focus();
            }
            return;
        }
        
        const invoiceExists = validateInvoiceNumber(invoiceNumber);
        if (!invoiceExists) {
            showNotification('La factura no está creada. Debe crear la factura primero antes de continuar.', 'error');
            const invoiceInput = document.getElementById('invoiceNumber');
            if (invoiceInput) {
                invoiceInput.focus();
                invoiceInput.select();
            }
            return;
        }
    }
    
    // Guardar todos los datos temporalmente para la confirmación
    // Incluir las cuotas calculadas para crear múltiples registros
    window.tempInflowData = {
        ...basicData,
        holderId: holderId,
        holderName: holderName,
        invoiceNumber: invoiceNumber,
        valor: parseFormattedNumber(valor), // Valor total
        cuotaInicial: cuotaInicial ? parseFormattedNumber(cuotaInicial) : null,
        installments: calculatedInstallments, // Array de cuotas calculadas
        executiveId: executiveId,
        executiveName: executiveName,
        letraRecibo: letraRecibo || '',
        reciboOficial: reciboOficial || '',
        recordProduccion: recordProduccion || ''
    };
    
    // Si estamos editando, mostrar modal de confirmación de actualización
    if (window.__editingInflowId) {
        showConfirmUpdateInflowModal();
    } else {
        // Mostrar modal de confirmación de creación
        showConfirmCreateInflowModal();
    }
}

function showConfirmCreateInflowModal() {
    const modal = document.getElementById('confirmCreateInflowModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '25000';
        document.body.style.overflow = 'hidden';
    }
}

function cancelCreateInflow() {
    const modal = document.getElementById('confirmCreateInflowModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    // Limpiar datos temporales
    window.tempInflowData = null;
    window.tempInflowBasicData = null;
    window.__editingInflowId = null;
    window.tempInflowEditData = null;
}

function showConfirmUpdateInflowModal() {
    const modal = document.getElementById('confirmUpdateInflowModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '25000';
        document.body.style.overflow = 'hidden';
    }
}

function cancelUpdateInflow() {
    const modal = document.getElementById('confirmUpdateInflowModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    // No limpiar datos, permitir volver a editar
}

function confirmUpdateInflow() {
    const modal = document.getElementById('confirmUpdateInflowModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    const id = window.__editingInflowId;
    if (typeof id === 'undefined' || id === null) {
        showNotification('Error: No se encontró el ingreso a actualizar', 'error');
        return;
    }
    
    const inflowData = window.tempInflowData;
    if (!inflowData) {
        showNotification('Error: No se encontraron datos para actualizar', 'error');
        return;
    }
    
    try {
        const city = getSelectedCityCode();
        if (!city) {
            showNotification('Debe seleccionar una ciudad primero', 'warning');
            return;
        }
        
        const raw = localStorage.getItem(`ingresosCaja_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) {
            showNotification('Error en el formato de datos', 'error');
            return;
        }
        
        const idx = list.findIndex(i => i.id === id);
        if (idx === -1) {
            showNotification('Ingreso no encontrado', 'error');
            return;
        }
        
        // Actualizar el ingreso existente
        const updatedInflow = {
            ...list[idx],
            tipoIngresoCodigo: inflowData.tipoIngresoCodigo,
            tipoIngresoNombre: inflowData.tipoIngresoNombre,
            numero: inflowData.numero,
            fecha: inflowData.fecha,
            observaciones: inflowData.observaciones || '',
            holderId: inflowData.holderId,
            holderName: inflowData.holderName,
            invoiceNumber: inflowData.invoiceNumber,
            valor: inflowData.valor,
            cuota: inflowData.cuota,
            executiveId: inflowData.executiveId,
            executiveName: inflowData.executiveName,
            letraRecibo: inflowData.letraRecibo || '',
            reciboOficial: inflowData.reciboOficial || '',
            recordProduccion: inflowData.recordProduccion || '',
            date: new Date(inflowData.fecha).toISOString()
        };
        
        list[idx] = updatedInflow;
        localStorage.setItem(`ingresosCaja_${city}`, JSON.stringify(list));
        
        // Limpiar datos temporales y modo edición
        window.tempInflowData = null;
        window.tempInflowBasicData = null;
        window.__editingInflowId = null;
        window.tempInflowEditData = null;
        
        // Cerrar modal de detalles
        hideCreateInflowDetailsModal();
        
        // Recargar datos de la tabla principal
        loadCashInflowData();
        
        // Si el modal de resultados de búsqueda está abierto, actualizar los resultados directamente
        const resultsModal = document.getElementById('inflowResultsModal');
        if (resultsModal && resultsModal.style.display === 'flex') {
            // Buscar y actualizar la fila en los resultados
            const tbody = document.getElementById('inflowSearchResultsBody');
            if (tbody) {
                const rows = tbody.querySelectorAll('tr');
                rows.forEach(row => {
                    const editButton = row.querySelector('button[onclick*="editInflow"]');
                    if (editButton) {
                        const onclickAttr = editButton.getAttribute('onclick');
                        const match = onclickAttr.match(/editInflow\((\d+)\)/);
                        if (match && parseInt(match[1]) === id) {
                            // Obtener datos actualizados del objeto updatedInflow
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 11) {
                                // Obtener tipo de ingreso formateado
                                const tipoIngreso = updatedInflow.tipoIngresoCodigo && updatedInflow.tipoIngresoNombre 
                                    ? `${updatedInflow.tipoIngresoCodigo} - ${updatedInflow.tipoIngresoNombre}`
                                    : (updatedInflow.tipo || '');
                                
                                // Obtener factura y contrato según el tipo
                                const category = getIncomeTypeCategory(updatedInflow.tipoIngresoCodigo);
                                let contractNumber = '';
                                let invoiceNumber = '';
                                
                                if (category === 'CI') {
                                    contractNumber = updatedInflow.invoiceNumber || '';
                                    invoiceNumber = '';
                                } else {
                                    const invoiceInfo = getInvoiceAndContractByNumber(updatedInflow.invoiceNumber, city);
                                    contractNumber = invoiceInfo.contractNumber || '';
                                    invoiceNumber = invoiceInfo.invoiceNumber || updatedInflow.invoiceNumber || '';
                                }
                                
                                // Formatear valor
                                const valorFormatted = formatNumberValue(updatedInflow.valor || 0);
                                
                                // Actualizar las celdas
                                cells[0].textContent = updatedInflow.numero || '';
                                cells[1].textContent = tipoIngreso;
                                cells[2].textContent = formatDate(updatedInflow.fecha || updatedInflow.date);
                                cells[3].textContent = updatedInflow.holderId || '';
                                cells[4].textContent = valorFormatted;
                                cells[5].textContent = updatedInflow.executiveId || '';
                                cells[6].textContent = updatedInflow.letraRecibo || '';
                                cells[7].textContent = contractNumber;
                                cells[8].textContent = invoiceNumber;
                                
                                // El estado y las opciones (cells[9] y cells[10]) no cambian al actualizar
                            }
                        }
                    }
                });
            }
        }
        
        // Mostrar modal de éxito
        showSuccessUpdateInflowModal();
        
    } catch (e) {
        console.error('Error al actualizar ingreso a caja:', e);
        showNotification('Error al actualizar el ingreso a caja', 'error');
    }
}

function showSuccessUpdateInflowModal() {
    const modal = document.getElementById('successUpdateInflowModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '25000';
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessUpdateInflowModal() {
    const modal = document.getElementById('successUpdateInflowModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Asegurar que el modal de resultados esté visible si estaba abierto
    if (window.__wasResultsModalOpen) {
        const resultsModal = document.getElementById('inflowResultsModal');
        if (resultsModal) {
            // Asegurar que el modal esté visible (ya debería estar actualizado desde confirmUpdateInflow)
            showInflowResultsModal();
        }
        window.__wasResultsModalOpen = false;
    }
}

function confirmCreateInflow() {
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('confirmCreateInflowModal');
    if (confirmModal) {
        confirmModal.style.display = 'none';
    }
    
    // Obtener datos temporales
    const inflowData = window.tempInflowData;
    
    if (!inflowData) {
        console.error('No se encontraron datos del ingreso para crear');
        showNotification('Error: No se encontraron datos para crear', 'error');
        return;
    }
    
    // Verificar si hay cuotas calculadas (nuevo sistema de múltiples cuotas)
    const installments = inflowData.installments;
    
    if (!installments || installments.length === 0) {
        // Fallback al sistema antiguo (una sola cuota) si no hay cuotas calculadas
        const inflow = {
            id: Date.now(),
            tipoIngresoCodigo: inflowData.tipoIngresoCodigo,
            tipoIngresoNombre: inflowData.tipoIngresoNombre,
            numero: inflowData.numero,
            fecha: inflowData.fecha,
            observaciones: inflowData.observaciones || '',
            holderId: inflowData.holderId,
            holderName: inflowData.holderName,
            invoiceNumber: inflowData.invoiceNumber,
            valor: inflowData.valor,
            cuota: inflowData.cuota || inflowData.cuotaInicial || '1',
            executiveId: inflowData.executiveId,
            executiveName: inflowData.executiveName,
            letraRecibo: inflowData.letraRecibo || '',
            reciboOficial: inflowData.reciboOficial || '',
            recordProduccion: inflowData.recordProduccion || '',
            estado: 'activo',
            date: new Date(inflowData.fecha).toISOString()
        };
        
        try {
            const raw = localStorage.getItem(`ingresosCaja_${inflowData.city}`);
            const list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) list = [];
            list.push(inflow);
            localStorage.setItem(`ingresosCaja_${inflowData.city}`, JSON.stringify(list));
            
            const numeroIngreso = parseInt(inflowData.numero, 10) || 0;
            if (numeroIngreso > 0) {
                localStorage.setItem(`nextInflowNumber_${inflowData.city}`, String(numeroIngreso + 1));
            }
            
            window.tempInflowData = null;
            window.tempInflowBasicData = null;
            hideCreateInflowDetailsModal();
            showSuccessCreateInflowModal();
            loadCashInflowData();
        } catch (e) {
            console.error('Error al guardar ingreso a caja:', e);
            showNotification('Error al guardar el ingreso a caja', 'error');
        }
        return;
    }
    
    // ========================================
    // NUEVO SISTEMA: Crear un solo registro con múltiples cuotas
    // ========================================
    // 
    // DESCRIPCIÓN:
    // Crea un único registro de ingreso que puede cubrir múltiples cuotas.
    // Esto permite que un solo pago se distribuya entre varias cuotas,
    // incluyendo pagos parciales.
    //
    // ESTRUCTURA DEL REGISTRO:
    // - valor: Suma total de todas las cuotas seleccionadas
    // - cuota: String con todas las cuotas separadas por comas (ej: "2, 3, 4, 5")
    // - detalleCuotas: Array con el detalle de cada cuota y su valor a pagar
    //
    // EJEMPLO:
    // Si el usuario paga 500,000 y selecciona cuotas 2, 3, 4, 5 con valores:
    // - Cuota 2: 118,000 (completa)
    // - Cuota 3: 118,000 (completa)
    // - Cuota 4: 118,000 (completa)
    // - Cuota 5: 146,000 (parcial, saldo restante)
    //
    // El registro guardado será:
    // {
    //   valor: 500000,
    //   cuota: "2, 3, 4, 5",
    //   detalleCuotas: [
    //     { cuota: 2, valorPagar: 118000, esParcial: false },
    //     { cuota: 3, valorPagar: 118000, esParcial: false },
    //     { cuota: 4, valorPagar: 118000, esParcial: false },
    //     { cuota: 5, valorPagar: 146000, esParcial: true }
    //   ]
    // }
    //
    // NOTA PARA BACKEND:
    // - Actualmente guarda en localStorage
    // - CONEXIÓN BACKEND: Reemplazar localStorage por llamada API:
    //   POST /api/cash-inflows
    //   Body: {
    //     ...inflow (todos los campos del objeto inflow)
    //   }
    //   Response: { success: true, id: nuevoId }
    //
    try {
        const raw = localStorage.getItem(`ingresosCaja_${inflowData.city}`);
        const list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];
        
        // Obtener número de ingreso
        let numeroIngreso = parseInt(inflowData.numero, 10) || 0;
        
        // Obtener todas las cuotas como string separadas por comas
        // Ejemplo: "2, 3, 4, 5"
        const cuotasNumeros = installments.map(inst => String(inst.cuota)).join(', ');
        
        // Calcular valor total (suma de todas las cuotas seleccionadas)
        const valorTotal = installments.reduce((sum, inst) => sum + (inst.valorPagar || 0), 0);
        
        // Crear un solo registro de ingreso con el detalle de múltiples cuotas
        // Validar y formatear fecha correctamente
        let fechaFormateada = inflowData.fecha || new Date().toISOString().split('T')[0];
        let dateISO = '';
        try {
            if (inflowData.fecha) {
                // Si la fecha viene en formato YYYY-MM-DD, convertirla a ISO
                const fechaDate = new Date(inflowData.fecha + 'T00:00:00');
                if (!isNaN(fechaDate.getTime())) {
                    dateISO = fechaDate.toISOString();
                } else {
                    dateISO = new Date().toISOString();
                }
            } else {
                dateISO = new Date().toISOString();
            }
        } catch (e) {
            console.error('Error formateando fecha:', e);
            fechaFormateada = new Date().toISOString().split('T')[0];
            dateISO = new Date().toISOString();
        }
        
        const inflow = {
            id: Date.now(),
            tipoIngresoCodigo: inflowData.tipoIngresoCodigo,
            tipoIngresoNombre: inflowData.tipoIngresoNombre,
            numero: String(numeroIngreso),
            fecha: fechaFormateada,
            observaciones: inflowData.observaciones || '',
            holderId: inflowData.holderId,
            holderName: inflowData.holderName,
            invoiceNumber: inflowData.invoiceNumber,
            valor: valorTotal, // Valor total de todas las cuotas seleccionadas
            cuota: cuotasNumeros, // Todas las cuotas separadas por comas (ej: "2, 3, 4, 5")
            executiveId: inflowData.executiveId,
            executiveName: inflowData.executiveName,
            letraRecibo: inflowData.letraRecibo || '',
            reciboOficial: inflowData.reciboOficial || '',
            recordProduccion: inflowData.recordProduccion || '',
            estado: 'activo',
            date: dateISO,
            // IMPORTANTE: Guardar detalle de cuotas para calcular saldos correctamente
            // Este array contiene el valor exacto pagado por cada cuota
            detalleCuotas: installments.map(inst => ({
                cuota: inst.cuota,           // Número de cuota
                valorPagar: inst.valorPagar, // Valor pagado en esta cuota
                esParcial: inst.esParcial || false // Si el pago es parcial o completo
            }))
        };
        
        list.push(inflow);
        
        // Guardar el registro en localStorage
        // BACKEND: Reemplazar por POST /api/cash-inflows
        localStorage.setItem(`ingresosCaja_${inflowData.city}`, JSON.stringify(list));
        
        // Actualizar tabla de CARTERA automáticamente
        try {
            if (window.CarteraManager && window.CarteraManager.updateCarteraFromInflow) {
                window.CarteraManager.updateCarteraFromInflow(inflow, inflowData.city, 'caja');
            }
        } catch (e) {
            console.error('Error actualizando cartera desde ingreso a caja:', e);
        }
        
        // Log de depuración: Verificar que se guardó correctamente
        console.log('✅ Ingreso guardado:', {
            numero: inflow.numero,
            fecha: inflow.fecha,
            date: inflow.date,
            valor: inflow.valor,
            cuota: inflow.cuota,
            ciudad: inflowData.city,
            totalIngresos: list.length
        });
        
        // Verificar que se puede leer correctamente
        const verify = JSON.parse(localStorage.getItem(`ingresosCaja_${inflowData.city}`));
        console.log('✅ Verificación: Total de ingresos en localStorage:', verify.length);
        
        // Actualizar el puntero del siguiente número consecutivo
        if (numeroIngreso > 0) {
            localStorage.setItem(`nextInflowNumber_${inflowData.city}`, String(numeroIngreso + 1));
        }
        
        // Limpiar datos temporales
        window.tempInflowData = null;
        window.tempInflowBasicData = null;
        window.calculatedInstallments = null;
        
        // Cerrar modal de detalles
        hideCreateInflowDetailsModal();
        
        // Mostrar modal de éxito
        showSuccessCreateInflowModal();
        
        // Recargar datos
        loadCashInflowData();
    } catch (e) {
        console.error('Error al guardar ingreso a caja:', e);
        showNotification('Error al guardar el ingreso a caja', 'error');
    }
}

function showSuccessCreateInflowModal(customMessage) {
    const modal = document.getElementById('successCreateInflowModal');
    if (modal) {
        // Actualizar mensaje si se proporciona uno personalizado
        const messageEl = modal.querySelector('.modal-message');
        if (messageEl && customMessage) {
            messageEl.textContent = customMessage;
        } else if (messageEl) {
            messageEl.textContent = '¡El ingreso a caja fue creado correctamente!';
        }
        modal.style.display = 'flex';
        modal.style.zIndex = '25000';
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessCreateInflowModal() {
    const modal = document.getElementById('successCreateInflowModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function handleGenerateReport() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    if (!startDate || !endDate) {
        showNotification('Por favor, seleccione ambas fechas', 'warning');
        return;
    }
    
    generateReport(startDate, endDate);
    hideReportModal();
}

function generateReport(startDate, endDate) {
    console.log('📊 Generando reporte de ingresos a caja:', { startDate, endDate });
    
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    // Filtrar ingresos por rango de fechas
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    console.log('📅 Rango de fechas para filtrado:', { start, end });
    
    try {
        const raw = localStorage.getItem(`ingresosCaja_${city}`);
        const allInflows = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(allInflows)) {
            allInflows = [];
        }
        
        console.log('📋 Total ingresos disponibles:', allInflows.length);
        
        const filteredInflows = allInflows.filter(inflow => {
            const inflowDate = new Date(inflow.fecha || inflow.date);
            return inflowDate >= start && inflowDate <= end;
        });
        
        console.log('📊 Ingresos filtrados:', filteredInflows.length, filteredInflows);
        
        // Guardar datos filtrados en localStorage para la página de reporte
        const reportData = {
            startDate: startDate,
            endDate: endDate,
            city: city,
            total: filteredInflows.length,
            inflows: filteredInflows,
            generatedAt: new Date().toISOString()
        };
        
        console.log('💾 Guardando datos del reporte:', reportData);
        localStorage.setItem('reporteIngresosCajaData', JSON.stringify(reportData));
        console.log('✅ Datos guardados en localStorage');
        
        // Abrir reporte en nueva pestaña
        const reportUrl = `reporte-ingreso-caja.html`;
        window.open(reportUrl, '_blank');
        
        console.log('✅ Reporte abierto en nueva pestaña:', {
            fechaInicio: startDate,
            fechaFin: endDate,
            totalIngresos: filteredInflows.length,
            ingresos: filteredInflows
        });
        
    } catch (e) {
        console.error('Error al generar reporte:', e);
        showNotification('Error al generar el reporte', 'error');
    }
}

// ========================================
// FUNCIONES DE EDICIÓN Y TOGGLE ESTADO
// ========================================

function editInflow(id) {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    try {
        const raw = localStorage.getItem(`ingresosCaja_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        const inflow = list.find(i => i.id === id);
        
        if (!inflow) {
            showNotification('Ingreso no encontrado', 'error');
            return;
        }
        
        // Establecer modo edición
        window.__editingInflowId = id;
        
        // Guardar si el modal de resultados está abierto para restaurarlo después
        const resultsModal = document.getElementById('inflowResultsModal');
        window.__wasResultsModalOpen = (resultsModal && resultsModal.style.display === 'flex');
        
        // Llenar formulario del primer paso con datos existentes
        const setVal = (id, val) => { 
            const el = document.getElementById(id); 
            if (el) el.value = val ?? ''; 
        };
        
        setVal('inflowIncomeTypeCode', inflow.tipoIngresoCodigo || '');
        setVal('inflowNumber', inflow.numero || '');
        setVal('inflowDate', inflow.fecha || inflow.date || '');
        setVal('inflowObservations', inflow.observaciones || '');
        
        // Mostrar nombre del tipo de ingreso si existe
        if (inflow.tipoIngresoCodigo && window.getIncomeTypeByCode) {
            const incomeType = window.getIncomeTypeByCode(inflow.tipoIngresoCodigo);
            const nameDisplay = document.getElementById('incomeTypeNameDisplay');
            if (incomeType && nameDisplay) {
                nameDisplay.textContent = incomeType.nombre;
                nameDisplay.style.display = 'block';
                nameDisplay.classList.remove('error-text');
                nameDisplay.classList.add('success-text');
            }
        }
        
        // Cambiar título del modal
        const modalTitle = document.querySelector('#createInflowModal .modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'ACTUALIZAR INGRESO';
        }
        
        // Cambiar botón
        const siguienteBtn = document.getElementById('bSiguienteIngreso');
        if (siguienteBtn) {
            siguienteBtn.textContent = 'Siguiente';
        }
        
        // Mostrar primer modal
        showCreateInflowModal();
        
        // Guardar datos del segundo paso para cuando se abra
        window.tempInflowEditData = {
            holderId: inflow.holderId || '',
            holderName: inflow.holderName || '',
            invoiceNumber: inflow.invoiceNumber || '',
            valor: inflow.valor || 0,
            cuota: inflow.cuota || 0,
            executiveId: inflow.executiveId || '',
            executiveName: inflow.executiveName || '',
            letraRecibo: inflow.letraRecibo || '',
            reciboOficial: inflow.reciboOficial || '',
            recordProduccion: inflow.recordProduccion || ''
        };
        
    } catch (e) {
        console.error('Error al editar ingreso:', e);
        showNotification('Error al cargar el ingreso para editar', 'error');
    }
}

// Toggle estado activo/anulado
window.__pendingInflowToggle = { id: null, next: true };

function requestToggleInflow(id, newState) {
    // newState es el estado al que va a cambiar (true = activar, false = anular)
    window.__pendingInflowToggle = { id: id, next: newState };
    const modal = document.getElementById('confirmToggleInflowModal');
    const text = document.getElementById('confirmToggleInflowText');
    if (text) {
        // Si newState es true, va a ACTIVAR; si es false, va a ANULAR
        text.textContent = newState
            ? '¿Está segur@ que desea ACTIVAR este ingreso?'
            : '¿Está segur@ que desea ANULAR este ingreso?';
    }
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '25000';
        document.body.style.overflow = 'hidden';
    }
}

function cancelToggleInflow() {
    const modal = document.getElementById('confirmToggleInflowModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Revertir el estado del toggle al estado original
    const { id } = window.__pendingInflowToggle || {};
    if (id) {
        const city = getSelectedCityCode();
        if (city) {
            try {
                const raw = localStorage.getItem(`ingresosCaja_${city}`);
                const list = raw ? JSON.parse(raw) : [];
                const inflow = list.find(i => i.id === id);
                if (inflow) {
                    const isActive = (inflow.estado || 'activo') === 'activo';
                    // Buscar y actualizar el checkbox en la tabla principal
                    const mainTable = document.getElementById('cashInflowTableBody');
                    if (mainTable) {
                        const row = mainTable.querySelector(`tr[data-id="${id}"]`);
                        if (row) {
                            const checkbox = row.querySelector('input[type="checkbox"]');
                            if (checkbox) {
                                checkbox.checked = isActive;
                            }
                        }
                    }
                    // Buscar y actualizar el checkbox en el modal de resultados
                    const resultsTable = document.getElementById('inflowSearchResultsBody');
                    if (resultsTable) {
                        const row = resultsTable.querySelector(`tr[data-id="${id}"]`);
                        if (row) {
                            const checkbox = row.querySelector('input[type="checkbox"]');
                            if (checkbox) {
                                checkbox.checked = isActive;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Error al revertir toggle:', e);
            }
        }
    }
    
    // Limpiar el toggle pendiente
    window.__pendingInflowToggle = null;
    
    // Revertir visual del switch para mantener coherencia
    loadCashInflowData();
    
    // También actualizar modal de resultados si está abierto
    const resultsModal = document.getElementById('inflowResultsModal');
    if (resultsModal && resultsModal.style.display === 'flex') {
        const type = document.getElementById('inflowSearchType')?.value;
        const value = document.getElementById('searchInflowValue')?.value.trim();
        if (type && value) {
            // Forzar recarga desde localStorage
            const city = getSelectedCityCode();
            if (city) {
                try {
                    const raw = localStorage.getItem(`ingresosCaja_${city}`);
                    let allInflows = raw ? JSON.parse(raw) : [];
                    if (!Array.isArray(allInflows)) allInflows = [];
                    
                    let filtered = [];
                    const searchValue = value.toLowerCase().trim();
                    
                    switch (type) {
                        case 'number':
                        case 'inflowNumber':
                            filtered = allInflows.filter(inflow => {
                                const numero = String(inflow.numero || '').toLowerCase().trim();
                                return numero.includes(searchValue) || 
                                       numero.replace(/^0+/, '') === searchValue.replace(/^0+/, '');
                            });
                            break;
                        case 'holderName':
                            filtered = allInflows.filter(inflow => {
                                const holderName = String(inflow.holderName || '').toLowerCase().trim();
                                return holderName.includes(searchValue);
                            });
                            break;
                        case 'holderId':
                            filtered = allInflows.filter(inflow => {
                                const holderId = String(inflow.holderId || '').toLowerCase().trim();
                                return holderId.includes(searchValue);
                            });
                            break;
                        default:
                            filtered = allInflows;
                    }
                    
                    renderInflowSearchResults(filtered);
                } catch (e) {
                    console.error('Error al recargar resultados:', e);
                    handleSearchInflow();
                }
            } else {
                handleSearchInflow();
            }
        }
    }
}

function confirmToggleInflow() {
    const { id, next } = window.__pendingInflowToggle || {};
    const modal = document.getElementById('confirmToggleInflowModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    if (typeof id !== 'number' && typeof id !== 'string') return;
    
    // Actualizar el checkbox visualmente antes de cambiar el estado
    const city = getSelectedCityCode();
    if (city) {
        try {
            // Actualizar checkbox en tabla principal
            const mainTable = document.getElementById('cashInflowTableBody');
            if (mainTable) {
                const row = mainTable.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = !!next;
                    }
                }
            }
            // Actualizar checkbox en modal de resultados
            const resultsTable = document.getElementById('inflowSearchResultsBody');
            if (resultsTable) {
                const row = resultsTable.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = !!next;
                    }
                }
            }
        } catch (e) {
            console.error('Error al actualizar checkbox:', e);
        }
    }
    
    toggleInflowState(Number(id), !!next);
}

function toggleInflowState(id, isActive) {
    try {
        const city = getSelectedCityCode();
        if (!city) {
            showNotification('Debe seleccionar una ciudad primero', 'warning');
            return;
        }
        
        const raw = localStorage.getItem(`ingresosCaja_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) {
            showNotification('Error en el formato de datos', 'error');
            return;
        }
        const idx = list.findIndex(i => i.id === id);
        
        if (idx !== -1) {
            // Asegurar que el estado se guarde correctamente
            list[idx].estado = isActive ? 'activo' : 'anulado';
            console.log(`Actualizando estado del ingreso ${id}: ${list[idx].estado}, isActive=${isActive}`);
            localStorage.setItem(`ingresosCaja_${city}`, JSON.stringify(list));
            
            // Verificar que se guardó correctamente
            const verify = JSON.parse(localStorage.getItem(`ingresosCaja_${city}`));
            const verifyItem = verify.find(i => i.id === id);
            console.log(`Verificación: ingreso ${id} tiene estado="${verifyItem?.estado}"`);
            
            // Actualizar tabla principal
            loadCashInflowData();
            
            // Guardar si el modal de resultados está abierto
            const resultsModal = document.getElementById('inflowResultsModal');
            const wasResultsModalOpen = (resultsModal && resultsModal.style.display === 'flex');
            
            // Mostrar modal de éxito
            const successModal = document.getElementById('successToggleInflowModal');
            const successText = document.getElementById('successToggleInflowText');
            if (successText) {
                successText.textContent = isActive 
                    ? 'Ingreso activado exitosamente.'
                    : 'Ingreso anulado exitosamente.';
            }
            if (successModal) {
                successModal.style.display = 'flex';
                successModal.style.zIndex = '25000';
                document.body.style.overflow = 'hidden';
            }
            
            // Guardar estado del modal de resultados para restaurarlo después
            window.__wasResultsModalOpenForToggle = wasResultsModalOpen;
            
            // Si el modal de resultados está abierto, actualizarlo inmediatamente
            if (wasResultsModalOpen) {
                // Actualizar directamente la fila en el modal de resultados sin recargar todo
                const resultsTable = document.getElementById('inflowSearchResultsBody');
                if (resultsTable) {
                    const row = resultsTable.querySelector(`tr[data-id="${id}"]`);
                    if (row) {
                        // Calcular el nuevo estado opuesto para los eventos
                        const newState = !isActive;
                        const newStateStr = newState ? 'true' : 'false';
                        
                        // Actualizar el badge de estado
                        const badge = row.querySelector('[data-status]');
                        if (badge) {
                            badge.textContent = isActive ? 'ACTIVO' : 'ANULADO';
                            badge.className = `status-badge ${isActive ? 'active' : 'inactive'}`;
                        }
                        // Actualizar el checkbox
                        const checkbox = row.querySelector('input[type="checkbox"]');
                        if (checkbox) {
                            checkbox.checked = isActive;
                            // Actualizar el onchange con el nuevo estado
                            checkbox.setAttribute('onchange', `event.preventDefault(); requestToggleInflow(${id}, ${newStateStr});`);
                        }
                        // Actualizar el aria-checked y onkeydown del label
                        const label = row.querySelector('.status-toggle');
                        if (label) {
                            label.setAttribute('aria-checked', isActive ? 'true' : 'false');
                            // Actualizar el onkeydown con el nuevo estado
                            label.setAttribute('onkeydown', `if(event.key==='Enter'||event.key===' '){ event.preventDefault(); requestToggleInflow(${id}, ${newStateStr}); }`);
                        }
                        // Actualizar la clase de la fila
                        row.className = `status-${isActive ? 'active' : 'inactive'}`;
                    }
                }
            }
        } else {
            showNotification('Ingreso no encontrado', 'error');
        }
    } catch (e) {
        console.error('Error al cambiar estado del ingreso:', e);
        showNotification('Error al cambiar el estado del ingreso', 'error');
    }
}

function closeSuccessToggleInflowModal() {
    const modal = document.getElementById('successToggleInflowModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Restaurar modal de resultados si estaba abierto antes del toggle
    if (window.__wasResultsModalOpenForToggle) {
        // Pequeño delay para asegurar que el modal de éxito se cierre completamente
        setTimeout(() => {
            const resultsModal = document.getElementById('inflowResultsModal');
            if (resultsModal) {
                // Recargar resultados con los mismos criterios
                const type = document.getElementById('inflowSearchType')?.value;
                const value = document.getElementById('searchInflowValue')?.value.trim();
                if (type && value) {
                    // Forzar recarga desde localStorage para obtener datos actualizados
                    const city = getSelectedCityCode();
                    if (city) {
                        try {
                            // Leer directamente desde localStorage para asegurar datos frescos
                            const raw = localStorage.getItem(`ingresosCaja_${city}`);
                            let allInflows = raw ? JSON.parse(raw) : [];
                            if (!Array.isArray(allInflows)) allInflows = [];
                            
                            console.log('📊 Recargando resultados después de toggle. Total ingresos:', allInflows.length);
                            
                            // Filtrar según el tipo de búsqueda
                            let filtered = [];
                            const searchValue = value.toLowerCase().trim();
                            
                            switch (type) {
                                case 'number':
                                case 'inflowNumber':
                                    filtered = allInflows.filter(inflow => {
                                        const numero = String(inflow.numero || '').toLowerCase().trim();
                                        return numero.includes(searchValue) || 
                                               numero.replace(/^0+/, '') === searchValue.replace(/^0+/, '');
                                    });
                                    break;
                                case 'holderName':
                                    filtered = allInflows.filter(inflow => {
                                        const holderName = String(inflow.holderName || '').toLowerCase().trim();
                                        return holderName.includes(searchValue);
                                    });
                                    break;
                                case 'holderId':
                                    filtered = allInflows.filter(inflow => {
                                        const holderId = String(inflow.holderId || '').toLowerCase().trim();
                                        return holderId.includes(searchValue);
                                    });
                                    break;
                                default:
                                    filtered = allInflows;
                            }
                            
                            console.log('📊 Ingresos filtrados:', filtered.length);
                            filtered.forEach(inflow => {
                                const estado = String(inflow.estado || 'activo').toLowerCase().trim();
                                const isActive = estado === 'activo';
                                console.log(`  - Ingreso ${inflow.numero}: estado="${estado}", isActive=${isActive}`);
                            });
                            
                            // Renderizar resultados actualizados
                            renderInflowSearchResults(filtered);
                            showInflowResultsModal();
                        } catch (e) {
                            console.error('Error al recargar resultados:', e);
                            // Fallback a handleSearchInflow
                            handleSearchInflow();
                        }
                    } else {
                        handleSearchInflow();
                    }
                } else {
                    // Si no hay criterios, solo mostrar el modal
                    showInflowResultsModal();
                }
            }
            window.__wasResultsModalOpenForToggle = false;
        }, 300); // Aumentar delay para asegurar que los datos estén guardados
    }
}

// ========================================
// FUNCIONES DE FORMATO
// ========================================

function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
}

function formatNumber(value) {
    if (value === null || value === undefined || value === '') return '0';
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
    if (isNaN(num)) return '0';
    // Formatear sin separadores de miles, como se muestra en la imagen
    return Math.floor(num).toString();
}

// ========================================
// NOTIFICACIONES
// ========================================

function showNotification(message, type = 'info') {
    console.log(`📢 Notificación [${type}]: ${message}`);

    // Remover notificación anterior si existe
    const existingNotification = document.querySelector('.notification');
    if (existingNotification && existingNotification.parentNode) {
        existingNotification.parentNode.removeChild(existingNotification);
    }

    // Crear nueva notificación (toast esquina superior derecha)
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Ocultar después de 3s
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
// FUNCIONES DE MODAL DE CERRAR SESIÓN
// ========================================

window.showConfirmLogoutModal = function() {
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

window.cancelLogout = function() {
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

window.confirmLogout = function() {
    // Limpiar datos de sesión
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Redirigir al index
    window.location.href = '../../../index.html';
}

// ========================================
// FUNCIONES DE VERIFICACIÓN Y RESTAURACIÓN DE CIUDADES
// ========================================

/**
 * Verifica y restaura datos de ciudades si es necesario
 */
function verificarDatosCiudades() {
    console.log('🔍 Verificando datos de ciudades...');
    
    const raw = localStorage.getItem('ciudadesData');
    if (!raw) {
        console.log('❌ No hay datos de ciudades en localStorage');
        return false;
    }
    
    try {
        const data = JSON.parse(raw);
        console.log('📊 Datos de ciudades encontrados:', data);
        
        // Verificar si Bogotá está presente
        const bogota = data['101'] || data['BOGOTA'] || Object.values(data).find(c => 
            c.nombre && c.nombre.toLowerCase().includes('bogota')
        );
        
        if (bogota) {
            console.log('✅ Bogotá encontrada:', bogota);
            return true;
        } else {
            console.log('❌ Bogotá no encontrada en los datos');
            return false;
        }
    } catch (e) {
        console.error('❌ Error parseando datos de ciudades:', e);
        return false;
    }
}

/**
 * Restaura datos básicos de ciudades si no existen
 */
function restaurarDatosCiudadesBasicos() {
    console.log('🔄 Restaurando datos básicos de ciudades...');
    
    const ciudadesBasicas = {
        '101': {
            codigo: '101',
            nombre: 'Bogotá',
            activo: true
        },
        '110': {
            codigo: '110',
            nombre: 'Cali',
            activo: true
        },
        '050': {
            codigo: '050',
            nombre: 'Medellín',
            activo: true
        }
    };
    
    localStorage.setItem('ciudadesData', JSON.stringify(ciudadesBasicas));
    console.log('✅ Datos básicos de ciudades restaurados');
    return ciudadesBasicas;
}

