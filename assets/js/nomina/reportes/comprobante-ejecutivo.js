/**
 * ====================================================================================
 * 📊 REPORTE COMPROBANTE POR EJECUTIVO - GOLDEN APP
 * ====================================================================================
 * 
 * Este archivo genera el comprobante por ejecutivo que muestra todas las facturas
 * y contratos asociados a un ejecutivo desde una fecha de inicio.
 * 
 * FUNCIONALIDADES:
 * - Busca facturas/contratos por identificación del ejecutivo o por ciudad
 * - Muestra: Ciudad, Factura, Contrato, Cuota Inicial, Titular, Valor
 * - Calcula el total de valores por ejecutivo
 * - Agrupa facturas por ejecutivo cuando se busca por ciudad
 * - Exporta a Excel, Word y PDF
 * - Paginación y zoom para mejor visualización
 * 
 * ====================================================================================
 * 🔗 INSTRUCCIONES DE INTEGRACIÓN CON BACKEND
 * ====================================================================================
 * 
 * INGENIERO: Este módulo actualmente usa localStorage para obtener datos de facturas,
 * contratos y empleados. Debes reemplazar todas las llamadas a localStorage con
 * llamadas a la API del backend.
 * 
 * ENDPOINT PRINCIPAL RECOMENDADO:
 * 
 * GET /api/nomina/reportes/comprobante-ejecutivo
 * Query Parameters:
 *   - identificacion: string (opcional) - Identificación del ejecutivo
 *   - ciudadCodigo: string (opcional) - Código de la ciudad
 *   - fechaInicio: string (requerido) - Fecha de inicio en formato YYYY-MM-DD
 *   - tipoBusqueda: string (requerido) - 'ejecutivo' o 'ciudad'
 * 
 * Response cuando tipoBusqueda = 'ejecutivo':
 * {
 *   success: true,
 *   data: {
 *     ejecutivo: {
 *       nombre: string,
 *       identificacion: string,
 *       cargo: string,
 *       area: string
 *     },
 *     facturas: [
 *       {
 *         ciudad: string,
 *         factura: string,
 *         contrato: string,
 *         cuotaInicial: number,
 *         titular: string,
 *         valor: number
 *       }
 *     ],
 *     totalValor: number
 *   }
 * }
 * 
 * Response cuando tipoBusqueda = 'ciudad':
 * {
 *   success: true,
 *   data: {
 *     ejecutivos: [
 *       {
 *         nombre: string,
 *         identificacion: string,
 *         cargo: string,
 *         area: string,
 *         facturas: [
 *           {
 *             codigoCiudad: string,
 *             factura: string,
 *             matricula: string,
 *             valorCuota: number,
 *             nombreTitular: string,
 *             valorComision: number
 *           }
 *         ],
 *         totalLiquidado: number
 *       }
 *     ]
 *   }
 * }
 * 
 * FUNCIONES QUE REQUIEREN MODIFICACIÓN:
 * 
 * - loadData() - Línea ~75
 *   Esta función carga los parámetros del reporte desde localStorage.
 *   NO requiere modificación, ya que solo lee parámetros de búsqueda.
 * 
 * - processReportData(fechaInicio, ejecutivoIdentificacion, ciudadCodigo, tipoBusqueda) - Línea ~367
 *   Reemplazar toda la lógica de búsqueda en localStorage con:
 *   fetch(`/api/nomina/reportes/comprobante-ejecutivo?fechaInicio=${fechaInicio}&identificacion=${ejecutivoIdentificacion}&ciudadCodigo=${ciudadCodigo}&tipoBusqueda=${tipoBusqueda}`)
 * 
 * - getContractInfo(contractNumber, cityCode) - Línea ~88
 *   Reemplazar: localStorage.getItem('contratosData')
 *   Con: fetch(`/api/contratos/${contractNumber}?ciudad=${cityCode}`)
 * 
 * - getExecutiveInfo(identificacion, cityCode) - Línea ~215
 *   Reemplazar: localStorage.getItem('empleadosByCity')
 *   Con: fetch(`/api/empleados?ciudad=${cityCode}&identificacion=${identificacion}`)
 * 
 * ALTERNATIVA SIMPLIFICADA:
 * Si prefieres, puedes crear un único endpoint que haga toda la lógica del reporte
 * en el backend y solo devuelva los datos procesados. Esto simplificaría mucho
 * el código del frontend.
 * 
 * Endpoint simplificado:
 * GET /api/nomina/reportes/comprobante-ejecutivo
 * Query Parameters: (mismos que arriba)
 * Response: (misma estructura que arriba)
 * 
 * En este caso, solo necesitarías modificar la función processReportData() para
 * hacer una llamada al endpoint y procesar la respuesta.
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

    function formatCuotaInicial(n){
        if (n==null || isNaN(n)) return '0';
        return new Intl.NumberFormat('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0}).format(Number(n));
    }

    /**
     * 🔗 BACKEND INTEGRATION - CARGAR DATOS DEL REPORTE
     */
    function loadData(){
        try {
            const raw = localStorage.getItem('comprobanteEjecutivoData');
            if (raw){
                const data = JSON.parse(raw);
                return data;
            }
        } catch(e) {
            console.error('Error cargando datos:', e);
        }
        return { fechaInicio: '', identificacion: '', ejecutivoNombre: 'TODOS LOS EJECUTIVOS', ejecutivoIdentificacion: '', ciudadCodigo: '', ciudadNombre: 'TODAS LAS CIUDADES', tipoBusqueda: '' };
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
            
            const idBuscado = String(identificacion).trim();
            const idBuscadoNum = idBuscado.replace(/\D/g, '');
            
            const empleados = data[cityCode];
            
            if (empleados[idBuscado]) {
                const empleado = empleados[idBuscado];
                const nombreCompleto = [
                    empleado.tPrimerApellido || empleado.primerApellido,
                    empleado.tSegundoApellido || empleado.segundoApellido,
                    empleado.tPrimerNombre || empleado.primerNombre,
                    empleado.tSegundoNombre || empleado.segundoNombre
                ].filter(Boolean).join(' ').toUpperCase();
                return nombreCompleto;
            }
            
            for (const [id, empleado] of Object.entries(empleados)) {
                const idNormalizado = String(id).trim();
                const idSoloNumeros = idNormalizado.replace(/\D/g, '');
                
                if (idNormalizado === idBuscado || 
                    (idSoloNumeros && idSoloNumeros === idBuscadoNum) ||
                    idNormalizado.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '')) {
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

    /**
     * Verifica si un contrato pertenece al ejecutivo especificado
     */
    function contractBelongsToExecutive(contract, ejecutivoIdentificacion){
        const ejecutivoId = contract.executiveId || 
                           contract.ejecutivoId || 
                           contract.executive || 
                           contract.ejecutivo || 
                           contract.ejecutivoCedula ||
                           contract.executiveCedula || '';
        
        if (!ejecutivoId) return false;
        
        const ejecutivoIdClean = String(ejecutivoId).trim();
        const ejecutivoIdNum = ejecutivoIdClean.replace(/\D/g, '');
        const idBuscado = String(ejecutivoIdentificacion).trim();
        const idBuscadoNum = idBuscado.replace(/\D/g, '');
        
        return ejecutivoIdClean === idBuscado || 
               (ejecutivoIdNum && ejecutivoIdNum === idBuscadoNum && idBuscadoNum.length > 0) ||
               ejecutivoIdClean.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '');
    }

    /**
     * Obtiene el nombre del titular del contrato
     */
    function getTitularName(contract){
        if (!contract) return '';
        
        const titular = contract.titular || 
                       contract.cliente || 
                       contract.clientName ||
                       contract.nombreCliente ||
                       contract.nombreTitular ||
                       '';
        
        if (typeof titular === 'object' && titular.nombre) {
            return titular.nombre;
        }
        
        return String(titular || '').trim().toUpperCase();
    }

    /**
     * Obtiene información completa del ejecutivo
     */
    function getExecutiveInfo(identificacion, cityCode) {
        try {
            const empleadosByCity = localStorage.getItem('empleadosByCity');
            if (!empleadosByCity) return null;
            
            const data = JSON.parse(empleadosByCity);
            if (!data[cityCode]) return null;
            
            const idBuscado = String(identificacion).trim();
            const idBuscadoNum = idBuscado.replace(/\D/g, '');
            
            const empleados = data[cityCode];
            
            // Buscar por ID exacto
            if (empleados[idBuscado]) {
                const empleado = empleados[idBuscado];
                return {
                    nombre: [
                        empleado.tPrimerApellido || empleado.primerApellido,
                        empleado.tSegundoApellido || empleado.segundoApellido,
                        empleado.tPrimerNombre || empleado.primerNombre,
                        empleado.tSegundoNombre || empleado.segundoNombre
                    ].filter(Boolean).join(' ').toUpperCase(),
                    identificacion: idBuscado,
                    cargo: empleado.cargo || empleado.cargoCodigo || '',
                    area: empleado.area || '',
                    filial: empleado.filial || cityCode || ''
                };
            }
            
            // Buscar por coincidencia
            for (const [id, empleado] of Object.entries(empleados)) {
                const idNormalizado = String(id).trim();
                const idSoloNumeros = idNormalizado.replace(/\D/g, '');
                
                if (idNormalizado === idBuscado || 
                    (idSoloNumeros && idSoloNumeros === idBuscadoNum && idBuscadoNum.length > 0) ||
                    idNormalizado.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '')) {
                    return {
                        nombre: [
                            empleado.tPrimerApellido || empleado.primerApellido,
                            empleado.tSegundoApellido || empleado.segundoApellido,
                            empleado.tPrimerNombre || empleado.primerNombre,
                            empleado.tSegundoNombre || empleado.segundoNombre
                        ].filter(Boolean).join(' ').toUpperCase(),
                        identificacion: idNormalizado,
                        cargo: empleado.cargo || empleado.cargoCodigo || '',
                        area: empleado.area || '',
                        filial: empleado.filial || cityCode || ''
                    };
                }
            }
        } catch(e) {
            console.error('Error obteniendo información del ejecutivo:', e);
        }
        return null;
    }

    /**
     * Obtiene el nombre del cargo completo
     */
    function getCargoNombre(cargoCodigo, area) {
        const cargosPorArea = {
            administrativo: [
                { codigo: 'EC', nombre: 'EJECUTIVO DE CUENTA' },
                { codigo: 'EA', nombre: 'EJECUTIVO ADMON' },
                { codigo: 'EP', nombre: 'EJECUTIVO PREJURIDICO' },
                { codigo: 'EJ', nombre: 'EJECUTIVO JURIDICO' },
                { codigo: 'SP', nombre: 'SUPERVISOR DE CARTERA' },
                { codigo: 'SN', nombre: 'SUPERVISOR NACIONAL DE CARTERA' },
                { codigo: 'C', nombre: 'CASTIGO CARTERA' },
                { codigo: 'PV', nombre: 'PROXIMA VIGENCIA' },
                { codigo: 'V', nombre: 'VERIFICADOR' }
            ],
            pyf: [
                { codigo: 'AS', nombre: 'ASESOR' },
                { codigo: 'SU', nombre: 'SUPERVISOR' },
                { codigo: 'SG', nombre: 'SUB GERENTE' },
                { codigo: 'GT', nombre: 'GERENTE' },
                { codigo: 'DR', nombre: 'DIRECTOR' },
                { codigo: 'SN', nombre: 'DIRECTOR SUB NACIONAL' },
                { codigo: 'DN', nombre: 'DIRECTOR NACIONAL' }
            ],
            servicio: [
                { codigo: 'TU', nombre: 'TUTOR' },
                { codigo: 'MO', nombre: 'MONITOR TUTORIAS' },
                { codigo: 'CN', nombre: 'COORDINADOR NACIONAL DE TUTORIAS' }
            ]
        };
        
        let cargo;
        if (area && cargosPorArea[area]) {
            cargo = cargosPorArea[area].find(c => c.codigo === cargoCodigo);
        } else {
            for (const areaKey in cargosPorArea) {
                cargo = cargosPorArea[areaKey].find(c => c.codigo === cargoCodigo);
                if (cargo) break;
            }
        }
        
        return cargo ? cargo.nombre : (cargoCodigo || '').toUpperCase();
    }

    /**
     * Verifica si una factura tiene escalas asociadas al ejecutivo especificado
     */
    function facturaHasExecutiveScale(factura, ejecutivoIdentificacion) {
        if (!factura.escalas || !Array.isArray(factura.escalas)) {
            return false;
        }
        
        const idBuscado = String(ejecutivoIdentificacion).trim();
        const idBuscadoNum = idBuscado.replace(/\D/g, '');
        
        for (const escala of factura.escalas) {
            const ejecutivoId = escala.empleadoId || escala.ejecutivoId || '';
            const ejecutivoIdClean = String(ejecutivoId).trim();
            const ejecutivoIdNum = ejecutivoIdClean.replace(/\D/g, '');
            
            // Verificar si la escala pertenece al ejecutivo
            if (ejecutivoIdClean === idBuscado || 
                (ejecutivoIdNum && ejecutivoIdNum === idBuscadoNum && idBuscadoNum.length > 0)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Obtiene la comisión del ejecutivo desde las escalas de la factura
     */
    function getComisionFromScales(factura, ejecutivoIdentificacion) {
        if (!factura.escalas || !Array.isArray(factura.escalas)) {
            return 0;
        }
        
        const idBuscado = String(ejecutivoIdentificacion).trim();
        const idBuscadoNum = idBuscado.replace(/\D/g, '');
        
        let totalComision = 0;
        
        for (const escala of factura.escalas) {
            const ejecutivoId = escala.empleadoId || escala.ejecutivoId || '';
            const ejecutivoIdClean = String(ejecutivoId).trim();
            const ejecutivoIdNum = ejecutivoIdClean.replace(/\D/g, '');
            
            // Verificar si la escala pertenece al ejecutivo
            if (ejecutivoIdClean === idBuscado || 
                (ejecutivoIdNum && ejecutivoIdNum === idBuscadoNum && idBuscadoNum.length > 0)) {
                // Obtener el valor de la comisión
                let valor = escala.valor || escala.comision || escala.valorComision || 0;
                if (typeof valor === 'string') {
                    let cleanValue = String(valor).trim();
                    if (cleanValue.includes(',')) {
                        cleanValue = cleanValue.replace(/\./g, '');
                        cleanValue = cleanValue.replace(',', '.');
                    } else if (cleanValue.includes('.')) {
                        const parts = cleanValue.split('.');
                        if (parts.length > 2 || (parts.length === 2 && parts[1].length > 2)) {
                            cleanValue = cleanValue.replace(/\./g, '');
                        }
                    }
                    cleanValue = cleanValue.replace(/[^\d.]/g, '');
                    valor = parseFloat(cleanValue) || 0;
                } else {
                    valor = Number(valor) || 0;
                }
                totalComision += valor;
            }
        }
        
        return totalComision;
    }

    /**
     * 🔗 BACKEND INTEGRATION - PROCESAR DATOS DEL REPORTE
     */
    function processReportData(fechaInicio, ejecutivoIdentificacion, ciudadCodigo, tipoBusqueda){
        // Si es por ciudad, agrupar por ejecutivo
        if (tipoBusqueda === 'ciudad' && ciudadCodigo) {
            return processReportDataByCity(fechaInicio, ciudadCodigo);
        }
        
        // Si es por ejecutivo, usar el método original
        const rows = [];
        const totalValorRef = { valor: 0 };
        
        try {
            const fechaInicioDate = new Date(fechaInicio + 'T00:00:00');
            
            // Determinar qué ciudades buscar
            let ciudades = [];
            if (ciudadCodigo && ciudadCodigo.trim() !== '') {
                ciudades = [ciudadCodigo.trim()];
            } else {
                ciudades = ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110'];
            }
            
            ciudades.forEach(cityCode => {
                // Buscar facturas en nóminas
                const stored = localStorage.getItem(`nominaSemanal_${cityCode}`);
                if (stored) {
                    const payrolls = JSON.parse(stored);
                    
                    payrolls.forEach(payroll => {
                        const facturas = payroll.facturas || [];
                        
                        facturas.forEach(factura => {
                            const facturaDate = new Date(factura.fechaFinal || payroll.fechaFin || payroll.fechaInicio);
                            
                            if (facturaDate < fechaInicioDate) {
                                return;
                            }
                            
                            const numeroContratoFactura = factura.numeroContrato || 
                                                         factura.contractNumber || 
                                                         factura.contractId || 
                                                         '';
                            
                            const contract = getContractInfo(numeroContratoFactura, cityCode);
                            
                            if (!contract) {
                                return;
                            }
                            
                            // Si se busca por ejecutivo, verificar que la factura tenga escalas con ese ejecutivo
                            if (ejecutivoIdentificacion && ejecutivoIdentificacion.trim() !== '') {
                                // Buscar en las escalas de la factura
                                const tieneEscalaDelEjecutivo = facturaHasExecutiveScale(factura, ejecutivoIdentificacion);
                                
                                // Si no tiene escala del ejecutivo, también verificar en el contrato (fallback)
                                if (!tieneEscalaDelEjecutivo && !contractBelongsToExecutive(contract, ejecutivoIdentificacion)) {
                                    return;
                                }
                            }
                            
                            processInvoiceData(factura, contract, cityCode, rows, totalValorRef, ejecutivoIdentificacion);
                        });
                    });
                }
            });
            
        } catch(e) {
            console.error('Error procesando datos del reporte:', e);
        }
        
        return { rows, totalValor: totalValorRef.valor, ejecutivos: [] };
    }

    /**
     * Procesa datos del reporte agrupados por ejecutivo (para reporte por ciudad)
     */
    function processReportDataByCity(fechaInicio, ciudadCodigo) {
        const ejecutivosMap = new Map(); // Map<identificacion, {info, facturas: []}>
        
        try {
            const fechaInicioDate = new Date(fechaInicio + 'T00:00:00');
            const cityCode = ciudadCodigo.trim();
            
            // Buscar facturas en nóminas
            const stored = localStorage.getItem(`nominaSemanal_${cityCode}`);
            if (stored) {
                const payrolls = JSON.parse(stored);
                
                payrolls.forEach(payroll => {
                    const facturas = payroll.facturas || [];
                    
                    facturas.forEach(factura => {
                        const facturaDate = new Date(factura.fechaFinal || payroll.fechaFin || payroll.fechaInicio);
                        
                        if (facturaDate < fechaInicioDate) {
                            return;
                        }
                        
                        const numeroContratoFactura = factura.numeroContrato || 
                                                     factura.contractNumber || 
                                                     factura.contractId || 
                                                     '';
                        
                        const contract = getContractInfo(numeroContratoFactura, cityCode);
                        
                        if (!contract) {
                            return;
                        }
                        
                        // Obtener identificaciones de ejecutivos desde las escalas
                        const escalas = factura.escalas || [];
                        
                        escalas.forEach(escala => {
                            const ejecutivoId = escala.empleadoId || escala.ejecutivoId || '';
                            if (!ejecutivoId) return;
                            
                            const ejecutivoIdClean = String(ejecutivoId).trim();
                            
                            // Obtener información del ejecutivo
                            let ejecutivoData = ejecutivosMap.get(ejecutivoIdClean);
                            if (!ejecutivoData) {
                                const ejecutivoInfo = getExecutiveInfo(ejecutivoIdClean, cityCode);
                                if (!ejecutivoInfo) return;
                                
                                ejecutivoData = {
                                    info: ejecutivoInfo,
                                    facturas: []
                                };
                                ejecutivosMap.set(ejecutivoIdClean, ejecutivoData);
                            }
                            
                            // Obtener comisión del ejecutivo para esta factura
                            const comision = getComisionFromScales(factura, ejecutivoIdClean);
                            if (comision <= 0) return;
                            
                            // Obtener datos de la factura
                            const numeroFactura = factura.numeroFactura || factura.invoiceNumber || factura.numero || '';
                            const matricula = contract.productionRecord || contract.recordProduccion || '';
                            
                            // Obtener cuota inicial
                            let cuotaInicial = 0;
                            if (contract.planData) {
                                try {
                                    const planData = typeof contract.planData === 'string' ? 
                                                    JSON.parse(contract.planData) : 
                                                    contract.planData;
                                    cuotaInicial = Number(planData.cuotaInicial || planData.cuotaInicialValor || planData.valorInicial || 0) || 0;
                                } catch (e) {}
                            }
                            if (!cuotaInicial && contract.plan) {
                                try {
                                    const planesData = localStorage.getItem('planesData');
                                    if (planesData) {
                                        const planes = JSON.parse(planesData);
                                        const plan = planes[contract.plan];
                                        if (plan) {
                                            cuotaInicial = Number(plan.cuotaInicial || plan.cuotaInicialValor || plan.valorInicial || 0) || 0;
                                        }
                                    }
                                } catch (e) {}
                            }
                            if (!cuotaInicial && factura.cuotaInicial !== null && factura.cuotaInicial !== undefined) {
                                if (typeof factura.cuotaInicial === 'string') {
                                    let cleanValue = String(factura.cuotaInicial).trim();
                                    if (cleanValue.includes(',')) {
                                        cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
                                    }
                                    cleanValue = cleanValue.replace(/[^\d.]/g, '');
                                    cuotaInicial = parseFloat(cleanValue) || 0;
                                } else {
                                    cuotaInicial = Number(factura.cuotaInicial) || 0;
                                }
                            }
                            
                            const titular = getTitularName(contract);
                            
                            ejecutivoData.facturas.push({
                                codigoCiudad: cityCode,
                                factura: numeroFactura,
                                matricula: matricula,
                                valorCuota: cuotaInicial,
                                nombreTitular: titular,
                                valorComision: comision
                            });
                        });
                    });
                });
            }
        } catch(e) {
            console.error('Error procesando datos del reporte por ciudad:', e);
        }
        
        // Convertir Map a array de ejecutivos
        const ejecutivos = Array.from(ejecutivosMap.values()).map(ejecutivoData => {
            const totalLiquidado = ejecutivoData.facturas.reduce((sum, f) => sum + f.valorComision, 0);
            return {
                ...ejecutivoData.info,
                facturas: ejecutivoData.facturas,
                totalLiquidado: totalLiquidado
            };
        });
        
        return { rows: [], totalValor: 0, ejecutivos: ejecutivos };
    }
    
    function processInvoiceData(factura, contract, cityCode, rows, totalValorRef, ejecutivoIdentificacion) {
        try {
            // Obtener cuota inicial - PRIORIDAD 1: Buscar en el contrato/planData
            let cuotaInicial = 0;
            if (contract) {
                // Buscar en planData del contrato
                if (contract.planData) {
                    try {
                        const planData = typeof contract.planData === 'string' ? 
                                        JSON.parse(contract.planData) : 
                                        contract.planData;
                        
                        const planCuotaInicial = planData.cuotaInicial || 
                                               planData.cuotaInicialValor ||
                                               planData.valorInicial ||
                                               planData.cuotaInicialPlan ||
                                               0;
                        
                        if (planCuotaInicial && planCuotaInicial > 0) {
                            cuotaInicial = Number(planCuotaInicial) || 0;
                        }
                    } catch (e) {
                        console.error('Error parseando planData:', e);
                    }
                }
                
                // PRIORIDAD 2: Si no se encontró en planData, buscar en el plan directamente
                if (!cuotaInicial && contract.plan) {
                    try {
                        const planesData = localStorage.getItem('planesData');
                        if (planesData) {
                            const planes = JSON.parse(planesData);
                            const plan = planes[contract.plan];
                            
                            if (plan) {
                                const planCuotaInicial = plan.cuotaInicial || 
                                                       plan.cuotaInicialValor ||
                                                       plan.valorInicial ||
                                                       0;
                                
                                if (planCuotaInicial && planCuotaInicial > 0) {
                                    cuotaInicial = Number(planCuotaInicial) || 0;
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error buscando en planes:', e);
                    }
                }
            }
            
            // PRIORIDAD 3: Si no se encontró en el contrato, usar la factura como fallback
            if (!cuotaInicial && factura.cuotaInicial !== null && factura.cuotaInicial !== undefined) {
                // Si es string, limpiar y convertir correctamente
                if (typeof factura.cuotaInicial === 'string') {
                    let cleanValue = String(factura.cuotaInicial).trim();
                    // Si tiene coma, es formato español (ej: "5.000.000,00")
                    if (cleanValue.includes(',')) {
                        cleanValue = cleanValue.replace(/\./g, '');
                        cleanValue = cleanValue.replace(',', '.');
                    } else if (cleanValue.includes('.')) {
                        const parts = cleanValue.split('.');
                        if (parts.length > 2 || (parts.length === 2 && parts[1].length > 2)) {
                            cleanValue = cleanValue.replace(/\./g, '');
                        }
                    }
                    cleanValue = cleanValue.replace(/[^\d.]/g, '');
                    cuotaInicial = parseFloat(cleanValue) || 0;
                } else {
                    cuotaInicial = Number(factura.cuotaInicial) || 0;
                }
            }
            
            // Obtener valor total - PRIORIDAD 1: Buscar en el contrato/planData
            let valor = 0;
            if (contract) {
                console.log('🔍 Buscando valor para contrato:', contract.numeroContrato || contract.numero || contract.contractNumber);
                
                // Buscar directamente en el contrato primero
                if (contract.valorPlan || contract.valorTotal || contract.totalPlan || contract.valor) {
                    valor = Number(contract.valorPlan || contract.valorTotal || contract.totalPlan || contract.valor) || 0;
                    console.log('✅ Valor encontrado directamente en contrato:', valor);
                }
                
                // PRIORIDAD 1: Buscar en planData del contrato
                if (!valor && contract.planData) {
                    try {
                        const planData = typeof contract.planData === 'string' ? 
                                        JSON.parse(contract.planData) : 
                                        contract.planData;
                        
                        console.log('📋 planData del contrato:', planData);
                        console.log('📋 Campos disponibles en planData:', Object.keys(planData));
                        
                        const planValor = planData.valorPlan || 
                                        planData.valorTotal ||
                                        planData.totalPlan ||
                                        planData.valor ||
                                        planData.total ||
                                        planData.planValor ||
                                        0;
                        
                        console.log('💰 Valor encontrado en planData:', planValor);
                        
                        if (planValor && planValor > 0) {
                            valor = Number(planValor) || 0;
                            console.log('✅ Valor asignado desde planData:', valor);
                        }
                    } catch (e) {
                        console.error('❌ Error parseando planData para valor:', e);
                    }
                }
                
                // PRIORIDAD 2: Si no se encontró en planData, buscar en el plan directamente
                if (!valor && contract.plan) {
                    try {
                        const planesData = localStorage.getItem('planesData');
                        if (planesData) {
                            const planes = JSON.parse(planesData);
                            const plan = planes[contract.plan];
                            
                            console.log('🔍 Buscando plan:', contract.plan, 'en planesData');
                            
                            if (plan) {
                                console.log('📋 Plan encontrado:', plan);
                                console.log('📋 Campos disponibles en plan:', Object.keys(plan));
                                
                                const planValor = plan.valorPlan || 
                                               plan.valorTotal ||
                                               plan.totalPlan ||
                                               plan.valor ||
                                               plan.total ||
                                               0;
                                
                                console.log('💰 Valor encontrado en plan:', planValor);
                                
                                if (planValor && planValor > 0) {
                                    valor = Number(planValor) || 0;
                                    console.log('✅ Valor asignado desde plan:', valor);
                                }
                            } else {
                                // Solo log, no warning, porque puede encontrarse en escalas
                                console.log('ℹ️ Plan no encontrado en planesData:', contract.plan, '(se buscará en escalas o factura)');
                            }
                        } else {
                            console.warn('⚠️ No hay planesData en localStorage');
                        }
                    } catch (e) {
                        console.error('❌ Error buscando valor en planes:', e);
                    }
                }
            }
            
            // Si hay ejecutivoIdentificacion, buscar la comisión del ejecutivo desde las escalas
            if (ejecutivoIdentificacion && ejecutivoIdentificacion.trim() !== '') {
                console.log('🔍 Buscando comisión del ejecutivo desde escalas...');
                const comision = getComisionFromScales(factura, ejecutivoIdentificacion);
                if (comision && comision > 0) {
                    valor = comision;
                    console.log('✅ Comisión encontrada desde escalas:', valor);
                } else {
                    console.log('⚠️ No se encontró comisión en escalas para el ejecutivo');
                }
            }
            
            // PRIORIDAD 3: Si no hay valor en planData y no hay comisión de escalas, buscar en la factura
            if (!valor || valor === 0) {
                console.log('🔍 Buscando valor en factura...');
                console.log('📄 Factura completa:', factura);
                
                let facturaValor = factura.valor || 
                                 factura.value || 
                                 factura.valorTotal ||
                                 factura.total ||
                                 factura.valorFactura ||
                                 factura.invoiceValue ||
                                 0;
                
                console.log('💰 Valor encontrado en factura (raw):', facturaValor);
                
                // Si es string, limpiar y convertir correctamente
                if (typeof facturaValor === 'string') {
                    let cleanValue = String(facturaValor).trim();
                    if (cleanValue.includes(',')) {
                        cleanValue = cleanValue.replace(/\./g, '');
                        cleanValue = cleanValue.replace(',', '.');
                    } else if (cleanValue.includes('.')) {
                        const parts = cleanValue.split('.');
                        if (parts.length > 2 || (parts.length === 2 && parts[1].length > 2)) {
                            cleanValue = cleanValue.replace(/\./g, '');
                        }
                    }
                    cleanValue = cleanValue.replace(/[^\d.]/g, '');
                    valor = parseFloat(cleanValue) || 0;
                    console.log('✅ Valor convertido desde string:', valor);
                } else if (facturaValor) {
                    valor = Number(facturaValor) || 0;
                    console.log('✅ Valor convertido desde número:', valor);
                }
            }
            
            console.log('📊 Valor final para factura:', factura.numeroFactura || factura.invoiceNumber, '=', valor);
            
            // Solo mostrar advertencia si realmente no se encontró ningún valor
            if (!valor || valor === 0) {
                console.warn('⚠️ No se pudo obtener valor para factura:', factura.numeroFactura || factura.invoiceNumber);
            }
                        
            // Obtener titular
            const titular = getTitularName(contract);
            
            // Obtener número de factura
            const numeroFactura = factura.numeroFactura || 
                                factura.invoiceNumber || 
                                factura.numero ||
                                '';
            
            // Obtener número de contrato
            const numeroContrato = contract.numeroContrato || 
                                 contract.numero || 
                                 contract.contractNumber ||
                                 '';
            
            console.log('📊 Procesando factura:', {
                factura: numeroFactura,
                contrato: numeroContrato,
                cuotaInicial: cuotaInicial,
                valor: valor,
                titular: titular
            });
            
            rows.push({
                ciudad: getCiudadNombre(cityCode),
                factura: numeroFactura,
                contrato: numeroContrato,
                cuotaInicial: cuotaInicial,
                titular: titular,
                valor: valor
            });
            
            totalValorRef.valor += valor;
        } catch(e) {
            console.error('Error procesando factura:', e);
        }
    }

    function renderTable(){
        const tbody = document.getElementById('tbody');
        if (!tbody) return;
        
        tbody.innerHTML='';
        
        const data = loadData();
        
        // Si es reporte por ciudad, renderizar ejecutivos
        if (data.tipoBusqueda === 'ciudad' && window.__ejecutivos && window.__ejecutivos.length > 0) {
            renderEjecutivosTable(tbody);
            return;
        }
        
        // Renderizado normal por ejecutivo
        if (!window.__rows.length){
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#6c757d;">No se encontraron registros para los criterios seleccionados</td></tr>`;
            return;
        }
        const start = (window.__page-1)*window.__pageSize;
        const end = Math.min(start+window.__pageSize, window.__rows.length);
        const page = window.__rows.slice(start,end);
        page.forEach(r => {
            const tr = document.createElement('tr');
            if (r.isTotal) {
                tr.style.fontWeight = 'bold';
                tr.style.backgroundColor = '#f0f0f0';
            }
            tr.innerHTML = `
                <td>${r.ciudad||''}</td>
                <td>${r.factura||''}</td>
                <td>${r.contrato||''}</td>
                <td style="text-align:right;">${r.cuotaInicial !== '' && r.cuotaInicial !== null && r.cuotaInicial !== undefined ? formatCuotaInicial(r.cuotaInicial) : ''}</td>
                <td>${r.titular||''}</td>
                <td style="text-align:right;">${formatMoney(r.valor)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * Renderiza la tabla de ejecutivos (una página por ejecutivo)
     */
    function renderEjecutivosTable(tbody) {
        // Limpiar el tbody primero
        if (tbody) {
            tbody.innerHTML = '';
        }
        
        const data = loadData();
        const ejecutivos = window.__ejecutivos || [];
        
        if (ejecutivos.length === 0) {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#6c757d;">No se encontraron ejecutivos para los criterios seleccionados</td></tr>`;
            }
            return;
        }
        
        // Calcular qué ejecutivo mostrar según la página actual
        const ejecutivoIndex = window.__page - 1;
        if (ejecutivoIndex < 0 || ejecutivoIndex >= ejecutivos.length) {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#6c757d;">Página no válida</td></tr>`;
            }
            return;
        }
        
        const ejecutivo = ejecutivos[ejecutivoIndex];
        const facturas = ejecutivo.facturas || [];
        
        // Actualizar encabezado con información del ejecutivo
        updateEjecutivoHeader(ejecutivo, data);
        
        // Actualizar encabezado de la tabla
        const tableHeader = document.getElementById('tableHeader');
        if (tableHeader) {
            tableHeader.innerHTML = `
                <th>CIUDAD</th>
                <th>FACTURA</th>
                <th>MATRICULA</th>
                <th>VALOR CUOTA</th>
                <th>NOMBRE TITULAR</th>
                <th>VALOR COMISION</th>
            `;
        }
        
        // Renderizar facturas del ejecutivo
        if (!tbody) return;
        
        if (facturas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#6c757d;">No se encontraron facturas para este ejecutivo</td></tr>`;
            return;
        }
        
        facturas.forEach(f => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${f.codigoCiudad || ''}</td>
                <td>${f.factura || ''}</td>
                <td>${f.matricula || ''}</td>
                <td style="text-align:right;">${formatMoney(f.valorCuota || 0)}</td>
                <td>${f.nombreTitular || ''}</td>
                <td style="text-align:right;">${formatMoney(f.valorComision || 0)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Agregar fila de total
        const trTotal = document.createElement('tr');
        trTotal.style.fontWeight = 'bold';
        trTotal.style.backgroundColor = '#f0f0f0';
        trTotal.innerHTML = `
            <td colspan="5" style="text-align:right; padding-right: 20px;">TOTAL LIQUIDADO:</td>
            <td style="text-align:right;">${formatMoney(ejecutivo.totalLiquidado || 0)}</td>
        `;
        tbody.appendChild(trTotal);
    }

    /**
     * Actualiza el encabezado con información del ejecutivo
     */
    function updateEjecutivoHeader(ejecutivo, data) {
        const ciudadNombre = data.ciudadNombre || getCiudadNombre(data.ciudadCodigo || '');
        const cargoNombre = getCargoNombre(ejecutivo.cargo, ejecutivo.area);
        
        // Actualizar título
        const reportTitle = document.querySelector('.report-title');
        if (reportTitle) {
            reportTitle.textContent = 'GOLDEN BRIDGE CORP. S.A.';
        }
        
        // Actualizar información del ejecutivo en contenedor separado - Layout horizontal
        const ejecutivoInfoContainer = document.getElementById('ejecutivoInfoContainer');
        if (ejecutivoInfoContainer) {
            const fechaFinal = data.fechaFinal || '';
            ejecutivoInfoContainer.innerHTML = `
                <div style="background-color: #f8f9fa; border: 1px solid #ccc; border-radius: 8px; padding: 12px 15px; margin-bottom: 15px;">
                    <div style="font-size: 13px; font-weight: 700; color: #333; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 6px;">
                        GOLDEN BRIDGE CORP. S.A.S
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px 30px; align-items: center; font-size: 12px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">CIUDAD:</span>
                            <span style="font-weight: 700; color: #000; font-size: 13px;">${ciudadNombre}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">FILIAL:</span>
                            <span style="font-weight: 700; color: #000; font-size: 13px;">${ejecutivo.filial || data.ciudadCodigo || ''}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 300px;">
                            <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">NOMBRE:</span>
                            <span style="font-weight: 700; color: #000; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">${ejecutivo.nombre || ''}</span>
                            <span style="font-weight: normal; color: #555; font-size: 13px; margin-left: 15px;">IDENTIDAD:</span>
                            <span style="font-weight: 700; color: #000; font-size: 13px;">${ejecutivo.identificacion || ''}</span>
                            <span style="font-weight: normal; color: #555; font-size: 13px; margin-left: 15px;">CARGO:</span>
                            <span style="font-weight: 700; color: #000; font-size: 13px;">${cargoNombre}</span>
                            <span style="font-weight: normal; color: #555; font-size: 13px; margin-left: 15px;">PERIODO:</span>
                            <span style="font-weight: 700; color: #000; font-size: 13px;">DEL ${formatDate(data.fechaInicio)} ${fechaFinal ? 'AL ' + formatDate(fechaFinal) : ''}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-left: auto;">
                            <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">PÁGINA:</span>
                            <span id="paginaActual" style="font-weight: 700; color: #000; font-size: 13px;">${window.__page}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Fallback al método anterior si no existe el contenedor
            const reportSubtitle = document.getElementById('reportSubtitle');
            if (reportSubtitle) {
                const fechaFinal = data.fechaFinal || '';
                reportSubtitle.innerHTML = `
                    <div style="background-color: #f8f9fa; border: 1px solid #ccc; border-radius: 8px; padding: 12px 15px; margin-bottom: 15px;">
                        <div style="font-size: 13px; font-weight: 700; color: #333; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 6px;">
                            GOLDEN BRIDGE CORP. S.A.S
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 20px 30px; align-items: center; font-size: 12px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">CIUDAD:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px;">${ciudadNombre}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">FILIAL:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px;">${ejecutivo.filial || data.ciudadCodigo || ''}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 300px;">
                                <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">NOMBRE:</span>
                                <span style="font-weight: 700; color: #000; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">${ejecutivo.nombre || ''}</span>
                                <span style="font-weight: normal; color: #555; font-size: 13px; margin-left: 15px;">IDENTIDAD:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px;">${ejecutivo.identificacion || ''}</span>
                                <span style="font-weight: normal; color: #555; font-size: 13px; margin-left: 15px;">CARGO:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px;">${cargoNombre}</span>
                                <span style="font-weight: normal; color: #555; font-size: 13px; margin-left: 15px;">PERIODO:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px;">DEL ${formatDate(data.fechaInicio)} ${fechaFinal ? 'AL ' + formatDate(fechaFinal) : ''}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; margin-left: auto;">
                                <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">PÁGINA:</span>
                                <span id="paginaActual" style="font-weight: 700; color: #000; font-size: 13px;">${window.__page}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    function updatePagination(){
        const data = loadData();
        let totalPages = 1;
        
        // Si es reporte por ciudad, usar número de ejecutivos
        if (data.tipoBusqueda === 'ciudad' && window.__ejecutivos && window.__ejecutivos.length > 0) {
            totalPages = window.__ejecutivos.length;
        } else {
            totalPages = Math.ceil(window.__rows.length / window.__pageSize) || 1;
        }
        
        document.getElementById('currentPage').value = window.__page;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('paginaActual').textContent = window.__page;
    }

    window.goFirst = function(){ 
        const data = loadData();
        let totalPages = 1;
        if (data.tipoBusqueda === 'ciudad' && window.__ejecutivos && window.__ejecutivos.length > 0) {
            totalPages = window.__ejecutivos.length;
        } else {
            totalPages = Math.ceil(window.__rows.length / window.__pageSize) || 1;
        }
        if (window.__page>1){ window.__page=1; renderTable(); updatePagination(); } 
    };
    window.goPrevious = function(){ if (window.__page>1){ window.__page--; renderTable(); updatePagination(); } };
    window.goNext = function(){ 
        const data = loadData();
        let totalPages = 1;
        if (data.tipoBusqueda === 'ciudad' && window.__ejecutivos && window.__ejecutivos.length > 0) {
            totalPages = window.__ejecutivos.length;
        } else {
            totalPages = Math.ceil(window.__rows.length / window.__pageSize) || 1;
        }
        if (window.__page<totalPages){ window.__page++; renderTable(); updatePagination(); } 
    };
    window.goLast = function(){ 
        const data = loadData();
        let totalPages = 1;
        if (data.tipoBusqueda === 'ciudad' && window.__ejecutivos && window.__ejecutivos.length > 0) {
            totalPages = window.__ejecutivos.length;
        } else {
            totalPages = Math.ceil(window.__rows.length / window.__pageSize) || 1;
        }
        if (window.__page<totalPages){ window.__page=totalPages; renderTable(); updatePagination(); } 
    };
    window.goToPage = function(p){ 
        const n=parseInt(p,10)||1;
        const data = loadData();
        let totalPages = 1;
        if (data.tipoBusqueda === 'ciudad' && window.__ejecutivos && window.__ejecutivos.length > 0) {
            totalPages = window.__ejecutivos.length;
        } else {
            totalPages = Math.ceil(window.__rows.length / window.__pageSize) || 1;
        }
        if(n>=1&&n<=totalPages){ window.__page=n; renderTable(); updatePagination(); } else { document.getElementById('currentPage').value = window.__page; } 
    };

    window.setZoom = function(delta){
        window.__zoom = Math.max(0.5, Math.min(2, window.__zoom + delta));
        const c = document.getElementById('reportRoot');
        c.style.transform = `scale(${window.__zoom})`;
        c.style.transformOrigin = 'top left';
        document.getElementById('zoomLevel').textContent = Math.round(window.__zoom*100)+'%';
    };

    function generarHTMLLimpio(){
        const data = loadData();
        const bodyRows = window.__rows.map(r => {
            const style = r.isTotal ? 'font-weight:bold; background-color:#f0f0f0;' : '';
            return `
            <tr style="${style}">
                <td>${r.ciudad||''}</td>
                <td>${r.factura||''}</td>
                <td>${r.contrato||''}</td>
                <td style="text-align:right;">${r.cuotaInicial !== '' && r.cuotaInicial !== null && r.cuotaInicial !== undefined ? formatCuotaInicial(r.cuotaInicial) : ''}</td>
                <td>${r.titular||''}</td>
                <td style="text-align:right;">${formatMoney(r.valor)}</td>
            </tr>
        `;
        }).join('');

        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset='utf-8'>
                <title>Comprobante por Ejecutivo</title>
                <style>
                    @page { size: A4 landscape; margin: 1cm 0.5cm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 10px; line-height: 1.2; }
                    .report-title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 8px; text-transform: uppercase; }
                    .report-subtitle { font-size: 12px; text-align: center; margin-bottom: 8px; color: #666; text-transform: uppercase; }
                    table { width: 100%; border-collapse: collapse; margin: 0 auto 15px auto; border: 1px solid #000; table-layout: fixed; }
                    th, td { border: 1px solid #000; padding: 4px 3px; text-align: left; font-size: 9px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
                    th { background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; }
                    .footer { text-align: center; font-size: 8px; color: #888; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="report-title">GOLDEN BRIDGE CORP. S.A.S</div>
                <div class="report-subtitle">Comprobante - Fecha Inicio: ${formatDate(data.fechaInicio)} - Ejecutivo: ${data.ejecutivoNombre}${data.ejecutivoIdentificacion && data.ejecutivoIdentificacion.trim() !== '' ? ` (${data.ejecutivoIdentificacion})` : ''} - Ciudad: ${data.ciudadNombre || 'TODAS LAS CIUDADES'}</div>
                <table>
                    <thead>
                        <tr>
                            <th>CIUDAD</th>
                            <th>FACTURA</th>
                            <th>CONTRATO</th>
                            <th>CUOTA INICIAL</th>
                            <th>TITULAR</th>
                            <th>VALOR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bodyRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        return html;
    }

    function generarHTMLLimpioCompleto(){
        const data = loadData();
        let htmlContent = '';
        
        // Si es reporte por ciudad, generar HTML para todos los ejecutivos
        if (data.tipoBusqueda === 'ciudad' && window.__ejecutivos && window.__ejecutivos.length > 0) {
            const ciudadNombre = data.ciudadNombre || getCiudadNombre(data.ciudadCodigo || '');
            
            window.__ejecutivos.forEach((ejecutivo, index) => {
                const cargoNombre = getCargoNombre(ejecutivo.cargo, ejecutivo.area);
                const fechaFinal = data.fechaFinal || '';
                
                let bodyRows = '';
                ejecutivo.facturas.forEach(f => {
                    bodyRows += `
                        <tr>
                            <td>${f.codigoCiudad || ''}</td>
                            <td>${f.factura || ''}</td>
                            <td>${f.matricula || ''}</td>
                            <td style="text-align:right;">${formatMoney(f.valorCuota || 0)}</td>
                            <td>${f.nombreTitular || ''}</td>
                            <td style="text-align:right;">${formatMoney(f.valorComision || 0)}</td>
                        </tr>
                    `;
                });
                
                // Agregar fila de total
                bodyRows += `
                    <tr style="font-weight:bold; background-color:#f0f0f0;">
                        <td colspan="5" style="text-align:right; padding-right: 20px;">TOTAL LIQUIDADO:</td>
                        <td style="text-align:right;">${formatMoney(ejecutivo.totalLiquidado || 0)}</td>
                    </tr>
                `;
                
                htmlContent += `
                    <div style="page-break-after: always; margin-bottom: 30px;">
                        <div class="report-title">GOLDEN BRIDGE CORP. S.A.</div>
                        <div class="report-subtitle" style="text-align: left; margin-bottom: 10px;">
                            <div><strong>GOLDEN BRIDGE CORP. S.A.S</strong></div>
                            <div>CIUDAD: ${ciudadNombre}</div>
                            <div>NOMBRE: ${ejecutivo.nombre || ''}</div>
                            <div>IDENTIDAD: ${ejecutivo.identificacion || ''}</div>
                            <div>CARGO: ${cargoNombre}</div>
                            <div>FILIAL: ${ejecutivo.filial || data.ciudadCodigo || ''}</div>
                            <div>PERIODO DEL: ${formatDate(data.fechaInicio)} ${fechaFinal ? 'AL: ' + formatDate(fechaFinal) : ''}</div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>CIUDAD</th>
                                    <th>FACTURA</th>
                                    <th>MATRICULA</th>
                                    <th>VALOR CUOTA</th>
                                    <th>NOMBRE TITULAR</th>
                                    <th>VALOR COMISION</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bodyRows}
                            </tbody>
                        </table>
                    </div>
                `;
            });
        } else {
            // HTML normal por ejecutivo
            return generarHTMLLimpio();
        }
        
        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset='utf-8'>
                <title>Comprobante por Ejecutivo</title>
                <style>
                    @page { size: A4 landscape; margin: 1cm 0.5cm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 10px; line-height: 1.2; }
                    .report-title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 8px; text-transform: uppercase; }
                    .report-subtitle { font-size: 12px; margin-bottom: 8px; }
                    table { width: 100%; border-collapse: collapse; margin: 0 auto 15px auto; border: 1px solid #000; table-layout: fixed; }
                    th, td { border: 1px solid #000; padding: 4px 3px; text-align: left; font-size: 9px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
                    th { background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 8px; }
                    .footer { text-align: center; font-size: 8px; color: #888; margin-top: 15px; }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;
        return html;
    }


    window.exportExcel = function(){
        try {
            if (!window.XLSX) {
                alert('No se pudo cargar la librería de Excel. Por favor recarga la página.');
                return;
            }

            const data = loadData();

            if (data.tipoBusqueda === 'ciudad' && window.__ejecutivos && window.__ejecutivos.length > 0) {
                exportExcelCiudadMultiSheets(data);
            } else {
                exportExcelEjecutivoSimple(data);
            }
        } catch (e) {
            console.error('Error exportando Excel:', e);
            alert('Error al exportar a Excel');
        }
    };

    function formatValue(value) {
        if (value == null || value === '') return '';
        const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : Number(value);
        if (isNaN(num)) return value;
        return num;
    }

    function exportExcelCiudadMultiSheets(data) {
        const ciudadNombre = data.ciudadNombre || getCiudadNombre(data.ciudadCodigo || '');
        
        // Generar HTML con estilos para cada ejecutivo
        let allSheetsHTML = '';
        
        (window.__ejecutivos || []).forEach((ejecutivo, index) => {
            const sheetHTML = buildExecutiveSheetHTML(ejecutivo, data, index);
            allSheetsHTML += sheetHTML;
        });
        
        const excelHTML = `
            <html>
                <head>
                    <meta charset='utf-8'>
                    <title>Comprobante Ejecutivos</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px; 
                            font-size: 12px;
                        }
                        .sheet-section {
                            page-break-after: always;
                            margin-bottom: 50px;
                            padding-bottom: 30px;
                            border-bottom: 2px solid #ccc;
                        }
                        .sheet-section:last-child {
                            border-bottom: none;
                        }
                        .report-title { 
                            font-size: 16px; 
                            font-weight: bold; 
                            margin-bottom: 20px; 
                            margin-top: 10px;
                            text-transform: uppercase;
                        }
                        .info-container {
                            margin-bottom: 20px;
                            padding: 10px 0;
                        }
                        .info-row {
                            margin: 8px 0;
                            font-size: 11px;
                            line-height: 1.6;
                        }
                        .info-label {
                            font-weight: bold;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 20px 0;
                            border: 1px solid #000;
                        }
                        th, td { 
                            border: 1px solid #000; 
                            padding: 8px; 
                            text-align: left; 
                            font-size: 11px;
                        }
                        th { 
                            background-color: #f0f0f0; 
                            font-weight: bold; 
                            text-transform: uppercase;
                            text-align: center;
                            padding: 10px 8px;
                        }
                        .number-cell {
                            text-align: right;
                        }
                        .total-row {
                            font-weight: bold;
                            background-color: #f5f5f5;
                        }
                        .total-label {
                            text-align: right;
                        }
                    </style>
                </head>
                <body>
                    ${allSheetsHTML}
                </body>
            </html>
        `;
        
        try {
            const blob = new Blob([excelHTML], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Comprobante_Ejecutivos_${ciudadNombre.replace(/\s+/g, '_')}.xls`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exportando Excel:', error);
            alert('Error al exportar a Excel');
        }
    }
    
    function buildExecutiveSheetHTML(ejecutivo, data, index) {
        const ciudadNombre = data.ciudadNombre || getCiudadNombre(data.ciudadCodigo || '');
        const fechaInicio = formatDate(data.fechaInicio);
        const fechaFinal = data.fechaFinal ? formatDate(data.fechaFinal) : '';
        const filial = ejecutivo.filial || data.ciudadCodigo || '';
        const cargoNombre = getCargoNombre(ejecutivo.cargo, ejecutivo.area);
        
        let tableRows = '';
        (ejecutivo.facturas || []).forEach(f => {
            const valorCuota = Number(f.valorCuota) || 0;
            const valorComision = Number(f.valorComision) || 0;
            console.log('📊 Generando fila:', {
                factura: f.factura,
                valorCuota: valorCuota,
                valorComision: valorComision
            });
            tableRows += `
                <tr>
                    <td>${f.codigoCiudad || ''}</td>
                    <td>${f.factura || ''}</td>
                    <td>${f.matricula || ''}</td>
                    <td class="number-cell">${formatMoney(valorCuota)}</td>
                    <td>${(f.nombreTitular || '').toUpperCase()}</td>
                    <td class="number-cell">${formatMoney(valorComision)}</td>
                </tr>
            `;
        });
        
        return `
            <div class="sheet-section">
                <div class="report-title">GOLDEN BRIDGE CORP. S.A.S</div>
                <div class="info-container">
                    <div class="info-row">
                        <span class="info-label">CIUDAD:</span> ${ciudadNombre} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <span class="info-label">FILIAL:</span> ${filial}
                    </div>
                    <div class="info-row">
                        <span class="info-label">NOMBRE:</span> ${(ejecutivo.nombre || '').toUpperCase()} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <span class="info-label">IDENTIDAD:</span> ${ejecutivo.identificacion || ''}
                    </div>
                    <div class="info-row">
                        <span class="info-label">CARGO:</span> ${cargoNombre} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <span class="info-label">PERIODO:</span> DEL ${fechaInicio}${fechaFinal ? ` AL ${fechaFinal}` : ''}
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>CIUDAD</th>
                            <th>FACTURA</th>
                            <th>MATRICULA</th>
                            <th>VALOR CUOTA</th>
                            <th>NOMBRE TITULAR</th>
                            <th>VALOR COMISION</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                        <tr class="total-row">
                            <td colspan="5" class="total-label">TOTAL LIQUIDADO:</td>
                            <td class="number-cell">${formatMoney(Number(ejecutivo.totalLiquidado) || 0)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    function buildExecutiveSheetData(ejecutivo, data) {
        const ciudadNombre = data.ciudadNombre || getCiudadNombre(data.ciudadCodigo || '');
        const fechaInicio = formatDate(data.fechaInicio);
        const fechaFinal = data.fechaFinal ? formatDate(data.fechaFinal) : '';
        const filial = ejecutivo.filial || data.ciudadCodigo || '';
        const cargoNombre = getCargoNombre(ejecutivo.cargo, ejecutivo.area);

        const rows = [];

        rows.push(['GOLDEN BRIDGE CORP. S.A.S', '', '', '', '', '']);
        rows.push(['', '', '', '', '', '']);

        const infoRows = [
            ['CIUDAD:', ciudadNombre, '', 'FILIAL:', filial, ''],
            ['NOMBRE:', (ejecutivo.nombre || '').toUpperCase(), '', 'IDENTIDAD:', ejecutivo.identificacion || '', ''],
            ['CARGO:', cargoNombre, '', 'PERIODO:', `DEL ${fechaInicio}${fechaFinal ? ` AL ${fechaFinal}` : ''}`, '']
        ];

        infoRows.forEach(info => rows.push(info));

        rows.push(['', '', '', '', '', '']);
        rows.push(['CIUDAD', 'FACTURA', 'MATRICULA', 'VALOR CUOTA', 'NOMBRE TITULAR', 'VALOR COMISION']);

        (ejecutivo.facturas || []).forEach(f => {
            rows.push([
                f.codigoCiudad || '',
                f.factura || '',
                f.matricula || '',
                formatValue(f.valorCuota),
                (f.nombreTitular || '').toUpperCase(),
                formatValue(f.valorComision)
            ]);
        });

        rows.push(['', '', '', '', '', '']);
        rows.push(['', '', '', '', 'TOTAL LIQUIDADO:', formatValue(ejecutivo.totalLiquidado)]);

        return { rows, merges: [] };
    }

    function exportExcelEjecutivoSimple(data) {
        const rows = window.__rows || [];
        console.log('📊 Datos para exportar individual:', rows);
        
        const ejecutivo = {
            nombre: data.ejecutivoNombre || 'TODOS',
            identificacion: data.identificacion || '',
            filial: data.ciudadCodigo || '',
            cargo: '',
            facturas: rows.map(r => {
                const factura = {
                    codigoCiudad: r.ciudad || '',
                    factura: r.factura || '',
                    matricula: r.contrato || '',
                    valorCuota: r.cuotaInicial || 0,
                    nombreTitular: r.titular || '',
                    valorComision: r.valor || 0
                };
                console.log('📋 Factura mapeada:', factura);
                return factura;
            }),
            totalLiquidado: rows.reduce((sum, r) => {
                const valor = Number(r.valor) || 0;
                console.log('💰 Sumando valor:', valor, 'Total acumulado:', sum + valor);
                return sum + valor;
            }, 0)
        };
        
        console.log('📊 Ejecutivo final para exportar:', ejecutivo);
        console.log('💰 Total liquidado calculado:', ejecutivo.totalLiquidado);
        
        const sheetHTML = buildExecutiveSheetHTML(ejecutivo, data, 0);
        
        const excelHTML = `
            <html>
                <head>
                    <meta charset='utf-8'>
                    <title>Comprobante Ejecutivo</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px; 
                            font-size: 12px;
                        }
                        .sheet-section {
                            margin-bottom: 30px;
                        }
                        .report-title { 
                            font-size: 16px; 
                            font-weight: bold; 
                            margin-bottom: 20px; 
                            margin-top: 10px;
                            text-transform: uppercase;
                        }
                        .info-container {
                            margin-bottom: 20px;
                            padding: 10px 0;
                        }
                        .info-row {
                            margin: 8px 0;
                            font-size: 11px;
                            line-height: 1.6;
                        }
                        .info-label {
                            font-weight: bold;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 20px 0;
                            border: 1px solid #000;
                        }
                        th, td { 
                            border: 1px solid #000; 
                            padding: 8px; 
                            text-align: left; 
                            font-size: 11px;
                        }
                        th { 
                            background-color: #f0f0f0; 
                            font-weight: bold; 
                            text-transform: uppercase;
                            text-align: center;
                            padding: 10px 8px;
                        }
                        .number-cell {
                            text-align: right;
                        }
                        .total-row {
                            font-weight: bold;
                            background-color: #f5f5f5;
                        }
                        .total-label {
                            text-align: right;
                        }
                    </style>
                </head>
                <body>
                    ${sheetHTML}
                </body>
            </html>
        `;
        
        try {
            const blob = new Blob([excelHTML], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Comprobante_Ejecutivo.xls';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exportando Excel:', error);
            alert('Error al exportar a Excel');
        }
    }

    window.exportDOC = function(){
        try {
            const html = generarHTMLLimpioCompleto();
            const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Comprobante_Ejecutivo.doc';
            a.click();
            URL.revokeObjectURL(url);
        } catch(e) {
            console.error('Error exportando Word:', e);
            alert('Error al exportar a Word');
        }
    };

    window.exportPDF = function(){
        try {
            const data = loadData();
            
            // Si es reporte por ciudad, mostrar todas las páginas antes de imprimir
            if (data.tipoBusqueda === 'ciudad' && window.__ejecutivos && window.__ejecutivos.length > 0) {
                mostrarTodasLasPaginasParaImprimir();
            } else {
                // Exportación normal - usar window.print() directamente
                window.print();
            }
        } catch(e) {
            console.error('Error exportando PDF:', e);
            alert('Error al exportar a PDF');
        }
    };

    /**
     * Genera PDF con html2pdf.js donde cada ejecutivo está en una página separada
     */
    function generarPDFPorEjecutivo() {
        const data = loadData();
        const ejecutivos = window.__ejecutivos || [];
        const ciudadNombre = data.ciudadNombre || getCiudadNombre(data.ciudadCodigo || '');
        const fechaFinal = data.fechaFinal || '';
        
        // Crear HTML completo con todas las páginas
        let allPagesHTML = '';
        
        ejecutivos.forEach((ejecutivo, index) => {
            const cargoNombre = getCargoNombre(ejecutivo.cargo, ejecutivo.area);
            const facturas = ejecutivo.facturas || [];
            
            let tableRows = '';
            facturas.forEach(f => {
                tableRows += `
                    <tr>
                        <td style="border: 1px solid #000; padding: 6px; font-size: 10px;">${f.codigoCiudad || ''}</td>
                        <td style="border: 1px solid #000; padding: 6px; font-size: 10px;">${f.factura || ''}</td>
                        <td style="border: 1px solid #000; padding: 6px; font-size: 10px;">${f.matricula || ''}</td>
                        <td style="border: 1px solid #000; padding: 6px; font-size: 10px; text-align:right;">${formatMoney(f.valorCuota || 0)}</td>
                        <td style="border: 1px solid #000; padding: 6px; font-size: 10px;">${f.nombreTitular || ''}</td>
                        <td style="border: 1px solid #000; padding: 6px; font-size: 10px; text-align:right;">${formatMoney(f.valorComision || 0)}</td>
                    </tr>
                `;
            });
            
            tableRows += `
                <tr style="font-weight:bold; background-color:#f0f0f0;">
                    <td colspan="5" style="border: 1px solid #000; padding: 6px; font-size: 10px; text-align:right; padding-right: 20px;">TOTAL LIQUIDADO:</td>
                    <td style="border: 1px solid #000; padding: 6px; font-size: 10px; text-align:right;">${formatMoney(ejecutivo.totalLiquidado || 0)}</td>
                </tr>
            `;
            
            // Agregar salto de página después de cada ejecutivo (excepto el último)
            // Usar clase específica para html2pdf.js y atributo data-pagebreak
            const pageBreakAttr = index < ejecutivos.length - 1 ? 'data-pagebreak="true"' : '';
            const pageBreakClass = index < ejecutivos.length - 1 ? 'pdf-page-break' : '';
            
            allPagesHTML += `
                <div ${pageBreakAttr} class="${pageBreakClass}" style="padding: 20px; min-height: 100vh; box-sizing: border-box; page-break-after: always; break-after: page;">
                    <div style="background-color: #f8f9fa; border: 1px solid #ccc; border-radius: 8px; padding: 12px 15px; margin-bottom: 15px;">
                        <div style="font-size: 14px; font-weight: 700; color: #333; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 6px;">
                            GOLDEN BRIDGE CORP. S.A.S
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 20px 30px; align-items: center; font-size: 11px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 10px;">CIUDAD:</span>
                                <span style="font-weight: 700; color: #000; font-size: 12px;">${ciudadNombre}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 10px;">FILIAL:</span>
                                <span style="font-weight: 700; color: #000; font-size: 12px;">${ejecutivo.filial || data.ciudadCodigo || ''}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 300px;">
                                <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 10px;">NOMBRE:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${ejecutivo.nombre || ''}</span>
                                <span style="font-weight: normal; color: #555; font-size: 11px; margin-left: 15px;">IDENTIDAD:</span>
                                <span style="font-weight: 700; color: #000; font-size: 11px;">${ejecutivo.identificacion || ''}</span>
                                <span style="font-weight: normal; color: #555; font-size: 11px; margin-left: 15px;">CARGO:</span>
                                <span style="font-weight: 700; color: #000; font-size: 11px;">${cargoNombre}</span>
                                <span style="font-weight: normal; color: #555; font-size: 11px; margin-left: 15px;">PERIODO:</span>
                                <span style="font-weight: 700; color: #000; font-size: 11px;">DEL ${formatDate(data.fechaInicio)} ${fechaFinal ? 'AL ' + formatDate(fechaFinal) : ''}</span>
                            </div>
                        </div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 10px;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; font-size: 10px; text-transform: uppercase;">CIUDAD</th>
                                <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; font-size: 10px; text-transform: uppercase;">FACTURA</th>
                                <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; font-size: 10px; text-transform: uppercase;">MATRICULA</th>
                                <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; font-size: 10px; text-transform: uppercase;">VALOR CUOTA</th>
                                <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; font-size: 10px; text-transform: uppercase;">NOMBRE TITULAR</th>
                                <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; font-size: 10px; text-transform: uppercase;">VALOR COMISION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        // Crear elemento temporal para el PDF con estilos CSS
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '297mm'; // Ancho A4 landscape
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        
        // Agregar estilos CSS para saltos de página
        const style = document.createElement('style');
        style.id = 'pdf-page-break-styles';
        // Eliminar estilos previos si existen
        const existingStyle = document.getElementById('pdf-page-break-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        style.textContent = `
            .pdf-page-break {
                page-break-after: always !important;
                break-after: page !important;
                display: block !important;
            }
            [data-pagebreak="true"] {
                page-break-after: always !important;
                break-after: page !important;
            }
            @media print {
                .pdf-page-break,
                [data-pagebreak="true"] {
                    page-break-after: always !important;
                    break-after: page !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        tempDiv.innerHTML = allPagesHTML;
        document.body.appendChild(tempDiv);
        
        // Configuración de html2pdf
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Comprobante_Ejecutivos_${ciudadNombre.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true,
                logging: false
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'landscape' 
            },
            pagebreak: { 
                mode: ['css', 'legacy'],
                before: '[data-pagebreak="true"]',
                after: '[data-pagebreak="true"]',
                avoid: ['tr']
            }
        };
        
        // Generar PDF
        html2pdf().set(opt).from(tempDiv).save().then(() => {
            // Limpiar elemento temporal y estilos
            document.body.removeChild(tempDiv);
            document.head.removeChild(style);
        }).catch((error) => {
            console.error('Error generando PDF:', error);
            if (tempDiv.parentNode) {
                document.body.removeChild(tempDiv);
            }
            if (style.parentNode) {
                document.head.removeChild(style);
            }
            alert('Error al generar el PDF. Por favor, intente nuevamente.');
        });
    }

    /**
     * Muestra todas las páginas de ejecutivos para imprimir (método alternativo con window.print)
     */
    function mostrarTodasLasPaginasParaImprimir() {
        const data = loadData();
        const ejecutivos = window.__ejecutivos || [];
        const ciudadNombre = data.ciudadNombre || getCiudadNombre(data.ciudadCodigo || '');
        const fechaFinal = data.fechaFinal || '';
        
        // Guardar el estado actual
        const currentPage = window.__page;
        const reportRoot = document.getElementById('reportRoot');
        
        // Crear contenedor para todas las páginas
        let allPagesHTML = '';
        
        ejecutivos.forEach((ejecutivo, index) => {
            const cargoNombre = getCargoNombre(ejecutivo.cargo, ejecutivo.area);
            const facturas = ejecutivo.facturas || [];
            
            let tableRows = '';
            facturas.forEach(f => {
                tableRows += `
                    <tr>
                        <td>${f.codigoCiudad || ''}</td>
                        <td>${f.factura || ''}</td>
                        <td>${f.matricula || ''}</td>
                        <td style="text-align:right;">${formatMoney(f.valorCuota || 0)}</td>
                        <td>${f.nombreTitular || ''}</td>
                        <td style="text-align:right;">${formatMoney(f.valorComision || 0)}</td>
                    </tr>
                `;
            });
            
            tableRows += `
                <tr style="font-weight:bold; background-color:#f0f0f0;">
                    <td colspan="5" style="text-align:right; padding-right: 20px;">TOTAL LIQUIDADO:</td>
                    <td style="text-align:right;">${formatMoney(ejecutivo.totalLiquidado || 0)}</td>
                </tr>
            `;
            
            // Agregar salto de página después de cada ejecutivo (excepto el último)
            const pageBreakClass = index < ejecutivos.length - 1 ? 'print-page-break' : '';
            
            allPagesHTML += `
                <div class="print-page ${pageBreakClass}" style="padding: 20px; min-height: 100vh; box-sizing: border-box;">
                    <div style="background-color: #f8f9fa; border: 1px solid #ccc; border-radius: 8px; padding: 12px 15px; margin-bottom: 15px;">
                        <div style="font-size: 13px; font-weight: 700; color: #333; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 6px;">
                            GOLDEN BRIDGE CORP. S.A.S
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 20px 30px; align-items: center; font-size: 12px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">CIUDAD:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px;">${ciudadNombre}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">FILIAL:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px;">${ejecutivo.filial || data.ciudadCodigo || ''}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 300px;">
                                <span style="font-weight: normal; color: #555; text-transform: uppercase; font-size: 11px;">NOMBRE:</span>
                                <span style="font-weight: 700; color: #000; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">${ejecutivo.nombre || ''}</span>
                                <span style="font-weight: normal; color: #555; font-size: 13px; margin-left: 15px;">IDENTIDAD:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px;">${ejecutivo.identificacion || ''}</span>
                                <span style="font-weight: normal; color: #555; font-size: 13px; margin-left: 15px;">CARGO:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px;">${cargoNombre}</span>
                                <span style="font-weight: normal; color: #555; font-size: 13px; margin-left: 15px;">PERIODO:</span>
                                <span style="font-weight: 700; color: #000; font-size: 13px;">DEL ${formatDate(data.fechaInicio)} ${fechaFinal ? 'AL ' + formatDate(fechaFinal) : ''}</span>
                            </div>
                        </div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid #000; padding: 4px; background-color: #f0f0f0; font-weight: bold;">CIUDAD</th>
                                <th style="border: 1px solid #000; padding: 4px; background-color: #f0f0f0; font-weight: bold;">FACTURA</th>
                                <th style="border: 1px solid #000; padding: 4px; background-color: #f0f0f0; font-weight: bold;">MATRICULA</th>
                                <th style="border: 1px solid #000; padding: 4px; background-color: #f0f0f0; font-weight: bold;">VALOR CUOTA</th>
                                <th style="border: 1px solid #000; padding: 4px; background-color: #f0f0f0; font-weight: bold;">NOMBRE TITULAR</th>
                                <th style="border: 1px solid #000; padding: 4px; background-color: #f0f0f0; font-weight: bold;">VALOR COMISION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        // Limpiar cualquier contenido de impresión previo
        const existingPrintContent = document.getElementById('printContent');
        if (existingPrintContent) {
            existingPrintContent.remove();
        }
        
        // Guardar estados de visibilidad de todos los elementos del body
        const bodyChildren = Array.from(document.body.children);
        const originalDisplay = [];
        bodyChildren.forEach((child) => {
            if (child.id !== 'printContent') {
                // Guardar el estado actual
                originalDisplay.push({
                    element: child,
                    display: child.style.display || '',
                    visibility: child.style.visibility || '',
                    opacity: child.style.opacity || ''
                });
                // Ocultar completamente
                child.style.display = 'none';
                child.style.visibility = 'hidden';
            }
        });
        
        // También ocultar el body background pero permitir scroll en el contenedor
        const originalBodyStyle = {
            overflow: document.body.style.overflow || '',
            background: document.body.style.background || '',
            margin: document.body.style.margin || '',
            padding: document.body.style.padding || ''
        };
        document.body.style.overflow = 'hidden';
        document.body.style.background = 'white';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        
        // Ocultar también el html pero permitir scroll en el contenedor
        const htmlElement = document.documentElement;
        const originalHtmlStyle = {
            overflow: htmlElement.style.overflow || '',
            background: htmlElement.style.background || '',
            margin: htmlElement.style.margin || '',
            padding: htmlElement.style.padding || '',
            height: htmlElement.style.height || ''
        };
        htmlElement.style.overflow = 'hidden';
        htmlElement.style.background = 'white';
        htmlElement.style.margin = '0';
        htmlElement.style.padding = '0';
        htmlElement.style.height = '100%';
        
        // Agregar estilos CSS para impresión
        const printStyle = document.createElement('style');
        printStyle.id = 'print-styles-comprobante';
        // Eliminar estilos previos si existen
        const existingPrintStyle = document.getElementById('print-styles-comprobante');
        if (existingPrintStyle) {
            existingPrintStyle.remove();
        }
        printStyle.textContent = `
            * {
                box-sizing: border-box;
            }
            @media screen {
                html, body {
                    height: 100% !important;
                    overflow: hidden !important;
                }
                #printContent {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: white;
                    z-index: 99999;
                    overflow-y: auto !important;
                    overflow-x: hidden !important;
                    padding: 20px;
                    margin: 0;
                }
                .print-page {
                    margin-bottom: 30px;
                    padding: 20px;
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    width: 100%;
                    min-height: calc(100vh - 40px);
                    display: block;
                }
                .print-page.print-page-break {
                    page-break-after: always;
                    break-after: page;
                }
                .print-page:last-child {
                    margin-bottom: 0;
                }
            }
            @media print {
                @page {
                    size: A4 landscape;
                    margin: 1cm;
                }
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: visible !important;
                }
                #printContent {
                    position: static !important;
                    width: 100% !important;
                    height: auto !important;
                    overflow: visible !important;
                    padding: 0 !important;
                }
                .print-page {
                    margin: 0 !important;
                    padding: 20px !important;
                    box-shadow: none !important;
                    min-height: auto !important;
                }
                .print-page.print-page-break {
                    page-break-after: always !important;
                    break-after: page !important;
                }
                .print-page:last-child {
                    page-break-after: auto !important;
                    break-after: auto !important;
                }
            }
        `;
        document.head.appendChild(printStyle);
        
        // Crear contenedor para impresión
        const printContainer = document.createElement('div');
        printContainer.id = 'printContent';
        printContainer.className = 'print-content';
        printContainer.innerHTML = allPagesHTML;
        
        // Agregar al body
        document.body.appendChild(printContainer);
        
        // Mostrar solo el contenido de impresión
        printContainer.style.display = 'block';
        
        // Esperar un momento para que se renderice antes de imprimir
        setTimeout(() => {
            window.print();
        }, 100);
        
        // Restaurar después de imprimir
        const restoreContent = () => {
            // Remover contenido de impresión
            if (printContainer && printContainer.parentNode) {
                printContainer.remove();
            }
            
            // Remover estilos de impresión
            const printStyleToRemove = document.getElementById('print-styles-comprobante');
            if (printStyleToRemove && printStyleToRemove.parentNode) {
                printStyleToRemove.remove();
            }
            
            // Restaurar visibilidad de todos los elementos
            originalDisplay.forEach(saved => {
                if (saved && saved.element && saved.element.parentNode) {
                    // Restaurar display - siempre quitar el style para usar CSS por defecto
                    saved.element.style.removeProperty('display');
                    // Restaurar visibility
                    saved.element.style.removeProperty('visibility');
                    // Restaurar opacity
                    saved.element.style.removeProperty('opacity');
                }
            });
            
            // Restaurar estilos del body y html
            document.body.style.overflow = originalBodyStyle.overflow;
            document.body.style.background = originalBodyStyle.background;
            document.body.style.margin = originalBodyStyle.margin;
            document.body.style.padding = originalBodyStyle.padding;
            htmlElement.style.overflow = originalHtmlStyle.overflow;
            htmlElement.style.background = originalHtmlStyle.background;
            htmlElement.style.margin = originalHtmlStyle.margin;
            htmlElement.style.padding = originalHtmlStyle.padding;
            htmlElement.style.height = originalHtmlStyle.height;
            
            // Restaurar página y re-renderizar
            window.__page = currentPage;
            // Forzar re-renderizado inmediato
            renderTable();
            updatePagination();
        };
        
        // Usar evento afterprint para restaurar cuando se cierre el diálogo de impresión
        const afterPrintHandler = () => {
            restoreContent();
        };
        window.addEventListener('afterprint', afterPrintHandler, { once: true });
        
        // También escuchar cuando se cancela la impresión
        window.addEventListener('focus', () => {
            // Si después de un tiempo el contenido de impresión sigue ahí, restaurar
            setTimeout(() => {
                if (document.getElementById('printContent')) {
                    restoreContent();
                    window.removeEventListener('afterprint', afterPrintHandler);
                }
            }, 500);
        }, { once: true });
        
        // Fallback: restaurar después de un tiempo si afterprint no funciona
        setTimeout(() => {
            if (document.getElementById('printContent')) {
                restoreContent();
                window.removeEventListener('afterprint', afterPrintHandler);
            }
        }, 2000);
    }

    function init(){
        const data = loadData();
        if (!data.fechaInicio) {
            document.getElementById('tbody').innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#dc3545;">Error: No se encontraron datos del reporte</td></tr>';
            return;
        }

        // Procesar datos
        const ciudadCodigo = data.ciudadCodigo || '';
        const result = processReportData(data.fechaInicio, data.identificacion || data.ejecutivoIdentificacion, ciudadCodigo, data.tipoBusqueda);
        
        // Si es reporte por ciudad, guardar ejecutivos
        if (data.tipoBusqueda === 'ciudad' && result.ejecutivos) {
            window.__ejecutivos = result.ejecutivos;
            window.__rows = [];
            window.__page = 1;
            window.__pageSize = 1; // Una página por ejecutivo
        } else {
            window.__rows = result.rows;
            window.__ejecutivos = [];
            window.__pageSize = 50;
            
            // Agregar fila de total al final
            if (window.__rows.length > 0) {
                window.__rows.push({
                    ciudad: '',
                    factura: '',
                    contrato: '',
                    cuotaInicial: '',
                    titular: 'TOTAL',
                    valor: result.totalValor,
                    isTotal: true
                });
            }
            
            // Actualizar encabezado normal
            document.getElementById('fechaInicio').textContent = formatDate(data.fechaInicio);
            document.getElementById('ejecutivoNombre').textContent = data.ejecutivoNombre || 'TODOS LOS EJECUTIVOS';
            const identificacionSpan = document.getElementById('ejecutivoIdentificacionSpan');
            if (identificacionSpan) {
                if (data.ejecutivoIdentificacion && data.ejecutivoIdentificacion.trim() !== '') {
                    identificacionSpan.textContent = ` (${data.ejecutivoIdentificacion})`;
                } else {
                    identificacionSpan.textContent = '';
                }
            }
            const ciudadNombre = data.ciudadNombre || 'TODAS LAS CIUDADES';
            document.getElementById('ciudadNombre').textContent = ciudadNombre;
        }

        renderTable();
        updatePagination();
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

