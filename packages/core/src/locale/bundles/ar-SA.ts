/**
 * @framesquared/core – ar-SA locale bundle
 */

import { Locale } from '../Locale.js';

export const arSA = new Locale({
  language: 'ar-SA',
  rtl: true,
  firstDayOfWeek: 6,
  numberFormat: { currency: 'SAR' },
  messages: {
    'btn.ok': 'موافق',
    'btn.cancel': 'إلغاء',
    'btn.yes': 'نعم',
    'btn.no': 'لا',
    'btn.save': 'حفظ',
    'btn.close': 'إغلاق',
    'btn.apply': 'تطبيق',
    'btn.reset': 'إعادة تعيين',

    'grid.noData': 'لا توجد بيانات للعرض',
    'grid.loading': 'جاري التحميل...',
    'grid.page': 'صفحة {page} من {total}',
    'grid.pageSize': 'عناصر في الصفحة',

    'validation.required': 'هذا الحقل مطلوب',
    'validation.minLength': 'الحد الأدنى للطول هو {min} حرفًا',
    'validation.maxLength': 'الحد الأقصى للطول هو {max} حرفًا',
    'validation.email': 'هذا ليس عنوان بريد إلكتروني صالحًا',
    'validation.range': 'يجب أن تكون القيمة بين {min} و {max}',
    'validation.format': 'تنسيق غير صالح',

    'datepicker.months.0': 'يناير',
    'datepicker.months.1': 'فبراير',
    'datepicker.months.2': 'مارس',
    'datepicker.months.3': 'أبريل',
    'datepicker.months.4': 'مايو',
    'datepicker.months.5': 'يونيو',
    'datepicker.months.6': 'يوليو',
    'datepicker.months.7': 'أغسطس',
    'datepicker.months.8': 'سبتمبر',
    'datepicker.months.9': 'أكتوبر',
    'datepicker.months.10': 'نوفمبر',
    'datepicker.months.11': 'ديسمبر',

    'datepicker.days.0': 'الأحد',
    'datepicker.days.1': 'الإثنين',
    'datepicker.days.2': 'الثلاثاء',
    'datepicker.days.3': 'الأربعاء',
    'datepicker.days.4': 'الخميس',
    'datepicker.days.5': 'الجمعة',
    'datepicker.days.6': 'السبت',

    'datepicker.daysShort.0': 'أحد',
    'datepicker.daysShort.1': 'إثن',
    'datepicker.daysShort.2': 'ثلا',
    'datepicker.daysShort.3': 'أرب',
    'datepicker.daysShort.4': 'خمي',
    'datepicker.daysShort.5': 'جمع',
    'datepicker.daysShort.6': 'سبت',

    'messagebox.alert.title': 'تنبيه',
    'messagebox.confirm.title': 'تأكيد',
    'messagebox.prompt.title': 'إدخال',

    'loading': 'جاري التحميل...',
    'error': 'خطأ',
  },
});
