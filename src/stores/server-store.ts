import { StoreKeys } from "../types.js";
import PersistedStore from "./persisted-store.js";


class ServerStore extends PersistedStore<{ ids: Set<string>; }, { ids: Array<string>; }> {

    constructor() {
        super(StoreKeys.StoreStoreKey, 'Server id store');
    }

    protected override getDefaultValue() {
        return {
            ids: new Set<string>()
        };
    }
    protected override serializeValue(val: { ids: Set<string>; }): { ids: Array<string>; } {
        return {
            ids: [...val.ids]
        };
    }
    protected override deserializeValue(val: { ids: Array<string>; }): { ids: Set<string>; } {
        return {
            ids: new Set(val.ids)
        }
    }

    public push(id: string) {
        this.state?.ids.add(id);
    }
    public contains(id: string) {
        return this.state?.ids.has(id);
    }
}

export const serverStore = new ServerStore();