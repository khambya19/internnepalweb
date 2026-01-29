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
        console.log(` Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(" Error sending email:", error);
        throw error; // Rethrow so the controller knows it failed
    }
}

module.exports = sendEmail;