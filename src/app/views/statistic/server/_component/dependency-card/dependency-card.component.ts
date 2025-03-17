import {Component, Input} from "@angular/core";

@Component({
  selector: 'dependency-card',
  templateUrl: './dependency-card.component.html',
  styleUrls: ['./dependency-card.component.scss']
})
export class DependencyCardComponent {

  _dependencies: {table: any[], loading: boolean} = {table: [], loading: true};
  _dependents: {table: any[], loading: boolean} = {table: [], loading: true};

  @Input() hasDependencies: boolean = true;

  @Input() set dependencies(objects: {table: any[], loading: boolean}) {
    this._dependencies = objects;
  }

  @Input() set dependents(objects: {table: any[], loading: boolean}) {
    this._dependents = objects;
  }

}