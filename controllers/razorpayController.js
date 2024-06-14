const btoa = require('btoa')

const createOrder_id = async (body) => {
  try {
    console.log('razor controller=-=-=--=-=-=-=-=-=-=-');
    const keyId = process.env.RAZORPAY_ID_KEY;
    const keySecret = process.env.RAZORPAY_SECRET_KEY;

    console.log('body: ', body);
    console.log('key:  ', keyId, '    ,', keySecret)
    

    const creds = btoa(`${keyId}:${keySecret}`);
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${creds}`
      },
      body: JSON.stringify(body)
    });

    return response
  } catch (error) {
    
  }
}


module.exports = {
  createOrder_id
}