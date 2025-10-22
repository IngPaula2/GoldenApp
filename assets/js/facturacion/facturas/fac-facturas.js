/**
 * 📊 FUNCIONALIDAD FACTURAS - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de facturas.
 * Incluye gestión de modales y operaciones CRUD para facturas.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2024
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let invoicesData = [];

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    loadInvoicesData();
    initializeUserDropdown();
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
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllModals();
        }
    });
}

function hideAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.display = 'none';
    });
}

// ========================================
// MODALES DE FACTURAS
// ========================================

function showSearchInvoiceModal() {
    document.getElementById('searchInvoiceModal').style.display = 'flex';
    document.getElementById('searchInvoiceId').focus();
}

function hideSearchInvoiceModal() {
    document.getElementById('searchInvoiceModal').style.display = 'none';
    document.getElementById('searchInvoiceId').value = '';
}

function showCreateInvoiceModal() {
    document.getElementById('createInvoiceModal').style.display = 'flex';
    // Establecer fecha actual
    document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
}

function hideCreateInvoiceModal() {
    document.getElementById('createInvoiceModal').style.display = 'none';
    clearCreateInvoiceForm();
}

function clearCreateInvoiceForm() {
    document.getElementById('invoiceNumber').value = '';
    document.getElementById('invoiceDate').value = '';
    document.getElementById('clientName').value = '';
    document.getElementById('invoiceValue').value = '';
    document.getElementById('invoiceStatus').value = '';
    document.getElementById('dueDate').value = '';
}

// ========================================
// MODAL DE REPORTES
// ========================================

function showReportModal() {
    document.getElementById('reportModal').style.display = 'flex';
    // Establecer fechas por defecto (último mes)
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    document.getElementById('startDate').value = lastMonth.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
}

function hideReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('reportType').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
}

// ========================================
// CARGA DE DATOS
// ========================================

function loadInvoicesData() {
    const tbody = document.getElementById('invoicesTableBody');
    tbody.innerHTML = '';
    
    if (invoicesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-receipt"></i>
                        <p>No existen registros de facturas</p>
                        <small>Haz clic en "Crear Factura" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    invoicesData.forEach(invoice => {
        const row = document.createElement('tr');
        row.className = `status-${invoice.status}`;
        row.innerHTML = `
            <td class="invoice-number">${invoice.invoiceNumber}</td>
            <td>${formatDate(invoice.date)}</td>
            <td>${invoice.clientName}</td>
            <td class="invoice-value">$${formatNumber(invoice.value)}</td>
            <td><span class="status-badge ${invoice.status}">${invoice.status}</span></td>
            <td>${formatDate(invoice.dueDate)}</td>
            <td>
                <div class="action-buttons-cell">
                    <button class="btn-icon btn-edit" onclick="editInvoice(${invoice.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteInvoice(${invoice.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========================================
// OPERACIONES CRUD - FACTURAS
// ========================================

function editInvoice(id) {
    const invoice = invoicesData.find(i => i.id === id);
    if (!invoice) return;
    
    // Llenar formulario con datos existentes
    document.getElementById('invoiceNumber').value = invoice.invoiceNumber;
    document.getElementById('invoiceDate').value = invoice.date;
    document.getElementById('clientName').value = invoice.clientName;
    document.getElementById('invoiceValue').value = invoice.value;
    document.getElementById('invoiceStatus').value = invoice.status;
    document.getElementById('dueDate').value = invoice.dueDate;
    
    showCreateInvoiceModal();
}

function deleteInvoice(id) {
    if (confirm('¿Está seguro de que desea eliminar esta factura?')) {
        invoicesData = invoicesData.filter(i => i.id !== id);
        loadInvoicesData();
        showNotification('Factura eliminada exitosamente', 'success');
    }
}

// ========================================
// EVENT LISTENERS PARA FORMULARIOS
// ========================================

// Crear Factura
document.getElementById('bCrearFactura')?.addEventListener('click', function() {
    const invoiceData = {
        id: invoicesData.length + 1,
        invoiceNumber: document.getElementById('invoiceNumber').value,
        date: document.getElementById('invoiceDate').value,
        clientName: document.getElementById('clientName').value,
        value: parseFloat(document.getElementById('invoiceValue').value),
        status: document.getElementById('invoiceStatus').value,
        dueDate: document.getElementById('dueDate').value
    };
    
    // Validar campos requeridos
    if (!validateInvoiceForm(invoiceData)) {
        return;
    }
    
    invoicesData.push(invoiceData);
    loadInvoicesData();
    hideCreateInvoiceModal();
    showNotification('Factura creada exitosamente', 'success');
});

// Generar Reporte
document.getElementById('bGenerarReporte')?.addEventListener('click', function() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!reportType || !startDate || !endDate) {
        showNotification('Por favor complete todos los campos', 'warning');
        return;
    }
    
    generateReport(reportType, startDate, endDate);
    hideReportModal();
});

// ========================================
// VALIDACIONES
// ========================================

function validateInvoiceForm(data) {
    if (!data.invoiceNumber || !data.date || !data.clientName || 
        !data.value || !data.status || !data.dueDate) {
        showNotification('Por favor complete todos los campos requeridos', 'warning');
        return false;
    }
    
    if (data.value <= 0) {
        showNotification('El valor de la factura debe ser mayor a 0', 'warning');
        return false;
    }
    
    return true;
}

// ========================================
// FUNCIONES UTILITARIAS
// ========================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO');
}

function formatNumber(number) {
    return new Intl.NumberFormat('es-CO').format(number);
}

function generateReport(type, startDate, endDate) {
    // Simular generación de reporte
    showNotification(`Reporte de ${type} generado para el período ${startDate} - ${endDate}`, 'success');
    
    // Aquí se implementaría la lógica real de generación de reportes
    console.log('Generando reporte:', { type, startDate, endDate });
}

// ========================================
// SISTEMA DE NOTIFICACIONES
// ========================================

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
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
// DROPDOWN DE USUARIO
// ========================================

function initializeUserDropdown() {
    const userInfo = document.querySelector('.user-info');
    const dropdown = document.getElementById('userDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const sidebar = document.querySelector('.sidebar');
    
    if (userInfo && dropdown) {
        // Toggle del dropdown al hacer clic en el perfil
        userInfo.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            if (dropdownArrow) dropdownArrow.classList.toggle('open');
            if (sidebar) sidebar.classList.toggle('dropdown-open');
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!userInfo.contains(e.target)) {
                dropdown.classList.remove('show');
                if (dropdownArrow) dropdownArrow.classList.remove('open');
                if (sidebar) sidebar.classList.remove('dropdown-open');
            }
        });
        
        // Manejar clics en elementos del dropdown
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                
                if (this.classList.contains('logout-item')) {
                    // Redirigir inmediatamente al login
                    window.location.href = '../../index.html';
                } else if (this.classList.contains('admin-users-item')) {
                    alert('Funcionalidad de administrar usuarios en desarrollo');
                }
                
                // Cerrar dropdown después del clic
                dropdown.classList.remove('show');
                if (dropdownArrow) dropdownArrow.classList.remove('open');
                if (sidebar) sidebar.classList.remove('dropdown-open');
            });
        });
    }
}

