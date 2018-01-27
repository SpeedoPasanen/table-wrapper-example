export class TableDataCol {
    key: string;
    label: string;
    _type?: 'string' | 'number' | 'auto' = 'auto';
    style?: Object;
    constructor(key: string, label: string) {
        Object.assign(this, { key, label });
    }
}
