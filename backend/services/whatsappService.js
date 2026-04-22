// ❌ IMPORTANT: yaha dotenv dobara zaruri nahi hai (already server.js me hai)
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureTwilioEnvLoaded = () => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return;
  }

  dotenv.config({ path: path.join(__dirname, "..", ".env") });
};

const getTwilioConfig = () => {
  ensureTwilioEnvLoaded();

  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "").trim();
  const whatsappNumber =
    String(process.env.TWILIO_WHATSAPP_NUMBER || "").trim() || "whatsapp:+14155238886";

  return {
    accountSid,
    authToken,
    whatsappNumber,
    messagesUrl: accountSid
      ? `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
      : "",
  };
};

const isPrivateIpv4 = (host) => {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;

  const [a, b] = host.split(".").map((part) => Number(part));
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
};

export const isPublicBillUrl = (url, { requireHttps = false } = {}) => {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (requireHttps && parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "::1"].includes(host)) return false;
    if (isPrivateIpv4(host)) return false;

    return true;
  } catch {
    return false;
  }
};

const isPublicMediaUrl = (url) => {
  return isPublicBillUrl(url, { requireHttps: true });
};

// ✅ Format bill (₹)
const formatBillForWhatsApp = (order, options = {}) => {
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
${options.billLink ? `\nDownload Bill: ${options.billLink}` : ""}

Thank you for ordering from Campus Crave! 🍕
`;
};

// ✅ Format phone number
const formatPhoneNumber = (phone) => {
  const raw = String(phone || "").trim();
  let cleaned = raw.replace(/\D/g, "");

  if (!cleaned) {
    return "";
  }

  // For local 10-digit numbers, default to India prefix.
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }

  return `whatsapp:+${cleaned}`;
};

// ✅ MAIN FUNCTION
export const sendWhatsAppBill = async (phoneNumber, order, options = {}) => {
  try {
    const twilio = getTwilioConfig();

    // 🔴 Fix: proper check
    if (!twilio.accountSid || !twilio.authToken) {
      console.log("❌ Twilio credentials missing");
      return {
        success: false,
        message: "Twilio credentials are not configured",
      };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return {
        success: false,
        message: "Valid WhatsApp number not found for this user",
      };
    }

    const publicBillLink = isPublicBillUrl(options.billLink) ? options.billLink : "";

    const billMessage = formatBillForWhatsApp(order, {
      billLink: publicBillLink,
    });

    const body = new URLSearchParams({
      From: twilio.whatsappNumber,
      To: formattedPhone,
      Body: billMessage,
    });

    if (isPublicMediaUrl(options.mediaUrl)) {
      body.append("MediaUrl", options.mediaUrl);
    }

    const response = await fetch(twilio.messagesUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("❌ Twilio Error:", responseText);
      let cleanMessage = "Failed to send WhatsApp bill";
      try {
        const parsed = JSON.parse(responseText);
        cleanMessage = parsed?.message || cleanMessage;
      } catch {
        cleanMessage = responseText || cleanMessage;
      }
      throw new Error(cleanMessage);
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