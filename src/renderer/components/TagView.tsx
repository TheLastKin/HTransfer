import React, { useState, useMemo } from 'react';
import { Tag, UpdateHistoryProps } from 'renderer/constant/types';
import UpdateHistory from './UpdateHistory';

type TagViewProps = {
  tags: Tag[];
  updateHistory: UpdateHistoryProps[];
  actionType: string;
  onTagListChanged: (args: any) => void;
};

const activeColor = 'rgb(122, 245, 122)';

const commonTagColor = 'rgb(85, 118, 190)';
const charTagColor = 'rgb(181, 184, 6)';
const specialTagColor = 'rgb(221, 34, 50)';

function TagView({
  tags,
  actionType,
  updateHistory,
  onTagListChanged,
}: TagViewProps) {
  const [tagType, setTagType] = useState<string>("common")
  const tagColor = useMemo(() => (tagType === "common" ? commonTagColor : (tagType === "char" ? charTagColor : specialTagColor )), [tagType])

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
      const tagName = (e.target as HTMLInputElement).value;
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
    }
  };
  return (
    <div>
      <div className="add_tags">
        <input type="text" id="add_tag_input" onKeyDown={onTagMade} />
        <div style={{ backgroundColor: tagColor, borderColor: tagColor }} className="tag_type" onClick={toggleTagType}>
          {tagType}
        </div>
      </div>
      <div className="tags">
        <span>Type on the input to make a tag!</span>
      </div>
      <div
        style={{ borderColor: actionType === 'addTag' ? activeColor : 'white' }}
        className="tag_update_record"
      >
        {updateHistory.length === 0 ? (
          <div className="empty_record">
            <span
              style={{ color: actionType === 'addTag' ? activeColor : 'white' }}
            >
              Right click on images to add tags
              <br />
              (hold Ctrl and hover on images to quick add)
            </span>
          </div>
        ) : (
          updateHistory.map((history) => <UpdateHistory {...history} />)
        )}
      </div>
    </div>
  );
}

export default TagView;
