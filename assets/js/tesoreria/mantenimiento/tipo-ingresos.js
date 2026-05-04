/**
 * 💰 FUNCIONALIDAD MANTENIMIENTO - TIPO DE INGRESOS - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de mantenimiento de tipos de ingresos.
 * Permite crear y gestionar los tipos de ingresos que se usarán en Ingreso a Caja.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let incomeTypesData = [];

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando carga de interfaz de tipo de ingresos...');
        
        initializeModals();
        initializeUserDropdown();
        initializeUppercaseInputs();
        initializeNumericPlainInputs();
        loadIncomeTypesData();
        
        console.log('✅ Interfaz de tipo de ingresos cargada correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico al cargar la interfaz:', error);
    }
});

// ========================================
// GESTIÓN DE MODALES
// ========================================

function initializeModals() {
    // Los modales solo se cierran con la X o botones (no al clic fuera del overlay).
    
    // Cerrar modales con Escape (excepto confirmación y éxito)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const confirmModal = document.getElementById('confirmCreateIncomeTypeModal');
            const successModal = document.getElementById('successCreateIncomeTypeModal');
            if (confirmModal && confirmModal.style.display === 'flex') {
                cancelCreateIncomeType();
            } else if (successModal && successModal.style.display === 'flex') {
                closeSuccessCreateIncomeTypeModal();
            } else {
                hideAllModals();
            }
        }
    });

    // Botón de crear tipo de ingreso
    const bCrearTipoIngreso = document.getElementById('bCrearTipoIngreso');
    if (bCrearTipoIngreso) {
        bCrearTipoIngreso.addEventListener('click', handleCreateIncomeType);
    }
}

function hideAllModals() {
    // Solo cerrar modales principales, no los de confirmación o éxito
    const modalsToClose = ['createIncomeTypeModal'];
    modalsToClose.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// ========================================
// MODALES DE TIPO DE INGRESO
// ========================================

function showCreateIncomeTypeModal() {
    const modal = document.getElementById('createIncomeTypeModal');
    if (modal) {
        modal.style.display = 'flex';
        clearCreateIncomeTypeForm();
    }
}

function hideCreateIncomeTypeModal() {
    const modal = document.getElementById('createIncomeTypeModal');
    if (modal) modal.style.display = 'none';
    clearCreateIncomeTypeForm();
}

function clearCreateIncomeTypeForm() {
    const form = document.getElementById('createIncomeTypeForm');
    if (form) form.reset();
}

// ========================================
// CARGA DE DATOS
// ========================================

function loadIncomeTypesData() {
    try {
        const raw = localStorage.getItem('incomeTypesData');
        incomeTypesData = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(incomeTypesData)) incomeTypesData = [];
    } catch (e) {
        console.error('Error al cargar datos de tipos de ingresos:', e);
        incomeTypesData = [];
    }
    
    renderIncomeTypesTable(incomeTypesData);
}

function renderIncomeTypesTable(list) {
    const tbody = document.getElementById('incomeTypesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!list || list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-list"></i>
                        <p>No existen tipos de ingresos</p>
                        <small>Haz clic en "Crear Tipo de Ingreso" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    list.forEach(type => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${type.codigo || ''}</td>
            <td>${type.nombre || ''}</td>
            <td>${type.cuentaContable || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

// ========================================
// MANEJO DE EVENTOS
// ========================================

function handleCreateIncomeType() {
    const form = document.getElementById('createIncomeTypeForm');
    if (!form) return;
    
    // Validar campos requeridos
    const codigo = document.getElementById('incomeTypeCode')?.value.trim();
    const nombre = document.getElementById('incomeTypeName')?.value.trim();
    const cuentaContable = document.getElementById('incomeTypeAccountingAccount')?.value.replace(/[^\d]/g, '');
    
    if (!codigo || !nombre || !cuentaContable) {
        showNotification('Por favor, complete todos los campos requeridos', 'warning');
        return;
    }
    
    // Validar que no exista el código
    const exists = incomeTypesData.some(t => t.codigo === codigo.toUpperCase());
    if (exists) {
        showNotification('El tipo de ingreso ya existe', 'warning');
        return;
    }
    
    // Guardar datos temporalmente para la confirmación
    window.tempIncomeTypeData = {
        codigo: codigo.toUpperCase(),
        nombre: nombre.toUpperCase(),
        cuentaContable: cuentaContable
    };
    
    // Mostrar modal de confirmación
    showConfirmCreateIncomeTypeModal();
}

function showConfirmCreateIncomeTypeModal() {
    const modal = document.getElementById('confirmCreateIncomeTypeModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '25000';
        document.body.style.overflow = 'hidden';
    }
}

function cancelCreateIncomeType() {
    const modal = document.getElementById('confirmCreateIncomeTypeModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    // Limpiar datos temporales
    window.tempIncomeTypeData = null;
}

function confirmCreateIncomeType() {
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('confirmCreateIncomeTypeModal');
    if (confirmModal) {
        confirmModal.style.display = 'none';
    }
    
    // Obtener datos temporales
    const incomeTypeData = window.tempIncomeTypeData;
    
    if (!incomeTypeData) {
        console.error('No se encontraron datos del tipo de ingreso para crear');
        showNotification('Error: No se encontraron datos para crear', 'error');
        return;
    }
    
    // Crear objeto de tipo de ingreso
    const incomeType = {
        id: Date.now(),
        codigo: incomeTypeData.codigo,
        nombre: incomeTypeData.nombre,
        cuentaContable: incomeTypeData.cuentaContable
    };
    
    // Guardar en localStorage
    try {
        incomeTypesData.push(incomeType);
        localStorage.setItem('incomeTypesData', JSON.stringify(incomeTypesData));
        
        // Limpiar datos temporales
        window.tempIncomeTypeData = null;
        
        // Cerrar modal de creación
        hideCreateIncomeTypeModal();
        
        // Mostrar modal de éxito
        showSuccessCreateIncomeTypeModal();
        
        // Recargar datos
        loadIncomeTypesData();
    } catch (e) {
        console.error('Error al guardar tipo de ingreso:', e);
        showNotification('Error al guardar el tipo de ingreso', 'error');
    }
}

function showSuccessCreateIncomeTypeModal() {
    const modal = document.getElementById('successCreateIncomeTypeModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '25000';
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessCreateIncomeTypeModal() {
    const modal = document.getElementById('successCreateIncomeTypeModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
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
// INPUTS NUMÉRICOS (SOLO DÍGITOS)
// ========================================

function initializeNumericPlainInputs() {
    const inputs = document.querySelectorAll('.numeric-plain-input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^\d]/g, '');
        });
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const digits = (pastedText || '').replace(/[^\d]/g, '');
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const currentValue = this.value;
            this.value = currentValue.substring(0, start) + digits + currentValue.substring(end);
            const newPosition = start + digits.length;
            this.setSelectionRange(newPosition, newPosition);
        });
    });
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

/**
 * Obtiene todos los tipos de ingresos disponibles
 * @returns {Array} Array de tipos de ingresos
 */
function getIncomeTypesData() {
    try {
        const raw = localStorage.getItem('incomeTypesData');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Busca un tipo de ingreso por código
 * @param {string} codigo - Código del tipo de ingreso
 * @returns {Object|null} Objeto del tipo de ingreso o null si no existe
 */
function getIncomeTypeByCode(codigo) {
    const types = getIncomeTypesData();
    return types.find(t => t.codigo === codigo.toUpperCase()) || null;
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
    window.location.href = window.AppRoutes.resolve('LOGIN');
}

// Exportar funciones para uso en otros módulos
window.getIncomeTypesData = getIncomeTypesData;
window.getIncomeTypeByCode = getIncomeTypeByCode;

