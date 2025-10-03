// JavaScript para el reporte de planes
// Funciones principales

// Global variables for report state
window.__rows = [];
window.__page = 1;
window.__pageSize = 20;
window.__zoom = 1;

function parseQuery(){
    const p=new URLSearchParams(location.search);
    return { ciudad:p.get('ciudad')||'' };
}

function getPlanes(ciudad){
    console.log('Buscando planes para ciudad:', ciudad);
    
    // Verificar primero en localStorage directamente
    let planes = [];
    try {
        const raw = localStorage.getItem('planesData');
        if (raw) {
            const data = JSON.parse(raw);
            planes = Object.values(data);
            console.log(`Planes encontrados en localStorage:`, planes);
        } else {
            console.log(`No hay planes en localStorage`);
        }
    } catch(e) {
        console.error('Error leyendo localStorage:', e);
    }
    
    // Si no hay planes en localStorage, intentar desde ventana padre
    if (planes.length === 0) {
        try {
            if (window.opener && window.opener.planesStore) {
                console.log('Obteniendo planes desde ventana padre');
                const parentPlanes = window.opener.planesStore || {};
                planes = Object.values(parentPlanes);
                console.log('Planes desde ventana padre:', planes);
            }
        } catch(e) {
            console.log('No se pudo acceder a ventana padre:', e);
        }
    }
    
    // Si aún no hay planes, intentar función de localStorage alternativa
    if (planes.length === 0) {
        console.log('Obteniendo planes desde localStorage (función alternativa)');
        planes = getPlanesFromLocalStorage(ciudad);
    }
    
    console.log('Planes encontrados:', planes);
    return planes;
}

