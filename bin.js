const addToCart = async (req, res) => {
    try {
      console.log('add to cart');
      const { user_id } = req.session;
      const { productId, quantity } = req.body;
  
      // Check if the cart already exists for the user
      let cart = await cartDB.findOne({ user_id });
  
      if (!cart) {
        // If no cart exists, create a new one
        cart = new cartDB({
          user_id,
          products: [{ product_id: productId, quantity }],
        });
      } else {
        // If cart exists, check if the product is already in the cart
        const productIndex = cart.products.findIndex(p => p.product_id.toString() === productId);
  
        if (productIndex === -1) {
          // If product is not in the cart, add it
          cart.products.push({ product_id: productId, quantity });
        } else {
          // If product is in the cart, update the quantity
          cart.products[productIndex].quantity += quantity;
        }
      }
  
      await cart.save();
      console.log('cart il save ayii');
  
      res.json({ success: true, message: 'Product successfully added to your cart.' });
    } catch (error) {
      console.error(error);
      res.json({ success: false, message: 'Failed to add product to your cart.' });
    }
  };




















<a href="#" onclick="showEditAddressForm('<%= JSON.stringify(addressData.user_address[i]) %>')"><i class="fas fa-edit"></i> Edit</a>





<!-- <script>
    document.addEventListener('DOMContentLoaded', function() {
        const fname = document.getElementById('fname');
        const lname = document.getElementById('lname');
        const username = document.getElementById('username');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        const password =document.getElementById('password')
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        const submitButton = document.getElementById('submitButton');

        const fnameError = document.getElementById('fnameError');
        const lnameError = document.getElementById('lnameError');
        const usernameError = document.getElementById('usernameError');
        const emailError = document.getElementById('emailError');
        const phoneError = document.getElementById('phoneError');
        const passwordError = document.getElementById('passwordError');

        //initial value
        const initialValues = {
            fname: fname.value.trim(),
            lname: lname.value.trim(),
            username: username.value.trim(),
            email: email.value.trim(),
            phone: phone.value.trim(),
            password: password.value,
            newPassword: newPassword.value,
            confirmPassword: confirmPassword.value
        };

        fname.addEventListener('keyup', () => validateFname(true));
        lname.addEventListener('keyup', () => validateLname(true));
        username.addEventListener('keyup', () => validateUsername(true));
        email.addEventListener('keyup', () => validateEmail(true));
        phone.addEventListener('keyup', () => validatePhone(true));
        confirmPassword.addEventListener('keyup', () => validatePasswordMatch(true));

        function validateFname(showError) {
            const regex = /^[A-Za-z]{3,}(?: [A-Za-z]+)*$/
            if (showError) {
                fname.value = fname.value.trim();
                fnameError.style.display = regex.test(fname.value) ? 'none' : 'inline';
                checkFormValidity();
            }
        }

        function validateLname(showError) {
            const regex = /^[A-Za-z]+(?: [A-Za-z]+)*$/
            if (showError) {
                lname.value = lname.value.trim();
                lnameError.style.display = regex.test(lname.value) ? 'none' : 'inline';
                checkFormValidity();
            }
        }

        function validateUsername(showError) {
            const regex = /^[a-zA-Z0-9_\s]+$/;
            if (showError) {
                username.value = username.value.trim();
                usernameError.style.display = regex.test(username.value) ? 'none' : 'inline';
                checkFormValidity();
            }
        }

        function validateEmail(showError) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (showError) {
                email.value = email.value.trim();
                emailError.style.display = regex.test(email.value) ? 'none' : 'inline';
                checkFormValidity();
            }
        }

        function validatePhone(showError) {
            const regex = /^(?!.*(\d)\1{9})\d{10}$/;
            if (showError) {
                phone.value = phone.value.trim();
                phoneError.style.display = regex.test(phone.value) ? 'none' : 'inline';
                checkFormValidity();
            }
        }

        function validatePasswordMatch(showError) {
            if (showError && newPassword.value && confirmPassword.value) {
                passwordError.style.display = newPassword.value === confirmPassword.value ? 'none' : 'inline';
            } else {
                passwordError.style.display = 'none';
            }
            checkFormValidity();
        }

        document.getElementById('userForm').addEventListener('submit', function(event) {
            // event.preventDefault();

            if (!hasErrors()) {
                const formData = new FormData(this);

                //fetch
                fetch('/user-profile-update', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === true) {
                        // Backend validation successful
                        alert(data.message); // Show success message
                    } else {
                        // Backend validation failed
                        alert(data.message.join('\n')); // Show error messages as a list
                    }
                })
                .catch(error => {
                    // Handle any errors that occur during the fetch request
                    console.error('Error:', error);
                    alert('An error occurred while processing your request.');
                });
            }
        });

        function checkFormValidity() {
            const currentValues = {
                fname: fname.value.trim(),
                lname: lname.value.trim(),
                username: username.value.trim(),
                email: email.value.trim(),
                phone: phone.value.trim(),
                newPassword: newPassword.value,
                confirmPassword: confirmPassword.value
            };

            const hasChanges = Object.keys(initialValues).some(key => initialValues[key] !== currentValues[key]);

            submitButton.disabled = !hasChanges || hasErrors();
        }

        function hasErrors() {
            const errors = [
                fnameError.style.display,
                lnameError.style.display,
                usernameError.style.display,
                emailError.style.display,
                phoneError.style.display,
                passwordError.style.display
            ];
            return errors.some(error => error === 'inline');
        }

        document.getElementById('userForm').addEventListener('submit', function(event) {
            event.preventDefault();
        });

        checkFormValidity();
    });
