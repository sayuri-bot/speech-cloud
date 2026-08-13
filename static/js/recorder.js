const boton = document.getElementById("btnHablar");
const estado = document.getElementById("estado");
const mensaje = document.getElementById("mensaje");
const texto = document.getElementById("texto");
const contador = document.getElementById("contador");
const wave = document.getElementById("wave");

boton.addEventListener("click", grabarAudio);

async function grabarAudio() {

    try {

        boton.disabled = true;
        boton.classList.add("grabando");
        wave.classList.add("animando");

        estado.innerHTML = `
            <span class="status-dot"></span>
            Escuchando...
        `;

        mensaje.innerHTML = "🎙️ Habla ahora...";

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        const recorder = new MediaRecorder(stream);

        let chunks = [];

        recorder.ondataavailable = e => {
            chunks.push(e.data);
        };

        recorder.onstop = async () => {

            estado.innerHTML = `
                <span class="status-dot"></span>
                Procesando...
            `;

            mensaje.innerHTML = "☁️ Enviando audio a Google Cloud...";

            const blob = new Blob(chunks, {
                type: "audio/webm"
            });

            const form = new FormData();

            form.append("audio", blob, "audio.webm");

            try {

                const response = await fetch("/transcribir", {
                    method: "POST",
                    body: form
                });

                const data = await response.json();

                texto.innerHTML = data.texto || "No se detectó ninguna voz.";

                contador.innerHTML = texto.innerText.length + " caracteres";

                estado.innerHTML = `
                    <span class="status-dot"></span>
                    Completado
                `;

                mensaje.innerHTML = "✅ Conversión finalizada.";

            } catch (error) {

                console.error(error);

                estado.innerHTML = "❌ Error";

                mensaje.innerHTML = "No fue posible conectar con Google Cloud.";

            }

            boton.disabled = false;
            boton.classList.remove("grabando");
            wave.classList.remove("animando");

        };

        recorder.start();

        setTimeout(() => {

            recorder.stop();

            stream.getTracks().forEach(track => track.stop());

        }, 5000);

    } catch (error) {

        console.error(error);

        estado.innerHTML = "❌ Micrófono no disponible";

        mensaje.innerHTML = "Permite el acceso al micrófono.";

        boton.disabled = false;

        boton.classList.remove("grabando");

        wave.classList.remove("animando");

    }

}

function copiarTexto() {

    navigator.clipboard.writeText(texto.innerText);

    alert("✅ Texto copiado correctamente.");

}

function limpiarTexto() {

    texto.innerHTML = "Aquí aparecerá el texto reconocido...";

    contador.innerHTML = "0 caracteres";

    mensaje.innerHTML = "Presiona el micrófono para comenzar.";

    estado.innerHTML = `
        <span class="status-dot"></span>
        Esperando
    `;

}

function descargarTXT() {

    const archivo = new Blob([texto.innerText], {
        type: "text/plain"
    });

    const enlace = document.createElement("a");

    enlace.href = URL.createObjectURL(archivo);

    enlace.download = "transcripcion.txt";

    enlace.click();

}