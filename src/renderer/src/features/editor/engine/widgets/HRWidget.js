import { WidgetType } from '@codemirror/view'

export class HRWidget extends WidgetType {
  ignoreEvent() {
    return false // Let CodeMirror handle clicks to reveal source
  }
  toDOM() {
    const hr = document.createElement('hr')
    hr.className = 'cm-md-hr'
    return hr
  }
}
