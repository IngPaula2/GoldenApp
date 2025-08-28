#  DOCUMENTACIÓN COMPLETA - GOLDEN APP

##  ESTRUCTURA DEL PROYECTO

```
GoldenApp-main/
├── assets/
│   ├── css/
│   │   ├── admin-ciudades.css
│   │   ├── admin-titulares.css
│   │   ├── dashboard-base.css
│   │   ├── login.css
│   │   ├── main.css
│   │   └── reset.css
│   ├── images/
│   │   ├── FIGURA IZQUIERA SUPERIOR.jpg
│   │   └── LOGO GOLDEN BRIDGE SIN FONDO OF.png
│   └── js/
│       ├── admin-ciudades.js
│       ├── admin-titulares.js
│       └── login.js
├── pages/
│   ├── admin-ciudades.html
│   ├── admin-titulares.html
│   └── login.html
├── docs/
│   └── DOCUMENTACION.md
├── templates/
│   └── search-modal-template.html
├── index.html
├── README.md
└── DOCUMENTACION.md (este archivo)
```

---

## ARCHIVOS HTML

###  `index.html` - Página Principal
**Descripción:** Página de inicio/landing de la aplicación Golden Bridge.

**Funcionalidades:**
- Página de bienvenida
- Navegación a login
- Presentación de la marca Golden Bridge

**Elementos principales:**
- Logo de Golden Bridge
- Enlaces de navegación
- Diseño responsivo

---

###  `pages/login.html` - Página de Inicio de Sesión
**Descripción:** Formulario de autenticación para usuarios del sistema.

**Funcionalidades:**
- Formulario de login con validación
- Campos: Usuario y Contraseña
- Validación de credenciales
- Redirección al dashboard

**Estructura:**
```html
- Formulario de login
- Campos de entrada
- Botón de envío
- Validación JavaScript
```

**Archivos relacionados:**
- `assets/css/login.css` - Estilos del login
- `assets/js/login.js` - Funcionalidad del login

---

###  `pages/admin-ciudades.html` - Dashboard Administrativo
**Descripción:** Panel principal de administración con gestión de ciudades y filiales.

**Funcionalidades principales:**
- Sidebar de navegación
- Barra superior de secciones
- Gestión de ciudades
- Gestión de filiales
- Modales de interacción

**Secciones:**
1. **Sidebar:** Navegación principal
2. **Top Navigation:** Pestañas de secciones
3. **Content Area:** Tablas de datos
4. **Modales:** Interacciones de usuario

---

###  `pages/admin-titulares.html` - Gestión de Titulares y Beneficiarios
**Descripción:** Panel completo de administración para gestión de titulares y sus beneficiarios asociados.

**Funcionalidades principales:**
- Gestión completa de titulares (CRUD)
- Gestión de beneficiarios por titular
- Búsqueda avanzada de titulares
- Modales superpuestos para creación/edición
- Selectores de tipo de documento colombiano

**Secciones principales:**
1. **Gestión de Titulares:**
   - Crear titular con formulario completo
   - Buscar titular por ID
   - Editar información de titular
   - Eliminar titular

2. **Gestión de Beneficiarios:**
   - Añadir beneficiarios a titular existente
   - Editar beneficiarios
   - Eliminar beneficiarios
   - Visualizar lista de beneficiarios por titular

3. **Tipos de Documento Colombiano:**
   - Cédula de Ciudadanía (CC)
   - Cédula de Extranjería (CE)
   - Pasaporte (PA)
   - Tarjeta de Identidad (TI)
   - Registro Civil (RC)
   - NIT
   - RUT
   - Permiso Permanente (PPT)
   - Permiso Especial de Permanencia (PEP)
   - Documento de Extranjería (DE)

**Características técnicas:**
- Modales con z-index controlado para superposición
- Gestión de estado con sessionStorage
- Validación de formularios
- Interfaz responsive
- Botones de acción con iconos

---

## ARCHIVOS CSS

