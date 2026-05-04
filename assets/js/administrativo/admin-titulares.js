/**
 * 🏢 DASHBOARD ADMINISTRATIVO - TITULARES - GOLDEN APP
 * 
 * Este archivo contiene toda la funcionalidad del panel administrativo de titulares.
 * Incluye gestión de modales, navegación, formularios y operaciones CRUD para titulares y beneficiarios.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2024
 */

// ========================================
// VARIABLES GLOBALES
// ========================================

// DATOS EN MEMORIA
const titularesData = {}; // Solo bucket activo en la UI
const beneficiariosData = {}; // Solo bucket activo en la UI
// Mapa de relación: titularId -> array de beneficiarios
const titularIdToBeneficiarios = {};
// Último titular buscado (para "Añadir Beneficiario")
let currentSearchedTitularId = null;

// ========================================
// FUNCIONES GLOBALES DE MODALES
// ========================================

/**
 * Oculta el modal de crear titular y limpia el formulario
 */
function hideCreateTitularModal() {
    console.log('🔍 Cerrando modal de titular...');
    const createTitularModalOverlay = document.getElementById('createTitularModal');
    if (createTitularModalOverlay) {
        createTitularModalOverlay.style.display = 'none';
        createTitularModalOverlay.classList.remove('show');
        document.body.style.overflow = '';
        console.log('✅ Modal de titular cerrado');
        // Limpiar campos del formulario
        if (typeof clearCreateTitularForm === 'function') {
            clearCreateTitularForm();
        }
    } else {
        console.log('⚠️ Modal createTitularModal no encontrado - posiblemente no estamos en la página correcta');
    }
}

// Exponer función globalmente
window.hideCreateTitularModal = hideCreateTitularModal;

/**
 * Muestra el modal de confirmación para crear titular
 */
function showConfirmCreateTitularModal() {
    console.log('🔍 Mostrando modal de confirmación para titular...');
    const modal = document.getElementById('confirmCreateTitularModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log('✅ Modal de confirmación para titular mostrado');
    } else {
        console.error('❌ No se encontró el modal confirmCreateTitularModal');
    }
}

/**
 * Cancela la creación del titular
 */
function cancelCreateTitular() {
    const modal = document.getElementById('confirmCreateTitularModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Limpiar datos temporales
    window.tempTitularData = null;
}

/**
 * Confirma la creación del titular
 */
function confirmCreateTitular() {
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('confirmCreateTitularModal');
    if (confirmModal) {
        confirmModal.classList.remove('show');
    }
    
    // Obtener datos temporales
    const titularData = window.tempTitularData;
    
    if (!titularData) {
        console.error('No se encontraron datos del titular para crear');
        return;
    }
    
    console.log('Datos del titular a crear:', titularData);
    
    // ========================================
    // 🔗 CONEXIÓN BACKEND - CREAR TITULAR
    // ========================================
    // Endpoint: POST /api/titulares
    // Datos: { numeroId, tipoId, apellido1, apellido2, nombre1, nombre2, direccion, barrio, celular, correo, fechaIngreso, activo, beneficiario }
    
    // TODO: Aquí se enviarían los datos al backend
    // Por ahora solo guardamos en memoria
    
    // Verificar si el titular tiene beneficiario
    if (titularData.beneficiario && titularData.beneficiario.toUpperCase() === 'SI') {
        // Si tiene beneficiario, guardar datos temporalmente y abrir modal de beneficiario
        sessionStorage.setItem('tempTitular', JSON.stringify(titularData));
        hideCreateTitularModal();
        if (typeof showCreateBeneficiarioModal === 'function') {
            showCreateBeneficiarioModal();
        }
    } else {
        // Si no tiene beneficiario, crear el titular directamente
        // Guardar por ciudad y persistir
        const city = getSelectedCityCode();
        if (!city) { 
            if (typeof showNotification === 'function') {
                showNotification('Seleccione una ciudad primero', 'warning');
            }
            return; 
        }
        if (!titularesByCity[city]) titularesByCity[city] = {};
        const toSave = { ...titularData, ciudad: city };
        titularesByCity[city][titularData.numeroId] = toSave;
        if (typeof persistTitularesByCity === 'function') {
            persistTitularesByCity();
        }
        // También reflejar en memoria y UI actual
        titularesData[titularData.numeroId] = toSave;
        
        // Persistir en localStorage
        try { localStorage.setItem('titularesData', JSON.stringify(titularesData)); } catch (e) {}
        
        // Cerrar modal de creación y limpiar formulario
        hideCreateTitularModal();
        
        // Agregar el titular a la tabla
        if (typeof addTitularToTable === 'function') {
            addTitularToTable(titularData);
        }
        
        // Mostrar modal de éxito
        if (typeof showSuccessCreateTitularModal === 'function') {
            showSuccessCreateTitularModal();
        }
    }
    
    // Limpiar datos temporales
    window.tempTitularData = null;
}

/**
 * Cierra el modal de éxito de titular
 */
function closeSuccessTitularModal() {
    const modal = document.getElementById('successCreateTitularModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Muestra el modal de éxito para crear titular
 */
function showSuccessCreateTitularModal() {
    const modal = document.getElementById('successCreateTitularModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Limpia todos los campos del formulario de crear titular
 */
function clearCreateTitularForm() {
    document.getElementById('cTipo_Id').value = '';
    document.getElementById('tId').value = '';
    document.getElementById('tApellido1').value = '';
    document.getElementById('tApellido2').value = '';
    document.getElementById('tNombre1').value = '';
    document.getElementById('tNombre2').value = '';
    document.getElementById('tDireccion').value = '';
    document.getElementById('tBarrioT').value = '';
    document.getElementById('tCelular').value = '';
    document.getElementById('tCorreo').value = '';
    document.getElementById('tFecha_Ingreso').value = '';
    document.getElementById('cActivo').value = '';
    document.getElementById('cBeneficiario').value = '';
    
    // Limpiar estado de botones toggle
    const toggleButtons = document.querySelectorAll('.btn-toggle');
    toggleButtons.forEach(btn => btn.classList.remove('active'));
    
    // Limpiar atributo de ID original
    document.getElementById('tId').removeAttribute('data-original-id');
    
    // Restaurar modo "crear" (título y botón)
    document.getElementById('createTitularTitle').textContent = 'CREAR TITULAR';
    document.getElementById('bCrear').textContent = 'Crear';
}

/**
 * Agrega un nuevo titular a la tabla o actualiza uno existente
 * @param {Object} titular - Objeto con los datos del titular
 * @param {boolean} replaceIfExists - Si es true, actualiza la fila existente
 */
function addTitularToTable(titular, replaceIfExists = false) {
    const tableBody = document.getElementById('titularesTableBody');
    const noDataRow = tableBody.querySelector('.no-data-message');
    
    if (noDataRow) {
        noDataRow.remove();
    }
    
    // Si existe, y se solicita reemplazar, actualizar la fila
    const allRows = Array.from(tableBody.querySelectorAll('tr'));
    const existingRow = allRows.find(r => {
        const idCell = r.querySelector('td:nth-child(2)');
        if (!idCell) return false;
        // Verificar que no sea una fila de "no-data-message"
        if (idCell.hasAttribute('colspan') || r.querySelector('.no-data-message')) return false;
        return idCell.textContent.trim() === titular.numeroId.trim();
    });
    
    // Concatenar nombre completo
    const nombreCompleto = [
        titular.apellido1 || '',
        titular.apellido2 || '',
        titular.nombre1 || '',
        titular.nombre2 || ''
    ].filter(nombre => nombre.trim() !== '').join(' ');
    
    const isActive = (String(titular.activo || 'SI').toUpperCase() === 'SI');
    const rowHtml = `
        <td>${titular.tipoId || ''}</td>
        <td>${titular.numeroId}</td>
        <td>${nombreCompleto}</td>
        <td>${titular.direccion || ''}</td>
        <td>${titular.barrio || ''}</td>
        <td>${titular.celular || titular.telefono || ''}</td>
        <td>${titular.correo || titular.email || ''}</td>
        <td>
            <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVO' : 'INACTIVO'}</span>
        </td>
        <td>
            <div class="options-inline" style="display:flex; align-items:center; gap:12px;">
                <button class="btn btn-small" onclick="editTitular('${titular.numeroId}')">
                    <i class="fas fa-edit"></i>
                </button>
                <label class="animated-toggle" data-id="${titular.numeroId}" title="${isActive ? 'Desactivar' : 'Activar'}" style="display:inline-flex;" for="toggleTitular_${titular.numeroId}">
                    <input type="checkbox" id="toggleTitular_${titular.numeroId}" name="toggleTitular_${titular.numeroId}" ${isActive ? 'checked' : ''} onchange="toggleTitularState('${titular.numeroId}')">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </td>
    `;
    
    if (existingRow && replaceIfExists) {
        // Actualizar fila existente
        existingRow.innerHTML = rowHtml;
    } else if (!existingRow) {
        // Crear nueva fila solo si no existe
        const newRow = document.createElement('tr');
        newRow.innerHTML = rowHtml;
        tableBody.appendChild(newRow);
        
        // Agregar efectos hover a la nueva fila
        newRow.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        newRow.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    }
    // Si existe pero no se debe reemplazar, no hacer nada
}

/**
 * Muestra el modal de confirmación para crear beneficiario
 */
function showConfirmCreateBeneficiarioModal() {
    console.log('🔍 Intentando mostrar modal de confirmación de creación');
    const modal = document.getElementById('confirmCreateBeneficiarioModal');
    if (modal) {
        console.log('✅ Modal de creación encontrado, mostrando...');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    } else {
        console.error('❌ No se encontró el modal confirmCreateBeneficiarioModal');
    }
}

/**
 * Cancela la creación del beneficiario
 */
function cancelCreateBeneficiario() {
    const modal = document.getElementById('confirmCreateBeneficiarioModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Limpiar datos temporales
    window.tempBeneficiarioData = null;
}

/**
 * Confirma la creación del beneficiario
 */
function confirmCreateBeneficiario() {
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('confirmCreateBeneficiarioModal');
    if (confirmModal) {
        confirmModal.classList.remove('show');
    }
    
    // Obtener datos temporales
    const beneficiarioData = window.tempBeneficiarioData;
    
    if (!beneficiarioData) {
        console.error('No se encontraron datos del beneficiario para crear');
        return;
    }
    
    console.log('Datos del beneficiario a crear:', beneficiarioData);
    
    // ========================================
    // 🔗 CONEXIÓN BACKEND - CREAR BENEFICIARIO
    // ========================================
    // Endpoint: POST /api/beneficiarios
    // Datos: { numeroId, tipoId, apellido1, apellido2, nombre1, nombre2, direccion, barrio, celular, correo, fechaIngreso, activo, titularId, parentesco }
    
    // Verificar si viene del modal de titular
    const tempTitular = sessionStorage.getItem('tempTitular');
    console.log('🔍 Verificando tempTitular:', tempTitular);
    
    if (tempTitular) {
        console.log('🔍 Creando titular y beneficiario juntos...');
        // Si viene del modal de titular, crear tanto titular como beneficiario
        const titular = JSON.parse(tempTitular);
        
        // Guardar por ciudad y persistir
        const city = getSelectedCityCode();
        if (!city) { 
            if (typeof showNotification === 'function') {
                showNotification('Seleccione una ciudad primero', 'warning');
            }
            return; 
        }
        
        // Guardar titular en titularesByCity
        if (!titularesByCity[city]) titularesByCity[city] = {};
        const toSave = { ...titular, ciudad: city };
        titularesByCity[city][titular.numeroId] = toSave;
        if (typeof persistTitularesByCity === 'function') {
            persistTitularesByCity();
        }
        
        // También reflejar en memoria y UI actual
        titularesData[titular.numeroId] = toSave;
        
        // Persistir en localStorage (backup)
        try { localStorage.setItem('titularesData', JSON.stringify(titularesData)); } catch (e) {}
        
        if (typeof addTitularToTable === 'function') {
            addTitularToTable(titular, true);
        }
        
        // Guardar beneficiario en beneficiariosByCity
        if (!beneficiariosByCity[city]) beneficiariosByCity[city] = {};
        const beneficiarioToSave = { ...beneficiarioData, ciudad: city, titularId: titular.numeroId };
        beneficiariosByCity[city][beneficiarioData.numeroId] = beneficiarioToSave;
        if (typeof persistBeneficiariosByCity === 'function') {
            persistBeneficiariosByCity();
        }
        
        // Persistir beneficiario en memoria
        beneficiariosData[beneficiarioData.numeroId] = beneficiarioToSave;
        
        // Persistir beneficiario y asociarlo al titular (actualiza/insert)
        if (typeof updateBeneficiarioInTable === 'function') {
            updateBeneficiarioInTable(beneficiarioData, beneficiarioData.numeroId);
        }
        if (!titularIdToBeneficiarios[titular.numeroId]) {
            titularIdToBeneficiarios[titular.numeroId] = [];
        }
        titularIdToBeneficiarios[titular.numeroId].push(beneficiarioData);
        
        // Persistir relaciones en localStorage
        try { localStorage.setItem('titularIdToBeneficiarios', JSON.stringify(titularIdToBeneficiarios)); } catch (e) {}
        try { localStorage.setItem('beneficiariosData', JSON.stringify(beneficiariosData)); } catch (e) {}
        
        // Limpiar datos temporales
        sessionStorage.removeItem('tempTitular');
        
        // Cerrar modal de creación
        if (typeof hideCreateBeneficiarioModal === 'function') {
            hideCreateBeneficiarioModal();
        }
        
        // Mostrar modal de éxito específico para titular y beneficiario
        if (typeof showSuccessCreateTitularBeneficiarioModal === 'function') {
            showSuccessCreateTitularBeneficiarioModal();
        }
    } else {
        // Verificar si viene desde "Añadir Beneficiario" en resultados de titular
        const titularFromResults = sessionStorage.getItem('currentSearchedTitularId');
        console.log('🔍 Verificando titularFromResults:', titularFromResults);
        
        if (titularFromResults) {
            console.log('🔍 Creando beneficiario para titular desde resultados:', titularFromResults);
            
            // Guardar por ciudad y persistir
            const city = getSelectedCityCode();
            if (!city) { 
                if (typeof showNotification === 'function') {
                    showNotification('Seleccione una ciudad primero', 'warning');
                }
                return; 
            }
            
            // Guardar beneficiario en beneficiariosByCity
            if (!beneficiariosByCity[city]) beneficiariosByCity[city] = {};
            const beneficiarioToSave = { ...beneficiarioData, ciudad: city, titularId: titularFromResults };
            beneficiariosByCity[city][beneficiarioData.numeroId] = beneficiarioToSave;
            if (typeof persistBeneficiariosByCity === 'function') {
                persistBeneficiariosByCity();
            }
            
            // Persistir beneficiario en memoria
            beneficiariosData[beneficiarioData.numeroId] = beneficiarioToSave;
            
            // Actualizar o agregar beneficiario en la tabla principal
            if (typeof updateBeneficiarioInTable === 'function') {
                updateBeneficiarioInTable(beneficiarioData, beneficiarioData.numeroId);
            }
            
            // Asociar el beneficiario al titular - SIGUIENDO EL PATRÓN DE CIUDADES
            if (!titularIdToBeneficiarios[titularFromResults]) {
                titularIdToBeneficiarios[titularFromResults] = [];
            }
            titularIdToBeneficiarios[titularFromResults].push(beneficiarioData);
            
            // Persistir relaciones en localStorage
            try { localStorage.setItem('titularIdToBeneficiarios', JSON.stringify(titularIdToBeneficiarios)); } catch (e) {}
            try { localStorage.setItem('beneficiariosData', JSON.stringify(beneficiariosData)); } catch (e) {}
            
            // Re-renderizar la tabla de resultados de titular
            if (typeof renderBeneficiariosDeTitular === 'function') {
                renderBeneficiariosDeTitular(titularFromResults);
            }
            
            // Cerrar modal de creación
            if (typeof hideCreateBeneficiarioModal === 'function') {
                hideCreateBeneficiarioModal();
            }
            
            // Mostrar modal de éxito
            if (typeof showSuccessCreateBeneficiarioModal === 'function') {
                showSuccessCreateBeneficiarioModal();
            }
            
            console.log('✅ Beneficiario creado y asociado al titular:', titularFromResults);
        } else {
            console.log('🔍 Creando beneficiario independiente (sin titular asociado)');
            
            // Guardar por ciudad y persistir
            const city = getSelectedCityCode();
            if (!city) { 
                if (typeof showNotification === 'function') {
                    showNotification('Seleccione una ciudad primero', 'warning');
                }
                return; 
            }
            
            // Guardar beneficiario en beneficiariosByCity
            if (!beneficiariosByCity[city]) beneficiariosByCity[city] = {};
            const beneficiarioToSave = { ...beneficiarioData, ciudad: city };
            beneficiariosByCity[city][beneficiarioData.numeroId] = beneficiarioToSave;
            if (typeof persistBeneficiariosByCity === 'function') {
                persistBeneficiariosByCity();
            }
            
            // Persistir beneficiario en memoria
            beneficiariosData[beneficiarioData.numeroId] = beneficiarioToSave;
            
            // Si no viene del modal de titular ni de resultados, actualizar/insertar beneficiario
            if (typeof updateBeneficiarioInTable === 'function') {
                console.log('🔍 Llamando updateBeneficiarioInTable...');
                updateBeneficiarioInTable(beneficiarioData, beneficiarioData.numeroId);
            } else {
                console.error('❌ updateBeneficiarioInTable no está disponible');
            }
            
            // Persistir en localStorage (backup)
            try { localStorage.setItem('beneficiariosData', JSON.stringify(beneficiariosData)); } catch (e) {}
            
            // Cerrar modal de creación
            if (typeof hideCreateBeneficiarioModal === 'function') {
                hideCreateBeneficiarioModal();
            }
            
            // Mostrar modal de éxito
            if (typeof showSuccessCreateBeneficiarioModal === 'function') {
                showSuccessCreateBeneficiarioModal();
            }
        }
    }
    
    // Limpiar datos temporales
    window.tempBeneficiarioData = null;
}

// ========================================
// PERFIL DE USUARIO Y DROPDOWN
// ========================================

// Inicializar dropdown del usuario cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const userInfo = document.querySelector('.user-info');
    const dropdown = document.getElementById('userDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const sidebar = document.querySelector('.sidebar');

    if (userInfo && dropdown) {
        // Toggle del dropdown al hacer clic en el perfil
        userInfo.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            dropdownArrow.classList.toggle('open');
            sidebar.classList.toggle('dropdown-open');
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!userInfo.contains(e.target)) {
                dropdown.classList.remove('show');
                dropdownArrow.classList.remove('open');
                sidebar.classList.remove('dropdown-open');
            }
        });
        
        // Manejar clics en elementos del dropdown
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                if (this.classList.contains('logout-item')) {
                    // Mostrar modal de confirmación
                    showConfirmLogoutModal();
                } else if (this.classList.contains('admin-users-item')) {
                    // Lógica de administrar usuarios
                    alert('Funcionalidad de administrar usuarios en desarrollo');
                }
                // Cerrar dropdown después del clic
                dropdown.classList.remove('show');
                dropdownArrow.classList.remove('open');
                sidebar.classList.remove('dropdown-open');
            });
        });
    }
});

// ========================================
// FUNCIONES DE MODAL DE CERRAR SESIÓN
// ========================================

window.showConfirmLogoutModal = function() {
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

window.cancelLogout = function() {
    const modal = document.getElementById('confirmLogoutModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

window.confirmLogout = function() {
    // Limpiar datos de sesión
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Redirigir al index
    window.location.href = window.AppRoutes.resolve('LOGIN');
}

// [BACKEND] Punto de integración general (Titulares):
// Sustituir el uso de localStorage por llamadas al backend para
// listar/crear/actualizar/eliminar titulares.
// Cargar datos persistidos desde localStorage (si existen)
try {
    const storedTitulares = localStorage.getItem('titularesData');
    if (storedTitulares) {
        const parsed = JSON.parse(storedTitulares);
        if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach(k => { titularesData[k] = parsed[k]; });
            console.log('✅ Titulares cargados desde localStorage:', Object.keys(titularesData).length);
        }
    }
} catch (e) { console.error('Error cargando titulares:', e); }

try {
    const storedBeneficiarios = localStorage.getItem('beneficiariosData');
    if (storedBeneficiarios) {
        const parsed = JSON.parse(storedBeneficiarios);
        if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach(k => { beneficiariosData[k] = parsed[k]; });
            console.log('✅ Beneficiarios cargados desde localStorage:', Object.keys(beneficiariosData).length);
        }
    }
} catch (e) { console.error('Error cargando beneficiarios:', e); }

try {
    const storedTitularBeneficiarios = localStorage.getItem('titularIdToBeneficiarios');
    if (storedTitularBeneficiarios) {
        const parsed = JSON.parse(storedTitularBeneficiarios);
        if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach(k => { titularIdToBeneficiarios[k] = parsed[k]; });
            console.log('✅ Relaciones titular-beneficiario cargadas desde localStorage:', Object.keys(titularIdToBeneficiarios).length);
        }
    }
} catch (e) { console.error('Error cargando relaciones:', e); }

// Dashboard JavaScript
// Función para limpiar todas las notificaciones
function clearAllNotifications() {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => {
        notif.classList.remove('show');
        notif.remove();
    });
}

// Limpiar notificaciones inmediatamente
clearAllNotifications();

