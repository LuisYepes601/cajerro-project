const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class AccountRepository {
  async obtenerPorCuenta(numeroCuenta) {
    try {
      const res = await pool.query('SELECT * FROM cuentas WHERE numero_cuenta = $1', [String(numeroCuenta)]);
      if (res.rows.length === 0) return null;
      const data = res.rows[0];
      return {
        numeroCuenta: data.numero_cuenta,
        pin: data.pin,
        titular: data.titular,
        saldo: Number(data.saldo)
      };
    } catch (error) {
      console.error("Error en obtenerPorCuenta:", error);
      return null;
    }
  }

  async obtenerTodas() {
    try {
      const res = await pool.query('SELECT * FROM cuentas ORDER BY numero_cuenta ASC');
      return res.rows.map(data => ({
        numeroCuenta: data.numero_cuenta,
        pin: data.pin,
        titular: data.titular,
        saldo: Number(data.saldo)
      }));
    } catch (error) {
      console.error("Error en obtenerTodas:", error);
      return [];
    }
  }

  // MÉTODO NUEVO: Registrar una cuenta en PostgreSQL / Supabase
  async crearCuenta(numeroCuenta, pin, titular, saldoInicial = 0) {
    try {
      const res = await pool.query(
        'INSERT INTO cuentas (numero_cuenta, pin, titular, saldo) VALUES ($1, $2, $3, $4) RETURNING *',
        [String(numeroCuenta), String(pin), String(titular), Number(saldoInicial)]
      );
      return { exito: true, cuenta: res.rows[0] };
    } catch (error) {
      console.error("Error en crearCuenta:", error);
      if (error.code === '23505') { // Violación de clave primaria (cuenta duplicada)
        return { exito: false, mensaje: 'El número de cuenta ya se encuentra registrado.' };
      }
      return { exito: false, mensaje: 'Error al registrar la cuenta en la base de datos.' };
    }
  }

  async actualizarSaldo(numeroCuenta, nuevoSaldo) {
    try {
      const res = await pool.query(
        'UPDATE cuentas SET saldo = $1 WHERE numero_cuenta = $2',
        [Number(nuevoSaldo), String(numeroCuenta)]
      );
      return res.rowCount > 0;
    } catch (error) {
      console.error("Error en actualizarSaldo:", error);
      return false;
    }
  }
}

module.exports = new AccountRepository();