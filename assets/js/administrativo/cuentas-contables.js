/**
 * 📊 FUNCIONALIDAD CUENTAS CONTABLES - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de mantenimiento de cuentas contables.
 * Permite crear y gestionar las cuentas contables asociadas a cada plan.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let accountingAccountsData = [];
const STORAGE_ACCOUNTS_BY_CITY = 'accountingAccountsDataByCity';

function toCityCode(value) {
    return String(value || '').trim().toUpperCase();
}

function getSelectedCityCode() {
    try {
        return toCityCode(sessionStorage.getItem('selectedCity') || '');
    } catch (e) {
        return '';
    }
}

function getCityNameByCode(cityCode) {
    const code = toCityCode(cityCode);
    if (!code) return '';
    try {
        const raw = localStorage.getItem('ciudadesData');
        const data = raw ? JSON.parse(raw) : {};
        const city = data && data[code] ? data[code] : null;
        return city && city.nombre ? String(city.nombre) : '';
    } catch (e) {
        return '';
    }
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando carga de interfaz de cuentas contables...');
        
        initializeModals();
        initializeUserDropdown();
        initializeCitySelector();
        initializeUppercaseInputs();
        initializeNumericFormatting();
        loadAccountingAccountsData();
        
        // Expandir ambas secciones por defecto
        setTimeout(() => {
            toggleAccountingSection('debito');
            toggleAccountingSection('credito');
        }, 100);
        
        console.log('✅ Interfaz de cuentas contables cargada correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico al cargar la interfaz:', error);
    }
});

// ========================================
// SELECCIÓN DE CIUDAD
// ========================================

function updateCurrentCityName(cityCode) {
    const el = document.getElementById('currentCityName');
    if (!el) return;
    const code = toCityCode(cityCode);
    if (!code) {
        el.textContent = 'Seleccione una ciudad';
        return;
    }
    const name = getCityNameByCode(code);
    el.textContent = name ? `${code} - ${String(name).toUpperCase()}` : code;
}

function updateChangeCityButtonVisibility() {
    const btn = document.getElementById('changeCityButton');
    if (!btn) return;
    btn.style.display = getSelectedCityCode() ? 'inline-flex' : 'none';
}

function populateCitySelectOptions() {
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) return;
    let ciudadesData = {};
    try {
        ciudadesData = JSON.parse(localStorage.getItem('ciudadesData') || '{}');
    } catch (e) {
        ciudadesData = {};
    }
    citySelect.innerHTML = '<option value="">Seleccione la ciudad</option>';
    Object.values(ciudadesData || {})
        .filter(c => c && c.codigo && c.activo !== false)
        .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
        .forEach(c => {
            const opt = document.createElement('option');
            const code = toCityCode(c.codigo);
            opt.value = code;
            opt.textContent = `${code} - ${String(c.nombre || '').toUpperCase()}`;
            citySelect.appendChild(opt);
        });
}

function showSelectCityModal() {
    const modal = document.getElementById('selectCityModal');
    if (!modal) return;
    populateCitySelectOptions();
    const citySelect = document.getElementById('citySelect');
    const selected = getSelectedCityCode();
    if (citySelect) citySelect.value = selected || '';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideSelectCityModal(force) {
    const modal = document.getElementById('selectCityModal');
    if (!modal) return;
    if (!force && !getSelectedCityCode()) return;
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function handleSelectCity() {
    const citySelect = document.getElementById('citySelect');
    const selectedCity = citySelect ? toCityCode(citySelect.value) : '';
    if (!selectedCity) {
        showNotification('Por favor, seleccione una ciudad', 'warning');
        return;
    }
    try {
        sessionStorage.setItem('selectedCity', selectedCity);
    } catch (e) {
        // No-op
    }
    updateCurrentCityName(selectedCity);
    updateChangeCityButtonVisibility();
    hideSelectCityModal(true);
    loadAccountingAccountsData();
    showNotification(`Ciudad seleccionada: ${selectedCity}${getCityNameByCode(selectedCity) ? ` - ${getCityNameByCode(selectedCity)}` : ''}`, 'success');
}

function initializeCitySelector() {
    updateCurrentCityName(getSelectedCityCode());
    updateChangeCityButtonVisibility();

    const btnChangeCity = document.getElementById('changeCityButton');
    const btnSelectCity = document.getElementById('bSeleccionarCiudad');
    const btnCloseSelectCity = document.getElementById('btnCerrarSelectCityModal');
    const modalSelectCity = document.getElementById('selectCityModal');

    if (btnChangeCity) btnChangeCity.addEventListener('click', showSelectCityModal);
    if (btnSelectCity) btnSelectCity.addEventListener('click', handleSelectCity);
    if (btnCloseSelectCity) btnCloseSelectCity.addEventListener('click', () => hideSelectCityModal(false));
    if (modalSelectCity) {
        modalSelectCity.addEventListener('click', function(e) {
            if (e.target === this) hideSelectCityModal(false);
        });
    }

    showSelectCityModal();
    if (!getSelectedCityCode()) {
        showNotification('Seleccione una ciudad para gestionar cuentas contables.', 'warning');
    }
}

// ========================================
// GESTIÓN DE MODALES
// ========================================

function initializeModals() {
    // Cerrar modales al hacer clic fuera
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                hideAllModals();
            }
        });
    });
    
    // Cerrar modales con Escape (excepto confirmación y éxito)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const confirmModal = document.getElementById('confirmCreateAccountingAccountModal');
            const successModal = document.getElementById('successCreateAccountingAccountModal');
            const toggleModal = document.getElementById('confirmToggleAccountingAccountModal');
            const toggleSuccessModal = document.getElementById('successToggleAccountingAccountModal');
            if (confirmModal && confirmModal.style.display === 'flex') {
                cancelCreateAccountingAccount();
            } else if (successModal && successModal.style.display === 'flex') {
                closeSuccessCreateAccountingAccountModal();
            } else if (toggleModal && toggleModal.style.display === 'flex') {
                cancelToggleAccountingAccount();
            } else if (toggleSuccessModal && toggleSuccessModal.style.display === 'flex') {
                closeSuccessToggleAccountingAccountModal();
            } else {
                hideAllModals();
            }
        }
    });

    // Botón de crear cuenta contable
    const bCrearCuentaContable = document.getElementById('bCrearCuentaContable');
    if (bCrearCuentaContable) {
        bCrearCuentaContable.addEventListener('click', handleCreateAccountingAccount);
    }
}

function hideAllModals() {
    // Solo cerrar modales principales, no los de confirmación o éxito
    const modalsToClose = ['createAccountingAccountModal'];
    modalsToClose.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// ========================================
// MODALES DE CUENTA CONTABLE
// ========================================

function showCreateAccountingAccountModal(tipo) {
    if (!getSelectedCityCode()) {
        showNotification('Seleccione una ciudad para crear cuentas contables', 'warning');
        showSelectCityModal();
        return;
    }
    const modal = document.getElementById('createAccountingAccountModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '6000';
        document.body.style.overflow = 'hidden';
        
        // Establecer el tipo de cuenta
        const accountTypeField = document.getElementById('accountType');
        if (accountTypeField) {
            accountTypeField.value = tipo || '';
        }
        
        // Cambiar el título del modal según el tipo
        const titleElement = document.getElementById('createAccountingAccountTitle');
        if (titleElement) {
            if (tipo === 'debito') {
                titleElement.textContent = 'CREAR CUENTA DÉBITO';
            } else if (tipo === 'credito') {
                titleElement.textContent = 'CREAR CUENTA CRÉDITO';
            } else {
                titleElement.textContent = 'CREAR CUENTA CONTABLE';
            }
        }
        
        clearCreateAccountingAccountForm();
    }
}

function hideCreateAccountingAccountModal() {
    const modal = document.getElementById('createAccountingAccountModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    clearCreateAccountingAccountForm();
}

function clearCreateAccountingAccountForm() {
    const form = document.getElementById('createAccountingAccountForm');
    if (form) {
        form.reset();
        // Mantener el tipo si ya estaba establecido
        const accountTypeField = document.getElementById('accountType');
        if (accountTypeField && accountTypeField.value) {
            // El tipo se mantiene
        }
    }
}

// ========================================
// CARGA DE DATOS
// ========================================

function loadAccountingAccountsData() {
    const selectedCity = getSelectedCityCode();
    if (!selectedCity) {
        accountingAccountsData = [];
        renderAccountingAccountsTable(accountingAccountsData);
        return;
    }
    try {
        const byCityRaw = localStorage.getItem(STORAGE_ACCOUNTS_BY_CITY);
        const byCity = byCityRaw ? JSON.parse(byCityRaw) : {};
        accountingAccountsData = (byCity && Array.isArray(byCity[selectedCity])) ? byCity[selectedCity] : [];
        if (!Array.isArray(accountingAccountsData)) accountingAccountsData = [];
    } catch (e) {
        console.error('Error al cargar datos de cuentas contables:', e);
        accountingAccountsData = [];
    }
    
    renderAccountingAccountsTable(accountingAccountsData);
}

function renderAccountingAccountsTable(list) {
    // Obtener los tbody de cada sección
    const debitoTbody = document.getElementById('debitoTableBody');
    const creditoTbody = document.getElementById('creditoTableBody');
    
    if (!debitoTbody || !creditoTbody) return;

    const selectedCity = getSelectedCityCode();
    if (!selectedCity) {
        const noCityHtml = `
            <tr>
                <td colspan="4" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-map-marker-alt"></i>
                        <p>Seleccione una ciudad</p>
                        <small>Use el botón "Cambiar Ciudad" para cargar la información</small>
                    </div>
                </td>
            </tr>
        `;
        debitoTbody.innerHTML = noCityHtml;
        creditoTbody.innerHTML = noCityHtml;
        return;
    }
    
    // Limpiar ambas tablas
    debitoTbody.innerHTML = '';
    creditoTbody.innerHTML = '';
    
    if (!list || list.length === 0) {
        // Mostrar mensajes de "no hay datos" en ambas secciones
        debitoTbody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-book"></i>
                        <p>No existen cuentas débito</p>
                        <small>Haz clic en "Crear Cuenta Débito" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        creditoTbody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-book"></i>
                        <p>No existen cuentas crédito</p>
                        <small>Haz clic en "Crear Cuenta Crédito" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Separar cuentas por tipo
    const cuentasDebito = list.filter(acc => acc.tipo === 'debito');
    const cuentasCredito = list.filter(acc => acc.tipo === 'credito');
    
    // Renderizar cuentas débito
    if (cuentasDebito.length === 0) {
        debitoTbody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-book"></i>
                        <p>No existen cuentas débito</p>
                        <small>Haz clic en "Crear Cuenta Débito" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        cuentasDebito.forEach(account => {
            const row = createAccountRow(account);
            debitoTbody.appendChild(row);
        });
    }
    
    // Renderizar cuentas crédito
    if (cuentasCredito.length === 0) {
        creditoTbody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-book"></i>
                        <p>No existen cuentas crédito</p>
                        <small>Haz clic en "Crear Cuenta Crédito" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        cuentasCredito.forEach(account => {
            const row = createAccountRow(account);
            creditoTbody.appendChild(row);
        });
    }
}

/**
 * Crea una fila de tabla para una cuenta contable
 */
