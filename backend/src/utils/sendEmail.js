const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || 'smtp.ethereal.email',
	port: process.env.SMTP_PORT || 587,
	secure: false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS
	}
});

async function sendEmail({ to, subject, html }) {
	const mailOptions = {
		from: process.env.SMTP_FROM || 'no-reply@internnepal.com',
		to,
		subject,
		html
	};
	return transporter.sendMail(mailOptions);
}

module.exports = sendEmail;
