import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const BarChart = ({ labels = [], data = [], label = '', backgroundColor = '#4e73df' }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', maxWidth: 500, height: 300 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChart;
