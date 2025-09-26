import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface GeneratedQuestion {
  question: string;
  type: "mcq" | "true_false" | "short_answer" | "poll";
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  source?: string;
  category?: string;
}

export interface QuizGenerationOptions {
  questionTypes: string[];
  questionCount: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  language: string;
  topic?: string;
}

export class AIQuizGenerator {
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any = new Error("Unknown error");
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a rate limiting error (429)
        const isRateLimitError = error?.status === 429 || 
                                error?.code === 'rate_limit_exceeded' ||
                                error?.message?.includes('429') ||
                                error?.message?.includes('rate limit');
        
        // Don't retry if it's not a rate limit error, or if we've hit max retries
        if (!isRateLimitError || attempt === maxRetries) {
          console.error(`AI API Error (attempt ${attempt + 1}):`, error);
          break;
        }
        
        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Rate limit hit, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we get here, all retries failed
    if (lastError?.status === 429 || lastError?.message?.includes('429')) {
      throw new Error("OpenAI API rate limit exceeded. Please wait a moment and try again. If this persists, you may need to upgrade your OpenAI plan.");
    }
    
    throw new Error("Failed to generate quiz questions: " + (lastError?.message || "Unknown error"));
  }

  async generateFromText(content: string, options: QuizGenerationOptions): Promise<GeneratedQuestion[]> {
    return this.executeWithRetry(async () => {
      // Limit content size to prevent massive token usage
      const limitedContent = this.limitContentSize(content);
      const prompt = this.buildPrompt(limitedContent, options);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert quiz creator. Generate educational quiz questions based on the provided content. Always respond with valid JSON in the specified format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        // temperature: 0.7, // GPT-5 doesn't support custom temperature
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      if (!result.questions || !Array.isArray(result.questions)) {
        throw new Error("Invalid response format from AI");
      }

      return this.validateAndCleanQuestions(result.questions);
    });
  }

  async generateFromURL(url: string, options: QuizGenerationOptions): Promise<GeneratedQuestion[]> {
    try {
      // Extract content from URL
      const content = await this.extractContentFromURL(url);
      return this.generateFromText(content, options);
    } catch (error) {
      console.error("URL Content Extraction Error:", error);
      throw new Error("Failed to extract content from URL: " + (error as Error).message);
    }
  }

  private limitContentSize(content: string): string {
    // Rough token estimation: ~4 characters per token
    // Limit to 3000 tokens (12,000 characters) to stay well under 10k token limit
    // This leaves room for the prompt template and response
    const maxChars = 12000;
    
    if (content.length <= maxChars) {
      return content;
    }
    
    // Take first part of content with clean sentence break
    const truncated = content.substring(0, maxChars);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > maxChars * 0.8) {
      // If we found a good sentence break in the last 20%, use it
      return truncated.substring(0, lastSentenceEnd + 1) + 
             `\n\n[Content truncated for processing. Original length: ${content.length} characters]`;
    } else {
      // Otherwise use a clean word break
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      return truncated.substring(0, lastSpaceIndex) + 
             `\n\n[Content truncated for processing. Original length: ${content.length} characters]`;
    }
  }

  private buildPrompt(content: string, options: QuizGenerationOptions): string {
    const questionTypesText = options.questionTypes.join(", ");
    
    return `
Create ${options.questionCount} quiz questions based on the following content. 

Content:
${content}

Requirements:
- Question types: ${questionTypesText}
- Difficulty: ${options.difficulty}
- Language: ${options.language}
${options.topic ? `- Focus on topic: ${options.topic}` : ''}

For each question, provide:
1. Clear, concise question text
2. Question type (mcq, true_false, short_answer, or poll)
3. For MCQ: 4 options with one correct answer
4. For True/False: boolean answer
5. For Short Answer: expected answer phrase
6. Brief explanation of the correct answer
7. Difficulty level (easy/medium/hard)
8. Source reference (page number, section, or URL)
9. Category/topic classification

Ensure questions are:
- Educational and meaningful
- Appropriate for the target difficulty
- Diverse in topics covered
- Free from bias or offensive content
- Factually accurate

Respond in JSON format:
{
  "questions": [
    {
      "question": "Question text here",
      "type": "mcq",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option 1",
      "explanation": "Brief explanation",
      "difficulty": "medium",
      "source": "Source reference",
      "category": "Topic category"
    }
  ]
}
`;
  }

  private normalizeURL(url: string): string {
    // Trim whitespace
    url = url.trim();
    
    // Add protocol if missing
    if (!url.match(/^https?:\/\//)) {
      // Try HTTPS first, fallback to HTTP if needed
      url = 'https://' + url;
    }
    
    try {
      // Validate URL format
      new URL(url);
      return url;
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  private async extractContentFromURL(url: string): Promise<string> {
    try {
      const normalizedURL = this.normalizeURL(url);
      
      // Try with enhanced headers that work better with redirects
      const response = await fetch(normalizedURL, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        redirect: 'follow'
      });
      
      if (!response.ok) {
        // Check if it's a redirect that wasn't followed
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          console.log(`Handling ${response.status} redirect to:`, location);
          if (location) {
            try {
              // Manual redirect handling
              const redirectURL = new URL(location, normalizedURL).href;
              console.log(`Following redirect from ${normalizedURL} to ${redirectURL}`);
              return await this.extractContentFromURL(redirectURL);
            } catch (redirectError) {
              console.error('Redirect failed:', redirectError);
              throw new Error(`Redirect failed: ${(redirectError as Error).message}`);
            }
          } else {
            // Some servers return redirect codes without Location headers
            // Try to process the response as if it's successful
            console.log(`Warning: ${response.status} redirect without Location header, attempting to process response`);
            // Don't throw error, continue to process the response
          }
        } else {
          // Only throw error for non-redirect status codes
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      const html = await response.text();
      
      // Enhanced HTML text extraction
      let textContent = html
        // Remove scripts and styles
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        // Remove comments
        .replace(/<!--[\s\S]*?-->/gi, '')
        // Remove HTML tags but preserve spacing
        .replace(/<[^>]*>/g, ' ')
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .trim();
      
      // Limit content size to prevent token overflow
      if (textContent.length > 15000) {
        textContent = textContent.substring(0, 15000);
        // Try to end at a sentence
        const lastSentence = Math.max(
          textContent.lastIndexOf('.'),
          textContent.lastIndexOf('!'),
          textContent.lastIndexOf('?')
        );
        if (lastSentence > textContent.length * 0.8) {
          textContent = textContent.substring(0, lastSentence + 1);
        }
        textContent += '\n\n[Content truncated for processing]';
      }
      
      if (textContent.length < 100) {
        throw new Error('Extracted content too short. The webpage may not have readable text content.');
      }
      
      return textContent;
    } catch (error) {
      console.error('URL Content Extraction Error:', error);
      throw new Error(`Failed to extract content from URL: ${(error as Error).message}`);
    }
  }

  private validateAndCleanQuestions(questions: any[]): GeneratedQuestion[] {
    return questions
      .filter(q => q.question && q.type && q.correctAnswer !== undefined && q.correctAnswer !== null)
      .map(q => ({
        question: String(q.question).trim(),
        type: q.type,
        options: q.type === "mcq" ? (q.options || []) : undefined,
        correctAnswer: String(q.correctAnswer).trim(),
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
        difficulty: q.difficulty || "medium",
        source: q.source ? String(q.source).trim() : undefined,
        category: q.category ? String(q.category).trim() : undefined
      }))
      .slice(0, 25); // Limit to max 25 questions
  }

  async generateFromPDF(buffer: Buffer, options: QuizGenerationOptions): Promise<GeneratedQuestion[]> {
    // This would require a PDF parsing library like pdf-parse
    // For now, throw an error indicating it needs implementation
    throw new Error("PDF parsing not yet implemented. Please use text input or URL instead.");
  }
}

export const aiQuizGenerator = new AIQuizGenerator();
