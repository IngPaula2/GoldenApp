/**
 * 🏢 DASHBOARD ADMINISTRATIVO - GOLDEN APP
 * 
 * Este archivo contiene toda la funcionalidad del panel administrativo de ciudades.
 * Incluye gestión de modales, navegación, formularios y operaciones CRUD.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2024
 */

// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // GESTIÓN DE MODALES
    // ========================================
    
    // Referencias a los elementos de modales
    const selectCityModal = document.getElementById('selectCityModal');
    const selectCityModalOverlay = document.querySelector('#selectCityModal.modal-overlay');
    const modal = document.getElementById('cityModal');
    const citySearchModalOverlay = document.querySelector('#cityModal.modal-overlay');
    const createCityModal = document.getElementById('createCityModal');
    const createCityModalOverlay = document.querySelector('#createCityModal.modal-overlay');
    const branchModalOverlay = document.querySelector('#branchModal.modal-overlay');
    const upsertBranchModalOverlay = document.querySelector('#upsertBranchModal.modal-overlay');
    const cityResultsModalOverlay = document.querySelector('#cityResultsModal.modal-overlay');
    const branchResultsModalOverlay = document.querySelector('#branchResultsModal.modal-overlay');
    
    /**
     * Muestra el modal de selección de ciudad
     * Solo se muestra si el usuario no ha seleccionado una ciudad en esta sesión
     */
    function showSelectCityModal() {
        // Verificar si el usuario ya seleccionó una ciudad en esta sesión
        const selectedCity = sessionStorage.getItem('selectedCity');
        if (!selectedCity) {
            selectCityModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Fuerza la visualización del modal de selección de ciudad
     * Se usa para permitir cambiar la ciudad seleccionada
     */
    function forceShowSelectCityModal() {
        selectCityModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Oculta el modal de selección de ciudad
     * Restaura el scroll del body
     */
    function hideSelectCityModal() {
        selectCityModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    /**
     * Muestra el modal de búsqueda de ciudad
     */
    function showCitySearchModal() {
        citySearchModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Limpiar campo de búsqueda
        document.getElementById('searchCityCodigo').value = '';
    }
    
    /**
     * Oculta el modal de búsqueda de ciudad
     */
    function hideModal() {
        citySearchModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    /**
     * Muestra el modal para crear una nueva ciudad
     */
    function showCreateCityModal() {
        createCityModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Oculta el modal de crear ciudad y limpia el formulario
     */
    function hideCreateCityModal() {
        createCityModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Limpiar campos del formulario
        clearCreateCityForm();
    }
    
    /**
     * Limpia todos los campos del formulario de crear ciudad y restaura el modo "crear"
     */
    function clearCreateCityForm() {
        document.getElementById('tCodigo').value = '';
        document.getElementById('tNombre').value = '';
        document.getElementById('tDireccion').value = '';
        document.getElementById('tTelefono').value = '';
        document.getElementById('tCorreo').value = '';
        
        // Limpiar atributo de código original
        document.getElementById('tCodigo').removeAttribute('data-original-code');
        
        // Restaurar modo "crear" (título y botón)
        document.getElementById('createCityTitle').textContent = 'CREAR CIUDAD';
        document.getElementById('bCrear').textContent = 'Crear';
    }
    
    // ========================================
    // FUNCIONES GLOBALES
    // ========================================
    
    // Hacer funciones disponibles globalmente para uso en HTML
    window.hideModal = hideModal;
    window.hideCreateCityModal = hideCreateCityModal;
    window.hideSelectCityModal = hideSelectCityModal;
    window.showSelectCityModal = showSelectCityModal;
    window.forceShowSelectCityModal = forceShowSelectCityModal;
    
    // ===== Filiales: funciones de modal =====
    function showBranchModal() {
        if (branchModalOverlay) {
            branchModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Limpiar campo de búsqueda
            document.getElementById('searchCityCode').value = '';
        }
    }
    
    function hideBranchModal() {
        if (branchModalOverlay) {
            branchModalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    function showUpsertBranchModal(mode, filial) {
        if (upsertBranchModalOverlay) {
            const title = document.getElementById('upsertBranchTitle');
            const btn = document.getElementById('bGuardarFilial');
            const codigo = document.getElementById('fCodigo');
            const nombre = document.getElementById('fNombre');
            const ciudad = document.getElementById('fCiudad');
            const direccion = document.getElementById('fDireccion');
            const telefono = document.getElementById('fTelefono');
            
            if (mode === 'update' && filial) {
                if (title) title.textContent = 'ACTUALIZAR FILIAL';
                if (btn) btn.textContent = 'Actualizar';
                if (codigo) codigo.value = filial.codigo || '';
                if (nombre) nombre.value = filial.nombre || '';
                if (ciudad) ciudad.value = filial.ciudad || '';
                if (direccion) direccion.value = filial.direccion || '';
                if (telefono) telefono.value = filial.telefono || '';
                if (codigo) codigo.disabled = true; // no permitir cambiar código en actualización
            } else {
                if (title) title.textContent = 'CREAR FILIAL';
                if (btn) btn.textContent = 'Guardar';
                if (codigo) { codigo.value = ''; codigo.disabled = false; }
                if (nombre) nombre.value = '';
                if (ciudad) ciudad.value = '';
                if (direccion) direccion.value = '';
                if (telefono) telefono.value = '';
            }
            upsertBranchModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hideUpsertBranchModal() {
        if (upsertBranchModalOverlay) {
            upsertBranchModalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // Exponer funciones de filiales globalmente
    window.hideBranchModal = hideBranchModal;
    window.hideUpsertBranchModal = hideUpsertBranchModal;
    window.showUpsertBranchModal = showUpsertBranchModal;
    
    // Funciones para modales de resultados
    function showCityResultsModal() {
        if (cityResultsModalOverlay) {
            cityResultsModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hideCityResultsModal() {
        if (cityResultsModalOverlay) {
            cityResultsModalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    function showBranchResultsModal() {
        if (branchResultsModalOverlay) {
            branchResultsModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hideBranchResultsModal() {
        if (branchResultsModalOverlay) {
            branchResultsModalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    window.hideCityResultsModal = hideCityResultsModal;
    window.hideBranchResultsModal = hideBranchResultsModal;
    
    // ========================================
    // EVENTOS DE MODALES
    // ========================================
    
    // Cerrar modal de selección de ciudad al hacer clic fuera
    selectCityModalOverlay.addEventListener('click', function(e) {
        if (e.target === selectCityModalOverlay) {
            hideSelectCityModal();
        }
    });
    
    // Cerrar modal de búsqueda de ciudad al hacer clic fuera
    citySearchModalOverlay.addEventListener('click', function(e) {
        if (e.target === citySearchModalOverlay) {
            hideModal();
        }
    });
    
    // Cerrar modal de crear ciudad al hacer clic fuera
    createCityModalOverlay.addEventListener('click', function(e) {
        if (e.target === createCityModalOverlay) {
            hideCreateCityModal();
        }
    });
    
    // Cerrar modal de selección de filial al hacer clic fuera
    if (branchModalOverlay) {
        branchModalOverlay.addEventListener('click', function(e) {
            if (e.target === branchModalOverlay) {
                hideBranchModal();
            }
        });
    }
    
    // Cerrar modal crear/actualizar filial al hacer clic fuera
    if (upsertBranchModalOverlay) {
        upsertBranchModalOverlay.addEventListener('click', function(e) {
            if (e.target === upsertBranchModalOverlay) {
                hideUpsertBranchModal();
            }
        });
    }
    
    // Cerrar modales de resultados al hacer clic fuera
    if (cityResultsModalOverlay) {
        cityResultsModalOverlay.addEventListener('click', function(e) {
            if (e.target === cityResultsModalOverlay) {
                hideCityResultsModal();
            }
        });
    }
    
    if (branchResultsModalOverlay) {
        branchResultsModalOverlay.addEventListener('click', function(e) {
            if (e.target === branchResultsModalOverlay) {
                hideBranchResultsModal();
            }
        });
    }
    
    // Cerrar modales con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (selectCityModalOverlay.style.display === 'flex') {
                hideSelectCityModal();
            }
            if (citySearchModalOverlay.style.display === 'flex') {
                hideModal();
            }
            if (createCityModalOverlay.style.display === 'flex') {
                hideCreateCityModal();
            }
            if (branchModalOverlay && branchModalOverlay.style.display === 'flex') {
                hideBranchModal();
            }
            if (upsertBranchModalOverlay && upsertBranchModalOverlay.style.display === 'flex') {
                hideUpsertBranchModal();
            }
            if (cityResultsModalOverlay && cityResultsModalOverlay.style.display === 'flex') {
                hideCityResultsModal();
            }
            if (branchResultsModalOverlay && branchResultsModalOverlay.style.display === 'flex') {
                hideBranchResultsModal();
            }
        }
    });
    
    // ========================================
    // NAVEGACIÓN DEL SIDEBAR
    // ========================================
    
    // Funcionalidad de navegación del sidebar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover clase activa de todos los elementos
            navItems.forEach(nav => nav.classList.remove('active'));
            // Agregar clase activa al elemento clickeado
            this.classList.add('active');
            
            // Mostrar modal de selección de ciudad al navegar a cualquier sección
            showSelectCityModal();
        });
    });
    
    // ========================================
    // NAVEGACIÓN SUPERIOR
    // ========================================
    
    // Funcionalidad de navegación superior
    const topNavItems = document.querySelectorAll('.top-nav-item');
    topNavItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover clase activa de todos los elementos
            topNavItems.forEach(nav => nav.classList.remove('active'));
            // Agregar clase activa al elemento clickeado
            this.classList.add('active');
            
            // Mostrar modal de selección de ciudad al navegar a cualquier sección
            showSelectCityModal();
        });
    });
    
    // ========================================
    // PERFIL DE USUARIO Y DROPDOWN
    // ========================================
    
    // Elementos del perfil de usuario
    const userInfo = document.querySelector('.user-info');
    const dropdown = document.getElementById('userDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const sidebar = document.querySelector('.sidebar');
    
    if (userInfo && dropdown) {
        // Toggle del dropdown al hacer clic en el perfil
        userInfo.addEventListener('click', function() {
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
                    // Funcionalidad de cerrar sesión
                    sessionStorage.removeItem('isAuthenticated');
                    sessionStorage.removeItem('username');
                    window.location.href = '../index.html';
                } else if (this.textContent.includes('ADMINISTRAR USUARIOS')) {
                    // Navegar a administración de usuarios
                    console.log('Navegando a administrar usuarios');
                    // Agregar navegación a página de administración de usuarios aquí
                }
                
                // Cerrar dropdown después del clic
                dropdown.classList.remove('show');
                dropdownArrow.classList.remove('open');
                sidebar.classList.remove('dropdown-open');
            });
        });
    }
    


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
                case 'Buscar Ciudad':
                    console.log('Botón Buscar Ciudad clickeado');
                    showCitySearchModal();
                    break;
                case 'Buscar Filial':
                    console.log('Botón Buscar Filial clickeado');
                    showBranchModal();
                    break;
                case 'Crear Ciudad':
                    console.log('Botón Crear Ciudad clickeado');
                    showCreateCityModal();
                    break;
                case 'Crear Filial':
                    console.log('Botón Crear Filial clickeado');
                    showUpsertBranchModal('create');
                    break;
                case 'Buscar':
                    console.log('Botón Buscar clickeado');
                    if (branchModalOverlay && branchModalOverlay.style.display === 'flex') {
                        const cityCode = document.getElementById('searchCityCode').value.trim();
                        if (!cityCode) {
                            alert('Ingrese el código de ciudad');
                            break;
                        }
                        renderBranchSearchResults(resultsByCity(cityCode));
                        hideBranchModal();
                        showBranchResultsModal();
                    } else {
                        const code = document.getElementById('searchCityCodigo').value.trim();
                        if (!code) {
                            alert('Ingrese el código de ciudad');
                            break;
                        }
                        renderCitySearchResults(resultCityByCode(code));
                        hideModal();
                        showCityResultsModal();
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
    
    // Funcionalidad del select de ciudades
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            console.log('Ciudad seleccionada:', this.value);
        });
    }
    
    // Funcionalidad del botón seleccionar ciudad
    const bSeleccionarCiudad = document.getElementById('bSeleccionarCiudad');
    if (bSeleccionarCiudad) {
        bSeleccionarCiudad.addEventListener('click', function() {
            const selectedCity = document.getElementById('citySelect').value;
            if (selectedCity) {
                console.log('Ciudad seleccionada:', selectedCity);
                sessionStorage.setItem('selectedCity', selectedCity);
                alert('Ciudad seleccionada: ' + selectedCity);
                hideSelectCityModal();
            } else {
                alert('Por favor, seleccione una ciudad');
            }
        });
    }
    
    // ========================================
    // FUNCIONALIDAD DEL BOTÓN CREAR CIUDAD
    // ========================================
    
    // Funcionalidad del botón crear ciudad
    const bCrear = document.getElementById('bCrear');
    if (bCrear) {
        bCrear.addEventListener('click', function() {
            // Obtener valores del formulario
            const codigo = document.getElementById('tCodigo').value.trim();
            const nombre = document.getElementById('tNombre').value.trim();
            const direccion = document.getElementById('tDireccion').value.trim();
            const telefono = document.getElementById('tTelefono').value.trim();
            const correo = document.getElementById('tCorreo').value.trim();
            
            // Validar campos obligatorios
            if (!codigo || !nombre || !direccion || !telefono || !correo) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                alert('Por favor, ingrese un correo electrónico válido.');
                return;
            }
            
            // Crear objeto de ciudad
            const nuevaCiudad = {
                codigo: codigo,
                nombre: nombre,
                direccion: direccion,
                telefono: telefono,
                correo: correo
            };
            
            console.log('Nueva ciudad a crear:', nuevaCiudad);
            
            // Determinar si es crear o actualizar basado en el texto del botón
            const isUpdate = document.getElementById('bCrear').textContent === 'Actualizar';
            
            if (isUpdate) {
                // Es una actualización - verificar si el código cambió
                const originalCode = document.getElementById('tCodigo').getAttribute('data-original-code');
                if (originalCode && originalCode !== codigo) {
                    // El código cambió - eliminar la ciudad anterior
                    delete ciudadesData[originalCode];
                    
                    // Eliminar la fila anterior de la tabla
                    const tableBody = document.getElementById('ciudadesTableBody');
                    const rows = tableBody.querySelectorAll('tr');
                    for (let row of rows) {
                        const firstCell = row.querySelector('td');
                        if (firstCell && firstCell.textContent === originalCode) {
                            row.remove();
                            break;
                        }
                    }
                }
            }
            
            // Aquí normalmente enviarías los datos al backend
            // Por ahora, persistimos en memoria, refrescamos selects y cerramos el modal
            ciudadesData[codigo] = { codigo, nombre, direccion, telefono, correo };

            alert(isUpdate ? 'Ciudad actualizada exitosamente!' : 'Ciudad creada exitosamente!');
            hideCreateCityModal();
            
            // Agregar o actualizar la ciudad en la tabla
            addCityToTable(nuevaCiudad, isUpdate);
            
            // Refrescar selects dependientes
            refreshCitySelects();
        });
    }
    
    // ========================================
    // DATOS EN MEMORIA (sin valores por defecto)
    // ========================================
    const filialData = {};
    const ciudadesData = {};
    
    function inferFilialFromSelect(code) {
        return { codigo: code, nombre: code, ciudad: sessionStorage.getItem('selectedCity') || '' };
    }
    
    // Guardar/Actualizar filial
    const bGuardarFilial = document.getElementById('bGuardarFilial');
    if (bGuardarFilial) {
        bGuardarFilial.addEventListener('click', function() {
            const title = document.getElementById('upsertBranchTitle');
            const codigo = document.getElementById('fCodigo').value.trim();
            const nombre = document.getElementById('fNombre').value.trim();
            const ciudad = document.getElementById('fCiudad').value.trim();
            const direccion = document.getElementById('fDireccion').value.trim();
            const telefono = document.getElementById('fTelefono').value.trim();
            
            if (!codigo || !nombre || !ciudad) {
                alert('Por favor, complete todos los campos obligatorios de la filial.');
                return;
            }
            
            const filial = { codigo, nombre, ciudad, direccion, telefono };
            filialData[codigo] = filial;
            addBranchToTable(filial, true);
            
            alert((title && title.textContent.includes('ACTUALIZAR')) ? 'Filial actualizada' : 'Filial creada');
            hideUpsertBranchModal();
        });
    }
    
    // ========================================
    // TABLA DE FILIALES
    // ========================================
    function addBranchToTable(filial, replaceIfExists = false) {
        const tableBody = document.getElementById('filialesTableBody');
        const noDataRow = tableBody.querySelector('.no-data-message');
        if (noDataRow) noDataRow.remove();
        
        // Si existe, y se solicita reemplazar, actualizar la fila
        const existingRow = Array.from(tableBody.querySelectorAll('tr')).find(r => {
            const firstCell = r.querySelector('td');
            return firstCell && firstCell.textContent === filial.codigo;
        });
        
        const rowHtml = `
            <td>${filial.codigo}</td>
            <td>${filial.nombre}</td>
            <td>${filial.ciudad}</td>
            <td>${filial.direccion || ''}</td>
            <td>${filial.telefono || ''}</td>
            <td>
                <button class="btn btn-small" onclick="editBranch('${filial.codigo}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteBranch('${filial.codigo}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        if (existingRow && replaceIfExists) {
            existingRow.innerHTML = rowHtml;
        } else if (!existingRow) {
            const newRow = document.createElement('tr');
            newRow.innerHTML = rowHtml;
            tableBody.appendChild(newRow);
            
            newRow.addEventListener('mouseenter', function() { this.style.backgroundColor = '#f8f9fa'; });
            newRow.addEventListener('mouseleave', function() { this.style.backgroundColor = ''; });
        }
    }

    // ========================================
    // BÚSQUEDA EN MODALES (CIUDADES / FILIALES)
    // ========================================
    function resultCityByCode(code) {
        return ciudadesData[code] || null;
    }
    
    function resultsByCity(code) {
        return Object.values(filialData).filter(f => f.ciudad === code);
    }
    
    function renderCitySearchResults(ciudad) {
        const body = document.getElementById('citySearchResultsBody');
        if (!body) return;
        body.innerHTML = '';
        if (!ciudad) {
            body.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-search"></i>
                            <p>No se encontraron resultados</p>
                            <small>Intente con otro código</small>
                        </div>
                    </td>
                </tr>`;
            return;
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ciudad.codigo}</td>
            <td>${ciudad.nombre}</td>
            <td>${ciudad.direccion || ''}</td>
            <td>${ciudad.telefono || ''}</td>
            <td>${ciudad.correo || ''}</td>
            <td>
                <button class="btn btn-small" onclick="editCity('${ciudad.codigo}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteCity('${ciudad.codigo}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>`;
        body.appendChild(row);
    }
    
    function renderBranchSearchResults(results) {
        const body = document.getElementById('branchSearchResultsBody');
        if (!body) return;
        body.innerHTML = '';
        if (!results || results.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-search"></i>
                            <p>No se encontraron resultados</p>
                            <small>Intente con otro código de ciudad</small>
                        </div>
                    </td>
                </tr>`;
            return;
        }
        results.forEach(filial => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${filial.codigo}</td>
                <td>${filial.nombre}</td>
                <td>${filial.ciudad}</td>
                <td>${filial.direccion || ''}</td>
                <td>${filial.telefono || ''}</td>
                <td>
                    <button class="btn btn-small" onclick="editBranch('${filial.codigo}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteBranch('${filial.codigo}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>`;
            body.appendChild(row);
        });
    }

    // Refrescar selects de ciudades en modales relevantes
    function refreshCitySelects() {
        const selects = [document.getElementById('citySelect'), document.getElementById('fCiudad')];
        selects.forEach(sel => {
            if (!sel) return;
            const currentValue = sel.value;
            sel.innerHTML = '<option value="">Seleccione la ciudad</option>';
            Object.values(ciudadesData)
                .sort((a, b) => a.codigo.localeCompare(b.codigo))
                .forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.codigo;
                    opt.textContent = `${c.codigo} - ${c.nombre}`;
                    sel.appendChild(opt);
                });
            if (currentValue && ciudadesData[currentValue]) sel.value = currentValue;
        });
    }
    


    // ========================================
    // FUNCIONES DE EDICIÓN
    // ========================================
    
    /**
     * Función para editar una ciudad
     * Abre el modal de crear ciudad en modo actualizar
     */
    function editCity(codigo) {
        const ciudad = ciudadesData[codigo];
        if (!ciudad) return;
        
        // Llenar los campos con los datos de la ciudad
        document.getElementById('tCodigo').value = ciudad.codigo;
        document.getElementById('tNombre').value = ciudad.nombre;
        document.getElementById('tDireccion').value = ciudad.direccion || '';
        document.getElementById('tTelefono').value = ciudad.telefono || '';
        document.getElementById('tCorreo').value = ciudad.correo || '';
        
        // Cambiar el título y texto del botón
        document.getElementById('createCityTitle').textContent = 'ACTUALIZAR CIUDAD';
        document.getElementById('bCrear').textContent = 'Actualizar';
        
        // Cerrar modal actual y abrir modal de crear/actualizar
        hideModal();
        showCreateCityModal();
    }
    
    /**
     * Función para editar una filial
     * Abre el modal de crear filial en modo actualizar
     */
    function editBranch(codigo) {
        const filial = filialData[codigo];
        if (!filial) return;
        
        // Llenar los campos con los datos de la filial
        document.getElementById('fCodigo').value = filial.codigo;
        document.getElementById('fNombre').value = filial.nombre;
        document.getElementById('fCiudad').value = filial.ciudad || '';
        document.getElementById('fDireccion').value = filial.direccion || '';
        document.getElementById('fTelefono').value = filial.telefono || '';
        
        // Cambiar el título y texto del botón
        document.getElementById('upsertBranchTitle').textContent = 'ACTUALIZAR FILIAL';
        document.getElementById('bGuardarFilial').textContent = 'Actualizar';
        
        // Cerrar modal actual y abrir modal de crear/actualizar filial
        hideModal();
        showUpsertBranchModal('update', filial);
    }
    
    // ========================================
    // FUNCIONALIDAD RESPONSIVE
    // ========================================
    
    /**
     * Crea el botón toggle para el sidebar en dispositivos móviles
     */
    function createMobileToggle() {
        const sidebar = document.querySelector('.sidebar');
        const toggleButton = document.createElement('button');
        toggleButton.className = 'mobile-toggle';
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        toggleButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1001;
            background: #DEB448;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: #1a1a1a;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        toggleButton.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
        
        document.body.appendChild(toggleButton);
        
        // Mostrar botón toggle en móviles
        function checkMobile() {
            if (window.innerWidth <= 768) {
                toggleButton.style.display = 'flex';
            } else {
                toggleButton.style.display = 'none';
                sidebar.classList.remove('open');
            }
        }
        
        window.addEventListener('resize', checkMobile);
        checkMobile();
    }
    
    createMobileToggle();
    
    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    // Inicializar funcionalidades adicionales
    console.log('Dashboard inicializado exitosamente');
    
    // Mostrar modal de selección de ciudad al cargar la página (simulando login)
    // Esto mostrará el modal automáticamente cuando se cargue la página
    setTimeout(showSelectCityModal, 500);
    
    // ========================================
    // FUNCIONES DE GESTIÓN DE CIUDADES
    // ========================================
    
    /**
     * Agrega una nueva ciudad a la tabla o actualiza una existente
     * @param {Object} ciudad - Objeto con los datos de la ciudad
     * @param {boolean} replaceIfExists - Si es true, actualiza la fila existente
     */
    function addCityToTable(ciudad, replaceIfExists = false) {
        const tableBody = document.getElementById('ciudadesTableBody');
        const noDataRow = tableBody.querySelector('.no-data-message');
        
        if (noDataRow) {
            noDataRow.remove();
        }
        
        // Si existe, y se solicita reemplazar, actualizar la fila
        const allRows = Array.from(tableBody.querySelectorAll('tr'));
        const existingRow = allRows.find(r => {
            const firstCell = r.querySelector('td');
            if (!firstCell) return false;
            // Verificar que no sea una fila de "no-data-message"
            if (firstCell.hasAttribute('colspan') || r.querySelector('.no-data-message')) return false;
            return firstCell.textContent.trim() === ciudad.codigo.trim();
        });
        

        
        const rowHtml = `
            <td>${ciudad.codigo}</td>
            <td>${ciudad.nombre}</td>
            <td>${ciudad.direccion || ''}</td>
            <td>${ciudad.telefono || ''}</td>
            <td>${ciudad.correo || ''}</td>
            <td>
                <button class="btn btn-small" onclick="editCity('${ciudad.codigo}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteCity('${ciudad.codigo}')">
                    <i class="fas fa-trash"></i>
                </button>
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
    
    // ========================================
    // FUNCIONES GLOBALES DE CIUDADES
    // ========================================
    window.editCity = function(codigo) {
        const ciudad = ciudadesData[codigo];
        if (!ciudad) {
            alert('No se encontró la ciudad ' + codigo);
            return;
        }
        
        // Llenar los campos con los datos de la ciudad
        document.getElementById('tCodigo').value = ciudad.codigo;
        document.getElementById('tNombre').value = ciudad.nombre;
        document.getElementById('tDireccion').value = ciudad.direccion || '';
        document.getElementById('tTelefono').value = ciudad.telefono || '';
        document.getElementById('tCorreo').value = ciudad.correo || '';
        
        // Cambiar el título y texto del botón
        document.getElementById('createCityTitle').textContent = 'ACTUALIZAR CIUDAD';
        document.getElementById('bCrear').textContent = 'Actualizar';
        
        // Guardar el código original para poder eliminarlo después si cambia
        document.getElementById('tCodigo').setAttribute('data-original-code', codigo);
        
        // Cerrar modal actual y abrir modal de crear/actualizar
        hideModal();
        showCreateCityModal();
    };
    
    // ========================================
    // FUNCIONES GLOBALES DE FILIALES
    // ========================================
    window.editBranch = function(codigo) {
        const filial = filialData[codigo];
        if (!filial) {
            alert('No se encontró la filial ' + codigo);
            return;
        }
        showUpsertBranchModal('update', filial);
    };
    
    window.deleteBranch = function(codigo) {
        if (!confirm('¿Está seguro de eliminar la filial ' + codigo + '?')) return;
        const tableBody = document.getElementById('filialesTableBody');
        const rows = tableBody.querySelectorAll('tr');
        for (let row of rows) {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent === codigo) {
                row.remove();
                break;
            }
        }
        delete filialData[codigo];
        if (tableBody.children.length === 0) {
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = `
                <td colspan="4" class="no-data-message">
                    <div class="no-data-content">
                        <i class="fas fa-building"></i>
                        <p>No existen registros de filiales</p>
                        <small>Haz clic en "Crear Filial" para crear el primer registro</small>
                    </div>
                </td>
            `;
            tableBody.appendChild(noDataRow);
        }
    };
}); 

// ========================================
// FUNCIONES GLOBALES DE GESTIÓN DE CIUDADES
// ========================================



/**
 * Función para eliminar una ciudad
 * @param {string} codigo - Código de la ciudad a eliminar
 */
function deleteCity(codigo) {
    console.log('Eliminando ciudad con código:', codigo);
    if (confirm('¿Está seguro de que desea eliminar la ciudad con código ' + codigo + '?')) {
        // Buscar y eliminar la fila de la tabla
        const tableBody = document.getElementById('ciudadesTableBody');
        const rows = tableBody.querySelectorAll('tr');
        
        for (let row of rows) {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent === codigo) {
                row.remove();
                alert('Ciudad eliminada exitosamente');
                
                // Si no quedan ciudades, mostrar mensaje de "sin datos"
                if (tableBody.children.length === 0) {
                    const noDataRow = document.createElement('tr');
                    noDataRow.innerHTML = `
                        <td colspan="6" class="no-data-message">
                            <div class="no-data-content">
                                <i class="fas fa-database"></i>
                                <p>No existen registros de ciudades</p>
                                <small>Haz clic en "Crear Ciudad" para crear el primer registro</small>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(noDataRow);
                }
                break;
            }
        }
    }
}