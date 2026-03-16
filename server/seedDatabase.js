import mongoose from 'mongoose';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import ProductionBatch from './models/ProductionBatch.js';
import Inventory from './models/Inventory.js';
import Invoice from './models/Invoice.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function seedDatabase() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sai-textile-management';
    console.log('Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Database Connection: SUCCESS\n');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await ProductionBatch.deleteMany({});
    await Inventory.deleteMany({});
    await Invoice.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@textile.com',
      password: hashedAdminPassword,
      role: 'admin',
      phone: '1234567890',
      address: {
        street: '123 Admin St',
        city: 'New York',
        state: 'NY',
        pincode: '10001',
        country: 'USA'
      }
    });
    console.log('✓ Admin user created:', admin.email);

    // Create test client 1
    const hashedClientPassword = await bcrypt.hash('client123', 10);
    const client1 = await User.create({
      name: 'John Client',
      email: 'john@client.com',
      password: hashedClientPassword,
      role: 'client',
      phone: '9876543210',
      companyName: 'John Textiles',
      gstNumber: 'GST001234567890',
      address: {
        street: '456 Client Ave',
        city: 'Los Angeles',
        state: 'CA',
        pincode: '90001',
        country: 'USA'
      }
    });
    console.log('✓ Client 1 created:', client1.email);

    // Create test client 2
    const client2 = await User.create({
      name: 'Sarah Client',
      email: 'sarah@client.com',
      password: hashedClientPassword,
      role: 'client',
      phone: '5555555555',
      companyName: 'Sarah Fashion',
      gstNumber: 'GST009876543210',
      address: {
        street: '789 Fashion Blvd',
        city: 'Chicago',
        state: 'IL',
        pincode: '60601',
        country: 'USA'
      }
    });
    console.log('✓ Client 2 created:', client2.email);

    // Create sample products
    console.log('\nCreating sample products...');
    const products = [
      {
        productCode: 'PF-150-01',
        name: 'Polyester Filament 150D',
        type: 'polyester-filament',
        denier: '150D',
        shade: { colorCode: 'WH001', colorName: 'White', hexCode: '#FFFFFF' },
        specifications: { twist: 'S/Z 80', luster: 'Semi Dull', tenacity: '4.5 g/d', elongation: '25%' },
        moq: 100,
        unit: 'kg',
        price: 180,
        gstPercentage: 18,
        description: 'High quality polyester filament yarn for textile manufacturing',
        createdBy: admin._id
      },
      {
        productCode: 'YD-300-02',
        name: 'Yarn Dyed 300D',
        type: 'yarn-dyed',
        denier: '300D',
        shade: { colorCode: 'BL001', colorName: 'Navy Blue', hexCode: '#000080' },
        specifications: { twist: 'S/Z 100', luster: 'Bright', tenacity: '5.0 g/d', elongation: '22%' },
        moq: 50,
        unit: 'kg',
        price: 250,
        gstPercentage: 18,
        description: 'Colorfast yarn dyed polyester for premium applications',
        createdBy: admin._id
      },
      {
        productCode: 'RY-75-03',
        name: 'Raw Yarn 75D',
        type: 'raw-yarn',
        denier: '75D',
        shade: { colorCode: 'GY001', colorName: 'Gray', hexCode: '#808080' },
        specifications: { twist: 'S/Z 60', luster: 'Raw', tenacity: '4.0 g/d', elongation: '28%' },
        moq: 200,
        unit: 'kg',
        price: 120,
        gstPercentage: 18,
        description: 'Raw polyester yarn for dyeing and processing',
        createdBy: admin._id
      },
      {
        productCode: 'PF-450-04',
        name: 'Polyester Filament 450D',
        type: 'polyester-filament',
        denier: '450D',
        shade: { colorCode: 'BK001', colorName: 'Black', hexCode: '#000000' },
        specifications: { twist: 'S/Z 120', luster: 'Full Dull', tenacity: '5.5 g/d', elongation: '20%' },
        moq: 25,
        unit: 'kg',
        price: 320,
        gstPercentage: 18,
        description: 'Heavy denier polyester filament for industrial use',
        createdBy: admin._id
      }
    ];

    const createdProducts = [];
    for (const productData of products) {
      const product = await Product.create(productData);
      createdProducts.push(product);
      console.log('✓ Product created:', product.productCode, '-', product.name);
    }

    // Create sample orders
    console.log('\nCreating sample orders...');
    const orders = [
      {
        orderNumber: 'ORD-2024-001',
        client: client1._id,
        items: [
          {
            product: createdProducts[0]._id,
            quantity: 150,
            unitPrice: 180,
            gstPercentage: 18,
            totalPrice: 150 * 180
          },
          {
            product: createdProducts[1]._id,
            quantity: 75,
            unitPrice: 250,
            gstPercentage: 18,
            totalPrice: 75 * 250
          }
        ],
        totalAmount: (150 * 180) + (75 * 250),
        gstAmount: (((150 * 180) + (75 * 250)) * 18) / 100,
        grandTotal: ((150 * 180) + (75 * 250)) * 1.18,
        status: 'delivered',
        orderDate: new Date('2024-01-15'),
        deliveryDate: new Date('2024-02-15'),
        notes: 'Urgent delivery required'
      },
      {
        orderNumber: 'ORD-2024-002',
        client: client2._id,
        items: [
          {
            product: createdProducts[2]._id,
            quantity: 300,
            unitPrice: 120,
            gstPercentage: 18,
            totalPrice: 300 * 120
          }
        ],
        totalAmount: 300 * 120,
        gstAmount: (300 * 120 * 18) / 100,
        grandTotal: 300 * 120 * 1.18,
        status: 'in-production',
        orderDate: new Date('2024-02-01'),
        deliveryDate: new Date('2024-03-01'),
        notes: 'Standard delivery'
      },
      {
        orderNumber: 'ORD-2024-003',
        client: client1._id,
        items: [
          {
            product: createdProducts[3]._id,
            quantity: 50,
            unitPrice: 320,
            gstPercentage: 18,
            totalPrice: 50 * 320
          },
          {
            product: createdProducts[0]._id,
            quantity: 100,
            unitPrice: 180,
            gstPercentage: 18,
            totalPrice: 100 * 180
          }
        ],
        totalAmount: (50 * 320) + (100 * 180),
        gstAmount: (((50 * 320) + (100 * 180)) * 18) / 100,
        grandTotal: ((50 * 320) + (100 * 180)) * 1.18,
        status: 'pending',
        orderDate: new Date('2024-02-20'),
        deliveryDate: new Date('2024-03-20'),
        notes: 'High priority order'
      }
    ];

    const createdOrders = [];
    for (const orderData of orders) {
      const order = await Order.create(orderData);
      createdOrders.push(order);
      console.log('✓ Order created:', order.orderNumber, '-', order.status);
    }

    // Create sample production batches
    console.log('\nCreating sample production batches...');
    const productionBatches = [
      {
        batchNumber: 'PB-2024-001',
        product: createdProducts[0]._id,
        quantityProduced: 200,
        unit: 'kg',
        status: 'completed',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-20'),
        qualityCheck: {
          checkedBy: 'John Smith',
          checkDate: new Date('2024-01-20'),
          result: 'passed',
          remarks: 'All quality parameters met'
        },
        machineDetails: {
          machineId: 'M001',
          machineName: 'Machine A1',
          operator: 'John Smith'
        },
        createdBy: admin._id,
        notes: 'First batch of 150D filament'
      },
      {
        batchNumber: 'PB-2024-002',
        product: createdProducts[1]._id,
        quantityProduced: 100,
        unit: 'kg',
        status: 'in-progress',
        startDate: new Date('2024-02-05'),
        qualityCheck: {
          checkedBy: null,
          checkDate: null,
          result: 'passed',
          remarks: 'Quality check pending'
        },
        machineDetails: {
          machineId: 'M002',
          machineName: 'Machine B2',
          operator: 'Sarah Johnson'
        },
        createdBy: admin._id,
        notes: 'Yarn dyed production'
      },
      {
        batchNumber: 'PB-2024-003',
        product: createdProducts[2]._id,
        quantityProduced: 150,
        unit: 'kg',
        status: 'completed',
        startDate: new Date('2024-01-25'),
        endDate: new Date('2024-02-05'),
        qualityCheck: {
          checkedBy: 'Mike Davis',
          checkDate: new Date('2024-02-05'),
          result: 'passed',
          remarks: 'Excellent quality achieved'
        },
        machineDetails: {
          machineId: 'M003',
          machineName: 'Machine C3',
          operator: 'Mike Davis'
        },
        createdBy: admin._id,
        notes: 'Raw yarn production'
      }
    ];

    const createdProductionBatches = [];
    for (const batchData of productionBatches) {
      const batch = await ProductionBatch.create(batchData);
      createdProductionBatches.push(batch);
      console.log('✓ Production batch created:', batch.batchNumber, '-', batch.status);
    }

    // Update product stock quantities
    console.log('\nUpdating product stock quantities...');
    await Product.findByIdAndUpdate(createdProducts[0]._id, { stockQuantity: 500 });
    await Product.findByIdAndUpdate(createdProducts[1]._id, { stockQuantity: 25 });
    await Product.findByIdAndUpdate(createdProducts[2]._id, { stockQuantity: 800 });
    await Product.findByIdAndUpdate(createdProducts[3]._id, { stockQuantity: 0 });

    // Create sample inventory items (raw materials)
    console.log('\nCreating sample inventory...');
    const inventoryItems = [
      {
        itemCode: 'PC-001',
        itemName: 'Polyester Chips - Virgin',
        itemType: 'raw-material',
        category: 'polyester-chips',
        unit: 'kg',
        currentStock: 2000,
        minStockLevel: 500,
        maxStockLevel: 5000,
        reorderPoint: 1000,
        supplierDetails: {
          name: 'ABC Polymers',
          contact: '+91-9876543210',
          email: 'contact@abcpolymers.com',
          leadTime: 7
        },
        location: {
          warehouse: 'Warehouse A',
          rack: 'R1',
          shelf: 'S1'
        },
        notes: 'High quality virgin polyester chips'
      },
      {
        itemCode: 'DYE-001',
        itemName: 'Disperse Blue Dye',
        itemType: 'chemicals',
        category: 'dyes',
        unit: 'kg',
        currentStock: 150,
        minStockLevel: 50,
        maxStockLevel: 500,
        reorderPoint: 100,
        supplierDetails: {
          name: 'ColorTech Industries',
          contact: '+91-8765432109',
          email: 'sales@colortech.com',
          leadTime: 5
        },
        location: {
          warehouse: 'Chemical Store',
          rack: 'C1',
          shelf: 'D1'
        },
        notes: 'For yarn dyeing operations'
      }
    ];

    const createdInventory = [];
    for (const inventoryData of inventoryItems) {
      const inventory = await Inventory.create(inventoryData);
      createdInventory.push(inventory);
      console.log('✓ Inventory created for:', inventory.itemName, '-', inventory.currentStock, inventory.unit);
    }

    // Create sample invoices
    console.log('\nCreating sample invoices...');
    const invoices = [
      {
        invoiceNumber: 'INV-2024-001',
        order: createdOrders[0]._id,
        client: client1._id,
        invoiceDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-20'),
        items: [
          {
            description: 'Polyester Filament 150D',
            quantity: 150,
            unitPrice: 180,
            amount: 150 * 180,
            gstPercentage: 18,
            gstAmount: (150 * 180 * 18) / 100,
            total: 150 * 180 * 1.18
          },
          {
            description: 'Yarn Dyed 300D',
            quantity: 75,
            unitPrice: 250,
            amount: 75 * 250,
            gstPercentage: 18,
            gstAmount: (75 * 250 * 18) / 100,
            total: 75 * 250 * 1.18
          }
        ],
        subtotal: (150 * 180) + (75 * 250),
        gstAmount: (((150 * 180) + (75 * 250)) * 18) / 100,
        grandTotal: ((150 * 180) + (75 * 250)) * 1.18,
        amountPaid: ((150 * 180) + (75 * 250)) * 1.18,
        balanceDue: 0,
        paymentStatus: 'paid',
        paymentTerms: 'Net 30 days',
        paymentMethod: 'bank-transfer',
        paymentDetails: {
          transactionId: 'TXN20240120001',
          paymentDate: new Date('2024-01-22'),
          remarks: 'Payment received via bank transfer'
        },
        createdBy: admin._id
      },
      {
        invoiceNumber: 'INV-2024-002',
        order: createdOrders[1]._id,
        client: client2._id,
        invoiceDate: new Date('2024-02-05'),
        dueDate: new Date('2024-03-05'),
        items: [
          {
            description: 'Raw Yarn 75D',
            quantity: 300,
            unitPrice: 120,
            amount: 300 * 120,
            gstPercentage: 18,
            gstAmount: (300 * 120 * 18) / 100,
            total: 300 * 120 * 1.18
          }
        ],
        subtotal: 300 * 120,
        gstAmount: (300 * 120 * 18) / 100,
        grandTotal: 300 * 120 * 1.18,
        amountPaid: 0,
        balanceDue: 300 * 120 * 1.18,
        paymentStatus: 'unpaid',
        paymentTerms: 'Net 30 days',
        createdBy: admin._id
      }
    ];

    const createdInvoices = [];
    for (const invoiceData of invoices) {
      const invoice = await Invoice.create(invoiceData);
      createdInvoices.push(invoice);
      console.log('✓ Invoice created:', invoice.invoiceNumber, '-', invoice.status);
    }
    console.log('\nTest Credentials:');
    console.log('Admin:');
    console.log('  Email: admin@textile.com');
    console.log('  Password: admin123');
    console.log('\nClient 1:');
    console.log('  Email: john@client.com');
    console.log('  Password: client123');
    console.log('\nClient 2:');
    console.log('  Email: sarah@client.com');
    console.log('  Password: client123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
