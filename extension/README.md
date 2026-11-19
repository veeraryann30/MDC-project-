# Catch the Phish browser extension

Right-click any link, choose **Check this link with Catch the Phish**, and get a verdict in a notification.
Click the notification to open the full report on the website. The toolbar button checks the current page.

Works in Chrome, Edge and Brave (Manifest V3).

## Install (developer mode)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this `extension` folder.
3. On the options page that opens, enter your backend address (it ends in `/api`, for example
   `https://your-service.onrender.com/api`, or `http://127.0.0.1:8000/api` for local development) and the
   website address, then click **Save** and allow access to that one host.

## What it sends

Only the single link you chose (or the current page address if you use the toolbar button or the
"Check this page" menu item) is sent to the backend you configured, to `POST /scan`.
No page content, browsing history or cookies are collected. Links are analysed from their text and are never opened.

## Permissions

| Permission | Why |
| --- | --- |
| `contextMenus` | The right-click menu items |
| `notifications` | Show the verdict |
| `storage` | Remember your service address |
| `activeTab` | Pre-fill the popup with the page you are on, only when you open it |
| optional host access | Granted by you for your backend's host only, so the extension can call its API |

## Bookmarklet alternative

Settings > Browser tools in the website offers a draggable bookmarklet that works in any browser
without installing anything.

## Not published

This extension is loaded unpacked. Publishing to the Chrome Web Store needs a developer account and a
privacy policy, and has not been done.