###  `assets/css/reset.css` - Reset de Estilos
**Descripción:** Normalización de estilos CSS para consistencia entre navegadores.

**Funcionalidades:**
- Reset de márgenes y padding
- Normalización de elementos HTML
- Configuración base de tipografía
- Eliminación de estilos por defecto del navegador

---

###  `assets/css/main.css` - Estilos Principales

---

###  `assets/css/admin-titulares.css` - Estilos para Gestión de Titulares
**Descripción:** Estilos específicos para la página de administración de titulares y beneficiarios.

**Funcionalidades principales:**
- Estilos para modales superpuestos
- Control de z-index para layering
- Estilos para formularios de titular y beneficiario
- Botones toggle para campos booleanos
- Responsive design para tablas de datos
- Animaciones y transiciones suaves

**Características destacadas:**
- **Z-index controlado:** Modales con valores específicos (9997-9999)
- **Botones toggle:** Estilos para campos Si/No con animaciones
- **Tablas responsivas:** Adaptación para dispositivos móviles
- **Modales grandes:** Soporte para formularios complejos
- **Estados visuales:** Loading, error, success states

---

###  `assets/css/dashboard-base.css` - Estilos Base del Dashboard
**Descripción:** Estilos base compartidos entre diferentes páginas del dashboard.

**Funcionalidades:**
- Estilos base para sidebar
- Navegación principal
- Componentes comunes del dashboard
- Variables CSS compartidas
**Descripción:** Estilos base y componentes reutilizables de la aplicación.

**Contenido:**
- Variables CSS (colores, fuentes)
- Estilos base de componentes
- Utilidades CSS
- Configuraciones globales

---

###  `assets/css/login.css` - Estilos del Login
**Descripción:** Estilos específicos para la página de inicio de sesión.

**Características:**
- Diseño centrado y minimalista
- Formulario con efectos visuales
- Responsive design
- Animaciones de transición

**Elementos estilizados:**
- Contenedor principal del login
- Campos de formulario
- Botón de envío
- Mensajes de error/éxito

---

###  `assets/css/admin-ciudades.css` - Estilos del Dashboard
**Descripción:** Estilos completos para el panel administrativo de ciudades.

**Componentes principales:**

#### 1. **Layout Principal**
```css
.dashboard-page {
    display: flex;
    min-height: 100vh;
    background-color: #f5f5f5;
}
```

#### 2. **Sidebar**
- Ancho fijo de 280px
- Gradiente de fondo
- Navegación vertical
- Perfil de usuario con dropdown

#### 3. **Contenido Principal**
- Flex layout
- Barra de navegación superior
- Área de contenido con padding

#### 4. **Tablas de Datos**
- Diseño limpio y organizado
- Efectos hover
- Mensajes de "sin datos"

#### 5. **Modales**
- Overlay semi-transparente
- Animaciones de entrada
- Diseño responsivo
- Botones de acción

#### 6. **Responsive Design**
- Breakpoints para diferentes dispositivos
- Sidebar colapsable en móviles
- Tablas con scroll horizontal
- Modales adaptables

---

##  ARCHIVOS JAVASCRIPT

###  `assets/js/login.js` - Funcionalidad del Login
**Descripción:** Lógica de autenticación y validación del formulario de login.

**Funcionalidades:**
- Validación de campos
- Autenticación de usuarios
- Almacenamiento de sesión
- Redirección post-login

**Funciones principales:**
```javascript
// Validación de formulario
function validateForm()

// Autenticación de usuario
function authenticateUser()

// Manejo de sesión
function handleSession()
```

---

###  `assets/js/admin-ciudades.js` - Funcionalidad del Dashboard
**Descripción:** Lógica completa del panel administrativo de ciudades.

**Funcionalidades principales:**

#### 1. **Gestión de Modales**
```javascript
// Modal de selección de ciudad
function showModal()
function hideModal()

// Modal de crear ciudad
function showCreateCityModal()
function hideCreateCityModal()
```

#### 2. **Navegación**
- Sidebar navigation
- Top navigation
- Cambio de secciones activas

