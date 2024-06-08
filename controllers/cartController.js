const categoryDB = require('../models/category');
const productDB = require('../models/products');
const cartDB = require('../models/cart')
const orderDB = require('../models/orders')
const { productSchema } = require('../models/joi');




const getHeaderData = async () => {
  const categories = await categoryDB.find({ status: true }).lean();
  const products = await productDB.find({ status: true }).populate('category_id').lean();

  const categoryData = categories.map(category => ({
    ...category,
    products: products.filter(product => product.category_id._id.toString() === category._id.toString())
  }));

  return categoryData;
};

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
        subTotal: product.subTotal
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


// page render
const cart = async (req, res) => {
  try {
      const { user_id } = req.session;
      if (!user_id) {
        throw new Error('User ID not found in session');
      }
    const categoryData = await getHeaderData();
    const productData = await productDB.find();
    const cartData = await cartDB.findOne({ user_id: user_id }).populate('products.product_id');


    if (!cartData) {
      console.log('Cart data not found for user:', user_id);
    }

    

    res.render('user/cart', { user_id, categoryData, productData, cartData });
  } catch (error) {
    console.error('Error in cart controller:', error);
    res.status(500).send('Internal Server Error');
  }
};


//add to cart
const addToCart = async (req, res) => {
  try {
    console.log('add to cart');
    const { user_id } = req.session;
    if (!user_id) {
      console.log('user id illa');
      return res.json({ success: false, message: 'Please log in to add items to your cart.', redirectTo: '/login' });
    }

    const { productId, quantity } = req.body;

    const product = await productDB.findById(productId);

    if (quantity > product.stock) {
      return res.json({ success: false, message: 'Quantity exceeds available stock.' });
    }

    let cart = await cartDB.findOne({ user_id });

    if (!cart) {
      await cartDB.create({
        user_id,
        products: [{ product_id: productId, quantity }]
      });
    } else {
      const productIndex = cart.products.findIndex(prod => prod.product_id.toString() === productId);

      if (productIndex !== -1) {
        if (cart.products[productIndex].quantity + quantity > product.stock) {
          return res.json({ success: false, message: 'Quantity exceeds available stock.' });
        }
        cart.products[productIndex].quantity += quantity;
      } else {
        cart.products.push({ product_id: productId, quantity });
      }

      await cart.save();
    }

    return res.json({ success: true, message: 'Product added to cart successfully.' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Failed to add product to your cart.' });
  }
};

//updating the cart
const updateCart = async (req, res) => {
  try {
    console.log('update cart');
    const { product_id, quantity } = req.body;

    if (!product_id) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid quantity' });
    }

    const product = await productDB.findById(product_id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const { user_id } = req.session;
    const filter = { user_id: user_id, 'products.product_id': product_id };
    const update = { $set: { 'products.$.quantity': quantity } };
    const options = { new: true }; 
    let updatedCart = await cartDB.findOneAndUpdate(filter, update, options);

    if (!updatedCart) {
        updatedCart = await cartDB.findOneAndUpdate(
            { user_id: user_id },
            { $push: { products: { product_id: product_id, quantity: quantity } } },
            options
        );
    }

    const subtotal = product.price * quantity;

    res.json({ subtotal });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//remove product from the cart
const removeProduct = async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const { user_id } = req.session;
    const filter = { user_id: user_id };
    const update = { $pull: { products: { product_id: product_id } } };
    await cartDB.updateOne(filter, update);

    res.status(200).json({ message: 'Product removed successfully' });    
  } catch (error) {
    console.error('Error removing product:', error);
    res.status(500).json({ error: 'Internal server error' });    
  }
}




module.exports = { cart, addToCart, updateCart,
  removeProduct, 

}