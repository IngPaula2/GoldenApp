// Funcionalidad para la página de login

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    const inputFields = document.querySelectorAll('.input-control');
    const loginButton = document.querySelector('.login-button');

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

    // Manejo del formulario de login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = inputFields[0].value.trim();
        const password = inputFields[1].value.trim();
        
        // Validación básica
        if (!username || !password) {
            showMessage('Por favor, complete todos los campos', 'error');
            return;
        }
        
        // Simular proceso de login
        loginButton.textContent = 'INICIANDO...';
        loginButton.disabled = true;
        
        // Simular delay de autenticación
        setTimeout(() => {
            // Aquí iría la lógica real de autenticación
            console.log('Intentando iniciar sesión:', { username, password });
            
            // Marcar como autenticado
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('username', username);
            
            // Redirigir al dashboard
            window.location.href = 'pages/admin-ciudades.html';
        }, 1500);
    });

    // Función para mostrar mensajes
    function showMessage(message, type = 'info') {
        // Crear elemento de mensaje
        const messageElement = document.createElement('div');
        messageElement.className = `message message--${type}`;
        messageElement.textContent = message;
        
        // Insertar después del formulario
        loginForm.appendChild(messageElement);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }

    // Efectos de hover en el botón
    loginButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });

    loginButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });

    // Animación de entrada de elementos
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

    // Los elementos decorativos ahora son estáticos
    // Se eliminó el efecto de parallax para que las figuras no se muevan
});

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

// Agregar estilos adicionales al head
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet); 