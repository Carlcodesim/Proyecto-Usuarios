let personas = [];
const API_URL = "https://proyecto-usuarios-62v9.onrender.com/api/personas";

let indiceEdicion = null;
let ordenCampo = null;
let ordenDireccion = 1;

let paginaActual = 1;
const registrosPorPagina = 5;
let idParaEliminar = null;

const form = document.getElementById("formPersona");
const formTitle = document.getElementById("form-title");
const inputNombre = document.getElementById("nombre");
const inputEdad = document.getElementById("edad");
const errorNombre = document.getElementById("errorNombre");
const errorEdad = document.getElementById("errorEdad");
const btnAgregar = document.getElementById("btnAgregar");
const btnCancelar = document.getElementById("btnCancelar");
const statusImport = document.getElementById("statusImport");

const btnThemeToggle = document.getElementById("btnThemeToggle");
const themeIcon = document.getElementById("themeIcon");

const modalEliminar = document.getElementById("modalEliminar");
const modalTexto = document.getElementById("modalTexto");
const btnConfirmarModal = document.getElementById("btnConfirmarModal");
const btnCancelarModal = document.getElementById("btnCancelarModal");

const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");

// --- TEMA (DARK / LIGHT MODE) ---
inicializarTema();

btnThemeToggle.addEventListener("click", () => {
    const temaActual = document.documentElement.getAttribute("data-theme");
    const nuevoTema = temaActual === "dark" ? "light" : "dark";
    aplicarTema(nuevoTema);
});

function inicializarTema() {
    const temaGuardado = localStorage.getItem("tema");
    if (temaGuardado) {
        aplicarTema(temaGuardado);
    } else {
        const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
        aplicarTema(prefiereOscuro ? "dark" : "light");
    }
}

function aplicarTema(tema) {
    if (tema === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        themeIcon.textContent = "☀️";
    } else {
        document.documentElement.removeAttribute("data-theme");
        themeIcon.textContent = "🌙";
    }
    localStorage.setItem("tema", tema);
}

// --- EVENTOS ---
form.addEventListener("submit", (e) => {
    e.preventDefault();
    guardarPersona();
});

btnCancelar.addEventListener("click", cancelarEdicion);

document.getElementById("buscar").addEventListener("input", () => {
    paginaActual = 1;
    renderTabla();
});

document.querySelectorAll("th[data-sort]").forEach((th) => {
    const campo = th.dataset.sort;

    th.addEventListener("click", () => aplicarOrden(campo));
    th.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            aplicarOrden(campo);
        }
    });
});

document.getElementById("btnExportarJSON").addEventListener("click", exportarJSON);
document.getElementById("btnExportarCSV").addEventListener("click", exportarCSV);
document.getElementById("inputImportar").addEventListener("change", importarJSON);

btnPrev.addEventListener("click", () => {
    if (paginaActual > 1) {
        paginaActual--;
        renderTabla();
    }
});

btnNext.addEventListener("click", () => {
    paginaActual++;
    renderTabla();
});

btnCancelarModal.addEventListener("click", () => modalEliminar.close());

