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

// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // GESTIÓN DE MODALES
    // ========================================
    
         // Referencias a los elementos de modales
     const modal = document.getElementById('cityModal');
     const modalOverlay = document.querySelector('.modal-overlay');
     const createTitularModal = document.getElementById('createTitularModal');
     const createTitularModalOverlay = document.querySelector('#createTitularModal.modal-overlay');
     const createBeneficiarioModal = document.getElementById('createBeneficiarioModal');
     const createBeneficiarioModalOverlay = document.querySelector('#createBeneficiarioModal.modal-overlay');
     const searchTitularModal = document.getElementById('searchTitularModal');
     const searchTitularModalOverlay = document.querySelector('#searchTitularModal.modal-overlay');
    
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
    
    /**
     * Muestra el modal para crear un nuevo titular
     */
    function showCreateTitularModal() {
        createTitularModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Oculta el modal de crear titular y limpia el formulario
     */
    function hideCreateTitularModal() {
        createTitularModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Limpiar campos del formulario
        clearCreateTitularForm();
    }
    
         /**
      * Muestra el modal para crear un nuevo beneficiario
      */
     function showCreateBeneficiarioModal() {
         createBeneficiarioModalOverlay.style.display = 'flex';
         document.body.style.overflow = 'hidden';
         // Establecer valor por defecto
         setTimeout(() => {
             setBeneficiarioActivo('NO');
         }, 100);
     }
     
     /**
      * Oculta el modal de crear beneficiario y limpia el formulario
      */
     function hideCreateBeneficiarioModal() {
         createBeneficiarioModalOverlay.style.display = 'none';
         document.body.style.overflow = 'auto';
         // Limpiar campos del formulario
         clearCreateBeneficiarioForm();
     }
     
     /**
      * Muestra el modal para buscar titular
      */
     function showSearchTitularModal() {
         searchTitularModalOverlay.style.display = 'flex';
         document.body.style.overflow = 'hidden';
     }
     
           /**
       * Oculta el modal de buscar titular y limpia el formulario
       */
      function hideSearchTitularModal() {
          searchTitularModalOverlay.style.display = 'none';
          document.body.style.overflow = 'auto';
          // Limpiar campo de búsqueda
          document.getElementById('searchTitularId').value = '';
          // Ocultar resultados de búsqueda
          const searchResultsContainer = document.getElementById('searchResultsContainer');
          searchResultsContainer.style.display = 'none';
      }
    
    /**
     * Limpia todos los campos del formulario de crear titular
     */
    function clearCreateTitularForm() {
        document.getElementById('tTipoId').value = '';
        document.getElementById('tNumeroId').value = '';
        document.getElementById('tNombre').value = '';
        document.getElementById('tDireccion').value = '';
        document.getElementById('tTelefono').value = '';
        document.getElementById('tEmail').value = '';
        document.getElementById('tFactura').value = '';
        document.getElementById('tFechaHoy').value = '';
        document.getElementById('tActivoAsesoria').value = '';
        document.getElementById('tBeneficiario').value = '';
        
        // Limpiar estado de botones toggle
        const toggleButtons = document.querySelectorAll('.btn-toggle');
        toggleButtons.forEach(btn => btn.classList.remove('active'));
    }
    
    /**
     * Limpia todos los campos del formulario de crear beneficiario
     */
    function clearCreateBeneficiarioForm() {
        document.getElementById('bTipoId').value = '';
        document.getElementById('bNumeroId').value = '';
        document.getElementById('bNombre').value = '';
        document.getElementById('bDireccion').value = '';
        document.getElementById('bTelefono').value = '';
        document.getElementById('bEmail').value = '';
        document.getElementById('bActivo').value = '';
        
        // Limpiar estado de botones toggle
        const toggleButtons = document.querySelectorAll('#createBeneficiarioModal .btn-toggle');
        toggleButtons.forEach(btn => btn.classList.remove('active'));
    }
    
    // ========================================
    // FUNCIONES GLOBALES
    // ========================================
    
         // Hacer funciones disponibles globalmente para uso en HTML
     window.hideModal = hideModal;
     window.hideCreateTitularModal = hideCreateTitularModal;
     window.hideCreateBeneficiarioModal = hideCreateBeneficiarioModal;
     window.hideSearchTitularModal = hideSearchTitularModal;
     window.showModal = showModal;
     window.forceShowModal = forceShowModal;
    
    // ========================================
    // EVENTOS DE MODALES
    // ========================================
    
    // Cerrar modal de selección de ciudad al hacer clic fuera
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            hideModal();
        }
    });
    
    // Cerrar modal de crear titular al hacer clic fuera
    createTitularModalOverlay.addEventListener('click', function(e) {
        if (e.target === createTitularModalOverlay) {
            hideCreateTitularModal();
        }
    });
    
         // Cerrar modal de crear beneficiario al hacer clic fuera
     createBeneficiarioModalOverlay.addEventListener('click', function(e) {
         if (e.target === createBeneficiarioModalOverlay) {
             hideCreateBeneficiarioModal();
         }
     });
     
     // Cerrar modal de buscar titular al hacer clic fuera
     searchTitularModalOverlay.addEventListener('click', function(e) {
         if (e.target === searchTitularModalOverlay) {
             hideSearchTitularModal();
         }
     });
     
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
             if (searchTitularModalOverlay.style.display === 'flex') {
                 hideSearchTitularModal();
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
            showModal();
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
            showModal();
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
                    forceShowModal();
                    break;
                case 'Crear Beneficiario':
                    console.log('Botón Crear Beneficiario clickeado');
                    showCreateBeneficiarioModal();
                    break;
                case 'Seleccionar':
                    console.log('Botón Seleccionar clickeado');
                    const selectedCity = document.getElementById('citySelect').value;
                    if (selectedCity) {
                        console.log('Ciudad seleccionada:', selectedCity);
                        // Guardar la ciudad seleccionada en sessionStorage
                        sessionStorage.setItem('selectedCity', selectedCity);
                        alert('Ciudad seleccionada: ' + selectedCity);
                        hideModal();
                    } else {
                        alert('Por favor, seleccione una ciudad');
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
    
    // ========================================
    // FUNCIONALIDAD DEL BOTÓN CREAR TITULAR
    // ========================================
    
    // Funcionalidad del botón crear titular
    const bCrearTitular = document.getElementById('bCrearTitular');
    if (bCrearTitular) {
        bCrearTitular.addEventListener('click', function() {
            // Obtener valores del formulario
            const tipoId = document.getElementById('tTipoId').value.trim();
            const numeroId = document.getElementById('tNumeroId').value.trim();
            const nombre = document.getElementById('tNombre').value.trim();
            const direccion = document.getElementById('tDireccion').value.trim();
            const telefono = document.getElementById('tTelefono').value.trim();
            const email = document.getElementById('tEmail').value.trim();
            const factura = document.getElementById('tFactura').value.trim();
            const fechaHoy = document.getElementById('tFechaHoy').value.trim();
            const activoAsesoria = document.getElementById('tActivoAsesoria').value.trim();
            const beneficiario = document.getElementById('tBeneficiario').value.trim();
            
            // Validar campos obligatorios
            if (!tipoId || !numeroId || !nombre || !direccion || !telefono || !email || !factura || !fechaHoy || !activoAsesoria || !beneficiario) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, ingrese un correo electrónico válido.');
                return;
            }
            
            // Crear objeto de titular
            const nuevoTitular = {
                tipoId: tipoId,
                numeroId: numeroId,
                nombre: nombre,
                direccion: direccion,
                telefono: telefono,
                email: email,
                factura: factura,
                fechaHoy: fechaHoy,
                activoAsesoria: activoAsesoria,
                beneficiario: beneficiario
            };
            
            console.log('Nuevo titular a crear:', nuevoTitular);
            
            // Verificar si tiene beneficiarios
            if (beneficiario.toUpperCase() === 'SI') {
                // Si tiene beneficiarios, mostrar modal de beneficiario
                hideCreateTitularModal();
                showCreateBeneficiarioModal();
                // Guardar datos del titular temporalmente
                sessionStorage.setItem('tempTitular', JSON.stringify(nuevoTitular));
            } else {
                // Si no tiene beneficiarios, crear titular directamente
                alert('Titular creado exitosamente!');
                hideCreateTitularModal();
                
                // Agregar el nuevo titular a la tabla
                addTitularToTable(nuevoTitular);
            }
        });
    }
    
         // ========================================
     // FUNCIONALIDAD DEL BOTÓN BUSCAR TITULAR
     // ========================================
     
     // Funcionalidad del botón buscar titular
     const bBuscarTitular = document.getElementById('bBuscarTitular');
     if (bBuscarTitular) {
         bBuscarTitular.addEventListener('click', function() {
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
                  mostrarResultadosBusqueda(resultadoBusqueda);
                  // No cerrar el modal, mantenerlo abierto para mostrar resultados
              } else {
                  alert('No se encontró ningún titular con el ID: ' + titularId);
              }
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
            const nombre = document.getElementById('bNombre').value.trim();
            const direccion = document.getElementById('bDireccion').value.trim();
            const telefono = document.getElementById('bTelefono').value.trim();
            const email = document.getElementById('bEmail').value.trim();
            const activo = document.getElementById('bActivo').value.trim();
            
            // Validar campos obligatorios
            if (!tipoId || !numeroId || !nombre || !direccion || !telefono || !email || !activo) {
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
                tipoId: tipoId,
                numeroId: numeroId,
                nombre: nombre,
                direccion: direccion,
                telefono: telefono,
                email: email,
                activo: activo
            };
            
            console.log('Nuevo beneficiario a crear:', nuevoBeneficiario);
            
            // Verificar si viene del modal de titular
            const tempTitular = sessionStorage.getItem('tempTitular');
            if (tempTitular) {
                // Si viene del modal de titular, crear tanto titular como beneficiario
                const titular = JSON.parse(tempTitular);
                
                // Crear titular
                addTitularToTable(titular);
                
                // Crear beneficiario
                addBeneficiarioToTable(nuevoBeneficiario);
                
                // Limpiar datos temporales
                sessionStorage.removeItem('tempTitular');
                
                alert('Titular y beneficiario creados exitosamente!');
            } else {
                // Si no viene del modal de titular, solo crear beneficiario
                alert('Beneficiario creado exitosamente!');
                addBeneficiarioToTable(nuevoBeneficiario);
            }
            
            hideCreateBeneficiarioModal();
        });
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
    console.log('Dashboard de Titulares inicializado exitosamente');
    
    // Mostrar modal de selección de ciudad al cargar la página (simulando login)
    // Esto mostrará el modal automáticamente cuando se cargue la página
    setTimeout(showModal, 500);
    
    // ========================================
    // FUNCIONES DE GESTIÓN DE TITULARES
    // ========================================
    
    /**
     * Agrega un nuevo titular a la tabla
     * @param {Object} titular - Objeto con los datos del titular
     */
    function addTitularToTable(titular) {
        const tableBody = document.getElementById('titularesTableBody');
        const noDataRow = tableBody.querySelector('.no-data-message');
        
        if (noDataRow) {
            noDataRow.remove();
        }
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${titular.numeroId}</td>
            <td>${titular.nombre}</td>
            <td>${titular.direccion}</td>
            <td>${titular.telefono}</td>
            <td>${titular.email}</td>
            <td>
                <button class="btn btn-small" onclick="editTitular('${titular.numeroId}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteTitular('${titular.numeroId}')">
                    <i class="fas fa-trash"></i>
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
    }
    
    /**
     * Agrega un nuevo beneficiario a la tabla
     * @param {Object} beneficiario - Objeto con los datos del beneficiario
     */
    function addBeneficiarioToTable(beneficiario) {
        const tableBody = document.getElementById('beneficiariosTableBody');
        const noDataRow = tableBody.querySelector('.no-data-message');
        
        if (noDataRow) {
            noDataRow.remove();
        }
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${beneficiario.tipoId}</td>
            <td>${beneficiario.numeroId}</td>
            <td>${beneficiario.nombre}</td>
            <td>${beneficiario.direccion}</td>
            <td>${beneficiario.telefono}</td>
            <td>${beneficiario.email}</td>
            <td>${beneficiario.activo}</td>
            <td>
                <button class="btn btn-small" onclick="editBeneficiario('${beneficiario.numeroId}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteBeneficiario('${beneficiario.numeroId}')">
                    <i class="fas fa-trash"></i>
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
    }
    
}); 

