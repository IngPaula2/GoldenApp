/**
 * 🧭 CONTROL DE CONSECUTIVOS - GOLDEN APP
 *
 * Interfaz basada en "consecutivos" pero sin botón de cambiar ciudad.
 * Solo muestra el aviso inicial de selección de ciudad y gestiona los
 * campos: contratos, recibos oficiales, récord de producción y recibos de inscripción.
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

let controlConsecutivosData = [];
let controlSelectedCity = null;
let controlCurrentId = null;
let controlPendingUpdate = null;

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Control de Consecutivos...');
    showControlSelectCityModal();
    initializeControlEventListeners();
});

// ========================================
// EVENT LISTENERS
// ========================================

function initializeControlEventListeners() {
    // Botones crear/actualizar (si existen en el DOM)
    const bCrear = document.getElementById('cc_bCrear');
    const bCrearModal = document.getElementById('cc_bCrearModal');
    const bActualizar = document.getElementById('cc_bActualizar');
    const bBuscar = document.getElementById('cc_bBuscar');

    if (bCrear) bCrear.addEventListener('click', showControlCreateModal);
    if (bCrearModal) bCrearModal.addEventListener('click', handleControlCreateButtonClick);
    if (bActualizar) bActualizar.addEventListener('click', handleControlUpdate);
    if (bBuscar) bBuscar.addEventListener('click', showControlSearchModal);

    // Selección ciudad (no hay botón de cambiar ciudad en la interfaz principal)
    const bSeleccionarCiudad = document.getElementById('cc_bSeleccionarCiudad');
    if (bSeleccionarCiudad) bSeleccionarCiudad.addEventListener('click', handleControlSelectCity);
}

// ========================================
// CIUDADES
// ========================================

function showControlSelectCityModal() {
    console.log('🏙️ Mostrando modal selección de ciudad (control)...');
    const modal = document.getElementById('cc_selectCityModal');
    if (modal) {
        modal.classList.add('show');
        loadControlCitiesForSelection();
    }
}

function hideControlSelectCityModal() {
    const modal = document.getElementById('cc_selectCityModal');
    if (modal) modal.classList.remove('show');
}

function loadControlCitiesForSelection() {
    const citySelect = document.getElementById('cc_citySelect');
    if (!citySelect) return;

    let ciudades = {};
    if (typeof window.getCiudadesData === 'function') {
        try { ciudades = window.getCiudadesData(); } catch (e) { ciudades = {}; }
    } else {
        try {
            const raw = localStorage.getItem('ciudadesData');
            const parsed = raw ? JSON.parse(raw) : {};
            if (parsed && typeof parsed === 'object') {
                ciudades = Object.fromEntries(
                    Object.entries(parsed).filter(([k, v]) => v && typeof v === 'object' && v.codigo && v.nombre)
                );
            }
        } catch (e) { ciudades = {}; }
    }

    const current = citySelect.value;
    citySelect.innerHTML = '<option value="">Seleccione la ciudad</option>';

    Object.values(ciudades)
        .filter(c => c.activo !== false)
        .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
        .forEach(c => {
            const opt = document.createElement('option');
            const code = String(c.codigo || '').toUpperCase();
            const name = String(c.nombre || '').toUpperCase();
            opt.value = c.codigo;
            opt.textContent = `${code} - ${name}`;
            citySelect.appendChild(opt);
        });

    if (current && ciudades[current] && ciudades[current].activo !== false) {
        citySelect.value = current;
    }
}

function handleControlSelectCity() {
    const citySelect = document.getElementById('cc_citySelect');
    const selectedValue = citySelect ? citySelect.value : '';
    if (!selectedValue) {
        controlShowNotification('Por favor seleccione una ciudad', 'error');
        return;
    }

    const selectedOption = citySelect.options[citySelect.selectedIndex];
    const cityName = selectedOption ? selectedOption.textContent : '';

    controlSelectedCity = { codigo: selectedValue, nombre: cityName };

    updateControlCurrentCityDisplay(cityName);
    hideControlSelectCityModal();
    loadControlConsecutivosForCity(selectedValue);
    controlShowNotification(`Ciudad seleccionada: ${cityName}`, 'success');
}

function updateControlCurrentCityDisplay(cityName) {
    const el = document.getElementById('cc_currentCityName');
    if (el) el.textContent = cityName;
}

// ========================================
// DATOS CONTROL CONSECUTIVOS
// ========================================

function loadControlConsecutivosForCity(cityCode, clearData = false) {
    console.log(`📊 Cargando control-consecutivos para ciudad: ${cityCode}`);

    if (clearData) {
        controlConsecutivosData = [];
        try { localStorage.removeItem(`controlConsecutivos_${cityCode}`); } catch (e) {}
    } else {
        try {
            const raw = localStorage.getItem(`controlConsecutivos_${cityCode}`);
            controlConsecutivosData = raw ? (JSON.parse(raw) || []) : [];
        } catch (e) { controlConsecutivosData = []; }
    }

    renderControlConsecutivosTable();
}

function saveControlConsecutivosToStorage() {
    if (controlSelectedCity && controlSelectedCity.codigo) {
        try {
            localStorage.setItem(`controlConsecutivos_${controlSelectedCity.codigo}`,
                JSON.stringify(controlConsecutivosData));
        } catch (e) {}
    }
}

// ========================================
// RENDER TABLA
// ========================================

function renderControlConsecutivosTable() {
    const tbody = document.getElementById('cc_tableBody');
    if (!tbody) return;

    if (!controlConsecutivosData || controlConsecutivosData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-list-ol"></i>
                        <p>No existen registros</p>
                        <small>Haz clic en "Crear" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = controlConsecutivosData.map(item => `
        <tr>
            <td>${item.contratosInicial || ''} - ${item.contratosFinal || ''}</td>
            <td>${item.recibosOficialesInicial || ''} - ${item.recibosOficialesFinal || ''}</td>
            <td>${item.recordProduccionInicial || ''} - ${item.recordProduccionFinal || ''}</td>
            <td>${item.recibosInscripcionInicial || ''} - ${item.recibosInscripcionFinal || ''}</td>
            <td>${item.nombreCiudad || ''}</td>
            <td>
                <button class="btn btn-small" onclick="editControlConsecutivo(${item.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// CREAR
// ========================================

function showControlCreateModal() {
    const modal = document.getElementById('cc_createModal');
    if (modal) {
        modal.classList.add('show');
        clearControlCreateForm();
    }
}

function hideControlCreateModal() {
    const modal = document.getElementById('cc_createModal');
    if (modal) modal.classList.remove('show');
}

function handleControlCreateButtonClick() {
    if (!validateControlCreateForm()) {
        controlShowNotification('Complete los campos requeridos', 'error');
        return;
    }
    showControlConfirmCreateModal();
}

function showControlConfirmCreateModal() {
    const modal = document.getElementById('cc_confirmCreateModal');
    if (modal) modal.classList.add('show');
}

function hideControlConfirmCreateModal() {
    const modal = document.getElementById('cc_confirmCreateModal');
    if (modal) modal.classList.remove('show');
}

function confirmControlCreate() {
    console.log('🎉 Confirmando creación de consecutivos...');
    const formData = getControlCreateFormData();
    const newItem = {
        id: Date.now(),
        ...formData,
        nombreCiudad: controlSelectedCity ? controlSelectedCity.nombre : ''
    };
    controlConsecutivosData.push(newItem);
    saveControlConsecutivosToStorage();
    renderControlConsecutivosTable();
    hideControlConfirmCreateModal();
    hideControlCreateModal();
    
    // Mostrar modal de éxito en lugar de notificación verde
    console.log('📢 Mostrando modal de éxito de creación...');
    showControlSuccessCreateModal();
}

function cancelControlCreate() {
    hideControlConfirmCreateModal();
}

function getControlCreateFormData() {
    return {
        contratosInicial: document.getElementById('cc_tContratosInicial')?.value || '',
        contratosFinal: document.getElementById('cc_tContratosFinal')?.value || '',
        recibosOficialesInicial: document.getElementById('cc_tRecibosOficialesInicial')?.value || '',
        recibosOficialesFinal: document.getElementById('cc_tRecibosOficialesFinal')?.value || '',
        recordProduccionInicial: document.getElementById('cc_tRecordProduccionInicial')?.value || '',
        recordProduccionFinal: document.getElementById('cc_tRecordProduccionFinal')?.value || '',
        recibosInscripcionInicial: document.getElementById('cc_tRecibosInscripcionInicial')?.value || '',
        recibosInscripcionFinal: document.getElementById('cc_tRecibosInscripcionFinal')?.value || ''
    };
}

function clearControlCreateForm() {
    const inputs = document.querySelectorAll('#cc_createModal .form-input');
    inputs.forEach(i => { i.value = ''; i.classList.remove('error'); i.classList.remove('success'); });
}

function validateControlCreateForm() {
    const required = [
        'cc_tContratosInicial','cc_tContratosFinal',
        'cc_tRecibosOficialesInicial','cc_tRecibosOficialesFinal',
        'cc_tRecordProduccionInicial','cc_tRecordProduccionFinal',
        'cc_tRecibosInscripcionInicial','cc_tRecibosInscripcionFinal'
    ];
    let ok = true;
    required.forEach(id => { const el = document.getElementById(id); if (el && !String(el.value).trim()) ok = false; });
    return ok;
}

// ========================================
// ACTUALIZAR
// ========================================

function editControlConsecutivo(id) {
    const item = controlConsecutivosData.find(x => x.id === id);
    if (!item) { controlShowNotification('Registro no encontrado', 'error'); return; }
    controlCurrentId = id;
    const map = {
        cc_uContratosInicial: item.contratosInicial,
        cc_uContratosFinal: item.contratosFinal,
        cc_uRecibosOficialesInicial: item.recibosOficialesInicial,
        cc_uRecibosOficialesFinal: item.recibosOficialesFinal,
        cc_uRecordProduccionInicial: item.recordProduccionInicial,
        cc_uRecordProduccionFinal: item.recordProduccionFinal,
        cc_uRecibosInscripcionInicial: item.recibosInscripcionInicial,
        cc_uRecibosInscripcionFinal: item.recibosInscripcionFinal
    };
    Object.entries(map).forEach(([k, v]) => { const el = document.getElementById(k); if (el) el.value = v || ''; });
    showControlUpdateModal();
}

function showControlUpdateModal() {
    const modal = document.getElementById('cc_updateModal');
    if (modal) modal.classList.add('show');
}

function hideControlUpdateModal() {
    const modal = document.getElementById('cc_updateModal');
    if (modal) modal.classList.remove('show');
}

function handleControlUpdate() {
    if (!controlCurrentId) { controlShowNotification('No hay registro seleccionado', 'error'); return; }

    const fieldMap = {
        cc_uContratosInicial: 'contratosInicial',
        cc_uContratosFinal: 'contratosFinal',
        cc_uRecibosOficialesInicial: 'recibosOficialesInicial',
        cc_uRecibosOficialesFinal: 'recibosOficialesFinal',
        cc_uRecordProduccionInicial: 'recordProduccionInicial',
        cc_uRecordProduccionFinal: 'recordProduccionFinal',
        cc_uRecibosInscripcionInicial: 'recibosInscripcionInicial',
        cc_uRecibosInscripcionFinal: 'recibosInscripcionFinal'
    };
    const data = {};
    Object.entries(fieldMap).forEach(([inputId, prop]) => {
        const el = document.getElementById(inputId);
        if (el && (el.offsetParent !== null)) {
            const val = String(el.value || '').trim();
            if (val !== '') data[prop] = val;
        }
    });
    const requiredVisible = [
        'cc_uContratosInicial','cc_uContratosFinal',
        'cc_uRecibosOficialesInicial','cc_uRecibosOficialesFinal',
        'cc_uRecordProduccionInicial','cc_uRecordProduccionFinal',
        'cc_uRecibosInscripcionInicial','cc_uRecibosInscripcionFinal'
    ];
    let valid = true;
    requiredVisible.forEach(id => { const el = document.getElementById(id); if (el && el.offsetParent !== null && !String(el.value).trim()) valid = false; });
    if (!valid) { controlShowNotification('Complete los campos requeridos', 'error'); return; }

    controlPendingUpdate = data;
    showControlConfirmUpdateModal();
}

function showControlConfirmUpdateModal() {
    const modal = document.getElementById('cc_confirmUpdateModal');
    if (modal) modal.classList.add('show');
}

function hideControlConfirmUpdateModal() {
    const modal = document.getElementById('cc_confirmUpdateModal');
    if (modal) modal.classList.remove('show');
}

function confirmControlUpdate() {
    if (!controlCurrentId || !controlPendingUpdate) { hideControlConfirmUpdateModal(); return; }
    const idx = controlConsecutivosData.findIndex(x => x.id === controlCurrentId);
    if (idx !== -1) {
        controlConsecutivosData[idx] = {
            ...controlConsecutivosData[idx],
            ...controlPendingUpdate
        };
        saveControlConsecutivosToStorage();
        renderControlConsecutivosTable();
        hideControlConfirmUpdateModal();
        hideControlUpdateModal();
        controlShowNotification('Registro actualizado', 'success');
    }
    controlCurrentId = null;
    controlPendingUpdate = null;
}

// ========================================
// NOTIFICACIONES
// ========================================

// Función showNotification igual a la de titulares (estilo original)
if (typeof window.showNotification !== 'function') {
    window.showNotification = function(message, type = 'info') {
        try {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.classList.add('show'), 100);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => { try { document.body.removeChild(notification); } catch(e) {} }, 300);
            }, 3000);
        } catch (e) { console.log(message); }
    };
}

function controlShowNotification(message, type = 'info') {
    console.log(`🔔 controlShowNotification llamada: ${message} (${type})`);
    
    if (typeof window.showNotification === 'function') {
        try { 
            console.log('✅ Llamando window.showNotification...');
            window.showNotification(message, type); 
            return; 
        } catch (e) {
            console.log('❌ Error llamando showNotification:', e);
        }
    } else {
        console.log('❌ window.showNotification no está disponible');
    }
    
    // Fallback: crear notificación directamente
    try {
        console.log('🔄 Creando notificación directamente...');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => { try { document.body.removeChild(notification); } catch(e) {} }, 300);
        }, 3000);
        console.log('✅ Notificación creada directamente');
    } catch (e) {
        console.log('❌ Error creando notificación:', e);
    }
    
    console.log(`📢 [${type}] ${message}`);
}

// ========================================
// BÚSQUEDA
// ========================================

function showControlSearchModal() {
    const modal = document.getElementById('cc_searchModal');
    if (modal) {
        modal.classList.add('show');
        setTimeout(() => loadControlCitiesForSearch(), 50);
        const ciudad = document.getElementById('cc_searchCiudad');
        const tipo = document.getElementById('cc_searchTipo');
        if (ciudad) ciudad.value = '';
        if (tipo) tipo.value = '';
    }
}

function hideControlSearchModal() {
    const modal = document.getElementById('cc_searchModal');
    if (modal) modal.classList.remove('show');
}

function loadControlCitiesForSearch() {
    const select = document.getElementById('cc_searchCiudad');
    if (!select) return;
    let ciudades = {};
    if (typeof window.getCiudadesData === 'function') {
        try { ciudades = window.getCiudadesData(); } catch (e) { ciudades = {}; }
    } else {
        try {
            const raw = localStorage.getItem('ciudadesData');
            const parsed = raw ? JSON.parse(raw) : {};
            if (parsed && typeof parsed === 'object') {
                ciudades = Object.fromEntries(
                    Object.entries(parsed).filter(([k, v]) => v && typeof v === 'object' && v.codigo && v.nombre)
                );
            }
        } catch (e) { ciudades = {}; }
    }
    const current = select.value;
    select.innerHTML = '<option value="">Seleccione la ciudad</option>';
    Object.values(ciudades)
        .filter(c => c.activo !== false)
        .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
        .forEach(c => {
            const opt = document.createElement('option');
            const code = String(c.codigo || '').toUpperCase();
            const name = String(c.nombre || '').toUpperCase();
            opt.value = c.codigo;
            opt.textContent = `${code} - ${name}`;
            select.appendChild(opt);
        });
    if (current && ciudades[current] && ciudades[current].activo !== false) select.value = current;
}

function handleControlSearch() {
    console.log('🔍 Buscando consecutivo de control...');
    
    const ciudadCodigo = document.getElementById('cc_searchCiudad')?.value || '';
    const tipo = document.getElementById('cc_searchTipo')?.value || '';
    
    if (!ciudadCodigo || !tipo) {
        controlShowNotification('Por favor seleccione ciudad y tipo de consecutivo', 'error');
        return;
    }
    
    // Obtener nombre de la ciudad
    let ciudadNombre = 'CIUDAD';
    try {
        if (typeof window.getCiudadesData === 'function') {
            const ciudades = window.getCiudadesData();
            if (ciudades[ciudadCodigo]) {
                ciudadNombre = ciudades[ciudadCodigo].nombre;
            }
        } else {
            const raw = localStorage.getItem('ciudadesData');
            const ciudades = raw ? JSON.parse(raw) : {};
            if (ciudades[ciudadCodigo]) {
                ciudadNombre = ciudades[ciudadCodigo].nombre;
            }
        }
    } catch (e) {}
    
    // Cargar consecutivos de la ciudad seleccionada (sin limpiar datos)
    loadControlConsecutivosForCity(ciudadCodigo, false);

    // Filtrar por tipo de consecutivo
    let consecutivosFiltrados = [];
    if (controlConsecutivosData.length > 0) {
        const item = controlConsecutivosData[0]; // Solo hay uno por ciudad
        switch (tipo) {
            case 'contratos':
                consecutivosFiltrados = [{
                    key: 'contratos',
                    tipo: 'Contratos',
                    inicial: item.contratosInicial,
                    final: item.contratosFinal
                }];
                break;
            case 'recibosOficiales':
                consecutivosFiltrados = [{
                    key: 'recibosOficiales',
                    tipo: 'Recibos Oficiales',
                    inicial: item.recibosOficialesInicial,
                    final: item.recibosOficialesFinal
                }];
                break;
            case 'recordProduccion':
                consecutivosFiltrados = [{
                    key: 'recordProduccion',
                    tipo: 'Récord de Producción',
                    inicial: item.recordProduccionInicial,
                    final: item.recordProduccionFinal
                }];
                break;
            case 'recibosInscripcion':
                consecutivosFiltrados = [{
                    key: 'recibosInscripcion',
                    tipo: 'Recibos de Inscripción',
                    inicial: item.recibosInscripcionInicial,
                    final: item.recibosInscripcionFinal
                }];
                break;
        }
    }
    
    if (consecutivosFiltrados.length > 0) {
        controlShowNotification(`Consecutivos encontrados para ${ciudadNombre}`, 'success');
        renderControlSearchResults(consecutivosFiltrados, ciudadCodigo);
        hideControlSearchModal();
        showControlResultsModal();
    } else {
        controlShowNotification('No se encontraron consecutivos para los criterios seleccionados', 'error');
    }
}

function renderControlSearchResults(items, ciudadCodigo) {
    const info = document.getElementById('cc_resultsInfo');
    let ciudadNombre = 'CIUDAD';
    try {
        if (typeof window.getCiudadesData === 'function') {
            const ciudades = window.getCiudadesData();
            if (ciudades[ciudadCodigo]) ciudadNombre = ciudades[ciudadCodigo].nombre;
        } else {
            const raw = localStorage.getItem('ciudadesData');
            const ciudades = raw ? JSON.parse(raw) : {};
            if (ciudades[ciudadCodigo]) ciudadNombre = ciudades[ciudadCodigo].nombre;
        }
    } catch (e) {}
    if (info) info.textContent = `Ciudad: ${ciudadNombre}`;
    const tbody = document.getElementById('cc_resultsTableBody');
    if (!tbody) return;
    tbody.innerHTML = items.map(it => `
        <tr>
            <td>${it.tipo}</td>
            <td>${it.inicial || ''}</td>
            <td>${it.final || ''}</td>
            <td>${ciudadNombre}</td>
            <td>
                <button class="btn btn-small" onclick="editControlFromResults()">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </td>
        </tr>
    `).join('');
}

function editControlFromResults() {
    console.log('✏️ Editando desde resultados de búsqueda...');
    if (controlConsecutivosData.length === 0) return;
    const item = controlConsecutivosData[0];
    const selectedType = document.getElementById('cc_searchTipo')?.value || '';
    
    // Guardar el tipo seleccionado para la actualización
    window.currentEditingType = selectedType;
    controlCurrentId = item.id;
    
    // Mapeo de tipos a nombres legibles
    const typeNames = {
        contratos: 'Contratos',
        recibosOficiales: 'Recibos Oficiales', 
        recordProduccion: 'Récord de Producción',
        recibosInscripcion: 'Recibos de Inscripción'
    };
    
    // Mapeo de tipos a valores
    const map = {
        contratos: { vi: item.contratosInicial, vf: item.contratosFinal },
        recibosOficiales: { vi: item.recibosOficialesInicial, vf: item.recibosOficialesFinal },
        recordProduccion: { vi: item.recordProduccionInicial, vf: item.recordProduccionFinal },
        recibosInscripcion: { vi: item.recibosInscripcionInicial, vf: item.recibosInscripcionFinal }
    };
    
    const cfg = map[selectedType];
    if (cfg) {
        // Llenar el modal específico
        document.getElementById('cc_specificTipo').value = typeNames[selectedType] || selectedType;
        document.getElementById('cc_specificInicial').value = cfg.vi || '';
        document.getElementById('cc_specificFinal').value = cfg.vf || '';
        
        // Mostrar modal específico SIN cerrar resultados
        showControlUpdateSpecificModal();
        // NO cerrar resultados: hideControlResultsModal();
    }
}

function showControlResultsModal() {
    const modal = document.getElementById('cc_resultsModal');
    if (modal) modal.classList.add('show');
}

function hideControlResultsModal() {
    const modal = document.getElementById('cc_resultsModal');
    if (modal) modal.classList.remove('show');
}

// ========================================
// MODAL ESPECÍFICO DE ACTUALIZACIÓN
// ========================================

function showControlUpdateSpecificModal() {
    const modal = document.getElementById('cc_updateSpecificModal');
    if (modal) modal.classList.add('show');
}

function hideControlUpdateSpecificModal() {
    const modal = document.getElementById('cc_updateSpecificModal');
    if (modal) modal.classList.remove('show');
}

function handleControlUpdateSpecific() {
    console.log('🔄 Validando actualización de consecutivo específico...');
    
    const inicial = document.getElementById('cc_specificInicial')?.value || '';
    const final = document.getElementById('cc_specificFinal')?.value || '';
    const tipo = window.currentEditingType;
    
    if (!inicial || !final) {
        controlShowNotification('Complete los campos requeridos', 'error');
        return;
    }
    
    if (!controlCurrentId || !tipo) {
        controlShowNotification('Error: No se encontró el registro a actualizar', 'error');
        return;
    }
    
    // Guardar los datos para la confirmación
    window.pendingUpdateData = {
        inicial: inicial,
        final: final,
        tipo: tipo
    };
    
    // Mostrar modal de confirmación
    showControlConfirmUpdateSpecificModal();
}

function showControlConfirmUpdateSpecificModal() {
    const modal = document.getElementById('cc_confirmUpdateSpecificModal');
    if (modal) modal.classList.add('show');
}

function hideControlConfirmUpdateSpecificModal() {
    const modal = document.getElementById('cc_confirmUpdateSpecificModal');
    if (modal) modal.classList.remove('show');
}

function showControlSuccessModal() {
    const modal = document.getElementById('cc_successModal');
    if (modal) modal.classList.add('show');
}

function hideControlSuccessModal() {
    const modal = document.getElementById('cc_successModal');
    if (modal) modal.classList.remove('show');
    
    // Regresar a los resultados de búsqueda
    console.log('🔄 Regresando a resultados de búsqueda...');
    showControlResultsModal();
}

function showControlSuccessCreateModal() {
    const modal = document.getElementById('cc_successCreateModal');
    if (modal) modal.classList.add('show');
}

function hideControlSuccessCreateModal() {
    const modal = document.getElementById('cc_successCreateModal');
    if (modal) modal.classList.remove('show');
    
    // Regresar a la tabla principal
    console.log('🔄 Regresando a la tabla principal...');
    renderControlConsecutivosTable();
}

function confirmControlUpdateSpecific() {
    console.log('✅ Confirmando actualización de consecutivo específico...');
    
    const { inicial, final, tipo } = window.pendingUpdateData || {};
    
    if (!inicial || !final || !tipo || !controlCurrentId) {
        controlShowNotification('Error: Datos de actualización no válidos', 'error');
        hideControlConfirmUpdateSpecificModal();
        return;
    }
    
    // Buscar el item en los datos
    const itemIndex = controlConsecutivosData.findIndex(x => x.id === controlCurrentId);
    if (itemIndex === -1) {
        controlShowNotification('Error: Registro no encontrado', 'error');
        hideControlConfirmUpdateSpecificModal();
        return;
    }
    
    // Actualizar solo el tipo específico
    const updateData = {};
    if (tipo === 'contratos') {
        updateData.contratosInicial = inicial;
        updateData.contratosFinal = final;
    } else if (tipo === 'recibosOficiales') {
        updateData.recibosOficialesInicial = inicial;
        updateData.recibosOficialesFinal = final;
    } else if (tipo === 'recordProduccion') {
        updateData.recordProduccionInicial = inicial;
        updateData.recordProduccionFinal = final;
    } else if (tipo === 'recibosInscripcion') {
        updateData.recibosInscripcionInicial = inicial;
        updateData.recibosInscripcionFinal = final;
    }
    
    // Aplicar la actualización
    controlConsecutivosData[itemIndex] = {
        ...controlConsecutivosData[itemIndex],
        ...updateData
    };
    
    // Guardar y actualizar
    saveControlConsecutivosToStorage();
    renderControlConsecutivosTable();
    
    // Actualizar los resultados de búsqueda si están abiertos
    console.log('🔄 Actualizando resultados de búsqueda...');
    updateControlSearchResults();
    console.log('✅ Resultados actualizados');
    
    // Cerrar modales de confirmación y edición
    hideControlConfirmUpdateSpecificModal();
    hideControlUpdateSpecificModal();
    
    // Mostrar modal de éxito en lugar de notificación verde
    console.log('📢 Mostrando modal de éxito...');
    showControlSuccessModal();
    console.log('✅ Modal de éxito mostrado');
    
    // Limpiar variables
    controlCurrentId = null;
    window.currentEditingType = null;
    window.pendingUpdateData = null;
}

function updateControlSearchResults() {
    console.log('🔄 Actualizando resultados de búsqueda...');
    
    // Verificar si el modal de resultados está abierto
    const resultsModal = document.getElementById('cc_resultsModal');
    if (!resultsModal || !resultsModal.classList.contains('show')) {
        console.log('Modal de resultados no está abierto, no se actualiza');
        return;
    }
    
    // Obtener los datos de búsqueda actuales
    const ciudadCodigo = document.getElementById('cc_searchCiudad')?.value || '';
    const tipo = document.getElementById('cc_searchTipo')?.value || '';
    
    if (!ciudadCodigo || !tipo) {
        console.log('No hay datos de búsqueda para actualizar');
        return;
    }
    
    // Recargar los datos de la ciudad
    loadControlConsecutivosForCity(ciudadCodigo, false);
    
    // Regenerar los resultados
    let resultados = [];
    if (controlConsecutivosData.length > 0) {
        const item = controlConsecutivosData[0];
        const map = {
            contratos: { tipo: 'Contratos', inicial: item.contratosInicial, final: item.contratosFinal },
            recibosOficiales: { tipo: 'Recibos Oficiales', inicial: item.recibosOficialesInicial, final: item.recibosOficialesFinal },
            recordProduccion: { tipo: 'Récord de Producción', inicial: item.recordProduccionInicial, final: item.recordProduccionFinal },
            recibosInscripcion: { tipo: 'Recibos de Inscripción', inicial: item.recibosInscripcionInicial, final: item.recibosInscripcionFinal }
        };
        const it = map[tipo];
        if (it) resultados = [{ key: tipo, ...it }];
    }
    
    // Actualizar la tabla de resultados
    renderControlSearchResults(resultados, ciudadCodigo);
    console.log('✅ Resultados de búsqueda actualizados');
}

// ========================================
// EXPORTAR FUNCIONES
// ========================================

window.showControlSelectCityModal = showControlSelectCityModal;
window.hideControlSelectCityModal = hideControlSelectCityModal;
window.handleControlSelectCity = handleControlSelectCity;

window.showControlCreateModal = showControlCreateModal;
window.hideControlCreateModal = hideControlCreateModal;
window.handleControlCreateButtonClick = handleControlCreateButtonClick;
window.confirmControlCreate = confirmControlCreate;
window.cancelControlCreate = cancelControlCreate;

window.editControlConsecutivo = editControlConsecutivo;
window.showControlUpdateModal = showControlUpdateModal;
window.hideControlUpdateModal = hideControlUpdateModal;
window.handleControlUpdate = handleControlUpdate;
window.confirmControlUpdate = confirmControlUpdate;

window.showControlConfirmCreateModal = showControlConfirmCreateModal;
window.hideControlConfirmCreateModal = hideControlConfirmCreateModal;
window.showControlConfirmUpdateModal = showControlConfirmUpdateModal;
window.hideControlConfirmUpdateModal = hideControlConfirmUpdateModal;

window.showControlSearchModal = showControlSearchModal;
window.hideControlSearchModal = hideControlSearchModal;
window.handleControlSearch = handleControlSearch;
window.showControlResultsModal = showControlResultsModal;
window.hideControlResultsModal = hideControlResultsModal;
window.editControlFromResults = editControlFromResults;

window.showControlUpdateSpecificModal = showControlUpdateSpecificModal;
window.hideControlUpdateSpecificModal = hideControlUpdateSpecificModal;
window.handleControlUpdateSpecific = handleControlUpdateSpecific;

window.showControlConfirmUpdateSpecificModal = showControlConfirmUpdateSpecificModal;
window.hideControlConfirmUpdateSpecificModal = hideControlConfirmUpdateSpecificModal;
window.confirmControlUpdateSpecific = confirmControlUpdateSpecific;

window.showControlSuccessModal = showControlSuccessModal;
window.hideControlSuccessModal = hideControlSuccessModal;

window.showControlSuccessCreateModal = showControlSuccessCreateModal;
window.hideControlSuccessCreateModal = hideControlSuccessCreateModal;

// ========================================
// FUNCIÓN DE PRUEBA PARA NOTIFICACIONES
// ========================================

// Función de prueba para verificar notificaciones
window.testControlNotification = function() {
    console.log('🧪 Probando notificaciones en Control de Consecutivos...');
    showNotification('Prueba de notificación exitosa', 'success');
    setTimeout(() => showNotification('Prueba de advertencia', 'warning'), 1000);
    setTimeout(() => showNotification('Prueba de error', 'error'), 2000);
    setTimeout(() => showNotification('Prueba de información', 'info'), 3000);
};

console.log('✅ Control de Consecutivos cargado');


