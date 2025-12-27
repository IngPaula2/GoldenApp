/**
 * 📊 FUNCIONALIDAD ESTADO DE CUENTA - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de estado de cuenta.
 * Incluye consulta y visualización del estado de cuenta de los titulares.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let accountStatusData = {};

function getSelectedCityCode() {
    try { return sessionStorage.getItem('selectedCity') || ''; } catch (e) { return ''; }
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando carga de interfaz de estado de cuenta...');
        
        // Inicializar dropdown del usuario
        initializeUserDropdown();
        
        // Inicializar modales
        initializeModals();
        
        // Cargar ciudades
        loadCities();
        
        // Siempre mostrar modal de selección de ciudad al cargar
        initializeCitySelection();
        
        console.log('✅ Interfaz de estado de cuenta cargada correctamente');
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
    
    // Botón consultar estado
    const bConsultarEstado = document.getElementById('bConsultarEstado');
    if (bConsultarEstado) {
        bConsultarEstado.addEventListener('click', function() {
            consultAccountStatus();
        });
    }
    
    // Botón generar reporte
    const bGenerarReporte = document.getElementById('bGenerarReporte');
    if (bGenerarReporte) {
        bGenerarReporte.addEventListener('click', function() {
            generateReport();
        });
    }
    
    // Botón generar reporte desde consulta
    const bGenerarReporteDesdeConsulta = document.getElementById('bGenerarReporteDesdeConsulta');
    if (bGenerarReporteDesdeConsulta) {
        bGenerarReporteDesdeConsulta.addEventListener('click', function() {
            // Guardar datos para pre-llenar el modal de reporte
            if (window.__currentAccountData && window.__currentAccountData.holderId) {
                window.__prefillReportData = {
                    holderId: window.__currentAccountData.holderId,
                    selectedInvoiceNumber: window.__currentAccountData.selectedInvoiceNumber || null
                };
            }
            
            // Cerrar el modal de resultados
            hideAccountStatusResultsModal();
            
            // Mostrar el modal de reporte (se pre-llenará automáticamente)
            showReportModal();
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
    
    // Limpiar datos hasta que se seleccione una ciudad
    accountStatusData = {};
    
    // Ocultar elementos que requieren ciudad
    const holderInfoCard = document.getElementById('holderInfoCard');
    const summaryCards = document.getElementById('summaryCards');
    const accountStatusTable = document.getElementById('accountStatusTable');
    const searchPrompt = document.getElementById('searchPrompt');
    if (holderInfoCard) holderInfoCard.style.display = 'none';
    if (summaryCards) summaryCards.style.display = 'none';
    if (accountStatusTable) accountStatusTable.style.display = 'none';
    if (searchPrompt) searchPrompt.style.display = 'block';
    
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
    if (!cityCode) {
        const currentCityName = document.getElementById('currentCityName');
        if (currentCityName) {
            currentCityName.textContent = 'Seleccione una ciudad';
        }
        return;
    }
    
    const cityName = getCityNameByCode(cityCode);
    const currentCityName = document.getElementById('currentCityName');
    if (currentCityName) {
        if (cityName) {
            currentCityName.textContent = `${cityCode} - ${cityName}`.toUpperCase();
        } else {
            currentCityName.textContent = cityCode;
        }
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

function showSearchAccountModal() {
    const modal = document.getElementById('searchAccountModal');
    if (modal) {
        // Limpiar campos
        const searchHolderIdInput = document.getElementById('searchAccountHolderId');
        const searchInvoiceSelect = document.getElementById('searchInvoiceSelect');
        const searchInvoiceSelectorGroup = document.getElementById('searchInvoiceSelectorGroup');
        
        if (searchHolderIdInput) searchHolderIdInput.value = '';
        if (searchInvoiceSelect) {
            searchInvoiceSelect.innerHTML = '<option value="">-- Seleccione una factura --</option>';
            searchInvoiceSelect.value = '';
        }
        if (searchInvoiceSelectorGroup) searchInvoiceSelectorGroup.style.display = 'none';
        
        // Agregar listener para cargar facturas cuando se ingrese la identificación
        if (searchHolderIdInput) {
            // Remover listener anterior si existe
            searchHolderIdInput.removeEventListener('blur', handleSearchHolderIdBlur);
            searchHolderIdInput.removeEventListener('input', handleSearchHolderIdInput);
            // Agregar listeners
            searchHolderIdInput.addEventListener('blur', handleSearchHolderIdBlur);
            searchHolderIdInput.addEventListener('input', handleSearchHolderIdInput);
        }
        
        modal.style.display = 'flex';
    }
}

function hideSearchAccountModal() {
    const modal = document.getElementById('searchAccountModal');
    if (modal) modal.style.display = 'none';
}

function handleSearchHolderIdBlur() {
    const searchHolderIdInput = document.getElementById('searchAccountHolderId');
    if (searchHolderIdInput && searchHolderIdInput.value.trim()) {
        loadInvoicesForSearch(searchHolderIdInput.value.trim());
    }
}

function handleSearchHolderIdInput() {
    const searchHolderIdInput = document.getElementById('searchAccountHolderId');
    if (searchHolderIdInput && searchHolderIdInput.value.trim().length >= 5) {
        // Cargar facturas después de un pequeño delay para evitar cargas innecesarias
        clearTimeout(window._searchInvoiceTimeout);
        window._searchInvoiceTimeout = setTimeout(() => {
            loadInvoicesForSearch(searchHolderIdInput.value.trim());
        }, 500);
    }
}

function loadInvoicesForSearch(holderId) {
    const city = getSelectedCityCode();
    if (!city || !holderId) {
        console.log('❌ loadInvoicesForSearch: No hay ciudad o holderId', { city, holderId });
        return;
    }
    
    const invoiceSelect = document.getElementById('searchInvoiceSelect');
    const invoiceSelectorGroup = document.getElementById('searchInvoiceSelectorGroup');
    
    if (!invoiceSelect || !invoiceSelectorGroup) {
        console.log('❌ loadInvoicesForSearch: No se encontraron elementos del selector');
        return;
    }
    
    console.log(`🔍 Buscando facturas para titular ${holderId} en ciudad ${city}`);
    
    try {
        // Buscar facturas del titular
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            console.log('❌ No hay facturas en localStorage');
            invoiceSelectorGroup.style.display = 'none';
            return;
        }
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        console.log(`📊 Total de facturas en ciudad ${city}:`, invoices.length);
        
        const facturasTitular = invoices.filter(inv => {
            const invClientId = inv.clientId || inv.identificacion || inv.titularId || inv.holderId || '';
            const match = String(invClientId).trim() === String(holderId).trim();
            if (match) {
                console.log('✅ Factura encontrada:', inv);
            }
            return match;
        });
        
        console.log(`📋 Facturas encontradas para titular ${holderId}:`, facturasTitular.length);
        
        // Limpiar selector
        invoiceSelect.innerHTML = '';
        
        if (facturasTitular.length > 1) {
            // Si hay más de una factura, mostrar el selector y hacerlo obligatorio
            console.log(`✅ Mostrando selector con ${facturasTitular.length} facturas`);
            invoiceSelect.innerHTML = '<option value="">-- Seleccione una factura * --</option>';
            facturasTitular.forEach(factura => {
                const invoiceNumber = factura.invoiceNumber || factura.numeroFactura || factura.numero || '';
                if (invoiceNumber) {
                    const option = document.createElement('option');
                    option.value = invoiceNumber;
                    option.textContent = `Factura #${invoiceNumber}`;
                    invoiceSelect.appendChild(option);
                }
            });
            invoiceSelect.required = true;
            invoiceSelectorGroup.style.display = 'block';
            // Actualizar el label para indicar que es obligatorio
            const label = invoiceSelectorGroup.querySelector('label');
            if (label) {
                label.innerHTML = 'Seleccionar Factura <span style="color: #dc2626;">*</span>';
            }
            const small = invoiceSelectorGroup.querySelector('small');
            if (small) {
                small.textContent = 'Este titular tiene varias facturas. Por favor seleccione la factura que desea consultar.';
                small.style.color = '#dc2626';
            }
        } else if (facturasTitular.length === 1) {
            // Si solo hay una factura, también mostrarla para que el usuario sepa cuál es
            console.log(`ℹ️ Solo hay 1 factura, mostrándola en el selector`);
            const factura = facturasTitular[0];
            const invoiceNumber = factura.invoiceNumber || factura.numeroFactura || factura.numero || '';
            if (invoiceNumber) {
                invoiceSelect.innerHTML = `<option value="${invoiceNumber}" selected>Factura #${invoiceNumber}</option>`;
                invoiceSelect.required = false;
                invoiceSelectorGroup.style.display = 'block';
                // Actualizar el label para indicar que es informativo
                const label = invoiceSelectorGroup.querySelector('label');
                if (label) {
                    label.innerHTML = 'Factura del Titular';
                }
                const small = invoiceSelectorGroup.querySelector('small');
                if (small) {
                    small.textContent = 'Este titular tiene una factura. Puede consultar el estado de cuenta de esta factura.';
                    small.style.color = '#6b7280';
                }
            } else {
                invoiceSelectorGroup.style.display = 'none';
            }
        } else {
            // Si no hay facturas, ocultar el selector
            console.log(`⚠️ No se encontraron facturas para este titular`);
            invoiceSelectorGroup.style.display = 'none';
        }
    } catch (e) {
        console.error('❌ Error cargando facturas para consulta:', e);
        invoiceSelectorGroup.style.display = 'none';
    }
}

function showReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        // Limpiar campos si no hay datos pre-cargados
        const reportHolderIdInput = document.getElementById('reportHolderId');
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const invoiceSelect = document.getElementById('reportInvoiceSelect');
        const invoiceSelectorGroup = document.getElementById('invoiceSelectorGroup');
        
        // Si no hay datos pre-cargados desde el modal de resultados, limpiar campos
        if (!window.__prefillReportData) {
            if (reportHolderIdInput) reportHolderIdInput.value = '';
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            if (invoiceSelect) {
                invoiceSelect.innerHTML = '<option value="">-- Seleccione una factura --</option>';
                invoiceSelect.value = '';
            }
            if (invoiceSelectorGroup) invoiceSelectorGroup.style.display = 'none';
        } else {
            // Pre-llenar con datos del modal de resultados
            if (reportHolderIdInput && window.__prefillReportData.holderId) {
                reportHolderIdInput.value = window.__prefillReportData.holderId;
                // Cargar facturas del titular
                loadInvoicesForReport(reportHolderIdInput.value.trim());
                
                // Guardar el valor de selectedInvoiceNumber antes de limpiar
                const selectedInvoiceNumber = window.__prefillReportData.selectedInvoiceNumber;
                
                // Limpiar el flag después de usar (antes del setTimeout)
                window.__prefillReportData = null;
                
                // Si hay una factura seleccionada previamente, seleccionarla
                if (selectedInvoiceNumber && invoiceSelect) {
                    setTimeout(() => {
                        invoiceSelect.value = selectedInvoiceNumber;
                    }, 100);
                }
            } else {
                // Limpiar el flag si no hay datos para pre-llenar
                window.__prefillReportData = null;
            }
        }
        
        // Agregar listener para cargar facturas cuando se ingrese la identificación
        if (reportHolderIdInput) {
            reportHolderIdInput.removeEventListener('blur', handleReportHolderIdBlur);
            reportHolderIdInput.removeEventListener('input', handleReportHolderIdInput);
            // Agregar listeners
            reportHolderIdInput.addEventListener('blur', handleReportHolderIdBlur);
            reportHolderIdInput.addEventListener('input', handleReportHolderIdInput);
        }
        
        modal.style.display = 'flex';
    }
}

function handleReportHolderIdBlur() {
    const reportHolderIdInput = document.getElementById('reportHolderId');
    if (reportHolderIdInput && reportHolderIdInput.value.trim()) {
        loadInvoicesForReport(reportHolderIdInput.value.trim());
    }
}

function handleReportHolderIdInput() {
    const reportHolderIdInput = document.getElementById('reportHolderId');
    if (reportHolderIdInput && reportHolderIdInput.value.trim().length >= 5) {
        // Cargar facturas después de un pequeño delay para evitar cargas innecesarias
        clearTimeout(window._reportInvoiceTimeout);
        window._reportInvoiceTimeout = setTimeout(() => {
            loadInvoicesForReport(reportHolderIdInput.value.trim());
        }, 500);
    }
}

function loadInvoicesForReport(holderId) {
    const city = getSelectedCityCode();
    if (!city || !holderId) {
        console.log('❌ loadInvoicesForReport: No hay ciudad o holderId', { city, holderId });
        return;
    }
    
    const invoiceSelect = document.getElementById('reportInvoiceSelect');
    const invoiceSelectorGroup = document.getElementById('invoiceSelectorGroup');
    
    if (!invoiceSelect || !invoiceSelectorGroup) {
        console.log('❌ loadInvoicesForReport: No se encontraron elementos del selector');
        return;
    }
    
    console.log(`🔍 Buscando facturas para reporte - titular ${holderId} en ciudad ${city}`);
    
    try {
        // Buscar facturas del titular
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            console.log('❌ No hay facturas en localStorage');
            invoiceSelectorGroup.style.display = 'none';
            return;
        }
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        console.log(`📊 Total de facturas en ciudad ${city}:`, invoices.length);
        
        const facturasTitular = invoices.filter(inv => {
            const invClientId = inv.clientId || inv.identificacion || inv.titularId || inv.holderId || '';
            const match = String(invClientId).trim() === String(holderId).trim();
            if (match) {
                console.log('✅ Factura encontrada:', inv);
            }
            return match;
        });
        
        console.log(`📋 Facturas encontradas para titular ${holderId}:`, facturasTitular.length);
        
        // Limpiar selector
        invoiceSelect.innerHTML = '<option value="">-- Seleccione una factura (opcional) --</option>';
        
        if (facturasTitular.length > 1) {
            // Si hay más de una factura, mostrar el selector
            console.log(`✅ Mostrando selector con ${facturasTitular.length} facturas`);
            facturasTitular.forEach(factura => {
                const invoiceNumber = factura.invoiceNumber || factura.numeroFactura || factura.numero || '';
                if (invoiceNumber) {
                    const option = document.createElement('option');
                    option.value = invoiceNumber;
                    option.textContent = `Factura #${invoiceNumber}`;
                    invoiceSelect.appendChild(option);
                }
            });
            invoiceSelectorGroup.style.display = 'block';
        } else if (facturasTitular.length === 1) {
            // Si solo hay una factura, también mostrarla para que el usuario sepa cuál es
            console.log(`ℹ️ Solo hay 1 factura, mostrándola en el selector`);
            const factura = facturasTitular[0];
            const invoiceNumber = factura.invoiceNumber || factura.numeroFactura || factura.numero || '';
            if (invoiceNumber) {
                const option = document.createElement('option');
                option.value = invoiceNumber;
                option.textContent = `Factura #${invoiceNumber}`;
                option.selected = true; // Seleccionarla por defecto
                invoiceSelect.appendChild(option);
                invoiceSelectorGroup.style.display = 'block';
            } else {
                invoiceSelectorGroup.style.display = 'none';
            }
        } else {
            // Si no hay facturas, ocultar el selector
            console.log(`⚠️ No se encontraron facturas para este titular`);
            invoiceSelectorGroup.style.display = 'none';
        }
    } catch (e) {
        console.error('❌ Error cargando facturas para reporte:', e);
        invoiceSelectorGroup.style.display = 'none';
    }
}

function hideReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'none';
        // Limpiar el flag de pre-llenado
        window.__prefillReportData = null;
    }
}

// ========================================
// FUNCIONES DE OPERACIONES
// ========================================

function consultAccountStatus() {
    const holderIdInput = document.getElementById('searchAccountHolderId');
    const invoiceSelect = document.getElementById('searchInvoiceSelect');
    const invoiceSelectorGroup = document.getElementById('searchInvoiceSelectorGroup');
    
    if (!holderIdInput || !holderIdInput.value || !holderIdInput.value.trim()) {
        showNotification('Por favor ingrese la identificación del titular', 'warning');
        return;
    }
    
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    const holderId = holderIdInput.value.trim();
    
    // Consultar todos los datos del cliente
    const accountData = consultAccountData(holderId, city);
    
    if (!accountData) {
        showNotification('No se encontraron datos para este titular', 'warning');
        return;
    }
    
    // Verificar si hay múltiples facturas y si se seleccionó una
    let selectedInvoiceNumber = null;
    if (invoiceSelectorGroup && invoiceSelectorGroup.style.display !== 'none') {
        selectedInvoiceNumber = invoiceSelect?.value?.trim() || null;
        
        // Si hay múltiples facturas, la selección es obligatoria
        if (accountData.facturas && accountData.facturas.length > 1 && !selectedInvoiceNumber) {
            showNotification('Por favor seleccione una factura para consultar', 'warning');
            if (invoiceSelect) {
                invoiceSelect.focus();
            }
            return;
        }
        
        // Si solo hay una factura pero no está seleccionada, seleccionarla automáticamente
        if (accountData.facturas && accountData.facturas.length === 1 && !selectedInvoiceNumber) {
            const primeraFactura = accountData.facturas[0];
            selectedInvoiceNumber = primeraFactura.invoiceNumber || primeraFactura.numeroFactura || primeraFactura.numero || null;
        }
    }
    
    // Guardar la factura seleccionada en los datos
    if (selectedInvoiceNumber) {
        accountData.selectedInvoiceNumber = selectedInvoiceNumber;
    }
    
    // Mostrar resultados en el modal
    showAccountStatusResults(accountData, city, selectedInvoiceNumber);
    
    hideSearchAccountModal();
}

function showAccountStatusResults(accountData, city, selectedInvoiceNumber = null) {
    // Guardar datos para el reporte si se necesita
    window.__currentAccountData = accountData;
    window.__currentCity = city;
    
    const titular = accountData.titular;
    const nombreCompleto = `${titular.nombre1 || ''} ${titular.nombre2 || ''} ${titular.apellido1 || ''} ${titular.apellido2 || ''}`.trim().toUpperCase();
    
    // Obtener factura seleccionada (si hay varias)
    let facturaSeleccionada = null;
    let contratoSeleccionado = null;
    
    if (selectedInvoiceNumber && accountData.facturas && Array.isArray(accountData.facturas)) {
        facturaSeleccionada = accountData.facturas.find(f => 
            String(f.invoiceNumber || f.numeroFactura || f.numero || '') === String(selectedInvoiceNumber)
        );
    }
    
    // Si no hay factura seleccionada o no se encontró, usar la primera
    if (!facturaSeleccionada) {
        facturaSeleccionada = accountData.primeraFactura;
    }
    
    // Buscar el contrato asociado a la factura seleccionada
    if (facturaSeleccionada) {
        const contractNumber = facturaSeleccionada.contractNumber || facturaSeleccionada.contrato || facturaSeleccionada.contractId || '';
        if (contractNumber && accountData.contratos && Array.isArray(accountData.contratos)) {
            contratoSeleccionado = accountData.contratos.find(c => 
                String(c.contractNumber || c.numero || c.numeroContrato || '') === String(contractNumber) ||
                String(c.id) === String(facturaSeleccionada.contractId)
            );
        }
    }
    
    // Si no se encontró contrato, usar el primer contrato
    if (!contratoSeleccionado) {
        contratoSeleccionado = accountData.primerContrato;
    }
    
    const numeroContrato = contratoSeleccionado ? (contratoSeleccionado.contractNumber || contratoSeleccionado.numeroContrato || contratoSeleccionado.numero || '') : '-';
    const numeroFactura = facturaSeleccionada ? (facturaSeleccionada.invoiceNumber || facturaSeleccionada.numeroFactura || facturaSeleccionada.numero || '') : '-';
    
    // Obtener fecha primer pago desde la factura (fecha establecida al crear la factura)
    let fechaPrimerPago = '';
    
    // Debug: mostrar campos de la factura
    if (facturaSeleccionada) {
        console.log('🔍 Factura seleccionada:', {
            invoiceNumber: facturaSeleccionada.invoiceNumber || facturaSeleccionada.numeroFactura,
            firstPaymentDate: facturaSeleccionada.firstPaymentDate,
            fechaPrimerPago: facturaSeleccionada.fechaPrimerPago,
            fechaInicial: facturaSeleccionada.fechaInicial,
            todosLosCampos: Object.keys(facturaSeleccionada)
        });
    }
    
    // 1. Buscar primero en la factura seleccionada (prioridad)
    if (facturaSeleccionada) {
        fechaPrimerPago = facturaSeleccionada.firstPaymentDate || 
                         facturaSeleccionada.fechaPrimerPago || 
                         facturaSeleccionada.fechaInicial ||
                         facturaSeleccionada.date || // También puede estar en date
                         '';
        
        console.log('📅 Fecha primer pago encontrada en factura:', fechaPrimerPago);
    }
    
    // 2. Si no está en la factura, buscar en el contrato como fallback
    if (!fechaPrimerPago && contratoSeleccionado) {
        fechaPrimerPago = contratoSeleccionado.firstPaymentDate || 
                          contratoSeleccionado.fechaPrimerPago || 
                          contratoSeleccionado.fechaInicial ||
                          '';
        
        // Si no está en el contrato, buscar en el planData del contrato
        if (!fechaPrimerPago && contratoSeleccionado.planData) {
            try {
                let planData = typeof contratoSeleccionado.planData === 'string' ? 
                              JSON.parse(contratoSeleccionado.planData) : 
                              contratoSeleccionado.planData;
                if (planData) {
                    fechaPrimerPago = planData.fechaInicial || 
                                    planData.fechaPrimerPago || 
                                    planData.firstPaymentDate || 
                                    '';
                }
            } catch (e) {
                console.error('Error parseando planData del contrato:', e);
            }
        }
        
        // Si aún no hay fecha, buscar en planes desde localStorage
        if (!fechaPrimerPago && contratoSeleccionado.planCode) {
            try {
                const planesDataRaw = localStorage.getItem('planesData');
                if (planesDataRaw) {
                    const planesData = JSON.parse(planesDataRaw);
                    const plan = planesData[contratoSeleccionado.planCode] || 
                                Object.values(planesData).find(p => 
                                    String(p.codigo || '').trim() === String(contratoSeleccionado.planCode).trim()
                                );
                    if (plan) {
                        fechaPrimerPago = plan.fechaInicial || 
                                        plan.fechaPrimerPago || 
                                        plan.firstPaymentDate || 
                                        '';
                    }
                }
            } catch (e) {
                console.error('Error obteniendo fecha desde planes:', e);
            }
        }
    }
    
    // Obtener número de cuotas del plan (necesario para formatCuota y fecha de vencimiento)
    let numCuotasTotal = 18; // Default
    
    // Buscar número de cuotas en el contrato
    if (contratoSeleccionado) {
        if (contratoSeleccionado.planData) {
            try {
                let planData = typeof contratoSeleccionado.planData === 'string' ? 
                              JSON.parse(contratoSeleccionado.planData) : 
                              contratoSeleccionado.planData;
                if (planData) {
                    numCuotasTotal = Number(planData.numCuotas || planData.numeroCuotas || planData.cuotas || planData.totalCuotas || 18) || 18;
                }
            } catch (e) {
                console.error('Error parseando planData para cuotas:', e);
            }
        }
        
        // Si no está en planData, buscar en planes desde localStorage
        if (numCuotasTotal === 18 && contratoSeleccionado.planCode) {
            try {
                const planesDataRaw = localStorage.getItem('planesData');
                if (planesDataRaw) {
                    const planesData = JSON.parse(planesDataRaw);
                    const plan = planesData[contratoSeleccionado.planCode] || 
                                Object.values(planesData).find(p => 
                                    String(p.codigo || '').trim() === String(contratoSeleccionado.planCode).trim()
                                );
                    if (plan) {
                        numCuotasTotal = Number(plan.numCuotas || plan.numeroCuotas || plan.cuotas || plan.totalCuotas || 18) || 18;
                    }
                }
            } catch (e) {
                console.error('Error obteniendo cuotas desde planes:', e);
            }
        }
    }
    
    // Calcular fecha de vencimiento del plan (fecha primer pago + número de cuotas - 1 meses)
    let fechaVencimiento = '';
    if (fechaPrimerPago) {
        try {
            
            // Calcular fecha de vencimiento (fecha primer pago + número de cuotas - 1 meses)
            const fechaPrimerPagoDate = new Date(fechaPrimerPago);
            if (!isNaN(fechaPrimerPagoDate.getTime())) {
                fechaPrimerPagoDate.setMonth(fechaPrimerPagoDate.getMonth() + (numCuotasTotal - 1));
                fechaVencimiento = fechaPrimerPagoDate.toISOString().split('T')[0];
            }
        } catch (e) {
            console.error('Error calculando fecha de vencimiento:', e);
        }
    }
    
    // Guardar numCuotasTotal para usar en formatCuota
    window.__currentNumCuotasTotal = numCuotasTotal || 18;
    
    // Debug: mostrar en consola las fechas encontradas
    console.log('📅 Fechas encontradas:', {
        fechaPrimerPago,
        fechaVencimiento,
        contrato: contratoSeleccionado ? (contratoSeleccionado.contractNumber || contratoSeleccionado.numeroContrato) : null,
        factura: facturaSeleccionada ? (facturaSeleccionada.invoiceNumber || facturaSeleccionada.numeroFactura) : null
    });
    
    // Debug: mostrar fechas que se van a mostrar
    console.log('📊 [CONSULTA] Fechas que se van a mostrar:', {
        fechaPrimerPago,
        fechaVencimiento,
        fechaPrimerPagoFormateada: fechaPrimerPago ? formatDateForTable(fechaPrimerPago) : '-',
        fechaVencimientoFormateada: fechaVencimiento ? formatDateForTable(fechaVencimiento) : '-'
    });
    
    // Guardar las fechas calculadas en accountData para que el reporte las use
    if (accountData) {
        accountData.calculatedFirstPaymentDate = fechaPrimerPago;
        accountData.calculatedDueDate = fechaVencimiento;
    }
    
    // Actualizar información del titular
    document.getElementById('resultsHolderId').textContent = accountData.holderId || '-';
    document.getElementById('resultsHolderName').textContent = nombreCompleto || '-';
    document.getElementById('resultsContract').textContent = numeroContrato;
    document.getElementById('resultsInvoice').textContent = numeroFactura;
    document.getElementById('resultsFirstPaymentDate').textContent = fechaPrimerPago ? formatDateForTable(fechaPrimerPago) : '-';
    document.getElementById('resultsDueDate').textContent = fechaVencimiento ? formatDateForTable(fechaVencimiento) : '-';
    
    // Calcular totales (filtrar por factura seleccionada si hay una)
    let facturasParaCalcular = accountData.facturas || [];
    let notasDebitoParaCalcular = accountData.notasDebito || [];
    let notasCreditoParaCalcular = accountData.notasCredito || [];
    
    if (selectedInvoiceNumber && facturaSeleccionada) {
        const invoiceNum = String(selectedInvoiceNumber).trim();
        facturasParaCalcular = facturasParaCalcular.filter(f => {
            const fInvoiceNum = String(f.invoiceNumber || f.numeroFactura || f.numero || '').trim();
            return fInvoiceNum === invoiceNum || 
                   fInvoiceNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
        });
        notasDebitoParaCalcular = notasDebitoParaCalcular.filter(n => {
            const nInvoiceNum = String(n.invoiceNumber || n.factura || '').trim();
            return nInvoiceNum === invoiceNum || 
                   nInvoiceNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
        });
        notasCreditoParaCalcular = notasCreditoParaCalcular.filter(n => {
            const nInvoiceNum = String(n.invoiceNumber || n.factura || '').trim();
            return nInvoiceNum === invoiceNum || 
                   nInvoiceNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
        });
    }
    
    const valorFactura = facturasParaCalcular.reduce((sum, f) => sum + (parseFloat(f.totalValue || f.valor || f.value || 0) || 0), 0);
    const notasDebito = notasDebitoParaCalcular.reduce((sum, n) => sum + (parseFloat(n.valorNota || n.valor || 0) || 0), 0);
    const notasCredito = notasCreditoParaCalcular.reduce((sum, n) => sum + (parseFloat(n.valor || 0) || 0), 0);
    
    // Filtrar ingresos por factura seleccionada si hay una
    let ingresosCajaFiltrados = accountData.ingresosCaja || [];
    let ingresosBancosFiltrados = accountData.ingresosBancos || [];
    
    if (selectedInvoiceNumber && facturaSeleccionada) {
        const invoiceNum = String(selectedInvoiceNumber).trim();
        ingresosCajaFiltrados = ingresosCajaFiltrados.filter(ing => {
            const ingInvoiceNum = String(ing.invoiceNumber || '').trim();
            return ingInvoiceNum === invoiceNum || 
                   ingInvoiceNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
        });
        
        ingresosBancosFiltrados = ingresosBancosFiltrados.filter(ing => {
            try {
                if (!ing.cashInflowData) return false;
                const cashInflow = JSON.parse(ing.cashInflowData);
                const cashInvoiceNum = String(cashInflow.invoiceNumber || '').trim();
                return cashInvoiceNum === invoiceNum || 
                       cashInvoiceNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
            } catch (e) {
                return false;
            }
        });
    }
    
    // Combinar todos los ingresos (usando la misma lógica que el reporte)
    let allIngresos = [];
    // Usar numCuotasTotal ya calculado (se guardó en window.__currentNumCuotasTotal)
    const numCuotasParaIngresos = window.__currentNumCuotasTotal || numCuotasTotal || 18;
    
    // Procesar ingresos a caja
    if (ingresosCajaFiltrados && Array.isArray(ingresosCajaFiltrados)) {
        ingresosCajaFiltrados.forEach(ing => {
            const tipoIngreso = ing.tipoIngresoCodigo || '';
            const category = getIncomeTypeCategory(tipoIngreso);
            
            // Buscar recibo en múltiples lugares para ingresos a caja
            const letraReciboCaja = ing.letraRecibo || 'O';
            const reciboOficialCaja = ing.reciboOficial || ing.recibo || '';
            
            // Si tiene detalleCuotas, crear una fila por cada cuota
            if (ing.detalleCuotas && Array.isArray(ing.detalleCuotas) && ing.detalleCuotas.length > 0) {
                ing.detalleCuotas.forEach((detalle, index) => {
                    allIngresos.push({
                        tipo: category || tipoIngreso || 'CR',
                        numero: ing.numero || '',
                        cliente: accountData.holderId || '',
                        fecha: ing.date || ing.fecha || '',
                        cuota: formatCuota(detalle.cuota, category, numCuotasParaIngresos),
                        recibo: formatRecibo(letraReciboCaja, reciboOficialCaja),
                        fp: 'EF',
                        valorCobrado: detalle.valorPagar || (index === 0 ? ing.valor : 0),
                        descuentos: 0
                    });
                });
            } else {
                // Si no tiene detalleCuotas, procesar el campo cuota normal
                const cuotaStr = String(ing.cuota || '').trim();
                if (cuotaStr && cuotaStr.includes(',')) {
                    // Si hay múltiples cuotas separadas por comas, crear una fila por cada una
                    const cuotasArray = cuotaStr.split(',').map(c => c.trim()).filter(c => c);
                    const valorPorCuota = cuotasArray.length > 0 ? (ing.valor || 0) / cuotasArray.length : ing.valor || 0;
                    cuotasArray.forEach(cuotaNum => {
                        allIngresos.push({
                            tipo: category || tipoIngreso || 'CR',
                            numero: ing.numero || '',
                            cliente: accountData.holderId || '',
                            fecha: ing.date || ing.fecha || '',
                            cuota: formatCuota(cuotaNum, category, numCuotasParaIngresos),
                            recibo: formatRecibo(letraReciboCaja, reciboOficialCaja),
                            fp: 'EF',
                            valorCobrado: valorPorCuota,
                            descuentos: 0
                        });
                    });
                } else {
                    // Una sola cuota
                    allIngresos.push({
                        tipo: category || tipoIngreso || 'CR',
                        numero: ing.numero || '',
                        cliente: accountData.holderId || '',
                        fecha: ing.date || ing.fecha || '',
                        cuota: formatCuota(ing.cuota, category, numCuotasParaIngresos),
                        recibo: formatRecibo(letraReciboCaja, reciboOficialCaja),
                        fp: 'EF',
                        valorCobrado: ing.valor || 0,
                        descuentos: 0
                    });
                }
            }
        });
    }
    
    // Procesar ingresos a bancos
    if (ingresosBancosFiltrados && Array.isArray(ingresosBancosFiltrados)) {
        ingresosBancosFiltrados.forEach(ing => {
            try {
                if (!ing.cashInflowData) return;
                const cashInflow = JSON.parse(ing.cashInflowData);
                const tipoIngreso = cashInflow.tipoIngresoCodigo || '';
                const category = getIncomeTypeCategory(tipoIngreso);
                
                    // Si tiene detalleCuotas, crear una fila por cada cuota
                    // Buscar recibo en múltiples lugares
                    const letraReciboDetalle = cashInflow.letraRecibo || ing.letraRecibo || 'O';
                    const reciboOficialDetalle = cashInflow.reciboOficial || ing.reciboOficial || cashInflow.recibo || ing.recibo || '';
                    
                    if (cashInflow.detalleCuotas && Array.isArray(cashInflow.detalleCuotas) && cashInflow.detalleCuotas.length > 0) {
                        cashInflow.detalleCuotas.forEach((detalle, index) => {
                            allIngresos.push({
                                tipo: category || tipoIngreso || 'CR',
                                numero: ing.numero || cashInflow.numero || '',
                                cliente: accountData.holderId || '',
                                fecha: ing.fechaDocumento || ing.fechaHoy || cashInflow.date || cashInflow.fecha || '',
                                cuota: formatCuota(detalle.cuota, category, numCuotasParaIngresos),
                                recibo: formatRecibo(letraReciboDetalle, reciboOficialDetalle),
                                fp: 'EF',
                                valorCobrado: detalle.valorPagar || (index === 0 ? (ing.valor || cashInflow.valor || 0) : 0),
                                descuentos: 0
                            });
                        });
                } else {
                    // Si no tiene detalleCuotas, procesar el campo cuota normal
                    const cuotaStr = String(cashInflow.cuota || '').trim();
                    // Buscar recibo en múltiples lugares
                    const letraReciboBanco = cashInflow.letraRecibo || ing.letraRecibo || 'O';
                    const reciboOficialBanco = cashInflow.reciboOficial || ing.reciboOficial || cashInflow.recibo || ing.recibo || '';
                    
                    if (cuotaStr && cuotaStr.includes(',')) {
                        // Si hay múltiples cuotas separadas por comas, crear una fila por cada una
                        const cuotasArray = cuotaStr.split(',').map(c => c.trim()).filter(c => c);
                        const valorPorCuota = cuotasArray.length > 0 ? (ing.valor || cashInflow.valor || 0) / cuotasArray.length : (ing.valor || cashInflow.valor || 0);
                        cuotasArray.forEach(cuotaNum => {
                            allIngresos.push({
                                tipo: category || tipoIngreso || 'CR',
                                numero: ing.numero || cashInflow.numero || '',
                                cliente: accountData.holderId || '',
                                fecha: ing.fechaDocumento || ing.fechaHoy || cashInflow.date || cashInflow.fecha || '',
                                cuota: formatCuota(cuotaNum, category, numCuotasParaIngresos),
                                recibo: formatRecibo(letraReciboBanco, reciboOficialBanco),
                                fp: 'EF',
                                valorCobrado: valorPorCuota,
                                descuentos: 0
                            });
                        });
                    } else {
                        // Una sola cuota
                        // Buscar recibo en múltiples lugares
                        const letraRecibo = cashInflow.letraRecibo || ing.letraRecibo || 'O';
                        const reciboOficial = cashInflow.reciboOficial || ing.reciboOficial || cashInflow.recibo || ing.recibo || '';
                        
                        allIngresos.push({
                            tipo: category || tipoIngreso || 'CR',
                            numero: ing.numero || cashInflow.numero || '',
                            cliente: accountData.holderId || '',
                            fecha: ing.fechaDocumento || ing.fechaHoy || cashInflow.date || cashInflow.fecha || '',
                            cuota: formatCuota(cashInflow.cuota, category, numCuotasParaIngresos),
                            recibo: formatRecibo(letraRecibo, reciboOficial),
                            fp: 'EF',
                            valorCobrado: ing.valor || cashInflow.valor || 0,
                            descuentos: 0
                        });
                    }
                }
            } catch (e) {
                console.error('Error procesando ingreso a banco:', e);
            }
        });
    }
    
    // Consolidar cuotas duplicadas: agrupar por cuota y sumar valores (igual que en el reporte)
    const cuotasConsolidadas = {};
    
    allIngresos.forEach(ingreso => {
        // Extraer el número de cuota de "X/Y" (ej: "1/18" -> 1)
        const cuotaMatch = String(ingreso.cuota || '').match(/^(\d+)\//);
        if (!cuotaMatch) {
            // Si no tiene formato válido, agregarlo directamente sin consolidar
            if (!cuotasConsolidadas['sin-cuota']) {
                cuotasConsolidadas['sin-cuota'] = [];
            }
            cuotasConsolidadas['sin-cuota'].push(ingreso);
            return;
        }
        
        const numeroCuota = parseInt(cuotaMatch[1], 10);
        const cuotaKey = ingreso.cuota; // Usar "X/Y" como clave
        
        if (!cuotasConsolidadas[cuotaKey]) {
            // Primera vez que vemos esta cuota
            cuotasConsolidadas[cuotaKey] = {
                tipo: ingreso.tipo,
                numero: ingreso.numero,
                cliente: ingreso.cliente,
                fecha: ingreso.fecha,
                cuota: ingreso.cuota,
                numeroCuota: numeroCuota, // Guardar número para ordenar
                recibo: ingreso.recibo,
                fp: ingreso.fp,
                valorCobrado: parseFloat(ingreso.valorCobrado || 0),
                descuentos: parseFloat(ingreso.descuentos || 0)
            };
        } else {
            // Ya existe esta cuota, sumar valores
            cuotasConsolidadas[cuotaKey].valorCobrado += parseFloat(ingreso.valorCobrado || 0);
            cuotasConsolidadas[cuotaKey].descuentos += parseFloat(ingreso.descuentos || 0);
            
            // Priorizar recibo con número oficial (tiene espacio, ej: "O 12345")
            const reciboActual = cuotasConsolidadas[cuotaKey].recibo || '';
            const reciboNuevo = ingreso.recibo || '';
            const tieneReciboOficialActual = reciboActual.includes(' ') && reciboActual.trim().length > 1;
            const tieneReciboOficialNuevo = reciboNuevo.includes(' ') && reciboNuevo.trim().length > 1;
            
            // Si el nuevo tiene recibo oficial y el actual no, usar el nuevo
            if (tieneReciboOficialNuevo && !tieneReciboOficialActual) {
                cuotasConsolidadas[cuotaKey].recibo = reciboNuevo;
                cuotasConsolidadas[cuotaKey].fecha = ingreso.fecha;
                cuotasConsolidadas[cuotaKey].numero = ingreso.numero;
            }
            // Si ambos tienen recibo oficial o ninguno, mantener la fecha más reciente
            else {
                const fechaActual = new Date(cuotasConsolidadas[cuotaKey].fecha);
                const fechaNueva = new Date(ingreso.fecha);
                if (fechaNueva > fechaActual) {
                    cuotasConsolidadas[cuotaKey].fecha = ingreso.fecha;
                    cuotasConsolidadas[cuotaKey].recibo = ingreso.recibo;
                    cuotasConsolidadas[cuotaKey].numero = ingreso.numero;
                } else if (fechaNueva.getTime() === fechaActual.getTime()) {
                    // Si tienen la misma fecha, preferir el que tenga recibo oficial
                    if (tieneReciboOficialNuevo && !tieneReciboOficialActual) {
                        cuotasConsolidadas[cuotaKey].recibo = reciboNuevo;
                    } else if (!tieneReciboOficialNuevo && tieneReciboOficialActual) {
                        // Mantener el actual que tiene recibo oficial
                    } else if (reciboNuevo && reciboNuevo.trim() && (!reciboActual || !reciboActual.trim())) {
                        // Si el nuevo tiene recibo y el actual no, usar el nuevo
                        cuotasConsolidadas[cuotaKey].recibo = reciboNuevo;
                    }
                }
            }
        }
    });
    
    // Convertir objeto a array y ordenar por número de cuota (1, 2, 3, 4...)
    let ingresosConsolidados = Object.values(cuotasConsolidadas);
    
    // Agregar ingresos sin cuota al final
    if (cuotasConsolidadas['sin-cuota']) {
        ingresosConsolidados = ingresosConsolidados.concat(cuotasConsolidadas['sin-cuota']);
    }
    
    // Ordenar: primero por número de cuota, luego por fecha
    ingresosConsolidados.sort((a, b) => {
        if (a.numeroCuota !== undefined && b.numeroCuota !== undefined) {
            return a.numeroCuota - b.numeroCuota;
        }
        if (a.numeroCuota !== undefined) return -1;
        if (b.numeroCuota !== undefined) return 1;
        // Si ninguno tiene número de cuota, ordenar por fecha
        const dateA = new Date(a.fecha);
        const dateB = new Date(b.fecha);
        return dateA - dateB;
    });
    
    allIngresos = ingresosConsolidados;
    
    const valorAbonos = allIngresos.reduce((sum, ing) => sum + (ing.valorCobrado || 0), 0);
    const totalDeuda = valorFactura + notasDebito - notasCredito - valorAbonos;
    
    // Actualizar resumen
    document.getElementById('resultsValorFactura').textContent = formatCurrency(valorFactura);
    document.getElementById('resultsNotasDebito').textContent = formatCurrency(notasDebito);
    document.getElementById('resultsNotasCredito').textContent = formatCurrency(notasCredito);
    document.getElementById('resultsValorAbonos').textContent = formatCurrency(valorAbonos);
    document.getElementById('resultsTotalDeuda').textContent = formatCurrency(totalDeuda);
    
    // Mostrar tabla de ingresos
    const tableBody = document.getElementById('accountStatusResultsTableBody');
    if (tableBody) {
        if (allIngresos.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-file-invoice"></i>
                            <p>No existen movimientos para este titular</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = allIngresos.map(ing => {
                return `
                    <tr>
                        <td>${ing.tipo || ''}</td>
                        <td>${ing.numero || ''}</td>
                        <td>${ing.cliente || ''}</td>
                        <td>${formatDateForTable(ing.fecha)}</td>
                        <td>${ing.cuota || ''}</td>
                        <td>${ing.recibo || ''}</td>
                        <td>${ing.fp || ''}</td>
                        <td>${formatCurrency(ing.valorCobrado || 0)}</td>
                    </tr>
                `;
            }).join('');
        }
    }
    
    // Mostrar modal
    showAccountStatusResultsModal();
}

function showAccountStatusResultsModal() {
    const modal = document.getElementById('accountStatusResultsModal');
    if (modal) modal.style.display = 'flex';
}

function hideAccountStatusResultsModal() {
    const modal = document.getElementById('accountStatusResultsModal');
    if (modal) modal.style.display = 'none';
    
    // Limpiar información del titular y mostrar mensaje inicial si no hay datos
    const holderInfoCard = document.getElementById('holderInfoCard');
    const summaryCards = document.getElementById('summaryCards');
    const accountStatusTable = document.getElementById('accountStatusTable');
    const searchPrompt = document.getElementById('searchPrompt');
    
    if (holderInfoCard) holderInfoCard.style.display = 'none';
    if (summaryCards) summaryCards.style.display = 'none';
    if (accountStatusTable) accountStatusTable.style.display = 'none';
    if (searchPrompt) searchPrompt.style.display = 'block';
    
    // Limpiar nombre del titular
    const holderNameDisplay = document.getElementById('holderNameDisplay');
    if (holderNameDisplay) holderNameDisplay.textContent = '-';
}

function getIncomeTypeCategory(tipoIngresoCodigo) {
    if (!tipoIngresoCodigo) return null;
    const codigo = String(tipoIngresoCodigo).toUpperCase().trim();
    if (codigo.includes('CI') || codigo === 'CI') return 'CI';
    if (codigo.includes('CR') || codigo === 'CR') return 'CR';
    return 'CR';
}

function formatCuota(cuota, category, numCuotasTotal = null) {
    if (category === 'CI') return '';
    if (!cuota && cuota !== 0) return '';
    
    // Si es un número, usarlo directamente
    const cuotaNum = typeof cuota === 'number' ? cuota : parseInt(String(cuota).trim()) || 0;
    if (cuotaNum <= 0) return '';
    
    const total = numCuotasTotal || 18;
    return `${cuotaNum}/${total}`;
}

function formatRecibo(letraRecibo, reciboOficial) {
    const letra = (letraRecibo && String(letraRecibo).trim()) || 'O';
    const numero = (reciboOficial && String(reciboOficial).trim()) || '';
    
    // Debug: ver qué valores se están recibiendo
    if (!numero && letra === 'O') {
        console.log('⚠️ [RECIBO] Sin número oficial:', { letraRecibo, reciboOficial });
    }
    
    // Si hay número, combinar letra + número
    if (numero) {
        return `${letra} ${numero}`.trim();
    }
    
    // Si solo hay letra, retornar la letra
    return letra;
}

function formatDateForTable(dateStr) {
    if (!dateStr) return '';
    try {
        // Si es formato YYYY-MM-DD, parsear manualmente para evitar problemas de zona horaria
        const str = String(dateStr).trim();
        
        // Verificar si es formato YYYY-MM-DD (puede tener espacios o caracteres adicionales)
        const yyyyMMddMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (yyyyMMddMatch) {
            const [, y, m, d] = yyyyMMddMatch;
            const formatted = `${d}/${m}/${y}`;
            console.log('📅 [CONSULTA] Formateando fecha YYYY-MM-DD:', { original: str, formateada: formatted });
            return formatted;
        }
        
        // Para otros formatos, usar new Date
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return dateStr;
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formatted = `${day}/${month}/${year}`;
        console.log('📅 [CONSULTA] Formateando fecha con new Date:', { original: str, formateada: formatted });
        return formatted;
    } catch (e) {
        console.error('Error formateando fecha:', e, dateStr);
        return dateStr;
    }
}

function calculateValorFactura(accountData) {
    if (!accountData.facturas || !Array.isArray(accountData.facturas)) return 0;
    return accountData.facturas.reduce((sum, factura) => {
        return sum + (parseFloat(factura.totalValue || factura.valor || factura.value || 0) || 0);
    }, 0);
}

function calculateNotasDebito(accountData) {
    if (!accountData.notasDebito || !Array.isArray(accountData.notasDebito)) return 0;
    return accountData.notasDebito.reduce((sum, nota) => {
        return sum + (parseFloat(nota.valorNota || nota.valor || 0) || 0);
    }, 0);
}

function calculateNotasCredito(accountData) {
    if (!accountData.notasCredito || !Array.isArray(accountData.notasCredito)) return 0;
    return accountData.notasCredito.reduce((sum, nota) => {
        return sum + (parseFloat(nota.valor || 0) || 0);
    }, 0);
}

function displayAccountStatus(data) {
    // Ocultar mensaje inicial
    const searchPrompt = document.getElementById('searchPrompt');
    if (searchPrompt) {
        searchPrompt.style.display = 'none';
    }
    
    // Mostrar información del titular
    const holderInfoCard = document.getElementById('holderInfoCard');
    if (holderInfoCard) {
        holderInfoCard.style.display = 'block';
        document.getElementById('holderIdDisplay').textContent = data.holderId || '-';
        document.getElementById('holderNameDisplay').textContent = data.holderName || '-';
        document.getElementById('totalBalanceDisplay').textContent = formatCurrency(data.totalBalance || 0);
    }
    
    // Mostrar resumen
    const summaryCards = document.getElementById('summaryCards');
    if (summaryCards) {
        summaryCards.style.display = 'grid';
        document.getElementById('totalInvoices').textContent = data.totalInvoices || 0;
        document.getElementById('totalNotes').textContent = data.totalNotes || 0;
        document.getElementById('pendingBalance').textContent = formatCurrency(data.pendingBalance || 0);
    }
    
    // Mostrar tabla de movimientos
    const accountStatusTable = document.getElementById('accountStatusTable');
    if (accountStatusTable) {
        accountStatusTable.style.display = 'block';
        displayMovements(data.movements || []);
    }
}

function displayMovements(movements) {
    const tableBody = document.getElementById('movementsTableBody');
    if (!tableBody) return;
    
    if (movements.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-file-invoice"></i>
                        <p>No existen movimientos para este titular</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let balance = 0;
    tableBody.innerHTML = movements.map(movement => {
        if (movement.type === 'DEBITO') {
            balance += movement.amount;
        } else {
            balance -= movement.amount;
        }
        
        return `
            <tr>
                <td>${formatDate(movement.date)}</td>
                <td>${movement.type}</td>
                <td>${movement.number}</td>
                <td>${movement.description}</td>
                <td class="${movement.type === 'DEBITO' ? 'debit' : ''}">${movement.type === 'DEBITO' ? formatCurrency(movement.amount) : '-'}</td>
                <td class="${movement.type === 'CREDITO' ? 'credit' : ''}">${movement.type === 'CREDITO' ? formatCurrency(movement.amount) : '-'}</td>
                <td class="balance">${formatCurrency(balance)}</td>
            </tr>
        `;
    }).join('');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO');
}

function generateReport() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    const reportHolderId = document.getElementById('reportHolderId')?.value?.trim() || '';
    const selectedInvoiceNumber = document.getElementById('reportInvoiceSelect')?.value?.trim() || null;
    
    if (!startDate || !endDate) {
        showNotification('Por favor complete ambas fechas', 'warning');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showNotification('La fecha de inicio no puede ser mayor a la fecha de fin', 'error');
        return;
    }
    
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    if (!reportHolderId) {
        showNotification('Por favor ingrese la identificación del titular', 'warning');
        return;
    }
    
    // Si hay datos de la consulta actual con fechas calculadas, usarlos directamente
    let accountData = null;
    if (window.__currentAccountData && 
        window.__currentAccountData.holderId === reportHolderId &&
        window.__currentAccountData.calculatedFirstPaymentDate) {
        // Usar los datos de la consulta que ya tienen las fechas calculadas
        accountData = window.__currentAccountData;
        console.log('✅ [REPORTE] Usando datos de la consulta con fechas calculadas:', {
            fechaPrimerPago: accountData.calculatedFirstPaymentDate,
            fechaVencimiento: accountData.calculatedDueDate
        });
    } else {
        // Consultar datos del cliente
        accountData = consultAccountData(reportHolderId, city, startDate, endDate);
        
        if (!accountData) {
            showNotification('No se encontraron datos para este titular', 'warning');
            return;
        }
        
        // Calcular fechas de la misma manera que en showAccountStatusResults
        // para que el reporte muestre las mismas fechas
        let facturaSeleccionada = null;
        let contratoSeleccionado = null;
        
        if (selectedInvoiceNumber && accountData.facturas && Array.isArray(accountData.facturas)) {
            facturaSeleccionada = accountData.facturas.find(f => 
                String(f.invoiceNumber || f.numeroFactura || f.numero || '') === String(selectedInvoiceNumber)
            );
        }
        
        if (!facturaSeleccionada) {
            facturaSeleccionada = accountData.primeraFactura;
        }
        
        if (facturaSeleccionada) {
            const contractNumber = facturaSeleccionada.contractNumber || facturaSeleccionada.contrato || facturaSeleccionada.contractId || '';
            if (contractNumber && accountData.contratos && Array.isArray(accountData.contratos)) {
                contratoSeleccionado = accountData.contratos.find(c => 
                    String(c.contractNumber || c.numero || c.numeroContrato || '') === String(contractNumber) ||
                    String(c.id) === String(facturaSeleccionada.contractId)
                );
            }
        }
        
        if (!contratoSeleccionado) {
            contratoSeleccionado = accountData.primerContrato;
        }
        
        // Calcular fechas usando la misma lógica que en showAccountStatusResults
        let fechaPrimerPago = '';
        if (facturaSeleccionada) {
            fechaPrimerPago = facturaSeleccionada.firstPaymentDate || 
                             facturaSeleccionada.fechaPrimerPago || 
                             facturaSeleccionada.fechaInicial ||
                             facturaSeleccionada.date || '';
        }
        
        if (!fechaPrimerPago && contratoSeleccionado) {
            fechaPrimerPago = contratoSeleccionado.firstPaymentDate || 
                              contratoSeleccionado.fechaPrimerPago || 
                              contratoSeleccionado.fechaInicial || '';
            
            if (!fechaPrimerPago && contratoSeleccionado.planData) {
                try {
                    let planData = typeof contratoSeleccionado.planData === 'string' ? 
                                  JSON.parse(contratoSeleccionado.planData) : 
                                  contratoSeleccionado.planData;
                    if (planData) {
                        fechaPrimerPago = planData.fechaInicial || 
                                        planData.fechaPrimerPago || 
                                        planData.firstPaymentDate || '';
                    }
                } catch (e) {
                    console.error('Error parseando planData del contrato:', e);
                }
            }
            
            if (!fechaPrimerPago && contratoSeleccionado.planCode) {
                try {
                    const planesDataRaw = localStorage.getItem('planesData');
                    if (planesDataRaw) {
                        const planesData = JSON.parse(planesDataRaw);
                        const plan = planesData[contratoSeleccionado.planCode] || 
                                    Object.values(planesData).find(p => 
                                        String(p.codigo || '').trim() === String(contratoSeleccionado.planCode).trim()
                                    );
                        if (plan) {
                            fechaPrimerPago = plan.fechaInicial || 
                                            plan.fechaPrimerPago || 
                                            plan.firstPaymentDate || '';
                        }
                    }
                } catch (e) {
                    console.error('Error obteniendo fecha desde planes:', e);
                }
            }
        }
        
        let fechaVencimiento = '';
        if (fechaPrimerPago) {
            try {
                let numCuotasTotal = 18;
                if (contratoSeleccionado) {
                    if (contratoSeleccionado.planData) {
                        try {
                            let planData = typeof contratoSeleccionado.planData === 'string' ? 
                                          JSON.parse(contratoSeleccionado.planData) : 
                                          contratoSeleccionado.planData;
                            if (planData) {
                                numCuotasTotal = Number(planData.numCuotas || planData.numeroCuotas || planData.cuotas || planData.totalCuotas || 18) || 18;
                            }
                        } catch (e) {
                            console.error('Error parseando planData para cuotas:', e);
                        }
                    }
                    
                    if (numCuotasTotal === 18 && contratoSeleccionado.planCode) {
                        try {
                            const planesDataRaw = localStorage.getItem('planesData');
                            if (planesDataRaw) {
                                const planesData = JSON.parse(planesDataRaw);
                                const plan = planesData[contratoSeleccionado.planCode] || 
                                            Object.values(planesData).find(p => 
                                                String(p.codigo || '').trim() === String(contratoSeleccionado.planCode).trim()
                                            );
                                if (plan) {
                                    numCuotasTotal = Number(plan.numCuotas || plan.numeroCuotas || plan.cuotas || plan.totalCuotas || 18) || 18;
                                }
                            }
                        } catch (e) {
                            console.error('Error obteniendo cuotas desde planes:', e);
                        }
                    }
                }
                
                const fechaPrimerPagoDate = new Date(fechaPrimerPago);
                if (!isNaN(fechaPrimerPagoDate.getTime())) {
                    fechaPrimerPagoDate.setMonth(fechaPrimerPagoDate.getMonth() + (numCuotasTotal - 1));
                    fechaVencimiento = fechaPrimerPagoDate.toISOString().split('T')[0];
                }
            } catch (e) {
                console.error('Error calculando fecha de vencimiento:', e);
            }
        }
        
        // Guardar las fechas calculadas en accountData para que el reporte las use
        if (accountData) {
            accountData.calculatedFirstPaymentDate = fechaPrimerPago;
            accountData.calculatedDueDate = fechaVencimiento;
        }
    }
    
    // Generar el reporte con la factura seleccionada
    generateAccountStatusReport(accountData, city, startDate, endDate, selectedInvoiceNumber);
    
    hideReportModal();
}

// ========================================
// FUNCIONES DE CONSULTA DE DATOS
// ========================================

function consultAccountData(holderId, city, startDate = null, endDate = null) {
    try {
        // Buscar titular
        const titularesByCityRaw = localStorage.getItem('titularesByCity');
        if (!titularesByCityRaw) {
            console.error('No se encontraron titulares');
            return null;
        }
        
        const titularesByCity = JSON.parse(titularesByCityRaw);
        const titular = titularesByCity[city] && titularesByCity[city][holderId];
        
        if (!titular) {
            console.error('Titular no encontrado:', holderId);
            return null;
        }
        
        // Buscar contratos del titular
        const contratosRaw = localStorage.getItem(`contratos_${city}`);
        const contratos = contratosRaw ? JSON.parse(contratosRaw) : [];
        const contratosArray = Array.isArray(contratos) ? contratos : Object.values(contratos);
        const contratosTitular = contratosArray.filter(c => {
            const clientId = c.clientId || c.identificacion || c.titularId || c.holderId || '';
            return String(clientId).trim() === String(holderId).trim();
        });
        
        // Buscar facturas del titular
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        const invoicesByCity = invoicesRaw ? JSON.parse(invoicesRaw) : {};
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        const facturasTitular = invoices.filter(inv => {
            const invClientId = inv.clientId || inv.identificacion || inv.titularId || inv.holderId || '';
            return String(invClientId).trim() === String(holderId).trim();
        });
        
        // Buscar ingresos a caja
        const ingresosCajaRaw = localStorage.getItem(`ingresosCaja_${city}`);
        const ingresosCaja = ingresosCajaRaw ? JSON.parse(ingresosCajaRaw) : [];
        const ingresosCajaArray = Array.isArray(ingresosCaja) ? ingresosCaja : Object.values(ingresosCaja);
        let ingresosCajaTitular = ingresosCajaArray.filter(ing => {
            const ingHolderId = ing.holderId || '';
            return String(ingHolderId).trim() === String(holderId).trim();
        });
        
        // Filtrar por fecha si se proporcionan
        if (startDate && endDate) {
            ingresosCajaTitular = ingresosCajaTitular.filter(ing => {
                const ingDate = ing.date || ing.fecha || '';
                if (!ingDate) return false;
                const date = new Date(ingDate);
                const start = new Date(startDate);
                const end = new Date(endDate);
                return date >= start && date <= end;
            });
        }
        
        // Buscar ingresos a bancos
        const ingresosBancosRaw = localStorage.getItem(`bankInflowData_${city}`);
        const ingresosBancos = ingresosBancosRaw ? JSON.parse(ingresosBancosRaw) : [];
        const ingresosBancosArray = Array.isArray(ingresosBancos) ? ingresosBancos : Object.values(ingresosBancos);
        let ingresosBancosTitular = ingresosBancosArray.filter(ing => {
            if (!ing.cashInflowData) return false;
            try {
                const cashInflow = JSON.parse(ing.cashInflowData);
                const ingHolderId = cashInflow.holderId || '';
                return String(ingHolderId).trim() === String(holderId).trim();
            } catch (e) {
                return false;
            }
        });
        
        // Filtrar por fecha si se proporcionan
        if (startDate && endDate) {
            ingresosBancosTitular = ingresosBancosTitular.filter(ing => {
                const ingDate = ing.fechaDocumento || ing.fechaHoy || '';
                if (!ingDate) return false;
                const date = new Date(ingDate);
                const start = new Date(startDate);
                const end = new Date(endDate);
                return date >= start && date <= end;
            });
        }
        
        // Buscar notas débito
        const notasDebitoRaw = localStorage.getItem(`notasDebito_${city}`);
        const notasDebito = notasDebitoRaw ? JSON.parse(notasDebitoRaw) : [];
        let notasDebitoTitular = notasDebito.filter(nota => {
            const notaHolderId = nota.holderId || '';
            return String(notaHolderId).trim() === String(holderId).trim();
        });
        
        // Filtrar por fecha si se proporcionan
        if (startDate && endDate) {
            notasDebitoTitular = notasDebitoTitular.filter(nota => {
                const notaDate = nota.fechaHoy || nota.fecha || '';
                if (!notaDate) return false;
                const date = new Date(notaDate);
                const start = new Date(startDate);
                const end = new Date(endDate);
                return date >= start && date <= end;
            });
        }
        
        // Buscar notas crédito
        const notasCreditoRaw = localStorage.getItem(`notasCredito_${city}`);
        const notasCredito = notasCreditoRaw ? JSON.parse(notasCreditoRaw) : [];
        let notasCreditoTitular = notasCredito.filter(nota => {
            const notaHolderId = nota.holderId || '';
            return String(notaHolderId).trim() === String(holderId).trim();
        });
        
        // Filtrar por fecha si se proporcionan
        if (startDate && endDate) {
            notasCreditoTitular = notasCreditoTitular.filter(nota => {
                const notaDate = nota.fechaHoy || nota.fecha || '';
                if (!notaDate) return false;
                const date = new Date(notaDate);
                const start = new Date(startDate);
                const end = new Date(endDate);
                return date >= start && date <= end;
            });
        }
        
        // Obtener el primer contrato y factura para el reporte
        const primerContrato = contratosTitular.length > 0 ? contratosTitular[0] : null;
        const primeraFactura = facturasTitular.length > 0 ? facturasTitular[0] : null;
        
        return {
            titular: titular,
            holderId: holderId,
            contratos: contratosTitular,
            facturas: facturasTitular,
            primerContrato: primerContrato,
            primeraFactura: primeraFactura,
            ingresosCaja: ingresosCajaTitular,
            ingresosBancos: ingresosBancosTitular,
            notasDebito: notasDebitoTitular,
            notasCredito: notasCreditoTitular
        };
    } catch (e) {
        console.error('Error consultando datos de cuenta:', e);
        return null;
    }
}

function generateAccountStatusReport(accountData, city, startDate = null, endDate = null, selectedInvoiceNumber = null) {
    // Guardar datos en localStorage para el reporte
    const reportData = {
        accountData: accountData,
        city: city,
        selectedInvoiceNumber: selectedInvoiceNumber,
        cityName: getCityNameByCode(city),
        startDate: startDate || null,
        endDate: endDate || null
    };
    
    localStorage.setItem('estadoCuentaReportData', JSON.stringify(reportData));
    
    // Abrir página de reporte
    window.open('../reportes/reporte-estado-cuenta.html', '_blank');
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

