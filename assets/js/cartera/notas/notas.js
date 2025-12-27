/**
 * 📝 FUNCIONALIDAD NOTAS - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de notas.
 * Incluye gestión de modales y operaciones CRUD para notas.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let notesData = [];

function getSelectedCityCode() {
    try { return sessionStorage.getItem('selectedCity') || ''; } catch (e) { return ''; }
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando carga de interfaz de notas...');
        
        // Inicializar dropdown del usuario
        initializeUserDropdown();
        
        // Inicializar modales
        initializeModals();
        
        // Cargar ciudades
        loadCities();
        
        // Siempre mostrar modal de selección de ciudad al cargar
        initializeCitySelection();
        
        // Inicializar en tab de débito por defecto (después de un pequeño delay para asegurar que el DOM esté listo)
        setTimeout(() => {
            switchToTab('debito');
        }, 100);
        
        console.log('✅ Interfaz de notas cargada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar la interfaz:', error);
    }
});

// ========================================
// FUNCIONES DE INICIALIZACIÓN
// ========================================

function initializeUserDropdown() {
    const userInfo = document.querySelector('.user-info');
    const dropdown = document.getElementById('userDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const sidebar = document.querySelector('.sidebar');

    if (userInfo && dropdown) {
        userInfo.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            dropdown.classList.toggle('show');
            if (dropdownArrow) dropdownArrow.classList.toggle('open');
            if (sidebar) sidebar.classList.toggle('dropdown-open');
        });
        
        document.addEventListener('click', function(e) {
            if (!userInfo.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
                if (dropdownArrow) dropdownArrow.classList.remove('open');
                if (sidebar) sidebar.classList.remove('dropdown-open');
            }
        });
        
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                if (this.classList.contains('logout-item')) {
                    showConfirmLogoutModal();
                } else if (this.classList.contains('admin-users-item')) {
                    alert('Funcionalidad de administrar usuarios en desarrollo');
                }
                dropdown.classList.remove('show');
                if (dropdownArrow) dropdownArrow.classList.remove('open');
                if (sidebar) sidebar.classList.remove('dropdown-open');
            });
        });
    }
}

function initializeModals() {
    // Cerrar modal al hacer clic fuera (solo si hay ciudad seleccionada)
    const cityModalOverlay = document.getElementById('selectCityModal');
    if (cityModalOverlay) {
        cityModalOverlay.addEventListener('click', function(e) {
            if (e.target === cityModalOverlay) {
                // Solo permitir cerrar si ya hay una ciudad seleccionada
                const selectedCity = getSelectedCityCode();
                if (selectedCity) {
                    hideSelectCityModal();
                }
                // Si no hay ciudad seleccionada, no permitir cerrar
            }
        });
    }
    
    // Botón seleccionar ciudad
    const bSeleccionarCiudad = document.getElementById('bSeleccionarCiudad');
    if (bSeleccionarCiudad) {
        bSeleccionarCiudad.addEventListener('click', function() {
            const citySelect = document.getElementById('citySelect');
            if (citySelect && citySelect.value) {
                const cityCode = citySelect.value;
                sessionStorage.setItem('selectedCity', cityCode);
                
                // Obtener nombre de la ciudad usando la función auxiliar
                const cityName = getCityNameByCode(cityCode);
                if (cityName) {
                    sessionStorage.setItem('selectedCityName', cityName);
                }
                
                hideSelectCityModal();
                updateCityDisplay();
                loadNotes(); // Esto cargará según el tab activo
                
                // Mostrar notificación de ciudad seleccionada
                const fullCityName = cityName ? `${cityCode} - ${cityName}` : cityCode;
                showNotification(`Ciudad seleccionada: ${fullCityName}`, 'success');
            } else {
                if (window.showNotification) {
                    showNotification('Por favor seleccione una ciudad', 'warning');
                } else {
                    alert('Por favor seleccione una ciudad');
                }
            }
        });
    }
    
    // Botón buscar nota débito
    const bBuscarNotaDebito = document.getElementById('bBuscarNotaDebito');
    if (bBuscarNotaDebito) {
        bBuscarNotaDebito.addEventListener('click', function() {
            searchNotaDebito();
        });
    }
    
    // Botón buscar nota crédito
    const bBuscarNotaCredito = document.getElementById('bBuscarNotaCredito');
    if (bBuscarNotaCredito) {
        bBuscarNotaCredito.addEventListener('click', function() {
            searchNotaCredito();
        });
    }
    
    // Botón crear nota débito
    const bCrearNotaDebito = document.getElementById('bCrearNotaDebito');
    if (bCrearNotaDebito) {
        bCrearNotaDebito.addEventListener('click', function() {
            validateAndCreateNotaDebito();
        });
    }
    
    // Botón crear nota crédito
    const bCrearNotaCredito = document.getElementById('bCrearNotaCredito');
    if (bCrearNotaCredito) {
        bCrearNotaCredito.addEventListener('click', function() {
            validateAndCreateNotaCredito();
        });
    }
    
    // Event listeners para búsqueda de titular en Nota Débito
    const debitoHolderId = document.getElementById('debitoHolderId');
    if (debitoHolderId) {
        debitoHolderId.addEventListener('blur', function() {
            if (this.value) {
                searchTitularAndLoadData(this.value, 'debito');
            }
        });
    }
    
    // Event listeners para búsqueda de titular en Nota Crédito
    const creditoHolderId = document.getElementById('creditoHolderId');
    if (creditoHolderId) {
        creditoHolderId.addEventListener('blur', function() {
            if (this.value) {
                searchTitularAndLoadData(this.value, 'credito');
            }
        });
    }
    
    // Event listener para cambio de contrato en Nota Débito
    const debitoContrato = document.getElementById('debitoContrato');
    if (debitoContrato) {
        debitoContrato.addEventListener('change', function() {
            if (this.value) {
                const selectedOption = this.options[this.selectedIndex];
                const contratoData = selectedOption.dataset.contrato;
                
                // Cargar factura
                loadFacturaFromContrato(this.value, 'debito');
                
                // Cargar ejecutivo si tenemos datos del contrato
                if (contratoData) {
                    try {
                        const contrato = JSON.parse(contratoData);
                        loadEjecutivoFromContrato(contrato, 'debito');
                    } catch (e) {
                        console.error('Error parseando datos del contrato:', e);
                    }
                }
            } else {
                // Limpiar campos si no hay contrato seleccionado
                const facturaInput = document.getElementById('debitoFactura');
                const ejecutivoInput = document.getElementById('debitoEjecutivo');
                if (facturaInput) facturaInput.value = '';
                if (ejecutivoInput) ejecutivoInput.value = '';
            }
        });
    }
    
    // Event listener para cambio de contrato en Nota Crédito
    const creditoContrato = document.getElementById('creditoContrato');
    if (creditoContrato) {
        creditoContrato.addEventListener('change', function() {
            if (this.value) {
                const selectedOption = this.options[this.selectedIndex];
                const contratoData = selectedOption.dataset.contrato;
                
                // Cargar factura
                loadFacturaFromContrato(this.value, 'credito');
                
                // Cargar ejecutivo si tenemos datos del contrato
                if (contratoData) {
                    try {
                        const contrato = JSON.parse(contratoData);
                        loadEjecutivoFromContrato(contrato, 'credito');
                    } catch (e) {
                        console.error('Error parseando datos del contrato:', e);
                    }
                }
            } else {
                // Limpiar campos si no hay contrato seleccionado
                const facturaInput = document.getElementById('creditoFactura');
                const ejecutivoInput = document.getElementById('creditoEjecutivo');
                if (facturaInput) facturaInput.value = '';
                if (ejecutivoInput) ejecutivoInput.value = '';
            }
        });
    }
    
    // Botón generar reporte nota débito
    const bGenerarReporteDebito = document.getElementById('bGenerarReporteDebito');
    if (bGenerarReporteDebito) {
        bGenerarReporteDebito.addEventListener('click', function() {
            generateReportNotaDebito();
        });
    }
    
    // Botón generar reporte nota crédito
    const bGenerarReporteCredito = document.getElementById('bGenerarReporteCredito');
    if (bGenerarReporteCredito) {
        bGenerarReporteCredito.addEventListener('click', function() {
            generateReportNotaCredito();
        });
    }
    
    // Inicializar formateo de campos numéricos con separación de miles
    initializeNumericFormatting();
    
    // Auto-completar nombre del titular
    const holderIdInput = document.getElementById('holderId');
    if (holderIdInput) {
        holderIdInput.addEventListener('blur', function() {
            if (this.value) {
                // TODO: Llamar al backend para obtener nombre del titular
                // Por ahora, placeholder
                const holderNameInput = document.getElementById('holderName');
                if (holderNameInput) {
                    holderNameInput.value = 'Nombre del Titular'; // Placeholder
                }
            }
        });
    }
}

// ========================================
// FUNCIONES DE CIUDAD
// ========================================

function initializeCitySelection() {
    // Siempre resetear la selección de ciudad al cargar la página
    try { 
        sessionStorage.removeItem('selectedCity');
        sessionStorage.removeItem('selectedCityName');
    } catch (e) {}
    
    // Limpiar tabla hasta que se seleccione una ciudad
    notesData = [];
    loadNotes();
    
    // Mostrar modal inmediatamente
    console.log('⏰ Mostrando modal de selección de ciudad...');
    showSelectCityModal();
}

function loadCities() {
    // ========================================
    // CARGAR CIUDADES DESDE LOCALSTORAGE
    // ========================================
    // TODO: CONEXIÓN BACKEND - Reemplazar esta función para obtener ciudades desde el servidor
    // Endpoint sugerido: GET /api/ciudades
    // Respuesta esperada: { [codigo]: { codigo: string, nombre: string, activo: boolean } }
    // ========================================
    
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) return;

    let ciudades = {};
    try {
        // Intentar obtener ciudades desde función global (si existe)
        if (typeof window.getCiudadesData === 'function') {
            ciudades = window.getCiudadesData() || {};
        } else {
            // Obtener desde localStorage
            const raw = localStorage.getItem('ciudadesData');
            const data = raw ? JSON.parse(raw) : {};
            ciudades = Object.fromEntries(
                Object.entries(data).filter(([k, v]) => v && typeof v === 'object' && v.codigo && v.nombre)
            );
        }
    } catch (e) {
        console.error('Error al cargar ciudades:', e);
        ciudades = {};
    }

    // Limpiar opciones existentes
    citySelect.innerHTML = '<option value="">Seleccione la ciudad</option>';

    // Agregar ciudades activas, ordenadas por código
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

function getCityNameByCode(cityCode) {
    // ========================================
    // OBTENER NOMBRE DE CIUDAD POR CÓDIGO
    // ========================================
    // TODO: CONEXIÓN BACKEND - Reemplazar para obtener desde el servidor
    // Endpoint sugerido: GET /api/ciudades/{codigo}
    // ========================================
    
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

function updateCityDisplay() {
    const cityCode = getSelectedCityCode();
    const cityName = getCityNameByCode(cityCode);
    const cityDisplay = cityName ? `${cityCode} - ${cityName}`.toUpperCase() : (cityCode || 'Seleccione una ciudad');
    
    // Actualizar display en sección débito
    const currentCityNameDebito = document.getElementById('currentCityNameDebito');
    if (currentCityNameDebito) {
        currentCityNameDebito.textContent = cityCode ? cityDisplay : 'Seleccione una ciudad';
    }
    
    // Actualizar display en sección crédito
    const currentCityNameCredito = document.getElementById('currentCityNameCredito');
    if (currentCityNameCredito) {
        currentCityNameCredito.textContent = cityCode ? cityDisplay : 'Seleccione una ciudad';
    }
}

// ========================================
// FUNCIONES DE MODALES
// ========================================

function showSelectCityModal() {
    const modal = document.getElementById('selectCityModal');
    if (modal) {
        // Cargar ciudades antes de mostrar el modal
        loadCities();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Enfocar el select después de un breve delay
        setTimeout(() => {
            const citySelect = document.getElementById('citySelect');
            if (citySelect) citySelect.focus();
        }, 100);
    }
}

function hideSelectCityModal() {
    // Solo permitir cerrar si hay una ciudad seleccionada
    const selectedCity = getSelectedCityCode();
    if (!selectedCity) {
        return; // No cerrar si no hay ciudad seleccionada
    }
    
    const modal = document.getElementById('selectCityModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showSearchNotaDebitoModal() {
    const modal = document.getElementById('searchNotaDebitoModal');
    if (modal) {
        // Limpiar formulario
        const form = modal.querySelector('form');
        if (form) form.reset();
        modal.style.display = 'flex';
    }
}

function hideSearchNotaDebitoModal() {
    const modal = document.getElementById('searchNotaDebitoModal');
    if (modal) modal.style.display = 'none';
}

function showSearchNotaCreditoModal() {
    const modal = document.getElementById('searchNotaCreditoModal');
    if (modal) {
        // Limpiar formulario
        const form = modal.querySelector('form');
        if (form) form.reset();
        modal.style.display = 'flex';
    }
}

function hideSearchNotaCreditoModal() {
    const modal = document.getElementById('searchNotaCreditoModal');
    if (modal) modal.style.display = 'none';
}

function showSearchResultsDebitoModal(resultados) {
    const modal = document.getElementById('searchResultsDebitoModal');
    const tableBody = document.getElementById('searchResultsDebitoTableBody');
    
    if (!modal || !tableBody) return;
    
    const city = getSelectedCityCode();
    
    if (resultados.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron resultados</p>
                        <small>Intente con otro criterio de búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = '';
        resultados.forEach(note => {
            const row = document.createElement('tr');
            const valor = note.valorNota || 0;
            const fecha = note.fechaHoy || note.fecha || '';
            
            const estado = (note.estado || 'activa').toLowerCase();
            const estadoDisplay = estado === 'activo' || estado === 'activa' ? 'ACTIVO' : 'ANULADO';
            const isActivo = estado === 'activo' || estado === 'activa';
            
            row.innerHTML = `
                <td>${note.numero || ''}</td>
                <td>${formatDateForTable(fecha)}</td>
                <td>${note.holderId || ''}</td>
                <td>${getTitularNombre(note.holderId, city)}</td>
                <td>${formatCurrency(valor)}</td>
                <td>${note.concepto || ''}</td>
                <td>
                    <div class="status-badge ${isActivo ? 'status-active' : 'status-inactive'}">
                        ${estadoDisplay}
                    </div>
                </td>
                <td class="table-actions">
                    <div class="action-buttons-container">
                        <button type="button" class="btn-icon btn-edit" title="Editar" onclick="editNote('${note.id}', 'DEBITO'); hideSearchResultsDebitoModal();">
                            <i class="fas fa-edit"></i>
                        </button>
                        <div class="status-toggle-container">
                            <label class="status-toggle">
                                <input type="checkbox" ${isActivo ? 'checked' : ''} 
                                       onchange="toggleNoteStatus('${note.id}', 'DEBITO', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    modal.style.display = 'flex';
}

function hideSearchResultsDebitoModal() {
    const modal = document.getElementById('searchResultsDebitoModal');
    if (modal) modal.style.display = 'none';
}

function showSearchResultsCreditoModal(resultados) {
    const modal = document.getElementById('searchResultsCreditoModal');
    const tableBody = document.getElementById('searchResultsCreditoTableBody');
    
    if (!modal || !tableBody) return;
    
    const city = getSelectedCityCode();
    
    if (resultados.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron resultados</p>
                        <small>Intente con otro criterio de búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = '';
        resultados.forEach(note => {
            const row = document.createElement('tr');
            const valor = note.valor || 0;
            const fecha = note.fechaHoy || note.fecha || '';
            const numero = note.numero || '';
            
            console.log('🔍 Mostrando resultado de búsqueda nota crédito:', { id: note.id, numero: numero, note: note });
            
            const estado = (note.estado || 'activa').toLowerCase();
            const estadoDisplay = estado === 'activo' || estado === 'activa' ? 'ACTIVO' : 'ANULADO';
            const isActivo = estado === 'activo' || estado === 'activa';
            
            row.innerHTML = `
                <td>${numero}</td>
                <td>${formatDateForTable(fecha)}</td>
                <td>${note.holderId || ''}</td>
                <td>${getTitularNombre(note.holderId, city)}</td>
                <td>${formatCurrency(valor)}</td>
                <td>${note.concepto || ''}</td>
                <td>
                    <div class="status-badge ${isActivo ? 'status-active' : 'status-inactive'}">
                        ${estadoDisplay}
                    </div>
                </td>
                <td class="table-actions">
                    <div class="action-buttons-container">
                        <button type="button" class="btn-icon btn-edit" title="Editar" onclick="editNote('${note.id}', 'CREDITO'); hideSearchResultsCreditoModal();">
                            <i class="fas fa-edit"></i>
                        </button>
                        <div class="status-toggle-container">
                            <label class="status-toggle">
                                <input type="checkbox" ${isActivo ? 'checked' : ''} 
                                       onchange="toggleNoteStatus('${note.id}', 'CREDITO', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    modal.style.display = 'flex';
}

function hideSearchResultsCreditoModal() {
    const modal = document.getElementById('searchResultsCreditoModal');
    if (modal) modal.style.display = 'none';
}

// ========================================
// FUNCIONES DE NOTA DÉBITO
// ========================================

function showCreateNotaDebitoModal() {
    const modal = document.getElementById('createNotaDebitoModal');
    if (!modal) return;
    
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    // Si no estamos editando, resetear estado y formulario
    if (!window.editingNotaId) {
        // Limpiar estado de edición
        window.editingNotaId = null;
        window.editingNotaTipo = null;
        
        // Limpiar formulario
        const form = document.getElementById('createNotaDebitoForm');
        if (form) form.reset();
        
        // Restaurar título y botón del modal
        const modalTitle = document.querySelector('#createNotaDebitoModal .modal-title');
        const createButton = document.getElementById('bCrearNotaDebito');
        
        if (modalTitle) modalTitle.textContent = 'NOTA DÉBITO DE CARTERA:';
        if (createButton) {
            createButton.textContent = 'Crear';
            createButton.onclick = function() {
                validateAndCreateNotaDebito();
            };
        }
        
        // Ocultar display de nombre del titular
        const holderNameDisplay = document.getElementById('debitoHolderNameDisplay');
        if (holderNameDisplay) holderNameDisplay.style.display = 'none';
        
        // Ocultar select de contrato y mostrar input
        const contratoContainer = document.getElementById('debitoContratoContainer');
        const contratoInput = document.getElementById('debitoContratoInput');
        if (contratoContainer) contratoContainer.style.display = 'none';
        if (contratoInput) contratoInput.style.display = 'block';
        
        // Establecer fecha actual
        const fechaHoy = document.getElementById('debitoFechaHoy');
        if (fechaHoy) {
            const today = new Date().toISOString().split('T')[0];
            fechaHoy.value = today;
        }
        
        // Cargar número automático desde consecutivos
        loadNextNotaDebitoNumber(city);
    }
    
    // Inicializar formateo de campos numéricos
    setTimeout(() => {
        initializeNumericFormatting();
    }, 100);
    
    modal.style.display = 'flex';
}

function hideCreateNotaDebitoModal() {
    const modal = document.getElementById('createNotaDebitoModal');
    if (modal) modal.style.display = 'none';
}

// ========================================
// FUNCIONES DE NOTA CRÉDITO
// ========================================

function showCreateNotaCreditoModal() {
    const modal = document.getElementById('createNotaCreditoModal');
    if (!modal) return;
    
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    // Si no estamos editando, resetear estado y formulario
    if (!window.editingNotaId) {
        // Limpiar estado de edición
        window.editingNotaId = null;
        window.editingNotaTipo = null;
        
        // Limpiar formulario
        const form = document.getElementById('createNotaCreditoForm');
        if (form) form.reset();
        
        // Restaurar título y botón del modal
        const modalTitle = document.querySelector('#createNotaCreditoModal .modal-title');
        const createButton = document.getElementById('bCrearNotaCredito');
        
        if (modalTitle) modalTitle.textContent = 'NOTAS CRÉDITO DE CARTERA:';
        if (createButton) {
            createButton.textContent = 'Crear';
            createButton.onclick = function() {
                validateAndCreateNotaCredito();
            };
        }
        
        // Ocultar display de nombre del titular
        const holderNameDisplay = document.getElementById('creditoHolderNameDisplay');
        if (holderNameDisplay) holderNameDisplay.style.display = 'none';
        
        // Ocultar select de contrato y mostrar input
        const contratoContainer = document.getElementById('creditoContratoContainer');
        const contratoInput = document.getElementById('creditoContratoInput');
        if (contratoContainer) contratoContainer.style.display = 'none';
        if (contratoInput) contratoInput.style.display = 'block';
        
        // Establecer fecha actual
        const fechaHoy = document.getElementById('creditoFechaHoy');
        if (fechaHoy) {
            const today = new Date().toISOString().split('T')[0];
            fechaHoy.value = today;
        }
        
        // Cargar número automático desde consecutivos (después del reset)
        setTimeout(() => {
            loadNextNotaCreditoNumber(city);
        }, 50);
    }
    
    // Inicializar formateo de campos numéricos
    setTimeout(() => {
        initializeNumericFormatting();
    }, 100);
    
    modal.style.display = 'flex';
}

function hideCreateNotaCreditoModal() {
    const modal = document.getElementById('createNotaCreditoModal');
    if (modal) modal.style.display = 'none';
}

function showReportNotaDebitoModal() {
    const modal = document.getElementById('reportNotaDebitoModal');
    if (modal) {
        // Limpiar formulario
        const form = document.getElementById('reportNotaDebitoForm');
        if (form) form.reset();
        modal.style.display = 'flex';
    }
}

function hideReportNotaDebitoModal() {
    const modal = document.getElementById('reportNotaDebitoModal');
    if (modal) modal.style.display = 'none';
}

function showReportNotaCreditoModal() {
    const modal = document.getElementById('reportNotaCreditoModal');
    if (modal) {
        // Limpiar formulario
        const form = document.getElementById('reportNotaCreditoForm');
        if (form) form.reset();
        modal.style.display = 'flex';
    }
}

function hideReportNotaCreditoModal() {
    const modal = document.getElementById('reportNotaCreditoModal');
    if (modal) modal.style.display = 'none';
}

// ========================================
// FUNCIONES DE TABS
// ========================================

function switchToTab(tabType) {
    // Actualizar estado de los tabs
    const tabItems = document.querySelectorAll('.internal-tab-item');
    tabItems.forEach(item => {
        if (item.dataset.tab === tabType) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Mostrar/ocultar secciones
    const debitoSection = document.getElementById('notaDebitoSection');
    const creditoSection = document.getElementById('notaCreditoSection');
    
    if (tabType === 'debito') {
        if (debitoSection) debitoSection.style.display = 'block';
        if (creditoSection) creditoSection.style.display = 'none';
        loadNotasDebito();
    } else if (tabType === 'credito') {
        if (debitoSection) debitoSection.style.display = 'none';
        if (creditoSection) creditoSection.style.display = 'block';
        loadNotasCredito();
    }
}

// ========================================
// FUNCIONES DE OPERACIONES
// ========================================

function loadNotes() {
    // Cargar según el tab activo
    const activeTab = document.querySelector('.internal-tab-item.active');
    if (activeTab) {
        const tabType = activeTab.dataset.tab;
        if (tabType === 'credito') {
            loadNotasCredito();
        } else {
            loadNotasDebito();
        }
    } else {
        // Por defecto cargar débito
        loadNotasDebito();
    }
}

function loadNotasDebito() {
    const city = getSelectedCityCode();
    const tableBody = document.getElementById('notaDebitoTableBody');
    if (!tableBody) return;
    
    if (!city) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-sticky-note"></i>
                        <p>Seleccione una ciudad para ver las notas débito</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    try {
        // Cargar notas débito
        const notasDebitoRaw = localStorage.getItem(`notasDebito_${city}`);
        const notasDebito = notasDebitoRaw ? JSON.parse(notasDebitoRaw) : [];
        
        if (notasDebito.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-sticky-note"></i>
                            <p>No existen registros de notas débito</p>
                            <small>Haz clic en "Crear Nota Débito" para crear el primer registro</small>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Ordenar por fecha (más recientes primero)
        notasDebito.sort((a, b) => {
            const fechaA = new Date(a.fechaHoy || a.fecha || '');
            const fechaB = new Date(b.fechaHoy || b.fecha || '');
            return fechaB - fechaA;
        });
        
        tableBody.innerHTML = '';
        notasDebito.forEach(note => {
            const row = document.createElement('tr');
            const valor = note.valorNota || 0;
            const fecha = note.fechaHoy || note.fecha || '';
            
            const estado = (note.estado || 'activa').toLowerCase();
            const estadoDisplay = estado === 'activo' || estado === 'activa' ? 'ACTIVO' : 'ANULADO';
            const isActivo = estado === 'activo' || estado === 'activa';
            
            row.innerHTML = `
                <td>${note.numero || ''}</td>
                <td>${formatDateForTable(fecha)}</td>
                <td>${note.holderId || ''}</td>
                <td>${getTitularNombre(note.holderId, city)}</td>
                <td>${formatCurrency(valor)}</td>
                <td>${note.concepto || ''}</td>
                <td>
                    <div class="status-badge ${isActivo ? 'status-active' : 'status-inactive'}">
                        ${estadoDisplay}
                    </div>
                </td>
                <td class="table-actions">
                    <div class="action-buttons-container">
                        <button type="button" class="btn-icon btn-edit" title="Editar" onclick="editNote('${note.id}', 'DEBITO')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <div class="status-toggle-container">
                            <label class="status-toggle">
                                <input type="checkbox" ${isActivo ? 'checked' : ''} 
                                       onchange="toggleNoteStatus('${note.id}', 'DEBITO', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
    } catch (e) {
        console.error('Error cargando notas débito:', e);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error al cargar las notas débito</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function loadNotasCredito() {
    const city = getSelectedCityCode();
    const tableBody = document.getElementById('notaCreditoTableBody');
    if (!tableBody) return;
    
    if (!city) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-sticky-note"></i>
                        <p>Seleccione una ciudad para ver las notas crédito</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    try {
        // Cargar notas crédito
        const notasCreditoRaw = localStorage.getItem(`notasCredito_${city}`);
        let notasCredito = notasCreditoRaw ? JSON.parse(notasCreditoRaw) : [];
        
        // Migrar notas que no tengan número asignado (solo una vez al cargar)
        let notasActualizadas = false;
        const control = getControlConsecutivosForCity(city);
        const start = control ? parseInt(control.creditoCarteraInicial || control.creditoCartera || '1', 10) : 1;
        
        // Primero, encontrar el máximo número usado entre las notas que ya tienen número
        const maxUsed = notasCredito
            .filter(n => n.numero && n.numero !== '')
            .map(n => parseInt(String(n.numero).replace(/\D/g, ''), 10) || 0)
            .reduce((a, b) => Math.max(a, b), start - 1);
        
        let siguienteNumero = maxUsed + 1;
        
        // Asignar números a las notas que no los tienen
        notasCredito = notasCredito.map(nota => {
            if (!nota.numero || nota.numero === '') {
                notasActualizadas = true;
                nota.numero = String(siguienteNumero);
                console.log('🔄 Asignando número a nota crédito sin número al cargar:', { id: nota.id, numero: siguienteNumero });
                siguienteNumero++;
            }
            return nota;
        });
        
        // Guardar notas actualizadas si hubo cambios
        if (notasActualizadas) {
            localStorage.setItem(`notasCredito_${city}`, JSON.stringify(notasCredito));
            console.log('✅ Notas crédito actualizadas con números asignados al cargar');
        }
        
        if (notasCredito.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-sticky-note"></i>
                            <p>No existen registros de notas crédito</p>
                            <small>Haz clic en "Crear Nota Crédito" para crear el primer registro</small>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Ordenar por fecha (más recientes primero)
        notasCredito.sort((a, b) => {
            const fechaA = new Date(a.fechaHoy || a.fecha || '');
            const fechaB = new Date(b.fechaHoy || b.fecha || '');
            return fechaB - fechaA;
        });
        
        tableBody.innerHTML = '';
        notasCredito.forEach(note => {
            const row = document.createElement('tr');
            const valor = note.valor || 0;
            const fecha = note.fechaHoy || note.fecha || '';
            const numero = note.numero || '';
            
            console.log('📝 Cargando nota crédito:', { id: note.id, numero: numero, valor: valor });
            
            const estado = (note.estado || 'activa').toLowerCase();
            const estadoDisplay = estado === 'activo' || estado === 'activa' ? 'ACTIVO' : 'ANULADO';
            const isActivo = estado === 'activo' || estado === 'activa';
            
            row.innerHTML = `
                <td>${numero}</td>
                <td>${formatDateForTable(fecha)}</td>
                <td>${note.holderId || ''}</td>
                <td>${getTitularNombre(note.holderId, city)}</td>
                <td>${formatCurrency(valor)}</td>
                <td>${note.concepto || ''}</td>
                <td>
                    <div class="status-badge ${isActivo ? 'status-active' : 'status-inactive'}">
                        ${estadoDisplay}
                    </div>
                </td>
                <td class="table-actions">
                    <div class="action-buttons-container">
                        <button type="button" class="btn-icon btn-edit" title="Editar" onclick="editNote('${note.id}', 'CREDITO')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <div class="status-toggle-container">
                            <label class="status-toggle">
                                <input type="checkbox" ${isActivo ? 'checked' : ''} 
                                       onchange="toggleNoteStatus('${note.id}', 'CREDITO', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
    } catch (e) {
        console.error('Error cargando notas crédito:', e);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error al cargar las notas crédito</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function formatDateForTable(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO', {day: '2-digit', month: '2-digit', year: 'numeric'});
    } catch (e) {
        return dateStr;
    }
}

function formatCurrency(value) {
    if (value == null || isNaN(value)) return '0.00';
    return new Intl.NumberFormat('es-CO', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(value));
}

function getTitularNombre(holderId, city) {
    if (!holderId || !city) return '';
    try {
        const titularesByCityRaw = localStorage.getItem('titularesByCity');
        if (!titularesByCityRaw) return '';
        
        const titularesByCity = JSON.parse(titularesByCityRaw);
        const titular = titularesByCity[city] && titularesByCity[city][holderId];
        
        if (titular) {
            return `${titular.apellido1 || ''} ${titular.apellido2 || ''} ${titular.nombre1 || ''} ${titular.nombre2 || ''}`.trim().toUpperCase();
        }
        
        return '';
    } catch (e) {
        return '';
    }
}

function viewNote(noteId, tipo) {
    // TODO: Implementar vista de nota
    alert('Funcionalidad de ver nota en desarrollo');
}

function editNote(noteId, tipo) {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad', 'warning');
        return;
    }
    
    try {
        let nota = null;
        
        // Buscar la nota según el tipo
        if (tipo === 'DEBITO') {
            const notasRaw = localStorage.getItem(`notasDebito_${city}`);
            const notas = notasRaw ? JSON.parse(notasRaw) : [];
            nota = notas.find(n => String(n.id) === String(noteId));
            
            if (nota) {
                // Guardar el ID de la nota que se está editando
                window.editingNotaId = noteId;
                window.editingNotaTipo = 'debito';
                
                // Cargar datos en el formulario de débito
                loadNotaDataIntoForm(nota, 'debito');
                
                // Cambiar título y botón del modal
                const modalTitle = document.querySelector('#createNotaDebitoModal .modal-title');
                const createButton = document.getElementById('bCrearNotaDebito');
                
                if (modalTitle) modalTitle.textContent = 'EDITAR NOTA DÉBITO DE CARTERA:';
                if (createButton) {
                    createButton.textContent = 'Actualizar';
                    createButton.onclick = function() {
                        validateAndUpdateNotaDebito();
                    };
                }
                
                // Mostrar modal (sin resetear porque ya cargamos los datos)
                const modal = document.getElementById('createNotaDebitoModal');
                if (modal) {
                    // Inicializar formateo de campos numéricos
                    setTimeout(() => {
                        initializeNumericFormatting();
                    }, 100);
                    modal.style.display = 'flex';
                }
            }
        } else if (tipo === 'CREDITO') {
            const notasRaw = localStorage.getItem(`notasCredito_${city}`);
            const notas = notasRaw ? JSON.parse(notasRaw) : [];
            nota = notas.find(n => String(n.id) === String(noteId));
            
            if (nota) {
                // Guardar el ID de la nota que se está editando
                window.editingNotaId = noteId;
                window.editingNotaTipo = 'credito';
                
                // Cargar datos en el formulario de crédito
                loadNotaDataIntoForm(nota, 'credito');
                
                // Cambiar título y botón del modal
                const modalTitle = document.querySelector('#createNotaCreditoModal .modal-title');
                const createButton = document.getElementById('bCrearNotaCredito');
                
                if (modalTitle) modalTitle.textContent = 'EDITAR NOTA CRÉDITO DE CARTERA:';
                if (createButton) {
                    createButton.textContent = 'Actualizar';
                    createButton.onclick = function() {
                        validateAndUpdateNotaCredito();
                    };
                }
                
                // Mostrar modal (sin resetear porque ya cargamos los datos)
                const modal = document.getElementById('createNotaCreditoModal');
                if (modal) {
                    // Inicializar formateo de campos numéricos
                    setTimeout(() => {
                        initializeNumericFormatting();
                    }, 100);
                    modal.style.display = 'flex';
                }
            }
        }
        
        if (!nota) {
            showNotification('No se encontró la nota a editar', 'error');
        }
    } catch (e) {
        console.error('Error editando nota:', e);
        showNotification('Error al cargar la nota para editar', 'error');
    }
}

/**
 * Carga los datos de una nota en el formulario correspondiente
 */
