import fs from 'fs';
import PDFDocument from 'pdfkit';
import path from 'path';

interface InvoiceItem {
  title: string;
  price: number;
  quantity: number;
  finalPrice: number;
}

interface InvoiceData {
  orderCode: string;
  date: Date;
  items: InvoiceItem[];
  subTotal: number;
  paidAmount: number;
  shipping: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
}

export default function createInvoice(invoice: InvoiceData, fileName: string): void {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filePath = path.resolve(`./Files/${fileName}`);

  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc.fillColor('#444444').fontSize(20).text('E-Commerce Store', 50, 57);
  doc
    .fillColor('#630E2B')
    .fontSize(10)
    .text('6 Tahrir Street', 200, 65, { align: 'right' })
    .text('Cairo, Egypt', 200, 80, { align: 'right' })
    .moveDown();

  // Divider
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 105).lineTo(550, 105).stroke();

  doc.fillColor('#444444').fontSize(20).text('Invoice', 50, 130);

  // Customer info
  doc
    .fontSize(10)
    .text('Order Code:', 50, 170)
    .font('Helvetica-Bold')
    .text(invoice.orderCode, 150, 170)
    .font('Helvetica')
    .text('Date:', 50, 190)
    .text(formatDate(invoice.date), 150, 190)
    .font('Helvetica-Bold')
    .text(invoice.shipping.name, 300, 170)
    .font('Helvetica')
    .text(invoice.shipping.address, 300, 185)
    .text(`${invoice.shipping.city}, ${invoice.shipping.country}`, 300, 200)
    .moveDown();

  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 220).lineTo(550, 220).stroke();

  // Table header
  const tableTop = 250;
  doc.font('Helvetica-Bold');
  doc.fontSize(10).text('Product', 50, tableTop).text('Unit Price', 250, tableTop).text('Qty', 370, tableTop).text('Total', 450, tableTop);
  doc.font('Helvetica');
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // Items
  let y = tableTop + 25;
  for (const item of invoice.items) {
    doc
      .text(item.title, 50, y)
      .text(`${item.price} EGP`, 250, y)
      .text(String(item.quantity), 370, y)
      .text(`${item.finalPrice} EGP`, 450, y);
    y += 25;
  }

  // Totals
  y += 10;
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
  y += 15;
  doc.font('Helvetica-Bold').text('Sub Total:', 350, y).text(`${invoice.subTotal} EGP`, 450, y);
  y += 20;
  doc.text('Paid Amount:', 350, y).text(`${invoice.paidAmount} EGP`, 450, y);

  doc.font('Helvetica').fontSize(10).text('Payment is due within 15 days. Thank you for your business.', 50, 750, {
    align: 'center',
    width: 500,
  });

  doc.end();
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}
