
import { obtenerCliente, editarCliente } from './API.js';
import { mostrarAlerta, protegerPagina, pintarBarraSesion } from './funciones.js';

(function () {

    if (!protegerPagina()) return;

    pintarBarraSesion();

    const radios = document.querySelectorAll('input[name="estado"]');
    const usuarioInput = document.querySelector('#usuario');
    const passwordInput = document.querySelector('#password');
    const idInput = document.querySelector('#id');

    document.addEventListener('DOMContentLoaded', async () => {
        const parametrosURL = new URLSearchParams(window.location.search);
        const idCliente = parseInt(parametrosURL.get('id'));

        const cliente = await obtenerCliente(idCliente);
        if (!cliente || cliente.exito === false) {
            mostrarAlerta('Usuario no encontrado');
            return;
        }
        mostrarCliente(cliente);

        const formulario = document.querySelector('#formulario');
        formulario.addEventListener('submit', validarCliente);
    });

    function mostrarCliente(cliente) {
        const { idemp, usuario, estado } = cliente;

        radios.forEach(radio => {
            if (parseInt(radio.value) === parseInt(estado)) radio.checked = true;
        });

        usuarioInput.value = usuario;
        idInput.value = idemp;
        passwordInput.value = '';  
    }

    async function validarCliente(e) {
        e.preventDefault();

        const estadoInput = document.querySelector('input[name="estado"]:checked').value;

        if (usuarioInput.value.trim() === '') {
            mostrarAlerta('El usuario es obligatorio');
            return;
        }

        const cliente = {
            idemp: parseInt(idInput.value),
            usuario: usuarioInput.value.trim(),
            estado: parseInt(estadoInput)
        };

       
        if (passwordInput.value.trim() !== '') {
            cliente.clave = passwordInput.value.trim();
        }

        const respuesta = await editarCliente(cliente);

        if (respuesta && respuesta.exito) {
            window.location.href = 'index.html';
        } else {
            mostrarAlerta(respuesta?.mensaje || 'No fue posible actualizar');
        }
    }

})();
