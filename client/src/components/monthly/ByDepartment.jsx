import React, { useState, useEffect, useRef } from "react";
import ByProductCategory from "./ByProductCategory";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar, getElementAtEvent } from "react-chartjs-2";
import { baseColors } from "theme";
import FlexBetween from "components/FlexBetween";
import {
  Box,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
Chart.register(ChartDataLabels);
const ByDepartment = ({ originalData, storeNameValue, onBackButtonClick }) => {
  const [groupedData, setGroupedData] = useState([]);
  const chartRef = useRef(null);
  const [departmentNameValue, setDepartmentNameValue] = useState([]);
  const theme = useTheme();
  useEffect(() => {
    // Grouping and summing logic
    const groupData = () => {
      if (!Array.isArray(originalData) || !originalData.length) {
        console.log("Not an array or empty");
        return;
      }

      // Filter data for the selected store
      const filteredData = originalData.filter(
        (item) => item.StoreName === storeNameValue
      );

      // Group data month-wise and by department for the selected store
      const groupedData = filteredData.reduce((accumulator, item) => {
        const storeKey = item.StoreName;
        const departmentKey = item.Department;
        const monthKey = new Date(item.BillDate).toLocaleString("en-US", {
          month: "long",
        });

        // Create a unique key for each store, department, and month combination
        const key = `${storeKey}-${departmentKey}-${monthKey}`;

        if (!accumulator[key]) {
          accumulator[key] = {
            StoreName: storeKey,
            Department: departmentKey,
            Month: monthKey,
            Quantity: 0,
            Amount: 0,
          };
        }

        accumulator[key].Quantity += item.Quantity || 0;
        accumulator[key].Amount += item.Amount || 0;

        return accumulator;
      }, {});

      const groupedArray = Object.values(groupedData);

      setGroupedData(groupedArray);
    };

    // Call the grouping logic when the original data or labelvalue changes
    groupData();
  }, [originalData, storeNameValue]);

  // console.log(groupedData);

  const totalAmountByMonth = {};

  groupedData.forEach((item) => {
    const month = item.Month;

    if (!totalAmountByMonth[month]) {
      totalAmountByMonth[month] = 0;
    }

    totalAmountByMonth[month] += item.Amount || 0;
  });

  // Render total amounts for each month
  const renderTotalAmounts = () => {
    return Object.entries(totalAmountByMonth).map(([month, amount]) => (
      <FlexBetween key={month} gap="1.2rem">
        <Typography variant="h5">{month}</Typography>
        <Typography  variant="h6"
                  sx={{ color: theme.palette.secondary.light }}>
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0, // Remove decimal part
            minimumFractionDigits: 0, // Ensure at least 0 decimal places
            useGrouping: true, // Enable grouping separator
          }).format(amount)}
        </Typography>
      </FlexBetween>
    ));
  };

  console.log(totalAmountByMonth);
  const handleSortClick = () => {
    // Sort the data based on the "Amount" property
    const newSortedData = groupedData
      .slice()
      .sort((a, b) => b.Amount - a.Amount);

    // Update the state to trigger a re-render with the sorted data
    setGroupedData(newSortedData);
  };
  const [conditiondepart, setConditiondepart] = useState(false);
  const handleBackButtonClick_Department = () => {
    setConditiondepart(false); // Set condition to null when back button is clicked
  };
  const handleClick = (e) => {
    const currindex = getElementAtEvent(chartRef.current, e)[0].index;
    const currdatasetIndex = getElementAtEvent(chartRef.current, e)[0]
      .datasetIndex;
    const labels = chartRef.current.data.labels;
    const month = labels[currindex];
    const datasets = chartRef.current.data.datasets;
    const departmentName = datasets[currdatasetIndex].label;
    console.log("Clicked values", month, departmentName);
    //  setMonthNameValue(month)
    setDepartmentNameValue(departmentName);
    setConditiondepart(true);
  };
  useEffect(() => {
    // console.log("Labelvalue", departmentNameValue);
  }, [departmentNameValue]);
  const handleBackButtonClick = () => {
    onBackButtonClick();
  };
 
  const uniqueMonths = [...new Set(groupedData.map((item) => item.Month))];
  const uniqueDepartments = [
    ...new Set(groupedData.map((item) => item.Department)),
  ];
  const datasets = uniqueDepartments.map((department, index) => ({
    label: department,
    data: uniqueMonths.map((month) => {
      const dataPoint = groupedData.find(
        (item) => item.Month === month && item.Department === department
      );
      return dataPoint ? dataPoint.Amount : 0;
    }),
    backgroundColor: baseColors[index + 1],
    borderColor: "rgba(75, 192, 192, 1)",
    borderWidth: 1,
  }));
  const totalAmount = groupedData.reduce(
    (sum, item) => sum + Math.round(parseFloat(item.Amount)),
    0
  );
  const formattedTotalAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0, // Remove decimal part
    minimumFractionDigits: 0, // Ensure at least 0 decimal places
    useGrouping: true, // Enable grouping separator
  }).format(totalAmount);
  const barChart = groupedData[0] ? (
    <Bar
      data={{
        labels: uniqueMonths,
        datasets: datasets,
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 30,
              font: {
                size: 8,
              },
              color: "white",
            }
          },
          datalabels: {
            display: true,
            color: "white",
            font: { size: "10" },
            formatter: Math.round,
            anchor: "end",
            offset: -20,
            align: "start",
          },
          title: {
            display: true,
            text: `Total Forecasted Sales of ${storeNameValue} By Department`,
            color: "white",
            font: { size: "10" },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: theme.palette.secondary[200],
              font: { size: "10" },
              maxRotation: 90, // Set maxRotation to 90 degrees for vertical ticks
              
            },
            gridLines: {
              color: "red",
            },
            axisColor: "rgb(255, 99, 132)",
          },
          y: {
            grid: {
              display: false,
            },
            gridLines: {
              color: "red",
            },
            ticks: {
              color: theme.palette.secondary[200],
              font: { size: "10" },
              maxRotation: 90, // Set maxRotation to 90 degrees for vertical ticks
              minRotation: 90,
            },
            axisColor: "rgb(255, 99, 132)",
          },
        },
      }}
      ref={chartRef}
      onClick={handleClick}
    />
  ) : null;
  return (
    <div>
      {conditiondepart ? (
        <ByProductCategory
          originalData={originalData}
          storeNameValue={storeNameValue}
          departmentNameValue={departmentNameValue}
          handleBackButtonClick_Department={handleBackButtonClick_Department}
        />
      ) : (
        <Box
        mt="20px"
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="auto" // Adjust the row size as needed
        gap="20px"
      >
        <Box
          gridColumn="span 12"
          gridRow="span 1"
          display="flex"
          justifyContent="space-between"
          borderRadius="0.55rem"
        >
          <div>
            <Button
              variant="contained"
              onClick={handleSortClick}
              style={{ marginRight: "8px" }}
            >
              Sort
            </Button>
            <Button variant="contained" onClick={handleBackButtonClick}>
              Back
            </Button>
          </div>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            backgroundColor={theme.palette.background.alt}
            borderRadius="0.55rem"
            p=".2rem .5rem"
          >
            <FlexBetween gap="1.2rem">
              <Typography variant="h4">Overall Sales: </Typography>
              <Typography
                variant="h5"
                sx={{ color: theme.palette.secondary.light }}
              >
               {formattedTotalAmount}
              </Typography>
            </FlexBetween>
          </Box>
        </Box>
        <Box
          gridColumn="span 12"
          gridRow="span 2"
          backgroundColor={theme.palette.background.alt}
          p=".2rem"
          borderRadius="0.55rem"
          sx={{ height: "80vh", width: "100%"}}
        >
          {barChart}
        </Box>
        <Box
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              backgroundColor={theme.palette.background.alt}
              borderRadius="0.55rem"
              p=".2rem .5rem"
              marginBottom={5}
            >
            {renderTotalAmounts()}
          </Box>
      </Box>
      )}
    </div>
  );
};

export default ByDepartment;
