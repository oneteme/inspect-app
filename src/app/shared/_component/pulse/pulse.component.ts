import {Component, ElementRef, inject, Input, OnDestroy, signal, ViewChild} from "@angular/core";
import {DataGroup, DataItem, Timeline, TimelineOptions} from "vis-timeline";
import {TraceService} from "../../../service/trace.service";
import {debounceTime, fromEvent, map, merge, Subject, takeUntil} from "rxjs";
import {MainSession, RestSession} from "../../../model/trace.model";
import {DatePipe} from "@angular/common";
import {DurationPipe} from "../../pipe/duration.pipe";
import {EnvRouter} from "../../../service/router.service";

export interface Pulse {
  options: TimelineOptions;
  groups: DataGroup[];
  items: DataItem[];
}

@Component({
  selector: 'app-pulse',
  templateUrl: './pulse.component.html',
  styleUrls: ['./pulse.component.scss']
})
export class PulseComponent implements OnDestroy {
  private readonly _traceService: TraceService = inject(TraceService);
  private readonly $destroy = new Subject<void>();
  private readonly pipe = new DatePipe('fr-FR');
  private readonly durationPipe = new DurationPipe();
  private readonly _router: EnvRouter = inject(EnvRouter);

  @ViewChild('input', {static: true}) searchInput: ElementRef<HTMLInputElement>;

  private timeline: Timeline | null = null;
  private searchTerm = '';

  restSessions: Array<RestSession> = [];
  mainSessions: Array<MainSession> = [];

  options: TimelineOptions = {
    verticalScroll: true,
    orientation: "top",
    zoomKey: 'ctrlKey',
    maxHeight: 'calc(55vh - 40px - 44px - 0.5em)',
  };

  groups: DataGroup[];
  items: DataItem[];

  loading = signal(true);

  readonly skeletonRows = [
    { id: 1, width: 62 },
    { id: 2, width: 48 },
    { id: 3, width: 75 },
    { id: 4, width: 55 },
    { id: 5, width: 68 },
  ];

  params: Partial<{instance: string, instanceStart: Date, start: Date, end: Date}> = {}

  @Input() set data(value: {instance: string, instanceStart: Date, start: Date, end: Date}) {
    if(value.instance && value.start && value.end) {
      this.restSessions = [];
      this.mainSessions = [];
      this.groups = [];
      this.items = [];
      this.params = value;
      this.loadData();
    }
  };

