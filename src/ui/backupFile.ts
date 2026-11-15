// Browser helpers for saving and opening backup files (UI layer: uses browser APIs).
import { parseBackup, type Backup } from '../core/backup';

export function backupFileName(date = new Date()): string {
  const d = date.toISOString().slice(0, 10);
  return `liftr-backup-${d}.json`;
}

/**
 * Save the backup. On iPhone this opens the Share sheet ("Save to Files" → iCloud Drive);
 * elsewhere it downloads the file.
 */
export async function saveBackupFile(backup: Backup): Promise<'shared' | 'downloaded'> {
  const name = backupFileName();
  const json = JSON.stringify(backup, null, 2);
  const file = new File([json], name, { type: 'application/json' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Liftr backup' });
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err; // user cancelled
      // fall through to download
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

/** Read and validate a backup file the user picked. Throws BackupError with a friendly message. */
export async function readBackupFile(file: File): Promise<Backup> {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('That file isn’t a Liftr backup (it couldn’t be read).');
  }
  return parseBackup(data);
}
