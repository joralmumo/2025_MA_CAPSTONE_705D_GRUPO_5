import { Component, inject, Inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  WidthType,
  PageOrientation,
  convertInchesToTwip,
  BorderStyle,
  ShadingType,
  UnderlineType,
  Header,
  Footer,
  ImageRun
} from 'docx';
import { saveAs } from 'file-saver';
import { DecimalPipe } from '@angular/common';
import { jsPDF } from 'jspdf';
import {autoTable} from 'jspdf-autotable';
import { toast } from 'ngx-sonner';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Producto {
  producto: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  valorUnitario: number;
  total: number;
}

type productForm = FormGroup<{
  producto: FormControl<string>;
  descripcion: FormControl<string>;
  unidad: FormControl<string>;
  cantidad: FormControl<number>;
  valorUnitario: FormControl<number>;
}>;

type Form = FormGroup<{
  nro_cotizacion: FormControl<string>;
  nombre_empresa: FormControl<string>;
  telefono_empresa: FormControl<string>;
  rut_empresa: FormControl<string>;
  email_empresa: FormControl<string>;
  direccion_empresa: FormControl<string>;
  productos: FormArray<productForm>
  nombre_cliente: FormControl<string>;
  obra_cliente: FormControl<string>;
  contacto_cliente: FormControl<string>;
  email_cliente: FormControl<string>;
  direccion_cliente: FormControl<string>;
  fecha: FormControl<string>;
  validez_oferta: FormControl<string>;
  forma_pago: FormControl<string>;
  presupuesto_incluye: FormControl<string>;
  moneda: FormControl<string>;
  logo: FormControl<File | null>;
}>;

@Component({
  selector: 'app-cotizador',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './cotizador.component.html',
  styleUrl: './cotizador.component.css'
})

export class CotizadorComponent {
  title = 'COTIZADOR DE INSTACOTIZA';
  formBuilder = inject(NonNullableFormBuilder);
  get productosArray(): FormArray<productForm> {
    return this.form.get('productos') as FormArray<productForm>;
  }

  //MÉTODOS DE ICTZ-OFFLINE (EXPORTACION E IMPORTACION)
  exportar_cotizacion() {
    console.log('Exportando cotización como plantilla...');
    
    const formData = this.form.value;
    const datosParaExportar = { ...formData };
    delete datosParaExportar.logo;

    const plantilla = {
      nombre_plantilla: `Cotización_${formData.nro_cotizacion || 'Sin_Numero'}_Template`,
      fecha_creacion: new Date().toISOString(),
      version: '1.0',
      datos: datosParaExportar
    };

    const jsonString = JSON.stringify(plantilla, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_cotizacion_${formData.nro_cotizacion || 'borrador'}_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    console.log('Plantilla exportada exitosamente');
    toast.success('Plantilla exportada exitosamente', {
      style: { background: '#8b5cf6', color: 'white' }
    });
  }
  //sin toasts... sepa dios por qué no funcionan aquí
  importar_cotizacion() {   
    // input file oculto
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      
      if (file && file.type === 'application/json') {
        const reader = new FileReader();
        
        reader.onload = (e: any) => {
          try {
            const plantillaData = JSON.parse(e.target.result);
            
            // Validar estructura de la plantilla
            if (this.validarEstructuraPlantilla(plantillaData)) {
              this.cargarDatosEnFormulario(plantillaData.datos);
              toast.success('Plantilla importada y datos cargados en el formulario');
            } else {
              console.error('Estructura de plantilla inválida');
              toast.error('Estructura de plantilla inválida. Verifique el archivo.');
            }
            
          } catch (error) {
            console.error('Error al parsear JSON:', error);
            toast.error('Error al leer el archivo JSON. Asegúrese de que sea un archivo válido.');
          }
        };
        
        reader.readAsText(file);
      } else {
        toast.error('Por favor seleccione un archivo válido');
      }
      
      // Limpiar input
      document.body.removeChild(input);
    };
    
    // Agregar al DOM y hacer clic
    document.body.appendChild(input);
    input.click();
  }

