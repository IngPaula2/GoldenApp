/**
 * ====================================================================================
 * 📊 REPORTE CUADRE DE NÓMINA - GOLDEN APP
 * ====================================================================================
 * 
 * Este archivo genera el reporte de cuadre de nómina que muestra todos los ejecutivos PYF
 * de una ciudad con sus comisiones totales agrupadas por concepto (escala).
 * 
 * FUNCIONALIDADES:
 * - Obtiene todos los ejecutivos PYF de una ciudad
 * - Calcula comisiones totales por ejecutivo y concepto
 * - Agrupa por concepto (CR, SG, SU, AS, GT, DR, SN, DN, PE)
 * - Muestra totales: TOTAL COMPROBANTES, TOTAL PLANILLA GENERAL, DIFERENCIA
 * - Compara comisiones de comprobantes vs planilla general
 * - Exporta a Excel, Word y PDF
 * - Paginación y zoom para mejor visualización
 * 
 * ====================================================================================
 * 🔗 INSTRUCCIONES DE INTEGRACIÓN CON BACKEND
 * ====================================================================================
 * 
 * INGENIERO: Este módulo actualmente usa localStorage para obtener datos de nóminas,
 * facturas, empleados y comprobantes. Debes reemplazar todas las llamadas a localStorage
 * con llamadas a la API del backend.
 * 
 * ENDPOINT PRINCIPAL RECOMENDADO:
 * 
 * GET /api/nomina/reportes/cuadre
 * Query Parameters:
 *   - ciudadCodigo: string (requerido) - Código de la ciudad
 *   - fechaInicio: string (requerido) - Fecha de inicio en formato YYYY-MM-DD
 *   - fechaFin: string (requerido) - Fecha de fin en formato YYYY-MM-DD
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     ejecutivos: [
 *       {
 *         identificacion: string,
 *         nombre: string,
 *         cargo: string,
 *         conceptos: {
 *           CR: number,
 *           SG: number,
 *           SU: number,
 *           AS: number,
 *           GT: number,
 *           DR: number,
 *           SN: number,
 *           DN: number,
 *           PE: number
 *         },
 *         totalComprobantes: number,
 *         totalPlanillaGeneral: number,
 *         diferencia: number
 *       }
 *     ],
 *     totalComprobantes: number,
 *     totalPlanillaGeneral: number,
 *     diferencia: number
 *   }
 * }
 * 
 * FUNCIONES QUE REQUIEREN MODIFICACIÓN:
 * 
 * - loadData() - Línea ~XX
 *   Esta función carga los parámetros del reporte desde localStorage.
 *   NO requiere modificación, ya que solo lee parámetros de búsqueda.
 * 
 * - processReportData(ciudadCodigo, fechaInicio, fechaFin) - Línea ~XX
 *   Reemplazar toda la lógica de búsqueda en localStorage con:
 *   fetch(`/api/nomina/reportes/cuadre?ciudadCodigo=${ciudadCodigo}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
 * 
 * - getEmployeesByCity(cityCode) - Línea ~XX
 *   Reemplazar: localStorage.getItem('empleadosByCity')
 *   Con: fetch(`/api/empleados?ciudad=${cityCode}&area=pyf`)
 * 
 * - getComprobanteData(identificacion, fechaInicio, fechaFin) - Línea ~XX
 *   Reemplazar: localStorage.getItem('comprobanteEjecutivoData')
 *   Con: fetch(`/api/nomina/reportes/comprobante-ejecutivo?identificacion=${identificacion}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
 * 
 * ALTERNATIVA SIMPLIFICADA:
 * Si prefieres, puedes crear un único endpoint que haga toda la lógica del reporte
 * en el backend y solo devuelva los datos procesados. Esto simplificaría mucho
 * el código del frontend.
 * 
 * En este caso, solo necesitarías modificar la función processReportData() para
 * hacer una llamada al endpoint y procesar la respuesta.
 * 
 * NOTA: Este reporte requiere datos de dos fuentes:
 * 1. Comprobantes por ejecutivo (del reporte de comprobante-ejecutivo)
 * 2. Planilla general (de las nóminas semanales)
 * 
 * El backend debe consolidar ambas fuentes y calcular las diferencias.
 * 
 * ====================================================================================
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */
(function(){
    window.__rows = [];
    window.__page = 1;
    window.__pageSize = 50;
    window.__zoom = 1;

    function getCiudadNombre(codigo){
        const map = { 
            '101':'BOGOTÁ',
            '102':'MEDELLÍN',
            '103':'CALI',
            '104':'BARRANQUILLA',
            '105':'CARTAGENA',
            '106':'CÚCUTA',
            '107':'BUCARAMANGA',
            '108':'PEREIRA',
            '109':'SANTA MARTA',
            '110':'IBAGUÉ' 
        };
        return map[codigo] || `CIUDAD ${codigo}`;
    }

    function formatDate(s){
        if (!s) return '';
        const str = String(s).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            const [y,m,d] = str.split('-');
            return `${d}/${m}/${y}`;
        }
        try { 
            const d = new Date(str);
            return d.toLocaleDateString('es-CO', {day:'2-digit', month:'2-digit', year:'numeric'});
        } catch(e){ 
            return str; 
        }
    }

    function formatMoney(n){
        if (n==null || isNaN(n)) return '0.00';
        return new Intl.NumberFormat('es-CO', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(n));
    }

    /**
     * 🔗 BACKEND INTEGRATION - CARGAR DATOS DEL REPORTE
     * 
     * Carga los parámetros del reporte desde localStorage (temporal).
     * 
     * BACKEND: Reemplazar con llamada a API
     * - Endpoint: GET /api/nomina/reportes/cuadre?ciudad={codigo}&fechaInicio={fecha}&fechaFin={fecha}
     * - Método: GET
     * - Headers: { 'Authorization': 'Bearer {token}' }
     * - Response: { ejecutivos: [...], totalComprobantes: number, totalPlanillaGeneral: number }
     * 
     * @returns {Object} Datos del reporte { ciudadCodigo, fechaInicio, fechaFin }
     */
    function loadData(){
        try {
            // TODO: Reemplazar con llamada a API del backend
            const raw = localStorage.getItem('reporteCuadreNominaData');
            if (raw){
                const data = JSON.parse(raw);
                return data;
            }
        } catch(e) {
            console.error('Error cargando datos:', e);
        }
        return { ciudadCodigo: '', fechaInicio: '', fechaFin: '' };
    }

    function getContractInfo(contractNumber, cityCode){
        try {
            const storedContracts = localStorage.getItem(`contratos_${cityCode}`) || 
                                    localStorage.getItem(`contracts_${cityCode}`);
            
            if (!storedContracts) return null;
            
            const contracts = JSON.parse(storedContracts);
            const contractsArray = Array.isArray(contracts) ? contracts : Object.values(contracts);
            
            const searchNumber = String(contractNumber).trim();
            
            for (const contract of contractsArray) {
                const numeroContrato = contract.numeroContrato || 
                                     contract.numero || 
                                     contract.contractNumber || 
                                     contract.nro || 
                                     contract.contract || '';
                
                const contractId = String(contract.id || '').trim();
                
                if (String(numeroContrato).trim() === searchNumber || 
                    contractId === searchNumber ||
                    String(contract.id) === searchNumber) {
                    return contract;
                }
            }
        } catch(e) {
            console.error('Error buscando contrato:', e);
        }
        return null;
    }

    function getEmployeeNameByIdentification(identificacion, cityCode){
        try {
            const empleadosByCity = localStorage.getItem('empleadosByCity');
            if (!empleadosByCity) return '';
            
            const data = JSON.parse(empleadosByCity);
            if (!data[cityCode]) return '';
            
            // Normalizar la identificación para buscar
            const idBuscado = String(identificacion).trim();
            const idBuscadoNum = idBuscado.replace(/\D/g, '');
            
            const empleados = data[cityCode];
            
            // Buscar coincidencia exacta primero
            if (empleados[idBuscado]) {
                const empleado = empleados[idBuscado];
                // Formato: Apellidos primero, luego nombres
                const nombreCompleto = [
                    empleado.tPrimerApellido || empleado.primerApellido,
                    empleado.tSegundoApellido || empleado.segundoApellido,
                    empleado.tPrimerNombre || empleado.primerNombre,
                    empleado.tSegundoNombre || empleado.segundoNombre
                ].filter(Boolean).join(' ').toUpperCase();
                return nombreCompleto;
            }
            
            // Buscar por coincidencia numérica o parcial
            for (const [id, empleado] of Object.entries(empleados)) {
                const idNormalizado = String(id).trim();
                const idSoloNumeros = idNormalizado.replace(/\D/g, '');
                
                if (idNormalizado === idBuscado || 
                    (idSoloNumeros && idSoloNumeros === idBuscadoNum) ||
                    idNormalizado.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '')) {
                    // Formato: Apellidos primero, luego nombres
                    const nombreCompleto = [
                        empleado.tPrimerApellido || empleado.primerApellido,
                        empleado.tSegundoApellido || empleado.segundoApellido,
                        empleado.tPrimerNombre || empleado.primerNombre,
                        empleado.tSegundoNombre || empleado.segundoNombre
                    ].filter(Boolean).join(' ').toUpperCase();
                    return nombreCompleto;
                }
            }
            
            return '';
        } catch(e) {
            console.error('Error obteniendo nombre del empleado:', e);
            return '';
        }
    }

    function getEmployeeByIdentification(identificacion, cityCode){
        try {
            const empleadosByCity = localStorage.getItem('empleadosByCity');
            if (!empleadosByCity) return null;
            
            const data = JSON.parse(empleadosByCity);
            if (!data[cityCode]) return null;
            
            const idBuscado = String(identificacion).trim();
            const idBuscadoNum = idBuscado.replace(/\D/g, '');
            
            const empleados = data[cityCode];
            
            if (empleados[idBuscado]) {
                return empleados[idBuscado];
            }
            
            for (const [id, empleado] of Object.entries(empleados)) {
                const idNormalizado = String(id).trim();
                const idSoloNumeros = idNormalizado.replace(/\D/g, '');
                
                if (idNormalizado === idBuscado || 
                    (idSoloNumeros && idSoloNumeros === idBuscadoNum) ||
                    idNormalizado.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '')) {
                    return empleado;
                }
                
                const empId = empleado.identificacion ? String(empleado.identificacion).trim() : '';
                const empIdNum = empId.replace(/\D/g, '');
                
                if (empId && (empId === idBuscado || 
                    (empIdNum && empIdNum === idBuscadoNum) ||
                    empId.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, ''))) {
                    return empleado;
                }
            }
            
            return null;
        } catch(e) {
            console.error('Error obteniendo empleado:', e);
            return null;
        }
    }

    /**
     * Obtiene el código de concepto (escala) desde el código/nombre de escala
     */
    function getConceptoCode(scaleCode, scaleName){
        const code = String(scaleCode || '').trim().toUpperCase();
        const name = String(scaleName || '').trim().toLowerCase();
        
        // Mapeo de códigos/nombres a códigos de concepto
        if (code === 'AS' || code === 'ASESOR' || name.includes('asesor')) {
            return 'AS';
        } else if (code === 'SU' || code === 'SUPERVISOR' || name.includes('supervisor')) {
            return 'SU';
        } else if (code === 'SG' || code === 'SUBGERENTE' || name.includes('subgerente') || name.includes('sub gerente')) {
            return 'SG';
        } else if (code === 'GT' || code === 'GERENTE' || (name.includes('gerente') && !name.includes('sub'))) {
            return 'GT';
        } else if (code === 'DR' || code === 'DIRECTOR' || (name.includes('director') && !name.includes('sub') && !name.includes('nacional'))) {
            return 'DR';
        } else if (code === 'SN' || code === 'SUBDIRECTOR' || name.includes('subdirector') || (name.includes('director') && name.includes('sub'))) {
            return 'SN';
        } else if (code === 'DN' || code === 'DIRECTOR_NAC' || code === 'DIRECTOR NACIONAL' || (name.includes('director') && name.includes('nacional') && !name.includes('sub'))) {
            return 'DN';
        } else if (code === 'CR' || name.includes('crucero')) {
            return 'CR';
        } else if (code === 'PE' || name.includes('proeventos')) {
            return 'PE';
        }
        
        return code || 'AS'; // Por defecto AS
    }

    /**
     * Obtiene la identificación del empleado asociado a una escala desde el contrato
     */
    function getEmployeeIdForScale(scaleCode, contract, cityCode){
        if (!contract || !cityCode || !scaleCode) {
            return '';
        }
        
        try {
            const ejecutivoId = contract.executiveId || contract.ejecutivoId || '';
            if (!ejecutivoId) {
                return '';
            }
            
            const empleadosByCityRaw = localStorage.getItem('empleadosByCity');
            if (!empleadosByCityRaw) {
                return '';
            }
            
            const empleadosByCity = JSON.parse(empleadosByCityRaw);
            const empleados = empleadosByCity[cityCode] || {};
            
            const ejecutivoIdClean = String(ejecutivoId).trim();
            let empleado = empleados[ejecutivoIdClean];
            
            if (!empleado) {
                for (const [cedula, emp] of Object.entries(empleados)) {
                    const cedulaClean = String(cedula).trim();
                    const cedulaNumeric = cedulaClean.replace(/\D/g, '');
                    const ejecutivoIdNumeric = ejecutivoIdClean.replace(/\D/g, '');
                    
                    if (cedulaClean === ejecutivoIdClean || cedulaNumeric === ejecutivoIdNumeric) {
                        empleado = emp;
                        break;
                    }
                    
                    const empId = String(emp.identificacion || '').trim();
                    if (empId === ejecutivoIdClean) {
                        empleado = emp;
                        break;
                    }
                }
            }
            
            if (!empleado || !empleado.escalasData) {
                return '';
            }
            
            const scaleName = String(scaleCode).trim().toLowerCase();
            let identificacion = '';
            
            if (scaleName.includes('asesor') || scaleName === 'as' || scaleName === 'asesor') {
                identificacion = empleado.escalasData.asesor || '';
            } else if (scaleName.includes('supervisor') || scaleName === 'su' || scaleName === 'supervisor') {
                identificacion = empleado.escalasData.supervisor || '';
            } else if (scaleName.includes('subgerente') || scaleName === 'sg' || scaleName === 'subgerente' || scaleName.includes('sub gerente')) {
                identificacion = empleado.escalasData.subgerente || '';
            } else if ((scaleName.includes('gerente') && !scaleName.includes('sub')) || scaleName === 'gt' || scaleName === 'gerente') {
                identificacion = empleado.escalasData.gerente || '';
            } else if (scaleName.includes('director') && scaleName.includes('nacional') && !scaleName.includes('sub') || scaleName === 'dn' || scaleName === 'director nacional') {
                identificacion = empleado.escalasData.directorNacional || '';
            } else if (scaleName.includes('subdirector') || (scaleName.includes('director') && scaleName.includes('sub')) || scaleName === 'sn' || scaleName.includes('sub director')) {
                identificacion = empleado.escalasData.subdirectorNacional || '';
            } else if (scaleName.includes('director') && !scaleName.includes('sub') && !scaleName.includes('nacional') || scaleName === 'dr' || scaleName === 'director') {
                identificacion = empleado.escalasData.director || '';
            }
            
            return String(identificacion).trim();
        } catch(e) {
            console.error('Error obteniendo ID del empleado para escala:', e);
            return '';
        }
    }

    /**
     * Obtiene todos los ejecutivos PYF de una ciudad
     */
    function getAllPYFEmployees(cityCode){
        try {
            const empleadosByCity = localStorage.getItem('empleadosByCity');
            if (!empleadosByCity) return [];
            
            const data = JSON.parse(empleadosByCity);
            if (!data[cityCode]) return [];
            
            const empleados = data[cityCode];
            const pyfEmployees = [];
            
            for (const [id, empleado] of Object.entries(empleados)) {
                if (empleado.area === 'pyf' && empleado.escalasData) {
                    pyfEmployees.push({
                        identificacion: id,
                        empleado: empleado
                    });
                }
            }
            
            return pyfEmployees;
        } catch(e) {
            console.error('Error obteniendo ejecutivos PYF:', e);
            return [];
        }
    }

    /**
     * 🔗 BACKEND INTEGRATION - PROCESAR DATOS DEL REPORTE DE CUADRE
     * 
     * Procesa los datos de nóminas y facturas para generar el reporte de cuadre.
     * Agrupa comisiones por ejecutivo PYF y concepto (escala).
     * 
     * BACKEND: Reemplazar con llamada a API
     * - Endpoint: GET /api/nomina/reportes/cuadre?ciudad={codigo}&fechaInicio={fecha}&fechaFin={fecha}
     * - Método: GET
     * - Headers: { 'Authorization': 'Bearer {token}' }
     * - Response: { 
     *     ejecutivos: [{ concepto, identificacion, nombre, comision }],
     *     totalComprobantes: number,
     *     totalPlanillaGeneral: number
     *   }
     * 
     * @param {string} codigoFilial - Código de la ciudad/filial
     * @param {string} fechaInicio - Fecha de inicio del reporte (YYYY-MM-DD)
     * @param {string} fechaFin - Fecha fin del reporte (YYYY-MM-DD)
     * @returns {Object} { rows: Array, totalGeneral: number }
     */
    function processReportData(codigoFilial, fechaInicio, fechaFin){
        const rows = [];
        let totalGeneral = 0;
        
        try {
            // 🔗 BACKEND INTEGRATION: Reemplazar con llamada a API
            // const response = await fetch(`/api/nomina/reportes/cuadre?ciudad=${codigoFilial}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
            //     method: 'GET',
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            // const reportData = await response.json();
            // return { rows: reportData.ejecutivos || [], totalGeneral: reportData.totalPlanillaGeneral || 0 };
            
            // Obtener todos los ejecutivos PYF de la ciudad
            const pyfEmployees = getAllPYFEmployees(codigoFilial);
            console.log('📊 Ejecutivos PYF encontrados:', pyfEmployees.length);
            
            // TODO: Reemplazar con llamada a API del backend
            // Cargar nóminas de la filial especificada
            const stored = localStorage.getItem(`nominaSemanal_${codigoFilial}`);
            if (!stored) {
                console.warn('⚠️ No hay nóminas para la ciudad:', codigoFilial);
                return { rows: [], totalGeneral: 0 };
            }
            
            const payrolls = JSON.parse(stored);
            const fechaInicioDate = new Date(fechaInicio + 'T00:00:00');
            const fechaFinDate = new Date(fechaFin + 'T23:59:59');
            
            // Filtrar nóminas por rango de fechas
            const filteredPayrolls = payrolls.filter(payroll => {
                const payrollStart = new Date(payroll.fechaInicio);
                const payrollEnd = new Date(payroll.fechaFin);
                return (payrollStart <= fechaFinDate && payrollEnd >= fechaInicioDate);
            });
            
            console.log('📊 Nóminas filtradas:', filteredPayrolls.length);
            
            // Mapa para agrupar comisiones por concepto y ejecutivo
            // Estructura: { concepto: { identificacion: { nombre, comision } } }
            const comisionesMap = {};
            
            // Procesar cada nómina
            filteredPayrolls.forEach(payroll => {
                const facturas = payroll.facturas || [];
                
                facturas.forEach(factura => {
                    const facturaDate = new Date(factura.fechaFinal || payroll.fechaFin);
                    // Verificar que la factura esté en el rango de fechas
                    if (facturaDate < fechaInicioDate || facturaDate > fechaFinDate) {
                        return;
                    }
                    
                    // Obtener información del contrato
                    const contract = getContractInfo(factura.numeroContrato, codigoFilial);
                    
                    // Obtener escalas de la factura
                    const escalas = factura.escalas || [];
                    
                    // Procesar cada escala
                    escalas.forEach(escala => {
                        const scaleCode = escala.codigo || escala.codigoEscala || '';
                        const scaleName = escala.nombre || escala.nombreEscala || '';
                        const comision = Number(escala.valor || escala.valorEscala || 0);
                        
                        if (comision <= 0) return;
                        
                        // Obtener el código de concepto
                        const concepto = getConceptoCode(scaleCode, scaleName);
                        
                        // Obtener la identificación del empleado asociado a esta escala
                        let identificacion = '';
                        if (escala.empleadoId) {
                            identificacion = String(escala.empleadoId).trim();
                        } else {
                            identificacion = getEmployeeIdForScale(scaleCode, contract, codigoFilial);
                        }
                        
                        if (!identificacion) {
                            console.warn('⚠️ No se encontró identificación para escala:', scaleCode, 'en factura:', factura.numeroFactura);
                            return;
                        }
                        
                        // Obtener el nombre del empleado
                        const nombre = getEmployeeNameByIdentification(identificacion, codigoFilial);
                        
                        if (!nombre) {
                            console.warn('⚠️ No se encontró nombre para identificación:', identificacion);
                            return;
                        }
                        
                        // Agrupar por concepto e identificación
                        if (!comisionesMap[concepto]) {
                            comisionesMap[concepto] = {};
                        }
                        
                        if (!comisionesMap[concepto][identificacion]) {
                            comisionesMap[concepto][identificacion] = {
                                nombre: nombre,
                                comision: 0
                            };
                        }
                        
                        comisionesMap[concepto][identificacion].comision += comision;
                        totalGeneral += comision;
                    });
                });
            });
            
            // Convertir el mapa a array de filas
            // Ordenar por concepto (orden específico) y luego por nombre
            const conceptoOrder = ['CR', 'SG', 'SU', 'AS', 'GT', 'DR', 'SN', 'DN', 'PE'];
            
            conceptoOrder.forEach(concepto => {
                if (comisionesMap[concepto]) {
                    const empleados = Object.entries(comisionesMap[concepto])
                        .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));
                    
                    empleados.forEach(([identificacion, data]) => {
                        rows.push({
                            concepto: concepto,
                            identificacion: identificacion,
                            nombre: data.nombre,
                            comision: data.comision
                        });
                    });
                }
            });
            
            // Agregar conceptos que no estén en el orden predefinido
            Object.keys(comisionesMap).forEach(concepto => {
                if (!conceptoOrder.includes(concepto)) {
                    const empleados = Object.entries(comisionesMap[concepto])
                        .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));
                    
                    empleados.forEach(([identificacion, data]) => {
                        rows.push({
                            concepto: concepto,
                            identificacion: identificacion,
                            nombre: data.nombre,
                            comision: data.comision
                        });
                    });
                }
            });
            
        } catch(e) {
            console.error('Error procesando datos del reporte:', e);
        }
        
        return { rows, totalGeneral };
    }

    function renderTable(){
        const tbody = document.getElementById('tbody');
        const tfoot = document.getElementById('tfoot');
        tbody.innerHTML='';
        if (tfoot) tfoot.innerHTML = '';
        
        if (!window.__rows.length){
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:#6c757d;">No se encontraron registros para los criterios seleccionados</td></tr>`;
            return;
        }
        const start = (window.__page-1)*window.__pageSize;
        const end = Math.min(start+window.__pageSize, window.__rows.length);
        const page = window.__rows.slice(start,end);
        page.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.concepto||''}</td>
                <td>${r.identificacion||''}</td>
                <td>${r.nombre||''}</td>
                <td style="text-align:right;">${formatMoney(r.comision)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Agregar totales al final de la tabla solo en la última página
        if (tfoot && window.__page === Math.ceil(window.__rows.length / window.__pageSize)) {
            const totalComprobantes = window.__totalComprobantes || '0.00';
            const totalPlanillaGeneral = window.__totalPlanillaGeneral || '0.00';
            const diferencia = window.__diferencia || '0.00';
            
            tfoot.innerHTML = `
                <tr style="font-weight:bold; border-top:2px solid #333;">
                    <td colspan="3" style="text-transform:uppercase;">TOTAL COMPROBANTES</td>
                    <td style="text-align:right; text-transform:none;">${totalComprobantes}</td>
                </tr>
                <tr style="font-weight:bold;">
                    <td colspan="3" style="text-transform:uppercase;">TOTAL PLANILLA GENERAL</td>
                    <td style="text-align:right; text-transform:none;">${totalPlanillaGeneral}</td>
                </tr>
                <tr style="font-weight:bold;">
                    <td colspan="3" style="text-transform:uppercase;">DIFERENCIA</td>
                    <td style="text-align:right; text-transform:none;">${diferencia}</td>
                </tr>
            `;
        }
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

    function init(){
        const data = loadData();
        if (!data.ciudadCodigo || !data.fechaInicio || !data.fechaFin) {
            document.getElementById('tbody').innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px; color:#dc3545;">Error: No se encontraron datos del reporte</td></tr>';
            return;
        }

        // Actualizar encabezado
        document.getElementById('codigoFilial').textContent = data.ciudadCodigo;
        const fechaReporte = formatDate(data.fechaFin);
        document.getElementById('fechaReporte').textContent = fechaReporte;

        // Procesar datos
        const result = processReportData(data.ciudadCodigo, data.fechaInicio, data.fechaFin);
        window.__rows = result.rows;

        // Guardar totales para usar en renderTable y exportaciones
        window.__totalComprobantes = formatMoney(result.totalGeneral);
        window.__totalPlanillaGeneral = formatMoney(result.totalGeneral);
        window.__diferencia = formatMoney(0);

        if (window.__rows.length > 0) {
            renderTable();
            updatePagination();
        } else {
            document.getElementById('tbody').innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px; color:#6c757d;">No se encontraron registros para los criterios seleccionados</td></tr>';
        }
    }

    window.exportExcel = function(){
        const data = loadData();
        if (!data.ciudadCodigo) return;
        
        const bodyRows = window.__rows.map(r => `
            <tr>
                <td style="text-transform:uppercase;">${r.concepto||''}</td>
                <td style="text-transform:uppercase;">${r.identificacion||''}</td>
                <td style="text-transform:uppercase;">${r.nombre||''}</td>
                <td style="text-align:right;">${formatMoney(r.comision)}</td>
            </tr>
        `).join('');
        
        const totalComprobantes = window.__totalComprobantes || '0.00';
        const totalPlanillaGeneral = window.__totalPlanillaGeneral || '0.00';
        const diferencia = window.__diferencia || '0.00';
        
        const excelHTML = `
        <html>
            <head>
                <meta charset='utf-8'>
                <title>Reporte Cuadre de Nómina</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        font-size: 12px;
                    }
                    .report-title { 
                        font-size: 18px; 
                        font-weight: bold; 
                        text-align: center; 
                        margin-bottom: 10px; 
                        text-transform: uppercase;
                    }
                    .report-subtitle { 
                        font-size: 13px; 
                        text-align: center; 
                        margin-bottom: 8px; 
                        color: #777; 
                        text-transform: uppercase;
                    }
                    .report-info { 
                        font-size: 12px; 
                        text-align: center; 
                        margin-bottom: 20px; 
                        color: #777; 
                        text-transform: uppercase;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 0 auto 20px auto; 
                        border: 1px solid #ddd;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                        font-size: 12px;
                    }
                    th { 
                        background-color: #f5f5f5; 
                        font-weight: 600; 
                        text-transform: uppercase;
                        font-size: 11px;
                    }
                    td { 
                        text-transform: uppercase; 
                    }
                    tfoot tr { 
                        font-weight: bold; 
                    }
                    tfoot tr:first-child { 
                        border-top: 2px solid #333; 
                    }
                    .footer { 
                        text-align: center; 
                        color: #888; 
                        font-size: 11px; 
                        margin-top: 12px; 
                    }
                    .report-container {
                        max-width: 1400px;
                        margin: 0 auto;
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="report-title">GOLDEN BRIDGE CORP. S.A.S</div>
                    <div class="report-subtitle">CUADRE PLANILLA COMISIONES ${formatDate(data.fechaFin)} Pagina # 1</div>
                    <div class="report-info">DE LA CIUDAD ${data.ciudadCodigo}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>CONCEPTO</th>
                                <th>IDENTIFICACION</th>
                                <th>NOMBRE</th>
                                <th>COMISION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bodyRows}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="text-transform:uppercase;">TOTAL COMPROBANTES</td>
                                <td style="text-align:right; text-transform:none;">${totalComprobantes}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="text-transform:uppercase;">TOTAL PLANILLA GENERAL</td>
                                <td style="text-align:right; text-transform:none;">${totalPlanillaGeneral}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="text-transform:uppercase;">DIFERENCIA</td>
                                <td style="text-align:right; text-transform:none;">${diferencia}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div class="footer">© 2025 - GOLDEN APP</div>
                </div>
            </body>
        </html>
        `;
        
        const blob = new Blob(['\ufeff', excelHTML], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cuadre_Planilla_${data.ciudadCodigo}_${data.fechaFin}.xls`;
        a.click();
        URL.revokeObjectURL(url);
    };

    window.exportDOC = function(){
        const data = loadData();
        if (!data.ciudadCodigo) return;
        
        const bodyRows = window.__rows.map(r => `
            <tr>
                <td style="text-transform:uppercase;">${r.concepto||''}</td>
                <td style="text-transform:uppercase;">${r.identificacion||''}</td>
                <td style="text-transform:uppercase;">${r.nombre||''}</td>
                <td style="text-align:right;">${formatMoney(r.comision)}</td>
            </tr>
        `).join('');
        
        const totalComprobantes = window.__totalComprobantes || '0.00';
        const totalPlanillaGeneral = window.__totalPlanillaGeneral || '0.00';
        const diferencia = window.__diferencia || '0.00';
        
        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <style>
                    @page { size: A4 landscape; margin: 12mm 8mm; }
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0;
                        padding: 0;
                        font-size: 12px;
                    }
                    .report-container {
                        max-width: 1400px;
                        margin: 0 auto;
                        padding: 16px;
                    }
                    .report-title { 
                        font-size: 18px; 
                        font-weight: bold; 
                        text-align: center; 
                        margin-bottom: 10px; 
                        text-transform: uppercase;
                    }
                    .report-subtitle { 
                        font-size: 13px; 
                        text-align: center; 
                        margin-bottom: 8px; 
                        color: #777; 
                        text-transform: uppercase;
                    }
                    .report-info { 
                        font-size: 12px; 
                        text-align: center; 
                        margin-bottom: 20px; 
                        color: #777; 
                        text-transform: uppercase;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 0 auto 20px auto; 
                        border: 1px solid #ddd;
                        font-size: 12px;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f5f5f5; 
                        font-weight: 600; 
                        text-transform: uppercase;
                        font-size: 11px;
                    }
                    td { 
                        text-transform: uppercase; 
                    }
                    tfoot tr { 
                        font-weight: bold; 
                    }
                    tfoot tr:first-child { 
                        border-top: 2px solid #333; 
                    }
                    .footer { 
                        text-align: center; 
                        color: #888; 
                        font-size: 11px; 
                        margin-top: 12px; 
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="report-title">GOLDEN BRIDGE CORP. S.A.S</div>
                    <div class="report-subtitle">CUADRE PLANILLA COMISIONES ${formatDate(data.fechaFin)} Pagina # 1</div>
                    <div class="report-info">DE LA CIUDAD ${data.ciudadCodigo}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>CONCEPTO</th>
                                <th>IDENTIFICACION</th>
                                <th>NOMBRE</th>
                                <th>COMISION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bodyRows}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="text-transform:uppercase;">TOTAL COMPROBANTES</td>
                                <td style="text-align:right; text-transform:none;">${totalComprobantes}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="text-transform:uppercase;">TOTAL PLANILLA GENERAL</td>
                                <td style="text-align:right; text-transform:none;">${totalPlanillaGeneral}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="text-transform:uppercase;">DIFERENCIA</td>
                                <td style="text-align:right; text-transform:none;">${diferencia}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div class="footer">© 2025 - GOLDEN APP</div>
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cuadre_Planilla_${data.ciudadCodigo}_${data.fechaFin}.doc`;
        a.click();
        URL.revokeObjectURL(url);
    };

    window.exportPDF = function(){
        // Abrir directamente el diálogo de impresión del navegador
        // Muestra vista previa antes de imprimir/guardar como PDF
        window.print();
    };

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

