/**
 * ============================================
 * DolarCalc Pro - Componente Principal
 * ============================================
 */

function dolarCalc() {
  return {
    // ==========================================
    // Estado
    // ==========================================

    /** Modo oscuro activado */
    darkMode: localStorage.getItem('dolarDash_dark') === 'true',

    /** Datos de cotizaciones */
    datos: {},

    /** Última actualización (string formateado) */
    lastUpdate: '--:--:--',

    /** Valor del input de cálculo */
    calcInput: 1,

    /** Moneda de cálculo (USD o ARS) */
    calcCurrency: 'USD',

    /** Modo de cálculo (venta, compra, promedio) */
    calcMode: 'promedio',

    /** ID del tipo copiado (para feedback visual) */
    copiedId: null,

    // ==========================================
    // Ciclo de vida
    // ==========================================

    /**
     * Inicialización del componente
     */
    async init() {
      await this.updateData();
      // Actualizar cada 60 segundos
      setInterval(() => this.updateData(), 60000);
    },

    // ==========================================
    // Acciones
    // ==========================================

    /**
     * Alterna entre modo oscuro y claro
     */
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('dolarDash_dark', this.darkMode);
    },

    /**
     * Actualiza los datos desde la API
     */
    async updateData() {
      try {
        this.datos = await DolarApiService.fetchAllCotizaciones();
        this.lastUpdate = Utils.formatDateTime();
      } catch (error) {
        console.error('Error al actualizar datos:', error);
      }
    },

    /**
     * Filtra las teclas permitidas en el input
     * @param {KeyboardEvent} e - Evento de teclado
     */
    filterKey(e) {
      const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete', 'Enter', ',', '.'];
      const isNumber = /[0-9]/.test(e.key);

      // Convertir punto a coma (formato argentino)
      if (e.key === '.') {
        e.preventDefault();
        if (!e.target.value.includes(',')) {
          e.target.value += ',';
          e.target.dispatchEvent(new Event('input'));
        }
        return;
      }

      // Bloquear segunda coma
      if (e.key === ',' && e.target.value.includes(',')) {
        e.preventDefault();
        return;
      }

      // Bloquear teclas no permitidas
      if (!isNumber && !allowedKeys.includes(e.key)) {
        e.preventDefault();
      }
    },

    /**
     * Actualiza el valor de cálculo desde el input
     * @param {InputEvent} e - Evento de input
     */
    updateCalcInput(e) {
      const el = e.target;
      const originalValue = el.value;

      // Limpiar valor
      const cleanValue = Utils.cleanInput(originalValue);

      // Convertir a número para cálculos
      this.calcInput = Utils.parseInputValue(cleanValue);

      // Formatear para visualización
      const finalDisplay = Utils.formatDisplayValue(cleanValue);

      // Actualizar DOM solo si cambió (evita saltos del cursor)
      if (el.value !== finalDisplay) {
        el.value = finalDisplay;
      }
    },

    /**
     * Copia el resultado al portapapeles
     * @param {string} id - ID del tipo de dólar
     * @param {string} nombre - Nombre del tipo de dólar
     */
    copyToClipboard(id, nombre) {
      const precio = this.getPrice(id);
      const resultado = this.doCalculate(precio);

      navigator.clipboard.writeText(resultado).then(() => {
        this.copiedId = id;
        setTimeout(() => {
          this.copiedId = null;
        }, 2000);
      });
    },

    // ==========================================
    // Getters / Computed
    // ==========================================

    /**
     * Obtiene el precio según el tipo y modo seleccionado
     * @param {string} tipo - Tipo de dólar (blue, mep, cripto, oficial)
     * @returns {number} Precio correspondiente
     */
    getPrice(tipo) {
      const d = this.datos[tipo];
      if (!d) return 0;

      if (this.calcMode === 'venta') return d.venta;
      if (this.calcMode === 'compra') return d.compra;

      // Modo promedio
      return Utils.promedio(d.venta, d.compra);
    },

    /**
     * Realiza el cálculo de conversión
     * @param {number} precio - Precio del dólar
     * @returns {string} Resultado formateado
     */
    doCalculate(precio) {
      if (!precio) return '0,00';

      const res = this.calcCurrency === 'USD'
        ? this.calcInput * precio
        : this.calcInput / precio;

      return res.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    // ==========================================
    // Formateo (wrappers de Utils)
    // ==========================================

    /**
     * Formatea valor como moneda
     * @param {number} val - Valor a formatear
     * @returns {string} Valor formateado
     */
    format(val) {
      return Utils.formatCurrency(val);
    },

    /**
     * Formatea valor para input
     * @param {number} val - Valor a formatear
     * @returns {string} Valor formateado
     */
    formatInput(val) {
      return Utils.formatInput(val);
    }
  };
}