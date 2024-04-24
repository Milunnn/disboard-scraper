## What does Disboard Scraper do?

This is a simple scraper which purpose is to obtain data about servers located on [Disboard](https://disboard.org/), providing a simple API to describe what results you are looking for. Note that this Actor does NOT bypass the limitations of https://disboard.org/, meaning that the amount of pages scraped per tag is limited to **50** (circ. ~1200 results).

Extracts descriptions, images, ratings, reviews, user counts, even join links, and more!

## Why use Disboard Scraper?

Reasons:

- Simple
- Automatic duplicate detecting and filtering
- Handles timeouts
- Output fields sanitization

Want to collect or track data about active/large servers? This is the way to do it!

## How much will scraping Disboard cost you?

To obtain 1000 results, the cost is approximately $. The Apify Free plan will therefore cover more than !!

## How to scrape Disboard

1. Go to the top of page [Disboard Scraper]() on the Apify platform
2. Click the *Try for free* button
3. Fill the inputs with desired query values
4. Click the *Start* button
5. Wait for the Actor to finish
6. Export your data

## Is it legal to scrape Disboard?

Our scrapers are ethical and do not extract any private user data, such as email addresses, gender, or location. They only extract what the user has chosen to share publicly. We therefore believe that our scrapers, when used for ethical purposes by Apify users, are safe. However, you should be aware that your results could contain personal data. Personal data is protected by the [GDPR](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation) in the European Union and by other regulations around the world. You should not scrape personal data unless you have a legitimate reason to do so. If you're unsure whether your reason is legitimate, consult your lawyers. You can also read our blog post on the [legality of web scraping](https://blog.apify.com/is-web-scraping-legal/).

## Input

Example input for getting the first 10 pages (circ. ~240 results) of largest servers with "community" tag:
```json
{
    "startPageNumber": 1,
    "endPageNumber": 10,

    "keywords": [ "community" ],
    "sort": "member_count"
}
```

Click on the [Input]() tab for more information.

## Output

You can download the dataset extracted by Disboard Scraper in various formats, such as JSON, HTML, CSV, or Excel.

JSON output example (without reviews):
```json
{
	"id": "244230771232079873",
	"name": "The Programmer's Hangout",
	"description": "Whether you've written 10 lines of code or have been writing code for 10 years, you're welcome here! The Programmer's Hangout (TPH) is an extremely active community and a great place to get a solid footing in programming.",
	"category": "Technology",
	"tags": [
		"social",
		"community",
		"programming",
		"javascript",
		"java"
	],
	"userCount": {
		"online": 25942
	},
	"disboardServerUrl": "https://disboard.org/server/244230771232079873",
	"iconUrl": "https://cdn.discordapp.com/icons/244230771232079873/a_7b187c1d9f1a61d68b1373ab69d79f86.jpg",
	"joinLinkUrl": "https://disboard.org/server/join/244230771232079873",
	"bumpedAt": "2024-04-11T19:56:35.000Z",
	"reviews": []
}
```

## Tips

- If you want to collect more servers overall, try to use more narrow/strict tags (not as generally used)