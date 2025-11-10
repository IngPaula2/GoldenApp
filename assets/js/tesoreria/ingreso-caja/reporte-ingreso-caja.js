/**
 * MÓDULO DE REPORTE DE INGRESOS A CAJA
 * 
 * Este archivo maneja la visualización y exportación de reportes de ingresos a caja.
 * Incluye funciones de paginación, búsqueda, zoom y exportación a diferentes formatos.
 * 
 * FUNCIONALIDADES:
 * - Visualización de datos de ingresos a caja
 * - Paginación y controles de navegación
 * - Zoom in/out para mejor visualización
 * - Exportación a Excel, Word y PDF
 * - Búsqueda y filtrado de datos
 * - Sincronización con datos del sistema principal
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

// ========================================
// VARIABLES GLOBALES DEL REPORTE
// ========================================

// Variables de estado para paginación y visualización
window.__rows = [];        // Datos del reporte
window.__page = 1;         // Página actual
window.__pageSize = 20;    // Elementos por página
window.__zoom = 1;         // Nivel de zoom

/**
 * OBTENER PARÁMETROS DE URL
 * 
 * Extrae los parámetros de la URL para el reporte.
 */
function parseQuery(){
    const p=new URLSearchParams(location.search);
    return { 
        ciudad: p.get('ciudad') || '',
        fechaInicial: p.get('fechaInicial') || '',
        fechaFinal: p.get('fechaFinal') || ''
    };
}

/**
 * OBTENER DATOS DE INGRESOS A CAJA
 * 
 * Recupera los datos de ingresos a caja desde localStorage.
 */
function getIngresosCaja(){
    console.log('🔍 Buscando ingresos a caja...');
    
    // Primero intentar obtener datos del reporte generado
    const reportData = localStorage.getItem('reporteIngresosCajaData');
    console.log('🔍 Buscando reporteIngresosCajaData en localStorage:', reportData);
    
    if (reportData) {
        try {
            const data = JSON.parse(reportData);
            console.log('📊 Datos del reporte encontrados:', data);
            if (data.inflows && Array.isArray(data.inflows)) {
                console.log(`✅ Ingresos del reporte:`, data.inflows.length, data.inflows);
                // Verificar que los ingresos tengan invoiceNumber
                data.inflows.forEach((inflow, idx) => {
                    if (!inflow.invoiceNumber) {
                        console.warn(`⚠️ Ingreso ${idx + 1} (${inflow.numero}) NO tiene invoiceNumber`);
                    }
                });
                return data.inflows;
            } else {
                console.log('❌ No hay ingresos en los datos del reporte');
            }
        } catch (e) {
            console.error('❌ Error parseando datos del reporte:', e);
        }
    } else {
        console.log('❌ No se encontró reporteIngresosCajaData en localStorage');
    }
    
    const params = parseQuery();
    console.log('📅 Parámetros del reporte:', params);
    
    let ingresos = [];
    try {
        const raw = localStorage.getItem(`ingresosCaja_${params.ciudad}`);
        console.log('📦 Datos raw de localStorage:', raw);
        
        if (raw) {
            const data = JSON.parse(raw);
            console.log('📋 Datos parseados:', data);
            ingresos = Array.isArray(data) ? data : Object.values(data);
            console.log(`✅ Ingresos encontrados en localStorage:`, ingresos.length, ingresos);
        } else {
            console.log(`❌ No hay ingresos en localStorage para ciudad ${params.ciudad}`);
        }
    } catch(e) {
        console.error('❌ Error leyendo localStorage:', e);
    }
    
    // Filtrar por fechas si se proporcionan
    if (params.fechaInicial && params.fechaFinal) {
        console.log('📅 Filtrando por fechas:', {
            fechaInicial: params.fechaInicial,
            fechaFinal: params.fechaFinal
        });
        
        const start = new Date(params.fechaInicial + 'T00:00:00');
        const end = new Date(params.fechaFinal + 'T23:59:59');
        
        console.log('📅 Fechas para filtrado:', {
            start: start,
            end: end
        });
        
        const ingresosAntes = ingresos.length;
        ingresos = ingresos.filter(i => {
            const inflowDate = new Date(i.fecha || i.date);
            const estaEnRango = inflowDate >= start && inflowDate <= end;
            return estaEnRango;
        });
        
        console.log(`📊 Ingresos filtrados: ${ingresosAntes} -> ${ingresos.length}`);
    }
    
    console.log('✅ Ingresos finales encontrados:', ingresos.length, ingresos);
    return ingresos;
}

/**
 * RENDERIZAR TABLA
 * 
 * Renderiza los datos en la tabla del reporte.
 */