function loadNotaDataIntoForm(nota, tipo) {
    // Cargar datos básicos
    document.getElementById(`${tipo}Number`).value = nota.numero || '';
    document.getElementById(`${tipo}FechaHoy`).value = nota.fechaHoy || '';
    document.getElementById(`${tipo}Factura`).value = nota.factura || '';
    document.getElementById(`${tipo}HolderId`).value = nota.holderId || '';
    document.getElementById(`${tipo}Ejecutivo`).value = nota.ejecutivo || '';
    document.getElementById(`${tipo}FechaVencimiento`).value = nota.fechaVencimiento || '';
    document.getElementById(`${tipo}Concepto`).value = nota.concepto || '';
    
    // Cargar valor con formato
    const valor = nota.valorNota || nota.valor || 0;
    const valorInput = document.getElementById(`${tipo}ValorNota`) || document.getElementById(`${tipo}Valor`);
    if (valorInput) {
        valorInput.value = formatCurrencyInput(valor);
    }
    
    // Cargar contabilización
    document.getElementById(`${tipo}CuentaDebito`).value = nota.cuentaDebito || '';
    document.getElementById(`${tipo}CuentaCredito`).value = nota.cuentaCredito || '';
    
    // Cargar contrato
    const contratoInput = document.getElementById(`${tipo}ContratoInput`);
    const contratoSelect = document.getElementById(`${tipo}Contrato`);
    const contratoContainer = document.getElementById(`${tipo}ContratoContainer`);
    
    if (nota.contrato) {
        if (contratoInput) {
            contratoInput.value = nota.contrato;
            contratoInput.style.display = 'block';
        }
        if (contratoContainer) {
            contratoContainer.style.display = 'none';
        }
    }
    
    // Mostrar nombre del titular si existe
    const city = getSelectedCityCode();
    if (nota.holderId && city) {
        const titularNombre = getTitularNombre(nota.holderId, city);
        const holderNameDisplay = document.getElementById(`${tipo}HolderNameDisplay`);
        if (holderNameDisplay && titularNombre) {
            holderNameDisplay.textContent = titularNombre;
            holderNameDisplay.style.display = 'block';
        }
    }
    
    // Inicializar formateo de campos numéricos
    setTimeout(() => {
        initializeNumericFormatting();
    }, 100);
}