function createAccountRow(account) {
    const row = document.createElement('tr');
    row.className = `status-${account.estado === 'activo' ? 'active' : 'inactive'}`;
    row.innerHTML = `
        <td>${account.codigo || ''}</td>
        <td>${account.nombre || ''}</td>
        <td class="status-column" style="text-align: center;"><span class="status-badge ${account.estado === 'activo' ? 'active' : 'inactive'}">${account.estado === 'activo' ? 'ACTIVO' : 'INACTIVO'}</span></td>
        <td class="options-column" style="text-align: center;">
            <div class="action-buttons-cell status-toggle-container" style="justify-content: center;">
                <label class="status-toggle" title="Activar/Desactivar" style="margin:0 6px;" tabindex="0" role="switch" aria-checked="${account.estado === 'activo' ? 'true' : 'false'}"
                    onkeydown="if(event.key==='Enter'||event.key===' '){ event.preventDefault(); const inp=this.querySelector('input'); inp.checked=!inp.checked; requestToggleAccountingAccount(${account.id}, inp.checked); }">
                    <input type="checkbox" ${account.estado === 'activo' ? 'checked' : ''} onchange="requestToggleAccountingAccount(${account.id}, this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </td>
    `;
    return row;
}

/**
 * Función para expandir/colapsar secciones de cuentas contables
 */
