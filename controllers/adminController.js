const bcrypt = require('bcrypt');
const User = require('../models/users')
const categoryDB = require('../models/category')
const productDB = require('../models/products');
const cartDB = require('../models/cart')
const orderDB = require('../models/orders')



//__________________________________________________functions_________________________________________________

const fetchTopSellingProducts = async (timeRange) => {
  try {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(0); // All time
    }

    const allOrders = await orderDB.find({ date: { $gte: startDate } });
    const allOrderedItems = allOrders.flatMap(order => order.orderedItems);
    const productQuantities = allOrderedItems.reduce((acc, item) => {
      acc[item.product_id.toString()] = (acc[item.product_id.toString()] || 0) + item.quantity;
      return acc;
    }, {});
    const sortedProducts = Object.keys(productQuantities).sort((a, b) => productQuantities[b] - productQuantities[a]);
    const topProducts = sortedProducts.slice(0, 10);
    const topProductsDetails = await productDB.find({ _id: { $in: topProducts } });
    const productNames = topProductsDetails.map(product => product.name);
    const productQuantitiesSold = topProducts.map(id => productQuantities[id]);
    const topTenProducts = {
      topProductsDetails: topProductsDetails,
      productNames: productNames,
      productQuantitiesSold: productQuantitiesSold
    }
    return topTenProducts;
  } catch (error) {
    throw new Error('Error fetching top selling products: ' + error.message);
  }
};

const fetchTopSellingCategories = async (timeRange) => {
  try {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(0); // All time
    }

    const allOrders = await orderDB.find({ date: { $gte: startDate } }).populate({
      path: 'orderedItems.product_id',
      populate: {
        path: 'category_id',
        select: 'name'
      },
      select: 'name'
    });

    const allOrderedItems = allOrders.flatMap(order => order.orderedItems);

    const categoryQuantities = allOrderedItems.reduce((acc, item) => {
      const categoryId = item.product_id.category_id._id.toString();
      acc[categoryId] = (acc[categoryId] || 0) + item.quantity;
      return acc;
    }, {});

    const sortedCategories = Object.keys(categoryQuantities).sort((a, b) => categoryQuantities[b] - categoryQuantities[a]);

    const topCategories = sortedCategories.slice(0, 10);

    const topCategoriesDetails = await categoryDB.find({ _id: { $in: topCategories } });

    const categoryNames = topCategoriesDetails.map(category => category.name);
    const categoryQuantitiesSold = topCategories.map(id => categoryQuantities[id]);

    const topTenCategories = {
      topCategoriesDetails: topCategoriesDetails,
      categoryNames: categoryNames,
      categoryQuantitiesSold: categoryQuantitiesSold
    };

    return topTenCategories;
  } catch (error) {
    throw new Error('Error fetching top selling categories: ' + error.message);
  }
};

//_________________________________________________admin side_________________________________________________

