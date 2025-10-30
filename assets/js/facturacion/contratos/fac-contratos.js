/**
 * 📊 FUNCIONALIDAD CONTRATOS - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de contratos.
 * Incluye gestión de modales y operaciones CRUD para contratos.
 * 
 * 🔧 INTEGRACIÓN CON BACKEND:
 * 
 * PUNTOS DE INTEGRACIÓN IDENTIFICADOS:
 * 
 * 1. CARGA DE DATOS INICIAL:
 *    - Línea 479: loadContractsData() - Reemplazar localStorage por API call
 *    - Línea 2196: loadEmpleadosFromStorage() - Reemplazar localStorage por API call
 *    - Línea 336: populateCitySelectOptions() - Reemplazar localStorage por API call
 * 
 * 2. OPERACIONES CRUD:
 *    - Línea 574: saveContractsData() - Reemplazar localStorage por API POST/PUT
 *    - Línea 1382: confirmCreateContract() - Integrar con API de creación
 *    - Línea 1144: confirmUpdateContract() - Integrar con API de actualización
 *    - Línea 622: deleteContract() - Integrar con API de eliminación
 * 
 * 3. BÚSQUEDAS Y VALIDACIONES:
 *    - Línea 813: searchContract() - Integrar con API de búsqueda
 *    - Línea 1862: searchTitularByCedula() - Integrar con API de titulares
 *    - Línea 1931: searchEjecutivoByCedula() - Integrar con API de empleados
 *    - Línea 2354: validateContractNumber() - Integrar con API de validación
 * 
 * 4. REPORTES:
 *    - Línea 1562: generateReport() - Integrar con API de reportes
 * 
 * 5. DATOS MAESTROS:
 *    - Línea 2051: loadPlansForSelection() - Integrar con API de planes
 *    - Línea 2309: getContractConsecutiveRange() - Integrar con API de consecutivos
 * 
 * ESTRUCTURA DE API SUGERIDA:
 * 
 * ENDPOINTS NECESARIOS:
 * - GET /api/contratos?ciudad={codigo} - Obtener contratos por ciudad
 * - POST /api/contratos - Crear nuevo contrato
 * - PUT /api/contratos/{id} - Actualizar contrato
 * - DELETE /api/contratos/{id} - Eliminar contrato
 * - GET /api/contratos/buscar?tipo={tipo}&valor={valor} - Buscar contratos
 * - GET /api/empleados?ciudad={codigo} - Obtener empleados por ciudad
 * - GET /api/titulares?ciudad={codigo}&cedula={cedula} - Buscar titular
 * - GET /api/planes - Obtener planes disponibles
 * - GET /api/consecutivos?ciudad={codigo} - Obtener rango de consecutivos
 * - GET /api/reportes/contratos?fechaInicio={fecha}&fechaFin={fecha} - Generar reporte
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
    try {
        console.log('🚀 Iniciando carga de interfaz de contratos...');
        
        // Inicializar componentes básicos (SIN cargar datos aún)
        initializeModals();
        initializeUserDropdown();
        initializeContractForm();
        initializeCityChangeListener();
        initializeReportButton();
        initializeSearchButton();
        
        console.log('✅ Componentes básicos inicializados');
        
        // Verificar datos de ciudades
        if (!verificarDatosCiudades()) {
            console.log('⚠️ Restaurando datos básicos de ciudades...');
            restaurarDatosCiudadesBasicos();
        }
        
        // Limpiar sessionStorage y mostrar modal INMEDIATAMENTE
        sessionStorage.removeItem('selectedCity');
        
        // Mostrar modal de selección de ciudad INMEDIATAMENTE (sin delay)
        console.log('⏰ Mostrando modal de selección de ciudad...');
        showSelectCityModal();
        
        console.log('✅ Interfaz de contratos cargada correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico al cargar la interfaz:', error);
        // Mostrar mensaje de error en la interfaz
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #ef4444;">
                    <h2>Error al cargar la interfaz</h2>
                    <p>Por favor, recarga la página o contacta al administrador.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #DEB448; color: #1a1a1a; border: none; border-radius: 8px; cursor: pointer;">
                        Recargar Página
                    </button>
                </div>
            `;
        }
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
    // Evitar que clics dentro del contenido del modal se propaguen al overlay
    document.querySelectorAll('.modal-overlay .modal').forEach(mod => {
        mod.addEventListener('click', function(e){ e.stopPropagation(); });
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
    // Resetear el formulario
    document.getElementById('searchType').value = 'contractNumber';
    document.getElementById('searchValue').value = '';
    updateSearchPlaceholder();
    // Enfocar el campo después de un pequeño delay
    setTimeout(() => {
        document.getElementById('searchValue').focus();
    }, 100);
}

function hideSearchContractModal() {
    document.getElementById('searchContractModal').style.display = 'none';
    document.getElementById('searchValue').value = '';
    document.getElementById('searchType').value = 'contractNumber';
}

function updateSearchPlaceholder() {
    const searchType = document.getElementById('searchType').value;
    const searchLabel = document.getElementById('searchLabel');
    const searchInput = document.getElementById('searchValue');
    
    switch(searchType) {
        case 'contractNumber':
            searchLabel.textContent = 'Número de Contrato *';
            searchInput.placeholder = 'Ingrese el número de contrato';
            break;
        case 'clientName':
            searchLabel.textContent = 'Nombre del Titular *';
            searchInput.placeholder = 'Ingrese el nombre del titular';
            break;
        case 'clientId':
            searchLabel.textContent = 'Identificación del Titular *';
            searchInput.placeholder = 'Ingrese la identificación del titular';
            break;
    }
}

function showCreateContractModal() {
    const modal = document.getElementById('createContractModal');
    modal.style.display = 'flex';
    
    // Asegurar que el modal de edición aparezca al frente de los resultados de búsqueda
    modal.style.zIndex = '10000';
    
    // Enfocar campo de identificación del titular al abrir
    setTimeout(function(){
        try { document.getElementById('clientId').focus(); } catch(e) {}
    }, 80);
    
    // Si no estamos editando, mostrar información del rango de consecutivos
    if (!window.editingContractId) {
        // Mostrar información del rango de consecutivos solo para crear
        showConsecutiveRangeInfo();
    }
}

function hideCreateContractModal() {
    document.getElementById('createContractModal').style.display = 'none';
    clearCreateContractForm();
}

/**
 * Actualiza el modal para modo de edición
 */
function updateModalForEdit() {
    const modalTitle = document.querySelector('#createContractModal .modal-title');
    const modalButton = document.getElementById('bCrearContratoModal');
    
    if (modalTitle) {
        modalTitle.textContent = 'ACTUALIZAR CONTRATO';
    }
    
    if (modalButton) {
        modalButton.textContent = 'Actualizar';
    }
}

/**
 * Restaura el modal a su estado original (crear)
 */
function restoreModalForCreate() {
    const modalTitle = document.querySelector('#createContractModal .modal-title');
    const modalButton = document.getElementById('bCrearContratoModal');
    
    if (modalTitle) {
        modalTitle.textContent = 'CREAR CONTRATO';
    }
    
    if (modalButton) {
        modalButton.textContent = 'Crear';
    }
}

/**
 * Busca la identificación del ejecutivo por su nombre
 */
function findExecutiveIdByName(executiveName) {
    try {
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        const selectedCity = getSelectedCityCode();
        
        console.log('🔍 Buscando identificación del ejecutivo por nombre:', executiveName, 'en ciudad:', selectedCity);
        
        if (empleadosByCity && selectedCity) {
            const data = JSON.parse(empleadosByCity);
            
            // Buscar en la ciudad seleccionada
            if (data[selectedCity]) {
                const empleados = data[selectedCity];
                
                // Buscar por nombre completo
                for (const [cedula, empleado] of Object.entries(empleados)) {
                    const nombreCompleto = [
                        empleado.tPrimerNombre || empleado.primerNombre,
                        empleado.tSegundoNombre || empleado.segundoNombre,
                        empleado.tPrimerApellido || empleado.primerApellido,
                        empleado.tSegundoApellido || empleado.segundoApellido
                    ].filter(Boolean).join(' ');
                    
                    // Comparar nombres (case insensitive)
                    if (nombreCompleto.toLowerCase().trim() === executiveName.toLowerCase().trim()) {
                        console.log('✅ Ejecutivo encontrado por nombre:', cedula, nombreCompleto);
                        document.getElementById('executiveId').value = cedula;
                        return;
                    }
                }
                
                console.log('❌ No se encontró ejecutivo con nombre:', executiveName);
            }
        }
        
        // Si no se encuentra, dejar el campo vacío
        document.getElementById('executiveId').value = '';
        
    } catch (error) {
        console.error('❌ Error buscando identificación del ejecutivo:', error);
        document.getElementById('executiveId').value = '';
    }
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
    
    // Restaurar modal a estado de crear y limpiar variable de edición
    restoreModalForCreate();
    window.editingContractId = null;
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
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
}

