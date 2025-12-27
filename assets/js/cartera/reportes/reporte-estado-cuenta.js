/**
 * ====================================================================================
 * 📊 REPORTE ESTADO DE CUENTA - GOLDEN APP
 * ====================================================================================
 * 
 * Este archivo genera el reporte de estado de cuenta que muestra el detalle
 * completo de cartera del cliente con sus ingresos y resumen financiero.
 * 
 * FUNCIONALIDADES:
 * - Muestra información del titular
 * - Resumen financiero (facturas, notas, abonos, deuda)
 * - Detalle de ingresos (caja y bancos)
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
        
        // Usar exactamente la misma lógica que formatDateForTable en estado-cuenta.js
        // para asegurar que las fechas se formateen de la misma manera
        try {
            // Si es formato YYYY-MM-DD, parsear manualmente para evitar problemas de zona horaria
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                const [y, m, d] = str.split('-');
                return `${d}/${m}/${y}`;
            }
            
            // Para otros formatos, usar new Date
            const date = new Date(str);
            if (isNaN(date.getTime())) {
                return str;
            }
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return str;
        }
    }

    function formatMoney(n){
        if (n==null || isNaN(n)) return '0.00';
        return new Intl.NumberFormat('es-CO', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(n));
    }

    /**
     * 🔗 BACKEND INTEGRATION - CARGAR DATOS DEL REPORTE
     */
    function loadData(){
        try {
            const raw = localStorage.getItem('estadoCuentaReportData');
            if (raw){
                const data = JSON.parse(raw);
                return data;
            }
        } catch(e) {
            console.error('Error cargando datos:', e);
        }
        return null;
    }

    function getIncomeTypeCategory(tipoIngresoCodigo) {
        if (!tipoIngresoCodigo) return null;
        const codigo = String(tipoIngresoCodigo).toUpperCase().trim();
        if (codigo.includes('CI') || codigo === 'CI') return 'CI';
        if (codigo.includes('CR') || codigo === 'CR') return 'CR';
        return 'CR';
    }

    function formatCuota(cuota, category, numCuotasTotal = null) {
        if (category === 'CI') return '';
        if (!cuota && cuota !== 0) return '';
        
        // Si es un número, usarlo directamente
        const cuotaNum = typeof cuota === 'number' ? cuota : parseInt(String(cuota).trim()) || 0;
        if (cuotaNum <= 0) return '';
        
        const total = numCuotasTotal || 18;
        return `${cuotaNum}/${total}`;
    }

    function formatRecibo(letraRecibo, reciboOficial) {
        const letra = (letraRecibo && letraRecibo.trim()) || 'A';
        const numero = (reciboOficial && reciboOficial.trim()) || '';
        
        // Si hay número, combinar letra + número
        if (numero) {
            return `${letra} ${numero}`.trim();
        }
        
        // Si solo hay letra, retornar la letra
        return letra;
    }

    function processReportData() {
        const data = loadData();
        if (!data || !data.accountData) {
            console.error('No hay datos para procesar');
            return;
        }
        
        const accountData = data.accountData;
        const city = data.city;
        const startDate = data.startDate;
        const endDate = data.endDate;
        const selectedInvoiceNumber = data.selectedInvoiceNumber || null;
        
        // Filtrar ingresos por factura seleccionada si hay una
        let ingresosCajaFiltrados = accountData.ingresosCaja || [];
        let ingresosBancosFiltrados = accountData.ingresosBancos || [];
        
        if (selectedInvoiceNumber) {
            const invoiceNum = String(selectedInvoiceNumber).trim();
            ingresosCajaFiltrados = ingresosCajaFiltrados.filter(ing => {
                const ingInvoiceNum = String(ing.invoiceNumber || '').trim();
                return ingInvoiceNum === invoiceNum || 
                       ingInvoiceNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
            });
            
            ingresosBancosFiltrados = ingresosBancosFiltrados.filter(ing => {
                try {
                    if (!ing.cashInflowData) return false;
                    const cashInflow = JSON.parse(ing.cashInflowData);
                    const cashInvoiceNum = String(cashInflow.invoiceNumber || '').trim();
                    return cashInvoiceNum === invoiceNum || 
                           cashInvoiceNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
                } catch (e) {
                    return false;
                }
            });
        }
        
        // Combinar todos los ingresos (caja y bancos) y ordenarlos por fecha
        let allIngresos = [];
        
        // Procesar ingresos a caja
        if (ingresosCajaFiltrados && Array.isArray(ingresosCajaFiltrados)) {
            ingresosCajaFiltrados.forEach(ing => {
                const tipoIngreso = ing.tipoIngresoCodigo || '';
                const category = getIncomeTypeCategory(tipoIngreso);
                
                // Si tiene detalleCuotas, crear una fila por cada cuota
                if (ing.detalleCuotas && Array.isArray(ing.detalleCuotas) && ing.detalleCuotas.length > 0) {
                    ing.detalleCuotas.forEach((detalle, index) => {
                        allIngresos.push({
                            tipo: category || tipoIngreso || 'CR',
                            numero: ing.numero || '',
                            cliente: accountData.holderId || '',
                            fecha: ing.date || ing.fecha || '',
                            cuota: formatCuota(detalle.cuota, category, window.__reportNumCuotasTotal),
                            recibo: formatRecibo(ing.letraRecibo, ing.reciboOficial),
                            fp: 'EF',
                            valorCobrado: detalle.valorPagar || (index === 0 ? ing.valor : 0), // Usar valor de la cuota específica
                            descuentos: 0,
                            source: 'caja',
                            originalData: ing
                        });
                    });
                } else {
                    // Si no tiene detalleCuotas, procesar el campo cuota normal
                    const cuotaStr = String(ing.cuota || '').trim();
                    if (cuotaStr && cuotaStr.includes(',')) {
                        // Si hay múltiples cuotas separadas por comas, crear una fila por cada una
                        const cuotasArray = cuotaStr.split(',').map(c => c.trim()).filter(c => c);
                        const valorPorCuota = cuotasArray.length > 0 ? (ing.valor || 0) / cuotasArray.length : ing.valor || 0;
                        cuotasArray.forEach(cuotaNum => {
                            allIngresos.push({
                                tipo: category || tipoIngreso || 'CR',
                                numero: ing.numero || '',
                                cliente: accountData.holderId || '',
                                fecha: ing.date || ing.fecha || '',
                                cuota: formatCuota(cuotaNum, category, window.__reportNumCuotasTotal),
                                recibo: formatRecibo(ing.letraRecibo, ing.reciboOficial),
                                fp: 'EF',
                                valorCobrado: valorPorCuota,
                                descuentos: 0,
                                source: 'caja',
                                originalData: ing
                            });
                        });
                    } else {
                        // Una sola cuota
                        allIngresos.push({
                            tipo: category || tipoIngreso || 'CR',
                            numero: ing.numero || '',
                            cliente: accountData.holderId || '',
                            fecha: ing.date || ing.fecha || '',
                            cuota: formatCuota(ing.cuota, category, window.__reportNumCuotasTotal),
                            recibo: formatRecibo(ing.letraRecibo, ing.reciboOficial),
                            fp: 'EF',
                            valorCobrado: ing.valor || 0,
                            descuentos: 0,
                            source: 'caja',
                            originalData: ing
                        });
                    }
                }
            });
        }
        
        // Procesar ingresos a bancos
        if (ingresosBancosFiltrados && Array.isArray(ingresosBancosFiltrados)) {
            ingresosBancosFiltrados.forEach(ing => {
                try {
                    if (!ing.cashInflowData) return;
                    const cashInflow = JSON.parse(ing.cashInflowData);
                    const tipoIngreso = cashInflow.tipoIngresoCodigo || '';
                    const category = getIncomeTypeCategory(tipoIngreso);
                    
                    // Si tiene detalleCuotas, crear una fila por cada cuota
                    if (cashInflow.detalleCuotas && Array.isArray(cashInflow.detalleCuotas) && cashInflow.detalleCuotas.length > 0) {
                        cashInflow.detalleCuotas.forEach((detalle, index) => {
                            allIngresos.push({
                                tipo: category || tipoIngreso || 'CR',
                                numero: ing.numero || cashInflow.numero || '',
                                cliente: accountData.holderId || '',
                                fecha: ing.fechaDocumento || ing.fechaHoy || cashInflow.date || cashInflow.fecha || '',
                                cuota: formatCuota(detalle.cuota, category, window.__reportNumCuotasTotal),
                                recibo: formatRecibo(cashInflow.letraRecibo, cashInflow.reciboOficial),
                                fp: 'EF',
                                valorCobrado: detalle.valorPagar || (index === 0 ? (ing.valor || cashInflow.valor || 0) : 0),
                                descuentos: 0,
                                source: 'banco',
                                originalData: ing
                            });
                        });
                    } else {
                        // Si no tiene detalleCuotas, procesar el campo cuota normal
                        const cuotaStr = String(cashInflow.cuota || '').trim();
                        if (cuotaStr && cuotaStr.includes(',')) {
                            // Si hay múltiples cuotas separadas por comas, crear una fila por cada una
                            const cuotasArray = cuotaStr.split(',').map(c => c.trim()).filter(c => c);
                            const valorTotal = ing.valor || cashInflow.valor || 0;
                            const valorPorCuota = cuotasArray.length > 0 ? valorTotal / cuotasArray.length : valorTotal;
                            cuotasArray.forEach(cuotaNum => {
                                allIngresos.push({
                                    tipo: category || tipoIngreso || 'CR',
                                    numero: ing.numero || cashInflow.numero || '',
                                    cliente: accountData.holderId || '',
                                    fecha: ing.fechaDocumento || ing.fechaHoy || cashInflow.date || cashInflow.fecha || '',
                                    cuota: formatCuota(cuotaNum, category, window.__reportNumCuotasTotal),
                                    recibo: formatRecibo(cashInflow.letraRecibo, cashInflow.reciboOficial),
                                    fp: 'EF',
                                    valorCobrado: valorPorCuota,
                                    descuentos: 0,
                                    source: 'banco',
                                    originalData: ing
                                });
                            });
                        } else {
                            // Una sola cuota
                            allIngresos.push({
                                tipo: category || tipoIngreso || 'CR',
                                numero: ing.numero || cashInflow.numero || '',
                                cliente: accountData.holderId || '',
                                fecha: ing.fechaDocumento || ing.fechaHoy || cashInflow.date || cashInflow.fecha || '',
                                cuota: formatCuota(cashInflow.cuota, category, window.__reportNumCuotasTotal),
                                recibo: formatRecibo(cashInflow.letraRecibo, cashInflow.reciboOficial),
                                fp: 'EF',
                                valorCobrado: ing.valor || cashInflow.valor || 0,
                                descuentos: 0,
                                source: 'banco',
                                originalData: ing
                            });
                        }
                    }
                } catch (e) {
                    console.error('Error procesando ingreso a banco:', e);
                }
            });
        }
        
        // Consolidar cuotas duplicadas: agrupar por cuota y sumar valores
        const cuotasConsolidadas = {};
        
        allIngresos.forEach(ingreso => {
            // Extraer el número de cuota de "X/Y" (ej: "1/18" -> 1)
            const cuotaMatch = String(ingreso.cuota || '').match(/^(\d+)\//);
            if (!cuotaMatch) return; // Si no tiene formato válido, saltar
            
            const numeroCuota = parseInt(cuotaMatch[1], 10);
            const cuotaKey = ingreso.cuota; // Usar "X/Y" como clave
            
            if (!cuotasConsolidadas[cuotaKey]) {
                // Primera vez que vemos esta cuota
                cuotasConsolidadas[cuotaKey] = {
                    tipo: ingreso.tipo,
                    numero: ingreso.numero,
                    cliente: ingreso.cliente,
                    fecha: ingreso.fecha,
                    cuota: ingreso.cuota,
                    numeroCuota: numeroCuota, // Guardar número para ordenar
                    recibo: ingreso.recibo,
                    fp: ingreso.fp,
                    valorCobrado: parseFloat(ingreso.valorCobrado || 0),
                    descuentos: parseFloat(ingreso.descuentos || 0),
                    source: ingreso.source,
                    originalData: ingreso.originalData
                };
            } else {
                // Ya existe esta cuota, sumar valores
                cuotasConsolidadas[cuotaKey].valorCobrado += parseFloat(ingreso.valorCobrado || 0);
                cuotasConsolidadas[cuotaKey].descuentos += parseFloat(ingreso.descuentos || 0);
                
                // Mantener la fecha más reciente
                const fechaActual = new Date(cuotasConsolidadas[cuotaKey].fecha);
                const fechaNueva = new Date(ingreso.fecha);
                if (fechaNueva > fechaActual) {
                    cuotasConsolidadas[cuotaKey].fecha = ingreso.fecha;
                    cuotasConsolidadas[cuotaKey].recibo = ingreso.recibo;
                    cuotasConsolidadas[cuotaKey].numero = ingreso.numero;
                }
            }
        });
        
        // Convertir objeto a array y ordenar por número de cuota (1, 2, 3, 4...)
        const ingresosConsolidados = Object.values(cuotasConsolidadas);
        ingresosConsolidados.sort((a, b) => {
            return a.numeroCuota - b.numeroCuota;
        });
        
        __rows = ingresosConsolidados;
        
        // Calcular totales (filtrar por factura seleccionada si hay una)
        let facturasParaCalcular = accountData.facturas || [];
        let notasDebitoParaCalcular = accountData.notasDebito || [];
        let notasCreditoParaCalcular = accountData.notasCredito || [];
        
        if (selectedInvoiceNumber) {
            const invoiceNum = String(selectedInvoiceNumber).trim();
            facturasParaCalcular = facturasParaCalcular.filter(f => {
                const fInvoiceNum = String(f.invoiceNumber || f.numeroFactura || f.numero || '').trim();
                return fInvoiceNum === invoiceNum || 
                       fInvoiceNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
            });
            notasDebitoParaCalcular = notasDebitoParaCalcular.filter(n => {
                const nInvoiceNum = String(n.invoiceNumber || n.factura || '').trim();
                return nInvoiceNum === invoiceNum || 
                       nInvoiceNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
            });
            notasCreditoParaCalcular = notasCreditoParaCalcular.filter(n => {
                const nInvoiceNum = String(n.invoiceNumber || n.factura || '').trim();
                return nInvoiceNum === invoiceNum || 
                       nInvoiceNum.replace(/^0+/, '') === invoiceNum.replace(/^0+/, '');
            });
        }
        
        const valorFactura = facturasParaCalcular.reduce((sum, f) => sum + (parseFloat(f.totalValue || f.valor || f.value || 0) || 0), 0);
        const notasDebito = notasDebitoParaCalcular.reduce((sum, n) => sum + (parseFloat(n.valorNota || n.valor || 0) || 0), 0);
        const notasCredito = notasCreditoParaCalcular.reduce((sum, n) => sum + (parseFloat(n.valor || 0) || 0), 0);
        const valorAbonos = allIngresos.reduce((sum, ing) => sum + (ing.valorCobrado || 0), 0);
        const totalDeuda = valorFactura + notasDebito - notasCredito - valorAbonos;
        
        window.__reportTotals = {
            valorFactura: valorFactura,
            notasDebito: notasDebito,
            notasCredito: notasCredito,
            valorAbonos: valorAbonos,
            totalDeuda: totalDeuda
        };
        
        window.__reportAccountData = accountData;
        window.__reportCity = city;
        window.__reportCityName = getCiudadNombre(city);
        window.__reportStartDate = startDate;
        window.__reportEndDate = endDate;
    }

    function calculateValorFactura(accountData) {
        if (!accountData.facturas || !Array.isArray(accountData.facturas)) return 0;
        return accountData.facturas.reduce((sum, factura) => {
            return sum + (parseFloat(factura.totalValue || factura.valor || factura.value || 0) || 0);
        }, 0);
    }

    function calculateNotasDebito(accountData) {
        if (!accountData.notasDebito || !Array.isArray(accountData.notasDebito)) return 0;
        return accountData.notasDebito.reduce((sum, nota) => {
            return sum + (parseFloat(nota.valorNota || nota.valor || 0) || 0);
        }, 0);
    }

    function calculateNotasCredito(accountData) {
        if (!accountData.notasCredito || !Array.isArray(accountData.notasCredito)) return 0;
        return accountData.notasCredito.reduce((sum, nota) => {
            return sum + (parseFloat(nota.valor || 0) || 0);
        }, 0);
    }

    /**
     * Función auxiliar para obtener los datos del cliente de manera consistente
     * (usada en renderReport, exportExcel y exportDOC)
     */
    function getClientDataForReport(accountData, city, data) {
        const titular = accountData.titular;
        const nombreCompleto = `${titular.nombre1 || ''} ${titular.nombre2 || ''} ${titular.apellido1 || ''} ${titular.apellido2 || ''}`.trim().toUpperCase();
        const identificacionTitular = accountData.holderId || titular.numeroId || titular.identificacion || '';
        
        // Obtener factura seleccionada (si hay varias)
        const selectedInvoiceNumber = (data && data.selectedInvoiceNumber) || null;
        let facturaSeleccionada = null;
        let contratoSeleccionado = null;
        
        console.log('🔍 [REPORTE] Buscando factura:', {
            selectedInvoiceNumber,
            totalFacturas: accountData.facturas ? accountData.facturas.length : 0,
            primeraFactura: accountData.primeraFactura ? (accountData.primeraFactura.invoiceNumber || accountData.primeraFactura.numeroFactura) : null
        });
        
        if (selectedInvoiceNumber && accountData.facturas && Array.isArray(accountData.facturas)) {
            facturaSeleccionada = accountData.facturas.find(f => 
                String(f.invoiceNumber || f.numeroFactura || f.numero || '') === String(selectedInvoiceNumber)
            );
            
            if (!facturaSeleccionada) {
                console.log('⚠️ [REPORTE] No se encontró factura con número:', selectedInvoiceNumber);
            } else {
                console.log('✅ [REPORTE] Factura encontrada por número:', selectedInvoiceNumber);
            }
        }
        
        // Si no hay factura seleccionada o no se encontró, usar la primera
        if (!facturaSeleccionada) {
            facturaSeleccionada = accountData.primeraFactura;
            console.log('📋 [REPORTE] Usando primera factura:', facturaSeleccionada ? (facturaSeleccionada.invoiceNumber || facturaSeleccionada.numeroFactura) : 'N/A');
        }
        
        // Buscar el contrato asociado a la factura seleccionada
        if (facturaSeleccionada) {
            const contractNumber = facturaSeleccionada.contractNumber || facturaSeleccionada.contrato || facturaSeleccionada.contractId || '';
            if (contractNumber && accountData.contratos && Array.isArray(accountData.contratos)) {
                contratoSeleccionado = accountData.contratos.find(c => 
                    String(c.contractNumber || c.numero || c.numeroContrato || '') === String(contractNumber) ||
                    String(c.id) === String(facturaSeleccionada.contractId)
                );
            }
        }
        
        // Si no se encontró contrato, usar el primer contrato
        if (!contratoSeleccionado) {
            contratoSeleccionado = accountData.primerContrato;
        }
        
        // Obtener fecha primer pago desde la factura (fecha establecida al crear la factura)
        let fechaPrimerPago = '';
        let fechaVencimiento = '';
        
        // PRIORIDAD 1: Usar las fechas calculadas en la consulta (si están disponibles)
        // Esto asegura que el reporte muestre exactamente las mismas fechas que la consulta
        if (accountData && accountData.calculatedFirstPaymentDate) {
            fechaPrimerPago = accountData.calculatedFirstPaymentDate;
            console.log('✅ [REPORTE] Usando fecha primer pago de la consulta:', fechaPrimerPago);
        }
        
        if (accountData && accountData.calculatedDueDate) {
            fechaVencimiento = accountData.calculatedDueDate;
            console.log('✅ [REPORTE] Usando fecha vencimiento de la consulta:', fechaVencimiento);
        }
        
        // Si no hay fechas guardadas de la consulta, calcularlas (fallback)
        if (!fechaPrimerPago) {
            // Debug: mostrar campos de la factura
            if (facturaSeleccionada) {
                console.log('🔍 [REPORTE] Factura seleccionada:', {
                    invoiceNumber: facturaSeleccionada.invoiceNumber || facturaSeleccionada.numeroFactura,
                    firstPaymentDate: facturaSeleccionada.firstPaymentDate,
                    fechaPrimerPago: facturaSeleccionada.fechaPrimerPago,
                    fechaInicial: facturaSeleccionada.fechaInicial,
                    todosLosCampos: Object.keys(facturaSeleccionada)
                });
            }
            
            // 1. Buscar primero en la factura seleccionada (prioridad)
            if (facturaSeleccionada) {
                fechaPrimerPago = facturaSeleccionada.firstPaymentDate || 
                                 facturaSeleccionada.fechaPrimerPago || 
                                 facturaSeleccionada.fechaInicial ||
                                 facturaSeleccionada.date || // También puede estar en date
                                 '';
                
                console.log('📅 [REPORTE] Fecha primer pago encontrada en factura:', fechaPrimerPago);
            }
            
            // 2. Si no está en la factura, buscar en el contrato como fallback
            if (!fechaPrimerPago && contratoSeleccionado) {
                fechaPrimerPago = contratoSeleccionado.firstPaymentDate || 
                                  contratoSeleccionado.fechaPrimerPago || 
                                  contratoSeleccionado.fechaInicial ||
                                  '';
                
                // Si no está en el contrato, buscar en el planData del contrato
                if (!fechaPrimerPago && contratoSeleccionado.planData) {
                    try {
                        let planData = typeof contratoSeleccionado.planData === 'string' ? 
                                      JSON.parse(contratoSeleccionado.planData) : 
                                      contratoSeleccionado.planData;
                        if (planData) {
                            fechaPrimerPago = planData.fechaInicial || 
                                            planData.fechaPrimerPago || 
                                            planData.firstPaymentDate || 
                                            '';
                        }
                    } catch (e) {
                        console.error('Error parseando planData del contrato:', e);
                    }
                }
                
                // Si aún no hay fecha, buscar en planes desde localStorage
                if (!fechaPrimerPago && contratoSeleccionado.planCode) {
                    try {
                        const planesDataRaw = localStorage.getItem('planesData');
                        if (planesDataRaw) {
                            const planesData = JSON.parse(planesDataRaw);
                            const plan = planesData[contratoSeleccionado.planCode] || 
                                        Object.values(planesData).find(p => 
                                            String(p.codigo || '').trim() === String(contratoSeleccionado.planCode).trim()
                                        );
                            if (plan) {
                                fechaPrimerPago = plan.fechaInicial || 
                                                plan.fechaPrimerPago || 
                                                plan.firstPaymentDate || 
                                                '';
                            }
                        }
                    } catch (e) {
                        console.error('Error obteniendo fecha desde planes:', e);
                    }
                }
            }
        }
        const numeroContrato = contratoSeleccionado ? (contratoSeleccionado.contractNumber || contratoSeleccionado.numeroContrato || contratoSeleccionado.numero || '') : '';
        const numeroFactura = facturaSeleccionada ? (facturaSeleccionada.invoiceNumber || facturaSeleccionada.numeroFactura || facturaSeleccionada.numero || '') : '';
        
        // Obtener plan del contrato
        let nombrePlan = '';
        let numCuotasTotal = 18;
        
        if (contratoSeleccionado) {
            let planData = typeof contratoSeleccionado.planData === 'string' ? JSON.parse(contratoSeleccionado.planData) : contratoSeleccionado.planData;
            
            if (planData) {
                nombrePlan = planData.nombre || planData.name || contratoSeleccionado.plan || '';
                numCuotasTotal = Number(planData.numCuotas || planData.numeroCuotas || planData.cuotas || planData.totalCuotas || 18) || 18;
            } else {
                const planName = contratoSeleccionado.plan || contratoSeleccionado.planName || '';
                const planCode = contratoSeleccionado.planCode || contratoSeleccionado.codigoPlan || '';
                
                try {
                    const planesDataRaw = localStorage.getItem('planesData');
                    if (planesDataRaw) {
                        const planesData = JSON.parse(planesDataRaw);
                        
                        if (planCode) {
                            planData = planesData[planCode] || 
                                       Object.values(planesData).find(p => 
                                           String(p.codigo || '').trim() === String(planCode).trim()
                                       );
                        }
                        
                        if (!planData && planName) {
                            planData = Object.values(planesData).find(p => {
                                const nombre = String(p.nombre || '').trim().toLowerCase();
                                const searchName = String(planName).trim().toLowerCase();
                                return nombre === searchName || nombre.includes(searchName);
                            });
                        }
                        
                        if (planData) {
                            nombrePlan = planData.nombre || planData.name || planName || '';
                            numCuotasTotal = Number(planData.numCuotas || planData.numeroCuotas || planData.cuotas || planData.totalCuotas || 18) || 18;
                        } else {
                            nombrePlan = planName || '';
                            numCuotasTotal = Number(contratoSeleccionado.numCuotas || contratoSeleccionado.numeroCuotas || contratoSeleccionado.cuotas || 18) || 18;
                        }
                    }
                } catch (e) {
                    console.error('Error obteniendo plan:', e);
                    nombrePlan = contratoSeleccionado.plan || '';
                }
            }
        }
        
        // Calcular fecha de vencimiento del plan (fecha primer pago + número de cuotas - 1 meses)
        // Solo calcular si no se obtuvo de la consulta
        if (!fechaVencimiento && fechaPrimerPago) {
            try {
                // Usar el número de cuotas ya obtenido del plan
                let numCuotasParaVencimiento = numCuotasTotal;
                
                // Si no se obtuvo del plan, buscar en el contrato
                if (numCuotasParaVencimiento === 18 && contratoSeleccionado) {
                    if (contratoSeleccionado.planData) {
                        try {
                            let planData = typeof contratoSeleccionado.planData === 'string' ? 
                                          JSON.parse(contratoSeleccionado.planData) : 
                                          contratoSeleccionado.planData;
                            if (planData) {
                                numCuotasParaVencimiento = Number(planData.numCuotas || planData.numeroCuotas || planData.cuotas || planData.totalCuotas || 18) || 18;
                            }
                        } catch (e) {
                            console.error('Error parseando planData para cuotas:', e);
                        }
                    }
                    
                    // Si no está en planData, buscar en planes desde localStorage
                    if (numCuotasParaVencimiento === 18 && contratoSeleccionado.planCode) {
                        try {
                            const planesDataRaw = localStorage.getItem('planesData');
                            if (planesDataRaw) {
                                const planesData = JSON.parse(planesDataRaw);
                                const plan = planesData[contratoSeleccionado.planCode] || 
                                            Object.values(planesData).find(p => 
                                                String(p.codigo || '').trim() === String(contratoSeleccionado.planCode).trim()
                                            );
                                if (plan) {
                                    numCuotasParaVencimiento = Number(plan.numCuotas || plan.numeroCuotas || plan.cuotas || plan.totalCuotas || 18) || 18;
                                }
                            }
                        } catch (e) {
                            console.error('Error obteniendo cuotas desde planes:', e);
                        }
                    }
                }
                
                // Calcular fecha de vencimiento (fecha primer pago + número de cuotas - 1 meses)
                const fechaPrimerPagoDate = new Date(fechaPrimerPago);
                if (!isNaN(fechaPrimerPagoDate.getTime())) {
                    fechaPrimerPagoDate.setMonth(fechaPrimerPagoDate.getMonth() + (numCuotasParaVencimiento - 1));
                    fechaVencimiento = fechaPrimerPagoDate.toISOString().split('T')[0];
                }
            } catch (e) {
                console.error('Error calculando fecha de vencimiento:', e);
            }
        }
        
        return {
            nombreCompleto,
            identificacionTitular,
            fechaPrimerPago,
            fechaVencimiento,
            numeroContrato,
            numeroFactura,
            nombrePlan,
            numCuotasTotal
        };
    }

    function renderReport() {
        const reportContent = document.getElementById('reportContent');
        if (!reportContent) return;

        // Cargar datos desde localStorage
        const data = loadData();
        if (!data || !data.accountData) {
            reportContent.innerHTML = '<p>No hay datos para mostrar</p>';
            return;
        }

        const accountData = data.accountData;
        const city = data.city || window.__reportCity;
        const cityName = window.__reportCityName || getCiudadNombre(city);
        const startDate = data.startDate || window.__reportStartDate;
        const endDate = data.endDate || window.__reportEndDate;
        
        if (!accountData) {
            reportContent.innerHTML = '<p>No hay datos para mostrar</p>';
            return;
        }

        // Usar función auxiliar para obtener datos del cliente
        const clientData = getClientDataForReport(accountData, city, data);
        const { nombreCompleto, identificacionTitular, fechaPrimerPago, fechaVencimiento, numeroContrato, numeroFactura, nombrePlan, numCuotasTotal } = clientData;
        
        // Debug: mostrar fechas que se van a renderizar
        console.log('📊 [REPORTE] Fechas que se van a renderizar:', {
            fechaPrimerPago,
            fechaVencimiento,
            fechaPrimerPagoFormateada: fechaPrimerPago ? formatDate(fechaPrimerPago) : '-',
            fechaVencimientoFormateada: fechaVencimiento ? formatDate(fechaVencimiento) : '-'
        });
        
        // Guardar numCuotasTotal para usar en formatCuota
        window.__reportNumCuotasTotal = numCuotasTotal;

        // Actualizar header
        document.getElementById('reportClientId').textContent = accountData.holderId || '';
        document.getElementById('reportClientName').textContent = nombreCompleto || '';
        document.getElementById('reportCity').textContent = `${city} - ${cityName}`;
        const today = new Date();
        document.getElementById('reportDate').textContent = formatDate(today.toISOString().split('T')[0]);

        // Obtener filas de la página actual
        const startIdx = (__page - 1) * __pageSize;
        const endIdx = startIdx + __pageSize;
        const currentPageRows = __rows.slice(startIdx, endIdx);
        const totals = window.__reportTotals || {};

        let html = '';

        // Información del Cliente
        html += '<div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; border: 1px solid #dee2e6;">';
        html += '<div style="font-weight: 700; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; color: #1a1a1a;">Datos del Cliente</div>';
        html += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px;">';
        html += `<div><strong>Cliente:</strong> ${nombreCompleto}</div>`;
        if (identificacionTitular) {
            html += `<div><strong>Identificación:</strong> ${identificacionTitular}</div>`;
        }
        if (numeroFactura) {
            html += `<div><strong>Factura:</strong> ${numeroFactura}</div>`;
        }
        // Log antes de renderizar fechas
        const fechaPrimerPagoFormateada = fechaPrimerPago ? formatDate(fechaPrimerPago) : '-';
        const fechaVencimientoFormateada = fechaVencimiento ? formatDate(fechaVencimiento) : '-';
        console.log('🎨 [REPORTE] Renderizando fechas en HTML:', {
            fechaPrimerPago,
            fechaVencimiento,
            fechaPrimerPagoFormateada,
            fechaVencimientoFormateada
        });
        
        html += `<div><strong>Fecha Primer Pago:</strong> ${fechaPrimerPagoFormateada}</div>`;
        if (numeroContrato) {
            html += `<div><strong>Contrato:</strong> ${numeroContrato}</div>`;
        }
        html += `<div><strong>Fecha Vencimiento:</strong> ${fechaVencimientoFormateada}</div>`;
        if (nombrePlan) {
            html += `<div><strong>Plan:</strong> ${nombrePlan.toUpperCase()}</div>`;
        }
        html += '</div>';
        html += '</div>';

        // Resumen Financiero
        html += '<div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; border: 1px solid #dee2e6;">';
        html += '<div style="font-weight: 700; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; color: #1a1a1a;">Resumen Financiero</div>';
        html += '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; font-size: 13px;">';
        html += `<div><strong>Valor Factura $ +:</strong> ${formatMoney(totals.valorFactura || 0)}</div>`;
        html += `<div><strong>Notas Débito $ +:</strong> ${formatMoney(totals.notasDebito || 0)}</div>`;
        html += `<div><strong>Notas Crédito $ -:</strong> ${formatMoney(totals.notasCredito || 0)}</div>`;
        html += `<div><strong>Valor Abonos $ -:</strong> ${formatMoney(totals.valorAbonos || 0)}</div>`;
        html += `<div style="font-weight: 700; color: #1a1a1a;"><strong>Total Deuda $ =:</strong> ${formatMoney(totals.totalDeuda || 0)}</div>`;
        html += '</div>';
        html += '</div>';

        // Tabla de Ingresos
        html += '<div id="tableWrap" style="overflow-x: auto;">';
        html += '<table style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed;">';
        html += '<thead>';
        html += '<tr style="background: #f5f5f5;">';
        html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 11px; width: 8%;">Tipo Ingreso</th>';
        html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 11px; width: 12%;">Ingreso</th>';
        html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 11px; width: 10%;">Cliente</th>';
        html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 11px; width: 10%;">Fecha Tra.</th>';
        html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 11px; width: 8%;">Cuota</th>';
        html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 11px; width: 8%;">Recibo</th>';
        html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 11px; width: 6%;">FP</th>';
        html += '<th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: 600; text-transform: uppercase; font-size: 11px; width: 12%;">Valor Cobrado</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';

        if (currentPageRows.length === 0) {
            html += '<tr>';
            html += '<td colspan="8" style="border: 1px solid #ddd; padding: 20px; text-align: center; color: #6b7280;">No hay ingresos para mostrar</td>';
            html += '</tr>';
        } else {
            currentPageRows.forEach(row => {
                html += '<tr>';
                html += `<td style="border: 1px solid #ddd; padding: 6px; word-wrap: break-word;">${row.tipo || ''}</td>`;
                html += `<td style="border: 1px solid #ddd; padding: 6px; word-wrap: break-word;">${row.numero || ''}</td>`;
                html += `<td style="border: 1px solid #ddd; padding: 6px; word-wrap: break-word;">${row.cliente || ''}</td>`;
                html += `<td style="border: 1px solid #ddd; padding: 6px; word-wrap: break-word;">${formatDate(row.fecha)}</td>`;
                html += `<td style="border: 1px solid #ddd; padding: 6px; word-wrap: break-word;">${row.cuota || ''}</td>`;
                html += `<td style="border: 1px solid #ddd; padding: 6px; word-wrap: break-word;">${row.recibo || ''}</td>`;
                html += `<td style="border: 1px solid #ddd; padding: 6px; word-wrap: break-word;">${row.fp || ''}</td>`;
                html += `<td style="border: 1px solid #ddd; padding: 6px; text-align: right; word-wrap: break-word;">${formatMoney(row.valorCobrado || 0)}</td>`;
                html += '</tr>';
            });
        }

        html += '</tbody>';
        html += '</table>';
        html += '</div>';

        reportContent.innerHTML = html;
        updatePagination();
        updatePageNumber();
    }

    function updatePagination() {
        const totalPages = Math.ceil(__rows.length / __pageSize);
        document.getElementById('totalPages').textContent = totalPages;
        const currentPageInput = document.getElementById('currentPage');
        if (currentPageInput) {
            currentPageInput.value = __page;
            currentPageInput.max = totalPages;
        }
    }

    function updatePageNumber() {
        document.getElementById('paginaActual').textContent = __page;
    }

    function goFirst() {
        __page = 1;
        renderReport();
    }

    function goPrevious() {
        if (__page > 1) {
            __page--;
            renderReport();
        }
    }

    function goNext() {
        const totalPages = Math.ceil(__rows.length / __pageSize);
        if (__page < totalPages) {
            __page++;
            renderReport();
        }
    }

    function goLast() {
        __page = Math.ceil(__rows.length / __pageSize);
        renderReport();
    }

    function goToPage(page) {
        const pageNum = parseInt(page, 10);
        const totalPages = Math.ceil(__rows.length / __pageSize);
        if (pageNum >= 1 && pageNum <= totalPages) {
            __page = pageNum;
            renderReport();
        }
    }

    function setZoom(delta) {
        __zoom += delta;
        if (__zoom < 0.5) __zoom = 0.5;
        if (__zoom > 2.0) __zoom = 2.0;
        
        const reportContent = document.getElementById('reportContent');
        if (reportContent) {
            reportContent.style.transform = `scale(${__zoom})`;
            reportContent.style.transformOrigin = 'top center';
        }
        
        document.getElementById('zoomLevel').textContent = Math.round(__zoom * 100) + '%';
    }

    function exportExcel() {
        try {
            const accountData = window.__reportAccountData;
            const city = window.__reportCity;
            const cityName = window.__reportCityName;
            const totals = window.__reportTotals || {};
            
            if (!accountData) {
                alert('No hay datos para exportar');
                return;
            }

            // Usar función auxiliar para obtener datos del cliente
            const data = loadData();
            const clientData = getClientDataForReport(accountData, city, data);
            const { nombreCompleto, identificacionTitular, fechaPrimerPago, fechaVencimiento, numeroContrato, numeroFactura, nombrePlan } = clientData;

            const today = new Date();
            const fechaReporte = formatDate(today.toISOString().split('T')[0]);

            let excelHTML = '';

            // Header
            excelHTML += `
                <div class="report-title">Golden Bridge Corp S.A.S</div>
                <div class="report-subtitle">REPORTE ESTADO DE CUENTA - Cliente: ${accountData.holderId || ''} - ${nombreCompleto} - Ciudad: ${city} - ${cityName} - Fecha: ${fechaReporte}</div>
            `;

            // Información del Cliente
            excelHTML += '<div style="margin-bottom: 20px;">';
            excelHTML += '<div style="font-weight: 700; margin-bottom: 10px; font-size: 14px; text-transform: uppercase;">Datos del Cliente</div>';
            excelHTML += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">';
            excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 600; width: 30%;">Cliente:</td><td style="padding: 5px; border: 1px solid #000;">' + nombreCompleto + '</td></tr>';
            if (identificacionTitular) {
                excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 600;">Identificación:</td><td style="padding: 5px; border: 1px solid #000;">' + identificacionTitular + '</td></tr>';
            }
            if (fechaPrimerPago) {
                excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 600;">Fecha 1er Pago:</td><td style="padding: 5px; border: 1px solid #000;">' + formatDate(fechaPrimerPago) + '</td></tr>';
            }
            if (numeroContrato) {
                excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 600;">Contrato:</td><td style="padding: 5px; border: 1px solid #000;">' + numeroContrato + '</td></tr>';
            }
            if (numeroFactura) {
                excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 600;">Factura:</td><td style="padding: 5px; border: 1px solid #000;">' + numeroFactura + '</td></tr>';
            }
            if (nombrePlan) {
                excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 600;">Plan:</td><td style="padding: 5px; border: 1px solid #000;">' + nombrePlan.toUpperCase() + '</td></tr>';
            }
            excelHTML += '</table>';
            excelHTML += '</div>';

            // Resumen Financiero
            excelHTML += '<div style="margin-bottom: 20px;">';
            excelHTML += '<div style="font-weight: 700; margin-bottom: 10px; font-size: 14px; text-transform: uppercase;">Resumen Financiero</div>';
            excelHTML += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">';
            excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 600; width: 30%;">Valor Factura $ +:</td><td style="padding: 5px; border: 1px solid #000; text-align: right;">' + formatMoney(totals.valorFactura || 0) + '</td></tr>';
            excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 600;">Notas Débito $ +:</td><td style="padding: 5px; border: 1px solid #000; text-align: right;">' + formatMoney(totals.notasDebito || 0) + '</td></tr>';
            excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 600;">Notas Crédito $ -:</td><td style="padding: 5px; border: 1px solid #000; text-align: right;">' + formatMoney(totals.notasCredito || 0) + '</td></tr>';
            excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 600;">Valor Abonos $ -:</td><td style="padding: 5px; border: 1px solid #000; text-align: right;">' + formatMoney(totals.valorAbonos || 0) + '</td></tr>';
            excelHTML += '<tr><td style="padding: 5px; border: 1px solid #000; font-weight: 700; background: #f0f0f0;">Total Deuda $ =:</td><td style="padding: 5px; border: 1px solid #000; text-align: right; font-weight: 700; background: #f0f0f0;">' + formatMoney(totals.totalDeuda || 0) + '</td></tr>';
            excelHTML += '</table>';
            excelHTML += '</div>';

            // Tabla de Ingresos
            excelHTML += '<div style="margin-bottom: 20px;">';
            excelHTML += '<table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">';
            excelHTML += '<thead>';
            excelHTML += '<tr style="background-color: #f0f0f0;">';
            excelHTML += '<th style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; text-transform: uppercase;">Tipo Ingreso</th>';
            excelHTML += '<th style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; text-transform: uppercase;">Ingreso</th>';
            excelHTML += '<th style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; text-transform: uppercase;">Cliente</th>';
            excelHTML += '<th style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; text-transform: uppercase;">Fecha Tra.</th>';
            excelHTML += '<th style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; text-transform: uppercase;">Cuota</th>';
            excelHTML += '<th style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; text-transform: uppercase;">Recibo</th>';
            excelHTML += '<th style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; text-transform: uppercase;">FP</th>';
            excelHTML += '<th style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; text-transform: uppercase;">Valor Cobrado</th>';
            excelHTML += '</tr>';
            excelHTML += '</thead>';
            excelHTML += '<tbody>';

            if (__rows.length === 0) {
                excelHTML += '<tr>';
                excelHTML += '<td colspan="8" style="border: 1px solid #000; padding: 20px; text-align: center;">No hay ingresos para mostrar</td>';
                excelHTML += '</tr>';
            } else {
                __rows.forEach(row => {
                    excelHTML += '<tr>';
                    excelHTML += `<td style="border: 1px solid #000; padding: 6px;">${row.tipo || ''}</td>`;
                    excelHTML += `<td style="border: 1px solid #000; padding: 6px;">${row.numero || ''}</td>`;
                    excelHTML += `<td style="border: 1px solid #000; padding: 6px;">${row.cliente || ''}</td>`;
                    excelHTML += `<td style="border: 1px solid #000; padding: 6px;">${formatDate(row.fecha)}</td>`;
                    excelHTML += `<td style="border: 1px solid #000; padding: 6px;">${row.cuota || ''}</td>`;
                    excelHTML += `<td style="border: 1px solid #000; padding: 6px;">${row.recibo || ''}</td>`;
                    excelHTML += `<td style="border: 1px solid #000; padding: 6px;">${row.fp || ''}</td>`;
                    excelHTML += `<td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatMoney(row.valorCobrado || 0)}</td>`;
                    excelHTML += '</tr>';
                });
            }

            excelHTML += '</tbody>';
            excelHTML += '</table>';
            excelHTML += '</div>';

            const fullExcelHTML = `
                <html>
                    <head>
                        <meta charset='utf-8'>
                        <title>Reporte Estado de Cuenta</title>
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
            a.download = `reporte-estado-cuenta-${new Date().getTime()}.xls`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Error exportando a Excel:', e);
            alert('Error al exportar a Excel');
        }
    }

    function exportDOC() {
        try {
            const accountData = window.__reportAccountData;
            const city = window.__reportCity;
            const cityName = window.__reportCityName;
            const totals = window.__reportTotals || {};
            
            if (!accountData) {
                alert('No hay datos para exportar');
                return;
            }

            // Usar función auxiliar para obtener datos del cliente
            const data = loadData();
            const clientData = getClientDataForReport(accountData, city, data);
            const { nombreCompleto, identificacionTitular, fechaPrimerPago, fechaVencimiento, numeroContrato, numeroFactura, nombrePlan } = clientData;

            const today = new Date();
            const fechaReporte = formatDate(today.toISOString().split('T')[0]);

            let wordHTML = '';

            // Header
            wordHTML += `
                <div class="report-title">Golden Bridge Corp S.A.S</div>
                <div class="report-subtitle">REPORTE ESTADO DE CUENTA - Cliente: ${accountData.holderId || ''} - ${nombreCompleto} - Ciudad: ${city} - ${cityName} - Fecha: ${fechaReporte}</div>
            `;

            // Información del Cliente (sin recuadro, solo texto)
            wordHTML += '<div style="margin-bottom: 20px; text-align: left;">';
            wordHTML += '<div style="font-weight: 700; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; color: #1a1a1a;">Datos del Cliente</div>';
            wordHTML += '<div style="font-size: 13px; line-height: 1.8;">';
            wordHTML += `<div><strong>Cliente:</strong> ${nombreCompleto}</div>`;
            if (identificacionTitular) {
                wordHTML += `<div><strong>Identificación:</strong> ${identificacionTitular}</div>`;
            }
            if (fechaPrimerPago) {
                wordHTML += `<div><strong>Fecha 1er Pago:</strong> ${formatDate(fechaPrimerPago)}</div>`;
            }
            if (fechaVencimiento) {
                wordHTML += `<div><strong>Fecha Vencimiento:</strong> ${formatDate(fechaVencimiento)}</div>`;
            }
            if (numeroContrato) {
                wordHTML += `<div><strong>Contrato:</strong> ${numeroContrato}</div>`;
            }
            if (numeroFactura) {
                wordHTML += `<div><strong>Factura:</strong> ${numeroFactura}</div>`;
            }
            if (nombrePlan) {
                wordHTML += `<div><strong>Plan:</strong> ${nombrePlan.toUpperCase()}</div>`;
            }
            wordHTML += '</div>';
            wordHTML += '</div>';

            // Resumen Financiero (sin recuadro, solo texto)
            wordHTML += '<div style="margin-bottom: 20px; text-align: left;">';
            wordHTML += '<div style="font-weight: 700; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; color: #1a1a1a;">Resumen Financiero</div>';
            wordHTML += '<div style="font-size: 13px; line-height: 1.8;">';
            wordHTML += `<div><strong>Valor Factura $ +:</strong> ${formatMoney(totals.valorFactura || 0)}</div>`;
            wordHTML += `<div><strong>Notas Débito $ +:</strong> ${formatMoney(totals.notasDebito || 0)}</div>`;
            wordHTML += `<div><strong>Notas Crédito $ -:</strong> ${formatMoney(totals.notasCredito || 0)}</div>`;
            wordHTML += `<div><strong>Valor Abonos $ -:</strong> ${formatMoney(totals.valorAbonos || 0)}</div>`;
            wordHTML += `<div style="font-weight: 700;"><strong>Total Deuda $ =:</strong> ${formatMoney(totals.totalDeuda || 0)}</div>`;
            wordHTML += '</div>';
            wordHTML += '</div>';

            // Tabla de Ingresos
            wordHTML += '<div style="margin-bottom: 20px;">';
            wordHTML += '<table>';
            wordHTML += '<thead>';
            wordHTML += '<tr>';
            wordHTML += '<th style="width: 8%;">Tipo Ingreso</th>';
            wordHTML += '<th style="width: 12%;">Ingreso</th>';
            wordHTML += '<th style="width: 10%;">Cliente</th>';
            wordHTML += '<th style="width: 10%;">Fecha Tra.</th>';
            wordHTML += '<th style="width: 8%;">Cuota</th>';
            wordHTML += '<th style="width: 8%;">Recibo</th>';
            wordHTML += '<th style="width: 6%;">FP</th>';
            wordHTML += '<th style="width: 12%;">Valor Cobrado</th>';
            wordHTML += '</tr>';
            wordHTML += '</thead>';
            wordHTML += '<tbody>';

            if (__rows.length === 0) {
                wordHTML += '<tr>';
                wordHTML += '<td colspan="8" style="text-align: center; padding: 20px;">No hay ingresos para mostrar</td>';
                wordHTML += '</tr>';
            } else {
                __rows.forEach(row => {
                    wordHTML += '<tr>';
                    wordHTML += `<td>${row.tipo || ''}</td>`;
                    wordHTML += `<td>${row.numero || ''}</td>`;
                    wordHTML += `<td>${row.cliente || ''}</td>`;
                    wordHTML += `<td>${formatDate(row.fecha)}</td>`;
                    wordHTML += `<td>${row.cuota || ''}</td>`;
                    wordHTML += `<td>${row.recibo || ''}</td>`;
                    wordHTML += `<td>${row.fp || ''}</td>`;
                    wordHTML += `<td style="text-align: right;">${formatMoney(row.valorCobrado || 0)}</td>`;
                    wordHTML += '</tr>';
                });
            }

            wordHTML += '</tbody>';
            wordHTML += '</table>';
            wordHTML += '</div>';

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
                        }
                        .report-container {
                            width: 100%;
                            max-width: 100%;
                            margin: 0 auto;
                        }
                        .report-title { 
                            font-size: 18px; 
                            font-weight: bold; 
                            text-align: center; 
                            margin-bottom: 10px; 
                            margin-top: 20px;
                            text-transform: uppercase;
                        }
                        .report-subtitle { 
                            font-size: 13px; 
                            text-align: center; 
                            margin-bottom: 25px; 
                            color: #666; 
                            text-transform: uppercase;
                        }
                        table { 
                            width: 100%; 
                            max-width: 100%;
                            border-collapse: collapse; 
                            margin: 0 auto;
                            border: 1px solid #000;
                            font-size: 10px;
                            table-layout: fixed;
                        }
                        th, td { 
                            border: 1px solid #000; 
                            padding: 6px 4px; 
                            text-align: left; 
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
                        .footer { 
                            text-align: center; 
                            color: #888; 
                            font-size: 10px; 
                            margin-top: 20px;
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
            a.download = `reporte-estado-cuenta-${new Date().getTime()}.doc`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Error exportando a Word:', e);
            alert('Error al exportar a Word');
        }
    }

    function exportPDF() {
        // Abrir directamente el diálogo de impresión del navegador
        // Muestra vista previa antes de imprimir/guardar como PDF
        // El CSS @media print ocultará automáticamente el toolbar
        window.print();
    }

    // Inicialización
    document.addEventListener('DOMContentLoaded', function() {
        try {
            processReportData();
            renderReport();
        } catch (e) {
            console.error('Error inicializando reporte:', e);
        }
    });

    // Exponer funciones globalmente
    window.goFirst = goFirst;
    window.goPrevious = goPrevious;
    window.goNext = goNext;
    window.goLast = goLast;
    window.goToPage = goToPage;
    window.setZoom = setZoom;
    window.exportExcel = exportExcel;
    window.exportDOC = exportDOC;
    window.exportPDF = exportPDF;
})();




