const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/accounts.json');

class AccountRepository {
  obtenerCuentas() {
    try {
      if (!fs.existsSync(dataPath)) {
        console.error("El archivo accounts.json no existe en:", dataPath);
        return {};
      }
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error("Error leyendo accounts.json:", error);
      return {};
    }
  }

  obtenerPorCuenta(numeroCuenta) {
    const cuentas = this.obtenerCuentas();
    if (Array.isArray(cuentas)) {
      return cuentas.find(c => String(c.numeroCuenta) === String(numeroCuenta)) || null;
    }
    return cuentas[numeroCuenta] || null;
  }

  // MÉTODO CLAVE: Lee accounts.json y lo convierte en Array
  obtenerTodas() {
    const cuentas = this.obtenerCuentas();
    if (Array.isArray(cuentas)) {
      return cuentas;
    }
    return Object.entries(cuentas).map(([numeroCuenta, datos]) => ({
      numeroCuenta,
      ...datos
    }));
  }

  actualizarSaldo(numeroCuenta, nuevoSaldo) {
    const cuentas = this.obtenerCuentas();
    const saldoNum = Number(nuevoSaldo);

    if (Array.isArray(cuentas)) {
      const idx = cuentas.findIndex(c => String(c.numeroCuenta) === String(numeroCuenta));
      if (idx !== -1) {
        cuentas[idx].saldo = saldoNum;
        fs.writeFileSync(dataPath, JSON.stringify(cuentas, null, 2));
        return true;
      }
    } else if (cuentas[numeroCuenta]) {
      cuentas[numeroCuenta].saldo = saldoNum;
      fs.writeFileSync(dataPath, JSON.stringify(cuentas, null, 2));
      return true;
    }
    return false;
  }
}

module.exports = new AccountRepository();