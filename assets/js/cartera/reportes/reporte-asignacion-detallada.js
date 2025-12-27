/**
 * ====================================================================================
 * 📊 REPORTE ASIGNACIÓN DETALLADA - GOLDEN APP
 * ====================================================================================
 * 
 * Este archivo genera el reporte de asignación detallada que muestra las asignaciones
 * de facturas por ejecutivo con su detalle completo.
 * 
 * FUNCIONALIDADES:
 * - Busca asignaciones por año, mes y ejecutivo o ciudad
 * - Muestra resumen por ejecutivo y detalle de cuentas
 * - Calcula totales de valores asignados y saldos
 * - Exporta a Excel, Word y PDF
 * - Paginación y zoom para mejor visualización
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
        try {
            if (typeof window.getCiudadesData === 'function') {
                const ciudades = window.getCiudadesData() || {};
                return ciudades[codigo]?.nombre || `CIUDAD ${codigo}`;
            }
            const raw = localStorage.getItem('ciudadesData');
            if (raw) {
                const data = JSON.parse(raw);
                return data[codigo]?.nombre || `CIUDAD ${codigo}`;
            }
        } catch(e) {
            console.error('Error obteniendo nombre de ciudad:', e);
        }
        return `CIUDAD ${codigo}`;
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

    function formatMoneyNoDecimals(n){
        if (n==null || isNaN(n)) return '0';
        return new Intl.NumberFormat('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0}).format(Number(n));
    }

    /**
     * 🔗 BACKEND INTEGRATION - CARGAR DATOS DEL REPORTE
     */
    function loadData(){
        try {
            const raw = localStorage.getItem('reporteAsignacionDetalladaData');
            if (raw){
                const data = JSON.parse(raw);
                return data;
            }
        } catch(e) {
            console.error('Error cargando datos:', e);
        }
        return { year: '', month: '', monthName: '', tipoBusqueda: '', executiveId: '', executiveName: '', ciudadCodigo: '', ciudadNombre: '' };
    }

    /**
     * Obtiene información de una factura desde localStorage
     */
    function getInvoiceInfo(invoiceNumber, cityCode) {
        try {
            const invoicesRaw = localStorage.getItem('invoicesByCity');
            if (!invoicesRaw) return null;
            
            const invoicesByCity = JSON.parse(invoicesRaw);
            const invoices = Array.isArray(invoicesByCity[cityCode]) ? invoicesByCity[cityCode] : [];
            
            const invoiceNum = String(invoiceNumber).trim();
            return invoices.find(inv => {
                const invNum = String(inv.invoiceNumber || '').trim();
                return invNum === invoiceNum || 
                       invNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
            });
        } catch(e) {
            console.error('Error obteniendo información de factura:', e);
        }
        return null;
    }

    /**
     * Obtiene los pagos (ingresos a caja) para una factura específica
     */
    function getPagosByInvoice(invoiceNumber, cityCode) {
        try {
            const ingresosRaw = localStorage.getItem(`ingresosCaja_${cityCode}`);
            if (!ingresosRaw) {
                console.warn(`⚠️ No se encontraron ingresos a caja para ciudad ${cityCode}`);
                return [];
            }
            
            const ingresos = JSON.parse(ingresosRaw);
            if (!Array.isArray(ingresos)) {
                console.warn(`⚠️ Los ingresos a caja para ciudad ${cityCode} no son un array`);
                return [];
            }
            
            const invoiceNum = String(invoiceNumber).trim();
            console.log(`\n🔍 ========== BUSCANDO PAGOS ==========`);
            console.log(`📋 Factura buscada: "${invoiceNum}"`);
            console.log(`🏙️  Ciudad: ${cityCode}`);
            console.log(`📦 Total de ingresos a revisar: ${ingresos.length}`);
            
            // Mostrar todos los números de factura en los ingresos para debugging
            const facturasEnIngresos = ingresos.map(ing => ({
                invoiceNumber: ing.invoiceNumber || ing.factura || 'SIN_FACTURA',
                estado: ing.estado || 'activo',
                valor: ing.valor,
                fecha: ing.fecha || ing.date,
                id: ing.id
            }));
            console.log(`📋 TODAS las facturas en ingresos (${ingresos.length} total):`, facturasEnIngresos);
            
            // Mostrar solo los ingresos activos
            const ingresosActivos = ingresos.filter(ing => (ing.estado || 'activo') === 'activo');
            console.log(`✅ Ingresos activos: ${ingresosActivos.length}`);
            const facturasActivas = ingresosActivos.map(ing => ({
                invoiceNumber: ing.invoiceNumber || ing.factura || 'SIN_FACTURA',
                valor: ing.valor,
                fecha: ing.fecha || ing.date,
                id: ing.id
            }));
            console.log(`📋 Facturas en ingresos ACTIVOS:`, facturasActivas);
            
            // Mostrar solo los números de factura únicos para comparación fácil
            const numerosFacturaUnicos = [...new Set(ingresosActivos.map(ing => String(ing.invoiceNumber || ing.factura || '').trim()))];
            console.log(`🔢 Números de factura únicos en ingresos activos:`, numerosFacturaUnicos);
            
            const pagosEncontrados = ingresos.filter(ingreso => {
                // Filtrar solo ingresos activos
                const estado = ingreso.estado || 'activo';
                if (estado !== 'activo') {
                    console.log(`  ⏭️  Ingreso ${ingreso.id || 'sin_id'} descartado - estado: ${estado}`);
                    return false;
                }
                
                const ingresoInvoiceNum = String(ingreso.invoiceNumber || ingreso.factura || '').trim();
                
                // Si no hay número de factura en el ingreso, saltar
                if (!ingresoInvoiceNum || ingresoInvoiceNum === '') {
                    return false;
                }
                
                // Normalizar ambos números (remover ceros a la izquierda para comparación)
                const invoiceNumNormalized = invoiceNum.replace(/^0+/, '') || invoiceNum;
                const ingresoNumNormalized = ingresoInvoiceNum.replace(/^0+/, '') || ingresoInvoiceNum;
                
                // Comparación robusta: exacta, normalizada, y con padding
                const matchExacto = ingresoInvoiceNum === invoiceNum;
                const matchNormalizado = ingresoNumNormalized === invoiceNumNormalized;
                const matchPad8 = ingresoInvoiceNum === invoiceNum.padStart(8, '0') || 
                                 ingresoInvoiceNum.padStart(8, '0') === invoiceNum;
                const matchPad10 = ingresoInvoiceNum === invoiceNum.padStart(10, '0') || 
                                  ingresoInvoiceNum.padStart(10, '0') === invoiceNum;
                
                // También comparar como números si ambos son numéricos
                let matchNumerico = false;
                if (/^\d+$/.test(invoiceNum) && /^\d+$/.test(ingresoInvoiceNum)) {
                    matchNumerico = parseInt(invoiceNum, 10) === parseInt(ingresoInvoiceNum, 10);
                }
                
                const match = matchExacto || matchNormalizado || matchPad8 || matchPad10 || matchNumerico;
                
                if (match) {
                    console.log(`✅ Pago encontrado para factura ${invoiceNum}:`, {
                        ingresoInvoiceNum: `"${ingresoInvoiceNum}"`,
                        invoiceNum: `"${invoiceNum}"`,
                        matchExacto,
                        matchNormalizado,
                        matchPad8,
                        matchPad10,
                        fecha: ingreso.fecha || ingreso.date,
                        valor: ingreso.valor,
                        id: ingreso.id
                    });
                } else {
                    console.log(`  ❌ No coincide: ingreso="${ingresoInvoiceNum}" vs buscado="${invoiceNum}"`);
                }
                
                return match;
            });
            
            console.log(`✅ Total de pagos encontrados para factura ${invoiceNum}: ${pagosEncontrados.length}`);
            if (pagosEncontrados.length === 0) {
                console.warn(`⚠️ ADVERTENCIA: No se encontraron pagos para factura ${invoiceNum} en ciudad ${cityCode}`);
            }
            // Enriquecer los pagos con información de cuotas si está disponible
            const pagosEnriquecidos = pagosEncontrados.map(pago => {
                const pagoEnriquecido = { ...pago };
                
                // Si tiene detalleCuotas, agregar información de cuotas pagadas
                if (pago.detalleCuotas && Array.isArray(pago.detalleCuotas)) {
                    pagoEnriquecido.cuotasDetalle = pago.detalleCuotas.map(det => ({
                        cuota: det.cuota,
                        valorPagar: det.valorPagar || 0,
                        esParcial: det.esParcial || false
                    }));
                } else if (pago.cuota) {
                    // Si solo tiene el campo cuota, crear un detalle básico
                    const cuotaStr = String(pago.cuota).trim();
                    const cuotasArray = cuotaStr.split(',').map(c => parseInt(c.trim())).filter(c => c > 0);
                    const valorTotal = parseFloat(pago.valor || 0);
                    const valorPorCuota = cuotasArray.length > 0 ? valorTotal / cuotasArray.length : valorTotal;
                    
                    pagoEnriquecido.cuotasDetalle = cuotasArray.map(cuotaNum => ({
                        cuota: cuotaNum,
                        valorPagar: valorPorCuota,
                        esParcial: false
                    }));
                }
                
                return pagoEnriquecido;
            });
            
            return pagosEnriquecidos;
        } catch(e) {
            console.error('Error obteniendo pagos de factura:', e);
        }
        return [];
    }

    /**
     * Obtiene información de un contrato desde localStorage
     */
    function getContractInfo(contractNumber, cityCode) {
        try {
            const contractsRaw = localStorage.getItem(`contratos_${cityCode}`) || 
                                localStorage.getItem(`contracts_${cityCode}`);
            if (!contractsRaw) return null;
            
            const contracts = JSON.parse(contractsRaw);
            const contractsArray = Array.isArray(contracts) ? contracts : Object.values(contracts);
            
            const searchNumber = String(contractNumber).trim();
            return contractsArray.find(contract => {
                const numeroContrato = contract.numeroContrato || 
                                     contract.numero || 
                                     contract.contractNumber || 
                                     contract.nro || 
                                     contract.contract || '';
                return String(numeroContrato).trim() === searchNumber;
            });
        } catch(e) {
            console.error('Error obteniendo información de contrato:', e);
        }
        return null;
    }

    /**
     * Obtiene información del titular desde el contrato o factura
     */
    function getTitularInfo(invoiceNumber, cityCode) {
        const invoice = getInvoiceInfo(invoiceNumber, cityCode);
        if (!invoice) return null;
        
        // Buscar contrato asociado
        const contractNumber = invoice.contractNumber || invoice.contrato || invoice.contract || invoice.contractId;
        if (contractNumber) {
            const contract = getContractInfo(contractNumber, cityCode);
            if (contract) {
                // Buscar información del titular desde el contrato
                const titularId = contract.identificacion || contract.titularId || contract.holderId || contract.clientId || '';
                let titularInfo = null;
                
                // Si tenemos el ID del titular, buscar su información completa
                if (titularId && cityCode) {
                    try {
                        // Buscar en titularesByCity
                        const titularesByCityRaw = localStorage.getItem('titularesByCity');
                        if (titularesByCityRaw) {
                            const titularesByCity = JSON.parse(titularesByCityRaw);
                            if (titularesByCity[cityCode] && titularesByCity[cityCode][titularId]) {
                                titularInfo = titularesByCity[cityCode][titularId];
                            }
                        }
                        
                        // Si no se encuentra, buscar en titularesData (fallback)
                        if (!titularInfo) {
                            const titularesRaw = localStorage.getItem('titularesData');
                            if (titularesRaw) {
                                const titulares = JSON.parse(titularesRaw);
                                const titular = titulares[titularId];
                                if (titular) {
                                    titularInfo = titular;
                                }
                            }
                        }
                    } catch(e) {
                        console.error('Error buscando titular:', e);
                    }
                }
                
                // Construir nombre completo del titular
                let nombreCompleto = '';
                if (titularInfo) {
                    const apellido1 = titularInfo.apellido1 || titularInfo.tPrimerApellido || titularInfo.primerApellido || '';
                    const apellido2 = titularInfo.apellido2 || titularInfo.tSegundoApellido || titularInfo.segundoApellido || '';
                    const nombre1 = titularInfo.nombre1 || titularInfo.tPrimerNombre || titularInfo.primerNombre || '';
                    const nombre2 = titularInfo.nombre2 || titularInfo.tSegundoNombre || titularInfo.segundoNombre || '';
                    nombreCompleto = `${apellido1} ${apellido2} ${nombre1} ${nombre2}`.trim();
                }
                
                return {
                    identificacion: titularId || contract.identificacion || contract.titularId || contract.holderId || '',
                    nombre: nombreCompleto || contract.titular || contract.cliente || contract.clientName || contract.nombreCliente || '',
                    matricula: contract.matricula || contract.placa || contract.numeroMatricula || contract.vehiculo?.matricula || '',
                    cuota: contract.cuota || contract.numeroCuota || contract.cuotaActual || '1/1',
                    fechaVenc: contract.fechaVencimiento || contract.dueDate || contract.fechaVenc || contract.fechaVencimientoCuota || contract.fechaVencimientoPago || '',
                    saldo: contract.saldo || contract.balance || 0,
                    cancelado: contract.cancelado || contract.canceled || 'N'
                };
            }
        }
        
        // Si no hay contrato, usar datos de la factura y buscar titular
        const titularId = invoice.identificacion || invoice.holderId || invoice.clientId || invoice.clientId || '';
        let titularInfo = null;
        
        if (titularId && cityCode) {
            try {
                // Buscar en titularesByCity
                const titularesByCityRaw = localStorage.getItem('titularesByCity');
                if (titularesByCityRaw) {
                    const titularesByCity = JSON.parse(titularesByCityRaw);
                    if (titularesByCity[cityCode] && titularesByCity[cityCode][titularId]) {
                        titularInfo = titularesByCity[cityCode][titularId];
                    }
                }
                
                // Si no se encuentra, buscar en titularesData (fallback)
                if (!titularInfo) {
                    const titularesRaw = localStorage.getItem('titularesData');
                    if (titularesRaw) {
                        const titulares = JSON.parse(titularesRaw);
                        const titular = titulares[titularId];
                        if (titular) {
                            titularInfo = titular;
                        }
                    }
                }
            } catch(e) {
                console.error('Error buscando titular:', e);
            }
        }
        
        // Construir nombre completo del titular
        let nombreCompleto = '';
        if (titularInfo) {
            const apellido1 = titularInfo.apellido1 || titularInfo.tPrimerApellido || titularInfo.primerApellido || '';
            const apellido2 = titularInfo.apellido2 || titularInfo.tSegundoApellido || titularInfo.segundoApellido || '';
            const nombre1 = titularInfo.nombre1 || titularInfo.tPrimerNombre || titularInfo.primerNombre || '';
            const nombre2 = titularInfo.nombre2 || titularInfo.tSegundoNombre || titularInfo.segundoNombre || '';
            nombreCompleto = `${apellido1} ${apellido2} ${nombre1} ${nombre2}`.trim();
        }
        
        return {
            identificacion: titularId || invoice.identificacion || invoice.holderId || '',
            nombre: nombreCompleto || invoice.titular || invoice.cliente || invoice.clientName || '',
            matricula: invoice.matricula || invoice.placa || invoice.numeroMatricula || invoice.vehiculo?.matricula || '',
            cuota: invoice.cuota || invoice.numeroCuota || invoice.cuotaActual || '1/1',
            fechaVenc: invoice.fechaVencimiento || invoice.dueDate || invoice.fechaVenc || invoice.fechaVencimientoCuota || invoice.fechaVencimientoPago || '',
            saldo: invoice.saldo || invoice.balance || 0,
            cancelado: invoice.cancelado || invoice.canceled || 'N'
        };
    }

    /**
     * 🔗 BACKEND INTEGRATION - PROCESAR DATOS DEL REPORTE
     */
    function processReportData() {
        const data = loadData();
        if (!data.year || !data.month) {
            console.error('Faltan datos del reporte');
            return;
        }

        try {
            const raw = localStorage.getItem('assignmentsByCity');
            const assignmentsByCity = raw ? JSON.parse(raw) : {};
            
            let assignments = [];
            
            // Obtener asignaciones según el tipo de búsqueda
            if (data.tipoBusqueda === 'ejecutivo' && data.executiveId) {
                // Buscar en todas las ciudades
                for (const [cityCode, cityAssignments] of Object.entries(assignmentsByCity)) {
                    if (Array.isArray(cityAssignments)) {
                        const filtered = cityAssignments.filter(a => {
                            const execId = String(a.executiveId || '').trim();
                            const searchId = String(data.executiveId).trim();
                            return execId === searchId || 
                                   execId.replace(/\D/g, '') === searchId.replace(/\D/g, '');
                        });
                        assignments.push(...filtered.map(a => ({...a, city: cityCode})));
                    }
                }
            } else if (data.tipoBusqueda === 'ciudad' && data.ciudadCodigo) {
                // Buscar solo en la ciudad especificada
                if (Array.isArray(assignmentsByCity[data.ciudadCodigo])) {
                    assignments = assignmentsByCity[data.ciudadCodigo].map(a => ({...a, city: data.ciudadCodigo}));
                }
            }
            
            // Filtrar por año y mes
            assignments = assignments.filter(a => {
                const assignmentYear = String(a.year || '').trim();
                const assignmentMonth = String(a.month || '').trim();
                
                // Comparar año
                if (assignmentYear !== data.year) return false;
                
                // Comparar mes (puede venir como "01", "1", "01 - Enero", etc.)
                const monthNum = data.month;
                if (assignmentMonth.includes(' - ')) {
                    const monthPart = assignmentMonth.split(' - ')[0].trim();
                    return monthPart === monthNum || monthPart.padStart(2, '0') === monthNum;
                } else {
                    return assignmentMonth === monthNum || assignmentMonth.padStart(2, '0') === monthNum;
                }
            });
            
            // Agrupar por ejecutivo
            const groupedByExecutive = {};
            assignments.forEach(asg => {
                const execId = asg.executiveId || 'SIN_ID';
                const key = execId + '|' + (asg.executiveName || '');
                
                if (!groupedByExecutive[key]) {
                    groupedByExecutive[key] = {
                        executiveId: execId,
                        executiveName: asg.executiveName || '',
                        year: asg.year || '',
                        month: asg.month || '',
                        dateFrom: asg.dateFrom || asg.assignmentDate || '',
                        dateTo: asg.dateTo || asg.assignmentDate || '',
                        city: asg.city || '',
                        accounts: [],
                        totalValue: 0
                    };
                }
                
                const group = groupedByExecutive[key];
                
                // Actualizar fechas
                if (asg.dateFrom && (!group.dateFrom || new Date(asg.dateFrom) < new Date(group.dateFrom))) {
                    group.dateFrom = asg.dateFrom;
                }
                if (asg.dateTo && (!group.dateTo || new Date(asg.dateTo) > new Date(group.dateTo))) {
                    group.dateTo = asg.dateTo;
                }
                
                // Agregar cuentas
                if (Array.isArray(asg.accounts)) {
                    asg.accounts.forEach(acc => {
                        group.accounts.push({
                            invoiceNumber: acc.invoiceNumber || '',
                            value: typeof acc.value === 'number' ? acc.value : (parseFloat(String(acc.value).replace(/[^0-9.-]/g, '')) || 0),
                            city: asg.city || ''
                        });
                        group.totalValue += typeof acc.value === 'number' ? acc.value : (parseFloat(String(acc.value).replace(/[^0-9.-]/g, '')) || 0);
                    });
                }
            });
            
            // Convertir a array de filas para el reporte
            window.__rows = [];
            Object.values(groupedByExecutive).forEach(group => {
                const summaryRow = {
                    type: 'summary',
                    executiveId: group.executiveId,
                    executiveName: group.executiveName,
                    year: group.year,
                    month: group.month,
                    dateFrom: group.dateFrom,
                    dateTo: group.dateTo,
                    totalAccounts: group.accounts.length,
                    totalValue: group.totalValue,
                    city: group.city,
                    details: []
                };
                
                // Agregar filas de detalle al resumen
                group.accounts.forEach((acc, index) => {
                    const titularInfo = getTitularInfo(acc.invoiceNumber, group.city);
                    // Obtener número de contrato de la factura
                    const invoice = getInvoiceInfo(acc.invoiceNumber, group.city);
                    const contractNumber = invoice?.contractNumber || invoice?.contrato || invoice?.contract || invoice?.contractId || '';
                    
                    // Obtener información del plan para saber el número total de cuotas y mensualidad
                    let numCuotasTotal = 0;
                    let mensualidad = 0;
                    let valorPlan = 0;
                    let cuotaInicial = 0;
                    let planData = null;
                    
                    if (contractNumber) {
                        const contract = getContractInfo(contractNumber, group.city);
                        if (contract) {
                            console.log(`🔍 Contrato encontrado para factura ${acc.invoiceNumber}:`, contract);
                            
                            // Intentar obtener planData del contrato
                            planData = typeof contract.planData === 'string' ? JSON.parse(contract.planData) : contract.planData;
                            
                            // Si no hay planData en el contrato, intentar buscar el plan por código o nombre
                            if (!planData && (contract.planCode || contract.plan)) {
                                const planCodeToSearch = contract.planCode || '';
                                const planNameToSearch = contract.plan || '';
                                console.log(`🔍 Buscando plan por código/nombre:`, planCodeToSearch || planNameToSearch);
                                
                                // Buscar en planes almacenados
                                try {
                                    const planesRaw = localStorage.getItem('planesData');
                                    if (planesRaw) {
                                        const planes = JSON.parse(planesRaw);
                                        console.log(`📦 Estructura de planes:`, Array.isArray(planes) ? 'Array' : 'Object', 'Total:', Array.isArray(planes) ? planes.length : Object.keys(planes).length);
                                        
                                                // Los planes pueden estar como objeto (clave = código) o array
                                        let planesArray = [];
                                        if (Array.isArray(planes)) {
                                            planesArray = planes;
                                        } else if (typeof planes === 'object') {
                                            // Si es objeto, obtener todos los valores
                                            planesArray = Object.values(planes);
                                            // También intentar buscar directamente por clave si tenemos el código
                                            if (planCodeToSearch && planes[planCodeToSearch]) {
                                                planData = planes[planCodeToSearch];
                                                console.log(`✅ Plan encontrado directamente por clave "${planCodeToSearch}":`, planData);
                                            }
                                        }
                                        
                                        console.log(`📦 Total de planes en array: ${planesArray.length}`);
                                        
                                        // Buscar por código primero (si aún no se encontró)
                                        if (!planData && planCodeToSearch) {
                                            const planEncontrado = planesArray.find(p => {
                                                const codigo = String(p.codigo || p.code || p.codigoPlan || '').trim();
                                                const searchCode = String(planCodeToSearch).trim();
                                                const match = codigo === searchCode || codigo.toLowerCase() === searchCode.toLowerCase();
                                                if (match) {
                                                    console.log(`🔍 Match encontrado: codigo="${codigo}" === searchCode="${searchCode}"`);
                                                }
                                                return match;
                                            });
                                            if (planEncontrado) {
                                                planData = planEncontrado;
                                                console.log(`✅ Plan encontrado por código "${planCodeToSearch}":`, planData);
                                            } else {
                                                console.log(`❌ No se encontró plan con código "${planCodeToSearch}"`);
                                                // Mostrar códigos disponibles para debugging
                                                const codigosDisponibles = planesArray.map(p => p.codigo || p.code || 'SIN CÓDIGO').slice(0, 10);
                                                console.log(`📋 Primeros 10 códigos de planes disponibles:`, codigosDisponibles);
                                            }
                                        }
                                        
                                        // Si no se encontró por código, buscar por nombre
                                        if (!planData && planNameToSearch) {
                                            const searchNameLower = String(planNameToSearch).trim().toLowerCase();
                                            console.log(`🔍 Buscando plan por nombre: "${planNameToSearch}" (normalizado: "${searchNameLower}")`);
                                            
                                            const planEncontrado = planesArray.find(p => {
                                                const nombre = String(p.nombre || p.name || '').trim().toLowerCase();
                                                const match = nombre === searchNameLower || nombre.includes(searchNameLower) || searchNameLower.includes(nombre);
                                                if (match) {
                                                    console.log(`🔍 Match encontrado: nombre="${nombre}" === searchName="${searchNameLower}"`);
                                                }
                                                return match;
                                            });
                                            
                                            if (planEncontrado) {
                                                planData = planEncontrado;
                                                console.log(`✅ Plan encontrado por nombre "${planNameToSearch}":`, planData);
                                            } else {
                                                console.log(`❌ No se encontró plan con nombre "${planNameToSearch}"`);
                                                // Mostrar los nombres de planes disponibles para debugging
                                                const nombresDisponibles = planesArray.map(p => ({
                                                    codigo: p.codigo || p.code || 'SIN CÓDIGO',
                                                    nombre: p.nombre || p.name || 'SIN NOMBRE'
                                                })).slice(0, 10);
                                                console.log(`📋 Primeros 10 planes disponibles:`, nombresDisponibles);
                                            }
                                        }
                                    } else {
                                        console.log(`❌ No hay planesData en localStorage`);
                                    }
                                } catch (e) {
                                    console.error('❌ Error buscando plan:', e);
                                }
                            }
                            
                            if (planData) {
                                console.log(`📋 PlanData completo para factura ${acc.invoiceNumber}:`, planData);
                                console.log(`🔍 Campos disponibles en planData:`, Object.keys(planData));
                                
                                // Intentar obtener numCuotasTotal con múltiples nombres posibles
                                numCuotasTotal = Number(
                                    planData.numCuotas || 
                                    planData.numeroCuotas || 
                                    planData.cuotas || 
                                    planData.totalCuotas ||
                                    planData.numeroDeCuotas ||
                                    planData.cantidadCuotas ||
                                    0
                                ) || 0;
                                
                                mensualidad = Number(planData.mensualidad != null ? planData.mensualidad : 0) || 0;
                                valorPlan = Number(planData.valorPlan != null ? planData.valorPlan : 0) || 0;
                                cuotaInicial = Number(planData.cuotaInicial != null ? planData.cuotaInicial : 0) || 0;
                                
                                console.log(`📊 Factura ${acc.invoiceNumber}: numCuotasTotal = ${numCuotasTotal}, valorPlan = ${valorPlan}, mensualidad = ${mensualidad}`);
                                
                                // Si no hay mensualidad, calcularla
                                if (!mensualidad && valorPlan && numCuotasTotal) {
                                    const saldo = Math.max(0, valorPlan - (cuotaInicial || 0));
                                    mensualidad = Math.floor(saldo / numCuotasTotal);
                                }
                            } else {
                                console.warn(`⚠️ No se encontró planData para factura ${acc.invoiceNumber}, contrato ${contractNumber}`);
                            }
                        } else {
                            console.warn(`⚠️ No se encontró contrato ${contractNumber} para factura ${acc.invoiceNumber}`);
                        }
                    }
                    
                    // Si no se obtuvo numCuotasTotal del plan, intentar obtenerlo de otra fuente
                    if (!numCuotasTotal) {
                        // Intentar desde el titularInfo
                        if (titularInfo?.cuota) {
                            const cuotaStr = String(titularInfo.cuota);
                            // Si tiene formato X/Y, extraer Y
                            const match = cuotaStr.match(/\/(\d+)$/);
                            if (match) {
                                numCuotasTotal = Number(match[1]) || 0;
                                console.log(`📊 Factura ${acc.invoiceNumber}: numCuotasTotal obtenido de titularInfo = ${numCuotasTotal}`);
                            }
                        }
                    }
                    
                    // Si aún no se tiene numCuotasTotal, mostrar advertencia
                    if (!numCuotasTotal) {
                        console.warn(`⚠️ ADVERTENCIA: No se pudo obtener numCuotasTotal para factura ${acc.invoiceNumber}. Se usará formato sin denominador.`);
                    }
                    
                    // Obtener fecha de vencimiento de la factura
                    const fechaVenc = invoice?.firstPaymentDate || invoice?.fechaVencimiento || invoice?.dueDate || invoice?.fechaVenc || titularInfo?.fechaVenc || '';
                    
                    // Obtener pagos de esta factura
                    console.log(`🔍 Buscando pagos para factura: ${acc.invoiceNumber} en ciudad: ${group.city}`);
                    const pagos = getPagosByInvoice(acc.invoiceNumber, group.city);
                    console.log(`📊 Pagos encontrados para factura ${acc.invoiceNumber}:`, pagos.length, pagos);
                    
                    // Recolectar todas las cuotas pagadas con sus valores
                    const cuotasPagadasDetalle = [];
                    pagos.forEach(pago => {
                        if (pago.cuotasDetalle && Array.isArray(pago.cuotasDetalle)) {
                            pago.cuotasDetalle.forEach(det => {
                                cuotasPagadasDetalle.push({
                                    cuota: det.cuota,
                                    valor: det.valorPagar || 0,
                                    fecha: pago.fecha || pago.date || '',
                                    esParcial: det.esParcial || false
                                });
                            });
                        }
                    });
                    
                    // Ordenar cuotas pagadas por número de cuota
                    cuotasPagadasDetalle.sort((a, b) => (a.cuota || 0) - (b.cuota || 0));
                    
                    // Calcular valor total pagado
                    const valorPagado = pagos.reduce((sum, pago) => {
                        const valor = parseFloat(pago.valor) || 0;
                        console.log(`  - Pago: fecha=${pago.fecha || pago.date}, valor=${valor}`);
                        return sum + valor;
                    }, 0);
                    console.log(`💰 Valor total pagado para factura ${acc.invoiceNumber}: ${valorPagado}`);
                    
                    // Obtener la última fecha de pago
                    let fechaPago = '';
                    if (pagos.length > 0) {
                        // Ordenar por fecha y tomar la más reciente
                        const pagosOrdenados = pagos.sort((a, b) => {
                            const fechaA = new Date(a.fecha || a.date || '');
                            const fechaB = new Date(b.fecha || b.date || '');
                            return fechaB - fechaA;
                        });
                        fechaPago = pagosOrdenados[0].fecha || pagosOrdenados[0].date || '';
                        console.log(`📅 Última fecha de pago para factura ${acc.invoiceNumber}: ${fechaPago}`);
                    } else {
                        console.log(`⚠️ No se encontraron pagos para factura ${acc.invoiceNumber}`);
                    }
                    
                    // Calcular saldo: valor total - valor pagado
                    // Obtener valor total de la factura o del plan
                    let valorTotalFactura = parseFloat(acc.value) || 0;
                    // Si no hay valor en la factura, intentar obtenerlo del plan
                    if (!valorTotalFactura && valorPlan > 0) {
                        valorTotalFactura = valorPlan;
                    }
                    const valorTotal = valorTotalFactura;
                    const saldo = Math.max(0, valorTotal - valorPagado);
                    
                    // Agrupar cuotas pagadas por número de cuota y sumar valores
                    const cuotasAgrupadas = {};
                    cuotasPagadasDetalle.forEach(det => {
                        const cuotaNum = det.cuota || 0;
                        if (cuotaNum > 0) {
                            if (!cuotasAgrupadas[cuotaNum]) {
                                cuotasAgrupadas[cuotaNum] = {
                                    cuota: cuotaNum,
                                    valorTotal: 0,
                                    fechaPago: det.fecha || ''
                                };
                            }
                            cuotasAgrupadas[cuotaNum].valorTotal += parseFloat(det.valor || 0);
                            // Usar la fecha más reciente si hay múltiples pagos para la misma cuota
                            if (det.fecha && (!cuotasAgrupadas[cuotaNum].fechaPago || det.fecha > cuotasAgrupadas[cuotaNum].fechaPago)) {
                                cuotasAgrupadas[cuotaNum].fechaPago = det.fecha;
                            }
                        }
                    });
                    
                    // Si hay cuotas pagadas, crear una fila por cada cuota
                    if (Object.keys(cuotasAgrupadas).length > 0) {
                        const cuotasOrdenadas = Object.values(cuotasAgrupadas).sort((a, b) => a.cuota - b.cuota);
                        
                        // Usar el valor completo del plan (prioridad: valorPlan > valorTotal de factura)
                        // Asegurarse de que siempre haya un valor válido
                        const valorCompletoPlan = valorPlan > 0 ? valorPlan : (valorTotal > 0 ? valorTotal : 0);
                        
                        // Calcular saldo acumulado después de cada cuota
                        let saldoAcumulado = valorCompletoPlan;
                        
                        cuotasOrdenadas.forEach((cuotaDetalle, idx) => {
                            // Restar el valor pagado de esta cuota al saldo acumulado
                            saldoAcumulado = Math.max(0, saldoAcumulado - cuotaDetalle.valorTotal);
                            
                            // Formato de cuota: X/Y donde X es la cuota pagada y Y es el total de cuotas (fijo)
                            // Asegurarse de que siempre se muestre el formato X/Y si hay numCuotasTotal
                            const numeroCuota = Number(cuotaDetalle.cuota) || 1;
                            const formatoCuota = numCuotasTotal > 0 
                                ? `${numeroCuota}/${numCuotasTotal}` 
                                : String(numeroCuota);
                            
                            console.log(`📊 Cuota detalle: numeroCuota=${numeroCuota}, numCuotasTotal=${numCuotasTotal}, formatoCuota="${formatoCuota}"`);
                            
                            summaryRow.details.push({
                                type: 'detail',
                                rowNumber: index + 1,
                                invoiceNumber: acc.invoiceNumber,
                                contrato: contractNumber,
                                identificacion: titularInfo?.identificacion || '',
                                nombre: titularInfo?.nombre || '',
                                cuota: formatoCuota, // Formato: 1/12, 2/12, 3/12, etc.
                                fechaVenc: fechaVenc,
                                valor: valorCompletoPlan, // Valor completo del plan en todas las filas
                                fechaPago: cuotaDetalle.fechaPago || fechaPago,
                                valorPagado: cuotaDetalle.valorTotal, // Valor pagado de esta cuota
                                saldo: saldoAcumulado, // Saldo después de pagar esta cuota
                                cancelado: titularInfo?.cancelado || 'N',
                                isCuotaDetalle: true,
                                isFirstRow: idx === 0,
                                isLastRow: idx === cuotasOrdenadas.length - 1
                            });
                        });
                    } else {
                        // Si no hay cuotas pagadas, mostrar una fila con el valor total pagado
                        // Formato de cuota: si hay numCuotasTotal, mostrar "1/X", sino mostrar el valor del titularInfo
                        let formatoCuotaSinPagos = '';
                        if (numCuotasTotal > 0) {
                            formatoCuotaSinPagos = `1/${numCuotasTotal}`;
                        } else if (titularInfo?.cuota) {
                            formatoCuotaSinPagos = String(titularInfo.cuota);
                        }
                        
                        summaryRow.details.push({
                            type: 'detail',
                            rowNumber: index + 1,
                            invoiceNumber: acc.invoiceNumber,
                            contrato: contractNumber,
                            identificacion: titularInfo?.identificacion || '',
                            nombre: titularInfo?.nombre || '',
                            cuota: formatoCuotaSinPagos,
                            fechaVenc: fechaVenc,
                            valor: valorTotal,
                            fechaPago: fechaPago,
                            valorPagado: valorPagado,
                            saldo: saldo,
                            cancelado: titularInfo?.cancelado || 'N',
                            isCuotaDetalle: false
                        });
                    }
                });
                
                window.__rows.push(summaryRow);
            });
            
            updatePagination();
            renderReport();
        } catch(e) {
            console.error('Error procesando datos del reporte:', e);
        }
    }

    function renderReport() {
        const content = document.getElementById('reportContent');
        if (!content) return;
        
        const data = loadData();
        const start = (window.__page - 1) * window.__pageSize;
        const end = start + window.__pageSize;
        const pageRows = window.__rows.slice(start, end);
        
        let html = '';
        
        // Agrupar por ejecutivo para renderizar correctamente
        const executivesOnPage = [];
        pageRows.forEach(row => {
            if (row.type === 'summary') {
                executivesOnPage.push(row);
            }
        });
        
        executivesOnPage.forEach(executive => {
            // Tabla de resumen del ejecutivo
            html += `
                <div class="executive-section" style="margin-bottom: 30px; page-break-inside: avoid;">
                    <table style="width: 100%; margin-bottom: 15px; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f0f0f0;">
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Ejecutivo</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nombre</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Año</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">asignado a</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Fecha Ini.</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Fecha Fin</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Cuentas #</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Vr. Asignado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${executive.executiveId || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${executive.executiveName || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${executive.year || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;"></td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${formatDate(executive.dateFrom)}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${formatDate(executive.dateTo)}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${executive.totalAccounts || 0}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatMoney(executive.totalValue)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f0f0f0;">
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">#</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Factura</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Contrato</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Identifica</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nombre</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Cuota</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Fecha Venc</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Valor</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Fecha Pago</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Vr. Pagado</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Agregar todas las filas de detalle
            if (executive.details && Array.isArray(executive.details)) {
                let rowCounter = 0;
                executive.details.forEach((detail, index) => {
                    rowCounter++;
                    
                    // Mostrar todos los campos en todas las filas
                    html += `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${rowCounter}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${detail.invoiceNumber || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${detail.contrato || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${detail.identificacion || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${(detail.nombre || '').toUpperCase()}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${detail.cuota || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${formatDate(detail.fechaVenc)}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${detail.valor !== null && detail.valor !== undefined ? formatMoneyNoDecimals(detail.valor) : ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${detail.fechaPago ? formatDate(detail.fechaPago) : '//'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatMoneyNoDecimals(detail.valorPagado)}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${detail.saldo !== null && detail.saldo !== undefined ? formatMoneyNoDecimals(detail.saldo) : ''}</td>
                            </tr>
                    `;
                });
            }
            
            // Calcular totales
            const totalValue = executive.totalValue || 0;
            const totalSaldo = executive.details ? executive.details.reduce((sum, d) => sum + (d.saldo || 0), 0) : 0;
            
            // Agregar fila de totales al final
            html += `
                        </tbody>
                        <tfoot>
                            <tr style="background-color: #f9f9f9; font-weight: bold;">
                                <td colspan="7" style="padding: 8px; border: 1px solid #ddd; text-align: left;">Totales:</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatMoney(totalValue)}</td>
                                <td colspan="2" style="padding: 8px; border: 1px solid #ddd;"></td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatMoney(totalSaldo)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        });
        
        content.innerHTML = html;
        
        // Actualizar subtítulo
        updateSubtitle();
    }

    function updateSubtitle() {
        const data = loadData();
        const subtitle = document.getElementById('reportSubtitle');
        const yearSpan = document.getElementById('reportYear');
        const monthSpan = document.getElementById('reportMonth');
        const filterSpan = document.getElementById('reportFilter');
        const dateSpan = document.getElementById('reportDate');
        
        if (yearSpan) yearSpan.textContent = data.year || '';
        if (monthSpan) monthSpan.textContent = data.monthName || data.month || '';
        
        let filterText = '';
        if (data.tipoBusqueda === 'ejecutivo') {
            filterText = `Ejecutivo: ${data.executiveName || data.executiveId || ''}`;
        } else if (data.tipoBusqueda === 'ciudad') {
            filterText = `Ciudad: ${data.ciudadNombre || data.ciudadCodigo || ''}`;
        }
        if (filterSpan) filterSpan.textContent = filterText;
        
        const today = new Date();
        if (dateSpan) dateSpan.textContent = formatDate(today.toISOString().split('T')[0]);
    }

    function updatePagination() {
        const totalPages = Math.ceil(window.__rows.length / window.__pageSize) || 1;
        const totalPagesSpan = document.getElementById('totalPages');
        const currentPageInput = document.getElementById('currentPage');
        
        if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
        if (currentPageInput) {
            currentPageInput.max = totalPages;
            currentPageInput.value = window.__page;
        }
        
        const paginaActual = document.getElementById('paginaActual');
        if (paginaActual) paginaActual.textContent = window.__page;
    }

    // Funciones de paginación
    window.goFirst = function() {
        window.__page = 1;
        updatePagination();
        renderReport();
    };

    window.goPrevious = function() {
        if (window.__page > 1) {
            window.__page--;
            updatePagination();
            renderReport();
        }
    };

    window.goNext = function() {
        const totalPages = Math.ceil(window.__rows.length / window.__pageSize) || 1;
        if (window.__page < totalPages) {
            window.__page++;
            updatePagination();
            renderReport();
        }
    };

    window.goLast = function() {
        window.__page = Math.ceil(window.__rows.length / window.__pageSize) || 1;
        updatePagination();
        renderReport();
    };

    window.goToPage = function(page) {
        const totalPages = Math.ceil(window.__rows.length / window.__pageSize) || 1;
        const pageNum = parseInt(page) || 1;
        if (pageNum >= 1 && pageNum <= totalPages) {
            window.__page = pageNum;
            updatePagination();
            renderReport();
        }
    };

    // Funciones de zoom
    window.setZoom = function(delta) {
        window.__zoom = Math.max(0.5, Math.min(2, window.__zoom + delta));
        const root = document.getElementById('reportRoot');
        if (root) {
            root.style.transform = `scale(${window.__zoom})`;
            root.style.transformOrigin = 'top left';
        }
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = Math.round(window.__zoom * 100) + '%';
        }
    };

    // Funciones de exportación
    window.exportExcel = function() {
        try {
            const data = loadData();
            const allRows = window.__rows || [];
            
            // Agrupar por ejecutivo para generar el Excel
            const executives = [];
            allRows.forEach(row => {
                if (row.type === 'summary') {
                    executives.push(row);
                }
            });
            
            let excelHTML = '';
            
            executives.forEach(executive => {
                // Tabla de resumen del ejecutivo
                excelHTML += `
                    <div class="sheet-section">
                        <div class="report-title">Golden Bridge Corp S.A.S</div>
                        <div class="report-subtitle">REPORTE DE ASIGNACION DETALLADA - Año: ${data.year || ''} - Mes: ${data.monthName || data.month || ''}</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Ejecutivo</th>
                                    <th>Nombre</th>
                                    <th>Año</th>
                                    <th>Asignado a</th>
                                    <th>Fecha Ini.</th>
                                    <th>Fecha Fin</th>
                                    <th>Cuentas #</th>
                                    <th>Vr. Asignado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${executive.executiveId || ''}</td>
                                    <td>${executive.executiveName || ''}</td>
                                    <td>${executive.year || ''}</td>
                                    <td></td>
                                    <td>${formatDate(executive.dateFrom)}</td>
                                    <td>${formatDate(executive.dateTo)}</td>
                                    <td>${executive.totalAccounts || 0}</td>
                                    <td>${formatMoney(executive.totalValue)}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Factura</th>
                                    <th>Contrato</th>
                                    <th>Identifica</th>
                                    <th>Nombre</th>
                                    <th>Cuota</th>
                                    <th>Fecha Venc</th>
                                    <th>Valor</th>
                                    <th>Fecha Pago</th>
                                    <th>Vr. Pagado</th>
                                    <th>Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                // Agregar todas las filas de detalle
                if (executive.details && Array.isArray(executive.details)) {
                    executive.details.forEach((detail, index) => {
                        excelHTML += `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${detail.invoiceNumber || ''}</td>
                                    <td>${detail.contrato || ''}</td>
                                    <td>${detail.identificacion || ''}</td>
                                    <td>${(detail.nombre || '').toUpperCase()}</td>
                                    <td>${detail.cuota || ''}</td>
                                    <td>${formatDate(detail.fechaVenc)}</td>
                                    <td>${formatMoneyNoDecimals(detail.valor)}</td>
                                    <td>${detail.fechaPago ? formatDate(detail.fechaPago) : '//'}</td>
                                    <td>${formatMoneyNoDecimals(detail.valorPagado)}</td>
                                    <td>${formatMoneyNoDecimals(detail.saldo)}</td>
                                </tr>
                        `;
                    });
                }
                
                // Calcular totales
                const totalValue = executive.totalValue || 0;
                const totalSaldo = executive.details ? executive.details.reduce((sum, d) => sum + (d.saldo || 0), 0) : 0;
                
                excelHTML += `
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="7" style="text-align: left;">Totales:</td>
                                    <td>${formatMoney(totalValue)}</td>
                                    <td colspan="2"></td>
                                    <td>${formatMoney(totalSaldo)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                `;
            });
            
            const fullExcelHTML = `
                <html>
                    <head>
                        <meta charset='utf-8'>
                        <title>Reporte de Asignación Detallada</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                margin: 20px; 
                                font-size: 12px;
                            }
                            .sheet-section {
                                margin-bottom: 30px;
                                page-break-after: always;
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
                            .total-row {
                                font-weight: bold;
                                background-color: #f9f9f9;
                            }
                            .footer { 
                                text-align: center; 
                                font-size: 10px; 
                                color: #888; 
                                margin-top: 20px; 
                            }
                        </style>
                    </head>
                    <body>
                        ${excelHTML}
                        <div class="footer">© 2025 - GOLDEN APP</div>
                    </body>
                </html>
            `;
            
            // Crear blob y descargar
            const blob = new Blob(['\ufeff', fullExcelHTML], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-asignacion-detallada-${new Date().getTime()}.xls`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exportando Excel:', error);
            alert('Error al exportar a Excel');
        }
    };

    window.exportDOC = function() {
        try {
            const data = loadData();
            const allRows = window.__rows || [];
            
            // Agrupar por ejecutivo para generar el Word
            const executives = [];
            allRows.forEach(row => {
                if (row.type === 'summary') {
                    executives.push(row);
                }
            });
            
            let wordHTML = '';
            
            executives.forEach(executive => {
                // Tabla de resumen del ejecutivo
                wordHTML += `
                    <div class="executive-section">
                        <div class="report-title">Golden Bridge Corp S.A.S</div>
                        <div class="report-subtitle">REPORTE DE ASIGNACION DETALLADA - Año: ${data.year || ''} - Mes: ${data.monthName || data.month || ''}</div>
                        <div class="summary-table-container">
                            <table style="width: 100%; margin: 0 auto;">
                                <thead>
                                    <tr>
                                        <th style="width: 10%;">Ejecutivo</th>
                                        <th style="width: 15%;">Nombre</th>
                                        <th style="width: 6%;">Año</th>
                                        <th style="width: 10%;">Asignado a</th>
                                        <th style="width: 10%;">Fecha Ini.</th>
                                        <th style="width: 10%;">Fecha Fin</th>
                                        <th style="width: 8%;">Cuentas #</th>
                                        <th style="width: 12%;">Vr. Asignado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>${executive.executiveId || ''}</td>
                                        <td>${executive.executiveName || ''}</td>
                                        <td>${executive.year || ''}</td>
                                        <td></td>
                                        <td>${formatDate(executive.dateFrom)}</td>
                                        <td>${formatDate(executive.dateTo)}</td>
                                        <td>${executive.totalAccounts || 0}</td>
                                        <td>${formatMoney(executive.totalValue)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="detail-table-container">
                            <table style="width: 100%; margin: 0 auto;">
                                <thead>
                                    <tr>
                                        <th style="width: 4%;">#</th>
                                        <th style="width: 8%;">Factura</th>
                                        <th style="width: 8%;">Contrato</th>
                                        <th style="width: 8%;">Identifica</th>
                                        <th style="width: 15%;">Nombre</th>
                                        <th style="width: 6%;">Cuota</th>
                                        <th style="width: 8%;">Fecha Venc</th>
                                        <th style="width: 9%;">Valor</th>
                                        <th style="width: 8%;">Fecha Pago</th>
                                        <th style="width: 9%;">Vr. Pagado</th>
                                        <th style="width: 9%;">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                
                // Agregar todas las filas de detalle
                if (executive.details && Array.isArray(executive.details)) {
                    executive.details.forEach((detail, index) => {
                        wordHTML += `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${detail.invoiceNumber || ''}</td>
                                    <td>${detail.contrato || ''}</td>
                                    <td>${detail.identificacion || ''}</td>
                                    <td>${(detail.nombre || '').toUpperCase()}</td>
                                    <td>${detail.cuota || ''}</td>
                                    <td>${formatDate(detail.fechaVenc)}</td>
                                    <td>${formatMoneyNoDecimals(detail.valor)}</td>
                                    <td>${detail.fechaPago ? formatDate(detail.fechaPago) : '//'}</td>
                                    <td>${formatMoneyNoDecimals(detail.valorPagado)}</td>
                                    <td>${formatMoneyNoDecimals(detail.saldo)}</td>
                                </tr>
                        `;
                    });
                }
                
                // Calcular totales
                const totalValue = executive.totalValue || 0;
                const totalSaldo = executive.details ? executive.details.reduce((sum, d) => sum + (d.saldo || 0), 0) : 0;
                
                wordHTML += `
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="7" style="text-align: left;">Totales:</td>
                                    <td>${formatMoney(totalValue)}</td>
                                    <td colspan="2"></td>
                                    <td>${formatMoney(totalSaldo)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        </div>
                    </div>
                `;
            });
            
            const fullWordHTML = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8">
                    <style>
                        @page { 
                            size: A4 landscape; 
                            margin: 15mm 10mm; 
                        }
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0;
                            padding: 0;
                            font-size: 11px;
                            text-align: center;
                        }
                        .report-container {
                            width: 100%;
                            max-width: 100%;
                            margin: 0 auto;
                            text-align: center;
                        }
                        .executive-section {
                            margin-bottom: 40px;
                            page-break-inside: avoid;
                            width: 100%;
                            text-align: center;
                            clear: both;
                        }
                        .report-title { 
                            font-size: 18px; 
                            font-weight: bold; 
                            text-align: center; 
                            margin-bottom: 10px; 
                            margin-top: 20px;
                            text-transform: uppercase;
                            width: 100%;
                        }
                        .report-subtitle { 
                            font-size: 13px; 
                            text-align: center; 
                            margin-bottom: 25px; 
                            color: #666; 
                            text-transform: uppercase;
                            width: 100%;
                        }
                        .summary-table-container {
                            margin-bottom: 25px;
                            width: 100%;
                            clear: both;
                        }
                        .detail-table-container {
                            margin-bottom: 30px;
                            width: 100%;
                            clear: both;
                        }
                        table { 
                            width: 100%; 
                            max-width: 100%;
                            border-collapse: collapse; 
                            margin: 0 auto;
                            border: 1px solid #000;
                            font-size: 10px;
                            table-layout: fixed;
                            display: table;
                        }
                        th, td { 
                            border: 1px solid #000; 
                            padding: 6px 4px; 
                            text-align: center; 
                            word-wrap: break-word;
                            overflow: hidden;
                        }
                        th { 
                            background-color: #f0f0f0; 
                            font-weight: bold; 
                            text-transform: uppercase;
                            text-align: center;
                            font-size: 9px;
                        }
                        td {
                            font-size: 10px;
                        }
                        .total-row {
                            font-weight: bold;
                            background-color: #f9f9f9;
                        }
                        .footer { 
                            text-align: center; 
                            color: #888; 
                            font-size: 10px; 
                            margin-top: 20px; 
                            width: 100%;
                        }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        ${wordHTML}
                        <div class="footer">© 2025 - GOLDEN APP</div>
                    </div>
                </body>
            </html>
            `;
            
            // Crear blob y descargar
            const blob = new Blob(['\ufeff', fullWordHTML], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-asignacion-detallada-${new Date().getTime()}.doc`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exportando Word:', error);
            alert('Error al exportar a Word');
        }
    };

    window.exportPDF = function() {
        // Abrir directamente el diálogo de impresión del navegador
        // Muestra vista previa antes de imprimir/guardar como PDF
        window.print();
    };

    // Inicializar cuando se carga la página
    document.addEventListener('DOMContentLoaded', function() {
        processReportData();
    });
})();

