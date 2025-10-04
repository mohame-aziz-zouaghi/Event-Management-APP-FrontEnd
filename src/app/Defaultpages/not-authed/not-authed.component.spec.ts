import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotAuthedComponent } from './not-authed.component';

describe('NotAuthedComponent', () => {
  let component: NotAuthedComponent;
  let fixture: ComponentFixture<NotAuthedComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NotAuthedComponent]
    });
    fixture = TestBed.createComponent(NotAuthedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
