
import { obtenerClientes, eliminarCliente } from './API.js';
import { protegerPagina, pintarBarraSesion } from './funciones.js';

(function () {


    if (!protegerPagina()) return;

    pintarBarraSesion();

    const listado = document.querySelector('#listado-clientes');
    listado.addEventListener('click', confirmarEliminar);
    document.addEventListener('DOMContentLoaded', mostrarClientes);

    async function mostrarClientes() {
        
        const respuesta = await obtenerClientes();
        if (!respuesta || !respuesta.exito) return;

        respuesta.usuarios.forEach(cliente => {
            const { idemp, usuario, estado } = cliente;
            const row = document.createElement('tr');

            row.innerHTML += `
                <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                    <p class="text-sm leading-5 font-medium text-gray-700 text-lg font-bold"> ${idemp} </p>
                </td>
                <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                    <p class="text-sm leading-10 text-gray-700"> ${usuario} </p>
                </td>
                <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200 leading-5 text-gray-700">
                    <p class="text-gray-600">${estado == 1 ? 'Activo' : 'Inactivo'}</p>
                </td>
                <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200 text-sm leading-5">
                    <a href="editar-cliente.html?id=${idemp}" class="text-teal-600 hover:text-teal-900 mr-5">Editar</a>
                    <a href="#" data-cliente="${idemp}" class="text-red-600 hover:text-red-900 eliminar">Eliminar</a>
                </td>
            `;

            listado.appendChild(row);
        });
    }

    async function confirmarEliminar(e) {
        if (e.target.classList.contains('eliminar')) {
            e.preventDefault();
            const clienteId = parseInt(e.target.dataset.cliente);

            if (confirm('¿Deseas eliminar este usuario?')) {
                const respuesta = await eliminarCliente(clienteId);
                if (respuesta && !respuesta.exito) {
                    alert(respuesta.mensaje);
                    return;
                }
                window.location.reload();
            }
        }
    }

})();