document.addEventListener('DOMContentLoaded', function() {
    // Limpiar notificaciones existentes
    clearAllNotifications();
    
    // Cargar titulares de la ciudad seleccionada si existe
    loadTitularesForSelectedCity();
    
    // Event listener para el botón de actualizar titular
    const bActualizarTitular = document.getElementById('bActualizarTitular');
    if (bActualizarTitular) {
        bActualizarTitular.addEventListener('click', function() {
            const buttonText = bActualizarTitular.textContent;
            
            if (buttonText === 'Siguiente') {
                // Obtener el ID del titular
                const numeroId = document.getElementById('uId').value.trim();
                if (numeroId) {
                    // Obtener los beneficiarios del titular
                    const lista = titularIdToBeneficiarios[numeroId] || [];
                    
                    // Si tiene exactamente un beneficiario, abrir directamente el formulario de edición
                    if (lista.length === 1) {
                        const beneficiario = lista[0];
                        // Cerrar modal de titular primero
                        hideUpdateTitularModal();
                        // Esperar un momento para que el modal se cierre antes de abrir el de beneficiario
                        setTimeout(() => {
                            // Editar el beneficiario directamente usando el modal de actualizar
                            if (typeof editBeneficiarioFromUpdate === 'function') {
                                editBeneficiarioFromUpdate(beneficiario.numeroId);
                            }
                        }, 100);
                    } else {
                        // Si tiene varios o ninguno, mostrar el modal de resultados
                        alert('Este titular tiene ' + lista.length + ' beneficiarios. Por favor, seleccione uno desde la tabla.');
                    }
                }
            } else {
                // Es una actualización normal del titular
                // Obtener los datos del formulario
                const tipoId = document.getElementById('uTipo_Id').value.trim();
                const numeroId = document.getElementById('uId').value.trim();
                const apellido1 = document.getElementById('uApellido1').value.trim();
                const apellido2 = document.getElementById('uApellido2').value.trim();
                const nombre1 = document.getElementById('uNombre1').value.trim();
                const nombre2 = document.getElementById('uNombre2').value.trim();
                const direccion = document.getElementById('uDireccion').value.trim();
                const barrio = document.getElementById('uBarrioT').value.trim();
                const celular = document.getElementById('uCelular').value.trim();
                const correo = document.getElementById('uCorreo').value.trim();
                const fechaIngreso = document.getElementById('uFecha_Ingreso').value.trim();
                const activo = document.getElementById('uActivo').value.trim() || 'SI';
                const beneficiario = document.getElementById('uBeneficiario').value.trim() || 'NO';
                
                // Validaciones básicas
                if (!tipoId || !numeroId || !apellido1 || !nombre1 || !direccion || !barrio || !celular || !correo || !fechaIngreso) {
                    alert('Por favor, complete todos los campos obligatorios');
                    return;
                }
                
                const titularActualizado = {
                    tipoId: tipoId.toUpperCase(),
                    numeroId,
                    apellido1: apellido1.toUpperCase(),
                    apellido2: apellido2 ? apellido2.toUpperCase() : '',
                    nombre1: nombre1.toUpperCase(),
                    nombre2: nombre2 ? nombre2.toUpperCase() : '',
                    direccion: direccion.toUpperCase(),
                    barrio: barrio.toUpperCase(),
                    celular,
                    correo: correo.toUpperCase(),
                    fechaIngreso,
                    activo: activo.toUpperCase(),
                    beneficiario: beneficiario.toUpperCase()
                };
                
                // Guardar datos temporales y mostrar modal de confirmación
                window.tempTitularData = titularActualizado;
                window.tempTitularOriginalId = document.getElementById('uId').getAttribute('data-original-id');
                
                // Mostrar modal de confirmación
                if (typeof showConfirmUpdateTitularModal === 'function') {
                    showConfirmUpdateTitularModal();
                }
            }
        });
    }
    
    // Event listener para el botón de actualizar beneficiario
    const bActualizarBeneficiario = document.getElementById('bActualizarBeneficiario');
    if (bActualizarBeneficiario) {
        bActualizarBeneficiario.addEventListener('click', function() {
            // Obtener los datos del formulario
            const tipoId = document.getElementById('ubTipoId').value.trim();
            const numeroId = document.getElementById('ubNumeroId').value.trim();
            const apellido1 = document.getElementById('updateBeneficiarioApellido1').value.trim();
            const apellido2 = document.getElementById('updateBeneficiarioApellido2').value.trim();
            const nombre1 = document.getElementById('updateBeneficiarioNombre1').value.trim();
            const nombre2 = document.getElementById('updateBeneficiarioNombre2').value.trim();
            const direccion = document.getElementById('ubDireccion').value.trim();
            const telefono = document.getElementById('ubTelefono').value.trim();
            const email = document.getElementById('ubEmail').value.trim();
            const activo = document.getElementById('ubActivo').value.trim() || 'SI';
            
            // Validaciones básicas
            if (!tipoId || !numeroId || !apellido1 || !nombre1 || !direccion || !telefono || !email) {
                alert('Por favor, complete todos los campos obligatorios');
                return;
            }
            
            const beneficiarioActualizado = {
                tipoId: tipoId.toUpperCase(),
                numeroId,
                apellido1: apellido1.toUpperCase(),
                apellido2: apellido2 ? apellido2.toUpperCase() : '',
                nombre1: nombre1.toUpperCase(),
                nombre2: nombre2 ? nombre2.toUpperCase() : '',
                direccion: direccion.toUpperCase(),
                telefono,
                email: email.toUpperCase(),
                activo: activo.toUpperCase()
            };
            
            // Obtener el ID original y el titularId
            const originalId = document.getElementById('ubNumeroId').getAttribute('data-original-id');
            const titularId = document.getElementById('uId')?.value || document.getElementById('uId')?.getAttribute('data-original-id');
            
            if (titularId) {
                beneficiarioActualizado.titularId = titularId;
            }
            
            // Guardar datos temporales y mostrar modal de confirmación
            window.tempBeneficiarioData = beneficiarioActualizado;
            window.tempBeneficiarioOriginalId = originalId;
            window.tempBeneficiarioTitularId = titularId;
            
            // Mostrar modal de confirmación
            if (typeof showConfirmUpdateBeneficiarioModal === 'function') {
                showConfirmUpdateBeneficiarioModal();
            }
        });
    }
    // Mostrar SIEMPRE el modal de seleccionar ciudad al entrar (igual que consecutivos)
    try { setTimeout(() => showCityModal(), 300); } catch (e) {}
    
    // ========================================
    // FUNCIONES DE UTILIDAD PARA BACKEND
    // ========================================
    
    /**
     * Obtiene el token de autenticación del sessionStorage
     * @returns {string|null} Token de autenticación o null si no existe
     */
    function getAuthToken() {
        return sessionStorage.getItem('authToken');
    }
    
    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean} true si está autenticado, false si no
     */
    function isAuthenticated() {
        return sessionStorage.getItem('isAuthenticated') === 'true' && getAuthToken() !== null;
    }
    
    // ========================================
    // GESTIÓN DE MODALES
    // ========================================
    
         // Referencias a los elementos de modales
     const modal = document.getElementById('cityModal');
     const modalOverlay = document.querySelector('.modal-overlay');
     const createTitularModal = document.getElementById('createTitularModal');
     const createTitularModalOverlay = document.querySelector('#createTitularModal.modal-overlay');
     
     // Verificar si los elementos existen antes de continuar
     if (!createTitularModal) {
         console.log('⚠️ Modal createTitularModal no encontrado - posiblemente no estamos en la página correcta');
         return;
     }
     const createBeneficiarioModal = document.getElementById('createBeneficiarioModal');
     const createBeneficiarioModalOverlay = document.querySelector('#createBeneficiarioModal.modal-overlay');
     const searchTitularModal = document.getElementById('searchTitularModal');
     const searchTitularModalOverlay = document.querySelector('#searchTitularModal.modal-overlay');
     const searchBeneficiarioModal = document.getElementById('searchBeneficiarioModal');
     const searchBeneficiarioModalOverlay = document.querySelector('#searchBeneficiarioModal.modal-overlay');
    
    /**
     * Muestra el modal de selección de ciudad
     * Solo se muestra si el usuario no ha seleccionado una ciudad en esta sesión
     */
    function showModal() {
        // Verificar si el usuario ya seleccionó una ciudad en esta sesión
        const selectedCity = sessionStorage.getItem('selectedCity');
        if (!selectedCity) {
            modalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Fuerza la visualización del modal de selección de ciudad
     * Se usa para permitir cambiar la ciudad seleccionada
     */
    function forceShowModal() {
        modalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Oculta el modal de selección de ciudad
     * Restaura el scroll del body
     */
    function hideModal() {
        modalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Las funciones de modales ahora están definidas globalmente fuera del scope
    
    
         // Las funciones de modales ahora están definidas globalmente fuera del scope
    
    
    // Las funciones de modales ahora están definidas globalmente fuera del scope
    
    // Las funciones de modales ahora están definidas globalmente fuera del scope
     

    
    // ========================================
    // FUNCIONES GLOBALES
    // ========================================
    
         // Hacer funciones disponibles globalmente para uso en HTML
     window.hideModal = hideModal;
     window.hideCreateTitularModal = hideCreateTitularModal;
     window.hideCreateBeneficiarioModal = hideCreateBeneficiarioModal;
     window.hideSearchTitularModal = hideSearchTitularModal;
     window.hideSearchBeneficiarioModal = hideSearchBeneficiarioModal;
     window.showModal = showModal;
     window.forceShowModal = forceShowModal;
    
    // ========================================
    // FUNCIONES DE CONFIRMACIÓN PARA TITULARES
    // ========================================
    
    /**
     * Procesa la actualización de un titular
     */
    function processTitularUpdate(nuevoTitular) {
        const numeroId = nuevoTitular.numeroId;
        
        // Verificar si el ID cambió
        const originalId = document.getElementById('tId').getAttribute('data-original-id');
        if (originalId && originalId !== numeroId) {
            // El ID cambió - eliminar el titular anterior
            deleteTitularFromData(originalId);
        }
        
        // Guardar por ciudad y persistir
        const city = getSelectedCityCode();
        if (!city) { showNotification('Seleccione una ciudad primero', 'warning'); return; }
        if (!titularesByCity[city]) titularesByCity[city] = {};
        const toSave = { ...nuevoTitular, ciudad: city };
        titularesByCity[city][numeroId] = toSave;
        persistTitularesByCity();
        // También reflejar en memoria y UI actual
        titularesData[numeroId] = toSave;
        
        // Persistir en localStorage
        try { localStorage.setItem('titularesData', JSON.stringify(titularesData)); } catch (e) {}
        
        // Actualizar tabla principal
        addTitularToTable(nuevoTitular, true);
        
        // Actualizar tabla de resultados si está abierta - SIGUIENDO EL PATRÓN DE CIUDADES
        const titularModal = document.getElementById('titularResultsModal');
        if (titularModal && titularModal.classList.contains('show')) {
            const currentTitularId = sessionStorage.getItem('currentSearchedTitularId');
            if (currentTitularId === numeroId || currentTitularId === originalId) {
                // Re-renderizar la tabla de resultados con los datos actualizados
                renderTitularSearchResults(nuevoTitular);
                // Re-renderizar los beneficiarios asociados
                renderBeneficiariosDeTitular(numeroId);
            }
        }
        
        // Limpiar el atributo de ID original
        document.getElementById('tId').removeAttribute('data-original-id');
        
        // Resetear el título y texto del botón
        document.getElementById('createTitularTitle').textContent = 'CREAR TITULAR';
        document.getElementById('bCrear').textContent = 'Crear';
    }
    
    /**
     * Procesa la actualización del titular desde el modal de actualizar
     * @param {Object} nuevoTitular - Datos del titular actualizado
     * @param {string} originalId - ID original del titular
     */
    function processTitularUpdateFromModal(nuevoTitular, originalId) {
        const numeroId = nuevoTitular.numeroId;
        
        // Verificar si el ID cambió
        if (originalId && originalId !== numeroId) {
            // El ID cambió - eliminar el titular anterior
            const city = getSelectedCityCode();
            if (city && titularesByCity[city]) {
                delete titularesByCity[city][originalId];
            }
            delete titularesData[originalId];
            
            // Eliminar la fila anterior de la tabla
            const tableBody = document.getElementById('titularesTableBody');
            const rows = tableBody.querySelectorAll('tr');
            for (let row of rows) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2 && cells[1].textContent === originalId) {
                    row.remove();
                    break;
                }
            }
        }
        
        // Guardar por ciudad y persistir
        const city = getSelectedCityCode();
        if (!city) { 
            if (typeof showNotification === 'function') {
                showNotification('Seleccione una ciudad primero', 'warning');
            }
            return; 
        }
        if (!titularesByCity[city]) titularesByCity[city] = {};
        const toSave = { ...nuevoTitular, ciudad: city };
        titularesByCity[city][numeroId] = toSave;
        persistTitularesByCity();
        // También reflejar en memoria y UI actual
        titularesData[numeroId] = toSave;
        
        // Persistir en localStorage
        try { localStorage.setItem('titularesData', JSON.stringify(titularesData)); } catch (e) {}
        
        // Actualizar tabla principal
        addTitularToTable(nuevoTitular, true);
        
        // Actualizar tabla de resultados si está abierta
        const titularModal = document.getElementById('titularResultsModal');
        if (titularModal && titularModal.classList.contains('show')) {
            const currentTitularId = sessionStorage.getItem('currentSearchedTitularId');
            if (currentTitularId === numeroId || currentTitularId === originalId) {
                // Re-renderizar la tabla de resultados con los datos actualizados
                if (typeof renderTitularSearchResults === 'function') {
                    renderTitularSearchResults(nuevoTitular);
                }
                // Re-renderizar los beneficiarios asociados
                if (typeof renderBeneficiariosDeTitular === 'function') {
                    renderBeneficiariosDeTitular(numeroId);
                }
            }
        }
    }
    
    /**
     * Procesa la actualización del beneficiario desde el modal de actualizar
     * @param {Object} beneficiarioData - Datos del beneficiario actualizado
     * @param {string} originalId - ID original del beneficiario
     * @param {string} titularId - ID del titular asociado
     */
    function processBeneficiarioUpdateFromModal(beneficiarioData, originalId, titularId) {
        console.log('🚀 INICIANDO actualización de beneficiario desde modal:', beneficiarioData);
        
        const numeroId = beneficiarioData.numeroId;
        
        // Guardar por ciudad y persistir
        const city = getSelectedCityCode();
        if (!city) { 
            if (typeof showNotification === 'function') {
                showNotification('Seleccione una ciudad primero', 'warning');
            }
            return; 
        }
        
        // Guardar beneficiario en beneficiariosByCity
        if (!beneficiariosByCity[city]) beneficiariosByCity[city] = {};
        
        // Si el ID cambió, eliminar el anterior
        if (originalId && originalId !== numeroId) {
            delete beneficiariosData[originalId];
            delete beneficiariosByCity[city][originalId];
            
            // Eliminar de la relación
            if (titularId && titularIdToBeneficiarios[titularId]) {
                const index = titularIdToBeneficiarios[titularId].findIndex(b => b.numeroId === originalId);
                if (index >= 0) {
                    titularIdToBeneficiarios[titularId].splice(index, 1);
                }
            }
        }
        
        const beneficiarioToSave = { ...beneficiarioData, ciudad: city };
        if (titularId) {
            beneficiarioToSave.titularId = titularId;
        }
        
        beneficiariosByCity[city][numeroId] = beneficiarioToSave;
        if (typeof persistBeneficiariosByCity === 'function') {
            persistBeneficiariosByCity();
        }
        
        // Actualizar en beneficiariosData (estructura principal)
        beneficiariosData[numeroId] = beneficiarioToSave;
        
        // Persistir en localStorage (backup)
        try { localStorage.setItem('beneficiariosData', JSON.stringify(beneficiariosData)); } catch (e) {}
        
        // Actualizar relación titular-beneficiario
        if (titularId) {
            if (!titularIdToBeneficiarios[titularId]) {
                titularIdToBeneficiarios[titularId] = [];
            }
            const index = titularIdToBeneficiarios[titularId].findIndex(b => b.numeroId === (originalId || numeroId));
            if (index >= 0) {
                titularIdToBeneficiarios[titularId][index] = beneficiarioToSave;
            } else {
                titularIdToBeneficiarios[titularId].push(beneficiarioToSave);
            }
        }
        
        // Actualizar en la tabla principal
        if (typeof updateBeneficiarioInTable === 'function') {
            updateBeneficiarioInTable(beneficiarioData, originalId);
        }
        
        // Actualizar tabla de resultados si está abierta
        const titularModal = document.getElementById('titularResultsModal');
        if (titularModal && titularModal.classList.contains('show')) {
            const currentTitularId = sessionStorage.getItem('currentSearchedTitularId');
            console.log('🔄 Actualizando tabla de resultados para titular:', currentTitularId);
            
            if (currentTitularId && (currentTitularId === titularId || currentTitularId === numeroId)) {
                // Re-renderizar los beneficiarios asociados
                if (typeof renderBeneficiariosDeTitular === 'function') {
                    renderBeneficiariosDeTitular(titularId || currentTitularId);
                }
            }
        }
    }
    
    
    /**
     * Muestra el modal de confirmación para crear titular
     */
    
    /**
     * Cancela la creación del titular
     */
    
    /**
     * Confirma la creación del titular
     */
    
    /**
     * Muestra el modal de éxito para crear titular
     */
    
    /**
     * Cierra el modal de éxito de titular
     */
    
    // Exponer funciones globalmente
    window.cancelCreateTitular = cancelCreateTitular;
    window.confirmCreateTitular = confirmCreateTitular;
    window.closeSuccessTitularModal = closeSuccessTitularModal;
    
    // ========================================
    // FUNCIONES DE BÚSQUEDA DE BENEFICIARIOS
    // ========================================
    
    
    /**
     * Busca el titular asociado a un beneficiario
     */
    function buscarTitularPorBeneficiario(beneficiarioId) {
        // Buscar en la relación titularIdToBeneficiarios
        for (const titularId in titularIdToBeneficiarios) {
            const beneficiarios = titularIdToBeneficiarios[titularId];
            const beneficiarioEncontrado = beneficiarios.find(b => b.numeroId === beneficiarioId);
            if (beneficiarioEncontrado) {
                // Encontrar el titular
                return buscarTitular(titularId);
            }
        }
        return null;
    }

    // ========================================
    // MODALES DE TOGGLE (crear si no existen)
    // ========================================
    (function ensureTitularToggleModals(){
        try {
            let confirm = document.getElementById('confirmToggleTitularModal');
            if (!confirm) {
                confirm = document.createElement('div');
                confirm.id = 'confirmToggleTitularModal';
                confirm.className = 'modal-overlay';
                confirm.style.zIndex = '9999';
                confirm.innerHTML = `
                    <div class="modal">
                        <div class="modal-header">
                            <h3 class="modal-title"></h3>
                            <button class="modal-close" onclick="cancelToggleTitular()"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body" style="text-align:center;">
                            <p class="modal-message" style="margin:0 auto;"></p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="cancelToggleTitular()">Cancelar</button>
                            <button class="btn btn-primary" onclick="confirmToggleTitular()">Confirmar</button>
                        </div>
                    </div>`;
                document.body.appendChild(confirm);
            }
            let success = document.getElementById('successToggleTitularModal');
            if (!success) {
                success = document.createElement('div');
                success.id = 'successToggleTitularModal';
                success.className = 'modal-overlay';
                success.style.zIndex = '9999';
                success.innerHTML = `
                    <div class="modal">
                        <div class="modal-header">
                            <h3 class="modal-title">ESTADO ACTUALIZADO</h3>
                            <button class="modal-close" onclick="closeSuccessToggleTitularModal()"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body" style="text-align:center;">
                            <p class="modal-message" style="margin:0 auto;"></p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" onclick="closeSuccessToggleTitularModal()">Aceptar</button>
                        </div>
                    </div>`;
                document.body.appendChild(success);
            }
        } catch (e) {}
    })();

    // ========================================
    // AJUSTE DE ENCABEZADOS (ESTADO / OPCIONES)
    // ========================================
    (function ensureTitularesHeaders(){
        try {
            const body = document.getElementById('titularesTableBody');
            if (body) {
                const table = body.closest('table');
                const thead = table ? table.querySelector('thead') : null;
                const headerRow = thead ? thead.querySelector('tr') : null;
                if (headerRow) {
                    const ths = Array.from(headerRow.querySelectorAll('th'));
                    const labels = ths.map(th => (th.textContent || '').trim().toUpperCase());
                    // Asegurar ESTADO y OPCIONES al final
                    if (ths.length >= 7) {
                        // Si la penúltima no es ESTADO, ajustarla o crearla
                        if (ths.length === 7) {
                            // Solo hay hasta CORREO → agregar ESTADO y OPCIONES
                            const thEstado = document.createElement('th');
                            thEstado.textContent = 'ESTADO';
                            headerRow.appendChild(thEstado);
                            const thOpc = document.createElement('th');
                            thOpc.textContent = 'OPCIONES';
                            headerRow.appendChild(thOpc);
                        } else if (ths.length === 8) {
                            // Si hay 8 columnas, normalizar la última a ESTADO y agregar OPCIONES
                            if (ths[7]) ths[7].textContent = 'ESTADO';
                            const thOpc = document.createElement('th');
                            thOpc.textContent = 'OPCIONES';
                            headerRow.appendChild(thOpc);
                        } else {
                            // 9 o más, normalizar
                            if (ths[7]) ths[7].textContent = 'ESTADO';
                            if (ths[8]) ths[8].textContent = 'OPCIONES';
                        }
                    }
                }
            }
        } catch (e) {}
        try {
            const body = document.getElementById('searchResultsTableBody');
            if (body) {
                const table = body.closest('table');
                const thead = table ? table.querySelector('thead') : null;
                const headerRow = thead ? thead.querySelector('tr') : null;
                if (headerRow) {
                    const ths = Array.from(headerRow.querySelectorAll('th'));
                    const labels = ths.map(th => (th.textContent || '').trim().toUpperCase());
                    // Queremos 7 columnas: ID, NOMBRE, ESTADO, DIRECCIÓN, CELULAR, CORREO, OPCIONES
                    if (ths.length < 7) {
                        // Completar faltantes
                        while (ths.length < 6) {
                            const th = document.createElement('th');
                            th.textContent = '';
                            headerRow.appendChild(th);
                            ths.push(th);
                        }
                        const thEstado = document.createElement('th');
                        thEstado.textContent = 'ESTADO';
                        headerRow.appendChild(thEstado);
                        const thOpc = document.createElement('th');
                        thOpc.textContent = 'OPCIONES';
                        headerRow.appendChild(thOpc);
                    } else {
                        if (ths[2]) ths[2].textContent = 'ESTADO';
                        if (ths[6]) ths[6].textContent = 'OPCIONES';
                        if (!labels.includes('OPCIONES')) {
                            const thOpc = document.createElement('th');
                            thOpc.textContent = 'OPCIONES';
                            headerRow.appendChild(thOpc);
                        }
                    }
                }
            }
        } catch (e) {}
    })();
    // ========================================
    // FUNCIONES DE CONFIRMACIÓN PARA BENEFICIARIOS
    // ========================================
    
    /**
     * Muestra el modal de confirmación para crear beneficiario
     */
    
    /**
     * Cancela la creación del beneficiario
     */
    
    /**
     * Confirma la creación del beneficiario
     */
    
    /**
     * Muestra el modal de éxito para crear beneficiario
     */
    function showSuccessCreateBeneficiarioModal() {
        const modal = document.getElementById('successCreateBeneficiarioModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cierra el modal de éxito de beneficiario
     */
    function closeSuccessBeneficiarioModal() {
        const modal = document.getElementById('successCreateBeneficiarioModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        // Refrescar tablas de resultados después de cerrar el modal de éxito
        setTimeout(() => {
            console.log('🔄 Refrescando tablas después de cerrar modal de éxito de crear beneficiario');
            window.forceRefreshAllResultsTables();
        }, 200);
    }
    
    /**
     * Muestra el modal de éxito para crear titular y beneficiario
     */
    function showSuccessCreateTitularBeneficiarioModal() {
        console.log('🔍 Mostrando modal de éxito para titular y beneficiario...');
        const modal = document.getElementById('successCreateTitularBeneficiarioModal');
        if (modal) {
            console.log('✅ Modal encontrado, mostrando...');
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            console.error('❌ No se encontró el modal successCreateTitularBeneficiarioModal');
        }
    }
    
    /**
     * Cierra el modal de éxito de titular y beneficiario
     */
    function closeSuccessTitularBeneficiarioModal() {
        const modal = document.getElementById('successCreateTitularBeneficiarioModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }
    
    /**
     * Muestra el modal de confirmación para crear titular y beneficiario
     */
    function showConfirmCreateTitularBeneficiarioModal() {
        console.log('🔍 Mostrando modal de confirmación para titular y beneficiario...');
        const modal = document.getElementById('confirmCreateTitularBeneficiarioModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal de confirmación para titular y beneficiario mostrado');
        } else {
            console.error('❌ No se encontró el modal confirmCreateTitularBeneficiarioModal');
        }
    }
    
    /**
     * Cancela la creación de titular y beneficiario
     */
    function cancelCreateTitularBeneficiario() {
        const confirmModal = document.getElementById('confirmCreateTitularBeneficiarioModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Limpiar datos temporales
        window.tempBeneficiarioData = null;
    }
    
    /**
     * Confirma la creación del titular y beneficiario
     */
    function confirmCreateTitularBeneficiario() {
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmCreateTitularBeneficiarioModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Obtener datos temporales
        const beneficiarioData = window.tempBeneficiarioData;
        
        if (!beneficiarioData) {
            console.error('No se encontraron datos del beneficiario para crear');
            return;
        }
        
        console.log('Datos del beneficiario a crear:', beneficiarioData);
        
        // ========================================
        // 🔗 CONEXIÓN BACKEND - CREAR BENEFICIARIO
        // ========================================
        // Endpoint: POST /api/beneficiarios
        // Datos: { numeroId, tipoId, apellido1, apellido2, nombre1, nombre2, direccion, barrio, celular, correo, fechaIngreso, activo, titularId, parentesco }
        
        // Verificar si viene del modal de titular
        const tempTitular = sessionStorage.getItem('tempTitular');
        
        if (tempTitular) {
            console.log('🔍 Creando titular y beneficiario juntos...');
            // Si viene del modal de titular, crear tanto titular como beneficiario
            const titular = JSON.parse(tempTitular);
            
            // Guardar por ciudad y persistir
            const city = getSelectedCityCode();
            if (!city) { 
                if (typeof showNotification === 'function') {
                    showNotification('Seleccione una ciudad primero', 'warning');
                }
                return; 
            }
            
            // Guardar titular en titularesByCity
            if (!titularesByCity[city]) titularesByCity[city] = {};
            const toSave = { ...titular, ciudad: city };
            titularesByCity[city][titular.numeroId] = toSave;
            if (typeof persistTitularesByCity === 'function') {
                persistTitularesByCity();
            }
            
            // También reflejar en memoria y UI actual
            titularesData[titular.numeroId] = toSave;
            
            // Persistir en localStorage (backup)
            try { localStorage.setItem('titularesData', JSON.stringify(titularesData)); } catch (e) {}
            
            addTitularToTable(titular, true);
            
            // Guardar beneficiario en beneficiariosByCity
            if (!beneficiariosByCity[city]) beneficiariosByCity[city] = {};
            const beneficiarioToSave = { ...beneficiarioData, ciudad: city, titularId: titular.numeroId };
            beneficiariosByCity[city][beneficiarioData.numeroId] = beneficiarioToSave;
            if (typeof persistBeneficiariosByCity === 'function') {
                persistBeneficiariosByCity();
            }
            
            // Persistir beneficiario en memoria
            beneficiariosData[beneficiarioData.numeroId] = beneficiarioToSave;
            
            // Persistir beneficiario y asociarlo al titular (actualiza/insert)
            updateBeneficiarioInTable(beneficiarioData, beneficiarioData.numeroId);
            if (!titularIdToBeneficiarios[titular.numeroId]) {
                titularIdToBeneficiarios[titular.numeroId] = [];
            }
            titularIdToBeneficiarios[titular.numeroId].push(beneficiarioData);
            
            // Persistir relaciones en localStorage
            try { localStorage.setItem('titularIdToBeneficiarios', JSON.stringify(titularIdToBeneficiarios)); } catch (e) {}
            try { localStorage.setItem('beneficiariosData', JSON.stringify(beneficiariosData)); } catch (e) {}
            
            // Limpiar datos temporales
            sessionStorage.removeItem('tempTitular');
            
            // Cerrar modal de creación
            hideCreateBeneficiarioModal();
            
            // Mostrar modal de éxito específico para titular y beneficiario
            showSuccessCreateTitularBeneficiarioModal();
        }
        
        // Limpiar datos temporales
        window.tempBeneficiarioData = null;
    }
    
    // ========================================
    // FUNCIONES DE CONFIRMACIÓN PARA ACTUALIZAR TITULARES
    // ========================================
    
    /**
     * Muestra el modal de confirmación para actualizar titular
     */
    function showConfirmUpdateTitularModal() {
        const modal = document.getElementById('confirmUpdateTitularModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cancela la actualización del titular
     */
    function cancelUpdateTitular() {
        const confirmModal = document.getElementById('confirmUpdateTitularModal');
        if (confirmModal) {
            confirmModal.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        // Limpiar datos temporales
        window.tempTitularData = null;
        window.tempTitularOriginalId = null;
    }
    
    /**
     * Confirma la actualización del titular
     */
    function confirmUpdateTitular() {
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmUpdateTitularModal');
        if (confirmModal) {
            confirmModal.style.display = 'none';
        }
        
        // Obtener datos temporales
        const titularData = window.tempTitularData;
        const originalId = window.tempTitularOriginalId;
        
        if (!titularData) {
            console.error('No se encontraron datos del titular para actualizar');
            return;
        }
        
        console.log('Datos del titular a actualizar:', titularData);
        
        // ========================================
        // 🔗 CONEXIÓN BACKEND - ACTUALIZAR TITULAR
        // ========================================
        // Endpoint: PUT /api/titulares/{numeroId}
        // Datos: { tipoId, apellido1, apellido2, nombre1, nombre2, direccion, barrio, celular, correo, fechaIngreso, activo, beneficiario }
        
        // Procesar la actualización
        processTitularUpdateFromModal(titularData, originalId);
        
        // Mostrar modal de éxito
        showSuccessUpdateTitularModal();
        
        // Cerrar modal de actualizar después de un pequeño delay
        setTimeout(() => {
            hideUpdateTitularModal();
        }, 100);
        
        // Limpiar datos temporales
        window.tempTitularData = null;
        window.tempTitularOriginalId = null;
    }
    
    /**
     * Muestra el modal de éxito para actualizar titular
     */
    function showSuccessUpdateTitularModal() {
        const modal = document.getElementById('successUpdateTitularModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cierra el modal de éxito de actualizar titular
     */
    function closeSuccessUpdateTitularModal() {
        const modal = document.getElementById('successUpdateTitularModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        // Refrescar tablas de resultados después de cerrar el modal de éxito
        setTimeout(() => {
            console.log('🔄 Refrescando tablas después de cerrar modal de éxito de titular');
            window.forceRefreshAllResultsTables();
        }, 200);
    }
    
    // ========================================
    // FUNCIONES DE CONFIRMACIÓN PARA ACTUALIZAR BENEFICIARIOS
    // ========================================
    
    /**
     * Muestra el modal de confirmación para actualizar beneficiario
     */
    function showConfirmUpdateBeneficiarioModal() {
        console.log('🔍 Intentando mostrar modal de confirmación de actualización');
        const modal = document.getElementById('confirmUpdateBeneficiarioModal');
        if (modal) {
            console.log('✅ Modal de actualización encontrado, mostrando...');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else {
            console.error('❌ No se encontró el modal confirmUpdateBeneficiarioModal');
        }
    }
    
    /**
     * Cancela la actualización del beneficiario
     */
    function cancelUpdateBeneficiario() {
        const confirmModal = document.getElementById('confirmUpdateBeneficiarioModal');
        if (confirmModal) {
            confirmModal.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        // Limpiar datos temporales
        window.tempBeneficiarioData = null;
        window.tempBeneficiarioOriginalId = null;
        window.tempBeneficiarioTitularId = null;
    }
    
    /**
     * Confirma la actualización del beneficiario
     */
    function confirmUpdateBeneficiario() {
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmUpdateBeneficiarioModal');
        if (confirmModal) {
            confirmModal.style.display = 'none';
        }
        
        // Obtener datos temporales
        const beneficiarioData = window.tempBeneficiarioData;
        const originalId = window.tempBeneficiarioOriginalId;
        const titularId = window.tempBeneficiarioTitularId;
        
        if (!beneficiarioData) {
            console.error('No se encontraron datos del beneficiario para actualizar');
            return;
        }
        
        console.log('Datos del beneficiario a actualizar:', beneficiarioData);
        
        // ========================================
        // 🔗 CONEXIÓN BACKEND - ACTUALIZAR BENEFICIARIO
        // ========================================
        // Endpoint: PUT /api/beneficiarios/{id}
        // Datos: { numeroId, tipoId, apellido1, apellido2, nombre1, nombre2, direccion, barrio, celular, correo, fechaIngreso, activo, titularId, parentesco }
        
        // Procesar la actualización del beneficiario
        processBeneficiarioUpdateFromModal(beneficiarioData, originalId, titularId);
        
        // Mostrar modal de éxito
        showSuccessUpdateBeneficiarioModal();
        
        // Cerrar modal de actualizar después de un pequeño delay
        setTimeout(() => {
            hideUpdateBeneficiarioModal();
        }, 100);
        
        // Limpiar datos temporales
        window.tempBeneficiarioData = null;
        window.tempBeneficiarioOriginalId = null;
        window.tempBeneficiarioTitularId = null;
    }
    
    /**
     * Muestra el modal de éxito para actualizar beneficiario
     */
    function showSuccessUpdateBeneficiarioModal() {
        const modal = document.getElementById('successUpdateBeneficiarioModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Cierra el modal de éxito de actualizar beneficiario
     */
    function closeSuccessUpdateBeneficiarioModal() {
        const modal = document.getElementById('successUpdateBeneficiarioModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        // Refrescar tablas de resultados después de cerrar el modal de éxito
        setTimeout(() => {
            console.log('🔄 Refrescando tablas después de cerrar modal de éxito de beneficiario');
            window.forceRefreshAllResultsTables();
        }, 200);
    }
    
    /**
     * Procesa la actualización de un beneficiario
     */
    function processBeneficiarioUpdate(beneficiarioData) {
        console.log('🚀 INICIANDO actualización de beneficiario:', beneficiarioData);
        
        const numeroId = beneficiarioData.numeroId;
        const originalId = document.getElementById('bNumeroId').getAttribute('data-original-id');
        
        // Guardar por ciudad y persistir
        const city = getSelectedCityCode();
        if (!city) { 
            if (typeof showNotification === 'function') {
                showNotification('Seleccione una ciudad primero', 'warning');
            }
            return; 
        }
        
        // Guardar beneficiario en beneficiariosByCity
        if (!beneficiariosByCity[city]) beneficiariosByCity[city] = {};
        
        // Si el ID cambió, eliminar el anterior
        if (originalId && originalId !== numeroId) {
            delete beneficiariosData[originalId];
            delete beneficiariosByCity[city][originalId];
        }
        
        const beneficiarioToSave = { ...beneficiarioData, ciudad: city };
        beneficiariosByCity[city][numeroId] = beneficiarioToSave;
        if (typeof persistBeneficiariosByCity === 'function') {
            persistBeneficiariosByCity();
        }
        
        // Actualizar en beneficiariosData (estructura principal)
        beneficiariosData[numeroId] = beneficiarioToSave;
        
        // Persistir en localStorage (backup)
        try { localStorage.setItem('beneficiariosData', JSON.stringify(beneficiariosData)); } catch (e) {}
        
        // Actualizar en la tabla principal
        updateBeneficiarioInTable(beneficiarioData, originalId);
        
        // Actualizar tabla de resultados si está abierta - SIGUIENDO EL PATRÓN DE CIUDADES
        const titularModal = document.getElementById('titularResultsModal');
        if (titularModal && titularModal.classList.contains('show')) {
            const currentTitularId = sessionStorage.getItem('currentSearchedTitularId');
            console.log('🔄 Actualizando tabla de resultados para titular:', currentTitularId);
            
            if (currentTitularId) {
                // Asegurar que existe la relación
                if (!titularIdToBeneficiarios[currentTitularId]) {
                    titularIdToBeneficiarios[currentTitularId] = [];
                }
                
                // Actualizar en la relación titular-beneficiarios
                if (originalId && originalId !== numeroId) {
                    const index = titularIdToBeneficiarios[currentTitularId].findIndex(b => b.numeroId === originalId);
                    if (index > -1) {
                        console.log('🗑️ Eliminando beneficiario con ID original:', originalId);
                        titularIdToBeneficiarios[currentTitularId].splice(index, 1);
                    }
                }
                
                const existingIndex = titularIdToBeneficiarios[currentTitularId].findIndex(b => b.numeroId === (originalId || numeroId));
                if (existingIndex > -1) {
                    console.log('✏️ Actualizando beneficiario existente en índice:', existingIndex);
                    titularIdToBeneficiarios[currentTitularId][existingIndex] = beneficiarioData;
                } else {
                    console.log('➕ Agregando nuevo beneficiario a la lista');
                    titularIdToBeneficiarios[currentTitularId].push(beneficiarioData);
                }
                
                // Persistir relaciones en localStorage
                try { localStorage.setItem('titularIdToBeneficiarios', JSON.stringify(titularIdToBeneficiarios)); } catch (e) {}
                
                console.log('📊 Lista actualizada de beneficiarios:', titularIdToBeneficiarios[currentTitularId]);
                
                // Re-renderizar la tabla de beneficiarios (actualiza la fila en resultados)
                renderBeneficiariosDeTitular(currentTitularId);
            }
        }

        // Si existe una tabla de resultados de búsqueda individual, refrescarla también
        try { refreshBeneficiarioResultsTable(); } catch (e) {}
    }
    
    
    
    
    // Exponer funciones globalmente
    window.cancelCreateBeneficiario = cancelCreateBeneficiario;
    window.confirmCreateBeneficiario = confirmCreateBeneficiario;
    window.closeSuccessBeneficiarioModal = closeSuccessBeneficiarioModal;
    window.showSuccessCreateTitularBeneficiarioModal = showSuccessCreateTitularBeneficiarioModal;
    window.closeSuccessTitularBeneficiarioModal = closeSuccessTitularBeneficiarioModal;
    window.showConfirmCreateTitularBeneficiarioModal = showConfirmCreateTitularBeneficiarioModal;
    window.cancelCreateTitularBeneficiario = cancelCreateTitularBeneficiario;
    window.confirmCreateTitularBeneficiario = confirmCreateTitularBeneficiario;
    window.showConfirmUpdateTitularModal = showConfirmUpdateTitularModal;
    window.cancelUpdateTitular = cancelUpdateTitular;
    window.confirmUpdateTitular = confirmUpdateTitular;
    window.showSuccessUpdateTitularModal = showSuccessUpdateTitularModal;
    window.closeSuccessUpdateTitularModal = closeSuccessUpdateTitularModal;
    window.showConfirmUpdateBeneficiarioModal = showConfirmUpdateBeneficiarioModal;
    window.cancelUpdateBeneficiario = cancelUpdateBeneficiario;
    window.confirmUpdateBeneficiario = confirmUpdateBeneficiario;
    window.showSuccessUpdateBeneficiarioModal = showSuccessUpdateBeneficiarioModal;
    window.closeSuccessUpdateBeneficiarioModal = closeSuccessUpdateBeneficiarioModal;
    
    /**
     * Función para volver al formulario de titular desde el formulario de beneficiario
     * Preserva los datos del titular que se estaban ingresando
     */
    function goBackToTitularForm() {
        // Cerrar modal de beneficiario
        hideCreateBeneficiarioModal();
        
        // Abrir modal de titular
        showCreateTitularModal();
        
        // Restaurar los datos del titular desde sessionStorage
        const tempTitularData = sessionStorage.getItem('tempTitular');
        if (tempTitularData) {
            try {
                const titularData = JSON.parse(tempTitularData);
                console.log('Restaurando datos del titular desde sessionStorage:', titularData);
                
                // Llenar todos los campos del formulario de titular
                document.getElementById('cTipo_Id').value = titularData.tipoId || '';
                document.getElementById('tId').value = titularData.numeroId || '';
                document.getElementById('tApellido1').value = titularData.apellido1 || '';
                document.getElementById('tApellido2').value = titularData.apellido2 || '';
                document.getElementById('tNombre1').value = titularData.nombre1 || '';
                document.getElementById('tNombre2').value = titularData.nombre2 || '';
                document.getElementById('tDireccion').value = titularData.direccion || '';
                document.getElementById('tBarrioT').value = titularData.barrio || '';
                document.getElementById('tCelular').value = titularData.celular || '';
                document.getElementById('tCorreo').value = titularData.correo || '';
                document.getElementById('tFecha_Ingreso').value = titularData.fechaIngreso || '';
                document.getElementById('cActivo').value = titularData.activo || '';
                document.getElementById('cBeneficiario').value = titularData.beneficiario || '';
                
                console.log('Datos del titular restaurados en el formulario');
            } catch (error) {
                console.error('Error al parsear los datos del titular:', error);
            }
        } else {
            console.log('No se encontraron datos del titular en sessionStorage');
        }
    }
    
    window.goBackToTitularForm = goBackToTitularForm;
    
    // ========================================
    // EVENTOS DE MODALES
    // ========================================
    // Los modales solo se cierran con la X o botones del formulario (no al clic fuera del overlay).
     
     // Cerrar modales con la tecla Escape
     document.addEventListener('keydown', function(e) {
         if (e.key === 'Escape') {
             if (modalOverlay.style.display === 'flex') {
                 hideModal();
             }
             if (createTitularModalOverlay.style.display === 'flex') {
                 hideCreateTitularModal();
             }
             if (createBeneficiarioModalOverlay.style.display === 'flex') {
                 hideCreateBeneficiarioModal();
             }
             const confirmLogoutModal = document.getElementById('confirmLogoutModal');
             if (confirmLogoutModal && confirmLogoutModal.style.display === 'flex') {
                 cancelLogout();
             }
             if (searchTitularModalOverlay.style.display === 'flex') {
                 hideSearchTitularModal();
             }
             if (searchBeneficiarioModalOverlay.style.display === 'flex') {
                 hideSearchBeneficiarioModal();
             }
         }
     });
    
    // Navegación lateral y superior: enlaces con data-app-route (admin-layout.js + AppRoutes).

    // ========================================
    // PERFIL DE USUARIO Y DROPDOWN
    // ========================================
    
    
    // ========================================
    // MANEJADORES DE BOTONES
    // ========================================
    
    // Manejadores de clics para botones
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const buttonText = this.textContent.trim();
            
                         switch(buttonText) {
                 case 'Buscar Titular':
                     console.log('Botón Buscar Titular clickeado');
                     showSearchTitularModal();
                     break;
                 case 'Crear Titular':
                     console.log('Botón Crear Titular clickeado');
                     showCreateTitularModal();
                     break;
                case 'Buscar Beneficiario':
                    console.log('Botón Buscar Beneficiario clickeado');
                    showSearchBeneficiarioModal();
                    break;
                case 'Seleccionar':
                    console.log('Botón Seleccionar clickeado');
                    const selectedCity = document.getElementById('citySelect').value;
                    if (selectedCity) {
                        console.log('Ciudad seleccionada:', selectedCity);
                        
                        // Obtener nombre completo de la ciudad para la notificación
                        const citySelect = document.getElementById('citySelect');
                        const selectedOption = citySelect.options[citySelect.selectedIndex];
                        const cityName = selectedOption ? selectedOption.textContent : selectedCity;
                        
                        // Guardar la ciudad seleccionada en sessionStorage
                        sessionStorage.setItem('selectedCity', selectedCity);
                        try { showNotification('Ciudad seleccionada: ' + cityName, 'success'); } catch(e) {}
                        hideModal();
                        // Cargar titulares de la ciudad seleccionada
                        loadTitularesForSelectedCity();
                    } else {
                        try { showNotification('Por favor, seleccione una ciudad', 'warning'); } catch(e) { alert('Por favor, seleccione una ciudad'); }
                    }
                    break;
                case 'Editar':
                    console.log('Botón Editar clickeado');
                    // Agregar funcionalidad de editar
                    break;
                case 'Eliminar':
                    console.log('Botón Eliminar clickeado');
                    // Agregar funcionalidad de eliminar
                    break;
                default:
                    console.log('Botón clickeado:', buttonText);
            }
        });
    });
    
    // ========================================
    // EFECTOS DE TABLA
    // ========================================
    
    // Efectos hover en filas de tabla
    const tableRows = document.querySelectorAll('.table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });
    
    // ========================================
    // FUNCIONALIDAD DE FORMULARIOS
    // ========================================
    
    // Funcionalidad del select de ciudades y carga dinámica desde ciudades
    const citySelect = document.getElementById('citySelect');
    function populateCitySelectFromCiudades() {
        if (!citySelect) return;
        let ciudades = {};
        if (typeof window.getCiudadesData === 'function') {
            ciudades = window.getCiudadesData();
        } else {
            // Fallback SIEMPRE a localStorage si hay datos válidos
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
        const currentValue = citySelect.value;
        citySelect.innerHTML = '<option value="">Seleccione la ciudad</option>';
        Object.values(ciudades)
            .filter(c => c.activo !== false) // Solo ciudades activas
            .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)))
            .forEach(c => {
                const opt = document.createElement('option');
                const code = String(c.codigo || '').toUpperCase();
                const name = String(c.nombre || '').toUpperCase();
                opt.value = c.codigo;
                opt.textContent = `${code} - ${name}`;
                citySelect.appendChild(opt);
            });
        if (currentValue && ciudades[currentValue] && ciudades[currentValue].activo !== false) citySelect.value = currentValue;
    }
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            console.log('Ciudad seleccionada:', this.value);
        });
        // Poblar al cargar
        populateCitySelectFromCiudades();
        // Actualizar cuando ciudades cambie
        window.addEventListener('ciudades:updated', populateCitySelectFromCiudades);
    }

    // Fallback: crear modal de selección si no existe y exponer funciones
    if (typeof window.showSelectCityModal !== 'function') {
        const existing = document.getElementById('selectCityModal');
        if (!existing) {
            const container = document.createElement('div');
            container.id = 'selectCityModal';
            container.className = 'modal-overlay';
            container.style.display = 'none';
            container.innerHTML = `
                <div class="modal" style="max-width: 420px; width: 90%;">
                    <div class="modal-header">
                        <h3 class="modal-title">SELECCIONAR CIUDAD</h3>
                        <button class="modal-close" onclick="hideSelectCityModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="citySelect" class="form-label">Ciudad *</nlabel>
                            <div class="select-container">
                                <select id="citySelect" class="form-select">
                                    <option value="">Seleccione la ciudad</option>
                                </select>
                                <i class="fas fa-chevron-down select-arrow"></i>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="bSeleccionarCiudad">Seleccionar</button>
                    </div>
                </div>`;
            document.body.appendChild(container);
            const bSeleccionar = container.querySelector('#bSeleccionarCiudad');
            bSeleccionar.addEventListener('click', () => {
                const sel = container.querySelector('#citySelect');
                const value = sel.value;
                if (!value) { try { showNotification('Por favor, seleccione una ciudad', 'warning'); } catch(e) { alert('Por favor, seleccione una ciudad'); } return; }
                
                // Obtener nombre completo de la ciudad para la notificación
                const selectedOption = sel.options[sel.selectedIndex];
                const cityName = selectedOption ? selectedOption.textContent : value;
                
                sessionStorage.setItem('selectedCity', value);
                container.style.display = 'none';
                document.body.style.overflow = 'auto';
                try { showNotification('Ciudad seleccionada: ' + cityName, 'success'); } catch(e) {}
                // Cargar titulares de la ciudad seleccionada
                loadTitularesForSelectedCity();
            });
        }
        window.showSelectCityModal = function() {
            // repoblar usando el método existente
            populateCitySelectFromCiudades();
            const container = document.getElementById('selectCityModal');
            if (container) {
                container.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        };
        window.hideSelectCityModal = function() {
            const container = document.getElementById('selectCityModal');
            if (container) {
                container.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        };
    }
    
    // ========================================
    // FUNCIONALIDAD DEL BOTÓN CREAR TITULAR
    // ========================================
    
    // ========================================
    // VALIDACIÓN DE CAMPOS NUMÉRICOS (Número ID y Celular)
    // ========================================
    
    // Validación para el campo Número ID (tId)
    const tIdInput = document.getElementById('tId');
    if (tIdInput) {
        tIdInput.addEventListener('input', function(e) {
            // Solo permitir números
            let value = e.target.value.replace(/\D/g, '');
            // Limitar a 10 dígitos
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            e.target.value = value;
        });
        
        // Prevenir pegar texto que no sean números
        tIdInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const numbers = paste.replace(/\D/g, '').substring(0, 10);
            const currentValue = e.target.value.replace(/\D/g, '');
            const newValue = (currentValue + numbers).substring(0, 10);
            e.target.value = newValue;
        });
    }
    
    // Validación para el campo Celular (tCelular)
    const tCelularInput = document.getElementById('tCelular');
    if (tCelularInput) {
        tCelularInput.addEventListener('input', function(e) {
            // Solo permitir números
            let value = e.target.value.replace(/\D/g, '');
            // Limitar a 10 dígitos
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            e.target.value = value;
        });
        
        // Prevenir pegar texto que no sean números
        tCelularInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const numbers = paste.replace(/\D/g, '').substring(0, 10);
            const currentValue = e.target.value.replace(/\D/g, '');
            const newValue = (currentValue + numbers).substring(0, 10);
            e.target.value = newValue;
        });
    }
    
    // Convertir a mayúsculas mientras se escribe en campos de texto del formulario de titular
    const camposMayusculasTitular = [
        'tApellido1', 'tApellido2', 'tNombre1', 'tNombre2', 
        'tDireccion', 'tBarrioT', 'tCorreo'
    ];
    
    camposMayusculasTitular.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
            // Event listener para input (mientras se escribe)
            campo.addEventListener('input', function(e) {
                const cursorPosition = e.target.selectionStart;
                const oldValue = e.target.value;
                e.target.value = e.target.value.toUpperCase();
                // Restaurar posición del cursor
                const lengthDiff = e.target.value.length - oldValue.length;
                e.target.setSelectionRange(cursorPosition + lengthDiff, cursorPosition + lengthDiff);
            });
            
            // Event listener para keyup (después de presionar tecla)
            campo.addEventListener('keyup', function(e) {
                const cursorPosition = e.target.selectionStart;
                e.target.value = e.target.value.toUpperCase();
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            });
            
            // Event listener para paste (al pegar)
            campo.addEventListener('paste', function(e) {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const currentValue = e.target.value;
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const newValue = currentValue.substring(0, start) + paste.toUpperCase() + currentValue.substring(end);
                e.target.value = newValue;
                const newCursorPosition = start + paste.length;
                e.target.setSelectionRange(newCursorPosition, newCursorPosition);
            });
        }
    });
    
    // Convertir a mayúsculas mientras se escribe en campos de texto del formulario de actualizar titular
    const camposMayusculasUpdateTitular = [
        'uApellido1', 'uApellido2', 'uNombre1', 'uNombre2', 
        'uDireccion', 'uBarrioT', 'uCorreo'
    ];
    
    camposMayusculasUpdateTitular.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
            // Event listener para input (mientras se escribe)
            campo.addEventListener('input', function(e) {
                const cursorPosition = e.target.selectionStart;
                const oldValue = e.target.value;
                e.target.value = e.target.value.toUpperCase();
                // Restaurar posición del cursor
                const lengthDiff = e.target.value.length - oldValue.length;
                e.target.setSelectionRange(cursorPosition + lengthDiff, cursorPosition + lengthDiff);
            });
            
            // Event listener para keyup (después de presionar tecla)
            campo.addEventListener('keyup', function(e) {
                const cursorPosition = e.target.selectionStart;
                e.target.value = e.target.value.toUpperCase();
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            });
            
            // Event listener para paste (al pegar)
            campo.addEventListener('paste', function(e) {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const currentValue = e.target.value;
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const newValue = currentValue.substring(0, start) + paste.toUpperCase() + currentValue.substring(end);
                e.target.value = newValue;
                const newCursorPosition = start + paste.length;
                e.target.setSelectionRange(newCursorPosition, newCursorPosition);
            });
        }
    });
    
    // Funcionalidad del botón crear titular
    const bCrear = document.getElementById('bCrear');
    if (bCrear) {
        bCrear.addEventListener('click', function() {
            // Obtener valores del formulario
            const tipoId = document.getElementById('cTipo_Id').value.trim();
            const numeroId = document.getElementById('tId').value.trim();
            const apellido1 = document.getElementById('tApellido1').value.trim();
            const apellido2 = document.getElementById('tApellido2').value.trim();
            const nombre1 = document.getElementById('tNombre1').value.trim();
            const nombre2 = document.getElementById('tNombre2').value.trim();
            const direccion = document.getElementById('tDireccion').value.trim();
            const barrio = document.getElementById('tBarrioT').value.trim();
            const celular = document.getElementById('tCelular').value.trim();
            const correo = document.getElementById('tCorreo').value.trim();
            const fechaIngreso = document.getElementById('tFecha_Ingreso').value.trim();
            const activo = document.getElementById('cActivo').value.trim() || 'SI';
            const beneficiario = document.getElementById('cBeneficiario').value.trim() || 'NO';
            
            // Validar campos obligatorios (tNombre2 y tApellido2 NO son obligatorios)
            if (!tipoId || !numeroId || !apellido1 || !nombre1 || !direccion || !barrio || !celular || !correo || !fechaIngreso) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                alert('Por favor, ingrese un correo electrónico válido.');
                return;
            }
            
            // Crear objeto de titular (convertir todos los campos de texto a mayúsculas)
            const nuevoTitular = {
                tipoId: tipoId.toUpperCase(),
                numeroId: numeroId,
                apellido1: apellido1.toUpperCase(),
                apellido2: apellido2 ? apellido2.toUpperCase() : '',
                nombre1: nombre1.toUpperCase(),
                nombre2: nombre2 ? nombre2.toUpperCase() : '',
                direccion: direccion.toUpperCase(),
                barrio: barrio.toUpperCase(),
                celular: celular,
                correo: correo.toUpperCase(),
                fechaIngreso: fechaIngreso,
                activo: activo.toUpperCase(),
                beneficiario: beneficiario.toUpperCase()
            };
            
            console.log('Nuevo titular a crear:', nuevoTitular);
            
                         // Determinar si es crear o actualizar basado en el texto del botón
             const isUpdate = document.getElementById('bCrear').textContent === 'Actualizar';
             
             if (isUpdate) {
                 // Es una actualización - verificar si el ID cambió
                 const originalId = document.getElementById('tId').getAttribute('data-original-id');
                if (originalId && originalId !== numeroId) {
                    // El ID cambió - eliminar el titular anterior
                    deleteTitularFromData(originalId);
                    
                    // Eliminar la fila anterior de la tabla
                    const tableBody = document.getElementById('titularesTableBody');
                    const rows = tableBody.querySelectorAll('tr');
                    for (let row of rows) {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 2 && cells[1].textContent === originalId) {
                            row.remove();
                            break;
                        }
                    }
                }
            }
            
            // Verificar el texto del botón primero
            const buttonText = document.getElementById('bCrear').textContent;
            
            if (buttonText === 'Siguiente') {
                // Si dice "Siguiente", ir al modal de beneficiario (tanto en crear como en actualizar)
                if (isUpdate) {
                    // En modo actualizar, buscar y mostrar los beneficiarios del titular
                    const numeroId = document.getElementById('tId').value.trim();
                    if (numeroId) {
                        // Obtener los beneficiarios del titular
                        const lista = titularIdToBeneficiarios[numeroId] || [];
                        
                        // Si tiene exactamente un beneficiario, abrir directamente el formulario de edición
                        if (lista.length === 1) {
                            const beneficiario = lista[0];
                            // Cerrar modal de titular primero
                            hideCreateTitularModal();
                            // Esperar un momento para que el modal se cierre antes de abrir el de beneficiario
                            setTimeout(() => {
                                // Editar el beneficiario directamente
                                if (typeof editBeneficiario === 'function') {
                                    editBeneficiario(beneficiario.numeroId);
                                }
                            }, 100);
                        } else {
                            // Si tiene varios o ninguno, mostrar el modal de resultados
                            // Construir el objeto titular completo desde los campos del formulario
                            const titular = {
                                tipoId: document.getElementById('cTipo_Id').value.trim().toUpperCase(),
                                numeroId: numeroId,
                                apellido1: document.getElementById('tApellido1').value.trim().toUpperCase(),
                                apellido2: document.getElementById('tApellido2').value.trim().toUpperCase(),
                                nombre1: document.getElementById('tNombre1').value.trim().toUpperCase(),
                                nombre2: document.getElementById('tNombre2').value.trim().toUpperCase(),
                                direccion: document.getElementById('tDireccion').value.trim().toUpperCase(),
                                barrio: document.getElementById('tBarrioT').value.trim().toUpperCase(),
                                celular: document.getElementById('tCelular').value.trim(),
                                correo: document.getElementById('tCorreo').value.trim().toUpperCase(),
                                fechaIngreso: document.getElementById('tFecha_Ingreso').value.trim(),
                                activo: (document.getElementById('cActivo').value.trim() || 'SI').toUpperCase(),
                                beneficiario: (document.getElementById('cBeneficiario').value.trim() || 'NO').toUpperCase()
                            };
                            
                            // Guardar el ID del titular para mostrar sus beneficiarios
                            sessionStorage.setItem('currentSearchedTitularId', numeroId);
                            
                            // Cerrar modal de titular
                            hideCreateTitularModal();
                            
                            // Abrir modal de resultados directamente
                            if (typeof showTitularResultsModal === 'function') {
                                showTitularResultsModal();
                            }
                            
                            // Renderizar resultados del titular y sus beneficiarios
                            setTimeout(() => {
                                // Renderizar el titular en los resultados
                                const body = document.getElementById('searchResultsTableBody');
                                if (body) {
                                    body.innerHTML = '';
                                    const nombreCompleto = [
                                        titular.apellido1 || '',
                                        titular.apellido2 || '',
                                        titular.nombre1 || '',
                                        titular.nombre2 || ''
                                    ].filter(nombre => nombre.trim() !== '').join(' ');
                                    
                                    const isActive = (String(titular.activo || 'SI').toUpperCase() === 'SI');
                                    const row = document.createElement('tr');
                                    row.innerHTML = `
                                        <td>${titular.numeroId}</td>
                                        <td>${nombreCompleto}</td>
                                        <td><span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVO' : 'INACTIVO'}</span></td>
                                        <td>${titular.direccion || ''}</td>
                                        <td>${titular.celular || ''}</td>
                                        <td>${titular.correo || ''}</td>
                                        <td>
                                            <button class="btn btn-small" onclick="editTitular('${titular.numeroId}')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <label class="animated-toggle" data-id="${titular.numeroId}" title="${isActive ? 'Desactivar' : 'Activar'}" for="toggleTitularResults_${titular.numeroId}">
                                                <input type="checkbox" id="toggleTitularResults_${titular.numeroId}" name="toggleTitularResults_${titular.numeroId}" ${isActive ? 'checked' : ''} onchange="toggleTitularState('${titular.numeroId}')">
                                                <span class="toggle-slider"></span>
                                            </label>
                                        </td>`;
                                    body.appendChild(row);
                                }
                                
                                // Renderizar beneficiarios del titular
                                const beneficiariosBody = document.getElementById('titularBeneficiariosResultsBody');
                                if (beneficiariosBody) {
                                    beneficiariosBody.innerHTML = '';
                                    
                                    if (lista.length === 0) {
                                        beneficiariosBody.innerHTML = `
                                            <tr>
                                                <td colspan="8" class="no-data-message">
                                                    <div class="no-data-content">
                                                        <i class="fas fa-user-friends"></i>
                                                        <p>Este titular no tiene beneficiarios</p>
                                                    </div>
                                                </td>
                                            </tr>`;
                                    } else {
                                        lista.forEach(b => {
                                            const nombreCompletoBenef = [
                                                b.apellido1 || '',
                                                b.apellido2 || '',
                                                b.nombre1 || '',
                                                b.nombre2 || ''
                                            ].filter(nombre => nombre.trim() !== '').join(' ');
                                            
                                            const tr = document.createElement('tr');
                                            tr.innerHTML = `
                                                <td>${b.tipoId || 'CC'}</td>
                                                <td>${b.numeroId}</td>
                                                <td>${nombreCompletoBenef}</td>
                                                <td>${b.direccion || ''}</td>
                                                <td>${b.telefono || ''}</td>
                                                <td>${b.email || ''}</td>
                                                <td>${String(b.activo || '').toUpperCase()}</td>
                                                <td>
                                                    <button class="btn btn-small" onclick="editBeneficiario('${b.numeroId}')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                </td>`;
                                            beneficiariosBody.appendChild(tr);
                                        });
                                    }
                                }
                            }, 100);
                        }
                    }
                } else {
                    // En modo crear, ir directamente al modal de beneficiario
                    sessionStorage.setItem('tempTitular', JSON.stringify(nuevoTitular));
                    hideCreateTitularModal();
                    showCreateBeneficiarioModal();
                }
            } else if (isUpdate) {
                // Es una actualización y el botón dice "Actualizar" - mostrar modal de confirmación
                window.tempTitularData = nuevoTitular;
                showConfirmUpdateTitularModal();
            } else {
                // Es una creación y el botón dice "Crear" - mostrar modal de confirmación
                window.tempTitularData = nuevoTitular;
                showConfirmCreateTitularModal();
            }
        });
    }
    
         // ========================================
     // FUNCIONALIDAD DEL BOTÓN BUSCAR TITULAR
     // ========================================
     
         // Funcionalidad del botón buscar titular
    const bBuscar = document.getElementById('bBuscar');
    if (bBuscar) {
        bBuscar.addEventListener('click', function() {
             // Obtener el ID del titular a buscar
             const titularId = document.getElementById('searchTitularId').value.trim();
             
             // Validar que se haya ingresado un ID
             if (!titularId) {
                 alert('Por favor, ingrese el ID del titular a buscar.');
                 return;
             }
             
             console.log('Buscando titular con ID:', titularId);
             
             // Simular búsqueda (aquí se conectaría con el backend)
             // Por ahora, simulamos un resultado de búsqueda
             const resultadoBusqueda = buscarTitular(titularId);
             
             if (resultadoBusqueda) {
                 // Mostrar resultados de búsqueda
                 renderTitularSearchResults(resultadoBusqueda);
                 hideSearchTitularModal();
                 showTitularResultsModal();
             } else {
                 // Mostrar mensaje de no encontrado
                 renderTitularSearchResults(null);
                 hideSearchTitularModal();
                 showTitularResultsModal();
             }
         });
     }
     
         // ========================================
    // FUNCIONALIDAD DEL BOTÓN BUSCAR BENEFICIARIO
    // ========================================
    
    // Funcionalidad del botón buscar beneficiario
    const bBuscarBeneficiario = document.getElementById('bBuscarBeneficiario');
    if (bBuscarBeneficiario) {
        bBuscarBeneficiario.addEventListener('click', function() {
            // Obtener el ID del beneficiario a buscar
            const beneficiarioId = document.getElementById('searchBeneficiarioId').value.trim();
            
            // Validar que se haya ingresado un ID
            if (!beneficiarioId) {
                alert('Por favor, ingrese el ID del beneficiario a buscar.');
                return;
            }
            
            console.log('Buscando beneficiario con ID:', beneficiarioId);
            
            // Simular búsqueda (aquí se conectaría con el backend)
            const beneficiario = buscarBeneficiario(beneficiarioId);
            
            if (beneficiario) {
                // Buscar el titular asociado
                const titular = buscarTitularPorBeneficiario(beneficiarioId);
                
                // Guardar ID del beneficiario para refrescar después de actualizaciones
                sessionStorage.setItem('currentSearchedBeneficiarioId', beneficiario.numeroId);
                
                // Mostrar resultados en el modal de resultados
                renderBeneficiarioSearchResults(beneficiario, titular);
                  hideSearchBeneficiarioModal();
                  showBeneficiarioResultsModal();
              } else {
                  // Mostrar mensaje de no encontrado
                renderBeneficiarioSearchResults(null, null);
                  hideSearchBeneficiarioModal();
                  showBeneficiarioResultsModal();
              }
        });
    }
    
    // ========================================
    // VALIDACIÓN DE CAMPOS NUMÉRICOS DEL BENEFICIARIO (Número ID y Teléfono)
    // ========================================
    
    // Validación para el campo Número ID del beneficiario (bNumeroId)
    const bNumeroIdInput = document.getElementById('bNumeroId');
    if (bNumeroIdInput) {
        bNumeroIdInput.addEventListener('input', function(e) {
            // Solo permitir números
            let value = e.target.value.replace(/\D/g, '');
            // Limitar a 10 dígitos
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            e.target.value = value;
        });
        
        // Prevenir pegar texto que no sean números
        bNumeroIdInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const numbers = paste.replace(/\D/g, '').substring(0, 10);
            const currentValue = e.target.value.replace(/\D/g, '');
            const newValue = (currentValue + numbers).substring(0, 10);
            e.target.value = newValue;
        });
    }
    
    // ========================================
    // CONVERSIÓN AUTOMÁTICA A MAYÚSCULAS EN CAMPOS DE TEXTO DE BENEFICIARIOS
    // ========================================
    
    // Convertir a mayúsculas mientras se escribe en campos de texto del formulario de beneficiario
    const camposMayusculasBeneficiario = [
        'beneficiarioApellido1', 'beneficiarioApellido2', 'beneficiarioNombre1', 'beneficiarioNombre2', 
        'bDireccion', 'bEmail'
    ];
    
    camposMayusculasBeneficiario.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
            // Event listener para input (mientras se escribe)
            campo.addEventListener('input', function(e) {
                const cursorPosition = e.target.selectionStart;
                const oldValue = e.target.value;
                e.target.value = e.target.value.toUpperCase();
                // Restaurar posición del cursor
                const lengthDiff = e.target.value.length - oldValue.length;
                e.target.setSelectionRange(cursorPosition + lengthDiff, cursorPosition + lengthDiff);
            });
            
            // Event listener para keyup (después de presionar tecla)
            campo.addEventListener('keyup', function(e) {
                const cursorPosition = e.target.selectionStart;
                e.target.value = e.target.value.toUpperCase();
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            });
            
            // Event listener para paste (al pegar)
            campo.addEventListener('paste', function(e) {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const currentValue = e.target.value;
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const newValue = currentValue.substring(0, start) + paste.toUpperCase() + currentValue.substring(end);
                e.target.value = newValue;
                const newCursorPosition = start + paste.length;
                e.target.setSelectionRange(newCursorPosition, newCursorPosition);
            });
        }
    });
    
    // Convertir a mayúsculas mientras se escribe en campos de texto del formulario de actualizar beneficiario
    const camposMayusculasUpdateBeneficiario = [
        'updateBeneficiarioApellido1', 'updateBeneficiarioApellido2', 'updateBeneficiarioNombre1', 'updateBeneficiarioNombre2', 
        'ubDireccion', 'ubEmail'
    ];
    
    camposMayusculasUpdateBeneficiario.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
            // Event listener para input (mientras se escribe)
            campo.addEventListener('input', function(e) {
                const cursorPosition = e.target.selectionStart;
                const oldValue = e.target.value;
                e.target.value = e.target.value.toUpperCase();
                // Restaurar posición del cursor
                const lengthDiff = e.target.value.length - oldValue.length;
                e.target.setSelectionRange(cursorPosition + lengthDiff, cursorPosition + lengthDiff);
            });
            
            // Event listener para keyup (después de presionar tecla)
            campo.addEventListener('keyup', function(e) {
                const cursorPosition = e.target.selectionStart;
                e.target.value = e.target.value.toUpperCase();
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            });
            
            // Event listener para paste (al pegar)
            campo.addEventListener('paste', function(e) {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const currentValue = e.target.value;
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const newValue = currentValue.substring(0, start) + paste.toUpperCase() + currentValue.substring(end);
                e.target.value = newValue;
                const newCursorPosition = start + paste.length;
                e.target.setSelectionRange(newCursorPosition, newCursorPosition);
            });
        }
    });
    
    // Validación para el campo Teléfono del beneficiario (bTelefono)
    const bTelefonoInput = document.getElementById('bTelefono');
    if (bTelefonoInput) {
        bTelefonoInput.addEventListener('input', function(e) {
            // Solo permitir números
            let value = e.target.value.replace(/\D/g, '');
            // Limitar a 10 dígitos
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            e.target.value = value;
        });
        
        // Prevenir pegar texto que no sean números
        bTelefonoInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const numbers = paste.replace(/\D/g, '').substring(0, 10);
            const currentValue = e.target.value.replace(/\D/g, '');
            const newValue = (currentValue + numbers).substring(0, 10);
            e.target.value = newValue;
        });
    }
    
    // ========================================
    // FUNCIONALIDAD DEL BOTÓN CREAR BENEFICIARIO
    // ========================================
    
    // Funcionalidad del botón crear beneficiario
    const bCrearBeneficiario = document.getElementById('bCrearBeneficiario');
    if (bCrearBeneficiario) {
        bCrearBeneficiario.addEventListener('click', function() {
            // Obtener valores del formulario
            const tipoId = document.getElementById('bTipoId').value.trim();
            const numeroId = document.getElementById('bNumeroId').value.trim();
            const apellido1 = document.getElementById('beneficiarioApellido1').value.trim();
            const apellido2 = document.getElementById('beneficiarioApellido2').value.trim();
            const nombre1 = document.getElementById('beneficiarioNombre1').value.trim();
            const nombre2 = document.getElementById('beneficiarioNombre2').value.trim();
            const direccion = document.getElementById('bDireccion').value.trim();
            const telefono = document.getElementById('bTelefono').value.trim();
            const email = document.getElementById('bEmail').value.trim();
            const activo = document.getElementById('bActivo').value.trim();
            
            // Validar campos obligatorios
            if (!tipoId || !numeroId || !apellido1 || !nombre1 || !direccion || !telefono || !email || !activo) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, ingrese un correo electrónico válido.');
                return;
            }
            
            // Crear objeto de beneficiario
            const nuevoBeneficiario = {
                tipoId: tipoId.toUpperCase(),
                numeroId: numeroId,
                apellido1: apellido1.toUpperCase(),
                apellido2: apellido2 ? apellido2.toUpperCase() : '',
                nombre1: nombre1.toUpperCase(),
                nombre2: nombre2 ? nombre2.toUpperCase() : '',
                direccion: direccion.toUpperCase(),
                telefono: telefono,
                email: email.toUpperCase(),
                activo: activo.toUpperCase()
            };
            
            console.log('Nuevo beneficiario a crear:', nuevoBeneficiario);
            
            // Determinar si es crear o actualizar basado en el texto del botón
            const createButton = document.getElementById('bCrearBeneficiario');
            const isUpdate = createButton && createButton.textContent === 'Actualizar';
            
            console.log('🔍 Detección de modo:', {
                buttonText: createButton ? createButton.textContent : 'No encontrado',
                isUpdate: isUpdate
            });
            
            // Verificar si viene del modal de titular
            const tempTitular = sessionStorage.getItem('tempTitular');
            // Verificar si viene desde "Añadir Beneficiario" en resultados
            const titularFromResults = sessionStorage.getItem('currentSearchedTitularId');
            
            if (tempTitular) {
                // Si viene del modal de titular, mostrar modal de confirmación específico
                window.tempBeneficiarioData = nuevoBeneficiario;
                showConfirmCreateTitularBeneficiarioModal();
            } else if (titularFromResults) {
                // Asociar a titular buscado desde resultados
                const titularId = titularFromResults;
                if (!titularIdToBeneficiarios[titularId]) {
                    titularIdToBeneficiarios[titularId] = [];
                }
                
                if (isUpdate) {
                    // Es una actualización - mostrar modal de confirmación
                    console.log('✅ Mostrando modal de confirmación de ACTUALIZACIÓN');
                    window.tempBeneficiarioData = nuevoBeneficiario;
                    showConfirmUpdateBeneficiarioModal();
                } else {
                    // Es una creación - mostrar modal de confirmación
                    console.log('✅ Mostrando modal de confirmación de CREACIÓN');
                    window.tempBeneficiarioData = nuevoBeneficiario;
                    showConfirmCreateBeneficiarioModal();
                }
                
                // Solo agregar a la tabla si es creación, no si es actualización
                if (!isUpdate) {
                    addBeneficiarioToTable(nuevoBeneficiario);
                }
                
                // Refrescar lista en el modal de resultados
                renderBeneficiariosDeTitular(titularId);
                
                // Asegurar que el modal de resultados permanezca abierto y visible
                const titularResultsModal = document.getElementById('titularResultsModal');
                if (titularResultsModal) {
                    // Asegurar que el modal de resultados esté visible y por debajo del modal de creación
                    titularResultsModal.style.zIndex = '9998';
                    titularResultsModal.style.display = 'flex';
                    console.log('Modal de resultados configurado para permanecer abierto');
                }
                
                // Limpiar flag de sesión
                sessionStorage.removeItem('currentSearchedTitularId');
                
                // Cerrar solo el modal de crear beneficiario, mantener resultados abierto
                hideCreateBeneficiarioModal();
                
                // Verificar que el modal de resultados permanezca abierto
                setTimeout(() => {
                    const titularResultsModal = document.getElementById('titularResultsModal');
                    if (titularResultsModal && titularResultsModal.style.display !== 'flex') {
                        console.log('ERROR: El modal de resultados se cerró inesperadamente');
                    } else {
                        console.log('SUCCESS: Modal de resultados permanece abierto');
                        // Restaurar z-index del modal de resultados
                        titularResultsModal.style.zIndex = '';
                    }
                }, 100);
                
                console.log('Beneficiario creado y lista actualizada para titular:', titularId);
            } else {
                // Si no viene del modal de titular, mostrar modal de confirmación
                window.tempBeneficiarioData = nuevoBeneficiario;
                showConfirmCreateBeneficiarioModal();
                return;
            }
            
            hideCreateBeneficiarioModal();
        });
    }
    
    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    // Inicializar funcionalidades adicionales
    console.log('Dashboard de Titulares inicializado exitosamente');
    
    // Mostrar modal de selección de ciudad al cargar la página (simulando login)
    // Esto mostrará el modal automáticamente cuando se cargue la página
    setTimeout(showModal, 500);

    // ========================================
    // UTILIDADES: NOTIFICACIONES
    // ========================================
    if (typeof window.showNotification !== 'function') {
        window.showNotification = function(message, type = 'info') {
            try {
                // Remover TODAS las notificaciones existentes antes de crear una nueva
                const existingNotifications = document.querySelectorAll('.notification');
                existingNotifications.forEach(notif => notif.remove());
                
                const notification = document.createElement('div');
                notification.className = `notification notification-${type}`;
                notification.textContent = message;
                document.body.appendChild(notification);
                setTimeout(() => notification.classList.add('show'), 100);
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => { 
                        try { 
                            if (notification.parentNode) {
                                document.body.removeChild(notification); 
                            }
                        } catch(e) {} 
                    }, 300);
                }, 2000); // Reducido a 2 segundos
            } catch (e) { console.log(message); }
        };
    }
    
    // ========================================
    // FUNCIONES DE GESTIÓN DE TITULARES
    // ========================================
    
    

}); 