function searchNotaDebito() {
    const form = document.getElementById('searchNotaDebitoForm');
    if (form && form.checkValidity()) {
        const searchType = document.getElementById('debitoNoteSearchType').value;
        const searchValue = document.getElementById('searchNotaDebitoValue').value.trim();
        
        if (!searchValue) {
            showNotification('Por favor ingrese un valor de búsqueda', 'warning');
            return;
        }
        
        try {
            const city = getSelectedCityCode();
            if (!city) {
                showNotification('Debe seleccionar una ciudad', 'warning');
                return;
            }
            
            // Obtener todas las notas débito de la ciudad
            const notasRaw = localStorage.getItem(`notasDebito_${city}`);
            const notas = notasRaw ? JSON.parse(notasRaw) : [];
            
            // Filtrar según el tipo de búsqueda
            let resultados = [];
            
            if (searchType === 'noteNumber') {
                // Búsqueda por número de nota
                resultados = notas.filter(nota => {
                    const numero = String(nota.numero || '').toLowerCase();
                    return numero.includes(searchValue.toLowerCase());
                });
            } else if (searchType === 'holderId') {
                // Búsqueda por identificación del titular
                resultados = notas.filter(nota => {
                    const holderId = String(nota.holderId || '').toLowerCase();
                    return holderId.includes(searchValue.toLowerCase());
                });
            } else if (searchType === 'holderName') {
                // Búsqueda por nombre del titular
                resultados = notas.filter(nota => {
                    const titularNombre = getTitularNombre(nota.holderId, city).toLowerCase();
                    return titularNombre.includes(searchValue.toLowerCase());
                });
            }
            
            if (resultados.length === 0) {
                showNotification('No se encontraron notas débito con los criterios de búsqueda', 'info');
                hideSearchNotaDebitoModal();
                return;
            }
            
            // Mostrar resultados en el modal
            showSearchResultsDebitoModal(resultados);
            hideSearchNotaDebitoModal();
            
        } catch (e) {
            console.error('Error en búsqueda de nota débito:', e);
            showNotification('Error al realizar la búsqueda', 'error');
        }
    } else {
        form.reportValidity();
    }
}

