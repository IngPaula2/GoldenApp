# Golden App — Documentación del proyecto

> Este archivo centraliza la documentación del **proyecto completo** (frontend estático, estructura, rutas, módulos y puntos de integración con backend). El nombre histórico del archivo se mantiene por compatibilidad con enlaces internos.

---

## 1. Resumen ejecutivo

**Golden App** (Golden Bridge) es una aplicación web **multi-módulo** orientada a panel de gestión: administrativo, facturación, tesorería, nómina, cartera, auditoría, contabilidad y reportes. La interfaz está construida como **sitio estático**: HTML en `pages/`, estilos en `assets/css/` y lógica en `assets/js/`, sin bundler obligatorio en el repositorio.

- **Entrada principal de sesión:** `index.html` (raíz del proyecto).
- **Vistas de negocio:** bajo `pages/` organizadas por dominio (`administrativo/`, `facturacion/`, `tesoreria/`, etc.).
- **Backend:** la mayoría de operaciones están preparadas como comentarios o `fetch` puntuales; la lista de endpoints esperados se documenta en la sección 9.

---

## 2. Arquitectura técnica

| Aspecto | Descripción |
|--------|-------------|
| Tipo de app | Multi-página (MPA): cada vista es un `.html` con sus scripts |
| Lenguajes | HTML5, CSS3, JavaScript (ES5/ES6 según archivo) |
| Iconos | Font Awesome (CDN) en la mayoría de páginas |
| Estado en cliente | `localStorage` / `sessionStorage` para sesión, ciudad seleccionada y datos de demostración |
| Rutas absolutas / subcarpeta | `assets/js/utils/routes.js` expone `window.AppRoutes` para prefijos tipo GitHub Pages |

### 2.1 Flujo típico de carga

1. El usuario abre `index.html` o `pages/login.html`.
2. Tras autenticación simulada o real, se redirige a un dashboard (p. ej. `pages/administrativo/admin-ciudades.html`).
3. Cada página carga sus CSS (reset, `main.css` o `dashboard-base.css`, CSS del módulo) y scripts en orden: **`routes.js` → `admin-layout.js` (si aplica) → script del módulo** (y librerías CDN si existen).

---

## 3. Estructura de carpetas (resumen)

```
GoldenApp/
├── index.html                 # Login / landing principal
├── pages/                     # Todas las vistas HTML por módulo
│   ├── administrativo/
│   ├── facturacion/
│   ├── tesoreria/
│   ├── nomina/
│   ├── cartera/
│   ├── auditoria/
│   ├── contabilidad/
│   └── ...
├── assets/
│   ├── css/                   # Estilos por módulo + base
│   ├── js/                    # Lógica por módulo + utilidades
│   │   ├── administrativo/    # admin-layout.js, módulos admin...
│   │   ├── utils/             # routes.js (AppRoutes)
│   │   ├── facturacion/, tesoreria/, cartera/, ...
│   │   └── login.js
│   └── images/
├── docs/
│   └── DOCUMENTACION_BACKEND.md   # Este documento
└── templates/                 # Plantillas HTML auxiliares (si existen)
```

---

## 4. Mapa de módulos (vistas principales)

La siguiente tabla orienta a desarrolladores sobre **dónde** está cada pieza. Los nombres exactos pueden variar ligeramente; use búsqueda por carpeta si falta algún reporte.

| Dominio | Ejemplos de HTML | JS principal (ejemplos) | CSS principal (ejemplos) |
|---------|------------------|-------------------------|----------------------------|
| Administrativo | `pages/administrativo/admin-ciudades.html`, `admin-empleados.html`, `cuentas-contables.html`, `admin-usuarios.html` | `assets/js/administrativo/*.js` | `assets/css/administrativo/*.css` |
| Facturación | `pages/facturacion/contratos/fac-contratos.html`, `pages/facturacion/facturas/fac-facturas.html` | `assets/js/facturacion/**/*.js` | `assets/css/facturacion/**/*.css` |
| Tesorería | `pages/tesoreria/ingreso-caja/ingreso-caja.html`, `cuentas-bancarias.html`, `mantenimiento/tipo-ingresos.html` | `assets/js/tesoreria/**/*.js` | `assets/css/tesoreria/**/*.css` |
| Nómina | `pages/nomina/nomina-semanal/nomina-semanal.html` | `assets/js/nomina/**/*.js` | `assets/css/nomina/**/*.css` |
| Cartera | `pages/cartera/estado-cuenta/estado-cuenta.html`, `notas/notas.html` | `assets/js/cartera/**/*.js` | `assets/css/cartera/**/*.css` |
| Auditoría | `pages/auditoria/auditoria.html` | `assets/js/auditoria/auditoria.js` | `assets/css/auditoria/auditoria.css` |
| Contabilidad | `pages/contabilidad/contabilidad.html` | `assets/js/contabilidad/contabilidad.js` | `assets/css/contabilidad/*.css` |

