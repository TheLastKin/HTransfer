import React, { useEffect } from 'react';
import '../componentCss/modal.css'

type ModalProps = {
  visible: boolean,
  message: string,
  hasBackdrop?: boolean,
  onBackdropClicked?: React.MouseEventHandler
}

const MessageModal = ({ visible, message, hasBackdrop = true, onBackdropClicked }: ModalProps) => {

  useEffect(() => {
    const modal = document.querySelector(".message_modal") as HTMLElement
    if(visible){
      modal.style.transition = ""
      modal.style.opacity = "1"
      modal.style.zIndex = "3"
    }else{
      modal.style.transition = "opacity 0.35s ease-out"
      modal.style.opacity = "0";
      modal.ontransitionend = () => {
        modal.style.zIndex = "-1"
      }
    }
  }, [visible])

  return (
    <div className='message_modal'>
      { hasBackdrop && <div className="modal_background" onClick={onBackdropClicked}></div> }
      <div className="message_box">
        <p className="message">{message}</p>
      </div>
    </div>
  );
};

export default MessageModal;
