// JavaScript para el reporte de empleados
// Funciones principales

// Global variables for report state
window.__rows = [];
window.__page = 1;
window.__pageSize = 20;
window.__zoom = 1;

function parseQuery(){
    const p=new URLSearchParams(location.search);
    return { ciudad:p.get('ciudad')||'', area:p.get('area')||'' };
}

function getEmpleados(ciudad, area){
    console.log('Buscando empleados para ciudad:', ciudad, 'área:', area);
    
    // Verificar primero en localStorage directamente
    let empleados = [];
    try {
        const raw = localStorage.getItem('empleadosByCity');
        if (raw) {
            const data = JSON.parse(raw);
            if (data[ciudad]) {
                empleados = Object.values(data[ciudad]);
                console.log(`Empleados encontrados en localStorage para ciudad ${ciudad}:`, empleados);
            } else {
                console.log(`No hay empleados en localStorage para ciudad ${ciudad}`);
                console.log('Ciudades disponibles en localStorage:', Object.keys(data));
            }
        }
    } catch(e) {
        console.error('Error leyendo localStorage:', e);
    }
    
    // Si no hay empleados en localStorage, intentar desde ventana padre
    if (empleados.length === 0) {
        try {
            if (window.opener && window.opener.userCreatedEmpleados) {
                console.log('Obteniendo empleados desde ventana padre');
                const parentEmpleados = window.opener.userCreatedEmpleados || {};
                empleados = Object.values(parentEmpleados);
                console.log('Empleados desde ventana padre:', empleados);
            }
        } catch(e) {
            console.log('No se pudo acceder a ventana padre:', e);
        }
    }
    
    // Si aún no hay empleados, intentar función de localStorage alternativa
    if (empleados.length === 0) {
        console.log('Obteniendo empleados desde localStorage (función alternativa)');
        empleados = getEmpleadosFromLocalStorage(ciudad, area);
    }
    
    // Filtrar por ciudad y área (MEJORADO)
    const filtered = empleados.filter(e => {
        const empCiudad = (e.ciudad || '').toLowerCase();
        const empArea = (e.area || '').toLowerCase();
        const searchCiudad = ciudad.toLowerCase();
        const searchArea = area.toLowerCase();
        
        // Validación más permisiva para nombres
        const hasValidName = e.tPrimerNombre || e.tSegundoNombre || e.tPrimerApellido || e.tSegundoApellido ||
                            e.identificacion || e.cargo || e.celular;
        
        const matchCiudad = empCiudad === searchCiudad;
        const matchArea = empArea === searchArea;
        
        console.log('Filtrando empleado:', {
            identificacion: e.identificacion,
            empCiudad, searchCiudad, empArea, searchArea, hasValidName,
            matchCiudad, matchArea,
            empleadoCompleto: e
        });
        
        return matchCiudad && matchArea && hasValidName;
    });
    
    console.log('Empleados filtrados finales:', filtered);
    return filtered;
}

