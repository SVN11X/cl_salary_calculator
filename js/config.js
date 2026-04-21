// Configuración por defecto y manejo de almacenamiento local
export const CONFIG_DEFAULT = {
    UF: 37850.25,
    UTM: 66250.00,
    TOPE_IMPONIBLE_UF: 84.3,
    TASA_CESANTIA_INDEFINIDO: 0.006,
    TASA_CESANTIA_PLAZO_FIJO: 0.028,
    TASA_FONASA: 0.07,
};

// Lista de AFP (comisiones 2026 aproximadas)
export const AFP_LIST = [
    { nombre: 'Capital', comision: 1.45 },
    { nombre: 'Cuprum', comision: 1.44 },
    { nombre: 'Habitat', comision: 1.45 },
    { nombre: 'PlanVital', comision: 1.16 },
    { nombre: 'ProVida', comision: 1.45 },
    { nombre: 'Modelo', comision: 0.58 },
    { nombre: 'Uno', comision: 0.49 },
];

// Tramo de impuesto único (en UTM)
export const TRAMOS_IMPUESTO = [
    { desde: 0, hasta: 13.5, factor: 0.00, rebaja: 0.00 },
    { desde: 13.5, hasta: 30.0, factor: 0.04, rebaja: 0.54 },
    { desde: 30.0, hasta: 50.0, factor: 0.08, rebaja: 1.74 },
    { desde: 50.0, hasta: 70.0, factor: 0.135, rebaja: 4.49 },
    { desde: 70.0, hasta: 90.0, factor: 0.23, rebaja: 11.14 },
    { desde: 90.0, hasta: 120.0, factor: 0.304, rebaja: 17.80 },
    { desde: 120.0, hasta: Infinity, factor: 0.35, rebaja: 23.32 },
];

// Clave para localStorage
const STORAGE_KEY = 'cl_salary_calc_config';

// Cargar configuración guardada o usar default
export function loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return { ...CONFIG_DEFAULT, ...JSON.parse(saved) };
        } catch (e) {
            console.warn('Error al leer configuración guardada');
        }
    }
    return { ...CONFIG_DEFAULT };
}

// Guardar configuración
export function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// Resetear a valores por defecto
export function resetConfig() {
    localStorage.removeItem(STORAGE_KEY);
    return { ...CONFIG_DEFAULT };
}
