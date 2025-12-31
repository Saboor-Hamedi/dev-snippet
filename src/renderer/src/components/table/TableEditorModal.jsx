import { useState, useEffect } from 'react'
import * as React from 'react'
import {
  Plus,
  Minus,
  MoveVertical,
  MoveHorizontal,
  Save,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import './TableEditorModal.css'

const TableEditorModal = ({ initialCode, onSave, onCancel }) => {
  const [grid, setGrid] = useState([])
  const [headers, setHeaders] = useState([])
  const [selectedIndex, setSelectedIndex] = useState({ type: null, index: -1 })

  const parseMarkdownTable = (md) => {
    if (!md) return { headers: ['', ''], rows: [['', '']] }
    const lines = md
      .trim()
      .split('\n')
      .filter((l) => l.includes('|'))
    if (lines.length < 2) return { headers: ['', ''], rows: [['', '']] }

    const extractCells = (line) =>
      line
        .split('|')
        .map((c) => c.trim())
        .filter((_, i, arr) => i > 0 && i < arr.length - 1)

    // Line 0: Headers
    const headers = extractCells(lines[0])
    // Line 1: Separators (ignore)
    // Line 2+: Rows
    const rows = lines.slice(2).map(extractCells)

    return { headers, rows }
  }

  const generateMarkdownTable = () => {
    const head = `| ${headers.join(' | ')} |`
    const sep = `| ${headers.map(() => '---').join(' | ')} |`
    const rows = grid.map((row) => `| ${row.join(' | ')} |`).join('\n')
    return `${head}\n${sep}\n${rows}`
  }

  useEffect(() => {
    const { headers, rows } = parseMarkdownTable(initialCode)
    setHeaders(headers)
    setGrid(rows)
  }, [initialCode])

  const updateCell = (rowIndex, colIndex, value) => {
    const newGrid = [...grid]
    newGrid[rowIndex][colIndex] = value
    setGrid(newGrid)
  }

  const updateHeader = (colIndex, value) => {
    const newHeaders = [...headers]
    newHeaders[colIndex] = value
    setHeaders(newHeaders)
  }

  const addRow = (index = grid.length - 1) => {
    const newGrid = [...grid]
    const newRow = new Array(headers.length).fill('')
    newGrid.splice(index + 1, 0, newRow)
    setGrid(newGrid)
    setSelectedIndex({ type: 'row', index: index + 1 })
  }

  const removeRow = (index) => {
    if (grid.length <= 1) return
    const newGrid = [...grid]
    newGrid.splice(index, 1)
    setGrid(newGrid)
    setSelectedIndex({ type: null, index: -1 })
  }

  const addColumn = (index = headers.length - 1) => {
    const newHeaders = [...headers]
    newHeaders.splice(index + 1, 0, `Col ${newHeaders.length + 1}`)
    setHeaders(newHeaders)

    const newGrid = grid.map((row) => {
      const newRow = [...row]
      newRow.splice(index + 1, 0, '')
      return newRow
    })
    setGrid(newGrid)
    setSelectedIndex({ type: 'col', index: index + 1 })
  }

  const removeColumn = (index) => {
    if (headers.length <= 1) return
    const newHeaders = [...headers]
    newHeaders.splice(index, 1)
    setHeaders(newHeaders)

    const newGrid = grid.map((row) => {
      const newRow = [...row]
      newRow.splice(index, 1)
      return newRow
    })
    setGrid(newGrid)
    setSelectedIndex({ type: null, index: -1 })
  }

  return (
    <div className="table-editor-modal">
      <div className="table-editor-toolbar">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn-action small"
            onClick={(e) => {
              e.currentTarget.blur()
              addRow()
            }}
          >
            <Plus size={14} /> Row
          </button>
          <button
            className="btn-action small"
            onClick={(e) => {
              e.currentTarget.blur()
              addColumn()
            }}
          >
            <Plus size={14} /> Col
          </button>
          {selectedIndex.type && (
            <button
              className="btn-action small danger"
              onClick={(e) => {
                e.currentTarget.blur()
                if (selectedIndex.type === 'row') removeRow(selectedIndex.index)
                else removeColumn(selectedIndex.index)
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
          <div className="toolbar-divider" />
          <span className="toolbar-hint">
            {selectedIndex.type
              ? `Focused ${selectedIndex.type} ${selectedIndex.index + 1}`
              : 'Select a cell to focus'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-cancel small" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-save small"
            onClick={(e) => {
              e.currentTarget.blur()
              onSave(generateMarkdownTable())
            }}
          >
            <Save size={14} /> Apply
          </button>
        </div>
      </div>

      <div className="table-editor-scroller">
        <table className="visual-table">
          <thead>
            <tr>
              <th className="control-cell"></th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={
                    selectedIndex.type === 'col' && selectedIndex.index === i
                      ? 'focused-header'
                      : ''
                  }
                  onClick={() => setSelectedIndex({ type: 'col', index: i })}
                >
                  <div className="cell-content">
                    <input
                      value={h}
                      onChange={(e) => updateHeader(i, e.target.value)}
                      placeholder="Header"
                    />
                    <div className="col-controls">
                      <button
                        title="Add Column Right"
                        onClick={(e) => {
                          e.stopPropagation()
                          addColumn(i)
                        }}
                      >
                        <Plus size={10} />
                      </button>
                      <button
                        title="Remove Column"
                        className="danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeColumn(i)
                        }}
                      >
                        <Minus size={10} />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, ri) => (
              <tr
                key={ri}
                className={
                  selectedIndex.type === 'row' && selectedIndex.index === ri ? 'focused-row' : ''
                }
              >
                <td
                  className="control-cell"
                  onClick={() => setSelectedIndex({ type: 'row', index: ri })}
                >
                  <div className="row-controls">
                    <button
                      title="Add Row Below"
                      onClick={(e) => {
                        e.stopPropagation()
                        addRow(ri)
                      }}
                    >
                      <Plus size={10} />
                    </button>
                    <button
                      title="Remove Row"
                      className="danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRow(ri)
                      }}
                    >
                      <Minus size={10} />
                    </button>
                  </div>
                </td>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    onClick={() => {
                      // Optional: can focus on click
                    }}
                  >
                    <textarea value={cell} onChange={(e) => updateCell(ri, ci, e.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TableEditorModal
