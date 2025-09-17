# DOCUMENTACION GENERAL JAVASCRIPT - GOLDEN APP

## RESUMEN EJECUTIVO

Este documento describe la estructura y funcionalidad de todos los archivos JavaScript del proyecto Golden App. El sistema incluye autenticacion, dashboard administrativo para ciudades, titulares, cargos y funcionalidades de toggle para activar/desactivar elementos.

## ESTRUCTURA DEL PROYECTO

### Archivos JavaScript
- `assets/js/login.js` - Sistema de autenticacion
- `assets/js/admin-ciudades.js` - Dashboard de ciudades y filiales
- `assets/js/admin-titulares.js` - Dashboard de titulares y beneficiarios
- `assets/js/admin-cargos.js` - Dashboard de cargos
- `assets/js/admin-empleados.js` - Dashboard de empleados
- `assets/js/admin-organizaciones.js` - Dashboard de organizaciones

## ARCHIVO: LOGIN.JS

### Proposito
Maneja la autenticacion de usuarios y la pagina de inicio de sesion.

### Funcionalidades Principales
- Validacion de formularios de login
- Efectos visuales en campos de entrada
- Manejo de autenticacion
- Redireccion post-login

### Estructura
```javascript
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    // Event listeners
    // Funciones de validacion
    // Manejo de autenticacion
});
```

### Funciones Clave
- Validacion de campos de entrada
- Manejo de envio de formulario
- Efectos visuales de focus/blur
- Redireccion a dashboard

## ARCHIVO: ADMIN-CIUDADES.JS

### Proposito
Dashboard administrativo para gestionar ciudades y filiales con sistema de toggle.

### Variables Globales
```javascript
const ciudadesData = {};  // Almacena datos de ciudades
const filialData = {};    // Almacena datos de filiales
```

### Funcionalidades Principales

#### Gestion de Ciudades
- Crear nuevas ciudades
- Editar ciudades existentes
- Eliminar ciudades
- Buscar ciudades
- Toggle activar/desactivar ciudades

#### Gestion de Filiales
- Crear nuevas filiales
- Editar filiales existentes
- Eliminar filiales
- Buscar filiales
- Toggle activar/desactivar filiales

#### Sistema de Modales
- Modal de seleccion de ciudad
- Modal de busqueda de ciudad
- Modal de creacion de ciudad
- Modal de confirmacion para toggle
- Modal de exito

### Funciones Principales

#### Gestion de Ciudades
```javascript
function addCityToTable(ciudad, replaceIfExists = false)
function editCity(codigo)
function deleteCity(codigo)
function searchCities()
function toggleCityState(codigo)
function confirmToggleCity()
function cancelToggleCity()
```

#### Gestion de Filiales
```javascript
function addBranchToTable(filial, replaceIfExists = false)
function editBranch(codigo)
function deleteBranch(codigo)
function toggleBranchState(codigo)
function confirmToggleBranch()
function cancelToggleBranch()
```

#### Modales
```javascript
function showSelectCityModal()
function hideSelectCityModal()
function showCitySearchModal()
function hideModal()
function showCreateCityModal()
function hideCreateCityModal()
```

### Puntos de Integracion Backend

#### 1. Toggle Ciudad
**Funcion**: `confirmToggleCity()`  
**Linea**: 1638  
**Endpoint**: `PUT /api/ciudades/toggle`

#### 2. Toggle Filial
**Funcion**: `confirmToggleBranch()`  
**Linea**: 2079  
**Endpoint**: `PUT /api/filiales/toggle`

#### 3. Crear Ciudad
**Funcion**: `confirmCreateCity()`  
**Linea**: 268  
**Endpoint**: `POST /api/ciudades`

#### 4. Crear Filial
**Funcion**: `confirmCreateBranch()`  
**Linea**: 852  
**Endpoint**: `POST /api/filiales`

## ARCHIVO: ADMIN-TITULARES.JS

### Proposito
Dashboard administrativo para gestionar titulares y beneficiarios.

### Funcionalidades Principales

#### Gestion de Titulares
- Crear nuevos titulares
- Editar titulares existentes
- Eliminar titulares
- Buscar titulares
- Gestion de documentos

#### Gestion de Beneficiarios
- Agregar beneficiarios a titulares
- Editar beneficiarios
- Eliminar beneficiarios
- Gestion de relaciones familiares

#### Sistema de Modales
- Modal de creacion de titular
- Modal de edicion de titular
- Modal de confirmacion de eliminacion
- Modal de gestion de beneficiarios

### Funciones Principales

#### Gestion de Titulares
```javascript
function addTitularToTable(titular, replaceIfExists = false)
function editTitular(codigo)
function deleteTitular(codigo)
function searchTitulares()
function showCreateTitularModal()
function hideCreateTitularModal()
```

#### Gestion de Beneficiarios
```javascript
function addBeneficiarioToTable(beneficiario, titularCodigo)
function editBeneficiario(codigo, titularCodigo)
function deleteBeneficiario(codigo, titularCodigo)
function showBeneficiariosModal(titularCodigo)
function hideBeneficiariosModal()
```

