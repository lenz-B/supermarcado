const User = require('../models/users')
const categoryDB = require('../models/category');
const productDB = require('../models/products');
const cartDB = require('../models/cart')
const addressDB = require('../models/address')
const orderDB = require('../models/orders')
const offerDB = require('../models/offer')
const razorpayController = require('./razorpayController')
const Razorpay = require('razorpay')
const crypto = require('crypto');
const {addressValidationSchema} = require('../models/joi');




// razorpay instance 
var razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY
});

//__________________________________________________function__________________________________________________

//category data
const getHeaderData = async () => {
  const categories = await categoryDB.find({ status: true }).lean();
  const products = await productDB.find({ status: true }).populate('category_id').lean();

  const categoryData = categories.map(category => ({
    ...category,
    products: products.filter(product => product.category_id._id.toString() === category._id.toString())
  }));

  return categoryData;
};

const updatePromoPrices = async (products) => {
  try {
    const updatedProducts = await Promise.all(products.map(async (product) => {
      const activeOffers = product.offer.filter(offer => offer.status && new Date(offer.expiry_date) > new Date());
      if (activeOffers.length > 0) {
        const latestOffer = activeOffers[activeOffers.length - 1];
        product.promoPrice = product.price - (product.price * latestOffer.discount) / 100;
      } else {
        product.promoPrice = 0;
      }
      await product.save();
      return product;
    }));
    return updatedProducts;
  } catch (error) {
    throw new Error(`Error updating promo prices: ${error.message}`);
  }
};

const updateAndCachePromoPrices = async (req, products) => {
  const updatedProducts = await updatePromoPrices(products);
  req.session.promoPrices = updatedProducts.reduce((acc, product) => {
    acc[product._id] = product.promoPrice;
    return acc;
  }, {});
  return updatedProducts;
};

//calculation
async function calculateCartTotals(userId, session) {
  try {
    const cart = await cartDB.findOne({ user_id: userId }).populate('products.product_id');

    if (!cart) {
      throw new Error('Cart not found');
    }

    let orderTotal = 0;
    const shipping = 15;
    const vat = 0;

    for (const product of cart.products) {
      let promoPrice = product.product_id.price; // Default to regular price

      // Check if there are any offers associated with the product
      if (product.product_id.offer.length > 0) {
        const lastOfferId = product.product_id.offer[product.product_id.offer.length - 1];
        const offer = await offerDB.findById(lastOfferId);

        if (offer) {
          // Calculate promoPrice based on offer's discount
          promoPrice = product.product_id.price - (product.product_id.price * offer.discount) / 100;
        }
      }

      const subTotal = promoPrice * product.quantity;
      product.subTotal = subTotal;
      orderTotal += subTotal;
    }

    orderTotal += shipping + vat;

    session.cartTotals = {
      subTotals: cart.products.map(product => ({
        productId: product.product_id._id,
        subTotal: product.subTotal,
        quantity: product.quantity,
      })),
      orderTotal: orderTotal,
      shipping: shipping,
      vat: vat,
    };

    console.log('Cart totals calculated and stored in session:', session.cartTotals);
  } catch (error) {
    console.error('Error calculating cart totals:', error);
  }
}


//__________________________________________________user side__________________________________________________

//rendering the checkout page
const checkoutPage = async (req, res) => {
  try {
    console.log('checkout page');
    const { user_id } = req.session;
    const user = await User.findById(user_id)

    const categoryData = await getHeaderData();
    const addressData = await addressDB.findOne({user_id: user_id})
    const cartData = await cartDB.findOne({ user_id: user_id }).populate('products.product_id');
    // console.log(cartData);
    // console.log(addressData);

    await calculateCartTotals(user_id, req.session);
    console.log(req.session.cartTotals);
    const {orderTotal, subTotals} = req.session.cartTotals
    console.log('subtotals: ',subTotals);


    res.render('user/checkout', {user, user_id, categoryData, 
      addressData, cartData, orderTotal, subTotals})
  } catch (error) {
    console.log(error);
  }
}