// ========================================
// MODAL DE SELECCIÓN DE CIUDAD
// ========================================

function showSelectCityModal() {
    console.log('🚀 Mostrando modal de selección de ciudad');
    const modal = document.getElementById('selectCityModal');
    if (modal) {
        console.log('✅ Modal encontrado, configurando...');
        
        // Poblar las opciones de ciudades
        populateCitySelectOptions();
        
        // Mostrar el modal
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';
        document.body.style.overflow = 'hidden';
        
        // Enfocar el select después de un pequeño delay
        setTimeout(() => {
            const citySelect = document.getElementById('citySelect');
            if (citySelect) {
                citySelect.focus();
            }
        }, 100);
        
        console.log('✅ Modal mostrado correctamente');
    } else {
        console.error('❌ No se encontró el modal selectCityModal');
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
        console.log('🔍 Datos de ciudades en localStorage:', raw);
        
        if (raw) {
            const data = JSON.parse(raw);
            console.log('📊 Datos parseados:', data);
            
            ciudades = Object.fromEntries(
                Object.entries(data).filter(([k, v]) => v && typeof v === 'object' && v.codigo && v.nombre)
            );
            console.log('✅ Ciudades filtradas:', ciudades);
        } else {
            console.log('❌ No hay datos de ciudades en localStorage');
        }
    } catch (e) {
        console.error('Error cargando ciudades:', e);
    }
    
    // Limpiar opciones existentes
    citySelect.innerHTML = '<option value="">Seleccione la ciudad</option>';
    
    // Agregar ciudades activas
    const ciudadesActivas = Object.values(ciudades)
        .filter(c => c.activo !== false)
        .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
    
    console.log('🏙️ Ciudades activas encontradas:', ciudadesActivas);
    
    ciudadesActivas.forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad.codigo;
        option.textContent = `${ciudad.codigo} - ${ciudad.nombre.toUpperCase()}`;
        citySelect.appendChild(option);
        console.log(`✅ Agregada ciudad: ${ciudad.codigo} - ${ciudad.nombre}`);
    });
    
    if (ciudadesActivas.length === 0) {
        console.log('⚠️ No se encontraron ciudades activas');
    }
}

function handleSelectCity() {
    console.log('🎯 Función handleSelectCity ejecutada');
    const citySelect = document.getElementById('citySelect');
    const selectedCity = citySelect ? citySelect.value : '';
    
    console.log('🔍 Ciudad seleccionada:', selectedCity);
    
    if (!selectedCity) {
        console.log('❌ No se seleccionó ninguna ciudad');
        showNotification('Por favor, seleccione una ciudad', 'warning');
        return;
    }
    
    console.log('✅ Ciudad válida seleccionada, procesando...');
    
    // Guardar ciudad seleccionada en sessionStorage
    sessionStorage.setItem('selectedCity', selectedCity);
    console.log('💾 Ciudad guardada en sessionStorage:', selectedCity);
    
    // Actualizar el nombre de la ciudad en la interfaz
    updateCurrentCityName(selectedCity);
    
    // Cerrar modal
    hideSelectCityModal();
    
    // Cargar datos de la ciudad seleccionada
    loadEmpleadosFromStorage();
    
    // Cargar contratos de la ciudad seleccionada
    loadContractsData();
    
    // Obtener nombre de la ciudad para mostrar en la notificación
    const cityName = getCityNameByCode(selectedCity);
    const fullCityName = cityName ? `${selectedCity} - ${cityName}` : selectedCity;
    
    // Mostrar notificación con nombre completo de la ciudad
    showNotification(`Ciudad seleccionada: ${fullCityName}`, 'success');
    console.log('✅ Proceso de selección de ciudad completado');
}

/**
 * Obtiene el nombre de la ciudad por su código
 */
function getCityNameByCode(cityCode) {
    try {
        const raw = localStorage.getItem('ciudadesData');
        if (!raw) return null;
        
        const ciudades = JSON.parse(raw);
        const ciudad = ciudades[cityCode];
        
        return ciudad ? ciudad.nombre : null;
    } catch (error) {
        console.error('Error obteniendo nombre de ciudad:', error);
        return null;
    }
}

/**
 * Actualiza el nombre de la ciudad actual en la interfaz
 */
function updateCurrentCityName(cityCode) {
    try {
        // Obtener datos de ciudades desde localStorage
        const raw = localStorage.getItem('ciudadesData');
        if (!raw) {
            console.error('No se encontraron datos de ciudades');
            return;
        }
        
        const ciudades = JSON.parse(raw);
        const ciudad = ciudades[cityCode];
        
        if (!ciudad) {
            console.error('No se encontró la ciudad con código:', cityCode);
            return;
        }
        
        // Actualizar el elemento en la interfaz
        const currentCityNameElement = document.getElementById('currentCityName');
        if (currentCityNameElement) {
            currentCityNameElement.textContent = `${ciudad.codigo} - ${ciudad.nombre.toUpperCase()}`;
            console.log('✅ Ciudad actualizada en la interfaz:', `${ciudad.codigo} - ${ciudad.nombre.toUpperCase()}`);
        } else {
            console.error('No se encontró el elemento currentCityName en el DOM');
        }
    } catch (error) {
        console.error('Error actualizando nombre de ciudad:', error);
    }
}

// ========================================
// CARGA DE DATOS
// ========================================

