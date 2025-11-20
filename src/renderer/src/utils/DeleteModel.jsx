import PropTypes from 'prop-types'

const DeleteModel = ({ isOpen, onClose, onConfirm, snippetTitle }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px' }}
      >
        <div className="modal-header">
          <h3>⚠️ Confirm Deletion</h3>
          <p className="text-content">Are you sure you want to delete this {snippetTitle}?</p>
        </div>
        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          <button className="btn-cancel default-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="default-button btn-delete"
            onClick={onConfirm}
            style={{ marginRight: 0 }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

DeleteModel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  snippetTitle: PropTypes.string
}

export default DeleteModel
