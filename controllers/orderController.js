const User = require('../models/users')
const categoryDB = require('../models/category');
const productDB = require('../models/products');
const cartDB = require('../models/cart')
const addressDB = require('../models/address')
const orderDB = require('../models/orders')
const {addressValidationSchema} = require('../models/joi');




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
    const cart = await cartDB.findOne({ user_id: userId }).populate('products.product_id');

    if (!cart) {
      throw new Error('Cart not found');
    }

    let orderTotal = 0;
    const shipping = 15;
    const vat = 0;

    cart.products.forEach(product => {
      const subTotal = product.product_id.price * product.quantity;
      product.subTotal = subTotal;
      orderTotal += subTotal;
    });

    orderTotal += shipping + vat;

    session.cartTotals = {
      subTotals: cart.products.map(product => ({
        productId: product.product_id._id,
        subTotal: product.subTotal,
        quantity: product.quantity 
      })),
      orderTotal: orderTotal,
      shipping: shipping,
      vat: vat
    };

    console.log('Cart totals calculated and stored in session:', session.cartTotals);
  } catch (error) {
    console.error('Error calculating cart totals:', error);
  }
}

//rendering the checkout page
const checkoutPage = async (req, res) => {
  try {
    console.log('checkout page');
    const { user_id } = req.session;
    const user = await User.findById(user_id)

    const categoryData = await getHeaderData();
    const addressData = await addressDB.findOne({user_id: user_id})
    const cartData = await cartDB.findOne({ user_id: user_id }).populate('products.product_id');
    console.log(cartData);
    console.log(addressData);

    await calculateCartTotals(user_id, req.session);
    console.log(req.session.cartTotals);
    const {orderTotal, subTotals} = req.session.cartTotals
    console.log('subtotals',subTotals);


    res.render('user/checkout', {user, user_id, categoryData, 
      addressData, cartData, orderTotal, subTotals})
  } catch (error) {
    console.log(error);
  }
}

//add and place order
const addOrder = async (req, res) => {
  try {
    console.log('add-address');
    const { user_id } = req.session;
    if (!user_id) {
      return res.status(401).json({ status: false, message: 'Unauthorized' });
    }

    console.log('req.body: ', req.body);

    const { error } = addressValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message });
    }

    const user_address = req.body;
    console.log(user_address);

    await addressDB.findOneAndUpdate(
      { user_id },
      { $push: { user_address: user_address } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Address added/updated successfully');

    await calculateCartTotals(user_id, req.session);

    const { subTotals, orderTotal, shipping, vat } = req.session.cartTotals;

    const newOrder = new orderDB({
      user_id,
      orderedItems: subTotals.map(subTotal => ({
        product_id: subTotal.productId,
        quantity: subTotal.quantity,
        subTotal: subTotal.subTotal,
        productStatus: 'Pending'
      })),
      paymentMethod: 'Cash on Delivery', 
      address: user_address,
      totalAmount: orderTotal,
      payment: 0, 
      orderStatus: 'Pending',
      date: new Date()
    });

    await newOrder.save();

    await cartDB.updateOne({ user_id: user_id }, { products: [] });

    console.log('Order placed successfully');

    return res.json({ status: true, message: 'Order Placed' });
  } catch (error) {
    console.error('Error adding address and placing order:', error);
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};

//placing order
const placeOrder = async (req, res) => {
  try {
    console.log('place order');
    console.log('req.body:', req.body);

    const { user_id } = req.session;
    const { addressIndex } = req.body;

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
        continue; 
      }
      product.stock -= subTotal.quantity;
      await product.save();
    }    
    
    const newOrder = new orderDB({
      user_id,
      orderedItems: subTotals.map(subTotal => ({
        product_id: subTotal.productId,
        quantity: subTotal.quantity,
        subTotal: subTotal.subTotal,
        productStatus: 'Pending'
        })),
      paymentMethod: 'Cash on Delivery', 
      address: orderAddress,
      totalAmount: orderTotal,
      payment: 0, 
      orderStatus: 'Pending',
      date: new Date()
    });
        
    await newOrder.save();
    console.log('Order placed successfully');

    await cartDB.updateOne({ user_id: user_id }, { products: [] });
    
    return res.json({ status: true, message: 'Order placed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Order placement failed' });
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
  cancelOrder, orders, updateOrderStatus, orderDetails,
}