import { CleanedLink, cleanLink } from "./cleanlink";

//
//  Supporting Code
//
interface LinkTransformation {
	before: string;
	after: string;
}

const expectLinkUnchanged = (url: string) => {
	expect(cleanLink(url).cleanedURL).toBe(url);
};

const expectLinkTransformation = (linkTransformation: LinkTransformation): void => {
	expect(cleanLink(linkTransformation.before).cleanedURL).toBe(linkTransformation.after);
};

//
//  Test cleanLink() originalURL
//
test.each([
	"https://example.com/",
	"https://www.google.com/privacy",
	"https://www.amazon.com/SNICKERS-Christmas-Slice-Chocolate-1-Pound/dp/B0063HMIRW?ref_=Oct_DLandingS_D_9d339c39_60&smid=ATVPDKIKX0DER",
	"https://www.amazon.com/gp/product/B08CZ1T8CM/ref=s9_acss_bw_cg_gclptcg_1a1_w?pf_rd_m=ATVPDKIKX0DER&pf_rd_s=merchandised-search-4&pf_rd_r=E3KXYQ5H5P113ZMX8RFR&pf_rd_t=101&pf_rd_p=8def52fb-bd0c-4ad1-9337-c8bd55cf65a4&pf_rd_i=2238192011"
])("cleanLink helper function: Test originalURL is correct.", (url: string) => {
	expect(cleanLink(url).originalURL).toBe(url);
});

//
//  Test cleanLink() percentShorter
//
test.each([
	"https://example.com/",
	"https://www.google.com/privacy"
])("cleanLink helper function: Test when percentShorter should be 0% shorter.", (url: string) => {
	expect(cleanLink(url).percentShorter).toBe(0);
});

test.each([
	"https://www.amazon.com/SNICKERS-Christmas-Slice-Chocolate-1-Pound/dp/B0063HMIRW?ref_=Oct_DLandingS_D_9d339c39_60&smid=ATVPDKIKX0DER",
	"https://www.amazon.com/gp/product/B08CZ1T8CM/ref=s9_acss_bw_cg_gclptcg_1a1_w?pf_rd_m=ATVPDKIKX0DER&pf_rd_s=merchandised-search-4&pf_rd_r=E3KXYQ5H5P113ZMX8RFR&pf_rd_t=101&pf_rd_p=8def52fb-bd0c-4ad1-9337-c8bd55cf65a4&pf_rd_i=2238192011"
])("cleanLink helper function: Test when percentShorter should be more than 0% shorter.", (url: string) => {
	expect(cleanLink(url).percentShorter).toBeGreaterThan(0);
});

test("cleanLink helper function: Test specific test case of percentShorter.", () => {
	const url = "https://www.amazon.com/SNICKERS-Christmas-Slice-Chocolate-1-Pound/dp/B0063HMIRW?ref_=Oct_DLandingS_D_9d339c39_60&smid=ATVPDKIKX0DER";
	const expected = 72.51908397;
	expect(cleanLink(url).percentShorter).toBeCloseTo(expected);
});

//
//  Test cleanLink() Special Cases
//
test("cleanLink helper function: Test that an empty URL (new tab page) is properly handled.", () => {
	const cleanedLink = cleanLink("");
	expect(cleanedLink).toStrictEqual<CleanedLink>({
		originalURL: "",
		cleanedURL: "",
		percentShorter: 0
	});
});

//
//  Test cleanLink() on URLs Without a Specialized SiteHandler
//
test.each([
	"https://example.com/",
	"https://withasubdomain.example.com/",
	"https://example.com/foobar",
	"https://example.com/foobar?hi=there"
])("cleanLink helper function: Ensure that URLs without UTM query parameters and without any site-specific rules are left unchanged.", expectLinkUnchanged);

test.each([
	{ before: "https://example.com/foobar?utm=lowercase", after: "https://example.com/foobar" },
	{ before: "https://example.com/foobar?uTm=uppercase", after: "https://example.com/foobar" },
	{ before: "https://example.com/foobar?UTMprefix=baz", after: "https://example.com/foobar" },
	{ before: "https://example.com/foobar?utm", after: "https://example.com/foobar" }
])("cleanLink helper function: Ensure that URLs with a query parameter starting with 'UTM' have that parameter removed.", expectLinkTransformation);

