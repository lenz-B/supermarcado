const categoryDB = require('../models/category');
const productDB = require('../models/products');
const offerDB = require('../models/offer')
const { productSchema } = require('../models/joi');



//______________________________________________functions________________________________________________________

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

//__________________________________________________admin side__________________________________________________

// product list
const products = async (req, res) => {
  try {
    const productData = await productDB.find()

    res.render('admin/products', {productData})
  } catch (error) {
    console.log(error); 
  }
}

//add product
const addProduct = async (req, res) => {
  try {
    const category =await categoryDB.find()
    res.render('admin/add-product',{category})
  } catch (error) {
    console.log(error);  
  }
}

//get data for add product
const addingProduct = async (req, res) => {
  try {
    console.log('adding product');
    console.log(req.body);

    const { error } = productSchema.validate(req.body, { allowUnknown: true });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const {name, description, price, promoPrice, stock, category_id} = req.body
    console.log('files: ', req.files);
    console.log('category_id:', category_id);

    const existingProduct = await productDB.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product name already exist' });
    }

    if(!req.files || !req.files.length === 4) {
      req.flash('error', 'Media not selected')
      return res.redirect('add-product')
    }

    const imageFilenames = req.files.map(file => file.filename);  
    console.log('suiiii: ', imageFilenames);


    await productDB.create({
      name,
      description,
      price,
      promoPrice,
      stock,
      category_id,
      img: imageFilenames
    });

    return res.json({ save: true, message: 'Product added successfully' });
  } catch (error) {
    console.log(error); 
    return res.status(500).json({ message: 'An error occurred while adding the product' });
  }
}

//edit product
const editProduct = async (req, res) => {
  try {
    const productData = await productDB.findById(req.query.proId)
    const category =await categoryDB.find()  
  
    res.render('admin/edit-product', {productData, category})
    
  } catch (error) {
    console.log(error);
  }
}

// get edited data
const editingProduct = async (req, res) => {
  try {
    console.log('edting product...');
    console.log("Request query:", req.query);
    console.log("Request files:", req.files);

    const { name, description, price, promoPrice, stock, category_id } = req.body;
    const { proId } = req.query;
    const img = req.files;

    if (!proId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const updateData = { name, description, price, promoPrice, stock, category_id };

    if (img && img.length > 0) {
      updateData.img = img.map(file => file.filename);
    }

    const update = await productDB.findByIdAndUpdate(
      proId,
      { $set: updateData },
      { new: true }
    );

    if (update) {
      return res.status(200).json({ message: 'Product edited successfully', save: true });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'An error occurred while updating the product' });
  }
}

//list and unlist
const updateProStatus = async (req, res) => {
  try {
    const {id: proId} = req.params;
    console.log('id: ', proId);

    const pro = await productDB.findById(proId)
    if (pro) {
      pro.status = !pro.status
      await pro.save();
      console.log(`${pro.name}'s status changed to: ${pro.status}`);

      res.send({success: true})
    } else {
      console.log('Product id not found');
      res.send({success: false})
    }
  } catch (error) {
    console.log('error in updating product status',error.message);
  }
}

//_______________________________________________user side_____________________________________________________

//user side product list
async function shop(req, res) {
  try {
    const { user_id } = req.session;
    let productData = await productDB.find({ status: true }).populate('offer');

    // Update promo prices
    productData = await updateAndCachePromoPrices(req, productData);

    const categoryData = await getHeaderData();

    res.render('user/shop', { user_id, productData, categoryData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}

//product details
const productDetails = async (req, res) => {
  try {
    const { user_id } = req.session;
    const productData = await productDB.findById(req.query.proId).populate('offer');

    let promoPrice = req.session.promoPrices ? req.session.promoPrices[productData._id] : null;

    if (promoPrice === null) {
      const updatedProductData = await updateAndCachePromoPrices(req, [productData]);
      promoPrice = updatedProductData[0].promoPrice;
    } else {
      productData.promoPrice = promoPrice;
    }

    const categoryData = await getHeaderData();
    const stockLeft = productData.stock < 6;
    const stockOut = productData.stock < 1;

    res.render('user/product-details', { 
      user_id, productData, categoryData, stockLeft, stockOut
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}



module.exports = {products, addProduct,
  addingProduct, editProduct, editingProduct,
  updateProStatus, shop, productDetails, 
}