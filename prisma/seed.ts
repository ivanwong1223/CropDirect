import { PrismaClient, Role, VerificationStatus } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.session.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.logisticsPartner.deleteMany({});
  await prisma.businessBuyer.deleteMany({});
  await prisma.agribusiness.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('Seeding database...');
  
  // Create Admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@cropconnect.com",
      name: "System Administrator",
      role: Role.ADMIN,
      password: "$2a$10$GmQzJUUPq6XvtHt1pYIXZeIyPwGZnUAHnp4kGzKP9.TFQqeHtmKES", // hashed password for 'admin123'
      phone: "+1234567890",
      admin: {
        create: {
          department: "System Administration",
          permissions: ["ALL"],
          lastLogin: new Date()
        }
      }
    },
    include: {
      admin: true
    }
  });
  
  console.log('Created admin:', admin.email);
  
  // Create Agribusiness users
  const farmFresh = await prisma.user.create({
    data: {
      email: "contact@farmfresh.com",
      name: "John Farmer",
      role: Role.AGRIBUSINESS,
      password: "$2a$10$GmQzJUUPq6XvtHt1pYIXZeIyPwGZnUAHnp4kGzKP9.TFQqeHtmKES", // hashed password
      phone: "+1234567890",
      agribusiness: {
        create: {
          businessName: "Farm Fresh Produce",
          businessAddress: "123 Farm Road, Rural County",
          businessType: "Crop Producer",
          verificationStatus: VerificationStatus.VERIFIED,
          subscriptionTier: "PREMIUM",
          isKybVerified: true,
          registrationNumber: "AG12345678",
          taxId: "TAX987654321"
        }
      }
    },
    include: {
      agribusiness: true
    }
  });
  
  const organicHarvest = await prisma.user.create({
    data: {
      email: "info@organicharvest.com",
      name: "Sarah Green",
      role: Role.AGRIBUSINESS,
      password: "$2a$10$GmQzJUUPq6XvtHt1pYIXZeIyPwGZnUAHnp4kGzKP9.TFQqeHtmKES", // hashed password
      phone: "+1987654321",
      agribusiness: {
        create: {
          businessName: "Organic Harvest Co-op",
          businessAddress: "456 Organic Lane, Green Valley",
          businessType: "Organic Farmer Cooperative",
          verificationStatus: VerificationStatus.PENDING,
          subscriptionTier: "STANDARD",
          isKybVerified: false,
          registrationNumber: "AG87654321"
        }
      }
    },
    include: {
      agribusiness: true
    }
  });
  
  console.log('Created agribusinesses:', farmFresh.email, organicHarvest.email);
  
  // Create Business Buyer users
  const freshMart = await prisma.user.create({
    data: {
      email: "purchasing@freshmart.com",
      name: "Michael Buyer",
      role: Role.BUSINESS_BUYER,
      password: "$2a$10$GmQzJUUPq6XvtHt1pYIXZeIyPwGZnUAHnp4kGzKP9.TFQqeHtmKES", // hashed password
      phone: "+1122334455",
      businessBuyer: {
        create: {
          companyName: "FreshMart Supermarkets",
          companyAddress: "789 Retail Avenue, Shopping District",
          companyType: "Supermarket Chain",
          verificationStatus: VerificationStatus.VERIFIED,
          loyaltyPoints: 1500,
          preferredPaymentMethods: ["CREDIT_CARD", "BANK_TRANSFER"]
        }
      }
    },
    include: {
      businessBuyer: true
    }
  });
  
  const organicCafe = await prisma.user.create({
    data: {
      email: "orders@organiccafe.com",
      name: "Lisa Restaurant",
      role: Role.BUSINESS_BUYER,
      password: "$2a$10$GmQzJUUPq6XvtHt1pYIXZeIyPwGZnUAHnp4kGzKP9.TFQqeHtmKES", // hashed password
      phone: "+1567890123",
      businessBuyer: {
        create: {
          companyName: "Organic Cafe Chain",
          companyAddress: "101 Healthy Street, Foodie District",
          companyType: "Restaurant Chain",
          verificationStatus: VerificationStatus.VERIFIED,
          loyaltyPoints: 750,
          preferredPaymentMethods: ["BANK_TRANSFER"]
        }
      }
    },
    include: {
      businessBuyer: true
    }
  });
  
  console.log('Created business buyers:', freshMart.email, organicCafe.email);
  
  // Create Logistics Partner users
  const speedDelivery = await prisma.user.create({
    data: {
      email: "operations@speeddelivery.com",
      name: "Fast Logistics Manager",
      role: Role.LOGISTICS_PARTNER,
      password: "$2a$10$GmQzJUUPq6XvtHt1pYIXZeIyPwGZnUAHnp4kGzKP9.TFQqeHtmKES", // hashed password
      phone: "+1456789012",
      logisticsPartner: {
        create: {
          companyName: "Speed Delivery Services",
          companyAddress: "222 Transport Road, Logistics Park",
          serviceAreas: ["North Region", "Central Region", "East Region"],
          transportModes: ["TRUCK", "VAN"],
          verificationStatus: VerificationStatus.VERIFIED,
          isKybVerified: true,
          registrationNumber: "LP12345678",
          insuranceInfo: "Policy #INS123456789"
        }
      }
    },
    include: {
      logisticsPartner: true
    }
  });
  
  const coldChainLogistics = await prisma.user.create({
    data: {
      email: "info@coldchainlogistics.com",
      name: "Cool Transport Manager",
      role: Role.LOGISTICS_PARTNER,
      password: "$2a$10$GmQzJUUPq6XvtHt1pYIXZeIyPwGZnUAHnp4kGzKP9.TFQqeHtmKES", // hashed password
      phone: "+1345678901",
      logisticsPartner: {
        create: {
          companyName: "Cold Chain Logistics",
          companyAddress: "333 Refrigerated Road, Cold Storage Zone",
          serviceAreas: ["South Region", "West Region"],
          transportModes: ["REFRIGERATED_TRUCK", "REFRIGERATED_VAN"],
          verificationStatus: VerificationStatus.PENDING,
          isKybVerified: false,
          registrationNumber: "LP87654321",
          insuranceInfo: "Policy #INS987654321"
        }
      }
    },
    include: {
      logisticsPartner: true
    }
  });
  
  console.log('Created logistics partners:', speedDelivery.email, coldChainLogistics.email);
  
  // Create a session for demo purposes
  const session = await prisma.session.create({
    data: {
      userId: admin.id,
      token: "demo-session-token-123456",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }
  });
  
  console.log('Created demo session for admin');
  console.log('Database seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