test.each([
	{ before: "https://example.com/foobar?nUTMeg=baz", after: "https://example.com/foobar?nUTMeg=baz" },
	{ before: "https://example.com/foobar?nUTMeg=baz&utm=data", after: "https://example.com/foobar?nUTMeg=baz" },
	{ before: "https://example.com/?nutmeg", after: "https://example.com/?nutmeg=" }
])("cleanLink helper function: Ensure that URLs with a query parameters that contain (but do not start with) 'UTM' have that parameter kept.", expectLinkTransformation);

//
//  Test the Amazon SiteHandler
//
test.each([
	"https://www.amazon.com/",
	"https://www.amazon.com/events/holidaydeals?ref_=US_HDD20_GW_Desk_profile4_EN&ref=gwrd_holiday_en&pf_rd_r=XWBG4RSW5H6NEDF8EX6A&pf_rd_p=b112fbde-ffe2-4bc4-80f8-06781211885f",
	"https://www.amazon.com/deal/9d339c39/ref=gbps_img___9d339c39?showVariations=true&smid=ATVPDKIKX0DER"
])("cleanLink helper function: Ensure that Amazon URLs that are not product URLs are left untransformed.", expectLinkUnchanged);

test.each([
	"https://www.amazon.com/dp/B0063HMIRW",
	"https://www.amazon.com/gp/product/B08CZ1T8CM"
])("cleanLink helper function: Ensure that Amazon URLs that are already cleaned are not transformed any more.", expectLinkUnchanged);

test.each([
	{ before: "https://www.amazon.com/SNICKERS-Christmas-Slice-Chocolate-1-Pound/dp/B0063HMIRW?ref_=Oct_DLandingS_D_9d339c39_60&smid=ATVPDKIKX0DER", after: "https://www.amazon.com/dp/B0063HMIRW" },
	{ before: "https://www.amazon.com/gp/product/B08CZ1T8CM/ref=s9_acss_bw_cg_gclptcg_1a1_w?pf_rd_m=ATVPDKIKX0DER&pf_rd_s=merchandised-search-4&pf_rd_r=E3KXYQ5H5P113ZMX8RFR&pf_rd_t=101&pf_rd_p=8def52fb-bd0c-4ad1-9337-c8bd55cf65a4&pf_rd_i=2238192011", after: "https://www.amazon.com/gp/product/B08CZ1T8CM" }
])("cleanLink helper function: Ensure that Amazon URLs are properly shortened.", expectLinkTransformation);

test.each([
	{ before: "https://www.amazon.com/deal/9d339c39?utm=yikes", after: "https://www.amazon.com/deal/9d339c39" }
])("cleanLink helper function: Ensure that UTM query parameters are still removed by the Amazon SiteHandler.", expectLinkTransformation);

//
//  Test the eBay SiteHandler
//
test.each([
	"https://www.ebay.com/",
	"https://www.ebay.com/e/_electronics/shop-all-certified-refurbished-holiday-deals?_trkparms=%26clkid%3D7372306276357150466",
	"https://www.ebay.com/myb/container?key=recentlyviewed"
])("cleanLink helper function: Ensure that eBay URLs that are not product URLs are left untransformed.", expectLinkUnchanged);

test.each([
	"https://www.ebay.com/itm/203170207923",
	"https://www.ebay.com/itm/373388907650"
])("cleanLink helper function: Ensure that eBay URLs that are already cleaned are not transformed any more.", expectLinkUnchanged);

