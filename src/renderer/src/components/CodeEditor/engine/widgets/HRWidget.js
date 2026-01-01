import { WidgetType } from '@codemirror/view'

export class HRWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement('hr')
    hr.className = 'cm-md-hr'
    return hr
  }
}