</script> -->












{/* <script>
    document.addEventListener('DOMContentLoaded', function() {
        const fname = document.getElementById('fname');
        const lname = document.getElementById('lname');
        const username = document.getElementById('username');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        const password = document.getElementById('Password'); // Corrected id here
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        const submitButton = document.getElementById('submitButton');

        const fnameError = document.getElementById('fnameError');
        const lnameError = document.getElementById('lnameError');
        const usernameError = document.getElementById('usernameError');
        const emailError = document.getElementById('emailError');
        const phoneError = document.getElementById('phoneError');
        const passwordError = document.getElementById('passwordError');

        //initial value
        const initialValues = {
            fname: fname.value.trim(),
            lname: lname.value.trim(),
            username: username.value.trim(),
            email: email.value.trim(),
            phone: phone.value.trim(),
            password: password.value,
            newPassword: newPassword.value,
            confirmPassword: confirmPassword.value
        };

        fname.addEventListener('keyup', () => validateFname(true));
        lname.addEventListener('keyup', () => validateLname(true));
        username.addEventListener('keyup', () => validateUsername(true));
        email.addEventListener('keyup', () => validateEmail(true));
        phone.addEventListener('keyup', () => validatePhone(true));
        confirmPassword.addEventListener('keyup', () => validatePasswordMatch(true));

        function validateFname(showError) {
            const regex = /^[A-Za-z]{3,}(?: [A-Za-z]+)*$/
            if (showError) {
                fname.value = fname.value.trim();
                fnameError.style.display = regex.test(fname.value) ? 'none' : 'inline';
                checkFormValidity();
            }
        }

        function validateLname(showError) {
            const regex = /^[A-Za-z]+(?: [A-Za-z]+)*$/
            if (showError) {
                lname.value = lname.value.trim();
                lnameError.style.display = regex.test(lname.value) ? 'none' : 'inline';
                checkFormValidity();
            }
        }

        function validateUsername(showError) {
            const regex = /^[a-zA-Z0-9_\s]+$/;
            if (showError) {
                username.value = username.value.trim();
                usernameError.style.display = regex.test(username.value) ? 'none' : 'inline';
                checkFormValidity();
            }
        }

        function validateEmail(showError) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (showError) {
                email.value = email.value.trim();
                emailError.style.display = regex.test(email.value) ? 'none' : 'inline';
                checkFormValidity();
            }
        }

        function validatePhone(showError) {
            const regex = /^(?!.*(\d)\1{9})\d{10}$/;
            if (showError) {
                phone.value = phone.value.trim();
                phoneError.style.display = regex.test(phone.value) ? 'none' : 'inline';
                checkFormValidity();
            }
        }

        function validatePasswordMatch(showError) {
            if (showError && newPassword.value && confirmPassword.value) {
                passwordError.style.display = newPassword.value === confirmPassword.value ? 'none' : 'inline';
            } else {
                passwordError.style.display = 'none';
            }
            checkFormValidity();
        }

        document.getElementById('userForm').addEventListener('submit', function(event) {
            event.preventDefault();

            if (!hasErrors()) {
                const formData = new FormData(this);

                //fetch
                fetch('/user-profile-update', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === true) {
                        // Backend validation successful
                        alert(data.message); // Show success message
                    } else {
                        // Backend validation failed
                        alert(data.message.join('\n')); // Show error messages as a list
                    }
                })
                .catch(error => {
                    // Handle any errors that occur during the fetch request
                    console.error('Error:', error);
                    alert('An error occurred while processing your request.');
                });
            }
        });

        function checkFormValidity() {
            const currentValues = {
                fname: fname.value.trim(),
                lname: lname.value.trim(),
                username: username.value.trim(),
                email: email.value.trim(),
                phone: phone.value.trim(),
                newPassword: newPassword.value,
                confirmPassword: confirmPassword.value
            };

            const hasChanges = Object.keys(initialValues).some(key => initialValues[key] !== currentValues[key]);

            submitButton.disabled = !hasChanges || hasErrors();
        }

        function hasErrors() {
            const errors = [
                fnameError.style.display,
                lnameError.style.display,
                usernameError.style.display,
                emailError.style.display,
                phoneError.style.display,
                passwordError.style.display
            ];
            return errors.some(error => error === 'inline');
        }

        checkFormValidity();
    });
</script> */}





