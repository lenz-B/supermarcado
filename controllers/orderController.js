const User = require('../models/users')
const categoryDB = require('../models/category');
const productDB = require('../models/products');
const cartDB = require('../models/cart')
const addressDB = require('../models/address')
const orderDB = require('../models/orders')
const offerDB = require('../models/offer')
const walletDB = require('../models/wallet')
const razorpayController = require('./razorpayController')
const Razorpay = require('razorpay')
const couponDB = require('../models/coupon')
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

//calculation
async function calculateCartTotals(userId, session) {
  try {
    const cart = await cartDB.findOne({ user_id: userId }).populate({
      path: 'products.product_id',
      populate: {
        path: 'offer',
        model: 'Offer'
      }
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    let orderTotal = 0;
    let offerDiscount = 0;
    const vat = 0;

    for (const product of cart.products) {
      let promoPrice = product.product_id.price;

      const activeOffers = product.product_id.offer.filter(offer => offer.status && new Date(offer.expiry_date) > new Date());

      if (activeOffers.length > 0) {
        const latestOffer = activeOffers[activeOffers.length - 1];
        offerDiscount = (product.product_id.price * latestOffer.discount) / 100;
        promoPrice = product.product_id.price - offerDiscount;
        console.log('Promotional Price: ', promoPrice);
      } else {
        console.log('No valid offer found.');
      }

      const subTotal = promoPrice * product.quantity;
      product.subTotal = subTotal;
      orderTotal += subTotal;
    }

    // Calculate shipping based on the new system
    let shipping;
    if (orderTotal < 200) {
      shipping = 30;
    } else if (orderTotal < 500) {
      shipping = 15;
    } else {
      shipping = 0;
    }

    orderTotal += shipping + vat;

    session.cartTotals = {
      subTotals: cart.products.map(product => ({
        productId: product.product_id._id,
        price: product.product_id.price - offerDiscount,
        subTotal: product.subTotal,
        quantity: product.quantity,
      })),
      orderTotal: orderTotal,
      shipping: shipping,
      vat: vat,
      offerDiscount: offerDiscount,
    };

    console.log('Order total: ', orderTotal);
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
    const user = await User.findById(user_id);
    const categoryData = await getHeaderData();
    const addressData = await addressDB.findOne({ user_id: user_id });
    const cartData = await cartDB.findOne({ user_id: user_id }).populate('products.product_id');
    const walletData = await walletDB.findOne({ user_id });
    const couponData = await couponDB.find({ status: true });
    // console.log(cartData);
    // console.log(addressData);

    if (!cartData) {
      console.log('ayyoo cart illaaa........');
      const userWithoutCart = true
      const orderTotal = 0

      res.render('user/checkout', {user, user_id, categoryData, 
        addressData, orderTotal, userWithoutCart})
    }
    await calculateCartTotals(user_id, req.session);
    console.log(req.session.cartTotals);
    const {orderTotal, subTotals, shipping} = req.session.cartTotals

    // console.log('ooooooooooooorder total: ', orderTotal);
    console.log('subtotals: ',subTotals);

    res.render('user/checkout', {user, user_id, categoryData, shipping,
      addressData, cartData, orderTotal, subTotals, walletData, couponData})
  } catch (error) {
    console.log(error);
  }
}

//placing order
const placeOrder = async (req, res) => {
  try {
    console.log('place order');
    console.log('req.body:', req.body);

    const { user_id } = req.session;
    const { addressIndex, paymentMethod } = req.body;

    const cart = await cartDB.findOne({ user_id });

    if (!cart?.products?.length) {
      console.log('ullil ethiii');
      return res.status(400).json({ status: false, message: 'Please select a product' });
    }

    console.log('address index ind: ', addressIndex, ' , payment method ind: ', paymentMethod);

    if (!addressIndex) {
      return res.status(400).json({ status: false, message: 'Please select an address' });
    }

    const userAddresses = await addressDB.findOne({ user_id });
    if (!userAddresses || !userAddresses.user_address[addressIndex]) {
      return res.status(400).json({ status: false, message: 'Invalid address selected' });
    }

    const orderAddress = userAddresses.user_address[addressIndex];
    console.log('6996969 ', orderAddress);

    await calculateCartTotals(user_id, req.session);

    const { subTotals, orderTotal, offerDiscount, shipping, vat } = req.session.cartTotals;
    const productsToUpdate = [];

    for (const subTotal of subTotals) {
      const product = await productDB.findById(subTotal.productId);
      if (!product) {
        console.error(`Product with id ${subTotal.productId} not found`);
        return res.status(500).json({ status: false, message: `Order placement failed: Product with id ${subTotal.productId} not found` });
      }

      if (subTotal.quantity > product.stock) {
        console.error(`Product with id ${subTotal.productId} is out of stock`);
        return res.status(400).json({ status: false, message: `Order placement failed: Some of the products are out of stock` });
      }

      productsToUpdate.push({ product, quantity: subTotal.quantity });
    }

    for (const { product, quantity } of productsToUpdate) {
      product.stock -= quantity;
      await product.save();
    }

    let total_amount = orderTotal;
    const discountedAmount = req.session.discountedAmount || 0;
    
    
    if (discountedAmount) {
      console.log('disssssssssss: ', discountedAmount);
      console.log('orrrrrrrrrrrder: ', orderTotal);
      total_amount -= discountedAmount;
      console.log('total: with: ', total_amount);
    } 
    
    console.log('final total', total_amount);
    

    if (paymentMethod === 'Cash on delivery' && total_amount > 1000) {
      return res.status(403).json({ message: 'Cash on Delivery is not allowed for orders above 1000.' });
    }

    const wallet = await walletDB.findOneAndUpdate(
      { user_id },
      { $setOnInsert: { user_id } },
      { new: true, upsert: true }
    );

    if (paymentMethod === 'Wallet' && wallet.wallet_amount < total_amount) {
      return res.status(403).json({ message: "Uh-oh, your wallet's on a diet!" });
    }

    const newOrder = new orderDB({
      user_id,
      orderedItems: subTotals.map(subTotal => ({
        product_id: subTotal.productId,
        price: subTotal.price,
        quantity: subTotal.quantity,
        subTotal: subTotal.subTotal,
        productStatus: 'Pending'
      })),
      paymentMethod,
      address: orderAddress,
      offerDiscount: offerDiscount,
      couponDiscount: discountedAmount,
      totalAmount: total_amount,
      payment: 0,
      orderStatus: 'Pending',
      date: new Date()
    });

    await newOrder.save();
    console.log('12121: ', newOrder.totalAmount);
    console.log('Order placed successfully');

    if (paymentMethod === 'Razorpay') {
      console.log('razork ethii');
      const razorDataRes = await razorpayController.createOrder_id({
        "amount": newOrder.totalAmount * 100,
        "currency": "INR"
      });

      const razorData = await razorDataRes.json();

      return res.json({
        status: true,
        message: 'Razorpay order created and ready for payment.',
        order_id: newOrder._id,
        razorpay_id: razorData.id,
        amount: newOrder.totalAmount * 100,
        key_id: process.env.RAZORPAY_ID_KEY
      });
    } else {
      newOrder.orderStatus = "Placed";
      await newOrder.save();

      if (paymentMethod === 'Wallet') {
        await walletDB.findOneAndUpdate(
          { user_id },
          {
            $inc: { wallet_amount: -newOrder.totalAmount },
            $push: {
              transaction_history: {
                amount: newOrder.totalAmount,
                Payment_type: "Debit",
                date: new Date()
              }
            }
          },
          { new: true, upsert: true }
        );
      }

      delete req.session.discountedAmount;
      await cartDB.updateOne({ user_id }, { products: [] });

      return res.json({ status: true, message: 'Order placed successfully' });
    }
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
    console.log('User ID: ', placed_order_id )

    if (!user_id) {
      return res.status(401).json({ status: false, message: 'Unauthorized' });
    }

    const order = await orderDB.findOne({ _id: placed_order_id });

    if (!order) {
      return res.status(404).json({ status: false, message: 'Order not found' });
    }

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

    order.payment = order.totalAmount;
    order.orderStatus = 'Placed';
    await order.save();
    delete req.session.discountedAmount;
    await cartDB.updateOne({ user_id: user_id }, { products: [] });

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
      const event = req.body.event;
      const payload = req.body.payload;

      switch (event) {
        case 'payment.captured':
          const payment = payload.payment.entity;
          const order = await orderDB.findOne({ razorpay_id: payment.order_id });

          if (order) {
            order.payment = order.totalAmount;
            order.orderStatus = 'Placed';
            await order.save();
          }
          break;
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

const finishPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { user_id } = req.session;

    const order = await orderDB.findOne({ _id: orderId, user_id });

    if (!order) {
      return res.status(404).json({ status: false, message: 'Order not found' });
    }

    if (order.orderStatus !== 'Pending') {
      return res.status(400).json({ status: false, message: 'Invalid order status' });
    }

    const razorDataRes = await razorpayController.createOrder_id({
      "amount": order.totalAmount * 100,
      "currency": "INR"
    });

    const razorData = await razorDataRes.json();

    return res.json({
      status: true,
      message: 'Razorpay order created and ready for payment.',
      order_id: order._id,
      razorpay_id: razorData.id,
      amount: order.totalAmount * 100,
      key_id: process.env.RAZORPAY_ID_KEY,
      user_address: order.address
    });
  } catch (error) {
    console.error('Error finishing payment:', error);
    return res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};

//cancel order
const cancelOrder = async (req, res) => {
  try {
    console.log('cancel order..................');
    const { orderId } = req.body;
    const order = await orderDB.findById(orderId);

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const cancellableStatuses = ['Pending', 'Processing', 'Shipped', 'Placed'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.send({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    order.orderStatus = 'Cancelled';

    // Update product stock
    for (const item of order.orderedItems) {
      const product = await productDB.findById(item.product_id);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Handle wallet update
    if (order.paymentMethod === 'Wallet' || order.paymentMethod === 'Razorpay') {
      let wallet = await walletDB.findOne({ user_id: order.user_id });

      if (!wallet) {
        wallet = await walletDB.create({ user_id: order.user_id });
      }

      console.log('Current wallet amount:', wallet.wallet_amount);
      console.log('Order total amount:', order.totalAmount);

      await walletDB.findOneAndUpdate(
        { user_id: order.user_id },
        {
          $inc: { wallet_amount: order.totalAmount },
          $push: {
            transaction_history: {
              amount: order.totalAmount,
              Payment_type: 'Credit',
              date: new Date()
            }
          }
        },
        { new: true, upsert: true }
      );

      console.log('New wallet amount:', wallet.wallet_amount);

      await wallet.save();
    }

    await order.save();

    res.send({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).send('Internal Server Error');
  }
};


//wallet page
const walletPage = async (req, res) => {
  try {
    console.log('wallet page');

    let limit = 5;
    let page = parseInt(req.query.page) || 1;
    let skip = (page - 1) * limit;

    const { user_id } = req.session;
    const categoryData = await getHeaderData();

    let walletData = await walletDB
      .findOne({ user_id })
      .populate('user_id');

    if (!walletData) {
      console.log('Wallet not found for user:', user_id);
      return res.render('user/wallet', { user_id, categoryData, walletData: null, paginatedTransactions: [], page, pageCount: 0, limit });
    }

    walletData.transaction_history.sort((a, b) => b.date - a.date);

    let transactionCount = walletData.transaction_history.length;
    let pageCount = Math.ceil(transactionCount / limit);

    let paginatedTransactions = walletData.transaction_history.slice(skip, skip + limit);

    res.render('user/wallet', { user_id, categoryData, walletData, paginatedTransactions, page, pageCount, limit });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};



//__________________________________________________admin side__________________________________________________

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
      PaymentMethod: order.paymentMethod,
      Date: order.date.toLocaleDateString(),
      Products: order.orderedItems.map(item => ({
        productName: item.product_id.name,
        productPrice: item.product_id.price,
        img: item.product_id.img,
        quantity: item.quantity,
        subTotal: item.subTotal,
        productStatus: item.productStatus
      })),
      Address: {
        city: order.address.city,
        address: order.address.address,
        pin: order.address.pin
      }
    };

    res.render('admin/order-details', { order: formattedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};



module.exports = { checkoutPage, placeOrder,
  captureRazorpayPayment, razorpayWebhook, finishPayment,
  cancelOrder, orders, updateOrderStatus, orderDetails,
  walletPage,
}