btnConfirmarModal.addEventListener("click", async () => {
    if (idParaEliminar !== null) {
        try {
            const res = await fetch(`${API_URL}/${idParaEliminar}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Error al eliminar");

            if (indiceEdicion === idParaEliminar) cancelarEdicion();
            idParaEliminar = null;
            modalEliminar.close();
            cargarPersonas();
        } catch (err) {
            alert("No se pudo eliminar el registro del servidor.");
            console.error(err);
            modalEliminar.close();
        }
    }
});

// --- FUNCIONES Y CONEXIÓN A LA API ---
async function cargarPersonas() {
    const tbody = document.querySelector("#tablaPersonas tbody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">⏳ Conectando con el servidor...</td></tr>`;
    }

    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error al obtener personas");
        
        personas = await res.json();
        renderTabla();
    } catch (err) {
        console.error("Error al conectar con la API:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">❌ Error al cargar los datos</td></tr>`;
        }
        personas = [];
    }
}

function limpiarErrores() {
    errorNombre.textContent = "";
    errorEdad.textContent = "";
    inputNombre.classList.remove("field--invalid");
    inputEdad.classList.remove("field--invalid");
}

function marcarError(input, spanError, mensaje) {
    input.classList.add("field--invalid");
    spanError.textContent = mensaje;
}

function validarFormulario(nombre, edadTexto) {
    let esValido = true;

    if (!nombre) {
        marcarError(inputNombre, errorNombre, "Ingresá un nombre.");
        esValido = false;
    }

    if (!edadTexto) {
        marcarError(inputEdad, errorEdad, "Ingresá una edad.");
        esValido = false;
    } else if (!edadTexto.match(/^\d+$/)) {
        marcarError(inputEdad, errorEdad, "La edad debe ser un número entero.");
        esValido = false;
    } else {
        const edad = Number(edadTexto);
        if (edad <= 0 || edad > 119) {
            marcarError(inputEdad, errorEdad, "La edad debe ser mayor a 0 y menor a 120.");
            esValido = false;
        }
    }

    return esValido;
}

async function guardarPersona() {
    limpiarErrores();

    const nombre = inputNombre.value.trim();
    const edadTexto = inputEdad.value.trim();

    if (!validarFormulario(nombre, edadTexto)) {
        return;
    }

    const datos = {
        nombre: nombre,
        edad: Number(edadTexto)
    };

    const esEdicion = indiceEdicion !== null;
    const url = esEdicion ? `${API_URL}/${indiceEdicion}` : API_URL;
    const metodo = esEdicion ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        if (!res.ok) {
            const errorData = await res.json();
            alert("Error: " + (errorData.detalles?.join(", ") || errorData.error));
            return;
        }

        cancelarEdicion();
        cargarPersonas();
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("No se pudo conectar con el servidor.");
    }
}

function cancelarEdicion() {
    indiceEdicion = null;
    limpiarErrores();
    form.reset();
    formTitle.textContent = "Agregar persona";
    btnAgregar.textContent = "Agregar";
    btnCancelar.hidden = true;
}

function eliminarPersona(id) {
    const persona = personas.find(p => p.id === id);
    if (!persona) return;

    idParaEliminar = id;
    modalTexto.textContent = `¿Estás seguro de que deseas eliminar a "${persona.nombre}"?`;
    modalEliminar.showModal();
}

function editarPersona(id) {
    const persona = personas.find(p => p.id === id);
    if (!persona) return;

    limpiarErrores();
    inputNombre.value = persona.nombre;
    inputEdad.value = persona.edad;

    indiceEdicion = id;

    formTitle.textContent = "Editar persona";
    btnAgregar.textContent = "Guardar";
    btnCancelar.hidden = false;
    inputNombre.focus();
}

function aplicarOrden(campo) {
    if (ordenCampo === campo) {
        ordenDireccion *= -1;
    } else {
        ordenCampo = campo;
        ordenDireccion = 1;
    }

    renderTabla();
}

function actualizarFlechasOrden() {
    document.querySelectorAll(".sort-arrow").forEach((span) => {
        const campo = span.dataset.arrow;

        if (campo === ordenCampo) {
            span.textContent = ordenDireccion === 1 ? "↑" : "↓";
        } else {
            span.textContent = "";
        }
    });
}

function renderTabla() {
    const tbody = document.querySelector("#tablaPersonas tbody");
    const emptyState = document.getElementById("emptyState");

    const filtro = document.getElementById("buscar").value.toLowerCase();

    let personasFiltradas = personas.filter(persona =>
        persona.nombre.toLowerCase().includes(filtro)
    );

    if (ordenCampo) {
        personasFiltradas = personasFiltradas.slice().sort((a, b) => {
            if (ordenCampo === "edad") {
                return (Number(a.edad) - Number(b.edad)) * ordenDireccion;
            }
            return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }) * ordenDireccion;
        });
    }

    const totalPaginas = Math.ceil(personasFiltradas.length / registrosPorPagina) || 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * registrosPorPagina;
    const paginados = personasFiltradas.slice(inicio, inicio + registrosPorPagina);

    tbody.innerHTML = "";
    const fragmento = document.createDocumentFragment();

    paginados.forEach((persona) => {
        const fila = document.createElement("tr");

        const tdNombre = document.createElement("td");
        tdNombre.textContent = persona.nombre;

        const tdEdad = document.createElement("td");
        tdEdad.textContent = persona.edad;

        const tdAcciones = document.createElement("td");
        tdAcciones.className = "td-acciones";

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "btn btn--ghost";
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", () => editarPersona(persona.id));

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "btn btn--ghost";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", () => eliminarPersona(persona.id));

        tdAcciones.appendChild(btnEditar);
        tdAcciones.appendChild(btnEliminar);

        fila.appendChild(tdNombre);
        fila.appendChild(tdEdad);
        fila.appendChild(tdAcciones);

        fragmento.appendChild(fila);
    });

    tbody.appendChild(fragmento);

    emptyState.hidden = personasFiltradas.length !== 0;

    document.getElementById("totalPersonas").textContent = personasFiltradas.length;
    document.getElementById("pageInfo").textContent = `Página ${paginaActual} de ${totalPaginas}`;
    btnPrev.disabled = paginaActual === 1;
    btnNext.disabled = paginaActual === totalPaginas;

    actualizarEstadisticas(personasFiltradas);
    actualizarFlechasOrden();
}

function descargarArchivo(nombreArchivo, contenido, tipoMime) {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
}

function exportarJSON() {
    const contenido = JSON.stringify(personas, null, 2);
    descargarArchivo("personas.json", contenido, "application/json");
}

function escaparCampoCSV(valor) {
    const texto = String(valor);

    if (texto.includes(",") || texto.includes('"') || texto.includes("\n")) {
        return `"${texto.replace(/"/g, '""')}"`;
    }

    return texto;
}

function exportarCSV() {
    const encabezado = "Nombre,Edad";

    const filas = personas.map(
        p => `${escaparCampoCSV(p.nombre)},${escaparCampoCSV(p.edad)}`
    );

    const contenido = [encabezado, ...filas].join("\n");

    descargarArchivo("personas.csv", contenido, "text/csv");
}

function mostrarEstadoImport(mensaje, esError = false) {
    statusImport.textContent = mensaje;
    statusImport.classList.toggle("status--error", esError);
}

function importarJSON(evento) {
    const archivo = evento.target.files[0];

    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = () => {
        let datos;

        try {
            datos = JSON.parse(lector.result);
        } catch {
            mostrarEstadoImport("El archivo no contiene JSON válido.", true);
            evento.target.value = "";
            return;
        }

        if (!Array.isArray(datos)) {
            mostrarEstadoImport("El JSON debe ser una lista de personas.", true);
            evento.target.value = "";
            return;
        }

        let agregadas = 0;
        let omitidas = 0;

        datos.forEach(async (item) => {
            const nombre = typeof item?.nombre === "string" ? item.nombre.trim() : "";
            const edad = Number(item?.edad);

            const esValido = nombre && Number.isInteger(edad) && edad > 0 && edad <= 119;

            if (!esValido) {
                omitidas++;
                return;
            }

            try {
                await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre, edad })
                });
                agregadas++;
            } catch (err) {
                omitidas++;
            }
        });

        cargarPersonas();

        if (omitidas === 0) {
            mostrarEstadoImport(`Se importaron ${agregadas} persona(s).`);
        } else {
            mostrarEstadoImport(
                `Se completó la importación. Revisa la tabla actualizada.`,
                false
            );
        }

        evento.target.value = "";
    };

    lector.onerror = () => {
        mostrarEstadoImport("No se pudo leer el archivo.", true);
        evento.target.value = "";
    };

    lector.readAsText(archivo);
}

function actualizarEstadisticas(personasLista) {
    const statPromedio = document.getElementById("statPromedio");
    const statMayor = document.getElementById("statMayor");
    const statMenor = document.getElementById("statMenor");

    if (personasLista.length === 0) {
        statPromedio.textContent = "0";
        statMayor.textContent = "-";
        statMenor.textContent = "-";
        return;
    }

    const edades = personasLista.map(p => Number(p.edad));
    const suma = edades.reduce((acc, curr) => acc + curr, 0);
    const promedio = (suma / personasLista.length).toFixed(1);

    const edadMaxima = Math.max(...edades);
    const edadMinima = Math.min(...edades);

    const mayor = personasLista.find(p => Number(p.edad) === edadMaxima);
    const menor = personasLista.find(p => Number(p.edad) === edadMinima);

    statPromedio.textContent = `${promedio} yrs`;
    statMayor.textContent = `${mayor ? mayor.nombre : '-'} (${edadMaxima})`;
    statMenor.textContent = `${menor ? menor.nombre : '-'} (${edadMinima})`;
}

// Inicializar la carga con la API de Render
cargarPersonas();
