export function cleanIp(ip) {
    // IPv6-mapped IPv4: "::ffff:127.0.0.1" → "127.0.0.1"
    if (ip.startsWith('::ffff:')) {
        return ip.replace('::ffff:', '');
    }
    // IPv6 loopback: "::1" → "127.0.0.1"
    if (ip === '::1') {
        return '127.0.0.1';
    }
    return ip;
}

export function getClientIP(req) {
    let ip = req.headers['x-forwarded-for'];

    if (ip) {
        ip = ip.split(',')[0].trim();
    } else {
        ip = req.connection?.remoteAddress || req.socket?.remoteAddress;
    }

    // Normalize IPv6 loopback to IPv4 loopback
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1';
    }
    return ip;
}