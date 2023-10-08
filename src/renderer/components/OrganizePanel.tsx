import React, { useState } from 'react';
import { Chapter, Tag, UpdateHistoryProps } from 'renderer/constant/types';
import UpdateHistory from './UpdateHistory';
import ChapterView from './ChapterView';
import '../componentCss/organize_panel.css';
import TagView from './TagView';

type OrganizePanelProps = {
  tags: Tag[];
  chapter: Chapter,
  updateHistory: UpdateHistoryProps[];
  addType: string,
  currentSource: string,
  onTagListChanged: (args: any) => void;
  onChapterSelected: (index: number) => void;
  onChapterAction: (isAddingImage: boolean) => void;
  onViewingChapter: (chapter: Chapter) => void;
  onQuickMatch: () => void;
  onQuickExtract: () => void;
  onUndoUpdate: () => void;
  clearHistory: () => void;
};

function OrganizePanel({
  tags,
  chapter,
  updateHistory,
  addType,
  currentSource,
  onTagListChanged,
  onChapterSelected,
  onChapterAction,
  onViewingChapter,
  onQuickMatch,
  onQuickExtract,
  onUndoUpdate,
  clearHistory,
}: OrganizePanelProps) {

  return (
    <div className="organize_panel">
      <div className="organize_panel_content">
        <TagView
          tags={tags}
          addType={addType}
          updateHistory={updateHistory}
          onTagListChanged={onTagListChanged}
          onQuickMatch={onQuickMatch}
          clearHistory={clearHistory}
          onQuickExtract={onQuickExtract}
          onUndoUpdate={onUndoUpdate}
        />
        <div className="horizontal_divider" />
        <ChapterView
          currentSource={currentSource}
          chapter={chapter}
          addType={addType}
          onChapterSelected={onChapterSelected}
          onChapterAction={onChapterAction}
          onViewingChapter={onViewingChapter}
        />
      </div>
    </div>
  );
}

export default OrganizePanel;
