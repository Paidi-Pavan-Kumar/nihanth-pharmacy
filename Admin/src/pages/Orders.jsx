import { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
  X,
  Loader2,
} from "lucide-react";
import PropTypes from "prop-types";
import jsPDF from "jspdf";
import "jspdf-autotable";
import qrPlaceholder from "../assets/qrPlaceholder.png";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    email: "",
    paymentType: "",
    amount: "",
    status: "",
    paymentStatus: "",
  });

  const formatDateToIndian = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchAllOrders = async () => {
    if (!token) return null;
    setLoading(true);

    try {
      const response = await axios.post(
        backendUrl + "/api/order/list",
        {
          page: currentPage,
          limit: ordersPerPage,
          ...filters,
        },
        { headers: { token } }
      );
      console.log(response.data.orders)

      if (response.data.success) {
        setOrders(response.data.orders);
        setTotalOrders(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/order/status",
        { orderId, status: event.target.value },
        { headers: { token } }
      );
      if (response.data.success) {
        await fetchAllOrders();
        toast.success("Status updated successfully");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const paymentStatusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/order/payment-status",
        { orderId, payment: event.target.value === "true" },
        { headers: { token } }
      );
      if (response.data.success) {
        await fetchAllOrders();
        toast.success("Payment status updated successfully");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      email: "",
      paymentType: "",
      amount: "",
      status: "",
      paymentStatus: "",
    });
    setCurrentPage(1);
  };

  const handleFilter = () => {
    let filtered = [...orders];

    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59); // Set end date to end of day

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.date);
        return orderDate >= start && orderDate <= end;
      });
    }

    if (filters.email) {
      filtered = filtered.filter((order) =>
        order.address.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    if (filters.paymentType) {
      filtered = filtered.filter(
        (order) =>
          order.paymentMethod.toLowerCase() ===
          filters.paymentType.toLowerCase()
      );
    }

    if (filters.amount) {
      filtered = filtered.filter(
        (order) => order.amount === parseFloat(filters.amount)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(
        (order) => order.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter(
        (order) => order.payment === (filters.paymentStatus === "true")
      );
    }

    setOrders(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token, currentPage, ordersPerPage, filters]);

  useEffect(() => {
    handleFilter();
  }, [filters]);

  const formatInvoiceDate = (ts) => {
    try {
      const d = new Date(Number(ts));
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "-";
    }
  };

  const generateInvoice = async (order) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 12;
  const pad = 12;

  // ---------- COLORS ----------
  const PRIMARY = [30, 80, 180];     // Blue
  const LIGHT_GRAY = [240, 240, 240];
  const BORDER_GRAY = [180, 180, 180];
  const DARK_TEXT = [40, 40, 40];

  // ---------- HEADER ----------
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY);
  doc.text("MEDIQUICK PHARMACY", pageWidth / 2, y, { align: "center" });

  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Bangalore, Karnataka", pageWidth / 2, y, { align: "center" });

  y += 4;
  doc.text("Phone: +91 89048 13463  |  Email Id : nihanthpharmacy@gmail.com | Website : https://www.mediquick1.com", pageWidth / 2, y, {
    align: "center",
  });

  // HEADER DIVIDER
  y += 6;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.7);
  doc.line(pad, y, pageWidth - pad, y);
  y += 10;

  // ---------- INVOICE BOX ----------
  doc.setDrawColor(...BORDER_GRAY);
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(pad, y, pageWidth - pad * 2, 22, 3, 3, "F");

  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  y += 8;
  doc.text(`Invoice ID:`, pad + 4, y);
  doc.setFont("helvetica", "normal");
  doc.text(String(order._id), pad + 34, y);

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Date:", pageWidth / 2, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatInvoiceDate(order.date), pageWidth / 2 + 28, y);

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Payment Method:", pad + 4, y);
  doc.setFont("helvetica", "normal");
  doc.text(order.paymentMethod || "-", pad + 36, y);

  y += 15;

  // ---------- ADDRESS SECTION (delivery only, full width) ----------
  const delivery = order.address || {};
  const wrapWidth = Math.floor(pageWidth - pad * 2 - 16); // full-width wrap
  const deliveryLines = [
    delivery.firstName ? `${delivery.firstName} ${delivery.lastName || ""}`.trim() : null,
    delivery.email || null,
    delivery.phone || null,
    ...(delivery.street ? doc.splitTextToSize(delivery.street, wrapWidth) : []),
    [delivery.city, delivery.state].filter(Boolean).join(", ") || null,
    [delivery.zipcode, delivery.country].filter(Boolean).join(" ") || null,
  ].filter(Boolean);

  const titleHeight = 7;
  const lineHeight = 6;
  const innerPadding = 10;
  const addrBoxHeight = titleHeight + deliveryLines.length * lineHeight + innerPadding;

  doc.setDrawColor(...BORDER_GRAY);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(pad, y, pageWidth - pad * 2, addrBoxHeight, 4, 4, "F");

  let addrY = y + titleHeight;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("Delivery Address", pad + 6, addrY);
  addrY += lineHeight;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  deliveryLines.forEach((ln) => {
    doc.text(String(ln), pad + 6, addrY);
    addrY += lineHeight;
  });

  // Advance y below the delivery block
  y += addrBoxHeight + 10;

  // Divider
  doc.setDrawColor(...PRIMARY);
  doc.line(pad, y, pageWidth - pad, y);
  y += 10;

  // ---------- ITEMS HEADER ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Items", pad, y);

  y += 8;

  // TABLE HEADER (updated to show MRP / Unit / Disc / Qty / Total)
  doc.setFillColor(230, 235, 250);
  doc.rect(pad, y, pageWidth - pad * 2, 8, "F");

  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text("No.", pad + 2, y + 5);
  doc.text("Description", pad + 18, y + 5);
  doc.text("MRP", pageWidth - 130, y + 5, { align: "right" });
  doc.text("Final", pageWidth - 100, y + 5, { align: "right" });
  doc.text("Disc", pageWidth - 70, y + 5, { align: "right" });
  doc.text("Qty", pageWidth - 46, y + 5, { align: "right" });
  doc.text("Total", pageWidth - 12, y + 5, { align: "right" });

  y += 12;

  // ITEMS LIST (uses item.mrp / sellingPrice / discount where available)
  const items = order.items || [];
  doc.setFont("helvetica", "normal");

  // compute detailed totals:
  let subtotalMRP = 0;        // sum(qty * mrp)
  let sellingTotal = 0;      // sum(qty * sellingPrice)
  let customerDiscountAmount = 0; // subtotalMRP - sellingTotal

  items.forEach((it, i) => {
    const qty = Number(it.quantity || 0);
    const mrp = it.mrp != null ? Number(it.mrp / qty) : (it.price != null ? Number(it.price) : 0);
    const selling = it.sellingPrice != null ? Number(it.sellingPrice / qty) : (it.price != null ? Number(it.price) : mrp);
    const itemDiscountPercent = it.discount != null ? Number(it.discount) : (it.customerDiscount != null ? Number(it.customerDiscount) : null);

    const mrpLine = mrp * qty;
    const sellingLine = selling * qty;
    subtotalMRP += mrpLine;
    sellingTotal += sellingLine;
    // accumulate per-item customer discount (MRP - selling)
    customerDiscountAmount += Math.max(0, mrpLine - sellingLine);

    // ensure page break if running out of space
    if (y + 18 > pageHeight - 40) {
      doc.addPage();
      y = pad;
    }

    // draw row
    doc.text(String(i + 1), pad + 2, y);
    // description wraps if long
    const descLines = doc.splitTextToSize(it.name || "-", pageWidth - pad * 2 - 160);
    doc.text(descLines, pad + 18, y);
    // align numeric fields on same baseline (if desc wraps, push them down)
    const rowHeight = Math.max( (descLines.length * 5), 6 );
    const baselineY = y + (rowHeight > 6 ? (rowHeight - 2) : 0);
    doc.text(mrp != null ? `${mrp.toFixed(2)}` : "-", pageWidth - 130, baselineY, { align: "right" });
    doc.text(`${selling.toFixed(2)}`, pageWidth - 100, baselineY, { align: "right" });
    doc.text(itemDiscountPercent != null ? `${itemDiscountPercent}%` : "-", pageWidth - 70, baselineY, { align: "right" });
    doc.text(String(qty), pageWidth - 46, baselineY, { align: "right" });
    // 'Total' column shows MRP total per line (qty * mrp)
    doc.text(`${mrpLine.toFixed(2)}`, pageWidth - 12, baselineY, { align: "right" });

    y += Math.max(rowHeight, 7);
    y += 2;
  });

  y += 6;

  // ---------- TOTALS SECTION (show breakdown: MRP total, selling total, customer discount, coupon, final) ----------
  const subtotalValue = subtotalMRP;
  const sellingValue = sellingTotal;
  const customerDiscount = customerDiscountAmount;
  // coupon discount at order level
  let couponDiscountAmount = 0;
  if (order.coupon && order.coupon.discount != null) {
    if ((order.coupon.discountType || "").toLowerCase() === "percentage") {
      couponDiscountAmount = order.coupon.discount
    } else {
      couponDiscountAmount = Number(order.coupon.discount || 0);
    }
  }
  // final amount expected (fallback to order.amount)
  const totalValue = Number(order.amount ?? sellingValue - couponDiscountAmount ?? 0);

  doc.setFillColor(255, 255, 255);
  doc.rect(pageWidth - 120, y - 2, 108, 36, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Subtotal (MRP total)
  doc.text("Subtotal (MRP):", pageWidth - 115, y);
  doc.text(` ${subtotalValue.toFixed(2)}`, pageWidth - 12, y, { align: "right" });
  y += 6;

  // Selling total and customer discount
  doc.text("Selling Total:", pageWidth - 115, y);
  doc.text(` ${sellingValue.toFixed(2)}`, pageWidth - 12, y, { align: "right" });
  y += 6;
  doc.text("Customer Discount:", pageWidth - 115, y);
  doc.text(`- ${customerDiscount.toFixed(2)}`, pageWidth - 12, y, { align: "right" });
  y += 6;

  if (order.coupon && order.coupon.discount != null) {
    const coupon = order.coupon;
    const discountLabel =
      (coupon.discountType || "").toLowerCase() === "percentag"
        ? `${Number(coupon.discount).toFixed(2)}`
        : ` ${Number(coupon.discount).toFixed(2)}`;
    doc.text("Coupon Discount:", pageWidth - 115, y);
    doc.text(`- ${couponDiscountAmount.toFixed(2)}`, pageWidth - 12, y, { align: "right" });
    y += 6;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Total:", pageWidth - 115, y);
  doc.text(`${totalValue.toFixed(2)}`, pageWidth - 12, y, { align: "right" });
  y += 12;

  // ---------- PAYMENT STATUS ----------
  if (order.payment) {
    // QR placeholder image (use shipped asset). loads safely and drawn inside rounded box.
    try {
      const qrW = 48;
      const qrX = pageWidth - pad - qrW;
      const qrY = y - 6;
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = qrPlaceholder;
      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
      });

      // white rounded background + border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(200);
      doc.roundedRect(qrX - 4, qrY - 4, qrW + 8, qrW + 8, 4, 4, "FD");
      // embed image
      doc.addImage(img, "PNG", qrX, qrY, qrW, qrW);
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text("Scan to Pay", qrX + qrW / 2, qrY + qrW + 6, { align: "center" });
    } catch (err) {
      // fallback rectangle
      doc.setDrawColor(150);
      doc.rect(pageWidth - 60, y - 2, 40, 40);
      doc.setFontSize(9);
      doc.text("Scan to Pay", pageWidth - 40, y + 16, { align: "center" });
    }
  } else {

    // QR placeholder image (use shipped asset). loads safely and drawn inside rounded box.
    try {
      const qrW = 48;
      const qrX = pageWidth - pad - qrW;
      const qrY = y - 6;
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = qrPlaceholder;
      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
      });

      // white rounded background + border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(200);
      doc.roundedRect(qrX - 4, qrY - 4, qrW + 8, qrW + 8, 4, 4, "FD");
      // embed image
      doc.addImage(img, "PNG", qrX, qrY, qrW, qrW);
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text("Scan to Pay", qrX + qrW / 2, qrY + qrW + 6, { align: "center" });
    } catch (err) {
      // fallback rectangle
      doc.setDrawColor(150);
      doc.rect(pageWidth - 60, y - 2, 40, 40);
      doc.setFontSize(9);
      doc.text("Scan to Pay", pageWidth - 40, y + 16, { align: "center" });
    }
  }

  y += 40;

  // ---------- NOTES ----------
  if (order.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", pad, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(order.notes, pageWidth - pad * 2);
    doc.text(wrapped, pad, y);
    y += wrapped.length * 5 + 6;
  }

  // ---------- FOOTER ----------
  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...PRIMARY);
  doc.text(
    "Thank you for your order!",
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" }
  );

  doc.save(`invoice_${order._id}.pdf`);
};


  return (
    <div className="p-4 md:p-6 bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Orders Management</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchAllOrders}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md flex items-center gap-2 transition-colors"
          >
            <X size={16} />
            Clear Filters
          </button>
          <select
            className="p-2 border rounded bg-white text-gray-800 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={ordersPerPage}
            onChange={(e) => {
              setOrdersPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">
            Start Date
          </label>
          <div className="flex items-center gap-2 border rounded p-2 bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={filters.startDate}
              className="w-full bg-transparent text-gray-800 focus:outline-none"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">End Date</label>
          <div className="flex items-center gap-2 border rounded p-2 bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={filters.endDate}
              className="w-full bg-transparent text-gray-800 focus:outline-none"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">
            Search Email
          </label>
          <div className="flex items-center gap-2 border rounded p-2 bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={filters.email}
              placeholder="Search by email"
              className="w-full bg-transparent text-gray-800 focus:outline-none"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
        </div>
        {/* <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">
            Payment Type
          </label>
          <div className="flex items-center gap-2 border rounded p-2 bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.paymentType}
              className="w-full bg-transparent text-gray-800 focus:outline-none"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, paymentType: e.target.value }))
              }
            >
              <option value="">All Payment Types</option>
              <option value="paypal">PayPal</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="crypto">Crypto</option>
              <option value="western_union">Western Union</option>
            </select>
          </div>
        </div> */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">
            Order Status
          </label>
          <div className="flex items-center gap-2 border rounded p-2 bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select
              value={filters.status}
              className="w-full bg-transparent text-gray-800 focus:outline-none"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="">All Status</option>
              <option value="Order Placed">Order Placed</option>
              <option value="Packing">Packing</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">
            Payment Status
          </label>
          <div className="flex items-center gap-2 border rounded p-2 bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.paymentStatus}
              className="w-full bg-transparent text-gray-800 focus:outline-none"
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  paymentStatus: e.target.value,
                }))
              }
            >
              <option value="">All Payment Status</option>
              <option value="true">Paid</option>
              <option value="false">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Order Details
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Customer Info
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Notes & Discounts
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Invoice
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0 w-20 h-20">
                      {order.items[0]?.image && (
                        <img
                          src={order.items[0].image}
                          alt={order.items[0].name}
                          className="w-full h-full object-cover rounded-md shadow-sm"
                        />
                      )}
                    </div>
                    <div>
                      {order.userId ? (
                        // <div className="text-sm font-medium text-gray-800">
                        //   User ID: {order.userId}
                        // </div>
                        <div className="font-medium text-gray-800">
                            {order.billingAddress.firstName}{" "}
                            {order.billingAddress.lastName}
                          </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-800">
                          Guest User
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-800">
                        {order.items.map((item, i) => (
                          <div key={i}>
                            {item.name} x {item.quantity}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Order Date: {formatDateToIndian(order.date)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">
                    {/* Delivery Address */}
                    <div>
                      <div className="font-medium text-gray-800">
                        Delivery Address:
                      </div>
                      <div className="font-medium text-gray-800">
                        {order.address.firstName} {order.address.lastName}
                      </div>
                      <div className="text-gray-600">{order.address.email}</div>
                      <div className="text-gray-600">{order.address.phone}</div>
                      <div className="mt-2 text-gray-600">
                        <div>{order.address.street},</div>
                        <div>
                          {order.address.city}, {order.address.state}
                        </div>
                        <div>
                          {order.address.country}, {order.address.zipcode}
                        </div>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="mt-4">
                      <div className="font-medium text-gray-800">
                        Billing Address:
                      </div>
                      {order.billingAddress &&
                      JSON.stringify(order.billingAddress) !==
                        JSON.stringify(order.address) ? (
                        /* Show different billing address */
                        <div>
                          <div className="font-medium text-gray-800">
                            {order.billingAddress.firstName}{" "}
                            {order.billingAddress.lastName}
                          </div>
                          <div className="text-gray-600">
                            {order.billingAddress.email}
                          </div>
                          <div className="text-gray-600">
                            {order.billingAddress.phone}
                          </div>
                          <div className="mt-2 text-gray-600">
                            <div>{order.billingAddress.street},</div>
                            <div>
                              {order.billingAddress.city},{" "}
                              {order.billingAddress.state}
                            </div>
                            <div>
                              {order.billingAddress.country},{" "}
                              {order.billingAddress.zipcode}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Addresses are the same */
                        <div className="text-gray-600">
                          Same as delivery address
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-800">
                    {order.paymentMethod}
                  </div>
                  {order.manualPaymentDetails && (
                    <div className="text-xs text-gray-600 mt-1">
                      {order.manualPaymentDetails.paymentType}
                      {order.manualPaymentDetails.paymentType === "paypal" && (
                        <div className="mt-1">
                          PayPal: {order.manualPaymentDetails.paypalEmail}
                        </div>
                      )}
                      {order.manualPaymentDetails.paymentType === "crypto" && (
                        <>
                          <div className="mt-1">
                            Crypto Type: {order.manualPaymentDetails.cryptoType || "Not specified"}
                          </div>
                          <div className="mt-1">
                            Network: {order.manualPaymentDetails.cryptoNetwork || "Not specified"}
                          </div>
                          <div className="mt-1">
                            Transaction ID: {order.manualPaymentDetails.cryptoTransactionId || "Not provided"}
                          </div>
                        </>
                      )}
                      {order.manualPaymentDetails.paymentType ===
                        "credit_card" && (
                        <>
                          <div className="mt-1">
                            Credit Card Number:{" "}
                            {order.manualPaymentDetails.cardNumber}
                          </div>
                          <div className="mt-1">
                            Card Holder Name:{" "}
                            {order.manualPaymentDetails.cardHolderName}
                          </div>
                          <div className="mt-1">
                            Expiry Date: {order.manualPaymentDetails.expiryDate}
                          </div>
                          <div className="mt-1">
                            CVV: {order.manualPaymentDetails.cvv}
                          </div>
                        </>
                      )}
                      {order.manualPaymentDetails.paymentType ===
                        "debit_card" && (
                        <>
                          <div className="mt-1">
                            Debit Card Number:{" "}
                            {order.manualPaymentDetails.cardNumber}
                          </div>
                          <div className="mt-1">
                            Card Holder Name:{" "}
                            {order.manualPaymentDetails.cardHolderName}
                          </div>
                          <div className="mt-1">
                            Expiry Date: {order.manualPaymentDetails.expiryDate}
                          </div>
                          <div className="mt-1">
                            CVV: {order.manualPaymentDetails.cvv}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-800">
                    {currency} {order.amount}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <select
                    onChange={(e) => statusHandler(e, order._id)}
                    value={order.status}
                    className="text-sm border rounded p-1.5 bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Order Placed">Order Placed</option>
                    <option value="Packing">Packing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
                <td className="px-4 py-4">
                  {order.paymentMethod === "cash" ||
                  order.paymentMethod === "Manual" || order.paymentMethod === "upi" || 
                  order.paymentMethod === "credit-card" || order.paymentMethod === "debit-card" ||
                  order.paymentMethod === "COD" ? (
                    <select
  onChange={(e) => paymentStatusHandler(e, order._id)}
  value={order.payment.toString()}
  disabled={order.payment === true}
  className={`text-sm border rounded p-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
    ${order.payment ? "bg-green-100 text-green-800 border-green-300" : "bg-yellow-100 text-yellow-800 border-yellow-300"}
  `}
>
  <option value="false">Pending</option>
  <option value="true">Paid</option>
</select>

                  ) : (
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded ${
                        order.payment
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.payment ? "Paid" : "Pending"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">
                    {order.notes && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-800">Notes:</span>
                        <p className="text-gray-600 mt-1 p-2 bg-gray-100 rounded text-xs">{order.notes}</p>
                      </div>
                    )}
                    
                    {order.coupon && (
                      <div>
                        <span className="font-medium text-gray-800">Coupon:</span>
                        <div className="text-xs text-gray-600 mt-1">
                          <div>Code: <span className="font-medium">{order.coupon.code}</span></div>
                          <div>
  Discount: {currency} {Number(order.coupon.discount).toFixed(2)}
</div>

                          {order.originalAmount && (
                            <div>Original Total: {currency} {order.originalAmount}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-800">
                    <button
  onClick={() => generateInvoice(order)}
  className="
    px-4 py-1.5 
    text-xs font-medium 
    bg-indigo-600 
    text-white 
    rounded-md 
    shadow-sm
    hover:bg-indigo-700 
    active:bg-indigo-800
    transition-all 
    duration-200
  "
>
  Invoice
</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-600">
          Showing{" "}
          {orders.length > 0 ? (currentPage - 1) * ordersPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * ordersPerPage, totalOrders)} of {totalOrders}{" "}
          orders
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
            className="p-2 border rounded bg-white hover:bg-gray-50 border-gray-300 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages || loading}
            className="p-2 border rounded bg-white hover:bg-gray-50 border-gray-300 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

Orders.propTypes = {
  token: PropTypes.string,
};

export default Orders;