  private loadData() {
    this.loading.set(true);
    const rest$ = this._traceService.getRestSessionsByInstance(
      this.params.instance, this.params.instanceStart, this.params.start, this.params.end
    ).pipe(map(sessions => ({ type: 'rest' as const, sessions })));

    const main$ = this._traceService.getMainSessionsByInstance(
      this.params.instance, this.params.instanceStart, this.params.start, this.params.end
    ).pipe(map(sessions => ({ type: 'main' as const, sessions })));

    merge(rest$.pipe(takeUntil(this.$destroy)), main$.pipe(takeUntil(this.$destroy))).subscribe({
      next: ({ type, sessions }) => {
        if (type === 'rest') {
          this.restSessions = sessions as Array<RestSession>;
        } else {
          this.mainSessions = sessions as Array<MainSession>;
        }
        this.applyFilter();
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }

  onTimelineCreate(timeline: Timeline) {
    this.timeline = timeline;

    timeline.on('doubleClick', (props: any)=> {
      if(props.item) {
        let id = props.item.split('_')[0];
        let type_session = props.item.split('_')[1];
        let type_main = props.item.split('_')[2];
        type_session == 'main' ? this._router.open(`#/session/${type_main}/${id}`, '_blank') : this._router.open(`#/session/${type_session}/${id}`, '_blank');
      }
    });

    // Écouter la barre de recherche
    fromEvent<InputEvent>(this.searchInput.nativeElement, 'input').pipe(
      debounceTime(200)
    ).subscribe(() => {
      this.searchTerm = this.searchInput.nativeElement.value.toLowerCase();
      this.applyFilter();
    });

    // Configurer et afficher les données déjà chargées
    timeline.setOptions({
      ...this.options,
      zoomMax: 1000 * 60 * 60,
      start: this.params.start,
      end: this.params.end,
      min: this.params.start,
      max: this.params.end
    });

    this.applyFilter();
  }

  applyFilter() {
    if (!this.timeline) return;
    const term = this.searchTerm;
    const allItems = this.getDataItems();
    const filteredItems = term
      ? allItems.filter(item =>
          (typeof item.content === 'string' && item.content.toLowerCase().includes(term)) ||
          (typeof item.title === 'string' && item.title.toLowerCase().includes(term))
        )
      : allItems;
    const activeGroupIds = new Set(filteredItems.map(item => item.group));
    const filteredGroups = this.getDataGroups().filter(g => activeGroupIds.has(g.id));
    this.timeline.setGroups(filteredGroups);
    this.timeline.setItems(filteredItems);
  }

  getDataGroups(): DataGroup[] {
    const restGroups = this.restSessions.map(s => ({id: s.threadName, start: s.start})); // Ajouter treeLevel et nestedGroups pour la hiérarchie
    const mainGroups = this.mainSessions.map(s => ({id: s.threadName, start: s.start}));
    return [...new Set([...restGroups, ...mainGroups].sort((a, b) => b.start - a.start).map(g => g.id))]
      .map(g => ({id: g, content: g}));
  }

  getDataItems(): DataItem[] {
    const restItems = defaultRestDataItems(this.restSessions, this.pipe, this.durationPipe);
    const mainItems = defaultMainDataItems(this.mainSessions, this.pipe, this.durationPipe)
    return [...restItems, ...mainItems];
  }
}

const defaultRestDataItems = (sessions: Array<RestSession>, pipe: DatePipe, durationPipe: DurationPipe): DataItem[] => {
  return sessions.map(s => {
    const isInProgress = !s.end;
    let end = s.end ? s.end * 1000 : new Date(new Date().setHours(23, 59, 59, 999)).getTime();
    let item: DataItem = {
      id: `${s.id}_rest`,
      group: s.threadName,
      start: s.start * 1000,
      end: end,
      title: `<span>${pipe.transform(new Date(s.start * 1000), 'HH:mm:ss.SSS')} - ${pipe.transform(new Date(end), 'HH:mm:ss.SSS')}</span>  (${durationPipe.transform({start: s.start, end: end / 1000})})<br><br>
<span><b>[${s.method}] ${s?.path ? s?.path : ''}<br>${s?.query ? '?' + s?.query : ''}</b></span>`,
      content: `[${s.method}] ${s?.name ? s?.name : ''}`,
      className: 'rest overflow'
    };
    item.type = item.end > item.start ? 'range' : 'point';
    if (isInProgress) {
      item.className += ' in-progress';
    }
    if (s.exception?.message || s.exception?.type) {
      item.className += ' error';
    }
    return item;
  });
}

const defaultMainDataItems = (sessions: Array<MainSession>, pipe: DatePipe, durationPipe: DurationPipe): DataItem[] => {
  return sessions.map(s => {
    const isInProgress = !s.end;
    let end = s.end ? s.end * 1000 : new Date(new Date().setHours(23, 59, 59, 999)).getTime();
    let item: DataItem = {
      id: `${s.id}_main`,
      group: s.threadName,
      start: s.start * 1000,
      end: end,
      title: `<span>${pipe.transform(new Date(s.start * 1000), 'HH:mm:ss.SSS')} - ${pipe.transform(new Date(end), 'HH:mm:ss.SSS')}</span>  (${durationPipe.transform({start: s.start, end: end / 1000})})<br><br>
<span><b>[${s.type}] ${s?.name ? s?.name : ''}</b></span>`,
      content: `[${s.type}] ${s?.name ? s?.name : ''}`,
      className: 'main overflow'
    };
    item.type = item.end > item.start ? 'range' : 'point';
    if (isInProgress) {
      item.className += ' in-progress';
    }
    if (s.exception?.message || s.exception?.type) {
      item.className += ' error';
    }
    return item;
  });
}