// old form of my account 

<form action="#">
    <div class="row mb-50">
        <div class="col-md-6">
            <label>First name:</label>
            <input type="text" name="fname" value="<%= user.fname %>" required>
        </div>
        <div class="col-md-6">
            <label>Last name:</label>
            <input type="text" name="lname" value="<%= user.lname %>" required>
        </div>
        <div class="col-md-6">
            <label>Username:</label>
            <input type="text" name="username" value="<%= user.username %>" required>
        </div>
        <div class="col-md-6">
            <label>Email:</label>
            <input type="email" name="email" value="<%= user.email %>" required>
        </div>
        <div class="col-md-6">
            <label>Phone Number:</label>
            <input type="text" name="phone" value="<%= user.phone %>" required>
        </div>
    </div>
    <fieldset>
        <legend>Password change</legend>
        <div class="row">
            <div class="col-md-12">
                <label>Current password (leave blank to leave unchanged):</label>
                <input type="password" name="ltn__name">
                <label>New password (leave blank to leave unchanged):</label>
                <input type="password" name="ltn__lastname">
                <label>Confirm new password:</label>
                <input type="password" name="ltn__lastname">
            </div>
        </div>
    </fieldset>
    <div class="btn-wrapper">
        <button type="submit" class="btn theme-btn-1 btn-effect-1 text-uppercase">Save Changes</button>
    </div>
</form>










// google auth old
async function googleSignIn(req, res) {
  const { token } = req.body;

  try {
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    // Get user information from the token payload
    const payload = ticket.getPayload();
    const { given_name, family_name, email } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // If user doesn't exist, create a new user
      user = await User.create({
        fname: given_name,
        lname: family_name,
        username: given_name,
        email: email,
      });
    }

    req.session.user_id = user._id;
    res.redirect('/')
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    res.status(500).send('Google Sign-In failed. Please try again.');
  }
}







