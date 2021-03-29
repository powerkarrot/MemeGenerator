import { Injectable, TemplateRef} from '@angular/core'

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts: any[] = []

    show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
        this.toasts.push({textOrTpl, ...options})
    }

    remove(toast) {
        this.toasts = this.toasts.filter(t => t !== toast)
    }

    showStandard(message) {
        this.show(message);
      }

    showSuccess(message, delay = 5000) {
        this.show(message, { classname: 'bg-success text-light', delay: delay })
    }

    showDanger(message, delay = 10000) {
        this.show(message, { classname: 'bg-danger text-light', delay: delay });
      }
}