// Función mejorada para sincronizar datos entre ventanas
function sincronizarDatosPlanes() {
    console.log('Sincronizando datos de planes...');
    
    // Primero verificar si ya hay datos en localStorage
    const existingData = localStorage.getItem('planesData');
    if (existingData) {
        try {
            const parsedData = JSON.parse(existingData);
            if (Object.keys(parsedData).length > 0) {
                console.log('Ya hay datos de planes en localStorage, no es necesario sincronizar');
                return; // No mostrar notificación si ya hay datos
            }
        } catch(e) {
            console.log('Error al verificar datos existentes:', e);
        }
    }
    
    try {
        // Intentar obtener datos desde ventana padre
        if (window.opener && window.opener.planesStore) {
            const parentPlanes = window.opener.planesStore;
            console.log('Datos obtenidos desde ventana padre:', parentPlanes);
            
            // Guardar en localStorage si hay datos
            if (Object.keys(parentPlanes).length > 0) {
                localStorage.setItem('planesData', JSON.stringify(parentPlanes));
                console.log('Datos sincronizados en localStorage');
                
                // Mostrar notificación de éxito
                showNotification('Datos sincronizados correctamente', 'success');
            } else {
                console.log('No hay planes en la ventana padre');
                showNotification('No hay planes para sincronizar', 'info');
            }
        } else {
            console.log('No se puede acceder a la ventana padre');
            // Solo mostrar notificación si no hay datos en localStorage
            if (!existingData) {
                showNotification('No se puede acceder a los datos de planes', 'warning');
            }
        }
    } catch(e) {
        console.error('Error sincronizando datos:', e);
        // Solo mostrar notificación de error si no hay datos en localStorage
        if (!existingData) {
            showNotification('Error al sincronizar datos: ' + e.message, 'error');
        }
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Agregar estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // Agregar animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 8px;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getPlanesFromLocalStorage(ciudad) {
    try{
        console.log('Leyendo desde localStorage para ciudad:', ciudad);
        
        // Intentar diferentes claves de localStorage
        const possibleKeys = ['planesData', 'planesStore', 'planes', 'userCreatedPlanes'];
        let allPlanes = [];
        
        for (const key of possibleKeys) {
            const raw = localStorage.getItem(key);
            if (raw) {
                const data = JSON.parse(raw);
                console.log('Datos encontrados en', key, ':', data);
                
                if (Array.isArray(data)) {
                    // Array directo
                    allPlanes = allPlanes.concat(data);
                } else if (typeof data === 'object') {
                    // Objeto con planes
                    allPlanes = allPlanes.concat(Object.values(data));
                }
            }
        }
        
        console.log('Todos los planes encontrados:', allPlanes);
        return allPlanes;
    }catch(e){ 
        console.error('Error obteniendo planes desde localStorage:', e);
        return []; 
    }
}

// Función para formatear valores monetarios
function formatearValor(valor) {
    if (!valor || valor === 0) return '$0';
    const num = parseFloat(valor);
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

// Función para formatear fechas
function formatearFecha(fecha) {
    if (!fecha) return '';
    try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO');
    } catch(e) {
        return fecha;
    }
}

function renderReport(){
    const {ciudad} = parseQuery();
    console.log('Parámetros del reporte:', {ciudad});
    
    // Sincronizar datos antes de proceder
    sincronizarDatosPlanes();
    
    document.getElementById('titulo').textContent = `REPORTE DE PLANES ${ciudad.toUpperCase()}`;
    document.getElementById('subtitulo').textContent = `Ciudad: ${ciudad} — Total de Planes: ${getPlanes(ciudad).length}`;
    
    // Obtener planes
    const rows = getPlanes(ciudad);
    console.log('Planes obtenidos para el reporte:', rows);
    
    window.__rows = rows;
    window.__page = 1; 
    window.__pageSize = 20; 
    window.__zoom = 1;
    refreshTable();
    document.getElementById('totalPages').textContent = getTotalPages();
    document.getElementById('currentPage').value = '1';
    
    // Mostrar información de depuración
    console.log('Total de planes en el reporte:', window.__rows.length);
    console.log('Páginas totales:', getTotalPages());
    
    // Mostrar mensaje si no hay planes
    if (window.__rows.length === 0) {
        console.log('⚠️ No se encontraron planes. Verifica que:');
        console.log('1. Los planes estén guardados correctamente en localStorage');
        console.log('2. La ciudad coincida con los datos guardados');
        console.log('3. Los planes tengan datos válidos');
    }
}

function getTotalPages(){ 
    return Math.max(1, Math.ceil((window.__rows||[]).length / window.__pageSize)); 
}

function refreshTable(){
    const start = (window.__page-1)*window.__pageSize;
    const slice = (window.__rows||[]).slice(start, start+window.__pageSize);
    const body = document.getElementById('tbody');
    body.innerHTML = slice.map(p=>{
        return `<tr>
            <td>${(p.codigo||'').toString().toUpperCase()}</td>
            <td>${(p.nombre||'').toString().toUpperCase()}</td>
            <td>${formatearValor(p.valorPlan)}</td>
            <td>${formatearValor(p.cuotaInicial)}</td>
            <td>${(p.numCuotas||0).toString()}</td>
            <td>${formatearValor(p.mensualidad)}</td>
            <td>${(p.activo||false) ? 'ACTIVO' : 'INACTIVO'}</td>
            <td>${formatearFecha(p.fechaInicial)}</td>
        </tr>`;
    }).join('');
    document.getElementById('totalPages').textContent = getTotalPages();
    document.getElementById('currentPage').value = String(window.__page);
    const tableWrap = document.getElementById('tableWrap');
    tableWrap.style.transform = `scale(${window.__zoom})`;
    tableWrap.classList.toggle('zoomed', window.__zoom !== 1);
}

function goFirst(){ window.__page=1; refreshTable(); }
function goPrevious(){ window.__page=Math.max(1, window.__page-1); refreshTable(); }
function goNext(){ window.__page=Math.min(getTotalPages(), window.__page+1); refreshTable(); }
function goLast(){ window.__page=getTotalPages(); refreshTable(); }

function goToPage(){
    const v = parseInt(document.getElementById('currentPage').value||'1',10);
    if (!isNaN(v)) { window.__page=Math.min(Math.max(1,v), getTotalPages()); refreshTable(); }
}

function setZoom(delta){ 
    window.__zoom = Math.max(0.5, Math.min(2, (window.__zoom||1)+delta)); 
    refreshTable(); 
}

function exportCSV(){
    const {ciudad} = parseQuery();
    const rows = window.__rows||[];
    
    // Crear HTML con formato para Excel
    const excelHTML = `
        <html>
            <head>
                <meta charset='utf-8'>
                <title>Reporte de Planes</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
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
                        margin-bottom: 20px; 
                        color: #666; 
                        text-transform: uppercase;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 20px; 
                        border: 2px solid #000;
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
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="report-header">
                        <div class="report-title">REPORTE DE PLANES ${ciudad.toUpperCase()}</div>
                        <div class="report-subtitle">Ciudad: ${ciudad} — Total de Planes: ${rows.length}</div>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>CÓDIGO</th>
                                    <th>NOMBRE DEL PLAN</th>
                                    <th>VALOR TOTAL</th>
                                    <th>CUOTA INICIAL</th>
                                    <th># CUOTAS</th>
                                    <th>MENSUALIDAD</th>
                                    <th>ESTADO</th>
                                    <th>FECHA INICIAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(p => {
                                    return `
                                        <tr>
                                            <td>${(p.codigo||'').toString().toUpperCase()}</td>
                                            <td>${(p.nombre||'').toString().toUpperCase()}</td>
                                            <td>${formatearValor(p.valorPlan)}</td>
                                            <td>${formatearValor(p.cuotaInicial)}</td>
                                            <td>${(p.numCuotas||0).toString()}</td>
                                            <td>${formatearValor(p.mensualidad)}</td>
                                            <td>${(p.activo||false) ? 'ACTIVO' : 'INACTIVO'}</td>
                                            <td>${formatearFecha(p.fechaInicial)}</td>
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
    
    const blob = new Blob([excelHTML], {type:'application/vnd.ms-excel'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='reporte-planes.xls'; a.click(); URL.revokeObjectURL(url);
}

function exportDOC(){
    const cleanHTML = generarHTMLLimpio();
    const blob = new Blob([`
        <html>
            <head>
                <meta charset='utf-8'>
                <title>Reporte de Planes</title>
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
                        margin-bottom: 20px; 
                        color: #666; 
                        text-transform: uppercase;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 20px; 
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
                </style>
            </head>
            <body>
                ${cleanHTML}
            </body>
        </html>
    `], {type:'application/msword'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='reporte-planes.doc'; a.click(); URL.revokeObjectURL(url);
}

function exportPDF(){
    // Abrir directamente el diálogo de impresión del navegador
    window.print();
}

// Función para generar HTML limpio sin controles de interfaz
function generarHTMLLimpio() {
    const {ciudad} = parseQuery();
    
    // Obtener todos los planes para el reporte
    const rows = window.__rows || [];
    
    // Generar filas de la tabla
    const filasTabla = rows.map(p => {
        return `
            <tr>
                <td>${(p.codigo||'').toString().toUpperCase()}</td>
                <td>${(p.nombre||'').toString().toUpperCase()}</td>
                <td>${formatearValor(p.valorPlan)}</td>
                <td>${formatearValor(p.cuotaInicial)}</td>
                <td>${(p.numCuotas||0).toString()}</td>
                <td>${formatearValor(p.mensualidad)}</td>
                <td>${(p.activo||false) ? 'ACTIVO' : 'INACTIVO'}</td>
                <td>${formatearFecha(p.fechaInicial)}</td>
            </tr>
        `;
    }).join('');
    
    return `
        <div class="report-container">
            <div class="report-header">
                <div class="report-title">REPORTE DE PLANES ${ciudad.toUpperCase()}</div>
                <div class="report-subtitle">Ciudad: ${ciudad} — Total de Planes: ${rows.length}</div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>CÓDIGO</th>
                            <th>NOMBRE DEL PLAN</th>
                            <th>VALOR TOTAL</th>
                            <th>CUOTA INICIAL</th>
                            <th># CUOTAS</th>
                            <th>MENSUALIDAD</th>
                            <th>ESTADO</th>
                            <th>FECHA INICIAL</th>
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

// Inicialización cuando se carga el DOM
window.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando reporte de planes...');
    
    // Sincronizar datos al cargar
    sincronizarDatosPlanes();
    
    // Renderizar reporte
    renderReport();
});
