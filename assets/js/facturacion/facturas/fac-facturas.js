function renderInvoicesTable(list) {
    const tbody = document.getElementById('invoicesTableBody');
    tbody.innerHTML = '';
    if (!list || list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="no-data-message">
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
    list.forEach(invoice => {
        const row = document.createElement('tr');
        row.className = `status-${invoice.estado === 'activo' ? 'active' : 'inactive'}`;
        row.innerHTML = `
            <td class="invoice-number">${invoice.invoiceNumber}</td>
            <td>${invoice.contractNumber || invoice.contractId || '—'}</td>
            <td>${formatDate(invoice.date)}</td>
            <td>${invoice.clientId || ''}</td>
            <td>${invoice.clientName || ''}</td>
            <td class="invoice-value">$${formatNumber(invoice.value || 0)}</td>
            <td>${invoice.firstPaymentDate ? formatDate(invoice.firstPaymentDate) : '—'}</td>
            <td>${invoice.executive || ''}</td>
            <td><span class="status-badge ${invoice.estado === 'activo' ? 'active' : 'inactive'}">${invoice.estado === 'activo' ? 'ACTIVO' : 'ANULADO'}</span></td>
            <td>
                <div class="action-buttons-cell status-toggle-container">
                    <button class="btn-icon btn-edit" onclick="editInvoice(${invoice.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <label class="status-toggle" title="Activar/Anular" style="margin:0 6px;" tabindex="0" role="switch" aria-checked="${invoice.estado === 'activo' ? 'true' : 'false'}"
                        onkeydown="if(event.key==='Enter'||event.key===' '){ event.preventDefault(); const inp=this.querySelector('input'); inp.checked=!inp.checked; requestToggleInvoice(${invoice.id}, inp.checked); }">
                        <input type="checkbox" ${invoice.estado === 'activo' ? 'checked' : ''} onchange="requestToggleInvoice(${invoice.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

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

function getSelectedCityCode() {
    try { return sessionStorage.getItem('selectedCity') || ''; } catch (e) { return ''; }
}

function getControlConsecutivosForCity(city) {
    try {
        const raw = localStorage.getItem(`controlConsecutivos_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list) && list.length > 0) return list[0];
        return null;
    } catch (e) { return null; }
}

function getPlanValorByName(planName) {
    if (!planName) return 0;
    try {
        const planesData = localStorage.getItem('planesData');
        if (!planesData) return 0;
        const planes = JSON.parse(planesData) || {};
        for (const [, plan] of Object.entries(planes)) {
            const nombre = (plan.nombre || '').toString().toLowerCase().trim();
            if (nombre && nombre === planName.toLowerCase().trim()) {
                return parseInt(plan.valorPlan || plan.total || plan.totalPlan || 0, 10) || 0;
            }
        }
    } catch (e) {}
    return 0;
}

// Obtiene contratos ACTIVOS del titular desde el storage por ciudad
function getActiveContractsForTitular(city, clientId, fallbackList = []) {
    let result = [];
    try {
        const raw = localStorage.getItem(`contratos_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)) {
            const clean = (v) => String(v || '').replace(/\D+/g,'').trim();
            result = list.filter(c => {
                const sameTitular = clean(c.clientId || c.identificacion || c.cedula) === clean(clientId);
                const estado = (c.estado || '').toString().toLowerCase().trim();
                const activoOk = estado ? (estado === 'activo') : (typeof c.activo === 'undefined' || (c.activo === true || c.activo === 1 || String(c.activo).toLowerCase().trim() === 'true' || String(c.activo).toLowerCase().trim() === 'si'));
                return sameTitular && activoOk;
            });
        }
    } catch (e) {}
    if (result.length === 0 && Array.isArray(fallbackList)) {
        // Usar fallback pero filtrando por estado si viene
        const isAnulado = (c) => {
            const estado = (c.estado || '').toString().toLowerCase().trim();
            if (estado) return estado !== 'activo';
            if (typeof c.activo !== 'undefined') {
                const v = (c.activo === true || c.activo === 1 || String(c.activo).toLowerCase().trim() === 'true' || String(c.activo).toLowerCase().trim() === 'si');
                return !v;
            }
            return false;
        };
        result = fallbackList.filter(c => !isAnulado(c));
    }
    return result;
}

// Obtiene contratos por ID de titular desde storage, activos o no según flag
function getContractsByClientId(city, clientId, onlyActive = true){
    const result = [];
    const clean = (v) => String(v || '').replace(/\D+/g,'').trim();
    try {
        const raw = localStorage.getItem(`contratos_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)){
            list.forEach(c => {
                if (clean(c.clientId || c.identificacion || c.cedula) !== clean(clientId)) return;
                if (onlyActive){
                    const estado = (c.estado || '').toString().toLowerCase().trim();
                    const activoOk = estado ? (estado === 'activo') : (typeof c.activo === 'undefined' || (c.activo === true || c.activo === 1 || String(c.activo).toLowerCase().trim() === 'true' || String(c.activo).toLowerCase().trim() === 'si'));
                    if (!activoOk) return;
                }
                result.push(c);
            });
        }
    } catch(e) {}
    return result;
}

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
    const typeSel = document.getElementById('invoiceSearchType');
    const input = document.getElementById('searchInvoiceValue');
    if (typeSel) typeSel.value = 'invoiceNumber';
    if (input) { input.value = ''; input.placeholder = 'Ingrese el número de factura'; input.focus(); }
    try { updateInvoiceSearchPlaceholder(); } catch(e) {}
}

