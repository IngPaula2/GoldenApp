/**
 * 📊 FUNCIONALIDAD CARTERA - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de cartera.
 * Incluye visualización y edición del historial completo de cartera de los titulares.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let carteraHistoryData = [];
let currentTitularId = '';
let currentTitularName = '';
let editingRowId = null;

function getSelectedCityCode() {
    try { return sessionStorage.getItem('selectedCity') || ''; } catch (e) { return ''; }
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando carga de interfaz de cartera...');
        
        // Inicializar dropdown del usuario
        initializeUserDropdown();
        
        // Inicializar modales
        initializeModals();
        
        // Cargar ciudades
        loadCities();
        
        // Siempre mostrar modal de selección de ciudad al cargar
        initializeCitySelection();
        
        console.log('✅ Interfaz de cartera cargada correctamente');
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
                const selectedCity = getSelectedCityCode();
                if (selectedCity) {
                    hideSelectCityModal();
                }
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
    
    // Botón buscar titular
    const bBuscarTitular = document.getElementById('bBuscarTitular');
    if (bBuscarTitular) {
        bBuscarTitular.addEventListener('click', function() {
            showSearchTitularModal();
        });
    }
    
    // Cerrar modal de resultados al hacer clic fuera
    const resultsModal = document.getElementById('resultsModal');
    if (resultsModal) {
        resultsModal.addEventListener('click', function(e) {
            if (e.target === resultsModal) {
                hideResultsModal();
            }
        });
    }
    
    // Botón buscar en modal
    const bBuscar = document.getElementById('bBuscar');
    if (bBuscar) {
        bBuscar.addEventListener('click', function() {
            searchTitular();
        });
    }
    
    // Permitir buscar con Enter
    const searchValue = document.getElementById('searchValue');
    if (searchValue) {
        searchValue.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchTitular();
            }
        });
    }
}

// ========================================
// FUNCIONES DE CIUDAD
// ========================================

function initializeCitySelection() {
    try { 
        sessionStorage.removeItem('selectedCity');
        sessionStorage.removeItem('selectedCityName');
    } catch (e) {}
    
    carteraHistoryData = [];
    currentTitularId = '';
    currentTitularName = '';
    
    console.log('⏰ Mostrando modal de selección de ciudad...');
    
    // Asegurar que el modal se muestre después de que el DOM esté listo
    setTimeout(() => {
        showSelectCityModal();
    }, 100);
}

function loadCities() {
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
        console.error('Error al cargar ciudades:', e);
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
        loadCities();
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const citySelect = document.getElementById('citySelect');
            if (citySelect) citySelect.focus();
        }, 100);
    } else {
        console.error('❌ No se encontró el modal de selección de ciudad');
    }
}

function hideSelectCityModal() {
    const selectedCity = getSelectedCityCode();
    if (!selectedCity) {
        return;
    }
    
    const modal = document.getElementById('selectCityModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function showSearchTitularModal() {
    const modal = document.getElementById('searchTitularModal');
    if (modal) {
        const searchValue = document.getElementById('searchValue');
        const searchType = document.getElementById('searchType');
        const searchContractSelect = document.getElementById('searchContractSelect');
        const searchContractSelectorGroup = document.getElementById('searchContractSelectorGroup');
        
        // Limpiar campos
        if (searchValue) {
            searchValue.value = '';
            searchValue.focus();
        }
        if (searchContractSelect) {
            searchContractSelect.innerHTML = '<option value="">-- Seleccione un contrato --</option>';
            searchContractSelect.value = '';
        }
        if (searchContractSelectorGroup) {
            searchContractSelectorGroup.style.display = 'none';
        }
        
        const holderNameDisplay = document.getElementById('holderNameDisplay');
        if (holderNameDisplay) {
            holderNameDisplay.style.display = 'none';
            holderNameDisplay.textContent = '';
        }
        
        // Agregar listeners para cargar contratos cuando se ingrese la identificación
        if (searchValue && searchType) {
            // Remover listeners anteriores si existen
            searchValue.removeEventListener('blur', handleSearchValueBlur);
            searchValue.removeEventListener('input', handleSearchValueInput);
            searchType.removeEventListener('change', handleSearchTypeChange);
            
            // Agregar listeners
            searchValue.addEventListener('blur', handleSearchValueBlur);
            searchValue.addEventListener('input', handleSearchValueInput);
            searchType.addEventListener('change', handleSearchTypeChange);
        }
        
        modal.style.display = 'flex';
    }
}

function handleSearchValueBlur() {
    const searchType = document.getElementById('searchType')?.value;
    const searchValue = document.getElementById('searchValue')?.value.trim();
    
    if (searchType === 'identificacion' && searchValue && searchValue.length >= 5) {
        loadContractsForSearch(searchValue);
    }
}

function handleSearchValueInput() {
    const searchType = document.getElementById('searchType')?.value;
    const searchValue = document.getElementById('searchValue')?.value.trim();
    
    if (searchType === 'identificacion' && searchValue && searchValue.length >= 5) {
        // Cargar contratos después de un pequeño delay para evitar cargas innecesarias
        clearTimeout(window._searchContractTimeout);
        window._searchContractTimeout = setTimeout(() => {
            loadContractsForSearch(searchValue);
        }, 500);
    } else {
        // Ocultar selector si no hay suficiente texto
        const searchContractSelectorGroup = document.getElementById('searchContractSelectorGroup');
        if (searchContractSelectorGroup) {
            searchContractSelectorGroup.style.display = 'none';
        }
    }
}

function handleSearchTypeChange() {
    const searchType = document.getElementById('searchType')?.value;
    const searchContractSelectorGroup = document.getElementById('searchContractSelectorGroup');
    
    // Ocultar selector de contrato si se cambia a búsqueda por nombre
    if (searchType === 'nombre' && searchContractSelectorGroup) {
        searchContractSelectorGroup.style.display = 'none';
    }
}

function loadContractsForSearch(holderId) {
    const city = getSelectedCityCode();
    if (!city || !holderId) {
        return;
    }
    
    const contractSelect = document.getElementById('searchContractSelect');
    const contractSelectorGroup = document.getElementById('searchContractSelectorGroup');
    
    if (!contractSelect || !contractSelectorGroup) {
        return;
    }
    
    try {
        // Buscar contratos del titular
        const contractsRaw = localStorage.getItem(`contratos_${city}`) || localStorage.getItem(`contracts_${city}`);
        if (!contractsRaw) {
            contractSelectorGroup.style.display = 'none';
            return;
        }
        
        const contracts = JSON.parse(contractsRaw);
        const contractsArray = Array.isArray(contracts) ? contracts : Object.values(contracts);
        
        const contratosTitular = contractsArray.filter(contract => {
            const contractClientId = contract.clientId || contract.identificacion || contract.titularId || contract.holderId || '';
            return String(contractClientId).trim() === String(holderId).trim();
        });
        
        // Limpiar selector
        contractSelect.innerHTML = '';
        
        if (contratosTitular.length > 1) {
            // Si hay más de un contrato, mostrar el selector y hacerlo obligatorio
            contractSelect.innerHTML = '<option value="">-- Seleccione un contrato * --</option>';
            contratosTitular.forEach(contrato => {
                const contractNumber = contrato.contractNumber || contrato.numeroContrato || contrato.numero || contrato.nro || '';
                if (contractNumber) {
                    const option = document.createElement('option');
                    option.value = contractNumber;
                    option.textContent = `Contrato #${contractNumber}`;
                    contractSelect.appendChild(option);
                }
            });
            contractSelect.required = true;
            contractSelectorGroup.style.display = 'block';
            // Actualizar el label para indicar que es obligatorio
            const label = contractSelectorGroup.querySelector('label');
            if (label) {
                label.innerHTML = 'Seleccionar Contrato <span style="color: #dc2626;">*</span>';
            }
            const small = contractSelectorGroup.querySelector('small');
            if (small) {
                small.textContent = 'Este titular tiene varios contratos. Por favor seleccione el contrato que desea consultar.';
                small.style.color = '#dc2626';
            }
        } else if (contratosTitular.length === 1) {
            // Si solo hay un contrato, también mostrarlo para que el usuario sepa cuál es
            const contrato = contratosTitular[0];
            const contractNumber = contrato.contractNumber || contrato.numeroContrato || contrato.numero || contrato.nro || '';
            if (contractNumber) {
                contractSelect.innerHTML = `<option value="${contractNumber}" selected>Contrato #${contractNumber}</option>`;
                contractSelect.required = false;
                contractSelectorGroup.style.display = 'block';
                // Actualizar el label para indicar que es informativo
                const label = contractSelectorGroup.querySelector('label');
                if (label) {
                    label.innerHTML = 'Contrato del Titular';
                }
                const small = contractSelectorGroup.querySelector('small');
                if (small) {
                    small.textContent = 'Este titular tiene un contrato. Puede consultar el historial de este contrato.';
                    small.style.color = '#6b7280';
                }
            } else {
                contractSelectorGroup.style.display = 'none';
            }
        } else {
            // Si no hay contratos, ocultar el selector
            contractSelectorGroup.style.display = 'none';
        }
    } catch (e) {
        console.error('Error cargando contratos para consulta:', e);
        contractSelectorGroup.style.display = 'none';
    }
}

function hideSearchTitularModal() {
    const modal = document.getElementById('searchTitularModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showResultsModal() {
    const modal = document.getElementById('resultsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideResultsModal() {
    const modal = document.getElementById('resultsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Limpiar el nombre del titular de la interfaz principal
    clearTitularNameDisplay();
    
    // Limpiar las variables globales
    currentTitularId = '';
    currentTitularName = '';
}

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
// FUNCIONES DE BÚSQUEDA
// ========================================

function searchTitular() {
    const searchType = document.getElementById('searchType')?.value;
    const searchValue = document.getElementById('searchValue')?.value.trim();
    const searchContractSelect = document.getElementById('searchContractSelect');
    const searchContractSelectorGroup = document.getElementById('searchContractSelectorGroup');
    
    if (!searchValue) {
        showNotification('Por favor ingrese un valor de búsqueda', 'warning');
        return;
    }
    
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Debe seleccionar una ciudad primero', 'warning');
        return;
    }
    
    // Validar selección de contrato si hay múltiples
    if (searchType === 'identificacion' && searchContractSelectorGroup && searchContractSelectorGroup.style.display !== 'none') {
        if (!searchContractSelect || !searchContractSelect.value) {
            showNotification('Por favor seleccione un contrato', 'warning');
            return;
        }
    }
    
    let titular = null;
    
    if (searchType === 'identificacion') {
        titular = searchTitularByIdentification(searchValue, city);
    } else if (searchType === 'nombre') {
        titular = searchTitularByName(searchValue, city);
    }
    
    if (titular) {
        currentTitularId = titular.numeroId || titular.identificacion || '';
        currentTitularName = titular.nombre || '';
        
        const holderNameDisplay = document.getElementById('holderNameDisplay');
        if (holderNameDisplay) {
            holderNameDisplay.textContent = `Titular encontrado: ${currentTitularName}`;
            holderNameDisplay.style.display = 'block';
            holderNameDisplay.classList.remove('error-text');
            holderNameDisplay.classList.add('success-text');
        }
        
        // Mostrar nombre del titular en la sección
        updateTitularNameDisplay(currentTitularName);
        
        // Obtener contrato seleccionado si existe
        const selectedContract = searchContractSelect && searchContractSelect.value ? searchContractSelect.value : null;
        
        hideSearchTitularModal();
        loadCarteraHistory(currentTitularId, city, selectedContract);
    } else {
        const holderNameDisplay = document.getElementById('holderNameDisplay');
        if (holderNameDisplay) {
            holderNameDisplay.textContent = 'Titular no encontrado';
            holderNameDisplay.style.display = 'block';
            holderNameDisplay.classList.remove('success-text');
            holderNameDisplay.classList.add('error-text');
        }
    }
}

function searchTitularByIdentification(cedula, city) {
    try {
        const titularesByCity = localStorage.getItem('titularesByCity');
        if (!titularesByCity) return null;
        
        const data = JSON.parse(titularesByCity);
        if (data[city] && data[city][cedula]) {
            const titular = data[city][cedula];
            return {
                numeroId: cedula,
                identificacion: cedula,
                nombre: `${titular.nombre1 || ''} ${titular.nombre2 || ''} ${titular.apellido1 || ''} ${titular.apellido2 || ''}`.trim().toUpperCase()
            };
        }
        return null;
    } catch (e) {
        console.error('Error buscando titular:', e);
        return null;
    }
}

function searchTitularByName(name, city) {
    try {
        const titularesByCity = localStorage.getItem('titularesByCity');
        if (!titularesByCity) return null;
        
        const data = JSON.parse(titularesByCity);
        if (!data[city]) return null;
        
        const searchName = name.toUpperCase().trim();
        const titulares = data[city];
        
        for (const [cedula, titular] of Object.entries(titulares)) {
            const nombreCompleto = `${titular.nombre1 || ''} ${titular.nombre2 || ''} ${titular.apellido1 || ''} ${titular.apellido2 || ''}`.trim().toUpperCase();
            if (nombreCompleto.includes(searchName) || searchName.includes(nombreCompleto)) {
                return {
                    numeroId: cedula,
                    identificacion: cedula,
                    nombre: nombreCompleto
                };
            }
        }
        return null;
    } catch (e) {
        console.error('Error buscando titular por nombre:', e);
        return null;
    }
}

// ========================================
// FUNCIONES DE CARGA DE DATOS
// ========================================

function loadCarteraHistory(titularId, city, contractNumber = null) {
    carteraHistoryData = [];
    
    // Cargar datos de la tabla de CARTERA (sistema automático)
    loadCarteraTableData(titularId, city, contractNumber);
    
    // Ordenar por fecha y cuota
    carteraHistoryData.sort((a, b) => {
        // Primero por fecha
        const dateA = new Date(a.fecha || 0);
        const dateB = new Date(b.fecha || 0);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        // Si la fecha es igual, ordenar por cuota
        const cuotaA = extractCuotaNumber(a.cuota || '0');
        const cuotaB = extractCuotaNumber(b.cuota || '0');
        return cuotaA - cuotaB;
    });
    
    // Mostrar resultados en el modal
    showResultsModal();
    renderCarteraResults(carteraHistoryData);
}

function loadCarteraTableData(titularId, city, contractNumber = null) {
    try {
        const carteraKey = `cartera_${city}`;
        let raw = localStorage.getItem(carteraKey);
        let carteraData = [];
        
        if (raw) {
            carteraData = JSON.parse(raw);
            if (!Array.isArray(carteraData)) {
                carteraData = [];
            }
        }
        
        // Filtrar por titular
        let carteraTitular = carteraData.filter(r => {
            const matchId = (r.identifica || '').trim() === String(titularId).trim();
            return matchId;
        });
        
        // Si se especificó un contrato, filtrar también por contrato
        if (contractNumber) {
            carteraTitular = carteraTitular.filter(r => {
                const matchContract = (r.contrato || '').trim() === String(contractNumber).trim();
                return matchContract;
            });
        }
        
        // Si no hay registros de cartera para este titular, intentar generarlos desde facturas existentes
        if (carteraTitular.length === 0) {
            console.log('⚠️ No hay registros de cartera para este titular, intentando generarlos desde facturas existentes...');
            generateCarteraFromExistingData(titularId, city);
            
            // Intentar cargar nuevamente
            raw = localStorage.getItem(carteraKey);
            if (raw) {
                carteraData = JSON.parse(raw);
                if (Array.isArray(carteraData)) {
                    carteraTitular = carteraData.filter(r => {
                        const matchId = (r.identifica || '').trim() === String(titularId).trim();
                        return matchId;
                    });
                }
            }
        }
        
        // Convertir a formato de tabla
        carteraTitular.forEach(record => {
            const tableRecord = {
                id: record.id || `cartera_${Date.now()}_${Math.random()}`,
                codpais: record.codpais || 'CO',
                codciudad: record.codciudad || city,
                identifica: record.identifica || titularId,
                letra: record.letra || 'A',
                contrato: record.contrato || '',
                tipoingres: record.tipoingres || '',
                cuota: record.cuota || '',
                factura: record.factura || '',
                fecha: formatDateForTable(record.fecha),
                fechavenci: formatDateForTable(record.fechavenci),
                valor: formatCurrency(record.valor || 0),
                fechapago: record.fechapago ? formatDateForTable(record.fechapago) : '',
                valorpago: formatCurrency(record.valorpago || 0),
                ejecutivo: record.ejecutivo || '',
                cancelado: record.cancelado || 'N',
                anoasigna: record.anoasigna || (record.anoasigna === 0 ? 0 : ''),
                mesasigna: record.mesasigna || (record.mesasigna === 0 ? 0 : ''),
                ncheque: record.ncheque || '',
                ningrposf: record.ningrposf || '',
                numerond: record.numerond || '',
                f_usuagrab: record.f_usuagrab || 'SISTEMA',
                source: 'cartera',
                originalData: record
            };
            carteraHistoryData.push(tableRecord);
        });
        
        console.log(`✅ Cargados ${carteraTitular.length} registros de cartera para titular ${titularId}`);
    } catch (e) {
        console.error('❌ Error cargando datos de cartera:', e);
    }
}

/**
 * Genera registros de cartera desde facturas e ingresos existentes
 */
