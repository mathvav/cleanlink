import React, { ReactElement, useEffect, useState } from "react";
import { getActiveTabInCurrentWindow, redirect, RedirectMode } from "../helpers/tabs";
import { copyToClipboard } from "../helpers/clipboard";
import { CleanedLink } from "../helpers/cleanlink";
import "./Popup.scss";

//
//  Component Customization
//
const autoCloseMilliseconds = 3500;
const autoCloseFade = 500;
const redirectMode: RedirectMode = "replaceState";

//
//  Component
//
const Popup = (): ReactElement => {
	console.assert(autoCloseMilliseconds > autoCloseFade);

	//
	//  Define and Set the Component State and Hooks
	//
	const [cleanedLink, setCleanedLink] = useState<CleanedLink>(undefined);
	const [popupContainerContentsOpacity, setPopupContainerContentsOpacity] = useState(100);

	// Request the CleanedLink object from background.ts, and, on receiving,
	// update the component state and do additional actions (such as copying the
	// newly received link to the clipboard and redirecting):
	//
	// We do NOT just clean the link directly here, as sometimes we want the
	// cached CleanedLink object stored in background.ts. This is because,
	// without this flow, and with redirection enabled (with `redirectMode`),
	// the percent saved message would only be visible on the first click. In
	// essence, we are letting background.ts give us a CleanedLink object and
	// letting it handle all of the logistics of caching/what to display to the
	// user. Please see the code in background.ts for more information.
	useEffect(() => {
		chrome.runtime.sendMessage(null, (response: CleanedLink) => {
			// Set component state and copy the cleaned link to the clipboard:
			setCleanedLink(response);
			copyToClipboard(response.cleanedURL);

			// Redirect to the cleaned link (if configured to do so and if the
			// link is actually shorter):
			if (response.percentShorter > 0 && redirectMode?.length > 0) {
				// Execute as async anonymous function so we can await
				// getActiveTabInCurrentWindow():
				(async function () {
					redirect(await getActiveTabInCurrentWindow(), response.cleanedURL, redirectMode);
				}());
			}

			// Set the popup to automatically close (if configured to do so):
			if (autoCloseMilliseconds > 0) {
				setTimeout(() => window.close(), autoCloseMilliseconds);
				setTimeout(() => setPopupContainerContentsOpacity(0), autoCloseMilliseconds - autoCloseFade);
			}
		});
	}, []);

	//
	//  Render Component
	//
	const innerContainer = cleanedLink?.percentShorter !== undefined ? (
		<>
			<h1>📋 Copied to clipboard!</h1>
			{cleanedLink.percentShorter > 0 ? <h3>({cleanedLink.percentShorter.toFixed(1)}% shorter link)</h3> : null}
		</>
	) : (
			<>
				<h1>📋 Copying to clipboard...</h1>
			</>
		);

	return <div className="popup-container" style={{ opacity: popupContainerContentsOpacity, transition: "opacity", transitionDuration: `${autoCloseFade}ms` }}>
		{innerContainer}
	</div>
}

export default Popup;
