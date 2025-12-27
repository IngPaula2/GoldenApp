/**
 * 💼 FUNCIONALIDAD ASIGNAR FACTURA - GOLDEN APP
 * 
 * Este archivo contiene la lógica JavaScript para el módulo de asignar factura.
 * Incluye gestión de modales y operaciones CRUD para asignaciones de factura.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let assignmentData = [];
let assignedAccounts = []; // Array para almacenar las cuentas asignadas al ejecutivo

function getSelectedCityCode() {
    try { return sessionStorage.getItem('selectedCity') || ''; } catch (e) { return ''; }
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando carga de interfaz de asignar factura...');
        
        // Inicializar dropdown del usuario
        initializeUserDropdown();
        
        // Inicializar modales
        initializeModals();
        
        // Cargar ciudades
        loadCities();
        
        // Siempre mostrar modal de selección de ciudad al cargar
        initializeCitySelection();
        
        console.log('✅ Interfaz de asignar factura cargada correctamente');
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
                loadAssignments();
                
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
    
    // Botón buscar asignación
    const bBuscarAsignacion = document.getElementById('bBuscarAsignacion');
    if (bBuscarAsignacion) {
        bBuscarAsignacion.addEventListener('click', function() {
            searchAssignment();
        });
    }
    
    // Botón crear asignación
    const bCrearAsignacion = document.getElementById('bCrearAsignacion');
    if (bCrearAsignacion) {
        bCrearAsignacion.addEventListener('click', function() {
            const form = document.getElementById('createAssignmentForm');
            if (form && form.checkValidity()) {
                const year = document.getElementById('assignmentYear').value;
                const month = document.getElementById('assignmentMonth').value;
                
                // Cerrar modal actual y abrir el nuevo modal de asignación por ejecutivo
                hideCreateAssignmentModal();
                showAssignAccountsByExecutiveModal(year, month);
            } else {
                form.reportValidity();
            }
        });
    }
    
    // Botón guardar asignación de cuentas (solo para crear asignación, NO para transferir)
    const bSaveAccounts = document.getElementById('bSaveAccounts');
    if (bSaveAccounts) {
        bSaveAccounts.addEventListener('click', function() {
            const form = document.getElementById('assignAccountsByExecutiveForm');
            if (!form) return;
            
            // Validar que se haya seleccionado un ejecutivo
            const executiveId = document.getElementById('executiveId');
            const executiveName = document.getElementById('executiveName');
            
            if (!executiveId || !executiveId.value.trim() || !executiveName || !executiveName.value.trim()) {
                if (window.showNotification) {
                    showNotification('Debe seleccionar un ejecutivo', 'warning');
                }
                return;
            }

            // El botón de guardar crea asignación normal (sin transferencia)
            // No limpiamos el campo de transferencia para que el usuario pueda elegir qué hacer

            // Capturar datos adicionales de la asignación para mostrar en la tabla resumen
            const yearDisplay = document.getElementById('assignmentYearDisplay');
            const monthDisplay = document.getElementById('assignmentMonthDisplay');
            const dateFromInput = document.getElementById('dateFrom');
            const dateToInput = document.getElementById('dateTo');

            // Validar que haya cuentas para guardar
            if (!assignedAccounts || assignedAccounts.length === 0) {
                if (window.showNotification) {
                    showNotification('Debe agregar al menos una factura al ejecutivo antes de guardar.', 'warning');
                }
                return;
            }

            // Validar otros campos requeridos del formulario
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Si todo está bien, marcamos que estamos listos para guardar
            // y mostramos el modal de confirmación estándar (SIN transferencia).
            window._readyToSaveAccounts = {
                executiveId: executiveId.value,
                executiveName: executiveName.value,
                transferExecutiveId: '', // Siempre vacío para el botón de guardar
                year: yearDisplay ? yearDisplay.value : '',
                month: monthDisplay ? monthDisplay.value : '',
                dateFrom: dateFromInput ? dateFromInput.value : '',
                dateTo: dateToInput ? dateToInput.value : '',
                totalAccounts: assignedAccounts.length
            };
            showConfirmCreateAssignmentModal();
        });
    }
    
    // Botón procesar asignación de cuentas
    const bProcessAccounts = document.getElementById('bProcessAccounts');
    if (bProcessAccounts) {
        // Botón eliminado del HTML, se mantiene este bloque solo por compatibilidad
    }
    
    // Botón asignar cuentas
    const bAssignAccounts = document.getElementById('bAssignAccounts');
    if (bAssignAccounts) {
        bAssignAccounts.addEventListener('click', function() {
            showSelectInvoicesModal();
        });
    }
    
    // Función reutilizable para procesar la transferencia
    function processTransfer() {
        const form = document.getElementById('assignAccountsByExecutiveForm');
        if (!form) return;
        
        // Validar que se haya seleccionado un ejecutivo principal
        const executiveId = document.getElementById('executiveId');
        const executiveName = document.getElementById('executiveName');
        
        if (!executiveId || !executiveId.value.trim() || !executiveName || !executiveName.value.trim()) {
            if (window.showNotification) {
                showNotification('Debe seleccionar un ejecutivo principal primero', 'warning');
            }
            return;
        }

        const transferInput = document.getElementById('transferExecutiveId');
        if (!transferInput) return;

        const cedula = transferInput.value.trim();

        if (!cedula) {
            if (window.showNotification) {
                showNotification('Debe seleccionar un ejecutivo al que transferir las cuentas.', 'warning');
            }
            return;
        }

        // Validar que no sea el mismo ejecutivo
        const currentExecutiveId = executiveId.value.trim();
        if (currentExecutiveId && cedula === currentExecutiveId) {
            if (window.showNotification) {
                showNotification('No puede transferir las cuentas al mismo ejecutivo.', 'warning');
            }
            return;
        }

        // Validar que haya cuentas para transferir
        if (!assignedAccounts || assignedAccounts.length === 0) {
            if (window.showNotification) {
                showNotification('Debe agregar al menos una factura antes de transferir.', 'warning');
            }
            return;
        }

        // Validar otros campos requeridos del formulario
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Capturar datos adicionales de la asignación
        const yearDisplay = document.getElementById('assignmentYearDisplay');
        const monthDisplay = document.getElementById('assignmentMonthDisplay');
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');

        // Buscar el ejecutivo de destino para obtener su nombre completo
        const result = findExecutiveInAllCities(cedula);
        if (!result) {
            if (window.showNotification) {
                showNotification('No se encontró el ejecutivo de destino. Verifique la información.', 'error');
            }
            return;
        }

        // Guardar en memoria a qué ejecutivo se transferirán las cuentas
        window._transferExecutive = {
            id: cedula,
            ciudad: result.ciudad,
            empleado: result.empleado
        };

        // Preparar datos para el modal de confirmación de transferencia
        window._readyToSaveAccounts = {
            executiveId: executiveId.value,
            executiveName: executiveName.value,
            transferExecutiveId: cedula,
            transferExecutiveName: buildExecutiveFullName(result.empleado),
            year: yearDisplay ? yearDisplay.value : '',
            month: monthDisplay ? monthDisplay.value : '',
            dateFrom: dateFromInput ? dateFromInput.value : '',
            dateTo: dateToInput ? dateToInput.value : '',
            totalAccounts: assignedAccounts.length
        };

        // Mostrar modal de confirmación de transferencia
        showConfirmTransferModal();
    }

    // Botón transferir a otro ejecutivo (botón inferior)
    const bTransferAccounts = document.getElementById('bTransferAccounts');
    if (bTransferAccounts) {
        bTransferAccounts.addEventListener('click', processTransfer);
    }

    // Botón transferir después de la información del ejecutivo
    const bTransferFromInfo = document.getElementById('bTransferFromInfo');
    if (bTransferFromInfo) {
        bTransferFromInfo.addEventListener('click', processTransfer);
    }

    // Limitar campos de identificación / celular a 10 dígitos numéricos
    const tenDigitInputs = [
        document.getElementById('transferExecutiveId'),
        document.getElementById('holderId')
    ].filter(Boolean);

    tenDigitInputs.forEach(input => {
        input.addEventListener('input', function () {
            // Solo números y máximo 10 dígitos
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        });

        input.addEventListener('paste', function (e) {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            const cleaned = String(text || '').replace(/[^0-9]/g, '').slice(0, 10);
            this.value = cleaned;
        });
    });
    
    // Listener específico para el campo de transferencia para actualizar visibilidad de botones
    const transferInput = document.getElementById('transferExecutiveId');
    if (transferInput) {
        transferInput.addEventListener('input', function() {
            // Si el campo se limpia manualmente, limpiar también la referencia y el nombre
            if (!this.value.trim()) {
                window._transferExecutive = null;
                const transferExecutiveNameInput = document.getElementById('transferExecutiveName');
                if (transferExecutiveNameInput) {
                    transferExecutiveNameInput.value = '';
                }
            }
            // Actualizar visibilidad de botones
            updateTransferAndSaveButtonsVisibility();
        });
        
        transferInput.addEventListener('blur', function() {
            // Actualizar visibilidad cuando el campo pierde el foco
            updateTransferAndSaveButtonsVisibility();
        });
    }
    
    // Botón confirmar selección de facturas
    const bConfirmInvoicesSelection = document.getElementById('bConfirmInvoicesSelection');
    if (bConfirmInvoicesSelection) {
        bConfirmInvoicesSelection.addEventListener('click', function() {
            confirmInvoicesSelection();
        });
    }
    
    // Búsqueda de facturas en el modal
    const invoiceSearchInput = document.getElementById('invoiceSearchInput');
    if (invoiceSearchInput) {
        invoiceSearchInput.addEventListener('input', function() {
            filterInvoices(this.value);
        });
    }
    
    // Botón escoger ejecutivo
    const bSelectExecutive = document.getElementById('bSelectExecutive');
    if (bSelectExecutive) {
        bSelectExecutive.addEventListener('click', function() {
            showSelectExecutiveModal();
        });
    }
    
    
    // Botón escoger ejecutivo para transferencia
    const bSelectTransferExecutive = document.getElementById('bSelectTransferExecutive');
    if (bSelectTransferExecutive) {
        bSelectTransferExecutive.addEventListener('click', function() {
            // Marcamos que el modal se usará para seleccionar el ejecutivo de transferencia
            window._selectingTransferExecutive = true;
            showSelectExecutiveModal();
        });
    }
    
    // Búsqueda de ejecutivos en el modal
    const executiveSearchInput = document.getElementById('executiveSearchInput');
    if (executiveSearchInput) {
        executiveSearchInput.addEventListener('input', function() {
            filterExecutives(this.value);
        });
    }
    
    // Botón generar reporte
    const bGenerarReporte = document.getElementById('bGenerarReporte');
    if (bGenerarReporte) {
        bGenerarReporte.addEventListener('click', function() {
            generateReport();
        });
    }
    
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
    
    // Validar que el campo de año solo acepte números
    const assignmentYearInput = document.getElementById('assignmentYear');
    if (assignmentYearInput) {
        assignmentYearInput.addEventListener('input', function(e) {
            // Remover cualquier carácter que no sea número
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        
        assignmentYearInput.addEventListener('keypress', function(e) {
            // Solo permitir teclas numéricas
            const char = String.fromCharCode(e.which);
            if (!/[0-9]/.test(char)) {
                e.preventDefault();
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
    assignmentData = [];
    loadAssignments();
    
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

function showSearchAssignmentModal() {
    const modal = document.getElementById('searchAssignmentModal');
    if (modal) modal.style.display = 'flex';
}

function hideSearchAssignmentModal() {
    const modal = document.getElementById('searchAssignmentModal');
    if (modal) modal.style.display = 'none';
}

function showCreateAssignmentModal() {
    const modal = document.getElementById('createAssignmentModal');
    if (modal) {
        // Limpiar formulario
        const form = document.getElementById('createAssignmentForm');
        if (form) form.reset();
        
        // Establecer año actual por defecto
        const yearInput = document.getElementById('assignmentYear');
        if (yearInput) {
            const currentYear = new Date().getFullYear();
            yearInput.value = currentYear;
        }
        
        modal.style.display = 'flex';
    }
}

function hideCreateAssignmentModal() {
    const modal = document.getElementById('createAssignmentModal');
    if (modal) modal.style.display = 'none';
}

function showReportModal() {
    const modal = document.getElementById('reportModal');
    if (!modal) return;
    
    // Limpiar formulario
    const yearInput = document.getElementById('reportYear');
    const monthSelect = document.getElementById('reportMonth');
    const tipoBusquedaSelect = document.getElementById('reportTipoBusqueda');
    const executiveIdInput = document.getElementById('reportExecutiveId');
    const executiveNameDisplay = document.getElementById('reportExecutiveNameDisplay');
    const ciudadSelect = document.getElementById('reportCiudad');
    const porEjecutivoRow = document.getElementById('reportPorEjecutivoRow');
    const porCiudadRow = document.getElementById('reportPorCiudadRow');
    
    if (yearInput) {
        const currentYear = new Date().getFullYear();
        yearInput.value = currentYear;
    }
    if (monthSelect) monthSelect.value = '';
    if (tipoBusquedaSelect) tipoBusquedaSelect.value = '';
    if (executiveIdInput) {
        executiveIdInput.value = '';
        executiveIdInput.removeAttribute('required');
    }
    if (executiveNameDisplay) {
        executiveNameDisplay.style.display = 'none';
        executiveNameDisplay.textContent = '';
    }
    if (ciudadSelect) {
        ciudadSelect.value = '';
        ciudadSelect.removeAttribute('required');
    }
    if (porEjecutivoRow) porEjecutivoRow.style.display = 'none';
    if (porCiudadRow) porCiudadRow.style.display = 'none';
    
    // Poblar select de ciudades
    populateReportCiudadSelect();
    
    // Configurar event listeners
    setupReportTipoBusquedaHandler();
    setupReportExecutiveSearch();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function populateReportCiudadSelect() {
    const ciudadSelect = document.getElementById('reportCiudad');
    if (!ciudadSelect) return;
    
    ciudadSelect.innerHTML = '<option value="">Seleccione la ciudad</option>';
    
    try {
        let ciudades = {};
        if (typeof window.getCiudadesData === 'function') {
            ciudades = window.getCiudadesData() || {};
        } else {
            const raw = localStorage.getItem('ciudadesData');
            const data = raw ? JSON.parse(raw) : {};
            ciudades = Object.fromEntries(
                Object.entries(data).filter(([k, v]) => v && typeof v === 'object' && v.codigo && v.nombre)
            );
        }
        
        Object.values(ciudades)
            .filter(c => c && c.activo !== false)
            .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
            .forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.codigo;
                opt.textContent = `${c.codigo} - ${String(c.nombre || '').toUpperCase()}`;
                ciudadSelect.appendChild(opt);
            });
    } catch (e) {
        console.error('Error cargando ciudades:', e);
    }
}

function setupReportTipoBusquedaHandler() {
    const tipoBusquedaSelect = document.getElementById('reportTipoBusqueda');
    const porEjecutivoRow = document.getElementById('reportPorEjecutivoRow');
    const porCiudadRow = document.getElementById('reportPorCiudadRow');
    const executiveIdInput = document.getElementById('reportExecutiveId');
    const ciudadSelect = document.getElementById('reportCiudad');
    
    if (!tipoBusquedaSelect) return;
    
    tipoBusquedaSelect.addEventListener('change', function() {
        const tipo = this.value;
        
        if (tipo === 'ejecutivo') {
            if (porEjecutivoRow) porEjecutivoRow.style.display = 'block';
            if (porCiudadRow) porCiudadRow.style.display = 'none';
            if (executiveIdInput) executiveIdInput.setAttribute('required', 'required');
            if (ciudadSelect) ciudadSelect.removeAttribute('required');
        } else if (tipo === 'ciudad') {
            if (porEjecutivoRow) porEjecutivoRow.style.display = 'none';
            if (porCiudadRow) porCiudadRow.style.display = 'block';
            if (executiveIdInput) executiveIdInput.removeAttribute('required');
            if (ciudadSelect) {
                ciudadSelect.setAttribute('required', 'required');
                // Establecer la ciudad actualmente seleccionada
                const currentCity = getSelectedCityCode();
                if (currentCity) {
                    ciudadSelect.value = currentCity;
                }
            }
        } else {
            if (porEjecutivoRow) porEjecutivoRow.style.display = 'none';
            if (porCiudadRow) porCiudadRow.style.display = 'none';
            if (executiveIdInput) executiveIdInput.removeAttribute('required');
            if (ciudadSelect) ciudadSelect.removeAttribute('required');
        }
    });
}

function setupReportExecutiveSearch() {
    const executiveIdInput = document.getElementById('reportExecutiveId');
    const executiveNameDisplay = document.getElementById('reportExecutiveNameDisplay');
    
    if (!executiveIdInput) return;
    
    // Limitar a 10 dígitos numéricos
    executiveIdInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    });
    
    executiveIdInput.addEventListener('blur', function() {
        const cedula = this.value.trim();
        if (!cedula) {
            if (executiveNameDisplay) {
                executiveNameDisplay.style.display = 'none';
                executiveNameDisplay.textContent = '';
            }
            return;
        }
        
        const result = findExecutiveInAllCities(cedula);
        if (result) {
            const nombre = buildExecutiveFullName(result.empleado);
            if (executiveNameDisplay) {
                executiveNameDisplay.textContent = `Ejecutivo: ${nombre}`;
                executiveNameDisplay.style.display = 'block';
                executiveNameDisplay.style.backgroundColor = '#d4edda';
                executiveNameDisplay.style.color = '#155724';
            }
        } else {
            if (executiveNameDisplay) {
                executiveNameDisplay.textContent = 'Ejecutivo no encontrado';
                executiveNameDisplay.style.display = 'block';
                executiveNameDisplay.style.backgroundColor = '#f8d7da';
                executiveNameDisplay.style.color = '#721c24';
            }
        }
    });
}

function showAssignAccountsByExecutiveModal(year, month) {
    const modal = document.getElementById('assignAccountsByExecutiveModal');
    if (modal) {
        // Solo limpiar si NO estamos en modo edición
        if (!window._editingExecutiveId) {
            // Limpiar formulario
            const form = document.getElementById('assignAccountsByExecutiveForm');
            if (form) form.reset();
            
            // Limpiar lista de cuentas asignadas
            assignedAccounts = [];
            updateAccountsList();
            
            // Limpiar campos de ejecutivo
            const executiveIdInput = document.getElementById('executiveId');
            const executiveNameInput = document.getElementById('executiveName');
            if (executiveIdInput) executiveIdInput.value = '';
            if (executiveNameInput) executiveNameInput.value = '';
        }
        
        // Establecer año y mes asignación (solo lectura)
        const yearDisplay = document.getElementById('assignmentYearDisplay');
        if (yearDisplay && year) {
            yearDisplay.value = year;
        }
        
        const monthDisplay = document.getElementById('assignmentMonthDisplay');
        if (monthDisplay && month) {
            // Si month ya viene formateado (ej: "03 - Marzo"), usarlo directamente
            if (month.includes(' - ')) {
                monthDisplay.value = month;
            } else {
                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                const monthNumber = parseInt(month);
                if (monthNumber >= 1 && monthNumber <= 12) {
                    monthDisplay.value = `${String(monthNumber).padStart(2, '0')} - ${monthNames[monthNumber - 1]}`;
                } else {
                    monthDisplay.value = month;
                }
            }
        }
        
        // Establecer fecha actual
        const currentDateInput = document.getElementById('currentDate');
        if (currentDateInput) {
            const today = new Date().toISOString().split('T')[0];
            currentDateInput.value = today;
        }
        
        // Actualizar campos de totales (siempre, incluso en modo edición)
        updateTotals();
        
        // Cambiar texto del botón según el modo
        const saveButton = document.getElementById('bSaveAccounts');
        if (saveButton) {
            if (window._editingExecutiveId) {
                saveButton.textContent = 'Actualizar';
            } else {
                saveButton.textContent = 'Guardar';
            }
        }
        
        // Inicializar visibilidad de botones de transferir y guardar
        updateTransferAndSaveButtonsVisibility();
        
        modal.style.display = 'flex';
    }
}

function showSelectExecutiveModal() {
    console.log('=== MOSTRANDO MODAL DE SELECCIÓN DE EJECUTIVOS ===');
    const modal = document.getElementById('selectExecutiveModal');
    if (!modal) {
        console.error('No se encontró el modal selectExecutiveModal');
        return;
    }
    
    const city = getSelectedCityCode();
    console.log('Ciudad seleccionada:', city);
    
    if (!city) {
        console.error('No hay ciudad seleccionada');
        if (window.showNotification) {
            showNotification('Debe seleccionar una ciudad primero', 'warning');
        }
        return;
    }
    
    // Limpiar búsqueda
    const searchInput = document.getElementById('executiveSearchInput');
    if (searchInput) searchInput.value = '';
    
    // Cargar ejecutivos
    loadExecutivesForCity(city);
    
    // Configurar cierre al hacer clic fuera (solo una vez)
    const existingHandler = modal._clickHandler;
    if (existingHandler) {
        modal.removeEventListener('click', existingHandler);
    }
    
    const clickHandler = function(e) {
        if (e.target === modal) {
            hideSelectExecutiveModal();
        }
    };
    modal._clickHandler = clickHandler;
    modal.addEventListener('click', clickHandler);
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideSelectExecutiveModal() {
    const modal = document.getElementById('selectExecutiveModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function loadExecutivesForCity(city) {
    console.log('=== CARGANDO EJECUTIVOS PARA CIUDAD ===', city);
    const executivesList = document.getElementById('executivesList');
    if (!executivesList) {
        console.error('No se encontró el elemento executivesList');
        return;
    }
    
    if (!city) {
        console.error('No se proporcionó una ciudad');
        executivesList.innerHTML = '<div class="no-executives-message">No se ha seleccionado una ciudad</div>';
        return;
    }
    
    try {
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        console.log('Datos de localStorage:', empleadosByCity ? 'Encontrados' : 'No encontrados');
        
        if (!empleadosByCity) {
            console.log('No hay datos en localStorage con clave empleadosByCity');
            executivesList.innerHTML = '<div class="no-executives-message">No hay ejecutivos disponibles. Por favor, asegúrese de tener empleados creados en la ciudad seleccionada.</div>';
            return;
        }
        
        const data = JSON.parse(empleadosByCity);
        console.log('Datos parseados:', data);
        console.log('Ciudades disponibles:', Object.keys(data || {}));
        
        if (!data || typeof data !== 'object') {
            console.error('Los datos no son un objeto válido:', data);
            executivesList.innerHTML = '<div class="no-executives-message">Error: formato de datos inválido</div>';
            return;
        }
        
        const empleados = data[city] || {};
        console.log(`Empleados para ciudad ${city}:`, empleados);
        console.log(`Número de empleados: ${Object.keys(empleados).length}`);
        
        if (Object.keys(empleados).length === 0) {
            console.log(`No hay empleados para la ciudad ${city}`);
            console.log('Ciudades disponibles:', Object.keys(data));
            executivesList.innerHTML = `<div class="no-executives-message">No hay ejecutivos disponibles para la ciudad ${city}.<br>Ciudades disponibles: ${Object.keys(data).join(', ') || 'Ninguna'}</div>`;
            return;
        }
        
        // Convertir a array y ordenar
        const empleadosArray = Object.entries(empleados)
            .map(([id, empleado]) => {
                if (!empleado || typeof empleado !== 'object') {
                    console.warn('Empleado inválido:', id, empleado);
                    return null;
                }
                return {
                    id: id,
                    identificacion: empleado.identificacion || empleado.numeroId || id,
                    empleado: empleado
                };
            })
            .filter(item => item !== null); // Filtrar elementos nulos
        
        console.log('Array de empleados procesado:', empleadosArray);
        console.log(`Total de empleados válidos: ${empleadosArray.length}`);
        
        // Guardar para filtrado
        window._allExecutives = empleadosArray;
        
        // Validar que sea un array antes de renderizar
        if (Array.isArray(empleadosArray) && empleadosArray.length > 0) {
            console.log('Renderizando lista de ejecutivos...');
            renderExecutivesList(empleadosArray);
        } else {
            console.error('empleadosArray no es un array válido o está vacío:', empleadosArray);
            executivesList.innerHTML = '<div class="no-executives-message">No se pudieron procesar los ejecutivos</div>';
        }
    } catch (error) {
        console.error('Error cargando ejecutivos:', error);
        console.error('Stack trace:', error.stack);
        executivesList.innerHTML = `<div class="no-executives-message">Error al cargar ejecutivos: ${error.message}</div>`;
    }
}

function renderExecutivesList(executivosParam) {
    console.log('renderExecutivesList llamado con:', executivosParam);
    const executivesList = document.getElementById('executivesList');
    if (!executivesList) {
        console.error('No se encontró executivesList');
        return;
    }
    
    // Validar que ejecutivos sea un array
    if (!Array.isArray(executivosParam)) {
        console.error('renderExecutivesList: ejecutivos no es un array', executivosParam);
        executivesList.innerHTML = '<div class="no-executives-message">Error: datos inválidos</div>';
        return;
    }
    
    if (executivosParam.length === 0) {
        executivesList.innerHTML = '<div class="no-executives-message">No se encontraron ejecutivos</div>';
        return;
    }
    
    executivesList.innerHTML = '';
    
    try {
        executivosParam.forEach((item) => {
            if (!item || !item.empleado) {
                console.warn('Item de ejecutivo inválido:', item);
                return;
            }
            
            const empleado = item.empleado;
            let nombreCompleto = '';
            try {
                nombreCompleto = buildExecutiveFullName(empleado);
            } catch (e) {
                console.error('Error construyendo nombre completo:', e);
                nombreCompleto = 'Nombre no disponible';
            }
            
            const identificacion = item.identificacion || item.id || '';
            
            // Escapar comillas simples y dobles para evitar problemas en el HTML
            const nombreEscapado = String(nombreCompleto).replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ').replace(/\r/g, '');
            const idEscapado = String(identificacion).replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ').replace(/\r/g, '');
            
            const executiveItem = document.createElement('div');
            executiveItem.className = 'executive-item';
            
            const executiveInfo = document.createElement('div');
            executiveInfo.className = 'executive-info';
            
            const executiveId = document.createElement('div');
            executiveId.className = 'executive-id';
            executiveId.textContent = idEscapado;
            
            const executiveName = document.createElement('div');
            executiveName.className = 'executive-name';
            executiveName.textContent = nombreEscapado;

            // Cargo del ejecutivo (si existe)
            const executiveCargo = document.createElement('div');
            executiveCargo.className = 'executive-cargo';
            try {
                const cargoCodigo = empleado.cargo || empleado.cargoCodigo || '';
                const area = empleado.area || '';
                if (cargoCodigo) {
                    if (typeof getCargoNombre === 'function') {
                        executiveCargo.textContent = getCargoNombre(cargoCodigo, area);
                    } else {
                        executiveCargo.textContent = cargoCodigo;
                    }
                } else {
                    executiveCargo.textContent = '';
                }
            } catch(e) {
                console.error('Error obteniendo cargo del ejecutivo:', e);
                executiveCargo.textContent = '';
            }
            
            executiveInfo.appendChild(executiveId);
            executiveInfo.appendChild(executiveName);
            executiveInfo.appendChild(executiveCargo);
            
            const selectButton = document.createElement('button');
            selectButton.type = 'button';
            selectButton.className = 'btn-select-executive-item';
            selectButton.innerHTML = '<i class="fas fa-check"></i> Seleccionar';
            selectButton.onclick = function() {
                selectExecutive(idEscapado, nombreEscapado);
            };
            
            executiveItem.appendChild(executiveInfo);
            executiveItem.appendChild(selectButton);
            executivesList.appendChild(executiveItem);
        });
        
        console.log(`Se renderizaron ${executivosParam.length} ejecutivos`);
    } catch (error) {
        console.error('Error en renderExecutivesList:', error);
        console.error('Stack:', error.stack);
        executivesList.innerHTML = `<div class="no-executives-message">Error al renderizar ejecutivos: ${error.message}</div>`;
    }
}

function selectExecutive(identificacion, nombreCompleto) {
    const isTransferSelection = !!window._selectingTransferExecutive;

    if (isTransferSelection) {
        // Seleccionando ejecutivo al que se transferirán las cuentas.
        const transferInput = document.getElementById('transferExecutiveId');
        if (transferInput) {
            transferInput.value = identificacion;
        }

        // Buscar el ejecutivo completo para obtener toda su información
        const result = findExecutiveInAllCities(identificacion);
        let nombreCompletoFinal = nombreCompleto;
        
        if (result) {
            nombreCompletoFinal = buildExecutiveFullName(result.empleado);
            window._transferExecutive = {
                id: identificacion,
                ciudad: result.ciudad,
                empleado: result.empleado
            };
        } else {
            // Si no se encuentra, guardar información básica
            window._transferExecutive = {
                id: identificacion,
                ciudad: typeof getSelectedCityCode === 'function' ? getSelectedCityCode() : null,
                empleado: {
                    nombreCompleto: nombreCompleto
                }
            };
        }

        // Mostrar el nombre del ejecutivo de transferencia si existe un campo para ello
        const transferExecutiveNameInput = document.getElementById('transferExecutiveName');
        if (transferExecutiveNameInput) {
            transferExecutiveNameInput.value = nombreCompletoFinal;
        }

        // Cerrar modal
        hideSelectExecutiveModal();

        if (window.showNotification) {
            showNotification('Ejecutivo de transferencia seleccionado correctamente', 'success');
        }

        // Mostrar botón de transferir una vez se muestre la información del ejecutivo
        updateTransferAndSaveButtonsVisibility();

        // Resetear flag
        window._selectingTransferExecutive = false;
        return;
    }

    // Selección normal de ejecutivo (asignación)
    // Limpiar datos del ejecutivo anterior solo si NO estamos en modo edición
    if (!window._editingExecutiveId) {
        // Limpiar lista de cuentas asignadas
        assignedAccounts = [];
        updateAccountsList();
        updateTotals();
        
        // Limpiar campo de transferir ejecutivo
        const transferInput = document.getElementById('transferExecutiveId');
        if (transferInput) {
            transferInput.value = '';
        }
        const transferExecutiveNameInput = document.getElementById('transferExecutiveName');
        if (transferExecutiveNameInput) {
            transferExecutiveNameInput.value = '';
        }
        window._transferExecutive = null;
        
        // Ocultar botón de transferir
        updateTransferAndSaveButtonsVisibility();
        
        // Limpiar fechas
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';
    }
    
    const executiveIdInput = document.getElementById('executiveId');
    const executiveNameInput = document.getElementById('executiveName');
    
    if (executiveIdInput) {
        executiveIdInput.value = identificacion;
    }
    
    if (executiveNameInput) {
        executiveNameInput.value = nombreCompleto;
    }
    
    // Cerrar modal
    hideSelectExecutiveModal();
    
    if (window.showNotification) {
        showNotification('Ejecutivo seleccionado correctamente', 'success');
    }

    // Asegurarnos de que la bandera quede limpia por si acaso
    window._selectingTransferExecutive = false;
}

function filterExecutives(searchTerm) {
    if (!window._allExecutives || !Array.isArray(window._allExecutives)) {
        console.warn('filterExecutives: No hay ejecutivos cargados');
        return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
        renderExecutivesList(window._allExecutives);
        return;
    }
    
    const filtered = window._allExecutives.filter(item => {
        if (!item || !item.empleado) return false;
        
        const empleado = item.empleado;
        const nombreCompleto = buildExecutiveFullName(empleado).toLowerCase();
        const identificacion = String(item.identificacion || item.id || '').toLowerCase();
        
        return identificacion.includes(term) || nombreCompleto.includes(term);
    });
    
    renderExecutivesList(filtered);
}

/**
 * Actualiza la visibilidad del botón de transferir
 * según si hay un ejecutivo de transferencia seleccionado
 * Los botones de Guardar y Actualizar siempre permanecen visibles
 */