function generateCarteraFromExistingData(titularId, city) {
    try {
        console.log('🔄 Generando cartera desde datos existentes para titular:', titularId);
        
        // Buscar facturas del titular
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            console.log('⚠️ No hay facturas en localStorage');
            return;
        }
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        const facturasTitular = invoices.filter(inv => {
            const invClientId = inv.clientId || inv.identificacion || inv.titularId || inv.holderId || '';
            return String(invClientId).trim() === String(titularId).trim();
        });
        
        console.log(`📋 Encontradas ${facturasTitular.length} facturas para el titular`);
        
        if (facturasTitular.length === 0) {
            console.log('⚠️ No se encontraron facturas para este titular');
            return;
        }
        
        // Generar cartera para cada factura usando el módulo CarteraManager
        if (window.CarteraManager && window.CarteraManager.generateCarteraFromInvoice) {
            facturasTitular.forEach(factura => {
                try {
                    window.CarteraManager.generateCarteraFromInvoice(factura, city);
                } catch (e) {
                    console.error('Error generando cartera para factura:', factura.invoiceNumber, e);
                }
            });
        }
        
        // IMPORTANTE: Recargar cartera después de generarla
        const carteraKey = `cartera_${city}`;
        let carteraData = [];
        try {
            const raw = localStorage.getItem(carteraKey);
            if (raw) {
                carteraData = JSON.parse(raw);
                if (!Array.isArray(carteraData)) {
                    carteraData = [];
                }
            }
        } catch (e) {
            console.error('Error recargando cartera:', e);
        }
        
        // Actualizar con ingresos existentes (pasa carteraData para actualizar directamente)
        updateCarteraFromExistingInflowsWithData(titularId, city, carteraData);
        
        // Actualizar con asignaciones existentes (pasa carteraData para actualizar directamente)
        updateCarteraFromExistingAssignmentsWithData(titularId, city, carteraData);
        
        console.log('✅ Cartera generada desde datos existentes');
    } catch (e) {
        console.error('❌ Error generando cartera desde datos existentes:', e);
    }
}

