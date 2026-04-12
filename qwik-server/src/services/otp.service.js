const crypto = require("crypto");
const nodemailer = require("nodemailer");

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const OTP_EXPIRY_MINUTES = 10;

// FIX 1: Add connectionTimeout and socketTimeout so a bad SMTP config fails
// in ~10 seconds instead of hanging for 2 minutes (nodemailer default).
const transporter = nodemailer.createTransport({
  host:    process.env.EMAIL_HOST,
  port:    parseInt(process.env.EMAIL_PORT),
  secure:  false,
  auth:    { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  // Fail fast — don't hang the request for 2 minutes on misconfigured SMTP
  connectionTimeout: 10000,   // 10s to establish TCP connection
  greetingTimeout:   8000,    // 8s to receive SMTP greeting
  socketTimeout:     15000,   // 15s of inactivity before abort
});

const sendEmailOTP = async (email, otp) => {
  // verify() throws quickly if credentials / host are wrong
  await transporter.verify();
  await transporter.sendMail({
    from:    `"Qwik" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: "Your Qwik verification code",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto">
        <h2 style="color:#1D9E75">Qwik</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing:8px;color:#1D9E75">${otp}</h1>
        <p style="color:#888">This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color:#bbb;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
  });
};

// Visitor phone OTP stub — wire to Fast2SMS / Twilio when needed
const sendSMSOTP = async (phone, otp) => {
  console.log(`[SMS stub] OTP ${otp} → ${phone}`);
};

const saveOTPToUser = async (user, otp) => {
  user.otp = otp;
  user.otp_expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });
};

const verifyOTPForUser = (user, inputOtp) => {
  if (!user.otp || !user.otp_expires_at) return { valid: false, reason: "No OTP found. Please request a new one." };
  if (new Date() > user.otp_expires_at)  return { valid: false, reason: "OTP has expired. Please request a new one." };
  if (user.otp !== inputOtp)             return { valid: false, reason: "Incorrect OTP. Please try again." };
  return { valid: true };
};

const clearOTP = async (user) => {
  user.otp = undefined;
  user.otp_expires_at = undefined;
  await user.save({ validateBeforeSave: false });
};

module.exports = {
  generateOTP, sendEmailOTP, sendSMSOTP,
  saveOTPToUser, verifyOTPForUser, clearOTP,
};
