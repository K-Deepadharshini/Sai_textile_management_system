import ExcelJS from 'exceljs';

const generateInventoryReportExcel = async (reportData) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Report');
    
    // Set column headers
    worksheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Item Name', key: 'itemName', width: 25 },
        { header: 'Current Stock', key: 'currentStock', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Last Updated', key: 'updatedAt', width: 20 }
    ];
    
    // Handle both object and array formats
    let items = [];
    if (Array.isArray(reportData)) {
        items = reportData;
    } else if (reportData && Array.isArray(reportData.byCategory)) {
        items = reportData.byCategory;
    } else if (reportData && Array.isArray(reportData.items)) {
        items = reportData.items;
    }
    
    // Add data rows
    items.forEach(item => {
        worksheet.addRow({
            category: item.category || '',
            itemName: item.itemName || item.name || '',
            currentStock: item.currentStock || item.quantity || 0,
            status: item.status || 'normal',
            updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''
        });
    });
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Apply conditional formatting for low stock
    items.forEach((item, index) => {
        const row = worksheet.getRow(index + 2);
        if (item.status === 'low-stock') {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFE0B2' } // Light orange
            };
        } else if (item.status === 'out-of-stock') {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFCCCC' } // Light red
            };
        }
    });

    // Add summary if it's an object with summary data
    if (reportData && typeof reportData === 'object' && !Array.isArray(reportData)) {
        const startRow = items.length + 3;
        worksheet.getCell(`A${startRow}`).value = 'SUMMARY';
        worksheet.getCell(`B${startRow}`).value = `Total Items: ${reportData.totalItems || items.length}`;
        worksheet.getCell(`B${startRow + 1}`).value = `Total Value: ${reportData.totalValue || 0}`;
        worksheet.getCell(`B${startRow + 2}`).value = `Low Stock Items: ${reportData.lowStockItems || 0}`;
        worksheet.getCell(`B${startRow + 3}`).value = `Out of Stock: ${reportData.outOfStockItems || 0}`;
        worksheet.getRow(startRow).font = { bold: true };
    }
    
    return await workbook.xlsx.writeBuffer();
};

const generateSalesReportExcel = async (reportData) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
        
        // reportData is a summary object: { period, totalOrders, totalRevenue, averageOrderValue, topProducts }
        const period = reportData.period || 'No Period';
        const totalOrders = reportData.totalOrders || 0;
        const totalRevenue = reportData.totalRevenue || 0;
        const averageOrderValue = reportData.averageOrderValue || 0;
        const topProducts = Array.isArray(reportData.topProducts) ? reportData.topProducts : [];

        // Add summary section
        let row = 1;
        worksheet.getCell(`A${row}`).value = 'SALES REPORT';
        worksheet.getRow(row).font = { bold: true, size: 14 };
        
        row = 2;
        worksheet.getCell(`A${row}`).value = 'Period:';
        worksheet.getCell(`B${row}`).value = period;
        
        row = 3;
        worksheet.getCell(`A${row}`).value = 'SUMMARY';
        worksheet.getRow(row).font = { bold: true };
        
        row = 4;
        worksheet.getCell(`A${row}`).value = 'Total Orders:';
        worksheet.getCell(`B${row}`).value = totalOrders;
        
        row = 5;
        worksheet.getCell(`A${row}`).value = 'Total Revenue:';
        worksheet.getCell(`B${row}`).value = totalRevenue;
        
        row = 6;
        worksheet.getCell(`A${row}`).value = 'Average Order Value:';
        worksheet.getCell(`B${row}`).value = averageOrderValue;

        // Add top products section
        if (topProducts.length > 0) {
            row = 8;
            worksheet.getCell(`A${row}`).value = 'TOP PRODUCTS';
            worksheet.getRow(row).font = { bold: true };
            
            row = 9;
            worksheet.getCell(`A${row}`).value = 'Product';
            worksheet.getCell(`B${row}`).value = 'Quantity';
            worksheet.getCell(`C${row}`).value = 'Revenue';
            worksheet.getRow(row).font = { bold: true };
            worksheet.getRow(row).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            topProducts.forEach((product, idx) => {
                row = 10 + idx;
                worksheet.getCell(`A${row}`).value = product.productName || product.name || '';
                worksheet.getCell(`B${row}`).value = product.quantity || 0;
                worksheet.getCell(`C${row}`).value = product.revenue || 0;
            });
        }

        worksheet.columns = [
            { header: 'Metric', key: 'metric', width: 25 },
            { header: 'Value', key: 'value', width: 20 },
            { header: 'Details', key: 'details', width: 25 }
        ];

        return await workbook.xlsx.writeBuffer();
    } catch (error) {
        console.error('Error generating sales report Excel:', error);
        throw error;
    }
};