/**
 * Actualiza cartera con ingresos existentes (versión que recibe carteraData)
 */
function updateCarteraFromExistingInflowsWithData(titularId, city, carteraData) {
    try {
        console.log('💰 Actualizando cartera con ingresos existentes para titular:', titularId);
        
        if (!Array.isArray(carteraData)) {
            console.warn('⚠️ carteraData no es un array válido');
            return;
        }
        
        // Ingresos a caja
        const ingresosCajaRaw = localStorage.getItem(`ingresosCaja_${city}`);
        if (ingresosCajaRaw) {
            const ingresosCaja = JSON.parse(ingresosCajaRaw);
            if (Array.isArray(ingresosCaja)) {
                console.log(`📊 Procesando ${ingresosCaja.length} ingresos a caja`);
                ingresosCaja.forEach(ingreso => {
                    if ((ingreso.holderId || '').trim() === String(titularId).trim()) {
                        console.log('✅ Procesando ingreso a caja:', ingreso.numero, 'Factura:', ingreso.invoiceNumber);
                        updateCarteraFromInflowRecord(carteraData, ingreso, city, 'caja');
                    }
                });
            }
        }
        
        // Ingresos a bancos
        const ingresosBancosRaw = localStorage.getItem(`bankInflowData_${city}`);
        if (ingresosBancosRaw) {
            const ingresosBancos = JSON.parse(ingresosBancosRaw);
            if (Array.isArray(ingresosBancos)) {
                console.log(`📊 Procesando ${ingresosBancos.length} ingresos a bancos`);
                ingresosBancos.forEach(ingreso => {
                    if (ingreso.cashInflowData) {
                        try {
                            const cashInflow = JSON.parse(ingreso.cashInflowData);
                            if ((cashInflow.holderId || '').trim() === String(titularId).trim()) {
                                console.log('✅ Procesando ingreso a banco:', ingreso.numero, 'Factura:', cashInflow.invoiceNumber);
                                updateCarteraFromInflowRecord(carteraData, cashInflow, city, 'banco');
                            }
                        } catch (e) {
                            console.error('Error parseando cashInflowData:', e);
                        }
                    }
                });
            }
        }
        
        // Guardar cambios
        const carteraKey = `cartera_${city}`;
        localStorage.setItem(carteraKey, JSON.stringify(carteraData));
        console.log('✅ Cartera actualizada con ingresos existentes');
    } catch (e) {
        console.error('❌ Error actualizando cartera desde ingresos existentes:', e);
    }
}

