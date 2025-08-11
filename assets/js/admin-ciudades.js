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
    const modal = document.getElementById('cityModal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const createCityModal = document.getElementById('createCityModal');
    const createCityModalOverlay = document.querySelector('#createCityModal.modal-overlay');
    
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
     * Limpia todos los campos del formulario de crear ciudad
     */
    function clearCreateCityForm() {
        document.getElementById('tldCodigo').value = '';
        document.getElementById('tNombre').value = '';
        document.getElementById('tDireccion').value = '';
        document.getElementById('tTelefono').value = '';
        document.getElementById('tCorreo').value = '';
    }
    
    // ========================================
    // FUNCIONES GLOBALES
    // ========================================
    
    // Hacer funciones disponibles globalmente para uso en HTML
    window.hideModal = hideModal;
    window.hideCreateCityModal = hideCreateCityModal;
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
    
    // Cerrar modal de crear ciudad al hacer clic fuera
    createCityModalOverlay.addEventListener('click', function(e) {
        if (e.target === createCityModalOverlay) {
            hideCreateCityModal();
        }
    });
    
    // Cerrar modales con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (modalOverlay.style.display === 'flex') {
                hideModal();
            }
            if (createCityModalOverlay.style.display === 'flex') {
                hideCreateCityModal();
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
                case 'Buscar Ciudad':
                    console.log('Botón Buscar Ciudad clickeado');
                    forceShowModal();
                    break;
                case 'Crear Ciudad':
                    console.log('Botón Crear Ciudad clickeado');
                    showCreateCityModal();
                    break;
                case 'Crear Filial':
                    console.log('Botón Crear Filial clickeado');
                    // Agregar funcionalidad de crear filial
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
    // FUNCIONALIDAD DEL BOTÓN CREAR CIUDAD
    // ========================================
    
    // Funcionalidad del botón crear ciudad
    const bCrear = document.getElementById('bCrear');
    if (bCrear) {
        bCrear.addEventListener('click', function() {
            // Obtener valores del formulario
            const codigo = document.getElementById('tldCodigo').value.trim();
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
            
            // Aquí normalmente enviarías los datos al backend
            // Por ahora, solo mostramos un mensaje de éxito y cerramos el modal
            alert('Ciudad creada exitosamente!');
            hideCreateCityModal();
            
            // Agregar la nueva ciudad a la tabla
            addCityToTable(nuevaCiudad);
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
    console.log('Dashboard inicializado exitosamente');
    
    // Mostrar modal de selección de ciudad al cargar la página (simulando login)
    // Esto mostrará el modal automáticamente cuando se cargue la página
    setTimeout(showModal, 500);
    
    // ========================================
    // FUNCIONES DE GESTIÓN DE CIUDADES
    // ========================================
    
    /**
     * Agrega una nueva ciudad a la tabla
     * @param {Object} ciudad - Objeto con los datos de la ciudad
     */
    function addCityToTable(ciudad) {
        const tableBody = document.getElementById('ciudadesTableBody');
        const noDataRow = tableBody.querySelector('.no-data-message');
        
        if (noDataRow) {
            noDataRow.remove();
        }
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${ciudad.codigo}</td>
            <td>${ciudad.nombre}</td>
            <td>${ciudad.correo}</td>
            <td>
                <button class="btn btn-small" onclick="editCity('${ciudad.codigo}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteCity('${ciudad.codigo}')">
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
// FUNCIONES GLOBALES DE GESTIÓN DE CIUDADES
// ========================================

/**
 * Función para editar una ciudad
 * @param {string} codigo - Código de la ciudad a editar
 */
function editCity(codigo) {
    console.log('Editando ciudad con código:', codigo);
    alert('Función de editar ciudad: ' + codigo + '\n\nAquí se abriría un modal para editar la ciudad.');
    // TODO: Implementar funcionalidad de edición
}

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
                        <td colspan="4" class="no-data-message">
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