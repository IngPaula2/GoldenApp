/**
 * ====================================================================================
 * 📊 REPORTE NOTA DÉBITO - GOLDEN APP
 * ====================================================================================
 * 
 * Este archivo genera el reporte de notas débito que muestra las notas débito
 * filtradas por ciudad y rango de fechas.
 * 
 * FUNCIONALIDADES:
 * - Busca notas débito por ciudad y rango de fechas
 * - Muestra todas las notas débito con sus detalles
 * - Paginación y zoom para mejor visualización
 * - Exporta a Excel, Word y PDF
 * 
 * ====================================================================================
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */
(function(){
    window.__rows = [];
    window.__page = 1;
    window.__pageSize = 50;
    window.__zoom = 1.0;

    function getCiudadNombre(codigo){
        try {
            if (typeof window.getCiudadesData === 'function') {
                const ciudades = window.getCiudadesData() || {};
                return ciudades[codigo]?.nombre || `CIUDAD ${codigo}`;
            }
            const raw = localStorage.getItem('ciudadesData');
            if (raw) {
                const data = JSON.parse(raw);
                return data[codigo]?.nombre || `CIUDAD ${codigo}`;
            }
        } catch(e) {
            console.error('Error obteniendo nombre de ciudad:', e);
        }
        return `CIUDAD ${codigo}`;
    }

    function formatDate(s){
        if (!s) return '//';
        const str = String(s).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            const [y,m,d] = str.split('-');
            return `${d}/${m}/${y}`;
        }
        try { 
            const d = new Date(str);
            if (isNaN(d.getTime())) return '//';
            return d.toLocaleDateString('es-CO', {day:'2-digit', month:'2-digit', year:'numeric'});
        } catch(e){ 
            return '//'; 
        }
    }

    function formatMoney(n){
        if (n==null || isNaN(n)) return '0.00';
        return new Intl.NumberFormat('es-CO', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(n));
    }

    /**
     * Obtiene el nombre completo del titular por su identificación
     */
    function getTitularNombre(holderId, city) {
        if (!holderId || !city) {
            console.log('⚠️ getTitularNombre: holderId o city faltante', { holderId, city });
            return '';
        }
        try {
            const titularesByCityRaw = localStorage.getItem('titularesByCity');
            if (!titularesByCityRaw) {
                console.log('⚠️ getTitularNombre: No hay titularesByCity en localStorage');
                return '';
            }
            
            const titularesByCity = JSON.parse(titularesByCityRaw);
            const holderIdStr = String(holderId).trim();
            const cityStr = String(city).trim();
            
            console.log('🔍 getTitularNombre buscando:', { holderId: holderIdStr, city: cityStr });
            console.log('📊 Ciudades disponibles:', Object.keys(titularesByCity));
            
            // Buscar en la ciudad específica
            if (titularesByCity[cityStr]) {
                console.log('📋 Titulares en ciudad', cityStr, ':', Object.keys(titularesByCity[cityStr]));
                
                // Intentar buscar con el holderId exacto
                let titular = titularesByCity[cityStr][holderIdStr];
                
                // Si no se encuentra, buscar sin ceros a la izquierda
                if (!titular) {
                    const holderIdSinCeros = holderIdStr.replace(/^0+/, '');
                    for (const [numeroId, titularData] of Object.entries(titularesByCity[cityStr])) {
                        const numeroIdSinCeros = String(numeroId).replace(/^0+/, '');
                        if (numeroIdSinCeros === holderIdSinCeros || numeroId === holderIdStr) {
                            titular = titularData;
                            console.log('✅ Titular encontrado (sin ceros):', numeroId);
                            break;
                        }
                    }
                }
                
                if (titular) {
                    const nombre = `${titular.apellido1 || ''} ${titular.apellido2 || ''} ${titular.nombre1 || ''} ${titular.nombre2 || ''}`.trim().toUpperCase();
                    console.log('✅ Nombre del titular encontrado:', nombre);
                    return nombre;
                } else {
                    console.log('❌ Titular no encontrado para holderId:', holderIdStr);
                }
            } else {
                console.log('❌ Ciudad no encontrada:', cityStr);
            }
            
            return '';
        } catch (e) {
            console.error('❌ Error en getTitularNombre:', e);
            return '';
        }
    }

    /**
     * 🔗 BACKEND INTEGRATION - CARGAR DATOS DEL REPORTE
     */
    function loadData(){
        try {
            const raw = localStorage.getItem('reporteNotaDebitoData');
            if (raw){
                const data = JSON.parse(raw);
                return data;
            }
        } catch(e) {
            console.error('Error cargando datos:', e);
        }
        return { cityCode: '', cityName: '', startDate: '', endDate: '' };
    }

    /**
     * 🔗 BACKEND INTEGRATION - PROCESAR DATOS DEL REPORTE
     */
    function processReportData() {
        const data = loadData();
        if (!data.cityCode || !data.startDate || !data.endDate) {
            console.error('Faltan datos del reporte');
            document.getElementById('reportContent').innerHTML = '<p>Error: Faltan datos del reporte</p>';
            return;
        }

        try {
            // Obtener notas débito de la ciudad
            const notasRaw = localStorage.getItem(`notasDebito_${data.cityCode}`);
            const notas = notasRaw ? JSON.parse(notasRaw) : [];
            
            // Filtrar por rango de fechas
            const start = new Date(data.startDate + 'T00:00:00');
            const end = new Date(data.endDate + 'T23:59:59');
            
            const notasFiltradas = notas.filter(nota => {
                try {
                    const fechaNota = new Date(nota.fechaHoy || nota.fecha || '');
                    return fechaNota >= start && fechaNota <= end;
                } catch (e) {
                    return false;
                }
            });
            
            // Ordenar por número de nota
            notasFiltradas.sort((a, b) => {
                const numA = parseInt(String(a.numero || '0').replace(/\D/g, ''), 10) || 0;
                const numB = parseInt(String(b.numero || '0').replace(/\D/g, ''), 10) || 0;
                return numA - numB;
            });
            
            // Convertir a filas para el reporte
            window.__rows = notasFiltradas.map(nota => {
                const holderId = nota.holderId || nota.identificacion || '';
                const titularNombre = getTitularNombre(holderId, data.cityCode);
                console.log('📝 Procesando nota:', { 
                    numero: nota.numero, 
                    holderId: holderId, 
                    cityCode: data.cityCode, 
                    titularNombre: titularNombre 
                });
                return {
                    numero: nota.numero || '',
                    tipo: 'DC',
                    fechaHoy: nota.fechaHoy || nota.fecha || '',
                    factura: nota.factura || '0',
                    contrato: nota.contrato || '',
                    identificacion: holderId,
                    titularNombre: titularNombre,
                    valorNota: nota.valorNota || 0,
                    fechaVencimiento: nota.fechaVencimiento || '',
                    concepto: nota.concepto || '',
                    ejecutivo: nota.ejecutivo || '',
                    estado: nota.estado || ''
                };
            });
            
            // Actualizar información del reporte
            const today = new Date();
            const formattedDate = today.toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            document.getElementById('reportCity').textContent = data.cityCode;
            document.getElementById('reportStartDate').textContent = formatDate(data.startDate);
            document.getElementById('reportEndDate').textContent = formatDate(data.endDate);
            document.getElementById('reportDate').textContent = formattedDate;
            
            // Renderizar reporte
            renderReport();
        } catch (e) {
            console.error('Error procesando datos del reporte:', e);
            document.getElementById('reportContent').innerHTML = '<p>Error al procesar los datos del reporte</p>';
        }
    }

    /**
     * Renderiza el reporte en la página
     */
    function renderReport() {
        const startIndex = (window.__page - 1) * window.__pageSize;
        const endIndex = startIndex + window.__pageSize;
        const pageRows = window.__rows.slice(startIndex, endIndex);
        const totalPages = Math.ceil(window.__rows.length / window.__pageSize);
        
        // Actualizar paginación
        document.getElementById('currentPage').value = window.__page;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('paginaActual').textContent = window.__page;
        
        const data = loadData();
        const today = new Date();
        const formattedDate = today.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Generar HTML del reporte con formato exacto de la imagen
        let reportHTML = `
            <div id="tableWrap" style="transform: scale(${window.__zoom}); transform-origin: center top; width: 100%; max-width: 100%; display: flex; justify-content: center; align-items: flex-start; box-sizing: border-box; overflow: hidden;">
                <div style="width: 100%; max-width: 100%; margin: 0 auto; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; overflow: hidden;">
                    <div style="width: 100%; box-sizing: border-box;">
                        <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; height: 4px; margin: 3px 0;"></div>
                        <div style="text-align: center; margin-bottom: 5px;">
                            <div style="font-weight: bold; font-size: 14px; margin: 3px 0;">Golden Bridge Corp S.A.S</div>
                            <div style="font-size: 11px; margin: 3px 0;">NOTAS DE CARTERA</div>
                            <div style="text-align: right; font-size: 9px; margin-top: 3px;">${formattedDate}</div>
                        </div>
                        <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; height: 4px; margin: 3px 0;"></div>
                        <div style="text-align: left; font-size: 9px; margin: 5px 0 3px 0;">Ciudad: ${data.cityCode}</div>
                    </div>
                    <div style="width: 100%; display: flex; justify-content: center; box-sizing: border-box;">
                        <table style="width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 9px; table-layout: fixed; max-width: 100%; box-sizing: border-box;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 5%; box-sizing: border-box;">Numero</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 4%; box-sizing: border-box;">Tipo</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 6%; box-sizing: border-box;">Fechahoy:</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 6%; box-sizing: border-box;">Factura:</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 6%; box-sizing: border-box;">Contrato:</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 7%; box-sizing: border-box;">Identifica:</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 15%; box-sizing: border-box;">Titular:</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 8%; box-sizing: border-box;">Valomota:</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 6%; box-sizing: border-box;">Fechavenci:</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 9%; box-sizing: border-box;">Concepto:</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 18%; box-sizing: border-box;">Ejecutivo:</th>
                            <th style="border: 1px solid #000; padding: 3px 2px; background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; text-align: left; width: 10%; box-sizing: border-box;">Estado:</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        if (pageRows.length === 0) {
            reportHTML += `
                        <tr>
                            <td colspan="11" style="text-align: center; padding: 20px; border: 1px solid #000;">
                                No se encontraron notas débito en el rango de fechas seleccionado
                            </td>
                        </tr>
            `;
        } else {
            pageRows.forEach(row => {
                reportHTML += `
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${row.numero}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${row.tipo}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${formatDate(row.fechaHoy)}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${row.factura}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${row.contrato}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${row.identificacion}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${row.titularNombre || ''}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: right; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${formatMoney(row.valorNota)}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${formatDate(row.fechaVencimiento)}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${row.concepto}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${row.ejecutivo}</td>
                        <td style="border: 1px solid #000; padding: 3px 2px; font-size: 9px; text-align: left; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box;">${row.estado}</td>
                    </tr>
                `;
            });
        }
        
        reportHTML += `
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('reportContent').innerHTML = reportHTML;
    }

    // Funciones de paginación
    window.goFirst = function() {
        window.__page = 1;
        renderReport();
    };

    window.goPrevious = function() {
        if (window.__page > 1) {
            window.__page--;
            renderReport();
        }
    };

    window.goNext = function() {
        const totalPages = Math.ceil(window.__rows.length / window.__pageSize);
        if (window.__page < totalPages) {
            window.__page++;
            renderReport();
        }
    };

    window.goLast = function() {
        window.__page = Math.ceil(window.__rows.length / window.__pageSize);
        renderReport();
    };

    window.goToPage = function(page) {
        const totalPages = Math.ceil(window.__rows.length / window.__pageSize);
        const pageNum = parseInt(page, 10);
        if (pageNum >= 1 && pageNum <= totalPages) {
            window.__page = pageNum;
            renderReport();
        } else {
            document.getElementById('currentPage').value = window.__page;
        }
    };

    // Funciones de zoom
    window.setZoom = function(delta) {
        window.__zoom = Math.max(0.5, Math.min(2, window.__zoom + delta));
        document.getElementById('zoomLevel').textContent = Math.round(window.__zoom * 100) + '%';
        renderReport();
        
        // Asegurar que el contenido esté centrado después del zoom
        setTimeout(() => {
            const tableWrap = document.getElementById('tableWrap');
            if (tableWrap) {
                tableWrap.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }, 100);
    };

    // Funciones de exportación
    window.exportExcel = function() {
        try {
            const data = loadData();
            const allRows = window.__rows || [];
            
            let excelHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Numero</th>
                            <th>Tipo</th>
                            <th>Fechahoy:</th>
                            <th>Factura:</th>
                            <th>Contrato:</th>
                            <th>Identifica:</th>
                            <th>Valomota:</th>
                            <th>Fechavenci:</th>
                            <th>Concepto:</th>
                            <th>Ejecutivo:</th>
                            <th>Estado:</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            allRows.forEach(row => {
                excelHTML += `
                    <tr>
                        <td>${row.numero}</td>
                        <td>${row.tipo}</td>
                        <td>${formatDate(row.fechaHoy)}</td>
                        <td>${row.factura}</td>
                        <td>${row.contrato}</td>
                        <td>${row.identificacion}</td>
                        <td>${row.titularNombre || ''}</td>
                        <td>${formatMoney(row.valorNota)}</td>
                        <td>${formatDate(row.fechaVencimiento)}</td>
                        <td>${row.concepto}</td>
                        <td>${row.ejecutivo}</td>
                        <td>${row.estado}</td>
                    </tr>
                `;
            });
            
            excelHTML += `
                    </tbody>
                </table>
            `;
            
            const fullExcelHTML = `
                <html>
                    <head>
                        <meta charset='utf-8'>
                        <title>Reporte Nota Débito</title>
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
                                margin: 0 auto 20px auto; 
                                border: 2px solid #000;
                            }
                            th, td { 
                                border: 1px solid #000; 
                                padding: 8px; 
                                text-align: left; 
                                font-size: 12px;
                            }
                            th { 
                                background-color: #f0f0f0; 
                                font-weight: bold; 
                                text-transform: uppercase;
                                text-align: center;
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
                        <div class="report-title">Golden Bridge Corp S.A.S</div>
                        <div class="report-subtitle">NOTAS DE CARTERA - Ciudad: ${data.cityCode} - Desde: ${formatDate(data.startDate)} Hasta: ${formatDate(data.endDate)}</div>
                        ${excelHTML}
                        <div class="footer">© 2025 - GOLDEN APP</div>
                    </body>
                </html>
            `;
            
            // Crear blob y descargar
            const blob = new Blob(['\ufeff', fullExcelHTML], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-nota-debito-${new Date().getTime()}.xls`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exportando Excel:', error);
            alert('Error al exportar a Excel');
        }
    };

    window.exportDOC = function() {
        try {
            const data = loadData();
            const allRows = window.__rows || [];
            
            let tableRows = '';
            allRows.forEach(row => {
                tableRows += `
                    <tr>
                        <td>${row.numero}</td>
                        <td>${row.tipo}</td>
                        <td>${formatDate(row.fechaHoy)}</td>
                        <td>${row.factura}</td>
                        <td>${row.contrato}</td>
                        <td>${row.identificacion}</td>
                        <td>${row.titularNombre || ''}</td>
                        <td style="text-align: right;">${formatMoney(row.valorNota)}</td>
                        <td>${formatDate(row.fechaVencimiento)}</td>
                        <td>${row.concepto}</td>
                        <td>${row.ejecutivo}</td>
                        <td>${row.estado}</td>
                    </tr>
                `;
            });
            
            const wordHTML = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8">
                    <style>
                        @page { 
                            size: A4 landscape; 
                            margin: 15mm 10mm; 
                        }
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0;
                            padding: 0;
                            font-size: 11px;
                            text-align: center;
                        }
                        .report-container {
                            width: 100%;
                            max-width: 100%;
                            margin: 0 auto;
                            text-align: center;
                        }
                        .double-line {
                            border-top: 2px solid #000;
                            border-bottom: 2px solid #000;
                            height: 4px;
                            margin: 5px 0;
                        }
                        .header-container {
                            text-align: center;
                            margin-bottom: 10px;
                        }
                        .company-name {
                            font-weight: bold;
                            font-size: 18px;
                            margin: 5px 0;
                        }
                        .report-title {
                            font-size: 14px;
                            margin: 5px 0;
                        }
                        .header-date {
                            text-align: right;
                            font-size: 12px;
                            margin-top: 5px;
                        }
                        .city-info {
                            text-align: left;
                            font-size: 12px;
                            margin: 10px 0 5px 0;
                        }
                        table { 
                            width: 100%; 
                            max-width: 100%;
                            border-collapse: collapse; 
                            margin: 0 auto;
                            border: 1px solid #000;
                            font-size: 12px;
                            table-layout: fixed;
                            display: table;
                        }
                        th, td { 
                            border: 1px solid #000; 
                            padding: 8px 6px; 
                            text-align: left; 
                            word-wrap: break-word;
                            overflow: hidden;
                            font-size: 12px;
                        }
                        th { 
                            background-color: #f0f0f0; 
                            font-weight: bold; 
                            text-transform: uppercase;
                            text-align: center;
                            font-size: 11px;
                        }
                        .text-right {
                            text-align: right;
                        }
                        .footer { 
                            text-align: center; 
                            color: #888; 
                            font-size: 10px; 
                            margin-top: 20px; 
                            width: 100%;
                        }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <div class="double-line"></div>
                        <div class="header-container">
                            <div class="company-name">Golden Bridge Corp S.A.S</div>
                            <div class="report-title">NOTAS DE CARTERA</div>
                            <div class="header-date">${new Date().toLocaleDateString('es-CO', {day:'2-digit', month:'2-digit', year:'numeric'})}</div>
                        </div>
                        <div class="double-line"></div>
                        <div class="city-info">Ciudad: ${data.cityCode}</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Numero</th>
                                    <th>Tipo</th>
                                    <th>Fechahoy:</th>
                                    <th>Factura:</th>
                                    <th>Contrato:</th>
                                    <th>Identifica:</th>
                                    <th>Valomota:</th>
                                    <th>Fechavenci:</th>
                                    <th>Concepto:</th>
                                    <th>Ejecutivo:</th>
                                    <th>Estado:</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                        <div class="footer">© 2025 - GOLDEN APP</div>
                    </div>
                </body>
            </html>
            `;
            
            // Crear blob y descargar
            const blob = new Blob(['\ufeff', wordHTML], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-nota-debito-${new Date().getTime()}.doc`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exportando Word:', error);
            alert('Error al exportar a Word');
        }
    };

    window.exportPDF = function() {
        // Abrir directamente el diálogo de impresión del navegador
        // Muestra vista previa antes de imprimir/guardar como PDF
        window.print();
    };

    // Inicializar cuando se carga la página
    document.addEventListener('DOMContentLoaded', function() {
        // Establecer zoom inicial
        document.getElementById('zoomLevel').textContent = Math.round(window.__zoom * 100) + '%';
        processReportData();
    });
})();
