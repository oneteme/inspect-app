import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstanceComponent } from './instance.component';

describe('InstanceComponent', () => {
  let component: InstanceComponent;
  let fixture: ComponentFixture<InstanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InstanceComponent]
    });
    fixture = TestBed.createComponent(InstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