/**
 * Actualiza cartera con ingresos existentes (versión original para compatibilidad)
 */
function updateCarteraFromExistingInflows(titularId, city) {
    try {
        console.log('💰 Actualizando cartera con ingresos existentes para titular:', titularId);
        
        // Cargar cartera actual
        const carteraKey = `cartera_${city}`;
        let carteraData = [];
        try {
            const raw = localStorage.getItem(carteraKey);
            if (raw) {
                carteraData = JSON.parse(raw);
                if (!Array.isArray(carteraData)) {
                    carteraData = [];
                }
            }
        } catch (e) {
            console.error('Error cargando cartera:', e);
            return;
        }
        
        updateCarteraFromExistingInflowsWithData(titularId, city, carteraData);
    } catch (e) {
        console.error('❌ Error actualizando cartera desde ingresos existentes:', e);
    }
}

/**
 * Actualiza registros de cartera desde un ingreso específico
 */
function updateCarteraFromInflowRecord(carteraData, inflowData, city, source) {
    try {
        const invoiceNumber = inflowData.invoiceNumber || '';
        const holderId = inflowData.holderId || '';
        const fechaPago = inflowData.fecha || inflowData.date || new Date().toISOString().split('T')[0];
        
        // Si tiene detalleCuotas, procesar cada cuota
        if (inflowData.detalleCuotas && Array.isArray(inflowData.detalleCuotas) && inflowData.detalleCuotas.length > 0) {
            inflowData.detalleCuotas.forEach(detalle => {
                updateCarteraRecordDirect(carteraData, invoiceNumber, holderId, detalle.cuota, detalle.valorPagar, fechaPago, detalle.esParcial || false);
            });
        } else {
            // Sistema antiguo: procesar campo cuota (puede ser "2, 3, 4" o "2")
            const cuotaStr = String(inflowData.cuota || '').trim();
            const valorTotal = inflowData.valor || 0;
            
            if (cuotaStr && cuotaStr.includes(',')) {
                // Múltiples cuotas: dividir el valor proporcionalmente
                const cuotasArray = cuotaStr.split(',').map(c => c.trim()).filter(c => c);
                const valorPorCuota = cuotasArray.length > 0 ? valorTotal / cuotasArray.length : valorTotal;
                
                cuotasArray.forEach(cuotaNum => {
                    updateCarteraRecordDirect(carteraData, invoiceNumber, holderId, cuotaNum, valorPorCuota, fechaPago, false);
                });
            } else if (cuotaStr) {
                // Una sola cuota
                updateCarteraRecordDirect(carteraData, invoiceNumber, holderId, cuotaStr, valorTotal, fechaPago, false);
            }
        }
    } catch (e) {
        console.error('Error actualizando registro de cartera desde ingreso:', e);
    }
}

/**
 * Actualiza directamente un registro de cartera
 */
