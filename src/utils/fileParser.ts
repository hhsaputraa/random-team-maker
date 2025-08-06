import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Member } from '@/types/team';

export function parseCSV(file: File): Promise<Member[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const members = results.data.map((row: any) => {
            // Try different possible column names for name and company
            const name = row.name || row.Name || row.nama || row.Nama || 
                        row.full_name || row.fullName || row['Full Name'] || '';
            const company = row.company || row.Company || row.perusahaan || 
                           row.Perusahaan || row.organization || row.Organization || '';
            
            if (!name.trim() || !company.trim()) {
              throw new Error('Missing name or company data');
            }
            
            return {
              name: name.trim(),
              company: company.trim()
            };
          }).filter(member => member.name && member.company);
          
          if (members.length === 0) {
            throw new Error('No valid data found. Please ensure your file has "name" and "company" columns.');
          }
          
          resolve(members);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

export function parseExcel(file: File): Promise<Member[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const members = jsonData.map((row: any) => {
          // Try different possible column names for name and company
          const name = row.name || row.Name || row.nama || row.Nama || 
                      row.full_name || row.fullName || row['Full Name'] || '';
          const company = row.company || row.Company || row.perusahaan || 
                         row.Perusahaan || row.organization || row.Organization || '';
          
          if (!name || !company) {
            throw new Error('Missing name or company data');
          }
          
          return {
            name: String(name).trim(),
            company: String(company).trim()
          };
        }).filter(member => member.name && member.company);
        
        if (members.length === 0) {
          throw new Error('No valid data found. Please ensure your file has "name" and "company" columns.');
        }
        
        resolve(members);
      } catch (error) {
        reject(new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(file: File): Promise<Member[]> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    return parseCSV(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
  }
}