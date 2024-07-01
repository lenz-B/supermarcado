const cron = require('node-cron');
const couponDB = require('../models/coupon')
const mongoose = require('mongoose');


// corn scheduled midnight every day
cron.schedule('0 0 * * *', async () => {
  try {
    const result = await couponDB.deleteMany({ expiry_date: { $lt: new Date() } });
    console.log(`Deleted ${result.deletedCount} expired coupons`);
  } catch (err) {
    console.error('Error deleting expired coupons:', err);
  }
});