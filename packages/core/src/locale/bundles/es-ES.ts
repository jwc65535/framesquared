/**
 * @framesquared/core – es-ES locale bundle
 */

import { Locale } from '../Locale.js';

export const esES = new Locale({
  language: 'es-ES',
  rtl: false,
  firstDayOfWeek: 1,
  numberFormat: { currency: 'EUR' },
  messages: {
    'btn.ok': 'Aceptar',
    'btn.cancel': 'Cancelar',
    'btn.yes': 'Sí',
    'btn.no': 'No',
    'btn.save': 'Guardar',
    'btn.close': 'Cerrar',
    'btn.apply': 'Aplicar',
    'btn.reset': 'Restablecer',

    'grid.noData': 'No hay datos para mostrar',
    'grid.loading': 'Cargando...',
    'grid.page': 'Página {page} de {total}',
    'grid.pageSize': 'Elementos por página',

    'validation.required': 'Este campo es obligatorio',
    'validation.minLength': 'La longitud mínima es de {min} caracteres',
    'validation.maxLength': 'La longitud máxima es de {max} caracteres',
    'validation.email': 'No es una dirección de correo válida',
    'validation.range': 'El valor debe estar entre {min} y {max}',
    'validation.format': 'Formato inválido',

    'datepicker.months.0': 'Enero',
    'datepicker.months.1': 'Febrero',
    'datepicker.months.2': 'Marzo',
    'datepicker.months.3': 'Abril',
    'datepicker.months.4': 'Mayo',
    'datepicker.months.5': 'Junio',
    'datepicker.months.6': 'Julio',
    'datepicker.months.7': 'Agosto',
    'datepicker.months.8': 'Septiembre',
    'datepicker.months.9': 'Octubre',
    'datepicker.months.10': 'Noviembre',
    'datepicker.months.11': 'Diciembre',

    'datepicker.days.0': 'Domingo',
    'datepicker.days.1': 'Lunes',
    'datepicker.days.2': 'Martes',
    'datepicker.days.3': 'Miércoles',
    'datepicker.days.4': 'Jueves',
    'datepicker.days.5': 'Viernes',
    'datepicker.days.6': 'Sábado',

    'datepicker.daysShort.0': 'Dom',
    'datepicker.daysShort.1': 'Lun',
    'datepicker.daysShort.2': 'Mar',
    'datepicker.daysShort.3': 'Mié',
    'datepicker.daysShort.4': 'Jue',
    'datepicker.daysShort.5': 'Vie',
    'datepicker.daysShort.6': 'Sáb',

    'messagebox.alert.title': 'Alerta',
    'messagebox.confirm.title': 'Confirmar',
    'messagebox.prompt.title': 'Aviso',

    loading: 'Cargando...',
    error: 'Error',
  },
});
