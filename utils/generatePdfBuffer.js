// utils/generatePdfBuffer.js

import pdf from "html-pdf-node";
import { generateReceiptHtml } from "./generateReceiptHtml.js";

export async function generatePdfBuffer(transaction, paidAt, receiptNo) {
  const html = await generateReceiptHtml(transaction, paidAt, receiptNo);
  const file = { content: html }; // Your receipt HTML
  const options = { format: 'A4' };
  
  const pdfBuffer =  await pdf.generatePdf(file, options);
  return pdfBuffer;
}