//admin home page
const adminDash = async (req, res) => {
  try {
    console.log('admin dash ------------------------');
    let orderData = await orderDB.find()
      .populate('user_id', 'username email')
      .populate({
        path: 'orderedItems.product_id',
        populate: {
          path: 'category_id',
          select: 'name'
        },
        select: 'name price'
      });

      orderData = orderData.filter(order => order.user_id);

      const filteredOrderData = await orderDB.find({ orderStatus: { $ne: 'Cancelled' } });

    const overallSalesCount = filteredOrderData.reduce((count, order) => count + order.orderedItems.length, 0);
    const overallOrderAmount = filteredOrderData.reduce((total, order) => total + order.totalAmount, 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate monthly earnings
    const monthlyEarnings = filteredOrderData
    .filter(order => {
      const orderDate = new Date(order.date);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    })
    .reduce((total, order) => total + order.totalAmount, 0);

    const formattedData = orderData
    .filter(order => order.orderStatus !== 'Cancelled')
    .map(order => ({
      id: order._id,
      Name: order.address.name,
      Email: order.user_id.email,
      Total: order.totalAmount,
      Status: order.orderStatus,
      Date: order.date.toLocaleDateString(),
      Products: order.orderedItems.map(item => ({
        productName: item.product_id.name,
        productPrice: item.product_id.price,
        category: item.product_id.category_id.name,
        quantity: item.quantity,
        subTotal: item.subTotal,
        productStatus: item.productStatus
      }))
    }));

    const categoryData = await categoryDB.find().select('name'); 

    const topTenProductsWeek = await fetchTopSellingProducts('week');
    const topTenProductsMonth = await fetchTopSellingProducts('month');
    const topTenProductsYear = await fetchTopSellingProducts('year');
    const topTenProductsAllTime = await fetchTopSellingProducts();

    const topTenCategoriesWeek = await fetchTopSellingCategories('week');
    const topTenCategoriesMonth = await fetchTopSellingCategories('month');
    const topTenCategoriesYear = await fetchTopSellingCategories('year');
    const topTenCategoriesAllTime = await fetchTopSellingCategories();

    res.render('admin/dashboard', {
      orderData: formattedData, categoryData, overallOrderAmount, overallSalesCount, monthlyEarnings,
      topTenProductsWeek: JSON.stringify(topTenProductsWeek),
      topTenProductsMonth: JSON.stringify(topTenProductsMonth),
      topTenProductsYear: JSON.stringify(topTenProductsYear),
      topTenProductsAllTime: JSON.stringify(topTenProductsAllTime),
      topTenCategoriesWeek: JSON.stringify(topTenCategoriesWeek),
      topTenCategoriesMonth: JSON.stringify(topTenCategoriesMonth),
      topTenCategoriesYear: JSON.stringify(topTenCategoriesYear),
      topTenCategoriesAllTime: JSON.stringify(topTenCategoriesAllTime)
    })
      
  } catch (error) {
    console.log('error in dashboard: ', error.message);
  }
}

//sales report page
const salesReport = async (req, res) => {
  try {
    console.log('sales-report');
    const { sort, startDate, endDate } = req.query;
    let filter = { orderStatus: { $ne: 'Cancelled' } };

    switch (sort) {
      case 'Custom':
        if (startDate && endDate) {
          filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        break;
      case 'Daily':
        filter.date = { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lte: new Date() };
        break;
      case 'Weekly':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        filter.date = { $gte: startOfWeek, $lte: endOfWeek };
        break;
      case 'Monthly':
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);
        filter.date = { $gte: startOfMonth, $lte: endOfMonth };
        break;
      case 'Yearly':
        const startOfYear = new Date();
        startOfYear.setMonth(0);
        startOfYear.setDate(1);
        startOfYear.setHours(0, 0, 0, 0);
        const endOfYear = new Date(startOfYear);
        endOfYear.setFullYear(endOfYear.getFullYear() + 1);
        endOfYear.setDate(0);
        endOfYear.setHours(23, 59, 59, 999);
        filter.date = { $gte: startOfYear, $lte: endOfYear };
        break;
    }

    const orderData = sort !== 'All' ? await orderDB.find(filter) : await orderDB.find({ orderStatus: { $ne: 'Cancelled' } });

    res.render('admin/sales-report', { orderData });

    // const orderData = await orderDB.find(filter);
    // res.render('admin/sales-report', { orderData });
  } catch (error) {
    console.error('Error in sales report:', error);
    res.status(500).send('Internal Server Error');
  }
}

//login
const login = async (req, res) => {
  res.render('admin/login')
}

//loging in
const logingin = async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const { FOR_ADMIN_EMAIL, FOR_ADMIN_EMAIL_PASSWORD } = process.env;
    
    if (email === FOR_ADMIN_EMAIL && password === FOR_ADMIN_EMAIL_PASSWORD) {
      req.session.adminId = email;
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.json({ success: false, message: 'Invalid email or password' });
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log('error in login', error.message);
  }  
}

//logout
const logout = async (req, res) => {
  console.log("logout")
  req.session.destroy()
  res.send({status:true})
}

const user = async (req, res) => {
  try {
    const userData = await User.find()
    
    res.render('admin/user', {userData })
  } catch (error) {
    
  }
}

//block and unblock
const userStatus = async (req, res) => {
  try {
    const { id: userId } = req.params;
    console.log('id ' +userId);

    const user = await User.findById(userId)
    console.log('user fond: ' + user.username);

    if (user) {
      user.is_block = !user.is_block;
      const update = await user.save();
      console.log(`${user.username}'s status changed to : ${user.is_block}`);
      res.send({success: true})
    } else {
      console.log('user id not found');
      res.send({success: false})
    }
  } catch (error) {
    console.log("Error in block user", error.message)
  }
}

//Error page 404
const page404 = async (req, res) => {
  try {
    res.render('admin/page-error-404')
  } catch (error) {
    
  }
}
module.exports = {adminDash, salesReport,
  login, logingin, logout, user, userStatus,
  page404
}