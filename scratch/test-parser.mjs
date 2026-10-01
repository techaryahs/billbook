import fs from 'fs';

const rawText = fs.readFileSync('scratch/mock_ocr.txt', 'utf8');

function parseInvoiceText(text) {
  const normalizedText = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
    
  const lines = normalizedText.split("\n").map(l => l.trim()).filter(Boolean);

  const supplierGstin = extractGstin(lines, "supplier");
  const customerGstin = extractGstin(lines, "customer");
  const invoiceNumber = extractInvoiceNumber(lines);
  
  return {
    supplierName: extractSupplierName(lines),
    supplierGstin: supplierGstin,
    supplierAddress: null,
    invoiceNumber: invoiceNumber,
    invoiceDate: extractDate(lines, /(?:invoice\s*date|date)\s*[:\-]?\s*([0-9]{1,2}[-/][A-Za-z0-9]{2,4}[-/][0-9]{2,4})/i),
    dueDate: extractDate(lines, /due\s*date\s*[:\-]?\s*([0-9]{1,2}[-/][A-Za-z0-9]{2,4}[-/][0-9]{2,4})/i),
    placeOfSupply: extractPlaceOfSupply(lines),
    customerName: extractCustomerName(lines),
    customerGstin: customerGstin,
    customerAddress: null,
    taxableAmount: extractMoney(lines, /(?:taxable|taxable\s*amount|taxable\s*value)/i),
    cgst: extractMoney(lines, /^cgst/i),
    sgst: extractMoney(lines, /^sgst/i),
    igst: extractMoney(lines, /^igst/i),
    discount: extractMoney(lines, /discount/i),
    total: extractMoney(lines, /(?:grand\s*total|total\s*amount|invoice\s*total|^total|net\s*amount)/i),
    items: extractItems(lines)
  };
}

function cleanValue(value) {
  const cleaned = (value || "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function extractSupplierName(lines) {
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    if (/\b([0-9SZO]{2}\s*[A-Z0-9]{5}\s*[0-9O]{4}\s*[A-Z0-9]\s*[1-9A-Z]\s*[Z2]\s*[0-9A-Z])\b/i.test(line)) continue;
    if (/(?:invoice|inv)\s*(?:no|number|#)/i.test(line)) continue;
    if (/(?:invoice\s*date|date|due\s*date)/i.test(line)) continue;
    if (/bill\s*to|customer|buyer/i.test(line)) continue;
    
    const candidate = line.replace(/supplier|seller|vendor|from/gi, "").replace(/^[:\-]/, "").trim();
    if (candidate.length >= 4 && candidate.length <= 80) {
      return candidate;
    }
  }
  return null;
}

function extractCustomerName(lines) {
  const index = lines.findIndex((line) => /bill\s*to|customer|buyer|ship\s*to/i.test(line));
  if (index >= 0) {
    const currentLine = lines[index].replace(/bill\s*to|customer|buyer|ship\s*to/gi, "").replace(/^[:\-]/, "").trim();
    if (currentLine && currentLine.length < 80) return currentLine;
    
    for (let i = index + 1; i < Math.min(index + 5, lines.length); i++) {
       const line = lines[i];
       if (/\b([0-9SZO]{2}\s*[A-Z0-9]{5}\s*[0-9O]{4}\s*[A-Z0-9]\s*[1-9A-Z]\s*[Z2]\s*[0-9A-Z])\b/i.test(line)) continue;
       if (/(?:item|product|qty|rate|amount)/i.test(line)) break;
       if (line.length >= 3 && line.length <= 80) {
           return line;
       }
    }
  }
  return null;
}

function cleanGstin(val) {
  let cleaned = val.replace(/\s+/g, "").toUpperCase();
  cleaned = cleaned.replace(/O/g, "0").replace(/S/g, "5").replace(/I/g, "1").replace(/Z/g, "2");
  return cleaned;
}

function extractGstin(lines, type) {
  const gstinPattern = /\b([0-9SZO]{2}\s*[A-Z0-9]{5}\s*[0-9O]{4}\s*[A-Z0-9]\s*[1-9A-Z]\s*[Z2]\s*[0-9A-Z])\b/i;
  
  if (type === "supplier") {
     for (let i = 0; i < Math.min(lines.length, 20); i++) {
        if (/bill\s*to|customer|buyer/i.test(lines[i])) break;
        const match = lines[i].match(gstinPattern);
        if (match) return cleanGstin(match[1]);
     }
  } else {
     const index = lines.findIndex((line) => /bill\s*to|customer|buyer/i.test(line));
     if (index >= 0) {
        for (let i = index; i < Math.min(lines.length, index + 15); i++) {
           const match = lines[i].match(gstinPattern);
           if (match) return cleanGstin(match[1]);
        }
     }
  }
  return null;
}

function extractInvoiceNumber(lines) {
  const patterns = [
    /(?:invoice|inv)\s*(?:no|number|#)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-_]+)/i,
    /(?:bill)\s*(?:no|number|#)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-_]+)/i,
  ];
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i];
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    if (/(?:invoice|inv|bill)\s*(?:no|number|#)\s*[:\-]?$/i.test(line) && i + 1 < lines.length) {
       const nextLine = lines[i + 1].trim();
       if (/^[A-Z0-9][A-Z0-9\/\-_]+$/.test(nextLine)) {
          return nextLine;
       }
    }
  }
  return null;
}

function extractDate(lines, pattern) {
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const match = lines[i].match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function extractMoney(lines, labelPattern) {
  for (let i = Math.max(0, lines.length - 20); i < lines.length; i++) {
     const line = lines[i];
     if (labelPattern.test(line)) {
        // Find the last numeric looking string in the line
        const matches = line.match(/[\d,]+(?:\.\d{1,2})?/g);
        if (matches && matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            const value = Number(lastMatch.replace(/,/g, ""));
            if (Number.isFinite(value)) return value;
        }
     }
  }
  return null;
}

function extractPlaceOfSupply(lines) {
  for (const line of lines) {
    const match = line.match(/place\s*of\s*supply\s*[:\-]?\s*([A-Za-z\s]+)(?:[0-9]|$)/i);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function extractItems(lines) {
  const items = [];
  let inTable = false;
  
  for (const line of lines) {
    if (!inTable && /(?:item|product|description)\s+(?:hsn|sac|qty|quantity|rate|price|amount|total)/i.test(line)) {
       inTable = true;
       continue;
    }
    
    // Look for row structure
    // E.g. Premium T-Shirt - M 6109 20 450 18% 9000
    // Sometimes OCR misses spaces or adds too many. 
    // Usually: [Name] [Code/Numbers...]
    const match = line.match(/^(.+?)\s+(\d{4,8})?\s*(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d{1,2})?)\s+(\d+(?:\.\d+)?)%?\s+([\d,]+(?:\.\d{1,2})?)$/);
    if (match) {
      items.push({
        productName: match[1].trim(),
        hsnSac: match[2] || null,
        quantity: Number(match[3]),
        unitPrice: Number(match[4].replace(/,/g, "")),
        gstRate: Number(match[5]),
        amount: Number(match[6].replace(/,/g, ""))
      });
      inTable = true;
    }
  }
  
  return items;
}

console.log(JSON.stringify(parseInvoiceText(rawText), null, 2));
