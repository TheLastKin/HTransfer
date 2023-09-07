import React from 'react';
import '../componentCss/info_panel.css'
import { ImageInfo } from 'renderer/constant/types';

type InfoPanelProps = {
  info: ImageInfo,
  onPanelClosed: () => void
}

const commonTagColor = 'rgb(85, 118, 190)';
const charTagColor = 'rgb(181, 184, 6)';
const specialTagColor = 'rgb(221, 34, 50)';

const InfoPanel = ({ info, onPanelClosed }: InfoPanelProps) => {
  return (
    <div className='info_panel'>
      <div className="close_info_panel" onClick={onPanelClosed}>
        X
      </div>
      <div className="info_name">{info.name}</div>
      <div className="info_dimensions">Dimensions: {info.width}x{info.height} (in pixel)</div>
      <div className="info_path">Path: {info.path}</div>
      <div className="info_created_date">Created: {new Date(info.createdDate || Date.now()).toLocaleString()}</div>
      <div className="info_last_modified">Last Modified: {new Date((info.lastModifiedDate || info.createdDate) || Date.now()).toLocaleString()}</div>
      <div className="info_chapters">
        <div className="heading">Chapters: </div>
        <div className="info_chapter_list"></div>
      </div>
      <div className="info_tags">
        <div className='heading'>Tag:</div>
        <div className="info_tag_list">
          {
            info.tags?.map(tag => (
              <div style={{ backgroundColor: tag.type === "common" ? commonTagColor : (tag.type === "char" ? charTagColor : specialTagColor)}} className="info_tag">{tag.name}</div>
            ))
          }
        </div>
        </div>
    </div>
  );
};

export default InfoPanel;
