import { useContext, useState, useEffect } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const PlaceOrder = () => {
  const [method, setMethod] = useState("manual");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState("");
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
  const {
    navigate,
    backendUrl,
    token,
    setCartItem,
    getCartAmount,
    delivery_fee,
    getCartItems,
    currency,
  } = useContext(ShopContext);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
    billingFirstName: "",
    billingLastName: "",
    billingEmail: "",
    billingStreet: "",
    billingCity: "",
    billingState: "",
    billingZipcode: "",
    billingCountry: "",
    billingPhone: "",
    manualPaymentDetails: {
      paymentType: "",
      cardNumber: "",
      cardHolderName: "",
      expiryDate: "",
      cvv: "",
      paypalEmail: "",
      cryptoTransactionId: "User didn't enter transaction ID",
    },
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [notes, setNotes] = useState("");
  const [availableCryptos, setAvailableCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedWallet, setSelectedWallet] = useState(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(`${backendUrl}/api/address/get`, {
          headers: { token },
        });
        if (data.success) {
          setSavedAddresses(data.addresses);
        } else {
          toast.error(data.message || "Failed to fetch addresses");
        }
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch saved addresses");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCryptoWallets = async () => {
      try {
        const response = await axios.get(backendUrl + "/api/order/crypto-wallets");
        if (response.data.success) {
          setAvailableCryptos(response.data.wallets);
        }
      } catch (error) {
        console.error("Error fetching crypto wallets:", error);
      }
    };

    fetchAddresses();
    fetchCryptoWallets();
  }, [backendUrl, token]);

  const saveNewAddress = async () => {
    try {
      // Validate form data before sending
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.street ||
        !formData.city ||
        !formData.state ||
        !formData.zipcode ||
        !formData.country ||
        !formData.phone
      ) {
        toast.error("Please fill all required fields");
        return;
      }

      const { data } = await axios.post(
        `${backendUrl}/api/address/save`,
        {
          address: {firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipcode: formData.zipcode,
          country: formData.country,
          phone: formData.phone},
          userId: token, // Add userId to the request body
        },
        {
          headers: { token },
        }
      );

      if (data.success) {
        setSavedAddresses(data.addresses);
        setShowAddressForm(false);
        setSelectedAddress(formData); // Select the newly added address
        toast.success("Address saved successfully");
      } else {
        toast.error(data.message || "Failed to save address");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to save address");
    }
  };

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const handleSameAsDeliveryChange = (e) => {
    const isChecked = e.target.checked;
    setSameAsDelivery(isChecked);
    
    if (isChecked) {
      // If checked, copy delivery address to billing address
      if (showAddressForm) {
        // If using form data
        setFormData(prev => ({
          ...prev,
          billingFirstName: prev.firstName,
          billingLastName: prev.lastName,
          billingEmail: prev.email,
          billingStreet: prev.street,
          billingCity: prev.city,
          billingState: prev.state,
          billingZipcode: prev.zipcode,
          billingCountry: prev.country,
          billingPhone: prev.phone
        }));
      } else if (selectedAddress) {
        // If using selected address
        setFormData(prev => ({
          ...prev,
          billingFirstName: selectedAddress.firstName,
          billingLastName: selectedAddress.lastName,
          billingEmail: selectedAddress.email,
          billingStreet: selectedAddress.street,
          billingCity: selectedAddress.city,
          billingState: selectedAddress.state,
          billingZipcode: selectedAddress.zipcode,
          billingCountry: selectedAddress.country,
          billingPhone: selectedAddress.phone
        }));
      }
    }
  };

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Order Payment",
      description: "Order Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const verifyData = {
            ...response,
            userId: token,
          };
          const { data } = await axios.post(
            backendUrl + "/api/order/verifyRazorpay",
            verifyData,
            { headers: { token } }
          );
          if (data.success) {
            navigate("/orders");
            setCartItem({});
          }
        } catch (error) {
          console.log(error);
          toast.error(error.message);
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const copyWalletAddress = (address) => {
    navigator.clipboard.writeText(address || cryptoWalletAddress);
    toast.info("Wallet address copied to clipboard");
  };

  const handleCryptoChange = (cryptoType) => {
    setSelectedCrypto(cryptoType);
    setSelectedNetwork("");
    setSelectedWallet(null);
    
    setFormData((prev) => ({
      ...prev,
      manualPaymentDetails: {
        ...prev.manualPaymentDetails,
        cryptoType: cryptoType,
        cryptoNetwork: ""
      }
    }));
  };

  const handleNetworkChange = (network) => {
    setSelectedNetwork(network);
    
    const wallet = availableCryptos.find(
      w => w.cryptoType === selectedCrypto && w.network === network
    );
    
    setSelectedWallet(wallet || null);
    if (wallet) {
      setCryptoWalletAddress(wallet.walletAddress);
    }
    
    setFormData((prev) => ({
      ...prev,
      manualPaymentDetails: {
        ...prev.manualPaymentDetails,
        cryptoNetwork: network
      }
    }));
  };

  const handleMethodChange = (newMethod, paymentType = "") => {
    if (newMethod !== "stripe") {
      setMethod(newMethod);
      
      if (newMethod !== "manual" || paymentType !== "crypto") {
        setSelectedCrypto("");
        setSelectedNetwork("");
        setSelectedWallet(null);
      }

      // If this is a manual payment method, also set the payment type
      if (newMethod === "manual" && paymentType) {
        setFormData((prev) => ({
          ...prev,
          manualPaymentDetails: {
            ...prev.manualPaymentDetails,
            paymentType: paymentType,
            cryptoType: paymentType === "crypto" ? selectedCrypto : "",
            cryptoNetwork: paymentType === "crypto" ? selectedNetwork : ""
          },
        }));
      }
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      setIsApplyingCoupon(true);
      setCouponError("");
      setCouponSuccess("");

      const response = await axios.post(
        backendUrl + "/api/order/verify-coupon",
        {
          couponCode,
          amount: getCartAmount() // Only apply to cart amount, not delivery fee
        }
      );

      if (response.data.success) {
        setCouponDiscount(response.data.couponDetails.discount);
        setCouponSuccess(`Coupon applied! You saved ${currency}${response.data.couponDetails.discount.toFixed(2)}`);
      } else {
        setCouponError(response.data.message);
        setCouponDiscount(0);
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError("Failed to apply coupon. Please try again.");
      setCouponDiscount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!selectedAddress && !showAddressForm) {
      toast.error("Please select an address or add a new one");
      return;
    }

    // Validate billing address if not using same as delivery
    if (!sameAsDelivery) {
      if (
        !formData.billingFirstName ||
        !formData.billingLastName ||
        !formData.billingEmail ||
        !formData.billingStreet ||
        !formData.billingCity ||
        !formData.billingState ||
        !formData.billingZipcode ||
        !formData.billingCountry ||
        !formData.billingPhone
      ) {
        toast.error("Please fill all required billing address fields");
        return;
      }
    }

    try {
      const items = getCartItems();

      let address = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipcode: formData.zipcode,
        country: formData.country,
        phone: formData.phone,
      };

      // Use delivery address as billing if checkbox is checked
      let billingAddress = sameAsDelivery 
        ? (showAddressForm ? address : selectedAddress) 
        : {
            firstName: formData.billingFirstName,
            lastName: formData.billingLastName,
            email: formData.billingEmail,
            street: formData.billingStreet,
            city: formData.billingCity,
            state: formData.billingState,
            zipcode: formData.billingZipcode,
            country: formData.billingCountry,
            phone: formData.billingPhone,
          };

      // Calculate final amount correctly
      const subtotal = getCartAmount();
      const finalAmount = subtotal + delivery_fee - couponDiscount;

      let orderData = {
        address: showAddressForm ? address : selectedAddress,
        billingAddress,
        items: items,
        amount: finalAmount,
        originalAmount: subtotal + delivery_fee,
        notes: notes || "",
        couponCode: couponDiscount > 0 ? couponCode : undefined
      };

      switch (method) {
        case "cod": {
          const response = await axios.post(
            backendUrl + "/api/order/place",
            orderData,
            { headers: { token } }
          );
          if (response.data.success) {
            setCartItem({});
            navigate("/orders");
          } else {
            toast.error(response.data.message);
          }
          break;
        }

        case "manual": {
          // Validate manual payment details
          if (!formData.manualPaymentDetails?.paymentType) {
            toast.error("Please select a payment type");
            return;
          }

          if (
            formData.manualPaymentDetails.paymentType === "paypal" &&
            !formData.manualPaymentDetails.paypalEmail
          ) {
            toast.error("Please enter your PayPal email");
            return;
          }

          if (
            ["credit_card", "debit_card"].includes(
              formData.manualPaymentDetails.paymentType
            )
          ) {
            if (
              !formData.manualPaymentDetails.cardNumber ||
              !formData.manualPaymentDetails.cardHolderName ||
              !formData.manualPaymentDetails.expiryDate ||
              !formData.manualPaymentDetails.cvv
            ) {
              toast.error("Please fill in all card details");
              return;
            }
          }

          const response = await axios.post(
            backendUrl + "/api/order/manual",
            {
              ...orderData,
              manualPaymentDetails: formData.manualPaymentDetails,
            },
            { headers: { token } }
          );

          if (response.data.success) {
            setCartItem({});
            toast("Order placed successfully. One of our representative will get in touch with you in 24 hours Via call or email",{
              type: "success",
              autoClose: 5000
            })
            navigate("/orders");
            toast("Now you will be Redirected to Product Page",{
              type:"info"
            })
            setTimeout(()=>{
              navigate("/products")
            }, 3000)
          } else {
            toast.error(response.data.message);
          }
          break;
        }

        case "stripe": {
          const responseStripe = await axios.post(
            backendUrl + "/api/order/stripe",
            orderData,
            { headers: { token } }
          );
          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data;
            window.location.replace(session_url);
          } else {
            toast.error(responseStripe.data.message);
          }
          break;
        }

        case "razorpay": {
          const responseRazorpay = await axios.post(
            backendUrl + "/api/order/razorpay",
            orderData,
            { headers: { token } }
          );
          if (responseRazorpay.data.success) {
            initPay(responseRazorpay.data.order);
          }
          break;
        }

        default:
          break;
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t dark:border-gray-700 dark:bg-gray-800"
    >
      {/*------------------left side------------------*/}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px] ">
        <div className="text-xl sm:text-2xl my-3 ">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-4 dark:text-gray-300">
            Loading saved addresses...
          </div>
        ) : (
          <>
            {/* Saved Addresses Section */}
            {savedAddresses.length > 0 && !showAddressForm && (
              <div className="flex flex-col gap-3">
                <h3 className="font-medium dark:text-gray-200">
                  Saved Addresses
                </h3>
                {savedAddresses.map((address, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedAddress(address)}
                    className={`border p-3 rounded cursor-pointer ${
                      selectedAddress === address
                        ? "border-green-500"
                        : "border-gray-300 dark:border-gray-600"
                    } dark:text-gray-200 dark:bg-gray-700`}
                  >
                    <p>
                      {address.firstName} {address.lastName}
                    </p>
                    <p>{address.email}</p>
                    <p>{address.street}</p>
                    <p>
                      {address.city}, {address.state} {address.zipcode}
                    </p>
                    <p>{address.country}</p>
                    <p>{address.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Address Button */}
            <button
              type="button"
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="text-black dark:text-[#02ADEE] underline"
            >
              {showAddressForm ? "Back to saved addresses" : "Add New Address"}
            </button>

            {/* Address Form */}
            {showAddressForm && (
              <>
                <div className="flex gap-3">
                  <input
                    required
                    onChange={onChangeHandler}
                    name="firstName"
                    value={formData.firstName}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="text"
                    placeholder="First name"
                  />
                  <input
                    required
                    onChange={onChangeHandler}
                    name="lastName"
                    value={formData.lastName}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="text"
                    placeholder="Last name"
                  />
                </div>
                <input
                  required
                  onChange={onChangeHandler}
                  name="email"
                  value={formData.email}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                  type="email"
                  placeholder="E-mail Address"
                />
                <input
                  required
                  onChange={onChangeHandler}
                  name="street"
                  value={formData.street}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                  type="text"
                  placeholder="Street"
                />
                <div className="flex gap-3">
                  <input
                    required
                    onChange={onChangeHandler}
                    name="city"
                    value={formData.city}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="text"
                    placeholder="City"
                  />
                  <input
                    required
                    onChange={onChangeHandler}
                    name="state"
                    value={formData.state}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="text"
                    placeholder="State"
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    required
                    onChange={onChangeHandler}
                    name="zipcode"
                    value={formData.zipcode}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="number"
                    placeholder="Area PIN-CODE"
                  />
                  <input
                    required
                    onChange={onChangeHandler}
                    name="country"
                    value={formData.country}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="text"
                    placeholder="Country"
                  />
                </div>
                <input
                  required
                  onChange={onChangeHandler}
                  name="phone"
                  value={formData.phone}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                  type="number"
                  placeholder="Mobile Number"
                />
                <button
                  type="button"
                  onClick={saveNewAddress}
                  className="bg-black text-white dark:bg-[#02ADEE] dark:text-gray-800 px-4 py-2 rounded hover:bg-gray-800 dark:hover:bg-yellow-500"
                >
                  Save Address
                </button>
              </>
            )}

            {/* Same As Delivery Checkbox */}
            <div className="mt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="sameAsDelivery"
                  checked={sameAsDelivery}
                  onChange={handleSameAsDeliveryChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="sameAsDelivery"
                  className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Billing Address same as Delivery Address
                </label>
              </div>
            </div>

            {/* Billing Address Section */}
            {!sameAsDelivery && (
              <div className="mt-4">
                <div className="text-xl sm:text-2xl my-3">
                  <Title text1={"BILLING"} text2={"INFORMATION"} />
                </div>
                <div className="flex gap-3">
                  <input
                    required
                    onChange={onChangeHandler}
                    name="billingFirstName"
                    value={formData.billingFirstName}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="text"
                    placeholder="First name"
                  />
                  <input
                    required
                    onChange={onChangeHandler}
                    name="billingLastName"
                    value={formData.billingLastName}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="text"
                    placeholder="Last name"
                  />
                </div>
                <input
                  required
                  onChange={onChangeHandler}
                  name="billingEmail"
                  value={formData.billingEmail}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                  type="email"
                  placeholder="E-mail Address"
                />
                <input
                  required
                  onChange={onChangeHandler}
                  name="billingStreet"
                  value={formData.billingStreet}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                  type="text"
                  placeholder="Street"
                />
                <div className="flex gap-3">
                  <input
                    required
                    onChange={onChangeHandler}
                    name="billingCity"
                    value={formData.billingCity}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="text"
                    placeholder="City"
                  />
                  <input
                    required
                    onChange={onChangeHandler}
                    name="billingState"
                    value={formData.billingState}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="text"
                    placeholder="State"
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    required
                    onChange={onChangeHandler}
                    name="billingZipcode"
                    value={formData.billingZipcode}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="number"
                    placeholder="Area PIN-CODE"
                  />
                  <input
                    required
                    onChange={onChangeHandler}
                    name="billingCountry"
                    value={formData.billingCountry}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                    type="text"
                    placeholder="Country"
                  />
                </div>
                <input
                  required
                  onChange={onChangeHandler}
                  name="billingPhone"
                  value={formData.billingPhone}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded py-1.5 px-3.5 w-full"
                  type="number"
                  placeholder="Mobile Number"
                />
              </div>
            )}
          </>
        )}
      </div>
      {/*-------------------right side---------------------- */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal couponDiscount={couponDiscount} />
        </div>
        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHOD"} />
          {/*------------------payment--------------------*/}
          <div className="flex gap-3 flex-col mt-4">
            {/* PayPal payment */}
            <div
              onClick={() => handleMethodChange("manual", "paypal")}
              className="flex items-center gap-3 border dark:border-gray-600 p-2 px-3 cursor-pointer hover:border-green-500 dark:hover:border-green-500 transition-colors dark:bg-gray-700"
            >
              <p
                className={`min-w-3.5 h-3.5 border dark:border-gray-500 rounded-full ${
                  method === "manual" &&
                  formData.manualPaymentDetails.paymentType === "paypal"
                    ? "bg-green-500"
                    : ""
                }`}
              ></p>
              <p className="dark:text-gray-200">PayPal</p>
            </div>

            {/* Credit/Debit Card payment */}
            <div
              onClick={() => handleMethodChange("manual", "credit_card")}
              className="flex items-center gap-3 border dark:border-gray-600 p-2 px-3 cursor-pointer hover:border-green-500 dark:hover:border-green-500 transition-colors dark:bg-gray-700"
            >
              <p
                className={`min-w-3.5 h-3.5 border dark:border-gray-500 rounded-full ${
                  method === "manual" &&
                  ["credit_card", "debit_card"].includes(
                    formData.manualPaymentDetails.paymentType
                  )
                    ? "bg-green-500"
                    : ""
                }`}
              ></p>
              <p className="dark:text-gray-200">Credit/Debit Card</p>
            </div>

            {/* Crypto payment */}
            <div
              onClick={() => handleMethodChange("manual", "crypto")}
              className="flex items-center gap-3 border dark:border-gray-600 p-2 px-3 cursor-pointer hover:border-green-500 dark:hover:border-green-500 transition-colors dark:bg-gray-700"
            >
              <p
                className={`min-w-3.5 h-3.5 border dark:border-gray-500 rounded-full ${
                  method === "manual" &&
                  formData.manualPaymentDetails.paymentType === "crypto"
                    ? "bg-green-500"
                    : ""
                }`}
              ></p>
              <p className="dark:text-gray-200">Crypto</p>
            </div>

            {/* Western Union payment */}
            <div 
            onClick={() => handleMethodChange("manual", "western_union")}
            className="flex items-center gap-3 border dark:border-gray-600 p-2 px-3 cursor-pointer hover:border-green-500 dark:hover:border-green-500 transition-colors dark:bg-gray-700">
            <p
                className={`min-w-3.5 h-3.5 border dark:border-gray-500 rounded-full ${
                  method === "manual" &&
                  formData.manualPaymentDetails.paymentType === "western_union"
                    ? "bg-green-500"
                    : ""
                }`}
              ></p>
              <p className="dark:text-gray-200">Western Union</p>
              <img
                className="h-5 mx-4"
                src={assets.western_union}
                alt="Western Union"
              />
            </div>
          </div>

          {/* Manual Payment Form */}
          {method === "manual" && formData.manualPaymentDetails.paymentType !== "western_union" && (
            <div className="mt-6 border dark:border-gray-600 p-4 rounded dark:bg-gray-700">
              <h3 className="text-lg font-medium mb-4 dark:text-gray-200">
                Payment Details
              </h3>

              {/* Hidden Payment Type Selection - We'll keep it for debugging but not show it */}
              <div className="mb-4 hidden">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Payment Type
                </label>
                <select
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      manualPaymentDetails: {
                        ...prev.manualPaymentDetails,
                        paymentType: e.target.value,
                      },
                    }))
                  }
                  className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                  value={formData.manualPaymentDetails.paymentType || ""}
                >
                  <option value="">Select Payment Type</option>
                  <option value="paypal">PayPal</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="crypto">Crypto</option>
                </select>
              </div>

              {/* PayPal Email Form */}
              {formData.manualPaymentDetails?.paymentType === "paypal" && (
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                    PayPal Email
                  </label>
                  <input
                    type="email"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        manualPaymentDetails: {
                          ...prev.manualPaymentDetails,
                          paypalEmail: e.target.value,
                        },
                      }))
                    }
                    className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                    placeholder="PayPal Email Address"
                  />
                </div>
              )}

              {/* Card Details Form */}
              {formData.manualPaymentDetails?.paymentType &&
                ["credit_card", "debit_card"].includes(
                  formData.manualPaymentDetails.paymentType
                ) && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                        Payment Type
                      </label>
                      <select
                        required
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            manualPaymentDetails: {
                              ...prev.manualPaymentDetails,
                              paymentType: e.target.value,
                            },
                          }))
                        }
                        className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select Payment Type</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="debit_card">Debit Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                        Card Number
                      </label>
                      <input
                        type="text"
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            manualPaymentDetails: {
                              ...prev.manualPaymentDetails,
                              cardNumber: e.target.value,
                            },
                          }))
                        }
                        className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                        placeholder="Card Number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                        Card Holder Name
                      </label>
                      <input
                        type="text"
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            manualPaymentDetails: {
                              ...prev.manualPaymentDetails,
                              cardHolderName: e.target.value,
                            },
                          }))
                        }
                        className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                        placeholder="Card Holder Name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              manualPaymentDetails: {
                                ...prev.manualPaymentDetails,
                                expiryDate: e.target.value,
                              },
                            }))
                          }
                          className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                          CVV
                        </label>
                        <input
                          type="text"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              manualPaymentDetails: {
                                ...prev.manualPaymentDetails,
                                cvv: e.target.value,
                              },
                            }))
                          }
                          className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                          placeholder="CVV"
                        />
                      </div>
                    </div>
                  </div>
                )}

              {/* Crypto Payment Form */}
              {formData.manualPaymentDetails?.paymentType === "crypto" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                      Select Cryptocurrency
                    </label>
                    <select
                      value={selectedCrypto}
                      onChange={(e) => handleCryptoChange(e.target.value)}
                      className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select a cryptocurrency</option>
                      {[...new Set(availableCryptos.map(wallet => wallet.cryptoType))].map(crypto => (
                        <option key={crypto} value={crypto}>
                          {crypto}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedCrypto && (
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                        Select Network
                      </label>
                      <select
                        value={selectedNetwork}
                        onChange={(e) => handleNetworkChange(e.target.value)}
                        className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select a network</option>
                        {availableCryptos
                          .filter(wallet => wallet.cryptoType === selectedCrypto)
                          .map(wallet => (
                            <option key={wallet.network} value={wallet.network}>
                              {wallet.network}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  )}
                  
                  {selectedWallet && (
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                      Send payment to this wallet address:
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                          value={selectedWallet.walletAddress}
                        readOnly
                        className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="button"
                          onClick={() => copyWalletAddress(selectedWallet.walletAddress)}
                        className="bg-gray-200 dark:bg-gray-600 px-4 py-2 ml-2 rounded"
                      >
                        Copy
                      </button>
                    </div>
                      
                      <div className="mt-4 flex justify-center">
                        <img 
                          src={selectedWallet.qrCodeImage} 
                          alt={`${selectedCrypto} ${selectedNetwork} QR Code`} 
                          className="w-48 h-48 object-contain border dark:border-gray-600 p-2"
                        />
                      </div>
                      
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        After sending payment, you can optionally enter your transaction ID below
                    </p>
                  </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                      Your Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          manualPaymentDetails: {
                            ...prev.manualPaymentDetails,
                            cryptoTransactionId: e.target.value,
                          },
                        }))
                      }
                      className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter transaction ID (optional)"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              Order Notes (Optional)
            </label>
            <textarea
              value={notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
              placeholder="Add any special instructions or notes for your order"
              rows="3"
            ></textarea>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              Apply Coupon
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-grow border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                placeholder="Enter coupon code"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={isApplyingCoupon}
                className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded"
              >
                {isApplyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>
            {couponError && <p className="text-red-500 text-sm mt-1">{couponError}</p>}
            {couponSuccess && <p className="text-green-500 text-sm mt-1">{couponSuccess}</p>}
            
            {couponDiscount > 0 && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900 dark:text-green-100 text-green-700 rounded">
                <p>Discount applied: {currency} {couponDiscount.toFixed(2)}</p>
                <p>New total: {currency} {(getCartAmount() + delivery_fee - couponDiscount).toFixed(2)}</p>
              </div>
            )}
          </div>

          <div className="w-full text-end mt-8">
            <button
              type="submit"
              className="bg-black text-white dark:bg-[#02ADEE] dark:text-gray-800 px-16 py-3 text-sm hover:bg-gray-800 dark:hover:bg-yellow-500"
            >
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