#### 3. **Gestión de Usuario**
- Dropdown de perfil
- Cerrar sesión
- Administración de usuarios

#### 4. **Gestión de Ciudades**
```javascript
// Crear ciudad
function addCityToTable(ciudad)

// Editar ciudad
function editCity(codigo)

// Eliminar ciudad
function deleteCity(codigo)
```

#### 5. **Validación de Formularios**
- Campos obligatorios
- Validación de email
- Mensajes de error

#### 6. **Responsive Design**
- Toggle de sidebar en móviles
- Adaptación a diferentes pantallas

---

###  `assets/js/admin-titulares.js` - Gestión de Titulares y Beneficiarios
**Descripción:** Lógica completa para la gestión de titulares y beneficiarios.

**Funcionalidades principales:**
- **Gestión de Titulares:**
  - Crear titular con validación completa
  - Buscar titular por ID
  - Editar información de titular
  - Eliminar titular
  - Renderizado de resultados de búsqueda

- **Gestión de Beneficiarios:**
  - Crear beneficiario asociado a titular
  - Editar beneficiario existente
  - Eliminar beneficiario
  - Renderizado de lista de beneficiarios
  - Botón "Añadir Beneficiario" en resultados de búsqueda

- **Gestión de Modales:**
  - Control de superposición de modales
  - Gestión de z-index dinámico
  - Limpieza de formularios
  - Estados de modal (crear/editar)

- **Gestión de Estado:**
  - sessionStorage para datos temporales
  - currentSearchedTitularId para contexto
  - tempTitular para datos de edición

**Características técnicas:**
- **Funciones globales:** Todas las funciones expuestas a window para acceso desde HTML
- **Event delegation:** Manejo eficiente de eventos
- **Validación de formularios:** Validación en tiempo real
- **Gestión de datos:** CRUD completo con arrays en memoria
- **Logging extensivo:** Console.log para debugging

**Funciones principales:**
```javascript
// Gestión de titulares
createTitular()
searchTitular()
editTitular()
deleteTitular()

// Gestión de beneficiarios
createBeneficiario()
editBeneficiario()
deleteBeneficiario()
addBeneficiarioForCurrentTitular()

// Gestión de modales
showCreateTitularModal()
hideCreateTitularModal()
showCreateBeneficiarioModal()
hideCreateBeneficiarioModal()

// Renderizado
renderSearchResults()
renderBeneficiariosDeTitular()
```

---

##  FUNCIONALIDADES ESPECÍFICAS

###  Modal "SELECCIONE LA CIUDAD"
**Propósito:** Permitir al usuario seleccionar una ciudad para trabajar.

**Comportamiento:**
- Aparece automáticamente al cargar la página
- Se muestra al navegar entre secciones
- Se puede cerrar con X, Escape o clic fuera
- Almacena la selección en sessionStorage

**Campos:**
- Select con opciones de ciudades
- Botón "Seleccionar"

###  Modal "CREAR CIUDAD"
**Propósito:** Formulario para crear nuevas ciudades en el sistema.

**Campos del formulario:**
- `tldCodigo` - Código de la ciudad
- `tNombre` - Nombre de la ciudad
- `tDireccion` - Dirección de la ciudad
- `tTelefono` - Teléfono
- `tCorreo` - Correo electrónico

**Validaciones:**
- Todos los campos son obligatorios
- Validación de formato de email
- Mensajes de error específicos

**Funcionalidad:**
- Crear ciudad y agregar a la tabla
- Limpiar formulario al cerrar
- Mostrar mensaje de éxito

###  Tabla de Ciudades
**Estructura:**
```
| Código | Nombre | Correo | Opciones |
|--------|--------|--------|----------|
| 001    | Bogotá | email  | [✏️][🗑️] |
```

**Funcionalidades:**
- Mostrar ciudades existentes
- Agregar nuevas ciudades
- Editar ciudades (preparado)
- Eliminar ciudades con confirmación
- Mensaje cuando no hay datos

