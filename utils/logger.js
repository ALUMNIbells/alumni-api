import Log from '../models/Log.js';

async function logEvent(type, {user, ip, action, details}) {
    try {
        const log = new Log({ type, user, ip, action, details });
        await log.save();
    } catch (error) {
        console.error('Error writing to log:', error);
    }
}

export default logEvent;