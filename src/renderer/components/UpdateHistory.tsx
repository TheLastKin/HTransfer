import React from 'react';
import '../componentCss/update_history.css'
import { UpdateHistoryProps } from 'renderer/constant/types';

const UpdateHistory = ({ name, path, status }: UpdateHistoryProps) => {

  const onMouseEnter = (path: string) => (e: React.MouseEvent) => {
    const imgCard = document.querySelector(`.image_card[data-path="${path.replace(/\\/g, "\\\\")}"]`) as HTMLElement;
    if(imgCard){
      imgCard.style.borderColor = "rgb(97, 97, 248)"
      imgCard.style.boxShadow = "0 0 5px 1px rgba(75, 75, 243)"
    }
  }

  const onMouseLeave = (path: string) => (e: React.MouseEvent) => {
    const imgCard = document.querySelector(`.image_card[data-path="${path.replace(/\\/g, "\\\\")}"]`) as HTMLElement;
    if(imgCard){
      imgCard.style.borderColor = ""
      imgCard.style.boxShadow = ""
    }
  }

  return (
    <div className='update_history' onMouseEnter={onMouseEnter(path)} onMouseLeave={onMouseLeave(path)}>
      <div style={{ backgroundColor: status === "Updated" ? "rgb(85, 118, 190)" : "rgb(192 201 65)" }} className="update_status">{status}</div>
      <div className="updated_image">{name}</div>
    </div>
  );
};

export default UpdateHistory;
