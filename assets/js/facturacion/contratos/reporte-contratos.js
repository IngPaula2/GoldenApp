/**
 * MÓDULO DE REPORTE DE CONTRATOS
 * 
 * Este archivo maneja la visualización y exportación de reportes de contratos.
 * Incluye funciones de paginación, búsqueda, zoom y exportación a diferentes formatos.
 * 
 * FUNCIONALIDADES:
 * - Visualización de datos de contratos
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
 * OBTENER DATOS DE CONTRATOS
 * 
 * Recupera los datos de contratos desde localStorage.
 */
function getContratos(){
    console.log('🔍 Buscando contratos...');
    
    // Primero intentar obtener datos del reporte generado
    const reportData = localStorage.getItem('reporteContratosData');
    console.log('🔍 Buscando reporteContratosData en localStorage:', reportData);
    console.log('🔍 Todas las claves en localStorage:', Object.keys(localStorage));
    
    if (reportData) {
        try {
            const data = JSON.parse(reportData);
            console.log('📊 Datos del reporte encontrados:', data);
            if (data.contracts && Array.isArray(data.contracts)) {
                console.log(`✅ Contratos del reporte:`, data.contracts.length, data.contracts);
                return data.contracts;
            } else {
                console.log('❌ No hay contratos en los datos del reporte');
            }
        } catch (e) {
            console.error('❌ Error parseando datos del reporte:', e);
        }
    } else {
        console.log('❌ No se encontró reporteContratosData en localStorage');
    }
    
    const params = parseQuery();
    console.log('📅 Parámetros del reporte:', params);
    
    let contratos = [];
    try {
        const raw = localStorage.getItem(`contracts_${params.ciudad}`);
        console.log('📦 Datos raw de localStorage:', raw);
        
        if (raw) {
            const data = JSON.parse(raw);
            console.log('📋 Datos parseados:', data);
            contratos = Array.isArray(data) ? data : Object.values(data);
            console.log(`✅ Contratos encontrados en localStorage:`, contratos.length, contratos);
        } else {
            console.log(`❌ No hay contratos en localStorage para ciudad ${params.ciudad}`);
            
            // Intentar buscar en todas las claves de localStorage
            console.log('🔍 Buscando en todas las claves de localStorage...');
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                console.log(`🔑 Clave ${i}:`, key);
                if (key && key.startsWith('contracts_')) {
                    const value = localStorage.getItem(key);
                    console.log(`📄 Valor de ${key}:`, value);
                }
            }
        }
    } catch(e) {
        console.error('❌ Error leyendo localStorage:', e);
    }
    
    // Filtrar por fechas si se proporcionan
    if (params.fechaInicial && params.fechaFinal) {
        console.log('📅 Filtrando por fechas:', {
            fechaInicial: params.fechaInicial,
            fechaFinal: params.fechaFinal,
            tipoFechaInicial: typeof params.fechaInicial,
            tipoFechaFinal: typeof params.fechaFinal
        });
        
        const start = new Date(params.fechaInicial + 'T00:00:00');
        const end = new Date(params.fechaFinal + 'T23:59:59');
        
        console.log('📅 Fechas para filtrado:', {
            start: start,
            end: end,
            startISO: start.toISOString(),
            endISO: end.toISOString()
        });
        
        const contratosAntes = contratos.length;
        contratos = contratos.filter(c => {
            const contractDate = new Date(c.contractDate);
            const estaEnRango = contractDate >= start && contractDate <= end;
            
            console.log('📅 Verificando contrato:', {
                contractNumber: c.contractNumber,
                contractDate: c.contractDate,
                contractDateObj: contractDate,
                contractDateISO: contractDate.toISOString(),
                start: start,
                end: end,
                startISO: start.toISOString(),
                endISO: end.toISOString(),
                mayorIgual: contractDate >= start,
                menorIgual: contractDate <= end,
                estaEnRango: estaEnRango
            });
            
            return estaEnRango;
        });
        
        console.log(`📊 Contratos filtrados: ${contratosAntes} -> ${contratos.length}`);
        console.log('📋 Contratos filtrados por fechas:', contratos);
    }
    
    console.log('✅ Contratos finales encontrados:', contratos.length, contratos);
    return contratos;
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
                    <i class="fas fa-file-contract" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    <p>No se encontraron contratos para el período seleccionado</p>
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
    
    pageData.forEach((contract, index) => {
        const row = document.createElement('tr');
        
        // Formatear fecha
        const formattedDate = formatDate(contract.contractDate);
        
        // Determinar estado
        const estado = contract.estado === 'activo' ? 'ACTIVO' : 'ANULADO';
        
        // Obtener información del plan
        let planInfo = {
            valorTotal: '-',
            cuotaInicial: '-',
            numCuotas: '0',
            valorCuota: '-'
        };
        
        if (contract.planData) {
            const planData = typeof contract.planData === 'string' ? JSON.parse(contract.planData) : contract.planData;
            console.log('📊 Datos del plan para contrato', contract.contractNumber, 'Plan:', contract.plan, ':', planData);
            console.log('🔍 Todos los campos disponibles:', Object.keys(planData));
            console.log('🔍 Campos específicos:', {
                valorPlan: planData.valorPlan,
                cuotaInicial: planData.cuotaInicial,
                numCuotas: planData.numCuotas,
                numeroCuotas: planData.numeroCuotas,
                cuotas: planData.cuotas,
                totalCuotas: planData.totalCuotas,
                mensualidad: planData.mensualidad
            });
            
            // Obtener número de cuotas con diferentes nombres posibles
            const numCuotas = planData.numCuotas || planData.numeroCuotas || planData.cuotas || planData.totalCuotas || '0';
            console.log('🔢 Número de cuotas encontrado:', numCuotas, 'para plan:', contract.plan);
            
            planInfo = {
                valorTotal: planData.valorPlan ? `$${Number(planData.valorPlan).toLocaleString('es-CO')}` : '-',
                cuotaInicial: planData.cuotaInicial ? `$${Number(planData.cuotaInicial).toLocaleString('es-CO')}` : '-',
                numCuotas: numCuotas,
                valorCuota: planData.mensualidad ? `$${Number(planData.mensualidad).toLocaleString('es-CO')}` : '-'
            };
            
            console.log('📋 Información del plan procesada:', planInfo);
        } else {
            console.log('❌ No hay datos del plan para contrato:', contract.contractNumber, 'Plan:', contract.plan);
        }
        
        row.innerHTML = `
            <td>${contract.contractNumber}</td>
            <td>${contract.productionRecord}</td>
            <td>${contract.clientId}</td>
            <td>${contract.clientName}</td>
            <td>${contract.plan}</td>
            <td>${planInfo.valorTotal}</td>
            <td>${planInfo.cuotaInicial}</td>
            <td>${planInfo.numCuotas}</td>
            <td>${planInfo.valorCuota}</td>
            <td>${contract.executive}</td>
            <td>${estado}</td>
            <td>${formattedDate}</td>
        `;
        
        tbody.appendChild(row);
    });
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
 * EXPORTACIÓN
 */
