# Campus Crave - WhatsApp Integration Setup Guide

## Project Overview

Campus Crave is a campus food delivery application with the following key features:

- **Students** can browse menu items, add to cart, and place orders
- **Stall Owners** can manage their menu items and track orders
- **Admins** can manage the platform

## What Has Been Implemented

### 1. **Order Management System**

✅ Complete order backend infrastructure:

- **Order Model** (`backend/models/Order.js`) - MongoDB schema for orders
- **Order Controller** (`backend/controllers/Order.controller.js`) - CRUD operations
- **Order Routes** (`backend/routes/orderRoutes.js`) - API endpoints

### 2. **API Endpoints**

All endpoints available at `http://localhost:5000/api/`

- `POST /orders` - Create new order
- `GET /orders` - Get all orders
- `GET /orders/student/:email` - Get orders by student
- `GET /orders/stall/:stallId` - Get orders by stall owner
- `GET /orders/:orderId` - Get single order
- `PUT /orders/:orderId` - Update order status
- `DELETE /orders/:orderId` - Cancel order
- `POST /orders/:orderId/send-bill` - Send bill via email

### 3. **Toast Notifications**

✅ Installed `react-toastify` in frontend

- Success message when order placed with Order ID
- Error handling with user-friendly messages
- Loading state while placing order

### 4. **WhatsApp Integration (Ready to Enable)**

✅ WhatsApp service created (`backend/services/whatsappService.js`)
✅ Ready to use Twilio for WhatsApp delivery

---

## Enabling WhatsApp Bill Delivery

### Step 1: Install Twilio Package

```bash
cd backend
npm install twilio
```

### Step 2: Set Up Twilio Account

1. Go to [https://www.twilio.com](https://www.twilio.com)
2. Sign up for a free account (includes $15 credit)
3. Navigate to **Console Dashboard**
4. Copy your **Account SID** and **Auth Token**
5. Go to **Phone Numbers → Manage** and get a WhatsApp-enabled number

### Step 3: Update Environment Variables

Edit `backend/.env` and add:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155552671
```

### Step 4: Enable WhatsApp in Order Controller

In `backend/controllers/Order.controller.js`, uncomment these lines:

**Line 3 (uncomment import):**

```javascript
import { sendWhatsAppBill } from "../services/whatsappService.js";
```

**Lines 83-103 (uncomment WhatsApp sending logic in createOrder function):**

```javascript
// Send WhatsApp bill if phone number is available
if (studentPhone) {
  try {
    const whatsappResult = await sendWhatsAppBill(studentPhone, newOrder);
    if (whatsappResult.success) {
      await Order.findOneAndUpdate(
        { orderId: orderId },
        {
          whatsappSent: true,
          whatsappSentAt: new Date(),
        },
        { new: true },
      );
      console.log("WhatsApp bill sent successfully");
    }
  } catch (whatsappError) {
    console.error("WhatsApp sending error:", whatsappError);
  }
}
```

### Step 5: Restart Backend Server

```bash
npm run dev
```

---

## Testing the Order Flow

### 1. Start Both Servers

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

### 2. Place an Order

1. Register as a student
2. Browse menu items
3. Add items to cart
4. Go to "Place Order"
5. Fill in pickup time, special instructions, and payment method
6. Click "Place Order"

### Expected Results:

✅ **Success Toast Message** - Shows "Order placed successfully! Order ID: ORD[timestamp]"

✅ **MongoDB Storage** - Order saved to database

✅ **WhatsApp Delivery** (if enabled) - Bill sent to student's phone number

✅ **Email Notification** (optional) - Email bill sent (requires email config)

✅ **Redirect** - Student redirected to dashboard after 2 seconds

---

## Database Schema

### Order Collection

```javascript
{
  orderId: "ORD1234567890",
  studentId: "STU001",
  studentName: "John Doe",
  studentEmail: "john@campus.ac.in",
  studentPhone: "+919876543210",
  stallId: "STALL001",
  stallName: "Pizza Point",
  stallOwner: "Owner Name",
  items: [
    {
      itemId: "123",
      itemName: "Margherita Pizza",
      quantity: 2,
      price: 200,
      totalPrice: 400
    }
  ],
  totalItems: 2,
  subtotal: 400,
  tax: 20,
  totalAmount: 420,
  pickupTime: "12:00 PM - 12:30 PM",
  specialInstructions: "Extra cheese",
  paymentMethod: "online",
  orderStatus: "New",
  paymentStatus: "Pending",
  whatsappSent: true,
  whatsappSentAt: "2024-04-09T10:30:00Z",
  createdAt: "2024-04-09T10:25:00Z",
  updatedAt: "2024-04-09T10:25:00Z"
}
```

---

## WhatsApp Message Format

When order is placed, student receives:

```
*Campus Crave Order Confirmation* 📦

Order ID: ORD1712666700000
Stall: Pizza Point
Pickup Time: 12:00 PM - 12:30 PM

*Order Details:*
• Margherita Pizza x2 - ₹400

Subtotal: ₹400.00
Tax (5%): ₹20.00
*Total: ₹420.00*

Payment Method: online

Thank you for ordering from Campus Crave! 🍕
Your order will be ready at the specified time.
```

---

## Features Summary

| Feature              | Status      | Details                              |
| -------------------- | ----------- | ------------------------------------ |
| Order Placement      | ✅ Complete | API + Frontend Integration           |
| Success Messages     | ✅ Complete | Toast notifications                  |
| Database Storage     | ✅ Complete | MongoDB persistence                  |
| WhatsApp Integration | ⚠️ Ready    | Install Twilio to enable             |
| Email Bills          | ⚠️ Optional | Nodemailer configured                |
| Order Tracking       | ⚠️ Partial  | Backend ready, Frontend needs update |
| Stall Dashboard      | ⚠️ Pending  | View incoming orders                 |

---

## Next Steps

### Optional Enhancements:

1. **Real-time Order Tracking** - Add WebSocket for live order status updates
2. **Order Management Dashboard** - Stall owners view and update orders
3. **SMS Notifications** - Twilio SMS for backup notifications
4. **Order Analytics** - Dashboard showing sales, popular items, etc.
5. **Push Notifications** - PWA push for order status changes
6. **Integration Tests** - Test order flow end-to-end

---

## Troubleshooting

### WhatsApp Not Sending?

1. Check Twilio credentials in `.env`
2. Ensure phone number format: `+91XXXXXXXXXX` (India) or `+1XXXXXXXXXX` (USA)
3. Check Twilio account has active balance
4. Check backend logs for error messages

### Order Not Saving to Database?

1. Verify MongoDB is running
2. Check `MONGO_URI` in `.env`
3. Ensure all required fields are provided
4. Check backend logs for validation errors

### Frontend Not Connecting to API?

1. Verify backend is running on `localhost:5000`
2. Check CORS settings in `backend/server.js`
3. Ensure frontend API URL is correct

---

## Support

For issues or questions, check:

- Console logs (browser DevTools for frontend, terminal for backend)
- Backend error responses in Network tab
- MongoDB connection status

Happy ordering! 🚀🍕
