import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Navigate, Link } from 'react-router-dom';

const Profile = () => {
  const { token, user , navigate} = useContext(ShopContext);
  if (!token) {
    return <Navigate to="/login" replace />;
  }

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
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user?.name} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name || 'Unnamed User'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'No email'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.phoneNumber || 'No phone'}</p>
              </div>
            </div>

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
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;
