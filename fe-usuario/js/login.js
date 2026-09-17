

import { login } from './API.js';
import { mostrarAlerta, guardarSesion, autenticado } from './funciones.js';

(function () {

    
    if (autenticado()) {
        window.location.href = 'index.html';
        return;
    }

    const formulario = document.querySelector('#formulario');
    formulario.addEventListener('submit', autenticar);

    async function autenticar(e) {
        e.preventDefault();

        const usuario = document.querySelector('#usuario').value.trim();
        const password = document.querySelector('#password').value.trim();

        if (usuario === '' || password === '') {
            mostrarAlerta('Todos los campos son obligatorios');
            return;
        }

        const boton = document.querySelector('#login-btn');
        boton.disabled = true;
        boton.value = 'Validando...';

        
        const respuesta = await login({ usuario, password });

        boton.disabled = false;
        boton.value = 'Autenticarse';

        if (respuesta && respuesta.exito && respuesta.token) {
            guardarSesion(respuesta.token, respuesta.usuario);
            window.location.href = 'index.html';
        } else {
            mostrarAlerta(respuesta?.mensaje || 'No fue posible iniciar sesión');
        }
    }

})();
