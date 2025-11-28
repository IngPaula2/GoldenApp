# Documentación: Sistema de Ingreso a Caja con Múltiples Cuotas

## 📋 Resumen de Cambios

Se implementó un sistema que permite realizar un solo ingreso de caja que puede cubrir múltiples cuotas, incluyendo pagos parciales. El sistema utiliza una metodología de Encabezado/Detalles donde un solo registro de ingreso contiene el detalle de todas las cuotas pagadas.

---

## 📁 Archivos Modificados

### 1. **pages/tesoreria/ingreso-caja/ingreso-caja.html**
   - **Cambios realizados:**
     - Se agregó el modal `selectInstallmentsModal` para seleccionar cuotas a pagar
     - Se agregó el campo "Valor Total Deseado a Pagar" en el modal
     - Se creó la tabla interactiva para seleccionar y editar valores de cuotas
     - Se eliminaron mensajes de sugerencia y resumen inferior (según solicitud del usuario)
   
   - **Estructura del modal:**
     - Información de factura y titular
     - Campo de valor total deseado
     - Tabla con columnas: Checkbox, Cuota, Valor Cuota (editable), Estado
     - Botones: Cancelar y Confirmar Selección

### 2. **assets/js/tesoreria/ingreso-caja/ingreso-caja.js**
   - **Funciones nuevas agregadas:**
     - `loadInstallmentsForModal()`: Carga y muestra las cuotas pendientes
     - `initializeInstallmentModalEvents()`: Inicializa eventos del modal
     - `handleModalInstallmentCheckboxChange()`: Maneja selección de cuotas
     - `handleModalValorPagarChange()`: Maneja edición de valores de cuotas
     - `handleModalValorPagarBlur()`: Formatea valores al perder foco
     - `autoDistributeDesiredValue()`: Distribuye automáticamente el valor total entre cuotas
     - `updateModalInstallmentRowState()`: Actualiza el estado visual de las filas
     - `syncSelectAllInstallmentsState()`: Sincroniza el checkbox "Seleccionar todas"
     - `confirmInstallmentSelection()`: Confirma la selección y actualiza el formulario principal
     - `showSelectInstallmentsModal()`: Muestra el modal de selección
     - `hideSelectInstallmentsModal()`: Oculta el modal de selección
     - `initializeValorPagarInputs()`: Inicializa formato numérico en inputs
   
   - **Funciones modificadas:**
     - `getPlanInfoFromInvoice()`: Mejorada para buscar información del plan con múltiples fallbacks
     - `confirmCreateInflow()`: Modificada para crear un solo registro con múltiples cuotas
     - `loadNextInflowNumber()`: Mejorada para cargar correctamente el número consecutivo
     - `clearCreateInflowForm()`: Modificada para preservar el número consecutivo
     - `initializeInvoiceValidation()`: Modificada para abrir el modal de selección de cuotas

### 3. **assets/css/tesoreria/ingreso-caja/ingreso-caja.css**
   - **Cambios realizados:**
     - Ajustes de estilos para el modal de selección de cuotas
     - Estilos para la tabla de cuotas
     - Ajustes de z-index para modales
     - Estilos para scrollbar personalizado en modales

---

## 🔌 Conexión con Backend

### **Puntos donde se debe conectar el backend:**

#### 1. **Función: `loadInstallmentsForModal()`**
   **Ubicación:** Línea ~556
   
   **Reemplazar:**
   ```javascript
   // ACTUAL (localStorage):
   const invoicesRaw = localStorage.getItem('invoicesByCity');
   const contractsRaw = localStorage.getItem(`contratos_${city}`);
   const planesData = localStorage.getItem('planesData');
   const inflowsRaw = localStorage.getItem(`ingresosCaja_${city}`);
   ```
   
   **Por (API):**
   ```javascript
   // BACKEND - Llamadas API necesarias:
   // 1. Obtener factura
   const invoice = await fetch(`/api/invoices/${invoiceNumber}?city=${city}`).then(r => r.json());
   
   // 2. Obtener contrato
   const contract = await fetch(`/api/contracts/${invoice.contractId}`).then(r => r.json());
   
   // 3. Obtener plan
   const plan = await fetch(`/api/plans/${contract.planCode}`).then(r => r.json());
   
   // 4. Obtener ingresos existentes para calcular saldos
   const inflows = await fetch(`/api/cash-inflows?city=${city}&invoice=${invoiceNumber}`).then(r => r.json());
   ```

#### 2. **Función: `getPlanInfoFromInvoice()`**
   **Ubicación:** Línea ~4081
   
   **Reemplazar:**
   ```javascript
   // ACTUAL (localStorage):
   const invoicesRaw = localStorage.getItem('invoicesByCity');
   const contractsRaw = localStorage.getItem(`contratos_${city}`);
   const planesData = localStorage.getItem('planesData');
   const inflowsRaw = localStorage.getItem(`ingresosCaja_${city}`);
   ```
   
   **Por (API):**
   ```javascript
   // BACKEND - Llamadas API:
   const invoice = await fetch(`/api/invoices/${invoiceNumber}?city=${city}`).then(r => r.json());
   const contract = await fetch(`/api/contracts/${invoice.contractId}`).then(r => r.json());
   const plan = await fetch(`/api/plans/${contract.planCode}`).then(r => r.json());
   const inflows = await fetch(`/api/cash-inflows?city=${city}&invoice=${invoiceNumber}`).then(r => r.json());
   ```

