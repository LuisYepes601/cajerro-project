const accountRepository = require('../repositories/accountRepository');

class AtmService {
  // MÉTODO NUEVO: Validar y registrar la cuenta
  async registrar(numeroCuenta, pin, titular, saldoInicial = 0) {
    if (!numeroCuenta || !pin || !titular) {
      return { exito: false, mensaje: 'Todos los campos son obligatorios.' };
    }
    if (String(pin).trim().length < 4) {
      return { exito: false, mensaje: 'El PIN de seguridad debe tener al menos 4 dígitos.' };
    }
    const saldo = parseFloat(saldoInicial) || 0;
    if (saldo < 0) {
      return { exito: false, mensaje: 'El saldo inicial no puede ser negativo.' };
    }

    return await accountRepository.crearCuenta(numeroCuenta, pin, titular, saldo);
  }

  async autenticar(numeroCuenta, pin) {
    const cuenta = await accountRepository.obtenerPorCuenta(numeroCuenta);
    if (!cuenta) {
      return { exito: false, mensaje: 'La cuenta no existe.' };
    }
    if (String(cuenta.pin) !== String(pin)) {
      return { exito: false, mensaje: 'PIN incorrecto.' };
    }
    return {
      exito: true,
      mensaje: `Bienvenido(a) ${cuenta.titular}`,
      titular: cuenta.titular,
      saldo: cuenta.saldo,
      numeroCuenta: numeroCuenta
    };
  }

  async obtenerSaldo(numeroCuenta) {
    const cuenta = await accountRepository.obtenerPorCuenta(numeroCuenta);
    if (!cuenta) return { exito: false, mensaje: 'Cuenta no encontrada.' };
    return { exito: true, saldo: cuenta.saldo };
  }

  async retirar(numeroCuenta, monto) {
    const cuenta = await accountRepository.obtenerPorCuenta(numeroCuenta);
    if (!cuenta) return { exito: false, mensaje: 'Cuenta no encontrada.' };

    const cantidad = parseFloat(monto);
    if (isNaN(cantidad) || cantidad <= 0) {
      return { exito: false, mensaje: 'Monto a retirar inválido.' };
    }
    if (cantidad > cuenta.saldo) {
      return { exito: false, mensaje: 'Saldo insuficiente en la cuenta.' };
    }

    const nuevoSaldo = cuenta.saldo - cantidad;
    const ok = await accountRepository.actualizarSaldo(numeroCuenta, nuevoSaldo);
    if (!ok) return { exito: false, mensaje: 'Error al actualizar el saldo en la base de datos.' };

    return { 
      exito: true, 
      mensaje: `Retiro exitoso de $${cantidad.toLocaleString('es-CO')}`, 
      saldo: nuevoSaldo 
    };
  }

  async depositar(numeroCuenta, monto) {
    const cuenta = await accountRepository.obtenerPorCuenta(numeroCuenta);
    if (!cuenta) return { exito: false, mensaje: 'Cuenta no encontrada.' };

    const cantidad = parseFloat(monto);
    if (isNaN(cantidad) || cantidad <= 0) {
      return { exito: false, mensaje: 'Monto a depositar inválido.' };
    }

    const nuevoSaldo = cuenta.saldo + cantidad;
    const ok = await accountRepository.actualizarSaldo(numeroCuenta, nuevoSaldo);
    if (!ok) return { exito: false, mensaje: 'Error al actualizar el saldo en la base de datos.' };

    return { 
      exito: true, 
      mensaje: `Depósito exitoso de $${cantidad.toLocaleString('es-CO')}`, 
      saldo: nuevoSaldo 
    };
  }
}

module.exports = new AtmService();