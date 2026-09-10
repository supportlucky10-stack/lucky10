import { captureAndShareElement } from './shareUtils';
import type { PlacedTicket } from '../types';

/**
 * Threshold for switching to PDF:
 * Any bill with more than 40 items will exceed safe canvas heights on mobile WebKit (4096px limit).
 * Normal bills (<= 40 items) use the existing image capture method untouched.
 */
export const LONG_BILL_THRESHOLD_ITEMS = 40;

const formatPlacedAtDate = (str?: string): string => {
  if (!str) return '';
  const clean = str.trim();
  const match = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, yyyy, mmStr, ddStr, hStr, mStr, sStr] = match;
    const dd = ddStr.padStart(2, '0');
    const mm = mmStr.padStart(2, '0');
    const rawH = parseInt(hStr, 10);
    const ampm = rawH >= 12 ? 'PM' : 'AM';
    const hh = String(rawH % 12 || 12).padStart(2, '0');
    const min = mStr || '00';
    const ss = sStr || '00';
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss} ${ampm}`;
  }
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})[T\s]?(\d{2})?:?(\d{2})?:?(\d{2})?\s*(AM|PM)?/i);
  if (dmyMatch) {
    const [, ddStr, mmStr, yyStr, hStr, mStr, sStr, ampmStr] = dmyMatch;
    const dd = ddStr.padStart(2, '0');
    const mm = mmStr.padStart(2, '0');
    const yyyy = yyStr.length === 2 ? `20${yyStr}` : yyStr;
    const rawH = hStr ? parseInt(hStr, 10) : 0;
    const ampm = ampmStr ? ampmStr.toUpperCase() : (rawH >= 12 ? 'PM' : 'AM');
    const hh = String(rawH % 12 || (rawH === 0 ? 12 : rawH)).padStart(2, '0');
    const min = mStr || '00';
    const ss = sStr || '00';
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss} ${ampm}`;
  }
  const d = new Date(clean);
  if (isNaN(d.getTime())) return str;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const rawH = d.getHours();
  const ampm = rawH >= 12 ? 'PM' : 'AM';
  const hh = String(rawH % 12 || 12).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss} ${ampm}`;
};

const getDisplayGame = (item: { number?: string; type?: string }): string => {
  const num = item.number || '';
  if (num.includes(':')) {
    return num.split(':')[0].toUpperCase();
  }
  const typeStr = (item.type || '').toUpperCase();
  if (typeStr === 'DIRECT' || typeStr === 'SUPER') return 'SUPER';
  if (typeStr === 'SHUFFLE' || typeStr === 'BOX') return 'BOX';
  if (['AB', 'BC', 'AC', 'A', 'B', 'C'].includes(typeStr)) return typeStr;
  if (num.length === 1) return 'A';
  if (num.length === 2) return 'AB';
  return item.type || 'SUPER';
};

const getDisplayNumber = (item: { number?: string; type?: string }): string => {
  const num = item.number || '';
  if (num.includes(':')) {
    return num.split(':')[1];
  }
  return num;
};

const escapePdfText = (text?: string): string => {
  if (!text) return '';
  return String(text)
    .replace(/₹/g, 'Rs. ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
};

/**
 * Builds a multi-page PDF in standard PDF 1.4 format without external dependencies.
 * Uses standard Helvetica and Courier fonts with WinAnsiEncoding which render across all PDF viewers and mobile devices.
 */
export const buildBillPdfBlob = (ticket: PlacedTicket, agencyNameFallback?: string): Blob => {
  const items = ticket.items || [];
  const ticketId = ticket.id || (ticket as any).ticketId || '';
  const rawPlacedAt = ticket.placedAt || (ticket as any).createdAt || '';
  const placedAtStr = formatPlacedAtDate(rawPlacedAt) || new Date().toLocaleString();
  const agency = (ticket as any).agencyName || (ticket as any).userName || agencyNameFallback || 'Agency';
  const rawCustomer = (ticket as any).customerName || '';
  const customer = rawCustomer && rawCustomer.toLowerCase() !== 'customer' ? rawCustomer.trim() : '';
  const slot = (ticket.gameSlot || '').replace(/\s*Game$/i, '');
  const totalAmount = ticket.totalAmount || 0;

  // A4 geometry (points): 595.28 x 841.89
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const leftX = 36;
  const rightX = 559;
  const contentWidth = rightX - leftX; // 523 pt
  const rowHeight = 18;

  // Pagination bounds:
  // Page 1 header box (75 pt) + info bar (24 pt) + gap + table header (22 pt) = ~135 pt
  // Maximum rows on Page 1 = 30 rows
  const p1MaxItems = 30;
  // Subsequent pages running header (24 pt) + table header (22 pt) = ~55 pt
  // Maximum rows on subsequent pages = 34 rows
  const subPageMaxItems = 34;

  const pagesItems: (typeof items)[] = [];
  if (items.length <= p1MaxItems) {
    pagesItems.push(items);
  } else {
    pagesItems.push(items.slice(0, p1MaxItems));
    let currentIdx = p1MaxItems;
    while (currentIdx < items.length) {
      pagesItems.push(items.slice(currentIdx, currentIdx + subPageMaxItems));
      currentIdx += subPageMaxItems;
    }
  }

  const totalPages = pagesItems.length;
  const pageStreams: string[] = [];

  pagesItems.forEach((pItems, pageIndex) => {
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === totalPages - 1;
    const pageNum = pageIndex + 1;
    let stream = '';

    // Page Background (White)
    stream += '1 1 1 rg 0 0 595.28 841.89 re f\n';

    let currentY = 806;

    if (isFirstPage) {
      // ── Page 1 Main Header Box ──
      const headerH = 75;
      const headerY = currentY - headerH;
      // Dark Header Box
      stream += `0.05 0.05 0.05 rg ${leftX} ${headerY} ${contentWidth} ${headerH} re f\n`;
      // Gold top accent line
      stream += `0.85 0.70 0.20 rg ${leftX} ${currentY - 4} ${contentWidth} 4 re f\n`;

      // Title: BILL RECEIPT
      stream += `BT /F2 14 Tf 0.85 0.70 0.20 rg ${leftX + 14} ${headerY + 48} Td (BILL RECEIPT) Tj ET\n`;

      // Bill ID
      stream += `BT /F2 11 Tf 1 1 1 rg ${leftX + 14} ${headerY + 28} Td (BILL ID: ) Tj ET\n`;
      stream += `BT /F3 13 Tf 0.95 0.80 0.30 rg ${leftX + 70} ${headerY + 27} Td (${escapePdfText(ticketId)}) Tj ET\n`;

      // Date & Time
      stream += `BT /F1 9 Tf 0.8 0.8 0.8 rg ${leftX + 300} ${headerY + 48} Td (DATE & TIME: ${escapePdfText(placedAtStr)}) Tj ET\n`;

      currentY = headerY - 6;

      // ── Info Bar (Agency / Customer / Slot) ──
      const infoH = 24;
      const infoY = currentY - infoH;
      stream += `0.94 0.94 0.94 rg ${leftX} ${infoY} ${contentWidth} ${infoH} re f\n`;
      stream += `0.8 0.8 0.8 RG 0.5 w ${leftX} ${infoY} ${contentWidth} ${infoH} re S\n`;

      stream += `BT /F2 9 Tf 0.2 0.2 0.2 rg ${leftX + 10} ${infoY + 7} Td (Agency: ) Tj ET\n`;
      stream += `BT /F2 9 Tf 0 0 0 rg ${leftX + 55} ${infoY + 7} Td (${escapePdfText(agency)}) Tj ET\n`;

      if (customer) {
        stream += `BT /F2 9 Tf 0.2 0.2 0.2 rg ${leftX + 200} ${infoY + 7} Td (Customer: ) Tj ET\n`;
        stream += `BT /F2 9 Tf 0 0 0 rg ${leftX + 252} ${infoY + 7} Td (${escapePdfText(customer)}) Tj ET\n`;
        stream += `BT /F2 9 Tf 0.2 0.2 0.2 rg ${leftX + 400} ${infoY + 7} Td (Slot: ) Tj ET\n`;
        stream += `BT /F2 9 Tf 0 0 0 rg ${leftX + 430} ${infoY + 7} Td (${escapePdfText(slot)}) Tj ET\n`;
      } else {
        stream += `BT /F2 9 Tf 0.2 0.2 0.2 rg ${leftX + 360} ${infoY + 7} Td (Slot: ) Tj ET\n`;
        stream += `BT /F2 9 Tf 0 0 0 rg ${leftX + 390} ${infoY + 7} Td (${escapePdfText(slot)}) Tj ET\n`;
      }

      currentY = infoY - 8;
    } else {
      // ── Subsequent Pages Running Header ──
      const runH = 24;
      const runY = currentY - runH;
      stream += `0.1 0.1 0.1 rg ${leftX} ${runY} ${contentWidth} ${runH} re f\n`;
      stream += `BT /F2 9.5 Tf 1 1 1 rg ${leftX + 10} ${runY + 7} Td (BILL ID: ${escapePdfText(ticketId)}  |  Agency: ${escapePdfText(agency)}  |  Slot: ${escapePdfText(slot)}) Tj ET\n`;
      currentY = runY - 6;
    }

    // ── Table Column Headers Bar ──
    const tblHdrH = 22;
    const tblHdrY = currentY - tblHdrH;
    stream += `0.92 0.88 0.92 rg ${leftX} ${tblHdrY} ${contentWidth} ${tblHdrH} re f\n`;
    stream += `0.8 0.75 0.8 RG 0.5 w ${leftX} ${tblHdrY} ${contentWidth} ${tblHdrH} re S\n`;

    stream += `BT /F2 9 Tf 0.1 0.1 0.1 rg ${leftX + 15} ${tblHdrY + 6} Td (GAME) Tj ET\n`;
    stream += `BT /F2 9 Tf 0.1 0.1 0.1 rg ${leftX + 160} ${tblHdrY + 6} Td (NUMBER) Tj ET\n`;
    stream += `BT /F2 9 Tf 0.1 0.1 0.1 rg ${leftX + 310} ${tblHdrY + 6} Td (COUNT) Tj ET\n`;
    stream += `BT /F2 9 Tf 0.1 0.1 0.1 rg ${leftX + 450} ${tblHdrY + 6} Td (AMOUNT) Tj ET\n`;

    currentY = tblHdrY;

    // ── Table Rows ──
    pItems.forEach((item, rIdx) => {
      const rowY = currentY - rowHeight;
      const isAlt = rIdx % 2 === 1;

      // Row Background
      if (isAlt) {
        stream += `0.97 0.97 0.97 rg ${leftX} ${rowY} ${contentWidth} ${rowHeight} re f\n`;
      } else {
        stream += `1 1 1 rg ${leftX} ${rowY} ${contentWidth} ${rowHeight} re f\n`;
      }
      stream += `0.88 0.88 0.88 RG 0.4 w ${leftX} ${rowY} ${contentWidth} 0 re S\n`;

      const gType = getDisplayGame(item);
      const numStr = getDisplayNumber(item);
      const cntStr = String(item.count || '');
      const amtStr = `Rs. ${item.totalAmount || 0}`;

      stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${leftX + 15} ${rowY + 5} Td (${escapePdfText(gType)}) Tj ET\n`;
      stream += `BT /F3 9.5 Tf 0 0 0 rg ${leftX + 160} ${rowY + 5} Td (${escapePdfText(numStr)}) Tj ET\n`;
      stream += `BT /F2 9 Tf 0 0 0 rg ${leftX + 310} ${rowY + 5} Td (${escapePdfText(cntStr)}) Tj ET\n`;
      stream += `BT /F2 9 Tf 0 0 0 rg ${leftX + 450} ${rowY + 5} Td (${escapePdfText(amtStr)}) Tj ET\n`;

      currentY = rowY;
    });

    // ── Total Amount Box (on final page) ──
    if (isLastPage) {
      currentY -= 6;
      const totH = 28;
      const totY = currentY - totH;
      stream += `0.08 0.08 0.08 rg ${leftX} ${totY} ${contentWidth} ${totH} re f\n`;
      stream += `0.85 0.70 0.20 RG 1 w ${leftX} ${totY} ${contentWidth} ${totH} re S\n`;

      stream += `BT /F2 10.5 Tf 1 1 1 rg ${leftX + 14} ${totY + 9} Td (TOTAL AMOUNT) Tj ET\n`;
      stream += `BT /F2 12 Tf 0.95 0.80 0.20 rg ${leftX + 420} ${totY + 8} Td (Rs. ${escapePdfText(String(totalAmount))}) Tj ET\n`;
    }

    // ── Footer (Page X of Y) ──
    stream += `0.8 0.8 0.8 RG 0.5 w ${leftX} 45 ${contentWidth} 0 re S\n`;
    const footerText = `Page ${pageNum} of ${totalPages}`;
    stream += `BT /F1 8 Tf 0.5 0.5 0.5 rg 270 32 Td (${escapePdfText(footerText)}) Tj ET\n`;

    pageStreams.push(stream);
  });

  // Assemble the complete PDF deterministically
  const encoder = new TextEncoder();
  const pageObjIds: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    pageObjIds.push(6 + i * 2 + 1);
  }
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');

  const objects: string[] = [];
  // Object 1: Catalog
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  // Object 2: Pages
  objects.push(`<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>`);
  // Object 3: F1 (Helvetica)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  // Object 4: F2 (Helvetica-Bold)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  // Object 5: F3 (Courier-Bold)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>');

  pageStreams.forEach((stream, i) => {
    const streamBytes = encoder.encode(stream);
    const streamObjId = 6 + i * 2;

    // Stream object
    objects.push(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`);
    // Page object
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${streamObjId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> /ProcSet [/PDF /Text] >> >>`
    );
  });

  let output = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [];

  objects.forEach((obj, idx) => {
    const objNum = idx + 1;
    offsets.push(encoder.encode(output).length);
    output += `${objNum} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(output).length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    output += `${String(off).padStart(10, '0')} 00000 n \n`;
  });

  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([encoder.encode(output)], { type: 'application/pdf' });
};

/**
 * Shares a bill:
 * - If bill items <= LONG_BILL_THRESHOLD_ITEMS and height is within limits:
 *   uses the exact existing image sharing method untouched.
 * - If bill items > LONG_BILL_THRESHOLD_ITEMS:
 *   generates complete multi-page PDF and shares using native share or download + WhatsApp.
 */
export const shareBill = async (
  ticket: PlacedTicket,
  elementId: string,
  agencyNameFallback?: string
): Promise<void> => {
  const items = ticket.items || [];
  const containerElem = typeof document !== 'undefined' ? document.getElementById(elementId) : null;
  const isTooTall = containerElem ? containerElem.scrollHeight > 1600 : false;

  // ── NORMAL / SMALL BILL: Use EXACT existing implementation untouched ──
  if (items.length <= LONG_BILL_THRESHOLD_ITEMS && !isTooTall) {
    return captureAndShareElement({
      elementId,
      fileName: `bill_${ticket.id}.jpg`,
      title: `Bill Details - ${ticket.id}`,
      textSummary: '',
    });
  }

  // ── VERY LONG BILL ONLY: Automatic Multi-Page PDF Fallback ──
  try {
    const pdfBlob = buildBillPdfBlob(ticket, agencyNameFallback);
    const pdfFileName = `bill_${ticket.id}.pdf`;
    const pdfFile = new File([pdfBlob], pdfFileName, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });

    // 1. Try mobile Web Share API for direct WhatsApp / PDF Sharing
    if (typeof navigator !== 'undefined' && navigator.share) {
      let canShareFiles = false;
      try {
        if (navigator.canShare) {
          canShareFiles = navigator.canShare({ files: [pdfFile] });
        } else {
          canShareFiles = true;
        }
      } catch {
        canShareFiles = false;
      }

      if (canShareFiles) {
        try {
          await navigator.share({
            files: [pdfFile],
          });
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return;
          try {
            await navigator.share({
              title: ' ',
              files: [pdfFile],
            });
            return;
          } catch (retryErr: any) {
            if (retryErr?.name === 'AbortError') return;
          }
        }
      }
    }

    // 2. Fallback for desktop browsers or when native file share is unsupported:
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.download = pdfFileName;
    link.href = downloadUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const waUrl = isMobile ? 'whatsapp://send' : 'https://web.whatsapp.com';
    window.open(waUrl, '_blank');
  } catch (pdfErr) {
    console.error('Failed to generate or share bill PDF:', pdfErr);
  }
};

export interface WinningReportPdfData {
  slotFilter: string;
  fromDate: string;
  toDate: string;
  agencyName: string;
  winningTotalCount: number;
  winningGrandTotal: number;
  categories: Array<{
    category: string;
    cards: Array<{
      id?: string;
      ticketId?: string;
      userName?: string;
      agencyName?: string;
      customerName?: string;
      prize?: string;
      number?: string;
      count?: number;
      total?: number;
      slot?: string;
      type?: string;
      gameMode?: string;
      playMode?: string;
      placedAt?: string;
    }>;
  }>;
}

/**
 * Builds a multi-page Winning Report PDF in standard PDF 1.4 format.
 * Renders header, date range, slot filter, totals, and all winning categories cleanly.
 */
export const buildWinningReportPdfBlob = (data: WinningReportPdfData): Blob => {
  const slotFilter = data.slotFilter || 'ALL';
  const fromDate = data.fromDate || '';
  const toDate = data.toDate || '';
  const dateRangeStr = fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;
  const agencyName = data.agencyName || 'Agency';
  const nowStr = formatPlacedAtDate(new Date().toISOString()) || new Date().toLocaleString();
  const totalWinnersCount = data.winningTotalCount || 0;
  const grandTotalAmount = data.winningGrandTotal || 0;

  // Flatten categories into rows
  const items: Array<{
    category: string;
    prize: string;
    number: string;
    count: number;
    total: number;
    ticketId: string;
    customerName: string;
    slot: string;
  }> = [];

  (data.categories || []).forEach((cat) => {
    (cat.cards || []).forEach((card) => {
      items.push({
        category: cat.category || card.gameMode || card.type || 'SUPER',
        prize: card.prize || 'WINNER',
        number: card.number || '',
        count: card.count || 1,
        total: card.total || 0,
        ticketId: card.ticketId || '',
        customerName: card.customerName || '',
        slot: (card.slot || '').replace(/\s*Game$/i, ''),
      });
    });
  });

  // A4 geometry: 595.28 x 841.89 pt
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const leftX = 36;
  const rightX = 559;
  const contentWidth = rightX - leftX; // 523 pt
  const rowHeight = 18;

  const p1MaxItems = 28;
  const subPageMaxItems = 34;

  const pagesItems: (typeof items)[] = [];
  if (items.length <= p1MaxItems) {
    pagesItems.push(items);
  } else {
    pagesItems.push(items.slice(0, p1MaxItems));
    let currentIdx = p1MaxItems;
    while (currentIdx < items.length) {
      pagesItems.push(items.slice(currentIdx, currentIdx + subPageMaxItems));
      currentIdx += subPageMaxItems;
    }
  }

  const totalPages = pagesItems.length;
  const pageStreams: string[] = [];

  pagesItems.forEach((pItems, pageIndex) => {
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === totalPages - 1;
    const pageNum = pageIndex + 1;
    let stream = '';

    // Page Background (White)
    stream += '1 1 1 rg 0 0 595.28 841.89 re f\n';

    let currentY = 806;

    if (isFirstPage) {
      // ── Page 1 Header Box ──
      const headerH = 68;
      const headerY = currentY - headerH;
      // Dark Header Box
      stream += `0.05 0.05 0.05 rg ${leftX} ${headerY} ${contentWidth} ${headerH} re f\n`;
      // Gold top accent
      stream += `0.85 0.70 0.20 rg ${leftX} ${currentY - 4} ${contentWidth} 4 re f\n`;

      // Title: WINNING REPORT
      stream += `BT /F2 15 Tf 0.85 0.70 0.20 rg ${leftX + 14} ${headerY + 44} Td (WINNING REPORT) Tj ET\n`;
      // Filters
      stream += `BT /F1 9 Tf 0.85 0.85 0.85 rg ${leftX + 14} ${headerY + 26} Td (SLOT: ${escapePdfText(slotFilter)}   |   DATE: ${escapePdfText(dateRangeStr)}) Tj ET\n`;
      // Agency
      stream += `BT /F1 8.5 Tf 0.7 0.7 0.7 rg ${leftX + 14} ${headerY + 11} Td (AGENCY: ${escapePdfText(agencyName)}) Tj ET\n`;
      // Timestamp
      stream += `BT /F1 8.5 Tf 0.8 0.8 0.8 rg ${leftX + 310} ${headerY + 44} Td (DATE & TIME: ${escapePdfText(nowStr)}) Tj ET\n`;

      currentY = headerY - 5;

      // ── Metric Summary Bar ──
      const metricH = 26;
      const metricY = currentY - metricH;
      stream += `0.85 0.70 0.20 rg ${leftX} ${metricY} ${contentWidth} ${metricH} re f\n`;
      stream += `0.65 0.50 0.10 RG 1 w ${leftX} ${metricY} ${contentWidth} ${metricH} re S\n`;

      stream += `BT /F2 10 Tf 0 0 0 rg ${leftX + 12} ${metricY + 8} Td (TOTAL WINNERS: ${escapePdfText(String(totalWinnersCount))}) Tj ET\n`;
      stream += `BT /F2 11 Tf 0 0 0 rg ${leftX + 320} ${metricY + 8} Td (GRAND TOTAL: Rs. ${escapePdfText(String(grandTotalAmount))}) Tj ET\n`;

      currentY = metricY - 6;
    } else {
      // ── Subsequent Pages Running Header ──
      const runH = 24;
      const runY = currentY - runH;
      stream += `0.1 0.1 0.1 rg ${leftX} ${runY} ${contentWidth} ${runH} re f\n`;
      stream += `BT /F2 9.5 Tf 1 1 1 rg ${leftX + 10} ${runY + 7} Td (WINNING REPORT  |  Slot: ${escapePdfText(slotFilter)}  |  Agency: ${escapePdfText(agencyName)}) Tj ET\n`;
      currentY = runY - 6;
    }

    // ── Table Column Headers Bar ──
    const tblHdrH = 22;
    const tblHdrY = currentY - tblHdrH;
    stream += `0.92 0.88 0.92 rg ${leftX} ${tblHdrY} ${contentWidth} ${tblHdrH} re f\n`;
    stream += `0.8 0.75 0.8 RG 0.5 w ${leftX} ${tblHdrY} ${contentWidth} ${tblHdrH} re S\n`;

    stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${leftX + 8} ${tblHdrY + 6} Td (GAME) Tj ET\n`;
    stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${leftX + 65} ${tblHdrY + 6} Td (PRIZE) Tj ET\n`;
    stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${leftX + 150} ${tblHdrY + 6} Td (NUM) Tj ET\n`;
    stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${leftX + 205} ${tblHdrY + 6} Td (CNT) Tj ET\n`;
    stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${leftX + 250} ${tblHdrY + 6} Td (WIN AMOUNT) Tj ET\n`;
    stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${leftX + 350} ${tblHdrY + 6} Td (BILL ID) Tj ET\n`;
    stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${leftX + 440} ${tblHdrY + 6} Td (CUSTOMER / SLOT) Tj ET\n`;

    currentY = tblHdrY;

    // ── Rows ──
    if (pItems.length === 0) {
      const emptyY = currentY - 26;
      stream += `BT /F1 9.5 Tf 0.4 0.4 0.4 rg ${leftX + 170} ${emptyY + 8} Td (No winning tickets found.) Tj ET\n`;
      currentY = emptyY;
    } else {
      pItems.forEach((item, rIdx) => {
        const rowY = currentY - rowHeight;
        const isAlt = rIdx % 2 === 1;

        if (isAlt) {
          stream += `0.97 0.97 0.97 rg ${leftX} ${rowY} ${contentWidth} ${rowHeight} re f\n`;
        } else {
          stream += `1 1 1 rg ${leftX} ${rowY} ${contentWidth} ${rowHeight} re f\n`;
        }
        stream += `0.88 0.88 0.88 RG 0.4 w ${leftX} ${rowY} ${contentWidth} 0 re S\n`;

        const gType = item.category;
        const prizeStr = item.prize;
        const numStr = item.number;
        const cntStr = String(item.count);
        const amtStr = `Rs. ${item.total}`;
        const billStr = item.ticketId;
        const custSlot = item.customerName ? `${item.customerName} (${item.slot})` : item.slot;

        stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${leftX + 8} ${rowY + 5} Td (${escapePdfText(gType)}) Tj ET\n`;
        stream += `BT /F2 7.5 Tf 0.2 0.5 0.2 rg ${leftX + 65} ${rowY + 5} Td (${escapePdfText(prizeStr)}) Tj ET\n`;
        stream += `BT /F3 9.5 Tf 0 0 0 rg ${leftX + 150} ${rowY + 5} Td (${escapePdfText(numStr)}) Tj ET\n`;
        stream += `BT /F2 8.5 Tf 0 0 0 rg ${leftX + 205} ${rowY + 5} Td (${escapePdfText(cntStr)}) Tj ET\n`;
        stream += `BT /F2 8.5 Tf 0.1 0.4 0.1 rg ${leftX + 250} ${rowY + 5} Td (${escapePdfText(amtStr)}) Tj ET\n`;
        stream += `BT /F3 8 Tf 0.2 0.2 0.2 rg ${leftX + 350} ${rowY + 5} Td (${escapePdfText(billStr)}) Tj ET\n`;
        stream += `BT /F1 7.5 Tf 0.3 0.3 0.3 rg ${leftX + 440} ${rowY + 5} Td (${escapePdfText(custSlot)}) Tj ET\n`;

        currentY = rowY;
      });
    }

    // ── Total Winning Payout Box (on final page) ──
    if (isLastPage) {
      currentY -= 6;
      const totH = 26;
      const totY = currentY - totH;
      stream += `0.08 0.08 0.08 rg ${leftX} ${totY} ${contentWidth} ${totH} re f\n`;
      stream += `0.85 0.70 0.20 RG 1 w ${leftX} ${totY} ${contentWidth} ${totH} re S\n`;

      stream += `BT /F2 10.5 Tf 1 1 1 rg ${leftX + 14} ${totY + 8} Td (TOTAL WINNING PAYOUT) Tj ET\n`;
      stream += `BT /F2 12 Tf 0.95 0.80 0.20 rg ${leftX + 380} ${totY + 7} Td (Rs. ${escapePdfText(String(grandTotalAmount))}) Tj ET\n`;
    }

    // ── Footer (Page X of Y) ──
    stream += `0.8 0.8 0.8 RG 0.5 w ${leftX} 40 ${contentWidth} 0 re S\n`;
    const footerText = `Page ${pageNum} of ${totalPages}`;
    stream += `BT /F1 8 Tf 0.5 0.5 0.5 rg 270 28 Td (${escapePdfText(footerText)}) Tj ET\n`;

    pageStreams.push(stream);
  });

  // Assemble the complete PDF deterministically
  const encoder = new TextEncoder();
  const pageObjIds: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    pageObjIds.push(6 + i * 2 + 1);
  }
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');

  const objects: string[] = [];
  // Object 1: Catalog
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  // Object 2: Pages
  objects.push(`<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>`);
  // Object 3: F1 (Helvetica)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  // Object 4: F2 (Helvetica-Bold)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  // Object 5: F3 (Courier-Bold)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>');

  pageStreams.forEach((stream, i) => {
    const streamBytes = encoder.encode(stream);
    const streamObjId = 6 + i * 2;

    // Stream object
    objects.push(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`);
    // Page object
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${streamObjId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> /ProcSet [/PDF /Text] >> >>`
    );
  });

  let output = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [];

  objects.forEach((obj, idx) => {
    const objNum = idx + 1;
    offsets.push(encoder.encode(output).length);
    output += `${objNum} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(output).length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    output += `${String(off).padStart(10, '0')} 00000 n \n`;
  });

  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([encoder.encode(output)], { type: 'application/pdf' });
};

/**
 * Shares the complete Winning Report as a PDF:
 * - Always generates a PDF (for both short and long reports)
 * - Shares via mobile Web Share API or download + WhatsApp Web on desktop
 */
export const shareWinningReport = async (data: WinningReportPdfData): Promise<void> => {
  try {
    const pdfBlob = buildWinningReportPdfBlob(data);
    const cleanFrom = (data.fromDate || '').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanTo = (data.toDate || '').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSlot = (data.slotFilter || 'ALL').replace(/[^a-zA-Z0-9]/g, '_');
    const pdfFileName = `winning_report_${cleanSlot}_${cleanFrom}_${cleanTo}.pdf`;
    const pdfFile = new File([pdfBlob], pdfFileName, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });

    // 1. Try mobile Web Share API for direct WhatsApp / PDF Sharing
    if (typeof navigator !== 'undefined' && navigator.share) {
      let canShareFiles = false;
      try {
        if (navigator.canShare) {
          canShareFiles = navigator.canShare({ files: [pdfFile] });
        } else {
          canShareFiles = true;
        }
      } catch {
        canShareFiles = false;
      }

      if (canShareFiles) {
        try {
          await navigator.share({
            files: [pdfFile],
          });
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return;
          try {
            await navigator.share({
              title: ' ',
              files: [pdfFile],
            });
            return;
          } catch (retryErr: any) {
            if (retryErr?.name === 'AbortError') return;
          }
        }
      }
    }

    // 2. Fallback for desktop browsers or when native file share is unsupported:
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.download = pdfFileName;
    link.href = downloadUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const waUrl = isMobile ? 'whatsapp://send' : 'https://web.whatsapp.com';
    window.open(waUrl, '_blank');
  } catch (pdfErr) {
    console.error('Failed to generate or share winning report PDF:', pdfErr);
  }
};
