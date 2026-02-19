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

    /** Currencies data from /cotizaciones endpoint */
    currenciesData: [],

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
    // View Mode State
    // ==========================================

    /** Current view mode: calculator | arbitrage | currencies */
    viewMode: localStorage.getItem('viewMode') || 'calculator',

    // ==========================================
    // Arbitrage State
    // ==========================================

    /** Arbitrage amount in ARS */
    arbitrageAmount: 100000,

    /** Configuracion de costos */
    operationCosts: {
      mep: { commission: 0.006, parking: 24, name: 'MEP', nameEs: 'MEP' },
      blue: { commission: 0.00, parking: 0, name: 'Blue', nameEs: 'Blue' },
      cripto: { commission: 0.005, parking: 0, name: 'Crypto', nameEs: 'Cripto' },
      oficial: { commission: 0.00, parking: 0, name: 'Official', nameEs: 'Oficial' }
    },

    // ==========================================
    // Currencies State
    // ==========================================

    /** Selected currency code for conversion */
    selectedCurrency: 'ARS',

    /** Amount to convert in currencies mode */
    currenciesAmount: 1000,

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
     * Actualiza los datos desde la API
     */
    async updateData() {
      try {
        this.datos = await DolarApiService.fetchAllCotizaciones();

        this.currenciesData = await this.fetchCurrencies();

        this.lastUpdate = Utils.formatDateTime();
      } catch (error) {
        console.error('Error al actualizar datos:', error);
      }
    },

    /**
     * Fetch currencies from /v1/cotizaciones endpoint
     */
    async fetchCurrencies() {
      try {
        const response = await fetch('https://dolarapi.com/v1/cotizaciones');
        if (!response.ok) throw new Error('Failed to fetch currencies');
        const data = await response.json();

        // Add ARS (peso argentino) as base currency with value 1
        return [
          {
            moneda: 'ARS',
            nombre: 'Peso Argentino',
            compra: 1,
            venta: 1,
            fechaActualizacion: new Date().toISOString()
          },
          ...data
        ];
      } catch (error) {
        console.error('Error al buscar cotizaciones:', error);
        return [];
      }
    },


    /**
 * Alterna entre modo oscuro y claro
 */
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('dolarDash_dark', this.darkMode);
    },

    changeViewMode() {
      localStorage.setItem('viewMode', this.viewMode);
    },

    /**
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
      const numericValue = Utils.parseInputValue(cleanValue);

      // Update appropriate field based on context
      if (this.viewMode === 'arbitrage') {
        this.arbitrageAmount = numericValue;
      } else if (this.viewMode === 'currencies') {
        this.currenciesAmount = numericValue;
      } else {
        this.calcInput = numericValue;
      }

      // Formatear para visualización
      const finalDisplay = Utils.formatDisplayValue(cleanValue);

      // Actualizar DOM solo si cambió (evita saltos del cursor)
      if (el.value !== finalDisplay) {
        el.value = finalDisplay;
      }
    },

    /**
     * Update arbitrage amount specifically
     * @param {InputEvent} e - Input event
     */
    updateArbitrageAmount(e) {
      const el = e.target;
      const cleanValue = Utils.cleanInput(el.value);
      this.arbitrageAmount = Utils.parseInputValue(cleanValue);
      const finalDisplay = Utils.formatDisplayValue(cleanValue);
      if (el.value !== finalDisplay) {
        el.value = finalDisplay;
      }
    },

    /**
     * Update currencies amount specifically
     * @param {InputEvent} e - Input event
     */
    updateCurrenciesAmount(e) {
      const el = e.target;
      const cleanValue = Utils.cleanInput(el.value);
      this.currenciesAmount = Utils.parseInputValue(cleanValue);
      const finalDisplay = Utils.formatDisplayValue(cleanValue);
      if (el.value !== finalDisplay) {
        el.value = finalDisplay;
      }
    },

    /**
     * Copia el resultado al portapapeles
     * @param {string} id - ID del tipo de dólar
     * @param {string} name - Nombre del tipo de dólar
     */
    copyToClipboard(id, name) {
      const price = this.getPrice(id);
      const result = this.doCalculate(price);

      navigator.clipboard.writeText(result).then(() => {
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
     * @param {string} type - Dollar type (blue, mep, cripto, oficial)
     * @returns {number} Corresponding price
     */
    getPrice(type) {
      const d = this.datos[type];
      if (!d) return 0;

      if (this.calcMode === 'venta') return d.venta;
      if (this.calcMode === 'compra') return d.compra;

      // Modo promedio
      return Utils.promedio(d.venta, d.compra);
    },

    /**
     * Realiza el cálculo de conversión
     * @param {number} price - Dollar price
     * @returns {string} Formatted result
     */
    doCalculate(price) {
      if (!price) return '0,00';

      const res = this.calcCurrency === 'USD'
        ? this.calcInput * price
        : this.calcInput / price;

      return res.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    // ==========================================
    // Arbitrage Methods
    // ==========================================

    /**
     * Get all valid arbitrage combinations (12 total)
     */
    get arbitrageCombinations() {
      const types = ['mep', 'blue', 'cripto', 'oficial'];
      const combinations = [];

      for (let origin of types) {
        for (let destination of types) {
          if (origin !== destination) {
            combinations.push({
              id: `${origin}-${destination}`,
              origin,
              destination,
              originName: this.operationCosts[origin].name,
              originNameEs: this.operationCosts[origin].nameEs,
              destinationName: this.operationCosts[destination].name,
              destinationNameEs: this.operationCosts[destination].nameEs,
              requiresParking: this.hasParking(origin, destination)
            });
          }
        }
      }
      return combinations;
    },

    /**
     * Determine if operation requires parking
     */
    hasParking(origin, destination) {
      return this.operationCosts[origin].parking > 0 || this.operationCosts[destination].parking > 0;
    },

    /**
     * Calculate arbitrage for a specific combination
     */
    calculateArbitrage(origin, destination) {
      const originData = this.datos[origin];
      const destinationData = this.datos[destination];

      if (!originData || !destinationData) return null;

      const originCost = this.operationCosts[origin].commission;
      const destinationCost = this.operationCosts[destination].commission;
      const parking = this.operationCosts[origin].parking >= this.operationCosts[destination].parking
        ? this.operationCosts[origin].parking
        : this.operationCosts[destination].parking;

      // Step 1: Buy dollars at origin (using venta/sell price, broker sells to me)
      const netAmount = this.arbitrageAmount * (1 - originCost);
      const usdBought = netAmount / originData.venta;

      // Step 2: Sell dollars at destination (using compra/buy price, broker buys from me)
      const grossFinal = usdBought * destinationData.compra;
      const finalAmount = grossFinal * (1 - destinationCost);

      // Results
      const netProfit = finalAmount - this.arbitrageAmount;
      const profitability = (netProfit / this.arbitrageAmount) * 100;

      // Threshold (stricter if parking involved)
      const minThreshold = parking > 0 ? 1.5 : 0.8;

      return {
        operation: `${this.operationCosts[origin].nameEs} → ${this.operationCosts[destination].nameEs}`,
        operationEn: `${this.operationCosts[origin].name} → ${this.operationCosts[destination].name}`,
        initialAmount: this.arbitrageAmount,
        finalAmount: finalAmount,
        profit: netProfit,
        profitability: profitability,
        usdIntermediate: usdBought,
        parkingHours: parking,
        totalCommission: (originCost + destinationCost) * 100,
        isViable: profitability > minThreshold,
        risk: this.calculateRisk(origin, destination, parking),
        recommendation: this.generateRecommendation(profitability, parking)
      };
    },

    /**
     * Calculate risk level
     */
    calculateRisk(origin, destination, parking) {
      let level = 'bajo';
      if (parking > 0) level = 'medio';
      if (origin === 'cripto' || destination === 'cripto') level = 'alto';
      if (origin === 'blue' && destination === 'mep') level = 'medio';
      return level;
    },

    /**
     * Generate recommendation text
     */
    generateRecommendation(profitability, parking) {
      if (profitability < 0.5) return '❌ No viable';
      if (profitability < 1.0) return '⚠️ Marginal';
      if (profitability < 2.0 && parking > 0) return '⏳ Evaluar risesgo de parking';
      if (profitability >= 2.0) return '✅ Viable';
      return '🤔 Neutral';
    },

    /**
     * Get all arbitrage results sorted by profitability
     */
    get arbitrageResults() {
      return this.arbitrageCombinations.map(combo => ({
        ...combo,
        result: this.calculateArbitrage(combo.origin, combo.destination)
      })).filter(item => item.result !== null)
        .sort((a, b) => b.result.profitability - a.result.profitability);
    },

    /**
     * Get best viable arbitrage opportunity
     */
    get bestArbitrage() {
      const viable = this.arbitrageResults.filter(r => r.result.isViable);
      return viable.length > 0 ? viable[0] : null;
    },

    // ==========================================
    // Currencies Methods
    // ==========================================

    /**
     * Get selected currency data
     */
    get selectedCurrencyData() {
      return this.currenciesData.find(c => c.moneda === this.selectedCurrency) || null;
    },

    /**
     * Get all currencies except the selected one for display
     */
    get otherCurrencies() {
      if (!this.selectedCurrencyData) return [];

      return this.currenciesData
        .filter(c => c.moneda !== this.selectedCurrency)
        .map(currency => {
          const conversion = this.convertCurrency(currency);
          return {
            ...currency,
            convertedValue: conversion.value,
            rate: conversion.rate,
            isHigher: conversion.rate > 1
          };
        });
    },

    /**
     * Convert from selected currency to target currency
     * Both values are in ARS (pesos), so we divide
     */
    convertCurrency(targetCurrency) {
      const source = this.selectedCurrencyData;
      if (!source || !targetCurrency) return { value: 0, rate: 0 };

      // Convert: amount * (source rate in ARS) / (target rate in ARS)
      // Using venta price for calculation
      const sourceRate = source.venta;
      const targetRate = targetCurrency.venta;

      if (targetRate === 0) return { value: 0, rate: 0 };

      const convertedValue = this.currenciesAmount * (sourceRate / targetRate);
      const rate = sourceRate / targetRate;

      return {
        value: convertedValue,
        rate: rate
      };
    },

    /**
     * Get currency flag emoji based on currency code
     */
    getCurrencyFlag(currencyCode) {
      const flags = {
        'ARS': '🇦🇷',
        'USD': '🇺🇸',
        'EUR': '🇪🇺',
        'BRL': '🇧🇷',
        'CLP': '🇨🇱',
        'UYU': '🇺🇾',
        'COP': '🇨🇴',
        'MXN': '🇲🇽',
        'PEN': '🇵🇪',
        'GBP': '🇬🇧',
        'CHF': '🇨🇭'
      };
      return flags[currencyCode] || '🌐';
    },

    // ==========================================
    // Formatting (Utils wrappers)
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