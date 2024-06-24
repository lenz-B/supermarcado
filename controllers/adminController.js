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


// filter
const salesFilter = async (req, res) => {
  try {
      console.log('sales filter ;;;;;;;;;;;;;;;;;;;');
      console.log('req body: ', req.body);
      const { selectedValue, startDateValue, endDateValue } = req.body;

      let filter = {};

      switch (selectedValue) {
          case 'Daily':
              filter.date = {
                  $gte: moment().startOf('day').toDate(),
                  $lt: moment().endOf('day').toDate()
              };
              break;
          case 'Weekly':
              filter.date = {
                  $gte: moment().startOf('week').toDate(),
                  $lt: moment().endOf('week').toDate()
              };
              break;
          case 'Monthly':
              filter.date = {
                  $gte: moment().startOf('month').toDate(),
                  $lt: moment().endOf('month').toDate()
              };
              break;
          case 'Yearly':
              filter.date = {
                  $gte: moment().startOf('year').toDate(),
                  $lt: moment().endOf('year').toDate()
              };
              break;
          case 'Custom':
            if (!startDateValue || !endDateValue) {
                return res.status(400).json({ error: 'Start and end dates are required for custom filter' });
            }
            filter.date = {
                $gte: new Date(startDateValue),
                $lt: new Date(endDateValue)
            };
            break;
          default:
            break;
      }

      const orders = await orderDB.find(filter).populate('user_id').populate('orderedItems.product_id');
      res.json({ filter: orders });
  } catch (error) {
      console.error('Error in sales filter:', error);
      res.status(500).json({ error: 'Internal server error' });
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