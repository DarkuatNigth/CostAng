export interface InfoEmpleadoSupervisor{
    codigoEmpleado: string;
    turnoEmpleado: string;
    nombreEmpleado: string;
}

export interface ItemGruposSupervisor{
    codigoGrupo: number;
    nombreGrupo: string;
}

export interface ItemCentroCostosSupervisor{
    codigoCentroCosto: string;
    nombreCentroCosto: string;
}

export interface ItemTipoPermiso{
    codigoPermiso: number;
    nombrePermiso: string;
    validaSalidaPlanta: boolean;
    validaMarcacionProcesoTurno: boolean;
}


export interface RegistroPermisoEmpleado{
    codigoSupervisor: string;
    nombreSupervisor: string;
    turnoSupervisor: string;
    grupoSupervisor?: ItemGruposSupervisor;
    tipoPermisoSeleccionado?: ItemTipoPermiso;
    listaEmpleados: {codigoEmpleado: number, nombreEmpleado: string}[];
    horaCitaDispensario?: HoraCitaDispensario;
}

export interface ItemEmpleado{
    codigoEmpleado: string;
    nombreEmpleado: string;
    turno: string;
    centroCostoEmpleado: string;
    cargoEmpleado: string;
}

export interface ItemEmpleadosGrupoSupervisor extends ItemEmpleado{
    id?:number;
    credencialEmpleado? : string;
    centroCosto: string;
    grupo:string;
    horaCita?:string;
    tipoPermisoAnterior: string;
    horaSalida: string;
    permisoActivo: string;
}

export interface HoraCitaDispensario{

    horasdisponibles: string;
    id?:number;
    Horascita:string;
    observacion: string;
    fechaCita: string;
    cedula: string;
    trbCodigo: string;
    fechaHora:string;
}

export interface PermisoRegistrado{
    id: number;
    fecha:string;
    permiso: string;
    turno:string
}

export interface SupervisoresGrupo{
    id:number;
    fechaAsignacion: string;
    codigoSupervisor: string;
    nombreSupervisor: string;
    turno:string;
    codigoGrupoAsignado: string;
    grupoAsignado: string;
    observacion: string;
    estado: string;
}

export interface SupervisoresCentroCosto{
    id:number;
    fechaAsignacion: string;
    codigoSupervisor: string;
    nombreSupervisor: string;
    turno:string;
    codigoCentroCosto: string;
    centroCosto: string;
    aplicaJefe: string;
    observacion: string;
}
