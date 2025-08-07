import { Component, OnInit } from '@angular/core';
import { EnumAccion, FrmperfilclienteService } from './frmperfilcliente.service';
import { varUser } from 'src/app/config/url.servicios';
import { formatDate } from '@angular/common';
import Swal from 'sweetalert2/src/sweetalert2.js';


interface Catalogo {
  codigo: any;
  descripcion: string;
}

@Component({
  selector: 'app-frmperfilcliente',
  templateUrl: './frmperfilcliente.component.html',
  styleUrl: './frmperfilcliente.component.scss'
})
export class FrmperfilclienteComponent implements OnInit {
  title = 'Parametrización de Perfil de Cliente';
  loadingVisible: boolean = false;

  accion: EnumAccion = EnumAccion.Insertar;
  pcl_id: number = null;
  cmbTipoParametro: string = 'GR';
  cmbGrupo: string = null;
  cmbPais: string = null;
  cmbDestino: string = null;
  cmbCliente: string = null;
  txtPaletsSulfito: number = 0;
  txtPaletsAusenciaVibrios: number = 0;
  chkMixPermanente: boolean = false;
  chkMixTemporal: boolean = false;
  chkPermiteElegirDestino: boolean = false;

  TiposParametrizacion: Catalogo[] = [
    { codigo: 'GR', descripcion: 'GRUPO' },
    { codigo: 'PA', descripcion: 'PAIS' },
    { codigo: 'CL', descripcion: 'CLIENTE' },
    { codigo: 'DE', descripcion: 'CLIENTE - DESTINO' },
  ];
  Grupos: Catalogo[] = [
    { codigo: 'CHI', descripcion: 'CHINA' },
    { codigo: 'EEU', descripcion: 'ESTADOS UNIDOS' },
    { codigo: 'MIX', descripcion: 'MIXES' },
    { codigo: 'OTR', descripcion: 'OTROS' },
  ];
  Paises: Catalogo[] = [];
  Destinos: Catalogo[] = [];
  Clientes: Catalogo[] = [];


  constructor(
    private _service: FrmperfilclienteService
  ) {

  }

  ngOnInit(): void {
    this.onClickNuevo();
    this.loadCatalogos();
  }



  onClickNuevo(): void {
    this.accion = EnumAccion.Insertar;
    this.pcl_id = null;
    this.cmbGrupo = null;
    this.cmbPais = null;
    this.cmbDestino = null;
    this.cmbCliente = null;
    this.txtPaletsSulfito = 0;
    this.txtPaletsAusenciaVibrios = 0;
    this.chkMixPermanente = false;
    this.chkMixTemporal = false;
    this.chkPermiteElegirDestino = false;
  }

  limpiar(tipo: string): void {
    this.accion = EnumAccion.Insertar;
    this.pcl_id = null;
    this.txtPaletsSulfito = 0;
    this.txtPaletsAusenciaVibrios = 0;
    this.chkMixPermanente = false;
    this.chkMixTemporal = false;
    this.chkPermiteElegirDestino = false;
    switch (tipo) {
      case 'grupo':
        this.cmbPais = null;
        this.cmbDestino = null;
        this.cmbCliente = null;
        break;
      case 'pais':
        this.cmbGrupo = null;
        this.cmbDestino = null;
        this.cmbCliente = null;
        break;
      case 'cliente':
        this.cmbGrupo = null;
        this.cmbPais = null;
        this.cmbDestino = null;
        break;
      case 'destino':
        this.cmbGrupo = null;
        this.cmbPais = null;
        break;
      default:
        this.cmbGrupo = null;
        this.cmbPais = null;
        this.cmbDestino = null;
        this.cmbCliente = null;
        break;
    }
  }


  loadCatalogos(): void {
    this.loadingVisible = true;
    this._service.getCatalogosPlanificacionEmbarque().subscribe({
      next: (data) => {
        if (data.Codigo) {
          if (data.Dt.Table1.length > 0) {
            this.Paises = data.Dt.Table1.map((item: any) => {
              return {
                codigo: item.codigo,
                descripcion: item.descripcion,
              };
            });
          }
          if (data.Dt.Table2.length > 0) {
            this.Destinos = data.Dt.Table2.map((item: any) => {
              return {
                codigo: item.codigo,
                descripcion: item.descripcion,
              };
            });
          }
          if (data.Dt.Table3.length > 0) {
            this.Clientes = data.Dt.Table3.map((item: any) => {
              return {
                codigo: item.codigo,
                descripcion: item.descripcion,
              };
            });
          }
        }
        else {
          throw new Error(data.Description);
        }
      },
      error: (error) => {
        console.error('', error);
      },
      complete: () => {
        this.loadingVisible = false;
      }
    });
  }

