import React, { useState } from 'react';
import { Chapter, Tag, UpdateHistoryProps } from 'renderer/constant/types';
import UpdateHistory from './UpdateHistory';
import ChapterView from './ChapterView';
import '../componentCss/organize_panel.css';
import TagView from './TagView';

type OrganizePanelProps = {
  tags: Tag[];
  chapter: Chapter,
  chapters: Chapter[];
  updateHistory: UpdateHistoryProps[];
  addType: string,
  onTagListChanged: (args: any) => void;
  onChapterInput: (args: any) => void;
  onChapterSelected: (arg: Chapter) => void;
  onChapterAction: (isAddingImage: boolean) => void;
  onViewingChapter: (chapter: Chapter) => void;
  onDeletingChapterImage: (imageIndex: number) => void;
  onChangingImageIndex: (fromIndex: number, toIndex: number) => void;
  onDeletingChapter: (chapterName: string) => void;
  onQuickMatch: () => void;
  clearHistory: () => void;
};

function OrganizePanel({
  tags,
  chapter,
  chapters,
  updateHistory,
  addType,
  onTagListChanged,
  onChapterInput,
  onChapterSelected,
  onChapterAction,
  onViewingChapter,
  onDeletingChapterImage,
  onChangingImageIndex,
  onDeletingChapter,
  onQuickMatch,
  clearHistory
}: OrganizePanelProps) {

  return (
    <div className="organize_panel">
      <div className="organize_panel_content">
        <TagView tags={tags} addType={addType} updateHistory={updateHistory} onTagListChanged={onTagListChanged} onQuickMatch={onQuickMatch} clearHistory={clearHistory}/>
        <div className="horizontal_divider" />
        <ChapterView
          chapter={chapter}
          chapters={chapters}
          addType={addType}
          onChapterSelected={onChapterSelected}
          onChapterInput={onChapterInput}
          onChapterAction={onChapterAction}
          onViewingChapter={onViewingChapter}
          onDeletingChapterImage={onDeletingChapterImage}
          onChangingImageIndex={onChangingImageIndex}
          onDeletingChapter={onDeletingChapter}
        />
      </div>
    </div>
  );
}

export default OrganizePanel;
