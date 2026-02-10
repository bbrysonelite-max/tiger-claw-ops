/**
 * Tiger Bot Scout - Text Chunker
 * Splits text into chunks suitable for vector embeddings
 * Preserves paragraph boundaries and sentence integrity
 */

// Sentence-ending punctuation regex
const SENTENCE_END_REGEX = /[.!?]+[\s]+/g;

// Paragraph boundary regex (double newline or more)
const PARAGRAPH_REGEX = /\n\s*\n/g;

/**
 * Split text into sentences while preserving the delimiters
 */
function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  // Reset regex state
  SENTENCE_END_REGEX.lastIndex = 0;
  
  while ((match = SENTENCE_END_REGEX.exec(text)) !== null) {
    const sentence = text.substring(lastIndex, match.index + match[0].length).trim();
    if (sentence) {
      sentences.push(sentence);
    }
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text as final sentence
  const remaining = text.substring(lastIndex).trim();
  if (remaining) {
    sentences.push(remaining);
  }
  
  return sentences;
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(PARAGRAPH_REGEX)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Chunk text into segments of approximately maxChunkSize characters
 * Preserves paragraph boundaries where possible, falls back to sentence boundaries
 * 
 * @param text - The text to chunk
 * @param maxChunkSize - Maximum characters per chunk (default 500)
 * @returns Array of text chunks
 */
export function chunkText(text: string, maxChunkSize: number = 500): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Clean the text
  const cleanedText = text
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\t/g, ' ')     // Replace tabs with spaces
    .replace(/ +/g, ' ')     // Collapse multiple spaces
    .trim();
  
  // If text is already small enough, return as single chunk
  if (cleanedText.length <= maxChunkSize) {
    return [cleanedText];
  }
  
  const chunks: string[] = [];
  
  // First, split into paragraphs
  const paragraphs = splitIntoParagraphs(cleanedText);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If paragraph alone is too big, split by sentences
    if (paragraph.length > maxChunkSize) {
      // Save current chunk if not empty
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Split paragraph into sentences
      const sentences = splitIntoSentences(paragraph);
      
      for (const sentence of sentences) {
        // If single sentence is too big, force split by character
        if (sentence.length > maxChunkSize) {
          // Save current chunk if not empty
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          
          // Force split the long sentence
          let remaining = sentence;
          while (remaining.length > maxChunkSize) {
            // Try to split at word boundary
            let splitIndex = remaining.lastIndexOf(' ', maxChunkSize);
            if (splitIndex < maxChunkSize * 0.5) {
              // No good word boundary, force split
              splitIndex = maxChunkSize;
            }
            
            chunks.push(remaining.substring(0, splitIndex).trim());
            remaining = remaining.substring(splitIndex).trim();
          }
          
          if (remaining) {
            currentChunk = remaining;
          }
        } else if (currentChunk.length + sentence.length + 1 > maxChunkSize) {
          // Adding this sentence would exceed limit
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = sentence;
        } else {
          // Add sentence to current chunk
          currentChunk = currentChunk
            ? currentChunk + ' ' + sentence
            : sentence;
        }
      }
    } else if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      // Adding this paragraph would exceed limit
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      // Add paragraph to current chunk with double newline separator
      currentChunk = currentChunk
        ? currentChunk + '\n\n' + paragraph
        : paragraph;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Chunk text with overlap for better context in embeddings
 * 
 * @param text - The text to chunk
 * @param maxChunkSize - Maximum characters per chunk
 * @param overlapSize - Number of characters to overlap between chunks
 * @returns Array of text chunks with overlap
 */
export function chunkTextWithOverlap(
  text: string,
  maxChunkSize: number = 500,
  overlapSize: number = 50
): string[] {
  const baseChunks = chunkText(text, maxChunkSize - overlapSize);
  
  if (baseChunks.length <= 1) {
    return baseChunks;
  }
  
  const overlappedChunks: string[] = [];
  
  for (let i = 0; i < baseChunks.length; i++) {
    let chunk = baseChunks[i];
    
    // Add overlap from previous chunk (suffix)
    if (i > 0) {
      const prevChunk = baseChunks[i - 1];
      const overlapText = prevChunk.slice(-overlapSize);
      // Find a word boundary in the overlap
      const wordBoundary = overlapText.indexOf(' ');
      if (wordBoundary > 0) {
        chunk = overlapText.slice(wordBoundary + 1) + ' ' + chunk;
      }
    }
    
    overlappedChunks.push(chunk);
  }
  
  return overlappedChunks;
}

/**
 * Calculate statistics about the chunks
 */
export function getChunkStats(chunks: string[]): {
  count: number;
  totalChars: number;
  avgChars: number;
  minChars: number;
  maxChars: number;
} {
  if (chunks.length === 0) {
    return {
      count: 0,
      totalChars: 0,
      avgChars: 0,
      minChars: 0,
      maxChars: 0,
    };
  }
  
  const lengths = chunks.map(c => c.length);
  const totalChars = lengths.reduce((sum, len) => sum + len, 0);
  
  return {
    count: chunks.length,
    totalChars,
    avgChars: Math.round(totalChars / chunks.length),
    minChars: Math.min(...lengths),
    maxChars: Math.max(...lengths),
  };
}
