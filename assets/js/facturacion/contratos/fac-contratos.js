/**
 * 📊 FUNCIONALIDAD CONTRATOS - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de contratos.
 * Incluye gestión de modales y operaciones CRUD para contratos.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2024
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let contractsData = [];

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    loadContractsData();
    initializeUserDropdown();
    initializeContractForm();
    // Cargar empleados al inicializar la página
    loadEmpleadosFromStorage();
    // Inicializar listener para cambios de ciudad
    initializeCityChangeListener();
    // Mostrar modal de selección de ciudad al cargar
    setTimeout(() => showSelectCityModal(), 300);
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
    
    // Event listener para el botón de seleccionar ciudad
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
// MODALES DE CONTRATOS
// ========================================

function showSearchContractModal() {
    document.getElementById('searchContractModal').style.display = 'flex';
    document.getElementById('searchContractId').focus();
}

function hideSearchContractModal() {
    document.getElementById('searchContractModal').style.display = 'none';
    document.getElementById('searchContractId').value = '';
}

function showCreateContractModal() {
    document.getElementById('createContractModal').style.display = 'flex';
    // Establecer fecha y hora actual
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('contractDate').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Mostrar información del rango de consecutivos
    showConsecutiveRangeInfo();
}

function hideCreateContractModal() {
    document.getElementById('createContractModal').style.display = 'none';
    clearCreateContractForm();
}

function clearCreateContractForm() {
    document.getElementById('contractNumber').value = '';
    document.getElementById('productionRecord').value = '';
    document.getElementById('clientId').value = '';
    document.getElementById('clientName').value = '';
    document.getElementById('plan').value = '';
    document.getElementById('plan').removeAttribute('data-plan-code');
    document.getElementById('plan').removeAttribute('data-plan-data');
    document.getElementById('executiveId').value = '';
    document.getElementById('executiveName').value = '';
    document.getElementById('contractDate').value = '';
    
    // Limpiar datos del titular y ejecutivo
    clearTitularData();
    clearEjecutivoData();
    
    // Limpiar información de consecutivos y errores
    hideConsecutiveRangeInfo();
    hideContractNumberError();
    
    // Limpiar estilos de error del campo de número de contrato
    const contractNumberInput = document.getElementById('contractNumber');
    if (contractNumberInput) {
        contractNumberInput.style.borderColor = '';
        contractNumberInput.style.backgroundColor = '';
    }
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
// MODAL DE SELECCIÓN DE CIUDAD
// ========================================

function showSelectCityModal() {
    const modal = document.getElementById('selectCityModal');
    if (modal) {
        populateCitySelectOptions();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
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
    
    // Obtener ciudades desde localStorage
    let ciudades = {};
    try {
        const raw = localStorage.getItem('ciudadesData');
        if (raw) {
            const data = JSON.parse(raw);
            ciudades = Object.fromEntries(
                Object.entries(data).filter(([k, v]) => v && typeof v === 'object' && v.codigo && v.nombre)
            );
        }
    } catch (e) {
        console.error('Error cargando ciudades:', e);
    }
    
    // Limpiar opciones existentes
    citySelect.innerHTML = '<option value="">Seleccione la ciudad</option>';
    
    // Agregar ciudades activas
    Object.values(ciudades)
        .filter(c => c.activo !== false)
        .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
        .forEach(ciudad => {
            const option = document.createElement('option');
            option.value = ciudad.codigo;
            option.textContent = `${ciudad.codigo} - ${ciudad.nombre.toUpperCase()}`;
            citySelect.appendChild(option);
        });
}

function handleSelectCity() {
    const citySelect = document.getElementById('citySelect');
    const selectedCity = citySelect ? citySelect.value : '';
    
    if (!selectedCity) {
        showNotification('Por favor, seleccione una ciudad', 'warning');
        return;
    }
    
    // Guardar ciudad seleccionada en sessionStorage
    sessionStorage.setItem('selectedCity', selectedCity);
    
    // Cerrar modal
    hideSelectCityModal();
    
    // Cargar datos de la ciudad seleccionada
    loadEmpleadosFromStorage();
    
    // Mostrar notificación de éxito
    showNotification(`Ciudad seleccionada: ${selectedCity}`, 'success');
}

// ========================================
// CARGA DE DATOS
// ========================================

function loadContractsData() {
    const tbody = document.getElementById('contractsTableBody');
    tbody.innerHTML = '';
    
    if (contractsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-file-contract"></i>
                        <p>No existen registros de contratos</p>
                        <small>Haz clic en "Crear Contrato" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    contractsData.forEach(contract => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="contract-number">${contract.contractNumber}</td>
            <td>${contract.productionRecord}</td>
            <td>${contract.clientId}</td>
            <td class="client-name">${contract.clientName}</td>
            <td><span class="plan-badge">${contract.plan}</span></td>
            <td>${contract.executive}</td>
            <td>
                <div class="action-buttons-cell">
                    <button class="btn-icon btn-edit" onclick="editContract(${contract.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteContract(${contract.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========================================
// OPERACIONES CRUD - CONTRATOS
// ========================================

function editContract(id) {
    const contract = contractsData.find(c => c.id === id);
    if (!contract) return;
    
    // Llenar formulario con datos existentes
    document.getElementById('contractNumber').value = contract.contractNumber;
    document.getElementById('productionRecord').value = contract.productionRecord;
    document.getElementById('clientId').value = contract.clientId;
    document.getElementById('clientName').value = contract.clientName;
    document.getElementById('plan').value = contract.plan;
    document.getElementById('executiveName').value = contract.executive;
    document.getElementById('contractDate').value = contract.contractDate;
    
    showCreateContractModal();
}

function deleteContract(id) {
    if (confirm('¿Está seguro de que desea eliminar este contrato?')) {
        contractsData = contractsData.filter(c => c.id !== id);
        loadContractsData();
        showNotification('Contrato eliminado exitosamente', 'success');
    }
}

// ========================================
// EVENT LISTENERS PARA FORMULARIOS
// ========================================

// Crear Contrato - Event listener para el botón dentro del modal
document.getElementById('bCrearContratoModal')?.addEventListener('click', function() {
    const planInput = document.getElementById('plan');
    const planData = planInput.getAttribute('data-plan-data');
    
    const contractData = {
        id: contractsData.length + 1,
        contractNumber: document.getElementById('contractNumber').value,
        productionRecord: document.getElementById('productionRecord').value,
        clientId: document.getElementById('clientId').value,
        clientName: document.getElementById('clientName').value,
        plan: document.getElementById('plan').value,
        planCode: planInput.getAttribute('data-plan-code'),
        planData: planData ? JSON.parse(planData) : null,
        executive: document.getElementById('executiveName').value,
        contractDate: document.getElementById('contractDate').value
    };
    
    // Validar campos requeridos
    if (!validateContractForm(contractData)) {
        return;
    }
    
    contractsData.push(contractData);
    loadContractsData();
    hideCreateContractModal();
    showNotification('Contrato creado exitosamente', 'success');
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

function validateContractForm(data) {
    if (!data.contractNumber || !data.productionRecord || 
        !data.clientId || !data.clientName || !data.plan || !data.executive || 
        !data.contractDate) {
        showNotification('Por favor complete todos los campos requeridos', 'warning');
        return false;
    }
    
    // Validar que los campos numéricos solo contengan números
    if (!/^\d+$/.test(data.contractNumber)) {
        showNotification('El número de contrato debe contener solo números', 'warning');
        return false;
    }
    
    if (!/^\d+$/.test(data.productionRecord)) {
        showNotification('El record de producción debe contener solo números', 'warning');
        return false;
    }
    
    // Validar que se haya seleccionado un plan válido
    if (!data.planCode) {
        showNotification('Por favor seleccione un plan válido', 'warning');
        return false;
    }
    
    // Validar que el número de contrato esté dentro del rango de consecutivos
    const contractValidation = validateContractNumber(data.contractNumber);
    if (!contractValidation.valid) {
        showNotification(contractValidation.message, 'warning');
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

// ========================================
// INICIALIZACIÓN DEL FORMULARIO DE CONTRATO
// ========================================

function initializeContractForm() {
    // Validación numérica para campos de número de contrato y record de producción
    const numericInputs = document.querySelectorAll('.numeric-input');
    numericInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            // Solo permitir números
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const numbersOnly = paste.replace(/[^0-9]/g, '');
            e.target.value = numbersOnly;
        });
    });
    
    // Validación específica para número de contrato
    const contractNumberInput = document.getElementById('contractNumber');
    if (contractNumberInput) {
        contractNumberInput.addEventListener('blur', function(e) {
            const contractNumber = e.target.value.trim();
            if (contractNumber) {
                const validation = validateContractNumber(contractNumber);
                if (!validation.valid) {
                    // Mostrar error visual en el campo
                    e.target.style.borderColor = '#ef4444';
                    e.target.style.backgroundColor = '#fef2f2';
                    
                    // Mostrar mensaje de error debajo del campo
                    showContractNumberError(validation.message);
                } else {
                    // Limpiar error visual
                    e.target.style.borderColor = '';
                    e.target.style.backgroundColor = '';
                    hideContractNumberError();
                }
            }
        });
        
        contractNumberInput.addEventListener('input', function(e) {
            // Limpiar errores mientras el usuario escribe
            e.target.style.borderColor = '';
            e.target.style.backgroundColor = '';
            hideContractNumberError();
        });
    }
    
    // Búsqueda de titular por cédula
    const clientIdInput = document.getElementById('clientId');
    if (clientIdInput) {
        clientIdInput.addEventListener('input', function(e) {
            const cedula = e.target.value.trim();
            if (cedula.length >= 6) {
                searchTitularByCedula(cedula);
            } else {
                clearTitularData();
            }
        });
    }
    
    // Búsqueda de ejecutivo por cédula
    const executiveIdInput = document.getElementById('executiveId');
    if (executiveIdInput) {
        executiveIdInput.addEventListener('input', function(e) {
            const cedula = e.target.value.trim();
            if (cedula.length >= 6) {
                searchEjecutivoByCedula(cedula);
            } else {
                clearEjecutivoData();
            }
        });
    }
    
    // Botón de selección de plan
    const selectPlanBtn = document.getElementById('selectPlanBtn');
    if (selectPlanBtn) {
        selectPlanBtn.addEventListener('click', showPlanSelectionModal);
    }
}

// ========================================
// BÚSQUEDA DE TITULARES
// ========================================

function searchTitularByCedula(cedula) {
    // Buscar en localStorage de titulares
    try {
        const titularesByCity = localStorage.getItem('titularesByCity');
        const selectedCity = getSelectedCityCode();
        
        console.log('🔍 Buscando titular con cédula:', cedula, 'en ciudad:', selectedCity);
        
        let titular = null;
        
        // Buscar SOLO en la ciudad seleccionada
        if (titularesByCity && selectedCity) {
            const data = JSON.parse(titularesByCity);
            console.log('📊 Datos de titulares por ciudad:', data);
            
            // Buscar únicamente en la ciudad seleccionada
            if (data[selectedCity] && data[selectedCity][cedula]) {
                titular = data[selectedCity][cedula];
                console.log('✅ Titular encontrado:', titular);
            } else {
                console.log('❌ No se encontró titular con cédula', cedula, 'en ciudad', selectedCity);
                console.log('👥 Titulares disponibles en ciudad:', Object.keys(data[selectedCity] || {}));
            }
        } else {
            console.log('⚠️ No hay datos de titulares o ciudad seleccionada');
        }
        
        if (titular) {
            displayTitularInfo(titular);
        } else {
            clearTitularData();
        }
    } catch (error) {
        console.error('❌ Error al buscar titular:', error);
        clearTitularData();
    }
}

function displayTitularInfo(titular) {
    const clientNameInput = document.getElementById('clientName');
    const clientNameDisplay = document.getElementById('clientNameDisplay');
    
    if (clientNameInput && clientNameDisplay) {
        // Construir nombre completo
        const nombreCompleto = `${titular.nombre1 || ''} ${titular.nombre2 || ''} ${titular.apellido1 || ''} ${titular.apellido2 || ''}`.trim();
        
        clientNameInput.value = nombreCompleto;
        clientNameDisplay.textContent = `Titular encontrado: ${nombreCompleto}`;
        clientNameDisplay.style.display = 'block';
        clientNameDisplay.style.backgroundColor = '#d4edda';
        clientNameDisplay.style.borderColor = '#c3e6cb';
        clientNameDisplay.style.color = '#155724';
    }
}

function clearTitularData() {
    const clientNameInput = document.getElementById('clientName');
    const clientNameDisplay = document.getElementById('clientNameDisplay');
    
    if (clientNameInput && clientNameDisplay) {
        clientNameInput.value = '';
        clientNameDisplay.style.display = 'none';
    }
}

// ========================================
// BÚSQUEDA DE EJECUTIVOS
// ========================================

function searchEjecutivoByCedula(cedula) {
    // Buscar en localStorage de empleados
    try {
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        const selectedCity = getSelectedCityCode();
        
        console.log('🔍 Buscando ejecutivo con cédula:', cedula, 'en ciudad:', selectedCity);
        
        let ejecutivo = null;
        
        // Buscar SOLO en la ciudad seleccionada
        if (empleadosByCity && selectedCity) {
            const data = JSON.parse(empleadosByCity);
            console.log('📊 Datos de empleados por ciudad:', data);
            
            // Buscar únicamente en la ciudad seleccionada
            if (data[selectedCity] && data[selectedCity][cedula]) {
                ejecutivo = data[selectedCity][cedula];
                console.log('✅ Ejecutivo encontrado:', ejecutivo);
                console.log('📝 Campos de nombre del ejecutivo:', {
                    tPrimerNombre: ejecutivo.tPrimerNombre,
                    tSegundoNombre: ejecutivo.tSegundoNombre,
                    tPrimerApellido: ejecutivo.tPrimerApellido,
                    tSegundoApellido: ejecutivo.tSegundoApellido
                });
            } else {
                console.log('❌ No se encontró ejecutivo con cédula', cedula, 'en ciudad', selectedCity);
                console.log('👥 Empleados disponibles en ciudad:', Object.keys(data[selectedCity] || {}));
            }
        } else {
            console.log('⚠️ No hay datos de empleados o ciudad seleccionada');
        }
        
        if (ejecutivo) {
            displayEjecutivoInfo(ejecutivo);
        } else {
            clearEjecutivoData();
        }
    } catch (error) {
        console.error('❌ Error al buscar ejecutivo:', error);
        clearEjecutivoData();
    }
}

function displayEjecutivoInfo(ejecutivo) {
    const executiveNameInput = document.getElementById('executiveName');
    const executiveNameDisplay = document.getElementById('executiveNameDisplay');
    
    console.log('🎯 Mostrando información del ejecutivo:', ejecutivo);
    console.log('🔍 Elementos del DOM:', {
        executiveNameInput: !!executiveNameInput,
        executiveNameDisplay: !!executiveNameDisplay
    });
    
    if (executiveNameInput && executiveNameDisplay) {
        // Construir nombre completo usando los campos correctos de empleados
        const nombreCompleto = [
            ejecutivo.tPrimerNombre || ejecutivo.primerNombre,
            ejecutivo.tSegundoNombre || ejecutivo.segundoNombre,
            ejecutivo.tPrimerApellido || ejecutivo.primerApellido,
            ejecutivo.tSegundoApellido || ejecutivo.segundoApellido
        ].filter(Boolean).join(' ');
        
        console.log('📝 Nombre completo construido:', nombreCompleto);
        
        executiveNameInput.value = nombreCompleto;
        executiveNameDisplay.textContent = `Ejecutivo encontrado: ${nombreCompleto}`;
        executiveNameDisplay.style.display = 'block';
        executiveNameDisplay.style.backgroundColor = '#d4edda';
        executiveNameDisplay.style.borderColor = '#c3e6cb';
        executiveNameDisplay.style.color = '#155724';
        
        console.log('✅ Información del ejecutivo mostrada correctamente');
    } else {
        console.error('❌ No se encontraron los elementos del DOM para mostrar la información del ejecutivo');
    }
}

function clearEjecutivoData() {
    const executiveNameInput = document.getElementById('executiveName');
    const executiveNameDisplay = document.getElementById('executiveNameDisplay');
    
    if (executiveNameInput && executiveNameDisplay) {
        executiveNameInput.value = '';
        executiveNameDisplay.style.display = 'none';
    }
}

// ========================================
// SELECCIÓN DE PLANES
// ========================================

function showPlanSelectionModal() {
    const modal = document.getElementById('planSelectionModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    loadPlansForSelection();
    initializePlanSearch();
}

function hidePlanSelectionModal() {
    const modal = document.getElementById('planSelectionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function loadPlansForSelection() {
    const plansGrid = document.getElementById('plansGrid');
    if (!plansGrid) return;
    
    try {
        const planesData = localStorage.getItem('planesData');
        if (!planesData) {
            plansGrid.innerHTML = '<p>No hay planes disponibles</p>';
            return;
        }
        
        const planes = JSON.parse(planesData);
        plansGrid.innerHTML = '';
        
        Object.values(planes).forEach(plan => {
            if (plan.activo !== false) {
                const planCard = createPlanCard(plan);
                plansGrid.appendChild(planCard);
            }
        });
        
        if (plansGrid.children.length === 0) {
            plansGrid.innerHTML = '<p>No hay planes activos disponibles</p>';
        }
    } catch (error) {
        console.error('Error al cargar planes:', error);
        plansGrid.innerHTML = '<p>Error al cargar los planes</p>';
    }
}

function initializePlanSearch() {
    const searchInput = document.getElementById('planSearchInput');
    if (!searchInput) return;
    
    // Limpiar el campo de búsqueda
    searchInput.value = '';
    
    // Agregar event listener para la búsqueda
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterPlans(searchTerm);
    });
}

function filterPlans(searchTerm) {
    const plansGrid = document.getElementById('plansGrid');
    if (!plansGrid) return;
    
    const planCards = plansGrid.querySelectorAll('.plan-card');
    let visibleCount = 0;
    
    planCards.forEach(card => {
        const planName = card.querySelector('.plan-name')?.textContent.toLowerCase() || '';
        const planCode = card.querySelector('.plan-code')?.textContent.toLowerCase() || '';
        
        const matches = planName.includes(searchTerm) || planCode.includes(searchTerm);
        
        if (matches || searchTerm === '') {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Mostrar mensaje si no hay resultados
    if (visibleCount === 0 && searchTerm !== '') {
        plansGrid.innerHTML = '<p>No se encontraron planes que coincidan con la búsqueda</p>';
    }
}

function createPlanCard(plan) {
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.onclick = () => selectPlan(plan);
    
    card.innerHTML = `
        <div class="plan-card-row">
            <div class="plan-name-section">
                <h4 class="plan-name">${plan.nombre}</h4>
                <span class="plan-code">${plan.codigo}</span>
            </div>
            <div class="plan-details-row">
                <span class="plan-detail-inline">
                    <strong>Valor Plan:</strong> $${Number(plan.valorPlan).toLocaleString('es-CO')}
                </span>
                <span class="plan-detail-inline">
                    <strong>Cuota Inicial:</strong> $${Number(plan.cuotaInicial).toLocaleString('es-CO')}
                </span>
                <span class="plan-detail-inline">
                    <strong># Cuotas:</strong> ${plan.numCuotas}
                </span>
                <span class="plan-detail-inline">
                    <strong>Mensualidad:</strong> $${Number(plan.mensualidad).toLocaleString('es-CO')}
                </span>
            </div>
        </div>
    `;
    
    return card;
}

function selectPlan(plan) {
    const planInput = document.getElementById('plan');
    if (planInput) {
        planInput.value = plan.nombre;
        planInput.setAttribute('data-plan-code', plan.codigo);
        planInput.setAttribute('data-plan-data', JSON.stringify(plan));
    }
    
    hidePlanSelectionModal();
    showNotification(`Plan "${plan.nombre}" seleccionado`, 'success');
}

// ========================================
// CARGA Y PERSISTENCIA DE EMPLEADOS
// ========================================

/**
 * Carga empleados desde localStorage para la ciudad seleccionada
 */
