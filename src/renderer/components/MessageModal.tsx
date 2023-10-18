import React, { useEffect, useContext } from 'react';
import '../componentCss/modal.css'
import { ModalContext } from 'renderer/constant/context';

const MessageModal = () => {
  const { modal, setModal } = useContext(ModalContext)

  useEffect(() => {
    const container = document.querySelector(".message_modal") as HTMLElement
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

  const onBackdropClicked = () => setModal({...modal, visible: false})

  const handleSubmit = () => {
    if(modal.onSubmit){
      modal.onSubmit();
      setModal({ ...modal, visible: false })
    }
  }

  return (
    <div className='modal message_modal'>
      <div className="modal_background" onClick={onBackdropClicked}></div>
      <div className="modal_box">
        <div className="modal_box_content">
          <p className="message">{modal.message}</p>
          { modal.onSubmit &&
            <div className='modal_actions'>
              <div className="submit_button" onClick={handleSubmit}>
                Confirm
              </div>
              <div className="cancel_button" onClick={onBackdropClicked}>
                Cancel
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
