//  form validation and add address 

    document.getElementById('placeOrderButton').addEventListener('click', async function(event) {
        event.preventDefault();
        let isValid = true;

        const isCheckboxChecked = document.getElementById('agree').checked;
        const checkboxError = document.getElementById('agreeError');
        if (!isCheckboxChecked) {
            return;
        } else {
            checkboxError.textContent = '';
        }

        function hasConsecutiveSpaces(str) {
            return /\s{2,}/.test(str);
        }

        function isAlphabetic(str) {
            return /^[a-zA-Z\s]+$/.test(str);
        }

        const requiredFields = ['name', 'email', 'mobile', 'address', 'city', 'state', 'pin'];
        requiredFields.forEach(field => {
            const element = document.getElementById(field);
            const errorElement = document.getElementById(`${field}Error`);
            const value = element.value.trim();
            if (!value) {
                isValid = false;
                element.classList.add('invalid');
                errorElement.textContent = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
            } else if (hasConsecutiveSpaces(value)) {
                isValid = false;
                element.classList.add('invalid');
                errorElement.textContent = `${field.charAt(0).toUpperCase() + field.slice(1)} cannot have consecutive spaces.`;
            } else {
                element.classList.remove('invalid');
                errorElement.textContent = '';
            }
        });

        const name = document.getElementById('name').value.trim();
        const nameError = document.getElementById('nameError');
        if (name.length < 3) {
            isValid = false;
            document.getElementById('name').classList.add('invalid');
            nameError.textContent = 'Name must be at least 3 characters long.';
        }

        const pin = document.getElementById('pin').value.trim();
        const pinError = document.getElementById('pinError');
        if (!/^\d{6}$/.test(pin)) {
            isValid = false;
            document.getElementById('pin').classList.add('invalid');
            pinError.textContent = 'Invalid pin code.';
        }

        const city = document.getElementById('city').value.trim();
        const cityError = document.getElementById('cityError');

        const state = document.getElementById('state').value.trim();
        const stateError = document.getElementById('stateError');
        if (!isAlphabetic(state)) {
            isValid = false;
            document.getElementById('state').classList.add('invalid');
            stateError.textContent = 'State name must contain only letters and spaces.';
        }

        const isHomeChecked = document.getElementById('isHome').checked;
        const isWorkChecked = document.getElementById('isWork').checked;
        const address = document.getElementById('address').value.trim();
        const addressTypeError = document.getElementById('addressTypeError');
        if (!isHomeChecked && !isWorkChecked) {
            isValid = false;
            addressTypeError.textContent = 'Please select an address type.';
        } else {
            addressTypeError.textContent = '';
        }

        const email = document.getElementById('email').value;
        const emailError = document.getElementById('emailError');
        const emailPattern = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,4}$/;
        if (!emailPattern.test(email)) {
            isValid = false;
            document.getElementById('email').classList.add('invalid');
            emailError.textContent = 'Invalid email address.';
        } else {
            document.getElementById('email').classList.remove('invalid');
            emailError.textContent = '';
        }

        const mobile = document.getElementById('mobile').value;
        const mobileError = document.getElementById('mobileError');
        const phonePattern = /^(?!.*(\d)\1{9})\d{10}$/;
        if (!phonePattern.test(mobile)) {
            isValid = false;
            document.getElementById('mobile').classList.add('invalid');
            mobileError.textContent = 'Invalid phone number.';
        } else {
            document.getElementById('mobile').classList.remove('invalid');
            mobileError.textContent = '';
        }

        if (isValid) {
            const user_address = {
                name,
                email,
                mobile,
                pin,
                address,
                city,
                state,
            };
            console.log(user_address);

            try {
                fetch('/add-address', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(user_address)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status) {
                        Swal.fire({
                            title: 'Updated Successfully!',
                            text: data.message,
                            icon: 'success',
                            timer: 3000,
                            showConfirmButton: true,
                            confirmButtonColor: '#9fb500' // green
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: 'Update Failed',
                            text: data.message,
                            icon: 'error',
                            confirmButtonColor: '#d33' // red
                        })
                    }
                })
                .catch(error => {
                    Swal.showValidationMessage(error.message);
                    return false;
                });                    
            } catch (error) {
                console.error('Error occurred:', error);
                alert('An error occurred while processing your request. Please try again later.');
            }
        } else {
            event.preventDefault();
        }
    });
