/**
 * Enrutamiento centralizado — Golden App
 */
(function (global) {
    'use strict';

    var PATH = {
        LOGIN: '/index.html',
        LOGIN_PAGES: '/pages/login.html',
        ADMIN_CIUDADES: '/pages/administrativo/admin-ciudades.html',
        ADMIN_USUARIOS: '/pages/administrativo/admin-usuarios.html',
        ADMIN_EMPLEADOS: '/pages/administrativo/admin-empleados.html',
        MODULE_ADMIN: '/pages/administrativo/admin-ciudades.html',
        MODULE_FACTURACION: '/pages/facturacion/contratos/fac-contratos.html',
        MODULE_TESORERIA: '/pages/tesoreria/ingreso-caja/ingreso-caja.html',
        MODULE_NOMINA: '/pages/nomina/nomina-semanal/nomina-semanal.html',
        MODULE_CARTERA: '/pages/cartera/asignar-factura/asignar-factura.html',
        MODULE_AUDITORIA: '/pages/auditoria/auditoria.html',
        MODULE_CONTABILIDAD: '/pages/contabilidad/contabilidad.html'
    };

    function normalizePathname(path) {
        return String(path || '').replace(/\\/g, '/');
    }

    function getAppBasePath() {
        var path = normalizePathname(global.location && global.location.pathname);
        var idx = path.toLowerCase().indexOf('/pages/');
        if (idx >= 0) {
            return path.slice(0, idx);
        }
        var lower = path.toLowerCase();
        if (lower.endsWith('/index.html') || lower.endsWith('/login.html')) {
            var slash = path.lastIndexOf('/');
            return slash > 0 ? path.slice(0, slash) : '';
        }
        return '';
    }

    function resolve(routeKeyOrPath) {
        var rel = PATH[routeKeyOrPath];
        if (rel == null) {
            rel = routeKeyOrPath;
        }
        if (typeof rel !== 'string') {
            return getAppBasePath() + '/';
        }
        if (rel.charAt(0) !== '/') {
            rel = '/' + rel;
        }
        return getAppBasePath() + rel;
    }

    function navigate(routeKeyOrPath) {
        global.location.href = resolve(routeKeyOrPath);
    }

    global.AppRoutes = {
        PATH: PATH,
        getAppBasePath: getAppBasePath,
        resolve: resolve,
        navigate: navigate
    };
})(typeof window !== 'undefined' ? window : this);
