const accountRepository = require('../repositories/accountRepository');

class AtmService {
  async registrar(correo, pin, titular, saldoInicial = 0) {
    if (!correo || !pin || !titular) {
      return { exito: false, mensaje: 'Todos los campos son obligatorios.' };
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(correo)) {
      return { exito: false, mensaje: 'Ingresa un correo electrónico válido.' };
    }

    if (String(pin).trim().length < 4) {
      return { exito: false, mensaje: 'El PIN debe tener al menos 4 dígitos.' };
    }

    // Genera automáticamente un número de cuenta de 10 dígitos
    const numeroCuenta = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    return await accountRepository.crearCuenta(numeroCuenta, correo, pin, titular, saldoInicial);
  }

  async autenticar(correo, pin) {
    const cuenta = await accountRepository.obtenerPorCorreo(correo);
    if (!cuenta) {
      return { exito: false, mensaje: 'El correo no se encuentra registrado.' };
    }
    if (String(cuenta.pin) !== String(pin)) {
      return { exito: false, mensaje: 'PIN incorrecto.' };
    }
    return {
      exito: true,
      mensaje: `Bienvenido(a) ${cuenta.titular}`,
      titular: cuenta.titular,
      saldo: cuenta.saldo,
      numeroCuenta: cuenta.numeroCuenta,
      correo: cuenta.correo
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
    if (isNaN(cantidad) || cantidad <= 0) return { exito: false, mensaje: 'Monto inválido.' };
    if (cantidad > cuenta.saldo) return { exito: false, mensaje: 'Saldo insuficiente.' };

    const nuevoSaldo = cuenta.saldo - cantidad;
    const ok = await accountRepository.actualizarSaldo(numeroCuenta, nuevoSaldo);
    if (!ok) return { exito: false, mensaje: 'Error al actualizar el saldo.' };

    return { exito: true, mensaje: `Retiro exitoso de $${cantidad.toLocaleString('es-CO')}`, saldo: nuevoSaldo };
  }

  async depositar(numeroCuenta, monto) {
    const cuenta = await accountRepository.obtenerPorCuenta(numeroCuenta);
    if (!cuenta) return { exito: false, mensaje: 'Cuenta no encontrada.' };

    const cantidad = parseFloat(monto);
    if (isNaN(cantidad) || cantidad <= 0) return { exito: false, mensaje: 'Monto inválido.' };

    const nuevoSaldo = cuenta.saldo + cantidad;
    const ok = await accountRepository.actualizarSaldo(numeroCuenta, nuevoSaldo);
    if (!ok) return { exito: false, mensaje: 'Error al actualizar el saldo.' };

    return { exito: true, mensaje: `Depósito exitoso de $${cantidad.toLocaleString('es-CO')}`, saldo: nuevoSaldo };
  }
}

module.exports = new AtmService();