function loadEmpleadosFromStorage() {
    console.log('=== CARGANDO EMPLEADOS DESDE LOCALSTORAGE ===');
    
    try {
        const city = getSelectedCityCode();
        if (!city) {
            console.log('No hay ciudad seleccionada');
            return;
        }
        
        const raw = localStorage.getItem('empleadosByCity');
        if (raw) {
            const data = JSON.parse(raw);
            console.log('Datos encontrados en localStorage:', data);
            
            if (data[city]) {
                const empleados = data[city];
                console.log(`Cargando ${Object.keys(empleados).length} empleados para ciudad ${city}`);
                
                return true;
            } else {
                console.log(`No hay empleados en localStorage para ciudad ${city}`);
                return false;
            }
        } else {
            console.log('No hay datos en localStorage');
            return false;
        }
    } catch (e) {
        console.error('Error cargando empleados desde localStorage:', e);
        return false;
    }
}

/**
 * Obtiene el código de la ciudad seleccionada desde sessionStorage
 */
function getSelectedCityCode() {
    try {
        const city = sessionStorage.getItem('selectedCity');
        console.log('Ciudad seleccionada:', city);
        return city;
    } catch (e) {
        console.error('Error obteniendo ciudad seleccionada:', e);
        return null;
    }
}

/**
 * Escucha cambios en la ciudad seleccionada
 */
