const Feature = () => {
  return (
    <section className="py-12 dark:bg-gray-800">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Verified Medicines",
              description:
                "All medicines are sourced from licensed pharmacies and verified suppliers",
              icon: "💊",
            },
            {
              title: "Express Delivery",
              description:
                "Same-day delivery available for urgent medications in your area",
              icon: "🚚",
            },
            {
              title: "24/7 Support",
              description:
                "Round-the-clock customer support and pharmacist consultation available",
              icon: "📞",
            },
            {
              title: "100% Money Back",
              description:
                "Get a full refund if you're not satisfied with your purchase",
              icon: "💰",
            },
            {
              title: "No-Contact Shipping",
              description:
                "Ensuring safe and hygienic delivery with no direct contact",
              icon: "📦",
            },
            {
              title: "Exclusive Discounts",
              description:
                "Special offers and discounts for loyal customers and bulk purchases",
              icon: "🏷️",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="p-8 bg-secondary/30 dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 animate-fade-up text-center flex flex-col items-center border border-transparent hover:border-primary/10 dark:hover:border-[#02ADEE]/10"
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-display text-xl font-semibold text-primary dark:text-[#02ADEE] mb-3">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-xs mx-auto">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Feature;
