import { BehaviorSubject, Observable, Subject } from 'rxjs/Rx';
import { DataSource } from '@angular/cdk/collections';
import { TableDataCol } from './table-data-col';
import { MatSort } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

export class TableDataSource extends DataSource<any>  {
    cols: BehaviorSubject<TableDataCol[]> = new BehaviorSubject(null);
    data: BehaviorSubject<any[]> = new BehaviorSubject([]);
    summaries: BehaviorSubject<string[]> = new BehaviorSubject([]);
    columnKeys: BehaviorSubject<string[]> = new BehaviorSubject([]);
    private _sortChange: Subject<any> = new Subject();
    private _sort: MatSort;
    private _sortChangeSub: Subscription;
    get sort() { return this._sort; }
    set sort(s: MatSort) {
        this._sort = s;
        this.subscribeSort();
    }
    subscribeSort() {
        this.unsubscribeSort();
        if (this.sort) {
            this._sortChangeSub = this.sort.sortChange.subscribe(() => {
                this._sortChange.next();
            });
        }
    }
    unsubscribeSort() {
        if (this._sortChangeSub) {
            this._sortChangeSub.unsubscribe();
        }
        this._sortChangeSub = null;
    }
    connect(): Observable<Element[]> {
        this.subscribeSort();
        return Observable.merge(
            this.data,
            this._sortChange
        ).map(() => {
            return this.getSortedData();
        });
    }
    disconnect() {
        this.unsubscribeSort();
    }
    getSortedData(): any[] {
        const data = this.data.getValue().slice();
        if (!(this._sort && this._sort.active) || this._sort.direction === '') { return data; }

        return data.sort((a, b) => {
            let propertyA: number | string = '';
            let propertyB: number | string = '';
            [propertyA, propertyB] = [a[this._sort.active], b[this._sort.active]];
            const isNumeric = (!isNaN(+propertyA)) || (!isNaN(+propertyB));
            const valueA = isNaN(+propertyA) ? isNumeric ? 0 : propertyA : +propertyA;
            const valueB = isNaN(+propertyB) ? isNumeric ? 0 : propertyB : +propertyB;
            return (valueA < valueB ? -1 : 1) * (this._sort.direction !== 'asc' ? -1 : 1);
        });
    }
    /**
     * Sarakkeet ja data sisään
     * @param cols [{key: 'Propertyn nimi data-arrayn objekteissa', label: 'Otsikko'},...]
     * @param data [{ jokuKey: 123, ...}, ...]
     * @param summaries ['Yhteensä X kpl', 'Mikä vaan muu tekstirivi ennen taulukkoa']
     * @param columnKeys Optional: Näkyvät sarakkeet (niiden key:t arrayssa) ja järjestys, oletus: sama kuin cols, esim: ['name', 'weight', 'height']
     */
    next(cols: TableDataCol[], data: any[], summaries: string[] = [], columnKeys: string[] = null) {
        this.summaries.next(summaries);
        this.cols.next(cols);
        this.columnKeys.next(columnKeys || cols.map(col => col.key));
        this.data.next(data);
    }



    async getXls(fileName: string) {
        /* generate workbook and add the worksheet */
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(this.toAoa());
        XLSX.utils.book_append_sheet(wb, ws, 'Taulukko');
        /* save to file */
        const wbout: string = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        saveAs(new Blob([this.s2ab(wbout)]), `${fileName}.xlsx`);
    }
    private s2ab(s: string): ArrayBuffer {
        const buf: ArrayBuffer = new ArrayBuffer(s.length);
        const view: Uint8Array = new Uint8Array(buf);
        for (let i = 0; i !== s.length; ++i) { view[i] = s.charCodeAt(i) & 0xFF; }
        return buf;
    }
    private xlsValue(n: any) {
        if (n instanceof Date) {
            return moment(n).format('YYYY-MM-DD HH:mm').replace(/ 00:00$/, '');
        }
    }
    protected toAoa() {
        const cols = this.cols.getValue();
        const rows = this.data.getValue();
        return [cols.map(col => col.label), ...rows.map(row => cols.map(col => this.xlsValue(row[col.key])))];
    }

}
