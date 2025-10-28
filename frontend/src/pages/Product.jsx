import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { Star, StarHalf } from "lucide-react";
import RelatedProducts from "../components/RelatedProducts";
import { Loader2, AlertTriangle } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const Product = () => {
  const { productId } = useParams();
  const { currency, addToCart, backendUrl } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [image, setImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedQuantityPrice, setSelectedQuantityPrice] = useState(null);
  const navigate = useNavigate();

  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get the product by ID using the API endpoint
      const response = await axios.get(
        `${backendUrl}/api/product/${productId}`
      );

      if (response.data.success && response.data.product) {
        const product = response.data.product;
        setProductData(product);
        setImage(product.image[0]);

        // If product has quantity price list, select the smallest package by default
        if (product.quantityPriceList) {
          let priceList;

          if (typeof product.quantityPriceList === "string") {
            try {
              priceList = JSON.parse(product.quantityPriceList);
            } catch (error) {
              console.error("Error parsing quantity price list:", error);
              priceList = [];
            }
          } else if (Array.isArray(product.quantityPriceList)) {
            priceList = product.quantityPriceList;
          } else {
            priceList = [];
          }

          if (priceList.length > 0) {
            const smallestPackage = priceList.reduce(
              (min, current) =>
                parseInt(current.quantity) < parseInt(min.quantity)
                  ? current
                  : min,
              priceList[0]
            );

            setSelectedQuantityPrice(smallestPackage);
            setQuantity(parseInt(smallestPackage.quantity));
          }
        } else if (product.minOrderQuantity && product.minOrderQuantity > 1) {
          setQuantity(product.minOrderQuantity);
        }
      } else {
        // If the API returns success: false or no product
        setError("Product not found");
        toast.error("Product not found");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("Error loading product. Please try again later.");
      toast.error("Error loading product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductData();
    }
  }, [productId, backendUrl]);

  const handleIncreaseQuantity = () => {
    if (selectedQuantityPrice) return; // Disable manual quantity change when preset is selected
    setQuantity((prev) => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    if (selectedQuantityPrice) return; // Disable manual quantity change when preset is selected
    const minQuantity = productData.minOrderQuantity || 1;
    if (quantity > minQuantity) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleQuantityPriceSelect = (qp) => {
    setSelectedQuantityPrice(qp);
    setQuantity(parseInt(qp.quantity));
  };

  const getCurrentPrice = () => {
    if (selectedQuantityPrice) {
      return selectedQuantityPrice.price;
    }
    return productData?.price || 0;
  };

  const getParsedQuantityPriceList = () => {
    if (!productData?.quantityPriceList) return [];

    try {
      if (typeof productData.quantityPriceList === "string") {
        return JSON.parse(productData.quantityPriceList);
      } else if (Array.isArray(productData.quantityPriceList)) {
        return productData.quantityPriceList;
      }
    } catch (error) {
      console.error("Error parsing quantity price list:", error);
    }

    return [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500 dark:text-gray-300" />
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="text-center p-10">
        <div className="flex flex-col items-center justify-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {error || "Product not found"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The product you're looking for may have been removed or is no longer
            available.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="px-6 py-2 bg-[#02ADEE] text-white dark:bg-[#02ADEE] dark:text-gray-800"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100 dark:bg-gray-800 dark:border-gray-700">
      {/*product data */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/*product images */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="product image" />
          </div>
        </div>
        {/*product info */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2 dark:text-white">
            {productData.name}
          </h1>
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 text-green-500 fill-green-500" />
            <Star className="w-4 h-4 text-green-500 fill-green-500" />
            <Star className="w-4 h-4 text-green-500 fill-green-500" />
            <Star className="w-4 h-4 text-green-500 fill-green-500" />
            <StarHalf className="w-4 h-4 text-green-500" />
            <p className="pl-2 dark:text-gray-300">(122)</p>
          </div>
          <p className="mt-5 text-3xl font-medium dark:text-white">
            {currency}
            {getCurrentPrice()}
          </p>

          {/* Quantity Price List */}
          {productData.quantityPriceList && (
            <div className="my-6">
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Select Quantity Package:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {getParsedQuantityPriceList().map((qp, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuantityPriceSelect(qp)}
                    className={`p-3 border ${
                      selectedQuantityPrice &&
                      selectedQuantityPrice.quantity === qp.quantity
                        ? "border-black dark:border-yellow-400 bg-[#02ADEE] dark:bg-[#02ADEE] text-white dark:text-gray-800"
                        : "border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-yellow-400"
                    }`}
                  >
                    {qp.quantity} units - {currency}
                    {qp.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity controls - Only show if no quantity price list */}
          <div className="flex flex-col gap-4 my-8">
            {!productData.quantityPriceList && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-gray-600 dark:text-gray-300">
                    Quantity:
                  </span>
                  <div className="flex items-center border border-gray-300 dark:border-gray-600">
                    <button
                      onClick={handleDecreaseQuantity}
                      className="px-3 py-1 border-r border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncreaseQuantity}
                      className="px-3 py-1 border-l border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
                {productData.minOrderQuantity &&
                  productData.minOrderQuantity > 1 && (
                    <div className="text-sm text-orange-600 -mt-2">
                      Minimum order quantity: {productData.minOrderQuantity}
                    </div>
                  )}
              </>
            )}
          </div>

          <button
            onClick={() => {
              const cartItem = {
                quantity: quantity,
                selectedPrice: selectedQuantityPrice
                  ? selectedQuantityPrice.price
                  : productData.price,
                isPackage: !!selectedQuantityPrice,
              };
              addToCart(productData._id, cartItem);

              // If product has quantity price list, reselect the smallest package
              if (productData.quantityPriceList) {
                const priceList = getParsedQuantityPriceList();
                if (priceList.length > 0) {
                  const smallestPackage = priceList.reduce(
                    (min, current) =>
                      parseInt(current.quantity) < parseInt(min.quantity)
                        ? current
                        : min,
                    priceList[0]
                  );
                  setSelectedQuantityPrice(smallestPackage);
                  setQuantity(parseInt(smallestPackage.quantity));
                }
              } else {
                setSelectedQuantityPrice(null);
              }
            }}
            className="bg-[#02ADEE] text-white px-8 py-3 text-sm active:bg-gray-700 dark:bg-[#02ADEE] dark:text-gray-800 dark:hover:bg-yellow-500"
          >
            ADD TO CART
          </button>
          <button
            onClick={() => {
              const cartItem = {
                quantity: quantity,
                selectedPrice: selectedQuantityPrice
                  ? selectedQuantityPrice.price
                  : productData.price,
                isPackage: !!selectedQuantityPrice,
              };
              addToCart(productData._id, cartItem);

              // If product has quantity price list, reselect the smallest package
              if (productData.quantityPriceList) {
                const priceList = getParsedQuantityPriceList();
                if (priceList.length > 0) {
                  const smallestPackage = priceList.reduce(
                    (min, current) =>
                      parseInt(current.quantity) < parseInt(min.quantity)
                        ? current
                        : min,
                    priceList[0]
                  );
                  setSelectedQuantityPrice(smallestPackage);
                  setQuantity(parseInt(smallestPackage.quantity));
                }
              } else {
                setSelectedQuantityPrice(null);
              }
              navigate("/cart");
            }}
            className="bg-[#02ADEE] text-white mx-4 px-8 py-3 text-sm active:bg-gray-700 dark:bg-[#02ADEE] dark:text-gray-800 dark:hover:bg-yellow-500"
          >
            BUY NOW
          </button>

          <p className="mt-5 text-gray-500 dark:text-gray-300 md:w-4/5">
            {productData.description}
          </p>
          <hr className="mt-8 sm:w-4/5 dark:border-gray-700" />
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-5 flex flex-col gap-1">
            <p>All Meds are FDA Approved</p>
            <p>100% Refund Guarantee</p>
          </div>
        </div>
      </div>

      {/*---------related product------------ */}
      <div>
        <RelatedProducts
          category={productData.category}
          subCategory={productData.subCategory}
          productId={productId}
        />
      </div>
    </div>
  );
};

export default Product;
