/**
 * ControlBar — Runtime configuration controls for examples.
 * Renders a compact panel of form controls that modify example behavior.
 */

export type ControlType = 'checkbox' | 'number' | 'select' | 'button' | 'slider' | 'text' | 'display';

export interface ControlDef {
  type: ControlType;
  label: string;
  field?: string;
  value?: unknown;
  min?: number;
  max?: number;
  options?: string[];
  handler?: () => void;
  id?: string;
}

export interface ControlGroup {
  title: string;
  controls: ControlDef[];
}

export type ControlChangeHandler = (field: string, value: unknown) => void;

export class ControlBar {
  private container: HTMLElement;
  private onchange: ControlChangeHandler;
  private displays: Map<string, HTMLElement> = new Map();

  constructor(container: HTMLElement, groups: ControlGroup[], onChange: ControlChangeHandler) {
    this.container = container;
    this.onchange = onChange;
    this.render(groups);
  }

  private render(groups: ControlGroup[]): void {
    this.container.innerHTML = '';
    this.container.className = 'control-bar';

    for (const group of groups) {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'control-group';
      const legend = document.createElement('legend');
      legend.textContent = group.title;
      fieldset.appendChild(legend);

      for (const ctrl of group.controls) {
        const item = this.createControl(ctrl);
        if (item) fieldset.appendChild(item);
      }
      this.container.appendChild(fieldset);
    }
  }

  private createControl(ctrl: ControlDef): HTMLElement | null {
    const wrap = document.createElement('div');
    wrap.className = 'control-item';

    switch (ctrl.type) {
      case 'checkbox': {
        const label = document.createElement('label');
        label.className = 'control-label';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = Boolean(ctrl.value);
        input.addEventListener('change', () => {
          this.onchange(ctrl.field!, input.checked);
        });
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + ctrl.label));
        wrap.appendChild(label);
        break;
      }
      case 'number': {
        const label = document.createElement('label');
        label.className = 'control-label';
        label.textContent = ctrl.label + ': ';
        const input = document.createElement('input');
        input.type = 'number';
        input.value = String(ctrl.value ?? 0);
        if (ctrl.min !== undefined) input.min = String(ctrl.min);
        if (ctrl.max !== undefined) input.max = String(ctrl.max);
        input.className = 'control-number';
        input.addEventListener('change', () => {
          this.onchange(ctrl.field!, Number(input.value));
        });
        label.appendChild(input);
        wrap.appendChild(label);
        break;
      }
      case 'slider': {
        const label = document.createElement('label');
        label.className = 'control-label';
        const valueSpan = document.createElement('span');
        valueSpan.textContent = String(ctrl.value ?? 0);
        label.textContent = ctrl.label + ': ';
        label.appendChild(valueSpan);
        const input = document.createElement('input');
        input.type = 'range';
        input.value = String(ctrl.value ?? 0);
        if (ctrl.min !== undefined) input.min = String(ctrl.min);
        if (ctrl.max !== undefined) input.max = String(ctrl.max);
        input.className = 'control-slider';
        input.addEventListener('input', () => {
          valueSpan.textContent = input.value;
          this.onchange(ctrl.field!, Number(input.value));
        });
        wrap.appendChild(label);
        wrap.appendChild(input);
        break;
      }
      case 'select': {
        const label = document.createElement('label');
        label.className = 'control-label';
        label.textContent = ctrl.label + ': ';
        const select = document.createElement('select');
        select.className = 'control-select';
        for (const opt of (ctrl.options ?? [])) {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          if (opt === ctrl.value) option.selected = true;
          select.appendChild(option);
        }
        select.addEventListener('change', () => {
          this.onchange(ctrl.field!, select.value);
        });
        label.appendChild(select);
        wrap.appendChild(label);
        break;
      }
      case 'button': {
        const btn = document.createElement('button');
        btn.className = 'control-btn';
        btn.textContent = ctrl.label;
        btn.addEventListener('click', () => ctrl.handler?.());
        wrap.appendChild(btn);
        break;
      }
      case 'text': {
        const label = document.createElement('label');
        label.className = 'control-label';
        label.textContent = ctrl.label + ': ';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = String(ctrl.value ?? '');
        input.className = 'control-text';
        input.addEventListener('input', () => {
          this.onchange(ctrl.field!, input.value);
        });
        label.appendChild(input);
        wrap.appendChild(label);
        break;
      }
      case 'display': {
        const label = document.createElement('div');
        label.className = 'control-display';
        label.textContent = ctrl.label + ': ';
        const span = document.createElement('span');
        span.className = 'control-display-value';
        span.textContent = String(ctrl.value ?? '—');
        if (ctrl.id) {
          span.id = ctrl.id;
          this.displays.set(ctrl.id, span);
        }
        label.appendChild(span);
        wrap.appendChild(label);
        break;
      }
      default:
        return null;
    }
    return wrap;
  }

  updateDisplay(id: string, value: string): void {
    const el = this.displays.get(id) ?? document.getElementById(id);
    if (el) el.textContent = value;
  }
}