function initializeCityChangeListener() {
    // Escuchar cambios en sessionStorage
    window.addEventListener('storage', function(e) {
        if (e.key === 'selectedCity') {
            console.log('Ciudad cambió a:', e.newValue);
            loadEmpleadosFromStorage();
        }
    });
    
    // También escuchar cambios en el mismo tab
    const originalSetItem = sessionStorage.setItem;
    sessionStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (key === 'selectedCity') {
            console.log('Ciudad cambió a:', value);
            loadEmpleadosFromStorage();
        }
    };
}

/**
 * Verifica la persistencia de empleados
 */
function verificarPersistenciaEmpleados() {
    console.log('=== VERIFICACIÓN DE PERSISTENCIA DE EMPLEADOS ===');
    const city = getSelectedCityCode();
    console.log('Ciudad actual:', city);
    
    // Verificar localStorage
    const raw = localStorage.getItem('empleadosByCity');
    if (raw) {
        try {
            const data = JSON.parse(raw);
            console.log('Datos en localStorage:', data);
            
            if (data[city]) {
                const empleados = Object.keys(data[city]).length;
                console.log(`✅ Empleados en localStorage para ciudad ${city}: ${empleados}`);
                Object.values(data[city]).forEach(emp => {
                    console.log(`  - ${emp.identificacion}: ${emp.tPrimerNombre} ${emp.tPrimerApellido} (${emp.area})`);
                });
            } else {
                console.log(`❌ No hay empleados en localStorage para ciudad ${city}`);
                console.log('Ciudades disponibles:', Object.keys(data));
            }
        } catch (e) {
            console.error('Error parseando localStorage:', e);
        }
    } else {
        console.log('❌ No hay datos en localStorage');
    }
    
    console.log('===============================================');
}

