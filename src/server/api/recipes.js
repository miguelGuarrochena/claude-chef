import express from "express";
import cors from "cors";
import { HfClient } from "@huggingface/hub";

const app = express();
app.use(cors());
app.use(express.json());

const client = new HfClient({
  token: process.env.HF_ACCESS_TOKEN,
});

app.post("/api/recipes", async (req, res) => {
  const { ingredientsArr } = req.body;
  const ingredientsString = ingredientsArr.join(", ");

  try {
    const response = await client.chat.completions.create({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [
        { role: "system", content: "You are a recipe assistant." },
        {
          role: "user",
          content: `I have ${ingredientsString}. Please give me a recipe.`,
        },
      ],
      max_tokens: 1024,
    });

    res.json({ recipe: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
