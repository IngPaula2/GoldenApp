(function () {
    'use strict';

    var rows = [];
    var page = 1;
    var pageSize = 40;
    var zoom = 1;
    var meta = null;

    function loadMeta() {
        try {
            var raw = localStorage.getItem('contabilidadMigracionSiigoTesoreria');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function formatDate(value) {
        if (!value) return '-';
        var s = String(value).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            var p = s.split('-');
            return p[2] + '/' + p[1] + '/' + p[0];
        }
        return s;
    }

    function getColumns() {
        return [];
    }

    function buildHeader() {
        var thead = document.getElementById('thead');
        if (!thead) return;
        var cols = getColumns();
        if (!cols.length) {
            thead.innerHTML = '';
            return;
        }
        thead.innerHTML = '<tr>' + cols.map(function (c) { return '<th>' + c.label + '</th>'; }).join('') + '</tr>';
    }

    function renderTable() {
        var tbody = document.getElementById('tbody');
        if (!tbody) return;
        var cols = getColumns();
        tbody.innerHTML = '';
        if (!cols.length) {
            return;
        }
        if (!rows.length) {
            tbody.innerHTML = '';
            return;
        }
        var start = (page - 1) * pageSize;
        var end = Math.min(start + pageSize, rows.length);
        rows.slice(start, end).forEach(function (r) {
            var tr = document.createElement('tr');
            tr.innerHTML = cols.map(function (c) { return '<td>' + String(r[c.key] == null ? '' : r[c.key]) + '</td>'; }).join('');
            tbody.appendChild(tr);
        });
    }

    function updatePagination() {
        var totalPages = Math.ceil(rows.length / pageSize) || 1;
        var currentPage = document.getElementById('currentPage');
        var totalPagesEl = document.getElementById('totalPages');
        var paginaActual = document.getElementById('paginaActual');
        if (currentPage) currentPage.value = page;
        if (totalPagesEl) totalPagesEl.textContent = totalPages;
        if (paginaActual) paginaActual.textContent = page;
    }

    function buildTableHtmlForExport(allRows) {
        var cols = getColumns();
        if (!cols.length) return '<table border="1" cellspacing="0" cellpadding="4"></table>';
        var head = '<tr>' + cols.map(function (c) { return '<th>' + c.label + '</th>'; }).join('') + '</tr>';
        var body = allRows.map(function (r) {
            return '<tr>' + cols.map(function (c) { return '<td>' + String(r[c.key] == null ? '' : r[c.key]) + '</td>'; }).join('') + '</tr>';
        }).join('');
        return '<table border="1" cellspacing="0" cellpadding="4"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
    }

    function exportExcel() {
        var html = '<html><head><meta charset="utf-8"><title>Reporte Migración SIIGO - Tesorería</title></head><body>' +
            '<h3>REPORTE MIGRACIÓN SIIGO - TESORERÍA</h3>' + buildTableHtmlForExport(rows) + '</body></html>';
        var blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-migracion-siigo-tesoreria.xls';
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportDOC() {
        var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">' +
            '<head><meta charset="utf-8"><title>Reporte Migración SIIGO - Tesorería</title></head><body>' +
            '<h3>REPORTE MIGRACIÓN SIIGO - TESORERÍA</h3>' + buildTableHtmlForExport(rows) + '</body></html>';
        var blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-migracion-siigo-tesoreria.doc';
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportPDF() {
        window.print();
    }

    function init() {
        meta = loadMeta();
        var fechaInicio = meta && meta.fechaInicio ? meta.fechaInicio : '';
        var fechaFin = meta && meta.fechaFin ? meta.fechaFin : '';
        var rango = document.getElementById('reportRango');
        if (rango) rango.textContent = formatDate(fechaInicio) + ' a ' + formatDate(fechaFin);

        rows = [];

        buildHeader();
        renderTable();
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
        if (root) {
            root.style.transform = 'scale(' + zoom + ')';
            root.style.transformOrigin = 'top left';
        }
        var zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) zoomLevel.textContent = Math.round(zoom * 100) + '%';
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
