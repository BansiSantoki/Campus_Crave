import process from "node:process";
import nodemailer from "nodemailer";
import { Resend } from "resend";

function getRecipientList(to) {
	return String(to || "")
		.split(",")
		.map((entry) => String(entry || "").trim())
		.filter(Boolean);
}

async function sendEmailViaResend({ to, subject, html, text, attachments }) {
	const apiKey = String(process.env.RESEND_API_KEY || "").trim();
	if (!apiKey) {
		return null;
	}

	if (Array.isArray(attachments) && attachments.length > 0) {
		return {
			success: false,
			message:
				"Resend API mode is enabled but attachments are not supported in current configuration. Configure SMTP for attachment emails.",
		};
	}

	const recipients = getRecipientList(to);
	if (!recipients.length) {
		return { success: false, message: "Recipient email missing" };
	}

	const senderEmail =
		process.env.RESEND_FROM_EMAIL ||
		process.env.EMAIL_FROM ||
		process.env.MAIL_FROM ||
		process.env.EMAIL_USER ||
		process.env.SMTP_USER;

	if (!senderEmail) {
		return {
			success: false,
			message:
				"Resend is configured but sender email is missing. Set RESEND_FROM_EMAIL or EMAIL_FROM in backend/.env.",
		};
	}

	try {
		const resend = new Resend(apiKey);
		const payload = await resend.emails.send({
			from: String(senderEmail).trim(),
			to: recipients,
			subject,
			html,
			text,
		});

		if (payload?.error) {
			return {
				success: false,
				message:
					payload.error.message || payload.error.name || "Resend send failed",
				error: payload.error.message || payload.error.name || "Resend send failed",
			};
		}

		return {
			success: true,
			messageId: payload?.data?.id || payload?.id || null,
			accepted: recipients.map((entry) => String(entry || "").trim().toLowerCase()),
			rejected: [],
		};
	} catch (error) {
		return {
			success: false,
			message: error?.message || "Resend send failed",
			error: error?.message || "Resend send failed",
		};
	}
}

async function sendEmailViaBrevo({ to, subject, html, text, attachments }) {
	const apiKey = String(process.env.BREVO_API_KEY || "").trim();
	if (!apiKey) {
		return null;
	}

	if (Array.isArray(attachments) && attachments.length > 0) {
		return {
			success: false,
			message:
				"Brevo API mode is enabled but attachments are not supported in current configuration. Configure SMTP for attachment emails.",
		};
	}

	const recipients = getRecipientList(to).map((email) => ({ email }));
	if (!recipients.length) {
		return { success: false, message: "Recipient email missing" };
	}

	const senderEmail =
		process.env.EMAIL_FROM ||
		process.env.MAIL_FROM ||
		process.env.EMAIL_USER ||
		process.env.SMTP_USER;

	if (!senderEmail) {
		return {
			success: false,
			message:
				"Brevo is configured but sender email is missing. Set EMAIL_FROM or MAIL_FROM in backend/.env.",
		};
	}

	try {
		const response = await fetch("https://api.brevo.com/v3/smtp/email", {
			method: "POST",
			headers: {
				accept: "application/json",
				"content-type": "application/json",
				"api-key": apiKey,
			},
			body: JSON.stringify({
				sender: {
					email: String(senderEmail).trim(),
					name: process.env.EMAIL_FROM_NAME || "CampusCrave",
				},
				to: recipients,
				subject,
				htmlContent: html,
				textContent: text,
			}),
		});

		const payload = await response.json().catch(() => ({}));
		if (!response.ok) {
			return {
				success: false,
				message:
					payload?.message || payload?.code || `Brevo send failed with status ${response.status}`,
				error: payload?.message || payload?.code || "Brevo send failed",
			};
		}

		return {
			success: true,
			messageId: payload?.messageId || null,
			accepted: recipients.map((entry) => String(entry.email || "").toLowerCase()),
			rejected: [],
		};
	} catch (error) {
		return {
			success: false,
			message: error?.message || "Brevo send failed",
			error: error?.message || "Brevo send failed",
		};
	}
}

