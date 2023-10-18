import React, { useEffect, useState } from 'react';
import { Tag, UniqueTag, getBackgroundColor } from 'renderer/constant/types';
import '../componentCss/modal.css'

type UpdateTagModalProps = {
  visible: boolean,
  type: string,
  initialTag: UniqueTag,
  onSubmit: (tag: Tag) => void,
  onCancel: () => void
}

const UpdateTagModal = ({ visible, type, initialTag, onSubmit, onCancel }: UpdateTagModalProps) => {
  const [tag, setTag] = useState<UniqueTag>(initialTag)
  const [errorText, setErrorText] = useState("")

  useEffect(() => {
    setTag(initialTag)
    setErrorText("")
  }, [initialTag])

  useEffect(() => {
    const container = document.querySelector(".update_tag_modal") as HTMLElement
    if(visible){
      container.style.transition = ""
      container.style.opacity = "1"
      container.style.zIndex = "5"
    }else{
      container.style.transition = "opacity 0.35s ease-out"
      container.style.opacity = "0";
      container.ontransitionend = () => {
        container.style.zIndex = "-1"
      }
    }
  }, [visible])

  const handleSubmit = () => {
    if(type === "update"){
      if(tag.name.length !== 0 && !/[^a-zA-Z0-9\s()]/g.test(tag.name)){
        onSubmit(tag)
      }else{
        setErrorText("Must contains at least 2 characters and no special characters")
      }
    }else{
      onSubmit(tag)
    }
  }

  const onKeyUp = (e: React.KeyboardEvent) => {
    if(e.key === "Tab"){
      setTag({ ...tag, type: tag.type === "common" ? "char" : (tag.type === "char" ? "special" : "common") })
    }else{
      setTag({ ...tag, name: (e.target as HTMLInputElement).value })
    }
  }

  const toggleTagType = () => setTag({ ...tag, type: tag.type === "common" ? "char" : (tag.type === "char" ? "special" : "common") })

  return (
    <div className='modal update_tag_modal'>
      <div className="modal_background"></div>
      <div className="modal_box">
        <div className="modal_box_content">
          <p className="message">{type === "update" ? "Updating"  : "Removing"} all instances of <span style={{ backgroundColor: getBackgroundColor(initialTag.type) }} className='tag'>{initialTag.name}</span> in {initialTag.numberOfOccurence} image(s)</p>
          {
            type === "update" &&
            <div className="update_tag">
              <input type="text" id="tag_input" defaultValue={tag.name} onKeyUp={onKeyUp} placeholder='Rename to'/>
              <div style={{ backgroundColor: getBackgroundColor(tag.type) }} className="tag_type" onClick={toggleTagType}>
                {tag.type}
              </div>
            </div>
          }
          <div className="error_text">{errorText}</div>
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

export default UpdateTagModal;
