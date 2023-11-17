import multer from 'multer';
import express from 'express';
import * as speechSDK from "microsoft-cognitiveservices-speech-sdk";
import { exec } from 'child_process';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Guardar archivos en una carpeta 'uploads'

router.post('/', upload.single('file'), async (req, res) => {
    try {
      const webmFile = req.file.path;
      const wavFile = webmFile.replace('.webm', '.wav');
  
      // Convertir de WebM a WAV usando FFmpeg
      exec(`ffmpeg -i ${webmFile} -acodec pcm_s16le -ar 16000 -ac 1 ${wavFile}`, async (error) => {
        if (error) {
          console.error('Error converting audio:', error);
          return res.status(500).send('Error converting audio');
        }
  
        // Transcribir el archivo WAV a texto
        const transcript = await transcribeAudio(wavFile);
        res.json({ transcript });
  
        // Opcional: eliminar los archivos una vez procesados
        fs.unlinkSync(webmFile);
        fs.unlinkSync(wavFile);
      });
    } catch (error) {
      console.error('Error processing audio:', error);
      res.status(500).send('Error processing audio');
    }
  });
  

  const transcribeAudio = async (audioBuffer) => {
    // Configuración de Azure Speech
    const speechConfig = speechSDK.SpeechConfig.fromSubscription('5b16d2f0807740b38336d90ed5769e00', 'eastus');
    const audioStream = speechSDK.AudioDataStream.fromWavFileInput(audioBuffer);
    const speechRecognizer = new speechSDK.SpeechRecognizer(speechConfig, audioStream);
  
    return new Promise((resolve, reject) => {
      speechRecognizer.recognizeOnceAsync(result => {
        if (result.reason === speechSDK.ResultReason.RecognizedSpeech) {
          resolve(result.text);
        } else {
          reject('Error recognizing speech');
        }
      });
    });
  };



export default router;