// old admin header
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>Brocoli Dashboard</title>
        <meta http-equiv="x-ua-compatible" content="ie=edge" />
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta property="og:title" content="" />
        <meta property="og:type" content="" />
        <meta property="og:url" content="" />
        <meta property="og:image" content="" />
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
        <!-- Favicon -->
        <link rel="shortcut icon" type="image/x-icon" href="assets/imgs/theme/favicon.png" />
        <!-- Template CSS -->
        <link href="assets/css/main.css?v=1.1" rel="stylesheet" type="text/css" />
        <!-- Sweetalert2 -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
    </head>

    <body>
        <div class="screen-overlay"></div>
        <aside class="navbar-aside" id="offcanvas_aside">
            <div class="aside-top">
                <a href="/admin/" class="brand-wrap">
                    <img src="assets/imgs/theme/logo.png" class="logo" alt="Brocoli Dashboard" />
                </a>
                <div>
                    <button class="btn btn-icon btn-aside-minimize"><i class="text-muted material-icons md-menu_open"></i></button>
                </div>
            </div>
            <nav>
                <ul class="menu-aside" id="menu-aside">
                    <li class="menu-item">
                        <a class="menu-link" href="/admin/">
                            <i class="icon material-icons md-home"></i>
                            <span class="text">Dashboard</span>
                        </a>
                    </li>
                    <li class="menu-item">
                        <a class="menu-link" href="/admin/products">
                            <i class="icon material-icons md-shopping_bag"></i>
                            <span class="text">Products</span>
                        </a>
                    </li>
                    <li class="menu-item">
                        <a class="menu-link" disabled href="/admin/Categories">
                            <i class="icon material-icons md-pie_chart"></i>
                            <span class="text">Categories</span>
                        </a>
                    </li>
                    <li class="menu-item has-submenu">
                        <a class="menu-link" href="page-orders-1.html">
                            <i class="icon material-icons md-shopping_cart"></i>
                            <span class="text">Orders</span>
                        </a>
                        <div class="submenu">
                            <a href="page-orders-1.html">Order list 1</a>
                            <a href="page-orders-2.html">Order list 2</a>
                            <a href="page-orders-detail.html">Order detail</a>
                        </div>
                    </li>
                    <li class="menu-item ">
                        <a class="menu-link" href="/admin/user">
                            <i class="icon material-icons md-person"></i>
                            <span class="text">Users</span>
                        </a>
                    </li>
                    <li class="menu-item">
                        <a class="menu-link" href="/admin/add-product">
                            <i class="icon material-icons md-add_box"></i>
                            <span class="text">Add product</span>
                        </a>
                    </li>
                    <li class="menu-item has-submenu">
                        <a class="menu-link" href="page-transactions-1.html">
                            <i class="icon material-icons md-monetization_on"></i>
                            <span class="text">Transactions</span>
                        </a>
                        <div class="submenu">
                            <a href="page-transactions-1.html">Transaction 1</a>
                            <a href="page-transactions-2.html">Transaction 2</a>
                        </div>
                    </li>
                    <li class="menu-item has-submenu">
                        <a class="menu-link" href="#">
                            <i class="icon material-icons md-person"></i>
                            <span class="text">Account</span>
                        </a>
                        <div class="submenu">
                            <a href="page-account-login.html">User login</a>
                            <a href="page-account-register.html">User registration</a>
                            <a href="page-error-404.html">Error 404</a>
                        </div>
                    </li>
                    <li class="menu-item">
                        <a class="menu-link" href="page-reviews.html">
                            <i class="icon material-icons md-comment"></i>
                            <span class="text">Reviews</span>
                        </a>
                    </li>
                    <li class="menu-item">
                        <a class="menu-link" href="page-brands.html"> <i class="icon material-icons md-stars"></i> <span class="text">Brands</span> </a>
                    </li>
                </ul>
                <hr />
                <ul class="menu-aside">
                    <li class="menu-item has-submenu">
                        <a class="menu-link" href="#">
                            <i class="icon material-icons md-settings"></i>
                            <span class="text">Settings</span>
                        </a>
                        <div class="submenu">
                            <a href="page-settings-1.html">Setting sample 1</a>
                            <a href="page-settings-2.html">Setting sample 2</a>
                        </div>
                    </li>
                    <li class="menu-item">
                        <a class="menu-link" href="page-blank.html">
                            <i class="icon material-icons md-local_offer"></i>
                            <span class="text"> Starter page </span>
                        </a>
                    </li>
                </ul>
                <br />
                <br />
            </nav>
        </aside>
        <main class="main-wrap">
            <header class="main-header navbar">
                <div class="col-search">
                    <form class="searchform">
                        <div class="input-group">
                            <input list="search_terms" type="text" class="form-control" placeholder="Search term" />
                            <button class="btn btn-light bg" type="button"><i class="material-icons md-search"></i></button>
                        </div>
                        <datalist id="search_terms">
                            <option value="Products"></option>
                            <option value="New orders"></option>
                            <option value="Apple iphone"></option>
                            <option value="Ahmed Hassan"></option>
                        </datalist>
                    </form>
                </div>
                <div class="col-nav">
                    <button class="btn btn-icon btn-mobile me-auto" data-trigger="#offcanvas_aside"><i class="material-icons md-apps"></i></button>
                    <ul class="nav">
                        <!-- <li class="nav-item">
                            <a class="nav-link btn-icon" href="#">
                                <i class="material-icons md-notifications animation-shake"></i>
                                <span class="badge rounded-pill">3</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link btn-icon darkmode" href="#"> <i class="material-icons md-nights_stay"></i> </a>
                        </li>
                        <li class="nav-item">
                            <a href="#" class="requestfullscreen nav-link btn-icon"><i class="material-icons md-cast"></i></a>
                        </li> -->
                        
                        <li class="dropdown nav-item">
                            <a class="dropdown-toggle" data-bs-toggle="dropdown" href="#" id="dropdownAccount" aria-expanded="false"> <img class="img-xs rounded-circle" src="assets/imgs/people/avatar-2.jpeg" alt="User" /></a>
                            <div class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownAccount">
                                <a class="dropdown-item" href="#"><i class="material-icons md-perm_identity"></i>Edit Profile</a>
                                <a class="dropdown-item" href="#"><i class="material-icons md-settings"></i>Account Settings</a>
                                <div class="dropdown-divider"></div>
                                <a class="dropdown-item text-danger" href="#" onclick="logOut(this)"><i class="material-icons md-exit_to_app"></i>Logout</a>
                                <script>
                                    function logOut(tag){
                                        fetch('/admin/logout',{
                                            method:'DELETE',
                                        }).then(res=>res.json()).then(data=>{
                                            if(data){
                                                window.location='/admin/login'
                                            }
                                        })
                                    }
                                </script>
                            </div>
                        </li>
                    </ul>
                </div>
            </header>













