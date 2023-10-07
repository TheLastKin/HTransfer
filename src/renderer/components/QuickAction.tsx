import React from 'react';
import '../componentCss/quick_action.css'
import { MdModeEditOutline } from 'react-icons/md'
import { FaRegQuestionCircle } from 'react-icons/fa'

type QuickActionProps = {
  onQuickAction: () => void,
  action: string,
  tooltipText: string
}

const QuickAction = ({ action, tooltipText, onQuickAction }: QuickActionProps) => {

  return (
    <div className='quick_action'>
        <div className="quick_action_button" onClick={onQuickAction}>
          <MdModeEditOutline className='edit_icon'/>
          <span>{action}</span>
        </div>
        <div className="tooltip">
          <FaRegQuestionCircle className='question_icon'/>
          <div className="tooltip_text">
            {tooltipText}
          </div>
        </div>
    </div>
  );
};

export default QuickAction;