function toggleAccountingSection(section) {
    const sectionElement = document.querySelector(`.accounting-section[data-section="${section}"]`);
    const contentElement = document.getElementById(`content-${section}`);
    const iconElement = document.getElementById(`icon-${section}`);
    
    if (!sectionElement || !contentElement || !iconElement) return;
    
    // Toggle de la clase 'expanded'
    const isExpanded = sectionElement.classList.contains('expanded');
    
    if (isExpanded) {
        sectionElement.classList.remove('expanded');
        contentElement.style.display = 'none';
        iconElement.classList.remove('fa-chevron-down');
        iconElement.classList.add('fa-chevron-right');
    } else {
        sectionElement.classList.add('expanded');
        contentElement.style.display = 'block';
        iconElement.classList.remove('fa-chevron-right');
        iconElement.classList.add('fa-chevron-down');
    }
}

// ========================================
// MANEJO DE EVENTOS
// ========================================

function handleCreateAccountingAccount() {
    const form = document.getElementById('createAccountingAccountForm');
    if (!form) return;

    if (!getSelectedCityCode()) {
        showNotification('Seleccione una ciudad antes de crear cuentas contables', 'warning');
        showSelectCityModal();
        return;
    }
    
    // Validar campos requeridos
    const codigo = document.getElementById('accountCode')?.value.replace(/[^\d]/g, '').substring(0, 10);
    const nombre = document.getElementById('accountName')?.value.trim();
    const tipo = document.getElementById('accountType')?.value.trim();
    
    if (!codigo || !nombre || !tipo) {
        showNotification('Por favor, complete todos los campos requeridos', 'warning');
        return;
    }
    
    // Validar que el código no exceda 10 dígitos
    if (codigo.length > 10) {
        showNotification('El código de cuenta no puede exceder 10 dígitos', 'warning');
        return;
    }
    
    // Validar que no exista el código en el mismo tipo
    const exists = accountingAccountsData.some(a => a.codigo === codigo && a.tipo === tipo);
    if (exists) {
        const tipoTexto = tipo === 'debito' ? 'débito' : 'crédito';
        showNotification(`El código de cuenta ${tipoTexto} ya existe`, 'warning');
        return;
    }
    
    // Guardar datos temporalmente para la confirmación
    window.tempAccountingAccountData = {
        codigo: codigo,
        nombre: nombre.toUpperCase(),
        tipo: tipo
    };
    
    // Mostrar modal de confirmación
    showConfirmCreateAccountingAccountModal();
}

