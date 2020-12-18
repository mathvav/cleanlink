// The following data structure is returned by cleanLink, containing the
// original and transformed links, along with what percentage shorter the
// cleaned link is.
export interface CleanedLink {
	originalURL: string;
	cleanedURL: string;
	percentShorter: number;
}

// A CleanedLink object stored with a tabID (type number). Mainly used as a
// message payload DTO for data sent between the background code and the popup
// code.
export interface CleanedLinkWithTabID {
	tabID: number;
	cleanedLink: CleanedLink;
}

// The secret sauce behind CleanLink (aptly named "cleanLink," though "clean"
// here is a verb and not an adjective).
//
// Process:
//
//    1. Run the first SiteHandler that matches the current host.
//    2. Regardless of if a SiteHandler ran, call stripUtmData() to remove any
//       UTM tracking query parameters.
export const cleanLink = (input: string): CleanedLink => {
	let output: string = "";
	// We use an if statement as the new tab page has a URL of "":
	if (input.length > 0) {
		const url = new URL(input);

		const handler = siteHandlers.find((h: SiteHandler) => h.applicableHosts.includes(url.hostname));
		if (handler !== undefined) {
			handler.cleanLink(url);
		}

		stripUtmData(url);

		output = url.toString();
	}

	return {
		originalURL: input,
		cleanedURL: output,
		percentShorter: (((input.length - output.length) / input.length) * 100) || 0
	};
};

// A SiteHandler is a special function that is ran on links from a specific
// domain (host).
interface SiteHandler {
	applicableHosts: string[];
	cleanLink(link: URL): void;
}

// A predefined list of SiteHandler objects.
const siteHandlers: SiteHandler[] = [
	{
		applicableHosts: ["www.amazon.com"],
		cleanLink: (url: URL): void => {
			//
			//  AMAZON SITE HANDLER
			//
			// Amazon has two link formats for product pages:
			//
			//     1. https://www.amazon.com/dp/{productId}
			//     2. https://www.amazon.com/gp/product/{productId}
			//
			// In both of these, there may be additional garbage after ".com/",
			// in the form of the product name/a quick description, such as 
			// https://www.amazon.com/Capri-Sun-Flavored-Juice-Blend/dp/B01G3APXOI
			//
			// We can chop off this extra text. In addition, for both styles of
			// links, we can ignore any query parameters.
			const pathSegments = url.pathname.substring(1).split("/");
			const dpIndex = pathSegments.indexOf("dp");
			const gpIndex = pathSegments.indexOf("gp");
			if (dpIndex !== -1) {
				url.search = "";
				url.pathname = `/dp/${pathSegments[dpIndex + 1]}`;
			} else if (gpIndex !== -1) {
				url.search = "";
				url.pathname = `/gp/product/${pathSegments[gpIndex + 2]}`;
			}
		}
	},
	{
		applicableHosts: ["www.ebay.com"],
		cleanLink: (url: URL): void => {
			//
			//  EBAY SITE HANDLER
			//
			// For a pathname that is in the format "/itm/SOME-TEXT-HERE/34523",
			// you can ignore the "/SOME-TEXT-HERE/" and make the path into
			// "/itm/34523". In addition, for item pages, any query parameters
			// can be ignored (as far as we know).
			const pathSegments = url.pathname.substring(1).split("/");
			if (pathSegments.length === 3 && pathSegments[0] === "itm") {
				url.pathname = `/itm/${pathSegments[2]}`;
				url.search = "";
			}
		}
	},
	{
		applicableHosts: ["www.google.com", "www.bing.com"],
		cleanLink: (url: URL): void => {
			//
			//  GOOGLE AND BING SITE HANDLER
			//
			// If the pathname is "/search", we can get rid of every query
			// parameter except "q" (query) and, for Google, "tbm" (specifies
			// the type of search, such as web, image, or video). Non-web
			// searches on Bing have a different pathname than "/search" and are
			// NOT currently handled by CleanLink.
			if (url.pathname === "/search") {
				const oldParams = new URLSearchParams(url.search);

				// Copy over only "q" and, if present, "tbm" query parameters.
				const newParams = new URLSearchParams();
				newParams.set("q", oldParams.get("q"));
				//tbm (for Google)
				if (oldParams.get("tbm")) {
					newParams.set("tbm", oldParams.get("tbm"));
				}

				url.search = newParams.toString();
			}
		}
	}
];

// Removes any query parameters that start with "UTM" (usually associated with
// Google Analytics).
const stripUtmData = (url: URL): void => {
	const params = new URLSearchParams(url.search);
	const paramNames = [...params.keys()];
	for (const paramName of paramNames) {
		if (paramName.toUpperCase().startsWith("UTM")) {
			params.delete(paramName);
		}
	}
	url.search = params.toString();
}
