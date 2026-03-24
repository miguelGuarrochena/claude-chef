import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has 
and suggests a recipe they could make with some or all of those ingredients. 
You don't need to use every ingredient they mention. 
The recipe can include additional ingredients, but try not to include too many extras. 
Format your response in markdown.
`;

// Claude (frontend-friendly)
const anthropic = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function getRecipeFromChefClaude(ingredientsArr) {
  const ingredientsString = ingredientsArr.join(", ");

  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!`,
      },
    ],
  });

  return msg.content[0].text;
}

// Mistral (via backend fetch)
export async function getRecipeFromMistral(ingredientsArr) {
  try {
    const response = await fetch("http://localhost:3000/api/recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredientsArr }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data); // aquí ves la respuesta del backend

    return data.recipe;
  } catch (error) {
    console.error("Error calling backend API:", error);
    
    if (error.message.includes("Failed to fetch")) {
      console.error("Make sure the backend server is running on localhost:3000");
      console.error("Run: node server.js");
    }
    
    throw error;
  }
}
