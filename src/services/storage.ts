import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import { ClassificationResult, CrackClass, SavedClassification, StructureType } from '../types';

const DATABASE_NAME = 'crack_detector.db';
const IMAGE_DIRECTORY = 'classification-images/';

interface ClassificationRow {
  id: string;
  class: CrackClass;
  corrected_class: CrackClass | null;
  corrected_at: number | null;
  confidence: number;
  all_probabilities: string;
  image_uri: string;
  structure_type: StructureType;
  timestamp: number;
}

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME).then(async db => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS classifications (
          id TEXT PRIMARY KEY NOT NULL,
          class TEXT NOT NULL,
          corrected_class TEXT,
          corrected_at INTEGER,
          confidence REAL NOT NULL,
          all_probabilities TEXT NOT NULL,
          image_uri TEXT NOT NULL,
          structure_type TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_classifications_timestamp
        ON classifications(timestamp DESC);
      `);

      return db;
    });
  }

  return databasePromise;
}

export async function saveClassification(
  result: ClassificationResult
): Promise<SavedClassification> {
  const db = await getDatabase();
  const id = `${result.timestamp}_${Math.random().toString(36).slice(2, 8)}`;
  const imageUri = await persistImage(result.imageUri, id);
  const saved: SavedClassification = {
    ...result,
    id,
    imageUri,
  };

  await db.runAsync(
    `INSERT INTO classifications (
      id,
      class,
      corrected_class,
      corrected_at,
      confidence,
      all_probabilities,
      image_uri,
      structure_type,
      timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    saved.id,
    saved.class,
    saved.correctedClass ?? null,
    saved.correctedAt ?? null,
    saved.confidence,
    JSON.stringify(saved.allProbabilities),
    saved.imageUri,
    saved.structureType,
    saved.timestamp
  );

  return saved;
}

export async function getClassifications(): Promise<SavedClassification[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ClassificationRow>(
    `SELECT *
     FROM classifications
     ORDER BY timestamp DESC`
  );

  return rows.map(rowToClassification);
}

export async function updateClassification(
  id: string,
  updates: Partial<ClassificationResult>
): Promise<SavedClassification | null> {
  const db = await getDatabase();
  const existing = await db.getAllAsync<ClassificationRow>(
    'SELECT * FROM classifications WHERE id = ? LIMIT 1',
    id
  );
  const current = existing[0];

  if (!current) return null;

  const merged = {
    ...rowToClassification(current),
    ...updates,
    id,
  };

  await db.runAsync(
    `UPDATE classifications
     SET class = ?,
         corrected_class = ?,
         corrected_at = ?,
         confidence = ?,
         all_probabilities = ?,
         image_uri = ?,
         structure_type = ?,
         timestamp = ?
     WHERE id = ?`,
    merged.class,
    merged.correctedClass ?? null,
    merged.correctedAt ?? null,
    merged.confidence,
    JSON.stringify(merged.allProbabilities),
    merged.imageUri,
    merged.structureType,
    merged.timestamp,
    id
  );

  return merged;
}

export async function deleteClassification(id: string): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getAllAsync<ClassificationRow>(
    'SELECT * FROM classifications WHERE id = ? LIMIT 1',
    id
  );

  await db.runAsync('DELETE FROM classifications WHERE id = ?', id);

  const imageUri = existing[0]?.image_uri;
  if (imageUri) {
    await deleteAsync(imageUri, { idempotent: true });
  }
}

function rowToClassification(row: ClassificationRow): SavedClassification {
  return {
    id: row.id,
    class: row.class,
    correctedClass: row.corrected_class ?? undefined,
    correctedAt: row.corrected_at ?? undefined,
    confidence: row.confidence,
    allProbabilities: JSON.parse(row.all_probabilities),
    imageUri: row.image_uri,
    structureType: row.structure_type,
    timestamp: row.timestamp,
  };
}

async function persistImage(sourceUri: string, id: string): Promise<string> {
  if (!documentDirectory) {
    throw new Error('Document directory is not available on this device.');
  }

  const targetDirectory = `${documentDirectory}${IMAGE_DIRECTORY}`;
  const targetUri = `${targetDirectory}${id}.${getImageExtension(sourceUri)}`;
  const existing = await getInfoAsync(targetUri);

  if (existing.exists) return targetUri;

  await makeDirectoryAsync(targetDirectory, { intermediates: true });
  await copyAsync({
    from: sourceUri,
    to: targetUri,
  });

  return targetUri;
}

function getImageExtension(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  const extension = match?.[1]?.toLowerCase();

  if (extension === 'jpeg' || extension === 'jpg') return 'jpg';
  if (extension === 'png') return 'png';
  if (extension === 'heic') return 'heic';
  return 'jpg';
}