const formData = new FormData(form);

        //fetch
        fetch(form.getAttribute('action'), {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                if (data.save) {
                    Swal.fire({
                        title: 'Success!',
                        text: data.message,
                        icon: 'success',
                        timer: 3000,
                        showConfirmButton: true
                    }).then((result) => {
                        window.location.href = '/admin/categories';
                    });

                    setTimeout(() => {
                        window.location.href = '/admin/categories';
                    }, 3000);
                } else {
                    showMessage(data.message, 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('An error occurred while adding the category', 'error');
        });












<!-- <script>            
document.getElementById('save-button').addEventListener('click', function validate() {
    const productName = document.getElementById('product_name').value.trim();
    const description = document.getElementById('description').value.trim();
const regularPrice = document.getElementById('regular_price').value.trim();
const promotionalPrice = document.getElementById('promotional_price').value.trim();
const stock = document.getElementById('stock').value.trim();
const taxRate = document.getElementById('tax_rate').value.trim();
const tags = document.getElementById('tags').value.trim();

// Validation
if (productName.length < 3) {
alert("Product title must be at least 3 characters long.");
return;
}
if (!/^\d+(\.\d{1,2})?$/.test(regularPrice)) {
alert("Regular price must be a valid number.");
return;
}
if (promotionalPrice && !/^\d+(\.\d{1,2})?$/.test(promotionalPrice)) {
alert("Promotional price must be a valid number.");
return;
}
if (!/^\d+$/.test(stock)) {
alert("Stock must be a valid number.");
return;
}
if (tags.length > 0 && tags.length < 3) {
alert("Tags must be at least 3 characters long if provided.");
return;
}

const formData = new FormData();

formData.append('product_name', document.getElementById('product_name').value);
formData.append('description', document.getElementById('description').value);
formData.append('regular_price', document.getElementById('regular_price').value);
formData.append('promotional_price', document.getElementById('promotional_price').value);
formData.append('stock', document.getElementById('stock').value);
formData.append('tags', document.getElementById('tags').value);

const mediaFile = document.getElementById('media').files[0];
if (mediaFile) {
formData.append('media', mediaFile);
}

formData.append('category', document.getElementById('category').value);
formData.append('brand', document.getElementById('brand').value);

fetch('your-backend-endpoint-url', {
method: 'POST',
body: formData
})
.then(response => response.json())
.then(data => {
// Handle success response
console.log('Success:', data);
})
.catch(error => {
// Handle error response
console.error('Error:', error);
});
});
</script> -->











<div class="alert alert-info" id="passwordMsg" role="alert" style="display: none;"></div>



const resetPassword = async (req, res, next) => {
  try {
      const userId = req.session.forgotUserId
      const { newPassword, cnfmPassword } = req.body


      if (newPassword != cnfmPassword) {
          return res.status(403), json({ message: "Password dosn't Match" })
      }

      const spassword = await securePassword(newPassword)
      const updatePassword = await User.findByIdAndUpdate({ _id: userId }, { $set: { password: spassword } })
      res.status(200).json({ success: true })
  } catch (error) {
      console.log(error.message);
      next(error)
  }
}


document.getElementById('resetPassword').addEventListener('submit', function(event) {
  event.preventDefault();
  if(!updatePasswordValidation()){
    return;
  }
  const form = document.getElementById('resetPassword');
    const formData = new FormData(form);
    const jsonObject = {};
    formData.forEach((value, key) => {
      jsonObject[key] = value;
    });

    fetch('/resetPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonObject)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
          Swal.fire({
              title: "Reset Successful",
              text: "Your password has been successfully reset.",
              icon: "success"
          }).then(() => {
              window.location.href = /login; 
          });
      } else {
        const validationMessage = document.getElementById("passwordMsg")
        validationMessage.style.display = 'block'
        validationMessage.innerHTML = ${data.message}
      }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error Adding Coupen');
    });
});



