import React from 'react';

const GuideDashboardHome = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Guide Dashboard</h2>
            <div className="space-y-4">
                <p className="text-gray-700">
                    Welcome to the Guide Dashboard! Here you can manage your assigned teams, handle guide requests, and oversee review schedules.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Manage Guide Requests</li>
                    <li>View My Teams</li>
                    <li>View Review Schedules</li>
                    <li>Upload Daily Attendance</li>
                    <li>Mark Teams</li>
                </ul>
            </div>
        </div>
    );
};

export default GuideDashboardHome; 