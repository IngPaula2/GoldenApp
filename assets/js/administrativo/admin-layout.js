/**
 * Layout compartido del módulo administrativo: menú lateral en móvil / tablet.
 * Requiere body.dashboard-page, aside.sidebar y Font Awesome (icono hamburguesa).
 */
(function () {
    'use strict';

    var BREAKPOINT = 991;
    var ADMIN_USERS_PAGE = '/pages/administrativo/admin-usuarios.html';

    function resolveAdminUsersUrl() {
        var path = (window.location && window.location.pathname) || '';
        var normalizedPath = path.replace(/\\/g, '/');
        var pagesIndex = normalizedPath.toLowerCase().indexOf('/pages/');

        if (pagesIndex >= 0) {
            return normalizedPath.slice(0, pagesIndex) + ADMIN_USERS_PAGE;
        }

        return ADMIN_USERS_PAGE;
    }

    function bindDashboardSidebarRoutes() {
        if (!window.AppRoutes || typeof window.AppRoutes.resolve !== 'function') {
            return;
        }
        var links = document.querySelectorAll('body.dashboard-page aside.sidebar a.nav-link[data-app-route]');
        links.forEach(function (anchor) {
            var key = anchor.getAttribute('data-app-route');
            if (key) {
                anchor.setAttribute('href', window.AppRoutes.resolve(key));
            }
        });
    }

    function bindSidebarModuleNavigationCapture() {
        document.addEventListener(
            'click',
            function (e) {
                if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
                    return;
                }
                var anchor = e.target && e.target.closest
                    ? e.target.closest('aside.sidebar .sidebar-nav a.nav-link[data-app-route]')
                    : null;
                if (!anchor || !window.AppRoutes || typeof window.AppRoutes.resolve !== 'function') {
                    return;
                }
                var key = anchor.getAttribute('data-app-route');
                if (!key) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') {
                    e.stopImmediatePropagation();
                }
                window.location.assign(window.AppRoutes.resolve(key));
            },
            true
        );
    }

    function init() {
        if (document.body && document.body.classList) {
            document.body.classList.add('admin-layout-drawer');
        }
        bindDashboardSidebarRoutes();
        bindSidebarModuleNavigationCapture();
        var sidebar = document.querySelector('body.dashboard-page aside.sidebar');
        if (!sidebar || document.querySelector('.admin-mobile-menu-toggle')) {
            return;
        }

        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'admin-mobile-menu-toggle';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir o cerrar menú de navegación');
        toggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';

        var backdrop = document.createElement('div');
        backdrop.className = 'admin-sidebar-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');

        document.body.appendChild(toggle);
        document.body.appendChild(backdrop);

        var nav = sidebar.querySelector('nav.sidebar-nav');
        if (nav && !nav.id) {
            nav.id = 'admin-sidebar-nav';
        }
        toggle.setAttribute('aria-controls', nav && nav.id ? nav.id : '');

        function isCompact() {
            return window.innerWidth <= BREAKPOINT;
        }

        function closeSidebar() {
            sidebar.classList.remove('open');
            backdrop.classList.remove('is-visible');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        function openSidebar() {
            sidebar.classList.add('open');
            backdrop.classList.add('is-visible');
            toggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }

        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });

        backdrop.addEventListener('click', closeSidebar);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });

        function onResize() {
            if (!isCompact()) {
                closeSidebar();
            }
            toggle.style.display = isCompact() ? 'flex' : 'none';
        }

        window.addEventListener('resize', onResize);
        onResize();

        // Ruta global para "ADMINISTRAR USUARIOS" en cualquier interfaz.
        document.addEventListener('click', function (e) {
            var item = e.target && e.target.closest ? e.target.closest('.admin-users-item') : null;
            if (!item) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }

            window.location.href = resolveAdminUsersUrl();
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