function hideSearchInvoiceModal() {
    document.getElementById('searchInvoiceModal').style.display = 'none';
    const input = document.getElementById('searchInvoiceValue');
    if (input) input.value = '';
}

function showCreateInvoiceModal() {
    const overlay = document.getElementById('createInvoiceModal');
    const titleEl = document.getElementById('createInvoiceModalTitle');
    const isEditing = !!window.__editingInvoiceId;
    if (titleEl) titleEl.textContent = isEditing ? 'ACTUALIZAR FACTURA' : 'CREAR FACTURA';

    overlay.style.display = 'flex';
    try { document.querySelector('#createInvoiceModal .modal').focus(); } catch(e) {}

    if (!isEditing) {
        // Dejar la fecha vacía para ingreso manual
        const dateEl = document.getElementById('invoiceDate');
        if (dateEl) dateEl.value = '';
        // Obtener próximo número de factura desde consecutivos
        loadNextInvoiceNumber();
        // Limpiar formulario
        clearCreateInvoiceForm();
    }
}

function hideCreateInvoiceModal() {
    const overlay = document.getElementById('createInvoiceModal');
    if (overlay) overlay.style.display = 'none';
    // Resetear estado de edición y título/botón
    const titleEl = document.getElementById('createInvoiceModalTitle');
    if (titleEl) titleEl.textContent = 'CREAR FACTURA';
    const primaryBtn = document.getElementById('bCrearFacturaModal');
    if (primaryBtn) primaryBtn.textContent = 'Crear';
    window.__editingInvoiceId = null;
}

// Cerrar modal de crear factura al hacer clic fuera del cuadro
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('createInvoiceModal');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) hideCreateInvoiceModal();
        });
    }

    // Teclado: Enter confirma, Escape cierra para modales conocidos
    document.addEventListener('keydown', function(e) {
        const anyOpen = [
            'createInvoiceModal',
            'confirmCreateInvoiceModal',
            'successCreateInvoiceModal',
            'confirmToggleInvoiceModal',
            'successToggleInvoiceModal',
            'confirmUpdateInvoiceModal',
            'successUpdateInvoiceModal'
        ].find(id => {
            const el = document.getElementById(id); return el && el.style.display === 'flex';
        });
        if (!anyOpen) return;

        // Evitar activar con Enter en selects abiertos
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        const isTextInput = tag === 'input' || tag === 'textarea';

        if (e.key === 'Escape') {
            if (anyOpen === 'createInvoiceModal') hideCreateInvoiceModal();
            if (anyOpen === 'confirmCreateInvoiceModal') cancelCreateInvoice();
            if (anyOpen === 'confirmToggleInvoiceModal') cancelToggleInvoice();
            if (anyOpen === 'confirmUpdateInvoiceModal') cancelUpdateInvoice();
        } else if (e.key === 'Enter' && !isTextInput) {
            if (anyOpen === 'createInvoiceModal') onPrimaryActionClick();
            if (anyOpen === 'confirmCreateInvoiceModal') confirmCreateInvoice();
            if (anyOpen === 'successCreateInvoiceModal') closeSuccessCreateInvoiceModal();
            if (anyOpen === 'confirmToggleInvoiceModal') confirmToggleInvoice();
            if (anyOpen === 'successToggleInvoiceModal') closeSuccessToggleInvoiceModal();
            if (anyOpen === 'confirmUpdateInvoiceModal') confirmUpdateInvoice();
            if (anyOpen === 'successUpdateInvoiceModal') closeSuccessUpdateInvoiceModal();
        }
    });
});

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
    const city = getSelectedCityCode();
    // Leer rango de consecutivos desde Control de Consecutivos (Recibos Oficiales)
    const control = getControlConsecutivosForCity(city);
    const start = control ? parseInt(control.recibosOficialesInicial || '1', 10) : 1;
    const end = control ? parseInt(control.recibosOficialesFinal || '99999999', 10) : 99999999;

    // Preferir puntero persistido "nextInvoiceNumber_{city}"
    let nextNumber = start;
    try {
        const persisted = parseInt(localStorage.getItem(`nextInvoiceNumber_${city}`) || '0', 10);
        if (persisted && persisted >= start) nextNumber = persisted;
        // Asegurar que sea mayor al máximo ya usado en la ciudad
        const raw = localStorage.getItem('invoicesByCity');
        const byCity = raw ? JSON.parse(raw) : {};
        const list = Array.isArray(byCity[city]) ? byCity[city] : [];
        const maxUsed = list
            .map(it => parseInt(String(it.invoiceNumber || '0').replace(/\D/g, ''), 10) || 0)
            .reduce((a, b) => Math.max(a, b), 0);
        if (maxUsed >= nextNumber) nextNumber = maxUsed + 1;
    } catch (e) {}

    // No exceder el final del rango
    if (nextNumber > end) {
        showNotification('Consecutivo de facturas agotado para la ciudad seleccionada', 'error');
        nextNumber = end; // mostrará el último permitido
    }

    document.getElementById('invoiceNumber').value = String(nextNumber).padStart(8, '0');
}

