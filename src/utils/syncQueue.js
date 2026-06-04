const DB_NAME = 'offline-sync'
const STORE_NAME = 'requests'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

export async function addToQueue(method, url, headers, body) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.add({ method, url, headers, body, timestamp: new Date().toISOString(), status: 'pending' })
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQueue() {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const all = store.getAll()
  return new Promise((resolve, reject) => {
    all.onsuccess = () => resolve(all.result || [])
    all.onerror = () => reject(all.error)
  })
}

export async function getQueueSize() {
  const items = await getQueue()
  return items.filter(i => i.status === 'pending').length
}

export async function removeFromQueue(id) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.delete(id)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function processQueue(apiClient) {
  const items = await getQueue()
  const pending = items.filter(i => i.status === 'pending')
  if (!pending.length) return { processed: 0, failed: 0 }

  let processed = 0
  let failed = 0

  for (const item of pending) {
    try {
      await apiClient({
        method: item.method,
        url: item.url,
        data: item.body ? JSON.parse(item.body) : undefined,
        headers: item.headers ? JSON.parse(item.headers) : {}
      })
      await removeFromQueue(item.id)
      processed++
    } catch {
      failed++
    }
  }

  return { processed, failed }
}