---

## 5. Componentes compartidos del frontend

### 5.1 `assets/js/utils/routes.js` — `window.AppRoutes`

- **Propósito:** Resolver URLs con el prefijo correcto cuando la app no está en la raíz del dominio (por ejemplo `/GoldenApp/...`).
- **API:**
  - `AppRoutes.resolve('CLAVE')` — resuelve una clave definida en `PATH` o una ruta que empiece por `/`.
  - `AppRoutes.navigate('CLAVE')` — asigna `location.href`.
  - `AppRoutes.getAppBasePath()` — prefijo detectado antes de `/pages/`.
- **Claves habituales:** `LOGIN`, `ADMIN_CIUDADES`, `ADMIN_USUARIOS`, `MODULE_ADMIN`, `MODULE_FACTURACION`, `MODULE_TESORERIA`, `MODULE_NOMINA`, `MODULE_CARTERA`, `MODULE_AUDITORIA`, `MODULE_CONTABILIDAD`, etc.

**Orden en HTML:** incluir **antes** de `admin-layout.js` y del JS del módulo:

```html
<script src=".../assets/js/utils/routes.js"></script>
<script src=".../assets/js/administrativo/admin-layout.js"></script>
```

(Ajuste la ruta relativa según la profundidad de la carpeta `pages/`.)

### 5.2 `assets/js/administrativo/admin-layout.js`

- **Propósito:** Menú lateral tipo drawer en vista compacta (`<= 991px`), backdrop y utilidades globales del shell.
- **Requisitos:** `body.dashboard-page`, `aside.sidebar`, Font Awesome.
- **Funciones relevantes:**
  - `bindDashboardSidebarRoutes()` — rellena `href` de enlaces `a.nav-link[data-app-route]` usando `AppRoutes`.
  - `bindSidebarModuleNavigationCapture()` — navegación por captura de clic para evitar conflictos con otros listeners en algunas pantallas.
  - Listener global para `.admin-users-item` → administración de usuarios (`resolveAdminUsersUrl()`).

### 5.3 `assets/css/dashboard-base.css`

- Hoja base usada en varios módulos (p. ej. auditoría, facturación) para sidebar, tablas responsivas y utilidades comunes.
- Algunas páginas administrativas cargan solo `assets/css/administrativo/main.css` + CSS del módulo; el aspecto puede diferir ligeramente.

### 5.4 `assets/js/accessibility.js`

- Mejoras de accesibilidad donde esté enlazado (teclado, foco, etc.).

---

## 6. Navegación entre módulos (menú lateral)

- En el HTML del sidebar, los ítems principales suelen usar **`data-app-route="MODULE_..."`** y `href="#"` temporal.
- **`admin-layout.js`** reemplaza el `href` por la URL resuelta vía `AppRoutes`.
- **Convención:** mantener las mismas claves `MODULE_*` en todas las vistas para coherencia.

---

## 7. Autenticación y sesión (cliente)

| Clave / concepto | Uso típico |
|------------------|------------|
| `sessionStorage` | `isAuthenticated`, `username`, `selectedCity`, datos de flujo |
| `localStorage` | `authToken`, `userData`, datos maestros de demo (`ciudadesData`, etc.) |
| Logout | Limpieza de tokens y redirección a `AppRoutes.resolve('LOGIN')` donde esté implementado |

> La política final de tokens debe alinearse con el backend real (cabecera `Authorization`, expiración, refresh).

---

## 8. Sincronización entre módulos (ciudades)

Resumen de lo documentado en el código y comentarios:

- **Evento:** `window.dispatchEvent(new CustomEvent('ciudades:updated'))` al crear o actualizar ciudades.
- **API global:** `window.getCiudadesData()` y `window.refreshCitySelects()` cuando existan.
- **Fallback:** lectura de `localStorage` solo si aplica el flag de sesión acordado (`ciudadesAllowLocal`).
- **Reglas:** listar ciudades activas; normalización a mayúsculas en selects según implementación del módulo.

---

## 9. Integración con backend (endpoints y convenciones)

### 9.1 Cabeceras sugeridas

```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + (sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '')
}
```

(Ajustar según dónde se guarde el token en producción.)

### 9.2 Administrativo — referencia (del código / documentación previa)

#### Ciudades
- `GET /api/ciudades`
- `POST /api/ciudades`
- `PUT /api/ciudades/{codigo}`
- `DELETE /api/ciudades/{codigo}`
- `PUT /api/ciudades/toggle`

#### Filiales
- `GET /api/filiales`
- `POST /api/filiales`
- `PUT /api/filiales/{codigo}`
- `DELETE /api/filiales/{codigo}`
- `PUT /api/filiales/toggle`