function updateCarteraRecordDirect(carteraData, invoiceNumber, holderId, cuota, valorPago, fechaPago, esParcial) {
    // Buscar el registro de cartera correspondiente
    const record = carteraData.find(r => {
        const matchInvoice = (r.factura || '').trim() === String(invoiceNumber).trim();
        const matchHolder = (r.identifica || '').trim() === String(holderId).trim();
        const matchCuota = matchCuotaNumber(r.cuota, cuota);
        return matchInvoice && matchHolder && matchCuota;
    });
    
    if (!record) {
        console.warn('⚠️ No se encontró registro de cartera para:', { invoiceNumber, holderId, cuota });
        return;
    }
    
    // Actualizar valores de pago (sumar al valor existente)
    const valorPagoActual = parseFloat(record.valorpago || 0) || 0;
    const valorPagoNuevo = parseFloat(valorPago || 0) || 0;
    const nuevoValorPago = parseFloat((valorPagoActual + valorPagoNuevo).toFixed(2));
    const valorCuota = parseFloat(record.valor || 0) || 0;
    
    record.valorpago = nuevoValorPago;
    
    // Actualizar fecha de pago (usar la más reciente)
    if (fechaPago) {
        if (!record.fechapago || new Date(fechaPago) > new Date(record.fechapago)) {
            record.fechapago = fechaPago;
        }
    }
    
    // Determinar si está cancelado (comparar con tolerancia para evitar problemas de redondeo)
    const diferencia = Math.abs(nuevoValorPago - valorCuota);
    const tolerancia = 0.01; // Tolerancia de 1 centavo
    
    console.log(`🔍 Comparando cuota ${cuota}: Valor pagado: ${nuevoValorPago}, Valor cuota: ${valorCuota}, Diferencia: ${diferencia}`);
    
    if (nuevoValorPago >= valorCuota || diferencia < tolerancia) {
        record.cancelado = 'C';
        console.log(`✅ Cuota ${cuota} de factura ${invoiceNumber} marcada como CANCELADA (C). Valor pagado: ${nuevoValorPago}, Valor cuota: ${valorCuota}, Diferencia: ${diferencia}`);
    } else {
        record.cancelado = 'N';
        console.log(`📝 Cuota ${cuota} de factura ${invoiceNumber} actualizada. Valor pagado: ${nuevoValorPago}, Valor cuota: ${valorCuota}, Diferencia: ${diferencia} (Pendiente)`);
    }
}

/**
 * Compara números de cuota (maneja formato "1/15" vs "1")
 */
