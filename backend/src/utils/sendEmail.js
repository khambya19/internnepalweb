const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

async function sendEmail({ to, subject, html }) {
    const mailOptions = {
        from: `"InternNepal" <${process.env.EMAIL_FROM}>`, 
        to,
        subject,
        html
    };
    
    // Check if email credentials are provided to avoid crashes
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error(" Email credentials missing in .env file");
        return;
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.info(` Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(' Error sending email:', error.message);
        return null;
    }
}

/**
 * Send a simple email when an interview is scheduled for a student.
 * Does not throw; returns null if credentials missing or send fails.
 */
async function sendInterviewScheduledEmail({
    to,
    studentName,
    jobTitle,
    companyName,
    interviewDate,
    interviewTime,
    interviewMessage,
}) {
    const dateStr = interviewDate
        ? new Date(interviewDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
        : 'To be confirmed';
    const timeStr = interviewTime || '';
    const details = interviewMessage ? String(interviewMessage).trim() : '';

    const subject = `Interview scheduled: ${jobTitle} at ${companyName}`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 16px;">
  <p>Hi ${studentName || 'there'},</p>
  <p>Good news! You have been scheduled for an interview.</p>
  <p><strong>Role:</strong> ${jobTitle || 'N/A'}<br>
  <strong>Company:</strong> ${companyName || 'N/A'}<br>
  <strong>Date:</strong> ${dateStr}<br>
  ${timeStr ? `<strong>Time:</strong> ${timeStr}<br>` : ''}</p>
  ${details ? `<pre style="background: #f5f5f5; padding: 12px; border-radius: 6px; white-space: pre-wrap;">${details}</pre>` : ''}
  <p>Log in to your InternNepal dashboard to view your applications and any updates.</p>
  <p>Good luck!</p>
  <p>— InternNepal Team</p>
</body>
</html>`;
    return sendEmail({ to, subject, html });
}

/**
 * Send a rejection email to a student.
 * Does not throw; returns null if credentials missing or send fails.
 */
async function sendRejectionEmail({
    to,
    studentName,
    jobTitle,
    companyName,
    rejectionReason,
}) {
    const subject = `Application update: ${jobTitle} at ${companyName}`;
    const reasonText = rejectionReason ? String(rejectionReason).trim() : '';
    
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 16px;">
  <p>Hi ${studentName || 'there'},</p>
  <p>Thank you for your interest in the <strong>${jobTitle || 'position'}</strong> role at <strong>${companyName || 'our company'}</strong>.</p>
  <p>After careful consideration, we have decided to move forward with other candidates whose experience and qualifications more closely match our current needs.</p>
  ${reasonText ? `<div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 16px 0;">
    <p style="margin: 0; font-size: 14px;"><strong>Additional feedback:</strong></p>
    <p style="margin: 8px 0 0 0; white-space: pre-wrap;">${reasonText}</p>
  </div>` : ''}
  <p>We appreciate the time and effort you invested in your application. We encourage you to apply for other opportunities on InternNepal that match your skills and interests.</p>
  <p>We wish you all the best in your career journey.</p>
  <p>— InternNepal Team</p>
</body>
</html>`;
    return sendEmail({ to, subject, html });
}

module.exports = sendEmail;
module.exports.sendInterviewScheduledEmail = sendInterviewScheduledEmail;
module.exports.sendRejectionEmail = sendRejectionEmail;
