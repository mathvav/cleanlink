// Helper function to copy a string to the clipboard with the MIME type
// text/plain.
export const copyToClipboard = (payload: string): void => {
	document.oncopy = (event): void => {
		event.clipboardData.setData("text/plain", payload);
		event.preventDefault();
	};
	document.execCommand("copy", false, null);
};