// Función mejorada para sincronizar datos entre ventanas
function sincronizarDatosEmpleados() {
    console.log('Sincronizando datos de empleados...');
    
    try {
        // Intentar obtener datos desde ventana padre
        if (window.opener && window.opener.userCreatedEmpleados) {
            const parentEmpleados = window.opener.userCreatedEmpleados;
            console.log('Datos obtenidos desde ventana padre:', parentEmpleados);
            
            // Guardar en localStorage si hay datos
            if (Object.keys(parentEmpleados).length > 0) {
                const raw = localStorage.getItem('empleadosByCity');
                const data = raw ? JSON.parse(raw) : {};
                
                // Agrupar empleados por ciudad
                Object.values(parentEmpleados).forEach(empleado => {
                    const ciudad = empleado.ciudad;
                    if (ciudad) {
                        if (!data[ciudad]) data[ciudad] = {};
                        data[ciudad][empleado.identificacion] = empleado;
                    }
                });
                
                localStorage.setItem('empleadosByCity', JSON.stringify(data));
                console.log('Datos sincronizados en localStorage');
                
                // Mostrar notificación de éxito
                showNotification('Datos sincronizados correctamente', 'success');
            } else {
                console.log('No hay empleados en la ventana padre');
                showNotification('No hay empleados para sincronizar', 'info');
            }
        } else {
            console.log('No se puede acceder a la ventana padre');
            showNotification('No se puede acceder a los datos de empleados', 'warning');
        }
    } catch(e) {
        console.error('Error sincronizando datos:', e);
        showNotification('Error al sincronizar datos: ' + e.message, 'error');
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

function getEmpleadosFromLocalStorage(ciudad, area) {
    try{
        console.log('Leyendo desde localStorage para ciudad:', ciudad, 'área:', area);
        
        // Intentar diferentes claves de localStorage
        const possibleKeys = ['empleadosByCity', 'empleados', 'userCreatedEmpleados'];
        let allEmpleados = [];
        
        for (const key of possibleKeys) {
            const raw = localStorage.getItem(key);
            if (raw) {
                const data = JSON.parse(raw);
                console.log('Datos encontrados en', key, ':', data);
                
                if (key === 'empleadosByCity' && data[ciudad]) {
                    // Estructura por ciudad
                    allEmpleados = allEmpleados.concat(Object.values(data[ciudad]));
                } else if (Array.isArray(data)) {
                    // Array directo
                    allEmpleados = allEmpleados.concat(data);
                } else if (typeof data === 'object') {
                    // Objeto con empleados
                    allEmpleados = allEmpleados.concat(Object.values(data));
                }
            }
        }
        
        console.log('Todos los empleados encontrados:', allEmpleados);
        
        // Filtrar por ciudad y área (MEJORADO)
        const filtered = allEmpleados.filter(e => {
            const empCiudad = (e.ciudad || '').toLowerCase();
            const empArea = (e.area || '').toLowerCase();
            const searchCiudad = ciudad.toLowerCase();
            const searchArea = area.toLowerCase();
            
            // Validación más permisiva para nombres
            const hasValidName = e.tPrimerNombre || e.tSegundoNombre || e.tPrimerApellido || e.tSegundoApellido ||
                                e.identificacion || e.cargo || e.celular || e.area;
            
            const matchCiudad = empCiudad === searchCiudad;
            const matchArea = empArea === searchArea;
            
            console.log('Filtrando empleado en localStorage:', {
                identificacion: e.identificacion,
                empCiudad, searchCiudad, empArea, searchArea, hasValidName,
                matchCiudad, matchArea,
                empleadoCompleto: e
            });
            
            return matchCiudad && matchArea && hasValidName;
        });
        
        console.log('Empleados filtrados desde localStorage:', filtered);
        return filtered;
    }catch(e){ 
        console.error('Error obteniendo empleados desde localStorage:', e);
        return []; 
    }
}

// Función para obtener empleados de todas las áreas
function getAllEmpleados(ciudad) {
    console.log('Obteniendo todos los empleados para ciudad:', ciudad);
    
    let allEmpleados = [];
    
    // Intentar desde ventana padre
    try {
        if (window.opener && window.opener.userCreatedEmpleados) {
            const parentEmpleados = window.opener.userCreatedEmpleados || {};
            allEmpleados = Object.values(parentEmpleados);
            console.log('Empleados desde ventana padre:', allEmpleados);
        }
    } catch(e) {
        console.log('No se pudo acceder a ventana padre:', e);
    }
    
    // Si no hay empleados desde ventana padre, intentar localStorage
    if (allEmpleados.length === 0) {
        const possibleKeys = ['empleadosByCity', 'empleados', 'userCreatedEmpleados'];
        
        for (const key of possibleKeys) {
            const raw = localStorage.getItem(key);
            if (raw) {
                const data = JSON.parse(raw);
                
                if (key === 'empleadosByCity' && data[ciudad]) {
                    allEmpleados = allEmpleados.concat(Object.values(data[ciudad]));
                } else if (Array.isArray(data)) {
                    allEmpleados = allEmpleados.concat(data);
                } else if (typeof data === 'object') {
                    allEmpleados = allEmpleados.concat(Object.values(data));
                }
            }
        }
    }
    
    // Filtrar por ciudad y empleados válidos (MEJORADO)
    const filtered = allEmpleados.filter(e => {
        const empCiudad = (e.ciudad || '').toLowerCase();
        const searchCiudad = ciudad.toLowerCase();
        
        // Validación más permisiva para nombres
        const hasValidName = e.tPrimerNombre || e.tSegundoNombre || e.tPrimerApellido || e.tSegundoApellido ||
                            e.identificacion || e.cargo || e.celular || e.area;
        
        const matchCiudad = empCiudad === searchCiudad;
        
        console.log('Filtrando empleado en getAllEmpleados:', {
            identificacion: e.identificacion,
            empCiudad, searchCiudad, hasValidName, matchCiudad,
            empleadoCompleto: e
        });
        
        return matchCiudad && hasValidName;
    });
    
    console.log('Todos los empleados para la ciudad:', filtered);
    return filtered;
}

// Función para construir el nombre completo del empleado
function construirNombreCompleto(empleado) {
    // Intentar diferentes combinaciones de campos de nombre
    const nombres = [];
    
    // Campos principales
    if (empleado.tPrimerNombre) nombres.push(empleado.tPrimerNombre.toUpperCase());
    if (empleado.tSegundoNombre) nombres.push(empleado.tSegundoNombre.toUpperCase());
    if (empleado.tPrimerApellido) nombres.push(empleado.tPrimerApellido.toUpperCase());
    if (empleado.tSegundoApellido) nombres.push(empleado.tSegundoApellido.toUpperCase());
    
    // Si no hay nombres con prefijo 't', intentar sin prefijo
    if (nombres.length === 0) {
        if (empleado.primerNombre) nombres.push(empleado.primerNombre.toUpperCase());
        if (empleado.segundoNombre) nombres.push(empleado.segundoNombre.toUpperCase());
        if (empleado.primerApellido) nombres.push(empleado.primerApellido.toUpperCase());
        if (empleado.segundoApellido) nombres.push(empleado.segundoApellido.toUpperCase());
    }
    
    // Si aún no hay nombres, intentar con 'nombreCompleto'
    if (nombres.length === 0 && empleado.nombreCompleto) {
        return empleado.nombreCompleto.toUpperCase();
    }
    
    // Si no hay ningún nombre, mostrar mensaje
    if (nombres.length === 0) {
        return 'SIN NOMBRE';
    }
    
    return nombres.join(' ');
}

function getAreaDisplay(area) {
    if (!area) return '';
    const areaMap = {
        'pyf': 'PYF',
        'servicio': 'Servicios',
        'administrativo': 'Administrativo'
    };
    return areaMap[area.toLowerCase()] || area.toUpperCase();
}

// Función para obtener el nombre completo del cargo
function getCargoNombre(cargoCodigo, area = null) {
    // Mapeo de códigos de cargo a nombres completos
    const cargosPorArea = {
        administrativo: [
            { codigo: 'EC', nombre: 'EJECUTIVO DE CUENTA' },
            { codigo: 'EA', nombre: 'EJECUTIVO ADMON' },
            { codigo: 'EP', nombre: 'EJECUTIVO PREJURIDICO' },
            { codigo: 'EJ', nombre: 'EJECUTIVO JURIDICO' },
            { codigo: 'SP', nombre: 'SUPERVISOR DE CARTERA' },
            { codigo: 'SN', nombre: 'SUPERVISOR NACIONAL DE CARTERA' },
            { codigo: 'C', nombre: 'CASTIGO CARTERA' },
            { codigo: 'PV', nombre: 'PROXIMA VIGENCIA' },
            { codigo: 'V', nombre: 'VERIFICADOR' }
        ],
        pyf: [
            { codigo: 'AS', nombre: 'ASESOR' },
            { codigo: 'SU', nombre: 'SUPERVISOR' },
            { codigo: 'SG', nombre: 'SUB GERENTE' },
            { codigo: 'GT', nombre: 'GERENTE' },
            { codigo: 'DR', nombre: 'DIRECTOR' },
            { codigo: 'SN', nombre: 'DIRECTOR SUB NACIONAL' },
            { codigo: 'DN', nombre: 'DIRECTOR NACIONAL' }
        ],
        servicio: [
            { codigo: 'TU', nombre: 'TUTOR' },
            { codigo: 'MO', nombre: 'MONITOR TUTORIAS' },
            { codigo: 'CN', nombre: 'COORDINADOR NACIONAL DE TUTORIAS' }
        ]
    };
    
    let cargo;
    
    if (area && cargosPorArea[area]) {
        // Buscar en los cargos del área específica
        cargo = cargosPorArea[area].find(c => c.codigo === cargoCodigo);
    } else {
        // Buscar en todas las áreas si no se especifica área
        for (const areaKey in cargosPorArea) {
            cargo = cargosPorArea[areaKey].find(c => c.codigo === cargoCodigo);
            if (cargo) break;
        }
    }
    
    return cargo ? cargo.nombre : cargoCodigo.toUpperCase();
}

function renderReport(){
    const {ciudad, area} = parseQuery();
    console.log('Parámetros del reporte:', {ciudad, area});
    
    // Sincronizar datos antes de proceder
    sincronizarDatosEmpleados();
    
    const prettyArea = area==='pyf'?'PYF':(area==='servicio'?'Servicios':'Administrativo');
    document.getElementById('titulo').textContent = `REPORTE DE EMPLEADOS ${ciudad.toUpperCase()}-${prettyArea.toUpperCase()}`;
    document.getElementById('subtitulo').textContent = `Ciudad: ${ciudad} — Área: ${prettyArea}`;
    
    // Obtener empleados
    const rows = getEmpleados(ciudad, area);
    console.log('Empleados obtenidos para el reporte:', rows);
    
    // Si no hay empleados, intentar obtener todos los empleados de la ciudad
    if (rows.length === 0) {
        console.log('No se encontraron empleados para el área específica, buscando todos los empleados de la ciudad');
        const allRows = getAllEmpleados(ciudad);
        console.log('Todos los empleados de la ciudad:', allRows);
        window.__rows = allRows;
    } else {
        window.__rows = rows;
    }
    
    window.__page = 1; 
    window.__pageSize = 20; 
    window.__zoom = 1;
    refreshTable();
    document.getElementById('totalPages').textContent = getTotalPages();
    document.getElementById('currentPage').value = '1';
    
    // Mostrar información de depuración
    console.log('Total de empleados en el reporte:', window.__rows.length);
    console.log('Páginas totales:', getTotalPages());
    
    // Mostrar mensaje si no hay empleados
    if (window.__rows.length === 0) {
        console.log('⚠️ No se encontraron empleados. Verifica que:');
        console.log('1. Los empleados estén guardados correctamente en localStorage');
        console.log('2. La ciudad y área coincidan con los datos guardados');
        console.log('3. Los empleados tengan nombres válidos');
    }
}

function getTotalPages(){ 
    return Math.max(1, Math.ceil((window.__rows||[]).length / window.__pageSize)); 
}

function refreshTable(){
    const start = (window.__page-1)*window.__pageSize;
    const slice = (window.__rows||[]).slice(start, start+window.__pageSize);
    const body = document.getElementById('tbody');
    body.innerHTML = slice.map(e=>{
        // Construir nombre completo del empleado
        const nombreCompleto = construirNombreCompleto(e);
        // Obtener nombre completo del cargo
        const cargoCodigo = e.tCargo || e.cargo || '';
        const cargoNombre = getCargoNombre(cargoCodigo, e.area);
        
        return `<tr>
            <td>${(e.identificacion||'').toString().toUpperCase()}</td>
            <td>${nombreCompleto}</td>
            <td>${cargoNombre}</td>
            <td>${getAreaDisplay(e.area)}</td>
            <td>${(e.tCelular||e.celular||'').toString().toUpperCase()}</td>
            <td>${(e.bActivo||e.activo)==='SI' || e.activo===true ? 'SI' : 'NO'}</td>
        </tr>`;
    }).join('');
    document.getElementById('totalPages').textContent = getTotalPages();
    document.getElementById('currentPage').value = String(window.__page);
    const tableWrap = document.getElementById('tableWrap');
    tableWrap.style.transform = `scale(${window.__zoom})`;
    tableWrap.classList.toggle('zoomed', window.__zoom !== 1);
}

function goFirst(){ window.__page=1; refreshTable(); }
function goPrev(){ window.__page=Math.max(1, window.__page-1); refreshTable(); }
function goNext(){ window.__page=Math.min(getTotalPages(), window.__page+1); refreshTable(); }
function goLast(){ window.__page=getTotalPages(); refreshTable(); }

function gotoPage(){
    const v = parseInt(document.getElementById('currentPage').value||'1',10);
    if (!isNaN(v)) { window.__page=Math.min(Math.max(1,v), getTotalPages()); refreshTable(); }
}

function setZoom(delta){ 
    window.__zoom = Math.max(0.5, Math.min(2, (window.__zoom||1)+delta)); 
    refreshTable(); 
}

function exportCSV(){
    const {ciudad, area} = parseQuery();
    const prettyArea = area==='pyf'?'PYF':(area==='servicio'?'SERVICIOS':'ADMINISTRATIVO');
    const rows = window.__rows||[];
    
    // Crear HTML con formato para Excel
    const excelHTML = `
        <html>
            <head>
                <meta charset='utf-8'>
                <title>Reporte de Empleados</title>
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
                        <div class="report-title">REPORTE DE EMPLEADOS ${ciudad.toUpperCase()}-${prettyArea.toUpperCase()}</div>
                        <div class="report-subtitle">Ciudad: ${ciudad} — Área: ${prettyArea}</div>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>IDENTIFICACIÓN</th>
                                    <th>EMPLEADO</th>
                                    <th>CARGO</th>
                                    <th>ÁREA</th>
                                    <th>CELULAR</th>
                                    <th>ACTIVO</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(e => {
                                    const cargoCodigo = e.tCargo || e.cargo || '';
                                    const cargoNombre = getCargoNombre(cargoCodigo, e.area);
                                    const nombreCompleto = construirNombreCompleto(e);
                                    
                                    return `
                                        <tr>
                                            <td>${(e.identificacion||'').toString().toUpperCase()}</td>
                                            <td>${nombreCompleto}</td>
                                            <td>${cargoNombre}</td>
                                            <td>${getAreaDisplay(e.area)}</td>
                                            <td>${(e.tCelular||e.celular||'').toString().toUpperCase()}</td>
                                            <td>${(e.bActivo||e.activo)==='SI' || e.activo===true ? 'SI' : 'NO'}</td>
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
    const a = document.createElement('a'); a.href=url; a.download='reporte-empleados.xls'; a.click(); URL.revokeObjectURL(url);
}

function exportDOC(){
    const cleanHTML = generarHTMLLimpio();
    const blob = new Blob([`
        <html>
            <head>
                <meta charset='utf-8'>
                <title>Reporte de Empleados</title>
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
    const a = document.createElement('a'); a.href=url; a.download='reporte-empleados.doc'; a.click(); URL.revokeObjectURL(url);
}

function exportPDF(){
    // Abrir directamente el diálogo de impresión del navegador
    window.print();
}

// Función para generar HTML limpio sin controles de interfaz
function generarHTMLLimpio() {
    const {ciudad, area} = parseQuery();
    const prettyArea = area==='pyf'?'PYF':(area==='servicio'?'SERVICIOS':'ADMINISTRATIVO');
    
    // Obtener todos los empleados para el reporte
    const rows = window.__rows || [];
    
    // Generar filas de la tabla
    const filasTabla = rows.map(e => {
        const nombreCompleto = construirNombreCompleto(e);
        // Obtener nombre completo del cargo
        const cargoCodigo = e.tCargo || e.cargo || '';
        const cargoNombre = getCargoNombre(cargoCodigo, e.area);
        
        return `
            <tr>
                <td>${(e.identificacion||'').toString().toUpperCase()}</td>
                <td>${nombreCompleto}</td>
                <td>${cargoNombre}</td>
                <td>${getAreaDisplay(e.area)}</td>
                <td>${(e.tCelular||e.celular||'').toString().toUpperCase()}</td>
                <td>${(e.bActivo||e.activo)==='SI' || e.activo===true ? 'SI' : 'NO'}</td>
            </tr>
        `;
    }).join('');
    
    return `
        <div class="report-container">
            <div class="report-header">
                <div class="report-title">REPORTE DE EMPLEADOS ${ciudad.toUpperCase()}-${prettyArea.toUpperCase()}</div>
                <div class="report-subtitle">Ciudad: ${ciudad} — Área: ${prettyArea}</div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>IDENTIFICACIÓN</th>
                            <th>EMPLEADO</th>
                            <th>CARGO</th>
                            <th>ÁREA</th>
                            <th>CELULAR</th>
                            <th>ACTIVO</th>
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
    console.log('Inicializando reporte de empleados...');
    
    // Sincronizar datos al cargar
    sincronizarDatosEmpleados();
    
    // Renderizar reporte
    renderReport();
});