const generateOrdersReportExcel = async (reportData) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders Report');

    worksheet.columns = [
        { header: 'Order Number', key: 'orderNumber', width: 18 },
        { header: 'Client', key: 'client', width: 25 },
        { header: 'Date', key: 'orderDate', width: 15 },
        { header: 'Subtotal', key: 'totalAmount', width: 15 },
        { header: 'GST', key: 'gstAmount', width: 12 },
        { header: 'Grand Total', key: 'grandTotal', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 }
    ];

    const orders = Array.isArray(reportData.orders) ? reportData.orders : (Array.isArray(reportData) ? reportData : []);

    orders.forEach(order => {
        worksheet.addRow({
            orderNumber: order.orderNumber,
            client: order.client?.companyName || order.client?.name || '',
            orderDate: order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '',
            totalAmount: order.totalAmount || order.subtotal || 0,
            gstAmount: order.gstAmount || order.gst || 0,
            grandTotal: order.grandTotal || order.total || 0,
            status: order.status,
            paymentStatus: order.paymentStatus
        });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Add summary rows
    const startRow = orders.length + 3;
    worksheet.getCell(`A${startRow}`).value = 'SUMMARY';
    worksheet.getCell(`B${startRow}`).value = `Total Orders: ${reportData.totalOrders || orders.length}`;
    worksheet.getCell(`B${startRow + 1}`).value = `Total Spent: ${reportData.totalSpent || orders.reduce((s,o)=>s + (o.grandTotal || o.total || 0), 0)}`;
    worksheet.getRow(startRow).font = { bold: true };

    return await workbook.xlsx.writeBuffer();
};

const generateProductionReportExcel = async (reportData) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Production Report');

        // reportData is a summary object: { period, totalBatches, totalQuantity, avgWastage, completionRate, batches }
        const period = reportData.period || 'No Period';
        const totalBatches = reportData.totalBatches || 0;
        const totalQuantity = reportData.totalQuantity || 0;
        const avgWastage = reportData.avgWastage || 0;
        const completionRate = reportData.completionRate || 0;
        const batches = Array.isArray(reportData.batches) ? reportData.batches : [];

        let row = 1;
        worksheet.getCell(`A${row}`).value = 'PRODUCTION REPORT';
        worksheet.getRow(row).font = { bold: true, size: 14 };
        
        row = 2;
        worksheet.getCell(`A${row}`).value = 'Period:';
        worksheet.getCell(`B${row}`).value = period;
        
        row = 3;
        worksheet.getCell(`A${row}`).value = 'SUMMARY';
        worksheet.getRow(row).font = { bold: true };
        
        row = 4;
        worksheet.getCell(`A${row}`).value = 'Total Batches:';
        worksheet.getCell(`B${row}`).value = totalBatches;
        
        row = 5;
        worksheet.getCell(`A${row}`).value = 'Total Quantity:';
        worksheet.getCell(`B${row}`).value = totalQuantity;
        
        row = 6;
        worksheet.getCell(`A${row}`).value = 'Avg Wastage:';
        worksheet.getCell(`B${row}`).value = avgWastage;

        row = 7;
        worksheet.getCell(`A${row}`).value = 'Completion Rate:';
        worksheet.getCell(`B${row}`).value = `${completionRate}%`;

        // Add batch details if available
        if (batches.length > 0) {
            row = 9;
            worksheet.getCell(`A${row}`).value = 'BATCH DETAILS';
            worksheet.getRow(row).font = { bold: true };
            
            row = 10;
            worksheet.getCell(`A${row}`).value = 'Batch Number';
            worksheet.getCell(`B${row}`).value = 'Product';
            worksheet.getCell(`C${row}`).value = 'Status';
            worksheet.getCell(`D${row}`).value = 'Quantity';
            worksheet.getCell(`E${row}`).value = 'Wastage';
            worksheet.getRow(row).font = { bold: true };
            worksheet.getRow(row).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            batches.forEach((batch, idx) => {
                row = 11 + idx;
                worksheet.getCell(`A${row}`).value = batch.batchNumber || '';
                worksheet.getCell(`B${row}`).value = batch.productName || '';
                worksheet.getCell(`C${row}`).value = batch.status || '';
                worksheet.getCell(`D${row}`).value = batch.quantity || 0;
                worksheet.getCell(`E${row}`).value = batch.wastage || 0;
            });
        }

        worksheet.columns = [
            { header: 'Batch Number', key: 'batchNumber', width: 18 },
            { header: 'Product', key: 'productName', width: 25 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Quantity', key: 'quantity', width: 15 },
            { header: 'Wastage', key: 'wastage', width: 12 }
        ];

        return await workbook.xlsx.writeBuffer();
    } catch (error) {
        console.error('Error generating production report Excel:', error);
        throw error;
    }
};

