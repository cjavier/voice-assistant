import express from 'express';
import { OpenAI } from 'openai';
import axios from 'axios';
import 'dotenv/config';
const router = express.Router();

const threadByUser = process.env.THREAD_ID;
const assistantIdToUse = process.env.ASSISTANT_ID;
const elevenLabsVoiceID = process.env.VOICE_ID;
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;


// Configura la API de OpenAI
const openai = new OpenAI({
    apiKey: openaiApiKey, 
  });


router.post('/', async (req, res) => {
    try {
      const userMessage = req.body.message;
      const myThreadMessage = await openai.beta.threads.messages.create(
        threadByUser, // Usar el ID del thread almacenado para este usuario
        {
          role: "user",
          content: userMessage,
        }
      );
      console.log("Este es el objeto del mensaje: ", myThreadMessage, "\n");
  
      // Ejecutar el Asistente
      const myRun = await openai.beta.threads.runs.create(
        threadByUser, // Usar el ID del thread almacenado para este usuario
        {
          assistant_id: assistantIdToUse
        }
      );
      console.log("Este es el objeto run: ", myRun, "\n");
  
      // Recuperar periódicamente el Run para verificar su estado
      const retrieveRun = async () => {
        let keepRetrievingRun;
  
        while (myRun.status !== "completed") {
          keepRetrievingRun = await openai.beta.threads.runs.retrieve(
            threadByUser, // Usar el ID del thread almacenado para este usuario
            myRun.id
          );
  
          console.log(`Estado del run: ${keepRetrievingRun.status}`);
  
          if (keepRetrievingRun.status === "completed") {
            console.log("\n");
            break;
          }
        }
      };
      await retrieveRun();
  
      // Recuperar los mensajes agregados por el Asistente al Thread
      const allMessages = await openai.beta.threads.messages.list(
        threadByUser // Usar el ID del thread almacenado para este usuario
      );
      const assistantResponse = allMessages.data[0].content[0].text.value;

      // Generar audio usando ElevenLabs
      const apiRequestOptions = {
        method: 'POST',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceID}`,
        headers: {
            accept: 'audio/mpeg',
            'content-type': 'application/json',
            'xi-api-key': elevenLabsApiKey, // Clave API de ElevenLabs
        },
        data: {
            text: assistantResponse,
            model_id: "eleven_multilingual_v1"
        },
        responseType: 'arraybuffer', // Para recibir datos binarios en la respuesta
    };

    // Enviar la solicitud a ElevenLabs y esperar la respuesta
    const audioResponse = await axios.request(apiRequestOptions);
    console.log("Respuesta de ElevenLabs: ", audioResponse.data);
    const audioBase64 = Buffer.from(audioResponse.data).toString('base64');

      // Enviar la respuesta de texto y el URL del audio al frontend
      res.status(200).json({ 
        response: assistantResponse,
        audioData: audioBase64
     });
  
      console.log(
        "------------------------------------------------------------ \n"
      );
  
      console.log("Usuario: ", userMessage);
      console.log("Asistente: ", assistantResponse);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

export default router;
