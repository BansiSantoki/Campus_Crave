# 📧 Email Setup Guide for Campus Crave

## Current Status

✅ **Development Mode**: OTP shows on screen (dev fallback enabled)
❌ **Email Delivery**: Not working (SMTP credentials are placeholder)

---

## How to Enable Real Email Delivery

### Step 1: Get a Gmail App Password

1. Go to **[myaccount.google.com](https://myaccount.google.com)**
2. Click on **"Security"** in the left sidebar
3. Enable **2-Factor Authentication** (if not already enabled)
   - Click "2-Step Verification"
   - Follow the prompts
4. Go back to **Security** page
5. Search for **"App passwords"**
6. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or your device type)
7. Google will generate a **16-character password**
   - Example: `abcd efgh ijkl mnop`
8. **Copy this password** (without spaces)

### Step 2: Update Backend Configuration

Edit `backend/.env`:

```env
SMTP_USER=bansisantoki2005@gmail.com
SMTP_PASS=abcdeffghijklmnop    # ← Paste your 16-char password here (no spaces)
```

**Remove any spaces** from the password!

### Step 3: Restart Backend

```bash
cd backend
npm start
```

### Step 4: Test

1. Go to **localhost:5173/forgot**
2. Enter any registered email
3. Click **"Send OTP"**
4. Check if OTP appears in the **email inbox** instead of just on screen

---

## What to Expect

### ✅ Working (Current)

- User enters email → OTP shows on screen
- User can copy and paste OTP to reset password
- Good for **development/testing**

### ✅ After Email Setup

- User enters email → OTP is sent to their email
- Email arrives in inbox within seconds
- User copies OTP from email and resets password
- **Production-ready** 🚀

---

## Troubleshooting

### Issue: Still seeing "Development OTP" on screen

**Solution**:

- Check `backend/.env` SMTP_PASS is **exactly 16 characters** (no spaces)
- Restart backend: `npm start`
- Check browser console for error messages

### Issue: Gmail says "App password not allowed"

**Solution**:

- Ensure **2-Factor Authentication is enabled** first
- Generate app password again
- Try with a fresh Gmail account if needed

### Issue: Email not arriving

**Solution**:

- Check **Spam/Junk folder**
- Verify email was sent: Check backend console logs
- Check sender email is correct in `.env`

---

## Security Notes

- ✅ App Password is safer than real Gmail password
- ✅ App Password only works for Mail, not full account access
- ✅ Can be revoked anytime from Google Account
- ❌ Never commit real passwords to Git
- ✅ `.env` file is already in `.gitignore`

---

## For Production

1. Update `ALLOW_DEV_OTP_FALLBACK=false` in `.env`
2. Ensure real SMTP credentials are set
3. Deploy backend with real credentials
4. Disable development mode
