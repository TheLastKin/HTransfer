import React from 'react';
import '../componentCss/update_history.css'
import { UpdateHistoryProps } from 'renderer/constant/types';

const UpdateHistory = ({ name, path, status }: UpdateHistoryProps) => {

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
      <div style={{ backgroundColor: status === "Updated" ? "rgb(84, 223, 84)" : "rgb(85, 118, 190)" }} className="update_status">{status}</div>
      <div className="updated_image">{name}</div>
    </div>
  );
};

export default UpdateHistory;
