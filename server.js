import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

console.log("SERVER STARTING...");

const app = express();
app.use(cors());
app.use(express.json());

console.log("TOKEN: ", process.env.HF_ACCESS_TOKEN);

app.post("/api/recipes", async (req, res) => {
  const { ingredientsArr } = req.body;
  const ingredientsString = ingredientsArr.join(", ");

  try {
    console.log("Trying Hugging Face public Space...");
    
    // Use a public Space that has text models available
    const response = await fetch("https://huggingface.co/spaces/merve/ChatGPT-4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [
          `I have ${ingredientsString}. Please give me a recipe you'd recommend I make! Format your response in markdown.`
        ]
      }),
    });

    console.log("Status HF Space:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("HF Space response:", JSON.stringify(data, null, 2));
      
      if (data && data.data && data.data[0]) {
        const recipe = data.data[0];
        console.log("✅ HF Space worked!");
        res.json({ recipe });
        return;
      }
    }
    
    // If Space fails, try with a simple text model
    console.log("Space failed, trying simple text model...");
    
    const textResponse = await fetch("https://api-inference.huggingface.co/models/zai-org/GLM-5", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Recipe: ${ingredientsString}\n\nIngredients:\n${ingredientsArr.map(ing => `- ${ing}`).join('\n')}\n\nInstructions:`,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false
        }
      }),
    });

    console.log("Status text model:", textResponse.status);

    if (textResponse.ok) {
      const textData = await textResponse.json();
      console.log("Text model response:", JSON.stringify(textData, null, 2));
      
      let generatedText = null;
      
      if (Array.isArray(textData) && textData[0]) {
        generatedText = textData[0].generated_text;
      }
      
      if (generatedText && generatedText.trim().length > 5) {
        const recipe = `# AI Generated Recipe\n\n## Ingredients:\n${ingredientsArr.map(ing => `- ${ing}`).join('\n')}\n\n## Instructions:\n${generatedText}`;
        
        console.log("✅ Text model worked!");
        res.json({ recipe });
        return;
      }
    }
    
    throw new Error(`All HF methods failed`);
    
  } catch (err) {
    console.error("Hugging Face API completely failed, using fallback recipe:", err.message);
    
    // Last resort: dynamic recipe
    const fallbackRecipe = generateDynamicRecipe(ingredientsArr);
    res.json({ recipe: fallbackRecipe });
  }
});

