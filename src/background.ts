import { getActiveTabInCurrentWindow } from "./helpers/tabs";
import { CleanedLink, CleanedLinkWithTabID, cleanLink } from "./helpers/cleanlink";

// NOTE FOR FUTURE BRAVE SOULS TO OPEN THIS CODE (jk it's amazing code):
//
// When opening the popup, if configured to do so, the page URL will change to
// the shortened URL. However, this creates a UX issue—because the page is
// redirected to the shortened URL, the browser action icon turns back to gray,
// and future clicks of the action icon will no longer have the percent shorter
// displayed on the popup.
//
// To fix this, any time the popup code wants to do *anything,* it sends a
// message to this file—in essence, requesting a CleanedURL object back to use
// this object to display information to the user, copy the link, and/or
// redirect the page, outsourcing the control of the CleanedURL object to this
// file, background.ts. Whenever the CleanedLink object is requested, we
// automatically assume the page is being  redirected and store a message in a
// map called `redirectedTabs` (key = tab ID, value = the CleanedLink object
// **before** redirection).
//
// When resolving what CleanedLink object to use either for the popup (to send
// back in a message) or the app icon (in this file), we use this map first to
// check if the currently cached CleanedLink matching the tab's ID is still
// up-to-date. If this CleanedLink is *not* stale, we use it instead, using the
// old percent shorter data to render the correct icon and show the correct
// percentage saved in the popup despite the page URL being already shortened.
//
// Whenever a tab's URL changes, we check its cached CleanedLink and kick it out
// if it is stale.

//
//	Define redirectedTabs Map and Helper Functions
//
const redirectedTabs: Map<number, CleanedLink> = new Map<number, CleanedLink>();

const markRedirected = (cleanedLinkWithTabID: CleanedLinkWithTabID): void => {
	redirectedTabs.set(cleanedLinkWithTabID.tabID, cleanedLinkWithTabID.cleanedLink)
};

const markCurrentTabChanged = async (): Promise<void> => {
	const tab = await getActiveTabInCurrentWindow();
	if (tab?.url !== undefined) {
		const cachedCleanedLink = redirectedTabs.get(tab.id);
		if (cachedCleanedLink && tab.url !== cachedCleanedLink.cleanedURL) {
			redirectedTabs.delete(tab.id);
		}
	}
}

const getCleanedLinkWithTabID = async (): Promise<CleanedLinkWithTabID> => {
	const tab = await getActiveTabInCurrentWindow();
	if (tab?.url !== undefined) {
		// First see if we can get a cached copy from the `redirectedTabs` map:
		let cachedCleanedLink = redirectedTabs.get(tab.id);
		if (cachedCleanedLink && cachedCleanedLink.cleanedURL !== tab.url) {
			cachedCleanedLink = undefined;
			redirectedTabs.delete(tab.id);
		}

		return {
			cleanedLink: cachedCleanedLink || cleanLink(tab.url),
			tabID: tab.id
		};
	}
	return;
};

//
//  Set Up Message Listeners to Respond to Popup.tsx Messages
//
chrome.runtime.onMessage.addListener((message: void, sender: chrome.runtime.MessageSender, sendResponse: (response: CleanedLink) => void): boolean => {
	// Respond to message in async anonymous function (so we can `await`):
	(async function () {
		const cleanedLinkWithTabID = await getCleanedLinkWithTabID();
		if (cleanedLinkWithTabID !== undefined) {
			sendResponse(cleanedLinkWithTabID.cleanedLink);
			// Add to cache:
			markRedirected(cleanedLinkWithTabID);
		}
	}());
	// Return true to signal that sendResponse() should NOT be closed (that it
	// will be called asynchronously):
	return true;
});

//
//  Set Up Listeners to Change the Icon Icon when the Current Tab Changes
//
const updateIcon = async () => {
	const cleanedLink = (await getCleanedLinkWithTabID())?.cleanedLink;
	if (cleanedLink !== undefined) {
		if (cleanedLink.percentShorter === 0) {
			// The link CANNOT be shortened: make the app icon gray:
			chrome.browserAction.setIcon({ path: "./icons/grayicon-16.png" });
		} else {
			// The link CAN be shortened: make the app icon blue:
			chrome.browserAction.setIcon({ path: "./icons/blueicon-16.png" });
		}
	}
};
// Listen to update the icon when a new tab:
chrome.tabs.onCreated.addListener(updateIcon);
// Listen to update the icon when the active tab or window changes:
chrome.tabs.onActivated.addListener(updateIcon);
chrome.windows.onFocusChanged.addListener(updateIcon);
// Listen to update the icon when a tab or window is closed (meaning there is a
// new active tab):
chrome.windows.onRemoved.addListener(updateIcon);
chrome.tabs.onRemoved.addListener(updateIcon);
// Listen to update the icon AND invalidate the redirectedTabs entry (if
// applicable) when the URL changes:
chrome.tabs.onUpdated.addListener(async (): Promise<void> => {
	updateIcon();
	markCurrentTabChanged();
});
