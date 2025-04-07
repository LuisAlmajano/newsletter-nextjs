import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT!, 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export const sendOptInEmail = async (email: string, token: string) => {
  const mailOptions = {
    from: '"Newsletter-subscription" <noreply@luisalmajano.com>',
    to: email,
    subject: "Confirm Your Subscription",
    html: `<h1 style="font-size: 1.5rem; font-weight: 700;">Thanks for signing up!</h1></p>
           <p style="font-size: 1.125rem; color: #4a5568;">Please confirm your subscription by clicking on the link below:</p>
           <p><a href="${process.env.BASE_URL}/api/confirm?token=${token}" style="display: block; width: 100%; font-size: 16px; background-color: #38b2ac; color: #ffffff; padding: 0.5rem; border-radius: 0.25rem; text-align: center; text-decoration: none; transition: background-color 0.2s;">Confirm Subscription</a></p>`,
  };

  await transporter.sendMail(mailOptions);
};
