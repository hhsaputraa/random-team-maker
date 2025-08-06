import { Team } from '@/types/team';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToExcel(teams: Team[], filename: string = 'teams') {
  const workbook = XLSX.utils.book_new();
  
  // Create main sheet with all team members
  const allMembersData = [
    ['Tim', 'No. Anggota', 'Nama', 'Perusahaan']
  ];
  
  teams.forEach(team => {
    team.members.forEach((member, index) => {
      allMembersData.push([
        `Tim ${team.id}`,
        (index + 1).toString(),
        member.name,
        member.company
      ]);
    });
    // Add empty row between teams for clarity
    if (team.id < teams.length) {
      allMembersData.push(['', '', '', '']);
    }
  });
  
  const allMembersSheet = XLSX.utils.aoa_to_sheet(allMembersData);
  
  // Auto-size columns
  const maxWidths = [15, 15, 30, 25];
  allMembersSheet['!cols'] = maxWidths.map(width => ({ width }));
  
  XLSX.utils.book_append_sheet(workbook, allMembersSheet, 'Semua Tim');
  
  // Create summary sheet
  const summaryData = [
    ['Tim', 'Jumlah Anggota', 'Distribusi Perusahaan'],
    ...teams.map(team => [
      `Tim ${team.id}`,
      team.members.length.toString(),
      Object.entries(team.companyDistribution)
        .filter(([_, count]) => count > 0)
        .map(([company, count]) => `${company}: ${count}`)
        .join(', ')
    ])
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ width: 10 }, { width: 15 }, { width: 40 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(teams: Team[], filename: string = 'teams') {
  const csvData = [
    ['Tim', 'No', 'Nama', 'Perusahaan']
  ];
  
  teams.forEach(team => {
    team.members.forEach((member, index) => {
      csvData.push([
        `Tim ${team.id}`,
        (index + 1).toString(),
        member.name,
        member.company
      ]);
    });
  });
  
  const csvContent = csvData.map(row => 
    row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(teams: Team[], filename: string = 'teams') {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Pembagian Tim', 14, 22);
  
  let yPosition = 40;
  
  teams.forEach((team, teamIndex) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Team header
    doc.setFontSize(16);
    doc.text(`Tim ${team.id} (${team.members.length} anggota)`, 14, yPosition);
    yPosition += 10;
    
    // Company distribution
    const distribution = Object.entries(team.companyDistribution)
      .filter(([_, count]) => count > 0)
      .map(([company, count]) => `${company}: ${count}`)
      .join(', ');
    
    doc.setFontSize(10);
    doc.text(`Distribusi: ${distribution}`, 14, yPosition);
    yPosition += 10;
    
    // Team members table
    const tableData = team.members.map((member, index) => [
      (index + 1).toString(),
      member.name,
      member.company
    ]);
    
    autoTable(doc, {
      head: [['No', 'Nama', 'Perusahaan']],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  });
  
  doc.save(`${filename}.pdf`);
}