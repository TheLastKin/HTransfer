import React from 'react';
import '../componentCss/update_history.css'
import { UpdateHistoryProps } from 'renderer/constant/types';

const UpdateHistory = ({ name, path }: UpdateHistoryProps) => {

  const onMouseEnter = (path: string) => (e: React.MouseEvent) => {
    const imgCard = document.querySelector(`.img_card[data-path="${path.replace(/\\/g, "\\\\")}"]`) as HTMLElement;
    if(imgCard){
      imgCard.style.borderColor = "blue"
      imgCard.style.boxShadow = "0 0 5px 1px rgba(0, 0, 255, 0.65)"
    }
  }

  const onMouseLeave = (path: string) => (e: React.MouseEvent) => {
    const imgCard = document.querySelector(`.img_card[data-path="${path.replace(/\\/g, "\\\\")}"]`) as HTMLElement;
    if(imgCard){
      imgCard.style.borderColor = ""
      imgCard.style.boxShadow = ""
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
