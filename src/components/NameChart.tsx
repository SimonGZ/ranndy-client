import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { NameHistory } from "../types";
import { useTheme } from "../ThemeContext";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface NameChartProps {
  nameHistory: NameHistory[] | null;
  isLoading: boolean;
}

const NameChart: React.FC<NameChartProps> = ({ nameHistory, isLoading }) => {
  const { isDarkMode } = useTheme();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        Loading chart data...
      </div>
    );
  }

  if (!nameHistory || nameHistory.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        No historical data available
      </div>
    );
  }

  // Sort data by year
  const sortedData = [...nameHistory].sort((a, b) => a.year - b.year);

  // Prepare chart data
  const labels = sortedData.map((item) => item.year.toString());
  const rankData = sortedData.map((item) => item.rank);

  const textColor = isDarkMode
    ? "rgba(255, 255, 255, 0.8)"
    : "rgba(0, 0, 0, 0.8)";
  const gridColor = isDarkMode
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";

  // Chart data for rank (primary)
  const rankChartData = {
    labels,
    datasets: [
      {
        label: "Rank",
        data: rankData,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        yAxisID: "y",
      },
    ],
  };

  // Chart options
  const options: ChartOptions<"line"> = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        reverse: true, // Lower rank (1) is better, so we reverse the scale
        title: {
          display: true,
          text: "Rank",
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
      x: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
        },
      },
      title: {
        display: true,
        text: `Name Popularity Over Time`,
        color: textColor,
      },
    },
  };

  return (
    <div className="mt-4">
      <Line options={options} data={rankChartData} />

      {/* Additional chart info */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        <p>* Lower rank is more popular (1 = most popular)</p>
        <p>* Data sourced from US Census and Social Security records</p>
      </div>
    </div>
  );
};

export default NameChart;