export function getMailerConfig() {
	const user = process.env.EMAIL_USER || process.env.SMTP_USER;
	const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;
	const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;

	if (
		!user ||
		!pass ||
		String(pass).includes("your_real_app_password") ||
		String(pass).toLowerCase().includes("app_password")
	) {
		return null;
	}

	// Build config - don't force "service: gmail" for Ethereal or other providers
	const config = {
		host,
		port: process.env.EMAIL_PORT
			? Number(process.env.EMAIL_PORT)
			: process.env.SMTP_PORT
			? Number(process.env.SMTP_PORT)
			: 587,
		secure: process.env.EMAIL_SECURE === "true",
		auth: { user, pass },
	};

	// Only set service for Gmail
	if (host && host.includes("gmail")) {
		config.service = "gmail";
	}

	return config;
}

export function getPublicBaseUrl() {
	return (
		process.env.PUBLIC_BASE_URL ||
		process.env.SERVER_URL ||
		process.env.BASE_URL ||
		`http://localhost:${process.env.PORT || 5000}`
	);
}

export function getBillDownloadUrl(orderId) {
	const baseUrl = String(getPublicBaseUrl() || "").replace(/\/+$/, "");
	return `${baseUrl}/uploads/bills/${encodeURIComponent(orderId)}.pdf`;
}

export function createMailerTransport() {
	const mailerConfig = getMailerConfig();
	if (!mailerConfig) {
		return null;
	}

	return nodemailer.createTransport(mailerConfig);
}

export async function sendEmail({ to, subject, html, text, attachments }) {
	const providerErrors = [];

	const resendResult = await sendEmailViaResend({ to, subject, html, text, attachments });
	if (resendResult?.success) {
		return resendResult;
	}
	if (resendResult) {
		providerErrors.push(`Resend: ${resendResult.message || resendResult.error || "send failed"}`);
	}

	const brevoResult = await sendEmailViaBrevo({ to, subject, html, text, attachments });
	if (brevoResult?.success) {
		return brevoResult;
	}
	if (brevoResult) {
		providerErrors.push(`Brevo: ${brevoResult.message || brevoResult.error || "send failed"}`);
	}

	const mailerConfig = getMailerConfig();
	if (!mailerConfig) {
		return {
			success: false,
			message: providerErrors.length
				? `Email providers failed (${providerErrors.join(" | ")}). Configure working SMTP credentials in backend/.env or verify your API provider setup.`
				: "Email is not configured on the server. Configure RESEND_API_KEY (recommended), BREVO_API_KEY, or SMTP credentials in backend/.env.",
		};
	}

	try {
		const transporter = nodemailer.createTransport(mailerConfig);
		const info = await transporter.sendMail({
			from: process.env.EMAIL_FROM || process.env.MAIL_FROM || mailerConfig.auth.user,
			to,
			subject,
			html,
			text,
			attachments,
		});

		const accepted = Array.isArray(info?.accepted)
			? info.accepted.map((entry) => String(entry || "").trim().toLowerCase())
			: [];
		const rejected = Array.isArray(info?.rejected)
			? info.rejected.map((entry) => String(entry || "").trim())
			: [];
		const requestedRecipients = String(to || "")
			.split(",")
			.map((entry) => String(entry || "").trim().toLowerCase())
			.filter(Boolean);

		const hasAcceptedRecipient = requestedRecipients.length
			? requestedRecipients.some((recipient) => accepted.includes(recipient))
			: accepted.length > 0;

		if (!hasAcceptedRecipient) {
			return {
				success: false,
				message:
					rejected.length > 0
						? `Email was rejected by provider: ${rejected.join(", ")}`
						: "Email provider did not accept recipient address",
				error: rejected.join(", ") || "No accepted recipient",
			};
		}

		return {
			success: true,
			messageId: info.messageId,
			accepted,
			rejected,
		};
	} catch (error) {
		console.error("Email send failed:", error.message);
		return {
			success: false,
			message: error?.response || error?.message || "Email send failed",
			error: error?.message || "Email send failed",
		};
	}
}

