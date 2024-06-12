const couponDB = require('../models/coupon')

//coupon list
const coupons = async (req, res) => {
  try {
    const couponData = await couponDB.find();
    res.render('admin/coupons', { couponData });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).send('Internal Server Error');
  }
}

//add coupon page
const addCoupon = async (req, res) => {
  try {
    res.render('admin/add-coupon')
  } catch (error) {
    
  }
}

//get data and saving the coupon
const addingCoupon = async (req, res) => {
  try {
    console.log('Add coupon');
    console.log('req: ', req.body);
    const { coupon_code, discount_percentage, expiry_date, min_purchase_amount, max_redeemable_amount } = req.body;

    if (!coupon_code || !discount_percentage || !expiry_date || !min_purchase_amount || !max_redeemable_amount) {
      return res.status(400).json({ status: false, message: 'All fields are required' });
    }

    const existingCoupon = await couponDB.findOne({ coupon_code });
    if (existingCoupon) {
      return res.status(400).json({ status: false, message: 'Coupon code already exists' });
    }

    const newCoupon = new couponDB({
      coupon_code,
      discount_percentage,
      expiry_date,
      min_purchase_amount,
      max_redeemable_amount
    });

    await newCoupon.save();
    res.status(201).json({ status: true, message: 'Coupon added successfully' });
  } catch (error) {
    console.error('Error adding coupon:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

//update status
const updateCouponStatus = async (req, res) => {
  try {
    const coupon = await couponDB.findById(req.params.id);
    if (coupon) {
      coupon.status = !coupon.status;
      await coupon.save();
    }
    res.redirect('/admin/coupons');
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    res.status(500).send('Internal Server Error');
  }
}

//coupon checking
const applyCoupon = async (req, res) => {
  try {
    console.log('apply coupon');
    const { coupon_code, totalAmount } = req.body;
    console.log('56565',coupon_code, totalAmount);

    const coupon = await couponDB.findOne({ status: true, coupon_code: coupon_code })
    console.log('coupon: ', coupon);
    
    if (!coupon) {
      console.log('coupon not exist');
      return res.json({ status: false, message: 'Invalid coupon code'});
    }

    const currentDate = new Date();

    if (coupon.expiry_date < currentDate) {
      return res.json({ status: false, message: 'This coupon has expired' });
    }
    
    if (coupon !== null && coupon.min_purchase_amount > totalAmount) {
      console.log('min: ', coupon.min_purchase_amount, ',  toatal: ', totalAmount);
      return res.json({ status: false, message: `This coupon is only valid for Purchases Over $${coupon.min_purchase_amount}`})
    }

    // Calculate the discount
    const discount = (totalAmount * coupon.discount_percentage) / 100;
    const discountedAmount = Math.min(discount, coupon.max_redeemable_amount);

    const totalAfterDiscount = totalAmount - discountedAmount;

    console.log('discount: '+ discount,
      'discount amount: '+ discountedAmount,
      'total after: '+ totalAfterDiscount,
    );

    req.session.discountedAmount = discountedAmount
    console.log('session:...',req.session.discountedAmount);

    return res.json({status: true, message: 'Coupon applied successfully',
      discount_percentage: coupon.discount_percentage,
      discount: discountedAmount,
      totalAmount,
      totalAfterDiscount
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
}

module.exports = { coupons, addCoupon, 
  addingCoupon, updateCouponStatus, applyCoupon

}