// ==============================================
// VARIABLES DE CONFIGURACIÓN (ACTUALIZABLES)
// ==============================================
let CONFIG = {
    UF: 37850.25,        // valor de respaldo si falla la API
    UTM: 66250.00,       // valor de respaldo
    TOPE_IMPONIBLE_UF: 84.3,
    TASA_CESANTIA: 0.006,
    TASA_FONASA: 0.07,
};

async function actualizarIndicadores() {
    const statusSpan = document.getElementById('indicadorStatus');
    if (statusSpan) statusSpan.textContent = '🔄 Actualizando UF/UTM...';
    
    try {
        const [resUF, resUTM] = await Promise.all([
            fetch('https://mindicador.cl/api/uf'),
            fetch('https://mindicador.cl/api/utm')
        ]);
        const dataUF = await resUF.json();
        const dataUTM = await resUTM.json();
        
        if (dataUF.serie && dataUF.serie[0] && dataUTM.serie && dataUTM.serie[0]) {
            CONFIG.UF = dataUF.serie[0].valor;
            CONFIG.UTM = dataUTM.serie[0].valor;
            
            const fechaUF = new Date(dataUF.serie[0].fecha).toLocaleDateString('es-CL');
            if (statusSpan) statusSpan.innerHTML = `📊 UF: ${formatCLP(CONFIG.UF)} (${fechaUF}) | UTM: ${formatCLP(CONFIG.UTM)}`;
            
            const ufValueSpan = document.getElementById('ufValueDisplay');
            if (ufValueSpan) ufValueSpan.textContent = formatCLP(CONFIG.UF);
            
            // Si ya hay un sueldo ingresado, recalcula automáticamente
            const sueldoInput = document.getElementById('sueldoBruto');
            if (sueldoInput && parseCLP(sueldoInput.value) > 0) {
                calcularLiquido();
            }
            return true;
        } else {
            throw new Error('Datos incompletos');
        }
    } catch (error) {
        console.warn('Error obteniendo indicadores:', error);
        if (statusSpan) statusSpan.innerHTML = '⚠️ Usando valores de respaldo (UF/UTM manuales)';
        return false;
    }
}

// Lista de AFP actualizada a 2026 (comisiones referenciales)
const AFP_LIST = [
    { nombre: 'Capital', comision: 1.45 },
    { nombre: 'Cuprum', comision: 1.44 },
    { nombre: 'Habitat', comision: 1.45 },
    { nombre: 'PlanVital', comision: 1.16 },
    { nombre: 'ProVida', comision: 1.45 },
    { nombre: 'Modelo', comision: 0.58 },
    { nombre: 'Uno', comision: 0.49 },
];

// ==============================================
// TRAMOS IMPUESTO ÚNICO (en UTM) - valores 2026
// ==============================================
const TRAMOS_IMPUESTO = [
    { desde: 0, hasta: 13.5, factor: 0.00, rebaja: 0.00 },
    { desde: 13.5, hasta: 30.0, factor: 0.04, rebaja: 0.54 },
    { desde: 30.0, hasta: 50.0, factor: 0.08, rebaja: 1.74 },
    { desde: 50.0, hasta: 70.0, factor: 0.135, rebaja: 4.49 },
    { desde: 70.0, hasta: 90.0, factor: 0.23, rebaja: 11.14 },
    { desde: 90.0, hasta: 120.0, factor: 0.304, rebaja: 17.80 },
    { desde: 120.0, hasta: Infinity, factor: 0.35, rebaja: 23.32 },
];

// ==============================================
// ELEMENTOS DOM
// ==============================================
const sueldoInput = document.getElementById('sueldoBruto');
const afpSelect = document.getElementById('afpSelect');
const afpCustom = document.getElementById('afpCustom');
const radioFonasa = document.querySelector('input[value="fonasa"]');
const radioIsapre = document.querySelector('input[value="isapre"]');
const isapreDiv = document.getElementById('isapreInput');
const ufIsapreInput = document.getElementById('ufIsapre');
const ufValueSpan = document.getElementById('ufValueDisplay');
const calcularBtn = document.getElementById('calcularBtn');
const resultadosDiv = document.getElementById('resultados');

// Resultados spans
const resBruto = document.getElementById('resBruto');
const resAfp = document.getElementById('resAfp');
const resSalud = document.getElementById('resSalud');
const resCesantia = document.getElementById('resCesantia');
const resBaseTributable = document.getElementById('resBaseTributable');
const resImpuesto = document.getElementById('resImpuesto');
const resLiquido = document.getElementById('resLiquido');

// ==============================================
// UTILIDADES: Formato CLP y número
// ==============================================
function formatCLP(valor) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor);
}

function parseCLP(str) {
    return Number(str.replace(/\D/g, '')) || 0;
}

function formatInputCLP() {
    let raw = this.value.replace(/\D/g, '');
    if (raw === '') {
        this.value = '';
        return;
    }
    this.value = new Intl.NumberFormat('es-CL').format(raw);
}

