import Papa from 'papaparse';
import type { SalesData } from '../types/commission';

interface ParseResult<T> {
  data: T[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

export const processCSVFile = async (file: File): Promise<SalesData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results: ParseResult<any>) => {
        try {
          const salesData: SalesData[] = results.data.map((row: any) => ({
            id: crypto.randomUUID(),
            repId: row.repId || '',
            repName: row.repName || '',
            repEmail: row.repEmail || '',
            businessLine: row.businessLine || 'line1',
            amount: parseFloat(row.amount) || 0,
            date: new Date(row.date),
            ...row // Include any additional fields from the CSV
          }));
          resolve(salesData);
        } catch (error) {
          reject(new Error('Error processing CSV data'));
        }
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 