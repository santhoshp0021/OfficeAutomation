import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import PanelAssignedTeams from './panel/PanelAssignedTeams';
import PanelReviewSchedules from './panel/PanelReviewSchedules';
import PanelMarking from './panel/PanelMarking';

const PanelDashboard = () => {
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    if (!user) {
        return null; // or a loading spinner/redirect
    }

    // Check if we are at the base /panel-dashboard path
    const isBasePanelDashboard = location.pathname === '/panel-dashboard' || location.pathname === '/panel-dashboard/';

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar user={user} onLogout={handleLogout} />
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {isBasePanelDashboard ? (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4">Panel Member Dashboard</h2>
                            <div className="space-y-4">
                                <p className="text-gray-700">
                                    Welcome to the Panel Member Dashboard! This is where you'll be able to:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>View assigned teams</li>
                                    <li>Review project submissions</li>
                                    <li>Evaluate team presentations</li>
                                    <li>Provide feedback and scores</li>
                                </ul>
                                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                                    <p className="text-blue-700">
                                        Evaluation functionality will be available soon. Please check back later.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Outlet /> // This will render the nested route components
                    )}
                </div>
            </div>
        </div>
    );
};

export default PanelDashboard; 