// Event listener para buscar titular por ID
document.getElementById('clientId')?.addEventListener('input', function() {
    const clientId = this.value.trim();
    if (clientId.length >= 6) {
        // Limpiar estado de error previo mientras se consulta
        this.classList.remove('input-error');
        this.removeAttribute('aria-invalid');
        const disp = document.getElementById('clientNameDisplay');
        if (disp) { disp.classList.remove('error-text'); disp.style.display = 'none'; disp.textContent=''; }
        searchTitularByCedula(clientId);
    } else {
        // Limpiar campos si el ID es muy corto
        this.classList.remove('input-error');
        this.removeAttribute('aria-invalid');
        document.getElementById('clientName').value = '';
        document.getElementById('contractSelect').innerHTML = '<option value="">Seleccione el contrato</option>';
        clearContractInfo();
        const disp = document.getElementById('clientNameDisplay');
        if (disp) { disp.classList.remove('error-text'); disp.style.display = 'none'; disp.textContent=''; }
    }
});

// El campo es numérico y readonly; no aplicar formateo visual dentro del input

function searchTitularByCedula(cedula) {
    console.log(`Buscando titular con cédula: ${cedula}`);
    const city = getSelectedCityCode();
    const idInput = document.getElementById('clientId');
    const nameDisp = document.getElementById('clientNameDisplay');
    // Buscar directamente en storage por ciudad
    const contratos = getContractsByClientId(city, cedula, true);
    if (contratos.length > 0){
        // Tomar nombre desde el primer contrato válido
        const c0 = contratos[0] || {};
        const nombre = c0.clientName || c0.nombreTitular || c0.titular || '';
        if (nombre) document.getElementById('clientName').value = nombre;
        const disp = document.getElementById('clientNameDisplay');
        if (disp) { disp.style.display = 'none'; disp.textContent=''; disp.classList.remove('error-text'); }
        if (idInput) { idInput.classList.remove('input-error'); idInput.removeAttribute('aria-invalid'); }
        // Cargar contratos activos normalizados en el select
        loadContractsForTitular(contratos);
        return;
    }
    // Fallback: activos
    const activos = getActiveContractsForTitular(city, cedula, []);
    if (activos.length){
        const c0 = activos[0] || {};
        const nombre = c0.clientName || c0.nombreTitular || c0.titular || '';
        if (nombre) document.getElementById('clientName').value = nombre;
        if (nameDisp) { nameDisp.style.display = 'none'; nameDisp.textContent=''; nameDisp.classList.remove('error-text'); }
        if (idInput) { idInput.classList.remove('input-error'); idInput.removeAttribute('aria-invalid'); }
        loadContractsForTitular(activos);
        return;
    }
    // Notificar si existe pero está anulado, o si no existe
    let message = 'No existe un titular o contrato con esa identificación.';
    try {
        const allContracts = getContractsByClientId(city, cedula, false);
        if (Array.isArray(allContracts) && allContracts.length > 0) {
            message = 'El titular existe pero su contrato está ANULADO.';
        }
    } catch(e) {}
    if (idInput) { idInput.classList.add('input-error'); idInput.setAttribute('aria-invalid', 'true'); }
    if (nameDisp) {
        nameDisp.textContent = message;
        nameDisp.classList.add('error-text');
        nameDisp.style.display = 'block';
    }
    // Limpiar si no se encuentra
    document.getElementById('clientName').value = '';
    document.getElementById('contractSelect').innerHTML = '<option value="">Seleccione el contrato</option>';
    clearContractInfo();
}

