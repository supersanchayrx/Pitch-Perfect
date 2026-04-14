import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function PitchChart({ refPitchData, userPitchData }) {
    const data = {
        datasets: [
            {
                label: 'Source Pitch (Hz)',
                data: refPitchData,
                borderWidth: 2,
                pointRadius: 0,
                borderColor: '#69daff',
                backgroundColor: 'rgba(105, 218, 255, 0.1)',
                showLine: true,
                tension: 0.2,
            },
            {
                label: 'Your Pitch (Hz)',
                data: userPitchData,
                borderWidth: 2,
                pointRadius: 0,
                borderColor: '#ff59e3',
                backgroundColor: 'rgba(255, 89, 227, 0.1)',
                showLine: true,
                tension: 0.2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Time (s)',
                    color: '#aaabad',
                },
                ticks: { color: '#aaabad' },
                grid: { color: 'rgba(70, 72, 74, 0.2)' },
            },
            y: {
                title: {
                    display: true,
                    text: 'Frequency (Hz)',
                    color: '#aaabad',
                },
                ticks: { color: '#aaabad' },
                grid: { color: 'rgba(70, 72, 74, 0.2)' },
            },
        },
        plugins: {
            legend: {
                labels: { color: '#eeeef0' },
            },
        },
    };

    return (
        <div className="w-full h-full">
            <Line data={data} options={options} />
        </div>
    );
}