function updateTransferAndSaveButtonsVisibility() {
    const transferInput = document.getElementById('transferExecutiveId');
    const bTransferAccounts = document.getElementById('bTransferAccounts');
    const transferButtonContainer = document.getElementById('transferButtonContainer');
    
    const hasTransferExecutive = transferInput && transferInput.value.trim() !== '';
    
    // Mostrar/ocultar el botón de transferir en la parte inferior (bTransferAccounts)
    if (bTransferAccounts) {
        bTransferAccounts.style.display = hasTransferExecutive ? 'block' : 'none';
    }
    
    // Mostrar/ocultar el botón de transferir después de la información del ejecutivo
    if (transferButtonContainer) {
        transferButtonContainer.style.display = hasTransferExecutive ? 'block' : 'none';
    }
}

/**
 * Muestra el modal de confirmación para transferir cuentas
 */
function showConfirmTransferModal() {
    const modal = document.getElementById('confirmCreateAssignmentModal');
    const messageElement = document.getElementById('confirmAssignmentMessage');
    
    if (!modal) {
        console.error('No se encontró el modal de confirmación');
        return;
    }
    
    // Actualizar mensaje para transferencia
    if (messageElement && window._readyToSaveAccounts) {
        const transferName = window._readyToSaveAccounts.transferExecutiveName || 'el ejecutivo seleccionado';
        messageElement.textContent = `¿Está segur@ que desea transferir ${window._readyToSaveAccounts.totalAccounts || 0} cuenta(s) a ${transferName}?`;
    }
    
    // Marcar que es una transferencia
    window._isTransferOperation = true;
    
    modal.style.display = 'flex';
}

