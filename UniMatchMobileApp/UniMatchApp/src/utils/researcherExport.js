// src/utils/researcherExport.js
//
// Mobile replacement for the web's downloadCSV() and jsPDF export: the file
// is written to the app's document folder and handed to the system share
// sheet (save to Files / Drive, email, WhatsApp, ...).

import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

function escapeCSVValue(value) {
  const text = String(value ?? '');

  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function safeFileName(name) {
  return String(name || 'export')
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function shareFile(fileUri, mimeType, dialogTitle) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType, dialogTitle });
    return;
  }

  Alert.alert('File saved', fileUri);
}

// Same contract as the web's downloadCSV(headers, rows, filename).
// Returns true when a file was produced.
export async function shareCSV(headers, rows, filename) {
  if (!rows || rows.length === 0) {
    Alert.alert('No data', 'No data available to export.');
    return false;
  }

  try {
    const csv = [headers, ...rows].map((row) => row.map(escapeCSVValue).join(',')).join('\n');
    const fileUri = `${FileSystem.documentDirectory}${safeFileName(filename.replace(/\.csv$/i, ''))}.csv`;

    // BOM so Excel opens accented university names correctly.
    await FileSystem.writeAsStringAsync(fileUri, `\uFEFF${csv}`);
    await shareFile(fileUri, 'text/csv', 'Export CSV');
    return true;
  } catch (error) {
    Alert.alert('Export failed', error?.message || 'Could not export CSV.');
    return false;
  }
}

// Renders an HTML document to a PDF file and opens the share sheet.
export async function sharePdfFromHtml(html, filename) {
  const { uri } = await Print.printToFileAsync({ html });
  const target = `${FileSystem.documentDirectory}${safeFileName(filename.replace(/\.pdf$/i, ''))}.pdf`;

  try {
    await FileSystem.deleteAsync(target, { idempotent: true });
    await FileSystem.moveAsync({ from: uri, to: target });
  } catch {
    // Keep the temporary file name if the move fails; it is still shareable.
    await shareFile(uri, 'application/pdf', 'Export PDF');
    return;
  }

  await shareFile(target, 'application/pdf', 'Export PDF');
}
