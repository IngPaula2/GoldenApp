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
    initializeUserDropdown();
    initializeCitySelection();
    loadInvoicesData();
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

    // Botón de seleccionar ciudad como en contratos
    const bSeleccionarCiudad = document.getElementById('bSeleccionarCiudad');
    if (bSeleccionarCiudad) {
        bSeleccionarCiudad.addEventListener('click', handleSelectCity);
    }
}

function hideAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.display = 'none';
    });
}

// ========================================
// SELECCIÓN DE CIUDAD (PATRÓN REUTILIZABLE)
// ========================================

function initializeCitySelection() {
    try {
        // Asegurar datos de ciudades mínimos si aplica
        if (!verificarDatosCiudades()) {
            restaurarDatosCiudadesBasicos();
        }
    } catch (e) {
        // Si no existen helpers, continuar sin bloquear
    }

    // Resetear selección previa al entrar
    try { sessionStorage.removeItem('selectedCity'); } catch (e) {}

    // Mostrar modal inmediatamente
    showSelectCityModal();
}

function showSelectCityModal() {
    const modal = document.getElementById('selectCityModal');
    if (modal) {
        populateCitySelectOptions();
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';
        document.body.style.overflow = 'hidden';
        setTimeout(() => { document.getElementById('citySelect')?.focus(); }, 100);
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

    // TODO: cargar datos dependientes de la ciudad (cuando existan endpoints)
    // Por ahora solo refrescar listado local
    loadInvoicesData();

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
    
    // Establecer fecha actual automáticamente
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    
    // Obtener próximo número de factura desde consecutivos
    loadNextInvoiceNumber();
    
    // Limpiar formulario
    clearCreateInvoiceForm();
}

function clearCreateInvoiceForm() {
    document.getElementById('clientId').value = '';
    document.getElementById('clientName').value = '';
    document.getElementById('contractSelect').innerHTML = '<option value="">Seleccione el contrato</option>';
    document.getElementById('firstPaymentDate').value = '';
    document.getElementById('planInfo').value = '';
    document.getElementById('executiveInfo').value = '';
    document.getElementById('invoiceValue').value = '';
    
    // Ocultar display de nombre del cliente
    const clientNameDisplay = document.getElementById('clientNameDisplay');
    if (clientNameDisplay) {
        clientNameDisplay.style.display = 'none';
    }
}

function loadNextInvoiceNumber() {
    // TODO: Integrar con API de consecutivos
    // Por ahora usar número incremental
    const nextNumber = invoicesData.length + 1;
    document.getElementById('invoiceNumber').value = nextNumber.toString().padStart(8, '0');
}

// Event listener para buscar titular por ID
document.getElementById('clientId')?.addEventListener('input', function() {
    const clientId = this.value.trim();
    if (clientId.length >= 6) {
        searchTitularByCedula(clientId);
    } else {
        // Limpiar campos si el ID es muy corto
        document.getElementById('clientName').value = '';
        document.getElementById('contractSelect').innerHTML = '<option value="">Seleccione el contrato</option>';
        clearContractInfo();
    }
});

function searchTitularByCedula(cedula) {
    // TODO: Integrar con API de titulares
    // Por ahora simular búsqueda
    console.log(`Buscando titular con cédula: ${cedula}`);
    
    // Simular datos de ejemplo
    const titularesEjemplo = {
        '100002323': { nombre: 'ANDREA PEREZ VARGAS', contratos: [
            { id: 1, numero: '10120014', plan: 'ESPECIAL', ejecutivo: 'PAULA PACHON VARGAS', valor: 150000 }
        ]},
        '1028481082': { nombre: 'PAULA PACHON VARGAS', contratos: [
            { id: 2, numero: '10120008', plan: 'ESPECIAL', ejecutivo: 'ESLI MARTINEZ VARGAS', valor: 200000 }
        ]}
    };
    
    const titular = titularesEjemplo[cedula];
    if (titular) {
        // Mostrar nombre del titular
        document.getElementById('clientName').value = titular.nombre;
        
        // Mostrar display de confirmación
        const clientNameDisplay = document.getElementById('clientNameDisplay');
        if (clientNameDisplay) {
            clientNameDisplay.textContent = `✓ ${titular.nombre}`;
            clientNameDisplay.style.display = 'block';
        }
        
        // Cargar contratos del titular
        loadContractsForTitular(titular.contratos);
    } else {
        // Limpiar si no se encuentra
        document.getElementById('clientName').value = '';
        document.getElementById('contractSelect').innerHTML = '<option value="">Seleccione el contrato</option>';
        clearContractInfo();
        
        const clientNameDisplay = document.getElementById('clientNameDisplay');
        if (clientNameDisplay) {
            clientNameDisplay.style.display = 'none';
        }
    }
}

function loadContractsForTitular(contratos) {
    const contractSelect = document.getElementById('contractSelect');
    contractSelect.innerHTML = '<option value="">Seleccione el contrato</option>';
    
    contratos.forEach(contrato => {
        const option = document.createElement('option');
        option.value = contrato.id;
        option.textContent = `Contrato ${contrato.numero} - ${contrato.plan}`;
        option.dataset.contrato = JSON.stringify(contrato);
        contractSelect.appendChild(option);
    });
}

// Event listener para cuando se selecciona un contrato
document.getElementById('contractSelect')?.addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.value) {
        const contrato = JSON.parse(selectedOption.dataset.contrato);
        loadContractInfo(contrato);
    } else {
        clearContractInfo();
    }
});

function loadContractInfo(contrato) {
    document.getElementById('planInfo').value = contrato.plan;
    document.getElementById('executiveInfo').value = contrato.ejecutivo;
    document.getElementById('invoiceValue').value = contrato.valor;
}

function clearContractInfo() {
    document.getElementById('planInfo').value = '';
    document.getElementById('executiveInfo').value = '';
    document.getElementById('invoiceValue').value = '';
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
            <td>${invoice.firstPaymentDate ? formatDate(invoice.firstPaymentDate) : '—'}</td>
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
document.getElementById('bCrearFacturaModal')?.addEventListener('click', function() {
    const invoiceData = {
        id: invoicesData.length + 1,
        invoiceNumber: document.getElementById('invoiceNumber').value,
        date: document.getElementById('invoiceDate').value,
        clientId: document.getElementById('clientId').value,
        clientName: document.getElementById('clientName').value,
        contractId: document.getElementById('contractSelect').value,
        plan: document.getElementById('planInfo').value,
        executive: document.getElementById('executiveInfo').value,
        value: parseFloat(document.getElementById('invoiceValue').value),
        firstPaymentDate: document.getElementById('firstPaymentDate').value,
        status: 'pendiente' // Estado por defecto
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
    if (!data.invoiceNumber || !data.date || !data.clientId || !data.clientName || 
        !data.contractId || !data.value) {
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

