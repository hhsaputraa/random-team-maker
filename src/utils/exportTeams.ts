import { Team } from '@/types/team';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToExcel(teams: Team[], filename: string = 'teams') {
  const workbook = XLSX.utils.book_new();

  // Gather all members with their team information
  const allMembers = teams.flatMap(team =>
    team.members.map(member => ({
      name: member.name,
      teamId: team.id
    }))
  );

  // Sort members alphabetically by name
  const sortedMembers = allMembers.sort((a, b) => a.name.localeCompare(b.name));

  // Prepare attendance-style worksheet
  const attendanceData = [
    ['No', 'Nama Lengkap', 'Tim', 'Tanda Tangan']
  ];

  sortedMembers.forEach((member, index) => {
    attendanceData.push([
      (index + 1).toString(),
      member.name,
      `Tim ${member.teamId}`,
      '' // Empty cell for signature
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(attendanceData);

  // Set column widths for readability
  worksheet['!cols'] = [
    { width: 5 }, // No
    { width: 30 }, // Nama Lengkap
    { width: 10 }, // Tim
    { width: 25 }  // Tanda Tangan
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kehadiran');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(teams: Team[], filename: string = 'teams') {
  const csvData = [
    ['Tim', 'No', 'Nama', 'Perusahaan']
  ];
  
  teams.forEach(team => {
    const sortedMembers = [...team.members].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    sortedMembers.forEach((member, index) => {
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
  doc.setFontSize(12);
  const gameInfo = [
    'Tim 1 sampai 4: Game pertama',
    'Tim 5 sampai 9: Game kedua',
    'Tim 10 sampai 14: Game ketiga',
    'Tim 15 sampai 19: Game keempat'
  ];
  let infoY = 32;
  gameInfo.forEach(line => {
    doc.text(line, 14, infoY);
    infoY += 6;
  });

  let yPosition = infoY + 10;
  
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
    const sortedMembers = [...team.members].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const tableData = sortedMembers.map((member, index) => [
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

    const autoTableDoc = doc as jsPDF & { lastAutoTable: { finalY: number } };
    yPosition = autoTableDoc.lastAutoTable.finalY + 20;
  });
  
  doc.save(`${filename}.pdf`);
}