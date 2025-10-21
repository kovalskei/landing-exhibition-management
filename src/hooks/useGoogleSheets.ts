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
        
        const lines = text.split('\n');
        const newData: ExponentData = {
          price_early: lines[0]?.split(',')[1]?.trim() || DEFAULT_DATA.price_early,
          date_early: lines[1]?.split(',')[1]?.trim() || DEFAULT_DATA.date_early,
          price_regular: lines[2]?.split(',')[1]?.trim() || DEFAULT_DATA.price_regular,
          date_regular: lines[3]?.split(',')[1]?.trim() || DEFAULT_DATA.date_regular
        };
        
        setData(newData);
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
