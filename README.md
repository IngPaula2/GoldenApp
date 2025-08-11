# Golden Bridge - Aplicación Web

## Descripción

Golden Bridge es una aplicación web de gestión empresarial que incluye un sistema de autenticación y un dashboard administrativo completo.

## Características

### Página de Login
- Diseño moderno y elegante con efectos visuales
- Validación de formularios
- Animaciones suaves y efectos de hover
- Redirección automática al dashboard después del login

### Dashboard Principal
- **Sidebar de navegación** con:
  - Perfil de usuario (Auxiliar Admin)
  - Menú de navegación principal (Administrativo, Facturación, Tesorería, etc.)
  - Logo de Golden Bridge

- **Barra de navegación superior** con pestañas:
  - Ciudades (activa por defecto)
  - Titulares
  - Cargos
  - Empleados
  - Organizaciones
  - Planes
  - Consecutivos
  - Control de Consecutivos

- **Área de contenido principal** con:
  - Sección de Ciudades con tabla de datos
  - Sección de Filiales con tabla de datos
  - Botones de acción (Buscar Ciudad, Crear Ciudad, Crear Filial)

- **Modal de selección de ciudad** con:
  - Dropdown para seleccionar ciudad
  - Botón de confirmación

## Estructura del Proyecto

```
GoldenApp/
├── index.html              # Página principal
├── pages/
│   ├── login.html          # Página de login
│   └── dashboard.html      # Dashboard principal
├── assets/
│   ├── css/
│   │   ├── reset.css       # Reset de estilos
│   │   ├── main.css        # Estilos principales
│   │   ├── login.css       # Estilos del login
│   │   └── dashboard.css   # Estilos del dashboard
│   ├── js/
│   │   ├── login.js        # Funcionalidad del login
│   │   └── dashboard.js    # Funcionalidad del dashboard
│   └── images/
│       └── LOGO GOLDEN BRIDGE SIN FONDO OF.png
└── README.md
```

## Cómo Usar

### 1. Iniciar el Servidor
```bash
# Navegar al directorio del proyecto
cd GoldenApp

# Iniciar servidor HTTP (Python)
python -m http.server 8000

# O usar cualquier servidor web local
```

### 2. Acceder a la Aplicación
1. Abrir el navegador
2. Ir a `http://localhost:8000`
3. Hacer clic en "Iniciar Sesión" o ir directamente a `http://localhost:8000/pages/login.html`

### 3. Login
- Usuario: Cualquier texto
- Contraseña: Cualquier texto
- Hacer clic en "INICIAR SESIÓN"
- La aplicación redirigirá automáticamente al dashboard

### 4. Navegar por el Dashboard
- **Sidebar**: Hacer clic en los elementos del menú para navegar
- **Pestañas superiores**: Cambiar entre diferentes secciones
- **Botones de acción**: Crear, buscar o editar elementos
- **Modal**: Aparece automáticamente para seleccionar ciudad

## Características Técnicas

### Diseño Responsivo
- Adaptable a diferentes tamaños de pantalla
- Sidebar colapsable en dispositivos móviles
- Navegación optimizada para móviles

### Interactividad
- Efectos hover en botones y enlaces
- Animaciones suaves en transiciones
- Modal funcional con backdrop blur
- Navegación dinámica entre secciones

### Estilos
- Paleta de colores dorada (#ffd700) como color principal
- Tipografía Inter para mejor legibilidad
- Iconos Font Awesome
- Diseño moderno y profesional

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con Flexbox y Grid
- **JavaScript ES6+**: Funcionalidad interactiva
- **Font Awesome**: Iconos
- **Google Fonts**: Tipografía Inter

## Funcionalidades Implementadas

### Login
- ✅ Validación de formularios
- ✅ Efectos visuales y animaciones
- ✅ Redirección al dashboard
- ✅ Almacenamiento de sesión

### Dashboard
- ✅ Sidebar de navegación funcional
- ✅ Barra de navegación superior
- ✅ Tablas de datos interactivas
- ✅ Modal de selección de ciudad
- ✅ Diseño responsivo
- ✅ Efectos hover y animaciones

## Próximas Mejoras

- [ ] Integración con backend real
- [ ] Sistema de autenticación seguro
- [ ] Base de datos para ciudades y filiales
- [ ] Funcionalidad CRUD completa
- [ ] Notificaciones en tiempo real
- [ ] Temas personalizables
- [ ] Exportación de datos
- [ ] Reportes y estadísticas

## Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Golden Bridge** - Sistema de Gestión Empresarial 