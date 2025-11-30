import { useContext, useState, useEffect } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const PlaceOrder = () => {
  // set default payment method to COD and remove other payment states
  const [paymentOption, setPaymentOption] = useState("cash")
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
  const logout = () => {
        localStorage.removeItem('token');
        setToken('');
        setCartItem({});
        navigate('/login');
    }
  const {
    navigate,
    backendUrl,
    token,
    setToken,  // Add this
    setCartItem,
    getCartAmount,
    delivery_fee,
    getCartItems,
    currency,
    user
  } = useContext(ShopContext);
  
  // helper to get numeric subtotal from context (supports both old number and new {final,...} shape)
  // const getNumericSubtotal = () => {
  //   const totals = getCartAmount();
  //   if (typeof totals === "object" && totals !== null) {
  //     // prefer final, fallback to mrp or numeric coercion
  //     return Number(totals.final ?? totals.total ?? 0);
  //   }
  //   return Number(totals || 0);
  // };

  const getNumericSubtotal = () => {
    const totals = getCartAmount();
    if (typeof totals === "object" && totals !== null) {
      // prefer final, fallback to mrp or numeric coercion
      return {
        withoutPromo : Number(totals.final ?? totals.total ?? 0),
        withPromo : Number(totals.finalPriceAfterPromoterDiscount ?? 0)
      };
    }
    return Number(totals || 0);
  };
  
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
      cryptoTransactionId: "User didn't enter transaction ID",
    },
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(`${backendUrl}/api/address/get`, {
          headers: { token },
        });
        if (data.success) {
          setSavedAddresses(data.addresses);
          // auto-select first saved address so form submission won't fail
          if (data.addresses && data.addresses.length > 0) {
            setSelectedAddress(data.addresses[0]);
          }
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

    fetchAddresses();
  }, [backendUrl, token]);

  const saveNewAddress = async () => {
    try {
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
          address: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipcode: formData.zipcode,
            country: formData.country,
            phone: formData.phone,
          },
          userId: token,
        },
        {
          headers: { token },
        }
      );

      if (data.success) {
        setSavedAddresses(data.addresses);
        setShowAddressForm(false);
        // select the newly saved address (assume backend returns updated addresses array)
        const last = data.addresses && data.addresses.length ? data.addresses[data.addresses.length - 1] : data.addresses[0];
        setSelectedAddress(last || formData);
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
      if (showAddressForm) {
        setFormData((prev) => ({
          ...prev,
          billingFirstName: prev.firstName,
          billingLastName: prev.lastName,
          billingEmail: prev.email,
          billingStreet: prev.street,
          billingCity: prev.city,
          billingState: prev.state,
          billingZipcode: prev.zipcode,
          billingCountry: prev.country,
          billingPhone: prev.phone,
        }));
      } else if (selectedAddress) {
        setFormData((prev) => ({
          ...prev,
          billingFirstName: selectedAddress.firstName,
          billingLastName: selectedAddress.lastName,
          billingEmail: selectedAddress.email,
          billingStreet: selectedAddress.street,
          billingCity: selectedAddress.city,
          billingState: selectedAddress.state,
          billingZipcode: selectedAddress.zipcode,
          billingCountry: selectedAddress.country,
          billingPhone: selectedAddress.phone,
        }));
      }
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    if(user?.phoneNumber == couponCode) {
      setCouponError("Your Number Not Acceped as Coupon code");
      return;
    }
    try {
      setIsApplyingCoupon(true);
      setCouponError("");
      setCouponSuccess("");
      const {withPromo, withoutPromo} = getNumericSubtotal();
      // const amountToVerify = getNumericSubtotal();
      const amountToVerify = withoutPromo;
      const response = await axios.post(
        backendUrl + "/api/order/verify-coupon",
        {
          couponCode,
          amount: amountToVerify, // ensure numeric
          withPromo : withPromo
        }
      );

      if (response.data.success) {
        if (response.data.couponDetails.discount.toFixed(2) >= amountToVerify) {
          toast.error("Please login again and don't refresh the page")
          setCouponError("Invalid coupon amount, Please login again");
          setCouponDiscount(0);
          logout();
          return;
        }
        setCouponDiscount(response.data.couponDetails.discount);
        setCouponSuccess(
          `Coupon applied! You saved ${currency}${response.data.couponDetails.discount.toFixed(
            2
          )}`
        );
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

      let billingAddress = sameAsDelivery
        ? showAddressForm
          ? address
          : selectedAddress
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

      // use numeric subtotal and ensure amounts are numbers
      const {withoutPromo, withPromo} = getNumericSubtotal();
      const subtotalNumeric = Number(withoutPromo)
      const deliveryFeeNumeric = Number(delivery_fee || 0);
      const couponNumeric = Number(couponDiscount || 0);

      const originalAmount = Number((subtotalNumeric + deliveryFeeNumeric).toFixed(2));
      const finalAmount = Number((subtotalNumeric + deliveryFeeNumeric - couponNumeric).toFixed(2));

      let orderData = {
        address: showAddressForm ? address : selectedAddress,
        billingAddress,
        items: items,
        amount: finalAmount,           // numeric final payable
        originalAmount: originalAmount,// numeric original amount (before coupon)
        notes: notes || "",
        couponCode: couponNumeric > 0 ? couponCode : undefined,
        paymentMethod: paymentOption
      };
      // Only COD available
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
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
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

          {/* Only show COD option */}
          <div className="flex gap-3 flex-col mt-4">
            <div className="flex items-center gap-3 border dark:border-gray-600 p-4 px-5 dark:bg-gray-700">
              <p className="min-w-3.5 h-3.5 bg-green-500 rounded-full"></p>
              <p className="dark:text-gray-200 font-medium">Cash on Delivery</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 px-3">
              Pay when your order is delivered.
            </p>

            <div className="mt-3 px-3">
  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
    Select Your Preferred Payment Method During Delivery
  </label>
  <select
    value={paymentOption}
    onChange={(e) => setPaymentOption(e.target.value)}
    className="w-full border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
  >
    <option value="cash">Cash</option>
    <option value="upi">UPI</option>
    <option value="credit-card">Credit Card</option>
    <option value="debit-card">Debit Card</option>
  </select>
</div>

          </div>

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
              Apply Referral Code
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-grow border dark:border-gray-600 rounded py-2 px-3 dark:bg-gray-800 dark:text-white"
                placeholder="Enter Referral code"
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
                {/* <p>Discount applied: {currency} {couponDiscount.toFixed(2)}</p> */}
                {/* <p>New total: {currency} {(getCartAmount() + delivery_fee - couponDiscount).toFixed(2)}</p> */}
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
