AUW CONNECT — COMPLETE WEBSITE UPDATE

Included files:
- index.html
- index.css
- script.js
- supabase_office_hours_notifications.sql

Important:
1. Keep all four files in the same GitHub repository folder.
2. Replace the existing index.html, index.css, and script.js with the files in this ZIP.
3. Run supabase_office_hours_notifications.sql once in Supabase SQL Editor.
4. Open the live site and hard-refresh (Ctrl+Shift+R).

This update preserves the supplied HTML and CSS. The JavaScript startup was adjusted so the interface registers its click handlers immediately rather than waiting for Supabase session restoration and office-hour synchronization. Supabase authentication then loads in the background.

Checks performed:
- JavaScript syntax check passed (node --check).
- ZIP contents and file names checked.
- HTML references index.css and script.js, matching the ZIP names.

Not verified:
- A live login, cross-device booking, and notification test against your Supabase project. Those require testing with real Student and Faculty accounts in your deployed site.
