import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, CONNECTION_RRHH, URL_CONSULT, URL_CONSULTRRHH, URL_TRANSACIMAGEN } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';


const itemsMenu = [
  { text: 'Quitar de Planificación' },
  { text: 'Actualizar Fecha' },
  { text: 'Agregar Fecha Límite' },
  { text: 'Agregar Fecha Zarpe' },
  { text: 'Observación' },
  { text: 'Naviera/Nave' },
  { text: 'Pedido/Embarque' },
  { text: 'Masivo' },
  { text: 'Actualizar Fechas Zarpe por Nave' },
  { text: 'Actualizar Fechas Límite por Naviera/Nave' },
  { text: 'Aprobar Flete' },
  { text: 'Generación de Breakdown' },
  { text: 'Generación MIX Breakdown por Clientes' }
];

@Injectable({
  providedIn: 'root'
})

export class FrmplanificacionhorarioService {

  constructor(private http: HttpClient) { }

  getItemsMenuContext() {
    return itemsMenu;
  }

  getDataByMes = ({fecIni, fecFin, estado, cliente, pedidos, pais, continente}) => {
    const ListParam = [
      { "Name": "Desde", "Type": "VarChar", "Value": fecIni.toString() },
      { "Name": "Hasta", "Type": "VarChar", "Value": fecFin.toString() },
      { "Name": "Estado", "Type": "VarChar", "Value": estado.toString() },
      { "Name": "Cliente", "Type": "VarChar", "Value": cliente.toString() },
      { "Name": "Pedidos", "Type": "VarChar", "Value": pedidos.toString() },
      { "Name": "Pais", "Type": "VarChar", "Value": pais.toString() },
      { "Name": "Continente", "Type": "VarChar", "Value": continente.toString() },
    ];
    const base = {
      sp: 'SPE_PlanifEmbq_Mejorado_6',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  

}
