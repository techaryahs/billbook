import fs from 'fs';

const rawText = fs.readFileSync('scratch/real_ocr.txt', 'utf8');

function parseInvoiceText(text) {
  let normalizedText = text
    .replace(/\r?\n/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
    
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

function cleanGstin(val) {
  let cleaned = val.replace(/\s+/g, "").toUpperCase();
  // Don't replace Z with 2, Z is common (13th char is usually Z).
  cleaned = cleaned.replace(/O/g, "0").replace(/I/g, "1");
  return cleaned;
}

function extractSupplierName(text) {
  const match = text.match(/(?:TAX\s*INVOICE)?\s*(.+?)(?=\s+(?:\d{2,}\s+[A-Za-z]|GSTIN|Invoice|Bill|Phone|Mobile))/i);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (candidate.length > 3 && candidate.length < 100) return candidate;
  }
  return null;
}

function extractCustomerName(text) {
  const match = text.match(/(?:bill\s*to|customer|buyer|ship\s*to)\s*(.+?)(?=\s+(?:\d{2,}\s+[A-Za-z]|GSTIN|Invoice|Bill|Phone|Mobile|#|Product|Item))/i);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (candidate.length > 3 && candidate.length < 100) return candidate;
  }
  return null;
}

function extractGstin(text, type) {
  const gstinPattern = /([0-9SZO]{2}\s*[A-Z0-9]{5}\s*[0-9O]{4}\s*[A-Z0-9]\s*[1-9A-Z]\s*[Z2]\s*[0-9A-Z])/ig;
  const matches = [...text.matchAll(gstinPattern)];
  if (matches.length === 0) return null;
  
  if (type === "supplier") {
    return cleanGstin(matches[0][1]);
  } else {
    if (matches.length > 1) {
      return cleanGstin(matches[matches.length - 1][1]);
    }
  }
  return null;
}

function extractInvoiceNumber(text) {
  const patterns = [
    /(?:invoice|inv|bill)\s*(?:no|number|#)\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-_]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function extractDate(text, pattern) {
  const match = text.match(pattern);
  if (match && match[1]) return match[1].trim();
  return null;
}

function extractPlaceOfSupply(text) {
  const match = text.match(/place\s*of\s*supply\s*[:\-]?\s*([A-Za-z\s]+?)(?=\s+(?:bill|invoice|due|customer|gstin|#|product))/i);
  if (match && match[1]) {
    let place = match[1].trim();
    if (place.length > 50) {
       place = place.split(/\s{2,}/)[0];
    }
    return place;
  }
  return null;
}

function extractMoneyAfterLabel(text, labelPattern) {
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

function extractItems(text) {
  const items = [];
  
  const startMatch = text.match(/(?:product\s+hsn\/sac\s+qty\s+rate|item\s+description\s+qty|product\s+qty\s+rate|amount)/i);
  const endMatch = text.match(/(?:subtotal|taxable|discount|total|amount\s+in\s+words)/i);
  
  if (startMatch && endMatch && endMatch.index > startMatch.index) {
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

const result = parseInvoiceText(rawText);

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
};

assert(result.supplierName === "ABC Wholesale Traders", `Supplier: expected ABC Wholesale Traders, got ${result.supplierName}`);
assert(result.supplierGstin === "27AABCA1234F1Z5", `Supplier GSTIN: expected 27AABCA1234F1Z5, got ${result.supplierGstin}`);
assert(result.invoiceNumber === "INV-2026-1048", `Invoice Number: expected INV-2026-1048, got ${result.invoiceNumber}`);
assert(result.invoiceDate === "28-Sep-2026", `Invoice Date: expected 28-Sep-2026, got ${result.invoiceDate}`);
assert(result.dueDate === "28-Oct-2026", `Due Date: expected 28-Oct-2026, got ${result.dueDate}`);
assert(result.customerName === "Rahul Retail Store", `Customer: expected Rahul Retail Store, got ${result.customerName}`);
assert(result.customerGstin === "27BBBCD5678G1Z2", `Customer GSTIN: expected 27BBBCD5678G1Z2, got ${result.customerGstin}`);
assert(result.items.length === 4, `Items Length: expected 4, got ${result.items.length}`);
if (result.items.length === 4) {
    assert(result.items[0].productName === "Premium T-Shirt - M", `Item 1 Name: expected Premium T-Shirt - M, got ${result.items[0].productName}`);
    assert(result.items[0].quantity === 20, `Item 1 Qty: expected 20, got ${result.items[0].quantity}`);
    assert(result.items[1].quantity === 15, `Item 2 Qty: expected 15, got ${result.items[1].quantity}`);
    assert(result.items[2].quantity === 10, `Item 3 Qty: expected 10, got ${result.items[2].quantity}`);
    assert(result.items[3].quantity === 8, `Item 4 Qty: expected 8, got ${result.items[3].quantity}`);
}
assert(result.taxableAmount === 37000, `Taxable Amount: expected 37000, got ${result.taxableAmount}`);
assert(result.discount === 350, `Discount: expected 350, got ${result.discount}`);
assert(result.cgst === 3330, `CGST: expected 3330, got ${result.cgst}`);
assert(result.sgst === 3330, `SGST: expected 3330, got ${result.sgst}`);
assert(result.total === 43660, `Total: expected 43660, got ${result.total}`);

console.log("\nEXTRACTED DATA:");
console.log(JSON.stringify(result, null, 2));
