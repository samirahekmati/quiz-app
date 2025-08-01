export function formatTime(totalSeconds) {
	if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) {
		return "Loading Timer...";
	}

	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	const paddedMinutes = String(minutes).padStart(2, "0");
	const paddedSeconds = String(seconds).padStart(2, "0");

	return `${paddedMinutes}:${paddedSeconds}`;
} 