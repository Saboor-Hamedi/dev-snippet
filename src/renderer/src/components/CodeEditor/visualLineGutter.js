// visualLineGutter.js
import { useVisualLineNumberMarker } from './useVisualLineNumberMarker.js'
import * as viewModule from '@codemirror/view'

export const visualLineNumberGutter = useVisualLineNumberMarker(viewModule)