test.each([
	{ before: "https://www.ebay.com/itm/iRobot-Roomba-805-Vacuum-Cleaning-Robot-with-Accessories/203170207923?_trkparms=ispr%3D1&hash=item2f4de358b3:g:Z~4AAOSwDDRbxkHT&amdata=enc%3AAQAFAAACcBaobrjLl8XobRIiIML1V4Imu%252Fn%252BzU5L90Z278x5ickkrmmq8hWevtuKE7%252F%252BLfVXtlIDrMK%252FaKT7rEMzhe2gN99w8tjdsEkix75ICLVIclWWhALuZ7p4JhP6Rw5U2cF6QtRRnFTr0T1bJf4kakAv0kRkHJDnMcGYWBh%252B9Mt4DnXV5pRkDMdSR1ARzS4ZBvHOyauq9Mx2ojXgUbam%252FGqcTksz4uJCr2xprf7mObyRri4pKrzvdxG0UtdClqr8Ik1md%252FvvSa7rZCZKfgYhtAbvxC3qnVgHdFojM4iZ8XOrKGTiufk58Nbq51W0adRyl5GIP%252F9UcHElEy18XTmrwA0Siu9SP3tg8cnaEk83E7d95ue27MoPOYp9JFm97tCZM8GKi8chirekjdv2HYR6qUcK2HnLMbx8GqZK9tanhz9Kkd7dsyGaS8uW0vJQS7erq%252FZvHVvtZCC0eSuv5l5RAKuJBtM%252FYBBQElHsxab8f%252BjtqYdhwFg%252FNyAIBpQL16WLcXPxjUjgVz2MNXu3dlJPs8tSKDi5p1Jq5IFQ%252B2a11FsB3K2to%252Fovjo9lLSgp6OAE93iXSY%252BSvSVSiMgG4g4Eof1aOPSKaEgwMDdDz%252BsIeJ6PqVtIdM2aXToEi3Sk8iWg18cITFIjpqGI1j36%252BzBuHCOYZpv%252BIhstR9S2CT72BfIbyRL%252B7SFdAcbYh0xp9yBaT%252BXku2AgZ3QLUwhw%252FtBIjnbVGdkMbjfbEUhRVa7LTB%252FYEQ5F9zAEWiv5KZ0qj0UhjQ8mkFU2aq8jS9wzGgMpNxgb%252BMe270VGysyiAZXkE6XHgsX7oxHSSh1s9ST40jY43Nw5mQ%253D%253D%7Ccksum%3A203170207923ba5e797d73794f289e9995c7fd0cdbd5%7Campid%3APL_CLK%7Cclp%3A2334524", after: "https://www.ebay.com/itm/203170207923" },
	{ before: "https://www.ebay.com/itm/Lover-by-Taylor-Swift-Vinyl-2019-2-Disc-Set-EMI-Target-Exclusive-New-Sealed/373388907650?epid=15034719263&hash=item56efb69482:g:PfUAAOSwcIFfyVbe#rwid", after: "https://www.ebay.com/itm/373388907650#rwid" }
])("cleanLink helper function: Ensure that eBay URLs are properly shortened.", expectLinkTransformation);

test.each([
	{ before: "https://www.ebay.com/myb/container?key=recentlyviewed&utm=yikes", after: "https://www.ebay.com/myb/container?key=recentlyviewed" }
])("cleanLink helper function: Ensure that UTM query parameters are still removed by the Amazon SiteHandler.", expectLinkTransformation);

//
//  Test the Google/Bing SiteHandler
//
test.each([
	"https://www.google.com/search/howsearchworks/?q=null",
	"https://www.bing.com/search/howsearchworks/?q=null"
])("cleanLink helper function: Ensure that Google and Bing URLs that are not search URLs are left untransformed.", expectLinkUnchanged);

test.each([
	{ before: "https://www.google.com/search?tbm=isch&aaaa=SMyvKNywwJeduAjvc47hdmNFaSrS2qU8Wxp&source=hp&biw=1920&bih=1037&ei=fYdtDCEDqJNqBgUHf6JWZsdhDpTCP5ANjkQ&q=duck", after: "https://www.google.com/search?q=duck&tbm=isch" }
])("cleanLink helper function: Ensure that Google **image/map/shopping/video/etc. searches** URLs are properly transformed.", expectLinkTransformation);

test.each([
	"https://www.bing.com/images/search?q=candy+canes&form=HDRSC3&first=1&tsc=ImageBasicHover"
])("cleanLink helper function: Ensure that Bing **image/map/shopping/video/etc. searches** URLs are left untransformed.", expectLinkUnchanged);

