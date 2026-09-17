
import { nuevoCliente } from './API.js';
import { mostrarAlerta, protegerPagina, pintarBarraSesion } from './funciones.js';

(function () {

    if (!protegerPagina()) return;

    pintarBarraSesion();

    const formulario = document.querySelector('#formulario');
    formulario.addEventListener('submit', validarCliente);

    async function validarCliente(e) {
        e.preventDefault();

        const idemp = document.querySelector('#idemp').value.trim();
        const usuario = document.querySelector('#usuario').value.trim();
        const clave = document.querySelector('#password').value.trim();
        const estado = document.querySelector('input[name="estado"]:checked').value;

        if (idemp === '' || usuario === '' || clave === '') {
            mostrarAlerta('Todos los campos son obligatorios');
            return;
        }

        const respuesta = await nuevoCliente({
            idemp: parseInt(idemp),
            usuario,
            clave,
            estado: parseInt(estado)
        });

        if (respuesta && respuesta.exito) {
            window.location.href = 'index.html';
        } else {
            mostrarAlerta(respuesta?.mensaje || 'No fue posible registrar el usuario');
        }
    }

})();
