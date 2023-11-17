import express from 'express';
import cors from 'cors';
import audio from './audio.js'; 
import assistant from './assistant.js';



const app = express();
app.use(cors());
app.use(express.json()); 
const port = 3050;

app.use('/audio', audio);

app.use('/assistant', assistant);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});