const cartDB = require('../models/cart');

const cartMiddleware = async (req, res, next) => {
  try {
    const { user_id } = req.session;

    if (user_id) {
      const cartData = await cartDB.findOne({ user_id }).populate('products.product_id');
      if (cartData) {
        await calculateCartTotals(user_id, req.session);
        res.locals.cartTotals = req.session.cartTotals;
        res.locals.cartProducts = cartData.products;
      } else {
        res.locals.cartTotals = null;
        res.locals.cartProducts = [];
      }
    } else {
      res.locals.cartTotals = null;
      res.locals.cartProducts = [];
    }
  } catch (error) {
    console.error('Error in cart middleware:', error);
    res.locals.cartTotals = null;
    res.locals.cartProducts = [];
  }
  next();
};

async function calculateCartTotals(userId, session) {
  try {
    const cart = await cartDB.findOne({ user_id: userId }).populate('products.product_id');

    if (!cart) {
      session.cartTotals = null;
      return;
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
      vat: vat,
      totalItems: cart.products.length
    };

    console.log('Cart totals calculated and stored in session:', session.cartTotals);
  } catch (error) {
    console.error('Error calculating cart totals:', error);
  }
}

module.exports = cartMiddleware;
