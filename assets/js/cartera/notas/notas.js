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
                loadNotes();
            } else {
                alert('Por favor seleccione una ciudad');
            }
        });
    }
    
    // Botón buscar nota
    const bBuscarNota = document.getElementById('bBuscarNota');
    if (bBuscarNota) {
        bBuscarNota.addEventListener('click', function() {
            searchNote();
        });
    }
    
    // Botón crear nota
    const bCrearNota = document.getElementById('bCrearNota');
    if (bCrearNota) {
        bCrearNota.addEventListener('click', function() {
            validateAndShowConfirmCreate();
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

function showSearchNoteModal() {
    const modal = document.getElementById('searchNoteModal');
    if (modal) modal.style.display = 'flex';
}

function hideSearchNoteModal() {
    const modal = document.getElementById('searchNoteModal');
    if (modal) modal.style.display = 'none';
}

function showCreateNoteModal() {
    const modal = document.getElementById('createNoteModal');
    if (modal) {
        // Limpiar formulario
        const form = document.getElementById('createNoteForm');
        if (form) form.reset();
        
        // Establecer fecha actual
        const dateInput = document.getElementById('noteDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
        
        // TODO: Generar número de nota automático
        const noteNumberInput = document.getElementById('noteNumber');
        if (noteNumberInput) {
            noteNumberInput.value = '0001'; // Placeholder
        }
        
        modal.style.display = 'flex';
    }
}

function hideCreateNoteModal() {
    const modal = document.getElementById('createNoteModal');
    if (modal) modal.style.display = 'none';
}

function showReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'flex';
}

function hideReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'none';
}

// ========================================
// FUNCIONES DE OPERACIONES
// ========================================

function loadNotes() {
    // TODO: Llamar al backend para cargar notas
    const tableBody = document.getElementById('notesTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-sticky-note"></i>
                        <p>No existen registros de notas</p>
                        <small>Haz clic en "Crear Nota" para crear el primer registro</small>
                    </div>
                </td>
            </tr>
        `;
    }
}

function searchNote() {
    // TODO: Implementar búsqueda
    alert('Funcionalidad de búsqueda en desarrollo');
    hideSearchNoteModal();
}

function validateAndShowConfirmCreate() {
    const form = document.getElementById('createNoteForm');
    if (form && form.checkValidity()) {
        showConfirmCreateNoteModal();
    } else {
        form.reportValidity();
    }
}

function showConfirmCreateNoteModal() {
    const modal = document.getElementById('confirmCreateNoteModal');
    if (modal) modal.style.display = 'flex';
}

function cancelCreateNote() {
    const modal = document.getElementById('confirmCreateNoteModal');
    if (modal) modal.style.display = 'none';
}

function confirmCreateNote() {
    // TODO: Llamar al backend para crear nota
    hideCreateNoteModal();
    cancelCreateNote();
    showSuccessCreateNoteModal();
}

function showSuccessCreateNoteModal() {
    const modal = document.getElementById('successCreateNoteModal');
    if (modal) modal.style.display = 'flex';
}

function closeSuccessCreateNoteModal() {
    const modal = document.getElementById('successCreateNoteModal');
    if (modal) modal.style.display = 'none';
    loadNotes();
}

function generateReport() {
    // TODO: Implementar generación de reporte
    alert('Funcionalidad de reporte en desarrollo');
    hideReportModal();
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