// ========================================
// VALIDACIÓN DE CONSECUTIVOS DE CONTRATOS
// ========================================

/**
 * Obtiene el rango de consecutivos de contratos para la ciudad actual
 */
function getContractConsecutiveRange() {
    try {
        const cityCode = getSelectedCityCode();
        if (!cityCode) {
            console.log('❌ No hay ciudad seleccionada');
            return null;
        }

        // Buscar en control de consecutivos
        const raw = localStorage.getItem(`controlConsecutivos_${cityCode}`);
        if (!raw) {
            console.log('❌ No hay datos de control de consecutivos para ciudad:', cityCode);
            return null;
        }

        const data = JSON.parse(raw);
        if (!data || data.length === 0) {
            console.log('❌ No hay registros de control de consecutivos');
            return null;
        }

        // Buscar el registro más reciente (último en el array)
        const latestRecord = data[data.length - 1];
        
        if (!latestRecord.contratosInicial || !latestRecord.contratosFinal) {
            console.log('❌ No hay rango de contratos definido');
            return null;
        }

        const range = {
            inicial: parseInt(latestRecord.contratosInicial),
            final: parseInt(latestRecord.contratosFinal)
        };

        console.log('✅ Rango de consecutivos encontrado:', range);
        return range;
    } catch (error) {
        console.error('❌ Error obteniendo rango de consecutivos:', error);
        return null;
    }
}