// Esta función ya no se usa, se reemplazó por el modal de selección

function findExecutiveInAllCities(identificacion) {
    try {
        const empleadosByCity = localStorage.getItem('empleadosByCity');
        if (!empleadosByCity) {
            console.log('No hay empleadosByCity en localStorage');
            return null;
        }
        
        const data = JSON.parse(empleadosByCity);
        const idBuscado = String(identificacion).trim();
        const idBuscadoNum = idBuscado.replace(/\D/g, '');
        
        console.log('Buscando ejecutivo con identificación:', idBuscado);
        
        // Buscar en todas las ciudades
        for (const [cityCode, empleados] of Object.entries(data)) {
            if (!empleados || typeof empleados !== 'object') continue;
            
            // Buscar coincidencia exacta primero (por clave del objeto)
            if (empleados[idBuscado]) {
                console.log('Ejecutivo encontrado por coincidencia exacta de clave en ciudad:', cityCode);
                return { empleado: empleados[idBuscado], ciudad: cityCode };
            }
            
            // Buscar por coincidencia numérica o parcial en las claves y campos del empleado
            for (const [id, empleado] of Object.entries(empleados)) {
                if (!empleado || typeof empleado !== 'object') continue;
                
                const idNormalizado = String(id).trim();
                const idSoloNumeros = idNormalizado.replace(/\D/g, '');
                
                // Comparar con la clave del objeto
                if (idNormalizado === idBuscado || 
                    (idSoloNumeros && idSoloNumeros === idBuscadoNum && idBuscadoNum.length > 0) ||
                    idNormalizado.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '')) {
                    console.log('Ejecutivo encontrado por coincidencia de clave en ciudad:', cityCode);
                    return { empleado, ciudad: cityCode };
                }
                
                // Comparar con diferentes campos de identificación del empleado
                const camposIdentificacion = [
                    empleado.identificacion,
                    empleado.numeroId,
                    empleado.tipoId ? `${empleado.tipoId}${empleado.numeroId}` : null
                ].filter(Boolean);
                
                for (const campoId of camposIdentificacion) {
                    const empId = String(campoId).trim();
                    const empIdNum = empId.replace(/\D/g, '');
                    
                    if (empId === idBuscado || 
                        (empIdNum && empIdNum === idBuscadoNum && idBuscadoNum.length > 0) ||
                        empId.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '')) {
                        console.log('Ejecutivo encontrado por campo de identificación en ciudad:', cityCode);
                        return { empleado, ciudad: cityCode };
                    }
                }
            }
        }
        
        console.log('No se encontró ejecutivo con identificación:', idBuscado);
        return null;
    } catch(e) {
        console.error('Error buscando ejecutivo:', e);
        return null;
    }
}

