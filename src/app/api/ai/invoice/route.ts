import { NextResponse } from "next/server";
import path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "canvas";
import { createWorker } from "tesseract.js";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

// Disable external worker and use the local node_modules worker
pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");

export async function POST(request: Request) {
  let stage = "starting";

  try {
    stage = "reading form data";
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Invoice file is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: "Only PDF, JPG, PNG and WebP files are supported" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: "Invoice file must be smaller than 10 MB" }, { status: 400 });
    }

    stage = "reading file bytes";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer.length) {
      return NextResponse.json({ success: false, message: "The uploaded file is empty" }, { status: 422 });
    }

    let extractedText = "";

    if (file.type === "application/pdf") {
      stage = "processing PDF (Text / OCR)";
      extractedText = await processPdf(buffer);
    } else {
      stage = "running image OCR";
      extractedText = await runOcr(buffer);
    }

    stage = "parsing extracted text";
    if (!extractedText || !extractedText.trim()) {
      return NextResponse.json({
        success: false,
        message: "No readable text could be extracted from the document.",
        details: "The local OCR engine could not find any text."
      }, { status: 422 });
    }

    const invoiceData = parseInvoiceText(extractedText);
    
    // DEVELOPMENT ONLY: Dump actual OCR to inspect the real pipeline
    try {
       const fs = require("fs");
       const path = require("path");
       fs.writeFileSync(path.join(process.cwd(), "scratch", "aryahs-test-invoice-ocr.txt"), extractedText);
       console.log("--- START ACTUAL OCR ---");
       console.log(extractedText);
       console.log("--- END ACTUAL OCR ---");
    } catch(e) {}

    return NextResponse.json({
      success: true,
      message: "Invoice extracted successfully",
      data: invoiceData,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Local OCR Invoice] FAILED", { stage, error: errorMessage });
    return NextResponse.json(
      {
        success: false,
        message: "Unable to process the invoice",
        details: errorMessage,
        stage,
      },
      { status: 500 }
    );
  }
}

async function processPdf(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    standardFontDataUrl: undefined,
  });
  
  const pdfDocument = await loadingTask.promise;
  let fullText = "";
  const numPages = pdfDocument.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    
    // If we have a reasonable amount of selectable text, use it directly (skip OCR)
    if (pageText.trim().length > 150) {
      fullText += pageText + "\n";
    } else {
      // It's likely a scanned PDF. Render the page to an image, then OCR.
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");
      
      await page.render({ canvasContext: context, viewport } as any).promise;
      const imgBuffer = canvas.toBuffer("image/png");
      
      const ocrText = await runOcr(imgBuffer);
      fullText += ocrText + "\n";
    }
  }
  
  return fullText;
}

async function runOcr(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(buffer);
  await worker.terminate();
  return text;
}

function parseInvoiceText(text: string) {
  // Normalize OCR specific oddities
  let normalizedText = text
    .replace(/\r?\n/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
    
  // Treat single 'n' surrounded by spaces as currency marker or garbage
  // e.g., "Rate ( n )" -> "Rate ( )" -> "Rate"
  normalizedText = normalizedText.replace(/\(\s*n\s*\)/gi, "");
  normalizedText = normalizedText.replace(/\bn\b/gi, "");
  normalizedText = normalizedText.replace(/[ \t]+/g, " ").trim();

  const supplierGstin = extractGstin(normalizedText, "supplier");
  const customerGstin = extractGstin(normalizedText, "customer");
  
  return {
    supplierName: extractSupplierName(normalizedText),
    supplierGstin: supplierGstin,
    supplierAddress: null,
    invoiceNumber: extractInvoiceNumber(normalizedText),
    invoiceDate: extractDate(normalizedText, /(?:invoice\s*date|date)\s*[:\-]?\s*([0-9]{1,2}[-/][A-Za-z0-9]{2,4}[-/][0-9]{2,4})/i),
    dueDate: extractDate(normalizedText, /due\s*date\s*[:\-]?\s*([0-9]{1,2}[-/][A-Za-z0-9]{2,4}[-/][0-9]{2,4})/i),
    placeOfSupply: extractPlaceOfSupply(normalizedText),
    customerName: extractCustomerName(normalizedText),
    customerGstin: customerGstin,
    customerAddress: null,
    taxableAmount: extractMoneyAfterLabel(normalizedText, /(?:taxable\s*amount|taxable\s*value|taxable)/i),
    cgst: extractMoneyAfterLabel(normalizedText, /(?:^|\s)cgst(?:\s*@\s*[\d.]+%)?/i),
    sgst: extractMoneyAfterLabel(normalizedText, /(?:^|\s)sgst(?:\s*@\s*[\d.]+%)?/i),
    igst: extractMoneyAfterLabel(normalizedText, /(?:^|\s)igst(?:\s*@\s*[\d.]+%)?/i),
    discount: extractMoneyAfterLabel(normalizedText, /(?:^|\s)discount/i),
    total: extractMoneyAfterLabel(normalizedText, /(?:^|\s)(?:grand\s*total|invoice\s*total|net\s*amount)/i),
    items: extractItems(normalizedText)
  };
}

function cleanGstin(val: string) {
  let cleaned = val.replace(/\s+/g, "").toUpperCase();
  // Don't replace Z with 2, Z is common (13th char is usually Z).
  cleaned = cleaned.replace(/O/g, "0").replace(/I/g, "1");
  return cleaned;
}

function extractSupplierName(text: string) {
  // Extract text between TAX INVOICE (or start) and the first address-like or GSTIN boundary.
  const match = text.match(/(?:TAX\s*INVOICE)?\s*(.+?)(?=\s+(?:\d{2,}\s+[A-Za-z]|GSTIN|Invoice|Bill|Phone|Mobile))/i);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (candidate.length > 3 && candidate.length < 100) return candidate;
  }
  return null;
}