// ========================================
// FUNCIONES GLOBALES DE GESTIÓN DE BENEFICIARIOS
// ========================================

/**
 * Actualiza un beneficiario existente en la tabla
 * @param {Object} beneficiario - Objeto con los datos actualizados del beneficiario
 * @param {string} originalId - ID original del beneficiario (si cambió)
 */
function updateBeneficiarioInTable(beneficiario, originalId) {
    console.log('🔍 updateBeneficiarioInTable llamada con:', { beneficiario, originalId });
    const tableBody = document.getElementById('beneficiariosTableBody');
    if (!tableBody) {
        console.error('❌ No se encontró el elemento beneficiariosTableBody');
        return;
    }
    console.log('✅ Elemento beneficiariosTableBody encontrado');
    
    const rows = tableBody.querySelectorAll('tr');
    console.log('📊 Filas encontradas en la tabla:', rows.length);
    
    // Buscar la fila a actualizar
    let updated = false;
    for (let row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const rowId = cells[1].textContent; // ID está en la segunda columna
            
            // Si el ID cambió, buscar por el ID original
            const searchId = originalId || beneficiario.numeroId;
            console.log('🔍 Comparando rowId:', rowId, 'con searchId:', searchId);
            
            if (rowId === searchId) {
                console.log('✅ Fila encontrada, actualizando...');
                // Concatenar nombre completo
                const nombreCompleto = [
                    beneficiario.apellido1 || '',
                    beneficiario.apellido2 || '',
                    beneficiario.nombre1 || '',
                    beneficiario.nombre2 || ''
                ].filter(nombre => nombre.trim() !== '').join(' ');

                // Actualizar el contenido de la fila
                row.innerHTML = `
                    <td>${beneficiario.tipoId}</td>
                    <td>${beneficiario.numeroId}</td>
                    <td>${nombreCompleto}</td>
                    <td>${beneficiario.direccion}</td>
                    <td>${beneficiario.telefono}</td>
                    <td>${beneficiario.email}</td>
                    <td>${String(beneficiario.activo || '').toUpperCase()}</td>
                    <td>
                        <button class="btn btn-small" onclick="editBeneficiario('${beneficiario.numeroId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                `;
                
                // Re-agregar efectos hover
                row.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = '#f8f9fa';
                });
                
                row.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = '';
                });
                
                updated = true;
                break;
            }
        }
    }
    if (!updated) {
        console.log('🆕 No se encontró fila existente, creando nueva fila...');
        // Si no existía, agregar como nueva fila
        try {
            if (tableBody.querySelector('.no-data-message')) {
                tableBody.querySelector('.no-data-message').parentElement?.remove();
            }
        } catch (e) {}
        const nombreCompleto = [
            beneficiario.apellido1 || '',
            beneficiario.apellido2 || '',
            beneficiario.nombre1 || '',
            beneficiario.nombre2 || ''
        ].filter(nombre => nombre.trim() !== '').join(' ');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${beneficiario.tipoId}</td>
            <td>${beneficiario.numeroId}</td>
            <td>${nombreCompleto}</td>
            <td>${beneficiario.direccion}</td>
            <td>${beneficiario.telefono}</td>
            <td>${beneficiario.email}</td>
            <td>${String(beneficiario.activo || '').toUpperCase()}</td>
            <td>
                <button class="btn btn-small" onclick="editBeneficiario('${beneficiario.numeroId}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(newRow);
        console.log('✅ Nueva fila agregada a la tabla');
    }
    // Guardar por ciudad y persistir
    const city = getSelectedCityCode();
    if (city) {
        if (!beneficiariosByCity[city]) beneficiariosByCity[city] = {};
        
        // Preservar titularId si el beneficiario ya lo tenía
        const existingBeneficiario = beneficiariosData[beneficiario.numeroId] || beneficiariosByCity[city][beneficiario.numeroId];
        const titularId = existingBeneficiario?.titularId || beneficiario.titularId;
        
        const beneficiarioToSave = { ...beneficiario, ciudad: city };
        if (titularId) {
            beneficiarioToSave.titularId = titularId;
        }
        
        beneficiariosByCity[city][beneficiario.numeroId] = beneficiarioToSave;
        if (typeof persistBeneficiariosByCity === 'function') {
            persistBeneficiariosByCity();
        }
        // Persistir en memoria
        beneficiariosData[beneficiario.numeroId] = beneficiarioToSave;
        
        // Actualizar relación titular-beneficiario si tiene titularId
        if (titularId) {
            if (!titularIdToBeneficiarios[titularId]) {
                titularIdToBeneficiarios[titularId] = [];
            }
            // Verificar si ya existe en la relación
            const index = titularIdToBeneficiarios[titularId].findIndex(b => b.numeroId === beneficiario.numeroId);
            if (index >= 0) {
                titularIdToBeneficiarios[titularId][index] = beneficiarioToSave;
            } else {
                titularIdToBeneficiarios[titularId].push(beneficiarioToSave);
            }
            // Persistir relaciones
            try { localStorage.setItem('titularIdToBeneficiarios', JSON.stringify(titularIdToBeneficiarios)); } catch (e) {}
        }
    } else {
        // Si no hay ciudad, solo guardar en memoria (backup)
        beneficiariosData[beneficiario.numeroId] = beneficiario;
    }
    
    // Persistir en localStorage (backup)
    try { localStorage.setItem('beneficiariosData', JSON.stringify(beneficiariosData)); } catch (e) {}
    console.log('✅ updateBeneficiarioInTable completada');
}

