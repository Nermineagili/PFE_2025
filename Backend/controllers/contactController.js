const nodemailer = require("nodemailer");
require("dotenv").config();

const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // Utilise true pour le port 465, sinon false pour 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `Message de ${name} - Contact Us`,
      text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email envoyé avec succès." });
  } catch (error) {
    console.error("Erreur d'envoi d'email: ", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email." });
  }
};

module.exports = { sendContactEmail };
