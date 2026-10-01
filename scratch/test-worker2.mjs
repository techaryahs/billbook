import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist';

// try setting local path
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

async function run() {
  const data = new Uint8Array(fs.readFileSync('package.json')); // Just any file to see if worker fails
  try {
     const loadingTask = pdfjsLib.getDocument({ data });
     await loadingTask.promise;
  } catch (e) {
     console.log("Error:", e.message);
  }
}

run();