function exportCSV() {
    console.log('Exportando a CSV...');
    showNotification('Funcionalidad de exportación a Excel en desarrollo', 'info');
}

function exportDOC() {
    console.log('Exportando a Word...');
    showNotification('Funcionalidad de exportación a Word en desarrollo', 'info');
}

function exportPDF() {
    console.log('Exportando a PDF...');
    showNotification('Funcionalidad de exportación a PDF en desarrollo', 'info');
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
 * DEBUGGING: MOSTRAR TODOS LOS DATOS DE LOCALSTORAGE
 */
function debugLocalStorage() {
    console.log('🔍 DEBUGGING: Mostrando todos los datos de localStorage...');
    console.log('📊 Total de elementos en localStorage:', localStorage.length);
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`🔑 ${i}: ${key} = ${value}`);
        
        if (key && key.startsWith('contracts_')) {
            try {
                const parsed = JSON.parse(value);
                console.log(`📋 ${key} parseado:`, parsed);
            } catch (e) {
                console.log(`❌ Error parseando ${key}:`, e);
            }
        }
    }
}

/**
 * INICIALIZACIÓN
 */
function init() {
    console.log('🚀 Inicializando reporte de contratos...');
    
    // Debugging: mostrar todos los datos de localStorage
    debugLocalStorage();
    
    // Obtener parámetros
    const params = parseQuery();
    console.log('📅 Parámetros del reporte:', params);
    
    // Obtener datos
    window.__rows = getContratos();
    console.log('📊 Datos obtenidos para el reporte:', window.__rows);
    console.log('📊 Cantidad de contratos:', window.__rows.length);
    
    // Verificar si hay datos
    if (!window.__rows || window.__rows.length === 0) {
        console.log('❌ No hay datos para mostrar en el reporte');
        showError('No se encontraron contratos para el período seleccionado');
        return;
    }
    
    // Actualizar información del reporte
    const ciudadNombre = getCiudadNombre(params.ciudad);
    const fechaActual = getFechaActual();
    
    // Llenar información del header
    document.getElementById('codigoCiudad').textContent = params.ciudad;
    document.getElementById('ciudadNombre').textContent = ciudadNombre;
    document.getElementById('fechaReporte').textContent = fechaActual;
    document.getElementById('totalContratos').textContent = window.__rows.length;
    
    // Renderizar tabla
    renderTable();
    
    // Actualizar paginación
    updatePagination();
    
    console.log('✅ Reporte inicializado correctamente');
}