function buildExecutiveFullName(empleado) {
    const nombreCompleto = [
        empleado.tPrimerApellido || empleado.primerApellido || empleado.apellido1,
        empleado.tSegundoApellido || empleado.segundoApellido || empleado.apellido2,
        empleado.tPrimerNombre || empleado.primerNombre || empleado.nombre1,
        empleado.tSegundoNombre || empleado.segundoNombre || empleado.nombre2
    ].filter(Boolean).join(' ').toUpperCase();
    
    // Si no se puede construir el nombre completo, intentar otros campos
    if (!nombreCompleto || nombreCompleto.trim() === '') {
        return (empleado.nombre || empleado.nombreCompleto || '').toUpperCase();
    }
    
    return nombreCompleto;
}

/**
 * Obtiene el nombre completo del cargo a partir del código y el área.
 * Si no encuentra coincidencia, devuelve el código en mayúsculas.
 */
function getCargoNombre(cargoCodigo, area) {
    const cargosPorArea = {
        administrativo: [
            { codigo: 'EC', nombre: 'EJECUTIVO DE CUENTA' },
            { codigo: 'EA', nombre: 'EJECUTIVO ADMON' },
            { codigo: 'EP', nombre: 'EJECUTIVO PREJURIDICO' },
            { codigo: 'EJ', nombre: 'EJECUTIVO JURIDICO' },
            { codigo: 'SP', nombre: 'SUPERVISOR DE CARTERA' },
            { codigo: 'SN', nombre: 'SUPERVISOR NACIONAL DE CARTERA' },
            { codigo: 'C',  nombre: 'CASTIGO CARTERA' },
            { codigo: 'PV', nombre: 'PROXIMA VIGENCIA' },
            { codigo: 'V',  nombre: 'VERIFICADOR' }
        ],
        pyf: [
            { codigo: 'AS', nombre: 'ASESOR' },
            { codigo: 'SU', nombre: 'SUPERVISOR' },
            { codigo: 'SG', nombre: 'SUB GERENTE' },
            { codigo: 'GT', nombre: 'GERENTE' },
            { codigo: 'DR', nombre: 'DIRECTOR' },
            { codigo: 'SN', nombre: 'DIRECTOR SUB NACIONAL' },
            { codigo: 'DN', nombre: 'DIRECTOR NACIONAL' }
        ],
        servicio: [
            { codigo: 'TU', nombre: 'TUTOR' },
            { codigo: 'MO', nombre: 'MONITOR TUTORIAS' },
            { codigo: 'CN', nombre: 'COORDINADOR NACIONAL DE TUTORIAS' }
        ]
    };
    
    let cargo;
    const codigo = (cargoCodigo || '').toUpperCase();
    
    if (area && cargosPorArea[area]) {
        cargo = cargosPorArea[area].find(c => c.codigo === codigo);
    } else {
        for (const areaKey in cargosPorArea) {
            cargo = cargosPorArea[areaKey].find(c => c.codigo === codigo);
            if (cargo) break;
        }
    }
    
    return cargo ? cargo.nombre : codigo;
}

function clearExecutiveData() {
    const executiveNameInput = document.getElementById('executiveName');
    if (executiveNameInput) {
        executiveNameInput.value = '';
    }
}

// ========================================
// FUNCIONES DE SELECCIÓN DE FACTURAS
// ========================================

function showSelectInvoicesModal() {
    console.log('=== MOSTRANDO MODAL DE SELECCIÓN DE FACTURAS ===');
    const modal = document.getElementById('selectInvoicesModal');
    if (!modal) {
        console.error('No se encontró el modal selectInvoicesModal');
        return;
    }
    
    const executiveId = document.getElementById('executiveId')?.value.trim();
    const executiveName = document.getElementById('executiveName')?.value.trim();
    
    if (!executiveId || !executiveName) {
        if (window.showNotification) {
            showNotification('Debe seleccionar un ejecutivo primero', 'warning');
        }
        return;
    }
    
    // Limpiar búsqueda
    const searchInput = document.getElementById('invoiceSearchInput');
    if (searchInput) searchInput.value = '';
    
    // Limpiar selecciones anteriores
    window._selectedInvoices = [];
    
    // Cargar facturas del ejecutivo
    loadInvoicesForExecutive(executiveId, executiveName);
    
    // Configurar cierre al hacer clic fuera
    const existingHandler = modal._clickHandler;
    if (existingHandler) {
        modal.removeEventListener('click', existingHandler);
    }
    
    const clickHandler = function(e) {
        if (e.target === modal) {
            hideSelectInvoicesModal();
        }
    };
    modal._clickHandler = clickHandler;
    modal.addEventListener('click', clickHandler);
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideSelectInvoicesModal() {
    const modal = document.getElementById('selectInvoicesModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function loadInvoicesForExecutive(executiveId, executiveName) {
    console.log('=== CARGANDO FACTURAS PARA EJECUTIVO ===', executiveId, executiveName);
    const invoicesList = document.getElementById('invoicesList');
    if (!invoicesList) {
        console.error('No se encontró el elemento invoicesList');
        return;
    }
    
    const city = getSelectedCityCode();
    if (!city) {
        console.error('No hay ciudad seleccionada');
        invoicesList.innerHTML = '<div class="no-executives-message">No se ha seleccionado una ciudad</div>';
        return;
    }
    
    try {
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            console.log('No hay facturas en localStorage');
            invoicesList.innerHTML = '<div class="no-executives-message">No hay facturas disponibles</div>';
            return;
        }
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        console.log(`Total de facturas en ciudad ${city}:`, invoices.length);

        // ✅ Antes solo se filtraban las facturas del ejecutivo y por eso salía "sin facturas"
        // ✅ Ahora dejamos disponibles TODAS las facturas de la ciudad:
        //    - Puedes ver las del ejecutivo seleccionado
        //    - También puedes buscar y asignar facturas que originalmente pertenecen a otros ejecutivos

        if (invoices.length === 0) {
            invoicesList.innerHTML = '<div class="no-executives-message">No hay facturas disponibles para la ciudad seleccionada</div>';
            window._allInvoices = [];
            updateSelectedInvoicesCount();
            return;
        }

        // Guardar todas las facturas de la ciudad para el buscador del modal
        window._allInvoices = invoices;
        
        renderInvoicesList(invoices);
        updateSelectedInvoicesCount();
    } catch (error) {
        console.error('Error cargando facturas:', error);
        invoicesList.innerHTML = `<div class="no-executives-message">Error al cargar facturas: ${error.message}</div>`;
    }
}

function renderInvoicesList(invoices) {
    const invoicesList = document.getElementById('invoicesList');
    if (!invoicesList) return;
    
    if (!Array.isArray(invoices) || invoices.length === 0) {
        invoicesList.innerHTML = '<div class="no-executives-message">No se encontraron facturas</div>';
        return;
    }
    
    invoicesList.innerHTML = '';
    
    invoices.forEach((invoice) => {
        const invoiceNumber = invoice.invoiceNumber || '';
        const invoiceValue = invoice.value || invoice.total || invoice.amount || 0;
        const formattedValue = formatCurrency(invoiceValue);
        const clientName = invoice.clientName || '';
        const invoiceDate = invoice.date || '';
        
        // Verificar si ya está agregada
        const isAlreadyAdded = assignedAccounts.some(acc => acc.invoiceNumber === invoiceNumber);
        
        const invoiceItem = document.createElement('div');
        invoiceItem.className = 'invoice-item';
        if (isAlreadyAdded) {
            invoiceItem.classList.add('already-added');
        }
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'invoice-checkbox';
        checkbox.value = invoiceNumber;
        checkbox.id = `invoice-${invoiceNumber}`;
        checkbox.disabled = isAlreadyAdded;
        checkbox.addEventListener('change', function() {
            updateSelectedInvoicesCount();
        });
        
        const label = document.createElement('label');
        label.htmlFor = `invoice-${invoiceNumber}`;
        label.className = 'invoice-label';
        
        const invoiceInfo = document.createElement('div');
        invoiceInfo.className = 'invoice-info';
        
        const invoiceNumberDiv = document.createElement('div');
        invoiceNumberDiv.className = 'invoice-number-display';
        invoiceNumberDiv.textContent = `Factura #${invoiceNumber}`;
        
        const invoiceDetails = document.createElement('div');
        invoiceDetails.className = 'invoice-details';
        invoiceDetails.innerHTML = `
            <span class="invoice-client">${clientName || 'Sin cliente'}</span>
            <span class="invoice-value">$${formattedValue}</span>
            ${invoiceDate ? `<span class="invoice-date">${formatDate(invoiceDate)}</span>` : ''}
        `;
        
        if (isAlreadyAdded) {
            const alreadyAddedBadge = document.createElement('span');
            alreadyAddedBadge.className = 'already-added-badge';
            alreadyAddedBadge.textContent = 'Ya agregada';
            invoiceInfo.appendChild(alreadyAddedBadge);
        }
        
        invoiceInfo.appendChild(invoiceNumberDiv);
        invoiceInfo.appendChild(invoiceDetails);
        label.appendChild(invoiceInfo);
        
        invoiceItem.appendChild(checkbox);
        invoiceItem.appendChild(label);
        invoicesList.appendChild(invoiceItem);
    });
}

function filterInvoices(searchTerm) {
    if (!window._allInvoices || !Array.isArray(window._allInvoices)) {
        return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
        renderInvoicesList(window._allInvoices);
        return;
    }
    
    const filtered = window._allInvoices.filter(invoice => {
        const invoiceNumber = String(invoice.invoiceNumber || '').toLowerCase();
        const clientName = String(invoice.clientName || '').toLowerCase();
        return invoiceNumber.includes(term) || clientName.includes(term);
    });
    
    renderInvoicesList(filtered);
}

function updateSelectedInvoicesCount() {
    const checkboxes = document.querySelectorAll('.invoice-checkbox:checked:not(:disabled)');
    const count = checkboxes.length;
    const countSpan = document.getElementById('selectedInvoicesCount');
    if (countSpan) {
        countSpan.textContent = count;
    }
}

function confirmInvoicesSelection() {
    const checkboxes = document.querySelectorAll('.invoice-checkbox:checked:not(:disabled)');
    
    if (checkboxes.length === 0) {
        if (window.showNotification) {
            showNotification('Por favor seleccione al menos una factura', 'warning');
        }
        return;
    }
    
    const city = getSelectedCityCode();
    if (!city) {
        if (window.showNotification) {
            showNotification('No hay ciudad seleccionada', 'warning');
        }
        return;
    }
    
    try {
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            if (window.showNotification) {
                showNotification('No hay facturas disponibles', 'error');
            }
            return;
        }
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        let addedCount = 0;
        
        checkboxes.forEach(checkbox => {
            const invoiceNumber = checkbox.value;
            
            // Verificar si ya está agregada
            if (assignedAccounts.some(acc => acc.invoiceNumber === invoiceNumber)) {
                return;
            }
            
            // Buscar la factura completa
            const invoice = invoices.find(inv => String(inv.invoiceNumber || '').trim() === invoiceNumber);
            
                if (invoice) {
                    const invoiceValue = invoice.value || invoice.total || invoice.amount || 0;
                    
                    // Guardamos el valor numérico real y no el texto formateado
                    const account = {
                        invoiceNumber: invoiceNumber,
                        value: Number(invoiceValue) || 0,
                        id: Date.now() + Math.random() // ID único
                    };
                    
                    assignedAccounts.push(account);
                    addedCount++;
                }
        });
        
        if (addedCount > 0) {
            updateAccountsList();
            updateTotals();
            hideSelectInvoicesModal();
            
            if (window.showNotification) {
                showNotification(`${addedCount} factura(s) agregada(s) correctamente`, 'success');
            }
        } else {
            if (window.showNotification) {
                showNotification('No se pudieron agregar las facturas', 'warning');
            }
        }
    } catch (error) {
        console.error('Error agregando facturas:', error);
        if (window.showNotification) {
            showNotification('Error al agregar facturas', 'error');
        }
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return dateString;
    }
}

