export function formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(1)} ${sizes[i]}`;
}

export function formatDateTime(isoString) {
    const options = {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    };
    return new Date(isoString).toLocaleString(undefined, options);
}

export function formatDate(isoString) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    return new Date(isoString).toLocaleDateString(undefined, options);
}

export function formatDateLong(isoString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return new Date(isoString).toLocaleDateString(undefined, options);
}

export function formatTime(isoString) {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
    return new Date(isoString).toLocaleTimeString(undefined, options);
}

export function readISODate(isoString) {
    if (!isoString) return '';

    const date = new Date(isoString);
    if (isNaN(date)) return '';

    return date.toISOString().split('T')[0]; // returns 'YYYY-MM-DD'
}