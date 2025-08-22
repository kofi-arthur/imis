import colors from '../lib/colors.json'

export function getRandomColor(nameOrId) {
    let hash = 0;
    for (let i = 0; i < nameOrId?.length; i++) {
        hash = nameOrId?.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
}