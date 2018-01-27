import { Observable, Subscription } from 'rxjs/Rx';
import { TableDataSource } from './table-data-source';
import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { MatSort } from '@angular/material';
import * as $ from 'jquery';
import { TableDataCol } from './table-data-col';
@Component({
  selector: 'm-table-wrapper',
  templateUrl: './table-wrapper.component.html',
  styleUrls: ['./table-wrapper.component.css']
})
export class TableWrapperComponent implements OnInit, OnDestroy {
  @Input() scrollable = true;
  @Input() defaultSort = 'name';
  @Input() height = null;
  @ViewChild(MatSort) sort: MatSort;
  @Input() source: TableDataSource;
  @Output() rowClick: EventEmitter<{ row: any, col: TableDataCol }> = new EventEmitter();
  @Output() colClick: EventEmitter<TableDataCol> = new EventEmitter();
  private subs: Subscription[] = [];
  constructor(
    private elem: ElementRef,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.source = this.source || new TableDataSource();
    this.subs.push(this.source.summaries.subscribe(() => {
      this.updateHeight();
    }));
    this.subs.push(this.source.cols.subscribe(() => {
      this.cdRef.markForCheck();
    }));
    this.source.sort = this.sort;
    if (this.scrollable) {
      if (this.height) {
        this.setHeight(this.height);
      } else {
        this.subs.push(Observable.fromEvent(window, 'resize').debounceTime(300).subscribe(evt => {
          this.updateHeight();
        }));
        this.updateHeight();
      }
    }
  }
  rowClicked(row: any, col: any) {
    this.rowClick.emit({ row, col });
  }
  colClicked(col: any) {
    this.colClick.emit(col);
  }
  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }
  colTrackBy(index, item) {
    return item.key;
  }
  private get scrollElem() {
    return $(this.elem.nativeElement).find('.mat-table');
  }
  private updateHeight(ready = false) {
    if (!ready) {
      this.scrollElem.css({ 'height': 100 });
      return setTimeout(() => { this.updateHeight(true); }, 150);
    }
    this.scrollElem.css({ 'height': 'auto' });
    const padding = this.getPadding(this.scrollElem.parent());
    const h = Math.max(this.windowHeight(), $(document).height()) - padding - this.getOffset();
    this.setHeight(h - 80);
    this.cdRef.markForCheck();
  }
  private getPadding($elem, levelsDown = 0): number {
    if ((levelsDown > 5) || ($elem.is('body'))) {
      return 0;
    }
    const mt = 0;
    const mb = parseInt($elem.css('margin-bottom'));
    const pt = parseInt($elem.css('padding-top'));
    const pb = parseInt($elem.css('padding-bottom'));
    const result = mt + mb + pt + pb;
    return result + this.getPadding($elem.parent(), levelsDown + 1);
  }
  private setHeight(n: number) {
    this.scrollElem.css({ 'max-height': n });
  }
  private getOffset() {
    return this.scrollElem.offset().top;
  }
  private windowHeight(): number {
    return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  }

}
