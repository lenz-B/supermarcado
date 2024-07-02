const categoryDB = require('../models/category');
const productDB = require('../models/products');
const cartDB = require('../models/cart')
const wishlistDB = require('../models/wishlist')
const orderDB = require('../models/orders')
const { productSchema } = require('../models/joi');



//___________________________________________________functions___________________________________________________

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
};

const updatePromoPricesAndExtractDiscount = async (products) => {
  try {
    const updatedProducts = await Promise.all(products.map(async (product) => {
      const activeOffers = product.offer.filter(offer => offer.status && new Date(offer.expiry_date) > new Date());
      let discount = 0;
      if (activeOffers.length > 0) {
        const latestOffer = activeOffers[activeOffers.length - 1];
        product.promoPrice = product.price - (product.price * latestOffer.discount) / 100;
        discount = latestOffer.discount;
      } // No need to set promoPrice if no active offers
      return { ...product.toObject(), discount };
    }));
    return updatedProducts;
  } catch (error) {
    throw new Error(`Error updating promo prices: ${error.message}`);
  }
};

const updateAndCachePromoPrices = async (req, products) => {
  const updatedProducts = await updatePromoPricesAndExtractDiscount(products);
  req.session.promoPrices = updatedProducts.reduce((acc, product) => {
    acc[product._id] = product.promoPrice;
    return acc;
  }, {});
  return updatedProducts;
};

//___________________________________________________user side___________________________________________________

//rendering cart
const cart = async (req, res) => {
  try {
    const { user_id } = req.session;
    if (!user_id) {
      throw new Error('User ID not found in session');
    }

    const categoryData = await getHeaderData();
    let cartData = await cartDB.findOne({ user_id: user_id }).populate('products.product_id');

    if (!cartData) {
      console.log('Cart data not found for user:', user_id);
      cartData = { products: [] };
    } else {
      const products = cartData.products.map(item => item.product_id);
      const updatedProducts = await updateAndCachePromoPrices(req, products);

      cartData.products.forEach(item => {
        const updatedProduct = updatedProducts.find(p => p._id.toString() === item.product_id._id.toString());
        item.product_id.promoPrice = updatedProduct.promoPrice;
        item.product_id.discount = updatedProduct.discount;
      });
    }

    res.render('user/cart', { user_id, categoryData, cartData });
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
      cart = await cartDB.create({
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

    await cart.populate('products.product_id')

    const products = cart.products.map(item => item.product_id);
    await updatePromoPricesAndExtractDiscount(products);

    return res.json({ success: true, message: 'Product added to cart successfully.', cart });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: 'Failed to add product to your cart.' });
  }
};


//updating the cart
const updateCart = async (req, res) => {
  try {
    console.log('update cart');
    const { product_id, quantity } = req.body;

    if (!product_id) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
    }

    const product = await productDB.findById(product_id).populate('offer');
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ message: 'Quantity exceeds available stock' });
    }

    console.log('Product:', product);
    console.log('Offers:', product.offer);

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

    const activeOffers = product.offer.filter(offer => {
      console.log('Checking offer:', offer);
      return offer.status && new Date(offer.expiry_date) > new Date();
    });

    console.log('Active Offers:', activeOffers);

    let subtotal;
    if (activeOffers.length > 0) {
        const latestOffer = activeOffers[activeOffers.length - 1];
        const offerPrice = product.price - (product.price * latestOffer.discount) / 100;
        subtotal = offerPrice * quantity;
        console.log('Promo subtotal:', subtotal);
    } else {
        subtotal = product.price * quantity;
        console.log('Regular subtotal:', subtotal);
    }

    res.json({ subtotal });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//remove product from the cart
const removeProduct = async (req, res) => {
  try {
    console.log('remove product' );
    const { product_id, wishlist } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    const { user_id } = req.session;
    const filter = { user_id};
    
    if (!wishlist) {
      const update = { $pull: { products: { product_id } } };
      await cartDB.updateOne(filter, update);
    } else {
      console.log('huuiuiu');
      update = { $pull: { products: product_id }};
      await wishlistDB.updateOne(filter, update);
    }
    
    res.status(200).json({ message: 'Product removed successfully' });

  } catch (error) {
    console.error('Error removing product:', error);
    res.status(500).json({ error: 'Internal server error' });    
  }
}

//wishlist
const wishlist = async (req, res) => {
  try {
    const { user_id } = req.session;
    const categoryData = await getHeaderData();
    const allProducts = await productDB.find();
    let wishlistData = await wishlistDB.findOne({ user_id }).populate('products');

    if (!wishlistData) {
      const newWishlist = new wishlistDB({ user_id, products: [] });
      wishlistData = await newWishlist.save();
    }

    res.render('user/wishlist', { user_id, categoryData, allProducts, wishlistData });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

//add to wishlist
const addToWishlist = async (req, res) => {
  try {
    console.log('add to wishlist');
    const { user_id } = req.session;
    if (!user_id) {
      console.log('user id missing');
      return res.json({ success: false, message: 'Please log in to add items to your cart.', redirectTo: '/login' });
    }
    const { product_id } = req.body;
    console.log('pro id: ', product_id);

    let wishlist = await wishlistDB.findOne({ user_id });

    if (!wishlist) {
      await wishlistDB.create({
        user_id,
        products: [product_id]
      });
    } else {
      if (!wishlist.products.includes(product_id)) {
        wishlist.products.push(product_id);
        await wishlist.save();
      }
    }

    res.json({ status: true, message: 'Product successfully added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.json({ status: false, message: 'Failed to add product to wishlist' });
  }
}




module.exports = { cart, addToCart, updateCart,
  removeProduct, wishlist, addToWishlist, 

}