const generateFinancialReportExcel = async (reportData) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Financial Report');

        // reportData is a summary object: { period, totalOrders, totalRevenue, averageOrderValue }
        const period = reportData.period || 'No Period';
        const totalOrders = reportData.totalOrders || 0;
        const totalRevenue = reportData.totalRevenue || 0;
        const averageOrderValue = reportData.averageOrderValue || 0;

        let row = 1;
        worksheet.getCell(`A${row}`).value = 'FINANCIAL REPORT';
        worksheet.getRow(row).font = { bold: true, size: 14 };
        
        row = 2;
        worksheet.getCell(`A${row}`).value = 'Period:';
        worksheet.getCell(`B${row}`).value = period;
        
        row = 3;
        worksheet.getCell(`A${row}`).value = 'SUMMARY';
        worksheet.getRow(row).font = { bold: true };
        
        row = 4;
        worksheet.getCell(`A${row}`).value = 'Total Orders:';
        worksheet.getCell(`B${row}`).value = totalOrders;
        
        row = 5;
        worksheet.getCell(`A${row}`).value = 'Total Revenue:';
        worksheet.getCell(`B${row}`).value = `₹${totalRevenue.toLocaleString()}`;
        
        row = 6;
        worksheet.getCell(`A${row}`).value = 'Average Order Value:';
        worksheet.getCell(`B${row}`).value = `₹${averageOrderValue.toLocaleString()}`;

        worksheet.columns = [
            { header: 'Metric', key: 'metric', width: 25 },
            { header: 'Value', key: 'value', width: 20 }
        ];

        return await workbook.xlsx.writeBuffer();
    } catch (error) {
        console.error('Error generating financial report Excel:', error);
        throw error;
    }
};

const generateClientReportExcel = async (reportData) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Client Summary Report');

        // reportData is a summary object: { period, totalOrders, totalInvoiceAmount, totalPaid, totalOutstanding, averageOrderValue }
        const period = reportData.period || 'No Period';
        const totalOrders = reportData.totalOrders || 0;
        const totalInvoiceAmount = reportData.totalInvoiceAmount || reportData.totalSpent || 0;
        const totalPaid = reportData.totalPaid || 0;
        const totalOutstanding = reportData.totalOutstanding || 0;
        const averageOrderValue = reportData.averageOrderValue || 0;

        let row = 1;
        worksheet.getCell(`A${row}`).value = 'CLIENT SUMMARY REPORT';
        worksheet.getRow(row).font = { bold: true, size: 14 };
        
        row = 2;
        worksheet.getCell(`A${row}`).value = 'Period:';
        worksheet.getCell(`B${row}`).value = period;
        
        row = 3;
        worksheet.getCell(`A${row}`).value = 'SUMMARY';
        worksheet.getRow(row).font = { bold: true };
        
        row = 4;
        worksheet.getCell(`A${row}`).value = 'Total Orders:';
        worksheet.getCell(`B${row}`).value = totalOrders;
        
        row = 5;
        worksheet.getCell(`A${row}`).value = 'Total Invoice Amount:';
        worksheet.getCell(`B${row}`).value = `₹${totalInvoiceAmount.toLocaleString('en-IN')}`;
        
        row = 6;
        worksheet.getCell(`A${row}`).value = 'Total Paid:';
        worksheet.getCell(`B${row}`).value = `₹${totalPaid.toLocaleString('en-IN')}`;
        
        row = 7;
        worksheet.getCell(`A${row}`).value = 'Total Outstanding:';
        worksheet.getCell(`B${row}`).value = `₹${totalOutstanding.toLocaleString('en-IN')}`;
        
        row = 8;
        worksheet.getCell(`A${row}`).value = 'Average Order Value:';
        worksheet.getCell(`B${row}`).value = `₹${averageOrderValue.toLocaleString('en-IN')}`;

        worksheet.columns = [
            { header: 'Metric', key: 'metric', width: 25 },
            { header: 'Value', key: 'value', width: 20 }
        ];

        return await workbook.xlsx.writeBuffer();
    } catch (error) {
        console.error('Error generating client report Excel:', error);
        throw error;
    }
};

