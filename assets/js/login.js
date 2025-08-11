/**
 *  SISTEMA DE AUTENTICACIÓN - GOLDEN APP
 * 
 * Este archivo contiene toda la funcionalidad de la página de inicio de sesión.
 * Incluye validación de formularios, efectos visuales y manejo de autenticación.
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// Funcionalidad para la página de login
document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // ELEMENTOS DEL DOM
    // ========================================
    
    const loginForm = document.querySelector('.login-form');
    const inputFields = document.querySelectorAll('.input-control');
    const loginButton = document.querySelector('.login-button');

    // ========================================
    // EFECTOS DE FOCUS EN CAMPOS DE ENTRADA
    // ========================================
    
    // Efectos de focus en los campos de entrada
    inputFields.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });

    // ========================================
    // MANEJO DEL FORMULARIO DE LOGIN
    // ========================================
    
    // Manejo del formulario de login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = inputFields[0].value.trim();
        const password = inputFields[1].value.trim();
        
        // Validación básica de campos
        if (!username || !password) {
            showMessage('Por favor, complete todos los campos', 'error');
            return;
        }
        
        // Simular proceso de login con estado de carga
        loginButton.textContent = 'INICIANDO...';
        loginButton.disabled = true;
        
        // Simular delay de autenticación (1.5 segundos)
        setTimeout(() => {
            // Aquí iría la lógica real de autenticación con backend
            console.log('Intentando iniciar sesión:', { username, password });
            
            // Marcar usuario como autenticado en sessionStorage
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('username', username);
            
            // Redirigir al dashboard administrativo
            window.location.href = 'pages/admin-ciudades.html';
        }, 1500);
    });

    // ========================================
    // FUNCIONES DE UTILIDAD
    // ========================================
    
    /**
     * Muestra mensajes de notificación al usuario
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje ('error', 'success', 'info')
     */
    function showMessage(message, type = 'info') {
        // Crear elemento de mensaje
        const messageElement = document.createElement('div');
        messageElement.className = `message message--${type}`;
        messageElement.textContent = message;
        
        // Insertar después del formulario
        loginForm.appendChild(messageElement);
        
        // Remover mensaje después de 3 segundos
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }

    // ========================================
    // EFECTOS VISUALES
    // ========================================
    
    // Efectos de hover en el botón de login
    loginButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });

    loginButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });

    // ========================================
    // ANIMACIONES DE ENTRADA
    // ========================================
    
    // Animación de entrada escalonada de elementos
    const elements = document.querySelectorAll('.logo, .input-group, .login-button');
    
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });

    // Nota: Los elementos decorativos son estáticos
    // Se eliminó el efecto de parallax para que las figuras no se muevan
});

// ========================================
// ESTILOS ADICIONALES DINÁMICOS
// ========================================

// Estilos adicionales para mensajes (se pueden agregar al CSS)
const additionalStyles = `
    .message {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-weight: 500;
        text-align: center;
        animation: slideIn 0.3s ease;
    }
    
    .message--error {
        background-color: #fee2e2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }
    
    .message--success {
        background-color: #dcfce7;
        color: #16a34a;
        border: 1px solid #bbf7d0;
    }
    
    .message--info {
        background-color: #dbeafe;
        color: #2563eb;
        border: 1px solid #bfdbfe;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .input-field.focused {
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
    }
`;

// Agregar estilos adicionales al head del documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet); 