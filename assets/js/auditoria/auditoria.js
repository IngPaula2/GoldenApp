/**
 * 🔍 AUDITORÍA - GOLDEN APP
 *
 * Módulo de auditoría: Comisión, Bonos y Liquidación.
 * Parametriza porcentajes de liquidación y premios por cargo; conectado a Liquidación.
 *
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

(function () {
    'use strict';

    const SECTION_ATTR = 'data-auditoria-section';
    const SECTION_ACTIVE_CLASS = 'auditoria-section-active';
    const TOP_NAV_ACTIVE_CLASS = 'active';
    const STORAGE_COMISIONES = 'auditoria_comisiones';
    const STORAGE_BONOS = 'auditoria_bonos';
    var accionModalCtx = {
        onConfirm: null,
        onCancel: null,
        successMessage: '',
        successTitle: 'OPERACIÓN EXITOSA'
    };

    /** Lista base de cargos para dropdown */
    var CARGOS = [
        { id: 'EC', nombre: 'Ejecutivo de Cuenta' },
        { id: 'EA', nombre: 'Ejecutivo Admon' },
        { id: 'EP', nombre: 'Ejecutivo Prejuridico' },
        { id: 'EJ', nombre: 'Ejecutivo Juridico' },
        { id: 'SP', nombre: 'Supervisor de Cartera' },
        { id: 'SN', nombre: 'Supervisor Nacional de Cartera' },
        { id: 'V', nombre: 'Verificador' },
        { id: 'RF', nombre: 'Recaudo Filial' },
        { id: 'C', nombre: 'Castigo Cartera' },
        { id: 'PV', nombre: 'Proxima Vigencia' },
        { id: 'AS', nombre: 'Asesor' },
        { id: 'SU', nombre: 'Supervisor' },
        { id: 'SG', nombre: 'Sub Gerente' },
        { id: 'GT', nombre: 'Gerente' },
        { id: 'DR', nombre: 'Director' }
    ];

    function normalizarSeccionCargo(seccion) {
        var key = (seccion || '').toString().toLowerCase();
        if (key === 'administrativo') return 'administrativo';
        if (key === 'pyf') return 'pyf';
        if (key === 'servicio' || key === 'servicios') return 'servicio';
        return key;
    }

    function aplicarNombresCargosDesdeAdministrativo() {
        var nombresPorCodigo = {};

        function leerBucket(storageKey) {
            try {
                var raw = localStorage.getItem(storageKey);
                var data = raw ? JSON.parse(raw) : {};
                if (!data || typeof data !== 'object') return;
                Object.keys(data).forEach(function (codigoKey) {
                    var item = data[codigoKey] || {};
                    var codigo = (item.codigo || item.tId || codigoKey || '').toString().trim();
                    var nombre = (item.nombre || item.tNombre || '').toString().trim();
                    var seccion = normalizarSeccionCargo(item.seccion || item.bSeccion);
                    if (!codigo || !nombre) return;
                    // Evita sobrescribir con registros incompletos que guardan el código como nombre (ej: "V")
                    if (nombre.toUpperCase() === codigo.toUpperCase()) return;
                    if (seccion === 'administrativo') {
                        nombresPorCodigo[codigo] = nombre;
                    }
                });
            } catch (e) {
                // Silencioso: si hay datos inválidos se conserva lista base
            }
        }

        leerBucket('modifiedCargos');
        leerBucket('userCargos');

        CARGOS = CARGOS.map(function (cargo) {
            if (!nombresPorCodigo[cargo.id]) return cargo;
            return { id: cargo.id, nombre: nombresPorCodigo[cargo.id] };
        });
    }

    /** Etiquetas de tipos para comisión y bono */
    var TIPOS_COMISION = {
        cartera_personal: 'Cartera Personal (mín. 100 ctas)',
        verificador: 'Verificador',
        director_administrativo: 'Director Administrativo',
        supervisor_cartera: 'Supervisor Cartera',
        cartera_filial: 'Cartera de Filial',
        cartera_nacional: 'Cartera Nacional',
        prejuridicos_internos: 'Prejurídicos Internos',
        prejuridicos_externos: 'Prejurídicos Externos'
    };

    var TIPOS_BONO = {
        cartera_personal: 'Cartera Personal',
        cartera_filial: 'Cartera de Filial',
        cartera_nacional: 'Cartera Nacional',
        prejuridicos_internos: 'Prejurídicos Internos (monto)',
        bonos_concurso: 'Bonos concurso'
    };

    var MESES = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    var CARGOS_POR_TIPO_COMISION = {
        cartera_personal: ['EC'],
        verificador: ['V'],
        director_administrativo: ['DR'],
        supervisor_cartera: ['SP'],
        cartera_filial: ['DR', 'SP'],
        cartera_nacional: ['SN'],
        prejuridicos_internos: ['EP'],
        prejuridicos_externos: ['EJ']
    };

    var CARGOS_POR_TIPO_BONO = {
        cartera_personal: ['EC'],
        cartera_filial: ['DR', 'SP'],
        cartera_nacional: ['SN'],
        prejuridicos_internos: ['EP'],
        bonos_concurso: ['EC', 'SP', 'SN', 'V', 'DR', 'EP', 'EJ']
    };

    function initUserDropdown() {
        var userInfo = document.querySelector('.user-info');
        var dropdown = document.getElementById('userDropdown');
        var dropdownArrow = document.querySelector('.dropdown-arrow');
        var sidebar = document.querySelector('.sidebar');
        if (!userInfo || !dropdown) return;

        function closeDropdown() {
            dropdown.classList.remove('show');
            if (dropdownArrow) dropdownArrow.classList.remove('open');
            if (sidebar) sidebar.classList.remove('dropdown-open');
        }

        userInfo.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('show');
            if (dropdownArrow) dropdownArrow.classList.toggle('open');
            if (sidebar) sidebar.classList.toggle('dropdown-open');
        });

        document.addEventListener('click', function (e) {
            if (!userInfo.contains(e.target) && !dropdown.contains(e.target)) {
                closeDropdown();
            }
        });

        dropdown.addEventListener('click', function (e) {
            var item = e.target.closest('.dropdown-item');
            if (!item) return;
            e.preventDefault();
            e.stopPropagation();

            if (item.classList.contains('admin-users-item')) {
                window.location.href = '../administrativo/admin-empleados.html';
                return;
            }
            if (item.classList.contains('logout-item')) {
                closeDropdown();
                abrirConfirmacionAccion(
                    'CERRAR SESIÓN',
                    '¿Está seguro de que desea cerrar sesión?',
                    function () {
                        window.location.href = '/index.html';
                    },
                    '',
                    null,
                    ''
                );
                return;
            }
            closeDropdown();
        });
    }

    function plantillaComisiones() {
        return [
            {
                id: generarId(),
                tipo: 'cartera_personal',
                idCargo: 'EC',
                minimoCuentas: 100,
                porcentajeFijo: null,
                estado: true,
                rangosLiquidacion: [
                    { desde: 0, hasta: 84.99, porcentaje: 3 },
                    { desde: 85, hasta: 89.99, porcentaje: 3.5 },
                    { desde: 90, hasta: 93.99, porcentaje: 4 },
                    { desde: 94, hasta: 94.99, porcentaje: 4.5 },
                    { desde: 95, hasta: 97.99, porcentaje: 5 },
                    { desde: 98, hasta: 100, porcentaje: 5.5 }
                ],
                rangosMonto: []
            },
            {
                id: generarId(),
                tipo: 'verificador',
                idCargo: 'V',
                minimoCuentas: null,
                porcentajeFijo: null,
                estado: true,
                rangosLiquidacion: [
                    { desde: 0, hasta: 94.99, porcentaje: 3 },
                    { desde: 95, hasta: 100, porcentaje: 3.5 }
                ],
                rangosMonto: []
            },
            {
                id: generarId(),
                tipo: 'director_administrativo',
                idCargo: 'DR',
                minimoCuentas: null,
                porcentajeFijo: null,
                estado: true,
                rangosLiquidacion: [
                    { desde: 0, hasta: 94.99, porcentaje: 3 },
                    { desde: 95, hasta: 100, porcentaje: 3.5 }
                ],
                rangosMonto: []
            },
            {
                id: generarId(),
                tipo: 'supervisor_cartera',
                idCargo: 'SP',
                minimoCuentas: null,
                porcentajeFijo: null,
                estado: true,
                rangosLiquidacion: [
                    { desde: 0, hasta: 94.99, porcentaje: 3 },
                    { desde: 95, hasta: 100, porcentaje: 3.5 }
                ],
                rangosMonto: []
            },
            {
                id: generarId(),
                tipo: 'cartera_filial',
                idCargo: 'DR',
                minimoCuentas: null,
                porcentajeFijo: null,
                estado: true,
                rangosLiquidacion: [
                    { desde: 0, hasta: 94.99, porcentaje: 1 },
                    { desde: 95, hasta: 100, porcentaje: 1.5 }
                ],
                rangosMonto: []
            },
            {
                id: generarId(),
                tipo: 'cartera_filial',
                idCargo: 'SP',
                minimoCuentas: null,
                porcentajeFijo: null,
                estado: true,
                rangosLiquidacion: [
                    { desde: 0, hasta: 94.99, porcentaje: 1 },
                    { desde: 95, hasta: 100, porcentaje: 1.5 }
                ],
                rangosMonto: []
            },
            {
                id: generarId(),
                tipo: 'cartera_nacional',
                idCargo: 'SN',
                minimoCuentas: null,
                porcentajeFijo: 1,
                estado: true,
                rangosLiquidacion: [],
                rangosMonto: []
            },
            {
                id: generarId(),
                tipo: 'prejuridicos_internos',
                idCargo: 'EP',
                minimoCuentas: null,
                porcentajeFijo: null,
                estado: true,
                rangosLiquidacion: [],
                rangosMonto: [
                    { desde: 0, hasta: 10000000, porcentaje: 8 },
                    { desde: 10000001, hasta: null, porcentaje: 10 }
                ]
            },
            {
                id: generarId(),
                tipo: 'prejuridicos_externos',
                idCargo: 'EJ',
                minimoCuentas: null,
                porcentajeFijo: null,
                estado: true,
                rangosLiquidacion: [],
                rangosMonto: [
                    { desde: 0, hasta: 15000000, porcentaje: 12 },
                    { desde: 15000001, hasta: null, porcentaje: 15 }
                ]
            },
        ];
    }

    function plantillaBonos() {
        return [
            {
                id: generarId(),
                tipo: 'cartera_personal',
                idCargo: 'EC',
                criterio: 'porcentaje',
                estado: true,
                rangosPremios: [
                    { desde: 95, hasta: 95.99, valorBono: 250000 },
                    { desde: 96, hasta: 96.99, valorBono: 300000 },
                    { desde: 97, hasta: 97.99, valorBono: 350000 },
                    { desde: 98, hasta: 98.99, valorBono: 400000 },
                    { desde: 99, hasta: 100, valorBono: 500000 }
                ],
                esConcurso: false,
                mesesAutorizados: []
            },
            {
                id: generarId(),
                tipo: 'cartera_filial',
                idCargo: 'DR',
                criterio: 'porcentaje',
                estado: true,
                rangosPremios: [
                    { desde: 95, hasta: 95.99, valorBono: 200000 },
                    { desde: 96, hasta: 96.99, valorBono: 300000 },
                    { desde: 97, hasta: 97.99, valorBono: 400000 },
                    { desde: 98, hasta: 100, valorBono: 500000 }
                ],
                esConcurso: false,
                mesesAutorizados: []
            },
            {
                id: generarId(),
                tipo: 'cartera_filial',
                idCargo: 'SP',
                criterio: 'porcentaje',
                estado: true,
                rangosPremios: [
                    { desde: 95, hasta: 95.99, valorBono: 200000 },
                    { desde: 96, hasta: 96.99, valorBono: 300000 },
                    { desde: 97, hasta: 97.99, valorBono: 400000 },
                    { desde: 98, hasta: 100, valorBono: 500000 }
                ],
                esConcurso: false,
                mesesAutorizados: []
            },
            {
                id: generarId(),
                tipo: 'cartera_nacional',
                idCargo: 'SN',
                criterio: 'porcentaje',
                estado: true,
                rangosPremios: [
                    { desde: 97, hasta: 97.99, valorBono: 200000 },
                    { desde: 98, hasta: 98.99, valorBono: 300000 },
                    { desde: 99, hasta: 99.99, valorBono: 500000 },
                    { desde: 100, hasta: 100, valorBono: 700000 }
                ],
                esConcurso: false,
                mesesAutorizados: []
            },
            {
                id: generarId(),
                tipo: 'prejuridicos_internos',
                idCargo: 'EP',
                criterio: 'monto',
                estado: true,
                rangosPremios: [
                    { desde: 7000000, hasta: 7999999, valorBono: 150000 },
                    { desde: 8000000, hasta: 9999999, valorBono: 250000 },
                    { desde: 10000000, hasta: 11999999, valorBono: 350000 },
                    { desde: 12000000, hasta: null, valorBono: 450000 }
                ],
                esConcurso: false,
                mesesAutorizados: []
            }
        ];
    }

    function getComisiones() {
        try {
            var raw = localStorage.getItem(STORAGE_COMISIONES);
            var list = raw ? JSON.parse(raw) : [];
            return list.reduce(function (acc, c) {
                if (c.tipo === 'verificador_director_supervisor') {
                    if (c.idCargo === 'V') c.tipo = 'verificador';
                    else if (c.idCargo === 'DR') c.tipo = 'director_administrativo';
                    else if (c.idCargo === 'SP') c.tipo = 'supervisor_cartera';
                }
                if (c.tipo === 'empresas_cobranza') return acc;
                if (c.tipo === 'cartera_filial' && c.idCargo === 'RF') return acc;
                if (typeof c.estado !== 'boolean') c.estado = true;
                acc.push(c);
                return acc;
            }, []);
        } catch (e) {
            return [];
        }
    }

    function setComisiones(arr) {
        localStorage.setItem(STORAGE_COMISIONES, JSON.stringify(arr));
    }

    function getBonos() {
        try {
            var raw = localStorage.getItem(STORAGE_BONOS);
            var list = raw ? JSON.parse(raw) : [];
            return list.map(function (b) {
                if (typeof b.estado !== 'boolean') b.estado = true;
                return b;
            });
        } catch (e) {
            return [];
        }
    }

    function setBonos(arr) {
        localStorage.setItem(STORAGE_BONOS, JSON.stringify(arr));
    }

    function generarId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    }

    function inicializarPlantillasSiVacio() {
        // No autosembrar plantillas: si no hay datos, la UI muestra el estado vacío.
        if (localStorage.getItem(STORAGE_COMISIONES) == null) setComisiones([]);
        if (localStorage.getItem(STORAGE_BONOS) == null) setBonos([]);
    }

    function showSection(sectionId) {
        var sections = document.querySelectorAll('.auditoria-section');
        var links = document.querySelectorAll('.top-nav-link[data-auditoria-section]');
        sections.forEach(function (section) {
            var isTarget = section.getAttribute('id') === 'section-' + sectionId;
            section.classList.toggle(SECTION_ACTIVE_CLASS, isTarget);
        });
        links.forEach(function (link) {
            var isActive = link.getAttribute(SECTION_ATTR) === sectionId;
            var item = link.closest('.top-nav-item');
            if (item) item.classList.toggle(TOP_NAV_ACTIVE_CLASS, isActive);
        });
        if (typeof history !== 'undefined' && history.replaceState) {
            history.replaceState(null, '', '#' + sectionId);
        }
        if (sectionId === 'liquidacion' && !toCityCode(liquidacionState.selectedCity)) {
            showSelectCityModal();
        }
    }

    function getSectionFromHash() {
        var hash = (window.location.hash || '').replace(/^#/, '');
        var valid = ['comision', 'bonos', 'liquidacion'];
        return valid.indexOf(hash) >= 0 ? hash : 'comision';
    }

    function llenarSelectCargos(selectId, cargosPermitidos) {
        var sel = document.getElementById(selectId);
        if (!sel) return;
        sel.innerHTML = '<option value="">Seleccione cargo</option>';
        CARGOS.filter(function (c) {
            return !cargosPermitidos || cargosPermitidos.indexOf(c.id) >= 0;
        }).forEach(function (c) {
            var opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre;
            sel.appendChild(opt);
        });
    }

    function nombreCargo(idCargo) {
        var c = CARGOS.find(function (x) { return x.id === idCargo; });
        return c ? c.nombre : idCargo;
    }

    function resumenRangosLiquidacion(comision) {
        if (comision.porcentajeFijo != null && comision.porcentajeFijo !== '') {
            return comision.porcentajeFijo + '% fijo';
        }
        var rangos = comision.rangosLiquidacion || comision.rangosMonto || [];
        if (!rangos.length) return '-';
        return rangos.map(function (r) {
            var desde = r.desde != null ? r.desde : '...';
            var hasta = r.hasta != null ? r.hasta : '...';
            var pct = r.porcentaje != null ? r.porcentaje : '';
            return desde + '-' + hasta + ' → ' + pct + '%';
        }).join('; ');
    }

    function resumenRangosBono(bono) {
        var rangos = bono.rangosPremios || [];
        if (!rangos.length) return '-';
        var porPct = bono.criterio === 'monto' ? false : true;
        return rangos.map(function (r) {
            var desde = r.desde != null ? r.desde : '...';
            var hasta = r.hasta != null ? r.hasta : '...';
            var val = r.valorBono != null ? r.valorBono : '';
            return desde + '-' + hasta + ' → $' + val;
        }).join('; ');
    }

    function badgeEstado(isActivo) {
        return '<span class="badge ' + (isActivo ? 'badge-success' : 'badge-secondary') + '">' + (isActivo ? 'ACTIVO' : 'INACTIVO') + '</span>';
    }

    function toggleEstadoHtml(tipo, id, activo) {
        return '<label class="animated-toggle" title="' + (activo ? 'Desactivar' : 'Activar') + '">' +
            '<input type="checkbox" class="btn-toggle-' + tipo + '" data-id="' + id + '" ' + (activo ? 'checked' : '') + '>' +
            '<span class="toggle-slider"></span>' +
            '</label>';
    }

    function renderTablaComisiones() {
        var tbody = document.getElementById('tbodyComisiones');
        if (!tbody) return;
        var list = getComisiones();
        if (!list.length) {
            tbody.innerHTML = '<tr class="no-data-row"><td colspan="6" class="no-data-message"><div class="no-data-content"><i class="fas fa-percent"></i><p>No hay configuraciones de comisión</p><small>Use "Crear comisión" para definir porcentajes por cargo</small></div></td></tr>';
            return;
        }
        tbody.innerHTML = list.map(function (c) {
            var tipoLabel = TIPOS_COMISION[c.tipo] || c.tipo;
            var cargoLabel = nombreCargo(c.idCargo);
            var rangos = resumenRangosLiquidacion(c);
            var minCtas = c.minimoCuentas != null && c.minimoCuentas !== '' ? c.minimoCuentas : '-';
            return '<tr data-comision-id="' + c.id + '">' +
                '<td>' + escapeHtml(tipoLabel) + '</td>' +
                '<td>' + escapeHtml(cargoLabel) + '</td>' +
                '<td>' + escapeHtml(rangos) + '</td>' +
                '<td>' + escapeHtml(String(minCtas)) + '</td>' +
                '<td>' + badgeEstado(c.estado !== false) + '</td>' +
                '<td><button type="button" class="btn btn-small btn-editar-comision" data-id="' + c.id + '" title="Editar"><i class="fas fa-edit"></i></button> ' +
                toggleEstadoHtml('comision', c.id, c.estado !== false) + '</td></tr>';
        }).join('');
    }

    function renderTablaBonos() {
        var tbody = document.getElementById('tbodyBonos');
        var tbodyConcurso = document.getElementById('tbodyBonosConcurso');
        if (!tbody) return;
        var list = getBonos();
        var normales = list.filter(function (b) { return !b.esConcurso; });
        var concurso = list.filter(function (b) { return b.esConcurso; });

        if (!normales.length) {
            tbody.innerHTML = '<tr class="no-data-row"><td colspan="5" class="no-data-message"><div class="no-data-content"><i class="fas fa-gift"></i><p>No hay configuraciones de bonos</p><small>Use "Crear bono" para definir premios por cargo</small></div></td></tr>';
        } else {
            tbody.innerHTML = normales.map(function (b) {
                var tipoLabel = TIPOS_BONO[b.tipo] || b.tipo;
                var cargoLabel = nombreCargo(b.idCargo);
                var rangos = resumenRangosBono(b);
                return '<tr data-bono-id="' + b.id + '">' +
                    '<td>' + escapeHtml(tipoLabel) + '</td>' +
                    '<td>' + escapeHtml(cargoLabel) + '</td>' +
                    '<td>' + escapeHtml(rangos) + '</td>' +
                    '<td>' + badgeEstado(b.estado !== false) + '</td>' +
                    '<td><button type="button" class="btn btn-small btn-editar-bono" data-id="' + b.id + '" title="Editar"><i class="fas fa-edit"></i></button> ' +
                    toggleEstadoHtml('bono', b.id, b.estado !== false) + '</td></tr>';
            }).join('');
        }

        if (tbodyConcurso) {
            if (!concurso.length) {
                tbodyConcurso.innerHTML = '<tr class="no-data-row"><td colspan="5" class="no-data-message"><div class="no-data-content"><i class="fas fa-trophy"></i><p>No hay bonos concurso</p><small>Crear bono y marcar como "Bono concurso" con meses autorizados</small></div></td></tr>';
            } else {
                tbodyConcurso.innerHTML = concurso.map(function (b) {
                    var nombre = (TIPOS_BONO[b.tipo] || b.tipo) + ' / ' + nombreCargo(b.idCargo);
                    var rangos = resumenRangosBono(b);
                    var meses = (b.mesesAutorizados || []).map(function (m) { return MESES[m - 1] || m; }).join(', ') || '-';
                    return '<tr data-bono-id="' + b.id + '">' +
                        '<td>' + escapeHtml(nombre) + '</td>' +
                        '<td>' + escapeHtml(rangos) + '</td>' +
                        '<td>' + escapeHtml(meses) + '</td>' +
                        '<td>' + badgeEstado(b.estado !== false) + '</td>' +
                        '<td><button type="button" class="btn btn-small btn-editar-bono" data-id="' + b.id + '" title="Editar"><i class="fas fa-edit"></i></button> ' +
                        toggleEstadoHtml('bono', b.id, b.estado !== false) + '</td></tr>';
                }).join('');
            }
        }
    }

    function escapeHtml(s) {
        if (s == null) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function showNotification(message, type) {
        var notification = document.createElement('div');
        notification.className = 'notification notification-' + (type || 'info');
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(function () { notification.classList.add('show'); }, 100);
        setTimeout(function () {
            notification.classList.remove('show');
            setTimeout(function () {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 3000);
    }

    function abrirConfirmacionAccion(titulo, mensaje, onConfirm, successMessage, onCancel, successTitle) {
        var modal = document.getElementById('confirmActionAuditoriaModal');
        if (!modal) return;
        document.getElementById('confirmActionAuditoriaTitle').textContent = titulo || 'Confirmación';
        document.getElementById('confirmActionAuditoriaMessage').textContent = mensaje || '¿Está segur@ de continuar?';
        accionModalCtx.onConfirm = onConfirm || null;
        accionModalCtx.onCancel = onCancel || null;
        accionModalCtx.successMessage = successMessage || '';
        accionModalCtx.successTitle = successTitle || 'OPERACIÓN EXITOSA';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function cerrarConfirmacionAccion() {
        var modal = document.getElementById('confirmActionAuditoriaModal');
        if (modal) modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        if (typeof accionModalCtx.onCancel === 'function') accionModalCtx.onCancel();
        accionModalCtx.onCancel = null;
        accionModalCtx.onConfirm = null;
        accionModalCtx.successMessage = '';
        accionModalCtx.successTitle = 'OPERACIÓN EXITOSA';
    }

    function confirmarAccion() {
        var modal = document.getElementById('confirmActionAuditoriaModal');
        if (modal) modal.classList.remove('show');
        var ok = true;
        if (typeof accionModalCtx.onConfirm === 'function') ok = accionModalCtx.onConfirm() !== false;
        if (ok && accionModalCtx.successMessage) {
            mostrarExitoAccion(accionModalCtx.successMessage, accionModalCtx.successTitle);
            return;
        }
        document.body.style.overflow = 'auto';
    }

    function mostrarExitoAccion(mensaje, titulo) {
        var modal = document.getElementById('successActionAuditoriaModal');
        if (!modal) return;
        var titleEl = modal.querySelector('.modal-header h3');
        if (titleEl) titleEl.textContent = titulo || 'OPERACIÓN EXITOSA';
        document.getElementById('successActionAuditoriaMessage').textContent = mensaje || 'Operación realizada exitosamente.';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function cerrarExitoAccion() {
        var modal = document.getElementById('successActionAuditoriaModal');
        if (modal) modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        accionModalCtx.onCancel = null;
        accionModalCtx.onConfirm = null;
        accionModalCtx.successMessage = '';
        accionModalCtx.successTitle = 'OPERACIÓN EXITOSA';
    }

    // ---------- Modal Comisión ----------
    function tiposComisionConRangosPorcentaje() {
        return ['cartera_personal', 'verificador', 'director_administrativo', 'supervisor_cartera', 'cartera_filial'];
    }

    function tiposComisionConRangosMonto() {
        return ['prejuridicos_internos', 'prejuridicos_externos'];
    }

    function tiposComisionPorcentajeFijo() {
        return ['cartera_nacional'];
    }

    function actualizarVisibilidadComision() {
        var tipo = document.getElementById('comisionTipo').value;
        var minWrap = document.getElementById('comisionMinCuentasWrap');
        var pctFijoWrap = document.getElementById('comisionPorcentajeFijoWrap');
        var rangosWrap = document.getElementById('comisionRangosWrap');
        var rangosMontoWrap = document.getElementById('comisionRangosMontoWrap');
        var showRangosPct = tiposComisionConRangosPorcentaje().indexOf(tipo) >= 0;
        var showRangosMonto = tiposComisionConRangosMonto().indexOf(tipo) >= 0;

        minWrap.style.display = tipo === 'cartera_personal' ? 'block' : 'none';
        pctFijoWrap.style.display = tiposComisionPorcentajeFijo().indexOf(tipo) >= 0 ? 'block' : 'none';
        rangosWrap.style.display = showRangosPct ? 'block' : 'none';
        rangosMontoWrap.style.display = showRangosMonto ? 'block' : 'none';

        if (showRangosPct && document.getElementById('tbodyRangosComision').querySelectorAll('tr').length === 0) {
            agregarFilaRangoComision('tbodyRangosComision', false);
        }
        if (showRangosMonto && document.getElementById('tbodyRangosComisionMonto').querySelectorAll('tr').length === 0) {
            agregarFilaRangoComision('tbodyRangosComisionMonto', true);
        }
        var cargoActual = document.getElementById('comisionCargo').value;
        var permitidos = CARGOS_POR_TIPO_COMISION[tipo] || null;
        llenarSelectCargos('comisionCargo', permitidos);
        if (cargoActual && (!permitidos || permitidos.indexOf(cargoActual) >= 0)) {
            document.getElementById('comisionCargo').value = cargoActual;
        }
    }

    function agregarFilaRangoComision(tbodyId, esMonto) {
        var tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        var row = document.createElement('tr');
        if (esMonto) {
            row.innerHTML = '<td><input type="number" class="form-input rango-desde" placeholder="0" min="0" step="1"></td>' +
                '<td><input type="number" class="form-input rango-hasta" placeholder="Ej: 10000000" min="0" step="1"></td>' +
                '<td><div class="input-percent-wrap"><input type="text" class="form-input rango-porcentaje" placeholder="Ej: 8" inputmode="decimal"><span class="input-suffix">%</span></div></td>' +
                '<td><button type="button" class="btn-remove-row" aria-label="Quitar"><i class="fas fa-times"></i></button></td>';
        } else {
            row.innerHTML = '<td><div class="input-percent-wrap"><input type="text" class="form-input rango-desde" placeholder="Ej: 85" inputmode="decimal"><span class="input-suffix">%</span></div></td>' +
                '<td><div class="input-percent-wrap"><input type="text" class="form-input rango-hasta" placeholder="Ej: 89.99" inputmode="decimal"><span class="input-suffix">%</span></div></td>' +
                '<td><div class="input-percent-wrap"><input type="text" class="form-input rango-porcentaje" placeholder="Ej: 3.5" inputmode="decimal"><span class="input-suffix">%</span></div></td>' +
                '<td><button type="button" class="btn-remove-row" aria-label="Quitar"><i class="fas fa-times"></i></button></td>';
        }
        row.querySelectorAll('.rango-desde, .rango-hasta, .rango-porcentaje').forEach(function (input) {
            if (input && input.type === 'text') aplicarLimiteDecimalCincoDigitos(input);
        });
        row.querySelector('.btn-remove-row').addEventListener('click', function () {
            row.remove();
        });
        tbody.appendChild(row);
    }

    function limitarDecimalCincoDigitos(valor) {
        if (valor == null) return '';
        var clean = String(valor).replace(/\s+/g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
        if (!clean) return '';
        var parts = clean.split('.');
        var intPart = parts[0] || '';
        var decPart = parts.slice(1).join('');
        var digits = (intPart + decPart).replace(/\D/g, '').slice(0, 5);
        var intLen = Math.min(intPart.length, digits.length);
        var intOut = digits.slice(0, intLen);
        var decOut = digits.slice(intLen);
        var hadDot = clean.indexOf('.') >= 0;
        if (hadDot && (decOut.length > 0 || intOut.length > 0)) return intOut + '.' + decOut;
        return intOut;
    }

    function aplicarLimiteDecimalCincoDigitos(input) {
        if (!input || input.__limite5Applied) return;
        input.__limite5Applied = true;
        input.addEventListener('input', function () {
            var normalizado = limitarDecimalCincoDigitos(input.value);
            if (input.value !== normalizado) input.value = normalizado;
        });
    }

    function aplicarLimiteEnteroDigitos(input, maxDigitos) {
        if (!input || input.__limiteEnteroApplied) return;
        input.__limiteEnteroApplied = true;
        input.addEventListener('input', function () {
            var normalizado = normalizarEnteroConLimite(input.value, maxDigitos);
            if (input.value !== normalizado) input.value = normalizado;
        });
    }

    function normalizarEnteroConLimite(valor, maxDigitos) {
        if (valor == null) return '';
        var digitos = String(valor).replace(/\D/g, '');
        if (!digitos) return '';
        return digitos.slice(0, maxDigitos);
    }

    function formatearPesosConLimite(valor, maxDigitos) {
        var digitos = normalizarEnteroConLimite(valor, maxDigitos);
        if (!digitos) return '';
        return new Intl.NumberFormat('es-CO').format(parseInt(digitos, 10));
    }

    function aplicarFormatoPesosConLimite(input, maxDigitos) {
        if (!input || input.__pesosLimiteApplied) return;
        input.__pesosLimiteApplied = true;
        input.value = formatearPesosConLimite(input.value, maxDigitos);
        input.addEventListener('input', function () {
            var formateado = formatearPesosConLimite(input.value, maxDigitos);
            if (input.value !== formateado) input.value = formateado;
        });
    }

    function agregarFilaRangoBono(criterioMonto) {
        var tbody = document.getElementById('tbodyRangosBono');
        if (!tbody) return;
        var row = document.createElement('tr');
        var desdeLabel = criterioMonto ? 'Desde $' : 'Desde %';
        var hastaLabel = criterioMonto ? 'Hasta $' : 'Hasta %';
        if (criterioMonto) {
            row.innerHTML = '<td><div class="input-money-wrap"><input type="number" class="form-input rango-desde" placeholder="Desde $" min="0" step="1"><span class="input-suffix">$</span></div></td>' +
                '<td><div class="input-money-wrap"><input type="number" class="form-input rango-hasta" placeholder="Hasta $" min="0" step="1"><span class="input-suffix">$</span></div></td>' +
                '<td><div class="input-money-wrap"><input type="text" inputmode="numeric" class="form-input rango-valor-bono" placeholder="0"><span class="input-suffix">$</span></div></td>' +
                '<td><button type="button" class="btn-remove-row" aria-label="Quitar"><i class="fas fa-times"></i></button></td>';
        } else {
            row.innerHTML = '<td><div class="input-percent-wrap"><input type="number" class="form-input rango-desde" placeholder="Ej: 95" min="0" max="100" step="0.01"><span class="input-suffix">%</span></div></td>' +
                '<td><div class="input-percent-wrap"><input type="number" class="form-input rango-hasta" placeholder="Ej: 95.99" min="0" max="100" step="0.01"><span class="input-suffix">%</span></div></td>' +
                '<td><div class="input-money-wrap"><input type="text" inputmode="numeric" class="form-input rango-valor-bono" placeholder="0"><span class="input-suffix">$</span></div></td>' +
                '<td><button type="button" class="btn-remove-row" aria-label="Quitar"><i class="fas fa-times"></i></button></td>';
        }
        aplicarLimiteDecimalCincoDigitos(row.querySelector('.rango-desde'));
        aplicarLimiteDecimalCincoDigitos(row.querySelector('.rango-hasta'));
        aplicarFormatoPesosConLimite(row.querySelector('.rango-valor-bono'), 10);
        row.querySelector('.btn-remove-row').addEventListener('click', function () {
            row.remove();
        });
        tbody.appendChild(row);
    }

    function leerRangosComision(tbodyId) {
        var tbody = document.getElementById(tbodyId);
        if (!tbody) return [];
        var rows = tbody.querySelectorAll('tr');
        var out = [];
        rows.forEach(function (tr) {
            var desde = tr.querySelector('.rango-desde');
            var hasta = tr.querySelector('.rango-hasta');
            var pct = tr.querySelector('.rango-porcentaje');
            if (desde && hasta && pct) {
                out.push({
                    desde: parseDecimalInput(desde.value),
                    hasta: parseDecimalInput(hasta.value),
                    porcentaje: parseDecimalInput(pct.value)
                });
            }
        });
        return out;
    }

    function parseDecimalInput(value) {
        if (value == null) return null;
        var normalized = String(value).replace(/\s+/g, '').replace('%', '').replace(',', '.');
        if (normalized === '') return null;
        var parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function leerRangosBono() {
        var tbody = document.getElementById('tbodyRangosBono');
        if (!tbody) return [];
        var rows = tbody.querySelectorAll('tr');
        var out = [];
        rows.forEach(function (tr) {
            var desde = tr.querySelector('.rango-desde');
            var hasta = tr.querySelector('.rango-hasta');
            var val = tr.querySelector('.rango-valor-bono');
            if (desde && hasta && val) {
                var valorBonoNormalizado = normalizarEnteroConLimite(val.value, 10);
                out.push({
                    desde: desde.value.trim() === '' ? null : parseFloat(desde.value),
                    hasta: hasta.value.trim() === '' ? null : parseFloat(hasta.value),
                    valorBono: valorBonoNormalizado === '' ? null : parseInt(valorBonoNormalizado, 10)
                });
            }
        });
        return out;
    }

    function abrirModalComision(comisionId) {
        llenarSelectCargos('comisionCargo');
        document.getElementById('comisionIdEdit').value = comisionId || '';
        document.getElementById('modalComisionTitulo').textContent = comisionId ? 'ACTUALIZAR COMISIÓN' : 'CREAR COMISIÓN';
        document.getElementById('btnGuardarComision').textContent = comisionId ? 'Actualizar' : 'Crear';
        document.getElementById('comisionTipo').value = '';
        document.getElementById('comisionCargo').value = '';
        document.getElementById('comisionMinCuentas').value = '100';
        document.getElementById('comisionPorcentajeFijo').value = '';
        document.getElementById('tbodyRangosComision').innerHTML = '';
        document.getElementById('tbodyRangosComisionMonto').innerHTML = '';
        actualizarVisibilidadComision();

        if (comisionId) {
            var list = getComisiones();
            var c = list.find(function (x) { return x.id === comisionId; });
            if (c) {
                document.getElementById('comisionTipo').value = c.tipo;
                llenarSelectCargos('comisionCargo', CARGOS_POR_TIPO_COMISION[c.tipo] || null);
                document.getElementById('comisionCargo').value = c.idCargo;
                document.getElementById('comisionMinCuentas').value = c.minimoCuentas != null ? c.minimoCuentas : 100;
                document.getElementById('comisionPorcentajeFijo').value = c.porcentajeFijo != null ? c.porcentajeFijo : '';
                var rangos = c.rangosLiquidacion || [];
                rangos.forEach(function (r) {
                    agregarFilaRangoComision('tbodyRangosComision', false);
                    var rows = document.getElementById('tbodyRangosComision').querySelectorAll('tr');
                    var last = rows[rows.length - 1];
                    if (last) {
                        last.querySelector('.rango-desde').value = r.desde != null ? r.desde : '';
                        last.querySelector('.rango-hasta').value = r.hasta != null ? r.hasta : '';
                        last.querySelector('.rango-porcentaje').value = r.porcentaje != null ? r.porcentaje : '';
                    }
                });
                var rangosMonto = c.rangosMonto || [];
                rangosMonto.forEach(function (r) {
                    agregarFilaRangoComision('tbodyRangosComisionMonto', true);
                    var rows = document.getElementById('tbodyRangosComisionMonto').querySelectorAll('tr');
                    var last = rows[rows.length - 1];
                    if (last) {
                        last.querySelector('.rango-desde').value = r.desde != null ? r.desde : '';
                        last.querySelector('.rango-hasta').value = r.hasta != null ? r.hasta : '';
                        last.querySelector('.rango-porcentaje').value = r.porcentaje != null ? r.porcentaje : '';
                    }
                });
                actualizarVisibilidadComision();
            }
        } else {
            agregarFilaRangoComision('tbodyRangosComision', false);
        }

        document.getElementById('modalComision').classList.add('show');
    }

    function cerrarModalComision() {
        document.getElementById('modalComision').classList.remove('show');
    }

    function guardarComision() {
        var idEdit = document.getElementById('comisionIdEdit').value.trim();
        var tipo = document.getElementById('comisionTipo').value;
        var idCargo = document.getElementById('comisionCargo').value;
        if (!tipo || !idCargo) {
            showNotification('Seleccione tipo y cargo.', 'error');
            return false;
        }
        var minimoCuentas = null;
        if (tipo === 'cartera_personal') {
            var minVal = document.getElementById('comisionMinCuentas').value.trim();
            var minDigits = String(minVal || '').replace(/\D/g, '');
            if (minDigits.length > 10) {
                showNotification('El mínimo de cuentas permite máximo 10 dígitos.', 'error');
                return false;
            }
            minimoCuentas = minDigits === '' ? 100 : parseInt(minDigits, 10);
        }
        var porcentajeFijo = null;
        if (tiposComisionPorcentajeFijo().indexOf(tipo) >= 0) {
            var pctVal = document.getElementById('comisionPorcentajeFijo').value.trim();
            porcentajeFijo = parseDecimalInput(pctVal);
        }
        var rangosLiquidacion = [];
        var rangosMonto = [];
        if (tiposComisionConRangosPorcentaje().indexOf(tipo) >= 0) {
            rangosLiquidacion = leerRangosComision('tbodyRangosComision');
        }
        if (tiposComisionConRangosMonto().indexOf(tipo) >= 0) {
            rangosMonto = leerRangosComision('tbodyRangosComisionMonto');
        }

        var list = getComisiones();
        var estadoActual = true;
        if (idEdit) {
            var recEdit = list.find(function (x) { return x.id === idEdit; });
            if (recEdit) estadoActual = recEdit.estado !== false;
        }
        var rec = {
            id: idEdit || generarId(),
            tipo: tipo,
            idCargo: idCargo,
            minimoCuentas: minimoCuentas,
            porcentajeFijo: porcentajeFijo,
            rangosLiquidacion: rangosLiquidacion,
            rangosMonto: rangosMonto,
            estado: estadoActual
        };
        if (idEdit) {
            var idx = list.findIndex(function (x) { return x.id === idEdit; });
            if (idx >= 0) list[idx] = rec;
        } else {
            list.push(rec);
        }
        setComisiones(list);
        renderTablaComisiones();
        cerrarModalComision();
        return true;
    }

    function prepararGuardarComision() {
        var idEdit = document.getElementById('comisionIdEdit').value.trim();
        var titulo = idEdit ? 'ACTUALIZAR COMISIÓN' : 'CREAR COMISIÓN';
        var mensaje = idEdit
            ? '¿Está segur@ de que desea actualizar esta comisión?'
            : '¿Está segur@ de que desea crear esta comisión?';
        var exito = idEdit
            ? 'La comisión se actualizó exitosamente.'
            : 'La comisión se creó exitosamente.';
        abrirConfirmacionAccion(titulo, mensaje, guardarComision, exito, null, 'ÉXITO');
    }

    // ---------- Modal Bono ----------
    function renderMesesCheckboxes() {
        var wrap = document.getElementById('bonoMesesAutorizados');
        if (!wrap) return;
        wrap.innerHTML = '';
        for (var i = 1; i <= 12; i++) {
            var label = document.createElement('label');
            label.innerHTML = '<input type="checkbox" class="mes-month" value="' + i + '"> ' + MESES[i - 1];
            wrap.appendChild(label);
        }
    }

    function actualizarLabelRangosBono() {
        var criterioMonto = document.querySelector('input[name="bonoCriterio"]:checked') &&
            document.querySelector('input[name="bonoCriterio"]:checked').value === 'monto';
        document.getElementById('labelRangosBono').textContent = criterioMonto ? 'Rangos por monto ($) → Valor bono ($)' : 'Rangos por % recaudo → Valor bono ($)';
        document.getElementById('thBonoDesde').textContent = criterioMonto ? 'Desde $' : 'Desde %';
        document.getElementById('thBonoHasta').textContent = criterioMonto ? 'Hasta $' : 'Hasta %';
    }

    function abrirModalBono(bonoId) {
        llenarSelectCargos('bonoCargo');
        renderMesesCheckboxes();
        document.getElementById('bonoIdEdit').value = bonoId || '';
        document.getElementById('modalBonoTitulo').textContent = bonoId ? 'ACTUALIZAR BONO' : 'CREAR BONO';
        document.getElementById('btnGuardarBono').textContent = bonoId ? 'Actualizar' : 'Crear';
        document.getElementById('bonoTipo').value = '';
        document.getElementById('bonoCargo').value = '';
        document.querySelector('input[name="bonoCriterio"][value="porcentaje"]').checked = true;
        document.getElementById('bonoEsConcurso').checked = false;
        document.getElementById('bonoMesesWrap').style.display = 'none';
        document.getElementById('tbodyRangosBono').innerHTML = '';
        actualizarLabelRangosBono();

        if (bonoId) {
            var list = getBonos();
            var b = list.find(function (x) { return x.id === bonoId; });
            if (b) {
                document.getElementById('bonoTipo').value = b.tipo;
                llenarSelectCargos('bonoCargo', CARGOS_POR_TIPO_BONO[b.tipo] || null);
                document.getElementById('bonoCargo').value = b.idCargo;
                if (b.criterio === 'monto') document.querySelector('input[name="bonoCriterio"][value="monto"]').checked = true;
                document.getElementById('bonoEsConcurso').checked = !!b.esConcurso;
                document.getElementById('bonoMesesWrap').style.display = b.esConcurso ? 'block' : 'none';
                (b.mesesAutorizados || []).forEach(function (m) {
                    var cb = document.querySelector('.mes-month[value="' + m + '"]');
                    if (cb) cb.checked = true;
                });
                (b.rangosPremios || []).forEach(function (r) {
                    agregarFilaRangoBono(b.criterio === 'monto');
                    var rows = document.getElementById('tbodyRangosBono').querySelectorAll('tr');
                    var last = rows[rows.length - 1];
                    if (last) {
                        last.querySelector('.rango-desde').value = r.desde != null ? r.desde : '';
                        last.querySelector('.rango-hasta').value = r.hasta != null ? r.hasta : '';
                        last.querySelector('.rango-valor-bono').value = r.valorBono != null
                            ? formatearPesosConLimite(r.valorBono, 10)
                            : '';
                    }
                });
                actualizarLabelRangosBono();
            }
        } else {
            agregarFilaRangoBono(false);
        }

        document.getElementById('modalBono').classList.add('show');
    }

    function cerrarModalBono() {
        document.getElementById('modalBono').classList.remove('show');
    }

    function guardarBono() {
        var idEdit = document.getElementById('bonoIdEdit').value.trim();
        var tipo = document.getElementById('bonoTipo').value;
        var idCargo = document.getElementById('bonoCargo').value;
        if (!tipo || !idCargo) {
            showNotification('Seleccione tipo y cargo.', 'error');
            return false;
        }
        var criterio = document.querySelector('input[name="bonoCriterio"]:checked');
        criterio = criterio ? criterio.value : 'porcentaje';
        var esConcurso = document.getElementById('bonoEsConcurso').checked;
        var mesesAutorizados = [];
        if (esConcurso) {
            document.querySelectorAll('.mes-month:checked').forEach(function (cb) {
                mesesAutorizados.push(parseInt(cb.value, 10));
            });
        }
        var rangosPremios = leerRangosBono();

        var list = getBonos();
        var estadoActual = true;
        if (idEdit) {
            var recEdit = list.find(function (x) { return x.id === idEdit; });
            if (recEdit) estadoActual = recEdit.estado !== false;
        }
        var rec = {
            id: idEdit || generarId(),
            tipo: tipo,
            idCargo: idCargo,
            criterio: criterio,
            rangosPremios: rangosPremios,
            esConcurso: esConcurso,
            mesesAutorizados: mesesAutorizados,
            estado: estadoActual
        };
        if (idEdit) {
            var idx = list.findIndex(function (x) { return x.id === idEdit; });
            if (idx >= 0) list[idx] = rec;
        } else {
            list.push(rec);
        }
        setBonos(list);
        renderTablaBonos();
        cerrarModalBono();
        return true;
    }

    function prepararGuardarBono() {
        var idEdit = document.getElementById('bonoIdEdit').value.trim();
        var titulo = idEdit ? 'ACTUALIZAR BONO' : 'CREAR BONO';
        var mensaje = idEdit
            ? '¿Está segur@ de que desea actualizar este bono?'
            : '¿Está segur@ de que desea crear este bono?';
        var exito = idEdit
            ? 'El bono se actualizó exitosamente.'
            : 'El bono se creó exitosamente.';
        abrirConfirmacionAccion(titulo, mensaje, guardarBono, exito, null, 'ÉXITO');
    }

    function actualizarCargosPorTipoBono() {
        var tipo = document.getElementById('bonoTipo').value;
        var permitidos = CARGOS_POR_TIPO_BONO[tipo] || null;
        var actual = document.getElementById('bonoCargo').value;
        llenarSelectCargos('bonoCargo', permitidos);
        if (actual && (!permitidos || permitidos.indexOf(actual) >= 0)) {
            document.getElementById('bonoCargo').value = actual;
        }
    }

    function toggleEstadoComision(id, checked) {
        var list = getComisiones();
        var rec = list.find(function (x) { return x.id === id; });
        if (!rec) return;
        rec.estado = !!checked;
        setComisiones(list);
        renderTablaComisiones();
    }

    function toggleEstadoBono(id, checked) {
        var list = getBonos();
        var rec = list.find(function (x) { return x.id === id; });
        if (!rec) return;
        rec.estado = !!checked;
        setBonos(list);
        renderTablaBonos();
    }

    function solicitarToggleEstado(tipo, id, checked) {
        var esComision = tipo === 'comision';
        var titulo = 'CONFIRMACIÓN';
        var mensaje = checked
            ? '¿Está segur@ de que desea activar este registro?'
            : '¿Está segur@ de que desea inactivar este registro?';
        var exito = checked
            ? 'Estado actualizado a ACTIVO exitosamente.'
            : 'Estado actualizado a INACTIVO exitosamente.';
        abrirConfirmacionAccion(
            titulo,
            mensaje,
            function () {
                if (esComision) {
                    toggleEstadoComision(id, checked);
                } else {
                    toggleEstadoBono(id, checked);
                }
            },
            exito,
            function () {
                if (esComision) {
                    renderTablaComisiones();
                } else {
                    renderTablaBonos();
                }
            },
            'ÉXITO'
        );
    }

    // ---------- Liquidación EC (flujo tipo nómina + cálculo) ----------
    var STORAGE_LIQ_HIST = 'auditoria_liquidaciones_ec';
    var STORAGE_LIQ_CFG = 'auditoria_liquidacion_ec_config';
    var liquidacionState = {
        historico: [],
        selectedId: '',
        selectedLiquidacion: null,
        selectedCity: '',
        filtros: {
            mes: '',
            fechaInicio: '',
            fechaFin: ''
        }
    };

    function parseJsonSafe(raw, fallback) {
        try {
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function toNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (value == null) return 0;
        var parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function parseDateSafe(value) {
        if (!value) return null;
        var d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function formatMoney(value) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(toNumber(value));
    }

    function formatDateLabel(value) {
        var d = parseDateSafe(value);
        if (!d) return '-';
        return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getFullYear()).slice(-2);
    }

    function isoDateLabel(value) {
        var d = parseDateSafe(value);
        if (!d) return '';
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function formatPoints(value) {
        return toNumber(value).toFixed(3);
    }

    function toCityCode(value) {
        return String(value || '').trim().toUpperCase();
    }

    function getSelectedCityCode() {
        try {
            return toCityCode(sessionStorage.getItem('selectedCity') || '');
        } catch (e) {
            return '';
        }
    }

    function getCityNameByCode(cityCode) {
        var code = toCityCode(cityCode);
        if (!code) return '';
        try {
            var data = parseJsonSafe(localStorage.getItem('ciudadesData'), {});
            var city = data && data[code] ? data[code] : null;
            return city && city.nombre ? String(city.nombre) : '';
        } catch (e) {
            return '';
        }
    }

    function getCiudadesActivas() {
        var data = parseJsonSafe(localStorage.getItem('ciudadesData'), {});
        if (!data || typeof data !== 'object') return [];
        return Object.values(data)
            .filter(function (c) { return c && c.codigo && c.activo !== false; })
            .map(function (c) {
                return {
                    codigo: toCityCode(c.codigo),
                    nombre: String(c.nombre || '').trim()
                };
            })
            .sort(function (a, b) { return String(a.codigo).localeCompare(String(b.codigo)); });
    }

    function getTitularNombreByCity(cityCode, holderId) {
        var city = toCityCode(cityCode);
        var id = String(holderId || '').trim();
        if (!city || !id) return '';
        try {
            var raw = localStorage.getItem('titularesByCity');
            var data = raw ? JSON.parse(raw) : {};
            var bucket = data && data[city] ? data[city] : {};
            var titular = bucket[id];
            if (!titular) return '';
            return [
                titular.apellido1 || '',
                titular.apellido2 || '',
                titular.nombre1 || '',
                titular.nombre2 || ''
            ].join(' ').replace(/\s+/g, ' ').trim().toUpperCase();
        } catch (e) {
            return '';
        }
    }

    function getExecutiveNameByCityAndId(cityCode, executiveId) {
        var city = toCityCode(cityCode);
        var id = normalizeExecutiveId(executiveId);
        if (!city || !id) return '';
        try {
            var raw = localStorage.getItem('empleadosByCity');
            var data = raw ? JSON.parse(raw) : {};
            var bucket = data && data[city] ? data[city] : {};
            var emp = bucket[id] || null;
            if (!emp) {
                Object.keys(bucket).some(function (k) {
                    var candidate = bucket[k] || {};
                    var candidateId = normalizeExecutiveId(candidate.identificacion || k);
                    if (candidateId === id) {
                        emp = candidate;
                        return true;
                    }
                    return false;
                });
            }
            if (!emp) return '';
            return [
                emp.tPrimerApellido || emp.primerApellido || '',
                emp.tSegundoApellido || emp.segundoApellido || '',
                emp.tPrimerNombre || emp.primerNombre || '',
                emp.tSegundoNombre || emp.segundoNombre || ''
            ].join(' ').replace(/\s+/g, ' ').trim().toUpperCase();
        } catch (e) {
            return '';
        }
    }

    function updateCurrentCityName(cityCode) {
        var el = document.getElementById('currentCityName');
        if (!el) return;
        var code = toCityCode(cityCode);
        if (!code) {
            el.textContent = 'Seleccione una ciudad';
            return;
        }
        var name = getCityNameByCode(code);
        el.textContent = name ? (code + ' - ' + String(name).toUpperCase()) : code;
    }

    function updateCurrentCityLabel(cityCode) {
        updateCurrentCityName(cityCode);
    }

    function updateChangeCityButtonVisibility() {
        var changeCityButton = document.getElementById('changeCityButton');
        var city = getSelectedCityCode();
        if (changeCityButton) {
            changeCityButton.style.display = city ? 'inline-flex' : 'none';
        }
    }

    function populateCitySelectOptions() {
        var citySelect = document.getElementById('citySelect');
        if (!citySelect) return;
        var ciudadesData = parseJsonSafe(localStorage.getItem('ciudadesData'), {});
        citySelect.innerHTML = '<option value="">Seleccione la ciudad</option>';
        Object.values(ciudadesData || {})
            .filter(function (c) { return c && c.codigo && c.activo !== false; })
            .sort(function (a, b) { return String(a.codigo).localeCompare(String(b.codigo)); })
            .forEach(function (c) {
                var option = document.createElement('option');
                var code = toCityCode(c.codigo);
                option.value = code;
                option.textContent = code + ' - ' + String(c.nombre || '').toUpperCase();
                citySelect.appendChild(option);
            });
    }

    function showSelectCityModal() {
        var modal = document.getElementById('selectCityModal');
        if (!modal) {
            showNotification('Error: No se encontró el modal de selección de ciudad', 'error');
            return;
        }
        populateCitySelectOptions();
        var selected = getSelectedCityCode();
        var citySelect = document.getElementById('citySelect');
        if (citySelect) citySelect.value = selected || '';
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';
        modal.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';
        setTimeout(function () {
            if (citySelect) citySelect.focus();
        }, 100);
    }

    function hideSelectCityModal(force) {
        var modal = document.getElementById('selectCityModal');
        if (!modal) return;
        if (!force && !liquidacionState.selectedCity) return;
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function handleSelectCity() {
        var citySelect = document.getElementById('citySelect');
        var selectedCity = citySelect ? toCityCode(citySelect.value) : '';
        if (!selectedCity) {
            showNotification('Por favor, seleccione una ciudad', 'warning');
            return;
        }
        try {
            sessionStorage.setItem('selectedCity', selectedCity);
        } catch (e) {
            // No-op
        }
        liquidacionState.selectedCity = selectedCity;
        updateCurrentCityName(selectedCity);
        updateChangeCityButtonVisibility();
        ensureSelectedLiquidacionDisponible();
        hideSelectCityModal(true);
        renderHistoricoLiquidaciones();
        renderLiquidacionSeleccionada();
        toggleLiquidacionView(false);
        showNotification('Ciudad seleccionada: ' + (getCityNameByCode(selectedCity) ? (selectedCity + ' - ' + getCityNameByCode(selectedCity)) : selectedCity), 'success');
    }

    function openSelectCityModal() {
        showSelectCityModal();
    }

    function closeSelectCityModal(force) {
        hideSelectCityModal(force);
    }

    function applySelectedCity() {
        handleSelectCity();
    }

    function normalizeExecutiveId(value) {
        return String(value || '').trim().toUpperCase();
    }

    function inDateRange(value, start, end) {
        if (!start && !end) return true;
        var d = parseDateSafe(value);
        if (!d) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
    }

    function generarIdLiquidacion() {
        return 'liq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    }

    function obtenerNombreTipoLiquidacion(tipo) {
        if (tipo === 'por_filial') return 'Ejecutivo de Cuenta - por filial';
        if (tipo === 'prejuridico') return 'Pre jurídico - nacional';
        if (tipo === 'casas_externas') return 'Casas cobranzas externas - nacional';
        return 'Ejecutivo de Cuenta - por ejecutivo';
    }

    function leerAssignmentsByCity() {
        var data = parseJsonSafe(localStorage.getItem('assignmentsByCity'), {});
        return data && typeof data === 'object' ? data : {};
    }

    function leerInvoicesByCity() {
        var data = parseJsonSafe(localStorage.getItem('invoicesByCity'), {});
        return data && typeof data === 'object' ? data : {};
    }

    function leerFilialesCreadas() {
        var data = parseJsonSafe(localStorage.getItem('filialesData'), {});
        if (!data || typeof data !== 'object') return [];
        return Object.keys(data).map(function (k) { return data[k]; })
            .filter(function (f) { return f && f.codigo; })
            .map(function (f) {
                return {
                    codigo: toCityCode(f.codigo),
                    nombre: String(f.nombre || '').trim(),
                    ciudad: toCityCode(f.ciudad),
                    activo: f.activo !== false
                };
            });
    }

    function getFilialesDisponibles() {
        var city = toCityCode(liquidacionState.selectedCity);
        return leerFilialesCreadas()
            .filter(function (f) {
                if (!f.activo) return false;
                if (!city) return true;
                return toCityCode(f.ciudad) === city;
            })
            .sort(function (a, b) {
                return String(a.codigo).localeCompare(String(b.codigo));
            });
    }

    function populateFilialCreateSelect() {
        var select = document.getElementById('liqCreateFilial');
        if (!select) return;
        var filiales = getFilialesDisponibles();
        select.innerHTML = '<option value="">Seleccione la filial</option>';
        filiales.forEach(function (f) {
            var option = document.createElement('option');
            option.value = f.codigo;
            option.textContent = f.nombre ? (f.codigo + ' - ' + f.nombre.toUpperCase()) : f.codigo;
            select.appendChild(option);
        });
    }

    function leerIngresosPorCiudad() {
        var out = {};
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key) continue;
            if (key.indexOf('ingresosCaja_') === 0) {
                var cityCaja = toCityCode(key.replace('ingresosCaja_', ''));
                var cajaRaw = parseJsonSafe(localStorage.getItem(key), []);
                var cajaArr = Array.isArray(cajaRaw) ? cajaRaw : Object.values(cajaRaw || {});
                if (!out[cityCaja]) out[cityCaja] = [];
                cajaArr.forEach(function (item) {
                    out[cityCaja].push({
                        city: cityCaja,
                        source: 'caja',
                        date: item.fecha || item.date || item.fechaHoy || '',
                        invoiceNumber: String(item.invoiceNumber || item.factura || '').trim().toUpperCase(),
                        executiveId: normalizeExecutiveId(item.executiveId || item.ejecutivo || ''),
                        tipoIngreso: String(item.tipoIngresoCodigo || item.tipoIngreso || 'CAJA').trim().toUpperCase(),
                        amount: toNumber(item.valor || item.valorCobrado || item.value || item.monto),
                        ingresoRef: String(item.ingreso || item.numeroIngreso || item.consecutivo || item.numero || item.id || '').trim(),
                        reciboRef: String(item.recibo || item.numeroRecibo || item.ro || '').trim()
                    });
                });
            }
            if (key.indexOf('bankInflowData_') === 0) {
                var cityBanco = toCityCode(key.replace('bankInflowData_', ''));
                var bancoRaw = parseJsonSafe(localStorage.getItem(key), []);
                var bancoArr = Array.isArray(bancoRaw) ? bancoRaw : Object.values(bancoRaw || {});
                if (!out[cityBanco]) out[cityBanco] = [];
                bancoArr.forEach(function (item) {
                    var payload = item && item.cashInflowData ? parseJsonSafe(item.cashInflowData, item) : item;
                    out[cityBanco].push({
                        city: cityBanco,
                        source: 'banco',
                        date: item.fechaDocumento || item.fechaHoy || payload.fecha || payload.date || '',
                        invoiceNumber: String(payload.invoiceNumber || payload.factura || '').trim().toUpperCase(),
                        executiveId: normalizeExecutiveId(payload.executiveId || payload.ejecutivo || ''),
                        tipoIngreso: String(payload.tipoIngresoCodigo || payload.tipoIngreso || 'BANCO').trim().toUpperCase(),
                        amount: toNumber(payload.valor || payload.valorCobrado || payload.value || payload.monto),
                        ingresoRef: String(payload.ingreso || payload.numeroIngreso || payload.consecutivo || payload.numero || payload.id || '').trim(),
                        reciboRef: String(payload.recibo || payload.numeroRecibo || payload.ro || '').trim()
                    });
                });
            }
        }
        return out;
    }

    function buildIngresosDetalleIndex(ingresosByCity, startDate, endDate) {
        var index = {};
        Object.keys(ingresosByCity || {}).forEach(function (city) {
            (ingresosByCity[city] || []).forEach(function (ing) {
                if (!inDateRange(ing.date, startDate, endDate)) return;
                var exec = normalizeExecutiveId(ing.executiveId || '');
                var invoice = String(ing.invoiceNumber || '').trim().toUpperCase();
                if (!exec || !invoice) return;
                var key = [city, exec, invoice].join('|').toUpperCase();
                if (!index[key]) {
                    index[key] = {
                        total: 0,
                        tipos: {},
                        fechaUltima: '',
                        ingresoRef: '',
                        reciboRef: ''
                    };
                }
                index[key].total += toNumber(ing.amount);
                var tipo = String(ing.tipoIngreso || ing.source || '-').trim().toUpperCase();
                if (tipo) index[key].tipos[tipo] = true;
                if (ing.ingresoRef) index[key].ingresoRef = String(ing.ingresoRef).trim();
                if (ing.reciboRef) index[key].reciboRef = String(ing.reciboRef).trim();
                var prev = parseDateSafe(index[key].fechaUltima);
                var cur = parseDateSafe(ing.date);
                if (cur && (!prev || cur > prev)) index[key].fechaUltima = ing.date;
            });
        });
        return index;
    }

    function leerCarteraHistoryPorCiudadTitular() {
        var out = {};
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key || key.indexOf('carteraHistory_') !== 0) continue;
            var suffix = key.replace('carteraHistory_', '');
            var parts = suffix.split('_');
            if (parts.length < 2) continue;
            var city = toCityCode(parts.shift());
            var holderId = parts.join('_');
            var recordsRaw = parseJsonSafe(localStorage.getItem(key), []);
            var records = Array.isArray(recordsRaw) ? recordsRaw : [];
            if (!out[city]) out[city] = {};
            out[city][holderId] = records.map(function (r) {
                return {
                    factura: String(r.factura || r.invoiceNumber || '').trim().toUpperCase(),
                    cuota: String(r.cuota || '').trim(),
                    valor: toNumber(r.valor),
                    valorpago: toNumber(r.valorpago),
                    cancelado: String(r.cancelado || '').trim().toUpperCase(),
                    fechapago: r.fechapago || r.fecha || '',
                    ejecutivo: String(r.ejecutivo || '').trim()
                };
            });
        }
        return out;
    }

    function leerRegistrosCarteraGlobal() {
        var out = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key || key.indexOf('carteraHistory_') !== 0) continue;
            var suffix = key.replace('carteraHistory_', '');
            var parts = suffix.split('_');
            if (parts.length < 2) continue;
            var city = toCityCode(parts.shift());
            var recordsRaw = parseJsonSafe(localStorage.getItem(key), []);
            var records = Array.isArray(recordsRaw) ? recordsRaw : [];
            records.forEach(function (r) {
                var factura = String(r.factura || r.invoiceNumber || '').trim().toUpperCase();
                var cuota = String(r.cuota || '').trim();
                var ejecutivo = normalizeExecutiveId(r.ejecutivo || r.executiveId || '');
                if (!factura || !cuota || !ejecutivo) return;
                out.push({
                    id: r.id || ('cartera_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
                    city: toCityCode(r.codciudad || city),
                    executiveId: ejecutivo,
                    holderId: String(r.identifica || r.holderId || '').trim(),
                    factura: factura,
                    cuota: cuota,
                    tipoIngreso: String(r.tipoingres || '').trim(),
                    valor: toNumber(r.valor),
                    valorPago: toNumber(r.valorpago),
                    fechaPago: r.fechapago || r.fecha || '',
                    cancelado: String(r.cancelado || '').trim().toUpperCase()
                });
            });
        }
        return out;
    }

    function leerHistoricoLiquidaciones() {
        var list = parseJsonSafe(localStorage.getItem(STORAGE_LIQ_HIST), []);
        return Array.isArray(list) ? list : [];
    }

    function setHistoricoLiquidaciones(list) {
        localStorage.setItem(STORAGE_LIQ_HIST, JSON.stringify(list));
    }

    function guardarConfigLiquidacion(cfg) {
        localStorage.setItem(STORAGE_LIQ_CFG, JSON.stringify(cfg || {}));
    }

    function leerConfigLiquidacion() {
        var cfg = parseJsonSafe(localStorage.getItem(STORAGE_LIQ_CFG), {});
        return cfg && typeof cfg === 'object' ? cfg : {};
    }

    function buildInvoiceMetaMap(invoicesByCity) {
        var map = {};
        Object.keys(invoicesByCity || {}).forEach(function (cityKey) {
            var city = toCityCode(cityKey);
            var invoices = Array.isArray(invoicesByCity[cityKey]) ? invoicesByCity[cityKey] : [];
            if (!map[city]) map[city] = {};
            invoices.forEach(function (inv) {
                var invoiceNumber = String(inv.invoiceNumber || inv.factura || inv.numero || '').trim().toUpperCase();
                if (!invoiceNumber) return;
                var cuotaMes = toNumber(inv.valorCuota || inv.mensualidad || inv.cuota || inv.valorcuota || inv.valorCuotaMes);
                var valorAsignado = toNumber(inv.value || inv.valor || inv.total || inv.valorFactura);
                map[city][invoiceNumber] = {
                    holderId: String(inv.clientId || inv.identificacion || inv.titularId || inv.holderId || '').trim(),
                    cuotaMes: cuotaMes > 0 ? cuotaMes : 0,
                    valorAsignado: valorAsignado
                };
            });
        });
        return map;
    }

    function buildIngresosInvoiceIndex(ingresosByCity, startDate, endDate) {
        var index = {};
        Object.keys(ingresosByCity).forEach(function (city) {
            if (!index[city]) index[city] = {};
            ingresosByCity[city].forEach(function (ing) {
                if (!inDateRange(ing.date, startDate, endDate)) return;
                if (!ing.invoiceNumber) return;
                var amount = toNumber(ing.amount);
                if (amount <= 0) return;
                index[city][ing.invoiceNumber] = (index[city][ing.invoiceNumber] || 0) + amount;
            });
        });
        return index;
    }

    function getPendingFromCartera(carteraRecords, invoiceNumber, endDate) {
        if (!Array.isArray(carteraRecords)) return { pendiente: 0, cuotaMesFromHistory: 0 };
        var pending = 0;
        var cuotaMesFromHistory = 0;
        carteraRecords.forEach(function (r) {
            if (invoiceNumber && String(r.factura || '').trim().toUpperCase() !== invoiceNumber) return;
            if (endDate && r.fechapago && parseDateSafe(r.fechapago) && parseDateSafe(r.fechapago) > endDate) return;
            var valor = toNumber(r.valor);
            var pago = toNumber(r.valorpago);
            if (valor > cuotaMesFromHistory) cuotaMesFromHistory = valor;
            if (String(r.cancelado || '').toUpperCase() !== 'C') {
                pending += Math.max(valor - pago, 0);
            }
        });
        return { pendiente: pending, cuotaMesFromHistory: cuotaMesFromHistory };
    }

    function buildCarryIndexFromHistorico(historico) {
        var carry = {};
        (historico || []).forEach(function (liq) {
            (liq.detalle || []).forEach(function (d) {
                var key = [d.city, d.executiveId || d.executiveName, d.invoiceNumber, d.cuotaCodigo || d.cuota || ''].join('|').toUpperCase();
                carry[key] = {
                    puntos: toNumber(d.carryPuntosPendientes),
                    monto: toNumber(d.carryMontoPendiente)
                };
            });
        });
        return carry;
    }

    function calcularReglaEC(params) {
        var cuotaMes = toNumber(params.cuotaMes);
        var pendiente = toNumber(params.pendiente);
        var pago = toNumber(params.pago);
        var carryPrevPuntos = toNumber(params.carryPrevPuntos);
        var carryPrevMonto = toNumber(params.carryPrevMonto);
        var isCuotaInicial = !!params.isCuotaInicial;

        var puntos = 0;
        var valorLiquidado = 0;
        var regla = 'sin_pago';
        var trace = [];
        var carryPuntosPendientes = 0;
        var carryMontoPendiente = 0;
        var proximaVigenciaEligible = false;
        var proximaVigenciaPuntos = 0;
        var proximaVigenciaMonto = 0;

        if (pago <= 0 && carryPrevPuntos > 0) {
            regla = 'anticipada_arrastre';
            puntos = carryPrevPuntos;
            valorLiquidado = 0;
            trace.push('Sin pago en rango: se aplica punto adelantado del período anterior.');
            return {
                regla: regla,
                puntos: puntos,
                valorLiquidado: valorLiquidado,
                trace: trace,
                carryPuntosPendientes: 0,
                carryMontoPendiente: 0,
                proximaVigenciaEligible: false,
                proximaVigenciaPuntos: 0,
                proximaVigenciaMonto: 0
            };
        }

        if (pago <= 0) {
            trace.push('Sin pago en rango de fechas.');
            return {
                regla: regla,
                puntos: puntos,
                valorLiquidado: 0,
                trace: trace,
                carryPuntosPendientes: 0,
                carryMontoPendiente: 0,
                proximaVigenciaEligible: false,
                proximaVigenciaPuntos: 0,
                proximaVigenciaMonto: 0
            };
        }

        if (pendiente > 0) {
            regla = 'cuota_atrasada';
            var pagoAtrasado = Math.min(pago, pendiente);
            var puntosAtrasada = cuotaMes > 0 ? Math.min(pagoAtrasado / cuotaMes, 1) : 0;
            var excedente = Math.max(pago - pendiente, 0);
            var puntosMes = cuotaMes > 0 && excedente > 0 ? Math.min(excedente / cuotaMes, 1) : 0;
            puntos = puntosAtrasada + puntosMes;
            valorLiquidado = pago;
            trace.push('Se aplica primero a cuotas atrasadas hasta 1.000 punto.');
            if (puntosMes > 0) trace.push('Excedente aplicado a cuota del mes presente.');
        } else if (cuotaMes > 0 && pago > cuotaMes) {
            regla = 'anticipada';
            puntos = 1;
            valorLiquidado = isCuotaInicial ? 0 : pago;
            var excedenteAnt = pago - cuotaMes;
            carryPuntosPendientes = cuotaMes > 0 ? excedenteAnt / cuotaMes : 0;
            carryMontoPendiente = excedenteAnt;
            proximaVigenciaEligible = carryPuntosPendientes > 0;
            proximaVigenciaPuntos = carryPuntosPendientes;
            proximaVigenciaMonto = carryMontoPendiente;
            trace.push('Pago anticipado: se liquida 1.000 punto del mes presente.');
            if (isCuotaInicial) trace.push('Cuota inicial: no se liquida monto en este período.');
            if (carryPuntosPendientes > 0) trace.push('Se guarda arrastre para próxima vigencia.');
        } else {
            regla = 'cuenta_al_dia';
            puntos = cuotaMes > 0 ? Math.min(pago / cuotaMes, 1) : 0;
            valorLiquidado = pago;
            trace.push('Cuenta al día: se liquida porcentaje de punto sobre cuota del mes.');
        }

        return {
            regla: regla,
            puntos: puntos,
            valorLiquidado: valorLiquidado,
            trace: trace,
            carryPuntosPendientes: carryPuntosPendientes,
            carryMontoPendiente: carryMontoPendiente,
            proximaVigenciaEligible: proximaVigenciaEligible,
            proximaVigenciaPuntos: proximaVigenciaPuntos,
            proximaVigenciaMonto: proximaVigenciaMonto
        };
    }

    function buildDetalleLiquidacionEC(tipo, mes, fechaInicio, fechaFin, ejecutivoIdFiltro, selectedCity) {
        var carteraRecords = leerRegistrosCarteraGlobal();
        var ingresosByCity = leerIngresosPorCiudad();
        var historico = leerHistoricoLiquidaciones();
        var carryIndex = buildCarryIndexFromHistorico(historico);
        var startDate = fechaInicio ? new Date(fechaInicio + 'T00:00:00') : null;
        var endDate = fechaFin ? new Date(fechaFin + 'T23:59:59') : null;
        var ingresosDetalleIndex = buildIngresosDetalleIndex(ingresosByCity, startDate, endDate);
        var ejecutivoObjetivo = normalizeExecutiveId(ejecutivoIdFiltro);
        var cityFilter = toCityCode(selectedCity);
        if (tipo === 'por_ejecutivo' && !ejecutivoObjetivo) return [];

        var detalle = carteraRecords.filter(function (r) {
            if (cityFilter && toCityCode(r.city) !== cityFilter) return false;
            if (tipo === 'por_ejecutivo' && ejecutivoObjetivo) {
                return r.executiveId === ejecutivoObjetivo;
            }
            return true;
        }).map(function (r) {
            var cuotaMes = toNumber(r.valor);
            var pendiente = Math.max(toNumber(r.valor) - toNumber(r.valorPago), 0);
            var ingresoKey = [r.city, r.executiveId, r.factura].join('|').toUpperCase();
            var ingresoInfo = ingresosDetalleIndex[ingresoKey] || { total: 0, tipos: {}, fechaUltima: '', ingresoRef: '', reciboRef: '' };
            var pagoEnRango = toNumber(ingresoInfo.total);
            var tiposIngreso = Object.keys(ingresoInfo.tipos || {});
            var ingresoLabel = tiposIngreso.length ? tiposIngreso.join(' / ') : '-';
            var fechaIngreso = ingresoInfo.fechaUltima || '';
            var carryKey = [r.city, r.executiveId, r.factura, r.cuota].join('|').toUpperCase();
            var carryPrev = carryIndex[carryKey] || { puntos: 0, monto: 0 };
            var cuotaCode = String(r.cuota || '').trim();
            var isCuotaInicial = cuotaCode === '0' || /^0\//.test(cuotaCode);
            var calc = calcularReglaEC({
                cuotaMes: cuotaMes,
                pendiente: pendiente,
                pago: pagoEnRango,
                carryPrevPuntos: carryPrev.puntos,
                carryPrevMonto: carryPrev.monto,
                isCuotaInicial: isCuotaInicial
            });

            return {
                id: generarId(),
                tipo: tipo === 'por_filial' ? 'Por filial' : 'Por ejecutivo',
                city: r.city,
                executiveId: r.executiveId,
                executiveName: r.executiveId,
                invoiceNumber: r.factura,
                cuotaCodigo: r.cuota,
                holderName: getTitularNombreByCity(r.city, r.holderId),
                vto: r.vto || r.fechaVencimiento || r.fechavto || '',
                tipoIngreso: ingresoLabel,
                ingresoRef: ingresoInfo.ingresoRef || '',
                recibo: ingresoInfo.reciboRef || '',
                fechaPago: fechaIngreso,
                holderId: r.holderId || '-',
                cuotaMes: cuotaMes,
                pendiente: pendiente,
                pagoAplicado: pagoEnRango,
                puntos: calc.puntos,
                regla: calc.regla,
                valorLiquidado: calc.valorLiquidado,
                trace: calc.trace.join(' '),
                proximaVigenciaEligible: !!calc.proximaVigenciaEligible,
                proximaVigenciaIncluir: false,
                proximaVigenciaPuntos: calc.proximaVigenciaPuntos,
                proximaVigenciaMonto: calc.proximaVigenciaMonto,
                carryPuntosPendientes: calc.carryPuntosPendientes,
                carryMontoPendiente: calc.carryMontoPendiente,
                valorAsignado: cuotaMes
            };
        });

        if (tipo === 'por_ejecutivo') {
            detalle.sort(function (a, b) {
                return String(a.city).localeCompare(String(b.city)) ||
                    String(a.invoiceNumber).localeCompare(String(b.invoiceNumber)) ||
                    String(a.cuotaCodigo).localeCompare(String(b.cuotaCodigo));
            });
        } else {
            detalle.sort(function (a, b) {
                return String(a.city).localeCompare(String(b.city)) ||
                    String(a.executiveId).localeCompare(String(b.executiveId)) ||
                    String(a.invoiceNumber).localeCompare(String(b.invoiceNumber));
            });
        }
        return detalle;
    }

    function buildDetalleLiquidacionPrejuridico(mes, fechaInicio, fechaFin, ciudadesSeleccionadas) {
        var cities = (ciudadesSeleccionadas || []).map(toCityCode).filter(Boolean);
        if (!cities.length) return [];
        var detalle = [];
        cities.forEach(function (city) {
            var rows = buildDetalleLiquidacionEC('por_filial', mes, fechaInicio, fechaFin, '', city);
            (rows || []).forEach(function (d) {
                d.tipo = 'Pre jurídico';
                detalle.push(d);
            });
        });
        detalle.sort(function (a, b) {
            return String(a.city).localeCompare(String(b.city)) ||
                String(a.executiveId).localeCompare(String(b.executiveId)) ||
                String(a.invoiceNumber).localeCompare(String(b.invoiceNumber));
        });
        return detalle;
    }

    function calcularTotalesLiquidacion(detalle) {
        return (detalle || []).reduce(function (acc, d) {
            var puntos = toNumber(d.puntos);
            var valor = toNumber(d.valorLiquidado);
            if (d.proximaVigenciaEligible && d.proximaVigenciaIncluir) {
                puntos += toNumber(d.proximaVigenciaPuntos);
                valor += toNumber(d.proximaVigenciaMonto);
            }
            acc.registros += 1;
            acc.cuentas += 1;
            acc.valorAsignado += toNumber(d.valorAsignado);
            acc.ingresos += toNumber(d.pagoAplicado);
            acc.puntos += puntos;
            acc.valorLiquidado += valor;
            return acc;
        }, {
            registros: 0,
            cuentas: 0,
            valorAsignado: 0,
            ingresos: 0,
            puntos: 0,
            valorLiquidado: 0
        });
    }

    function closeModalById(id) {
        var modal = document.getElementById(id);
        if (modal) modal.classList.remove('show');
    }

    function openModalById(id) {
        var modal = document.getElementById(id);
        if (modal) modal.classList.add('show');
    }

    function setDefaultMesRangoCrearLiquidacion() {
        var monthInput = document.getElementById('liqCreateMes');
        var startInput = document.getElementById('liqCreateFechaInicio');
        var endInput = document.getElementById('liqCreateFechaFin');
        var inputExec = document.getElementById('liqCreateEjecutivoId');
        if (!monthInput || !startInput || !endInput) return;
        var cfg = leerConfigLiquidacion();
        if (inputExec) inputExec.value = cfg.ejecutivoId || '';
        if (cfg.mes) monthInput.value = cfg.mes;
        if (cfg.fechaInicio) startInput.value = cfg.fechaInicio;
        if (cfg.fechaFin) endInput.value = cfg.fechaFin;
        if (!monthInput.value) {
            var now = new Date();
            var monthValue = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
            monthInput.value = monthValue;
            startInput.value = monthValue + '-01';
            var last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            endInput.value = monthValue + '-' + String(last).padStart(2, '0');
        }
    }

    function actualizarRangoDesdeMesCrearLiquidacion() {
        var monthInput = document.getElementById('liqCreateMes');
        var startInput = document.getElementById('liqCreateFechaInicio');
        var endInput = document.getElementById('liqCreateFechaFin');
        var tipo = (document.getElementById('liqCreateTipo') || {}).value || 'por_ejecutivo';
        if (!monthInput || !startInput || !endInput || !monthInput.value) return;
        var p = monthInput.value.split('-');
        var y = parseInt(p[0], 10);
        var m = parseInt(p[1], 10);
        if (!Number.isFinite(y) || !Number.isFinite(m)) return;
        if (tipo === 'prejuridico' || tipo === 'casas_externas') {
            var prevMonth = m === 1 ? 12 : (m - 1);
            var prevYear = m === 1 ? (y - 1) : y;
            startInput.value = prevYear + '-' + String(prevMonth).padStart(2, '0') + '-25';
            endInput.value = y + '-' + String(m).padStart(2, '0') + '-24';
            return;
        }
        startInput.value = monthInput.value + '-01';
        var last = new Date(y, m, 0).getDate();
        endInput.value = monthInput.value + '-' + String(last).padStart(2, '0');
    }

    function updatePreviewCrearLiquidacion() {
        var tipo = (document.getElementById('liqCreateTipo') || {}).value || 'por_ejecutivo';
        var ejecutivoId = normalizeExecutiveId((document.getElementById('liqCreateEjecutivoId') || {}).value || '');
        var ciudadesPrejuridico = getSelectedCreateCiudades();
        var mes = (document.getElementById('liqCreateMes') || {}).value || '';
        var fechaInicio = (document.getElementById('liqCreateFechaInicio') || {}).value || '';
        var fechaFin = (document.getElementById('liqCreateFechaFin') || {}).value || '';
        var detalle = (tipo === 'prejuridico' || tipo === 'casas_externas')
            ? buildDetalleLiquidacionPrejuridico(mes, fechaInicio, fechaFin, ciudadesPrejuridico)
            : buildDetalleLiquidacionEC(tipo, mes, fechaInicio, fechaFin, ejecutivoId, liquidacionState.selectedCity);
        var ciudades = {};
        var ejecutivos = {};
        var ingresos = 0;
        detalle.forEach(function (d) {
            ciudades[d.city] = true;
            ejecutivos[d.executiveId || d.executiveName] = true;
            ingresos += toNumber(d.pagoAplicado);
        });
        var elCiu = document.getElementById('liqPreviewCiudades');
        var elEje = document.getElementById('liqPreviewEjecutivos');
        var elAsi = document.getElementById('liqPreviewAsignaciones');
        var elIng = document.getElementById('liqPreviewIngresos');
        if (elCiu) elCiu.textContent = String(Object.keys(ciudades).length);
        if (elEje) elEje.textContent = String(Object.keys(ejecutivos).length);
        if (elAsi) elAsi.textContent = String(detalle.length);
        if (elIng) elIng.textContent = formatMoney(ingresos);
    }

    function actualizarVisibilidadCampoEjecutivoCrear() {
        var tipo = (document.getElementById('liqCreateTipo') || {}).value || '';
        var wrap = document.getElementById('liqCreateEjecutivoWrap');
        var wrapFilial = document.getElementById('liqCreateFilialWrap');
        var wrapCiudades = document.getElementById('liqCreateCiudadesWrap');
        if (wrap) wrap.style.display = tipo === 'por_ejecutivo' ? 'block' : 'none';
        if (wrapFilial) wrapFilial.style.display = tipo === 'por_filial' ? 'block' : 'none';
        if (wrapCiudades) wrapCiudades.style.display = (tipo === 'prejuridico' || tipo === 'casas_externas') ? 'block' : 'none';
        if (tipo === 'por_filial') {
            populateFilialCreateSelect();
        }
        if (tipo === 'prejuridico' || tipo === 'casas_externas') {
            populateCreateCiudadesList();
        }
    }

    function abrirModalTipoLiquidacion() {
        var selectTipo = document.getElementById('liqTipoLiquidacionSelect');
        if (selectTipo) selectTipo.value = '';
        openModalById('modalTipoLiquidacion');
    }

    function cerrarModalTipoLiquidacion() {
        closeModalById('modalTipoLiquidacion');
    }

    function confirmarTipoLiquidacionCrear() {
        var selectTipo = document.getElementById('liqTipoLiquidacionSelect');
        var tipo = selectTipo ? String(selectTipo.value || '').trim() : '';
        if (!tipo) {
            showNotification('Seleccione el tipo de liquidación.', 'warning');
            return;
        }
        if (tipo !== 'prejuridico' && tipo !== 'casas_externas' && !liquidacionState.selectedCity) {
            showNotification('Seleccione una ciudad para crear liquidaciones EC.', 'warning');
            showSelectCityModal();
            return;
        }
        if (tipo === 'por_filial') {
            var filiales = getFilialesDisponibles();
            if (!filiales.length) {
                showNotification('No hay filiales activas creadas para la ciudad seleccionada.', 'warning');
                return;
            }
        }
        cerrarModalTipoLiquidacion();
        abrirModalCrearLiquidacion(tipo);
    }

    function abrirModalCrearLiquidacion(tipo) {
        var hiddenTipo = document.getElementById('liqCreateTipo');
        var title = document.getElementById('modalCrearLiquidacionTitulo');
        var inputExec = document.getElementById('liqCreateEjecutivoId');
        var inputFilial = document.getElementById('liqCreateFilial');
        var checksCiudades = document.querySelectorAll('.liq-create-ciudad-check');
        if (hiddenTipo) hiddenTipo.value = tipo;
        if (inputExec && tipo !== 'por_ejecutivo') inputExec.value = '';
        if (inputFilial && tipo !== 'por_filial') inputFilial.value = '';
        if (checksCiudades && checksCiudades.length) {
            checksCiudades.forEach(function (check) { check.checked = false; });
        }
        if (title) {
            if (tipo === 'por_filial') title.textContent = 'CREAR LIQUIDACIÓN EC - POR FILIAL';
            else if (tipo === 'prejuridico') title.textContent = 'CREAR LIQUIDACIÓN PRE JURÍDICO';
            else if (tipo === 'casas_externas') title.textContent = 'CREAR LIQUIDACIÓN CASAS COBRANZAS EXTERNAS';
            else title.textContent = 'CREAR LIQUIDACIÓN EC - POR EJECUTIVO';
        }
        actualizarVisibilidadCampoEjecutivoCrear();
        setDefaultMesRangoCrearLiquidacion();
        actualizarRangoDesdeMesCrearLiquidacion();
        updatePreviewCrearLiquidacion();
        openModalById('modalCrearLiquidacion');
    }

    function cerrarModalCrearLiquidacion() {
        closeModalById('modalCrearLiquidacion');
    }

    function guardarLiquidacionEC() {
        var tipo = (document.getElementById('liqCreateTipo') || {}).value || 'por_ejecutivo';
        var ejecutivoId = normalizeExecutiveId((document.getElementById('liqCreateEjecutivoId') || {}).value || '');
        var filialCodigo = toCityCode((document.getElementById('liqCreateFilial') || {}).value || '');
        var ciudadesPrejuridico = getSelectedCreateCiudades();
        var mes = (document.getElementById('liqCreateMes') || {}).value || '';
        var fechaInicio = (document.getElementById('liqCreateFechaInicio') || {}).value || '';
        var fechaFin = (document.getElementById('liqCreateFechaFin') || {}).value || '';
        if (tipo !== 'prejuridico' && tipo !== 'casas_externas' && !liquidacionState.selectedCity) {
            showNotification('Seleccione una ciudad para crear la liquidación.', 'error');
            showSelectCityModal();
            return false;
        }
        if (tipo === 'por_filial' && !filialCodigo) {
            showNotification('Seleccione la filial que desea liquidar.', 'error');
            return false;
        }
        if (tipo === 'por_ejecutivo' && !ejecutivoId) {
            showNotification('Digite la identificación del ejecutivo para liquidar.', 'error');
            return false;
        }
        if ((tipo === 'prejuridico' || tipo === 'casas_externas') && !ciudadesPrejuridico.length) {
            showNotification('Seleccione al menos una ciudad para liquidar a nivel nacional.', 'error');
            return false;
        }
        if (!mes || !fechaInicio || !fechaFin) {
            showNotification('Complete mes y rango de fechas para crear la liquidación.', 'error');
            return false;
        }
        if (parseDateSafe(fechaInicio) && parseDateSafe(fechaFin) && parseDateSafe(fechaInicio) > parseDateSafe(fechaFin)) {
            showNotification('La fecha inicial no puede ser mayor a la fecha final.', 'error');
            return false;
        }

        var detalle = (tipo === 'prejuridico' || tipo === 'casas_externas')
            ? buildDetalleLiquidacionPrejuridico(mes, fechaInicio, fechaFin, ciudadesPrejuridico)
            : buildDetalleLiquidacionEC(tipo, mes, fechaInicio, fechaFin, ejecutivoId, liquidacionState.selectedCity);
        if (!detalle.length) {
            showNotification('No se encontraron asignaciones para liquidar en el rango seleccionado.', 'error');
            return false;
        }
        var totales = calcularTotalesLiquidacion(detalle);
        var nowIso = new Date().toISOString();
        var tipoLabel = obtenerNombreTipoLiquidacion(tipo);
        if (tipo === 'por_filial' && filialCodigo) {
            tipoLabel += ' - ' + filialCodigo;
        }
        if ((tipo === 'prejuridico' || tipo === 'casas_externas') && ciudadesPrejuridico.length) {
            tipoLabel += ' - ' + ciudadesPrejuridico.join(', ');
        }
        var cityCodeRecord = (tipo === 'prejuridico' || tipo === 'casas_externas')
            ? (ciudadesPrejuridico.length > 1 ? 'NACIONAL' : (ciudadesPrejuridico[0] || ''))
            : (liquidacionState.selectedCity || '');
        var cityNameRecord = (tipo === 'prejuridico' || tipo === 'casas_externas')
            ? ciudadesPrejuridico.map(function (c) { return getCityNameByCode(c) || c; }).join(', ')
            : getCityNameByCode(liquidacionState.selectedCity || '');
        var record = {
            id: generarIdLiquidacion(),
            tipo: tipo,
            tipoLabel: tipoLabel,
            ejecutivoId: tipo === 'por_ejecutivo' ? ejecutivoId : '',
            filialCodigo: tipo === 'por_filial' ? filialCodigo : '',
            filialNombre: '',
            cityCode: cityCodeRecord,
            cityName: cityNameRecord,
            ciudades: (tipo === 'prejuridico' || tipo === 'casas_externas') ? ciudadesPrejuridico.slice() : [],
            mes: mes,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            fechaCreacion: nowIso,
            totales: totales,
            detalle: detalle
        };
        if (tipo === 'por_filial' && filialCodigo) {
            var filial = getFilialesDisponibles().find(function (f) { return f.codigo === filialCodigo; });
            record.filialNombre = filial && filial.nombre ? filial.nombre : '';
        }
        liquidacionState.historico.push(record);
        setHistoricoLiquidaciones(liquidacionState.historico);
        guardarConfigLiquidacion({
            tipo: tipo,
            ejecutivoId: ejecutivoId,
            ciudades: (tipo === 'prejuridico' || tipo === 'casas_externas') ? ciudadesPrejuridico.slice() : [],
            mes: mes,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin
        });
        liquidacionState.selectedId = record.id;
        cerrarModalCrearLiquidacion();
        renderHistoricoLiquidaciones();
        renderLiquidacionSeleccionada();
        return true;
    }

    function prepararGuardarLiquidacionEC() {
        var tipo = (document.getElementById('liqCreateTipo') || {}).value || 'por_ejecutivo';
        var msg = tipo === 'por_filial'
            ? '¿Está segur@ de crear la liquidación EC por filial con el rango seleccionado?'
            : (tipo === 'prejuridico'
                ? '¿Está segur@ de crear la liquidación pre jurídico nacional con las ciudades seleccionadas?'
                : (tipo === 'casas_externas'
                    ? '¿Está segur@ de crear la liquidación de casas cobranzas externas nacional con las ciudades seleccionadas?'
                    : '¿Está segur@ de crear la liquidación EC por ejecutivo con el rango seleccionado?'));
        abrirConfirmacionAccion('CONFIRMACIÓN', msg, guardarLiquidacionEC, 'Liquidación creada exitosamente.', null, 'ÉXITO');
    }

    function getHistoricoFiltros() {
        return liquidacionState.filtros || { mes: '', fechaInicio: '', fechaFin: '' };
    }

    function rangesOverlap(startA, endA, startB, endB) {
        if (!startA || !endA || !startB || !endB) return true;
        return startA <= endB && endA >= startB;
    }

    function recordMatchesSelectedCity(record, cityCode) {
        var selected = toCityCode(cityCode);
        if (!selected) return true;
        if (toCityCode(record.cityCode) === selected) return true;
        if (Array.isArray(record.detalle) && record.detalle.some(function (d) { return toCityCode(d.city) === selected; })) return true;
        return false;
    }

    function filterHistorico(list, filtros) {
        return (list || []).filter(function (r) {
            if (!recordMatchesSelectedCity(r, liquidacionState.selectedCity)) return false;
            if (filtros.mes && r.mes !== filtros.mes) return false;
            var liqStart = isoDateLabel(r.fechaInicio);
            var liqEnd = isoDateLabel(r.fechaFin);
            if (filtros.fechaInicio && filtros.fechaFin) {
                if (!rangesOverlap(liqStart, liqEnd, filtros.fechaInicio, filtros.fechaFin)) return false;
            } else if (filtros.fechaInicio) {
                if (liqEnd && liqEnd < filtros.fechaInicio) return false;
            } else if (filtros.fechaFin) {
                if (liqStart && liqStart > filtros.fechaFin) return false;
            }
            return true;
        });
    }

    function ensureSelectedLiquidacionDisponible() {
        var rows = filterHistorico(liquidacionState.historico, { mes: '', fechaInicio: '', fechaFin: '' });
        if (!rows.length) {
            liquidacionState.selectedId = '';
            return;
        }
        var exists = rows.some(function (r) { return r.id === liquidacionState.selectedId; });
        if (!exists) liquidacionState.selectedId = rows[rows.length - 1].id;
    }

    function renderHistoricoLiquidaciones() {
        var tbody = document.getElementById('tbodyLiquidacionHistorico');
        var count = document.getElementById('liqHistoricoCount');
        if (!tbody) return;
        var filtros = getHistoricoFiltros();
        var rows = filterHistorico(liquidacionState.historico, filtros);
        if (count) count.textContent = rows.length + ' registros';
        if (!rows.length) {
            tbody.innerHTML = '<tr class="no-data-row"><td colspan="8" class="no-data-message"><div class="no-data-content"><i class="fas fa-file-invoice-dollar"></i><p>No hay liquidaciones creadas</p><small>Use "Crear liquidación" para generar el primer proceso</small></div></td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(function (r) {
            return '<tr data-liq-id="' + escapeHtml(r.id) + '">' +
                '<td>' + escapeHtml(r.tipoLabel || '-') + '</td>' +
                '<td>' + escapeHtml(r.mes || '-') + '</td>' +
                '<td>' + escapeHtml(formatDateLabel(r.fechaInicio) + ' - ' + formatDateLabel(r.fechaFin)) + '</td>' +
                '<td>' + escapeHtml(String(toNumber(r.totales && r.totales.registros))) + '</td>' +
                '<td>' + escapeHtml(formatPoints(r.totales && r.totales.puntos)) + '</td>' +
                '<td>' + escapeHtml(formatMoney(r.totales && r.totales.valorLiquidado)) + '</td>' +
                '<td>' + escapeHtml(formatDateLabel(r.fechaCreacion)) + '</td>' +
                '<td><button type="button" class="btn btn-primary btn-small btn-ver-detalle-liquidacion" data-id="' + escapeHtml(r.id) + '" title="Ver detalle"><i class="fas fa-eye"></i></button></td>' +
                '</tr>';
        }).join('');
    }

    function findSelectedLiquidacion() {
        return liquidacionState.historico.find(function (x) { return x.id === liquidacionState.selectedId; }) || null;
    }

    function renderResumenLiquidacionSeleccionada(liq) {
        var totales = liq ? calcularTotalesLiquidacion(liq.detalle || []) : {
            registros: 0,
            cuentas: 0,
            valorAsignado: 0,
            ingresos: 0,
            puntos: 0,
            valorLiquidado: 0
        };
        var elReg = document.getElementById('liqResumenRegistros');
        var elCue = document.getElementById('liqResumenCuentas');
        var elVal = document.getElementById('liqResumenValorAsignado');
        var elIng = document.getElementById('liqResumenIngresos');
        var elPun = document.getElementById('liqResumenPuntos');
        var elPag = document.getElementById('liqResumenPagosAplicados');
        if (elReg) elReg.textContent = String(Math.trunc(totales.registros));
        if (elCue) elCue.textContent = String(Math.trunc(totales.cuentas));
        if (elVal) elVal.textContent = formatMoney(totales.valorAsignado);
        if (elIng) elIng.textContent = formatMoney(totales.ingresos);
        if (elPun) elPun.textContent = formatPoints(totales.puntos);
        if (elPag) elPag.textContent = formatMoney(totales.valorLiquidado);
    }

    function renderDetalleLiquidacion(liq) {
        var tbody = document.getElementById('tbodyLiquidacionDetalle');
        var title = document.getElementById('liqReporteTitulo');
        var rango = document.getElementById('liqRangoLabel');
        if (!tbody) return;
        if (!liq) {
            if (title) title.textContent = 'Detalle de liquidación seleccionada';
            if (rango) rango.textContent = 'Sin liquidación seleccionada';
            tbody.innerHTML = '<tr class="no-data-row"><td colspan="8" class="no-data-message"><div class="no-data-content"><i class="fas fa-file-alt"></i><p>Seleccione una liquidación para ver el detalle</p><small>Use el botón "Ver detalle" en el histórico</small></div></td></tr>';
            return;
        }
        if (title) title.textContent = liq.tipoLabel + ' (' + liq.mes + ')';
        if (rango) rango.textContent = formatDateLabel(liq.fechaInicio) + ' - ' + formatDateLabel(liq.fechaFin);
        var detalle = liq.detalle || [];
        var mesLabel = String(liq.mes || '').split('-')[1] || '';
        var anioLabel = String(liq.mes || '').split('-')[0] || '';
        tbody.innerHTML = detalle.map(function (d) {
            var puntosFinal = toNumber(d.puntos) + (d.proximaVigenciaEligible && d.proximaVigenciaIncluir ? toNumber(d.proximaVigenciaPuntos) : 0);
            return '<tr data-det-id="' + escapeHtml(d.id) + '">' +
                '<td>' + escapeHtml(d.executiveName || '-') + '</td>' +
                '<td>' + escapeHtml(d.tipoIngreso || '-') + '</td>' +
                '<td>' + escapeHtml(formatDateLabel(d.fechaPago)) + '</td>' +
                '<td>' + escapeHtml(d.invoiceNumber || '-') + '</td>' +
                '<td>' + escapeHtml(formatMoney(d.pagoAplicado)) + '</td>' +
                '<td>' + escapeHtml(mesLabel || '-') + '</td>' +
                '<td>' + escapeHtml(anioLabel || '-') + '</td>' +
                '<td>' + escapeHtml(formatPoints(puntosFinal)) + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderLiquidacionSeleccionada() {
        var liq = findSelectedLiquidacion();
        liquidacionState.selectedLiquidacion = liq;
        renderResumenLiquidacionSeleccionada(liq);
        renderDetalleLiquidacion(liq);
    }

    function toggleLiquidacionView(showDetail) {
        var historicoWrap = document.getElementById('liquidacionHistoricoWrap');
        var detalleWrap = document.getElementById('liquidacionDetalleWrap');
        if (historicoWrap) historicoWrap.style.display = showDetail ? 'none' : 'block';
        if (detalleWrap) detalleWrap.style.display = showDetail ? 'block' : 'none';
    }

    function openBuscarLiquidacionModal() {
        if (!liquidacionState.selectedCity) {
            showNotification('Seleccione una ciudad para buscar liquidaciones.', 'warning');
            showSelectCityModal();
            return;
        }
        var mes = document.getElementById('liqBuscarMes');
        var ini = document.getElementById('liqBuscarFechaInicio');
        var fin = document.getElementById('liqBuscarFechaFin');
        var filtros = getHistoricoFiltros();
        if (mes) mes.value = filtros.mes || '';
        if (ini) ini.value = filtros.fechaInicio || '';
        if (fin) fin.value = filtros.fechaFin || '';
        openModalById('modalBuscarLiquidacion');
    }

    function closeBuscarLiquidacionModal() {
        closeModalById('modalBuscarLiquidacion');
    }

    function closeResultadosLiquidacionModal() {
        closeModalById('modalResultadosLiquidacion');
    }

    function populateReporteCiudadesList() {
        var container = document.getElementById('liqReporteCiudadesList');
        if (!container) return;
        var ciudades = getCiudadesActivas();
        container.innerHTML = '';
        if (!ciudades.length) {
            container.innerHTML = '<small>No hay ciudades activas disponibles.</small>';
            return;
        }
        ciudades.forEach(function (c) {
            var label = document.createElement('label');
            label.innerHTML = '<input type="checkbox" class="liq-reporte-ciudad-check" value="' + escapeHtml(c.codigo) + '"> ' + escapeHtml(c.codigo + ' - ' + c.nombre.toUpperCase());
            container.appendChild(label);
        });
    }

    function getSelectedReporteCiudades() {
        return Array.prototype.slice.call(document.querySelectorAll('.liq-reporte-ciudad-check:checked'))
            .map(function (input) { return toCityCode(input.value); })
            .filter(Boolean);
    }

    function populateCreateCiudadesList() {
        var container = document.getElementById('liqCreateCiudadesList');
        if (!container) return;
        var ciudades = getCiudadesActivas();
        container.innerHTML = '';
        if (!ciudades.length) {
            container.innerHTML = '<small>No hay ciudades activas disponibles.</small>';
            return;
        }
        ciudades.forEach(function (c) {
            var label = document.createElement('label');
            label.innerHTML = '<input type="checkbox" class="liq-create-ciudad-check" value="' + escapeHtml(c.codigo) + '"> ' + escapeHtml(c.codigo + ' - ' + c.nombre.toUpperCase());
            container.appendChild(label);
        });
    }

    function getSelectedCreateCiudades() {
        return Array.prototype.slice.call(document.querySelectorAll('.liq-create-ciudad-check:checked'))
            .map(function (input) { return toCityCode(input.value); })
            .filter(Boolean);
    }

    function prepararReporteResumenDosCiudades(tipoReporte, ciudadesSeleccionadas) {
        var cities = (ciudadesSeleccionadas || []).map(toCityCode).filter(Boolean);
        if (!cities.length) return null;

        var historico = leerHistoricoLiquidaciones()
            .filter(function (r) { return cities.indexOf(toCityCode(r.cityCode)) >= 0; });

        if (!historico.length) return null;

        var ultimoPorCiudad = {};
        historico.forEach(function (r) {
            var city = toCityCode(r.cityCode);
            if (!city) return;
            if (!ultimoPorCiudad[city]) {
                ultimoPorCiudad[city] = r;
                return;
            }
            var actual = new Date(r.fechaCreacion || 0).getTime();
            var previo = new Date(ultimoPorCiudad[city].fechaCreacion || 0).getTime();
            if (actual >= previo) ultimoPorCiudad[city] = r;
        });

        var agg = {};
        Object.keys(ultimoPorCiudad).forEach(function (city) {
            var liq = ultimoPorCiudad[city];
            (liq.detalle || []).forEach(function (d) {
                var key = [city, normalizeExecutiveId(d.executiveId || d.executiveName)].join('|');
                if (!agg[key]) {
                    agg[key] = {
                        ciudad: city,
                        executiveId: normalizeExecutiveId(d.executiveName || d.executiveId),
                        cargo: 'EJECUTIVO',
                        ctasAsignadas: 0,
                        ctasCobradas: 0,
                        montoAsignado: 0,
                        montoCobrado: 0,
                        totalRecaudo: 0,
                        valorLiquidado: 0
                    };
                }
                agg[key].ctasAsignadas += 1;
                if (toNumber(d.pagoAplicado) > 0) agg[key].ctasCobradas += 1;
                agg[key].montoAsignado += toNumber(d.valorAsignado || d.cuotaMes);
                agg[key].montoCobrado += toNumber(d.pagoAplicado);
                agg[key].totalRecaudo += toNumber(d.pagoAplicado);
                agg[key].valorLiquidado += toNumber(d.valorLiquidado);
            });
        });

        var rows = Object.values(agg).map(function (r) {
            var porcentaje = r.ctasAsignadas ? (r.ctasCobradas * 100 / r.ctasAsignadas) : 0;
            var pctLiquid = r.totalRecaudo > 0 ? (r.valorLiquidado * 100 / r.totalRecaudo) : 0;
            var executiveName = getExecutiveNameByCityAndId(r.ciudad, r.executiveId) || r.executiveId;
            var cityName = getCityNameByCode(r.ciudad) || '-';
            var totalFinal = r.valorLiquidado;
            return {
                ciudad: String(cityName).toUpperCase(),
                ciudadNombre: cityName,
                nombre: executiveName,
                cargo: r.cargo,
                cuentasAsignadas: r.ctasAsignadas,
                cuentasCobradas: r.ctasCobradas,
                porcentajeCobrado: porcentaje,
                montoAsignado: r.montoAsignado,
                recaudoDia: r.montoCobrado,
                descuento: '-',
                nc: '-',
                recaudo: r.totalRecaudo,
                porcentajeLiquidacion: pctLiquid,
                totalRecaudo: r.valorLiquidado,
                premiosOficiales: 0,
                premiosConcurso: 0,
                total: totalFinal
            };
        }).sort(function (a, b) {
            return String(a.ciudad).localeCompare(String(b.ciudad)) || String(a.nombre).localeCompare(String(b.nombre));
        });

        var grouped = {};
        rows.forEach(function (r) {
            if (!grouped[r.ciudad]) grouped[r.ciudad] = [];
            grouped[r.ciudad].push(r);
        });
        var finalRows = [];
        Object.keys(grouped).sort().forEach(function (city) {
            var cityRows = grouped[city];
            cityRows.forEach(function (r) { finalRows.push(r); });
            var total = cityRows.reduce(function (acc, r) {
                acc.cuentasAsignadas += toNumber(r.cuentasAsignadas);
                acc.cuentasCobradas += toNumber(r.cuentasCobradas);
                acc.montoAsignado += toNumber(r.montoAsignado);
                acc.recaudoDia += toNumber(r.recaudoDia);
                acc.recaudo += toNumber(r.recaudo);
                acc.totalRecaudo += toNumber(r.totalRecaudo);
                acc.premiosOficiales += toNumber(r.premiosOficiales);
                acc.premiosConcurso += toNumber(r.premiosConcurso);
                acc.total += toNumber(r.total);
                return acc;
            }, {
                cuentasAsignadas: 0,
                cuentasCobradas: 0,
                montoAsignado: 0,
                recaudoDia: 0,
                recaudo: 0,
                totalRecaudo: 0,
                premiosOficiales: 0,
                premiosConcurso: 0,
                total: 0
            });
            var cityName = getCityNameByCode(city) || city;
            finalRows.push({
                __isTotalCity: true,
                ciudad: 'TOTAL',
                ciudadNombre: cityName,
                nombre: 'CARTERA NORMAL ' + String(cityName).toUpperCase(),
                cargo: '',
                cuentasAsignadas: total.cuentasAsignadas,
                cuentasCobradas: total.cuentasCobradas,
                porcentajeCobrado: total.cuentasAsignadas ? (total.cuentasCobradas * 100 / total.cuentasAsignadas) : 0,
                montoAsignado: total.montoAsignado,
                recaudoDia: total.recaudoDia,
                descuento: '-',
                nc: '-',
                recaudo: total.recaudo,
                porcentajeLiquidacion: total.recaudo ? (total.totalRecaudo * 100 / total.recaudo) : 0,
                totalRecaudo: total.totalRecaudo,
                premiosOficiales: total.premiosOficiales,
                premiosConcurso: total.premiosConcurso,
                total: total.total
            });
        });

        return {
            titulo: tipoReporte,
            tipoLabel: tipoReporte,
            tipoReporte: tipoReporte,
            viewMode: 'resumen_dos_ciudades',
            ciudadesSeleccionadas: cities,
            fechaGeneracion: new Date().toISOString(),
            rows: finalRows,
            resumenResultados: null
        };
    }

    function prepararReporteResumenLiquidacionSimple(liq, tipoReporte) {
        if (!liq) return null;
        var cityCode = toCityCode(liq.cityCode || liquidacionState.selectedCity || '');
        var cityName = getCityNameByCode(cityCode) || cityCode || '-';
        var agg = {};
        (liq.detalle || []).forEach(function (d) {
            var executiveId = normalizeExecutiveId(d.executiveId || d.executiveName);
            if (!executiveId) return;
            if (!agg[executiveId]) {
                agg[executiveId] = {
                    ciudad: String(cityName).toUpperCase(),
                    nombre: getExecutiveNameByCityAndId(cityCode, executiveId) || executiveId,
                    cargo: 'EJECUTIVO',
                    cuentasAsignadas: 0,
                    cuentasCobradas: 0,
                    montoAsignado: 0,
                    recaudoDia: 0,
                    recaudo: 0,
                    totalRecaudo: 0,
                    premiosOficiales: 0,
                    premiosConcurso: 0,
                    total: 0
                };
            }
            var row = agg[executiveId];
            row.cuentasAsignadas += 1;
            if (toNumber(d.pagoAplicado) > 0) row.cuentasCobradas += 1;
            row.montoAsignado += toNumber(d.valorAsignado || d.cuotaMes);
            row.recaudoDia += toNumber(d.pagoAplicado);
            row.recaudo += toNumber(d.pagoAplicado);
            row.totalRecaudo += toNumber(d.valorLiquidado);
            row.total += toNumber(d.valorLiquidado);
        });

        var rows = Object.values(agg).map(function (r) {
            var pctCobrado = r.cuentasAsignadas ? (r.cuentasCobradas * 100 / r.cuentasAsignadas) : 0;
            var pctLiquid = r.recaudo ? (r.totalRecaudo * 100 / r.recaudo) : 0;
            return {
                ciudad: r.ciudad,
                nombre: r.nombre,
                cargo: r.cargo,
                cuentasAsignadas: r.cuentasAsignadas,
                cuentasCobradas: r.cuentasCobradas,
                porcentajeCobrado: pctCobrado,
                montoAsignado: r.montoAsignado,
                recaudoDia: r.recaudoDia,
                descuento: '-',
                nc: '-',
                recaudo: r.recaudo,
                porcentajeLiquidacion: pctLiquid,
                totalRecaudo: r.totalRecaudo,
                premiosOficiales: r.premiosOficiales,
                premiosConcurso: r.premiosConcurso,
                total: r.total
            };
        }).sort(function (a, b) {
            return String(a.nombre).localeCompare(String(b.nombre));
        });

        var total = rows.reduce(function (acc, r) {
            acc.cuentasAsignadas += toNumber(r.cuentasAsignadas);
            acc.cuentasCobradas += toNumber(r.cuentasCobradas);
            acc.montoAsignado += toNumber(r.montoAsignado);
            acc.recaudoDia += toNumber(r.recaudoDia);
            acc.recaudo += toNumber(r.recaudo);
            acc.totalRecaudo += toNumber(r.totalRecaudo);
            acc.premiosOficiales += toNumber(r.premiosOficiales);
            acc.premiosConcurso += toNumber(r.premiosConcurso);
            acc.total += toNumber(r.total);
            return acc;
        }, {
            cuentasAsignadas: 0,
            cuentasCobradas: 0,
            montoAsignado: 0,
            recaudoDia: 0,
            recaudo: 0,
            totalRecaudo: 0,
            premiosOficiales: 0,
            premiosConcurso: 0,
            total: 0
        });

        rows.push({
            __isTotalCity: true,
            ciudad: 'TOTAL',
            nombre: 'CARTERA NORMAL ' + String(cityName).toUpperCase(),
            cargo: '',
            cuentasAsignadas: total.cuentasAsignadas,
            cuentasCobradas: total.cuentasCobradas,
            porcentajeCobrado: total.cuentasAsignadas ? (total.cuentasCobradas * 100 / total.cuentasAsignadas) : 0,
            montoAsignado: total.montoAsignado,
            recaudoDia: total.recaudoDia,
            descuento: '-',
            nc: '-',
            recaudo: total.recaudo,
            porcentajeLiquidacion: total.recaudo ? (total.totalRecaudo * 100 / total.recaudo) : 0,
            totalRecaudo: total.totalRecaudo,
            premiosOficiales: total.premiosOficiales,
            premiosConcurso: total.premiosConcurso,
            total: total.total
        });

        return {
            titulo: tipoReporte,
            tipoLabel: tipoReporte,
            tipoReporte: tipoReporte,
            viewMode: 'resumen_liquidacion',
            ciudad: cityCode || '-',
            ciudadNombre: cityCode ? cityName : '',
            mes: liq.mes || '-',
            fechaInicio: liq.fechaInicio || '',
            fechaFin: liq.fechaFin || '',
            fechaGeneracion: new Date().toISOString(),
            rows: rows,
            resumenResultados: null
        };
    }

    function prepararReporteResumenSupervisorNacional(tipoReporte) {
        var historico = leerHistoricoLiquidaciones();
        if (!historico.length) return null;

        var ultimoPorCiudad = {};
        historico.forEach(function (r) {
            var city = toCityCode(r.cityCode);
            if (!city) return;
            if (!ultimoPorCiudad[city]) {
                ultimoPorCiudad[city] = r;
                return;
            }
            var actual = new Date(r.fechaCreacion || 0).getTime();
            var previo = new Date(ultimoPorCiudad[city].fechaCreacion || 0).getTime();
            if (actual >= previo) ultimoPorCiudad[city] = r;
        });

        var rows = Object.keys(ultimoPorCiudad).sort().map(function (city) {
            var liq = ultimoPorCiudad[city];
            var detalle = liq && liq.detalle ? liq.detalle : [];
            var cuentasAsignadas = detalle.length;
            var cuentasCobradas = detalle.filter(function (d) { return toNumber(d.pagoAplicado) > 0; }).length;
            var montoAsignado = detalle.reduce(function (acc, d) { return acc + toNumber(d.valorAsignado || d.cuotaMes); }, 0);
            var recaudoDia = detalle.reduce(function (acc, d) { return acc + toNumber(d.pagoAplicado); }, 0);
            var totalRecaudo = detalle.reduce(function (acc, d) { return acc + toNumber(d.valorLiquidado); }, 0);
            var cityName = (liq.cityName || getCityNameByCode(city) || city).toUpperCase();
            return {
                nombre: 'CARTERA NORMAL ' + cityName,
                cuentasAsignadas: cuentasAsignadas,
                cuentasCobradas: cuentasCobradas,
                porcentajeCobrado: cuentasAsignadas ? (cuentasCobradas * 100 / cuentasAsignadas) : 0,
                montoAsignado: montoAsignado,
                recaudoDia: recaudoDia,
                descuento: '-',
                nc: '-',
                recaudo: recaudoDia,
                porcentajeLiquidacion: recaudoDia ? (totalRecaudo * 100 / recaudoDia) : 0,
                totalRecaudo: totalRecaudo,
                premiosOficiales: 0,
                premiosConcurso: 0,
                total: totalRecaudo
            };
        });

        if (!rows.length) return null;

        var total = rows.reduce(function (acc, r) {
            acc.cuentasAsignadas += toNumber(r.cuentasAsignadas);
            acc.cuentasCobradas += toNumber(r.cuentasCobradas);
            acc.montoAsignado += toNumber(r.montoAsignado);
            acc.recaudoDia += toNumber(r.recaudoDia);
            acc.recaudo += toNumber(r.recaudo);
            acc.totalRecaudo += toNumber(r.totalRecaudo);
            acc.premiosOficiales += toNumber(r.premiosOficiales);
            acc.premiosConcurso += toNumber(r.premiosConcurso);
            acc.total += toNumber(r.total);
            return acc;
        }, {
            cuentasAsignadas: 0,
            cuentasCobradas: 0,
            montoAsignado: 0,
            recaudoDia: 0,
            recaudo: 0,
            totalRecaudo: 0,
            premiosOficiales: 0,
            premiosConcurso: 0,
            total: 0
        });

        rows.push({
            __isTotalCity: true,
            nombre: 'TOTAL',
            cuentasAsignadas: total.cuentasAsignadas,
            cuentasCobradas: total.cuentasCobradas,
            porcentajeCobrado: total.cuentasAsignadas ? (total.cuentasCobradas * 100 / total.cuentasAsignadas) : 0,
            montoAsignado: total.montoAsignado,
            recaudoDia: total.recaudoDia,
            descuento: '-',
            nc: '-',
            recaudo: total.recaudo,
            porcentajeLiquidacion: total.recaudo ? (total.totalRecaudo * 100 / total.recaudo) : 0,
            totalRecaudo: total.totalRecaudo,
            premiosOficiales: total.premiosOficiales,
            premiosConcurso: total.premiosConcurso,
            total: total.total
        });

        return {
            titulo: tipoReporte,
            tipoLabel: tipoReporte,
            tipoReporte: tipoReporte,
            viewMode: 'resumen_supervisor_nacional',
            ciudad: '-',
            ciudadNombre: '',
            mes: '-',
            fechaInicio: '',
            fechaFin: '',
            fechaGeneracion: new Date().toISOString(),
            rows: rows,
            resumenResultados: null
        };
    }

    function prepararReporteResumenPrejuridico(tipoReporte) {
        var historico = leerHistoricoLiquidaciones();
        if (!historico.length) return null;

        var ultimoPorCiudad = {};
        historico.forEach(function (r) {
            var city = toCityCode(r.cityCode);
            if (!city) return;
            if (!ultimoPorCiudad[city]) {
                ultimoPorCiudad[city] = r;
                return;
            }
            var actual = new Date(r.fechaCreacion || 0).getTime();
            var previo = new Date(ultimoPorCiudad[city].fechaCreacion || 0).getTime();
            if (actual >= previo) ultimoPorCiudad[city] = r;
        });

        var rows = Object.keys(ultimoPorCiudad).sort().map(function (city) {
            var liq = ultimoPorCiudad[city];
            var detalle = liq && liq.detalle ? liq.detalle : [];
            var cuentasAsignadas = detalle.length;
            var cuentasCobradas = detalle.filter(function (d) { return toNumber(d.pagoAplicado) > 0; }).length;
            var montoAsignado = detalle.reduce(function (acc, d) { return acc + toNumber(d.valorAsignado || d.cuotaMes); }, 0);
            var recaudoDia = detalle.reduce(function (acc, d) { return acc + toNumber(d.pagoAplicado); }, 0);
            var totalRecaudo = detalle.reduce(function (acc, d) { return acc + toNumber(d.valorLiquidado); }, 0);
            var cityName = (liq.cityName || getCityNameByCode(city) || city).toUpperCase();

            var ejecutivoTop = {};
            detalle.forEach(function (d) {
                var execId = normalizeExecutiveId(d.executiveId || d.executiveName);
                if (!execId) return;
                if (!ejecutivoTop[execId]) ejecutivoTop[execId] = { count: 0, amount: 0 };
                ejecutivoTop[execId].count += 1;
                ejecutivoTop[execId].amount += toNumber(d.valorLiquidado || d.pagoAplicado);
            });
            var ejecutivoId = Object.keys(ejecutivoTop).sort(function (a, b) {
                if (ejecutivoTop[b].count !== ejecutivoTop[a].count) return ejecutivoTop[b].count - ejecutivoTop[a].count;
                return ejecutivoTop[b].amount - ejecutivoTop[a].amount;
            })[0] || '';
            var nombre = getExecutiveNameByCityAndId(city, ejecutivoId) || ejecutivoId || '-';

            return {
                ciudad: cityName,
                nombre: String(nombre).toUpperCase(),
                cargo: 'PREJURIDICO',
                cuentasAsignadas: cuentasAsignadas,
                cuentasCobradas: cuentasCobradas,
                porcentajeCobrado: cuentasAsignadas ? (cuentasCobradas * 100 / cuentasAsignadas) : 0,
                montoAsignado: montoAsignado,
                recaudoDia: recaudoDia,
                descuento: '-',
                nc: '-',
                recaudo: recaudoDia,
                porcentajeLiquidacion: recaudoDia ? (totalRecaudo * 100 / recaudoDia) : 0,
                totalRecaudo: totalRecaudo,
                premiosOficiales: 0,
                premiosConcurso: 0,
                total: totalRecaudo
            };
        });

        if (!rows.length) return null;

        var total = rows.reduce(function (acc, r) {
            acc.cuentasAsignadas += toNumber(r.cuentasAsignadas);
            acc.cuentasCobradas += toNumber(r.cuentasCobradas);
            acc.montoAsignado += toNumber(r.montoAsignado);
            acc.recaudoDia += toNumber(r.recaudoDia);
            acc.recaudo += toNumber(r.recaudo);
            acc.totalRecaudo += toNumber(r.totalRecaudo);
            acc.premiosOficiales += toNumber(r.premiosOficiales);
            acc.premiosConcurso += toNumber(r.premiosConcurso);
            acc.total += toNumber(r.total);
            return acc;
        }, {
            cuentasAsignadas: 0,
            cuentasCobradas: 0,
            montoAsignado: 0,
            recaudoDia: 0,
            recaudo: 0,
            totalRecaudo: 0,
            premiosOficiales: 0,
            premiosConcurso: 0,
            total: 0
        });

        var nombreTotal = rows[0] && rows[0].nombre ? rows[0].nombre : '-';
        rows.push({
            __isTotalCity: true,
            ciudad: 'TOTAL',
            nombre: nombreTotal,
            cargo: 'PREJURIDICO',
            cuentasAsignadas: total.cuentasAsignadas,
            cuentasCobradas: total.cuentasCobradas,
            porcentajeCobrado: total.cuentasAsignadas ? (total.cuentasCobradas * 100 / total.cuentasAsignadas) : 0,
            montoAsignado: total.montoAsignado,
            recaudoDia: total.recaudoDia,
            descuento: '-',
            nc: '-',
            recaudo: total.recaudo,
            porcentajeLiquidacion: total.recaudo ? (total.totalRecaudo * 100 / total.recaudo) : 0,
            totalRecaudo: total.totalRecaudo,
            premiosOficiales: total.premiosOficiales,
            premiosConcurso: total.premiosConcurso,
            total: total.total
        });

        return {
            titulo: tipoReporte,
            tipoLabel: tipoReporte,
            tipoReporte: tipoReporte,
            viewMode: 'resumen_prejuridico',
            ciudad: '-',
            ciudadNombre: '',
            mes: '-',
            fechaInicio: '',
            fechaFin: '',
            fechaGeneracion: new Date().toISOString(),
            rows: rows,
            resumenResultados: null
        };
    }

    function prepararReporteLiquidacionData(liq, tipoReporte, ejecutivoIdFiltro) {
        if (!liq) return null;
        var ejecutivoObjetivo = normalizeExecutiveId(ejecutivoIdFiltro || '');
        var rowsBase = (liq.detalle || []).filter(function (d) {
            if (!ejecutivoObjetivo) return true;
            return normalizeExecutiveId(d.executiveId || d.executiveName) === ejecutivoObjetivo;
        });
        var rowsDetalle = rowsBase.map(function (d) {
            var cityCode = toCityCode(d.city || liq.cityCode || liquidacionState.selectedCity || '');
            var titular = d.holderName || getTitularNombreByCity(d.city || liq.cityCode, d.holderId) || '-';
            return {
                factura: d.invoiceNumber || '-',
                matricula: d.cuotaCodigo || '-',
                cc: d.holderId || '-',
                titular: String(titular).toUpperCase(),
                ingreso: d.tipoIngreso || cityCode || '-',
                rc: d.recibo || '-',
                fecha: d.fechaPago || '',
                valor: toNumber(d.pagoAplicado)
            };
        });
        var cuentasAsignadas = rowsDetalle.length;
        var cuentasCobradas = rowsBase.filter(function (d) { return toNumber(d.pagoAplicado) > 0; }).length;
        var montoAsignado = rowsBase.reduce(function (acc, d) { return acc + toNumber(d.cuotaMes); }, 0);
        var montoCobradoAlDia = rowsBase.reduce(function (acc, d) { return acc + toNumber(d.pagoAplicado); }, 0);
        var porcentaje = cuentasAsignadas ? (cuentasCobradas * 100 / cuentasAsignadas) : 0;
        var notasDebito = 0;
        var notasCredito = 0;
        return {
            titulo: tipoReporte || 'REPORTE DE LIQUIDACIÓN',
            tipoLabel: liq.tipoLabel || '-',
            tipoReporte: tipoReporte || 'REPORTE DE LIQUIDACIÓN',
            ejecutivoId: ejecutivoObjetivo || '',
            mes: liq.mes || '-',
            ciudad: liq.cityCode || liquidacionState.selectedCity || '-',
            ciudadNombre: liq.cityName || getCityNameByCode(liq.cityCode || liquidacionState.selectedCity) || '',
            fechaInicio: liq.fechaInicio || '',
            fechaFin: liq.fechaFin || '',
            fechaGeneracion: new Date().toISOString(),
            rows: rowsDetalle,
            resumenResultados: {
                cuentasAsignadas: cuentasAsignadas,
                cuentasCobradas: cuentasCobradas,
                porcentaje: porcentaje,
                montoAsignado: montoAsignado,
                montoCobradoAlDia: montoCobradoAlDia,
                notasDebito: notasDebito,
                notasCredito: notasCredito,
                totalMontoLiquidar: montoCobradoAlDia + notasDebito - notasCredito
            }
        };
    }

    function prepararReporteCasasCobranzaExternas(liq, tipoReporte) {
        if (!liq) return null;
        var rowsDetalle = (liq.detalle || []).map(function (d) {
            var titular = d.holderName || getTitularNombreByCity(d.city || liq.cityCode, d.holderId) || '-';
            return {
                factura: d.invoiceNumber || '-',
                matricula: d.cuotaCodigo || '-',
                cctitular: d.holderId || '-',
                titular: String(titular).toUpperCase(),
                ingreso: d.ingresoRef || '-',
                ro: d.recibo || '-',
                fecha: d.fechaPago || '',
                valor: toNumber(d.pagoAplicado)
            };
        });

        var totalRecaudo = rowsDetalle.reduce(function (acc, r) { return acc + toNumber(r.valor); }, 0);
        var porcentaje = 20;
        var valorLiquidar = totalRecaudo * (porcentaje / 100);

        return {
            titulo: tipoReporte,
            tipoLabel: tipoReporte,
            tipoReporte: tipoReporte,
            viewMode: 'detallado_casas_externas',
            mes: liq.mes || '-',
            ciudad: liq.cityCode || liquidacionState.selectedCity || '-',
            ciudadNombre: liq.cityName || getCityNameByCode(liq.cityCode || liquidacionState.selectedCity) || '',
            fechaInicio: liq.fechaInicio || '',
            fechaFin: liq.fechaFin || '',
            fechaGeneracion: new Date().toISOString(),
            rows: rowsDetalle,
            resumenResultados: {
                totalRecaudo: totalRecaudo,
                porcentaje: porcentaje,
                valorLiquidar: valorLiquidar
            }
        };
    }

    function prepararReporteResumenLiquidacionGeneral(tipoReporte) {
        var historico = leerHistoricoLiquidaciones();
        if (!historico.length) return null;

        var ultimoPorCiudad = {};
        historico.forEach(function (r) {
            var city = toCityCode(r.cityCode);
            if (!city) return;
            if (!ultimoPorCiudad[city]) {
                ultimoPorCiudad[city] = r;
                return;
            }
            var actual = new Date(r.fechaCreacion || 0).getTime();
            var previo = new Date(ultimoPorCiudad[city].fechaCreacion || 0).getTime();
            if (actual >= previo) ultimoPorCiudad[city] = r;
        });

        var nombreCasaExterna = 'ERGON NEGOCIACIONES';
        var porcentajeLiquidacionExterno = 20;
        var rows = Object.keys(ultimoPorCiudad).sort().map(function (city) {
            var liq = ultimoPorCiudad[city];
            var detalle = liq && liq.detalle ? liq.detalle : [];
            var cuentasAsignadas = detalle.length;
            var cuentasCobradas = detalle.filter(function (d) { return toNumber(d.pagoAplicado) > 0; }).length;
            var montoAsignado = detalle.reduce(function (acc, d) { return acc + toNumber(d.valorAsignado || d.cuotaMes); }, 0);
            var recaudoDia = detalle.reduce(function (acc, d) { return acc + toNumber(d.pagoAplicado); }, 0);
            var totalGiro = recaudoDia * (porcentajeLiquidacionExterno / 100);
            var cityName = (liq.cityName || getCityNameByCode(city) || city).toUpperCase();
            return {
                ciudad: cityName,
                nombre: nombreCasaExterna,
                cargo: 'EXTERNO',
                cuentasAsignadas: cuentasAsignadas,
                cuentasCobradas: cuentasCobradas,
                porcentajeCobrado: cuentasAsignadas ? (cuentasCobradas * 100 / cuentasAsignadas) : 0,
                montoAsignado: montoAsignado,
                recaudoDia: recaudoDia,
                descuento: '-',
                nc: '-',
                recaudo: recaudoDia,
                porcentajeLiquidacion: porcentajeLiquidacionExterno,
                totalRecaudo: totalGiro,
                premiosOficiales: 0,
                premiosConcurso: 0,
                total: totalGiro
            };
        });

        if (!rows.length) return null;

        var total = rows.reduce(function (acc, r) {
            acc.cuentasAsignadas += toNumber(r.cuentasAsignadas);
            acc.cuentasCobradas += toNumber(r.cuentasCobradas);
            acc.montoAsignado += toNumber(r.montoAsignado);
            acc.recaudoDia += toNumber(r.recaudoDia);
            acc.recaudo += toNumber(r.recaudo);
            acc.totalRecaudo += toNumber(r.totalRecaudo);
            acc.premiosOficiales += toNumber(r.premiosOficiales);
            acc.premiosConcurso += toNumber(r.premiosConcurso);
            acc.total += toNumber(r.total);
            return acc;
        }, {
            cuentasAsignadas: 0,
            cuentasCobradas: 0,
            montoAsignado: 0,
            recaudoDia: 0,
            recaudo: 0,
            totalRecaudo: 0,
            premiosOficiales: 0,
            premiosConcurso: 0,
            total: 0
        });

        rows.push({
            __isTotalCity: true,
            ciudad: 'TOTAL',
            nombre: nombreCasaExterna,
            cargo: '',
            cuentasAsignadas: total.cuentasAsignadas,
            cuentasCobradas: total.cuentasCobradas,
            porcentajeCobrado: total.cuentasAsignadas ? (total.cuentasCobradas * 100 / total.cuentasAsignadas) : 0,
            montoAsignado: total.montoAsignado,
            recaudoDia: total.recaudoDia,
            descuento: '-',
            nc: '-',
            recaudo: total.recaudo,
            porcentajeLiquidacion: porcentajeLiquidacionExterno,
            totalRecaudo: total.totalRecaudo,
            premiosOficiales: total.premiosOficiales,
            premiosConcurso: total.premiosConcurso,
            total: total.total
        });

        return {
            titulo: tipoReporte,
            tipoLabel: tipoReporte,
            tipoReporte: tipoReporte,
            viewMode: 'resumen_general',
            ciudadesSeleccionadas: Object.keys(ultimoPorCiudad),
            mes: '-',
            fechaInicio: '',
            fechaFin: '',
            fechaGeneracion: new Date().toISOString(),
            rows: rows,
            resumenResultados: null
        };
    }

    function cerrarModalTipoReporteLiquidacion() {
        closeModalById('modalTipoReporteLiquidacion');
    }

    function abrirModalTipoReporteLiquidacion() {
        if (!liquidacionState.selectedCity) {
            showNotification('Seleccione una ciudad para generar el reporte.', 'warning');
            showSelectCityModal();
            return;
        }
        var select = document.getElementById('liqTipoReporteSelect');
        var inputEjecutivo = document.getElementById('liqReporteEjecutivoId');
        if (select && !select.value) {
            select.value = 'REPORTE DETALLADO POR EJECUTIVO';
        }
        if (inputEjecutivo) inputEjecutivo.value = '';
        populateReporteCiudadesList();
        actualizarVisibilidadCamposTipoReporteLiquidacion();
        openModalById('modalTipoReporteLiquidacion');
    }

    function abrirReporteLiquidacion(tipoReporteSeleccionado, ejecutivoIdFiltro, ciudadesSeleccionadas) {
        if (tipoReporteSeleccionado === 'RESUMEN LIQUIDACIÓN EJECUTIVOS CON ASIGNACIÓN EN DOS CIUDADES') {
            var reportMultiCity = prepararReporteResumenDosCiudades(tipoReporteSeleccionado, ciudadesSeleccionadas || []);
            if (!reportMultiCity || !reportMultiCity.rows || !reportMultiCity.rows.length) {
                showNotification('No hay datos para el reporte con las ciudades seleccionadas.', 'warning');
                return;
            }
            try {
                localStorage.setItem('auditoriaReporteLiquidacionData', JSON.stringify(reportMultiCity));
                window.open('reportes/reporte-liquidacion.html', '_blank');
            } catch (e) {
                showNotification('No fue posible generar el reporte en este momento.', 'error');
            }
            return;
        }
        if (tipoReporteSeleccionado === 'RESUMEN LIQUIDACIÓN SUPERVISOR NACIONAL') {
            var reportSupervisor = prepararReporteResumenSupervisorNacional(tipoReporteSeleccionado);
            if (!reportSupervisor || !reportSupervisor.rows || !reportSupervisor.rows.length) {
                showNotification('No hay datos para el reporte de supervisor nacional.', 'warning');
                return;
            }
            try {
                localStorage.setItem('auditoriaReporteLiquidacionData', JSON.stringify(reportSupervisor));
                window.open('reportes/reporte-liquidacion.html', '_blank');
            } catch (e) {
                showNotification('No fue posible generar el reporte en este momento.', 'error');
            }
            return;
        }
        if (tipoReporteSeleccionado === 'RESUMEN LIQUIDACIÓN PREJURIDICO') {
            var reportPrejuridico = prepararReporteResumenPrejuridico(tipoReporteSeleccionado);
            if (!reportPrejuridico || !reportPrejuridico.rows || !reportPrejuridico.rows.length) {
                showNotification('No hay datos para el reporte de prejurídico.', 'warning');
                return;
            }
            try {
                localStorage.setItem('auditoriaReporteLiquidacionData', JSON.stringify(reportPrejuridico));
                window.open('reportes/reporte-liquidacion.html', '_blank');
            } catch (e) {
                showNotification('No fue posible generar el reporte en este momento.', 'error');
            }
            return;
        }

        var liq = findSelectedLiquidacion();
        if (!liq || !recordMatchesSelectedCity(liq, liquidacionState.selectedCity)) {
            var disponibles = filterHistorico(liquidacionState.historico, liquidacionState.filtros || { mes: '', fechaInicio: '', fechaFin: '' });
            if (!disponibles.length) {
                showNotification('No hay liquidaciones disponibles para generar reporte.', 'warning');
                return;
            }
            liq = disponibles[disponibles.length - 1];
            liquidacionState.selectedId = liq.id;
        }
        if (tipoReporteSeleccionado === 'CASAS COBRANZAS EXTERNAS: REPORTE DETALLADO') {
            var reportCasas = prepararReporteCasasCobranzaExternas(liq, tipoReporteSeleccionado);
            if (!reportCasas || !reportCasas.rows || !reportCasas.rows.length) {
                showNotification('No se encontraron datos para el reporte de casas cobranzas externas.', 'warning');
                return;
            }
            try {
                localStorage.setItem('auditoriaReporteLiquidacionData', JSON.stringify(reportCasas));
                window.open('reportes/reporte-liquidacion.html', '_blank');
            } catch (e) {
                showNotification('No fue posible generar el reporte en este momento.', 'error');
            }
            return;
        }
        if (tipoReporteSeleccionado === 'RESUMEN LIQUIDACIÓN GENERAL') {
            var reportGeneral = prepararReporteResumenLiquidacionGeneral(tipoReporteSeleccionado);
            if (!reportGeneral || !reportGeneral.rows || !reportGeneral.rows.length) {
                showNotification('No hay datos para el reporte general.', 'warning');
                return;
            }
            try {
                localStorage.setItem('auditoriaReporteLiquidacionData', JSON.stringify(reportGeneral));
                window.open('reportes/reporte-liquidacion.html', '_blank');
            } catch (e) {
                showNotification('No fue posible generar el reporte en este momento.', 'error');
            }
            return;
        }
        var reportData = prepararReporteLiquidacionData(liq, tipoReporteSeleccionado, ejecutivoIdFiltro);
        if (tipoReporteSeleccionado.indexOf('RESUMEN LIQUIDACIÓN') === 0) {
            reportData = prepararReporteResumenLiquidacionSimple(liq, tipoReporteSeleccionado);
        }
        if (!reportData || !reportData.rows || !reportData.rows.length) {
            showNotification('No se encontraron cuentas para el reporte con el filtro seleccionado.', 'warning');
            return;
        }
        try {
            localStorage.setItem('auditoriaReporteLiquidacionData', JSON.stringify(reportData));
            window.open('reportes/reporte-liquidacion.html', '_blank');
        } catch (e) {
            showNotification('No fue posible generar el reporte en este momento.', 'error');
        }
    }

    function actualizarVisibilidadCamposTipoReporteLiquidacion() {
        var select = document.getElementById('liqTipoReporteSelect');
        var wrapEjecutivo = document.getElementById('liqReporteEjecutivoWrap');
        var wrapCiudades = document.getElementById('liqReporteCiudadesWrap');
        var tipo = select ? String(select.value || '').trim() : '';
        if (wrapEjecutivo) {
            wrapEjecutivo.style.display = (tipo === 'REPORTE DETALLADO POR EJECUTIVO') ? 'block' : 'none';
        }
        if (wrapCiudades) {
            wrapCiudades.style.display = (tipo === 'RESUMEN LIQUIDACIÓN EJECUTIVOS CON ASIGNACIÓN EN DOS CIUDADES') ? 'block' : 'none';
        }
    }

    function confirmarTipoReporteLiquidacion() {
        var select = document.getElementById('liqTipoReporteSelect');
        var tipoReporte = select ? String(select.value || '').trim() : '';
        var inputEjecutivo = document.getElementById('liqReporteEjecutivoId');
        var ejecutivoId = normalizeExecutiveId(inputEjecutivo ? inputEjecutivo.value : '');
        var ciudadesSeleccionadas = getSelectedReporteCiudades();
        if (!tipoReporte) {
            showNotification('Seleccione el tipo de reporte.', 'warning');
            return;
        }
        if (tipoReporte === 'REPORTE DETALLADO POR EJECUTIVO' && !ejecutivoId) {
            showNotification('Digite la identificación del ejecutivo para este reporte.', 'warning');
            return;
        }
        if (tipoReporte === 'RESUMEN LIQUIDACIÓN EJECUTIVOS CON ASIGNACIÓN EN DOS CIUDADES' && ciudadesSeleccionadas.length < 2) {
            showNotification('Seleccione al menos dos ciudades para este reporte.', 'warning');
            return;
        }
        cerrarModalTipoReporteLiquidacion();
        abrirReporteLiquidacion(tipoReporte, ejecutivoId, ciudadesSeleccionadas);
    }

    function renderResultadosBusquedaLiquidacion(rows) {
        var tbody = document.getElementById('tbodyResultadosLiquidacion');
        if (!tbody) return;
        if (!rows.length) {
            tbody.innerHTML = '<tr class="no-data-row"><td colspan="8" class="no-data-message"><div class="no-data-content"><i class="fas fa-search"></i><p>No se encontraron resultados</p><small>Ajuste los filtros e intente de nuevo</small></div></td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(function (r) {
            return '<tr data-liq-id="' + escapeHtml(r.id) + '">' +
                '<td>' + escapeHtml(r.tipoLabel || '-') + '</td>' +
                '<td>' + escapeHtml(r.mes || '-') + '</td>' +
                '<td>' + escapeHtml(formatDateLabel(r.fechaInicio) + ' - ' + formatDateLabel(r.fechaFin)) + '</td>' +
                '<td>' + escapeHtml(String(toNumber(r.totales && r.totales.registros))) + '</td>' +
                '<td>' + escapeHtml(formatPoints(r.totales && r.totales.puntos)) + '</td>' +
                '<td>' + escapeHtml(formatMoney(r.totales && r.totales.valorLiquidado)) + '</td>' +
                '<td>' + escapeHtml(formatDateLabel(r.fechaCreacion)) + '</td>' +
                '<td><button type="button" class="btn btn-primary btn-small btn-ver-detalle-liquidacion" data-id="' + escapeHtml(r.id) + '" title="Ver detalle"><i class="fas fa-eye"></i></button></td>' +
                '</tr>';
        }).join('');
    }

    function aplicarBusquedaLiquidacion() {
        var mes = (document.getElementById('liqBuscarMes') || {}).value || '';
        var fechaInicio = (document.getElementById('liqBuscarFechaInicio') || {}).value || '';
        var fechaFin = (document.getElementById('liqBuscarFechaFin') || {}).value || '';
        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            showNotification('La fecha inicial no puede ser mayor a la fecha final.', 'error');
            return;
        }
        liquidacionState.filtros = {
            mes: mes,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin
        };
        var rows = filterHistorico(liquidacionState.historico, liquidacionState.filtros);
        closeBuscarLiquidacionModal();
        renderResultadosBusquedaLiquidacion(rows);
        openModalById('modalResultadosLiquidacion');
        renderHistoricoLiquidaciones();
        toggleLiquidacionView(false);
    }

    function limpiarBusquedaLiquidacion() {
        var mes = document.getElementById('liqBuscarMes');
        var ini = document.getElementById('liqBuscarFechaInicio');
        var fin = document.getElementById('liqBuscarFechaFin');
        if (mes) mes.value = '';
        if (ini) ini.value = '';
        if (fin) fin.value = '';
        liquidacionState.filtros = { mes: '', fechaInicio: '', fechaFin: '' };
        var rows = filterHistorico(liquidacionState.historico, liquidacionState.filtros);
        closeBuscarLiquidacionModal();
        renderResultadosBusquedaLiquidacion(rows);
        openModalById('modalResultadosLiquidacion');
        renderHistoricoLiquidaciones();
        toggleLiquidacionView(false);
    }

    function actualizarHistoricoPersistido() {
        setHistoricoLiquidaciones(liquidacionState.historico);
        renderHistoricoLiquidaciones();
        renderLiquidacionSeleccionada();
    }

    function manejarToggleProximaVigencia(detId, checked) {
        var liq = findSelectedLiquidacion();
        if (!liq) return;
        var det = (liq.detalle || []).find(function (d) { return d.id === detId; });
        if (!det || !det.proximaVigenciaEligible) return;
        det.proximaVigenciaIncluir = !!checked;
        actualizarHistoricoPersistido();
    }

    function initLiquidacion() {
        var historicoTable = document.getElementById('tablaLiquidacionHistorico');
        if (!historicoTable) return;

        // Mismo patrón de otras interfaces: solicitar ciudad al ingresar.
        try {
            sessionStorage.removeItem('selectedCity');
            sessionStorage.removeItem('selectedCityName');
        } catch (e) {
            // No-op
        }

        liquidacionState.historico = leerHistoricoLiquidaciones();
        liquidacionState.selectedId = liquidacionState.historico.length ? liquidacionState.historico[liquidacionState.historico.length - 1].id : '';
        liquidacionState.selectedCity = getSelectedCityCode();
        updateCurrentCityName(liquidacionState.selectedCity);
        updateChangeCityButtonVisibility();

        var cfg = leerConfigLiquidacion();
        liquidacionState.filtros = {
            mes: cfg.mes || '',
            fechaInicio: cfg.fechaInicio || '',
            fechaFin: cfg.fechaFin || ''
        };

        ensureSelectedLiquidacionDisponible();
        renderHistoricoLiquidaciones();
        renderLiquidacionSeleccionada();
        toggleLiquidacionView(false);

        var btnCrear = document.getElementById('btnCrearLiquidacion');
        var btnBuscar = document.getElementById('btnBuscarLiquidacion');
        var btnCerrarTipo = document.getElementById('btnCerrarModalTipoLiquidacion');
        var btnCancelarTipo = document.getElementById('btnCancelarModalTipoLiquidacion');
        var btnConfirmarTipo = document.getElementById('btnConfirmarModalTipoLiquidacion');
        var btnCerrarCrear = document.getElementById('btnCerrarModalCrearLiquidacion');
        var btnCancelarCrear = document.getElementById('btnCancelarModalCrearLiquidacion');
        var btnGuardarCrear = document.getElementById('btnGuardarCrearLiquidacion');
        var btnVolver = document.getElementById('btnVolverLiquidaciones');
        var btnCerrarBuscar = document.getElementById('btnCerrarModalBuscarLiquidacion');
        var btnAplicarBuscar = document.getElementById('btnAplicarBuscarLiquidacion');
        var btnLimpiarBuscar = document.getElementById('btnLimpiarBuscarLiquidacion');
        var btnReporte = document.getElementById('btnReporteLiquidacion');
        var btnCerrarTipoReporte = document.getElementById('btnCerrarTipoReporteLiquidacion');
        var btnCancelarTipoReporte = document.getElementById('btnCancelarTipoReporteLiquidacion');
        var btnConfirmarTipoReporte = document.getElementById('btnConfirmarTipoReporteLiquidacion');
        var selectTipoReporte = document.getElementById('liqTipoReporteSelect');
        var btnChangeCity = document.getElementById('changeCityButton');
        var btnSeleccionarCiudad = document.getElementById('bSeleccionarCiudad');
        var btnCerrarSelectCity = document.getElementById('btnCerrarSelectCityModal');
        var btnCerrarResultados = document.getElementById('btnCerrarResultadosLiquidacion');
        var btnCerrarResultadosFooter = document.getElementById('btnCerrarResultadosLiquidacionFooter');

        if (btnCrear) btnCrear.addEventListener('click', abrirModalTipoLiquidacion);
        if (btnBuscar) btnBuscar.addEventListener('click', openBuscarLiquidacionModal);
        if (btnCerrarTipo) btnCerrarTipo.addEventListener('click', cerrarModalTipoLiquidacion);
        if (btnCancelarTipo) btnCancelarTipo.addEventListener('click', cerrarModalTipoLiquidacion);
        if (btnConfirmarTipo) btnConfirmarTipo.addEventListener('click', confirmarTipoLiquidacionCrear);
        if (btnCerrarCrear) btnCerrarCrear.addEventListener('click', cerrarModalCrearLiquidacion);
        if (btnCancelarCrear) btnCancelarCrear.addEventListener('click', cerrarModalCrearLiquidacion);
        if (btnGuardarCrear) btnGuardarCrear.addEventListener('click', prepararGuardarLiquidacionEC);
        if (btnVolver) btnVolver.addEventListener('click', function () { toggleLiquidacionView(false); });
        if (btnCerrarBuscar) btnCerrarBuscar.addEventListener('click', closeBuscarLiquidacionModal);
        if (btnAplicarBuscar) btnAplicarBuscar.addEventListener('click', aplicarBusquedaLiquidacion);
        if (btnLimpiarBuscar) btnLimpiarBuscar.addEventListener('click', limpiarBusquedaLiquidacion);
        if (btnReporte) btnReporte.addEventListener('click', abrirModalTipoReporteLiquidacion);
        if (btnCerrarTipoReporte) btnCerrarTipoReporte.addEventListener('click', cerrarModalTipoReporteLiquidacion);
        if (btnCancelarTipoReporte) btnCancelarTipoReporte.addEventListener('click', cerrarModalTipoReporteLiquidacion);
        if (btnConfirmarTipoReporte) btnConfirmarTipoReporte.addEventListener('click', confirmarTipoReporteLiquidacion);
        if (selectTipoReporte) selectTipoReporte.addEventListener('change', actualizarVisibilidadCamposTipoReporteLiquidacion);
        if (btnChangeCity) btnChangeCity.addEventListener('click', showSelectCityModal);
        if (btnSeleccionarCiudad) btnSeleccionarCiudad.addEventListener('click', handleSelectCity);
        if (btnCerrarSelectCity) btnCerrarSelectCity.addEventListener('click', function () { hideSelectCityModal(false); });
        if (btnCerrarResultados) btnCerrarResultados.addEventListener('click', closeResultadosLiquidacionModal);
        if (btnCerrarResultadosFooter) btnCerrarResultadosFooter.addEventListener('click', closeResultadosLiquidacionModal);

        var monthCreate = document.getElementById('liqCreateMes');
        var startCreate = document.getElementById('liqCreateFechaInicio');
        var endCreate = document.getElementById('liqCreateFechaFin');
        var execCreate = document.getElementById('liqCreateEjecutivoId');
        var createCitiesList = document.getElementById('liqCreateCiudadesList');
        if (monthCreate) monthCreate.addEventListener('change', function () {
            actualizarRangoDesdeMesCrearLiquidacion();
            updatePreviewCrearLiquidacion();
        });
        if (startCreate) startCreate.addEventListener('change', updatePreviewCrearLiquidacion);
        if (endCreate) endCreate.addEventListener('change', updatePreviewCrearLiquidacion);
        if (execCreate) execCreate.addEventListener('input', updatePreviewCrearLiquidacion);
        if (createCitiesList) {
            createCitiesList.addEventListener('change', function (e) {
                if (e.target && e.target.classList && e.target.classList.contains('liq-create-ciudad-check')) {
                    updatePreviewCrearLiquidacion();
                }
            });
        }

        var tbodyHist = document.getElementById('tbodyLiquidacionHistorico');
        if (tbodyHist) {
            tbodyHist.addEventListener('click', function (e) {
                var btn = e.target.closest('.btn-ver-detalle-liquidacion');
                if (!btn) return;
                liquidacionState.selectedId = btn.getAttribute('data-id') || '';
                renderLiquidacionSeleccionada();
                toggleLiquidacionView(true);
            });
        }

        var tbodyResultados = document.getElementById('tbodyResultadosLiquidacion');
        if (tbodyResultados) {
            tbodyResultados.addEventListener('click', function (e) {
                var btn = e.target.closest('.btn-ver-detalle-liquidacion');
                if (!btn) return;
                liquidacionState.selectedId = btn.getAttribute('data-id') || '';
                closeResultadosLiquidacionModal();
                renderLiquidacionSeleccionada();
                toggleLiquidacionView(true);
            });
        }

        var tbodyDet = document.getElementById('tbodyLiquidacionDetalle');
        if (tbodyDet) {
            tbodyDet.addEventListener('change', function (e) {
                var input = e.target.closest('.liq-toggle-proxima');
                if (!input) return;
                manejarToggleProximaVigencia(input.getAttribute('data-det-id'), input.checked);
            });
        }

        var modalTipo = document.getElementById('modalTipoLiquidacion');
        var modalCrear = document.getElementById('modalCrearLiquidacion');
        var modalBuscar = document.getElementById('modalBuscarLiquidacion');
        var modalTipoReporte = document.getElementById('modalTipoReporteLiquidacion');
        var modalResultados = document.getElementById('modalResultadosLiquidacion');
        var modalSelectCity = document.getElementById('selectCityModal');
        if (modalTipo) modalTipo.addEventListener('click', function (e) { if (e.target === this) cerrarModalTipoLiquidacion(); });
        if (modalCrear) modalCrear.addEventListener('click', function (e) { if (e.target === this) cerrarModalCrearLiquidacion(); });
        if (modalBuscar) modalBuscar.addEventListener('click', function (e) { if (e.target === this) closeBuscarLiquidacionModal(); });
        if (modalTipoReporte) modalTipoReporte.addEventListener('click', function (e) { if (e.target === this) cerrarModalTipoReporteLiquidacion(); });
        if (modalResultados) modalResultados.addEventListener('click', function (e) { if (e.target === this) closeResultadosLiquidacionModal(); });
        if (modalSelectCity) modalSelectCity.addEventListener('click', function (e) { if (e.target === this) hideSelectCityModal(false); });

    }

    function init() {
        initUserDropdown();
        aplicarNombresCargosDesdeAdministrativo();
        inicializarPlantillasSiVacio();
        aplicarLimiteDecimalCincoDigitos(document.getElementById('comisionPorcentajeFijo'));
        aplicarLimiteEnteroDigitos(document.getElementById('comisionMinCuentas'), 10);
        var topNavLinks = document.querySelectorAll('.top-nav-link[data-auditoria-section]');
        topNavLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                var sectionId = link.getAttribute(SECTION_ATTR);
                if (sectionId) showSection(sectionId);
            });
        });
        window.addEventListener('hashchange', function () {
            showSection(getSectionFromHash());
        });
        showSection(getSectionFromHash());

        llenarSelectCargos('comisionCargo');
        llenarSelectCargos('bonoCargo');
        renderTablaComisiones();
        renderTablaBonos();
        initLiquidacion();

        document.getElementById('comisionTipo').addEventListener('change', actualizarVisibilidadComision);
        document.getElementById('bonoTipo').addEventListener('change', actualizarCargosPorTipoBono);
        document.getElementById('btnCrearComision').addEventListener('click', function () { abrirModalComision(null); });
        document.getElementById('btnCerrarModalComision').addEventListener('click', cerrarModalComision);
        document.getElementById('btnCancelarComision').addEventListener('click', cerrarModalComision);
        document.getElementById('btnGuardarComision').addEventListener('click', prepararGuardarComision);
        document.getElementById('btnAgregarRangoComision').addEventListener('click', function () {
            agregarFilaRangoComision('tbodyRangosComision', false);
        });
        document.getElementById('btnAgregarRangoComisionMonto').addEventListener('click', function () {
            agregarFilaRangoComision('tbodyRangosComisionMonto', true);
        });

        document.getElementById('btnCrearBono').addEventListener('click', function () { abrirModalBono(null); });
        document.getElementById('btnCerrarModalBono').addEventListener('click', cerrarModalBono);
        document.getElementById('btnCancelarBono').addEventListener('click', cerrarModalBono);
        document.getElementById('btnGuardarBono').addEventListener('click', prepararGuardarBono);
        document.getElementById('bonoEsConcurso').addEventListener('change', function () {
            document.getElementById('bonoMesesWrap').style.display = this.checked ? 'block' : 'none';
        });
        document.querySelectorAll('input[name="bonoCriterio"]').forEach(function (r) {
            r.addEventListener('change', actualizarLabelRangosBono);
        });
        document.getElementById('btnAgregarRangoBono').addEventListener('click', function () {
            var criterioMonto = document.querySelector('input[name="bonoCriterio"]:checked') &&
                document.querySelector('input[name="bonoCriterio"]:checked').value === 'monto';
            agregarFilaRangoBono(criterioMonto);
        });

        document.getElementById('tbodyComisiones').addEventListener('click', function (e) {
            var btn = e.target.closest('.btn-editar-comision');
            if (btn) abrirModalComision(btn.getAttribute('data-id'));
        });
        document.getElementById('tbodyComisiones').addEventListener('change', function (e) {
            var sw = e.target.closest('.btn-toggle-comision');
            if (sw) solicitarToggleEstado('comision', sw.getAttribute('data-id'), sw.checked);
        });
        document.getElementById('tbodyBonos').addEventListener('click', function (e) {
            var btn = e.target.closest('.btn-editar-bono');
            if (btn) abrirModalBono(btn.getAttribute('data-id'));
        });
        document.getElementById('tbodyBonos').addEventListener('change', function (e) {
            var sw = e.target.closest('.btn-toggle-bono');
            if (sw) solicitarToggleEstado('bono', sw.getAttribute('data-id'), sw.checked);
        });
        var tbodyConcurso = document.getElementById('tbodyBonosConcurso');
        if (tbodyConcurso) {
            tbodyConcurso.addEventListener('click', function (e) {
                var btn = e.target.closest('.btn-editar-bono');
                if (btn) abrirModalBono(btn.getAttribute('data-id'));
            });
            tbodyConcurso.addEventListener('change', function (e) {
                var sw = e.target.closest('.btn-toggle-bono');
                if (sw) solicitarToggleEstado('bono', sw.getAttribute('data-id'), sw.checked);
            });
        }

        document.getElementById('modalComision').addEventListener('click', function (e) {
            if (e.target === this) cerrarModalComision();
        });
        document.getElementById('modalBono').addEventListener('click', function (e) {
            if (e.target === this) cerrarModalBono();
        });

        document.getElementById('btnCerrarConfirmActionAuditoria').addEventListener('click', cerrarConfirmacionAccion);
        document.getElementById('btnCancelarConfirmActionAuditoria').addEventListener('click', cerrarConfirmacionAccion);
        document.getElementById('btnConfirmarActionAuditoria').addEventListener('click', confirmarAccion);
        document.getElementById('btnCerrarSuccessActionAuditoria').addEventListener('click', cerrarExitoAccion);
        document.getElementById('btnAceptarSuccessActionAuditoria').addEventListener('click', cerrarExitoAccion);
        document.getElementById('confirmActionAuditoriaModal').addEventListener('click', function (e) {
            if (e.target === this) cerrarConfirmacionAccion();
        });
        document.getElementById('successActionAuditoriaModal').addEventListener('click', function (e) {
            if (e.target === this) cerrarExitoAccion();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
