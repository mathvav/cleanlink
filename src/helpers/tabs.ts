// Configures the type of redirect used by the redirect() function:
//
//     - "": do not redirect
//     - "replaceState": call history.replaceState()
//     - "pushState": call history.pushState()
//
// No currently supported RedirectMode actually reloads the page—the current
// RedirectMode values currently only change the browser back button/history and
// the browser omnibar/URL bar. This is to preserve resources and make the
// copying process look more visually appealing. The downside of this, however,
// is that it is possible that, if a cleaned link is improperly cleaned, the
// user will not know that the link they are copying is invalid until it's too
// late. Consider reevaluating this after using this extension more in the wild.
export type RedirectMode = "" | "replaceState" | "pushState";

// Redirects the passed tab to the passed URL with the specified RedirectMode.
export const redirect = (tab: chrome.tabs.Tab, url: string, redirectMode: RedirectMode = "pushState"): void => {
	if (redirectMode === "") {
		return;
	}

	chrome.tabs.executeScript(tab.id, {
		// Use JSON.stringify to prevent XSS attacks:
		code: `history.${redirectMode}({}, null, ${JSON.stringify(url)});`
	});
};

// Async helper function to query Chrome to get the current tab.
export const getActiveTabInCurrentWindow = async (): Promise<chrome.tabs.Tab> => {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({
			"active": true,
			"windowId": chrome.windows.WINDOW_ID_CURRENT
		}, (tabs) => {
			resolve(tabs[0]);
		});
	});
};
