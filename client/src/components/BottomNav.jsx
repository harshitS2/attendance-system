import { Link, useLocation } from 'react-router-dom';
import { Users, History, Home, Settings, Calendar } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const BottomNav = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const currentPath = location.pathname;

    const isActive = (path) => currentPath === path;

    const isAuthorized = user && ['TeamLead', 'Admin', 'SuperAdmin'].includes(user.role);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center shadow-lg rounded-t-3xl z-50">
            <Link to="/team" className={`p-2 transition-colors ${isActive('/team') ? 'text-blue-600 bg-blue-50 rounded-full' : 'text-gray-400 hover:text-blue-500'}`}>
                <Users size={24} />
            </Link>
            <Link to="/history" className={`p-2 transition-colors ${isActive('/history') ? 'text-blue-600 bg-blue-50 rounded-full' : 'text-gray-400 hover:text-blue-500'}`}>
                <History size={24} />
            </Link>
            <Link to="/dashboard" className={`p-2 transition-colors ${isActive('/dashboard') ? 'text-blue-600 bg-blue-50 rounded-full' : 'text-gray-400 hover:text-blue-500'}`}>
                <Home size={24} />
            </Link>
            {isAuthorized && (
                 <Link to="/shifts" className={`p-2 transition-colors ${isActive('/shifts') ? 'text-blue-600 bg-blue-50 rounded-full' : 'text-gray-400 hover:text-blue-500'}`}>
                    <Calendar size={24} />
                </Link>
            )}
             <Link to="/profile" className={`p-2 transition-colors ${isActive('/profile') ? 'text-blue-600 bg-blue-50 rounded-full' : 'text-gray-400 hover:text-blue-500'}`}>
                 <Settings size={24} />
            </Link>
        </div>
    );
};

export default BottomNav;
