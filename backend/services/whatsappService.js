// ❌ IMPORTANT: yaha dotenv dobara zaruri nahi hai (already server.js me hai)

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber =
  process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

// Twilio API URL
const TWILIO_MESSAGES_URL = accountSid
  ? `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  : null;

// ✅ Format bill (₹)
const formatBillForWhatsApp = (order) => {
  const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

  const itemsList = order.items
    .map(
      (item) =>
        `• ${item.itemName} x${item.quantity} - ${money(item.totalPrice)}`
    )
    .join("\n");

  return `
*Campus Crave Order Confirmation*

Order ID: ${order.orderId}
Stall: ${order.stallName}
Pickup Time: ${order.pickupTime}

*Order Details:*
${itemsList}

Subtotal: ${money(order.subtotal)}
Tax (5%): ${money(order.tax)}
*Total: ${money(order.totalAmount)}*

Payment Method: ${order.paymentMethod}
${
  order.specialInstructions
    ? `Special Instructions: ${order.specialInstructions}`
    : ""
}

Thank you for ordering from Campus Crave! 🍕
`;
};

// ✅ Format phone number
const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  } else if (!cleaned.startsWith("91")) {
    cleaned = "91" + cleaned;
  }

  return "whatsapp:+" + cleaned;
};

// ✅ MAIN FUNCTION
export const sendWhatsAppBill = async (phoneNumber, order, options = {}) => {
  try {
    // 🔴 Fix: proper check
    if (!accountSid || !authToken) {
      console.log("❌ Twilio credentials missing");
      return {
        success: false,
        message: "Twilio credentials are not configured",
      };
    }

    const formattedPhone = formatPhoneNumber(
      phoneNumber || process.env.ADMIN_WHATSAPP_NUMBER
    );

    const billMessage = formatBillForWhatsApp(order);

    const body = new URLSearchParams({
      From: whatsappNumber,
      To: formattedPhone,
      Body: billMessage,
    });

    if (options.mediaUrl) {
      body.append("MediaUrl", options.mediaUrl);
    }

    const response = await fetch(TWILIO_MESSAGES_URL, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("❌ Twilio Error:", responseText);
      throw new Error(responseText);
    }

    const message = JSON.parse(responseText);

    console.log("✅ WhatsApp sent:", message.sid);

    return {
      success: true,
      messageId: message.sid,
      message: options.mediaUrl
        ? "Bill sent successfully with PDF"
        : "Bill sent successfully",
    };
  } catch (error) {
    console.error("❌ Error:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

export default { sendWhatsAppBill };