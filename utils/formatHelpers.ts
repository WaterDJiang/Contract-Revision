
import { marked } from "marked";
import TurndownService from "turndown";
import { computeLineDiff } from "./diffHelper";

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

export const stripRedlineHtml = (html: string): string => {
  if (!html) return '';
  let s = html;
  s = s.replace(/<ins[^>]*>([\s\S]*?)<\/ins>/g, '$1');
  s = s.replace(/<del[^>]*>[\s\S]*?<\/del>/g, '');
  return s;
};

export const normalizeMarkdown = (md: string): string => {
  if (!md) return '';
  let s = md.replace(/\r\n/g, "\n");
  s = s.replace(/[\t ]+$/gm, "");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.replace(/^\s*[•·]\s+/gm, "- ");
  s = s.replace(/^\s*\*\s+/gm, "- ");
  s = s.replace(/^\s*(\d+)[\).]\s+/gm, (m, n) => `${n}. `);
  s = s.replace(/^#+(\S)/gm, (m, c) => m.replace(`#${c}`, `# ${c}`));
  return s.trim();
};

export const getContractTitle = (md: string): string => {
  if (!md) return 'Contract';
  const lines = md.split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*#\s*(.+)$/);
    if (m) return m[1].trim();
  }
  const first = lines.find(l => l.trim().length > 0) || 'Contract';
  return first.trim().slice(0, 80);
};

export const toFilenameBase = (title: string): string => {
  const base = (title || 'Contract').replace(/[^\w\-\. ]+/g, '').trim().replace(/\s+/g, '_');
  return base || 'Contract';
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
        del { color: red; text-decoration: line-through; }
        ins { color: #004085; text-decoration: none; background-color: #cce5ff; border-left: 3px solid #3399ff; padding: 2px; display: block; }
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

/**
 * Generates an HTML string representing the diff between two markdown files.
 * This simulates "Track Changes" when opened in Word.
 */
export const generateRedlineHtml = (originalMd: string, revisedMd: string): string => {
  const diffs = computeLineDiff(originalMd, revisedMd);
  
  let htmlBody = '';
  
  // We will reconstruct the document line by line, converting MD to HTML for unchanged/added lines
  // This is a simplified approach. Ideally we would diff the HTML structure, but line-based MD diff 
  // is sufficient for a "Redline" view of text changes.
  
  diffs.forEach(change => {
    if (change.type === 'unchanged') {
       htmlBody += convertMarkdownToHtml(change.value);
    } else if (change.type === 'added') {
       const html = convertMarkdownToHtml(change.value);
       htmlBody += `<ins style='background-color:#cce5ff;color:#004085;border-left:3px solid #3399ff;padding:2px;display:block;'>${html}</ins>`;
    } else if (change.type === 'removed') {
      // Wrap removed content in strike-through
      // Note: We render the raw MD text for deletion to avoid breaking layout with removed headers etc.
      htmlBody += `<del style='color: red; text-decoration: line-through;'>${change.value}</del><br/>`;
    }
  });

  return htmlBody;
};
