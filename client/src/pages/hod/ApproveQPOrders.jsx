import React, { useState } from 'react';

const ApproveQPOrders = () => {
  const [orders, setOrders] = useState([
    {
      id: 1,
      subjectCode: 'CS501',
      subjectName: 'Advanced Data Structures',
      facultyName: 'Dr. John Smith',
      status: 'Pending'
    },
    {
      id: 2,
      subjectCode: 'CS502',
      subjectName: 'Machine Learning',
      facultyName: 'Dr. Sarah Johnson',
      status: 'Pending'
    },
    {
      id: 3,
      subjectCode: 'CS503',
      subjectName: 'Cloud Computing',
      facultyName: 'Dr. Michael Brown',
      status: 'Pending'
    },
    {
      id: 4,
      subjectCode: 'CS504',
      subjectName: 'Big Data Analytics',
      facultyName: 'Dr. Emily Davis',
      status: 'Pending'
    }
  ]);

  const handleApprove = (orderId) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: 'Approved' }
        : order
    ));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Approve Question Paper Orders</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faculty Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.subjectCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.subjectName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.facultyName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'Approved' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.status === 'Pending' && (
                    <button
                      onClick={() => handleApprove(order.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApproveQPOrders; 