#### 3. **Función: `confirmCreateInflow()` - Guardar Ingreso**
   **Ubicación:** Línea ~5561
   
   **Reemplazar:**
   ```javascript
   // ACTUAL (localStorage):
   const raw = localStorage.getItem(`ingresosCaja_${inflowData.city}`);
   const list = raw ? JSON.parse(raw) : [];
   list.push(inflow);
   localStorage.setItem(`ingresosCaja_${inflowData.city}`, JSON.stringify(list));
   ```
   
   **Por (API):**
   ```javascript
   // BACKEND - Crear ingreso:
   const response = await fetch('/api/cash-inflows', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(inflow)
   });
   const result = await response.json();
   
   // El objeto 'inflow' contiene:
   // {
   //   tipoIngresoCodigo, tipoIngresoNombre, numero, fecha, observaciones,
   //   holderId, holderName, invoiceNumber, valor, cuota, executiveId,
   //   executiveName, letraRecibo, reciboOficial, recordProduccion,
   //   estado, date, detalleCuotas: [{ cuota, valorPagar, esParcial }]
   // }
   ```

#### 4. **Función: `loadNextInflowNumber()`**
   **Ubicación:** Línea ~2724
   
   **Reemplazar:**
   ```javascript
   // ACTUAL (localStorage):
   const raw = localStorage.getItem(`consecutivosData_${city}`);
   const persisted = localStorage.getItem(`nextInflowNumber_${city}`);
   const raw = localStorage.getItem(`ingresosCaja_${city}`);
   ```
   
   **Por (API):**
   ```javascript
   // BACKEND - Obtener siguiente número:
   const nextNumber = await fetch(`/api/cash-inflows/next-number?city=${city}`).then(r => r.json());
   // Response: { nextNumber: 123 }
   ```

---

## 📊 Estructura de Datos

### **Registro de Ingreso con Múltiples Cuotas:**

```javascript
{
    id: 1234567890,
    tipoIngresoCodigo: "CR",
    tipoIngresoNombre: "CREDITO CARTERA",
    numero: "00000001",
    fecha: "2025-01-15",
    observaciones: "",
    holderId: "1234567890",
    holderName: "JUAN PEREZ",
    invoiceNumber: "10120001",
    valor: 500000,                    // Valor total de todas las cuotas
    cuota: "2, 3, 4, 5",             // Cuotas separadas por comas
    executiveId: "103920400",
    executiveName: "ALFREDO GONZALEZ",
    letraRecibo: "",
    reciboOficial: "",
    recordProduccion: "",
    estado: "activo",
    date: "2025-01-15T10:30:00.000Z",
    detalleCuotas: [                 // Detalle de cada cuota pagada
        {
            cuota: 2,
            valorPagar: 118000,
            esParcial: false
        },
        {
            cuota: 3,
            valorPagar: 118000,
            esParcial: false
        },
        {
            cuota: 4,
            valorPagar: 118000,
            esParcial: false
        },
        {
            cuota: 5,
            valorPagar: 146000,
            esParcial: true
        }
    ]
}
```

---

## 🔄 Flujo de Funcionamiento

1. **Usuario selecciona factura** → Se abre automáticamente el modal de selección de cuotas
2. **Sistema carga cuotas pendientes** → Calcula saldos considerando pagos parciales previos
3. **Usuario ingresa valor total deseado** → Sistema distribuye automáticamente entre cuotas
4. **Usuario puede ajustar valores manualmente** → Edita el valor de cada cuota individualmente
5. **Usuario confirma selección** → Se actualiza el formulario principal con los valores
6. **Usuario crea el ingreso** → Se guarda un solo registro con el detalle de todas las cuotas

---

## ⚠️ Notas Importantes

1. **Campo `detalleCuotas`**: Es crítico para calcular correctamente los saldos restantes. Siempre debe incluirse al guardar.

2. **Cálculo de saldos**: El sistema calcula los saldos basándose en `detalleCuotas` de ingresos previos. Si no existe, divide el valor total entre el número de cuotas (menos preciso).

3. **Cuota 0**: La cuota 0 es la cuota inicial y no se muestra en el modal. Las cuotas del modal empiezan desde la 1.

4. **Pagos parciales**: Cuando una cuota tiene un pago parcial, se muestra con el saldo restante en el campo "Valor Cuota" editable.

5. **Número consecutivo**: Se carga automáticamente al abrir el modal de crear ingreso.

---

## 🧪 Pruebas Recomendadas

1. ✅ Crear ingreso con una sola cuota completa
2. ✅ Crear ingreso con múltiples cuotas completas
3. ✅ Crear ingreso con pago parcial (ej: 120,000 en cuota de 118,000)
4. ✅ Verificar que el saldo restante se calcule correctamente en el siguiente ingreso
5. ✅ Verificar que se muestren todas las cuotas con saldo pendiente
6. ✅ Verificar que el número consecutivo se cargue correctamente

---

## 📝 Comentarios en el Código

Todas las funciones nuevas y modificadas incluyen comentarios detallados que explican:
- Qué hace la función
- Cómo funciona
- Dónde se debe conectar el backend
- Ejemplos de uso
- Estructura de datos esperada

Los comentarios están marcados con `// BACKEND:` o `// CONEXIÓN BACKEND:` para facilitar su identificación.

---

## 📞 Soporte

Para cualquier duda sobre la implementación, revisar los comentarios en el código o consultar esta documentación.

