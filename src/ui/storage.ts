import type { Storage } from '../core/storage';
import { DexieStorage } from '../storage/dexieStorage';

/** The app's single storage instance. Swap this line to change storage backends. */
export const storage: Storage = new DexieStorage();
