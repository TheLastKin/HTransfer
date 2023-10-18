import React, { useEffect, useState } from 'react';
import '../componentCss/modal.css'
import { ImageInfo } from 'renderer/constant/types';

type TransferModalProps = {
  images: ImageInfo[]
}

const TransferModal = ({ images = [] }: TransferModalProps) => {
  const [modal, setModal] = useState({ visible: false, deviceName: "" })

  useEffect(() => {
    const modal = document.querySelector(".transfer_modal") as HTMLElement;
    const container = document.querySelector(".content") as HTMLElement;
    container.appendChild(modal)
    window.electron.onTransferRequest((e, deviceName) => {
      setModal({ visible: true, deviceName: deviceName })
    })
  }, [])

  useEffect(() => {
    const container = document.querySelector(".transfer_modal") as HTMLElement
    if(modal.visible){
      container.style.transition = ""
      container.style.opacity = "1"
      container.style.zIndex = "10"
    }else{
      container.style.transition = "opacity 0.35s ease-out"
      container.style.opacity = "0";
      container.ontransitionend = () => {
        container.style.zIndex = "-1"
      }
    }
  }, [modal])

  const handleSubmit = () => {
    window.electron.onTransferAccepted(images.map(i => i.path))
    setModal({...modal, visible: false});
  }

  const onCancel = () => {
    window.electron.onTransferDeclined()
    setModal({...modal, visible: false});
  }

  return (
    <div className='modal transfer_modal'>
      <div className="modal_background" onClick={onCancel}></div>
      <div className="modal_box">
        <div className="modal_box_content">
          <div className="message">{images.length} images will be transfer to your device ({modal.deviceName})</div>
          <div className='modal_actions'>
            <div className="submit_button" onClick={handleSubmit}>
              Confirm
            </div>
            <div className="cancel_button" onClick={onCancel}>
              Cancel
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
