import React, { useEffect } from 'react';

type ChapterContextMenuProps = {
  onShowingImages: () => void,
  onRenamingChapter: () => void,
  onDeletingChapter: () => void
}

const ChapterContextMenu = ({ onShowingImages, onRenamingChapter, onDeletingChapter }: ChapterContextMenuProps) => {

  useEffect(() => {
    const view = document.querySelector(".chapter_menu") as HTMLElement;
    (document.querySelector(".content") as HTMLElement).appendChild(view);
  }, [])

  return (
    <div className="chapter_menu">
      <ul>
        <li onClick={onShowingImages}>Show images</li>
        <li onClick={onRenamingChapter}>Rename</li>
        <li onClick={onDeletingChapter}>Delete</li>
      </ul>
    </div>
  );
}

export default ChapterContextMenu;