// ========================================
// FUNCIONES DE FACTURAS Y CUENTAS
// ========================================

function searchInvoiceAndLoadValue(invoiceNumber) {
    if (!invoiceNumber || invoiceNumber.trim() === '') {
        // Si está vacío, mostrar el total de cuentas agregadas
        updateTotals();
        return;
    }
    
    const city = getSelectedCityCode();
    if (!city) {
        console.log('No hay ciudad seleccionada');
        return;
    }
    
    try {
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            console.log('No hay facturas en localStorage');
            return;
        }
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        const invoiceNum = String(invoiceNumber).trim();
        
        // Buscar factura por número (comparar con y sin ceros a la izquierda)
        const invoice = invoices.find(inv => {
            const invNum = String(inv.invoiceNumber || '').trim();
            return invNum === invoiceNum || 
                   invNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '') ||
                   invNum === invoiceNum.padStart(8, '0') ||
                   invNum.padStart(8, '0') === invoiceNum;
        });
        
        if (invoice) {
            // Obtener el valor de la factura para mostrar temporalmente
            const invoiceValue = invoice.value || invoice.total || invoice.amount || 0;
            // No actualizamos el campo assignedValue aquí porque debe mostrar el total
            // El valor se guardará cuando se agregue la cuenta
        } else {
            // Si no se encuentra, no hacer nada (mantener el total)
        }
    } catch (error) {
        console.error('Error buscando factura:', error);
    }
}

function addAccountToExecutive() {
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    
    if (!invoiceNumberInput) return;
    
    const invoiceNumber = invoiceNumberInput.value.trim();
    
    if (!invoiceNumber) {
        if (window.showNotification) {
            showNotification('Por favor ingrese un número de factura', 'warning');
        }
        return;
    }
    
    // Verificar si la factura ya está agregada
    const exists = assignedAccounts.some(acc => acc.invoiceNumber === invoiceNumber);
    if (exists) {
        if (window.showNotification) {
            showNotification('Esta factura ya está agregada', 'warning');
        }
        return;
    }
    
    // Buscar el valor de la factura
    const city = getSelectedCityCode();
    let invoiceValue = 0;
    
    if (city) {
        try {
            const invoicesRaw = localStorage.getItem('invoicesByCity');
            if (invoicesRaw) {
                const invoicesByCity = JSON.parse(invoicesRaw);
                const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
                const invoiceNum = String(invoiceNumber).trim();
                
                const invoice = invoices.find(inv => {
                    const invNum = String(inv.invoiceNumber || '').trim();
                    return invNum === invoiceNum || 
                           invNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '') ||
                           invNum === invoiceNum.padStart(8, '0') ||
                           invNum.padStart(8, '0') === invoiceNum;
                });
                
                if (invoice) {
                    invoiceValue = invoice.value || invoice.total || invoice.amount || 0;
                }
            }
        } catch (error) {
            console.error('Error obteniendo valor de factura:', error);
        }
    }
    
    // Agregar cuenta a la lista (guardar valor numérico real)
    const account = {
        invoiceNumber: invoiceNumber,
        value: Number(invoiceValue) || 0,
        id: Date.now() // ID único para eliminar después
    };
    
    assignedAccounts.push(account);
    
    // Limpiar campo de factura
    invoiceNumberInput.value = '';
    
    // Actualizar lista y totales
    updateAccountsList();
    updateTotals();
    
    if (window.showNotification) {
        showNotification('Cuenta agregada correctamente', 'success');
    }
}

function updateAccountsList() {
    const accountsList = document.getElementById('accountsList');
    const accountsSection = document.getElementById('assignedAccountsSection');
    const accountsCount = document.getElementById('accountsCount');
    
    if (!accountsList || !accountsSection) return;
    
    if (assignedAccounts.length === 0) {
        accountsSection.style.display = 'none';
        return;
    }
    
    accountsSection.style.display = 'block';
    
    if (accountsCount) {
        accountsCount.textContent = assignedAccounts.length;
    }
    
    // Limpiar lista anterior
    accountsList.innerHTML = '';
    
    // Mostrar lista por defecto cuando hay cuentas
    accountsList.style.display = 'block';
    
    // Crear elementos para cada cuenta
    assignedAccounts.forEach((account, index) => {
        const accountItem = document.createElement('div');
        accountItem.className = 'account-item';
        
        // Asegurar que tenemos un valor numérico
        const numericValue = typeof account.value === 'number'
            ? account.value
            : (parseFloat(String(account.value).replace(/[^0-9.-]/g, '')) || 0);

        accountItem.innerHTML = `
            <div class="account-info">
                <span class="account-number">Factura #${account.invoiceNumber}</span>
                <span class="account-value">$${formatCurrency(numericValue)}</span>
            </div>
            <button type="button" class="btn-remove-account" onclick="removeAccount(${account.id})" title="Eliminar cuenta">
                <i class="fas fa-times"></i>
            </button>
        `;
        accountsList.appendChild(accountItem);
    });
}

function removeAccount(accountId) {
    assignedAccounts = assignedAccounts.filter(acc => acc.id !== accountId);
    updateAccountsList();
    updateTotals();
    
    if (window.showNotification) {
        showNotification('Cuenta eliminada', 'info');
    }
}

function updateTotals() {
    const totalAccountsInput = document.getElementById('totalAccounts');
    const assignedValueInput = document.getElementById('assignedValue');
    
    // Actualizar total de cuentas
    if (totalAccountsInput) {
        totalAccountsInput.value = assignedAccounts.length;
    }
    
    // Calcular valor total asignado usando valores numéricos reales
    const totalValue = assignedAccounts.reduce((sum, acc) => {
        if (typeof acc.value === 'number') {
            return sum + acc.value;
        }
        // Compatibilidad por si hubiera registros antiguos en memoria
        const valueStr = String(acc.value).replace(/[^0-9.-]/g, '');
        const value = parseFloat(valueStr) || 0;
        return sum + value;
    }, 0);
    
    // Actualizar valor asignado total en el campo readonly
    if (assignedValueInput) {
        assignedValueInput.value = formatCurrency(totalValue);
    }
}

function toggleAccountsList() {
    const accountsList = document.getElementById('accountsList');
    const toggleIcon = document.getElementById('accountsToggleIcon');
    
    if (!accountsList || !toggleIcon) return;
    
    const isVisible = accountsList.style.display === 'block';
    accountsList.style.display = isVisible ? 'none' : 'block';
    
    if (isVisible) {
        toggleIcon.classList.remove('fa-chevron-up');
        toggleIcon.classList.add('fa-chevron-down');
    } else {
        toggleIcon.classList.remove('fa-chevron-down');
        toggleIcon.classList.add('fa-chevron-up');
    }
}

function formatCurrency(value) {
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numValue);
}

function hideAssignAccountsByExecutiveModal() {
    const modal = document.getElementById('assignAccountsByExecutiveModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.zIndex = '';
        // Limpiar flag de edición al cerrar el modal
        window._editingExecutiveId = null;
        
        // Limpiar campo de transferencia y banderas relacionadas
        const transferInput = document.getElementById('transferExecutiveId');
        if (transferInput) {
            transferInput.value = '';
        }
        const transferExecutiveNameInput = document.getElementById('transferExecutiveName');
        if (transferExecutiveNameInput) {
            transferExecutiveNameInput.value = '';
        }
        window._transferExecutive = null;
        window._isTransferOperation = false;
        
        // Actualizar visibilidad de botones
        updateTransferAndSaveButtonsVisibility();
        
        // Restaurar texto del botón a "Guardar"
        const saveButton = document.getElementById('bSaveAccounts');
        if (saveButton) {
            saveButton.textContent = 'Guardar';
        }
        
        // Si el modal de resultados estaba abierto, volver a mostrarlo
        if (window._searchResultsModalOpen) {
            const resultsModal = document.getElementById('searchResultsModal');
            if (resultsModal) {
                resultsModal.style.display = 'flex';
                resultsModal.style.zIndex = '2000';
            }
        }
    }
}

// ========================================
// FUNCIONES DE OPERACIONES
// ========================================

