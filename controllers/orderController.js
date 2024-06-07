const User = require('../models/users')
const categoryDB = require('../models/category');
const productDB = require('../models/products');
const cartDB = require('../models/cart')
const addressDB = require('../models/address')



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



    res.render('user/checkout', {user, user_id, categoryData, addressData, cartData})
  } catch (error) {
    console.log(error);
  }
}



module.exports = { checkoutPage, 
}