function searchNotaCredito() {
    const form = document.getElementById('searchNotaCreditoForm');
    if (form && form.checkValidity()) {
        const searchType = document.getElementById('creditoNoteSearchType').value;
        const searchValue = document.getElementById('searchNotaCreditoValue').value.trim();
        
        if (!searchValue) {
            showNotification('Por favor ingrese un valor de búsqueda', 'warning');
            return;
        }
        
        try {
            const city = getSelectedCityCode();
            if (!city) {
                showNotification('Debe seleccionar una ciudad', 'warning');
                return;
            }
            
            // Obtener todas las notas crédito de la ciudad
            const notasRaw = localStorage.getItem(`notasCredito_${city}`);
            let notas = notasRaw ? JSON.parse(notasRaw) : [];
            
            // Migrar notas que no tengan número asignado
            let notasActualizadas = false;
            const control = getControlConsecutivosForCity(city);
            const start = control ? parseInt(control.creditoCarteraInicial || control.creditoCartera || '1', 10) : 1;
            
            // Primero, encontrar el máximo número usado entre las notas que ya tienen número
            const maxUsed = notas
                .filter(n => n.numero && n.numero !== '')
                .map(n => parseInt(String(n.numero).replace(/\D/g, ''), 10) || 0)
                .reduce((a, b) => Math.max(a, b), start - 1);
            
            let siguienteNumero = maxUsed + 1;
            
            // Asignar números a las notas que no los tienen
            notas = notas.map(nota => {
                if (!nota.numero || nota.numero === '') {
                    notasActualizadas = true;
                    nota.numero = String(siguienteNumero);
                    console.log('🔄 Asignando número a nota crédito sin número:', { id: nota.id, numero: siguienteNumero });
                    siguienteNumero++;
                }
                return nota;
            });
            
            // Guardar notas actualizadas si hubo cambios
            if (notasActualizadas) {
                localStorage.setItem(`notasCredito_${city}`, JSON.stringify(notas));
                console.log('✅ Notas crédito actualizadas con números asignados');
            }
            
            // Filtrar según el tipo de búsqueda
            let resultados = [];
            
            if (searchType === 'noteNumber') {
                // Búsqueda por número de nota
                resultados = notas.filter(nota => {
                    const numero = String(nota.numero || '').toLowerCase();
                    return numero.includes(searchValue.toLowerCase());
                });
            } else if (searchType === 'holderId') {
                // Búsqueda por identificación del titular
                resultados = notas.filter(nota => {
                    const holderId = String(nota.holderId || '').toLowerCase();
                    return holderId.includes(searchValue.toLowerCase());
                });
            } else if (searchType === 'holderName') {
                // Búsqueda por nombre del titular
                resultados = notas.filter(nota => {
                    const titularNombre = getTitularNombre(nota.holderId, city).toLowerCase();
                    return titularNombre.includes(searchValue.toLowerCase());
                });
            }
            
            if (resultados.length === 0) {
                showNotification('No se encontraron notas crédito con los criterios de búsqueda', 'info');
                hideSearchNotaCreditoModal();
                return;
            }
            
            console.log('📊 Resultados de búsqueda nota crédito:', resultados);
            console.log('📋 Total de resultados:', resultados.length);
            
            // Mostrar resultados en el modal
            showSearchResultsCreditoModal(resultados);
            hideSearchNotaCreditoModal();
            
        } catch (e) {
            console.error('Error en búsqueda de nota crédito:', e);
            showNotification('Error al realizar la búsqueda', 'error');
        }
    } else {
        form.reportValidity();
    }
}

// Funciones antiguas eliminadas - ahora se usan validateAndCreateNotaDebito y validateAndCreateNotaCredito

// ========================================
// FUNCIONES DE MODALES DE CONFIRMACIÓN Y ÉXITO
// ========================================

function showConfirmCreateNoteModal(tipo) {
    const modal = document.getElementById('confirmCreateNoteModal');
    if (modal) {
        // Guardar el tipo de nota para usarlo en la confirmación
        modal.dataset.tipoNota = tipo;
        
        // Actualizar el mensaje según el tipo de nota
        const messageElement = modal.querySelector('.modal-message');
        if (messageElement) {
            if (tipo === 'credito') {
                messageElement.textContent = '¿Está segur@ que desea crear esta nota crédito?';
            } else if (tipo === 'debito') {
                messageElement.textContent = '¿Está segur@ que desea crear esta nota débito?';
            } else {
                messageElement.textContent = '¿Está segur@ que desea crear esta nota?';
            }
        }
        
        modal.style.display = 'flex';
    }
}

function hideConfirmCreateNoteModal() {
    const modal = document.getElementById('confirmCreateNoteModal');
    if (modal) {
        modal.style.display = 'none';
        modal.dataset.tipoNota = '';
        modal.dataset.isUpdate = '';
    }
}

