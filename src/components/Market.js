import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Market = () => {
    const { translate } = useLanguage();
    const [cropData, setCropData] = useState({});
    const [selectedCrop, setSelectedCrop] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [chartType, setChartType] = useState('bar');
    const [isLoading, setIsLoading] = useState(false);
    const [availableCrops, setAvailableCrops] = useState([]);
    const [availableMonths, setAvailableMonths] = useState([]);

    // Load available crops on component mount
    useEffect(() => {
        const cropFiles = [
            'RICE.xlsx',
            'BANANA.xlsx',
            'COCONUT.xlsx',
            'BLACK_PEPPER.xlsx',
            'CARDAMOMS.xlsx',
            'RUBBER.xlsx',
            'COFFEE.xlsx',
            'TAPIOCA.xlsx'
        ];
        setAvailableCrops(cropFiles.map(file => file.replace('.xlsx', '').replace('.xls', '')));
    }, []);



    const loadCropData = async (cropName) => {
        setIsLoading(true);
        try {
            const fileName = `${cropName}.xlsx`;
            const response = await fetch(`/data/${fileName}`);

            if (!response.ok) {
                throw new Error(`File not found: ${fileName}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            // Get available months from sheet names
            const months = workbook.SheetNames;
            setAvailableMonths(months);

            // Load data for the first month by default
            if (months.length > 0) {
                setSelectedMonth(months[0]);
                const worksheet = workbook.Sheets[months[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const processedData = processCropData(jsonData, cropName, months[0]);
                setCropData(prev => ({
                    ...prev,
                    [cropName]: processedData
                }));
            }
        } catch (error) {
            console.error(`Error loading ${cropName} data:`, error);
            alert(`Error loading ${cropName} data. Please make sure the file exists in public/data/ folder.`);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMonthData = async (cropName, month) => {
        setIsLoading(true);
        try {
            const fileName = `${cropName}.xlsx`;
            const response = await fetch(`/data/${fileName}`);

            if (!response.ok) {
                throw new Error(`File not found: ${fileName}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const worksheet = workbook.Sheets[month];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const processedData = processCropData(jsonData, cropName, month);
            setCropData(prev => ({
                ...prev,
                [cropName]: processedData
            }));
        } catch (error) {
            console.error(`Error loading ${cropName} data for ${month}:`, error);
            alert(`Error loading ${cropName} data for ${month}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCropSelection = (cropName) => {
        setSelectedCrop(cropName);
        if (!cropData[cropName]) {
            loadCropData(cropName);
        }
    };

    const processCropData = (rawData, cropName, month) => {
        if (rawData.length < 4) return null;

        // Find the actual data header row (usually row 3 based on the analysis)
        let headerRowIndex = -1;
        let headers = [];

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (row && row.length > 0 && row[0] === 'District') {
                headerRowIndex = i;
                headers = row;
                break;
            }
        }

        if (headerRowIndex === -1) return null;

        const dataRows = rawData.slice(headerRowIndex + 1).filter(row =>
            row && row.length > 0 && row[0] && row[0] !== ''
        );

        const processedData = {
            cropName,
            month,
            headers: headers,
            data: dataRows,
            chartData: {}
        };

        // Process district-wise price data
        if (dataRows.length > 0) {
            const districts = dataRows.map(row => row[0]).filter(d => d && d !== '');
            const currentPrices = dataRows.map(row => {
                const price = row[1];
                return typeof price === 'number' ? price : parseFloat(price) || 0;
            }).filter(p => p > 0);

            const previousMonthPrices = dataRows.map(row => {
                const price = row[2];
                return typeof price === 'number' ? price : parseFloat(price) || 0;
            }).filter(p => p > 0);

            const previousYearPrices = dataRows.map(row => {
                const price = row[3];
                return typeof price === 'number' ? price : parseFloat(price) || 0;
            }).filter(p => p > 0);

            // District-wise price comparison chart
            processedData.chartData.districtPrices = {
                labels: districts.slice(0, currentPrices.length),
                datasets: [
                    {
                        label: `Current Prices (${month})`,
                        data: currentPrices,
                        backgroundColor: getRandomColor(0.6),
                        borderColor: getRandomColor(),
                        borderWidth: 1
                    },
                    {
                        label: 'Previous Month',
                        data: previousMonthPrices,
                        backgroundColor: getRandomColor(0.4),
                        borderColor: getRandomColor(),
                        borderWidth: 1
                    },
                    {
                        label: 'Previous Year',
                        data: previousYearPrices,
                        backgroundColor: getRandomColor(0.3),
                        borderColor: getRandomColor(),
                        borderWidth: 1
                    }
                ]
            };

            // Price change analysis
            const monthChange = dataRows.map(row => {
                const change = row[4];
                return typeof change === 'number' ? change : parseFloat(change) || 0;
            }).filter(c => !isNaN(c));

            const yearChange = dataRows.map(row => {
                const change = row[5];
                return typeof change === 'number' ? change : parseFloat(change) || 0;
            }).filter(c => !isNaN(c));

            processedData.chartData.priceChanges = {
                labels: districts.slice(0, monthChange.length),
                datasets: [
                    {
                        label: 'Month-over-Month Change (%)',
                        data: monthChange,
                        backgroundColor: monthChange.map(val =>
                            val >= 0 ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)'
                        ),
                        borderColor: monthChange.map(val =>
                            val >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)'
                        ),
                        borderWidth: 1
                    },
                    {
                        label: 'Year-over-Year Change (%)',
                        data: yearChange,
                        backgroundColor: yearChange.map(val =>
                            val >= 0 ? 'rgba(33, 150, 243, 0.6)' : 'rgba(255, 152, 0, 0.6)'
                        ),
                        borderColor: yearChange.map(val =>
                            val >= 0 ? 'rgba(33, 150, 243, 1)' : 'rgba(255, 152, 0, 1)'
                        ),
                        borderWidth: 1
                    }
                ]
            };
        }

        return processedData;
    };


    const getRandomColor = (alpha = 1) => {
        const colors = [
            `rgba(76, 175, 80, ${alpha})`,
            `rgba(33, 150, 243, ${alpha})`,
            `rgba(255, 152, 0, ${alpha})`,
            `rgba(156, 39, 176, ${alpha})`,
            `rgba(244, 67, 54, ${alpha})`,
            `rgba(0, 150, 136, ${alpha})`,
            `rgba(255, 193, 7, ${alpha})`,
            `rgba(63, 81, 181, ${alpha})`
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const getPieChartColors = (count) => {
        const baseColors = [
            'rgba(76, 175, 80, 0.6)',    // Green
            'rgba(33, 150, 243, 0.6)',   // Blue
            'rgba(255, 152, 0, 0.6)',    // Orange
            'rgba(156, 39, 176, 0.6)',   // Purple
            'rgba(244, 67, 54, 0.6)',    // Red
            'rgba(0, 150, 136, 0.6)',    // Teal
            'rgba(255, 193, 7, 0.6)',    // Yellow
            'rgba(63, 81, 181, 0.6)',    // Indigo
            'rgba(121, 85, 72, 0.6)',    // Brown
            'rgba(96, 125, 139, 0.6)'    // Blue Grey
        ];

        const borderColors = [
            'rgba(76, 175, 80, 1)',
            'rgba(33, 150, 243, 1)',
            'rgba(255, 152, 0, 1)',
            'rgba(156, 39, 176, 1)',
            'rgba(244, 67, 54, 1)',
            'rgba(0, 150, 136, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(63, 81, 181, 1)',
            'rgba(121, 85, 72, 1)',
            'rgba(96, 125, 139, 1)'
        ];

        return {
            backgroundColor: baseColors.slice(0, count),
            borderColor: borderColors.slice(0, count)
        };
    };

    const getChartOptions = (title) => ({
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: title,
            },
        },
        scales: chartType === 'line' ? {
            y: {
                beginAtZero: true,
            },
        } : undefined
    });

    const renderChart = () => {
        if (!selectedCrop || !cropData[selectedCrop]) return null;

        const data = cropData[selectedCrop];
        const chartData = data.chartData;

        if (chartType === 'bar' && chartData.districtPrices) {
            return (
                <Bar
                    data={chartData.districtPrices}
                    options={getChartOptions(`${selectedCrop} - District-wise Price Comparison (${data.month})`)}
                />
            );
        } else if (chartType === 'line' && chartData.priceChanges) {
            return (
                <Bar
                    data={chartData.priceChanges}
                    options={getChartOptions(`${selectedCrop} - Price Change Analysis (${data.month})`)}
                />
            );
        } else if (chartType === 'pie' && chartData.districtPrices) {
            const dataSlice = chartData.districtPrices.datasets[0].data.slice(0, 8);
            const labelsSlice = chartData.districtPrices.labels.slice(0, 8);
            const colors = getPieChartColors(dataSlice.length);

            const pieData = {
                labels: labelsSlice,
                datasets: [{
                    data: dataSlice,
                    backgroundColor: colors.backgroundColor,
                    borderColor: colors.borderColor,
                    borderWidth: 2
                }]
            };
            return (
                <Pie
                    data={pieData}
                    options={getChartOptions(`${selectedCrop} - Top Districts by Price (${data.month})`)}
                />
            );
        }

        return <div className="text-center p-4">No chart data available for this crop</div>;
    };


    return (
        <div className="container">
            <div className="card">
                <div className="card-header">
                    <h2>
                        <i className="fas fa-chart-line"></i>
                        {translate('cropMarketAnalysis')}
                    </h2>
                </div>

                <div className="p-4">
                    {/* Crop Selection Section */}
                    <div className="crop-selection-section mb-4">
                        <h3><i className="fas fa-seedling"></i> Select Crop for Market Analysis</h3>
                        <div className="crop-selection-area">
                            <div className="crop-selection mb-3">
                                <label className="form-label">Choose a crop:</label>
                                <select
                                    className="form-input"
                                    value={selectedCrop}
                                    onChange={(e) => handleCropSelection(e.target.value)}
                                    disabled={isLoading}
                                >
                                    <option value="">Select a crop...</option>
                                    {availableCrops.map(crop => (
                                        <option key={crop} value={crop}>{crop}</option>
                                    ))}
                                </select>
                            </div>

                            {isLoading && (
                                <div className="text-center p-3">
                                    <i className="fas fa-spinner fa-spin fa-2x text-primary"></i>
                                    <p className="mt-2">Loading crop data...</p>
                                </div>
                            )}

                            {/* Month Selection */}
                            {availableMonths.length > 0 && (
                                <div className="month-selection mb-3">
                                    <label className="form-label">Select Month:</label>
                                    <select
                                        className="form-input"
                                        value={selectedMonth}
                                        onChange={(e) => {
                                            setSelectedMonth(e.target.value);
                                            if (selectedCrop) {
                                                loadMonthData(selectedCrop, e.target.value);
                                            }
                                        }}
                                        disabled={isLoading}
                                    >
                                        {availableMonths.map(month => (
                                            <option key={month} value={month}>{month}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Data Visualization Section */}
                    {selectedCrop && cropData[selectedCrop] && (
                        <div className="visualization-section">
                            <h3><i className="fas fa-chart-pie"></i> {translate('dataVisualization')} - {selectedCrop}</h3>

                            {/* Chart Type Selection */}
                            <div className="chart-type-selection mb-3">
                                <label className="form-label">Chart Type:</label>
                                <div className="chart-type-buttons">
                                    <button
                                        className={`btn ${chartType === 'bar' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setChartType('bar')}
                                    >
                                        <i className="fas fa-chart-bar"></i> District Prices
                                    </button>
                                    <button
                                        className={`btn ${chartType === 'line' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setChartType('line')}
                                    >
                                        <i className="fas fa-percentage"></i> Price Changes
                                    </button>
                                    <button
                                        className={`btn ${chartType === 'pie' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setChartType('pie')}
                                    >
                                        <i className="fas fa-chart-pie"></i> Top Districts
                                    </button>
                                </div>
                            </div>

                            {/* Chart Display */}
                            <div className="chart-container">
                                {renderChart()}
                            </div>

                            {/* Data Table */}
                            {selectedCrop && cropData[selectedCrop] && (
                                <div className="data-table mt-4">
                                    <h4>Raw Data - {selectedCrop} ({cropData[selectedCrop].month})</h4>
                                    <div className="table-responsive">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    {cropData[selectedCrop].headers.map((header, index) => (
                                                        <th key={index}>{header}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cropData[selectedCrop].data.slice(0, 10).map((row, index) => (
                                                    <tr key={index}>
                                                        {row.map((cell, cellIndex) => (
                                                            <td key={cellIndex}>{cell}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Market;