/**
 * Agrega un nuevo beneficiario a la tabla
 * @param {Object} beneficiario - Objeto con los datos del beneficiario
 */
function addBeneficiarioToTable(beneficiario) {
    console.log('🔍 addBeneficiarioToTable llamada con:', beneficiario);
    
    // Guardar por ciudad y persistir
    const city = getSelectedCityCode();
    if (city) {
        if (!beneficiariosByCity[city]) beneficiariosByCity[city] = {};
        
        // Preservar titularId si el beneficiario ya lo tenía
        const existingBeneficiario = beneficiariosData[beneficiario.numeroId] || beneficiariosByCity[city][beneficiario.numeroId];
        const titularId = existingBeneficiario?.titularId || beneficiario.titularId;
        
        const beneficiarioToSave = { ...beneficiario, ciudad: city };
        if (titularId) {
            beneficiarioToSave.titularId = titularId;
        }
        
        beneficiariosByCity[city][beneficiario.numeroId] = beneficiarioToSave;
        if (typeof persistBeneficiariosByCity === 'function') {
            persistBeneficiariosByCity();
        }
        // Persistir en memoria
        beneficiariosData[beneficiario.numeroId] = beneficiarioToSave;
        
        // Actualizar relación titular-beneficiario si tiene titularId
        if (titularId) {
            if (!titularIdToBeneficiarios[titularId]) {
                titularIdToBeneficiarios[titularId] = [];
            }
            // Verificar si ya existe en la relación
            const index = titularIdToBeneficiarios[titularId].findIndex(b => b.numeroId === beneficiario.numeroId);
            if (index >= 0) {
                titularIdToBeneficiarios[titularId][index] = beneficiarioToSave;
            } else {
                titularIdToBeneficiarios[titularId].push(beneficiarioToSave);
            }
            // Persistir relaciones
            try { localStorage.setItem('titularIdToBeneficiarios', JSON.stringify(titularIdToBeneficiarios)); } catch (e) {}
        }
    } else {
        // Si no hay ciudad, solo guardar en memoria (backup)
        beneficiariosData[beneficiario.numeroId] = beneficiario;
    }
    
    // Persistir en localStorage (backup)
    try { localStorage.setItem('beneficiariosData', JSON.stringify(beneficiariosData)); } catch (e) {}
    
    const tableBody = document.getElementById('beneficiariosTableBody');
    if (!tableBody) {
        console.error('❌ No se encontró el elemento beneficiariosTableBody en addBeneficiarioToTable');
        return;
    }
    console.log('✅ Elemento beneficiariosTableBody encontrado en addBeneficiarioToTable');
    
    // Verificar si el beneficiario ya existe en la tabla para evitar duplicados
    const rows = tableBody.querySelectorAll('tr');
    let exists = false;
    for (let row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const rowId = cells[1].textContent.trim();
            if (rowId === beneficiario.numeroId) {
                exists = true;
                break;
            }
        }
    }
    
    // Si ya existe, no agregar de nuevo
    if (exists) {
        console.log('⚠️ Beneficiario ya existe en la tabla, omitiendo...');
        return;
    }
    
    const noDataRow = tableBody.querySelector('.no-data-message');
    
    if (noDataRow) {
        noDataRow.remove();
    }
    
    const newRow = document.createElement('tr');
    // Concatenar nombre completo
    const nombreCompleto = [
        beneficiario.apellido1 || '',
        beneficiario.apellido2 || '',
        beneficiario.nombre1 || '',
        beneficiario.nombre2 || ''
    ].filter(nombre => nombre.trim() !== '').join(' ');

    newRow.innerHTML = `
        <td>${beneficiario.tipoId || 'CC'}</td>
        <td>${beneficiario.numeroId}</td>
        <td>${nombreCompleto}</td>
        <td>${beneficiario.direccion || ''}</td>
        <td>${beneficiario.telefono || ''}</td>
        <td>${beneficiario.email || ''}</td>
        <td>${String(beneficiario.activo || '').toUpperCase()}</td>
        <td>
            <button class="btn btn-small" onclick="editBeneficiario('${beneficiario.numeroId}')">
                <i class="fas fa-edit"></i>
            </button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    
    // Agregar efectos hover a la nueva fila
    newRow.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#f8f9fa';
    });
    
    newRow.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '';
    });
    
    console.log('✅ addBeneficiarioToTable completada - fila agregada');
}

/**
 * Función simplificada siguiendo el patrón de ciudades
 */
function refreshTitularResultsTable() {
    const modal = document.getElementById('titularResultsModal');
    if (modal && modal.classList.contains('show')) {
        const currentTitularId = sessionStorage.getItem('currentSearchedTitularId');
        if (currentTitularId) {
            const titular = titularesData[currentTitularId];
            if (titular) {
                renderTitularSearchResults(titular);
                renderBeneficiariosDeTitular(currentTitularId);
            }
        }
    }
}

/**
 * Función simplificada siguiendo el patrón de ciudades
 */
function refreshBeneficiarioResultsTable() {
    const modal = document.getElementById('beneficiarioResultsModal');
    if (modal && modal.classList.contains('show')) {
        const currentBeneficiarioId = sessionStorage.getItem('currentSearchedBeneficiarioId');
        if (currentBeneficiarioId) {
            const beneficiario = beneficiariosData[currentBeneficiarioId];
            if (beneficiario) {
                // Buscar el titular asociado
                let titularAsociado = null;
                for (const [titularId, beneficiarios] of Object.entries(titularIdToBeneficiarios)) {
                    const found = beneficiarios.find(b => b.numeroId === currentBeneficiarioId);
                    if (found) {
                        titularAsociado = titularesData[titularId];
                        break;
                    }
                }
                renderBeneficiarioSearchResults(beneficiario, titularAsociado);
            }
        }
    }
}

// ========================================
// FUNCIONES GLOBALES DE MODALES
// ========================================

/**
 * Muestra el modal para crear un nuevo beneficiario
 */
function showCreateBeneficiarioModal() {
    console.log('🔍 Buscando modal createBeneficiarioModal...');
    const createBeneficiarioModalOverlay = document.getElementById('createBeneficiarioModal');
    
    if (createBeneficiarioModalOverlay) {
        console.log('✅ Modal encontrado, abriendo...');
        
        createBeneficiarioModalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log('✅ Modal de beneficiario abierto');
        
        // Verificar si hay un ID original (modo edición)
        const numeroIdField = document.getElementById('bNumeroId');
        const isEditMode = numeroIdField && numeroIdField.hasAttribute('data-original-id');
        
        if (!isEditMode) {
            // Solo limpiar si NO está en modo edición
            clearCreateBeneficiarioForm();
            
            // Cambiar el título y botón a modo "crear"
            const modalTitle = document.querySelector('#createBeneficiarioModal .modal-title');
            const createButton = document.getElementById('bCrearBeneficiario');
            
            if (modalTitle) {
                modalTitle.textContent = 'CREAR BENEFICIARIO';
            }
            
            if (createButton) {
                createButton.textContent = 'Crear';
            }
        } else {
            console.log('🔧 Modal abierto en modo edición');
        }
        
        // Establecer valor por defecto solo si no está en modo edición
        if (!isEditMode) {
            setTimeout(() => {
                if (typeof setBeneficiarioActivo === 'function') {
                    setBeneficiarioActivo('NO');
                }
            }, 100);
        }
        
        console.log('✅ Modal de crear beneficiario abierto correctamente');
    } else {
        console.log('❌ ERROR: No se encontró el modal createBeneficiarioModal');
        console.log('🔍 Elementos con modal-overlay:', document.querySelectorAll('.modal-overlay'));
        console.log('🔍 IDs de modales encontrados:', Array.from(document.querySelectorAll('.modal-overlay')).map(el => el.id));
    }
}

/**
 * Oculta el modal de crear beneficiario y limpia el formulario
 */
function hideCreateBeneficiarioModal() {
    const createBeneficiarioModalOverlay = document.getElementById('createBeneficiarioModal');
    if (createBeneficiarioModalOverlay) {
        createBeneficiarioModalOverlay.classList.remove('show');
                document.body.style.overflow = 'auto';
        
        // Limpiar formulario
            clearCreateBeneficiarioForm();
        
        console.log('Modal de crear beneficiario cerrado');
    }
}

/**
 * Muestra el modal para crear un nuevo titular
 */
function showCreateTitularModal() {
    const createTitularModalOverlay = document.getElementById('createTitularModal');
    if (createTitularModalOverlay) {
        // Verificar si hay un ID original (modo edición)
        const numeroIdField = document.getElementById('tId');
        const isEditMode = numeroIdField && numeroIdField.hasAttribute('data-original-id');
        
        if (!isEditMode) {
            // Solo limpiar si NO está en modo edición
            clearCreateTitularForm();
        } else {
            console.log('🔧 Modal abierto en modo edición');
        }
        
        createTitularModalOverlay.style.display = 'flex';
        createTitularModalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log('✅ Modal de crear titular abierto correctamente');
    } else {
        console.log('❌ ERROR: No se encontró el modal createTitularModal');
    }
}

// Exponer función globalmente inmediatamente después de su definición
window.showCreateTitularModal = showCreateTitularModal;

/**
 * Muestra el modal para buscar titular
 */
function showSearchTitularModal() {
    const searchTitularModalOverlay = document.getElementById('searchTitularModal');
    if (searchTitularModalOverlay) {
        searchTitularModalOverlay.style.display = 'flex';
        searchTitularModalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Exponer función globalmente
window.showSearchTitularModal = showSearchTitularModal;

/**
 * Oculta el modal de buscar titular y limpia el formulario
 */
function hideSearchTitularModal() {
    const searchTitularModalOverlay = document.getElementById('searchTitularModal');
    if (searchTitularModalOverlay) {
        searchTitularModalOverlay.style.display = 'none';
        searchTitularModalOverlay.classList.remove('show');
        document.body.style.overflow = '';
        // Limpiar campo de búsqueda
        const searchInput = document.getElementById('searchTitularId');
        if (searchInput) {
            searchInput.value = '';
        }
        // Ocultar resultados de búsqueda
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        if (searchResultsContainer) {
            searchResultsContainer.style.display = 'none';
        }
    }
}

// Exponer función globalmente
window.hideSearchTitularModal = hideSearchTitularModal;

/**
 * Muestra el modal de búsqueda de beneficiario
 */
function showSearchBeneficiarioModal() {
    const searchBeneficiarioModalOverlay = document.getElementById('searchBeneficiarioModal');
    if (searchBeneficiarioModalOverlay) {
        searchBeneficiarioModalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        // Limpiar campo de búsqueda y ocultar resultados
        const searchInput = document.getElementById('searchBeneficiarioId');
        if (searchInput) {
            searchInput.value = '';
        }
        const beneficiarioResultsSection = document.getElementById('beneficiarioResultsSection');
        if (beneficiarioResultsSection) {
            beneficiarioResultsSection.style.display = 'none';
        }
    }
}

/**
 * Oculta el modal de búsqueda de beneficiario
 */
function hideSearchBeneficiarioModal() {
    const searchBeneficiarioModalOverlay = document.getElementById('searchBeneficiarioModal');
    if (searchBeneficiarioModalOverlay) {
        searchBeneficiarioModalOverlay.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Limpiar campo de búsqueda
        const searchBeneficiarioId = document.getElementById('searchBeneficiarioId');
        if (searchBeneficiarioId) searchBeneficiarioId.value = '';
    }
}

/**
 * Muestra el modal de resultados de búsqueda de titular
 */
function showTitularResultsModal() {
    const modal = document.getElementById('titularResultsModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta el modal de resultados de búsqueda de titular
 */
function hideTitularResultsModal() {
    const modal = document.getElementById('titularResultsModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Limpiar sessionStorage
        sessionStorage.removeItem('currentSearchedTitularId');
    }
}

/**
 * Muestra el modal de resultados de búsqueda de beneficiario
 */
function showBeneficiarioResultsModal() {
    const modal = document.getElementById('beneficiarioResultsModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta el modal de resultados de búsqueda de beneficiario
 */
function hideBeneficiarioResultsModal() {
    const modal = document.getElementById('beneficiarioResultsModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Limpiar sessionStorage
        sessionStorage.removeItem('currentSearchedBeneficiarioId');
    }
}

/**
 * Limpia todos los campos del formulario de crear beneficiario
 */
function clearCreateBeneficiarioForm() {
    const bTipoId = document.getElementById('bTipoId');
    const bNumeroId = document.getElementById('bNumeroId');
    const beneficiarioApellido1 = document.getElementById('beneficiarioApellido1');
    const beneficiarioApellido2 = document.getElementById('beneficiarioApellido2');
    const beneficiarioNombre1 = document.getElementById('beneficiarioNombre1');
    const beneficiarioNombre2 = document.getElementById('beneficiarioNombre2');
    const bDireccion = document.getElementById('bDireccion');
    const bTelefono = document.getElementById('bTelefono');
    const bEmail = document.getElementById('bEmail');
    const bActivo = document.getElementById('bActivo');
    
    if (bTipoId) bTipoId.value = '';
    if (bNumeroId) bNumeroId.value = '';
    if (beneficiarioApellido1) beneficiarioApellido1.value = '';
    if (beneficiarioApellido2) beneficiarioApellido2.value = '';
    if (beneficiarioNombre1) beneficiarioNombre1.value = '';
    if (beneficiarioNombre2) beneficiarioNombre2.value = '';
    if (bDireccion) bDireccion.value = '';
    if (bTelefono) bTelefono.value = '';
    if (bEmail) bEmail.value = '';
    if (bActivo) bActivo.value = '';
    
    // Limpiar estado de botones toggle
    const toggleButtons = document.querySelectorAll('#createBeneficiarioModal .btn-toggle');
    toggleButtons.forEach(btn => btn.classList.remove('active'));
    
    // Limpiar atributo de ID original si existe
    if (bNumeroId) {
        bNumeroId.removeAttribute('data-original-id');
    }
    
    console.log('✅ Formulario de beneficiario limpiado correctamente');
}

// ========================================
// FUNCIÓN GLOBAL PARA AÑADIR BENEFICIARIO DESDE RESULTADOS
// ========================================

/**
 * Función global para "Añadir Beneficiario" desde resultados del titular
 * Esta función debe estar fuera del scope del DOMContentLoaded para ser accesible globalmente
 */
    function addBeneficiarioForCurrentTitular() {
    console.log('🚀 Función addBeneficiarioForCurrentTitular ejecutándose...');
    
    // Obtener el ID del titular desde la variable global o desde sessionStorage
    const titularId = currentSearchedTitularId || sessionStorage.getItem('currentSearchedTitularId');
    console.log('🔍 Titular ID encontrado:', titularId);
    
    if (!titularId) {
            alert('Primero busque un titular para añadir beneficiarios.');
            return;
        }
    
    // Asegurar que la variable global esté actualizada
    currentSearchedTitularId = titularId;
    
    console.log('🔍 Verificando función showCreateBeneficiarioModal:', typeof showCreateBeneficiarioModal);
    
        // Abrir modal de beneficiario SIN cerrar resultados
        showCreateBeneficiarioModal();
    
        // Guardar en sesión el titular actual para asociar al crear
    sessionStorage.setItem('currentSearchedTitularId', titularId);
    
    console.log('✅ Proceso completado para titular:', titularId);
    }

// ========================================
// FUNCIONES GLOBALES DE GESTIÓN DE TITULARES
// ========================================

// ========================================
// FUNCIONES PARA MODAL DE ACTUALIZAR TITULAR
// ========================================

/**
 * Muestra el modal de actualizar titular
 */
function showUpdateTitularModal() {
    const updateTitularModalOverlay = document.getElementById('updateTitularModal');
    if (updateTitularModalOverlay) {
        updateTitularModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta el modal de actualizar titular
 */
function hideUpdateTitularModal() {
    const updateTitularModalOverlay = document.getElementById('updateTitularModal');
    if (updateTitularModalOverlay) {
        updateTitularModalOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

/**
 * Establece el valor del campo activo del titular en el modal de actualizar
 * @param {string} valor - 'SI' o 'NO'
 */
function setUpdateTitularActivo(valor) {
    const input = document.getElementById('uActivo');
    const toggleButtons = document.querySelectorAll('#updateTitularModal .btn-toggle');
    
    toggleButtons.forEach(btn => btn.classList.remove('active'));
    
    if (input) {
        input.value = valor;
    }
    
    if (valor === 'SI') {
        const yesButton = document.querySelector('#updateTitularModal .btn-toggle-yes');
        if (yesButton) yesButton.classList.add('active');
    } else if (valor === 'NO') {
        const noButton = document.querySelector('#updateTitularModal .btn-toggle-no');
        if (noButton) noButton.classList.add('active');
    }
}

/**
 * Establece el valor del campo beneficiario del titular en el modal de actualizar
 * @param {string} valor - 'SI' o 'NO'
 */
function setUpdateBeneficiario(valor) {
    const input = document.getElementById('uBeneficiario');
    const updateButton = document.getElementById('bActualizarTitular');
    
    // Encontrar el form-group que contiene el label con for="uBeneficiario"
    const beneficiarioLabel = document.querySelector('#updateTitularModal label[for="uBeneficiario"]');
    const beneficiarioFormGroup = beneficiarioLabel?.closest('.form-group');
    
    if (beneficiarioFormGroup) {
        // Limpiar estado activo de todos los botones toggle de beneficiario
        const beneficiarioButtons = beneficiarioFormGroup.querySelectorAll('.btn-toggle');
        beneficiarioButtons.forEach(btn => btn.classList.remove('active'));
        
        if (input) {
            input.value = valor;
        }
        
        if (valor === 'SI') {
            const yesButton = beneficiarioFormGroup.querySelector('.btn-toggle-yes');
            if (yesButton) yesButton.classList.add('active');
            if (updateButton) updateButton.textContent = 'Siguiente';
        } else if (valor === 'NO') {
            const noButton = beneficiarioFormGroup.querySelector('.btn-toggle-no');
            if (noButton) noButton.classList.add('active');
            if (updateButton) updateButton.textContent = 'Actualizar';
        }
    }
}

// ========================================
// FUNCIONES PARA MODAL DE ACTUALIZAR BENEFICIARIO
// ========================================

/**
 * Muestra el modal de actualizar beneficiario
 */
function showUpdateBeneficiarioModal() {
    const updateBeneficiarioModalOverlay = document.getElementById('updateBeneficiarioModal');
    if (updateBeneficiarioModalOverlay) {
        updateBeneficiarioModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta el modal de actualizar beneficiario
 */
function hideUpdateBeneficiarioModal() {
    const updateBeneficiarioModalOverlay = document.getElementById('updateBeneficiarioModal');
    if (updateBeneficiarioModalOverlay) {
        updateBeneficiarioModalOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

/**
 * Vuelve al modal de actualizar titular desde el modal de actualizar beneficiario
 */
function goBackToUpdateTitularForm() {
    hideUpdateBeneficiarioModal();
    // Recuperar el ID del titular desde el campo uId
    const titularId = document.getElementById('uId')?.value || document.getElementById('uId')?.getAttribute('data-original-id');
    if (titularId) {
        // Reabrir el modal de actualizar titular con los datos
        setTimeout(() => {
            editTitular(titularId);
        }, 100);
    }
}

/**
 * Función para editar un titular
 * Abre el modal de actualizar titular
 * @param {string} identificacion - Identificación del titular a editar
 */
function editTitular(identificacion) {
    console.log('Editando titular con identificación:', identificacion);
    
    // Buscar el titular en los datos existentes
    const titular = buscarTitular(identificacion);
    if (!titular) {
        alert('No se encontró el titular con identificación ' + identificacion);
        return;
    }
    
    // Llenar los campos del modal de ACTUALIZAR con los datos del titular
    document.getElementById('uTipo_Id').value = titular.tipoId || 'CC';
    document.getElementById('uId').value = titular.numeroId || '';
    document.getElementById('uApellido1').value = titular.apellido1 || '';
    document.getElementById('uApellido2').value = titular.apellido2 || '';
    document.getElementById('uNombre1').value = titular.nombre1 || '';
    document.getElementById('uNombre2').value = titular.nombre2 || '';
    document.getElementById('uDireccion').value = titular.direccion || '';
    document.getElementById('uBarrioT').value = titular.barrio || '';
    document.getElementById('uCelular').value = titular.celular || titular.telefono || '';
    document.getElementById('uCorreo').value = titular.correo || titular.email || '';
    document.getElementById('uFecha_Ingreso').value = titular.fechaIngreso || new Date().toISOString().split('T')[0];
    
    // Establecer valores de activo y beneficiario
    const activo = titular.activo || 'SI';
    const beneficiario = titular.beneficiario || 'NO';
    
    // Activar los botones toggle correctos
    if (typeof setUpdateTitularActivo === 'function') {
        setUpdateTitularActivo(activo);
    }
    
    // Establecer beneficiario (esto también manejará el texto del botón)
    if (typeof setUpdateBeneficiario === 'function') {
        setUpdateBeneficiario(beneficiario);
    }
    
    // Si tiene beneficiario, el botón debe decir "Siguiente" en lugar de "Actualizar"
    const updateButton = document.getElementById('bActualizarTitular');
    if (beneficiario === 'SI' && updateButton) {
        updateButton.textContent = 'Siguiente';
    } else if (updateButton) {
        updateButton.textContent = 'Actualizar';
    }
    
    // Guardar el ID original
    document.getElementById('uId').setAttribute('data-original-id', identificacion);
    
    // Abrir modal de ACTUALIZAR titular
    if (typeof showUpdateTitularModal === 'function') {
        showUpdateTitularModal();
    }
    
    console.log('Modal de actualizar titular abierto con datos cargados');
}

/**
 * Función para eliminar un titular
 * @param {string} identificacion - Identificación del titular a eliminar
 */
function deleteTitular(identificacion) {
    // Guardar el ID del titular a eliminar
    window.tempDeleteTitularId = identificacion;
    
    // Mostrar modal de confirmación
    showConfirmDeleteTitularModal();
}

// ========================================
// FUNCIONES GLOBALES DE GESTIÓN DE BENEFICIARIOS
// ========================================

/**
 * Función para editar un beneficiario desde el modal de actualizar titular
 * @param {string} numeroId - Número de ID del beneficiario a editar
 */
function editBeneficiarioFromUpdate(numeroId) {
    console.log('Editando beneficiario desde actualizar titular con número de ID:', numeroId);
    
    // Buscar el beneficiario en los datos existentes
    const beneficiario = buscarBeneficiario(numeroId);
    if (!beneficiario) {
        alert('No se encontró el beneficiario con identificación ' + numeroId);
        return;
    }
    
    // Llenar los campos del modal de ACTUALIZAR con los datos del beneficiario
    document.getElementById('ubTipoId').value = beneficiario.tipoId || 'CC';
    document.getElementById('ubNumeroId').value = beneficiario.numeroId;
    document.getElementById('updateBeneficiarioApellido1').value = beneficiario.apellido1 || '';
    document.getElementById('updateBeneficiarioApellido2').value = beneficiario.apellido2 || '';
    document.getElementById('updateBeneficiarioNombre1').value = beneficiario.nombre1 || '';
    document.getElementById('updateBeneficiarioNombre2').value = beneficiario.nombre2 || '';
    document.getElementById('ubDireccion').value = beneficiario.direccion || '';
    document.getElementById('ubTelefono').value = beneficiario.telefono || '';
    document.getElementById('ubEmail').value = beneficiario.email || '';
    document.getElementById('ubActivo').value = beneficiario.activo || 'SI';
    
    // Guardar el ID original
    document.getElementById('ubNumeroId').setAttribute('data-original-id', numeroId);
    
    // Cerrar modal de actualizar titular
    hideUpdateTitularModal();
    
    // Abrir modal de ACTUALIZAR beneficiario
    if (typeof showUpdateBeneficiarioModal === 'function') {
        showUpdateBeneficiarioModal();
    }
    
    console.log('Modal de actualizar beneficiario abierto con datos cargados');
}

/**
 * Función para editar un beneficiario
 * @param {string} numeroId - Número de ID del beneficiario a editar
 */
function editBeneficiario(numeroId) {
    console.log('Editando beneficiario con número de ID:', numeroId);
    
    // Buscar el beneficiario en los datos existentes
    const beneficiario = buscarBeneficiario(numeroId);
    if (!beneficiario) {
        alert('No se encontró el beneficiario con identificación ' + numeroId);
        return;
    }
    
    // PRIMERO: Establecer el atributo data-original-id ANTES de abrir el modal
    // Esto evita que showCreateBeneficiarioModal limpie el formulario
    const numeroIdField = document.getElementById('bNumeroId');
    if (numeroIdField) {
        numeroIdField.setAttribute('data-original-id', numeroId);
    }
    
    // SEGUNDO: Cambiar el título y texto del botón ANTES de llenar los campos
    const modalTitle = document.querySelector('#createBeneficiarioModal .modal-title');
    const createButton = document.getElementById('bCrearBeneficiario');
    
    if (modalTitle) {
        modalTitle.textContent = 'ACTUALIZAR BENEFICIARIO';
    }
    
    if (createButton) {
        createButton.textContent = 'Actualizar';
    }
    
    // TERCERO: Llenar los campos con los datos del beneficiario
    document.getElementById('bTipoId').value = beneficiario.tipoId || 'CC';
    document.getElementById('bNumeroId').value = beneficiario.numeroId;
    document.getElementById('beneficiarioApellido1').value = beneficiario.apellido1 || '';
    document.getElementById('beneficiarioApellido2').value = beneficiario.apellido2 || '';
    document.getElementById('beneficiarioNombre1').value = beneficiario.nombre1 || '';
    document.getElementById('beneficiarioNombre2').value = beneficiario.nombre2 || '';
    document.getElementById('bDireccion').value = beneficiario.direccion || '';
    document.getElementById('bTelefono').value = beneficiario.telefono || '';
    document.getElementById('bEmail').value = beneficiario.email || '';
    document.getElementById('bActivo').value = beneficiario.activo || 'SI';
    
    // CUARTO: Abrir modal de crear/actualizar
    // showCreateBeneficiarioModal detectará el data-original-id y NO limpiará el formulario
    if (typeof showCreateBeneficiarioModal === 'function') {
        showCreateBeneficiarioModal();
    }
    
    console.log('Modal de editar beneficiario abierto con datos cargados');
}

/**
 * Función para eliminar un beneficiario
 * @param {string} numeroId - Número de ID del beneficiario a eliminar
 */
// Eliminar de beneficiarios ya no está disponible; se gestiona por toggle de estado

// ========================================
// FUNCIONES GLOBALES PARA TOGGLE DE BENEFICIARIOS
// ========================================

/**
 * Función para establecer el valor del campo beneficiario
 * @param {string} valor - 'SI' o 'NO'
 */
function setBeneficiario(valor) {
    const hiddenInput = document.getElementById('cBeneficiario');
    const createButton = document.getElementById('bCrear');
    
    // Establecer valor en el input hidden
    if (hiddenInput) {
        hiddenInput.value = valor;
    }
    
    // Activar el botón correspondiente - buscar específicamente los botones de beneficiario
    // Buscar el contenedor que contiene el input cBeneficiario
    const beneficiarioInput = document.getElementById('cBeneficiario');
    const toggleContainer = beneficiarioInput ? beneficiarioInput.closest('.form-group').querySelector('.toggle-buttons') : null;
    const yesButton = toggleContainer ? toggleContainer.querySelector('.btn-toggle-yes') : null;
    const noButton = toggleContainer ? toggleContainer.querySelector('.btn-toggle-no') : null;
    
    if (yesButton && noButton) {
        if (valor === 'SI') {
            yesButton.classList.add('active');
            noButton.classList.remove('active');
            // Cambiar texto del botón a "Siguiente" solo si no está en modo actualizar
            // O si está en modo actualizar, también cambiar a "Siguiente" para poder ver beneficiarios
            if (createButton) {
                const isUpdate = createButton.textContent === 'Actualizar' || 
                                document.getElementById('createTitularTitle').textContent === 'ACTUALIZAR TITULAR';
                if (!isUpdate) {
                    createButton.textContent = 'Siguiente';
                } else {
                    // En modo actualizar, si tiene beneficiario, mostrar "Siguiente" para ver beneficiarios
                    createButton.textContent = 'Siguiente';
                }
            }
        } else if (valor === 'NO') {
            yesButton.classList.remove('active');
            noButton.classList.add('active');
            // Cambiar texto del botón a "Crear" o "Actualizar" según el modo
            if (createButton) {
                const isUpdate = createButton.textContent === 'Actualizar' || 
                                document.getElementById('createTitularTitle').textContent === 'ACTUALIZAR TITULAR';
                if (isUpdate) {
                    createButton.textContent = 'Actualizar';
                } else {
                    createButton.textContent = 'Crear';
                }
            }
        }
    }
}

/**
 * Función para establecer el valor del campo activo del titular
 * @param {string} valor - 'SI' o 'NO'
 */
function setTitularActivo(valor) {
    const hiddenInput = document.getElementById('cActivo');
    const yesButton = document.querySelector('#createTitularModal .btn-toggle-yes');
    const noButton = document.querySelector('#createTitularModal .btn-toggle-no');
    
    if (hiddenInput) {
        hiddenInput.value = valor;
    }
    
    if (yesButton && noButton) {
        if (valor === 'SI') {
            yesButton.classList.add('active');
            noButton.classList.remove('active');
        } else {
            yesButton.classList.remove('active');
            noButton.classList.add('active');
        }
    }
}

/**
 * Función para establecer el valor del campo activo del beneficiario
 * @param {string} valor - 'SI' o 'NO'
 */
function setBeneficiarioActivo(valor) {
    const input = document.getElementById('bActivo');
    const toggleButtons = document.querySelectorAll('#createBeneficiarioModal .btn-toggle');
    
    // Limpiar estado activo de todos los botones en el modal de beneficiario
    toggleButtons.forEach(btn => btn.classList.remove('active'));
    
    // Establecer valor en el input
    input.value = valor;
    
    // Activar el botón correspondiente
    if (valor === 'SI') {
        const yesButton = document.querySelector('#createBeneficiarioModal .btn-toggle-yes');
        if (yesButton) {
            yesButton.classList.add('active');
        }
    } else if (valor === 'NO') {
        const noButton = document.querySelector('#createBeneficiarioModal .btn-toggle-no');
        if (noButton) {
            noButton.classList.add('active');
        }
    }
}

/**
 * Función para establecer la fecha actual en el campo fecha
 */
function setFechaActual() {
    const fechaInput = document.getElementById('tFecha_Ingreso');
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.value = hoy;
}

 // Inicializar fecha actual cuando se carga la página
 document.addEventListener('DOMContentLoaded', function() {
     setFechaActual();
 });
 
 // ========================================
 // FUNCIONES DE BÚSQUEDA DE TITULARES
 // ========================================
 
   /**
   * Función para buscar un titular por ID
   * @param {string} titularId - ID del titular a buscar
   * @returns {Object|null} - Objeto del titular encontrado o null si no se encuentra
   */
  function buscarTitular(titularId) {
      // Primero buscar en los datos en memoria
      if (titularesData[titularId]) {
          return titularesData[titularId];
      }
      
      // Buscar en la tabla de titulares existente
      const tableBody = document.getElementById('titularesTableBody');
      const rows = tableBody.querySelectorAll('tr');
      
      // Buscar en cada fila de la tabla (nuevo orden de columnas)
      for (let row of rows) {
          const cells = row.querySelectorAll('td');
          
          // Verificar que la fila tenga datos (no sea el mensaje de "no data")
          if (cells.length >= 8 && !row.querySelector('.no-data-message')) {
              // Columnas: 0 TipoID, 1 Identificación, 2 Nombre, 3 Dirección, 4 Barrio, 5 Celular, 6 Correo, 7 Opciones
              const numeroId = cells[1].textContent.trim();
              
              if (numeroId === titularId) {
                  // Encontró el titular, crear objeto con los datos
                  const titular = {
                      tipoId: cells[0].textContent.trim(),
                      numeroId: cells[1].textContent.trim(),
                      nombre: cells[2].textContent.trim(),
                      direccion: cells[3].textContent.trim(),
                      barrio: cells[4].textContent.trim(),
                      celular: cells[5].textContent.trim(),
                      correo: cells[6].textContent.trim(),
                      activo: 'Si'
                  };
                  
                  return titular;
              }
          }
      }
      
      // Si no se encuentra en la tabla, buscar en datos de ejemplo (para casos de prueba)
      const titularesEjemplo = [
          {
              numeroId: '1028562326',
              nombre: 'JULIAN GIRALDO',
              activo: 'Si',
              direccion: 'LA CASTELLANA',
              telefono: '87654321',
              email: 'golden@inglesefe'
          },
          {
              numeroId: '1234567890',
              nombre: 'MARIA GONZALEZ',
              activo: 'No',
              direccion: 'CALLE 123',
              telefono: '987654321',
              email: 'maria@ejemplo.com'
          }
      ];
      
      // Buscar el titular por ID en los datos de ejemplo
      const titularEncontrado = titularesEjemplo.find(titular => titular.numeroId === titularId);
      
      return titularEncontrado || null;
  }
 
   /**
   * Función para mostrar los resultados de búsqueda
   * @param {Object} titular - Objeto del titular encontrado
   */
  function mostrarResultadosBusqueda(titular) {
      // Mostrar la sección de resultados dentro del modal
      const searchResultsContainer = document.getElementById('searchResultsContainer');
      searchResultsContainer.style.display = 'block';
      
      // Obtener el tbody de la tabla de resultados
      const tableBody = document.getElementById('searchResultsTableBody');
      
      // Limpiar tabla anterior
      tableBody.innerHTML = '';
      
      // Crear nueva fila con los datos del titular encontrado
      // Concatenar nombre completo
      const nombreCompleto = [
          titular.apellido1 || '',
          titular.apellido2 || '',
          titular.nombre1 || '',
          titular.nombre2 || ''
      ].filter(nombre => nombre.trim() !== '').join(' ');

      const newRow = document.createElement('tr');
      newRow.innerHTML = `
          <td>${titular.numeroId}</td>
          <td>${nombreCompleto}</td>
          <td>${titular.activo}</td>
          <td>${titular.direccion}</td>
          <td>${titular.telefono}</td>
          <td>${titular.email}</td>
          <td>
              <div class="options-inline" style="display:flex; align-items:center; gap:12px;">
                  <button class="btn btn-small" onclick="editTitular('${titular.numeroId}')">
                      <i class="fas fa-edit"></i>
                  </button>
                  <label class="animated-toggle" data-id="${titular.numeroId}" title="${isActive ? 'Desactivar' : 'Activar'}" style="display:inline-flex;" for="toggleTitularSearch_${titular.numeroId}">
                      <input type="checkbox" id="toggleTitularSearch_${titular.numeroId}" name="toggleTitularSearch_${titular.numeroId}" ${isActive ? 'checked' : ''} onchange="toggleTitularState('${titular.numeroId}')">
                      <span class="toggle-slider"></span>
                  </label>
              </div>
          </td>
      `;
      
      tableBody.appendChild(newRow);
      
      // Agregar efectos hover a la nueva fila
      newRow.addEventListener('mouseenter', function() {
          this.style.backgroundColor = '#f8f9fa';
      });
      
      newRow.addEventListener('mouseleave', function() {
          this.style.backgroundColor = '';
      });
      
      // Hacer scroll hacia los resultados dentro del modal
      searchResultsContainer.scrollIntoView({ behavior: 'smooth' });
  }

  // Renderizar beneficiarios asociados al titular en el modal de resultados
  function renderBeneficiariosDeTitular(titularId) {
      console.log('🎨 Renderizando beneficiarios para titular:', titularId);
      
      const body = document.getElementById('titularBeneficiariosResultsBody');
      if (!body) {
          console.log('❌ No se encontró el elemento titularBeneficiariosResultsBody');
          return;
      }
      
      body.innerHTML = '';
      const lista = titularIdToBeneficiarios[titularId] || [];
      
      console.log('📋 Lista de beneficiarios encontrada:', lista);
      console.log('📊 Cantidad de beneficiarios:', lista.length);
      
      if (lista.length === 0) {
          body.innerHTML = `
              <tr>
                  <td colspan="8" class="no-data-message">
                      <div class="no-data-content">
                          <i class="fas fa-user-friends"></i>
                          <p>Este titular no tiene beneficiarios</p>
                      </div>
                  </td>
              </tr>`;
          return;
      }
      
      lista.forEach(b => {
          // Concatenar nombre completo del beneficiario
          const nombreCompleto = [
              b.apellido1 || '',
              b.apellido2 || '',
              b.nombre1 || '',
              b.nombre2 || ''
          ].filter(nombre => nombre.trim() !== '').join(' ');
          
          const tr = document.createElement('tr');
          tr.innerHTML = `
              <td>${b.tipoId || 'CC'}</td>
              <td>${b.numeroId}</td>
              <td>${nombreCompleto}</td>
              <td>${b.direccion}</td>
              <td>${b.telefono}</td>
              <td>${b.email}</td>
              <td>${String(b.activo || '').toUpperCase()}</td>
              <td>
                  <button class="btn btn-small" onclick="editBeneficiario('${b.numeroId}')">
                      <i class="fas fa-edit"></i>
                  </button>
              </td>
          `;
          
          // Agregar efectos hover a la nueva fila
          tr.addEventListener('mouseenter', function() {
              this.style.backgroundColor = '#f8f9fa';
          });
          
          tr.addEventListener('mouseleave', function() {
              this.style.backgroundColor = '';
          });
          
          body.appendChild(tr);
      });
      
      console.log('✅ Beneficiarios renderizados exitosamente en la tabla');
  }
  
  /**
   * Función específica para refrescar la tabla de beneficiarios en el modal de resultados
   */
  function refreshBeneficiariosInTitularResults() {
      const titularModal = document.getElementById('titularResultsModal');
      if (titularModal && titularModal.classList.contains('show')) {
          const currentTitularId = sessionStorage.getItem('currentSearchedTitularId');
          if (currentTitularId) {
              console.log('🔄 Refrescando beneficiarios en modal de resultados de titular:', currentTitularId);
              renderBeneficiariosDeTitular(currentTitularId);
          }
      }
  }
  
  // ========================================
  // FUNCIONES DE RENDERIZADO Y BÚSQUEDA
  // ========================================
  
  /**
   * Función para renderizar resultados de búsqueda de titular
   * @param {Object} titular - Objeto del titular encontrado o null
   */
  function renderTitularSearchResults(titular) {
      const body = document.getElementById('searchResultsTableBody');
      if (!body) return;
      body.innerHTML = '';
      if (!titular) {
          body.innerHTML = `
              <tr>
                  <td colspan="7" class="no-data-message">
                      <div class="no-data-content">
                          <i class="fas fa-search"></i>
                          <p>No se encontraron resultados</p>
                          <small>Intente con otro ID de titular</small>
                      </div>
                  </td>
              </tr>`;
          return;
      }
      // Concatenar nombre completo
      const nombreCompleto = [
          titular.apellido1 || '',
          titular.apellido2 || '',
          titular.nombre1 || '',
          titular.nombre2 || ''
      ].filter(nombre => nombre.trim() !== '').join(' ');

      const row = document.createElement('tr');
      const isActive = (String(titular.activo || 'SI').toUpperCase() === 'SI');
      row.innerHTML = `
          <td>${titular.numeroId}</td>
          <td>${nombreCompleto}</td>
          <td><span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'ACTIVO' : 'INACTIVO'}</span></td>
          <td>${titular.direccion}</td>
          <td>${titular.celular || ''}</td>
          <td>${titular.correo || ''}</td>
          <td>
              <button class="btn btn-small" onclick="editTitular('${titular.numeroId}')">
                  <i class="fas fa-edit"></i>
              </button>
              <label class="animated-toggle" data-id="${titular.numeroId}" title="${isActive ? 'Desactivar' : 'Activar'}" for="toggleTitularRender_${titular.numeroId}">
                  <input type="checkbox" id="toggleTitularRender_${titular.numeroId}" name="toggleTitularRender_${titular.numeroId}" ${isActive ? 'checked' : ''} onchange="toggleTitularState('${titular.numeroId}')">
                  <span class="toggle-slider"></span>
              </label>
          </td>`;
      body.appendChild(row);

      // Guardar ID actual y renderizar beneficiarios asociados
          currentSearchedTitularId = titular.numeroId;
      sessionStorage.setItem('currentSearchedTitularId', titular.numeroId);
      
      console.log('Titular encontrado, ID guardado:', titular.numeroId);
      
      if (typeof renderBeneficiariosDeTitular === 'function') {
          renderBeneficiariosDeTitular(titular.numeroId);
      }
  }

  // ========================================
  // TOGGLE ACTIVAR/DESACTIVAR TITULAR
  // ========================================

  function toggleTitularState(numeroId) {
      const titular = titularesData[numeroId];
      if (!titular) return;
      const estadoOriginal = (String(titular.activo || 'SI').toUpperCase() === 'SI');
      // Cambiar en memoria usando SI/NO
      titular.activo = estadoOriginal ? 'NO' : 'SI';
      // Actualizar UI en tabla principal
      const tableBody = document.getElementById('titularesTableBody');
      if (tableBody) {
          const rows = tableBody.querySelectorAll('tr');
          for (let row of rows) {
              const cells = row.querySelectorAll('td');
              if (cells && cells[1] && cells[1].textContent.trim() === String(numeroId)) {
                  const badge = row.querySelector('span.badge');
                  const toggleEl = row.querySelector('.animated-toggle');
                  const toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
                  const isActive = (String(titular.activo).toUpperCase() === 'SI');
                  if (badge) {
                      badge.className = `badge ${isActive ? 'badge-success' : 'badge-secondary'}`;
                      badge.textContent = isActive ? 'ACTIVO' : 'INACTIVO';
                  }
                  if (toggleEl && toggleInput) {
                      toggleInput.checked = isActive;
                      toggleEl.title = isActive ? 'Desactivar' : 'Activar';
                  }
                  break;
              }
          }
      }
      // Actualizar UI en resultados de búsqueda si abiertos
      const body = document.getElementById('searchResultsTableBody');
      if (body) {
          const rows = body.querySelectorAll('tr');
          rows.forEach(r => {
              const firstCell = r.querySelector('td');
              if (firstCell && firstCell.textContent.trim() === String(numeroId)) {
                  const badge = r.querySelector('span.badge');
                  const toggleEl = r.querySelector('.animated-toggle');
                  const toggleInput = r.querySelector('.animated-toggle input[type="checkbox"]');
              const isActive = (String(titular.activo).toUpperCase() === 'SI');
                  if (badge) {
                      badge.className = `badge ${isActive ? 'badge-success' : 'badge-secondary'}`;
                  badge.textContent = isActive ? 'ACTIVO' : 'INACTIVO';
                  }
                  if (toggleEl && toggleInput) {
                      toggleInput.checked = isActive;
                      toggleEl.title = isActive ? 'Desactivar' : 'Activar';
                  }
              }
          });
      }
      // Mostrar confirmación
      showConfirmToggleTitularModal(numeroId, estadoOriginal);
  }

  function showConfirmToggleTitularModal(numeroId, estadoOriginal) {
      window.tempToggleTitularId = numeroId;
      window.tempToggleTitularPrev = estadoOriginal;
      const modal = document.getElementById('confirmToggleTitularModal');
      const titular = titularesData[numeroId];
      if (modal && titular) {
          const actionText = estadoOriginal ? 'desactivar' : 'activar';
          const titleElement = modal.querySelector('.modal-title');
          const messageElement = modal.querySelector('.modal-message');
          if (titleElement) titleElement.textContent = `${actionText.toUpperCase()} TITULAR`;
          if (messageElement) messageElement.textContent = `¿Está seguro de que desea ${actionText} el titular ${titular.numeroId}?`;
          modal.classList.add('show');
          document.body.style.overflow = 'hidden';
      }
  }

  // ========================================
  // TOGGLE ACTIVAR/DESACTIVAR BENEFICIARIO
  // ========================================

  function toggleBeneficiarioState(numeroId) {
      const beneficiario = beneficiariosData[numeroId];
      if (!beneficiario) return;
      const estadoOriginal = (String(beneficiario.activo || 'SI').toUpperCase() === 'SI');
      // Cambiar en memoria usando SI/NO
      beneficiario.activo = estadoOriginal ? 'NO' : 'SI';
      
      // Actualizar UI en tabla de beneficiarios
      const tableBody = document.getElementById('beneficiariosTableBody');
      if (tableBody) {
          const rows = tableBody.querySelectorAll('tr');
          for (let row of rows) {
              const cells = row.querySelectorAll('td');
              if (cells && cells[0] && cells[0].textContent.trim() === String(numeroId)) {
                  const badge = row.querySelector('span.badge');
                  const toggleEl = row.querySelector('.animated-toggle');
                  const toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
                  const isActive = (String(beneficiario.activo).toUpperCase() === 'SI');
                  if (badge) {
                      badge.className = `badge ${isActive ? 'badge-success' : 'badge-secondary'}`;
                      badge.textContent = isActive ? 'ACTIVO' : 'INACTIVO';
                  }
                  if (toggleEl && toggleInput) {
                      toggleInput.checked = isActive;
                      toggleEl.title = isActive ? 'Desactivar' : 'Activar';
                  }
                  break;
              }
          }
      }
      
      // Actualizar UI en resultados de búsqueda si abiertos
      const body = document.getElementById('searchResultsTableBody');
      if (body) {
          const rows = body.querySelectorAll('tr');
          rows.forEach(r => {
              const firstCell = r.querySelector('td');
              if (firstCell && firstCell.textContent.trim() === String(numeroId)) {
                  const badge = r.querySelector('span.badge');
                  const toggleEl = r.querySelector('.animated-toggle');
                  const toggleInput = r.querySelector('.animated-toggle input[type="checkbox"]');
                  const isActive = (String(beneficiario.activo).toUpperCase() === 'SI');
                  if (badge) {
                      badge.className = `badge ${isActive ? 'badge-success' : 'badge-secondary'}`;
                      badge.textContent = isActive ? 'ACTIVO' : 'INACTIVO';
                  }
                  if (toggleEl && toggleInput) {
                      toggleInput.checked = isActive;
                      toggleEl.title = isActive ? 'Desactivar' : 'Activar';
                  }
              }
          });
      }
      
      // Persistir cambios en localStorage
      try { 
          localStorage.setItem('beneficiariosData', JSON.stringify(beneficiariosData)); 
      } catch (e) {
          console.error('Error guardando cambios de beneficiario:', e);
      }
      
      // Mostrar confirmación
      showConfirmToggleBeneficiarioModal(numeroId, estadoOriginal);
  }

  function showConfirmToggleBeneficiarioModal(numeroId, estadoOriginal) {
      window.tempToggleBeneficiarioId = numeroId;
      window.tempToggleBeneficiarioPrev = estadoOriginal;
      const modal = document.getElementById('confirmToggleBeneficiarioModal');
      const beneficiario = beneficiariosData[numeroId];
      if (modal && beneficiario) {
          const actionText = estadoOriginal ? 'desactivar' : 'activar';
          const titleElement = modal.querySelector('.modal-title');
          const messageElement = modal.querySelector('.modal-message');
          if (titleElement) titleElement.textContent = `${actionText.toUpperCase()} BENEFICIARIO`;
          if (messageElement) messageElement.textContent = `¿Está seguro de que desea ${actionText} el beneficiario ${beneficiario.numeroId}?`;
          modal.classList.add('show');
          document.body.style.overflow = 'hidden';
      }
  }

  function cancelToggleBeneficiario() {
      const numeroId = window.tempToggleBeneficiarioId;
      const prev = window.tempToggleBeneficiarioPrev;
      if (numeroId != null) {
          const beneficiario = beneficiariosData[numeroId];
          if (beneficiario) {
              beneficiario.activo = prev ? 'SI' : 'NO';
              // Revertir UI reutilizando la función de toggle para actualizar visual (sin cambiar estado de nuevo)
              const estadoOriginal = (String(beneficiario.activo || 'SI').toUpperCase() === 'SI');
              beneficiario.activo = estadoOriginal ? 'NO' : 'SI';
              toggleBeneficiarioState(numeroId);
              beneficiario.activo = prev ? 'SI' : 'NO';
          }
      }
      const modal = document.getElementById('confirmToggleBeneficiarioModal');
      if (modal) {
          modal.classList.remove('show');
          document.body.style.overflow = '';
      }
  }

  function confirmToggleBeneficiario() {
      const numeroId = window.tempToggleBeneficiarioId;
      if (numeroId != null) {
          const beneficiario = beneficiariosData[numeroId];
          if (beneficiario) {
              // El estado ya fue cambiado en toggleBeneficiarioState, solo confirmamos
              console.log(`Beneficiario ${numeroId} ${beneficiario.activo === 'SI' ? 'activado' : 'desactivado'} correctamente`);
          }
      }
      const modal = document.getElementById('confirmToggleBeneficiarioModal');
      if (modal) {
          modal.classList.remove('show');
          document.body.style.overflow = '';
      }
      // Mostrar modal de éxito
      showSuccessToggleBeneficiarioModal();
  }

  function showSuccessToggleBeneficiarioModal() {
      const modal = document.getElementById('successToggleBeneficiarioModal');
      if (modal) {
          modal.classList.add('show');
          document.body.style.overflow = 'hidden';
      }
  }

  function closeSuccessToggleBeneficiarioModal() {
      const modal = document.getElementById('successToggleBeneficiarioModal');
      if (modal) {
          modal.classList.remove('show');
          document.body.style.overflow = '';
      }
  }

  function cancelToggleTitular() {
      const numeroId = window.tempToggleTitularId;
      const prev = window.tempToggleTitularPrev;
      if (numeroId != null) {
          const titular = titularesData[numeroId];
          if (titular) {
              titular.activo = prev ? 'SI' : 'NO';
              // Revertir UI reutilizando la función de toggle para actualizar visual (sin cambiar estado de nuevo)
              const isActive = (String(titular.activo).toUpperCase() === 'SI');
              const tableBody = document.getElementById('titularesTableBody');
              if (tableBody) {
                  const rows = tableBody.querySelectorAll('tr');
                  for (let row of rows) {
                      const cells = row.querySelectorAll('td');
                      if (cells && cells[1] && cells[1].textContent.trim() === String(numeroId)) {
                          const badge = row.querySelector('span.badge');
                          const toggleEl = row.querySelector('.animated-toggle');
                          const toggleInput = row.querySelector('.animated-toggle input[type="checkbox"]');
                          if (badge) {
                              badge.className = `badge ${isActive ? 'badge-success' : 'badge-secondary'}`;
                              badge.textContent = isActive ? 'ACTIVO' : 'INACTIVO';
                          }
                          if (toggleEl && toggleInput) {
                              toggleInput.checked = isActive;
                              toggleEl.title = isActive ? 'Desactivar' : 'Activar';
                          }
                          break;
                      }
                  }
              }
          }
      }
      const modal = document.getElementById('confirmToggleTitularModal');
      if (modal) { modal.classList.remove('show'); document.body.style.overflow = 'auto'; }
      window.tempToggleTitularId = null;
      window.tempToggleTitularPrev = null;
  }

  function confirmToggleTitular() {
      const numeroId = window.tempToggleTitularId;
      if (numeroId != null) {
          const titular = titularesData[numeroId];
          if (titular) {
              const city = getSelectedCityCode();
              if (!titularesByCity[city]) titularesByCity[city] = {};
              const toSave = { ...titular, ciudad: city };
              titularesByCity[city][numeroId] = toSave;
              persistTitularesByCity();
              const confirmModal = document.getElementById('confirmToggleTitularModal');
              if (confirmModal) confirmModal.classList.remove('show');
              showSuccessToggleTitularModal(numeroId);
          }
      }
      window.tempToggleTitularId = null;
      window.tempToggleTitularPrev = null;
  }

  function showSuccessToggleTitularModal(numeroId) {
      const modal = document.getElementById('successToggleTitularModal');
      const titular = titularesData[numeroId];
      if (modal && titular) {
          const messageElement = modal.querySelector('.modal-message');
          if (messageElement) {
              const estado = (String(titular.activo).toUpperCase() === 'SI') ? 'activado' : 'desactivado';
              messageElement.textContent = `El titular ${titular.numeroId} ha sido ${estado} exitosamente.`;
          }
          modal.classList.add('show');
          document.body.style.overflow = 'hidden';
      }
  }

  function closeSuccessToggleTitularModal() {
      const modal = document.getElementById('successToggleTitularModal');
      if (modal) { modal.classList.remove('show'); document.body.style.overflow = 'auto'; }
  }
  
  /**
   * Función para buscar beneficiario por ID
   * @param {string} beneficiarioId - ID del beneficiario a buscar
   * @returns {Object|null} - Objeto del beneficiario encontrado o null
   */
  function buscarBeneficiario(beneficiarioId) {
      // Buscar primero en los datos principales
      if (beneficiariosData[beneficiarioId]) {
          return beneficiariosData[beneficiarioId];
      }
      
      // Si no se encuentra, buscar en los beneficiarios asociados a titulares
      for (const titularId in titularIdToBeneficiarios) {
          const beneficiarios = titularIdToBeneficiarios[titularId];
          const beneficiario = beneficiarios.find(b => b.numeroId === beneficiarioId);
          if (beneficiario) {
              return beneficiario;
          }
      }
      
      return null;
  }
  
  /**
   * Función para renderizar resultados de búsqueda de beneficiario
   * @param {Object} beneficiario - Objeto del beneficiario encontrado o null
   */
  function renderBeneficiarioSearchResults(beneficiario, titular) {
      const body = document.getElementById('beneficiarioSearchResultsBody');
      if (!body) return;
      body.innerHTML = '';
      
      if (!beneficiario) {
          body.innerHTML = `
              <tr>
                  <td colspan="8" class="no-data-message">
                      <div class="no-data-content">
                          <i class="fas fa-search"></i>
                          <p>No se encontraron resultados</p>
                          <small>Intente con otro ID de beneficiario</small>
                      </div>
                  </td>
              </tr>`;
          return;
      }
      
      // Mostrar datos del beneficiario
      const beneficiarioRow = document.createElement('tr');
      beneficiarioRow.innerHTML = `
          <td colspan="8" style="background-color: #f8f9fa; font-weight: bold; text-align: center;">
              DATOS DEL BENEFICIARIO
          </td>
      `;
      body.appendChild(beneficiarioRow);
      
      const beneficiarioDataRow = document.createElement('tr');
      // Concatenar nombre completo del beneficiario
      const beneficiarioNombreCompleto = [
          beneficiario.apellido1 || '',
          beneficiario.apellido2 || '',
          beneficiario.nombre1 || '',
          beneficiario.nombre2 || ''
      ].filter(nombre => nombre.trim() !== '').join(' ');
      
      beneficiarioDataRow.innerHTML = `
          <td>${beneficiario.tipoId || ''}</td>
          <td>${beneficiario.numeroId}</td>
          <td>${beneficiarioNombreCompleto}</td>
          <td>${beneficiario.direccion || ''}</td>
          <td>${beneficiario.telefono || ''}</td>
          <td>${beneficiario.email || ''}</td>
          <td>${beneficiario.activo || ''}</td>
          <td>
              <button class="btn btn-small" onclick="editBeneficiario('${beneficiario.numeroId}')">
                  <i class="fas fa-edit"></i>
              </button>
              <label class="animated-toggle" data-id="${beneficiario.numeroId}" title="${(String(beneficiario.activo||'SI').toUpperCase()==='SI') ? 'Desactivar' : 'Activar'}" for="toggleBeneficiario_${beneficiario.numeroId}">
                  <input type="checkbox" id="toggleBeneficiario_${beneficiario.numeroId}" name="toggleBeneficiario_${beneficiario.numeroId}" ${(String(beneficiario.activo||'SI').toUpperCase()==='SI') ? 'checked' : ''} onchange="toggleBeneficiarioState('${beneficiario.numeroId}')">
                  <span class="toggle-slider"></span>
              </label>
          </td>
      `;
      body.appendChild(beneficiarioDataRow);
      
      // Mostrar datos del titular si existe
      if (titular) {
          const titularRow = document.createElement('tr');
          titularRow.innerHTML = `
              <td colspan="8" style="background-color: #e9ecef; font-weight: bold; text-align: center;">
                  DATOS DEL TITULAR
              </td>
          `;
          body.appendChild(titularRow);
          
          const titularDataRow = document.createElement('tr');
          titularDataRow.innerHTML = `
              <td>${titular.tipoId || ''}</td>
              <td>${titular.numeroId}</td>
              <td>${titular.apellido1 || ''} ${titular.apellido2 || ''} ${titular.nombre1 || ''} ${titular.nombre2 || ''}</td>
              <td>${titular.direccion || ''}</td>
              <td>${titular.celular || ''}</td>
              <td>${titular.correo || ''}</td>
              <td>${titular.activo || ''}</td>
              <td>
                  <button class="btn btn-small" onclick="editTitular('${titular.numeroId}')">
                      <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-small btn-danger" onclick="deleteTitular('${titular.numeroId}')">
                      <i class="fas fa-trash"></i>
                  </button>
              </td>
          `;
          body.appendChild(titularDataRow);
      }
  }

// ========================================
// DATOS EN MEMORIA
// ========================================

/**
 * Almacén persistente por ciudad para titulares
 * Estructura: { [codigoCiudad]: { [numeroId]: { datosDelTitular, ciudad } } }
 */
const titularesByCity = (function(){
    try {
        const raw = localStorage.getItem('titularesByCity');
        return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
})();

/**
 * Almacén persistente por ciudad para beneficiarios
 * Estructura: { [codigoCiudad]: { [numeroId]: { datosDelBeneficiario, ciudad } } }
 */
const beneficiariosByCity = (function(){
    try {
        const raw = localStorage.getItem('beneficiariosByCity');
        return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
})();

function persistTitularesByCity() {
    try { localStorage.setItem('titularesByCity', JSON.stringify(titularesByCity)); } catch (e) {}
}

function persistBeneficiariosByCity() {
    try { localStorage.setItem('beneficiariosByCity', JSON.stringify(beneficiariosByCity)); } catch (e) {}
}

function getSelectedCityCode() {
    try { return sessionStorage.getItem('selectedCity') || ''; } catch (e) { return ''; }
}

function loadTitularesForSelectedCity() {
    // [BACKEND] Punto de integración (Listar titulares por ciudad):
    // Reemplazar la carga desde buckets/localStorage por consulta al backend
    // y luego refrescar la tabla/UI con la respuesta.
    // Volcar buckets de la ciudad actual a memoria (vista)
    const city = getSelectedCityCode();
    const titularesBucket = (titularesByCity && titularesByCity[city]) ? titularesByCity[city] : {};
    const beneficiariosBucket = (beneficiariosByCity && beneficiariosByCity[city]) ? beneficiariosByCity[city] : {};
    
    // Limpiar estructuras en memoria
    try {
        Object.keys(titularesData).forEach(k => delete titularesData[k]);
        Object.keys(beneficiariosData).forEach(k => delete beneficiariosData[k]);
        Object.keys(titularIdToBeneficiarios).forEach(k => delete titularIdToBeneficiarios[k]);
    } catch (e) {}
    
    // Rellenar en memoria
    Object.keys(titularesBucket).forEach(id => { titularesData[id] = titularesBucket[id]; });
    Object.keys(beneficiariosBucket).forEach(id => { beneficiariosData[id] = beneficiariosBucket[id]; });
    
    // Reconstruir relaciones titular-beneficiario
    Object.values(beneficiariosData).forEach(benef => {
        if (benef.titularId) {
            if (!titularIdToBeneficiarios[benef.titularId]) {
                titularIdToBeneficiarios[benef.titularId] = [];
            }
            titularIdToBeneficiarios[benef.titularId].push(benef);
        }
    });
    
    // Reconstruir tabla de titulares
    try {
        const tableBody = document.getElementById('titularesTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-user-tie"></i>
                            <p>No existen registros de titulares</p>
                            <small>Haz clic en "Crear Titular" para crear el primer registro</small>
                        </div>
                    </td>
                </tr>`;
            
            Object.values(titularesData)
                .sort((a,b)=>String(a.numeroId).localeCompare(String(b.numeroId)))
                .forEach(t => addTitularToTable(t, true));
        }
    } catch (e) {}
    
    // Reconstruir tabla de beneficiarios
    try {
        const beneficiariosTableBody = document.getElementById('beneficiariosTableBody');
        if (beneficiariosTableBody) {
            beneficiariosTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-user-friends"></i>
                            <p>No existen registros de beneficiarios</p>
                            <small>Busque un titular para ver sus beneficiarios o crear nuevos</small>
                        </div>
                    </td>
                </tr>`;
            
            // Cargar todos los beneficiarios en la tabla principal
            Object.values(beneficiariosData)
                .sort((a,b)=>String(a.numeroId).localeCompare(String(b.numeroId)))
                .forEach(b => {
                    if (typeof addBeneficiarioToTable === 'function') {
                        addBeneficiarioToTable(b);
                    }
                });
        }
    } catch (e) {
        console.error('Error cargando beneficiarios en tabla:', e);
    }
}

// Datos de ejemplo para probar la búsqueda
const titularEjemplo = {
    tipoId: 'CC',
    numeroId: '12345678',
    apellido1: 'García',
    apellido2: 'López',
    nombre1: 'Juan',
    nombre2: 'Carlos',
    direccion: 'Calle 123 #45-67',
    barrio: 'Centro',
    celular: '3001234567',
    correo: 'juan.garcia@email.com',
    fechaIngreso: '2024-01-15',
    activo: 'SI',
    beneficiario: 'NO'
};

const beneficiarioEjemplo = {
    tipoId: 'CC',
    numeroId: '87654321',
    apellido1: 'García',
    apellido2: 'López',
    nombre1: 'María',
    nombre2: 'Elena',
    direccion: 'Calle 123 #45-67',
    telefono: '3007654321',
    email: 'maria.garcia@email.com',
    activo: 'SI'
};

// Agregar datos de ejemplo
titularesData['12345678'] = titularEjemplo;
beneficiariosData['87654321'] = beneficiarioEjemplo;
titularIdToBeneficiarios['12345678'] = [beneficiarioEjemplo];

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Función para eliminar un titular de los datos en memoria
 * @param {string} identificacion - Identificación del titular a eliminar
 */
function deleteTitularFromData(identificacion) {
    delete titularesData[identificacion];
    
    // Persistir cambios en localStorage
    try { localStorage.setItem('titularesData', JSON.stringify(titularesData)); } catch (e) {}
}

/**
 * Función para eliminar un beneficiario de los datos en memoria
 * @param {string} numeroId - Número de ID del beneficiario a eliminar
 */
function deleteBeneficiarioFromData(numeroId) {
    delete beneficiariosData[numeroId];
    
    // Persistir cambios en localStorage
    try { localStorage.setItem('beneficiariosData', JSON.stringify(beneficiariosData)); } catch (e) {}
}

    // ========================================
    // EVENT LISTENERS ESPECÍFICOS
    // ========================================
    
    // Event listener para botones de editar y eliminar
    document.addEventListener('DOMContentLoaded', function() {
        // Delegación de eventos para botones que se crean dinámicamente
        document.addEventListener('click', function(e) {
            // Event listeners para botones de editar y eliminar
            if (e.target && e.target.closest('.btn')) {
                const btn = e.target.closest('.btn');
                const onclick = btn.getAttribute('onclick');
                
                if (onclick && onclick.includes('editTitular')) {
                    e.preventDefault();
                    const id = onclick.match(/editTitular\('([^']+)'\)/)[1];
                    editTitular(id);
                } else if (onclick && onclick.includes('deleteTitular')) {
                    e.preventDefault();
                    const id = onclick.match(/deleteTitular\('([^']+)'\)/)[1];
                    deleteTitular(id);
                } else if (onclick && onclick.includes('editBeneficiario')) {
                    e.preventDefault();
                    const id = onclick.match(/editBeneficiario\('([^']+)'\)/)[1];
                    editBeneficiario(id);
                }
            }
        });
    });
    
// ========================================
// FUNCIONES GLOBALES EXPUESTAS
// ========================================

// Exponer funciones para uso en HTML onclick (asegurar que estén disponibles inmediatamente)
if (typeof showCreateTitularModal !== 'undefined') {
    window.showCreateTitularModal = showCreateTitularModal;
}
if (typeof hideCreateTitularModal !== 'undefined') {
    window.hideCreateTitularModal = hideCreateTitularModal;
}
if (typeof showSearchTitularModal !== 'undefined') {
    window.showSearchTitularModal = showSearchTitularModal;
}
if (typeof hideSearchTitularModal !== 'undefined') {
    window.hideSearchTitularModal = hideSearchTitularModal;
}
if (typeof showConfirmCreateTitularModal !== 'undefined') {
    window.showConfirmCreateTitularModal = showConfirmCreateTitularModal;
}

// Asegurar que las funciones estén disponibles globalmente
if (typeof hideCreateTitularModal === 'undefined') {
    window.hideCreateTitularModal = function() {
        console.log('🔍 Cerrando modal de titular...');
        const createTitularModalOverlay = document.getElementById('createTitularModal');
        if (createTitularModalOverlay) {
            createTitularModalOverlay.classList.remove('show');
            document.body.style.overflow = 'auto';
            console.log('✅ Modal de titular cerrado');
        } else {
            console.log('⚠️ Modal createTitularModal no encontrado - posiblemente no estamos en la página correcta');
        }
    };
}
// Asignaciones globales - solo las que están definidas globalmente
window.cancelCreateTitular = cancelCreateTitular;
window.confirmCreateTitular = confirmCreateTitular;
window.closeSuccessTitularModal = closeSuccessTitularModal;
window.showConfirmCreateTitularModal = showConfirmCreateTitularModal;
window.showConfirmCreateBeneficiarioModal = showConfirmCreateBeneficiarioModal;
window.cancelCreateBeneficiario = cancelCreateBeneficiario;
window.confirmCreateBeneficiario = confirmCreateBeneficiario;

// Funciones que aún están dentro de DOMContentLoaded - comentadas temporalmente
// window.showCreateTitularModal = showCreateTitularModal;
// window.showCreateBeneficiarioModal = showCreateBeneficiarioModal;
// window.hideCreateBeneficiarioModal = hideCreateBeneficiarioModal;
// window.closeSuccessBeneficiarioModal = closeSuccessBeneficiarioModal;
// Funciones que aún están dentro de DOMContentLoaded - comentadas temporalmente
// window.showSearchBeneficiarioModal = showSearchBeneficiarioModal;
// window.hideSearchBeneficiarioModal = hideSearchBeneficiarioModal;
// window.showTitularResultsModal = showTitularResultsModal;
// window.hideTitularResultsModal = hideTitularResultsModal;
// window.showBeneficiarioResultsModal = showBeneficiarioResultsModal;
// window.hideBeneficiarioResultsModal = hideBeneficiarioResultsModal;
// window.refreshTitularResultsTable = refreshTitularResultsTable;
// window.refreshBeneficiarioResultsTable = refreshBeneficiarioResultsTable;
// window.refreshBeneficiariosInTitularResults = refreshBeneficiariosInTitularResults;

// Función específica para probar la actualización de beneficiarios en el modal de resultados
window.testBeneficiariosUpdate = function() {
    console.log('🧪 PRUEBA: Actualizando tabla de beneficiarios en modal de resultados');
    const currentTitularId = sessionStorage.getItem('currentSearchedTitularId');
    if (currentTitularId) {
        console.log('🆔 ID del titular actual:', currentTitularId);
        console.log('📊 Beneficiarios en memoria:', titularIdToBeneficiarios[currentTitularId]);
        refreshBeneficiariosInTitularResults();
    } else {
        console.log('❌ No hay titular actual en sessionStorage');
    }
};

// Función para simular la creación de un beneficiario de prueba
window.testCreateBeneficiario = function() {
    console.log('🧪 PRUEBA: Creando beneficiario de prueba');
    const currentTitularId = sessionStorage.getItem('currentSearchedTitularId');
    if (currentTitularId) {
        const beneficiarioPrueba = {
            tipoId: 'CC',
            numeroId: 'TEST' + Date.now(),
            apellido1: 'PRUEBA',
            apellido2: 'TEST',
            nombre1: 'BENEFICIARIO',
            nombre2: 'DEMO',
            direccion: 'CALLE PRUEBA 123',
            telefono: '3001234567',
            email: 'test@prueba.com',
            activo: 'SI'
        };
        
        console.log('📝 Beneficiario de prueba:', beneficiarioPrueba);
        
        // Agregar a la tabla principal
        addBeneficiarioToTable(beneficiarioPrueba);
        
        // Asociar al titular
        if (!titularIdToBeneficiarios[currentTitularId]) {
            titularIdToBeneficiarios[currentTitularId] = [];
        }
        titularIdToBeneficiarios[currentTitularId].push(beneficiarioPrueba);
        
        // Refrescar tabla de resultados
        renderBeneficiariosDeTitular(currentTitularId);
        
        console.log('✅ Beneficiario de prueba creado y agregado');
    } else {
        console.log('❌ No hay titular actual en sessionStorage');
    }
};

// Función de debug para verificar el estado de las tablas de resultados
window.debugResultsTables = function() {
    console.log('🔍 DEBUG: Estado de las tablas de resultados');
    console.log('📊 titularesData:', titularesData);
    console.log('📊 beneficiariosData:', beneficiariosData);
    console.log('📊 titularIdToBeneficiarios:', titularIdToBeneficiarios);
    
    const titularModal = document.getElementById('titularResultsModal');
    const beneficiarioModal = document.getElementById('beneficiarioResultsModal');
    
    console.log('📋 Modal titular abierto:', titularModal && titularModal.classList.contains('show'));
    console.log('📋 Modal beneficiario abierto:', beneficiarioModal && beneficiarioModal.classList.contains('show'));
    
    const currentTitularId = sessionStorage.getItem('currentSearchedTitularId');
    const currentBeneficiarioId = sessionStorage.getItem('currentSearchedBeneficiarioId');
    
    console.log('🆔 ID titular actual:', currentTitularId);
    console.log('🆔 ID beneficiario actual:', currentBeneficiarioId);
    
    if (currentTitularId) {
        const titular = titularesData[currentTitularId];
        console.log('👤 Datos del titular actual:', titular);
    }
    
    if (currentBeneficiarioId) {
        const beneficiario = beneficiariosData[currentBeneficiarioId];
        console.log('👤 Datos del beneficiario actual:', beneficiario);
    }
};

// Función simplificada siguiendo el patrón de ciudades
window.forceRefreshAllResultsTables = function() {
    // Verificar si las funciones están disponibles antes de llamarlas
    if (typeof window.refreshTitularResultsTable === 'function') {
        window.refreshTitularResultsTable();
    } else {
        console.warn('refreshTitularResultsTable no está disponible');
    }
    
    if (typeof window.refreshBeneficiarioResultsTable === 'function') {
        window.refreshBeneficiarioResultsTable();
    } else {
        console.warn('refreshBeneficiarioResultsTable no está disponible');
    }
};
window.editTitular = editTitular;
window.editBeneficiario = editBeneficiario;
window.deleteTitular = deleteTitular;
// window.deleteBeneficiario = deleteBeneficiario; // Comentado porque está definida dentro de DOMContentLoaded
window.setBeneficiario = setBeneficiario;
window.setBeneficiarioActivo = setBeneficiarioActivo;
window.addBeneficiarioForCurrentTitular = addBeneficiarioForCurrentTitular;
// Funciones para modales de actualizar
window.showUpdateTitularModal = showUpdateTitularModal;
window.hideUpdateTitularModal = hideUpdateTitularModal;
window.showUpdateBeneficiarioModal = showUpdateBeneficiarioModal;
window.hideUpdateBeneficiarioModal = hideUpdateBeneficiarioModal;
window.goBackToUpdateTitularForm = goBackToUpdateTitularForm;
window.setUpdateTitularActivo = setUpdateTitularActivo;
window.setUpdateBeneficiario = setUpdateBeneficiario;
window.editBeneficiarioFromUpdate = editBeneficiarioFromUpdate;
// Toggle titulares global
window.toggleTitularState = toggleTitularState;
window.cancelToggleTitular = cancelToggleTitular;
window.confirmToggleTitular = confirmToggleTitular;
window.closeSuccessToggleTitularModal = closeSuccessToggleTitularModal;
// Toggle beneficiarios global
window.toggleBeneficiarioState = toggleBeneficiarioState;
window.cancelToggleBeneficiario = cancelToggleBeneficiario;
window.confirmToggleBeneficiario = confirmToggleBeneficiario;
window.closeSuccessToggleBeneficiarioModal = closeSuccessToggleBeneficiarioModal;
// Funciones de gestión de beneficiarios global
window.updateBeneficiarioInTable = updateBeneficiarioInTable;
window.addBeneficiarioToTable = addBeneficiarioToTable;
window.clearCreateBeneficiarioForm = clearCreateBeneficiarioForm;

// Debug: verificar que las funciones estén disponibles
console.log('Funciones expuestas:', {
    editTitular: typeof window.editTitular,
    editBeneficiario: typeof window.editBeneficiario,
    deleteTitular: typeof window.deleteTitular,
    deleteBeneficiario: typeof window.deleteBeneficiario,
    addBeneficiarioForCurrentTitular: typeof window.addBeneficiarioForCurrentTitular,
    toggleTitularState: typeof window.toggleTitularState,
    toggleBeneficiarioState: typeof window.toggleBeneficiarioState,
    updateBeneficiarioInTable: typeof window.updateBeneficiarioInTable,
    addBeneficiarioToTable: typeof window.addBeneficiarioToTable
});

// Verificar que la función esté disponible
if (typeof window.addBeneficiarioForCurrentTitular === 'function') {
    console.log('✅ Función addBeneficiarioForCurrentTitular está disponible globalmente');
} else {
    console.log('❌ ERROR: Función addBeneficiarioForCurrentTitular NO está disponible');
}

// Verificar que la función toggleBeneficiarioState esté disponible
if (typeof window.toggleBeneficiarioState === 'function') {
    console.log('✅ Función toggleBeneficiarioState está disponible globalmente');
} else {
    console.log('❌ ERROR: Función toggleBeneficiarioState NO está disponible');
}

// Verificar que la función updateBeneficiarioInTable esté disponible
if (typeof window.updateBeneficiarioInTable === 'function') {
    console.log('✅ Función updateBeneficiarioInTable está disponible globalmente');
} else {
    console.log('❌ ERROR: Función updateBeneficiarioInTable NO está disponible');
}

// Verificar que la función addBeneficiarioToTable esté disponible
if (typeof window.addBeneficiarioToTable === 'function') {
    console.log('✅ Función addBeneficiarioToTable está disponible globalmente');
} else {
    console.log('❌ ERROR: Función addBeneficiarioToTable NO está disponible');
}

// Función para verificar el estado de los modales
function checkModalStatus() {
    const titularResultsModal = document.getElementById('titularResultsModal');
    const createBeneficiarioModal = document.getElementById('createBeneficiarioModal');
    
    console.log('Estado de modales:');
    console.log('- Modal de resultados de titular:', titularResultsModal ? titularResultsModal.style.display : 'no encontrado');
    console.log('- Modal de crear beneficiario:', createBeneficiarioModal ? createBeneficiarioModal.style.display : 'no encontrado');
    console.log('- Titular actual:', currentSearchedTitularId);
}

// Exponer función de debug
window.checkModalStatus = checkModalStatus;

// Función de prueba para verificar el modal
function testCreateBeneficiarioModal() {
    console.log('🧪 Probando apertura del modal de crear beneficiario...');
    
    const modal = document.getElementById('createBeneficiarioModal');
    console.log('Modal encontrado:', modal);
    
    if (modal) {
        console.log('Estado actual del modal:', modal.style.display);
        modal.style.display = 'flex';
        console.log('Modal abierto manualmente');
    } else {
        console.log('❌ Modal no encontrado');
    }
}

// ========================================
// FUNCIONES PARA ELIMINAR TITULAR
// ========================================

/**
 * Muestra el modal de confirmación para eliminar titular
 */
function showConfirmDeleteTitularModal() {
    const modal = document.getElementById('confirmDeleteTitularModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela la eliminación del titular
 */
function cancelDeleteTitular() {
    const modal = document.getElementById('confirmDeleteTitularModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Limpiar datos temporales
    window.tempDeleteTitularId = null;
}

/**
 * Confirma la eliminación del titular
 */
function confirmDeleteTitular() {
    const identificacion = window.tempDeleteTitularId;
    
    if (identificacion) {
        console.log('Eliminando titular con identificación:', identificacion);
        
        // Buscar y eliminar la fila de la tabla de titulares
        const tableBody = document.getElementById('titularesTableBody');
        const rows = tableBody.querySelectorAll('tr');
        
        for (let row of rows) {
            // Buscar en la segunda celda (columna "Identificación")
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2 && cells[1].textContent === identificacion) {
                row.remove();
                
                // Eliminar de los datos en memoria
                deleteTitularFromData(identificacion);
                
                // Si no quedan titulares, mostrar mensaje de "sin datos"
                if (tableBody.children.length === 0) {
                    const noDataRow = document.createElement('tr');
                    noDataRow.innerHTML = `
                        <td colspan="8" class="no-data-message">
                            <div class="no-data-content">
                                <i class="fas fa-user"></i>
                                <p>No existen registros de titulares</p>
                                <small>Haz clic en "Crear Titular" para crear el primer registro</small>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(noDataRow);
                }
                break;
            }
        }
        
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmDeleteTitularModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Mostrar modal de éxito
        showSuccessDeleteTitularModal();
        
        // Limpiar datos temporales
        window.tempDeleteTitularId = null;
    }
}

