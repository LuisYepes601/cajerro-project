const accountRepository = require('../repositories/accountRepository');

class AtmService {
  autenticar(numeroCuenta, pin) {
    const cuenta = accountRepository.obtenerPorCuenta(numeroCuenta);
    if (!cuenta) {
      return { exito: false, mensaje: 'La cuenta no existe.' };
    }
    if (cuenta.pin !== pin) {
      return { exito: false, mensaje: 'PIN incorrecto.' };
    }
    return {
      exito: true,
      mensaje: `Bienvenido(a) ${cuenta.titular}`,
      titular: cuenta.titular,
      saldo: cuenta.saldo, // <--- ¡AQUÍ ESTABA EL FALLO! Ahora envía el saldo en el login
      numeroCuenta: numeroCuenta
    };
  }

  obtenerSaldo(numeroCuenta) {
    const cuenta = accountRepository.obtenerPorCuenta(numeroCuenta);
    if (!cuenta) return { exito: false, mensaje: 'Cuenta no encontrada.' };
    return { exito: true, saldo: cuenta.saldo };
  }

  retirar(numeroCuenta, monto) {
    const cuenta = accountRepository.obtenerPorCuenta(numeroCuenta);
    if (!cuenta) return { exito: false, mensaje: 'Cuenta no encontrada.' };

    const cantidad = parseFloat(monto);
    if (isNaN(cantidad) || cantidad <= 0) {
      return { exito: false, mensaje: 'Monto a retirar inválido.' };
    }
    if (cantidad > cuenta.saldo) {
      return { exito: false, mensaje: 'Saldo insuficiente en la cuenta.' };
    }

    const nuevoSaldo = cuenta.saldo - cantidad;
    accountRepository.actualizarSaldo(numeroCuenta, nuevoSaldo);
    
    return { 
      exito: true, 
      mensaje: `Retiro exitoso de $${cantidad.toLocaleString()}`, 
      saldo: nuevoSaldo // Se devuelve como 'saldo' para que coincida con el frontend
    };
  }

  depositar(numeroCuenta, monto) {
    const cuenta = accountRepository.obtenerPorCuenta(numeroCuenta);
    if (!cuenta) return { exito: false, mensaje: 'Cuenta no encontrada.' };

    const cantidad = parseFloat(monto);
    if (isNaN(cantidad) || cantidad <= 0) {
      return { exito: false, mensaje: 'Monto a depositar inválido.' };
    }

    const nuevoSaldo = cuenta.saldo + cantidad;
    accountRepository.actualizarSaldo(numeroCuenta, nuevoSaldo);
    
    return { 
      exito: true, 
      mensaje: `Depósito exitoso de $${cantidad.toLocaleString()}`, 
      saldo: nuevoSaldo // Se devuelve como 'saldo' para que coincida con el frontend
    };
  }
}

module.exports = new AtmService();