const joiRegSchema = Joi.object({
  fname: Joi.string().regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/).required(),
  lname: Joi.string().regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/),
  username: Joi.string().regex(/^[a-zA-Z0-9_ ]+$/).min(3).max(17).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(new RegExp('^[0-9]{10}$')).required(),
  password: Joi.string()
    .min(6)
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?])(?=.*[A-Z]).*$/)
    .required(),
  confirmpassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'Confirm password must match the password' }),
});




// registration
const registration = async (req, res) => {
  try {
    console.log(req.body);
    const validationResult = await joiRegSchema.validateAsync(req.body);

    console.log(validationResult);
    if (validationResult.error) {
      console.error(validationResult.error);
      return;
    }
    
    const { fname, lname, username, email, phone, password } = validationResult

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User with the provided email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    req.session.userEmail = email
    const newUser = new User({fname, lname, username, email, phone, 
    password: hashedPassword});
    const saved =  await newUser.save();
    console.log(saved);

    if (saved) {
      console.log("success");
      console.log(req.session.userEmail)
      // verification()
      // res.render('user/verification')
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  } 
}

// loading verify page
async function verify( req, res) {
  const userEmail = await User.findOne({email: req.session.userEmail});
  console.log(req.session)
  console.log(userEmail);


  const otp = otpGen.generate(12)
  console.log(otp);

  const emailSender = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.FROM_EMAIL,
      pass: process.env.FROM_EMAIL_PASS
    }
  })

  const otpEmailStructure = {
    from: process.env.FROM_EMAIL,
    to: userEmail,
    subject: 'OTP to Login to your Brocoli Account',
    text: `OTP is " ${otp} " to login into your Bracoli account. 
    Please do not share it with anyone.`
  }

  emailSender.sendMail(otpEmailStructure, (error, info) =>{
    if(error) {
      console.log(error)
    } else {
      console.log('otp send', info.response);
    }
  })

  res.render('user/verify')
}




