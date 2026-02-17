/**
 * ============================================
 * DolarCalc Pro - Utilidades
 * ============================================
 */

const Utils = {
  /**
   * Formatea un valor numérico como moneda argentina
   * @param {number} val - Valor a formatear
   * @returns {string} Valor formateado con símbolo $
   */
  formatCurrency(val) {
    if (val === null || val === undefined || val === '') return '--';
    return `$${val.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  },

  /**
   * Formatea número para el input (sin símbolo de moneda)
   * @param {number} val - Valor a formatear
   * @returns {string} Valor formateado localmente
   */
  formatInput(val) {
    if (val === null || val === undefined || val === '') return '';
    return val.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  },

  /**
   * Parsea un string de input a número
   * Maneja formato argentino (coma como decimal)
   * @param {string} value - Valor del input
   * @returns {number} Valor numérico
   */
  parseInputValue(value) {
    if (!value || value === ',' || value === '.') return 0;
    const numericString = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(numericString) || 0;
  },

  /**
   * Formatea valor para mostrar en input manteniendo formato argentino
   * @param {string} cleanValue - Valor limpio (solo números y coma)
   * @returns {string} Valor formateado con separadores de miles
   */
  formatDisplayValue(cleanValue) {
    const parts = cleanValue.split(',');

    // Formatear parte entera con puntos de miles
    let formattedInteger = parts[0];
    if (formattedInteger.length > 0) {
      const num = parseInt(formattedInteger.replace(/\./g, ''), 10);
      if (!isNaN(num)) {
        formattedInteger = num.toLocaleString('es-AR');
      }
    }

    // Re-ensamblar con decimales
    let result = formattedInteger;
    if (parts.length > 1) {
      result += ',' + parts[1].slice(0, 2); // Máximo 2 decimales
    }

    return result;
  },

  /**
   * Limpia el valor del input permitiendo solo números y una coma
   * @param {string} value - Valor original
   * @returns {string} Valor limpio
   */
  cleanInput(value) {
    // Solo números y UNA coma
    let clean = value.replace(/[^0-9,]/g, '');
    const parts = clean.split(',');
    if (parts.length > 2) {
      clean = parts[0] + ',' + parts.slice(1).join('');
    }
    return clean;
  },

  /**
   * Calcula el promedio entre dos valores
   * @param {number} a - Primer valor
   * @param {number} b - Segundo valor
   * @returns {number} Promedio
   */
  promedio(a, b) {
    return (a + b) / 2;
  },

  /**
   * Formatea fecha/hora para el footer
   * Usa Intl.DateTimeFormat para formato localizado
   * @param {Date} date - Objeto Date
   * @returns {string} Fecha formateada (DD/MM HH:MM:SS)
   */
  formatDateTime(date = new Date()) {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  }
};