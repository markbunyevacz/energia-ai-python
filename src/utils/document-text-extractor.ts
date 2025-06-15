import Tesseract from 'tesseract.js';
import { getDocument } from 'pdfjs-dist';

export const extractTextFromImage = async (imageDataUrl: string): Promise<string> => {
    const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'eng+hun');
    return text;
};
  
export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdf = await getDocument({ data: uint8Array }).promise;
      
      let text = '';
      const textMatches: string[] = [];
      
      // Try simple text extraction first
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        textMatches.push(pageText);
        text += pageText + '\n';
      }
 
      // Check if text extraction was successful
      const isMostlyNonText = (text: string) => {
        return (text.replace(/[^A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű0-9]/g, '').length < 30);
      };
 
      if (isMostlyNonText(text)) {
        // Fallback to OCR for image-based PDFs
        const numPages = Math.min(pdf.numPages, 3); // Limit to first 3 pages for performance
        let ocrText = '';
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({ canvasContext: context!, viewport }).promise;
          const imageDataUrl = canvas.toDataURL('image/png');
          ocrText += await extractTextFromImage(imageDataUrl) + '\n';
        }
        
        return ocrText.trim() || '[PDF OCR feldolgozás sikertelen vagy üres.]';
      }
 
      return textMatches.join(' ').slice(0, 50000); // Limit to 50KB of text
    } catch (error) {
      // console.error('PDF text extraction error:', error);
      return `Dokumentum: ${file.name}. Szöveg kivonás sikertelen, de a fájl feltöltve.`;
    }
}; 
