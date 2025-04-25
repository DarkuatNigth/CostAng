import { TestBed } from '@angular/core/testing';

import { FrmplanificacionhorarioService } from './frmplanificacionhorario.service';

describe('FrmplanificacionhorarioService', () => {
  let service: FrmplanificacionhorarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FrmplanificacionhorarioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
