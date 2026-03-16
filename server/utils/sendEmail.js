// Simple email service using NodeMailer (stub for now)
// In production, you would configure nodemailer with your email service

export const sendEmail = async (to, subject, message) => {
  try {
    // TODO: Implement email sending using nodemailer or similar service
    console.log(`Email would be sent to ${to}: ${subject}`);
    return { success: true, message: 'Email queued for sending' };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export default sendEmail;
