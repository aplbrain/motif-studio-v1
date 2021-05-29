type MotifPayload = {
    motifText: string;
    savedDate: Date;
    name: string;
};

interface MotifStore {
    save(name: string, motif: MotifPayload): void;
    load(name: string): MotifPayload;
    delete(name: string): MotifPayload;
}

class LocalStorageMotifStore implements MotifStore {
    list(): MotifPayload[] {
        return Object.values(this._getFromLocalStorage());
    }
    dictionaryKey: string;

    constructor(dictionaryKey?: string) {
        this.dictionaryKey = dictionaryKey || "savedMotifs";
    }

    _getFromLocalStorage() {
        return (
            JSON.parse(localStorage.getItem(this.dictionaryKey) || "{}") || {}
        );
    }
    _saveToLocalStorage(payload: { [name: string]: MotifPayload }) {
        return localStorage.setItem(
            this.dictionaryKey,
            JSON.stringify(payload)
        );
    }

    save(name: string, motif: MotifPayload): void {
        let currentStore = this._getFromLocalStorage();
        currentStore[name] = motif;
        this._saveToLocalStorage(currentStore);
    }

    load(name: string): MotifPayload {
        let currentStore = this._getFromLocalStorage();
        return currentStore[name];
    }

    delete(name: string): MotifPayload {
        let currentStore = this._getFromLocalStorage();
        let payload = currentStore[name];
        delete currentStore[name];
        this._saveToLocalStorage(currentStore);
        return payload;
    }
}

export { LocalStorageMotifStore };