/**
 * Valida si un número de contrato está dentro del rango permitido
 */
function validateContractNumber(contractNumber) {
    const range = getContractConsecutiveRange();
    if (!range) {
        return {
            valid: false,
            message: 'No se encontró rango de consecutivos para la ciudad actual'
        };
    }

    const number = parseInt(contractNumber);
    if (isNaN(number)) {
        return {
            valid: false,
            message: 'El número de contrato debe ser numérico'
        };
    }

    if (number < range.inicial || number > range.final) {
        return {
            valid: false,
            message: `El número de contrato debe estar entre ${range.inicial} y ${range.final}`
        };
    }

    return {
        valid: true,
        message: 'Número de contrato válido'
    };
}

/**
 * Muestra un mensaje de error debajo del campo de número de contrato
 */
function showContractNumberError(message) {
    const contractNumberInput = document.getElementById('contractNumber');
    if (!contractNumberInput) return;
    
    // Remover mensaje de error existente
    hideContractNumberError();
    
    // Crear elemento de error
    const errorElement = document.createElement('div');
    errorElement.id = 'contractNumberError';
    errorElement.className = 'contract-number-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: block;
    `;
    
    // Insertar después del campo
    contractNumberInput.parentNode.insertBefore(errorElement, contractNumberInput.nextSibling);
}

/**
 * Oculta el mensaje de error del campo de número de contrato
 */
function hideContractNumberError() {
    const errorElement = document.getElementById('contractNumberError');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Muestra información del rango de consecutivos en el formulario
 */
function showConsecutiveRangeInfo() {
    const range = getContractConsecutiveRange();
    if (!range) {
        console.log('❌ No se pudo obtener el rango de consecutivos');
        return;
    }
    
    // Buscar el contenedor del campo de número de contrato
    const contractNumberInput = document.getElementById('contractNumber');
    if (!contractNumberInput) return;
    
    const formGroup = contractNumberInput.closest('.form-group');
    if (!formGroup) return;
    
    // Remover información existente
    hideConsecutiveRangeInfo();
    
    // Crear elemento de información
    const infoElement = document.createElement('div');
    infoElement.id = 'consecutiveRangeInfo';
    infoElement.className = 'consecutive-range-info';
    infoElement.innerHTML = `
        <small style="color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem; display: block;">
            <i class="fas fa-info-circle" style="margin-right: 0.25rem;"></i>
            Rango permitido: ${range.inicial} - ${range.final}
        </small>
    `;
    
    // Insertar después del campo
    formGroup.appendChild(infoElement);
}

/**
 * Oculta la información del rango de consecutivos
 */
function hideConsecutiveRangeInfo() {
    const infoElement = document.getElementById('consecutiveRangeInfo');
    if (infoElement) {
        infoElement.remove();
    }
}

// ========================================
// FUNCIONES GLOBALES EXPUESTAS
// ========================================

// Exponer funciones globalmente para debugging
window.verificarPersistenciaEmpleados = verificarPersistenciaEmpleados;
window.loadEmpleadosFromStorage = loadEmpleadosFromStorage;
window.getSelectedCityCode = getSelectedCityCode;
window.getContractConsecutiveRange = getContractConsecutiveRange;
window.validateContractNumber = validateContractNumber;

