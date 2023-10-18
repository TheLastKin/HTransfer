import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Tag, UpdateHistoryProps, actions, charTagColor, commonTagColor, specialTagColor } from 'renderer/constant/types';
import '../componentCss/tag_view.css'
import UpdateHistory from './UpdateHistory';
import { MdModeEditOutline } from 'react-icons/md'
import { FaRegQuestionCircle } from 'react-icons/fa'
import { ModalContext } from 'renderer/constant/context';
import { PiArrowsClockwiseFill } from 'react-icons/pi'
import QuickAction from './QuickAction';

type TagViewProps = {
  tags: Tag[];
  updateHistory: UpdateHistoryProps[];
  addType: string,
  onTagListChanged: (args: any) => void;
  onQuickMatch: () => void;
  onQuickExtract: () => void;
  onUndoUpdate: () => void;
  clearHistory: () => void
};

const activeColor = 'rgb(122, 245, 122)';
const quickActions = [{
  type: "Match SD",
  tooltip: "Quick update action: match the current tags with stable diffusion prompt if available (case insensitive, unmatch tags are ignored)"
}, {
  type: "Extract SD",
  tooltip: "Quick update action: extract as common tags from stable diffusion prompt if available (case insensitive, filter out by current tags (lora, masterpiece, best quality or paragraph-like prompt will be filtered by default))"
}, {
  type: "Undo",
  tooltip: "Undo all updates in the history list"
}]

function TagView({
  tags,
  updateHistory,
  addType,
  onTagListChanged,
  onQuickMatch,
  onQuickExtract,
  onUndoUpdate,
  clearHistory
}: TagViewProps) {
  const [tagType, setTagType] = useState<string>("common")
  const tagColor = useMemo(() => (tagType === "common" ? commonTagColor : (tagType === "char" ? charTagColor : specialTagColor )), [tagType])

  useEffect(() => {
    const clearView = document.querySelector(".clear") as HTMLElement;
    if(updateHistory.length > 0){
      clearView.style.display = "flex"
      setTimeout(() => {
        const lastView = document.querySelector(".update_history:last-child");
        if(lastView){
          lastView.scrollIntoView()
        }
      }, 200)
    }else{
      clearView.style.display = "none"
    }
  }, [updateHistory])

  const toggleTagType = () => {
    setTagType(tagType === "common" ? "char" : (tagType === "char" ? "special" : "common"))
  };

  const onTagMade = (e: React.KeyboardEvent) => {
    if(e.code === "Tab"){
      toggleTagType();
      e.preventDefault()
    }
    if(e.code === "Delete"){
      (e.target as HTMLInputElement).value = ""
      e.preventDefault()
    }
    if (e.code === 'Enter') {
      const tagName = (e.target as HTMLInputElement).value.toLowerCase();
      if (tagName.length < 3 || tags.find((t) => t.name === tagName)) return;
      const tag = document.createElement('div');
      const container = document.querySelector('.tags') as HTMLElement;
      if (container.firstChild?.nodeName === 'SPAN') {
        container.style.alignItems = 'initial';
        container.style.justifyContent = 'initial';
        container.removeChild(container.firstChild);
      }
      tag.className = `${tagType}_tag`;
      tag.innerText = tagName;
      container.appendChild(tag);
      onTagListChanged(tags.concat({ name: tagName, type: tagType }));
      tag.onclick = () => {
        container.removeChild(tag);
        onTagListChanged(tags.filter((t) => t.name !== tagName));
      };
      (e.target as HTMLInputElement).value = ""
    }
  };

  const handleQuickAction = (type: string) => () => {
    if(type === "Match SD"){
      onQuickMatch()
    }
    if(type === "Extract SD"){
      onQuickExtract()
    }
    if(type === "Undo"){
      onUndoUpdate()
    }
  }

  return (
    <div>
      <div className="add_tags">
        <input type="text" id="add_tag_input" placeholder='Press Tab to change type' onKeyDown={onTagMade} />
        <div style={{ backgroundColor: tagColor }} className="tag_type" onClick={toggleTagType}>
          {tagType}
        </div>
      </div>
      <div className="tag_actions">
        {
          quickActions.map(action => (
            <QuickAction action={action.type} tooltipText={action.tooltip} onQuickAction={handleQuickAction(action.type)}/>
          ))
        }
      </div>
      <div className="tags">
        <span>Type on the input to make a tag!</span>
      </div>
      <div
        style={{ borderColor: addType === actions.ADD_TAG ? activeColor : 'white' }}
        className="tag_update_record"
      >
        <div className="processing">
          <PiArrowsClockwiseFill/>
          <span>Processing (0)</span>
        </div>
        <div className="clear" onClick={clearHistory}>
          clear
        </div>
        {updateHistory.length === 0 ? (
          <div className="empty_record">
            <span
              style={{ color: addType === actions.ADD_TAG ? activeColor : 'white' }}
            >
              Right click on images to add tags
              <br />
              (hold Ctrl and hover on images to quick add)
            </span>
          </div>
        ) : (
          <div className="update_records">
            {updateHistory.map((history, index) => <UpdateHistory name={`${index+1}.${history.name}`} path={history.path} tags={history.tags} status={history.status} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default TagView;
