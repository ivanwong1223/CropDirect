# CropDirect – Agricultural Trading & Supply Chain Platform

CropDirect is a full-stack web-based agricultural trading platform built with **Next.js**, **Prisma**, **PostgreSQL**, and **AWS services**, designed to connect three key roles in the agriculture supply chain:

- **Agribusinesses** – farmers and sellers who list their agricultural products  
- **Business Buyers** – wholesale buyers who purchase crops and place bid prices  
- **Logistics Partners** – delivery partners who handle shipment, pickup, and order fulfilment  

The platform streamlines the trading process by offering **direct market access**, **fair pricing**, and **real-time decision support** through integrated tools and APIs.

---

## 🚀 Features

### 🌾 For Agribusinesses
- Create, edit, and publish crop listings
- Enable bidding and set minimum bid increments
- View subscription plans and upgrade via Stripe
- Monitor orders and KYB verification status

### 🛒 For Business Buyers
- Browse marketplace listings
- Place bids or buy directly
- Earn loyalty points from successful purchases
- Redeem points for future discounts
- Receive product recommendations and pricing insights

### 🚚 For Logistics Partners
- Manage pickup and delivery workflow
- Update order statuses (Accepted → Ready to Pickup → Delivered)
- Receive KYB verification updates

### 📰 Platform-Wide Tools
- Integrated **Mediastack API** for agriculture news feed  
- Real-time chat messaging with image support  
- Role-based authentication using **NextAuth**  
- Secure file uploads using **AWS S3**  
- Product image gallery  
- Subscription & billing via **Stripe**  
- Error prevention and form validations  
- Responsive UI built with **TailwindCSS + Radix UI**  

---

## 📁 Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS  
- **Backend:** Next.js API Routes, Prisma ORM  
- **Database:** PostgreSQL  
- **Authentication:** NextAuth  
- **Cloud Services:** AWS S3, AWS SDK  
- **Payments:** Stripe Checkout + Webhooks  
- **Real-time Communication:** Socket.io  
- **External APIs:** Mediastack News API  

---

## 🛠️ Getting Started

Clone the repository:

```bash
git clone https://github.com/ivanwong1223/CropDirect.git
cd CropDirect