/**
 * Muestra el modal de éxito para eliminar titular
 */
function showSuccessDeleteTitularModal() {
    const modal = document.getElementById('successDeleteTitularModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito para eliminar titular
 */
function closeSuccessDeleteTitularModal() {
    const modal = document.getElementById('successDeleteTitularModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// FUNCIONES PARA ELIMINAR BENEFICIARIO
// ========================================

/**
 * Muestra el modal de confirmación para eliminar beneficiario
 */
function showConfirmDeleteBeneficiarioModal() {
    const modal = document.getElementById('confirmDeleteBeneficiarioModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cancela la eliminación del beneficiario
 */
function cancelDeleteBeneficiario() {
    const modal = document.getElementById('confirmDeleteBeneficiarioModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Limpiar datos temporales
    window.tempDeleteBeneficiarioId = null;
}

/**
 * Confirma la eliminación del beneficiario
 */
function confirmDeleteBeneficiario() {
    const numeroId = window.tempDeleteBeneficiarioId;
    
    if (numeroId) {
        console.log('Eliminando beneficiario con número de ID:', numeroId);
        
        // Buscar y eliminar de la tabla principal de beneficiarios
        const tableBody = document.getElementById('beneficiariosTableBody');
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            for (let row of rows) {
                const secondCell = row.querySelector('td:nth-child(2)');
                if (secondCell && secondCell.textContent === numeroId) {
                    row.remove();
                    break;
                }
            }
        }
        
        // Re-renderizar la tabla de resultados de titular si está abierta - SIGUIENDO EL PATRÓN DE CIUDADES
        const titularModal = document.getElementById('titularResultsModal');
        if (titularModal && titularModal.classList.contains('show')) {
            const currentTitularId = sessionStorage.getItem('currentSearchedTitularId');
            if (currentTitularId) {
                // Eliminar de la relación titular-beneficiarios
                for (let titularId in titularIdToBeneficiarios) {
                    const index = titularIdToBeneficiarios[titularId].findIndex(b => b.numeroId === numeroId);
                    if (index > -1) {
                        titularIdToBeneficiarios[titularId].splice(index, 1);
                        // Re-renderizar la tabla de beneficiarios
                        renderBeneficiariosDeTitular(titularId);
                        break;
                    }
                }
            }
        }
        
        // Eliminar de la relación en memoria
        for (let titularId in titularIdToBeneficiarios) {
            const index = titularIdToBeneficiarios[titularId].findIndex(b => b.numeroId === numeroId);
            if (index > -1) {
                titularIdToBeneficiarios[titularId].splice(index, 1);
                break;
            }
        }
        
        // Eliminar de los datos en memoria
        deleteBeneficiarioFromData(numeroId);
        
        // Cerrar modal de confirmación
        const confirmModal = document.getElementById('confirmDeleteBeneficiarioModal');
        if (confirmModal) {
            confirmModal.classList.remove('show');
        }
        
        // Mostrar modal de éxito
        showSuccessDeleteBeneficiarioModal();
        
        // Limpiar datos temporales
        window.tempDeleteBeneficiarioId = null;
    }
}

/**
 * Muestra el modal de éxito para eliminar beneficiario
 */
function showSuccessDeleteBeneficiarioModal() {
    const modal = document.getElementById('successDeleteBeneficiarioModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de éxito para eliminar beneficiario
 */
function closeSuccessDeleteBeneficiarioModal() {
    const modal = document.getElementById('successDeleteBeneficiarioModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    // Refrescar tablas de resultados después de cerrar el modal de éxito
    setTimeout(() => {
        console.log('🔄 Refrescando tablas después de cerrar modal de éxito de eliminar beneficiario');
        window.forceRefreshAllResultsTables();
    }, 200);
}

// Exponer función de prueba
window.testCreateBeneficiarioModal = testCreateBeneficiarioModal;

// Exponer funciones de eliminación globalmente
window.showConfirmDeleteTitularModal = showConfirmDeleteTitularModal;
window.cancelDeleteTitular = cancelDeleteTitular;
window.confirmDeleteTitular = confirmDeleteTitular;
window.showSuccessDeleteTitularModal = showSuccessDeleteTitularModal;
window.closeSuccessDeleteTitularModal = closeSuccessDeleteTitularModal;

window.showConfirmDeleteBeneficiarioModal = showConfirmDeleteBeneficiarioModal;
window.cancelDeleteBeneficiario = cancelDeleteBeneficiario;
window.confirmDeleteBeneficiario = confirmDeleteBeneficiario;
window.showSuccessDeleteBeneficiarioModal = showSuccessDeleteBeneficiarioModal;
window.closeSuccessDeleteBeneficiarioModal = closeSuccessDeleteBeneficiarioModal;

// ========================================
// FUNCIONES DE CIUDAD
// ========================================

/**
 * Muestra el modal de selección de ciudad
 */
function showCityModal() {
    console.log('🏙️ Mostrando modal de selección de ciudad...');
    const modal = document.getElementById('cityModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        loadCitiesForSelection();
    }
}

/**
 * Oculta el modal de selección de ciudad
 */
function hideCityModal() {
    const modal = document.getElementById('cityModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Carga las ciudades disponibles en el select
 */
function loadCitiesForSelection() {
    console.log('📋 Cargando ciudades para selección...');
    
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) return;
    
    // Cargar ciudades reales del sistema
    let ciudades = {};
    if (typeof window.getCiudadesData === 'function') {
        try { 
            ciudades = window.getCiudadesData(); 
        } catch (e) { 
            ciudades = {}; 
        }
    } else {
        // Fallback a localStorage si existe data válida
        try {
            const raw = localStorage.getItem('ciudadesData');
            const parsed = raw ? JSON.parse(raw) : {};
            if (parsed && typeof parsed === 'object') {
                ciudades = Object.fromEntries(
                    Object.entries(parsed).filter(([k, v]) => v && typeof v === 'object' && v.codigo && v.nombre)
                );
            }
        } catch (e) { 
            ciudades = {}; 
        }
    }
    
    const current = citySelect.value;
    citySelect.innerHTML = '<option value="">Seleccione la ciudad</option>';
    
    Object.values(ciudades)
        .filter(c => c.activo !== false) // Solo ciudades activas
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

/**
 * Maneja la selección de ciudad
 */
function handleSelectCity() {
    console.log('✅ Procesando selección de ciudad...');
    
    const citySelect = document.getElementById('citySelect');
    const selectedValue = citySelect ? citySelect.value : '';
    
    if (!selectedValue) {
        showNotification('Por favor seleccione una ciudad', 'error');
        return;
    }
    
    // Obtener nombre de la ciudad seleccionada
    const selectedOption = citySelect.options[citySelect.selectedIndex];
    const cityName = selectedOption ? selectedOption.textContent : '';
    
    // Actualizar indicador de ciudad actual
    updateCurrentCityDisplay(cityName);
    
    // Ocultar modal
    hideCityModal();
    
    showNotification(`Ciudad seleccionada: ${cityName}`, 'success');
}

/**
 * Actualiza la visualización de la ciudad actual
 */
function updateCurrentCityDisplay(cityName) {
    const currentCityElement = document.getElementById('currentCityName');
    if (currentCityElement) {
        currentCityElement.textContent = cityName;
    }
}

// Exponer funciones de ciudad globalmente
window.showCityModal = showCityModal;
window.hideCityModal = hideCityModal;
window.handleSelectCity = handleSelectCity;
window.updateCurrentCityDisplay = updateCurrentCityDisplay;
window.clearAllNotifications = clearAllNotifications;

// Verificación final de carga
console.log('📦 Script admin-titulares.js cargado completamente');
console.log('🔍 Verificando funciones globales...');
console.log('- addBeneficiarioForCurrentTitular:', typeof window.addBeneficiarioForCurrentTitular);
console.log('- showCreateBeneficiarioModal:', typeof window.showCreateBeneficiarioModal);
console.log('- hideTitularResultsModal:', typeof window.hideTitularResultsModal);
console.log('- showTitularResultsModal:', typeof window.showTitularResultsModal);
console.log('- hideSearchTitularModal:', typeof window.hideSearchTitularModal);
console.log('- showSearchTitularModal:', typeof window.showSearchTitularModal);
