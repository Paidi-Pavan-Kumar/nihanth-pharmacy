import { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const Customers = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/user/allusers`, {
        headers: {token},
      });

      if (response.data?.success) {
        setUsers(response.data.users || []);
      } else {
        console.error("Failed to fetch users:", response.data?.message);
      }
    } catch (error) {
      console.error("Failed to fetch Users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const renderAddresses = (addresses) => {
    if (!Array.isArray(addresses) || addresses.length === 0) return "—";
    return (
      <ul className="list-disc pl-5 space-y-1">
        {addresses.map((a, i) => (
          <li key={i} className="text-sm text-gray-700 dark:text-gray-700">
            {a.firstName || a.street || a.city ? (
              <>
                {`${a.firstName ? a.firstName + " " : ""}${a.lastName ? a.lastName + ", " : ""}${a.street || ""} ${a.city || ""} ${a.state || ""}`}
                {a.zipcode ? ` — ${a.zipcode}` : ""} {a.phone ? ` • ${a.phone}` : ""}
              </>
            ) : (
              <pre className="text-xs">{JSON.stringify(a)}</pre>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const totalRegistered = (() => {
    // if backend returned meta.total use it; otherwise use users.length
    // response.meta is not stored here so fallback to users.length
    return users.length;
  })();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">Total registered</div>
          <div className="text-xl font-bold">{totalRegistered}</div>
          <button
            onClick={fetchUsers}
            disabled={!token || loading}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <section className="bg-white rounded-lg border shadow-sm p-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Saved Addresses</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const addressCount = Array.isArray(u.savedAddresses) ? u.savedAddresses.length : 0;
                  return (
                    <tr key={u._id} className="border-t">
                      <td className="px-3 py-3 align-top">{idx + 1}</td>
                      <td className="px-3 py-3 align-top">{u.name || "—"}</td>
                      <td className="px-3 py-3 align-top">{u.phoneNumber ?? "—"}</td>
                      <td className="px-3 py-3 align-top">{u.email || "—"}</td>
                      <td className="px-3 py-3 align-top">
                        <div className="text-sm text-gray-500 mb-1">Count: {addressCount}</div>
                        {renderAddresses(u.savedAddresses)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Customers;