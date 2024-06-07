const categoryDB = require('../models/category');
const productDB = require('../models/products');
const cartDB = require('../models/cart')
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
    // console.error('Error in cart controller:', error);
    // res.status(500).send('Internal Server Error');
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

   // Check if the cart already exists for the user
    let cart = await cartDB.findOne({ user_id });

    if (!cart) {
      // If no cart exists, create a new one with the product
      await cartDB.create({
        user_id,
        products: [{ product_id: productId, quantity }]
      });
    } else {
      // If cart exists, update or add the product
      const productIndex = cart.products.findIndex(product => product.product_id.toString() === productId);

      if (productIndex !== -1) {
        // If the product is already in the cart, update its quantity
        cart.products[productIndex].quantity += quantity;
      } else {
        // If the product is not already in the cart, add it
        cart.products.push({ product_id: productId, quantity });
      }

      // Save the updated cart
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

    // Validate product ID
    if (!product_id) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    // Validate quantity
    if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid quantity' });
    }

    // Check if product exists
    const product = await productDB.findById(product_id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    // Update cart
    const { user_id } = req.session;
    const filter = { user_id: user_id, 'products.product_id': product_id };
    const update = { $set: { 'products.$.quantity': quantity } };
    const options = { new: true }; 
    let updatedCart = await cartDB.findOneAndUpdate(filter, update, options);

    // If product is not already in cart, add it
    if (!updatedCart) {
        updatedCart = await cartDB.findOneAndUpdate(
            { user_id: user_id },
            { $push: { products: { product_id: product_id, quantity: quantity } } },
            options
        );
    }

    // Calculate subtotal
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

    // Validate product ID
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Update cart
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