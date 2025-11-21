import { convertHtmlToMarkdown } from './formatHelpers';

// Declare global libraries loaded via CDN
declare var mammoth: any;
declare var pdfjsLib: any;

export const parseDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  if (typeof mammoth === 'undefined') {
    throw new Error("Mammoth library not loaded. Cannot parse DOCX.");
  }
  
  try {
    // Mammoth converts docx to HTML
    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
    // We convert HTML to Markdown so it fits our Draft/AI workflow
    return convertHtmlToMarkdown(result.value);
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Failed to parse DOCX file. It might be corrupted or encrypted.");
  }
};

export const parsePdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  if (typeof pdfjsLib === 'undefined') {
     throw new Error("PDF.js library not loaded. Cannot parse PDF.");
  }

  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF file.");
  }
};

export const parseFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();
  
  return new Promise((resolve, reject) => {
    // Binary formats (DOCX, PDF)
    if (fileName.endsWith('.docx') || fileName.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          let result = '';
          
          if (fileName.endsWith('.docx')) {
            result = await parseDocx(arrayBuffer);
          } else if (fileName.endsWith('.pdf')) {
            result = await parsePdf(arrayBuffer);
          }
          
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.readAsArrayBuffer(file); // Crucial: Read as binary
    } 
    // Text formats (MD, TXT, HTML)
    else {
      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target?.result as string;
        // If HTML, convert to MD
        if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
          content = convertHtmlToMarkdown(content);
        }
        resolve(content);
      };
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.readAsText(file);
    }
  });
};