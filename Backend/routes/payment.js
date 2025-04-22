const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe("sk_test_51RGfyVP1ptjuDMivctANkpaMXdOgZWFRnOs7dk1c1BwnEy27iM6aPfGhbLMPHsOLddvENjjiSVisSrtTypwjWeHF00gIr8BVmD"); // Replace with your real test secret key

router.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents (e.g., $10 = 1000)
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
