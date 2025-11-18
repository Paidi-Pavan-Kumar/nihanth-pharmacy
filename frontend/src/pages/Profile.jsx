import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { Navigate, Link } from 'react-router-dom';

const Profile = () => {
  const { token, user, navigate } = useContext(ShopContext);
  if (!token) return <Navigate to="/login" replace />;

  // local copy of user so UI updates without a full page reload
  const [localUser, setLocalUser] = useState(user || {});

   const [showEdit, setShowEdit] = useState(false);
   const [form, setForm] = useState({
    name: (user?.name || ''),
    email: (user?.email || ''),
    phoneNumber: (user?.phoneNumber || ''),
    // use first saved address (object) as editable address
    address: (Array.isArray(user?.savedAddresses) && user.savedAddresses[0]) || {}
   });

   const openEdit = () => {
     setForm({
      name: localUser?.name || '',
      email: localUser?.email || '',
      phoneNumber: localUser?.phoneNumber || '',
      address: (Array.isArray(localUser?.savedAddresses) && localUser.savedAddresses[0]) || {}
     });
     setShowEdit(true);
   };

   const handleSave = async (e) => {
     try {
       e.preventDefault();
       // basic validation
       if (!form.name) return toast.error("Name is required");
       if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Invalid email");
       if (form.phoneNumber && String(form.phoneNumber).length !== 10) return toast.error("Enter 10 digit phone");

       const payload = {
         userId: user._id,
         name: form.name,
         email: form.email,
         phoneNumber: form.phoneNumber,
         savedAddresses: [form.address]
       };

       const res = await axios.post(import.meta.env.VITE_BACKEND_URL + '/api/user/update-profile', payload, {
         headers: { token }
       });
       if (res.data.success) {
         toast.success('Profile updated');
         setShowEdit(false);
         // update local UI state with returned user (no page reload)
         if (res.data.user) {
           setLocalUser(res.data.user);
         } else {
           // fallback: update from form values
           setLocalUser(curr => ({
             ...curr,
             name: form.name,
             email: form.email,
             phoneNumber: form.phoneNumber,
             savedAddresses: [form.address]
           }));
         }
       } else {
         toast.error(res.data.message || 'Update failed');
       }
     } catch (err) {
       console.error(err);
       toast.error(err.response?.data?.message || 'Update failed');
     }
   };

   // helper to render address (supports array, object or string)
   const formatAddress = (addr) => {
     if (!addr) return "-";
     // if array, use first entry
     const a = Array.isArray(addr) ? addr[0] : addr;
     if (!a) return "-";
     if (typeof a === "string") return a;
     // expect object shape: { firstName, lastName, street, city, state, country, zipcode, phone, email }
     const parts = [];
     // if (a.firstName || a.lastName) parts.push(`${a.firstName || ""} ${a.lastName || ""}`.trim());
     if (a.street) parts.push(a.street);
     const cityState = [a.city, a.state].filter(Boolean).join(", ");
     if (cityState) parts.push(cityState);
     if (a.country || a.zipcode) parts.push([a.country, a.zipcode].filter(Boolean).join(" "));
     // if (a.phone) parts.push(`Phone: ${a.phone}`);
     // if (a.email) parts.push(`Email: ${a.email}`);
     return parts.join(", ") || JSON.stringify(a);
   };

   const initials = (user?.name || 'U')
    .split(' ')
    .map(s => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

   return (
     <div className="min-h-screen pt-16 pb-8 px-4 bg-gray-50 dark:bg-gray-900">
       <div className="max-w-5xl mx-auto">
         <header className="mb-6">
           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
           <p onClick={() => navigate("/contact")} className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your account details...Please contact us if you have forgotten your password</p>
         </header>

         <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left: Profile card */}
           <section className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 sm:p-6">
             <div className="flex items-center gap-4">
               <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-2xl font-semibold text-indigo-700 dark:text-indigo-200">
                {localUser?.avatarUrl ? (
                  <img src={localUser.avatarUrl} alt={localUser?.name} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
               </div>
               <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{localUser?.name || 'Unnamed User'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{localUser?.email || 'No email'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{localUser?.phoneNumber || 'No phone'}</p>
                <button onClick={openEdit} className="mt-2 text-sm px-3 py-1 bg-indigo-600 text-white rounded-md">Edit</button>
               </div>
              
             </div>
             {showEdit && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-5">
        Edit Profile
      </h3>

      <div className="grid grid-cols-1 gap-3">

        <input
          className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
          value={form.name}
          onChange={(e)=>setForm(f=>({...f,name:e.target.value}))}
          placeholder="Full name"
        />

        <input
          className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
          value={form.email}
          onChange={(e)=>setForm(f=>({...f,email:e.target.value}))}
          placeholder="Email"
        />

        <input
          className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
          value={form.phoneNumber}
          onChange={(e)=>setForm(f=>({...f,phoneNumber:e.target.value}))}
          placeholder="Phone number"
        />

        <input
          className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
          value={form.address.street || ''}
          onChange={(e)=>setForm(f=>({...f,address:{...f.address,street:e.target.value}}))}
          placeholder="Street"
        />

        <div className="flex gap-2">
          <input
            className="p-3 border rounded-lg flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
            value={form.address.city || ''}
            onChange={(e)=>setForm(f=>({...f,address:{...f.address,city:e.target.value}}))}
            placeholder="City"
          />
          <input
            className="p-3 border rounded-lg flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
            value={form.address.state || ''}
            onChange={(e)=>setForm(f=>({...f,address:{...f.address,state:e.target.value}}))}
            placeholder="State"
          />
        </div>

        <div className="flex gap-2">
          <input
            className="p-3 border rounded-lg flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
            value={form.address.country || ''}
            onChange={(e)=>setForm(f=>({...f,address:{...f.address,country:e.target.value}}))}
            placeholder="Country"
          />
          <input
            className="p-3 border rounded-lg flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
            value={form.address.zipcode || ''}
            onChange={(e)=>setForm(f=>({...f,address:{...f.address,zipcode:e.target.value}}))}
            placeholder="Zipcode"
          />
        </div>

      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          onClick={()=>setShowEdit(false)}
        >
          Cancel
        </button>

        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          onClick={(e) => handleSave(e)}
        >
          Save
        </button>
      </div>

    </div>
  </div>
)}

          </section>

          {/* Right: Details + stats */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="text-xs text-gray-500">Full name</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{user?.name || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{user?.email || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{user?.phoneNumber || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {formatAddress(localUser?.savedAddresses)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
       </div>
     </div>
   );
};

export default Profile;