{/* <form action="/signup" class="ltn__form-box contact-form-box" method="post" id="signupForm"   onsubmit="return validateForm()">
                            <input type="text" name="fname" placeholder="First Name" id="fname">
                            <div id="fnameError" class="error"></div>
                            <input type="text" name="lname" placeholder="Last Name">
                            <div id="lnameError" class="error"></div>
                            <input type="text" name="username" placeholder="Username" required>
                            <div id="usernameError" class="error"></div>
                            <input type="text" name="email" placeholder="Email*" required>
                            <div id="emailError" class="error"></div>
                            <input type="text" name="phone" placeholder="Phone Number" required>
                            <div id="phoneError" class="error"></div>
                            <input type="password" name="password" placeholder="Password*" required>
                            <div id="passwordError" class="error"></div>
                            <input type="password" name="confirmpassword" placeholder="Confirm Password*" required>
                            <div id="confirmpasswordError" class="error"></div>
                            <div class="btn-wrapper">
                                <button class="theme-btn-1 btn reverse-color btn-block" type="submit">CREATE ACCOUNT</button>
                            </div>
                        </form> */}





<!-- <script>
      const form = document.getElementById('signupForm');
    
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
    
        const isValid = validateForm();
    
        if (isValid) {
          // Send form data to the server using Axios
          try {
            const formData = new FormData(form);
            const response = await axios.post('/signup', formData);
    
            console.log(response.data);
            // You can perform additional actions here, such as redirecting the user or displaying a success message
          } catch (error) {
            // Handle error response from the server
            console.error(error);
            // You can display error messages to the user or perform other error handling
          }
        } else {
          // Handle client-side validation errors
          console.error('Form validation failed');
          // You can display error messages to the user or perform other error handling
        }
      });

      function validateForm() {
        let isValid = true;

        const fnameInput = document.querySelector('input[name="fname"]');
        const lnameInput = document.querySelector('input[name="lname"]');
        const usernameInput = document.querySelector('input[name="username"]');
        const emailInput = document.querySelector('input[name="email"]');
        const phoneInput = document.querySelector('input[name="phone"]');
        const passwordInput = document.querySelector('input[name="password"]');
        const confirmPasswordInput = document.querySelector('input[name="confirmpassword"]');
        
        console.log(fnameInput.value);
        console.log(lnameInput.value);
        console.log(usernameInput.value);
        console.log(phoneInput.value);
        console.log(passwordInput.value);
        console.log(confirmPasswordInput.value);

        // Validate first name
        if (!fnameInput.value.trim()) {
          isValid = false;
          fnameInput.setCustomValidity('First name is required.');
        } else {
          fnameInput.setCustomValidity('');
        }

        //last name
        if (!lnameInput.value.trim()) {
          isValid = false;
          lnameInput.setCustomValidity('Last name is required.');
        } else {
          lnameInput.setCustomValidity('');
        }

        //username
        const usernameRegex = /^[a-zA-Z0-9_\s]+$/;
        if (!usernameInput.value.trim() || !usernameRegex.test(usernameInput.value)) {
          isValid = false;
          usernameInput.setCustomValidity('Username can only contain alphabets, spaces, and underscores.');
        } else {
          usernameInput.setCustomValidity('');
        }

        //email
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value)) {
          isValid = false;
          emailInput.setCustomValidity('Please enter a valid email address.');
        } else {
          emailInput.setCustomValidity('');
        }

        //phone number
        const phoneRegex = /^\d{10}$/;
        const hasSameDigitTenTimes = /^(.)\1{9}$/.test(phoneInput.value);
        if (!phoneInput.value.trim() || !phoneRegex.test(phoneInput.value) || hasSameDigitTenTimes) {
          isValid = false;
          phoneInput.setCustomValidity('Please enter a valid 10-digit phone number.');
        } else {
          phoneInput.setCustomValidity('');
        }

        // password
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?])(?=.*[A-Z]).*$/
        if (!passwordInput.value.trim() || !passwordRegex.test(passwordInput.value)) {
          isValid = false;
          passwordInput.setCustomValidity('Please enter a valid password.')
        }else {
          passwordInput.setCustomValidity('')
        }

        // confirm password
        if (confirmPasswordInput.value !== passwordInput.value) {
          isValid = false;
          confirmPasswordInput.setCustomValidity('Passwords do not match.');
        } else {
          confirmPasswordInput.setCustomValidity('');
        }

        return isValid;
      }
    </script> -->
    
    
    
    
    
    
    
    // Checking if the user already exist
    const existingUser = await User.findOne({$or: [{username}, {email}]})
    if (existingUser) {
      res.render('user/signup',{message: 'Username or email already exists'});  
    }


    const registration = async (req, res) => {
  try {
    const {fname, lname, username, email, phone, password} = req.body;
  
    const structure = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(req.body.email)
    if (structure) {
  
      // Checking the password
      const minLength = 6;
      const maxLength = 20;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (
        password.length >= minLength &&
        password.length <= maxLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar
      ) {
        // Checking if the user already exist
        const existingUser = await User.findOne({$or: [{username}, {email}]})
        if (existingUser) {
          res.render('user/signup',{message: 'Username or email already exists'});  
        }
    
        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10)
    
        //Saving the new user
        const newUser = new User({fname, lname, username, email, phone, password: hashedPassword});
        await newUser.save();
    
        res.render('user/home', {message: 'User created successfully'})
      } else {
        res.render('user/signup', { message: 'Password is invalid' });
      }
    } else {
      req.flash('message', 'Email structure is not correct')
      res.redirect('user/signup');
    }
  } catch (error) {
    console.error('Error in signup:', error);
    res.render('user/signup',{message: 'Internal error'});
    }
  }
  
