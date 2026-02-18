import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async ({ amount, currency = "INR", receipt }) => {
  const options = {
    amount,
    currency,
    receipt,
    payment_capture: 1,
  };
  return await razorpay.orders.create(options);
};