/**
 * ============================================
 * DolarCalc Pro - Servicio de API
 * ============================================
 */

const DolarApiService = {
  // URLs base de la API
  BASE_URL: 'https://dolarapi.com/v1',

  /**
   * Obtiene todas las cotizaciones de dólares
   * @returns {Promise<Object>} Objeto con todas las cotizaciones
   */
  async fetchDolares() {
    const response = await fetch(`${this.BASE_URL}/dolares`);
    if (!response.ok) throw new Error('Error al obtener cotizaciones');
    return response.json();
  },

  /**
   * Obtiene cotización específica del dólar cripto
   * @returns {Promise<Object>} Datos del dólar cripto
   */
  async fetchDolarCripto() {
    const response = await fetch(`${this.BASE_URL}/dolares/cripto`);
    if (!response.ok) throw new Error('Error al obtener dólar cripto');
    return response.json();
  },

  /**
   * Obtiene todas las cotizaciones necesarias para la app
   * Transforma los datos al formato interno de la aplicación
   * @returns {Promise<Object>} Datos formateados
   */
  async fetchAllCotizaciones() {
    const [dolares, cripto] = await Promise.all([
      this.fetchDolares(),
      this.fetchDolarCripto()
    ]);

    const datos = {};

    // Procesar cotizaciones estándar
    dolares.forEach(item => {
      // 'bolsa' se mapea a 'mep' para consistencia interna
      const key = item.casa === 'bolsa' ? 'mep' : item.casa;
      datos[key] = {
        casa: key,
        nombre: item.nombre,
        compra: item.compra,
        venta: item.venta,
        fechaActualizacion: item.fechaActualizacion
      };
    });

    // Agregar dólar cripto
    datos['cripto'] = {
      casa: 'cripto',
      nombre: 'Dólar Cripto',
      compra: cripto.compra,
      venta: cripto.venta,
      fechaActualizacion: cripto.fechaActualizacion
    };

    return datos;
  }
};