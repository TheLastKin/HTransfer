import React from 'react';
import '../componentCss/update_history.css'
import { UpdateHistoryProps } from 'renderer/constant/types';

const UpdateHistory = ({ name, path, tags }: UpdateHistoryProps) => {

  const onMouseEnter = (path: string) => (e: React.MouseEvent) => {
    const imgCard = document.querySelector(`.image_card[data-path="${path.replace(/\\/g, "\\\\")}"]`) as HTMLElement;
    if(imgCard){
      imgCard.className = "image_card image_card_highlight"
    }
  }

  const onMouseLeave = (path: string) => (e: React.MouseEvent) => {
    const imgCard = document.querySelector(`.image_card[data-path="${path.replace(/\\/g, "\\\\")}"]`) as HTMLElement;
    if(imgCard){
      imgCard.className = "image_card"
    }
  }

  return (
    <div className='update_history' onMouseEnter={onMouseEnter(path)} onMouseLeave={onMouseLeave(path)}>
      <div className="update_status">Updated</div>
      <div className="updated_image">{name}</div>
    </div>
  );
};

export default UpdateHistory;
