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
    
    /**
     * Oculta el modal de crear titular y limpia el formulario
     */
    function hideCreateTitularModal() {
        createTitularModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Limpiar campos del formulario
        clearCreateTitularForm();
    }
    
         // Las funciones de modales ahora están definidas globalmente fuera del scope
    
    /**
     * Limpia todos los campos del formulario de crear titular
     */
    function clearCreateTitularForm() {
        document.getElementById('cTipo_Id').value = '';
        document.getElementById('tId').value = '';
        document.getElementById('tNombre1').value = '';
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
     window.showCreateBeneficiarioModal = showCreateBeneficiarioModal;
    
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
     
     // Cerrar modal de buscar beneficiario al hacer clic fuera
     searchBeneficiarioModalOverlay.addEventListener('click', function(e) {
         if (e.target === searchBeneficiarioModalOverlay) {
             hideSearchBeneficiarioModal();
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
             if (searchBeneficiarioModalOverlay.style.display === 'flex') {
                 hideSearchBeneficiarioModal();
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
                    showSearchBeneficiarioModal();
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
    const bCrear = document.getElementById('bCrear');
    if (bCrear) {
        bCrear.addEventListener('click', function() {
            // Obtener valores del formulario
            const tipoId = document.getElementById('cTipo_Id').value.trim();
            const numeroId = document.getElementById('tId').value.trim();
            const nombre = document.getElementById('tNombre1').value.trim();
            const direccion = document.getElementById('tDireccion').value.trim();
            const barrio = document.getElementById('tBarrioT').value.trim();
            const celular = document.getElementById('tCelular').value.trim();
            const correo = document.getElementById('tCorreo').value.trim();
            const fechaIngreso = document.getElementById('tFecha_Ingreso').value.trim();
            const activo = document.getElementById('cActivo').value.trim();
            const beneficiario = document.getElementById('cBeneficiario').value.trim();
            
            // Validar campos obligatorios
            if (!tipoId || !numeroId || !nombre || !direccion || !barrio || !celular || !correo || !fechaIngreso || !activo || !beneficiario) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                alert('Por favor, ingrese un correo electrónico válido.');
                return;
            }
            
            // Crear objeto de titular
            const nuevoTitular = {
                tipoId: tipoId,
                numeroId: numeroId,
                nombre: nombre,
                direccion: direccion,
                barrio: barrio,
                celular: celular,
                correo: correo,
                fechaIngreso: fechaIngreso,
                activo: activo,
                beneficiario: beneficiario
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
                        const firstCell = row.querySelector('td');
                        if (firstCell && firstCell.textContent === originalId) {
                            row.remove();
                            break;
                        }
                    }
                }
            }
            
            // Si marcó beneficiario = SI y es creación, abrir modal de beneficiario y NO crear aún el titular
            if (beneficiario.toUpperCase() === 'SI' && !isUpdate) {
                // Guardar datos del titular temporalmente
                sessionStorage.setItem('tempTitular', JSON.stringify(nuevoTitular));
                // Cambiar de modal
                hideCreateTitularModal();
                showCreateBeneficiarioModal();
                return;
            }

            // Aquí normalmente enviarías los datos al backend
            // Por ahora, persistimos en memoria
            titularesData[numeroId] = nuevoTitular;

            alert(isUpdate ? 'Titular actualizado exitosamente!' : 'Titular creado exitosamente!');
            hideCreateTitularModal();
            
            // Agregar o actualizar el titular en la tabla
            addTitularToTable(nuevoTitular, isUpdate);
            
            // Limpiar el atributo de ID original
            document.getElementById('tId').removeAttribute('data-original-id');
            
                         // Resetear el título y texto del botón
             document.getElementById('createTitularTitle').textContent = 'CREAR TITULAR';
             document.getElementById('bCrear').textContent = 'Crear';
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
            const resultadoBusqueda = buscarBeneficiario(beneficiarioId);
            
                                                   if (resultadoBusqueda) {
                  // Mostrar resultados de búsqueda
                  renderBeneficiarioSearchResults(resultadoBusqueda);
                  hideSearchBeneficiarioModal();
                  showBeneficiarioResultsModal();
              } else {
                  // Mostrar mensaje de no encontrado
                  renderBeneficiarioSearchResults(null);
                  hideSearchBeneficiarioModal();
                  showBeneficiarioResultsModal();
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
            
            // Determinar si es crear o actualizar basado en el texto del botón
            const isUpdate = document.getElementById('bCrearBeneficiario').textContent === 'Actualizar';
            
            // Verificar si viene del modal de titular
            const tempTitular = sessionStorage.getItem('tempTitular');
            // Verificar si viene desde "Añadir Beneficiario" en resultados
            const titularFromResults = sessionStorage.getItem('currentSearchedTitularId');
            
            if (tempTitular) {
                // Si viene del modal de titular, crear tanto titular como beneficiario
                const titular = JSON.parse(tempTitular);
                
                // Persistir titular en memoria y tabla
                titularesData[titular.numeroId] = titular;
                addTitularToTable(titular, true);
                
                // Persistir beneficiario y asociarlo al titular
                addBeneficiarioToTable(nuevoBeneficiario);
                if (!titularIdToBeneficiarios[titular.numeroId]) {
                    titularIdToBeneficiarios[titular.numeroId] = [];
                }
                titularIdToBeneficiarios[titular.numeroId].push(nuevoBeneficiario);
                
                // Limpiar datos temporales
                sessionStorage.removeItem('tempTitular');
                
                alert('Titular y beneficiario creados exitosamente!');
            } else if (titularFromResults) {
                // Asociar a titular buscado desde resultados
                const titularId = titularFromResults;
                if (!titularIdToBeneficiarios[titularId]) {
                    titularIdToBeneficiarios[titularId] = [];
                }
                
                if (isUpdate) {
                    // Es una actualización - verificar si el ID cambió
                    const originalId = document.getElementById('bNumeroId').getAttribute('data-original-id');
                    if (originalId && originalId !== numeroId) {
                        // El ID cambió - eliminar el beneficiario anterior
                        const index = titularIdToBeneficiarios[titularId].findIndex(b => b.numeroId === originalId);
                        if (index > -1) {
                            titularIdToBeneficiarios[titularId].splice(index, 1);
                        }
                    }
                    // Actualizar o agregar el beneficiario
                    const existingIndex = titularIdToBeneficiarios[titularId].findIndex(b => b.numeroId === (originalId || numeroId));
                    if (existingIndex > -1) {
                        titularIdToBeneficiarios[titularId][existingIndex] = nuevoBeneficiario;
                    } else {
                        titularIdToBeneficiarios[titularId].push(nuevoBeneficiario);
                    }
                    alert('Beneficiario actualizado exitosamente!');
                } else {
                    // Es una creación
                    titularIdToBeneficiarios[titularId].push(nuevoBeneficiario);
                    alert('Beneficiario creado exitosamente!');
                }
                
                addBeneficiarioToTable(nuevoBeneficiario);
                
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
        
        const rowHtml = `
            <td>${titular.tipoId || ''}</td>
            <td>${titular.numeroId}</td>
            <td>${titular.nombre}</td>
            <td>${titular.direccion || ''}</td>
            <td>${titular.barrio || ''}</td>
            <td>${titular.celular || titular.telefono || ''}</td>
            <td>${titular.correo || titular.email || ''}</td>
            <td>
                <button class="btn btn-small" onclick="editTitular('${titular.numeroId}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteTitular('${titular.numeroId}')">
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
        
        // Asegurar que el modal de crear beneficiario esté por encima de otros modales
        createBeneficiarioModalOverlay.style.zIndex = '9999';
        createBeneficiarioModalOverlay.style.display = 'flex';
        
        // No cambiar el overflow del body para mantener otros modales
        // document.body.style.overflow = 'hidden';
        
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
        createBeneficiarioModalOverlay.style.display = 'none';
        
        // Restaurar z-index por defecto
        createBeneficiarioModalOverlay.style.zIndex = '';
        
        // Verificar si hay otros modales abiertos
        const titularResultsModal = document.getElementById('titularResultsModal');
        const searchTitularModal = document.getElementById('searchTitularModal');
        
        // Si no hay otros modales abiertos, restaurar overflow
        if (!titularResultsModal || titularResultsModal.style.display !== 'flex') {
            if (!searchTitularModal || searchTitularModal.style.display !== 'flex') {
                document.body.style.overflow = 'auto';
            }
        }
        
        // Limpiar campos del formulario
        if (typeof clearCreateBeneficiarioForm === 'function') {
            clearCreateBeneficiarioForm();
        }
        
        console.log('Modal de crear beneficiario cerrado');
    }
}

/**
 * Muestra el modal para crear un nuevo titular
 */
function showCreateTitularModal() {
    const createTitularModalOverlay = document.getElementById('createTitularModal');
    if (createTitularModalOverlay) {
        // Asegurar que el modal de crear titular esté por encima de otros modales
        createTitularModalOverlay.style.zIndex = '9999';
        createTitularModalOverlay.style.display = 'flex';
        
        // No cambiar el overflow del body para mantener otros modales
        // document.body.style.overflow = 'hidden';
        
        console.log('✅ Modal de crear titular abierto correctamente');
    } else {
        console.log('❌ ERROR: No se encontró el modal createTitularModal');
    }
}

/**
 * Muestra el modal para buscar titular
 */
function showSearchTitularModal() {
    const searchTitularModalOverlay = document.getElementById('searchTitularModal');
    if (searchTitularModalOverlay) {
        searchTitularModalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta el modal de buscar titular y limpia el formulario
 */
function hideSearchTitularModal() {
    const searchTitularModalOverlay = document.getElementById('searchTitularModal');
    if (searchTitularModalOverlay) {
        searchTitularModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
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

/**
 * Muestra el modal de búsqueda de beneficiario
 */
function showSearchBeneficiarioModal() {
    const searchBeneficiarioModalOverlay = document.getElementById('searchBeneficiarioModal');
    if (searchBeneficiarioModalOverlay) {
        searchBeneficiarioModalOverlay.style.display = 'flex';
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
        searchBeneficiarioModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Muestra el modal de resultados de búsqueda de titular
 */
function showTitularResultsModal() {
    const modal = document.getElementById('titularResultsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta el modal de resultados de búsqueda de titular
 */
function hideTitularResultsModal() {
    const modal = document.getElementById('titularResultsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Muestra el modal de resultados de búsqueda de beneficiario
 */
function showBeneficiarioResultsModal() {
    const modal = document.getElementById('beneficiarioResultsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta el modal de resultados de búsqueda de beneficiario
 */
function hideBeneficiarioResultsModal() {
    const modal = document.getElementById('beneficiarioResultsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Limpia todos los campos del formulario de crear beneficiario
 */
function clearCreateBeneficiarioForm() {
    const bTipoId = document.getElementById('bTipoId');
    const bNumeroId = document.getElementById('bNumeroId');
    const bNombre = document.getElementById('bNombre');
    const bDireccion = document.getElementById('bDireccion');
    const bTelefono = document.getElementById('bTelefono');
    const bEmail = document.getElementById('bEmail');
    const bActivo = document.getElementById('bActivo');
    
    if (bTipoId) bTipoId.value = '';
    if (bNumeroId) bNumeroId.value = '';
    if (bNombre) bNombre.value = '';
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

/**
 * Función para editar un titular
 * Abre el modal de crear titular en modo actualizar
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
    
    // Llenar los campos con los datos del titular (nueva nomenclatura)
    document.getElementById('cTipo_Id').value = titular.tipoId || 'CC';
    document.getElementById('tId').value = titular.numeroId || '';
    document.getElementById('tNombre1').value = titular.nombre || '';
    document.getElementById('tDireccion').value = titular.direccion || '';
    document.getElementById('tBarrioT').value = titular.barrio || '';
    document.getElementById('tCelular').value = titular.celular || titular.telefono || '';
    document.getElementById('tCorreo').value = titular.correo || titular.email || '';
    document.getElementById('tFecha_Ingreso').value = titular.fechaIngreso || new Date().toISOString().split('T')[0];
    document.getElementById('cActivo').value = titular.activo || 'SI';
    document.getElementById('cBeneficiario').value = titular.beneficiario || 'NO';
    
    // Cambiar el título y texto del botón
    document.getElementById('createTitularTitle').textContent = 'ACTUALIZAR TITULAR';
    // Usamos el mismo botón principal cambiando el texto
    document.getElementById('bCrear').textContent = 'Actualizar';
    // Si existe un botón bActualizar, lo vinculamos para que dispare el mismo flujo
    const bActualizar = document.getElementById('bActualizar');
    if (bActualizar) {
        bActualizar.style.display = 'inline-block';
        bActualizar.onclick = function() { document.getElementById('bCrear').click(); };
    }
    
    // Guardar el ID original para poder eliminarlo después si cambia
    document.getElementById('tId').setAttribute('data-original-id', identificacion);
    
    // Abrir modal de crear/actualizar SIN cerrar el modal de resultados
    if (typeof showCreateTitularModal === 'function') {
    showCreateTitularModal();
    }
    
    console.log('Modal de editar titular abierto con datos cargados');
}

/**
 * Función para eliminar un titular
 * @param {string} identificacion - Identificación del titular a eliminar
 */
function deleteTitular(identificacion) {
    console.log('Eliminando titular con identificación:', identificacion);
    if (confirm('¿Está seguro de que desea eliminar el titular con identificación ' + identificacion + '?')) {
        // Buscar y eliminar la fila de la tabla de titulares
        const tableBody = document.getElementById('titularesTableBody');
        const rows = tableBody.querySelectorAll('tr');
        
        for (let row of rows) {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent === identificacion) {
                row.remove();
                
                // Eliminar de los datos en memoria
                deleteTitularFromData(identificacion);
                
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
    
    // Buscar el beneficiario en los datos existentes
    const beneficiario = buscarBeneficiario(numeroId);
    if (!beneficiario) {
        alert('No se encontró el beneficiario con identificación ' + numeroId);
        return;
    }
    
    // Llenar los campos con los datos del beneficiario
    document.getElementById('bTipoId').value = beneficiario.tipoId || 'CC';
    document.getElementById('bNumeroId').value = beneficiario.numeroId;
    document.getElementById('bNombre').value = beneficiario.nombre;
    document.getElementById('bDireccion').value = beneficiario.direccion || '';
    document.getElementById('bTelefono').value = beneficiario.telefono || '';
    document.getElementById('bEmail').value = beneficiario.email || '';
    document.getElementById('bActivo').value = beneficiario.activo || 'SI';
    
    // Cambiar el título y texto del botón
    const modalTitle = document.querySelector('#createBeneficiarioModal .modal-title');
    const createButton = document.getElementById('bCrearBeneficiario');
    
    if (modalTitle) {
        modalTitle.textContent = 'ACTUALIZAR BENEFICIARIO';
    }
    
    if (createButton) {
        createButton.textContent = 'Actualizar';
    }
    
    // Guardar el ID original para poder eliminarlo después si cambia
    document.getElementById('bNumeroId').setAttribute('data-original-id', numeroId);
    
    // Abrir modal de crear/actualizar SIN cerrar el modal de resultados
    if (typeof showCreateBeneficiarioModal === 'function') {
        showCreateBeneficiarioModal();
    }
    
    console.log('Modal de editar beneficiario abierto con datos cargados');
}

/**
 * Función para eliminar un beneficiario
 * @param {string} numeroId - Número de ID del beneficiario a eliminar
 */
function deleteBeneficiario(numeroId) {
    console.log('Eliminando beneficiario con número de ID:', numeroId);
    if (confirm('¿Está seguro de que desea eliminar el beneficiario con número de ID ' + numeroId + '?')) {
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
        
        // También eliminar de la tabla de resultados de titular si está abierta
        const titularResultsBody = document.getElementById('titularBeneficiariosResultsBody');
        if (titularResultsBody) {
            const titularRows = titularResultsBody.querySelectorAll('tr');
            for (let row of titularRows) {
                const firstCell = row.querySelector('td');
                if (firstCell && firstCell.textContent === numeroId) {
                    row.remove();
                    break;
                }
            }
            
            // Si no quedan beneficiarios en la tabla de resultados, mostrar mensaje
            if (titularResultsBody.children.length === 0) {
                const noDataRow = document.createElement('tr');
                noDataRow.innerHTML = `
                    <td colspan="7" class="no-data-message">
                        <div class="no-data-content">
                            <i class="fas fa-user-friends"></i>
                            <p>Este titular no tiene beneficiarios</p>
                        </div>
                    </td>
                `;
                titularResultsBody.appendChild(noDataRow);
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
        
        alert('Beneficiario eliminado exitosamente');
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
    const input = document.getElementById('cBeneficiario');
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

  // Renderizar beneficiarios asociados al titular en el modal de resultados
  function renderBeneficiariosDeTitular(titularId) {
      const body = document.getElementById('titularBeneficiariosResultsBody');
      if (!body) {
          console.log('No se encontró el elemento titularBeneficiariosResultsBody');
          return;
      }
      
      body.innerHTML = '';
      const lista = titularIdToBeneficiarios[titularId] || [];
      
      console.log('Renderizando beneficiarios para titular:', titularId, 'Cantidad:', lista.length);
      
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
          const tr = document.createElement('tr');
          tr.innerHTML = `
              <td>${b.tipoId || 'CC'}</td>
              <td>${b.numeroId}</td>
              <td>${b.nombre}</td>
              <td>${b.direccion}</td>
              <td>${b.telefono}</td>
              <td>${b.email}</td>
              <td>${b.activo}</td>
              <td>
                  <button class="btn btn-small" onclick="editBeneficiario('${b.numeroId}')">
                      <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-small btn-danger" onclick="deleteBeneficiario('${b.numeroId}')">
                      <i class="fas fa-trash"></i>
                  </button>
              </td>
          `;
          body.appendChild(tr);
      });
      
      console.log('Beneficiarios renderizados exitosamente');
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
      const row = document.createElement('tr');
      row.innerHTML = `
          <td>${titular.numeroId}</td>
          <td>${titular.nombre}</td>
          <td>${titular.activo}</td>
          <td>${titular.direccion}</td>
          <td>${titular.celular || ''}</td>
          <td>${titular.correo || ''}</td>
          <td>
              <button class="btn btn-small" onclick="editTitular('${titular.numeroId}')">
                  <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-small btn-danger" onclick="deleteTitular('${titular.numeroId}')">
                  <i class="fas fa-trash"></i>
              </button>
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
  
  /**
   * Función para buscar beneficiario por ID
   * @param {string} beneficiarioId - ID del beneficiario a buscar
   * @returns {Object|null} - Objeto del beneficiario encontrado o null
   */
  function buscarBeneficiario(beneficiarioId) {
      // Buscar en la tabla de beneficiarios
      const tableBody = document.getElementById('beneficiariosTableBody');
      const rows = tableBody.querySelectorAll('tr');
      
      // Buscar en cada fila de la tabla
      for (let row of rows) {
          const cells = row.querySelectorAll('td');
          
          // Verificar que la fila tenga datos (no sea el mensaje de "no data")
          if (cells.length >= 7 && !row.querySelector('.no-data-message')) {
              const numeroId = cells[1].textContent.trim(); // Segunda columna es Número ID
              
              if (numeroId === beneficiarioId) {
                  // Encontró el beneficiario, crear objeto con los datos
                  const beneficiario = {
                      tipoId: cells[0].textContent.trim(),
                      numeroId: cells[1].textContent.trim(),
                      nombre: cells[2].textContent.trim(),
                      direccion: cells[3].textContent.trim(),
                      telefono: cells[4].textContent.trim(),
                      email: cells[5].textContent.trim(),
                      activo: cells[6].textContent.trim()
                  };
                  
                  return beneficiario;
              }
          }
      }
      
      // Si no se encuentra en la tabla, buscar en datos de ejemplo
      const beneficiariosEjemplo = [
          {
              tipoId: 'CC',
              numeroId: '1028562327',
              nombre: 'ANA GIRALDO',
              direccion: 'LA CASTELLANA',
              telefono: '87654322',
              email: 'ana@ejemplo.com',
              activo: 'Si'
          }
      ];
      
      // Buscar el beneficiario por ID en los datos de ejemplo
      const beneficiarioEncontrado = beneficiariosEjemplo.find(beneficiario => beneficiario.numeroId === beneficiarioId);
      
      return beneficiarioEncontrado || null;
  }
  
  /**
   * Función para renderizar resultados de búsqueda de beneficiario
   * @param {Object} beneficiario - Objeto del beneficiario encontrado o null
   */
  function renderBeneficiarioSearchResults(beneficiario) {
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
      const row = document.createElement('tr');
      row.innerHTML = `
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
          </td>`;
      body.appendChild(row);
  }

// ========================================
// DATOS EN MEMORIA
// ========================================
const titularesData = {};
const beneficiariosData = {};
// Mapa de relación: titularId -> array de beneficiarios
const titularIdToBeneficiarios = {};
// Último titular buscado (para "Añadir Beneficiario")
let currentSearchedTitularId = null;

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Función para eliminar un titular de los datos en memoria
 * @param {string} identificacion - Identificación del titular a eliminar
 */
function deleteTitularFromData(identificacion) {
    delete titularesData[identificacion];
}

/**
 * Función para eliminar un beneficiario de los datos en memoria
 * @param {string} numeroId - Número de ID del beneficiario a eliminar
 */
function deleteBeneficiarioFromData(numeroId) {
    delete beneficiariosData[numeroId];
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
                } else if (onclick && onclick.includes('deleteBeneficiario')) {
                    e.preventDefault();
                    const id = onclick.match(/deleteBeneficiario\('([^']+)'\)/)[1];
                    deleteBeneficiario(id);
                }
            }
        });
    });
    
    // ========================================
    // FUNCIONES GLOBALES EXPUESTAS
    // ========================================

// Exponer funciones para uso en HTML onclick
window.showCreateTitularModal = showCreateTitularModal;
window.hideCreateTitularModal = hideCreateTitularModal;
window.showSearchTitularModal = showSearchTitularModal;
window.hideSearchTitularModal = hideSearchTitularModal;
window.showCreateTitularModal = showCreateTitularModal;
window.showCreateBeneficiarioModal = showCreateBeneficiarioModal;
window.hideCreateBeneficiarioModal = hideCreateBeneficiarioModal;
window.showSearchBeneficiarioModal = showSearchBeneficiarioModal;
window.hideSearchBeneficiarioModal = hideSearchBeneficiarioModal;
window.showTitularResultsModal = showTitularResultsModal;
window.hideTitularResultsModal = hideTitularResultsModal;
window.showBeneficiarioResultsModal = showBeneficiarioResultsModal;
window.hideBeneficiarioResultsModal = hideBeneficiarioResultsModal;
window.editTitular = editTitular;
window.editBeneficiario = editBeneficiario;
window.deleteTitular = deleteTitular;
window.deleteBeneficiario = deleteBeneficiario;
window.setBeneficiario = setBeneficiario;
window.setBeneficiarioActivo = setBeneficiarioActivo;
window.addBeneficiarioForCurrentTitular = addBeneficiarioForCurrentTitular;
window.clearCreateBeneficiarioForm = clearCreateBeneficiarioForm;

// Debug: verificar que las funciones estén disponibles
console.log('Funciones expuestas:', {
    editTitular: typeof window.editTitular,
    editBeneficiario: typeof window.editBeneficiario,
    deleteTitular: typeof window.deleteTitular,
    deleteBeneficiario: typeof window.deleteBeneficiario,
    addBeneficiarioForCurrentTitular: typeof window.addBeneficiarioForCurrentTitular
});

// Verificar que la función esté disponible
if (typeof window.addBeneficiarioForCurrentTitular === 'function') {
    console.log('✅ Función addBeneficiarioForCurrentTitular está disponible globalmente');
} else {
    console.log('❌ ERROR: Función addBeneficiarioForCurrentTitular NO está disponible');
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

// Exponer función de prueba
window.testCreateBeneficiarioModal = testCreateBeneficiarioModal;

// Verificación final de carga
console.log('📦 Script admin-titulares.js cargado completamente');
console.log('🔍 Verificando funciones globales...');
console.log('- addBeneficiarioForCurrentTitular:', typeof window.addBeneficiarioForCurrentTitular);
console.log('- showCreateBeneficiarioModal:', typeof window.showCreateBeneficiarioModal);
console.log('- hideTitularResultsModal:', typeof window.hideTitularResultsModal);
console.log('- showTitularResultsModal:', typeof window.showTitularResultsModal);
console.log('- hideSearchTitularModal:', typeof window.hideSearchTitularModal);
console.log('- showSearchTitularModal:', typeof window.showSearchTitularModal);
