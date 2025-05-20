import React from "react";
import { Pie } from "react-chartjs-2"; // Change import from Doughnut to Pie
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  PieController, // Import PieController
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels"; // Import the plugin
import { SurnameRaceData } from "../types";
import { useTheme } from "../ThemeContext";

// Register ChartJS components for Pie chart and the datalabels plugin
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels, PieController); // Register PieController
ChartJS.overrides.pie.plugins.legend.onClick = () => {};

interface SurnameRaceChartProps {
  data: SurnameRaceData | null;
  surname: string;
  isLoading: boolean;
}

const SurnameRaceChart: React.FC<SurnameRaceChartProps> = ({
  data,
  surname,
  isLoading,
}) => {
  const { isDarkMode } = useTheme();

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        Loading race data...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-600 dark:text-gray-400">
        No race data available for this surname.
      </div>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: ["White", "Black", "Asian", "Native", "Two or More", "Hispanic"],
    datasets: [
      {
        label: "Percentage",
        data: [
          data.pctWhite,
          data.pctBlack,
          data.pctAsian,
          data.pctNative,
          data.pctTwoOrMoreRaces,
          data.pctHispanic,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)", // Red
          "rgba(54, 162, 235, 0.6)", // Blue
          "rgba(255, 206, 86, 0.6)", // Yellow
          "rgba(75, 192, 192, 0.6)", // Green
          "rgba(153, 102, 255, 0.6)", // Purple
          "rgba(255, 159, 64, 0.6)", // Orange
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options: ChartOptions<"pie"> = {
    // Change ChartOptions type to "pie"
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
          // Use generateLabels to customize legend items
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels && data.datasets[0]) {
              // Create an array of objects with label, value, and original index
              const legendItems = data.labels
                .map((label, i) => {
                  const value = data.datasets[0].data[i];
                  // Only include items with a value greater than 0
                  if (typeof value === "number" && value > 0) {
                    return {
                      label: label,
                      value: value,
                      index: i, // Store original index
                    };
                  }
                  return null; // Filter out nulls later
                })
                .filter((item) => item !== null); // Remove null entries

              // Sort the items by value in descending order
              legendItems.sort((a, b) => b!.value - a!.value); // Use non-null assertion as we filtered nulls

              // Map the sorted items back to the Chart.js legend item format
              return legendItems.map((item) => {
                const meta = chart.getDatasetMeta(0);
                const element = meta.data[item!.index]; // Use original index to get element
                const value = item!.value;
                const percentageText = value.toFixed(1);

                // Add checks for element and element.options
                const style = element && element.options ? element.options : {}; // Provide a default empty object if options are missing

                return {
                  text: `${item!.label}: ${percentageText}%`, // Format label with percentage
                  // Use default values in case style properties are missing
                  fillStyle: style.backgroundColor || "rgba(0,0,0,0.1)", // Default color
                  strokeStyle: style.borderColor || "rgba(0,0,0,0.1)", // Default color
                  lineWidth: style.borderWidth || 1, // Default width
                  hidden: !chart.getDataVisibility(item!.index), // Use original index for visibility
                  index: item!.index, // Keep original index
                  fontColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.8)"
                    : "rgba(0, 0, 0, 0.8)",
                };
              });
            }
            return [];
          },
        },
      },
      title: {
        display: true,
        text: `Racial Breakdown for Surname: ${surname}`,
        color: isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed;
            return `${label}: ${value}%`;
          },
        },
      },
      datalabels: {
        // Configure the datalabels plugin
        color: isDarkMode ? "#fff" : "#000", // Label color
        formatter: (value, context) => {
          // Format the label based on percentage value
          const percentage = typeof value === "number" ? value : 0;
          const label = context.chart.data.labels?.[context.dataIndex] || "";

          if (percentage > 30) {
            // Show label and percentage on separate lines for > 30%
            return `${label}\n${percentage.toFixed(1)}%`;
          } else if (percentage > 10) {
            // Show only percentage for > 10%
            return `${percentage.toFixed(1)}%`;
          } else {
            // Hide label for <= 10%
            return "";
          }
        },
        anchor: "end", // Position the label at the end of the arc
        align: "start", // Align the label text to the start of the anchor point
        offset: 10, // Offset the label from the arc
        font: {
          weight: "bold",
          size: 12,
        },
        textShadowBlur: 4, // Add shadow for better readability on various colors
        textShadowColor: isDarkMode
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(255, 255, 255, 0.8)",
      },
    },
  };

  return (
    <div className="h-64 md:h-80">
      {" "}
      {/* Increased height for the chart container */}
      <Pie options={options} data={chartData} /> {/* Change component to Pie */}
    </div>
  );
};

export default SurnameRaceChart;
