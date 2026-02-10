// utils/generatePdfBuffer.js

import pdf from "html-pdf-node";
import { generateReceiptHtml, generateTranscriptHtml } from "./generateReceiptHtml.js";

export async function generatePdfBuffer(transaction, paidAt, receiptNo) {
  const html = await generateReceiptHtml(transaction, paidAt, receiptNo);
  const file = { content: html }; 
  const options = { format: 'A4' };
  
  const pdfBuffer =  await pdf.generatePdf(file, options);
  return pdfBuffer;
}

export async function generateTranscriptPdfBuffer(transcriptData) {

  const html = await generateTranscriptHtml(transcriptData);
  const file = { content: html }; 
  const options = { format: 'A4' };
  
  const pdfBuffer =  await pdf.generatePdf(file, options);
  return pdfBuffer;
}

