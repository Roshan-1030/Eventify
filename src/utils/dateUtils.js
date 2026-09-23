/**
 * Universal date formatting utilities.
 * Ensures all dates across the app strictly follow the DD/MM/YYYY format.
 */

/**
 * Formats any date input (YYYY-MM-DD, ISO string, timestamp number, Date object, etc.)
 * strictly into DD/MM/YYYY format.
 * 
 * @param {string|number|Date} input 
 * @returns {string} Date formatted as DD/MM/YYYY
 */
export const formatDate = (input) => {
    if (!input) return 'N/A';

    // Already in DD/MM/YYYY format
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
            return trimmed;
        }

        // YYYY-MM-DD or YYYY/MM/DD (e.g. from HTML5 input type="date")
        const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (ymdMatch) {
            const [, y, m, d] = ymdMatch;
            return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }

        // DD-MM-YYYY or DD/MM/YYYY with single-digit day/month
        const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        if (dmyMatch) {
            const [, d, m, y] = dmyMatch;
            return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
    }

    try {
        let dateObj;
        if (input && typeof input.toDate === 'function') {
            dateObj = input.toDate();
        } else {
            dateObj = new Date(input);
        }

        if (isNaN(dateObj.getTime())) {
            return String(input);
        }

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return String(input);
    }
};

/**
 * Formats a date with time as "DD/MM/YYYY at HH:MM"
 * 
 * @param {string|number|Date} input 
 * @returns {string}
 */
export const formatDateTime = (input) => {
    if (!input) return 'N/A';
    try {
        let dateObj;
        if (input && typeof input.toDate === 'function') {
            dateObj = input.toDate();
        } else {
            dateObj = new Date(input);
        }
        if (isNaN(dateObj.getTime())) return formatDate(input);
        
        const dateStr = formatDate(dateObj);
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} at ${timeStr}`;
    } catch {
        return formatDate(input);
    }
};

/**
 * Converts any date format to YYYY-MM-DD for HTML5 <input type="date">
 * 
 * @param {string|number|Date} input 
 * @returns {string} Date formatted as YYYY-MM-DD
 */
export const toInputDateFormat = (input) => {
    if (!input) return '';
    const trimmed = String(input).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    try {
        const d = new Date(input);
        if (isNaN(d.getTime())) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    } catch {
        return '';
    }
};

export default formatDate;