<script>
        function passValue(tag) {
            let input = tag.value
            console.log(input)
            fetch ('/signup', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({input})
            }).then(res => res.json()).then(data => {
                console.log(data.status);
            })
    
        }
    </script>


const userSchema = new mongoose.Schema({
  fname: {
      type: String, 
      required: true
  },
  lname: {
      type: String, 
      required: true
  },
  username: { 
      type: String, 
      required: true, 
      unique: true 
  },
  email: { 
      type: String, 
      required: true, 
      unique: true 
  },
  phone: {
      type: String,
      required: true,
  },
  password: { 
      type: String, 
      required: true 
  },
  adress_id: {
      type: String,
  },
  is_admin: {
      type: Number, 
      default: 0
  },
  is_verified: {
      type: Number,
      default: 0
  }, 
  is_block: {
      type: Number,
      default: 0
  },
  createdAt: { 
      type: Date, 
      default: Date.now
  }
})

const joiRegSchema = Joi.object({
  fname: Joi.string().regex(/^[a-zA-Z]+$/).required(),
  lname: Joi.string().regex(/^[a-zA-Z]+$/),
  username: Joi.string().regex(/^[a-zA-Z0-9_ ]+$/).min(3).max(17).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(new RegExp('^[0-9]{10}$')).required(),
  password: Joi.string().min(6)
  .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?])(?=.*[A-Z]).*$/)
  .required(),
  confirmpassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({
      'any.only': 'Confirm password must match the password'
    }),
});