#### Titulares / beneficiarios
- `GET /api/titulares`, `POST /api/titulares`, `PUT /api/titulares/{codigo}`, `DELETE /api/titulares/{codigo}`
- `GET /api/beneficiarios`, `POST /api/beneficiarios`, `PUT /api/beneficiarios/{codigo}`, `DELETE /api/beneficiarios/{codigo}`

#### Cargos
- `GET /api/cargos`, `POST /api/cargos`, `PUT /api/cargos/{codigo}`, `DELETE /api/cargos/{codigo}`

#### Empleados
- `POST /api/empleados`, `PUT /api/empleados/{id}`, `GET /api/empleados/{id}`, `DELETE /api/empleados/{id}`
- Búsquedas comentadas: `GET /api/empleados/search?...`, `GET /api/empleados/buscar/{identificacion}`

#### Organizaciones
- `POST /api/organizaciones`, `PUT /api/organizaciones/{codigo}`, `GET /api/organizaciones/{codigo}`, `DELETE /api/organizaciones/{codigo}`

### 9.3 Facturación — contratos (comentarios en `fac-contratos.js`)

Ejemplos de endpoints sugeridos en el código:

- `GET /api/contratos?ciudad={codigo}`
- `POST /api/contratos`, `PUT /api/contratos/{id}`, `DELETE /api/contratos/{id}`
- `GET /api/contratos/buscar?tipo=...&valor=...`
- `GET /api/empleados?ciudad={codigo}`
- `GET /api/titulares?ciudad={codigo}&cedula={cedula}`
- `GET /api/planes`
- `GET /api/consecutivos?ciudad={codigo}`
- `GET /api/reportes/contratos?fechaInicio=...&fechaFin=...`

> Los módulos de facturas, tesorería, cartera y auditoría pueden tener más endpoints en comentarios al inicio de sus respectivos `.js`; conviene generar una tabla por archivo cuando se conecte el API real.

---

## 10. Estructuras de datos de referencia (cliente)

### Ciudad
```javascript
{
  codigo: "101",
  nombre: "BOGOTA",
  direccion: "...",
  telefono: "...",
  correo: "...",
  activo: true
}
```

### Filial
```javascript
{
  codigo: "FIL001",
  nombre: "Sucursal Centro",
  ciudad: "BOGOTA",
  direccion: "...",
  telefono: "...",
  activo: true
}
```

### Titular / beneficiario / cargo
Ver secciones equivalentes en versiones anteriores del repositorio (objetos con `codigo`, nombres y relaciones).

---

## 11. UI responsiva, tablas y modales

- **Tablas:** muchos módulos usan `overflow-x: auto` y reglas en `dashboard-base.css` o CSS del módulo para evitar cortes en móvil.
- **Modales grandes (crear factura, contrato, etc.):** en `max-width: 768px` suelen forzarse columnas a una sola columna y `max-height` + scroll en el cuerpo del modal.
- **Menú móvil:** clase `open` en `aside.sidebar` y backdrop; breakpoint típico `991px` en `admin-layout.js`.

---

## 12. Manejo de errores y depuración

- Validación de formularios en el cliente antes de llamadas a API.
- Mensajes al usuario: `showNotification` donde esté definido; evitar `alert` en flujos nuevos.
- Errores de red: capturar en `fetch`, revertir estado visual si aplica y registrar en consola.

---

## 13. Seguridad (orientación)

- Validar y sanitizar entradas en **servidor**; el frontend solo ayuda a la UX.
- No exponer secretos en el repositorio; usar variables de entorno en el backend.
- Cookies vs `localStorage` para tokens: decidir con el equipo de seguridad.

---

## 14. Despliegue y ejecución local

1. Servir la carpeta del proyecto con cualquier servidor estático (`npx serve`, IIS, nginx, extensión Live Server).
2. Abrir `http://localhost:.../index.html` o la ruta equivalente si hay subcarpeta: usar `AppRoutes` para enlaces internos.
3. Si se despliega bajo un **path base** (p. ej. `https://usuario.github.io/GoldenApp/`), todas las navegaciones internas deben pasar por **`AppRoutes.resolve`** o rutas relativas correctas desde cada HTML.

---

## 15. Mantenimiento del documento

- Al añadir un **módulo nuevo:** actualizar la tabla de la sección 4, las claves en `routes.js` si aplica, y la sección 9 con los endpoints reales.
- Al cambiar **flujo de login:** actualizar secciones 2 y 7.
- Este archivo sustituye la documentación fragmentada anterior bajo el mismo nombre; el historial detallado línea-a-línea de cada función queda en el propio código fuente y en comentarios `// Endpoint:`.

---

## 16. Créditos y versión

| Campo | Valor |
|-------|--------|
| Proyecto | Golden App / Golden Bridge |
| Documento | Consolidado proyecto + API de referencia |
| Versión documento | 2.0.0 |
| Fecha | 2026-05-04 |

*Contenido previo (v1) incorporado: descripción de módulos administrativos, endpoints de referencia, sincronización de ciudades y notificaciones.*
