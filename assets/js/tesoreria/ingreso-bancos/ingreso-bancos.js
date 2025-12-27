/**
 * 💰 FUNCIONALIDAD INGRESO A BANCOS - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de ingreso a bancos.
 * Incluye gestión de modales y operaciones CRUD para ingresos a bancos.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let bankInflowData = [];

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando carga de interfaz de ingreso a bancos...');
        
        // Inicializar componentes básicos
        initializeModals();
        initializeUserDropdown();
        initializeUppercaseInputs();
        initializeNumericFormatting();
        
        console.log('✅ Componentes básicos inicializados');
        
        // Verificar datos de ciudades y mostrar modal INMEDIATAMENTE
        initializeCitySelection();
        
        console.log('✅ Interfaz de ingreso a bancos cargada correctamente');
        
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
                // No cerrar modales de confirmación o éxito haciendo clic fuera
                if (this.id === 'confirmCreateInflowModal' || 
                    this.id === 'successCreateInflowModal' ||
                    this.id === 'confirmUpdateInflowModal' ||
                    this.id === 'successUpdateInflowModal' ||
                    this.id === 'confirmToggleInflowModal' ||
                    this.id === 'successToggleInflowModal') {
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

    // Botón de crear ingreso
    const bCrearIngreso = document.getElementById('bCrearIngreso');
    if (bCrearIngreso) {
        bCrearIngreso.addEventListener('click', handleCreateInflow);
    }

    // Botón de actualizar ingreso
    const bActualizarIngreso = document.getElementById('bActualizarIngreso');
    if (bActualizarIngreso) {
        bActualizarIngreso.addEventListener('click', handleUpdateInflow);
    }

    // Actualizar placeholder de búsqueda según tipo
    const inflowSearchType = document.getElementById('inflowSearchType');
    if (inflowSearchType) {
        inflowSearchType.addEventListener('change', updateInflowSearchPlaceholder);
    }
}

function hideAllModals() {
    // Solo cerrar modales principales, no los de confirmación o éxito
    const modalsToClose = ['createInflowModal', 'editInflowModal', 'searchInflowModal', 'inflowResultsModal', 'cashInflowSelectionModal'];
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
    bankInflowData = [];
    renderBankInflowTable(bankInflowData);
    
    // Ocultar botón "Cambiar Ciudad" inicialmente
    updateChangeCityButtonVisibility();
    
    // Mostrar modal inmediatamente
    console.log('⏰ Mostrando modal de selección de ciudad...');
    showSelectCityModal();
}

function showSelectCityModal() {
    const modal = document.getElementById('selectCityModal');
    if (modal) {
        populateCitySelectOptions();
        // Si ya hay una ciudad seleccionada, preseleccionarla
        const currentCity = getSelectedCityCode();
        const citySelect = document.getElementById('citySelect');
        if (citySelect && currentCity) {
            citySelect.value = currentCity;
        }
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';
        document.body.style.overflow = 'hidden';
        setTimeout(() => { 
            if (citySelect) citySelect.focus(); 
        }, 100);
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

    // Mostrar botón "Cambiar Ciudad" ahora que hay una ciudad seleccionada
    updateChangeCityButtonVisibility();

    // Cargar datos dependientes de la ciudad
    loadBankInflowData();

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

// ========================================
// CARGA DE CUENTAS BANCARIAS
// ========================================

function populateBankAccountsSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Limpiar opciones existentes excepto la primera
    select.innerHTML = '<option value="">Seleccione una cuenta</option>';
    
    try {
        // Obtener cuentas bancarias desde localStorage
        const raw = localStorage.getItem('bankAccountsData');
        const accounts = raw ? JSON.parse(raw) : [];
        
        if (!Array.isArray(accounts) || accounts.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay cuentas bancarias disponibles';
            option.disabled = true;
            select.appendChild(option);
            return;
        }
        
        // Filtrar solo las cuentas activas
        const activeAccounts = accounts.filter(account => account.estado === 'activo');
        
        if (activeAccounts.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay cuentas bancarias activas';
            option.disabled = true;
            select.appendChild(option);
            return;
        }
        
        // Ordenar por nombre de banco
        activeAccounts.sort((a, b) => {
            const nameA = (a.nombreBanco || '').toUpperCase();
            const nameB = (b.nombreBanco || '').toUpperCase();
            return nameA.localeCompare(nameB);
        });
        
        // Agregar opciones al select
        activeAccounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.numeroCuenta;
            option.textContent = `${account.nombreBanco} - ${account.numeroCuenta}`;
            select.appendChild(option);
        });
        
    } catch (e) {
        console.error('Error al cargar cuentas bancarias:', e);
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Error al cargar cuentas';
        option.disabled = true;
        select.appendChild(option);
    }
}

// ========================================
// SELECCIÓN DE INGRESO A CAJA
// ========================================

let isEditingMode = false;

function showCashInflowSelectionModal(editing = false) {
    isEditingMode = editing;
    const modal = document.getElementById('cashInflowSelectionModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    modal.style.zIndex = '20000';
    loadCashInflowsForSelection();
    initializeCashInflowSearch();
}

function hideCashInflowSelectionModal() {
    const modal = document.getElementById('cashInflowSelectionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function loadCashInflowsForSelection() {
    const tbody = document.getElementById('cashInflowsTableBody');
    if (!tbody) return;
    
    const city = getSelectedCityCode();
    if (!city) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6b7280;">Debe seleccionar una ciudad primero</td></tr>';
        return;
    }
    
    try {
        const raw = localStorage.getItem(`ingresosCaja_${city}`);
        const cashInflows = raw ? JSON.parse(raw) : [];
        
        if (!Array.isArray(cashInflows) || cashInflows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6b7280;">No hay ingresos a caja disponibles</td></tr>';
            return;
        }
        
        // Filtrar solo ingresos activos
        const activeInflows = cashInflows.filter(inflow => inflow.estado === 'activo');
        
        if (activeInflows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6b7280;">No hay ingresos a caja activos disponibles</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        activeInflows.forEach(inflow => {
            const row = createCashInflowRow(inflow);
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error al cargar ingresos a caja:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #dc2626;">Error al cargar los ingresos a caja</td></tr>';
    }
}

function initializeCashInflowSearch() {
    const searchInput = document.getElementById('cashInflowSearchInput');
    if (!searchInput) return;
    
    searchInput.value = '';
    
    if (searchInput.hasAttribute('data-search-initialized')) {
        return;
    }
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterCashInflows(searchTerm);
    });
    
    searchInput.setAttribute('data-search-initialized', 'true');
}

function filterCashInflows(searchTerm) {
    const tbody = document.getElementById('cashInflowsTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr.cash-inflow-row');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const numero = row.getAttribute('data-numero')?.toLowerCase() || '';
        const concepto = row.getAttribute('data-concepto')?.toLowerCase() || '';
        const titular = row.getAttribute('data-titular')?.toLowerCase() || '';
        
        const matches = numero.includes(searchTerm) || concepto.includes(searchTerm) || titular.includes(searchTerm);
        
        if (matches || searchTerm === '') {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Mostrar mensaje si no hay resultados
    const existingMessage = tbody.querySelector('.no-results-message');
    if (visibleCount === 0 && searchTerm !== '') {
        if (!existingMessage) {
            const noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results-message';
            noResultsRow.innerHTML = '<td colspan="4" style="text-align: center; padding: 2rem; color: #6b7280; font-style: italic;">No se encontraron ingresos a caja que coincidan con la búsqueda</td>';
            tbody.appendChild(noResultsRow);
        }
    } else if (existingMessage) {
        existingMessage.remove();
    }
}

function createCashInflowRow(inflow) {
    const row = document.createElement('tr');
    row.className = 'cash-inflow-row';
    row.onclick = () => {
        // Remover selección anterior
        document.querySelectorAll('#cashInflowSelectionModal .table tbody tr.cash-inflow-row.selected').forEach(r => {
            r.classList.remove('selected');
        });
        // Agregar selección actual
        row.classList.add('selected');
        selectCashInflow(inflow);
    };
    
    const concepto = inflow.observaciones || 'Sin concepto';
    const tipoIngreso = inflow.tipoIngresoCodigo || inflow.tipo || '';
    const valor = formatNumberWithDecimals(inflow.valor || 0);
    const numero = inflow.numero || 'N/A';
    
    // Guardar datos para búsqueda
    row.setAttribute('data-numero', (numero + ' ' + tipoIngreso).toLowerCase());
    row.setAttribute('data-concepto', concepto.toLowerCase());
    row.setAttribute('data-titular', (inflow.holderName || '').toLowerCase());
    
    row.innerHTML = `
        <td>${numero} ${tipoIngreso}</td>
        <td>${tipoIngreso}</td>
        <td>${valor}</td>
        <td>${concepto}</td>
    `;
    
    return row;
}

function formatNumberWithDecimals(num) {
    if (!num && num !== 0) return '0.00';
    return parseFloat(num).toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function selectCashInflow(cashInflow) {
    const concepto = cashInflow.observaciones || '';
    const valor = cashInflow.valor || 0;
    
    if (isEditingMode) {
        // Modo edición
        const conceptInput = document.getElementById('editInflowConcept');
        const dataInput = document.getElementById('editInflowCashInflowData');
        const valueInput = document.getElementById('editInflowValue');
        
        if (conceptInput) {
            conceptInput.value = concepto;
        }
        if (dataInput) {
            dataInput.value = JSON.stringify(cashInflow);
        }
        if (valueInput) {
            valueInput.value = formatNumber(valor);
        }
    } else {
        // Modo creación
        const conceptInput = document.getElementById('inflowConcept');
        const dataInput = document.getElementById('inflowCashInflowData');
        const valueInput = document.getElementById('inflowValue');
        
        if (conceptInput) {
            conceptInput.value = concepto;
        }
        if (dataInput) {
            dataInput.value = JSON.stringify(cashInflow);
        }
        if (valueInput) {
            valueInput.value = formatNumber(valor);
        }
    }
    
    hideCashInflowSelectionModal();
    showNotification(`Ingreso a caja #${cashInflow.numero || 'N/A'} seleccionado`, 'success');
}

function updateChangeCityButtonVisibility() {
    const changeCityBtn = document.getElementById('changeCityButton');
    const city = getSelectedCityCode();
    
    if (changeCityBtn) {
        // Mostrar solo si hay una ciudad seleccionada
        if (city) {
            changeCityBtn.style.display = 'flex';
        } else {
            changeCityBtn.style.display = 'none';
        }
    }
}

// ========================================
// INICIALIZACIÓN DE COMPONENTES
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
                    // Lógica de administrar usuarios
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

function initializeUppercaseInputs() {
    const uppercaseInputs = document.querySelectorAll('.uppercase-input');
    uppercaseInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    });
}

function initializeNumericFormatting() {
    // Inputs con formato de número (con separadores de miles)
    const numericInputs = document.querySelectorAll('.numeric-input');
    numericInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = this.value.replace(/[^\d]/g, '');
            if (value) {
                this.value = formatNumber(parseInt(value, 10));
            } else {
                this.value = '';
            }
        });
    });
    
    // Inputs numéricos sin formato (solo números enteros)
    const numericPlainInputs = document.querySelectorAll('.numeric-plain-input');
    numericPlainInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            // Solo permitir números, sin formato
            this.value = this.value.replace(/[^\d]/g, '');
        });
    });
}

function updateInflowSearchPlaceholder() {
    const type = document.getElementById('inflowSearchType')?.value;
    const input = document.getElementById('searchInflowValue');
    const label = document.getElementById('inflowSearchLabel');
    
    if (!input || !label) return;
    
    switch(type) {
        case 'number':
            input.placeholder = 'Ingrese el número de ingreso';
            label.textContent = 'Número de Ingreso *';
            break;
        case 'holderId':
            input.placeholder = 'Ingrese la identificación del titular';
            label.textContent = 'Identificación del Titular *';
            break;
        case 'holderName':
            input.placeholder = 'Ingrese el nombre del titular';
            label.textContent = 'Nombre del Titular *';
            break;
        case 'voucher':
            input.placeholder = 'Ingrese el número de papeleta';
            label.textContent = 'Número de Papeleta *';
            break;
        default:
            input.placeholder = 'Ingrese el valor a buscar';
            label.textContent = 'Valor de Búsqueda *';
    }
}

// ========================================
// MODALES DE INGRESO A BANCOS
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
        clearCreateInflowForm();
        loadNextInflowNumber();
        // Cargar cuentas bancarias en el select
        populateBankAccountsSelect('inflowAccount');
        // Limpiar campo de concepto
        const conceptInput = document.getElementById('inflowConcept');
        const dataInput = document.getElementById('inflowCashInflowData');
        if (conceptInput) conceptInput.value = '';
        if (dataInput) dataInput.value = '';
        // Establecer solo fecha de hoy por defecto, fecha documento queda en blanco
        const today = new Date().toISOString().split('T')[0];
        const dateTodayEl = document.getElementById('inflowDateToday');
        const dateDocEl = document.getElementById('inflowDocumentDate');
        if (dateTodayEl) dateTodayEl.value = today;
        if (dateDocEl) dateDocEl.value = ''; // Fecha documento en blanco para que el usuario la ingrese
    }
}

function hideCreateInflowModal() {
    const modal = document.getElementById('createInflowModal');
    if (modal) modal.style.display = 'none';
    clearCreateInflowForm();
    window.__editingInflowId = null;
}

function showEditInflowModal(id) {
    const inflow = bankInflowData.find(i => i.id === id);
    if (!inflow) {
        showNotification('Ingreso no encontrado', 'error');
        return;
    }
    
    window.__editingInflowId = id;
    const modalOverlay = document.getElementById('editInflowModal');
    if (modalOverlay) {
        modalOverlay.style.display = 'flex';
        // Asegurar que el modal de editar aparezca encima del de resultados
        modalOverlay.style.zIndex = '3000';
        
        // Cargar cuentas bancarias en el select
        populateBankAccountsSelect('editInflowAccount');
        
        // Llenar formulario con datos
        document.getElementById('editInflowNumber').value = inflow.numero || '';
        // Establecer el valor del select después de cargar las opciones
        setTimeout(() => {
            const accountSelect = document.getElementById('editInflowAccount');
            if (accountSelect) {
                accountSelect.value = inflow.cuenta || '';
            }
        }, 100);
        document.getElementById('editInflowDateToday').value = inflow.fechaHoy || '';
        document.getElementById('editInflowDocumentDate').value = inflow.fechaDocumento || '';
        document.getElementById('editInflowValue').value = formatNumber(inflow.valor || 0);
        document.getElementById('editInflowVoucher').value = inflow.papeleta || '';
        // Llenar concepto
        const conceptInput = document.getElementById('editInflowConcept');
        if (conceptInput) {
            conceptInput.value = inflow.concepto || '';
        }
        // Llenar datos del ingreso a caja si existen
        const cashInflowDataInput = document.getElementById('editInflowCashInflowData');
        if (cashInflowDataInput && inflow.cashInflowData) {
            cashInflowDataInput.value = inflow.cashInflowData;
        }
    }
}

function hideEditInflowModal() {
    const modal = document.getElementById('editInflowModal');
    if (modal) modal.style.display = 'none';
    window.__editingInflowId = null;
}

function showInflowResultsModal() {
    const modal = document.getElementById('inflowResultsModal');
    if (modal) modal.style.display = 'flex';
}

function hideInflowResultsModal() {
    const modal = document.getElementById('inflowResultsModal');
    if (modal) modal.style.display = 'none';
}

// ========================================
// GESTIÓN DE DATOS
// ========================================

function loadBankInflowData() {
    const city = getSelectedCityCode();
    if (!city) {
        bankInflowData = [];
        renderBankInflowTable([]);
        return;
    }
    
    try {
        // Cargar datos por ciudad
        const raw = localStorage.getItem(`bankInflowData_${city}`);
        bankInflowData = raw ? JSON.parse(raw) : [];
        renderBankInflowTable(bankInflowData);
    } catch (e) {
        console.error('Error al cargar datos:', e);
        bankInflowData = [];
        renderBankInflowTable([]);
    }
}

function saveBankInflowData() {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    try {
        localStorage.setItem(`bankInflowData_${city}`, JSON.stringify(bankInflowData));
    } catch (e) {
        console.error('Error al guardar datos:', e);
        showNotification('Error al guardar los datos', 'error');
    }
}

function loadNextInflowNumber() {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    // Obtener el consecutivo inicial de ingreso a bancos desde el sistema de consecutivos
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
                if (latestConsecutivo.ingresoBanco) {
                    consecutiveStart = parseInt(latestConsecutivo.ingresoBanco, 10) || 1;
                    nextNumber = consecutiveStart;
                }
            }
        }
    } catch (e) {
        console.error('Error obteniendo consecutivos:', e);
    }
    
    // Verificar si hay un puntero guardado del siguiente número a usar
    try {
        const persisted = parseInt(localStorage.getItem(`nextBankInflowNumber_${city}`) || '0', 10);
        if (persisted && persisted >= consecutiveStart) {
            nextNumber = persisted;
        }
        
        // Asegurar que sea mayor al máximo ya usado en la ciudad
        const raw = localStorage.getItem(`bankInflowData_${city}`);
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
        numberInput.value = nextNumber.toString();
    }
}

// ========================================
// RENDERIZADO DE TABLA
// ========================================

function renderBankInflowTable(list) {
    const tbody = document.getElementById('bankInflowTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!list || list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-university"></i>
                        <p>No existen registros de ingresos a bancos</p>
                        <small>Haz clic en "Crear Ingreso" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    list.forEach(inflow => {
        const row = document.createElement('tr');
        row.className = `status-${inflow.estado === 'activo' ? 'active' : 'inactive'}`;
        row.innerHTML = `
            <td>${inflow.numero || ''}</td>
            <td>${formatDate(inflow.fechaHoy) || ''}</td>
            <td>${formatDate(inflow.fechaDocumento) || ''}</td>
            <td>${inflow.cuenta || ''}</td>
            <td>$${formatNumber(inflow.valor || 0)}</td>
            <td>${inflow.papeleta || ''}</td>
            <td>${inflow.concepto || ''}</td>
            <td class="status-column"><span class="status-badge ${inflow.estado === 'activo' ? 'active' : 'inactive'}">${inflow.estado === 'activo' ? 'ACTIVO' : 'ANULADO'}</span></td>
            <td class="options-column">
                <div class="action-buttons-cell status-toggle-container">
                    <button class="btn-icon btn-edit" onclick="editInflow(${inflow.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <label class="status-toggle" title="Activar/Anular" style="margin:0 6px;" tabindex="0" role="switch" aria-checked="${inflow.estado === 'activo' ? 'true' : 'false'}"
                        onkeydown="if(event.key==='Enter'||event.key===' '){ event.preventDefault(); const inp=this.querySelector('input'); inp.checked=!inp.checked; requestToggleInflow(${inflow.id}, inp.checked); }">
                        <input type="checkbox" ${inflow.estado === 'activo' ? 'checked' : ''} onchange="requestToggleInflow(${inflow.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========================================
// OPERACIONES CRUD
// ========================================

function clearCreateInflowForm() {
    const form = document.getElementById('createInflowForm');
    if (form) form.reset();
}

function handleCreateInflow() {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    const form = document.getElementById('createInflowForm');
    if (!form) return;
    
    // Validar campos requeridos
    const numero = document.getElementById('inflowNumber')?.value.trim();
    const cuenta = document.getElementById('inflowAccount')?.value.trim();
    const fechaHoy = document.getElementById('inflowDateToday')?.value;
    const fechaDocumento = document.getElementById('inflowDocumentDate')?.value;
    const valor = document.getElementById('inflowValue')?.value.replace(/[^\d]/g, '');
    const papeleta = document.getElementById('inflowVoucher')?.value.trim();
    const concepto = document.getElementById('inflowConcept')?.value.trim();
    
    if (!numero || !cuenta || !fechaHoy || !fechaDocumento || !valor || !papeleta || !concepto) {
        showNotification('Por favor, complete todos los campos requeridos', 'warning');
        return;
    }
    
    // Mostrar modal de confirmación
    showConfirmCreateInflowModal();
}

function confirmCreateInflow() {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    const numero = document.getElementById('inflowNumber')?.value.trim();
    const cuenta = document.getElementById('inflowAccount')?.value.trim();
    const fechaHoy = document.getElementById('inflowDateToday')?.value;
    const fechaDocumento = document.getElementById('inflowDocumentDate')?.value;
    const valor = parseInt(document.getElementById('inflowValue')?.value.replace(/[^\d]/g, '') || '0', 10);
    const papeleta = document.getElementById('inflowVoucher')?.value.trim();
    const concepto = document.getElementById('inflowConcept')?.value.trim();
    const cashInflowData = document.getElementById('inflowCashInflowData')?.value || '';
    
    // Extraer número de ingreso a caja del JSON si existe
    let numeroIngresoCaja = '';
    if (cashInflowData) {
        try {
            const cashInflow = JSON.parse(cashInflowData);
            numeroIngresoCaja = cashInflow.numero || '';
        } catch (e) {
            console.error('Error parseando cashInflowData:', e);
        }
    }
    
    const newInflow = {
        id: Date.now(),
        numero: numero,
        cuenta: cuenta,
        fechaHoy: fechaHoy,
        fechaDocumento: fechaDocumento,
        valor: valor,
        papeleta: papeleta,
        concepto: concepto,
        estado: 'activo',
        cashInflowData: cashInflowData, // Guardar referencia completa al ingreso a caja
        numeroIngresoCaja: numeroIngresoCaja // Guardar número de ingreso a caja para búsqueda fácil
    };
    
    bankInflowData.push(newInflow);
    saveBankInflowData();
    
    // Actualizar tabla de CARTERA automáticamente si hay cashInflowData
    try {
        if (cashInflowData && window.CarteraManager && window.CarteraManager.updateCarteraFromInflow) {
            const cashInflow = JSON.parse(cashInflowData);
            window.CarteraManager.updateCarteraFromInflow(cashInflow, city, 'banco');
        }
    } catch (e) {
        console.error('Error actualizando cartera desde ingreso a banco:', e);
    }
    
    // Actualizar el puntero del siguiente número consecutivo
    const numeroIngreso = parseInt(numero, 10) || 0;
    if (numeroIngreso > 0) {
        localStorage.setItem(`nextBankInflowNumber_${city}`, String(numeroIngreso + 1));
    }
    
    renderBankInflowTable(bankInflowData);
    
    hideConfirmCreateInflowModal();
    hideCreateInflowModal();
    showSuccessCreateInflowModal();
}

function cancelCreateInflow() {
    hideConfirmCreateInflowModal();
}

function editInflow(id) {
    showEditInflowModal(id);
}

function handleUpdateInflow() {
    if (!window.__editingInflowId) return;
    
    const numero = document.getElementById('editInflowNumber')?.value.trim();
    const cuenta = document.getElementById('editInflowAccount')?.value.trim();
    const fechaHoy = document.getElementById('editInflowDateToday')?.value;
    const fechaDocumento = document.getElementById('editInflowDocumentDate')?.value;
    const valor = document.getElementById('editInflowValue')?.value.replace(/[^\d]/g, '');
    const papeleta = document.getElementById('editInflowVoucher')?.value.trim();
    const concepto = document.getElementById('editInflowConcept')?.value.trim();
    const cashInflowData = document.getElementById('editInflowCashInflowData')?.value || '';
    
    // Extraer número de ingreso a caja del JSON si existe
    let numeroIngresoCaja = '';
    if (cashInflowData) {
        try {
            const cashInflow = JSON.parse(cashInflowData);
            numeroIngresoCaja = cashInflow.numero || '';
        } catch (e) {
            console.error('Error parseando cashInflowData:', e);
        }
    }
    
    if (!numero || !cuenta || !fechaHoy || !fechaDocumento || !valor || !papeleta || !concepto) {
        showNotification('Por favor, complete todos los campos requeridos', 'warning');
        return;
    }
    
    showConfirmUpdateInflowModal();
}

function confirmUpdateInflow() {
    if (!window.__editingInflowId) return;
    
    const inflow = bankInflowData.find(i => i.id === window.__editingInflowId);
    if (!inflow) {
        showNotification('Ingreso no encontrado', 'error');
        return;
    }
    
    // Obtener valores del formulario
    const numero = document.getElementById('editInflowNumber')?.value.trim();
    const cuenta = document.getElementById('editInflowAccount')?.value.trim();
    const fechaHoy = document.getElementById('editInflowDateToday')?.value;
    const fechaDocumento = document.getElementById('editInflowDocumentDate')?.value;
    const valor = parseInt(document.getElementById('editInflowValue')?.value.replace(/[^\d]/g, '') || '0', 10);
    const papeleta = document.getElementById('editInflowVoucher')?.value.trim();
    const concepto = document.getElementById('editInflowConcept')?.value.trim();
    const cashInflowData = document.getElementById('editInflowCashInflowData')?.value || '';
    
    // Extraer número de ingreso a caja del JSON si existe
    let numeroIngresoCaja = '';
    if (cashInflowData) {
        try {
            const cashInflow = JSON.parse(cashInflowData);
            numeroIngresoCaja = cashInflow.numero || '';
        } catch (e) {
            console.error('Error parseando cashInflowData:', e);
        }
    }
    
    inflow.numero = numero;
    inflow.cuenta = cuenta;
    inflow.fechaHoy = fechaHoy;
    inflow.fechaDocumento = fechaDocumento;
    inflow.valor = valor;
    inflow.papeleta = papeleta;
    inflow.concepto = concepto;
    inflow.cashInflowData = cashInflowData;
    inflow.numeroIngresoCaja = numeroIngresoCaja;
    
    saveBankInflowData();
    renderBankInflowTable(bankInflowData);
    
    // Si el modal de resultados de búsqueda está abierto, actualizar los resultados
    const resultsModal = document.getElementById('inflowResultsModal');
    if (resultsModal && resultsModal.style.display === 'flex') {
        // Buscar y actualizar la fila en los resultados
        const tbody = document.getElementById('inflowSearchResultsBody');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const editButton = row.querySelector('button[onclick*="editInflowFromSearch"]');
                if (editButton) {
                    const onclickAttr = editButton.getAttribute('onclick');
                    const match = onclickAttr.match(/editInflowFromSearch\((\d+)\)/);
                    if (match && parseInt(match[1]) === window.__editingInflowId) {
                        // Actualizar los datos de la fila
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 7) {
                            cells[0].textContent = numero || '';
                            cells[1].textContent = formatDate(fechaHoy) || '';
                            cells[2].textContent = formatDate(fechaDocumento) || '';
                            cells[3].textContent = cuenta || '';
                            cells[4].textContent = `$${formatNumber(valor || 0)}`;
                            cells[5].textContent = papeleta || '';
                            cells[6].textContent = concepto || '';
                        }
                    }
                }
            });
        }
    }
    
    hideConfirmUpdateInflowModal();
    hideEditInflowModal();
    showSuccessUpdateInflowModal();
}

function cancelUpdateInflow() {
    hideConfirmUpdateInflowModal();
}

function requestToggleInflow(id, checked) {
    window.__togglingInflowId = id;
    window.__togglingInflowState = checked;
    showConfirmToggleInflowModal(checked);
}

function confirmToggleInflow() {
    if (!window.__togglingInflowId) return;
    
    const inflow = bankInflowData.find(i => i.id === window.__togglingInflowId);
    if (!inflow) {
        showNotification('Ingreso no encontrado', 'error');
        return;
    }
    
    inflow.estado = window.__togglingInflowState ? 'activo' : 'anulado';
    saveBankInflowData();
    renderBankInflowTable(bankInflowData);
    
    // Si el modal de resultados de búsqueda está abierto, actualizar los resultados
    const resultsModal = document.getElementById('inflowResultsModal');
    if (resultsModal && resultsModal.style.display === 'flex') {
        // Obtener los resultados actuales y re-renderizarlos
        const tbody = document.getElementById('inflowSearchResultsBody');
        if (tbody) {
            // Buscar la fila que se actualizó y actualizar su contenido
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const editButton = row.querySelector('button[onclick*="editInflowFromSearch"]');
                if (editButton) {
                    const onclickAttr = editButton.getAttribute('onclick');
                    const match = onclickAttr.match(/editInflowFromSearch\((\d+)\)/);
                    if (match && parseInt(match[1]) === window.__togglingInflowId) {
                        // Actualizar el badge de estado
                        const statusBadge = row.querySelector('.status-badge');
                        if (statusBadge) {
                            const newEstado = window.__togglingInflowState ? 'activo' : 'anulado';
                            statusBadge.className = `status-badge ${newEstado === 'activo' ? 'active' : 'inactive'}`;
                            statusBadge.textContent = newEstado === 'activo' ? 'ACTIVO' : 'ANULADO';
                        }
                        // Actualizar la clase de la fila
                        row.className = `status-${window.__togglingInflowState ? 'active' : 'inactive'}`;
                        // Actualizar el toggle
                        const toggleInput = row.querySelector('.status-toggle input[type="checkbox"]');
                        if (toggleInput) {
                            toggleInput.checked = window.__togglingInflowState;
                        }
                        // Actualizar aria-checked
                        const toggleLabel = row.querySelector('.status-toggle');
                        if (toggleLabel) {
                            toggleLabel.setAttribute('aria-checked', window.__togglingInflowState ? 'true' : 'false');
                        }
                    }
                }
            });
        }
    }
    
    hideConfirmToggleInflowModal();
    showSuccessToggleInflowModal(window.__togglingInflowState);
    
    window.__togglingInflowId = null;
    window.__togglingInflowState = null;
}

function cancelToggleInflow() {
    hideConfirmToggleInflowModal();
    window.__togglingInflowId = null;
    window.__togglingInflowState = null;
}

// ========================================
// BÚSQUEDA
// ========================================

function handleSearchInflow() {
    const type = document.getElementById('inflowSearchType')?.value;
    const value = document.getElementById('searchInflowValue')?.value.trim();
    
    if (!type || !value) {
        showNotification('Por favor, complete los campos de búsqueda', 'warning');
        return;
    }
    
    let results = [];
    const searchValue = value.toLowerCase();
    
    switch(type) {
        case 'number':
            results = bankInflowData.filter(i => 
                (i.numero || '').toString().toLowerCase().includes(searchValue)
            );
            break;
        case 'holderId':
            // Buscar en los datos del ingreso a caja relacionado
            results = bankInflowData.filter(i => {
                if (!i.cashInflowData) return false;
                try {
                    const cashInflow = JSON.parse(i.cashInflowData);
                    const holderId = (cashInflow.holderId || '').toString().toLowerCase();
                    return holderId.includes(searchValue);
                } catch (e) {
                    return false;
                }
            });
            break;
        case 'holderName':
            // Buscar en los datos del ingreso a caja relacionado
            results = bankInflowData.filter(i => {
                if (!i.cashInflowData) return false;
                try {
                    const cashInflow = JSON.parse(i.cashInflowData);
                    const holderName = (cashInflow.holderName || '').toString().toLowerCase();
                    return holderName.includes(searchValue);
                } catch (e) {
                    return false;
                }
            });
            break;
        case 'voucher':
            results = bankInflowData.filter(i => 
                (i.papeleta || '').toString().toLowerCase().includes(searchValue)
            );
            break;
        default:
            results = [];
    }
    
    renderInflowSearchResults(results);
    hideSearchInflowModal();
    showInflowResultsModal();
}

function renderInflowSearchResults(results) {
    const tbody = document.getElementById('inflowSearchResultsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!results || results.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron resultados</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    results.forEach(inflow => {
        const row = document.createElement('tr');
        row.className = `status-${inflow.estado === 'activo' ? 'active' : 'inactive'}`;
        row.innerHTML = `
            <td>${inflow.numero || ''}</td>
            <td>${formatDate(inflow.fechaHoy) || ''}</td>
            <td>${formatDate(inflow.fechaDocumento) || ''}</td>
            <td>${inflow.cuenta || ''}</td>
            <td>$${formatNumber(inflow.valor || 0)}</td>
            <td>${inflow.papeleta || ''}</td>
            <td>${inflow.concepto || ''}</td>
            <td class="status-column"><span class="status-badge ${inflow.estado === 'activo' ? 'active' : 'inactive'}">${inflow.estado === 'activo' ? 'ACTIVO' : 'ANULADO'}</span></td>
            <td class="options-column">
                <div class="action-buttons-cell status-toggle-container">
                    <button class="btn-icon btn-edit" onclick="editInflowFromSearch(${inflow.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <label class="status-toggle" title="Activar/Anular" style="margin:0 6px;" tabindex="0" role="switch" aria-checked="${inflow.estado === 'activo' ? 'true' : 'false'}"
                        onkeydown="if(event.key==='Enter'||event.key===' '){ event.preventDefault(); const inp=this.querySelector('input'); inp.checked=!inp.checked; requestToggleInflow(${inflow.id}, inp.checked); }">
                        <input type="checkbox" ${inflow.estado === 'activo' ? 'checked' : ''} onchange="requestToggleInflow(${inflow.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editInflowFromSearch(id) {
    // No cerrar el modal de resultados, solo abrir el modal de editar encima
    editInflow(id);
}

// ========================================
// MODALES DE CONFIRMACIÓN Y ÉXITO
// ========================================

function showConfirmCreateInflowModal() {
    const modal = document.getElementById('confirmCreateInflowModal');
    if (modal) modal.style.display = 'flex';
}

function hideConfirmCreateInflowModal() {
    const modal = document.getElementById('confirmCreateInflowModal');
    if (modal) modal.style.display = 'none';
}

function showSuccessCreateInflowModal() {
    const modal = document.getElementById('successCreateInflowModal');
    if (modal) modal.style.display = 'flex';
}

function closeSuccessCreateInflowModal() {
    const modal = document.getElementById('successCreateInflowModal');
    if (modal) modal.style.display = 'none';
}

function showConfirmUpdateInflowModal() {
    const modal = document.getElementById('confirmUpdateInflowModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '4000';
    }
}

function hideConfirmUpdateInflowModal() {
    const modal = document.getElementById('confirmUpdateInflowModal');
    if (modal) modal.style.display = 'none';
}

function showSuccessUpdateInflowModal() {
    const modal = document.getElementById('successUpdateInflowModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '4000';
    }
}

function closeSuccessUpdateInflowModal() {
    const modal = document.getElementById('successUpdateInflowModal');
    if (modal) modal.style.display = 'none';
}

function showConfirmToggleInflowModal(checked) {
    const modal = document.getElementById('confirmToggleInflowModal');
    const text = document.getElementById('confirmToggleInflowText');
    if (modal) modal.style.display = 'flex';
    if (text) {
        text.textContent = checked 
            ? '¿Está segur@ que desea activar este ingreso?'
            : '¿Está segur@ que desea anular este ingreso?';
    }
}

function hideConfirmToggleInflowModal() {
    const modal = document.getElementById('confirmToggleInflowModal');
    if (modal) modal.style.display = 'none';
}

function showSuccessToggleInflowModal(checked) {
    const modal = document.getElementById('successToggleInflowModal');
    const text = document.getElementById('successToggleInflowText');
    if (modal) modal.style.display = 'flex';
    if (text) {
        text.textContent = checked 
            ? 'El ingreso fue activado correctamente.'
            : 'El ingreso fue anulado correctamente.';
    }
}

function closeSuccessToggleInflowModal() {
    const modal = document.getElementById('successToggleInflowModal');
    if (modal) modal.style.display = 'none';
}

// ========================================
// UTILIDADES
// ========================================

function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return parseInt(num, 10).toLocaleString('es-CO');
}

function formatDate(dateString) {
    if (!dateString) return '';
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

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