function showConfirmCreateAccountingAccountModal() {
    const modal = document.getElementById('confirmCreateAccountingAccountModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '7000';
        document.body.style.overflow = 'hidden';
    }
}

function cancelCreateAccountingAccount() {
    const modal = document.getElementById('confirmCreateAccountingAccountModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    // Limpiar datos temporales
    window.tempAccountingAccountData = null;
}

function confirmCreateAccountingAccount() {
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('confirmCreateAccountingAccountModal');
    if (confirmModal) {
        confirmModal.style.display = 'none';
    }
    
    // Obtener datos temporales
    const accountData = window.tempAccountingAccountData;
    
    if (!accountData) {
        console.error('No se encontraron datos de la cuenta contable para crear');
        showNotification('Error: No se encontraron datos para crear', 'error');
        return;
    }
    
    // Crear objeto de cuenta contable
    const accountingAccount = {
        id: Date.now(),
        codigo: accountData.codigo,
        nombre: accountData.nombre,
        tipo: accountData.tipo, // 'debito' o 'credito'
        estado: 'activo'
    };
    
    // Guardar en localStorage
    try {
        accountingAccountsData.push(accountingAccount);
        saveAccountingAccountsData();
        
        // Limpiar datos temporales
        window.tempAccountingAccountData = null;
        
        // Cerrar modal de creación
        hideCreateAccountingAccountModal();
        
        // Mostrar modal de éxito
        showSuccessCreateAccountingAccountModal();
        
        // Recargar datos
        loadAccountingAccountsData();
    } catch (e) {
        console.error('Error al guardar cuenta contable:', e);
        showNotification('Error al guardar la cuenta contable', 'error');
    }
}

function showSuccessCreateAccountingAccountModal() {
    const modal = document.getElementById('successCreateAccountingAccountModal');
    if (modal) {
        // Asegurarse de que el modal de creación esté cerrado
        const createModal = document.getElementById('createAccountingAccountModal');
        if (createModal) {
            createModal.style.display = 'none';
        }
        // Asegurarse de que el modal de confirmación esté cerrado
        const confirmModal = document.getElementById('confirmCreateAccountingAccountModal');
        if (confirmModal) {
            confirmModal.style.display = 'none';
        }
        // Mostrar el modal de éxito
        modal.style.display = 'flex';
        modal.style.zIndex = '8000';
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessCreateAccountingAccountModal() {
    const modal = document.getElementById('successCreateAccountingAccountModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// TOGGLE ACTIVAR/DESACTIVAR
// ========================================

function requestToggleAccountingAccount(id, checked) {
    window.__togglingAccountingAccountId = id;
    window.__togglingAccountingAccountState = checked;
    showConfirmToggleAccountingAccountModal(checked);
}

function showConfirmToggleAccountingAccountModal(checked) {
    const modal = document.getElementById('confirmToggleAccountingAccountModal');
    const text = document.getElementById('confirmToggleAccountingAccountText');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '7000';
    }
    if (text) {
        text.textContent = checked 
            ? '¿Está segur@ que desea activar esta cuenta contable?'
            : '¿Está segur@ que desea desactivar esta cuenta contable?';
    }
}

function cancelToggleAccountingAccount() {
    hideConfirmToggleAccountingAccountModal();
    window.__togglingAccountingAccountId = null;
    window.__togglingAccountingAccountState = null;
}

function hideConfirmToggleAccountingAccountModal() {
    const modal = document.getElementById('confirmToggleAccountingAccountModal');
    if (modal) modal.style.display = 'none';
}

function confirmToggleAccountingAccount() {
    if (!window.__togglingAccountingAccountId) return;
    
    const account = accountingAccountsData.find(a => a.id === window.__togglingAccountingAccountId);
    if (!account) {
        showNotification('Cuenta contable no encontrada', 'error');
        return;
    }
    
    account.estado = window.__togglingAccountingAccountState ? 'activo' : 'inactivo';
    saveAccountingAccountsData();
    renderAccountingAccountsTable(accountingAccountsData);
    
    hideConfirmToggleAccountingAccountModal();
    showSuccessToggleAccountingAccountModal(window.__togglingAccountingAccountState);
    
    window.__togglingAccountingAccountId = null;
    window.__togglingAccountingAccountState = null;
}

function showSuccessToggleAccountingAccountModal(checked) {
    const modal = document.getElementById('successToggleAccountingAccountModal');
    const text = document.getElementById('successToggleAccountingAccountText');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '8000';
    }
    if (text) {
        text.textContent = checked 
            ? 'La cuenta contable fue activada correctamente.'
            : 'La cuenta contable fue desactivada correctamente.';
    }
}

function closeSuccessToggleAccountingAccountModal() {
    const modal = document.getElementById('successToggleAccountingAccountModal');
    if (modal) modal.style.display = 'none';
}

function saveAccountingAccountsData() {
    const selectedCity = getSelectedCityCode();
    if (!selectedCity) {
        showNotification('Seleccione una ciudad antes de guardar', 'warning');
        return;
    }
    try {
        const raw = localStorage.getItem(STORAGE_ACCOUNTS_BY_CITY);
        const byCity = raw ? JSON.parse(raw) : {};
        byCity[selectedCity] = Array.isArray(accountingAccountsData) ? accountingAccountsData : [];
        localStorage.setItem(STORAGE_ACCOUNTS_BY_CITY, JSON.stringify(byCity));
    } catch (e) {
        console.error('Error al guardar datos:', e);
        showNotification('Error al guardar los datos', 'error');
    }
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
// FORMATO NUMÉRICO
// ========================================

function initializeNumericFormatting() {
    const numericInputs = document.querySelectorAll('.numeric-input');
    numericInputs.forEach(input => {
        // Si es el campo de código de cuenta, limitar a 10 dígitos
        if (input.id === 'accountCode') {
            input.addEventListener('input', function(e) {
                // Permitir solo números y limitar a 10 dígitos
                this.value = this.value.replace(/[^\d]/g, '').substring(0, 10);
            });
            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                const numericOnly = pastedText.replace(/[^\d]/g, '').substring(0, 10);
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const currentValue = this.value;
                const newValue = currentValue.substring(0, start) + numericOnly + currentValue.substring(end);
                this.value = newValue.substring(0, 10);
                this.setSelectionRange(Math.min(start + numericOnly.length, 10), Math.min(start + numericOnly.length, 10));
            });
        } else {
            input.addEventListener('input', function(e) {
                // Permitir solo números
                this.value = this.value.replace(/[^\d]/g, '');
            });
        }
    });
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

/**
 * Obtiene todas las cuentas contables disponibles
 * @returns {Array} Array de cuentas contables
 */
function getAccountingAccountsData() {
    const selectedCity = getSelectedCityCode();
    if (!selectedCity) return [];
    try {
        const rawByCity = localStorage.getItem(STORAGE_ACCOUNTS_BY_CITY);
        const byCity = rawByCity ? JSON.parse(rawByCity) : {};
        if (byCity && Array.isArray(byCity[selectedCity])) return byCity[selectedCity];
        return [];
    } catch (e) {
        return [];
    }
}

/**
 * Busca una cuenta contable por código
 * @param {string} codigo - Código de la cuenta contable
 * @param {string} tipo - Tipo de cuenta ('debito' o 'credito'), opcional
 * @returns {Object|null} Objeto de la cuenta contable o null si no existe
 */
function getAccountingAccountByCode(codigo, tipo = null) {
    const accounts = getAccountingAccountsData();
    return accounts.find(a => {
        const matchCodigo = a.codigo === codigo;
        const matchEstado = a.estado === 'activo';
        const matchTipo = tipo ? a.tipo === tipo : true;
        return matchCodigo && matchEstado && matchTipo;
    }) || null;
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
// DROPDOWN DE USUARIO
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
    window.location.href = '../../index.html';
}

// Exportar funciones para uso en otros módulos
window.getAccountingAccountsData = getAccountingAccountsData;
window.getAccountingAccountByCode = getAccountingAccountByCode;
window.toggleAccountingSection = toggleAccountingSection;