function renderTable() {
    console.log('Renderizando tabla...');
    
    const tbody = document.getElementById('tbody');
    if (!tbody) {
        console.error('No se encontró el elemento tbody');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (window.__rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; padding: 40px; color: #6c757d;">
                    <i class="fas fa-money-bill-wave" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    <p>No se encontraron ingresos a caja para el período seleccionado</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Calcular índices para la página actual
    const startIndex = (window.__page - 1) * window.__pageSize;
    const endIndex = Math.min(startIndex + window.__pageSize, window.__rows.length);
    const pageData = window.__rows.slice(startIndex, endIndex);
    
    console.log(`Renderizando página ${window.__page}: ${startIndex} - ${endIndex}`);
    
    // Usar la ciudad guardada en window.__reportCity o parseQuery como fallback
    const city = window.__reportCity || parseQuery().ciudad || '';
    console.log('🏙️ Ciudad para renderizar:', city);
    
    pageData.forEach((inflow, index) => {
        const row = document.createElement('tr');
        
        // Formatear fecha
        const formattedDate = formatDate(inflow.fecha || inflow.date);
        
        // Obtener tipo de ingreso (solo código)
        const tipoIngreso = inflow.tipoIngresoCodigo || inflow.tipo || '';
        
        // Formatear cuota
        const cuotaFormatted = formatNumberValue(inflow.cuota || 0);
        
        // Formatear valor
        const valorFormatted = formatNumberValue(inflow.valor || 0);
        
        // Obtener nombre del titular
        const titularNombre = inflow.holderName || '';
        
        // Determinar si es CI o CR
        const category = getIncomeTypeCategory ? getIncomeTypeCategory(inflow.tipoIngresoCodigo) : null;
        
        // Obtener factura y contrato según el tipo
        let contractNumber = '';
        let invoiceNumber = '';
        
        if (category === 'CI') {
            // Para CI: invoiceNumber contiene el número de contrato, no hay factura
            contractNumber = inflow.invoiceNumber || '';
            invoiceNumber = ''; // No mostrar factura para CI
        } else {
            // Para CR u otros: buscar factura y contrato normalmente
            console.log('=== DEBUG REPORTE ===');
            console.log('Ingreso:', inflow.numero);
            console.log('Factura en ingreso:', inflow.invoiceNumber);
            console.log('Ciudad:', city);
            const invoiceInfo = getInvoiceAndContractByNumber(inflow.invoiceNumber, city);
            console.log('Resultado búsqueda:', invoiceInfo);
            contractNumber = invoiceInfo.contractNumber || '';
            invoiceNumber = invoiceInfo.invoiceNumber || inflow.invoiceNumber || '';
            console.log('Contrato final:', contractNumber);
            console.log('Factura final:', invoiceNumber);
        }
        
        // Obtener recibo oficial
        const reciboOficial = inflow.reciboOficial || '';
        
        // Obtener ingreso a banco relacionado para papeleta y cuenta bancaria
        const ingresoBancoInfo = getIngresoBancoByIngresoCaja(inflow.numero, city);
        const papeleta = ingresoBancoInfo.papeleta || '';
        const cuentaBancaria = ingresoBancoInfo.cuentaBancaria || '';
        
        // Obtener nombre del ejecutivo
        const nombreEjecutivo = inflow.executiveName || '';
        
        row.innerHTML = `
            <td>${inflow.numero || ''}</td>
            <td>${tipoIngreso}</td>
            <td>${cuotaFormatted}</td>
            <td>${formattedDate}</td>
            <td>${valorFormatted}</td>
            <td>${titularNombre}</td>
            <td>${contractNumber}</td>
            <td>${invoiceNumber}</td>
            <td>${reciboOficial}</td>
            <td>${papeleta}</td>
            <td>${cuentaBancaria}</td>
            <td>${nombreEjecutivo}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * OBTENER CATEGORÍA DEL TIPO DE INGRESO (CI o CR)
 * 
 * Determina si un tipo de ingreso es CI (Cuota Inicial) o CR (Cuota Recurrente)
 */
function getIncomeTypeCategory(tipoIngresoCodigo) {
    if (!tipoIngresoCodigo) return null;
    
    const codigo = String(tipoIngresoCodigo).toUpperCase().trim();
    
    // Verificar si el código contiene 'CI' o 'CR'
    if (codigo.includes('CI') || codigo === 'CI') {
        return 'CI';
    }
    if (codigo.includes('CR') || codigo === 'CR') {
        return 'CR';
    }
    
    // Si no se puede determinar por código, intentar por nombre del tipo de ingreso
    try {
        const incomeType = window.getIncomeTypeByCode ? window.getIncomeTypeByCode(codigo) : null;
        if (incomeType) {
            const nombre = String(incomeType.nombre || '').toUpperCase();
            if (nombre.includes('CUENTA') && nombre.includes('INGRESAR')) {
                return 'CI';
            }
            if (nombre.includes('CUENTA') && nombre.includes('RECIBIR')) {
                return 'CR';
            }
        }
    } catch (e) {
        console.error('Error obteniendo tipo de ingreso:', e);
    }
    
    return null;
}

/**
 * OBTENER FACTURA Y CONTRATO POR NÚMERO
 * 
 * Copiada exactamente de ingreso-caja.js para mantener la misma lógica
 */
function getInvoiceAndContractByNumber(invoiceNumber, city) {
    if (!invoiceNumber || !city) {
        return { invoiceNumber: '', contractNumber: '' };
    }
    
    try {
        // Buscar la factura en invoicesByCity
        const invoicesRaw = localStorage.getItem('invoicesByCity');
        if (!invoicesRaw) {
            return { invoiceNumber: invoiceNumber, contractNumber: '' };
        }
        
        const invoicesByCity = JSON.parse(invoicesRaw);
        const invoices = Array.isArray(invoicesByCity[city]) ? invoicesByCity[city] : [];
        
        // Buscar factura por número (comparar sin ceros a la izquierda y con ceros)
        console.log('Buscando factura:', invoiceNumber, 'en', invoices.length, 'facturas');
        const invoice = invoices.find(inv => {
            const invNum = String(inv.invoiceNumber || '').trim();
            const searchNum = String(invoiceNumber).trim();
            // Comparar con y sin ceros a la izquierda
            const match = invNum === searchNum || 
                   invNum.replace(/^0+/, '') === searchNum.replace(/^0+/, '') ||
                   invNum === searchNum.padStart(8, '0') ||
                   invNum.padStart(8, '0') === searchNum;
            if (match) {
                console.log('Factura encontrada:', invNum, 'vs', searchNum);
            }
            return match;
        });
        
        if (!invoice) {
            console.warn('Factura NO encontrada:', invoiceNumber);
            console.log('Facturas disponibles:', invoices.map(inv => inv.invoiceNumber));
            return { invoiceNumber: invoiceNumber, contractNumber: '' };
        }
        
        console.log('Factura encontrada:', invoice);
        console.log('ContractNumber en factura:', invoice.contractNumber);
        console.log('ContractId en factura:', invoice.contractId);
        
        // Obtener el número de contrato de la factura
        let contractNumber = invoice.contractNumber || invoice.contractId || '';
        console.log('ContractNumber inicial:', contractNumber);
        
        // Si no está en la factura, buscar en contratos usando contractId
        if (!contractNumber && invoice.contractId) {
            const contractsRaw = localStorage.getItem(`contratos_${city}`);
            if (contractsRaw) {
                const contracts = JSON.parse(contractsRaw);
                if (Array.isArray(contracts)) {
                    const contract = contracts.find(c => {
                        return String(c.id) === String(invoice.contractId) ||
                               String(c.contractNumber || c.numero || c.numeroContrato) === String(invoice.contractId);
                    });
                    if (contract) {
                        contractNumber = contract.contractNumber || contract.numero || contract.numeroContrato || '';
                    }
                }
            }
        }
        
        return {
            invoiceNumber: invoice.invoiceNumber || invoiceNumber,
            contractNumber: contractNumber
        };
    } catch (error) {
        console.error('Error obteniendo factura y contrato:', error);
        return { invoiceNumber: invoiceNumber, contractNumber: '' };
    }
}

/**
 * OBTENER INGRESO A BANCO POR NÚMERO DE INGRESO A CAJA
 * 
 * Busca el ingreso a banco relacionado con un ingreso a caja para obtener
 * papeleta y cuenta bancaria.
 */
function getIngresoBancoByIngresoCaja(numeroIngresoCaja, city) {
    if (!numeroIngresoCaja || !city) {
        return { papeleta: '', cuentaBancaria: '' };
    }
    
    try {
        console.log('🔍 Buscando ingreso a banco para ingreso a caja:', numeroIngresoCaja, 'en ciudad:', city);
        
        // Buscar en la clave correcta donde se guardan los ingresos a banco
        const key = `bankInflowData_${city}`;
        const raw = localStorage.getItem(key);
        
        if (!raw) {
            console.log('❌ No se encontró bankInflowData para ciudad:', city);
            return { papeleta: '', cuentaBancaria: '' };
        }
        
        const ingresosBanco = JSON.parse(raw);
        if (!Array.isArray(ingresosBanco)) {
            console.log('❌ Los datos de ingresos a banco no son un array');
            return { papeleta: '', cuentaBancaria: '' };
        }
        
        console.log('📋 Total ingresos a banco encontrados:', ingresosBanco.length);
        
        // Buscar ingreso a banco que tenga referencia al ingreso a caja
        const ingresoBanco = ingresosBanco.find(ib => {
            // Buscar por número de ingreso a caja guardado directamente
            const numeroCaja = String(ib.numeroIngresoCaja || '').trim();
            const searchNum = String(numeroIngresoCaja).trim();
            
            // También intentar extraer del cashInflowData si existe
            let numeroCajaFromData = '';
            if (ib.cashInflowData) {
                try {
                    const cashInflow = JSON.parse(ib.cashInflowData);
                    numeroCajaFromData = String(cashInflow.numero || '').trim();
                } catch (e) {
                    // Ignorar error de parsing
                }
            }
            
            const match = numeroCaja === searchNum || 
                         numeroCajaFromData === searchNum ||
                         numeroCaja.replace(/^0+/, '') === searchNum.replace(/^0+/, '') ||
                         numeroCajaFromData.replace(/^0+/, '') === searchNum.replace(/^0+/, '') ||
                         numeroCaja === searchNum.padStart(8, '0') ||
                         numeroCajaFromData === searchNum.padStart(8, '0');
            
            if (match) {
                console.log('✅ Ingreso a banco encontrado:', {
                    numero: ib.numero,
                    cuenta: ib.cuenta,
                    papeleta: ib.papeleta,
                    numeroIngresoCaja: ib.numeroIngresoCaja
                });
            }
            
            return match;
        });
        
        if (ingresoBanco) {
            // Obtener nombre de la cuenta bancaria si es necesario
            let cuentaBancaria = ingresoBanco.cuenta || '';
            
            // Si la cuenta es solo un número, intentar obtener el nombre completo de las cuentas bancarias
            if (cuentaBancaria) {
                try {
                    const bankAccountsRaw = localStorage.getItem('bankAccountsData');
                    if (bankAccountsRaw) {
                        const bankAccounts = JSON.parse(bankAccountsRaw);
                        if (Array.isArray(bankAccounts)) {
                            const account = bankAccounts.find(acc => acc.numeroCuenta === cuentaBancaria);
                            if (account) {
                                // Retornar el número de cuenta (o el nombre completo si se prefiere)
                                cuentaBancaria = account.numeroCuenta || cuentaBancaria;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error obteniendo información de cuenta bancaria:', e);
                }
            }
            
            return {
                papeleta: ingresoBanco.papeleta || '',
                cuentaBancaria: cuentaBancaria
            };
        }
        
        console.log('❌ No se encontró ingreso a banco relacionado');
        return { papeleta: '', cuentaBancaria: '' };
    } catch (error) {
        console.error('❌ Error obteniendo ingreso a banco:', error);
        return { papeleta: '', cuentaBancaria: '' };
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function formatNumberValue(value) {
    if (value === null || value === undefined || value === '') return '0';
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
    if (isNaN(num)) return '0';
    return Math.floor(num).toLocaleString('es-CO');
}

/**
 * ACTUALIZAR PAGINACIÓN
 * 
 * Actualiza los controles de paginación.
 */
function updatePagination() {
    const totalPages = Math.ceil(window.__rows.length / window.__pageSize);
    
    document.getElementById('currentPage').value = window.__page;
    document.getElementById('totalPages').textContent = totalPages;
    
    // Actualizar número de página en el header
    document.getElementById('paginaActual').textContent = window.__page;
    
    // Habilitar/deshabilitar botones
    const firstBtn = document.querySelector('.pagination-controls button:first-child');
    const prevBtn = document.querySelector('.pagination-controls button:nth-child(2)');
    const nextBtn = document.querySelector('.pagination-controls button:nth-child(4)');
    const lastBtn = document.querySelector('.pagination-controls button:last-child');
    
    if (firstBtn) firstBtn.disabled = window.__page === 1;
    if (prevBtn) prevBtn.disabled = window.__page === 1;
    if (nextBtn) nextBtn.disabled = window.__page === totalPages;
    if (lastBtn) lastBtn.disabled = window.__page === totalPages;
}

/**
 * NAVEGACIÓN DE PÁGINAS
 */
function goFirst() {
    if (window.__page > 1) {
        window.__page = 1;
        renderTable();
        updatePagination();
    }
}

function goPrevious() {
    if (window.__page > 1) {
        window.__page--;
        renderTable();
        updatePagination();
    }
}

function goNext() {
    const totalPages = Math.ceil(window.__rows.length / window.__pageSize);
    if (window.__page < totalPages) {
        window.__page++;
        renderTable();
        updatePagination();
    }
}

function goLast() {
    const totalPages = Math.ceil(window.__rows.length / window.__pageSize);
    if (window.__page < totalPages) {
        window.__page = totalPages;
        renderTable();
        updatePagination();
    }
}

function goToPage(page) {
    const pageNum = parseInt(page);
    const totalPages = Math.ceil(window.__rows.length / window.__pageSize);
    if (pageNum >= 1 && pageNum <= totalPages) {
        window.__page = pageNum;
        renderTable();
        updatePagination();
    } else {
        document.getElementById('currentPage').value = window.__page;
    }
}

/**
 * ZOOM
 */
function setZoom(delta) {
    window.__zoom = Math.max(0.5, Math.min(2, window.__zoom + delta));
    const container = document.getElementById('reportRoot');
    if (container) {
        container.style.transform = `scale(${window.__zoom})`;
        container.style.transformOrigin = 'top left';
        document.getElementById('zoomLevel').textContent = Math.round(window.__zoom * 100) + '%';
    }
}

/**
 * OBTENER NOMBRE DE CIUDAD
 * 
 * Obtiene el nombre de la ciudad basado en el código.
 */
function getCiudadNombre(codigoCiudad) {
    const ciudades = {
        '101': 'BOGOTÁ',
        '102': 'MEDELLÍN',
        '103': 'CALI',
        '104': 'BARRANQUILLA',
        '105': 'CARTAGENA',
        '106': 'CÚCUTA',
        '107': 'BUCARAMANGA',
        '108': 'PEREIRA',
        '109': 'SANTA MARTA',
        '110': 'IBAGUÉ'
    };
    
    return ciudades[codigoCiudad] || `CIUDAD ${codigoCiudad}`;
}

/**
 * FORMATEAR FECHA
 * 
 * Formatea la fecha actual para el reporte.
 */
function getFechaActual() {
    const ahora = new Date();
    return ahora.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * FORMATO DE FECHAS
 */
function formatearFecha(fecha) {
    if (!fecha) return '';
    try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        console.error('Error formateando fecha:', e);
        return fecha || '';
    }
}

/**
 * INICIALIZACIÓN
 */
function init() {
    console.log('🚀 Inicializando reporte de ingresos a caja...');
    
    // Obtener datos del reporte primero para obtener la ciudad
    const reportData = localStorage.getItem('reporteIngresosCajaData');
    let reportCity = '';
    if (reportData) {
        try {
            const data = JSON.parse(reportData);
            reportCity = data.city || '';
            console.log('🏙️ Ciudad del reporte:', reportCity);
        } catch (e) {
            console.error('Error parseando datos del reporte:', e);
        }
    }
    
    // Obtener parámetros de URL (fallback)
    const params = parseQuery();
    console.log('📅 Parámetros del reporte:', params);
    
    // Usar ciudad del reporte si está disponible, sino usar la de los parámetros
    const city = reportCity || params.ciudad;
    console.log('🏙️ Ciudad a usar:', city);
    
    // Guardar ciudad en variable global para usar en renderTable
    window.__reportCity = city;
    
    // Obtener datos
    window.__rows = getIngresosCaja();
    console.log('📊 Datos obtenidos para el reporte:', window.__rows);
    console.log('📊 Cantidad de ingresos:', window.__rows.length);
    
    // Verificar si hay datos
    if (!window.__rows || window.__rows.length === 0) {
        console.log('❌ No hay datos para mostrar en el reporte');
        showError('No se encontraron ingresos a caja para el período seleccionado');
        return;
    }
    
    // Verificar que los ingresos tengan invoiceNumber
    console.log('🔍 Verificando invoiceNumber en ingresos:');
    window.__rows.forEach((inflow, idx) => {
        console.log(`Ingreso ${idx + 1}:`, {
            numero: inflow.numero,
            invoiceNumber: inflow.invoiceNumber,
            tieneInvoiceNumber: !!inflow.invoiceNumber
        });
    });
    
    // Verificar que las facturas estén disponibles
    const invoicesRaw = localStorage.getItem('invoicesByCity');
    if (invoicesRaw) {
        const invoicesByCity = JSON.parse(invoicesRaw);
        console.log('📋 Facturas disponibles por ciudad:', Object.keys(invoicesByCity));
        if (invoicesByCity[city]) {
            console.log(`📋 Facturas en ciudad ${city}:`, invoicesByCity[city].length);
            console.log('Primeras 3 facturas:', invoicesByCity[city].slice(0, 3).map(inv => ({
                invoiceNumber: inv.invoiceNumber,
                contractNumber: inv.contractNumber,
                contractId: inv.contractId
            })));
        }
    } else {
        console.warn('⚠️ No hay facturas en invoicesByCity');
    }
    
    // Actualizar información del reporte
    const ciudadNombre = getCiudadNombre(city);
    const fechaActual = getFechaActual();
    
    // Llenar información del header
    document.getElementById('codigoCiudad').textContent = city;
    document.getElementById('ciudadNombre').textContent = ciudadNombre;
    document.getElementById('fechaReporte').textContent = fechaActual;
    document.getElementById('totalIngresos').textContent = window.__rows.length;
    
    // Renderizar tabla
    renderTable();
    
    // Actualizar paginación
    updatePagination();
    
    console.log('✅ Reporte inicializado correctamente');
}

/**
 * EXPORTACIÓN A EXCEL
 */
function exportExcel(){
    console.log('📊 Iniciando exportación a Excel...');
    const rows = window.__rows || [];
    console.log('📋 Datos para exportar:', rows);
    
    if (!rows || rows.length === 0) {
        console.log('❌ No hay datos para exportar');
        alert('No hay datos para exportar');
        return;
    }
    
    const params = parseQuery();
    // Usar la ciudad del reporte guardada o la de los parámetros
    const city = window.__reportCity || params.ciudad;
    console.log('🏙️ Ciudad para exportación Excel:', city);
    
    const excelHTML = `
        <html>
            <head>
                <meta charset='utf-8'>
                <title>Reporte de Ingresos a Caja</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        font-size: 12px;
                    }
                    .report-title { 
                        font-size: 18px; 
                        font-weight: bold; 
                        text-align: center; 
                        margin-bottom: 10px; 
                        text-transform: uppercase;
                    }
                    .report-subtitle { 
                        font-size: 14px; 
                        text-align: center; 
                        margin-bottom: 10px; 
                        color: #666; 
                        text-transform: uppercase;
                    }
                    .report-info { 
                        font-size: 12px; 
                        text-align: center; 
                        margin-bottom: 20px; 
                        color: #888; 
                        text-transform: uppercase;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 0 auto 20px auto; 
                        border: 1px solid #000;
                    }
                    th, td { 
                        border: 1px solid #000; 
                        padding: 8px; 
                        text-align: left; 
                        font-size: 12px;
                        vertical-align: top;
                    }
                    th { 
                        background-color: #f0f0f0; 
                        font-weight: bold; 
                        text-transform: uppercase;
                    }
                    .footer { 
                        text-align: center; 
                        font-size: 10px; 
                        color: #888; 
                        margin-top: 20px; 
                    }
                    .report-container {
                        text-align: center;
                        margin: 0 auto;
                    }
                    .table-container {
                        text-align: center;
                        margin: 0 auto;
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="report-header">
                        <div class="report-title">GOLDEN BRIDGE CORP. S.A.S.</div>
                        <div class="report-subtitle">REPORTE DE INGRESOS A CAJA DE LA CIUDAD: ${getCiudadNombre(params.ciudad)} Fecha: ${getFechaActual()} Página: 1</div>
                        <div class="report-info">Total de Ingresos: ${rows.length}</div>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>NO DE INGRESO</th>
                                    <th>TP TIPO</th>
                                    <th>CUOTA</th>
                                    <th>FECHA</th>
                                    <th>VALOR</th>
                                    <th>TITULAR</th>
                                    <th>CONTRATO</th>
                                    <th>FACTURA</th>
                                    <th>RECIBO</th>
                                    <th>PAPELETA</th>
                                    <th>CTA BANCARIA</th>
                                    <th>NOMBRE EJECUTIVO</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(inflow => {
                                    const tipoIngreso = inflow.tipoIngresoCodigo || inflow.tipo || '';
                                    const cuotaFormatted = formatNumberValue(inflow.cuota || 0);
                                    const valorFormatted = formatNumberValue(inflow.valor || 0);
                                    const titularNombre = inflow.holderName || '';
                                    
                                    // Determinar si es CI o CR
                                    const category = getIncomeTypeCategory(inflow.tipoIngresoCodigo);
                                    
                                    // Obtener factura y contrato según el tipo
                                    let contractNumber = '';
                                    let invoiceNumber = '';
                                    
                                    if (category === 'CI') {
                                        // Para CI: invoiceNumber contiene el número de contrato, no hay factura
                                        contractNumber = inflow.invoiceNumber || '';
                                        invoiceNumber = ''; // No mostrar factura para CI
                                    } else {
                                        // Para CR u otros: buscar factura y contrato normalmente
                                        const invoiceInfo = getInvoiceAndContractByNumber(inflow.invoiceNumber, city);
                                        contractNumber = invoiceInfo.contractNumber || '';
                                        invoiceNumber = invoiceInfo.invoiceNumber || inflow.invoiceNumber || '';
                                    }
                                    
                                    const reciboOficial = inflow.reciboOficial || '';
                                    
                                    // Obtener datos del ingreso a banco
                                    const ingresoBancoInfo = getIngresoBancoByIngresoCaja(inflow.numero, city);
                                    const papeleta = ingresoBancoInfo.papeleta || '';
                                    const cuentaBancaria = ingresoBancoInfo.cuentaBancaria || '';
                                    const nombreEjecutivo = inflow.executiveName || '';
                                    
                                    // Debug para exportación
                                    if (!papeleta && !cuentaBancaria) {
                                        console.log(`⚠️ No se encontró ingreso a banco para ingreso a caja: ${inflow.numero} en ciudad: ${city}`);
                                    }
                                    
                                    return `
                                        <tr>
                                            <td>${(inflow.numero||'').toString().toUpperCase()}</td>
                                            <td>${tipoIngreso.toUpperCase()}</td>
                                            <td>${cuotaFormatted}</td>
                                            <td>${formatearFecha(inflow.fecha || inflow.date)}</td>
                                            <td>${valorFormatted}</td>
                                            <td>${titularNombre.toUpperCase()}</td>
                                            <td>${contractNumber.toUpperCase()}</td>
                                            <td>${invoiceNumber.toUpperCase()}</td>
                                            <td>${reciboOficial.toUpperCase()}</td>
                                            <td>${papeleta.toUpperCase()}</td>
                                            <td>${cuentaBancaria.toUpperCase()}</td>
                                            <td>${nombreEjecutivo.toUpperCase()}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="footer">© 2025 - GOLDEN APP</div>
                </div>
            </body>
        </html>
    `;
    
    try {
        const blob = new Blob([excelHTML], {type:'application/vnd.ms-excel'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href=url; 
        a.download='reporte-ingresos-caja.xls'; 
        a.click(); 
        URL.revokeObjectURL(url);
        console.log('✅ Archivo Excel generado exitosamente');
    } catch (error) {
        console.error('❌ Error generando Excel:', error);
        alert('Error al generar el archivo Excel');
    }
}

/**
 * EXPORTACIÓN A WORD
 */
function exportDOC(){
    console.log('📝 Iniciando exportación a Word...');
    const rows = window.__rows || [];
    console.log('📋 Datos para exportar:', rows);
    
    if (!rows || rows.length === 0) {
        console.log('❌ No hay datos para exportar');
        alert('No hay datos para exportar');
        return;
    }
    
    const cleanHTML = generarHTMLLimpio();
    const params = parseQuery();
    
    const blob = new Blob([`
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset='utf-8'>
                <meta name="ProgId" content="Word.Document">
                <meta name="Generator" content="Microsoft Word 15">
                <meta name="Originator" content="Microsoft Word 15">
                <title>Reporte de Ingresos a Caja</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>90</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 1cm 0.5cm;
                    }
                    
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 10px;
                        font-size: 10px;
                        line-height: 1.2;
                    }
                    
                    .report-title { 
                        font-size: 16px; 
                        font-weight: bold; 
                        text-align: center; 
                        margin-bottom: 8px; 
                        text-transform: uppercase;
                    }
                    
                    .report-subtitle { 
                        font-size: 12px; 
                        text-align: center; 
                        margin-bottom: 8px; 
                        color: #666; 
                        text-transform: uppercase;
                    }
                    
                    .report-info { 
                        font-size: 10px; 
                        text-align: center; 
                        margin-bottom: 15px; 
                        color: #888; 
                        text-transform: uppercase;
                    }
                    
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 0 auto 15px auto; 
                        border: 1px solid #000;
                        table-layout: fixed;
                    }
                    
                    th, td { 
                        border: 1px solid #000; 
                        padding: 4px 3px; 
                        text-align: left; 
                        font-size: 9px;
                        vertical-align: top;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                    }
                    
                    th { 
                        background-color: #f0f0f0; 
                        font-weight: bold; 
                        text-transform: uppercase;
                        font-size: 8px;
                    }
                    
                    /* Anchos específicos para cada columna */
                    th:nth-child(1), td:nth-child(1) { width: 8%; }  /* No de Ingreso */
                    th:nth-child(2), td:nth-child(2) { width: 6%; }  /* TP Tipo */
                    th:nth-child(3), td:nth-child(3) { width: 6%; }  /* Cuota */
                    th:nth-child(4), td:nth-child(4) { width: 7%; }  /* Fecha */
                    th:nth-child(5), td:nth-child(5) { width: 8%; }   /* Valor */
                    th:nth-child(6), td:nth-child(6) { width: 12%; } /* Titular */
                    th:nth-child(7), td:nth-child(7) { width: 8%; }  /* Contrato */
                    th:nth-child(8), td:nth-child(8) { width: 8%; }  /* Factura */
                    th:nth-child(9), td:nth-child(9) { width: 8%; }  /* Recibo */
                    th:nth-child(10), td:nth-child(10) { width: 8%; } /* Papeleta */
                    th:nth-child(11), td:nth-child(11) { width: 10%; } /* Cta Bancaria */
                    th:nth-child(12), td:nth-child(12) { width: 11%; } /* Nombre Ejecutivo */
                    
                    .footer { 
                        text-align: center; 
                        font-size: 8px; 
                        color: #888; 
                        margin-top: 15px; 
                    }
                    
                    .report-container {
                        text-align: center;
                        margin: 0 auto;
                        width: 100%;
                    }
                    
                    .table-container {
                        text-align: center;
                        margin: 0 auto;
                        width: 100%;
                        overflow: visible;
                    }
                    
                    tr {
                        page-break-inside: avoid;
                    }
                    
                    .monetary {
                        text-align: right;
                    }
                    
                    .numeric {
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                ${cleanHTML}
            </body>
        </html>
    `], {type:'application/msword'});
    
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href=url; 
        a.download='reporte-ingresos-caja.doc'; 
        a.click(); 
        URL.revokeObjectURL(url);
        console.log('✅ Archivo Word generado exitosamente');
    } catch (error) {
        console.error('❌ Error generando Word:', error);
        alert('Error al generar el archivo Word');
    }
}

/**
 * EXPORTACIÓN A PDF
 */
function exportPDF(){
    // Abrir directamente el diálogo de impresión del navegador
    window.print();
}

/**
 * GENERAR HTML LIMPIO
 */
function generarHTMLLimpio() {
    const rows = window.__rows || [];
    const params = parseQuery();
    // Usar la ciudad del reporte guardada o la de los parámetros
    const city = window.__reportCity || params.ciudad;
    console.log('🏙️ Ciudad para exportación Word:', city);
    
    const filasTabla = rows.map(inflow => {
        const tipoIngreso = inflow.tipoIngresoCodigo || inflow.tipo || '';
        const cuotaFormatted = formatNumberValue(inflow.cuota || 0);
        const valorFormatted = formatNumberValue(inflow.valor || 0);
        const titularNombre = inflow.holderName || '';
        
        // Determinar si es CI o CR
        const category = getIncomeTypeCategory ? getIncomeTypeCategory(inflow.tipoIngresoCodigo) : null;
        
        // Obtener factura y contrato según el tipo
        let contractNumber = '';
        let invoiceNumber = '';
        
        if (category === 'CI') {
            // Para CI: invoiceNumber contiene el número de contrato, no hay factura
            contractNumber = inflow.invoiceNumber || '';
            invoiceNumber = ''; // No mostrar factura para CI
        } else {
            // Para CR u otros: buscar factura y contrato normalmente
            const invoiceInfo = getInvoiceAndContractByNumber(inflow.invoiceNumber, city);
            contractNumber = invoiceInfo.contractNumber || '';
            invoiceNumber = invoiceInfo.invoiceNumber || inflow.invoiceNumber || '';
        }
        
        const reciboOficial = inflow.reciboOficial || '';
        
        // Obtener datos del ingreso a banco
        const ingresoBancoInfo = getIngresoBancoByIngresoCaja(inflow.numero, city);
        const papeleta = ingresoBancoInfo.papeleta || '';
        const cuentaBancaria = ingresoBancoInfo.cuentaBancaria || '';
        const nombreEjecutivo = inflow.executiveName || '';
        
        // Debug para exportación
        if (!papeleta && !cuentaBancaria) {
            console.log(`⚠️ No se encontró ingreso a banco para ingreso a caja: ${inflow.numero} en ciudad: ${city}`);
        }
        
        return `
            <tr>
                <td>${(inflow.numero||'').toString().toUpperCase()}</td>
                <td>${tipoIngreso.toUpperCase()}</td>
                <td class="numeric">${cuotaFormatted}</td>
                <td class="numeric">${formatearFecha(inflow.fecha || inflow.date)}</td>
                <td class="monetary">${valorFormatted}</td>
                <td>${titularNombre.toUpperCase()}</td>
                <td>${contractNumber.toUpperCase()}</td>
                <td>${invoiceNumber.toUpperCase()}</td>
                <td>${reciboOficial.toUpperCase()}</td>
                <td>${papeleta.toUpperCase()}</td>
                <td>${cuentaBancaria.toUpperCase()}</td>
                <td>${nombreEjecutivo.toUpperCase()}</td>
            </tr>
        `;
    }).join('');
    
    return `
        <div class="report-container">
            <div class="report-header">
                <div class="report-title">GOLDEN BRIDGE CORP. S.A.S.</div>
                <div class="report-subtitle">REPORTE DE INGRESOS A CAJA DE LA CIUDAD: ${getCiudadNombre(params.ciudad)} Fecha: ${getFechaActual()}</div>
                <div class="report-info">Total de Ingresos: ${rows.length}</div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>NO DE INGRESO</th>
                            <th>TP TIPO</th>
                            <th>CUOTA</th>
                            <th>FECHA</th>
                            <th>VALOR</th>
                            <th>TITULAR</th>
                            <th>CONTRATO</th>
                            <th>FACTURA</th>
                            <th>RECIBO</th>
                            <th>PAPELETA</th>
                            <th>CTA BANCARIA</th>
                            <th>NOMBRE EJECUTIVO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasTabla}
                    </tbody>
                </table>
            </div>
            <div class="footer">© 2025 - GOLDEN APP</div>
        </div>
    `;
}

/**
 * MOSTRAR ERROR
 */
function showError(message) {
    const tbody = document.getElementById('tbody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 20px; color: #666;">${message}</td></tr>`;
    }
    console.error('❌ Error en el reporte:', message);
}

/**
 * NOTIFICACIONES
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', init);

