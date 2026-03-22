const crypto = require("crypto");
const nodemailer = require("nodemailer");

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const OTP_EXPIRY_MINUTES = 10;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmailOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"Qwik" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Qwik verification code",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto">
        <h2 style="color:#1D9E75">Qwik</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing:8px;color:#1D9E75">${otp}</h1>
        <p style="color:#888">This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      </div>`,
  });
};

// For visitors (phone OTP) — stub, wire to Fast2SMS or Twilio
const sendSMSOTP = async (phone, otp) => {
  console.log(`[SMS] Send OTP ${otp} to ${phone}`);
  // TODO: integrate Fast2SMS / Twilio here
};

const saveOTPToUser = async (user, otp) => {
  user.otp = otp;
  user.otp_expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });
};

const verifyOTPForUser = (user, inputOtp) => {
  if (!user.otp || !user.otp_expires_at) return { valid: false, reason: "No OTP found" };
  if (new Date() > user.otp_expires_at) return { valid: false, reason: "OTP expired" };
  if (user.otp !== inputOtp) return { valid: false, reason: "Incorrect OTP" };
  return { valid: true };
};

const clearOTP = async (user) => {
  user.otp = undefined;
  user.otp_expires_at = undefined;
  await user.save({ validateBeforeSave: false });
};

module.exports = { generateOTP, sendEmailOTP, sendSMSOTP, saveOTPToUser, verifyOTPForUser, clearOTP };
