import React, { useEffect } from 'react';
import '../componentCss/modal.css'

type LinkTransferModalProps = {
  visible: boolean,
  onDismiss: () => void
}

const LinkTransferModal = ({ visible, onDismiss }: LinkTransferModalProps) => {
  useEffect(() => {
    const container = document.querySelector(".link_modal") as HTMLElement
    if(visible){
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
  }, [visible])

  const onInput = (e: React.SyntheticEvent) => {
    window.electron.setURL((e.target as HTMLInputElement).value || "")
  }

  return (
    <div className='modal link_modal'>
      <div className="modal_background" onClick={onDismiss}></div>
      <div className="modal_box">
        <div className="modal_box_content">
          <div className="message">Add a link</div>
          <input type="text" name="" id="link_input" onInput={onInput}/>
        </div>
      </div>
    </div>
  );
};

export default LinkTransferModal;
