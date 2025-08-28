# 📋 ESTÁNDARES DE MODALES - GOLDEN APP

## 🎯 OBJETIVO
Este documento establece los estándares para la implementación de modales de búsqueda y resultados en toda la aplicación Golden App.

## 📐 FORMATO ESTÁNDAR PARA MODALES DE BÚSQUEDA

### 🔍 Modal de Búsqueda (Simple)
```html
<div class="modal-overlay" id="searchModal">
    <div class="modal">
        <div class="modal-header">
            <h3 class="modal-title">BUSCAR [ENTIDAD]</h3>
            <button class="modal-close" onclick="hideSearchModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="searchField" class="form-label">Campo de búsqueda *</label>
                <input type="text" id="searchField" class="form-input" placeholder="Ingrese el criterio de búsqueda">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="hideSearchModal()">Cancelar</button>
            <button class="btn btn-primary" id="bBuscar">Buscar</button>
        </div>
    </div>
</div>
```

### 📊 Modal de Resultados (Ampliado)
```html
<div class="modal-overlay" id="resultsModal">
    <div class="modal modal-results">
        <div class="modal-header">
            <h3 class="modal-title">RESULTADOS DE BÚSQUEDA - [ENTIDAD]</h3>
            <button class="modal-close" onclick="hideResultsModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="data-table">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Columna 1</th>
                            <th>Columna 2</th>
                            <th>Columna 3</th>
                            <th>Opciones</th>
                        </tr>
                    </thead>
                    <tbody id="searchResultsBody">
                        <tr>
                            <td colspan="4" class="no-data-message">
                                <div class="no-data-content">
                                    <i class="fas fa-search"></i>
                                    <p>No se encontraron resultados</p>
                                    <small>Intente con otro criterio de búsqueda</small>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="hideResultsModal()">Cerrar</button>
        </div>
    </div>
</div>
```

## 🎨 CLASES CSS ESTÁNDAR

### Para Modales de Resultados
```css
.modal-results {
    max-width: 1600px !important;
    width: 95% !important;
    min-height: 600px;
    max-height: 90vh;
}

.modal-results .modal-body {
    padding: 30px;
    max-height: calc(90vh - 140px);
    overflow-y: auto;
}

.modal-results .table th {
    padding: 18px 15px;
    font-size: 15px;
    font-weight: 600;
    background: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
    white-space: nowrap;
}

.modal-results .table td {
    padding: 18px 15px;
    font-size: 14px;
    border-bottom: 1px solid #e9ecef;
    vertical-align: middle;
    word-wrap: break-word;
    max-width: 200px;
}
```

## 🔧 FUNCIONES JAVASCRIPT ESTÁNDAR

### Funciones de Control de Modales
```javascript
// Mostrar modal de búsqueda
function showSearchModal() {
    searchModalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Limpiar campo de búsqueda
    document.getElementById('searchField').value = '';
}

// Ocultar modal de búsqueda
function hideSearchModal() {
    searchModalOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Mostrar modal de resultados
function showResultsModal() {
    resultsModalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Ocultar modal de resultados
function hideResultsModal() {
    resultsModalOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Event listeners estándar
searchModalOverlay.addEventListener('click', function(e) {
    if (e.target === searchModalOverlay) {
        hideSearchModal();
    }
});

resultsModalOverlay.addEventListener('click', function(e) {
    if (e.target === resultsModalOverlay) {
        hideResultsModal();
    }
});

// Tecla Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (searchModalOverlay.style.display === 'flex') {
            hideSearchModal();
        }
        if (resultsModalOverlay.style.display === 'flex') {
            hideResultsModal();
        }
    }
});
```

### Funcionalidad de Búsqueda
```javascript
// Botón de búsqueda
const bBuscar = document.getElementById('bBuscar');
if (bBuscar) {
    bBuscar.addEventListener('click', function() {
        const searchValue = document.getElementById('searchField').value.trim();
        
        if (!searchValue) {
            alert('Por favor, ingrese un criterio de búsqueda.');
            return;
        }
        
        const resultadoBusqueda = buscarEntidad(searchValue);
        
        if (resultadoBusqueda) {
            renderSearchResults(resultadoBusqueda);
            hideSearchModal();
            showResultsModal();
        } else {
            renderSearchResults(null);
            hideSearchModal();
            showResultsModal();
        }
    });
}
```

## 📱 RESPONSIVE DESIGN

### Breakpoints Estándar
```css
/* Desktop grande (1200px+) */
.modal-results {
    max-width: 1600px !important;
    width: 95% !important;
}

/* Desktop pequeño (768px - 1199px) */
@media (max-width: 1200px) {
    .modal-results {
        max-width: 95% !important;
        width: 98% !important;
    }
    
    .modal-results .table th,
    .modal-results .table td {
        padding: 15px 10px;
        font-size: 13px;
    }
}

/* Móviles (hasta 767px) */
@media (max-width: 768px) {
    .modal-results {
        max-width: 98% !important;
        width: 100% !important;
        margin: 10px;
        min-height: 500px;
    }
    
    .modal-results .modal-body {
        padding: 20px;
        max-height: calc(90vh - 120px);
    }
    
    .modal-results .table th,
    .modal-results .table td {
        padding: 12px 8px;
        font-size: 12px;
    }
}
```

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Para Cada Nueva Búsqueda:

- [ ] **Modal de búsqueda simple** con formulario básico
- [ ] **Modal de resultados ampliado** con clase `modal-results`
- [ ] **Referencias JavaScript** a ambos modales
- [ ] **Funciones show/hide** para ambos modales
- [ ] **Event listeners** para clic fuera y tecla Escape
- [ ] **Funcionalidad de búsqueda** con validación
- [ ] **Renderizado de resultados** con manejo de datos vacíos
- [ ] **Responsive design** implementado
- [ ] **Funciones globales** expuestas en `window`

## 🎯 ENTIDADES ACTUALES CON FORMATO ESTÁNDAR

### ✅ Implementadas:
- **Ciudades**: Buscar por código → Resultados ampliados
- **Filiales**: Buscar por código de ciudad → Resultados ampliados  
- **Titulares**: Buscar por ID → Resultados ampliados
- **Beneficiarios**: Buscar por ID → Resultados ampliados

### 🔄 Pendientes:
- [Cualquier nueva entidad que se agregue]

## 📝 NOTAS IMPORTANTES

1. **Siempre usar `modal-results`** para modales de resultados de búsqueda
2. **Mantener modales de búsqueda simples** con solo el formulario necesario
3. **Separar búsqueda y resultados** en modales diferentes
4. **Implementar responsive design** en todos los modales
5. **Manejar estados vacíos** con mensajes descriptivos
6. **Validar campos** antes de realizar búsquedas
7. **Limpiar campos** al abrir modales de búsqueda

---

**Última actualización**: Diciembre 2024  
**Versión**: 1.0.0  
**Autor**: Equipo Golden Bridge


