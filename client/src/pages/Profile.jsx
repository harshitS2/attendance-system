import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { User, Mail, Briefcase, Phone, Settings as SettingsIcon } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20 font-sans">
            <div className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <span className="font-semibold text-lg">My Profile</span>
                <SettingsIcon />
            </div>

            <div className="p-4">
                <div className="bg-white rounded-3xl p-6 shadow-lg mb-6 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-blue-100 mb-4 overflow-hidden border-4 border-white shadow-sm">
                        <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random&size=128`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                    <p className="text-gray-500 text-sm">{user.designation}</p>
                    <span className="mt-2 bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold">{user.role}</span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
                    <div className="p-4 border-b border-gray-100 flex items-center">
                        <Mail className="text-gray-400 mr-3" size={20} />
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Email</p>
                            <p className="text-gray-800">{user.email}</p>
                        </div>
                    </div>
                    <div className="p-4 border-b border-gray-100 flex items-center">
                        <Briefcase className="text-gray-400 mr-3" size={20} />
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Employee ID</p>
                            <p className="text-gray-800">{user.employeeId}</p>
                        </div>
                    </div>
                     <div className="p-4 flex items-center">
                        <User className="text-gray-400 mr-3" size={20} />
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Role</p>
                            <p className="text-gray-800">{user.role}</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors"
                >
                    Log Out
                </button>
            </div>

            <BottomNav />
        </div>
    );
};

export default Profile;
