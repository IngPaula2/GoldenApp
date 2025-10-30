// REPORTE DE FACTURAS
(function(){
    window.__rows = [];
    window.__page = 1;
    window.__pageSize = 20;
    window.__zoom = 1;

    function parseQuery(){
        const p=new URLSearchParams(location.search);
        return { ciudad: p.get('ciudad')||'', fechaInicial: p.get('fechaInicial')||'', fechaFinal: p.get('fechaFinal')||'' };
    }

    function getCiudadNombre(codigo){
        const map = { '101':'BOGOTÁ','102':'MEDELLÍN','103':'CALI','104':'BARRANQUILLA','105':'CARTAGENA','106':'CÚCUTA','107':'BUCARAMANGA','108':'PEREIRA','109':'SANTA MARTA','110':'IBAGUÉ' };
        return map[codigo] || `CIUDAD ${codigo}`;
    }

    function getFechaActual(){
        const d=new Date();
        return d.toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit',year:'numeric'});
    }

    function formatDate(s){
        if (!s) return '';
        const str = String(s).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            const [y,m,d] = str.split('-');
            return `${d}/${m}/${y}`;
        }
        try { return new Date(str).toLocaleDateString('es-CO'); } catch(e){ return str; }
    }

    function formatMoney(n){
        if (n==null || isNaN(n)) return '-';
        return '$'+ new Intl.NumberFormat('es-CO').format(Number(n));
    }

    function loadData(){
        // Preferir dataset preparado por la pantalla principal
        try {
            const raw = localStorage.getItem('reporteFacturasData');
            if (raw){
                const data = JSON.parse(raw);
                if (Array.isArray(data.invoices)) return data;
            }
        } catch(e) {}
        // Fallback vacío
        return { city:'', startDate:'', endDate:'', invoices:[] };
    }

    function renderTable(){
        const tbody = document.getElementById('tbody');
        tbody.innerHTML='';
        if (!window.__rows.length){
            tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:40px; color:#6c757d;">No se encontraron facturas</td></tr>`;
            return;
        }
        const start = (window.__page-1)*window.__pageSize;
        const end = Math.min(start+window.__pageSize, window.__rows.length);
        const page = window.__rows.slice(start,end);
        page.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.invoiceNumber||''}</td>
                <td>${r.contractNumber||''}</td>
                <td>${formatDate(r.date)}</td>
                <td>${(r.clientId||'')}</td>
                <td>${(r.clientName||'')}</td>
                <td>${formatMoney(r.valorTotal)}</td>
                <td>${formatMoney(r.cuotaInicial)}</td>
                <td>${formatMoney(r.saldo)}</td>
                <td>${(r.numCuotas!=null && r.numCuotas!=='') ? r.numCuotas : 0}</td>
                <td>${formatMoney(r.valorCuota)}</td>
                <td>${r.executive||''}</td>
                <td>${r.ingreso||'-'}</td>
                <td>${r.estado||''}</td>
                <td>${formatDate(r.firstPaymentDate)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function updatePagination(){
        const totalPages = Math.ceil(window.__rows.length / window.__pageSize) || 1;
        document.getElementById('currentPage').value = window.__page;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('paginaActual').textContent = window.__page;
    }

    window.goFirst = function(){ if (window.__page>1){ window.__page=1; renderTable(); updatePagination(); } };
    window.goPrevious = function(){ if (window.__page>1){ window.__page--; renderTable(); updatePagination(); } };
    window.goNext = function(){ const tp=Math.ceil(window.__rows.length/window.__pageSize)||1; if (window.__page<tp){ window.__page++; renderTable(); updatePagination(); } };
    window.goLast = function(){ const tp=Math.ceil(window.__rows.length/window.__pageSize)||1; if (window.__page<tp){ window.__page=tp; renderTable(); updatePagination(); } };
    window.goToPage = function(p){ const n=parseInt(p,10)||1; const tp=Math.ceil(window.__rows.length/window.__pageSize)||1; if(n>=1&&n<=tp){ window.__page=n; renderTable(); updatePagination(); } else { document.getElementById('currentPage').value = window.__page; } };

    window.setZoom = function(delta){
        window.__zoom = Math.max(0.5, Math.min(2, window.__zoom + delta));
        const c = document.getElementById('reportRoot');
        c.style.transform = `scale(${window.__zoom})`;
        c.style.transformOrigin = 'top left';
        document.getElementById('zoomLevel').textContent = Math.round(window.__zoom*100)+'%';
    };

    function cleanHTML(){
        const rows = window.__rows;
        const body = rows.map(r => `
            <tr>
                <td>${r.invoiceNumber||''}</td>
                <td>${r.contractNumber||''}</td>
                <td>${formatDate(r.date)}</td>
                <td>${(r.clientId||'')}</td>
                <td>${(r.clientName||'')}</td>
                <td>${formatMoney(r.valorTotal)}</td>
                <td>${formatMoney(r.cuotaInicial)}</td>
                <td>${formatMoney(r.saldo)}</td>
                <td>${(r.numCuotas!=null && r.numCuotas!=='') ? r.numCuotas : 0}</td>
                <td>${formatMoney(r.valorCuota)}</td>
                <td>${r.executive||''}</td>
                <td>${r.ingreso||'-'}</td>
                <td>${r.estado||''}</td>
                <td>${formatDate(r.firstPaymentDate)}</td>
            </tr>
        `).join('');
        return `
            <div class="report-container">
                <div class="report-header">
                    <div class="report-title">GOLDEN BRIDGE CORP. S.A.S.</div>
                    <div class="report-subtitle">REPORTE DE FACTURAS DE LA CIUDAD: ${getCiudadNombre(parseQuery().ciudad)} Fecha: ${getFechaActual()}</div>
                    <div class="report-info">Total de Facturas: ${rows.length}</div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th># FACTURA</th>
                                <th># CONTRATO</th>
                                <th>FECHA FACTURA</th>
                                <th>ID TITULAR</th>
                                <th>NOMBRE TITULAR</th>
                                <th>VALOR TOTAL</th>
                                <th>CUOTA INICIAL</th>
                                <th>SALDO</th>
                                <th># CUOTAS</th>
                                <th>VALOR CUOTA</th>
                                <th>EJECUTIVO</th>
                                <th>INGRESO</th>
                                <th>ESTADO</th>
                                <th>PRIMER PAGO</th>
                            </tr>
                        </thead>
                        <tbody>${body}</tbody>
                    </table>
                </div>
                <div class="footer">© 2025 - GOLDEN APP</div>
            </div>
        `;
    }

    function ensureProgressOverlay(){
        if (document.getElementById('exportProgressOverlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'exportProgressOverlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.35)';
        overlay.style.display = 'none';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';
        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.padding = '16px 20px';
        box.style.borderRadius = '8px';
        box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        box.style.fontFamily = 'Arial, sans-serif';
        box.style.fontSize = '14px';
        box.innerHTML = '<span id="exportProgressText">Generando Excel…</span>';
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function showProgress(msg){
        ensureProgressOverlay();
        const overlay = document.getElementById('exportProgressOverlay');
        const text = document.getElementById('exportProgressText');
        if (text) text.textContent = msg || 'Generando Excel…';
        overlay.style.display = 'flex';
    }

    function hideProgress(){
        const overlay = document.getElementById('exportProgressOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

    async function doExportExcel(){
        console.time('exportExcel_build');
        const rows = Array.isArray(window.__rows) ? window.__rows : [];

        function toNumber(value){
            const n = Number(value);
            return Number.isFinite(n) ? n : '';
        }

        function toText(value){
            if (value==null) return '';
            const s = String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            return s;
        }

        function toIsoDate(value){
            if (!value) return '';
            const d = new Date(value);
            return isNaN(d.getTime()) ? toText(value) : d.toISOString().slice(0,10);
        }

        const header = `
            <tr>
                <th># FACTURA</th>
                <th># CONTRATO</th>
                <th>FECHA FACTURA</th>
                <th>ID TITULAR</th>
                <th>NOMBRE TITULAR</th>
                <th>VALOR TOTAL</th>
                <th>CUOTA INICIAL</th>
                <th>SALDO</th>
                <th># CUOTAS</th>
                <th>VALOR CUOTA</th>
                <th>EJECUTIVO</th>
                <th>INGRESO</th>
                <th>ESTADO</th>
                <th>PRIMER PAGO</th>
            </tr>`;

        // Construcción por bloques para no congelar la UI
        const chunkSize = 2000;
        const parts = [];
        for (let i = 0; i < rows.length; i++){
            const r = rows[i];
            parts.push(`
            <tr>
                <td>${toText(r.invoiceNumber)}</td>
                <td>${toText(r.contractNumber)}</td>
                <td>${toIsoDate(r.date)}</td>
                <td>${toText(r.clientId)}</td>
                <td>${toText(r.clientName)}</td>
                <td>${toNumber(r.valorTotal)}</td>
                <td>${toNumber(r.cuotaInicial)}</td>
                <td>${toNumber(r.saldo)}</td>
                <td>${(r.numCuotas!=null && r.numCuotas!=='') ? r.numCuotas : 0}</td>
                <td>${toNumber(r.valorCuota)}</td>
                <td>${toText(r.executive)}</td>
                <td>${toText(r.ingreso||'-')}</td>
                <td>${toText(r.estado)}</td>
                <td>${toIsoDate(r.firstPaymentDate)}</td>
            </tr>`);
            if (i>0 && i % chunkSize === 0){
                await sleep(0);
            }
        }
        const bodyRows = parts.join('');

        const headerInfo = `
            <table cellspacing="0" cellpadding="2" style="margin-bottom:8px; font-family:Arial, sans-serif; font-size:12px;">
                <tr>
                    <td colspan="14" style="text-align:center; font-weight:bold; font-size:16px;">GOLDEN BRIDGE CORP. S.A.S.</td>
                </tr>
                <tr>
                    <td colspan="14" style="text-align:center; color:#555;">REPORTE DE FACTURAS DE LA CIUDAD: ${toText(getCiudadNombre(parseQuery().ciudad))} Fecha: ${toText(getFechaActual())}</td>
                </tr>
                <tr>
                    <td colspan="14" style="text-align:center; color:#777;">Total de Facturas: ${rows.length}</td>
                </tr>
            </table>`;

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte de Facturas</title>
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <style>
                table{border-collapse:collapse;}
                th,td{border:1px solid #000; font-family: Arial, sans-serif; font-size: 12px;}
                th{background:#f0f0f0; font-weight:bold;}
            </style>
        </head><body>
            ${headerInfo}
            <table border="1" cellspacing="0" cellpadding="3">
                <thead>${header}</thead>
                <tbody>${bodyRows}</tbody>
            </table>
        </body></html>`;

        console.timeEnd('exportExcel_build');
        console.log('exportExcel_rows', rows.length);
        console.log('exportExcel_html_kb', Math.round(html.length/1024));

        try {
            const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte-facturas.xls';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            const dataUri = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(html);
            const a = document.createElement('a');
            a.href = dataUri;
            a.download = 'reporte-facturas.xls';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    window.exportExcel = function(){
        const rows = window.__rows || [];
        const bodyRows = rows.map(r => `
            <tr>
                <td>${r.invoiceNumber||''}</td>
                <td>${r.contractNumber||''}</td>
                <td>${formatDate(r.date)}</td>
                <td>${(r.clientId||'')}</td>
                <td>${(r.clientName||'')}</td>
                <td>${formatMoney(r.valorTotal)}</td>
                <td>${formatMoney(r.cuotaInicial)}</td>
                <td>${formatMoney(r.saldo)}</td>
                <td>${(r.numCuotas!=null && r.numCuotas!=='') ? r.numCuotas : 0}</td>
                <td>${formatMoney(r.valorCuota)}</td>
                <td>${r.executive||''}</td>
                <td>${r.ingreso||'-'}</td>
                <td>${r.estado||''}</td>
                <td>${formatDate(r.firstPaymentDate)}</td>
            </tr>
        `).join('');

        const html = `
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Reporte de Facturas</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                    .report-title { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 10px; text-transform: uppercase; }
                    .report-subtitle { font-size: 14px; text-align: center; margin-bottom: 10px; color: #666; text-transform: uppercase; }
                    .report-info { font-size: 12px; text-align: center; margin-bottom: 20px; color: #888; text-transform: uppercase; }
                    table { width: 100%; border-collapse: collapse; margin: 0 auto 20px auto; border: 1px solid #000; table-layout: fixed; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; }
                    th { background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; }
                    th:nth-child(1), td:nth-child(1) { width: 8%; }
                    th:nth-child(2), td:nth-child(2) { width: 8%; }
                    th:nth-child(3), td:nth-child(3) { width: 10%; }
                    th:nth-child(4), td:nth-child(4) { width: 9%; }
                    th:nth-child(5), td:nth-child(5) { width: 18%; }
                    th:nth-child(6), td:nth-child(6) { width: 9%; }
                    th:nth-child(7), td:nth-child(7) { width: 9%; }
                    th:nth-child(8), td:nth-child(8) { width: 8%; }
                    th:nth-child(9), td:nth-child(9) { width: 6%; }
                    th:nth-child(10), td:nth-child(10) { width: 8%; }
                    th:nth-child(11), td:nth-child(11) { width: 12%; }
                    th:nth-child(12), td:nth-child(12) { width: 8%; }
                    th:nth-child(13), td:nth-child(13) { width: 7%; }
                    th:nth-child(14), td:nth-child(14) { width: 10%; }
                    .footer { text-align: center; font-size: 10px; color: #888; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="report-title">GOLDEN BRIDGE CORP. S.A.S.</div>
                <div class="report-subtitle">REPORTE DE FACTURAS DE LA CIUDAD: ${getCiudadNombre(parseQuery().ciudad)} Fecha: ${getFechaActual()}</div>
                <div class="report-info">Total de Facturas: ${rows.length}</div>
                <table>
                    <thead>
                        <tr>
                            <th># FACTURA</th>
                            <th># CONTRATO</th>
                            <th>FECHA FACTURA</th>
                            <th>ID TITULAR</th>
                            <th>NOMBRE TITULAR</th>
                            <th>VALOR TOTAL</th>
                            <th>CUOTA INICIAL</th>
                            <th>SALDO</th>
                            <th># CUOTAS</th>
                            <th>VALOR CUOTA</th>
                            <th>EJECUTIVO</th>
                            <th>INGRESO</th>
                            <th>ESTADO</th>
                            <th>PRIMER PAGO</th>
                        </tr>
                    </thead>
                    <tbody>${bodyRows}</tbody>
                </table>
                <div class="footer">© 2025 - GOLDEN APP</div>
            </body>
            </html>`;

        try {
            const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte-facturas.xls';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            const dataUri = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(html);
            const a = document.createElement('a');
            a.href = dataUri;
            a.download = 'reporte-facturas.xls';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };
    window.exportDOC = function(){
        const rows = window.__rows || [];
        const bodyRows = rows.map(r => `
            <tr>
                <td>${r.invoiceNumber||''}</td>
                <td>${r.contractNumber||''}</td>
                <td>${formatDate(r.date)}</td>
                <td>${(r.clientId||'')}</td>
                <td>${(r.clientName||'')}</td>
                <td>${formatMoney(r.valorTotal)}</td>
                <td>${formatMoney(r.cuotaInicial)}</td>
                <td>${formatMoney(r.saldo)}</td>
                <td>${(r.numCuotas!=null && r.numCuotas!=='') ? r.numCuotas : 0}</td>
                <td>${formatMoney(r.valorCuota)}</td>
                <td>${r.executive||''}</td>
                <td>${r.ingreso||'-'}</td>
                <td>${r.estado||''}</td>
                <td>${formatDate(r.firstPaymentDate)}</td>
            </tr>
        `).join('');

        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset='utf-8'>
                <title>Reporte de Facturas</title>
                <style>
                    @page { size: A4 landscape; margin: 1cm 0.5cm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 10px; line-height: 1.2; }
                    .report-title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 8px; text-transform: uppercase; }
                    .report-subtitle { font-size: 12px; text-align: center; margin-bottom: 8px; color: #666; text-transform: uppercase; }
                    .report-info { font-size: 10px; text-align: center; margin-bottom: 15px; color: #888; text-transform: uppercase; }
                    table { width: 100%; border-collapse: collapse; margin: 0 auto 15px auto; border: 1px solid #000; table-layout: fixed; }
                    th, td { border: 1px solid #000; padding: 4px 3px; text-align: left; font-size: 9px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
                    th { background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; }
                    th:nth-child(1), td:nth-child(1) { width: 8%; }
                    th:nth-child(2), td:nth-child(2) { width: 8%; }
                    th:nth-child(3), td:nth-child(3) { width: 9%; }
                    th:nth-child(4), td:nth-child(4) { width: 9%; }
                    th:nth-child(5), td:nth-child(5) { width: 14%; }
                    th:nth-child(6), td:nth-child(6) { width: 8%; }
                    th:nth-child(7), td:nth-child(7) { width: 8%; }
                    th:nth-child(8), td:nth-child(8) { width: 8%; }
                    th:nth-child(9), td:nth-child(9) { width: 6%; }
                    th:nth-child(10), td:nth-child(10) { width: 8%; }
                    th:nth-child(11), td:nth-child(11) { width: 10%; }
                    th:nth-child(12), td:nth-child(12) { width: 8%; }
                    th:nth-child(13), td:nth-child(13) { width: 7%; }
                    th:nth-child(14), td:nth-child(14) { width: 9%; }
                    .footer { text-align: center; font-size: 8px; color: #888; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="report-title">GOLDEN BRIDGE CORP. S.A.S.</div>
                <div class="report-subtitle">REPORTE DE FACTURAS DE LA CIUDAD: ${getCiudadNombre(parseQuery().ciudad)} Fecha: ${getFechaActual()}</div>
                <div class="report-info">Total de Facturas: ${rows.length}</div>
                <table>
                    <thead>
                        <tr>
                            <th># FACTURA</th>
                            <th># CONTRATO</th>
                            <th>FECHA FACTURA</th>
                            <th>ID TITULAR</th>
                            <th>NOMBRE TITULAR</th>
                            <th>VALOR TOTAL</th>
                            <th>CUOTA INICIAL</th>
                            <th>SALDO</th>
                            <th># CUOTAS</th>
                            <th>VALOR CUOTA</th>
                            <th>EJECUTIVO</th>
                            <th>INGRESO</th>
                            <th>ESTADO</th>
                            <th>PRIMER PAGO</th>
                        </tr>
                    </thead>
                    <tbody>${bodyRows}</tbody>
                </table>
                <div class="footer">© 2025 - GOLDEN APP</div>
            </body>
            </html>`;
        const blob = new Blob([html], {type:'application/msword'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download='reporte-facturas.doc'; a.click(); URL.revokeObjectURL(url);
    };
    window.exportPDF = function(){ window.print(); };

    // Exportación rápida CSV (muy veloz para grandes volúmenes)
    window.exportCSV = function(){
        const rows = window.__rows || [];
        if (!rows.length) { alert('No hay datos para exportar'); return; }
        const headers = ['# FACTURA','# CONTRATO','FECHA FACTURA','ID TITULAR','NOMBRE TITULAR','VALOR TOTAL','CUOTA INICIAL','SALDO','# CUOTAS','VALOR CUOTA','EJECUTIVO','INGRESO','ESTADO','PRIMER PAGO'];
        const toCsv = v => '"' + String(v ?? '').replace(/"/g,'""') + '"';
        const lines = [headers.map(toCsv).join(',')];
        rows.forEach(r => {
            lines.push([
                r.invoiceNumber, r.contractNumber, r.date, r.clientId, r.clientName,
                r.valorTotal, r.cuotaInicial, r.saldo, r.numCuotas, r.valorCuota,
                r.executive, r.ingreso, r.estado, r.firstPaymentDate
            ].map(toCsv).join(','));
        });
        const csv = lines.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'reporte-facturas.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    window.exportCSV = function(){
        const rows = Array.isArray(window.__rows) ? window.__rows : [];
        const headers = [
            '# FACTURA', '# CONTRATO', 'FECHA FACTURA', 'ID TITULAR', 'NOMBRE TITULAR',
            'VALOR TOTAL', 'CUOTA INICIAL', 'SALDO', '# CUOTAS', 'VALOR CUOTA',
            'EJECUTIVO', 'INGRESO', 'ESTADO', 'PRIMER PAGO'
        ];

        function toNumberOrEmpty(value){
            const n = Number(value);
            return Number.isFinite(n) ? n : '';
        }

        function escapeCell(value){
            if (value==null) return '';
            const s = String(value).replace(/"/g, '""');
            return '"'+ s + '"';
        }

        const data = [headers].concat(rows.map(r => [
            r.invoiceNumber||'',
            r.contractNumber||'',
            formatDate(r.date)||'',
            r.clientId||'',
            r.clientName||'',
            toNumberOrEmpty(r.valorTotal),
            toNumberOrEmpty(r.cuotaInicial),
            toNumberOrEmpty(r.saldo),
            (r.numCuotas!=null && r.numCuotas!=='') ? r.numCuotas : 0,
            toNumberOrEmpty(r.valorCuota),
            r.executive||'',
            r.ingreso||'-',
            r.estado||'',
            formatDate(r.firstPaymentDate)||''
        ]));

        const csv = data.map(row => row.map(escapeCell).join(',')).join('\r\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-facturas.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    function init(){
        const params = parseQuery();
        const data = loadData();
        window.__rows = Array.isArray(data.invoices) ? data.invoices : [];
        document.getElementById('codigoCiudad').textContent = params.ciudad || data.city || '';
        document.getElementById('ciudadNombre').textContent = getCiudadNombre(params.ciudad || data.city || '');
        document.getElementById('fechaReporte').textContent = getFechaActual();
        document.getElementById('totalRegistros').textContent = window.__rows.length;
        renderTable();
        updatePagination();
    }

    document.addEventListener('DOMContentLoaded', init);
})();