function cancelCreateNote() {
    hideConfirmCreateNoteModal();
}

function handleConfirmNote() {
    const modal = document.getElementById('confirmCreateNoteModal');
    const tipo = modal ? modal.dataset.tipoNota : '';
    const isUpdate = modal ? modal.dataset.isUpdate === 'true' : false;
    
    if (isUpdate) {
        confirmUpdateNote();
    } else {
        confirmCreateNote();
    }
}

function confirmCreateNote() {
    const modal = document.getElementById('confirmCreateNoteModal');
    const tipo = modal ? modal.dataset.tipoNota : '';
    
    if (tipo === 'debito') {
        confirmCreateNotaDebito();
    } else if (tipo === 'credito') {
        confirmCreateNotaCredito();
    }
}

function showConfirmUpdateNoteModal(tipo) {
    const modal = document.getElementById('confirmCreateNoteModal');
    if (modal) {
        // Guardar el tipo de nota para usarlo en la confirmación
        modal.dataset.tipoNota = tipo;
        modal.dataset.isUpdate = 'true';
        
        // Actualizar el mensaje según el tipo de nota
        const messageElement = modal.querySelector('.modal-message');
        if (messageElement) {
            if (tipo === 'credito') {
                messageElement.textContent = '¿Está segur@ que desea actualizar esta nota crédito?';
            } else if (tipo === 'debito') {
                messageElement.textContent = '¿Está segur@ que desea actualizar esta nota débito?';
            } else {
                messageElement.textContent = '¿Está segur@ que desea actualizar esta nota?';
            }
        }
        
        modal.style.display = 'flex';
    }
}

function confirmUpdateNote() {
    const modal = document.getElementById('confirmCreateNoteModal');
    const tipo = modal ? modal.dataset.tipoNota : '';
    
    if (tipo === 'debito') {
        confirmUpdateNotaDebito();
    } else if (tipo === 'credito') {
        confirmUpdateNotaCredito();
    }
}

function confirmUpdateNotaDebito() {
    const city = getSelectedCityCode();
    if (!city || !window.editingNotaId) {
        showNotification('Error: No se puede actualizar la nota', 'error');
        return;
    }
    
    try {
        // Obtener las notas actuales
        const notasRaw = localStorage.getItem(`notasDebito_${city}`);
        const notas = notasRaw ? JSON.parse(notasRaw) : [];
        
        // Buscar el índice de la nota a actualizar
        const index = notas.findIndex(n => String(n.id) === String(window.editingNotaId));
        
        if (index === -1) {
            showNotification('No se encontró la nota a actualizar', 'error');
            return;
        }
        
        // Actualizar la nota
        notas[index] = {
            ...notas[index],
            fechaHoy: document.getElementById('debitoFechaHoy').value,
            factura: document.getElementById('debitoFactura').value,
            contrato: document.getElementById('debitoContrato').value || document.getElementById('debitoContratoInput').value,
            holderId: document.getElementById('debitoHolderId').value,
            ejecutivo: document.getElementById('debitoEjecutivo').value,
            fechaVencimiento: document.getElementById('debitoFechaVencimiento').value || '',
            concepto: document.getElementById('debitoConcepto').value,
            valorNota: parseNumericValue(document.getElementById('debitoValorNota').value) || 0,
            cuentaDebito: document.getElementById('debitoCuentaDebito').value,
            cuentaCredito: document.getElementById('debitoCuentaCredito').value
        };
        
        // Guardar en localStorage
        localStorage.setItem(`notasDebito_${city}`, JSON.stringify(notas));
        
        // Ocultar modales
        hideConfirmCreateNoteModal();
        hideCreateNotaDebitoModal();
        
        // Limpiar estado de edición
        window.editingNotaId = null;
        window.editingNotaTipo = null;
        
        // Mostrar modal de éxito (indicar que es actualización)
        showSuccessCreateNoteModal(true);
        // Recargar según el tab activo
        const activeTab = document.querySelector('.internal-tab-item.active');
        if (activeTab && activeTab.dataset.tab === 'credito') {
            loadNotasCredito();
        } else {
            loadNotasDebito();
        }
    } catch (e) {
        console.error('Error actualizando nota débito:', e);
        hideConfirmCreateNoteModal();
        showNotification('Error al actualizar la nota débito', 'error');
    }
}

function confirmUpdateNotaCredito() {
    const city = getSelectedCityCode();
    if (!city || !window.editingNotaId) {
        showNotification('Error: No se puede actualizar la nota', 'error');
        return;
    }
    
    try {
        // Obtener las notas actuales
        const notasRaw = localStorage.getItem(`notasCredito_${city}`);
        const notas = notasRaw ? JSON.parse(notasRaw) : [];
        
        // Buscar el índice de la nota a actualizar
        const index = notas.findIndex(n => String(n.id) === String(window.editingNotaId));
        
        if (index === -1) {
            showNotification('No se encontró la nota a actualizar', 'error');
            return;
        }
        
        // Actualizar la nota
        notas[index] = {
            ...notas[index],
            fechaHoy: document.getElementById('creditoFechaHoy').value,
            factura: document.getElementById('creditoFactura').value,
            contrato: document.getElementById('creditoContrato').value || document.getElementById('creditoContratoInput').value,
            holderId: document.getElementById('creditoHolderId').value,
            ejecutivo: document.getElementById('creditoEjecutivo').value,
            fechaVencimiento: document.getElementById('creditoFechaVencimiento').value || '',
            concepto: document.getElementById('creditoConcepto').value,
            valor: parseNumericValue(document.getElementById('creditoValor').value) || 0,
            cuentaDebito: document.getElementById('creditoCuentaDebito').value,
            cuentaCredito: document.getElementById('creditoCuentaCredito').value
        };
        
        // Guardar en localStorage
        localStorage.setItem(`notasCredito_${city}`, JSON.stringify(notas));
        
        // Ocultar modales
        hideConfirmCreateNoteModal();
        hideCreateNotaCreditoModal();
        
        // Limpiar estado de edición
        window.editingNotaId = null;
        window.editingNotaTipo = null;
        
        // Mostrar modal de éxito (indicar que es actualización)
        showSuccessCreateNoteModal(true);
        // Recargar según el tab activo
        const activeTab = document.querySelector('.internal-tab-item.active');
        if (activeTab && activeTab.dataset.tab === 'credito') {
            loadNotasCredito();
        } else {
            loadNotasDebito();
        }
    } catch (e) {
        console.error('Error actualizando nota crédito:', e);
        hideConfirmCreateNoteModal();
        showNotification('Error al actualizar la nota crédito', 'error');
    }
}

function showSuccessCreateNoteModal(isUpdate = false) {
    const modal = document.getElementById('successCreateNoteModal');
    if (modal) {
        // Actualizar mensaje según si es creación o actualización
        const messageElement = modal.querySelector('.modal-message');
        if (messageElement) {
            if (isUpdate) {
                messageElement.textContent = '¡La nota fue actualizada correctamente!';
            } else {
                messageElement.textContent = '¡La nota fue creada correctamente!';
            }
        }
        modal.style.display = 'flex';
    }
}

function closeSuccessCreateNoteModal() {
    const modal = document.getElementById('successCreateNoteModal');
    if (modal) modal.style.display = 'none';
    // Recargar según el tab activo
    const activeTab = document.querySelector('.internal-tab-item.active');
    if (activeTab && activeTab.dataset.tab === 'credito') {
        loadNotasCredito();
    } else {
        loadNotasDebito();
    }
}

function generateReportNotaDebito() {
    const form = document.getElementById('reportNotaDebitoForm');
    if (form && form.checkValidity()) {
        const startDate = document.getElementById('debitoStartDate').value;
        const endDate = document.getElementById('debitoEndDate').value;
        
        if (!startDate || !endDate) {
            showNotification('Por favor complete ambas fechas', 'warning');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            showNotification('La fecha de inicio no puede ser mayor a la fecha de fin', 'error');
            return;
        }
        
        try {
            const city = getSelectedCityCode();
            if (!city) {
                showNotification('Debe seleccionar una ciudad', 'warning');
                return;
            }
            
            // Obtener notas débito de la ciudad
            const notasRaw = localStorage.getItem(`notasDebito_${city}`);
            const notas = notasRaw ? JSON.parse(notasRaw) : [];
            
            // Filtrar por rango de fechas
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');
            
            const notasFiltradas = notas.filter(nota => {
                try {
                    const fechaNota = new Date(nota.fechaHoy || nota.fecha || '');
                    return fechaNota >= start && fechaNota <= end;
                } catch (e) {
                    return false;
                }
            });
            
            if (notasFiltradas.length === 0) {
                showNotification('No se encontraron notas débito en el rango de fechas seleccionado', 'info');
                return;
            }
            
            // Preparar datos del reporte
            const cityName = getCityNameByCode(city) || '';
            const reportData = {
                cityCode: city,
                cityName: cityName,
                startDate: startDate,
                endDate: endDate
            };
            
            // Guardar datos en localStorage para la página de reporte
            localStorage.setItem('reporteNotaDebitoData', JSON.stringify(reportData));
            
            // Abrir reporte en nueva pestaña
            const reportUrl = '../reportes/reporte-nota-debito.html';
            window.open(reportUrl, '_blank');
            
            hideReportNotaDebitoModal();
            showNotification('Reporte generado correctamente', 'success');
        } catch (e) {
            console.error('Error generando reporte:', e);
            showNotification('Error al generar el reporte', 'error');
        }
    } else {
        form.reportValidity();
    }
}


function generateReportNotaCredito() {
    const form = document.getElementById('reportNotaCreditoForm');
    if (form && form.checkValidity()) {
        const startDate = document.getElementById('creditoStartDate').value;
        const endDate = document.getElementById('creditoEndDate').value;
        
        if (!startDate || !endDate) {
            showNotification('Por favor complete ambas fechas', 'warning');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            showNotification('La fecha de inicio no puede ser mayor a la fecha de fin', 'error');
            return;
        }
        
        try {
            const city = getSelectedCityCode();
            if (!city) {
                showNotification('Debe seleccionar una ciudad', 'warning');
                return;
            }
            
            // Obtener notas crédito de la ciudad
            const notasRaw = localStorage.getItem(`notasCredito_${city}`);
            const notas = notasRaw ? JSON.parse(notasRaw) : [];
            
            // Filtrar por rango de fechas
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');
            
            const notasFiltradas = notas.filter(nota => {
                try {
                    const fechaNota = new Date(nota.fechaHoy || nota.fecha || '');
                    return fechaNota >= start && fechaNota <= end;
                } catch (e) {
                    return false;
                }
            });
            
            if (notasFiltradas.length === 0) {
                showNotification('No se encontraron notas crédito en el rango de fechas seleccionado', 'info');
                return;
            }
            
            // Preparar datos del reporte
            const cityName = getCityNameByCode(city) || '';
            const reportData = {
                cityCode: city,
                cityName: cityName,
                startDate: startDate,
                endDate: endDate
            };
            
            // Guardar datos en localStorage para la página de reporte
            localStorage.setItem('reporteNotaCreditoData', JSON.stringify(reportData));
            
            // Abrir reporte en nueva pestaña
            const reportUrl = '../reportes/reporte-nota-credito.html';
            window.open(reportUrl, '_blank');
            
            hideReportNotaCreditoModal();
            showNotification('Reporte generado correctamente', 'success');
        } catch (e) {
            console.error('Error generando reporte:', e);
            showNotification('Error al generar el reporte', 'error');
        }
    } else {
        form.reportValidity();
    }
}