function loadAssignments() {
    const tableBody = document.getElementById('assignInvoiceTableBody');
    if (!tableBody) return;

    const city = getSelectedCityCode();

    try {
        const raw = localStorage.getItem('assignmentsByCity');
        const assignmentsByCity = raw ? JSON.parse(raw) : {};
        const assignments = city && Array.isArray(assignmentsByCity[city]) ? assignmentsByCity[city] : [];

        if (!city || assignments.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-file-invoice"></i>
                            <p>No existen registros de asignaciones de factura</p>
                            <small>Haz clic en "Asignar por Factura" para crear el primer registro</small>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = '';

        // Agrupar por ejecutivo para que cada ejecutivo salga en una sola fila
        const groupedByExecutive = {};

        assignments.forEach(asg => {
            const execId = asg.executiveId || 'SIN_ID';
            const key = execId + '|' + (asg.executiveName || '');

            // Compatibilidad: soportar registros antiguos y nuevos
            const valueSource = (asg.totalValue != null) ? asg.totalValue : asg.value;
            const valueNumeric = typeof valueSource === 'number'
                ? valueSource
                : (parseFloat(String(valueSource).replace(/[^0-9.-]/g, '')) || 0);

            // Número de cuentas: usar el campo nuevo o asumir 1 si es un registro antiguo por factura
            const accountsCount = (typeof asg.accountsCount === 'number' && !isNaN(asg.accountsCount))
                ? asg.accountsCount
                : (asg.invoiceNumber ? 1 : 0);

            if (!groupedByExecutive[key]) {
                groupedByExecutive[key] = {
                    executiveId: asg.executiveId || '',
                    executiveName: asg.executiveName || '',
                    year: asg.year || '',
                    month: asg.month || '',
                    assignmentDate: asg.assignmentDate || '',
                    dateFrom: asg.dateFrom || asg.assignmentDate || '',
                    dateTo: asg.dateTo || asg.assignmentDate || '',
                    accountsCount: accountsCount,
                    totalValue: valueNumeric
                };
            } else {
                const g = groupedByExecutive[key];
                // Mantener la fecha de asignación más reciente
                if (asg.assignmentDate && (!g.assignmentDate || new Date(asg.assignmentDate) > new Date(g.assignmentDate))) {
                    g.assignmentDate = asg.assignmentDate;
                }
                // Fecha inicial: la más antigua, fecha final: la más reciente
                if (asg.dateFrom && (!g.dateFrom || new Date(asg.dateFrom) < new Date(g.dateFrom))) {
                    g.dateFrom = asg.dateFrom;
                }
                if (asg.dateTo && (!g.dateTo || new Date(asg.dateTo) > new Date(g.dateTo))) {
                    g.dateTo = asg.dateTo;
                }
                g.accountsCount += accountsCount;
                g.totalValue += valueNumeric;
            }
        });

        Object.values(groupedByExecutive).forEach(row => {
            const tr = document.createElement('tr');

            // Año y mes: usar los campos guardados o derivar de la fecha de asignación
            let year = row.year;
            let month = row.month;
            if ((!year || !month) && row.assignmentDate) {
                try {
                    const d = new Date(row.assignmentDate);
                    if (!isNaN(d.getTime())) {
                        year = year || String(d.getFullYear());
                        const monthNumber = d.getMonth() + 1;
                        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                        const monthLabel = `${String(monthNumber).padStart(2, '0')} - ${monthNames[monthNumber - 1]}`;
                        month = month || monthLabel;
                    }
                } catch (e) {
                    // ignorar
                }
            }

            const valueNumeric = typeof row.totalValue === 'number'
                ? row.totalValue
                : (parseFloat(String(row.totalValue).replace(/[^0-9.-]/g, '')) || 0);

            tr.innerHTML = `
                <td>${row.executiveId || ''}</td>
                <td>${row.executiveName || ''}</td>
                <td>${year || ''}</td>
                <td>${month || ''}</td>
                <td>${row.assignmentDate ? formatDate(row.assignmentDate) : ''}</td>
                <td>${row.dateFrom ? formatDate(row.dateFrom) : ''}</td>
                <td>${row.dateTo ? formatDate(row.dateTo) : ''}</td>
                <td>${row.accountsCount || 0}</td>
                <td>$${formatCurrency(valueNumeric)}</td>
                <td class="table-actions">
                    <button type="button" class="btn btn-table-action" title="Ver detalle" onclick="viewExecutiveAssignments('${row.executiveId || ''}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-table-action" title="Editar" onclick="editExecutiveAssignments('${row.executiveId || ''}')">
                        <i class="fas fa-pen"></i>
                    </button>
                </td>
            `;

            tableBody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error cargando asignaciones:', e);
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-triangle-exclamation"></i>
                        <p>Error al cargar las asignaciones de factura</p>
                        <small>Detalle técnico: ${e.message}</small>
                    </div>
                </td>
            </tr>
        `;
    }
}

function searchAssignment() {
    const searchType = document.getElementById('assignmentSearchType')?.value;
    const searchValue = document.getElementById('searchAssignmentValue')?.value.trim();
    
    if (!searchType || !searchValue) {
        if (window.showNotification) {
            showNotification('Por favor complete todos los campos de búsqueda', 'warning');
        }
        return;
    }
    
    const city = getSelectedCityCode();
    if (!city) {
        if (window.showNotification) {
            showNotification('Debe seleccionar una ciudad primero', 'warning');
        }
        return;
    }
    
    try {
        const raw = localStorage.getItem('assignmentsByCity');
        const assignmentsByCity = raw ? JSON.parse(raw) : {};
        const assignments = Array.isArray(assignmentsByCity[city]) ? assignmentsByCity[city] : [];
        
        let filteredAssignments = [];
        const searchTerm = searchValue.toLowerCase();
        
        if (searchType === 'invoiceNumber') {
            // Buscar por número de factura en las cuentas asignadas
            filteredAssignments = assignments.filter(asg => {
                if (Array.isArray(asg.accounts)) {
                    return asg.accounts.some(acc => {
                        const invoiceNum = String(acc.invoiceNumber || '').toLowerCase();
                        return invoiceNum.includes(searchTerm) || 
                               invoiceNum.replace(/^0+/, '') === searchTerm.replace(/^0+/, '');
                    });
                }
                // Compatibilidad con registros antiguos
                const invoiceNum = String(asg.invoiceNumber || '').toLowerCase();
                return invoiceNum.includes(searchTerm) || 
                       invoiceNum.replace(/^0+/, '') === searchTerm.replace(/^0+/, '');
            });
        } else if (searchType === 'executiveName') {
            // Buscar por nombre del ejecutivo
            filteredAssignments = assignments.filter(asg => {
                const execName = String(asg.executiveName || '').toLowerCase();
                return execName.includes(searchTerm);
            });
        } else if (searchType === 'executiveId') {
            // Buscar por identificación del ejecutivo
            const searchNum = searchTerm.replace(/\D/g, '');
            filteredAssignments = assignments.filter(asg => {
                const execId = String(asg.executiveId || '').trim();
                const execIdNum = execId.replace(/\D/g, '');
                return execId.toLowerCase().includes(searchTerm) || 
                       (execIdNum && execIdNum.includes(searchNum));
            });
        }
        
        // Filtrar resultados únicos por ejecutivo
        const uniqueExecutives = {};
        filteredAssignments.forEach(asg => {
            const execId = asg.executiveId || 'SIN_ID';
            const key = execId + '|' + (asg.executiveName || '');
            if (!uniqueExecutives[key]) {
                uniqueExecutives[key] = asg;
            }
        });
        
        // Mostrar resultados en el modal
        if (Object.keys(uniqueExecutives).length === 0) {
            if (window.showNotification) {
                showNotification('No se encontraron asignaciones con los criterios de búsqueda', 'info');
            }
            hideSearchAssignmentModal();
            return;
        }
        
        // Mostrar resultados en el modal de resultados
        showSearchResultsModal(Object.values(uniqueExecutives));
        
        hideSearchAssignmentModal();
    } catch (error) {
        console.error('Error en búsqueda:', error);
        if (window.showNotification) {
            showNotification('Error al realizar la búsqueda', 'error');
        }
    }
}

function showSearchResultsModal(filteredAssignments) {
    const modal = document.getElementById('searchResultsModal');
    const tableBody = document.getElementById('searchResultsTableBody');
    
    if (!modal || !tableBody) return;
    
    // Marcar que el modal de resultados está abierto
    window._searchResultsModalOpen = true;
    // Asegurar z-index apropiado
    modal.style.zIndex = '2000';
    
    // Agrupar por ejecutivo
    const groupedByExecutive = {};
    
    filteredAssignments.forEach(asg => {
        const execId = asg.executiveId || 'SIN_ID';
        const key = execId + '|' + (asg.executiveName || '');
        
        const valueSource = (asg.totalValue != null) ? asg.totalValue : asg.value;
        const valueNumeric = typeof valueSource === 'number'
            ? valueSource
            : (parseFloat(String(valueSource).replace(/[^0-9.-]/g, '')) || 0);
        
        const accountsCount = (typeof asg.accountsCount === 'number' && !isNaN(asg.accountsCount))
            ? asg.accountsCount
            : (asg.invoiceNumber ? 1 : 0);
        
        if (!groupedByExecutive[key]) {
            groupedByExecutive[key] = {
                executiveId: asg.executiveId || '',
                executiveName: asg.executiveName || '',
                year: asg.year || '',
                month: asg.month || '',
                assignmentDate: asg.assignmentDate || '',
                dateFrom: asg.dateFrom || asg.assignmentDate || '',
                dateTo: asg.dateTo || asg.assignmentDate || '',
                accountsCount: accountsCount,
                totalValue: valueNumeric
            };
        } else {
            const g = groupedByExecutive[key];
            if (asg.assignmentDate && (!g.assignmentDate || new Date(asg.assignmentDate) > new Date(g.assignmentDate))) {
                g.assignmentDate = asg.assignmentDate;
            }
            if (asg.dateFrom && (!g.dateFrom || new Date(asg.dateFrom) < new Date(g.dateFrom))) {
                g.dateFrom = asg.dateFrom;
            }
            if (asg.dateTo && (!g.dateTo || new Date(asg.dateTo) > new Date(g.dateTo))) {
                g.dateTo = asg.dateTo;
            }
            g.accountsCount += accountsCount;
            g.totalValue += valueNumeric;
        }
    });
    
    // Renderizar resultados
    tableBody.innerHTML = '';
    
    if (Object.keys(groupedByExecutive).length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron resultados</p>
                        <small>Intente con otro criterio de búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        Object.values(groupedByExecutive).forEach(row => {
            const tr = document.createElement('tr');
            
            let year = row.year;
            let month = row.month;
            if ((!year || !month) && row.assignmentDate) {
                try {
                    const d = new Date(row.assignmentDate);
                    if (!isNaN(d.getTime())) {
                        year = year || String(d.getFullYear());
                        const monthNumber = d.getMonth() + 1;
                        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                        const monthLabel = `${String(monthNumber).padStart(2, '0')} - ${monthNames[monthNumber - 1]}`;
                        month = month || monthLabel;
                    }
                } catch (e) {
                    // ignorar
                }
            }
            
            const valueNumeric = typeof row.totalValue === 'number'
                ? row.totalValue
                : (parseFloat(String(row.totalValue).replace(/[^0-9.-]/g, '')) || 0);
            
            tr.innerHTML = `
                <td>${row.executiveId || ''}</td>
                <td>${row.executiveName || ''}</td>
                <td>${year || ''}</td>
                <td>${month || ''}</td>
                <td>${row.assignmentDate ? formatDate(row.assignmentDate) : ''}</td>
                <td>${row.dateFrom ? formatDate(row.dateFrom) : ''}</td>
                <td>${row.dateTo ? formatDate(row.dateTo) : ''}</td>
                <td>${row.accountsCount || 0}</td>
                <td>$${formatCurrency(valueNumeric)}</td>
                <td class="table-actions">
                    <button type="button" class="btn btn-table-action" title="Ver detalle" onclick="viewExecutiveAssignmentsFromSearch('${row.executiveId || ''}');">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-table-action" title="Editar" onclick="editExecutiveAssignmentsFromSearch('${row.executiveId || ''}');">
                        <i class="fas fa-pen"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(tr);
        });
    }
    
    modal.style.display = 'flex';
}

function hideSearchResultsModal() {
    const modal = document.getElementById('searchResultsModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.zIndex = '';
        // Limpiar flag
        window._searchResultsModalOpen = false;
    }
}

function filterAssignmentsTable(filteredAssignments) {
    const tableBody = document.getElementById('assignInvoiceTableBody');
    if (!tableBody) return;
    
    const city = getSelectedCityCode();
    if (!city) return;
    
    try {
        const raw = localStorage.getItem('assignmentsByCity');
        const assignmentsByCity = raw ? JSON.parse(raw) : {};
        const allAssignments = Array.isArray(assignmentsByCity[city]) ? assignmentsByCity[city] : [];
        
        // Crear un Set con los IDs de ejecutivos que deben mostrarse
        const allowedExecutiveIds = new Set(filteredAssignments.map(a => a.executiveId));
        
        // Filtrar todas las asignaciones para mostrar solo las que coinciden
        const assignmentsToShow = allAssignments.filter(a => allowedExecutiveIds.has(a.executiveId));
        
        // Agrupar por ejecutivo
        const groupedByExecutive = {};
        
        assignmentsToShow.forEach(asg => {
            const execId = asg.executiveId || 'SIN_ID';
            const key = execId + '|' + (asg.executiveName || '');
            
            const valueSource = (asg.totalValue != null) ? asg.totalValue : asg.value;
            const valueNumeric = typeof valueSource === 'number'
                ? valueSource
                : (parseFloat(String(valueSource).replace(/[^0-9.-]/g, '')) || 0);
            
            const accountsCount = (typeof asg.accountsCount === 'number' && !isNaN(asg.accountsCount))
                ? asg.accountsCount
                : (asg.invoiceNumber ? 1 : 0);
            
            if (!groupedByExecutive[key]) {
                groupedByExecutive[key] = {
                    executiveId: asg.executiveId || '',
                    executiveName: asg.executiveName || '',
                    year: asg.year || '',
                    month: asg.month || '',
                    assignmentDate: asg.assignmentDate || '',
                    dateFrom: asg.dateFrom || asg.assignmentDate || '',
                    dateTo: asg.dateTo || asg.assignmentDate || '',
                    accountsCount: accountsCount,
                    totalValue: valueNumeric
                };
            } else {
                const g = groupedByExecutive[key];
                if (asg.assignmentDate && (!g.assignmentDate || new Date(asg.assignmentDate) > new Date(g.assignmentDate))) {
                    g.assignmentDate = asg.assignmentDate;
                }
                if (asg.dateFrom && (!g.dateFrom || new Date(asg.dateFrom) < new Date(g.dateFrom))) {
                    g.dateFrom = asg.dateFrom;
                }
                if (asg.dateTo && (!g.dateTo || new Date(asg.dateTo) > new Date(g.dateTo))) {
                    g.dateTo = asg.dateTo;
                }
                g.accountsCount += accountsCount;
                g.totalValue += valueNumeric;
            }
        });
        
        // Renderizar la tabla con los resultados filtrados
        tableBody.innerHTML = '';
        
        if (Object.keys(groupedByExecutive).length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-file-invoice"></i>
                            <p>No se encontraron asignaciones</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        Object.values(groupedByExecutive).forEach(row => {
            const tr = document.createElement('tr');
            
            let year = row.year;
            let month = row.month;
            if ((!year || !month) && row.assignmentDate) {
                try {
                    const d = new Date(row.assignmentDate);
                    if (!isNaN(d.getTime())) {
                        year = year || String(d.getFullYear());
                        const monthNumber = d.getMonth() + 1;
                        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                        const monthLabel = `${String(monthNumber).padStart(2, '0')} - ${monthNames[monthNumber - 1]}`;
                        month = month || monthLabel;
                    }
                } catch (e) {
                    // ignorar
                }
            }
            
            const valueNumeric = typeof row.totalValue === 'number'
                ? row.totalValue
                : (parseFloat(String(row.totalValue).replace(/[^0-9.-]/g, '')) || 0);
            
            tr.innerHTML = `
                <td>${row.executiveId || ''}</td>
                <td>${row.executiveName || ''}</td>
                <td>${year || ''}</td>
                <td>${month || ''}</td>
                <td>${row.assignmentDate ? formatDate(row.assignmentDate) : ''}</td>
                <td>${row.dateFrom ? formatDate(row.dateFrom) : ''}</td>
                <td>${row.dateTo ? formatDate(row.dateTo) : ''}</td>
                <td>${row.accountsCount || 0}</td>
                <td>$${formatCurrency(valueNumeric)}</td>
                <td class="table-actions">
                    <button type="button" class="btn btn-table-action" title="Ver detalle" onclick="viewExecutiveAssignments('${row.executiveId || ''}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-table-action" title="Editar" onclick="editExecutiveAssignments('${row.executiveId || ''}')">
                        <i class="fas fa-pen"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error filtrando tabla:', error);
    }
}

// ========================================
// DETALLE Y EDICIÓN DE ASIGNACIONES
// ========================================

function getAssignmentsByExecutive(executiveId) {
    const city = getSelectedCityCode();
    if (!city || !executiveId) return [];
    try {
        const raw = localStorage.getItem('assignmentsByCity');
        const assignmentsByCity = raw ? JSON.parse(raw) : {};
        const assignments = Array.isArray(assignmentsByCity[city]) ? assignmentsByCity[city] : [];
        return assignments.filter(a => a.executiveId === executiveId);
    } catch (e) {
        console.error('Error obteniendo asignaciones por ejecutivo:', e);
        return [];
    }
}

function viewExecutiveAssignments(executiveId) {
    const assignments = getAssignmentsByExecutive(executiveId);
    if (!assignments.length) {
        if (window.showNotification) {
            showNotification('No se encontraron asignaciones para este ejecutivo.', 'info');
        }
        return;
    }

    const modal = document.getElementById('assignmentDetailsModal');
    if (!modal) return;
    
    // Guardar el ID del ejecutivo para poder editarlo desde el modal de detalle
    modal.dataset.executiveId = executiveId;

    const execNameSpan = document.getElementById('detailExecutiveName');
    const periodSpan = document.getElementById('detailAssignmentPeriod');
    const totalAccountsSpan = document.getElementById('detailTotalAccounts');
    const totalValueSpan = document.getElementById('detailTotalValue');
    const tableBody = document.getElementById('assignmentDetailsTableBody');

    // Tomar datos generales del primer registro
    const first = assignments[0];
    if (execNameSpan) execNameSpan.textContent = first.executiveName || '';

    // Calcular fechas y totales globales
    let minDateFrom = null;
    let maxDateTo = null;
    let totalAccounts = 0;
    let totalValue = 0;
    const allAccounts = [];

    assignments.forEach(a => {
        const dateFrom = a.dateFrom || a.assignmentDate;
        const dateTo = a.dateTo || a.assignmentDate;

        if (dateFrom) {
            const dFrom = new Date(dateFrom);
            if (!minDateFrom || dFrom < minDateFrom) minDateFrom = dFrom;
        }
        if (dateTo) {
            const dTo = new Date(dateTo);
            if (!maxDateTo || dTo > maxDateTo) maxDateTo = dTo;
        }

        const count = typeof a.accountsCount === 'number' ? a.accountsCount : (Array.isArray(a.accounts) ? a.accounts.length : 0);
        totalAccounts += count;

        const valueSource = (a.totalValue != null) ? a.totalValue : a.value;
        const valueNumeric = typeof valueSource === 'number'
            ? valueSource
            : (parseFloat(String(valueSource).replace(/[^0-9.-]/g, '')) || 0);
        totalValue += valueNumeric;

        if (Array.isArray(a.accounts)) {
            allAccounts.push(...a.accounts);
        }
    });

    if (periodSpan) {
        const fromStr = minDateFrom ? minDateFrom.toISOString().split('T')[0] : '';
        const toStr = maxDateTo ? maxDateTo.toISOString().split('T')[0] : '';
        periodSpan.textContent = fromStr && toStr ? `${formatDate(fromStr)} al ${formatDate(toStr)}` : '';
    }
    if (totalAccountsSpan) totalAccountsSpan.textContent = totalAccounts;
    if (totalValueSpan) totalValueSpan.textContent = `$${formatCurrency(totalValue)}`;

    if (tableBody) {
        tableBody.innerHTML = '';
        if (!allAccounts.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="2" class="no-data-message">No hay detalle de cuentas almacenado para esta asignación.</td>`;
            tableBody.appendChild(tr);
        } else {
            allAccounts.forEach(acc => {
                const tr = document.createElement('tr');
                const valueNumeric = typeof acc.value === 'number'
                    ? acc.value
                    : (parseFloat(String(acc.value).replace(/[^0-9.-]/g, '')) || 0);
                tr.innerHTML = `
                    <td>${acc.invoiceNumber || ''}</td>
                    <td>$${formatCurrency(valueNumeric)}</td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }

    modal.style.display = 'flex';
}

function viewExecutiveAssignmentsFromSearch(executiveId) {
    // Marcar que el modal de resultados está abierto
    window._searchResultsModalOpen = true;
    // Asegurar z-index alto para que se muestre encima
    const detailsModal = document.getElementById('assignmentDetailsModal');
    if (detailsModal) {
        detailsModal.style.zIndex = '3000';
    }
    viewExecutiveAssignments(executiveId);
}

function editExecutiveAssignmentsFromSearch(executiveId) {
    // Marcar que el modal de resultados está abierto
    window._searchResultsModalOpen = true;
    // Asegurar z-index alto para que se muestre encima
    const editModal = document.getElementById('assignAccountsByExecutiveModal');
    if (editModal) {
        editModal.style.zIndex = '3000';
    }
    editExecutiveAssignments(executiveId);
}

function closeAssignmentDetailsModal() {
    const modal = document.getElementById('assignmentDetailsModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.zIndex = '';
        // Limpiar el ID guardado
        delete modal.dataset.executiveId;
        
        // Si el modal de resultados estaba abierto, volver a mostrarlo
        if (window._searchResultsModalOpen) {
            const resultsModal = document.getElementById('searchResultsModal');
            if (resultsModal) {
                resultsModal.style.display = 'flex';
                resultsModal.style.zIndex = '2000';
            }
        }
    }
}

function editFromDetailsModal() {
    const modal = document.getElementById('assignmentDetailsModal');
    if (!modal) return;
    
    const executiveId = modal.dataset.executiveId;
    if (!executiveId) {
        if (window.showNotification) {
            showNotification('No se pudo obtener la información del ejecutivo.', 'error');
        }
        return;
    }
    
    // Verificar si el modal de resultados estaba abierto
    const wasFromSearch = window._searchResultsModalOpen;
    
    // Cerrar el modal de detalle
    closeAssignmentDetailsModal();
    
    // Si venía del modal de resultados, usar la función especial
    if (wasFromSearch) {
        editExecutiveAssignmentsFromSearch(executiveId);
    } else {
        // Abrir el modal de edición normalmente
        editExecutiveAssignments(executiveId);
    }
}

function editExecutiveAssignments(executiveId) {
    const assignments = getAssignmentsByExecutive(executiveId);
    if (!assignments.length) {
        if (window.showNotification) {
            showNotification('No se encontraron asignaciones para este ejecutivo.', 'info');
        }
        return;
    }

    // Guardar el ID del ejecutivo para actualizar en lugar de crear nuevo (ANTES de abrir el modal)
    window._editingExecutiveId = executiveId;

    // Tomar el primer registro para obtener datos generales
    const first = assignments[0];
    
    // Calcular año y mes desde el primer registro
    let year = first.year || '';
    let month = first.month || '';
    
    // Si no hay año/mes guardados, derivarlos de la fecha de asignación
    if ((!year || !month) && first.assignmentDate) {
        try {
            const d = new Date(first.assignmentDate);
            if (!isNaN(d.getTime())) {
                year = year || String(d.getFullYear());
                const monthNumber = d.getMonth() + 1;
                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                month = month || `${String(monthNumber).padStart(2, '0')} - ${monthNames[monthNumber - 1]}`;
            }
        } catch (e) {
            // ignorar errores
        }
    }

    // Precargar cuentas asignadas ANTES de abrir el modal
    assignedAccounts = [];
    assignments.forEach(a => {
        // Si tiene el array de accounts, usarlo
        if (Array.isArray(a.accounts) && a.accounts.length > 0) {
            a.accounts.forEach(acc => {
                assignedAccounts.push({
                    invoiceNumber: acc.invoiceNumber || '',
                    value: typeof acc.value === 'number' ? acc.value : (parseFloat(String(acc.value).replace(/[^0-9.-]/g, '')) || 0),
                    id: Date.now() + Math.random()
                });
            });
        }
        // Si no tiene accounts pero tiene invoiceNumber (registros antiguos), crear una cuenta
        else if (a.invoiceNumber) {
            const valueSource = (a.totalValue != null) ? a.totalValue : a.value;
            const valueNumeric = typeof valueSource === 'number'
                ? valueSource
                : (parseFloat(String(valueSource).replace(/[^0-9.-]/g, '')) || 0);
            assignedAccounts.push({
                invoiceNumber: a.invoiceNumber,
                value: valueNumeric,
                id: Date.now() + Math.random()
            });
        }
    });

    // Abrir el modal de asignación con los datos precargados
    showAssignAccountsByExecutiveModal(year, month);

    // Precargar datos del ejecutivo
    const executiveIdInput = document.getElementById('executiveId');
    const executiveNameInput = document.getElementById('executiveName');
    if (executiveIdInput) executiveIdInput.value = first.executiveId || '';
    if (executiveNameInput) executiveNameInput.value = first.executiveName || '';

    // Precargar fechas
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    if (dateFromInput) dateFromInput.value = first.dateFrom || first.assignmentDate || '';
    if (dateToInput) dateToInput.value = first.dateTo || first.assignmentDate || '';

    // Actualizar lista y totales después de precargar todo
    updateAccountsList();
    updateTotals();
}

function validateAndShowConfirmCreate() {
    // Esta función ya no se usa, pero la mantenemos por compatibilidad
    const form = document.getElementById('createAssignmentForm');
    if (form && form.checkValidity()) {
        // Lógica movida al event listener del botón
    } else {
        form.reportValidity();
    }
}

function showConfirmCreateAssignmentModal() {
    const modal = document.getElementById('confirmCreateAssignmentModal');
    const messageElement = document.getElementById('confirmAssignmentMessage');
    
    // Actualizar mensaje según el modo (creación / edición / transferencia)
    if (messageElement) {
        const hasTransfer =
            window._readyToSaveAccounts &&
            window._readyToSaveAccounts.transferExecutiveId &&
            window._readyToSaveAccounts.transferExecutiveId.trim() !== '';

        if (hasTransfer) {
            messageElement.textContent = '¿Está segur@ que desea transferir estas cuentas al nuevo ejecutivo?';
        } else if (window._editingExecutiveId) {
            messageElement.textContent = '¿Está segur@ que desea actualizar esta asignación de factura?';
        } else {
            messageElement.textContent = '¿Está segur@ que desea asignar esta factura?';
        }
    }
    
    if (modal) modal.style.display = 'flex';
}

function cancelCreateAssignment() {
    const modal = document.getElementById('confirmCreateAssignmentModal');
    if (modal) modal.style.display = 'none';
    
    // Limpiar bandera de transferencia
    window._isTransferOperation = false;
}

function confirmCreateAssignment() {
    // Si se viene desde el flujo de "Guardar" asignación de cuentas por ejecutivo
    if (window._readyToSaveAccounts) {
        try {
            const city = getSelectedCityCode();
            if (!city) {
                if (window.showNotification) {
                    showNotification('Debe seleccionar una ciudad antes de guardar.', 'warning');
                }
                return;
            }

            if (!assignedAccounts || assignedAccounts.length === 0) {
                if (window.showNotification) {
                    showNotification('No hay cuentas para guardar.', 'warning');
                }
                return;
            }

            const formData = window._readyToSaveAccounts;

            const raw = localStorage.getItem('assignmentsByCity');
            const assignmentsByCity = raw ? JSON.parse(raw) : {};
            
            if (!Array.isArray(assignmentsByCity[city])) {
                assignmentsByCity[city] = [];
            }

            // Si estamos en modo edición, eliminar las asignaciones anteriores del ejecutivo
            if (window._editingExecutiveId) {
                assignmentsByCity[city] = assignmentsByCity[city].filter(
                    a => a.executiveId !== window._editingExecutiveId
                );
            }

            const today = new Date().toISOString().split('T')[0];

            // Calcular valor total y número de cuentas
            const totalValue = assignedAccounts.reduce((sum, acc) => {
                if (typeof acc.value === 'number') return sum + acc.value;
                const valueStr = String(acc.value).replace(/[^0-9.-]/g, '');
                const value = parseFloat(valueStr) || 0;
                return sum + value;
            }, 0);

            // Si hay transferencia, las cuentas van al ejecutivo de destino
            let executiveIdFinal = formData.executiveId;
            let executiveNameFinal = formData.executiveName;
            
            if (formData.transferExecutiveId && formData.transferExecutiveId.trim()) {
                // Buscar el ejecutivo de destino para obtener su nombre
                const transferResult = findExecutiveInAllCities(formData.transferExecutiveId);
                if (transferResult) {
                    executiveIdFinal = formData.transferExecutiveId.trim();
                    executiveNameFinal = buildExecutiveFullName(transferResult.empleado);
                    window._lastTransferExecutiveName = executiveNameFinal;
                    
                    // Eliminar las asignaciones del ejecutivo original si existen
                    assignmentsByCity[city] = assignmentsByCity[city].filter(
                        a => a.executiveId !== formData.executiveId
                    );
                    
                    // Eliminar también las asignaciones del ejecutivo de destino si estamos editando
                    if (window._editingExecutiveId && window._editingExecutiveId === executiveIdFinal) {
                        assignmentsByCity[city] = assignmentsByCity[city].filter(
                            a => a.executiveId !== executiveIdFinal
                        );
                    }
                } else {
                    if (window.showNotification) {
                        showNotification('No se encontró el ejecutivo de destino. La transferencia no se realizará.', 'error');
                    }
                    return;
                }
            }

            const assignmentRecord = {
                id: Date.now() + Math.random(),
                city: city,
                executiveId: executiveIdFinal,
                executiveName: executiveNameFinal,
                year: formData.year || '',
                month: formData.month || '',
                assignmentDate: today,
                dateFrom: formData.dateFrom || '',
                dateTo: formData.dateTo || '',
                accountsCount: assignedAccounts.length,
                totalValue: totalValue,
                transferExecutiveId: formData.transferExecutiveId || null,
                // Guardar detalle de cuentas para el modal de "Ver"
                accounts: assignedAccounts.map(acc => ({
                    invoiceNumber: acc.invoiceNumber,
                    value: typeof acc.value === 'number' ? acc.value : (parseFloat(String(acc.value).replace(/[^0-9.-]/g, '')) || 0)
                }))
            };

            assignmentsByCity[city].push(assignmentRecord);

            localStorage.setItem('assignmentsByCity', JSON.stringify(assignmentsByCity));

            console.log('Asignaciones guardadas (confirmación):', assignmentsByCity[city]);

            // Guardar estado de edición y transferencia antes de limpiarlo (para el mensaje de éxito)
            const wasEditing = !!window._editingExecutiveId;
            const wasTransfer = !!(formData.transferExecutiveId && formData.transferExecutiveId.trim());

            // Limpiar marcas de preparación y edición
            window._readyToSaveAccounts = null;
            window._editingExecutiveId = null;
            window._transferExecutive = null;
            window._isTransferOperation = false;
            
            // Limpiar campo de transferencia
            const transferInput = document.getElementById('transferExecutiveId');
            if (transferInput) {
                transferInput.value = '';
            }
            const transferExecutiveNameInput = document.getElementById('transferExecutiveName');
            if (transferExecutiveNameInput) {
                transferExecutiveNameInput.value = '';
            }

            // Cerrar modales y actualizar tabla
            cancelCreateAssignment();
            hideAssignAccountsByExecutiveModal();
            loadAssignments();

            // Mostrar modal de éxito estándar
            showSuccessCreateAssignmentModal(wasEditing, wasTransfer);
        } catch (e) {
            console.error('Error guardando asignaciones tras confirmación:', e);
            if (window.showNotification) {
                showNotification('Error al guardar las asignaciones en el navegador.', 'error');
            }
        }
    } else {
        // Comportamiento anterior (por compatibilidad con otros flujos)
        hideCreateAssignmentModal();
        cancelCreateAssignment();
        showSuccessCreateAssignmentModal();
    }
}

function showSuccessCreateAssignmentModal(wasEditing = false, wasTransfer = false) {
    const modal = document.getElementById('successCreateAssignmentModal');
    const messageElement = document.getElementById('successAssignmentMessage');
    
    // Actualizar mensaje según el modo (edición, creación o transferencia)
    if (messageElement) {
        if (wasTransfer) {
            const nombre = window._lastTransferExecutiveName || '';
            if (nombre) {
                messageElement.textContent = `¡Las cuentas fueron transferidas correctamente al ejecutivo ${nombre}!`;
            } else {
                messageElement.textContent = '¡Las cuentas fueron transferidas correctamente al nuevo ejecutivo!';
            }
        } else if (wasEditing) {
            messageElement.textContent = '¡La asignación de factura fue actualizada correctamente!';
        } else {
            messageElement.textContent = '¡La factura fue asignada correctamente!';
        }
    }
    
    if (modal) {
        // Si el modal de resultados está abierto, asegurar z-index alto
        if (window._searchResultsModalOpen) {
            modal.style.zIndex = '4000';
        }
        modal.style.display = 'flex';
    }
}

function closeSuccessCreateAssignmentModal() {
    const modal = document.getElementById('successCreateAssignmentModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.zIndex = '';
        
        // Si el modal de resultados estaba abierto, volver a mostrarlo
        if (window._searchResultsModalOpen) {
            const resultsModal = document.getElementById('searchResultsModal');
            if (resultsModal) {
                resultsModal.style.display = 'flex';
                resultsModal.style.zIndex = '2000';
            }
        }
    }
    loadAssignments();
}

function generateReport() {
    const year = document.getElementById('reportYear')?.value.trim();
    const month = document.getElementById('reportMonth')?.value;
    const tipoBusqueda = document.getElementById('reportTipoBusqueda')?.value;
    const executiveId = document.getElementById('reportExecutiveId')?.value.trim();
    const ciudadCodigo = document.getElementById('reportCiudad')?.value;
    
    // Validaciones
    if (!year || !month || !tipoBusqueda) {
        if (window.showNotification) {
            showNotification('Por favor complete todos los campos requeridos', 'warning');
        }
        return;
    }
    
    if (tipoBusqueda === 'ejecutivo' && !executiveId) {
        if (window.showNotification) {
            showNotification('Por favor ingrese la identificación del ejecutivo', 'warning');
        }
        return;
    }
    
    if (tipoBusqueda === 'ciudad' && !ciudadCodigo) {
        if (window.showNotification) {
            showNotification('Por favor seleccione una ciudad', 'warning');
        }
        return;
    }
    
    // Validar que el ejecutivo existe si se busca por ejecutivo
    if (tipoBusqueda === 'ejecutivo') {
        const result = findExecutiveInAllCities(executiveId);
        if (!result) {
            if (window.showNotification) {
                showNotification('No se encontró un ejecutivo con esa identificación', 'error');
            }
            return;
        }
    }
    
    // Obtener nombre del mes
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthNumber = parseInt(month);
    const monthName = monthNumber >= 1 && monthNumber <= 12 ? monthNames[monthNumber - 1] : month;
    
    // Preparar datos del reporte
    try {
        const finalCiudadCodigo = tipoBusqueda === 'ciudad' ? (ciudadCodigo || getSelectedCityCode()) : '';
        const finalCiudadNombre = tipoBusqueda === 'ciudad' ? (getCityNameByCode(finalCiudadCodigo) || 'TODAS LAS CIUDADES') : '';
        const finalExecutiveName = tipoBusqueda === 'ejecutivo' 
            ? (findExecutiveInAllCities(executiveId) ? buildExecutiveFullName(findExecutiveInAllCities(executiveId).empleado) : '')
            : 'TODOS LOS EJECUTIVOS';
        
        const reportData = {
            year: year,
            month: month,
            monthName: monthName,
            tipoBusqueda: tipoBusqueda,
            executiveId: tipoBusqueda === 'ejecutivo' ? executiveId : '',
            executiveName: finalExecutiveName,
            ciudadCodigo: finalCiudadCodigo,
            ciudadNombre: finalCiudadNombre
        };
        
        // Guardar datos en localStorage para la página de reporte
        localStorage.setItem('reporteAsignacionDetalladaData', JSON.stringify(reportData));
        
        // Abrir reporte en nueva pestaña
        const reportUrl = '../reportes/reporte-asignacion-detallada.html';
        window.open(reportUrl, '_blank');
        
        hideReportModal();
        
        if (window.showNotification) {
            showNotification('Reporte generado correctamente', 'success');
        }
    } catch (e) {
        console.error('Error generando reporte:', e);
        if (window.showNotification) {
            showNotification('Error al generar el reporte', 'error');
        }
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

