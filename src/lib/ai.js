import OpenAI from 'openai';
import Debug from 'debug';

const debug = Debug('ai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate embeddings from text using OpenAI's text-embedding-3-small model
export async function generateEmbedding(text) {
  try {
    debug(`Generating embedding for text: ${text.substring(0, 100)}...`);
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;
    debug(`Generated embedding with ${embedding.length} dimensions`);
    
    return embedding;
  } catch (error) {
    debug('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

// Generate multiple embeddings in batch
export async function generateEmbeddings(texts) {
  try {
    debug(`Generating embeddings for ${texts.length} texts`);
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });

    const embeddings = response.data.map(item => item.embedding);
    debug(`Generated ${embeddings.length} embeddings`);
    
    return embeddings;
  } catch (error) {
    debug('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

// Generate chatbot response using GPT-4o-mini
export async function generateChatbotResponse(prompt, context = []) {
  try {
    debug(`Generating response for prompt: ${prompt.substring(0, 100)}...`);
    debug(`Using ${context.length} context items`);

    // Format context for the system prompt
    const contextText = context.length > 0 
      ? context.map((item, index) => 
          `Context ${index + 1} (Similarity: ${item.similarity?.toFixed(3) || 'N/A'}):\n${item.content}`
        ).join('\n\n')
      : 'No relevant context found.';

    const systemPrompt = `You are a helpful sales assistant AI that provides information based on customer notes and sales data.

Given the following context from customer notes and sales interactions, answer the user's question using this information as the primary source.

You can supplement the information with general sales knowledge, but be sure to distinguish between specific context from the notes and general information.

If you are unsure and the answer is not explicitly written in the context provided, say "I don't have enough specific information about that in the available notes."

Context from customer notes:
${contextText}

Guidelines:
- Be professional and helpful
- Focus on actionable insights
- Distinguish between specific customer feedback and general advice
- Respect confidentiality - only reference information that's in the provided context
- Answer in a conversational tone`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const generatedResponse = response.choices[0].message.content;
    debug(`Generated response: ${generatedResponse.substring(0, 100)}...`);
    
    return generatedResponse;
  } catch (error) {
    debug('Error generating chatbot response:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

// Test OpenAI connection
export async function testOpenAIConnection() {
  try {
    const response = await openai.models.list();
    debug('OpenAI connection successful');
    return true;
  } catch (error) {
    debug('OpenAI connection failed:', error);
    return false;
  }
} 