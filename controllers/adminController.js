const bcrypt = require('bcrypt');
const User = require('../models/users')
const categoryDB = require('../models/category')
const productDB = require('../models/products');
const orderDB = require('../models/orders')

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

      const filteredOrderData = await orderDB.find({ orderStatus: { $ne: 'Cancelled' } });

    console.log('Queryyyyyyy: ', req.que);
    const { category, product, startDate, endDate, timeFilter } = req.query;
    console.log(category, product, startDate, endDate, timeFilter);    

    if (category && category !== 'all') {
      // Filter orders by category
      orderData = orderData.filter(order =>
        order.orderedItems.some(item => item.product_id.category_id.name === category)
      );
    }

    if (product && product !== 'all') {
      // Filter orders by product
      orderData = orderData.filter(order =>
        order.orderedItems.some(item => item.product_id.name === product)
      );
    }

    if (startDate && endDate) {
      // Filter orders by date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      orderData = orderData.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= start && orderDate <= end;
      });
    }

    if (timeFilter && timeFilter !== 'all') {
      // Filter orders based on time filter (day, week, month, year)
      const now = new Date();
      const start = new Date(now);
      if (timeFilter === 'week') {
        start.setDate(start.getDate() - 7);
      } else if (timeFilter === 'month') {
        start.setMonth(start.getMonth() - 1);
      } else if (timeFilter === 'year') {
        start.setFullYear(start.getFullYear() - 1);
      }
      orderData = orderData.filter(order => new Date(order.date) >= start);
    }

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
      const productData = productDB.find()
    

  res.render('admin/dashboard', {
    orderData: formattedData, categoryData, overallOrderAmount, overallSalesCount, monthlyEarnings, 
   })
    
  } catch (error) {
    console.log('error in dashboard: ', error.message);
  }
}

//sales report page
const salesReport = async (req, res) => {
  try {
    console.log('sales-report');
    const orderData = await orderDB.find({ orderStatus: { $ne: 'Cancelled' } });
    const overallOrderAmount = orderData.reduce((total, order) => total + order.totalAmount, 0);

    res.render('admin/sales-report', {orderData, overallOrderAmount})
  } catch (error) {
    
  }
}

// filter
const salesFilter = async (req, res) => {
  try {
    console.log('sales filter ;;;;;;;;;;;;;;;;;;;');
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

    const filteredOrderData = orderData.filter(order => order.orderStatus !== 'Cancelled');

    console.log('Queryyyyyyy: ', req.que);
    const { category, product, startDate, endDate, timeFilter } = req.query;
    console.log(category, product, startDate, endDate, timeFilter);    

    if (category && category !== 'all') {
      // Filter category
      orderData = orderData.filter(order =>
        order.orderedItems.some(item => item.product_id.category_id.name === category)
      );
    }

    if (product && product !== 'all') {
      // Filter product
      orderData = orderData.filter(order =>
        order.orderedItems.some(item => item.product_id.name === product)
      );
    }

    if (startDate && endDate) {
      // Filter date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      orderData = orderData.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= start && orderDate <= end;
      });
    }

    if (timeFilter && timeFilter !== 'all') {
      // time filter (day, week, month, year)
      const now = new Date();
      const start = new Date(now);
      if (timeFilter === 'week') {
        start.setDate(start.getDate() - 7);
      } else if (timeFilter === 'month') {
        start.setMonth(start.getMonth() - 1);
      } else if (timeFilter === 'year') {
        start.setFullYear(start.getFullYear() - 1);
      }
      orderData = orderData.filter(order => new Date(order.date) >= start);
    }

    res.redirect('/', {orderData})
  } catch (error) {
    
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

module.exports = {adminDash, salesFilter, salesReport,
  login, logingin, logout, user, userStatus
}