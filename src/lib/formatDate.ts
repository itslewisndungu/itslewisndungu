export function formatDate(date: Date) {
	return date.toLocaleDateString("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});
}

export function toDateTime(date: Date) {
	return date.toISOString().slice(0, 10);
}