### Estructura de Datos
```javascript
const titularesData = {};     // Almacena datos de titulares
const beneficiariosData = {}; // Almacena datos de beneficiarios
```

## ARCHIVO: ADMIN-CARGOS.JS

### Proposito
Dashboard administrativo para gestionar cargos y posiciones.

### Funcionalidades Principales

#### Gestion de Cargos
- Crear nuevos cargos
- Editar cargos existentes
- Eliminar cargos
- Buscar cargos
- Gestion de jerarquias

#### Sistema de Modales
- Modal de creacion de cargo
- Modal de edicion de cargo
- Modal de confirmacion de eliminacion
- Modal de exito

### Funciones Principales

#### Gestion de Cargos
```javascript
function addCargoToTable(cargo, replaceIfExists = false)
function editCargo(codigo)
function deleteCargo(codigo)
function searchCargos()
function showCreateCargoModal()
function hideCreateCargoModal()
```

### Estructura de Datos
```javascript
const cargosData = {}; // Almacena datos de cargos
```

## ARCHIVO: ADMIN-EMPLEADOS.JS

### Proposito
Dashboard administrativo para gestionar empleados y su información básica, con selección obligatoria de ciudad, validaciones y notificaciones.

### Funcionalidades Principales
- CRUD de empleados
- Gestión de beneficiarios
- Modal de selección de ciudad y sincronización con ciudades
- Notificaciones estilizadas de acciones

### Puntos de Integracion Backend
- `POST /api/empleados` (crear)
- `PUT /api/empleados/{id}` (actualizar)
- `GET /api/empleados/{id}` (buscar)
- `DELETE /api/empleados/{id}` (eliminar)

## ARCHIVO: ADMIN-ORGANIZACIONES.JS

### Proposito
Dashboard administrativo para gestionar organizaciones. Formulario simplificado (código y nombre), modal de selección de ciudad, sincronización con ciudades y notificaciones.

### Estructura de Datos
```javascript
const organizacionesData = {
  [codigo]: { codigo, nombre, activo }
}
```

### Funcionalidades Principales
- Crear organización
- Actualizar organización
- Eliminar organización
- Buscar por código
- Selección de ciudad obligatoria y sincronizada

### Puntos de Integracion Backend (ubicación en el código)
- `POST /api/organizaciones` → función `confirmCreateOrg()` (sección CONEXIÓN BACKEND)
- `PUT /api/organizaciones/{codigo}` → función `confirmUpdateOrg()` (sección CONEXIÓN BACKEND)
- `GET /api/organizaciones/{codigo}` → función `resultOrgByCode(code)` (sección CONEXIÓN BACKEND)
- `DELETE /api/organizaciones/{codigo}` → función `confirmDeleteOrg()` (sección CONEXIÓN BACKEND)

Cada punto incluye comentarios con headers requeridos y estructura de body. El equipo backend debe reemplazar los bloques comentados por las llamadas reales.

## FUNCIONES DE UTILIDAD COMUNES

### Autenticacion
```javascript
function getAuthToken()
function isAuthenticated()
```

### Validacion de Formularios
```javascript
function validateForm(formElement)
function validateRequiredFields(fields)
function validateEmail(email)
function validatePhone(phone)
```

### Manejo de Modales
```javascript
function showModal(modalId)
function hideModal(modalId)
function closeModalOnOverlayClick(modalId)
```

### Gestion de Tablas
```javascript
function addRowToTable(tableId, rowData)
function updateRowInTable(tableId, rowId, newData)
function removeRowFromTable(tableId, rowId)
function clearTable(tableId)
```

## SINCRONIZACIÓN ENTRE MÓDULOS (CIUDADES)

### Evento Global
- `window.dispatchEvent(new CustomEvent('ciudades:updated'))` al crear/actualizar ciudades.

### Funciones Globales
- `window.getCiudadesData()` retorna el mapa de ciudades vigente.
- `window.refreshCitySelects()` repuebla selects locales y persiste en localStorage.

### Fallback de Datos
- Si `getCiudadesData` aún no está disponible, se permite fallback a `localStorage` únicamente si existe el flag de sesión `ciudadesAllowLocal`.

### Reglas de Selectores de Ciudad
- Solo listar ciudades activas (`activo !== false`).
- Convertir a mayúsculas el código y nombre al poblar selects.

## SISTEMA DE NOTIFICACIONES

### Implementación
- Función `showNotification(message, type)` disponible en todos los módulos.
- Tipos soportados: `success`, `error`, `warning`, `info`.
- Estilos CSS compartidos en `admin-cargos.css`, `admin-ciudades.css` y `admin-empleados.css`.

### Reemplazos
- Todos los `alert()` relacionados con selección de ciudad fueron reemplazados por `showNotification`.

## ESTRUCTURA DE DATOS COMUN

### Ciudad
```javascript
{
    codigo: "CIU001",
    nombre: "Bogota",
    direccion: "Calle 123 #45-67",
    telefono: "601-123-4567",
    correo: "bogota@goldenapp.com",
    activo: true
}
```

