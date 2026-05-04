(function () {
    'use strict';

    var rows = [];
    var page = 1;
    var pageSize = 40;
    var zoom = 1;
    var reportMeta = null;
    var currentMode = 'detallado';

    function isResumenMode() {
        return String(currentMode || '').indexOf('resumen') === 0;
    }

    function toNumber(value) {
        var parsed = parseFloat(String(value == null ? '' : value).replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatMoney(value) {
        return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(toNumber(value));
    }

    function formatPoints(value) {
        return toNumber(value).toFixed(3).replace('.', ',');
    }

    function formatPercent(value) {
        return toNumber(value).toFixed(2).replace('.', ',') + '%';
    }

    function formatDate(value) {
        if (!value) return '';
        var s = String(value).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            var p = s.split('-');
            return p[2] + '/' + p[1] + '/' + p[0];
        }
        var d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    }

    function formatMonthShort(value) {
        var s = String(value || '').trim();
        var m = s.match(/^(\d{4})-(\d{2})$/);
        if (!m) return s || 'INGRESOS';
        var year = m[1].slice(-2);
        var month = parseInt(m[2], 10);
        var names = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        var label = names[month - 1] || m[2];
        return label + '-' + year;
    }

    function loadData() {
        try {
            var raw = localStorage.getItem('auditoriaReporteLiquidacionData');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function getCityNameByCode(cityCode) {
        var code = String(cityCode || '').trim().toUpperCase();
        if (!code) return '';
        try {
            var raw = localStorage.getItem('ciudadesData');
            var data = raw ? JSON.parse(raw) : {};
            var city = data && data[code] ? data[code] : null;
            return city && city.nombre ? String(city.nombre) : '';
        } catch (e) {
            return '';
        }
    }

    function getColumns() {
        if (currentMode === 'detallado_casas_externas') {
            return [
                { key: 'factura', label: 'FACTURA' },
                { key: 'matricula', label: 'MATRICULA' },
                { key: 'cctitular', label: 'CCTITULAR' },
                { key: 'titular', label: 'TITULAR' },
                { key: 'ingreso', label: 'INGRESO' },
                { key: 'ro', label: 'RO' },
                { key: 'fecha', label: 'FECHA', type: 'date' },
                { key: 'valor', label: 'VALOR', type: 'money' }
            ];
        }
        if (currentMode === 'resumen_supervisor_nacional') {
            return [
                { key: 'nombre', label: 'NOMBRE' },
                { key: 'cuentasAsignadas', label: 'CTAS ASIG.' },
                { key: 'cuentasCobradas', label: 'CTS COBR' },
                { key: 'porcentajeCobrado', label: '%', type: 'percent' },
                { key: 'montoAsignado', label: 'MONTO ASIG', type: 'money' },
                { key: 'recaudoDia', label: 'RECAUDO DÍA', type: 'money' },
                { key: 'descuento', label: 'ND' },
                { key: 'nc', label: 'NC' },
                { key: 'recaudo', label: 'TOTAL RECAUDO', type: 'money' },
                { key: 'porcentajeLiquidacion', label: '% LIQUID', type: 'percent' },
                { key: 'totalRecaudo', label: 'TOTAL RECAUDO', type: 'money' },
                { key: 'premiosOficiales', label: 'PREMIOS OFICIALES', type: 'money' },
                { key: 'premiosConcurso', label: 'PREMIOS CONCURSO', type: 'money' },
                { key: 'total', label: 'TOTAL GIRO', type: 'money' }
            ];
        }
        if (currentMode === 'resumen_liquidacion') {
            return [
                { key: 'ciudad', label: 'CIUDAD' },
                { key: 'nombre', label: 'NOMBRE' },
                { key: 'cargo', label: 'CARGO' },
                { key: 'cuentasAsignadas', label: 'CTAS ASIG.' },
                { key: 'cuentasCobradas', label: 'CTS COBR' },
                { key: 'porcentajeCobrado', label: '%', type: 'percent' },
                { key: 'montoAsignado', label: 'MONTO ASIG', type: 'money' },
                { key: 'recaudoDia', label: 'RECAUDO DÍA', type: 'money' },
                { key: 'recaudo', label: 'RECAUDO TOTAL', type: 'money' },
                { key: 'porcentajeLiquidacion', label: '% LIQUID', type: 'percent' },
                { key: 'totalRecaudo', label: 'TOTAL RECAUDO', type: 'money' },
                { key: 'premiosOficiales', label: 'PREMIOS OFICIALES', type: 'money' },
                { key: 'premiosConcurso', label: 'PREMIOS CONCURSO', type: 'money' },
                { key: 'total', label: 'TOTAL', type: 'money' }
            ];
        }
        if (isResumenMode()) {
            return [
                { key: 'ciudad', label: 'CIUDAD' },
                { key: 'nombre', label: 'NOMBRE' },
                { key: 'cargo', label: 'CARGO' },
                { key: 'cuentasAsignadas', label: 'CTAS ASIG.' },
                { key: 'cuentasCobradas', label: 'CTS COBR' },
                { key: 'porcentajeCobrado', label: '%', type: 'percent' },
                { key: 'montoAsignado', label: 'MONTO ASIG', type: 'money' },
                { key: 'recaudoDia', label: 'RECAUDO DÍA', type: 'money' },
                { key: 'descuento', label: 'D' },
                { key: 'nc', label: 'NC' },
                { key: 'recaudo', label: 'RECAUDO', type: 'money' },
                { key: 'porcentajeLiquidacion', label: '% LIQUID', type: 'percent' },
                { key: 'totalRecaudo', label: 'TOTAL RECAUDO', type: 'money' },
                { key: 'premiosOficiales', label: 'PREMIOS OFICIALES', type: 'money' },
                { key: 'premiosConcurso', label: 'PREMIOS CONCURSO', type: 'money' },
                { key: 'total', label: 'TOTAL', type: 'money' }
            ];
        }
        if (currentMode === 'detallado') {
            return [
                { key: 'no', label: 'No' },
                { key: 'cto', label: 'Ingreso' },
                { key: 'cedula', label: 'CÉDULA' },
                { key: 'nombre', label: 'NOMBRE' },
                { key: 'vto', label: 'VTO.', type: 'date' },
                { key: 'valorCuota', label: 'VALOR CUOTA', type: 'money' },
                { key: 'saldoActual', label: 'SALDO ACTUAL', type: 'money' },
                { key: 'nuevoSaldo', label: 'NUEVO SALDO', type: 'money' },
                { key: 'cta', label: 'CTA.' },
                { key: 'recibo', label: 'RECIBO' },
                { key: 'valorPago', label: 'VALOR PAGO', type: 'money' },
                { key: 'fechaPag', label: 'FECHA PAG', type: 'date' },
                { key: 'puntos', label: 'PUNTOS', type: 'points' }
            ];
        }
        return [
            { key: 'factura', label: 'FACTURA' },
            { key: 'matricula', label: 'MATRICULA' },
            { key: 'cc', label: 'CC' },
            { key: 'titular', label: 'TITULAR' },
            { key: 'ingreso', label: 'INGRESO' },
            { key: 'rc', label: 'RC' },
            { key: 'fecha', label: 'FECHA', type: 'date' },
            { key: 'valor', label: 'VALOR', type: 'money' }
        ];
    }

    function formatValueByType(value, type) {
        if (type === 'money') return formatMoney(value);
        if (type === 'date') return formatDate(value);
        if (type === 'percent') return formatPercent(value);
        if (type === 'points') return formatPoints(value);
        return value == null ? '' : String(value);
    }

    function buildHeader() {
        var thead = document.getElementById('thead');
        if (!thead) return;
        if (currentMode === 'detallado_casas_externas') {
            var periodLabel = formatMonthShort(reportMeta && reportMeta.mes);
            thead.innerHTML = '<tr>' +
                '<th rowspan="2">FACTURA</th>' +
                '<th rowspan="2">MATRICULA</th>' +
                '<th rowspan="2">' + (currentMode === 'detallado_casas_externas' ? 'CCTITULAR' : 'CC') + '</th>' +
                '<th rowspan="2">TITULAR</th>' +
                '<th colspan="4">' + periodLabel + '</th>' +
                '</tr>' +
                '<tr>' +
                '<th>INGRESO</th>' +
                '<th>RC</th>' +
                '<th>FECHA</th>' +
                '<th>VALOR</th>' +
                '</tr>';
            return;
        }
        var cols = getColumns();
        thead.innerHTML = '<tr>' + cols.map(function (c) { return '<th>' + c.label + '</th>'; }).join('') + '</tr>';
    }

    function renderTable() {
        var tbody = document.getElementById('tbody');
        if (!tbody) return;
        var cols = getColumns();
        tbody.innerHTML = '';
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="' + cols.length + '" style="text-align:center; padding:40px; color:#6c757d;">No se encontraron registros para el reporte</td></tr>';
            return;
        }
        var start = (page - 1) * pageSize;
        var end = Math.min(start + pageSize, rows.length);
        rows.slice(start, end).forEach(function (r) {
            var tr = document.createElement('tr');
            if (r.__isTotalCity) {
                tr.className = 'resumen-total-ciudad-row';
                tr.style.fontWeight = '700';
                tr.style.backgroundColor = '#fff8db';
            }
            tr.innerHTML = cols.map(function (c) {
                var formatted = formatValueByType(r[c.key], c.type);
                var align = (c.type === 'money' || c.type === 'percent' || c.type === 'points') ? ' style="text-align:right;"' : '';
                return '<td' + align + '>' + formatted + '</td>';
            }).join('');
            tbody.appendChild(tr);
        });
    }

    function updatePagination() {
        var totalPages = Math.ceil(rows.length / pageSize) || 1;
        document.getElementById('currentPage').value = page;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('paginaActual').textContent = page;
    }

    function renderResultadosResumen() {
        var wrap = document.getElementById('resultadosWrap');
        if (!wrap) return;
        if (currentMode === 'detallado_casas_externas') {
            var casas = (reportMeta && reportMeta.resumenResultados) ? reportMeta.resumenResultados : {};
            wrap.style.display = 'block';
            wrap.innerHTML = '<table><tbody>' +
                '<tr><td>TOTAL RECAUDO</td><td>$ ' + formatMoney(casas.totalRecaudo || 0) + '</td></tr>' +
                '<tr><td>PORCENTAJE</td><td>' + formatPercent(casas.porcentaje || 0) + '</td></tr>' +
                '<tr><td>VALOR A LIQUIDAR</td><td>$ ' + formatMoney(casas.valorLiquidar || 0) + '</td></tr>' +
                '</tbody></table>';
            return;
        }
        var res = (reportMeta && reportMeta.resumenResultados) ? reportMeta.resumenResultados : null;
        if (!res || isResumenMode()) {
            wrap.style.display = 'none';
            return;
        }
        wrap.style.display = 'block';
        var setText = function (id, value) {
            var el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        setText('resCuentasAsignadas', String(res.cuentasAsignadas || 0));
        setText('resCuentasCobradas', String(res.cuentasCobradas || 0));
        setText('resPorcentaje', formatPercent(res.porcentaje || 0));
        setText('resMontoAsignado', '$ ' + formatMoney(res.montoAsignado || 0));
        setText('resMontoCobradoDia', '$ ' + formatMoney(res.montoCobradoAlDia || 0));
        setText('resNotasDebito', '$ ' + formatMoney(res.notasDebito || 0));
        setText('resNotasCredito', '$ ' + formatMoney(res.notasCredito || 0));
        setText('resTotalLiquidar', '$ ' + formatMoney(res.totalMontoLiquidar || 0));
    }

    function getColumnLabelForWordExport(c) {
        if (currentMode !== 'detallado') return c.label;
        var map = {
            'VALOR CUOTA': 'V. CUOTA',
            'SALDO ACTUAL': 'SALDO ACT.',
            'NUEVO SALDO': 'NVO SALDO',
            'VALOR PAGO': 'V. PAGO',
            'FECHA PAG': 'F. PAG',
            'PUNTOS': 'PTS.'
        };
        return map[c.label] || c.label;
    }

    function buildTableHtmlForExport(allRows, opts) {
        opts = opts || {};
        var forWord = !!opts.word;
        var cols = getColumns();
        var head = '<tr>' + cols.map(function (c) {
            var lab = forWord ? getColumnLabelForWordExport(c) : c.label;
            return '<th>' + lab + '</th>';
        }).join('') + '</tr>';
        var body = allRows.map(function (r) {
            return '<tr>' + cols.map(function (c) {
                var align = (c.type === 'money' || c.type === 'percent' || c.type === 'points') ? ' style="text-align:right"' : '';
                return '<td' + align + '>' + formatValueByType(r[c.key], c.type) + '</td>';
            }).join('') + '</tr>';
        }).join('');
        if (forWord) {
            var colgroup = '<colgroup>' + cols.map(function () {
                return '<col style="width:' + (100 / Math.max(cols.length, 1)).toFixed(2) + '%">';
            }).join('') + '</colgroup>';
            return '<table border="1" cellspacing="0" cellpadding="0" class="word-export-table">' + colgroup +
                '<thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
        }
        return '<table border="1" cellspacing="0" cellpadding="4" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
    }

    function buildResumenHtmlForExport() {
        if (!reportMeta || !reportMeta.resumenResultados || currentMode === 'resumen_dos_ciudades') return '';
        var tblStyle = 'border="1" cellspacing="0" cellpadding="4" style="width:100%;max-width:520px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"';
        if (currentMode === 'detallado_casas_externas') {
            var casas = reportMeta.resumenResultados;
            return '<h4>RESULTADOS</h4><table ' + tblStyle + '>' +
                '<tr><td>TOTAL RECAUDO</td><td style="text-align:right">$ ' + formatMoney(casas.totalRecaudo || 0) + '</td></tr>' +
                '<tr><td>PORCENTAJE</td><td style="text-align:right">' + formatPercent(casas.porcentaje || 0) + '</td></tr>' +
                '<tr><td>VALOR A LIQUIDAR</td><td style="text-align:right">$ ' + formatMoney(casas.valorLiquidar || 0) + '</td></tr>' +
                '</table>';
        }
        var r = reportMeta.resumenResultados;
        return '<h4>RESULTADOS</h4><table ' + tblStyle + '>' +
            '<tr><td>CUENTAS ASIGNADAS</td><td style="text-align:right">' + (r.cuentasAsignadas || 0) + '</td></tr>' +
            '<tr><td>CUENTAS COBRADAS</td><td style="text-align:right">' + (r.cuentasCobradas || 0) + '</td></tr>' +
            '<tr><td>PORCENTAJE</td><td style="text-align:right">' + formatPercent(r.porcentaje || 0) + '</td></tr>' +
            '<tr><td>MONTO ASIGNADO</td><td style="text-align:right">$ ' + formatMoney(r.montoAsignado || 0) + '</td></tr>' +
            '<tr><td>MONTO COBRADO AL DÍA</td><td style="text-align:right">$ ' + formatMoney(r.montoCobradoAlDia || 0) + '</td></tr>' +
            '<tr><td>NOTAS DÉBITO-</td><td style="text-align:right">$ ' + formatMoney(r.notasDebito || 0) + '</td></tr>' +
            '<tr><td>NOTAS CREDITO+</td><td style="text-align:right">$ ' + formatMoney(r.notasCredito || 0) + '</td></tr>' +
            '<tr><td>TOTAL MONTO A LIQUIDAR</td><td style="text-align:right">$ ' + formatMoney(r.totalMontoLiquidar || 0) + '</td></tr>' +
            '</table>';
    }

    function exportExcel() {
        if (!rows.length) {
            alert('No hay datos para exportar');
            return;
        }
        var resumenHtml = buildResumenHtmlForExport();
        var html = '<html><head><meta charset="utf-8"><title>Reporte Liquidación</title></head><body>' +
            '<h3>' + (reportMeta.tipoReporte || 'REPORTE DE LIQUIDACIÓN') + '</h3>' +
            buildTableHtmlForExport(rows) + '<br>' + resumenHtml + '</body></html>';
        var blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-liquidacion.xls';
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportDOC() {
        if (!rows.length) {
            alert('No hay datos para exportar');
            return;
        }
        var resumenHtml = buildResumenHtmlForExport();
        var wordStyles =
            '@page WordSection1 { size: 11.0in 8.5in; mso-page-orientation: landscape; margin: 0.35in 0.4in 0.35in 0.4in; }' +
            'div.WordSection1 { page: WordSection1; }' +
            'body { font-family: Arial, sans-serif; margin: 0; font-size: 10pt; mso-hyphenate: none; }' +
            'h3, h4 { margin: 10px 0 6px; }' +
            'table.word-export-table { width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; ' +
            'table-layout: fixed; font-size: 8pt; mso-width-source: userset; }' +
            'table.word-export-table th, table.word-export-table td { border: 1px solid #000; padding: 2px 3px; vertical-align: top; ' +
            'word-wrap: break-word; overflow-wrap: break-word; }' +
            'table.word-export-table th { background: #f0f0f0; font-size: 7.5pt; font-weight: bold; line-height: 1.15; }' +
            'table.word-resumen { width: 100%; max-width: 520px; border-collapse: collapse; font-size: 10pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }' +
            'table.word-resumen td { border: 1px solid #000; padding: 4px 8px; }';
        var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">' +
            '<head><meta charset="utf-8"><meta name="ProgId" content="Word.Document">' +
            '<meta name="Generator" content="GoldenApp">' +
            '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom>' +
            '<w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->' +
            '<style type="text/css">' + wordStyles + '</style>' +
            '</head><body>' +
            '<div class="WordSection1">' +
            '<h3>' + (reportMeta.tipoReporte || 'REPORTE DE LIQUIDACIÓN') + '</h3>' +
            buildTableHtmlForExport(rows, { word: true }) + '<br>' +
            resumenHtml.replace(/<table /g, '<table class="word-resumen" ') +
            '</div></body></html>';
        var blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-liquidacion.doc';
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportPDF() {
        if (!rows.length) {
            alert('No hay datos para exportar');
            return;
        }
        var savedPage = page;
        var savedSize = pageSize;
        var savedZoom = zoom;
        page = 1;
        pageSize = Math.max(rows.length, 1);
        zoom = 1;
        var root = document.getElementById('reportRoot');
        if (root) {
            root.style.transform = 'scale(1)';
            root.style.transformOrigin = 'top left';
        }
        var zl = document.getElementById('zoomLevel');
        if (zl) zl.textContent = '100%';
        renderTable();
        updatePagination();
        var restored = false;
        var restore = function () {
            if (restored) return;
            restored = true;
            page = savedPage;
            pageSize = savedSize;
            zoom = savedZoom;
            if (root) {
                root.style.transform = 'scale(' + zoom + ')';
            }
            if (zl) zl.textContent = Math.round(zoom * 100) + '%';
            renderTable();
            updatePagination();
            window.removeEventListener('afterprint', restore);
        };
        window.addEventListener('afterprint', restore);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                window.print();
            });
        });
        window.setTimeout(function () {
            if (!restored) restore();
        }, 2500);
    }

    function init() {
        reportMeta = loadData();
        if (!reportMeta || !Array.isArray(reportMeta.rows)) {
            var tbody = document.getElementById('tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#dc3545;">No se encontraron datos del reporte</td></tr>';
            return;
        }
        currentMode = reportMeta.viewMode || 'detallado';
        rows = reportMeta.rows;
        document.getElementById('reportTipo').textContent = reportMeta.tipoReporte || reportMeta.tipoLabel || '-';
        if (isResumenMode()) {
            var citySource = (reportMeta.ciudadesSeleccionadas && reportMeta.ciudadesSeleccionadas.length)
                ? reportMeta.ciudadesSeleccionadas
                : [reportMeta.ciudad || ''];
            var cityLabels = citySource.map(function (cityCode) {
                var code = String(cityCode || '').trim().toUpperCase();
                if (!code) return '';
                var name = getCityNameByCode(code);
                return name ? (code + ' - ' + name.toUpperCase()) : code;
            }).filter(Boolean);
            document.getElementById('reportCiudad').textContent = cityLabels.join(', ');
            document.getElementById('reportMes').textContent = '-';
            document.getElementById('reportRango').textContent = '-';
        } else {
            document.getElementById('reportCiudad').textContent = reportMeta.ciudadNombre ? ((reportMeta.ciudad || '-') + ' - ' + reportMeta.ciudadNombre) : (reportMeta.ciudad || '-');
            document.getElementById('reportMes').textContent = reportMeta.mes || '-';
            document.getElementById('reportRango').textContent = formatDate(reportMeta.fechaInicio || '') + ' a ' + formatDate(reportMeta.fechaFin || '');
        }
        buildHeader();
        renderTable();
        renderResultadosResumen();
        updatePagination();
    }

    window.goFirst = function () { if (page > 1) { page = 1; renderTable(); updatePagination(); } };
    window.goPrevious = function () { if (page > 1) { page -= 1; renderTable(); updatePagination(); } };
    window.goNext = function () { var tp = Math.ceil(rows.length / pageSize) || 1; if (page < tp) { page += 1; renderTable(); updatePagination(); } };
    window.goLast = function () { var tp = Math.ceil(rows.length / pageSize) || 1; if (page !== tp) { page = tp; renderTable(); updatePagination(); } };
    window.goToPage = function (p) { var n = parseInt(p, 10) || 1; var tp = Math.ceil(rows.length / pageSize) || 1; if (n >= 1 && n <= tp) { page = n; renderTable(); updatePagination(); } };
    window.setZoom = function (delta) {
        zoom = Math.max(0.5, Math.min(2, zoom + delta));
        var root = document.getElementById('reportRoot');
        root.style.transform = 'scale(' + zoom + ')';
        root.style.transformOrigin = 'top left';
        document.getElementById('zoomLevel').textContent = Math.round(zoom * 100) + '%';
    };
    window.exportExcel = exportExcel;
    window.exportDOC = exportDOC;
    window.exportPDF = exportPDF;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
