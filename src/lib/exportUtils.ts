import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ExamResult } from '@/types';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const exportToExcel = (data: ExamResult[], fileName: string, title: string) => {
    const worksheetData = data.map((item, index) => ({
        'No': index + 1,
        'Öğrenci No': item.student_number || '',
        'Sınıf': item.student_class || '',
        'Ad Soyad': item.student_name || '',
        'Sınav Adı': item.exam_name || '',
        'Puan': item.total_score || 0,
        'Yüzdelik': item.percentile || 0,
        'Top. Doğru': item.total_correct || 0,
        'Top. Yanlış': item.total_wrong || 0,
        'Top. Net': item.total_net || 0,
        'Türkçe D': item.turkish_correct || 0,
        'Türkçe Y': item.turkish_wrong || 0,
        'Türkçe N': item.turkish_net || 0,
        'Matematik D': item.math_correct || 0,
        'Matematik Y': item.math_wrong || 0,
        'Matematik N': item.math_net || 0,
        'Fen D': item.science_correct || 0,
        'Fen Y': item.science_wrong || 0,
        'Fen N': item.science_net || 0,
        'Sosyal D': item.social_correct || 0,
        'Sosyal Y': item.social_wrong || 0,
        'Sosyal N': item.social_net || 0,
        'İngilizce D': item.english_correct || 0,
        'İngilizce Y': item.english_wrong || 0,
        'İngilizce N': item.english_net || 0,
        'Din D': item.religion_correct || 0,
        'Din Y': item.religion_wrong || 0,
        'Din N': item.religion_net || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sonuçlar');

    // Set column widths
    const wscols = [
        { wch: 4 },  // No
        { wch: 12 }, // Öğrenci No
        { wch: 8 },  // Sınıf
        { wch: 25 }, // Ad Soyad
        { wch: 25 }, // Sınav Adı
        { wch: 8 },  // Puan
        { wch: 10 }, // Yüzdelik
        { wch: 10 }, // Top. Doğru
        { wch: 10 }, // Top. Yanlış
        { wch: 10 }, // Top. Net
    ];
    worksheet['!cols'] = wscols;

    const fullFileName = `${fileName}.xlsx`;

    if (Capacitor.isNativePlatform()) {
        const excelBase64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        saveAndShareFile(excelBase64, fullFileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else {
        XLSX.writeFile(workbook, fullFileName);
    }
};

export const exportToPDF = (data: ExamResult[], fileName: string, title: string, subtitle?: string) => {
    const doc = new jsPDF('landscape');

    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 15);

    if (subtitle) {
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(subtitle, 14, 22);
    }

    const tableColumn = [
        "No", "Sınıf", "Ad Soyad", "Sınav", "Puan", "Tür. N", "Mat. N", "Fen. N", "Sos. N", "İng. N", "Din. N", "Top. N"
    ];

    const tableRows = data.map((item, index) => [
        index + 1,
        item.student_class || '',
        item.student_name || '',
        item.exam_name || '',
        item.total_score || 0,
        item.turkish_net || 0,
        item.math_net || 0,
        item.science_net || 0,
        item.social_net || 0,
        item.english_net || 0,
        item.religion_net || 0,
        item.total_net || 0,
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: subtitle ? 28 : 22,
        theme: 'grid',
        styles: { fontSize: 8, font: 'helvetica' },
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
    });

    const fullFileName = `${fileName}.pdf`;

    if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        saveAndShareFile(pdfBase64, fullFileName, 'application/pdf');
    } else {
        doc.save(fullFileName);
    }
};

const saveAndShareFile = async (base64: string, fileName: string, mimeType: string) => {
    try {
        const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
        });

        await Share.share({
            title: fileName,
            text: fileName,
            url: result.uri,
            dialogTitle: 'Dosyayı Paylaş / Kaydet',
        });
    } catch (error) {
        console.error('Dosya işlemi başarısız:', error);
        alert('Dosya oluşturulamadı veya paylaşılamadı.');
    }
};
