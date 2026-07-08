/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
// CommonJS seed script executed directly by Node (`node prisma/seed.js`), so it
// intentionally uses require() rather than ESM imports.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

function hashPassword(password) {
  const salt = process.env.SESSION_SECRET || 'agriconnect-secure-session-secret-key-2026';
  return crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // Clean database
  await prisma.session.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = hashPassword('password123');

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@agriconnect.com',
      password: hashPassword('admin123'),
      name: 'Agriconnect Admin',
      role: 'ADMIN',
    },
  });

  // Create Farmers
  const ravi = await prisma.user.create({
    data: {
      email: 'ravi@agriconnect.com',
      password: defaultPassword,
      name: 'Ravi Kumar',
      role: 'FARMER',
      farmName: 'Kumar Organic Farm',
      farmDetails: 'Specialists in country tomatoes and fresh root vegetables.',
      address: 'Ludhiana, Punjab',
    },
  });

  const meena = await prisma.user.create({
    data: {
      email: 'meena@agriconnect.com',
      password: defaultPassword,
      name: 'Meena Devi',
      role: 'FARMER',
      farmName: 'Meena Dairy & Poultry',
      farmDetails: 'Fresh milk and dairy straight from Haryana cows.',
      address: 'Rohtak, Haryana',
    },
  });

  const suresh = await prisma.user.create({
    data: {
      email: 'suresh@agriconnect.com',
      password: defaultPassword,
      name: 'Suresh Patil',
      role: 'FARMER',
      farmName: 'Patil Mango Groves',
      farmDetails: 'Premium seasonal Alphonso and Kesar mangoes.',
      address: 'Ratnagiri, Maharashtra',
    },
  });

  const lakshmi = await prisma.user.create({
    data: {
      email: 'lakshmi@agriconnect.com',
      password: defaultPassword,
      name: 'Lakshmi Reddy',
      role: 'FARMER',
      farmName: 'Reddy Fresh Veggies',
      farmDetails: 'A wide assortment of organic green vegetables and onions.',
      address: 'Chikmagalur, Karnataka',
    },
  });

  const gurpreet = await prisma.user.create({
    data: {
      email: 'gurpreet@agriconnect.com',
      password: defaultPassword,
      name: 'Gurpreet Singh',
      role: 'FARMER',
      farmName: 'Amritsar Farmhouse Dairy',
      farmDetails: 'Handmade paneer, butter, and rich local dairy products.',
      address: 'Amritsar, Punjab',
    },
  });

  const thomas = await prisma.user.create({
    data: {
      email: 'thomas@agriconnect.com',
      password: defaultPassword,
      name: 'Thomas Mathai',
      role: 'FARMER',
      farmName: 'Kerala Hills Plantation',
      farmDetails: 'Exotic bananas and fresh spices from the Western Ghats.',
      address: 'Idukki, Kerala',
    },
  });

  const anita = await prisma.user.create({
    data: {
      email: 'anita@agriconnect.com',
      password: defaultPassword,
      name: 'Anita Sharma',
      role: 'FARMER',
      farmName: 'Sharma Green Farms',
      farmDetails: 'Fresh, organic palak, spinach, and leafy greens.',
      address: 'Jaipur, Rajasthan',
    },
  });

  const vijay = await prisma.user.create({
    data: {
      email: 'vijay@agriconnect.com',
      password: defaultPassword,
      name: 'Vijay Rao',
      role: 'FARMER',
      farmName: 'Mathura Pure Ghee Farms',
      farmDetails: 'Slow-cooked ghee made from pure cow milk.',
      address: 'Mathura, Uttar Pradesh',
    },
  });

  // Create Products
  const p1 = await prisma.product.create({
    data: {
      name: 'Country Tomatoes',
      description: 'Organic red country tomatoes, fresh and juicy.',
      price: 40,
      unit: 'kg',
      category: 'VEGETABLES',
      emoji: '🍅',
      farmerId: ravi.id,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Fresh Buffalo Milk',
      description: 'Raw, unpasteurized high-fat fresh buffalo milk.',
      price: 65,
      unit: 'litre',
      category: 'DAIRY',
      emoji: '🥛',
      farmerId: meena.id,
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Alphonso Mangoes',
      description: 'Sweet, seasonal Ratnagiri Alphonso mangoes.',
      price: 180,
      unit: 'dozen',
      category: 'FRUITS',
      emoji: '🥭',
      farmerId: suresh.id,
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'Red Onions',
      description: 'Pungent, freshly harvested red storage onions.',
      price: 28,
      unit: 'kg',
      category: 'VEGETABLES',
      emoji: '🧅',
      farmerId: lakshmi.id,
    },
  });

  const p5 = await prisma.product.create({
    data: {
      name: 'Farm Paneer',
      description: 'Handmade, fresh paneer with zero preservatives.',
      price: 220,
      unit: 'kg',
      category: 'DAIRY',
      emoji: '🧀',
      farmerId: gurpreet.id,
    },
  });

  const p6 = await prisma.product.create({
    data: {
      name: 'Nendran Bananas',
      description: 'Traditional sweet plantain bananas from Kerala.',
      price: 55,
      unit: 'dozen',
      category: 'FRUITS',
      emoji: '🍌',
      farmerId: thomas.id,
    },
  });

  const p7 = await prisma.product.create({
    data: {
      name: 'Palak Bunches',
      description: 'Organic, iron-rich spinach palak leaves.',
      price: 15,
      unit: 'bunch',
      category: 'VEGETABLES',
      emoji: '🥬',
      farmerId: anita.id,
    },
  });

  const p8 = await prisma.product.create({
    data: {
      name: 'Pure Ghee',
      description: 'Traditional danedar cow ghee made in Mathura.',
      price: 580,
      unit: 'kg',
      category: 'DAIRY',
      emoji: '🍶',
      farmerId: vijay.id,
    },
  });

  // Create Buyers
  const priya = await prisma.user.create({
    data: {
      email: 'priya@agriconnect.com',
      password: defaultPassword,
      name: 'Priya Nair',
      role: 'BUYER',
      address: 'Vasanth Nagar, Bengaluru',
    },
  });

  const rajesh = await prisma.user.create({
    data: {
      email: 'rajesh@agriconnect.com',
      password: defaultPassword,
      name: 'Rajesh Gupta',
      role: 'BUYER',
      address: 'Dwarka Sector 12, Delhi',
    },
  });

  // Create Mock Orders (to populate analytics charts on build)
  // Order 1: Priya buying Tomatoes (3kg) and Milk (2l). Total = 3*40 + 2*65 = 120 + 130 = 250.
  const o1 = await prisma.order.create({
    data: {
      buyerId: priya.id,
      totalPrice: 250,
      status: 'DELIVERED',
      createdAt: new Date('2026-06-01T10:00:00Z'),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: o1.id, productId: p1.id, quantity: 3, priceAtPurchase: 40, farmerId: ravi.id },
      { orderId: o1.id, productId: p2.id, quantity: 2, priceAtPurchase: 65, farmerId: meena.id },
    ],
  });

  // Order 2: Rajesh buying Ghee (1kg) and Mangoes (2 dozen). Total = 1*580 + 2*180 = 940.
  const o2 = await prisma.order.create({
    data: {
      buyerId: rajesh.id,
      totalPrice: 940,
      status: 'SHIPPED',
      createdAt: new Date('2026-06-03T14:30:00Z'),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: o2.id, productId: p8.id, quantity: 1, priceAtPurchase: 580, farmerId: vijay.id },
      { orderId: o2.id, productId: p3.id, quantity: 2, priceAtPurchase: 180, farmerId: suresh.id },
    ],
  });

  // Order 3: Priya buying Paneer (1.5kg). Total = 1.5*220 = 330.
  const o3 = await prisma.order.create({
    data: {
      buyerId: priya.id,
      totalPrice: 330,
      status: 'PENDING',
      createdAt: new Date('2026-06-05T09:15:00Z'),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: o3.id, productId: p5.id, quantity: 1.5, priceAtPurchase: 220, farmerId: gurpreet.id },
    ],
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
