const couponDB = require('../models/coupon')
const offerDB = require('../models/offer')
const categoryDB = require('../models/category')
const productDB = require('../models/products')


//_____________________________________________________functions_____________________________________________________

//generating coupon code
function generateCouponCode(couponName, discountPercentage) {
  const formattedName = couponName.replace(/\s+/g, '').toUpperCase();
  // Take the first 10 characters (or less if the name is shorter)
  const namePrefix = formattedName.slice(0, 10);
  // Add the discount percentage
  return `${namePrefix}${discountPercentage}`;
}


//____________________________________________________admin side____________________________________________________

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
    const { coupon_name, discount_percentage, expiry_date, min_purchase_amount, max_redeemable_amount } = req.body;
    if (!coupon_name || !discount_percentage || !expiry_date || !min_purchase_amount || !max_redeemable_amount) {
      return res.status(400).json({ status: false, message: 'All fields are required' });
    }

    // Generate coupon code
    let couponCode = generateCouponCode(coupon_name, discount_percentage);

    //checking coupon code already exists
    let existingCoupon = await couponDB.findOne({ coupon_code: couponCode });
    let counter = 1;
    while (existingCoupon) {
      const newCouponCode = `${couponCode}${counter}`;
      existingCoupon = await couponDB.findOne({ coupon_code: newCouponCode });
      if (!existingCoupon) {
        couponCode = newCouponCode;
        break;
      }
      counter++;
    }

    const newCoupon = new couponDB({
      coupon_name,
      coupon_code: couponCode,
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
    console.log('56565', coupon_code, totalAmount);

    const coupon = await couponDB.findOne({ status: true, coupon_code });
    console.log('coupon: ', coupon);
    
    if (!coupon) {
      console.log('coupon not exist');
      return res.json({ status: false, message: 'Invalid coupon code' });
    }

    const currentDate = new Date();

    if (coupon.expiry_date < currentDate) {
      return res.json({ status: false, message: 'This coupon has expired' });
    }

    if (coupon.min_purchase_amount > totalAmount) {
      console.log('min: ', coupon.min_purchase_amount, ', total: ', totalAmount);
      return res.json({ status: false, message: `This coupon is only valid for purchases over $${coupon.min_purchase_amount}` });
    }

    // Calculate the discount
    const discount = (totalAmount * coupon.discount_percentage) / 100;
    const discountedAmount = Math.min(discount, coupon.max_redeemable_amount);
    const totalAfterDiscount = totalAmount - discountedAmount;

    console.log('discount: ' + discount,
      'discount amount: ' + discountedAmount,
      'total after: ' + totalAfterDiscount,
    );

    req.session.totalAfterDiscount = totalAfterDiscount;
    req.session.discountedAmount = discountedAmount;
    console.log('session:...', req.session.discountedAmount, req.session.totalAfterDiscount);

    return res.json({
      status: true,
      message: 'Coupon applied successfully',
      discount_percentage: coupon.discount_percentage,
      discount: discountedAmount,
      totalAmount,
      totalAfterDiscount
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


//remove coupon
const removeCoupon = async (req, res) => {
  try {
    console.log('remove coupon');

    const totalAmount = req.session.totalAmount || 0;
    
    req.session.discountedAmount = 0;
    
    res.json({ status: true, message: 'Coupon discount removed successfully', totalAmount });
  } catch (error) {
    console.error('Error removing coupon discount:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

// --------------------------------------------  offers  --------------------------------------------

//offer list
const offers = async (req, res) => {
  try {
    const offerData = await offerDB.find();
    res.render('admin/offers', { offerData });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).send('Internal Server Error');
  }
}
//offer page
const addOffer = async (req, res) => {
  try {
    const categoryData = await categoryDB.find({status: true})
    const productData = await productDB.find({status: true})

    res.render('admin/add-offer', { categories: categoryData, products: productData });
  } catch (error) {
    res.status(500).send({ message: 'Error fetching categories and products' });
  }
};

//creating offer
const addingOffer = async (req, res) => {
  try {
    console.log('Received offer data:', req.body);
    const {name, offer_type, category_name, product_name, discount, max_redeemable_amount, expiry_date} = req.body

    const categoryData = await categoryDB.find({status: true})
    const productData = await productDB.find({status: true})

    let newOffer = new offerDB({
      name, offer_type, discount, max_redeemable_amount, expiry_date
    })

    if (offer_type ==='Product') {
      console.log('product anu kettaa');
      newOffer.product_name = product_name
      await newOffer.save()
      const offer_id = newOffer._id
      await productDB.findOneAndUpdate(
        { name: product_name }, 
        { $push: { offer: offer_id } },
        { upsert: true, returnOriginal: false }
      );
    } else if (offer_type === 'Category') {
      console.log('cate anuuuu');
      newOffer.category_name = category_name
      await newOffer.save()
      const offer_id = newOffer._id
      const product = await productDB.updateMany({ category_id: category_name }, { $push: { offer: offer_id } })
    }

    res.status(200).json({ status: true, message: 'Offer added successfully' });
  } catch (error) {
    console.error('Error adding offer:', error);
    res.status(500).json({ status: false, message: 'Error adding offer' });
  }
}

//update status
const updateOfferStatus = async (req, res) => {
  try {
    const offer = await offerDB.findById(req.params.id);
    if (offer) {
      offer.status = !offer.status;
      await offer.save();
    }
    delete req.session.promoPrices

    res.redirect('/admin/offers');
  } catch (error) {
    console.error('Error toggling offer status:', error);
    res.status(500).send('Internal Server Error');
  }
}


module.exports = { coupons, addCoupon, 
  addingCoupon, updateCouponStatus, applyCoupon,
  removeCoupon, offers, addOffer, addingOffer, 
  updateOfferStatus,
}