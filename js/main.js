// Punto de entrada principal
import { loadConfig, saveConfig, resetConfig, CONFIG_DEFAULT } from './config.js';
import { 
    elements, formatInputCLP, poblarAfpSelect, obtenerTasaAfp, 
    toggleSaludPanel, mostrarResultados, actualizarUIconConfig, 
    leerConfigDesdeUI, actualizarTextoIndicadores, toggleConfigPanel 
} from './ui.js';
import { parseCLP, calcularLiquidoCompleto } from './calculos.js';

// Estado global
let configActual = loadConfig();
let indicadoresActualizados = false;

// --- Funciones de inicialización y eventos ---

// Actualizar indicadores desde API
async function actualizarIndicadores() {
    const statusSpan = elements.indicadorStatus;
    if (statusSpan) {
        statusSpan.innerHTML = '🔄 Actualizando UF/UTM...';
    }
    
    try {
        const [resUF, resUTM] = await Promise.all([
            fetch('https://mindicador.cl/api/uf'),
            fetch('https://mindicador.cl/api/utm')
        ]);
        
        const dataUF = await resUF.json();
        const dataUTM = await resUTM.json();
        
        if (dataUF.serie && dataUF.serie[0] && dataUTM.serie && dataUTM.serie[0]) {
            configActual.UF = dataUF.serie[0].valor;
            configActual.UTM = dataUTM.serie[0].valor;
            
            const fechaUF = new Date(dataUF.serie[0].fecha).toLocaleDateString('es-CL');
            actualizarTextoIndicadores(configActual.UF, configActual.UTM, fechaUF, false);
            
            // Guardar en localStorage
            saveConfig(configActual);
            actualizarUIconConfig(configActual);
            
            // Recalcular si hay sueldo ingresado
            const bruto = parseCLP(elements.sueldoInput.value);
            if (bruto > 0) ejecutarCalculo();
            
            indicadoresActualizados = true;
            return true;
        }
        throw new Error('Datos incompletos');
    } catch (error) {
        console.warn('Error obteniendo indicadores:', error);
        actualizarTextoIndicadores(configActual.UF, configActual.UTM, null, true);
        return false;
    }
}

// Ejecutar cálculo completo y actualizar UI
function ejecutarCalculo() {
    const bruto = parseCLP(elements.sueldoInput.value);
    if (bruto <= 0) {
        elements.resultadosDiv.classList.add('hidden');
        return;
    }
    
    const tasaAfp = obtenerTasaAfp();
    const sistemaSalud = elements.radioFonasa.checked ? 'fonasa' : 'isapre';
    const ufPlan = parseFloat(elements.ufIsapreInput.value) || 0;
    const tipoContrato = elements.tipoContrato.value;
    
    const resultado = calcularLiquidoCompleto(bruto, tasaAfp, sistemaSalud, ufPlan, tipoContrato, configActual);
    mostrarResultados(resultado, tasaAfp, configActual);
}

// Sincronizar configuración desde panel y guardar
function aplicarConfiguracionPersonalizada() {
    const nuevaConfig = leerConfigDesdeUI();
    configActual = { ...configActual, ...nuevaConfig };
    saveConfig(configActual);
    actualizarUIconConfig(configActual);
    ejecutarCalculo();
}

// Resetear configuración a valores por defecto
function resetearConfiguracion() {
    configActual = resetConfig();
    actualizarUIconConfig(configActual);
    saveConfig(configActual);
    ejecutarCalculo();
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Input sueldo
    elements.sueldoInput.addEventListener('input', formatInputCLP);
    elements.sueldoInput.addEventListener('blur', formatInputCLP);
    
    // AFP
    elements.afpSelect.addEventListener('change', () => {
        elements.afpCustom.value = '';
        ejecutarCalculo();
    });
    elements.afpCustom.addEventListener('input', () => {
        if (elements.afpCustom.value) elements.afpSelect.value = '';
        ejecutarCalculo();
    });
    
    // Salud
    elements.radioFonasa.addEventListener('change', () => {
        toggleSaludPanel();
        ejecutarCalculo();
    });
    elements.radioIsapre.addEventListener('change', () => {
        toggleSaludPanel();
        ejecutarCalculo();
    });
    elements.ufIsapreInput.addEventListener('input', ejecutarCalculo);
    
    // Contrato
    elements.tipoContrato.addEventListener('change', ejecutarCalculo);
    
    // Botón calcular
    elements.calcularBtn.addEventListener('click', ejecutarCalculo);
    
    // Tema oscuro/claro
    elements.themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    });
    
    // Panel de configuración
    elements.configToggleBtn.addEventListener('click', toggleConfigPanel);
    elements.resetConfigBtn.addEventListener('click', resetearConfiguracion);
    
    // Al cambiar inputs de configuración
    [elements.configUF, elements.configUTM, elements.configTopeUF].forEach(input => {
        input.addEventListener('change', aplicarConfiguracionPersonalizada);
    });
    
    // Refrescar indicadores manualmente
    elements.refreshIndicadoresBtn.addEventListener('click', () => {
        actualizarIndicadores();
    });
    
    // Recalcular al cambiar cualquier campo relevante (ya cubierto)
}

// Inicialización al cargar la página
function init() {
    poblarAfpSelect();
    actualizarUIconConfig(configActual);
    toggleSaludPanel();
    setupEventListeners();
    
    // Valor inicial de ejemplo
    elements.sueldoInput.value = '1.500.000';
    
    // Intentar actualizar indicadores
    actualizarIndicadores().then(() => {
        ejecutarCalculo();
    });
    
    // Actualizar cada 6 horas
    setInterval(actualizarIndicadores, 6 * 60 * 60 * 1000);
}

// Arrancar
init();