### Filial
```javascript
{
    codigo: "FIL001",
    nombre: "Sucursal Centro",
    ciudad: "Bogota",
    direccion: "Carrera 7 #32-10",
    telefono: "601-987-6543",
    activo: true
}
```

### Titular
```javascript
{
    codigo: "TIT001",
    nombre: "Juan Perez",
    documento: "12345678",
    telefono: "300-123-4567",
    correo: "juan@email.com",
    direccion: "Calle 123 #45-67"
}
```

### Beneficiario
```javascript
{
    codigo: "BEN001",
    titularCodigo: "TIT001",
    nombre: "Maria Perez",
    documento: "87654321",
    parentesco: "Hija",
    telefono: "300-987-6543"
}
```

### Cargo
```javascript
{
    codigo: "CAR001",
    nombre: "Gerente General",
    descripcion: "Responsable de la operacion general",
    nivel: "Ejecutivo",
    salario: 5000000
}
```

## SISTEMA DE TOGGLE

### Caracteristicas
- Toggle animado ON/OFF
- Badge de estado ACTIVA/INACTIVA
- Modales de confirmacion
- Reversion de cambios en caso de error

### Implementacion
- CSS con gradientes y sombras 3D
- JavaScript para manejo de estado
- Modales de confirmacion y exito
- Integracion con backend

## PUNTOS DE INTEGRACION BACKEND

### Endpoints Requeridos

#### Ciudades
- `GET /api/ciudades` - Obtener lista de ciudades
- `POST /api/ciudades` - Crear nueva ciudad
- `PUT /api/ciudades/{codigo}` - Actualizar ciudad
- `DELETE /api/ciudades/{codigo}` - Eliminar ciudad
- `PUT /api/ciudades/toggle` - Toggle estado ciudad

#### Filiales
- `GET /api/filiales` - Obtener lista de filiales
- `POST /api/filiales` - Crear nueva filial
- `PUT /api/filiales/{codigo}` - Actualizar filial
- `DELETE /api/filiales/{codigo}` - Eliminar filial
- `PUT /api/filiales/toggle` - Toggle estado filial

#### Titulares
- `GET /api/titulares` - Obtener lista de titulares
- `POST /api/titulares` - Crear nuevo titular
- `PUT /api/titulares/{codigo}` - Actualizar titular
- `DELETE /api/titulares/{codigo}` - Eliminar titular

#### Beneficiarios
- `GET /api/beneficiarios` - Obtener beneficiarios de un titular
- `POST /api/beneficiarios` - Crear nuevo beneficiario
- `PUT /api/beneficiarios/{codigo}` - Actualizar beneficiario
- `DELETE /api/beneficiarios/{codigo}` - Eliminar beneficiario

#### Cargos
- `GET /api/cargos` - Obtener lista de cargos
- `POST /api/cargos` - Crear nuevo cargo
- `PUT /api/cargos/{codigo}` - Actualizar cargo
- `DELETE /api/cargos/{codigo}` - Eliminar cargo

### Autenticacion
```javascript
headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
}
```

## MANEJO DE ERRORES

### Estrategias Implementadas
- Validacion de formularios en frontend
- Manejo de errores de red
- Reversion de cambios visuales en caso de error
- Mensajes de error claros al usuario
- Logs detallados en consola

### Funciones de Error
```javascript
function handleApiError(error, context)
function showErrorMessage(message)
function revertVisualChanges(elementId)
function logError(error, context)
```

## CONSIDERACIONES DE SEGURIDAD

### Validaciones Frontend
- Validacion de campos requeridos
- Validacion de formatos (email, telefono)
- Sanitizacion de inputs
- Prevencion de XSS

### Autenticacion
- Token almacenado en sessionStorage
- Verificacion de autenticacion en cada request
- Logout automatico en caso de token invalido

## OPTIMIZACIONES IMPLEMENTADAS

### Performance
- Event delegation para elementos dinamicos
- Debounce en funciones de busqueda
- Lazy loading de modales
- Cache de datos en memoria

### UX/UI
- Feedback visual inmediato
- Estados de carga
- Confirmaciones para acciones destructivas
- Navegacion intuitiva

## TESTING Y DEBUGGING

### Funciones de Debug
```javascript
function debugLog(message, data)
function testToggleWithSampleData()
function validateDataIntegrity()
```

### Logs Implementados
- Logs de operaciones CRUD
- Logs de errores de API
- Logs de cambios de estado
- Logs de autenticacion

## PROXIMOS PASOS

### Mejoras Sugeridas
1. Implementar conexiones backend completas
2. Agregar validaciones de permisos
3. Implementar cache con localStorage
4. Agregar tests automatizados
5. Optimizar rendimiento de tablas grandes
6. Implementar paginacion
7. Agregar filtros avanzados
8. Implementar exportacion de datos

### Mantenimiento
1. Actualizar dependencias
2. Revisar compatibilidad de navegadores
3. Optimizar queries de base de datos
4. Implementar monitoreo de errores
5. Documentar APIs con Swagger

---

**Fecha de creacion**: 2024  
**Desarrollado por**: Paula Pachon  
**Version**: 1.0.0
