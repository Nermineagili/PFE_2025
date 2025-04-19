const nodemailer = require("nodemailer");
require("dotenv").config();

const ContactMessage = require("../models/ContactMessage");

const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    // Save message to DB
    const newMessage = new ContactMessage({ name, email, message });
    await newMessage.save();

    // ✅ Correction ici : on utilise await au lieu de callback
    const messages = await ContactMessage.find({});
    console.log("Messages in the database:", messages);

    // Send email to supervisor
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `Message de ${name} - Contact Us`,
      text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
    });

    res.json({ success: true, message: "Email envoyé et enregistré avec succès." });
  } catch (error) {
    console.error("Erreur d'envoi d'email: ", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email." });
  }
};

const replyToUser = async (req, res) => {
  const { to, subject, message, messageId } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Insurance Supervisor" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: message,
    });

    if (messageId) {
      await ContactMessage.findByIdAndUpdate(messageId, {
        replied: true,
        replyMessage: message,
        repliedAt: new Date(),
      });
    }

    res.json({ success: true, message: "Réponse envoyée avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la réponse:", error);
    res.status(500).json({ error: "Échec de l'envoi de la réponse." });
  }
};

module.exports = { sendContactEmail, replyToUser };
