import { useState, useEffect } from 'react';

interface ExponentData {
  price_early: string;
  date_early: string;
  price_regular: string;
  date_regular: string;
}

const DEFAULT_DATA: ExponentData = {
  price_early: '180 000 р.',
  date_early: 'до 31 октября',
  price_regular: '210 000 р.',
  date_regular: 'до 14 ноября'
};

export function useGoogleSheets(sheetUrl: string) {
  const [data, setData] = useState<ExponentData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sheetUrl) {
      setData(DEFAULT_DATA);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const csvUrl = sheetUrl.replace('/edit#gid=', '/export?format=csv&gid=').replace('/edit?usp=sharing', '/export?format=csv');
        const response = await fetch(csvUrl);
        const text = await response.text();
        
        const lines = text.split('\n').map(line => line.split(',').map(cell => cell.trim()));
        
        const exponentRow = lines.find(row => row[0] === 'Экспонент');
        
        if (exponentRow && exponentRow.length >= 5) {
          const newData: ExponentData = {
            price_early: exponentRow[1] || DEFAULT_DATA.price_early,
            date_early: exponentRow[2] || DEFAULT_DATA.date_early,
            price_regular: exponentRow[3] || DEFAULT_DATA.price_regular,
            date_regular: exponentRow[4] || DEFAULT_DATA.date_regular
          };
          setData(newData);
        } else {
          setData(DEFAULT_DATA);
        }
      } catch (error) {
        console.error('Failed to load Google Sheets data:', error);
        setData(DEFAULT_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sheetUrl]);

  return { data, loading };
}