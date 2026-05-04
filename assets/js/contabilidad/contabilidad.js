document.addEventListener('DOMContentLoaded', function () {
    initUserDropdown();
    initMigrarButtons();
    initMigrarTesoreriaFlow();
    initMigrarCarteraFlow();
});

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
            window.location.href = window.AppRoutes.resolve('ADMIN_USUARIOS');
            return;
        }
        if (item.classList.contains('logout-item')) {
            closeDropdown();
            showConfirmLogoutModal();
            return;
        }
        closeDropdown();
    });

    var btnCancelar = document.getElementById('btnCancelarLogout');
    var btnConfirmar = document.getElementById('btnConfirmarLogout');

    if (btnCancelar) btnCancelar.addEventListener('click', hideConfirmLogoutModal);
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', function () {
            window.location.href = window.AppRoutes.resolve('LOGIN');
        });
    }
}

function showConfirmLogoutModal() {
    var modal = document.getElementById('confirmLogoutModal');
    if (modal) modal.style.display = 'flex';
}

function hideConfirmLogoutModal() {
    var modal = document.getElementById('confirmLogoutModal');
    if (modal) modal.style.display = 'none';
}

function initMigrarButtons() {
    document.querySelectorAll('.btn-migrar-siigo').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var seccion = btn.getAttribute('data-seccion') || '';
            if (seccion === 'tesoreria') {
                showModalById('modalMigrarSiigoTesoreria');
                return;
            }
            if (seccion === 'cartera') {
                showModalById('modalMigrarSiigoCartera');
                return;
            }
            showNotification('Migración a SIIGO (' + seccion + ') en desarrollo.', 'info');
        });
    });
}

function initMigrarTesoreriaFlow() {
    var btnCancelar = document.getElementById('btnCancelarMigrarSiigoTesoreria');
    var btnMigrar = document.getElementById('btnMigrarSiigoTesoreria');
    var btnCancelarConfirm = document.getElementById('btnCancelarConfirmMigrarSiigoTesoreria');
    var btnConfirmar = document.getElementById('btnConfirmarMigrarSiigoTesoreria');
    var btnAceptarSuccess = document.getElementById('btnAceptarSuccessMigrarSiigoTesoreria');

    if (btnCancelar) {
        btnCancelar.addEventListener('click', function () {
            hideModalById('modalMigrarSiigoTesoreria');
        });
    }

    if (btnMigrar) {
        btnMigrar.addEventListener('click', function () {
            var fechaInicio = (document.getElementById('siigoFechaInicio') || {}).value || '';
            var fechaFin = (document.getElementById('siigoFechaFin') || {}).value || '';
            if (!fechaInicio || !fechaFin) {
                showNotification('Complete Fecha Inicio y Fecha Fin para migrar.', 'warning');
                return;
            }
            if (new Date(fechaInicio) > new Date(fechaFin)) {
                showNotification('La Fecha Inicio no puede ser mayor a la Fecha Fin.', 'warning');
                return;
            }
            showModalById('confirmMigrarSiigoTesoreriaModal');
        });
    }

    if (btnCancelarConfirm) {
        btnCancelarConfirm.addEventListener('click', function () {
            hideModalById('confirmMigrarSiigoTesoreriaModal');
        });
    }

    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', function () {
            var fechaInicio = (document.getElementById('siigoFechaInicio') || {}).value || '';
            var fechaFin = (document.getElementById('siigoFechaFin') || {}).value || '';
            var payload = {
                seccion: 'tesoreria',
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                fechaSolicitud: new Date().toISOString()
            };
            localStorage.setItem('contabilidadMigracionSiigoTesoreria', JSON.stringify(payload));
            hideModalById('confirmMigrarSiigoTesoreriaModal');
            showModalById('successMigrarSiigoTesoreriaModal');
        });
    }

    if (btnAceptarSuccess) {
        btnAceptarSuccess.addEventListener('click', function () {
            hideModalById('successMigrarSiigoTesoreriaModal');
            hideModalById('modalMigrarSiigoTesoreria');
            window.open('reportes/reporte-migracion-siigo-tesoreria.html', '_blank');
        });
    }

}

function initMigrarCarteraFlow() {
    var btnCancelar = document.getElementById('btnCancelarMigrarSiigoCartera');
    var btnMigrar = document.getElementById('btnMigrarSiigoCartera');
    var btnCancelarConfirm = document.getElementById('btnCancelarConfirmMigrarSiigoCartera');
    var btnConfirmar = document.getElementById('btnConfirmarMigrarSiigoCartera');
    var btnAceptarSuccess = document.getElementById('btnAceptarSuccessMigrarSiigoCartera');
    var inputCentro = document.getElementById('siigoCarteraCentroCostos');

    if (inputCentro) {
        inputCentro.addEventListener('input', function () {
            inputCentro.value = String(inputCentro.value || '').replace(/\D/g, '').slice(0, 3);
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', function () {
            hideModalById('modalMigrarSiigoCartera');
        });
    }

    if (btnMigrar) {
        btnMigrar.addEventListener('click', function () {
            var fechaInicio = (document.getElementById('siigoCarteraFechaInicio') || {}).value || '';
            var fechaFin = (document.getElementById('siigoCarteraFechaFin') || {}).value || '';
            var centroCostos = (document.getElementById('siigoCarteraCentroCostos') || {}).value || '';
            if (!fechaInicio || !fechaFin) {
                showNotification('Complete Fecha Inicio y Fecha Fin para migrar.', 'warning');
                return;
            }
            if (new Date(fechaInicio) > new Date(fechaFin)) {
                showNotification('La Fecha Inicio no puede ser mayor a la Fecha Fin.', 'warning');
                return;
            }
            if (!centroCostos || !/^\d{1,3}$/.test(centroCostos)) {
                showNotification('Centro de Costos debe ser numérico y máximo de 3 dígitos.', 'warning');
                return;
            }
            showModalById('confirmMigrarSiigoCarteraModal');
        });
    }

    if (btnCancelarConfirm) {
        btnCancelarConfirm.addEventListener('click', function () {
            hideModalById('confirmMigrarSiigoCarteraModal');
        });
    }

    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', function () {
            var fechaInicio = (document.getElementById('siigoCarteraFechaInicio') || {}).value || '';
            var fechaFin = (document.getElementById('siigoCarteraFechaFin') || {}).value || '';
            var centroCostos = (document.getElementById('siigoCarteraCentroCostos') || {}).value || '';
            var payload = {
                seccion: 'cartera',
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                centroCostos: centroCostos,
                fechaSolicitud: new Date().toISOString()
            };
            localStorage.setItem('contabilidadMigracionSiigoCartera', JSON.stringify(payload));
            hideModalById('confirmMigrarSiigoCarteraModal');
            showModalById('successMigrarSiigoCarteraModal');
        });
    }

    if (btnAceptarSuccess) {
        btnAceptarSuccess.addEventListener('click', function () {
            hideModalById('successMigrarSiigoCarteraModal');
            hideModalById('modalMigrarSiigoCartera');
            window.open('reportes/reporte-migracion-siigo-cartera.html', '_blank');
        });
    }

}

function showModalById(id) {
    var modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

function hideModalById(id) {
    var modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function showNotification(message, type) {
    var notification = document.createElement('div');
    notification.className = 'notification notification-' + (type || 'info');
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(function () { notification.classList.add('show'); }, 80);
    setTimeout(function () {
        notification.classList.remove('show');
        setTimeout(function () {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 250);
    }, 2800);
}