export async function sendVerificationEmail(user) {
	const recipient = String(user?.email || "").trim();
	if (!recipient) {
		return { success: false, message: "Recipient email missing" };
	}

	const displayName = user?.fullname || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "CampusCrave user";
	const subject = "CampusCrave email verification";
	const html = `
		<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;">
			<h2 style="margin-bottom:8px;">Verify your CampusCrave account</h2>
			<p style="margin-top:0;">Hi ${displayName},</p>
			<p>Your ${user?.role === "stall" ? "stall owner" : "student"} registration was saved successfully.</p>
			<p>This email confirms that <strong>${recipient}</strong> was used to create your CampusCrave account.</p>
			<p>If you did not request this registration, please contact the campus administrator immediately.</p>
			<p style="margin-top:24px;color:#6b7280;">CampusCrave automated verification message</p>
		</div>
	`;

	const text = [
		"CampusCrave email verification",
		`Hi ${displayName},`,
		`Your ${user?.role === "stall" ? "stall owner" : "student"} registration was saved successfully.`,
		`This email confirms that ${recipient} was used to create your CampusCrave account.`,
		"If you did not request this registration, please contact the campus administrator immediately.",
	].join("\n\n");

	return sendEmail({ to: recipient, subject, html, text });
}

export async function sendLoginNotificationEmail(user) {
	const recipient = String(user?.email || "").trim();
	if (!recipient) {
		return { success: false, message: "Recipient email missing" };
	}

	const displayName =
		user?.fullname ||
		`${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
		"CampusCrave user";
	const subject = "CampusCrave login notification";
	const loginTime = new Date().toLocaleString();
	const roleLabel = user?.role === "stall" ? "Stall Owner" : "Student";

	const html = `
		<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;">
			<h2 style="margin-bottom:8px;">CampusCrave Login Alert</h2>
			<p style="margin-top:0;">Hi ${displayName},</p>
			<p>Your ${roleLabel} account just logged in using this email: <strong>${recipient}</strong>.</p>
			<p>Login time: <strong>${loginTime}</strong></p>
			<p>If this was not you, please change your password immediately and contact the campus administrator.</p>
			<p style="margin-top:24px;color:#6b7280;">CampusCrave automated security notification</p>
		</div>
	`;

	const text = [
		"CampusCrave Login Alert",
		`Hi ${displayName},`,
		`Your ${roleLabel} account just logged in using this email: ${recipient}.`,
		`Login time: ${loginTime}`,
		"If this was not you, please change your password immediately and contact the campus administrator.",
	].join("\n\n");

	return sendEmail({ to: recipient, subject, html, text });
}

export async function sendPasswordResetOtpEmail(user, otp) {
	const recipient = String(user?.email || "").trim();
	if (!recipient) {
		return { success: false, message: "Recipient email missing" };
	}

	const displayName =
		user?.fullname ||
		`${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
		"CampusCrave user";
	const subject = "CampusCrave password reset code";

	const html = `
		<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;">
			<h2 style="margin-bottom:8px;">Reset your CampusCrave password</h2>
			<p style="margin-top:0;">Hi ${displayName},</p>
			<p>Use this OTP to reset your password:</p>
			<p style="font-size:28px;letter-spacing:4px;font-weight:700;color:#0f5132;">${otp}</p>
			<p>This OTP expires in 10 minutes.</p>
			<p>If you did not request this, please ignore this email.</p>
		</div>
	`;

	const text = [
		"CampusCrave password reset code",
		`Hi ${displayName},`,
		`Use this OTP to reset your password: ${otp}`,
		"This OTP expires in 10 minutes.",
		"If you did not request this, please ignore this email.",
	].join("\n\n");

	return sendEmail({ to: recipient, subject, html, text });
}