//add and place order
const addOrder = async (req, res) => {
  // try {
  //   console.log('add-address');
  //   const { user_id } = req.session;
  //   if (!user_id) {
  //     return res.status(401).json({ status: false, message: 'Unauthorized' });
  //   }

  //   console.log('req.body: ', req.body);

  //   const { error } = addressValidationSchema.validate(req.body.user_address);
  //   if (error) {
  //     return res.status(400).json({ status: false, message: error.details[0].message });
  //   }

  //   const {user_address, paymentMethod} = req.body;
  //   console.log('pay: ', paymentMethod, 'user_address: ', user_address);

  //   await addressDB.findOneAndUpdate(
  //     { user_id },
  //     { $push: { user_address: user_address } },
  //     { upsert: true, new: true, setDefaultsOnInsert: true }
  //   );

  //   console.log('Address added/updated successfully');

  //   await calculateCartTotals(user_id, req.session);

  //   const { subTotals, orderTotal, shipping, vat } = req.session.cartTotals;


  //   const newOrder = new orderDB({
  //     user_id,
  //     orderedItems: subTotals.map(subTotal => ({
  //       product_id: subTotal.productId,
  //       quantity: subTotal.quantity,
  //       subTotal: subTotal.subTotal,
  //       productStatus: 'Pending'
  //     })),
  //     paymentMethod: paymentMethod, 
  //     address: user_address,
  //     totalAmount: orderTotal,
  //     payment: 0, 
  //     orderStatus: 'Pending',
  //     date: new Date()
  //   });

  //   await newOrder.save();

  //   if (paymentMethod == 'Razorpay') {
  //     console.log('razorkk ethii');
  //     const razorpayOrder = await razorpayInstance.orders.create({
  //       amount: orderTotal * 100,
  //       currency: 'INR', 
  //       receipt: `receipt_order_${newOrder._id}`,
  //       payment_capture: '1'
  //     })
  //     newOrder.razorpay_id = razorpayOrder.id
  //     await newOrder.save()

  //     //res
  //     return res.json({
  //       status: true, 
  //       message: 'Razorpay order created and ready for payment.',
  //       order_id: newOrder._id,
  //       razorpay_id: razorpayOrder.id,
  //       amount: newOrder.totalAmount * 100,
  //       key_id: process.env.RAZORPAY_ID_KEY
  //     })
  //   } else {
  //     newOrder.orderStatus = "Processing"
  //     await newOrder.save()
  //   }

  //   await cartDB.updateOne({ user_id: user_id }, { products: [] });

  //   console.log('Order placed successfully');

  //   return res.json({ status: true, message: 'Order Placed' });
  // } catch (error) {
  //   console.error('Error adding address and placing order:', error);
  //   res.status(500).json({ status: false, message: 'Internal Server Error' });
  // }
};

//placing order
const placeOrder = async (req, res) => {
  try {
    console.log('place order');
    console.log('req.body:', req.body);

    const { user_id } = req.session;
    const { addressIndex, paymentMethod } = req.body;

    console.log('address index ind: ', addressIndex, ' , payment method ind: ', paymentMethod);

    if (addressIndex === undefined || addressIndex === '') {
      return res.status(400).json({ status: false, message: 'No address selected' });
    }

    const userAddresses = await addressDB.findOne({ user_id: user_id });

    if (!userAddresses || !userAddresses.user_address[addressIndex]) {
      return res.status(400).json({ status: false, message: 'Invalid address selected' });
    }

    const orderAddress = userAddresses.user_address[addressIndex];
    console.log('6996969 ', orderAddress);

    await calculateCartTotals(user_id, req.session);

    const { subTotals, orderTotal, shipping, vat } = req.session.cartTotals;

    for (const subTotal of subTotals) {
      const product = await productDB.findById(subTotal.productId);
      if (!product) {
        console.error(`Product with id ${subTotal.productId} not found`);
        res.status(500).json({ status: false, message: `Order placement failed: Product with id ${subTotal.productId} not found` });
        return; 
      }
    
      if (subTotal.quantity > product.stock) {
        console.error(`Product with id ${subTotal.productId} is out of stock`);
        res.status(400).json({ status: false, message: `Order placement failed: Some of the products are out of stock` });
        return;  
      }
    
      product.stock -= subTotal.quantity;
      await product.save();
    }
    let total_amount; 

    let discountedAmount = req.session.discountedAmount
    
    if (discountedAmount) {
      total_amount = orderTotal - discountedAmount;
      console.log('total: with: ', total_amount);
    } else {
      total_amount = orderTotal;
      console.log('total: ', total_amount);
    }
    console.log('fianal total', total_amount);
    
    const newOrder = new orderDB({
      user_id,
      orderedItems: subTotals.map(subTotal => ({
        product_id: subTotal.productId,
        quantity: subTotal.quantity,
        subTotal: subTotal.subTotal,
        productStatus: 'Pending'
        })),
      paymentMethod: paymentMethod, 
      address: orderAddress,
      totalAmount: total_amount,
      payment: 0, 
      orderStatus: 'Pending',
      date: new Date()
    });
        
    await newOrder.save();
    console.log('12121: ', newOrder.totalAmount);
    console.log('Order placed successfully');

    if (paymentMethod == 'Razorpay') {
      console.log('razorkk ethii');
      const razorDataRes = await razorpayController.createOrder_id({
        "amount": newOrder.totalAmount * 100,
        "currency": "INR"
      })
  
      const razorData = await razorDataRes.json()
      // await newOrder.save()

      //res
      return res.json({
        status: true, 
        message: 'Razorpay order created and ready for payment.',
        order_id: newOrder._id,
        razorpay_id: razorData.id,
        amount: newOrder.totalAmount * 100,
        key_id: process.env.RAZORPAY_ID_KEY
      })
    } else {
      newOrder.orderStatus = "Processing"
      await newOrder.save()
    }

    delete req.session.discountedAmount

    await cartDB.updateOne({ user_id: user_id }, { products: [] });
    
    return res.json({ status: true, message: 'Order placed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Order placement failed' });
  }
};

