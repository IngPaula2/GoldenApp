var rows = [];
var cols = [];
var currentPage = 1;
var rowsPerPage = 50;
var zoom = 1;

function loadMeta() {
    try {
        return JSON.parse(localStorage.getItem('contabilidadMigracionSiigoCartera') || '{}') || {};
    } catch (error) {
        return {};
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    var date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    return day + '/' + month + '/' + year;
}

function getColumns() {
    return [];
}

function buildHeader() {
    var thead = document.getElementById('thead');
    if (!thead) return;
    thead.innerHTML = '';
}

function renderTable() {
    var tbody = document.getElementById('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
}

function updatePagination() {
    var totalRows = rows.length;
    var pages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    if (currentPage > pages) currentPage = pages;
    document.getElementById('currentPage').value = currentPage;
    document.getElementById('totalPages').textContent = pages;
    document.getElementById('paginaActual').textContent = currentPage;
}

function buildTableHtmlForExport() {
    var headers = cols.map(function (column) {
        return '<th>' + column.label + '</th>';
    }).join('');
    var bodyRows = rows.map(function (row) {
        var tds = cols.map(function (column) {
            return '<td>' + (row[column.key] || '') + '</td>';
        }).join('');
        return '<tr>' + tds + '</tr>';
    }).join('');
    return '<table><thead><tr>' + headers + '</tr></thead><tbody>' + bodyRows + '</tbody></table>';
}

function exportExcel() {
    var html = buildTableHtmlForExport();
    var blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-migracion-siigo-cartera.xls';
    link.click();
    URL.revokeObjectURL(url);
}

function exportDOC() {
    var html = buildTableHtmlForExport();
    var blob = new Blob([html], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-migracion-siigo-cartera.doc';
    link.click();
    URL.revokeObjectURL(url);
}

function exportPDF() {
    window.print();
}

function goFirst() { currentPage = 1; updatePagination(); renderTable(); }
function goPrevious() { currentPage = Math.max(1, currentPage - 1); updatePagination(); renderTable(); }
function goNext() {
    var totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
    currentPage = Math.min(totalPages, currentPage + 1);
    updatePagination();
    renderTable();
}
function goLast() {
    currentPage = Math.max(1, Math.ceil(rows.length / rowsPerPage));
    updatePagination();
    renderTable();
}
function goToPage(page) {
    var totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
    currentPage = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);
    updatePagination();
    renderTable();
}

function setZoom(delta) {
    zoom = Math.max(0.5, Math.min(1.8, zoom + delta));
    document.getElementById('zoomLevel').textContent = Math.round(zoom * 100) + '%';
    document.getElementById('reportRoot').style.transform = 'scale(' + zoom + ')';
    document.getElementById('reportRoot').style.transformOrigin = 'top center';
}

function init() {
    var meta = loadMeta();
    var fechaInicio = formatDate(meta.fechaInicio);
    var fechaFin = formatDate(meta.fechaFin);
    var centroCostos = meta.centroCostos || '-';
    document.getElementById('reportRango').textContent = fechaInicio + ' a ' + fechaFin;
    document.getElementById('reportCentroCostos').textContent = centroCostos;

    cols = getColumns();
    buildHeader();
    renderTable();
    updatePagination();
}

document.addEventListener('DOMContentLoaded', init);