function extractCustomerName(text: string) {
  // Extract text after "Bill To" or "Customer" until address or GSTIN
  const match = text.match(/(?:bill\s*to|customer|buyer|ship\s*to)\s*(.+?)(?=\s+(?:\d{2,}\s+[A-Za-z]|GSTIN|Invoice|Bill|Phone|Mobile|#|Product|Item))/i);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (candidate.length > 3 && candidate.length < 100) return candidate;
  }
  return null;
}

function extractGstin(text: string, type: "supplier" | "customer") {
  const gstinPattern = /([0-9SZO]{2}\s*[A-Z0-9]{5}\s*[0-9O]{4}\s*[A-Z0-9]\s*[1-9A-Z]\s*[Z2]\s*[0-9A-Z])/ig;
  const matches = [...text.matchAll(gstinPattern)];
  if (matches.length === 0) return null;
  
  if (type === "supplier") {
    // Usually the first GSTIN is the supplier's
    return cleanGstin(matches[0][1]);
  } else {
    // If there is more than one, the last one or the one near "Bill To" is the customer's.
    if (matches.length > 1) {
      return cleanGstin(matches[matches.length - 1][1]);
    }
  }
  return null;
}

function extractInvoiceNumber(text: string) {
  const patterns = [
    /(?:invoice|inv|bill)\s*(?:no|number|#)\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-_]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function extractDate(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  if (match && match[1]) return match[1].trim();
  return null;
}

function extractPlaceOfSupply(text: string) {
  const match = text.match(/place\s*of\s*supply\s*[:\-]?\s*([A-Za-z\s]+?)(?=\s+(?:bill|invoice|due|customer|gstin|#|product))/i);
  if (match && match[1]) {
    let place = match[1].trim();
    // In case boundary didn't catch, limit length
    if (place.length > 50) {
       place = place.split(/\s{2,}/)[0];
    }
    return place;
  }
  return null;
}

function extractMoneyAfterLabel(text: string, labelPattern: RegExp) {
  // Find the label, then capture the very next numeric value (ignoring non-numeric text like currency symbols)
  // We use a RegExp constructor to dynamically build the pattern since labelPattern is a regex.
  const regexStr = labelPattern.source + `\\s*[:\-]?\\s*[₹Rs.\\s]*([\\d,]+\\.\\d{1,2}|[\\d,]+)`;
  const regex = new RegExp(regexStr, 'i');
  const match = text.match(regex);
  if (match && match[1]) {
    const valueStr = match[1].replace(/,/g, "");
    const value = Number(valueStr);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function extractItems(text: string) {
  const items = [];
  
  // OCR table items are a contiguous block of space-separated tokens in this format:
  // 1 Premium T-Shirt - M 6109 20 450.00 18% 9,000.00
  // Since newlines are gone, we match a pattern that repeatedly finds:
  // Optional Line Number, Description, HSN (optional), Qty, Rate, GST (optional), Amount
  
  const startMatch = text.match(/(?:product\s+hsn\/sac\s+qty\s+rate|item\s+description\s+qty|product\s+qty\s+rate|amount)/i);
  const endMatch = text.match(/(?:subtotal|taxable|discount|total|amount\s+in\s+words)/i);
  
  if (startMatch && endMatch && endMatch.index !== undefined && startMatch.index !== undefined && endMatch.index > startMatch.index) {
    let tableText = text.substring(startMatch.index + startMatch[0].length, endMatch.index).trim();
    
    // Strip trailing headers if they got caught
    tableText = tableText.replace(/^(?:\s*GST\s*Amount\s*|\s*Amount\s*|\s*Rate\s*)+/i, "");
    
    // Regex for: optional number, name, optional HSN, qty, rate, optional GST%, amount
    const rowRegex = /(?:^|\s)(?:\d+\s+)?([A-Za-z0-9\- \.]+?)\s+(?:(\d{4,8})\s+)?(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d{1,2})?)\s+(?:(\d+(?:\.\d+)?)%?\s+)?([\d,]+(?:\.\d{1,2})?)(?=\s+\d+\s+[A-Za-z]|$)/g;
    
    let match;
    while ((match = rowRegex.exec(tableText)) !== null) {
      let name = match[1].trim();
      name = name.replace(/^\d+\s+/, "");
      
      items.push({
        productName: name,
        hsnSac: match[2] || null,
        quantity: Number(match[3]),
        unitPrice: Number(match[4].replace(/,/g, "")),
        gstRate: match[5] ? Number(match[5]) : null,
        amount: Number(match[6].replace(/,/g, ""))
      });
    }
  }

  return items;
}
