# Crop Data Files

Place your Excel files (.xlsx or .xls) in this folder with the following naming convention:

- Rice.xlsx
- Banana.xlsx
- Coconut.xlsx
- Wheat.xlsx
- Corn.xlsx
- Potato.xlsx
- Tomato.xlsx
- Onion.xlsx
- Sugarcane.xlsx
- Cotton.xlsx

## Excel File Format

Your Excel files should have:

- First row as headers (e.g., Date, Price, Yield, Production, etc.)
- Data rows with corresponding values
- The system will automatically detect columns containing:
  - "price" or "rate" for price data
  - "yield" or "production" for yield data
  - "date", "month", or "year" for time series data

## Example Structure

| Date    | Price (₹/kg) | Yield (tons/hectare) | Production (tons) |
| ------- | ------------ | -------------------- | ----------------- |
| 2024-01 | 45.50        | 3.2                  | 1200              |
| 2024-02 | 47.20        | 3.5                  | 1300              |
| 2024-03 | 44.80        | 3.1                  | 1150              |

The system will automatically create charts based on the available data columns.
