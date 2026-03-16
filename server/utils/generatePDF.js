import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const generateInvoicePDF = (invoiceData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Company Header
            doc.fontSize(20).text('SAI PATHIRAKALIAMMAN TEXTILE PROCESS', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).text('Polyester Filament & Yarn Dyed Textiles', { align: 'center' });
            doc.moveDown(1);
            
            // Invoice Details
            doc.fontSize(14).text(`INVOICE: ${invoiceData.invoiceNumber}`, { align: 'left' });
            doc.fontSize(10).text(`Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}`);
            doc.text(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}`);
            doc.moveDown(1);
            
            // Client Details
            doc.fontSize(12).text('Bill To:', { underline: true });
            doc.fontSize(10).text(invoiceData.client.companyName);
            doc.text(invoiceData.client.address);
            doc.text(`GST: ${invoiceData.client.gstNumber}`);
            doc.moveDown(1);
            
            // Items Table
            const tableTop = doc.y;
            const itemX = 50;
            const qtyX = 300;
            const priceX = 350;
            const totalX = 450;
            
            doc.fontSize(10);
            doc.text('Description', itemX, tableTop);
            doc.text('Qty', qtyX, tableTop);
            doc.text('Price', priceX, tableTop);
            doc.text('Total', totalX, tableTop);
            
            doc.moveTo(50, tableTop + 15)
               .lineTo(550, tableTop + 15)
               .stroke();
            
            let y = tableTop + 25;
            invoiceData.items.forEach(item => {
                doc.text(item.description, itemX, y);
                doc.text(item.quantity.toString(), qtyX, y);
                doc.text(`Rs.${item.unitPrice.toFixed(2)}`, priceX, y);
                doc.text(`Rs.${item.total.toFixed(2)}`, totalX, y);
                y += 20;
            });
            
            // Summary
            y += 20;
            doc.text(`Subtotal: Rs.${invoiceData.subtotal.toFixed(2)}`, 350, y);
            y += 15;
            doc.text(`GST (18%): Rs.${invoiceData.gstAmount.toFixed(2)}`, 350, y);
            y += 15;
            doc.text(`Shipping: Rs.${invoiceData.shippingCharges.toFixed(2)}`, 350, y);
            y += 15;
            doc.text(`Discount: Rs.${invoiceData.discount.toFixed(2)}`, 350, y);
            y += 20;
            doc.fontSize(12).text(`Grand Total: Rs.${invoiceData.grandTotal.toFixed(2)}`, 350, y, { bold: true });
            
            // Payment Status
            y += 40;
            doc.fontSize(10).text(`Payment Status: ${invoiceData.paymentStatus.toUpperCase()}`, 50, y);
            doc.text(`Amount Paid: Rs.${invoiceData.amountPaid.toFixed(2)}`, 50, y + 15);
            doc.text(`Balance Due: Rs.${invoiceData.balanceDue.toFixed(2)}`, 50, y + 30);
            
            // Footer
            doc.fontSize(8).text('Thank you for your business!', 50, 700, { align: 'center' });
            doc.text('Sai Pathirakaliamman Textile Process | GSTIN: 33AABCU9603R1Z5', 50, 715, { align: 'center' });
            doc.text('Contact: +91 9876543210 | Email: info@saitextile.com', 50, 730, { align: 'center' });
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const generateSalesReportPDF = (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // Report Header
            doc.fontSize(18).text('SALES REPORT', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Period: ${reportData.period}`, { align: 'center' });
            doc.moveDown(1);
            
            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Orders: ${reportData.totalOrders || 0}`);
            doc.text(`Total Revenue: Rs.${(reportData.totalRevenue || 0).toLocaleString()}`);
            doc.text(`Average Order Value: Rs.${(reportData.averageOrderValue || 0).toLocaleString()}`);
            doc.moveDown(1);
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const generateInventoryReportPDF = (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // Report Header
            doc.fontSize(18).text('INVENTORY REPORT', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Period: ${reportData.period}`, { align: 'center' });
            doc.moveDown(1);
            
            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Items: ${reportData.totalItems || 0}`);
            doc.text(`Total Value: Rs.${(reportData.totalValue || 0).toLocaleString()}`);
            doc.text(`Low Stock Items: ${reportData.lowStockItems || 0}`);
            doc.text(`Out of Stock Items: ${reportData.outOfStockItems || 0}`);
            doc.moveDown(1);
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const generateFinancialReportPDF = (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // Report Header
            doc.fontSize(18).text('FINANCIAL REPORT', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Period: ${reportData.period}`, { align: 'center' });
            doc.moveDown(1);
            
            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Revenue: Rs.${(reportData.totalRevenue || 0).toLocaleString()}`);
            doc.text(`Total Expenses: Rs.${(reportData.totalExpenses || 0).toLocaleString()}`);
            doc.text(`Net Profit: Rs.${(reportData.netProfit || 0).toLocaleString()}`);
            doc.moveDown(1);
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const generateClientReportPDF = (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // Report Header
            doc.fontSize(18).text('CLIENT SUMMARY REPORT', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Period: ${reportData.period}`, { align: 'center' });
            doc.moveDown(1);
            
            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Orders: ${reportData.totalOrders || 0}`);
            doc.text(`Total Invoice Amount: Rs.${(reportData.totalInvoiceAmount || reportData.totalSpent || 0).toLocaleString('en-IN')}`);
            doc.text(`Total Paid: Rs.${(reportData.totalPaid || 0).toLocaleString('en-IN')}`);
            doc.text(`Total Outstanding: Rs.${(reportData.totalOutstanding || reportData.totalInvoiceAmount - reportData.totalPaid || 0).toLocaleString('en-IN')}`);
            doc.text(`Average Order Value: Rs.${(reportData.averageOrderValue || 0).toLocaleString('en-IN')}`);
            doc.moveDown(1);
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const generateInvoiceReportPDF = (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // Report Header
            doc.fontSize(18).text('INVOICE REPORT', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Period: ${reportData.period}`, { align: 'center' });
            doc.moveDown(1);
            
            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Invoices: ${reportData.totalInvoices || 0}`);
            doc.text(`Total Amount: Rs.${(reportData.totalAmount || 0).toLocaleString('en-IN')}`);
            doc.text(`Total Paid: Rs.${(reportData.totalPaid || 0).toLocaleString('en-IN')}`);
            doc.text(`Total Outstanding: Rs.${(reportData.totalOutstanding || 0).toLocaleString('en-IN')}`);
            doc.moveDown(1);
            
            // Invoice list
            if (reportData.invoices && Array.isArray(reportData.invoices) && reportData.invoices.length > 0) {
                doc.fontSize(12).text('Invoices:', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(9);
                reportData.invoices.forEach((inv, idx) => {
                    const date = inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '';
                    const clientName = inv.client?.companyName || inv.client?.name || 'N/A';
                    const amount = inv.grandTotal || 0;
                    const paid = inv.amountPaid || 0;
                    const status = inv.paymentStatus || 'N/A';
                    doc.text(`${idx + 1}. ${inv.invoiceNumber || ''} | ${clientName} | ${date} | Rs.${amount.toLocaleString('en-IN')} | Paid: Rs.${paid.toLocaleString('en-IN')} | ${status}`);
                });
            }
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const generateOrdersReportPDF = (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Report Header
            doc.fontSize(18).text('ORDERS REPORT', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Period: ${reportData.period}`, { align: 'center' });
            doc.moveDown(1);

            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Orders: ${reportData.totalOrders || 0}`);
            doc.text(`Total Spent: Rs.${(reportData.totalSpent || 0).toLocaleString()}`);
            doc.moveDown(1);

            // Orders list
            if (reportData.orders && Array.isArray(reportData.orders) && reportData.orders.length > 0) {
                doc.fontSize(12).text('Orders:', { underline: true });
                doc.moveDown(0.5);
                reportData.orders.forEach((o, idx) => {
                    const date = o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '';
                    const clientName = o.client?.companyName || o.client?.name || (o.client || '').toString();
                    const amount = o.grandTotal || o.totalAmount || o.total || 0;
                    const status = o.status || '';
                    doc.fontSize(10).text(`${idx + 1}. ${o.orderNumber || ''} | ${clientName} | ${date} | Rs.${amount.toLocaleString()} | ${status}`);
                });
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};


const generateProductionReportPDF = (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // Report Header
            doc.fontSize(18).text('PRODUCTION REPORT', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Period: ${reportData.period}`, { align: 'center' });
            doc.moveDown(1);
            
            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Batches: ${reportData.totalBatches}`);
            doc.text(`Total Quantity Produced: ${reportData.totalQuantity} kg`);
            doc.text(`Average Wastage: ${reportData.avgWastage}%`);
            doc.text(`Completion Rate: ${reportData.completionRate}%`);
            doc.moveDown(1);
            
            // Batch Details Table
            if (reportData.batches && reportData.batches.length > 0) {
                doc.fontSize(12).text('Batch Details:', { underline: true });
                doc.moveDown(0.5);
                
                reportData.batches.forEach((batch, index) => {
                    doc.fontSize(10);
                    doc.text(`${index + 1}. ${batch.batchNumber} - ${batch.productName}`);
                    doc.text(`   Status: ${batch.status} | Quantity: ${batch.quantity} kg | Wastage: ${batch.wastage}%`);
                    doc.moveDown(0.3);
                });
            }
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

export {
    generateInvoicePDF,
    generateProductionReportPDF,
    generateSalesReportPDF,
    generateInventoryReportPDF,
    generateFinancialReportPDF,
    generateClientReportPDF,
    generateOrdersReportPDF,
    generateInvoiceReportPDF
};

export default {
    invoice: generateInvoicePDF,
    production: generateProductionReportPDF,
    productionReport: generateProductionReportPDF,
    sales: generateSalesReportPDF,
    salesReport: generateSalesReportPDF,
    inventory: generateInventoryReportPDF,
    inventoryReport: generateInventoryReportPDF,
    financial: generateFinancialReportPDF,
    financialReport: generateFinancialReportPDF,
    client: generateClientReportPDF,
    clientReport: generateClientReportPDF,
    invoices: generateInvoiceReportPDF,
    invoiceReport: generateInvoiceReportPDF,
    ordersReport: generateOrdersReportPDF
};