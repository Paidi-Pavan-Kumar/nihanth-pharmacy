import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import { RefreshCw, ShoppingCart, Gift } from "lucide-react";

const Dashboard = ({ token }) => {
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    totalOrders: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    // separate discount metrics
    totalCustomerDiscount: 0,
    totalCouponDiscount: 0,
    totalDiscountAll: 0,
    totalDiscountPaid: 0,
    totalDiscountPending: 0,
    totalCustomerDiscountPaid: 0,
    totalCustomerDiscountPending: 0,
    totalCouponPaid: 0,
    totalCouponUnpaid: 0,
    // profit metrics
    totalProfit: 0,
    totalProfitPaid: 0,
    totalProfitPending: 0,
  });

  const fetchTotals = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/order/list`,
        {},
        { headers: { token } }
      );
      if (!res.data?.success || !Array.isArray(res.data.orders)) {
        toast.error(res.data?.message || "Failed to fetch orders");
        setLoading(false);
        return;
      }

      const orders = res.data.orders.filter(
        order => order.status !== "Cancelled"
      )

      let totalOrders = orders.length;
      let totalAmount = 0;
      let paidAmount = 0;
      let pendingAmount = 0;
      // discount trackers
      let totalCustomerDiscount = 0;
      let totalCouponDiscount = 0;
      let totalDiscountAll = 0;
      let totalDiscountPaid = 0;
      let totalDiscountPending = 0;
      let totalCustomerDiscountPaid = 0;
      let totalCustomerDiscountPending = 0;
      let totalCouponPaid = 0;
      let totalCouponUnpaid = 0;
      // profit trackers
      let totalProfit = 0;
      let totalProfitPaid = 0;
      let totalProfitPending = 0;

      orders.forEach((o) => {
        const amount = Number(o.amount ?? 0);
        totalAmount += amount;
        if (o.payment) paidAmount += amount;
        else pendingAmount += amount;

        const items = Array.isArray(o.items) ? o.items : [];
        // include quantity in MRP / Selling totals
        const subtotalMRP = items.reduce(
          (s, it) => s + Number(it.mrp ?? 0) * Number(1),
          0
        );
        const sellingTotal = items.reduce(
          (s, it) =>
            s +
            Number(it.sellingPrice ?? it.price ?? 0) * Number(1),
          0
        );

        // customer discount = MRP total - selling total
        const customerDiscount = Math.max(0, subtotalMRP - sellingTotal);
        let couponDiscount = 0;
        // coupon discount as absolute amount (percentage -> amount on sellingTotal)
        if (o.coupon && o.coupon.discount != null) {
          if ((o.coupon.discountType || "").toLowerCase() === "percentage") {
            couponDiscount = (Number(o.coupon.discount || 0));
          } else {
            couponDiscount = Number(o.coupon.discount || 0);
          }
        }
        const orderDiscount = customerDiscount + couponDiscount;

        let orderProfit = 0;

items.forEach((it) => {
  const mrp = Number(it.mrp ?? 0);
  const profitPercent = Number(it.profit ?? 0);
  console.log(profitPercent)
  // profit is percentage on MRP
  const itemProfit = (mrp * profitPercent / 100);

  orderProfit += itemProfit;
});


        // accumulate discount totals and their paid/pending split
        totalCustomerDiscount += customerDiscount;
        totalCouponDiscount += couponDiscount;
        totalDiscountAll += orderDiscount;

        if (o.payment) {
          totalDiscountPaid += orderDiscount;
          totalCustomerDiscountPaid += customerDiscount;
          totalCouponPaid += couponDiscount;
          totalProfitPaid += orderProfit;
        } else {
          totalDiscountPending += orderDiscount;
          totalCustomerDiscountPending += customerDiscount;
          totalCouponUnpaid += couponDiscount;
          totalProfitPending += orderProfit;
        }

        totalProfit += orderProfit;
      });

      totalProfitPaid -= totalCouponPaid * 3;
      totalProfitPending -= totalCouponUnpaid * 3;
      totalProfit = totalProfitPaid + totalProfitPending;
      setTotals({
        totalOrders,
        totalAmount,
        paidAmount,
        pendingAmount,
        totalCustomerDiscount,
        totalCouponDiscount,
        totalDiscountAll,
        totalDiscountPaid,
        totalDiscountPending,
        totalCustomerDiscountPaid,
        totalCustomerDiscountPending,
        totalCouponPaid,
        totalCouponUnpaid,
        totalProfit,
        totalProfitPaid,
        totalProfitPending,
      });
    } catch (err) {
      console.error("fetch orders failed", err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotals();
  }, [token]);


  const fmt = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Admin Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overview of orders, revenue and discounts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTotals}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-lg shadow hover:scale-[1.02] transform transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">
              {loading ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-tr from-indigo-600 to-violet-700 shadow-lg text-white">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase opacity-90">
                Total Orders
              </div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight">
                {totals.totalOrders}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-white/80">
                <span className="inline-flex items-center gap-2 bg-white/10 px-2 py-1 rounded-full">
                  Paid: <strong>{fmt(totals.paidAmount)}</strong>
                </span>
                <span className="inline-flex items-center gap-2 bg-white/10 px-2 py-1 rounded-full">
                  Pending: <strong>{fmt(totals.pendingAmount)}</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-3 right-4 text-[11px] opacity-70">
            Orders • Last 30 days
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 shadow-lg text-white">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              $
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase opacity-90">
                Total Value
              </div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight">
                {fmt(totals.totalAmount)}
              </div>
              <div className="mt-2 text-xs text-white/90">
                <span className="mr-3">
                  Paid <strong>{fmt(totals.paidAmount)}</strong>
                </span>
                <span>
                  Pending <strong>{fmt(totals.pendingAmount)}</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-white/80">
            Revenue • includes cash & card payments
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 shadow-lg text-white">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase opacity-90">
                Discounts
              </div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight">
                {fmt(totals.totalDiscountAll)}
              </div>
              <div className="mt-2 text-xs text-white/90">
                <span className="mr-3">
                  Customer: <strong>{fmt(totals.totalCustomerDiscount)}</strong>
                </span>
                <span>
                  Coupon: <strong>{fmt(totals.totalCouponDiscount)}</strong>
                </span>
                <br />
            
                <br />
                <span className="mr-3">
                  Coupon paid <strong>{fmt(totals.totalCouponPaid)}</strong>
                </span>
                <span>
                  Coupon unpaid <strong>{fmt(totals.totalCouponUnpaid)}</strong>
                </span>

                <br /><br />
                <span className="mr-3">
                  Profit: <strong>{fmt(totals.totalProfit)}</strong>
                </span>
                <span>
                  (Earned {fmt(totals.totalProfitPaid)} • Pending {fmt(totals.totalProfitPending)})
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-white/80">
            Customer + coupon discounts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                Orders breakdown
              </h3>
              <p className="text-xs text-slate-400">
                Paid vs Pending value & counts
              </p>
            </div>
            <div className="text-xs text-slate-400">Overview</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border">
              <div className="text-xs text-slate-500">Paid</div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {fmt(totals.paidAmount)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {Math.round(
                  (totals.paidAmount / (totals.totalAmount || 1)) * 100
                )}
                % of total
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border">
              <div className="text-xs text-slate-500">Pending</div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {fmt(totals.pendingAmount)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {Math.round(
                  (totals.pendingAmount / (totals.totalAmount || 1)) * 100
                )}
                % of total
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Click "Refresh" to reload the latest values from server
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                Discount details
              </h3>
              <p className="text-xs text-slate-400">
                Customer discounts + coupon breakdown
              </p>
            </div>
            <div className="text-xs text-slate-400">Summary</div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                <div className="text-xs text-slate-500">Customer Discount</div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {fmt(totals.totalCustomerDiscount)}
                </div>
                
              </div>

              <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                <div className="text-xs text-slate-500">Coupon Discount</div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {fmt(totals.totalCouponDiscount)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Paid {fmt(totals.totalCouponPaid)} • Pending {fmt(totals.totalCouponUnpaid)}
                </div>
              </div>
            </div>

            <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100 border">
              <div className="text-xs text-slate-500">
                Avg Discount per Order
              </div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {fmt(
                  totals.totalOrders
                    ? totals.totalDiscountAll / totals.totalOrders
                    : 0
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Numbers are computed from the server orders list endpoint.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
