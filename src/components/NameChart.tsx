import React, { useState, useEffect } from "react";
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
  firstName: string;
  isLoading: boolean;
}

// Data reduction function - sample every N years
const sampleData = (data: NameHistory[], sampleRate: number): NameHistory[] => {
  if (sampleRate <= 1) return data;

  return data.filter((_, index) => index % sampleRate === 0);
};

// Reduce data by decades
const reduceByDecades = (data: NameHistory[]): NameHistory[] => {
  const decadeMap = new Map<number, NameHistory>();

  data.forEach((item) => {
    const decade = Math.floor(item.year / 10) * 10;
    if (!decadeMap.has(decade) || item.year === decade) {
      decadeMap.set(decade, item);
    }
  });

  return Array.from(decadeMap.values()).sort((a, b) => a.year - b.year);
};

// Determine optimal display mode based on data size - only choose between sampled and all
const getOptimalDisplayMode = (dataLength: number): "all" | "sampled" => {
  return dataLength > 40 ? "sampled" : "all";
};

const NameChart: React.FC<NameChartProps> = ({
  nameHistory,
  firstName,
  isLoading,
}) => {
  const { isDarkMode } = useTheme();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Initialize display mode, but allow for 'decades' as a user selection
  const [dataDisplayMode, setDataDisplayMode] = useState<
    "all" | "decades" | "sampled"
  >("sampled");

  // Set optimal display mode when data is loaded (only choose between 'all' and 'sampled')
  useEffect(() => {
    if (nameHistory && nameHistory.length > 0) {
      setDataDisplayMode(getOptimalDisplayMode(nameHistory.length));
    }
  }, [nameHistory]);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

  // Apply data reduction based on selected mode
  let displayData = sortedData;
  if (dataDisplayMode === "decades") {
    displayData = reduceByDecades(sortedData);
  } else if (dataDisplayMode === "sampled") {
    // Dynamically adjust sample rate based on data size
    const sampleRate = sortedData.length > 100 ? 5 : 3;
    displayData = sampleData(sortedData, sampleRate);
  }

  // Prepare chart data
  const labels = displayData.map((item) => item.year.toString());
  const rankData = displayData.map((item) => item.rank);

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
        tension: 0.3, // Add some curve to the line for smoother appearance
        pointRadius: dataDisplayMode === "all" ? 2 : 3, // Smaller points for full data
        pointHoverRadius: 6,
      },
    ],
  };

  // Chart options
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to fill container
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
          // Limit the number of ticks shown
          maxTicksLimit: 10,
        },
      },
      x: {
        grid: {
          color: (context) => {
            // Only show grid lines for decade years
            if (context.tick && context.tick.label) {
              // Handle both string and string[] cases
              const label = context.tick.label;
              const yearText = Array.isArray(label) ? label[0] : label;
              const year = parseInt(yearText);
              return !isNaN(year) && year % 10 === 0
                ? gridColor
                : "transparent";
            }
            return "transparent";
          },
        },
        ticks: {
          color: textColor,
          // Show fewer x-axis labels on small screens
          maxTicksLimit: windowWidth < 600 ? 10 : 20,
          callback: function (val, _) {
            // Show every nth year based on data size
            const year = this.getLabelForValue(val as number);
            if (displayData.length > 100) {
              return parseInt(year) % 10 === 0 ? year : "";
            } else if (displayData.length > 50) {
              return parseInt(year) % 5 === 0 ? year : "";
            }
            return year;
          },
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
        text: `${firstName} Popularity Over Time`,
        color: textColor,
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return `Year: ${tooltipItems[0].label}`;
          },
          label: (context) => {
            return `Rank: #${context.parsed.y}`;
          },
        },
      },
    },
  };

  return (
    <div className="mt-4">
      {/* Chart display mode selector - keeping all three options */}
      <div className="flex justify-end mb-2 space-x-2 text-sm">
        <button
          onClick={() => setDataDisplayMode("sampled")}
          className={`px-2 py-1 rounded ${
            dataDisplayMode === "sampled"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          Sampled
        </button>
        <button
          onClick={() => setDataDisplayMode("decades")}
          className={`px-2 py-1 rounded ${
            dataDisplayMode === "decades"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          By Decade
        </button>
        <button
          onClick={() => setDataDisplayMode("all")}
          className={`px-2 py-1 rounded ${
            dataDisplayMode === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          All Years
        </button>
      </div>

      {/* Chart container with fixed height for better mobile display */}
      <div className="h-64 md:h-80">
        <Line options={options} data={rankChartData} />
      </div>

      {/* Additional chart info */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        <p>* Lower rank is more popular (1 = most popular)</p>
        <p>* Data sourced from US Census and Social Security records</p>
      </div>
    </div>
  );
};

export default NameChart;
