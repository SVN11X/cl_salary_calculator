// Lógica de cálculo pura (sin dependencias del DOM)
import { TRAMOS_IMPUESTO } from './config.js';

export function formatCLP(valor) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor);
}

export function parseCLP(str) {
    return Number(str.replace(/\D/g, '')) || 0;
}

export function calcularTopeImponible(config) {
    return config.TOPE_IMPONIBLE_UF * config.UF;
}

export function calcularBaseImponible(bruto, config) {
    const tope = calcularTopeImponible(config);
    return Math.min(bruto, tope);
}

export function calcularAfp(bruto, tasaAfp, config) {
    const base = calcularBaseImponible(bruto, config);
    return base * tasaAfp;
}

export function calcularSalud(bruto, sistemaSalud, ufPlan, config) {
    const base = calcularBaseImponible(bruto, config);
    if (sistemaSalud === 'fonasa') {
        return base * config.TASA_FONASA;
    } else {
        const montoIsapre = ufPlan * config.UF;
        const minimoLegal = base * config.TASA_FONASA;
        return Math.max(montoIsapre, minimoLegal);
    }
}

export function calcularCesantia(bruto, tipoContrato, config) {
    const base = calcularBaseImponible(bruto, config);
    const tasa = tipoContrato === 'indefinido' 
        ? config.TASA_CESANTIA_INDEFINIDO 
        : config.TASA_CESANTIA_PLAZO_FIJO;
    return base * tasa;
}

export function calcularImpuestoUnico(baseTributable, config) {
    if (baseTributable <= 0) return 0;
    const enUTM = baseTributable / config.UTM;
    const tramo = TRAMOS_IMPUESTO.find(t => enUTM > t.desde && enUTM <= t.hasta);
    if (!tramo) return 0;
    const impuesto = (baseTributable * tramo.factor) - (tramo.rebaja * config.UTM);
    return Math.max(0, impuesto);
}

export function calcularLiquidoCompleto(bruto, tasaAfp, sistemaSalud, ufPlan, tipoContrato, config) {
    const tope = calcularTopeImponible(config);
    const baseImponible = Math.min(bruto, tope);
    
    const afp = calcularAfp(bruto, tasaAfp, config);
    const salud = calcularSalud(bruto, sistemaSalud, ufPlan, config);
    const cesantia = calcularCesantia(bruto, tipoContrato, config);
    
    const baseTributable = bruto - afp - salud - cesantia;
    const impuesto = calcularImpuestoUnico(baseTributable, config);
    const liquido = baseTributable - impuesto;
    
    return {
        bruto,
        afp,
        salud,
        cesantia,
        baseTributable,
        impuesto,
        liquido,
        topeImponible: tope,
        baseImponible
    };
}