const generateInvoicesReportExcel = async (reportData) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Invoices Report');

        // reportData is a summary object: { period, totalInvoices, totalAmount, totalPaid, totalOutstanding, invoices }
        const period = reportData.period || 'No Period';
        const totalInvoices = reportData.totalInvoices || 0;
        const totalAmount = reportData.totalAmount || 0;
        const totalPaid = reportData.totalPaid || 0;
        const totalOutstanding = reportData.totalOutstanding || 0;
        const invoicesList = Array.isArray(reportData.invoices) ? reportData.invoices : [];

        let row = 1;
        worksheet.getCell(`A${row}`).value = 'INVOICES REPORT';
        worksheet.getRow(row).font = { bold: true, size: 14 };
        
        row = 2;
        worksheet.getCell(`A${row}`).value = 'Period:';
        worksheet.getCell(`B${row}`).value = period;
        
        row = 3;
        worksheet.getCell(`A${row}`).value = 'SUMMARY';
        worksheet.getRow(row).font = { bold: true };
        
        row = 4;
        worksheet.getCell(`A${row}`).value = 'Total Invoices:';
        worksheet.getCell(`B${row}`).value = totalInvoices;
        
        row = 5;
        worksheet.getCell(`A${row}`).value = 'Total Amount:';
        worksheet.getCell(`B${row}`).value = `₹${totalAmount.toLocaleString('en-IN')}`;
        
        row = 6;
        worksheet.getCell(`A${row}`).value = 'Total Paid:';
        worksheet.getCell(`B${row}`).value = `₹${totalPaid.toLocaleString('en-IN')}`;
        
        row = 7;
        worksheet.getCell(`A${row}`).value = 'Total Outstanding:';
        worksheet.getCell(`B${row}`).value = `₹${totalOutstanding.toLocaleString('en-IN')}`;

        // Add invoices list if available
        if (invoicesList.length > 0) {
            row = 9;
            worksheet.getCell(`A${row}`).value = 'INVOICE DETAILS';
            worksheet.getRow(row).font = { bold: true };
            
            row = 10;
            worksheet.getCell(`A${row}`).value = 'Invoice No';
            worksheet.getCell(`B${row}`).value = 'Date';
            worksheet.getCell(`C${row}`).value = 'Amount';
            worksheet.getCell(`D${row}`).value = 'Paid';
            worksheet.getCell(`E${row}`).value = 'Outstanding';
            worksheet.getCell(`F${row}`).value = 'Status';
            worksheet.getRow(row).font = { bold: true };
            worksheet.getRow(row).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            invoicesList.forEach((invoice, idx) => {
                row = 11 + idx;
                const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : '';
                worksheet.getCell(`A${row}`).value = invoice.invoiceNumber || '';
                worksheet.getCell(`B${row}`).value = invoiceDate;
                worksheet.getCell(`C${row}`).value = invoice.grandTotal || 0;
                worksheet.getCell(`D${row}`).value = invoice.amountPaid || 0;
                worksheet.getCell(`E${row}`).value = invoice.balanceDue || 0;
                worksheet.getCell(`F${row}`).value = invoice.paymentStatus || '';
            });
        }

        worksheet.columns = [
            { header: 'Metric', key: 'metric', width: 20 },
            { header: 'Value', key: 'value', width: 20 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Paid', key: 'paid', width: 15 },
            { header: 'Outstanding', key: 'outstanding', width: 15 }
        ];

        return await workbook.xlsx.writeBuffer();
    } catch (error) {
        console.error('Error generating invoices report Excel:', error);
        throw error;
    }
};

export {
    generateInventoryReportExcel,
    generateSalesReportExcel,
    generateOrdersReportExcel,
    generateProductionReportExcel,
    generateFinancialReportExcel,
    generateClientReportExcel,
    generateInvoicesReportExcel
};

export default {
    inventory: generateInventoryReportExcel,
    sales: generateSalesReportExcel,
    salesReport: generateSalesReportExcel,
    production: generateProductionReportExcel,
    productionReport: generateProductionReportExcel,
    inventoryReport: generateInventoryReportExcel,
    financialReport: generateFinancialReportExcel,
    clientReport: generateClientReportExcel,
    ordersReport: generateOrdersReportExcel,
    invoicesReport: generateInvoicesReportExcel
};