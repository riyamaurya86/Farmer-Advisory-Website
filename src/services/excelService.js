import * as XLSX from 'xlsx';

// Service to handle Excel file operations
export const excelService = {
    // Load top 10 crops data from Excel file
    loadTop10Crops: async () => {
        try {
            const response = await fetch('/data/top10_crops_kerala.xlsx');
            if (!response.ok) {
                throw new Error('Failed to fetch top10_crops_kerala.xlsx');
            }

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            // Get the first sheet (assuming it contains the top 10 crops data)
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Process the data to extract crop information
            const processedData = processTop10CropsData(jsonData);

            return {
                success: true,
                data: processedData,
                sheetName: sheetName
            };
        } catch (error) {
            console.error('Error loading top 10 crops data:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    },

    // Load market data for a specific crop
    loadCropMarketData: async (cropName) => {
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

            // Load data for the first month by default
            if (months.length > 0) {
                const worksheet = workbook.Sheets[months[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const processedData = processCropMarketData(jsonData, cropName, months[0]);

                return {
                    success: true,
                    data: processedData,
                    availableMonths: months
                };
            }

            return {
                success: false,
                error: 'No data found in Excel file',
                data: null
            };
        } catch (error) {
            console.error(`Error loading ${cropName} market data:`, error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    },

    // Get available crops from Excel files
    getAvailableCrops: () => {
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
        return cropFiles.map(file => file.replace('.xlsx', ''));
    }
};

// Helper function to process top 10 crops data
function processTop10CropsData(rawData) {
    if (!rawData || rawData.length === 0) {
        return {
            crops: [],
            summary: null
        };
    }

    // Find the header row
    let headerRowIndex = -1;
    let headers = [];

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > 0 &&
            (row[0] === 'Crop' || row[0] === 'Crop Name' || row[0] === 'Name')) {
            headerRowIndex = i;
            headers = row;
            break;
        }
    }

    if (headerRowIndex === -1) {
        // If no header found, assume first row is header or use default structure
        headers = rawData[0] || ['Crop', 'Area', 'Production', 'Yield'];
        headerRowIndex = 0;
    }

    // Extract crop data
    const dataRows = rawData.slice(headerRowIndex + 1).filter(row =>
        row && row.length > 0 && row[0] && row[0] !== ''
    );

    const crops = dataRows.map((row, index) => ({
        rank: index + 1,
        name: row[0] || `Crop ${index + 1}`,
        area: row[1] || 'N/A',
        production: row[2] || 'N/A',
        yield: row[3] || 'N/A',
        additionalInfo: row.slice(4) || []
    }));

    return {
        crops: crops.slice(0, 10), // Limit to top 10
        summary: {
            totalCrops: crops.length,
            headers: headers,
            lastUpdated: new Date().toISOString()
        }
    };
}

// Helper function to process crop market data
function processCropMarketData(rawData, cropName, month) {
    if (!rawData || rawData.length < 4) {
        return null;
    }

    // Find the actual data header row
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

    if (headerRowIndex === -1) {
        return null;
    }

    const dataRows = rawData.slice(headerRowIndex + 1).filter(row =>
        row && row.length > 0 && row[0] && row[0] !== ''
    );

    const processedData = {
        cropName,
        month,
        headers: headers,
        data: dataRows,
        summary: {
            totalDistricts: dataRows.length,
            avgPrice: calculateAveragePrice(dataRows),
            priceRange: calculatePriceRange(dataRows)
        }
    };

    return processedData;
}

// Helper function to calculate average price
function calculateAveragePrice(dataRows) {
    const prices = dataRows.map(row => {
        const price = row[1];
        return typeof price === 'number' ? price : parseFloat(price) || 0;
    }).filter(p => p > 0);

    if (prices.length === 0) return 0;
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}

// Helper function to calculate price range
function calculatePriceRange(dataRows) {
    const prices = dataRows.map(row => {
        const price = row[1];
        return typeof price === 'number' ? price : parseFloat(price) || 0;
    }).filter(p => p > 0);

    if (prices.length === 0) return { min: 0, max: 0 };

    return {
        min: Math.min(...prices),
        max: Math.max(...prices)
    };
}

export default excelService;