---

##  SISTEMA DE DISEÑO

### 🎨 Paleta de Colores
```css
/* Colores principales */
--primary-color: #DEB448;      /* Dorado principal */
--secondary-color: #ECD381;    /* Dorado claro */
--text-color: #1a1a1a;        /* Texto oscuro */
--background-color: #f5f5f5;  /* Fondo gris claro */
--sidebar-color: #4a4a4a;     /* Sidebar oscuro */
```

###  Breakpoints Responsive
```css
/* Desktop */
@media (min-width: 1200px)

/* Tablet */
@media (max-width: 1199px)

/* Tablet pequeña */
@media (max-width: 991px)

/* Móvil grande */
@media (max-width: 767px)

/* Móvil pequeño */
@media (max-width: 575px)

/* Móvil muy pequeño */
@media (max-width: 359px)
```

###  Tipografía
- **Fuente principal:** Inter (Google Fonts)
- **Pesos:** 300, 400, 500, 600, 700
- **Iconos:** Font Awesome 6.4.0

---

## 🔧 CONFIGURACIÓN TÉCNICA

### 📦 Dependencias Externas
```html
<!-- Fuentes -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- Iconos -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

###  Almacenamiento
- **sessionStorage:** Para datos de sesión
- **localStorage:** Para preferencias del usuario

###  Gestión de Estado
- Estado de autenticación
- Ciudad seleccionada
- Sección activa
- Estado de modales

---

##  FUNCIONALIDADES FUTURAS

###  Pendientes de Implementación
1. **Modal de Edición de Ciudad**
   - Formulario pre-llenado
   - Validación de cambios
   - Actualización en tiempo real

2. **Gestión de Filiales**
   - Crear filiales
   - Asociar con ciudades
   - CRUD completo

3. **Sistema de Búsqueda**
   - Filtros avanzados
   - Búsqueda en tiempo real
   - Paginación

4. **Backend Integration**
   - API REST
   - Base de datos
   - Autenticación real

---

##  SOLUCIÓN DE PROBLEMAS

###  Problemas Comunes

#### Modal no aparece
**Causa:** CSS con `display: none`
**Solución:** Verificar que `showModal()` se ejecute

#### Campos no se validan
**Causa:** IDs incorrectos en formulario
**Solución:** Verificar nombres de campos

#### Estilos no se aplican
**Causa:** Rutas incorrectas de CSS
**Solución:** Verificar estructura de carpetas

### Debugging
```javascript
// Verificar estado de modales
console.log('Modal visible:', modalOverlay.style.display);

// Verificar datos de formulario
console.log('Datos ciudad:', nuevaCiudad);

// Verificar sesión
console.log('Ciudad seleccionada:', sessionStorage.getItem('selectedCity'));
```

---

## NOTAS DE DESARROLLO

###  Implementado
- [x] Sistema de modales
- [x] Validación de formularios
- [x] Gestión de ciudades
- [x] Gestión completa de titulares y beneficiarios
- [x] Búsqueda de titulares
- [x] Modales superpuestos con z-index controlado
- [x] Selectores de tipo de documento colombiano
- [x] Botón "Añadir Beneficiario" en resultados de búsqueda
- [x] Edición de titulares y beneficiarios
- [x] Responsive design
- [x] Navegación completa
- [x] Gestión de sesión
- [x] sessionStorage para datos temporales

###  En Desarrollo
- [ ] Modal de edición
- [ ] Gestión de filiales
- [ ] Sistema de búsqueda
- [ ] Backend integration

###  Pendiente
- [ ] Tests unitarios
- [ ] Documentación de API
- [ ] Optimización de performance
- [ ] Accesibilidad (WCAG)

---

##  AUTORES Y VERSIÓN

**Proyecto:** Golden App  
**Versión:** 1.1.0  
**Fecha:** 2024  
**Desarrollado por:** Paula Pachon  
**Última actualización:** Diciembre 2024  

---

*Esta documentación se actualiza automáticamente con cada cambio en el código.*



