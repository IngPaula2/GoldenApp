/**
 * ====================================================================================
 * 📊 REPORTE SEMANAL DE NÓMINA - GOLDEN APP
 * ====================================================================================
 * 
 * Este archivo genera el reporte semanal de nómina con el detalle de facturas,
 * contratos, escalas y comisiones.
 * 
 * FUNCIONALIDADES:
 * - Genera reporte detallado de facturas por rango de fechas
 * - Muestra información de contratos, cuotas iniciales y comisiones
 * - Agrupa datos por factura con subtotales
 * - Muestra escalas y ejecutivos asociados a cada factura
 * - Exporta a Excel, Word y PDF
 * - Paginación y zoom para mejor visualización
 * 
 * ====================================================================================
 * 🔗 INSTRUCCIONES DE INTEGRACIÓN CON BACKEND
 * ====================================================================================
 * 
 * INGENIERO: Este módulo actualmente usa localStorage para obtener datos de nóminas,
 * facturas, contratos y empleados. Debes reemplazar todas las llamadas a localStorage
 * con llamadas a la API del backend.
 * 
 * ENDPOINT PRINCIPAL RECOMENDADO:
 * 
 * GET /api/nomina/reportes/semanal
 * Query Parameters:
 *   - ciudadCodigo: string (requerido) - Código de la ciudad
 *   - fechaInicio: string (requerido) - Fecha de inicio en formato YYYY-MM-DD
 *   - fechaFin: string (requerido) - Fecha de fin en formato YYYY-MM-DD
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     facturas: [
 *       {
 *         numeroFactura: string,
 *         numeroContrato: string,
 *         fechaFinal: string,
 *         cuotaInicial: number,
 *         valor: number,
 *         titular: string,
 *         escalas: [
 *           {
 *             codigo: string,
 *             nombre: string,
 *             empleadoId: string,
 *             empleadoNombre: string,
 *             valor: number
 *           }
 *         ]
 *       }
 *     ],
 *     totalGeneral: number
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
 *   fetch(`/api/nomina/reportes/semanal?ciudadCodigo=${ciudadCodigo}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
 * 
 * - getContractInfo(contractNumber, cityCode) - Línea ~XX
 *   Reemplazar: localStorage.getItem('contratosData')
 *   Con: fetch(`/api/contratos/${contractNumber}?ciudad=${cityCode}`)
 * 
 * - getEmployeeNameByIdentification(identificacion, cityCode) - Línea ~XX
 *   Reemplazar: localStorage.getItem('empleadosByCity')
 *   Con: fetch(`/api/empleados?ciudad=${cityCode}&identificacion=${identificacion}`)
 * 
 * ALTERNATIVA SIMPLIFICADA:
 * Si prefieres, puedes crear un único endpoint que haga toda la lógica del reporte
 * en el backend y solo devuelva los datos procesados. Esto simplificaría mucho
 * el código del frontend.
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
        // Formatear sin decimales, solo con separador de miles
        return new Intl.NumberFormat('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0}).format(Number(n));
    }

    /**
     * 🔗 BACKEND INTEGRATION - CARGAR DATOS DEL REPORTE
     * 
     * Carga los parámetros del reporte desde localStorage (temporal).
     * 
     * BACKEND: Reemplazar con llamada a API
     * - Endpoint: GET /api/nomina/reportes/semanal?ciudad={codigo}&fechaInicio={fecha}&fechaFin={fecha}
     * - Método: GET
     * - Headers: { 'Authorization': 'Bearer {token}' }
     * - Response: { facturas: [...], totalGeneral: number, ciudadCodigo: string, fechaInicio: string, fechaFin: string }
     * 
     * @returns {Object} Datos del reporte { codigoFilial, fechaInicio, fechaFin }
     */
    function loadData(){
        try {
            // TODO: Reemplazar con llamada a API del backend
            const raw = localStorage.getItem('reporteNominaSemanalData');
            if (raw){
                const data = JSON.parse(raw);
                return data;
            }
        } catch(e) {
            console.error('Error cargando datos:', e);
        }
        return { codigoFilial: '', fechaInicio: '', fechaFin: '' };
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
            if (!empleadosByCity) {
                console.warn('⚠️ No hay datos de empleados en localStorage');
                return null;
            }
            
            const data = JSON.parse(empleadosByCity);
            if (!data[cityCode]) {
                console.warn('⚠️ No hay datos de empleados para la ciudad:', cityCode);
                console.log('📋 Ciudades disponibles:', Object.keys(data));
                return null;
            }
            
            // Normalizar la identificación para buscar
            const idBuscado = String(identificacion).trim();
            const idBuscadoNum = idBuscado.replace(/\D/g, '');
            
            const empleados = data[cityCode];
            console.log('🔍 Buscando en ciudad:', cityCode, 'Total empleados:', Object.keys(empleados).length);
            
            // Buscar coincidencia exacta primero (por clave del objeto)
            if (empleados[idBuscado]) {
                console.log('✅ Empleado encontrado por coincidencia exacta de clave');
                return empleados[idBuscado];
            }
            
            // Buscar por coincidencia numérica o parcial en las claves
            for (const [id, empleado] of Object.entries(empleados)) {
                const idNormalizado = String(id).trim();
                const idSoloNumeros = idNormalizado.replace(/\D/g, '');
                
                // Comparar claves
                if (idNormalizado === idBuscado || 
                    (idSoloNumeros && idSoloNumeros === idBuscadoNum && idBuscadoNum.length > 0) ||
                    idNormalizado.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, '')) {
                    console.log('✅ Empleado encontrado por coincidencia de clave:', id);
                    return empleado;
                }
                
                // También comparar con el campo identificacion del empleado
                const empId = empleado.identificacion ? String(empleado.identificacion).trim() : '';
                const empIdNum = empId.replace(/\D/g, '');
                
                if (empId && (empId === idBuscado || 
                    (empIdNum && empIdNum === idBuscadoNum && idBuscadoNum.length > 0) ||
                    empId.replace(/\s+/g, '') === idBuscado.replace(/\s+/g, ''))) {
                    console.log('✅ Empleado encontrado por campo identificacion:', empId);
                    return empleado;
                }
            }
            
            console.warn('⚠️ No se encontró empleado con identificación:', idBuscado, 'en ciudad:', cityCode);
            return null;
        } catch(e) {
            console.error('❌ Error obteniendo empleado:', e);
            return null;
        }
    }

    function getPYFEmployeeFromContract(contract, cityCode){
        // Buscar el ejecutivo del contrato (debe ser un empleado de PYF)
        // Priorizar executiveId que es el campo que se guarda al actualizar el contrato
        const ejecutivoId = contract.executiveId || 
                           contract.ejecutivoId || 
                           contract.executive || 
                           contract.ejecutivo || 
                           contract.ejecutivoCedula ||
                           contract.executiveCedula || '';
        
        console.log('🔍 ===== BUSCANDO EJECUTIVO EN CONTRATO =====');
        console.log('📋 Contrato:', contract.numeroContrato || contract.numero || contract.contractNumber);
        console.log('🔑 Campos del contrato relacionados:', {
            executiveId: contract.executiveId,
            ejecutivoId: contract.ejecutivoId,
            executive: contract.executive,
            ejecutivo: contract.ejecutivo
        });
        console.log('🎯 ID de ejecutivo seleccionado:', ejecutivoId);
        console.log('🏙️ Ciudad:', cityCode);
        
        if (!ejecutivoId) {
            console.error('❌ No se encontró ejecutivo en el contrato');
            console.log('📋 Todos los campos del contrato:', Object.keys(contract));
            console.log('💡 Verifica que el contrato tenga el campo "executiveId" o "ejecutivoId" guardado');
            return null;
        }
        
        // Limpiar y normalizar la identificación
        const ejecutivoIdClean = String(ejecutivoId).trim();
        console.log('🔍 Buscando empleado con identificación:', ejecutivoIdClean, 'en ciudad:', cityCode);
        
        const empleado = getEmployeeByIdentification(ejecutivoIdClean, cityCode);
        
        if (!empleado) {
            console.error('❌ No se encontró empleado con identificación:', ejecutivoIdClean, 'en ciudad:', cityCode);
            console.log('📋 Intentando buscar en todas las ciudades disponibles...');
            
            // Verificar datos disponibles
            try {
                const empleadosByCity = localStorage.getItem('empleadosByCity');
                if (!empleadosByCity) {
                    console.error('❌ No hay datos de empleados en localStorage');
                    return null;
                }
                
                const data = JSON.parse(empleadosByCity);
                console.log('📊 Ciudades disponibles:', Object.keys(data));
                
                // Intentar buscar en todas las ciudades como fallback
                for (const [city, empleados] of Object.entries(data)) {
                    console.log('🔍 Buscando en ciudad:', city, 'Total empleados:', Object.keys(empleados).length);
                    for (const [id, emp] of Object.entries(empleados)) {
                        const idNormalizado = String(id).trim();
                        const idBuscado = ejecutivoIdClean;
                        const idNormalizadoNum = idNormalizado.replace(/\D/g, '');
                        const idBuscadoNum = idBuscado.replace(/\D/g, '');
                        
                        if (idNormalizado === idBuscado || 
                            (idNormalizadoNum && idNormalizadoNum === idBuscadoNum && idBuscadoNum.length > 0)) {
                            console.log('✅ Empleado encontrado en ciudad:', city, 'con ID:', id);
                            console.log('📋 Información:', {
                                identificacion: emp.identificacion,
                                area: emp.area,
                                tieneEscalas: !!emp.escalasData
                            });
                            
                            if (emp.area === 'pyf' && emp.escalasData) {
                                console.log('✅ Empleado de PYF válido encontrado en ciudad:', city);
                                return emp;
                            } else {
                                console.warn('⚠️ Empleado encontrado pero no es PYF o no tiene escalas. Área:', emp.area);
                            }
                        }
                    }
                }
            } catch(e) {
                console.error('❌ Error en búsqueda alternativa:', e);
            }
            
            console.error('❌ No se pudo encontrar el empleado en ninguna ciudad');
            console.log('💡 Verifica que:');
            console.log('   1. La identificación en el contrato ("executiveId") coincida exactamente con la del empleado');
            console.log('   2. El empleado esté guardado en localStorage');
            console.log('   3. El empleado tenga área = "pyf"');
            console.log('   4. El empleado tenga escalas configuradas (escalasData)');
            return null;
        }
        
        console.log('✅ Empleado encontrado:', {
            identificacion: empleado.identificacion,
            nombre: [empleado.tPrimerApellido || empleado.primerApellido, empleado.tPrimerNombre || empleado.primerNombre].filter(Boolean).join(' '),
            area: empleado.area,
            tieneEscalas: !!empleado.escalasData
        });
        
        // Verificar que sea un empleado de PYF
        if (empleado.area !== 'pyf') {
            console.warn('⚠️ El ejecutivo no es un empleado de PYF. Área:', empleado.area);
            return null;
        }
        
        // Verificar que tenga escalas
        if (!empleado.escalasData) {
            console.warn('⚠️ El empleado de PYF no tiene escalas configuradas. Identificación:', empleado.identificacion);
            return null;
        }
        
        console.log('✅ Empleado de PYF válido con escalas:', {
            identificacion: empleado.identificacion,
            escalas: Object.keys(empleado.escalasData)
        });
        
        return empleado;
    }

    function getEmployeeNameForScale(scaleCode, contract, cityCode){
        if (!contract) {
            console.warn('⚠️ No hay contrato para buscar ejecutivo');
            return '';
        }
        
        // Obtener el empleado de PYF del contrato
        const pyfEmployee = getPYFEmployeeFromContract(contract, cityCode);
        
        if (!pyfEmployee || !pyfEmployee.escalasData) {
            console.warn('⚠️ No se encontró empleado de PYF con escalas para el contrato');
            return '';
        }
        
        // Normalizar el código de escala a minúsculas para buscar en escalasData
        const scaleName = String(scaleCode || '').trim().toLowerCase();
        
        // Mapeo de códigos/nombres de escala a campos de escalasData del empleado PYF
        let identificacion = '';
        
        if (scaleName.includes('asesor') || scaleName === 'as' || scaleName === 'asesor') {
            identificacion = pyfEmployee.escalasData.asesor || '';
        } else if (scaleName.includes('supervisor') || scaleName === 'su' || scaleName === 'supervisor') {
            identificacion = pyfEmployee.escalasData.supervisor || '';
        } else if (scaleName.includes('subgerente') || scaleName === 'sg' || scaleName === 'subgerente' || scaleName.includes('sub gerente')) {
            identificacion = pyfEmployee.escalasData.subgerente || '';
        } else if ((scaleName.includes('gerente') && !scaleName.includes('sub')) || scaleName === 'gt' || scaleName === 'gerente') {
            identificacion = pyfEmployee.escalasData.gerente || '';
        } else if (scaleName.includes('director') && scaleName.includes('nacional') || scaleName === 'dn' || scaleName === 'director nacional') {
            identificacion = pyfEmployee.escalasData.directorNacional || '';
        } else if (scaleName.includes('subdirector') || (scaleName.includes('director') && scaleName.includes('sub')) || scaleName === 'sn' || scaleName.includes('sub director')) {
            identificacion = pyfEmployee.escalasData.subdirectorNacional || '';
        } else if (scaleName.includes('director') && !scaleName.includes('sub') && !scaleName.includes('nacional') || scaleName === 'dr' || scaleName === 'director') {
            identificacion = pyfEmployee.escalasData.director || '';
        }
        
        if (!identificacion) {
            console.warn('⚠️ No se encontró identificación para escala:', scaleCode, 'en escalas del empleado PYF:', pyfEmployee.identificacion);
            return '';
        }
        
        // Limpiar la identificación
        identificacion = String(identificacion).trim();
        
        if (!identificacion) {
            return '';
        }
        
        // Obtener el nombre del empleado que está en esa escala
        const nombre = getEmployeeNameByIdentification(identificacion, cityCode);
        
        if (!nombre) {
            console.warn('⚠️ No se encontró nombre para identificación:', identificacion, 'en ciudad:', cityCode);
        } else {
            console.log('✅ Empleado encontrado en escala:', { 
                escala: scaleCode, 
                empleadoPYF: pyfEmployee.identificacion,
                identificacionEscala: identificacion, 
                nombre 
            });
        }
        
        return nombre;
    }

    /**
     * 🔗 BACKEND INTEGRATION - PROCESAR DATOS DEL REPORTE
     * 
     * Procesa los datos de nóminas y facturas para generar el reporte semanal.
     * 
     * BACKEND: Reemplazar con llamada a API
     * - Endpoint: GET /api/nomina/reportes/semanal?ciudad={codigo}&fechaInicio={fecha}&fechaFin={fecha}
     * - Método: GET
     * - Headers: { 'Authorization': 'Bearer {token}' }
     * - Response: { facturas: [...], totalGeneral: number }
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
            // const response = await fetch(`/api/nomina/reportes/semanal?ciudad=${codigoFilial}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
            //     method: 'GET',
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            // const reportData = await response.json();
            // const payrolls = reportData.nominas || [];
            
            // TODO: Reemplazar con llamada a API del backend
            // Cargar nóminas de la filial especificada
            const stored = localStorage.getItem(`nominaSemanal_${codigoFilial}`);
            if (!stored) return { rows: [], totalGeneral: 0 };
            
            const payrolls = JSON.parse(stored);
            const fechaInicioDate = new Date(fechaInicio + 'T00:00:00');
            const fechaFinDate = new Date(fechaFin + 'T23:59:59');
            
            // Filtrar nóminas por rango de fechas
            const filteredPayrolls = payrolls.filter(payroll => {
                const payrollStart = new Date(payroll.fechaInicio);
                const payrollEnd = new Date(payroll.fechaFin);
                return (payrollStart <= fechaFinDate && payrollEnd >= fechaInicioDate);
            });
            
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
                    const matricula = contract ? (contract.numeroContrato || contract.numero || contract.contractNumber || '') : '';
                    
                    // Obtener y normalizar cuota inicial - SIEMPRE desde el contrato primero
                    let cuotaInicial = 0;
                    
                    // PRIORIDAD 1: Buscar en el contrato/planData
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
                                    console.log('✅ Cuota inicial obtenida de planData del contrato:', cuotaInicial);
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
                                            console.log('✅ Cuota inicial obtenida del plan:', cuotaInicial);
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
                                // Eliminar todos los puntos (separadores de miles)
                                cleanValue = cleanValue.replace(/\./g, '');
                                // Reemplazar coma por punto para parseFloat
                                cleanValue = cleanValue.replace(',', '.');
                            } else if (cleanValue.includes('.')) {
                                // Si tiene punto, verificar si son separadores de miles
                                const parts = cleanValue.split('.');
                                if (parts.length > 2 || (parts.length === 2 && parts[1].length > 2)) {
                                    // Son separadores de miles, eliminar todos los puntos
                                    cleanValue = cleanValue.replace(/\./g, '');
                                }
                            }
                            // Eliminar cualquier otro carácter no numérico excepto punto
                            cleanValue = cleanValue.replace(/[^\d.]/g, '');
                            cuotaInicial = parseFloat(cleanValue) || 0;
                        } else {
                            // Si es número, usarlo directamente
                            cuotaInicial = Number(factura.cuotaInicial) || 0;
                        }
                        
                        if (cuotaInicial > 0) {
                            console.log('⚠️ Cuota inicial obtenida de factura (fallback):', cuotaInicial);
                        }
                    }
                    
                    console.log('📊 Cuota inicial final:', {
                        factura: factura.numeroFactura,
                        valor: cuotaInicial,
                        valorFormateado: formatCuotaInicial(cuotaInicial)
                    });
                    
                    // Obtener escalas de la factura
                    const escalas = factura.escalas || [];
                    let subtotalFactura = 0;
                    
                    // Procesar cada escala
                    escalas.forEach(escala => {
                        // Obtener el código de escala (puede venir en diferentes campos)
                        const scaleCode = escala.codigo || escala.codigoEscala || escala.nombre || escala.nombreEscala || '';
                        const nombreEjecutivo = getEmployeeNameForScale(scaleCode, contract, codigoFilial);
                        const comision = escala.valor || escala.valorEscala || 0;
                        subtotalFactura += comision;
                        totalGeneral += comision;
                        
                        rows.push({
                            factura: factura.numeroFactura || '',
                            matricula: matricula,
                            cuotaInicial: cuotaInicial,
                            escala: escala.nombre || escala.nombreEscala || escala.codigo || escala.codigoEscala || '',
                            nombre: nombreEjecutivo,
                            comision: comision,
                            isSubtotal: false
                        });
                    });
                    
                    // Agregar fila de subtotal
                    rows.push({
                        factura: '',
                        matricula: '',
                        cuotaInicial: '',
                        escala: 'SUBTOTAL',
                        nombre: '',
                        comision: subtotalFactura,
                        isSubtotal: true
                    });
                });
            });
            
        } catch(e) {
            console.error('Error procesando datos del reporte:', e);
        }
        
        return { rows, totalGeneral };
    }

    function renderTable(){
        const tbody = document.getElementById('tbody');
        tbody.innerHTML='';
        if (!window.__rows.length){
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#6c757d;">No se encontraron registros para los criterios seleccionados</td></tr>`;
            return;
        }
        const start = (window.__page-1)*window.__pageSize;
        const end = Math.min(start+window.__pageSize, window.__rows.length);
        const page = window.__rows.slice(start,end);
        page.forEach(r => {
            const tr = document.createElement('tr');
            if (r.isSubtotal) {
                tr.style.fontWeight = 'bold';
                tr.style.backgroundColor = '#f0f0f0';
            }
            tr.innerHTML = `
                <td>${r.factura||''}</td>
                <td>${r.matricula||''}</td>
                <td style="text-align:right;">${r.cuotaInicial !== '' && r.cuotaInicial !== null && r.cuotaInicial !== undefined ? formatCuotaInicial(r.cuotaInicial) : ''}</td>
                <td>${r.escala||''}</td>
                <td>${r.nombre||''}</td>
                <td style="text-align:right;">${formatMoney(r.comision)}</td>
            `;
            tbody.appendChild(tr);
        });
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
        if (!data.codigoFilial || !data.fechaInicio || !data.fechaFin) {
            document.getElementById('tbody').innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#dc3545;">Error: No se encontraron datos del reporte</td></tr>';
            return;
        }

        // Actualizar encabezado
        document.getElementById('codigoFilial').textContent = data.codigoFilial;
        document.getElementById('fechaInicio').textContent = formatDate(data.fechaInicio);
        document.getElementById('fechaFin').textContent = formatDate(data.fechaFin);

        // Procesar datos
        const result = processReportData(data.codigoFilial, data.fechaInicio, data.fechaFin);
        window.__rows = result.rows;
        
        // Agregar fila de total general al final
        if (window.__rows.length > 0) {
            window.__rows.push({
                factura: '',
                matricula: '',
                cuotaInicial: '',
                escala: 'TOTAL:',
                nombre: '',
                comision: result.totalGeneral,
                isSubtotal: true,
                isTotal: true
            });
        }
        
        renderTable();
        updatePagination();
    }

    window.exportExcel = function(){
        if (!window.__rows.length) {
            alert('No hay datos para exportar');
            return;
        }
        
        const data = loadData();
        const bodyRows = window.__rows.map(r => {
            const style = r.isSubtotal || r.isTotal ? 'font-weight:bold; background-color:#f0f0f0;' : '';
            return `
            <tr style="${style}">
                <td style="text-align:center;">${r.factura||''}</td>
                <td style="text-align:center;">${r.matricula||''}</td>
                <td style="text-align:right;">${r.cuotaInicial !== '' && r.cuotaInicial !== null && r.cuotaInicial !== undefined ? formatCuotaInicial(r.cuotaInicial) : ''}</td>
                <td>${r.escala||''}</td>
                <td>${r.nombre||''}</td>
                <td style="text-align:right;">${formatMoney(r.comision)}</td>
            </tr>
        `;
        }).join('');

        const excelHTML = `
        <html>
            <head>
                <meta charset='utf-8'>
                <title>Reporte Semanal de Nómina</title>
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
                        font-size: 14px; 
                        text-align: center; 
                        margin-bottom: 20px; 
                        color: #666; 
                        text-transform: uppercase;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 0 auto 20px auto; 
                        border: 2px solid #000;
                    }
                    th, td { 
                        border: 1px solid #000; 
                        padding: 8px; 
                        text-align: left; 
                        font-size: 12px;
                        vertical-align: top;
                    }
                    th { 
                        background-color: #f0f0f0; 
                        font-weight: bold; 
                        text-transform: uppercase;
                        text-align: center;
                    }
                    .footer { 
                        text-align: center; 
                        font-size: 10px; 
                        color: #888; 
                        margin-top: 20px; 
                    }
                    .report-container {
                        text-align: center;
                        margin: 0 auto;
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="report-title">GOLDEN BRIDGE CORP. S.A.S</div>
                    <div class="report-subtitle">RESUMEN DE VENTAS PYF DE LA ${data.codigoFilial} - DESDE: ${formatDate(data.fechaInicio)} HASTA: ${formatDate(data.fechaFin)}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>FACTURA</th>
                                <th>MATRICULA</th>
                                <th>CUOTA INIC.</th>
                                <th>ESCALA</th>
                                <th>NOMBRE</th>
                                <th>COMISION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bodyRows}
                        </tbody>
                    </table>
                    <div class="footer">© 2025 - GOLDEN APP</div>
                </div>
            </body>
        </html>
        `;
        
        // Crear blob y descargar
        const blob = new Blob(['\ufeff', excelHTML], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-semanal-nomina.xls';
        a.click();
        URL.revokeObjectURL(url);
    };

    window.exportDOC = function(){
        const html = generarHTMLLimpio();
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-semanal-nomina.doc';
        a.click();
        URL.revokeObjectURL(url);
    };

    window.exportPDF = function(){
        // Abrir directamente el diálogo de impresión del navegador
        // Muestra vista previa antes de imprimir/guardar como PDF
        window.print();
    };

    function generarHTMLLimpio(){
        const data = loadData();
        const bodyRows = window.__rows.map(r => {
            const style = r.isSubtotal ? 'font-weight:bold; background-color:#f0f0f0;' : '';
            return `
            <tr style="${style}">
                <td>${r.factura||''}</td>
                <td>${r.matricula||''}</td>
                <td style="text-align:right;">${r.cuotaInicial !== '' && r.cuotaInicial !== null && r.cuotaInicial !== undefined ? formatCuotaInicial(r.cuotaInicial) : ''}</td>
                <td>${r.escala||''}</td>
                <td>${r.nombre||''}</td>
                <td style="text-align:right;">${formatMoney(r.comision)}</td>
            </tr>
        `;
        }).join('');

        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset='utf-8'>
                <title>Reporte Semanal de Nómina</title>
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
                <div class="report-subtitle">RESUMEN DE VENTAS PYF DE LA ${data.codigoFilial} - DESDE: ${formatDate(data.fechaInicio)} HASTA: ${formatDate(data.fechaFin)}</div>
                <table>
                    <thead>
                        <tr>
                            <th>FACTURA</th>
                            <th>MATRICULA</th>
                            <th>CUOTA INIC.</th>
                            <th>ESCALA</th>
                            <th>NOMBRE</th>
                            <th>COMISION</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bodyRows}
                    </tbody>
                </table>
                <div class="footer">© 2025 - GOLDEN APP</div>
            </body>
            </html>
        `;
        return html;
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
