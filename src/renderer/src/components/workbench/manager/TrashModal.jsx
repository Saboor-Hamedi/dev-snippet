import React from 'react'
import PropTypes from 'prop-types'
import UniversalModal from '../../universal/UniversalModal'
import TrashSidebar from '../TrashSidebar'
import { Trash2 } from 'lucide-react'

const TrashModal = ({ 
  isOpen, 
  onClose, 
  items, 
  onRestore, 
  onPermanentDelete, 
  onLoadTrash,
  openDeleteModal 
}) => {
  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Trash2 size={14} className="text-red-500" />
          <span>Trash Bin</span>
        </div>
      }
      width="500px"
      height="80vh"
      className="trash-modal no-padding"
      customKey="trash_modal_position"
      hideHeaderBorder={true}
      hideBorder={true}
      allowMaximize={false}
      noTab={true}
      noRadius={true}
      isMaximized={false}
      borderRadius={false}
      resetPosition={false}
      allowResize={false}
    >
      <div className="h-full overflow-hidden">
        <TrashSidebar
          items={items}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
          onLoadTrash={onLoadTrash}
          openDeleteModal={openDeleteModal}
        />
      </div>
    </UniversalModal>
  )
}

TrashModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  items: PropTypes.array,
  onRestore: PropTypes.func.isRequired,
  onPermanentDelete: PropTypes.func.isRequired,
  onLoadTrash: PropTypes.func,
  openDeleteModal: PropTypes.func
}

export default TrashModal