// Function to generate recipes dynamically (not hardcoded)
function generateDynamicRecipe(ingredientsArr) {
  const mainIngredient = ingredientsArr[0];
  const otherIngredients = ingredientsArr.slice(1);
  
  // Cooking techniques according to main ingredient
  const cookingTechniques = {
    "pasta": ["boil", "sauté", "bake", "refrigerate"],
    "pollo": ["roast", "boil", "sauté", "fry", "bake"],
    "arroz": ["boil", "sauté", "steam", "bake"],
    "carne": ["roast", "sauté", "boil", "fry", "stew"],
    "pescado": ["baked", "steamed", "sautéed", "fried"],
    "verdura": ["sautéed", "boiled", "roasted", "steamed"],
    "huevo": ["fried", "scrambled", "boiled", "baked"],
    "queso": ["melted", "gratinated", "cold", "melted"]
  };
  
  // Random spices and condiments
  const spices = [
    "salt", "black pepper", "oregano", "basil", "thyme", "rosemary",
    "cumin", "paprika", "curry", "cinnamon", "nutmeg", "garlic powder",
    "onion powder", "chili powder", "paprika", "herbs de provence"
  ];
  
  // Oils and fats
  const oils = ["olive oil", "sunflower oil", "butter", "coconut oil"];
  
  // Cooking liquids
  const liquids = [
    "chicken broth", "vegetable broth", "white wine", "water", "coconut milk",
    "soy sauce", "balsamic vinegar", "lemon juice"
  ];
  
  // Preparation methods
  const preparations = [
    "dice", "mince", "grate", "mash", "julienne", "chop", "crush", "shred"
  ];
  
  // Select appropriate or random technique
  const availableTechniques = cookingTechniques[mainIngredient.toLowerCase()] || 
    ["sauté", "boil", "bake", "fry"];
  const mainTechnique = availableTechniques[Math.floor(Math.random() * availableTechniques.length)];
  
  // Generate additional ingredients dynamically
  const additionalIngredients = [];
  
  // Add spices (3-4 random)
  const selectedSpices = [];
  for (let i = 0; i < 3 + Math.floor(Math.random() * 2); i++) {
    const spice = spices[Math.floor(Math.random() * spices.length)];
    if (!selectedSpices.includes(spice)) {
      selectedSpices.push(spice);
    }
  }
  additionalIngredients.push(...selectedSpices);
  
  // Add oil
  additionalIngredients.push(oils[Math.floor(Math.random() * oils.length)]);
  
  // Add liquid if needed
  if (mainTechnique === "boil" || mainTechnique === "sauté") {
    additionalIngredients.push(liquids[Math.floor(Math.random() * liquids.length)]);
  }
  
  // Add garlic and onion (almost always)
  if (Math.random() > 0.2) {
    additionalIngredients.push("2 cloves garlic, minced");
  }
  if (Math.random() > 0.3) {
    additionalIngredients.push("1/2 onion, chopped");
  }
  
  // Generate preparation steps dynamically
  const steps = [];
  
  // Step 1: Initial preparation
  steps.push(`Prepare all ingredients as needed.`);
  
  // Step 2: Main technique
  switch (mainTechnique) {
    case "boil":
      steps.push(`Bring salted water to a boil and cook ${mainIngredient} according to package instructions or until tender.`);
      if (otherIngredients.length > 0) {
        steps.push(`Meanwhile, prepare the other ingredients.`);
      }
      steps.push(`Drain well and set aside.`);
      break;
      
    case "sauté":
      steps.push(`Heat oil in a large skillet over medium-high heat.`);
      steps.push(`Add ${mainIngredient} and sauté until golden and cooked.`);
      if (otherIngredients.length > 0) {
        steps.push(`Incorporate the other ingredients and continue sautéing.`);
      }
      break;
      
    case "bake":
      steps.push(`Preheat oven to 180°C (350°F).`);
      steps.push(`Place ${mainIngredient} on a baking sheet.`);
      steps.push(`Bake for 20-30 minutes or until golden and cooked.`);
      break;
      
    case "fry":
      steps.push(`Heat enough oil in a skillet over medium-high heat.`);
      steps.push(`Fry ${mainIngredient} until golden and crispy on the outside.`);
      steps.push(`Drain excess oil on paper towels.`);
      break;
      
    default:
      steps.push(`Cook ${mainIngredient} using your preferred method until done.`);
  }
  
  // Step 3: Combine ingredients
  if (otherIngredients.length > 0) {
    steps.push(`Mix all cooked ingredients in the skillet.`);
  }
  
  // Step 4: Season
  steps.push(`Season with ${selectedSpices.slice(0, 2).join(" and ")} to taste.`);
  
  // Step 5: Finishing
  const finishes = [
    "Serve hot immediately.",
    "Let rest 5 minutes before serving.",
    "Garnish with fresh herbs if desired.",
    "Serve with your favorite side dish.",
    "Drizzle with olive oil before serving."
  ];
  steps.push(finishes[Math.floor(Math.random() * finishes.length)]);
  
  // Generate dynamic title
  const adjectives = ["Delicious", "Tasty", "Exquisite", "Traditional", "Easy", "Quick", "Homemade"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const title = `${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} ${adjective}`;
  
  // Assemble complete recipe
  const recipe = `
# ${title}

## Ingredients:
- ${ingredientsArr.join("\n- ")}
- ${additionalIngredients.join("\n- ")}

## Instructions:
${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Chef's Notes:
- You can adjust the spices according to your personal preference.
- Cooking time may vary depending on the size and quality of ingredients.
- This recipe is versatile: feel free to add or substitute ingredients.

Enjoy your unique creation!
  `.trim();
  
  return recipe;
}

app.listen(3000, () => {
  console.log("🔥 Backend running on http://localhost:3000");
});
