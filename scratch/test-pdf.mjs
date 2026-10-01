import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import { createWorker } from 'tesseract.js';

async function run() {
  const data = new Uint8Array(fs.readFileSync('../../Aryahs_AI_Invoice_Scanner_Test_Invoice.pdf'));
  
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  const page = await pdfDocument.getPage(1);
  const textContent = await page.getTextContent();
  const textItems = textContent.items.map(item => item.str).join(' ');
  console.log("Extracted text length:", textItems.length);
  
  if (textItems.length > 50) {
    console.log("Text found:", textItems.substring(0, 100));
  } else {
    console.log("Rendering to image...");
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    const buffer = canvas.toBuffer('image/png');
    console.log("Image buffer size:", buffer.length);
    
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    console.log("OCR Text:", text.substring(0, 100));
    await worker.terminate();
  }
}

run().catch(console.error);