  // validac/ del json
  private validarEstructuraPlantilla(plantilla: any): boolean {
    // Verificar estructura básica
    if (!plantilla || !plantilla.datos) {
      return false;
    }
    
    const datos = plantilla.datos;
    
    // campos de empresa
    const camposEmpresa = ['nro_cotizacion', 'nombre_empresa', 'telefono_empresa', 
                          'rut_empresa', 'email_empresa', 'direccion_empresa'];
    
    // campos de cliente  
    const camposCliente = ['nombre_cliente', 'obra_cliente', 'contacto_cliente',
                          'email_cliente', 'direccion_cliente'];
    
    // campos de condiciones
    const camposCondiciones = ['fecha', 'validez_oferta', 'forma_pago', 
                              'presupuesto_incluye', 'moneda'];
    
    const todosCampos = [...camposEmpresa, ...camposCliente, ...camposCondiciones];
    
    // Verificar que existan todod los campos
    for (const campo of todosCampos) {
      if (!(campo in datos)) {
        console.error(`Falta el campo: ${campo}`);
        return false;
      }
    }
    
    // Verificar que tenga productos
    if (!datos.productos || !Array.isArray(datos.productos)) {
      console.error('Falta array de productos');
      return false;
    }
    
    // Verificar estructura de productos
    for (const producto of datos.productos) {
      const camposProducto = ['producto', 'descripcion', 'unidad', 'cantidad', 'valorUnitario'];
      for (const campo of camposProducto) {
        if (!(campo in producto)) {
          console.error(`Falta el campo de producto: ${campo}`);
          return false;
        }
      }
    }
    
    return true;
  }

  // Cargar datos de la plantilla en el forms
  private cargarDatosEnFormulario(datos: any) {
    // Confirmar si el usuario quiere reemplazar los datos actuales
    const confirmar = confirm('¿Está seguro que desea cargar esta plantilla? Se reemplazarán todos los datos actuales de la cotización.');
    
    if (!confirmar) {
      return;
    }
    
    try {
      // Limpiar productos actuales (dejar solo uno vacío)
      while (this.productosArray.length > 1) {
        this.productosArray.removeAt(this.productosArray.length - 1);
      }
      
      // Cargar datos del formulario
      this.form.patchValue({
        nro_cotizacion: datos.nro_cotizacion || '',
        nombre_empresa: datos.nombre_empresa || '',
        telefono_empresa: datos.telefono_empresa || '',
        rut_empresa: datos.rut_empresa || '',
        email_empresa: datos.email_empresa || '',
        direccion_empresa: datos.direccion_empresa || '',
        nombre_cliente: datos.nombre_cliente || '',
        obra_cliente: datos.obra_cliente || '',
        contacto_cliente: datos.contacto_cliente || '',
        email_cliente: datos.email_cliente || '',
        direccion_cliente: datos.direccion_cliente || '',
        fecha: datos.fecha || '',
        validez_oferta: datos.validez_oferta || '',
        forma_pago: datos.forma_pago || '',
        presupuesto_incluye: datos.presupuesto_incluye || '',
        moneda: datos.moneda || 'CLP',
        logo: datos.logo || null
      });
      
      // Limpiar array de productos actual
      this.productosArray.clear();
      
      // Cargar productos
      if (datos.productos && datos.productos.length > 0) {
        datos.productos.forEach((producto: any) => {
          const productoForm = this.formBuilder.group({
            producto: this.formBuilder.control(producto.producto || '', ),
            descripcion: this.formBuilder.control(producto.descripcion || '', ),
            unidad: this.formBuilder.control(producto.unidad || '', ),
            cantidad: this.formBuilder.control(producto.cantidad || 0, [Validators.min(0)]),
            valorUnitario: this.formBuilder.control(producto.valorUnitario || 0, [Validators.min(0)])
          });
          
          this.productosArray.push(productoForm);
        });
      } else {
        // Si no hay productos, se coloca uno vacio
        this.productosArray.push(this.createProductForm());
      }
      
      console.log('Formulario actualizado con datos de la plantilla');
      
    } catch (error) {
      console.error('Error al cargar datos en el formulario:', error);
      alert('Error al cargar los datos de la plantilla en el formulario');
    }
  }

  //MÉTODOS DEL FORMULARIO!