test.each([
	"https://www.google.com/search?q=github+cleanlink",
	"https://www.bing.com/search?q=github+cleanlink"
])("cleanLink helper function: Ensure that Google and Bing URLs that are already cleaned are not transformed any more.", expectLinkUnchanged);

test.each([
	{ before: "https://www.google.com/search?safe=strict&sxsrf=rUgYWzzLNr3GM5GDqbLTcCgNqU6AFT9gyNc4MHBe7SeWf2zXaQqFq9tYFQzzKgHaW6WsNkJ4UEq3QpTWdkEpSmp5HLVgvS8CP3kceBykZMNk5Xg6qmj7x3A429yvjf9dxrkkJBCrjRuH53s7adfxuFGe9qbS8VE25BCCfBHn34fEGFESK6zRDsHnD2VbKTJHM&Mpsycpc6qZdHdmeANcThcjCQd4saUMsUrQUr4rr&ei=E6ZNNmqugtD3Y7ALudVsSQzP&q=github+cleanlink&oq=github+cleanlink&gs_lcp=JfaztXb3mLeQYq4g68wfCCeJGPBXtgjwrFFNp5K7FpJLdtgfmqn8GW4vKhc63WKLnSvebgw3v4PT94Ezu7QqVtmw2hAwfEYPjvzKR7rs4kpxVXTNBMqdS75Ykf5WJBKzrEW2kayCnRfPuXrt87vBssFXqrRzX4mytjfkXSNK89p2smp9Cg6sWL2mGShzQUGCp&sclient=agh-ab&ved=dsbpkVkB5hW3fXWfHCJXzuqFm8xgaF&uact=23", after: "https://www.google.com/search?q=github+cleanlink" },
	{ before: "https://www.bing.com/search?safe=strict&sxsrf=rUgYWzzLNr3GM5GDqbLTcCgNqU6AFT9gyNc4MHBe7SeWf2zXaQqFq9tYFQzzKgHaW6WsNkJ4UEq3QpTWdkEpSmp5HLVgvS8CP3kceBykZMNk5Xg6qmj7x3A429yvjf9dxrkkJBCrjRuH53s7adfxuFGe9qbS8VE25BCCfBHn34fEGFESK6zRDsHnD2VbKTJHM&Mpsycpc6qZdHdmeANcThcjCQd4saUMsUrQUr4rr&ei=E6ZNNmqugtD3Y7ALudVsSQzP&q=github+cleanlink&oq=github+cleanlink&gs_lcp=JfaztXb3mLeQYq4g68wfCCeJGPBXtgjwrFFNp5K7FpJLdtgfmqn8GW4vKhc63WKLnSvebgw3v4PT94Ezu7QqVtmw2hAwfEYPjvzKR7rs4kpxVXTNBMqdS75Ykf5WJBKzrEW2kayCnRfPuXrt87vBssFXqrRzX4mytjfkXSNK89p2smp9Cg6sWL2mGShzQUGCp&sclient=agh-ab&ved=dsbpkVkB5hW3fXWfHCJXzuqFm8xgaF&uact=23", after: "https://www.bing.com/search?q=github+cleanlink" }
])("cleanLink helper function: Ensure that Google and Bing URLs are properly shortened.", expectLinkTransformation);

test.each([
	"https://www.google.com/search/advanced",
	"https://www.bing.com/search/advanced"
])("cleanLink helper function: Ensure that Google and Bing URLs that do not exactly match the pathname of '/search' are not touched by this glorious code.", expectLinkUnchanged);

test.each([
	{ before: "https://www.google.com/search/howsearchworks/?q=null&utm=yikes", after: "https://www.google.com/search/howsearchworks/?q=null" },
	{ before: "https://www.bing.com/search/howsearchworks/?q=null&utm=yikes", after: "https://www.bing.com/search/howsearchworks/?q=null" }
])("cleanLink helper function: Ensure that UTM query parameters are still removed by the Amazon SiteHandler.", expectLinkTransformation);
