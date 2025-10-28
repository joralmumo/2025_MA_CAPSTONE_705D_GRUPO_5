//GPD: Interfaces para Get, put, delete
//P: Interfaces para Post

export interface IUsuarioGPD{
    id: number;
    nombre: string;
    correo: string;
    contrasena: string;
    rol: string;
    isactive: boolean;
    cotizaciones: ICotizacion[];
}

export interface IUsuarioP{
    nombre: string;
    correo: string;
    contrasena: string;
    rol: string;
    isactive: boolean;
    cotizaciones: ICotizacion[];
}

export interface ICotizacion{
  nro_cotizacion?: string;
  nombre_empresa?: string;
  telefono_empresa?: string;
  rut_empresa?: string;
  email_empresa?: string;
  direccion_empresa?: string;
  nombre_cliente?: string;
  obra_cliente?: string;
  contacto_cliente?: string;
  email_cliente?: string;
  direccion_cliente?: string;
  fecha?: string;
  validez_oferta?: string;
  forma_pago?: string;
  presupuesto_incluye?: string;
  moneda?: string;
  productos: IProducto[];
  logo?: File | null;
  fecha_creacion?: Date;
}

export interface IProducto {
  producto?: string;
  descripcion?: string;
  unidad?: string;
  cantidad?: number;
  valorUnitario?: number;
}