function loadContractsData() {
    console.log('📊 Cargando datos de contratos...');
    
    // 🔧 BACKEND INTEGRATION POINT - CARGA DE CONTRATOS
    // TODO: Reemplazar localStorage con llamada a API
    // ENDPOINT SUGERIDO: GET /api/contratos?ciudad={codigo}
    // EJEMPLO DE IMPLEMENTACIÓN:
    // try {
    //     const response = await fetch(`/api/contratos?ciudad=${selectedCity}`);
    //     const data = await response.json();
    //     contractsData = data.contratos || [];
    // } catch (error) {
    //     console.error('Error cargando contratos desde API:', error);
    //     contractsData = [];
    // }
    
    // Cargar contratos desde localStorage para la ciudad actual
    const selectedCity = getSelectedCityCode();
    if (selectedCity) {
        const storedContracts = localStorage.getItem(`contratos_${selectedCity}`);
        if (storedContracts) {
            try {
                contractsData = JSON.parse(storedContracts);
                console.log(`✅ Cargados ${contractsData.length} contratos para ciudad ${selectedCity}`);
            } catch (error) {
                console.error('❌ Error cargando contratos:', error);
                contractsData = [];
            }
        } else {
            console.log('ℹ️ No hay contratos guardados para esta ciudad');
            contractsData = [];
        }
    } else {
        console.log('⚠️ No hay ciudad seleccionada');
        contractsData = [];
    }
    
    const tbody = document.getElementById('contractsTableBody');
    tbody.innerHTML = '';
    
    if (contractsData.length === 0) {
        const selectedCity = getSelectedCityCode();
        if (!selectedCity) {
            // No hay ciudad seleccionada
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-city"></i>
                            <p>Seleccione una ciudad para ver los contratos</p>
                            <small>Use el botón "Seleccionar Ciudad" para comenzar</small>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            // Hay ciudad seleccionada pero no hay contratos
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
        }
        return;
    }
    
    contractsData.forEach(contract => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="contract-number">${contract.contractNumber}</td>
            <td class="production-record">${contract.productionRecord}</td>
            <td class="client-id">${contract.clientId}</td>
            <td class="client-name">${contract.clientName}</td>
            <td class="plan-cell"><span class="plan-badge">${contract.plan}</span></td>
            <td class="executive-name">${contract.executive}</td>
            <td class="status-cell">
                <div class="status-badge ${contract.estado === 'activo' ? 'status-active' : 'status-inactive'}">
                    ${contract.estado === 'activo' ? 'ACTIVO' : 'ANULADO'}
                </div>
            </td>
            <td class="action-buttons-cell">
                <div class="action-buttons-container">
                    <button class="btn-icon btn-edit" onclick="editContract(${contract.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <div class="status-toggle-container">
                        <label class="status-toggle">
                            <input type="checkbox" ${contract.estado === 'activo' ? 'checked' : ''} 
                                   onchange="toggleContractStatus(${contract.id}, this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Guarda los contratos en localStorage para la ciudad actual
 * 
 * 🔧 BACKEND INTEGRATION POINT - PERSISTENCIA DE CONTRATOS
 * TODO: Reemplazar localStorage con llamada a API
 * ENDPOINT SUGERIDO: POST /api/contratos (para crear) o PUT /api/contratos/{id} (para actualizar)
 * EJEMPLO DE IMPLEMENTACIÓN:
 * try {
 *     const response = await fetch('/api/contratos', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify(contractsData)
 *     });
 *     if (response.ok) {
 *         console.log('✅ Contratos guardados en backend');
 *     }
 * } catch (error) {
 *     console.error('❌ Error guardando contratos en backend:', error);
 * }
 */
function saveContractsData() {
    const selectedCity = getSelectedCityCode();
    if (selectedCity) {
        try {
            localStorage.setItem(`contratos_${selectedCity}`, JSON.stringify(contractsData));
            console.log(`💾 Guardados ${contractsData.length} contratos para ciudad ${selectedCity}`);
        } catch (error) {
            console.error('❌ Error guardando contratos:', error);
        }
    } else {
        console.log('⚠️ No hay ciudad seleccionada para guardar contratos');
    }
}

// ========================================
// OPERACIONES CRUD - CONTRATOS
// ========================================

function editContract(id) {
    const contract = contractsData.find(c => c.id === id);
    if (!contract) return;
    
    // Establecer modo de edición
    window.editingContractId = id;
    
    // Llenar formulario con datos existentes
    document.getElementById('contractNumber').value = contract.contractNumber;
    document.getElementById('productionRecord').value = contract.productionRecord;
    document.getElementById('clientId').value = contract.clientId;
    document.getElementById('clientName').value = contract.clientName;
    document.getElementById('plan').value = contract.plan;
    document.getElementById('executiveName').value = contract.executive;
    document.getElementById('contractDate').value = contract.contractDate;
    
    // Si no hay executiveId guardado, intentar buscarlo por el nombre
    if (contract.executiveId) {
        document.getElementById('executiveId').value = contract.executiveId;
    } else {
        // Buscar la identificación del ejecutivo por el nombre
        findExecutiveIdByName(contract.executive);
    }
    
    // Actualizar título y botón del modal
    updateModalForEdit();
    
    showCreateContractModal();
}

function deleteContract(id) {
    // 🔧 BACKEND INTEGRATION POINT - ELIMINACIÓN DE CONTRATOS
    // TODO: Integrar con API de eliminación
    // ENDPOINT SUGERIDO: DELETE /api/contratos/{id}
    // EJEMPLO DE IMPLEMENTACIÓN:
    // if (confirm('¿Está seguro de que desea eliminar este contrato?')) {
    //     try {
    //         const response = await fetch(`/api/contratos/${id}`, {
    //             method: 'DELETE'
    //         });
    //         if (response.ok) {
    //             contractsData = contractsData.filter(c => c.id !== id);
    //             loadContractsData();
    //             showNotification('Contrato eliminado exitosamente', 'success');
    //         } else {
    //             showNotification('Error al eliminar el contrato', 'error');
    //         }
    //     } catch (error) {
    //         console.error('Error eliminando contrato:', error);
    //         showNotification('Error al eliminar el contrato', 'error');
    //     }
    // }
    
    if (confirm('¿Está seguro de que desea eliminar este contrato?')) {
        contractsData = contractsData.filter(c => c.id !== id);
        
        // Guardar cambios en localStorage
        saveContractsData();
        
        // Recargar la tabla
        loadContractsData();
        
        showNotification('Contrato eliminado exitosamente', 'success');
    }
}

function toggleContractStatus(id, isActive) {
    const contract = contractsData.find(c => c.id === id);
    if (!contract) return;
    
    const newStatus = isActive ? 'activo' : 'anulado';
    const action = isActive ? 'activar' : 'anular';
    
    // Mostrar modal de confirmación
    showConfirmToggleContractModal(contract, newStatus, action);
}

function showConfirmToggleContractModal(contract, newStatus, action) {
    const modal = document.getElementById('confirmToggleContractModal');
    const title = modal.querySelector('.modal-title');
    const message = modal.querySelector('.modal-message');
    
    title.textContent = `CONFIRMAR ${action.toUpperCase()}`;
    message.textContent = `¿Está seguro de que desea ${action} el contrato ${contract.contractNumber}?`;
    
    modal.style.display = 'flex';
    // Asegurar que el modal de confirmación de toggle aparezca al frente de los resultados de búsqueda
    modal.style.zIndex = '15000';
    
    // Guardar datos para confirmación
    window.pendingToggle = { contract, newStatus, action };
}

function confirmToggleContract() {
    if (!window.pendingToggle) return;
    
    const { contract, newStatus } = window.pendingToggle;
    contract.estado = newStatus;
    
    // Guardar cambios en localStorage
    saveContractsData();
    
    // Actualizar la tabla principal
    loadContractsData();
    
    // Actualizar modal de resultados de búsqueda si existe
    updateSearchResultsModal();
    
    // Cerrar modal
    hideConfirmToggleContractModal();
    
    // Mostrar modal de éxito
    showSuccessToggleContractModal(contract, newStatus);
    
    // Limpiar datos pendientes
    window.pendingToggle = null;
}

function cancelToggleContract() {
    hideConfirmToggleContractModal();
    window.pendingToggle = null;
    // Recargar datos para revertir el toggle
    loadContractsData();
    // Actualizar modal de resultados de búsqueda si existe
    updateSearchResultsModal();
}

function hideConfirmToggleContractModal() {
    document.getElementById('confirmToggleContractModal').style.display = 'none';
}

function showSuccessToggleContractModal(contract, newStatus) {
    const modal = document.getElementById('successToggleContractModal');
    const message = modal.querySelector('.modal-message');
    
    message.textContent = `Contrato ${contract.contractNumber} ${newStatus === 'activo' ? 'activado' : 'anulado'} exitosamente`;
    modal.style.display = 'flex';
    // Asegurar que el modal de éxito de toggle aparezca al frente de los resultados de búsqueda
    modal.style.zIndex = '15000';
}

function closeSuccessToggleContractModal() {
    document.getElementById('successToggleContractModal').style.display = 'none';
}

// ========================================
// EVENT LISTENERS PARA FORMULARIOS
// ========================================

// Crear/Actualizar Contrato - Event listener para el botón dentro del modal
document.getElementById('bCrearContratoModal')?.addEventListener('click', function() {
    const planInput = document.getElementById('plan');
    const planData = planInput.getAttribute('data-plan-data');
    
    const contractData = {
        contractNumber: document.getElementById('contractNumber').value,
        productionRecord: document.getElementById('productionRecord').value,
        clientId: document.getElementById('clientId').value,
        clientName: document.getElementById('clientName').value,
        plan: document.getElementById('plan').value,
        planCode: planInput.getAttribute('data-plan-code'),
        planData: planData ? JSON.parse(planData) : null,
        executiveId: document.getElementById('executiveId').value,
        executive: document.getElementById('executiveName').value,
        contractDate: document.getElementById('contractDate').value,
        estado: 'activo' // Estado por defecto
    };
    
    // Validar campos requeridos
    if (!validateContractForm(contractData)) {
        return;
    }
    
    // Verificar si estamos editando o creando
    if (window.editingContractId) {
        // Mostrar modal de confirmación para actualizar
        showConfirmUpdateContractModal(contractData);
    } else {
        // Mostrar modal de confirmación para crear
        showConfirmCreateContractModal(contractData);
    }
});

// ========================================
// INICIALIZACIÓN DEL BOTÓN DE REPORTE
// ========================================

function initializeReportButton() {
    const bGenerarReporte = document.getElementById('bGenerarReporte');
    if (bGenerarReporte) {
        bGenerarReporte.addEventListener('click', function() {
            console.log('🔍 Botón de generar reporte clickeado');
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            console.log('📅 Fechas obtenidas:', { startDate, endDate });
            
            if (!startDate || !endDate) {
                showNotification('Por favor complete todos los campos', 'warning');
                return;
            }
            
            generateReport(startDate, endDate);
            hideReportModal();
        });
        console.log('✅ Botón de reporte inicializado');
    } else {
        console.error('❌ No se encontró el botón bGenerarReporte');
    }
}

// ========================================
// INICIALIZACIÓN DEL BOTÓN DE BÚSQUEDA
// ========================================

function initializeSearchButton() {
    const bBuscarContratoModal = document.getElementById('bBuscarContratoModal');
    if (bBuscarContratoModal) {
        bBuscarContratoModal.addEventListener('click', function() {
            console.log('🔍 Botón de búsqueda del modal clickeado');
            const searchType = document.getElementById('searchType').value;
            const searchValue = document.getElementById('searchValue').value;
            
            console.log('📋 Parámetros de búsqueda:', { searchType, searchValue });
            
            if (!searchValue.trim()) {
                showNotification('Por favor ingrese un valor de búsqueda', 'warning');
                return;
            }
            
            searchContract(searchType, searchValue);
            hideSearchContractModal();
        });
        console.log('✅ Botón de búsqueda del modal inicializado');
    } else {
        console.error('❌ No se encontró el botón bBuscarContratoModal');
    }
}

// ========================================
// FUNCIÓN DE BÚSQUEDA DE CONTRATOS
// ========================================

function searchContract(searchType, searchValue) {
    console.log('🔍 Iniciando búsqueda:', { searchType, searchValue });
    console.log('📊 Total contratos disponibles:', contractsData.length);
    console.log('📋 Contratos disponibles:', contractsData);
    
    // 🔧 BACKEND INTEGRATION POINT - BÚSQUEDA DE CONTRATOS
    // TODO: Reemplazar búsqueda local con llamada a API
    // ENDPOINT SUGERIDO: GET /api/contratos/buscar?tipo={searchType}&valor={searchValue}&ciudad={selectedCity}
    // EJEMPLO DE IMPLEMENTACIÓN:
    // try {
    //     const selectedCity = getSelectedCityCode();
    //     const response = await fetch(`/api/contratos/buscar?tipo=${searchType}&valor=${searchValue}&ciudad=${selectedCity}`);
    //     const data = await response.json();
    //     const filteredContracts = data.contratos || [];
    //     displaySearchResults(filteredContracts);
    //     return;
    // } catch (error) {
    //     console.error('Error en búsqueda de contratos:', error);
    //     showNotification('Error al buscar contratos', 'error');
    //     return;
    // }
    
    // Guardar criterios de búsqueda para actualización posterior
    window.currentSearchType = searchType;
    window.currentSearchValue = searchValue;
    
    let filteredContracts = [];
    
    switch(searchType) {
        case 'contractNumber':
            filteredContracts = contractsData.filter(contract => 
                contract.contractNumber.toLowerCase().includes(searchValue.toLowerCase())
            );
            break;
        case 'clientName':
            console.log('🔍 Buscando por nombre del cliente:', searchValue);
            filteredContracts = contractsData.filter(contract => {
                console.log('📝 Contrato:', contract.clientName, 'vs búsqueda:', searchValue);
                return contract.clientName.toLowerCase().includes(searchValue.toLowerCase());
            });
            break;
        case 'clientId':
            console.log('🔍 Buscando por identificación del cliente:', searchValue);
            filteredContracts = contractsData.filter(contract => {
                console.log('📝 Contrato:', contract.clientId, 'vs búsqueda:', searchValue);
                return contract.clientId.toLowerCase().includes(searchValue.toLowerCase());
            });
            break;
        default:
            showNotification('Tipo de búsqueda no válido', 'error');
            return;
    }
    
    console.log('📊 Resultados de búsqueda:', filteredContracts.length, filteredContracts);
    
    if (filteredContracts.length === 0) {
        showNotification('No se encontraron contratos con los criterios de búsqueda', 'warning');
        return;
    }
    
    // Mostrar resultados en la tabla
    displaySearchResults(filteredContracts);
    showNotification(`Se encontraron ${filteredContracts.length} contrato(s)`, 'success');
}

function displaySearchResults(contracts) {
    // Crear modal de resultados como en planes
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'searchResultsModal';
    modal.style.display = 'flex';
    modal.style.zIndex = '2000';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.backdropFilter = 'blur(5px)';
    modal.innerHTML = `
        <div class="modal modal-large">
            <div class="modal-header">
                <h3 class="modal-title">RESULTADOS DE BÚSQUEDA</h3>
                <button class="modal-close" onclick="closeSearchResultsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="data-table">
                    <table class="table contracts-table">
                        <thead>
                            <tr>
                                <th># Contrato</th>
                                <th>Record Produccion</th>
                                <th>Identificacion</th>
                                <th>Titular</th>
                                <th>Plan</th>
                                <th>Ejecutivo</th>
                                <th>Estado</th>
                                <th>Opciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${contracts.map(contract => `
                                <tr>
                                    <td class="contract-number">${contract.contractNumber}</td>
                                    <td class="production-record">${contract.productionRecord}</td>
                                    <td class="client-id">${contract.clientId}</td>
                                    <td class="client-name">${contract.clientName}</td>
                                    <td class="plan-cell"><span class="plan-badge">${contract.plan}</span></td>
                                    <td class="executive-name">${contract.executive}</td>
                                    <td class="status-cell">
                                        <div class="status-badge ${contract.estado === 'activo' ? 'status-active' : 'status-inactive'}">
                                            ${contract.estado === 'activo' ? 'ACTIVO' : 'ANULADO'}
                                        </div>
                                    </td>
                                    <td class="action-buttons-cell">
                                        <div class="action-buttons-container">
                                            <button class="btn-icon btn-edit" onclick="editContract(${contract.id})" title="Editar">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <div class="status-toggle-container">
                                                <label class="status-toggle">
                                                    <input type="checkbox" ${contract.estado === 'activo' ? 'checked' : ''} 
                                                           onchange="toggleContractStatus(${contract.id}, this.checked)">
                                                    <span class="toggle-slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeSearchResultsModal()">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeSearchResultsModal() {
    const modal = document.getElementById('searchResultsModal');
    if (modal) {
        modal.remove();
    }
}

function viewContractDetails(contractId) {
    const contract = contractsData.find(c => c.id === contractId);
    if (contract) {
        // Mostrar modal con detalles del contrato
        showContractDetailsModal(contract);
    }
}

function showContractDetailsModal(contract) {
    // Crear modal de detalles
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'contractDetailsModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">DETALLES DEL CONTRATO</h3>
                <button class="modal-close" onclick="closeContractDetailsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="contract-details">
                    <div class="detail-row">
                        <strong>Número de Contrato:</strong> ${contract.contractNumber}
                    </div>
                    <div class="detail-row">
                        <strong>Record de Producción:</strong> ${contract.productionRecord}
                    </div>
                    <div class="detail-row">
                        <strong>Identificación:</strong> ${contract.clientId}
                    </div>
                    <div class="detail-row">
                        <strong>Titular:</strong> ${contract.clientName}
                    </div>
                    <div class="detail-row">
                        <strong>Plan:</strong> ${contract.plan}
                    </div>
                    <div class="detail-row">
                        <strong>Ejecutivo:</strong> ${contract.executive}
                    </div>
                    <div class="detail-row">
                        <strong>Fecha:</strong> ${new Date(contract.contractDate).toLocaleDateString('es-CO')}
                    </div>
                    <div class="detail-row">
                        <strong>Estado:</strong> <span class="status-badge ${contract.estado === 'activo' ? 'status-active' : 'status-inactive'}">${contract.estado === 'activo' ? 'ACTIVO' : 'ANULADO'}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeContractDetailsModal()">Cerrar</button>
                <button class="btn btn-primary" onclick="editContract(${contract.id}); closeContractDetailsModal();">Editar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeContractDetailsModal() {
    const modal = document.getElementById('contractDetailsModal');
    if (modal) {
        modal.remove();
    }
}

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
    
    // Validar que se haya seleccionado un plan válido (solo para crear, no para editar)
    if (!window.editingContractId && !data.planCode) {
        showNotification('Por favor seleccione un plan válido', 'warning');
        return false;
    }
    
    // Si estamos editando, usar validación específica para edición
    if (window.editingContractId) {
        return validateContractFormForEdit(data);
    }
    
    // Validaciones para crear nuevo contrato
    // Validar que el número de contrato esté dentro del rango de consecutivos
    const contractValidation = validateContractNumber(data.contractNumber);
    if (!contractValidation.valid) {
        showNotification(contractValidation.message, 'warning');
        return false;
    }
    
    // Validar que no exista un contrato activo con el mismo número
    const duplicateValidation = validateContractDuplicate(data.contractNumber);
    if (!duplicateValidation.valid) {
        showNotification(duplicateValidation.message, 'warning');
        return false;
    }
    
    return true;
}

/**
 * Validación específica para edición de contratos
 */
function validateContractFormForEdit(data) {
    // Validaciones básicas (campos requeridos ya validados en validateContractForm)
    
    // Si cambió el número de contrato, validar duplicados (excluyendo el contrato actual)
    const currentContract = contractsData.find(c => c.id === window.editingContractId);
    if (currentContract && currentContract.contractNumber !== data.contractNumber) {
        const duplicateValidation = validateContractDuplicateForEdit(data.contractNumber, window.editingContractId);
        if (!duplicateValidation.valid) {
            showNotification(duplicateValidation.message, 'warning');
            return false;
        }
    }
    
    return true;
}

/**
 * Valida duplicados para edición (excluye el contrato actual)
 */
function validateContractDuplicateForEdit(contractNumber, currentContractId) {
    // Buscar si ya existe un contrato con el mismo número (excluyendo el actual)
    const existingContract = contractsData.find(contract => 
        contract.contractNumber === contractNumber && contract.id !== currentContractId
    );
    
    if (!existingContract) {
        return {
            valid: true,
            message: 'Número de contrato disponible'
        };
    }
    
    // Si existe y está ACTIVO, no permitir duplicado
    if (existingContract.estado === 'activo') {
        return {
            valid: false,
            message: `Ya existe un contrato ACTIVO con el número ${contractNumber}. No se puede usar este número.`
        };
    }
    
    return {
        valid: true,
        message: 'Número de contrato disponible'
    };
}

/**
 * Muestra el modal de confirmación para actualizar contrato
 */
function showConfirmUpdateContractModal(contractData) {
    const modal = document.getElementById('confirmUpdateContractModal');
    if (!modal) {
        console.error('❌ No se encontró el modal de confirmación de actualización');
        return;
    }
    
    const message = modal.querySelector('.modal-message');
    if (message) {
        message.textContent = `¿Está seguro de que desea actualizar el contrato ${contractData.contractNumber}?`;
    }
    
    // Guardar datos del contrato para confirmación
    window.pendingUpdateContract = contractData;
    
    modal.style.display = 'flex';
    // Asegurar que el modal de confirmación aparezca al frente de los resultados de búsqueda
    modal.style.zIndex = '25000';
}

/**
 * Confirma la actualización del contrato
 * 
 * 🔧 BACKEND INTEGRATION POINT - ACTUALIZACIÓN DE CONTRATOS
 * TODO: Integrar con API de actualización
 * ENDPOINT SUGERIDO: PUT /api/contratos/{id}
 * EJEMPLO DE IMPLEMENTACIÓN:
 * try {
 *     const response = await fetch(`/api/contratos/${window.editingContractId}`, {
 *         method: 'PUT',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify(contractData)
 *     });
 *     if (response.ok) {
 *         const updatedContract = await response.json();
 *         const contractIndex = contractsData.findIndex(c => c.id === window.editingContractId);
 *         if (contractIndex !== -1) {
 *             contractsData[contractIndex] = updatedContract;
 *             loadContractsData();
 *             hideConfirmUpdateContractModal();
 *             hideCreateContractModal();
 *             showSuccessUpdateContractModal();
 *         }
 *     } else {
 *         showNotification('Error al actualizar el contrato', 'error');
 *     }
 * } catch (error) {
 *     console.error('Error actualizando contrato:', error);
 *     showNotification('Error al actualizar el contrato', 'error');
 * }
 */
function confirmUpdateContract() {
    if (!window.pendingUpdateContract || !window.editingContractId) {
        console.error('❌ No hay datos de contrato pendientes para actualizar');
        return;
    }
    
    const contractData = window.pendingUpdateContract;
    const contractIndex = contractsData.findIndex(c => c.id === window.editingContractId);
    
    if (contractIndex !== -1) {
        contractData.id = window.editingContractId;
        contractData.estado = contractsData[contractIndex].estado; // Mantener estado actual
        contractsData[contractIndex] = contractData;
        
        // Guardar en localStorage
        saveContractsData();
        
        // Actualizar modal de resultados de búsqueda si existe (usando datos en memoria)
        updateSearchResultsModal();
        
        // Recargar la tabla principal
        loadContractsData();
        
        // Cerrar modales
        hideConfirmUpdateContractModal();
        hideCreateContractModal();
        
        // Mostrar modal de éxito (igual que en otras interfaces)
        showSuccessUpdateContractModal();
    }
    
    // Limpiar datos pendientes y variable de edición
    window.pendingUpdateContract = null;
    window.editingContractId = null;
}

/**
 * Cancela la actualización del contrato
 */
function cancelUpdateContract() {
    hideConfirmUpdateContractModal();
    window.pendingUpdateContract = null;
    window.editingContractId = null;
}

/**
 * Oculta el modal de confirmación de actualización
 */
function hideConfirmUpdateContractModal() {
    const modal = document.getElementById('confirmUpdateContractModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Muestra el modal de éxito para actualización de contrato
 */
function showSuccessUpdateContractModal() {
    const modal = document.getElementById('successUpdateContractModal');
    if (modal) {
        // Actualizar el mensaje del modal
        const messageElement = modal.querySelector('.modal-message');
        if (messageElement) {
            messageElement.textContent = 'Se ha actualizado con éxito el Contrato!';
        }

        modal.style.display = 'flex';
        // Asegurar que el modal de éxito aparezca al frente de todo
        modal.style.zIndex = '25000';
    }
}

/**
 * Cierra el modal de éxito de actualización
 */
function closeSuccessUpdateContractModal() {
    const modal = document.getElementById('successUpdateContractModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Actualiza el modal de resultados de búsqueda si existe
 */
function updateSearchResultsModal() {
    const searchResultsModal = document.getElementById('searchResultsModal');
    if (!searchResultsModal) return;
    
    console.log('🔄 Actualizando modal de resultados de búsqueda...');
    console.log('📊 Total contratos disponibles:', contractsData.length);
    
    // Obtener los contratos filtrados actuales (si hay filtros aplicados)
    const currentSearchType = window.currentSearchType;
    const currentSearchValue = window.currentSearchValue;
    
    console.log('🔍 Criterios de búsqueda actuales:', { currentSearchType, currentSearchValue });
    
    let contractsToShow = [];
    
    if (currentSearchType && currentSearchValue) {
        // Re-filtrar con los mismos criterios
        switch(currentSearchType) {
            case 'contractNumber':
                contractsToShow = contractsData.filter(contract => 
                    contract.contractNumber.toLowerCase().includes(currentSearchValue.toLowerCase())
                );
                break;
            case 'clientName':
                contractsToShow = contractsData.filter(contract => 
                    contract.clientName.toLowerCase().includes(currentSearchValue.toLowerCase())
                );
                break;
            case 'clientId':
                contractsToShow = contractsData.filter(contract => 
                    contract.clientId.toLowerCase().includes(currentSearchValue.toLowerCase())
                );
                break;
        }
        
        // Si no se encontraron contratos y estamos editando, verificar si el contrato editado ya no coincide
        if (contractsToShow.length === 0 && window.editingContractId) {
            const editedContract = contractsData.find(c => c.id === window.editingContractId);
            if (editedContract) {
                console.log('🔍 Contrato editado ya no coincide con criterios de búsqueda:', editedContract);
                
                // Agregar el contrato editado a los resultados con una indicación especial
                contractsToShow = [editedContract];
                console.log('✅ Agregando contrato editado a los resultados');
            }
        }
        
        console.log('📋 Contratos filtrados encontrados:', contractsToShow.length);
    } else {
        contractsToShow = contractsData;
        console.log('📋 Mostrando todos los contratos:', contractsToShow.length);
    }
    
    // Actualizar el contenido del modal existente
    updateSearchResultsContent(contractsToShow);
}

/**
 * Actualiza solo el contenido del modal de resultados existente
 */
function updateSearchResultsContent(contracts) {
    const searchResultsModal = document.getElementById('searchResultsModal');
    if (!searchResultsModal) return;
    
    // Buscar el tbody dentro del modal existente
    const tbody = searchResultsModal.querySelector('tbody');
    if (!tbody) return;
    
    // Limpiar contenido actual
    tbody.innerHTML = '';
    
    if (contracts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron contratos</p>
                        <small>Intente con otros criterios de búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Agregar las filas actualizadas
    contracts.forEach(contract => {
        const row = document.createElement('tr');
        
        // Usar los valores originales sin indicaciones visuales
        const contractNumberDisplay = contract.contractNumber;
        const clientNameDisplay = contract.clientName;
        const clientIdDisplay = contract.clientId;
        
        row.innerHTML = `
            <td class="contract-number">${contractNumberDisplay}</td>
            <td class="production-record">${contract.productionRecord}</td>
            <td class="client-id">${clientIdDisplay}</td>
            <td class="client-name">${clientNameDisplay}</td>
            <td class="plan-cell"><span class="plan-badge">${contract.plan}</span></td>
            <td class="executive-name">${contract.executive}</td>
            <td class="status-cell">
                <div class="status-badge ${contract.estado === 'activo' ? 'status-active' : 'status-inactive'}">
                    ${contract.estado === 'activo' ? 'ACTIVO' : 'ANULADO'}
                </div>
            </td>
            <td class="action-buttons-cell">
                <div class="action-buttons-container">
                    <button class="btn-icon btn-edit" onclick="editContract(${contract.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <div class="status-toggle-container">
                        <label class="status-toggle">
                            <input type="checkbox" ${contract.estado === 'activo' ? 'checked' : ''} 
                                   onchange="toggleContractStatus(${contract.id}, this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Muestra el modal de confirmación para crear contrato
 */
function showConfirmCreateContractModal(contractData) {
    const modal = document.getElementById('confirmCreateContractModal');
    if (!modal) {
        console.error('❌ No se encontró el modal de confirmación de creación');
        return;
    }
    
    const message = modal.querySelector('.modal-message');
    if (message) {
        message.textContent = `¿Está seguro de que desea crear el contrato ${contractData.contractNumber}?`;
    }
    
    // Guardar datos del contrato para confirmación
    window.pendingCreateContract = contractData;
    
    modal.style.display = 'flex';
    // Asegurar que el modal de confirmación aparezca al frente
    modal.style.zIndex = '25000';
}

/**
 * Confirma la creación del contrato
 * 
 * 🔧 BACKEND INTEGRATION POINT - CREACIÓN DE CONTRATOS
 * TODO: Integrar con API de creación
 * ENDPOINT SUGERIDO: POST /api/contratos
 * EJEMPLO DE IMPLEMENTACIÓN:
 * try {
 *     const response = await fetch('/api/contratos', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify(contractData)
 *     });
 *     if (response.ok) {
 *         const newContract = await response.json();
 *         contractsData.push(newContract);
 *         loadContractsData();
 *         hideConfirmCreateContractModal();
 *         hideCreateContractModal();
 *         showSuccessCreateContractModal();
 *     } else {
 *         showNotification('Error al crear el contrato', 'error');
 *     }
 * } catch (error) {
 *     console.error('Error creando contrato:', error);
 *     showNotification('Error al crear el contrato', 'error');
 * }
 */
function confirmCreateContract() {
    if (!window.pendingCreateContract) {
        console.error('❌ No hay datos de contrato pendientes para crear');
        return;
    }
    
    const contractData = window.pendingCreateContract;
    contractData.id = contractsData.length + 1;
    contractsData.push(contractData);
    
    // Guardar en localStorage
    saveContractsData();
    
    // Recargar la tabla
    loadContractsData();
    
    // Cerrar modales
    hideConfirmCreateContractModal();
    hideCreateContractModal();
    
    // Mostrar modal de éxito
    showSuccessCreateContractModal();
    
    // Limpiar datos pendientes
    window.pendingCreateContract = null;
}

/**
 * Cancela la creación del contrato
 */
function cancelCreateContract() {
    hideConfirmCreateContractModal();
}

/**
 * Oculta el modal de confirmación de creación
 */
function hideConfirmCreateContractModal() {
    const modal = document.getElementById('confirmCreateContractModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Muestra el modal de éxito para creación de contrato
 */
function showSuccessCreateContractModal() {
    const modal = document.getElementById('successCreateContractModal');
    if (modal) {
        // Actualizar el mensaje del modal
        const messageElement = modal.querySelector('.modal-message');
        if (messageElement) {
            messageElement.textContent = 'Se ha creado con éxito el Contrato!';
        }

        modal.style.display = 'flex';
        // Asegurar que el modal de éxito aparezca al frente de todo
        modal.style.zIndex = '25000';
    }
}

/**
 * Cierra el modal de éxito de creación
 */
function closeSuccessCreateContractModal() {
    const modal = document.getElementById('successCreateContractModal');
    if (modal) {
        modal.style.display = 'none';
    }
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

/**
 * Obtiene la información completa de un plan por su código
 */
function getPlanDataByCode(planCode) {
    try {
        const planesData = localStorage.getItem('planesData');
        if (!planesData) {
            console.log('❌ No hay datos de planes en localStorage');
            return null;
        }
        
        const planes = JSON.parse(planesData);
        console.log('📊 Planes disponibles:', planes);
        
        // Buscar el plan por código
        for (const [key, plan] of Object.entries(planes)) {
            if (plan.codigo === planCode) {
                console.log('✅ Plan encontrado:', plan);
                return plan;
            }
        }
        
        console.log('❌ No se encontró plan con código:', planCode);
        return null;
    } catch (error) {
        console.error('❌ Error obteniendo datos del plan:', error);
        return null;
    }
}

/**
 * Obtiene la información completa de un plan por su nombre
 */
function getPlanDataByName(planName) {
    try {
        const planesData = localStorage.getItem('planesData');
        if (!planesData) {
            console.log('❌ No hay datos de planes en localStorage');
            return null;
        }
        
        const planes = JSON.parse(planesData);
        console.log('📊 Planes disponibles para búsqueda por nombre:', planes);
        
        // Buscar el plan por nombre (case insensitive)
        for (const [key, plan] of Object.entries(planes)) {
            if (plan.nombre && plan.nombre.toLowerCase().trim() === planName.toLowerCase().trim()) {
                console.log('✅ Plan encontrado por nombre:', plan);
                console.log('🔍 Campos del plan encontrado:', Object.keys(plan));
                console.log('🔢 Número de cuotas en el plan:', plan.numCuotas || plan.numeroCuotas || plan.cuotas || plan.totalCuotas || 'NO ENCONTRADO');
                return plan;
            }
        }
        
        console.log('❌ No se encontró plan con nombre:', planName);
        return null;
    } catch (error) {
        console.error('❌ Error obteniendo datos del plan por nombre:', error);
        return null;
    }
}

/**
 * Función de debugging para verificar todos los planes disponibles
 */
function debugAllPlans() {
    try {
        const planesData = localStorage.getItem('planesData');
        if (!planesData) {
            console.log('❌ No hay datos de planes en localStorage');
            return;
        }
        
        const planes = JSON.parse(planesData);
        console.log('🔍 DEBUGGING: Todos los planes disponibles:');
        
        for (const [key, plan] of Object.entries(planes)) {
            console.log(`📋 Plan: ${plan.nombre || 'SIN NOMBRE'} (${key})`);
            console.log('   Campos:', Object.keys(plan));
            console.log('   Valores:', {
                numCuotas: plan.numCuotas,
                numeroCuotas: plan.numeroCuotas,
                cuotas: plan.cuotas,
                totalCuotas: plan.totalCuotas,
                valorPlan: plan.valorPlan,
                cuotaInicial: plan.cuotaInicial,
                mensualidad: plan.mensualidad
            });
            console.log('---');
        }
    } catch (error) {
        console.error('❌ Error en debugging de planes:', error);
    }
}

function generateReport(startDate, endDate) {
    console.log('📊 Generando reporte:', { startDate, endDate });
    console.log('📋 Total contratos disponibles:', contractsData.length);
    console.log('📋 Contratos disponibles:', contractsData);
    
    // 🔧 BACKEND INTEGRATION POINT - GENERACIÓN DE REPORTES
    // TODO: Reemplazar generación local con llamada a API
    // ENDPOINT SUGERIDO: GET /api/reportes/contratos?fechaInicio={startDate}&fechaFin={endDate}&ciudad={selectedCity}
    // EJEMPLO DE IMPLEMENTACIÓN:
    // try {
    //     const selectedCity = getSelectedCityCode();
    //     const response = await fetch(`/api/reportes/contratos?fechaInicio=${startDate}&fechaFin=${endDate}&ciudad=${selectedCity}`);
    //     const data = await response.json();
    //     
    //     // Guardar datos del reporte para la página de reporte
    //     localStorage.setItem('reporteContratosData', JSON.stringify(data));
    //     
    //     // Abrir reporte en nueva pestaña
    //     const reportUrl = `reporte-contratos.html`;
    //     window.open(reportUrl, '_blank');
    //     return;
    // } catch (error) {
    //     console.error('Error generando reporte:', error);
    //     showNotification('Error al generar el reporte', 'error');
    //     return;
    // }
    
    // Filtrar contratos por rango de fechas
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    console.log('📅 Rango de fechas para filtrado:', { start, end });
    
    const filteredContracts = contractsData.filter(contract => {
        const contractDate = new Date(contract.contractDate);
        console.log('📅 Fecha del contrato:', contractDate, 'Contrato:', contract);
        console.log('📅 Comparación:', {
            contractDate: contractDate.toISOString(),
            start: start.toISOString(),
            end: end.toISOString(),
            isAfterStart: contractDate >= start,
            isBeforeEnd: contractDate <= end,
            willInclude: contractDate >= start && contractDate <= end
        });
        return contractDate >= start && contractDate <= end;
    });
    
    console.log('📊 Contratos filtrados:', filteredContracts.length, filteredContracts);
    
    // Enriquecer contratos con información completa del plan si no la tienen
    const enrichedContracts = filteredContracts.map(contract => {
        if (!contract.planData) {
            let planData = null;
            
            // Intentar buscar por código del plan primero
            if (contract.planCode) {
                console.log('🔍 Enriqueciendo contrato con información del plan por código:', contract.planCode);
                planData = getPlanDataByCode(contract.planCode);
            }
            
            // Si no se encontró por código, intentar buscar por nombre del plan
            if (!planData && contract.plan) {
                console.log('🔍 Enriqueciendo contrato con información del plan por nombre:', contract.plan);
                planData = getPlanDataByName(contract.plan);
            }
            
            if (planData) {
                contract.planData = planData;
                console.log('✅ Información del plan agregada para contrato', contract.contractNumber, ':', planData);
                console.log('🔍 Campos del plan encontrado:', Object.keys(planData));
                console.log('🔢 Número de cuotas en el plan:', planData.numCuotas || planData.numeroCuotas || planData.cuotas || planData.totalCuotas || 'NO ENCONTRADO');
            } else {
                console.log('❌ No se pudo encontrar información del plan para:', contract.plan);
            }
        }
        return contract;
    });
    
    // Guardar datos filtrados en localStorage para la página de reporte
    const reportData = {
        startDate: startDate,
        endDate: endDate,
        total: enrichedContracts.length,
        contracts: enrichedContracts,
        generatedAt: new Date().toISOString()
    };
    
    console.log('💾 Guardando datos del reporte:', reportData);
    localStorage.setItem('reporteContratosData', JSON.stringify(reportData));
    console.log('✅ Datos guardados en localStorage');
    
    // Verificar que se guardaron correctamente
    const savedData = localStorage.getItem('reporteContratosData');
    console.log('🔍 Verificando datos guardados:', savedData);
    
    // Abrir reporte en nueva pestaña
    const reportUrl = `reporte-contratos.html`;
    window.open(reportUrl, '_blank');
    
    console.log('✅ Reporte abierto en nueva pestaña:', {
        fechaInicio: startDate,
        fechaFin: endDate,
        totalContratos: enrichedContracts.length,
        contratos: enrichedContracts
    });
}

// ========================================
// SISTEMA DE NOTIFICACIONES
// ========================================

function showNotification(message, type = 'info') {
    console.log(`📢 Notificación [${type}]: ${message}`);
    
    // Remover notificación anterior si existe
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
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
                // Validar rango de consecutivos
                const rangeValidation = validateContractNumber(contractNumber);
                if (!rangeValidation.valid) {
                    // Mostrar error visual en el campo
                    e.target.style.borderColor = '#ef4444';
                    e.target.style.backgroundColor = '#fef2f2';
                    showContractNumberError(rangeValidation.message);
                    return;
                }
                
                // Validar duplicados (solo si no estamos editando)
                if (!window.editingContractId) {
                    const duplicateValidation = validateContractDuplicate(contractNumber);
                    if (!duplicateValidation.valid) {
                        // Mostrar error visual en el campo
                        e.target.style.borderColor = '#ef4444';
                        e.target.style.backgroundColor = '#fef2f2';
                        showContractNumberError(duplicateValidation.message);
                        return;
                    }
                    // NO mostrar advertencias de contratos anulados - solo bloquear activos
                }
                
                // Limpiar errores si es válido
                e.target.style.borderColor = '';
                e.target.style.backgroundColor = '';
                hideContractNumberError();
            }
        });
        
        contractNumberInput.addEventListener('input', function(e) {
            // Limpiar errores mientras el usuario escribe
            e.target.style.borderColor = '';
            e.target.style.backgroundColor = '';
            hideContractNumberError();
        });
        
        // Validación en tiempo real mientras escribe (solo para duplicados activos)
        contractNumberInput.addEventListener('input', function(e) {
            const contractNumber = e.target.value.trim();
            
            // Solo validar duplicados si hay un número y no estamos editando
            if (contractNumber && !window.editingContractId) {
                const duplicateValidation = validateContractDuplicate(contractNumber);
                
                // Solo mostrar error si hay un contrato ACTIVO (no advertencias de anulados)
                if (!duplicateValidation.valid) {
                    e.target.style.borderColor = '#ef4444';
                    e.target.style.backgroundColor = '#fef2f2';
                    showContractNumberError(duplicateValidation.message);
                } else {
                    // Limpiar errores si no hay contrato activo
                    e.target.style.borderColor = '';
                    e.target.style.backgroundColor = '';
                    hideContractNumberError();
                }
            } else if (!contractNumber) {
                // Si no hay número, limpiar todo
                e.target.style.borderColor = '';
                e.target.style.backgroundColor = '';
                hideContractNumberError();
            }
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
    // 🔧 BACKEND INTEGRATION POINT - BÚSQUEDA DE TITULARES
    // TODO: Reemplazar localStorage con llamada a API
    // ENDPOINT SUGERIDO: GET /api/titulares?ciudad={selectedCity}&cedula={cedula}
    // EJEMPLO DE IMPLEMENTACIÓN:
    // try {
    //     const selectedCity = getSelectedCityCode();
    //     const response = await fetch(`/api/titulares?ciudad=${selectedCity}&cedula=${cedula}`);
    //     const data = await response.json();
    //     if (data.titular) {
    //         displayTitularInfo(data.titular);
    //     } else {
    //         clearTitularData();
    //     }
    //     return;
    // } catch (error) {
    //     console.error('Error buscando titular:', error);
    //     clearTitularData();
    //     return;
    // }
    
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
        // Construir nombre completo y convertir a mayúsculas
        const nombreCompleto = `${titular.nombre1 || ''} ${titular.nombre2 || ''} ${titular.apellido1 || ''} ${titular.apellido2 || ''}`.trim().toUpperCase();
        
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
    // 🔧 BACKEND INTEGRATION POINT - BÚSQUEDA DE EJECUTIVOS
    // TODO: Reemplazar localStorage con llamada a API
    // ENDPOINT SUGERIDO: GET /api/empleados?ciudad={selectedCity}&cedula={cedula}
    // EJEMPLO DE IMPLEMENTACIÓN:
    // try {
    //     const selectedCity = getSelectedCityCode();
    //     const response = await fetch(`/api/empleados?ciudad=${selectedCity}&cedula=${cedula}`);
    //     const data = await response.json();
    //     if (data.empleado) {
    //         displayEjecutivoInfo(data.empleado);
    //     } else {
    //         clearEjecutivoData();
    //     }
    //     return;
    // } catch (error) {
    //     console.error('Error buscando ejecutivo:', error);
    //     clearEjecutivoData();
    //     return;
    // }
    
    // Buscar en localStorage de empleados
    try {
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        const selectedCity = getSelectedCityCode();
        
        console.log('🔍 Buscando ejecutivo con cédula:', cedula, 'en ciudad:', selectedCity);
        console.log('📊 Datos completos de empleadosByCity:', empleadosByCity);
        console.log('🏙️ Ciudad seleccionada:', selectedCity);
        
        let ejecutivo = null;
        
        // Buscar SOLO en la ciudad seleccionada
        if (empleadosByCity && selectedCity) {
            const data = JSON.parse(empleadosByCity);
            console.log('📊 Datos de empleados por ciudad:', data);
            console.log('🏙️ Ciudades disponibles:', Object.keys(data));
            console.log('👥 Empleados en ciudad seleccionada:', Object.keys(data[selectedCity] || {}));
            
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
    const executiveIdInput = document.getElementById('executiveId');
    const executiveNameDisplay = document.getElementById('executiveNameDisplay');
    
    console.log('🎯 Mostrando información del ejecutivo:', ejecutivo);
    console.log('🔍 Elementos del DOM:', {
        executiveNameInput: !!executiveNameInput,
        executiveIdInput: !!executiveIdInput,
        executiveNameDisplay: !!executiveNameDisplay
    });
    
    if (executiveNameInput && executiveIdInput && executiveNameDisplay) {
        // Construir nombre completo usando los campos correctos de empleados y convertir a mayúsculas
        const nombreCompleto = [
            ejecutivo.tPrimerNombre || ejecutivo.primerNombre,
            ejecutivo.tSegundoNombre || ejecutivo.segundoNombre,
            ejecutivo.tPrimerApellido || ejecutivo.primerApellido,
            ejecutivo.tSegundoApellido || ejecutivo.segundoApellido
        ].filter(Boolean).join(' ').toUpperCase();
        
        console.log('📝 Nombre completo construido:', nombreCompleto);
        console.log('🆔 Identificación del ejecutivo:', ejecutivo.identificacion);
        
        // Llenar tanto el nombre como la identificación
        executiveNameInput.value = nombreCompleto;
        executiveIdInput.value = ejecutivo.identificacion || '';
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
    // NO limpiar executiveId para permitir escritura libre
}

// ========================================
// SELECCIÓN DE PLANES
// ========================================

function showPlanSelectionModal() {
    const modal = document.getElementById('planSelectionModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    // Asegurar que el modal de planes aparezca al frente del modal de edición
    modal.style.zIndex = '20000';
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
    
    // 🔧 BACKEND INTEGRATION POINT - CARGA DE PLANES
    // TODO: Reemplazar localStorage con llamada a API
    // ENDPOINT SUGERIDO: GET /api/planes
    // EJEMPLO DE IMPLEMENTACIÓN:
    // try {
    //     const response = await fetch('/api/planes');
    //     const data = await response.json();
    //     const planes = data.planes || [];
    //     plansGrid.innerHTML = '';
    //     planes.forEach(plan => {
    //         if (plan.activo !== false) {
    //             const planCard = createPlanCard(plan);
    //             plansGrid.appendChild(planCard);
    //         }
    //     });
    //     return;
    // } catch (error) {
    //     console.error('Error cargando planes:', error);
    //     plansGrid.innerHTML = '<p>Error al cargar los planes</p>';
    //     return;
    // }
    
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
    
    // Remover event listener anterior si existe para evitar duplicados
    if (searchInput.hasAttribute('data-search-initialized')) {
        return; // Ya está inicializado
    }
    
    // Agregar event listener para la búsqueda
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterPlans(searchTerm);
    });
    
    // Marcar como inicializado
    searchInput.setAttribute('data-search-initialized', 'true');
}

function filterPlans(searchTerm) {
    const plansGrid = document.getElementById('plansGrid');
    if (!plansGrid) return;
    
    const planCards = plansGrid.querySelectorAll('.plan-card');
    let visibleCount = 0;
    
    // Remover mensaje de "no resultados" si existe
    const noResultsMessage = plansGrid.querySelector('.no-results-message');
    if (noResultsMessage) {
        noResultsMessage.remove();
    }
    
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
    
    // Mostrar mensaje si no hay resultados (sin eliminar los elementos del DOM)
    if (visibleCount === 0 && searchTerm !== '') {
        const noResultsElement = document.createElement('div');
        noResultsElement.className = 'no-results-message';
        noResultsElement.style.cssText = `
            text-align: center;
            padding: 2rem;
            color: #6b7280;
            font-style: italic;
            grid-column: 1 / -1;
        `;
        noResultsElement.textContent = 'No se encontraron planes que coincidan con la búsqueda';
        plansGrid.appendChild(noResultsElement);
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
 * 
 * 🔧 BACKEND INTEGRATION POINT - CARGA DE EMPLEADOS
 * TODO: Reemplazar localStorage con llamada a API
 * ENDPOINT SUGERIDO: GET /api/empleados?ciudad={codigo}
 * EJEMPLO DE IMPLEMENTACIÓN:
 * try {
 *     const response = await fetch(`/api/empleados?ciudad=${city}`);
 *     const data = await response.json();
 *     if (data.empleados) {
 *         console.log(`Cargando ${data.empleados.length} empleados para ciudad ${city}`);
 *         return true;
 *     }
 *     return false;
 * } catch (error) {
 *     console.error('Error cargando empleados desde API:', error);
 *     return false;
 * }
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
 * 
 * 🔧 BACKEND INTEGRATION POINT - RANGO DE CONSECUTIVOS
 * TODO: Reemplazar localStorage con llamada a API
 * ENDPOINT SUGERIDO: GET /api/consecutivos?ciudad={cityCode}
 * EJEMPLO DE IMPLEMENTACIÓN:
 * try {
 *     const response = await fetch(`/api/consecutivos?ciudad=${cityCode}`);
 *     const data = await response.json();
 *     if (data.consecutivos && data.consecutivos.contratosInicial && data.consecutivos.contratosFinal) {
 *         return {
 *             inicial: parseInt(data.consecutivos.contratosInicial),
 *             final: parseInt(data.consecutivos.contratosFinal)
 *         };
 *     }
 *     return null;
 * } catch (error) {
 *     console.error('Error obteniendo consecutivos:', error);
 *     return null;
 * }
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
 * Valida si ya existe un contrato activo con el mismo número
 * Si el contrato está ANULADO, permite crear otro con el mismo número
 */
function validateContractDuplicate(contractNumber) {
    // Buscar si ya existe un contrato con el mismo número
    const existingContract = contractsData.find(contract => 
        contract.contractNumber === contractNumber
    );
    
    if (!existingContract) {
        return {
            valid: true,
            message: 'Número de contrato disponible'
        };
    }
    
    // Si existe y está ACTIVO, no permitir duplicado
    if (existingContract.estado === 'activo') {
        return {
            valid: false,
            message: `Ya existe un contrato ACTIVO con el número ${contractNumber}. No se puede crear otro contrato con el mismo número.`
        };
    }
    
    // Si existe pero está ANULADO, permitir crear otro
    if (existingContract.estado === 'anulado') {
        return {
            valid: true,
            message: `El contrato ${contractNumber} está ANULADO. Se puede crear un nuevo contrato con este número.`
        };
    }
    
    return {
        valid: true,
        message: 'Número de contrato disponible'
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
// FUNCIONES DE VERIFICACIÓN Y RESTAURACIÓN
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

// ========================================
// FUNCIONES GLOBALES EXPUESTAS
// ========================================

// Exponer funciones globalmente para debugging
window.verificarPersistenciaEmpleados = verificarPersistenciaEmpleados;
window.loadEmpleadosFromStorage = loadEmpleadosFromStorage;
window.getSelectedCityCode = getSelectedCityCode;
window.getContractConsecutiveRange = getContractConsecutiveRange;
window.validateContractNumber = validateContractNumber;
window.verificarDatosCiudades = verificarDatosCiudades;
window.restaurarDatosCiudadesBasicos = restaurarDatosCiudadesBasicos;
window.debugAllPlans = debugAllPlans;
window.getPlanDataByName = getPlanDataByName;
window.getPlanDataByCode = getPlanDataByCode;