function matchCuotaNumber(cuotaCartera, cuotaBuscada) {
    const cuotaCarteraStr = String(cuotaCartera || '').trim();
    const cuotaBuscadaStr = String(cuotaBuscada || '').trim();
    
    if (cuotaCarteraStr === cuotaBuscadaStr) return true;
    
    // Extraer número de cuota de formato "X/Y"
    const matchCartera = cuotaCarteraStr.match(/^(\d+)\//);
    const matchBuscada = cuotaBuscadaStr.match(/^(\d+)\//);
    
    if (matchCartera && matchBuscada) {
        return matchCartera[1] === matchBuscada[1];
    }
    
    // Comparar número directo
    if (matchCartera && cuotaBuscadaStr === matchCartera[1]) return true;
    if (matchBuscada && cuotaCarteraStr === matchBuscada[1]) return true;
    
    return false;
}

/**
 * Actualiza cartera con asignaciones existentes (versión que recibe carteraData)
 */
function updateCarteraFromExistingAssignmentsWithData(titularId, city, carteraData) {
    try {
        console.log('👤 Actualizando cartera con asignaciones existentes para titular:', titularId);
        
        if (!Array.isArray(carteraData)) {
            console.warn('⚠️ carteraData no es un array válido');
            return;
        }
        
        // Buscar facturas del titular
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) return;
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        const facturasTitular = invoices.filter(inv => {
            const invClientId = inv.clientId || inv.identificacion || inv.titularId || inv.holderId || '';
            return String(invClientId).trim() === String(titularId).trim();
        });
        
        const facturasTitularNumbers = facturasTitular.map(f => String(f.invoiceNumber || '').trim());
        console.log(`📋 Facturas del titular:`, facturasTitularNumbers);
        
        // Buscar asignaciones
        const assignmentsRaw = localStorage.getItem('assignmentsByCity');
        if (!assignmentsRaw) {
            console.log('⚠️ No hay asignaciones en localStorage');
            return;
        }
        
        const assignmentsByCity = JSON.parse(assignmentsRaw);
        if (!assignmentsByCity[city] || !Array.isArray(assignmentsByCity[city])) {
            console.log('⚠️ No hay asignaciones para esta ciudad');
            return;
        }
        
        console.log(`📊 Procesando ${assignmentsByCity[city].length} asignaciones`);
        
        assignmentsByCity[city].forEach(assignment => {
            if (assignment.accounts && Array.isArray(assignment.accounts)) {
                const executiveId = assignment.executiveId || '';
                const executiveName = assignment.executiveName || '';
                const anoAsigna = assignment.year || new Date(assignment.assignmentDate || new Date()).getFullYear();
                const mesAsigna = assignment.month || new Date(assignment.assignmentDate || new Date()).getMonth() + 1;
                
                console.log(`🔍 Procesando asignación: Ejecutivo ${executiveId}, Año: ${anoAsigna}, Mes: ${mesAsigna}`);
                
                assignment.accounts.forEach(account => {
                    const invoiceNumber = String(account.invoiceNumber || '').trim();
                    const cuotaAsignada = account.cuotaAsignada || account.pendingInstallment || '';
                    
                    // Verificar si esta factura pertenece al titular
                    if (facturasTitularNumbers.includes(invoiceNumber)) {
                        console.log(`✅ Encontrada asignación para factura ${invoiceNumber}, cuota ${cuotaAsignada}`);
                        
                        // Buscar registros de cartera para esta factura y cuota
                        const records = carteraData.filter(r => {
                            const matchInvoice = (r.factura || '').trim() === invoiceNumber;
                            const matchCuota = matchCuotaNumber(r.cuota, cuotaAsignada);
                            return matchInvoice && matchCuota;
                        });
                        
                        records.forEach(record => {
                            record.ejecutivo = executiveId;
                            record.anoasigna = String(anoAsigna || '');
                            record.mesasigna = String(mesAsigna || '');
                            console.log(`✅ Actualizado ejecutivo ${executiveId} (Año: ${anoAsigna}, Mes: ${mesAsigna}) para cuota ${cuotaAsignada} de factura ${invoiceNumber}`);
                        });
                    }
                });
            }
        });
        
        // Guardar cambios
        const carteraKey = `cartera_${city}`;
        localStorage.setItem(carteraKey, JSON.stringify(carteraData));
        console.log('✅ Cartera actualizada con asignaciones existentes');
    } catch (e) {
        console.error('❌ Error actualizando cartera desde asignaciones existentes:', e);
    }
}

/**
 * Actualiza cartera con asignaciones existentes (versión original para compatibilidad)
 */
function updateCarteraFromExistingAssignments(titularId, city) {
    try {
        console.log('👤 Actualizando cartera con asignaciones existentes para titular:', titularId);
        
        // Cargar cartera actual
        const carteraKey = `cartera_${city}`;
        let carteraData = [];
        try {
            const raw = localStorage.getItem(carteraKey);
            if (raw) {
                carteraData = JSON.parse(raw);
                if (!Array.isArray(carteraData)) {
                    carteraData = [];
                }
            }
        } catch (e) {
            console.error('Error cargando cartera:', e);
            return;
        }
        
        updateCarteraFromExistingAssignmentsWithData(titularId, city, carteraData);
    } catch (e) {
        console.error('❌ Error actualizando cartera desde asignaciones existentes:', e);
    }
}

function extractCuotaNumber(cuotaStr) {
    // Extraer número de cuota de formato "1/15" o "0"
    const match = String(cuotaStr || '0').match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

function loadIngresosCaja(titularId, city) {
    try {
        const raw = localStorage.getItem(`ingresosCaja_${city}`);
        if (!raw) return;
        
        const ingresos = JSON.parse(raw);
        if (!Array.isArray(ingresos)) return;
        
        ingresos.forEach(ingreso => {
            if (ingreso.holderId === titularId || ingreso.holderId === String(titularId)) {
                // Buscar contrato usando la factura
                let contractNumber = ingreso.contractNumber || ingreso.contrato || '';
                if (!contractNumber && ingreso.invoiceNumber) {
                    const invoiceInfo = getInvoiceAndContractByNumber(ingreso.invoiceNumber, city);
                    contractNumber = invoiceInfo.contractNumber || '';
                }
                
                const record = {
                    id: `caja_${ingreso.id}`,
                    codpais: 'CO',
                    codciudad: city,
                    identifica: titularId,
                    letra: ingreso.letraRecibo || 'A',
                    contrato: contractNumber,
                    tipoingres: ingreso.tipoIngresoCodigo || '',
                    cuota: ingreso.cuota || '',
                    factura: ingreso.invoiceNumber || ingreso.factura || '',
                    fecha: formatDateForTable(ingreso.fecha),
                    fechavenci: formatDateForTable(ingreso.fechaVencimiento || ingreso.fecha),
                    valor: formatCurrency(ingreso.valor || 0),
                    fechapago: formatDateForTable(ingreso.fecha),
                    valorpago: formatCurrency(ingreso.valor || 0),
                    ejecutivo: ingreso.executiveId || ingreso.ejecutivo || '',
                    cancelado: 'C',
                    anoasigna: new Date(ingreso.fecha).getFullYear(),
                    mesasigna: new Date(ingreso.fecha).getMonth() + 1,
                    source: 'caja',
                    originalData: ingreso
                };
                carteraHistoryData.push(record);
            }
        });
    } catch (e) {
        console.error('Error cargando ingresos a caja:', e);
    }
}

function loadIngresosBancos(titularId, city) {
    try {
        const raw = localStorage.getItem(`bankInflowData_${city}`);
        if (!raw) return;
        
        const ingresos = JSON.parse(raw);
        if (!Array.isArray(ingresos)) return;
        
        ingresos.forEach(ingreso => {
            // Buscar en cashInflowData si existe
            if (ingreso.cashInflowData) {
                try {
                    const cashInflow = JSON.parse(ingreso.cashInflowData);
                    if (cashInflow.holderId === titularId || cashInflow.holderId === String(titularId)) {
                        // Buscar contrato usando la factura
                        let contractNumber = cashInflow.contractNumber || cashInflow.contrato || '';
                        if (!contractNumber && cashInflow.invoiceNumber) {
                            const invoiceInfo = getInvoiceAndContractByNumber(cashInflow.invoiceNumber, city);
                            contractNumber = invoiceInfo.contractNumber || '';
                        }
                        
                        const record = {
                            id: `banco_${ingreso.id}`,
                            codpais: 'CO',
                            codciudad: city,
                            identifica: titularId,
                            letra: cashInflow.letraRecibo || 'A',
                            contrato: contractNumber,
                            tipoingres: cashInflow.tipoIngresoCodigo || '',
                            cuota: cashInflow.cuota || '',
                            factura: cashInflow.invoiceNumber || cashInflow.factura || '',
                            fecha: formatDateForTable(cashInflow.fecha),
                            fechavenci: formatDateForTable(cashInflow.fechaVencimiento || cashInflow.fecha),
                            valor: formatCurrency(cashInflow.valor || 0),
                            fechapago: formatDateForTable(ingreso.fechaDocumento || ingreso.fechaHoy),
                            valorpago: formatCurrency(ingreso.valor || 0),
                            ejecutivo: cashInflow.executiveId || cashInflow.ejecutivo || '',
                            cancelado: 'C',
                            anoasigna: new Date(ingreso.fechaDocumento || ingreso.fechaHoy).getFullYear(),
                            mesasigna: new Date(ingreso.fechaDocumento || ingreso.fechaHoy).getMonth() + 1,
                            source: 'banco',
                            originalData: ingreso
                        };
                        carteraHistoryData.push(record);
                    }
                } catch (e) {
                    console.error('Error parseando cashInflowData:', e);
                }
            }
        });
    } catch (e) {
        console.error('Error cargando ingresos a bancos:', e);
    }
}

// ========================================
// FUNCIONES DE RENDERIZADO
// ========================================

function renderCarteraResults(data) {
    const container = document.getElementById('resultsContainer');
    if (!container) return;
    
    // Actualizar información del titular
    const titularNameEl = document.getElementById('resultsTitularName');
    const titularIdEl = document.getElementById('resultsTitularId');
    
    if (titularNameEl) {
        titularNameEl.textContent = currentTitularName || '-';
    }
    if (titularIdEl) {
        titularIdEl.textContent = `Identificación: ${currentTitularId || '-'}`;
    }
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="no-results-message">
                <i class="fas fa-file-invoice"></i>
                <p>No existen registros de cartera para este titular</p>
            </div>
        `;
        return;
    }
    
    // Limpiar listeners anteriores removiendo la marca
    const oldFields = document.querySelectorAll('.editable-field[data-listener-attached]');
    oldFields.forEach(field => field.removeAttribute('data-listener-attached'));
    
    container.innerHTML = data.map((record, index) => `
        <div class="result-card" data-id="${record.id}">
            <div class="result-card-header">
                <span class="result-number">#${index + 1}</span>
                <span class="result-source">${record.source === 'caja' ? 'Ingreso a Caja' : 'Ingreso a Banco'}</span>
            </div>
            <div class="result-card-body">
                <div class="result-row">
                    <div class="result-field">
                        <label>Codpais</label>
                        <span class="editable-field" data-field="codpais" data-id="${record.id}">${record.codpais || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Codciudad</label>
                        <span class="editable-field" data-field="codciudad" data-id="${record.id}">${record.codciudad || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Identifica</label>
                        <span class="editable-field" data-field="identifica" data-id="${record.id}">${record.identifica || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Letra</label>
                        <span class="editable-field" data-field="letra" data-id="${record.id}">${record.letra || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Contrato</label>
                        <span class="editable-field" data-field="contrato" data-id="${record.id}">${record.contrato || '-'}</span>
                    </div>
                </div>
                <div class="result-row">
                    <div class="result-field">
                        <label>Tipoingres</label>
                        <span class="editable-field" data-field="tipoingres" data-id="${record.id}">${record.tipoingres || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Cuota</label>
                        <span class="editable-field" data-field="cuota" data-id="${record.id}">${record.cuota || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Factura</label>
                        <span class="editable-field" data-field="factura" data-id="${record.id}">${record.factura || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Fecha</label>
                        <span class="editable-field" data-field="fecha" data-id="${record.id}">${record.fecha || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Fechavenci</label>
                        <span class="editable-field" data-field="fechavenci" data-id="${record.id}">${record.fechavenci || '-'}</span>
                    </div>
                </div>
                <div class="result-row">
                    <div class="result-field">
                        <label>Valor</label>
                        <span class="editable-field" data-field="valor" data-id="${record.id}">${record.valor || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Fechapago</label>
                        <span class="editable-field" data-field="fechapago" data-id="${record.id}">${record.fechapago || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Valorpago</label>
                        <span class="editable-field" data-field="valorpago" data-id="${record.id}">${record.valorpago || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Ejecutivo</label>
                        <span class="editable-field" data-field="ejecutivo" data-id="${record.id}">${record.ejecutivo || '-'}</span>
                    </div>
                    <div class="result-field">
                        <label>Cancelado</label>
                        <span class="editable-field" data-field="cancelado" data-id="${record.id}">${record.cancelado || '-'}</span>
                    </div>
                </div>
                <div class="result-row">
                    <div class="result-field">
                        <label>Año/Mes Asigna</label>
                        <span class="editable-field" data-field="anoasigna" data-id="${record.id}">${record.anoasigna || '-'} / ${record.mesasigna || '-'}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Agregar event listeners para edición
    attachEditListeners();
}

function attachEditListeners() {
    // Agregar listeners a los campos editables
    const editableFields = document.querySelectorAll('.editable-field');
    editableFields.forEach(field => {
        // Verificar si ya tiene listeners (usando una marca)
        if (field.hasAttribute('data-listener-attached')) {
            return; // Ya tiene listeners, no agregar de nuevo
        }
        
        // Marcar que ya tiene listeners
        field.setAttribute('data-listener-attached', 'true');
        
        // Agregar listener para doble clic
        field.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (editMode) {
                startEditingField(field);
            }
        });
        
        // Agregar listener para un solo clic cuando el modo edición está activo
        field.addEventListener('click', function(e) {
            if (editMode && !field.querySelector('input') && !field.querySelector('select')) {
                e.stopPropagation();
                e.preventDefault();
                startEditingField(field);
            }
        });
    });
    
    // Botón editar registro
    const bEditarRegistro = document.getElementById('bEditarRegistro');
    if (bEditarRegistro && !bEditarRegistro.hasAttribute('data-listener-attached')) {
        bEditarRegistro.setAttribute('data-listener-attached', 'true');
        bEditarRegistro.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            enableEditMode();
        });
    }
}

let editMode = false;

function enableEditMode() {
    editMode = !editMode;
    const bEditarRegistro = document.getElementById('bEditarRegistro');
    const editableFields = document.querySelectorAll('.editable-field');
    
    if (editMode) {
        if (bEditarRegistro) {
            bEditarRegistro.innerHTML = '<i class="fas fa-save"></i> Guardar';
            bEditarRegistro.classList.remove('btn-primary');
            bEditarRegistro.classList.add('btn-success');
        }
        editableFields.forEach(field => {
            field.classList.add('edit-mode');
            field.style.cursor = 'pointer';
            // Asegurar que el campo no tenga inputs activos
            const existingInput = field.querySelector('input, select');
            if (existingInput) {
                existingInput.remove();
            }
        });
        showNotification('Modo edición activado. Haga clic en cualquier campo para editar', 'info');
    } else {
        if (bEditarRegistro) {
            bEditarRegistro.innerHTML = '<i class="fas fa-edit"></i> Editar';
            bEditarRegistro.classList.remove('btn-success');
            bEditarRegistro.classList.add('btn-primary');
        }
        editableFields.forEach(field => {
            field.classList.remove('edit-mode');
            field.style.cursor = 'default';
            // Cerrar cualquier campo que esté siendo editado
            const existingInput = field.querySelector('input, select');
            if (existingInput) {
                existingInput.blur();
            }
        });
        saveCarteraHistory();
        showNotification('Cambios guardados correctamente', 'success');
    }
}

function startEditingField(field) {
    if (!editMode) {
        showNotification('Active el modo edición primero haciendo clic en el botón "Editar"', 'warning');
        return;
    }
    
    // Si ya hay un campo siendo editado, no permitir editar otro
    if (editingRowId !== null) {
        showNotification('Termine de editar el campo actual antes de editar otro', 'warning');
        return;
    }
    
    // Verificar que el campo no esté siendo editado ya
    if (field.querySelector('input') || field.querySelector('select')) {
        return;
    }
    
    const recordId = field.dataset.id;
    const fieldName = field.dataset.field;
    
    if (!recordId || !fieldName) {
        console.error('Campo sin datos requeridos:', field);
        return;
    }
    
    editingRowId = recordId;
    
    // Obtener el valor actual, removiendo cualquier contenido HTML
    let currentValue = field.textContent.trim();
    if (!currentValue || currentValue === '-') {
        currentValue = '';
    }
    
    // Crear input según el tipo de campo
    let input;
    if (fieldName === 'fecha' || fieldName === 'fechavenci' || fieldName === 'fechapago') {
        input = document.createElement('input');
        input.type = 'date';
        input.value = convertDateToInput(currentValue);
    } else if (fieldName === 'valor' || fieldName === 'valorpago') {
        input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue.replace(/[^\d]/g, '');
    } else if (fieldName === 'cancelado') {
        input = document.createElement('select');
        input.innerHTML = '<option value="C">C</option><option value="N">N</option><option value="A">A</option>';
        input.value = currentValue;
    } else {
        input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
    }
    
    input.className = 'edit-input-field';
    input.style.width = '100%';
    input.style.padding = '6px';
    input.style.border = '2px solid #DEB448';
    input.style.borderRadius = '4px';
    input.style.fontSize = '0.9rem';
    
    field.textContent = '';
    field.appendChild(input);
    input.focus();
    input.select();
    
    const finishEditing = () => {
        let newValue = input.value.trim();
        
        if (fieldName === 'fecha' || fieldName === 'fechavenci' || fieldName === 'fechapago') {
            newValue = formatDateForTable(newValue);
        } else if (fieldName === 'valor' || fieldName === 'valorpago') {
            const numValue = parseInt(newValue.replace(/[^\d]/g, '') || 0, 10);
            newValue = formatCurrency(numValue);
        }
        
        if (input.parentNode) {
            input.parentNode.removeChild(input);
        }
        
        field.textContent = newValue;
        editingRowId = null;
        
        // Actualizar datos
        const record = carteraHistoryData.find(r => r.id === recordId);
        if (record) {
            record[fieldName] = newValue;
        }
    };
    
    const cancelEditing = () => {
        if (input.parentNode) {
            input.parentNode.removeChild(input);
        }
        field.textContent = currentValue;
        editingRowId = null;
    };
    
    input.addEventListener('blur', finishEditing);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditing();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditing();
        }
    });
}


// ========================================
// FUNCIONES DE PERSISTENCIA
// ========================================

function saveCarteraHistory() {
    const city = getSelectedCityCode();
    if (!city || !currentTitularId) return;
    
    try {
        localStorage.setItem(`carteraHistory_${city}_${currentTitularId}`, JSON.stringify(carteraHistoryData));
        showNotification('Cambios guardados correctamente', 'success');
    } catch (e) {
        console.error('Error guardando historial de cartera:', e);
        showNotification('Error al guardar los cambios', 'error');
    }
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

function formatDateForTable(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            // Intentar parsear formato DD/MM/YY
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
                return `${day}/${month}/${year}`;
            }
            return dateString;
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
}

function convertDateToInput(dateString) {
    if (!dateString) return '';
    try {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            return `${year}-${month}-${day}`;
        }
        return '';
    } catch (e) {
        return '';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

function getInvoiceAndContractByNumber(invoiceNumber, city) {
    if (!invoiceNumber || !city) {
        return { invoiceNumber: '', contractNumber: '' };
    }
    
    try {
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            return { invoiceNumber: invoiceNumber, contractNumber: '' };
        }
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        const invoice = invoices.find(inv => {
            const invNum = String(inv.invoiceNumber || '').trim();
            const searchNum = String(invoiceNumber).trim();
            return invNum === searchNum || 
                   invNum.replace(/^0+/, '') === searchNum.replace(/^0+/, '') ||
                   invNum === searchNum.padStart(8, '0') ||
                   invNum.padStart(8, '0') === searchNum;
        });
        
        if (!invoice) {
            return { invoiceNumber: invoiceNumber, contractNumber: '' };
        }
        
        let contractNumber = invoice.contractNumber || invoice.contractId || '';
        
        if (!contractNumber && invoice.contractId) {
            const contractsRaw = localStorage.getItem(`contratos_${city}`);
            if (contractsRaw) {
                const contracts = JSON.parse(contractsRaw);
                if (Array.isArray(contracts)) {
                    const contract = contracts.find(c => {
                        return String(c.id) === String(invoice.contractId) ||
                               String(c.contractNumber || c.numero || c.numeroContrato) === String(invoice.contractId);
                    });
                    if (contract) {
                        contractNumber = contract.contractNumber || contract.numero || contract.numeroContrato || '';
                    }
                }
            }
        }
        
        return {
            invoiceNumber: invoice.invoiceNumber || invoiceNumber,
            contractNumber: contractNumber
        };
    } catch (error) {
        console.error('Error obteniendo factura y contrato:', error);
        return { invoiceNumber: invoiceNumber, contractNumber: '' };
    }
}

function updateTitularNameDisplay(nombre) {
    // Buscar o crear elemento para mostrar el nombre del titular
    let titularNameDisplay = document.getElementById('titularNameDisplay');
    if (!titularNameDisplay) {
        const sectionTitle = document.querySelector('.section-title');
        if (sectionTitle) {
            titularNameDisplay = document.createElement('div');
            titularNameDisplay.id = 'titularNameDisplay';
            titularNameDisplay.className = 'titular-name-display';
            sectionTitle.appendChild(titularNameDisplay);
        }
    }
    
    if (titularNameDisplay) {
        titularNameDisplay.innerHTML = `<i class="fas fa-user"></i> <span>${nombre}</span>`;
        titularNameDisplay.style.display = 'flex';
    }
}

function clearTitularNameDisplay() {
    // Ocultar y limpiar el elemento del nombre del titular
    const titularNameDisplay = document.getElementById('titularNameDisplay');
    if (titularNameDisplay) {
        titularNameDisplay.style.display = 'none';
        titularNameDisplay.innerHTML = '';
    }
}

// ========================================
// NOTIFICACIONES
// ========================================

function showNotification(message, type = 'info') {
    console.log(`📢 Notificación [${type}]: ${message}`);
    
    const existingNotification = document.querySelector('.notification');
    if (existingNotification && existingNotification.parentNode) {
        existingNotification.parentNode.removeChild(existingNotification);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