// ========================================
// FUNCIONES DE NOTA DÉBITO
// ========================================

function showCreateNotaDebitoModal() {
    const modal = document.getElementById('createNotaDebitoModal');
    if (!modal) return;
    
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    // Si no estamos editando, resetear estado y formulario
    if (!window.editingNotaId) {
        // Limpiar estado de edición
        window.editingNotaId = null;
        window.editingNotaTipo = null;
        
        // Limpiar formulario
        const form = document.getElementById('createNotaDebitoForm');
        if (form) form.reset();
        
        // Restaurar título y botón del modal
        const modalTitle = document.querySelector('#createNotaDebitoModal .modal-title');
        const createButton = document.getElementById('bCrearNotaDebito');
        
        if (modalTitle) modalTitle.textContent = 'NOTA DÉBITO DE CARTERA:';
        if (createButton) {
            createButton.textContent = 'Crear';
            createButton.onclick = function() {
                validateAndCreateNotaDebito();
            };
        }
        
        // Ocultar display de nombre del titular
        const holderNameDisplay = document.getElementById('debitoHolderNameDisplay');
        if (holderNameDisplay) holderNameDisplay.style.display = 'none';
        
        // Ocultar select de contrato y mostrar input
        const contratoContainer = document.getElementById('debitoContratoContainer');
        const contratoInput = document.getElementById('debitoContratoInput');
        if (contratoContainer) contratoContainer.style.display = 'none';
        if (contratoInput) contratoInput.style.display = 'block';
        
        // Establecer fecha actual
        const fechaHoy = document.getElementById('debitoFechaHoy');
        if (fechaHoy) {
            const today = new Date().toISOString().split('T')[0];
            fechaHoy.value = today;
        }
        
        // Cargar número automático desde consecutivos
        loadNextNotaDebitoNumber(city);
    }
    
    // Inicializar formateo de campos numéricos
    setTimeout(() => {
        initializeNumericFormatting();
    }, 100);
    
    modal.style.display = 'flex';
}

function hideCreateNotaDebitoModal() {
    const modal = document.getElementById('createNotaDebitoModal');
    if (modal) modal.style.display = 'none';
}

// ========================================
// FUNCIONES DE NOTA CRÉDITO
// ========================================

function hideCreateNotaCreditoModal() {
    const modal = document.getElementById('createNotaCreditoModal');
    if (modal) modal.style.display = 'none';
}

// ========================================
// FUNCIONES DE CONSECUTIVOS
// ========================================

/**
 * Obtiene el control de consecutivos para una ciudad
 */
