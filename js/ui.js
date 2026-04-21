// Manejo de la interfaz de usuario
import { formatCLP, parseCLP, calcularLiquidoCompleto } from './calculos.js';
import { AFP_LIST, loadConfig, saveConfig, resetConfig } from './config.js';

// Referencias a elementos del DOM
export const elements = {
    sueldoInput: document.getElementById('sueldoBruto'),
    afpSelect: document.getElementById('afpSelect'),
    afpCustom: document.getElementById('afpCustom'),
    radioFonasa: document.querySelector('input[value="fonasa"]'),
    radioIsapre: document.querySelector('input[value="isapre"]'),
    isapreDiv: document.getElementById('isapreInput'),
    ufIsapreInput: document.getElementById('ufIsapre'),
    tipoContrato: document.getElementById('tipoContrato'),
    calcularBtn: document.getElementById('calcularBtn'),
    resultadosDiv: document.getElementById('resultados'),
    resBruto: document.getElementById('resBruto'),
    resAfp: document.getElementById('resAfp'),
    resSalud: document.getElementById('resSalud'),
    resCesantia: document.getElementById('resCesantia'),
    resBaseTributable: document.getElementById('resBaseTributable'),
    resImpuesto: document.getElementById('resImpuesto'),
    resLiquido: document.getElementById('resLiquido'),
    afpPorcentajeLabel: document.getElementById('afpPorcentajeLabel'),
    topeAplicadoLabel: document.getElementById('topeAplicadoLabel'),
    baseImponibleLabel: document.getElementById('baseImponibleLabel'),
    ufValueDisplay: document.getElementById('ufValueDisplay'),
    indicadorStatus: document.getElementById('indicadorStatus'),
    refreshIndicadoresBtn: document.getElementById('refreshIndicadoresBtn'),
    themeToggle: document.getElementById('themeToggle'),
    configToggleBtn: document.getElementById('configToggleBtn'),
    configPanel: document.getElementById('configPanel'),
    configUF: document.getElementById('configUF'),
    configUTM: document.getElementById('configUTM'),
    configTopeUF: document.getElementById('configTopeUF'),
    resetConfigBtn: document.getElementById('resetConfigBtn'),
};

// Formatear input mientras escribe
export function formatInputCLP(event) {
    let raw = event.target.value.replace(/\D/g, '');
    if (raw === '') {
        event.target.value = '';
        return;
    }
    event.target.value = new Intl.NumberFormat('es-CL').format(raw);
}

// Poblar select de AFP
export function poblarAfpSelect() {
    elements.afpSelect.innerHTML = '';
    AFP_LIST.forEach(afp => {
        const option = document.createElement('option');
        option.value = afp.comision;
        option.textContent = `${afp.nombre} (${afp.comision}%)`;
        elements.afpSelect.appendChild(option);
    });
}

// Obtener tasa AFP actual (seleccionada o personalizada)
export function obtenerTasaAfp() {
    if (elements.afpCustom.value && !isNaN(parseFloat(elements.afpCustom.value))) {
        return parseFloat(elements.afpCustom.value) / 100;
    }
    if (elements.afpSelect.value) {
        return parseFloat(elements.afpSelect.value) / 100;
    }
    return 0.01; // fallback
}

// Mostrar/ocultar panel de Isapre
export function toggleSaludPanel() {
    if (elements.radioIsapre.checked) {
        elements.isapreDiv.classList.remove('hidden');
    } else {
        elements.isapreDiv.classList.add('hidden');
    }
}

// Actualizar UI con resultado del cálculo
export function mostrarResultados(resultado, tasaAfp, config) {
    elements.resBruto.textContent = formatCLP(resultado.bruto);
    elements.resAfp.textContent = `-${formatCLP(resultado.afp)}`;
    elements.resSalud.textContent = `-${formatCLP(resultado.salud)}`;
    elements.resCesantia.textContent = `-${formatCLP(resultado.cesantia)}`;
    elements.resBaseTributable.textContent = formatCLP(resultado.baseTributable);
    elements.resImpuesto.textContent = `-${formatCLP(resultado.impuesto)}`;
    elements.resLiquido.textContent = formatCLP(resultado.liquido);
    
    elements.afpPorcentajeLabel.textContent = `(${(tasaAfp * 100).toFixed(2)}%)`;
    elements.topeAplicadoLabel.textContent = formatCLP(resultado.topeImponible);
    elements.baseImponibleLabel.textContent = formatCLP(resultado.baseImponible);
    
    elements.resultadosDiv.classList.remove('hidden');
}

// Actualizar UI con valores de configuración
export function actualizarUIconConfig(config) {
    elements.ufValueDisplay.textContent = formatCLP(config.UF);
    elements.configUF.value = config.UF.toFixed(2);
    elements.configUTM.value = config.UTM.toFixed(2);
    elements.configTopeUF.value = config.TOPE_IMPONIBLE_UF.toFixed(1);
}

// Leer configuración desde los inputs del panel
export function leerConfigDesdeUI() {
    return {
        UF: parseFloat(elements.configUF.value) || 0,
        UTM: parseFloat(elements.configUTM.value) || 0,
        TOPE_IMPONIBLE_UF: parseFloat(elements.configTopeUF.value) || 0,
        TASA_CESANTIA_INDEFINIDO: 0.006, // No editables en UI por ahora
        TASA_CESANTIA_PLAZO_FIJO: 0.028,
        TASA_FONASA: 0.07,
    };
}

// Actualizar texto de indicadores económicos
export function actualizarTextoIndicadores(uf, utm, fechaUF, esRespaldo = false) {
    const statusSpan = elements.indicadorStatus;
    if (!statusSpan) return;
    
    const icono = esRespaldo ? '⚠️' : '📊';
    const fechaTexto = fechaUF ? ` (${fechaUF})` : '';
    statusSpan.innerHTML = `${icono} UF: ${formatCLP(uf)}${fechaTexto} | UTM: ${formatCLP(utm)} `;
    
    // Agregar botón de refresh (ya está en HTML, solo actualizamos el texto)
}

// Toggle del panel de configuración
export function toggleConfigPanel() {
    elements.configPanel.classList.toggle('hidden');
}