// ========================================
// FUNCIONES GLOBALES DE GESTIÓN DE TITULARES
// ========================================

/**
 * Función para editar un titular
 * @param {string} identificacion - Identificación del titular a editar
 */
function editTitular(identificacion) {
    console.log('Editando titular con identificación:', identificacion);
    alert('Función de editar titular: ' + identificacion + '\n\nAquí se abriría un modal para editar el titular.');
    // TODO: Implementar funcionalidad de edición
}

/**
 * Función para eliminar un titular
 * @param {string} identificacion - Identificación del titular a eliminar
 */
function deleteTitular(identificacion) {
    console.log('Eliminando titular con identificación:', identificacion);
    if (confirm('¿Está seguro de que desea eliminar el titular con identificación ' + identificacion + '?')) {
        // Buscar y eliminar la fila de la tabla
        const tableBody = document.getElementById('titularesTableBody');
        const rows = tableBody.querySelectorAll('tr');
        
        for (let row of rows) {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent === identificacion) {
                row.remove();
                alert('Titular eliminado exitosamente');
                
                // Si no quedan titulares, mostrar mensaje de "sin datos"
                if (tableBody.children.length === 0) {
                    const noDataRow = document.createElement('tr');
                    noDataRow.innerHTML = `
                        <td colspan="6" class="no-data-message">
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
    }
}

// ========================================
// FUNCIONES GLOBALES DE GESTIÓN DE BENEFICIARIOS
// ========================================

/**
 * Función para editar un beneficiario
 * @param {string} numeroId - Número de ID del beneficiario a editar
 */
function editBeneficiario(numeroId) {
    console.log('Editando beneficiario con número de ID:', numeroId);
    alert('Función de editar beneficiario: ' + numeroId + '\n\nAquí se abriría un modal para editar el beneficiario.');
    // TODO: Implementar funcionalidad de edición
}

/**
 * Función para eliminar un beneficiario
 * @param {string} numeroId - Número de ID del beneficiario a eliminar
 */
function deleteBeneficiario(numeroId) {
    console.log('Eliminando beneficiario con número de ID:', numeroId);
    if (confirm('¿Está seguro de que desea eliminar el beneficiario con número de ID ' + numeroId + '?')) {
        // Buscar y eliminar la fila de la tabla
        const tableBody = document.getElementById('beneficiariosTableBody');
        const rows = tableBody.querySelectorAll('tr');
        
        for (let row of rows) {
            const secondCell = row.querySelector('td:nth-child(2)'); // Assuming Numero ID is the second column
            if (secondCell && secondCell.textContent === numeroId) {
                row.remove();
                alert('Beneficiario eliminado exitosamente');
                
                // Si no quedan beneficiarios, mostrar mensaje de "sin datos"
                if (tableBody.children.length === 0) {
                    const noDataRow = document.createElement('tr');
                    noDataRow.innerHTML = `
                        <td colspan="8" class="no-data-message">
                            <div class="no-data-content">
                                <i class="fas fa-user-friends"></i>
                                <p>No existen registros de beneficiarios</p>
                                <small>Haz clic en "Crear Beneficiario" para crear el primer registro</small>
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

// ========================================
// FUNCIONES GLOBALES PARA TOGGLE DE BENEFICIARIOS
// ========================================

/**
 * Función para establecer el valor del campo beneficiario
 * @param {string} valor - 'SI' o 'NO'
 */
function setBeneficiario(valor) {
    const input = document.getElementById('tBeneficiario');
    const toggleButtons = document.querySelectorAll('#createTitularModal .btn-toggle');
    
    // Limpiar estado activo de todos los botones en el modal de titular
    toggleButtons.forEach(btn => btn.classList.remove('active'));
    
    // Establecer valor en el input
    input.value = valor;
    
    // Activar el botón correspondiente
    if (valor === 'SI') {
        document.querySelector('#createTitularModal .btn-toggle-yes').classList.add('active');
    } else if (valor === 'NO') {
        document.querySelector('#createTitularModal .btn-toggle-no').classList.add('active');
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
        document.querySelector('#createBeneficiarioModal .btn-toggle-yes').classList.add('active');
    } else if (valor === 'NO') {
        document.querySelector('#createBeneficiarioModal .btn-toggle-no').classList.add('active');
    }
}



/**
 * Función para establecer la fecha actual en el campo fecha
 */
function setFechaActual() {
    const fechaInput = document.getElementById('tFechaHoy');
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
      // Buscar en la tabla de titulares existente
      const tableBody = document.getElementById('titularesTableBody');
      const rows = tableBody.querySelectorAll('tr');
      
      // Buscar en cada fila de la tabla
      for (let row of rows) {
          const cells = row.querySelectorAll('td');
          
          // Verificar que la fila tenga datos (no sea el mensaje de "no data")
          if (cells.length >= 6 && !row.querySelector('.no-data-message')) {
              const numeroId = cells[0].textContent.trim(); // Primera columna es Identificación
              
              if (numeroId === titularId) {
                  // Encontró el titular, crear objeto con los datos
                  const titular = {
                      numeroId: cells[0].textContent.trim(),
                      nombre: cells[1].textContent.trim(),
                      direccion: cells[2].textContent.trim(),
                      telefono: cells[3].textContent.trim(),
                      email: cells[4].textContent.trim(),
                      activo: 'Si' // Por defecto, ya que los titulares creados están activos
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
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
          <td>${titular.numeroId}</td>
          <td>${titular.nombre}</td>
          <td>${titular.activo}</td>
          <td>${titular.direccion}</td>
          <td>${titular.telefono}</td>
          <td>${titular.email}</td>
          <td>
              <button class="btn btn-small" onclick="editTitular('${titular.numeroId}')">
                  <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-small btn-danger" onclick="deleteTitular('${titular.numeroId}')">
                  <i class="fas fa-trash"></i>
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
      
      // Hacer scroll hacia los resultados dentro del modal
      searchResultsContainer.scrollIntoView({ behavior: 'smooth' });
  }
