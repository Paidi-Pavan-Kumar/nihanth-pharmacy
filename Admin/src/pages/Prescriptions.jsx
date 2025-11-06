import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, ImageIcon, Download, Eye, Search } from "lucide-react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Prescriptions = ({ token }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null); // selected prescription for modal

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setPrescriptions([]);
      return;
    }

    const fetchPrescriptions = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `${backendUrl}/api/prescription/my-prescriptions`,
          { headers: { token } }
        );
        if (res.data && res.data.success) {
          setPrescriptions(res.data.data || []);
        } else {
          setError(res.data?.message || "Failed to load prescriptions");
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [token]);

  const filtered = prescriptions.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.notes || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Prescriptions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View uploaded prescriptions and details
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, phone or notes"
                className="pl-10 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-4 h-36" />
              ))
            ) : error ? (
              <div className="col-span-full bg-red-50 dark:bg-red-900/30 text-red-700 p-4 rounded">
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-10 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 dark:text-gray-300">No prescriptions found.</p>
              </div>
            ) : (
              filtered.map((p) => (
                <article key={p._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex flex-col">
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {p.phone} • {p.email || "No email"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{new Date(p.date || p.createdAt).toLocaleString()}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelected(p)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500 transition"
                        title="View"
                      >
                        <Eye size={16} /> View
                      </button>
                    </div>
                  </header>

                  <div className="mt-3 flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{p.notes || "No notes"}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {(p.prescriptionImages || []).slice(0, 3).map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="w-20 h-20 rounded-md overflow-hidden border border-gray-100 dark:border-gray-700"
                        title="Open image"
                      >
                        <img src={img} alt={`pres-${idx}`} className="w-full h-full object-cover" />
                      </a>
                    ))}

                    {(p.prescriptionImages || []).length > 3 && (
                      <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">+{(p.prescriptionImages || []).length - 3} more</div>
                    )}
                  </div>

                  <footer className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <a
                      href={p.prescriptionImages?.[0] || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-gray-600 dark:text-gray-300 inline-flex items-center gap-2 hover:text-indigo-600 transition"
                    >
                      <Download size={14} /> Download first image
                    </a>
                    <span className="ml-auto text-xs text-gray-400">{p.userId ? "User uploaded" : "Guest upload"}</span>
                  </footer>
                </article>
              ))
            )}
          </div>

          {/* pagination placeholder */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-gray-500">{filtered.length} result(s)</div>
              <div className="text-sm text-gray-500">—</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{selected.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selected.phone}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-600 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-auto">
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selected.notes || "No notes"}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Images</h5>
                <div className="flex flex-wrap gap-3">
                  {(selected.prescriptionImages || []).map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noreferrer" className="w-40 h-40 rounded overflow-hidden border">
                      <img src={img} alt={`sel-${i}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                  {(selected.prescriptionImages || []).length === 0 && (
                    <div className="text-sm text-gray-500">No images available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
