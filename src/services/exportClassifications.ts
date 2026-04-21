import JSZip from 'jszip';
import {
  cacheDirectory,
  EncodingType,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { CrackClass, SavedClassification } from '../types';
import { getDisplayClass } from '../utils/classification';

const EXPORT_CLASSES: CrackClass[] = ['flexural', 'shear', 'settlement', 'corrosion'];

interface ExportResult {
  fileUri: string;
  exportedCount: number;
  skippedCount: number;
}

export async function exportClassificationsZip(
  classifications: SavedClassification[]
): Promise<ExportResult> {
  if (!cacheDirectory) {
    throw new Error('Cache directory is not available on this device.');
  }

  const zip = new JSZip();

  EXPORT_CLASSES.forEach(className => {
    zip.folder(className);
  });

  let exportedCount = 0;
  let skippedCount = 0;

  for (const classification of classifications) {
    const className = getDisplayClass(classification);
    const folder = zip.folder(className);
    if (!folder) continue;

    const imageInfo = await getInfoAsync(classification.imageUri);
    if (!imageInfo.exists) {
      skippedCount += 1;
      continue;
    }

    let imageBase64: string;
    try {
      imageBase64 = await readAsStringAsync(classification.imageUri, {
        encoding: EncodingType.Base64,
      });
    } catch {
      skippedCount += 1;
      continue;
    }

    folder.file(buildFileName(classification, className), imageBase64, {
      base64: true,
    });
    exportedCount += 1;
  }

  const zipBase64 = await zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
  });
  const fileUri = `${cacheDirectory}crack-classifications-${Date.now()}.zip`;

  await writeAsStringAsync(fileUri, zipBase64, {
    encoding: EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      dialogTitle: 'Export crack classifications',
      mimeType: 'application/zip',
      UTI: 'com.pkware.zip-archive',
    });
  }

  return { fileUri, exportedCount, skippedCount };
}

function buildFileName(
  classification: SavedClassification,
  className: CrackClass
): string {
  const extension = getImageExtension(classification.imageUri);
  const timestamp = new Date(classification.timestamp)
    .toISOString()
    .replace(/[:.]/g, '-');

  return `${timestamp}_${className}_${classification.id}.${extension}`;
}

function getImageExtension(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  const extension = match?.[1]?.toLowerCase();

  if (extension === 'jpeg' || extension === 'jpg') return 'jpg';
  if (extension === 'png') return 'png';
  if (extension === 'heic') return 'heic';
  return 'jpg';
}
