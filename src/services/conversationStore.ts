import { Message, TutorMode } from '../types';

const DATABASE_NAME = 'my-personal-tutor';
const DATABASE_VERSION = 1;
const STORE_NAME = 'conversations';
const LEGACY_ACTIVE_ID = 'active';

export interface StoredConversation {
  id: string;
  title: string;
  mode: TutorMode;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this browser.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Could not open the conversation database.'));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function readConversationRequest(
  database: IDBDatabase,
  id: string,
): Promise<StoredConversation | null> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onerror = () => reject(request.error ?? new Error('Could not load the saved conversation.'));
    request.onsuccess = () => resolve((request.result as StoredConversation | undefined) ?? null);
  });
}

export async function listConversations(): Promise<StoredConversation[]> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onerror = () => reject(request.error ?? new Error('Could not list saved conversations.'));
      request.onsuccess = () => resolve((request.result as StoredConversation[]).sort(
        (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      ));
    });
  } finally {
    database.close();
  }
}

export async function loadConversation(id: string): Promise<StoredConversation | null> {
  const database = await openDatabase();
  try {
    return await readConversationRequest(database, id);
  } finally {
    database.close();
  }
}

export async function saveConversation(conversation: StoredConversation): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the conversation.'));
      transaction.oncomplete = () => resolve();
      transaction.objectStore(STORE_NAME).put(conversation);
    });
  } finally {
    database.close();
  }
}

export async function deleteConversation(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete the conversation.'));
      transaction.oncomplete = () => resolve();
      transaction.objectStore(STORE_NAME).delete(id);
    });
  } finally {
    database.close();
  }
}

export async function migrateLegacyActiveConversation(): Promise<StoredConversation | null> {
  const legacy = await loadConversation(LEGACY_ACTIVE_ID);
  if (!legacy) return null;

  const migrated: StoredConversation = {
    ...legacy,
    id: crypto.randomUUID(),
    title: getConversationTitle(legacy.messages),
    createdAt: legacy.createdAt || legacy.updatedAt,
  };
  await saveConversation(migrated);
  await deleteConversation(LEGACY_ACTIVE_ID);
  return migrated;
}

export function getConversationTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.text.trim();
  if (!firstUserMessage) return 'New conversation';
  return firstUserMessage.length > 52
    ? `${firstUserMessage.slice(0, 52).trim()}…`
    : firstUserMessage;
}
