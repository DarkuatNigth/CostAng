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


export const showEditCostoModal = async (
  lote: string,
  valorActual: number
): Promise<{ nuevoCosto: number; razon: string } | null> => {
  
  setLoadingVisible();

  const result = await Swal.fire({
    title: `Editar Costo - Lote ${lote}`,
    html: `
   <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px; align-items: center; margin-top: 15px;">
        
        <label for="swal-input-costo" style="font-weight: bold; text-align: right;">Costo X Libra :</label>
        <input id="swal-input-costo" class="swal2-input" type="number" step="0.01" 
               value="${valorActual}" style="margin: 0; width: 100%;">
        
        <label for="swal-input-razon" style="font-weight: bold; text-align: right; align-self: start; margin-top: 15px;">Motivo cambio :</label>
        <textarea id="swal-input-razon" class="swal2-textarea" 
                  placeholder="Escriba la razón..." 
                  style="margin: 0; width: 100%; height: 80px;"></textarea>
                  
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2196F3',
    confirmButtonText: 'Guardar Cambios',
    cancelButtonText: 'Cancelar',
    width: '550px', // Un poco más ancho para que el grid respire
    focusConfirm: false,
    preConfirm: () => {
      const nuevoCosto = (document.getElementById('swal-input-costo') as HTMLInputElement).value;
      const razon = (document.getElementById('swal-input-razon') as HTMLTextAreaElement).value;

      if (!nuevoCosto || parseFloat(nuevoCosto) <= 0) {
        Swal.showValidationMessage('Por favor, ingrese un costo válido mayor a 0');
        return false;
      }
      if (!razon || razon.trim().length < 5) {
        Swal.showValidationMessage('Debe ingresar un motivo válido (mín. 5 caracteres)');
        return false;
      }

      return { nuevoCosto: parseFloat(nuevoCosto), razon: razon.trim() };
    }
  });

  return result.isConfirmed ? result.value : null;
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
