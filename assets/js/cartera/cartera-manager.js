/**
 * ====================================================================================
 * 📊 CARTERA MANAGER - GOLDEN APP
 * ====================================================================================
 * 
 * Este archivo gestiona la tabla de CARTERA que se actualiza automáticamente
 * cuando se crean facturas, se realizan ingresos o se hacen asignaciones.
 * 
 * FUNCIONALIDADES:
 * - Genera registros de cartera al crear una factura
 * - Actualiza registros cuando hay ingresos a caja/bancos
 * - Actualiza ejecutivo cuando hay asignaciones
 * - Maneja pagos parciales y múltiples cuotas
 * 
 * ====================================================================================
 * 
 * @author Equipo Golden Bridge
 * @version 1.0.0
 * @date 2025
 */

(function() {
    'use strict';

    /**
     * Genera los registros de cartera cuando se crea una factura
     * @param {Object} invoiceData - Datos de la factura
     * @param {String} city - Código de ciudad
     */
    function generateCarteraFromInvoice(invoiceData, city) {
        try {
            console.log('📊 Generando registros de cartera para factura:', invoiceData.invoiceNumber);
            
            // Obtener datos del contrato y plan
            const contractData = getContractData(invoiceData.contractNumber || invoiceData.contractId, city);
            if (!contractData) {
                console.error('❌ No se encontró el contrato para generar cartera');
                return;
            }
            
            // Obtener datos del plan
            const planData = getPlanData(contractData.plan || contractData.planCode, city);
            if (!planData) {
                console.error('❌ No se encontró el plan para generar cartera');
                return;
            }
            
            // Calcular número de cuotas y valor de cada cuota
            const numCuotas = getNumCuotas(planData);
            const valorCuota = calculateValorCuota(invoiceData.value || contractData.valorPlan || planData.valorPlan, numCuotas);
            const firstPaymentDate = invoiceData.firstPaymentDate || contractData.fechaInicial || new Date().toISOString().split('T')[0];
            
            // Obtener o crear array de cartera para esta ciudad
            const carteraKey = `cartera_${city}`;
            let carteraData = [];
            try {
                const raw = localStorage.getItem(carteraKey);
                if (raw) {
                    carteraData = JSON.parse(raw);
                    if (!Array.isArray(carteraData)) {
                        carteraData = [];
                    }
                }
            } catch (e) {
                console.error('Error cargando cartera existente:', e);
                carteraData = [];
            }
            
            // Generar registro CI (cuota 0)
            const ciRecord = {
                id: `cartera_${Date.now()}_CI_${invoiceData.invoiceNumber}`,
                codpais: 'CO',
                codciudad: city,
                identifica: invoiceData.clientId || '',
                letra: 'A', // Por defecto
                contrato: invoiceData.contractNumber || contractData.contractNumber || '',
                tipoingres: 'CI',
                cuota: '0',
                factura: invoiceData.invoiceNumber || '',
                fecha: invoiceData.date || new Date().toISOString().split('T')[0],
                fechavenci: invoiceData.date || new Date().toISOString().split('T')[0],
                valor: parseFloat(valorCuota.toFixed(2)), // Asegurar que sea número
                fechapago: '',
                valorpago: 0,
                ejecutivo: '',
                cancelado: 'N',
                anoasigna: '',
                mesasigna: '',
                ncheque: '',
                ningrposf: '',
                numerond: '',
                f_usuagrab: 'SISTEMA',
                invoiceId: invoiceData.id,
                contractId: contractData.id || contractData.contractNumber
            };
            carteraData.push(ciRecord);
            
            // Generar registros para cada cuota (1/15, 2/15, etc.)
            for (let i = 1; i <= numCuotas; i++) {
                // Calcular fecha de vencimiento de la cuota
                const fechaVencimiento = calculateFechaVencimiento(firstPaymentDate, i);
                
                const cuotaRecord = {
                    id: `cartera_${Date.now()}_${i}_${invoiceData.invoiceNumber}`,
                    codpais: 'CO',
                    codciudad: city,
                    identifica: invoiceData.clientId || '',
                    letra: 'A', // Por defecto
                    contrato: invoiceData.contractNumber || contractData.contractNumber || '',
                    tipoingres: 'CR',
                    cuota: `${i}/${numCuotas}`,
                    factura: invoiceData.invoiceNumber || '',
                    fecha: invoiceData.date || new Date().toISOString().split('T')[0],
                    fechavenci: fechaVencimiento,
                    valor: parseFloat(valorCuota.toFixed(2)), // Asegurar que sea número
                    fechapago: '',
                    valorpago: 0,
                    ejecutivo: '',
                    cancelado: 'N',
                    anoasigna: '',
                    mesasigna: '',
                    ncheque: '',
                    ningrposf: '',
                    numerond: '',
                    f_usuagrab: 'SISTEMA',
                    invoiceId: invoiceData.id,
                    contractId: contractData.id || contractData.contractNumber
                };
                carteraData.push(cuotaRecord);
            }
            
            // Guardar en localStorage
            localStorage.setItem(carteraKey, JSON.stringify(carteraData));
            console.log(`✅ Generados ${numCuotas + 1} registros de cartera (1 CI + ${numCuotas} cuotas)`);
            
        } catch (e) {
            console.error('❌ Error generando cartera desde factura:', e);
        }
    }

    /**
     * Actualiza los registros de cartera cuando se realiza un ingreso
     * @param {Object} inflowData - Datos del ingreso (caja o banco)
     * @param {String} city - Código de ciudad
     * @param {String} source - 'caja' o 'banco'
     */
    function updateCarteraFromInflow(inflowData, city, source = 'caja') {
        try {
            console.log('💰 Actualizando cartera desde ingreso:', inflowData.numero);
            
            const carteraKey = `cartera_${city}`;
            let carteraData = [];
            try {
                const raw = localStorage.getItem(carteraKey);
                if (raw) {
                    carteraData = JSON.parse(raw);
                    if (!Array.isArray(carteraData)) {
                        carteraData = [];
                    }
                }
            } catch (e) {
                console.error('Error cargando cartera:', e);
                return;
            }
            
            const invoiceNumber = inflowData.invoiceNumber || '';
            const holderId = inflowData.holderId || '';
            const fechaPago = inflowData.fecha || inflowData.date || new Date().toISOString().split('T')[0];
            
            // Si tiene detalleCuotas, procesar cada cuota
            if (inflowData.detalleCuotas && Array.isArray(inflowData.detalleCuotas) && inflowData.detalleCuotas.length > 0) {
                inflowData.detalleCuotas.forEach(detalle => {
                    updateCarteraRecord(carteraData, invoiceNumber, holderId, detalle.cuota, detalle.valorPagar, fechaPago, detalle.esParcial);
                });
            } else {
                // Sistema antiguo: procesar campo cuota (puede ser "2, 3, 4" o "2")
                const cuotaStr = String(inflowData.cuota || '').trim();
                const valorTotal = inflowData.valor || 0;
                
                if (cuotaStr && cuotaStr.includes(',')) {
                    // Múltiples cuotas: dividir el valor proporcionalmente
                    const cuotasArray = cuotaStr.split(',').map(c => c.trim()).filter(c => c);
                    const valorPorCuota = cuotasArray.length > 0 ? valorTotal / cuotasArray.length : valorTotal;
                    
                    cuotasArray.forEach(cuotaNum => {
                        updateCarteraRecord(carteraData, invoiceNumber, holderId, cuotaNum, valorPorCuota, fechaPago, false);
                    });
                } else if (cuotaStr) {
                    // Una sola cuota
                    updateCarteraRecord(carteraData, invoiceNumber, holderId, cuotaStr, valorTotal, fechaPago, false);
                }
            }
            
            // Guardar cambios
            localStorage.setItem(carteraKey, JSON.stringify(carteraData));
            console.log('✅ Cartera actualizada desde ingreso');
            
        } catch (e) {
            console.error('❌ Error actualizando cartera desde ingreso:', e);
        }
    }

    /**
     * Actualiza un registro específico de cartera
     */
    function updateCarteraRecord(carteraData, invoiceNumber, holderId, cuota, valorPago, fechaPago, esParcial) {
        // Buscar el registro de cartera correspondiente
        const record = carteraData.find(r => {
            const matchInvoice = (r.factura || '').trim() === String(invoiceNumber).trim();
            const matchHolder = (r.identifica || '').trim() === String(holderId).trim();
            const matchCuota = matchCuotaNumber(r.cuota, cuota);
            return matchInvoice && matchHolder && matchCuota;
        });
        
        if (!record) {
            console.warn('⚠️ No se encontró registro de cartera para:', { invoiceNumber, holderId, cuota });
            return;
        }
        
        // Actualizar valores de pago
        const valorPagoActual = parseFloat(record.valorpago || 0) || 0;
        const nuevoValorPago = valorPagoActual + parseFloat(valorPago || 0);
        const valorCuota = parseFloat(record.valor || 0) || 0;
        
        record.valorpago = nuevoValorPago;
        record.fechapago = fechaPago;
        
        // Determinar si está cancelado
        if (nuevoValorPago >= valorCuota) {
            record.cancelado = 'C';
        } else {
            record.cancelado = 'N';
        }
        
        console.log(`📝 Actualizado registro cartera: Cuota ${cuota}, Valor pagado: ${nuevoValorPago}, Cancelado: ${record.cancelado}`);
    }

    /**
     * Actualiza el ejecutivo en los registros de cartera cuando se hace una asignación
     * @param {Object} assignmentData - Datos de la asignación
     * @param {String} city - Código de ciudad
     */
    function updateCarteraFromAssignment(assignmentData, city) {
        try {
            console.log('👤 Actualizando ejecutivo en cartera desde asignación');
            
            const carteraKey = `cartera_${city}`;
            let carteraData = [];
            try {
                const raw = localStorage.getItem(carteraKey);
                if (raw) {
                    carteraData = JSON.parse(raw);
                    if (!Array.isArray(carteraData)) {
                        carteraData = [];
                    }
                }
            } catch (e) {
                console.error('Error cargando cartera:', e);
                return;
            }
            
            const executiveId = assignmentData.executiveId || '';
            const executiveName = assignmentData.executiveName || '';
            const anoAsigna = assignmentData.year || new Date().getFullYear();
            const mesAsigna = assignmentData.month || new Date().getMonth() + 1;
            
            // Actualizar cada cuenta asignada
            if (assignmentData.accounts && Array.isArray(assignmentData.accounts)) {
                assignmentData.accounts.forEach(account => {
                    const invoiceNumber = account.invoiceNumber || '';
                    const cuotaAsignada = account.cuotaAsignada || account.pendingInstallment || '';
                    
                    // Buscar registros de cartera para esta factura y cuota
                    const records = carteraData.filter(r => {
                        const matchInvoice = (r.factura || '').trim() === String(invoiceNumber).trim();
                        const matchCuota = matchCuotaNumber(r.cuota, cuotaAsignada);
                        return matchInvoice && matchCuota;
                    });
                    
                    records.forEach(record => {
                        record.ejecutivo = executiveId;
                        record.anoasigna = anoAsigna;
                        record.mesasigna = mesAsigna;
                        console.log(`✅ Actualizado ejecutivo ${executiveId} para cuota ${cuotaAsignada} de factura ${invoiceNumber}`);
                    });
                });
            }
            
            // Guardar cambios
            localStorage.setItem(carteraKey, JSON.stringify(carteraData));
            console.log('✅ Cartera actualizada desde asignación');
            
        } catch (e) {
            console.error('❌ Error actualizando cartera desde asignación:', e);
        }
    }

    /**
     * Anula un ingreso y revierte los cambios en cartera
     * @param {Object} inflowData - Datos del ingreso a anular
     * @param {String} city - Código de ciudad
     */
    function revertCarteraFromInflow(inflowData, city) {
        try {
            console.log('🔄 Revirtiendo cambios en cartera por anulación de ingreso');
            
            const carteraKey = `cartera_${city}`;
            let carteraData = [];
            try {
                const raw = localStorage.getItem(carteraKey);
                if (raw) {
                    carteraData = JSON.parse(raw);
                    if (!Array.isArray(carteraData)) {
                        carteraData = [];
                    }
                }
            } catch (e) {
                console.error('Error cargando cartera:', e);
                return;
            }
            
            const invoiceNumber = inflowData.invoiceNumber || '';
            const holderId = inflowData.holderId || '';
            
            // Si tiene detalleCuotas, revertir cada cuota
            if (inflowData.detalleCuotas && Array.isArray(inflowData.detalleCuotas) && inflowData.detalleCuotas.length > 0) {
                inflowData.detalleCuotas.forEach(detalle => {
                    revertCarteraRecord(carteraData, invoiceNumber, holderId, detalle.cuota, detalle.valorPagar);
                });
            } else {
                // Sistema antiguo
                const cuotaStr = String(inflowData.cuota || '').trim();
                const valorTotal = inflowData.valor || 0;
                
                if (cuotaStr && cuotaStr.includes(',')) {
                    const cuotasArray = cuotaStr.split(',').map(c => c.trim()).filter(c => c);
                    const valorPorCuota = cuotasArray.length > 0 ? valorTotal / cuotasArray.length : valorTotal;
                    
                    cuotasArray.forEach(cuotaNum => {
                        revertCarteraRecord(carteraData, invoiceNumber, holderId, cuotaNum, valorPorCuota);
                    });
                } else if (cuotaStr) {
                    revertCarteraRecord(carteraData, invoiceNumber, holderId, cuotaStr, valorTotal);
                }
            }
            
            // Guardar cambios
            localStorage.setItem(carteraKey, JSON.stringify(carteraData));
            console.log('✅ Cartera revertida por anulación de ingreso');
            
        } catch (e) {
            console.error('❌ Error revirtiendo cartera:', e);
        }
    }

    /**
     * Revierte un registro específico de cartera
     */
    function revertCarteraRecord(carteraData, invoiceNumber, holderId, cuota, valorPago) {
        const record = carteraData.find(r => {
            const matchInvoice = (r.factura || '').trim() === String(invoiceNumber).trim();
            const matchHolder = (r.identifica || '').trim() === String(holderId).trim();
            const matchCuota = matchCuotaNumber(r.cuota, cuota);
            return matchInvoice && matchHolder && matchCuota;
        });
        
        if (!record) {
            console.warn('⚠️ No se encontró registro de cartera para revertir:', { invoiceNumber, holderId, cuota });
            return;
        }
        
        // Revertir valores de pago
        const valorPagoActual = parseFloat(record.valorpago || 0) || 0;
        const nuevoValorPago = Math.max(0, valorPagoActual - parseFloat(valorPago || 0));
        const valorCuota = parseFloat(record.valor || 0) || 0;
        
        record.valorpago = nuevoValorPago;
        
        // Si no hay pago, limpiar fecha
        if (nuevoValorPago === 0) {
            record.fechapago = '';
        }
        
        // Actualizar estado de cancelado
        if (nuevoValorPago >= valorCuota) {
            record.cancelado = 'C';
        } else {
            record.cancelado = 'N';
        }
        
        console.log(`🔄 Revertido registro cartera: Cuota ${cuota}, Valor pagado: ${nuevoValorPago}, Cancelado: ${record.cancelado}`);
    }

    // ========================================
    // FUNCIONES AUXILIARES
    // ========================================

    function getContractData(contractNumberOrId, city) {
        try {
            const raw = localStorage.getItem(`contratos_${city}`);
            if (!raw) return null;
            
            const contratos = JSON.parse(raw);
            const contratosArray = Array.isArray(contratos) ? contratos : Object.values(contratos);
            
            return contratosArray.find(c => {
                const matchId = String(c.id || '') === String(contractNumberOrId);
                const matchNumber = String(c.contractNumber || c.numero || c.numeroContrato || '') === String(contractNumberOrId);
                return matchId || matchNumber;
            });
        } catch (e) {
            console.error('Error obteniendo contrato:', e);
            return null;
        }
    }

    function getPlanData(planCodeOrName, city) {
        try {
            const raw = localStorage.getItem('planesData');
            if (!raw) return null;
            
            const planes = JSON.parse(raw);
            const planesArray = Array.isArray(planes) ? planes : Object.values(planes);
            
            return planesArray.find(p => {
                const matchCode = String(p.codigo || p.code || p.codigoPlan || '') === String(planCodeOrName);
                const matchName = String(p.nombre || p.name || '').toUpperCase() === String(planCodeOrName).toUpperCase();
                return matchCode || matchName;
            });
        } catch (e) {
            console.error('Error obteniendo plan:', e);
            return null;
        }
    }

    function getNumCuotas(planData) {
        if (!planData) return 12; // Default
        
        return parseInt(planData.numCuotas || planData.numeroCuotas || planData.cuotas || planData.totalCuotas || planData.cantidadCuotas || planData.numeroMeses || planData.meses || 12, 10);
    }

    function calculateValorCuota(valorTotal, numCuotas) {
        if (!valorTotal || !numCuotas || numCuotas === 0) return 0;
        return parseFloat(valorTotal) / numCuotas;
    }

    function calculateFechaVencimiento(firstPaymentDate, cuotaNumber) {
        try {
            const fecha = new Date(firstPaymentDate);
            fecha.setMonth(fecha.getMonth() + (cuotaNumber - 1));
            return fecha.toISOString().split('T')[0];
        } catch (e) {
            // Si hay error, calcular desde hoy
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() + (cuotaNumber - 1));
            return fecha.toISOString().split('T')[0];
        }
    }

    function matchCuotaNumber(cuotaCartera, cuotaBuscada) {
        // Comparar "1/15" con "1" o "1/15"
        const cuotaCarteraStr = String(cuotaCartera || '').trim();
        const cuotaBuscadaStr = String(cuotaBuscada || '').trim();
        
        if (cuotaCarteraStr === cuotaBuscadaStr) return true;
        
        // Extraer número de cuota de formato "X/Y"
        const matchCartera = cuotaCarteraStr.match(/^(\d+)\//);
        const matchBuscada = cuotaBuscadaStr.match(/^(\d+)\//);
        
        if (matchCartera && matchBuscada) {
            return matchCartera[1] === matchBuscada[1];
        }
        
        // Comparar número directo
        if (matchCartera && cuotaBuscadaStr === matchCartera[1]) return true;
        if (matchBuscada && cuotaCarteraStr === matchBuscada[1]) return true;
        
        return false;
    }

    // ========================================
    // EXPORTAR FUNCIONES GLOBALES
    // ========================================

    window.CarteraManager = {
        generateCarteraFromInvoice: generateCarteraFromInvoice,
        updateCarteraFromInflow: updateCarteraFromInflow,
        updateCarteraFromAssignment: updateCarteraFromAssignment,
        revertCarteraFromInflow: revertCarteraFromInflow
    };

})();