/**
 * EXPORTACIÓN A EXCEL
 * 
 * Genera y descarga un archivo Excel con los datos del reporte.
 * Utiliza formato HTML para compatibilidad con Excel.
 * 
 * BACKEND INTEGRATION:
 * - POST /api/contratos/export/excel - Enviar datos para generar Excel
 * - GET /api/contratos/export/excel/download - Descargar archivo generado
 * - Aplicar plantillas y formato corporativo
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
    
    const excelHTML = `
        <html>
            <head>
                <meta charset='utf-8'>
                <title>Reporte de Contratos</title>
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
                        <div class="report-subtitle">REPORTE DE CONTRATOS DE LA CIUDAD: ${getCiudadNombre(parseQuery().ciudad)} Fecha: ${getFechaActual()} Página: 1</div>
                        <div class="report-info">Total de Contratos: ${rows.length}</div>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th># CONTRATO</th>
                                    <th>RECORD PRODUCCIÓN</th>
                                    <th>ID CLIENTE</th>
                                    <th>NOMBRE TITULAR</th>
                                    <th>PLAN</th>
                                    <th>VALOR TOTAL</th>
                                    <th>CUOTA INICIAL</th>
                                    <th># CUOTAS</th>
                                    <th>VALOR CUOTA</th>
                                    <th>EJECUTIVO</th>
                                    <th>ESTADO</th>
                                    <th>FECHA CONTRATO</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(c => {
                                    // Obtener información del plan
                                    let planInfo = {
                                        valorTotal: '-',
                                        cuotaInicial: '-',
                                        numCuotas: '0',
                                        valorCuota: '-'
                                    };
                                    
                                    if (c.planData) {
                                        const planData = typeof c.planData === 'string' ? JSON.parse(c.planData) : c.planData;
                                        // Obtener número de cuotas con diferentes nombres posibles
                                        const numCuotas = planData.numCuotas || planData.numeroCuotas || planData.cuotas || planData.totalCuotas || '0';
                                        planInfo = {
                                            valorTotal: planData.valorPlan ? `$${Number(planData.valorPlan).toLocaleString('es-CO')}` : '-',
                                            cuotaInicial: planData.cuotaInicial ? `$${Number(planData.cuotaInicial).toLocaleString('es-CO')}` : '-',
                                            numCuotas: numCuotas,
                                            valorCuota: planData.mensualidad ? `$${Number(planData.mensualidad).toLocaleString('es-CO')}` : '-'
                                        };
                                    }
                                    
                                    return `
                                        <tr>
                                            <td>${(c.contractNumber||'').toString().toUpperCase()}</td>
                                            <td>${(c.productionRecord||'').toString().toUpperCase()}</td>
                                            <td>${(c.clientId||'').toString().toUpperCase()}</td>
                                            <td>${(c.clientName||'').toString().toUpperCase()}</td>
                                            <td>${(c.plan||'').toString().toUpperCase()}</td>
                                            <td>${planInfo.valorTotal}</td>
                                            <td>${planInfo.cuotaInicial}</td>
                                            <td>${planInfo.numCuotas}</td>
                                            <td>${planInfo.valorCuota}</td>
                                            <td>${(c.executive||'').toString().toUpperCase()}</td>
                                            <td>${(c.estado === 'activo') ? 'ACTIVO' : 'ANULADO'}</td>
                                            <td>${formatearFecha(c.contractDate)}</td>
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
        a.download='reporte-contratos.xls'; 
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
 * 
 * Genera y descarga un archivo Word con los datos del reporte.
 * Utiliza formato HTML para compatibilidad con Word.
 * Optimizado para orientación horizontal y mejor visualización.
 * 
 * BACKEND INTEGRATION:
 * - POST /api/contratos/export/word - Enviar datos para generar Word
 * - GET /api/contratos/export/word/download - Descargar archivo generado
 * - Aplicar plantillas y formato corporativo
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
    const blob = new Blob([`
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset='utf-8'>
                <meta name="ProgId" content="Word.Document">
                <meta name="Generator" content="Microsoft Word 15">
                <meta name="Originator" content="Microsoft Word 15">
                <title>Reporte de Contratos</title>
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
                    th:nth-child(1), td:nth-child(1) { width: 8%; }  /* # Contrato */
                    th:nth-child(2), td:nth-child(2) { width: 8%; }  /* Record Producción */
                    th:nth-child(3), td:nth-child(3) { width: 8%; }  /* ID Cliente */
                    th:nth-child(4), td:nth-child(4) { width: 12%; } /* Nombre Titular */
                    th:nth-child(5), td:nth-child(5) { width: 10%; } /* Plan */
                    th:nth-child(6), td:nth-child(6) { width: 8%; }  /* Valor Total */
                    th:nth-child(7), td:nth-child(7) { width: 8%; }  /* Cuota Inicial */
                    th:nth-child(8), td:nth-child(8) { width: 6%; }  /* # Cuotas */
                    th:nth-child(9), td:nth-child(9) { width: 8%; }  /* Valor Cuota */
                    th:nth-child(10), td:nth-child(10) { width: 10%; } /* Ejecutivo */
                    th:nth-child(11), td:nth-child(11) { width: 6%; } /* Estado */
                    th:nth-child(12), td:nth-child(12) { width: 8%; } /* Fecha Contrato */
                    
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
                    
                    /* Para evitar saltos de página en medio de filas */
                    tr {
                        page-break-inside: avoid;
                    }
                    
                    /* Estilo para valores monetarios */
                    .monetary {
                        text-align: right;
                    }
                    
                    /* Estilo para números */
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
        a.download='reporte-contratos.doc'; 
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
 * 
 * Abre el diálogo de impresión del navegador para generar PDF.
 * Muestra vista previa antes de imprimir/guardar.
 * 
 * BACKEND INTEGRATION:
 * - POST /api/contratos/export/pdf - Enviar datos para generar PDF
 * - GET /api/contratos/export/pdf/download - Descargar archivo generado
 * - Usar librerías como Puppeteer o wkhtmltopdf
 * - Aplicar estilos corporativos y marca
 */
