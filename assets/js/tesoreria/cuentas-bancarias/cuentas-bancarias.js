/**
 * 💰 FUNCIONALIDAD CUENTAS BANCARIAS - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de mantenimiento de cuentas bancarias.
 * Permite crear y gestionar las cuentas bancarias que se usarán en Ingreso a Bancos.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let bankAccountsData = [];

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando carga de interfaz de cuentas bancarias...');
        
        initializeModals();
        initializeUserDropdown();
        initializeUppercaseInputs();
        initializeNumericFormatting();
        loadBankAccountsData();
        
        console.log('✅ Interfaz de cuentas bancarias cargada correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico al cargar la interfaz:', error);
    }
});

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
            const confirmModal = document.getElementById('confirmCreateBankAccountModal');
            const successModal = document.getElementById('successCreateBankAccountModal');
            const toggleModal = document.getElementById('confirmToggleBankAccountModal');
            const toggleSuccessModal = document.getElementById('successToggleBankAccountModal');
            if (confirmModal && confirmModal.style.display === 'flex') {
                cancelCreateBankAccount();
            } else if (successModal && successModal.style.display === 'flex') {
                closeSuccessCreateBankAccountModal();
            } else if (toggleModal && toggleModal.style.display === 'flex') {
                cancelToggleBankAccount();
            } else if (toggleSuccessModal && toggleSuccessModal.style.display === 'flex') {
                closeSuccessToggleBankAccountModal();
            } else {
                hideAllModals();
            }
        }
    });

    // Botón de crear cuenta bancaria
    const bCrearCuentaBancaria = document.getElementById('bCrearCuentaBancaria');
    if (bCrearCuentaBancaria) {
        bCrearCuentaBancaria.addEventListener('click', handleCreateBankAccount);
    }
}

function hideAllModals() {
    // Solo cerrar modales principales, no los de confirmación o éxito
    const modalsToClose = ['createBankAccountModal'];
    modalsToClose.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// ========================================
// MODALES DE CUENTA BANCARIA
// ========================================

function showCreateBankAccountModal() {
    const modal = document.getElementById('createBankAccountModal');
    if (modal) {
        modal.style.display = 'flex';
        clearCreateBankAccountForm();
    }
}

function hideCreateBankAccountModal() {
    const modal = document.getElementById('createBankAccountModal');
    if (modal) modal.style.display = 'none';
    clearCreateBankAccountForm();
}

function clearCreateBankAccountForm() {
    const form = document.getElementById('createBankAccountForm');
    if (form) form.reset();
}

// ========================================
// CARGA DE DATOS
// ========================================

function loadBankAccountsData() {
    try {
        const raw = localStorage.getItem('bankAccountsData');
        bankAccountsData = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(bankAccountsData)) bankAccountsData = [];
    } catch (e) {
        console.error('Error al cargar datos de cuentas bancarias:', e);
        bankAccountsData = [];
    }
    
    renderBankAccountsTable(bankAccountsData);
}

function renderBankAccountsTable(list) {
    const tbody = document.getElementById('bankAccountsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!list || list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-university"></i>
                        <p>No existen cuentas bancarias</p>
                        <small>Haz clic en "Crear Cuenta Bancaria" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    list.forEach(account => {
        const row = document.createElement('tr');
        row.className = `status-${account.estado === 'activo' ? 'active' : 'inactive'}`;
        row.innerHTML = `
            <td>${account.nombreBanco || ''}</td>
            <td>${account.numeroCuenta || ''}</td>
            <td>${account.cuentaContable || ''}</td>
            <td class="status-column" style="text-align: center;"><span class="status-badge ${account.estado === 'activo' ? 'active' : 'inactive'}">${account.estado === 'activo' ? 'ACTIVO' : 'INACTIVO'}</span></td>
            <td class="options-column" style="text-align: center;">
                <div class="action-buttons-cell status-toggle-container" style="justify-content: center;">
                    <label class="status-toggle" title="Activar/Desactivar" style="margin:0 6px;" tabindex="0" role="switch" aria-checked="${account.estado === 'activo' ? 'true' : 'false'}"
                        onkeydown="if(event.key==='Enter'||event.key===' '){ event.preventDefault(); const inp=this.querySelector('input'); inp.checked=!inp.checked; requestToggleBankAccount(${account.id}, inp.checked); }">
                        <input type="checkbox" ${account.estado === 'activo' ? 'checked' : ''} onchange="requestToggleBankAccount(${account.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========================================
// MANEJO DE EVENTOS
// ========================================

function handleCreateBankAccount() {
    const form = document.getElementById('createBankAccountForm');
    if (!form) return;
    
    // Validar campos requeridos
    const nombreBanco = document.getElementById('bankName')?.value.trim();
    const numeroCuenta = document.getElementById('accountNumber')?.value.trim();
    const cuentaContable = document.getElementById('accountingAccount')?.value.replace(/[^\d]/g, '');
    
    if (!nombreBanco || !numeroCuenta || !cuentaContable) {
        showNotification('Por favor, complete todos los campos requeridos', 'warning');
        return;
    }
    
    // Validar que no exista el número de cuenta
    const exists = bankAccountsData.some(a => a.numeroCuenta === numeroCuenta);
    if (exists) {
        showNotification('El número de cuenta bancaria ya existe', 'warning');
        return;
    }
    
    // Guardar datos temporalmente para la confirmación
    window.tempBankAccountData = {
        nombreBanco: nombreBanco.toUpperCase(),
        numeroCuenta: numeroCuenta,
        cuentaContable: cuentaContable
    };
    
    // Mostrar modal de confirmación
    showConfirmCreateBankAccountModal();
}

function showConfirmCreateBankAccountModal() {
    const modal = document.getElementById('confirmCreateBankAccountModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '25000';
        document.body.style.overflow = 'hidden';
    }
}

function cancelCreateBankAccount() {
    const modal = document.getElementById('confirmCreateBankAccountModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    // Limpiar datos temporales
    window.tempBankAccountData = null;
}

function confirmCreateBankAccount() {
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('confirmCreateBankAccountModal');
    if (confirmModal) {
        confirmModal.style.display = 'none';
    }
    
    // Obtener datos temporales
    const accountData = window.tempBankAccountData;
    
    if (!accountData) {
        console.error('No se encontraron datos de la cuenta bancaria para crear');
        showNotification('Error: No se encontraron datos para crear', 'error');
        return;
    }
    
    // Crear objeto de cuenta bancaria
    const bankAccount = {
        id: Date.now(),
        nombreBanco: accountData.nombreBanco,
        numeroCuenta: accountData.numeroCuenta,
        cuentaContable: accountData.cuentaContable,
        estado: 'activo'
    };
    
    // Guardar en localStorage
    try {
        bankAccountsData.push(bankAccount);
        localStorage.setItem('bankAccountsData', JSON.stringify(bankAccountsData));
        
        // Limpiar datos temporales
        window.tempBankAccountData = null;
        
        // Cerrar modal de creación
        hideCreateBankAccountModal();
        
        // Mostrar modal de éxito
        showSuccessCreateBankAccountModal();
        
        // Recargar datos
        loadBankAccountsData();
    } catch (e) {
        console.error('Error al guardar cuenta bancaria:', e);
        showNotification('Error al guardar la cuenta bancaria', 'error');
    }
}

function showSuccessCreateBankAccountModal() {
    const modal = document.getElementById('successCreateBankAccountModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '25000';
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessCreateBankAccountModal() {
    const modal = document.getElementById('successCreateBankAccountModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// TOGGLE ACTIVAR/DESACTIVAR
// ========================================

function requestToggleBankAccount(id, checked) {
    window.__togglingBankAccountId = id;
    window.__togglingBankAccountState = checked;
    showConfirmToggleBankAccountModal(checked);
}

function showConfirmToggleBankAccountModal(checked) {
    const modal = document.getElementById('confirmToggleBankAccountModal');
    const text = document.getElementById('confirmToggleBankAccountText');
    if (modal) modal.style.display = 'flex';
    if (text) {
        text.textContent = checked 
            ? '¿Está segur@ que desea activar esta cuenta bancaria?'
            : '¿Está segur@ que desea desactivar esta cuenta bancaria?';
    }
}

function cancelToggleBankAccount() {
    hideConfirmToggleBankAccountModal();
    window.__togglingBankAccountId = null;
    window.__togglingBankAccountState = null;
}

function hideConfirmToggleBankAccountModal() {
    const modal = document.getElementById('confirmToggleBankAccountModal');
    if (modal) modal.style.display = 'none';
}

function confirmToggleBankAccount() {
    if (!window.__togglingBankAccountId) return;
    
    const account = bankAccountsData.find(a => a.id === window.__togglingBankAccountId);
    if (!account) {
        showNotification('Cuenta bancaria no encontrada', 'error');
        return;
    }
    
    account.estado = window.__togglingBankAccountState ? 'activo' : 'inactivo';
    saveBankAccountsData();
    renderBankAccountsTable(bankAccountsData);
    
    hideConfirmToggleBankAccountModal();
    showSuccessToggleBankAccountModal(window.__togglingBankAccountState);
    
    window.__togglingBankAccountId = null;
    window.__togglingBankAccountState = null;
}

function showSuccessToggleBankAccountModal(checked) {
    const modal = document.getElementById('successToggleBankAccountModal');
    const text = document.getElementById('successToggleBankAccountText');
    if (modal) modal.style.display = 'flex';
    if (text) {
        text.textContent = checked 
            ? 'La cuenta bancaria fue activada correctamente.'
            : 'La cuenta bancaria fue desactivada correctamente.';
    }
}

function closeSuccessToggleBankAccountModal() {
    const modal = document.getElementById('successToggleBankAccountModal');
    if (modal) modal.style.display = 'none';
}

function saveBankAccountsData() {
    try {
        localStorage.setItem('bankAccountsData', JSON.stringify(bankAccountsData));
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
        input.addEventListener('input', function(e) {
            // Permitir solo números
            this.value = this.value.replace(/[^\d]/g, '');
        });
    });
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

/**
 * Obtiene todas las cuentas bancarias disponibles
 * @returns {Array} Array de cuentas bancarias
 */
function getBankAccountsData() {
    try {
        const raw = localStorage.getItem('bankAccountsData');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Busca una cuenta bancaria por número de cuenta
 * @param {string} numeroCuenta - Número de cuenta bancaria
 * @returns {Object|null} Objeto de la cuenta bancaria o null si no existe
 */
function getBankAccountByNumber(numeroCuenta) {
    const accounts = getBankAccountsData();
    return accounts.find(a => a.numeroCuenta === numeroCuenta && a.estado === 'activo') || null;
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
    window.location.href = '../../../index.html';
}

// Exportar funciones para uso en otros módulos
window.getBankAccountsData = getBankAccountsData;
window.getBankAccountByNumber = getBankAccountByNumber;

