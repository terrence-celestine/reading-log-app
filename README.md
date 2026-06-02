# Reading Log

A high-performance, local-first reading tracker built with Next.js and Dexie.js.

## Engineering Decisions

- **Local-First Architecture:** Utilized **Dexie.js** (IndexedDB) to ensure the application remains fully functional offline, providing instant read/write speeds without waiting for server round-trips.
- **Tombstone Sync Pattern:** Implemented a soft-delete mechanism to ensure that deletions are correctly propagated to the backend while maintaining local data integrity.
- **Reactive UI:** Leveraged `useLiveQuery` to automatically synchronize the UI with database changes, ensuring a seamless user experience.

## Key Features

- 🔍 **Smart Search:** Debounced API calls to Google Books.
- 📚 **Offline Library:** Full CRUD capabilities with local persistence.
- 📈 **Reading Stats:** Real-time data visualization of reading progress.
- 🎨 **Polished UX:** Dark-mode UI with Sonner toast notifications and loading skeletons.
