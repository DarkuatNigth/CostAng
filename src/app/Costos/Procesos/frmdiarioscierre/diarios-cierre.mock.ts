import { DiariosCierreDTO, ResultWS } from './diarios-cierre';

/**
 * Cambiar a false cuando el endpoint real ya esté disponible.
 * Mientras esté en true el componente funciona sin consumir el backend
 * de diarios de cierre.
 */
export const USAR_MOCK_DIARIOS_CIERRE = false;

export const MOCK_PARAMETROS_DIARIOS_CIERRE: ResultWS<any> = {
  Codigo: true,
  Description: 'Parámetros mock cargados correctamente.',
  Dt: {
    Table: [
      { CODIGO: 2026, DESCRIPCION: '2026' },
    ],
    Table1: [
      { CODIGO: 1, DESCRIPCION: 'ENERO' },
      { CODIGO: 2, DESCRIPCION: 'FEBRERO' },
      { CODIGO: 3, DESCRIPCION: 'MARZO' },
      { CODIGO: 4, DESCRIPCION: 'ABRIL' },
      { CODIGO: 5, DESCRIPCION: 'MAYO' },
      { CODIGO: 6, DESCRIPCION: 'JUNIO' },
      { CODIGO: 7, DESCRIPCION: 'JULIO' },
      { CODIGO: 8, DESCRIPCION: 'AGOSTO' },
      { CODIGO: 9, DESCRIPCION: 'SEPTIEMBRE' },
      { CODIGO: 10, DESCRIPCION: 'OCTUBRE' },
      { CODIGO: 11, DESCRIPCION: 'NOVIEMBRE' },
      { CODIGO: 12, DESCRIPCION: 'DICIEMBRE' },
    ],
  },
};

/**
 * Mock de ENERO 2026 construido desde:
 * - 01-26 RETORNOS FORMATO DUMPIN.xlsx / DIARIOS
 * - 01-26 Tranfer Gastos Indirec Fabricación.xlsx / ENE
 *
 * La transferencia ya NO contiene un solo asiento.
 * Se incluyen los 16 bloques contables de ENE (filas 9 a 207),
 * cada uno con sus líneas Debe/Haber y con la precisión original
 * guardada en el archivo Excel.
 *
 * El backend real debe devolver datos; el cuadre se calcula en Angular.
 */
