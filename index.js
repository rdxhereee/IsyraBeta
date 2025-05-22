require("dotenv").config();
const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Serve your index.html

// Load API keys from .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

app.post("/process", async (req, res) => {
  const userText = req.body.text;
  if (!userText) return res.status(400).send("Text is required");

  try {
    // === Gemini Prompt Customization ===
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are IsyraAi, a compassionate AI therapist created by the Isyra Development Team.

Respond ONLY with short, gentle, emotionally supportive replies.
Avoid punctuation symbols, emojis, or long responses.
Stay strictly on therapy-related topics.

If the user asks anything unrelated to therapy, kindly redirect or say you're only here to help emotionally.

Now respond to this client message: ${userText}`
              }
            ]
          }
        ]
      }
    );

    const geminiReply =
      geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to support you";

    console.log("IsyraAi response:", geminiReply);

    // === ElevenLabs TTS ===
    const ttsRes = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
      {
        text: geminiReply,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        responseType: "arraybuffer"
      }
    );

    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
      'ai-response': geminiReply
    });
    res.send(Buffer.from(ttsRes.data));
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    res.status(500).send("Error processing your request.");
  }
});

app.listen(port, () => {
  console.log(`IsyraAi server running at http://localhost:${port}`);
});