//razorpay
const captureRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, placed_order_id } = req.body;
    const { user_id } = req.session;
    console.log('Razorpay signature:', razorpay_signature);
    console.log('Order ID:', razorpay_order_id);
    console.log('Payment ID:', razorpay_payment_id);
    console.log('asdfasdf: ', placed_order_id )

    if (!user_id) {
      return res.status(401).json({ status: false, message: 'Unauthorized' });
    }

    // Fetch the order
    const order = await orderDB.findOne({ _id: placed_order_id });

    if (!order) {
      return res.status(404).json({ status: false, message: 'Order not found' });
    }

    // Verify the payment signature
    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.log('Generated signature:', generated_signature);
      console.log('Razorpay signature:', razorpay_signature);
      console.log('Order ID:', razorpay_order_id);
      console.log('Payment ID:', razorpay_payment_id);
      return res.status(400).json({ status: false, message: 'Invalid payment signature' });
    } 

    // If verification is successful, mark payment as completed
    order.payment = order.totalAmount;
    order.orderStatus = 'Processing';
    await order.save();

    return res.json({ status: true, message: 'Payment verified and order updated' });
  } catch (error) {
    console.error('Error capturing Razorpay payment:', error);
    return res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};

const razorpayWebhook = async (req, res) => {
  console.log('webhook//////////');
  const secret = process.env.RAZORPAY_SECRET_KEY;

  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest === req.headers['x-razorpay-signature']) {
    try {
      // Handle the event
      const event = req.body.event;
      const payload = req.body.payload;

      switch (event) {
        case 'payment.captured':
          const payment = payload.payment.entity;
          // Update the order status here
          const order = await orderDB.findOne({ razorpay_id: payment.order_id });

          if (order) {
            order.payment = order.totalAmount;
            order.orderStatus = 'Processing';
            await order.save();
          }
          break;
        // Handle other events if necessary
        default:
          break;
      }
      return res.json({ status: true });
    } catch (error) {
      console.error('Error handling Razorpay webhook:', error);
      return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
  } else {
    return res.status(400).json({ status: false, message: 'Invalid signature' });
  }
};

//cancel order
const cancelOrder = async (req, res) => {
  try {
    console.log('cancel order');
    const { orderId } = req.body;
    const order = await orderDB.findById(orderId);

    if (!order) {
      return res.status(404).send('Order not found');
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    res.send({ success: true });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).send('Internal Server Error');
  }
}


//admin orders
const orders = async (req, res) => {
  try {
    const orderData = await orderDB.find()
      .populate('user_id', 'username email')
      .populate('orderedItems.product_id', 'name price');

    const formattedData = orderData.map(order => ({
      id: order._id,
      Name: order.user_id.username,
      Email: order.user_id.email,
      Total: order.totalAmount,
      Status: order.orderStatus,
      Date: order.date.toLocaleDateString(),
      Products: order.orderedItems.map(item => ({
        productName: item.product_id.name,
        productPrice: item.product_id.price,
        quantity: item.quantity,
        subTotal: item.subTotal,
        productStatus: item.productStatus
      }))
    }));

    res.render('admin/orders', { orderData: formattedData });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
};

//update status
const updateOrderStatus = async (req, res) => {
  try {
    console.log('update order status');
    const { orderId, newStatus } = req.body;
    console.log('order id: ', orderId, 'status: ', newStatus);

    const order = await orderDB.findByIdAndUpdate(orderId, { orderStatus: newStatus });
    if (!order) {
      console.log('poyii monee');
      res.json({ success: false });
    } else {
      console.log('okke ready yaa');
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false });
  }
}

//order details page
const orderDetails = async (req, res) => {
  try {
    const order_id = req.query.order_id;
    if (!order_id) {
      return res.status(400).send('Order ID is required');
    }

    const order = await orderDB.findById(order_id)
      .populate('user_id', 'username email')
      .populate('orderedItems.product_id', 'name price');

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const formattedOrder = {
      id: order._id,
      Name: order.user_id.username,
      Email: order.user_id.email,
      Total: order.totalAmount,
      Status: order.orderStatus,
      Date: order.date.toLocaleDateString(),
      Products: order.orderedItems.map(item => ({
        productName: item.product_id.name,
        productPrice: item.product_id.price,
        quantity: item.quantity,
        subTotal: item.subTotal,
        productStatus: item.productStatus
      }))
    };

    res.render('admin/order-details', { order: formattedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};




module.exports = { checkoutPage, addOrder, placeOrder,
  captureRazorpayPayment, razorpayWebhook, cancelOrder,
  orders, updateOrderStatus, orderDetails, 
}