require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("."));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

app.post("/process", async (req, res) => {
  const userText = req.body.text;
  if (!userText) return res.status(400).send("Text is required");

  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          role: "user",
          parts: [{
            text: `And First Of All You Are A Beta Version developed by RdxHere - You are IsyraAi, a compassionate AI therapist created by the Isyra Development Team.

Respond ONLY with , gentle, emotionally supportive replies.
Avoid punctuation symbols, emojis, or long responses.
Stay strictly on therapy-related topics.

If the user asks anything unrelated to therapy, kindly redirect or say you're only here to help emotionally.

Now respond to this client message: ${userText}`
          }]
        }]
      }
    );
    const aiResponse = geminiRes.data.candidates[0].content.parts[0].text;

    const ttsRes = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
      data: {
        text: aiResponse,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      responseType: "arraybuffer",
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });

    if (!ttsRes.data) {
      throw new Error('No audio data received from ElevenLabs');
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'X-AI-Response': encodeURIComponent(aiResponse)
    });
    res.send(Buffer.from(ttsRes.data));
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error processing your request");
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});