  form: Form = this.formBuilder.group({
    nro_cotizacion: this.formBuilder.control('', ),
    nombre_empresa: this.formBuilder.control('', ),
    telefono_empresa: this.formBuilder.control('', [Validators.pattern('^[0-9]+$')]),
    rut_empresa: this.formBuilder.control('', ),
    email_empresa: this.formBuilder.control('', [Validators.email]),
    direccion_empresa: this.formBuilder.control('', ),
    productos: this.formBuilder.array<productForm>([this.createProductForm()]),
    nombre_cliente: this.formBuilder.control('', ),
    obra_cliente: this.formBuilder.control('', ),
    contacto_cliente: this.formBuilder.control('', ),
    email_cliente: this.formBuilder.control('', [Validators.email]),
    direccion_cliente: this.formBuilder.control('', ),
    fecha: this.formBuilder.control('', ),
    validez_oferta: this.formBuilder.control('', ),
    forma_pago: this.formBuilder.control('', ),
    presupuesto_incluye: this.formBuilder.control('', ),
    moneda: this.formBuilder.control('CLP', ),
    logo: this.formBuilder.control<File | null>(null)
  });

  createProductForm(): productForm {
    return this.formBuilder.group({
      producto: this.formBuilder.control('', ),
      descripcion: this.formBuilder.control('', ),
      unidad: this.formBuilder.control('', ),
      cantidad: this.formBuilder.control(0, [Validators.min(0)]),
      valorUnitario: this.formBuilder.control(0, [Validators.min(0)]),
    });
  }

  // total = cantidad * valorUnitario para las fila
  getTotal(index: number): number {
    const item = this.productosArray.at(index);
    if (!item) return 0;
    const cantidad = item.get('cantidad')?.value || 0;
    const valor = item.get('valorUnitario')?.value || 0;
    return cantidad * valor;
  }

  // subtotal = suma de (cantidad * valorUnitario) de todos los productos
  getSubtotal(): number {
    return this.productosArray.controls.reduce((acc, control) => {
      const cantidad = control.get('cantidad')?.value || 0;
      const valor = control.get('valorUnitario')?.value || 0;
      return acc + (cantidad * valor);
    }, 0);
  }

  // iva = subtotal * 0.19
  getIVA(): number {
    return this.getSubtotal() * 0.19;
  }

  // total cotización = subtotal + iva
  getTotalCotizacion(): number {
    return this.getSubtotal() + this.getIVA();
  }

  addProduct(){
    console.log('HAY CLICK!!!!');
    this.productosArray.push(this.createProductForm());
    console.log('NUEVO LARGO:', this.productosArray.length);
  }

  removeProduct(index: number){
    if(this.productosArray.length > 1){
      this.productosArray.removeAt(index);
    }
  }

  // FUNCION PARA GENERAR DOCX!!

