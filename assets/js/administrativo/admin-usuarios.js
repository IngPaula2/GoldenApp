(function () {
    'use strict';

    var STORAGE_USERS = 'adminUsersData';
    var STORAGE_ROLES = 'adminRolesData';
    var MODULOS_DISPONIBLES = [
        'Administrativo',
        'Facturacion',
        'Tesoreria',
        'Nomina',
        'Cartera',
        'Auditoria',
        'Contabilidad',
        'Administración de usuarios'
    ];
    var SECCIONES_POR_MODULO = {
        'Administrativo': ['Ciudades', 'Titulares', 'Cargos', 'Empleados', 'Organizaciones', 'Planes', 'Consecutivos', 'Control de Consecutivos', 'Cuentas Contables'],
        'Facturacion': ['Contratos', 'Facturas'],
        'Tesoreria': ['Ingreso a Caja', 'Ingreso a Bancos', 'Cuentas Bancarias', 'Cuentas Contables', 'Mantenimiento'],
        'Nomina': ['Nómina Semanal'],
        'Cartera': ['Asignar Factura', 'Estado de Cuenta', 'Historial Cartera', 'Notas'],
        'Auditoria': ['Comisión', 'Bonos', 'Liquidación', 'Reportes'],
        'Contabilidad': ['Contabilidad'],
        'Administración de usuarios': ['Administrar Usuarios']
    };

    var users = [];
    var rolesCatalog = [];
    var filtros = { term: '', estado: '' };
    var currentWizardStep = 1;
    var pendingToggleUsuario = null;
    var pendingSaveUsuario = null;
    var pendingSaveRol = null;

    function byId(id) {
        return document.getElementById(id);
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function initDropdown() {
        var userInfo = document.querySelector('.user-info');
        var dropdown = byId('userDropdown');
        var arrow = document.querySelector('.dropdown-arrow');
        var sidebar = document.querySelector('.sidebar');
        if (!userInfo || !dropdown) return;

        userInfo.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            if (arrow) arrow.classList.toggle('open');
            if (sidebar) sidebar.classList.toggle('dropdown-open');
        });

        document.addEventListener('click', function (e) {
            if (userInfo.contains(e.target)) return;
            dropdown.classList.remove('show');
            if (arrow) arrow.classList.remove('open');
            if (sidebar) sidebar.classList.remove('dropdown-open');
        });

        dropdown.addEventListener('click', function (e) {
            var item = e.target.closest('.dropdown-item');
            if (!item) return;
            if (item.classList.contains('logout-item')) {
                window.location.href = window.AppRoutes.resolve('LOGIN');
                return;
            }
            if (item.classList.contains('admin-users-item')) {
                window.location.href = window.AppRoutes.resolve('ADMIN_USUARIOS');
            }
        });
    }

    function getPasswordValidationError(password, isEdit) {
        var pwd = String(password || '');
        if (isEdit && !pwd) return '';
        if (!isEdit && !pwd) return 'Ingrese la contraseña.';
        if (pwd.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.';
        if (!/[^A-Za-z0-9]/.test(pwd)) return 'La contraseña debe incluir al menos 1 carácter especial.';
        return '';
    }

    function setInputErrorState(inputId, errorId, message) {
        var input = byId(inputId);
        var error = byId(errorId);
        var hasError = !!String(message || '').trim();
        if (input) input.classList.toggle('input-error', hasError);
        if (error) {
            error.textContent = hasError ? message : '';
            error.classList.toggle('show', hasError);
        }
    }

    function validatePasswordField() {
        var isEdit = !!byId('usuarioEditId').value.trim();
        var password = byId('usuarioPassword').value.trim();
        var message = getPasswordValidationError(password, isEdit);
        setInputErrorState('usuarioPassword', 'usuarioPasswordError', message);
        return !message;
    }

    function showInfoUsuarioModal(message, title) {
        var modal = byId('infoUsuarioModal');
        if (!modal) return;
        byId('infoUsuarioTitle').textContent = title || 'ATENCIÓN';
        byId('infoUsuarioText').textContent = String(message || '');
        modal.classList.add('show');
    }

    function closeInfoUsuarioModal() {
        var modal = byId('infoUsuarioModal');
        if (!modal) return;
        modal.classList.remove('show');
    }

    function loadCiudadesDisponibles() {
        try {
            var raw = localStorage.getItem('ciudadesData');
            var data = raw ? JSON.parse(raw) : {};
            if (!data || typeof data !== 'object') return [];
            return Object.keys(data).map(function (code) {
                var item = data[code] || {};
                return {
                    codigo: String(item.codigo || code || '').trim().toUpperCase(),
                    nombre: String(item.nombre || '').trim()
                };
            }).filter(function (c) { return !!c.codigo; })
                .sort(function (a, b) { return a.codigo.localeCompare(b.codigo); });
        } catch (e) {
            return [];
        }
    }

    function renderCiudadesList(selectedCities) {
        var wrap = byId('usuarioCiudadesList');
        if (!wrap) return;
        var selected = Array.isArray(selectedCities) ? selectedCities : [];
        var ciudades = loadCiudadesDisponibles();
        if (!ciudades.length) {
            wrap.innerHTML = '<small>No hay ciudades disponibles.</small>';
            return;
        }
        wrap.innerHTML = ciudades.map(function (c) {
            var isChecked = selected.indexOf(c.codigo) >= 0 ? ' checked' : '';
            var label = c.nombre ? (c.codigo + ' - ' + c.nombre.toUpperCase()) : c.codigo;
            return '<label><input type="checkbox" class="ciudad-check" value="' + escapeHtml(c.codigo) + '"' + isChecked + '> ' + escapeHtml(label) + '</label>';
        }).join('');
    }

    function getSelectedCiudades() {
        return Array.prototype.slice.call(document.querySelectorAll('.ciudad-check:checked'))
            .map(function (el) { return String(el.value || '').trim().toUpperCase(); })
            .filter(Boolean);
    }

    function getCityScopeFromForm() {
        var selected = document.querySelector('input[name="usuarioScopeCiudad"]:checked');
        return selected ? selected.value : 'todas';
    }

    function updateCityScopeVisibility() {
        var scope = getCityScopeFromForm();
        var wrap = byId('usuarioCiudadesWrap');
        if (!wrap) return;
        wrap.style.display = scope === 'seleccion' ? 'grid' : 'none';
    }

    function normalizeUserData(user) {
        var base = user && typeof user === 'object' ? user : {};
        var scope = base.cityScope === 'seleccion' ? 'seleccion' : 'todas';
        var cities = Array.isArray(base.ciudadesAcceso) ? base.ciudadesAcceso : [];
        return {
            cityScope: scope,
            ciudadesAcceso: scope === 'seleccion' ? cities : []
        };
    }

    function normalizeModulosAcceso(user) {
        var base = user && typeof user === 'object' ? user : {};
        var role = getRoleById(base.roleId) || getRoleByName(base.roleNombre || '');
        if (role && Array.isArray(role.modulosAcceso) && role.modulosAcceso.length) {
            return MODULOS_DISPONIBLES.filter(function (modulo) {
                return role.modulosAcceso.indexOf(modulo) >= 0;
            });
        }
        var modulosDesdeUsuario = Array.isArray(base.modulosAcceso) ? base.modulosAcceso : [];
        var modulosDesdeRoles = Array.isArray(base.roles) ? base.roles : [];
        var permisos = base.permisos && typeof base.permisos === 'object' ? base.permisos : {};
        var modulosDesdePermisos = Object.keys(permisos);
        var raw = modulosDesdeUsuario.length ? modulosDesdeUsuario : (modulosDesdeRoles.length ? modulosDesdeRoles : modulosDesdePermisos);
        var normalizados = raw.map(function (modulo) {
            return String(modulo || '').trim() === 'Usuarios' ? 'Administración de usuarios' : modulo;
        });
        return MODULOS_DISPONIBLES.filter(function (modulo) {
            return normalizados.indexOf(modulo) >= 0;
        });
    }

    function setWizardStep(step) {
        var bounded = Math.max(1, Math.min(2, step));
        currentWizardStep = bounded;
        Array.prototype.slice.call(document.querySelectorAll('.wizard-step')).forEach(function (el) {
            el.classList.toggle('active', Number(el.getAttribute('data-step')) === bounded);
        });
        Array.prototype.slice.call(document.querySelectorAll('.stepper-item')).forEach(function (el) {
            el.classList.toggle('active', Number(el.getAttribute('data-step-indicator')) === bounded);
        });
        var btnPrev = byId('btnAnteriorUsuarioStep');
        var btnNext = byId('btnSiguienteUsuarioStep');
        var btnSave = byId('btnGuardarUsuario');
        if (btnPrev) btnPrev.style.display = bounded > 1 ? 'inline-flex' : 'none';
        if (btnNext) btnNext.style.display = bounded < 2 ? 'inline-flex' : 'none';
        if (btnSave) btnSave.style.display = bounded === 2 ? 'inline-flex' : 'none';
    }

    function validateStep(step) {
        if (step === 1) {
            var nombre = byId('usuarioNombre').value.trim();
            var email = byId('usuarioEmail').value.trim();
            var roleId = byId('usuarioRol').value;
            if (!nombre || !email || !roleId || !getRoleById(roleId)) {
                alert('Complete nombre, email y rol para continuar.');
                return false;
            }
            if (!validatePasswordField()) {
                byId('usuarioPassword').focus();
                return false;
            }
            return true;
        }
        if (step === 2) {
            var scope = getCityScopeFromForm();
            if (scope === 'seleccion' && !getSelectedCiudades().length) {
                alert('Seleccione al menos una ciudad para este usuario.');
                return false;
            }
            return true;
        }
        return true;
    }

    function loadUsers() {
        try {
            var raw = localStorage.getItem(STORAGE_USERS);
            if (!raw) return getDefaultUsers();
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : getDefaultUsers();
        } catch (e) {
            return getDefaultUsers();
        }
    }

    function loadRoles() {
        try {
            var raw = localStorage.getItem(STORAGE_ROLES);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveRoles() {
        localStorage.setItem(STORAGE_ROLES, JSON.stringify(rolesCatalog));
    }

    function normalizeSectionName(value) {
        var val = String(value || '').trim().toLowerCase();
        if (val === 'administrativo') return 'administrativo';
        if (val === 'pyf') return 'pyf';
        if (val === 'servicio' || val === 'servicios') return 'servicio';
        return val;
    }

    function getAdministrativeCargosOptions() {
        var baseAdministrativeCargos = [
            'EJECUTIVO DE CUENTA',
            'EJECUTIVO ADMON',
            'EJECUTIVO PREJURIDICO',
            'EJECUTIVO JURIDICO',
            'SUPERVISOR DE CARTERA',
            'SUPERVISOR NACIONAL DE CARTERA',
            'CASTIGO CARTERA',
            'PROXIMA VIGENCIA',
            'VERIFICADOR'
        ];
        var cargoSet = {};
        baseAdministrativeCargos.forEach(function (name) {
            cargoSet[String(name).trim().toUpperCase()] = true;
        });

        try {
            var userCargosRaw = localStorage.getItem('userCargos');
            var modifiedCargosRaw = localStorage.getItem('modifiedCargos');
            var userCargos = userCargosRaw ? JSON.parse(userCargosRaw) : {};
            var modifiedCargos = modifiedCargosRaw ? JSON.parse(modifiedCargosRaw) : {};

            [userCargos, modifiedCargos].forEach(function (bucket) {
                Object.keys(bucket || {}).forEach(function (key) {
                    var item = bucket[key] || {};
                    var section = normalizeSectionName(item.seccion);
                    var isActive = item.activo !== false;
                    var nombre = String(item.nombre || '').trim().toUpperCase();
                    if (section === 'administrativo' && isActive && nombre) {
                        cargoSet[nombre] = true;
                    }
                });
            });
        } catch (e) {
            // Si hay error de parseo, se mantiene el catálogo base.
        }

        return Object.keys(cargoSet).sort(function (a, b) { return a.localeCompare(b); });
    }

    function populateRolCargoOptions(selectedCargo) {
        var select = byId('rolCargo');
        if (!select) return;
        var selected = String(selectedCargo || '').trim().toUpperCase();
        var options = ['<option value="">Seleccione un cargo administrativo</option>'];
        getAdministrativeCargosOptions().forEach(function (cargo) {
            var isSelected = cargo === selected ? ' selected' : '';
            options.push('<option value="' + escapeHtml(cargo) + '"' + isSelected + '>' + escapeHtml(cargo) + '</option>');
        });
        select.innerHTML = options.join('');
    }

    function getRoleById(roleId) {
        return rolesCatalog.find(function (r) { return String(r.id) === String(roleId); }) || null;
    }

    function getRoleByName(roleName) {
        var needle = String(roleName || '').trim().toUpperCase();
        if (!needle) return null;
        return rolesCatalog.find(function (r) {
            return String(r.nombre || '').trim().toUpperCase() === needle;
        }) || null;
    }

    function saveUsers() {
        localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    }

    function getDefaultUsers() {
        return [];
    }

    function removeLegacyDefaultUsers(list) {
        var arr = Array.isArray(list) ? list : [];
        return arr.filter(function (u) {
            var username = String((u && u.username) || '').toLowerCase();
            var email = String((u && u.email) || '').toLowerCase();
            var id = String((u && u.id) || '');
            var isDefaultAdmin = id === 'usr_admin' || (username === 'admin' && email === 'admin@goldenbridge.com');
            var isDefaultAux = id === 'usr_aux' || (username === 'auxadmin' && email === 'auxadmin@goldenbridge.com');
            return !isDefaultAdmin && !isDefaultAux;
        });
    }

    function renderRolesList(selectedRoles) {
        var wrap = byId('rolesList');
        if (!wrap) return;
        var selected = Array.isArray(selectedRoles) ? selectedRoles : [];
        wrap.innerHTML = MODULOS_DISPONIBLES.map(function (modulo) {
            var checked = selected.indexOf(modulo) >= 0 ? ' checked' : '';
            return '<label><input type="checkbox" class="role-check" value="' + escapeHtml(modulo) + '"' + checked + '> ' + escapeHtml(modulo) + '</label>';
        }).join('');
    }

    function renderUserRoleOptions(selectedRoleId) {
        var select = byId('usuarioRol');
        if (!select) return;
        var selected = String(selectedRoleId || '');
        var options = ['<option value="">Seleccione un rol</option>'];
        rolesCatalog.forEach(function (role) {
            var selectedAttr = String(role.id) === selected ? ' selected' : '';
            options.push('<option value="' + escapeHtml(role.id) + '"' + selectedAttr + '>' +
                escapeHtml((role.nombre || '') + ' - ' + (role.cargo || '')) +
                '</option>');
        });
        select.innerHTML = options.join('');
    }

    function renderRolePermissionsPreview(roleId) {
        var cargoInput = byId('usuarioCargoPreview');
        var wrap = byId('usuarioPermisosRolList');
        var role = getRoleById(roleId);
        if (cargoInput) {
            cargoInput.value = role ? String(role.cargo || '') : '';
        }
        if (!wrap) return;
        if (!role) {
            wrap.innerHTML = '<div class="perm-empty">Seleccione un rol para ver sus permisos.</div>';
            return;
        }
        var modulos = Array.isArray(role.modulosAcceso) ? role.modulosAcceso : [];
        if (!modulos.length) {
            wrap.innerHTML = '<div class="perm-empty">El rol no tiene módulos configurados.</div>';
            return;
        }
        var pps = getRolePermisosPorSeccion(role);
        wrap.innerHTML = modulos.map(function (modulo) {
            var secsOrden = SECCIONES_POR_MODULO[modulo] || [modulo];
            var pm = pps[modulo] || {};
            var rows = secsOrden.filter(function (sec) {
                return pm[sec] === 'lector' || pm[sec] === 'editor';
            }).map(function (sec) {
                var nivel = pm[sec] || 'lector';
                return '<div class="perm-row perm-row-seccion">' +
                    '<span class="perm-seccion-label">' + escapeHtml(sec) + '</span>' +
                    '<div><select disabled class="form-select"><option>' + escapeHtml(String(nivel).toUpperCase()) + '</option></select></div>' +
                    '</div>';
            }).join('');
            if (!rows) {
                rows = '<div class="perm-empty perm-empty-inline">Sin secciones habilitadas en este módulo.</div>';
            }
            return '<div class="perm-module-block"><div class="perm-module-heading">' + escapeHtml(modulo) + '</div>' + rows + '</div>';
        }).join('');
    }

    function openModalRol() {
        if (byId('rolEditId')) byId('rolEditId').value = '';
        byId('modalRolTitulo').textContent = 'Crear rol';
        var btnSave = byId('btnGuardarRol');
        if (btnSave) btnSave.textContent = 'Crear rol';
        byId('rolNombre').value = '';
        populateRolCargoOptions('');
        renderRolesList([]);
        renderPermisosList({}, []);
        byId('modalRol').classList.add('show');
    }

    function openModalRolEdit(roleId) {
        var role = getRoleById(roleId);
        if (!role) {
            showInfoUsuarioModal('No se encontró el rol indicado.', 'ROL');
            return;
        }
        if (byId('rolEditId')) byId('rolEditId').value = String(role.id);
        byId('modalRolTitulo').textContent = 'Editar rol';
        var btnSave = byId('btnGuardarRol');
        if (btnSave) btnSave.textContent = 'Actualizar rol';
        byId('rolNombre').value = String(role.nombre || '');
        populateRolCargoOptions(role.cargo || '');
        var modulos = Array.isArray(role.modulosAcceso) ? role.modulosAcceso.slice() : [];
        renderRolesList(modulos);
        renderPermisosList(getRolePermisosPorSeccion(role), modulos);
        byId('modalRol').classList.add('show');
    }

    function closeModalRol() {
        byId('modalRol').classList.remove('show');
        if (byId('rolEditId')) byId('rolEditId').value = '';
        if (byId('modalRolTitulo')) byId('modalRolTitulo').textContent = 'Crear rol';
        var btnSave = byId('btnGuardarRol');
        if (btnSave) btnSave.textContent = 'Crear rol';
    }

    function saveRolFromForm(options) {
        var cfg = options && typeof options === 'object' ? options : {};
        var dryRun = !!cfg.dryRun;
        var editId = byId('rolEditId') ? String(byId('rolEditId').value || '').trim() : '';
        var nombre = byId('rolNombre').value.trim().toUpperCase();
        var cargo = byId('rolCargo').value.trim().toUpperCase();
        var modulos = getSelectedRoles();
        var permisosPorSeccion = mergePermisosPorSeccionForModules(getPermisosPorSeccionFromForm(), modulos);
        var permisos = deriveModulePermisosFromSeccion(permisosPorSeccion, modulos);
        var seccionesPorModulo = deriveSeccionesPorModuloFromPermisosPorSeccion(permisosPorSeccion, modulos);

        if (!nombre || !cargo) {
            showInfoUsuarioModal('Complete nombre del rol y cargo.', 'ROL');
            return null;
        }
        if (!modulos.length) {
            showInfoUsuarioModal('Seleccione al menos un módulo para el rol.', 'ROL');
            return null;
        }
        var cadaModuloTieneSeccionHabilitada = modulos.every(function (modulo) {
            var pm = permisosPorSeccion[modulo] || {};
            return Object.keys(pm).some(function (sec) {
                return pm[sec] === 'lector' || pm[sec] === 'editor';
            });
        });
        if (!cadaModuloTieneSeccionHabilitada) {
            showInfoUsuarioModal('En cada módulo marcado debe habilitar al menos una sección (casilla) y asignarle Lector o Editor.', 'ROL');
            return null;
        }
        var duplicated = rolesCatalog.find(function (r) {
            return String(r.nombre || '').trim().toUpperCase() === nombre && String(r.id) !== String(editId);
        });
        if (duplicated) {
            showInfoUsuarioModal('Ya existe un rol con ese nombre.', 'ROL');
            return null;
        }

        if (dryRun) {
            return {
                ok: true,
                isEdit: !!editId,
                nombre: nombre,
                cargo: cargo,
                modulosAcceso: modulos.slice(),
                permisos: permisos,
                permisosPorSeccion: permisosPorSeccion,
                seccionesPorModulo: seccionesPorModulo
            };
        }

        var permisosPorSeccionStored = JSON.parse(JSON.stringify(permisosPorSeccion));

        if (editId) {
            var idx = rolesCatalog.findIndex(function (r) { return String(r.id) === String(editId); });
            if (idx < 0) {
                showInfoUsuarioModal('No se encontró el rol a actualizar.', 'ROL');
                return null;
            }
            rolesCatalog[idx].nombre = nombre;
            rolesCatalog[idx].cargo = cargo;
            rolesCatalog[idx].modulosAcceso = modulos.slice();
            rolesCatalog[idx].permisosPorSeccion = permisosPorSeccionStored;
            rolesCatalog[idx].permisos = permisos;
            rolesCatalog[idx].seccionesPorModulo = seccionesPorModulo;
            users.forEach(function (u) {
                if (String(u.roleId) !== String(editId)) return;
                u.roleNombre = nombre;
                u.cargo = cargo;
                u.roles = [nombre];
                u.modulosAcceso = modulos.slice();
                u.permisosPorSeccion = JSON.parse(JSON.stringify(permisosPorSeccionStored));
                u.permisos = permisos;
                u.seccionesPorModulo = JSON.parse(JSON.stringify(seccionesPorModulo));
            });
            saveUsers();
            renderTable();
        } else {
            rolesCatalog.push({
                id: 'rol_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                nombre: nombre,
                cargo: cargo,
                modulosAcceso: modulos.slice(),
                permisosPorSeccion: permisosPorSeccionStored,
                permisos: permisos,
                seccionesPorModulo: seccionesPorModulo
            });
        }
        saveRoles();
        renderUserRoleOptions('');
        renderRolePermissionsPreview('');
        closeModalRol();
        return true;
    }

    function openConfirmSaveRol() {
        var dryRun = saveRolFromForm({ dryRun: true });
        if (!dryRun || !dryRun.ok) return;
        pendingSaveRol = dryRun;
        var isEdit = !!dryRun.isEdit;
        var title = byId('confirmSaveRolTitle');
        if (title) title.textContent = isEdit ? 'ACTUALIZAR ROL' : 'CREAR ROL';
        byId('confirmSaveRolText').textContent = isEdit
            ? '¿Está segur@ que desea guardar los cambios del rol "' + dryRun.nombre + '"?'
            : '¿Está segur@ que desea crear el rol "' + dryRun.nombre + '"?';
        byId('confirmSaveRolModal').classList.add('show');
    }

    function closeConfirmSaveRol() {
        pendingSaveRol = null;
        byId('confirmSaveRolModal').classList.remove('show');
    }

    function confirmSaveRol() {
        if (!pendingSaveRol) return;
        var wasEdit = !!pendingSaveRol.isEdit;
        var result = saveRolFromForm();
        closeConfirmSaveRol();
        if (!result) return;
        byId('successSaveRolText').textContent = wasEdit ? 'Rol actualizado exitosamente.' : 'Rol creado exitosamente.';
        byId('successSaveRolModal').classList.add('show');
    }

    function closeSuccessSaveRol() {
        byId('successSaveRolModal').classList.remove('show');
        var reporte = byId('modalReporteRoles');
        if (reporte && reporte.classList.contains('show')) {
            renderReporteRoles();
        }
    }

    function getSelectedRoles() {
        return Array.prototype.slice.call(document.querySelectorAll('.role-check:checked'))
            .map(function (el) { return el.value; });
    }

    function renderPermisosList(permisosPorSeccionParcial, modulosSeleccionados) {
        var wrap = byId('permisosList');
        if (!wrap) return;
        var modulos = Array.isArray(modulosSeleccionados) ? modulosSeleccionados : [];
        if (!modulos.length) {
            wrap.innerHTML = '<div class="perm-empty">Selecciona uno o más módulos arriba para configurar el acceso por sección.</div>';
            return;
        }
        var pps = mergePermisosPorSeccionForModules(
            permisosPorSeccionParcial && typeof permisosPorSeccionParcial === 'object' ? permisosPorSeccionParcial : {},
            modulos
        );
        var parts = [];
        modulos.forEach(function (modulo) {
            parts.push('<div class="perm-module-block"><div class="perm-module-heading">' + escapeHtml(modulo) + '</div>');
            (SECCIONES_POR_MODULO[modulo] || [modulo]).forEach(function (sec) {
                var nivel = (pps[modulo] && pps[modulo][sec]) || '';
                if (nivel !== 'lector' && nivel !== 'editor') nivel = 'lector';
                var habilitada = (pps[modulo] && (pps[modulo][sec] === 'lector' || pps[modulo][sec] === 'editor')) ? true : false;
                parts.push(
                    '<div class="perm-row perm-row-seccion perm-row-seccion-control">' +
                    '<label class="perm-incluir-label">' +
                    '<input type="checkbox" class="perm-seccion-check" data-modulo="' + escapeHtml(modulo) + '" data-seccion="' + escapeHtml(sec) + '"' + (habilitada ? ' checked' : '') + '> ' +
                    '<span class="perm-seccion-nombre">' + escapeHtml(sec) + '</span></label>' +
                    '<select class="perm-seccion-select form-select" data-modulo="' + escapeHtml(modulo) + '" data-seccion="' + escapeHtml(sec) + '"' + (habilitada ? '' : ' disabled') + '>' +
                    '<option value="lector"' + (nivel === 'lector' ? ' selected' : '') + '>Lector</option>' +
                    '<option value="editor"' + (nivel === 'editor' ? ' selected' : '') + '>Editor</option>' +
                    '</select></div>'
                );
            });
            parts.push('</div>');
        });
        wrap.innerHTML = parts.join('');
    }

    function mergePermisosPorSeccionForModules(existing, modulos) {
        var ex = existing && typeof existing === 'object' ? existing : {};
        var out = {};
        (modulos || []).forEach(function (m) {
            out[m] = {};
            (SECCIONES_POR_MODULO[m] || [m]).forEach(function (sec) {
                var n = ex[m] && ex[m][sec];
                if (n === 'editor' || n === 'lector') {
                    out[m][sec] = n;
                }
            });
        });
        return out;
    }

    function buildPermisosPorSeccionFromLegacy(permisos, seccionesPorModulo, modulos) {
        var out = {};
        (modulos || []).forEach(function (modulo) {
            var nivelMod = permisos[modulo] || (modulo === 'Administración de usuarios' ? permisos.Usuarios : '') || 'lector';
            if (nivelMod !== 'lector' && nivelMod !== 'editor') nivelMod = 'lector';
            var todas = (SECCIONES_POR_MODULO[modulo] || [modulo]).slice();
            var activas = Array.isArray(seccionesPorModulo[modulo]) && seccionesPorModulo[modulo].length
                ? seccionesPorModulo[modulo]
                : null;
            out[modulo] = {};
            todas.forEach(function (sec) {
                var incluye = activas == null ? true : activas.indexOf(sec) >= 0;
                if (incluye) {
                    out[modulo][sec] = nivelMod;
                }
            });
        });
        return out;
    }

    function getRolePermisosPorSeccion(role) {
        if (!role || typeof role !== 'object') return {};
        var modulos = Array.isArray(role.modulosAcceso) ? role.modulosAcceso : [];
        if (role.permisosPorSeccion && typeof role.permisosPorSeccion === 'object' && Object.keys(role.permisosPorSeccion).length) {
            return mergePermisosPorSeccionForModules(role.permisosPorSeccion, modulos);
        }
        return buildPermisosPorSeccionFromLegacy(role.permisos || {}, role.seccionesPorModulo || {}, modulos);
    }

    function getStoredPermisosPorSeccionFromRole(role) {
        if (!role || typeof role !== 'object') return {};
        if (role.permisosPorSeccion && typeof role.permisosPorSeccion === 'object' && Object.keys(role.permisosPorSeccion).length) {
            return JSON.parse(JSON.stringify(role.permisosPorSeccion));
        }
        return buildPermisosPorSeccionFromLegacy(role.permisos || {}, role.seccionesPorModulo || {}, role.modulosAcceso || []);
    }

    function deriveModulePermisosFromSeccion(permisosPorSeccion, modulos) {
        var out = {};
        (modulos || []).forEach(function (m) {
            var pm = permisosPorSeccion[m] || {};
            var hasEditor = Object.keys(pm).some(function (k) { return pm[k] === 'editor'; });
            out[m] = hasEditor ? 'editor' : 'lector';
        });
        return out;
    }

    function deriveSeccionesPorModuloFromPermisosPorSeccion(permisosPorSeccion, modulos) {
        var out = {};
        (modulos || []).forEach(function (m) {
            var pm = permisosPorSeccion[m] || {};
            out[m] = Object.keys(pm).filter(function (sec) {
                return pm[sec] === 'lector' || pm[sec] === 'editor';
            });
        });
        return out;
    }

    function getPermisosPorSeccionFromForm() {
        var out = {};
        Array.prototype.slice.call(document.querySelectorAll('.perm-seccion-check:checked')).forEach(function (cb) {
            var m = String(cb.getAttribute('data-modulo') || '').trim();
            var s = String(cb.getAttribute('data-seccion') || '').trim();
            if (!m || !s) return;
            var row = cb.closest('.perm-row-seccion');
            var sel = row ? row.querySelector('.perm-seccion-select') : null;
            if (!sel || sel.disabled) return;
            var v = String(sel.value || '').trim();
            if (!out[m]) out[m] = {};
            out[m][s] = v === 'editor' ? 'editor' : 'lector';
        });
        return out;
    }

    function formatPermisosCompact(permisos) {
        if (!permisos || typeof permisos !== 'object') return [];
        var permisosNormalizados = {};
        Object.keys(permisos).forEach(function (modulo) {
            var moduloUI = modulo === 'Usuarios' ? 'Administración de usuarios' : modulo;
            var nivel = permisos[modulo];
            if (nivel !== 'lector' && nivel !== 'editor') return;
            if (nivel === 'editor' || !permisosNormalizados[moduloUI]) {
                permisosNormalizados[moduloUI] = nivel;
            }
        });
        var editor = [];
        var lector = [];
        Object.keys(permisosNormalizados).forEach(function (modulo) {
            var nivel = permisosNormalizados[modulo];
            if (nivel === 'editor') editor.push(modulo);
            if (nivel === 'lector') lector.push(modulo);
        });
        var parts = [];
        if (editor.length) parts.push('Editor: ' + editor.join(', '));
        if (lector.length) parts.push('Lector: ' + lector.join(', '));
        return parts;
    }

    function formatPermisosCompactForRole(role) {
        if (!role || typeof role !== 'object') return [];
        var pps = getRolePermisosPorSeccion(role);
        var hasDetail = Object.keys(pps).some(function (m) {
            return pps[m] && typeof pps[m] === 'object' && Object.keys(pps[m]).length;
        });
        if (!hasDetail) return formatPermisosCompact(role.permisos || {});
        var editor = [];
        var lector = [];
        Object.keys(pps).forEach(function (m) {
            Object.keys(pps[m] || {}).forEach(function (sec) {
                var label = sec + ' (' + m + ')';
                if (pps[m][sec] === 'editor') editor.push(label);
                else lector.push(label);
            });
        });
        var parts = [];
        if (editor.length) parts.push('Editor: ' + editor.join(', '));
        if (lector.length) parts.push('Lector: ' + lector.join(', '));
        return parts;
    }

    function getUsersByFilters(list) {
        var source = Array.isArray(list) ? list : [];
        return source.filter(function (u) {
            var okEstado = !filtros.estado || String(u.estado) === filtros.estado;
            if (!okEstado) return false;
            if (!filtros.term) return true;
            var hay = [u.username, u.nombre, u.email].join(' ').toLowerCase();
            return hay.indexOf(filtros.term.toLowerCase()) >= 0;
        });
    }

    function filteredUsers() {
        return getUsersByFilters(users);
    }

    function buildAccesosHtml(u) {
        var role = getRoleById(u.roleId) || getRoleByName(u.roleNombre || '');
        var modulosAcceso = normalizeModulosAcceso(u);
        var roleName = role ? String(role.nombre || '') : String(u.roleNombre || '');
        var sectionsMap = role && role.seccionesPorModulo ? role.seccionesPorModulo : (u.seccionesPorModulo || {});
        var sectionsCount = Object.keys(sectionsMap || {}).reduce(function (acc, modulo) {
            var arr = Array.isArray(sectionsMap[modulo]) ? sectionsMap[modulo] : [];
            return acc + arr.length;
        }, 0);
        var parts = [];
        if (roleName) parts.push('<div class="perm-resumen-line"><strong>Rol:</strong> ' + escapeHtml(roleName) + '</div>');
        parts.push('<div class="perm-resumen-line"><strong>Módulos:</strong> ' + String(modulosAcceso.length) + '</div>');
        parts.push('<div class="perm-resumen-line"><strong>Secciones:</strong> ' + String(sectionsCount) + '</div>');
        return parts.join('');
    }

    function openDetalleUsuario(id) {
        var user = users.find(function (u) { return String(u.id) === String(id); });
        if (!user) return;
        var role = getRoleById(user.roleId) || getRoleByName(user.roleNombre || '');
        var modulosAcceso = normalizeModulosAcceso(user);
        var permisos = role ? role.permisos : (user.permisos || {});
        var seccionesMap = role && role.seccionesPorModulo ? role.seccionesPorModulo : (user.seccionesPorModulo || {});
        var cityData = normalizeUserData(user);
        var body = byId('detalleUsuarioBody');
        if (!body) return;

        var syntheticRole = {
            modulosAcceso: modulosAcceso,
            permisos: permisos,
            seccionesPorModulo: seccionesMap,
            permisosPorSeccion: role ? role.permisosPorSeccion : user.permisosPorSeccion
        };
        var permisosItems = formatPermisosCompactForRole(syntheticRole);
        var seccionesItems = Object.keys(seccionesMap || {}).map(function (modulo) {
            var arr = Array.isArray(seccionesMap[modulo]) ? seccionesMap[modulo] : [];
            return arr.length ? (modulo + ': ' + arr.join(', ')) : '';
        }).filter(Boolean);

        body.innerHTML =
            '<div class="detalle-usuario-grid">' +
                '<div class="detalle-usuario-card"><h4>Datos básicos</h4>' +
                    '<ul class="detalle-usuario-list">' +
                        '<li><strong>Nombre:</strong> ' + escapeHtml(user.nombre || '') + '</li>' +
                        '<li><strong>Email:</strong> ' + escapeHtml(user.email || '') + '</li>' +
                        '<li><strong>Cargo:</strong> ' + escapeHtml(user.cargo || '') + '</li>' +
                        '<li><strong>Rol:</strong> ' + escapeHtml((role && role.nombre) || user.roleNombre || 'Sin rol') + '</li>' +
                        '<li><strong>Estado:</strong> ' + escapeHtml(user.estado || '') + '</li>' +
                    '</ul>' +
                '</div>' +
                '<div class="detalle-usuario-card"><h4>Módulos habilitados</h4>' +
                    '<ul class="detalle-usuario-list">' +
                        (modulosAcceso.length ? modulosAcceso.map(function (m) { return '<li>' + escapeHtml(m) + '</li>'; }).join('') : '<li>Sin módulos</li>') +
                    '</ul>' +
                '</div>' +
                '<div class="detalle-usuario-card"><h4>Permisos</h4>' +
                    '<ul class="detalle-usuario-list">' +
                        (permisosItems.length ? permisosItems.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('') : '<li>Sin permisos</li>') +
                    '</ul>' +
                '</div>' +
                '<div class="detalle-usuario-card"><h4>Secciones por módulo</h4>' +
                    '<ul class="detalle-usuario-list">' +
                        (seccionesItems.length ? seccionesItems.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join('') : '<li>Sin secciones</li>') +
                    '</ul>' +
                '</div>' +
                '<div class="detalle-usuario-card"><h4>Ciudades</h4>' +
                    '<ul class="detalle-usuario-list">' +
                        (cityData.cityScope === 'todas' ? '<li>Todas las ciudades</li>' : (cityData.ciudadesAcceso || []).map(function (c) { return '<li>' + escapeHtml(c) + '</li>'; }).join('')) +
                    '</ul>' +
                '</div>' +
            '</div>';
        byId('modalDetalleUsuario').classList.add('show');
    }

    function closeDetalleUsuario() {
        byId('modalDetalleUsuario').classList.remove('show');
    }

    function countSeccionesRol(role) {
        if (!role || typeof role !== 'object') return 0;
        var pps = getRolePermisosPorSeccion(role);
        return Object.keys(pps).reduce(function (acc, m) {
            return acc + Object.keys(pps[m] || {}).length;
        }, 0);
    }

    function renderReporteRoles() {
        var tbody = byId('tbodyReporteRoles');
        if (!tbody) return;
        if (!rolesCatalog.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">' +
                '<div class="no-data-content"><i class="fas fa-user-shield"></i>' +
                '<p>No hay roles creados</p><small>Use «Crear Rol» para definir el primero</small></div></td></tr>';
            return;
        }
        tbody.innerHTML = rolesCatalog.map(function (r) {
            var modulos = Array.isArray(r.modulosAcceso) ? r.modulosAcceso : [];
            var modulosStr = modulos.length ? modulos.join(', ') : '—';
            var permParts = formatPermisosCompactForRole(r);
            var permStr = permParts.length ? permParts.join(' | ') : '—';
            return '<tr>' +
                '<td><strong>' + escapeHtml(r.nombre || '') + '</strong></td>' +
                '<td>' + escapeHtml(r.cargo || '') + '</td>' +
                '<td class="cell-modulos">' + escapeHtml(modulosStr) + '</td>' +
                '<td class="cell-modulos">' + escapeHtml(permStr) + '</td>' +
                '<td>' + String(countSeccionesRol(r)) + '</td>' +
                '<td><button type="button" class="btn btn-secondary btn-edit-rol-tabla" data-action="edit-rol" data-id="' + escapeHtml(r.id) + '">' +
                '<i class="fas fa-edit"></i> Editar</button></td>' +
                '</tr>';
        }).join('');
    }

    function openModalReporteRoles() {
        renderReporteRoles();
        var modal = byId('modalReporteRoles');
        if (modal) modal.classList.add('show');
    }

    function closeModalReporteRoles() {
        var modal = byId('modalReporteRoles');
        if (modal) modal.classList.remove('show');
    }

    function buildCiudadesHtml(u) {
        var cityScope = normalizeUserData(u);
        return cityScope.cityScope === 'todas'
            ? '<span class="city-badge">Todas</span>'
            : '<span class="city-badge">' + escapeHtml((cityScope.ciudadesAcceso || []).join(', ') || 'Sin ciudades') + '</span>';
    }

    function renderTable() {
        var tbody = byId('tbodyUsuarios');
        if (!tbody) return;
        var rows = filteredUsers();
        if (!rows.length) {
            var emptyTitle = (filtros.term || filtros.estado)
                ? 'No se encontraron usuarios con el filtro aplicado'
                : 'No hay usuarios creados';
            var emptyHint = (filtros.term || filtros.estado)
                ? 'Ajusta los filtros o limpia la búsqueda para ver todos los registros'
                : 'Haz clic en "Crear usuario" para registrar el primero';
            tbody.innerHTML = '<tr><td colspan="8" class="no-data-message">' +
                '<div class="no-data-content">' +
                '<i class="fas fa-users-cog"></i>' +
                '<p>' + escapeHtml(emptyTitle) + '</p>' +
                '<small>' + escapeHtml(emptyHint) + '</small>' +
                '</div>' +
                '</td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(function (u) {
            var statusClass = String(u.estado) === 'activo' ? 'status-activo' : 'status-inactivo';
            var isActive = String(u.estado) === 'activo';
            return '<tr>' +
                '<td>' + escapeHtml(u.username) + '</td>' +
                '<td>' + escapeHtml(u.nombre) + '</td>' +
                '<td>' + escapeHtml(u.cargo || '') + '</td>' +
                '<td>' + escapeHtml(u.email) + '</td>' +
                '<td>' + buildAccesosHtml(u) + '</td>' +
                '<td>' + buildCiudadesHtml(u) + '</td>' +
                '<td><span class="status-badge ' + statusClass + '">' + escapeHtml(u.estado) + '</span></td>' +
                '<td><div class="options-wrap">' +
                '<button class="btn-icon-view" data-action="view" data-id="' + escapeHtml(u.id) + '" title="Ver detalle">' +
                '<i class="fas fa-eye"></i>' +
                '</button>' +
                '<button class="btn-icon-edit" data-action="edit" data-id="' + escapeHtml(u.id) + '" title="Editar">' +
                '<i class="fas fa-edit"></i>' +
                '</button>' +
                '<label class="animated-toggle" title="' + (isActive ? 'Desactivar' : 'Activar') + '">' +
                '<input type="checkbox" class="user-status-toggle" data-id="' + escapeHtml(u.id) + '"' + (isActive ? ' checked' : '') + '>' +
                '<span class="toggle-slider"></span>' +
                '</label>' +
                '</div></td>' +
                '</tr>';
        }).join('');
    }

    function openResultadosBusquedaUsuarios() {
        byId('modalResultadosBusquedaUsuarios').classList.add('show');
    }

    function closeResultadosBusquedaUsuarios() {
        byId('modalResultadosBusquedaUsuarios').classList.remove('show');
        filtros = { term: '', estado: '' };
        renderTable();
    }

    function renderResultadosBusquedaUsuarios() {
        var tbody = byId('tbodyResultadosBusquedaUsuarios');
        if (!tbody) return;
        var rows = getUsersByFilters(users);
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data-message">' +
                '<div class="no-data-content">' +
                '<i class="fas fa-search"></i>' +
                '<p>No se encontraron usuarios con el filtro aplicado</p>' +
                '<small>Intenta con otros criterios de búsqueda</small>' +
                '</div>' +
                '</td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(function (u) {
            var statusClass = String(u.estado) === 'activo' ? 'status-activo' : 'status-inactivo';
            var isActive = String(u.estado) === 'activo';
            return '<tr>' +
                '<td>' + escapeHtml(u.username) + '</td>' +
                '<td>' + escapeHtml(u.nombre) + '</td>' +
                '<td>' + escapeHtml(u.cargo || '') + '</td>' +
                '<td>' + escapeHtml(u.email) + '</td>' +
                '<td>' + buildAccesosHtml(u) + '</td>' +
                '<td>' + buildCiudadesHtml(u) + '</td>' +
                '<td><span class="status-badge ' + statusClass + '">' + escapeHtml(u.estado) + '</span></td>' +
                '<td><div class="options-wrap">' +
                '<button class="btn-icon-view" data-action="view" data-id="' + escapeHtml(u.id) + '" title="Ver detalle">' +
                '<i class="fas fa-eye"></i>' +
                '</button>' +
                '<button class="btn-icon-edit" data-action="edit" data-id="' + escapeHtml(u.id) + '" title="Editar">' +
                '<i class="fas fa-edit"></i>' +
                '</button>' +
                '<label class="animated-toggle" title="' + (isActive ? 'Desactivar' : 'Activar') + '">' +
                '<input type="checkbox" class="user-status-toggle" data-id="' + escapeHtml(u.id) + '"' + (isActive ? ' checked' : '') + '>' +
                '<span class="toggle-slider"></span>' +
                '</label>' +
                '</div></td>' +
                '</tr>';
        }).join('');
    }

    function toggleUsuarioEstado(id, checked) {
        var idx = users.findIndex(function (u) { return u.id === id; });
        if (idx < 0) return null;
        users[idx].estado = checked ? 'activo' : 'inactivo';
        saveUsers();
        renderTable();
        renderResultadosBusquedaUsuarios();
        return users[idx];
    }

    function openConfirmToggleUsuario(id, nextChecked) {
        var user = users.find(function (u) { return u.id === id; });
        if (!user) return;
        pendingToggleUsuario = {
            id: id,
            checked: !!nextChecked
        };
        var actionText = nextChecked ? 'activar' : 'desactivar';
        byId('confirmToggleUsuarioTitle').textContent = (actionText + ' usuario').toUpperCase();
        byId('confirmToggleUsuarioText').textContent = '¿Está segur@ que desea ' + actionText + ' el usuario ' + user.username + '?';
        byId('confirmToggleUsuarioModal').classList.add('show');
    }

    function closeConfirmToggleUsuario() {
        pendingToggleUsuario = null;
        byId('confirmToggleUsuarioModal').classList.remove('show');
    }

    function confirmToggleUsuario() {
        if (!pendingToggleUsuario) return;
        var user = toggleUsuarioEstado(pendingToggleUsuario.id, pendingToggleUsuario.checked);
        closeConfirmToggleUsuario();
        if (!user) return;
        byId('successToggleUsuarioText').textContent = 'El estado del usuario ' + user.username + ' se actualizó correctamente.';
        byId('successToggleUsuarioModal').classList.add('show');
    }

    function closeSuccessToggleUsuario() {
        byId('successToggleUsuarioModal').classList.remove('show');
    }

    function openConfirmSaveUsuario() {
        var dryRun = saveUsuarioFromForm({ dryRun: true });
        if (!dryRun || !dryRun.ok) return;
        pendingSaveUsuario = dryRun;
        var isEdit = dryRun.mode === 'update';
        byId('confirmSaveUsuarioTitle').textContent = isEdit ? 'ACTUALIZAR USUARIO' : 'CREAR USUARIO';
        byId('confirmSaveUsuarioText').textContent = isEdit
            ? '¿Está segur@ que desea actualizar este usuario?'
            : '¿Está segur@ que desea crear este usuario?';
        byId('confirmSaveUsuarioModal').classList.add('show');
    }

    function closeConfirmSaveUsuario() {
        pendingSaveUsuario = null;
        byId('confirmSaveUsuarioModal').classList.remove('show');
    }

    function confirmSaveUsuario() {
        if (!pendingSaveUsuario) return;
        var result = saveUsuarioFromForm();
        closeConfirmSaveUsuario();
        if (!result || !result.ok) return;
        closeModalUsuario();
        byId('successSaveUsuarioText').textContent = result.mode === 'update'
            ? 'Usuario actualizado exitosamente.'
            : 'Usuario creado exitosamente.';
        byId('successSaveUsuarioModal').classList.add('show');
    }

    function closeSuccessSaveUsuario() {
        byId('successSaveUsuarioModal').classList.remove('show');
    }

    function openModalUsuario(editId) {
        var isEdit = !!editId;
        var user = isEdit ? users.find(function (u) { return u.id === editId; }) : null;
        byId('usuarioEditId').value = isEdit ? user.id : '';
        byId('modalUsuarioTitulo').textContent = isEdit ? 'Editar usuario' : 'Crear usuario';
        byId('btnGuardarUsuario').textContent = isEdit ? 'Actualizar' : 'Crear';
        byId('usuarioNombre').value = isEdit ? (user.nombre || '') : '';
        byId('usuarioEmail').value = isEdit ? (user.email || '') : '';
        byId('usuarioEstado').value = isEdit ? (user.estado || 'activo') : 'activo';
        byId('usuarioPassword').value = '';
        setInputErrorState('usuarioPassword', 'usuarioPasswordError', '');
        byId('passwordHint').textContent = isEdit
            ? '(dejar vacío para conservar actual; si escribe, mínimo 8 y 1 carácter especial)'
            : '(obligatoria al crear; mínimo 8 y 1 carácter especial)';
        var selectedRole = isEdit ? (user.roleId || '') : '';
        renderUserRoleOptions(selectedRole);
        var cityData = normalizeUserData(user);
        var radioScope = document.querySelector('input[name="usuarioScopeCiudad"][value="' + cityData.cityScope + '"]');
        if (radioScope) radioScope.checked = true;
        renderCiudadesList(cityData.ciudadesAcceso || []);
        updateCityScopeVisibility();
        setWizardStep(1);
        byId('modalUsuario').classList.add('show');
    }

    function closeModalUsuario() {
        byId('modalUsuario').classList.remove('show');
    }

    function saveUsuarioFromForm(options) {
        var cfg = options && typeof options === 'object' ? options : {};
        var dryRun = !!cfg.dryRun;
        var editId = byId('usuarioEditId').value.trim();
        var isEdit = !!editId;
        var nombre = byId('usuarioNombre').value.trim();
        var email = byId('usuarioEmail').value.trim().toUpperCase();
        var roleId = byId('usuarioRol').value;
        var selectedRole = getRoleById(roleId);
        var password = byId('usuarioPassword').value.trim();
        var estado = byId('usuarioEstado').value;
        var cityScope = getCityScopeFromForm();
        var ciudadesAcceso = cityScope === 'seleccion' ? getSelectedCiudades() : [];

        if (!nombre || !email) {
            alert('Complete nombre y email.');
            return null;
        }
        var passwordError = getPasswordValidationError(password, isEdit);
        if (passwordError) {
            setInputErrorState('usuarioPassword', 'usuarioPasswordError', passwordError);
            byId('usuarioPassword').focus();
            return null;
        }
        if (!selectedRole) {
            alert('Seleccione un rol válido para el usuario.');
            return null;
        }
        if (cityScope === 'seleccion' && !ciudadesAcceso.length) {
            alert('Seleccione al menos una ciudad para este usuario.');
            return null;
        }

        var duplicatedEmail = users.find(function (u) { return String(u.email || '').toUpperCase() === email && u.id !== editId; });
        if (duplicatedEmail) {
            showInfoUsuarioModal('Ya existe un usuario con ese email.');
            return null;
        }

        if (dryRun) {
            return {
                ok: true,
                mode: isEdit ? 'update' : 'create'
            };
        }

        if (isEdit) {
            var idx = users.findIndex(function (u) { return u.id === editId; });
            if (idx >= 0) {
                users[idx].nombre = nombre;
                users[idx].email = email;
                users[idx].cargo = selectedRole.cargo;
                users[idx].roleId = selectedRole.id;
                users[idx].roleNombre = selectedRole.nombre;
                users[idx].estado = estado;
                users[idx].roles = [selectedRole.nombre];
                users[idx].modulosAcceso = selectedRole.modulosAcceso.slice();
                users[idx].permisosPorSeccion = JSON.parse(JSON.stringify(getStoredPermisosPorSeccionFromRole(selectedRole)));
                users[idx].permisos = selectedRole.permisos;
                users[idx].seccionesPorModulo = selectedRole.seccionesPorModulo || {};
                users[idx].cityScope = cityScope;
                users[idx].ciudadesAcceso = ciudadesAcceso;
            }
        } else {
            var generatedUsername = email.split('@')[0] || ('USR' + Date.now());
            var usernameBase = generatedUsername;
            var suffix = 1;
            while (users.some(function (u) { return String(u.username || '').toUpperCase() === String(generatedUsername).toUpperCase(); })) {
                generatedUsername = usernameBase + suffix;
                suffix += 1;
            }
            users.push({
                id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                username: generatedUsername,
                nombre: nombre,
                email: email,
                cargo: selectedRole.cargo,
                roleId: selectedRole.id,
                roleNombre: selectedRole.nombre,
                roles: [selectedRole.nombre],
                modulosAcceso: selectedRole.modulosAcceso.slice(),
                permisosPorSeccion: JSON.parse(JSON.stringify(getStoredPermisosPorSeccionFromRole(selectedRole))),
                permisos: selectedRole.permisos,
                seccionesPorModulo: selectedRole.seccionesPorModulo || {},
                cityScope: cityScope,
                ciudadesAcceso: ciudadesAcceso,
                estado: estado
            });
        }

        saveUsers();
        renderTable();
        closeModalUsuario();
        return {
            ok: true,
            mode: isEdit ? 'update' : 'create'
        };
    }

    function deleteUsuario(id) {
        var user = users.find(function (u) { return u.id === id; });
        if (!user) return;
        var ok = window.confirm('¿Desea eliminar el usuario "' + user.username + '"?');
        if (!ok) return;
        users = users.filter(function (u) { return u.id !== id; });
        saveUsers();
        renderTable();
        return {
            ok: true,
            mode: isEdit ? 'update' : 'create'
        };
    }

    function openSearchModal() {
        byId('buscarTextoUsuarios').value = filtros.term || '';
        byId('buscarEstadoUsuarios').value = filtros.estado || '';
        byId('modalBuscarUsuarios').classList.add('show');
    }

    function closeSearchModal() {
        byId('modalBuscarUsuarios').classList.remove('show');
    }

    function applySearch() {
        filtros.term = byId('buscarTextoUsuarios').value.trim();
        filtros.estado = byId('buscarEstadoUsuarios').value;
        renderResultadosBusquedaUsuarios();
        closeSearchModal();
        openResultadosBusquedaUsuarios();
    }

    function clearSearch() {
        filtros = { term: '', estado: '' };
        renderTable();
        closeSearchModal();
        closeResultadosBusquedaUsuarios();
    }

    function forceUppercase(inputId) {
        var input = byId(inputId);
        if (!input) return;
        input.style.textTransform = 'uppercase';
        input.addEventListener('input', function () {
            var start = this.selectionStart;
            var end = this.selectionEnd;
            this.value = this.value.toUpperCase();
            this.setSelectionRange(start, end);
        });
    }

    function bindEvents() {
        // Aplicar mayúsculas automáticas a los campos de texto
        forceUppercase('usuarioNombre');
        forceUppercase('usuarioEmail');
        forceUppercase('rolNombre');
        forceUppercase('buscarTextoUsuarios');
        
        byId('btnCrearRol').addEventListener('click', openModalRol);
        var btnRep = byId('btnReporteRoles');
        if (btnRep) btnRep.addEventListener('click', openModalReporteRoles);
        var btnCerrRep = byId('btnCerrarModalReporteRoles');
        if (btnCerrRep) btnCerrRep.addEventListener('click', closeModalReporteRoles);
        var btnCerrRepF = byId('btnCerrarModalReporteRolesFooter');
        if (btnCerrRepF) btnCerrRepF.addEventListener('click', closeModalReporteRoles);
        var modalRep = byId('modalReporteRoles');
        if (modalRep) {
            modalRep.addEventListener('click', function (e) {
                if (e.target === this) closeModalReporteRoles();
            });
        }
        var tbodyRep = byId('tbodyReporteRoles');
        if (tbodyRep) {
            tbodyRep.addEventListener('click', function (e) {
                var btn = e.target.closest('button[data-action="edit-rol"]');
                if (!btn) return;
                var id = btn.getAttribute('data-id');
                closeModalReporteRoles();
                openModalRolEdit(id);
            });
        }
        byId('btnCrearUsuario').addEventListener('click', function () { openModalUsuario(''); });
        byId('btnBuscarUsuarios').addEventListener('click', openSearchModal);
        byId('btnCerrarModalUsuario').addEventListener('click', closeModalUsuario);
        byId('btnCancelarModalUsuario').addEventListener('click', closeModalUsuario);
        byId('btnGuardarUsuario').addEventListener('click', openConfirmSaveUsuario);
        byId('btnCerrarModalRol').addEventListener('click', closeModalRol);
        byId('btnCancelarModalRol').addEventListener('click', closeModalRol);
        byId('btnGuardarRol').addEventListener('click', openConfirmSaveRol);
        byId('btnCancelSaveRol').addEventListener('click', closeConfirmSaveRol);
        byId('btnConfirmSaveRol').addEventListener('click', confirmSaveRol);
        byId('btnCloseSuccessSaveRol').addEventListener('click', closeSuccessSaveRol);
        byId('btnSiguienteUsuarioStep').addEventListener('click', function () {
            if (!validateStep(currentWizardStep)) return;
            setWizardStep(currentWizardStep + 1);
        });
        byId('btnAnteriorUsuarioStep').addEventListener('click', function () {
            setWizardStep(currentWizardStep - 1);
        });
        byId('btnCerrarModalBuscarUsuarios').addEventListener('click', closeSearchModal);
        byId('btnAplicarBusquedaUsuarios').addEventListener('click', applySearch);
        byId('btnLimpiarBusquedaUsuarios').addEventListener('click', clearSearch);
        byId('btnCerrarResultadosBusquedaUsuarios').addEventListener('click', closeResultadosBusquedaUsuarios);
        byId('btnCerrarResultadosBusquedaUsuariosFooter').addEventListener('click', closeResultadosBusquedaUsuarios);
        byId('btnCancelToggleUsuario').addEventListener('click', closeConfirmToggleUsuario);
        byId('btnConfirmToggleUsuario').addEventListener('click', confirmToggleUsuario);
        byId('btnCloseSuccessToggleUsuario').addEventListener('click', closeSuccessToggleUsuario);
        byId('btnCancelSaveUsuario').addEventListener('click', closeConfirmSaveUsuario);
        byId('btnConfirmSaveUsuario').addEventListener('click', confirmSaveUsuario);
        byId('btnCloseSuccessSaveUsuario').addEventListener('click', closeSuccessSaveUsuario);
        byId('btnCloseInfoUsuario').addEventListener('click', closeInfoUsuarioModal);
        Array.prototype.slice.call(document.querySelectorAll('input[name="usuarioScopeCiudad"]')).forEach(function (radio) {
            radio.addEventListener('change', updateCityScopeVisibility);
        });
        byId('usuarioPassword').addEventListener('input', function () {
            validatePasswordField();
        });
        byId('usuarioPassword').addEventListener('blur', function () {
            validatePasswordField();
        });
        var rolesWrap = byId('rolesList');
        if (rolesWrap) {
            rolesWrap.addEventListener('change', function (e) {
                var target = e.target;
                if (!target || !target.classList || !target.classList.contains('role-check')) return;
                var selectedModulos = getSelectedRoles();
                var mergedPps = mergePermisosPorSeccionForModules(getPermisosPorSeccionFromForm(), selectedModulos);
                renderPermisosList(mergedPps, selectedModulos);
            });
        }

        var permisosWrap = byId('permisosList');
        if (permisosWrap) {
            permisosWrap.addEventListener('change', function (e) {
                var cb = e.target && e.target.closest ? e.target.closest('.perm-seccion-check') : null;
                if (!cb) return;
                var row = cb.closest('.perm-row-seccion');
                var sel = row ? row.querySelector('.perm-seccion-select') : null;
                if (!sel) return;
                sel.disabled = !cb.checked;
                if (cb.checked) {
                    if (sel.value !== 'editor' && sel.value !== 'lector') sel.value = 'lector';
                }
            });
        }

        var table = byId('tbodyUsuarios');
        table.addEventListener('change', function (e) {
            var toggle = e.target.closest('.user-status-toggle');
            if (!toggle) return;
            var id = toggle.getAttribute('data-id');
            var nextChecked = !!toggle.checked;
            toggle.checked = !nextChecked;
            openConfirmToggleUsuario(id, nextChecked);
        });
        table.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-action]');
            if (!btn) return;
            var action = btn.getAttribute('data-action');
            var id = btn.getAttribute('data-id');
            if (action === 'edit') openModalUsuario(id);
            if (action === 'view') openDetalleUsuario(id);
        });
        var resultsTable = byId('tbodyResultadosBusquedaUsuarios');
        if (resultsTable) {
            resultsTable.addEventListener('change', function (e) {
                var toggle = e.target.closest('.user-status-toggle');
                if (!toggle) return;
                var id = toggle.getAttribute('data-id');
                var nextChecked = !!toggle.checked;
                toggle.checked = !nextChecked;
                openConfirmToggleUsuario(id, nextChecked);
            });
            resultsTable.addEventListener('click', function (e) {
                var btn = e.target.closest('button[data-action]');
                if (!btn) return;
                var action = btn.getAttribute('data-action');
                var id = btn.getAttribute('data-id');
                if (action === 'edit') {
                    closeResultadosBusquedaUsuarios();
                    openModalUsuario(id);
                }
                if (action === 'view') {
                    closeResultadosBusquedaUsuarios();
                    openDetalleUsuario(id);
                }
            });
        }

        byId('modalUsuario').addEventListener('click', function (e) {
            if (e.target === this) closeModalUsuario();
        });
        byId('modalBuscarUsuarios').addEventListener('click', function (e) {
            if (e.target === this) closeSearchModal();
        });
        byId('modalRol').addEventListener('click', function (e) {
            if (e.target === this) closeModalRol();
        });
        byId('modalResultadosBusquedaUsuarios').addEventListener('click', function (e) {
            if (e.target === this) closeResultadosBusquedaUsuarios();
        });
        byId('confirmToggleUsuarioModal').addEventListener('click', function (e) {
            if (e.target === this) closeConfirmToggleUsuario();
        });
        byId('successToggleUsuarioModal').addEventListener('click', function (e) {
            if (e.target === this) closeSuccessToggleUsuario();
        });
        byId('confirmSaveUsuarioModal').addEventListener('click', function (e) {
            if (e.target === this) closeConfirmSaveUsuario();
        });
        byId('successSaveUsuarioModal').addEventListener('click', function (e) {
            if (e.target === this) closeSuccessSaveUsuario();
        });
        byId('confirmSaveRolModal').addEventListener('click', function (e) {
            if (e.target === this) closeConfirmSaveRol();
        });
        byId('successSaveRolModal').addEventListener('click', function (e) {
            if (e.target === this) closeSuccessSaveRol();
        });
        byId('infoUsuarioModal').addEventListener('click', function (e) {
            if (e.target === this) closeInfoUsuarioModal();
        });
        byId('btnCerrarDetalleUsuario').addEventListener('click', closeDetalleUsuario);
        byId('btnCerrarDetalleUsuarioFooter').addEventListener('click', closeDetalleUsuario);
        byId('modalDetalleUsuario').addEventListener('click', function (e) {
            if (e.target === this) closeDetalleUsuario();
        });
    }

    function init() {
        initDropdown();
        rolesCatalog = loadRoles();
        users = removeLegacyDefaultUsers(loadUsers());
        saveUsers();
        renderUserRoleOptions('');
        renderRolePermissionsPreview('');
        renderTable();
        bindEvents();
        setWizardStep(1);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