function loadContractsForTitular(contratos) {
    const contractSelect = document.getElementById('contractSelect');
    contractSelect.innerHTML = '<option value="">Seleccione el contrato</option>';
    
    const isAnulado = (c) => {
        const estado = (c.estado || '').toString().toLowerCase().trim();
        if (estado) return estado !== 'activo';
        if (typeof c.activo !== 'undefined') {
            const v = (c.activo === true || c.activo === 1 || String(c.activo).toLowerCase().trim() === 'true' || String(c.activo).toLowerCase().trim() === 'si');
            return !v;
        }
        return false; // si no hay información de estado, se asume activo
    };

    contratos.forEach(contrato => {
        // Omitir contratos anulados (en cualquier formato)
        if (isAnulado(contrato)) return;
        // Normalizar campos comunes
        const numero = contrato.numero || contrato.contractNumber || contrato.numeroContrato || contrato.nro || contrato.contract || '';
        const plan = contrato.plan || (contrato.planData && contrato.planData.nombre) || '';
        const ejecutivo = contrato.ejecutivo || contrato.executive || contrato.ejecutivoNombre || contrato.nombreEjecutivo || '';
        // Enriquecer con valorPlan si no viene
        const valorPlan = contrato.valorPlan || getPlanValorByName(plan) || contrato.valor || 0;
        const normalizado = {
            id: contrato.id || '',
            numero,
            plan,
            ejecutivo,
            valorPlan
        };
        const option = document.createElement('option');
        // Usar SIEMPRE el número de contrato como value del option
        option.value = normalizado.numero || '';
        option.textContent = `Contrato ${normalizado.numero || '—'} - ${normalizado.plan || '—'}`;
        option.dataset.contrato = JSON.stringify(normalizado);
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
    // Asegurar que no queden 'undefined' literales
    document.getElementById('planInfo').value = contrato.plan || '';
    document.getElementById('executiveInfo').value = contrato.ejecutivo || '';
    // Buscar el valor TOTAL del plan desde el contrato guardado en localStorage
    const city = getSelectedCityCode();
    let totalPlan = contrato.valorPlan || 0;
    try {
        const raw = localStorage.getItem(`contratos_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        const match = Array.isArray(list) ? list.find(c => {
            const same = (String(c.id) === String(contrato.id) || String(c.contractNumber || c.numero || c.numeroContrato) === String(contrato.numero));
            const estado = (c.estado || '').toString().toLowerCase().trim();
            const activoOk = estado ? (estado === 'activo') : (typeof c.activo === 'undefined' || (c.activo === true || c.activo === 1 || String(c.activo).toLowerCase().trim() === 'true' || String(c.activo).toLowerCase().trim() === 'si'));
            return same && activoOk;
        }) : null;
        if (match) {
            // Rellenar también plan/ejecutivo si venían vacíos
            if (!document.getElementById('planInfo').value) {
                const planNombre = match.plan || (match.planData && match.planData.nombre) || '';
                document.getElementById('planInfo').value = planNombre;
            }
            if (!document.getElementById('executiveInfo').value) {
                const ejecutivoNombre = match.ejecutivo || match.executive || match.ejecutivoNombre || match.nombreEjecutivo || '';
                document.getElementById('executiveInfo').value = ejecutivoNombre;
            }
            // Intentar diferentes campos usuales
            totalPlan = match?.planData?.valorPlan || match?.valorPlan || match?.totalPlan || match?.planValor || totalPlan;
        }
    } catch (e) {}
    // Fallback: buscar por nombre del plan en planes guardados
    if (!totalPlan) {
        totalPlan = getPlanValorByName(contrato.plan || document.getElementById('planInfo').value);
    }
    // Mostrar con separador de miles (input ahora es de texto y readonly)
    document.getElementById('invoiceValue').value = formatCurrencyInputString(totalPlan);
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
    // Dejar fechas vacías para que el usuario las ingrese
    const sd = document.getElementById('startDate');
    const ed = document.getElementById('endDate');
    if (sd) sd.value = '';
    if (ed) ed.value = '';
}

function hideReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
}

// ========================================
// CARGA DE DATOS
// ========================================

function loadInvoicesData() {
    const tbody = document.getElementById('invoicesTableBody');
    tbody.innerHTML = '';

    // Cargar desde localStorage por ciudad seleccionada
    try {
        const city = getSelectedCityCode();
        const raw = localStorage.getItem('invoicesByCity');
        const byCity = raw ? JSON.parse(raw) : {};
        invoicesData = Array.isArray(byCity[city]) ? byCity[city] : [];
        // Asegurar defaults
        invoicesData = invoicesData.map(inv => ({ estado: (inv.estado || 'activo'), ...inv }));

        // Enriquecer con # de contrato si faltara (migración de datos viejos)
        const contratosRaw = localStorage.getItem(`contratos_${city}`);
        const contratos = contratosRaw ? JSON.parse(contratosRaw) : [];
        let changed = false;
        invoicesData.forEach(inv => {
            if (!inv.contractNumber) {
                const match = Array.isArray(contratos) ? contratos.find(c => {
                    return String(c.id) === String(inv.contractId) ||
                           String(c.contractNumber || c.numero || c.numeroContrato) === String(inv.contractId);
                }) : null;
                if (match) {
                    inv.contractNumber = match.contractNumber || match.numero || match.numeroContrato || '';
                    changed = true;
                }
            }
        });
        if (changed) {
            byCity[city] = invoicesData;
            localStorage.setItem('invoicesByCity', JSON.stringify(byCity));
        }
    } catch (e) { /* mantener invoicesData actual */ }
    
    if (invoicesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="no-data-message">
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
    
    renderInvoicesTable(invoicesData);
}

// ========================================
// OPERACIONES CRUD - FACTURAS
// ========================================

function editInvoice(id) {
    const invoice = invoicesData.find(i => i.id === id);
    if (!invoice) return;
    
    // Establecer modo edición
    window.__editingInvoiceId = id;

    // Llenar formulario con datos existentes (solo campos presentes)
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
    setVal('invoiceNumber', invoice.invoiceNumber);
    setVal('invoiceDate', invoice.date);
    setVal('clientId', invoice.clientId);
    setVal('clientName', invoice.clientName);
    setVal('firstPaymentDate', invoice.firstPaymentDate || '');
    setVal('planInfo', invoice.plan || '');
    setVal('executiveInfo', invoice.executive || '');
    const valueEl = document.getElementById('invoiceValue');
    if (valueEl) valueEl.value = `$${formatNumber(invoice.value || 0)}`;

    // Cargar contratos del titular automáticamente y seleccionar el correspondiente
    if (invoice.clientId) {
        try { searchTitularByCedula(String(invoice.clientId)); } catch(e) {}
    }
    setTimeout(() => {
        const contractSel = document.getElementById('contractSelect');
        if (contractSel) {
            const target = String(invoice.contractNumber || invoice.contractId || '');
            let matchedIndex = -1;
            for (let i = 0; i < contractSel.options.length; i++) {
                const opt = contractSel.options[i];
                if (String(opt.value) === target) { matchedIndex = i; break; }
                try {
                    const data = opt.dataset.contrato ? JSON.parse(opt.dataset.contrato) : null;
                    if (data && (String(data.id) === target || String(data.numero || data.contractNumber) === target)) { matchedIndex = i; break; }
                } catch(e) {}
            }
            if (matchedIndex >= 0) contractSel.selectedIndex = matchedIndex;
        }
    }, 0);

    // Cambiar botón a "Actualizar"
    const primaryBtn = document.getElementById('bCrearFacturaModal');
    if (primaryBtn) primaryBtn.textContent = 'Actualizar';

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

// Acción primaria (Crear / Actualizar) según modo
function onPrimaryActionClick() {
    if (window.__editingInvoiceId) {
        const modal = document.getElementById('confirmUpdateInvoiceModal');
        if (modal) modal.style.display = 'flex';
    } else {
        const modal = document.getElementById('confirmCreateInvoiceModal');
        if (modal) modal.style.display = 'flex';
    }
}

document.getElementById('bCrearFacturaModal')?.addEventListener('click', onPrimaryActionClick);

// Confirmación de creación de factura
function confirmCreateInvoice() {
    const invoiceData = {
        id: invoicesData.length + 1,
        invoiceNumber: document.getElementById('invoiceNumber').value,
        date: document.getElementById('invoiceDate').value,
        clientId: document.getElementById('clientId').value,
        clientName: document.getElementById('clientName').value,
        contractId: document.getElementById('contractSelect').value,
        contractNumber: (function(){
            const sel = document.getElementById('contractSelect');
            const opt = sel && sel.options[sel.selectedIndex];
            if (!opt) return '';
            try { return JSON.parse(opt.dataset.contrato).numero || ''; } catch(e) { return ''; }
        })(),
        plan: document.getElementById('planInfo').value,
        executive: document.getElementById('executiveInfo').value,
        value: parseCurrencyToNumber(document.getElementById('invoiceValue').value),
        firstPaymentDate: document.getElementById('firstPaymentDate').value,
        status: 'pendiente', // legado (no usado en tabla)
        estado: 'activo'
    };
    
    // Validar campos requeridos
    if (!validateInvoiceForm(invoiceData)) {
        cancelCreateInvoice();
        return;
    }

    // Validar que el contrato seleccionado esté ACTIVO
    try {
        const city = getSelectedCityCode();
        const raw = localStorage.getItem(`contratos_${city}`);
        const list = raw ? JSON.parse(raw) : [];
        const match = Array.isArray(list) ? list.find(c => {
            const same = (String(c.id) === String(invoiceData.contractId) || String(c.contractNumber || c.numero) === String(invoiceData.contractId));
            return same;
        }) : null;
        if (match) {
            const estado = (match.estado || '').toString().toLowerCase().trim();
            const activoOk = estado ? (estado === 'activo') : (typeof match.activo === 'undefined' || (match.activo === true || match.activo === 1 || String(match.activo).toLowerCase().trim() === 'true' || String(match.activo).toLowerCase().trim() === 'si'));
            if (!activoOk) {
                showNotification('El contrato seleccionado está ANULADO. No se puede crear la factura.', 'error');
                return;
            }
            // Refrescar número de contrato desde el registro real
            invoiceData.contractNumber = match.contractNumber || match.numero || match.numeroContrato || invoiceData.contractNumber || '';
        }
    } catch (e) {}
    
    invoicesData.push(invoiceData);
    // Persistir por ciudad
    try {
        const city = getSelectedCityCode();
        const raw = localStorage.getItem('invoicesByCity');
        const byCity = raw ? JSON.parse(raw) : {};
        byCity[city] = Array.isArray(byCity[city]) ? byCity[city] : [];
        byCity[city].push(invoiceData);
        localStorage.setItem('invoicesByCity', JSON.stringify(byCity));
        // Avanzar puntero del próximo consecutivo basado en el número recién guardado
        const justUsed = parseInt(String(invoiceData.invoiceNumber).replace(/\D/g, ''), 10) || 0;
        if (justUsed) {
            localStorage.setItem(`nextInvoiceNumber_${city}`, String(justUsed + 1));
        }
    } catch (e) {}
    loadInvoicesData();
    hideCreateInvoiceModal();
    cancelCreateInvoice();
    // Mostrar modal de éxito
    const success = document.getElementById('successCreateInvoiceModal');
    if (success) success.style.display = 'flex';
}

// ====== Actualización de factura ======
function cancelUpdateInvoice() {
    const modal = document.getElementById('confirmUpdateInvoiceModal');
    if (modal) modal.style.display = 'none';
}

function confirmUpdateInvoice() {
    cancelUpdateInvoice();
    const id = window.__editingInvoiceId;
    if (typeof id === 'undefined' || id === null) return;

    const idx = invoicesData.findIndex(i => i.id === id);
    if (idx === -1) return;

    // Solo campos editables actualmente
    const updated = { ...invoicesData[idx] };
    updated.firstPaymentDate = document.getElementById('firstPaymentDate')?.value || '';

    invoicesData[idx] = updated;

    // Persistir por ciudad
    try {
        const city = getSelectedCityCode();
        const rawAll = localStorage.getItem('invoicesByCity');
        const byCity = rawAll ? JSON.parse(rawAll) : {};
        const arr = Array.isArray(byCity[city]) ? byCity[city] : [];
        const pos = arr.findIndex(i => i.id === id);
        if (pos !== -1) {
            arr[pos] = updated;
        }
        byCity[city] = arr;
        localStorage.setItem('invoicesByCity', JSON.stringify(byCity));
    } catch (e) {}

    const success = document.getElementById('successUpdateInvoiceModal');
    if (success) success.style.display = 'flex';
    loadInvoicesData();

    // Actualizar fila en resultados de búsqueda si está visible
    try {
        const results = document.getElementById('invoiceResultsModal');
        if (results && results.style.display === 'flex') {
            const body = document.getElementById('invoiceSearchResultsBody');
            const row = body ? body.querySelector(`tr[data-id="${id}"]`) : null;
            if (row) {
                const dateCell = row.querySelector('[data-date-cell]');
                const firstCell = row.querySelector('[data-first-cell]');
                if (dateCell) dateCell.textContent = formatDate(updated.date || '');
                if (firstCell) firstCell.textContent = updated.firstPaymentDate ? formatDate(updated.firstPaymentDate) : '—';
            }
        }
    } catch (e) {}
}

function closeSuccessUpdateInvoiceModal() {
    const success = document.getElementById('successUpdateInvoiceModal');
    if (success) success.style.display = 'none';
    // Resetear a modo Crear solo cuando se cierre el modal principal
    window.__editingInvoiceId = null;
    hideCreateInvoiceModal();
}

function cancelCreateInvoice() {
    const modal = document.getElementById('confirmCreateInvoiceModal');
    if (modal) modal.style.display = 'none';
}

function closeSuccessCreateInvoiceModal() {
    const success = document.getElementById('successCreateInvoiceModal');
    if (success) success.style.display = 'none';
}

// Toggle estado activo/anulado
function toggleInvoiceState(id, isActive) {
    try {
        const city = getSelectedCityCode();
        const raw = localStorage.getItem('invoicesByCity');
        const byCity = raw ? JSON.parse(raw) : {};
        const list = Array.isArray(byCity[city]) ? byCity[city] : [];
        const idx = list.findIndex(i => i.id === id);
        if (idx !== -1) {
            list[idx].estado = isActive ? 'activo' : 'anulado';
            byCity[city] = list;
            localStorage.setItem('invoicesByCity', JSON.stringify(byCity));
        }
    } catch (e) {}
    loadInvoicesData();
}

// ===== Confirmación de toggle =====
window.__pendingInvoiceToggle = { id: null, next: true };

function requestToggleInvoice(id, nextState) {
    window.__pendingInvoiceToggle = { id, next: nextState };
    const modal = document.getElementById('confirmToggleInvoiceModal');
    const text = document.getElementById('confirmToggleInvoiceText');
    if (text) {
        text.textContent = nextState
            ? '¿Está segur@ que desea ACTIVAR esta factura?'
            : '¿Está segur@ que desea ANULAR esta factura?';
    }
    if (modal) modal.style.display = 'flex';
}

function cancelToggleInvoice() {
    const modal = document.getElementById('confirmToggleInvoiceModal');
    if (modal) modal.style.display = 'none';
    // Revertir visual del switch para mantener coherencia
    loadInvoicesData();
}

function confirmToggleInvoice() {
    const { id, next } = window.__pendingInvoiceToggle || {};
    cancelToggleInvoice();
    if (typeof id !== 'number' && typeof id !== 'string') return;
    toggleInvoiceState(Number(id), !!next);
    const success = document.getElementById('successToggleInvoiceModal');
    const successText = document.getElementById('successToggleInvoiceText');
    if (successText) {
        successText.textContent = next
            ? 'La factura fue ACTIVADA correctamente.'
            : 'La factura fue ANULADA correctamente.';
    }
    if (success) success.style.display = 'flex';

    // Si el modal de resultados de búsqueda está visible, actualizar el estado en la fila correspondiente
    try {
        const results = document.getElementById('invoiceResultsModal');
        if (results && results.style.display === 'flex') {
            const body = document.getElementById('invoiceSearchResultsBody');
            const row = body ? body.querySelector(`tr[data-id="${id}"]`) : null;
            if (row) {
                const badge = row.querySelector('[data-status]');
                if (badge) {
                    const isActive = !!next;
                    badge.textContent = isActive ? 'ACTIVO' : 'ANULADO';
                    badge.className = `status-badge ${isActive ? 'active' : 'inactive'}`;
                }
            }
        }
    } catch (e) {}
}

function closeSuccessToggleInvoiceModal() {
    const success = document.getElementById('successToggleInvoiceModal');
    if (success) success.style.display = 'none';
}

// Generar Reporte
document.getElementById('bGenerarReporte')?.addEventListener('click', function() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showNotification('Por favor seleccione fecha inicial y final', 'warning');
        return;
    }
    
    generateReport('facturas', startDate, endDate);
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
// BÚSQUEDA DE FACTURAS
// ========================================

function updateInvoiceSearchPlaceholder(){
    const type = document.getElementById('invoiceSearchType')?.value || 'invoiceNumber';
    const label = document.getElementById('invoiceSearchLabel');
    const input = document.getElementById('searchInvoiceValue');
    if (!label || !input) return;
    switch(type){
        case 'invoiceNumber':
            label.textContent = 'Número de Factura *';
            input.placeholder = 'Ingrese el número de factura';
            break;
        case 'contractNumber':
            label.textContent = 'Número de Contrato *';
            input.placeholder = 'Ingrese el número de contrato';
            break;
        case 'clientId':
            label.textContent = 'Identificación del Titular *';
            input.placeholder = 'Ingrese la identificación del titular';
            break;
        case 'clientName':
            label.textContent = 'Nombre del Titular *';
            input.placeholder = 'Ingrese el nombre del titular';
            break;
    }
}

document.getElementById('invoiceSearchType')?.addEventListener('change', updateInvoiceSearchPlaceholder);

document.getElementById('bBuscarFactura')?.addEventListener('click', function(){
    const type = document.getElementById('invoiceSearchType')?.value || 'invoiceNumber';
    const val = (document.getElementById('searchInvoiceValue')?.value || '').trim();
    if (!val){ showNotification('Ingrese un valor de búsqueda', 'warning'); return; }
    const vLower = val.toLowerCase();
    let filtered = invoicesData.slice();
    if (type === 'invoiceNumber') {
        filtered = filtered.filter(i => String(i.invoiceNumber||'').toLowerCase().includes(vLower));
    } else if (type === 'contractNumber') {
        filtered = filtered.filter(i => String(i.contractNumber||i.contractId||'').toLowerCase().includes(vLower));
    } else if (type === 'clientId') {
        filtered = filtered.filter(i => String(i.clientId||'').toLowerCase().includes(vLower));
    } else if (type === 'clientName') {
        filtered = filtered.filter(i => String(i.clientName||'').toLowerCase().includes(vLower));
    }
    hideSearchInvoiceModal();
    renderInvoiceSearchResults(filtered);
    showInvoiceResultsModal();
});

function renderInvoiceSearchResults(list){
    const body = document.getElementById('invoiceSearchResultsBody');
    if (!body) return;
    body.innerHTML = '';
    if (!list || list.length === 0){
        body.innerHTML = `
            <tr>
                <td colspan="10" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron resultados</p>
                        <small>Intente con otros criterios</small>
                    </div>
                </td>
            </tr>`;
        return;
    }
    list.forEach(inv => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', String(inv.id));
        row.innerHTML = `
            <td class="invoice-number">${inv.invoiceNumber}</td>
            <td>${inv.contractNumber || inv.contractId || '—'}</td>
            <td data-date-cell>${formatDate(inv.date)}</td>
            <td>${inv.clientId || ''}</td>
            <td>${inv.clientName || ''}</td>
            <td class="invoice-value">$${formatNumber(inv.value || 0)}</td>
            <td data-first-cell>${inv.firstPaymentDate ? formatDate(inv.firstPaymentDate) : '—'}</td>
            <td>${inv.executive || ''}</td>
            <td><span class="status-badge ${inv.estado === 'activo' ? 'active' : 'inactive'}" data-status>${inv.estado === 'activo' ? 'ACTIVO' : 'ANULADO'}</span></td>
            <td>
                <div class="action-buttons-cell">
                    <button class="btn-icon btn-edit" onclick="editInvoice(${inv.id})" title="Editar"><i class=\"fas fa-edit\"></i></button>
                    <label class="status-toggle" title="Activar/Anular" style="margin:0 6px;" tabindex="0" role="switch" aria-checked="${inv.estado === 'activo' ? 'true' : 'false'}"
                        onkeydown="if(event.key==='Enter'||event.key===' '){ event.preventDefault(); const inp=this.querySelector('input'); inp.checked=!inp.checked; requestToggleInvoice(${inv.id}, inp.checked); }">
                        <input type="checkbox" ${inv.estado === 'activo' ? 'checked' : ''} onchange="requestToggleInvoice(${inv.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </td>`;
        body.appendChild(row);
    });
}

function showInvoiceResultsModal(){
    const overlay = document.getElementById('invoiceResultsModal');
    if (overlay) overlay.style.display = 'flex';
}
function hideInvoiceResultsModal(){
    const overlay = document.getElementById('invoiceResultsModal');
    if (overlay) overlay.style.display = 'none';
}

// Cerrar modal de resultados al hacer clic fuera
document.getElementById('invoiceResultsModal')?.addEventListener('click', function(e){ if (e.target === this) hideInvoiceResultsModal(); });

// ========================================
// FUNCIONES UTILITARIAS
// ========================================

function formatDate(dateString) {
    if (!dateString) return '';
    const s = String(dateString).trim();
    // Si viene en formato YYYY-MM-DD, formatear sin crear Date (evita desfase por zona horaria)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split('-');
        return `${d}/${m}/${y}`;
    }
    try {
        const date = new Date(s);
        return date.toLocaleDateString('es-CO');
    } catch (e) {
        return s;
    }
}

function formatNumber(number) {
    return new Intl.NumberFormat('es-CO').format(number);
}

// ==== FORMATO MONEDA PARA INPUTS ====
function formatCurrencyInputString(raw) {
    const digits = String(raw || '').replace(/[^\d]/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('es-CO').format(parseInt(digits, 10));
}

function parseCurrencyToNumber(raw) {
    const digits = String(raw || '').replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
}

function generateReport(type, startDate, endDate) {
    const city = getSelectedCityCode();
    if (!city) {
        showNotification('Seleccione una ciudad primero', 'warning');
        return;
    }
    if (type === 'facturas') {
        try {
            // Cargar facturas de la ciudad
            const raw = localStorage.getItem('invoicesByCity');
            const byCity = raw ? JSON.parse(raw) : {};
            const list = Array.isArray(byCity[city]) ? byCity[city] : [];
            // Cargar contratos para enriquecer datos del plan
            const contratosRaw = localStorage.getItem(`contratos_${city}`) || localStorage.getItem(`contracts_${city}`);
            const contratos = contratosRaw ? JSON.parse(contratosRaw) : [];
            // Filtrar por rango de fechas del documento (invoice.date)
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');
            const filtered = list.filter(inv => {
                try { const d = new Date(inv.date); return d >= start && d <= end; } catch(_) { return false; }
            });

            // Enriquecer con plan (valorTotal, cuotaInicial, numCuotas, valorCuota) y saldo
            const enriched = filtered.map(inv => {
                let planInfo = { valorPlan: null, cuotaInicial: null, numCuotas: null, mensualidad: null };
                try {
                    // Match por número de contrato o id
                    const match = Array.isArray(contratos) ? contratos.find(c => {
                        const num = (c.contractNumber || c.numero || c.numeroContrato || '').toString();
                        const idc = (c.id != null) ? String(c.id) : '';
                        const invContract = (inv.contractNumber || inv.contractId || '').toString();
                        return invContract && (invContract === num || invContract === idc);
                    }) : null;
                    if (match && match.planData) {
                        const pd = typeof match.planData === 'string' ? JSON.parse(match.planData) : match.planData;
                        planInfo.valorPlan = pd.valorPlan != null ? Number(pd.valorPlan) : null;
                        planInfo.cuotaInicial = pd.cuotaInicial != null ? Number(pd.cuotaInicial) : null;
                        planInfo.numCuotas = pd.numCuotas || pd.numeroCuotas || pd.cuotas || pd.totalCuotas || null;
                        planInfo.mensualidad = pd.mensualidad != null ? Number(pd.mensualidad) : null;
                    }
                } catch(_) {}
                const valorTotal = (planInfo.valorPlan != null) ? planInfo.valorPlan : (inv.value != null ? Number(inv.value) : null);
                const cuotaInicial = (planInfo.cuotaInicial != null) ? planInfo.cuotaInicial : null;
                const saldo = (valorTotal != null && cuotaInicial != null) ? Math.max(0, valorTotal - cuotaInicial) : null;
                return {
                    invoiceNumber: inv.invoiceNumber || '',
                    contractNumber: inv.contractNumber || inv.contractId || '',
                    date: inv.date || '',
                    clientId: inv.clientId || '',
                    clientName: inv.clientName || '',
                    valorTotal: valorTotal,
                    cuotaInicial: cuotaInicial,
                    saldo: saldo,
                    numCuotas: (planInfo.numCuotas != null && planInfo.numCuotas !== '') ? Number(planInfo.numCuotas) : 0,
                    valorCuota: planInfo.mensualidad,
                    executive: inv.executive || '',
                    ingreso: inv.ingreso || inv.productionRecord || '',
                    estado: (inv.estado === 'activo') ? 'ACTIVO' : 'ANULADO',
                    firstPaymentDate: inv.firstPaymentDate || ''
                };
            });

            // Persistir dataset temporal para el reporte
            localStorage.setItem('reporteFacturasData', JSON.stringify({ city, startDate, endDate, invoices: enriched }));
            // Abrir vista de reporte
            const url = `../facturas/reporte-facturas.html?ciudad=${encodeURIComponent(city)}&fechaInicial=${encodeURIComponent(startDate)}&fechaFinal=${encodeURIComponent(endDate)}`;
            window.open(url, '_blank');
            return;
        } catch (e) {
            console.error('Error generando reporte de facturas:', e);
            showNotification('Error generando el reporte de facturas', 'error');
            return;
        }
    }
    // Otros tipos (placeholders)
    showNotification(`Reporte de ${type} generado para el período ${startDate} - ${endDate}`, 'success');
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

