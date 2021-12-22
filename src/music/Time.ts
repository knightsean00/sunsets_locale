/**
 * Formats time in the hr m s format
 * @param duration duration in milliseconds
 */
export function formatSec(duration: number):string {
    duration = duration / 1000;
    const hours = Math.floor(duration / 3600);
    duration = duration - (hours * 3600);

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration - (minutes * 60));

    if (hours > 0) {
        return `${hours}hr ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}

/**
 * Returns the time remaining in hr m s format
 * @param streamTime stream time in milliseconds (must be less than totalTime)
 * @param totalTime total time in milliseconds
 */
export function timeRemaining(streamTime:number, totalTime:number):string {
    return formatSec(totalTime - streamTime);
}