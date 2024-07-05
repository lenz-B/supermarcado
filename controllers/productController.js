const categoryDB = require('../models/category');
const productDB = require('../models/products');
const orderDB = require('../models/orders')
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

const sortProducts = async (products, sortOption) => {
  switch (sortOption) {
    case 'popularity':
      return await sortProductsByPopularity(products);
    case 'new-arrivals' :
      return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'price-low-high':
      return products.sort((a, b) => {
        const aPrice = a.promoPrice > 0 ? a.promoPrice : a.price;
        const bPrice = b.promoPrice > 0 ? b.promoPrice : b.price;
        return aPrice - bPrice;
      });
    case 'price-high-low':
      return products.sort((a, b) => {
        const aPrice = a.promoPrice > 0 ? a.promoPrice : a.price;
        const bPrice = b.promoPrice > 0 ? b.promoPrice : b.price;
        return bPrice - aPrice;
      });
    default:
      return products;
  }
};

//checking popularity
const getOrderCounts = async () => {
  const orderAggregation = await orderDB.aggregate([
    { $unwind: '$orderedItems' },
    { $group: { _id: '$orderedItems.product_id', orderCount: { $sum: 1 } } }
  ]);

  // Convert aggregation result to a map for quick access
  const orderCounts = {};
  orderAggregation.forEach(order => {
    orderCounts[order._id] = order.orderCount;
  });
  // console.log(orderCounts);

  return orderCounts;
};

// popularity sort
const sortProductsByPopularity = async (products) => {
  const orderCounts = await getOrderCounts();

  return products.sort((a, b) => {
    const aPopularity = orderCounts[a._id] || 0;
    const bPopularity = orderCounts[b._id] || 0;
    return bPopularity - aPopularity;
  });
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
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    const { error } = productSchema.validate(req.body, { allowUnknown: true });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const {name, description, price, promoPrice, stock, category_id} = req.body;
    console.log('category_id:', category_id);

    const existingProduct = await productDB.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product name already exists' });
    }

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ message: 'Please upload at least 2 images.' });
    }

    const imageFilenames = req.files.map(file => file.filename);  
    console.log('imageFilenames:', imageFilenames);

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
    console.error(error); 
    return res.status(500).json({ message: 'An error occurred while adding the product' });
  }
}


//edit product
const editProduct = async (req, res) => {
  try {
    const productData = await productDB.findById(req.query.proId).populate('category_id');
    const categories = await categoryDB.find()

    res.render('admin/edit-product', { productData, categories });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
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
    const sortOption = req.query.sort || 'default';
    const categoryId = req.query.category;
    let priceRange = req.query.price;

    let query = { status: true };
    if (categoryId) {
      query.category_id = categoryId;
    }
    if (priceRange) {
      priceRange = priceRange.replace(/[^\d\s-]/g, '');
      const [minPrice, maxPrice] = priceRange.split('-').map(price => parseInt(price));
      query.price = { $gte: minPrice, $lte: maxPrice };
    }

    let productData = await productDB.find(query).populate('offer');

    productData = await updateAndCachePromoPrices(req, productData);

    productData = await sortProducts(productData, sortOption);

    const categoryData = await getHeaderData();

    res.render('user/shop', { user_id, productData, categoryData, sortOption, categoryId, priceRange });
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
    const relatedProducts = await productDB.find({ category_id: productData.category_id, _id: { $ne: productData._id }, status: true });

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
      user_id, productData, relatedProducts, categoryData, stockLeft, stockOut
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}

const quickView = async (req, res) => {
  try {
    console.log('Quick viewww');
    const productId = req.query.id;
    console.log('Fetching product details for ID:', productId);
    
    const product = await productDB.findById(productId).populate('category_id offer');
    console.log('Product details:', product);
    
    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'An error occurred', details: error.message });
  }
}


module.exports = {products, addProduct,
  addingProduct, editProduct, editingProduct,
  updateProStatus, shop, productDetails,
  quickView,
}