import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { varUser } from 'src/app/config/url.servicios';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { int } from '@zxing/library/esm/customTypings';
import * as moment from 'moment';

@Component({
  selector: 'app-frmlotesespeciales',
  // standalone: true,
  // imports: [CommonModule],
  templateUrl: './frmlotesespeciales.component.html',
  styleUrl: './frmlotesespeciales.component.scss'
})

export class FrmlotesespecialesComponent implements OnInit {

  loadingVisible: boolean = false;
  le_fecha : Date = new Date();
  le_numerolotes : number = 0;

  async ngOnInit() {

  }

  onChangeFecha(e: any) {

  }

}
