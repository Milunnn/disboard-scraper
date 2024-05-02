import { Actor, log } from "apify";
import type { keyValueStore } from "../main.js";

/**
 * For storing data in the persisted memory.
 */
export default abstract class PersistedStore<T extends {}, SerializedT extends {}> {

    state: T | null = null;
    private store: typeof keyValueStore | null = null;
    private interval: NodeJS.Timeout | null = null;
    
    constructor(private persistKey: string, private storeDescription: string) {
        
    }

    protected abstract getDefaultValue(): T;
    protected abstract serializeValue(val: T): SerializedT;
    protected abstract deserializeValue(val: SerializedT): T;

    private async save() {
        if (!this.state) return;
        await this.store?.setValue(this.persistKey, this.serializeValue(this.state));
    }

    private async load() {
        const loadedState = await this.store?.getValue(this.persistKey) as (SerializedT | null);
        this.state = (loadedState && this.deserializeValue(loadedState)) || this.getDefaultValue();

        // For logging purposes, write the correct thing
        log.info(`Store "${this.storeDescription}" initialized ${loadedState ? 'from persisted storage' : 'with default state'}`, this.state);
    }

    async initStore(kvStore: typeof keyValueStore, logIntervalMs = -1) {
        if (logIntervalMs > 0) {
            this.interval = setInterval(() => {
                log.info(`Store "${this.storeDescription}" state: `, this.state);
            }, logIntervalMs);
        }

        // Persist state
        Actor.on('persistState', async () => {
            await this.save();
        });
        Actor.on('migrating', async () => {
            await this.save();

            if (this.interval) {
                clearInterval(this.interval);
            }
        });
        Actor.on('aborting', async () => {
            await this.save();

            if (this.interval) {
                clearInterval(this.interval);
            }
        });

        // Init the store
        this.store = kvStore;

        // Try to load the migration data (if exist) and fill the store object
        await this.load();
    }
}