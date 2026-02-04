# Thunderbird Trash Bulk Delete

Thunderbird add-on to permanently delete all messages from Trash and Junk folders across all accounts.\
A simple and efficient alternative to XPunge/Multi-Xpunge for Thunderbird 140+.

## 🗑️ Bulk Delete Trash and Junk Messages

Permanently deletes all messages from Trash and Junk folders in all accounts (except local folders).\
Ideal for quickly cleaning up accumulated spam and deleted messages with a single click.

**Key Improvements:**
- ✅ Direct permanent deletion (no more moving to local trash)
- ✅ Comprehensive error logging for better troubleshooting
- ✅ Partial i18n support (German, English, and French)
- ✅ Compatible with Thunderbird ESR 140.x+

## Features
- 🔍 Automatically finds all Trash and Junk folders across accounts
- 🗑️ Permanently deletes messages (no intermediate moving)
- 🔄 Supports undo action (Ctrl+Z) via `isUserAction` flag
- 📊 Detailed error logging for troubleshooting
- 🌍 Partial internationalization support (German, English, French)
- 🖱️ Simple single-click toolbar button
- ⚡ Efficient batch deletion with fallback to individual message handling
- 🔧 Compatible with current Thunderbird MailExtension APIs

## Requirements
- Thunderbird ESR 140.x or newer with MailExtension support
- Appropriate account permissions to delete messages

## Installation
Download the latest release as a ZIP file and install via Add-ons Manager in Thunderbird.

**Steps:**
1. Download the XPI or ZIP file from the [releases](releases/) folder
2. Open Thunderbird → Add-ons Manager (Ctrl+Shift+A)
3. Click the gear icon → "Install Add-on From File..."
4. Select the downloaded file

## Usage
After installation, add the toolbar button if not shown automatically.

**Click the button to:**
1. Scan all accounts (excluding local folders)
2. Recursively find all Trash and Junk folders
3. Permanently delete all messages from those folders
4. Log progress and errors to the developer console

**To view logs:**
- Press Ctrl+Shift+J to open the Browser Console
- Check for deletion confirmations and any error messages

**Note:** Deleted messages can be undone immediately with Ctrl+Z if needed.

## Permissions
- **accountsRead**: List accounts and folders
- **messagesRead**: Read message metadata and lists
- **messagesDelete**: Delete messages permanently

These permissions are required to scan folders and delete messages from Trash and Junk folders.

## Internationalization (i18n)
**Supported languages:**
- 🇩🇪 German: `_locales/de/messages.json`
- 🇬🇧 English: `_locales/en/messages.json`
- 🇫🇷 French: `_locales/fr/messages.json`

Additional languages can be added by providing more `_locales/<locale>/messages.json` files following the WebExtension i18n format.

## Project Structure

```
thunderbird-trash-bulk-delete/
├── LICENSE
├── README.md
├── addon/
│   ├── background.js          # Main extension logic
│   ├── manifest.json           # Extension manifest
│   ├── _locales/               # Internationalization
│   │   ├── de/
│   │   │   └── messages.json   # German translations
│   │   ├── en/
│   │   │   └── messages.json   # English translations
│   │   └── fr/
│   │       └── messages.json   # French translations
│   └── icons/                  # Extension icons
└── releases/                   # Release builds
```

## Known Limitations
- ⏱️ Processing may take time with very large trash folders (thousands of messages)
- 🔍 Local account detection relies on `acc.type === "none"`; adjust if you have custom setups
- ⚠️ Messages are permanently deleted from Trash/Junk folders (though Ctrl+Z works immediately after)
- 📝 Batch deletion may fail on some servers; extension falls back to individual message deletion with error logging

## Security and Privacy
- 🔒 No data sent to external servers
- 💻 All operations occur locally within Thunderbird profile
- 🔐 Add-on only accesses metadata needed to delete messages
- ✅ Open-source and auditable code

## Contributing
Contributions are welcome! Feel free to:
- Report bugs and request features via GitHub issues
- Submit pull requests for improvements
- Add translations for additional languages

## Support
- 🐛 Open issues and feature requests as repository tickets
- 📋 Provide Thunderbird version, add-on version, and relevant console logs when reporting bugs
- 💬 Check existing issues before creating new ones

## License
MIT License

---

## Credits

This project is a fork of [thunderbird-trash-move](https://github.com/Ben-Cykyria/thunderbird-trash-move/) by Ben-Cykyria.

**Significant modifications in this fork:**
- Changed from moving messages to direct permanent deletion
- Added comprehensive error handling and logging
- Added French language support
- Improved batch processing with fallback mechanisms

---

**⚠️ Important:** This add-on permanently deletes messages from Trash and Junk folders. While undo (Ctrl+Z) is available immediately after deletion, use with caution and ensure you have backups of important data.
