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
  actionType: string;
  onTagListChanged: (args: any) => void;
  onChapterInput: (args: any) => void;
  onChapterSelected: (arg: Chapter) => void;
  onChapterAction: (isAddingImage: boolean) => void;
  onViewingChapter: (chapter: Chapter) => void;
  onDeletingChapterImage: (imageIndex: number) => void;
};

function OrganizePanel({
  tags,
  chapter,
  chapters,
  updateHistory,
  actionType,
  onTagListChanged,
  onChapterInput,
  onChapterSelected,
  onChapterAction,
  onViewingChapter,
  onDeletingChapterImage
}: OrganizePanelProps) {

  return (
    <div className="organize_view">
      <TagView tags={tags} updateHistory={updateHistory} actionType={actionType} onTagListChanged={onTagListChanged}/>
      <div className="horizontal_divider" />
      <ChapterView
        chapter={chapter}
        chapters={chapters}
        actionType={actionType}
        onChapterSelected={onChapterSelected}
        onChapterInput={onChapterInput}
        onChapterAction={onChapterAction}
        onViewingChapter={onViewingChapter}
        onDeletingChapterImage={onDeletingChapterImage}
      />
    </div>
  );
}

export default OrganizePanel;
