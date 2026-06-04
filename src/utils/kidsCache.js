const DB_NAME = 'kids-offline'
const STORE_NAME = 'kids'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

export async function cacheKids(kids) {
  if (!kids || !kids.length) return
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    for (const k of kids) {
      store.put(k)
    }
  } catch {}
}

export async function searchCachedKids(query) {
  if (!query) return []
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const all = await new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
    const q = query.toLowerCase()
    return all.filter(k =>
      (k.name && k.name.toLowerCase().includes(q)) ||
      (k.nik && k.nik.includes(q)) ||
      (k.mother_name && k.mother_name.toLowerCase().includes(q))
    )
  } catch {
    return []
  }
}