  onClickGuardar(): void {

    // if (this.cmbTipoParametro === '' || this.cmbGrupo === '' || this.cmbPais === '' || this.cmbDestino === '' || this.cmbCliente === '') {
    //   alert('Por favor, complete todos los campos obligatorios.');
    //   return;
    // }

    const parametros = {
      pcl_id: this.accion === EnumAccion.Actualizar ? this.pcl_id : null,
      tipo: this.cmbTipoParametro,
      grupo: this.cmbGrupo,
      pais: this.cmbPais,
      destino: this.cmbDestino,
      cliente: this.cmbCliente,
      paletsSulfito: this.txtPaletsSulfito,
      paletsAusenciaVibrios: this.txtPaletsAusenciaVibrios,
      permiteMix: this.chkMixPermanente,
      permiteMixTemp: this.chkMixTemporal,
      permiteElegirDestino: this.chkPermiteElegirDestino,
      fechaMixTemp: this.chkMixTemporal ? formatDate(new Date(), 'yyyy-MM-dd', 'en-US') : null, 
      userAud: localStorage.getItem(varUser),
    };

    this.loadingVisible = true;
    this._service.postPerfilCliente(parametros, this.accion).subscribe({
      next: (data) => {
        if (data.Codigo) {
          this.showAlert('', 'Perfil de cliente guardado exitosamente.', 'success');
          this.onClickNuevo();
        } else {
          throw new Error(data.Description);
        }
      },
      error: (error) => {
        console.error('', error);
        this.showAlert('Error', error.error ? error.error : 'Error al guardar el perfil de cliente.', 'error');
      },
      complete: () => {
        this.loadingVisible = false;
      }
    });
  }

  loadPerfilCliente(perfil: any): void {
    this.accion = EnumAccion.Actualizar;
    this.pcl_id = perfil.pcl_id ? parseInt(perfil.pcl_id, 10) : null;
    this.cmbPais = perfil.pcl_pais;
    this.cmbDestino = perfil.pcl_destino;
    this.cmbCliente = perfil.pcl_cliente;
    this.txtPaletsSulfito = perfil.pcl_paletsSulfito ? parseInt(perfil.pcl_paletsSulfito, 10) : 0;
    this.txtPaletsAusenciaVibrios = perfil.pcl_paletsAusenciaVibrios ? parseInt(perfil.pcl_paletsAusenciaVibrios, 10) : 0;
    this.chkMixPermanente = perfil.pcl_permiteMix ? true : false;
    this.chkMixTemporal = perfil.pcl_permiteMixTemp ? true : false;
    this.chkPermiteElegirDestino = perfil.pcl_permiteElegirDestino ? true : false;
  }

  onChangeTipoParametro(e: any): void {
    this.cmbTipoParametro = e;
    this.limpiar('');
  }

  onChangeGrupo(e: any): void {
    this.cmbGrupo = e;
    this.limpiar('grupo');
    this._service.getPerfilClienteByParams({
      tipo: this.cmbTipoParametro,
      grupo: this.cmbGrupo,
    }).subscribe(
      (data) => {
        if (data.Codigo && data.Dt.Table.length > 0) {
          const perfilDt: any[] = data.Dt.Table;
          this.loadPerfilCliente(perfilDt[0]);
        } else {
          this.limpiar('grupo');
        }
      }
    );
  }

  onChangePais(e: any): void {
    this.cmbPais = e;
    this.limpiar('pais');
    this._service.getPerfilClienteByParams({
      tipo: this.cmbTipoParametro,
      pais: this.cmbPais,
    }).subscribe(
      (data) => {
        if (data.Codigo && data.Dt.Table.length > 0) {
          const perfilDt: any[] = data.Dt.Table;
          this.loadPerfilCliente(perfilDt[0]);
        } else {
          this.limpiar('pais');
        }
      }
    );
  }


  onChangeCliente(e: any): void {
    this.cmbCliente = e;
    this.limpiar('cliente');
    this._service.getPerfilClienteByParams({
      tipo: this.cmbTipoParametro,
      cliente: this.cmbCliente,
    }).subscribe(
      (data) => {
        if (data.Codigo && data.Dt.Table.length > 0) {
          const perfilDt: any[] = data.Dt.Table;
          this.loadPerfilCliente(perfilDt[0]);
        } else {
          this.limpiar('cliente');
        }
      }
    );
  }

  onChangeDestino(e: any): void {
    this.cmbDestino = e;
    this.limpiar('destino');
    this._service.getPerfilClienteByParams({
      tipo: this.cmbTipoParametro,
      cliente: this.cmbCliente,
      destino: this.cmbDestino,
    }).subscribe(
      (data) => {
        if (data.Codigo && data.Dt.Table.length > 0) {
          const perfilDt: any[] = data.Dt.Table;
          this.loadPerfilCliente(perfilDt[0]);
        } else {
          this.limpiar('destino');
        }
      }
    );
  }


  async showAlert(title, mensaje, tipo, event = null) {
    this.loadingVisible = false;
    return new Promise(async (resolve) => {
      await Swal.fire({
        title: title,
        html: "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" + mensaje.replaceAll('\n','<br>').replaceAll('\\n','<br>') + "</div>",
        icon: tipo,
        showCancelButton: false,
        confirmButtonColor: (tipo === 'error' ? '#d33' : tipo === 'warning' ? '#ff9800' :
          tipo === 'success' ? '#4CAF50' : tipo === 'info' ? '#2196F3' : ''),
        confirmButtonText: 'Aceptar'
      }).then((result) => {
          if(event !== null){
            eval(event);
          }
          return resolve(true);
      });
    });
  }
  
}