export const MOCK_DIARIOS_CIERRE_ENERO_2026: ResultWS<DiariosCierreDTO> = {
  Codigo: true,
  Description: 'Mock completo del cierre de enero 2026 cargado correctamente.',
  Dt: {
  "idGeneracion": 202601,
  "anio": 2026,
  "mes": 1,
  "periodoTexto": "ENERO 2026",
  "guardado": false,
  "estado": "PENDIENTE",
  "retornos": {
    "titulo": "Retorno de Contenedores",
    "mensaje": "ESTOS DIARIOS SE HACEN CUANDO RETORNAN LOS CONTENEDORES - tienen que cuadrar con el mismo valor",
    "diarios": [
      {
        "id": 1,
        "titulo": "DIARIO DE DEVOLUCION DE CONTENEDOR CHINA",
        "subtitulo": "# 2815848",
        "numeroDocumento": "N/C 001-002-000000819",
        "referencia": "REF S 4592 | FACT 001-004-000020782",
        "glosa": "P/R COSTO DE VENTA , N/C 001-002-000000819 A NOMBRE DE SEAFOOD TRADING CORPORATION RETORNO DE CONTENEDOR POR NO SER APROBADO POR LA AUTORIDAD COREANA DEBIDO A WS APLICA REF S 4592 FACT 001-004-000020782",
        "filas": [
          {
            "id": 1,
            "orden": 1,
            "codigo": "11471",
            "cuentaContable": "10120020001",
            "clave": null,
            "descripcion": "INV. TRANSITO PRODUCTO TERMINADO",
            "moneda": null,
            "debe": 85520.68,
            "haber": 0,
            "detalle": "el asiento en transito"
          },
          {
            "id": 2,
            "orden": 2,
            "codigo": "6607",
            "cuentaContable": "50701020001",
            "clave": null,
            "descripcion": "CAMARON ENTERO A",
            "moneda": null,
            "debe": 0,
            "haber": 85520.68,
            "detalle": "costo de la referencia con lo que yo lo vendi"
          },
          {
            "id": 3,
            "orden": 3,
            "codigo": null,
            "cuentaContable": "50701020002",
            "clave": null,
            "descripcion": "CAMARON ENTERO B",
            "moneda": null,
            "debe": 0,
            "haber": 0,
            "detalle": null
          }
        ]
      },
      {
        "id": 2,
        "titulo": "DIARIO 1 - RETORNO DE CONTENEDORES",
        "subtitulo": null,
        "numeroDocumento": "N/C 001-002-000000827",
        "referencia": "REF S 4588 | FACT 001-004-000020686",
        "glosa": "P/R RETORNO DE CONTENEDORES, N/C 001-002-000000827 A NOMBRE DE SEAFOOD TRADING CORPORATION RETORNO DE CONTENEDOR POR NO SER APROBADO POR LA AUTORIDAD COREANA DEBIDO A WS APLICA REF S 4588 FACT 001-004-000020686",
        "filas": [
          {
            "id": 4,
            "orden": 1,
            "codigo": "11471",
            "cuentaContable": "10120020001",
            "clave": null,
            "descripcion": "INV. TRANSITO PRODUCTO TERMINADO",
            "moneda": null,
            "debe": 0,
            "haber": 89333.8,
            "detalle": "asiento de recepcion"
          },
          {
            "id": 5,
            "orden": 2,
            "codigo": null,
            "cuentaContable": "10115010001",
            "clave": null,
            "descripcion": "PT CAMARON ENTERO A",
            "moneda": null,
            "debe": 89333.8,
            "haber": 0,
            "detalle": null
          },
          {
            "id": 6,
            "orden": 3,
            "codigo": null,
            "cuentaContable": "10115010005",
            "clave": null,
            "descripcion": "PT CAMARON ENTERO B",
            "moneda": null,
            "debe": 0,
            "haber": 0,
            "detalle": null
          }
        ]
      }
    ]
  },
  "transferenciaGif": {
    "titulo": "Transferencia Gastos Indirectos de Fabricación 2025",
    "periodoTexto": "Enero 2026",
    "baseCalculo": 12561775.0,
    "totalGastoIndirecto": 4865495.63,
    "diarios": [
      {
        "id": 1,
        "grupoLabel": "- 1 -",
        "descripcion": "REGISTRO TRANSF. DE GTOS. IND. FAB. A PRODUC. PROC. Enero 2026",
        "filas": [
          {
            "id": 1001,
            "orden": 1,
            "calculo": 0.14478935322085693,
            "origen": null,
            "codigo": "50301999999",
            "clave": "5364",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTO FAB. ENTERO A",
            "debe": 704471.9653666058,
            "haber": 0.0
          },
          {
            "id": 1002,
            "orden": 2,
            "calculo": 0.7402420257715264,
            "origen": null,
            "codigo": "50301999998",
            "clave": "6313",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTO FAB. ENTERO B",
            "debe": 3601644.3415337093,
            "haber": 0.0
          },
          {
            "id": 1003,
            "orden": 3,
            "calculo": 0.05683495337656825,
            "origen": null,
            "codigo": "50302999999",
            "clave": "5365",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTO FAB. COLA  A",
            "debe": 276530.2172849465,
            "haber": 0.0
          },
          {
            "id": 1004,
            "orden": 4,
            "calculo": 0.05813366763104848,
            "origen": null,
            "codigo": "50302999998",
            "clave": "6218",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTO FAB. COLA  B",
            "debe": 282849.10581473884,
            "haber": 0.0
          },
          {
            "id": 1005,
            "orden": 5,
            "calculo": 0,
            "origen": null,
            "codigo": "50302999997",
            "clave": "8317",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTO FAB. COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1006,
            "orden": 6,
            "calculo": 1,
            "origen": null,
            "codigo": "50499999999",
            "clave": "3971",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTOS FABRICACION",
            "debe": 0.0,
            "haber": 4865495.63
          }
        ],
        "mostrarCalculo": true,
        "mostrarOrigen": false
      },
      {
        "id": 2,
        "grupoLabel": "- 1 a -",
        "descripcion": "REGISTRO TRANSF. ENTERO A COLA SEGÚN FORMATO ADJUNTO",
        "filas": [
          {
            "id": 1007,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "50301999999",
            "clave": "5364",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTO FAB. ENTERO A",
            "debe": 0.0,
            "haber": 280057.5738133852
          },
          {
            "id": 1008,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "50301999998",
            "clave": "6313",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTO FAB. ENTERO B",
            "debe": 0.0,
            "haber": 1431806.8363497322
          },
          {
            "id": 1009,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "50302999999",
            "clave": "5365",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTO FAB. COLA  A",
            "debe": 846263.38113755,
            "haber": 0.0
          },
          {
            "id": 1010,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "50302999998",
            "clave": "6218",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTO FAB. COLA  B",
            "debe": 865601.0290255675,
            "haber": 0.0
          },
          {
            "id": 1011,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "50302999997",
            "clave": "8317",
            "nombreCuenta": "TRANSF. GASTOS INDIRECTO FAB. COLA  C",
            "debe": 0.0,
            "haber": 0.0
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 3,
        "grupoLabel": "- 1 b -",
        "descripcion": "REGISTRO TRANSF. ENTERO A COLA SEGÚN FORMATO ADJUNTO",
        "filas": [
          {
            "id": 1012,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10116020001",
            "clave": "48",
            "nombreCuenta": "GFD CAMARON ENTERO",
            "debe": 0.0,
            "haber": 280057.5738133852
          },
          {
            "id": 1013,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10116020005",
            "clave": "6314",
            "nombreCuenta": "GFD CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 1431806.8363497322
          },
          {
            "id": 1014,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10116020002",
            "clave": "49",
            "nombreCuenta": "GFD CAMARON COLA  A",
            "debe": 846263.38113755,
            "haber": 0.0
          },
          {
            "id": 1015,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10116020003",
            "clave": "50",
            "nombreCuenta": "GFD CAMARON COLA  B",
            "debe": 865601.0290255675,
            "haber": 0.0
          },
          {
            "id": 1016,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10116020006",
            "clave": "8318",
            "nombreCuenta": "GFD CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 4,
        "grupoLabel": "- 1 c -",
        "descripcion": "REGISTRO TRANSF. ENTERO A COLA SEGÚN FORMATO ADJUNTO",
        "filas": [
          {
            "id": 1017,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 280057.5738133852
          },
          {
            "id": 1018,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 1431806.8363497322
          },
          {
            "id": 1019,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 846263.38113755,
            "haber": 0.0
          },
          {
            "id": 1020,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 865601.0290255675,
            "haber": 0.0
          },
          {
            "id": 1021,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10115010009",
            "clave": "8315",
            "nombreCuenta": "PT CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 5,
        "grupoLabel": "- 2 -",
        "descripcion": "REGISTRO TRANSF. DE COSTO PRODUC A PRODUC. PROC. Enero 2026",
        "filas": [
          {
            "id": 1022,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10116020001",
            "clave": "48",
            "nombreCuenta": "GFD CAMARON ENTERO A",
            "debe": 1566613.217305081,
            "haber": 0.0
          },
          {
            "id": 1023,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10116020005",
            "clave": "6314",
            "nombreCuenta": "GFD CAMARON ENTERO B",
            "debe": 8089981.606144982,
            "haber": 0.0
          },
          {
            "id": 1024,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10116020002",
            "clave": "49",
            "nombreCuenta": "GFD CAMARON COLA  A",
            "debe": 632381.0366177968,
            "haber": 0.0
          },
          {
            "id": 1025,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10116020003",
            "clave": "50",
            "nombreCuenta": "GFD CAMARON COLA  B",
            "debe": 998472.7264979661,
            "haber": 0.0
          },
          {
            "id": 1026,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10116020006",
            "clave": "8318",
            "nombreCuenta": "GFD CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1027,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "10116020004",
            "clave": "51",
            "nombreCuenta": "GFD CAMARON V. AGREGADO A",
            "debe": 576384.2298827735,
            "haber": 0.0
          },
          {
            "id": 1028,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "10116020007",
            "clave": "8323",
            "nombreCuenta": "GFD CAMARON V. AGREGADO B",
            "debe": 697939.1064481091,
            "haber": 0.0
          },
          {
            "id": 1029,
            "orden": 8,
            "calculo": null,
            "origen": null,
            "codigo": "10116020008",
            "clave": "14900",
            "nombreCuenta": "GFD CAMARON V. AGREGADO C",
            "debe": 3.0810408278591446,
            "haber": 0.0
          },
          {
            "id": 1030,
            "orden": 9,
            "calculo": null,
            "origen": null,
            "codigo": "50399999997",
            "clave": "5368",
            "nombreCuenta": "TRANSF. PROD. PROC. ENTERO A - PROD.TERM.",
            "debe": 0.0,
            "haber": 1566613.217305081
          },
          {
            "id": 1031,
            "orden": 10,
            "calculo": null,
            "origen": null,
            "codigo": "50399999995",
            "clave": "6315",
            "nombreCuenta": "TRANSF. PROD. PROC. ENTERO B - PROD.TERM.",
            "debe": 0.0,
            "haber": 8089981.606144982
          },
          {
            "id": 1032,
            "orden": 11,
            "calculo": null,
            "origen": null,
            "codigo": "50399999998",
            "clave": "5367",
            "nombreCuenta": "TRANSF. PROD. PROC. COLA  A - PROD.TERM.",
            "debe": 0.0,
            "haber": 632381.0366177968
          },
          {
            "id": 1033,
            "orden": 12,
            "calculo": null,
            "origen": null,
            "codigo": "50399999996",
            "clave": "6219",
            "nombreCuenta": "TRANSF. PROD. PROC. COLA  B - PROD.TERM.",
            "debe": 0.0,
            "haber": 998472.7264979661
          },
          {
            "id": 1034,
            "orden": 13,
            "calculo": null,
            "origen": null,
            "codigo": "50399999994",
            "clave": "8319",
            "nombreCuenta": "TRANSF. PROD. PROC. COLA  C - PROD.TERM.",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1035,
            "orden": 14,
            "calculo": null,
            "origen": null,
            "codigo": "50399999999",
            "clave": "3098",
            "nombreCuenta": "TRANSF. PROD. PROC. V. AGREGADO A- PROD.TERM.",
            "debe": 0.0,
            "haber": 576384.2298827735
          },
          {
            "id": 1036,
            "orden": 15,
            "calculo": null,
            "origen": null,
            "codigo": "50399999993",
            "clave": "8320",
            "nombreCuenta": "TRANSF. PROD. PROC. V. AGREGADO B- PROD.TERM.",
            "debe": 0.0,
            "haber": 697939.1064481091
          },
          {
            "id": 1037,
            "orden": 16,
            "calculo": null,
            "origen": null,
            "codigo": "50399999100",
            "clave": "14907",
            "nombreCuenta": "TRANSF. PROD. PROC. V. AGREGADO C- PROD.TERM.",
            "debe": 0.0,
            "haber": 3.0810408278591446
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 6,
        "grupoLabel": "- 3 -",
        "descripcion": "REGISTRO TRANSF. DE COSTO PRODUC A PRODUC. TERMIN. Enero 2026",
        "filas": [
          {
            "id": 1038,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 1566613.217305081,
            "haber": 0.0
          },
          {
            "id": 1039,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 8089981.606144982,
            "haber": 0.0
          },
          {
            "id": 1040,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 632381.0366177968,
            "haber": 0.0
          },
          {
            "id": 1041,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 998472.7264979661,
            "haber": 0.0
          },
          {
            "id": 1042,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10115010009",
            "clave": "8315",
            "nombreCuenta": "PT CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1043,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 576384.2298827735,
            "haber": 0.0
          },
          {
            "id": 1044,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8322",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 697939.1064481091,
            "haber": 0.0
          },
          {
            "id": 1045,
            "orden": 8,
            "calculo": null,
            "origen": null,
            "codigo": "10115010011",
            "clave": "14899",
            "nombreCuenta": "PT CAMARON V. AGREGADO C",
            "debe": 3.0810408278591446,
            "haber": 0.0
          },
          {
            "id": 1046,
            "orden": 9,
            "calculo": null,
            "origen": null,
            "codigo": "10116990001",
            "clave": "56",
            "nombreCuenta": "TR CAMARON ENTERO A CR",
            "debe": 0.0,
            "haber": 1566613.217305081
          },
          {
            "id": 1047,
            "orden": 10,
            "calculo": null,
            "origen": null,
            "codigo": "10116990005",
            "clave": "1721",
            "nombreCuenta": "TR CAMARON ENTERO B CR",
            "debe": 0.0,
            "haber": 8089981.606144982
          },
          {
            "id": 1048,
            "orden": 11,
            "calculo": null,
            "origen": null,
            "codigo": "10116990002",
            "clave": "57",
            "nombreCuenta": "TR CAMARON COLA A  CR",
            "debe": 0.0,
            "haber": 632381.0366177968
          },
          {
            "id": 1049,
            "orden": 12,
            "calculo": null,
            "origen": null,
            "codigo": "10116990003",
            "clave": "58",
            "nombreCuenta": "TR CAMARON COLA B  CR",
            "debe": 0.0,
            "haber": 998472.7264979661
          },
          {
            "id": 1050,
            "orden": 13,
            "calculo": null,
            "origen": null,
            "codigo": "10116990006",
            "clave": "8321",
            "nombreCuenta": "TR CAMARON COLA C  CR",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1051,
            "orden": 14,
            "calculo": null,
            "origen": null,
            "codigo": "10116990004",
            "clave": "59",
            "nombreCuenta": "TR CAMARON V. AGREGADO A CR",
            "debe": 0.0,
            "haber": 576384.2298827735
          },
          {
            "id": 1052,
            "orden": 15,
            "calculo": null,
            "origen": null,
            "codigo": "10116990007",
            "clave": "8324",
            "nombreCuenta": "TR CAMARON V. AGREGADO B CR",
            "debe": 0.0,
            "haber": 697939.1064481091
          },
          {
            "id": 1053,
            "orden": 16,
            "calculo": null,
            "origen": null,
            "codigo": "10116990008",
            "clave": "14901",
            "nombreCuenta": "TR CAMARON V. AGREGADO C CR",
            "debe": 0.0,
            "haber": 3.0810408278591446
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 7,
        "grupoLabel": "- 4 -",
        "descripcion": "REGISTRO TRANSF. MATERIA PRIMA A PRODUC. EN PROC. Enero 2026",
        "filas": [
          {
            "id": 1054,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 9995855.04,
            "haber": 0.0
          },
          {
            "id": 1055,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 40490413.59,
            "haber": 0.0
          },
          {
            "id": 1056,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 4068973.4699999997,
            "haber": 0.0
          },
          {
            "id": 1057,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 3270300.05,
            "haber": 0.0
          },
          {
            "id": 1058,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10115010009",
            "clave": "8315",
            "nombreCuenta": "PT CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1059,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "10117990001",
            "clave": "1589",
            "nombreCuenta": "MP TRANFER CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 9995855.04
          },
          {
            "id": 1060,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "10117990005",
            "clave": "6316",
            "nombreCuenta": "MP TRANFER CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 40490413.59
          },
          {
            "id": 1061,
            "orden": 8,
            "calculo": null,
            "origen": null,
            "codigo": "10117990002",
            "clave": "1590",
            "nombreCuenta": "MP TRANFER CAMARON COLA  A",
            "debe": 0.0,
            "haber": 4068973.4699999997
          },
          {
            "id": 1062,
            "orden": 9,
            "calculo": null,
            "origen": null,
            "codigo": "10117990003",
            "clave": "6220",
            "nombreCuenta": "MP TRANFER CAMARON COLA  B",
            "debe": 0.0,
            "haber": 3270300.05
          },
          {
            "id": 1063,
            "orden": 10,
            "calculo": null,
            "origen": null,
            "codigo": "10117990006",
            "clave": "8316",
            "nombreCuenta": "MP TRANFER CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 8,
        "grupoLabel": "- 5 -",
        "descripcion": "REGISTRO MATERIA PRIMA IQF VAGREGADO A SHELLON Enero 2026",
        "filas": [
          {
            "id": 1064,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 172079.3897322563,
            "haber": 0.0
          },
          {
            "id": 1065,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 666448.9118683024,
            "haber": 0.0
          },
          {
            "id": 1066,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 306320.9548048128,
            "haber": 0.0
          },
          {
            "id": 1067,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1068,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10115010009",
            "clave": "8315",
            "nombreCuenta": "PT CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1069,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 0.0,
            "haber": 1144849.2564053715
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 9,
        "grupoLabel": "- 6 -",
        "descripcion": "REGISTRO REPROCESOS EN PLANTA SHELLON-VALOR AGREGADO Enero 2026",
        "filas": [
          {
            "id": 1070,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 1581198.260151016,
            "haber": 0.0
          },
          {
            "id": 1071,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 2356798.300924918,
            "haber": 0.0
          },
          {
            "id": 1072,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 10790254.148874056,
            "haber": 0.0
          },
          {
            "id": 1073,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 12334073.357579244,
            "haber": 0.0
          },
          {
            "id": 1074,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 103936.85152732687,
            "haber": 0.0
          },
          {
            "id": 1075,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8322",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 226272.6644580832,
            "haber": 0.0
          },
          {
            "id": 1076,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "10115010011",
            "clave": "14899",
            "nombreCuenta": "PT CAMARON V. AGREGADO C",
            "debe": 29.667045934483752,
            "haber": 0.0
          },
          {
            "id": 1077,
            "orden": 8,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 962664.1242140983
          },
          {
            "id": 1078,
            "orden": 9,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 0.0,
            "haber": 2108573.056446325
          },
          {
            "id": 1079,
            "orden": 10,
            "calculo": null,
            "origen": null,
            "codigo": "10115010009",
            "clave": "8315",
            "nombreCuenta": "PT CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1080,
            "orden": 11,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 10852526.4740651
          },
          {
            "id": 1081,
            "orden": 12,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 12916058.46782151
          },
          {
            "id": 1082,
            "orden": 13,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 0.0,
            "haber": 385862.9021360881
          },
          {
            "id": 1083,
            "orden": 14,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8322",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 0.0,
            "haber": 166799.03143821468
          },
          {
            "id": 1084,
            "orden": 15,
            "calculo": null,
            "origen": null,
            "codigo": "10115010011",
            "clave": "14899",
            "nombreCuenta": "PT CAMARON V. AGREGADO C",
            "debe": 0.0,
            "haber": 79.19443922272032
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 10,
        "grupoLabel": "- 7 -",
        "descripcion": "REGISTRO PROCESO DE VALOR AGREGADO Enero 2026",
        "filas": [
          {
            "id": 1085,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 3407859.8267587787
          },
          {
            "id": 1086,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 0.0,
            "haber": 2680662.0403130515
          },
          {
            "id": 1087,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 275343.1938233071
          },
          {
            "id": 1088,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 694257.4568216095
          },
          {
            "id": 1089,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 4136665.637536267,
            "haber": 274103.63840866345
          },
          {
            "id": 1090,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8322",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 3204932.9623331325,
            "haber": 9372.44374398852
          },
          {
            "id": 1091,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "10115010011",
            "clave": "14899",
            "nombreCuenta": "PT CAMARON V. AGREGADO C",
            "debe": 0.0,
            "haber": 0.0
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 11,
        "grupoLabel": "- 8 -a",
        "descripcion": "REGISTRO REPROCESO TRATADO Enero 2026",
        "filas": [
          {
            "id": 1092,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1093,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1094,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10115010009",
            "clave": "8315",
            "nombreCuenta": "PT CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1095,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1096,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1097,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1098,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8322",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1099,
            "orden": 8,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1100,
            "orden": 9,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1101,
            "orden": 10,
            "calculo": null,
            "origen": null,
            "codigo": "10115010009",
            "clave": "8315",
            "nombreCuenta": "PT CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1102,
            "orden": 11,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1103,
            "orden": 12,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1104,
            "orden": 13,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1105,
            "orden": 14,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8322",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 0.0,
            "haber": 0.0
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 12,
        "grupoLabel": "- 8 -",
        "descripcion": "REGISTRO OTROS PROCESOS DE CAMARA Enero 2026",
        "filas": [
          {
            "id": 1106,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 194.23748088850422
          },
          {
            "id": 1107,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 0.0,
            "haber": 143.02265377078965
          },
          {
            "id": 1108,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10115010009",
            "clave": "8315",
            "nombreCuenta": "PT CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1109,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 709.5982309661508
          },
          {
            "id": 1110,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 2789.3740813279155
          },
          {
            "id": 1111,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 0.0,
            "haber": 1148.9810080386524
          },
          {
            "id": 1112,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8322",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 0.0,
            "haber": 2284.6504836816293
          },
          {
            "id": 1113,
            "orden": 8,
            "calculo": null,
            "origen": null,
            "codigo": "10115010011",
            "clave": "14899",
            "nombreCuenta": "PT CAMARON V. AGREGADO C",
            "debe": 0.0,
            "haber": 30.535016819232034
          },
          {
            "id": 1114,
            "orden": 9,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1115,
            "orden": 10,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 331.3676493094837,
            "haber": 0.0
          },
          {
            "id": 1116,
            "orden": 11,
            "calculo": null,
            "origen": null,
            "codigo": "10115010009",
            "clave": "8315",
            "nombreCuenta": "PT CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1117,
            "orden": 12,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1118,
            "orden": 13,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 3397.6674970611152,
            "haber": 0.0
          },
          {
            "id": 1119,
            "orden": 14,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 3571.3638091222742,
            "haber": 0.0
          },
          {
            "id": 1120,
            "orden": 15,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8322",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 0.0,
            "haber": 0.0
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 13,
        "grupoLabel": "- 9 -",
        "descripcion": "REGISTRO COSTO VENTA EXPORTACION  ENTERO COLA  V AGREGA Enero 2026",
        "filas": [
          {
            "id": 1121,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "50701020001",
            "clave": "6607",
            "nombreCuenta": "CV CAMARON ENTERO A",
            "debe": 9563746.218276836,
            "haber": 0.0
          },
          {
            "id": 1122,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "50701020002",
            "clave": "6608",
            "nombreCuenta": "CV CAMARON ENTERO B",
            "debe": 43403792.62834164,
            "haber": 0.0
          },
          {
            "id": 1123,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "50701020003",
            "clave": "6609",
            "nombreCuenta": "CV CAMARON COLA  A",
            "debe": 1996448.1792587321,
            "haber": 0.0
          },
          {
            "id": 1124,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "50701020004",
            "clave": "6610",
            "nombreCuenta": "CV CAMARON COLA  B",
            "debe": 4049592.9551767833,
            "haber": 0.0
          },
          {
            "id": 1125,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "50701020007",
            "clave": "8365",
            "nombreCuenta": "CV CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1126,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "50701020005",
            "clave": "6611",
            "nombreCuenta": "CV CAMARON V AGREGADO A",
            "debe": 2789669.6901536826,
            "haber": 0.0
          },
          {
            "id": 1127,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "50701020006",
            "clave": "8325",
            "nombreCuenta": "CV CAMARON V AGREGADO B",
            "debe": 3356769.770341268,
            "haber": 0.0
          },
          {
            "id": 1128,
            "orden": 8,
            "calculo": null,
            "origen": null,
            "codigo": "50701020008",
            "clave": "14898",
            "nombreCuenta": "CV CAMARON V AGREGADO C",
            "debe": 15054.138613975814,
            "haber": 0.0
          },
          {
            "id": 1129,
            "orden": 9,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 9563746.218276836
          },
          {
            "id": 1130,
            "orden": 10,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 43403792.62834164
          },
          {
            "id": 1131,
            "orden": 11,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 1996448.1792587321
          },
          {
            "id": 1132,
            "orden": 12,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 0.0,
            "haber": 4049592.9551767833
          },
          {
            "id": 1133,
            "orden": 13,
            "calculo": null,
            "origen": null,
            "codigo": "10115010009",
            "clave": "8315",
            "nombreCuenta": "PT CAMARON COLA  C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1134,
            "orden": 14,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 0.0,
            "haber": 2789669.6901536826
          },
          {
            "id": 1135,
            "orden": 15,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8322",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 0.0,
            "haber": 3356769.770341268
          },
          {
            "id": 1136,
            "orden": 16,
            "calculo": null,
            "origen": null,
            "codigo": "10115010011",
            "clave": "14899",
            "nombreCuenta": "PT CAMARON V. AGREGADO C",
            "debe": 0.0,
            "haber": 15054.138613975814
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 14,
        "grupoLabel": "- 10 -",
        "descripcion": "REGISTRO COSTO VENTA LOCAL ENTERO COLA  V AGREGA Enero 2026",
        "filas": [
          {
            "id": 1137,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "50701030001",
            "clave": "6615",
            "nombreCuenta": "CV CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1138,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "50701030002",
            "clave": "6616",
            "nombreCuenta": "CV CAMARON ENTERO B",
            "debe": 1498848.6179707062,
            "haber": 0.0
          },
          {
            "id": 1139,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "50701030003",
            "clave": "6617",
            "nombreCuenta": "CV CAMARON COLA  A",
            "debe": 1677.2052188740201,
            "haber": 0.0
          },
          {
            "id": 1140,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "50701030004",
            "clave": "6618",
            "nombreCuenta": "CV CAMARON COLA  B",
            "debe": 17880.4673265502,
            "haber": 0.0
          },
          {
            "id": 1141,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "50701030005",
            "clave": "6619",
            "nombreCuenta": "CV CAMARON V AGREGADO A",
            "debe": 17180.094346763315,
            "haber": 0.0
          },
          {
            "id": 1142,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "50701030006",
            "clave": "8326",
            "nombreCuenta": "CV CAMARON V AGREGADO B",
            "debe": 22666.28427314616,
            "haber": 0.0
          },
          {
            "id": 1143,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1144,
            "orden": 8,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 1498848.6179707062
          },
          {
            "id": 1145,
            "orden": 9,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 1677.2052188740201
          },
          {
            "id": 1146,
            "orden": 10,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 0.0,
            "haber": 17880.4673265502
          },
          {
            "id": 1147,
            "orden": 11,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 0.0,
            "haber": 17180.094346763315
          },
          {
            "id": 1148,
            "orden": 12,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8322",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 0.0,
            "haber": 22666.28427314616
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      },
      {
        "id": 15,
        "grupoLabel": null,
        "descripcion": "REGISTRO DE MUESTRAS DE EXPORTACION Enero 2026",
        "filas": [
          {
            "id": 1149,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10115010011",
            "clave": null,
            "nombreCuenta": "PT CAMARON V. AGREGADO C",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1150,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1151,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10115010003",
            "clave": "38",
            "nombreCuenta": "PT CAMARON COLA  B",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1152,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1153,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 19775.53510013112
          },
          {
            "id": 1154,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "10115010004",
            "clave": "39",
            "nombreCuenta": "PT CAMARON V. AGREGADO A",
            "debe": 0.0,
            "haber": 17.754118304924894
          },
          {
            "id": 1155,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "10115010010",
            "clave": "8341",
            "nombreCuenta": "PT CAMARON V. AGREGADO B",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1156,
            "orden": 8,
            "calculo": null,
            "origen": null,
            "codigo": "50504010090",
            "clave": "7858",
            "nombreCuenta": "MUESTRAS Y OBSEQUIOS",
            "debe": 19775.53510013112,
            "haber": 0.0
          },
          {
            "id": 1157,
            "orden": 9,
            "calculo": null,
            "origen": "Hoja Costos.xls",
            "codigo": "50501020146",
            "clave": "6309",
            "nombreCuenta": "MUESTRAS INP",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1158,
            "orden": 10,
            "calculo": null,
            "origen": "Hoja_Costo_MP",
            "codigo": "50501020166",
            "clave": null,
            "nombreCuenta": "MUESTRAS FELVENZA",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1159,
            "orden": 11,
            "calculo": null,
            "origen": null,
            "codigo": "50501020169",
            "clave": "6905",
            "nombreCuenta": "MUESTRAS DE EXPORTACION",
            "debe": 17.754118304924894,
            "haber": 0.0
          },
          {
            "id": 1160,
            "orden": 12,
            "calculo": null,
            "origen": null,
            "codigo": "50501020148",
            "clave": "6311",
            "nombreCuenta": "MUESTRAS BSI",
            "debe": 0.0,
            "haber": 0.0
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": true
      },
      {
        "id": 16,
        "grupoLabel": "- 7 -",
        "descripcion": "REGISTRO PROCESO DE RETRACTILADO Enero 2026",
        "filas": [
          {
            "id": 1161,
            "orden": 1,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1162,
            "orden": 2,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 323156.730736555,
            "haber": 0.0
          },
          {
            "id": 1163,
            "orden": 3,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 412201.9867983244,
            "haber": 0.0
          },
          {
            "id": 1164,
            "orden": 4,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 0.0
          },
          {
            "id": 1165,
            "orden": 5,
            "calculo": null,
            "origen": null,
            "codigo": "10115010001",
            "clave": "36",
            "nombreCuenta": "PT CAMARON ENTERO A",
            "debe": 0.0,
            "haber": 323156.730736555
          },
          {
            "id": 1166,
            "orden": 6,
            "calculo": null,
            "origen": null,
            "codigo": "10115010005",
            "clave": "1605",
            "nombreCuenta": "PT CAMARON ENTERO B",
            "debe": 0.0,
            "haber": 412201.9867983244
          },
          {
            "id": 1167,
            "orden": 7,
            "calculo": null,
            "origen": null,
            "codigo": "10115010002",
            "clave": "37",
            "nombreCuenta": "PT CAMARON COLA  A",
            "debe": 0.0,
            "haber": 0.0
          }
        ],
        "mostrarCalculo": false,
        "mostrarOrigen": false
      }
    ]
  }
}
};

export const MOCK_CONFIRMAR_DIARIOS_CIERRE: ResultWS<any> = {
  Codigo: true,
  Description: 'Mock: diarios confirmados correctamente.',
  Dt: {
    estado: 'CONFIRMADO',
  },
};