//  place order 

    document.getElementById('paymentBtn').addEventListener('click', function(event) {
        event.preventDefault(); 

        const selectAddressCheckbox = document.getElementById('selectAddress');
        const selectedAddress = document.querySelector('input[name="selectedAddress"]:checked');

        if (selectAddressCheckbox.checked && selectedAddress) {
            const addressIndex = selectedAddress.value;

            // Function to get the selected payment method
            function getSelectedPaymentMethod() {
                const paymentMethods = document.getElementsByName('payment_method');
                for (let method of paymentMethods) {
                    if (method.checked) {
                        switch (method.value) {
                            case 'cash_on_delivery':
                                return 'Cash on delivery';
                            case 'razorpay':
                                return 'Razorpay';
                            case 'wallet':
                                return 'Wallet';
                            default:
                                return null;
                        }
                    }
                }
                return null;
            }

            const paymentMethod = getSelectedPaymentMethod();
            if (!paymentMethod) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    text: 'Please select a payment method.'
                });
                return;
            }

            fetch('/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ addressIndex, paymentMethod })
            })
            .then(response => response.json())
            .then(async data => {
                if (data.status) {
                    if (paymentMethod === 'Razorpay') {
                        const options = {
                        key: data.key_id, 
                        amount: data.amount, 
                        currency: 'INR',
                        name: 'Supermarcado',
                        description: 'Order Payment',
                        order_id: data.razorpay_id, 
                        handler: async function (response) {
                            

                            const captureResponse = await fetch('/capture-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                placed_order_id: data.order_id
                            }),
                            });

                            const captureResult = await captureResponse.json();

                            if (captureResult.status) {
                                console.log('Capture Result: ', captureResult.status);
                                Swal.fire({
                                    title: 'Payment Successful!',
                                    text: 'Your payment has been processed successfully.',
                                    icon: 'success',
                                    confirmButtonText: 'OK',
                                    confirmButtonColor: '#9fb500', // green
                                    footer: '<img src="https://image.shutterstock.com/image-vector/credit-card-icon-vector-illustration-260nw-1771145396.jpg" alt="Payment Icon" width="50" height="50">'
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        window.location.href = '/';
                                    }
                                });
                                setTimeout(() => {
                                    if (!Swal.isVisible()) {
                                        window.location.href = '/';
                                    }
                                }, 3000);
                            } else {
                                Swal.fire({
                                    title: 'Payment Verification Failed!',
                                    text: 'Payment verification failed. Please contact support.',
                                    icon: 'error',
                                    confirmButtonText: 'OK',
                                    footer: '<img src="https://image.shutterstock.com/image-vector/credit-card-icon-vector-illustration-260nw-1771145396.jpg" alt="Payment Icon" width="50" height="50">'
                                });
                            }
                        },
                        prefill: {
                            name: data.user_address?.name || '',
                            email: data.user_address?.email || '',
                            contact: data.user_address?.phone || '',
                        },
                        theme: {
                            color: '#3399cc',
                        },
                        };


                        const rzp = new Razorpay(options);
                        rzp.open();
                            } else if (paymentMethod === 'Wallet') {
                                Swal.fire({
                                    title: 'Order Placed Successfully!',
                                    text: 'Payment via Wallet has been successfully processed.',
                                    icon: 'success',
                                    timer: 3000,
                                    showConfirmButton: true,
                                    confirmButtonColor: '#9fb500' // green
                                }).then((result) => {
                                    window.location.href = '/';
                                });

                                setTimeout(() => {
                                    window.location.href = '/';
                                }, 3000);
                            } else {
                                Swal.fire({
                                    title: 'Order Placed Successfully!',
                                    text: data.message,
                                    icon: 'success',
                                    timer: 3000,
                                    showConfirmButton: true,
                                    confirmButtonColor: '#9fb500' // green
                                }).then((result) => {
                                    window.location.href = '/';
                                });

                                setTimeout(() => {
                                    window.location.href = '/';
                                }, 3000);
                            }
                        } else {
                            Swal.fire({
                                title: 'Order Not Placed :(',
                                text: data.message,
                                icon: 'error',
                                confirmButtonColor: '#d33' // red
                            });
                        }
                    })
                    .catch(error => {
                        Swal.fire({
                            title: 'Error',
                            text: error.message,
                            icon: 'error',
                            confirmButtonColor: '#d33' // red
                        });
                    });
                } else {
                    Swal.fire({
                        title: 'No Address Selected',
                        text: 'Please select an address.',
                        icon: 'warning',
                        confirmButtonColor: '#ffc107' // yellow
                    });
                }
            });
