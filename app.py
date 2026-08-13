from flask import Flask, render_template, request, jsonify
from google.cloud import speech
from google.oauth2 import service_account
import os
import json

app = Flask(__name__)

# =====================================================
# Credenciales de Google Cloud
# =====================================================

credenciales_json = os.environ.get("GOOGLE_CREDENTIALS")

if credenciales_json:
    # Render
    info = json.loads(credenciales_json)
    credentials = service_account.Credentials.from_service_account_info(info)
    client = speech.SpeechClient(credentials=credentials)
else:
    # Desarrollo local
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "credenciales.json"
    client = speech.SpeechClient()

# =====================================================
# Página principal
# =====================================================

@app.route("/")
def inicio():
    return render_template("index.html")

# =====================================================
# Transcripción
# =====================================================

@app.route("/transcribir", methods=["POST"])
def transcribir():

    if "audio" not in request.files:
        return jsonify({"texto": "No se recibió audio"})

    audio = request.files["audio"]

    contenido = audio.read()

    audio_google = speech.RecognitionAudio(
        content=contenido
    )

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        sample_rate_hertz=48000,
        language_code="es-PE",
        enable_automatic_punctuation=True
    )

    respuesta = client.recognize(
        config=config,
        audio=audio_google
    )

    texto = ""

    for resultado in respuesta.results:
        texto += resultado.alternatives[0].transcript + " "

    return jsonify({
        "texto": texto.strip()
    })

# =====================================================
# Ejecutar aplicación
# =====================================================

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=True
    )