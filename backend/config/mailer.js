import process from "node:process";
import nodemailer from "nodemailer";

export function getMailerConfig() {
	const user = process.env.EMAIL_USER;
	const pass = process.env.EMAIL_PASSWORD;

	if (!user || !pass) {
		return null;
	}

	return {
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
		secure: process.env.EMAIL_SECURE === "true",
		service: process.env.EMAIL_SERVICE || "gmail",
		auth: { user, pass },
	};
}

export function getPublicBaseUrl() {
	return process.env.PUBLIC_BASE_URL || process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
}

export function getBillDownloadUrl(orderId) {
	return `${getPublicBaseUrl()}/api/orders/${encodeURIComponent(orderId)}/bill`;
}

export function createMailerTransport() {
	const mailerConfig = getMailerConfig();
	if (!mailerConfig) {
		return null;
	}

	return nodemailer.createTransport(mailerConfig);
}

export async function sendEmail({ to, subject, html, text, attachments }) {
	const mailerConfig = getMailerConfig();
	if (!mailerConfig) {
		return { success: false, message: "Email is not configured" };
	}

	const transporter = nodemailer.createTransport(mailerConfig);
	const info = await transporter.sendMail({
		from: process.env.EMAIL_FROM || mailerConfig.auth.user,
		to,
		subject,
		html,
		text,
		attachments,
	});

	return { success: true, messageId: info.messageId };
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
