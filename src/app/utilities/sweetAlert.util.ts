import Swal from 'sweetalert2/src/sweetalert2.js';

declare var window;

export const showAlert = async (
  title: string,
  mensaje: any,
  tipo: 'success' | 'error' | 'warning' | 'info',
  event: string = ''
): Promise<boolean> => {


  setLoadingVisible();

  return new Promise(async (resolve) => {
    await Swal.fire({
      title: title,
      html:
        "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" +
        mensaje.replaceAll('\n', '<br>').replaceAll('\\n', '<br>') +
        '</div>',
      icon: tipo,
      showCancelButton: false,
      confirmButtonColor: getButtonColor(tipo),
      confirmButtonText: 'Aceptar',
    }).then((result) => {
      // Ejecutamos el evento si es necesario
      if (event) {
        eval(event);
      }
      

      resolve(true);
    });
  });
};

export const showAlertConfirm = async (
  title: string,
  mensaje: any,
  tipo: 'success' | 'error' | 'warning' | 'info' | 'question'
): Promise<boolean> => {
  
  setLoadingVisible();

  return new Promise(async (resolve) => {
    const result = await Swal.fire({
      title: title,
      html:
        "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" +
        mensaje.replaceAll('\n', '<br>').replaceAll('\\n', '<br>') +
        '</div>',
      icon: tipo,
      showCancelButton: true,
      confirmButtonColor: '#2196F3',
      confirmButtonText: 'Aceptar',
      cancelButtonText:'Cancelar'
    });


    // Si el usuario hizo clic en "Aceptar", resolvemos con `true`, de lo contrario, con `false`
    if (result.isConfirmed) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
};

const setLoadingVisible = () => {
  if(window.home !== undefined){
    if(window.home.loadingVisible !== undefined){
          window.home.loadingVisible = false;
    }
  }
}

const getButtonColor = (
  tipo: 'success' | 'error' | 'warning' | 'info'
): string => {
  switch (tipo) {
    case 'error':
      return '#d33';
    case 'warning':
      return '#ff9800';
    case 'success':
      return '#4CAF50';
    case 'info':
      return '#2196F3';
    default:
      return '';
  }
};
