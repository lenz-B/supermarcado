const Joi = require('joi');

const emailRegex = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,4}$/;


// Joi schema for user validation
const joiRegSchema = Joi.object({
  fname: Joi.string()
    .regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/).required().messages({
      'string.pattern.base': 'First name must contain only alphabetic characters and spaces',
      'any.required': 'First name is required',
    }),
  lname: Joi.string()
    .regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/).messages({
      'string.pattern.base': 'Last name must contain only alphabetic characters and spaces',
    }),
  username: Joi.string()
    .regex(/^[a-zA-Z0-9_ ]+$/).min(3).max(17).required().messages({
      'string.pattern.base': 'Username can only contain alphabetic characters, numbers, underscores, and spaces',
      'string.min': 'Username must be at least {#limit} characters long',
      'string.max': 'Username cannot be longer than {#limit} characters',
      'any.required': 'Username is required',
    }),
    email: Joi.string().pattern(emailRegex).required().messages({
      'string.pattern.base': 'Invalid email format',
      'any.required': 'Email is required',
    }),
  phone: Joi.string()
    .pattern(new RegExp('^[0-9]{10}$')).required().messages({
      'string.pattern.base': 'Phone number must be 10 digits long',
      'any.required': 'Phone number is required',
    }),
  password: Joi.string().min(6)
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?])(?=.*[A-Z]).*$/)
    .required().messages({
      // 'string.min': 'Password must be at least {#limit} characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  confirmpassword: Joi.string().valid(Joi.ref('password')).messages({
      'any.only': 'Confirm password must match the password',
      'any.required': 'Confirm password is required',
    }),
    // newPassword: Joi.string().min(6)
    // .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?])(?=.*[A-Z]).*$/)
    // .messages({
    //   'string.pattern.base': 'New password must contain at least one uppercase letter, one number, and one special character',
    // }),
});

//joi cat validation 
const categorySchema = Joi.object({
  name: Joi.string().min(3).required().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters long',
      'any.required': 'Name is required',
  }),
  description: Joi.string().min(4).required().messages({
      'string.base': 'Description must be a string',
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 4 characters long',
      'any.required': 'Description is required',
  }),
  img: Joi.string().messages({
      'string.pattern.base': 'Image must be a valid image file (jpg, jpeg, png, gif)',
      'any.required': 'Media 25 not selected',
  }),
});

//joi product validation 
const productSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 3 characters long',
    'any.required': 'Name is required',
  }),
  description: Joi.string().min(4).required().messages({
    'string.base': 'Description must be a string',
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 4 characters long',
    'any.required': 'Description is required',
  }),
  price: Joi.number().required().positive().messages({
    'any.required': 'Price is required',
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be a positive number'
  }),
  promoPrice: Joi.number().positive().allow('', null).messages({
    'number.base': 'Promo price must be a number',
    'number.positive': 'Promo price must be a positive number'
  }),
  stock: Joi.number().required().positive().messages({
    'any.required': 'Stock is required',
    'number.base': 'Stock must be a number',
    'number.positive': 'Stock must be a positive number'
  }),
  category_id: Joi.string().required().messages({
    'string.base': 'Category ID must be a string',
    'any.required': 'Category is required'
  }),
  img: Joi.array().items(Joi.string()).messages({
    'array.base': 'Images must be provided as an array',
    'string.base': 'Each image must be a string'
  })
});

//add address
const addressValidationSchema = Joi.object({
  name: Joi.string().required().messages({
      'any.required': 'Name is required.'
  }),
  email: Joi.string().email().required().messages({
      'any.required': 'Email is required.',
      'string.email': 'Invalid email format.'
  }),
  mobile: Joi.number().required().messages({
      'any.required': 'Mobile number is required.',
      'number.base': 'Invalid mobile number.'
  }),
  pin: Joi.number().required().messages({
      'any.required': 'PIN code is required.',
      'number.base': 'Invalid PIN code.'
  }),
  address: Joi.string().required().messages({
      'any.required': 'Address is required.'
  }),
  city: Joi.string().required().messages({
      'any.required': 'City is required.'
  }),
  state: Joi.string().required().messages({
      'any.required': 'State is required.'
  }),
  is_Home: Joi.boolean().default(false),
  is_Work: Joi.boolean().default(false)
});



module.exports = {
  joiRegSchema, categorySchema, productSchema,
  addressValidationSchema
}