/**
 * 💼 DASHBOARD ADMINISTRATIVO - CARGOS - GOLDEN APP
 * 
 * Este archivo contiene toda la funcionalidad del panel administrativo de cargos.
 * Incluye gestión de modales, formularios y operaciones CRUD básicas.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2024
 */

// Dashboard JavaScript para Cargos
document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // GESTIÓN DEL DROPDOWN DEL USUARIO
    // ========================================
    
    // Referencias a elementos del dropdown del usuario
    const userProfile = document.querySelector('.user-profile');
    const userDropdown = document.getElementById('userDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    const sidebar = document.querySelector('.sidebar');
    
    // Función para alternar el dropdown del usuario
    function toggleUserDropdown() {
        const isOpen = userDropdown.classList.contains('show');
        
        if (isOpen) {
            // Cerrar dropdown
            userDropdown.classList.remove('show');
            dropdownArrow.classList.remove('open');
            sidebar.classList.remove('dropdown-open');
        } else {
            // Abrir dropdown
            userDropdown.classList.add('show');
            dropdownArrow.classList.add('open');
            sidebar.classList.add('dropdown-open');
        }
    }
    
    // Event listener para abrir/cerrar el dropdown
    if (userProfile) {
        userProfile.addEventListener('click', toggleUserDropdown);
    }
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!userProfile.contains(e.target)) {
            userDropdown.classList.remove('show');
            dropdownArrow.classList.remove('open');
            sidebar.classList.remove('dropdown-open');
        }
    });
    
    // ========================================
    // GESTIÓN DE MODALES
    // ========================================
    
    // Referencias a los elementos de modales
    const createCargoModal = document.getElementById('createCargoModal');
    const searchCargoModal = document.getElementById('searchCargoModal');
    const createCargoForm = document.getElementById('createCargoForm');
    const searchCargoForm = document.getElementById('searchCargoForm');
    
    // ========================================
    // FUNCIONES DE MODALES
    // ========================================
    
    /**
     * Muestra el modal de crear cargo
     */
    window.showCreateCargoModal = function() {
        createCargoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Limpiar formulario
        createCargoForm.reset();
        
        // Enfocar el primer campo
        document.getElementById('cargoSeccion').focus();
    };
    
    /**
     * Cierra el modal de crear cargo
     */
    window.closeCreateCargoModal = function() {
        createCargoModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    
    /**
     * Muestra el modal de buscar cargo
     */
    window.showSearchCargoModal = function() {
        searchCargoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Limpiar formulario
        searchCargoForm.reset();
        
        // Enfocar el primer campo
        document.getElementById('searchCargoCodigo').focus();
    };
    
    /**
     * Cierra el modal de buscar cargo
     */
    window.closeSearchCargoModal = function() {
        searchCargoModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    
    // ========================================
    // GESTIÓN DE FORMULARIOS
    // ========================================
    
    /**
     * Maneja el envío del formulario de crear cargo
     */
    createCargoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtener datos del formulario
        const formData = new FormData(createCargoForm);
        const cargoData = {
            seccion: formData.get('seccion'),
            codigo: formData.get('codigo'),
            nombre: formData.get('nombre'),
            estado: 'Activo',
            fechaCreacion: new Date().toISOString()
        };
        
        // Validar datos
        if (!cargoData.seccion || !cargoData.codigo || !cargoData.nombre) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }
        
        // Crear cargo (aquí se implementaría la lógica de backend)
        createCargo(cargoData);
    });
    
    /**
     * Maneja el envío del formulario de buscar cargo
     */
    searchCargoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtener datos del formulario
        const formData = new FormData(searchCargoForm);
        const searchData = {
            codigo: formData.get('codigo'),
            nombre: formData.get('nombre'),
            seccion: formData.get('seccion')
        };
        
        // Buscar cargos (aquí se implementaría la lógica de backend)
        searchCargos(searchData);
    });
    
    // ========================================
    // OPERACIONES CRUD
    // ========================================
    
    /**
     * Crea un nuevo cargo
     * @param {Object} cargoData - Datos del cargo a crear
     */
    function createCargo(cargoData) {
        try {
            // Simular creación exitosa
            console.log('Creando cargo:', cargoData);
            
            // Aquí se haría la llamada al backend
            // const response = await fetch('/api/cargos', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(cargoData)
            // });
            
            // Por ahora, simulamos éxito
            alert('Cargo creado exitosamente!');
            
            // Cerrar modal
            closeCreateCargoModal();
            
            // Actualizar tabla (aquí se implementaría la lógica)
            // loadCargos();
            
        } catch (error) {
            console.error('Error al crear cargo:', error);
            alert('Error al crear el cargo. Por favor, inténtalo de nuevo.');
        }
    }
    
    /**
     * Busca cargos según los criterios especificados
     * @param {Object} searchData - Criterios de búsqueda
     */
    function searchCargos(searchData) {
        try {
            // Simular búsqueda
            console.log('Buscando cargos con criterios:', searchData);
            
            // Aquí se haría la llamada al backend
            // const response = await fetch('/api/cargos/search', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(searchData)
            // });
            
            // Por ahora, simulamos búsqueda
            alert('Búsqueda realizada. Los resultados se mostrarán en la tabla.');
            
            // Cerrar modal
            closeSearchCargoModal();
            
            // Actualizar tabla con resultados (aquí se implementaría la lógica)
            // displaySearchResults(results);
            
        } catch (error) {
            console.error('Error al buscar cargos:', error);
            alert('Error al realizar la búsqueda. Por favor, inténtalo de nuevo.');
        }
    }
    
    // ========================================
    // GESTIÓN DE EVENTOS
    // ========================================
    
    /**
     * Cierra modales al hacer clic fuera de ellos
     */
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    /**
     * Cierra modales con la tecla Escape
     */
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            createCargoModal.style.display = 'none';
            searchCargoModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // ========================================
    // FUNCIONES DE UTILIDAD
    // ========================================
    
    /**
     * Formatea una fecha para mostrar
     * @param {string} dateString - Fecha en formato ISO
     * @returns {string} Fecha formateada
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    /**
     * Valida que un código de cargo sea único
     * @param {string} codigo - Código a validar
     * @returns {boolean} True si es único, false si no
     */
    function validateUniqueCode(codigo) {
        // Aquí se implementaría la validación con el backend
        // Por ahora retornamos true
        return true;
    }
    
    /**
     * Limpia y valida los datos de entrada
     * @param {string} input - Texto de entrada
     * @returns {string} Texto limpio
     */
    function sanitizeInput(input) {
        return input.trim().replace(/[<>]/g, '');
    }
    
    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    console.log('Dashboard de Cargos inicializado correctamente');
    
    // Aquí se podrían cargar datos iniciales
    // loadCargos();
    
});