function getControlConsecutivosForCity(city) {
    try {
        // Usar los consecutivos configurados en la interfaz de consecutivos
        const raw = localStorage.getItem(`consecutivosData_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list) && list.length > 0) {
            // Siempre tomar el último registro creado/actualizado para la ciudad
            return list[list.length - 1];
        }
        return null;
    } catch (e) { 
        return null; 
    }
}

/**
 * Carga el siguiente número de nota débito desde consecutivos
 */
function loadNextNotaDebitoNumber(city) {
    try {
        const control = getControlConsecutivosForCity(city);
        const start = control ? parseInt(control.debitoCarteraInicial || control.debitoCartera || '1', 10) : 1;
        
        // Buscar el último número usado
        const notasRaw = localStorage.getItem(`notasDebito_${city}`);
        const notas = notasRaw ? JSON.parse(notasRaw) : [];
        let nextNumber = start;
        
        if (notas.length > 0) {
            const maxUsed = notas
                .map(n => parseInt(String(n.numero || '0').replace(/\D/g, ''), 10) || 0)
                .reduce((a, b) => Math.max(a, b), 0);
            if (maxUsed >= nextNumber) nextNumber = maxUsed + 1;
        }
        
        const debitoNumber = document.getElementById('debitoNumber');
        if (debitoNumber) {
            debitoNumber.value = String(nextNumber);
        }
    } catch (e) {
        console.error('Error cargando número de nota débito:', e);
        const debitoNumber = document.getElementById('debitoNumber');
        if (debitoNumber) debitoNumber.value = '1';
    }
}

/**
 * Carga el siguiente número de nota crédito desde consecutivos
 */
function loadNextNotaCreditoNumber(city) {
    try {
        const control = getControlConsecutivosForCity(city);
        const start = control ? parseInt(control.creditoCarteraInicial || control.creditoCartera || '1', 10) : 1;
        
        // Buscar el último número usado
        const notasRaw = localStorage.getItem(`notasCredito_${city}`);
        const notas = notasRaw ? JSON.parse(notasRaw) : [];
        let nextNumber = start;
        
        if (notas.length > 0) {
            const maxUsed = notas
                .map(n => parseInt(String(n.numero || '0').replace(/\D/g, ''), 10) || 0)
                .reduce((a, b) => Math.max(a, b), 0);
            if (maxUsed >= nextNumber) nextNumber = maxUsed + 1;
        }
        
        const creditoNumber = document.getElementById('creditoNumber');
        if (creditoNumber) {
            creditoNumber.value = String(nextNumber);
        }
    } catch (e) {
        console.error('Error cargando número de nota crédito:', e);
        const creditoNumber = document.getElementById('creditoNumber');
        if (creditoNumber) creditoNumber.value = '1';
    }
}

// ========================================
// FUNCIONES DE BÚSQUEDA Y CARGA DE DATOS
// ========================================

/**
 * Busca titular por identificación y carga facturas/contratos
 */
function searchTitularAndLoadData(identificacion, tipo) {
    const city = getSelectedCityCode();
    if (!city || !identificacion) return;
    
    try {
        // Buscar titular
        const titularesByCityRaw = localStorage.getItem('titularesByCity');
        if (!titularesByCityRaw) {
            showNotification('No se encontró el titular', 'error');
            return;
        }
        
        const titularesByCity = JSON.parse(titularesByCityRaw);
        const titular = titularesByCity[city] && titularesByCity[city][identificacion];
        
        if (!titular) {
            showNotification('No se encontró el titular con esa identificación', 'error');
            return;
        }
        
        // Mostrar nombre del titular
        const nombreCompleto = `${titular.apellido1 || ''} ${titular.apellido2 || ''} ${titular.nombre1 || ''} ${titular.nombre2 || ''}`.trim().toUpperCase();
        const holderNameDisplay = document.getElementById(`${tipo}HolderNameDisplay`);
        if (holderNameDisplay) {
            holderNameDisplay.textContent = nombreCompleto;
            holderNameDisplay.style.display = 'block';
        }
        
        // Buscar contratos del titular
        const contratosRaw = localStorage.getItem(`contratos_${city}`);
        if (!contratosRaw) {
            console.log('⚠️ No se encontraron contratos en localStorage para ciudad:', city);
            showNotification('No se encontraron contratos para este titular', 'warning');
            return;
        }
        
        const contratos = JSON.parse(contratosRaw);
        const contratosArray = Array.isArray(contratos) ? contratos : Object.values(contratos);
        console.log(`🔍 Buscando contratos para titular ${identificacion} en ${contratosArray.length} contratos`);
        
        const contratosTitular = contratosArray.filter(c => {
            // Buscar en todos los campos posibles de identificación del titular
            const titularId = c.clientId || c.identificacion || c.titularId || c.holderId || '';
            const match = String(titularId).trim() === String(identificacion).trim();
            if (match) {
                console.log('✅ Contrato encontrado:', c.contractNumber || c.numeroContrato || c.numero, 'para titular:', titularId);
            }
            return match;
        });
        
        console.log(`📊 Contratos encontrados para titular ${identificacion}:`, contratosTitular.length);
        
        if (contratosTitular.length === 0) {
            console.log('⚠️ No se encontraron contratos que coincidan con la identificación:', identificacion);
            showNotification('No se encontraron contratos para este titular', 'warning');
            return;
        }
        
        // Siempre mostrar el desplegable de contratos (incluso si hay solo uno)
        showContratosList(contratosTitular, tipo, city);
        
        // Si hay un solo contrato, seleccionarlo automáticamente y cargar datos
        if (contratosTitular.length === 1) {
            const contrato = contratosTitular[0];
            const contractNumber = contrato.numeroContrato || contrato.numero || contrato.contractNumber || '';
            const contratoSelect = document.getElementById(`${tipo}Contrato`);
            if (contratoSelect) {
                contratoSelect.value = contractNumber;
                // Disparar evento change para cargar factura y ejecutivo
                // Usar setTimeout para asegurar que el DOM esté actualizado
                setTimeout(() => {
                    contratoSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }, 100);
            }
        }
        
    } catch (e) {
        console.error('Error buscando titular:', e);
        showNotification('Error al buscar el titular', 'error');
    }
}

/**
 * Muestra lista de contratos para seleccionar
 */
function showContratosList(contratos, tipo, city) {
    const contratoSelect = document.getElementById(`${tipo}Contrato`);
    const contratoInput = document.getElementById(`${tipo}ContratoInput`);
    const contratoContainer = document.getElementById(`${tipo}ContratoContainer`);
    
    if (!contratoSelect || !contratoInput || !contratoContainer) return;
    
    // Limpiar opciones
    contratoSelect.innerHTML = '<option value="">Seleccione el contrato</option>';
    
    // Agregar contratos
    contratos.forEach(contrato => {
        const contractNumber = contrato.numeroContrato || contrato.numero || contrato.contractNumber || '';
        const opt = document.createElement('option');
        opt.value = contractNumber;
        opt.textContent = `${contractNumber} - ${contrato.titular || contrato.cliente || ''}`;
        opt.dataset.contrato = JSON.stringify(contrato);
        contratoSelect.appendChild(opt);
    });
    
    // Mostrar select y ocultar input
    contratoContainer.style.display = 'block';
    contratoInput.style.display = 'none';
}

/**
 * Carga factura desde contrato
 */
function loadFacturaFromContrato(contractNumber, tipo) {
    const city = getSelectedCityCode();
    if (!city || !contractNumber) {
        console.log('⚠️ No se puede cargar factura: ciudad o número de contrato faltante');
        return;
    }
    
    try {
        console.log(`🔍 Buscando factura para contrato ${contractNumber} en ciudad ${city}`);
        
        // Buscar factura asociada al contrato
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        let invoice = null;
        let invoiceNumber = '';
        
        if (invoicesRaw) {
            const invoicesByCity = JSON.parse(invoicesRaw);
            const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
            console.log(`📋 Total de facturas en ciudad ${city}: ${invoices.length}`);
            
            // Buscar factura por múltiples campos posibles
            invoice = invoices.find(inv => {
                const invContract = inv.contractNumber || inv.contrato || inv.contract || inv.contractId || '';
                const contractMatch = String(invContract).trim() === String(contractNumber).trim();
                
                // También buscar por ID del contrato si está disponible
                let idMatch = false;
                if (inv.contractId) {
                    const contratosRaw = localStorage.getItem(`contratos_${city}`);
                    if (contratosRaw) {
                        const contratos = JSON.parse(contratosRaw);
                        const contratosArray = Array.isArray(contratos) ? contratos : Object.values(contratos);
                        const contrato = contratosArray.find(c => {
                            const num = c.numeroContrato || c.numero || c.contractNumber || '';
                            return String(num).trim() === String(contractNumber).trim();
                        });
                        if (contrato && contrato.id) {
                            idMatch = String(inv.contractId).trim() === String(contrato.id).trim();
                        }
                    }
                }
                
                return contractMatch || idMatch;
            });
            
            if (invoice) {
                invoiceNumber = invoice.invoiceNumber || invoice.numeroFactura || invoice.invoice || '';
                console.log(`✅ Factura encontrada: ${invoiceNumber} para contrato ${contractNumber}`);
            } else {
                console.log(`⚠️ No se encontró factura para contrato ${contractNumber}`);
            }
        } else {
            console.log('⚠️ No hay facturas almacenadas en invoicesByCity');
        }
        
        const facturaInput = document.getElementById(`${tipo}Factura`);
        if (facturaInput) {
            facturaInput.value = invoiceNumber;
            if (invoiceNumber) {
                console.log(`✅ Factura ${invoiceNumber} cargada en campo ${tipo}Factura`);
            } else {
                console.log(`⚠️ Campo de factura vacío - no se encontró factura para contrato ${contractNumber}`);
            }
        } else {
            console.log(`⚠️ Campo ${tipo}Factura no encontrado en el DOM`);
        }
        
        // Cargar ejecutivo desde el contrato o asignación
        const contratosRaw = localStorage.getItem(`contratos_${city}`);
        if (contratosRaw) {
            const contratos = JSON.parse(contratosRaw);
            const contratosArray = Array.isArray(contratos) ? contratos : Object.values(contratos);
            const contrato = contratosArray.find(c => {
                const num = c.numeroContrato || c.numero || c.contractNumber || '';
                return String(num).trim() === String(contractNumber).trim();
            });
            
            if (contrato) {
                // Cargar ejecutivo desde el contrato o asignación (pasar invoiceNumber si está disponible)
                loadEjecutivoFromContrato(contrato, tipo, invoiceNumber);
            } else {
                console.log(`⚠️ No se encontró contrato ${contractNumber} en la lista de contratos`);
            }
        }
        
    } catch (e) {
        console.error('❌ Error cargando factura desde contrato:', e);
    }
}

/**
 * Carga contrato y factura automáticamente
 * NOTA: Esta función ya no se usa, ahora siempre se muestra el select
 */
function loadContratoAndFactura(contractNumber, tipo, city) {
    // Ya no ocultamos el select, siempre se muestra
    const contratoSelect = document.getElementById(`${tipo}Contrato`);
    if (contratoSelect) {
        contratoSelect.value = contractNumber;
        // Disparar evento change para cargar factura y ejecutivo
        contratoSelect.dispatchEvent(new Event('change'));
    }
    
    // Cargar factura
    loadFacturaFromContrato(contractNumber, tipo);
}

/**
 * Carga ejecutivo desde contrato o asignación
 */
function loadEjecutivoFromContrato(contrato, tipo, invoiceNumber = null) {
    const city = getSelectedCityCode();
    if (!city || !contrato) return;
    
    try {
        // Primero intentar obtener desde el contrato
        let ejecutivoId = contrato.executiveId || contrato.ejecutivoId || contrato.executive || contrato.ejecutivo || '';
        
        // Si no hay ejecutivo en el contrato, buscar en asignaciones
        if (!ejecutivoId) {
            const contractNumber = contrato.numeroContrato || contrato.numero || contrato.contractNumber || '';
            ejecutivoId = findEjecutivoFromAssignments(contractNumber, city, invoiceNumber);
        }
        
        // Si encontramos ejecutivo, buscar su nombre
        if (ejecutivoId) {
            const ejecutivoNombre = getEjecutivoNombre(ejecutivoId, city);
            const ejecutivoInput = document.getElementById(`${tipo}Ejecutivo`);
            if (ejecutivoInput) {
                ejecutivoInput.value = ejecutivoNombre || ejecutivoId;
            }
        }
        
    } catch (e) {
        console.error('Error cargando ejecutivo:', e);
    }
}

/**
 * Busca ejecutivo desde asignaciones usando factura o contrato
 */
function findEjecutivoFromAssignments(contractNumber, city, invoiceNumber = null) {
    try {
        const raw = localStorage.getItem('assignmentsByCity');
        if (!raw) return '';
        
        const assignmentsByCity = JSON.parse(raw);
        const assignments = Array.isArray(assignmentsByCity[city]) ? assignmentsByCity[city] : [];
        
        // Si tenemos número de factura, buscar directamente
        if (invoiceNumber) {
            for (const assignment of assignments) {
                if (Array.isArray(assignment.accounts)) {
                    const hasInvoice = assignment.accounts.some(acc => {
                        const accInvoiceNum = String(acc.invoiceNumber || '').trim();
                        const searchInvoiceNum = String(invoiceNumber).trim();
                        return accInvoiceNum === searchInvoiceNum || 
                               accInvoiceNum.replace(/^0+/, '') === searchInvoiceNum.replace(/^0+/, '');
                    });
                    
                    if (hasInvoice) {
                        return assignment.executiveId || '';
                    }
                }
            }
        }
        
        // Si no tenemos factura, buscar por contrato
        if (contractNumber) {
            // Buscar factura asociada al contrato
            const invoicesRaw = localStorage.getItem('invoicesByCity');
            if (invoicesRaw) {
                const invoicesByCity = JSON.parse(invoicesRaw);
                const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
                
                const invoice = invoices.find(inv => {
                    const invContract = inv.contractNumber || inv.contrato || inv.contract || inv.contractId || '';
                    return String(invContract).trim() === String(contractNumber).trim();
                });
                
                if (invoice) {
                    const invNumber = invoice.invoiceNumber || '';
                    // Buscar ejecutivo usando la factura encontrada
                    return findEjecutivoFromAssignments(contractNumber, city, invNumber);
                }
            }
        }
        
        return '';
    } catch (e) {
        console.error('Error buscando ejecutivo desde asignaciones:', e);
        return '';
    }
}

/**
 * Obtiene el nombre del ejecutivo
 */
function getEjecutivoNombre(ejecutivoId, city) {
    try {
        const empleadosRaw = localStorage.getItem('empleadosByCity');
        if (!empleadosRaw) return '';
        
        const empleadosByCity = JSON.parse(empleadosRaw);
        const empleados = empleadosByCity[city] || {};
        const empleado = empleados[ejecutivoId];
        
        if (empleado) {
            const nombre = `${empleado.tPrimerNombre || empleado.primerNombre || ''} ${empleado.tSegundoNombre || empleado.segundoNombre || ''} ${empleado.tPrimerApellido || empleado.primerApellido || ''} ${empleado.tSegundoApellido || empleado.segundoApellido || ''}`.trim();
            return nombre.toUpperCase();
        }
        
        return '';
    } catch (e) {
        console.error('Error obteniendo nombre del ejecutivo:', e);
        return '';
    }
}

// ========================================
// FUNCIONES DE VALIDACIÓN Y CREACIÓN
// ========================================

function validateAndCreateNotaDebito() {
    const form = document.getElementById('createNotaDebitoForm');
    if (form && form.checkValidity()) {
        // Mostrar modal de confirmación
        showConfirmCreateNoteModal('debito');
    } else {
        form.reportValidity();
    }
}

function validateAndCreateNotaCredito() {
    const form = document.getElementById('createNotaCreditoForm');
    if (form && form.checkValidity()) {
        // Mostrar modal de confirmación
        showConfirmCreateNoteModal('credito');
    } else {
        form.reportValidity();
    }
}

function validateAndUpdateNotaDebito() {
    const form = document.getElementById('createNotaDebitoForm');
    if (form && form.checkValidity()) {
        // Mostrar modal de confirmación para actualizar
        showConfirmUpdateNoteModal('debito');
    } else {
        form.reportValidity();
    }
}

function validateAndUpdateNotaCredito() {
    const form = document.getElementById('createNotaCreditoForm');
    if (form && form.checkValidity()) {
        // Mostrar modal de confirmación para actualizar
        showConfirmUpdateNoteModal('credito');
    } else {
        form.reportValidity();
    }
}

function confirmCreateNotaDebito() {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad', 'warning');
        return;
    }
    
    try {
        const nota = {
            id: Date.now(),
            numero: document.getElementById('debitoNumber').value,
            fechaHoy: document.getElementById('debitoFechaHoy').value,
            factura: document.getElementById('debitoFactura').value,
            contrato: document.getElementById('debitoContrato').value || document.getElementById('debitoContratoInput').value,
            holderId: document.getElementById('debitoHolderId').value,
            ejecutivo: document.getElementById('debitoEjecutivo').value,
            fechaVencimiento: document.getElementById('debitoFechaVencimiento').value || '',
            concepto: document.getElementById('debitoConcepto').value,
            valorNota: parseNumericValue(document.getElementById('debitoValorNota').value) || 0,
            cuentaDebito: document.getElementById('debitoCuentaDebito').value,
            cuentaCredito: document.getElementById('debitoCuentaCredito').value,
            tipo: 'DEBITO',
            estado: 'ACTIVA',
            city: city
        };
        
        // Guardar en localStorage
        const notasRaw = localStorage.getItem(`notasDebito_${city}`);
        const notas = notasRaw ? JSON.parse(notasRaw) : [];
        notas.push(nota);
        localStorage.setItem(`notasDebito_${city}`, JSON.stringify(notas));
        
        // Ocultar modal de confirmación y formulario
        hideConfirmCreateNoteModal();
        hideCreateNotaDebitoModal();
        
        // Mostrar modal de éxito
        showSuccessCreateNoteModal();
        // Recargar según el tab activo
        const activeTab = document.querySelector('.internal-tab-item.active');
        if (activeTab && activeTab.dataset.tab === 'credito') {
            loadNotasCredito();
        } else {
            loadNotasDebito();
        }
    } catch (e) {
        console.error('Error creando nota débito:', e);
        hideConfirmCreateNoteModal();
        showNotification('Error al crear la nota débito', 'error');
    }
}

function confirmCreateNotaCredito() {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad', 'warning');
        return;
    }
    
    try {
        const creditoNumberField = document.getElementById('creditoNumber');
        const numeroValue = creditoNumberField ? creditoNumberField.value.trim() : '';
        
        console.log('🔍 Número de nota crédito a guardar:', numeroValue);
        
        if (!numeroValue) {
            console.error('❌ Error: El número de nota crédito está vacío');
            showNotification('El número de nota crédito es requerido. Por favor, cierre y vuelva a abrir el modal.', 'error');
            return;
        }
        
        const nota = {
            id: Date.now(),
            numero: numeroValue,
            fechaHoy: document.getElementById('creditoFechaHoy').value,
            factura: document.getElementById('creditoFactura').value,
            contrato: document.getElementById('creditoContrato').value || document.getElementById('creditoContratoInput').value,
            holderId: document.getElementById('creditoHolderId').value,
            ejecutivo: document.getElementById('creditoEjecutivo').value,
            fechaVencimiento: document.getElementById('creditoFechaVencimiento').value || '',
            concepto: document.getElementById('creditoConcepto').value,
            valor: parseNumericValue(document.getElementById('creditoValor').value) || 0,
            cuentaDebito: document.getElementById('creditoCuentaDebito').value,
            cuentaCredito: document.getElementById('creditoCuentaCredito').value,
            tipo: 'CREDITO',
            estado: 'ACTIVA',
            city: city
        };
        
        // Guardar en localStorage
        const notasRaw = localStorage.getItem(`notasCredito_${city}`);
        const notas = notasRaw ? JSON.parse(notasRaw) : [];
        notas.push(nota);
        localStorage.setItem(`notasCredito_${city}`, JSON.stringify(notas));
        
        console.log('✅ Nota crédito guardada:', nota);
        console.log('📋 Total de notas crédito en ciudad:', notas.length);
        
        // Ocultar modal de confirmación y formulario
        hideConfirmCreateNoteModal();
        hideCreateNotaCreditoModal();
        
        // Mostrar modal de éxito
        showSuccessCreateNoteModal();
        // Recargar según el tab activo
        const activeTab = document.querySelector('.internal-tab-item.active');
        if (activeTab && activeTab.dataset.tab === 'credito') {
            loadNotasCredito();
        } else {
            loadNotasDebito();
        }
    } catch (e) {
        console.error('Error creando nota crédito:', e);
        hideConfirmCreateNoteModal();
        showNotification('Error al crear la nota crédito', 'error');
    }
}

// ========================================
// FUNCIONES DE LOGOUT
// ========================================

function showConfirmLogoutModal() {
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) modal.style.display = 'flex';
}

function cancelLogout() {
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) modal.style.display = 'none';
}

function confirmLogout() {
    sessionStorage.clear();
    window.location.href = '../../login.html';
}

// ========================================
// FUNCIONES DE FORMATEO NUMÉRICO
// ========================================

/**
 * Formatea un valor numérico con separación de miles (formato colombiano)
 */
function formatCurrencyInput(value) {
    if (isNaN(value) || value === null || value === undefined || value === '') return '';
    // Formatear con formato colombiano (punto como separador de miles, sin decimales)
    return new Intl.NumberFormat('es-CO', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    }).format(Number(value));
}

/**
 * Parsea un valor numérico desde un string formateado
 */
function parseNumericValue(value) {
    if (!value || value === '') return 0;
    // Remover todos los caracteres no numéricos excepto el punto (por si acaso)
    const cleaned = String(value).replace(/[^\d]/g, '');
    return parseInt(cleaned, 10) || 0;
}

/**
 * Inicializa el formateo de campos numéricos con separación de miles
 */
function initializeNumericFormatting() {
    // Campos de valor en notas débito y crédito
    const valorInputs = ['debitoValorNota', 'creditoValor'];
    
    valorInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        // Event listener para formatear mientras el usuario escribe
        input.addEventListener('input', function(e) {
            // Obtener posición del cursor antes de cambiar el valor
            const cursorPosition = this.selectionStart;
            const originalLength = this.value.length;
            
            // Permitir solo números
            let value = this.value.replace(/[^\d]/g, '');
            
            if (value && value !== '') {
                // Formatear con separadores de miles
                const numericValue = parseNumericValue(value);
                const formatted = formatCurrencyInput(numericValue);
                
                // Actualizar el valor
                this.value = formatted;
                
                // Ajustar la posición del cursor
                const newLength = this.value.length;
                const lengthDiff = newLength - originalLength;
                const newCursorPosition = Math.max(0, Math.min(cursorPosition + lengthDiff, this.value.length));
                this.setSelectionRange(newCursorPosition, newCursorPosition);
            } else {
                this.value = '';
            }
        });
        
        // Al perder el foco, asegurar formato correcto
        input.addEventListener('blur', function() {
            if (this.value) {
                const value = parseNumericValue(this.value);
                this.value = formatCurrencyInput(value);
            }
        });
        
        // Prevenir pegar texto no numérico
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const numbersOnly = paste.replace(/[^\d]/g, '');
            if (numbersOnly) {
                const numericValue = parseNumericValue(numbersOnly);
                this.value = formatCurrencyInput(numericValue);
            }
        });
    });
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
// FUNCIÓN PARA CAMBIAR ESTADO DE NOTAS
// ========================================

function toggleNoteStatus(noteId, tipo, isActive) {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        // Revertir el toggle
        revertToggleState(noteId, isActive);
        return;
    }
    
    try {
        const storageKey = tipo === 'DEBITO' ? `notasDebito_${city}` : `notasCredito_${city}`;
        const notasRaw = localStorage.getItem(storageKey);
        const notas = notasRaw ? JSON.parse(notasRaw) : [];
        
        // Buscar la nota
        const index = notas.findIndex(n => String(n.id) === String(noteId));
        if (index === -1) {
            showNotification('No se encontró la nota', 'error');
            // Revertir el toggle
            revertToggleState(noteId, isActive);
            return;
        }
        
        const nota = notas[index];
        const newStatus = isActive ? 'activo' : 'anulado';
        const action = isActive ? 'activar' : 'anular';
        
        // Mostrar modal de confirmación
        showConfirmToggleNoteModal(nota, newStatus, action, noteId, tipo, isActive);
    } catch (e) {
        console.error('Error cambiando estado de nota:', e);
        showNotification('Error al cambiar el estado de la nota', 'error');
        // Revertir el toggle
        revertToggleState(noteId, isActive);
    }
}

function showConfirmToggleNoteModal(nota, newStatus, action, noteId, tipo, isActive) {
    const modal = document.getElementById('confirmToggleNoteModal');
    const title = document.getElementById('confirmToggleNoteTitle');
    const message = document.getElementById('confirmToggleNoteMessage');
    
    if (!modal || !title || !message) {
        console.error('No se encontró el modal de confirmación');
        revertToggleState(noteId, isActive);
        return;
    }
    
    // Actualizar título y mensaje
    title.textContent = `CONFIRMAR ${action.toUpperCase()}`;
    message.textContent = `¿Está seguro de que desea ${action} la nota ${nota.numero || nota.id}?`;
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Guardar datos para confirmación
    window.pendingToggleNote = {
        nota,
        newStatus,
        action,
        noteId,
        tipo,
        isActive
    };
}

function confirmToggleNote() {
    if (!window.pendingToggleNote) {
        hideConfirmToggleNoteModal();
        return;
    }
    
    const { nota, newStatus, noteId, tipo, isActive } = window.pendingToggleNote;
    const city = getSelectedCityCode();
    
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        hideConfirmToggleNoteModal();
        revertToggleState(noteId, isActive);
        return;
    }
    
    try {
        const storageKey = tipo === 'DEBITO' ? `notasDebito_${city}` : `notasCredito_${city}`;
        const notasRaw = localStorage.getItem(storageKey);
        const notas = notasRaw ? JSON.parse(notasRaw) : [];
        
        // Buscar la nota
        const index = notas.findIndex(n => String(n.id) === String(noteId));
        if (index === -1) {
            showNotification('No se encontró la nota', 'error');
            hideConfirmToggleNoteModal();
            revertToggleState(noteId, isActive);
            return;
        }
        
        // Actualizar estado
        notas[index] = {
            ...notas[index],
            estado: newStatus
        };
        
        // Guardar en localStorage
        localStorage.setItem(storageKey, JSON.stringify(notas));
        
        // Cerrar modal de confirmación
        hideConfirmToggleNoteModal();
        
        // Recargar la tabla según el tab activo
        const activeTab = document.querySelector('.internal-tab-item.active');
        if (activeTab && activeTab.dataset.tab === 'credito') {
            loadNotasCredito();
        } else {
            loadNotasDebito();
        }
        
        // Mostrar modal de éxito
        const action = newStatus === 'activo' ? 'activada' : 'anulada';
        showSuccessToggleNoteModal(nota, action);
        
        // Limpiar datos pendientes
        window.pendingToggleNote = null;
    } catch (e) {
        console.error('Error confirmando cambio de estado:', e);
        showNotification('Error al cambiar el estado de la nota', 'error');
        hideConfirmToggleNoteModal();
        revertToggleState(noteId, isActive);
        window.pendingToggleNote = null;
    }
}

function cancelToggleNote() {
    if (!window.pendingToggleNote) {
        hideConfirmToggleNoteModal();
        return;
    }
    
    const { noteId, isActive } = window.pendingToggleNote;
    
    // Revertir el toggle
    revertToggleState(noteId, isActive);
    
    // Cerrar modal
    hideConfirmToggleNoteModal();
    
    // Limpiar datos pendientes
    window.pendingToggleNote = null;
}

function hideConfirmToggleNoteModal() {
    const modal = document.getElementById('confirmToggleNoteModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function revertToggleState(noteId, isActive) {
    // Buscar el checkbox en todas las tablas (principal y modales de búsqueda)
    const checkboxes = document.querySelectorAll(`input[type="checkbox"][onchange*="toggleNoteStatus('${noteId}'"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = !isActive;
    });
}

function showSuccessToggleNoteModal(nota, action) {
    const modal = document.getElementById('successToggleNoteModal');
    const message = document.getElementById('successToggleNoteMessage');
    
    if (!modal || !message) {
        console.error('No se encontró el modal de éxito');
        showNotification(`Nota ${action} correctamente`, 'success');
        return;
    }
    
    // Actualizar mensaje
    message.textContent = `¡La nota ${nota.numero || nota.id} ha sido ${action} exitosamente!`;
    
    // Mostrar modal
    modal.style.display = 'flex';
}

function closeSuccessToggleNoteModal() {
    const modal = document.getElementById('successToggleNoteModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

