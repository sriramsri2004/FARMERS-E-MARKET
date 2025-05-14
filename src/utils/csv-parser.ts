
export interface MarketPriceData {
  name: string;
  category: string;
  price: number;
}

export const parseCSV = (csvText: string): MarketPriceData[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].toLowerCase().split(',');
  
  const requiredColumns = ['name', 'category', 'price'];
  const hasRequiredColumns = requiredColumns.every(col => 
    headers.includes(col.toLowerCase())
  );
  
  if (!hasRequiredColumns) {
    throw new Error('CSV must include name, category, and price columns');
  }
  
  const nameIndex = headers.indexOf('name');
  const categoryIndex = headers.indexOf('category');
  const priceIndex = headers.indexOf('price');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',');
      const price = parseFloat(values[priceIndex]);
      
      if (isNaN(price) || price < 0) {
        throw new Error('Invalid price value found in CSV');
      }
      
      return {
        name: values[nameIndex].trim(),
        category: values[categoryIndex].trim(),
        price
      };
    });
};