  async generar_doc() {
    console.log('Generando DOC...');
    console.log('Form valid:', this.form.valid);
    console.log('Form errors:', this.form.errors);
    // debug para cachar si hay errores los campos
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control && control.invalid) {
        console.log(`Campo ${key} inválido:`, control.errors);
      }
    });
    
    // debug para cachar si hay errores en los productos
    const productosArray = this.form.get('productos') as FormArray;
    console.log('Productos array valid:', productosArray.valid);
    productosArray.controls.forEach((control, index) => {
      if (control.invalid) {
        console.log(`Producto ${index} inválido:`, control.errors);
        // errores específicos de cada campo del producto
        Object.keys((control as FormGroup).controls).forEach(fieldKey => {
          const fieldControl = control.get(fieldKey);
          if (fieldControl && fieldControl.invalid) {
            console.log(`  Campo ${fieldKey} inválido:`, fieldControl.errors);
          }
        });
      }
    });
    if (this.form.valid) {
      const formData = this.form.value;
      await this.createWordDocument(formData);
    } else {
      console.log('Formulario inválido');
      alert('Por favor, complete todos los campos requeridos.');
    }
  }

  private async createWordDocument(data: any) {
    // pre-procesar logo si existe (File -> ArrayBuffer)
    let logoBuffer: ArrayBuffer | null = null;
    try {
      if (data.logo && typeof (data.logo as any).arrayBuffer === 'function') {
        logoBuffer = await (data.logo as File).arrayBuffer();
      }
    } catch (e) {
      console.warn('No se pudo leer logo como ArrayBuffer:', e);
      logoBuffer = null;
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Aptos',
              size: 20 // equivale aprox 10pt (docx usa half-points)
            },
            paragraph: {
              spacing: { after: 120 }
            }
          }
        }
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: PageOrientation.PORTRAIT,
                width: convertInchesToTwip(8.5),
                height: convertInchesToTwip(11),
              },
              margin: {
                top: convertInchesToTwip(0.8),
                right: convertInchesToTwip(0.75),
                bottom: convertInchesToTwip(0.8),
                left: convertInchesToTwip(0.75),
              },
            }
          },

          // Header con tabla: info empresa (izquierda) + logo (derecha)
          headers: {
            default: new Header({
              children: [
                new Table({
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: data.nombre_empresa || '',
                                  bold: true,
                                  size: 20
                                })
                              ]
                            }),
                            new Paragraph(`RUT: ${data.rut_empresa || ''}`),
                            new Paragraph(`Tel: ${data.telefono_empresa || ''}`),
                            new Paragraph(`Email: ${data.email_empresa || ''}`),
                            new Paragraph(`Dirección: ${data.direccion_empresa || ''}`),
                          ],
                          width: { size: 60, type: WidthType.PERCENTAGE },
                          borders: { //cuchufleta, bordes blancos
                            top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF"  },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF"  },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF"  },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF"  },
                          },
                        }),
                        new TableCell({
                          children: [
                            // si hay logo, inserta imagen; sino espacio vacío
                            logoBuffer
                              ? new Paragraph({
                                  children: [
                                    // convierto arraybuffer a unit8array y casteo any para que no haya problemas con el tipeado de docx
                                    new ImageRun(({ data: new Uint8Array(logoBuffer), transformation: { width: 115, height: 59 } } as any))
                                  ],
                                  alignment: AlignmentType.RIGHT
                                })
                              : new Paragraph({ text: '' })
                          ],
                          width: { size: 40, type: WidthType.PERCENTAGE },
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF"  },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF"  },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF"  },
                          }
                        })
                      ]
                    })
                  ],
                  width: { size: 100, type: WidthType.PERCENTAGE }
                })
              ]
            })
          },

          // Footer con linea centrada similar a WinForms
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${data.nombre_empresa || ''} - ${data.rut_empresa || ''}`, italics: true }),
                    new TextRun({ text: '\n' }),
                    new TextRun({ text: `${data.email_empresa || ''} - ${data.telefono_empresa || ''}` })
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100 }
                })
              ]
            })
          },

          children: [
            // Espacio para que el header no solape 
            // new Paragraph({ text: '', spacing: { after: 400 } }),

            // TÍTULO principal
            new Paragraph({
              children: [
                new TextRun({
                  text: `Cotización N°${data.nro_cotizacion || ''}`,
                  bold: true,
                  size: 28
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),

            // Línea separadora
            new Paragraph({
              children: [new TextRun({ text: '____________________________', size: 20 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),

            // Subtítulo
            new Paragraph({
              children: [
                new TextRun({ text: 'Oferta Comercial', bold: true, italics: true, size: 20 })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),

            // Tabla info cliente
            this.tablaInfoCliente(data),

            new Paragraph({ text: '', spacing: { after: 400 } }),

            // Tabla productos (usa valores y estilos)
            this.tablaProductos(data.productos || [], data.moneda),

            new Paragraph({ text: '', spacing: { after: 400 } }),

            // Resumen precios alineado a la derecha
            this.ResumenPrecios(data.productos || [], data.moneda),

            new Paragraph({ text: '', spacing: { after: 400 } }),

            // Condiciones Comerciales
            new Paragraph({
              children: [
                new TextRun({ text: 'Condiciones Comerciales', bold: true, size: 22 })
              ],
              spacing: { after: 200 }
            }),

            new Paragraph({
              children: [
                new TextRun('Valores netos. No Incluyen IVA.'),
                new TextRun('\n'),
                new TextRun(`Validez Oferta: ${data.validez_oferta || ''}`),
                new TextRun('\n'),
                new TextRun(`Forma de Pago: ${data.forma_pago || ''}`),
                new TextRun('\n'),
                new TextRun(`El presupuesto incluye: ${data.presupuesto_incluye || ''}`)
              ]
            })
          ]
        }
      ]
    });

    this.descargarDoc(doc)
  }


  private tablaInfoCliente(data: any): Table {
    const azulClaro = "DCE6F1";

    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Fecha", bold: true })] })],
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: azulClaro },
              borders: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "4472C4" }
              }
            }),
            new TableCell({
              children: [new Paragraph(data.fecha || '')],
              width: { size: 70, type: WidthType.PERCENTAGE }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Cliente", bold: true })] })],
              shading: { type: ShadingType.CLEAR, color: "auto", fill: azulClaro }
            }),
            new TableCell({ children: [new Paragraph(data.nombre_cliente || '')] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Contacto", bold: true })] })],
              shading: { type: ShadingType.CLEAR, color: "auto", fill: azulClaro }
            }),
            new TableCell({ children: [new Paragraph(data.contacto_cliente || '')] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Obra", bold: true })] })],
              shading: { type: ShadingType.CLEAR, color: "auto", fill: azulClaro }
            }),
            new TableCell({ children: [new Paragraph(data.obra_cliente || '')] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Dirección Obra", bold: true })] })],
              shading: { type: ShadingType.CLEAR, color: "auto", fill: azulClaro }
            }),
            new TableCell({ children: [new Paragraph(data.direccion_cliente || '')] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Email", bold: true })] })],
              shading: { type: ShadingType.CLEAR, color: "auto", fill: azulClaro }
            }),
            new TableCell({ children: [new Paragraph(data.email_cliente || '')] })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "4472C4" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "4472C4" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "4472C4" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "4472C4" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" }
      }
    });
  }



  private tablaProductos(productos: any[], moneda: string): Table {
    const headerRow = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "ÍTEM", bold: true })], alignment: AlignmentType.CENTER })],
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "DCE6F1" }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "PRODUCTO", bold: true })], alignment: AlignmentType.CENTER })],
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "DCE6F1" }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "DESCRIPCIÓN", bold: true })], alignment: AlignmentType.CENTER })],
          width: { size: 42, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "DCE6F1" }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "UNID.", bold: true })], alignment: AlignmentType.CENTER })],
          width: { size: 7, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "DCE6F1" }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "CANT.", bold: true })], alignment: AlignmentType.CENTER })],
          width: { size: 7, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "DCE6F1" }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "VALOR UNIT.", bold: true })], alignment: AlignmentType.CENTER })],
          width: { size: 13, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "DCE6F1" }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })], alignment: AlignmentType.CENTER })],
          width: { size: 13, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "DCE6F1" }
        })
      ],
      tableHeader: true,
    });

    const productRows = (productos || []).map((producto, index) => {
      const total = (producto.cantidad || 0) * (producto.valorUnitario || 0);
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun(String(index + 1))], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph(producto.producto || '')] }),
          new TableCell({ children: [new Paragraph(producto.descripcion || '')] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(producto.unidad || '')], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(String(producto.cantidad || 0))], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(this.formatoMoneda(producto.valorUnitario || 0, moneda))], alignment: AlignmentType.RIGHT })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(this.formatoMoneda(total, moneda))], alignment: AlignmentType.RIGHT })] })
        ]
      });
    });

    const table = new Table({
      rows: [headerRow, ...productRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" }
      }
    });

    return table;
  }



  private ResumenPrecios(productos: any[], moneda: string): Table {
    const azulClaro = "DCE6F1";

    const subtotal = this.getSubtotal();
    const iva = this.getIVA();
    const total = this.getTotalCotizacion();

    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "NETO", bold: true })], alignment: AlignmentType.RIGHT })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: azulClaro }
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(this.formatoMoneda(subtotal, moneda))], alignment: AlignmentType.RIGHT })],
              width: { size: 60, type: WidthType.PERCENTAGE }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "IVA (19%):", bold: true })], alignment: AlignmentType.RIGHT })],
              shading: { type: ShadingType.CLEAR, color: "auto", fill: azulClaro }
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(this.formatoMoneda(iva, moneda))], alignment: AlignmentType.RIGHT })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })], alignment: AlignmentType.RIGHT })],
              shading: { type: ShadingType.CLEAR, color: "auto", fill: azulClaro }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: this.formatoMoneda(total, moneda), bold: true })],
                alignment: AlignmentType.RIGHT
              })]
            })
          ]
        })
      ],
      width: { size: 50, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.RIGHT,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" }
      }
    });
  }



  private formatoMoneda(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency === 'CLP' ? 'CLP' : 'USD',
      minimumFractionDigits: 0
    });
    return formatter.format(amount);
  }

  private descargarDoc(doc: Document) {
    // empacado del docx y descarga
    import('docx').then(({ Packer }) => {
      Packer.toBlob(doc).then(blob => {
        const formData = this.form.value;
        const fileName = `nro.${formData.nro_cotizacion}_${formData.nombre_cliente}_${formData.obra_cliente}.docx`;
        saveAs(blob, fileName);
        console.log('Documento generado exitosamente');
      }).catch(error => {
        console.error('Error al generar el documento:', error);
      });
    });
  }



}
