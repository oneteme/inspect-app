import {Component, ComponentFactoryResolver, OnInit, ViewContainerRef} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {ComponentResolverService} from "./component-resolver.service";

@Component({
  template: '<ng-container #container></ng-container>'
})
export class DetailRequestView implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private componentResolver: ComponentResolverService,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const type = params.get('type');
      if (type) {
        const componentType = this.componentResolver.resolveComponent(type);
        this.loadComponent(componentType);
      }
    });
  }

  private loadComponent(componentType: any): void {
    this.viewContainerRef.clear();
    this.viewContainerRef.createComponent(componentType);
  }
}