const nodemailer = require('nodemailer');

const getSmtpPort = () => Number(process.env.SMTP_PORT || 587);

const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransporter = () => {
  const port = getSmtpPort();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendPasswordResetOtp = async ({ to, otp, expiresInMinutes }) => {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured');
    }

    console.log(`Password reset OTP for ${to}: ${otp}`);
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = createTransporter();

  await transporter.sendMail({
    from,
    to,
    subject: 'Prameela Boutique admin password reset OTP',
    text: [
      'Use this OTP to reset your Prameela Boutique admin password:',
      '',
      otp,
      '',
      `This OTP expires in ${expiresInMinutes} minutes.`,
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; color: #2f2533; line-height: 1.5;">
        <h2>Prameela Boutique Admin Password Reset</h2>
        <p>Use this OTP to reset your admin password:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${otp}</p>
        <p>This OTP expires in ${expiresInMinutes} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  sendPasswordResetOtp,
};