// ==============================================
// INICIALIZACIÓN DE INTERFAZ
// ==============================================
function inicializarUI() {
    // Llenar select AFP
    AFP_LIST.forEach(afp => {
        const option = document.createElement('option');
        option.value = afp.comision;
        option.textContent = `${afp.nombre} (${afp.comision}%)`;
        afpSelect.appendChild(option);
    });
    
    // Mostrar valor UF
    ufValueSpan.textContent = formatCLP(CONFIG.UF);
    
    // Eventos
    sueldoInput.addEventListener('input', formatInputCLP);
    sueldoInput.addEventListener('blur', formatInputCLP);
    
    radioFonasa.addEventListener('change', toggleSalud);
    radioIsapre.addEventListener('change', toggleSalud);
    
    afpSelect.addEventListener('change', () => {
        afpCustom.value = '';
    });
    afpCustom.addEventListener('input', () => {
        if (afpCustom.value) afpSelect.value = '';
    });
    
    calcularBtn.addEventListener('click', calcularLiquido);
    
    // Calcular automático al cambiar cualquier campo
    [sueldoInput, afpSelect, afpCustom, radioFonasa, radioIsapre, ufIsapreInput].forEach(el => {
        el.addEventListener('input', calcularLiquido);
        el.addEventListener('change', calcularLiquido);
    });
    
    // Toggle tema oscuro
    document.getElementById('themeToggle').addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
    });
}

function toggleSalud() {
    if (radioIsapre.checked) {
        isapreDiv.classList.remove('hidden');
    } else {
        isapreDiv.classList.add('hidden');
    }
    calcularLiquido();
}

// ==============================================
// LÓGICA DE CÁLCULO
// ==============================================
function obtenerPorcentajeAFP() {
    if (afpCustom.value && !isNaN(parseFloat(afpCustom.value))) {
        return parseFloat(afpCustom.value) / 100;
    }
    if (afpSelect.value) {
        return parseFloat(afpSelect.value) / 100;
    }
    return 0.01; // fallback
}

function calcularTopeImponible() {
    return CONFIG.TOPE_IMPONIBLE_UF * CONFIG.UF;
}

function calcularSalud(bruto) {
    const tope = calcularTopeImponible();
    const baseSalud = Math.min(bruto, tope);
    
    if (radioFonasa.checked) {
        return baseSalud * CONFIG.TASA_FONASA;
    } else {
        const ufValue = parseFloat(ufIsapreInput.value) || 0;
        const montoIsapre = ufValue * CONFIG.UF;
        // Isapre mínimo es 7% del tope o el pactado, lo que sea mayor
        const minimoLegal = baseSalud * CONFIG.TASA_FONASA;
        return Math.max(montoIsapre, minimoLegal);
    }
}

function calcularCesantia(bruto) {
    const tope = calcularTopeImponible();
    const base = Math.min(bruto, tope);
    return base * CONFIG.TASA_CESANTIA;
}

function calcularImpuestoUnico(baseTributable) {
    if (baseTributable <= 0) return 0;
    
    const enUTM = baseTributable / CONFIG.UTM;
    const tramo = TRAMOS_IMPUESTO.find(t => enUTM > t.desde && enUTM <= t.hasta);
    if (!tramo) return 0;
    
    const impuesto = (baseTributable * tramo.factor) - (tramo.rebaja * CONFIG.UTM);
    return Math.max(0, impuesto);
}

function calcularLiquido() {
    const bruto = parseCLP(sueldoInput.value);
    if (bruto <= 0) {
        resultadosDiv.classList.add('hidden');
        return;
    }
    
    const tope = calcularTopeImponible();
    const baseAfp = Math.min(bruto, tope);
    
    const tasaAfp = obtenerPorcentajeAFP();
    const afp = baseAfp * tasaAfp;
    
    const salud = calcularSalud(bruto);
    const cesantia = calcularCesantia(bruto);
    
    const baseTributable = bruto - afp - salud - cesantia;
    const impuesto = calcularImpuestoUnico(baseTributable);
    
    const liquido = baseTributable - impuesto;
    
    // Mostrar resultados
    resBruto.textContent = formatCLP(bruto);
    resAfp.textContent = `-${formatCLP(afp)}`;
    resSalud.textContent = `-${formatCLP(salud)}`;
    resCesantia.textContent = `-${formatCLP(cesantia)}`;
    resBaseTributable.textContent = formatCLP(baseTributable);
    resImpuesto.textContent = `-${formatCLP(impuesto)}`;
    resLiquido.textContent = formatCLP(liquido);
    
    resultadosDiv.classList.remove('hidden');
}

// ==============================================
// INICIAR APP
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarUI();
    actualizarIndicadores();               // ← nueva línea
    setInterval(actualizarIndicadores, 6 * 60 * 60 * 1000); // ← nueva línea (actualiza cada 6h)
    toggleSalud();

    sueldoInput.value = '1.500.000';
    calcularLiquido();
});
