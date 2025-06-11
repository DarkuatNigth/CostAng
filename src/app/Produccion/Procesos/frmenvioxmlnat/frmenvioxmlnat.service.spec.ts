import { TestBed } from '@angular/core/testing';

import { FrmenvioxmlnatService } from './frmenvioxmlnat.service';

describe('FrmenvioxmlnatService', () => {
  let service: FrmenvioxmlnatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FrmenvioxmlnatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
