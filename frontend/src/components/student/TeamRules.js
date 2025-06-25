import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeamRules = () => {
    const [maxTeamSize, setMaxTeamSize] = useState(4); // Default, will be updated
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMaxTeamSize = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Authentication token not found');
                    setLoading(false);
                    return;
                }
                const res = await axios.get('http://localhost:5000/api/teams/max-team-size', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.maxTeamSize) {
                    setMaxTeamSize(res.data.maxTeamSize);
                }
            } catch (err) {
                console.error('Error fetching max team size:', err);
                setError(err.response?.data?.message || 'Error fetching team rules');
            } finally {
                setLoading(false);
            }
        };
        fetchMaxTeamSize();
    }, []);

    if (loading) {
        return <div>Loading rules...</div>;
    }

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Team Formation Rules</h2>
            <div className="space-y-4">
                <p className="text-gray-700">
                    Welcome to the Team Formation section! Here are the current team formation rules:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Maximum team size: {maxTeamSize} students</li>
                    <li>Each team must have a team leader</li>
                    <li>Team leader can submit guide preferences</li>
                    <li>Team formation requires guide approval</li>
                    <li>Final approval is required from the admin</li>
                    <li>Students can only be part of one team</li>
                    <li>Team changes are not allowed after final approval</li>
                </ul>
                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                    <p className="text-blue-700">
                        Please ensure you have read and understood all the rules before proceeding with team formation.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TeamRules; 