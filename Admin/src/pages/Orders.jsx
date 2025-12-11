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
import qrPlaceholder from "../assets/qrPlaceholder.jpg";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  // Used to compute frontend-only sequential order numbers (oldest = 1)
  const [allOrderIdsSortedByDate, setAllOrderIdsSortedByDate] = useState([]);
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

  // fetch minimal list once (sorted by date) so we can generate sequential invoice ids on frontend
  useEffect(() => {
    const fetchAllIds = async () => {
      if (!token) return;
      try {
        const res = await axios.post(
          backendUrl + "/api/order/list",
          { page: 1, limit: 100000 }, // large limit — adjust if you have huge dataset
          { headers: { token } }
        );
        if (res.data?.success && Array.isArray(res.data.orders)) {
          const idsByDate = res.data.orders
            .slice()
            .sort((a, b) => Number(a.date || 0) - Number(b.date || 0))
            .map((o) => o._id);
          setAllOrderIdsSortedByDate(idsByDate);
        }
      } catch (err) {
        // ignore — fallback to index-based numbering below
      }
    };
    fetchAllIds();
  }, [token]);

  const formatInvoiceDate = (ts) => {
    try {
      const d = new Date(Number(ts));
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "-";
    }
  };

  const generateInvoice = async (order) => {
    const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 4;
    const pad = 8;
    const deliver = order.address || {};
    const doctor = deliver.country != null ? deliver.country : "Over the counter";
    const patientname = deliver.firstName ? `${deliver.firstName} ${deliver.lastName || ""}`.trim() : ""
    const ensureSpace = (needed) => {
      if (y + needed > pageHeight - pad) {
        doc.addPage();
        y = pad;
      }
    };

    const smallQR = 22;
    const PRIMARY = [30, 80, 180];
    const LIGHT_GRAY = [240, 240, 240];
    const BORDER_GRAY = [180, 180, 180];
    const DARK_TEXT = [40, 40, 40];

    // ---------- HEADER (left: company info + logo, right: QR) ----------
    const headerLeftWidth = pageWidth / 2 - pad;
    const headerRightX = pageWidth / 2 + pad;

    // LEFT SIDE: Logo + Company Details
    try {
      const logo = new Image();
      logo.crossOrigin = "Anonymous";
      logo.src = "/vite.png"; // replace with actual logo path
      await new Promise((res) => { logo.onload = res; logo.onerror = res; });
      const logoW = 16, logoH = 16;
      doc.addImage(logo, "PNG", pad, y, logoW, logoH);
    } catch (e) {
      // ignore if logo fails
    }

    // Company name next to logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK_TEXT);
    doc.text("MEDIQUICK", pad + 18, y + 3);

    // Tagline
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    doc.text("", pad + 18, y + 8);

    // Address lines
    doc.setFontSize(6.5);
    const addressLines = doc.splitTextToSize(
      "Bangalore, Karnataka, India",
      headerLeftWidth - 4
    );
    doc.text(addressLines, pad + 18, y + 8);

    // Contact details
    const contactY = y + 12;
    doc.setFontSize(6);
    doc.text("M: +91 8904813463   Email: mediquickcontact@gmail.com", pad + 18, contactY);

    // RIGHT SIDE: QR Code (small, top right) + Invoice details (beside QR)
    const qrW = smallQR;
    const qrX = pageWidth - pad - qrW - 2;
    const qrY = y;
    
    // QR Code
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = qrPlaceholder;
      await new Promise((res) => { img.onload = res; img.onerror = res; });

      // QR white background + border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(200);
      doc.roundedRect(qrX - 1.5, qrY - 1.5, qrW + 3, qrW + 3, 1.5, 1.5, "FD");
      doc.addImage(img, "PNG", qrX, qrY, qrW, qrW);
    } catch (e) {
      // fallback
      doc.setDrawColor(150);
      doc.rect(qrX, qrY, qrW, qrW);
    }

    // Invoice metadata (RIGHT of QR code, vertically stacked)
    const metaX = pageWidth - pad - qrW - 40;  // to the left of QR
    let metaY = y + 2;
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text("Invoice", metaX, metaY);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    const indexInAll = allOrderIdsSortedByDate.indexOf(order._id);
    const invoiceLabel = indexInAll !== -1 ? String(indexInAll + 1) : String(order._id || "");
    
    metaY += 3.5;
    doc.text(`Bill No: ${invoiceLabel}`, metaX, metaY);
    metaY += 3;
    doc.text(`Payment: ${order.payment ? "Paid" : "Due(Scan QR to Pay)"}`, metaX, metaY);
    metaY += 3;
    doc.text(formatInvoiceDate(order.date), metaX, metaY);
    metaY += 3;
    doc.text(`Patient: ${patientname}`, metaX, metaY);
    metaY += 3;
    doc.text(`Ref By: DR.${doctor}`, metaX, metaY);
    y += 24;

    // ---------- DIVIDER ----------
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.6);
    doc.line(pad, y, pageWidth - pad, y);
    y += 1;

    // ---------- ADDRESS SECTION ----------
    const delivery = order.address || {};
    const wrapWidth = Math.floor(pageWidth - pad * 2 - 16);
    
    // Compact address: max 2 lines
    const deliveryLines = [];
    
    // Line 1: Name + Phone + Street
    const line1Parts = [
      delivery.firstName ? `${delivery.firstName} ${delivery.lastName || ""}`.trim() : "",
      delivery.phone ? `Ph: ${delivery.phone}` : "",
      delivery.street ? delivery.street : ""
    ].filter(Boolean).join(", ");
    
    if (line1Parts) {
      const wrapped1 = doc.splitTextToSize(line1Parts, wrapWidth);
      deliveryLines.push(...wrapped1);
    }
    
    // Line 2: City, State, Zipcode, Country
    const line2Parts = [
      delivery.city || "",
      delivery.state || "",
      delivery.zipcode || "",
    ].filter(Boolean).join(", ");
    
    if (line2Parts) {
      const wrapped2 = doc.splitTextToSize(line2Parts, wrapWidth);
      deliveryLines.push(...wrapped2);
    }

    const titleHeight = 7;
    const lineHeight = 5;
    const innerPadding = 6;
    const addrBoxHeight = titleHeight + deliveryLines.length * lineHeight + innerPadding;

    doc.setDrawColor(...BORDER_GRAY);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(pad, y, pageWidth - pad * 2, addrBoxHeight, 4, 4, "F");

    let addrY = y + titleHeight;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(7);
    doc.text("Delivery Address", pad + 6, addrY);
    addrY += lineHeight;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(6);
    deliveryLines.forEach((ln) => {
      doc.text(String(ln), pad + 6, addrY);
      addrY += lineHeight;
    });

    y += addrBoxHeight + 2;

    // Divider
    doc.setDrawColor(...PRIMARY);
    doc.line(pad, y, pageWidth - pad, y);
    y += 1;

    // ---------- ITEMS HEADER ----------
    doc.setFillColor(230, 235, 250);
    doc.rect(pad, y, pageWidth - pad * 2, 8, "F");

    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    doc.text("No.", pad + 2, y + 5);
    doc.text("Description", pad + 18, y + 5);
    doc.text("MRP", pageWidth - 130, y + 5, { align: "right" });
    doc.text("Final", pageWidth - 100, y + 5, { align: "right" });
    doc.text("Disc", pageWidth - 70, y + 5, { align: "right" });
    doc.text("Qty", pageWidth - 46, y + 5, { align: "right" });
    doc.text("Total", pageWidth - 12, y + 5, { align: "right" });

    y += 12;

    // ---------- ITEMS LIST ----------
    const items = order.items || [];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);

    let subtotalMRP = 0;
    let sellingTotal = 0;
    let customerDiscountAmount = 0;

    items.forEach((it, i) => {
      const qty = Number(it.quantity || 1) || 1;
      const mrp = it.mrp != null ? Number(it.mrp / qty) : (it.price != null ? Number(it.price) : 0);
      const selling = it.sellingPrice != null ? Number(it.sellingPrice / qty) : (it.price != null ? Number(it.price) : mrp);
      const itemDiscountPercent = it.discount != null ? Number(it.discount) : (it.customerDiscount != null ? Number(it.customerDiscount) : null);

      const mrpLine = mrp * qty;
      const sellingLine = selling * qty;
      subtotalMRP += mrpLine;
      sellingTotal += sellingLine;
      customerDiscountAmount += Math.max(0, mrpLine - sellingLine);

      const descWidth = pageWidth - pad * 2 - 160;
      const descLines = doc.splitTextToSize((it.name+" # "+ (it.packing != null ? it.packing : "")) || "-", descWidth);
      const lineHeight = 1;
      const rowHeight = Math.max(descLines.length * lineHeight, 5);

      if (y + rowHeight + 6 > pageHeight - 10) {
        doc.addPage();
        y = pad;
      }

      doc.text(String(i + 1), pad + 2, y);
      doc.text(descLines, pad + 18, y);

      const baselineY = y;
      doc.text(mrp != null ? mrp.toFixed(2) : "-", pageWidth - 130, baselineY, { align: "right" });
      doc.text(selling.toFixed(2), pageWidth - 100, baselineY, { align: "right" });
      doc.text(itemDiscountPercent != null ? `${itemDiscountPercent}%` : "-", pageWidth - 70, baselineY, { align: "right" });
      doc.text(String(qty), pageWidth - 46, baselineY, { align: "right" });
      doc.text(mrpLine.toFixed(2), pageWidth - 12, baselineY, { align: "right" });

      y += rowHeight + 0.1;
    });

    y += 1;

    // ---------- TOTALS SECTION (TABLE LAYOUT) ----------
    const subtotalValue = subtotalMRP;
    const sellingValue = sellingTotal;
    const customerDiscount = customerDiscountAmount;
    let couponDiscountAmount = 0;
    if (order.coupon && order.coupon.discount != null) {
      if ((order.coupon.discountType || "").toLowerCase() === "percentage") {
        couponDiscountAmount = Number(order.coupon.discount)
      } else {
        couponDiscountAmount = Number(order.coupon.discount || 0);
      }
    }
    const totalValue = Number(order.amount ?? (sellingValue - couponDiscountAmount ?? 0));

    ensureSpace(26);
    let totalsY = y;

    // Create table-like layout with borders
    const col1X = pad;
    const col2X = pad + 45;
    const col3X = pad + 90;
    const tableW = pageWidth - pad * 2;
    const rowH = 5;

    // Draw table borders
    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.5);

    // Horizontal lines
    doc.line(col1X, totalsY, col1X + tableW, totalsY);
    doc.line(col1X, totalsY + rowH * 2, col1X + tableW, totalsY + rowH * 2);
    doc.line(col1X, totalsY + rowH * 4, col1X + tableW, totalsY + rowH * 4);

    // Vertical lines
    doc.line(col2X, totalsY, col2X, totalsY + rowH * 4);
    doc.line(col3X, totalsY, col3X, totalsY + rowH * 4);

    // LEFT COLUMN: Terms & Conditions + Sign
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text("Terms & Conditions", col1X + 2, totalsY + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(60, 60, 60);
    doc.text("NO RETURN AND NO EXCHANGE", col1X + 2, totalsY + rowH + 3);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...DARK_TEXT);
    doc.text("Sign", col1X + 20, totalsY + rowH * 2.5);

    // MIDDLE COLUMN: Summary Table (Total Items, Total MRP, Round off)
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    doc.text("Total Item(s)", col2X + 2, totalsY + 4);
    doc.text(String(items.length), col3X - 8, totalsY + 4, { align: "right" });

    doc.text("Total MRP", col2X + 2, totalsY + rowH + 4);
    doc.text(subtotalValue.toFixed(2), col3X - 8, totalsY + rowH + 4, { align: "right" });

    // Coupon Discount row (added)
    doc.text("Coupon Discount", col2X + 2, totalsY + rowH * 2 + 4);
    doc.text(`- ${couponDiscountAmount.toFixed(2)}`, col3X - 8, totalsY + rowH * 2 + 4, { align: "right" });

    const roundOff = totalValue - Math.floor(totalValue);
    // move Round off one row down to accommodate coupon row
    doc.text("Round off.", col2X + 2, totalsY + rowH * 3 + 4);
    doc.text((roundOff >= 0 ? "-" : "") + roundOff.toFixed(2), col3X - 8, totalsY + rowH * 3 + 4, { align: "right" });

    // RIGHT COLUMN: Net Payable box (highlighted)
    const netPayableX = col3X;
    const netPayableH = rowH * 4;

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(netPayableX, totalsY, tableW - (col3X - col1X), netPayableH, 2, 2, "F");

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text("Net Payable", netPayableX + 3, totalsY + 3);

    doc.setFontSize(8);
    doc.text(`Rs. ${(totalValue-roundOff).toFixed(2)}`, netPayableX + 3, totalsY + 8);

    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Total Saving: Rs. ${(customerDiscount+couponDiscountAmount).toFixed(2)}`, netPayableX + 3, totalsY + 12);
    doc.text("Billed By: Owner", netPayableX + 3, totalsY + 16);

    y = totalsY + rowH * 4 + 4;

    // ---------- DIVIDER ----------
    doc.setDrawColor(...PRIMARY);
    doc.line(pad, y, pageWidth - pad, y);
    y += 3;

    // ---------- BOTTOM FOOTER ----------
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text("PATHWAY TO A HEALTHY LIFE", pad + 2, y);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("www.mediquick1.com", pageWidth / 2, y, { align: "center" });

    // ---------- FOOTER ----------
    doc.setFontSize(6);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...PRIMARY);
    doc.text(
      "Thank you for your order!",
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );

    doc.save(`invoice_${invoiceLabel}.pdf`);
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
