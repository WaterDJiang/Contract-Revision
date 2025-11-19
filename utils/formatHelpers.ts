import { marked } from "marked";
import TurndownService from "turndown";

/**
 * Converts Markdown text to HTML.
 * Used to render AI responses into the Rich Text Editor.
 */
export const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown || typeof markdown !== 'string') return '';
  
  try {
    // parse returns a string or promise, in synchronous usage with simple string, it returns string
    return marked.parse(markdown, { async: false }) as string;
  } catch (e) {
    console.error("Failed to parse Markdown:", e);
    return `<p>${markdown}</p>`; // Fallback to raw text
  }
};

/**
 * Converts HTML back to Markdown.
 * Used when switching from Format tab back to Draft tab.
 */
export const convertHtmlToMarkdown = (html: string): string => {
  if (!html) return '';

  // Configure Turndown to be safer and avoid deep nesting
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
  });
  
  // Strip scripts, styles, and other dangerous tags before converting
  turndownService.remove(['script', 'style', 'iframe', 'object', 'embed']);

  try {
    return turndownService.turndown(html);
  } catch (e) {
    console.error("Failed to convert HTML to Markdown:", e);
    return html; // Fallback: return original HTML as text if conversion fails
  }
};

/**
 * Wraps HTML content in a structure that Microsoft Word recognizes as a valid .doc file.
 * This allows saving the Rich Text content with formatting.
 */
export const generateDocBlob = (htmlContent: string): Blob => {
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Contract Export</title>
      <style>
        body { 
          font-family: 'Times New Roman', serif; 
          font-size: 12pt; 
          line-height: 1.5; 
        }
        h1, h2, h3 { font-family: 'Arial', sans-serif; color: #000; }
        p { margin-bottom: 1em; }
        ul, ol { margin-bottom: 1em; }
      </style>
    </head>
    <body>
  `;
  
  const footer = `
    </body>
    </html>
  `;

  return new Blob([header + htmlContent + footer], { 
    type: 'application/msword' 
  });
};