// <!-- checkbox hide -->

    document.addEventListener('DOMContentLoaded', function() {
        var agreeCheckbox = document.getElementById('agree');
        var formContainer = document.getElementById('addressFormContainer');
        agreeCheckbox.addEventListener('change', function() {
            if (this.checked) {
                formContainer.style.display = 'block';
            } else {
                formContainer.style.display = 'none';
            }
        });

        var selectAddressCheckbox = document.getElementById('selectAddress');
        var addressCardsContainer = document.getElementById('addressCardsContainer');
        selectAddressCheckbox.addEventListener('change', function() {
            if (this.checked) {
                addressCardsContainer.style.display = 'block';
            } else {
                addressCardsContainer.style.display = 'none';
            }
        });

        function handleCheckbox(checkbox) {
            var checkboxes = document.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(function(cb) {
                if (cb !== checkbox) {
                    cb.checked = false;
                    if (cb.id === 'agree') {
                        formContainer.style.display = 'none';
                    } else if (cb.id === 'selectAddress') {
                        addressCardsContainer.style.display = 'none';
                    }
                }
            });
        }

        window.handleCheckbox = handleCheckbox;
    });
// <!-- apply coupon -->

    document.getElementById("applyCouponBtn").addEventListener("click", function(event) {
        event.preventDefault();

        var coupon_code = document.getElementById("coupon-code").value;
        var totalAmount = document.getElementById("order-total").value;

        var regex = /^[a-zA-Z0-9]+$/;
        if (!regex.test(coupon_code)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid coupon code',
                text: 'Please enter a valid coupon code.',
                confirmButtonColor: '#9fb500' // green
            });
            return;
        }

        fetch('/apply-coupon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ coupon_code, totalAmount })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to apply coupon');
            }
        })
        .then(data => {
            if (data.status) {
                Swal.fire({
                    icon: 'success',
                    title: 'Coupon Applied',
                    text: data.message,
                    confirmButtonColor: '#9fb500' // green
                });

                // Update discount and total after discount in the HTML
                document.getElementById('discount-amount').innerText = '-$' + data.discount.toFixed(2);
                document.getElementById('total-after-discount').innerText = '$' + data.totalAfterDiscount.toFixed(2);
                
                document.getElementById('discount-row').style.display = '';
                document.getElementById('total-after-discount-row').style.display = '';
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Coupon Failed',
                    text: data.message,
                    confirmButtonColor: '#9fb500' // green
                });
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was an error applying the coupon. Please try again later.',
                confirmButtonColor: '#9fb500' // green
            });
            console.error('Error applying coupon:', error);
        });
    });
// <!-- remove coupon  -->

    document.getElementById("removeCouponBtn").addEventListener("click", function(event) {
event.preventDefault();

fetch('/remove-coupon', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => {
    if (response.ok) {
        return response.json();
    } else {
        throw new Error('Failed to remove coupon');
    }
})
.then(data => {
    if (data.status) {
        Swal.fire({
            icon: 'success',
            title: 'Coupon Removed',
            text: data.message,
            confirmButtonColor: '#9fb500' // green
        });

        // Update discount and total after discount in the HTML
        document.getElementById('discount-amount').innerText = '$0.00';
        document.getElementById('total-after-discount').innerText = '$' + data.totalAmount.toFixed(2);

        // Hide discount and total after discount rows
        document.getElementById('discount-row').style.display = 'none';
        document.getElementById('total-after-discount-row').style.display = 'none';
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Coupon Removal Failed',
            text: data.message,
            confirmButtonColor: '#9fb500' // green
        });
    }
})
.catch(error => {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'There was an error removing the coupon. Please try again later.',
        confirmButtonColor: '#9fb500' // green
    });
    console.error('Error removing coupon:', error);
});
});