function exportPDF(){
    // Abrir directamente el diálogo de impresión del navegador
    window.print();
}

/**
 * GENERAR HTML LIMPIO
 * 
 * Genera HTML limpio sin controles de interfaz para exportación.
 * Optimizado para mejor visualización en Word con orientación horizontal.
 */
function generarHTMLLimpio() {
    // Obtener todos los contratos para el reporte
    const rows = window.__rows || [];
    
    // Generar filas de la tabla
    const filasTabla = rows.map(c => {
        // Obtener información del plan
        let planInfo = {
            valorTotal: '-',
            cuotaInicial: '-',
            numCuotas: '0',
            valorCuota: '-'
        };
        
        if (c.planData) {
            const planData = typeof c.planData === 'string' ? JSON.parse(c.planData) : c.planData;
            // Obtener número de cuotas con diferentes nombres posibles
            const numCuotas = planData.numCuotas || planData.numeroCuotas || planData.cuotas || planData.totalCuotas || '0';
            planInfo = {
                valorTotal: planData.valorPlan ? `$${Number(planData.valorPlan).toLocaleString('es-CO')}` : '-',
                cuotaInicial: planData.cuotaInicial ? `$${Number(planData.cuotaInicial).toLocaleString('es-CO')}` : '-',
                numCuotas: numCuotas,
                valorCuota: planData.mensualidad ? `$${Number(planData.mensualidad).toLocaleString('es-CO')}` : '-'
            };
        }
        
        return `
            <tr>
                <td>${(c.contractNumber||'').toString().toUpperCase()}</td>
                <td>${(c.productionRecord||'').toString().toUpperCase()}</td>
                <td>${(c.clientId||'').toString().toUpperCase()}</td>
                <td>${(c.clientName||'').toString().toUpperCase()}</td>
                <td>${(c.plan||'').toString().toUpperCase()}</td>
                <td class="monetary">${planInfo.valorTotal}</td>
                <td class="monetary">${planInfo.cuotaInicial}</td>
                <td class="numeric">${planInfo.numCuotas}</td>
                <td class="monetary">${planInfo.valorCuota}</td>
                <td>${(c.executive||'').toString().toUpperCase()}</td>
                <td class="numeric">${(c.estado === 'activo') ? 'ACTIVO' : 'ANULADO'}</td>
                <td class="numeric">${formatearFecha(c.contractDate)}</td>
            </tr>
        `;
    }).join('');
    
    return `
        <div class="report-container">
            <div class="report-header">
                <div class="report-title">GOLDEN BRIDGE CORP. S.A.S.</div>
                <div class="report-subtitle">REPORTE DE CONTRATOS DE LA CIUDAD: ${getCiudadNombre(parseQuery().ciudad)} Fecha: ${getFechaActual()}</div>
                <div class="report-info">Total de Contratos: ${rows.length}</div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th># CONTRATO</th>
                            <th>RECORD PRODUCCIÓN</th>
                            <th>ID CLIENTE</th>
                            <th>NOMBRE TITULAR</th>
                            <th>PLAN</th>
                            <th>VALOR TOTAL</th>
                            <th>CUOTA INICIAL</th>
                            <th># CUOTAS</th>
                            <th>VALOR CUOTA</th>
                            <th>EJECUTIVO</th>
                            <th>ESTADO</th>
                            <th>FECHA CONTRATO</th>
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