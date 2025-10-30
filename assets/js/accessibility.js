// Accesibilidad global por teclado para todas las interfaces
// - Enter confirma acciones en modales
// - Escape cierra/cancela modales
// - Foco inicial al abrir modales
// - Toggles .status-toggle navegables con Tab y activables con Enter/Espacio

(function() {
    function isVisibleFlex(overlay) {
        return overlay && overlay.style && overlay.style.display === 'flex';
    }

    function getOpenModalId() {
        try {
            // Preferir cualquier overlay con clase .show (estandarizado en el proyecto)
            var shown = document.querySelectorAll('.modal-overlay.show');
            for (var i = 0; i < shown.length; i++) {
                if (shown[i] && shown[i].id) return shown[i].id;
            }
            // Fallback: overlays visibles por estilo display:flex
            var overlays = document.querySelectorAll('.modal-overlay');
            for (var j = 0; j < overlays.length; j++) {
                if (isVisibleFlex(overlays[j]) && overlays[j].id) return overlays[j].id;
            }
        } catch(e) {}
        return null;
    }

    function focusFirstInModal(modalOverlaySelector) {
        try {
            var overlay = document.getElementById(modalOverlaySelector);
            if (!overlay) return;
            var modal = overlay.querySelector('.modal');
            if (modal) {
                modal.setAttribute('tabindex','-1');
                modal.focus();
            }
        } catch(e) {}
    }

    function enhanceToggles() {
        var toggles = document.querySelectorAll('label.status-toggle');
        toggles.forEach(function(lbl){
            if (!lbl.getAttribute('tabindex')) lbl.setAttribute('tabindex','0');
            if (!lbl.getAttribute('role')) lbl.setAttribute('role','switch');
            var input = lbl.querySelector('input[type="checkbox"]');
            if (input) lbl.setAttribute('aria-checked', input.checked ? 'true' : 'false');
            lbl.addEventListener('keydown', function(ev){
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    var chk = lbl.querySelector('input[type="checkbox"]');
                    if (!chk) return;
                    chk.checked = !chk.checked;
                    lbl.setAttribute('aria-checked', chk.checked ? 'true' : 'false');
                    // Disparar change
                    var evt = document.createEvent('HTMLEvents');
                    evt.initEvent('change', true, false);
                    chk.dispatchEvent(evt);
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function(){
        // Enfocar UNA SOLA VEZ cuando un overlay se abre (sin robar foco continuamente)
        var overlaysFocused = new WeakSet();
        try {
            var moFocus = new MutationObserver(function(mutations){
                mutations.forEach(function(m){
                    if (!m.target || !(m.target.classList && m.target.classList.contains('modal-overlay'))) return;
                    var overlay = m.target;
                    var isShown = overlay.classList.contains('show') || (overlay.style && overlay.style.display === 'flex');
                    if (isShown && !overlaysFocused.has(overlay)) {
                        try {
                            var modal = overlay.querySelector('.modal');
                            if (modal) { modal.setAttribute('tabindex','-1'); modal.focus(); }
                            overlaysFocused.add(overlay);
                        } catch(e) {}
                    }
                    if (!isShown && overlaysFocused.has(overlay)) {
                        overlaysFocused.delete(overlay);
                    }
                });
            });
            moFocus.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class','style'] });
        } catch(e) {}

        // Teclado global para modales
        document.addEventListener('keydown', function(e){
            var openId = getOpenModalId();
            if (!openId) return;
            var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
            var isEditable = false;
            try { isEditable = !!(e.target && (e.target.isContentEditable)); } catch(_) {}
            var isTextInput = tag === 'input' || tag === 'textarea' || tag === 'select' || isEditable;

            if (e.key === 'Escape') {
                var closeBtn = document.querySelector('#'+openId+' .modal .modal-close');
                if (closeBtn) closeBtn.click();
            } else if (e.key === 'Enter' && !isTextInput) {
                // Buscar botón primario del modal abierto
                var primary = document.querySelector('#'+openId+' .modal .btn.btn-primary');
                if (primary) primary.click();
            }
        });

        // Mejora de toggles
        enhanceToggles();
        // Reaplicar cuando cambie el DOM de acciones de tabla
        var mo = new MutationObserver(function(){ enhanceToggles(); });
        mo.observe(document.body, { childList: true, subtree: true });

        // ===============================
        // Restricción de campos de teléfono (10 dígitos)
        // Detecta inputs: type="tel" o con id/name que incluyan telefono|celular|phone
        // ===============================
        function isPhoneInput(el){
            if (!el || el.tagName !== 'INPUT') return false;
            var type = (el.getAttribute('type')||'').toLowerCase();
            var id = (el.getAttribute('id')||'').toLowerCase();
            var name = (el.getAttribute('name')||'').toLowerCase();
            var ph = el.hasAttribute('data-phone');
            return ph || type === 'tel' || /telefono|celular|phone/.test(id) || /telefono|celular|phone/.test(name);
        }

        function enforcePhone(el){
            try { el.setAttribute('maxlength','10'); } catch(e) {}
            el.addEventListener('input', function(){
                var digits = (el.value||'').replace(/\D+/g,'').slice(0,10);
                if (el.value !== digits) el.value = digits;
            });
            el.addEventListener('keydown', function(e){
                // Permitir controles y navegación
                var allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'];
                if (allowed.indexOf(e.key) !== -1) return;
                // Solo dígitos si no excede 10
                if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
                if ((el.value||'').length >= 10 && el.selectionStart === el.selectionEnd) {
                    e.preventDefault();
                }
            });
        }

        function scanPhones(){
            var inputs = document.querySelectorAll('input');
            inputs.forEach(function(el){ if (isPhoneInput(el) && !el.__phoneEnforced){ enforcePhone(el); el.__phoneEnforced = true; } });
        }

        scanPhones();
        var mo2 = new MutationObserver(function(){ scanPhones(); });
        mo2.observe(document.body, { childList: true, subtree: true });
    });
})();


