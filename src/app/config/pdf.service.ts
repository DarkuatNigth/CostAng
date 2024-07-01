import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  async mergePDFs(pdfFiles: any[] /* File[] */): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const pdfFile of pdfFiles) {
      const pdfData = pdfFile;/* await this.readFile(pdfFile); */
      const pdfDoc = await PDFDocument.load(pdfData);

      const pageCount = pdfDoc.getPageCount();
      for (let i = 0; i < pageCount; i++) {
        const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [i]);
        mergedPdf.addPage(copiedPage);
      }
    }

    return await mergedPdf.save();
  }

  private async readFile(file: File): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  async generatePDFWithSignature(pdf, signature,width, height,xCoordinate,yCoordinate,signatureWidth,signatureHeight) {
    // Load the existing PDF template
    
    const existingPdfBytes = pdf; // Load the existing PDF bytes
  
    // Load the signature image
    const signatureImageBytes = await this.readFileAsArrayBuffer(signature);
  
    // Create a PDF document
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
    // Embed the signature image on a new page
    const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
    //debugger;
    //const page = pdfDoc.addPage([width, height]);
    for (let index = 0; index < pdfDoc.getPageCount(); index++) {
      let page = pdfDoc.getPage(index);
      page.drawImage(signatureImage, {
        x: xCoordinate,
        y: yCoordinate,
        width: signatureWidth,
        height: signatureHeight,
      });
  }
    
  
    // Save the modified PDF
    //const modifiedPdfBytes = await pdfDoc.save();
    return await  pdfDoc.save();
    
  }
  
  private async readFileAsArrayBuffer(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  }
}