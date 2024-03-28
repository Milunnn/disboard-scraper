import { Actor } from "apify";
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
        // await Actor.setValue(this.persistKey, this.state);
        if (!this.state) return;
        await this.store?.setValue(this.persistKey, this.serializeValue(this.state));
    }

    private async load() {
        // const loadedState = await Actor.getValue(this.persistKey) as (T | null);
        const loadedState = await this.store?.getValue(this.persistKey) as (any | null);
        // this.state = loadedState || {...this.getDefaultValue()};
        this.state = (loadedState && this.deserializeValue(loadedState)) || this.getDefaultValue();

        // For logging purposes, write the correct thing
        console.log(`Store "${this.storeDescription}" initialized ${loadedState ? 'from persisted storage' : 'with default state'}`, this.state);
    }

    async initStore(kvStore: typeof keyValueStore, logIntervalMs = -1) {
        if (logIntervalMs > 0) {
            this.interval = setInterval(() => {
                console.log(`Store "${this.storeDescription}" state: `, this.state);
            }, logIntervalMs);
        }

        // Setup loss mitigation
        Actor.on('persistState', async () => {
            // Save the store data and unregister - seems like this handler is called at the end of each Actor run
            await this.save();
        });
        Actor.on('migrating', async () => {
            await this.save();

            if (this.interval) clearInterval(this.interval);
        });
        Actor.on('aborting', async () => {
            await this.save();

            if (this.interval) clearInterval(this.interval);
        });

        // Init the store
        this.store = kvStore;

        // Try to load the migration data (if exist) and fill the store object
        await this.load();
    }
}